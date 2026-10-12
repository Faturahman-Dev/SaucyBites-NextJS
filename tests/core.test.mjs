import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { getDb, transaction } from '../.test-build/lib/database.js';
import * as api from '../.test-build/app/api/records/route.js';
import * as model from '../.test-build/app/model.js';
import {
  signSession,
  verifySession,
  passwordMatches,
  SESSION_AGE,
} from '../.test-build/lib/session.js';
let checks = 0;
const status = (r, n) => {
  assert.equal(r.status, n);
  checks++;
};
const call = (body, method = 'POST', origin = 'https://test.local') =>
  api[method](
    new Request('https://test.local/api/records', {
      method,
      headers: { 'content-type': 'application/json', origin },
      body: JSON.stringify(body),
    }),
  );
const save = (id, kind, data, revision = 0) => call({ id, kind, data, revision });
status(await api.GET(), 401);
status(await save('i1', 'ingredient', {}), 401);
globalThis.__testUser = { userId: 'u1', displayName: 'Tim Uji' };
status(
  await save('bad', 'ingredient', { name: 'Ayam', price: -1, packQty: 1000, unit: 'g' }),
  400,
);
status(
  await save('i1', 'ingredient', {
    name: 'Ayam',
    price: 50000,
    packQty: 1000,
    unit: 'g',
  }),
  200,
);
status(
  await save('i2', 'ingredient', { name: 'Box', price: 10000, packQty: 50, unit: 'pcs' }),
  200,
);
const product = {
  name: 'Chicken Bites Teriyaki',
  price: 15000,
  target: 100,
  lines: [
    { ingredientId: 'i1', qty: 100 },
    { ingredientId: 'i2', qty: 1 },
  ],
};
status(await save('teriyaki', 'product', product), 200);
const sale = {
  productId: 'teriyaki',
  qty: 2,
  discount: 1000,
  method: 'Tunai',
  date: '2026-10-11',
  note: '',
};
status(await save('s1', 'sale', sale), 200);
status(await save('s1', 'sale', sale), 409);
status(await save('sbad', 'sale', { ...sale, discount: 40000 }), 400);
status(await save('sbad2', 'sale', { ...sale, qty: -2 }), 400);
status(await save('sbad3', 'sale', { ...sale, date: '2026-02-31' }), 400);
status(
  await save('purchase1', 'purchase', {
    name: 'Belanja',
    amount: 50000,
    date: sale.date,
    note: '',
  }),
  200,
);
status(
  await save('expense1', 'expense', {
    name: 'Sewa',
    amount: 20000,
    date: sale.date,
    note: '',
  }),
  200,
);
status(
  await save('equip1', 'equipment', {
    name: 'Kompor',
    amount: 100000,
    events: 5,
    date: sale.date,
    note: '',
  }),
  200,
);
status(
  await save('capital1', 'capital', {
    name: 'Agung',
    amount: 200000,
    type: 'Setoran',
    date: sale.date,
    note: '',
  }),
  200,
);
let snapshot = await (await api.GET()).json(),
  f = model.finance(snapshot.rows);
assert.equal(f.revenue, 29000);
assert.equal(f.cogs, 10400);
assert.equal(f.cash, 59000);
assert.equal(f.profit, -21400);
checks += 4;
assert.equal(model.breakEven(snapshot.rows).units, 5);
checks++;
status(
  await save(
    'i1',
    'ingredient',
    { name: 'Ayam', price: 60000, packQty: 1000, unit: 'g' },
    1,
  ),
  200,
);
status(
  await save(
    'i1',
    'ingredient',
    { name: 'Ayam', price: 60000, packQty: 1000, unit: 'ml' },
    2,
  ),
  400,
);
status(
  await save(
    'i1',
    'ingredient',
    { name: 'Ayam', price: 70000, packQty: 1000, unit: 'g' },
    1,
  ),
  409,
);
status(await call({ id: 'i1', kind: 'ingredient', revision: 2 }, 'DELETE'), 400);
snapshot = await (await api.GET()).json();
assert.equal(snapshot.rows.find((r) => r.id === 's1').data.unitCost, 5200);
checks++;
assert.equal(
  model.hpp(
    snapshot.rows.find((r) => r.id === 'teriyaki'),
    snapshot.rows,
  ).cost,
  6200,
);
checks++;
status(await save('s2', 'sale', { ...sale, qty: 1, discount: 0, method: 'QRIS' }), 200);
snapshot = await (await api.GET()).json();
assert.equal(snapshot.rows.find((r) => r.id === 's2').data.costTotal, 6200);
checks++;
const beforeWaste = model.finance(snapshot.rows);
status(
  await save('waste1', 'expense', {
    name: 'Ayam terbuang',
    amount: 5000,
    date: sale.date,
    note: '',
    cashImpact: 'Penyesuaian nonkas',
  }),
  200,
);
snapshot = await (await api.GET()).json();
const afterWaste = model.finance(snapshot.rows);
assert.equal(afterWaste.cash, beforeWaste.cash);
assert.equal(afterWaste.profit, beforeWaste.profit - 5000);
checks += 2;
const race = await Promise.all([
  save(
    'expense1',
    'expense',
    { name: 'Sewa', amount: 30000, date: sale.date, note: '' },
    1,
  ),
  save(
    'expense1',
    'expense',
    { name: 'Sewa', amount: 40000, date: sale.date, note: '' },
    1,
  ),
]);
assert.deepEqual(race.map((r) => r.status).sort(), [200, 409]);
checks++;
status(await call({ id: 's1', kind: 'sale', revision: 1 }, 'DELETE'), 200);
snapshot = await (await api.GET()).json();
assert.equal(model.finance(snapshot.rows).revenue, 15000);
assert.equal(
  snapshot.rows.some((r) => r.id === 's1'),
  false,
);
assert.ok(snapshot.activity.some((a) => a.action === 'Membatalkan'));
checks += 3;
status(
  await call(
    { id: 'x', kind: 'sale', data: sale, revision: 0 },
    'POST',
    'https://other.local',
  ),
  403,
);

globalThis.__testUser = { userId: 'm1', displayName: 'Kasir', role: 'member' };
status(await save('mem1', 'member', { name: 'Anggota Baru', share: 20 }), 403);
status(
  await save('pay1', 'payout', {
    name: 'Agung',
    amount: 50000,
    date: sale.date,
    type: 'Bagi laba',
    note: '',
  }),
  403,
);
globalThis.__testUser = { userId: 'o1', displayName: 'Owner', role: 'owner' };
status(await save('mem1', 'member', { name: 'Anggota Baru', share: 20 }), 200);
checks += 3;

const secret = 'test-secret-with-more-than-32-characters';
const token = signSession('Agung', secret, 1000, 'team-password');
assert.equal(verifySession(token, secret, 2000, 'team-password').displayName, 'Agung');
assert.equal(
  verifySession(token, secret, 1000 + SESSION_AGE * 1000, 'team-password'),
  null,
);
assert.equal(verifySession(token + 'x', secret, 2000, 'team-password'), null);
assert.equal(verifySession(token, 'wrong-secret', 2000, 'team-password'), null);
assert.equal(verifySession(token, secret, 2000, 'new-password'), null);
assert.equal(verifySession('broken', secret), null);
assert.equal(passwordMatches('right', 'right'), true);
assert.equal(passwordMatches('wrong', 'right'), false);
const ownerToken = signSession('OwnerAgung', secret, 1000, 'owner-pass', 'owner');
const verifiedOwner = verifySession(ownerToken, secret, 2000, 'owner-pass');
assert.equal(verifiedOwner.role, 'owner');
assert.equal(verifiedOwner.displayName, 'OwnerAgung');
const memberToken = signSession('KasirBudi', secret, 1000, 'member-pass', 'member');
const verifiedMember = verifySession(memberToken, secret, 2000, 'member-pass');
assert.equal(verifiedMember.role, 'member');
assert.equal(verifiedMember.displayName, 'KasirBudi');
checks += 12;
const db = getDb();
assert.throws(() =>
  transaction((connection) => {
    connection
      .prepare(
        'INSERT INTO activity (id,record_id,action,label,author,time) VALUES (?,?,?,?,?,?)',
      )
      .run('rollback-test', 'r', 'test', 'test', 'test', '2026-10-11');
    throw new Error('force rollback');
  }),
);
assert.equal(
  db.prepare('SELECT id FROM activity WHERE id=?').get('rollback-test'),
  undefined,
);
checks += 2;

db.exec(
  `CREATE TRIGGER fail_test_activity BEFORE INSERT ON activity WHEN NEW.label='fail-audit' BEGIN SELECT RAISE(ABORT, 'test failure'); END;`,
);
status(
  await save('atomic-test', 'expense', {
    name: 'fail-audit',
    amount: 100,
    date: sale.date,
    note: '',
  }),
  503,
);
assert.equal(
  db.prepare('SELECT id FROM records WHERE id=?').get('atomic-test'),
  undefined,
);
checks++;
db.exec('DROP TRIGGER fail_test_activity');
const exported = await (await api.GET()).json();
const backupPath = path.join(path.dirname(process.env.DATABASE_PATH), 'backup.json');
fs.writeFileSync(backupPath, JSON.stringify({ app: 'SaucyBites', rows: exported.rows }));
const importEnv = {
  ...process.env,
  DATABASE_PATH: path.join(path.dirname(process.env.DATABASE_PATH), 'import.sqlite'),
};
execFileSync(process.execPath, ['scripts/db-init.mjs'], {
  env: importEnv,
  stdio: 'pipe',
});
const imported = execFileSync(
  process.execPath,
  ['--experimental-strip-types', 'scripts/import-backup.ts', backupPath],
  { env: importEnv, encoding: 'utf8' },
);
assert.ok(imported.includes('berhasil diimpor'));
checks++;
const again = spawnSync(
  process.execPath,
  ['--experimental-strip-types', 'scripts/import-backup.ts', backupPath],
  { env: importEnv, encoding: 'utf8' },
);
assert.notEqual(again.status, 0);
assert.ok(again.stderr.includes('database kosong'));
checks += 2;
db.close();
console.log(
  JSON.stringify({
    passed: checks,
    description:
      'Business calculations, SQLite API, concurrency, cancellation, noncash expenses, atomic rollback, and signed sessions.',
  }),
);
