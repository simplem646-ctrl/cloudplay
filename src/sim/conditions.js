// Full condition evaluator for event/dialogue/schedule/ending `when` objects. Implements EVERY leaf of COND_LEAVES
// (src/sim/script_dsl.js) plus all/any/not. Pure: reads `state` (and optional ctx), never mutates it.
//   ctx: { map, minute, today (dayInfo), eventId }  -- all optional; defaults come from state.
import { WEEKDAYS } from '../core/constants.js';
import { rngFor } from '../core/rng.js';
import { dayInfo } from './calendar.js';
import { hearts as heartsOf, friendship as friendshipOf } from './relationships.js';
import { count as itemCount } from './inventory.js';

const OPS = {
  '>=': (a, b) => a >= b, '>': (a, b) => a > b, '<=': (a, b) => a <= b, '<': (a, b) => a < b,
  '==': (a, b) => a === b, '!=': (a, b) => a !== b,
};
/** Compare; a missing value (null/undefined/NaN) fails every comparison except '!='. */
export const compare = (a, op, b) => (a === null || a === undefined || Number.isNaN(a) ? op === '!=' : OPS[op](a, b));
const inRange = (v, spec) => (Array.isArray(spec) ? v >= spec[0] && v <= spec[1] : v === spec);
const list = (v) => (Array.isArray(v) ? v : [v]);
const toMin = (s) => { const [h, m] = String(s).split(':').map(Number); return h * 60 + m; };

/** The most recent exam record in state.school.exams (insertion order) or null. */
export function latestExam(state) {
  const keys = Object.keys((state.school && state.school.exams) || {});
  return keys.length ? state.school.exams[keys[keys.length - 1]] : null;
}

function leaf(k, v, state, ctx, memo) {
  const today = () => memo.today || (memo.today = ctx.today || dayInfo(state));
  const t = state.time;
  switch (k) {
    case 'flag': return !!state.flags[v];
    case 'noFlag': return !state.flags[v];
    case 'counter': return compare(state.counters[v[0]] ?? 0, v[1], v[2]);
    case 'hearts': return compare(heartsOf(state, v[0]), v[1], v[2]);
    case 'friendship': return compare(friendshipOf(state, v[0]), v[1], v[2]);
    case 'year': return inRange(t.year, v);
    case 'season': return list(v).includes(t.season);
    case 'day': return inRange(t.day, v);
    case 'date': return t.season === v.season && t.day === v.day && (v.year === undefined || t.year === v.year);
    case 'weekday': return list(v).includes(WEEKDAYS[(t.day - 1) % 7]);
    case 'schoolDay': return !!today().isSchoolDay === v;
    case 'time': { const m = ctx.minute ?? t.minute; return m >= toMin(v[0]) && m < toMin(v[1]); } // half-open [from, to), like schedules
    case 'map': return list(v).includes(ctx.map ?? state.player.map);
    case 'weather': return list(v).includes(state.weather.today);
    case 'item': return compare(itemCount(state, v[0]), v[1], v[2]);
    case 'money': return compare(state.player.money, v[0], v[1]);
    case 'energy': return compare(state.player.energy, v[0], v[1]);
    case 'stat': {
      const p = state.player;
      const val = v[0] === 'conduct' ? p.conduct : p.subjects[v[0]] ?? p.traits[v[0]];
      return compare(val, v[1], v[2]);
    }
    case 'club': return v === null ? !state.school.club : state.school.club === v;
    case 'job': return v === null ? !state.school.job : state.school.job === v;
    case 'partner': return v === null ? !state.romance.partner : state.romance.partner === v;
    case 'dating': return !!state.romance.dating[v];
    case 'confessed': return !!state.romance.confessed[v];
    case 'seen': return !!state.events.seen[v];
    case 'notSeen': return !state.events.seen[v];
    case 'quest': return (state.quests[v[0]] ? state.quests[v[0]].state : 'none') === v[1];
    case 'spirit': return compare(state.school.spirit, v[0], v[1]);
    case 'rank': { const e = latestExam(state); return compare(e ? e.rank : null, v[0], v[1]); }
    case 'average': return compare(state.school.average ?? 0, v[0], v[1]);
    case 'standing': return list(v).includes(state.school.standing);
    case 'chance': return rngFor(`${state.meta.seed}:chance:${t.absDay}:${ctx.eventId || ''}:${v}`).next() < v;
    case 'festival': { const f = today().festival; const id = f && (f.id || f); return v === true ? !!id : id === v; }
    case 'breakDay': return !!today().isBreak === v;
    default: throw new Error(`unknown condition key "${k}"`);
  }
}

/** Evaluate a condition. `undefined`/`null` = true. Unknown keys throw (the validator catches them in content). */
export function evaluateCondition(cond, state, ctx = {}, memo = {}) {
  if (cond === undefined || cond === null) return true;
  for (const [k, v] of Object.entries(cond)) {
    let ok;
    if (k === 'all') ok = v.every((c) => evaluateCondition(c, state, ctx, memo));
    else if (k === 'any') ok = v.some((c) => evaluateCondition(c, state, ctx, memo));
    else if (k === 'not') ok = !evaluateCondition(v, state, ctx, memo);
    else ok = leaf(k, v, state, ctx, memo);
    if (!ok) return false;
  }
  return true;
}

/** Safe wrapper for content: returns false (and logs once per message) instead of throwing. */
const warned = new Set();
export function safeCondition(cond, state, ctx) {
  try { return evaluateCondition(cond, state, ctx); } catch (e) {
    if (!warned.has(e.message)) { warned.add(e.message); console.error('[conditions]', e.message, cond); }
    return false;
  }
}
