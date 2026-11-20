// The school-day director: a per-in-game-minute policy the overworld consults (src/scenes/registry.js). It decides when a class,
// an exam, a remedial study session or the report card should take over, and keeps attendance honest. Returns
// null | { scene, params }. Idempotent: calling it twice in the same minute never opens the same thing twice (attendance /
// pending-exam / daily flags are written when an action is issued).
import { parseTime } from '../core/util.js';
import { AFTER_SCHOOL } from '../core/constants.js';
import { registerDirector } from '../scenes/registry.js';
import { dayInfo } from './calendar.js';
import { isSchoolMap } from './player.js';
import { subjectAt, isAcademic, roomFor } from '../data/timetable.js';
import {
  schoolPhase, recordAttendance, markMissedPeriods, attendanceToday, minutesLeft, hasPopQuiz, GRACE_MINUTES,
} from './academics.js';
import { markMissedExams, examDirective, processResults, resultsDue } from './exams.js';

const REMEDIAL_FROM = '15:10';
const REMEDIAL_UNTIL = '16:30';

export function schoolDirector(game, ctx) {
  const state = ctx.state || game.sim.state;
  const info = ctx.dayInfo || dayInfo(state);
  const minute = ctx.minute ?? state.time.minute;
  const map = ctx.map ?? state.player.map;
  const opts = { bus: game.bus };

  // 1. report card on results day, once, after school
  const due = resultsDue(state);
  if (due && minute >= parseTime(AFTER_SCHOOL) && !state.daily.reportShown) {
    state.daily.reportShown = true;
    processResults(state, due.id, opts);
    return { scene: 'report_card', params: { examId: due.id, key: `Y${state.time.year}_${due.id}` } };
  }
  if (!info.isSchoolDay) return null;

  // 2. exam day: miss what is over, start what is due
  if (info.exam) {
    markMissedExams(state, minute);
    const d = examDirective(state, minute, map);
    return d ? { scene: 'exam', params: { examId: d.examId, key: d.key, subject: d.subject, slot: d.slot, late: d.late, dayIndex: info.exam.dayIndex, subjects: info.exam.subjects } } : null;
  }
  if (!info.hasLessons) return null;

  // 3. homeroom + lessons
  const phase = schoolPhase(minute);
  if (phase.phase === 'homeroom' && map === 'school_classroom') recordAttendance(state, 'homeroom', 'present', opts);
  markMissedPeriods(state, minute, opts);

  if (phase.phase === 'period' && phase.graceOpen) {
    const n = phase.period;
    const subject = subjectAt(info.weekdayIndex, n);
    if (subject && !attendanceToday(state)[n]) {
      const room = roomFor(subject, state.weather.today);
      if (isAcademic(subject)) {
        if (map === room) {
          const late = phase.late;
          recordAttendance(state, n, late ? 'late' : 'present', opts);
          return { scene: 'class', params: { period: n, subject, late, minutes: minutesLeft(n, minute), popQuiz: hasPopQuiz(state, n), room } };
        }
      } else if (isSchoolMap(map)) {
        recordAttendance(state, n, phase.late ? 'late' : 'present', opts); // self study / club intro / cleanup: just be on school grounds
      }
    }
  }

  // 4. remedial study after school (probation): once per day, forced
  const s = state.school;
  if (s.remedialDays > 0 && !state.daily.remedialDone && minute >= parseTime(REMEDIAL_FROM) && minute < parseTime(REMEDIAL_UNTIL) && isSchoolMap(map)) {
    state.daily.remedialDone = true;
    s.remedialDays -= 1;
    return { scene: 'activity:study_library', params: { remedial: true, hours: 1, subject: weakestSubject(state) } };
  }
  return null;
}

export function weakestSubject(state) {
  return Object.entries(state.player.subjects).sort((a, b) => a[1] - b[1] || (a[0] < b[0] ? -1 : 1))[0][0];
}

export const registerSchoolDirector = () => registerDirector('school', schoolDirector, 20);
export { GRACE_MINUTES };
