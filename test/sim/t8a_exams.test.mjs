// Exams, exam-day timing, results day, class ranking, the school director, the night hook and a whole simulated school year.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hintStrikes, pickQuestions, struckChoices, prepareSubject, scoreSitting, submitSubject, missSubject, examDirective, markMissedExams,
  processResults, classmateAverages, rankAmong, examKey, defaultBanks, peekPending, resultsDue, QUESTIONS_PER_YEAR,
} from '../../src/sim/exams.js';
import { schoolDirector, weakestSubject } from '../../src/sim/school_director.js';
import { academicsNightHook, registerAcademics } from '../../src/sim/academics_index.js';
import { recordAttendance, applyClass, study, attendanceToday, standingFor } from '../../src/sim/academics.js';
import { createHookRegistry, sleep, listNewDayHooks } from '../../src/sim/clock.js';
import { dayInfo } from '../../src/sim/calendar.js';
import { SUBJECTS } from '../../src/core/constants.js';
import { parseTime } from '../../src/core/util.js';
import { rngFor } from '../../src/core/rng.js';
import { fresh, named } from './_helpers.mjs';

const T = parseTime;
const BANKS = defaultBanks();
const examDay = (extra = {}) => fresh({ season: 'spring', day: 22, minute: T('08:20'), seed: 21, ...extra }); // Mon: midterm1 day 1 (math, literature)
const answersFor = (prep, ratio, seed = 1) => { const rng = rngFor(`ans:${seed}`); return prep.questions.map((q) => (rng.next() < ratio ? q.correct : (q.correct + 1) % 4)); };

test('the real question banks exist for all six subjects', () => {
  for (const s of SUBJECTS) assert.ok(BANKS[s] && BANKS[s].length >= 12, `bank for ${s}`);
});

test('hint levels: 40+ strikes one wrong choice, 70+ two', () => {
  assert.deepEqual([0, 39, 40, 69, 70, 100].map(hintStrikes), [0, 0, 1, 1, 2, 2]);
});

test('pickQuestions: right count per year, distinct, deterministic, tier mix by year, varies by exam', () => {
  const pick = (year, key = 'Y1_midterm1', subject = 'math', seed = 5) => pickQuestions(BANKS[subject], { seed, key, subject, year });
  for (const y of [1, 2, 3]) {
    const qs = pick(y);
    assert.equal(qs.length, QUESTIONS_PER_YEAR[y]);
    assert.equal(new Set(qs.map((q) => q.q)).size, qs.length);
  }
  assert.deepEqual(pick(1).map((q) => q.q), pick(1).map((q) => q.q));
  assert.ok(pick(1).every((q) => q.tier <= 2), 'year 1 never asks tier 3');
  assert.ok(pick(3).every((q) => q.tier >= 2), 'year 3 never asks tier 1');
  const sels = new Set(); for (const k of ['midterm1', 'final1', 'midterm2', 'final2']) sels.add(pick(1, `Y1_${k}`).map((q) => q.q).join('|'));
  assert.ok(sels.size >= 3, 'different exams should not all ask the same questions');
  const small = pickQuestions(BANKS.math.slice(0, 4), { seed: 1, key: 'k', subject: 'math', year: 3 });
  assert.equal(small.length, 4); // never asks for more than the bank holds
});

test('struckChoices never removes the right answer and is stable', () => {
  const q = BANKS.science[0];
  for (const n of [0, 1, 2]) {
    const s = struckChoices(q, n, 'Y1_final1');
    assert.equal(s.length, n); assert.ok(!s.includes(q.correct));
    assert.deepEqual(s, struckChoices(q, n, 'Y1_final1'));
  }
});

test('prepareSubject builds a sitting with hints from knowledge', () => {
  const { state } = examDay();
  state.player.subjects.math = 45; state.player.subjects.literature = 85;
  const m = prepareSubject(state, 'math');
  assert.equal(m.key, 'Y1_midterm1'); assert.equal(m.total, 6); assert.equal(m.strikes, 1); assert.equal(m.practical, null);
  assert.ok(m.questions.every((q) => q.options.length === 4 && q.struck.length === 1 && !q.struck.includes(q.correct)));
  assert.equal(prepareSubject(state, 'literature').strikes, 2);
  assert.deepEqual(prepareSubject(state, 'math').questions.map((q) => q.q), m.questions.map((q) => q.q)); // a retry does not re-roll
  assert.equal(prepareSubject(state, 'pe').practical, 'track_sprint'); assert.equal(prepareSubject(state, 'art').practical, 'art_palette');
  const plain = fresh({ season: 'spring', day: 3 }).state;
  assert.throws(() => prepareSubject(plain, 'math'), /not an exam day/);
  assert.equal(prepareSubject(plain, 'math', { examId: 'final1' }).key, 'Y1_final1');
});

test('scoring: percentage, bonuses, practical weight, clamping', () => {
  const { state } = examDay();
  const prep = { total: 6, questions: Array.from({ length: 6 }, () => ({ correct: 0 })) };
  const ans = (n) => Array.from({ length: 6 }, (_, i) => (i < n ? 0 : 3));
  state.player.conduct = 80; state.player.energy = 100;
  assert.equal(scoreSitting(state, prep, ans(3)).score, 55); // 50 + 2 conduct + 3 rested
  assert.equal(scoreSitting(state, prep, ans(6)).score, 100); // clamped
  assert.equal(scoreSitting(state, prep, ans(0)).score, 5);
  state.player.energy = 40; assert.equal(scoreSitting(state, prep, ans(3)).score, 52);
  state.player.conduct = 70; assert.equal(scoreSitting(state, prep, ans(3)).score, 50);
  assert.deepEqual(scoreSitting(state, prep, ans(3)).bonuses, { conduct: 0, rested: 0 });
  assert.equal(scoreSitting(state, prep, ans(6), { practical: 0 }).score, 50); // 50% written, 50% practical
  assert.equal(scoreSitting(state, prep, ans(0), { practical: 100 }).score, 50);
  assert.equal(scoreSitting(state, prep, ans(6), { practical: 80 }).score, 90);
  assert.equal(scoreSitting(state, prep, [undefined, undefined, undefined, undefined, undefined, undefined]).score, 0); // blank paper
});

test('submitSubject stores a pending score, charges energy, and can be redone without duplicates', () => {
  const { state, events, opts } = examDay();
  state.player.conduct = 60;
  const prep = prepareSubject(state, 'math');
  const res = submitSubject(state, prep, answersFor(prep, 1), {}, opts);
  assert.equal(res.score, 100); assert.equal(res.energyCost, 10); assert.equal(state.player.energy, 90);
  assert.deepEqual(peekPending(state, 'Y1_midterm1'), { scores: { math: 100 }, sat: ['math'], missed: [] });
  submitSubject(state, prep, answersFor(prep, 0.5), {}, opts);
  assert.deepEqual(peekPending(state, 'Y1_midterm1').sat, ['math']);
  assert.equal(named(events, 'energy:changed').length >= 2, true);
});

test('exam day timing: sittings start in the classroom within the window; late arrival loses the first subject', () => {
  const { state } = examDay();
  const d = (hhmm, map = 'school_classroom') => examDirective(state, T(hhmm), map);
  assert.equal(d('08:29'), null);
  assert.equal(d('08:30', 'school_hall_1f'), null); // wrong room
  const first = d('08:30');
  assert.deepEqual([first.subject, first.slot, first.late, first.examId, first.key], ['math', 0, false, 'midterm1', 'Y1_midterm1']);
  assert.equal(d('08:45').late, true);
  assert.deepEqual(markMissedExams(state, T('08:45')), []);
  assert.equal(d('08:46'), null); // window closed, second sitting not yet due
  assert.deepEqual(markMissedExams(state, T('08:46')), ['math']);
  assert.equal(peekPending(state, 'Y1_midterm1').scores.math, 0);
  assert.equal(d('10:29'), null);
  assert.equal(d('10:30').subject, 'literature');
  submitSubject(state, prepareSubject(state, 'literature'), []);
  assert.equal(d('10:31'), null); // both decided
  assert.deepEqual(markMissedExams(state, T('23:00')), []);
  const plain = fresh({ season: 'spring', day: 3 }).state;
  assert.deepEqual(markMissedExams(plain, T('23:00')), []); assert.equal(examDirective(plain, T('08:30'), 'school_classroom'), null);
  assert.equal(missSubject(state, 'Y1_midterm1', 'math'), false); // already decided
});

test('results day: record, report card, running average, standing, flags, spirit, idempotence', () => {
  const { state, events, bus } = examDay();
  const key = 'Y1_midterm1';
  for (const s of SUBJECTS) { state.school.examPending = state.school.examPending || {}; }
  const p = { scores: { math: 90, literature: 80, science: 70, history: 60, art: 50, pe: 40 }, sat: SUBJECTS.slice(), missed: [] };
  state.school.examPending = { [key]: p };
  const r = processResults(state, 'midterm1', { bus });
  assert.equal(r.already, false); assert.equal(r.total, 390); assert.equal(r.average, 65); assert.equal(r.standing, 'fair');
  assert.ok(r.rank >= 1 && r.rank <= 30);
  assert.deepEqual(state.school.exams[key], { scores: p.scores, total: 390, average: 65, rank: r.rank });
  assert.equal(state.school.average, 65); assert.equal(state.school.standing, 'fair');
  assert.equal(state.school.reportCards.length, 1); assert.deepEqual([state.school.reportCards[0].examId, state.school.reportCards[0].average], ['midterm1', 65]);
  assert.equal(state.flags.exam_midterm1_y1_done, true); assert.equal(state.stats.examsPassed, 1);
  assert.equal(state.school.examPending[key], undefined);
  assert.equal(named(events, 'toast').length >= 0, true);
  const again = processResults(state, 'midterm1', { bus });
  assert.equal(again.already, true); assert.equal(state.school.reportCards.length, 1);
});

test('results: unsat subjects are zeros; probation sets remedial days; a top-5 rank gives +3 spirit and flags', () => {
  const idle = examDay().state;
  const low = processResults(idle, 'midterm1');
  assert.deepEqual(Object.values(low.scores ?? idle.school.exams.Y1_midterm1.scores), [0, 0, 0, 0, 0, 0]);
  assert.equal(idle.school.standing, 'probation'); assert.equal(idle.school.remedialDays, 5); assert.equal(idle.stats.examsPassed || 0, 0);
  assert.equal(idle.school.exams.Y1_midterm1.rank, 30);

  const star = examDay();
  star.state.school.examPending = { Y1_midterm1: { scores: Object.fromEntries(SUBJECTS.map((s) => [s, 99])), sat: SUBJECTS.slice(), missed: [] } };
  star.state.school.spirit = 10;
  const hi = processResults(star.state, 'midterm1', { bus: star.bus });
  assert.equal(hi.rank, 1); assert.equal(star.state.school.spirit, 13); assert.equal(hi.spiritGain, 3);
  assert.equal(star.state.flags.exam_top3, true); assert.equal(star.state.flags.exam_rank1, true); assert.equal(star.state.school.standing, 'honors');
  assert.equal(star.state.school.remedialDays, 0);
  assert.ok(named(star.events, 'toast').some(([, p]) => /Community Spirit \+3/.test(p.text)));
});

test('running average over several exams; year grade after final2', () => {
  const { state } = fresh({ season: 'winter', day: 12, seed: 3 });
  const rec = (id, avg) => { state.school.examPending = { [examKey(1, id)]: { scores: Object.fromEntries(SUBJECTS.map((s) => [s, avg])), sat: SUBJECTS.slice(), missed: [] } }; return processResults(state, id); };
  rec('midterm1', 60); rec('final1', 80); rec('midterm2', 70);
  assert.equal(state.school.average, 70);
  const last = rec('final2', 90);
  assert.equal(state.school.average, 75);
  assert.equal(state.school.yearGrades[1], 75);
  assert.equal(state.flags.year_1_honors, undefined);
  assert.equal(state.school.reportCards.length, 4); assert.equal(last.standing, 'good');
  assert.equal(resultsDue(state).id, 'final2');
});

test('class ranking: deterministic, 29 classmates, Clara on top, diligent players reach the top, idle ones the bottom', () => {
  const c = classmateAverages(7, 1, 'midterm1');
  assert.equal(c.length, 29); assert.deepEqual(c, classmateAverages(7, 1, 'midterm1'));
  assert.notDeepEqual(c, classmateAverages(8, 1, 'midterm1'));
  const clara = c.find((s) => s.id === 'clara'); assert.ok(clara.average >= 86 && clara.average <= 98);
  assert.equal(rankAmong(100, c), 1); assert.equal(rankAmong(0, c), 30);
  const ranks = (avg, year = 1) => { const out = []; for (let seed = 1; seed <= 40; seed++) for (const id of ['midterm1', 'final1', 'midterm2', 'final2']) out.push(rankAmong(avg, classmateAverages(seed, year, id))); return out.sort((a, b) => a - b); };
  const med = (a) => a[a.length >> 1];
  assert.ok(med(ranks(88)) <= 3, `an 88 average should be top 3, median ${med(ranks(88))}`);
  assert.ok(Math.max(...ranks(88)) <= 6, 'an 88 average is never worse than 6th');
  assert.ok(med(ranks(36)) >= 25, `a 36 average should sit near the bottom, median ${med(ranks(36))}`);
  assert.ok(med(ranks(70)) >= 5 && med(ranks(70)) <= 12, `a 70 average is upper-middle, median ${med(ranks(70))}`);
  assert.ok(med(ranks(88, 3)) <= 4, 'year 3 classmates are a little stronger but a diligent player still contends');
});

// ---------------------------------------------------------------- director
const game = (state, bus) => ({ bus, sim: { state } });
const ctxOf = (state, minute, map) => ({ state, minute, map, dayInfo: dayInfo(state) });
const wed = (extra = {}) => fresh({ season: 'spring', day: 3, minute: T('08:25'), seed: 4, ...extra });

test('director: homeroom is silent, class opens at the bell, lateness within grace, no double-open', () => {
  const { state, bus } = wed(); const g = game(state, bus);
  assert.equal(schoolDirector(g, ctxOf(state, T('08:25'), 'school_classroom')), null);
  assert.equal(attendanceToday(state).homeroom, 'present');
  const a = schoolDirector(g, ctxOf(state, T('08:30'), 'school_classroom'));
  assert.equal(a.scene, 'class');
  assert.deepEqual([a.params.period, a.params.subject, a.params.late, a.params.minutes, a.params.room], [1, 'science', false, 50, 'school_classroom']);
  assert.equal(typeof a.params.popQuiz, 'boolean');
  assert.equal(attendanceToday(state)[1], 'present');
  assert.equal(schoolDirector(g, ctxOf(state, T('08:30'), 'school_classroom')), null); // already issued

  const late = wed(); const lg = game(late.state, late.bus);
  const b = schoolDirector(lg, ctxOf(late.state, T('08:36'), 'school_classroom'));
  assert.deepEqual([b.params.late, b.params.minutes], [true, 44]); assert.equal(attendanceToday(late.state)[1], 'late');

  const away = wed(); const ag = game(away.state, away.bus);
  assert.equal(schoolDirector(ag, ctxOf(away.state, T('08:36'), 'school_hall_1f')), null);
  assert.equal(schoolDirector(ag, ctxOf(away.state, T('08:45'), 'school_classroom')), null); // too late: grace is over
  assert.equal(attendanceToday(away.state)[1], 'absent');
});

test('director: PE goes to the field when dry and to the classroom when wet; self study just needs school grounds', () => {
  const dry = wed(); dry.state.weather.today = 'sunny'; const dg = game(dry.state, dry.bus);
  assert.equal(schoolDirector(dg, ctxOf(dry.state, T('11:30'), 'school_classroom')), null); // period 4 Wed = PE: classroom is the wrong place
  dry.state.school.attendance.today = {};
  const pe = schoolDirector(dg, ctxOf(dry.state, T('11:30'), 'school_field'));
  assert.deepEqual([pe.scene, pe.params.subject, pe.params.room], ['class', 'pe', 'school_field']);
  const wet = wed(); wet.state.weather.today = 'rain';
  const w = schoolDirector(game(wet.state, wet.bus), ctxOf(wet.state, T('11:30'), 'school_classroom'));
  assert.deepEqual([w.scene, w.params.room], ['class', 'school_classroom']);
  const self = wed(); const sg = game(self.state, self.bus);
  assert.equal(schoolDirector(sg, ctxOf(self.state, T('14:10'), 'school_grounds')), null);
  assert.equal(attendanceToday(self.state)[6], 'present');
  const skip = wed(); assert.equal(schoolDirector(game(skip.state, skip.bus), ctxOf(skip.state, T('14:10'), 'town_square')), null);
  assert.equal(attendanceToday(skip.state)[6], undefined); // still joinable until grace ends
  schoolDirector(game(skip.state, skip.bus), ctxOf(skip.state, T('14:30'), 'town_square'));
  assert.equal(attendanceToday(skip.state)[6], 'absent');
});

test('director: nothing on weekends, breaks, cancelled-class festivals', () => {
  for (const [season, day] of [['spring', 6], ['summer', 16], ['spring', 1]]) {
    const { state, bus } = fresh({ season, day, seed: 2 });
    assert.equal(schoolDirector(game(state, bus), ctxOf(state, T('08:30'), 'school_classroom')), null, `${season} ${day}`);
    assert.deepEqual(attendanceToday(state), {});
  }
});

test('director: exam day opens the sitting, report card on results day once, remedial study once', () => {
  const ex = examDay(); const g = game(ex.state, ex.bus);
  assert.equal(schoolDirector(g, ctxOf(ex.state, T('08:30'), 'school_hall_1f')), null);
  const a = schoolDirector(g, ctxOf(ex.state, T('08:30'), 'school_classroom'));
  assert.deepEqual([a.scene, a.params.subject, a.params.slot, a.params.dayIndex, a.params.subjects], ['exam', 'math', 0, 0, ['math', 'literature']]);

  const res = fresh({ season: 'spring', day: 26, minute: T('15:10'), seed: 3 }); const rg = game(res.state, res.bus);
  assert.equal(schoolDirector(rg, ctxOf(res.state, T('14:00'), 'town_square')), null); // before the bell: nothing yet
  const card = schoolDirector(rg, ctxOf(res.state, T('15:10'), 'town_square'));
  assert.deepEqual([card.scene, card.params.examId, card.params.key], ['report_card', 'midterm1', 'Y1_midterm1']);
  assert.ok(res.state.school.exams.Y1_midterm1);
  assert.equal(schoolDirector(rg, ctxOf(res.state, T('15:11'), 'town_square')), null);

  const rem = wed(); rem.state.school.remedialDays = 2; rem.state.player.subjects.history = 3; const mg = game(rem.state, rem.bus);
  assert.equal(schoolDirector(mg, ctxOf(rem.state, T('15:10'), 'town_square')), null); // must be on school grounds
  const r = schoolDirector(mg, ctxOf(rem.state, T('15:10'), 'school_grounds'));
  assert.deepEqual([r.scene, r.params.remedial, r.params.subject], ['activity:study_library', true, 'history']);
  assert.equal(rem.state.school.remedialDays, 1);
  assert.equal(schoolDirector(mg, ctxOf(rem.state, T('15:12'), 'school_grounds')), null);
  assert.equal(weakestSubject(rem.state), 'history');
});

test('night hook: closes the day, zeroes unsat exams, processes posted results; registers into a hook registry', () => {
  const { state } = wed();
  const out = academicsNightHook(state, {});
  assert.deepEqual(out.periods, [1, 2, 3, 4, 5, 6]); assert.equal(out.results, null);
  const ex = examDay(); const m = academicsNightHook(ex.state, {});
  assert.deepEqual(m.missed, ['math', 'literature']); assert.deepEqual(peekPending(ex.state, 'Y1_midterm1').missed, ['math', 'literature']);
  const res = fresh({ season: 'spring', day: 26, seed: 3 });
  assert.equal(academicsNightHook(res.state, {}).results, 'Y1_midterm1');
  assert.equal(academicsNightHook(res.state, {}).results, null); // idempotent

  const registry = createHookRegistry();
  registerAcademics({ registry, director: false });
  assert.deepEqual(listNewDayHooks(registry).map((h) => [h.name, h.phase]), [['academics', 'before']]);
  const night = wed(); night.state.time.minute = T('21:00');
  const summary = sleep(night.state, { ...night.opts, hooks: registry, autosave: false });
  assert.equal(summary.hooks.academics.error, undefined);
  assert.deepEqual(summary.hooks.academics.periods, [1, 2, 3, 4, 5, 6]);
});

// ---------------------------------------------------------------- a whole year, headless
function playYear({ diligent }) {
  const env = fresh({ season: 'spring', day: 1, minute: T('06:30'), seed: 77 });
  const { state } = env;
  const registry = createHookRegistry();
  registerAcademics({ registry, director: false });
  const rng = rngFor('sim:answers');
  const opts = { ...env.opts, hooks: registry, autosave: false };
  for (let guard = 0; guard < 140 && !(state.time.season === 'winter' && state.time.day > 12); guard++) {
    const info = dayInfo(state);
    if (info.exam) {
      for (const [i, subject] of info.exam.subjects.entries()) {
        if (!diligent && i === 0) continue; // the idle student sleeps through the first sitting
        state.player.energy = Math.max(state.player.energy, 60);
        const prep = prepareSubject(state, subject);
        const p = Math.min(0.97, 0.15 + (state.player.subjects[subject] / 100) * 0.85 + prep.strikes * 0.05);
        submitSubject(state, prep, prep.questions.map((q) => (rng.next() < p ? q.correct : (q.correct + 1) % 4)), { practical: null }, opts);
      }
    } else if (info.hasLessons && diligent) {
      for (let n = 1; n <= 6; n++) {
        recordAttendance(state, n, 'present', opts);
        const subject = TIMETABLE_SUBJECT(info.weekdayIndex, n);
        applyClass(state, { subject, period: n, choice: n % 2 ? 'notes' : 'listen' }, opts);
      }
    }
    if (diligent && !info.exam && state.time.minute < 20 * 60) {
      const weakest = weakestSubject(state);
      study(state, { subject: weakest, hours: 2, place: 'library' }, { ...opts, advanceClock: false });
    }
    state.time.minute = T('22:00');
    sleep(state, opts);
  }
  return state;
}
import { subjectAt as TIMETABLE_SUBJECT } from '../../src/data/timetable.js';

test('a diligent year-1 student ends near the top; an idle one ends on probation (full headless simulation)', () => {
  const good = playYear({ diligent: true });
  const idle = playYear({ diligent: false });
  assert.equal(good.school.reportCards.length, 4); assert.equal(idle.school.reportCards.length, 4);
  assert.ok(good.school.average >= 80, `diligent average ${good.school.average}`);
  assert.ok(['honors', 'good'].includes(good.school.standing), good.school.standing);
  assert.ok(Math.min(...good.school.reportCards.map((r) => r.rank)) <= 3, 'diligent player reaches the top 3 at least once');
  assert.ok(good.school.reportCards.at(-1).rank <= 6, `diligent final rank ${good.school.reportCards.at(-1).rank}`);
  assert.ok(good.school.yearGrades[1] >= 75);
  assert.ok(good.school.spirit >= 3, 'top-5 finishes add Community Spirit');
  assert.ok(idle.school.average < 45, `idle average ${idle.school.average}`);
  assert.equal(idle.school.standing, 'probation'); assert.ok(idle.school.remedialDays >= 0);
  assert.ok(idle.school.reportCards.at(-1).rank >= 24, `idle rank ${idle.school.reportCards.at(-1).rank}`);
  assert.equal(idle.flags.detention_pending, true); assert.ok(idle.stats.daysSkippedClass > 50);
  assert.ok(idle.player.conduct < good.player.conduct);
  assert.ok(good.average === undefined); // (state keeps `school.average`, not a top-level field)
});
