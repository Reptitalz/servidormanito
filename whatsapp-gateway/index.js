
import express from "express";
import makeWASocket, { useMultiFileAuthState, DisconnectReason } from "@whiskeysockets/baileys";
import pino from "pino";
import fs from "fs";
import fsp from "fs/promises";
import cors from "cors";
import path from "path";
import axios from 'axios';
import FormData from 'form-data';
import os from 'os';

// === CONFIGURACIÓN ===
const NEXTJS_APP_URL = process.env.NEXTJS_APP_URL || "https://heymanito.com";
const NEXTJS_WEBHOOK_URL = `${NEXTJS_APP_URL}/api/webhook`;
const SESSIONS_DIR = path.join(process.cwd(), 'sessions'); // Usar directorio local para persistencia
const logger = pino({ level: 'info', transport: { target: 'pino-pretty' } });


const app = express();
app.use(cors()); // Permitir todas las peticiones CORS
app.use(express.json());

const sessions = {}; // guardará las conexiones por ID

async function createSession(assistantId) {
  const sessionPath = path.join(SESSIONS_DIR, assistantId);
  await fsp.mkdir(sessionPath, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false, // No imprimir en terminal, lo mandamos por API
    browser: ["HeyManito", "Desktop", "1.0.0"],
  });

  sessions[assistantId] = { sock, qr: null, status: "loading" };

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;
    const session = sessions[assistantId];
    if (!session) return;

    if (qr) {
      session.qr = qr;
      session.status = "qr";
      console.log(`[${assistantId}] QR generado`);
    }

    if (connection === "open") {
      session.status = "connected";
      console.log(`[${assistantId}] Conectado`);
    }

    if (connection === "close") {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log(`[${assistantId}] Dispositivo deslogueado, limpiando sesión.`);
        // Borra los archivos de sesión
        await fsp.rm(sessionPath, { recursive: true, force: true });
        delete sessions[assistantId]; // Elimina de memoria
      } else {
         session.status = "disconnected";
         console.log(`[${assistantId}] Desconectado, intentando reconectar...`);
         // La librería intentará reconectar automáticamente. 
         // Si falla, se necesitará un nuevo QR.
         createSession(assistantId).catch(err => console.error(`[${assistantId}] Error al recrear sesión:`, err));
      }
    }
  });

  sock.ev.on("creds.update", saveCreds);

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


  return sock;
}

// 🔹 Endpoint para obtener el estado
app.get("/status", async (req, res) => {
  const { assistantId } = req.query;
  if (!assistantId) return res.status(400).json({ error: "Falta assistantId" });

  const session = sessions[assistantId];
  if (!session || session.status === 'disconnected') {
    // Si no hay sesión o está desconectada, intenta crear una nueva
    try {
        await createSession(assistantId);
        // Responde que está inicializando, el frontend volverá a preguntar
        return res.json({ status: "initializing" });
    } catch(e) {
        console.error(`Error al crear sesión para ${assistantId}`, e);
        return res.status(500).json({ error: 'No se pudo crear la sesión' });
    }
  }

  res.json({ status: session.status });
});

// 🔹 Endpoint para obtener el QR
app.get("/qr", (req, res) => {
  const { assistantId } = req.query;
  if (!assistantId) return res.status(400).json({ error: "Falta assistantId" });

  const session = sessions[assistantId];
  if (!session) return res.status(404).json({ error: "Sesión no encontrada" });
  if (!session.qr) return res.status(404).json({ error: "QR no disponible" });

  res.json({ qr: session.qr });
});

// Endpoint de salud para Cloud Run
app.get("/", (req, res) => {
    res.status(200).send("Hey Manito! Gateway - OK");
});
app.get("/_health", (req, res) => {
    res.status(200).send("OK");
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en puerto ${PORT}`));
