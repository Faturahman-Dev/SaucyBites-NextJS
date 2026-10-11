import { DatabaseSync } from 'node:sqlite';
import { existsSync } from 'node:fs';
import path from 'node:path';
const dbPath = path.resolve(process.env.DATABASE_PATH || './data/saucybites.sqlite');
const globalForDb = globalThis as typeof globalThis & { saucybitesDb?: DatabaseSync };
export function getDb() {
  if (!existsSync(dbPath))
    throw new Error('Database belum dibuat. Jalankan npm run db:init.');
  if (!globalForDb.saucybitesDb) {
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
    globalForDb.saucybitesDb = db;
  }
  return globalForDb.saucybitesDb;
}
export function transaction<T>(fn: (db: DatabaseSync) => T): T {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn(db);
    db.exec('COMMIT');
    return result;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
