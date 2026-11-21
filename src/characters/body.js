/** Nominal chibi body (adult height ~1.14 incl. hair). Body-local frame: origin at the hip pivot, +y up, +z front.
 *  Left = +x (character's left is the viewer's right). Everything is vertex-coloured and mergeable. */
import * as THREE from 'three';
import { ell, lathe, tube, paint, xf, merge, lookup, mix, darker, lighter, fixWinding, hash01, TAU, DEG } from './kit.js';

export const DIM = {
  hipY: 0.23, // world height of the hip pivot
  neckY: 0.25, // body-local neck pivot
  headC: 0.3, // head centre above the neck pivot
  head: { rx: 0.325, ry: 0.31, rz: 0.3 },
  legX: 0.075, legLen: 0.145, legR: 0.053,
  shoulder: { x: 0.168, y: 0.222 }, armLen: 0.15, armR: 0.045, handR: 0.054,
  topY: 0.23 + 0.25 + 0.3 + 0.31 + 0.04, // nominal top of hair (1.13)
};

/** Torso radius table (before build.w). y → r */
export function torsoTable(build) {
  const b = build.belly || 0, w = build.w || 1;
  return [
    [-0.075, 0.085 * w], [-0.05, 0.15 * w], [0.0, 0.168 * w], [0.08, (0.172 + b) * w], [0.15, (0.165 + b * 0.6) * w],
    [0.2, 0.152 * w], [0.245, 0.118 * w], [0.275, 0.07 * w], [0.292, 0.03 * w],
  ];
}
export const torsoDepth = (build) => 0.88 + (build.belly || 0) * 1.2;
export function torsoR(build, y) {
  return lookup(torsoTable(build), y);
}

/** Shell hugging the torso (and flaring below it). Range fn gives [a0,a1] (radians, 0=front, +a toward +x) per y. */
export function bodyShell(build, o) {
  const rows = o.rows || 10, cols = o.cols || 28;
  const { y0, y1 } = o;
  const off = o.off ?? 0.015;
  const flare = o.flare || 0, flareStart = o.flareStart ?? -0.05;
  const zd = torsoDepth(build) + (o.zdAdd || 0);
  const rfn = (y) => {
    let r = torsoR(build, Math.max(y, flareStart)) + (typeof off === 'function' ? off(y) : off);
    if (y < flareStart) r += (flareStart - y) * flare;
    return r + (o.bulge ? o.bulge(y) : 0);
  };
  const range = o.range || (() => [-Math.PI, Math.PI]);
  const verts = [], norms = [], index = [];
  const C = cols + 1;
  for (let i = 0; i <= rows; i++) {
    const y = y0 + ((y1 - y0) * i) / rows;
    const r = rfn(y);
    const dr = (rfn(y + 0.004) - rfn(y - 0.004)) / 0.008;
    const [a0, a1] = range(y, i / rows);
    for (let j = 0; j <= cols; j++) {
      const a = a0 + ((a1 - a0) * j) / cols;
      const s = Math.sin(a), c = Math.cos(a);
      verts.push(r * s, y, r * c * zd);
      const nx = s, nz = c / zd, ny = -dr;
      const l = Math.hypot(nx, ny, nz) || 1;
      norms.push(nx / l, ny / l, nz / l);
    }
  }
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const a = i * C + j, b = a + 1, c = a + C, d = c + 1;
      index.push(a, c, b, c, d, b);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  g.setIndex(index);
  return fixWinding(g);
}

/** surface point on torso front/back for decorations: azimuth a (0 front) and height y. */
export function torsoPoint(build, a, y, off = 0) {
  const zd = torsoDepth(build);
  const r = torsoR(build, y) + off;
  return [r * Math.sin(a), y, r * Math.cos(a) * zd];
}

// -------------------------------------------------------------------- painting helpers
/** Paint ops on cloth surfaces: hstripes, plaid. Returns fn(x,y,z)->colour|undefined. */
export function clothFn(base, ops, yRange = [-0.07, 0.29]) {
  if (!ops || !ops.length) return undefined;
  return (x, y, z) => {
    let col;
    for (const [kind, o] of ops) {
      if (kind === 'hstripes') {
        const k = Math.floor(((y - yRange[0]) / (yRange[1] - yRange[0])) * o.n * 2);
        if (k % 2 === 1) col = o.c;
      } else if (kind === 'plaid') {
        const a = Math.atan2(x, z);
        const v = Math.abs(((a / (TAU / 20)) % 1 + 1) % 1 - 0.5) < 0.17;
        const h = Math.abs((((y + 0.1) / 0.075) % 1 + 1) % 1 - 0.5) < 0.17;
        if (v || h) col = mix(base, o.c, v && h ? 0.9 : 0.5);
      }
    }
    return col;
  };
}

// -------------------------------------------------------------------- body parts
/** Torso (base shirt/dress) — painted with torso colour + paint ops. */
export function buildTorso(app, colors) {
  const tab = torsoTable(app.build);
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const y = -0.075 + (0.292 + 0.075) * (i / 24);
    pts.push([Math.max(0.004, lookup(tab, y)), y]);
  }
  const g = lathe(pts, 28);
  xf(g, { s: [1, 1, torsoDepth(app.build)] });
  const base = colors.torso;
  const fn = clothFn(base, app.torso.paint);
  // darker pelvis / skin neck patch
  return paint(g, base, (x, y, z, nx, ny, nz) => {
    if (y > 0.262) return app.skin;
    if (y < -0.012) return app.legs.color;
    return fn ? fn(x, y, z) : undefined;
  });
}

/** One leg hanging from the hip pivot (shared for L/R). Boot included. */
export function buildLeg(app, colors) {
  const L = DIM.legLen, r = DIM.legR;
  const g = tube([[0, 0.012, 0], [0, -L * 0.5, 0], [0, -L - 0.01, 0]], [r * 0.95, r, r * 0.96], { radial: 10, seg: 8 });
  const len = app.legs.len;
  const cloth = app.legs.color;
  const clothEnd = -0.012 - L * len;
  const lowerCol = app.legs.sock || app.skin;
  paint(g, cloth, (x, y) => {
    if (y > clothEnd) return cloth;
    return lowerCol;
  });
  const parts = [g];
  // boot
  const b = app.boots;
  const boot = ell(0.076, 0.07, 0.108, 18, 12);
  xf(boot, { p: [0, -L - 0.065 + 0.0, 0.026] });
  paint(boot, b.color, (x, y, z, nx, ny) => {
    if (b.sole && y < -L - 0.122) return b.sole;
    if (b.sole && z > 0.095 && y < -L - 0.095) return b.sole;
    return undefined;
  });
  parts.push(boot);
  const tall = b.tall || 0.035;
  const shaft = tube([[0, -L + tall + 0.012, 0.0], [0, -L - 0.03, 0.002]], [r * 1.12, r * 1.18], { radial: 10, seg: 3, ends: 'round' });
  paint(shaft, b.color);
  parts.push(shaft);
  if (b.cuff) {
    const cuff = tube([[0, -L + tall + 0.02, 0], [0, -L + tall + 0.004, 0]], [r * 1.22, r * 1.22], { radial: 10, seg: 2, ends: 'flat' });
    paint(cuff, b.cuff);
    parts.push(cuff);
  }
  return merge(parts);
}

/** One arm hanging from the shoulder pivot (shared geometry L/R) incl. mitten hand. */
export function buildArm(app, colors, side = 1) {
  const L = DIM.armLen, r = DIM.armR;
  const g = tube([[0, 0.006, 0], [0, -L * 0.5, 0], [0, -L, 0]], [r * 1.04, r, r * 0.9], { radial: 10, seg: 8 });
  const cloth = app.arms.color;
  const len = app.arms.len;
  const sleeveEnd = -0.006 - L * len;
  const stripes = app.arms.stripes, plaid = app.arms.plaid;
  paint(g, cloth, (x, y, z) => {
    if (y > sleeveEnd) {
      if (stripes && Math.floor(((-y) / L) * 8) % 2 === 1) return stripes;
      if (plaid) {
        const v = Math.abs((((-y) / 0.06) % 1 + 1) % 1 - 0.5) < 0.17;
        const a = Math.atan2(x, z);
        const h = Math.abs(((a / (TAU / 10)) % 1 + 1) % 1 - 0.5) < 0.17;
        if (v || h) return mix(cloth, plaid, 0.55);
      }
      return cloth;
    }
    if (y > sleeveEnd - 0.022 && app.arms.cuff) return app.arms.cuff;
    return app.skin;
  });
  const parts = [g];
  const hand = ell(DIM.handR, DIM.handR * 0.98, DIM.handR, 14, 10);
  xf(hand, { p: [0, -L - 0.024, 0.004] });
  const glove = app.arms.glove || app.skin;
  paint(hand, glove, (x, y, z) => (app.arms.ink && y < -L - 0.045 ? app.arms.ink : undefined));
  parts.push(hand);
  const thumb = ell(0.022, 0.03, 0.022, 8, 6);
  xf(thumb, { p: [0.026 * side * -1, -L - 0.012, 0.03], r: [0.2, 0, 0.35 * side] });
  paint(thumb, glove);
  parts.push(thumb);
  return merge(parts);
}

/** Skull: ellipsoid (jaw-shaped), ears, nose; skin coloured. Returns {geo, rx, ry, rz}. */
export function buildSkull(app) {
  const h = DIM.head;
  const hw = app.head.w, hh = app.head.h, jaw = app.head.jaw;
  const rx = h.rx * hw, ry = h.ry * hh, rz = h.rz * (app.kind === 'kid' ? 1.02 : 1);
  const g = ell(1, 1, 1, 40, 28);
  const pos = g.attributes.position, nor = g.attributes.normal;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    // jaw taper below the equator: pull cheeks/chin in (jaw < 1) or push out (jaw > 1)
    const t = Math.max(0, -y);
    const k = 1 + (jaw - 1) * Math.pow(t, 1.2) * 1.6;
    x *= k; z *= k;
    pos.setXYZ(i, x * rx, y * ry, z * rz);
    // analytic ellipsoid normal (no seam artefacts); the jaw taper tilts it slightly downward
    const ux = nor.getX(i), uy = nor.getY(i), uz = nor.getZ(i);
    const nx = ux / rx, ny = uy / ry + (t > 0 ? (1 - jaw) * t * 0.5 : 0), nz = uz / rz;
    const l = Math.hypot(nx, ny, nz) || 1;
    nor.setXYZ(i, nx / l, ny / l, nz / l);
  }
  paint(g, app.skin);
  const parts = [g];
  // ears (side bumps, partly buried)
  const ear = ell(0.05, 0.062, 0.035, 12, 8);
  for (const s of [-1, 1]) {
    const e = ear.clone();
    xf(e, { p: [s * (rx * 0.97), -0.01 * ry / 0.31, -0.02], r: [0, s * 0.25, s * 0.1] });
    paint(e, app.skin);
    parts.push(e);
  }
  if (app.nose) {
    const n = ell(app.nose.r || 0.04, app.nose.r * 0.9 || 0.036, app.nose.r || 0.04, 10, 8);
    xf(n, { p: [0, -ry * 0.28, rz * 0.96] });
    paint(n, mix(app.skin, app.cheek, 0.35));
    parts.push(n);
  }
  return { geo: merge(parts), rx, ry, rz };
}
