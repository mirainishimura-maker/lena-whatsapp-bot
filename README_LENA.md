# Lena — Bot de WhatsApp del Dr. César Carlos Coronado

Asistente virtual de WhatsApp para el consultorio de **cirugía plástica** del
**Dr. César Augusto Carlos Coronado** (Piura · Chiclayo · Lima). Lena orienta a
las personas interesadas, da precios **referenciales ("desde")** y las lleva a
**agendar una consulta de evaluación**, derivando el caso a **Tati** (la coordinadora).

Está construido sobre la misma arquitectura que el bot "Eli" (Node.js + Express +
OpenAI GPT-4o + Whisper + Supabase + Evolution API), pero con persona, conocimiento
y flujo propios de cirugía plástica.

---

## 1. Cómo correrlo

```bash
cd C:\projects\lena-whatsapp-bot
npm install
copy .env.example .env      # luego edita .env con tus valores reales
npm run dev                 # desarrollo (recarga con nodemon)
# o
npm start                   # producción
```

El servidor expone:
- `GET  /health` — verificación de estado
- `POST /webhook` — donde Evolution API entrega los mensajes de WhatsApp

---

## 2. Qué tienes que configurar (lo operativo)

### a) Supabase (base de datos)
1. Crea un **proyecto nuevo** en [supabase.com](https://supabase.com) (uno propio de Lena).
2. En el **SQL Editor**, ejecuta el script [`sql/schema.sql`](sql/schema.sql) → crea `chats_lena` y `leads_lena`.
3. Copia el **Project URL** y la **service_role key** a `.env` (`SUPABASE_URL`, `SUPABASE_KEY`).

### b) Evolution API (WhatsApp)
1. Crea una **instancia nueva** en tu Evolution API (en EasyPanel) para el número de WhatsApp de Lena.
2. Escanea el **QR** con ese WhatsApp.
3. Configura el **webhook** de la instancia apuntando a `https://TU-BOT/webhook` (evento `messages.upsert`).
4. Copia `EVOLUTION_API_URL`, `EVOLUTION_API_KEY` y `EVOLUTION_INSTANCE` a `.env`.

### c) Coordinadora (Tati)
- En `.env`, pon el **número de WhatsApp de Tati** (sin `+` ni espacios) en **ambos**:
  `ASISTENTE_PIURA` y `ASISTENTE_LIMA`. (El código enruta a Lima si la ciudad del
  lead es "Lima", y a Piura en cualquier otro caso — como siempre es Tati, ambos van a su número.)

### d) OpenAI
- `OPENAI_API_KEY` (puede ser la misma cuenta que usas en Eli). Modelos: GPT-4o (cerebro) y Whisper (audios).

---

## 3. El "cerebro" de Lena

Todo el conocimiento y la personalidad viven en el `SYSTEM_PROMPT` de
[`src/services/openai.js`](src/services/openai.js). Ahí están:

- **Doctor:** Dr. César Augusto Carlos Coronado — CMP 58765 · RNE 28391 · RNSE S00182. Formación: Brasil, España, México, Turquía, Ecuador y Argentina.
- **Regla de oro:** nunca da precio cerrado → siempre **"desde"**; el precio final lo da el doctor en consulta.
- **Precios referenciales:** rinoplastia desde S/6,500 · lipo de brazos desde S/5,000 · lipotransferencia glútea desde S/7,000 · mamoplastia con prótesis desde S/9,500 · lipoescultura desde S/12,000 · lipo-abdominoplastia desde S/15,000 · rinomodelación y ribxcar (solo en consulta).
- **Sedes/consulta:** Piura (Clínica Mont Sinaí, S/150) · Chiclayo (Clínica Próvida, S/100) · Lima (Lince, S/100) · Virtual (videollamada S/150 + revaluación presencial sin costo).
- **Pagos:** Yape o efectivo, por adelantado; tarjeta +5% (Izipay); sin financiamiento.
- **Reglas:** rinoplastia solo +18 años · solo WhatsApp · no cotiza por foto · siempre pregunta si es paciente nuevo o recurrente.
- **Flujo:** saludo → nombre/edad/ciudad → procedimiento → precio "desde" + valor → ¿primera vez? → invitar a consulta → agendar → derivar a Tati.

Para ajustar el tono o los datos, edita ese prompt.

---

## 4. Qué cambió respecto a "Eli" (por si comparas)

| Archivo | Cambio |
|---|---|
| `src/services/openai.js` | `SYSTEM_PROMPT` reescrito para cirugía plástica (persona Lena, precios, sedes, flujo). |
| `src/services/routing.js` | Notificaciones a **Tati** (antes Yazmin/Ayvi); etiquetas "Interés / Paciente nuevo". |
| `src/routes/webhook.js` | Hint de precio adaptado; coordinadora = Tati; base de assets → repo Lena. |
| `src/agents/detectarCrisis.js` | **Desactivado** (el protocolo de crisis de psicología no aplica). |
| `src/agents/analizarContexto.js` | Etapas y datos adaptados (motivo = procedimiento). |
| `src/agents/filtrarTopico.js` | Filtro adaptado a cirugía plástica. |
| `src/agents/resumirConversacion.js` | Prompt de resumen adaptado. |
| `src/services/followup.js` | Secuencia de re-contacto reescrita a **ventas** (texto, sin imágenes). |
| `src/services/supabase.js` | Tablas `leads_lena` / `chats_lena`. |
| `.env.example`, `package.json`, `index.js` | Branding y configuración de Lena. |

---

## 5. Pendientes / notas

- **Imágenes y stickers de marca:** Lena aún no tiene. El prompt devuelve `imagenes: []`
  y `stickers: []`. Cuando tengas el logo, mapas de sede y stickers, súbelos a `/assets`
  y `/public/followup/`, actualiza las URLs en `webhook.js`/`followup.js` y habilita su uso en el prompt.
- **Reporte diario (`insightsAgent.js`):** quedó heredado de Eli y **no está conectado**
  a ningún horario (solo registra en memoria). Si lo quieres activo para Lena, hay que
  adaptarlo (header, ruta a Tati) y agendarlo.
- **Google Sheets / Airtable:** integraciones opcionales heredadas. Si no configuras sus
  variables, quedan inactivas (no afectan el funcionamiento del bot).
- **Carpetas heredadas:** `ARQUITECTURA.md`, `GUIA_MIGRACION_*`, `scripts/` y `assets/`
  vienen del proyecto base (Eli) como referencia; puedes limpiarlos cuando quieras.
- **Dato a confirmar con Tati:** "Ribxcar" se documentó como definición de cintura por
  remodelación de costillas flotantes; el precio se da solo en consulta.
