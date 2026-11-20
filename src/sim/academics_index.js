// One-stop import + registration for the academic systems (T9a's boot calls `registerAcademics()`).
import { registerNewDayHook } from './clock.js';
import { finalizeSchoolDay } from './academics.js';
import { markMissedExams, processResults, resultsDue } from './exams.js';
import { registerSchoolDirector } from './school_director.js';

export * from './academics.js';
export * as exams from './exams.js';
export { schoolDirector, registerSchoolDirector, weakestSubject } from './school_director.js';
export { TIMETABLE, subjectAt, teacherOf, lessonsOn, roomFor, isAcademic } from '../data/timetable.js';

/**
 * Night-time bookkeeping (a 'before' new-day hook, state still on the old day): unattended periods become absences, unsat exam
 * sittings become zeros, and results that were posted today but never opened are processed so no report card is lost.
 */
export function academicsNightHook(state, ctx = {}) {
  const opts = { bus: ctx.bus, balance: ctx.balance };
  const periods = finalizeSchoolDay(state, opts);
  const missed = markMissedExams(state, 24 * 60);
  const due = resultsDue(state);
  const results = due ? processResults(state, due.id, opts) : null;
  return { periods, missed, results: results && !results.already ? results.key : null };
}

/** Register the night hook (optionally into a test registry) and the school director. */
export function registerAcademics({ registry, director = true } = {}) {
  registerNewDayHook('academics', academicsNightHook, { phase: 'before', order: 10, ...(registry ? { registry } : {}) });
  if (director) registerSchoolDirector();
}
