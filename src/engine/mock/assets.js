// Mock art for engine harnesses and for scene work before the real tileset/sprites land.
// NOT part of the engine barrel: import it explicitly (`../engine/mock/assets.js`).
// Everything follows the real contracts: tileset atlas object, CHAR_SHEET / ANIMAL_SHEET sheets,
// icon atlas with emote_<kind> names, MapDef. Browser only (uses canvas); call from functions.
import { TILE } from '../../core/constants.js';
import { CHAR_SHEET, ANIMAL_SHEET } from '../../data/sheet_layout.js';
import { mulberry32 } from '../../core/rng.js';

const mkCanvas = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};
const px = (ctx, x, y, col, w = 1, h = 1) => {
  ctx.fillStyle = col;
  ctx.fillRect(x, y, w, h);
};
function blob(ctx, cx, cy, rx, ry, col, ox = 0, oy = 0) {
  ctx.fillStyle = col;
  for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
    for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
      const dx = (x + 0.5 - cx - ox) / rx;
      const dy = (y + 0.5 - cy - oy) / ry;
      if (dx * dx + dy * dy <= 1) ctx.fillRect(x, y, 1, 1);
    }
  }
}

// ---- tileset ------------------------------------------------------------------------------------
export const MOCK_TILES = {
  grass_a: 1, grass_b: 2, grass_c: 3, path: 4, water: 5, water_2: 6, water_3: 7,
  flower_pink: 8, flower_pink_2: 9, flower_yellow: 10, flower_yellow_2: 11,
  wall: 12, wall_window: 13, door: 14, roof_a: 15, roof_b: 16, roof_eave: 17, trunk: 18, fence: 19, rock: 20, sand: 21,
  lantern: 22, lantern_2: 23,
  canopy_tl: 24, canopy_t: 25, canopy_tr: 26, canopy_bl: 32, canopy_b: 33, canopy_br: 34,
};
const T = MOCK_TILES;
const COLS = 8;
const ROWS = 5;

const PALETTES = {
  spring: { grass: ['#6cc24a', '#86d85f', '#4fa83a'], canopy: ['#f4b6c8', '#fbd6e1', '#d98aa6', '#8fcf6a'], water: ['#4a90c8', '#8fd0f0', '#3b7ab0'], path: ['#e0c48a', '#f0dcae', '#c9a96c'], roof: ['#4b5a78', '#6a7ba0', '#35405a'], snow: false },
  summer: { grass: ['#4fae3f', '#68c452', '#3a8c32'], canopy: ['#3f8f3a', '#5fb04a', '#2b6b2d', '#8fd06a'], water: ['#3f8ccc', '#8fd8f8', '#2f74b4'], path: ['#e6c78a', '#f4dfae', '#cfab6a'], roof: ['#4b5a78', '#6a7ba0', '#35405a'], snow: false },
  autumn: { grass: ['#98aa42', '#b0c050', '#7d9034'], canopy: ['#e07a2f', '#f0a43a', '#b5503c', '#d9b03a'], water: ['#4a86b8', '#9bcde8', '#3b6f9c'], path: ['#d8b27a', '#e8cc9c', '#bf9560'], roof: ['#6b4a52', '#8a6470', '#4b3039'], snow: false },
  winter: { grass: ['#e4eef8', '#f8fcff', '#c4d6ea'], canopy: ['#d8e6f2', '#ffffff', '#9fb6cf', '#e8f2fa'], water: ['#9fd2ee', '#e6f6ff', '#78b4d8'], path: ['#d8cdb8', '#ece4d2', '#b8ab92'], roof: ['#4b5a78', '#6a7ba0', '#35405a'], snow: true },
};

export function mockTilesetNames() {
  return { ...MOCK_TILES };
}

const tilesetCache = new Map();
/** Mock tileset atlas {canvas, cols, rows, tileSize, names, meta[]} for a season. Cached. */
export function mockTileset(season = 'spring') {
  if (tilesetCache.has(season)) return tilesetCache.get(season);
  const P = PALETTES[season] || PALETTES.spring;
  const canvas = mkCanvas(COLS * TILE, ROWS * TILE);
  const ctx = canvas.getContext('2d');
  const rnd = mulberry32(1234);
  const at = (idx) => [(idx % COLS) * TILE, Math.floor(idx / COLS) * TILE];

  // grass (3 variants)
  for (const [idx, seed] of [[T.grass_a, 1], [T.grass_b, 2], [T.grass_c, 3]]) {
    const [x0, y0] = at(idx);
    const r = mulberry32(seed * 77);
    px(ctx, x0, y0, P.grass[0], TILE, TILE);
    const dots = idx === T.grass_a ? 5 : 9;
    for (let i = 0; i < dots; i++) px(ctx, x0 + Math.floor(r() * 15), y0 + Math.floor(r() * 15), P.grass[1]);
    for (let i = 0; i < dots; i++) px(ctx, x0 + Math.floor(r() * 15), y0 + Math.floor(r() * 15), P.grass[2]);
    if (idx !== T.grass_a && !P.snow) { // little tuft
      const tx = x0 + 3 + Math.floor(r() * 9);
      const ty = y0 + 3 + Math.floor(r() * 9);
      px(ctx, tx, ty, P.grass[2]); px(ctx, tx - 1, ty - 1, P.grass[2]); px(ctx, tx + 1, ty - 1, P.grass[2]);
    }
  }
  // path
  {
    const [x0, y0] = at(T.path);
    px(ctx, x0, y0, P.path[0], TILE, TILE);
    for (let i = 0; i < 10; i++) px(ctx, x0 + Math.floor(rnd() * 15), y0 + Math.floor(rnd() * 15), P.path[2]);
    for (let i = 0; i < 8; i++) px(ctx, x0 + Math.floor(rnd() * 14), y0 + Math.floor(rnd() * 15), P.path[1], 2, 1);
  }
  // sand (pond edge)
  {
    const [x0, y0] = at(T.sand);
    px(ctx, x0, y0, '#efd9a0', TILE, TILE);
    for (let i = 0; i < 12; i++) px(ctx, x0 + Math.floor(rnd() * 15), y0 + Math.floor(rnd() * 15), '#d8bf80');
  }
  // water, 3 frames of moving highlights
  [T.water, T.water_2, T.water_3].forEach((idx, f) => {
    const [x0, y0] = at(idx);
    px(ctx, x0, y0, P.water[0], TILE, TILE);
    for (const [bx, by] of [[1, 3], [8, 9], [4, 13]]) {
      px(ctx, x0 + ((bx + f * 2) % 14), y0 + by, P.water[1], 3, 1);
      px(ctx, x0 + ((bx + f * 2 + 7) % 14), y0 + ((by + 6) % 15), P.water[2], 2, 1);
    }
  });
  // flowers (transparent background, 2-frame sway)
  const flower = (idx, col, center, sway) => {
    const [x0, y0] = at(idx);
    for (const [fx, fy] of [[3, 5], [10, 3], [7, 11]]) {
      const dx = sway ? 1 : 0;
      px(ctx, x0 + fx, y0 + fy + 3, '#3f8f3a', 1, 3);
      const cx = x0 + fx + dx;
      const cy = y0 + fy + 1;
      px(ctx, cx - 1, cy, col); px(ctx, cx + 1, cy, col); px(ctx, cx, cy - 1, col); px(ctx, cx, cy + 1, col);
      px(ctx, cx, cy, center);
    }
  };
  flower(T.flower_pink, '#f4b6c8', '#f2b84b', false);
  flower(T.flower_pink_2, '#f4b6c8', '#f2b84b', true);
  flower(T.flower_yellow, '#f7de5a', '#e8803c', false);
  flower(T.flower_yellow_2, '#f7de5a', '#e8803c', true);
  // walls
  const brick = (idx, win, door) => {
    const [x0, y0] = at(idx);
    px(ctx, x0, y0, '#b5503c', TILE, TILE);
    for (let r = 0; r < 4; r++) {
      px(ctx, x0, y0 + r * 4 + 3, '#8e3d2d', TILE, 1);
      const off = r % 2 ? 4 : 0;
      for (let c = off; c < TILE; c += 8) px(ctx, x0 + c, y0 + r * 4, '#8e3d2d', 1, 3);
    }
    px(ctx, x0, y0, '#cc6a50', TILE, 1);
    if (win) {
      px(ctx, x0 + 3, y0 + 3, '#3b2a1f', 10, 10);
      px(ctx, x0 + 4, y0 + 4, '#8fd0f0', 8, 8);
      px(ctx, x0 + 4, y0 + 4, '#d6f0fb', 3, 1); px(ctx, x0 + 4, y0 + 5, '#d6f0fb', 1, 2);
      px(ctx, x0 + 7, y0 + 4, '#3b2a1f', 2, 8); px(ctx, x0 + 4, y0 + 7, '#3b2a1f', 8, 1);
      px(ctx, x0 + 2, y0 + 13, '#7a4f2e', 12, 2);
    }
    if (door) {
      px(ctx, x0 + 2, y0 + 1, '#3b2a1f', 12, 15);
      px(ctx, x0 + 3, y0 + 2, '#7a4f2e', 10, 14);
      px(ctx, x0 + 3, y0 + 2, '#946239', 10, 1);
      px(ctx, x0 + 8, y0 + 2, '#5c3a20', 1, 14);
      px(ctx, x0 + 10, y0 + 9, '#f2b84b', 2, 2);
      px(ctx, x0 + 1, y0 + 15, '#8a8a92', 14, 1);
    }
  };
  brick(T.wall, false, false);
  brick(T.wall_window, true, false);
  brick(T.door, false, true);
  // roof (slate shingles; snow caps in winter)
  const roof = (idx, shift, eave) => {
    const [x0, y0] = at(idx);
    const rows = eave ? 12 : TILE;
    px(ctx, x0, y0, P.roof[0], TILE, rows);
    for (let r = 0; r < 4; r++) {
      const y = y0 + r * 4;
      if (y - y0 >= rows) break;
      px(ctx, x0, y + 3, P.roof[2], TILE, 1);
      for (let c = ((r + shift) % 2) * 4; c < TILE; c += 8) px(ctx, x0 + c, y, P.roof[2], 1, 3);
      px(ctx, x0, y, P.roof[1], TILE, 1);
    }
    if (P.snow) {
      px(ctx, x0, y0, '#ffffff', TILE, 3);
      for (let c = 0; c < TILE; c += 3) px(ctx, x0 + c, y0 + 3, '#e4eef8', 2, 1);
    }
    if (eave) {
      px(ctx, x0, y0 + 11, '#2a3350', TILE, 1);
      for (let c = 0; c < TILE; c++) px(ctx, x0 + c, y0 + 12, 'rgba(29,35,64,0.45)');
      px(ctx, x0, y0 + 13, 'rgba(29,35,64,0.22)', TILE, 1);
    }
  };
  roof(T.roof_a, 0, false);
  roof(T.roof_b, 1, false);
  roof(T.roof_eave, 0, true);
  // trunk (transparent bg)
  {
    const [x0, y0] = at(T.trunk);
    px(ctx, x0 + 5, y0, '#3b2a1f', 6, 14);
    px(ctx, x0 + 6, y0, '#7a4f2e', 4, 14);
    px(ctx, x0 + 6, y0, '#946239', 1, 14);
    px(ctx, x0 + 9, y0, '#5c3a20', 1, 14);
    px(ctx, x0 + 4, y0 + 12, '#3b2a1f', 8, 2);
    px(ctx, x0 + 5, y0 + 12, '#7a4f2e', 6, 1);
    px(ctx, x0 + 3, y0 + 14, 'rgba(29,35,64,0.25)', 10, 1);
  }
  // fence
  {
    const [x0, y0] = at(T.fence);
    px(ctx, x0, y0 + 5, '#3b2a1f', TILE, 3); px(ctx, x0, y0 + 6, '#c99a62', TILE, 1);
    px(ctx, x0, y0 + 10, '#3b2a1f', TILE, 3); px(ctx, x0, y0 + 11, '#c99a62', TILE, 1);
    for (const fx of [1, 11]) {
      px(ctx, x0 + fx, y0 + 2, '#3b2a1f', 4, 13);
      px(ctx, x0 + fx + 1, y0 + 3, '#b98550', 2, 11);
    }
  }
  // rock
  {
    const [x0, y0] = at(T.rock);
    blob(ctx, x0 + 8, y0 + 10, 6, 4.5, '#3f3a48');
    blob(ctx, x0 + 8, y0 + 10, 5, 3.5, '#8d8a98');
    blob(ctx, x0 + 8, y0 + 10, 3.5, 2, '#b4b1be', -1, -1);
  }
  // lantern post (2 flame frames)
  [T.lantern, T.lantern_2].forEach((idx, f) => {
    const [x0, y0] = at(idx);
    px(ctx, x0 + 7, y0 + 5, '#3b2a1f', 2, 11);
    px(ctx, x0 + 5, y0 + 15, '#3b2a1f', 6, 1);
    px(ctx, x0 + 5, y0 + 1, '#3b2a1f', 6, 6);
    px(ctx, x0 + 6, y0 + 2, f ? '#ffe38a' : '#f2b84b', 4, 4);
    px(ctx, x0 + 7, y0 + 3, f ? '#fff6c8' : '#ffe38a', 2, 2);
    px(ctx, x0 + 4, y0, '#3b2a1f', 8, 1);
  });
  // canopy 3x2 tiles from one blob
  {
    const [x0, y0] = at(T.canopy_tl);
    const W = 48;
    const H = 32;
    const cx = x0 + W / 2;
    const cy = y0 + 17;
    const shape = (col, grow, ox = 0, oy = 0) => {
      blob(ctx, cx, cy, 22 + grow, 13 + grow, col, ox, oy);
      blob(ctx, cx - 11, cy + 2, 11 + grow, 9 + grow, col, ox, oy);
      blob(ctx, cx + 11, cy + 2, 11 + grow, 9 + grow, col, ox, oy);
      blob(ctx, cx, cy - 6, 15 + grow, 9 + grow, col, ox, oy);
    };
    const dark = P.snow ? '#6a7ea0' : season === 'autumn' ? '#7a3a22' : season === 'spring' ? '#a35c78' : '#1f4d25';
    shape(dark, 1.2);
    shape(P.canopy[2], 0);
    shape(P.canopy[0], 0, -0.5, -2.2);
    const r = mulberry32(999);
    for (let i = 0; i < 70; i++) {
      const x = x0 + 4 + Math.floor(r() * 40);
      const y = y0 + 3 + Math.floor(r() * 24);
      const d = Math.hypot((x - cx) / 22, (y - cy) / 13);
      if (d < 0.8) px(ctx, x, y, P.canopy[r() < 0.5 ? 1 : 3], 2, 1);
    }
    for (let i = 0; i < 40; i++) {
      const x = x0 + 6 + Math.floor(r() * 36);
      const y = y0 + 6 + Math.floor(r() * 22);
      if (Math.hypot((x - cx) / 22, (y - cy) / 13) < 0.82) px(ctx, x, y, P.canopy[2]);
    }
    if (P.snow) for (let i = 0; i < 30; i++) px(ctx, x0 + 8 + Math.floor(r() * 32), y0 + 3 + Math.floor(r() * 9), '#ffffff', 2, 1);
  }

  const names = { ...MOCK_TILES };
  const meta = [];
  meta[0] = { name: 'empty' };
  for (const [n, i] of Object.entries(MOCK_TILES)) meta[i] = { name: n };
  for (let i = 0; i < COLS * ROWS; i++) if (!meta[i]) meta[i] = { name: `unused_${i}` };
  for (const n of ['wall', 'wall_window', 'trunk', 'fence', 'rock', 'lantern']) meta[T[n]].solid = true;
  meta[T.water] = { name: 'water', solid: true, water: true, sound: 'water', anim: { frames: [T.water, T.water_2, T.water_3, T.water_2], fps: 3 } };
  meta[T.flower_pink].anim = { frames: [T.flower_pink, T.flower_pink_2], fps: 2 };
  meta[T.flower_yellow].anim = { frames: [T.flower_yellow, T.flower_yellow_2], fps: 2 };
  meta[T.lantern].anim = { frames: [T.lantern, T.lantern_2], fps: 5 };
  const ts = { canvas, cols: COLS, rows: ROWS, tileSize: TILE, names, meta };
  tilesetCache.set(season, ts);
  return ts;
}

// ---- mock map ------------------------------------------------------------------------------------
/** ~40x30 outdoor map: house (roof in `above`), pond, paths, flowers, lanterns, fenced yard and trees whose canopy is `above`. */
export function mockMap() {
  const w = 40;
  const h = 30;
  const n = w * h;
  const ground = new Uint16Array(n);
  const deco = new Uint16Array(n);
  const above = new Uint16Array(n);
  const collision = new Uint8Array(n);
  const rnd = mulberry32(42);
  const set = (arr, x, y, v) => { if (x >= 0 && y >= 0 && x < w && y < h) arr[y * w + x] = v; };
  const block = (x, y, v = 1) => { if (x >= 0 && y >= 0 && x < w && y < h) collision[y * w + x] = v; };

  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const r = rnd();
    set(ground, x, y, r < 0.62 ? T.grass_a : r < 0.84 ? T.grass_b : T.grass_c);
  }
  // paths
  for (let x = 0; x < w; x++) for (const y of [19, 20]) set(ground, x, y, T.path);
  for (let y = 9; y < h; y++) for (const x of [17, 18]) set(ground, x, y, T.path);
  // pond with sand rim
  const pond = { cx: 29, cy: 13, rx: 4.6, ry: 3.2 };
  for (let y = 8; y < 19; y++) for (let x = 22; x < 37; x++) {
    const d = Math.hypot((x + 0.5 - pond.cx) / pond.rx, (y + 0.5 - pond.cy) / pond.ry);
    if (d <= 1) { set(ground, x, y, T.water); block(x, y); } else if (d <= 1.35) set(ground, x, y, T.sand);
  }
  // house: roof rows by..by+2 (above), walls by+3..by+4 (deco). Collision covers the footprint
  // (by+1..by+4) but NOT the top roof row, so you can walk behind the ridge.
  const bx = 14;
  const by = 3;
  const bw = 8;
  for (let x = bx; x < bx + bw; x++) {
    set(above, x, by, (x - bx) % 2 ? T.roof_b : T.roof_a);
    set(above, x, by + 1, (x - bx) % 2 ? T.roof_a : T.roof_b);
    set(above, x, by + 2, T.roof_eave);
    set(deco, x, by + 3, [bx + 1, bx + 5].includes(x) ? T.wall_window : T.wall);
    set(deco, x, by + 4, x === bx + 3 ? T.door : T.wall);
    for (let y = by + 1; y <= by + 4; y++) if (!(x === bx + 3 && y === by + 4)) block(x, y);
  }
  for (let y = by + 5; y < 9; y++) set(ground, bx + 3, y, T.path);
  for (let x = bx + 3; x <= 18; x++) set(ground, x, 9, T.path);
  // lanterns flanking the door
  for (const lx of [bx + 1, bx + 6]) { set(deco, lx, by + 5, T.lantern); block(lx, by + 5); }
  // fenced yard to the left
  for (let x = 3; x < 11; x++) { set(deco, x, 3, T.fence); block(x, 3); set(deco, x, 9, T.fence); block(x, 9); }
  for (let y = 4; y < 9; y++) { set(deco, 3, y, T.fence); block(3, y); }
  for (let y = 4; y < 9; y++) if (y !== 6) { set(deco, 10, y, T.fence); block(10, y); } // gap at y=6 = gate
  // flowers
  const flowerAt = (x0, y0, wd, ht, kind) => {
    for (let y = y0; y < y0 + ht; y++) for (let x = x0; x < x0 + wd; x++) if (rnd() < 0.7 && !deco[y * w + x] && ground[y * w + x] <= T.grass_c) set(deco, x, y, kind);
  };
  flowerAt(5, 5, 4, 3, T.flower_pink);
  flowerAt(12, 12, 4, 3, T.flower_yellow);
  flowerAt(8, 23, 5, 4, T.flower_pink);
  flowerAt(24, 22, 5, 3, T.flower_yellow);
  flowerAt(21, 11, 2, 2, T.flower_pink);
  // trees: trunk (deco, solid) + 3x2 canopy (above) so you walk behind the canopy
  const trees = [[6, 14], [27, 4], [33, 7], [9, 27], [34, 25], [3, 21], [24, 26], [12, 18]];
  for (const [tx, ty] of trees) {
    set(deco, tx, ty, T.trunk);
    block(tx, ty);
    const rowsT = [[T.canopy_tl, T.canopy_t, T.canopy_tr], [T.canopy_bl, T.canopy_b, T.canopy_br]];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) set(above, tx - 1 + c, ty - 2 + r, rowsT[r][c]);
  }
  for (const [x, y] of [[20, 24], [21, 24], [28, 20]]) { set(deco, x, y, T.rock); block(x, y); }

  const anchors = {
    entrance: { x: 17, y: 12, dir: 'down' }, center: { x: 17, y: 16, dir: 'down' },
    npc_1: { x: 24, y: 17, dir: 'left' }, npc_2: { x: 9, y: 19, dir: 'right' }, spot_a: { x: 5, y: 12, dir: 'right' }, cat_spot: { x: 12, y: 21, dir: 'down' },
  };
  return {
    id: 'mock_town', name: 'Mock Town', width: w, height: h, indoor: false,
    layers: { ground, deco, above }, collision,
    warps: [{ x: bx + 3, y: by + 4, w: 1, h: 1, to: 'mock_house:entrance' }],
    anchors,
    interactables: [{ id: 'gate', x: 10, y: 6, w: 1, h: 1, label: 'Gate', action: { type: 'text', lines: ['Hi'] } }],
    ambient: { music: null, lighting: 'outdoor', weather: true, ambience: null },
    house: { bx, by, bw },
    lights: [
      { x: (bx + 1) * 16 + 8, y: (by + 5) * 16 + 4, radius: 58, color: '#ffb858', intensity: 1, flicker: 0.12 },
      { x: (bx + 6) * 16 + 8, y: (by + 5) * 16 + 4, radius: 58, color: '#ffb858', intensity: 1, flicker: 0.12 },
      { x: (bx + 1) * 16 + 8, y: (by + 3) * 16 + 8, radius: 26, color: '#ffe9a8', intensity: 0.9 },
      { x: (bx + 5) * 16 + 8, y: (by + 3) * 16 + 8, radius: 26, color: '#ffe9a8', intensity: 0.9 },
    ],
  };
}

// ---- characters ----------------------------------------------------------------------------------
const OUT = '#2a1f33';
const shade = (hex, k) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => f(v).toString(16).padStart(2, '0')).join('')}`;
};

/** One 16x24 frame. o: {dir, hair, skin, shirt, pants, step: 0|1|2 (stand/stepA/stepB), pose?, long?} */
function drawCharFrame(ctx, ox, oy, o) {
  const { dir, hair, skin, shirt, pants } = o;
  const step = o.step || 0;
  const bob = step ? 0 : 0;
  const P = (x, y, c, w = 1, h = 1) => px(ctx, ox + x, oy + y, c, w, h);
  const hairD = shade(hair, 0.75);
  const shirtD = shade(shirt, 0.78);
  const pantsD = shade(pants, 0.8);
  const skinD = shade(skin, 0.88);
  const pose = o.pose;
  if (pose === 'sleep') {
    // lying down: head left, blanket right
    P(1, 12, OUT, 14, 10);
    P(2, 13, '#dfe6f4', 12, 8);
    P(2, 13, '#f3f6fc', 12, 2);
    P(6, 14, shirt, 8, 7); P(6, 14, shade(shirt, 1.12), 8, 1);
    P(1, 12, OUT, 8, 1);
    P(2, 13, OUT, 7, 8); P(3, 14, skin, 5, 6);
    P(3, 14, hair, 5, 2); P(3, 14, hairD, 1, 2);
    P(5, 17, OUT, 2, 1);
    P(2, 21, OUT, 12, 1);
    return;
  }
  const seated = pose === 'sit';
  const top = seated ? 6 : 1;
  const hy = top + 1;
  // legs
  if (!seated) {
    const lf = step === 1 ? 1 : 0;
    const rf = step === 2 ? 1 : 0;
    const lUp = step === 2 ? 1 : 0;
    const rUp = step === 1 ? 1 : 0;
    const side = dir === 'left' || dir === 'right';
    if (side) {
      const a = step === 1 ? 2 : step === 2 ? -2 : 0;
      P(6 + a, 19 - 0, OUT, 4, 5); P(7 + a, 19, pants, 2, 3); P(7 + a, 22, '#3b2a1f', 3, 1);
      P(6 - a, 19, OUT, 4, 5 - (a ? 1 : 0)); P(7 - a, 19, pantsD, 2, 3 - (a ? 1 : 0)); P(7 - a, 22 - (a ? 1 : 0), '#3b2a1f', 3, 1);
    } else {
      P(4, 18 - lUp, OUT, 4, 6 + lUp - lf); P(5, 18 - lUp, pants, 2, 4 - lf + lUp); P(4, 22 - lf, '#3b2a1f', 4, 1);
      P(8, 18 - rUp, OUT, 4, 6 + rUp - rf); P(9, 18 - rUp, pantsD, 2, 4 - rf + rUp); P(8, 22 - rf, '#3b2a1f', 4, 1);
    }
  } else {
    P(4, 15, OUT, 8, 8); P(5, 15, pants, 6, 5); P(5, 19, '#3b2a1f', 6, 2);
  }
  // body
  const by = seated ? top + 9 : 11;
  const bh = seated ? 6 : 7;
  P(3, by - 1 + bob, OUT, 10, bh + 1);
  P(4, by + bob, shirt, 8, bh - 1);
  P(4, by + bob, shade(shirt, 1.12), 8, 1);
  P(4, by + bh - 2 + bob, shirtD, 8, 1);
  // arms
  const armUp = pose === 'cheer' || pose === 'happy';
  const swing = step === 1 ? 1 : step === 2 ? -1 : 0;
  if (dir === 'left' || dir === 'right') {
    const fx = dir === 'right' ? 7 : 7;
    P(fx - 1 + swing, by + 1 + bob, OUT, 3, 5);
    P(fx + swing, by + 2 + bob, shirtD, 1, 3); P(fx + swing, by + 5 + bob, skin);
  } else if (armUp) {
    P(2, by - 3, OUT, 3, 5); P(3, by - 2, skin, 1, 2); P(3, by, shirt, 1, 2);
    P(11, by - 3, OUT, 3, 5); P(12, by - 2, skin, 1, 2); P(12, by, shirt, 1, 2);
  } else if (pose === 'surprised') {
    P(1, by, OUT, 3, 5); P(2, by + 1, skin, 1, 1); P(2, by + 2, shirtD, 1, 2);
    P(12, by, OUT, 3, 5); P(13, by + 1, skin, 1, 1); P(13, by + 2, shirtD, 1, 2);
  } else {
    P(2, by + 1 + (step === 1 ? 1 : 0), OUT, 3, 5); P(3, by + 2 + (step === 1 ? 1 : 0), shirtD, 1, 3); P(3, by + 5 + (step === 1 ? 1 : 0), skin);
    P(11, by + 1 + (step === 2 ? 1 : 0), OUT, 3, 5); P(12, by + 2 + (step === 2 ? 1 : 0), shirtD, 1, 3); P(12, by + 5 + (step === 2 ? 1 : 0), skin);
  }
  // head (big chibi head, 10x10 with outline)
  const hx = 3;
  const ht = hy + (pose === 'sad' ? 1 : 0);
  P(hx, ht, OUT, 10, 10);
  P(hx + 1, ht + 1, skin, 8, 8);
  P(hx + 1, ht + 8, skinD, 8, 1);
  const eye = '#1d2340';
  const mouth = '#b04a4a';
  if (dir === 'up' && !pose) {
    P(hx + 1, ht + 1, hair, 8, 8);
    P(hx + 1, ht + 7, hairD, 8, 2);
    P(hx + 2, ht + 2, shade(hair, 1.2), 3, 1);
    return;
  }
  if (dir === 'down' || pose) {
    P(hx + 1, ht + 1, hair, 8, 3);
    P(hx + 1, ht + 4, hair, 1, 2); P(hx + 8, ht + 4, hair, 1, 2);
    P(hx + 2, ht + 4, hair, 2, 1); P(hx + 5, ht + 4, hair, 3, 1);
    P(hx + 2, ht + 1, shade(hair, 1.2), 3, 1);
    if (o.long) { P(hx + 1, ht + 6, hair, 1, 4); P(hx + 8, ht + 6, hair, 1, 4); P(hx, ht + 8, OUT, 1, 3); P(hx + 9, ht + 8, OUT, 1, 3); }
  } else {
    P(hx + 1, ht + 1, hair, 8, 3);
    const back = dir === 'left' ? hx + 4 : hx + 1;
    P(back, ht + 4, hair, 5, 4);
    P(back, ht + 7, hairD, 5, 1);
    P(hx + 2, ht + 1, shade(hair, 1.2), 3, 1);
    if (o.long) P(back, ht + 8, hair, 5, 2);
  }
  if (pose === 'happy' || pose === 'cheer') {
    P(hx + 2, ht + 6, eye); P(hx + 3, ht + 5, eye); P(hx + 4, ht + 6, eye);
    P(hx + 5, ht + 6, eye); P(hx + 6, ht + 5, eye); P(hx + 7, ht + 6, eye);
    P(hx + 4, ht + 7, mouth, 2, 1);
  } else if (pose === 'sad') {
    P(hx + 2, ht + 6, eye, 2, 1); P(hx + 6, ht + 6, eye, 2, 1);
    P(hx + 2, ht + 7, '#8fd0f0'); P(hx + 4, ht + 7, eye, 2, 1);
  } else if (pose === 'surprised') {
    P(hx + 2, ht + 5, '#fff', 2, 3); P(hx + 3, ht + 6, eye); P(hx + 6, ht + 5, '#fff', 2, 3); P(hx + 7, ht + 6, eye);
    P(hx + 4, ht + 7, mouth, 2, 2);
  } else if (dir === 'down') {
    P(hx + 2, ht + 5, eye, 2, 2); P(hx + 6, ht + 5, eye, 2, 2);
    P(hx + 2, ht + 5, '#fff'); P(hx + 6, ht + 5, '#fff');
    P(hx + 4, ht + 7, mouth, 2, 1);
    P(hx + 1, ht + 7, '#f19a9a'); P(hx + 8, ht + 7, '#f19a9a');
  } else {
    const fx = dir === 'right' ? hx + 6 : hx + 2;
    P(fx, ht + 5, eye, 2, 2);
    P(fx + (dir === 'right' ? 1 : 0), ht + 5, '#fff');
    P(dir === 'right' ? hx + 8 : hx + 1, ht + 7, mouth, 1, 1);
    P(dir === 'right' ? hx + 7 : hx + 2, ht + 7, '#f19a9a');
  }
}

/** Mock character sheet (CHAR_SHEET layout). o: {hair, skin, shirt, pants, long} */
export function mockCharSheet(o = {}) {
  const S = CHAR_SHEET;
  const canvas = mkCanvas(S.cols * S.frameW, S.rows * S.frameH);
  const ctx = canvas.getContext('2d');
  const c = { hair: '#5a3a22', skin: '#f5cfa6', shirt: '#4a90c8', pants: '#3b3f66', ...o };
  for (const dir of ['down', 'left', 'right', 'up']) {
    for (let col = 0; col < 3; col++) drawCharFrame(ctx, col * S.frameW, S.dirRow[dir] * S.frameH, { ...c, dir, step: col });
  }
  for (const [pose, col] of Object.entries(S.poseCol)) drawCharFrame(ctx, col * S.frameW, S.poseRow * S.frameH, { ...c, dir: 'down', pose });
  for (const [dir, col] of Object.entries(S.sitCol)) drawCharFrame(ctx, col * S.frameW, S.sitRow * S.frameH, { ...c, dir, pose: 'sit' });
  return { canvas, ...S };
}

/** Mock cat sheet (ANIMAL_SHEET layout). */
export function mockCatSheet(fur = '#e8903a') {
  const S = ANIMAL_SHEET;
  const canvas = mkCanvas(S.cols * S.frameW, S.rows * S.frameH);
  const ctx = canvas.getContext('2d');
  const d = shade(fur, 0.72);
  const l = shade(fur, 1.2);
  const cat = (ox, oy, kind, step = 0) => {
    const P = (x, y, c, w = 1, h = 1) => px(ctx, ox + x, oy + y, c, w, h);
    const leg = (x, up) => { P(x, 12 - up, OUT, 2, 4 + up - 0); P(x, 12 - up, fur, 1, 3 + up); };
    if (kind === 'left' || kind === 'right') {
      const fl = kind === 'left';
      const hx = fl ? 2 : 9; const bxx = fl ? 5 : 3;
      P(bxx, 7, OUT, 9, 7); P(bxx + 1, 8, fur, 7, 5); P(bxx + 1, 8, l, 7, 1); P(bxx + 1, 12, d, 7, 1);
      P(hx, 4, OUT, 6, 7); P(hx + 1, 5, fur, 4, 5);
      P(fl ? hx + 1 : hx + 4, 3, OUT, 2, 2); P(fl ? hx + 4 : hx + 1, 3, OUT, 2, 2);
      P(fl ? hx + 1 : hx + 3, 6, '#1d2340'); P(fl ? hx + 1 : hx + 3, 8, '#f19a9a');
      const tx = fl ? 13 : 1;
      P(tx, 5 - (step ? 1 : 0), OUT, 2, 6); P(tx, 6 - (step ? 1 : 0), fur, 1, 5);
      const a = step === 1 ? 1 : step === 2 ? -1 : 0;
      P(bxx + 1 + a, 13, OUT, 2, 3); P(bxx + 1 + a, 13, fur, 1, 2);
      P(bxx + 6 - a, 13, OUT, 2, 3); P(bxx + 6 - a, 13, fur, 1, 2);
    } else {
      const up = kind === 'up';
      P(4, 6, OUT, 8, 9); P(5, 7, fur, 6, 7); P(5, 7, l, 6, 1);
      P(4, 2, OUT, 8, 7); P(5, 3, fur, 6, 5);
      P(4, 1, OUT, 2, 2); P(10, 1, OUT, 2, 2);
      if (!up) { P(6, 5, '#1d2340'); P(9, 5, '#1d2340'); P(7, 7, '#f19a9a', 2, 1); } else { P(6, 12, OUT, 4, 4); P(7, 12 - (step ? 1 : 0), fur, 2, 3); }
      const a = step === 1 ? 1 : step === 2 ? -1 : 0;
      P(5, 13 + (a > 0 ? 1 : 0), OUT, 2, 3); P(5, 13, fur, 1, 2);
      P(9, 13 + (a < 0 ? 1 : 0), OUT, 2, 3); P(9, 13, fur, 1, 2);
    }
    void leg;
  };
  ['down', 'left', 'right', 'up'].forEach((dir) => {
    for (let c = 0; c < 3; c++) cat(c * 16, S.dirRow[dir] * 16, dir, c);
  });
  const r = S.poseRow * 16;
  cat(S.poseCol.sit_front * 16, r, 'down', 0);
  cat(S.poseCol.sit_left * 16, r, 'left', 0);
  cat(S.poseCol.sit_right * 16, r, 'right', 0);
  { // sleep: curled
    const ox = S.poseCol.sleep * 16;
    blob(ctx, ox + 8, r + 11, 7, 4.5, OUT); blob(ctx, ox + 8, r + 11, 6, 3.5, fur); blob(ctx, ox + 8, r + 10, 4, 1.5, l);
    px(ctx, ox + 3, r + 9, OUT, 4, 3); px(ctx, ox + 4, r + 10, fur, 2, 1);
  }
  { // stretch
    const ox = S.poseCol.stretch * 16;
    px(ctx, ox + 2, r + 8, OUT, 12, 6); px(ctx, ox + 3, r + 9, fur, 10, 4);
    px(ctx, ox + 1, r + 11, OUT, 4, 4); px(ctx, ox + 12, r + 5, OUT, 3, 5); px(ctx, ox + 13, r + 6, fur, 1, 4);
  }
  { // loaf
    const ox = S.poseCol.loaf * 16;
    blob(ctx, ox + 8, r + 11, 7, 4, OUT); blob(ctx, ox + 8, r + 11, 6, 3, fur);
    px(ctx, ox + 3, r + 7, OUT, 5, 5); px(ctx, ox + 4, r + 8, fur, 3, 3); px(ctx, ox + 4, r + 9, '#1d2340');
  }
  return { canvas, ...ANIMAL_SHEET };
}

// ---- icons / emotes ------------------------------------------------------------------------------
export const MOCK_EMOTES = ['heart', 'sweat', 'note', 'anger', 'exclaim', 'question', 'dots', 'sparkle', 'zzz'];

/** Mock icon atlas {canvas, size, cols, names} containing emote_<kind> speech bubbles. */
export function mockIconAtlas() {
  const size = 16;
  const cols = 16;
  const canvas = mkCanvas(cols * size, size * 2);
  const ctx = canvas.getContext('2d');
  const names = {};
  MOCK_EMOTES.forEach((kind, i) => {
    names[`emote_${kind}`] = i;
    const ox = i * size;
    const P = (x, y, c, w = 1, h = 1) => px(ctx, ox + x, 0 + y, c, w, h);
    // bubble: 14x11 white rounded rect + tail
    P(1, 1, OUT, 14, 11); P(2, 0, OUT, 12, 13); P(0, 2, OUT, 16, 9);
    P(2, 2, '#ffffff', 12, 9); P(1, 3, '#ffffff', 14, 7); P(3, 1, '#ffffff', 10, 11);
    P(6, 12, OUT, 4, 2); P(7, 13, OUT, 2, 2); P(7, 12, '#ffffff', 2, 1);
    P(3, 2, '#dfe6f4', 10, 1);
    const draw = {
      heart: () => { const c = '#e0556a'; P(5, 4, c, 2, 2); P(9, 4, c, 2, 2); P(4, 5, c, 8, 2); P(5, 7, c, 6, 1); P(6, 8, c, 4, 1); P(7, 9, c, 2, 1); P(5, 4, '#f59aaa'); },
      sweat: () => { const c = '#4a90c8'; P(8, 3, c, 1, 2); P(7, 5, c, 3, 1); P(6, 6, c, 5, 3); P(7, 9, c, 3, 1); P(7, 6, '#bfe6fa', 1, 2); },
      note: () => { const c = '#3b2a1f'; P(9, 3, c, 1, 6); P(9, 3, c, 3, 1); P(6, 8, c, 4, 2); P(7, 7, c, 2, 1); },
      anger: () => { const c = '#d03a3a'; P(4, 4, c, 2, 1); P(4, 4, c, 1, 2); P(10, 4, c, 2, 1); P(11, 4, c, 1, 2); P(4, 8, c, 1, 1); P(5, 9, c, 2, 1); P(11, 8, c, 1, 1); P(9, 9, c, 2, 1); P(7, 6, c, 2, 2); },
      exclaim: () => { const c = '#d03a3a'; P(7, 3, c, 2, 5); P(7, 9, c, 2, 2); },
      question: () => { const c = '#4a5fa8'; P(6, 3, c, 4, 1); P(5, 4, c, 2, 2); P(9, 4, c, 2, 2); P(8, 6, c, 2, 1); P(7, 7, c, 2, 1); P(7, 9, c, 2, 1); },
      dots: () => { const c = '#3b2a1f'; P(4, 7, c, 2, 2); P(7, 7, c, 2, 2); P(10, 7, c, 2, 2); },
      sparkle: () => { const c = '#f2b84b'; P(7, 3, c, 2, 7); P(4, 6, c, 8, 2); P(6, 5, '#ffe38a', 4, 4); },
      zzz: () => { const c = '#4a5fa8'; P(4, 3, c, 4, 1); P(6, 4, c, 1, 1); P(5, 5, c, 1, 1); P(4, 6, c, 4, 1); P(8, 7, c, 3, 1); P(9, 8, c, 1, 1); P(8, 9, c, 3, 1); },
    };
    draw[kind]();
  });
  return { canvas, size, cols, names };
}
