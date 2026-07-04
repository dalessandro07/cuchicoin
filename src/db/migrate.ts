import type { Database } from '@tursodatabase/sync-react-native';
import migration0000 from '../../drizzle/0000_heavy_spyke.sql';

export async function applyMigrations(db: Database): Promise<void> {
  await db.exec(
    'CREATE TABLE IF NOT EXISTS __drizzle_migrations (id INTEGER PRIMARY KEY, name TEXT UNIQUE NOT NULL)',
  );

  const applied = await db.get(
    'SELECT name FROM __drizzle_migrations WHERE name = ?',
    '0000_heavy_spyke',
  );

  if (!applied) {
    await db.exec('PRAGMA foreign_keys = OFF');
    await db.exec(migration0000 as unknown as string);
    await db.exec('PRAGMA foreign_keys = ON');
    await db.run('INSERT INTO __drizzle_migrations (name) VALUES (?)', '0000_heavy_spyke');
  }
}
