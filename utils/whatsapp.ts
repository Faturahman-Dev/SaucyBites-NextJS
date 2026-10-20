// Pure helpers for the WhatsApp checkout. No React / Node APIs so it can be used
// on the client, on the server, and in unit tests.

export type OrderLine = { name: string; qty: number; price: number };

export type CustomerInfo = {
  name: string;
  phone: string;
  address: string;
  note?: string;
};

/** Converts 0812-3456-7890 / +62 812 3456 7890 / 812... into 6281234567890. */
export function normalizePhone(input: string): string {
  let digits = (input || '').replace(/\D/g, '');
  if (digits.startsWith('0')) digits = '62' + digits.slice(1);
  else if (digits.startsWith('8')) digits = '62' + digits;
  return digits;
}

/** Indonesian mobile number (08xx / 628xx), 10–15 digits after normalization. */
export function isValidIndonesianPhone(input: string): boolean {
  return /^628\d{7,12}$/.test(normalizePhone(input));
}

/** Any international number usable with wa.me (country code + number). */
export function isValidWhatsAppNumber(normalized: string): boolean {
  return /^[1-9]\d{7,14}$/.test(normalized);
}

const numberFormat = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });

/** 30000 -> "Rp 30.000" */
export function formatRupiah(value: number): string {
  return 'Rp ' + numberFormat.format(Math.round(value || 0));
}

export function orderTotal(lines: OrderLine[]): number {
  return lines.reduce((sum, l) => sum + l.price * l.qty, 0);
}

const oneLine = (v: string | undefined) => (v || '').replace(/\s+/g, ' ').trim();

export function buildOrderMessage(
  storeName: string,
  lines: OrderLine[],
  customer: CustomerInfo,
): string {
  const items = lines
    .map((l) => `- ${oneLine(l.name)} (x${l.qty}) - ${formatRupiah(l.price * l.qty)}`)
    .join('\n');
  const address = (customer.address || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .join(', ');
  return [
    `Halo ${oneLine(storeName)}, saya ingin memesan:`,
    '',
    items,
    '',
    `Total Belanja: ${formatRupiah(orderTotal(lines))}`,
    '',
    '*Data Pemesan:*',
    `Nama: ${oneLine(customer.name)}`,
    `No. HP: ${oneLine(customer.phone)}`,
    `Alamat: ${address || '-'}`,
    `Catatan: ${oneLine(customer.note) || '-'}`,
    '',
    'Mohon diproses, terima kasih!',
  ].join('\n');
}

export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  return `https://wa.me/${normalizePhone(phoneNumber)}?text=${encodeURIComponent(message)}`;
}
