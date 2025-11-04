
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

// === INICIALIZACIÓN DE FIREBASE ADMIN ===
try {
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccountKey) {
        throw new Error("La variable de entorno FIREBASE_SERVICE_ACCOUNT_KEY no está definida. El gateway no puede funcionar sin acceso a Firestore.");
    }
    const serviceAccount = JSON.parse(serviceAccountKey);
    initializeApp({
        credential: cert(serviceAccount),
    });
    console.log("✅ Conexión con Firebase Admin establecida.");
} catch (e) {
    console.error("❌ Error Crítico: No se pudo inicializar Firebase Admin. ", e.message);
    process.exit(1); // Detiene el proceso si no puede conectar a Firebase
}

const db = getFirestore();
const logger = pino({ level: 'warn', transport: { target: 'pino-pretty' } });

// Mapa para gestionar las instancias de los bots
const activeBots = new Map();

/**
 * Crea y gestiona una instancia de un bot de WhatsApp.
 * @param {string} assistantId - El ID del asistente de Firestore.
 */
async function createBotInstance(assistantId) {
    if (activeBots.has(assistantId)) {
        logger.warn(`El bot para el asistente ${assistantId} ya está en ejecución.`);
        return;
    }

    const sessionPath = path.join(SESSION_BASE_PATH, assistantId);
    await fsp.mkdir(sessionPath, { recursive: true });
    
    const botState = {
        status: 'disconnected', // disconnected, qr, connected, error
        qr: null,
        sock: null,
        reconnectAttempts: 0
    };
    activeBots.set(assistantId, botState);
    logger.info(`Iniciando nueva instancia de bot para el asistente: ${assistantId}`);

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
        const currentBotState = activeBots.get(assistantId);

        if (qr) {
            currentBotState.status = 'qr';
            currentBotState.qr = qr;
            logger.warn(`❗️ [${assistantId}] Se necesita escanear QR.`);
        }

        if (connection === 'close') {
            const reason = (lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = reason !== DisconnectReason.loggedOut;
            
            currentBotState.qr = null; // Limpiar QR al cerrar conexión

            if (shouldReconnect) {
                currentBotState.status = 'error';
                logger.error(`[${assistantId}] Conexión cerrada por error. Reintentando...`);
                // Aquí podrías implementar una lógica de backoff exponencial si es necesario
                setTimeout(() => connect(), 5000 * ++currentBotState.reconnectAttempts);
            } else {
                currentBotState.status = 'disconnected';
                logger.warn(`[${assistantId}] Conexión cerrada permanentemente (Logged Out). Limpiando sesión.`);
                await fsp.rm(sessionPath, { recursive: true, force: true });
                // El bot se re-iniciará si el documento de firestore todavía existe
            }
        } else if (connection === 'open') {
            currentBotState.status = 'connected';
            currentBotState.qr = null;
            currentBotState.reconnectAttempts = 0; // Resetear intentos al conectar
            logger.info(`✅ [${assistantId}] Conexión establecida.`);
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
            formData.append('assistantId', assistantId); // Enviar el ID del asistente al webhook

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
            const response = await axios.post(NEXTJS_WEBHOOK_URL, formData, { headers: formData.getHeaders() });

            const { replyText, replyAudio } = response.data || {};
            if (replyText) await sock.sendMessage(sender, { text: replyText });
            if (replyAudio) {
                const audioData = Buffer.from(replyAudio.split(';base64,').pop(), 'base64');
                await sock.sendMessage(sender, { audio: audioData, mimetype: 'audio/wav' });
            }
            await sock.sendPresenceUpdate('paused', sender);
        } catch (err) {
            logger.error(`[${assistantId}] Error procesando mensaje:`, err.message);
            await sock.sendMessage(sender, { text: 'Ocurrió un error al procesar tu mensaje.' });
        }
    });

    function connect() {
        // Esta función podría contener la lógica para reconectar, pero Baileys ya lo maneja internamente.
        // La dejamos como placeholder si se necesita lógica más compleja.
    }

    return sock;
}

/**
 * Cierra la conexión de un bot y limpia sus recursos.
 * @param {string} assistantId - El ID del asistente a detener.
 */
async function stopBotInstance(assistantId) {
    if (activeBots.has(assistantId)) {
        const botState = activeBots.get(assistantId);
        logger.warn(`Deteniendo instancia de bot para el asistente: ${assistantId}`);
        
        if (botState.sock) {
            await botState.sock.logout();
        }

        const sessionPath = path.join(SESSION_BASE_PATH, assistantId);
        await fsp.rm(sessionPath, { recursive: true, force: true });
        
        activeBots.delete(assistantId);
        logger.info(`Instancia y sesión para ${assistantId} eliminadas.`);
    }
}

/**
 * Sincroniza las instancias de bots con los documentos de Firestore.
 */
function syncBotsWithFirestore() {
    db.collectionGroup('assistants').onSnapshot(
        (snapshot) => {
            const firestoreAssistants = new Set();
            snapshot.docs.forEach((doc) => {
                firestoreAssistants.add(doc.id);
            });

            // Iniciar bots para nuevos asistentes
            for (const assistantId of firestoreAssistants) {
                if (!activeBots.has(assistantId)) {
                    createBotInstance(assistantId).catch(err => {
                        logger.error(`Error al crear la instancia para ${assistantId}: ${err.message}`);
                    });
                }
            }

            // Detener bots para asistentes eliminados
            for (const assistantId of activeBots.keys()) {
                if (!firestoreAssistants.has(assistantId)) {
                    stopBotInstance(assistantId).catch(err => {
                         logger.error(`Error al detener la instancia para ${assistantId}: ${err.message}`);
                    });
                }
            }
        },
        (err) => {
            console.error("❌ Error Crítico: No se pudo escuchar los cambios de Firestore. ", err);
            process.exit(1);
        }
    );
}

// === Servidor HTTP para Cloud Run ===
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
    } else if (requestUrl.pathname === '/' || requestUrl.pathname === '/_health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('Hey Manito! Gateway - OK');
    } else {
        res.writeHead(404);
        res.end();
    }
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, async () => {
    // Iniciar la sincronización con Firestore
    syncBotsWithFirestore();
    logger.info(`🚀 Gateway escuchando en el puerto ${PORT} y sincronizando con Firestore...`);
});

process.on('unhandledRejection', (r) => logger.error('Unhandled Rejection:', r));
process.on('uncaughtException', (e) => logger.error('Uncaught Exception:', e));
