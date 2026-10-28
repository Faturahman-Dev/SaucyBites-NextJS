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
import type { CustomerUser } from '@/lib/session';
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
    errors.phone = 'Nomor WhatsApp belum valid (gunakan awalan 08 atau 628).';
  if (c.address.trim().length < 5) errors.address = 'Isi alamat pengiriman lengkap.';
  return errors;
}

const inputClass = (error?: string) =>
  `w-full rounded-[9px] border bg-[#fafbf7] px-3.5 py-2.5 text-base text-[#222b25] transition placeholder:text-[#687a5c] focus-visible:outline-3 focus-visible:outline-[#ebac64] focus-visible:outline-offset-2 sm:text-sm ${
    error ? 'border-[#c64335] bg-[#fff8f6]' : 'border-[#d6ddd0]'
  }`;

export default function CartDrawer({
  open,
  onClose,
  store,
  customerSession,
}: {
  open: boolean;
  onClose: () => void;
  store: StoreConfig;
  customerSession?: CustomerUser | null;
}) {
  const { items, count, total, hasUnavailable, setQty, add, remove, clear } = useCart();
  const [customer, setCustomer] = useState<CustomerInfo>(() => ({
    ...emptyCustomer,
    name: customerSession?.name || '',
    phone: customerSession?.phone || '',
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [sentUrl, setSentUrl] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CUSTOMER_KEY) || 'null');
      if (saved && typeof saved === 'object') {
        setCustomer((c) => ({
          ...c,
          name: String(saved.name || customerSession?.name || ''),
          phone: String(saved.phone || customerSession?.phone || ''),
          address: String(saved.address || ''),
        }));
      } else if (customerSession) {
        setCustomer((c) => ({
          ...c,
          name: c.name || customerSession.name,
          phone: c.phone || customerSession.phone || '',
        }));
      }
    } catch {}
  }, [customerSession]);

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
        className={`absolute inset-0 bg-[#1b2d23]/65 transition-opacity duration-200 ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Formulir pemesanan dan keranjang"
        className={`absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-2xl border-t border-[#e7e9e2] bg-[#f7f7f2] shadow-2xl transition-transform duration-200 ease-out sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[440px] sm:rounded-none sm:rounded-l-2xl sm:border-l sm:border-t-0 ${
          open
            ? 'translate-y-0 sm:translate-x-0'
            : 'translate-y-full sm:translate-x-full sm:translate-y-0'
        }`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-[#e7e9e2] bg-white px-5 py-4">
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-[#222b25]">
              Detail Pesanan
            </h2>
            <p className="text-xs text-[#52614f]">
              {count > 0 ? `${count} porsi siap dipesan` : 'Belum ada menu dipilih'}
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Tutup keranjang"
            className="grid h-11 w-11 place-items-center rounded-[9px] text-[#52614f] transition hover:bg-[#f0f2eb] hover:text-[#222b25]"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        {sentUrl ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-10 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#edf4e9] text-[#275d46]">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-[#222b25]">
                Format pesanan sudah siap di WhatsApp
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-[#52614f]">
                Jendela WhatsApp telah dibuka. Tekan tombol kirim pada aplikasi WhatsApp
                agar pesanan diterima oleh {store.name}.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2.5">
              <a
                href={sentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[9px] border border-[#d6ddd0] bg-white px-4 py-2.5 text-sm font-bold text-[#222b25] transition hover:bg-[#f7f8f3]"
              >
                <MessageCircle className="h-4 w-4" />
                Buka ulang tautan WhatsApp
              </a>
              <button
                type="button"
                onClick={finish}
                className="min-h-11 rounded-[9px] bg-[#21362c] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#2d4636]"
              >
                Selesai dan kosongkan keranjang
              </button>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#fae5c4] text-[#7a4b12]">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-[#222b25]">Keranjang masih kosong</h3>
            <p className="text-sm text-[#52614f]">
              Pilih menu pada daftar katalog lalu tekan tombol <b>Tambah</b> untuk mulai
              menyusun pesanan.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-2 min-h-11 rounded-[9px] bg-brand px-5 py-2.5 text-sm font-bold text-white transition hover:bg-brand-dark"
            >
              Kembali ke daftar menu
            </button>
          </div>
        ) : (
          <form onSubmit={checkout} noValidate className="flex min-h-0 flex-1 flex-col">
            <div className="flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-4">
              <ul className="divide-y divide-[#e7e9e2] rounded-2xl border border-[#e7e9e2] bg-white">
                {items.map((item) => (
                  <li key={item.id} className="flex gap-3 p-3.5">
                    {item.image ? (
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-[#e7e9e2] bg-[#f6f7f2]">
                        <img
                          src={item.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    ) : (
                      <span
                        aria-hidden="true"
                        className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#fae5c4] text-base font-extrabold text-[#7a4b12]"
                      >
                        {item.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-bold leading-snug text-[#222b25]">
                          {item.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => remove(item.id)}
                          aria-label={`Hapus ${item.name} dari keranjang`}
                          className="-mr-2 -mt-2 grid h-11 w-11 shrink-0 place-items-center rounded-[9px] text-[#52614f] transition hover:bg-[#fce9e4] hover:text-[#b72c20]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      {item.unavailable ? (
                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-[#b72c20]">
                          <AlertCircle className="h-3.5 w-3.5" />
                          Stok habis: hapus item ini untuk melanjutkan
                        </span>
                      ) : (
                        <span className="text-xs text-[#52614f]">
                          {formatRupiah(item.price)} / porsi
                        </span>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2.5">
                        <div className="inline-flex items-center rounded-[9px] border border-[#d6ddd0] bg-[#fafbf7]">
                          <button
                            type="button"
                            aria-label={`Kurangi ${item.name}`}
                            onClick={() => setQty(item.id, item.qty - 1)}
                            className="grid h-11 w-11 place-items-center rounded-l-[9px] text-[#222b25] transition hover:bg-[#eef1e7]"
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <span className="min-w-8 text-center text-sm font-bold tabular-nums text-[#222b25]">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            aria-label={`Tambah ${item.name}`}
                            disabled={item.unavailable || item.qty >= MAX_QTY}
                            onClick={() => add(item.id)}
                            className="grid h-11 w-11 place-items-center rounded-r-[9px] text-[#222b25] transition hover:bg-[#eef1e7] disabled:opacity-40"
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                        <strong className="text-sm font-extrabold tabular-nums text-[#21362c]">
                          {item.unavailable ? 'Habis' : formatRupiah(item.subtotal)}
                        </strong>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <fieldset className="space-y-3 rounded-2xl border border-[#e7e9e2] bg-white p-4">
                <legend className="px-1 text-sm font-extrabold text-[#222b25]">
                  Data Pemesan
                </legend>
                <Field label="Nama Pemesan" error={errors.name}>
                  <input
                    value={customer.name}
                    onChange={(e) => update('name', e.target.value)}
                    autoComplete="name"
                    maxLength={60}
                    placeholder="Masukkan nama penerima"
                    className={inputClass(errors.name)}
                  />
                </Field>
                <Field label="Nomor WhatsApp Aktif" error={errors.phone}>
                  <input
                    value={customer.phone}
                    onChange={(e) => update('phone', e.target.value)}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={20}
                    placeholder="0812xxxxxxxx"
                    className={inputClass(errors.phone)}
                  />
                </Field>
                <Field label="Alamat Pengiriman" error={errors.address}>
                  <textarea
                    value={customer.address}
                    onChange={(e) => update('address', e.target.value)}
                    autoComplete="street-address"
                    rows={2}
                    maxLength={300}
                    placeholder="Jalan, nomor rumah, patokan, atau lokasi ambil"
                    className={inputClass(errors.address) + ' resize-none'}
                  />
                </Field>
                <Field label="Catatan Tambahan (Opsional)">
                  <textarea
                    value={customer.note}
                    onChange={(e) => update('note', e.target.value)}
                    rows={2}
                    maxLength={200}
                    placeholder="Opsional: permintaan saus, jam ambil, dll."
                    className={inputClass() + ' resize-none'}
                  />
                </Field>
              </fieldset>
            </div>

            <footer className="space-y-3 border-t border-[#e7e9e2] bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm font-semibold text-[#52614f]">
                  Total Belanja
                </span>
                <strong className="text-xl font-extrabold tracking-tight tabular-nums text-[#21362c]">
                  {formatRupiah(total)}
                </strong>
              </div>
              {!store.whatsappNumber && (
                <p className="flex items-start gap-2 rounded-[9px] border border-[#f1e0c7] bg-[#fff4e4] p-3 text-xs leading-relaxed text-[#7a4f13]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  Nomor WhatsApp toko belum dikonfigurasi pada server. Isi variabel
                  STORE_WHATSAPP_NUMBER untuk mengaktifkan pengiriman pesanan.
                </p>
              )}
              {hasUnavailable && (
                <p className="text-xs font-semibold text-[#b72c20]">
                  Hapus menu yang stoknya habis untuk melanjutkan pemesanan.
                </p>
              )}
              <button
                type="submit"
                disabled={!canCheckout}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-[9px] bg-brand px-4 py-3 text-sm font-extrabold text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
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
      <span className="mb-1.5 block text-xs font-bold text-[#465c3a]">{label}</span>
      {children}
      {error && (
        <span className="mt-1 block text-xs font-semibold text-[#b72c20]">{error}</span>
      )}
    </label>
  );
}
