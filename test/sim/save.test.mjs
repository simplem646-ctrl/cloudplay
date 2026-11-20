import test from 'node:test';
import assert from 'node:assert/strict';
import { SAVE_PREFIX, SAVE_VERSION } from '../../src/core/constants.js';
import {
  write, read, list, autosave, settings, meta, migrate, createMemoryStorage, slotName, recordEnding, recordBest,
  summarize, mapLabel, MIGRATIONS, SLOTS,
} from '../../src/sim/save.js';
import { delete as del } from '../../src/sim/save.js';
import { createNewGame, validateState } from '../../src/sim/state.js';
import { fresh, named } from './_helpers.mjs';

const mk = () => ({ storage: createMemoryStorage(), fallback: createMemoryStorage() });

test('slot names and keys', () => {
  assert.equal(slotName(1), 'slot1');
  assert.equal(slotName('slot3'), 'slot3');
  assert.equal(slotName('auto'), 'auto');
  assert.equal(slotName(4), null);
  assert.equal(slotName('x'), null);
  assert.deepEqual(SLOTS, ['auto', 'slot1', 'slot2', 'slot3']);
});

test('write/read roundtrip with summary, list, delete, bus event', () => {
  const f = fresh({ season: 'autumn', day: 9, minute: 15 * 60 + 5 });
  const s = mk();
  f.state.player.map = 'cafe_lantern';
  f.state.romance.partner = 'nina';
  f.state.meta.playSeconds = 3725.8;
  const w = write(f.state, 2, { ...s, bus: f.bus, now: 1234 });
  assert.equal(w.ok, true);
  assert.equal(w.slot, 'slot2');
  assert.equal(w.summary.location, 'The Lantern Cafe');
  assert.equal(w.summary.time, '15:05');
  assert.equal(w.summary.partner, 'nina');
  assert.equal(w.summary.partnerName, 'Nina');
  assert.equal(w.summary.playSeconds, 3725);
  assert.equal(w.summary.weekday, 'Tue');
  assert.ok(s.storage.getItem(`${SAVE_PREFIX}:slot2`));
  assert.equal(named(f.events, 'save:written').length, 1);
  assert.equal(f.state.meta.slot, 'slot2');
  assert.equal(f.state.meta.lastSavedAt, 1234);
  const r = read('slot2', s);
  assert.equal(r.ok, true);
  assert.deepEqual(r.state, f.state);
  assert.equal(r.savedAt, 1234);
  assert.equal(r.migrated, false);
  const l = list(s);
  assert.deepEqual(l.map((e) => [e.slot, e.empty]), [['auto', true], ['slot1', true], ['slot2', false], ['slot3', true]]);
  assert.equal(l[2].summary.season, 'autumn');
  assert.equal(del('slot2', s), true);
  assert.equal(read('slot2', s).error, 'empty');
  assert.equal(del('bogus', s), false);
  assert.equal(write(f.state, 'bogus', s).ok, false);
  assert.equal(read(9, s).error, 'bad_slot');
});

test('autosave goes to slot auto and does not touch meta.slot', () => {
  const f = fresh();
  const s = mk();
  const r = autosave(f.state, s);
  assert.equal(r.slot, 'auto');
  assert.equal(f.state.meta.slot, null);
  assert.ok(s.storage.getItem(`${SAVE_PREFIX}:auto`));
  assert.equal(read('auto', s).ok, true);
});

test('corrupt, invalid and too-new saves never throw', () => {
  const s = mk();
  s.storage.setItem(`${SAVE_PREFIX}:slot1`, '{not json');
  assert.equal(read(1, s).error, 'corrupt');
  assert.deepEqual(list(s)[1], { slot: 'slot1', empty: false, corrupt: true, summary: null, savedAt: null });
  s.storage.setItem(`${SAVE_PREFIX}:slot1`, JSON.stringify({ v: 1, state: { time: { year: 9, season: 'spring', day: 1 } } }));
  assert.equal(read(1, s).error, 'invalid');
  const st = createNewGame({ seed: 1 });
  st.version = SAVE_VERSION + 5;
  s.storage.setItem(`${SAVE_PREFIX}:slot1`, JSON.stringify({ v: 9, state: st }));
  assert.equal(read(1, s).error, 'too_new');
  s.storage.setItem(`${SAVE_PREFIX}:slot1`, '"just a string"');
  assert.equal(read(1, s).error, 'corrupt');
  assert.equal(migrate(null), null);
  assert.equal(migrate({ state: 5 }), null);
});

test('migrate: pre-version saves, missing fields are filled, existing data kept, input untouched', () => {
  const old = createNewGame({ seed: 4 });
  old.version = 0;
  old.flags.main_x = true;
  old.player.money = 123;
  delete old.daily;
  delete old.stats;
  delete old.relationships.nina;
  delete old.school.spirit;
  const snap = JSON.stringify(old);
  const m = migrate({ v: 0, state: old });
  assert.equal(JSON.stringify(old), snap, 'input not mutated');
  assert.equal(m.version, SAVE_VERSION);
  assert.equal(m.flags.main_x, true);
  assert.equal(m.player.money, 123);
  assert.deepEqual(m.daily.ate, { breakfast: false, lunch: false, dinner: false });
  assert.equal(m.school.spirit, 0);
  assert.equal(m.relationships.nina.friendship, 0);
  assert.deepEqual(validateState(m), []);
  assert.equal(m.school.club, null, 'null values stay null');
  // bare state works too and unversioned counts as 0
  const bare = createNewGame({ seed: 4 });
  delete bare.version;
  assert.equal(migrate(bare).version, SAVE_VERSION);
});

test('migrate runs chained steps in order (injected migrations)', () => {
  const order = [];
  const migrations = {
    1: (s) => { order.push('1->2'); s.renamed = s.old; delete s.old; return s; },
    2: (s) => { order.push('2->3'); s.extra = true; return s; },
  };
  const st = createNewGame({ seed: 1 });
  st.version = 1;
  st.old = 'value';
  const m = migrate(st, { migrations, targetVersion: 3 });
  assert.deepEqual(order, ['1->2', '2->3']);
  assert.equal(m.version, 3);
  assert.equal(m.renamed, 'value');
  assert.equal(m.old, undefined);
  assert.equal(m.extra, true);
  assert.equal(typeof MIGRATIONS[0], 'function');
});

test('read migrates old saves and flags it', () => {
  const s = mk();
  const st = createNewGame({ seed: 2 });
  st.version = 0;
  delete st.stats;
  s.storage.setItem(`${SAVE_PREFIX}:slot3`, JSON.stringify({ v: 0, savedAt: 5, state: st }));
  const r = read(3, s);
  assert.equal(r.ok, true);
  assert.equal(r.migrated, true);
  assert.equal(r.state.version, SAVE_VERSION);
  assert.ok(r.state.stats);
});

test('storage failures fall back to memory: throwing, absent and read-only storage', () => {
  const f = fresh();
  const boom = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('quota'); }, removeItem() { throw new Error('denied'); } };
  const fallback = createMemoryStorage();
  const w = write(f.state, 1, { storage: boom, fallback });
  assert.equal(w.ok, true);
  assert.equal(w.fallback, true);
  assert.equal(read(1, { storage: boom, fallback }).ok, true);
  assert.equal(list({ storage: boom, fallback })[1].empty, false);
  assert.equal(del(1, { storage: boom, fallback }), true);
  assert.equal(read(1, { storage: boom, fallback }).error, 'empty');
  // storage: null = memory only; default (no localStorage in Node) also works
  const fb2 = createMemoryStorage();
  assert.equal(write(f.state, 2, { storage: null, fallback: fb2 }).ok, true);
  assert.equal(read(2, { storage: null, fallback: fb2 }).ok, true);
  assert.equal(typeof globalThis.localStorage, 'undefined');
  assert.equal(write(f.state, 3, { fallback: fb2 }).ok, true);
  assert.equal(read(3, { fallback: fb2 }).ok, true);
  // both stores broken: reports failure instead of throwing
  const bad = write(f.state, 1, { storage: boom, fallback: boom });
  assert.equal(bad.ok, false);
  assert.equal(read(1, { storage: boom, fallback: boom }).ok, false);
  assert.ok(Array.isArray(list({ storage: boom, fallback: boom })));
});

test('settings and meta: defaults, merge, persistence, resilience', () => {
  const s = mk();
  const d = settings(undefined, s);
  assert.equal(d.keyHints, true);
  assert.equal(typeof d.musicVolume, 'number');
  const u = settings({ musicVolume: 0.2 }, s);
  assert.equal(u.musicVolume, 0.2);
  assert.equal(settings(undefined, s).musicVolume, 0.2);
  assert.ok(s.storage.getItem(`${SAVE_PREFIX}:settings`));
  assert.deepEqual(meta(undefined, s), { endingsSeen: [], bestRecords: {}, plays: 0 });
  recordEnding('main_saved', s);
  recordEnding('main_saved', s);
  recordEnding('nina_partner', s);
  assert.deepEqual(meta(undefined, s).endingsSeen, ['main_saved', 'nina_partner']);
  assert.equal(recordBest('track', 12.5, { ...s, lowerIsBetter: true }), true);
  assert.equal(recordBest('track', 13, { ...s, lowerIsBetter: true }), false);
  assert.equal(recordBest('track', 11, { ...s, lowerIsBetter: true }), true);
  assert.equal(meta(undefined, s).bestRecords.track, 11);
  s.storage.setItem(`${SAVE_PREFIX}:settings`, 'garbage');
  assert.equal(settings(undefined, s).keyHints, true);
  const boom = { getItem() { throw new Error('x'); }, setItem() { throw new Error('x'); }, removeItem() { throw new Error('x'); } };
  assert.equal(settings({ textSpeed: 3 }, { storage: boom, fallback: createMemoryStorage() }).textSpeed, 3);
});

test('summarize / mapLabel', () => {
  const st = createNewGame({ seed: 1 });
  const sm = summarize(st);
  assert.deepEqual([sm.year, sm.season, sm.day, sm.time, sm.location], [1, 'spring', 1, '06:30', "Theo's Room"]);
  assert.equal(mapLabel('town_square'), 'Bell Square');
  assert.equal(mapLabel('some_new_map'), 'Some New Map');
});
