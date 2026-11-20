import test from 'node:test';
import assert from 'node:assert/strict';
import { resolve, evalCondition, indexSchedules, npcsOnMap, snapshot, activeRoutine } from '../../src/sim/schedule.js';
import { validateSchedule } from '../../src/sim/script_dsl.js';
import { MAP_IDS } from '../../src/data/ids.js';
import { NPC_IDS } from '../../src/data/cast.js';
import { fresh } from './_helpers.mjs';

const t = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

const NINA = {
  npc: 'nina',
  routines: [
    { id: 'default', points: [['06:00', 'bakery:counter', { dir: 'down', activity: 'work' }], ['08:00', 'school_grounds:gate'], ['15:30', 'school_field:track', { activity: 'run' }], ['19:00', 'bakery:counter'], ['22:00', null]] },
    { id: 'school', priority: 10, when: { schoolDay: true }, points: [['06:00', 'town_square:bench_1'], ['08:15', 'school_classroom:desk_nina'], ['12:20', 'school_cafeteria:table_a'], ['13:10', 'school_classroom:desk_nina'], ['15:30', 'school_field:track', { dir: 'right', activity: 'practice' }], ['18:00', 'bakery:counter'], ['23:30', null]] },
    { id: 'rain', priority: 20, when: { all: [{ weather: ['rain', 'storm'] }, { schoolDay: true }] }, points: [['08:15', 'school_classroom:desk_nina'], ['15:30', 'school_gym:court'], ['18:00', 'bakery:counter']] },
    { id: 'festival', priority: 90, when: { festival: 'blossom_day' }, points: [['10:00', 'town_park:picnic_a'], ['20:00', null]] },
    { id: 'summer_night', priority: 5, when: { all: [{ season: 'summer' }, { time: ['23:00', '26:00'] }] }, points: [['00:00', 'beach:shore']] },
  ],
};
const SCH = { nina: NINA };

test('resolve: routine selection by priority and conditions (school day vs weekend vs rain vs festival)', () => {
  // Tue spring 2 sunny: school routine (priority 10) beats default
  const a = fresh({ day: 2 }).state;
  a.weather.today = 'sunny';
  assert.equal(resolve('nina', a, t('09:00'), { schedules: SCH }).routineId, 'school');
  // Saturday: only default matches
  const sat = fresh({ day: 6 }).state;
  assert.equal(resolve('nina', sat, t('09:00'), { schedules: SCH }).routineId, 'default');
  // rainy school day: rain routine wins
  a.weather.today = 'rain';
  const r = resolve('nina', a, t('16:00'), { schedules: SCH });
  assert.equal(r.routineId, 'rain');
  assert.equal(r.map, 'school_gym');
  assert.equal(r.anchor, 'court');
  // rain on a Saturday does NOT use the school-day rain routine
  sat.weather.today = 'rain';
  assert.equal(resolve('nina', sat, t('16:00'), { schedules: SCH }).routineId, 'default');
  // festival priority 90 beats everything (Blossom Day = spring 14, a Saturday)
  const bl = fresh({ day: 14 }).state;
  bl.weather.today = 'rain';
  assert.equal(resolve('nina', bl, t('12:00'), { schedules: SCH }).routineId, 'festival');
  // unknown npc / no schedules -> null
  assert.equal(resolve('jules', a, 600, { schedules: SCH }), null);
  assert.equal(resolve('nina', a, 600), null);
  assert.equal(activeRoutine('nina', a, 600, { schedules: SCH }).id, 'rain');
});

test('resolve: last point with time <= now, exact boundaries, dir/activity/nextPoint', () => {
  const s = fresh({ day: 6 }).state; // Saturday -> default routine
  let r = resolve('nina', s, t('06:00'), { schedules: SCH });
  assert.deepEqual([r.map, r.anchor, r.dir, r.activity, r.pointIndex], ['bakery', 'counter', 'down', 'work', 0]);
  assert.deepEqual(r.nextPoint, { minute: t('08:00'), map: 'school_grounds', anchor: 'gate', dir: null, activity: null });
  r = resolve('nina', s, t('07:59'), { schedules: SCH });
  assert.equal(r.pointIndex, 0);
  r = resolve('nina', s, t('08:00'), { schedules: SCH });
  assert.deepEqual([r.map, r.anchor, r.pointIndex], ['school_grounds', 'gate', 1]);
  r = resolve('nina', s, t('15:30'), { schedules: SCH });
  assert.equal(r.activity, 'run');
  assert.equal(r.dir, null);
});

test('resolve: null points mean off-map, and before the first point the NPC is off-screen', () => {
  const s = fresh({ day: 6 }).state;
  let r = resolve('nina', s, t('22:00'), { schedules: SCH });
  assert.deepEqual([r.map, r.anchor, r.pointIndex, r.nextPoint], [null, null, 4, null]);
  r = resolve('nina', s, t('05:00'), { schedules: SCH });
  assert.deepEqual([r.map, r.anchor, r.pointIndex], [null, null, -1]);
  assert.equal(r.nextPoint.minute, t('06:00'));
  assert.equal(r.routineId, 'default');
});

test('resolve: midnight edge - minutes past 24:00 stay on the same game day', () => {
  const s = fresh({ day: 6 }).state;
  // 23:59 and 24:00/01:30 (1440, 1530) all remain at the last point of the day's routine
  for (const m of [t('23:59'), 1440, 1441, 1530, 26 * 60]) {
    const r = resolve('nina', s, m, { schedules: SCH });
    assert.equal(r.pointIndex, 4, `minute ${m}`);
    assert.equal(r.map, null);
  }
  // a routine whose points run past midnight ('24:30') works with minute 1470
  const late = { npc: 'nina', routines: [{ id: 'late', points: [['18:00', 'beach:shore'], ['24:30', 'beach:pier'], ['25:30', null]] }] };
  assert.equal(resolve('nina', s, 1469, { schedules: { nina: late } }).anchor, 'shore');
  assert.equal(resolve('nina', s, 1470, { schedules: { nina: late } }).anchor, 'pier');
  assert.equal(resolve('nina', s, 1530, { schedules: { nina: late } }).map, null);
  // a `time` condition crossing midnight uses the minute given
  const summer = fresh({ season: 'summer', day: 6 }).state;
  assert.equal(resolve('nina', summer, 1440, { schedules: SCH }).routineId, 'summer_night');
  assert.equal(resolve('nina', summer, t('22:00'), { schedules: SCH }).routineId, 'default');
});

test('ties keep file order; routines without points are ignored; schedules can be an array or registry modules', () => {
  const s = fresh({ day: 2 }).state;
  const sch = { npc: 'x', routines: [
    { id: 'first', priority: 5, points: [['06:00', 'bakery:a']] },
    { id: 'second', priority: 5, points: [['06:00', 'bakery:b']] },
    { id: 'empty', priority: 50, points: [] },
  ] };
  assert.equal(resolve('x', s, 700, { schedules: [sch] }).routineId, 'first');
  assert.equal(resolve('x', s, 700, { schedules: { a: { default: sch } } }).anchor, 'a');
  assert.deepEqual(Object.keys(indexSchedules([sch, { default: [{ npc: 'y', routines: [] }] }])), ['x', 'y']);
});

test('custom evalCond is used when injected (T7b hook point)', () => {
  const s = fresh({ day: 6 }).state;
  const calls = [];
  const evalCond = (cond, st, ctx) => { calls.push([cond, ctx.minute]); return false; };
  const r = resolve('nina', s, 600, { schedules: SCH, evalCond });
  assert.equal(r.routineId, 'default', 'every conditional routine was rejected by the injected evaluator');
  assert.ok(calls.length >= 4);
  assert.equal(calls[0][1], 600);
});

test('built-in evaluator: leaf keys, all/any/not, implicit AND, unknown keys are false', () => {
  const { state } = fresh({ season: 'autumn', day: 13, year: 2 }); // Sports Festival, a Saturday ((13-1) % 7 = 5)
  state.weather.today = 'cloudy';
  state.flags.main_x = true;
  const ev = (c, ctx) => evalCondition(c, state, { minute: t('10:00'), ...ctx });
  assert.equal(ev({ weekday: 'Sat' }), true);
  assert.equal(ev({ weekday: ['Mon', 'Fri'] }), false);
  assert.equal(ev({ weekday: ['Sat', 'Sun'] }), true);
  assert.equal(ev({ schoolDay: true }), false);
  assert.equal(ev({ schoolDay: false }), true);
  assert.equal(ev({ season: ['autumn', 'winter'] }), true);
  assert.equal(ev({ year: [1, 2] }), true);
  assert.equal(ev({ year: 3 }), false);
  assert.equal(ev({ day: [10, 15] }), true);
  assert.equal(ev({ day: 12 }), false);
  assert.equal(ev({ weather: 'cloudy' }), true);
  assert.equal(ev({ flag: 'main_x' }), true);
  assert.equal(ev({ noFlag: 'main_x' }), false);
  assert.equal(ev({ noFlag: 'main_y' }), true);
  assert.equal(ev({ festival: true }), true);
  assert.equal(ev({ festival: 'sports_festival' }), true);
  assert.equal(ev({ festival: 'club_fair' }), false);
  assert.equal(ev({ breakDay: true }), false);
  assert.equal(ev({ time: ['09:00', '10:30'] }), true);
  assert.equal(ev({ time: ['10:00', '10:30'] }), true, 'start inclusive');
  assert.equal(ev({ time: ['09:00', '10:00'] }), false, 'end exclusive');
  assert.equal(ev({ map: 'beach' }, { map: 'beach' }), true);
  assert.equal(ev({ map: ['beach', 'town_park'] }, { map: 'clinic' }), false);
  assert.equal(ev({ map: 'beach' }), false, 'no map in ctx');
  assert.equal(ev({ all: [{ weekday: 'Sat' }, { not: { weather: 'rain' } }] }), true);
  assert.equal(ev({ any: [{ year: 3 }, { flag: 'main_x' }] }), true);
  assert.equal(ev({ not: { any: [{ year: 3 }, { flag: 'main_x' }] } }), false);
  assert.equal(ev({ weekday: 'Sat', weather: 'rain' }), false, 'keys in one object are AND-ed');
  assert.equal(ev({ made_up_key: 1 }), false);
  assert.equal(ev(undefined), true);
  assert.equal(ev({ date: { season: 'autumn', day: 13 } }), true);
  assert.equal(ev({ date: { season: 'autumn', day: 13, year: 1 } }), false);
  state.counters.k = 3;
  state.relationships.nina.friendship = 45;
  assert.equal(ev({ counter: ['k', '>=', 3] }), true);
  assert.equal(ev({ hearts: ['nina', '>=', 4] }), true);
  assert.equal(ev({ friendship: ['nina', '>', 45] }), false);
  // break weekdays are not school days
  const brk = fresh({ season: 'summer', day: 16 }).state;
  assert.equal(evalCondition({ breakDay: true }, brk), true);
  assert.equal(evalCondition({ schoolDay: false }, brk), true);
});

test('npcsOnMap and snapshot list who stands where', () => {
  const s = fresh({ day: 6 }).state;
  const sch = { nina: NINA, jules: { npc: 'jules', routines: [{ id: 'd', points: [['07:00', 'bakery:door'], ['12:00', 'beach:shore']] }] } };
  const on = npcsOnMap(s, 'bakery', t('09:00'), { schedules: sch });
  assert.deepEqual(on.map((e) => [e.npc, e.anchor]), [['jules', 'door']]);
  assert.deepEqual(npcsOnMap(s, 'bakery', t('06:30'), { schedules: sch }).map((e) => e.npc), ['nina']);
  const snap = snapshot(s, t('13:00'), { schedules: sch });
  assert.equal(snap.jules.map, 'beach');
  assert.equal(snap.nina.map, 'school_grounds');
});

test('the sample schedule above is valid against the DSL validator', () => {
  const ctx = { npcIds: new Set(NPC_IDS), mapIds: new Set(MAP_IDS) };
  assert.deepEqual(validateSchedule(NINA, ctx), []);
});
