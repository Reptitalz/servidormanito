
import { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import makeWASocket from '@whiskeysockets/baileys';
import pino from 'pino';
import axios from 'axios';
import fs from 'fs';
import fsp from 'fs/promises';
import FormData from 'form-data';
import os from 'os';
import path from 'path';
import http from 'http';

// === CONFIGURACIÓN ===
const NEXTJS_APP_URL = "https://heymanito.com";
const NEXTJS_WEBHOOK_URL = `${NEXTJS_APP_URL}/api/webhook`;
const SESSION_FILE_PATH = path.join(os.tmpdir(), 'wa-session');
// =====================

let gatewayStatus = 'disconnected'; // disconnected, qr, connected, error
let qrCode = null; // QR en memoria

// Configura el logger para ser menos verboso, mostrando solo logs a partir de 'warn' por defecto.
// Usaremos logger.info() explícitamente para los mensajes que sí queremos ver.
const logger = pino({
  level: 'warn', 
  transport: { target: 'pino-pretty' }
});

async function cleanSession() {
    try {
        await fsp.rm(SESSION_FILE_PATH, { recursive: true, force: true });
        // Este log es útil para depuración, pero se puede comentar si se desea un log aún más limpio.
        // logger.info('Sesión anterior eliminada para un inicio limpio.');
    } catch (e) {
        if (e.code !== 'ENOENT') { // ENOENT significa que el archivo no existía, lo cual está bien.
            logger.error('Error limpiando la sesión antigua:', e.message);
        }
    }
}

async function connectToWhatsApp() {
  try {
    const { state, saveCreds } = await useMultiFileAuthState(SESSION_FILE_PATH);

    const sock = makeWASocket({
      auth: state,
      printQRInTerminal: false,
      logger, // Pasamos el logger configurado a Baileys
      browser: ['Hey Manito!', 'Cloud Run', '2.0']
    });

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        gatewayStatus = 'qr';
        qrCode = qr;
        // Log específico para la generación de QR
        logger.warn('❗️ Un usuario necesita escanear el código QR para conectar.');
      }

      if (connection === 'close') {
        const reason = (lastDisconnect?.error)?.output?.statusCode;
        const shouldReconnect = reason !== DisconnectReason.loggedOut;
        
        gatewayStatus = shouldReconnect ? 'error' : 'disconnected';
        qrCode = null;

        if (shouldReconnect) {
          setTimeout(connectToWhatsApp, 3000);
        } else {
          await cleanSession();
          setTimeout(connectToWhatsApp, 3000);
        }
      } else if (connection === 'open') {
        gatewayStatus = 'connected';
        qrCode = null;
        // Log específico para la conexión exitosa
        logger.info('✅ Conexión con WhatsApp establecida con un usuario.');
      }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (m) => {
      const msg = m.messages[0];
      if (!msg.message || msg.key.fromMe) return;

      const sender = msg.key.remoteJid;
      
      try {
        const type = Object.keys(msg.message)[0];
        const formData = new FormData();
        formData.append('from', sender);

        if (type === 'conversation') {
          formData.append('message', msg.message.conversation);
        } else if (type === 'extendedTextMessage') {
          formData.append('message', msg.message.extendedTextMessage.text);
        } else if (type === 'audioMessage') {
          const audioBuffer = await sock.downloadMediaMessage(msg);
          const tempPath = path.join(os.tmpdir(), `temp_${Date.now()}.ogg`);
          await fsp.writeFile(tempPath, audioBuffer);
          formData.append('audio', fs.createReadStream(tempPath));
        } else {
          return;
        }

        await sock.sendPresenceUpdate('composing', sender);

        const response = await axios.post(NEXTJS_WEBHOOK_URL, formData, {
          headers: formData.getHeaders()
        });

        const { replyText, replyAudio } = response.data || {};
        if (replyText) {
          await sock.sendMessage(sender, { text: replyText });
        }

        if (replyAudio) {
          const audioData = Buffer.from(replyAudio.split(';base64,').pop(), 'base64');
          await sock.sendMessage(sender, { audio: audioData, mimetype: 'audio/wav' });
        }

        await sock.sendPresenceUpdate('paused', sender);
      } catch (err) {
        logger.error('Error procesando mensaje:', err.message);
        await sock.sendMessage(sender, { text: 'Ocurrió un error al procesar tu mensaje.' });
      }
    });

    return sock;
  } catch (err) {
    logger.error('❌ Error al iniciar WhatsApp:', err.message);
    gatewayStatus = 'error';
  }
}

// === Servidor HTTP para Cloud Run ===
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-control-allow-headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === '/status') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: gatewayStatus }));
  } else if (req.url === '/qr') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ qr: qrCode }));
  } else if (req.url === '/' || req.url === '/_health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('OK');
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, async () => {
  // Limpia la sesión al iniciar para asegurar un estado fresco
  await cleanSession();
  connectToWhatsApp();
});

process.on('unhandledRejection', (r) => logger.error('Unhandled Rejection:', r));
process.on('uncaughtException', (e) => logger.error('Uncaught Exception:', e));
