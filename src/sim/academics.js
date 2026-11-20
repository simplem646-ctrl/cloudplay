// Academic life, rules only (no drawing): the school-day phases, attendance, what a class session gives, studying at
// home or in the library, letter grades and standing. Doc 02 sections 4-5. Pure functions over the plain-JSON state;
// everything takes optional `opts = { bus, balance }`. Scenes (src/scenes/academics) and the director call these.
import { PERIODS, HOMEROOM, LUNCH, AFTER_SCHOOL, SUBJECTS } from '../core/constants.js';
import { parseTime, clamp } from '../core/util.js';
import { rngFor } from '../core/rng.js';
import { BALANCE } from './balance.js';
import { addStat, addEnergy, trackSubjects, setFlag } from './player.js';
import { studyBonus } from './inventory.js';
import { advance } from './clock.js';
import { dayInfo } from './calendar.js';
import { subjectAt, isAcademic } from '../data/timetable.js';

const bal = (o) => (o && o.balance) || BALANCE;
export const GRACE_MINUTES = 10; // entering up to this long after the bell = late; later = absent for that period
export const SKIPS_FOR_DETENTION = 5; // skipped periods in one term -> detention day (flag `detention_pending`)
export const CONDUCT = { late: -1, absent: -2, doze: -1, caught: -2 };

const START = PERIODS.map((p) => parseTime(p.start));
const END = PERIODS.map((p) => parseTime(p.end));
export const periodStart = (n) => START[n - 1];
export const periodEnd = (n) => END[n - 1];
export const minutesLeft = (n, minute) => Math.max(0, END[n - 1] - minute);

/**
 * Where the school day is at `minute`: { phase: 'pre'|'homeroom'|'period'|'break'|'lunch'|'after', period?, next?, late? }.
 * `period` = the period in progress; during 'break' / 'homeroom' `next` is the upcoming one; `late` is true while the
 * grace window after the bell is still open.
 */
export function schoolPhase(minute) {
  const hr = parseTime(HOMEROOM);
  if (minute < hr) return { phase: 'pre', next: 1 };
  if (minute < START[0]) return { phase: 'homeroom', next: 1 };
  for (let i = 0; i < START.length; i++) {
    if (minute >= START[i] && minute < END[i]) return { phase: 'period', period: i + 1, late: minute > START[i], graceOpen: minute <= START[i] + GRACE_MINUTES };
    if (i < START.length - 1 && minute >= END[i] && minute < START[i + 1]) {
      if (minute >= parseTime(LUNCH.start) && minute < parseTime(LUNCH.end)) return { phase: 'lunch', next: i + 2 };
      return { phase: 'break', next: i + 2 };
    }
  }
  return { phase: minute < parseTime(AFTER_SCHOOL) ? 'break' : 'after' };
}

/** Subject taught in `period` today, or null when there are no lessons (weekend, break, festival, exam day). */
export function lessonToday(state, period) {
  const info = dayInfo(state);
  return info.hasLessons ? subjectAt(info.weekdayIndex, period) : null;
}

// ------------------------------------------------------------------ attendance
const attendance = (state) => state.school.attendance;
export const attendanceToday = (state) => attendance(state).today;

/**
 * Record homeroom (key 'homeroom') or a period (1..6) as present|late|absent. First record wins (idempotent).
 * Late: conduct -1. Absent: conduct -2, counts as a skipped period (`stats.daysSkippedClass`, per-term counter); the
 * 5th, 10th... skipped period of a term sets `flags.detention_pending`. Returns the recorded status.
 */
export function recordAttendance(state, slot, status, opts = {}) {
  const a = attendance(state);
  if (a.today[slot]) return a.today[slot];
  a.today[slot] = status;
  if (slot === 'homeroom') {
    if (status === 'absent') state.daily.missedHomeroom = true;
    return status;
  }
  a[status] = (a[status] || 0) + 1;
  if (status === 'late') addStat(state, 'conduct', CONDUCT.late, opts);
  if (status === 'absent') {
    addStat(state, 'conduct', CONDUCT.absent, opts);
    state.stats.daysSkippedClass = (state.stats.daysSkippedClass || 0) + 1;
    const term = dayInfo(state).termIndex;
    const key = `skips_term_${term}`;
    state.counters[key] = (state.counters[key] || 0) + 1;
    if (state.counters[key] % SKIPS_FOR_DETENTION === 0) setFlag(state, 'detention_pending', true, opts);
  }
  return status;
}

/**
 * Mark every period (and homeroom) that is over for good at `minute` and was never attended as absent.
 * A period is lost once the grace window has passed. Only on days with lessons. Returns the periods newly marked.
 */
export function markMissedPeriods(state, minute, opts = {}) {
  const info = dayInfo(state);
  if (!info.hasLessons) return [];
  const marked = [];
  if (minute >= START[0] && !attendance(state).today.homeroom) recordAttendance(state, 'homeroom', 'absent', opts);
  for (let n = 1; n <= PERIODS.length; n++) {
    if (attendance(state).today[n]) continue;
    const subject = subjectAt(info.weekdayIndex, n);
    if (!subject) continue;
    if (minute > START[n - 1] + GRACE_MINUTES) { recordAttendance(state, n, 'absent', opts); marked.push(n); }
  }
  return marked;
}

/** End-of-day safety net (before-hook): everything unattended becomes absent. Exam days and non-school days are untouched. */
export function finalizeSchoolDay(state, opts = {}) {
  return markMissedPeriods(state, 24 * 60, opts);
}

// ------------------------------------------------------------------ class sessions
export const CLASS_CHOICES = ['listen', 'notes', 'doze', 'pass_note'];
export const CLASS_BASE_GAIN = 2;

/**
 * Apply one class session. `choice` in CLASS_CHOICES; `quiz` = null (no pop quiz) | true | false (answered right/wrong);
 * `late` trims one point. Rules: listen +2; notes +3 and -2 energy (writing is tiring); doze +0, +5 energy, conduct -1;
 * pass_note +1, +1 charm, 40% chance (seeded per day/period) the teacher notices: conduct -2. A correct pop quiz is +2.
 * PE adds +1 fitness, art +1 creativity. Non-lesson periods (self study, cleanup...) give nothing.
 * Returns { gains: { subject: n }, traits: {...}, conduct, energy, caught, choice }.
 */
export function applyClass(state, { subject, period = 1, choice = 'listen', quiz = null, late = false }, opts = {}) {
  const out = { gains: {}, traits: {}, conduct: 0, energy: 0, caught: false, choice };
  if (!isAcademic(subject)) return out;
  let base = { listen: 2, notes: 3, doze: 0, pass_note: 1 }[choice] ?? 2;
  if (quiz === true) base += 2;
  if (late && base > 0) base -= 1;
  if (base > 0) out.gains[subject] = addStat(state, subject, base, opts);
  if (choice === 'notes') out.energy = addEnergy(state, -2, opts);
  if (choice === 'doze') { out.energy = addEnergy(state, 5, opts); out.conduct += addStat(state, 'conduct', CONDUCT.doze, opts); }
  if (choice === 'pass_note') {
    out.traits.charm = addStat(state, 'charm', 1, opts);
    if (rngFor(`${state.meta.seed}:note:${state.time.absDay}:${period}`).chance(0.4)) { out.caught = true; out.conduct += addStat(state, 'conduct', CONDUCT.caught, opts); }
  }
  if (subject === 'pe') out.traits.fitness = addStat(state, 'fitness', 1, opts);
  if (subject === 'art') out.traits.creativity = addStat(state, 'creativity', 1, opts);
  trackSubjects(state, state.time.absDay);
  return out;
}

/** Seeded: does period `period` today include a pop quiz? (25%) */
export const hasPopQuiz = (state, period) => rngFor(`${state.meta.seed}:quiz:${state.time.absDay}:${period}`).chance(0.25);

// ------------------------------------------------------------------ studying
export const STUDY_PLACES = ['home', 'library'];
export const STUDY_MAX_HOURS = 3;

/**
 * Study `hours` (1-3) of `subject`. Each hour costs `balance.energy.cost.study` energy and 60 game minutes, and gives
 * 2-4 (seeded) + book bonus (carried items, max 2) + 1 in the library, -2 when tired (energy < 25 at the start of the
 * hour); never below 1. Diminishing returns above 70 are applied by `addStat`. Stops early when energy runs out.
 * `opts.advanceClock === false` skips advancing the clock (the scene may animate first and advance itself).
 * Returns { ok, reason?, hours, gain, perHour, energyCost, minutes }. reasons: bad_subject | bad_hours | too_tired
 */
export function study(state, { subject, hours = 1, place = 'home' }, opts = {}) {
  const b = bal(opts);
  if (!SUBJECTS.includes(subject)) return { ok: false, reason: 'bad_subject' };
  if (!Number.isInteger(hours) || hours < 1 || hours > STUDY_MAX_HOURS) return { ok: false, reason: 'bad_hours' };
  const cost = b.energy.cost.study;
  if (state.player.energy < cost) return { ok: false, reason: 'too_tired' };
  const perHour = [];
  let done = 0, energyCost = 0;
  const book = studyBonus(state, subject, opts);
  for (let h = 0; h < hours; h++) {
    if (state.player.energy < cost) break;
    const tired = state.player.energy < b.energy.tiredBelow;
    const roll = rngFor(`${state.meta.seed}:study:${state.time.absDay}:${state.daily.studied}:${subject}`).int(2, 4);
    const raw = Math.max(1, roll + book + (place === 'library' ? b.stats.studyGain.libraryBonus : 0) + (tired ? b.stats.studyGain.tiredPenalty : 0));
    perHour.push(addStat(state, subject, raw, opts));
    energyCost -= addEnergy(state, -cost, opts);
    state.daily.studied += 1;
    done++;
  }
  trackSubjects(state, state.time.absDay);
  const minutes = done * 60;
  if (opts.advanceClock !== false) advance(state, minutes, opts);
  return { ok: true, hours: done, gain: perHour.reduce((s, v) => s + v, 0), perHour, energyCost, minutes };
}

// ------------------------------------------------------------------ grades
export const GRADE_BANDS = [[90, 'A'], [80, 'B'], [70, 'C'], [55, 'D']];
export const letterGrade = (score) => (GRADE_BANDS.find(([min]) => score >= min) || [0, 'F'])[1];

/** honors >= 85, good >= 70, fair >= 55, probation below (doc 02 section 5). */
export const STANDING_BANDS = [[85, 'honors'], [70, 'good'], [55, 'fair']];
export const standingFor = (average) => (STANDING_BANDS.find(([min]) => average >= min) || [0, 'probation'])[1];
export const REMEDIAL_DAYS = 5;
export const clampScore = (v) => clamp(Math.round(v), 0, 100);
