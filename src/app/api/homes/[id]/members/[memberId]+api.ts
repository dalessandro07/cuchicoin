import { and, eq, isNull } from "drizzle-orm";

import { members } from "@/db/schema";
import { db } from "@/db/server";
import {
  ApiError,
  handle,
  json,
  requireHomeAdmin,
  requireUser,
} from "@/lib/api-guard";
import { publishHomeEvent } from "@/lib/realtime";

export const DELETE = handle(async (request, { id, memberId }) => {
  const user = await requireUser(request);
  const admin = await requireHomeAdmin(user.id, id);

  if (!memberId) {
    throw new ApiError(400, "Falta el id del miembro");
  }

  if (memberId === admin.id) {
    throw new ApiError(
      400,
      "No puedes eliminarte a ti mismo. Usa “Salir del hogar”.",
    );
  }

  const [target] = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.id, memberId),
        eq(members.homeId, id),
        isNull(members.leftAt),
      ),
    )
    .limit(1);

  if (!target) {
    throw new ApiError(404, "Miembro no encontrado");
  }

  await db
    .update(members)
    .set({ leftAt: new Date() })
    .where(eq(members.id, target.id));

  await publishHomeEvent(id, {
    type: "member.left",
    actorUserId: user.id,
    entityId: target.id,
  });

  return json({ removed: true });
});
