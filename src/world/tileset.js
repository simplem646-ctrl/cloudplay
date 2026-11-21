// Draws the pixel atlas for the four seasons from the pure-data catalog in tiles.js.
// The pixel work is DOM-free (renderAtlasPixels, usable in Node for tests/dumps); only getTileset()
// copies the RGBA buffer into a <canvas>, and only when called.
import { TILES, ATLAS_COLS, NAME_TO_INDEX } from './tiles.js';
import { SEASON_PAL } from './palette.js';
import { RNG, hashString } from '../core/rng.js';
import { Canvas } from './gfx.js';
import { SEASONS } from '../core/constants.js';
import * as terrain from './paint_terrain.js';
import * as nature from './paint_nature.js';
import * as buildings from './paint_buildings.js';
import * as street from './paint_street.js';
import * as indoor from './paint_indoor.js';

export const PAINTERS = {};
export const SHEETS = {};
for (const mod of [terrain, nature, buildings, street, indoor]) {
  Object.assign(PAINTERS, mod.PAINTERS || {});
  Object.assign(SHEETS, mod.SHEETS || {});
}

const makeCtx = (season, name) => ({
  season, S: SEASON_PAL[season], winter: season === 'winter',
  rng: new RNG(hashString(name)), name,
});

/** Render one catalog entry to a 16x16 Canvas. */
export function renderTile(def, season, sheetCache = new Map()) {
  const T = new Canvas(16, 16);
  const art = def.art;
  if (!art) return T;
  const [kind, ...args] = art;
  if (kind[0] === '@') {
    const sheetKind = kind.slice(1);
    const spec = SHEETS[sheetKind];
    if (!spec) throw new Error(`tile "${def.name}": unknown sheet painter "${sheetKind}"`);
    const col = args[args.length - 2], row = args[args.length - 1];
    const sargs = args.slice(0, -2);
    const key = sheetKind + '|' + season + '|' + JSON.stringify(sargs);
    let sheet = sheetCache.get(key);
    if (!sheet) {
      sheet = new Canvas(spec.w * 16, spec.h * 16);
      spec.draw(sheet, makeCtx(season, key), ...sargs);
      sheetCache.set(key, sheet);
    }
    return sheet.slice(col * 16, row * 16, 16, 16);
  }
  const fn = PAINTERS[kind];
  if (!fn) throw new Error(`tile "${def.name}": unknown painter "${kind}"`);
  fn(T, makeCtx(season, def.name), ...args);
  return T;
}

const pixelCache = new Map();
/** Pure pixel render of the whole atlas: { data (RGBA Uint8ClampedArray), width, height, cols, rows } */
export function renderAtlasPixels(season) {
  if (!SEASONS.includes(season)) throw new Error(`unknown season "${season}"`);
  if (pixelCache.has(season)) return pixelCache.get(season);
  const cols = ATLAS_COLS, rows = Math.ceil(TILES.length / cols);
  const A = new Canvas(cols * 16, rows * 16);
  const sheetCache = new Map();
  TILES.forEach((def, i) => {
    if (i === 0) return;
    const T = renderTile(def, season, sheetCache);
    A.blit(T, (i % cols) * 16, Math.floor(i / cols) * 16);
  });
  const out = { data: A.data, width: A.w, height: A.h, cols, rows };
  pixelCache.set(season, out);
  return out;
}

const tilesetCache = new Map();
/** getTileset(season) -> { canvas, cols, rows, tileSize:16, names, meta } (cached per season) */
export function getTileset(season) {
  if (tilesetCache.has(season)) return tilesetCache.get(season);
  const px = renderAtlasPixels(season);
  const canvas = document.createElement('canvas');
  canvas.width = px.width;
  canvas.height = px.height;
  const g = canvas.getContext('2d');
  g.putImageData(new ImageData(new Uint8ClampedArray(px.data), px.width, px.height), 0, 0);
  const ts = {
    canvas, cols: px.cols, rows: px.rows, tileSize: 16, season,
    names: NAME_TO_INDEX,
    meta: TILES.map(metaOf),
  };
  tilesetCache.set(season, ts);
  return ts;
}

function metaOf(d) {
  const m = { name: d.name };
  for (const k of ['solid', 'sound', 'water', 'anim', 'layer', 'door', 'bridge', 'hidden']) {
    if (d[k] !== undefined && d[k] !== false) m[k] = d[k];
  }
  return m;
}
