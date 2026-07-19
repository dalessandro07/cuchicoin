# APK de producción + Turso

La app **no** se conecta a Turso desde el teléfono. El flujo es:

```
APK  →  HTTPS (EXPO_PUBLIC_API_URL)  →  API Expo (+api.ts)  →  Turso
```

Sin un backend desplegado, un APK solo apuntará a `localhost` y fallará.

## Importante: variables `EXPO_PUBLIC_*` se hornean en el bundle

`EXPO_PUBLIC_API_URL` se **inlinea** en el JS en el momento de:

- `npx expo export` (web / EAS Hosting)
- `eas build` (APK)

Cambiar `.env` o el panel de EAS **después** del deploy/build **no** actualiza un artifact ya publicado. Los deployments son inmutables.

Tras cambiar `EXPO_PUBLIC_*`:

1. Re-export + deploy web: `npm run deploy:api` (export + `eas deploy --prod --environment production`)
2. Rebuild del APK: `npm run build:apk` (no basta con redeploy del API)
3. Confirma en DevTools que el HTML carga un `entry-*.js` nuevo y las peticiones van a `https://kuchicoin.expo.app` (no `localhost`)

Opcional: si las vars viven en EAS Environment Variables, sincroniza localmente con `eas env:pull --environment production` antes del export.

## 1. Variables del servidor (EAS Hosting / host)

Configúralas en EAS Environment Variables para el entorno `production` (visibilidad plaintext o sensitive; no uses secret visibility para Hosting). Van con `eas deploy --environment production` — **no** llevan prefijo `EXPO_PUBLIC_`:

| Variable               | Uso                                          |
| ---------------------- | -------------------------------------------- |
| `TURSO_URL`            | URL libsql de Turso                          |
| `TURSO_AUTH_TOKEN`     | Token Turso                                  |
| `BETTER_AUTH_URL`      | Misma URL pública HTTPS del API              |
| `BETTER_AUTH_SECRET`   | Secreto largo aleatorio                      |
| `FREELLM_API_KEY`      | Clave FreeLLM (análisis de texto OCR)        |
| `FREELLM_BASE_URL`     | `https://freellmapi.alessandrorios.com/v1`   |
| `FREELLM_TEXT_MODEL`   | Opcional; omitir para auto-route             |
| `REDIS_URL`            | Redis (Streams) para realtime entre miembros |

**No** uses `EXPO_PUBLIC_TURSO_`* ni `EXPO_PUBLIC_REDIS_*`: esas variables irían al bundle del APK.

## 2. Desplegar el API

El proyecto ya usa `web.output: "server"` (ver `app.config.ts`).

Asegúrate de que `.env` / `.env.local` tenga `EXPO_PUBLIC_API_URL=https://kuchicoin.expo.app` **antes** del export (esa URL queda en el bundle del cliente web).

```bash
npx eas-cli login
npx eas-cli init
npm run deploy:api
# equivalente: expo export --platform web && eas deploy --prod --environment production
```

Anota la URL HTTPS resultante (p. ej. `https://kuchicoin.expo.app`).

En el host, define las variables del servidor anteriores y vuelve a desplegar si hace falta (`npm run deploy:api` de nuevo).

## 3. Apuntar el APK al API

1. `eas.json` ya define `EXPO_PUBLIC_API_URL` en los perfiles `preview` y `production`.
2. O define `EXPO_PUBLIC_API_URL` en EAS Environment Variables para el entorno de build (`preview` / `production`).

```bash
# APK interno de prueba
npm run build:apk

# APK / AAB según perfil production
npm run build:android
```

## 4. Auth

- Scheme nativo: `kuchicoin://` (ya en config y `trustedOrigins`).
- `BETTER_AUTH_URL` debe ser la URL HTTPS pública del API.
- Android release requiere HTTPS (no HTTP claro).
- En DevTools / logcat, las peticiones de auth deben ir a `https://kuchicoin.expo.app/api/auth/...`, nunca a `localhost`.

## 5. Checklist rápido

- [ ] Turso creado y schema aplicado (`npm run db:push`)
- [ ] API desplegado con `TURSO_*` + `BETTER_AUTH_*` vía `--environment production`
- [ ] `EXPO_PUBLIC_API_URL` presente en `.env` al hacer `expo export`
- [ ] `EXPO_PUBLIC_API_URL` = URL del API al compilar el APK
- [ ] Tras cambiar la URL: redeploy web **y** rebuild APK
- [ ] Login / crear hogar / movimientos verificados (sin `localhost` en la red)
