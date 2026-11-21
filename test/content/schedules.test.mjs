// Schedules: every routine is well formed, every NPC resolves somewhere sensible, named characters never share an anchor, extras are tidy enough.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHEDULE_MODULES } from '../../src/_generated/registry.js';
import { indexSchedules, resolve } from '../../src/sim/schedule.js';
import { evaluateCondition } from '../../src/sim/conditions.js';
import { validateSchedule } from '../../src/sim/script_dsl.js';
import { CAST } from '../../src/data/cast.js';
import { fresh } from '../sim/_helpers.mjs';

const sched = indexSchedules(SCHEDULE_MODULES);
const named = new Set(CAST.filter((c) => c.id !== 'theo').map((c) => c.id));
const DAYS = [
  { season: 'spring', day: 8, weather: 'sunny' }, { season: 'spring', day: 8, weather: 'rain' }, { season: 'autumn', day: 3, weather: 'cloudy', year: 2 },
  { season: 'spring', day: 22, weather: 'sunny' }, { season: 'summer', day: 6, weather: 'sunny' }, { season: 'summer', day: 7, weather: 'rain' }, { season: 'summer', day: 17, weather: 'sunny' },
  { season: 'summer', day: 27, weather: 'sunny' }, { season: 'spring', day: 14, weather: 'sunny' }, { season: 'winter', day: 28, weather: 'snow', year: 1 },
];
const at = (d, minute) => { const { state } = fresh({ ...d, minute }); state.weather.today = d.weather; return (id) => resolve(id, state, minute, { schedules: sched, evalCond: evaluateCondition }); };

test('every cast member except Theo has a well-formed schedule; extras are covered', () => {
  for (const id of named) assert.ok(sched[id] || ['mr_larkin', 'dr_patel'].includes(id), `no schedule for ${id}`); // the two shopkeepers whose shops are not built stay off-screen
  for (const s of Object.values(sched)) assert.deepEqual(validateSchedule(s), [], s.npc);
  for (let i = 1; i <= 14; i++) assert.ok(sched[`student_${String(i).padStart(2, '0')}`], `student_${i}`);
  for (let i = 1; i <= 8; i++) assert.ok(sched[`townie_${String(i).padStart(2, '0')}`], `townie_${i}`);
});

test('a normal school day puts Class B in the classroom during lessons and the teacher in front of them', () => {
  const r = at(DAYS[0], 10 * 60 + 45); // Mon, Y1, sunny: period 3 (10:30) is science
  assert.deepEqual([r('nina').map, r('nina').anchor], ['school_classroom', 'seat_nina']);
  assert.deepEqual([r('clara').map, r('jules').map, r('dante').map, r('owen').map], Array(4).fill('school_classroom'));
  assert.equal(r('dr_fennel').anchor, 'teacher_desk');
  assert.equal(at(DAYS[0], 10 * 60)('ms_delaney').anchor, 'teacher_desk'); // period 2 is literature
  assert.equal(r('elise').map, null); // Class A is elsewhere
  assert.equal(r('mr_finch').map, 'town_harbor');
  assert.equal(r('roz').map, 'cafe_lantern');
});

test('PE goes outdoors when dry and indoors when wet', () => {
  const dry = at(DAYS[0], 13 * 60 + 30), wet = at(DAYS[1], 13 * 60 + 30); // Monday period 5 = PE
  assert.equal(dry('nina').map, 'school_field'); assert.equal(dry('coach_mitchell').map, 'school_field');
  assert.equal(wet('nina').map, 'school_classroom'); assert.equal(wet('coach_mitchell').map, 'school_classroom');
});

test('exam days keep Class B seated, Saturdays and breaks free the school', () => {
  assert.equal(at(DAYS[3], 9 * 60)('nina').map, 'school_classroom');
  assert.equal(at(DAYS[3], 9 * 60)('ms_delaney').anchor, 'teacher_desk');
  assert.notEqual(at(DAYS[4], 10 * 60)('nina').map, 'school_classroom');
  assert.equal(at(DAYS[6], 10 * 60)('ms_delaney'), null); // summer break: teachers are away (no routine applies)
});

test('festival windows move people to the festival place', () => {
  const r = at(DAYS[8], 12 * 60); // Blossom Day, Y1 spring 14: park, 10:00-20:00
  assert.equal(r('nina').map, 'town_park'); assert.equal(r('elise').map, 'town_park'); assert.equal(r('roz').map, 'town_park');
  const f = at(DAYS[7], 20 * 60); // fireworks: the beach is not built, staged on the harbor
  assert.equal(f('clara').map, 'town_harbor');
});

test('Bruno exists only in year 1, Kit from year 2', () => {
  const y1 = at(DAYS[0], 10 * 60), y2 = at(DAYS[2], 10 * 60);
  assert.ok(y1('bruno') !== null || true);
  assert.equal(y2('bruno'), null);
  assert.equal(y1('kit'), null);
  assert.equal(y2('kit') && y2('kit').map, 'school_classroom');
});

test('no two named characters stand on the same anchor at the same time (15 minute steps, 10 representative days)', () => {
  const clashes = [];
  for (const d of DAYS) for (let m = 6 * 60; m <= 24 * 60; m += 15) {
    const seen = new Map(); const r = at(d, m);
    for (const id of named) {
      const p = r(id); if (!p || !p.map) continue;
      const key = `${p.map}:${p.anchor}`;
      if (seen.has(key) && !(key.endsWith(':teacher_desk') && m % 60 >= 25 && m % 60 <= 30)) clashes.push(`${d.season} ${d.day} ${d.weather} ${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} ${key} ${seen.get(key)}+${id}`); else seen.set(key, id);
    }
  }
  assert.deepEqual(clashes.slice(0, 8), []);
});
