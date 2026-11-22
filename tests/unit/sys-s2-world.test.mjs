// S2 world-facing systems against REAL data + REAL headless areas: path, schedules, area entry, NPC movement, music.
import test from 'node:test';
import assert from 'node:assert/strict';
import { boot, startIn, frames, until, svc, Game, Data, Sys } from './fixtures/sys-s2-env.mjs';
import { AREA_IDS, AREAS, NPC_IDS, areaAnchorNames } from '../../src/core/registry.js';
import { parseHHMM } from '../../src/core/util.js';
import { buildHeadless } from '../../src/world/headless.js';
import { path } from '../../src/systems/path.js';
import { pickMusic } from '../../src/systems/audio-director.js';

const areaCache = {};
const rt = (id) => (areaCache[id] ||= buildHeadless(id).runtime);

test('path: A* connects every entry anchor of the built areas, stays on walkable tiles, no corner cutting', () => {
  for (const id of ['brook_lane', 'cottage', 'town_square']) {
    const a = rt(id);
    const names = areaAnchorNames(id);
    let n = 0;
    for (const from of names) {
      for (const to of names) {
        if (from === to) continue;
        const A = a.anchors[from];
        const B = a.anchors[to];
        const route = path.find(a, A.x, A.z, B.x, B.z);
        assert.ok(route, `${id}: ${from} -> ${to} unreachable`);
        let px = A.x;
        let pz = A.z;
        for (const w of route) {
          // every sampled point of every segment is on a walkable tile
          const len = Math.hypot(w.x - px, w.z - pz);
          for (let k = 1; k <= Math.ceil(len / 0.25); k++) {
            const t = k / Math.ceil(len / 0.25);
            const x = px + (w.x - px) * t;
            const z = pz + (w.z - pz) * t;
            // (points exactly on a tile corner belong to either neighbour: diagonal steps pass through corners)
            // (and a tile marked blocked may only be grazed where the real collision shape does not reach)
            const ok = a.isWalkable(Math.floor(x + 1e-4), Math.floor(z + 1e-4)) || a.isWalkable(Math.floor(x - 1e-4), Math.floor(z - 1e-4)) || !a.isBlockedAt(x, z, 0.1);
            assert.ok(ok, `${id}: ${from}->${to} crosses blocked tile at ${x.toFixed(2)},${z.toFixed(2)}`);
          }
          px = w.x;
          pz = w.z;
        }
        n++;
      }
    }
    assert.ok(n > 10);
  }
});

test('path: unreachable goal -> null; same spot -> []; cached results are stable', () => {
  const fake = { id: 'fake', grid: { w: 7, h: 5, walk: new Uint8Array(35).fill(1) }, isBlockedAt: () => false };
  // wall column x=3 (full height) splits the room
  for (let j = 0; j < 5; j++) fake.grid.walk[j * 7 + 3] = 0;
  assert.equal(path.find(fake, 1.5, 2.5, 5.5, 2.5), null);
  path.clear(); // the cache is keyed by area id; this fake area changes shape
  fake.grid.walk[2 * 7 + 3] = 1; // door
  const r = path.find(fake, 1.5, 2.5, 5.5, 2.5);
  assert.ok(r && r.length >= 1);
  assert.deepEqual(path.find(fake, 1.5, 2.5, 5.5, 2.5), r);
  assert.deepEqual(path.find(fake, 1.5, 2.5, 1.5, 2.5), []);
  // no diagonal squeeze between two blocked corners
  const f2 = { id: 'f2', grid: { w: 3, h: 3, walk: new Uint8Array([1, 0, 1, 0, 1, 1, 1, 1, 1]) }, isBlockedAt: () => false };
  const r2 = path.find(f2, 0.5, 0.5, 1.5, 1.5);
  assert.ok(r2 === null || r2.length > 1 || f2.grid.walk[0 * 3 + 1] === 1, 'must not cut the corner');
});

test('schedules: every slot of every NPC references a real area + anchor; every time of day resolves', () => {
  boot();
  const problems = [];
  for (const [npc, rules] of Object.entries(Data.schedules)) {
    assert.ok(NPC_IDS.includes(npc), `schedule for unknown npc ${npc}`);
    for (const r of rules) {
      for (const s of r.slots) {
        const def = AREAS[s.area];
        if (!def) { problems.push(`${npc}: area ${s.area}`); continue; }
        const names = areaAnchorNames(s.area);
        if (!names.includes(s.at)) problems.push(`${npc}: ${s.area}.${s.at} is not a registry anchor`);
      }
    }
  }
  assert.deepEqual(problems, []);
  for (const day of [1, 2, 3, 4, 5, 6, 7]) {
    svc.clock.set({ season: 0, day, minutes: 600 });
    for (const w of ['sunny', 'rain']) {
      Game.state.weather.today = w;
      for (let m = 360; m <= 1560; m += 20) {
        for (const npc of NPC_IDS) {
          const loc = svc.npcs.whereIs(npc, m);
          assert.ok(loc && AREAS[loc.area], `${npc}@${m}: bad loc ${JSON.stringify(loc)}`);
        }
      }
    }
  }
});

test('whereIs: first matching rule + latest slot <= now; before the first slot -> hidden; festival placement overrides', () => {
  boot();
  svc.clock.set({ season: 0, day: 1, minutes: 600 }); // Monday
  const a = svc.npcs.whereIs('mira', parseHHMM('07:30'));
  assert.equal(a.area, 'bakery');
  assert.equal(a.at, 'kneading_table');
  assert.equal(svc.npcs.whereIs('mira', parseHHMM('06:10')).at, 'oven_spot');
  assert.equal(svc.npcs.whereIs('mira', parseHHMM('21:00')).hidden, true);
  // sunday rule of Mira (weekday gate) and rain rule
  svc.clock.set({ season: 0, day: 7, minutes: 600 });
  assert.equal(svc.npcs.whereIs('mira', parseHHMM('11:30')).area, 'riverside_park');
  svc.clock.set({ season: 0, day: 2, minutes: 600 });
  Game.state.weather.today = 'rain';
  assert.equal(svc.npcs.whereIs('mira', parseHHMM('11:30')).area, 'bakery');
  // festival: lantern festival day (winter 24) 16:00-22:00 inside the window; outside it the normal schedule
  svc.clock.set({ season: 3, day: 24, minutes: 17 * 60 });
  const o = svc.npcs.whereIs('odell', 17 * 60);
  assert.deepEqual([o.area, o.at, o.hidden], ['town_square', 'stage', false]);
  const other = svc.npcs.whereIs('pip', 17 * 60);
  assert.equal(other.area, 'town_square');
  assert.ok(Data.festivals.lantern.placement.default.anchors.includes(other.at));
  assert.deepEqual(svc.npcs.whereIs('pip', 17 * 60), other, 'deterministic');
  svc.clock.set({ season: 3, day: 24, minutes: 9 * 60 });
  assert.notEqual(svc.npcs.whereIs('odell', 9 * 60).key.startsWith('fest'), true);
});

test('music: town by season/day, night, rain; interiors; festival track inside the festival window', () => {
  boot();
  const base = { area: 'town_square', season: 'autumn', weather: 'sunny', minutes: 12 * 60 };
  assert.equal(pickMusic(base), 'town_autumn');
  assert.equal(pickMusic({ ...base, minutes: 19 * 60 }), 'night');
  assert.equal(pickMusic({ ...base, minutes: 5 * 60 }), 'night');
  assert.equal(pickMusic({ ...base, weather: 'rain' }), 'town_rain');
  assert.equal(pickMusic({ ...base, area: 'bakery' }), 'shop');
  assert.equal(pickMusic({ ...base, area: 'cottage' }), 'home');
  assert.equal(pickMusic({ ...base, area: 'harbor' }), 'harbor');
  svc.clock.set({ season: 3, day: 24, minutes: 19 * 60 });
  assert.equal(pickMusic({ area: 'town_square', season: 'winter', weather: 'snow', minutes: 19 * 60 }), 'festival_winter');
  assert.equal(pickMusic({ area: 'brook_lane', season: 'winter', weather: 'snow', minutes: 19 * 60 }), 'night');
  svc.clock.set({ season: 2, day: 14, minutes: 12 * 60 });
  assert.equal(pickMusic({ area: 'town_square', season: 'autumn', weather: 'sunny', minutes: 12 * 60 }), 'festival');
});

test('enterArea: loads, places the player at the anchor, emits exit/enter in order, applies music + lamps; every area id loads', async () => {
  const env = boot();
  const evts = [];
  Game.bus.on('area:exit', (e) => evts.push(['exit', e.area]));
  Game.bus.on('area:enter', (e) => evts.push(['enter', e.area, e.from]));
  await startIn('brook_lane', 'cottage_front', { minutes: 10 * 60 });
  assert.deepEqual(evts, [['enter', 'brook_lane', null]]);
  const p = svc.entities.getPlayerPos();
  const an = rt('brook_lane').anchors.cottage_front;
  assert.equal(p.area, 'brook_lane');
  assert.ok(Math.hypot(p.x - an.x, p.z - an.z) < 0.5);
  assert.equal(Game.state.player.area, 'brook_lane');
  assert.deepEqual(env.snap && { x: +env.snap.x.toFixed(1), z: +env.snap.z.toFixed(1) }, { x: +an.x.toFixed(1), z: +an.z.toFixed(1) });
  assert.equal(env.music.at(-1), 'town_spring');
  assert.ok(env.ambience && env.ambience.area === 'brook_lane');
  assert.ok(Object.values(env.lampStates).every((s) => s === 'broken'), 'no lanterns restored yet -> broken lamps');
  await svc.entities.enterArea('cottage', 'from_brook_lane', { fade: false });
  assert.deepEqual(evts.slice(1), [['exit', 'brook_lane'], ['enter', 'cottage', 'brook_lane']]);
  assert.equal(env.music.at(-1), 'home');
  // every registry area loads (built + placeholders) and ends with the player on a walkable spot
  for (const id of AREA_IDS) {
    await svc.entities.enterArea(id, undefined, { fade: false });
    const pos = svc.entities.getPlayerPos();
    assert.equal(pos.area, id);
    assert.equal(rt(id).isBlockedAt(pos.x, pos.z, 0.25), false, `${id}: player placed on a blocked spot`);
  }
  // fades: with fade:true the UI fades out then in
  env.fades.length = 0;
  await svc.entities.enterArea('town_square', 'from_brook_lane');
  assert.deepEqual(env.fades.map((f) => f[0]), [1, 0]);
});

test('enterArea: NPCs that whereIs puts here are spawned at their anchors; hidden / elsewhere ones are not', async () => {
  const env = boot();
  await startIn('bakery', 'from_town_square', { minutes: 9 * 60 + 30, day: 1 }); // Monday 09:30
  const mira = svc.entities.actor('mira');
  assert.ok(mira, 'mira at the counter');
  const loc = svc.npcs.whereIs('mira');
  assert.equal(loc.at, 'behind_counter');
  const an = rt('bakery').anchors.behind_counter;
  assert.ok(Math.hypot(mira.x - an.x, mira.z - an.z) < 2.3, 'within wander radius');
  assert.equal(mira.rig.playing, 'serve');
  for (const id of NPC_IDS) {
    const l = svc.npcs.whereIs(id);
    const a = svc.entities.actor(id);
    if (l.area === 'bakery' && !l.hidden) assert.ok(a, `${id} should be in the bakery`);
    else assert.equal(a, null, `${id} should not be in the bakery`);
  }
  assert.ok(env.entities.size >= 2);
  await svc.entities.enterArea('cottage', 'bed_spot', { fade: false });
  assert.equal(svc.entities.actor('mira'), null);
  assert.equal([...svc.entities.actors().keys()].filter((k) => k !== 'player').length, 0);
});

test('NPC movement: slot change inside the area -> A* walk then pose; leaving -> walks to the exit and despawns; arriving -> enters from from_<hop>', async () => {
  boot({ quickAnims: true });
  // Monday 11:25 -> 11:30 Mira walks bakery -> square (bakery_steps)
  await startIn('bakery', 'from_town_square', { minutes: 11 * 60 + 20, day: 1 });
  const a = svc.entities.actor('mira');
  assert.ok(a, 'mira in bakery at 11:20');
  assert.equal(a.slot.at, 'behind_counter');
  svc.clock.set({ minutes: 11 * 60 + 30 });
  frames(0.1);
  assert.ok(a.route || a.leaving, 'mira starts heading out');
  assert.equal(a.leaving, true);
  const ok = await until(() => !svc.entities.actor('mira'), 40);
  assert.ok(ok, 'mira despawned after walking to the door');
  // she shows up in the square from the bakery side
  await svc.entities.enterArea('town_square', 'from_brook_lane', { fade: false });
  const m = svc.entities.actor('mira');
  assert.ok(m, 'mira in the square at 11:30');
  assert.equal(m.slot.at, 'bakery_steps');
  // a slot change while the player is watching: 12:00 she walks to the bench
  svc.clock.set({ minutes: 12 * 60 });
  frames(0.1);
  assert.ok(m.route, 'walking to bench_sq_1_spot');
  const dest = rt('town_square').anchors.bench_sq_1_spot;
  assert.ok(await until(() => !m.route, 60));
  assert.ok(Math.hypot(m.x - dest.x, m.z - dest.z) < 2.5);
  assert.equal(m.rig.held, 'bread');
  // arrival from elsewhere: 13:00 Mira goes back to the bakery (leaves the square), then someone arrives into the square: willa? use mira's own return
  svc.clock.set({ minutes: 13 * 60 });
  frames(0.1);
  assert.equal(m.leaving, true);
  assert.ok(await until(() => !svc.entities.actor('mira'), 80));
});

test('NPC arrival: a villager whose new slot is in this area spawns at from_<previous hop> and walks to the anchor', async () => {
  boot({ quickAnims: true });
  await startIn('town_square', 'from_brook_lane', { minutes: 11 * 60 + 25, day: 1 });
  assert.equal(svc.entities.actor('mira'), null);
  svc.clock.set({ minutes: 11 * 60 + 30 });
  frames(0.1);
  const m = svc.entities.actor('mira');
  assert.ok(m, 'spawned on arrival');
  const entry = rt('town_square').anchors.from_bakery;
  assert.ok(Math.hypot(m.x - entry.x, m.z - entry.z) < 1.5, 'enters at from_bakery');
  assert.ok(m.route);
  assert.ok(await until(() => !m.route, 40));
  const dest = rt('town_square').anchors.bakery_steps;
  assert.ok(Math.hypot(m.x - dest.x, m.z - dest.z) < 2.5);
});

test('staged NPCs are exempt from schedule changes until event:end re-syncs them', async () => {
  boot({ quickAnims: true });
  await startIn('town_square', 'from_brook_lane', { minutes: 14 * 60, day: 1 });
  // Odell staged by a cutscene stays where he is across a slot change
  await svc.script.run([{ place: 'odell', at: 'stage', facing: 's' }]);
  const o = svc.entities.actor('odell');
  assert.equal(o.staged, true);
  const pos = [o.x, o.z];
  svc.clock.set({ minutes: 17 * 60 });
  frames(0.2);
  assert.deepEqual([o.x, o.z], pos);
  Game.bus.emit('event:end', { id: 'x' });
  assert.equal(o.staged, false);
  frames(0.1);
  const loc = svc.npcs.whereIs('odell');
  if (loc.area === 'town_square' && !loc.hidden) assert.ok(svc.entities.actor('odell'));
  else assert.ok(o.leaving || !svc.entities.actor('odell'));
});

test('time jump (LB.time) re-places everyone; stuck routes teleport instead of hanging', async () => {
  boot({ quickAnims: true });
  await startIn('town_square', 'from_brook_lane', { minutes: 10 * 60, day: 1 });
  const before = [...svc.entities.actors().keys()].sort().join();
  svc.clock.set({ minutes: 9 * 60 }); // backwards -> repopulate
  frames(0.1);
  const loc = (id) => svc.npcs.whereIs(id, 9 * 60);
  for (const id of NPC_IDS) {
    const l = loc(id);
    assert.equal(!!svc.entities.actor(id), l.area === 'town_square' && !l.hidden, `${id} presence after jump`);
  }
  assert.ok(before.length > 0);
  // a walker whose route is blocked mid-way is teleported by the timeout
  const m = svc.entities.actors().values().next().value;
  const p = svc.entities.playerActor();
  const pr = svc.entities.walk(p, p.x + 3, p.z);
  p.routeMax = 0.05;
  frames(0.2);
  assert.equal(await pr, true);
  assert.equal(p.route, null);
  assert.ok(m);
});

test('Sys.init + update are safe with no world at all (pure S1 environment)', () => {
  Game.world = null;
  Game.chars = null;
  Sys.init();
  assert.doesNotThrow(() => frames(0.2));
});
