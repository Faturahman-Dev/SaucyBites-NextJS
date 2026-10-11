import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getTeamUser, loginConfigured } from '@/lib/auth';
import { COOKIE_NAME, SESSION_AGE, passwordMatches, signSession } from '@/lib/session';
import { Flame, LockKeyhole } from 'lucide-react';
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
  const name = String(form.get('name') || '').trim(),
    password = String(form.get('password') || '');
  if (
    !name ||
    name.length > 80 ||
    password.length > 1000 ||
    !passwordMatches(password, process.env.TEAM_ACCESS_PASSWORD!)
  )
    redirect('/login?error=invalid');
  tries.delete(ip);
  (await cookies()).set(
    COOKIE_NAME,
    signSession(
      name,
      process.env.SESSION_SECRET!,
      Date.now(),
      process.env.TEAM_ACCESS_PASSWORD!,
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
  searchParams: Promise<{ error?: string }>;
}) {
  if (await getTeamUser()) redirect('/');
  const { error } = await searchParams;
  const messages: Record<string, string> = {
    config: 'Isi TEAM_ACCESS_PASSWORD dan SESSION_SECRET di konfigurasi server.',
    rate: 'Terlalu banyak percobaan. Tunggu 10 menit lalu coba lagi.',
    invalid: 'Nama atau password belum benar. Coba lagi.',
  };
  return (
    <main className="login-screen">
      <section className="login-card">
        <div className="login-logo">
          <Flame size={31} />
          <b>SaucyBites.</b>
        </div>
        <div className="eyebrow">RUANG TIM / FINANCIAL TRACKER</div>
        <h1>Selamat datang, tim.</h1>
        <p>Masuk untuk mencatat penjualan dan menjaga keuangan usaha tetap rapi.</p>
        {(!loginConfigured() || error) && (
          <div className="notice warning" role="alert">
            {messages[error || 'config'] || messages.invalid}
          </div>
        )}
        <form action={login}>
          <label className="field">
            <span>Nama pencatat</span>
            <input
              name="name"
              placeholder="Nama lu di tim"
              autoComplete="name"
              required
              maxLength={80}
            />
          </label>
          <label className="field">
            <span>Password tim</span>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={1000}
            />
          </label>
          <button className="btn primary wide" disabled={!loginConfigured()}>
            <LockKeyhole size={17} />
            Masuk ke ruang tim
          </button>
        </form>
        <small>
          Nama digunakan untuk riwayat aktivitas. Password disiapkan oleh pemilik server.
        </small>
      </section>
    </main>
  );
}
