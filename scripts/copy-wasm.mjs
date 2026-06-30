import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const src = resolve(root, 'node_modules/sql.js/dist/sql-wasm-browser.wasm');
const destDir = resolve(root, 'public');
const dest = resolve(destDir, 'sql-wasm-browser.wasm');

if (!existsSync(src)) {
  console.error('WASM source not found. Make sure sql.js is installed.');
  process.exit(1);
}

if (!existsSync(destDir)) {
  mkdirSync(destDir, { recursive: true });
}

copyFileSync(src, dest);
console.log('Copied sql-wasm-browser.wasm to public/');
