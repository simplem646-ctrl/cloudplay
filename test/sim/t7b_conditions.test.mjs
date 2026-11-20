// Condition evaluator: every leaf of COND_LEAVES has a true and a false case; combinators; safety.
import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateCondition as ev, safeCondition, compare, latestExam } from '../../src/sim/conditions.js';
import { COND_LEAVES, validateCondition, all, any, not } from '../../src/sim/script_dsl.js';
import { fresh } from './_helpers.mjs';

// Year 2, Autumn 13 (Sat): Sports Festival, no lessons, 10:00.
function world() {
  const { state } = fresh({ year: 2, season: 'autumn', day: 13, minute: 600, seed: 7 });
  state.flags.met_cat = true;
  state.counters.runs = 3;
  state.relationships.nina.friendship = 45;
  state.player.map = 'town_square';
  state.weather.today = 'rain';
  state.inventory.bread = 2;
  state.player.money = 500;
  state.player.energy = 50;
  state.player.subjects.math = 55;
  state.school.spirit = 60;
  state.school.average = 71;
  state.events.seen.intro = { count: 1, lastAbsDay: 0 };
  state.quests.q1 = { state: 'active', startedAbsDay: 0, notes: [] };
  state.romance.dating.nina = { sinceAbsDay: 10 };
  state.romance.confessed.nina = true;
  return state;
}

// [condition, expected] pairs: at least one true and one false per leaf key.
const TABLE = [
  [{ flag: 'met_cat' }, true], [{ flag: 'nope' }, false],
  [{ noFlag: 'nope' }, true], [{ noFlag: 'met_cat' }, false],
  [{ counter: ['runs', '>=', 3] }, true], [{ counter: ['runs', '>', 3] }, false], [{ counter: ['unset', '==', 0] }, true],
  [{ hearts: ['nina', '>=', 4] }, true], [{ hearts: ['nina', '>=', 5] }, false],
  [{ friendship: ['nina', '==', 45] }, true], [{ friendship: ['nina', '<', 45] }, false],
  [{ year: 2 }, true], [{ year: [1, 2] }, true], [{ year: 3 }, false],
  [{ season: 'autumn' }, true], [{ season: ['spring', 'autumn'] }, true], [{ season: 'winter' }, false],
  [{ day: 13 }, true], [{ day: [10, 15] }, true], [{ day: 14 }, false],
  [{ date: { season: 'autumn', day: 13 } }, true], [{ date: { season: 'autumn', day: 13, year: 2 } }, true], [{ date: { season: 'autumn', day: 13, year: 1 } }, false],
  [{ weekday: 'Sat' }, true], [{ weekday: ['Fri', 'Sat'] }, true], [{ weekday: 'Mon' }, false],
  [{ schoolDay: false }, true], [{ schoolDay: true }, false],
  [{ time: ['09:00', '11:00'] }, true], [{ time: ['12:00', '13:00'] }, false],
  [{ map: 'town_square' }, true], [{ map: ['school_grounds', 'town_square'] }, true], [{ map: 'cafe_lantern' }, false],
  [{ weather: 'rain' }, true], [{ weather: ['sunny', 'cloudy'] }, false],
  [{ item: ['bread', '>=', 2] }, true], [{ item: ['bread', '>', 2] }, false], [{ item: ['sunflower', '==', 0] }, true],
  [{ money: ['>=', 500] }, true], [{ money: ['<', 500] }, false],
  [{ energy: ['<=', 50] }, true], [{ energy: ['>', 50] }, false],
  [{ stat: ['math', '>=', 50] }, true], [{ stat: ['charm', '<', 20] }, true], [{ stat: ['conduct', '>=', 80] }, true], [{ stat: ['math', '>', 90] }, false],
  [{ club: null }, true], [{ club: 'art' }, false],
  [{ job: null }, true], [{ job: 'cafe' }, false],
  [{ partner: null }, true], [{ partner: 'nina' }, false],
  [{ dating: 'nina' }, true], [{ dating: 'elise' }, false],
  [{ confessed: 'nina' }, true], [{ confessed: 'elise' }, false],
  [{ seen: 'intro' }, true], [{ seen: 'later' }, false],
  [{ notSeen: 'later' }, true], [{ notSeen: 'intro' }, false],
  [{ quest: ['q1', 'active'] }, true], [{ quest: ['q1', 'complete'] }, false], [{ quest: ['zz', 'none'] }, true],
  [{ spirit: ['>=', 60] }, true], [{ spirit: ['>', 60] }, false],
  [{ rank: ['<=', 3] }, false], // no exam taken yet: a missing value fails every comparison
  [{ average: ['>=', 70] }, true], [{ average: ['>=', 80] }, false],
  [{ standing: 'good' }, true], [{ standing: ['honors', 'good'] }, true], [{ standing: 'probation' }, false],
  [{ chance: 1 }, true], [{ chance: 0 }, false],
  [{ festival: true }, true], [{ festival: 'sports_festival' }, true], [{ festival: 'moon_night' }, false],
  [{ breakDay: false }, true], [{ breakDay: true }, false],
];

test('every COND_LEAVES key has a table case, and every case validates', () => {
  const covered = new Set(TABLE.flatMap(([c]) => Object.keys(c)));
  for (const k of Object.keys(COND_LEAVES)) assert.ok(covered.has(k), `no test case for condition leaf "${k}"`);
  for (const [c] of TABLE) assert.deepEqual(validateCondition(c), [], JSON.stringify(c));
});

test('each leaf evaluates as expected', () => {
  const s = world();
  for (const [c, want] of TABLE) assert.equal(ev(c, s), want, JSON.stringify(c));
});

test('context overrides (map, minute) beat state', () => {
  const s = world();
  assert.equal(ev({ map: 'bakery' }, s, { map: 'bakery' }), true);
  assert.equal(ev({ map: 'town_square' }, s, { map: 'bakery' }), false);
  assert.equal(ev({ time: ['12:00', '13:00'] }, s, { minute: 750 }), true);
});

test('club / job / partner leaves with values set', () => {
  const s = world();
  s.school.club = 'art'; s.school.job = 'cafe'; s.romance.partner = 'nina';
  assert.equal(ev({ club: 'art' }, s), true); assert.equal(ev({ club: null }, s), false); assert.equal(ev({ club: 'track' }, s), false);
  assert.equal(ev({ job: 'cafe' }, s), true); assert.equal(ev({ job: null }, s), false);
  assert.equal(ev({ partner: 'nina' }, s), true); assert.equal(ev({ partner: null }, s), false);
});

test('rank uses the most recent exam; compare treats missing values as failing', () => {
  const s = world();
  assert.equal(latestExam(s), null);
  s.school.exams.Y1_midterm1 = { rank: 9 };
  s.school.exams.Y1_final1 = { rank: 2 };
  assert.equal(latestExam(s).rank, 2);
  assert.equal(ev({ rank: ['<=', 3] }, s), true);
  assert.equal(ev({ rank: ['==', 9] }, s), false);
  assert.equal(compare(null, '>=', 0), false);
  assert.equal(compare(undefined, '<', 5), false);
  assert.equal(compare(NaN, '==', NaN), false);
  assert.equal(compare(null, '!=', 3), true);
});

test('festival / breakDay / schoolDay follow the calendar', () => {
  const s = world();
  s.time.season = 'autumn'; s.time.day = 14; // Sun, no festival
  assert.equal(ev({ festival: true }, s), false);
  s.time.season = 'summer'; s.time.day = 16; // Mon during Summer Break
  assert.equal(ev({ breakDay: true }, s), true);
  assert.equal(ev({ schoolDay: true }, s), false);
  s.time.season = 'spring'; s.time.day = 3; // plain Wednesday
  assert.equal(ev({ schoolDay: true }, s), true);
  assert.equal(ev({ weekday: 'Wed' }, s), true);
});

test('all / any / not and empty conditions', () => {
  const s = world();
  assert.equal(ev(undefined, s), true);
  assert.equal(ev(null, s), true);
  assert.equal(ev(all({ flag: 'met_cat' }, { year: 2 }), s), true);
  assert.equal(ev(all({ flag: 'met_cat' }, { year: 3 }), s), false);
  assert.equal(ev(any({ year: 3 }, { season: 'autumn' }), s), true);
  assert.equal(ev(any({ year: 3 }, { season: 'winter' }), s), false);
  assert.equal(ev(not({ flag: 'met_cat' }), s), false);
  assert.equal(ev(not(all({ year: 3 }, { flag: 'x' })), s), true);
  assert.equal(ev({ flag: 'met_cat', year: 2, season: 'autumn' }, s), true); // implicit AND of sibling keys
  assert.equal(ev({ flag: 'met_cat', year: 3 }, s), false);
  assert.equal(ev(all(any({ year: 1 }, { year: 2 }), not({ weather: 'sunny' })), s), true); // nesting
});

test('chance is deterministic per seed/day/event and roughly honours its probability', () => {
  const s = world();
  const a = ev({ chance: 0.5 }, s, { eventId: 'e1' });
  for (let i = 0; i < 5; i++) assert.equal(ev({ chance: 0.5 }, s, { eventId: 'e1' }), a);
  let hits = 0;
  for (let d = 1; d <= 200; d++) { s.time.absDay = d; if (ev({ chance: 0.3 }, s, { eventId: 'e2' })) hits++; }
  assert.ok(hits > 30 && hits < 90, `expected ~60 of 200 hits at p=0.3, got ${hits}`);
});

test('unknown keys throw in evaluateCondition and are swallowed (false) by safeCondition', () => {
  const s = world();
  assert.throws(() => ev({ bogus: 1 }, s), /unknown condition key/);
  const orig = console.error; console.error = () => {};
  try { assert.equal(safeCondition({ bogus: 1 }, s), false); } finally { console.error = orig; }
  assert.equal(safeCondition({ flag: 'met_cat' }, s), true);
});
