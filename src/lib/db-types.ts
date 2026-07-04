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
