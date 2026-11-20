// Every tunable number of the simulation lives here (02 section 4). Frozen: tests and
// modules read it, nobody mutates it. Modules also accept an `opts.balance` override where
// that is cheap, so tests can exercise edge cases without touching the real values.

const deepFreeze = (o) => {
  for (const v of Object.values(o)) if (v && typeof v === 'object') deepFreeze(v);
  return Object.freeze(o);
};

export const BALANCE = deepFreeze({
  // ---- time -------------------------------------------------------------
  time: {
    forcedWake: 9 * 60, // forced sleep (02:00) -> wake at 09:00
    forcedSleepConduct: -1, // on a school day: misses homeroom, Aunt Roz scolds
    homeroomMinute: 8 * 60 + 20,
  },

  // ---- energy -----------------------------------------------------------
  energy: {
    base: 100,
    fitnessPerBonus: 10, // max energy +1 per 10 fitness above `fitnessFree`
    fitnessFree: 10,
    // sleep quality: first matching row wins (bedtime < `before`, minutes since midnight)
    restore: [
      { before: 23 * 60, pct: 1.0 },
      { before: 25 * 60, pct: 0.85 },
      { before: 1e9, pct: 0.65 },
    ],
    forcedPct: 0.5,
    skipMealPenalty: 10, // -10 next morning ...
    skipMealThreshold: 2, // ... when at least this many of breakfast/lunch/dinner were skipped
    // activity costs (used by T8 scenes; kept here so the whole economy is in one file)
    cost: { study: 12, clubPractice: 20, shift: 25, exam: 10 },
    benchRestPer30: 10,
    collapse: { fee: 30, wakeEnergy: 40, minutes: 120 },
    tiredBelow: 25, // study penalty threshold
  },

  // ---- money ------------------------------------------------------------
  money: {
    weeklyAllowance: 60, // Sunday morning
    cafeShift: 45,
    cafeShiftBonus: 10, // mini-game >= silver
    max: 99999,
  },

  // ---- stats ------------------------------------------------------------
  stats: {
    max: 100,
    min: 0,
    diminishAbove: 70, // subject gains above this knowledge are multiplied by diminishFactor
    diminishFactor: 0.6,
    subjectDecayIdleDays: 21, // untouched this long -> -1 per week (Mondays)
    subjectDecayFloor: 10,
    studyGain: { min: 3, max: 6, libraryBonus: 1, tiredPenalty: -2 },
    bookBonusMax: 2, // cap of inventory.studyBonus()
  },

  // ---- relationships ----------------------------------------------------
  friendship: {
    perHeart: 10,
    max: 100,
    talk: 2,
    gift: { loves: 8, likes: 4, neutral: 1, dislikes: -3, hates: -6 },
    birthdayMultiplier: 3, // positive gifts only, once per year
    giftsPerWeekCap: 0, // 0 = unlimited (the real limit is one gift per NPC per day)
    decay: {
      idleDays: 7, // no contact for this many days ...
      minPeakPoints: 30, // ... once the friendship has reached 3 hearts ...
      everyDays: 3, // ... -1 point every N days ...
      floor: 20, // ... never below this
      exempt: ['roz'], // family does not drift apart
    },
  },

  // ---- inventory --------------------------------------------------------
  inventory: { maxStacks: 30, maxStack: 99 },

  // ---- calendar ---------------------------------------------------------
  calendar: { upcomingHorizonDays: 56 },

  // ---- save -------------------------------------------------------------
  save: {
    slots: ['slot1', 'slot2', 'slot3'],
    autoSlot: 'auto',
    defaultSettings: { musicVolume: 0.7, sfxVolume: 0.8, textSpeed: 2, keyHints: true, screenShake: true },
  },
});

export default BALANCE;
