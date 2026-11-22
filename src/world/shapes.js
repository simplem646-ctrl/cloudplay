/**
 * Pure 2D shape helpers shared by the ground painter and the collision/surface rasteriser.
 * No three, no DOM: importable in Node. All coordinates are tiles (x east, z south).
 */
import { mulberry32 } from '../core/util.js';

/** Cheap smooth 1D value noise (deterministic by seed). */
export function noise1(seed) {
  const r = mulberry32(seed);
  const t = Array.from({ length: 64 }, () => r() * 2 - 1);
  return (x) => {
    const i = Math.floor(x);
    const f = x - i;
    const a = t[((i % 64) + 64) % 64];
    const b = t[(((i + 1) % 64) + 64) % 64];
    const s = f * f * (3 - 2 * f);
    return a + (b - a) * s;
  };
}

function catmull(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  return [
    0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3),
  ];
}

/** Smooth a polyline with Catmull-Rom; returns sampled points ~step apart plus matching param array. */
export function smoothLine(points, step = 0.4) {
  if (points.length < 3) {
    // straight segment, still resample
    const out = [];
    const a = points[0];
    const b = points[points.length - 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(len / step));
    for (let i = 0; i <= n; i++) out.push([a[0] + ((b[0] - a[0]) * i) / n, a[1] + ((b[1] - a[1]) * i) / n, i / n]);
    return out;
  }
  const out = [];
  const n = points.length;
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(n - 1, i + 2)];
    const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const segs = Math.max(2, Math.ceil(len / step));
    for (let s = 0; s < segs; s++) {
      const q = catmull(p0, p1, p2, p3, s / segs);
      out.push([q[0], q[1], (i + s / segs) / (n - 1)]);
    }
  }
  const last = points[n - 1];
  out.push([last[0], last[1], 1]);
  return out;
}

/** Build a closed polygon outlining a variable-width stroke along a polyline. */
export function pathToPoly(points, width, opts = {}) {
  const { wobble = 0, seed = 7, step = 0.4, cap = 'round' } = opts;
  const line = smoothLine(points, step);
  const widths = Array.isArray(width) ? width : null;
  const wAt = (u) => {
    if (!widths) return width;
    const f = u * (widths.length - 1);
    const i = Math.min(widths.length - 2, Math.floor(f));
    return widths[i] + (widths[i + 1] - widths[i]) * (f - i);
  };
  const nz = noise1(seed);
  const left = [];
  const right = [];
  for (let i = 0; i < line.length; i++) {
    const p = line[i];
    const a = line[Math.max(0, i - 1)];
    const b = line[Math.min(line.length - 1, i + 1)];
    let tx = b[0] - a[0];
    let tz = b[1] - a[1];
    const l = Math.hypot(tx, tz) || 1;
    tx /= l;
    tz /= l;
    const nx = -tz;
    const nzv = tx;
    const w = wAt(p[2]) / 2;
    const wl = w * (1 + wobble * nz(i * 0.45));
    const wr = w * (1 + wobble * nz(i * 0.45 + 31));
    left.push([p[0] + nx * wl, p[1] + nzv * wl]);
    right.push([p[0] - nx * wr, p[1] - nzv * wr]);
  }
  const poly = left.slice();
  if (cap === 'round') {
    const e = line[line.length - 1];
    const e0 = line[line.length - 2] || e;
    const ang = Math.atan2(e[1] - e0[1], e[0] - e0[0]);
    const r = wAt(1) / 2;
    for (let k = 1; k < 6; k++) {
      const a = ang + Math.PI / 2 - (Math.PI * k) / 6;
      poly.push([e[0] + Math.cos(a) * r, e[1] + Math.sin(a) * r]);
    }
  }
  for (let i = right.length - 1; i >= 0; i--) poly.push(right[i]);
  if (cap === 'round') {
    const s = line[0];
    const s1 = line[1] || s;
    const ang = Math.atan2(s[1] - s1[1], s[0] - s1[0]);
    const r = wAt(0) / 2;
    for (let k = 1; k < 6; k++) {
      const a = ang + Math.PI / 2 - (Math.PI * k) / 6;
      poly.push([s[0] + Math.cos(a) * r, s[1] + Math.sin(a) * r]);
    }
  }
  return poly;
}

function ellipsePoly(cx, cz, rx, rz, n) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    out.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]);
  }
  return out;
}

function roundRectPoly(x, z, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  if (r <= 0.01) return [[x, z], [x + w, z], [x + w, z + h], [x, z + h]];
  const out = [];
  const arc = (cx, cz, a0) => {
    for (let k = 0; k <= 5; k++) {
      const a = a0 + (k / 5) * (Math.PI / 2);
      out.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]);
    }
  };
  arc(x + w - r, z + r, -Math.PI / 2);
  arc(x + w - r, z + h - r, 0);
  arc(x + r, z + h - r, Math.PI / 2);
  arc(x + r, z + r, Math.PI);
  return out;
}

/**
 * Convert an op ({rect|poly|circle|ellipse|path ...}) to a polygon [[x,z],...].
 * rect:[x,z,w,h] (+ r corner radius) · poly:[[x,z],...] · circle:[cx,cz,r] · ellipse:[cx,cz,rx,rz]
 * path:[[x,z],...] with w (number | number[]), wobble, cap
 */
export function opToPoly(op, seedHint = 1) {
  if (op.rect) return roundRectPoly(op.rect[0], op.rect[1], op.rect[2], op.rect[3], op.r || 0);
  if (op.poly) return op.poly.map((p) => [p[0], p[1]]);
  if (op.circle) return ellipsePoly(op.circle[0], op.circle[1], op.circle[2], op.circle[2], Math.max(20, Math.ceil(op.circle[2] * 8)));
  if (op.ellipse) return ellipsePoly(op.ellipse[0], op.ellipse[1], op.ellipse[2], op.ellipse[3], Math.max(20, Math.ceil(Math.max(op.ellipse[2], op.ellipse[3]) * 8)));
  if (op.path) return pathToPoly(op.path, op.w ?? 2.5, { wobble: op.wobble ?? 0.06, seed: op.seed ?? seedHint, cap: op.cap || 'round' });
  throw new Error('shape op needs rect|poly|circle|ellipse|path');
}

export function polyBounds(poly) {
  let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
  for (const [x, z] of poly) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (z < z0) z0 = z;
    if (z > z1) z1 = z;
  }
  return { x0, z0, x1, z1 };
}

export function pointInPoly(x, z, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], zi = poly[i][1], xj = poly[j][0], zj = poly[j][1];
    if (zi > z !== zj > z && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

/** Perimeter sample points of a polygon, ~spacing apart: [[x,z,nx,nz],...] with outward-ish normals. */
export function perimeterPoints(poly, spacing) {
  const out = [];
  // orientation (signed area) to know the outward normal
  let area = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    area += a[0] * b[1] - b[0] * a[1];
  }
  const sgn = area > 0 ? 1 : -1;
  let carry = 0;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const dx = b[0] - a[0];
    const dz = b[1] - a[1];
    const len = Math.hypot(dx, dz);
    if (len < 1e-6) continue;
    const nx = (dz / len) * sgn;
    const nz = (-dx / len) * sgn;
    let d = carry;
    while (d < len) {
      out.push([a[0] + (dx * d) / len, a[1] + (dz * d) / len, nx, nz]);
      d += spacing;
    }
    carry = d - len;
  }
  return out;
}
