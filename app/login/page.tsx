import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import {
  getTeamUserFromCookie,
  loginConfigured,
  getOwnerPassword,
  getMemberPassword,
  getSessionSecret,
  getConfigIssues,
} from '@/lib/auth';
import {
  COOKIE_NAME,
  SESSION_AGE,
  passwordMatches,
  signSession,
  type UserRole,
} from '@/lib/session';
import { Flame } from 'lucide-react';
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
  if (entry.count >= 10) redirect('/login?error=rate');
  entry.count++;
  tries.set(ip, entry);

  const quickRole = String(form.get('quick_role') || '').trim();
  const isDev = process.env.NODE_ENV === 'development';

  let role: UserRole = form.get('role') === 'member' ? 'member' : 'owner';
  let name = String(form.get('name') || '').trim();
  let password = String(form.get('password') || '');

  if (isDev && (quickRole === 'owner' || quickRole === 'member')) {
    role = quickRole;
    name = quickRole === 'owner' ? 'Owner' : 'Anggota Tim';
    password = quickRole === 'owner' ? getOwnerPassword() : getMemberPassword();
  }

  const expectedPassword = role === 'owner' ? getOwnerPassword() : getMemberPassword();

  if (!expectedPassword) {
    redirect(`/login?error=no_password&role=${role}`);
  }

  if (
    !name ||
    name.length > 80 ||
    password.length > 1000 ||
    !passwordMatches(password, expectedPassword)
  ) {
    redirect(`/login?error=invalid&role=${role}`);
  }

  tries.delete(ip);
  const cookieStore = await cookies();
  cookieStore.delete('saucybites_logged_out');
  cookieStore.set(
    COOKIE_NAME,
    signSession(name, getSessionSecret(), Date.now(), expectedPassword, role),
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
  searchParams: Promise<{ error?: string; role?: string }>;
}) {
  const cookieUser = await getTeamUserFromCookie();
  if (cookieUser) redirect('/');

  const { error, role: queryRole } = await searchParams;
  const initialRole: UserRole = queryRole === 'member' ? 'member' : 'owner';
  const isConfigured = loginConfigured();

  const messages: Record<string, string> = {
    config: 'Konfigurasi password server belum lengkap di Vercel.',
    rate: 'Terlalu banyak percobaan login. Tunggu 10 menit lalu coba lagi.',
    no_password: `Password untuk ${initialRole === 'owner' ? 'Owner (Pemilik)' : 'Anggota Tim'} belum terpasang di server Vercel. Pastikan sudah mengisi OWNER_ACCESS_PASSWORD atau TEAM_ACCESS_PASSWORD di Vercel dan sudah di-Redeploy.`,
    invalid: `Password atau nama untuk ${initialRole === 'owner' ? 'Owner (Pemilik)' : 'Anggota Tim'} belum sesuai. Pastikan tidak ada salah ketik huruf besar/kecil. (Catatan: Jika Anda baru saja mengubah password di Vercel, pastikan sudah klik "Redeploy" agar password baru tersebut aktif!).`,
  };

  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-logo">
          <Flame size={31} />
          <b>SaucyBites.</b>
        </div>
        <div className="eyebrow">RUANG USAHA & PENCATATAN KEUANGAN</div>
        <h1>Masuk ke Sistem</h1>
        <p>Pilih peran Anda untuk mulai mengelola atau mencatat transaksi usaha.</p>

        {(!isConfigured || error) && (
          <div
            className="notice warning"
            role="alert"
            style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            <strong>
              {error ? messages[error] || messages.invalid : 'Konfigurasi server belum lengkap di Vercel:'}
            </strong>
            {!isConfigured && (
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <p style={{ margin: '0 0 6px 0' }}>
                  Buka <strong>Project Settings → Environment Variables</strong> di Vercel, lalu tambahkan:
                </p>
                <ul style={{ margin: '0 0 8px 18px', padding: 0 }}>
                  <li><code>OWNER_ACCESS_PASSWORD</code> (Password untuk login Owner)</li>
                  <li><code>TEAM_ACCESS_PASSWORD</code> (Password untuk login Anggota Tim)</li>
                </ul>
                <p style={{ margin: 0, fontWeight: 600 }}>
                  ⚠️ Penting: Lakukan <strong>Redeploy</strong> di Vercel setelah menambahkan Environment Variables agar aktif!
                </p>
              </div>
            )}
          </div>
        )}

        <LoginForm
          initialRole={initialRole}
          loginAction={login}
          loginConfigured={isConfigured}
          isDev={process.env.NODE_ENV === 'development'}
        />

        <small>
          Peran <strong>Owner</strong> memiliki kendali penuh (resep, modal, bagi laba).
          Peran <strong>Anggota Tim</strong> untuk operasional kasir &amp; belanja.
        </small>
      </section>
    </main>
  );
}
