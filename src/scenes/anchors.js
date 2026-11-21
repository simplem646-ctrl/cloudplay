// Pure anchor / tile helpers for the overworld, the Stage and the NPC manager (no DOM, no engine imports).
// A "ref" is what scripts and schedules use: 'spot_a' (current map), 'town_square:fountain' (global) or {x, y, map?, dir?} (tile coords).

/** Walkable = in bounds and not blocked by the collision grid. */
export function walkableTile(map, x, y) {
  if (x < 0 || y < 0 || x >= map.width || y >= map.height) return false;
  return map.collision[y * map.width + x] === 0;
}

/** True when a warp rectangle covers the tile. */
export function warpTile(map, x, y) {
  return (map.warps || []).some((w) => x >= w.x && x < w.x + w.w && y >= w.y && y < w.y + w.h);
}

/**
 * Resolve an anchor reference to { map, x, y, dir, name, fallback }.
 * `getMapFn(id)` returns a MapDef (and throws for a missing map). A missing anchor falls back to `entrance`, then `center`
 * (fallback: true) so a typo in content never crashes the scene; a missing map rethrows.
 */
export function resolveAnchorRef(ref, currentMap, getMapFn) {
  if (ref && typeof ref === 'object' && typeof ref.x === 'number') {
    return { map: ref.map || currentMap, x: ref.x, y: ref.y, dir: ref.dir || 'down', name: null, fallback: false };
  }
  let mapId = currentMap;
  let name = String(ref === undefined || ref === null ? 'entrance' : ref);
  if (name.includes(':')) [mapId, name] = name.split(':');
  const def = getMapFn(mapId);
  let a = def.anchors[name];
  let fallback = false;
  if (!a) {
    fallback = true;
    name = def.anchors.entrance ? 'entrance' : 'center';
    a = def.anchors[name];
    if (!a) throw new Error(`anchors: map "${mapId}" has no anchor "${ref}" and no entrance`);
  }
  return { map: mapId, x: a.x, y: a.y, dir: a.dir || 'down', name, fallback };
}

/**
 * Nearest free tile to (tx, ty): the tile itself when free, else the closest ring cell that is walkable, not a warp tile
 * (unless allowWarp) and not in `occupied` (a Set of 'x,y' keys or a predicate). Returns {x, y} or null.
 */
export function findFreeTile(map, tx, ty, occupied, { radius = 5, allowWarp = false } = {}) {
  const taken = typeof occupied === 'function' ? occupied : (x, y) => !!occupied && occupied.has(`${x},${y}`);
  const ok = (x, y) => walkableTile(map, x, y) && (allowWarp || !warpTile(map, x, y)) && !taken(x, y);
  if (ok(tx, ty)) return { x: tx, y: ty };
  for (let r = 1; r <= radius; r++) {
    const ring = [];
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
        ring.push({ x: tx + dx, y: ty + dy, d: Math.abs(dx) + Math.abs(dy) });
      }
    }
    ring.sort((a, b) => a.d - b.d || a.y - b.y || a.x - b.x);
    for (const c of ring) if (ok(c.x, c.y)) return { x: c.x, y: c.y };
  }
  return null;
}

/** Nearest walkable warp tile to (tx, ty) or null: where NPCs enter and leave a map. */
export function nearestDoor(map, tx, ty) {
  let best = null;
  for (const w of map.warps || []) {
    for (let y = w.y; y < w.y + w.h; y++) {
      for (let x = w.x; x < w.x + w.w; x++) {
        if (!walkableTile(map, x, y)) continue;
        const d = Math.abs(x - tx) + Math.abs(y - ty);
        if (!best || d < best.d) best = { x, y, d };
      }
    }
  }
  return best ? { x: best.x, y: best.y } : null;
}

/** Direction opposite to `dir`. */
export const opposite = (dir) => ({ up: 'down', down: 'up', left: 'right', right: 'left' }[dir] || 'down');
