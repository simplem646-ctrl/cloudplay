#!/usr/bin/env node
/* Headless-Chromium screenshot / flow tool (host Playwright, WebGL via SwiftShader).
 *
 *   node tools/shot.cjs <url> <out.png> [--w 1280] [--h 720] [--wait 800] [--ready]
 *        [--eval "js"] [--evalfile f.js] [--keys "ArrowRight:600,Space"] [--strict]
 *   node tools/shot.cjs [url] --script flow.cjs [--ready] [--strict] [--out dir]
 *        flow.cjs exports async (page, helpers) => {}; helpers: shot(name), sleep(ms), eval(js), url, page, errors
 *
 * --ready    wait for window.__ready === true (30 s timeout)
 * --eval     JS run in the page before the screenshot (promises awaited); --evalfile reads it from a file
 * --keys     comma list of key[:holdMs] pressed in order (default hold 60 ms)
 * --strict   exit 1 if any page error or console error occurred
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

function parseArgs(argv) {
  const flags = { w: 1280, h: 720, wait: 0 };
  const pos = [];
  const valued = new Set(['w', 'h', 'wait', 'eval', 'evalfile', 'keys', 'script', 'out', 'url', 'timeout']);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (valued.has(k)) flags[k] = argv[++i];
      else flags[k] = true;
    } else pos.push(a);
  }
  flags.w = Number(flags.w);
  flags.h = Number(flags.h);
  flags.wait = Number(flags.wait);
  return { flags, pos };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const FONT_HOST = /fonts\.(googleapis|gstatic)\.com/;

async function pressKeys(page, spec) {
  for (const part of spec.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [key, hold] = part.split(':');
    await page.keyboard.down(key);
    await sleep(hold ? Number(hold) : 60);
    await page.keyboard.up(key);
    await sleep(40);
  }
}

async function main() {
  const { flags, pos } = parseArgs(process.argv.slice(2));
  const scriptMode = !!flags.script;
  const url = flags.url || pos[0];
  const outPng = scriptMode ? null : pos[1];
  if (!url && !scriptMode) throw new Error('usage: shot.cjs <url> <out.png> [options]  |  shot.cjs [url] --script flow.cjs');
  if (!scriptMode && !outPng) throw new Error('missing <out.png>');

  const browser = await chromium.launch({
    args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader'],
  });
  const context = await browser.newContext({ viewport: { width: flags.w, height: flags.h } });
  const page = await context.newPage();
  const errors = [];
  const note = (kind, text) => {
    console.log(`[${kind}] ${text}`);
    if (kind === 'pageerror' || kind === 'console.error') errors.push(`${kind}: ${text}`);
  };
  await page.route(FONT_HOST, (route) => route.abort());
  page.on('console', (m) => {
    const t = m.type();
    if (t !== 'error' && t !== 'warning') return;
    const loc = m.location();
    if (loc && loc.url && FONT_HOST.test(loc.url)) return;
    note(t === 'error' ? 'console.error' : 'console.warning', m.text());
  });
  page.on('pageerror', (e) => note('pageerror', (e && e.stack) || String(e)));

  const outDir = flags.out || path.join(process.env.TMPDIR || '/tmp', 'orchestrate', 'shots');
  const helpers = {
    url,
    page,
    errors,
    sleep,
    eval: (js) => page.evaluate(`(async () => (${js}))()`),
    async shot(name) {
      const file = path.isAbsolute(name) || name.includes(path.sep) ? name : path.join(outDir, name);
      const full = file.endsWith('.png') ? file : `${file}.png`;
      fs.mkdirSync(path.dirname(full), { recursive: true });
      await page.screenshot({ path: full });
      console.log(`saved ${full}`);
      return full;
    },
  };

  let exit = 0;
  try {
    if (url) await page.goto(url, { waitUntil: 'load', timeout: Number(flags.timeout) || 60000 });
    if (flags.ready) await page.waitForFunction('window.__ready === true', null, { timeout: 30000 });
    if (flags.wait) await sleep(flags.wait);
    if (flags.keys) await pressKeys(page, flags.keys);
    const code = flags.evalfile ? fs.readFileSync(flags.evalfile, 'utf8') : flags.eval;
    if (code) {
      let r;
      try {
        r = await page.evaluate(`(async () => (${code}\n))()`); // expression form
      } catch (e) {
        if (!/SyntaxError|Unexpected token|Unexpected identifier/.test(String(e && e.message))) throw e;
        r = await page.evaluate(`(async () => { ${code}\n })()`); // statement form (use `return`)
      }
      if (r !== undefined) console.log('eval ->', typeof r === 'string' ? r : JSON.stringify(r));
    }
    if (scriptMode) {
      const fn = require(path.resolve(flags.script));
      await (typeof fn === 'function' ? fn : fn.default)(page, helpers);
    } else {
      fs.mkdirSync(path.dirname(path.resolve(outPng)), { recursive: true });
      await page.screenshot({ path: outPng });
      console.log(`saved ${outPng}`);
    }
  } catch (err) {
    console.error(`shot.cjs failed: ${(err && err.message) || err}`);
    exit = 1;
  }
  await browser.close();
  if (errors.length) console.log(`${errors.length} page/console error(s)`);
  if (flags.strict && errors.length) exit = 1;
  process.exit(exit);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
