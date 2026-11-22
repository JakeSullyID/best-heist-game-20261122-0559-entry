// serve.ts - Tiny static server for game/ directory (Node 22)

import { createServer } from 'node:http';
import { readFileSync, statSync } from 'node:fs';
import { join, extname, resolve, normalize } from 'node:path';

const args = process.argv.slice(2);
let port = 8080;
const portIdx = args.indexOf('--port');
if (portIdx !== -1 && args[portIdx + 1]) {
  port = parseInt(args[portIdx + 1], 10) || 8080;
}

const GAME_DIR = resolve('game');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = createServer((req, res) => {
  try {
    const parsedUrl = new URL(req.url || '/', 'http://localhost');
    let pathname = parsedUrl.pathname;
    if (pathname.endsWith('/')) {
      pathname += 'index.html';
    }
    const safePath = normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const fullPath = resolve(GAME_DIR, '.' + safePath);

    if (!fullPath.startsWith(GAME_DIR)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      res.end('403 Forbidden');
      return;
    }

    const data = readFileSync(fullPath);
    const ext = extname(fullPath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  } catch (e) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
  }
});

server.listen(port, () => {
  console.log(`Vault Break server running at http://localhost:${port}/`);
});
