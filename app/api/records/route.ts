import { getDb, transaction, getClient, initDb, isTurso } from '@/lib/database';
import { getTeamUser } from '@/lib/auth';
import { hpp, products, type Kind } from '@/app/model';
import { z } from 'zod';
import { schemas } from '@/lib/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function load() {
  if (isTurso) {
    await initDb();
    const client = getClient();
    const res = await client.execute(
      'SELECT id, kind, data, revision, deleted, updated_at AS updatedAt, author FROM records WHERE deleted=0',
    );
    return res.rows.map((r: any) => ({
      ...r,
      kind: r.kind as Kind,
      data: JSON.parse(r.data as string),
    }));
  }
  return (
    getDb()
      .prepare(
        'SELECT id, kind, data, revision, deleted, updated_at AS updatedAt, author FROM records WHERE deleted=0',
      )
      .all() as any[]
  ).map((r) => ({ ...r, kind: r.kind as Kind, data: JSON.parse(r.data) }));
}

const json = (v: any, status = 200) =>
  Response.json(v, { status, headers: { 'Cache-Control': 'no-store' } });

export async function GET() {
  if (!(await getTeamUser()))
    return json({ error: 'Masuk untuk membuka data tim.' }, 401);
  try {
    if (isTurso) {
      await initDb();
      const client = getClient();
      const rows = await load();
      const actRes = await client.execute(
        'SELECT id, record_id AS recordId, action, label, author, time FROM activity ORDER BY time DESC LIMIT 40',
      );
      return json({
        rows,
        activity: actRes.rows,
        syncedAt: new Date().toISOString(),
      });
    }
    return json({
      rows: await load(),
      activity: getDb()
        .prepare(
          'SELECT id, record_id AS recordId, action, label, author, time FROM activity ORDER BY time DESC LIMIT 40',
        )
        .all(),
      syncedAt: new Date().toISOString(),
    });
  } catch {
    return json({ error: 'Data belum dapat dimuat. Coba lagi sebentar.' }, 503);
  }
}

export async function POST(req: Request) {
  return mutate(req, false);
}

export async function DELETE(req: Request) {
  return mutate(req, true);
}

async function mutate(req: Request, deleting: boolean) {
  const user = await getTeamUser();
  if (!user) return json({ error: 'Silakan masuk terlebih dahulu.' }, 401);
  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin)
    return json({ error: 'Asal permintaan tidak diizinkan.' }, 403);
  try {
    const text = await req.text();
    if (text.length > 50000) return json({ error: 'Data terlalu besar.' }, 413);
    const body = z
      .object({
        id: z.string().regex(/^[a-zA-Z0-9_-]{1,100}$/),
        kind: z.enum([
          'ingredient',
          'product',
          'sale',
          'purchase',
          'expense',
          'equipment',
          'capital',
          'payout',
          'member',
        ]),
        revision: z.number().int().min(0),
        data: z.unknown().optional(),
      })
      .parse(JSON.parse(text));

    if (
      user.role === 'member' &&
      (body.kind === 'member' || body.kind === 'payout' || body.kind === 'capital')
    ) {
      return json({ error: 'Fitur ini hanya dapat dikelola oleh Owner (Pemilik).' }, 403);
    }

    if (isTurso) {
      await initDb();
      const client = getClient();
      const tx = await client.transaction('write');
      try {
        const rowsRes = await tx.execute(
          'SELECT id, kind, data, revision, deleted, updated_at AS updatedAt, author FROM records WHERE deleted=0',
        );
        const rows = rowsRes.rows.map((r: any) => ({
          ...r,
          kind: r.kind as Kind,
          data: JSON.parse(r.data as string),
        }));
        const existing = rows.find((r) => r.id === body.id);

        if (
          existing &&
          (existing.revision !== body.revision || existing.kind !== body.kind)
        ) {
          await tx.rollback();
          return json(
            {
              error:
                'Data ini baru diubah anggota lain. Muat ulang, lalu ulangi perubahan.',
            },
            409,
          );
        }
        if (!existing && body.revision !== 0) {
          await tx.rollback();
          return json(
            { error: 'Data sudah dihapus atau berubah. Muat ulang data.' },
            409,
          );
        }
        if (deleting && !existing) {
          await tx.rollback();
          return json({ error: 'Data sudah tidak tersedia.' }, 404);
        }
        if (
          deleting &&
          body.kind === 'ingredient' &&
          products(rows).some((p) =>
            p.data.lines.some((l: any) => l.ingredientId === body.id),
          )
        ) {
          await tx.rollback();
          return json(
            { error: 'Bahan masih dipakai di resep. Hapus dari resep terlebih dahulu.' },
            400,
          );
        }
        if (
          deleting &&
          body.kind === 'product' &&
          rows.some((r) => r.kind === 'sale' && r.data.productId === body.id)
        ) {
          await tx.rollback();
          return json(
            { error: 'Produk memiliki riwayat penjualan dan harus tetap tersedia.' },
            400,
          );
        }

        let data: any = existing?.data;
        if (!deleting) {
          data = schemas[body.kind].parse(body.data);
          if (
            body.kind === 'ingredient' &&
            existing &&
            existing.data.unit !== data.unit &&
            products(rows).some((p) =>
              p.data.lines.some((l: any) => l.ingredientId === body.id),
            )
          ) {
            await tx.rollback();
            return json(
              {
                error:
                  'Satuan bahan yang dipakai di resep tidak boleh diubah. Buat bahan baru.',
              },
              400,
            );
          }
          if (body.kind === 'product') {
            const ids = data.lines.map((l: any) => l.ingredientId);
            if (
              new Set(ids).size !== ids.length ||
              ids.some(
                (id: string) => !rows.some((r) => r.kind === 'ingredient' && r.id === id),
              )
            ) {
              await tx.rollback();
              return json({ error: 'Pilih bahan yang valid, tanpa duplikasi.' }, 400);
            }
          }
          if (body.kind === 'sale') {
            if (existing) {
              await tx.rollback();
              return json(
                {
                  error: 'Untuk koreksi penjualan, batalkan transaksi lalu catat ulang.',
                },
                400,
              );
            }
            const p = products(rows).find((p) => p.id === data.productId);
            if (!p) {
              await tx.rollback();
              return json({ error: 'Produk tidak ditemukan.' }, 400);
            }
            const cost = hpp(p, rows);
            if (!cost.ready || p.data.price <= 0) {
              await tx.rollback();
              return json(
                {
                  error:
                    'Lengkapi harga jual dan resep produk sebelum mencatat penjualan.',
                },
                400,
              );
            }
            const total = p.data.price * data.qty - data.discount;
            if (total < 0) {
              await tx.rollback();
              return json({ error: 'Diskon tidak boleh melebihi nilai transaksi.' }, 400);
            }
            data = {
              ...data,
              productName: p.data.name,
              unitPrice: p.data.price,
              unitCost: cost.cost,
              total,
              costTotal: Math.round(cost.cost * data.qty * 100) / 100,
            };
          }
        }

        const time = new Date().toISOString(),
          author = user.displayName;
        const values = {
          data: JSON.stringify(data),
          revision: body.revision + 1,
          updatedAt: time,
          author,
          deleted: deleting ? 1 : 0,
        };

        const changed = (
          existing
            ? (
                await tx.execute({
                  sql: 'UPDATE records SET data=?,revision=?,updated_at=?,author=?,deleted=? WHERE id=? AND revision=? AND deleted=0 RETURNING id,kind,data,revision,deleted,updated_at AS updatedAt,author',
                  args: [
                    values.data,
                    values.revision,
                    time,
                    author,
                    values.deleted,
                    body.id,
                    body.revision,
                  ],
                })
              ).rows
            : (
                await tx.execute({
                  sql: 'INSERT OR IGNORE INTO records (id,kind,data,revision,deleted,updated_at,author) VALUES (?,?,?,?,?,?,?) RETURNING id,kind,data,revision,deleted,updated_at AS updatedAt,author',
                  args: [
                    body.id,
                    body.kind,
                    values.data,
                    values.revision,
                    values.deleted,
                    time,
                    author,
                  ],
                })
              ).rows
        ) as any[];

        if (!changed.length) {
          await tx.rollback();
          return json(
            { error: 'Perubahan bertabrakan dengan anggota lain. Muat ulang data.' },
            409,
          );
        }

        await tx.execute({
          sql: 'INSERT INTO activity (id,record_id,action,label,author,time) VALUES (?,?,?,?,?,?)',
          args: [
            crypto.randomUUID(),
            body.id,
            deleting ? 'Membatalkan' : existing ? 'Mengubah' : 'Menambah',
            data.name || data.productName || body.kind,
            author,
            time,
          ],
        });

        await tx.commit();
        return json({
          ok: true,
          row: { ...changed[0], data: JSON.parse(changed[0].data as string) },
        });
      } catch (e) {
        try {
          await tx.rollback();
        } catch {}
        throw e;
      }
    }

    // Local SQLite fallback using atomic synchronous transaction
    return transaction((db) => {
      const rows = (
          db
            .prepare(
              'SELECT id, kind, data, revision, deleted, updated_at AS updatedAt, author FROM records WHERE deleted=0',
            )
            .all() as any[]
        ).map((r) => ({ ...r, kind: r.kind as Kind, data: JSON.parse(r.data) })),
        existing = rows.find((r) => r.id === body.id);
      if (
        existing &&
        (existing.revision !== body.revision || existing.kind !== body.kind)
      )
        return json(
          {
            error:
              'Data ini baru diubah anggota lain. Muat ulang, lalu ulangi perubahan.',
          },
          409,
        );
      if (!existing && body.revision !== 0)
        return json({ error: 'Data sudah dihapus atau berubah. Muat ulang data.' }, 409);
      if (deleting && !existing)
        return json({ error: 'Data sudah tidak tersedia.' }, 404);
      if (
        deleting &&
        body.kind === 'ingredient' &&
        products(rows).some((p) =>
          p.data.lines.some((l: any) => l.ingredientId === body.id),
        )
      )
        return json(
          { error: 'Bahan masih dipakai di resep. Hapus dari resep terlebih dahulu.' },
          400,
        );
      if (
        deleting &&
        body.kind === 'product' &&
        rows.some((r) => r.kind === 'sale' && r.data.productId === body.id)
      )
        return json(
          { error: 'Produk memiliki riwayat penjualan dan harus tetap tersedia.' },
          400,
        );
      let data: any = existing?.data;
      if (!deleting) {
        data = schemas[body.kind].parse(body.data);
        if (
          body.kind === 'ingredient' &&
          existing &&
          existing.data.unit !== data.unit &&
          products(rows).some((p) =>
            p.data.lines.some((l: any) => l.ingredientId === body.id),
          )
        )
          return json(
            {
              error:
                'Satuan bahan yang dipakai di resep tidak boleh diubah. Buat bahan baru.',
            },
            400,
          );
        if (body.kind === 'product') {
          const ids = data.lines.map((l: any) => l.ingredientId);
          if (
            new Set(ids).size !== ids.length ||
            ids.some(
              (id: string) => !rows.some((r) => r.kind === 'ingredient' && r.id === id),
            )
          )
            return json({ error: 'Pilih bahan yang valid, tanpa duplikasi.' }, 400);
        }
        if (body.kind === 'sale') {
          if (existing)
            return json(
              { error: 'Untuk koreksi penjualan, batalkan transaksi lalu catat ulang.' },
              400,
            );
          const p = products(rows).find((p) => p.id === data.productId);
          if (!p) return json({ error: 'Produk tidak ditemukan.' }, 400);
          const cost = hpp(p, rows);
          if (!cost.ready || p.data.price <= 0)
            return json(
              {
                error: 'Lengkapi harga jual dan resep produk sebelum mencatat penjualan.',
              },
              400,
            );
          const total = p.data.price * data.qty - data.discount;
          if (total < 0)
            return json({ error: 'Diskon tidak boleh melebihi nilai transaksi.' }, 400);
          data = {
            ...data,
            productName: p.data.name,
            unitPrice: p.data.price,
            unitCost: cost.cost,
            total,
            costTotal: Math.round(cost.cost * data.qty * 100) / 100,
          };
        }
      }
      const time = new Date().toISOString(),
        author = user.displayName;
      const values = {
        data: JSON.stringify(data),
        revision: body.revision + 1,
        updatedAt: time,
        author,
        deleted: deleting ? 1 : 0,
      };
      const changed = (
        existing
          ? db
              .prepare(
                'UPDATE records SET data=?,revision=?,updated_at=?,author=?,deleted=? WHERE id=? AND revision=? AND deleted=0 RETURNING id,kind,data,revision,deleted,updated_at AS updatedAt,author',
              )
              .all(
                values.data,
                values.revision,
                time,
                author,
                values.deleted,
                body.id,
                body.revision,
              )
          : db
              .prepare(
                'INSERT OR IGNORE INTO records (id,kind,data,revision,deleted,updated_at,author) VALUES (?,?,?,?,?,?,?) RETURNING id,kind,data,revision,deleted,updated_at AS updatedAt,author',
              )
              .all(
                body.id,
                body.kind,
                values.data,
                values.revision,
                values.deleted,
                time,
                author,
              )
      ) as any[];
      if (!changed.length)
        return json(
          { error: 'Perubahan bertabrakan dengan anggota lain. Muat ulang data.' },
          409,
        );
      db.prepare(
        'INSERT INTO activity (id,record_id,action,label,author,time) VALUES (?,?,?,?,?,?)',
      ).run(
        crypto.randomUUID(),
        body.id,
        deleting ? 'Membatalkan' : existing ? 'Mengubah' : 'Menambah',
        data.name || data.productName || body.kind,
        author,
        time,
      );
      return json({
        ok: true,
        row: { ...changed[0], data: JSON.parse(changed[0].data) },
      });
    });
  } catch (e) {
    if (e instanceof z.ZodError || e instanceof SyntaxError || e instanceof RangeError)
      return json(
        { error: 'Input belum valid. Periksa nama, tanggal, dan angka pada formulir.' },
        400,
      );
    return json(
      {
        error:
          'Penyimpanan gagal. Muat ulang untuk memastikan status sebelum mencoba lagi.',
      },
      503,
    );
  }
}
