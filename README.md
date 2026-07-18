# KuchiCoin

App Expo (React Native) para finanzas del hogar. Los datos viven en **Turso**; el cliente móvil solo habla con las rutas API de Expo Router.

```
App / APK  →  API Expo (+api.ts)  →  Turso
```

## Desarrollo local

1. Copia variables de entorno:

   ```bash
   cp .env.example .env
   ```

   Completa `TURSO_URL`, `TURSO_AUTH_TOKEN` y `BETTER_AUTH_SECRET`.

2. Instala dependencias y aplica el schema:

   ```bash
   npm install
   npm run db:push
   ```

3. Arranca el servidor de desarrollo (UI + API):

   ```bash
   npm start
   ```

En un dispositivo físico, `localhost` no apunta a tu PC: define `EXPO_PUBLIC_API_URL=http://TU_IP_LAN:8081` en `.env`.

## APK de producción + Turso

Un APK **no incluye** Turso. Hay que desplegar el API y compilar el APK apuntando a esa URL.

Guía paso a paso: [docs/production-apk.md](docs/production-apk.md)

Resumen:

```bash
# 1) Desplegar API (con secretos TURSO_* y BETTER_AUTH_* en el host)
npm run deploy:api

# 2) Poner la URL real en eas.json → EXPO_PUBLIC_API_URL

# 3) Generar APK de prueba
npm run build:apk
```

## Scripts

| Script | Descripción |
|--------|-------------|
| `npm start` | Dev server Expo |
| `npm run db:push` | Push schema a Turso |
| `npm run deploy:api` | Export web server + `eas deploy` |
| `npm run build:apk` | EAS Build Android APK (`preview`) |
| `npm run build:android` | EAS Build Android AAB (`production`) |

## Learn more

- [Expo docs](https://docs.expo.dev/)
- [EAS Hosting](https://docs.expo.dev/eas/hosting/introduction/)
- [Turso](https://docs.turso.tech/)
