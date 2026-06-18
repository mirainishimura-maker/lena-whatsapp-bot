// Detector de crisis — DESACTIVADO en el bot de Lena.
//
// En el bot original (psicología) este módulo detectaba ideación suicida y
// activaba un protocolo de crisis. Para un consultorio de cirugía plástica ese
// protocolo no aplica, así que devolvemos siempre "sin crisis" sin gastar una
// llamada a la API. La firma se mantiene para no tocar el resto del código
// (webhook.js sigue llamando a detectarCrisis con normalidad).
async function detectarCrisis(_mensaje) {
  return { esCrisis: false, nivel: "ninguno", senales: [] };
}

module.exports = { detectarCrisis };
