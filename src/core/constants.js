/** Tuning numbers from DESIGN §5 / §13. Pure data. */

/** Game minutes advanced per real second (settings.timeScale). */
export const TIME_SCALE = { slow: 1.2, normal: 2, fast: 3 };

export const ENERGY = {
  max: 100,
  fishingCast: 3,
  foragePick: 1,
  bakeryShift: 20,
  parcelRun: 15,
  lamplighting: 10,
  running: 0,
  benchPer10Min: 3,
  sleepInBedByMidnight: 1.0,   // fraction of max restored when in bed by 24:00
  sleepLate: 0.7,              // later than 24:00
  sleepCollapse: 0.5,          // forced collapse at 26:00
};

export const AFFECTION = {
  max: 1000,
  perHeart: 100,
  maxHearts: 10,
  talk: 12,
  gift: { love: 80, like: 45, neutral: 20, dislike: -20, hate: -60 },
  birthdayMult: 3,
  giftsPerDay: 1,
  giftsPerWeekSoftCap: 3,
  decayPerDay: 2,
  decayAfterDays: 3,
  heartEvents: [2, 4, 6, 8],
};

/** Tiles per second. */
export const SPEED = { walk: 2.6, run: 5.0 };

/** Clock constants mirrored for convenience. */
export const CLOCK = { warning: 1440, collapse: 1560, wake: 360 };

export const UI_COLORS = {
  parchment: '#fff4dc',
  border: '#8a5a3a',
  ink: '#4a3426',
  leaf: '#6fb85a',
  sky: '#6fb7e8',
  berry: '#e0607e',
  sun: '#f4c542',
  night: '#2b3a67',
};

export const SEASON_COLORS = {
  spring: { grass: '#8fd16a', blossom: '#ffb7cf', sky: '#9fd8ff' },
  summer: { grass: '#5fbf4a', sky: '#6ec6ff', sunflower: '#ffd23f', sea: '#3fc5c9' },
  autumn: { amber: '#e8923a', russet: '#c2562b', grass: '#c9b45a', dusk: '#f2b27a' },
  winter: { snow: '#f4f9ff', ice: '#bfe0f5', evergreen: '#2f6b4f', window: '#ffc46b' },
};

export const START_MONEY = 300;
export const INVENTORY_CAPACITY = 24;
export const STORAGE_CAPACITY = 48;
export const STACK_MAX = 99;
