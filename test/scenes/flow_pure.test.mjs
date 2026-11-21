import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveAnchorRef, findFreeTile, nearestDoor, walkableTile } from '../../src/scenes/anchors.js';
import { wantedTarget, walkMinutes, outfitSlotFor, playerSlotFor, kindOf, displayName } from '../../src/scenes/npc_plan.js';
import { TriggerGate, TriggerQueue } from '../../src/scenes/triggers.js';
import { nightFactor, weatherPlan, ambiencePlan, musicPlan, stepSfx } from '../../src/scenes/presentation.js';
import { forcedSleepDirector, energyCollapseDirector } from '../../src/scenes/directors.js';

const mkMap = (w = 8, h = 6, blocked = []) => {
  const collision = new Uint8Array(w * h);
  for (const [x, y] of blocked) collision[y * w + x] = 1;
  return {
    width: w, height: h, collision,
    anchors: { entrance: { x: 1, y: 1, dir: 'down' }, spot_a: { x: 4, y: 3, dir: 'up' } },
    warps: [{ x: 0, y: 2, w: 1, h: 2, to: 'x:y' }],
  };
};

test('anchor refs: current map, global and tile objects; missing anchors fall back', () => {
  const maps = { town: mkMap(), home: mkMap() };
  const get = (id) => { if (!maps[id]) throw new Error('no map'); return maps[id]; };
  assert.deepEqual(resolveAnchorRef('spot_a', 'town', get), { map: 'town', x: 4, y: 3, dir: 'up', name: 'spot_a', fallback: false });
  assert.equal(resolveAnchorRef('home:entrance', 'town', get).map, 'home');
  assert.deepEqual(resolveAnchorRef({ x: 2, y: 2 }, 'town', get), { map: 'town', x: 2, y: 2, dir: 'down', name: null, fallback: false });
  const fb = resolveAnchorRef('nope', 'town', get);
  assert.equal(fb.fallback, true);
  assert.equal(fb.name, 'entrance');
  assert.throws(() => resolveAnchorRef('missing_map:entrance', 'town', get));
});

test('findFreeTile offsets an actor that lands on an occupied tile', () => {
  const m = mkMap(8, 6, [[4, 2]]);
  assert.deepEqual(findFreeTile(m, 4, 3, new Set()), { x: 4, y: 3 });
  const t = findFreeTile(m, 4, 3, new Set(['4,3']));
  assert.notDeepEqual(t, { x: 4, y: 3 });
  assert.ok(Math.abs(t.x - 4) + Math.abs(t.y - 3) === 1);
  assert.ok(walkableTile(m, t.x, t.y));
  assert.notDeepEqual(t, { x: 4, y: 2 }); // blocked tile is never chosen
  // never a warp tile
  const near = findFreeTile(m, 0, 2, new Set());
  assert.ok(!(near.x === 0 && (near.y === 2 || near.y === 3)));
  // many NPCs on one anchor all get distinct tiles
  const occ = new Set(); const got = new Set();
  for (let i = 0; i < 6; i++) { const f = findFreeTile(m, 4, 3, occ); occ.add(`${f.x},${f.y}`); got.add(`${f.x},${f.y}`); }
  assert.equal(got.size, 6);
});

test('nearestDoor picks the closest walkable warp tile', () => {
  assert.deepEqual(nearestDoor(mkMap(), 3, 3), { x: 0, y: 3 });
  assert.equal(nearestDoor({ ...mkMap(), warps: [] }, 1, 1), null);
});

test('wantedTarget: stay, leave, and start walking early to arrive on time', () => {
  const r = { map: 'town', anchor: 'a', dir: 'left', activity: null, nextPoint: { minute: 500, map: 'town', anchor: 'b', dir: 'up', activity: null } };
  assert.equal(wantedTarget(r, 'town', 400).ref, 'town:a');
  assert.equal(wantedTarget(r, 'home', 400).kind, 'away');
  assert.equal(wantedTarget(null, 'town', 400).kind, 'away');
  const lead = () => 6;
  assert.equal(wantedTarget(r, 'town', 480, lead).ref, 'town:a'); // 20 min left: stay
  const early = wantedTarget(r, 'town', 495, lead);
  assert.equal(early.ref, 'town:b');
  assert.equal(early.early, true);
  const leaving = { map: 'town', anchor: 'a', nextPoint: { minute: 500, map: 'home', anchor: 'x' } };
  assert.equal(wantedTarget(leaving, 'town', 497, lead).kind, 'away');
  assert.equal(walkMinutes(35) >= 8, true);
});

test('outfit slots follow the context', () => {
  const school = { isSchoolDay: true };
  assert.equal(outfitSlotFor({ id: 'nina', minute: 9 * 60, mapId: 'school_classroom', info: school }), 'school');
  assert.equal(outfitSlotFor({ id: 'nina', minute: 18 * 60, mapId: 'town_square', info: school }), 'casual');
  assert.equal(outfitSlotFor({ id: 'nina', minute: 9 * 60, mapId: 'town_square', info: { isSchoolDay: false } }), 'casual');
  assert.equal(outfitSlotFor({ id: 'nina', activity: 'sport', info: school }), 'sport');
  assert.equal(outfitSlotFor({ id: 'student_03', minute: 8 * 60 + 30, mapId: 'school_grounds', info: school }), 'school');
  assert.equal(outfitSlotFor({ id: 'townie_02', minute: 12 * 60, mapId: 'town_square', info: school }), 'casual');
  assert.equal(kindOf('biscuit'), 'animal');
  assert.equal(displayName('nina'), 'Nina');
  assert.equal(playerSlotFor({ mapId: 'home_theo', minute: 6 * 60 + 30 }), 'sleep');
  assert.equal(playerSlotFor({ mapId: 'town_square', minute: 8 * 60, info: { isSchoolDay: true, hasLessons: true } }), 'school');
  assert.equal(playerSlotFor({ outfit: 'swim', mapId: 'beach' }), 'swim');
});

test('trigger gate: auto once a second while idle, cool-down after an event', () => {
  const g = new TriggerGate({ autoEvery: 1, cooldown: 2 });
  g.update(0.5, true); assert.equal(g.takeAuto(), false);
  g.update(0.6, true); assert.equal(g.takeAuto(), true);
  assert.equal(g.takeAuto(), false);
  g.update(1.2, false); assert.equal(g.takeAuto(), false); // not idle: no accumulation
  g.eventEnded();
  assert.equal(g.canAsk(), false);
  g.update(1.9, true); assert.equal(g.canAsk(), false);
  g.update(0.2, true); assert.equal(g.canAsk(), true);
  g.update(1.1, true); assert.equal(g.takeAuto(), true);
});

test('trigger queue de-duplicates pending asks', () => {
  const q = new TriggerQueue();
  assert.equal(q.push({ type: 'enterMap', map: 'a' }), true);
  assert.equal(q.push({ type: 'enterMap', map: 'a' }), false);
  assert.equal(q.push({ type: 'wake' }), true);
  assert.equal(q.length, 2);
  assert.deepEqual(q.shift(), { type: 'enterMap', map: 'a' });
});

test('presentation rules: night, weather, ambience, music, steps', () => {
  assert.equal(nightFactor(12 * 60), 0);
  assert.equal(nightFactor(22 * 60), 1);
  assert.ok(nightFactor(18 * 60 + 30) > 0 && nightFactor(18 * 60 + 30) < 1);
  assert.deepEqual(weatherPlan({ outdoor: false, weather: 'rain' }), { kind: null, intensity: 0, fireflies: 0 });
  assert.equal(weatherPlan({ outdoor: true, weather: 'rain' }).kind, 'rain');
  assert.equal(weatherPlan({ outdoor: true, weather: 'sunny', season: 'spring' }).kind, 'petals');
  assert.ok(weatherPlan({ outdoor: true, weather: 'sunny', season: 'summer', minute: 22 * 60 }).fireflies > 0);
  assert.equal(ambiencePlan({ outdoor: true, mapAmbience: 'waves' }), 'waves');
  assert.equal(ambiencePlan({ outdoor: true, weather: 'snow' }), 'snow_wind');
  assert.equal(ambiencePlan({ outdoor: false }), null);
  assert.equal(musicPlan({ hint: 'town', season: 'autumn', minute: 12 * 60 }), 'town_autumn');
  assert.equal(musicPlan({ hint: 'town', minute: 22 * 60 }), 'town_night');
  assert.equal(musicPlan({ hint: 'school', inLesson: true }), 'school_class');
  assert.equal(musicPlan({ hint: 'home_morning' }), 'home_morning');
  assert.equal(musicPlan({ hint: 'nope', known: ['x'] }), null);
  assert.equal(stepSfx('wood'), 'step_wood');
  assert.equal(stepSfx(undefined), 'step_grass');
});

test('core directors: forced sleep at 02:00, collapse at 0 energy', () => {
  const game = { sim: { state: { player: { energy: 50 } } }, overworld: { forcedSleep: () => 'f', energyCollapse: () => 'c' } };
  assert.equal(forcedSleepDirector(game, { minute: 1559 }), null);
  assert.equal(forcedSleepDirector(game, { minute: 1560 }).call(), 'f');
  assert.equal(energyCollapseDirector(game, { state: game.sim.state }), null);
  game.sim.state.player.energy = 0;
  assert.equal(energyCollapseDirector(game, { state: game.sim.state }).call(), 'c');
});
