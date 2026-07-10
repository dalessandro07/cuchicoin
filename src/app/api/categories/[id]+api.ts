import { eq } from 'drizzle-orm';

import { db } from '@/db/server';
import { categories, transactions } from '@/db/schema';
import { ApiError, handle, json, readBody, requireHomeMember, requireUser } from '@/lib/api-guard';
import { serializeCategory } from '@/lib/api-serialize';

async function loadOwnedCategory(userId: string, categoryId: string) {
  const [category] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!category) throw new ApiError(404, 'Categoría no encontrada');
  await requireHomeMember(userId, category.homeId);
  return category;
}

export const PATCH = handle(async (request, { id }) => {
  const user = await requireUser(request);
  const category = await loadOwnedCategory(user.id, id);

  const body = await readBody<{ name?: string; icon?: string; color?: string }>(request);
  const name = body.name?.trim();
  const icon = body.icon?.trim();
  const color = body.color?.trim();

  if (name !== undefined && (name.length < 2 || name.length > 30)) {
    throw new ApiError(400, 'El nombre debe tener entre 2 y 30 caracteres');
  }

  const [updated] = await db
    .update(categories)
    .set({
      name: name ?? category.name,
      icon: icon || category.icon,
      color: color || category.color,
    })
    .where(eq(categories.id, id))
    .returning();

  return json({ category: serializeCategory(updated) });
});

export const DELETE = handle(async (request, { id }) => {
  const user = await requireUser(request);
  await loadOwnedCategory(user.id, id);

  // Keep the movements; just clear their category (shown as "Sin categoría").
  await db.update(transactions).set({ categoryId: null }).where(eq(transactions.categoryId, id));
  await db.delete(categories).where(eq(categories.id, id));

  return json({ deleted: true });
});
