/**
 * Simula el tiempo humano de lectura + escritura en WhatsApp.
 *
 * Modelo:
 *   - Lectura del mensaje recibido: 2-5 s aleatorio
 *   - Escritura: ~45 chars/seg (ritmo de teclado móvil), con ±25% de variación
 *   - Mínimo total: 10 s  |  Máximo total: 90 s
 */

const MIN_MS = 8_000;
const MAX_MS = 90_000;
const CHARS_PER_SECOND = 35;

/**
 * Devuelve los milisegundos que debe durar el indicador de "escribiendo"
 * antes de enviar la respuesta.
 *
 * @param {string} textoRespuesta - El texto que Eli va a enviar.
 * @returns {number} Milisegundos de demora.
 */
function calcularDemora(textoRespuesta) {
  // Tiempo de lectura del mensaje entrante (pausa inicial)
  const lecturaMs = aleatorio(3000, 7000);

  // Tiempo de escritura basado en longitud de la respuesta
  const chars = textoRespuesta.length;
  const escrituraBase = (chars / CHARS_PER_SECOND) * 1000;

  // Variación humana ±25%
  const variacion = aleatorio(0.75, 1.25);
  const escrituraMs = escrituraBase * variacion;

  const total = lecturaMs + escrituraMs;

  // Clamp entre mínimo y máximo
  return Math.round(Math.min(Math.max(total, MIN_MS), MAX_MS));
}

/**
 * Promesa que espera N milisegundos.
 */
function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Número decimal aleatorio entre min y max.
 */
function aleatorio(min, max) {
  return Math.random() * (max - min) + min;
}

module.exports = { calcularDemora, esperar };
