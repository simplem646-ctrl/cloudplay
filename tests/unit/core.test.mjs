import test from 'node:test';
import assert from 'node:assert/strict';

import { EventBus } from '../../src/core/bus.js';
import * as U from '../../src/core/util.js';
import * as S from '../../src/core/state.js';
import { InputController } from '../../src/core/input.js';
import { Game } from '../../src/core/game.js';
import { EVT } from '../../src/core/events.js';
import { nullAudio, nullPortraits } from '../../src/core/nulls.js';
import {
  AREAS, AREA_IDS, AREA_MUSIC, NPC_IDS, MUSIC_TRACKS, WEEKDAYS,
  areaAnchorNames, areaTransitionIds, areaInteractables, lampIds, forageIds, fishingIds,
} from '../../src/core/registry.js';

const dup = (arr) => arr.filter((x, i) => arr.indexOf(x) !== i);

// ---------- bus ----------
test('bus: on/emit/off/once, unsubscribe fn, handler errors are isolated', () => {
  const bus = new EventBus();
  const got = [];
  const off = bus.on('a', (p) => got.push(['x', p]));
  bus.once('a', (p) => got.push(['once', p]));
  bus.on('a', () => { throw new Error('boom'); });
  bus.on('a', (p) => got.push(['y', p]));
  const origErr = console.error;
  console.error = () => {};
  try {
    bus.emit('a', 1);
    bus.emit('a', 2);
  } finally {
    console.error = origErr;
  }
  assert.deepEqual(got, [['x', 1], ['once', 1], ['y', 1], ['x', 2], ['y', 2]]);
  off();
  bus.emit('a', 3);
  assert.equal(got.length, 5 + 1); // only 'y' added
  assert.equal(bus.listenerCount('nothing'), 0);
});

test('Game.setMode emits mode:change and ignores no-ops; params safe in Node', () => {
  const seen = [];
  const off = Game.bus.on(EVT.MODE_CHANGE, (e) => seen.push(e));
  Game.setMode('title');
  Game.setMode('title');
  Game.setMode('field');
  off();
  assert.deepEqual(seen, [{ from: 'boot', to: 'title' }, { from: 'title', to: 'field' }]);
  assert.ok(Game.isMode('field', 'menu'));
  assert.throws(() => Game.setMode('nope'));
  assert.ok(Game.params instanceof URLSearchParams);
  assert.equal(Game.now(), null);
  Game.setMode('boot');
});

// ---------- util ----------
test('util: time formatting', () => {
  assert.equal(U.parseHHMM('06:00'), 360);
  assert.equal(U.parseHHMM('26:00'), 1560);
  assert.equal(U.formatHHMM(1560), '26:00');
  assert.equal(U.formatHHMM(365), '06:05');
  assert.equal(U.formatClock12(360), '6:00 AM');
  assert.equal(U.formatClock12(720), '12:00 PM');
  assert.equal(U.formatClock12(1440), '12:00 AM');
  assert.equal(U.formatClock12(1560), '2:00 AM');
  assert.equal(U.formatClock12(1005), '4:45 PM');
  assert.ok(U.timeInRange(400, '06:00', '07:00'));
  assert.ok(!U.timeInRange(420, '06:00', '07:00'));
  assert.ok(U.timeInRange(1500, '24:00', '26:00'));
  assert.throws(() => U.parseHHMM('nope'));
});

test('util: dayNumber / fromDayNumber roundtrip over a full year and beyond', () => {
  assert.equal(U.dayNumber({ year: 1, season: 0, day: 1 }), 1);
  assert.equal(U.dayNumber({ year: 2, season: 0, day: 1 }), 113);
  for (let n = 1; n <= 112 * 2 + 5; n++) {
    const t = U.fromDayNumber(n);
    assert.ok(t.day >= 1 && t.day <= 28 && t.season >= 0 && t.season <= 3);
    assert.equal(U.dayNumber(t), n);
  }
  assert.equal(S.dayNumber({ year: 1, season: 3, day: 24 }), 112 - 28 + 24);
});

test('util: weekday cycle, season names, formatDate', () => {
  assert.equal(U.weekdayName(1), 'mon');
  assert.equal(U.weekdayName(7), 'sun');
  assert.equal(U.weekdayName(8), 'mon');
  assert.equal(U.weekdayName(28), 'sun');
  for (let d = 1; d <= 28; d++) assert.equal(U.weekdayName(d), WEEKDAYS[(d - 1) % 7]);
  assert.equal(U.seasonName(2), 'autumn');
  assert.equal(U.formatDate({ season: 0, day: 1 }), 'Spring 1 (Mon)');
  assert.equal(U.formatDate({ season: 3, day: 24 }), 'Winter 24 (Wed)');
});

test('util: seeded rng is deterministic; helpers behave', () => {
  const a = U.mulberry32(42);
  const b = U.mulberry32(42);
  const sa = Array.from({ length: 5 }, a);
  assert.deepEqual(sa, Array.from({ length: 5 }, b));
  assert.ok(sa.every((v) => v >= 0 && v < 1));
  assert.notDeepEqual(sa, Array.from({ length: 5 }, U.mulberry32(43)));
  assert.equal(U.hashString('abc'), U.hashString('abc'));
  assert.notEqual(U.hashString('abc'), U.hashString('abd'));
  assert.equal(U.rngFor('forage', 5, 'x')(), U.mulberry32(U.hashString('forage|5|x'))());
  const items = ['a', 'b', 'c', 'd'];
  assert.deepEqual(U.shuffle(items, U.mulberry32(7)), U.shuffle(items, U.mulberry32(7)));
  assert.deepEqual(items, ['a', 'b', 'c', 'd']);
  const r = U.mulberry32(1);
  for (let i = 0; i < 50; i++) assert.equal(U.weightedPick([{ w: 0, v: 'no' }, { w: 5, v: 'yes' }], (x) => x.w, r).v, 'yes');
  assert.ok(items.includes(U.pick(items, U.mulberry32(3))));
});

test('util: directions and math', () => {
  for (const d of ['n', 'e', 's', 'w']) assert.equal(U.yawToDir(U.dirToYaw(d)), d);
  assert.equal(U.dirToYaw('s'), 0);
  assert.equal(U.vecToDir(0, 1), 's');
  assert.equal(U.vecToDir(-3, 1), 'w');
  assert.deepEqual(U.dirVec('n'), { x: 0, z: -1 });
  assert.equal(U.clamp(5, 0, 1), 1);
  assert.equal(U.lerp(0, 10, 0.5), 5);
  assert.equal(U.invLerp(0, 10, 5), 0.5);
  assert.equal(U.smoothstep(0, 1, 0.5), 0.5);
  assert.ok(Math.abs(U.easeOutBack(1) - 1) < 1e-9);
  assert.equal(U.damp(0, 10, 100, 1) > 9.99, true);
  const o = U.once(() => ({}));
  assert.equal(o(), o());
  const c = U.deepClone({ a: [1, { b: 2 }] });
  assert.deepEqual(c, { a: [1, { b: 2 }] });
  assert.ok(U.isPlainObject({}) && !U.isPlainObject([]) && !U.isPlainObject(null));
});

// ---------- state ----------
function fakeStorage({ throws = false } = {}) {
  const m = new Map();
  return {
    getItem: (k) => { if (throws) throw new Error('denied'); return m.has(k) ? m.get(k) : null; },
    setItem: (k, v) => { if (throws) throw new Error('quota'); m.set(k, String(v)); },
    removeItem: (k) => { if (throws) throw new Error('denied'); m.delete(k); },
    _m: m,
  };
}

test('state: default state shape', () => {
  const s = S.defaultState({ name: 'Rin' });
  assert.equal(s.version, S.SAVE_VERSION);
  assert.equal(s.meta.name, 'Rin');
  assert.deepEqual(Object.keys(s.rel).sort(), [...NPC_IDS].sort());
  for (const id of NPC_IDS) assert.deepEqual(s.rel[id], { aff: 0, met: false, talkedDay: -1, giftDay: -1, giftWeek: -1, giftsThisWeek: 0, status: 'none', seen: {} });
  assert.equal(s.inventory.slots.length, s.inventory.capacity);
  assert.ok(s.inventory.slots.every((x) => x === null));
  assert.equal(s.player.money, 300);
  assert.deepEqual(s.time, { year: 1, season: 0, day: 1, minutes: 360 });
  assert.equal(S.defaultState().meta.name, 'Kai');
});

test('state: save/load roundtrip, slots, delete, export/import, settings', () => {
  globalThis.localStorage = fakeStorage();
  S._resetStorage();
  try {
    assert.ok(S.saveSlots().every((x) => x.empty));
    const st = S.defaultState({ name: 'Mo' });
    st.player.money = 777;
    st.story.lanterns = 2;
    st.flags.hello = { a: 1 };
    assert.deepEqual(S.saveToSlot(2, st), { ok: true });
    assert.equal(S.storageOK, true);
    assert.ok(globalThis.localStorage.getItem('lanternbrook.v1.save.2'));
    const back = S.loadFromSlot(2);
    assert.deepEqual(back, st);
    const slots = S.saveSlots();
    assert.equal(slots[2].empty, false);
    assert.equal(slots[2].meta.name, 'Mo');
    assert.equal(slots[2].meta.money, 777);
    assert.equal(slots[2].meta.lanterns, 2);
    assert.match(slots[2].meta.dateLabel, /Spring 1 \(Mon\)/);
    assert.equal(S.loadFromSlot(1), null);
    assert.equal(S.saveToSlot(9, st).ok, false);
    // export -> import into another slot
    const text = S.exportSave(2);
    assert.deepEqual(S.importSave(3, text), { ok: true });
    assert.equal(S.loadFromSlot(3).player.money, 777);
    assert.equal(S.importSave(3, 'garbage').ok, false);
    assert.equal(S.importSave(3, JSON.stringify({ version: 99, meta: {}, time: {}, player: {} })).ok, false);
    S.deleteSlot(2);
    assert.equal(S.loadFromSlot(2), null);
    // corrupt data -> null, not a throw
    globalThis.localStorage.setItem('lanternbrook.v1.save.1', '{not json');
    assert.equal(S.loadFromSlot(1), null);
    // settings
    assert.equal(S.loadSettings().textSpeed, 'normal');
    S.saveSettings({ ...S.loadSettings(), music: 0.1 });
    assert.equal(S.loadSettings().music, 0.1);
    // older saves get backfilled
    const old = S.defaultState();
    delete old.rel.mira;
    delete old.tutorial;
    globalThis.localStorage.setItem('lanternbrook.v1.save.1', JSON.stringify(old));
    const fixed = S.loadFromSlot(1);
    assert.ok(fixed.rel.mira && fixed.tutorial);
  } finally {
    delete globalThis.localStorage;
    S._resetStorage();
  }
});

test('state: falls back to memory when storage throws or is missing', () => {
  for (const mode of ['throws', 'missing']) {
    S._resetStorage();
    if (mode === 'throws') globalThis.localStorage = fakeStorage({ throws: true });
    else delete globalThis.localStorage;
    try {
      const st = S.defaultState({ name: 'Mem' });
      assert.equal(S.saveToSlot(1, st).ok, true);
      assert.equal(S.storageOK, false);
      assert.equal(S.loadFromSlot(1).meta.name, 'Mem');
      assert.equal(S.saveSlots()[1].empty, false);
      S.saveSettings({ master: 0.2 });
      assert.equal(S.loadSettings().master, 0.2);
      S.deleteSlot(1);
      assert.equal(S.loadFromSlot(1), null);
    } finally {
      delete globalThis.localStorage;
      S._resetStorage();
    }
  }
});

// ---------- registry ----------
test('registry: neighbours reciprocal, interiors have exactly one neighbour', () => {
  for (const id of AREA_IDS) {
    const a = AREAS[id];
    for (const n of a.neighbors) {
      assert.ok(AREAS[n], `${id} -> unknown neighbour ${n}`);
      assert.ok(AREAS[n].neighbors.includes(id), `${id} <-> ${n} not reciprocal`);
    }
    assert.deepEqual(dup(a.neighbors), [], `${id} duplicate neighbours`);
    if (a.kind === 'interior') assert.equal(a.neighbors.length, 1, `${id} interior must have exactly one neighbour`);
  }
});

test('registry: no duplicate anchors / transitions / interactables; every area has music', () => {
  const codes = AREA_IDS.map((i) => AREAS[i].code);
  assert.deepEqual(dup(codes), []);
  for (const id of AREA_IDS) {
    assert.deepEqual(dup(areaAnchorNames(id)), [], `${id} anchors`);
    assert.deepEqual(dup(areaTransitionIds(id)), [], `${id} transitions`);
    const ints = [...Object.keys(AREAS[id].singles || {}), ...lampIds(id), ...forageIds(id), ...fishingIds(id)];
    assert.deepEqual(dup(ints), [], `${id} interactables`);
    assert.equal(Object.keys(areaInteractables(id)).length, ints.length);
    assert.ok(AREA_MUSIC[id], `${id} has no music`);
  }
  const all = AREA_IDS.flatMap((i) => Object.keys(areaInteractables(i)));
  assert.deepEqual(dup(all), [], 'interactable ids unique across areas');
  // music resolves to a known track or the town_<season>/night family
  for (const m of Object.values(AREA_MUSIC)) assert.ok(MUSIC_TRACKS.includes(m) || m === 'town', m);
});

// ---------- input ----------
const ev = (key, extra = {}) => ({ key, preventDefault() { this.prevented = true; }, target: null, ...extra });

test('input: virtual axis is normalised and clamped to the unit circle', () => {
  const inp = new InputController();
  inp.setVirtualAxis(1, 1);
  const a = inp.axis();
  assert.ok(Math.abs(Math.hypot(a.x, a.y) - 1) < 1e-9);
  inp.setVirtualAxis(0.3, 0);
  assert.deepEqual(inp.axis(), { x: 0.3, y: 0 });
  inp.setVirtualAxis(5, 0);
  assert.deepEqual(inp.axis(), { x: 1, y: 0 });
  inp.setVirtualAxis(0, 0);
  inp.setVirtual('right', true);
  inp.setVirtual('down', true);
  const d = inp.axis();
  assert.ok(Math.abs(d.x - Math.SQRT1_2) < 1e-9 && Math.abs(d.y - Math.SQRT1_2) < 1e-9);
  assert.ok(inp.held('right'));
  inp.setVirtual('right', false);
  inp.setVirtual('down', false);
  assert.deepEqual(inp.axis(), { x: 0, y: 0 });
});

test('input: keyboard mapping, edges, contextual Esc/M, preventDefault, lock', () => {
  const inp = new InputController();
  let mode = 'field';
  inp.modeProvider = () => mode;
  const presses = [];
  inp.onPress((a) => { presses.push(a); });
  const space = ev(' ');
  inp.handleKeyDown(space);
  assert.ok(space.prevented);
  assert.ok(inp.pressed('confirm') && inp.held('confirm'));
  inp.endFrame();
  assert.ok(!inp.pressed('confirm') && inp.held('confirm'));
  inp.handleKeyUp(ev(' '));
  assert.ok(!inp.held('confirm'));
  const arrow = ev('ArrowLeft');
  inp.handleKeyDown(arrow);
  assert.ok(arrow.prevented);
  inp.handleKeyDown(ev('w'));
  const ax = inp.axis();
  assert.ok(ax.x < 0 && ax.y < 0 && Math.abs(Math.hypot(ax.x, ax.y) - 1) < 1e-9);
  inp.handleKeyUp(ev('ArrowLeft'));
  inp.handleKeyUp(ev('w'));
  inp.handleKeyDown(ev('Escape'));
  inp.handleKeyDown(ev('m'));
  mode = 'menu';
  inp.handleKeyUp(ev('Escape'));
  inp.handleKeyUp(ev('m'));
  inp.handleKeyDown(ev('Escape'));
  inp.handleKeyDown(ev('m'));
  assert.deepEqual(presses.slice(-4), ['menu', 'map', 'cancel', 'cancel']);
  // typing in a text field is ignored and not prevented
  const typed = ev(' ', { target: { tagName: 'INPUT' } });
  const n = presses.length;
  inp.handleKeyDown(typed);
  assert.equal(presses.length, n);
  assert.ok(!typed.prevented);
  // lock
  inp.releaseAll();
  inp.setVirtual('up', true);
  inp.lock(true);
  assert.ok(!inp.held('up') && !inp.pressed('up'));
  assert.deepEqual(inp.axis(), { x: 0, y: 0 });
  const m2 = presses.length;
  inp.handleKeyDown(ev('z'));
  assert.equal(presses.length, m2);
  inp.lock(false);
  assert.ok(inp.held('up'));
});

test('input: direction key-repeat after 350ms then every 180ms; consume stops pressed()', () => {
  const inp = new InputController();
  const got = [];
  inp.onPress((a) => { got.push(a); });
  inp.handleKeyDown(ev('ArrowDown'));
  const t0 = performance.now();
  inp.poll(t0 + 100);
  assert.equal(got.length, 1);
  inp.poll(t0 + 400);
  assert.equal(got.length, 2);
  inp.poll(t0 + 500);
  assert.equal(got.length, 2);
  inp.poll(t0 + 600);
  assert.equal(got.length, 3);
  inp.handleKeyUp(ev('ArrowDown'));
  inp.poll(t0 + 2000);
  assert.equal(got.length, 3);

  const c = new InputController();
  c.onPress(() => true);
  c.setVirtual('confirm', true);
  assert.ok(!c.pressed('confirm'));
});

test('nulls implement the full audio/portraits surface', async () => {
  for (const n of ['init', 'unlock', 'playMusic', 'stopMusic', 'playSfx', 'blip', 'footstep', 'setAmbience', 'setVolume', 'setMuted', 'duckMusic']) assert.equal(typeof nullAudio[n], 'function', n);
  assert.equal(nullPortraits.hasPortrait('mira'), false);
  assert.equal(nullPortraits.getPortrait('mira'), null);
  await nullPortraits.preload();
  assert.equal(Game.audio, nullAudio);
  assert.equal(Game.portraits, nullPortraits);
});
