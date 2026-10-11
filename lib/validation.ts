import { z } from 'zod';
const name = z.string().trim().min(1).max(120),
  money = z.number().finite().positive().max(1e9),
  qty = z.number().finite().positive().max(1e8);
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (v) => new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v,
    'Tanggal tidak valid',
  );
const note = z.string().trim().max(500).default('');
export const schemas = {
  ingredient: z.object({
    name,
    price: money,
    packQty: qty,
    unit: z.enum(['g', 'ml', 'pcs']),
  }),
  product: z.object({
    name,
    price: z.number().finite().min(0).max(1e9),
    target: z.number().int().min(0).max(1e6),
    lines: z.array(z.object({ ingredientId: z.string().min(1).max(100), qty })).max(100),
  }),
  sale: z.object({
    productId: z.string().min(1).max(100),
    qty: z.number().int().positive().max(1e6),
    discount: z.number().finite().min(0).max(1e9),
    method: z.enum(['Tunai', 'QRIS']),
    date,
    note,
  }),
  purchase: z.object({ name, amount: money, date, note }),
  expense: z.object({
    name,
    amount: money,
    date,
    note,
    cashImpact: z.enum(['Kas keluar', 'Penyesuaian nonkas']).default('Kas keluar'),
  }),
  equipment: z.object({
    name,
    amount: money,
    events: z.number().int().min(1).max(10000),
    date,
    note,
  }),
  capital: z.object({
    name,
    amount: money,
    type: z.enum(['Setoran', 'Pinjaman']),
    date,
    note,
  }),
  payout: z.object({
    name,
    amount: money,
    type: z.enum(['Bagi laba', 'Pengembalian modal', 'Pelunasan pinjaman']),
    date,
    note,
  }),
  member: z.object({ name, share: z.number().finite().positive().max(100) }),
};
