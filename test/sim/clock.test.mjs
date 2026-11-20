import test from 'node:test';
import assert from 'node:assert/strict';
import { DAY_END, DAY_START } from '../../src/core/constants.js';
import {
  advance, setTime, setDate, wake, sleep, collapse, timeLabel, registerNewDayHook, unregisterNewDayHook,
  listNewDayHooks, createHookRegistry, isDayOver,
} from '../../src/sim/clock.js';
import { read, list } from '../../src/sim/save.js';
import { dayInfo, absDayOf } from '../../src/sim/calendar.js';
import { validateState } from '../../src/sim/state.js';
import { fresh, named } from './_helpers.mjs';

test('advance moves the clock, emits time:minute per minute, clamps at 02:00', () => {
  const { state, events, opts } = fresh();
  const r = advance(state, 90, opts);
  assert.equal(r.advanced, 90);
  assert.equal(state.time.minute, DAY_START + 90);
  assert.equal(named(events, 'time:minute').length, 90);
  assert.equal(named(events, 'time:minute')[0][1].minute, DAY_START + 1);
  assert.equal(r.dayEnded, false);
  const r2 = advance(state, 99999, opts);
  assert.equal(state.time.minute, DAY_END);
  assert.equal(r2.dayEnded, true);
  assert.equal(isDayOver(state), true);
  assert.equal(advance(state, 10, opts).advanced, 0);
  assert.equal(state.time.day, 1, 'the date only changes in sleep()');
  // silent / fractional / negative input
  const f = fresh();
  assert.equal(advance(f.state, -5, f.opts).advanced, 0);
  assert.equal(advance(f.state, 2.9, { ...f.opts, silent: true }).advanced, 2);
  assert.equal(named(f.events, 'time:minute').length, 0);
});

test('advance with autoSleep runs the forced sleep when the day ends', () => {
  const { state, opts } = fresh({ minute: 25 * 60 });
  const r = advance(state, 120, { ...opts, autoSleep: true });
  assert.equal(r.dayEnded, true);
  assert.equal(r.summary.forced, true);
  assert.equal(state.time.day, 2);
});

test('setTime / wake / timeLabel', () => {
  const { state, opts } = fresh();
  assert.equal(setTime(state, '15:30', opts), 930);
  assert.equal(setTime(state, 99999, opts), DAY_END);
  assert.equal(timeLabel(state), '2:00 AM');
  assert.equal(timeLabel(DAY_START), '6:30 AM');
  assert.equal(timeLabel(13 * 60 + 5, { format: '24h' }), '13:05');
  state.player.map = 'beach';
  wake(state, opts);
  assert.equal(state.time.minute, DAY_START);
  assert.deepEqual([state.player.map, state.player.anchor, state.player.x], ['home_theo', 'bed', null]);
  wake(state, { ...opts, forced: true, place: false });
  assert.equal(state.time.minute, 540);
});

test('normal sleep: next day, absDay, wake at 06:30 in bed, autosave, events, valid state', () => {
  const { state, events, opts, storage } = fresh({ minute: 22 * 60 });
  state.player.map = 'town_square';
  const s = sleep(state, opts);
  assert.equal(s.ok, true);
  assert.deepEqual([state.time.year, state.time.season, state.time.day, state.time.absDay], [1, 'spring', 2, 1]);
  assert.equal(state.time.minute, DAY_START);
  assert.equal(state.player.map, 'home_theo');
  assert.equal(s.forced, false);
  assert.deepEqual(s.date, { year: 1, season: 'spring', day: 2, absDay: 1 });
  assert.equal(s.saved, true);
  assert.equal(read('auto', { storage }).ok, true);
  assert.equal(read('auto', { storage }).state.time.day, 2);
  assert.equal(list({ storage }).find((e) => e.slot === 'auto').summary.day, 2);
  const days = named(events, 'time:day');
  assert.equal(days.length, 1);
  assert.deepEqual(days[0][1].from, { year: 1, season: 'spring', day: 1, absDay: 0 });
  assert.deepEqual(days[0][1].to, { year: 1, season: 'spring', day: 2, absDay: 1 });
  assert.equal(named(events, 'time:season').length, 0);
  assert.deepEqual(validateState(state), []);
});

test('rollover across a season boundary (Spring 28 -> Summer 1) and a year boundary (Winter 28 Y1 -> Spring 1 Y2)', () => {
  const a = fresh({ season: 'spring', day: 28, minute: 22 * 60 });
  const s1 = sleep(a.state, a.opts);
  assert.deepEqual([a.state.time.season, a.state.time.day, a.state.time.year], ['summer', 1, 1]);
  assert.equal(s1.newSeason, true);
  assert.equal(s1.newYear, false);
  assert.deepEqual(named(a.events, 'time:season')[0][1].from, 'spring');
  assert.equal(named(a.events, 'time:season')[0][1].to, 'summer');
  assert.equal(dayInfo(a.state).weekday, 'Mon');
  assert.equal(a.state.time.absDay, 28);

  const b = fresh({ season: 'winter', day: 28, minute: 22 * 60 });
  const s2 = sleep(b.state, b.opts);
  assert.deepEqual([b.state.time.year, b.state.time.season, b.state.time.day], [2, 'spring', 1]);
  assert.equal(s2.newYear, true);
  assert.equal(b.state.time.absDay, 112);
  assert.equal(named(b.events, 'time:year').length, 1);
  assert.equal(b.state.time.absDay, absDayOf(b.state));
});

test('walk a full year day by day: absDay always consistent, weekday cycles', () => {
  const { state, opts } = fresh();
  for (let i = 0; i < 112; i++) {
    state.time.minute = 22 * 60;
    sleep(state, { ...opts, autosave: false });
    assert.equal(state.time.absDay, i + 1);
    assert.equal(absDayOf(state), i + 1);
    assert.equal(dayInfo(state).weekdayIndex, (i + 1) % 7);
  }
  assert.deepEqual([state.time.year, state.time.season, state.time.day], [2, 'spring', 1]);
});

test('final night of the game (Year 3 Winter 28) does not roll over and reports gameEnd', () => {
  const { state, opts } = fresh({ year: 3, season: 'winter', day: 28, minute: 24 * 60 + 30 });
  const s = sleep(state, opts);
  assert.equal(s.gameEnd, true);
  assert.deepEqual([state.time.year, state.time.season, state.time.day], [3, 'winter', 28]);
  assert.deepEqual(validateState(state), []);
  const n = fresh({ year: 3, season: 'winter', day: 27, minute: 22 * 60 });
  assert.equal(sleep(n.state, n.opts).gameEnd, false);
});

test('new-day pipeline order with hooks (before/after, order, replace, errors, unregister)', () => {
  const { state, opts, hooks } = fresh({ season: 'spring', day: 6, minute: 22 * 60 }); // Sat -> Sun
  const log = [];
  const mark = (n) => (st, ctx) => { log.push(`${n}@${ctx.phase}:${st.time.day}`); return { n }; };
  registerNewDayHook('a_after', mark('a_after'), { registry: hooks });
  registerNewDayHook('b_after_first', mark('b'), { phase: 'after', order: 10, registry: hooks });
  registerNewDayHook('c_before', (st, ctx) => { log.push(`c@before:${st.time.day}:to${ctx.to.day}`); }, { phase: 'before', registry: hooks });
  registerNewDayHook('d_before_early', mark('d'), { phase: 'before', order: 1, registry: hooks });
  registerNewDayHook('boom', () => { throw new Error('kaput'); }, { registry: hooks });
  registerNewDayHook('a_after', mark('a_replaced'), { phase: 'after', order: 99, registry: hooks });
  assert.deepEqual(listNewDayHooks(hooks).map((h) => h.name), ['d_before_early', 'c_before', 'b_after_first', 'boom', 'a_after']);
  assert.deepEqual(listNewDayHooks(hooks, 'before').map((h) => h.name), ['d_before_early', 'c_before']);
  const s = sleep(state, opts);
  // before-hooks see the OLD day (6), after-hooks the NEW one (7)
  assert.deepEqual(log, ['d@before:6', 'c@before:6:to7', 'b@after:7', 'a_replaced@after:7']);
  assert.deepEqual(s.hooks.b_after_first, { n: 'b' });
  assert.deepEqual(s.hooks.a_after, { n: 'a_replaced' });
  assert.equal(s.hooks.boom.error, 'kaput');
  assert.equal(s.hooks.c_before, undefined);
  assert.equal(state.time.day, 7);
  assert.equal(unregisterNewDayHook('boom', hooks), true);
  assert.deepEqual(s.hooks.d_before_early, { n: 'd' });
});

test('hooks run around the built-in steps in the documented order', () => {
  const { state, opts, hooks } = fresh({ season: 'spring', day: 6, minute: 22 * 60 });
  const seen = {};
  state.player.energy = 10;
  registerNewDayHook('probe_before', (st) => { seen.before = { money: st.player.money, energy: st.player.energy, day: st.time.day, talked: st.relationships.nina.talkedToday }; }, { phase: 'before', registry: hooks });
  registerNewDayHook('probe_after', (st) => { seen.after = { money: st.player.money, energy: st.player.energy, day: st.time.day, talked: st.relationships.nina.talkedToday, weather: st.weather.today, ate: { ...st.daily.ate } }; }, { registry: hooks });
  state.relationships.nina.talkedToday = true;
  state.daily.ate.lunch = true;
  sleep(state, opts);
  assert.deepEqual(seen.before, { money: 300, energy: 10, day: 6, talked: true });
  assert.equal(seen.after.money, 360, 'allowance already paid');
  assert.equal(seen.after.energy, 90, 'energy restored (100 % minus the 2-skipped-meals penalty) before after-hooks');
  assert.equal(seen.after.talked, false);
  assert.equal(seen.after.day, 7);
  assert.deepEqual(seen.after.ate, { breakfast: false, lunch: false, dinner: false });
});

test('weekly allowance only on Sunday morning', () => {
  const sat = fresh({ season: 'spring', day: 6, minute: 22 * 60 });
  const s1 = sleep(sat.state, sat.opts);
  assert.equal(s1.allowance, 60);
  assert.equal(sat.state.player.money, 360);
  assert.equal(named(sat.events, 'money:changed').length, 1);
  assert.equal(named(sat.events, 'toast').length, 1);
  const fri = fresh({ season: 'spring', day: 5, minute: 22 * 60 });
  assert.equal(sleep(fri.state, fri.opts).allowance, 0);
  assert.equal(fri.state.player.money, 300);
});

test('energy restore by bedtime, forced sleep 50 %, meal-skip penalty, fitness raises max', () => {
  const run = (minute, extra = {}) => {
    const f = fresh({ minute });
    f.state.daily.ate = { breakfast: true, lunch: true, dinner: true };
    f.state.player.energy = 5;
    const s = sleep(f.state, { ...f.opts, ...extra });
    return [f.state.player.energy, s, f.state];
  };
  assert.equal(run(22 * 60 + 59)[0], 100, 'before 23:00');
  assert.equal(run(23 * 60)[0], 85, '23:00 up to 01:00');
  assert.equal(run(24 * 60 + 59)[0], 85);
  assert.equal(run(25 * 60)[0], 65, 'after 01:00');
  assert.equal(run(25 * 60 + 59)[0], 65);
  assert.equal(run(22 * 60, { forced: true })[0], 50);
  const [, s100] = run(22 * 60);
  assert.equal(s100.energy.restored, 95);
  // two skipped meals cost 10
  const f = fresh({ minute: 22 * 60 });
  f.state.daily.ate = { breakfast: true, lunch: false, dinner: false };
  sleep(f.state, f.opts);
  assert.equal(f.state.player.energy, 90);
  const g = fresh({ minute: 22 * 60 });
  g.state.daily.ate = { breakfast: true, lunch: true, dinner: false };
  sleep(g.state, g.opts);
  assert.equal(g.state.player.energy, 100, 'one skipped meal is fine');
  // fitness 40 -> max energy 103
  const h = fresh({ minute: 22 * 60 });
  h.state.daily.ate = { breakfast: true, lunch: true, dinner: true };
  h.state.player.traits.fitness = 40;
  sleep(h.state, h.opts);
  assert.equal(h.state.player.maxEnergy, 103);
  assert.equal(h.state.player.energy, 103);
});

test('forced sleep at 02:00: wakes 09:00, energy 50 %, conduct -1 and missed homeroom on a school day', () => {
  const { state, opts } = fresh({ season: 'spring', day: 2, minute: DAY_END }); // Tue -> Wed school day
  state.daily.ate = { breakfast: true, lunch: true, dinner: true };
  const s = sleep(state, opts); // forced inferred from the clock
  assert.equal(s.forced, true);
  assert.equal(state.time.minute, 9 * 60);
  assert.equal(state.player.energy, 50);
  assert.equal(state.player.conduct, 79);
  assert.equal(s.missedHomeroom, true);
  assert.equal(state.flags.sim_forced_sleep, true);
  assert.equal(state.flags.sim_missed_homeroom, true);
  assert.equal(state.daily.forcedSleep, true);
  assert.equal(state.counters.forced_sleeps, 1);
  // flags are cleared by the next ordinary night
  state.time.minute = 22 * 60;
  sleep(state, opts);
  assert.equal(state.flags.sim_forced_sleep, undefined);
  assert.equal(state.daily.forcedSleep, false);
  assert.equal(state.time.minute, DAY_START);
  // weekend morning: no conduct loss
  const w = fresh({ season: 'spring', day: 5, minute: DAY_END }); // Fri -> Sat
  sleep(w.state, w.opts);
  assert.equal(w.state.player.conduct, 80);
  assert.equal(w.state.time.minute, 9 * 60);
  assert.equal(w.state.flags.sim_missed_homeroom, undefined);
  // explicit forced flag before 02:00 works too
  const x = fresh({ minute: 23 * 60 });
  assert.equal(sleep(x.state, { ...x.opts, forced: true }).forced, true);
});

test('daily reset clears per-day fields, including ones added later; birthdays set a one-day flag', () => {
  const { state, opts } = fresh({ season: 'spring', day: 9, minute: 22 * 60 }); // -> Jules's birthday (day 10)
  state.daily.studied = 3;
  state.daily.workedShift = true;
  state.daily.events = ['x'];
  state.daily.custom_counter = 7;
  state.daily.nested = { a: 2, b: true };
  state.daily.purchases = { bakery: { bread: 2 } };
  state.school.attendance.today = { 1: 'present' };
  state.flags.birthday_nina = true;
  const s = sleep(state, opts);
  assert.equal(state.daily.studied, 0);
  assert.equal(state.daily.workedShift, false);
  assert.deepEqual(state.daily.events, []);
  assert.equal(state.daily.custom_counter, 0);
  assert.deepEqual(state.daily.nested, { a: 0, b: false });
  assert.deepEqual(state.daily.purchases, {});
  assert.deepEqual(state.school.attendance.today, {});
  assert.deepEqual(s.birthdays, ['jules']);
  assert.equal(state.flags.birthday_jules, true);
  assert.equal(state.flags.birthday_nina, undefined);
  state.time.minute = 22 * 60;
  sleep(state, opts);
  assert.equal(state.flags.birthday_jules, undefined);
});

test('pipeline resets talk/gift flags, decays friendships and weather rolls through the new day', () => {
  const { state, events, opts } = fresh({ day: 7, minute: 22 * 60 });
  const n = state.relationships.nina;
  Object.assign(n, { met: true, friendship: 50, peak: 50, talkedToday: true, giftedToday: true, lastContactAbsDay: 0 });
  // after sleeping absDay = 7 -> idle 7 days -> first decay
  const s = sleep(state, opts);
  assert.equal(n.talkedToday, false);
  assert.equal(n.giftedToday, false);
  assert.equal(n.friendship, 49);
  assert.deepEqual(s.decayed, [{ npc: 'nina', from: 50, to: 49 }]);
  assert.ok(['sunny', 'cloudy', 'rain'].includes(state.weather.today));
  assert.ok(s.weather.tomorrow);
  void events;
});

test('weather: today becomes yesterday\'s forecast, weather:changed fires on change', () => {
  const { state, events, opts } = fresh({ seed: 3, minute: 22 * 60 });
  const seq = [];
  for (let i = 0; i < 10; i++) {
    const tomorrow = state.weather.tomorrow;
    state.time.minute = 22 * 60;
    sleep(state, { ...opts, autosave: false });
    assert.equal(state.weather.today, tomorrow);
    seq.push(state.weather.today);
  }
  const changes = named(events, 'weather:changed');
  let expected = 0;
  let prev = 'sunny';
  for (const k of seq) { if (k !== prev) expected++; prev = k; }
  assert.equal(changes.length, expected);
});

test('setDate keeps absDay in sync; collapse costs money in town and nothing at school', () => {
  const { state, events, opts } = fresh();
  setDate(state, { year: 2, season: 'autumn', day: 9 }, opts);
  assert.equal(state.time.absDay, 112 + 56 + 8);
  assert.equal(named(events, 'time:day').length, 1);
  state.player.map = 'town_square';
  state.player.energy = 0;
  const c = collapse(state, opts);
  assert.equal(c.place, 'clinic');
  assert.equal(c.fee, 30);
  assert.equal(state.player.money, 270);
  assert.equal(state.player.energy, 40);
  assert.equal(state.player.map, 'clinic');
  const sch = fresh();
  sch.state.player.map = 'school_classroom';
  const c2 = collapse(sch.state, sch.opts);
  assert.equal(c2.place, 'school_nurse');
  assert.equal(sch.state.player.money, 300);
  assert.equal(sch.state.player.map, 'school_hall_1f');
});

test('the default hook registry and an isolated one are independent', () => {
  const mine = createHookRegistry();
  const off = registerNewDayHook('only_default_test_hook', () => {}, {});
  assert.ok(listNewDayHooks().some((h) => h.name === 'only_default_test_hook'));
  assert.equal(listNewDayHooks(mine).length, 0);
  off();
  assert.ok(!listNewDayHooks().some((h) => h.name === 'only_default_test_hook'));
  assert.throws(() => registerNewDayHook('bad', () => {}, { phase: 'sometime' }));
});
