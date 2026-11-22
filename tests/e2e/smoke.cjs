#!/usr/bin/env node
/* End-to-end smoke test of the PRODUCTION bundle (dist/index.html), driven by headless Chromium (SwiftShader, ~4 fps at q=low).
 *
 *   npm run e2e            (not part of `npm test`: slow, needs the host Playwright)
 *
 * boot -> title -> keyboard-only new game -> prologue (Enter) -> held-key walking -> cottage door in/out -> area hops (incl. interiors)
 * -> talk to an NPC (dialogue + portrait) -> shop purchase -> sleep (day summary) -> save -> load -> Escape menu open/close.
 * Prints one PASS/FAIL line per step, saves screenshots to ${TMPDIR:-/tmp}/orchestrate/t14/e2e_*.png, exits non-zero on any failure.
 */
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require('playwright');

const root = path.resolve(__dirname, '../..');
const shotDir = path.join(process.env.TMPDIR || '/tmp', 'orchestrate', 't14');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BENIGN = [/GL Driver Message/i, /SwiftShader/i, /AudioContext/i, /fonts\.(googleapis|gstatic)\.com/i, /net::ERR/i, /Failed to load resource/i, /GPU stall/i];
const T0 = Date.now();
let failures = 0;

function log(ok, name, detail) {
  if (!ok) failures++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}  [${((Date.now() - T0) / 1000).toFixed(0)}s]`);
}

async function main() {
  execFileSync(process.execPath, [path.join(root, 'tools/build.mjs')], { cwd: root, stdio: 'inherit' });
  const html = fs.readFileSync(path.join(root, 'dist/index.html'));
  const server = http.createServer((req, res) => {
    if (new URL(req.url, 'http://x').pathname === '/' || req.url.startsWith('/index.html')) res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(html);
    else res.writeHead(404).end('nope');
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const url = `http://127.0.0.1:${server.address().port}/index.html?q=low&fast=1`;

  fs.mkdirSync(shotDir, { recursive: true });
  const browser = await chromium.launch({ args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--use-angle=swiftshader'] });
  const page = await (await browser.newContext({ viewport: { width: 1280, height: 720 } })).newPage();
  const errors = [];
  await page.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const loc = m.location();
    const text = `${m.text()} ${(loc && loc.url) || ''}`;
    if (!BENIGN.some((re) => re.test(text))) errors.push(`console.error: ${m.text()}`);
  });
  page.on('pageerror', (e) => errors.push(`pageerror: ${(e && e.message) || e}`));

  const ev = (js) => page.evaluate(`(() => (${js}))()`);
  const shot = (name) => page.screenshot({ path: path.join(shotDir, `e2e_${name}.png`) });
  const waitFor = (js, ms = 20000) => page.waitForFunction(`(() => (${js}))()`, null, { timeout: ms, polling: 150 });
  const press = async (key, hold = 60) => { await page.keyboard.down(key); await sleep(hold); await page.keyboard.up(key); await sleep(120); };
  const snap = () => ev(`(() => { const G = window.__game, a = G.svc.entities.playerActor(); return { mode: G.Game.mode, area: G.Game.state && G.Game.state.player.area, x: a ? a.x : null, z: a ? a.z : null, money: G.Game.state && G.Game.state.player.money, day: G.Game.state && G.Game.state.time.day, minutes: G.Game.state && G.Game.state.time.minutes }; })()`);
  const step = async (name, fn) => {
    if (failures) { console.log(`SKIP  ${name}  (earlier step failed)`); return; }
    try { const detail = await fn(); log(true, name, detail); } catch (e) { log(false, name, String((e && e.message) || e).split('\n')[0].slice(0, 200)); try { await shot(`FAIL_${name.replace(/\W+/g, '_')}`); } catch (_) { /* ignore */ } }
  };
  const assert = (cond, msg) => { if (!cond) throw new Error(msg); };

  try {
    await step('boot: bundle runs, __ready, loading overlay gone', async () => {
      await page.goto(url, { waitUntil: 'load', timeout: 60000 });
      await waitFor('window.__ready === true', 120000);
      await waitFor("!document.getElementById('boot-loading')", 15000);
      const w = await ev("document.getElementById('game-canvas').getBoundingClientRect().width");
      assert(w > 300, `canvas width ${w}`);
    });

    await step('title screen shown, HUD hidden', async () => {
      assert(await ev('window.__game.Game.mode') === 'title', 'mode is not title');
      assert(await ev("!!document.querySelector('[data-testid=title]')"), 'no title element');
      assert(await ev("getComputedStyle(document.querySelector('.lb-hud')).visibility") === 'hidden', 'HUD visible on the title');
      await shot('01_title');
    });

    await step('keyboard new game: any key, New Game, name Kai, swatches, start', async () => {
      await press('Space');
      await waitFor("!!document.querySelector('[data-testid=title-new]')", 8000);
      await press('Enter');
      await waitFor("!!document.querySelector('[data-testid=newgame]')", 8000);
      assert(await ev("document.querySelector('[data-testid=name-input]').value") === 'Kai', 'default name is not Kai');
      await shot('02_new_game_form');
      await press('Enter'); // name -> hair
      await press('ArrowRight'); // pick another hair colour
      for (let i = 0; i < 4; i++) await press('Enter'); // hair -> jacket -> scarf -> start button -> start
      await waitFor('window.__game.Game.state && window.__game.Game.state.meta.name === "Kai"', 15000);
      return `look ${JSON.stringify(await ev('window.__game.Game.state.meta.look'))}`.slice(0, 80);
    });

    await step('prologue advances with Enter into free roam', async () => {
      let presses = 0;
      while (await ev('window.__game.Game.mode') !== 'field' && presses < 80) {
        if (presses === 6) await shot('03_prologue');
        await press('Enter', 80);
        await sleep(250);
        presses++;
      }
      assert(await ev('window.__game.Game.mode') === 'field', `still ${await ev('window.__game.Game.mode')} after ${presses} presses`);
      await waitFor('window.__game.Game.state.flags.prologue_done === true', 5000);
      await sleep(800);
      await shot('04_roaming');
      assert(await ev("getComputedStyle(document.querySelector('.lb-hud')).visibility") === 'visible', 'HUD not visible in the field');
      return `${presses} presses`;
    });

    await step('held-key walking changes the player position', async () => {
      const a = await snap();
      await page.keyboard.down('ArrowRight');
      await sleep(2000);
      await page.keyboard.up('ArrowRight');
      const b = await snap();
      assert(b.x - a.x > 0.5, `x moved ${a.x} -> ${b.x}`);
      return `x ${a.x.toFixed(1)} -> ${b.x.toFixed(1)}`;
    });

    await step('cottage door: walk in, walk back out', async () => {
      await ev("window.__game.svc.entities.teleport(window.__game.svc.entities.playerActor(), 9.5, 16.9, 's')");
      await sleep(400);
      await page.keyboard.down('ArrowUp');
      await waitFor("window.__game.Game.state.player.area === 'cottage'", 25000).finally(() => page.keyboard.up('ArrowUp'));
      await waitFor("window.__game.Game.mode === 'field'", 10000);
      await shot('05_cottage');
      await sleep(600);
      await page.keyboard.down('ArrowDown');
      await waitFor("window.__game.Game.state.player.area === 'brook_lane'", 25000).finally(() => page.keyboard.up('ArrowDown'));
      await waitFor("window.__game.Game.mode === 'field'", 10000);
    });

    await step('area hops: town square, market street, library (interior), cottage', async () => {
      for (const id of ['town_square', 'market_street', 'library', 'cottage']) {
        await ev(`window.__game.LB.goto('${id}')`);
        await waitFor(`window.__game.Game.state.player.area === '${id}' && window.__game.Game.mode === 'field'`, 30000);
        await sleep(300);
      }
      await shot('06_interior');
    });

    await step('talk to an NPC: Space -> Talk -> dialogue with a portrait', async () => {
      await ev('window.__game.LB.time(10)');
      await ev("window.__game.LB.goto('town_square')");
      await waitFor("window.__game.Game.state.player.area === 'town_square' && window.__game.Game.mode === 'field'", 30000);
      await sleep(800);
      const npc = await ev("(() => { const e = window.__game.svc.entities; for (const [id, a] of e.actors()) if (id !== 'player' && !a.route) return id; return null; })()");
      assert(npc, 'no stationary NPC in the town square at 10:00');
      await ev(`(() => { const e = window.__game.svc.entities, a = e.actor('${npc}'), p = e.playerActor(); a.busy = true; e.teleport(p, a.x - 1.0, a.z); p.facing = 'e'; p.rig.faceTowards(a.x, a.z); })()`);
      await waitFor("window.__game.svc.interaction.target && window.__game.svc.interaction.target.kind === 'npc'", 8000);
      await press('Space');
      await waitFor("window.__game.Game.mode === 'dialogue' && document.querySelectorAll('[data-testid=dialogue-option]').length >= 2", 10000);
      await shot('07_talk_menu');
      await press('Space'); // first option: Talk
      await waitFor("(() => { const d = document.querySelector('[data-testid=dialogue]'); return d && !d.hidden && d.querySelector('[data-testid=dialogue-text]').innerText.length > 5 && !!d.querySelector('[data-testid=dialogue-portrait] canvas, [data-testid=dialogue-portrait] img'); })()", 15000);
      await shot('08_dialogue');
      for (let i = 0; i < 25 && await ev('window.__game.Game.mode') !== 'field'; i++) { await press('Space'); await sleep(250); }
      await waitFor("window.__game.Game.mode === 'field'", 20000);
      await ev(`window.__game.svc.entities.actor('${npc}').busy = false`);
      return npc;
    });

    await step('shop: open the general store, buy an item', async () => {
      await ev("window.__game.LB.goto('general_store')");
      await waitFor("window.__game.Game.state.player.area === 'general_store' && window.__game.Game.mode === 'field'", 30000);
      const before = await ev('window.__game.Game.state.player.money');
      await ev("window.__game.LB.money(500)");
      ev("window.__game.svc.shops.openShop('general_store')").catch(() => {});
      await waitFor("window.__game.Game.mode === 'shop' && document.querySelectorAll('[data-testid=shop-row]').length > 0", 15000);
      await shot('09_shop');
      const slots = (await ev('window.__game.Game.state.inventory.slots.filter(Boolean).reduce((n, s) => n + s.qty, 0)'));
      await press('Space'); // buy the selected item (qty 1)
      await waitFor(`window.__game.Game.state.player.money < 500`, 10000);
      await sleep(400); // the UI's own done-notification must not buy twice
      const money = await ev('window.__game.Game.state.player.money');
      const after = await ev('window.__game.Game.state.inventory.slots.filter(Boolean).reduce((n, s) => n + s.qty, 0)');
      assert(after === slots + 1, `inventory count ${slots} -> ${after} (expected exactly one item)`);
      await press('Escape');
      await waitFor("window.__game.Game.mode === 'field'", 10000);
      return `coins 500 -> ${money} (was ${before})`;
    });

    await step('sleep: day summary card, Enter, next morning', async () => {
      const d0 = await ev('window.__game.Game.state.time.day');
      ev('window.__game.LB.sleep()').catch(() => {});
      await waitFor("!!document.querySelector('[data-testid=summary]')", 30000);
      await sleep(1500); // let the card animate in
      // the card must actually be visible: the topmost element at the card's centre belongs to it, not to the black fade
      assert(await ev("(() => { const c = document.querySelector('[data-testid=summary]'); const r = c.getBoundingClientRect(); const t = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2); return c.contains(t) || (t && t.closest('[data-testid=summary]') === c); })()"), 'day summary card is hidden behind the fade');
      await shot('10_day_summary');
      await press('Enter');
      await waitFor(`window.__game.Game.mode === 'field' && window.__game.Game.state.time.day !== ${d0}`, 40000);
      const s = await snap();
      assert(s.minutes < 480, `woke at minute ${s.minutes}`);
      return `day ${d0} -> ${s.day}`;
    });

    await step('save then load restores the game', async () => {
      await ev('window.__game.LB.money(777)');
      const r = await ev('window.__game.Systems.saveGame(1)');
      assert(r && r.ok, 'save failed ' + JSON.stringify(r));
      assert(await ev("!!localStorage.getItem(Object.keys(localStorage).find((k) => /save/i.test(k) && /1/.test(k)))"), 'no save key in localStorage');
      await ev('window.__game.LB.money(1)');
      await ev('window.__game.Systems.continueGame(1)');
      await waitFor('window.__game.Game.state.player.money === 777 && window.__game.Game.mode === "field"', 30000);
    });

    await step('Escape opens and closes the pause menu', async () => {
      await press('Escape');
      await waitFor("window.__game.Game.mode === 'menu' && !!document.querySelector('[data-testid=menu]')", 10000);
      await shot('11_menu');
      await press('Escape');
      await waitFor("window.__game.Game.mode === 'field' && !document.querySelector('[data-testid=menu]')", 10000);
    });
  } finally {
    log(errors.length === 0, 'no page errors / console errors', errors.slice(0, 3).join(' | '));
    await browser.close();
    server.close();
  }
  const secs = ((Date.now() - T0) / 1000).toFixed(0);
  console.log(failures ? `\nE2E FAILED (${failures}) after ${secs}s` : `\nE2E OK in ${secs}s`);
  process.exit(failures ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
