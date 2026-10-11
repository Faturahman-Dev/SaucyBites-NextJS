import { DatabaseSync } from 'node:sqlite';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { schemas } from '../lib/validation.ts';
const filename = process.argv[2];
if (!filename)
  throw new Error('Gunakan: npm run db:import -- /path/SaucyBites-cadangan.json');
if (statSync(filename).size > 50 * 1024 * 1024)
  throw new Error('Cadangan terlalu besar (maksimal 50 MB).');
const kinds = z.enum([
  'ingredient',
  'product',
  'sale',
  'purchase',
  'expense',
  'equipment',
  'capital',
  'payout',
  'member',
]);
const base = z.object({
  id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
  kind: kinds,
  data: z.unknown(),
  revision: z.number().int().min(1),
  updatedAt: z.string().datetime(),
  author: z.string().max(2000),
  deleted: z.literal(0).optional(),
});
const backup = z
  .object({ app: z.literal('SaucyBites'), rows: z.array(base).max(100000) })
  .parse(JSON.parse(readFileSync(filename, 'utf8')));
const ids = new Set<string>();
const rows = backup.rows.map((row) => {
  if (ids.has(row.id)) throw new Error('ID duplikat: ' + row.id);
  ids.add(row.id);
  const data =
    row.kind === 'sale'
      ? schemas.sale
          .extend({
            productName: z.string().min(1).max(120),
            unitPrice: z.number().finite().positive(),
            unitCost: z.number().finite().nonnegative(),
            total: z.number().finite().nonnegative(),
            costTotal: z.number().finite().nonnegative(),
          })
          .parse(row.data)
      : schemas[row.kind].parse(row.data);
  if (row.kind === 'sale') {
    const d = data as z.infer<typeof schemas.sale> & {
      unitPrice: number;
      unitCost: number;
      total: number;
      costTotal: number;
    };
    if (
      Math.abs(d.total - (d.unitPrice * d.qty - d.discount)) > 0.01 ||
      Math.abs(d.costTotal - Math.round(d.unitCost * d.qty * 100) / 100) > 0.01
    )
      throw new Error('Hitungan penjualan tidak valid: ' + row.id);
  }
  return { ...row, data };
});
for (const row of rows) {
  if (row.kind === 'product') {
    const lines = (row.data as z.infer<typeof schemas.product>).lines;
    if (
      new Set(lines.map((l) => l.ingredientId)).size !== lines.length ||
      lines.some(
        (l) => !rows.some((r) => r.id === l.ingredientId && r.kind === 'ingredient'),
      )
    )
      throw new Error('Referensi bahan resep tidak valid: ' + row.id);
  }
  if (
    row.kind === 'sale' &&
    !rows.some(
      (r) =>
        r.kind === 'product' &&
        r.id === (row.data as z.infer<typeof schemas.sale>).productId,
    )
  )
    throw new Error('Produk penjualan tidak tersedia: ' + row.id);
}
const dbPath = path.resolve(process.env.DATABASE_PATH || './data/saucybites.sqlite');
if (!existsSync(dbPath)) throw new Error('Jalankan npm run db:init terlebih dahulu.');
const db = new DatabaseSync(dbPath);
try {
  db.exec('PRAGMA busy_timeout=5000; BEGIN IMMEDIATE;');
  try {
    const count = db.prepare('SELECT count(*) AS total FROM records').get() as {
      total: number;
    };
    if (count.total !== 0)
      throw new Error(
        'Impor hanya diizinkan ke database kosong. Gunakan DATABASE_PATH baru agar data lama tetap aman.',
      );
    const insert = db.prepare(
      'INSERT INTO records (id,kind,data,revision,deleted,updated_at,author) VALUES (?,?,?,?,0,?,?)',
    );
    for (const row of rows)
      insert.run(
        row.id,
        row.kind,
        JSON.stringify(row.data),
        row.revision,
        row.updatedAt,
        row.author,
      );
    db.prepare(
      'INSERT INTO activity (id,record_id,action,label,author,time) VALUES (?,?,?,?,?,?)',
    ).run(
      crypto.randomUUID(),
      'backup',
      'Mengimpor',
      rows.length + ' catatan dari cadangan',
      'Pemilik server',
      new Date().toISOString(),
    );
    db.exec('COMMIT');
    console.log(
      rows.length +
        ' catatan berhasil diimpor. Riwayat harga/HPP penjualan dipertahankan.',
    );
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
} finally {
  db.close();
}
