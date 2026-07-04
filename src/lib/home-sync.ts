/**
 * Sync helpers wrapping the Turso push/pull. Errors are logged but never
 * thrown so the local-first flow is not blocked by transient network issues.
 */

import { getDb } from '@/db/client';

export const homeSync = {
  async push(): Promise<{ ok: boolean; error?: unknown }> {
    try {
      const db = await getDb();
      if (!db.isSync) return { ok: true };
      await db.push();
      return { ok: true };
    } catch (error) {
      console.warn('[homeSync.push] failed:', error);
      return { ok: false, error };
    }
  },

  async pull(): Promise<{ ok: boolean; error?: unknown }> {
    try {
      const db = await getDb();
      if (!db.isSync) return { ok: true };
      await db.pull();
      return { ok: true };
    } catch (error) {
      console.warn('[homeSync.pull] failed:', error);
      return { ok: false, error };
    }
  },
};
