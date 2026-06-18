require("dotenv").config();
const readline = require("readline");
const { procesarConIA } = require("./src/services/openai");
const { detectarCrisis } = require("./src/agents/detectarCrisis");
const { analizarContexto } = require("./src/agents/analizarContexto");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

let historial = [];

console.log("─────────────────────────────────────────");
console.log("  Simulador Eli — WhatsApp Bot");
console.log("  Escribe como si fueras el usuario.");
console.log("  Ctrl+C para salir.");
console.log("─────────────────────────────────────────\n");

function preguntar() {
  rl.question("Tú: ", async (input) => {
    const mensaje = input.trim();
    if (!mensaje) return preguntar();

    try {
      // 1. Crisis + contexto en paralelo (igual que producción)
      const [crisis, contexto] = await Promise.all([
        detectarCrisis(mensaje),
        analizarContexto(historial),
      ]);

      if (crisis.esCrisis) {
        console.log(`\n🚨 CRISIS DETECTADA — nivel: ${crisis.nivel}`);
        console.log(`   Señales: ${crisis.senales.join(", ")}`);
      }

      const datosOk    = contexto.datos_disponibles.join(", ") || "ninguno";
      const datosFalta = contexto.datos_faltantes.join(", ")   || "ninguno";
      console.log(`\n🧭 Contexto — etapa: ${contexto.etapa} | recogido: ${datosOk} | falta: ${datosFalta}`);
      if (contexto.precio_preguntado_antes) console.log(`   💰 Segunda vez preguntando precio — se lo dará.`);
      if (contexto.nota) console.log(`   Nota: ${contexto.nota}`);

      // 2. Construir mensaje para GPT-4o (igual que producción)
      let mensajeParaIA;
      if (crisis.esCrisis) {
        mensajeParaIA = `⚠️ ALERTA CRISIS (nivel: ${crisis.nivel}). Señales detectadas: ${crisis.senales.join(", ")}. Activa el PROTOCOLO DE CRISIS inmediatamente.\n\nMensaje del usuario: ${mensaje}`;
      } else if (contexto.etapa !== "apertura") {
        const nota = contexto.nota ? ` ${contexto.nota}` : "";
        mensajeParaIA = `[CONTEXTO: etapa=${contexto.etapa} | recogido: ${datosOk} | falta: ${datosFalta}.${nota}]\n\n${mensaje}`;
      } else {
        mensajeParaIA = mensaje;
      }

      // 3. Llamar a GPT-4o con el historial
      const { respuesta, imagenes, stickers, lead, historialActualizado } =
        await procesarConIA(historial, mensajeParaIA);

      historial = historialActualizado;

      console.log(`\nEli: ${respuesta}`);

      if (imagenes?.length) console.log(`     📎 Imágenes: ${imagenes.join(", ")}`);
      if (stickers?.length) console.log(`     🎨 Sticker: ${stickers.join(", ")}`);

      const datosCapturados = Object.entries(lead || {})
        .filter(([, v]) => v && v !== "" && v !== null)
        .map(([k, v]) => `${k}: ${v}`)
        .join(" | ");
      if (datosCapturados) console.log(`     📋 Lead: ${datosCapturados}`);

      console.log();
    } catch (err) {
      console.error("\n[Error]:", err.message, "\n");
    }

    preguntar();
  });
}

preguntar();
