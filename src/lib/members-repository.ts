/**
 * Members repository. Stores the link between a user (auth identity) and
 * a home (the workspace). One row per (userId, homeId) pair.
 */

import { getDb } from '@/db/client';
import { generateId } from '@/lib/home-defaults';
import type { HomeRole, Member } from '@/lib/db-types';

type MemberRow = Omit<Member, 'joinedAt'> & { joined_at: number };

function rowToMember(row: MemberRow): Member {
  return { ...row, joinedAt: new Date(row.joined_at * 1000) };
}

export type AddMemberInput = {
  homeId: string;
  userId: string;
  firstName: string;
  lastName?: string;
  email?: string;
  role?: HomeRole;
};

export const membersRepository = {
  async add(input: AddMemberInput): Promise<Member> {
    const db = await getDb();
    const id = generateId('mem');
    const role = input.role ?? 'member';
    await db.run(
      'INSERT INTO members (id, home_id, user_id, first_name, last_name, email, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, input.homeId, input.userId, input.firstName, input.lastName ?? '', input.email ?? '', role],
    );
    const row = await db.get<MemberRow>('SELECT * FROM members WHERE id = ?', [id]);
    if (!row) throw new Error('No se pudo crear el miembro');
    return rowToMember(row);
  },

  async getById(id: string): Promise<Member | undefined> {
    const db = await getDb();
    const row = await db.get<MemberRow>('SELECT * FROM members WHERE id = ?', [id]);
    return row ? rowToMember(row) : undefined;
  },

  async findByUserAndHome(userId: string, homeId: string): Promise<Member | undefined> {
    const db = await getDb();
    const row = await db.get<MemberRow>(
      'SELECT * FROM members WHERE user_id = ? AND home_id = ?',
      [userId, homeId],
    );
    return row ? rowToMember(row) : undefined;
  },

  async listByHome(homeId: string): Promise<Member[]> {
    const db = await getDb();
    const rows = await db.all<MemberRow>(
      'SELECT * FROM members WHERE home_id = ? ORDER BY joined_at ASC',
      [homeId],
    );
    return rows.map(rowToMember);
  },

  async listByUser(userId: string): Promise<Member[]> {
    const db = await getDb();
    const rows = await db.all<MemberRow>(
      'SELECT * FROM members WHERE user_id = ? ORDER BY joined_at DESC',
      [userId],
    );
    return rows.map(rowToMember);
  },

  async removeByUserAndHome(userId: string, homeId: string): Promise<void> {
    const db = await getDb();
    await db.run('DELETE FROM members WHERE user_id = ? AND home_id = ?', [userId, homeId]);
  },
};
