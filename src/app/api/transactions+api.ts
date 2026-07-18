import { categories } from "@/db/schema";
import { client, db } from "@/db/server";
import {
  ApiError,
  handle,
  json,
  readBody,
  requireHomeMember,
  requireUser,
} from "@/lib/api-guard";
import { getTransactionView, listTransactions } from "@/lib/finance-server";
import { generateId } from "@/lib/home-defaults";
import { and, eq } from "drizzle-orm";

export const GET = handle(async (request) => {
  const user = await requireUser(request);
  const url = new URL(request.url);
  const homeId = url.searchParams.get("homeId");
  if (!homeId) throw new ApiError(400, "Falta el parámetro homeId");
  await requireHomeMember(user.id, homeId);

  const month = url.searchParams.get("month") ?? undefined;
  const memberId = url.searchParams.get("memberId") ?? undefined;
  const limitParam = url.searchParams.get("limit");
  const limit = limitParam
    ? Math.min(Math.max(Number(limitParam), 1), 200)
    : undefined;

  const items = await listTransactions({ homeId, month, memberId, limit });
  return json({ transactions: items });
});

export const POST = handle(async (request) => {
  const user = await requireUser(request);
  const body = await readBody<{
    homeId?: string;
    type?: string;
    amount?: number;
    categoryId?: string | null;
    description?: string;
    date?: number;
  }>(request);

  const homeId = (body.homeId ?? "").trim();
  const type =
    body.type === "income"
      ? "income"
      : body.type === "expense"
        ? "expense"
        : null;
  const amount = Math.round(Number(body.amount));

  if (!homeId) throw new ApiError(400, "Falta el hogar");
  if (!type) throw new ApiError(400, "Tipo de movimiento inválido");
  if (!Number.isFinite(amount) || amount <= 0)
    throw new ApiError(400, "El monto debe ser mayor a 0");

  const membership = await requireHomeMember(user.id, homeId);

  if (!body.categoryId) throw new ApiError(400, "Selecciona una categoría");

  const [category] = await db
    .select()
    .from(categories)
    .where(
      and(eq(categories.id, body.categoryId), eq(categories.homeId, homeId)),
    )
    .limit(1);
  if (!category)
    throw new ApiError(400, "La categoría no pertenece a este hogar");
  if (category.type !== type)
    throw new ApiError(400, "La categoría no coincide con el tipo");
  const categoryId = category.id;

  const when = body.date ? new Date(body.date * 1000) : new Date();
  const id = generateId("txn");
  const now = Math.floor(Date.now() / 1000);
  const whenSecs = Math.floor(when.getTime() / 1000);

  await client.execute({
    sql: `INSERT INTO transactions
      (id, home_id, member_id, category_id, created_by, type, amount, description, date, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      id,
      homeId,
      membership.id,
      categoryId,
      membership.id,
      type,
      amount,
      (body.description ?? "").trim(),
      whenSecs,
      whenSecs,
      now,
    ],
  });

  const view = await getTransactionView(id);
  return json({ transaction: view }, 201);
});
