import { desc, eq } from 'drizzle-orm';

import { db } from '@/db/server';
import { homes, members } from '@/db/schema';
import { ApiError, handle, json, readBody, requireUser } from '@/lib/api-guard';
import { serializeHome, serializeMember } from '@/lib/api-serialize';
import { generateId, generateInviteCode } from '@/lib/home-defaults';
import { seedDefaultCategories } from '@/lib/finance-server';

async function findAvailableInviteCode(maxAttempts = 12): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = generateInviteCode(6);
    const existing = await db.select().from(homes).where(eq(homes.inviteCode, code)).limit(1);
    if (existing.length === 0) return code;
  }
  throw new ApiError(500, 'No se pudo generar un código de invitación único');
}

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const rows = await db
    .select()
    .from(members)
    .innerJoin(homes, eq(members.homeId, homes.id))
    .where(eq(members.userId, user.id))
    .orderBy(desc(members.joinedAt));

  const result = rows.map((row) => ({
    home: serializeHome(row.homes),
    membership: serializeMember(row.members),
  }));
  return json({ homes: result });
});

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const body = await readBody<{ name?: string }>(request);
  const name = (body.name ?? '').trim();
  if (name.length < 2 || name.length > 40) {
    throw new ApiError(400, 'El nombre del hogar debe tener entre 2 y 40 caracteres');
  }

  const inviteCode = await findAvailableInviteCode();
  const now = new Date();
  const homeId = generateId('home');

  const [home] = await db
    .insert(homes)
    .values({ id: homeId, name, currency: 'PEN', inviteCode, createdAt: now })
    .returning();

  const [member] = await db
    .insert(members)
    .values({
      id: generateId('mem'),
      homeId,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: 'admin',
      joinedAt: now,
    })
    .returning();

  await seedDefaultCategories(homeId, member.id);

  return json({ home: serializeHome(home), membership: serializeMember(member) }, 201);
});
