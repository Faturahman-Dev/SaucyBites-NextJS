import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getCustomerFromCookie,
  getTeamUserFromCookie,
  loginConfigured,
  getOwnerPassword,
  getMemberPassword,
  getSessionSecret,
} from '@/lib/auth';
import {
  COOKIE_NAME,
  CUSTOMER_COOKIE_NAME,
  SESSION_AGE,
  signCustomerSession,
  signSession,
  type LoginTabRole,
  type UserRole,
} from '@/lib/session';
import {
  authenticateTeamAccount,
  getTeamAccountSummary,
  isValidGmail,
  MAX_TEAM_ACCOUNTS,
  normalizeGmail,
  registerTeamAccount,
} from '@/lib/users';
import { getCatalogProducts, getStoreConfig } from '@/lib/catalog';
import type { CatalogProduct } from '@/lib/catalog-types';
import { Flame, ShoppingBag } from 'lucide-react';
import LoginForm from './login-form';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const limiter = globalThis as typeof globalThis & {
  saucyLoginTries?: Map<string, { count: number; until: number }>;
};

async function login(form: FormData) {
  'use server';
  if (!loginConfigured()) redirect('/login?error=config');

  const ip = (await headers()).get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const tries = (limiter.saucyLoginTries ??= new Map());
  for (const [key, entry] of tries) {
    if (entry.until <= Date.now()) tries.delete(key);
  }
  const entry = tries.get(ip) || { count: 0, until: Date.now() + 600000 };
  if (entry.count >= 15) redirect('/login?error=rate');
  entry.count++;
  tries.set(ip, entry);

  const quickRole = String(form.get('quick_role') || '').trim();
  const isDev = process.env.NODE_ENV === 'development';
  const rawRole = String(form.get('role') || 'owner');
  const authMode = String(form.get('auth_mode') || 'signin');

  // 1. Mode Dev Quick Login
  if (
    isDev &&
    (quickRole === 'owner' || quickRole === 'member' || quickRole === 'customer')
  ) {
    if (quickRole === 'customer') {
      tries.delete(ip);
      const cookieStore = await cookies();
      cookieStore.set(
        CUSTOMER_COOKIE_NAME,
        signCustomerSession(
          {
            name: 'Pelanggan SaucyBites',
            email: 'pelanggan.saucybites@gmail.com',
            phone: '081234567890',
          },
          getSessionSecret(),
        ),
        {
          httpOnly: true,
          sameSite: 'lax',
          secure: false,
          path: '/',
          maxAge: SESSION_AGE,
        },
      );
      redirect('/catalog');
    }

    const devEmail =
      quickRole === 'owner'
        ? 'owner.saucybites@gmail.com'
        : 'tim.saucybites@gmail.com';
    const devName = quickRole === 'owner' ? 'Owner' : 'Anggota Tim';
    const devPass = quickRole === 'owner' ? 'owner123' : 'tim123';

    let authRes = await authenticateTeamAccount({
      email: devEmail,
      password: devPass,
      role: quickRole,
    });
    if (!authRes.ok && authRes.code === 'not_found') {
      authRes = await registerTeamAccount({
        email: devEmail,
        name: devName,
        password: devPass,
        role: quickRole,
      });
    }
    if (!authRes.ok) {
      redirect(`/login?error=${authRes.code}&role=${quickRole}`);
    }

    tries.delete(ip);
    const expectedPw =
      quickRole === 'owner' ? getOwnerPassword() : getMemberPassword();
    const cookieStore = await cookies();
    cookieStore.delete('saucybites_logged_out');
    cookieStore.set(
      COOKIE_NAME,
      signSession(
        authRes.account.name,
        getSessionSecret(),
        Date.now(),
        expectedPw,
        authRes.account.role,
        authRes.account.email,
      ),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        path: '/',
        maxAge: SESSION_AGE,
      },
    );
    redirect('/');
  }

  // 2. Login Customer -> Redirect ke Katalog Produk (/catalog)
  if (rawRole === 'customer' || authMode === 'customer') {
    const name = String(form.get('name') || '').trim();
    const email = normalizeGmail(String(form.get('email') || ''));
    const phone = String(form.get('phone') || '').trim();

    if (name.length < 2 || name.length > 80) {
      redirect('/login?error=invalid_name&role=customer');
    }
    if (!isValidGmail(email)) {
      redirect('/login?error=non_gmail&role=customer');
    }

    tries.delete(ip);
    const cookieStore = await cookies();
    cookieStore.set(
      CUSTOMER_COOKIE_NAME,
      signCustomerSession({ name, email, phone }, getSessionSecret()),
      {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: SESSION_AGE,
      },
    );
    redirect('/catalog');
  }

  // 3. Login / Daftar Akun Tim (Owner & Anggota Tim) dengan batas maks 4 akun @gmail.com
  const role: UserRole = rawRole === 'member' ? 'member' : 'owner';
  const email = normalizeGmail(String(form.get('email') || ''));
  const name = String(form.get('name') || '').trim();
  const password = String(form.get('password') || '');

  const result =
    authMode === 'signup'
      ? await registerTeamAccount({ email, name, password, role })
      : await authenticateTeamAccount({ email, password, role });

  if (!result.ok) {
    redirect(
      `/login?error=${result.code}&role=${role}&mode=${
        authMode === 'signup' ? 'signup' : 'signin'
      }`,
    );
  }

  tries.delete(ip);
  const expectedPassword =
    result.account.role === 'owner' ? getOwnerPassword() : getMemberPassword();
  const cookieStore = await cookies();
  cookieStore.delete('saucybites_logged_out');
  cookieStore.set(
    COOKIE_NAME,
    signSession(
      result.account.name,
      getSessionSecret(),
      Date.now(),
      expectedPassword,
      result.account.role,
      result.account.email,
    ),
    {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_AGE,
    },
  );
  redirect('/');
}

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; role?: string; mode?: string }>;
}) {
  const { error, role: queryRole, mode: queryMode } = await searchParams;
  const cookieUser = await getTeamUserFromCookie();
  if (cookieUser && queryRole !== 'customer') redirect('/');

  const initialRole: LoginTabRole =
    queryRole === 'member'
      ? 'member'
      : queryRole === 'customer'
        ? 'customer'
        : 'owner';
  const initialMode: 'signin' | 'signup' =
    queryMode === 'signup' ? 'signup' : 'signin';
  const isConfigured = loginConfigured();

  const [accountSummary, customerSession] = await Promise.all([
    getTeamAccountSummary(),
    getCustomerFromCookie(),
  ]);

  const store = getStoreConfig();
  let catalogProducts: CatalogProduct[] = [];
  try {
    catalogProducts = await getCatalogProducts();
  } catch {
    catalogProducts = [];
  }

  const messages: Record<string, string> = {
    config: 'Konfigurasi session server belum lengkap.',
    rate: 'Terlalu banyak percobaan login. Tunggu 10 menit lalu coba lagi.',
    non_gmail:
      'Wajib menggunakan alamat email berdomain @gmail.com yang valid (contoh: nama@gmail.com).',
    invalid_name: 'Nama lengkap harus diisi antara 2 hingga 80 karakter.',
    weak_password: 'Password akun minimal terdiri dari 6 karakter.',
    exists:
      'Alamat email @gmail.com tersebut sudah terdaftar di database. Silakan pilih tab "Masuk Akun Terdaftar".',
    quota_full: `Batas maksimal ${MAX_TEAM_ACCOUNTS} akun @gmail.com di database sudah penuh (${accountSummary.count}/${MAX_TEAM_ACCOUNTS}). Tidak dapat mendaftarkan akun baru.`,
    not_found:
      'Email @gmail.com tersebut belum terdaftar di database. Silakan klik "Daftar Akun Gmail" untuk mendaftar selama kuota masih tersedia.',
    invalid_password:
      'Password tidak sesuai dengan akun @gmail.com yang dimasukkan.',
    role_mismatch: `Email @gmail.com ini terdaftar pada peran yang berbeda. Silakan pindah ke tab Pemilik (Owner) atau Anggota Tim yang sesuai.`,
    invalid: 'Data login belum sesuai. Periksa kembali email @gmail.com dan password Anda.',
  };

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-logo">
          <div className="login-logo-brand">
            <Flame size={31} />
            <b>SaucyBites.</b>
          </div>
          <a
            href="/catalog"
            className="inline-flex min-h-11 items-center gap-1.5 rounded-[9px] border border-[#d6ddd0] bg-[#fafbf7] px-3 py-2 text-xs font-bold text-[#21362c] transition hover:bg-[#eef1e8]"
          >
            <ShoppingBag size={14} />
            Katalog Produk
          </a>
        </div>
        <div className="eyebrow">
          RUANG USAHA, AKUN GMAIL (MAKS. 4) &amp; KATALOG CUSTOMER
        </div>
        <h1>Masuk ke SaucyBites</h1>
        <p>
          Pilih peran <strong>Owner</strong> atau <strong>Anggota Tim</strong> untuk
          mengelola usaha (dibatasi maks. {MAX_TEAM_ACCOUNTS} akun{' '}
          <code>@gmail.com</code>), atau pilih <strong>Customer</strong> untuk membuka
          katalog produk.
        </p>

        {(!isConfigured || error) && (
          <div
            className="notice warning"
            role="alert"
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            <strong>
              {error
                ? messages[error] || messages.invalid
                : 'Konfigurasi server belum lengkap.'}
            </strong>
          </div>
        )}

        <LoginForm
          initialRole={initialRole}
          initialMode={initialMode}
          loginAction={login}
          loginConfigured={isConfigured}
          isDev={process.env.NODE_ENV === 'development'}
          accountSummary={accountSummary}
          catalogProducts={catalogProducts}
          storeName={store.name}
          customerSession={customerSession}
        />

        <small>
          <strong>Aturan Database Akun:</strong> Pendaftaran akun tim dibatasi maksimal{' '}
          <strong>{MAX_TEAM_ACCOUNTS} akun</strong> dan wajib menggunakan email{' '}
          <strong>@gmail.com</strong>. Pelanggan dapat masuk lewat tab{' '}
          <strong>Customer</strong> untuk langsung mengakses Katalog Produk.
        </small>
      </section>
    </main>
  );
}
