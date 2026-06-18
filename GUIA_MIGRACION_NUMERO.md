# Guía: Migrar el número de Eli al WhatsApp Business de Gabriela

**Quién hace qué:**
- Mirai → todo lo que involucra el servidor y EasyPanel
- Gabriela → solo escanear el QR desde su teléfono (paso 3)

**Tiempo estimado:** 10-15 minutos

---

## Qué no cambia

El código, el servidor, las variables de entorno y el webhook URL no se tocan.
Solo se cambia qué teléfono está vinculado a la instancia de Evolution API.

---

## Antes de empezar — checklist

### Gabriela hace esto en su teléfono
- [ ] Tiene **WhatsApp Business** instalado y activo (no WhatsApp normal)
- [ ] El número de Gabriela ya está registrado en WhatsApp Business
- [ ] El teléfono tiene batería suficiente e internet estable
- [ ] **Cerrar todas las sesiones de WhatsApp Web activas:**
  Abrir WhatsApp Business → Menú (⋮) → Dispositivos vinculados → cerrar cada sesión activa

### Mirai tiene listo
- [ ] Acceso a EasyPanel con el proyecto desplegado
- [ ] La URL de Evolution API (está en el `.env` como `EVOLUTION_API_URL`)
- [ ] El nombre de la instancia (está en el `.env` como `EVOLUTION_INSTANCE`)

---

## Paso 1 — Acceder al manager de Evolution API

1. Abre el navegador y ve a:
   ```
   https://[tu-evolution-api-url]/manager
   ```
   (Reemplaza `[tu-evolution-api-url]` con el valor de `EVOLUTION_API_URL` en tu `.env`)

2. Ingresa con tu API key cuando te la pida.

3. Verás el listado de instancias. Busca la que tiene el nombre que coincide con `EVOLUTION_INSTANCE` en tu `.env`.

---

## Paso 2 — Desconectar el número actual

1. Haz clic en la instancia de Eli.
2. Busca el botón **Logout** o **Desconectar** (puede aparecer como un ícono de salida o "Disconnect").
3. Confirma la desconexión. El estado de la instancia cambiará a **"disconnected"** o **"close"**.

> La instancia sigue existiendo — solo se desvincula el teléfono. El historial de Airtable y toda la configuración quedan intactos.

---

## Paso 3 — Conectar el número de Gabriela (hacerlo juntos)

Coordina con Gabriela en tiempo real (por llamada o estando en el mismo lugar).

**Mirai:**
1. En la misma instancia, haz clic en **Connect** o **QR Code**.
2. Aparecerá un código QR en pantalla. Tiene una validez de ~60 segundos — si vence, recárgalo.
3. Avisa a Gabriela que el QR está listo.

**Gabriela (desde su teléfono):**
1. Abrir **WhatsApp Business**
2. Ir a → **Menú (⋮)** → **Dispositivos vinculados** → **Vincular un dispositivo**
3. Apuntar la cámara al QR que Mirai tiene en pantalla
4. Esperar la confirmación en el teléfono ("Dispositivo vinculado correctamente")

**Mirai:**
- El estado de la instancia debe cambiar a **"open"** o **"connected"**
- Si no cambia en 30 segundos, refresca la página del manager

---

## Paso 4 — Verificar que el bot funciona

1. Desde un número de prueba (no el de Gabriela), envía un mensaje de WhatsApp al número de Gabriela.
2. El bot debe responder como Eli en 7-10 segundos.
3. Si no responde, revisa en EasyPanel que el servicio del bot esté corriendo (el webhook debe estar activo).

---

## Paso 5 — Verificar que el webhook sigue apuntando bien

En Evolution API, la instancia debe tener configurado el webhook hacia el bot. Si después de reconectar el bot no responde:

1. Ve a la instancia en el manager de Evolution API
2. Busca la configuración de **Webhook**
3. Confirma que la URL apunta a:
   ```
   https://[url-del-bot]/webhook
   ```
4. Confirma que los eventos **MESSAGES_UPSERT** están activados
5. Si no estaban, guarda y vuelve a probar

---

## Si algo falla

| Síntoma | Qué revisar |
|---|---|
| El QR vence antes de escanearlo | Recargar la página del manager y generar uno nuevo |
| La instancia queda en "connecting" | Cerrar sesiones activas de WhatsApp Web en el teléfono de Gabriela e intentar de nuevo |
| El bot no responde después de conectar | Verificar que el webhook esté configurado (Paso 5) |
| Evolution API no reconoce el teléfono | Asegurarse de que WhatsApp Business (no el normal) está activo en el número de Gabriela |

---

## Notas finales

- Una vez conectado, Gabriela **no necesita hacer nada más** — el bot corre en el servidor, no en su teléfono.
- El teléfono de Gabriela solo necesita estar encendido y con internet para mantener la sesión activa de WhatsApp Business (como cualquier sesión de WhatsApp Web).
- Si Gabriela reinstala WhatsApp o cambia de teléfono en el futuro, habrá que repetir el Paso 3.
