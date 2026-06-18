require("dotenv").config();
const { enviarMensaje } = require("../src/services/evolution");

const YAZMIN = process.env.ASISTENTE_PIURA;
const AYVI   = process.env.ASISTENTE_LIMA;

const ejemploNuevoLead = (sede) => `
🔔 *NUEVO LEAD — ÍTACA ${sede}*

📊 🔴 ALTO — cierre rápido probable

📱 WhatsApp: wa.me/51984000000
👤 Contacto: Mirai Nishimura Coronado
🎂 Edad: 27
💬 Motivo: ansiedad y estrés en el trabajo

📝 Contexto: [ALTO] — ansiedad y estrés en el trabajo

⏳ Eli está recopilando datos. Te avisaré cuando esté lista para coordinar.
`.trim();

const ejemploListoParaCoordinar = (sede) => `
✅ *LISTO PARA COORDINAR — ÍTACA ${sede}*

Mirai confirmó que quiere agendar y Eli ya recopiló sus datos.

📱 WhatsApp: wa.me/51984000000
👤 Contacto: Mirai Nishimura Coronado
🪪 DNI contacto: 71234567
🎂 Edad: 27
💬 Motivo: ansiedad y estrés en el trabajo

👉 *Siguiente paso:* envíale horarios disponibles y coordina el pago de S/50.
`.trim();

function mensajePresentacion(nombre, sede) {
  return `Hola ${nombre} 👋 Soy *Eli*, la asistente virtual de Ítaca Conversemos ${sede}.

Desde hoy te voy a escribir por este chat cada vez que llegue un lead calificado o esté listo para coordinar su cita. Para que veas cómo funciona, aquí un ejemplo real:

${ejemploNuevoLead(sede)}

Y cuando el lead da su DNI, recibirás esto:

${ejemploListoParaCoordinar(sede)}

¡Cualquier duda me dices! 🙌`;
}

async function main() {
  if (!YAZMIN || !AYVI) {
    console.error("[ERROR] Falta ASISTENTE_PIURA o ASISTENTE_LIMA en el .env");
    process.exit(1);
  }

  console.log(`Enviando mensaje a Yazmin (${YAZMIN})...`);
  await enviarMensaje(YAZMIN, mensajePresentacion("Yazmin", "PIURA"));
  console.log("✓ Yazmin notificada");

  await new Promise((r) => setTimeout(r, 2000));

  console.log(`Enviando mensaje a Ayvi (${AYVI})...`);
  await enviarMensaje(AYVI, mensajePresentacion("Ayvi", "LIMA"));
  console.log("✓ Ayvi notificada");

  console.log("\nListo. Los chats están abiertos.");
}

main().catch((err) => {
  console.error("[ERROR]", err.message);
  if (err.response) console.error(err.response.data);
  process.exit(1);
});
