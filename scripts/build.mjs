import { cp, mkdir, rm, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const out = resolve(root, 'dist');
await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });
const files = ['index.html', 'score.js', 'cloth.js', 'styles.css', 'assets/favicon.svg', 'assets/share.png', 'data/settlements.json'];
for (const path of files) { await mkdir(dirname(resolve(out, path)), { recursive: true }); await cp(resolve(root, path), resolve(out, path)); }
async function bytes(path) { const { readdir } = await import('node:fs/promises'); const s = await stat(path); return s.isDirectory() ? (await Promise.all((await readdir(path)).map(name => bytes(resolve(path, name))))).reduce((a, b) => a + b, 0) : s.size; }
console.log(`Static production export: dist/ (${await bytes(out)} bytes). All runtime assets are local; API reads are optional.`);
