// Shared constants. OWNED BY THE LEAD. Changing a value here changes the contract
// for every workstream, so workers must not edit this file (report the need instead).

export const GAME_TITLE = 'Bellhaven Days';
export const SAVE_VERSION = 1;
export const SAVE_PREFIX = 'bellhaven_days_v1'; // localStorage key prefix

// ---- Rendering ------------------------------------------------------------
export const VIEW_W = 320; // logical pixels (the WebGL canvas backing store is exactly this size)
export const VIEW_H = 240;
export const TILE = 16; // tile size in pixels
export const CHAR_W = 16; // character sprite frame
export const CHAR_H = 24;
export const PORTRAIT_SIZE = 48;
export const ICON_SIZE = 16;

// ---- Directions (also the row order of character sprite sheets) ----------
export const DIRS = ['down', 'left', 'right', 'up'];
export const DIR_VEC = { down: [0, 1], left: [-1, 0], right: [1, 0], up: [0, -1] };

// ---- Calendar -------------------------------------------------------------
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const SEASON_LABEL = { spring: 'Spring', summer: 'Summer', autumn: 'Autumn', winter: 'Winter' };
export const SEASON_SHORT = { spring: 'Spr', summer: 'Sum', autumn: 'Aut', winter: 'Win' };
export const DAYS_PER_SEASON = 28; // every season starts on a Monday
export const YEARS = 3; // school years in the game
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const WEEKDAY_LABEL = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday',
  Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};
// weekday of (season day d, 1..28) is WEEKDAYS[(d - 1) % 7]

// ---- Clock (all times are integer minutes since midnight; 'HH:MM' strings in data) ----
export const DAY_START = 6 * 60 + 30; // 06:30 default wake time
export const DAY_END = 26 * 60; // 02:00 forced sleep (clock may run past midnight to 1560)
export const SECONDS_PER_GAME_MINUTE = 0.7; // overworld pace: 1 game hour ~ 42 real seconds
export const HOMEROOM = '08:20';
export const PERIODS = [
  { n: 1, start: '08:30', end: '09:20' },
  { n: 2, start: '09:30', end: '10:20' },
  { n: 3, start: '10:30', end: '11:20' },
  { n: 4, start: '11:30', end: '12:20' },
  // lunch 12:20 - 13:10
  { n: 5, start: '13:10', end: '14:00' },
  { n: 6, start: '14:10', end: '15:00' },
];
export const LUNCH = { start: '12:20', end: '13:10' };
export const AFTER_SCHOOL = '15:10'; // clubs / free time start
export const CURFEW_WARN = '23:00'; // Aunt Roz nags

// ---- World ---------------------------------------------------------------
export const WEATHER_KINDS = ['sunny', 'cloudy', 'rain', 'storm', 'snow'];

// ---- Player / stats -------------------------------------------------------
export const PLAYER_ID = 'theo';
export const SUBJECTS = ['math', 'literature', 'science', 'history', 'art', 'pe'];
export const SUBJECT_LABEL = {
  math: 'Math', literature: 'Literature', science: 'Science',
  history: 'History', art: 'Art & Music', pe: 'P.E.',
};
export const TRAITS = ['fitness', 'charm', 'creativity'];
export const TRAIT_LABEL = { fitness: 'Fitness', charm: 'Charm', creativity: 'Creativity' };
export const CURRENCY = '$';
export const START_MONEY = 300;
export const MAX_ENERGY = 100;

// ---- Relationships ---------------------------------------------------------
export const POINTS_PER_HEART = 10;
export const MAX_HEARTS = 10;
export const MAX_FRIENDSHIP = POINTS_PER_HEART * MAX_HEARTS; // 100

// ---- Presentation vocab shared by art / ui / content ----------------------
export const EXPRESSIONS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'shy', 'thinking', 'smug'];
export const EMOTE_KINDS = ['heart', 'sweat', 'note', 'anger', 'exclaim', 'question', 'dots', 'sparkle', 'zzz'];
export const POSES = ['happy', 'sad', 'surprised', 'sit', 'sleep', 'cheer'];
export const LIGHTING_PRESETS = ['day', 'sunset', 'night', 'lantern', 'indoor', 'auto'];

export const CLUBS = ['track', 'soccer', 'art', 'music', 'literature', 'astronomy'];
export const CLUB_LABEL = {
  track: 'Track & Field Club', soccer: 'Soccer Club', art: 'Art Club',
  music: 'Music Club', literature: 'Literature Club', astronomy: 'Astronomy Club',
};
