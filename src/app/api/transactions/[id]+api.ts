import { categories, transactions } from "@/db/schema";
import { db } from "@/db/server";
import {
  ApiError,
  handle,
  json,
  readBody,
  requireHomeMember,
  requireUser,
} from "@/lib/api-guard";
import { getTransactionView } from "@/lib/finance-server";
import { and, eq } from "drizzle-orm";

async function loadOwnedTransaction(userId: string, transactionId: string) {
  const [txn] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, transactionId))
    .limit(1);
  if (!txn) throw new ApiError(404, "Movimiento no encontrado");
  await requireHomeMember(userId, txn.homeId);
  return txn;
}

export const GET = handle(async (request, { id }) => {
  const user = await requireUser(request);
  await loadOwnedTransaction(user.id, id);
  const view = await getTransactionView(id);
  return json({ transaction: view });
});

export const PATCH = handle(async (request, { id }) => {
  const user = await requireUser(request);
  const txn = await loadOwnedTransaction(user.id, id);

  const body = await readBody<{
    type?: string;
    amount?: number;
    categoryId?: string | null;
    description?: string;
    date?: number;
  }>(request);

  const type =
    body.type === "income"
      ? "income"
      : body.type === "expense"
        ? "expense"
        : txn.type;

  let amount = txn.amount;
  if (body.amount !== undefined) {
    amount = Math.round(Number(body.amount));
    if (!Number.isFinite(amount) || amount <= 0)
      throw new ApiError(400, "El monto debe ser mayor a 0");
  }

  let categoryId = txn.categoryId;
  if (body.categoryId !== undefined) {
    if (!body.categoryId) throw new ApiError(400, "Selecciona una categoría");
    const [category] = await db
      .select()
      .from(categories)
      .where(
        and(
          eq(categories.id, body.categoryId),
          eq(categories.homeId, txn.homeId),
        ),
      )
      .limit(1);
    if (!category)
      throw new ApiError(400, "La categoría no pertenece a este hogar");
    if (category.type !== type)
      throw new ApiError(400, "La categoría no coincide con el tipo");
    categoryId = category.id;
  } else if (!categoryId) {
    throw new ApiError(400, "Selecciona una categoría");
  } else {
    const [category] = await db
      .select()
      .from(categories)
      .where(
        and(eq(categories.id, categoryId), eq(categories.homeId, txn.homeId)),
      )
      .limit(1);
    if (!category)
      throw new ApiError(400, "La categoría no pertenece a este hogar");
    if (category.type !== type)
      throw new ApiError(400, "La categoría no coincide con el tipo");
  }

  await db
    .update(transactions)
    .set({
      type,
      amount,
      categoryId,
      description:
        body.description !== undefined
          ? body.description.trim()
          : txn.description,
      createdAt: body.date ? new Date(body.date * 1000) : txn.createdAt,
      updatedAt: new Date(),
    })
    .where(eq(transactions.id, id));

  const view = await getTransactionView(id);
  return json({ transaction: view });
});

export const DELETE = handle(async (request, { id }) => {
  const user = await requireUser(request);
  await loadOwnedTransaction(user.id, id);
  await db.delete(transactions).where(eq(transactions.id, id));
  return json({ deleted: true });
});
