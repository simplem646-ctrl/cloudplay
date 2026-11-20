#!/usr/bin/env node
// Static file server. `node scripts/serve.mjs [dir=dist] [port=8080]`
// Binds 0.0.0.0 so the containerised browser behind `playwright-cli` can reach it at
// http://172.17.0.1:<port>/ (the docker bridge gateway), NOT localhost.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] || 'dist');
const port = Number(process.argv[3] || 8080);
const types = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };

http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const file = path.join(dir, path.normalize(p));
  if (!file.startsWith(dir)) { res.writeHead(403).end(); return; }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(buf);
  });
}).listen(port, '0.0.0.0', () => console.log(`serving ${dir} on http://0.0.0.0:${port}  (playwright-cli: http://172.17.0.1:${port}/)`));
