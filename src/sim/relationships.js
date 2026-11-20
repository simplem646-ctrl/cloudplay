// Relationships: talking, gifts, hearts, decay. Functions mutate `state` in place and emit on `opts.bus`.
// Numbers live in balance.js. Gift tastes come from the dialogue pools written by the story
// workstream (`src/content/dialogue/<npc>.js` -> { npc, gift: { loves, likes, dislikes, hates, lines } });
// they are loaded lazily (loadGiftPrefs) and can always be injected (`opts.prefs`) so tests never
// depend on content. An unknown NPC/item taste is "neutral".

import { bus as defaultBus } from '../core/bus.js';
import { clamp } from '../core/util.js';
import { rngFor } from '../core/rng.js';
import { NPC_IDS, CAST_BY_ID } from '../data/cast.js';
import { BALANCE } from './balance.js';
import { dayInfo, absDayOf } from './calendar.js';
import { ITEM_BY_ID } from '../data/items.js';
import * as inventory from './inventory.js';

const B = (o) => (o && o.bus) || defaultBus;
const bal = (o) => (o && o.balance) || BALANCE;

export const GIFT_KINDS = ['loves', 'likes', 'neutral', 'dislikes', 'hates'];

export const hearts = (state, npc) => {
  const r = state.relationships[npc];
  return r ? Math.floor(r.friendship / BALANCE.friendship.perHeart) : 0;
};
export const friendship = (state, npc) => (state.relationships[npc] ? state.relationships[npc].friendship : 0);
export const isNpc = (state, npc) => !!state.relationships[npc];

/** Mark an NPC as met (idempotent). Emits `npc:met` { npc } the first time. Returns true if newly met. */
export function markMet(state, npc, opts = {}) {
  const r = state.relationships[npc];
  if (!r || r.met) return false;
  r.met = true;
  B(opts).emit('npc:met', { npc });
  return true;
}

/**
 * Change friendship points (clamped 0..100). `opts.contact === false` leaves lastContactAbsDay alone
 * (used by decay). Emits `hearts:changed` { npc, from, to, points, delta } when the heart count changes.
 * Returns the delta actually applied.
 */
export function addFriendship(state, npc, delta, opts = {}) {
  const r = state.relationships[npc];
  if (!r || !Number.isFinite(delta)) return 0;
  const b = bal(opts).friendship;
  const from = r.friendship;
  r.friendship = clamp(Math.round(from + delta), 0, b.max);
  const applied = r.friendship - from;
  if (r.peak === undefined || r.friendship > r.peak) r.peak = Math.max(r.friendship, from);
  if (opts.contact !== false) r.lastContactAbsDay = absDayOf(state);
  const h0 = Math.floor(from / b.perHeart);
  const h1 = Math.floor(r.friendship / b.perHeart);
  if (h0 !== h1) B(opts).emit('hearts:changed', { npc, from: h0, to: h1, points: r.friendship, delta: applied });
  return applied;
}

/**
 * Talk to an NPC. First talk of the day: +2 friendship, marks `met`. Later talks: no gain.
 * Returns { ok, first, gained, newlyMet, hearts } (`first` tells the dialogue system to use the
 * `talk` pool, otherwise `repeat`).
 */
export function talk(state, npc, opts = {}) {
  const r = state.relationships[npc];
  if (!r) return { ok: false, reason: 'unknown_npc', first: false, gained: 0, newlyMet: false, hearts: 0 };
  const newlyMet = markMet(state, npc, opts);
  r.lastContactAbsDay = absDayOf(state);
  if (r.talkedToday) return { ok: true, first: false, gained: 0, newlyMet, hearts: hearts(state, npc) };
  r.talkedToday = true;
  const gained = addFriendship(state, npc, bal(opts).friendship.talk, opts);
  return { ok: true, first: true, gained, newlyMet, hearts: hearts(state, npc) };
}

// ------------------------------------------------------------------ gift tastes
/** Build `{ [npc]: { loves, likes, dislikes, hates, lines } }` from dialogue modules (registry DIALOGUE_MODULES). */
export function prefsFromModules(modules) {
  const out = {};
  for (const mod of Object.values(modules || {})) {
    for (const pool of [].concat((mod && mod.default) || [])) {
      if (pool && pool.npc && pool.gift) out[pool.npc] = pool.gift;
    }
  }
  return out;
}

/** Lazily import the generated registry and return the taste table ({} if unavailable). Async by design. */
export async function loadGiftPrefs() {
  try {
    const reg = await import('../_generated/registry.js');
    return prefsFromModules(reg.DIALOGUE_MODULES);
  } catch {
    return {};
  }
}

/** Taste of `npc` for `itemId`: 'loves'|'likes'|'neutral'|'dislikes'|'hates'. */
export function giftOutcome(npc, itemId, prefs = {}) {
  const g = prefs && prefs[npc] && (prefs[npc].gift || prefs[npc]);
  if (!g) return 'neutral';
  for (const kind of ['loves', 'likes', 'dislikes', 'hates']) {
    if (Array.isArray(g[kind]) && g[kind].includes(itemId)) return kind;
  }
  return 'neutral';
}

const lineText = (l) => (Array.isArray(l) ? l[1] : l);

/** Today's birthday NPC ids that still have their once-per-year birthday bonus available. */
export function birthdayBonusAvailable(state, npc) {
  const r = state.relationships[npc];
  return !!r && dayInfo(state).birthdays.includes(npc) && r.birthdayGiftYear !== state.time.year;
}

/**
 * Give an item to an NPC. Rules: one gift per NPC per day; the item is consumed only on success;
 * key items cannot be given; on the NPC's birthday a POSITIVE gift counts x3 (once per year;
 * a bad gift on a birthday does not use the bonus up).
 * Returns { ok, reason?, kind, delta, birthday, line?, lineFace?, hearts:{from,to} }.
 * reasons: unknown_npc | unknown_item | no_item | key_item | already_gifted | weekly_cap
 */
export function giveGift(state, npc, itemId, opts = {}) {
  const r = state.relationships[npc];
  const fail = (reason) => ({ ok: false, reason, kind: null, delta: 0, birthday: false });
  if (!r) return fail('unknown_npc');
  const item = ITEM_BY_ID[itemId];
  if (!item) return fail('unknown_item');
  if (item.category === 'key') return fail('key_item');
  if (!inventory.has(state, itemId, 1)) return fail('no_item');
  if (r.giftedToday) return fail('already_gifted');
  const b = bal(opts).friendship;
  if (b.giftsPerWeekCap > 0 && r.giftsThisWeek >= b.giftsPerWeekCap) return fail('weekly_cap');

  const prefs = opts.prefs || {};
  const kind = giftOutcome(npc, itemId, prefs);
  let delta = b.gift[kind];
  let birthday = false;
  if (delta > 0 && birthdayBonusAvailable(state, npc)) {
    delta *= b.birthdayMultiplier;
    birthday = true;
    r.birthdayGiftYear = state.time.year;
  }
  inventory.remove(state, itemId, 1, opts);
  markMet(state, npc, opts);
  r.giftedToday = true;
  r.giftsThisWeek = (r.giftsThisWeek || 0) + 1;
  const h0 = hearts(state, npc);
  addFriendship(state, npc, delta, opts);
  const h1 = hearts(state, npc);

  // pick a reaction line (deterministic per day/npc/item)
  const lines = (prefs[npc] && (prefs[npc].gift || prefs[npc]).lines) || {};
  const pool = (birthday && lines.birthday && lines.birthday.length ? lines.birthday : lines[kind]) || [];
  let line = null;
  let lineFace = null;
  if (pool.length) {
    const pick = pool[rngFor(`${state.meta.seed}:gift:${absDayOf(state)}:${npc}:${itemId}`).int(0, pool.length - 1)];
    line = lineText(pick);
    lineFace = Array.isArray(pick) ? pick[0] : null;
  }
  const result = { ok: true, kind, delta, birthday, line, lineFace, hearts: { from: h0, to: h1 } };
  B(opts).emit('gift:given', { npc, item: itemId, kind, delta, birthday });
  return result;
}

/**
 * Slow decay of neglected friendships. Call at the start of a new day (state.time already on the
 * new day). Rule: met NPCs whose friendship has reached 3 hearts (`peak`) lose 1 point every
 * 3rd day once 7+ days have passed without contact, never below 20. Exempt: family (roz).
 * Returns [{ npc, from, to }].
 */
export function decay(state, opts = {}) {
  const d = bal(opts).friendship.decay;
  const today = absDayOf(state);
  const out = [];
  for (const npc of NPC_IDS) {
    const r = state.relationships[npc];
    if (!r || !r.met || d.exempt.includes(npc)) continue;
    const peak = r.peak === undefined ? r.friendship : r.peak;
    if (peak < d.minPeakPoints) continue;
    const last = r.lastContactAbsDay;
    if (last === undefined || last === -1) continue; // -1 = never in contact (no decay clock yet)
    const idle = today - last;
    if (idle < d.idleDays || (idle - d.idleDays) % d.everyDays !== 0) continue;
    if (r.friendship <= d.floor) continue;
    const from = r.friendship;
    addFriendship(state, npc, -1, { ...opts, contact: false });
    out.push({ npc, from, to: r.friendship });
  }
  return out;
}

/** New-day reset of the per-day flags (and the weekly gift counter on Mondays). */
export function resetDaily(state) {
  const monday = dayInfo(state).weekdayIndex === 0;
  for (const r of Object.values(state.relationships)) {
    r.talkedToday = false;
    r.giftedToday = false;
    if (monday) r.giftsThisWeek = 0;
  }
}

export const npcName = (npc) => (CAST_BY_ID[npc] ? CAST_BY_ID[npc].short || CAST_BY_ID[npc].name : npc);
