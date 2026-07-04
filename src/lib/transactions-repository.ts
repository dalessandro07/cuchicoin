/**
 * Transactions repository. Stub for this slice — the data model is in place
 * and ready, but the UI for creating/listing transactions is delivered in
 * a follow-up slice. Reads return empty arrays so the dashboard renders
 * "Pronto: registrar ingresos y gastos".
 */

import { getDb } from '@/db/client';
import type { Transaction } from '@/lib/db-types';

export const transactionsRepository = {
  async listByHome(_homeId: string, _limit = 50): Promise<Transaction[]> {
    // Will be implemented alongside the add-transaction screen.
    return [];
  },

  async create(_input: Omit<Transaction, 'id' | 'createdAt'>): Promise<Transaction> {
    throw new Error('transactionsRepository.create no implementado aún');
  },
};

// Keep the import used so the file is not flagged as having no side effects.
void getDb;
