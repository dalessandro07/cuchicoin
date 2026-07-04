import { connect } from '@tursodatabase/sync-react-native';
import type { Database, Row, BindParams, RunResult } from '@tursodatabase/sync-react-native';
import { applyMigrations } from '@/db/migrate';

export interface DbClient {
  get<T = Record<string, unknown>>(sql: string, params?: BindParams): Promise<T | undefined>;
  run(sql: string, params?: BindParams): Promise<RunResult>;
  all<T = Record<string, unknown>>(sql: string, params?: BindParams): Promise<T[]>;
  exec(sql: string): Promise<void>;
  isSync: boolean;
  push(): Promise<void>;
  pull(): Promise<void>;
  close(): void;
}

let _db: DbClient | null = null;
let _initPromise: Promise<DbClient> | null = null;

function wrapDatabase(db: Database): DbClient {
  return {
    async get<T = Record<string, unknown>>(sql: string, params?: BindParams): Promise<T | undefined> {
      const args = Array.isArray(params) ? params : params !== undefined ? [params] : [];
      const row = await db.get(sql, ...args);
      return row as T | undefined;
    },

    async run(sql: string, params?: BindParams): Promise<RunResult> {
      const args = Array.isArray(params) ? params : params !== undefined ? [params] : [];
      return db.run(sql, ...args);
    },

    async all<T = Record<string, unknown>>(sql: string, params?: BindParams): Promise<T[]> {
      const args = Array.isArray(params) ? params : params !== undefined ? [params] : [];
      const rows = await db.all(sql, ...args);
      return rows as T[];
    },

    async exec(sql: string): Promise<void> {
      await db.exec(sql);
    },

    get isSync(): boolean {
      return db.isSync;
    },

    async push(): Promise<void> {
      await db.push();
    },

    async pull(): Promise<void> {
      await db.pull();
    },

    close(): void {
      db.close();
    },
  };
}

export async function getDb(): Promise<DbClient> {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const syncUrl = process.env.EXPO_PUBLIC_TURSO_URL;
    const authToken = process.env.EXPO_PUBLIC_TURSO_AUTH_TOKEN;

    const database = await connect({
      path: 'kuchicoin.db',
      url: syncUrl,
      authToken,
    });

    await applyMigrations(database);
    _db = wrapDatabase(database);
    return _db;
  })();

  return _initPromise;
}
