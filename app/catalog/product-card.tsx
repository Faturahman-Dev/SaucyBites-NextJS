'use client';
import { Minus, Plus } from 'lucide-react';
import { useCart, MAX_QTY } from '@/context/CartContext';
import { stockLabels, type CatalogProduct } from '@/lib/catalog-types';
import { formatRupiah } from '@/utils/whatsapp';

const badgeStyles = {
  available: 'bg-[#edf4e9] text-[#2d5222] border-[#c8dcc0]',
  limited: 'bg-[#fff2d8] text-[#7a4f13] border-[#e8cfa0]',
  soldout: 'bg-[#f3f3ed] text-[#52614f] border-[#d6d9ce]',
} as const;

export default function ProductCard({ product }: { product: CatalogProduct }) {
  const { getQty, add, setQty, hydrated } = useCart();
  const qty = hydrated ? getQty(product.id) : 0;
  const soldOut = product.stockStatus === 'soldout';
  const hasImage = Boolean(product.image);

  return (
    <article
      className={`flex flex-col overflow-hidden rounded-2xl border border-[#e7e9e2] bg-white ${
        soldOut ? 'opacity-75' : ''
      }`}
    >
      {hasImage ? (
        <div className="relative aspect-[16/10] overflow-hidden border-b border-[#e7e9e2] bg-[#f6f7f2]">
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className={`h-full w-full object-cover ${soldOut ? 'grayscale' : ''}`}
          />
          <span
            className={`absolute left-3 top-3 rounded-[5px] border px-2.5 py-1 text-xs font-bold ${badgeStyles[product.stockStatus]}`}
          >
            {stockLabels[product.stockStatus]}
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3 px-4 pt-4">
          <span
            aria-hidden="true"
            className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#fae5c4] text-lg font-extrabold text-[#7a4b12]"
          >
            {product.name.charAt(0).toUpperCase()}
          </span>
          <span
            className={`rounded-[5px] border px-2.5 py-1 text-xs font-bold ${badgeStyles[product.stockStatus]}`}
          >
            {stockLabels[product.stockStatus]}
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <span className="text-xs font-bold text-[#52614f]">{product.category}</span>
        <h3 className="text-base font-bold leading-snug text-[#222b25]">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs leading-relaxed text-[#52614f]">{product.description}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-[#f0f2eb] pt-3.5">
          <strong className="text-lg font-extrabold tracking-tight tabular-nums text-[#21362c]">
            {formatRupiah(product.price)}
          </strong>

          {soldOut ? (
            <span className="inline-flex min-h-11 items-center rounded-[9px] bg-[#f3f3ed] px-3.5 text-xs font-bold text-[#52614f]">
              Stok habis
            </span>
          ) : qty > 0 ? (
            <div className="inline-flex items-center rounded-[9px] bg-[#21362c] text-white">
              <button
                type="button"
                aria-label={`Kurangi ${product.name}`}
                onClick={() => setQty(product.id, qty - 1)}
                className="grid h-11 w-11 place-items-center rounded-l-[9px] transition hover:bg-[#304c3d]"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="min-w-8 px-1 text-center text-sm font-bold tabular-nums">
                {qty}
              </span>
              <button
                type="button"
                aria-label={`Tambah ${product.name}`}
                disabled={qty >= MAX_QTY}
                onClick={() => add(product.id)}
                className="grid h-11 w-11 place-items-center rounded-r-[9px] transition hover:bg-[#304c3d] disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => add(product.id)}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-[9px] bg-brand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark sm:text-sm"
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
