import { and, eq } from 'drizzle-orm';

import { db } from '@/db/server';
import { homes, members } from '@/db/schema';
import { ApiError, handle, json, readBody, requireUser } from '@/lib/api-guard';
import { serializeHome, serializeMember } from '@/lib/api-serialize';
import { generateId } from '@/lib/home-defaults';

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const body = await readBody<{ inviteCode?: string }>(request);
  const code = (body.inviteCode ?? '').trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    throw new ApiError(400, 'El código de invitación no es válido');
  }

  const [home] = await db.select().from(homes).where(eq(homes.inviteCode, code)).limit(1);
  if (!home) throw new ApiError(404, 'Código de invitación no encontrado');

  const existing = await db
    .select()
    .from(members)
    .where(and(eq(members.userId, user.id), eq(members.homeId, home.id)))
    .limit(1);
  if (existing.length > 0) {
    throw new ApiError(409, 'Ya perteneces a este hogar');
  }

  const [member] = await db
    .insert(members)
    .values({
      id: generateId('mem'),
      homeId: home.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: 'member',
      joinedAt: new Date(),
    })
    .returning();

  return json({ home: serializeHome(home), membership: serializeMember(member) }, 201);
});
