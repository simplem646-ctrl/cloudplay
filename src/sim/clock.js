// Clock and the new-day pipeline (02 section 2).
//   advance(state, minutes)  moves the clock inside the day (clamped at DAY_END = 02:00), emits `time:minute`
//   sleep(state, {forced})   ends the day: runs the pipeline, rolls the date over, wakes the player, autosaves
// A "game day" runs from wake-up (06:30) to bed time, which may be after midnight (minute up to 1560);
// the calendar date only changes in sleep(). Hooks (registerNewDayHook) let later systems (exams, reports)
// join the pipeline. Mutates `state` in place; events go to `opts.bus` (default: the shared bus).

import { bus as defaultBus } from '../core/bus.js';
import { parseTime, formatTime12, formatTime24 } from '../core/util.js';
import { DAY_START, DAY_END, WEEKDAYS } from '../core/constants.js';
import { BALANCE } from './balance.js';
import { dayInfo, absDayOf, fromAbsDay, isFinaleDay, toDate } from './calendar.js';
import { rollWeather } from './weather.js';
import * as rel from './relationships.js';
import { addEnergy, addMoney, addStat, refreshMaxEnergy, trackSubjects, decaySubjects, isSchoolMap } from './player.js';
import { autosave } from './save.js';

const B = (o) => (o && o.bus) || defaultBus;

// ------------------------------------------------------------------ hook registry
/** An isolated hook registry (tests / multiple sims). The module also owns one default registry. */
export function createHookRegistry() {
  return { hooks: new Map(), seq: 0 };
}
const DEFAULT_HOOKS = createHookRegistry();

/**
 * Register a function to run during sleep(). `fn(state, ctx) -> summary | undefined` (the return
 * value shows up in `summary.hooks[name]`). ctx = { phase, bus, forced, bedtime, from, to, gameEnd, balance }
 * where `from`/`to` are dayInfo() of the day that ends / the day that starts (`to` is null on the final night).
 * phase 'before' runs first (state still on the old day, e.g. exam scoring); 'after' runs after the built-in
 * steps, on the new day, just before the player wakes and the autosave is written. Lower `order` runs first
 * (default 50), then registration order. Re-registering a name replaces it. Returns an unregister function.
 */
export function registerNewDayHook(name, fn, { phase = 'after', order = 50, registry = DEFAULT_HOOKS } = {}) {
  if (phase !== 'before' && phase !== 'after') throw new Error(`registerNewDayHook: bad phase "${phase}"`);
  if (typeof fn !== 'function') throw new Error('registerNewDayHook: fn must be a function');
  registry.hooks.set(name, { name, fn, phase, order, seq: registry.seq++ });
  return () => unregisterNewDayHook(name, registry);
}
export function unregisterNewDayHook(name, registry = DEFAULT_HOOKS) {
  return registry.hooks.delete(name);
}
/** Hooks in run order (before-phase first): [{ name, phase, order }]. */
export function listNewDayHooks(registry = DEFAULT_HOOKS, phase) {
  return [...registry.hooks.values()]
    .filter((h) => !phase || h.phase === phase)
    .sort((a, b) => (a.phase === b.phase ? 0 : a.phase === 'before' ? -1 : 1) || a.order - b.order || a.seq - b.seq)
    .map(({ name, phase: p, order }) => ({ name, phase: p, order }));
}

function runHooks(state, phase, ctx, summary, registry) {
  const hooks = [...registry.hooks.values()].filter((h) => h.phase === phase).sort((a, b) => a.order - b.order || a.seq - b.seq);
  for (const h of hooks) {
    try {
      const r = h.fn(state, { ...ctx, phase });
      if (r !== undefined) summary.hooks[h.name] = r;
    } catch (e) {
      summary.hooks[h.name] = { error: String(e && e.message || e) };
    }
  }
}

// ------------------------------------------------------------------ labels
/** '6:30 AM' (default) or '06:30' (`{ format: '24h' }`). Accepts a state or minutes. */
export function timeLabel(stateOrMinute, { format = '12h' } = {}) {
  const m = typeof stateOrMinute === 'number' ? stateOrMinute : stateOrMinute.time.minute;
  return format === '24h' ? formatTime24(m) : formatTime12(m);
}

// ------------------------------------------------------------------ in-day clock
/** True once the clock has reached the forced-sleep time. */
export const isDayOver = (state) => state.time.minute >= DAY_END;

/**
 * Advance the clock by whole `minutes` (clamped at DAY_END). Emits `time:minute` { state, minute } for every
 * minute (pass `silent: true` to skip). Returns { advanced, minute, dayEnded }. With `autoSleep: true` the
 * forced sleep runs when the day ends and its summary is returned as `summary`.
 */
export function advance(state, minutes, opts = {}) {
  const bus = B(opts);
  const t = state.time;
  const want = Math.max(0, Math.floor(minutes) || 0);
  const target = Math.min(t.minute + want, Math.max(t.minute, DAY_END));
  const advanced = target - t.minute;
  while (t.minute < target) {
    t.minute += 1;
    if (!opts.silent) bus.emit('time:minute', { state, minute: t.minute });
  }
  const dayEnded = t.minute >= DAY_END;
  const res = { advanced, minute: t.minute, dayEnded };
  if (dayEnded && opts.autoSleep) res.summary = sleep(state, { ...opts, forced: true });
  return res;
}

/** Jump to a time of day ('HH:MM' or minutes), clamped to 0..DAY_END. Emits `time:minute` once. */
export function setTime(state, time, opts = {}) {
  const m = Math.min(Math.max(Math.floor(parseTime(time)), 0), DAY_END);
  state.time.minute = m;
  B(opts).emit('time:minute', { state, minute: m });
  return m;
}

/**
 * Jump to a date (debug / tests): keeps absDay in sync and re-rolls the weather for it. Emits `time:day`.
 * Accepts { year, season, day }.
 */
export function setDate(state, date, opts = {}) {
  const from = { ...toDate(state), absDay: state.time.absDay };
  const d = toDate(date);
  state.time.year = d.year;
  state.time.season = d.season;
  state.time.day = d.day;
  state.time.absDay = absDayOf(d);
  rollWeather(state, { bus: B(opts), reseed: true });
  B(opts).emit('time:day', { state, from, to: { ...d, absDay: state.time.absDay } });
  return state.time.absDay;
}

/**
 * Start the player's morning: sets the clock (06:30, or 09:00 after a forced sleep) and puts the player on
 * the bed of `map`/`anchor` (default Theo's room). `opts.place === false` leaves the position alone.
 */
export function wake(state, opts = {}) {
  const minute = opts.minute !== undefined ? parseTime(opts.minute) : opts.forced ? BALANCE.time.forcedWake : DAY_START;
  state.time.minute = minute;
  if (opts.place !== false) {
    const p = state.player;
    p.map = opts.map || 'home_theo';
    p.anchor = opts.anchor || 'bed';
    p.x = null;
    p.y = null;
    p.dir = 'down';
  }
  B(opts).emit('time:minute', { state, minute });
  return minute;
}

// ------------------------------------------------------------------ new-day pipeline
function resetCounters(o) {
  // zero every per-day field generically so fields added by later tasks reset too
  for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'number') o[k] = 0;
    else if (typeof v === 'boolean') o[k] = false;
    else if (typeof v === 'string') o[k] = '';
    else if (Array.isArray(v)) o[k] = [];
    else if (v && typeof v === 'object') resetCounters(v);
  }
}

function resetDailyBlock(state) {
  const d = state.daily;
  // purchases is a dictionary: clear it; everything else resets to its zero value
  d.purchases = {};
  resetCounters(d);
  d.purchases = {};
  for (const m of ['breakfast', 'lunch', 'dinner']) {
    if (!d.ate) d.ate = {};
    d.ate[m] = false;
  }
  if (state.school && state.school.attendance) state.school.attendance.today = {};
}

function energyPct(bedtime, forced, b) {
  if (forced) return b.energy.forcedPct;
  for (const row of b.energy.restore) if (bedtime < row.before) return row.pct;
  return b.energy.restore[b.energy.restore.length - 1].pct;
}

/**
 * End the day and start the next one. `opts`: { forced, bus, hooks (registry), balance, autosave (default true),
 * storage/fallback (for the autosave), wakeAt: { map, anchor } | false }.
 * `forced` (or a clock already at 02:00) = collapsed into bed: wake at 09:00, energy 50 %, and on a school
 * day miss homeroom (conduct -1, flags `sim_forced_sleep` / `sim_missed_homeroom` for Aunt Roz's scolding).
 *
 * Pipeline order: before-hooks -> date rollover -> relationship decay + daily flag reset -> subject decay
 * (Mondays) -> weekly allowance (Sunday) -> weather roll -> birthday flags -> daily reset -> energy restore
 * -> after-hooks -> wake -> events (`time:day`, `time:season`, `time:year`) -> autosave.
 * On the final night (Year 3, Winter 28) nothing rolls over: the summary has `gameEnd: true`.
 *
 * Returns the day summary: { ok, forced, bedtime, from, date, dayInfo, energy:{before,after,restored,pct,penalty},
 * weather:{today,tomorrow,changed}, allowance, birthdays, decayed, subjectDecay, newSeason, newYear,
 * missedHomeroom, hooks:{name: result}, gameEnd, saved }.
 */
export function sleep(state, opts = {}) {
  const bus = B(opts);
  const b = opts.balance || BALANCE;
  const registry = opts.hooks || DEFAULT_HOOKS;
  const bedtime = state.time.minute;
  const forced = !!opts.forced || bedtime >= DAY_END;
  const oldAbs = absDayOf(state);
  const fromInfo = dayInfo(state);
  const finale = isFinaleDay(state);
  const toInfo = finale ? null : dayInfo(fromAbsDay(oldAbs + 1));
  const ateBefore = { breakfast: false, lunch: false, dinner: false, ...((state.daily && state.daily.ate) || {}) };
  const dateOf = (d) => ({ year: d.year, season: d.season, day: d.day, absDay: absDayOf(d) });

  const summary = {
    ok: true, forced, bedtime, from: dateOf(fromInfo), date: dateOf(fromInfo), dayInfo: fromInfo,
    energy: null, weather: null, allowance: 0, birthdays: [], decayed: [], subjectDecay: [],
    newSeason: false, newYear: false, missedHomeroom: false, hooks: {}, gameEnd: finale, saved: false,
  };
  const ctx = { bus, forced, bedtime, from: fromInfo, to: toInfo, gameEnd: finale, balance: b };

  runHooks(state, 'before', ctx, summary, registry);
  if (finale) return summary;

  // knowledge gained today counts as "touched" on the day that is ending
  trackSubjects(state, oldAbs);

  // ---- date rollover
  const prev = { ...state.time };
  const next = fromAbsDay(oldAbs + 1);
  state.time.year = next.year;
  state.time.season = next.season;
  state.time.day = next.day;
  state.time.absDay = next.absDay;
  summary.date = dateOf(next);
  summary.dayInfo = toInfo;
  summary.newSeason = next.season !== prev.season;
  summary.newYear = next.year !== prev.year;

  // ---- relationships: decay + daily flags
  summary.decayed = rel.decay(state, { bus, balance: b });
  rel.resetDaily(state);

  // ---- weekly: subject decay (Mon), allowance (Sun)
  if (toInfo.weekdayIndex === 0) summary.subjectDecay = decaySubjects(state, next.absDay, { bus, balance: b });
  if (toInfo.weekdayIndex === 6 && b.money.weeklyAllowance > 0) {
    summary.allowance = addMoney(state, b.money.weeklyAllowance, { bus });
    bus.emit('toast', { text: `Weekly allowance: $${summary.allowance}`, icon: 'coin' });
  }

  // ---- weather
  summary.weather = rollWeather(state, { bus });

  // ---- birthdays (flags `birthday_<npc>` hold for exactly one day)
  for (const k of Object.keys(state.flags)) if (k.startsWith('birthday_')) delete state.flags[k];
  const bdays = [...toInfo.birthdays];
  summary.birthdays = bdays;
  for (const id of bdays) { state.flags[`birthday_${id}`] = true; bus.emit('flag:set', { name: `birthday_${id}`, value: true }); }
  if (toInfo.playerBirthday) { state.flags.birthday_theo = true; bus.emit('flag:set', { name: 'birthday_theo', value: true }); }

  // ---- daily reset
  delete state.flags.sim_forced_sleep;
  delete state.flags.sim_missed_homeroom;
  resetDailyBlock(state);

  // ---- energy restore
  refreshMaxEnergy(state, { balance: b });
  const pct = energyPct(bedtime, forced, b);
  const skipped = ['breakfast', 'lunch', 'dinner'].filter((m) => !ateBefore[m]).length;
  const penalty = skipped >= b.energy.skipMealThreshold ? b.energy.skipMealPenalty : 0;
  const eBefore = state.player.energy;
  const target = Math.max(0, Math.round(state.player.maxEnergy * pct) - penalty);
  addEnergy(state, target - eBefore, { bus });
  summary.energy = { before: eBefore, after: state.player.energy, restored: state.player.energy - eBefore, pct, penalty };

  // ---- forced sleep consequences
  if (forced) {
    state.counters.forced_sleeps = (state.counters.forced_sleeps || 0) + 1;
    state.flags.sim_forced_sleep = true;
    state.daily.forcedSleep = true;
    if (toInfo.isSchoolDay) {
      summary.missedHomeroom = true;
      state.flags.sim_missed_homeroom = true;
      state.daily.missedHomeroom = true;
      addStat(state, 'conduct', b.time.forcedSleepConduct, { bus, balance: b });
    }
  }

  runHooks(state, 'after', { ...ctx, from: fromInfo, to: toInfo }, summary, registry);

  // ---- morning
  const wakeAt = opts.wakeAt === false ? { place: false } : (opts.wakeAt || {});
  wake(state, { ...wakeAt, forced, bus });

  bus.emit('time:day', { state, from: dateOf(prev), to: dateOf(next) });
  if (summary.newSeason) bus.emit('time:season', { state, from: prev.season, to: next.season });
  if (summary.newYear) bus.emit('time:year', { state, from: prev.year, to: next.year });

  if (opts.autosave !== false) {
    const r = autosave(state, { bus, storage: opts.storage, fallback: opts.fallback, now: opts.now });
    summary.saved = !!r.ok;
  }
  return summary;
}

/**
 * Collapse at 0 energy: the player is taken care of (clinic -$30; the school nurse is free), wakes up with
 * some energy two hours later (clamped to the day end). Returns { place: 'clinic'|'school_nurse', fee, energy,
 * advanced, dayEnded }. The caller decides about scenes; the player is relocated to the clinic bed / nurse bed.
 */
export function collapse(state, opts = {}) {
  const b = opts.balance || BALANCE;
  const p = state.player;
  const inSchool = isSchoolMap(p.map);
  const fee = inSchool ? 0 : Math.min(p.money, b.energy.collapse.fee);
  if (fee) addMoney(state, -fee, opts);
  p.energy = 0;
  addEnergy(state, b.energy.collapse.wakeEnergy, opts);
  const adv = advance(state, b.energy.collapse.minutes, { ...opts, silent: opts.silent });
  p.map = inSchool ? 'school_hall_1f' : 'clinic';
  p.anchor = inSchool ? 'nurse_bed' : 'bed_1';
  p.x = null;
  p.y = null;
  B(opts).emit('player:collapsed', { place: inSchool ? 'school_nurse' : 'clinic', fee });
  return { place: inSchool ? 'school_nurse' : 'clinic', fee, energy: p.energy, advanced: adv.advanced, dayEnded: adv.dayEnded };
}

export { WEEKDAYS };
