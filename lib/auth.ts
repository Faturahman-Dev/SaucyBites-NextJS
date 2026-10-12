import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createHash } from 'node:crypto';
import { COOKIE_NAME, verifySession, type TeamUser, type UserRole } from './session';

function cleanEnv(val: string | undefined): string {
  if (!val) return '';
  return val
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
}

export function getOwnerPassword(): string {
  const direct = cleanEnv(
    process.env.OWNER_ACCESS_PASSWORD ||
      process.env.OWNER_PASSWORD ||
      process.env.PASSWORD_OWNER ||
      process.env.ADMIN_PASSWORD,
  );
  if (direct) return direct;

  const team = cleanEnv(
    process.env.TEAM_ACCESS_PASSWORD ||
      process.env.MEMBER_ACCESS_PASSWORD ||
      process.env.TEAM_PASSWORD ||
      process.env.MEMBER_PASSWORD,
  );
  if (team) return team;

  return process.env.NODE_ENV === 'development' ? 'owner123' : '';
}

export function getMemberPassword(): string {
  const direct = cleanEnv(
    process.env.TEAM_ACCESS_PASSWORD ||
      process.env.MEMBER_ACCESS_PASSWORD ||
      process.env.TEAM_PASSWORD ||
      process.env.MEMBER_PASSWORD,
  );
  if (direct) return direct;

  const owner = cleanEnv(
    process.env.OWNER_ACCESS_PASSWORD ||
      process.env.OWNER_PASSWORD ||
      process.env.PASSWORD_OWNER ||
      process.env.ADMIN_PASSWORD,
  );
  if (owner) return owner;

  return process.env.NODE_ENV === 'development' ? 'tim123' : '';
}

export function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 32) {
    return process.env.SESSION_SECRET;
  }
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length > 0) {
    return createHash('sha256')
      .update(process.env.SESSION_SECRET + '_saucybites_secret_salt')
      .digest('hex');
  }
  const ownerPw = getOwnerPassword();
  const memberPw = getMemberPassword();
  if (ownerPw || memberPw) {
    return createHash('sha256')
      .update(`${ownerPw}:${memberPw}:saucybites_session_secret_2026`)
      .digest('hex');
  }
  if (process.env.NODE_ENV === 'development') {
    return 'saucybites-dev-secret-key-at-least-32-chars-long';
  }
  return '';
}

export function loginConfigured(): boolean {
  const secret = getSessionSecret();
  return (
    secret.length >= 32 && (Boolean(getOwnerPassword()) || Boolean(getMemberPassword()))
  );
}

export function getConfigIssues(): string[] {
  const issues: string[] = [];
  const ownerPw = getOwnerPassword();
  const memberPw = getMemberPassword();

  if (!ownerPw && !memberPw) {
    issues.push('OWNER_ACCESS_PASSWORD atau TEAM_ACCESS_PASSWORD belum diisi di Vercel.');
  }
  return issues;
}

export async function getTeamUserFromCookie(): Promise<TeamUser | null> {
  const secret = getSessionSecret();
  if (!secret || secret.length < 32) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token, secret, Date.now(), (role: UserRole) =>
    role === 'owner' ? getOwnerPassword() : getMemberPassword(),
  );
}

export async function getTeamUser(): Promise<TeamUser | null> {
  const cookieUser = await getTeamUserFromCookie();
  if (cookieUser) return cookieUser;

  // Mode pengembangan: otomatis terdeteksi sebagai Owner jika belum login / logout eksplisit
  if (process.env.NODE_ENV === 'development') {
    const cookieStore = await cookies();
    const isLoggedOut = cookieStore.get('saucybites_logged_out')?.value === '1';
    if (!isLoggedOut) {
      return {
        userId: 'owner-dev',
        displayName: 'Owner',
        role: 'owner',
      };
    }
  }

  return null;
}

export async function requireTeamUser() {
  const user = await getTeamUser();
  if (!user) redirect('/login');
  return user;
}
