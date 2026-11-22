// Validates the built world areas against the registry contract (anchors, transitions, interactables, collision,
// connectivity). Usage: node tools/validate-world.mjs [areaId ...]   (default: all built areas; placeholders are smoke-built)
import { AREAS, AREA_IDS, INTERACT_TYPES, LAMP_GROUPS, WATER_KINDS, areaAnchorNames, areaTransitionIds, areaInteractables, fishingWaterKind } from '../src/core/registry.js';
import { builtAreaIds, getDef } from '../src/world/areas/index.js';
import { buildHeadless } from '../src/world/headless.js';

const only = process.argv.slice(2);
const targets = only.length ? only : builtAreaIds();
let failed = 0;
const fail = (id, msg) => { console.log(`  FAIL [${id}] ${msg}`); failed++; };

function bfs(area, sx, sz) {
  const { w, h, walk } = area.grid;
  const seen = new Uint8Array(w * h);
  const si = Math.floor(sx), sj = Math.floor(sz);
  const q = [[si, sj]];
  seen[sj * w + si] = 1;
  while (q.length) {
    const [i, j] = q.pop();
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]]) {
      const a = i + di, b = j + dj;
      if (a < 0 || b < 0 || a >= w || b >= h || seen[b * w + a] || !walk[b * w + a]) continue;
      if (di && dj && (!walk[j * w + a] || !walk[b * w + i])) continue;
      seen[b * w + a] = 1;
      q.push([a, b]);
    }
  }
  return seen;
}

for (const id of targets) {
  const reg = AREAS[id];
  if (!reg) { fail(id, 'not in registry'); continue; }
  console.log(`area ${id}`);
  let built;
  try { built = buildHeadless(id); } catch (e) { fail(id, `build threw: ${e.stack}`); continue; }
  const a = built.runtime;
  const def = getDef(id);
  const inb = (x, z) => x >= 0 && z >= 0 && x <= a.width && z <= a.height;
  // anchors
  for (const n of areaAnchorNames(id)) {
    const an = a.anchors[n];
    if (!an) { fail(id, `missing anchor ${n}`); continue; }
    if (!inb(an.x, an.z)) fail(id, `anchor ${n} out of bounds`);
    else if (a.isBlockedAt(an.x, an.z, 0.28)) fail(id, `anchor ${n} (${an.x.toFixed(1)},${an.z.toFixed(1)}) is blocked`);
    if (!['n', 'e', 's', 'w'].includes(an.facing)) fail(id, `anchor ${n} bad facing`);
  }
  // transitions
  for (const t of areaTransitionIds(id)) {
    const tr = a.transitions.find((x) => x.id === t);
    if (!tr) { fail(id, `missing transition ${t}`); continue; }
    const nb = t.slice(3);
    if (tr.to.area !== nb) fail(id, `transition ${t} -> ${tr.to.area}, expected ${nb}`);
    if (tr.to.spawn !== `from_${id}`) fail(id, `transition ${t} spawn ${tr.to.spawn}`);
    if (!areaAnchorNames(nb).includes(tr.to.spawn)) fail(id, `transition ${t}: neighbour has no anchor ${tr.to.spawn}`);
    const r = tr.rect;
    if (r.x < -0.01 || r.z < -0.01 || r.x + r.w > a.width + 0.01 || r.z + r.h > a.height + 0.01) fail(id, `transition ${t} rect outside map`);
    const s = tr.stand;
    if (s.x < r.x - 0.01 || s.x > r.x + r.w + 0.01 || s.z < r.z - 0.01 || s.z > r.z + r.h + 0.01) fail(id, `transition ${t} stand not inside rect`);
    if (a.isBlockedAt(s.x, s.z, 0.28)) fail(id, `transition ${t} stand blocked`);
    if (reg.kind === 'exterior' && tr.kind === 'edge') {
      const onBorder = r.x <= 0.01 || r.z <= 0.01 || r.x + r.w >= a.width - 0.01 || r.z + r.h >= a.height - 0.01;
      if (!onBorder) fail(id, `edge transition ${t} not on the map border`);
    }
  }
  for (const t of a.transitions) if (!areaTransitionIds(id).includes(t.id)) fail(id, `extra transition ${t.id}`);
  // interactables
  const need = areaInteractables(id);
  const seenIds = new Set();
  for (const it of a.interactables) {
    if (seenIds.has(it.id)) fail(id, `duplicate interactable ${it.id}`);
    seenIds.add(it.id);
    if (!INTERACT_TYPES.includes(it.type)) fail(id, `${it.id}: bad type ${it.type}`);
    if (!it.label) fail(id, `${it.id}: no label`);
    if (!inb(it.x, it.z)) fail(id, `${it.id}: out of bounds`);
    if (it.type === 'lamp' && it.group !== LAMP_GROUPS[id]) fail(id, `${it.id}: lamp group ${it.group}`);
    if (it.type === 'fishing' && !WATER_KINDS.includes(it.water)) fail(id, `${it.id}: water kind ${it.water}`);
    if (['object', 'sign', 'bench', 'bookshelf', 'noticeboard', 'chest', 'mailbox'].includes(it.type) && !it.text) fail(id, `${it.id}: needs a one-line text`);
  }
  for (const [iid, type] of Object.entries(need)) {
    const it = a.interactables.find((x) => x.id === iid);
    if (!it) fail(id, `missing interactable ${iid}`);
    else if (it.type !== type) fail(id, `${iid}: type ${it.type}, expected ${type}`);
  }
  // lamp posts exist for lamp interactables
  for (const it of a.interactables.filter((x) => x.type === 'lamp')) if (!built.lampMap[it.id]) fail(id, `lamp ${it.id} has no lamp post prop`);
  // exteriors: critters + water fishing near water
  if (reg.kind === 'exterior') {
    if (!a.critters.length) fail(id, 'exterior needs critters hints');
    for (const it of a.interactables.filter((x) => x.type === 'fishing')) {
      let water = false;
      for (let dx = -2; dx <= 2 && !water; dx += 0.5) for (let dz = -2; dz <= 2; dz += 0.5) if (built.collision.isWaterAt(it.x + dx, it.z + dz)) { water = true; break; }
      if (!water) fail(id, `${it.id}: no water within 2 tiles`);
    }
  }
  // connectivity: every from_* anchor reaches every other, plus every anchor and transition stand
  const froms = Object.keys(a.anchors).filter((n) => n.startsWith('from_'));
  if (froms.length) {
    const start = a.anchors[froms[0]];
    const seen = bfs(a, start.x, start.z);
    const reach = (x, z) => seen[Math.floor(z) * a.width + Math.floor(x)] === 1;
    for (const n of Object.keys(a.anchors)) if (!reach(a.anchors[n].x, a.anchors[n].z)) fail(id, `anchor ${n} not reachable from ${froms[0]}`);
    for (const t of a.transitions) if (!reach(t.stand.x, t.stand.z)) fail(id, `transition ${t.id} stand not reachable`);
    for (const it of a.interactables) if (it.type !== 'lamp' && it.type !== 'fishing' && it.type !== 'forage') {
      // interactable must have a walkable tile within its reach radius
      let ok = false;
      for (let dx = -it.r; dx <= it.r && !ok; dx += 0.5) for (let dz = -it.r; dz <= it.r; dz += 0.5) if (reach(it.x + dx, it.z + dz) && Math.hypot(dx, dz) <= it.r) { ok = true; break; }
      if (!ok) fail(id, `interactable ${it.id} has no reachable standing spot`);
    }
  }
  let walkable = 0;
  for (const v of a.grid.walk) walkable += v;
  console.log(`  ok-ish: ${Object.keys(a.anchors).length} anchors, ${a.transitions.length} transitions, ${a.interactables.length} interactables, walkable ${walkable}/${a.width * a.height}, meshes ${built.group.children.length}`);
}

// every registry area must at least resolve to a buildable def (placeholders)
if (!only.length) {
  for (const id of AREA_IDS) {
    if (builtAreaIds().includes(id)) continue;
    try {
      const d = getDef(id);
      if (!d) throw new Error('no def');
      const b = buildHeadless(id);
      for (const n of areaAnchorNames(id)) if (!b.runtime.anchors[n]) throw new Error(`placeholder missing anchor ${n}`);
      for (const t of areaTransitionIds(id)) if (!b.runtime.transitions.find((x) => x.id === t)) throw new Error(`placeholder missing transition ${t}`);
      for (const iid of Object.keys(areaInteractables(id))) if (!b.runtime.interactables.find((x) => x.id === iid)) throw new Error(`placeholder missing interactable ${iid}`);
    } catch (e) {
      fail(id, `placeholder: ${e.message}`);
    }
  }
  console.log(`placeholders ok for ${AREA_IDS.length - builtAreaIds().length} unbuilt areas`);
}
console.log(failed ? `validate-world: ${failed} problem(s)` : 'validate-world: OK');
process.exit(failed ? 1 : 0);
