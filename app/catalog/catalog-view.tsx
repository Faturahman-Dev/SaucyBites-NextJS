'use client';
import { useMemo, useState } from 'react';
import {
  Flame,
  Search,
  ShoppingBag,
  Sparkles,
  Store,
  X,
  AlertCircle,
  ArrowUpRight,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { CatalogProduct, StoreConfig } from '@/lib/catalog-types';
import { formatRupiah } from '@/utils/whatsapp';
import ProductCard from './product-card';
import CartDrawer from './cart-drawer';

const ALL_CATEGORY = 'Semua';

export default function CatalogView({
  products,
  store,
  loadError,
}: {
  products: CatalogProduct[];
  store: StoreConfig;
  loadError?: boolean;
}) {
  const { count, total, hydrated } = useCart();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL_CATEGORY);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));
    return [ALL_CATEGORY, ...unique];
  }, [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchCategory = category === ALL_CATEGORY || p.category === category;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [products, query, category]);

  const safeCount = hydrated ? count : 0;
  const safeTotal = hydrated ? total : 0;

  return (
    <div className="min-h-dvh bg-paper text-stone-900 flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <a href="/catalog" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand text-cream shadow-sm">
              <Flame className="h-5 w-5" />
            </span>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-forest">
                {store.name}
                <span className="text-brand">.</span>
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Katalog & Pesan Online
              </span>
            </div>
          </a>

          <div className="flex items-center gap-2.5">
            <a
              href="/"
              className="hidden items-center gap-1.5 rounded-full border border-stone-200 bg-stone-50 px-3.5 py-2 text-xs font-semibold text-stone-600 transition hover:bg-stone-100 sm:inline-flex"
            >
              <Store className="h-3.5 w-3.5" />
              Ruang Tim
              <ArrowUpRight className="h-3.5 w-3.5" />
            </a>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka keranjang belanja"
              className="relative inline-flex items-center gap-2 rounded-full bg-forest px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-forest-soft active:scale-95 sm:text-sm"
            >
              <ShoppingBag className="h-4 w-4 text-amber-300" />
              <span>Keranjang</span>
              {safeCount > 0 && (
                <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-extrabold tabular-nums text-white">
                  {safeCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <section className="border-b border-stone-200/70 bg-linear-to-b from-sand/80 to-paper">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
          <div className="max-w-2xl space-y-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-900">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              Pesan Langsung via WhatsApp
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight text-forest sm:text-4xl">
              Pilih menu favoritmu di {store.name}
            </h1>
            <p className="text-sm leading-relaxed text-stone-600 sm:text-base">
              {store.tagline}
            </p>
          </div>

          {/* Search & Category Filter Bar */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari menu, rasa, atau kategori…"
                aria-label="Cari produk"
                className="w-full rounded-full border border-stone-200/90 bg-white py-2.5 pl-10 pr-9 text-sm text-stone-900 shadow-xs outline-none transition placeholder:text-stone-400 focus:border-forest focus:ring-4 focus:ring-forest/10"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Hapus pencarian"
                  onClick={() => setQuery('')}
                  className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-stone-400 hover:bg-stone-100 hover:text-stone-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </label>

            {categories.length > 1 && (
              <div
                className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0"
                role="tablist"
                aria-label="Filter kategori produk"
              >
                {categories.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setCategory(cat)}
                      className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold transition ${
                        active
                          ? 'bg-forest text-white shadow-xs'
                          : 'border border-stone-200 bg-white text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Product Grid */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {loadError && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
            <p>
              Data katalog sedang dimuat ulang. Silakan segarkan halaman beberapa saat
              lagi.
            </p>
          </div>
        )}

        {products.length === 0 ? (
          <div className="mx-auto my-12 max-w-md rounded-3xl border border-stone-200/80 bg-white p-8 text-center shadow-xs">
            <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-2xl bg-cream text-brand">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-extrabold text-stone-900">
              Katalog menu segera hadir
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-stone-500">
              Tim {store.name} sedang menyiapkan daftar menu dan harga. Silakan kembali
              sebentar lagi!
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="mx-auto my-12 max-w-md rounded-3xl border border-stone-200/80 bg-white p-8 text-center shadow-xs">
            <h2 className="text-base font-bold text-stone-900">Menu tidak ditemukan</h2>
            <p className="mt-1 text-sm text-stone-500">
              Tidak ada menu yang cocok dengan pencarian &ldquo;{query}&rdquo; pada
              kategori <b>{category}</b>.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setCategory(ALL_CATEGORY);
              }}
              className="mt-4 rounded-full bg-brand px-4 py-2 text-xs font-bold text-white transition hover:bg-brand-dark"
            >
              Tampilkan semua menu
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 sm:gap-6 lg:grid-cols-4">
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {/* Sticky Bottom Checkout Bar on Mobile / Desktop when Cart has items */}
      {safeCount > 0 && (
        <div className="sticky bottom-4 z-20 mx-auto w-full max-w-xl px-4">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex w-full items-center justify-between gap-4 rounded-2xl bg-forest px-5 py-3.5 text-white shadow-xl shadow-stone-900/20 ring-1 ring-white/15 transition hover:bg-forest-soft active:scale-[0.99]"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand text-sm font-extrabold tabular-nums">
                {safeCount}
              </span>
              <div>
                <span className="block text-xs font-medium text-stone-300">
                  Total sementara
                </span>
                <strong className="text-base font-extrabold tabular-nums">
                  {formatRupiah(safeTotal)}
                </strong>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-3.5 py-2 text-xs font-extrabold sm:text-sm">
              Lanjut Checkout →
            </span>
          </button>
        </div>
      )}

      <footer className="mt-12 border-t border-stone-200/80 bg-white py-6 text-center text-xs text-stone-500">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 sm:flex-row sm:px-6">
          <span>
            <b className="font-bold text-stone-700">{store.name}</b> · Good bites. Better
            teamwork.
          </span>
          <a href="/" className="font-semibold text-stone-600 hover:text-brand">
            Masuk Ruang Tim →
          </a>
        </div>
      </footer>

      <CartDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} store={store} />
    </div>
  );
}
