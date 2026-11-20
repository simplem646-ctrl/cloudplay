import test from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, WEEKDAYS } from '../../src/core/constants.js';
import { dayInfo, absDayOf, fromAbsDay, nextFestival, upcoming, dateLabel, addDays, isFinaleDay, TOTAL_DAYS } from '../../src/sim/calendar.js';
import { fresh } from './_helpers.mjs';

test('weekday mapping: every season starts on Monday, exact weekdays', () => {
  for (const season of SEASONS) {
    for (let day = 1; day <= 28; day++) {
      const d = dayInfo({ year: 2, season, day });
      assert.equal(d.weekday, WEEKDAYS[(day - 1) % 7], `${season} ${day}`);
      assert.equal(d.weekdayIndex, (day - 1) % 7);
    }
    assert.equal(dayInfo({ year: 1, season, day: 1 }).weekday, 'Mon');
    assert.equal(dayInfo({ year: 1, season, day: 28 }).weekday, 'Sun');
  }
  assert.equal(dayInfo({ year: 1, season: 'spring', day: 6 }).weekday, 'Sat');
  assert.equal(dayInfo({ year: 3, season: 'winter', day: 22 }).weekday, 'Mon'); // board decision
});

test('absDay and fromAbsDay are inverse across the whole game', () => {
  assert.equal(absDayOf({ year: 1, season: 'spring', day: 1 }), 0);
  assert.equal(absDayOf({ year: 1, season: 'summer', day: 1 }), 28);
  assert.equal(absDayOf({ year: 2, season: 'spring', day: 1 }), 112);
  assert.equal(absDayOf({ year: 3, season: 'winter', day: 28 }), TOTAL_DAYS - 1);
  for (let a = 0; a < TOTAL_DAYS; a++) assert.equal(absDayOf(fromAbsDay(a)), a);
  assert.deepEqual(fromAbsDay(111), { year: 1, season: 'winter', day: 28, absDay: 111 });
  assert.deepEqual(fromAbsDay(112), { year: 2, season: 'spring', day: 1, absDay: 112 });
  assert.equal(absDayOf(fresh({ season: 'autumn', day: 9 }).state), 56 + 8);
  assert.deepEqual(addDays({ year: 1, season: 'spring', day: 28 }, 1), { year: 1, season: 'summer', day: 1, absDay: 28 });
});

test('school day rules: weekends, breaks, cancelled festival days, exam days', () => {
  assert.equal(dayInfo({ year: 1, season: 'spring', day: 1 }).isSchoolDay, false, 'entrance ceremony cancels classes');
  assert.equal(dayInfo({ year: 1, season: 'spring', day: 1 }).classesCancelled, true);
  assert.equal(dayInfo({ year: 1, season: 'spring', day: 2 }).isSchoolDay, true);
  assert.equal(dayInfo({ year: 1, season: 'spring', day: 6 }).isSchoolDay, false, 'Saturday');
  const club = dayInfo({ year: 1, season: 'spring', day: 5 });
  assert.equal(club.festival.id, 'club_fair');
  assert.equal(club.isSchoolDay, true, 'club fair does not cancel lessons');
  assert.equal(dayInfo({ year: 1, season: 'summer', day: 14 }).isBreak, false);
  const br = dayInfo({ year: 1, season: 'summer', day: 15 }); // Monday of summer break
  assert.equal(br.isBreak, true);
  assert.equal(br.isSchoolDay, false);
  assert.equal(dayInfo({ year: 1, season: 'winter', day: 26 }).isSchoolDay, false, 'closing ceremony');
  const ex = dayInfo({ year: 1, season: 'spring', day: 23 });
  assert.equal(ex.exam.id, 'midterm1');
  assert.deepEqual(ex.exam.subjects, ['science', 'history']);
  assert.equal(ex.isSchoolDay, true);
  assert.equal(ex.hasLessons, false);
  const res = dayInfo({ year: 1, season: 'spring', day: 26 });
  assert.equal(res.examResults.id, 'midterm1');
  assert.equal(res.exam, null);
  assert.equal(dayInfo({ year: 1, season: 'spring', day: 3 }).hasLessons, true);
});

test('dayInfo: terms, birthdays, festival object, accepts state or date', () => {
  assert.equal(dayInfo({ year: 1, season: 'summer', day: 3 }).termIndex, 0);
  assert.equal(dayInfo({ year: 1, season: 'autumn', day: 3 }).termIndex, 1);
  assert.equal(dayInfo({ year: 3, season: 'winter', day: 3 }).termIndex, 5);
  assert.deepEqual(dayInfo({ year: 1, season: 'summer', day: 9 }).birthdays, ['nina']);
  assert.deepEqual(dayInfo({ year: 1, season: 'spring', day: 10 }).birthdays, ['jules']);
  assert.deepEqual(dayInfo({ year: 1, season: 'spring', day: 11 }).birthdays, []);
  const theo = dayInfo({ year: 1, season: 'autumn', day: 9 });
  assert.equal(theo.playerBirthday, true);
  assert.ok(!theo.birthdays.includes('theo'));
  const { state } = fresh({ season: 'autumn', day: 27 });
  const d = dayInfo(state);
  assert.equal(d.festival.id, 'bell_festival');
  assert.equal(d.absDay, state.time.absDay);
  assert.equal(dateLabel(state, { weekday: true }), 'Autumn 27, Year 1 (Sat)');
  assert.equal(isFinaleDay({ year: 3, season: 'winter', day: 28 }), true);
  assert.equal(isFinaleDay({ year: 2, season: 'winter', day: 28 }), false);
});

test('nextFestival and upcoming', () => {
  const { state } = fresh({ season: 'spring', day: 6 });
  const nf = nextFestival(state);
  assert.equal(nf.festival.id, 'blossom_day');
  assert.equal(nf.daysUntil, 8);
  assert.deepEqual(nf.date, { year: 1, season: 'spring', day: 14, absDay: 13 });
  // today counts unless excluded; a running multi-day festival counts as today
  const bell = fresh({ season: 'autumn', day: 28 }).state;
  assert.equal(nextFestival(bell).festival.id, 'bell_festival');
  assert.equal(nextFestival(bell).daysUntil, 0);
  assert.equal(nextFestival(bell, { includeToday: false }).festival.id, 'lantern_night');
  // after the last festival of the game there is none
  assert.equal(nextFestival({ year: 3, season: 'winter', day: 28 }, { includeToday: false }), null);
  const up = upcoming(state, 4);
  assert.equal(up.length, 4);
  assert.deepEqual(up.map((u) => u.type), ['festival', 'exam', 'results', 'exam']);
  assert.ok(up.every((u, i) => i === 0 || u.absDay >= up[i - 1].absDay));
  assert.ok(up.every((u) => u.daysUntil > 0));
  // birthdays only for NPCs the player has met (Aunt Roz starts met)
  assert.deepEqual(upcoming(state, 20, { types: ['birthday'], horizon: 112 }).map((u) => u.id), ['roz']);
  state.relationships.jules.met = true;
  assert.deepEqual(upcoming(state, 20, { types: ['birthday'], horizon: 112 }).map((u) => u.id), ['jules', 'roz']);
});
