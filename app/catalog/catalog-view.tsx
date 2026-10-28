'use client';
import { useMemo, useState } from 'react';
import {
  AlertCircle,
  Flame,
  LogOut,
  MessageCircle,
  Search,
  ShoppingBag,
  UserCheck,
  X,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import type { CatalogProduct, StoreConfig } from '@/lib/catalog-types';
import type { CustomerUser } from '@/lib/session';
import { formatRupiah } from '@/utils/whatsapp';
import ProductCard from './product-card';
import CartDrawer from './cart-drawer';

const ALL_CATEGORY = 'Semua Menu';

export default function CatalogView({
  products,
  store,
  loadError,
  customerSession,
}: {
  products: CatalogProduct[];
  store: StoreConfig;
  loadError?: boolean;
  customerSession?: CustomerUser | null;
}) {
  const { items, count, total, hydrated } = useCart();
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
  const safeItems = hydrated ? items.filter((i) => !i.unavailable) : [];

  return (
    <div className="flex min-h-dvh flex-col bg-[#f7f7f2] text-[#222b25]">
      {/* Masthead: uses SaucyBites forest green identity */}
      <header className="border-b border-[#304c3d] bg-[#21362c] text-[#dfe8df]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <a href="/catalog" className="flex items-center gap-3">
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] bg-brand text-[#ffe5be]">
              <Flame className="h-6 w-6" />
            </span>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white">
                {store.name}
                <span className="text-[#ffc866]">.</span>
              </span>
              <span className="block text-xs text-[#bcccbf]">Pemesanan Pelanggan</span>
            </div>
          </a>

          <div className="flex items-center gap-2.5">
            {customerSession ? (
              <div className="hidden items-center gap-2 rounded-[9px] border border-[#3c5141] bg-[#2d4636] px-3 py-1.5 text-xs text-[#e1eadd] sm:inline-flex">
                <UserCheck className="h-3.5 w-3.5 text-[#ffc866]" />
                <div className="leading-tight">
                  <strong className="block font-bold text-white">
                    {customerSession.name}
                  </strong>
                  <span className="text-[11px] text-[#bcccbf]">
                    {customerSession.email}
                  </span>
                </div>
                <a
                  href="/logout?role=customer"
                  title="Keluar akun Customer"
                  aria-label="Keluar akun Customer"
                  className="ml-1 grid h-8 w-8 place-items-center rounded-[7px] text-[#c5d5c8] transition hover:bg-[#3c5545] hover:text-white"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </a>
              </div>
            ) : (
              <a
                href="/login?role=customer"
                className="hidden min-h-11 items-center rounded-[9px] border border-[#3c5141] bg-[#2d4636] px-3.5 py-2 text-xs font-semibold text-[#e1eadd] transition hover:bg-[#3c5545] sm:inline-flex"
              >
                Login Customer
              </a>
            )}

            <a
              href="/"
              className="hidden min-h-11 items-center rounded-[9px] border border-[#3c5141] bg-[#2d4636] px-3.5 py-2 text-xs font-semibold text-[#e1eadd] transition hover:bg-[#3c5545] md:inline-flex"
            >
              Ruang Tim
            </a>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka keranjang belanja"
              className="inline-flex min-h-11 items-center gap-2 rounded-[9px] bg-brand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark sm:text-sm"
            >
              <ShoppingBag className="h-4 w-4" />
              <span>Keranjang</span>
              <span className="rounded-[5px] bg-black/25 px-2 py-0.5 text-xs font-extrabold tabular-nums text-white">
                {safeCount}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Menu Header & Filter Controls */}
      <section className="border-b border-[#e7e9e2] bg-white">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <div className="max-w-2xl">
            <h1 className="text-2xl font-extrabold tracking-tight text-[#222b25] sm:text-3xl">
              Daftar Menu {store.name}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[#52614f] sm:text-base">
              {store.tagline}
            </p>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative flex-1 sm:max-w-md">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52614f]" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari nama menu atau kategori…"
                aria-label="Cari produk"
                className="min-h-11 w-full rounded-[9px] border border-[#d6ddd0] bg-[#fafbf7] py-2.5 pl-10 pr-11 text-base text-[#222b25] transition placeholder:text-[#687a5c] focus-visible:outline-3 focus-visible:outline-[#ebac64] focus-visible:outline-offset-2 sm:text-sm"
              />
              {query && (
                <button
                  type="button"
                  aria-label="Hapus kata kunci pencarian"
                  onClick={() => setQuery('')}
                  className="absolute right-0 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-[9px] text-[#52614f] hover:text-[#222b25]"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </label>

            {categories.length > 1 && (
              <div
                className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0"
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
                      className={`min-h-11 shrink-0 rounded-[9px] px-4 py-2 text-xs font-bold transition sm:text-sm ${
                        active
                          ? 'bg-[#21362c] text-white'
                          : 'border border-[#d6ddd0] bg-[#fafbf7] text-[#44513d] hover:bg-[#eef1e7]'
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

      {/* Main Content: 2-Column Asymmetric Layout (Menu Grid + Live Order Ticket on Desktop) */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
        {loadError && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-2xl border border-[#f1e0c7] bg-[#fff4e4] p-4 text-sm text-[#7a4f13]"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <div>
              <strong className="block font-bold">Gagal memuat daftar menu</strong>
              <p className="mt-0.5">
                Koneksi ke penyimpanan data sedang terganggu. Muat ulang halaman ini untuk
                mencoba kembali.
              </p>
            </div>
          </div>
        )}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          {/* Left Column: Product List */}
          <div>
            {products.length === 0 ? (
              <div className="rounded-2xl border border-[#e7e9e2] bg-white p-8 text-center">
                <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-[#f3f5ee] text-[#52614f]">
                  <ShoppingBag className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-[#222b25]">
                  Belum ada menu yang dipublikasikan
                </h2>
                <p className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-[#52614f]">
                  Menu akan tampil di halaman ini setelah Owner atau tim mengisi harga
                  jual di Ruang Tim (Menu & resep).
                </p>
                <a
                  href="/"
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[9px] border border-[#d6ddd0] bg-[#fafbf7] px-4 py-2.5 text-xs font-bold text-[#222b25] transition hover:bg-[#eef1e7]"
                >
                  Buka Ruang Tim
                </a>
              </div>
            ) : filtered.length === 0 ? (
              <div className="rounded-2xl border border-[#e7e9e2] bg-white p-8 text-center">
                <h2 className="text-base font-bold text-[#222b25]">
                  Menu tidak ditemukan
                </h2>
                <p className="mt-1.5 text-sm text-[#52614f]">
                  Tidak ada menu yang cocok dengan kata kunci &ldquo;{query}&rdquo; pada
                  kategori <b>{category}</b>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    setCategory(ALL_CATEGORY);
                  }}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-[9px] bg-brand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-brand-dark"
                >
                  Reset pencarian & filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Live Order Ticket (Struk Ringkasan Pesanan) */}
          <aside
            aria-label="Ringkasan pesanan"
            className="rounded-2xl border border-[#eee1ca] bg-[#fff2dc] p-5 lg:sticky lg:top-6"
          >
            <div className="flex items-center justify-between gap-2 border-b border-[#e6d5b8] pb-3.5">
              <div>
                <h2 className="text-base font-extrabold text-[#443721]">
                  Ringkasan Pesanan
                </h2>
                <p className="text-xs text-[#685432]">
                  {safeCount > 0
                    ? `${safeCount} porsi dalam keranjang`
                    : 'Pilih menu di samping'}
                </p>
              </div>
              <ShoppingBag className="h-5 w-5 text-[#7a4b12]" />
            </div>

            {safeItems.length === 0 ? (
              <p className="py-6 text-xs leading-relaxed text-[#685432]">
                Belum ada menu yang dipilih. Tekan tombol <b>Tambah</b> pada menu untuk
                menghitung total belanja dan memesan lewat WhatsApp.
              </p>
            ) : (
              <ul className="divide-y divide-[#ebd9bc] py-2 text-xs text-[#443721]">
                {safeItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-baseline justify-between gap-3 py-2.5"
                  >
                    <span className="font-semibold">
                      {item.name}{' '}
                      <b className="font-extrabold tabular-nums">x{item.qty}</b>
                    </span>
                    <strong className="shrink-0 font-bold tabular-nums">
                      {formatRupiah(item.subtotal)}
                    </strong>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-[#e6d5b8] pt-3.5">
              <div className="mb-3.5 flex items-baseline justify-between">
                <span className="text-xs font-bold text-[#685432]">Total Belanja</span>
                <strong className="text-lg font-extrabold tabular-nums text-[#21362c]">
                  {formatRupiah(safeTotal)}
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                disabled={safeCount === 0}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-[#21362c] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#2d4636] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
              >
                <MessageCircle className="h-4 w-4" />
                Isi Data Pemesan & Pesan WA
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile Sticky Bottom Checkout Bar */}
      {safeCount > 0 && (
        <div className="sticky bottom-3 z-20 mx-auto w-full max-w-xl px-4 lg:hidden">
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            className="flex min-h-14 w-full items-center justify-between gap-4 rounded-2xl border border-[#3c5141] bg-[#21362c] px-4 py-3 text-white shadow-xl"
          >
            <div className="flex items-center gap-3 text-left">
              <span className="grid h-9 w-9 place-items-center rounded-[9px] bg-brand text-sm font-extrabold tabular-nums">
                {safeCount}
              </span>
              <div>
                <span className="block text-xs text-[#bcccbf]">Total sementara</span>
                <strong className="text-base font-extrabold tabular-nums">
                  {formatRupiah(safeTotal)}
                </strong>
              </div>
            </div>
            <span className="rounded-[9px] bg-brand px-3.5 py-2 text-xs font-extrabold">
              Lanjut Pesan
            </span>
          </button>
        </div>
      )}

      <footer className="mt-10 border-t border-[#e7e9e2] bg-white py-6 text-xs text-[#52614f]">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <span>
            <b className="font-bold text-[#222b25]">{store.name}</b> · Good bites. Better
            teamwork.
          </span>
          <div className="flex items-center gap-3">
            <a
              href="/login?role=customer"
              className="inline-flex min-h-11 items-center px-2 font-semibold text-[#21362c] underline-offset-4 hover:underline"
            >
              {customerSession ? `Akun: ${customerSession.email}` : 'Login Customer'}
            </a>
            <a
              href="/"
              className="inline-flex min-h-11 items-center px-2 font-semibold text-[#21362c] underline-offset-4 hover:underline"
            >
              Masuk Ruang Tim
            </a>
          </div>
        </div>
      </footer>

      <CartDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        store={store}
        customerSession={customerSession}
      />
    </div>
  );
}
