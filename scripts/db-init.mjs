import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
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
