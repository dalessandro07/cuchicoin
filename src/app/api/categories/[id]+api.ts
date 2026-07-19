import { categories, transactions } from "@/db/schema";
import { db } from "@/db/server";
import {
  ApiError,
  handle,
  json,
  readBody,
  requireHomeAdmin,
  requireUser,
} from "@/lib/api-guard";
import { serializeCategory } from "@/lib/api-serialize";
import { publishHomeEvent } from "@/lib/realtime";
import { and, eq, ne, sql } from "drizzle-orm";

async function loadOwnedCategory(userId: string, categoryId: string) {
  const [category] = await db
    .select()
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  if (!category) throw new ApiError(404, "Categoría no encontrada");
  await requireHomeAdmin(userId, category.homeId);
  return category;
}

export const PATCH = handle(async (request, { id }) => {
  const user = await requireUser(request);
  const category = await loadOwnedCategory(user.id, id);

  const body = await readBody<{ name?: string; icon?: string; color?: string }>(
    request,
  );
  const name = body.name?.trim();
  const icon = body.icon?.trim();
  const color = body.color?.trim();

  if (name !== undefined && (name.length < 2 || name.length > 30)) {
    throw new ApiError(400, "El nombre debe tener entre 2 y 30 caracteres");
  }

  const nextName = name ?? category.name;
  if (name !== undefined) {
    const [duplicate] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(
        and(
          eq(categories.homeId, category.homeId),
          eq(categories.type, category.type),
          ne(categories.id, id),
          sql`lower(${categories.name}) = ${nextName.toLowerCase()}`,
        ),
      )
      .limit(1);
    if (duplicate) {
      throw new ApiError(400, "Ya existe una categoría con este nombre");
    }
  }

  const [updated] = await db
    .update(categories)
    .set({
      name: nextName,
      icon: icon || category.icon,
      color: color || category.color,
    })
    .where(eq(categories.id, id))
    .returning();

  await publishHomeEvent(category.homeId, {
    type: "category.updated",
    actorUserId: user.id,
    entityId: id,
  });

  return json({ category: serializeCategory(updated) });
});

export const DELETE = handle(async (request, { id }) => {
  const user = await requireUser(request);
  const category = await loadOwnedCategory(user.id, id);

  const [inUse] = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.categoryId, id))
    .limit(1);
  if (inUse) {
    throw new ApiError(
      400,
      "No se puede eliminar una categoría que está en uso",
    );
  }

  await db.delete(categories).where(eq(categories.id, id));

  await publishHomeEvent(category.homeId, {
    type: "category.deleted",
    actorUserId: user.id,
    entityId: id,
  });

  return json({ deleted: true });
});
