const { enviarMensaje } = require("./evolution");

/**
 * Deriva notificaciones a Tati (la coordinadora) según la ciudad del lead.
 * En el bot de Lena la coordinadora es siempre Tati; el número se toma de
 * ASISTENTE_LIMA si la ciudad es Lima, o de ASISTENTE_PIURA en cualquier otro
 * caso (Piura, Chiclayo o virtual). Por defecto ambos apuntan al WhatsApp de Tati.
 *
 * Tipos:
 *   'NUEVO_LEAD'          — lead interesado por primera vez
 *   'LISTO_PARA_COORDINAR' — Lena ya recopiló DNI, listo para confirmar día/hora y cobrar (= lead CERRADO)
 *   'NO_CERRADO'          — lead llegó a la oferta de consulta y se quedó sin responder (resumen)
 *   'RECONTACTO'          — lead frío, Lena envió seguimiento automático sin respuesta
 */
async function derivarLeadAAsistente(telefonoCliente, lead, tipo = "NUEVO_LEAD", resumen = "") {
  const ciudad = (lead.ciudad || "").toLowerCase();
  const esLima = ciudad === "lima";

  const numeroAsistente = esLima ? process.env.ASISTENTE_LIMA : process.env.ASISTENTE_PIURA;
  const nombreAsistente = "Tati";
  const sede = (lead.ciudad || "—").toUpperCase();

  if (!numeroAsistente) {
    console.warn(`[ROUTING] No está configurado el número de la coordinadora (ASISTENTE_PIURA/ASISTENTE_LIMA) en el .env`);
    return;
  }

  const construir = {
    NUEVO_LEAD:           construirNuevoLead,
    LISTO_PARA_COORDINAR: construirListoParaCoordinar,
    NO_CERRADO:           construirNoCerrado,
    RECONTACTO:           construirRecontacto,
  }[tipo] || construirNuevoLead;

  const mensaje = construir(telefonoCliente, lead, nombreAsistente, sede, resumen);

  await enviarMensaje(numeroAsistente, mensaje);
  console.log(`[ROUTING] Notificación ${tipo} enviada a ${nombreAsistente} (${sede}): ${numeroAsistente}`);
}

// ─────────────────────────────────────────────
// PLANTILLAS DE MENSAJES
// ─────────────────────────────────────────────

function construirNuevoLead(telefonoCliente, lead, nombreAsistente, sede, resumen) {
  const icono = {
    ALTO:  "🔴 ALTO  — cierre rápido probable",
    MEDIO: "🟡 MEDIO — requiere seguimiento",
    BAJO:  "🟢 BAJO  — baja probabilidad",
  }[lead.calificacion] || "⚪ Sin calificar";

  const esTercero = lead.para_quien && lead.para_quien !== "yo mismo";

  const lineas = [
    `🔔 *NUEVO LEAD — DR. CÉSAR (${sede})*`,
    "",
    `📊 ${icono}`,
    "",
    `📱 WhatsApp: wa.me/${telefonoCliente}`,
    `👤 Contacto: ${lead.nombre_contacto || "—"}`,
  ];

  if (esTercero) lineas.push(`🧑‍⚕️ Paciente: ${lead.nombre_paciente || "—"} (${lead.para_quien})`);
  lineas.push(`🎂 Edad: ${lead.edad_paciente ?? "—"}`);
  lineas.push(`💉 Interés: ${lead.motivo || "—"}`);
  if (lead.paciente_nuevo) lineas.push(`🆕 Paciente: ${lead.paciente_nuevo}`);
  if (resumen) lineas.push("", `📝 Contexto: ${resumen}`);

  lineas.push("", "⏳ Lena está recopilando datos. Te avisaré cuando esté listo para coordinar.");

  return lineas.join("\n");
}

function construirListoParaCoordinar(telefonoCliente, lead, nombreAsistente, sede, resumen) {
  const esTercero = lead.para_quien && lead.para_quien !== "yo mismo";
  const nombre = lead.nombre_contacto || "el lead";

  const lineas = [
    `✅ *LISTO PARA COORDINAR — DR. CÉSAR (${sede})*`,
    "",
    `${nombre} confirmó que quiere agendar consulta y Lena ya recopiló sus datos.`,
    "",
    `📱 WhatsApp: wa.me/${telefonoCliente}`,
    `👤 Contacto: ${lead.nombre_contacto || "—"}`,
  ];

  if (lead.dni_contacto) lineas.push(`🪪 DNI contacto: ${lead.dni_contacto}`);
  if (esTercero) {
    lineas.push(`🧑‍⚕️ Paciente: ${lead.nombre_paciente || "—"} (${lead.para_quien})`);
    if (lead.dni_paciente) lineas.push(`🪪 DNI paciente: ${lead.dni_paciente}`);
  }
  lineas.push(`🎂 Edad: ${lead.edad_paciente ?? "—"}`);
  lineas.push(`💉 Interés: ${lead.motivo || "—"}`);
  if (lead.paciente_nuevo) lineas.push(`🆕 Paciente: ${lead.paciente_nuevo}`);
  if (resumen) lineas.push("", `📝 Contexto: ${resumen}`);

  lineas.push("", "👉 *Siguiente paso:* confírmale día y hora de la consulta y coordina el pago por adelantado.");

  return lineas.join("\n");
}

function construirNoCerrado(telefonoCliente, lead, nombreAsistente, sede, resumen) {
  const esTercero = lead.para_quien && lead.para_quien !== "yo mismo";
  const nombre = lead.nombre_contacto || "este lead";

  const icono = {
    ALTO:  "🔴 ALTO",
    MEDIO: "🟡 MEDIO",
    BAJO:  "🟢 BAJO",
  }[lead.calificacion] || "⚪ Sin calificar";

  const lineas = [
    `🟠 *LEAD NO CERRADO — DR. CÉSAR (${sede})*`,
    "",
    `${nombre} llegó a la oferta de la consulta pero lleva varias horas sin responder a los recordatorios automáticos de Lena.`,
    "",
    `📊 ${icono}`,
    `📱 WhatsApp: wa.me/${telefonoCliente}`,
    `👤 Contacto: ${nombre}`,
  ];

  if (esTercero) lineas.push(`🧑‍⚕️ Paciente: ${lead.nombre_paciente || "—"} (${lead.para_quien})`);
  lineas.push(`🎂 Edad: ${lead.edad_paciente ?? "—"}`);
  lineas.push(`💉 Interés: ${lead.motivo || "—"}`);
  if (resumen) lineas.push("", `📝 Resumen: ${resumen}`);

  lineas.push("", "👉 *Considera escribirle tú directamente* — Lena seguirá con los recordatorios automáticos, pero un toque humano puede cambiar la balanza.");

  return lineas.join("\n");
}

function construirRecontacto(telefonoCliente, lead, nombreAsistente, sede, resumen) {
  const nombre = lead.nombre_contacto || lead["NOMBRES"] || "este lead";
  const motivo = lead.motivo          || lead["MOTIVO"]  || "—";
  const estado = lead.calificacion    || lead["ESTADO"]  || "";

  const icono = { ALTO: "🔴 ALTO", MEDIO: "🟡 MEDIO", BAJO: "🟢 BAJO" }[estado] || "⚪";

  const lineas = [
    `⚠️ *RECONTACTO PENDIENTE — DR. CÉSAR (${sede})*`,
    "",
    `Lena envió seguimiento automático a *${nombre}* pero no respondió.`,
    "",
    `📱 WhatsApp: wa.me/${telefonoCliente}`,
    `👤 Contacto: ${nombre}`,
    `💉 Interés: ${motivo}`,
    `📊 Estado: ${icono}`,
    "",
    "👉 *Escríbele o llámala directamente para no perder el lead.*",
  ];

  return lineas.join("\n");
}

module.exports = { derivarLeadAAsistente };
