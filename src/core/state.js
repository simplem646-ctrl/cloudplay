/** GameState, saves and settings (ARCHITECTURE §3.3-§3.4). localStorage is always try/catch'd with a memory fallback. */
import { NPC_IDS, DAY_START } from './registry.js';
import { INVENTORY_CAPACITY, STORAGE_CAPACITY, START_MONEY, ENERGY } from './constants.js';
import { deepClone, isPlainObject, formatDate, dayNumber as dayNumberUtil } from './util.js';

export const SAVE_VERSION = 1;
export const dayNumber = dayNumberUtil;

const SAVE_PREFIX = 'lanternbrook.v1.save.';
const SETTINGS_KEY = 'lanternbrook.v1.settings';
export const SLOT_IDS = [0, 1, 2, 3]; // 0 = autosave, 1-3 manual

/** false once localStorage failed (or is missing): everything then lives in memory for this page load. */
export let storageOK = true;
const memory = new Map();

function ls() {
  const s = globalThis.localStorage;
  if (!s) throw new Error('no localStorage');
  return s;
}
function readRaw(key) {
  if (storageOK) {
    try {
      const v = ls().getItem(key);
      if (v !== null && v !== undefined) return v;
      return memory.has(key) ? memory.get(key) : null;
    } catch (_) {
      storageOK = false;
    }
  }
  return memory.has(key) ? memory.get(key) : null;
}
function writeRaw(key, value) {
  if (storageOK) {
    try {
      ls().setItem(key, value);
      memory.delete(key);
      return true;
    } catch (_) {
      storageOK = false;
    }
  }
  memory.set(key, value);
  return false;
}
function removeRaw(key) {
  memory.delete(key);
  if (storageOK) {
    try {
      ls().removeItem(key);
    } catch (_) {
      storageOK = false;
    }
  }
}
/** Test hook: forget the in-memory fallback and re-probe localStorage next time. */
export function _resetStorage() {
  storageOK = true;
  memory.clear();
}

export const DEFAULT_LOOK = { hair: '#4b3425', jacket: '#3b5b9c', scarf: '#e8833a' };

export const DEFAULT_SETTINGS = {
  master: 0.8, music: 0.7, sfx: 0.8, ambience: 0.6,
  textSpeed: 'normal', timeScale: 'normal', quality: 'medium', showHints: true, touchControls: 'auto',
};

/** Fresh GameState (version 1). */
export function defaultState(opts = {}) {
  const now = new Date().toISOString();
  const rel = {};
  for (const id of NPC_IDS) rel[id] = defaultRel();
  return {
    version: SAVE_VERSION,
    meta: { name: (opts.name || 'Kai').slice(0, 10), look: { ...DEFAULT_LOOK, ...(opts.look || {}) }, created: now, saved: now, playSeconds: 0, slot: 1 },
    time: { year: 1, season: 0, day: 1, minutes: DAY_START },
    weather: { today: 'sunny', tomorrow: 'sunny' },
    player: { area: 'brook_lane', x: 0, z: 0, facing: 's', energy: ENERGY.max, maxEnergy: ENERGY.max, money: START_MONEY },
    inventory: { capacity: INVENTORY_CAPACITY, slots: Array.from({ length: INVENTORY_CAPACITY }, () => null) },
    storage: { capacity: STORAGE_CAPACITY, slots: [] },
    rel,
    quests: { active: {}, done: {}, board: { day: -1, offered: [], accepted: [] } },
    flags: {},
    story: { lanterns: 0 },
    world: { lamps: {}, forage: {}, mailRead: {}, mailQueue: [], eventsSeen: {} },
    jobs: { doneDay: {}, stats: {} },
    log: { fish: {}, forage: {}, books: {}, gifts: {} },
    stats: { earned: 0, spent: 0, daysPlayed: 1, fishCaught: 0, forageCount: 0, steps: 0 },
    tutorial: { seen: {} },
  };
}

/** One relationship record. */
export function defaultRel() {
  return { aff: 0, met: false, talkedDay: -1, giftDay: -1, giftWeek: -1, giftsThisWeek: 0, status: 'none', seen: {} };
}

// ---- migrations: MIGRATIONS[n] upgrades a version-n state to n+1 (in place) ----
export const MIGRATIONS = {
  // 1: (s) => { ...; s.version = 2; },
};

/** Fill keys missing from older saves using defaults (plain objects only; arrays/values are left alone). */
function fillDefaults(target, def) {
  for (const k of Object.keys(def)) {
    if (!(k in target)) target[k] = deepClone(def[k]);
    else if (isPlainObject(def[k]) && isPlainObject(target[k])) fillDefaults(target[k], def[k]);
  }
}

/** Validate shape, run migrations, backfill. Returns state or null. */
export function migrateState(raw) {
  if (!isPlainObject(raw) || !isPlainObject(raw.meta) || !isPlainObject(raw.time) || !isPlainObject(raw.player)) return null;
  let v = Number(raw.version) || 1;
  if (v > SAVE_VERSION) return null; // saved by a newer build
  while (v < SAVE_VERSION) {
    const fn = MIGRATIONS[v];
    if (!fn) return null;
    fn(raw);
    v = Number(raw.version) || v + 1;
  }
  fillDefaults(raw, defaultState({ name: raw.meta.name }));
  for (const id of NPC_IDS) if (!raw.rel[id]) raw.rel[id] = defaultRel();
  const inv = raw.inventory;
  if (!Array.isArray(inv.slots)) inv.slots = [];
  while (inv.slots.length < inv.capacity) inv.slots.push(null);
  return raw;
}

// ---- slots ----
const slotKey = (slot) => SAVE_PREFIX + slot;
const validSlot = (slot) => Number.isInteger(slot) && slot >= 0 && slot <= 3;

function parseSlot(slot) {
  const text = readRaw(slotKey(slot));
  if (!text) return null;
  try {
    return migrateState(JSON.parse(text));
  } catch (_) {
    return null;
  }
}

/** @returns {{slot:number, empty:boolean, meta?:{name,dateLabel,playSeconds,money,lanterns}}[]} */
export function saveSlots() {
  return SLOT_IDS.map((slot) => {
    const s = parseSlot(slot);
    if (!s) return { slot, empty: true };
    return {
      slot, empty: false,
      meta: { name: s.meta.name, dateLabel: `Y${s.time.year} ${formatDate(s.time)}`, playSeconds: s.meta.playSeconds || 0, money: s.player.money, lanterns: s.story ? s.story.lanterns : 0 },
    };
  });
}

/** @returns {{ok:boolean, error?:string}} ok stays true on the in-memory fallback (see storageOK). */
export function saveToSlot(slot, state) {
  if (!validSlot(slot)) return { ok: false, error: 'bad slot' };
  if (!state || !isPlainObject(state)) return { ok: false, error: 'no state' };
  try {
    state.meta.saved = new Date().toISOString();
    state.meta.slot = slot;
    writeRaw(slotKey(slot), JSON.stringify(state));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

/** @returns {object|null} migrated state */
export function loadFromSlot(slot) {
  return validSlot(slot) ? parseSlot(slot) : null;
}

export function deleteSlot(slot) {
  if (validSlot(slot)) removeRaw(slotKey(slot));
}

// ---- settings ----
export function loadSettings() {
  const text = readRaw(SETTINGS_KEY);
  let saved = {};
  if (text) {
    try {
      const p = JSON.parse(text);
      if (isPlainObject(p)) saved = p;
    } catch (_) { /* ignore corrupt settings */ }
  }
  return { ...DEFAULT_SETTINGS, ...saved };
}

export function saveSettings(settings) {
  try {
    writeRaw(SETTINGS_KEY, JSON.stringify(settings));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err && err.message) || err) };
  }
}

// ---- export / import ----
export function exportSave(slot) {
  const s = loadFromSlot(slot);
  return s ? JSON.stringify({ lanternbrook: SAVE_VERSION, slot, state: s }) : '';
}

export function importSave(slot, text) {
  if (!validSlot(slot)) return { ok: false, error: 'bad slot' };
  let parsed;
  try {
    parsed = JSON.parse(String(text).trim());
  } catch (_) {
    return { ok: false, error: 'Not valid save data.' };
  }
  const state = migrateState(isPlainObject(parsed) && parsed.state ? parsed.state : parsed);
  if (!state) return { ok: false, error: 'Unrecognised or newer save version.' };
  return saveToSlot(slot, state);
}
