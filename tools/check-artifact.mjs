// Checks that dist/artifact.html (the Artifact-page FRAGMENT) is valid and actually boots.
//   node tools/check-artifact.mjs [--keep]      (npm run check:artifact)
// 1. builds the fragment (tools/build.mjs --artifact) and lints it: no doctype/html/head/body tags, <title> within the first 8 KB,
//    no external scripts, only Google Fonts stylesheets, no download links / print / dialogs, size under 16 MB.
// 2. wraps it in a faithful copy of the Artifact skeleton and loads it headless via file:// and via a local HTTP server, waits for
//    window.__ready, then asserts: canvas of real size, title UI present, HUD hidden, no page/console errors (known-benign
//    SwiftShader/AudioContext/font noise excepted), and no requests to hosts other than fonts.googleapis.com / fonts.gstatic.com.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
const keep = process.argv.includes('--keep');
const FONT_HOSTS = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
const BENIGN = [/GL Driver Message/i, /SwiftShader/i, /AudioContext/i, /fonts\.(googleapis|gstatic)\.com/i, /ERR_FAILED|ERR_INTERNET_DISCONNECTED|net::ERR/i, /Failed to load resource/i, /GPU stall/i, /WebGL/i];

let failed = 0;
const pass = (msg) => console.log(`PASS  ${msg}`);
const fail = (msg) => { failed++; console.log(`FAIL  ${msg}`); };
const check = (ok, msg, detail = '') => (ok ? pass(msg) : fail(`${msg}${detail ? ` -- ${detail}` : ''}`));

// ---- 1. build + lint the fragment
execFileSync(process.execPath, [path.join(root, 'tools/build.mjs'), '--artifact'], { cwd: root, stdio: 'inherit' });
const file = path.join(root, 'dist/artifact.html');
const frag = fs.readFileSync(file, 'utf8');
const head = frag.slice(0, 8192);
for (const tag of ['<!doctype', '<html', '<head', '<body', '</html', '</head', '</body']) check(!frag.toLowerCase().includes(tag), `fragment has no ${tag}`);
check(/<title>Lanternbrook Days<\/title>/.test(head), '<title> is within the first 8 KB');
check(frag.trimStart().startsWith('<title>'), 'fragment starts with <title>');
check((frag.match(/<style[\s>]/g) || []).length === 1, 'exactly one <style>');
check((frag.match(/<script[\s>]/g) || []).length === 1, 'exactly one <script>');
check(!/<script[^>]*\ssrc=/i.test(frag), 'no external <script src>');
const links = [...frag.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]);
check(links.length === 1 && /rel="stylesheet"/.test(links[0]) && /^<link[^>]*href="https:\/\/fonts\.googleapis\.com\//.test(links[0]), 'only external resource is the Google Fonts stylesheet', links.join(' '));
check(!/<meta[^>]*claude:viewport-fit-sides/i.test(frag), 'no claude:viewport-fit-sides meta');
check(!/<a\b[^>]*\bdownload\b/i.test(frag), 'no <a download>');
check(!/window\.print\s*\(/.test(frag), 'no window.print');
check(!/(?<![\w.$])(alert|confirm|prompt)\s*\(/.test(frag.replace(/\.(alert|confirm|prompt)\(/g, '')), 'no bare alert/confirm/prompt calls');
check(!/<script>[\s\S]*<\/script>[\s\S]*<script/.test(frag), 'script is last');
check(/id="game-canvas"/.test(frag) && /id="ui-root"/.test(frag) && /id="boot-loading"/.test(frag), 'markup has canvas, #ui-root and the loading overlay');
check(Buffer.byteLength(frag) < 16 * 1024 * 1024, `size ${(Buffer.byteLength(frag) / 1048576).toFixed(2)} MB is under 16 MB`);

// ---- 2. wrap in the simulated Artifact skeleton and boot it
const SKELETON_HEAD = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)} body{margin:0;font:14px system-ui,sans-serif} img{max-width:100%} [hidden]{display:none!important}</style></head><body>';
const wrapped = `${SKELETON_HEAD}${frag}</body></html>`;
const tmp = fs.mkdtempSync(path.join(process.env.TMPDIR || os.tmpdir(), 'lb-artifact-'));
const wrappedFile = path.join(tmp, 'page.html');
fs.writeFileSync(wrappedFile, wrapped);

const { chromium } = require('playwright');
const server = http.createServer((req, res) => {
  if (new URL(req.url, 'http://x').pathname === '/page.html') res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(wrapped);
  else res.writeHead(404).end('nope');
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const port = server.address().port;

const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
const shotDir = path.join(process.env.TMPDIR || '/tmp', 'orchestrate', 't14');
fs.mkdirSync(shotDir, { recursive: true });

async function boot(label, url) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const errors = [];
  const hosts = new Set();
  await page.route('**/*', (route) => {
    const u = new URL(route.request().url());
    if (u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
    if (FONT_HOSTS.has(u.hostname)) { hosts.add(u.hostname); return route.abort(); }
    if (u.protocol === 'file:' || u.hostname === '127.0.0.1') return route.continue();
    hosts.add(u.hostname);
    return route.abort();
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const loc = m.location();
    const text = `${m.text()} ${(loc && loc.url) || ''}`;
    if (BENIGN.some((re) => re.test(text))) return;
    errors.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${(e && e.stack) || e}`));
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 60000 });
    await page.waitForFunction('window.__ready === true', null, { timeout: 120000 });
    pass(`[${label}] booted (window.__ready)`);
    await page.waitForFunction("!document.getElementById('boot-loading')", null, { timeout: 15000 }).then(() => pass(`[${label}] loading overlay removed`), () => fail(`[${label}] loading overlay still present`));
    const info = await page.evaluate(() => {
      const c = document.getElementById('game-canvas');
      const r = c.getBoundingClientRect();
      const hud = document.querySelector('.lb-hud');
      return { w: Math.round(r.width), h: Math.round(r.height), title: !!document.querySelector('[data-testid="title"], .lb-title'), hud: hud ? getComputedStyle(hud).visibility : 'none', mode: window.__game.Game.mode, scroll: [document.documentElement.scrollWidth, document.documentElement.scrollHeight] };
    });
    check(info.w >= 320 && info.h >= 240, `[${label}] canvas has a real size (${info.w}x${info.h})`);
    check(info.title, `[${label}] title UI is present`);
    check(info.hud === 'hidden', `[${label}] HUD hidden on the title (${info.hud})`);
    check(info.mode === 'title', `[${label}] game mode is title (${info.mode})`);
    check(info.scroll[0] <= 1280 + 1, `[${label}] no horizontal page scroll`);
    await page.screenshot({ path: path.join(shotDir, `artifact_${label}.png`) });
  } catch (err) {
    fail(`[${label}] boot failed: ${(err && err.message) || err}`);
  }
  check(errors.length === 0, `[${label}] no page/console errors`, errors.slice(0, 3).join(' | '));
  const bad = [...hosts].filter((h) => !FONT_HOSTS.has(h));
  check(bad.length === 0, `[${label}] requests only to Google Fonts hosts`, bad.join(', '));
  await context.close();
}

try {
  await boot('file', pathToFileURL(wrappedFile).href + '?q=low');
  await boot('http', `http://127.0.0.1:${port}/page.html?q=low`);
} finally {
  await browser.close();
  server.close();
  if (!keep) fs.rmSync(tmp, { recursive: true, force: true });
}
console.log(failed ? `\ncheck:artifact FAILED (${failed})` : '\ncheck:artifact OK');
process.exit(failed ? 1 : 0);
