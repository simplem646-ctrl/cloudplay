// Public world API used by the overworld/engine. Maps come from the generated registry
// (run `npm run gen` first; `npm test` and `npm run build` do it for you).
import { MAP_MODULES } from '../_generated/registry.js';
import { MAP_IDS } from '../data/ids.js';
import { TILES, NAME_TO_INDEX, tileIndex } from './tiles.js';
import { getTileset } from './tileset.js';

export { MAP_IDS, getTileset, TILES, NAME_TO_INDEX, tileIndex };

const cache = new Map();

/** ids of the maps that exist (have a file in src/world/maps), in MAP_IDS order */
export function listMaps() {
  return MAP_IDS.filter((id) => MAP_MODULES[id]);
}

/** MapDef for an id (built once, cached). Throws a clear error for unknown / not-yet-written maps. */
export function getMap(id) {
  if (cache.has(id)) return cache.get(id);
  const mod = MAP_MODULES[id];
  if (!mod) throw new Error(`world: no map "${id}" (${MAP_IDS.includes(id) ? 'not written yet' : 'not in MAP_IDS'}). Existing: ${listMaps().join(', ')}`);
  const exp = mod.default;
  const def = typeof exp === 'function' ? exp() : exp;
  cache.set(id, def);
  return def;
}
export const getMapDef = getMap;
export const loadMap = getMap;

/** getAnchor('town_square:fountain') -> { map, name, x, y, dir } (tile coords) */
export function getAnchor(globalId) {
  const [map, name] = String(globalId).split(':');
  const a = getMap(map).anchors[name];
  if (!a) throw new Error(`world: anchor "${globalId}" does not exist`);
  return { map, name, ...a };
}

/** find an interactable by its full id ('bell_tower__bell') across loaded maps */
export function getInteractable(fullId) {
  const map = String(fullId).split('__')[0];
  return getMap(map).interactables.find((i) => i.id === fullId) || null;
}

/** warp rectangles containing tile (x,y) */
export function warpsAt(mapId, x, y) {
  return getMap(mapId).warps.filter((w) => x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h);
}

/** true if the tile blocks movement (out of bounds counts as blocked) */
export function isBlocked(def, x, y) {
  return x < 0 || y < 0 || x >= def.width || y >= def.height || def.collision[y * def.width + x] === 1;
}
