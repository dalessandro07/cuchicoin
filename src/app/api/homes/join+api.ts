import { homes, members } from "@/db/schema";
import { db } from "@/db/server";
import { ApiError, handle, json, readBody, requireUser } from "@/lib/api-guard";
import { serializeHome, serializeMember } from "@/lib/api-serialize";
import { generateId } from "@/lib/home-defaults";
import { publishHomeEvent } from "@/lib/realtime";
import { and, eq } from "drizzle-orm";

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const body = await readBody<{ inviteCode?: string }>(request);
  const code = (body.inviteCode ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(code)) {
    throw new ApiError(400, "El código de invitación no es válido");
  }

  const [home] = await db
    .select()
    .from(homes)
    .where(eq(homes.inviteCode, code))
    .limit(1);
  if (!home) throw new ApiError(404, "No existe un hogar con este código");

  const existing = await db
    .select()
    .from(members)
    .where(and(eq(members.userId, user.id), eq(members.homeId, home.id)))
    .limit(1);

  if (existing.length > 0) {
    const prior = existing[0];
    if (prior.leftAt == null) {
      throw new ApiError(409, "Ya perteneces a este hogar");
    }

    const [member] = await db
      .update(members)
      .set({
        leftAt: null,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        joinedAt: new Date(),
        role: "member",
      })
      .where(eq(members.id, prior.id))
      .returning();

    await publishHomeEvent(home.id, {
      type: "member.joined",
      actorUserId: user.id,
      entityId: member.id,
    });

    return json(
      { home: serializeHome(home), membership: serializeMember(member) },
      201,
    );
  }

  const [member] = await db
    .insert(members)
    .values({
      id: generateId("mem"),
      homeId: home.id,
      userId: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: "member",
      joinedAt: new Date(),
    })
    .returning();

  await publishHomeEvent(home.id, {
    type: "member.joined",
    actorUserId: user.id,
    entityId: member.id,
  });

  return json(
    { home: serializeHome(home), membership: serializeMember(member) },
    201,
  );
});
