const axios = require("axios");

const SYSTEM_ANALIZAR = `Analizas conversaciones de WhatsApp del consultorio del Dr. César Carlos Coronado, cirujano plástico en Perú. La asistente se llama Lena. Tu tarea es determinar en qué etapa está la conversación y qué datos del lead ya se conocen.

ETAPAS:
- "apertura"      → primer contacto, Lena aún no sabe nada de la persona
- "datos"         → se están recogiendo los datos básicos (nombre, edad, ciudad)
- "interes"       → la persona dice o se le pregunta qué procedimiento le interesa
- "info"          → Lena está dando precio referencial, tecnología o info de la consulta
- "cierre"        → la persona quiere agendar; Lena está pidiendo nombre y DNI para coordinar
- "fuera_flujo"   → número equivocado, spam o mensaje completamente irrelevante

DATOS DEL LEAD (marca los que ya están confirmados en la conversación):
nombre_contacto, para_quien, edad_paciente, ciudad, motivo, dni_contacto, dni_paciente

IMPORTANTE: el campo "motivo" significa el PROCEDIMIENTO de interés (rinoplastia, lipoescultura, lipo de brazos, mamoplastia, ribxcar, etc.). Márcalo en datos_disponibles solo si la persona ya dijo qué procedimiento le interesa; si todavía no se sabe, ponlo en datos_faltantes.

DETECCIÓN DE PRECIO:
Revisa si la persona preguntó por el precio o costo en algún mensaje anterior (no solo el último).
- precio_preguntado_antes: true si ya lo preguntó antes del mensaje actual, false si no o si es la primera vez que pregunta.

Responde SOLO con JSON válido, sin texto adicional, sin markdown:
{
  "etapa": "interes",
  "datos_disponibles": ["nombre_contacto", "edad_paciente", "ciudad"],
  "datos_faltantes": ["motivo", "dni_contacto"],
  "precio_preguntado_antes": false,
  "nota": "Una oración con el contexto clave que ayude a responder mejor este mensaje."
}`;

async function analizarContexto(historial) {
  const ultimos = historial.slice(-10);

  if (ultimos.length === 0) {
    return {
      etapa: "apertura",
      datos_disponibles: [],
      datos_faltantes: ["nombre_contacto", "para_quien", "edad_paciente", "ciudad", "motivo", "dni_contacto"],
      nota: "Primer contacto.",
    };
  }

  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_ANALIZAR },
          ...ultimos,
        ],
        response_format: { type: "json_object" },
        max_tokens: 200,
        temperature: 0,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    return JSON.parse(response.data.choices[0].message.content);
  } catch (err) {
    console.error("[CONTEXTO] Error:", err.message);
    return { etapa: "datos", datos_disponibles: [], datos_faltantes: [], nota: "" };
  }
}

module.exports = { analizarContexto };
