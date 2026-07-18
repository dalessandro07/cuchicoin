/**
 * Base URL for the Expo Router server (auth + finance API routes).
 *
 * - Development (`__DEV__`): defaults to http://localhost:8081. On a physical
 *   device, set EXPO_PUBLIC_API_URL to your machine LAN IP.
 * - Production (export / EAS Build): uses EXPO_PUBLIC_API_URL when set; otherwise
 *   falls back to https://kuchicoin.expo.app (never localhost).
 *
 * EXPO_PUBLIC_* is inlined at export/build time — changing .env after deploy
 * does not update an already published bundle.
 */
const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();

export const API_BASE_URL =
  fromEnv ||
  (__DEV__ ? 'http://localhost:8081' : 'https://kuchicoin.expo.app');
