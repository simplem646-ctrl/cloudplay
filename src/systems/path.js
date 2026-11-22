/**
 * A* pathfinding on an AreaRuntime grid (`area.grid = {w, h, walk:Uint8Array}`, index j*w+i, 1 = walkable).
 * 8-direction moves without corner cutting; result = smoothed tile-centre waypoints (line-of-sight shortcuts).
 * Pure logic (Node-testable with real headless areas). Results are cached per (area, start tile, goal tile).
 */

const SQRT2 = Math.SQRT2;
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, SQRT2], [1, -1, SQRT2], [-1, 1, SQRT2], [-1, -1, SQRT2]];
const cache = new Map();
const CACHE_MAX = 400;

const tileOf = (v) => Math.floor(v);
const walkAt = (g, i, j) => i >= 0 && j >= 0 && i < g.w && j < g.h && g.walk[j * g.w + i] === 1;

/** Nearest walkable tile to (x,z) by expanding rings; null if none within maxR tiles. */
export function nearestWalkable(area, x, z, maxR = 8) {
  const g = area.grid;
  const ci = Math.min(g.w - 1, Math.max(0, tileOf(x)));
  const cj = Math.min(g.h - 1, Math.max(0, tileOf(z)));
  if (walkAt(g, ci, cj)) return { i: ci, j: cj };
  let best = null;
  let bd = Infinity;
  for (let r = 1; r <= maxR; r++) {
    for (let dj = -r; dj <= r; dj++) {
      for (let di = -r; di <= r; di++) {
        if (Math.max(Math.abs(di), Math.abs(dj)) !== r) continue;
        const i = ci + di;
        const j = cj + dj;
        if (!walkAt(g, i, j)) continue;
        const d = (i + 0.5 - x) ** 2 + (j + 0.5 - z) ** 2;
        if (d < bd) {
          bd = d;
          best = { i, j };
        }
      }
    }
    if (best) return best;
  }
  return null;
}

/** Is the straight segment a->b free (tile grid + circle collision at a small radius)? */
export function lineClear(area, ax, az, bx, bz, r = 0.22) {
  const g = area.grid;
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.ceil(len / 0.2));
  for (let k = 1; k <= n; k++) {
    const t = k / n;
    const x = ax + (bx - ax) * t;
    const z = az + (bz - az) * t;
    if (!walkAt(g, tileOf(x), tileOf(z))) return false;
    if (area.isBlockedAt && area.isBlockedAt(x, z, r)) return false;
  }
  return true;
}

function astar(g, si, sj, gi, gj) {
  const n = g.w * g.h;
  const gScore = new Float32Array(n).fill(Infinity);
  const from = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  // binary heap of [f, idx] packed in two parallel arrays
  const hf = [];
  const hi = [];
  const push = (f, idx) => {
    let k = hf.length;
    hf.push(f);
    hi.push(idx);
    while (k > 0) {
      const p = (k - 1) >> 1;
      if (hf[p] <= hf[k]) break;
      [hf[p], hf[k]] = [hf[k], hf[p]];
      [hi[p], hi[k]] = [hi[k], hi[p]];
      k = p;
    }
  };
  const pop = () => {
    const idx = hi[0];
    const lf = hf.pop();
    const li = hi.pop();
    if (hf.length) {
      hf[0] = lf;
      hi[0] = li;
      let k = 0;
      for (;;) {
        const l = 2 * k + 1;
        const r = l + 1;
        let m = k;
        if (l < hf.length && hf[l] < hf[m]) m = l;
        if (r < hf.length && hf[r] < hf[m]) m = r;
        if (m === k) break;
        [hf[m], hf[k]] = [hf[k], hf[m]];
        [hi[m], hi[k]] = [hi[k], hi[m]];
        k = m;
      }
    }
    return idx;
  };
  const h = (i, j) => {
    const dx = Math.abs(i - gi);
    const dz = Math.abs(j - gj);
    return dx + dz + (SQRT2 - 2) * Math.min(dx, dz);
  };
  const s = sj * g.w + si;
  gScore[s] = 0;
  push(h(si, sj), s);
  while (hf.length) {
    const cur = pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    const ci = cur % g.w;
    const cj = (cur - ci) / g.w;
    if (ci === gi && cj === gj) {
      const out = [];
      for (let k = cur; k !== -1; k = from[k]) out.push({ i: k % g.w, j: Math.floor(k / g.w) });
      return out.reverse();
    }
    for (const [di, dj, cost] of DIRS) {
      const ni = ci + di;
      const nj = cj + dj;
      if (!walkAt(g, ni, nj)) continue;
      if (di !== 0 && dj !== 0 && (!walkAt(g, ci + di, cj) || !walkAt(g, ci, cj + dj))) continue; // no corner cutting
      const ni2 = nj * g.w + ni;
      if (closed[ni2]) continue;
      const ng = gScore[cur] + cost;
      if (ng < gScore[ni2]) {
        gScore[ni2] = ng;
        from[ni2] = cur;
        push(ng + h(ni, nj), ni2);
      }
    }
  }
  return null;
}

/** Greedy string-pulling over tile-centre points using line-of-sight. */
function smooth(area, pts) {
  if (pts.length <= 2) return pts;
  const out = [pts[0]];
  let a = 0;
  while (a < pts.length - 1) {
    let b = pts.length - 1;
    while (b > a + 1 && !lineClear(area, pts[a].x, pts[a].z, pts[b].x, pts[b].z)) b--;
    out.push(pts[b]);
    a = b;
  }
  return out;
}

export const path = {
  nearestWalkable,
  lineClear,
  clear() {
    cache.clear();
  },

  /**
   * Waypoints from (sx,sz) to (gx,gz) in area `area` (an AreaRuntime). Returns [{x,z}...] (start point excluded, goal
   * point last — the exact goal when its tile is walkable, else the nearest walkable tile centre), `[]` if already there,
   * or null when unreachable.
   */
  find(area, sx, sz, gx, gz) {
    const g = area?.grid;
    if (!g) return null;
    const s = nearestWalkable(area, sx, sz, 3);
    const e = nearestWalkable(area, gx, gz, 8);
    if (!s || !e) return null;
    const exactGoal = walkAt(g, tileOf(gx), tileOf(gz)) && !(area.isBlockedAt && area.isBlockedAt(gx, gz, 0.2));
    const goal = exactGoal ? { x: gx, z: gz } : { x: e.i + 0.5, z: e.j + 0.5 };
    const key = `${area.id}|${s.i},${s.j}|${e.i},${e.j}`;
    let tiles = cache.get(key);
    if (tiles === undefined) {
      tiles = astar(g, s.i, s.j, e.i, e.j);
      if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value);
      cache.set(key, tiles);
    }
    if (!tiles) return null;
    const pts = [{ x: sx, z: sz }];
    for (let k = 1; k < tiles.length - 1; k++) pts.push({ x: tiles[k].i + 0.5, z: tiles[k].j + 0.5 });
    pts.push(goal);
    const sm = smooth(area, pts);
    sm.shift();
    if (sm.length === 1 && Math.hypot(sm[0].x - sx, sm[0].z - sz) < 0.05) return [];
    return sm;
  },

  /** Total length of a waypoint list starting from (x,z). */
  length(route, x, z) {
    let len = 0;
    let px = x;
    let pz = z;
    for (const w of route) {
      len += Math.hypot(w.x - px, w.z - pz);
      px = w.x;
      pz = w.z;
    }
    return len;
  },
};
