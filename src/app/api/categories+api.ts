import { and, asc, eq } from 'drizzle-orm';

import { db } from '@/db/server';
import { categories } from '@/db/schema';
import { ApiError, handle, json, readBody, requireHomeMember, requireUser } from '@/lib/api-guard';
import { serializeCategory } from '@/lib/api-serialize';
import { generateId } from '@/lib/home-defaults';

const VALID_TYPES = ['expense', 'income'] as const;

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const homeId = url.searchParams.get('homeId');
  const type = url.searchParams.get('type');
  if (!homeId) throw new ApiError(400, 'Falta el parámetro homeId');
  await requireHomeMember(user.id, homeId);

  const conditions = [eq(categories.homeId, homeId)];
  if (type === 'expense' || type === 'income') {
    conditions.push(eq(categories.type, type));
  }

  const rows = await db
    .select()
    .from(categories)
    .where(and(...conditions))
    .orderBy(asc(categories.type), asc(categories.name));

  return json({ categories: rows.map(serializeCategory) });
});

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const body = await readBody<{
    homeId?: string;
    name?: string;
    type?: string;
    icon?: string;
    color?: string;
  }>(request);

  const homeId = (body.homeId ?? '').trim();
  const name = (body.name ?? '').trim();
  const type = body.type as (typeof VALID_TYPES)[number];
  const icon = (body.icon ?? '').trim();
  const color = (body.color ?? '').trim();

  if (!homeId) throw new ApiError(400, 'Falta el hogar');
  if (name.length < 2 || name.length > 30) {
    throw new ApiError(400, 'El nombre debe tener entre 2 y 30 caracteres');
  }
  if (!VALID_TYPES.includes(type)) throw new ApiError(400, 'Tipo de categoría inválido');
  if (!icon) throw new ApiError(400, 'Selecciona un ícono');
  if (!color) throw new ApiError(400, 'Selecciona un color');

  await requireHomeMember(user.id, homeId);

  const [category] = await db
    .insert(categories)
    .values({
      id: generateId('cat'),
      homeId,
      name,
      type,
      icon,
      color,
      isDefault: false,
      createdBy: user.id,
      createdAt: new Date(),
    })
    .returning();

  return json({ category: serializeCategory(category) }, 201);
});
