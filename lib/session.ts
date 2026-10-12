import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
export const COOKIE_NAME = 'saucybites_session';
export const SESSION_AGE = 7 * 24 * 60 * 60;
export type UserRole = 'owner' | 'member';
export type TeamUser = { userId: string; displayName: string; role: UserRole };
function signature(text: string, secret: string) {
  return createHmac('sha256', secret).update(text).digest('base64url');
}
export function passwordMatches(input: string, expected: string) {
  return timingSafeEqual(
    createHash('sha256').update(input).digest(),
    createHash('sha256').update(expected).digest(),
  );
}
export function signSession(
  name: string,
  secret: string,
  now = Date.now(),
  passwordVersion = '',
  role: UserRole = 'member',
) {
  const value = Buffer.from(
    JSON.stringify({
      name,
      role,
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

    return { userId: data.name, displayName: data.name, role };
  } catch {
    return null;
  }
}
