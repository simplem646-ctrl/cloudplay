// Event catalog, trigger matching and running. Content comes from the generated registry (src/content/events/*.js) or
// is injected (tests). See docs/game/02_SIM_CONTENT_CONTRACTS.md sections 7-8.
import { EVENT_MODULES, QUEST_MODULES } from '../_generated/registry.js';
import { parseTime } from '../core/util.js';
import { safeCondition } from './conditions.js';
import { runScript } from './interpreter.js';

export const DEFAULT_PRIORITY = { story: 80, festival: 90, romance: 60, friend: 50, random: 20, class: 20, ambient: 10 };
export const priorityOf = (ev) => ev.priority ?? DEFAULT_PRIORITY[ev.kind] ?? 50;

export function flattenModules(modules) {
  const out = [];
  for (const mod of Object.values(modules)) for (const e of [].concat(mod.default || mod.events || [])) out.push(e);
  return out;
}
export function buildCatalog(list) {
  const byId = new Map();
  for (const e of list) {
    if (byId.has(e.id)) console.warn(`[events] duplicate event id "${e.id}" (last one wins)`);
    byId.set(e.id, e);
  }
  return { list: [...byId.values()], byId };
}
let cached = null;
export const defaultCatalog = () => cached || (cached = buildCatalog(flattenModules(EVENT_MODULES)));
export const questsFromModules = (modules) => Object.assign({}, ...Object.values(modules).map((m) => m.default || {}));
export const defaultQuests = () => questsFromModules(QUEST_MODULES);

export const allEvents = (catalog = defaultCatalog()) => catalog.list;
export const getEvent = (id, catalog = defaultCatalog()) => catalog.byId.get(id) || null;

function matchesTrigger(ev, trig, ctx, state) {
  const t = ev.trigger;
  if (!t || t.type !== trig.type) return false;
  const minute = ctx.minute ?? state.time.minute;
  switch (t.type) {
    case 'enterMap': if (t.map !== trig.map) return false; break;
    case 'talk': if (t.npc !== trig.npc) return false; break;
    case 'interact': if (t.id !== trig.id) return false; break;
    case 'clock':
      if (t.map && t.map !== (ctx.map ?? state.player.map)) return false;
      if (minute < parseTime(t.at)) return false;
      break;
    default: break;
  }
  if (t.time && (minute < parseTime(t.time[0]) || minute >= parseTime(t.time[1]))) return false; // half-open [from, to)
  return true;
}

function repeatOk(ev, state) {
  const seen = state.events.seen[ev.id];
  const mode = ev.repeat || 'once';
  if (mode === 'once') return !seen;
  if (mode === 'daily') return !seen || seen.lastAbsDay !== state.time.absDay;
  return true;
}

/** All eligible events for a trigger, best first. trigger: { type, map?, npc?, id? }; ctx: { map, minute }. */
export function listEligible(state, trigger, rawCtx = {}, catalog = defaultCatalog()) {
  const out = [];
  const ctx = { ...rawCtx, minute: rawCtx.minute ?? rawCtx.time }; // `time` is accepted as an alias of `minute` (contract wording)
  for (const ev of catalog.list) {
    if (!matchesTrigger(ev, trigger, ctx, state) || !repeatOk(ev, state)) continue;
    if (!safeCondition(ev.when, state, { map: ctx.map, minute: ctx.minute, eventId: ev.id })) continue;
    out.push(ev);
  }
  return out.sort((a, b) => priorityOf(b) - priorityOf(a) || (a.id < b.id ? -1 : 1));
}
export const findEvent = (state, trigger, ctx = {}, catalog = defaultCatalog()) => listEligible(state, trigger, ctx, catalog)[0] || null;

/**
 * Run an event: marks it seen BEFORE running (so a crash or skip never replays it), records it in `daily.events`, emits
 * event:started / event:finished, calls stage.begin/end hooks (skip indicator etc.). env: { stage, bus, quests, opts }.
 */
export async function runEvent(state, ev, env) {
  const prev = state.events.seen[ev.id];
  state.events.seen[ev.id] = { count: (prev ? prev.count : 0) + 1, lastAbsDay: state.time.absDay };
  if (!state.daily.events) state.daily.events = [];
  state.daily.events.push(ev.id);
  env.bus.emit('event:started', { id: ev.id });
  if (env.stage.begin) await env.stage.begin(ev);
  try {
    await runScript(ev.script, { state, stage: env.stage, bus: env.bus, quests: env.quests || {}, eventId: ev.id, opts: env.opts });
  } finally {
    if (env.stage.end) await env.stage.end(ev);
    env.bus.emit('event:finished', { id: ev.id });
  }
}

/** Catalog numbers for QA: counts by kind and by id prefix. */
export function catalogStats(catalog = defaultCatalog()) {
  const byKind = {}, byPrefix = {};
  for (const e of catalog.list) {
    byKind[e.kind] = (byKind[e.kind] || 0) + 1;
    const p = e.id.split('_')[0];
    byPrefix[p] = (byPrefix[p] || 0) + 1;
  }
  return { total: catalog.list.length, byKind, byPrefix };
}
