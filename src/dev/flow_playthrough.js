// Scripted playthrough for scripts/shot.mjs (host Playwright, software WebGL):
//   node scripts/build.mjs --dev && node scripts/shot.mjs dist/index.html --out /tmp/flow/x.png --script src/dev/flow_playthrough.js --wait 1200
// title -> New Game -> wake in Theo's room -> walk home_theo -> cafe_lantern -> town_harbor -> town_square (locked-door line)
// -> school_grounds (talk to a scheduled NPC) -> hall 1F -> hall 2F -> classroom -> an event -> home -> sleep -> next morning.
// Screenshots land next to --out; progress lines go to stdout AND <outdir>/flow.log (stdout is buffered when redirected).
import fs from 'node:fs';
import path from 'node:path';

export default async ({ page, shot, sleep, press }) => {
  const outDir = path.dirname(path.resolve(process.argv[process.argv.indexOf('--out') + 1] || 'shot.png'));
  const say = (s) => { console.log(s); try { fs.appendFileSync(path.join(outDir, 'flow.log'), `${s}\n`); } catch { /* ignore */ } };
  const ev = (fn, ...a) => page.evaluate(fn, ...a);
  const dbg = (name, ...args) => page.evaluate(({ name, args }) => window.__game.debug[name](...args), { name, args });
  const where = () => dbg('where');
  const log = async (label) => say(`FLOW ${label}: ${JSON.stringify(await where())}`);
  const idle = () => dbg('waitIdle', { timeout: 90000 });
  const travel = (to) => ev(async (to) => {
    const g = window.__game, o = g.overworld;
    const w = o.map.warps.find((x) => x.to.startsWith(`${to}:`));
    if (!w) return false;
    return g.debug.walkTo(w.x, w.y, { run: true });
  }, to);
  const fps = () => ev(() => Math.round(window.__game.renderer.perf.fps));
  const watchEvent = async (label) => { // look at a natural event, then let it play out
    for (let i = 0; i < 12; i++) { await sleep(300); const w = await where(); if (w.script && w.modals) break; }
    const w = await where();
    if (w.script) { await sleep(1200); await shot(label); }
    await dbg('autoAdvance', true, 0);
    await idle();
    await dbg('autoAdvance', false);
  };
  try { fs.writeFileSync(path.join(outDir, 'flow.log'), ''); } catch { /* ignore */ }

  // ---- title ----
  await sleep(1200);
  await shot('01_title_press');
  await press('z', 80);
  await sleep(500);
  await shot('02_title_menu');
  await press('z', 80); // New Game
  await sleep(1800);
  await shot('03_banner');
  // ---- wake: the first-morning event plays with real dialogue boxes ----
  for (let i = 0; i < 40; i++) { await sleep(500); const w = await where(); if (w.modals && w.script) break; }
  await sleep(2500);
  await shot('04_wake_dialogue');
  await dbg('autoAdvance', true, 0);
  await idle();
  await dbg('autoAdvance', false);
  await log('after wake event (06:30 day 1)');
  await shot('05_home_after_event');

  // ---- walk out: stairs door -> cafe -> harbor -> square ----
  await travel('cafe_lantern'); await idle(); await log('cafe');
  await travel('town_harbor'); await idle(); await log('harbor');
  await shot('06_harbor');
  await travel('town_square');
  await watchEvent('07a_square_event');
  await log('square');
  // a door to a map that is not built: friendly locked line, player stays put
  await dbg('teleport', 38, 19, 'up');
  await ev(() => { window.__game.debug.walkTo(38, 18, { run: false }); });
  await sleep(900);
  await shot('08_locked_door');
  await press('z', 80);
  await idle();
  await log('after locked door (still on the square)');

  // ---- a normal school day at lunch: real travel to school ----
  await dbg('setDate', 1, 'spring', 2);
  await dbg('setTime', '12:25');
  await sleep(500);
  await travel('school_grounds');
  await watchEvent('09a_grounds_event');
  await log('school_grounds');
  const npcs = await dbg('npcs');
  say(`FLOW npcs on school_grounds (${npcs.length}): ${npcs.map((n) => n.id).join(',')}`);
  const who = npcs.find((n) => !n.id.startsWith('townie') && n.id !== 'biscuit' && !n.id.startsWith('student'));
  if (who) {
    const started = await dbg('talkTo', who.id);
    say(`FLOW talkTo ${who.id}: started=${started}`);
    await sleep(1800);
    await shot('09_talk');
    await dbg('autoAdvance', true, 0);
    await idle();
    await dbg('autoAdvance', false);
    await log('after talk');
  }
  for (const to of ['school_hall_1f', 'school_hall_2f', 'school_classroom']) {
    const ok = await travel(to);
    if (to === 'school_classroom') await watchEvent('10a_classroom_event'); else { await dbg('autoAdvance', true, 0); await idle(); await dbg('autoAdvance', false); }
    const w = await where();
    say(`FLOW leg ${to}: walk=${ok} now on ${w.map} (${w.tx},${w.ty}) npcs=${(await dbg('npcs')).map((n) => n.id).join(',')}`);
  }
  await shot('10_classroom');
  say(`FLOW fps ${await fps()}`);

  // ---- an event on demand, home, and to bed through the real sleep flow ----
  await dbg('autoAdvance', true, 0);
  const ran = await dbg('runEvent', 'main_01_wake_up');
  say(`FLOW runEvent main_01_wake_up -> ${ran}`);
  await sleep(2500);
  await shot('11_event');
  await idle();
  await dbg('autoAdvance', false);
  await dbg('warp', 'home_theo', 'bed');
  await idle();
  await dbg('setTime', '21:30');
  await dbg('walkTo', 3, 3);
  await ev(() => { window.__game.overworld.player.setDir('left'); });
  await sleep(300);
  await press('z', 80); // bed -> confirm box
  await sleep(600);
  await shot('12_sleep_confirm');
  await press('ArrowLeft', 80); // the box defaults to "Not yet"
  await press('z', 80);
  // page through the sleep summary scene with the confirm key, then let any wake event play out
  for (let i = 0; i < 40; i++) { await sleep(700); const w = await where(); if (w.scene === 'OverworldScene' && w.minute < 8 * 60) break; await press('z', 80); }
  await sleep(1500);
  await shot('13a_wake_event');
  await dbg('autoAdvance', true, 0);
  await idle();
  await dbg('autoAdvance', false);
  await log('next morning');
  await shot('13_next_morning');
  say(`FLOW done, fps ${await fps()}`);
};
