/**
 * Middleware global de manejo de errores.
 * Loguea el error completo en consola y responde con 500 genérico al cliente.
 */
function errorHandler(err, req, res, next) {
  console.error("[ERROR]", new Date().toISOString(), err.message);

  if (err.response) {
    // Error de una API externa (Airtable, OpenAI, Evolution)
    console.error("[API ERROR]", {
      status: err.response.status,
      url: err.config?.url,
      data: err.response.data,
    });
  }

  res.status(500).json({ error: "Error interno del servidor." });
}

module.exports = errorHandler;
