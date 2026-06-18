const axios = require("axios");

const UMBRAL_MENSAJES = 20; // comprimir cuando supera este número
const MENSAJES_RECIENTES = 6; // cuántos mensajes recientes conservar verbatim

const SYSTEM_RESUMIR = `Eres un comprimidor de historial de conversaciones de WhatsApp del consultorio del Dr. César Carlos Coronado, cirujano plástico en Perú. La asistente se llama Lena.

Recibirás el historial de conversación entre Lena (asistente) y una persona interesada. Tu tarea es producir un resumen compacto que permita a Lena continuar la conversación sin haber leído todo.

El resumen debe incluir:
- Nombre de quien escribe y para quién es el procedimiento (si aplica)
- Edad y ciudad (Piura / Chiclayo / Lima / virtual), si se mencionó
- Procedimiento de interés (rinoplastia, lipoescultura, mamoplastia, ribxcar, etc.)
- Etapa actual: apertura / datos / interes / info / cierre
- Si es paciente nuevo o ya se atendió con el Dr. César
- Datos ya confirmados y qué falta (DNI, confirmación de agendar, etc.)
- Cualquier cosa importante: si preguntó el precio, si pidió la dirección, si mostró dudas, etc.

Sé conciso. Máximo 3 oraciones. No uses listas. Solo texto corrido.

Responde SOLO con JSON válido, sin texto adicional, sin markdown:
{
  "resumen": "Jhasmin, 32 años, Piura, interés en lipoescultura. Ya le di el precio referencial (desde 12,000) y es paciente nueva. Está en etapa de cierre, falta confirmar el DNI para agendar la consulta."
}`;

/**
 * Si el historial supera el umbral, comprime los mensajes antiguos en un resumen
 * y devuelve un historial reducido: [mensaje-resumen] + últimos N mensajes.
 *
 * Si no supera el umbral, devuelve el historial sin cambios.
 *
 * @param {Array} historial - Array de mensajes { role, content }
 * @returns {Promise<Array>} Historial comprimido o el mismo si no aplica
 */
async function resumirSiNecesario(historial) {
  if (historial.length <= UMBRAL_MENSAJES) return historial;

  const recientes = historial.slice(-MENSAJES_RECIENTES);
  const antiguos  = historial.slice(0, -MENSAJES_RECIENTES);

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_RESUMIR },
          ...antiguos,
        ],
        response_format: { type: "json_object" },
        max_tokens: 300,
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const { resumen } = JSON.parse(response.data.choices[0].message.content);

    console.log(`[RESUMEN] Historial comprimido: ${antiguos.length} msgs → 1 resumen`);

    // El historial comprimido: primero el resumen como mensaje de sistema, luego los recientes
    return [
      { role: "system", content: `[RESUMEN DE CONVERSACIÓN ANTERIOR: ${resumen}]` },
      ...recientes,
    ];
  } catch (err) {
    // Si falla, devolvemos el historial completo — nunca perdemos contexto por error
    console.error("[RESUMEN] Error al comprimir, usando historial completo:", err.message);
    return historial;
  }
}

module.exports = { resumirSiNecesario };
