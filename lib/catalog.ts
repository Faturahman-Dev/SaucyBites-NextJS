// Server-only loader for the public catalog. It reads the same `records` table that
// the internal HPP/menu module writes to, then whitelists only customer-safe fields
// (no HPP, recipe lines, or authors leave the server).
import { getDb, getClient, initDb, isTurso } from '@/lib/database';
import { products, type Row } from '@/app/model';
import { normalizePhone, isValidWhatsAppNumber } from '@/utils/whatsapp';
import {
  STOCK_STATUSES,
  UNCATEGORIZED,
  type CatalogProduct,
  type StockStatus,
  type StoreConfig,
} from '@/lib/catalog-types';

const PRODUCT_SQL =
  "SELECT id, kind, data, revision, updated_at AS updatedAt, author FROM records WHERE deleted=0 AND kind='product'";

async function loadProductRows(): Promise<Row[]> {
  if (isTurso) {
    await initDb();
    const res = await getClient().execute(PRODUCT_SQL);
    return res.rows.map((r: any) => ({
      id: String(r.id),
      kind: 'product',
      data: JSON.parse(String(r.data)),
      revision: Number(r.revision),
      updatedAt: String(r.updatedAt),
      author: String(r.author),
    }));
  }
  return (getDb().prepare(PRODUCT_SQL).all() as any[]).map((r) => ({
    ...r,
    kind: 'product',
    data: JSON.parse(r.data),
  }));
}

const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

/** Pure mapping, exported for tests. Hidden or unpriced menus are not shown. */
export function toCatalogProducts(rows: Row[]): CatalogProduct[] {
  const list = products(rows)
    .filter((p) => p.data?.published !== false && Number(p.data?.price) > 0)
    .map((p) => {
      const status = p.data.stockStatus as StockStatus;
      return {
        id: p.id,
        name: text(p.data.name) || 'Menu',
        price: Number(p.data.price),
        image: text(p.data.image),
        description: text(p.data.description),
        category: text(p.data.category) || UNCATEGORIZED,
        stockStatus: STOCK_STATUSES.includes(status) ? status : 'available',
      } satisfies CatalogProduct;
    });
  // Keep the team's menu order, but push sold-out items to the end.
  return list.sort(
    (a, b) => Number(a.stockStatus === 'soldout') - Number(b.stockStatus === 'soldout'),
  );
}

export async function getCatalogProducts(): Promise<CatalogProduct[]> {
  return toCatalogProducts(await loadProductRows());
}

const cleanEnv = (v: string | undefined) =>
  (v || '')
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();

export function getStoreConfig(): StoreConfig {
  const phone = normalizePhone(
    cleanEnv(
      process.env.STORE_WHATSAPP_NUMBER || process.env.NEXT_PUBLIC_WHATSAPP_NUMBER,
    ),
  );
  return {
    name:
      cleanEnv(process.env.STORE_NAME || process.env.NEXT_PUBLIC_STORE_NAME) ||
      'SaucyBites',
    tagline:
      cleanEnv(process.env.STORE_TAGLINE) ||
      'Chicken bites saucy & minuman manis. Pilih menu, kirim pesanan lewat WhatsApp.',
    whatsappNumber: isValidWhatsAppNumber(phone) ? phone : '',
  };
}
