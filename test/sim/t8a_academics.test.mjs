// Academic rules: timetable, school-day phases, attendance, class sessions, studying, grades.
import test from 'node:test';
import assert from 'node:assert/strict';
import { TIMETABLE, TEACHER, subjectAt, teacherOf, lessonsOn, roomFor, isAcademic } from '../../src/data/timetable.js';
import {
  schoolPhase, recordAttendance, markMissedPeriods, finalizeSchoolDay, attendanceToday, applyClass, hasPopQuiz, study,
  letterGrade, standingFor, minutesLeft, lessonToday, SKIPS_FOR_DETENTION,
} from '../../src/sim/academics.js';
import { SUBJECTS } from '../../src/core/constants.js';
import { parseTime } from '../../src/core/util.js';
import { fresh } from './_helpers.mjs';

const T = parseTime;
const wed = (extra = {}) => fresh({ season: 'spring', day: 3, minute: T('08:25'), seed: 4, ...extra }); // Wed, plain school day

test('timetable matches the design doc and every subject is taught weekly', () => {
  assert.equal(TIMETABLE.length, 5);
  for (const row of TIMETABLE) assert.equal(row.length, 6);
  assert.deepEqual(TIMETABLE[0], ['math', 'literature', 'science', 'history', 'pe', 'pe']);
  assert.deepEqual(TIMETABLE[2], ['science', 'math', 'literature', 'pe', 'history', 'self_study']);
  assert.deepEqual(TIMETABLE[4].slice(-1), ['cleanup']);
  for (const s of SUBJECTS) assert.ok(TIMETABLE.flat().includes(s), `${s} is never taught`);
  assert.equal(subjectAt(0, 1), 'math'); assert.equal(subjectAt(1, 6), 'art'); assert.equal(subjectAt(5, 1), null); assert.equal(subjectAt(0, 7), null);
  assert.equal(teacherOf('math'), 'mr_brandt'); assert.equal(teacherOf('pe'), 'coach_mitchell'); assert.equal(teacherOf('nope'), null);
  for (const s of SUBJECTS) assert.ok(TEACHER[s]);
  assert.deepEqual(lessonsOn(3).map((l) => l.subject), TIMETABLE[3]);
  assert.equal(isAcademic('math'), true); assert.equal(isAcademic('cleanup'), false);
});

test('PE moves indoors in bad weather; everything else is the classroom', () => {
  assert.equal(roomFor('pe', 'sunny'), 'school_field'); assert.equal(roomFor('pe', 'cloudy'), 'school_field');
  for (const w of ['rain', 'storm', 'snow']) assert.equal(roomFor('pe', w), 'school_classroom');
  assert.equal(roomFor('math', 'sunny'), 'school_classroom');
});

test('schoolPhase walks through the bell schedule', () => {
  const p = (hhmm) => schoolPhase(T(hhmm));
  assert.equal(p('08:00').phase, 'pre');
  assert.deepEqual([p('08:25').phase, p('08:25').next], ['homeroom', 1]);
  assert.deepEqual([p('08:30').phase, p('08:30').period, p('08:30').late, p('08:30').graceOpen], ['period', 1, false, true]);
  assert.deepEqual([p('08:40').late, p('08:40').graceOpen], [true, true]);
  assert.deepEqual([p('08:41').late, p('08:41').graceOpen], [true, false]);
  assert.deepEqual([p('09:25').phase, p('09:25').next], ['break', 2]);
  assert.equal(p('12:00').period, 4);
  assert.deepEqual([p('12:30').phase, p('12:30').next], ['lunch', 5]);
  assert.equal(p('13:10').period, 5);
  assert.equal(p('15:00').phase, 'break');
  assert.equal(p('15:10').phase, 'after'); assert.equal(p('18:00').phase, 'after');
  assert.equal(minutesLeft(1, T('08:36')), 44);
});

test('recordAttendance: present / late / absent, conduct, counters, idempotent', () => {
  const { state } = wed();
  assert.equal(recordAttendance(state, 1, 'present'), 'present');
  assert.equal(recordAttendance(state, 2, 'late'), 'late');
  assert.equal(recordAttendance(state, 3, 'absent'), 'absent');
  assert.equal(state.player.conduct, 80 - 1 - 2);
  assert.deepEqual([state.school.attendance.present, state.school.attendance.late, state.school.attendance.absent], [1, 1, 1]);
  assert.equal(state.stats.daysSkippedClass, 1);
  assert.equal(recordAttendance(state, 3, 'present'), 'absent'); // first record wins
  assert.equal(state.school.attendance.absent, 1);
  assert.equal(recordAttendance(state, 'homeroom', 'absent'), 'absent');
  assert.equal(state.daily.missedHomeroom, true); assert.equal(state.school.attendance.absent, 1); // homeroom has no conduct/counters
  assert.deepEqual(attendanceToday(state), { 1: 'present', 2: 'late', 3: 'absent', homeroom: 'absent' });
});

test('the 5th skipped period of a term sets detention_pending (once per 5)', () => {
  const { state } = wed();
  for (let n = 1; n <= SKIPS_FOR_DETENTION - 1; n++) recordAttendance(state, n, 'absent');
  assert.equal(state.flags.detention_pending, undefined);
  recordAttendance(state, 5, 'absent');
  assert.equal(state.flags.detention_pending, true);
  assert.equal(state.stats.daysSkippedClass, 5);
  const { state: s2 } = wed();
  for (let n = 1; n <= 4; n++) recordAttendance(s2, n, 'absent');
  s2.time.season = 'autumn'; s2.time.absDay += 100; s2.school.attendance.today = {}; // next term: its own counter
  recordAttendance(s2, 1, 'absent');
  assert.equal(s2.flags.detention_pending, undefined);
});

test('markMissedPeriods respects the grace window and only runs on lesson days', () => {
  const { state } = wed({ minute: T('08:35') });
  assert.deepEqual(markMissedPeriods(state, T('08:35')), []); // period 1 still joinable (grace until 08:40)
  assert.equal(attendanceToday(state).homeroom, 'absent'); // homeroom window is over and nobody was there
  assert.deepEqual(markMissedPeriods(state, T('08:41')), [1]);
  assert.deepEqual(markMissedPeriods(state, T('09:45')), [2]);
  assert.equal(attendanceToday(state)[1], 'absent');
  assert.deepEqual(finalizeSchoolDay(state), [3, 4, 5, 6]);
  assert.equal(state.stats.daysSkippedClass, 6);
  const sat = fresh({ season: 'spring', day: 6 }).state;
  assert.deepEqual(finalizeSchoolDay(sat), []); // weekend
  const exam = fresh({ season: 'spring', day: 22 }).state;
  assert.deepEqual(finalizeSchoolDay(exam), []); // exam day: no lessons
  const brk = fresh({ season: 'summer', day: 16 }).state;
  assert.deepEqual(finalizeSchoolDay(brk), []); // summer break
  const cer = fresh({ season: 'spring', day: 1 }).state;
  assert.deepEqual(finalizeSchoolDay(cer), []); // entrance ceremony cancels classes
});

test('lessonToday gives the subject on lesson days and null otherwise', () => {
  assert.equal(lessonToday(wed().state, 1), 'science');
  assert.equal(lessonToday(fresh({ season: 'spring', day: 6 }).state, 1), null);
  assert.equal(lessonToday(fresh({ season: 'spring', day: 22 }).state, 1), null);
});

test('class choices: listen / notes / doze / pass a note', () => {
  const run = (choice, extra = {}, prep) => { const { state } = wed(); state.player.energy = 50; if (prep) prep(state); return { state, r: applyClass(state, { subject: 'math', period: 2, choice, ...extra }) }; };
  let { state, r } = run('listen');
  assert.equal(r.gains.math, 2); assert.equal(state.player.subjects.math, 12);
  ({ state, r } = run('notes'));
  assert.equal(r.gains.math, 3); assert.equal(r.energy, -2); assert.equal(state.player.energy, 48);
  ({ state, r } = run('doze'));
  assert.equal(r.gains.math, undefined); assert.equal(r.energy, 5); assert.equal(state.player.energy, 55); assert.equal(r.conduct, -1); assert.equal(state.player.conduct, 79);
  ({ state, r } = run('pass_note'));
  assert.equal(r.gains.math, 1); assert.equal(state.player.traits.charm, 11);
  assert.equal(r.conduct, r.caught ? -2 : 0);
  ({ state, r } = run('listen', { quiz: true })); assert.equal(r.gains.math, 4);
  ({ state, r } = run('listen', { quiz: false })); assert.equal(r.gains.math, 2);
  ({ state, r } = run('listen', { late: true })); assert.equal(r.gains.math, 1);
  ({ state, r } = run('doze', { late: true })); assert.equal(r.gains.math, undefined);
});

test('class: diminishing returns above 70, trait bonuses, non-lessons give nothing, subject is tracked for decay', () => {
  const { state } = wed();
  state.player.subjects.math = 75;
  assert.equal(applyClass(state, { subject: 'math', choice: 'listen' }).gains.math, 1); // round(2 * 0.6) = 1
  assert.equal(state.player.subjectTrack.math.absDay, state.time.absDay);
  const pe = applyClass(state, { subject: 'pe', choice: 'listen' }); assert.equal(pe.traits.fitness, 1);
  const art = applyClass(state, { subject: 'art', choice: 'listen' }); assert.equal(art.traits.creativity, 1);
  const none = applyClass(state, { subject: 'self_study', choice: 'listen' });
  assert.deepEqual(none.gains, {}); assert.equal(none.conduct, 0);
});

test('being caught passing notes is deterministic and about 40% likely', () => {
  const caught = (seed, day) => { const { state } = wed({ seed }); state.time.absDay = day; return applyClass(state, { subject: 'math', period: 3, choice: 'pass_note' }).caught; };
  assert.equal(caught(9, 5), caught(9, 5));
  let hits = 0; for (let d = 0; d < 300; d++) if (caught(9, d)) hits++;
  assert.ok(hits > 90 && hits < 150, `expected ~120 of 300, got ${hits}`);
  let quizzes = 0; const { state } = wed(); for (let d = 0; d < 400; d++) { state.time.absDay = d; if (hasPopQuiz(state, 1)) quizzes++; }
  assert.ok(quizzes > 70 && quizzes < 130, `pop quizzes: ${quizzes}`);
});

test('study: energy, time, gain range, library, books, tiredness, early stop, errors', () => {
  let { state } = wed({ minute: T('16:00') });
  let r = study(state, { subject: 'science', hours: 1, place: 'home' });
  assert.equal(r.ok, true); assert.equal(r.energyCost, 12); assert.equal(state.player.energy, 88); assert.equal(r.minutes, 60);
  assert.equal(state.time.minute, T('17:00')); assert.equal(state.daily.studied, 1);
  assert.ok(r.gain >= 2 && r.gain <= 4, `home gain ${r.gain}`);
  assert.equal(state.player.subjectTrack.science.absDay, state.time.absDay);

  ({ state } = wed()); r = study(state, { subject: 'science', hours: 1, place: 'library' });
  assert.ok(r.gain >= 3 && r.gain <= 5, `library gain ${r.gain}`);

  ({ state } = wed()); state.inventory.textbook_math = 1; state.inventory.textbook_science = 1;
  r = study(state, { subject: 'math', hours: 1, place: 'library' });
  assert.ok(r.gain >= 4 && r.gain <= 6, `book + library gain ${r.gain}`); // 2..4 + 1 (math book) + 1 (library)

  ({ state } = wed()); state.player.energy = 20; // tired: -2, never below 1
  r = study(state, { subject: 'art', hours: 1 });
  assert.ok(r.gain >= 1 && r.gain <= 2, `tired gain ${r.gain}`);

  ({ state } = wed()); state.player.energy = 30; // 3 hours requested, energy for two (30 -> 18 -> 6)
  r = study(state, { subject: 'history', hours: 3 });
  assert.equal(r.hours, 2); assert.equal(r.minutes, 120); assert.equal(state.player.energy, 6);

  ({ state } = wed()); state.player.subjects.math = 80;
  r = study(state, { subject: 'math', hours: 1 });
  assert.ok(r.gain >= 1 && r.gain <= 3, `diminished gain ${r.gain}`); // (2..4) * 0.6, rounded, at least 1

  ({ state } = wed()); const t0 = state.time.minute;
  assert.equal(study(state, { subject: 'math', hours: 1 }, { advanceClock: false }).ok, true);
  assert.equal(state.time.minute, t0);

  ({ state } = wed()); state.player.energy = 5;
  assert.deepEqual([study(state, { subject: 'math' }).reason, study(wed().state, { subject: 'cooking' }).reason, study(wed().state, { subject: 'math', hours: 0 }).reason,
    study(wed().state, { subject: 'math', hours: 4 }).reason, study(wed().state, { subject: 'math', hours: 1.5 }).reason], ['too_tired', 'bad_subject', 'bad_hours', 'bad_hours', 'bad_hours']);
});

test('study is deterministic and varies from hour to hour', () => {
  const gains = (seed) => { const { state } = wed({ seed }); return study(state, { subject: 'math', hours: 3 }, { advanceClock: false }).perHour; };
  assert.deepEqual(gains(5), gains(5));
  const seen = new Set(); for (let s = 1; s < 40; s++) gains(s).forEach((g) => seen.add(g));
  assert.ok(seen.size >= 3, 'study gains should vary');
});

test('letter grades and standing bands', () => {
  assert.deepEqual([100, 90, 89, 80, 79, 70, 69, 55, 54, 0].map(letterGrade), ['A', 'A', 'B', 'B', 'C', 'C', 'D', 'D', 'F', 'F']);
  assert.deepEqual([100, 85, 84.9, 70, 69.9, 55, 54.9, 0].map(standingFor), ['honors', 'honors', 'good', 'good', 'fair', 'fair', 'probation', 'probation']);
});
