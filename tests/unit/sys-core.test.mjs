import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, setDate, svc, Game, Sys } from './fixtures/sys-data.mjs';
import { EVT } from '../../src/core/events.js';
import { dayNumber } from '../../src/core/util.js';
import { TIME_SCALE } from '../../src/core/constants.js';

const wait = (ms = 15) => new Promise((r) => setTimeout(r, ms));
const record = (evt) => {
  const got = [];
  Game.bus.on(evt, (p) => got.push(p));
  return got;
};

// ---------- API surface ----------
test('public API names and svc', () => {
  for (const n of ['init', 'update', 'start', 'newGame', 'continueGame', 'openMenu', 'saveGame', 'runScript', 'registerOp', 'registerService']) assert.equal(typeof Sys[n], 'function', n);
  for (const n of ['clock', 'weather', 'conditions', 'inventory', 'rel', 'shops', 'quests', 'script', 'events', 'mail', 'interact', 'tutorial', 'director', 'save']) assert.ok(Sys.svc[n], n);
});

test('registerService: init/update called in registration order', () => {
  setup();
  const order = [];
  Sys.registerService('zz1', { init() { order.push('i1'); }, update(dt) { order.push(`u1:${dt}`); } });
  Sys.registerService('zz2', { init() { order.push('i2'); }, update() { order.push('u2'); } });
  Sys.init();
  Sys.update(0.5);
  assert.deepEqual(order, ['i1', 'i2', 'u1:0.5', 'u2']);
  delete Sys.svc.zz1;
  delete Sys.svc.zz2;
});

// ---------- clock ----------
test('clock: day 28 rolls to next season, season 3 to next year, weekdays cycle', () => {
  setup();
  const seasons = record(EVT.TIME_SEASON);
  const days = record(EVT.TIME_NEWDAY);
  setDate('spring', 28);
  svc.clock.sleepToMorning();
  assert.deepEqual([Game.state.time.season, Game.state.time.day, Game.state.time.minutes], [1, 1, 360]);
  assert.equal(seasons.length, 1);
  assert.equal(days.length, 1);
  assert.equal(days[0].dayNum, dayNumber(Game.state.time));
  setDate('winter', 28);
  svc.clock.sleepToMorning();
  assert.deepEqual([Game.state.time.year, Game.state.time.season, Game.state.time.day], [2, 0, 1]);
  assert.equal(svc.clock.weekdayName(), 'mon');
  const names = [];
  for (let i = 0; i < 8; i++) {
    names.push(svc.clock.weekdayName());
    svc.clock.rollDay();
  }
  assert.deepEqual(names, ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun', 'mon']);
});

test('clock: ticks only in field mode, scaled, fractional', () => {
  setup();
  const ticks = record(EVT.TIME_TICK);
  Game.mode = 'dialogue';
  svc.clock.update(10);
  assert.equal(Game.state.time.minutes, 360);
  Game.mode = 'field';
  svc.clock.update(1); // normal = 2 min / s
  assert.equal(Game.state.time.minutes, 362);
  assert.equal(ticks.length, 2);
  Game.settings.timeScale = 'slow';
  svc.clock.update(1); // 1.2 -> 1 min, 0.2 carried
  assert.equal(Game.state.time.minutes, 363);
  svc.clock.update(1); // 0.2+1.2 -> 1 more
  assert.equal(Game.state.time.minutes, 364);
  assert.equal(TIME_SCALE.fast, 3);
});

test('clock: hour events, isNight, now()', () => {
  setup();
  const hours = record(EVT.TIME_HOUR);
  svc.clock.advance(60);
  assert.deepEqual(hours.map((h) => h.hour), [7]);
  assert.equal(svc.clock.isNight(1110), true);
  assert.equal(svc.clock.isNight(1109), false);
  assert.equal(svc.clock.isNight(300), true);
  const n = svc.clock.now();
  assert.equal(n.hour, 7);
  assert.equal(n.minute, 0);
  assert.equal(n.weekday, 'mon');
});

test('clock: 24:00 warning once, 26:00 collapse', async () => {
  setup();
  svc.clock.set({ minutes: 1439 });
  Game.state.player.money = 200;
  svc.clock.advance(1);
  assert.equal(Game.ui.toasts().filter((t) => /late/i.test(t)).length, 1);
  svc.clock.advance(5);
  assert.equal(Game.ui.toasts().filter((t) => /late/i.test(t)).length, 1);
  svc.clock.set({ minutes: 1559 });
  const alive = svc.clock.advance(1);
  assert.equal(alive, false);
  await wait();
  assert.equal(Game.state.time.day, 2);
  assert.equal(Game.state.time.minutes, 360);
  assert.equal(Game.state.player.money, 150);
  assert.equal(Game.state.player.energy, 50);
  assert.equal(Game.state.player.area, 'cottage');
  assert.equal(Game.mode, 'field');
});

// ---------- weather ----------
test('weather: deterministic per dayNum, first 3 days sunny, season rules', () => {
  setup();
  const a = [];
  for (let d = 1; d <= 112; d++) a.push(svc.weather.roll(d));
  const b = [];
  for (let d = 1; d <= 112; d++) b.push(svc.weather.roll(d));
  assert.deepEqual(a, b);
  assert.deepEqual(a.slice(0, 3), ['sunny', 'sunny', 'sunny']);
  for (let d = 1; d <= 112 * 3; d++) {
    const w = svc.weather.roll(d);
    const season = Math.floor(((d - 1) % 112) / 28);
    if (season === 3) assert.ok(['sunny', 'cloudy', 'snow'].includes(w), `${d} ${w}`);
    else assert.ok(['sunny', 'cloudy', 'rain', 'storm'].includes(w), `${d} ${w}`);
  }
  const winter = Array.from({ length: 28 }, (_, i) => svc.weather.roll(85 + i));
  assert.ok(winter.includes('snow'));
});

test('weather: festival days are fair; newday sets today/tomorrow and emits change', () => {
  setup();
  for (let y = 0; y < 30; y++) {
    const dn = y * 112 + 14; // spring 14 of each simulated year
    assert.ok(['sunny', 'cloudy'].includes(svc.weather.roll(dn)));
  }
  setDate('spring', 5);
  const changes = record(EVT.WEATHER_CHANGE);
  for (let i = 0; i < 20; i++) svc.clock.rollDay();
  assert.equal(Game.state.weather.today, svc.weather.roll(dayNumber(Game.state.time)));
  assert.equal(Game.state.weather.tomorrow, svc.weather.roll(dayNumber(Game.state.time) + 1));
  assert.ok(changes.length > 0);
  svc.weather.setToday('storm');
  assert.equal(svc.weather.current(), 'storm');
  assert.equal(svc.weather.isRaining(), true);
});

// ---------- conditions ----------
test('conditions: every primitive', () => {
  setup();
  const E = (c, ctx) => svc.conditions.evalCond(c, ctx);
  const st = Game.state;
  setDate('spring', 3, 600); // Wed
  Game.state.weather.today = 'rain';
  st.flags.f = true;
  st.flags.n = 3;
  assert.equal(E(undefined), true);
  assert.equal(E({ flag: 'f' }), true);
  assert.equal(E({ flag: 'zz' }), false);
  assert.equal(E({ notFlag: 'zz' }), true);
  assert.equal(E({ flagGte: ['n', 3] }), true);
  assert.equal(E({ flagGte: ['n', 4] }), false);
  st.rel.mira.aff = 250;
  assert.equal(E({ hearts: { npc: 'mira', gte: 2 } }), true);
  assert.equal(E({ hearts: { npc: 'mira', gte: 3 } }), false);
  assert.equal(E({ hearts: { npc: 'mira', lte: 2 } }), true);
  assert.equal(E({ status: { npc: 'mira', is: 'none' } }), true);
  st.flags.mira_dating = true;
  assert.equal(E({ status: { npc: 'mira', is: 'dating' } }), true);
  assert.equal(E({ met: 'gus' }), true); // startMet
  assert.equal(E({ met: 'theo' }), false);
  st.rel.theo.met = true;
  assert.equal(E({ met: 'theo' }), true);
  assert.equal(E({ season: 'spring' }), true);
  assert.equal(E({ season: ['summer', 'winter'] }), false);
  assert.equal(E({ weekday: 'wed' }), true);
  assert.equal(E({ weekday: ['mon', 'tue'] }), false);
  assert.equal(E({ weather: ['rain', 'storm'] }), true);
  assert.equal(E({ year: { gte: 1, lte: 1 } }), true);
  assert.equal(E({ year: { gte: 2 } }), false);
  assert.equal(E({ day: { gte: 3, lte: 3 } }), true);
  assert.equal(E({ day: { gte: 4 } }), false);
  assert.equal(E({ date: { season: 'spring', day: 3 } }), true);
  assert.equal(E({ date: { season: 'spring', day: 4 } }), false);
  assert.equal(E({ dateFrom: { season: 'spring', day: 2 } }), true);
  assert.equal(E({ dateFrom: { season: 'summer', day: 1 } }), false);
  assert.equal(E({ dateTo: { season: 'spring', day: 3 } }), true);
  assert.equal(E({ dateTo: { season: 'spring', day: 2 } }), false);
  assert.equal(E({ time: { from: '09:00', to: '11:00' } }), true);
  assert.equal(E({ time: { from: '11:00', to: '12:00' } }), false);
  assert.equal(E({ time: { from: '09:00', to: '11:00' } }, { minutes: 700 }), false);
  assert.equal(E({ night: true }), false);
  assert.equal(E({ night: true }, { minutes: 1200 }), true);
  st.player.area = 'bakery';
  assert.equal(E({ area: 'bakery' }), true);
  assert.equal(E({ area: ['harbor', 'bakery'] }), true);
  assert.equal(E({ area: 'harbor' }), false);
  assert.equal(E({ area: 'harbor' }, { area: 'harbor' }), true);
  assert.equal(E({ indoors: true }), true);
  assert.equal(E({ indoors: true }, { area: 'harbor' }), false);
  svc.inventory.add('bread', 3, { silent: true });
  assert.equal(E({ item: { id: 'bread', gte: 3 } }), true);
  assert.equal(E({ item: { id: 'bread', gte: 4 } }), false);
  assert.equal(E({ item: { id: 'carp' } }), false);
  st.player.money = 100;
  assert.equal(E({ money: { gte: 100 } }), true);
  assert.equal(E({ money: { lte: 99 } }), false);
  st.player.energy = 20;
  assert.equal(E({ energy: { lte: 20 } }), true);
  assert.equal(E({ energy: { gte: 21 } }), false);
  assert.equal(E({ quest: { id: 'q_flag', state: 'none' } }), true);
  svc.quests.start('q_flag');
  assert.equal(E({ quest: { id: 'q_flag', state: 'active' } }), true);
  assert.equal(E({ quest: { id: 'q_flag', state: 'active', stage: 0 } }), true);
  assert.equal(E({ quest: { id: 'q_flag', state: 'active', stage: 1 } }), false);
  assert.equal(E({ quest: { id: 'q_flag', state: 'done' } }), false);
  st.story.lanterns = 2;
  assert.equal(E({ lanterns: { gte: 2 } }), true);
  assert.equal(E({ lanterns: { gte: 3 } }), false);
  assert.equal(E({ jobDone: 'bakery_shift' }), false);
  st.jobs.doneDay.bakery_shift = dayNumber(st.time);
  assert.equal(E({ jobDone: 'bakery_shift' }), true);
  assert.equal(E({ festival: true }), false);
  setDate('spring', 14);
  assert.equal(E({ festival: true }), true);
  assert.equal(E({ festival: 'testfest' }), true);
  assert.equal(E({ festival: 'other' }), false);
  // combinators
  assert.equal(E([{ flag: 'f' }, { season: 'spring' }]), true);
  assert.equal(E([{ flag: 'f' }, { season: 'winter' }]), false);
  assert.equal(E({ all: [{ flag: 'f' }, { flag: 'n' }] }), true);
  assert.equal(E({ any: [{ flag: 'zz' }, { flag: 'f' }] }), true);
  assert.equal(E({ any: [{ flag: 'zz' }, { flag: 'yy' }] }), false);
  assert.equal(E({ not: { flag: 'zz' } }), true);
  assert.equal(E({ not: { flag: 'f' } }), false);
});

test('conditions: chance is seeded; unknown primitive warns once and is false', () => {
  setup();
  const E = (c, ctx) => svc.conditions.evalCond(c, ctx);
  assert.equal(E({ chance: 1 }), true);
  assert.equal(E({ chance: 0 }), false);
  const a = E({ chance: 0.5 }, { key: 'x' });
  for (let i = 0; i < 5; i++) assert.equal(E({ chance: 0.5 }, { key: 'x' }), a);
  const outcomes = new Set();
  for (let d = 0; d < 40; d++) {
    Game.state.time.day = 1 + (d % 28);
    Game.state.time.season = Math.floor(d / 28);
    outcomes.add(E({ chance: 0.5 }, { key: 'x' }));
  }
  assert.equal(outcomes.size, 2);
  const warns = [];
  const orig = console.warn;
  console.warn = (...a2) => warns.push(a2.join(' '));
  try {
    assert.equal(E({ bogus: 1 }), false);
    assert.equal(E({ bogus: 2 }), false);
  } finally {
    console.warn = orig;
  }
  assert.equal(warns.length, 1);
});

// ---------- inventory ----------
test('inventory: stacking, leftover, key items, remove/count/has', () => {
  setup();
  const inv = svc.inventory;
  const gains = record(EVT.ITEM_GAIN);
  assert.equal(inv.add('bread', 150), 0);
  assert.equal(inv.count('bread'), 150);
  assert.deepEqual(Game.state.inventory.slots.slice(0, 2).map((s) => s.qty), [99, 51]);
  assert.equal(gains[0].qty, 150);
  inv.add('cottage_key', 2);
  assert.equal(inv.count('cottage_key'), 2);
  assert.ok(Game.state.inventory.slots.filter((s) => s?.id === 'cottage_key').every((s) => s.qty === 1));
  assert.equal(inv.remove('bread', 151), false);
  assert.equal(inv.count('bread'), 150);
  assert.equal(inv.remove('bread', 100), true);
  assert.equal(inv.count('bread'), 50);
  assert.equal(inv.has('bread', 50), true);
  assert.equal(inv.has('bread', 51), false);
});

test('inventory: full pack returns leftover and toasts; give() overflows to chest', () => {
  setup();
  const inv = svc.inventory;
  Game.state.inventory.slots = Game.state.inventory.slots.map(() => ({ id: 'plain', qty: 99 }));
  const left = inv.add('bread', 5);
  assert.equal(left, 5);
  assert.ok(Game.ui.toasts().some((t) => /full/i.test(t)));
  inv.give('cottage_key');
  assert.equal(inv.count('cottage_key'), 0);
  assert.equal(inv.storage.count('cottage_key'), 1);
});

test('inventory: money, energy, spendEnergy refusal, events', () => {
  setup();
  const inv = svc.inventory;
  const money = record(EVT.MONEY_CHANGE);
  const energy = record(EVT.ENERGY_CHANGE);
  inv.addMoney(50);
  assert.equal(Game.state.player.money, 350);
  assert.equal(Game.state.stats.earned, 50);
  assert.equal(inv.spend(400), false);
  assert.equal(inv.spend(100), true);
  assert.equal(Game.state.stats.spent, 100);
  assert.deepEqual(money.map((m) => m.delta), [50, -100]);
  assert.equal(inv.spendEnergy(3), true);
  assert.equal(Game.state.player.energy, 97);
  inv.addEnergy(50);
  assert.equal(Game.state.player.energy, 100);
  inv.setEnergy(0);
  assert.equal(inv.spendEnergy(3), false);
  assert.ok(Game.ui.toasts().some((t) => /tired/i.test(t)));
  assert.equal(inv.spendEnergy(0), true);
  assert.ok(energy.length >= 3);
});

test('inventory: useItem food restores energy and consumes; non-food gives a message', () => {
  setup();
  const inv = svc.inventory;
  Game.state.player.energy = 40;
  inv.add('bread', 2, { silent: true });
  inv.add('rock', 1, { silent: true });
  assert.equal(inv.useItem(0), true);
  assert.equal(Game.state.player.energy, 70);
  assert.equal(inv.count('bread'), 1);
  assert.equal(inv.useItem(1), false);
  assert.equal(inv.count('rock'), 1);
  assert.equal(inv.useItem(5), false);
});

test('inventory: chest deposit/withdraw; storage filled to capacity', () => {
  setup();
  const inv = svc.inventory;
  inv.add('bread', 10, { silent: true });
  assert.equal(inv.storage.deposit(0, 4), 4);
  assert.equal(inv.count('bread'), 6);
  assert.equal(inv.storage.count('bread'), 4);
  assert.equal(inv.storage.slots().length, 48);
  assert.equal(inv.storage.withdraw(0), 4);
  assert.equal(inv.count('bread'), 10);
});

test('intents: ui:useItem / ui:setting via bus', () => {
  setup();
  Game.state.player.energy = 10;
  svc.inventory.add('cookie', 1, { silent: true });
  Game.bus.emit(EVT.UI_USE_ITEM, { slot: 0 });
  assert.equal(Game.state.player.energy, 20);
  Game.bus.emit(EVT.UI_SETTING, { key: 'timeScale', value: 'fast' });
  assert.equal(Game.settings.timeScale, 'fast');
});
