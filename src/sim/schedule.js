// NPC schedule RESOLVER. Schedules are content (`src/content/schedules/<npc>.js`):
//   { npc, routines: [ { id, when?, priority?, points: [ ['HH:MM', 'map:anchor' | null, { dir?, activity? }? ] ] } ] }
// The highest-priority routine whose `when` holds is used (ties: file order); the NPC stands at the LAST
// point whose time is <= now. A `null` location means "off-screen" (class A/C, at home, away).
//
// Conditions are evaluated by `evalCond(cond, state, ctx)`. The default is the small built-in
// evaluator below (T7b replaces it with the full grammar by passing its own function).

import { parseTime } from '../core/util.js';
import { dayInfo } from './calendar.js';

const toList = (v) => (Array.isArray(v) ? v : [v]);
const inRange = (v, n) => (Array.isArray(v) ? n >= v[0] && n <= v[1] : n === v);

/**
 * Built-in condition evaluator. Leaves: weekday, schoolDay, season, year, day, date, weather, flag, noFlag,
 * festival, breakDay, time, map, counter, hearts, friendship; combinators all / any / not; several keys in
 * one object are AND-ed. Unknown keys evaluate to false (never throw). ctx: { minute?, map? }.
 */
export function evalCondition(cond, state, ctx = {}) {
  if (cond === undefined || cond === null) return true;
  if (typeof cond !== 'object' || Array.isArray(cond)) return false;
  const minute = ctx.minute === undefined ? state.time.minute : ctx.minute;
  let info = null;
  const di = () => info || (info = dayInfo(state));
  for (const [k, v] of Object.entries(cond)) {
    let ok;
    switch (k) {
      case 'all': ok = v.every((c) => evalCondition(c, state, ctx)); break;
      case 'any': ok = v.some((c) => evalCondition(c, state, ctx)); break;
      case 'not': ok = !evalCondition(v, state, ctx); break;
      case 'weekday': ok = toList(v).includes(di().weekday); break;
      case 'schoolDay': ok = di().isSchoolDay === v; break;
      case 'season': ok = toList(v).includes(state.time.season); break;
      case 'year': ok = inRange(v, state.time.year); break;
      case 'day': ok = inRange(v, state.time.day); break;
      case 'date': ok = v.season === state.time.season && v.day === state.time.day && (v.year === undefined || v.year === state.time.year); break;
      case 'weather': ok = toList(v).includes(state.weather.today); break;
      case 'flag': ok = !!state.flags[v]; break;
      case 'noFlag': ok = !state.flags[v]; break;
      case 'festival': ok = v === true ? !!di().festival : v === false ? !di().festival : !!di().festival && di().festival.id === v; break;
      case 'breakDay': ok = di().isBreak === v; break;
      case 'time': ok = minute >= parseTime(v[0]) && minute < parseTime(v[1]); break;
      case 'map': ok = ctx.map !== undefined && toList(v).includes(ctx.map); break;
      case 'counter': ok = cmp(state.counters[v[0]] || 0, v[1], v[2]); break;
      case 'friendship': ok = cmp((state.relationships[v[0]] || {}).friendship || 0, v[1], v[2]); break;
      case 'hearts': ok = cmp(Math.floor(((state.relationships[v[0]] || {}).friendship || 0) / 10), v[1], v[2]); break;
      default: ok = false;
    }
    if (!ok) return false;
  }
  return true;
}

function cmp(a, op, b) {
  switch (op) {
    case '>=': return a >= b;
    case '>': return a > b;
    case '<=': return a <= b;
    case '<': return a < b;
    case '==': return a === b;
    case '!=': return a !== b;
    default: return false;
  }
}

/** Normalise `schedules` given as { npc: schedule } or [schedule] or registry modules to { npc: schedule }. */
export function indexSchedules(input) {
  if (!input) return {};
  const list = Array.isArray(input) ? input : Object.values(input);
  const out = {};
  for (const e of list) {
    for (const s of [].concat((e && e.default) || e)) if (s && s.npc && s.routines) out[s.npc] = s;
  }
  return out;
}

/** Lazily import the generated registry and index every schedule. Async by design ({} if unavailable). */
export async function loadSchedules() {
  try {
    const reg = await import('../_generated/registry.js');
    return indexSchedules(reg.SCHEDULE_MODULES);
  } catch {
    return {};
  }
}

const parsePoint = (pt) => {
  const [t, loc, o] = pt;
  const [map, anchor] = loc ? loc.split(':') : [null, null];
  return { minute: parseTime(t), map, anchor, dir: (o && o.dir) || null, activity: (o && o.activity) || null };
};

/** The routine in force for `npcId` right now (or null). */
export function activeRoutine(npcId, state, minute, opts = {}) {
  const sch = indexSchedules(opts.schedules)[npcId];
  if (!sch) return null;
  const evalCond = opts.evalCond || evalCondition;
  const ctx = { minute, map: opts.map };
  let best = null;
  for (const r of sch.routines) {
    if (!r.points || !r.points.length) continue;
    if (r.when && !evalCond(r.when, state, ctx)) continue;
    if (!best || (r.priority || 0) > (best.priority || 0)) best = r;
  }
  return best;
}

/**
 * Where is `npcId` at `minute` (minutes since midnight, may exceed 1440 after midnight)?
 * Returns { map, anchor, dir, activity, routineId, pointIndex, nextPoint } or null when the NPC has no
 * schedule or no routine applies. `map`/`anchor` are null when the NPC is off-screen (a null point, or
 * before the first point of the day: pointIndex -1). `nextPoint` = { minute, map, anchor, dir, activity } | null.
 * opts: { schedules, evalCond, map }.
 */
export function resolve(npcId, state, minute, opts = {}) {
  const routine = activeRoutine(npcId, state, minute, opts);
  if (!routine) return null;
  const pts = routine.points.map(parsePoint);
  let idx = -1;
  for (let i = 0; i < pts.length; i++) if (pts[i].minute <= minute) idx = i;
  const cur = idx >= 0 ? pts[idx] : { map: null, anchor: null, dir: null, activity: null };
  return {
    map: cur.map, anchor: cur.anchor, dir: cur.dir, activity: cur.activity,
    routineId: routine.id, pointIndex: idx, nextPoint: pts[idx + 1] || null,
  };
}

/** Every scheduled NPC that stands on `mapId` at `minute`: [{ npc, anchor, dir, activity, routineId, pointIndex, nextPoint }]. */
export function npcsOnMap(state, mapId, minute, opts = {}) {
  const out = [];
  for (const npc of Object.keys(indexSchedules(opts.schedules))) {
    const r = resolve(npc, state, minute, opts);
    if (r && r.map === mapId) out.push({ npc, ...r });
  }
  return out;
}

/** Positions of all scheduled NPCs: { npc: resolve(...) } (entries with null results are omitted). */
export function snapshot(state, minute, opts = {}) {
  const out = {};
  for (const npc of Object.keys(indexSchedules(opts.schedules))) {
    const r = resolve(npc, state, minute, opts);
    if (r) out[npc] = r;
  }
  return out;
}
