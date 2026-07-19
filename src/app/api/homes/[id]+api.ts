import { categories, homes, members, transactions } from "@/db/schema";
import { db } from "@/db/server";
import {
  ApiError,
  handle,
  json,
  requireHomeMember,
  requireUser,
} from "@/lib/api-guard";
import {
  serializeCategory,
  serializeHome,
  serializeMember,
} from "@/lib/api-serialize";
import { getBalance, listTransactions } from "@/lib/finance-server";
import { and, asc, eq, isNull } from "drizzle-orm";

export const GET = handle(async (request, { id }) => {
  const user = await requireUser(request);
  const membership = await requireHomeMember(user.id, id);

  const [home] = await db.select().from(homes).where(eq(homes.id, id)).limit(1);
  if (!home) throw new ApiError(404, "Hogar no encontrado");

  const [homeMembers, homeCategories, recentTransactions, balance] =
    await Promise.all([
      db
        .select()
        .from(members)
        .where(and(eq(members.homeId, id), isNull(members.leftAt)))
        .orderBy(asc(members.joinedAt)),
      db
        .select()
        .from(categories)
        .where(eq(categories.homeId, id))
        .orderBy(asc(categories.type), asc(categories.name)),
      listTransactions({ homeId: id, limit: 10 }),
      getBalance(id),
    ]);

  return json({
    home: serializeHome(home),
    membership: serializeMember(membership),
    members: homeMembers.map(serializeMember),
    categories: homeCategories.map(serializeCategory),
    recentTransactions,
    balance,
  });
});

export const DELETE = handle(async (request, { id }) => {
  const user = await requireUser(request);
  const membership = await requireHomeMember(user.id, id);

  const homeMembers = await db
    .select()
    .from(members)
    .where(and(eq(members.homeId, id), isNull(members.leftAt)));
  const others = homeMembers.filter((m) => m.id !== membership.id);
  const otherAdmins = others.filter((m) => m.role === "admin");

  if (membership.role === "admin" && otherAdmins.length === 0) {
    if (others.length > 0) {
      throw new ApiError(
        409,
        "Promueve a otro miembro a administrador antes de salir",
      );
    }
    // Sole member & admin: delete the whole home and its data.
    await db.delete(transactions).where(eq(transactions.homeId, id));
    await db.delete(members).where(eq(members.homeId, id));
    await db.delete(categories).where(eq(categories.homeId, id));
    await db.delete(homes).where(eq(homes.id, id));
    return json({ deleted: true });
  }

  await db
    .update(members)
    .set({ leftAt: new Date() })
    .where(
      and(
        eq(members.homeId, id),
        eq(members.userId, user.id),
        isNull(members.leftAt),
      ),
    );
  return json({ deleted: false, left: true });
});
