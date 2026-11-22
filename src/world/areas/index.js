/**
 * Area def registry. Built areas are listed in BUILT; any other registry area gets an auto-generated placeholder
 * (valid anchors/transitions/interactables so the whole game stays playable while wave-2 areas are authored).
 * Pure data: importable in Node.
 */
import { AREAS, areaAnchorNames, areaInteractables, lampIds } from '../../core/registry.js';
import brook_lane from './brook_lane.js';
import cottage from './cottage.js';
import town_square from './town_square.js';
import market_street from './market_street.js';
import bakery from './bakery.js';
import general_store from './general_store.js';
import cafe from './cafe.js';
import riverside_park from './riverside_park.js';
import harbor from './harbor.js';

export const BUILT = { brook_lane, cottage, town_square, market_street, bakery, general_store, cafe, riverside_park, harbor };

function placeholder(id) {
  const reg = AREAS[id];
  if (!reg) return null;
  const [w, h] = reg.size;
  const interior = reg.kind === 'interior';
  const def = { id, size: reg.size, kind: reg.kind, seed: 3, placeholder: true, props: [], anchors: {}, ground: { base: interior ? 'planks' : 'grass', ops: [] }, critters: [] };
  const names = reg.anchors;
  names.forEach((n, i) => { def.anchors[n] = [2 + (i % 8) * ((w - 4) / 8), 3 + Math.floor(i / 8) * 2.5, 's']; });
  if (interior) {
    def.room = { windows: [{ at: w * 0.25 }, { at: w * 0.75 }] };
    def.exit = { id: `to_${reg.neighbors[0]}`, at: w / 2 };
    def.ground.ops.push({ rug: { rect: [w / 2 - 3, h / 2 - 1.5, 6, 3], style: 'striped' } });
  } else {
    const sides = ['e', 'w', 'n', 's'];
    def.edges = reg.neighbors.map((n, i) => {
      const side = sides[i % 4];
      const span = side === 'e' || side === 'w' ? h : w;
      const slot = Math.floor(i / 4);
      const c = span / 2 + (slot ? (slot % 2 ? 1 : -1) * 6 : 0);
      return { id: `to_${n}`, side, at: [c - 2, c + 2] };
    });
    def.ground.ops.push({ kind: 'dirt', path: [[0, h / 2], [w, h / 2]], w: 2.6 }, { kind: 'dirt', path: [[w / 2, 0], [w / 2, h]], w: 2.6 });
    for (let i = 0; i < 10; i++) def.props.push({ t: 'tree', kind: ['oak', 'pine', 'birch'][i % 3], x: 3 + i * ((w - 6) / 9), z: 2 });
  }
  let k = 0;
  for (const [iid, type] of Object.entries(areaInteractables(id))) {
    const x = 3 + (k % 7) * ((w - 6) / 7), z = 6 + Math.floor(k / 7) * 2.2;
    k++;
    if (type === 'lamp') def.props.push({ t: 'lamp_post', x, z, id: iid });
    else def.props.push({ t: 'marker', id: iid, type, x, z, r: 1.0 });
  }
  def.camStart = reg.anchors[0];
  return def;
}

const cache = {};
/** pure data def (built or placeholder); null for unknown ids */
export function getDef(id) {
  if (BUILT[id]) return BUILT[id];
  if (!cache[id]) cache[id] = placeholder(id);
  return cache[id];
}
export const builtAreaIds = () => Object.keys(BUILT);
