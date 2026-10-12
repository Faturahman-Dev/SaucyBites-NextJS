import { DatabaseSync } from 'node:sqlite';
import { createClient } from '@libsql/client';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

if (process.env.TURSO_DATABASE_URL) {
  console.log('Menginisialisasi Turso database di:', process.env.TURSO_DATABASE_URL);
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  const name = '0001_initial.sql';
  const sql = readFileSync(
    new URL('../migrations/' + name, import.meta.url),
    'utf8',
  ).replace(/--> statement-breakpoint/g, ';');
  await client.execute(
    'CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY NOT NULL)',
  );
  const res = await client.execute({
    sql: 'SELECT name FROM migrations WHERE name=?',
    args: [name],
  });
  if (!res.rows.length) {
    await client.executeMultiple(sql);
    await client.execute({
      sql: 'INSERT INTO migrations (name) VALUES (?)',
      args: [name],
    });
  }
  console.log('Turso database siap!');
} else {
  const filename = path.resolve(process.env.DATABASE_PATH || './data/saucybites.sqlite');
  mkdirSync(path.dirname(filename), { recursive: true });
  const db = new DatabaseSync(filename);
  try {
    db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
    db.exec('CREATE TABLE IF NOT EXISTS migrations (name TEXT PRIMARY KEY NOT NULL)');
    const name = '0001_initial.sql';
    if (!db.prepare('SELECT name FROM migrations WHERE name=?').get(name)) {
      db.exec('BEGIN IMMEDIATE');
      try {
        db.exec(readFileSync(new URL('../migrations/' + name, import.meta.url), 'utf8'));
        db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    }
    console.log('Database siap:', filename);
  } finally {
    db.close();
  }
}
