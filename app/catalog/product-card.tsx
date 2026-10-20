'use client';
import { Flame, Minus, Plus } from 'lucide-react';
import { useCart, MAX_QTY } from '@/context/CartContext';
import { stockLabels, type CatalogProduct } from '@/lib/catalog-types';
import { formatRupiah } from '@/utils/whatsapp';

const badgeStyles = {
  available: 'bg-emerald-50 text-emerald-700 border-emerald-600/20',
  limited: 'bg-amber-50 text-amber-700 border-amber-600/20',
  soldout: 'bg-stone-100 text-stone-500 border-stone-400/30',
} as const;

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const { getQty, add, setQty, hydrated } = useCart();
  const qty = hydrated ? getQty(product.id) : 0;
  const soldOut = product.stockStatus === 'soldout';

  return (
    <article
      className={`group flex flex-col overflow-hidden rounded-2xl border border-stone-200/80 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
        soldOut ? 'opacity-70' : ''
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-linear-to-br from-sand to-cream">
        {product.image ? (
          // Images can be base64 data URLs or arbitrary hosts, so a plain <img> is used.
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${
              soldOut ? 'grayscale' : ''
            }`}
          />
        ) : (
          <div className="grid h-full w-full place-items-center text-brand/40">
            <Flame className="h-12 w-12" strokeWidth={1.5} />
          </div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold border backdrop-blur ${badgeStyles[product.stockStatus]}`}
        >
          {stockLabels[product.stockStatus]}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3 sm:p-4">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-stone-400">
          {product.category}
        </span>
        <h3 className="text-sm font-bold leading-snug text-stone-900 sm:text-base">
          {product.name}
        </h3>
        {product.description && (
          <p className="line-clamp-2 text-xs leading-relaxed text-stone-500 sm:text-sm">
            {product.description}
          </p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-3">
          <strong className="text-base font-extrabold tracking-tight text-forest sm:text-lg">
            {formatRupiah(product.price)}
          </strong>

          {soldOut ? (
            <span className="rounded-full bg-stone-100 px-3 py-2 text-xs font-semibold text-stone-500">
              Habis
            </span>
          ) : qty > 0 ? (
            <div className="flex items-center rounded-full bg-forest text-white shadow-sm">
              <button
                type="button"
                aria-label={`Kurangi ${product.name}`}
                onClick={() => setQty(product.id, qty - 1)}
                className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/10"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-6 text-center text-sm font-bold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                aria-label={`Tambah ${product.name}`}
                disabled={qty >= MAX_QTY}
                onClick={() => add(product.id)}
                className="grid h-9 w-9 place-items-center rounded-full transition hover:bg-white/10 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => add(product.id)}
              className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-dark active:scale-95 sm:text-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
