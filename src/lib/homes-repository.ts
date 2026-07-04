/**
 * Homes repository. All SQL is inline — Drizzle's query API is not used
 * because the Turso sync client is not yet supported by `drizzle-orm/libsql`.
 * Drizzle remains the source of truth for the schema and migrations.
 */

import { getDb } from '@/db/client';
import { generateInviteCode, generateId } from '@/lib/home-defaults';
import type { Home, NewHome } from '@/lib/db-types';

type HomeRow = Omit<Home, 'createdAt'> & { created_at: number };

function rowToHome(row: HomeRow): Home {
  return { ...row, createdAt: new Date(row.created_at * 1000) };
}

export const homesRepository = {
  async getById(id: string): Promise<Home | undefined> {
    const db = await getDb();
    const row = await db.get<HomeRow>('SELECT * FROM homes WHERE id = ?', [id]);
    return row ? rowToHome(row) : undefined;
  },

  async getByInviteCode(code: string): Promise<Home | undefined> {
    const db = await getDb();
    const row = await db.get<HomeRow>('SELECT * FROM homes WHERE invite_code = ?', [code.toUpperCase()]);
    return row ? rowToHome(row) : undefined;
  },

  async findAvailableInviteCode(maxAttempts = 10): Promise<string> {
    for (let i = 0; i < maxAttempts; i++) {
      const code = generateInviteCode(6);
      const existing = await this.getByInviteCode(code);
      if (!existing) return code;
    }
    throw new Error('No se pudo generar un código de invitación único');
  },

  async create(input: Omit<NewHome, 'id' | 'createdAt' | 'inviteCode' | 'currency'>): Promise<Home> {
    const db = await getDb();
    const id = generateId('home');
    const inviteCode = await this.findAvailableInviteCode();
    const currency = 'PEN';
    await db.run(
      'INSERT INTO homes (id, name, currency, invite_code) VALUES (?, ?, ?, ?)',
      [id, input.name, currency, inviteCode],
    );
    const home = await this.getById(id);
    if (!home) throw new Error('No se pudo crear el hogar');
    return home;
  },

  async delete(id: string): Promise<void> {
    const db = await getDb();
    await db.run('DELETE FROM homes WHERE id = ?', [id]);
  },
};
