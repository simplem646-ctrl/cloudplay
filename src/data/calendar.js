// The school-year calendar as DATA. OWNED BY THE LEAD (it is the contract between
// simulation, world, story and UI). src/sim/calendar.js builds helpers on top of it.
//
// Every season has 28 days and starts on a Monday: weekday = WEEKDAYS[(day - 1) % 7]
//   days 1,8,15,22 = Mon ... days 6,13,20,27 = Sat; days 7,14,21,28 = Sun.
// A school year = spring, summer, autumn, winter (112 days). The game lasts YEARS = 3.
// School days: Mon-Fri, except BREAKS, festivals with classesCancelled, and exam days
// (exam days have exams instead of lessons).
//
// Festival fields
//   days        [d] or [d1, d2] (inclusive range, same season)
//   kind        'ceremony' | 'school' | 'sports' | 'town'
//   place       map id where the festival's main scene is set
//   start/end   'HH:MM' window in which the festival event can start / runs
//   eventId     id of the main scripted event (written by the story workstream)
//   classesCancelled  true -> no lessons that day
//   yearly      per-year behaviour is handled INSIDE the event script via { year: n } conditions

export const FESTIVALS = [
  { id: 'entrance_ceremony', name: 'Entrance Ceremony', season: 'spring', days: [1], kind: 'ceremony', place: 'school_grounds', start: '08:20', end: '11:00', classesCancelled: true, eventId: 'fest_entrance_ceremony', blurb: 'A new school year begins under the cherry blossoms.' },
  { id: 'club_fair', name: 'Club Fair', season: 'spring', days: [5], kind: 'school', place: 'school_grounds', start: '15:10', end: '17:30', classesCancelled: false, eventId: 'fest_club_fair', blurb: 'Every club recruits. Join one (or none).' },
  { id: 'blossom_day', name: 'Blossom Day', season: 'spring', days: [14], kind: 'town', place: 'town_park', start: '10:00', end: '20:00', eventId: 'fest_blossom_day', blurb: 'Picnics, lanterns and falling petals in the park.' },
  { id: 'regional_meet', name: 'Regional Track Meet', season: 'summer', days: [20], kind: 'sports', place: 'school_field', start: '09:00', end: '17:00', eventId: 'fest_regional_meet', blurb: 'Schools from the coast race on Bellhaven\'s track.' },
  { id: 'beach_day', name: 'Beach Day', season: 'summer', days: [21], kind: 'town', place: 'beach', start: '10:00', end: '18:00', eventId: 'fest_beach_day', blurb: 'The whole town heads to the cove.' },
  { id: 'fireworks', name: 'Fireworks Night', season: 'summer', days: [27], kind: 'town', place: 'beach', start: '18:00', end: '22:30', eventId: 'fest_fireworks', blurb: 'Summer\'s farewell, over the water.' },
  { id: 'sports_festival', name: 'Sports Festival', season: 'autumn', days: [13], kind: 'sports', place: 'school_field', start: '09:00', end: '16:00', eventId: 'fest_sports_festival', blurb: 'Class against class. Relays, tug-of-war and pride.' },
  { id: 'moon_night', name: 'Moon Viewing Night', season: 'autumn', days: [20], kind: 'town', place: 'hill_observatory', start: '18:30', end: '22:30', eventId: 'fest_moon_night', blurb: 'Dumplings, telescopes and the biggest moon of the year.' },
  { id: 'bell_festival', name: 'Bell Festival', season: 'autumn', days: [27, 28], kind: 'school', place: 'school_grounds', start: '09:00', end: '20:00', eventId: 'fest_bell_festival', blurb: 'The school\'s culture festival, two days of stalls, stages and secrets.' },
  { id: 'lantern_night', name: 'Lantern Night', season: 'winter', days: [14], kind: 'town', place: 'town_harbor', start: '17:30', end: '22:30', eventId: 'fest_lantern_night', blurb: 'Paper lanterns float out on the harbor.' },
  { id: 'heart_day', name: 'Heart Day', season: 'winter', days: [25], kind: 'school', place: 'school_grounds', start: '07:30', end: '18:00', eventId: 'fest_heart_day', blurb: 'Chocolates, notes and nervous glances.' },
  { id: 'closing_ceremony', name: 'Closing Ceremony', season: 'winter', days: [26], kind: 'ceremony', place: 'school_gym', start: '09:00', end: '11:30', classesCancelled: true, eventId: 'fest_closing_ceremony', blurb: 'The year ends. In Year 3 this is Graduation.' },
  { id: 'bell_night', name: 'Bell Night', season: 'winter', days: [28], kind: 'town', place: 'school_grounds', start: '22:30', end: '24:30', eventId: 'fest_bell_night', blurb: 'At midnight the town gathers on Lantern Hill to listen for the bell.' },
];

// Exams. Subjects per exam day are examined in that order; each exam day takes the whole
// school day (the player sits it in school_classroom; skipping it = a zero for those subjects).
export const EXAMS = [
  { id: 'midterm1', label: 'Midterm Exams (Term 1)', kind: 'midterm', term: 1, season: 'spring', days: [22, 23, 24], resultsDay: 26 },
  { id: 'final1', label: 'Final Exams (Term 1)', kind: 'final', term: 1, season: 'summer', days: [8, 9, 10], resultsDay: 12 },
  { id: 'midterm2', label: 'Midterm Exams (Term 2)', kind: 'midterm', term: 2, season: 'autumn', days: [22, 23, 24], resultsDay: 26 },
  { id: 'final2', label: 'Final Exams (Term 2)', kind: 'final', term: 2, season: 'winter', days: [8, 9, 10], resultsDay: 12 },
];
export const EXAM_DAY_SUBJECTS = [['math', 'literature'], ['science', 'history'], ['art', 'pe']];

// Holidays / breaks (no lessons Mon-Fri inside the range, inclusive).
export const BREAKS = [
  { id: 'summer_break', name: 'Summer Break', season: 'summer', from: 15, to: 28 },
  { id: 'winter_break', name: 'Winter Break', season: 'winter', from: 15, to: 21 },
];

// Fixed story dates the scenes/sim must know about (events themselves live in content).
export const KEY_DATES = {
  gameStart: { year: 1, season: 'spring', day: 1 },
  boardDecision: { year: 3, season: 'winter', day: 22 }, // Mon: the school board votes (main story)
  graduation: { year: 3, season: 'winter', day: 26 }, // = closing_ceremony in Year 3
  finale: { year: 3, season: 'winter', day: 28 }, // = bell_night in Year 3 -> ending sequence
};

// ---- tiny lookups (pure) ----
export const weekdayIndex = (day) => (day - 1) % 7;
export function festivalOn(season, day) {
  return FESTIVALS.find((f) => f.season === season && day >= f.days[0] && day <= f.days[f.days.length - 1]) || null;
}
export function breakOn(season, day) {
  return BREAKS.find((b) => b.season === season && day >= b.from && day <= b.to) || null;
}
export function examDayInfo(season, day) {
  for (const e of EXAMS) {
    if (e.season !== season) continue;
    const i = e.days.indexOf(day);
    if (i >= 0) return { exam: e, dayIndex: i, subjects: EXAM_DAY_SUBJECTS[i] };
    if (day === e.resultsDay) return { exam: e, results: true };
  }
  return null;
}
