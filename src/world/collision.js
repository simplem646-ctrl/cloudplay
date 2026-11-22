/**
 * Collision + surface world for one area. Pure JS (Node-testable).
 *  - solids: exact AABB rects and circles (buildings, fences, trunks...), bucketed per tile
 *  - water: rasterised at 1/4 tile; bridges clear water cells
 *  - grid.walk: per-tile walkability for A* (tiles overlapped by `tile` solids or mostly water are blocked)
 *  - surfaces: ground kinds rasterised at 1/2 tile + override rects (bridges, wooden decks)
 */
import { clamp } from '../core/util.js';
import { pointInPoly, polyBounds } from './shapes.js';

const WATER_RES = 4;
const SURF_RES = 2;

export class CollisionWorld {
  constructor(width, height) {
    this.w = width;
    this.h = height;
    this.rects = [];
    this.circles = [];
    this.buckets = new Map();
    this.water = new Uint8Array(width * WATER_RES * height * WATER_RES);
    this.surf = new Uint8Array(width * SURF_RES * height * SURF_RES); // index into this.surfNames
    this.surfNames = ['grass'];
    this.surfOverrides = [];
    this.winter = false;
    this.grid = { w: width, h: height, walk: new Uint8Array(width * height).fill(1) };
  }

  _bucket(i, j) {
    return this.buckets.get(j * 4096 + i);
  }

  _register(item, x0, z0, x1, z1) {
    const i0 = Math.max(0, Math.floor(x0)), i1 = Math.min(4095, Math.floor(x1)), j0 = Math.max(0, Math.floor(z0)), j1 = Math.min(4095, Math.floor(z1));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        const key = j * 4096 + i;
        let b = this.buckets.get(key);
        if (!b) this.buckets.set(key, (b = []));
        b.push(item);
      }
    }
  }

  /** Axis-aligned solid. tile:true also blocks every tile it touches in grid.walk. */
  addRect(x0, z0, x1, z1, opts = {}) {
    const r = { x0: Math.min(x0, x1), z0: Math.min(z0, z1), x1: Math.max(x0, x1), z1: Math.max(z0, z1), tile: opts.tile !== false, solid: opts.solid !== false };
    this.rects.push(r);
    // pad registration by 1 tile so a query circle (r<=0.9) in a neighbour tile finds it
    this._register(r, r.x0 - 1, r.z0 - 1, r.x1 + 1, r.z1 + 1);
    return r;
  }

  addCircle(x, z, r, opts = {}) {
    const c = { x, z, r, tile: !!opts.tile };
    this.circles.push(c);
    this._register(c, x - r - 1, z - r - 1, x + r + 1, z + r + 1);
    return c;
  }

  addWater(poly) {
    const b = polyBounds(poly);
    const W = this.w * WATER_RES;
    const H = this.h * WATER_RES;
    const i0 = Math.max(0, Math.floor(b.x0 * WATER_RES));
    const i1 = Math.min(W - 1, Math.ceil(b.x1 * WATER_RES));
    const j0 = Math.max(0, Math.floor(b.z0 * WATER_RES));
    const j1 = Math.min(H - 1, Math.ceil(b.z1 * WATER_RES));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (pointInPoly((i + 0.5) / WATER_RES, (j + 0.5) / WATER_RES, poly)) this.water[j * W + i] = 1;
      }
    }
  }

  clearWater(x0, z0, x1, z1) {
    const W = this.w * WATER_RES;
    const H = this.h * WATER_RES;
    for (let j = Math.max(0, Math.floor(z0 * WATER_RES)); j <= Math.min(H - 1, Math.floor(z1 * WATER_RES)); j++) {
      for (let i = Math.max(0, Math.floor(x0 * WATER_RES)); i <= Math.min(W - 1, Math.floor(x1 * WATER_RES)); i++) this.water[j * W + i] = 0;
    }
  }

  isWaterAt(x, z) {
    if (x < 0 || z < 0 || x >= this.w || z >= this.h) return false;
    return this.water[Math.floor(z * WATER_RES) * this.w * WATER_RES + Math.floor(x * WATER_RES)] === 1;
  }

  paintSurface(poly, name) {
    let idx = this.surfNames.indexOf(name);
    if (idx < 0) idx = this.surfNames.push(name) - 1;
    const b = polyBounds(poly);
    const W = this.w * SURF_RES;
    const H = this.h * SURF_RES;
    const i0 = Math.max(0, Math.floor(b.x0 * SURF_RES));
    const i1 = Math.min(W - 1, Math.ceil(b.x1 * SURF_RES));
    const j0 = Math.max(0, Math.floor(b.z0 * SURF_RES));
    const j1 = Math.min(H - 1, Math.ceil(b.z1 * SURF_RES));
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (pointInPoly((i + 0.5) / SURF_RES, (j + 0.5) / SURF_RES, poly)) this.surf[j * W + i] = idx;
      }
    }
  }

  addSurfaceRect(x0, z0, x1, z1, name) {
    this.surfOverrides.push({ x0, z0, x1, z1, name });
  }

  surfaceAt(x, z) {
    for (let k = this.surfOverrides.length - 1; k >= 0; k--) {
      const o = this.surfOverrides[k];
      if (x >= o.x0 && x <= o.x1 && z >= o.z0 && z <= o.z1) return this._winter(o.name);
    }
    const i = clamp(Math.floor(x * SURF_RES), 0, this.w * SURF_RES - 1);
    const j = clamp(Math.floor(z * SURF_RES), 0, this.h * SURF_RES - 1);
    return this._winter(this.surfNames[this.surf[j * this.w * SURF_RES + i]] || 'grass');
  }

  _winter(s) {
    return this.winter && (s === 'grass' || s === 'dirt') ? 'snow' : s;
  }

  /** True if a circle at (x,z) radius r overlaps anything solid, water, or the map border. */
  blockedAt(x, z, r = 0.3) {
    if (x < r || z < r || x > this.w - r || z > this.h - r) return true;
    const b = this._bucket(Math.floor(x), Math.floor(z));
    if (b) {
      for (const s of b) {
        if (s.r !== undefined) {
          const dx = x - s.x;
          const dz = z - s.z;
          const rr = r + s.r;
          if (dx * dx + dz * dz < rr * rr) return true;
        } else if (s.solid) {
          const cx = clamp(x, s.x0, s.x1);
          const cz = clamp(z, s.z0, s.z1);
          const dx = x - cx;
          const dz = z - cz;
          if (dx * dx + dz * dz < r * r) return true;
        }
      }
    }
    // water: sample cells covered by the circle
    const W = this.w * WATER_RES;
    const i0 = Math.floor((x - r) * WATER_RES);
    const i1 = Math.floor((x + r) * WATER_RES);
    const j0 = Math.floor((z - r) * WATER_RES);
    const j1 = Math.floor((z + r) * WATER_RES);
    const rr = r * r;
    for (let j = j0; j <= j1; j++) {
      for (let i = i0; i <= i1; i++) {
        if (this.water[j * W + i] !== 1) continue;
        const cx = (i + 0.5) / WATER_RES - x;
        const cz = (j + 0.5) / WATER_RES - z;
        if (cx * cx + cz * cz < rr) return true;
      }
    }
    return false;
  }

  /** Slide a circle by (dx,dz). Sub-steps of <= 0.12 tile so it never tunnels thin fences. */
  moveCircle(x, z, dx, dz, r = 0.3) {
    const dist = Math.hypot(dx, dz);
    const n = Math.max(1, Math.ceil(dist / 0.12));
    const sx = dx / n;
    const sz = dz / n;
    let blocked = false;
    for (let k = 0; k < n; k++) {
      if (!this.blockedAt(x + sx, z + sz, r)) {
        x += sx;
        z += sz;
        continue;
      }
      blocked = true;
      let moved = false;
      if (sx !== 0 && !this.blockedAt(x + sx, z, r)) { x += sx; moved = true; }
      if (sz !== 0 && !this.blockedAt(x, z + sz, r)) { z += sz; moved = true; }
      if (!moved) {
        // try nudging along the wall using the dominant remaining direction
        const ax = Math.abs(sx);
        const az = Math.abs(sz);
        if (ax > 1e-6 && az > 1e-6) break;
        // cardinal push straight into wall: stop
        break;
      }
    }
    return { x, z, blocked };
  }

  /** Build grid.walk (tile granularity) after all solids/water were added. */
  finalize() {
    const { w, h } = this;
    const walk = this.grid.walk;
    walk.fill(1);
    const pad = 0.04;
    for (const r of this.rects) {
      if (!r.tile || !r.solid) continue;
      const i0 = Math.floor(r.x0 + pad), i1 = Math.floor(r.x1 - pad), j0 = Math.floor(r.z0 + pad), j1 = Math.floor(r.z1 - pad);
      for (let j = Math.max(0, j0); j <= Math.min(h - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(w - 1, i1); i++) walk[j * w + i] = 0;
    }
    for (const c of this.circles) {
      if (!c.tile) continue;
      const i0 = Math.floor(c.x - c.r), i1 = Math.floor(c.x + c.r), j0 = Math.floor(c.z - c.r), j1 = Math.floor(c.z + c.r);
      for (let j = Math.max(0, j0); j <= Math.min(h - 1, j1); j++) for (let i = Math.max(0, i0); i <= Math.min(w - 1, i1); i++) walk[j * w + i] = 0;
    }
    const W = w * WATER_RES;
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        let n = 0;
        for (let b = 0; b < WATER_RES; b++) for (let a = 0; a < WATER_RES; a++) n += this.water[(j * WATER_RES + b) * W + i * WATER_RES + a];
        if (n >= WATER_RES * WATER_RES * 0.3) walk[j * w + i] = 0;
      }
    }
    return this.grid;
  }
}
