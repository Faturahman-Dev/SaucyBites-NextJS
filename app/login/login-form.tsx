'use client';

import { useMemo, useState } from 'react';
import {
  Crown,
  Users,
  ShoppingBag,
  LockKeyhole,
  UserPlus,
  Mail,
  Search,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import type { CustomerUser, LoginTabRole } from '@/lib/session';
import type { TeamAccountPublic } from '@/lib/users';
import { stockLabels, type CatalogProduct } from '@/lib/catalog-types';
import { formatRupiah } from '@/utils/whatsapp';

const ALL_CATEGORY = 'Semua';

const badgeStyles = {
  available: 'bg-[#edf4e9] text-[#2d5222] border-[#c8dcc0]',
  limited: 'bg-[#fff2d8] text-[#7a4f13] border-[#e8cfa0]',
  soldout: 'bg-[#f3f3ed] text-[#52614f] border-[#d6d9ce]',
} as const;

export default function LoginForm({
  initialRole = 'owner',
  initialMode = 'signin',
  loginAction,
  loginConfigured,
  isDev,
  accountSummary,
  catalogProducts,
  storeName,
  customerSession,
}: {
  initialRole?: LoginTabRole;
  initialMode?: 'signin' | 'signup';
  loginAction: (formData: FormData) => void;
  loginConfigured: boolean;
  isDev: boolean;
  accountSummary: {
    count: number;
    max: number;
    remaining: number;
    accounts: TeamAccountPublic[];
  };
  catalogProducts: CatalogProduct[];
  storeName: string;
  customerSession: CustomerUser | null;
}) {
  const [role, setRole] = useState<LoginTabRole>(initialRole);
  const [mode, setMode] = useState<'signin' | 'signup'>(
    accountSummary.count === 0 && initialMode === 'signin' ? 'signup' : initialMode,
  );
  const [emailInput, setEmailInput] = useState('');
  const [catalogQuery, setCatalogQuery] = useState('');
  const [catalogCategory, setCatalogCategory] = useState(ALL_CATEGORY);

  const quotaFull = accountSummary.count >= accountSummary.max;
  const effectiveMode = quotaFull && mode === 'signup' ? 'signin' : mode;

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(catalogProducts.map((p) => p.category).filter(Boolean)),
    );
    return [ALL_CATEGORY, ...unique];
  }, [catalogProducts]);

  const filteredProducts = useMemo(() => {
    const q = catalogQuery.trim().toLowerCase();
    return catalogProducts.filter((p) => {
      const matchCategory =
        catalogCategory === ALL_CATEGORY || p.category === catalogCategory;
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [catalogProducts, catalogQuery, catalogCategory]);

  return (
    <div>
      <div className="login-role-tabs" role="tablist" aria-label="Pilih peran login">
        <button
          type="button"
          role="tab"
          aria-selected={role === 'owner'}
          className={`login-role-tab ${role === 'owner' ? 'active owner-tab' : ''}`}
          onClick={() => setRole('owner')}
        >
          <Crown size={20} />
          <div>
            <strong>Pemilik (Owner)</strong>
            <small className="block">Akses Penuh</small>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={role === 'member'}
          className={`login-role-tab ${role === 'member' ? 'active' : ''}`}
          onClick={() => setRole('member')}
        >
          <Users size={20} />
          <div>
            <strong>Anggota Tim</strong>
            <small className="block">Kasir &amp; Catatan</small>
          </div>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={role === 'customer'}
          className={`login-role-tab ${role === 'customer' ? 'active customer-tab' : ''}`}
          onClick={() => setRole('customer')}
        >
          <ShoppingBag size={20} />
          <div>
            <strong>Customer</strong>
            <small className="block">Katalog Produk</small>
          </div>
        </button>
      </div>

      {role === 'customer' ? (
        <div className="space-y-6">
          {customerSession && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#c8dcc0] bg-[#edf4e9] p-3.5 text-xs text-[#21362c]">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[#275d46]" />
                <div>
                  <strong className="block font-bold">
                    Sesi Customer Aktif: {customerSession.name}
                  </strong>
                  <span className="text-[#3d5a34]">{customerSession.email}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="/catalog"
                  className="inline-flex min-h-11 items-center rounded-[9px] bg-[#21362c] px-3.5 py-2 text-xs font-bold text-white transition hover:bg-[#2d4636]"
                >
                  Buka Katalog Penuh
                </a>
                <a
                  href="/logout?role=customer"
                  className="inline-flex min-h-11 items-center rounded-[9px] border border-[#bfd0b8] bg-white px-3 py-2 text-xs font-bold text-[#21362c] transition hover:bg-[#f4f7f2]"
                >
                  Ganti Akun
                </a>
              </div>
            </div>
          )}

          <form
            action={loginAction}
            className="rounded-2xl border border-[#e7e9e2] bg-[#fafbf7] p-4 sm:p-5"
          >
            <input type="hidden" name="role" value="customer" />
            <input type="hidden" name="auth_mode" value="customer" />

            <div className="mb-4">
              <h2 className="text-base font-extrabold text-[#21362c]">
                Login Customer &amp; Pesan Menu
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#52614f]">
                Masukkan nama dan alamat Gmail Anda untuk mulai memesan dari katalog
                produk {storeName}.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <label className="field" style={{ marginBottom: 0 }}>
                <span>Nama Customer</span>
                <input
                  name="name"
                  defaultValue={customerSession?.name || ''}
                  placeholder="Nama lengkap pemesan"
                  autoComplete="name"
                  required
                  maxLength={80}
                />
              </label>

              <label className="field" style={{ marginBottom: 0 }}>
                <span>Email Gmail (@gmail.com)</span>
                <input
                  name="email"
                  type="email"
                  defaultValue={customerSession?.email || ''}
                  placeholder="nama@gmail.com"
                  autoComplete="email"
                  required
                  maxLength={120}
                />
              </label>
            </div>

            <label className="field" style={{ marginTop: '14px', marginBottom: '16px' }}>
              <span>Nomor WhatsApp (Opsional)</span>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                defaultValue={customerSession?.phone || ''}
                placeholder="0812xxxxxxxx (untuk konfirmasi pesanan)"
                autoComplete="tel"
                maxLength={20}
              />
            </label>

            <button className="btn primary wide" type="submit">
              <ShoppingBag size={17} />
              Masuk &amp; Buka Katalog Produk
            </button>
          </form>

          {/* Katalog Produk di dalam halaman Login Customer */}
          <section
            aria-label="Katalog produk untuk customer"
            className="rounded-2xl border border-[#e7e9e2] bg-[#fff2dc]/55 p-4 sm:p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e6d8be] pb-3.5">
              <div>
                <h2 className="text-base font-extrabold text-[#21362c]">
                  Katalog Produk {storeName}
                </h2>
                <p className="text-xs text-[#52614f]">
                  {catalogProducts.length > 0
                    ? `${catalogProducts.length} menu aktif siap dipesan oleh Customer`
                    : 'Daftar menu akan tampil setelah dipublikasikan oleh tim'}
                </p>
              </div>
              <a
                href="/catalog"
                className="inline-flex min-h-11 items-center gap-1.5 rounded-[9px] border border-[#d0c3a8] bg-white px-3.5 py-2 text-xs font-bold text-[#21362c] transition hover:bg-[#f4f6ef]"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Halaman Katalog Penuh
              </a>
            </div>

            {catalogProducts.length > 0 && (
              <div className="mt-3.5 space-y-2.5">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#52614f]" />
                  <input
                    type="search"
                    value={catalogQuery}
                    onChange={(e) => setCatalogQuery(e.target.value)}
                    placeholder="Cari menu di katalog..."
                    aria-label="Cari menu di katalog"
                    className="min-h-11 w-full rounded-[9px] border border-[#d6ddd0] bg-white py-2 pl-9 pr-3 text-sm text-[#222b25] placeholder:text-[#52614f]"
                  />
                </label>

                {categories.length > 1 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {categories.map((cat) => {
                      const active = catalogCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setCatalogCategory(cat)}
                          className={`min-h-11 shrink-0 rounded-[9px] px-3 py-1.5 text-xs font-bold transition ${
                            active
                              ? 'bg-[#21362c] text-white'
                              : 'border border-[#d6ddd0] bg-white text-[#44513d] hover:bg-[#eef1e7]'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4">
              {catalogProducts.length === 0 ? (
                <div className="rounded-xl border border-[#e7e9e2] bg-white p-5 text-center">
                  <p className="text-xs font-semibold text-[#222b25]">
                    Belum ada menu yang dipublikasikan di katalog.
                  </p>
                  <p className="mt-1 text-xs text-[#52614f]">
                    Silakan masuk sebagai Owner atau Anggota Tim untuk menambahkan menu
                    dan harga jual.
                  </p>
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="rounded-xl border border-[#e7e9e2] bg-white p-5 text-center">
                  <p className="text-xs font-semibold text-[#222b25]">
                    Tidak ada menu yang cocok dengan pencarian &ldquo;{catalogQuery}
                    &rdquo;.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setCatalogQuery('');
                      setCatalogCategory(ALL_CATEGORY);
                    }}
                    className="mt-2.5 inline-flex min-h-11 items-center rounded-[9px] bg-[#21362c] px-3.5 py-2 text-xs font-bold text-white"
                  >
                    Tampilkan Semua Menu
                  </button>
                </div>
              ) : (
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {filteredProducts.map((item) => {
                    const soldOut = item.stockStatus === 'soldout';
                    return (
                      <li
                        key={item.id}
                        className="flex flex-col justify-between rounded-xl border border-[#e7e9e2] bg-white p-3.5"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="h-10 w-10 shrink-0 rounded-lg border border-[#e7e9e2] object-cover"
                                />
                              ) : (
                                <span
                                  aria-hidden="true"
                                  className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#fae5c4] text-sm font-extrabold text-[#7a4b12]"
                                >
                                  {item.name.charAt(0).toUpperCase()}
                                </span>
                              )}
                              <div className="min-w-0">
                                <span className="block text-[11px] font-bold text-[#52614f]">
                                  {item.category}
                                </span>
                                <strong className="block truncate text-sm font-bold text-[#222b25]">
                                  {item.name}
                                </strong>
                              </div>
                            </div>
                            <span
                              className={`shrink-0 rounded-[5px] border px-2 py-0.5 text-[10px] font-bold ${badgeStyles[item.stockStatus]}`}
                            >
                              {stockLabels[item.stockStatus]}
                            </span>
                          </div>

                          {item.description && (
                            <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-[#52614f]">
                              {item.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#f0f2eb] pt-2.5">
                          <strong className="text-sm font-extrabold tabular-nums text-[#21362c]">
                            {formatRupiah(item.price)}
                          </strong>
                          <span className="text-[11px] font-bold text-[#52614f]">
                            {soldOut ? 'Stok habis' : 'Siap dipesan'}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      ) : (
        <form action={loginAction}>
          <input type="hidden" name="role" value={role} />
          <input type="hidden" name="auth_mode" value={effectiveMode} />

          {/* Status Kuota Maksimal 4 Akun Gmail di Database */}
          <div className="quota-banner">
            <div className="quota-header">
              <span className="flex items-center gap-1.5 font-bold">
                <Mail size={15} />
                Database Akun Gmail (@gmail.com)
              </span>
              <span className={`quota-pill ${quotaFull ? 'full' : ''}`}>
                {accountSummary.count} / {accountSummary.max} Akun Terdaftar
              </span>
            </div>
            <p className="text-xs leading-relaxed text-[#52614f]">
              {quotaFull
                ? 'Kuota maksimal 4 akun Gmail telah penuh. Hanya akun Gmail yang sudah terdaftar di bawah yang dapat masuk.'
                : `Tersisa ${accountSummary.remaining} slot pendaftaran. Hanya email berdomain @gmail.com yang diizinkan (maksimal ${accountSummary.max} akun).`}
            </p>

            {accountSummary.accounts.length > 0 ? (
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {accountSummary.accounts.map((acc) => (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => {
                      setRole(acc.role);
                      setMode('signin');
                      setEmailInput(acc.email);
                    }}
                    title="Klik untuk mengisi email ini pada form login"
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-[7px] border border-[#cfd8c7] bg-white px-2.5 py-1 text-xs font-semibold text-[#21362c] transition hover:bg-[#eef2e9]"
                  >
                    <span>{acc.email}</span>
                    <span
                      className={`rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold ${
                        acc.role === 'owner'
                          ? 'bg-[#fef08a] text-[#63350d]'
                          : 'bg-[#dcfce7] text-[#14532d]'
                      }`}
                    >
                      {acc.role === 'owner' ? 'Owner' : 'Tim'}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs font-semibold text-[#21362c]">
                Belum ada akun terdaftar. Daftarkan akun @gmail.com pertama Anda di bawah.
              </p>
            )}
          </div>

          <div className="auth-mode-switch" role="tablist" aria-label="Mode autentikasi">
            <button
              type="button"
              role="tab"
              aria-selected={effectiveMode === 'signin'}
              className={`auth-mode-btn ${effectiveMode === 'signin' ? 'active' : ''}`}
              onClick={() => setMode('signin')}
            >
              Masuk Akun Terdaftar
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={effectiveMode === 'signup'}
              disabled={quotaFull}
              className={`auth-mode-btn ${effectiveMode === 'signup' ? 'active' : ''}`}
              onClick={() => setMode('signup')}
            >
              {quotaFull
                ? 'Kuota Penuh (4/4)'
                : `Daftar Akun Gmail (${accountSummary.remaining} sisa)`}
            </button>
          </div>

          {effectiveMode === 'signup' && (
            <label className="field">
              <span>{role === 'owner' ? 'Nama Pemilik' : 'Nama Anggota Tim'}</span>
              <input
                name="name"
                key={`name-${role}`}
                defaultValue={role === 'owner' ? 'Owner' : ''}
                placeholder={
                  role === 'owner' ? 'Nama Anda sebagai pemilik' : 'Nama Anda di tim'
                }
                autoComplete="name"
                required
                minLength={2}
                maxLength={80}
              />
            </label>
          )}

          <label className="field">
            <span>Alamat Email Gmail (Wajib @gmail.com)</span>
            <input
              name="email"
              type="email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={
                role === 'owner' ? 'owner.usaha@gmail.com' : 'kasir.tim@gmail.com'
              }
              autoComplete="email"
              required
              maxLength={120}
            />
            <small>
              Hanya akun dengan domain <strong>@gmail.com</strong> yang diterima oleh
              database (maksimal 4 akun).
            </small>
          </label>

          <label className="field">
            <span>
              {effectiveMode === 'signup'
                ? 'Buat Password Akun (Min. 6 Karakter)'
                : 'Password Akun'}
            </span>
            <input
              name="password"
              type="password"
              autoComplete={
                effectiveMode === 'signup' ? 'new-password' : 'current-password'
              }
              placeholder={
                effectiveMode === 'signup'
                  ? 'Minimal 6 karakter'
                  : 'Masukkan password akun Gmail ini'
              }
              required
              minLength={effectiveMode === 'signup' ? 6 : 1}
              maxLength={1000}
            />
          </label>

          <button
            className="btn primary wide"
            disabled={!loginConfigured}
            type="submit"
          >
            {effectiveMode === 'signup' ? (
              <>
                <UserPlus size={17} />
                {role === 'owner'
                  ? 'Daftarkan Gmail sebagai Owner'
                  : 'Daftarkan Gmail sebagai Anggota'}
              </>
            ) : (
              <>
                <LockKeyhole size={17} />
                {role === 'owner' ? 'Masuk sebagai Owner' : 'Masuk sebagai Anggota'}
              </>
            )}
          </button>

          {isDev && (
            <div className="quick-login-box">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                }}
              >
                <Zap size={15} color="#b45309" />
                <span>Mode Dev: Akses Cepat 1-Klik (@gmail.com)</span>
              </div>
              <div className="quick-login-actions">
                <button
                  type="submit"
                  name="quick_role"
                  value="owner"
                  formNoValidate
                  className="btn subtle"
                  style={{ fontSize: '12px' }}
                >
                  <Crown size={14} /> Dev Owner
                </button>
                <button
                  type="submit"
                  name="quick_role"
                  value="member"
                  formNoValidate
                  className="btn subtle"
                  style={{ fontSize: '12px' }}
                >
                  <Users size={14} /> Dev Anggota
                </button>
                <button
                  type="submit"
                  name="quick_role"
                  value="customer"
                  formNoValidate
                  className="btn subtle"
                  style={{ fontSize: '12px' }}
                >
                  <ShoppingBag size={14} /> Dev Customer
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
