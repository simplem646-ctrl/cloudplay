// A* over the tile grid (4-way). Pure logic, importable in Node.
//   findPath(collision, w, h, sx, sy, tx, ty, opts?) -> [{x,y}, ...] (start and goal included) or null
// opts: { goalBlocked: true  -> allow the goal tile to be solid (walk up to an NPC / counter),
//         blocked: (x,y)=>bool | Set<number> of y*w+x   -> extra obstacles (other actors),
//         maxNodes: 20000, turnPenalty: 0.02 (prefers long straight runs over staircases) }

const DIRS = [[0, -1], [1, 0], [0, 1], [-1, 0]];

export function findPath(collision, w, h, sx, sy, tx, ty, opts = {}) {
  if (sx < 0 || sy < 0 || tx < 0 || ty < 0 || sx >= w || sy >= h || tx >= w || ty >= h) return null;
  const extra = opts.blocked;
  const extraFn = typeof extra === 'function' ? extra : extra && extra.has ? (x, y) => extra.has(y * w + x) : null;
  const solid = (x, y) => collision[y * w + x] !== 0 || (extraFn ? !!extraFn(x, y) : false);
  const goalIdx = ty * w + tx;
  if (solid(tx, ty) && !opts.goalBlocked) return null;
  if (sx === tx && sy === ty) return [{ x: sx, y: sy }];

  const n = w * h;
  const maxNodes = opts.maxNodes || 20000;
  const turn = opts.turnPenalty === undefined ? 0.02 : opts.turnPenalty;
  const g = new Float32Array(n).fill(Infinity);
  const parent = new Int32Array(n).fill(-1);
  const pdir = new Int8Array(n).fill(-1);
  const closed = new Uint8Array(n);
  // binary min-heap in parallel arrays (priority, cell index)
  const hf = [];
  const hi = [];
  const push = (f, idx) => {
    let i = hf.length;
    hf.push(f);
    hi.push(idx);
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (hf[p] <= hf[i]) break;
      [hf[p], hf[i]] = [hf[i], hf[p]];
      [hi[p], hi[i]] = [hi[i], hi[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = hi[0];
    const lf = hf.pop();
    const li = hi.pop();
    if (hf.length) {
      hf[0] = lf;
      hi[0] = li;
      let i = 0;
      for (;;) {
        const l = i * 2 + 1;
        const r = l + 1;
        let m = i;
        if (l < hf.length && hf[l] < hf[m]) m = l;
        if (r < hf.length && hf[r] < hf[m]) m = r;
        if (m === i) break;
        [hf[m], hf[i]] = [hf[i], hf[m]];
        [hi[m], hi[i]] = [hi[i], hi[m]];
        i = m;
      }
    }
    return top;
  };

  const start = sy * w + sx;
  g[start] = 0;
  push(Math.abs(sx - tx) + Math.abs(sy - ty), start);
  let expanded = 0;
  while (hf.length) {
    const cur = pop();
    if (closed[cur]) continue;
    closed[cur] = 1;
    if (cur === goalIdx) {
      const out = [];
      for (let c = cur; c !== -1; c = parent[c]) out.push({ x: c % w, y: (c / w) | 0 });
      return out.reverse();
    }
    if (++expanded > maxNodes) return null;
    const cx = cur % w;
    const cy = (cur / w) | 0;
    for (let d = 0; d < 4; d++) {
      const nx = cx + DIRS[d][0];
      const ny = cy + DIRS[d][1];
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const ni = ny * w + nx;
      if (closed[ni]) continue;
      if (!(ni === goalIdx && opts.goalBlocked) && solid(nx, ny)) continue;
      const ng = g[cur] + 1 + (pdir[cur] !== -1 && pdir[cur] !== d ? turn : 0);
      if (ng < g[ni]) {
        g[ni] = ng;
        parent[ni] = cur;
        pdir[ni] = d;
        push(ng + (Math.abs(nx - tx) + Math.abs(ny - ty)) * (1 + 1e-4), ni);
      }
    }
  }
  return null;
}

/** Nearest walkable tile to (tx,ty) within `radius` (ring search), or null. */
export function nearestWalkable(collision, w, h, tx, ty, radius = 6) {
  const ok = (x, y) => x >= 0 && y >= 0 && x < w && y < h && !collision[y * w + x];
  if (ok(tx, ty)) return { x: tx, y: ty };
  for (let r = 1; r <= radius; r++) {
    let best = null;
    let bd = Infinity;
    for (let y = ty - r; y <= ty + r; y++) {
      for (let x = tx - r; x <= tx + r; x++) {
        if (Math.max(Math.abs(x - tx), Math.abs(y - ty)) !== r || !ok(x, y)) continue;
        const d = (x - tx) ** 2 + (y - ty) ** 2;
        if (d < bd) {
          bd = d;
          best = { x, y };
        }
      }
    }
    if (best) return best;
  }
  return null;
}
