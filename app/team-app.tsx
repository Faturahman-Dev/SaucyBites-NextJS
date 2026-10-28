'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  ChefHat,
  Wallet,
  Target,
  Users,
  BookOpen,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  RefreshCw,
  X,
  Trash2,
  Pencil,
  Check,
  AlertCircle,
  CircleHelp,
  Flame,
  Search,
  ChevronRight,
  Cloud,
  Menu,
  LogOut,
  Receipt,
  Clock,
  TrendingUp,
  ImagePlus,
  ShieldCheck,
  Lock,
} from 'lucide-react';
import {
  products,
  hpp,
  finance,
  breakEven,
  rupiah,
  today,
  type Kind,
  type Row,
} from './model';
const navGroups = [
  {
    label: 'Operasional & Menu',
    items: [
      { id: 'overview', name: 'Dashboard', icon: LayoutDashboard },
      { id: 'sales', name: 'Kasir & penjualan', icon: ShoppingBag },
      { id: 'recipes', name: 'Menu & resep', icon: ChefHat },
      { id: 'ingredients', name: 'Bahan & kemasan', icon: Package },
    ],
  },
  {
    label: 'Keuangan & Tim',
    items: [
      { id: 'money', name: 'Cash Flow', icon: Wallet },
      { id: 'bep', name: 'Target & BEP', icon: Target },
      { id: 'team', name: 'Tim & bagi laba', icon: Users },
      { id: 'guide', name: 'Panduan kerja', icon: BookOpen },
    ],
  },
];
const sections = navGroups.flatMap((g) => g.items);
const labels: Record<Kind, string> = {
  ingredient: 'Bahan',
  product: 'Menu',
  sale: 'Penjualan',
  purchase: 'Pembelian bahan',
  expense: 'Biaya operasional',
  equipment: 'Peralatan',
  capital: 'Modal masuk',
  payout: 'Penarikan dana',
  member: 'Anggota tim',
};
const defaults: Record<Kind, any> = {
  ingredient: { name: '', price: '', packQty: '', unit: 'g' },
  product: {
    name: '',
    price: '',
    target: 0,
    image: '',
    description: '',
    category: 'Makanan',
    stockStatus: 'available',
    published: true,
    lines: [],
  },
  sale: {
    productId: 'teriyaki',
    qty: 1,
    discount: 0,
    method: 'Tunai',
    date: '',
    note: '',
  },
  purchase: { name: '', amount: '', date: '', note: '' },
  expense: { name: '', amount: '', date: '', note: '', cashImpact: 'Kas keluar' },
  equipment: { name: '', amount: '', events: 1, date: '', note: '' },
  capital: { name: '', amount: '', type: 'Setoran', date: '', note: '' },
  payout: { name: '', amount: '', type: 'Bagi laba', date: '', note: '' },
  member: { name: '', share: '' },
};

function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Pilih file gambar (JPG, PNG, atau WebP).'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () => reject(new Error('Format gambar tidak dapat dimuat.'));
      img.onload = () => {
        const maxDim = 420;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Gagal memproses gambar.'));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        let dataUrl = canvas.toDataURL('image/webp', 0.78);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', 0.78);
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

const dateLabel = (date: string) =>
  new Date(date + 'T12:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
function Empty({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="empty">
      <div className="empty-icon">
        <Receipt size={26} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
function Stat({
  label,
  value,
  detail,
  icon: Icon,
  tone = '',
}: {
  label: string;
  value: string;
  detail: string;
  icon: any;
  tone?: string;
}) {
  return (
    <div className={'stat ' + tone + (value.length > 17 ? ' long-value' : '')}>
      <div className="stat-top">
        <span>{label}</span>
        <Icon size={19} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  );
}
function Field({
  label,
  value,
  onChange,
  type = 'text',
  hint,
  min,
  max,
  step,
  required = true,
}: {
  label: string;
  value: any;
  onChange: (v: any) => void;
  type?: string;
  hint?: string;
  min?: number;
  max?: number;
  step?: string;
  required?: boolean;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        min={min}
        max={max}
        step={step}
        maxLength={type === 'text' ? 120 : undefined}
      />
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: any;
  onChange: (v: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </label>
  );
}
export default function TeamApp({
  user,
  role = 'owner',
}: {
  user: string;
  role?: 'owner' | 'member';
}) {
  const [section, setSection] = useState('overview'),
    [rows, setRows] = useState<Row[]>([]),
    [activities, setActivities] = useState<any[]>([]),
    [loaded, setLoaded] = useState(false),
    [loading, setLoading] = useState(true),
    [sync, setSync] = useState(''),
    [error, setError] = useState(''),
    [toast, setToast] = useState(''),
    [busy, setBusy] = useState(false),
    [query, setQuery] = useState(''),
    [saleDate, setSaleDate] = useState(''),
    [moneyTab, setMoneyTab] = useState<Kind>('purchase'),
    [mobile, setMobile] = useState(false);
  const [modal, setModal] = useState<{ kind: Kind; row?: Row; id: string } | null>(null),
    [form, setForm] = useState<any>({}),
    [formError, setFormError] = useState(''),
    [confirm, setConfirm] = useState<Row | null>(null);
  const sequence = useRef(0),
    dialogRef = useRef<HTMLDialogElement>(null),
    confirmRef = useRef<HTMLDialogElement>(null);
  const refresh = useCallback(async (manual = false) => {
    const n = ++sequence.current;
    if (manual) setLoading(true);
    try {
      const res = await fetch('/api/records', {
        cache: 'no-store',
        signal: AbortSignal.timeout(15000),
      });
      const data: any = await res.json();
      if (!res.ok) throw Error(data.error);
      if (n !== sequence.current) return;
      setRows(data.rows);
      setActivities(data.activity);
      setSync(data.syncedAt);
      setLoaded(true);
      setError('');
    } catch (e) {
      if (n === sequence.current)
        setError(e instanceof Error ? e.message : 'Tidak tersambung. Coba muat ulang.');
    } finally {
      if (n === sequence.current) setLoading(false);
    }
  }, []);
  useEffect(() => {
    refresh();
    const t = setInterval(() => refresh(), 15000);
    return () => clearInterval(t);
  }, [refresh]);
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(''), 4500);
      return () => clearTimeout(t);
    }
  }, [toast]);
  useEffect(() => {
    if (modal && !dialogRef.current?.open) dialogRef.current?.showModal();
    if (!modal) dialogRef.current?.close();
  }, [modal]);
  useEffect(() => {
    if (confirm && !confirmRef.current?.open) confirmRef.current?.showModal();
    if (!confirm) confirmRef.current?.close();
  }, [confirm]);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 961px)');
    const handleViewport = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches) setMobile(false);
    };
    handleViewport(mq);
    mq.addEventListener('change', handleViewport);
    return () => mq.removeEventListener('change', handleViewport);
  }, []);
  const ps = products(rows),
    ingredients = rows.filter((r) => r.kind === 'ingredient'),
    f = finance(rows),
    bep = breakEven(rows),
    members = rows.filter((r) => r.kind === 'member'),
    shares = members.reduce((a, r) => a + r.data.share, 0);
  const sales = rows
    .filter((r) => r.kind === 'sale')
    .sort(
      (a, b) =>
        b.data.date.localeCompare(a.data.date) || b.updatedAt.localeCompare(a.updatedAt),
    );
  const choose = (id: string) => {
    setSection(id);
    setQuery('');
    setMobile(false);
  };
  function open(kind: Kind, row?: Row) {
    if (!loaded) return;
    setForm(
      JSON.parse(JSON.stringify(row?.data ?? { ...defaults[kind], date: today() })),
    );
    setFormError('');
    setModal({ kind, row, id: row?.id ?? generateId() });
  }
  const set = (key: string, value: any) => setForm((p: any) => ({ ...p, [key]: value }));
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!modal || busy) return;
    setBusy(true);
    setFormError('');
    let data = { ...form };
    [
      'price',
      'packQty',
      'target',
      'qty',
      'discount',
      'amount',
      'events',
      'share',
    ].forEach((k) => {
      if (k in data) data[k] = Number(data[k]);
    });
    if (data.lines)
      data.lines = data.lines.map((l: any) => ({ ...l, qty: Number(l.qty) }));
    try {
      const r = await fetch('/api/records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: modal.id,
          kind: modal.kind,
          revision: modal.row?.revision ?? 0,
          data,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const j: any = await r.json();
      if (!r.ok) throw Error(j.error);
      setModal(null);
      setToast('Tersimpan. Data tim sudah diperbarui.');
      await refresh();
    } catch (e) {
      setFormError(
        e instanceof Error
          ? e.message
          : 'Tidak dapat menyimpan. Muat ulang untuk mengecek status.',
      );
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (!confirm || busy) return;
    setBusy(true);
    try {
      const r = await fetch('/api/records', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: confirm.id,
          kind: confirm.kind,
          revision: confirm.revision,
        }),
        signal: AbortSignal.timeout(20000),
      });
      const j: any = await r.json();
      if (!r.ok) throw Error(j.error);
      setConfirm(null);
      setToast('Catatan dibatalkan. Aktivitasnya tetap tercatat.');
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal membatalkan catatan.');
    } finally {
      setBusy(false);
    }
  }
  function download(content: string, name: string, type: string) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function backup() {
    download(
      JSON.stringify(
        {
          app: 'SaucyBites',
          exportedAt: new Date().toISOString(),
          rows,
          activity: activities,
        },
        null,
        2,
      ),
      'SaucyBites-cadangan-' + today() + '.json',
      'application/json',
    );
    setToast('Cadangan diunduh. Simpan di folder tim.');
  }
  function csv(list: Row[], name: string) {
    const keys = Array.from(
      new Set(
        list.flatMap((r) =>
          Object.keys(r.data).filter((k) => k !== 'lines' && k !== 'image'),
        ),
      ),
    );
    const cell = (v: any) => {
      const s = String(v ?? '');
      return '"' + (/^[=+@\-\t\r]/.test(s) ? "'" + s : s).replaceAll('"', '""') + '"';
    };
    download(
      '\ufeff' +
        [
          ['id', 'kategori', ...keys, 'pencatat', 'diubah'],
          ...list.map((r) => [
            r.id,
            labels[r.kind],
            ...keys.map((k) =>
              typeof r.data[k] === 'object' ? JSON.stringify(r.data[k]) : r.data[k],
            ),
            r.author,
            r.updatedAt,
          ]),
        ]
          .map((a) => a.map(cell).join(','))
          .join('\r\n'),
      'SaucyBites-' + name + '-' + today() + '.csv',
      'text/csv;charset=utf-8',
    );
  }
  const button = (kind: Kind, text?: string) => (
    <button className="btn primary" disabled={!loaded} onClick={() => open(kind)}>
      <Plus size={17} />
      {text || 'Tambah ' + labels[kind].toLowerCase()}
    </button>
  );
  const actions = (r: Row) => {
    if (
      role !== 'owner' &&
      (r.kind === 'member' || r.kind === 'payout' || r.kind === 'capital')
    ) {
      return null;
    }
    return (
      <div className="row-actions">
        {r.kind !== 'sale' && (
          <button
            className="icon-btn"
            aria-label={'Ubah ' + (r.data.name || 'catatan')}
            onClick={() => open(r.kind, r)}
          >
            <Pencil size={15} />
          </button>
        )}
        <button
          className="icon-btn danger"
          aria-label={'Batalkan ' + (r.data.name || r.data.productName)}
          onClick={() => setConfirm(r)}
        >
          <Trash2 size={15} />
        </button>
      </div>
    );
  };
  const filteredSales = sales.filter(
    (r) =>
      (!saleDate || r.data.date === saleDate) &&
      r.data.productName.toLowerCase().includes(query.toLowerCase()),
  );
  const sf = finance(filteredSales),
    productSelected = ps.find((p) => p.id === form.productId),
    recipeCost =
      modal?.kind === 'product'
        ? hpp({ data: form } as Row, rows)
        : { cost: 0, ready: false };
  const list = rows
    .filter(
      (r) =>
        r.kind === moneyTab && r.data.name.toLowerCase().includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        b.data.date.localeCompare(a.data.date) || b.updatedAt.localeCompare(a.updatedAt),
    );
  const sumsByDay = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 6 + i);
    const date = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    return {
      date,
      total: sales
        .filter((s) => s.data.date === date)
        .reduce((a, s) => a + s.data.total, 0),
    };
  });
  const maxDay = Math.max(1, ...sumsByDay.map((d) => d.total));
  return (
    <div className="app-shell">
      <aside className={'sidebar ' + (mobile ? 'open' : '')} aria-label="Navigasi ruang tim">
        <div className="sidebar-header">
          <a className="brand" href="/" aria-label="SaucyBites beranda">
            <span className="brand-icon">
              <Flame size={22} />
            </span>
            <span className="brand-text">
              <span className="brand-title">
                Saucy<span className="brand-bites">Bites.</span>
              </span>
              <small>RUANG OPERASIONAL</small>
            </span>
          </a>
          <button
            type="button"
            className="icon-btn mobile-close"
            aria-label="Tutup menu navigasi"
            onClick={() => setMobile(false)}
          >
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.label} className="nav-group">
              <div className="sidebar-label">{group.label}</div>
              <div className="nav-list">
                {group.items.map((s) => {
                  const active = section === s.id;
                  return (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => choose(s.id)}
                      className={active ? 'active' : ''}
                      aria-current={active ? 'page' : undefined}
                    >
                      <s.icon size={18} />
                      <span>{s.name}</span>
                      {active && <span className="nav-dot" aria-hidden="true" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="side-bottom">
          <div className="side-note">
            <div className="side-note-head">
              <Cloud size={16} />
              <strong>Sinkronisasi otomatis</strong>
            </div>
            <p>Catatan bersama diperbarui tiap 15 detik.</p>
          </div>
          <div className="profile">
            <span className={`avatar ${role === 'owner' ? 'owner' : ''}`}>
              {user.charAt(0).toUpperCase()}
            </span>
            <div className="profile-meta">
              <div className="profile-top">
                <strong>{user.split('@')[0]}</strong>
                <span className={`role-badge ${role}`}>
                  {role === 'owner' ? <ShieldCheck size={11} /> : <Users size={11} />}
                  {role === 'owner' ? 'Owner' : 'Anggota'}
                </span>
              </div>
              <small>
                {role === 'owner' ? 'Akses penuh pemilik' : 'Kasir & pencatatan'}
              </small>
            </div>
            <a
              className="logout-btn"
              href="/logout"
              title="Keluar / Ganti Akun"
              aria-label="Keluar dari akun"
            >
              <LogOut size={17} />
            </a>
          </div>
        </div>
      </aside>
      {mobile && (
        <button
          type="button"
          className="nav-scrim"
          aria-label="Tutup menu"
          onClick={() => setMobile(false)}
        />
      )}
      <main>
        <header className="topbar">
          <div className="breadcrumb">
            <button
              type="button"
              className="mobile-menu"
              aria-label="Buka menu navigasi"
              aria-expanded={mobile}
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={18} />
              <span>Menu</span>
            </button>
            <span className="breadcrumb-root">Ruang SaucyBites</span>
            <ChevronRight size={14} className="breadcrumb-sep" />
            <strong>{sections.find((s) => s.id === section)?.name}</strong>
          </div>
          <div className="top-actions">
            <span className={'sync-status ' + (error ? 'offline' : '')}>
              <span />
              {loading ? 'Memuat…' : error ? 'Koneksi terputus' : 'Tersinkron'}
              <small>
                {sync && !error
                  ? new Date(sync).toLocaleTimeString('id-ID', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : ''}
              </small>
            </span>
            <button
              type="button"
              className="icon-btn"
              aria-label="Muat ulang data"
              onClick={() => refresh(true)}
              disabled={loading}
              title="Muat ulang data"
            >
              <RefreshCw size={17} className={loading ? 'spin' : ''} />
            </button>
            <a
              className="btn subtle"
              href="/catalog"
              target="_blank"
              rel="noopener noreferrer"
              title="Buka halaman katalog publik"
            >
              <ShoppingBag size={16} />
              Katalog
            </a>
            <button
              type="button"
              className="btn subtle backup"
              disabled={!loaded}
              onClick={backup}
            >
              <Download size={16} />
              Cadangan
            </button>
          </div>
        </header>
        <div className="content">
          {error && (
            <div className="notice warning" role="alert">
              <AlertCircle size={18} />
              <div>
                <strong>Periksa koneksi</strong>
                <p>{error} Data yang tampil mungkin belum terbaru.</p>
              </div>
              <button className="btn subtle" onClick={() => refresh(true)}>
                Coba lagi
              </button>
            </div>
          )}
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                SAUCYBITES ·{' '}
                {section === 'overview' ? 'RINGKASAN USAHA' : 'OPERASIONAL TIM'}
              </div>
              <h1>
                {
                  (
                    {
                      overview: 'Bisnis rapi, tim happy.',
                      sales: 'Siap jualan?',
                      ingredients: 'Mulai dari bahan.',
                      recipes: 'Resep enak, hitungan tepat.',
                      money: 'Ke mana uangnya?',
                      bep: 'Kenali titik impasmu.',
                      team: 'Tumbuh dan bagi hasil.',
                      guide: 'Biar semua tim paham.',
                    } as any
                  )[section]
                }
              </h1>
              <p>
                {
                  (
                    {
                      overview: 'Pantau hasil usaha kalian dalam satu tempat.',
                      sales: 'Catat setiap penjualan. HPP dan omzet dihitung otomatis.',
                      ingredients:
                        'Isi harga kemasan, ukuran, dan satuan yang benar-benar kalian beli.',
                      recipes:
                        'Takaran per porsi, termasuk saus, minuman, dan kemasannya.',
                      money: 'Catat uang masuk dan keluar agar saldo dapat ditelusuri.',
                      bep: 'Rencanakan kombinasi menu yang menutup biaya usaha.',
                      team: 'Simulasikan pembagian laba dengan persentase yang disepakati.',
                      guide: 'Alur sederhana untuk pencatatan keuangan SaucyBites.',
                    } as any
                  )[section]
                }
              </p>
            </div>
            <div className="heading-action">
              {section === 'overview' || section === 'sales'
                ? button('sale', 'Catat penjualan')
                : section === 'ingredients'
                  ? button('ingredient')
                  : section === 'recipes'
                    ? button('product', 'Tambah menu')
                    : section === 'money'
                      ? (moneyTab === 'capital' || moneyTab === 'payout') &&
                        role !== 'owner'
                        ? null
                        : button(moneyTab)
                      : section === 'team'
                        ? role === 'owner'
                          ? button('member')
                          : null
                        : null}
            </div>
          </div>
          {!loaded && loading && (
            <div className="notice">
              <RefreshCw size={18} className="spin" />
              Mengambil catatan bersama…
            </div>
          )}
          {section === 'overview' && (
            <>
              <div className="stats">
                <Stat
                  label="Omzet penjualan"
                  value={loaded ? rupiah(f.revenue) : 'Memuat...'}
                  detail={f.units + ' porsi terjual · seluruh catatan'}
                  icon={ArrowUpRight}
                />
                <Stat
                  label="Estimasi laba bersih"
                  value={loaded ? rupiah(f.profit) : 'Memuat...'}
                  detail="Setelah HPP & biaya event"
                  icon={TrendingUp}
                  tone="highlight"
                />
                <Stat
                  label="Saldo dana usaha"
                  value={loaded ? rupiah(f.cash) : 'Memuat...'}
                  detail="Gabungan dana tunai & QRIS"
                  icon={Wallet}
                />
                <Stat
                  label="Biaya operasional"
                  value={loaded ? rupiah(f.expenses + f.equipmentCost) : 'Memuat...'}
                  detail="Operasional + alokasi peralatan"
                  icon={ArrowDownRight}
                />
              </div>
              {(!ingredients.length ||
                !ps.some((p) => hpp(p, rows).ready && p.data.price > 0)) && (
                <div className="setup-card">
                  <div>
                    <span className="tag">MULAI DI SINI</span>
                    <h2>Rapikan fondasinya dulu.</h2>
                    <p>Tiga langkah sebelum penjualan pertama kalian.</p>
                  </div>
                  <div className="setup-steps">
                    {[
                      {
                        name: 'Isi bahan & kemasan',
                        done: !!ingredients.length,
                        tab: 'ingredients',
                      },
                      {
                        name: 'Atur resep & harga jual',
                        done: ps.some((p) => hpp(p, rows).ready && p.data.price > 0),
                        tab: 'recipes',
                      },
                      {
                        name: 'Catat modal awal',
                        done: rows.some((r) => r.kind === 'capital'),
                        tab: 'money',
                      },
                    ].map((s, i) => (
                      <button
                        key={s.name}
                        onClick={() => {
                          choose(s.tab);
                          if (i === 2) setMoneyTab('capital');
                        }}
                      >
                        <span className={s.done ? 'done' : ''}>
                          {s.done ? <Check size={15} /> : i + 1}
                        </span>
                        {s.name}
                        <ChevronRight size={17} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <div className="two-cols">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Penjualan 7 hari terakhir</h2>
                      <p>Omzet aktual dalam rupiah</p>
                    </div>
                    <span className="tag soft">DATA AKTUAL</span>
                  </div>
                  {sales.length ? (
                    <div className="bar-chart">
                      {sumsByDay.map((d) => (
                        <div key={d.date} className="bar-column">
                          <span className="bar-value">
                            {d.total ? rupiah(d.total) : '-'}
                          </span>
                          <div className="bar-track">
                            <div
                              className="bar"
                              title={rupiah(d.total)}
                              style={{
                                height:
                                  Math.max(d.total ? 4 : 0, (d.total / maxDay) * 100) +
                                  '%',
                              }}
                            />
                          </div>
                          <small>
                            {new Date(d.date + 'T12:00:00').toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                            })}
                          </small>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="Penjualan pertama ditunggu."
                      action={
                        <button className="btn subtle" onClick={() => choose('sales')}>
                          Buka kasir <ArrowUpRight size={15} />
                        </button>
                      }
                    >
                      Grafik akan tumbuh dari transaksi tim kalian.
                    </Empty>
                  )}
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Menu kalian</h2>
                      <p>HPP & kontribusi per porsi</p>
                    </div>
                    <ChefHat size={22} />
                  </div>
                  <div className="menu-summary">
                    {ps.map((p, i) => {
                      const c = hpp(p, rows);
                      return (
                        <button
                          key={p.id}
                          onClick={() => open('product', p)}
                          className="menu-row"
                        >
                          <span className={'product-symbol p' + i}>
                            {p.data.image ? (
                              <img
                                src={p.data.image}
                                alt={p.data.name}
                                className="product-thumb"
                              />
                            ) : p.id === 'chocolate' ? (
                              'M'
                            ) : (
                              'C'
                            )}
                          </span>
                          <div>
                            <strong>{p.data.name}</strong>
                            <small>
                              {c.ready ? 'HPP ' + rupiah(c.cost) : 'Resep belum diisi'}
                            </small>
                          </div>
                          <div className="right">
                            <strong>
                              {p.data.price ? rupiah(p.data.price) : 'Belum diatur'}
                            </strong>
                            <small
                              className={
                                c.ready && p.data.price - c.cost > 0 ? 'green' : ''
                              }
                            >
                              {c.ready && p.data.price > 0
                                ? rupiah(p.data.price - c.cost) + ' / porsi'
                                : 'Atur menu'}{' '}
                            </small>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <p className="panel-footnote">
                    Kontribusi = harga jual − HPP, sebelum biaya operasional.
                  </p>
                </section>
              </div>
              <div className="two-cols">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Transaksi terbaru</h2>
                      <p>Catatan yang dibuat tim</p>
                    </div>
                    <button className="text-btn" onClick={() => choose('sales')}>
                      Lihat semua <ArrowUpRight size={15} />
                    </button>
                  </div>
                  {sales.length ? (
                    <div className="compact-list">
                      {sales.slice(0, 4).map((r) => (
                        <div key={r.id}>
                          <span className="list-icon">
                            <ShoppingBag size={17} />
                          </span>
                          <div>
                            <strong>{r.data.productName}</strong>
                            <small>
                              {r.data.qty} porsi · {r.data.method} ·{' '}
                              {dateLabel(r.data.date)}
                            </small>
                          </div>
                          <b>{rupiah(r.data.total)}</b>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty title="Belum ada transaksi">
                      Setiap penjualan yang dicatat akan muncul di sini.
                    </Empty>
                  )}
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Aktivitas tim</h2>
                      <p>Siapa mengubah apa</p>
                    </div>
                    <Clock size={21} />
                  </div>
                  {activities.length ? (
                    <div className="activity-list">
                      {activities.slice(0, 4).map((a) => (
                        <div key={a.id}>
                          <span className="activity-dot" />
                          <div>
                            <strong>
                              {a.action} {a.label}
                            </strong>
                            <small>
                              {a.author} ·{' '}
                              {new Date(a.time).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty title="Ruang baru, mulai bersama.">
                      Perubahan data akan tercatat beserta nama pencatatnya.
                    </Empty>
                  )}
                </section>
              </div>
              <div className="notice">
                <CircleHelp size={18} />
                <p>
                  Laba dan saldo dana punya arti berbeda. Pembelian bahan mengurangi
                  saldo; bahan yang terjual masuk HPP. Laba masih estimasi jika ada biaya,
                  bahan terbuang, atau stok hilang yang belum dicatat.
                </p>
              </div>
            </>
          )}
          {section === 'sales' && (
            <>
              <div className="cashier-grid">
                {ps.map((p, i) => {
                  const c = hpp(p, rows),
                    ready = c.ready && p.data.price > 0;
                  return (
                    <button
                      className={'cashier-card p' + i}
                      key={p.id}
                      disabled={!loaded || !ready}
                      onClick={() => {
                        open('sale');
                        setForm({ ...defaults.sale, date: today(), productId: p.id });
                      }}
                    >
                      <span className="cashier-icon">
                        {p.data.image ? (
                          <img
                            src={p.data.image}
                            alt={p.data.name}
                            className="cashier-thumb"
                          />
                        ) : p.id === 'chocolate' ? (
                          <Wallet size={28} />
                        ) : (
                          <Flame size={28} />
                        )}
                      </span>
                      <span className="tag">
                        {ready ? 'SIAP DIJUAL' : 'LENGKAPI RESEP'}
                      </span>
                      <h3>{p.data.name}</h3>
                      <strong>
                        {p.data.price ? rupiah(p.data.price) : 'Harga belum diisi'}
                      </strong>
                      <small>
                        {c.ready
                          ? 'HPP ' + rupiah(c.cost) + ' / porsi'
                          : 'Atur di Menu & resep'}
                      </small>
                      <span className="cashier-add">
                        <Plus size={20} />
                      </span>
                    </button>
                  );
                })}
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Riwayat penjualan</h2>
                    <p>
                      {filteredSales.length} transaksi · {sf.units} porsi ·{' '}
                      {rupiah(sf.revenue)}
                    </p>
                  </div>
                  <button
                    className="btn subtle"
                    disabled={!filteredSales.length}
                    onClick={() => csv(filteredSales, 'penjualan')}
                  >
                    <Download size={16} />
                    CSV
                  </button>
                </div>
                <div className="filters">
                  <label className="search">
                    <Search size={17} />
                    <input
                      aria-label="Cari produk"
                      placeholder="Cari produk…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <input
                    className="date-filter"
                    aria-label="Filter tanggal penjualan"
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                  />
                  {saleDate && (
                    <button className="text-btn" onClick={() => setSaleDate('')}>
                      Semua tanggal
                    </button>
                  )}
                </div>
                {filteredSales.length ? (
                  <div className="table-scroll">
                    <table className="sales-table">
                      <thead>
                        <tr>
                          <th>Tanggal / pencatat</th>
                          <th>Produk</th>
                          <th>Porsi</th>
                          <th>Pembayaran</th>
                          <th>Omzet</th>
                          <th>HPP</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSales.map((r) => (
                          <tr key={r.id}>
                            <td>
                              {dateLabel(r.data.date)}
                              <small>{r.author}</small>
                            </td>
                            <td>
                              <strong>{r.data.productName}</strong>
                              {r.data.note && <small>{r.data.note}</small>}
                              {r.data.discount > 0 && (
                                <small>Diskon {rupiah(r.data.discount)}</small>
                              )}
                            </td>
                            <td>{r.data.qty}</td>
                            <td>
                              <span
                                className={
                                  'badge ' + (r.data.method === 'QRIS' ? 'purple' : '')
                                }
                              >
                                {r.data.method}
                              </span>
                            </td>
                            <td>
                              <strong>{rupiah(r.data.total)}</strong>
                            </td>
                            <td>{rupiah(r.data.costTotal)}</td>
                            <td>{actions(r)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title={sales.length ? 'Tidak ada hasil.' : 'Belum ada penjualan.'}
                  >
                    Pilih menu siap jual di atas untuk mencatat transaksi pertama.
                  </Empty>
                )}
              </section>
              <div className="notice">
                <Check size={18} />
                <p>
                  Harga dan HPP disimpan saat transaksi dibuat. Untuk koreksi, batalkan
                  transaksi lalu catat ulang. QRIS dianggap sudah diterima; catat biaya
                  layanan sebagai biaya operasional.
                </p>
              </div>
            </>
          )}
          {section === 'ingredients' && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <h2>Daftar bahan & kemasan</h2>
                  <p>
                    {ingredients.length} bahan · gunakan g, ml, atau pcs secara konsisten
                  </p>
                </div>
                <button
                  className="btn subtle"
                  disabled={!ingredients.length}
                  onClick={() => csv(ingredients, 'bahan')}
                >
                  <Download size={16} />
                  CSV
                </button>
              </div>
              <div className="filters">
                <label className="search">
                  <Search size={17} />
                  <input
                    aria-label="Cari bahan"
                    placeholder="Cari bahan atau kemasan…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
              </div>
              {ingredients.length ? (
                <div className="table-scroll">
                  <table className="ingredients-table">
                    <thead>
                      <tr>
                        <th>Bahan / kemasan</th>
                        <th>Harga beli</th>
                        <th>Isi kemasan</th>
                        <th>Biaya per satuan</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {ingredients
                        .filter((i) =>
                          i.data.name.toLowerCase().includes(query.toLowerCase()),
                        )
                        .map((r) => (
                          <tr key={r.id}>
                            <td>
                              <strong>{r.data.name}</strong>
                              <small>Diubah oleh {r.author}</small>
                            </td>
                            <td>{rupiah(r.data.price)}</td>
                            <td>
                              {r.data.packQty.toLocaleString('id-ID')} {r.data.unit}
                            </td>
                            <td>
                              <strong>
                                {new Intl.NumberFormat('id-ID', {
                                  maximumFractionDigits: 2,
                                }).format(r.data.price / r.data.packQty)}{' '}
                                rupiah / {r.data.unit}
                              </strong>
                            </td>
                            <td>{actions(r)}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Empty
                  title="Kenali biaya tiap bahan."
                  action={button('ingredient', 'Tambah bahan pertama')}
                >
                  Masukkan harga per kemasan dan isinya. Contoh: ayam per 1.000 g, susu
                  per 1.000 ml, atau cup per 50 pcs. Isi harga aktual kalian.
                </Empty>
              )}
              <div className="panel-footnote">
                Mengisi harga bahan tidak mencatat pengeluaran kas. Catat pembeliannya
                juga di Cash Flow → Pembelian bahan.
              </div>
            </section>
          )}
          {section === 'recipes' && (
            <>
              <div className="recipe-grid">
                {ps.map((p, i) => {
                  const c = hpp(p, rows),
                    margin = p.data.price - c.cost;
                  return (
                    <section className="panel recipe-card" key={p.id}>
                      <div className="recipe-top">
                        <span className={'product-symbol p' + i}>
                          {p.data.image ? (
                            <img
                              src={p.data.image}
                              alt={p.data.name}
                              className="product-thumb"
                            />
                          ) : p.id === 'chocolate' ? (
                            'M'
                          ) : (
                            'C'
                          )}
                        </span>
                        <span
                          className={
                            'badge ' + (c.ready && p.data.price > 0 ? '' : 'muted')
                          }
                        >
                          {c.ready && p.data.price > 0 ? 'Siap jual' : 'Belum lengkap'}
                        </span>
                      </div>
                      {p.data.image ? (
                        <div className="recipe-photo-box">
                          <img
                            src={p.data.image}
                            alt={p.data.name}
                            className="recipe-photo"
                          />
                          {role === 'owner' && (
                            <button
                              type="button"
                              className="recipe-photo-badge"
                              disabled={!loaded}
                              onClick={() => open('product', p)}
                            >
                              <ImagePlus size={14} /> Ubah gambar
                            </button>
                          )}
                        </div>
                      ) : role === 'owner' ? (
                        <button
                          type="button"
                          className="recipe-photo-empty"
                          disabled={!loaded}
                          onClick={() => open('product', p)}
                        >
                          <ImagePlus size={20} />
                          <span>Tambahkan gambar menu</span>
                        </button>
                      ) : null}
                      <h2>{p.data.name}</h2>
                      <p>{p.data.target || 0} porsi target penjualan</p>
                      <div className="recipe-numbers">
                        <div>
                          <small>HPP / porsi</small>
                          <strong>{c.ready ? rupiah(c.cost) : 'Belum diatur'}</strong>
                        </div>
                        <div>
                          <small>Harga jual</small>
                          <strong>
                            {p.data.price ? rupiah(p.data.price) : 'Belum diatur'}
                          </strong>
                        </div>
                      </div>
                      <div className="recipe-lines">
                        {p.data.lines.length ? (
                          p.data.lines.map((l: any) => {
                            const r = ingredients.find((r) => r.id === l.ingredientId);
                            return (
                              <div key={l.ingredientId}>
                                <span>{r?.data.name || 'Bahan tidak tersedia'}</span>
                                <b>
                                  {l.qty} {r?.data.unit}
                                </b>
                              </div>
                            );
                          })
                        ) : (
                          <p>
                            Takaran belum diisi. Jangan lupa saus, minyak, dan kemasan.
                          </p>
                        )}
                      </div>
                      <div className={'margin-line ' + (margin < 0 ? 'red' : '')}>
                        <span>Kontribusi / porsi</span>
                        <strong>
                          {c.ready && p.data.price > 0 ? rupiah(margin) : 'Belum siap'}
                        </strong>
                      </div>
                      <button
                        className="btn wide subtle"
                        disabled={!loaded}
                        onClick={() => open('product', p)}
                      >
                        <Pencil size={16} />
                        {role === 'owner'
                          ? 'Atur menu, gambar & resep'
                          : 'Atur resep & harga'}
                      </button>
                    </section>
                  );
                })}
              </div>
              <div className="notice">
                <ChefHat size={19} />
                <p>
                  Takaran dihitung per satu porsi siap jual. Untuk bahan yang dipakai satu
                  batch, bagi jumlahnya dengan porsi layak jual yang dihasilkan. HPP belum
                  mencakup biaya tetap; masukkan biaya tersebut di Cash Flow.
                </p>
              </div>
            </>
          )}
          {section === 'money' && (
            <>
              <div className="stats three">
                <Stat
                  label="Total dana masuk"
                  value={rupiah(f.capital + f.revenue)}
                  detail="Setoran + pinjaman + penjualan"
                  icon={ArrowUpRight}
                />
                <Stat
                  label="Total dana keluar"
                  value={rupiah(
                    f.purchases + f.cashExpenses + f.equipmentCash + f.payouts,
                  )}
                  detail="Pembelian + biaya + peralatan + penarikan"
                  icon={ArrowDownRight}
                />
                <Stat
                  label="Saldo dana usaha"
                  value={rupiah(f.cash)}
                  detail="Total masuk dikurangi total keluar"
                  icon={Wallet}
                  tone="highlight"
                />
              </div>
              <div className="tabs">
                {(
                  ['purchase', 'expense', 'equipment', 'capital', 'payout'] as Kind[]
                ).map((k) => (
                  <button
                    key={k}
                    className={moneyTab === k ? 'active' : ''}
                    onClick={() => {
                      setMoneyTab(k);
                      setQuery('');
                    }}
                  >
                    {labels[k]}
                  </button>
                ))}
              </div>
              {(moneyTab === 'capital' || moneyTab === 'payout') && role !== 'owner' && (
                <div className="notice" style={{ margin: '14px 0' }}>
                  <CircleHelp size={18} />
                  <p>
                    Kategori <strong>{labels[moneyTab]}</strong> hanya dapat dicatat dan
                    dikelola oleh <strong>Owner (Pemilik)</strong>. Anggota tim dapat
                    meninjau riwayat transaksi yang ada.
                  </p>
                </div>
              )}
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>{labels[moneyTab]}</h2>
                    <p>
                      {
                        (
                          {
                            purchase:
                              'Belanja bahan & kemasan, mengurangi dana tanpa dihitung dua kali dalam laba.',
                            expense:
                              'Biaya untuk event ini: sewa, transportasi, listrik, fee QRIS, atau kerugian stok.',
                            equipment:
                              'Catat pembelian peralatan untuk event ini. Dana keluar penuh; laba memakai alokasi per event.',
                            capital:
                              'Setoran anggota dan pinjaman menambah dana, bukan omzet atau laba.',
                            payout:
                              'Penarikan laba, pengembalian modal, dan pelunasan pokok pinjaman.',
                          } as any
                        )[moneyTab]
                      }
                    </p>
                  </div>
                  <button
                    className="btn subtle"
                    disabled={!list.length}
                    onClick={() => csv(list, moneyTab)}
                  >
                    <Download size={16} />
                    CSV
                  </button>
                </div>
                <div className="filters">
                  <label className="search">
                    <Search size={17} />
                    <input
                      aria-label="Cari catatan"
                      placeholder="Cari catatan…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                </div>
                {list.length ? (
                  <div className="table-scroll">
                    <table className="money-table">
                      <thead>
                        <tr>
                          <th>Tanggal</th>
                          <th>Keterangan</th>
                          <th>Jumlah</th>
                          <th>
                            {moneyTab === 'equipment'
                              ? 'Alokasi / event'
                              : 'Jenis / pencatat'}
                          </th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {list.map((r) => (
                          <tr key={r.id}>
                            <td>{dateLabel(r.data.date)}</td>
                            <td>
                              <strong>{r.data.name}</strong>
                              {r.data.note && <small>{r.data.note}</small>}
                            </td>
                            <td>
                              <strong>{rupiah(r.data.amount)}</strong>
                            </td>
                            <td>
                              {moneyTab === 'equipment' ? (
                                <>
                                  {rupiah(r.data.amount / r.data.events)}
                                  <small>Dibagi {r.data.events} event</small>
                                </>
                              ) : (
                                <>
                                  {(r.data.type || r.data.cashImpact) && (
                                    <span className="badge muted">
                                      {r.data.type || r.data.cashImpact}
                                    </span>
                                  )}
                                  <small>{r.author}</small>
                                </>
                              )}
                            </td>
                            <td>{actions(r)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <Empty
                    title={'Belum ada ' + labels[moneyTab].toLowerCase() + '.'}
                    action={
                      (moneyTab === 'capital' || moneyTab === 'payout') &&
                      role !== 'owner'
                        ? undefined
                        : button(moneyTab)
                    }
                  >
                    Catat transaksi aktual untuk melihat pergerakan dana usaha.
                  </Empty>
                )}
              </section>
              <div className="notice">
                <CircleHelp size={18} />
                <p>
                  Catat satu pembayaran dalam satu kategori saja. Saldo ini adalah saldo
                  pencatatan, bukan saldo bank yang diverifikasi. Untuk stok
                  sisa/terbuang, gunakan catatan inventaris tim; aplikasi belum melacak
                  jumlah stok.
                </p>
              </div>
            </>
          )}
          {section === 'bep' && (
            <>
              <div className="stats three">
                <Stat
                  label="BEP estimasi"
                  value={bep.units === null ? 'Belum tersedia' : bep.units + ' porsi'}
                  detail="Kombinasi sesuai target menu"
                  icon={Target}
                  tone="highlight"
                />
                <Stat
                  label="Biaya tetap tercatat"
                  value={rupiah(bep.fixed)}
                  detail="Operasional + alokasi peralatan"
                  icon={Wallet}
                />
                <Stat
                  label="Target penjualan"
                  value={bep.total + ' porsi'}
                  detail="Jumlah target seluruh menu"
                  icon={ShoppingBag}
                />
              </div>
              <div className="two-cols">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Komposisi menu</h2>
                      <p>Ubah target lewat pengaturan resep</p>
                    </div>
                  </div>
                  <div className="mix-list">
                    {ps.map((p) => {
                      const c = hpp(p, rows);
                      return (
                        <div key={p.id}>
                          <div>
                            <strong>{p.data.name}</strong>
                            <small>
                              {p.data.target} porsi · kontribusi{' '}
                              {c.ready && p.data.price > 0
                                ? rupiah(p.data.price - c.cost)
                                : 'belum tersedia'}
                            </small>
                            <div className="progress-track">
                              <div
                                style={{
                                  width:
                                    (bep.total ? (p.data.target / bep.total) * 100 : 0) +
                                    '%',
                                }}
                              />
                            </div>
                          </div>
                          <button
                            className="icon-btn"
                            onClick={() => open('product', p)}
                            aria-label={'Ubah target ' + p.data.name}
                          >
                            <Pencil size={17} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Simulasi target</h2>
                      <p>Berdasarkan harga dan HPP saat ini</p>
                    </div>
                    <TrendingUp size={22} />
                  </div>
                  {bep.ready ? (
                    <div className="calculation">
                      <div>
                        <span>Kontribusi rata-rata / porsi</span>
                        <b>{rupiah(bep.contribution)}</b>
                      </div>
                      <div>
                        <span>Biaya tetap tercatat</span>
                        <b>{rupiah(bep.fixed)}</b>
                      </div>
                      <div>
                        <span>BEP ≈ biaya tetap ÷ kontribusi</span>
                        <b>
                          {bep.units === null ? 'Tidak tercapai' : bep.units + ' porsi'}
                        </b>
                      </div>
                      <div className="calc-total">
                        <span>Estimasi laba sesuai target</span>
                        <b className={bep.projected < 0 ? 'red' : 'green'}>
                          {rupiah(bep.projected)}
                        </b>
                      </div>
                    </div>
                  ) : (
                    <Empty title="Lengkapi rencana dulu.">
                      Isi resep, harga jual, dan target porsi untuk menu yang akan dijual.
                    </Empty>
                  )}
                </section>
              </div>
              <div className="notice warning">
                <AlertCircle size={18} />
                <p>
                  BEP memakai biaya operasional yang sudah dicatat, bukan anggaran yang
                  belum dimasukkan. Hasil adalah perkiraan dengan komposisi target tetap;
                  pembulatan porsi tiap menu dapat mengubah titik impas. Kontribusi
                  nol/negatif tidak dapat menutup biaya tetap.
                </p>
              </div>
            </>
          )}
          {section === 'team' && (
            <>
              <div className="two-cols">
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Porsi pembagian laba</h2>
                      <p>Persentase harus berjumlah tepat 100%</p>
                    </div>
                    <span
                      className={
                        'badge ' + (Math.abs(shares - 100) < 0.001 ? '' : 'muted')
                      }
                    >
                      {shares.toLocaleString('id-ID')}%
                    </span>
                  </div>
                  {role !== 'owner' && (
                    <div className="notice" style={{ margin: '12px 0' }}>
                      <CircleHelp size={17} />
                      <p>
                        Anda masuk sebagai <strong>Anggota Tim</strong>. Porsi bagi laba
                        dan penarikan dana hanya dapat diatur oleh <strong>Owner</strong>.
                      </p>
                    </div>
                  )}
                  {members.length ? (
                    <div className="member-list">
                      {members.map((m) => (
                        <div key={m.id}>
                          <span className="avatar">
                            {m.data.name.charAt(0).toUpperCase()}
                          </span>
                          <div>
                            <strong>{m.data.name}</strong>
                            <small>{m.data.share}% dari laba yang dibagikan</small>
                          </div>
                          {actions(m)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Empty
                      title="Tentukan pembagian yang adil."
                      action={
                        role === 'owner' ? button('member', 'Tambah anggota') : undefined
                      }
                    >
                      Masukkan nama dan porsi laba sesuai kesepakatan tim.
                    </Empty>
                  )}
                  <div className="panel-footnote">
                    Daftar ini untuk hitungan bagi laba. Akses aplikasi memakai
                    autentikasi server.
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Simulasi bagi laba</h2>
                      <p>Laba tercatat sebelum penarikan dana</p>
                    </div>
                    <Users size={22} />
                  </div>
                  <div className="calculation">
                    <div>
                      <span>Estimasi laba bersih</span>
                      <b>{rupiah(f.profit)}</b>
                    </div>
                    <div>
                      <span>Bagi laba sudah ditarik</span>
                      <b>
                        {rupiah(
                          rows
                            .filter(
                              (r) => r.kind === 'payout' && r.data.type === 'Bagi laba',
                            )
                            .reduce((a, r) => a + r.data.amount, 0),
                        )}
                      </b>
                    </div>
                  </div>
                  {Math.abs(shares - 100) < 0.001 && f.profit > 0 ? (
                    <>
                      <div className="calculation">
                        {members.map((m) => (
                          <div key={m.id}>
                            <span>
                              {m.data.name} ({m.data.share}%)
                            </span>
                            <b>{rupiah((f.profit * m.data.share) / 100)}</b>
                          </div>
                        ))}
                      </div>
                      <div className="notice">
                        <CircleHelp size={17} />
                        <p>
                          Nominal di atas adalah hak total berdasarkan laba estimasi,
                          bukan jumlah yang otomatis dibayarkan. Pastikan sisa dana cukup
                          untuk kewajiban dan modal, lalu catat pembayaran di Penarikan
                          dana.
                        </p>
                      </div>
                    </>
                  ) : (
                    <Empty
                      title={
                        f.profit <= 0
                          ? 'Belum ada laba positif.'
                          : 'Jumlahkan persentase ke 100%.'
                      }
                    >
                      Pembagian hanya dapat dihitung setelah ada laba positif dan
                      kesepakatan persentase lengkap.
                    </Empty>
                  )}
                  {role === 'owner' ? (
                    <button
                      className="btn subtle wide"
                      disabled={!loaded}
                      onClick={() => {
                        choose('money');
                        setMoneyTab('payout');
                      }}
                    >
                      Catat penarikan dana <ArrowUpRight size={16} />
                    </button>
                  ) : (
                    <p className="owner-lock-note">
                      <Lock size={13} />
                      <span>Penarikan dana hanya dapat dicatat oleh Owner.</span>
                    </p>
                  )}
                </section>
              </div>
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h2>Kolaborasi tim</h2>
                    <p>
                      Catatan finansial bersama antara Owner (Pemilik) dan Anggota Tim
                    </p>
                  </div>
                  <Cloud size={22} />
                </div>
                <div className="guide-copy">
                  <p>
                    Aplikasi SaucyBites menyediakan autentikasi terpisah antara{' '}
                    <strong>Pemilik (Owner)</strong> dan <strong>Anggota Tim</strong>.
                    Owner memiliki kendali penuh untuk menentukan porsi bagi laba,
                    menyetorkan modal, melakukan penarikan dana usaha, serta mengatur menu
                    dan resep. Anggota tim memiliki akses untuk melayani kasir penjualan,
                    mencatat pembelian bahan, dan biaya operasional harian.
                  </p>
                  <p>
                    Setiap penyimpanan mencatat nama pengguna yang dimasukkan saat login.
                    Semua anggota dan owner melihat database yang sama secara real-time.
                    Jika dua orang mengubah catatan yang sama, aplikasi meminta memuat
                    ulang agar perubahan rekan lain tidak tertimpa.
                  </p>
                  <p>
                    Nama pada daftar bagi laba digunakan untuk simulasi pembagian laba.
                    Unduh cadangan JSON untuk arsip data dan CSV untuk laporan transaksi.
                  </p>
                </div>
              </section>
            </>
          )}
          {section === 'guide' && (
            <>
              <div className="guide-grid">
                {[
                  {
                    n: '01',
                    title: 'Masukkan bahan',
                    text: 'Buka Bahan & kemasan. Isi harga satu kemasan, jumlah isinya, dan satuan g/ml/pcs. Masukkan juga cup, box, tusuk, atau kantong.',
                    tab: 'ingredients',
                  },
                  {
                    n: '02',
                    title: 'Hitung per porsi',
                    text: 'Buka Menu & resep. Pilih bahan dan takaran satu porsi. Isi harga jual serta target porsi. Resep satu batch harus dibagi hasil porsi layak jual.',
                    tab: 'recipes',
                  },
                  {
                    n: '03',
                    title: 'Catat pergerakan dana',
                    text: 'Masukkan modal awal, pembelian bahan, biaya event, dan peralatan di Cash Flow. Jangan catat pembayaran yang sama dua kali.',
                    tab: 'money',
                  },
                  {
                    n: '04',
                    title: 'Mulai jualan',
                    text: 'Pilih menu di Kasir & penjualan. Isi jumlah, diskon total transaksi, dan pembayaran. HPP serta harga disimpan untuk riwayat yang stabil.',
                    tab: 'sales',
                  },
                ].map((g) => (
                  <button
                    className="panel guide-card"
                    key={g.n}
                    onClick={() => choose(g.tab)}
                  >
                    <span>{g.n}</span>
                    <h2>{g.title}</h2>
                    <p>{g.text}</p>
                    <ArrowUpRight size={20} />
                  </button>
                ))}
              </div>
              <div className="two-cols">
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Cara membaca angkanya</h2>
                  </div>
                  <div className="guide-copy">
                    <p>
                      <strong>HPP per porsi</strong> = jumlah (harga kemasan ÷ isi kemasan
                      × takaran resep). Sudah termasuk kemasan jika kalian memasukkannya.
                    </p>
                    <p>
                      <strong>Laba estimasi</strong> = omzet setelah diskon − HPP porsi
                      terjual − biaya operasional − alokasi peralatan per event.
                    </p>
                    <p>
                      <strong>Saldo dana</strong> = setoran/pinjaman + penjualan −
                      pembelian bahan − biaya operasional yang dibayar − harga peralatan
                      penuh − penarikan dana.
                    </p>
                    <p>
                      <strong>BEP</strong> = biaya tetap tercatat ÷ kontribusi rata-rata
                      per porsi. Komposisi menu mengikuti target porsi yang kalian isi.
                    </p>
                  </div>
                </section>
                <section className="panel">
                  <div className="panel-heading">
                    <h2>Kebiasaan kecil, data rapi.</h2>
                  </div>
                  <div className="guide-copy">
                    <p>
                      Gunakan satu ruang ini untuk satu event atau periode pencatatan.
                      Semua laporan menggabungkan seluruh data; filter tanggal tersedia
                      pada riwayat penjualan.
                    </p>
                    <p>
                      Catat bahan terbuang atau kerugian stok di Biaya operasional dengan
                      jenis Penyesuaian nonkas agar laba berkurang tanpa mengurangi saldo
                      lagi. Aplikasi belum menghitung persediaan, utang pemasok, piutang
                      penjualan, ataupun pajak secara otomatis.
                    </p>
                    <p>
                      Jika koneksi putus, data belum bisa disimpan. Tunggu status
                      tersinkron sebelum mencatat. Untuk kesalahan nominal, ubah catatan
                      uang atau batalkan dan catat ulang penjualan.
                    </p>
                    <p>
                      Unduh CSV untuk dibuka di Excel, atau Cadangan untuk arsip JSON.
                      Pemilik server bisa memindahkan cadangan lewat perintah npm run
                      db:import; petunjuk ada di README.
                    </p>
                  </div>
                  <button
                    className="btn subtle"
                    disabled={!loaded}
                    onClick={() => csv(rows, 'laporan-lengkap')}
                  >
                    <Download size={16} />
                    Ekspor semua catatan CSV
                  </button>
                </section>
              </div>
            </>
          )}
          <footer>
            SAUCYBITES <span>Good bites. Better teamwork.</span>
            <small>Data rupiah · Tanggal WIB · Satu ruang untuk satu event</small>
          </footer>
        </div>
      </main>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
        </div>
      )}
      <dialog
        ref={dialogRef}
        className="modal"
        onCancel={(e) => {
          e.preventDefault();
          if (!busy) setModal(null);
        }}
      >
        <form onSubmit={submit}>
          <div className="modal-heading">
            <div>
              <span className="eyebrow">SAUCYBITES / CATATAN TIM</span>
              <h2>
                {modal?.row ? 'Atur' : 'Tambah'}{' '}
                {modal ? labels[modal.kind].toLowerCase() : ''}
              </h2>
            </div>
            <button
              type="button"
              className="icon-btn"
              disabled={busy}
              onClick={() => setModal(null)}
              aria-label="Tutup formulir"
            >
              <X size={21} />
            </button>
          </div>
          <div className="modal-body">
            {modal?.kind === 'ingredient' && (
              <>
                <Field
                  label="Nama bahan / kemasan"
                  value={form.name}
                  onChange={(v) => set('name', v)}
                />
                <div className="form-grid">
                  <Field
                    label="Harga satu kemasan (Rp)"
                    type="number"
                    value={form.price}
                    onChange={(v) => set('price', v)}
                    min={0.01}
                    max={1e9}
                    step="any"
                  />
                  <Field
                    label="Isi satu kemasan"
                    type="number"
                    value={form.packQty}
                    onChange={(v) => set('packQty', v)}
                    min={0.001}
                    max={1e8}
                    step="any"
                  />
                </div>
                <Select
                  label="Satuan isi"
                  value={form.unit}
                  onChange={(v) => set('unit', v)}
                >
                  <option value="g">Gram (g)</option>
                  <option value="ml">Mililiter (ml)</option>
                  <option value="pcs">Buah / lembar (pcs)</option>
                </Select>
                <div className="form-summary">
                  <span>Biaya per {form.unit}</span>
                  <strong>
                    {form.price && form.packQty
                      ? new Intl.NumberFormat('id-ID', {
                          maximumFractionDigits: 2,
                        }).format(Number(form.price) / Number(form.packQty)) + ' rupiah'
                      : 'Isi harga & kemasan'}
                  </strong>
                </div>
                <p className="helper">
                  Konversi kg menjadi gram dan liter menjadi ml sebelum mengisi. Catat
                  pembayaran pembelian secara terpisah di Cash Flow.
                </p>
              </>
            )}
            {modal?.kind === 'product' && (
              <>
                <Field
                  label="Nama menu"
                  value={form.name}
                  onChange={(v) => set('name', v)}
                />
                {role === 'owner' ? (
                  <div className="product-image-field">
                    <div className="product-image-header">
                      <span>Gambar menu (opsional)</span>
                      <span className="role-badge owner">
                        <ShieldCheck size={11} /> Khusus Owner
                      </span>
                    </div>
                    <div className="product-image-controls">
                      <div className="product-image-preview">
                        {form.image ? (
                          <img src={form.image} alt={form.name || 'Preview menu'} />
                        ) : (
                          <ImagePlus size={24} />
                        )}
                      </div>
                      <div className="product-image-actions">
                        <div className="product-image-buttons">
                          <label className="btn subtle">
                            <ImagePlus size={16} />
                            {form.image ? 'Ganti foto dari perangkat' : 'Pilih foto menu'}
                            <input
                              type="file"
                              accept="image/*"
                              hidden
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                e.target.value = '';
                                if (!file) return;
                                try {
                                  const dataUrl = await compressImage(file);
                                  set('image', dataUrl);
                                  setFormError('');
                                } catch (err) {
                                  setFormError(
                                    err instanceof Error
                                      ? err.message
                                      : 'Gagal memuat gambar.',
                                  );
                                }
                              }}
                            />
                          </label>
                          {form.image && (
                            <button
                              type="button"
                              className="btn subtle"
                              onClick={() => set('image', '')}
                            >
                              <Trash2 size={15} />
                              Hapus
                            </button>
                          )}
                        </div>
                        <input
                          type="url"
                          className="product-image-url"
                          placeholder="Atau tempel link gambar (https://...)"
                          value={
                            form.image && !form.image.startsWith('data:')
                              ? form.image
                              : ''
                          }
                          onChange={(e) => set('image', e.target.value)}
                        />
                        <small>
                          Foto otomatis dikompres agar ringan & langsung tersimpan untuk
                          seluruh tim.
                        </small>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="notice" style={{ margin: '0 0 18px' }}>
                    <ImagePlus size={17} />
                    <p>
                      Opsi menambahkan atau mengubah gambar menu hanya tersedia untuk hak
                      akses <strong>Owner (Pemilik)</strong>.
                    </p>
                  </div>
                )}
                <div className="form-grid">
                  <Field
                    label="Harga jual / porsi (Rp)"
                    value={form.price}
                    type="number"
                    onChange={(v) => set('price', v)}
                    min={0}
                    max={1e9}
                    step="any"
                  />
                  <Field
                    label="Target penjualan (porsi)"
                    value={form.target}
                    type="number"
                    onChange={(v) => set('target', v)}
                    min={0}
                    max={1e6}
                    step="1"
                  />
                </div>
                <div className="form-grid">
                  <Field
                    label="Kategori katalog"
                    value={form.category ?? 'Makanan'}
                    onChange={(v) => set('category', v)}
                    required={false}
                    hint="Contoh: Makanan, Minuman, Paket"
                  />
                  <Select
                    label="Status stok katalog"
                    value={form.stockStatus || 'available'}
                    onChange={(v) => set('stockStatus', v)}
                  >
                    <option value="available">Tersedia</option>
                    <option value="limited">Stok terbatas</option>
                    <option value="soldout">Habis</option>
                  </Select>
                </div>
                <Field
                  label="Deskripsi singkat katalog (opsional)"
                  value={form.description ?? ''}
                  onChange={(v) => set('description', v)}
                  required={false}
                  hint="Ditampilkan pada kartu menu di halaman katalog publik (/catalog)."
                />
                <Select
                  label="Tampilkan di katalog publik (/catalog)"
                  value={form.published === false ? 'false' : 'true'}
                  onChange={(v) => set('published', v === 'true')}
                >
                  <option value="true">Tampilkan di katalog publik</option>
                  <option value="false">Sembunyikan dari katalog publik</option>
                </Select>
                <div className="recipe-editor-heading">
                  <strong>Takaran satu porsi</strong>
                  <button
                    type="button"
                    className="text-btn"
                    disabled={!ingredients.length}
                    onClick={() =>
                      set('lines', [
                        ...(form.lines || []),
                        {
                          ingredientId:
                            ingredients.find(
                              (i) =>
                                !form.lines.some((l: any) => l.ingredientId === i.id),
                            )?.id || '',
                          qty: '',
                        },
                      ])
                    }
                  >
                    <Plus size={16} />
                    Bahan
                  </button>
                </div>
                {!ingredients.length && (
                  <p className="helper">Tambahkan bahan dahulu di Bahan & kemasan.</p>
                )}
                {(form.lines || []).map((line: any, index: number) => (
                  <div className="recipe-editor-row" key={index}>
                    <Select
                      label="Bahan"
                      value={line.ingredientId}
                      onChange={(v) =>
                        set(
                          'lines',
                          form.lines.map((l: any, i: number) =>
                            i === index ? { ...l, ingredientId: v } : l,
                          ),
                        )
                      }
                    >
                      <option value="">Pilih bahan</option>
                      {ingredients.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.data.name} ({i.data.unit})
                        </option>
                      ))}
                    </Select>
                    <Field
                      label={
                        'Takaran (' +
                        (ingredients.find((i) => i.id === line.ingredientId)?.data.unit ||
                          'satuan') +
                        ')'
                      }
                      value={line.qty}
                      type="number"
                      min={0.001}
                      max={1e8}
                      step="any"
                      onChange={(v) =>
                        set(
                          'lines',
                          form.lines.map((l: any, i: number) =>
                            i === index ? { ...l, qty: v } : l,
                          ),
                        )
                      }
                    />
                    <button
                      type="button"
                      className="icon-btn danger"
                      aria-label="Hapus bahan dari resep"
                      onClick={() =>
                        set(
                          'lines',
                          form.lines.filter((_: any, i: number) => i !== index),
                        )
                      }
                    >
                      <X size={17} />
                    </button>
                  </div>
                ))}
                <div className="form-summary">
                  <span>HPP per porsi</span>
                  <strong>
                    {recipeCost.ready ? rupiah(recipeCost.cost) : 'Resep belum lengkap'}
                  </strong>
                </div>
                <p className="helper">
                  Tambahkan seluruh bahan, termasuk minyak, saus, es, dan kemasan sesuai
                  kebutuhan. Harga jual harus terisi sebelum mencatat penjualan.
                </p>
              </>
            )}
            {modal?.kind === 'sale' && (
              <>
                <Select
                  label="Menu yang terjual"
                  value={form.productId}
                  onChange={(v) => set('productId', v)}
                >
                  {ps.map((p) => (
                    <option
                      key={p.id}
                      value={p.id}
                      disabled={!hpp(p, rows).ready || p.data.price <= 0}
                    >
                      {p.data.name}{' '}
                      {!hpp(p, rows).ready || p.data.price <= 0 ? '(belum siap)' : ''}
                    </option>
                  ))}
                </Select>
                {(!productSelected ||
                  !hpp(productSelected, rows).ready ||
                  productSelected.data.price <= 0) && (
                  <div className="notice warning">
                    <AlertCircle size={17} />
                    Menu ini belum siap. Lengkapi resep dan harga jual.
                  </div>
                )}
                <div className="form-grid">
                  <Field
                    label="Jumlah porsi"
                    type="number"
                    value={form.qty}
                    onChange={(v) => set('qty', v)}
                    min={1}
                    max={1e6}
                    step="1"
                  />
                  <Field
                    label="Diskon total transaksi (Rp)"
                    type="number"
                    value={form.discount}
                    onChange={(v) => set('discount', v)}
                    min={0}
                    max={1e9}
                    step="any"
                  />
                </div>
                <Select
                  label="Pembayaran sudah diterima melalui"
                  value={form.method}
                  onChange={(v) => set('method', v)}
                >
                  <option>Tunai</option>
                  <option>QRIS</option>
                </Select>
                <Field
                  label="Tanggal penjualan (WIB)"
                  type="date"
                  value={form.date}
                  onChange={(v) => set('date', v)}
                />
                <Field
                  label="Catatan (opsional)"
                  value={form.note}
                  onChange={(v) => set('note', v)}
                  required={false}
                />
                <div className="form-summary">
                  <span>Total pembayaran</span>
                  <strong>
                    {rupiah(
                      (productSelected?.data.price || 0) * Number(form.qty || 0) -
                        Number(form.discount || 0),
                    )}
                  </strong>
                </div>
                <p className="helper">
                  Satu transaksi untuk satu jenis menu. Diskon berlaku untuk seluruh
                  transaksi, bukan per porsi.
                </p>
              </>
            )}
            {modal &&
              ['purchase', 'expense', 'equipment', 'capital', 'payout'].includes(
                modal.kind,
              ) && (
                <>
                  <Field
                    label={
                      modal.kind === 'capital'
                        ? 'Nama penyetor / pemberi pinjaman'
                        : modal.kind === 'payout'
                          ? 'Nama penerima dana'
                          : 'Keterangan transaksi'
                    }
                    value={form.name}
                    onChange={(v) => set('name', v)}
                  />
                  <Field
                    label="Jumlah aktual (Rp)"
                    type="number"
                    value={form.amount}
                    onChange={(v) => set('amount', v)}
                    min={0.01}
                    max={1e9}
                    step="any"
                  />
                  {modal.kind === 'equipment' && (
                    <Field
                      label="Dibagi untuk berapa event?"
                      type="number"
                      value={form.events}
                      onChange={(v) => set('events', v)}
                      min={1}
                      max={10000}
                      step="1"
                      hint="Isi 1 untuk membebankan seluruh biaya ke event ini."
                    />
                  )}
                  {modal.kind === 'expense' && (
                    <Select
                      label="Dampak ke saldo dana"
                      value={form.cashImpact || 'Kas keluar'}
                      onChange={(v) => set('cashImpact', v)}
                    >
                      <option>Kas keluar</option>
                      <option>Penyesuaian nonkas</option>
                    </Select>
                  )}
                  {modal.kind === 'expense' && (
                    <p className="helper">
                      Pilih Penyesuaian nonkas untuk bahan terbuang atau kerugian stok
                      yang sudah dibeli. Jangan catat ulang pembayarannya.
                    </p>
                  )}
                  {modal.kind === 'capital' && (
                    <Select
                      label="Jenis modal"
                      value={form.type}
                      onChange={(v) => set('type', v)}
                    >
                      <option>Setoran</option>
                      <option>Pinjaman</option>
                    </Select>
                  )}
                  {modal.kind === 'payout' && (
                    <Select
                      label="Jenis penarikan"
                      value={form.type}
                      onChange={(v) => set('type', v)}
                    >
                      <option>Bagi laba</option>
                      <option>Pengembalian modal</option>
                      <option>Pelunasan pinjaman</option>
                    </Select>
                  )}
                  <Field
                    label="Tanggal pembayaran (WIB)"
                    type="date"
                    value={form.date}
                    onChange={(v) => set('date', v)}
                  />
                  <Field
                    label="Catatan (opsional)"
                    value={form.note}
                    onChange={(v) => set('note', v)}
                    required={false}
                  />
                </>
              )}
            {modal?.kind === 'member' && (
              <>
                <Field
                  label="Nama anggota"
                  value={form.name}
                  onChange={(v) => set('name', v)}
                />
                <Field
                  label="Porsi laba (%)"
                  type="number"
                  value={form.share}
                  onChange={(v) => set('share', v)}
                  min={0.01}
                  max={100}
                  step="any"
                />
                <p className="helper">
                  Total seluruh anggota harus 100% untuk simulasi bagi laba. Ini tidak
                  memberi akses akun secara otomatis.
                </p>
              </>
            )}
            {formError && (
              <div className="notice warning" role="alert">
                <AlertCircle size={18} />
                {formError}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <small>Dicatat atas nama {user}</small>
            <div>
              <button
                className="btn subtle"
                type="button"
                disabled={busy}
                onClick={() => setModal(null)}
              >
                Batal
              </button>
              <button
                className="btn primary"
                type="submit"
                disabled={
                  busy ||
                  (modal?.kind === 'sale' &&
                    (!productSelected ||
                      !hpp(productSelected, rows).ready ||
                      productSelected.data.price <= 0))
                }
              >
                {busy ? <RefreshCw className="spin" size={16} /> : <Check size={16} />}{' '}
                {busy ? 'Menyimpan…' : 'Simpan catatan'}
              </button>
            </div>
          </div>
        </form>
      </dialog>
      <dialog
        ref={confirmRef}
        className="modal confirm-modal"
        onCancel={(e) => {
          e.preventDefault();
          if (!busy) setConfirm(null);
        }}
      >
        <div className="modal-heading">
          <h2>Batalkan catatan ini?</h2>
        </div>
        <div className="modal-body">
          <p>
            <strong>{confirm?.data.name || confirm?.data.productName}</strong> akan
            dikeluarkan dari perhitungan. Aktivitas pembatalan tetap tercatat. Untuk
            mengembalikan nilainya, catat ulang.
          </p>
        </div>
        <div className="modal-footer">
          <button className="btn subtle" disabled={busy} onClick={() => setConfirm(null)}>
            Kembali
          </button>
          <button className="btn primary" disabled={busy} onClick={remove}>
            {busy ? 'Memproses…' : 'Ya, batalkan'}
          </button>
        </div>
      </dialog>
    </div>
  );
}
