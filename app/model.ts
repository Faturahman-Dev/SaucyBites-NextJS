export type Kind =
  | 'ingredient'
  | 'product'
  | 'sale'
  | 'purchase'
  | 'expense'
  | 'equipment'
  | 'capital'
  | 'payout'
  | 'member';
export type Row = {
  id: string;
  kind: Kind;
  data: any;
  revision: number;
  updatedAt: string;
  author: string;
  deleted?: number;
};
export const menu = [
  {
    id: 'teriyaki',
    kind: 'product' as Kind,
    data: { name: 'Chicken Bites Teriyaki', price: 0, target: 0, lines: [] },
    revision: 0,
    updatedAt: '',
    author: '',
  },
  {
    id: 'bbq',
    kind: 'product' as Kind,
    data: { name: 'Chicken Bites BBQ', price: 0, target: 0, lines: [] },
    revision: 0,
    updatedAt: '',
    author: '',
  },
  {
    id: 'chocolate',
    kind: 'product' as Kind,
    data: { name: 'Milky Chocolate', price: 0, target: 0, lines: [] },
    revision: 0,
    updatedAt: '',
    author: '',
  },
];
export function products(rows: Row[]) {
  return [
    ...rows.filter((r) => r.kind === 'product'),
    ...menu.filter((m) => !rows.some((r) => r.id === m.id)),
  ];
}
export function hpp(product: Row, rows: Row[]) {
  const lines = product.data.lines || [];
  let cost = 0,
    ready = lines.length > 0;
  for (const line of lines) {
    const i = rows.find((r) => r.kind === 'ingredient' && r.id === line.ingredientId);
    if (!i || i.data.packQty <= 0 || i.data.price <= 0 || line.qty <= 0) {
      ready = false;
      continue;
    }
    cost += (i.data.price / i.data.packQty) * line.qty;
  }
  return { cost: Math.round(cost * 100) / 100, ready };
}
export function finance(rows: Row[]) {
  const sum = (kind: Kind, field: string) =>
    rows
      .filter((r) => r.kind === kind)
      .reduce((a, r) => a + Number(r.data[field] || 0), 0);
  const revenue = sum('sale', 'total'),
    cogs = sum('sale', 'costTotal'),
    expenses = sum('expense', 'amount');
  const cashExpenses = rows
    .filter((r) => r.kind === 'expense' && r.data.cashImpact !== 'Penyesuaian nonkas')
    .reduce((a, r) => a + r.data.amount, 0);
  const equipmentCash = sum('equipment', 'amount'),
    equipmentCost = rows
      .filter((r) => r.kind === 'equipment')
      .reduce((a, r) => a + r.data.amount / r.data.events, 0);
  const capital = sum('capital', 'amount'),
    purchases = sum('purchase', 'amount'),
    payouts = sum('payout', 'amount');
  const cashRevenue = rows
    .filter((r) => r.kind === 'sale' && r.data.method === 'Tunai')
    .reduce((a, r) => a + r.data.total, 0);
  return {
    revenue,
    cogs,
    expenses,
    cashExpenses,
    equipmentCash,
    equipmentCost,
    capital,
    purchases,
    payouts,
    profit: revenue - cogs - expenses - equipmentCost,
    cash: capital + revenue - purchases - cashExpenses - equipmentCash - payouts,
    cashRevenue,
    qrisRevenue: revenue - cashRevenue,
    units: sum('sale', 'qty'),
    gross: revenue - cogs,
  };
}
export function breakEven(rows: Row[]) {
  const ps = products(rows),
    total = ps.reduce((a, p) => a + p.data.target, 0);
  const ready =
    total > 0 &&
    ps
      .filter((p) => p.data.target > 0)
      .every((p) => hpp(p, rows).ready && p.data.price > 0);
  const contribution = total
    ? ps.reduce((a, p) => a + (p.data.price - hpp(p, rows).cost) * p.data.target, 0) /
      total
    : 0;
  const averagePrice = total
    ? ps.reduce((a, p) => a + p.data.price * p.data.target, 0) / total
    : 0;
  const f = finance(rows),
    fixed = f.expenses + f.equipmentCost;
  return {
    ready,
    contribution,
    averagePrice,
    fixed,
    total,
    units: ready && contribution > 0 ? Math.ceil(fixed / contribution) : null,
    projected: contribution * total - fixed,
  };
}
export const rupiah = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n);
export const today = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
