import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../dist/', import.meta.url));
const port = Number(process.argv[2] || 8765);
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
export function serve(directory = root) {
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url || '/', 'http://localhost');
      let pathname = decodeURIComponent(url.pathname).replace(/^\/preview(?=\/)/, '');
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(directory, '.' + pathname);
      if (!file.startsWith(resolve(directory) + '/')) throw new Error('Invalid path');
      if (!(await stat(file)).isFile()) throw new Error('Not a file');
      res.writeHead(200, { 'Content-Type': mime[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(await readFile(file));
    } catch { res.writeHead(404); res.end('Not found'); }
  });
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = serve();
  server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}/preview/`));
}
