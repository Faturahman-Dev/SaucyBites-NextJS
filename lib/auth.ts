import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, verifySession, type TeamUser, type UserRole } from './session';

export function getOwnerPassword(): string {
  return (
    process.env.OWNER_ACCESS_PASSWORD ||
    process.env.OWNER_PASSWORD ||
    (process.env.NODE_ENV === 'development' ? 'owner123' : '')
  );
}

export function getMemberPassword(): string {
  return (
    process.env.TEAM_ACCESS_PASSWORD ||
    (process.env.NODE_ENV === 'development' ? 'tim123' : '')
  );
}

export function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV === 'development'
      ? 'saucybites-dev-secret-key-at-least-32-chars-long'
      : '')
  );
}

export function loginConfigured() {
  const secret = getSessionSecret();
  return (
    secret.length >= 32 && (Boolean(getOwnerPassword()) || Boolean(getMemberPassword()))
  );
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
