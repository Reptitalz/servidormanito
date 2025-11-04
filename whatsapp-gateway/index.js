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
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { URL } from 'url';

// === CONFIGURACIÓN ===
const NEXTJS_APP_URL = process.env.NEXTJS_APP_URL || "https://heymanito.com";
const NEXTJS_WEBHOOK_URL = `${NEXTJS_APP_URL}/api/webhook`;
const SESSION_BASE_PATH = path.join(os.tmpdir(), 'wa-sessions');
const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });

// Mapa para gestionar las instancias de los bots
const activeBots = new Map();
let db = null; // Firestore se inicializa después

// ======== SERVIDOR HTTP PRIMERO ========
// Cloud Run requiere que el contenedor escuche rápido.
const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const assistantId = requestUrl.searchParams.get('assistantId');

  if (requestUrl.pathname === '/status') {
    const botState = activeBots.get(assistantId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: botState ? botState.status : 'not_found' }));
  } else if (requestUrl.pathname === '/qr') {
    const botState = activeBots.get(assistantId);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ qr: botState ? botState.qr : null }));
  } else if (requestUrl.pathname === '/' || requestUrl.pathname === '/_health' || requestUrl.pathname === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Hey Manito! Gateway - OK');
  } else {
    res.writeHead(404);
    res.end();
  }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  logger.info(`🚀 Servidor HTTP activo en puerto ${PORT}`);
  // Inicializa Firebase y bots en segundo plano
  initializeBackend();
});

// ======== INICIALIZACIÓN BACKEND ========

async function initializeBackend() {
  const firebaseReady = await initializeFirebaseAdmin();
  if (!firebaseReady) {
    logger.error("❌ No se pudo inicializar Firebase Admin. Continuando sin Firestore...");
    return;
  }

  logger.info("✅ Firebase listo. Iniciando sincronización de bots...");
  syncBotsWithFirestore();
}

/**
 * Inicializa Firebase Admin y Firestore
 */
async function initializeFirebaseAdmin() {
  try {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) throw new Error("FIREBASE_SERVICE_ACCOUNT_KEY no está definida.");
    const serviceAccount = JSON.parse(key);
    initializeApp({ credential: cert(serviceAccount) });
    db = getFirestore();
    logger.info("✅ Conexión con Firebase Admin establecida.");
    return true;
  } catch (e) {
    logger.error("❌ Error al inicializar Firebase:", e.message);
    return false;
  }
}

// ======== LÓGICA DE BOTS (sin cambios mayores) ========

async function createBotInstance(assistantId) {
  if (activeBots.has(assistantId)) {
    logger.warn(`El bot para ${assistantId} ya está en ejecución.`);
    return;
  }

  const sessionPath = path.join(SESSION_BASE_PATH, assistantId);
  await fsp.mkdir(sessionPath, { recursive: true });

  const botState = {
    status: 'disconnected',
    qr: null,
    sock: null,
    reconnectAttempts: 0
  };
  activeBots.set(assistantId, botState);

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    logger,
    browser: ['Hey Manito!', 'Cloud Run', '3.0']
  });

  botState.sock = sock;

  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;
    const current = activeBots.get(assistantId);

    if (qr) {
      current.status = 'qr';
      current.qr = qr;
      logger.warn(`📲 [${assistantId}] QR disponible`);
    }

    if (connection === 'close') {
      const reason = (lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = reason !== DisconnectReason.loggedOut;

      current.qr = null;
      if (shouldReconnect) {
        current.status = 'error';
        logger.warn(`[${assistantId}] Reintentando conexión...`);
        setTimeout(() => createBotInstance(assistantId), 5000 * ++current.reconnectAttempts);
      } else {
        current.status = 'disconnected';
        await fsp.rm(sessionPath, { recursive: true, force: true });
        activeBots.delete(assistantId);
        logger.warn(`[${assistantId}] Sesión eliminada permanentemente.`);
      }
    } else if (connection === 'open') {
      current.status = 'connected';
      current.qr = null;
      current.reconnectAttempts = 0;
      logger.info(`✅ [${assistantId}] Conexión establecida`);
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
      formData.append('assistantId', assistantId);

      if (type === 'conversation')
        formData.append('message', msg.message.conversation);
      else if (type === 'extendedTextMessage')
        formData.append('message', msg.message.extendedTextMessage.text);
      else if (type === 'audioMessage') {
        const audioBuffer = await sock.downloadMediaMessage(msg);
        const tempPath = path.join(os.tmpdir(), `temp_${Date.now()}.ogg`);
        await fsp.writeFile(tempPath, audioBuffer);
        formData.append('audio', fs.createReadStream(tempPath));
      } else return;

      await sock.sendPresenceUpdate('composing', sender);
      const response = await axios.post(NEXTJS_WEBHOOK_URL, formData, { headers: formData.getHeaders() });
      const { replyText, replyAudio } = response.data || {};

      if (replyText) await sock.sendMessage(sender, { text: replyText });
      if (replyAudio) {
        const audioData = Buffer.from(replyAudio.split(';base64,').pop(), 'base64');
        await sock.sendMessage(sender, { audio: audioData, mimetype: 'audio/wav' });
      }

      await sock.sendPresenceUpdate('paused', sender);
    } catch (err) {
      logger.error(`[${assistantId}] Error procesando mensaje: ${err.message}`);
      await sock.sendMessage(sender, { text: 'Ocurrió un error al procesar tu mensaje.' });
    }
  });
}

/**
 * Escucha cambios en Firestore y sincroniza bots.
 */
function syncBotsWithFirestore() {
  if (!db) {
    logger.error("⚠️ Firestore no disponible, reintentando en 5s...");
    setTimeout(syncBotsWithFirestore, 5000);
    return;
  }

  db.collectionGroup('assistants').onSnapshot(
    (snapshot) => {
      const firestoreAssistants = new Set(snapshot.docs.map((d) => d.id));
      // iniciar nuevos
      for (const id of firestoreAssistants) {
        if (!activeBots.has(id)) createBotInstance(id).catch(e => logger.error(`Error creando bot ${id}: ${e.message}`));
      }
      // detener eliminados
      for (const id of activeBots.keys()) {
        if (!firestoreAssistants.has(id)) {
          stopBotInstance(id).catch(e => logger.error(`Error deteniendo bot ${id}: ${e.message}`));
        }
      }
    },
    (err) => logger.error("❌ Error escuchando cambios Firestore:", err)
  );
}

async function stopBotInstance(assistantId) {
  if (!activeBots.has(assistantId)) return;
  const bot = activeBots.get(assistantId);
  logger.warn(`Deteniendo bot ${assistantId}`);
  if (bot.sock) await bot.sock.logout();
  const sessionPath = path.join(SESSION_BASE_PATH, assistantId);
  await fsp.rm(sessionPath, { recursive: true, force: true });
  activeBots.delete(assistantId);
}

process.on('unhandledRejection', (r) => logger.error('Unhandled Rejection:', r));
process.on('uncaughtException', (e) => logger.error('Uncaught Exception:', e));
