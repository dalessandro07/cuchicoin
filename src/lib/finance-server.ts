/**
 * Server-side finance queries against Turso. Used by the finance API routes.
 * Timestamps are returned as unix seconds (numbers); the client converts them
 * to `Date`. Amounts are integer cents (S/).
 */

import { client, db } from '@/db/server';
import { categories, transactions } from '@/db/schema';
import { DEFAULT_CATEGORIES, generateId } from '@/lib/home-defaults';
import type { Balance, MonthBucket, MonthlySummary, TransactionView } from '@/lib/db-types';

function num(value: unknown): number {
  if (typeof value === 'bigint') return Number(value);
  return typeof value === 'number' ? value : Number(value ?? 0);
}

function rowToTransactionView(row: Record<string, unknown>): TransactionView {
  return {
    id: String(row.id),
    homeId: String(row.home_id),
    categoryId: row.category_id ? String(row.category_id) : null,
    type: row.type as 'expense' | 'income',
    amount: num(row.amount),
    description: (row.description as string) ?? '',
    createdAt: num(row.created_at),
    updatedAt: num(row.updated_at),
    categoryName: row.category_name ? String(row.category_name) : null,
    categoryIcon: row.category_icon ? String(row.category_icon) : null,
    categoryColor: row.category_color ? String(row.category_color) : null,
    authorMemberId: row.author_id ? String(row.author_id) : null,
    authorFirstName: row.author_first_name ? String(row.author_first_name) : null,
    authorLastName: row.author_last_name ? String(row.author_last_name) : null,
  };
}

const TRANSACTION_SELECT = `
  SELECT t.*, 
    c.name AS category_name, c.icon AS category_icon, c.color AS category_color,
    m.id AS author_id, m.first_name AS author_first_name, m.last_name AS author_last_name
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
  LEFT JOIN members m ON m.id = t.created_by
`;

export async function listTransactions(opts: {
  homeId: string;
  limit?: number;
  month?: string;
}): Promise<TransactionView[]> {
  const where: string[] = ['t.home_id = ?'];
  const args: (string | number)[] = [opts.homeId];

  if (opts.month) {
    where.push("strftime('%Y-%m', t.created_at, 'unixepoch') = ?");
    args.push(opts.month);
  }

  let sql = `${TRANSACTION_SELECT} WHERE ${where.join(' AND ')} ORDER BY t.created_at DESC, t.id DESC`;
  if (opts.limit && opts.limit > 0) {
    sql += ' LIMIT ?';
    args.push(opts.limit);
  }

  const res = await client.execute({ sql, args });
  return res.rows.map((r) => rowToTransactionView(r as Record<string, unknown>));
}

export async function getTransactionView(id: string): Promise<TransactionView | null> {
  const res = await client.execute({
    sql: `${TRANSACTION_SELECT} WHERE t.id = ? LIMIT 1`,
    args: [id],
  });
  const row = res.rows[0];
  return row ? rowToTransactionView(row as Record<string, unknown>) : null;
}

export async function getBalance(homeId: string): Promise<Balance> {
  const res = await client.execute({
    sql: 'SELECT type, COALESCE(SUM(amount), 0) AS total FROM transactions WHERE home_id = ? GROUP BY type',
    args: [homeId],
  });
  let incomeCents = 0;
  let expenseCents = 0;
  for (const r of res.rows) {
    const row = r as Record<string, unknown>;
    if (row.type === 'income') incomeCents = num(row.total);
    else if (row.type === 'expense') expenseCents = num(row.total);
  }
  return { incomeCents, expenseCents, balanceCents: incomeCents - expenseCents };
}

export async function listMonths(homeId: string): Promise<MonthBucket[]> {
  const res = await client.execute({
    sql: `
      SELECT strftime('%Y-%m', created_at, 'unixepoch') AS m,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
        COUNT(*) AS count
      FROM transactions
      WHERE home_id = ?
      GROUP BY m
      ORDER BY m DESC`,
    args: [homeId],
  });
  return res.rows
    .map((r) => {
      const row = r as Record<string, unknown>;
      const incomeCents = num(row.income);
      const expenseCents = num(row.expense);
      return {
        month: String(row.m),
        incomeCents,
        expenseCents,
        balanceCents: incomeCents - expenseCents,
        count: num(row.count),
      };
    })
    .filter((bucket) => Boolean(bucket.month));
}

export async function getMonthlySummary(homeId: string, month: string): Promise<MonthlySummary> {
  const monthArgs = [homeId, month];
  const monthWhere = "home_id = ? AND strftime('%Y-%m', created_at, 'unixepoch') = ?";

  const totalsRes = await client.execute({
    sql: `SELECT type, COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count FROM transactions WHERE ${monthWhere} GROUP BY type`,
    args: monthArgs,
  });
  let incomeCents = 0;
  let expenseCents = 0;
  let count = 0;
  for (const r of totalsRes.rows) {
    const row = r as Record<string, unknown>;
    count += num(row.count);
    if (row.type === 'income') incomeCents = num(row.total);
    else if (row.type === 'expense') expenseCents = num(row.total);
  }

  const byCategoryRes = await client.execute({
    sql: `
      SELECT t.type AS type, t.category_id AS category_id,
        COALESCE(c.name, 'Sin categoría') AS name, c.icon AS icon, c.color AS color,
        COALESCE(SUM(t.amount), 0) AS total
      FROM transactions t
      LEFT JOIN categories c ON c.id = t.category_id
      WHERE t.home_id = ? AND strftime('%Y-%m', t.created_at, 'unixepoch') = ?
      GROUP BY t.type, t.category_id
      ORDER BY total DESC`,
    args: monthArgs,
  });
  const byCategory = byCategoryRes.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      type: row.type as 'expense' | 'income',
      categoryId: row.category_id ? String(row.category_id) : null,
      name: String(row.name),
      icon: row.icon ? String(row.icon) : null,
      color: row.color ? String(row.color) : null,
      amountCents: num(row.total),
    };
  });

  const byMemberRes = await client.execute({
    sql: `
      SELECT m.id AS member_id, m.first_name AS first_name, m.last_name AS last_name, t.type AS type,
        COALESCE(SUM(t.amount), 0) AS total
      FROM transactions t
      LEFT JOIN members m ON m.id = t.created_by
      WHERE t.home_id = ? AND strftime('%Y-%m', t.created_at, 'unixepoch') = ?
      GROUP BY t.created_by, t.type
      ORDER BY total DESC`,
    args: monthArgs,
  });
  const byMember = byMemberRes.rows.map((r) => {
    const row = r as Record<string, unknown>;
    return {
      memberId: row.member_id ? String(row.member_id) : null,
      firstName: row.first_name ? String(row.first_name) : '—',
      lastName: row.last_name ? String(row.last_name) : '',
      type: row.type as 'expense' | 'income',
      amountCents: num(row.total),
    };
  });

  return {
    month,
    incomeCents,
    expenseCents,
    balanceCents: incomeCents - expenseCents,
    count,
    byCategory,
    byMember,
  };
}

export async function seedDefaultCategories(homeId: string, memberId: string): Promise<void> {
  const now = new Date();
  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((seed) => ({
      id: generateId('cat'),
      homeId,
      name: seed.name,
      type: seed.type,
      icon: seed.icon,
      color: seed.color,
      isDefault: true,
      createdBy: memberId,
      createdAt: now,
    })),
  );
}

void transactions;
