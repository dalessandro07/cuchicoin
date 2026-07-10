/**
 * Domain types inferred from the Drizzle schema. Repositories use these for
 * type-safe CRUD; the schema in db/schema.ts is the single source of truth.
 */

import type { InferSelectModel, InferInsertModel } from 'drizzle-orm';

import { categories, homes, members, transactions } from '@/db/schema';

export type Home = InferSelectModel<typeof homes>;
export type NewHome = InferInsertModel<typeof homes>;

export type Member = InferSelectModel<typeof members>;
export type NewMember = InferInsertModel<typeof members>;

export type Category = InferSelectModel<typeof categories>;
export type NewCategory = InferInsertModel<typeof categories>;

export type Transaction = InferSelectModel<typeof transactions>;
export type NewTransaction = InferInsertModel<typeof transactions>;

export type HomeRole = 'admin' | 'member';
export type CategoryType = 'expense' | 'income';
export type TransactionType = 'expense' | 'income';
export type Currency = 'PEN' | 'USD';

/**
 * Denormalized transaction shape returned by the finance API. Timestamps are
 * unix seconds; amounts are integer cents. Category/author fields are joined
 * so the client can render without extra lookups (and survives deletions).
 */
export type TransactionView = {
  id: string;
  homeId: string;
  categoryId: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  createdAt: number;
  updatedAt: number;
  categoryName: string | null;
  categoryIcon: string | null;
  categoryColor: string | null;
  authorMemberId: string | null;
  authorFirstName: string | null;
  authorLastName: string | null;
};

export type Balance = {
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
};

export type CategorySummary = {
  type: TransactionType;
  categoryId: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  amountCents: number;
};

export type MemberSummary = {
  memberId: string | null;
  firstName: string;
  lastName: string;
  type: TransactionType;
  amountCents: number;
};

export type MonthBucket = {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  count: number;
};

export type MonthlySummary = {
  month: string;
  incomeCents: number;
  expenseCents: number;
  balanceCents: number;
  count: number;
  byCategory: CategorySummary[];
  byMember: MemberSummary[];
};
