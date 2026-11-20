// Class B's weekly timetable (doc 02 section 5). Row = weekday (Mon..Fri), column = period 1..6.
// Subject ids: the six academic SUBJECTS plus 'self_study' | 'club_intro' | 'cleanup' (no lesson, no knowledge gain).
import { SUBJECTS } from '../core/constants.js';

export const TIMETABLE = [
  ['math', 'literature', 'science', 'history', 'pe', 'pe'], // Mon
  ['literature', 'math', 'history', 'science', 'art', 'art'], // Tue
  ['science', 'math', 'literature', 'pe', 'history', 'self_study'], // Wed
  ['history', 'science', 'math', 'literature', 'art', 'club_intro'], // Thu
  ['math', 'literature', 'science', 'history', 'pe', 'cleanup'], // Fri
];

export const TEACHER = {
  math: 'mr_brandt', literature: 'ms_delaney', science: 'dr_fennel', history: 'mr_abel', art: 'mr_quill', pe: 'coach_mitchell',
  homeroom: 'ms_delaney', self_study: 'ms_delaney', club_intro: 'ms_delaney', cleanup: 'ms_delaney',
};
export const NON_LESSONS = ['self_study', 'club_intro', 'cleanup'];

export const isAcademic = (s) => SUBJECTS.includes(s);
/** Subject id at (weekdayIndex 0..4, period 1..6) or null outside the school week. */
export const subjectAt = (weekdayIndex, period) => (TIMETABLE[weekdayIndex] ? TIMETABLE[weekdayIndex][period - 1] || null : null);
export const teacherOf = (subject) => TEACHER[subject] || null;
/** [{ period, subject }] for a weekday index. */
export const lessonsOn = (weekdayIndex) => (TIMETABLE[weekdayIndex] || []).map((subject, i) => ({ period: i + 1, subject }));

/**
 * Where a period is "attended". Everything is the home classroom except PE, which is on the field in dry weather
 * (sunny/cloudy) and indoors (the classroom: stretching and rules of the game) when it rains, storms or snows.
 */
export function roomFor(subject, weather = 'sunny') {
  if (subject === 'pe') return weather === 'sunny' || weather === 'cloudy' ? 'school_field' : 'school_classroom';
  return 'school_classroom';
}
