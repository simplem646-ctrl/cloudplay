// Bellhaven tile catalog. PURE DATA (no DOM): importable in Node.
//
// Index 0 is "empty". Indices are assigned in declaration order and are STABLE: only ever APPEND new
// tiles at the end of the last section (never reorder / delete) so saved maps and docs stay valid.
// Names and indices are identical in all four seasons; only the pixels (tileset.js) differ.
//
// Every entry: { name, art, layer, solid?, sound?, water?, anim?, door?, bridge?, hidden?, indoor? }
//   art    - [painterKind, ...args] consumed by tileset.js ('@kind' = slice of a multi-tile sheet painter)
//   layer  - default layer for builder.put(): 'ground' | 'deco' | 'above'
//   solid  - blocks movement (deco/ground). water: deep water (solid). bridge: walkable deco over water.
//   door   - a door tile you step onto to warp. hidden: animation frame only (not for maps).
//   anim   - { frames:[idx...], fps }  (frames[0] is the tile itself)
import { SEASONS } from '../core/constants.js';

export { SEASONS };
export const ATLAS_COLS = 32;

export const TILES = [{ name: 'empty', art: null, layer: 'ground' }];
export const NAME_TO_INDEX = { empty: 0 };

function add(name, art, o = {}) {
  if (NAME_TO_INDEX[name] !== undefined) throw new Error(`tiles.js: duplicate tile name "${name}"`);
  const idx = TILES.length;
  TILES.push({ name, art, layer: 'deco', ...o });
  NAME_TO_INDEX[name] = idx;
  return idx;
}
/** animated tile: painter receives the frame number as its LAST argument */
function addAnim(name, art, nFrames, fps, o = {}) {
  const base = add(name, [...art, 0], o);
  const frames = [base];
  for (let f = 1; f < nFrames; f++) frames.push(add(`${name}~${f}`, [...art, f], { ...o, hidden: true }));
  TILES[base].anim = { frames, fps };
  return base;
}
const range = (n) => Array.from({ length: n }, (_, i) => i);
const G = { layer: 'ground' };

// =====================================================================================
// 1. GROUND TERRAIN (layer: ground)
// =====================================================================================
['a', 'b', 'c', 'd'].forEach((s, i) => add(`grass_${s}`, ['grass', i], { ...G, sound: 'grass' }));
add('grass_dark', ['grass', 4], { ...G, sound: 'grass' });
add('grass_lush', ['grass', 5], { ...G, sound: 'grass' });
['a', 'b', 'c'].forEach((s, i) => add(`dirt_${s}`, ['dirt', i], { ...G, sound: 'grass' }));
['a', 'b'].forEach((s, i) => add(`gravel_${s}`, ['gravel', i], { ...G, sound: 'stone' }));
['a', 'b', 'c'].forEach((s, i) => add(`sand_${s}`, ['sand', i], { ...G, sound: 'sand' }));
add('sand_wet', ['sand', 3], { ...G, sound: 'sand' });
['a', 'b'].forEach((s, i) => add(`snowfield_${s}`, ['snowfield', i], { ...G, sound: 'grass' }));
['a', 'b'].forEach((s, i) => add(`paver_${s}`, ['paver', i], { ...G, sound: 'stone' }));
['a', 'b'].forEach((s, i) => add(`paver_red_${s}`, ['paverBrick', i], { ...G, sound: 'stone' }));
['a', 'b'].forEach((s, i) => add(`paver_slate_${s}`, ['paverSlate', i], { ...G, sound: 'stone' }));
['a', 'b'].forEach((s, i) => add(`flagstone_${s}`, ['flag', i], { ...G, sound: 'stone' }));
['a', 'b'].forEach((s, i) => add(`plank_h_${s}`, ['plank', 'h', i], { ...G, sound: 'wood' }));
['a', 'b'].forEach((s, i) => add(`plank_v_${s}`, ['plank', 'v', i], { ...G, sound: 'wood' }));

// autotile ground terrains: <prefix>_<mask 0..15> (+ _15b/_15c interior variants), mask N=1 E=2 S=4 W=8
const AUTO_SOUND = { path_dirt: 'grass', path_stone: 'stone', cobble: 'stone', sand: 'sand', snow: 'grass' };
for (const t of ['path_dirt', 'path_stone', 'cobble', 'sand', 'snow']) {
  range(16).forEach((m) => add(`${t}_${m}`, ['auto', t, m, 0], { ...G, sound: AUTO_SOUND[t], auto: t }));
  add(`${t}_15b`, ['auto', t, 15, 1], { ...G, sound: AUTO_SOUND[t], auto: t });
  add(`${t}_15c`, ['auto', t, 15, 2], { ...G, sound: AUTO_SOUND[t], auto: t });
}
// water: g = pond (grass shore), s = sea (sand shore, foam), q = sea (stone quay shore); 4 animated frames
for (const k of ['g', 's', 'q']) {
  range(16).forEach((m) => addAnim(`water_${k}_${m}`, ['water', k, m], 4, 3, { ...G, solid: true, water: true, sound: 'water', auto: `water_${k}` }));
}
addAnim('sea_deep', ['water', 'd', 15], 4, 3, { ...G, solid: true, water: true, sound: 'water' });
addAnim('fountain_water', ['fountainWater'], 4, 4, { ...G, solid: true, water: true, sound: 'water' });

// =====================================================================================
// 2. AUTOTILE DECO TERRAINS (layer: deco): hedges, fences, railings, low walls
// =====================================================================================
for (const t of ['hedge', 'hedge_bloom', 'fence_wood', 'fence_picket', 'rail_iron', 'lowwall']) {
  range(16).forEach((m) => add(`${t}_${m}`, ['autoDeco', t, m], { layer: 'deco', solid: true, sound: 'grass', auto: t }));
}

// =====================================================================================
// 3. NATURE: flowers, grass, bushes, trees, rocks, beach bits (decorations on deco; canopies on above)
// =====================================================================================
for (const set of ['red', 'yellow', 'pink', 'white', 'blue', 'purple', 'orange', 'mixed_a', 'mixed_b', 'mixed_c']) {
  addAnim(`flowers_${set}`, ['flowers', set], 2, 2, { sound: 'grass' });
}
addAnim('tallgrass_a', ['tallgrass', 0], 2, 2, { sound: 'grass' });
addAnim('tallgrass_b', ['tallgrass', 1], 2, 2, { sound: 'grass' });
add('tuft_a', ['tuft', 0], { sound: 'grass' });
add('clover_a', ['clover'], { sound: 'grass' });
add('weeds_a', ['weeds', 0], { sound: 'grass' });
add('weeds_b', ['weeds', 1], { sound: 'grass' });
add('mushrooms_a', ['mushrooms', 0], { sound: 'grass' });
add('mushrooms_b', ['mushrooms', 1], { sound: 'grass' });
add('fern_a', ['ferns', 0], { sound: 'grass' });
addAnim('reeds_a', ['reeds', 0], 2, 2, { sound: 'grass' });
add('lilypad_a', ['lilypad', 0], {});
add('bush_round', ['bush', 0], { solid: true, sound: 'grass' });
add('bush_berry', ['bush', 1], { solid: true, sound: 'grass' });
add('bush_blossom', ['bush', 2], { solid: true, sound: 'grass' });
add('bush_small', ['bush', 3], { solid: true, sound: 'grass' });
add('trunk_round', ['trunk', 'round'], { solid: true, sound: 'grass' });
add('trunk_cherry', ['trunk', 'cherry'], { solid: true, sound: 'grass' });
add('trunk_pine', ['trunk', 'pine'], { solid: true, sound: 'grass' });
add('trunk_palm', ['trunk', 'palm'], { solid: true, sound: 'sand' });
add('sapling_a', ['sapling'], { solid: true, sound: 'grass' });
add('stump_a', ['stump', 0], { solid: true, sound: 'grass' });
add('stump_b', ['stump', 1], { solid: true, sound: 'grass' });
add('log_h', ['log', 0], { solid: true, sound: 'grass' });
for (const [kind, w, h] of [['round', 3, 2], ['cherry', 3, 2], ['pine', 3, 3], ['palm', 3, 2]]) {
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    add(`tree_${kind}_${c}_${r}`, [kind === 'pine' ? '@pine' : kind === 'palm' ? '@palm' : '@tree', ...(kind === 'pine' || kind === 'palm' ? [] : [kind]), c, r], { layer: 'above' });
  }
}
['a', 'b', 'c', 'd'].forEach((s, i) => add(`rock_${s}`, ['rock', i], { solid: true, sound: 'stone' }));
['a', 'b'].forEach((s, i) => add(`pebbles_${s}`, ['pebbles', i], { sound: 'stone' }));
add('stepping_stone', ['steppingStone'], { sound: 'stone' });
['a', 'b', 'c'].forEach((s, i) => add(`driftwood_${s}`, ['driftwood', i], { solid: i === 0, sound: 'sand' }));
['scallop', 'spiral', 'starfish'].forEach((s, i) => add(`shell_${s}`, ['shell', i], { sound: 'sand' }));
addAnim('tidepool', ['tidepool'], 3, 2, { sound: 'water' });

// =====================================================================================
// 4. BUILDINGS (outdoor): roofs + overlays on `above`, walls/windows/doors on `deco`
// =====================================================================================
export const ROOF_COLORS = ['red', 'blue', 'green', 'slate', 'brown', 'orange', 'purple', 'teal'];
export const WALL_STYLES = ['cream', 'pink', 'blue', 'yellow', 'brick', 'stone', 'wood', 'white', 'green', 'timber'];
export const DOOR_COLORS = ['wood', 'red', 'blue', 'green', 'yellow', 'white', 'glass', 'grand'];
export const AWNING_COLORS = ['red', 'green', 'blue', 'yellow', 'orange', 'purple'];
export const PLAQUE_ICONS = ['bread', 'flower', 'book', 'mart', 'clinic', 'cafe', 'hall', 'fish', 'bell', 'school'];
for (const c of ROOF_COLORS) {
  for (const part of ['tl', 't', 'tr', 'ml', 'm', 'mr', 'bl', 'b', 'br']) add(`roof_${c}_${part}`, ['roof', c, part], { layer: 'above' });
  add(`roof_${c}_chim`, ['chimneyBase', c], { layer: 'above' });
}
addAnim('chimney_brick_top', ['chimneyTop', 'brick'], 3, 2, { layer: 'above' });
addAnim('chimney_stone_top', ['chimneyTop', 'stone'], 3, 2, { layer: 'above' });
for (const s of WALL_STYLES) {
  add(`wall_${s}`, ['wall', s, 'mid'], { solid: true, sound: 'stone' });
  add(`wall_${s}_eave`, ['wall', s, 'eave'], { solid: true, sound: 'stone' });
  add(`wall_${s}_base`, ['wall', s, 'base'], { solid: true, sound: 'stone' });
  for (const k of ['plain', 'shut', 'box', 'lit']) add(`win_${s}${k === 'plain' ? '' : '_' + k}`, ['win', s, k], { solid: true });
}
for (const c of DOOR_COLORS) {
  add(`door_${c}_hi`, ['door', c, 'hi'], { solid: true, sound: 'wood' });
  add(`door_${c}_lo`, ['door', c, 'lo'], { door: true, sound: 'wood' });
}
for (const c of AWNING_COLORS) for (const p of ['l', 'm', 'r']) add(`awning_${c}_${p}`, ['awning', c, p], { layer: 'above' });
for (const i of PLAQUE_ICONS) add(`plaque_${i}`, ['plaque', i], { layer: 'above' });
add('plaque_school_blue', ['plaque', 'school', 'blue'], { layer: 'above' });
for (const k of ['stone', 'wood', 'marble']) for (const p of ['m', 'l', 'r', 'lr']) add(`stairs_${k}_${p}`, ['stairs', k, p], { sound: k === 'wood' ? 'wood' : 'stone' });
add('stairs_side_l', ['stairsSide', 'stone', 'l'], { sound: 'stone' });
add('stairs_side_r', ['stairsSide', 'stone', 'r'], { sound: 'stone' });
for (const p of ['h', 'v']) add(`bridge_${p}`, ['bridge', p], { bridge: true, sound: 'wood' });
for (const p of ['rt', 'rb', 'vl', 'vr']) add(`bridge_${p}`, ['bridge', p], { solid: true, sound: 'wood' });
for (const p of ['a', 'l', 'r', 'ivy']) add(`cliff_${p}`, ['cliff', p], { solid: true, sound: 'stone' });

// =====================================================================================
// 5. STREET FURNITURE (sheets cut into tiles)
// =====================================================================================
add('lamp_head', ['@lamp', 0, 0], { layer: 'above' });
add('lamp_mid', ['@lamp', 0, 1], {});
add('lamp_base', ['@lamp', 0, 2], { solid: true });
add('bench_l', ['@bench', 0, 0], { solid: true, sound: 'wood' });
add('bench_r', ['@bench', 1, 0], { solid: true, sound: 'wood' });
for (let r = 0; r < 5; r++) for (let c = 0; c < 5; c++) add(`fountain_${c}_${r}`, ['@fountain', c, r], { solid: true, sound: 'stone' });
add('clockpost_top', ['@clockpost', 0, 0], { layer: 'above' });
add('clockpost_mid', ['@clockpost', 0, 1], {});
add('clockpost_base', ['@clockpost', 0, 2], { solid: true });
add('noticeboard_l', ['@noticeboard', 0, 0], { solid: true });
add('noticeboard_r', ['@noticeboard', 1, 0], { solid: true });
for (const c of ['blue', 'red']) { add(`vending_${c}_hi`, ['@vending', c, 0, 0], { solid: true }); add(`vending_${c}_lo`, ['@vending', c, 0, 1], { solid: true }); }
add('busstop_top', ['@busstop', 0, 0], { layer: 'above' });
add('busstop_base', ['@busstop', 0, 1], { solid: true });
add('bikerack_l', ['@bikerack', 0, 0], { solid: true });
add('bikerack_r', ['@bikerack', 1, 0], { solid: true });
add('planter_stone', ['planter', 0], { solid: true });
add('planter_wood', ['planter', 1], { solid: true });
add('mailbox_red', ['mailbox', 0], { solid: true });
add('mailbox_blue', ['mailbox', 1], { solid: true });
add('trash_can', ['trash'], { solid: true });
add('signpost', ['signpost'], { solid: true });

// =====================================================================================
// 6. INDOOR (identical in every season): floors, walls, windows, doors, furniture
// =====================================================================================
const IND = { indoor: true };
export const FLOOR_KINDS = ['wood', 'wood_dark', 'wood_light', 'gym', 'tile_white', 'school', 'tile_kitchen', 'tile_checker', 'carpet_red', 'carpet_blue', 'carpet_green', 'carpet_cream', 'carpet_purple', 'stone'];
export const INDOOR_WALL_STYLES = ['cream', 'school', 'wood', 'blue', 'pink', 'brick', 'stone'];
for (const k of FLOOR_KINDS) ['a', 'b'].forEach((v, i) => add(`floor_${k}_${v}`, ['floor', k, i], { ...G, ...IND, sound: k.startsWith('carpet') ? 'carpet' : k.startsWith('wood') || k === 'gym' ? 'wood' : 'tile' }));
for (const s of INDOOR_WALL_STYLES) for (const p of ['hi', 'face', 'cap', 'cap_s', 'cap_l', 'cap_r']) add(`iwall_${s}_${p}`, ['iwall', s, p], { solid: true, ...IND });
for (const k of ['harbor', 'plain', 'curtain', 'school']) for (const p of ['hi', 'face']) add(`iwin_${k}_${p}`, ['iwin', k, p], { solid: true, ...IND });
for (const k of ['wood', 'school', 'white', 'stairs']) {
  add(`idoor_${k}_hi`, ['idoor', k, 'hi'], { solid: true, ...IND });
  add(`idoor_${k}_lo`, ['idoor', k, 'lo'], { door: true, sound: 'wood', ...IND });
}
const FUR = { ...IND, solid: true };
for (const c of ['blue', 'red', 'green', 'pink', 'white']) { add(`bed_${c}_head`, ['furn', 'bed', 'head', c], FUR); add(`bed_${c}_foot`, ['furn', 'bed', 'foot', c], FUR); }
for (const p of ['l', 'm', 'r']) add(`desk_${p}`, ['furn', 'desk', p], FUR);
for (const it of ['diary', 'lamp', 'books', 'papers', 'plant', 'globe', 'bell']) add(`desk_m_${it}`, ['furn', 'desk', 'm', it], FUR);
for (const c of ['wood', 'red']) for (const d of ['d', 'u', 'l', 'r']) add(`chair_${c}_${d}`, ['furn', 'chair', d, c], { ...IND });
for (const cl of [null, 'red', 'blue', 'white']) for (const p of ['l', 'm', 'r', 'o']) add(`table_${cl ? cl + '_' : ''}${p}`, ['furn', 'table', p, cl], FUR);
add('table_tea', ['furn', 'table', 'o', 'tea'], FUR);
for (const k of ['wood', 'marble']) for (const p of ['l', 'm', 'r']) add(`counter_${k}_${p}`, ['furn', 'counter', p, k], FUR);
for (const c of ['brown', 'white']) for (const p of ['hi', 'lo']) add(`bookcase_${c}_${p}`, ['furn', 'bookcase', p, c], FUR);
for (const p of ['hi', 'lo']) { add(`wardrobe_${p}`, ['furn', 'wardrobe', p], FUR); add(`fridge_${p}`, ['furn', 'fridge', p], FUR); }
add('stove', ['furn', 'stove', 'm'], FUR);
add('sink', ['furn', 'sink', 'm'], FUR);
for (const c of ['red', 'blue', 'green']) for (const p of ['l', 'm', 'r']) add(`sofa_${c}_${p}`, ['furn', 'sofa', p, c], FUR);
add('tv_stand', ['furn', 'tv', 'm'], FUR);
add('plant_pot', ['furn', 'plant', 'pot'], FUR);
add('plant_tall_hi', ['furn', 'plant', 'hi'], FUR);
add('plant_tall_lo', ['furn', 'plant', 'lo'], FUR);
for (const p of ['l', 'm', 'r']) add(`blackboard_${p}`, ['furn', 'blackboard', p, 0], FUR);
add('blackboard_m_text1', ['furn', 'blackboard', 'm', 1], FUR);
add('blackboard_m_text2', ['furn', 'blackboard', 'm', 2], FUR);
add('blackboard_l_text2', ['furn', 'blackboard', 'l', 2], FUR);
add('schooldesk_a', ['furn', 'schooldesk', 'm', 0], FUR);
add('schooldesk_b', ['furn', 'schooldesk', 'm', 1], FUR);
for (const c of ['blue', 'green', 'red', 'grey']) for (const p of ['hi', 'lo']) add(`locker_${c}_${p}`, ['furn', 'locker', p, c], FUR);
for (const c of ['red', 'blue', 'green', 'cream', 'purple']) for (const pos of ['tl', 't', 'tr', 'l', 'c', 'r', 'bl', 'b', 'br']) add(`rug_${c}_${pos}`, ['furn', 'rug', pos, c], { ...IND, layer: 'ground' });
for (const o of [['frame_family', 'family'], ['frame_landscape', 'landscape'], ['frame_flower', 'flower'], ['wall_clock', 'clock'], ['wall_calendar', 'calendar'], ['wall_shelf', 'shelf'], ['wall_notice', 'notice'], ['wall_poster', 'poster']]) add(o[0], ['furn', 'frame', o[1]], { layer: 'above', ...IND });

// =====================================================================================
// TERRAIN TABLE (used by builder.paint). plain = random pick from `tiles`; auto = autotile prefix
// =====================================================================================
export const TERRAINS = {
  grass: { layer: 'ground', tiles: ['grass_a', 'grass_b', 'grass_c', 'grass_d'], weights: [52, 24, 16, 8], group: 'grass' },
  grass_dark: { layer: 'ground', tiles: ['grass_dark'], group: 'grass' },
  grass_lush: { layer: 'ground', tiles: ['grass_lush'], group: 'grass' },
  dirt: { layer: 'ground', tiles: ['dirt_a', 'dirt_b', 'dirt_c'], weights: [50, 30, 20], group: 'dirt' },
  gravel: { layer: 'ground', tiles: ['gravel_a', 'gravel_b'], group: 'surface' },
  plaza: { layer: 'ground', tiles: ['paver_a', 'paver_b'], group: 'surface' },
  brick: { layer: 'ground', tiles: ['paver_red_a', 'paver_red_b'], group: 'surface' },
  slate: { layer: 'ground', tiles: ['paver_slate_a', 'paver_slate_b'], group: 'surface' },
  flagstone: { layer: 'ground', tiles: ['flagstone_a', 'flagstone_b'], group: 'surface' },
  boards_h: { layer: 'ground', tiles: ['plank_h_a', 'plank_h_b'], group: 'surface' },
  boards_v: { layer: 'ground', tiles: ['plank_v_a', 'plank_v_b'], group: 'surface' },
  sand_flat: { layer: 'ground', tiles: ['sand_a', 'sand_b', 'sand_c'], weights: [60, 25, 15], group: 'surface' },
  snowfield: { layer: 'ground', tiles: ['snowfield_a', 'snowfield_b'], group: 'snow' },
  path: { layer: 'ground', auto: 'path_dirt', group: 'surface' },
  stone: { layer: 'ground', auto: 'path_stone', group: 'surface' },
  cobble: { layer: 'ground', auto: 'cobble', group: 'surface' },
  sand: { layer: 'ground', auto: 'sand', group: 'surface' },
  snow: { layer: 'ground', auto: 'snow', group: 'snow' },
  water: { layer: 'ground', autoWater: 'g', group: 'water' },
  sea: { layer: 'ground', autoWater: 's', group: 'water' },
  hedge: { layer: 'deco', auto: 'hedge', group: 'hedge' },
  hedge_bloom: { layer: 'deco', auto: 'hedge_bloom', group: 'hedge' },
  fence: { layer: 'deco', auto: 'fence_wood', group: 'fence_wood' },
  picket: { layer: 'deco', auto: 'fence_picket', group: 'fence_picket' },
  railing: { layer: 'deco', auto: 'rail_iron', group: 'rail_iron' },
  lowwall: { layer: 'deco', auto: 'lowwall', group: 'lowwall' },
};

export const tileIndex = (name) => {
  const i = NAME_TO_INDEX[name];
  if (i === undefined) throw new Error(`unknown tile "${name}"`);
  return i;
};
