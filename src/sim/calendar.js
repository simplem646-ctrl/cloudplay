// Calendar helpers on top of src/data/calendar.js (data) and src/data/cast.js (birthdays).
// Pure functions: no state mutation, no events.

import { SEASONS, SEASON_LABEL, DAYS_PER_SEASON, WEEKDAYS, WEEKDAY_LABEL, YEARS } from '../core/constants.js';
import { CAST, NPC_IDS } from '../data/cast.js';
import { FESTIVALS, EXAMS, BREAKS, festivalOn, breakOn, examDayInfo, KEY_DATES } from '../data/calendar.js';
import { BALANCE } from './balance.js';

export const DAYS_PER_YEAR = DAYS_PER_SEASON * SEASONS.length; // 112
export const TOTAL_DAYS = DAYS_PER_YEAR * YEARS; // 336

// birthday lookup `${season}:${day}` -> [npc ids] (immutable derived data)
const BIRTHDAYS = (() => {
  const m = {};
  for (const c of CAST) {
    if (!c.birthday || c.kind === 'player') continue;
    const k = `${c.birthday.season}:${c.birthday.day}`;
    (m[k] = m[k] || []).push(c.id);
  }
  return m;
})();
const THEO_BIRTHDAY = CAST.find((c) => c.kind === 'player').birthday;

/** `{year, season, day}` from a game state, a date object, or an absDay number. */
export function toDate(x) {
  if (typeof x === 'number') return fromAbsDay(x);
  const t = x && x.time ? x.time : x;
  return { year: t.year, season: t.season, day: t.day };
}

/** Days elapsed since Spring 1, Year 1 (0-based). */
export function absDayOf(x) {
  const d = typeof x === 'number' ? fromAbsDay(x) : toDate(x);
  return (d.year - 1) * DAYS_PER_YEAR + SEASONS.indexOf(d.season) * DAYS_PER_SEASON + (d.day - 1);
}

/** Inverse of absDayOf. Works for any non-negative integer (years may exceed YEARS). */
export function fromAbsDay(n) {
  const a = Math.max(0, Math.floor(n));
  const year = Math.floor(a / DAYS_PER_YEAR) + 1;
  const inYear = a % DAYS_PER_YEAR;
  return { year, season: SEASONS[Math.floor(inYear / DAYS_PER_SEASON)], day: (inYear % DAYS_PER_SEASON) + 1, absDay: a };
}

/** weekday index 0=Mon..6=Sun of a season day (every season starts on a Monday). */
export const weekdayIndexOf = (day) => (day - 1) % 7;

/** True for the very last day of the game (Year 3, Winter 28): the night after it ends the game. */
export function isFinaleDay(x) {
  const d = toDate(x);
  const k = KEY_DATES.finale;
  return d.year === k.year && d.season === k.season && d.day === k.day;
}

/** Term of a date: 1 (spring+summer) or 2 (autumn+winter). */
export const termOf = (season) => (season === 'autumn' || season === 'winter' ? 2 : 1);

/**
 * Everything the game wants to know about a day.
 * `exam` is the exam sat that day ({...EXAMS entry, dayIndex, subjects}) or null;
 * `examResults` is the EXAMS entry whose results are handed out that day or null.
 * School day = Mon-Fri, not in a break, not a cancelled day. Exam days ARE school days (the
 * player sits the exam instead of lessons: `hasLessons` is false). Festival is the FESTIVALS entry or null.
 */
export function dayInfo(x) {
  const { year, season, day } = toDate(x);
  const weekdayIndex = weekdayIndexOf(day);
  const weekday = WEEKDAYS[weekdayIndex];
  const festival = festivalOn(season, day);
  const brk = breakOn(season, day);
  const ex = examDayInfo(season, day);
  const classesCancelled = !!(festival && festival.classesCancelled);
  const isWeekend = weekdayIndex >= 5;
  const isSchoolDay = !isWeekend && !brk && !classesCancelled;
  const exam = ex && !ex.results ? { ...ex.exam, dayIndex: ex.dayIndex, subjects: ex.subjects } : null;
  const key = `${season}:${day}`;
  const term = termOf(season);
  return {
    year, season, day, weekday, weekdayIndex,
    weekdayLabel: WEEKDAY_LABEL[weekday],
    isWeekend,
    isSchoolDay,
    hasLessons: isSchoolDay && !exam,
    isBreak: !!brk,
    breakInfo: brk,
    festival,
    exam,
    examResults: ex && ex.results ? ex.exam : null,
    classesCancelled,
    birthdays: BIRTHDAYS[key] ? [...BIRTHDAYS[key]] : [],
    playerBirthday: THEO_BIRTHDAY.season === season && THEO_BIRTHDAY.day === day,
    term,
    termIndex: (year - 1) * 2 + (term - 1), // 0..5
    absDay: absDayOf({ year, season, day }),
  };
}

/** 'Spring 1, Year 1' */
export function dateLabel(x, { weekday = false } = {}) {
  const d = toDate(x);
  const base = `${SEASON_LABEL[d.season]} ${d.day}, Year ${d.year}`;
  return weekday ? `${base} (${WEEKDAYS[weekdayIndexOf(d.day)]})` : base;
}

/** The date `n` days after (n may be negative) the given state/date. Returns {year,season,day,absDay}. */
export function addDays(x, n) {
  return fromAbsDay(absDayOf(x) + n);
}

function festivalStart(f, year) {
  return absDayOf({ year, season: f.season, day: f.days[0] });
}

/**
 * The next festival on or after today (`includeToday: false` for strictly after).
 * Returns { festival, date, absDay, daysUntil, year } or null once the game is over.
 */
export function nextFestival(x, { includeToday = true } = {}) {
  const today = absDayOf(x);
  let best = null;
  for (let y = 1; y <= YEARS; y++) {
    for (const f of FESTIVALS) {
      // a multi-day festival that is still running counts as "today"
      const s = festivalStart(f, y);
      const e = s + (f.days[f.days.length - 1] - f.days[0]);
      const eff = includeToday ? (today >= s && today <= e ? today : s) : s;
      if ((includeToday ? eff >= today : eff > today) && (!best || eff < best.absDay)) {
        best = { festival: f, absDay: eff, year: y };
      }
    }
  }
  if (!best) return null;
  return { festival: best.festival, date: fromAbsDay(best.absDay), absDay: best.absDay, daysUntil: best.absDay - today, year: best.year };
}

/**
 * The next `n` notable days strictly after today, soonest first:
 * [{ type: 'festival'|'exam'|'results'|'break'|'birthday', id, name, absDay, date, daysUntil }].
 * Multi-day items appear once (first day). Birthdays: NPCs the player has met (state only).
 * Options: types (array filter), horizon (days, default balance.calendar.upcomingHorizonDays).
 */
export function upcoming(x, n = 5, opts = {}) {
  const today = absDayOf(x);
  const horizon = opts.horizon || BALANCE.calendar.upcomingHorizonDays;
  const types = opts.types || ['festival', 'exam', 'results', 'break', 'birthday'];
  const rel = x && x.relationships ? x.relationships : null;
  const out = [];
  const push = (type, id, name, absDay) => {
    if (absDay <= today || absDay > today + horizon || absDay >= TOTAL_DAYS) return;
    out.push({ type, id, name, absDay, date: fromAbsDay(absDay), daysUntil: absDay - today });
  };
  for (let y = 1; y <= YEARS; y++) {
    if (types.includes('festival')) for (const f of FESTIVALS) push('festival', f.id, f.name, festivalStart(f, y));
    for (const e of EXAMS) {
      if (types.includes('exam')) push('exam', e.id, e.label, absDayOf({ year: y, season: e.season, day: e.days[0] }));
      if (types.includes('results')) push('results', e.id, `${e.label} results`, absDayOf({ year: y, season: e.season, day: e.resultsDay }));
    }
    if (types.includes('break')) for (const b of BREAKS) push('break', b.id, b.name, absDayOf({ year: y, season: b.season, day: b.from }));
    if (types.includes('birthday')) {
      for (const c of CAST) {
        if (!c.birthday || c.kind === 'player' || !NPC_IDS.includes(c.id)) continue;
        if (rel && !(rel[c.id] && rel[c.id].met)) continue;
        push('birthday', c.id, `${c.short || c.name}'s birthday`, absDayOf({ year: y, season: c.birthday.season, day: c.birthday.day }));
      }
    }
  }
  out.sort((a, b) => a.absDay - b.absDay || a.type.localeCompare(b.type) || a.id.localeCompare(b.id));
  return out.slice(0, n);
}

/** Convenience: the NPC ids whose birthday is today. */
export const birthdaysToday = (x) => dayInfo(x).birthdays;

export { SEASONS, WEEKDAYS };
