/**
 * Base URL for the Expo Router server (auth + finance API routes).
 *
 * Note: on a physical device `localhost` points at the device itself. For
 * device testing, replace this with your machine's LAN IP (e.g.
 * http://192.168.1.20:8081). Web and emulators work with localhost.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || 'http://localhost:8081';
