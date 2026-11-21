/** Hair styles composed from primitives (head-local frame: origin = head centre, +z front, +x = character's left).
 *  buildHair(app, H) → [{ geo, sway? }] where sway is a group id ('back'|'left'|'right') for secondary-motion pieces. */
import { ell, tube, patch, paint, xf, merge, headPoint, headNormal, lookup, mix, darker, lighter, star, DEG, TAU, hash01 } from './kit.js';

const D = DEG;

function colors(app, look) {
  const h = app.hair;
  const base = h.color;
  return { base, shade: h.shade || darker(base, 0.3), hi: h.hi || lighter(base, 0.4) };
}

/** paint hair with an anime "angel ring" highlight band and darker underside. */
function hp(geo, c, o = {}) {
  const dir = o.band || [0, 0.55, 0.83];
  const lo = o.lo ?? 0.8, hi = o.hi ?? 0.91;
  return paint(geo, c.base, (x, y, z, nx, ny, nz) => {
    const d = nx * dir[0] + ny * dir[1] + nz * dir[2];
    if (d > lo && d < hi) return c.hi;
    if (ny < -0.4 || (nz < -0.3 && ny < 0.2)) return c.shade;
    return undefined;
  });
}

const edgeFn = (front, side, back, sideA = 90) => (a) => {
  const t = Math.abs(a);
  return lookup([[0, front * D], [sideA * D * 0.6, ((front + side) / 2) * D], [sideA * D, side * D], [Math.PI, back * D]], t);
};

function capGeo(H, c, o = {}) {
  const edge = o.edge || edgeFn(o.front ?? 60, o.side ?? 94, o.back ?? 118);
  const off = o.off ?? 0.034;
  const g = patch(H.rx, H.ry, H.rz, {
    rows: o.rows || 10, cols: o.cols || 36, lo: o.lo || (() => 0), hi: edge,
    off: (a, th) => off * (o.offTop ? 1 : 1) + (o.bulge ? o.bulge(a, th) : 0),
  });
  return hp(g, c, o.paint);
}

/** A hanging lock that follows the head surface. */
function lock(H, c, s) {
  const o0 = s.off0 ?? 0.03, o1 = s.off1 ?? 0.05;
  const th0 = s.th * D, a0 = s.a * D;
  const len = s.len * D, da = (s.da ?? 0) * D;
  const pts = [
    headPoint(H.rx, H.ry, H.rz, a0, th0, o0),
    headPoint(H.rx, H.ry, H.rz, a0 + da * 0.45, th0 + len * 0.5, o1),
    headPoint(H.rx, H.ry, H.rz, a0 + da, th0 + len, o1 * (s.tuck ?? 0.8)),
  ];
  const w = s.w ?? 0.05;
  const g = tube(pts, [w, w * 0.9, w * (s.tip ?? 0.18)], { radial: 7, seg: 6 });
  return hp(g, c, s.paint || {});
}

/** A spike / tuft sticking out of the head. tilt = extra direction added to the surface normal. */
function spike(H, c, s) {
  const a = s.a * D, th = s.th * D;
  const p0 = headPoint(H.rx, H.ry, H.rz, a, th, 0.0);
  const n = headNormal(H.rx, H.ry, H.rz, a, th);
  const t = s.tilt || [0, 0.3, 0];
  const dx = n[0] + t[0], dy = n[1] + t[1], dz = n[2] + t[2];
  const l = Math.hypot(dx, dy, dz) || 1;
  const sw = s.sweep || [0, 0, 0];
  const len = s.len;
  const pts = [
    p0,
    [p0[0] + (dx / l) * len * 0.5 + sw[0] * 0.3, p0[1] + (dy / l) * len * 0.5 + sw[1] * 0.3, p0[2] + (dz / l) * len * 0.5 + sw[2] * 0.3],
    [p0[0] + (dx / l) * len + sw[0], p0[1] + (dy / l) * len + sw[1], p0[2] + (dz / l) * len + sw[2]],
  ];
  const w = s.w ?? 0.045;
  const g = tube(pts, [w, w * 0.7, w * 0.08], { radial: 6, seg: 5 });
  return hp(g, c, s.paint || { lo: 0.7, hi: 0.85 });
}

function blob(c, p, r, o = {}) {
  const g = ell(r[0], r[1] ?? r[0], r[2] ?? r[0], 14, 10);
  xf(g, { p, r: o.rot || [0, 0, 0] });
  return hp(g, c, o.paint || { lo: 0.78, hi: 0.9 });
}
const solid = (g, col) => paint(g, col);

/** Row of bang locks across the forehead. */
function bangs(H, c, o) {
  const n = o.n || 7;
  const list = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1) * 2 - 1; // -1..1
    const a = t * (o.span ?? 58);
    const len = (o.len ?? 22) * 0.66 * (1 - 0.18 * Math.abs(t)) * (1 + (hash01(i + (o.seed || 0)) - 0.5) * (o.jitter ?? 0.25));
    list.push(lock(H, c, { a, th: (o.th ?? 54) - 3, len, da: (o.da ?? 0) + t * (o.fan ?? 7) + (o.sweep ?? 0), w: o.w ?? 0.058, off0: 0.028, off1: 0.052, tip: o.tip ?? 0.22 }));
  }
  return list;
}

/** Closed ring around the head (headband, goggles strap). */
export function headRing(H, th0, thBack, off, r, col, rot) {
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * TAU - Math.PI;
    const k = Math.abs(a) / Math.PI;
    const th = (th0 + (thBack - th0) * k) * D;
    pts.push(headPoint(H.rx, H.ry, H.rz, a + Math.PI, th, off));
  }
  const g = tube(pts, [r, r], { radial: 6, seg: 36, ends: 'flat' });
  return paint(g, col);
}

const STYLES = {
  // ---------------------------------------------------------------- young women
  side_braid(H, c, app) {
    const out = [];
    out.push({ geo: merge([capGeo(H, c, { front: 60, side: 96, back: 122 }), ...bangs(H, c, { n: 8, th: 55, len: 22, sweep: 5, span: 56 })]) });
    out.push({ geo: merge([lock(H, c, { a: -78, th: 68, len: 34, da: -4, w: 0.052 }), lock(H, c, { a: 66, th: 70, len: 36, da: 3, w: 0.048 }), lock(H, c, { a: 115, th: 82, len: 26, da: 4, w: 0.06 })]) });
    // braid over the character's left shoulder (viewer's right)
    const path = [[0.26, -0.08, -0.1], [0.27, -0.22, 0.03], [0.2, -0.37, 0.14], [0.155, -0.52, 0.175], [0.145, -0.66, 0.18]];
    const links = [];
    for (let i = 0; i < 8; i++) {
      const t = i / 7, k = t * (path.length - 1), j = Math.min(path.length - 2, Math.floor(k)), f = k - j;
      const p = path[j].map((v, q) => v + (path[j + 1][q] - v) * f);
      const r = 0.062 - 0.02 * t;
      const g = ell(r * 1.12, r * 0.88, r, 12, 8);
      xf(g, { p, r: [0, 0, (i % 2 ? 0.45 : -0.45)] });
      links.push(hp(g, c, { lo: 0.7, hi: 0.85 }));
    }
    links.push(solid(ell(0.035, 0.05, 0.03, 8, 6), c.base));
    xf(links[links.length - 1], { p: [0.145, -0.72, 0.18] });
    const rib = app.hair.ribbon;
    const bowL = ell(0.05, 0.034, 0.02, 10, 8), bowR = ell(0.05, 0.034, 0.02, 10, 8);
    xf(bowL, { p: [0.105, -0.67, 0.2], r: [0, 0, 0.6] });
    xf(bowR, { p: [0.19, -0.67, 0.2], r: [0, 0, -0.6] });
    const knot = ell(0.026, 0.026, 0.026, 8, 6);
    xf(knot, { p: [0.148, -0.665, 0.205] });
    links.push(solid(bowL, rib), solid(bowR, rib), solid(knot, mix(rib, '#000000', 0.12)));
    out.push({ geo: merge(links), sway: 'left', pivot: [0.24, -0.06, -0.08] });
    // little ribbon where the braid starts
    const top = ell(0.04, 0.028, 0.022, 8, 6);
    xf(top, { p: [0.25, -0.1, -0.06], r: [0, 0, 0.5] });
    out.push({ geo: solid(top, rib) });
    return out;
  },
  long_blunt(H, c) {
    const out = [];
    const edge = (a) => {
      const t = Math.abs(a);
      return lookup([[0, 76 * D], [50 * D, 78 * D], [75 * D, 100 * D], [90 * D, 108 * D], [Math.PI, 125 * D]], t);
    };
    out.push({ geo: capGeo(H, c, { edge, off: 0.036, cols: 44, rows: 12 }) });
    // straight side locks framing the face
    out.push({ geo: merge([lock(H, c, { a: -84, th: 80, len: 42, da: -3, w: 0.06, tip: 0.5 }), lock(H, c, { a: 84, th: 80, len: 42, da: 3, w: 0.06, tip: 0.5 })]), sway: 'back' });
    // long back curtain
    const cur = ell(0.31, 0.36, 0.13, 22, 14);
    xf(cur, { p: [0, -0.27, -0.2], r: [0.12, 0, 0] });
    out.push({ geo: hp(cur, c, { band: [0, 0.2, -0.6], lo: 0.55, hi: 0.7 }), sway: 'back', pivot: [0, 0.05, -0.2] });
    return out;
  },
  messy_tufts(H, c, app) {
    const out = [];
    const parts = [capGeo(H, c, { front: 58, side: 90, back: 112 }), ...bangs(H, c, { n: 6, th: 52, len: 20, span: 52, jitter: 0.5, fan: 12, w: 0.062, seed: 3 })];
    const sp = [
      { a: 0, th: 18, len: 0.16, tilt: [0, 0.4, 0.3] }, { a: 40, th: 30, len: 0.15, tilt: [0.5, 0.2, 0.2] }, { a: -45, th: 32, len: 0.16, tilt: [-0.5, 0.2, 0.2] },
      { a: 95, th: 52, len: 0.15, tilt: [0.8, -0.1, 0] }, { a: -95, th: 55, len: 0.14, tilt: [-0.8, -0.1, 0] }, { a: 160, th: 60, len: 0.15, tilt: [0.3, 0, -0.6] },
      { a: -160, th: 62, len: 0.14, tilt: [-0.3, 0, -0.6] }, { a: 20, th: 12, len: 0.12, tilt: [0.2, 0.6, -0.4] }, { a: 130, th: 90, len: 0.14, tilt: [0.6, -0.4, -0.3] }, { a: -130, th: 92, len: 0.13, tilt: [-0.6, -0.4, -0.3] },
    ];
    sp.forEach((s) => parts.push(spike(H, c, { ...s, w: 0.06 })));
    out.push({ geo: merge(parts) });
    out.push({ geo: headRing(H, 62, 78, 0.05, 0.026, app.hair.band) });
    return out;
  },
  bob_part(H, c) {
    const out = [];
    const edge = (a) => {
      const t = Math.abs(a);
      return lookup([[0, 62 * D], [60 * D, 96 * D], [85 * D, 124 * D], [140 * D, 128 * D], [Math.PI, 124 * D]], t);
    };
    out.push({ geo: capGeo(H, c, { edge, off: 0.036, cols: 48, rows: 14, bulge: (a, th) => 0.05 * Math.max(0, (th - 70 * D) / (60 * D)) }) });
    const sw = [];
    // side-part swoosh: long locks sweep across the forehead toward the viewer's right
    for (let i = 0; i < 6; i++) sw.push(lock(H, c, { a: -34 + i * 14, th: 42 - i * 1.2, len: 24 - i * 0.8, da: 24 - i * 3.5, w: 0.062, off1: 0.056, tip: 0.2 }));
    for (let i = 0; i < 3; i++) sw.push(lock(H, c, { a: -58 + i * 10, th: 50, len: 16, da: -8, w: 0.056 }));
    out.push({ geo: merge(sw) });
    return out;
  },
  wavy_halfup(H, c, app) {
    const out = [];
    out.push({ geo: merge([capGeo(H, c, { front: 62, side: 102, back: 122 }), ...bangs(H, c, { n: 8, th: 53, len: 24, span: 56, fan: 16, jitter: 0.35, w: 0.056, seed: 5 })]) });
    // half-up knot at the crown with the star clip
    const knot = ell(0.1, 0.085, 0.09, 14, 10);
    xf(knot, { p: [0, 0.3, -0.16] });
    const parts = [hp(knot, c, { lo: 0.7, hi: 0.85 })];
    const clip = star(0.06, 0.026, 0.016);
    xf(clip, { p: [0.15, 0.2, 0.19], r: [-0.3, 0.45, -0.25] });
    parts.push(paint(clip, app.hair.clip));
    out.push({ geo: merge(parts) });
    // long wavy hair: back + side locks
    const wavy = (x0, z0, len, ph, amp = 0.05, r = 0.07) => {
      const pts = [];
      const n = 7;
      for (let i = 0; i <= n; i++) {
        const t = i / n;
        pts.push([x0 + Math.sin(t * 7 + ph) * amp * (0.4 + t), 0.0 - t * len, z0 - 0.02 * t + Math.cos(t * 7 + ph) * amp * 0.4]);
      }
      return hp(tube(pts, [r, r * 1.05, r * 0.9, r * 0.8, r * 0.7, r * 0.6, r * 0.45, r * 0.15], { radial: 8, seg: 20 }), c, { lo: 0.6, hi: 0.75, band: [0, 0.3, 0.9] });
    };
    out.push({ geo: merge([wavy(-0.14, -0.2, 0.7, 0), wavy(0, -0.24, 0.78, 2, 0.05, 0.08), wavy(0.14, -0.2, 0.7, 4)]), sway: 'back', pivot: [0, 0.05, -0.2] });
    out.push({ geo: merge([wavy(-0.3, 0.02, 0.62, 1, 0.04, 0.055), wavy(0.3, 0.02, 0.62, 3, 0.04, 0.055)]), sway: 'right', pivot: [0, 0.0, 0.0] });
    return out;
  },
  // ---------------------------------------------------------------- young men / adults
  tousled(H, c) {
    const parts = [capGeo(H, c, { front: 58, side: 92, back: 116 }), ...bangs(H, c, { n: 7, th: 50, len: 22, span: 56, fan: 10, jitter: 0.5, sweep: 6, w: 0.062, seed: 1 })];
    [{ a: -20, th: 25, len: 0.12, tilt: [-0.2, 0.5, -0.3] }, { a: 20, th: 20, len: 0.11, tilt: [0.3, 0.5, -0.2] }, { a: 0, th: 12, len: 0.1, tilt: [0.1, 0.6, 0] },
      { a: 65, th: 42, len: 0.1, tilt: [0.8, 0.1, -0.2] }, { a: -65, th: 40, len: 0.1, tilt: [-0.8, 0.1, -0.2] }, { a: 150, th: 75, len: 0.1, tilt: [0.2, -0.1, -0.7] }, { a: -150, th: 78, len: 0.11, tilt: [-0.2, -0.1, -0.7] },
      { a: 180, th: 95, len: 0.1, tilt: [0, -0.4, -0.5] }].forEach((s) => parts.push(spike(H, c, { ...s, w: 0.058 })));
    return [{ geo: merge(parts) }];
  },
  spiky(H, c) {
    const parts = [capGeo(H, c, { front: 56, side: 90, back: 114 })];
    [{ a: 0, th: 20, len: 0.2, tilt: [0, 0.8, 0.5] }, { a: 28, th: 28, len: 0.2, tilt: [0.6, 0.6, 0.3] }, { a: -28, th: 28, len: 0.2, tilt: [-0.6, 0.6, 0.3] },
      { a: 62, th: 44, len: 0.19, tilt: [1.0, 0.3, 0] }, { a: -62, th: 44, len: 0.19, tilt: [-1.0, 0.3, 0] }, { a: 100, th: 60, len: 0.18, tilt: [1.0, 0, -0.3] }, { a: -100, th: 60, len: 0.18, tilt: [-1.0, 0, -0.3] },
      { a: 150, th: 55, len: 0.2, tilt: [0.4, 0.4, -1.0] }, { a: -150, th: 55, len: 0.2, tilt: [-0.4, 0.4, -1.0] }, { a: 180, th: 80, len: 0.17, tilt: [0, 0, -1] }, { a: 0, th: 40, len: 0.15, tilt: [0, 0.6, 0.9] },
      { a: 15, th: 47, len: 0.13, tilt: [0.3, 0.1, 1.0] }, { a: -20, th: 47, len: 0.13, tilt: [-0.4, 0.1, 1.0] }].forEach((s) => parts.push(spike(H, c, { ...s, w: 0.065 })));
    return [{ geo: merge(parts) }];
  },
  short_brown(H, c, app) {
    const parts = [capGeo(H, c, { front: 58, side: 93, back: 114 }), ...bangs(H, c, { n: 6, th: 49, len: 18, span: 52, fan: 6, jitter: 0.5, sweep: -4, w: 0.06, seed: 9 })];
    [{ a: 20, th: 22, len: 0.07, tilt: [0.2, 0.6, 0.2] }, { a: -25, th: 26, len: 0.07, tilt: [-0.2, 0.6, 0.2] }, { a: 90, th: 60, len: 0.06, tilt: [0.8, 0, 0] }, { a: -90, th: 60, len: 0.06, tilt: [-0.8, 0, 0] }].forEach((s) => parts.push(spike(H, c, { ...s, w: 0.055 })));
    const out = [{ geo: merge(parts) }];
    // pencil behind the left ear
    const pen = tube([[0.27, 0.07, 0.02], [0.33, 0.03, 0.12], [0.37, -0.0, 0.2]], [0.014, 0.014, 0.012], { radial: 6, seg: 4 });
    paint(pen, app.hair.pencil, (x, y, z) => (z > 0.17 ? '#f4a6b0' : undefined));
    out.push({ geo: pen });
    // stubble: darker skin on the lower face
    const st = patch(H.rx, H.ry, H.rz, { rows: 6, cols: 24, a0: -100 * D, a1: 100 * D, lo: (a) => lookup([[-100 * D, 92 * D], [-30 * D, 118 * D], [30 * D, 118 * D], [100 * D, 92 * D]], a), hi: () => 142 * D, off: () => 0.006 });
    paint(st, mix(app.skin, '#3a2a1c', 0.4));
    out.push({ geo: st });
    return out;
  },
  side_part_neat(H, c) {
    const parts = [capGeo(H, c, { front: 57, side: 94, back: 116 })];
    for (let i = 0; i < 6; i++) parts.push(lock(H, c, { a: -28 + i * 11, th: 44, len: 26 - i * 1.2, da: 18 - i * 2, w: 0.062, off1: 0.056 }));
    for (let i = 0; i < 3; i++) parts.push(lock(H, c, { a: -52 + i * 8, th: 50, len: 20, da: -6, w: 0.056 }));
    return [{ geo: merge(parts) }];
  },
  messy_kid(H, c) {
    const parts = [capGeo(H, c, { front: 58, side: 92, back: 116 }), ...bangs(H, c, { n: 7, th: 50, len: 20, span: 56, fan: 14, jitter: 0.6, w: 0.066, seed: 11 })];
    [{ a: 0, th: 8, len: 0.19, tilt: [0.2, 1.0, 0.3], w: 0.045 }, { a: 25, th: 24, len: 0.14, tilt: [0.7, 0.4, 0.2] }, { a: -30, th: 25, len: 0.15, tilt: [-0.7, 0.4, 0.2] },
      { a: 70, th: 45, len: 0.13, tilt: [1, 0.1, 0] }, { a: -70, th: 45, len: 0.13, tilt: [-1, 0.1, 0] }, { a: 120, th: 62, len: 0.13, tilt: [0.7, 0, -0.5] }, { a: -120, th: 64, len: 0.13, tilt: [-0.7, 0, -0.5] },
      { a: 180, th: 80, len: 0.13, tilt: [0, 0.1, -1] }, { a: 160, th: 100, len: 0.12, tilt: [0.5, -0.3, -0.8] }].forEach((s) => parts.push(spike(H, c, { w: 0.06, ...s })));
    return [{ geo: merge(parts) }];
  },
  pigtails(H, c, app) {
    const out = [];
    out.push({ geo: merge([capGeo(H, c, { front: 58, side: 96, back: 118 }), ...bangs(H, c, { n: 8, th: 52, len: 20, span: 56, fan: 4, jitter: 0.25, w: 0.06, seed: 13 })]) });
    const rib = app.hair.ribbon;
    for (const s of [-1, 1]) {
      const pts = [[s * 0.29, 0.1, -0.05], [s * 0.42, 0.02, 0.0], [s * 0.46, -0.14, 0.04], [s * 0.4, -0.28, 0.08]];
      const g = hp(tube(pts, [0.07, 0.075, 0.062, 0.02], { radial: 8, seg: 14 }), c, { lo: 0.55, hi: 0.72, band: [s * 0.8, 0.3, 0.5] });
      const bowA = ell(0.05, 0.034, 0.02, 10, 8), bowB = ell(0.05, 0.034, 0.02, 10, 8), knot = ell(0.026, 0.026, 0.026, 8, 6);
      xf(bowA, { p: [s * 0.29, 0.17, -0.02], r: [0, 0, 0.9] });
      xf(bowB, { p: [s * 0.35, 0.1, -0.02], r: [0, 0, -0.6] });
      xf(knot, { p: [s * 0.3, 0.12, -0.03] });
      out.push({ geo: merge([g, solid(bowA, rib), solid(bowB, rib), solid(knot, mix(rib, '#000', 0.15))]), sway: s > 0 ? 'left' : 'right', pivot: [s * 0.28, 0.1, -0.05] });
    }
    return out;
  },
  // ---------------------------------------------------------------- elders / specials
  bald_walrus(H, c) {
    const out = [];
    const side = (s) => patch(H.rx, H.ry, H.rz, { rows: 6, cols: 14, a0: s > 0 ? 62 * D : -122 * D, a1: s > 0 ? 122 * D : -62 * D, lo: () => 66 * D, hi: () => 108 * D, off: () => 0.036 });
    const back = patch(H.rx, H.ry, H.rz, { rows: 6, cols: 24, a0: 125 * D, a1: 235 * D, lo: () => 75 * D, hi: () => 110 * D, off: () => 0.034 });
    out.push({ geo: merge([hp(side(1), c), hp(side(-1), c), hp(back, c)]) });
    const st = [];
    for (const s of [-1, 1]) {
      st.push(blob(c, [s * 0.075, -0.113, 0.27], [0.1, 0.065, 0.075], { rot: [0.15, s * -0.2, s * 0.25], paint: { lo: 0.7, hi: 0.85 } }));
      const t = tube([[s * 0.12, -0.12, 0.25], [s * 0.2, -0.155, 0.2], [s * 0.225, -0.24, 0.16]], [0.056, 0.05, 0.012], { radial: 8, seg: 8 });
      st.push(hp(t, c, { lo: 0.7, hi: 0.85 }));
    }
    out.push({ geo: merge(st) });
    return out;
  },
  bun_needle(H, c) {
    const out = [];
    const parts = [capGeo(H, c, { front: 60, side: 95, back: 118 }), ...bangs(H, c, { n: 6, th: 55, len: 18, span: 50, fan: 18, jitter: 0.3, w: 0.05, seed: 15 })];
    parts.push(lock(H, c, { a: -82, th: 80, len: 22, da: -2, w: 0.045 }), lock(H, c, { a: 82, th: 80, len: 22, da: 2, w: 0.045 }));
    const bun = ell(0.13, 0.115, 0.12, 16, 12);
    xf(bun, { p: [0, 0.31, -0.16] });
    parts.push(hp(bun, c, { lo: 0.6, hi: 0.8 }));
    out.push({ geo: merge(parts) });
    // knitting needle through the bun + knobs
    const needle = tube([[-0.24, 0.17, -0.2], [0, 0.31, -0.16], [0.26, 0.45, -0.12]], [0.009, 0.009, 0.009], { radial: 6, seg: 6 });
    paint(needle, '#c8a060');
    const k1 = paint(ell(0.022, 0.022, 0.022, 8, 6), '#e0607e'), k2 = paint(ell(0.022, 0.022, 0.022, 8, 6), '#e0607e');
    xf(k1, { p: [-0.245, 0.165, -0.2] }); xf(k2, { p: [0.265, 0.455, -0.12] });
    out.push({ geo: merge([needle, k1, k2]) });
    return out;
  },
  beard_cap(H, c, app) {
    const out = [];
    const cap = paint(patch(H.rx, H.ry, H.rz, { rows: 10, cols: 36, hi: edgeFn(70, 98, 112), off: 0.055 }), app.hair.cap, (x, y, z, nx, ny, nz) => {
      const d = nx * 0 + ny * 0.55 + nz * 0.83;
      if (d > 0.82 && d < 0.92) return mix(app.hair.cap, '#ffffff', 0.25);
      if (ny < -0.3) return darker(app.hair.cap, 0.2);
      return undefined;
    });
    const band = paint(patch(H.rx, H.ry, H.rz, { rows: 4, cols: 36, lo: edgeFn(58, 86, 100), hi: edgeFn(72, 99, 113), off: 0.07 }), mix(app.hair.cap, '#ffffff', 0.12));
    const parts = [cap, band];
    const sidehair = patch(H.rx, H.ry, H.rz, { rows: 4, cols: 10, a0: 70 * D, a1: 130 * D, lo: () => 80 * D, hi: () => 112 * D, off: () => 0.035 });
    const sidehair2 = patch(H.rx, H.ry, H.rz, { rows: 4, cols: 10, a0: -130 * D, a1: -70 * D, lo: () => 80 * D, hi: () => 112 * D, off: () => 0.035 });
    parts.push(hp(sidehair, c), hp(sidehair2, c));
    out.push({ geo: merge(parts) });
    out.push({ geo: merge(beard(H, c, { fullness: 1, window: 26 })) });
    return out;
  },
  bun(H, c) {
    const parts = [capGeo(H, c, { front: 60, side: 96, back: 118 }), ...bangs(H, c, { n: 8, th: 53, len: 23, span: 56, fan: 22, jitter: 0.3, w: 0.058, seed: 17 })];
    const bun = ell(0.125, 0.11, 0.115, 16, 12);
    xf(bun, { p: [0, 0.3, -0.15] });
    parts.push(hp(bun, c, { lo: 0.6, hi: 0.8 }));
    parts.push(lock(H, c, { a: -80, th: 76, len: 26, da: -4, w: 0.05 }), lock(H, c, { a: 80, th: 76, len: 26, da: 4, w: 0.05 }));
    return [{ geo: merge(parts) }];
  },
  short_stache(H, c) {
    const out = [];
    out.push({ geo: merge([capGeo(H, c, { front: 54, side: 94, back: 116 }), ...bangs(H, c, { n: 5, th: 45, len: 14, span: 44, fan: 0, jitter: 0.5, w: 0.06, seed: 19 }), lock(H, c, { a: -86, th: 78, len: 20, w: 0.05 }), lock(H, c, { a: 86, th: 78, len: 20, w: 0.05 })]) });
    const st = [blob(c, [0, -0.118, 0.285], [0.1, 0.05, 0.05], { paint: { lo: 0.7, hi: 0.85 } })];
    for (const s of [-1, 1]) {
      const t = tube([[s * 0.06, -0.12, 0.285], [s * 0.15, -0.14, 0.255], [s * 0.225, -0.12, 0.2], [s * 0.255, -0.07, 0.15]], [0.05, 0.052, 0.04, 0.012], { radial: 8, seg: 10 });
      st.push(hp(t, c, { lo: 0.7, hi: 0.85 }));
    }
    out.push({ geo: merge(st) });
    return out;
  },
  thin_white(H, c) {
    const out = [];
    const cap = patch(H.rx, H.ry, H.rz, { rows: 8, cols: 36, lo: () => 34 * D, hi: edgeFn(34, 90, 116), off: () => 0.03 });
    const parts = [hp(cap, c)];
    // thin combed-over strands across the top
    for (let i = 0; i < 4; i++) {
      const y = 0.29 + i * 0.0, z = -0.1 + i * 0.07;
      const pts = [headPoint(H.rx, H.ry, H.rz, -70 * D, (28 + i * 5) * D, 0.02), headPoint(H.rx, H.ry, H.rz, -10 * D, (14 + i * 4) * D, 0.025), headPoint(H.rx, H.ry, H.rz, 55 * D, (30 + i * 5) * D, 0.022)];
      parts.push(hp(tube(pts, [0.012, 0.013, 0.008], { radial: 5, seg: 8 }), c));
    }
    parts.push(lock(H, c, { a: -88, th: 84, len: 18, w: 0.045 }), lock(H, c, { a: 88, th: 84, len: 18, w: 0.045 }));
    out.push({ geo: merge(parts) });
    return out;
  },
  wild_beard(H, c, app) {
    const out = [];
    const hoodCol = app.hair.hood;
    const hood = paint(patch(H.rx, H.ry, H.rz, { rows: 12, cols: 40, hi: edgeFn(66, 108, 142), off: 0.062 }), hoodCol, (x, y, z, nx, ny, nz) => {
      const d = ny * 0.55 + nz * 0.83;
      if (d > 0.8 && d < 0.9) return lighter(hoodCol, 0.2);
      if (ny < -0.35) return darker(hoodCol, 0.22);
    });
    const rim = paint(patch(H.rx, H.ry, H.rz, { rows: 4, cols: 40, a0: -110 * D, a1: 110 * D, lo: (a) => (60 + 4 * Math.abs(a) / D / 10) * D, hi: (a) => (68 + 4 * Math.abs(a) / D / 10) * D, off: () => 0.078 }), lighter(hoodCol, 0.12));
    const tip = paint(tube([[0, 0.2, -0.22], [0, 0.3, -0.33], [0, 0.26, -0.45]], [0.1, 0.07, 0.012], { radial: 8, seg: 8 }), hoodCol);
    const parts = [hood, rim, tip];
    // wild hair poking out from under the hood at the sides
    [{ a: 92, th: 85, len: 0.14, tilt: [1, -0.3, 0.2] }, { a: -92, th: 85, len: 0.14, tilt: [-1, -0.3, 0.2] }, { a: 105, th: 100, len: 0.15, tilt: [1, -0.6, 0] }, { a: -105, th: 100, len: 0.15, tilt: [-1, -0.6, 0] },
      { a: 70, th: 74, len: 0.12, tilt: [1, -0.4, 0.4] }, { a: -70, th: 74, len: 0.12, tilt: [-1, -0.4, 0.4] }].forEach((s) => parts.push(spike(H, c, { w: 0.05, ...s })));
    out.push({ geo: merge(parts) });
    out.push({ geo: merge(beard(H, c, { fullness: 1.3, window: 22, wild: true })) });
    return out;
  },
  long_braids(H, c, app) {
    const out = [];
    out.push({ geo: merge([capGeo(H, c, { front: 60, side: 96, back: 122 }), ...bangs(H, c, { n: 8, th: 52, len: 24, span: 56, fan: 24, jitter: 0.25, w: 0.054, seed: 21 })]) });
    const beads = app.hair.beads;
    const braid = (x, z, y0, len, bw, side) => {
      const links = [];
      const n = 6;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        const g = ell(bw * 1.1, bw * 0.95, bw, 8, 6);
        xf(g, { p: [x + side * 0.02 * t, y0 - t * len, z + 0.01 * t], r: [0, 0, (i % 2 ? 0.5 : -0.5)] });
        links.push(hp(g, c, { lo: 0.6, hi: 0.8 }));
      }
      for (const t of [0.35, 0.68, 1]) {
        const b = ell(0.021, 0.021, 0.021, 6, 5);
        xf(b, { p: [x + side * 0.02 * t, y0 - t * len - 0.01, z + 0.03 + 0.01 * t] });
        links.push(paint(b, beads[Math.floor(hash01(x * 100 + t * 10 + 1) * beads.length)]));
      }
      return merge(links);
    };
    const backs = [];
    for (let i = 0; i < 6; i++) backs.push(braid(-0.19 + i * 0.076, -0.22, -0.02 - (i % 2) * 0.04, 0.58 - (i % 3) * 0.06, 0.05, 0));
    out.push({ geo: merge(backs), sway: 'back', pivot: [0, 0.0, -0.2] });
    out.push({ geo: braid(0.3, 0.07, -0.02, 0.44, 0.052, 1), sway: 'left', pivot: [0.3, 0.0, 0.0] });
    out.push({ geo: braid(-0.3, 0.07, -0.02, 0.44, 0.052, -1), sway: 'right', pivot: [-0.3, 0.0, 0.0] });
    return out;
  },
  curly(H, c) {
    const parts = [capGeo(H, c, { front: 64, side: 98, back: 120, off: 0.03 })];
    const rings = [[44, 8], [66, 12], [90, 14], [112, 12]];
    let k = 0;
    rings.forEach(([th, n]) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU - Math.PI + (th % 2) * 0.1;
        const front = Math.abs(a) < 0.62 && th > 62;
        if (front) continue;
        const r = 0.07 + hash01(++k) * 0.025;
        const p = headPoint(H.rx, H.ry, H.rz, a, th * D, 0.045);
        const g = ell(r, r * 0.95, r, 10, 8);
        xf(g, { p });
        parts.push(hp(g, c, { lo: 0.7, hi: 0.85 }));
      }
    });
    // curls peeking out in front of the forehead
    for (let i = 0; i < 6; i++) {
      const a = (i / 5 - 0.5) * 100 * D;
      const g = ell(0.058, 0.058, 0.058, 10, 8);
      xf(g, { p: headPoint(H.rx, H.ry, H.rz, a, (56 + 6 * Math.abs(i - 2.5)) * D, 0.05) });
      parts.push(hp(g, c, { lo: 0.7, hi: 0.85 }));
    }
    return [{ geo: merge(parts) }];
  },
};

/** Beard shell + moustache (gus / bramwell). */
function beard(H, c, o) {
  const win = (o.window ?? 26) * D;
  const lo = (a) => lookup([[0, 128 * D], [win, 126 * D], [win + 25 * D, 100 * D], [95 * D, 90 * D], [Math.PI, 90 * D]], Math.abs(a));
  const g = patch(H.rx, H.ry, H.rz, {
    rows: 10, cols: 44, a0: -125 * D, a1: 125 * D, lo, hi: () => 150 * D,
    off: (a, th) => 0.03 + 0.1 * o.fullness * Math.pow(Math.max(0, (th - 100 * D) / (50 * D)), 1.1) * Math.max(0.2, Math.cos(a * 0.7)),
  });
  const out = [hp(g, c, { lo: 0.6, hi: 0.72, band: [0, 0.2, 0.9] })];
  out.push(blob(c, [0, -0.115, 0.285], [0.1, 0.045, 0.05], { paint: { lo: 0.7, hi: 0.85 } }));
  for (const s of [-1, 1]) out.push(hp(tube([[s * 0.05, -0.11, 0.285], [s * 0.13, -0.135, 0.255], [s * 0.17, -0.19, 0.22]], [0.045, 0.045, 0.012], { radial: 7, seg: 8 }), c, { lo: 0.7, hi: 0.85 }));
  if (o.wild) {
    [{ a: -40, len: 0.2, tilt: [-0.5, -1, 0.2] }, { a: -15, len: 0.26, tilt: [-0.2, -1, 0.3] }, { a: 12, len: 0.24, tilt: [0.2, -1, 0.3] }, { a: 40, len: 0.2, tilt: [0.5, -1, 0.2] }, { a: 0, len: 0.3, tilt: [0, -1, 0.1] }]
      .forEach((s) => out.push(spike(H, c, { ...s, th: 142, w: 0.06, paint: { lo: 0.6, hi: 0.75 } })));
  }
  return out;
}

export function buildHair(app, H, look) {
  const hair = { ...app.hair };
  if (look && look.hair && app.hair.style === 'tousled') hair.color = look.hair;
  const a2 = { ...app, hair };
  const c = colors(a2);
  const fn = STYLES[hair.style];
  if (!fn) throw new Error(`unknown hair style ${hair.style}`);
  return fn(H, c, a2);
}
export const HAIR_STYLES = Object.keys(STYLES);
