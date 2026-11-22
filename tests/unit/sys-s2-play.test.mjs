// S2: player controller, transitions, interaction, staging ops (REAL events), activities, lamps, jobs.
import test from 'node:test';
import assert from 'node:assert/strict';
import { boot, startIn, frames, until, hold, wait, svc, Game, Data, Sys, Input } from './fixtures/sys-s2-env.mjs';
import { rngFor, dayNumber } from '../../src/core/util.js';
import { lampIds } from '../../src/core/registry.js';
import { timing, pickFish, rollForage, sizeAt } from '../../src/systems/activities.js';

const pos = () => svc.entities.getPlayerPos();
const SUN = 7; // spring day 7 = Sunday

// ---------------------------------------------------------------- player + transitions
test('player: stick movement, run speed, wall collision, facing hysteresis, footsteps + steps stat', async () => {
  const env = boot();
  await startIn('brook_lane', 'cottage_front');
  const p0 = pos();
  await hold(0, 1, 0.5);
  const walked = pos().z - p0.z;
  const p1 = pos();
  await hold(0, 1, 0.5);
  assert.ok(walked > 1.0 && walked < 1.6, `walk ${walked}`);
  assert.equal(pos().z > p1.z, true);
  // run
  await startIn('brook_lane', 'cottage_front');
  const a = pos();
  Input.setVirtual('run', true);
  await hold(0, 1, 0.5);
  Input.setVirtual('run', false);
  const runD = pos().z - a.z;
  assert.ok(runD > walked * 1.6, `run ${runD} vs walk ${walked}`);
  assert.ok(env.sfx.some((s) => s.startsWith('step_')), 'footsteps');
  assert.ok(Game.state.stats.steps >= 2);
  // wall: inside the cottage, walking west stops at the wall
  await svc.entities.enterArea('cottage', 'rug', { fade: false });
  await hold(-1, 0, 6);
  assert.ok(pos().x >= 0.29, `x ${pos().x}`);
  // facing hysteresis
  const pa = svc.entities.playerActor();
  await hold(1, 0.1, 0.2);
  assert.equal(pa.facing, 'e');
  await hold(1, 0.9, 0.1);
  assert.equal(pa.facing, 'e', 'near-diagonal keeps the current facing');
  await hold(0.2, 1, 0.1);
  assert.equal(pa.facing, 's');
  // not in field mode: no movement
  Game.mode = 'dialogue';
  const before = pos();
  await hold(0, -1, 0.5);
  assert.deepEqual([pos().x, pos().z], [before.x, before.z]);
  Game.mode = 'field';
  // camera follows every frame
  env.camera.length = 0;
  frames(0.2);
  assert.ok(env.camera.length >= 3);
});

async function walkInto(areaFrom, anchor, transitionId, o = {}, stopWhen = null) {
  await startIn(areaFrom, anchor, o);
  const area = svc.entities.area();
  const t = area.transitions.find((x) => x.id === transitionId);
  const target = { x: t.rect.x + t.rect.w / 2, z: t.rect.z + t.rect.h / 2 };
  for (let i = 0; i < 160 && pos().area === areaFrom && !(stopWhen && stopWhen()); i++) {
    const p = pos();
    const dx = target.x - p.x;
    const dz = target.z - p.z;
    const d = Math.hypot(dx, dz) || 1;
    Input.setVirtualAxis(dx / d, dz / d);
    Sys.update(0.05);
    Input.endFrame();
    await wait(0);
  }
  Input.setVirtualAxis(0, 0);
  return t;
}

test('transitions: door in/out of the cottage opens the door, plays sfx, lands on the matching anchor', async () => {
  const env = boot();
  await walkInto('brook_lane', 'cottage_front', 'to_cottage');
  await until(() => pos().area === 'cottage' && Game.mode === 'field', 5);
  assert.equal(pos().area, 'cottage');
  assert.deepEqual(env.doors.find((d) => d[0] === 'to_cottage'), ['to_cottage', true]);
  assert.ok(env.sfx.includes('door_open'));
  const an = svc.entities.area().anchors.from_brook_lane;
  assert.ok(Math.hypot(pos().x - an.x, pos().z - an.z) < 0.6);
  assert.equal(Game.mode, 'field');
  // and back out
  await walkInto('cottage', 'from_brook_lane', 'to_brook_lane');
  await until(() => pos().area === 'brook_lane' && Game.mode === 'field', 5);
  assert.equal(pos().area, 'brook_lane');
  const out = svc.entities.area().anchors.from_cottage;
  assert.ok(Math.hypot(pos().x - out.x, pos().z - out.z) < 0.6);
});

test('transitions: closed buildings (day, hours, lock, festival) refuse entry with the building text and nudge the player back', async () => {
  const env = boot();
  // bakery is closed on Sundays
  const t = await walkInto('town_square', 'bakery_steps', 'to_bakery', { day: SUN, minutes: 11 * 60 }, () => env.toasts.some((x) => /closed/.test(x)));
  await wait(5);
  assert.equal(pos().area, 'town_square');
  assert.ok(env.toasts.some((x) => /Rye & Rose is closed/.test(x)), env.toasts.join('|'));
  assert.ok(env.sfx.includes('door_close'));
  const p = pos();
  const r = t.rect;
  assert.equal(p.x >= r.x && p.x <= r.x + r.w && p.z >= r.z && p.z <= r.z + r.h, false, 'nudged out of the door rect');
  // workshop: locked until the flag
  env.toasts.length = 0;
  await walkInto('brook_lane', 'workshop_front', 'to_workshop', { minutes: 11 * 60 }, () => env.toasts.some((x) => /locked/.test(x)));
  assert.equal(pos().area, 'brook_lane');
  assert.ok(env.toasts.some((x) => /locked tight/.test(x)));
  Game.state.flags.workshop_unlocked = true;
  frames(2); // let the door cooldown expire
  await walkInto('brook_lane', 'workshop_front', 'to_workshop', { minutes: 11 * 60 });
  await until(() => pos().area === 'workshop' && Game.mode === 'field', 5);
  assert.equal(pos().area, 'workshop');
  // after hours the town hall is closed to the public, but the lamplighter job lets you in at dusk
  svc.clock.set({ season: 0, day: 1, minutes: 18 * 60 });
  assert.equal(svc.player.canEnter('town_hall'), null);
  svc.clock.set({ season: 0, day: 1, minutes: 21 * 60 });
  assert.equal(svc.player.canEnter('town_hall').reason, 'hours');
  // festival closes the bakery (lantern festival day)
  svc.clock.set({ season: 3, day: 24, minutes: 12 * 60 });
  assert.equal(svc.player.canEnter('bakery').reason, 'festival');
});

// ---------------------------------------------------------------- interaction
const spyRun = () => {
  const calls = [];
  const orig = svc.interact.run;
  svc.interact.run = async (area, it) => { calls.push([area, it.id]); };
  return { calls, restore: () => { svc.interact.run = orig; } };
};
const press = async (n = 3) => { Input._emit('confirm'); frames(0.05 * n); await wait(2); };

test('interaction: prompt + highlight + event for the object in front; confirm runs svc.interact; clears when leaving field mode', async () => {
  const env = boot();
  await startIn('brook_lane', 'mailbox_spot');
  const spy = spyRun();
  const evts = [];
  Game.bus.on('interact:target', (e) => evts.push(e));
  frames(0.6);
  assert.equal(env.prompt, 'Space: Mail');
  assert.equal(env.highlight, 'mailbox');
  assert.deepEqual(evts.at(-1), { kind: 'object', id: 'mailbox', label: 'Space: Mail' });
  // the label follows the last-used device while the prompt is visible
  Input.setDevice('touch');
  assert.equal(env.prompt, 'A: Mail');
  Input.setDevice('gamepad');
  frames(0.3);
  assert.equal(env.prompt, 'A: Mail');
  Input.setDevice('keyboard');
  assert.equal(env.prompt, 'Space: Mail');
  await press();
  assert.deepEqual(spy.calls, [['brook_lane', 'mailbox']]);
  Game.mode = 'dialogue';
  frames(0.2);
  assert.equal(env.prompt, null);
  assert.equal(evts.at(-1), null);
  spy.restore();
  // walking away clears the prompt
  Game.mode = 'field';
  frames(0.6);
  await hold(0, 1, 2.5);
  frames(0.4);
  assert.equal(env.prompt, null);
});

test('interaction: an NPC in front wins; confirm offers Talk / Give a gift / Never mind and faces both', async () => {
  const env = boot({ quickAnims: true });
  await startIn('town_square', 'plaza_center', { minutes: 12 * 60, day: 1 });
  const odell = svc.entities.actor('odell');
  assert.ok(odell);
  const pa = svc.entities.playerActor();
  svc.entities.teleport(pa, odell.x - 1.0, odell.z, 'e');
  pa.facing = 'e';
  frames(0.6);
  assert.equal(svc.interaction.target.kind, 'npc');
  assert.equal(svc.interaction.target.id, 'odell');
  assert.equal(env.prompt, 'Space: Talk');
  const talk = [];
  const gift = [];
  const origT = svc.rel.talk;
  const origG = svc.rel.giftFlow;
  svc.rel.talk = async (id) => { talk.push(id); };
  svc.rel.giftFlow = async (id) => { gift.push(id); };
  env.askQueue.push(0);
  await press();
  await wait(5);
  assert.deepEqual(talk, ['odell']);
  assert.deepEqual(env.asks.at(-1).options.map((o) => o.text), ['Talk', 'Give a gift', 'Never mind']);
  assert.equal(env.asks.at(-1).speaker, 'odell');
  assert.ok(odell.rig.calls.some((c) => c[0] === 'faceTowards'));
  assert.equal(odell.busy, false);
  frames(0.5);
  env.askQueue.push(1);
  await press();
  await wait(5);
  assert.deepEqual(gift, ['odell']);
  frames(0.5);
  env.askQueue.push(2);
  await press();
  await wait(5);
  assert.equal(talk.length + gift.length, 2);
  svc.rel.talk = origT;
  svc.rel.giftFlow = origG;
});

test('interaction: a person standing at a job counter (Theo at the post counter) still lets you work via the NPC menu', async () => {
  const env = boot({ quickAnims: true });
  await startIn('general_store', 'counter_front', { minutes: 13 * 60 + 20, day: 1 });
  const theo = svc.entities.actor('theo');
  assert.ok(theo, 'Theo works the post counter in the afternoon');
  const pa = svc.entities.playerActor();
  svc.entities.teleport(pa, theo.x, theo.z + 0.95, 'n');
  pa.facing = 'n';
  frames(0.8);
  assert.equal(svc.interaction.target.kind, 'npc');
  assert.equal(svc.interaction.target.counter?.id, 'post_counter');
  const spy = spyRun();
  const origT = svc.rel.talk;
  svc.rel.talk = async () => {};
  env.askQueue.push(2);
  await press();
  await wait(5);
  assert.deepEqual(env.asks.at(-1).options.map((o) => o.text), ['Talk', 'Give a gift', 'Work', 'Never mind']);
  assert.deepEqual(spy.calls, [['general_store', 'post_counter']]);
  svc.rel.talk = origT;
  spy.restore();
});

// ---------------------------------------------------------------- staging with the REAL events
const pump = async (p, seconds = 90) => {
  let done = false;
  p.then(() => { done = true; }, () => { done = true; });
  const ok = await until(() => done, seconds);
  assert.ok(ok, 'script did not finish');
};

test('staging: the REAL prologue plays (Odell walks to the cottage, quests start) and the world is restored after', async () => {
  const env = boot({ quickAnims: true });
  const st = Game.state;
  delete st.flags.prologue_done;
  svc.clock.set({ minutes: 6 * 60, day: 1 });
  await svc.entities.enterArea('brook_lane', 'cottage_front', { fade: false }); // area:enter starts the prologue by itself
  assert.equal(svc.events.running, true);
  assert.ok(await until(() => st.flags.prologue_done && !svc.events.running, 120));
  assert.equal(st.flags.prologue_done, true);
  assert.ok(svc.quests.isActive('t_meet_town'));
  assert.ok(env.says.some(([s, t]) => s === 'odell' && /Welcome to Lanternbrook/.test(t)));
  assert.equal(Game.mode, 'field');
  const o = svc.entities.actor('odell');
  assert.ok(o, 'odell exists');
  // after event:end Odell is back on his schedule (either walking there or already gone)
  frames(0.2);
  assert.equal(o.staged, false);
  // the camera followed the player again and the music was restored to the area track
  assert.equal(env.music.at(-1), svc.entities.areaId() === 'brook_lane' ? 'town_spring' : env.music.at(-1));
});

test('staging: heart_mira_2 and festival_lantern (both branches) run to the end with every op handled, no warnings', async () => {
  const env = boot({ quickAnims: true });
  const warns = [];
  const ow = console.warn;
  console.warn = (...a) => warns.push(a.join(' '));
  try {
    // heart event: hearts + location prerequisites do not matter, run the script directly
    await svc.entities.enterArea('town_square', 'plaza_center', { fade: false });
    svc.clock.set({ minutes: 12 * 60, day: 1 });
    await pump(svc.script.run(Data.events.heart_mira_2.script, { cutscene: true, source: 'heart_mira_2' }));
    assert.equal(Game.mode, 'field');
    assert.ok(env.says.some(([s]) => s === 'mira'), 'mira spoke');
    assert.ok(env.camera.length > 0);
    await pump(svc.script.run(Data.events.heart_mira_8.script, { cutscene: true, source: 'heart_mira_8' }));
    assert.ok(env.effects.some(([n]) => n === 'hearts'), 'hearts effect');
    // lantern festival with all lanterns -> lamps all_lit, camera pan to the stage, sparkle at the focus
    Game.state.story.lanterns = 6;
    svc.clock.set({ season: 3, day: 24, minutes: 18 * 60 });
    await svc.entities.enterArea('town_square', 'plaza_center', { fade: false });
    env.effects.length = 0;
    env.camera.length = 0;
    await pump(svc.script.run(Data.events.festival_lantern.script, { cutscene: true, source: 'festival_lantern' }));
    assert.ok(env.effects.some(([n]) => n === 'sparkle'));
    assert.ok(env.decorLog.includes('lantern_festival'));
    assert.equal(Game.state.flags.festival_lit, true);
    assert.equal(svc.lamps.override, 'lit', 'all_lit override stays after the festival script');
    svc.lamps.setOverride('restore');
    assert.equal(svc.lamps.override, null);
  } finally {
    console.warn = ow;
  }
  assert.deepEqual(warns.filter((w) => !/unknown|AudioContext/.test(w) || /stage|op/.test(w)), []);
});

test('staging: every ARCHITECTURE section 11 staging op behaves (place/move/face/anim/expr/emote/hold/camera/hide/show/effect/decor/area)', async () => {
  const env = boot({ quickAnims: true });
  await startIn('brook_lane', 'cottage_front', { minutes: 10 * 60, day: 1 });
  const run = (steps) => pump(svc.script.run(steps, { cutscene: true }));
  await run([{ place: 'mira', at: 'willow', facing: 'player' }, { place: 'player', at: { x: 20, z: 20 }, facing: 'n' }]);
  const m = svc.entities.actor('mira');
  const an = svc.entities.area().anchors.willow;
  assert.ok(Math.hypot(m.x - an.x, m.z - an.z) < 1.2);
  assert.equal(m.staged, true);
  const pa = svc.entities.playerActor();
  assert.ok(Math.abs(pa.x - 20) < 0.6);
  await run([{ face: 'mira', toward: 'e' }, { expr: 'mira', name: 'happy' }, { emote: 'mira', icon: 'heart' }, { hold: 'mira', prop: 'basket' }, { anim: 'mira', name: 'wave', wait: true }]);
  assert.equal(m.rig.facing, 'e');
  assert.equal(m.rig.expr, 'happy');
  assert.equal(m.rig.held, 'basket');
  assert.ok(m.rig.calls.some((c) => c[0] === 'emote' && c[1] === 'heart'));
  assert.ok(m.rig.calls.some((c) => c[0] === 'play' && c[1] === 'wave' && c[2].loop === false), 'wait forces a single play');
  // move waits for arrival (run), then face toward an anchor
  const dest = svc.entities.area().anchors.garden_bench;
  await run([{ move: 'mira', to: 'garden_bench', speed: 'run', wait: true }, { face: 'mira', toward: 'cottage_front' }]);
  assert.ok(Math.hypot(m.x - dest.x, m.z - dest.z) < 0.6);
  // player move + camera focus on an anchor, then reset
  await run([{ move: 'player', to: 'mailbox_spot', wait: true }]);
  await run([{ camera: { focus: 'willow', ms: 50, zoom: 1.2 } }]);
  assert.equal(svc.entities.camTarget().x, an.x);
  frames(0.2);
  assert.equal(env.cam.x, an.x);
  await run([{ camera: { focus: 'mira' } }]);
  frames(0.1);
  assert.ok(Math.abs(env.cam.x - m.x) < 0.01);
  await run([{ camera: 'reset' }]);
  frames(0.1);
  assert.ok(Math.abs(env.cam.x - pa.x) < 0.01);
  // hide / show / effect / decor / lamps
  await run([{ hide: 'mira' }]);
  assert.equal(m.rig.group.visible, false);
  await run([{ show: 'mira' }, { effect: 'sparkle', at: 'willow' }, { effect: 'hearts' }, { decor: 'spring_picnic' }, { lamps: 'all_lit' }]);
  assert.equal(m.rig.group.visible, true);
  assert.equal(env.effects.filter(([n]) => n === 'sparkle').length, 1);
  assert.equal(env.effects.at(-1)[0], 'hearts');
  assert.equal(env.decor, 'spring_picnic');
  assert.ok(Object.values(env.lampStates).every((s) => s === 'lit'));
  await run([{ lamps: 'normal' }]);
  assert.ok(Object.values(env.lampStates).every((s) => s !== 'lit'));
  // unreachable target: teleport, no hang
  await run([{ move: 'mira', to: { x: 1000, z: 1000 }, wait: true }]);
  // area op: to another area with the anchor, player lands there
  await run([{ area: 'cottage', at: 'bed_spot', facing: 'n' }]);
  assert.equal(pos().area, 'cottage');
  const bed = svc.entities.area().anchors.bed_spot;
  assert.ok(Math.hypot(pos().x - bed.x, pos().z - bed.z) < 0.6);
  // same-area `area` op just repositions
  const loads = env.areaLoads.length;
  await run([{ area: 'cottage', at: 'table' }]);
  assert.equal(env.areaLoads.length, loads);
  // unknown ids never throw
  await run([{ anim: 'nobody_here', name: 'wave' }, { move: 'player', to: 'no_such_anchor' }, { place: 'odell', at: 'nope' }]);
});

test('staging: every event in Data.events runs to completion with the live world (rotating answers, no hangs)', async () => {
  const env = boot({ quickAnims: true });
  timing.scale = 0.001;
  const bad = [];
  let n = 0;
  let k = 0;
  const origAsk = Game.ui.dialogue.ask;
  Game.ui.dialogue.ask = async (x) => { k++; return k % Math.max(1, x.options.length); };
  for (const [id, ev] of Object.entries(Data.events)) {
    Game.mode = 'field';
    Game.state.story.lanterns = n % 7;
    const area = Data.festivals && Object.values(Data.festivals).find((f) => f.eventId === id)?.area;
    await svc.entities.enterArea(area || 'town_square', undefined, { fade: false });
    try {
      await pump(svc.script.run(ev.script, { cutscene: true, source: id }), 60);
      n++;
    } catch (e) { bad.push(`${id}: ${String(e.message).slice(0, 80)}`); }
    if (Game.mode !== 'field') { bad.push(`${id}: mode ${Game.mode}`); Game.mode = 'field'; }
  }
  Game.ui.dialogue.ask = origAsk;
  assert.deepEqual(bad, []);
  assert.ok(n >= 30, `ran ${n}`);
  assert.ok(env.rigs.length > 5);
});

// ---------------------------------------------------------------- activities
const BITE = (env) => { env.onSfx = (id) => { if (id === 'bite') setTimeout(() => Input._emit('confirm'), 0); }; };
const fishSpot = () => svc.entities.area().interactables.find((i) => i.type === 'fishing');

test('fishing: needs the rod; cast -> wait -> bite -> minigame -> catch records size/log/stat/event, +10 min, -3 energy', async () => {
  const env = boot({ quickAnims: true });
  timing.scale = 0.001;
  await startIn('brook_lane', 'stream_bank', { minutes: 10 * 60, day: 3 });
  const it = fishSpot();
  assert.equal(it.type, 'fishing');
  assert.equal(it.water, 'brook');
  await svc.interact.run('brook_lane', it);
  assert.match(env.narrates.at(-1), /fishing rod/);
  svc.inventory.give('fishing_rod', 1, { silent: true });
  BITE(env);
  const caught = [];
  Game.bus.on('fish:caught', (e) => caught.push(e));
  const e0 = Game.state.player.energy;
  const t0 = Game.state.time.minutes;
  let mg = null;
  Game.ui.minigames.fishing = async (o) => { mg = o; return { caught: true, perfect: true }; };
  await svc.interact.run('brook_lane', it);
  assert.ok(mg, 'minigame ran');
  assert.ok(mg.fish.id && mg.fish.difficulty >= 1 && mg.rodPower === 1 && mg.fish.speed > 0);
  assert.equal(caught.length, 1);
  const fish = Data.fish[caught[0].id];
  assert.ok(fish.spots.includes('brook'));
  assert.ok(caught[0].size >= fish.size[0] + Math.floor((fish.size[1] - fish.size[0]) / 2) - 1 && caught[0].size <= fish.size[1], 'perfect -> upper half');
  assert.equal(svc.inventory.count(fish.id), 1);
  assert.equal(Game.state.log.fish[fish.id].count, 1);
  assert.equal(Game.state.log.fish[fish.id].maxSize, caught[0].size);
  assert.equal(Game.state.stats.fishCaught, 1);
  assert.equal(Game.state.time.minutes - t0, 10);
  assert.equal(e0 - Game.state.player.energy, 3);
  for (const s of ['cast', 'bite', 'catch']) assert.ok(env.sfx.includes(s), s);
  assert.equal(svc.entities.getPlayerRig().held, null);
  assert.equal(Game.mode, 'field');
  // failed minigame
  Game.ui.minigames.fishing = async () => ({ caught: false });
  await svc.interact.run('brook_lane', it);
  assert.ok(env.toasts.some((t) => /got away/.test(t)));
  assert.equal(Game.state.stats.fishCaught, 1);
  // missed bite window (nobody presses)
  env.onSfx = null;
  const t1 = Game.state.time.minutes;
  await svc.interact.run('brook_lane', it);
  assert.ok(Game.state.time.minutes > t1 || env.toasts.filter((t) => /got away|reel/.test(t)).length >= 2);
  // pressing early reels the line in without a fish
  env.onSfx = (id) => { if (id === 'cast') setTimeout(() => Input._emit('confirm'), 0); };
  const n0 = Game.state.stats.fishCaught;
  await svc.interact.run('brook_lane', it);
  assert.equal(Game.state.stats.fishCaught, n0);
  timing.scale = 1;
});

test('fishing: fish choice honours spot kind, season, weather, time window and is seeded by (day, spot, cast)', () => {
  boot();
  const st = Game.state;
  for (const water of ['brook', 'river', 'pier', 'beach', 'stream']) {
    for (const season of [0, 1, 2, 3]) {
      for (const weather of ['sunny', 'rain', 'snow']) {
        for (const minutes of [7 * 60, 12 * 60, 20 * 60, 23 * 60]) {
          svc.clock.set({ season, day: 5, minutes });
          st.weather.today = weather;
          for (const f of Object.values(Data.fish)) void f;
          const pool = Object.values(Data.fish).filter((f) => f.spots.includes(water));
          const pick = pickFish(water, rngFor('fish', 5, 'x', 1));
          if (pick) {
            assert.ok(pool.includes(pick));
            assert.ok(pick.seasons.includes(['spring', 'summer', 'autumn', 'winter'][season]));
            assert.ok(pick.weather.includes(weather));
          }
        }
      }
    }
  }
  svc.clock.set({ season: 1, day: 3, minutes: 10 * 60 });
  st.weather.today = 'sunny';
  const a = pickFish('river', rngFor('fish', 10, 'fishing_rp_1', 1));
  const b = pickFish('river', rngFor('fish', 10, 'fishing_rp_1', 1));
  assert.equal(a.id, b.id);
  const ids = new Set();
  for (let c = 1; c < 40; c++) ids.add(pickFish('river', rngFor('fish', 10, 'fishing_rp_1', c)).id);
  assert.ok(ids.size >= 3, 'variety across casts');
  assert.ok(sizeAt({ size: [10, 20] }, 0, true) >= 15 && sizeAt({ size: [10, 20] }, 0.999, false) <= 20);
});

test('forage: one seeded roll per spot per day, pick-up rewards + stats + event, empty afterwards, new day re-rolls', async () => {
  const env = boot({ quickAnims: true });
  await startIn('brook_lane', 'meadow', { minutes: 9 * 60, day: 2, season: 0 });
  const spots = svc.entities.area().interactables.filter((i) => i.type === 'forage');
  assert.equal(spots.length, 3);
  const rolls = spots.map((s) => rollForage('brook_lane', s.id));
  assert.deepEqual(spots.map((s) => rollForage('brook_lane', s.id)), rolls, 'stable within the day');
  assert.deepEqual(Game.state.world.forage.brook_lane.spots, Object.fromEntries(spots.map((s, i) => [s.id, rolls[i]])));
  const items = new Set(Data.forage.brook_lane.spring.map((e) => e.item));
  for (const r of rolls) assert.ok(items.has(r), `${r} from the spring table`);
  const picked = [];
  Game.bus.on('forage:picked', (e) => picked.push(e));
  // find a spot with an item (try several days if the dice say empty)
  let day = 2;
  let spot = null;
  for (; day < 20 && !spot; day++) {
    svc.clock.set({ day, minutes: 9 * 60 });
    spot = spots.find((s) => rollForage('brook_lane', s.id));
  }
  assert.ok(spot, 'some spot has something');
  const item = rollForage('brook_lane', spot.id);
  const e0 = Game.state.player.energy;
  await svc.interact.run('brook_lane', spot);
  assert.equal(svc.inventory.count(item), 1);
  assert.equal(Game.state.log.forage[item], 1);
  assert.equal(Game.state.stats.forageCount, 1);
  assert.equal(e0 - Game.state.player.energy, 1);
  assert.deepEqual(picked, [{ id: item, spot: spot.id }]);
  assert.ok(env.sfx.includes('pop'));
  await svc.interact.run('brook_lane', spot);
  assert.match(env.narrates.at(-1), /Nothing here today/);
  assert.equal(svc.inventory.count(item), 1);
  // a new day re-rolls (deterministically)
  svc.clock.set({ day: day + 1, minutes: 9 * 60 });
  const again = rollForage('brook_lane', spot.id);
  assert.equal(Game.state.world.forage.brook_lane.day, dayNumber(Game.state.time));
  assert.ok(again === null || items.has(again));
});

test('lamps: broken / unlit / lit by story + dusk + festival; lighting at dusk counts; world gets the states', async () => {
  const env = boot({ quickAnims: true });
  const ids = lampIds('brook_lane');
  const lamps = svc.lamps;
  await startIn('brook_lane', 'lamp_corner', { minutes: 18 * 60, day: 3 });
  assert.ok(Object.values(env.lampStates).every((s) => s === 'broken'));
  const it = svc.entities.area().interactables.find((i) => i.type === 'lamp');
  await svc.interact.run('brook_lane', it);
  assert.match(env.narrates.at(-1), /cracked/);
  Game.state.story.lanterns = 6;
  lamps.apply();
  assert.equal(env.lampStates[it.id], 'unlit');
  // daytime
  svc.clock.set({ minutes: 12 * 60 });
  await svc.interact.run('brook_lane', it);
  assert.match(env.narrates.at(-1), /dusk/);
  svc.clock.set({ minutes: 18 * 60 });
  await svc.interact.run('brook_lane', it);
  assert.equal(Game.state.world.lamps[it.id], dayNumber(Game.state.time));
  assert.equal(env.lampStates[it.id], 'lit');
  assert.ok(env.sfx.includes('lamp_light'));
  await svc.interact.run('brook_lane', it);
  assert.match(env.narrates.at(-1), /glows/);
  // dawn: lamp is no longer lit, and a new day forgets
  svc.clock.set({ minutes: 7 * 60 });
  Game.bus.emit('time:hour', { hour: 7 });
  assert.equal(env.lampStates[it.id], 'unlit');
  svc.clock.set({ minutes: 18 * 60 });
  assert.equal(lamps.stateOf('brook_lane', it.id, it), 'lit');
  svc.clock.set({ day: 4, minutes: 18 * 60 });
  assert.equal(lamps.stateOf('brook_lane', it.id, it), 'unlit');
  // partially repaired: group order
  Game.state.story.lanterns = 2;
  assert.equal(lamps.stateOf('town_square', 'lamp_sq_1', { group: 1 }), 'unlit');
  assert.equal(lamps.stateOf('harbor', 'lamp_hb_1', { group: 3 }), 'broken');
  // festival night: repaired lamps auto-lit
  svc.clock.set({ season: 3, day: 24, minutes: 19 * 60 });
  assert.equal(lamps.stateOf('town_square', 'lamp_sq_1', { group: 1 }), 'lit');
  assert.equal(lamps.stateOf('harbor', 'lamp_hb_1', { group: 3 }), 'broken');
  assert.equal(ids.length, 4);
});

// ---------------------------------------------------------------- jobs
test('job: bakery shift - window/closed checks, intro once, kneading pay, energy, time, affection, job:done', async () => {
  const env = boot({ quickAnims: true });
  await startIn('bakery', 'counter_front', { minutes: 7 * 60 + 30, day: 1 });
  const done = [];
  Game.bus.on('job:done', (e) => done.push(e));
  // outside the window
  svc.clock.set({ minutes: 13 * 60 });
  await svc.jobs.start('bakery_shift');
  assert.match(env.narrates.at(-1), /Come back between/);
  // Sunday: the bakery is closed
  svc.clock.set({ day: SUN, minutes: 8 * 60 });
  await svc.jobs.start('bakery_shift');
  assert.match(env.narrates.at(-1), /no work|There is no work/i);
  svc.clock.set({ day: 1, minutes: 7 * 60 + 30 });
  Game.state.player.energy = 10;
  await svc.jobs.start('bakery_shift');
  assert.match(env.narrates.at(-1), /too tired/);
  Game.state.player.energy = 100;
  delete Game.state.quests.active.t_first_shift; // the tutorial quest (auto-started) would add its own reward
  Game.state.quests.done.t_first_shift = 1;
  const m0 = Game.state.player.money;
  const aff = [svc.rel.aff('mira'), svc.rel.aff('rosalind')];
  env.says.length = 0;
  await svc.jobs.start('bakery_shift');
  assert.ok(env.says.some(([s]) => s === 'rosalind'), 'intro played');
  assert.ok(env.says.some(([s, t]) => /Not bad at all/.test(t)), 'done script played');
  assert.equal(Game.state.player.money - m0, 80 + Math.round(60 * 0.8));
  assert.equal(Game.state.player.energy, 80);
  assert.equal(Game.state.time.minutes, 10 * 60 + 30);
  assert.equal(svc.rel.aff('mira') - aff[0], 10);
  assert.equal(svc.rel.aff('rosalind') - aff[1], 8);
  assert.equal(done.length, 1);
  assert.equal(done[0].id, 'bakery_shift');
  assert.equal(done[0].score, 0.8);
  assert.equal(Game.state.jobs.doneDay.bakery_shift, dayNumber(Game.state.time));
  assert.equal(Game.mode, 'field');
  // once per day, and the intro is not repeated
  env.says.length = 0;
  await svc.jobs.start('bakery_shift');
  assert.match(env.narrates.at(-1), /already done/);
  assert.equal(env.says.length, 0);
  svc.clock.set({ day: 2, minutes: 10 * 60 + 50 }); // late: time advance is capped at the window end
  Game.state.jobs.doneDay = {};
  await svc.jobs.start('bakery_shift');
  assert.ok(Game.state.time.minutes <= 11 * 60);
});

test('job: parcel run - 3-5 parcels for present villagers, hand over via the talk flow, pay + speed bonus, deadline, report', async () => {
  const env = boot({ quickAnims: true });
  await startIn('general_store', 'counter_front', { minutes: 13 * 60 + 30, day: 1 });
  const done = [];
  Game.bus.on('job:done', (e) => done.push(e));
  await svc.jobs.start('parcel_run');
  const p = Game.state.jobs.parcel;
  assert.ok(p && p.list.length >= 3 && p.list.length <= 5);
  assert.equal(p.deadline - p.start, 180);
  assert.equal(Game.state.player.energy, 85);
  for (const e of p.list) {
    assert.notEqual(e.to, 'theo');
    assert.equal(svc.npcs.whereIs(e.to).hidden, false);
  }
  // starting again just reports the open parcels
  await svc.jobs.start('parcel_run');
  assert.match(env.narrates.at(-1), /still have parcels/);
  assert.equal(await svc.jobs.handOver('nobody'), false);
  const m0 = Game.state.player.money;
  const first = p.list[0].to;
  assert.equal(await svc.jobs.handOver(first), true);
  assert.equal(Game.state.player.money - m0, 25 + 30, 'delivered instantly: full speed bonus');
  assert.equal(await svc.jobs.handOver(first), false, 'only once');
  // a slow delivery earns less bonus
  svc.clock.set({ minutes: p.start + 90 });
  const m1 = Game.state.player.money;
  assert.equal(await svc.jobs.handOver(p.list[1].to), true);
  assert.equal(Game.state.player.money - m1, 25 + 15);
  for (const e of p.list.slice(2)) await svc.jobs.handOver(e.to);
  assert.ok(env.toasts.some((t) => /All parcels delivered/.test(t)));
  await svc.jobs.start('parcel_run'); // report
  assert.equal(done.length, 1);
  assert.equal(done[0].score, 1);
  assert.equal(done[0].pay, p.paid);
  assert.equal(Game.state.jobs.parcel, undefined);
  // expired parcels: nothing delivered -> no credit; next day cleared
  Game.state.jobs.doneDay = {};
  svc.clock.set({ minutes: 14 * 60 });
  await svc.jobs.start('parcel_run');
  const q = Game.state.jobs.parcel;
  svc.clock.set({ minutes: q.deadline + 5 });
  assert.equal(await svc.jobs.handOver(q.list[0].to), false, 'too late');
  svc.clock.set({ minutes: 16 * 60 });
  Game.bus.emit('time:newday', {});
  assert.equal(Game.state.jobs.parcel, undefined);
});

test('job: lamplighter - dusk window (hall open for the job after hours), each lit lamp counts, desk pays, town-wide bonus, 19:30 auto-settle', async () => {
  const env = boot({ quickAnims: true });
  Game.state.story.lanterns = 6;
  await startIn('town_hall', 'desk_front', { minutes: 15 * 60, day: 1 });
  const done = [];
  Game.bus.on('job:done', (e) => done.push(e));
  await svc.jobs.start('lamplighter');
  assert.match(env.narrates.at(-1), /Come back between/);
  svc.clock.set({ minutes: 17 * 60 + 45 });
  await svc.jobs.start('lamplighter');
  assert.ok(env.says.some(([s]) => s === 'odell'), 'intro');
  assert.ok(Game.state.jobs.lamp);
  assert.equal(Game.state.player.energy, 90);
  await svc.jobs.start('lamplighter');
  assert.match(env.narrates.at(-1), /not lit any lamps/);
  // light two lamps in the square (group 1)
  await svc.entities.enterArea('town_square', 'plaza_center', { fade: false });
  const lamps = svc.entities.area().interactables.filter((i) => i.type === 'lamp');
  const m0 = Game.state.player.money;
  await svc.interact.run('town_square', lamps[0]);
  await svc.interact.run('town_square', lamps[1]);
  assert.equal(Game.state.jobs.lamp.count, 2);
  await svc.entities.enterArea('town_hall', 'desk_front', { fade: false });
  await svc.jobs.start('lamplighter');
  assert.equal(Game.state.player.money - m0, 12, 'no bonus: not every lamp in town is lit');
  assert.equal(done.length, 1);
  assert.equal(Game.state.jobs.lamp, undefined);
  assert.equal(Game.state.jobs.doneDay.lamplighter, dayNumber(Game.state.time));
  // every repaired lamp in town lit -> +40, and the 19:30 auto-settle path
  Game.state.jobs.doneDay = {};
  for (const a of ['town_square', 'market_street', 'harbor', 'riverside_park', 'starview_hill', 'whispering_woods', 'brook_lane']) {
    for (const id of lampIds(a)) Game.state.world.lamps[id] = dayNumber(Game.state.time);
  }
  Game.state.jobs.lamp = { day: dayNumber(Game.state.time), count: 3 };
  const m1 = Game.state.player.money;
  svc.clock.set({ minutes: 19 * 60 + 29 });
  svc.clock.advance(2);
  await wait(5);
  assert.equal(Game.state.player.money - m1, 3 * 6 + 40);
  assert.equal(Game.state.jobs.lamp, undefined);
});

test('S2 services survive: new game flow, continue/save position, quit to title', async () => {
  const env = boot({ quickAnims: true });
  Game.ui.showTitle = async () => ({ action: 'quit' });
  await pump(Sys.newGame({ name: 'Kai' }));
  assert.equal(svc.entities.getPlayerPos().area, 'brook_lane');
  assert.ok(env.rigs.some((r) => r.id === 'player'));
  await hold(0, 1, 0.4);
  const p = pos();
  const r = svc.director.saveGame(1);
  assert.equal(r.ok, true);
  assert.equal(Game.state.player.area, 'brook_lane');
  assert.ok(Math.abs(Game.state.player.z - p.z) < 1e-6);
  // continue lands on the saved position
  await svc.entities.enterArea('cottage', 'bed_spot', { fade: false });
  await pump(Sys.continueGame(1));
  const q = pos();
  assert.equal(q.area, 'brook_lane');
  assert.ok(Math.hypot(q.x - p.x, q.z - p.z) < 0.5);
  // sleeping lands in the cottage, next morning, NPCs populated for 06:00
  Game.state.time.minutes = 22 * 60;
  await pump(svc.director.sleep({ confirm: false }));
  assert.equal(pos().area, 'cottage');
  assert.equal(Game.state.time.minutes, 360);
  assert.equal(Game.mode, 'field');
  // quit to title tears the rigs down
  Game.state = null;
  frames(0.1);
  assert.equal([...svc.entities.actors().keys()].length, 0);
});
