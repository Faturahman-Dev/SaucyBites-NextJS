import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
export const COOKIE_NAME = 'saucybites_session';
export const CUSTOMER_COOKIE_NAME = 'saucybites_customer';
export const SESSION_AGE = 7 * 24 * 60 * 60;
export type UserRole = 'owner' | 'member';
export type LoginTabRole = UserRole | 'customer';
export type TeamUser = {
  userId: string;
  displayName: string;
  role: UserRole;
  email?: string;
};
export type CustomerUser = {
  name: string;
  email: string;
  phone?: string;
};
function signature(text: string, secret: string) {
  return createHmac('sha256', secret).update(text).digest('base64url');
}
export function passwordMatches(input: string, expected: string): boolean {
  if (!input || !expected) return false;
  const hash = (s: string) => createHash('sha256').update(s).digest();
  const safeCompare = (a: string, b: string) => {
    const ha = hash(a);
    const hb = hash(b);
    return timingSafeEqual(ha, hb);
  };

  const cleanInput = input
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();
  const cleanExpected = expected
    .trim()
    .replace(/^["']|["']$/g, '')
    .trim();

  return (
    safeCompare(input, expected) ||
    safeCompare(input.trim(), expected.trim()) ||
    safeCompare(cleanInput, cleanExpected)
  );
}
export function signSession(
  name: string,
  secret: string,
  now = Date.now(),
  passwordVersion = '',
  role: UserRole = 'member',
  email?: string,
) {
  const value = Buffer.from(
    JSON.stringify({
      name,
      role,
      ...(email ? { email } : {}),
      exp: now + SESSION_AGE * 1000,
      pv: createHash('sha256').update(passwordVersion).digest('hex'),
    }),
  ).toString('base64url');
  return value + '.' + signature(value, secret);
}
export function verifySession(
  token: string,
  secret: string,
  now = Date.now(),
  passwordVersion: string | string[] | ((role: UserRole) => string) = '',
): TeamUser | null {
  try {
    const [value, sig, ...rest] = token.split('.');
    if (rest.length || !value || !sig) return null;
    const actual = Buffer.from(sig),
      expected = Buffer.from(signature(value, secret));
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const data = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (
      typeof data.name !== 'string' ||
      !data.name.trim() ||
      data.name.length > 80 ||
      !Number.isFinite(data.exp) ||
      data.exp <= now
    )
      return null;

    const role: UserRole = data.role === 'owner' ? 'owner' : 'member';

    if (passwordVersion) {
      if (typeof passwordVersion === 'function') {
        const expectedPv = passwordVersion(role);
        if (
          expectedPv &&
          data.pv !== createHash('sha256').update(expectedPv).digest('hex')
        ) {
          return null;
        }
      } else if (Array.isArray(passwordVersion)) {
        const match = passwordVersion.some(
          (pv) => createHash('sha256').update(pv).digest('hex') === data.pv,
        );
        if (!match) return null;
      } else if (typeof passwordVersion === 'string') {
        if (data.pv !== createHash('sha256').update(passwordVersion).digest('hex')) {
          return null;
        }
      }
    }

    const email = typeof data.email === 'string' && data.email ? data.email : undefined;
    return {
      userId: email || data.name,
      displayName: data.name,
      role,
      ...(email ? { email } : {}),
    };
  } catch {
    return null;
  }
}

export function signCustomerSession(
  customer: CustomerUser,
  secret: string,
  now = Date.now(),
): string {
  const value = Buffer.from(
    JSON.stringify({
      name: customer.name.trim(),
      email: customer.email.trim().toLowerCase(),
      phone: customer.phone ? customer.phone.trim() : '',
      exp: now + SESSION_AGE * 1000,
    }),
  ).toString('base64url');
  return value + '.' + signature(value, secret);
}

export function verifyCustomerSession(
  token: string,
  secret: string,
  now = Date.now(),
): CustomerUser | null {
  try {
    const [value, sig, ...rest] = token.split('.');
    if (rest.length || !value || !sig) return null;
    const actual = Buffer.from(sig),
      expected = Buffer.from(signature(value, secret));
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
      return null;
    const data = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (
      typeof data.name !== 'string' ||
      !data.name.trim() ||
      data.name.length > 80 ||
      typeof data.email !== 'string' ||
      !data.email.trim() ||
      !Number.isFinite(data.exp) ||
      data.exp <= now
    ) {
      return null;
    }
    return {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      ...(data.phone ? { phone: String(data.phone).trim() } : {}),
    };
  } catch {
    return null;
  }
}
