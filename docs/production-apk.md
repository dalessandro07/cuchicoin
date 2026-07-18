# APK de producción + Turso

La app **no** se conecta a Turso desde el teléfono. El flujo es:

```
APK  →  HTTPS (EXPO_PUBLIC_API_URL)  →  API Expo (+api.ts)  →  Turso
```

Sin un backend desplegado, un APK solo apuntará a `localhost` y fallará.

## 1. Variables del servidor (EAS Hosting / host)

Configúralas como secretos del proyecto (EAS Secrets o el panel del host):

| Variable             | Uso                             |
| -------------------- | ------------------------------- |
| `TURSO_URL`          | URL libsql de Turso             |
| `TURSO_AUTH_TOKEN`   | Token Turso                     |
| `BETTER_AUTH_URL`    | Misma URL pública HTTPS del API |
| `BETTER_AUTH_SECRET` | Secreto largo aleatorio         |

**No** uses `EXPO_PUBLIC_TURSO_`*: esas variables irían al bundle del APK.

## 2. Desplegar el API

El proyecto ya usa `web.output: "server"` (ver `app.config.ts`).

```bash
npx eas-cli login
npx eas-cli init
npx expo export --platform web
npx eas-cli deploy
```

Anota la URL HTTPS resultante (p. ej. `https://kuchicoin-xxxx.expo.app`).

En el host, define las variables del servidor anteriores y vuelve a desplegar si hace falta.

## 3. Apuntar el APK al API

1. Edita `eas.json` y reemplaza `https://REPLACE_WITH_EAS_HOSTING_URL` por tu URL real en los perfiles `preview` y `production`.
2. O define `EXPO_PUBLIC_API_URL` en EAS Environment Variables para el entorno de build.

```bash
# APK interno de prueba
npm run build:apk

# AAB para Play Store
npm run build:android
```

## 4. Auth

- Scheme nativo: `kuchicoin://` (ya en config y `trustedOrigins`).
- `BETTER_AUTH_URL` debe ser la URL HTTPS pública del API.
- Android release requiere HTTPS (no HTTP claro).

## 5. Checklist rápido

- [ ] Turso creado y schema aplicado (`npm run db:push`)
- [ ] API desplegado con `TURSO_*` + `BETTER_AUTH_*`
- [ ] `EXPO_PUBLIC_API_URL` = URL del API al compilar el APK
- [ ] Login / crear hogar / movimientos verificados en dispositivo real
