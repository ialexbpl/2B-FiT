// src/utils/db.ts
import * as SQLite from 'expo-sqlite';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDb() {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync('app.db');
    const db = await dbPromise;
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS profile_cache (
        id TEXT PRIMARY KEY,
        username TEXT,
        full_name TEXT,
        avatar_url TEXT,
        updated_at TEXT
      );
    `);
  }
  return dbPromise!;
}

export const profileCache = {
  upsert: async (p: { id: string; username?: string | null; full_name?: string | null; avatar_url?: string | null; updated_at?: string | null }) => {
    const db = await getDb();
    await db.runAsync(
      `INSERT INTO profile_cache (id, username, full_name, avatar_url, updated_at)
       VALUES ($id, $username, $full_name, $avatar_url, $updated_at)
       ON CONFLICT(id) DO UPDATE SET
         username=excluded.username,
         full_name=excluded.full_name,
         avatar_url=excluded.avatar_url,
         updated_at=excluded.updated_at`,
      {
        $id: p.id,
        $username: p.username ?? null,
        $full_name: p.full_name ?? null,
        $avatar_url: p.avatar_url ?? null,
        $updated_at: p.updated_at ?? null,
      }
    );
  },
  get: async (id: string) => {
    const db = await getDb();
    const rows = await db.getAllAsync<{
      id: string; username: string | null; full_name: string | null; avatar_url: string | null; updated_at: string | null;
    }>('SELECT * FROM profile_cache WHERE id = $id', { $id: id });
    return rows?.[0] ?? null;
  },
  clear: async () => {
    const db = await getDb();
    await db.execAsync('DELETE FROM profile_cache;');
  },
};

