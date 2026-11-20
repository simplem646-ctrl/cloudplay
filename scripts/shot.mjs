#!/usr/bin/env node
// Headless-Chromium helper for fast iteration (host Playwright, WebGL via SwiftShader).
// Opens a built single-file page straight from disk (file://) or any URL.
//
//   node scripts/shot.mjs dist/dev/engine_demo.html --out /tmp/x.png
//   node scripts/shot.mjs dist/index.html --wait 1500 --out a.png --scale 2
//   node scripts/shot.mjs dist/index.html --eval "window.__game.debug.warp('town_square')" --wait 600 --out b.png
//   node scripts/shot.mjs dist/index.html --keys "ArrowRight:600,z:80,ArrowDown:300" --out c.png
//   node scripts/shot.mjs dist/index.html --script my_flow.mjs        (multi-step flows, see below)
//
// Flags: --out <png> (default shot.png)  --wait <ms> after load (default 800)
//        --width/--height viewport (default 960x720)  --scale <n> deviceScaleFactor (default 1)
//        --eval "<js>" run in the page after load (result printed)  --keys "Key:holdMs,..." key presses
//        --selector <css> screenshot only that element (default: whole page)  --console print console logs
//        --script <file.mjs>: default export async ({ page, shot, sleep, press }) => {...}
//          shot(name) saves <outdir>/<name>.png ; press('ArrowUp', holdMs) ; sleep(ms)
// Prints page errors / console errors and exits 1 if any page error occurred.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('playwright-core')); }

const argv = process.argv.slice(2);
const target = argv.find((a) => !a.startsWith('--') && !/^\d+$/.test(a));
const val = (n, d) => { const i = argv.indexOf(n); return i >= 0 && argv[i + 1] !== undefined ? argv[i + 1] : d; };
const has = (n) => argv.includes(n);
if (!target) { console.error('usage: node scripts/shot.mjs <page.html|url> [--out f.png] [--wait ms] [--eval js] [--keys k:ms,...] [--script f.mjs]'); process.exit(2); }

const url = /^(https?|file):/.test(target) ? target : pathToFileURL(path.resolve(target)).href;
const out = path.resolve(val('--out', 'shot.png'));
const outDir = path.dirname(out);
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
const ctx = await browser.newContext({
  viewport: { width: Number(val('--width', 960)), height: Number(val('--height', 720)) },
  deviceScaleFactor: Number(val('--scale', 1)),
});
const page = await ctx.newPage();
let pageErrors = 0;
const logs = [];
page.on('pageerror', (e) => { pageErrors++; console.log(`PAGEERROR: ${e.message}`); });
page.on('console', (m) => {
  const t = m.type();
  if (t === 'error') console.log(`CONSOLE.error: ${m.text()}`);
  else if (has('--console')) logs.push(`[${t}] ${m.text()}`);
});

const press = async (key, hold = 80) => { await page.keyboard.down(key); await sleep(hold); await page.keyboard.up(key); await sleep(40); };
const shot = async (name) => {
  const f = path.join(outDir, `${name.replace(/\.png$/, '')}.png`);
  await page.screenshot({ path: f });
  console.log(`SHOT: ${f}`);
  return f;
};

try {
  await page.goto(url, { waitUntil: 'load' });
  await sleep(Number(val('--wait', 800)));
  if (has('--eval')) {
    const r = await page.evaluate(val('--eval'));
    console.log(`EVAL: ${typeof r === 'string' ? r : JSON.stringify(r)}`);
  }
  if (has('--keys')) {
    for (const part of val('--keys').split(',')) {
      const [k, ms] = part.split(':');
      await press(k.trim(), ms ? Number(ms) : 80);
    }
    await sleep(Number(val('--wait2', 300)));
  }
  if (has('--script')) {
    const mod = await import(pathToFileURL(path.resolve(val('--script'))).href);
    await mod.default({ page, shot, sleep, press, url });
  }
  if (!has('--script') || has('--out')) {
    const sel = val('--selector', null);
    if (sel) await page.locator(sel).first().screenshot({ path: out });
    else await page.screenshot({ path: out });
    console.log(`SHOT: ${out}`);
  }
} finally {
  if (has('--console') && logs.length) console.log(logs.slice(-40).join('\n'));
  await browser.close();
}
if (pageErrors) { console.log(`FAILED: ${pageErrors} page error(s)`); process.exit(1); }
