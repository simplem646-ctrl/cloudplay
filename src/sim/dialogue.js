// Everyday conversation: pick a line from an NPC's dialogue pool, gift reactions, endings of fallbacks.
// Pools: src/content/dialogue/<npc>.js ({npc, talk:[{when?,priority?,say:[...]}], repeat:[...], gift:{...}}).
import { DIALOGUE_MODULES } from '../_generated/registry.js';
import { rngFor } from '../core/rng.js';
import { CAST_BY_ID, EXTRAS_BY_ID } from '../data/cast.js';
import { safeCondition } from './conditions.js';
import * as relationships from './relationships.js';

export function buildPools(modules) {
  const pools = {};
  for (const mod of Object.values(modules)) for (const p of [].concat(mod.default || [])) if (p && p.npc) pools[p.npc] = p;
  return pools;
}
let cached = null;
export const defaultPools = () => cached || (cached = buildPools(DIALOGUE_MODULES));

const norm = (l) => (Array.isArray(l) ? { face: l[0], text: l[1] } : { face: 'neutral', text: l });

const FALLBACK = {
  student: ['Oh, hi, Theo.', 'Busy day, huh?', 'See you around!', 'Hey. Good to see you.'],
  teacher: ['Good to see you, Theo.', 'Study hard, now.', 'Mind the bell.', 'Everything going well?'],
  townsfolk: ['Hello there!', 'Lovely day, isn\'t it?', 'Take care, Theo.', 'Bellhaven treating you well?'],
  animal: ['(Meow.)', '(It watches you calmly.)', '(Purrrr.)'],
  extra: ['...', 'Hm? Oh, hi.', 'Sorry, running late!', 'Nice weather.'],
};
const FALLBACK_GIFT = {
  loves: ['Oh! This is wonderful. Thank you!', 'You remembered! I love it!'],
  likes: ['Thank you, I like this.', 'That is really kind of you.'],
  neutral: ['Oh, thanks.', 'Thank you, Theo.'],
  dislikes: ['Um... thanks, I guess.', 'Oh. That is... not really my thing.'],
  hates: ['Please never give me that again.', 'Ugh. No.'],
  birthday: ['A birthday present? Thank you so much!'],
};
const GIFT_FACE = { loves: 'happy', likes: 'happy', neutral: 'neutral', dislikes: 'sad', hates: 'angry' };

function fallbackLines(npc, rng) {
  const c = CAST_BY_ID[npc] || EXTRAS_BY_ID[npc];
  const kind = !c ? 'extra' : c.kind === 'extra' ? 'extra' : c.kind === 'player' ? 'student' : c.kind;
  const pool = FALLBACK[kind] || FALLBACK.extra;
  return [{ face: 'neutral', text: pool[rng.int(0, pool.length - 1)] }];
}

function pick(entries, state, npc, ctx, salt) {
  const ok = (entries || []).filter((e) => safeCondition(e.when, state, { ...ctx, eventId: `talk_${npc}` }));
  if (!ok.length) return null;
  const top = Math.max(...ok.map((e) => e.priority ?? 10));
  const best = ok.filter((e) => (e.priority ?? 10) === top);
  return best.length === 1 ? best[0] : best[rngFor(`${state.meta.seed}:talk:${state.time.absDay}:${npc}:${salt}`).int(0, best.length - 1)];
}

/**
 * Pick the conversation for `npc`. first=true uses the `talk` pool (first chat of the day), otherwise `repeat` (falls back to talk).
 * Returns { lines: [{face, text}], entry, fallback }. Never empty.
 */
export function pickTalk(state, npc, { first = true, pools = defaultPools(), ctx = {} } = {}) {
  const pool = pools[npc];
  state.daily.talks = state.daily.talks || {};
  const salt = (state.daily.talks[npc] = (state.daily.talks[npc] || 0) + 1);
  const entries = pool ? (first ? pool.talk : pool.repeat && pool.repeat.length ? pool.repeat : pool.talk) : null;
  const entry = pick(entries, state, npc, ctx, salt) || (!first && pool ? pick(pool.talk, state, npc, ctx, salt) : null);
  if (entry) return { lines: entry.say.map(norm), entry, fallback: false };
  return { lines: fallbackLines(npc, rngFor(`${state.meta.seed}:fb:${state.time.absDay}:${npc}:${salt}`)), entry: null, fallback: true };
}
export const pickRepeat = (state, npc, opts = {}) => pickTalk(state, npc, { ...opts, first: false });

/** Gift taste prefs object in the shape relationships.giveGift expects. */
export const prefsFromPools = (pools) => Object.fromEntries(Object.entries(pools).map(([npc, p]) => [npc, { gift: p.gift || {} }]));
export const giftTaste = (npc, itemId, pools = defaultPools()) => relationships.giftOutcome(npc, itemId, prefsFromPools(pools));

/**
 * Give a gift and get the reaction: relationships.giveGift's result plus `lines: [{face, text}]` (empty when the gift failed:
 * check `ok`/`reason`). Falls back to generic per-taste lines when the pool has none.
 */
export function giftReaction(state, npc, itemId, { pools = defaultPools(), bus } = {}) {
  const res = relationships.giveGift(state, npc, itemId, { bus, prefs: prefsFromPools(pools) });
  if (!res.ok) return { ...res, lines: [] };
  const rng = rngFor(`${state.meta.seed}:giftfb:${state.time.absDay}:${npc}:${itemId}`);
  const fb = (res.birthday ? FALLBACK_GIFT.birthday : FALLBACK_GIFT[res.kind]) || FALLBACK_GIFT.neutral;
  const text = res.line || fb[rng.int(0, fb.length - 1)];
  return { ...res, lines: [{ face: res.lineFace || GIFT_FACE[res.kind] || 'neutral', text }] };
}
