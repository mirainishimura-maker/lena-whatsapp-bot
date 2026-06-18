const axios = require("axios");

const SYSTEM_FILTRO = `Eres un filtro de mensajes para el WhatsApp del consultorio del Dr. César Carlos Coronado, cirujano plástico en Perú. La asistente se llama Lena.

Tu única tarea es decidir si el mensaje debe llegar al asistente o bloquearse antes.

BLOQUEAR solo si es MUY obvio:
- "spam": publicidad, cadenas, promociones, préstamos, ventas, ofertas, bots de marketing
- "numero_equivocado": la persona claramente busca a otra persona o negocio distinto ("¿eres María?", "delivery de pizza", "banco X", "plomero")

DEJAR PASAR todo lo demás, incluyendo:
- Saludos simples ("hola", "buenos días")
- Preguntas sobre procedimientos estéticos, cirugía plástica, precios, sedes, horarios, tecnología
- Mensajes con fotos o consultas sobre alguna zona del cuerpo
- Preguntas sobre otros temas (el asistente las maneja)
- Mensajes ambiguos o poco claros (siempre duda a favor del usuario)

Sé muy conservador al bloquear — es mejor dejar pasar un spam ocasional que bloquear a alguien interesado.

Responde SOLO con JSON válido, sin texto adicional, sin markdown:
{"pasar":true,"tipo":"normal","respuesta":""}
o
{"pasar":false,"tipo":"spam","respuesta":"Hola, este número es exclusivo para consultas del consultorio del Dr. César Carlos Coronado, cirugía plástica 🤗"}
o
{"pasar":false,"tipo":"numero_equivocado","respuesta":"Hola, creo que tienes el número equivocado. Este es el WhatsApp del consultorio del Dr. César Carlos Coronado, cirujano plástico. ¡Que estés bien!"}`;

async function filtrarTopico(mensaje) {
  try {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_FILTRO },
          { role: "user", content: mensaje },
        ],
        response_format: { type: "json_object" },
        max_tokens: 100,
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
    // Si falla el filtro, dejamos pasar — nunca bloqueamos por error
    console.error("[FILTRO] Error:", err.message);
    return { pasar: true, tipo: "normal", respuesta: "" };
  }
}

module.exports = { filtrarTopico };
