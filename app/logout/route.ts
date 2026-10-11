import { cookies } from 'next/headers';
import { COOKIE_NAME } from '@/lib/session';
import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export async function GET(request: Request) {
  (await cookies()).delete(COOKIE_NAME);
  return NextResponse.redirect(new URL('/login', request.url));
}
