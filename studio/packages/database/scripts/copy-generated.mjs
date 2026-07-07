import { cpSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const src = resolve(root, 'src/generated');
const dest = resolve(root, 'dist/generated');

if (!existsSync(src)) {
  console.error('[database] missing src/generated — run prisma generate first');
  process.exit(1);
}

cpSync(src, dest, { recursive: true });
console.log('[database] copied src/generated → dist/generated');
