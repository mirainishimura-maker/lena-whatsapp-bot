const { obtenerLeadsEnFollowup, actualizarPasoFollowup, buscarMemoria } = require("./supabase");
const { enviarMensaje, enviarImagenUrl } = require("./evolution");
const { derivarLeadAAsistente } = require("./routing");

// Modo test: delays cortos (segundos) y verificación frecuente, para probar
// la secuencia completa en ~5 minutos en vez de 15 días.
// Activar con FOLLOWUP_TEST_MODE=true en el entorno.
const TEST_MODE = process.env.FOLLOWUP_TEST_MODE === "true";

// Modo demo: UN solo paso de texto a los 2 min, para validar end-to-end
// que el sistema dispara correctamente sin esperar la secuencia completa.
// Activar con FOLLOWUP_DEMO_MODE=true en el entorno.
const DEMO_MODE = process.env.FOLLOWUP_DEMO_MODE === "true";

const INTERVALO_MS = TEST_MODE
  ? 20 * 1000          // cada 20s en test
  : DEMO_MODE
    ? 30 * 1000        // cada 30s en demo
    : 15 * 60 * 1000;  // cada 15 min en producción

// Las imágenes se sirven desde /public/followup/ en el mismo servidor del bot.
// Solo necesitas configurar BOT_URL en .env (ej: https://eli.itacaconversemos.com)
function imgUrl(nombre) {
  const base = (process.env.BOT_URL || "").replace(/\/$/, "");
  return `${base}/followup/${nombre}`;
}

/**
 * Secuencia de recontacto de 8 pasos.
 * Cronología desde que el lead deja de responder:
 *   Paso 0 → +1h   (solo texto)
 *   Paso 1 → +3h   (solo texto)
 *   Paso 2 → +1d   (imagen 1)
 *   Paso 3 → +3d   (imagen 2)
 *   Paso 4 → +5d   (imagen 8)
 *   Paso 5 → +7d   (imagen 5)
 *   Paso 6 → +10d  (imagen 9)
 *   Paso 7 → +15d  (imagen 10)
 */
// En modo test, cada paso espera N segundos en vez de N horas
const HORA_MS = TEST_MODE ? 1000 : 60 * 60 * 1000;

const SECUENCIA_DEMO = [
  {
    delayMs: 2 * 60 * 1000, // 2 minutos
    imagen: null,
    texto: (nombre) =>
      `${nombre ? `Hola ${nombre} 🤗` : "Hola 🤗"} ¿Seguimos con tu consulta con el Dr. César? Cualquier duda que tengas, con gusto te oriento.`,
  },
];

// Re-contacto de ventas (solo texto). Cuando tengas imágenes de marca de Lena
// en /public/followup/, puedes volver a usar imagen: () => imgUrl("...").
const SECUENCIA = [
  {
    delayMs: 1 * HORA_MS,
    imagen: null,
    texto: (nombre) =>
      `${nombre ? `Hola ${nombre} 🤗` : "Hola 🤗"} Vi que estabas interesad@ en un procedimiento con el Dr. César. ¿Te quedó alguna duda o te ayudo a agendar tu consulta de evaluación?`,
  },
  {
    delayMs: 2 * HORA_MS,
    imagen: null,
    texto: () =>
      `El primer paso es muy sencillo: una consulta de evaluación con el doctor, donde revisa tu caso y te da el precio exacto. ¿Te gustaría que coordinemos una fecha? 🗓️`,
  },
  {
    delayMs: 21 * HORA_MS,
    imagen: null,
    texto: () =>
      `Hola 👋 Solo paso a recordarte que seguimos a tu disposición. Si quieres, te oriento sobre el procedimiento que te interesa y vemos una fecha para tu consulta con el Dr. César.`,
  },
  {
    delayMs: 48 * HORA_MS,
    imagen: null,
    texto: () =>
      `El Dr. César viaja entre Piura, Chiclayo y Lima, así que los cupos se llenan rápido. Si te animas, te aparto un espacio para tu consulta de evaluación. ¿Coordinamos?`,
  },
  {
    delayMs: 48 * HORA_MS,
    imagen: null,
    texto: () =>
      `Recuerda que en la consulta el doctor evalúa tu caso y te da el plan y el precio exacto, sin compromiso. ¿Te gustaría que te agende? 🗓️`,
  },
  {
    delayMs: 48 * HORA_MS,
    imagen: null,
    texto: () =>
      `Sigues a tiempo de reservar tu consulta con el Dr. César. ¿Quieres que veamos una fecha que te acomode?`,
  },
  {
    delayMs: 72 * HORA_MS,
    imagen: null,
    texto: () =>
      `Hace unos días nos escribiste interesad@ en un procedimiento. Esa decisión sigue siendo válida — cuando estés list@, aquí seguimos para ayudarte 🤗`,
  },
  {
    delayMs: 120 * HORA_MS,
    imagen: null,
    texto: () =>
      `Pasamos a saludarte una vez más 🤗 Si en algún momento quieres dar el paso, con responder este mensaje es suficiente y coordinamos tu consulta con el Dr. César.`,
  },
];

function primerNombre(nombreCompleto) {
  if (!nombreCompleto) return null;
  return nombreCompleto.split(" ")[0];
}

async function verificarYEnviarFollowups() {
  try {
    const leads = await obtenerLeadsEnFollowup();
    if (leads.length === 0) return;

    const ahora = Date.now();

    const SECUENCIA_ACTIVA = DEMO_MODE ? SECUENCIA_DEMO : SECUENCIA;

    for (const record of leads) {
      const paso = record.fields["PASO_FOLLOWUP"] ?? 0;
      if (paso >= SECUENCIA_ACTIVA.length) continue;

      const ultimaActividad = record.fields["ult_actividad_bot"];
      if (!ultimaActividad) continue;

      const diff = ahora - new Date(ultimaActividad).getTime();
      const step = SECUENCIA_ACTIVA[paso];

      if (diff < step.delayMs) continue;

      const telefono = record.fields["CELULAR"];
      if (!telefono) continue;

      const nombre = primerNombre(record.fields["NOMBRES"]);

      if (paso === 0) {
        const mem = await buscarMemoria(telefono);
        if (!mem) {
          console.log(`[FOLLOWUP] Skip ${telefono} — sin historial de chat, el bot nunca respondió`);
          continue;
        }
      }

      try {
        if (step.imagen) {
          await enviarImagenUrl(telefono, step.imagen(), step.texto(nombre));
        } else {
          await enviarMensaje(telefono, step.texto(nombre));
        }

        await actualizarPasoFollowup(record.id, paso + 1);
        console.log(`[FOLLOWUP] Paso ${paso + 1}/${SECUENCIA.length} → ${telefono} (${nombre || "sin nombre"})`);

        // Aviso NO_CERRADO a Yazmin/Ayvi después del paso 1 (3h sin responder),
        // solo si el lead ya tenía motivo + ciudad (señal de que llegó hasta la oferta).
        if (paso === 1 && !DEMO_MODE && record.fields["MOTIVO"] && record.fields["SEDE"]) {
          derivarLeadAAsistente(
            telefono,
            {
              nombre_contacto:    record.fields["NOMBRES"],
              nombre_paciente:    record.fields["PACIENTE"],
              edad_paciente:      record.fields["EDAD"],
              para_quien:         record.fields["PARA_QUIEN"],
              ciudad:             record.fields["SEDE"],
              motivo:             record.fields["MOTIVO"],
              psicologo_sugerido: record.fields["PSICOLOGO_ASIGNADO"],
              calificacion:       record.fields["ESTADO"],
            },
            "NO_CERRADO",
            record.fields["RESUMEN"] || ""
          ).catch((err) => console.warn(`[NO_CERRADO] Error notificando: ${err.message}`));
        }
      } catch (err) {
        console.error(`[FOLLOWUP] Error paso ${paso} → ${telefono}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[FOLLOWUP] Error general:", err.message);
  }
}

function iniciarFollowup() {
  if (TEST_MODE) {
    console.log("[FOLLOWUP] ⚠️  MODO TEST activo — delays en segundos, verifica cada 20s");
    setTimeout(verificarYEnviarFollowups, 5 * 1000);
  } else if (DEMO_MODE) {
    console.log("[FOLLOWUP] ⚠️  MODO DEMO activo — 1 mensaje a los 2 min, verifica cada 30s");
    setTimeout(verificarYEnviarFollowups, 30 * 1000);
  } else {
    console.log("[FOLLOWUP] Secuencia de 8 pasos activa — verifica cada 15 min");
    setTimeout(verificarYEnviarFollowups, 2 * 60 * 1000);
  }
  setInterval(verificarYEnviarFollowups, INTERVALO_MS);
}

module.exports = {
  iniciarFollowup,
  verificarYEnviarFollowups,
  // exportados para scripts de testing (forzar-followup.js)
  SECUENCIA,
  primerNombre,
};
