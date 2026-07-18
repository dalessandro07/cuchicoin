/**
 * Shared server-side Turso (libsql) connection. Used by the auth server and
 * all finance API routes. The web client (`@libsql/client/web`) is a pure
 * HTTP/fetch client with no native bindings, so it bundles cleanly under Metro.
 *
 * Secrets must be server-only (TURSO_*). Never use EXPO_PUBLIC_* for Turso —
 * those values are embedded in the native/JS client bundle.
 */

import * as schema from "@/db/schema";
import { createClient } from "@libsql/client/web";
import { drizzle } from "drizzle-orm/libsql/web";

const TURSO_URL = process.env.TURSO_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_URL || !TURSO_AUTH_TOKEN) {
  throw new Error(
    "[DB] Faltan TURSO_URL / TURSO_AUTH_TOKEN en las variables de entorno del servidor.",
  );
}

export const client = createClient({
  url: TURSO_URL,
  authToken: TURSO_AUTH_TOKEN,
});

export const db = drizzle(client, { schema });
