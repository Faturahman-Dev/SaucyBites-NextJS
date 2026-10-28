import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
const out = path.resolve('.test-build'),
  temp = fs.mkdtempSync(path.join(os.tmpdir(), 'saucybites-test-'));
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
const files = [
  'app/model.ts',
  'app/api/records/route.ts',
  'lib/database.ts',
  'lib/session.ts',
  'lib/users.ts',
  'lib/validation.ts',
  'lib/catalog-types.ts',
  'lib/catalog.ts',
  'utils/whatsapp.ts',
];
for (const filename of files) {
  const destination = path.join(out, filename.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  const compiled = ts
    .transpileModule(fs.readFileSync(filename, 'utf8'), {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
    })
    .outputText.replace(/(['"])@\/([^'"]+)\1/g, (_, quote, importPath) => {
      const rel = path
        .relative(path.dirname(destination), path.join(out, importPath + '.js'))
        .replaceAll('\\', '/');
      return quote + (rel.startsWith('.') ? rel : './' + rel) + quote;
    });
  fs.writeFileSync(destination, compiled);
}
fs.writeFileSync(
  path.join(out, 'lib/auth.js'),
  'export async function getTeamUser(){return globalThis.__testUser??null;}',
);
const env = { ...process.env, DATABASE_PATH: path.join(temp, 'test.sqlite') };
try {
  execFileSync(process.execPath, ['scripts/db-init.mjs'], { env, stdio: 'pipe' });
  execFileSync(process.execPath, ['tests/core.test.mjs'], { env, stdio: 'inherit' });
} finally {
  fs.rmSync(out, { recursive: true, force: true });
  fs.rmSync(temp, { recursive: true, force: true });
}
