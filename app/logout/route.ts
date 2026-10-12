import { cookies } from 'next/headers';
import { COOKIE_NAME } from '@/lib/session';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
  cookieStore.set('saucybites_logged_out', '1', {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });
  return NextResponse.redirect(new URL('/login', request.url));
}
