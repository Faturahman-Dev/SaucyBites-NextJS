'use client';
import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { useCart, MAX_QTY } from '@/context/CartContext';
import type { StoreConfig } from '@/lib/catalog-types';
import {
  buildOrderMessage,
  buildWhatsAppUrl,
  formatRupiah,
  isValidIndonesianPhone,
  type CustomerInfo,
} from '@/utils/whatsapp';

const CUSTOMER_KEY = 'saucybites_customer_v1';
const emptyCustomer: CustomerInfo = { name: '', phone: '', address: '', note: '' };
type Errors = Partial<Record<keyof CustomerInfo, string>>;

function validate(c: CustomerInfo): Errors {
  const errors: Errors = {};
  if (c.name.trim().length < 2) errors.name = 'Isi nama pemesan.';
  if (!isValidIndonesianPhone(c.phone))
    errors.phone = 'Nomor WhatsApp tidak valid. Contoh: 081234567890';
  if (c.address.trim().length < 5) errors.address = 'Isi alamat pengiriman lengkap.';
  return errors;
}

const inputClass = (error?: string) =>
  `w-full rounded-xl border bg-white px-3.5 py-2.5 text-base text-stone-900 outline-none transition placeholder:text-stone-400 focus:ring-4 sm:text-sm ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-100'
      : 'border-stone-200 focus:border-forest focus:ring-forest/10'
  }`;

export default function CartDrawer({
  open,
  onClose,
  store,
}: {
  open: boolean;
  onClose: () => void;
  store: StoreConfig;
}) {
  const { items, count, total, hasUnavailable, setQty, add, remove, clear } = useCart();
  const [customer, setCustomer] = useState<CustomerInfo>(emptyCustomer);
  const [errors, setErrors] = useState<Errors>({});
  const [sentUrl, setSentUrl] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  // Remember the customer's contact details on this device (not the note).
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null');
      if (saved && typeof saved === 'object')
        setCustomer((c) => ({
          ...c,
          name: String(saved.name || ''),
          phone: String(saved.phone || ''),
          address: String(saved.address || ''),
        }));
    } catch {}
  }, []);

  // Lock page scroll, close with Escape, and move focus into the drawer.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  const update = (key: keyof CustomerInfo, value: string) => {
    setCustomer((c) => ({ ...c, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const orderable = items.filter((i) => !i.unavailable);
  const canCheckout = orderable.length > 0 && !hasUnavailable && !!store.whatsappNumber;

  function checkout(e: React.FormEvent) {
    e.preventDefault();
    const found = validate(customer);
    setErrors(found);
    if (Object.keys(found).length || !canCheckout) return;

    const message = buildOrderMessage(
      store.name,
      orderable.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
      customer,
    );
    const url = buildWhatsAppUrl(store.whatsappNumber, message);
    try {
      localStorage.setItem(
        CUSTOMER_KEY,
        JSON.stringify({
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
        }),
      );
    } catch {}
    // Opened synchronously inside the submit handler so mobile browsers don't block it.
    const win = window.open(url, '_blank');
    if (win) win.opener = null;
    else window.location.href = url;
    setSentUrl(url);
  }

  function finish() {
    clear();
    setCustomer((c) => ({ ...c, note: '' }));
    setSentUrl('');
    onClose();
  }

  return (
    <div
      className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}
      inert={!open}
    >
      <button
        type="button"
        tabIndex={-1}
        aria-label="Tutup keranjang"
        onClick={onClose}
        className={`absolute inset-0 bg-stone-950/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Keranjang belanja"
        className={`absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-3xl bg-paper shadow-2xl transition-transform duration-300 ease-out sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-3xl ${
          open
            ? 'translate-y-0 sm:translate-x-0'
            : 'translate-y-full sm:translate-x-full sm:translate-y-0'
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-stone-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-stone-900">
              Keranjang
            </h2>
            <p className="text-xs text-stone-500">
              {count > 0 ? `${count} porsi dipilih` : 'Belum ada menu dipilih'}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup keranjang"
            className="grid h-10 w-10 place-items-center rounded-full text-stone-500 transition hover:bg-stone-200/60 hover:text-stone-900"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {sentUrl ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-stone-900">
                Pesanan siap dikirim!
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-stone-500">
                WhatsApp sudah dibuka dengan pesan pesananmu. Tekan <b>kirim</b> di
                WhatsApp agar pesanan diterima {store.name}.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2">
              <a
                href={sentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm font-bold text-stone-700 transition hover:bg-stone-50"
              >
                <MessageCircle className="h-4 w-4" />
                Buka WhatsApp lagi
              </a>
              <button
                type="button"
                onClick={finish}
                className="rounded-xl bg-forest px-4 py-3 text-sm font-bold text-white transition hover:bg-forest-soft"
              >
                Selesai & kosongkan keranjang
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="grid h-16 w-16 place-items-center rounded-full bg-cream text-brand">
              <ShoppingBag className="h-7 w-7" />
            </div>
            <h3 className="text-base font-bold text-stone-900">Keranjang masih kosong</h3>
            <p className="text-sm text-stone-500">
              Pilih menu favoritmu lalu tekan tombol <b>Tambah</b>.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 rounded-full bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Lihat menu
            </button>
          </div>
        ) : (
          <form onSubmit={checkout} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">
              <ul className="divide-y divide-stone-200 rounded-2xl border border-stone-200 bg-white">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 p-3">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-cream">
                      {item.image && (
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold leading-snug text-stone-900">
                          {item.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          aria-label={`Hapus ${item.name}`}
                          className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.unavailable ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-red-600">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Stok habis — hapus untuk lanjut
                        </span>
                      ) : (
                        <span className="text-xs text-stone-500">
                          {formatRupiah(item.price)} / porsi
                        </span>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-full border border-stone-200">
                          <button
                            type="button"
                            aria-label={`Kurangi ${item.name}`}
                            onClick={() => setQty(item.id, item.qty - 1)}
                            className="grid h-8 w-8 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100"
                          >
                            <Minus className="h-3.5 w-3.5" />
                          </button>
                          <span className="min-w-7 text-center text-sm font-bold tabular-nums">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Tambah ${item.name}`}
                            disabled={item.unavailable || item.qty >= MAX_QTY}
                            onClick={() => add(item.id)}
                            className="grid h-8 w-8 place-items-center rounded-full text-stone-600 transition hover:bg-stone-100 disabled:opacity-40"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <strong className="text-sm font-extrabold tabular-nums text-stone-900">
                          {item.unavailable ? '—' : formatRupiah(item.subtotal)}
                        </strong>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <fieldset className="space-y-3">
                <legend className="mb-1 text-sm font-extrabold text-stone-900">
                  Data pemesan
                </legend>
                <Field label="Nama" error={errors.name}>
                  <input
                    value={customer.name}
                    onChange={(e) => update('name', e.target.value)}
                    autoComplete="name"
                    maxLength={60}
                    placeholder="Nama lengkap"
                    className={inputClass(errors.name)}
                  />
                </Field>
                <Field label="Nomor WhatsApp" error={errors.phone}>
                  <input
                    value={customer.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                    placeholder="081234567890"
                    className={inputClass(errors.phone)}
                  />
                </Field>
                <Field label="Alamat pengiriman" error={errors.address}>
                  <textarea
                    value={customer.address}
                    onChange={(e) => update('address', e.target.value)}
                    autoComplete="street-address"
                    rows={2}
                    maxLength={300}
                    placeholder="Jalan, nomor rumah, patokan, kecamatan"
                    className={inputClass(errors.address) + ' resize-none'}
                  />
                </Field>
                <Field label="Catatan tambahan (opsional)">
                  <textarea
                    value={customer.note}
                    onChange={(e) => update('note', e.target.value)}
                    rows={2}
                    maxLength={200}
                    placeholder="Contoh: saus dipisah, tanpa wijen"
                    className={inputClass() + ' resize-none'}
                  />
                </Field>
              </fieldset>
            </div>

            <footer className="space-y-3 border-t border-stone-200 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-stone-500">Total belanja</span>
                <strong className="text-xl font-extrabold tracking-tight text-forest">
                  {formatRupiah(total)}
                </strong>
              </div>
              {!store.whatsappNumber && (
                <p className="flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-xs leading-relaxed text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Nomor WhatsApp toko belum diatur. Hubungi admin {store.name}.
                </p>
              )}
              {hasUnavailable && (
                <p className="text-xs font-semibold text-red-600">
                  Hapus menu yang stoknya habis untuk melanjutkan.
                </p>
              )}
              <button
                type="submit"
                disabled={!canCheckout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-4 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-[#1ebe5a] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                <MessageCircle className="h-5 w-5" />
                Kirim Pesanan via WhatsApp
              </button>
            </footer>
          </form>
        )}
      </aside>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-stone-600">{label}</span>
      {children}
      {error && (
        <span className="mt-1 block text-xs font-medium text-red-600">{error}</span>
      )}
    </label>
  );
}
