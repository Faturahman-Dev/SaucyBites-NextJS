import { randomBytes, randomUUID, scryptSync, timingSafeEqual } from 'node:crypto';
import { getClient, getDb, initDb, isTurso, transaction } from '@/lib/database';
import type { UserRole } from '@/lib/session';

export const MAX_TEAM_ACCOUNTS = 4;

export type TeamAccountPublic = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
};

export type AuthErrorCode =
  | 'non_gmail'
  | 'invalid_name'
  | 'weak_password'
  | 'exists'
  | 'quota_full'
  | 'not_found'
  | 'invalid_password'
  | 'role_mismatch';

export type AuthAccountResult =
  | { ok: true; account: TeamAccountPublic }
  | { ok: false; code: AuthErrorCode; message: string };

const GMAIL_REGEX = /^[a-z0-9](?:[a-z0-9._%+-]{0,62}[a-z0-9])?@gmail\.com$/i;

export function normalizeGmail(raw: string): string {
  return String(raw || '')
    .trim()
    .toLowerCase();
}

export function isValidGmail(raw: string): boolean {
  const email = normalizeGmail(raw);
  if (!email || email.length > 120 || email.includes('..')) return false;
  return GMAIL_REGEX.test(email);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  if (!password || !storedHash) return false;
  const [salt, key] = storedHash.split(':');
  if (!salt || !key) return false;
  try {
    const derived = scryptSync(password, salt, 64);
    const expected = Buffer.from(key, 'hex');
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

function toPublicAccount(row: any): TeamAccountPublic {
  return {
    id: String(row.id),
    email: String(row.email),
    name: String(row.name),
    role: row.role === 'owner' ? 'owner' : 'member',
    createdAt: String(row.created_at),
  };
}

export async function getTeamAccountSummary(): Promise<{
  count: number;
  max: number;
  remaining: number;
  accounts: TeamAccountPublic[];
}> {
  if (isTurso) {
    await initDb();
    const res = await getClient().execute(
      'SELECT id, email, name, role, created_at FROM users ORDER BY created_at ASC',
    );
    const accounts = res.rows.map(toPublicAccount);
    return {
      count: accounts.length,
      max: MAX_TEAM_ACCOUNTS,
      remaining: Math.max(0, MAX_TEAM_ACCOUNTS - accounts.length),
      accounts,
    };
  }

  const rows = getDb()
    .prepare('SELECT id, email, name, role, created_at FROM users ORDER BY created_at ASC')
    .all() as any[];
  const accounts = rows.map(toPublicAccount);
  return {
    count: accounts.length,
    max: MAX_TEAM_ACCOUNTS,
    remaining: Math.max(0, MAX_TEAM_ACCOUNTS - accounts.length),
    accounts,
  };
}

export async function registerTeamAccount(input: {
  email: string;
  name: string;
  password: string;
  role: UserRole;
}): Promise<AuthAccountResult> {
  const email = normalizeGmail(input.email);
  const name = String(input.name || '').trim();
  const password = String(input.password || '');
  const role: UserRole = input.role === 'owner' ? 'owner' : 'member';

  if (!isValidGmail(email)) {
    return {
      ok: false,
      code: 'non_gmail',
      message: 'Akun wajib menggunakan alamat email @gmail.com yang valid.',
    };
  }
  if (name.length < 2 || name.length > 80) {
    return {
      ok: false,
      code: 'invalid_name',
      message: 'Nama pengguna harus terdiri dari 2 hingga 80 karakter.',
    };
  }
  if (password.length < 6 || password.length > 1000) {
    return {
      ok: false,
      code: 'weak_password',
      message: 'Password akun minimal terdiri dari 6 karakter.',
    };
  }

  const passwordHash = hashPassword(password);
  const id = randomUUID();
  const createdAt = new Date().toISOString();

  if (isTurso) {
    await initDb();
    const client = getClient();
    const existing = await client.execute({
      sql: 'SELECT id FROM users WHERE lower(email) = ?',
      args: [email],
    });
    if (existing.rows.length > 0) {
      return {
        ok: false,
        code: 'exists',
        message: 'Alamat @gmail.com tersebut sudah terdaftar. Silakan masuk.',
      };
    }
    const countRes = await client.execute('SELECT COUNT(*) AS total FROM users');
    const total = Number(countRes.rows[0]?.total ?? 0);
    if (total >= MAX_TEAM_ACCOUNTS) {
      return {
        ok: false,
        code: 'quota_full',
        message: `Batas maksimal ${MAX_TEAM_ACCOUNTS} akun @gmail.com di database sudah penuh.`,
      };
    }
    await client.execute({
      sql: 'INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      args: [id, email, name, role, passwordHash, createdAt],
    });
    return {
      ok: true,
      account: { id, email, name, role, createdAt },
    };
  }

  return transaction((db) => {
    const existing = db
      .prepare('SELECT id FROM users WHERE lower(email) = ?')
      .get(email) as { id: string } | undefined;
    if (existing) {
      return {
        ok: false,
        code: 'exists',
        message: 'Alamat @gmail.com tersebut sudah terdaftar. Silakan masuk.',
      };
    }
    const countRow = db
      .prepare('SELECT COUNT(*) AS total FROM users')
      .get() as { total: number };
    if (Number(countRow?.total ?? 0) >= MAX_TEAM_ACCOUNTS) {
      return {
        ok: false,
        code: 'quota_full',
        message: `Batas maksimal ${MAX_TEAM_ACCOUNTS} akun @gmail.com di database sudah penuh.`,
      };
    }
    db.prepare(
      'INSERT INTO users (id, email, name, role, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    ).run(id, email, name, role, passwordHash, createdAt);

    return {
      ok: true,
      account: { id, email, name, role, createdAt },
    };
  });
}

export async function authenticateTeamAccount(input: {
  email: string;
  password: string;
  role?: UserRole;
}): Promise<AuthAccountResult> {
  const email = normalizeGmail(input.email);
  const password = String(input.password || '');

  if (!isValidGmail(email)) {
    return {
      ok: false,
      code: 'non_gmail',
      message: 'Login wajib menggunakan akun email @gmail.com yang terdaftar.',
    };
  }

  let row: any;
  if (isTurso) {
    await initDb();
    const res = await getClient().execute({
      sql: 'SELECT id, email, name, role, password_hash, created_at FROM users WHERE lower(email) = ?',
      args: [email],
    });
    row = res.rows[0];
  } else {
    row = getDb()
      .prepare(
        'SELECT id, email, name, role, password_hash, created_at FROM users WHERE lower(email) = ?',
      )
      .get(email);
  }

  if (!row) {
    return {
      ok: false,
      code: 'not_found',
      message: 'Akun @gmail.com ini belum terdaftar di database. Silakan daftar terlebih dahulu.',
    };
  }

  if (!verifyPassword(password, String(row.password_hash))) {
    return {
      ok: false,
      code: 'invalid_password',
      message: 'Password tidak sesuai dengan akun @gmail.com yang dimasukkan.',
    };
  }

  const account = toPublicAccount(row);
  if (input.role && account.role !== input.role) {
    return {
      ok: false,
      code: 'role_mismatch',
      message: `Akun ${account.email} terdaftar sebagai ${
        account.role === 'owner' ? 'Pemilik (Owner)' : 'Anggota Tim'
      }, silakan pilih tab peran yang sesuai.`,
    };
  }

  return { ok: true, account };
}
