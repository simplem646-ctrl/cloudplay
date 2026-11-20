// Save / load (02 section 11). Keys: `${SAVE_PREFIX}:slot1..3`, `:auto`, `:settings`, `:meta`.
// Storage is injectable (`opts.storage` = anything with getItem/setItem/removeItem; `null` forces
// memory-only) and defaults to window.localStorage when it works. Every storage access is wrapped in
// try/catch with an in-memory fallback (`opts.fallback`, default one shared Map-backed store), so
// nothing here ever throws to the caller: functions return `{ ok: false, error }` instead.

import { bus as defaultBus } from '../core/bus.js';
import { deepClone, formatTime24, formatTime12, isObj } from '../core/util.js';
import { SAVE_PREFIX, SAVE_VERSION, WEEKDAYS } from '../core/constants.js';
import { CAST_BY_ID } from '../data/cast.js';
import { createNewGame, validateState } from './state.js';
import { BALANCE } from './balance.js';

export const SLOTS = ['auto', ...BALANCE.save.slots]; // list order for the load screen
export const AUTO_SLOT = BALANCE.save.autoSlot;

const MAP_LABELS = {
  town_square: 'Bell Square', town_harbor: 'Harbor Street', town_park: 'Heron Pond Park', beach: 'Gull Cove',
  school_grounds: 'Bellhaven High', school_field: 'Sports Field', hill_observatory: 'Lantern Hill Top',
  school_hall_1f: 'Main Hall, 1F', school_hall_2f: 'Main Hall, 2F', school_classroom: 'Class B',
  school_library: 'Library', school_cafeteria: 'Cafeteria', school_art_room: 'Art Room',
  school_music_room: 'Music Room', school_gym: 'Gymnasium', school_rooftop: 'Rooftop', bell_tower: 'Bell Tower',
  home_theo: "Theo's Room", cafe_lantern: 'The Lantern Cafe', bakery: 'Calder Bakery', flower_shop: 'Reyes Blooms',
  bookstore: 'Larkin Books', corner_mart: 'Corner Mart', clinic: 'Patel Clinic', town_hall: 'Town Hall',
  observatory_dome: 'The Little Dome',
};
/** Human-readable map name for the save list (unknown ids are prettified). */
export const mapLabel = (id) => MAP_LABELS[id] || String(id || '?').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

// ------------------------------------------------------------------ storage
/** A Map-backed object with the localStorage interface (tests, fallback). */
export function createMemoryStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => { m.set(k, String(v)); },
    removeItem: (k) => { m.delete(k); },
    key: (i) => [...m.keys()][i] ?? null,
    get length() { return m.size; },
  };
}
const SHARED_FALLBACK = createMemoryStorage();

function browserStorage() {
  try {
    const ls = globalThis.localStorage;
    if (!ls) return null;
    ls.setItem('__bd_probe', '1');
    ls.removeItem('__bd_probe');
    return ls;
  } catch {
    return null;
  }
}

/** Resilient key/value view over primary storage + memory fallback. */
export function openStore(opts = {}) {
  const primary = opts.storage === undefined ? browserStorage() : opts.storage;
  const fallback = opts.fallback || SHARED_FALLBACK;
  return {
    get(key) {
      try { if (primary) { const v = primary.getItem(key); if (v !== null && v !== undefined) return v; } } catch { /* fall through */ }
      try { return fallback.getItem(key); } catch { return null; }
    },
    set(key, value) {
      try {
        if (primary) { primary.setItem(key, value); try { fallback.removeItem(key); } catch { /* ignore */ } return { ok: true, fallback: false }; }
      } catch { /* quota / blocked: fall back to memory */ }
      try { fallback.setItem(key, value); return { ok: true, fallback: true }; } catch (e) { return { ok: false, error: String(e && e.message || e) }; }
    },
    del(key) {
      try { if (primary) primary.removeItem(key); } catch { /* ignore */ }
      try { fallback.removeItem(key); } catch { /* ignore */ }
    },
  };
}

/** Accepts 1|2|3, '1', 'slot2', 'auto' -> canonical slot name or null. */
export function slotName(slot) {
  if (slot === 'auto' || slot === 'AUTO') return AUTO_SLOT;
  const m = /^(?:slot)?([1-3])$/.exec(String(slot));
  return m ? `slot${m[1]}` : null;
}
export const keyOf = (name) => `${SAVE_PREFIX}:${name}`;

// ------------------------------------------------------------------ summary
/** What the load screen shows for a slot. */
export function summarize(state) {
  const t = state.time;
  const partner = state.romance && state.romance.partner;
  return {
    year: t.year, season: t.season, day: t.day, weekday: WEEKDAYS[(t.day - 1) % 7],
    minute: t.minute, time: formatTime24(t.minute), timeLabel: formatTime12(t.minute), absDay: t.absDay,
    map: state.player.map, location: mapLabel(state.player.map),
    playSeconds: Math.floor((state.meta && state.meta.playSeconds) || 0),
    partner: partner || null,
    partnerName: partner && CAST_BY_ID[partner] ? CAST_BY_ID[partner].short : null,
    money: state.player.money,
    club: state.school ? state.school.club : null,
  };
}

// ------------------------------------------------------------------ migration
/**
 * Upgrade steps keyed by the version they upgrade FROM (each returns the state; the runner bumps
 * `version`). Bump SAVE_VERSION in core/constants.js (lead) and add `[n]: fn` here to change the shape.
 * Purely additive fields (new optional keys) do not need a step: `fillDefaults` adds them on every load.
 */
export const MIGRATIONS = {
  0: (s) => s, // pre-versioned saves: same shape, just stamp the version
};

function fillDefaults(state, tpl) {
  for (const [k, v] of Object.entries(tpl)) {
    if (state[k] === undefined || state[k] === null) {
      if (state[k] === undefined) state[k] = deepClone(v);
    } else if (isObj(v) && isObj(state[k])) fillDefaults(state[k], v);
  }
  return state;
}

/**
 * Bring a save (an envelope `{v, state}` or a bare state object) up to the current schema.
 * Never throws: returns the migrated state (a deep copy) or null if the input is unusable.
 * opts.migrations / opts.targetVersion are injectable for tests.
 */
export function migrate(save, opts = {}) {
  try {
    const target = opts.targetVersion || SAVE_VERSION;
    const steps = opts.migrations || MIGRATIONS;
    let s = save && isObj(save) && isObj(save.state) ? save.state : save;
    if (!isObj(s) || !isObj(s.time)) return null;
    s = deepClone(s);
    let v = Number.isInteger(s.version) ? s.version : 0;
    if (v > target) return null; // written by a newer game
    while (v < target) {
      const step = steps[v];
      if (step) s = step(s) || s;
      v += 1;
      s.version = v;
    }
    const seed = s.meta && Number.isFinite(s.meta.seed) ? s.meta.seed : 1;
    fillDefaults(s, createNewGame({ seed }));
    return s;
  } catch {
    return null;
  }
}

// ------------------------------------------------------------------ slots
const now = (opts) => (opts && opts.now !== undefined ? opts.now : Date.now());

/** Write the state to a slot (1|2|3|'slot1'..|'auto'). Returns { ok, slot, summary, savedAt, fallback?, error? }. */
export function write(state, slot, opts = {}) {
  try {
    const name = slotName(slot);
    if (!name) return { ok: false, error: 'bad_slot' };
    const savedAt = now(opts);
    state.meta.lastSavedAt = savedAt;
    if (name !== AUTO_SLOT) state.meta.slot = name;
    const summary = summarize(state);
    const json = JSON.stringify({ v: SAVE_VERSION, savedAt, summary, state });
    const r = openStore(opts).set(keyOf(name), json);
    if (!r.ok) return { ok: false, slot: name, error: r.error || 'storage_failed' };
    (opts.bus || defaultBus).emit('save:written', { slot: name });
    return { ok: true, slot: name, summary, savedAt, fallback: !!r.fallback };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/** Autosave to slot 'auto' (called by clock.sleep on every new day). */
export const autosave = (state, opts = {}) => write(state, AUTO_SLOT, opts);

function parseEntry(raw) {
  if (raw === null || raw === undefined) return { empty: true };
  try {
    const e = JSON.parse(raw);
    if (!isObj(e) || !isObj(e.state)) return { corrupt: true };
    return { entry: e };
  } catch {
    return { corrupt: true };
  }
}

/**
 * Load a slot. Returns { ok, state, summary, savedAt, migrated } or { ok:false, error } with
 * error one of: bad_slot | empty | corrupt | too_new | invalid.
 */
export function read(slot, opts = {}) {
  try {
    const name = slotName(slot);
    if (!name) return { ok: false, error: 'bad_slot' };
    const p = parseEntry(openStore(opts).get(keyOf(name)));
    if (p.empty) return { ok: false, slot: name, error: 'empty' };
    if (p.corrupt) return { ok: false, slot: name, error: 'corrupt' };
    const e = p.entry;
    const from = Number.isInteger(e.state.version) ? e.state.version : 0;
    if (from > SAVE_VERSION) return { ok: false, slot: name, error: 'too_new' };
    const state = migrate(e, opts);
    if (!state) return { ok: false, slot: name, error: 'corrupt' };
    const problems = validateState(state);
    if (problems.length) return { ok: false, slot: name, error: 'invalid', problems };
    return { ok: true, slot: name, state, summary: summarize(state), savedAt: e.savedAt || null, migrated: from !== SAVE_VERSION };
  } catch (e) {
    return { ok: false, error: String(e && e.message || e) };
  }
}

/** Delete a slot. Returns true if the call was valid (idempotent). */
function del(slot, opts = {}) {
  const name = slotName(slot);
  if (!name) return false;
  openStore(opts).del(keyOf(name));
  return true;
}
export { del as delete, del as remove };

/**
 * Slot overview for the load/save screen, order: auto, slot1..3:
 * [{ slot, empty, corrupt, summary, savedAt }]. A slot with unreadable data is { empty:false, corrupt:true }.
 */
export function list(opts = {}) {
  const store = openStore(opts);
  return SLOTS.map((slot) => {
    const p = parseEntry(store.get(keyOf(slot)));
    if (p.empty) return { slot, empty: true, corrupt: false, summary: null, savedAt: null };
    if (p.corrupt) return { slot, empty: false, corrupt: true, summary: null, savedAt: null };
    return { slot, empty: false, corrupt: false, summary: p.entry.summary || summarize(migrate(p.entry) || p.entry.state), savedAt: p.entry.savedAt || null };
  });
}

// ------------------------------------------------------------------ settings & meta
function readJson(store, name) {
  try { const raw = store.get(keyOf(name)); const v = raw ? JSON.parse(raw) : null; return isObj(v) ? v : {}; } catch { return {}; }
}
function writeJson(store, name, value) {
  try { return store.set(keyOf(name), JSON.stringify(value)).ok; } catch { return false; }
}

/** Settings (volumes, text speed, key hints). `settings()` reads; `settings({ musicVolume: 0.3 })` merges and saves. Returns the merged object. */
export function settings(patch, opts = {}) {
  const store = openStore(opts);
  const cur = { ...BALANCE.save.defaultSettings, ...readJson(store, 'settings') };
  if (isObj(patch)) { Object.assign(cur, patch); writeJson(store, 'settings', cur); }
  return cur;
}

const META_DEFAULTS = () => ({ endingsSeen: [], bestRecords: {}, plays: 0 });

/** Cross-save meta (endings seen, best records). `meta()` reads; `meta(patch)` shallow-merges and saves. */
export function meta(patch, opts = {}) {
  const store = openStore(opts);
  const cur = { ...META_DEFAULTS(), ...readJson(store, 'meta') };
  if (isObj(patch)) { Object.assign(cur, patch); writeJson(store, 'meta', cur); }
  return cur;
}

/** Remember an ending id as seen (deduplicated). Returns the new meta. */
export function recordEnding(id, opts = {}) {
  const m = meta(undefined, opts);
  if (!m.endingsSeen.includes(id)) m.endingsSeen.push(id);
  return meta({ endingsSeen: m.endingsSeen }, opts);
}

/** Keep the best value per key (higher is better unless `lowerIsBetter`). Returns true if it is a new record. */
export function recordBest(key, value, { lowerIsBetter = false, ...opts } = {}) {
  const m = meta(undefined, opts);
  const old = m.bestRecords[key];
  const better = old === undefined || (lowerIsBetter ? value < old : value > old);
  if (better) meta({ bestRecords: { ...m.bestRecords, [key]: value } }, opts);
  return better;
}
