/** Cond evaluator (ARCHITECTURE §12). */
import { Game } from '../core/game.js';
import { AREAS, SEASONS } from '../core/registry.js';
import { rngFor, dayNumber, timeInRange, seasonName, weekdayName } from '../core/util.js';
import { svc } from './svc.js';
import { warnOnce, npcDef, dayNum } from './kit.js';

const arr = (v) => (Array.isArray(v) ? v : [v]);
const inRange = (v, c) => (c.gte === undefined || v >= c.gte) && (c.lte === undefined || v <= c.lte);
const seasonIdx = (s) => (typeof s === 'number' ? s : SEASONS.indexOf(s));

const P = {
  flag: (v, { st }) => !!st.flags[v],
  notFlag: (v, { st }) => !st.flags[v],
  flagGte: ([name, n], { st }) => (Number(st.flags[name]) || 0) >= n,
  hearts: (v, { st }) => inRange(Math.floor((st.rel[v.npc]?.aff || 0) / 100), v),
  status: (v) => (svc.rel ? svc.rel.status(v.npc) : 'none') === v.is,
  met: (v, { st }) => !!(st.rel[v]?.met || st.flags[`met_${v}`] || npcDef(v)?.startMet),
  season: (v, { st }) => arr(v).includes(seasonName(st.time.season)),
  weekday: (v, { st }) => arr(v).includes(weekdayName(st.time.day)),
  weather: (v, { st }) => arr(v).includes(st.weather.today),
  year: (v, { st }) => inRange(st.time.year, v),
  day: (v, { st }) => inRange(dayNumber(st.time), v),
  date: (v, { st }) => seasonIdx(v.season) === st.time.season && v.day === st.time.day,
  dateFrom: (v, { st }) => st.time.season * 28 + st.time.day >= seasonIdx(v.season) * 28 + v.day,
  dateTo: (v, { st }) => st.time.season * 28 + st.time.day <= seasonIdx(v.season) * 28 + v.day,
  time: (v, { st, ctx }) => timeInRange(ctx.minutes ?? st.time.minutes, v.from, v.to),
  night: (v, { st, ctx }) => (svc.clock ? svc.clock.isNight(ctx.minutes ?? st.time.minutes) : false) === !!v,
  area: (v, { st, ctx }) => arr(v).includes(ctx.area ?? st.player.area),
  indoors: (v, { st, ctx }) => (AREAS[ctx.area ?? st.player.area]?.kind === 'interior') === !!v,
  item: (v, { st }) => (svc.inventory ? svc.inventory.count(v.id) : 0) >= (v.gte ?? 1),
  money: (v, { st }) => inRange(st.player.money, v),
  energy: (v, { st }) => inRange(st.player.energy, v),
  quest: (v) => {
    const q = svc.quests;
    const state = !q ? 'none' : q.isActive(v.id) ? 'active' : q.isDone(v.id) ? 'done' : 'none';
    if (state !== v.state) return false;
    if (v.stage === undefined) return true;
    if (state !== 'active') return false;
    return typeof v.stage === 'number' ? q.stageOf(v.id) === v.stage : q.stageId(v.id) === v.stage;
  },
  lanterns: (v, { st }) => inRange(st.story.lanterns, v),
  jobDone: (v, { st }) => st.jobs.doneDay[v] === dayNumber(st.time),
  festival: (v) => {
    const f = svc.events?.festivalToday?.();
    return v === true ? !!f : !!f && f.id === v;
  },
  chance: (v, { ctx, key }) => rngFor('chance', dayNum(), ctx.key ?? '', key)() < v,
};

/** Evaluate a Cond. null/undefined = true. ctx: {area?, minutes?, npc?, key?}. Unknown primitive -> warn once, false. */
export function evalCond(cond, ctx = {}) {
  const st = Game.state;
  if (cond === undefined || cond === null || cond === true) return true;
  if (cond === false) return false;
  if (!st) return false;
  if (Array.isArray(cond)) return cond.every((c) => evalCond(c, ctx));
  if (typeof cond !== 'object') return false;
  for (const k of Object.keys(cond)) {
    const v = cond[k];
    let ok;
    if (k === 'all') ok = arr(v).every((c) => evalCond(c, ctx));
    else if (k === 'any') ok = arr(v).some((c) => evalCond(c, ctx));
    else if (k === 'not') ok = !evalCond(v, ctx);
    else if (P[k]) ok = !!P[k](v, { st, ctx, key: JSON.stringify(cond) });
    else {
      warnOnce(`cond:${k}`, `unknown condition primitive "${k}"`);
      ok = false;
    }
    if (!ok) return false;
  }
  return true;
}

export const conditions = { evalCond };
