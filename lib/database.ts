import { createClient, type Client } from '@libsql/client';
import { DatabaseSync } from 'node:sqlite';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';

export const isTurso = Boolean(process.env.TURSO_DATABASE_URL);

function getDbFilePath(): string {
  return path.resolve(process.env.DATABASE_PATH || './data/saucybites.sqlite');
}

const globalForDb = globalThis as typeof globalThis & {
  saucybitesDb?: DatabaseSync;
  saucybitesLibsql?: Client;
  saucybitesInitialized?: boolean;
};

export function getClient(): Client {
  if (!globalForDb.saucybitesLibsql) {
    if (process.env.TURSO_DATABASE_URL) {
      globalForDb.saucybitesLibsql = createClient({
        url: process.env.TURSO_DATABASE_URL,
        authToken: process.env.TURSO_AUTH_TOKEN,
      });
    } else {
      const dbPath = getDbFilePath();
      mkdirSync(path.dirname(dbPath), { recursive: true });
      globalForDb.saucybitesLibsql = createClient({
        url: `file:${dbPath.replace(/\\/g, '/')}`,
      });
    }
  }
  return globalForDb.saucybitesLibsql;
}

export async function initDb(): Promise<void> {
  if (globalForDb.saucybitesInitialized) return;
  const client = getClient();
  const initSql = `
CREATE TABLE IF NOT EXISTS activity (
	id text PRIMARY KEY NOT NULL,
	record_id text NOT NULL,
	action text NOT NULL,
	label text NOT NULL,
	author text NOT NULL,
	time text NOT NULL
);
CREATE TABLE IF NOT EXISTS records (
	id text PRIMARY KEY NOT NULL,
	kind text NOT NULL,
	data text NOT NULL,
	revision integer DEFAULT 1 NOT NULL,
	deleted integer DEFAULT 0 NOT NULL,
	updated_at text NOT NULL,
	author text NOT NULL
);
CREATE TABLE IF NOT EXISTS migrations (
	name text PRIMARY KEY NOT NULL
);
`;
  await client.executeMultiple(initSql);
  globalForDb.saucybitesInitialized = true;
}

export function getDb(): DatabaseSync {
  const dbPath = getDbFilePath();
  if (!existsSync(dbPath)) {
    mkdirSync(path.dirname(dbPath), { recursive: true });
    const db = new DatabaseSync(dbPath);
    db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;');
    db.exec(`
CREATE TABLE IF NOT EXISTS activity (
	id text PRIMARY KEY NOT NULL,
	record_id text NOT NULL,
	action text NOT NULL,
	label text NOT NULL,
	author text NOT NULL,
	time text NOT NULL
);
CREATE TABLE IF NOT EXISTS records (
	id text PRIMARY KEY NOT NULL,
	kind text NOT NULL,
	data text NOT NULL,
	revision integer DEFAULT 1 NOT NULL,
	deleted integer DEFAULT 0 NOT NULL,
	updated_at text NOT NULL,
	author text NOT NULL
);
CREATE TABLE IF NOT EXISTS migrations (
	name text PRIMARY KEY NOT NULL
);
`);
    globalForDb.saucybitesDb = db;
    return db;
  }
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
