import { cookies } from 'next/headers';
import { COOKIE_NAME, CUSTOMER_COOKIE_NAME } from '@/lib/session';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  const url = new URL(request.url);
  const role = url.searchParams.get('role');
  const cookieStore = await cookies();
  if (role === 'customer') {
    cookieStore.delete(CUSTOMER_COOKIE_NAME);
    return NextResponse.redirect(new URL('/login?role=customer', request.url));
  }
  cookieStore.delete(COOKIE_NAME);
  cookieStore.set('saucybites_logged_out', '1', {
    path: '/',
    maxAge: 86400,
    sameSite: 'lax',
  });
  return NextResponse.redirect(new URL('/login', request.url));
}
