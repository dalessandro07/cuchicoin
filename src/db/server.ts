/**
 * Shared server-side Turso (libsql) connection. Used by the auth server and
 * all finance API routes. The web client (`@libsql/client/web`) is a pure
 * HTTP/fetch client with no native bindings, so it bundles cleanly under Metro.
 */

import { drizzle } from 'drizzle-orm/libsql/web';
import { createClient } from '@libsql/client/web';
import * as schema from '@/db/schema';

const TURSO_URL = process.env.TURSO_URL ?? process.env.EXPO_PUBLIC_TURSO_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN ?? process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  throw new Error(
    '[DB] Faltan TURSO_URL / TURSO_AUTH_TOKEN en las variables de entorno (.env).',
  );
}

export const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
