// Sprite-sheet layouts: the CONTRACT between art generators (src/art) and the engine
// (src/engine Actor) / UI (portraits, icons). OWNED BY THE LEAD. Pure data, no DOM.
import { EXPRESSIONS, EMOTE_KINDS } from '../core/constants.js';

// ---- Character sheet: 6 cols x 6 rows of 16x24 frames = 96 x 144 px ----
//   rows 0-3  movement by facing (down,left,right,up), cols 0-2 = [stand, stepA, stepB]
//             walk animation plays the cycle [1,0,2,0] (stepA, stand, stepB, stand)
//   row 4     special poses: happy, sad, surprised, cheer, sleep(lying down, fills the frame)
//   row 5     seated poses by facing: down, left, right, up
// The sprite's anchor is bottom-centre of the frame (the feet).
export const CHAR_SHEET = {
  frameW: 16, frameH: 24, cols: 6, rows: 6,
  dirRow: { down: 0, left: 1, right: 2, up: 3 },
  standCol: 0,
  walkCycle: [1, 0, 2, 0],
  poseRow: 4,
  poseCol: { happy: 0, sad: 1, surprised: 2, cheer: 3, sleep: 4 },
  sitRow: 5,
  sitCol: { down: 0, left: 1, right: 2, up: 3 },
};

// ---- Animal sheet (cat): 16x16 frames, 6 cols x 5 rows = 96 x 80 ----
//   rows 0-3 walking by facing (down,left,right,up), cols 0-2 = [stand, stepA, stepB]
//   row 4: sit_front, sit_left, sit_right, sleep(curled), stretch, loaf
export const ANIMAL_SHEET = {
  frameW: 16, frameH: 16, cols: 6, rows: 5,
  dirRow: { down: 0, left: 1, right: 2, up: 3 },
  walkCycle: [1, 0, 2, 0],
  poseRow: 4,
  poseCol: { sit_front: 0, sit_left: 1, sit_right: 2, sleep: 3, stretch: 4, loaf: 5 },
};

// ---- Portrait sheet: 8 cols x 3 rows of 48x48 = 384 x 144 px ----
//   cols = EXPRESSIONS order; row 0 normal, row 1 eyes closed (blink), row 2 mouth open (talking)
export const PORTRAIT_SHEET = {
  size: 48, cols: 8, rows: 3,
  exprCol: Object.fromEntries(EXPRESSIONS.map((e, i) => [e, i])),
  rowNormal: 0, rowBlink: 1, rowTalk: 2,
};

// ---- Icon atlas: 16x16 icons, 16 columns; rows as needed. Name -> index comes from the
// runtime atlas (getIconAtlas().names), built from ICON_NAMES below (Art draws them all;
// a name with no drawing renders as a '?' box so content never crashes).
export const ICON_SHEET = { size: 16, cols: 16 };
export const ICON_NAMES = [
  // ui & stats
  'heart_full', 'heart_half', 'heart_empty', 'coin', 'energy', 'clock', 'calendar', 'book', 'pencil', 'star',
  'check', 'cross', 'arrow_up', 'arrow_down', 'arrow_right', 'lock', 'bell', 'music_note', 'paw', 'warning',
  // weather & seasons
  'sun', 'cloud', 'rain', 'storm', 'snow', 'season_spring', 'season_summer', 'season_autumn', 'season_winter', 'moon',
  // food & drink
  'bread', 'riceball', 'sandwich', 'cookie', 'cake', 'candy', 'chocolate', 'juice', 'soda', 'coffee', 'tea',
  'bento', 'apple', 'icecream', 'soup', 'curry', 'energy_drink', 'milk',
  // gifts
  'flower_red', 'flower_pink', 'flower_white', 'flower_yellow', 'bouquet', 'plushie', 'ribbon', 'hairpin', 'scarf', 'necklace',
  'perfume', 'keychain', 'charm', 'music_box', 'sketchbook', 'novel', 'postcard', 'shell', 'paint_set', 'headphones',
  // study & sport
  'textbook_math', 'textbook_lit', 'textbook_sci', 'textbook_hist', 'workbook', 'notebook', 'pen', 'calculator', 'flashcards',
  'sneakers', 'ball_soccer', 'towel', 'water_bottle', 'stopwatch', 'medal_gold', 'medal_silver', 'medal_bronze', 'trophy', 'baton',
  // misc & key items
  'key', 'letter', 'ticket', 'photo', 'map', 'bell_clapper', 'club_card', 'id_card', 'report_card', 'umbrella', 'camera', 'lantern',
  // emote bubbles (also drawn as 16x16 icons, name = emote_<kind>)
  ...EMOTE_KINDS.map((k) => `emote_${k}`),
];
