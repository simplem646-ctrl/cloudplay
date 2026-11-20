// Exams: which questions a sitting asks, how hints and scores work, exam-day timing, results day (report card, class rank,
// standing, remedial days, Community Spirit). Doc 02 section 5. Pure over the plain-JSON state; the exam *scene* (src/scenes/
// academics) shows `prepareSubject` output and feeds the answers to `submitSubject`.
import { EXAM_MODULES } from '../_generated/registry.js';
import { SUBJECTS } from '../core/constants.js';
import { parseTime, clamp } from '../core/util.js';
import { rngFor } from '../core/rng.js';
import { BALANCE } from './balance.js';
import { addEnergy } from './player.js';
import { dayInfo } from './calendar.js';
import { standingFor, clampScore, REMEDIAL_DAYS } from './academics.js';

export const QUESTIONS_PER_YEAR = { 1: 6, 2: 7, 3: 8 };
/** Tier mix per year (tiers overlap so the jump between years is gentle). [[tier, weight], ...] */
export const TIER_WEIGHTS = { 1: [[1, 70], [2, 30]], 2: [[1, 15], [2, 65], [3, 20]], 3: [[2, 30], [3, 70]] };
/** Two sittings per exam day. A sitting can start up to GRACE minutes after its start time; later = missed (a zero). */
export const EXAM_SLOTS = [{ start: '08:30', minutes: 80 }, { start: '10:30', minutes: 80 }];
export const SLOT_GRACE = 15;
export const PRACTICAL = { pe: 'track_sprint', art: 'art_palette' }; // 50% of the subject score when a result exists
export const EXAM_ROOM = 'school_classroom';
export const BONUS = { conduct: 2, rested: 3 }; // conduct >= 80, energy >= 50 when sitting

export const examKey = (year, examId) => `Y${year}_${examId}`;
const round1 = (v) => Math.round(v * 10) / 10;

let cachedBanks = null;
/** { subject: [questions] } from the generated registry (or pass your own to every function through `opts.banks`). */
export function defaultBanks() {
  if (cachedBanks) return cachedBanks;
  cachedBanks = {};
  for (const mod of Object.values(EXAM_MODULES)) if (mod.default && mod.default.subject) cachedBanks[mod.default.subject] = mod.default.questions;
  return cachedBanks;
}

// ------------------------------------------------------------------ questions + hints
export const hintStrikes = (knowledge) => (knowledge >= 70 ? 2 : knowledge >= 40 ? 1 : 0);

/** Deterministic selection: same seed + exam + subject always yields the same questions in the same order. */
export function pickQuestions(bank, { seed, key, subject, year }) {
  const rng = rngFor(`${seed}:exam:${key}:${subject}`);
  const want = Math.min(QUESTIONS_PER_YEAR[year] || 6, bank.length);
  const pool = bank.slice();
  const picked = [];
  while (picked.length < want && pool.length) {
    const tiers = (TIER_WEIGHTS[year] || TIER_WEIGHTS[1]).filter(([t]) => pool.some((q) => q.tier === t));
    const tier = tiers.length ? rng.weighted(tiers) : null;
    const cands = tier === null ? pool : pool.filter((q) => q.tier === tier);
    const q = rng.pick(cands);
    pool.splice(pool.indexOf(q), 1);
    picked.push(q);
  }
  return rng.shuffle(picked);
}

/** Indices of wrong options to strike out (never the correct one); deterministic per question. */
export function struckChoices(question, strikes, key) {
  const wrong = [0, 1, 2, 3].filter((i) => i !== question.correct);
  return rngFor(`${key}:${question.q}`).shuffle(wrong).slice(0, strikes).sort();
}

/**
 * Everything the exam scene needs for one sitting: { key, examId, subject, knowledge, strikes, total, practical,
 * questions: [{ q, options, correct, tier, topic, struck: [indices] }] }. `opts`: { banks, examId, year }.
 */
export function prepareSubject(state, subject, opts = {}) {
  const info = dayInfo(state);
  const examId = opts.examId || (info.exam && info.exam.id);
  if (!examId) throw new Error('prepareSubject: not an exam day (pass opts.examId)');
  const year = opts.year || state.time.year;
  const key = examKey(year, examId);
  const bank = (opts.banks || defaultBanks())[subject] || [];
  const knowledge = state.player.subjects[subject];
  const strikes = hintStrikes(knowledge);
  const questions = pickQuestions(bank, { seed: state.meta.seed, key, subject, year }).map((q) => ({
    q: q.q, options: q.a.slice(), correct: q.correct, tier: q.tier, topic: q.topic, struck: struckChoices(q, strikes, key),
  }));
  return { key, examId, subject, knowledge, strikes, total: questions.length, practical: PRACTICAL[subject] || null, questions };
}

// ------------------------------------------------------------------ pending scores + sitting
export const peekPending = (state, key) => (state.school.examPending && state.school.examPending[key]) || null;
export function pendingFor(state, key) {
  if (!state.school.examPending) state.school.examPending = {};
  return (state.school.examPending[key] = state.school.examPending[key] || { scores: {}, sat: [], missed: [] });
}
export const isDecided = (pending, subject) => !!pending && (pending.sat.includes(subject) || pending.missed.includes(subject));

/** Score a sitting (does not store anything). `answers[i]` = chosen option index per question (undefined = blank). */
export function scoreSitting(state, prep, answers, { practical = null } = {}) {
  const correct = prep.questions.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const written = prep.total ? (correct / prep.total) * 100 : 0;
  const base = practical === null || practical === undefined ? written : 0.5 * written + 0.5 * practical;
  const conduct = state.player.conduct >= 80 ? BONUS.conduct : 0;
  const rested = state.player.energy >= 50 ? BONUS.rested : 0;
  return { correct, total: prep.total, written: Math.round(written), practical: practical ?? null, bonuses: { conduct, rested }, score: clampScore(base + conduct + rested) };
}

/** Submit a sitting: scores it, charges the exam energy cost, stores the subject's score as pending until results day. */
export function submitSubject(state, prep, answers, { practical = null } = {}, opts = {}) {
  const b = opts.balance || BALANCE;
  const res = scoreSitting(state, prep, answers, { practical });
  res.energyCost = -addEnergy(state, -b.energy.cost.exam, opts);
  const p = pendingFor(state, prep.key);
  p.scores[prep.subject] = res.score;
  if (!p.sat.includes(prep.subject)) p.sat.push(prep.subject);
  p.missed = p.missed.filter((s) => s !== prep.subject);
  return { subject: prep.subject, ...res };
}

export function missSubject(state, key, subject) {
  const p = pendingFor(state, key);
  if (isDecided(p, subject)) return false;
  p.scores[subject] = 0;
  p.missed.push(subject);
  return true;
}

// ------------------------------------------------------------------ exam day timing
export const slotStart = (i) => parseTime(EXAM_SLOTS[i].start);

/** Sittings whose start + grace has passed without being sat are missed (a zero). Returns the subjects newly missed. */
export function markMissedExams(state, minute) {
  const info = dayInfo(state);
  if (!info.exam) return [];
  const key = examKey(info.year, info.exam.id);
  const out = [];
  info.exam.subjects.forEach((subject, i) => {
    if (minute > slotStart(i) + SLOT_GRACE && !isDecided(peekPending(state, key), subject)) { missSubject(state, key, subject); out.push(subject); }
  });
  return out;
}

/**
 * What should start now on an exam day: { subject, slot, key, examId, late } when a sitting is due (player in the classroom and
 * inside the sitting's window), else null. Call `markMissedExams` first.
 */
export function examDirective(state, minute, map) {
  const info = dayInfo(state);
  if (!info.exam || map !== EXAM_ROOM) return null;
  const key = examKey(info.year, info.exam.id);
  const pending = peekPending(state, key);
  for (let i = 0; i < info.exam.subjects.length; i++) {
    const subject = info.exam.subjects[i];
    if (isDecided(pending, subject)) continue;
    if (minute < slotStart(i)) return null; // not yet (and later sittings are even later)
    if (minute <= slotStart(i) + SLOT_GRACE) return { subject, slot: i, key, examId: info.exam.id, late: minute > slotStart(i) };
  }
  return null;
}

// ------------------------------------------------------------------ results day
const NAMED_CLASSMATES = { clara: [90, 96], nina: [55, 70], dante: [55, 70] };

/** The other 29 members of Class B for an exam: [{ id, average }]. Deterministic per seed / year / exam. */
export function classmateAverages(seed, year, examId) {
  const base = rngFor(`${seed}:class:${year}`);
  const jit = rngFor(`${seed}:classjit:${year}:${examId}`);
  const out = [];
  for (const [id, [lo, hi]] of Object.entries(NAMED_CLASSMATES)) out.push({ id, base: lo + base.next() * (hi - lo) });
  for (let i = 1; i <= 26; i++) {
    const z = (base.next() + base.next() + base.next()) / 3; // ~ bell curve on 0..1
    out.push({ id: `student_${String(i).padStart(2, '0')}`, base: clamp(62 + (z - 0.5) * 72, 30, 87) });
  }
  return out.map((s) => ({ id: s.id, average: round1(clamp(s.base + (year - 1) * 2 + (jit.next() - 0.5) * 8, 25, 98)) }));
}

/** 1-based rank among 30 (the player wins ties). */
export const rankAmong = (average, classmates) => 1 + classmates.filter((c) => c.average > average).length;

/** The exam whose results are posted today, or null. */
export const resultsDue = (state) => dayInfo(state).examResults || null;

/**
 * Turn the pending subject scores of exam `examId` into a record: school.exams[key] = { scores, total, average, rank },
 * a report card, running average + standing, remedial days on probation, Community Spirit +3 for a top-5 rank, flags
 * (`exam_<id>_y<year>_done`, `exam_top3`, `year_<n>_honors`), the year grade after the 4th exam. Idempotent: a second call
 * returns the stored record with `already: true`. Emits `exam:results` and a `toast` on `opts.bus`.
 */
export function processResults(state, examId, opts = {}) {
  const year = opts.year || state.time.year;
  const key = examKey(year, examId);
  const school = state.school;
  if (school.exams[key]) return { key, ...school.exams[key], standing: school.standing, already: true };
  const pending = peekPending(state, key);
  const scores = {};
  for (const s of SUBJECTS) scores[s] = pending && pending.scores[s] !== undefined ? pending.scores[s] : 0;
  const total = SUBJECTS.reduce((n, s) => n + scores[s], 0);
  const average = round1(total / SUBJECTS.length);
  const rank = rankAmong(average, classmateAverages(state.meta.seed, year, examId));
  school.exams[key] = { scores, total, average, rank };

  const avgs = Object.values(school.exams).map((e) => e.average);
  school.average = round1(avgs.reduce((a, b) => a + b, 0) / avgs.length);
  school.standing = standingFor(school.average);
  if (school.standing === 'probation') school.remedialDays = REMEDIAL_DAYS;
  school.reportCards.push({ year, examId, key, average, rank, standing: school.standing, scores: { ...scores } });
  if (average >= 55) state.stats.examsPassed = (state.stats.examsPassed || 0) + 1;

  let spiritGain = 0;
  if (rank <= 5) {
    const from = school.spirit;
    school.spirit = clamp(from + 3, 0, 100);
    spiritGain = school.spirit - from;
  }
  state.flags[`exam_${examId}_y${year}_done`] = true;
  if (rank <= 3) state.flags.exam_top3 = true;
  if (rank === 1) state.flags.exam_rank1 = true;
  if (examId === 'final2') {
    const ofYear = Object.entries(school.exams).filter(([k]) => k.startsWith(`Y${year}_`)).map(([, e]) => e.average);
    school.yearGrades = school.yearGrades || {};
    school.yearGrades[year] = round1(ofYear.reduce((a, b) => a + b, 0) / ofYear.length);
    if (school.yearGrades[year] >= 85) state.flags[`year_${year}_honors`] = true;
  }
  if (state.school.examPending) delete state.school.examPending[key];
  if (opts.bus) {
    opts.bus.emit('exam:results', { key, examId, year, average, rank, standing: school.standing });
    if (spiritGain) opts.bus.emit('toast', { text: `Community Spirit +${spiritGain}`, icon: 'bell' });
  }
  return { key, scores, total, average, rank, standing: school.standing, remedial: school.standing === 'probation', spiritGain, already: false };
}
