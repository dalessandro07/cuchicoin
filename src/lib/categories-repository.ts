/**
 * Categories repository. Reads categories for a home; writes are limited to
 * seeding defaults at home creation time. User-defined categories (managed
 * via UI) will be added in a future slice.
 */

import { getDb } from '@/db/client';
import { DEFAULT_CATEGORIES, generateId } from '@/lib/home-defaults';
import type { Category, CategoryType } from '@/lib/db-types';

type CategoryRow = Omit<Category, 'createdAt' | 'isDefault'> & {
  created_at: number;
  is_default: number;
};

function rowToCategory(row: CategoryRow): Category {
  return {
    ...row,
    createdAt: new Date(row.created_at * 1000),
    isDefault: row.is_default === 1,
  };
}

export const categoriesRepository = {
  async seedDefaults(homeId: string, createdByMemberId: string | null): Promise<Category[]> {
    const db = await getDb();
    const now = Math.floor(Date.now() / 1000);
    const inserted: Category[] = [];
    for (const seed of DEFAULT_CATEGORIES) {
      const id = generateId('cat');
      await db.run(
        'INSERT INTO categories (id, home_id, name, type, icon, color, is_default, created_by, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)',
        [id, homeId, seed.name, seed.type, seed.icon, seed.color, createdByMemberId, now],
      );
      inserted.push({
        id,
        homeId,
        name: seed.name,
        type: seed.type,
        icon: seed.icon,
        color: seed.color,
        isDefault: true,
        createdBy: createdByMemberId,
        createdAt: new Date(now * 1000),
      });
    }
    return inserted;
  },

  async listByHome(homeId: string, type?: CategoryType): Promise<Category[]> {
    const db = await getDb();
    const sql = type
      ? 'SELECT * FROM categories WHERE home_id = ? AND type = ? ORDER BY is_default DESC, name ASC'
      : 'SELECT * FROM categories WHERE home_id = ? ORDER BY type ASC, is_default DESC, name ASC';
    const params = type ? [homeId, type] : [homeId];
    const rows = await db.all<CategoryRow>(sql, params);
    return rows.map(rowToCategory);
  },
};
