
import fs from "fs";
import path from "path";
import { useMultiFileAuthState } from "@whiskeysockets/baileys";
import { Storage } from "@google-cloud/storage";

const storage = new Storage();
const bucket = storage.bucket(process.env.BUCKET_NAME);
const tmpDir = "/tmp/baileys_auth";
const credsFile = path.join(tmpDir, "creds.json");

/**
 * Descarga las credenciales desde Cloud Storage (si existen)
 */
async function downloadSession() {
  try {
    await fs.promises.mkdir(tmpDir, { recursive: true });
    const file = bucket.file("sessions/creds.json");
    const exists = (await file.exists())[0];
    if (exists) {
      await file.download({ destination: credsFile });
      console.log("✅ Sesión de Baileys descargada desde Cloud Storage");
    } else {
      console.log("⚠️ No se encontró sesión previa en Cloud Storage");
    }
  } catch (err) {
    console.error("Error al descargar la sesión:", err);
  }
}

/**
 * Sube las credenciales actualizadas a Cloud Storage
 */
async function uploadSession() {
  try {
    await bucket.upload(credsFile, {
      destination: "sessions/creds.json",
      resumable: false,
      metadata: { cacheControl: "no-cache" },
    });
    console.log("☁️ Sesión de Baileys subida a Cloud Storage");
  } catch (err) {
    console.error("Error al subir la sesión:", err);
  }
}

/**
 * Inicializa el estado de autenticación de Baileys con sincronización automática
 */
export async function getBaileysAuthState() {
  await downloadSession();

  const { state, saveCreds } = await useMultiFileAuthState(tmpDir);

  // Cada vez que se guardan credenciales, se suben al bucket
  const wrappedSaveCreds = async () => {
    await saveCreds();
    await uploadSession();
  };

  return { state, saveCreds: wrappedSaveCreds };
}
