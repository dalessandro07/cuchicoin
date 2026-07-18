/**
 * Base URL for the Expo Router server (auth + finance API routes).
 *
 * - Development: defaults to http://localhost:8081 (emulator/web). On a
 *   physical device, set EXPO_PUBLIC_API_URL to your machine LAN IP.
 * - Production APK: MUST set EXPO_PUBLIC_API_URL at build time to the
 *   deployed HTTPS API origin (EAS Hosting or equivalent). Without it the
 *   app cannot reach Turso (the phone never talks to Turso directly).
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:8081';
