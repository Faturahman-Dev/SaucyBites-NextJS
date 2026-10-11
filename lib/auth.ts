import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { COOKIE_NAME, verifySession, type TeamUser } from './session';
export function loginConfigured() {
  return (
    !!process.env.TEAM_ACCESS_PASSWORD && (process.env.SESSION_SECRET?.length || 0) >= 32
  );
}
export async function getTeamUser(): Promise<TeamUser | null> {
  if (!process.env.TEAM_ACCESS_PASSWORD && process.env.NODE_ENV === 'development')
    return { userId: 'local-dev', displayName: 'Pengembang lokal' };
  if (!loginConfigured()) return null;
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  return token
    ? verifySession(
        token,
        process.env.SESSION_SECRET!,
        Date.now(),
        process.env.TEAM_ACCESS_PASSWORD!,
      )
    : null;
}
export async function requireTeamUser() {
  const user = await getTeamUser();
  if (!user) redirect('/login');
  return user;
}
