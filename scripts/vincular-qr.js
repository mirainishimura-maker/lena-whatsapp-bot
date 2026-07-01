// Genera un QR FRESCO para vincular la instancia de Lena y lo guarda como PNG
// grande, luego lo abre en el visor de imágenes de Windows para escanearlo
// con el celular. Alternativa al pairing code (que se vence muy rápido).
//
// Uso:  node scripts/vincular-qr.js
//
// En el celular: WhatsApp → Dispositivos vinculados → Vincular un dispositivo
// → apunta la cámara al QR que aparece en pantalla. (El QR dura ~20-30s;
// si se vence, vuelve a correr el script.)

require("dotenv").config();
const axios = require("axios");
const fs = require("fs");
const { execFile } = require("child_process");

const API_URL = (process.env.EVOLUTION_API_URL || "").replace(/\/+$/, "");
const API_KEY = process.env.EVOLUTION_API_KEY;
const INSTANCE = process.env.EVOLUTION_INSTANCE || "lena";
const headers = { apikey: API_KEY };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = "C:/projects/lena-whatsapp-bot/qr-lena.png";

(async () => {
  // 1. Logout para arrancar un QR limpio (queda en 'close')
  try {
    await axios.delete(`${API_URL}/instance/logout/${INSTANCE}`, { headers });
    await sleep(3500);
  } catch (e) {
    /* si ya estaba close, seguimos */
  }

  // 2. Pedir el QR (connect SIN number => devuelve base64 del QR)
  let data;
  try {
    const r = await axios.get(`${API_URL}/instance/connect/${INSTANCE}`, {
      headers,
    });
    data = r.data;
  } catch (e) {
    console.error("ERR connect:", e.response?.status, e.message);
    process.exit(1);
  }

  const b64 = data?.base64 || data?.qrcode?.base64;
  if (!b64) {
    console.error("No vino el QR en la respuesta:", JSON.stringify(data).slice(0, 200));
    process.exit(1);
  }

  // 3. Guardar como PNG
  const clean = b64.replace(/^data:image\/png;base64,/, "");
  fs.writeFileSync(OUT, Buffer.from(clean, "base64"));
  console.log("QR guardado en:", OUT);
  console.log("Escanéalo YA con el celular (dura ~20-30s).");

  // 4. Abrir en el visor de imágenes por defecto de Windows
  execFile("cmd", ["/c", "start", "", OUT], (err) => {
    if (err) console.log("(abre manualmente el archivo:", OUT, ")");
  });
})();
