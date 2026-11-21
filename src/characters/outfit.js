/** Clothing layers and head gear. Each builder pushes painted geometry into the build context:
 *  ctx = { app, H (skull dims), torso:[], head:[], armL:[], armR:[], legs:[], sway:{ 'torso:id'|'head:id': {parent,pivot,geos[]} } } */
import { ell, tube, lathe, torus, rbox, paint, xf, merge, patch, headPoint, lookup, mix, darker, lighter, star, hash01, DEG, TAU } from './kit.js';
import { bodyShell, torsoR, torsoDepth, torsoPoint } from './body.js';
import { headRing } from './hair.js';

const D = DEG;
const sm = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
const front = (ctx, y, off = 0) => torsoR(ctx.app.build, y) * torsoDepth(ctx.app.build) + off;

function addSway(ctx, parent, id, pivot, geo) {
  const key = `${parent}:${id}`;
  (ctx.sway[key] ||= { parent, id, pivot, geos: [] }).geos.push(geo);
}
const full = () => [-Math.PI, Math.PI];

export const LAYERS = {
  skirt(ctx, o) {
    const top = o.y ?? 0.0, len = o.len ?? 0.18;
    const g = bodyShell(ctx.app.build, { y0: top - len, y1: top + 0.03, off: 0.017, flare: (o.flare ?? 0.07) / len, flareStart: top, rows: 7, cols: 36 });
    paint(g, o.color, (x, y) => (y < top - len + 0.022 ? (o.trim || darker(o.color, 0.18)) : undefined));
    ctx.torso.push(g);
  },
  apron(ctx, o) {
    const b = ctx.app.build;
    const top = o.waist ? 0.045 : (o.bibTop ?? 0.2);
    const arc = (o.arc ?? 60) * D;
    const bottom = o.bottom ?? -0.15;
    const flareStart = -0.02, slope = 0.5;
    const g = bodyShell(b, {
      y0: bottom, y1: top, off: 0.022, flare: slope, flareStart, rows: 12, cols: 24,
      range: (y) => {
        const t = o.waist ? 1 : sm(0.05, top, y);
        const h = arc * (1 - 0.35 * t) * (y < flareStart ? 1 + (flareStart - y) * 1.4 : 1);
        return [-h, h];
      },
    });
    paint(g, o.color, (x, y, z) => {
      if (o.trim && y > top - 0.018 && y > 0.1) return o.trim;
      if (o.flour && hash01(Math.floor(x * 40) * 7 + Math.floor(y * 40) * 13) > 0.8 && z > 0) return '#ffffff';
      if (y < bottom + 0.02) return darker(o.color, 0.12);
      return undefined;
    });
    ctx.torso.push(g);
    // waist tie band
    const band = bodyShell(b, { y0: 0.025, y1: 0.06, off: 0.026, rows: 2, cols: 32 });
    paint(band, darker(o.color, 0.18));
    ctx.torso.push(band);
    if (!o.waist) {
      // bib straps
      for (const s of [-1, 1]) {
        const pts = [torsoPoint(b, s * 18 * D, top, 0.022), torsoPoint(b, s * 52 * D, 0.268, 0.018), torsoPoint(b, s * 120 * D, 0.18, 0.016)];
        ctx.torso.push(paint(tube(pts, [0.016, 0.016, 0.016], { radial: 6, seg: 8 }), darker(o.color, 0.1)));
      }
    }
  },
  jacket(ctx, o) {
    const b = ctx.app.build;
    const y0 = o.y0 ?? -0.02;
    const gap = (o.gap ?? 24) * D;
    const flareSlope = (o.flare ?? 0.0) / 0.1;
    const g = bodyShell(b, {
      y0, y1: 0.268, off: 0.022 + (o.puff ? 0.016 : 0), flare: flareSlope, flareStart: -0.03, rows: 12, cols: 40,
      range: (y) => {
        const t = sm(y0, 0.268, y);
        const gp = gap * (0.7 + 0.9 * t);
        return [gp, TAU - gp];
      },
    });
    paint(g, o.color, (x, y) => (y < y0 + 0.022 ? darker(o.color, 0.16) : undefined));
    ctx.torso.push(g);
    if (o.collar) {
      const c = bodyShell(b, { y0: 0.238, y1: 0.292, off: 0.036, rows: 3, cols: 28, range: () => [24 * D, TAU - 24 * D] });
      ctx.torso.push(paint(c, lighter(o.color, 0.12)));
    }
  },
  vest(ctx, o) {
    const b = ctx.app.build;
    const gap = 34 * D;
    const g = bodyShell(b, { y0: -0.0, y1: 0.225, off: 0.014, rows: 8, cols: 36, range: (y) => { const t = sm(0, 0.225, y); const gp = gap * (0.7 + 0.9 * t); return [gp, TAU - gp]; } });
    ctx.torso.push(paint(g, o.color));
  },
  coat(ctx, o) {
    const b = ctx.app.build;
    const bottom = o.bottom ?? -0.13;
    const g = bodyShell(b, {
      y0: bottom, y1: 0.268, off: 0.03 + (o.puff ? 0.018 : 0), flare: 0.5, flareStart: -0.03, rows: 14, cols: 40,
      range: (y) => { const t = sm(bottom, 0.268, y); const gp = (10 + 12 * t) * D; return [gp, TAU - gp]; },
    });
    const ps = o.patches || [];
    paint(g, o.color, (x, y, z) => {
      if (y < bottom + 0.022) return darker(o.color, 0.2);
      if (ps.length) {
        const a = Math.atan2(x, z);
        const ca = Math.floor((a + Math.PI) / (TAU / 9)), cy = Math.floor((y + 0.2) / 0.07);
        const h = hash01(ca * 31 + cy * 17 + 3);
        if (h > 0.72) return ps[Math.floor(h * 100) % ps.length];
      }
      return undefined;
    });
    ctx.torso.push(g);
    const c = bodyShell(b, { y0: 0.238, y1: 0.292, off: 0.04, rows: 3, cols: 28, range: () => [20 * D, TAU - 20 * D] });
    ctx.torso.push(paint(c, lighter(o.color, 0.1)));
  },
  scarf(ctx, o) {
    const b = ctx.app.build;
    const ring = bodyShell(b, { y0: 0.225, y1: 0.285, off: 0.04, rows: 4, cols: 28, bulge: (y) => 0.012 * Math.sin(((y - 0.225) / 0.06) * Math.PI) });
    ctx.torso.push(paint(ring, o.color, (x, y) => (o.stripe && Math.floor((y - 0.225) / 0.02) % 2 ? o.stripe : undefined)));
    // knot + hanging end on the front-side
    const s = o.tail === 'left' ? 1 : -1;
    const knot = ell(0.05, 0.045, 0.045, 10, 8);
    xf(knot, { p: [s * 0.075, 0.24, front(ctx, 0.24, 0.04)] });
    ctx.torso.push(paint(knot, darker(o.color, 0.1)));
    if (o.tail) {
      const pts = [[s * 0.09, 0.235, -0.1], [s * 0.1, 0.17, -0.19], [s * 0.1, 0.07, -0.21], [s * 0.09, -0.02, -0.17]];
      const t = tube(pts, [0.038, 0.04, 0.036, 0.03], { radial: 8, seg: 10 });
      addSway(ctx, 'torso', 'scarf', [s * 0.09, 0.235, -0.1], paint(t, o.color, (x, y) => (y < 0.01 ? darker(o.color, 0.18) : undefined)));
    } else {
      const t = tube([[s * 0.075, 0.225, front(ctx, 0.225, 0.04)], [s * 0.085, 0.14, front(ctx, 0.14, 0.05)], [s * 0.08, 0.06, front(ctx, 0.06, 0.05)]], [0.034, 0.036, 0.028], { radial: 7, seg: 8 });
      ctx.torso.push(paint(t, o.color));
    }
  },
  belt(ctx, o) {
    const g = bodyShell(ctx.app.build, { y0: o.y, y1: o.y + (o.h ?? 0.03), off: 0.02, rows: 2, cols: 32 });
    ctx.torso.push(paint(g, o.color));
    if (o.buckle) {
      const bk = rbox(0.05, 0.04, 0.016, 0.008, 2);
      xf(bk, { p: [0, o.y + (o.h ?? 0.03) / 2, front(ctx, o.y, 0.026)] });
      ctx.torso.push(paint(bk, o.buckle));
    }
  },
  buttons(ctx, o) {
    const n = o.n ?? 3;
    for (let i = 0; i < n; i++) {
      const y = 0.16 - i * 0.06;
      const b = ell(0.017, 0.017, 0.012, 8, 6);
      xf(b, { p: [0.0, y, front(ctx, y, 0.012)] });
      ctx.torso.push(paint(b, o.color));
    }
  },
  suspenders(ctx, o) {
    const b = ctx.app.build;
    for (const s of [-1, 1]) {
      const pts = [torsoPoint(b, s * 0.5, 0.0, 0.018), torsoPoint(b, s * 0.42, 0.13, 0.02), torsoPoint(b, s * 0.55, 0.25, 0.022), torsoPoint(b, s * 1.5, 0.22, 0.018)];
      ctx.torso.push(paint(tube(pts, [0.017, 0.017, 0.017, 0.017], { radial: 6, seg: 10 }), o.color));
    }
  },
  bib(ctx, o) {
    const b = ctx.app.build;
    const top = o.top ?? 0.18;
    const g = bodyShell(b, { y0: -0.01, y1: top, off: 0.02, rows: 8, cols: 20, range: (y) => { const t = sm(0, top, y); const h = (58 - 22 * t) * D; return [-h, h]; } });
    paint(g, o.color, (x, y, z) => (y > top - 0.016 ? darker(o.color, 0.12) : undefined));
    ctx.torso.push(g);
    const waist = bodyShell(b, { y0: -0.05, y1: 0.0, off: 0.02, rows: 2, cols: 32 });
    ctx.torso.push(paint(waist, o.color));
    if (o.straps) {
      for (const s of [-1, 1]) {
        const pts = [torsoPoint(b, s * 32 * D, top, 0.02), torsoPoint(b, s * 62 * D, 0.268, 0.018), torsoPoint(b, s * 130 * D, 0.16, 0.016)];
        ctx.torso.push(paint(tube(pts, [0.017, 0.017, 0.017], { radial: 6, seg: 8 }), o.color));
        const bt = ell(0.018, 0.018, 0.012, 8, 6);
        xf(bt, { p: torsoPoint(b, s * 34 * D, top - 0.0, 0.034) });
        ctx.torso.push(paint(bt, '#e6b84a'));
      }
    }
    const pk = rbox(0.07, 0.05, 0.012, 0.006, 2);
    xf(pk, { p: [0, top * 0.5, front(ctx, top * 0.5, 0.026)] });
    ctx.torso.push(paint(pk, darker(o.color, 0.12)));
  },
  toolbelt(ctx, o) {
    const g = bodyShell(ctx.app.build, { y0: -0.035, y1: 0.01, off: 0.026, rows: 2, cols: 32 });
    ctx.torso.push(paint(g, o.color));
    for (const [x, y, z, r] of [[0.15, -0.045, 0.05, 0.04], [-0.12, -0.05, 0.1, 0.036], [0.0, -0.05, 0.14, 0.03]]) {
      const p = ell(r, r * 1.25, r * 0.85, 10, 8);
      xf(p, { p: [x, y, z] });
      ctx.torso.push(paint(p, darker(o.color, 0.1)));
    }
    const hh = tube([[-0.18, -0.02, 0.0], [-0.2, -0.1, 0.02], [-0.21, -0.17, 0.03]], [0.011, 0.011, 0.011], { radial: 6, seg: 4 });
    ctx.torso.push(paint(hh, '#b08a58'));
    const hd = rbox(0.06, 0.03, 0.022, 0.008, 2);
    xf(hd, { p: [-0.18, -0.025, 0.0], r: [0, 0, 0.1] });
    ctx.torso.push(paint(hd, '#9aa0a8'));
  },
  tie(ctx, o) {
    const pts = [[0, 0.24, front(ctx, 0.24, 0.016)], [0, 0.17, front(ctx, 0.17, 0.016)], [0, 0.08, front(ctx, 0.08, 0.016)]];
    ctx.torso.push(paint(tube(pts, [0.02, 0.026, 0.016], { radial: 7, seg: 6 }), o.color));
    const k = ell(0.026, 0.022, 0.022, 8, 6);
    xf(k, { p: [0, 0.248, front(ctx, 0.248, 0.02)] });
    ctx.torso.push(paint(k, darker(o.color, 0.1)));
  },
  bowtie(ctx, o) {
    const z = front(ctx, 0.245, 0.03);
    for (const s of [-1, 1]) {
      const w = ell(0.04, 0.026, 0.018, 10, 8);
      xf(w, { p: [s * 0.045, 0.248, z], r: [0, 0, s * -0.3] });
      ctx.torso.push(paint(w, o.color));
    }
    const k = ell(0.02, 0.02, 0.02, 8, 6);
    xf(k, { p: [0, 0.248, z + 0.005] });
    ctx.torso.push(paint(k, darker(o.color, 0.15)));
  },
  chain(ctx, o) {
    const b = ctx.app.build;
    const pts = [];
    for (let i = 0; i <= 6; i++) {
      const a = (-0.62 + (1.24 * i) / 6);
      const y = 0.13 - 0.05 * (1 - (a / 0.62) ** 2);
      pts.push(torsoPoint(b, a, y, 0.03));
    }
    ctx.torso.push(paint(tube(pts, [0.008, 0.008, 0.008, 0.008, 0.008, 0.008, 0.008], { radial: 5, seg: 14 }), o.color));
    const w = ell(0.02, 0.02, 0.008, 8, 6);
    xf(w, { p: [0, 0.075, front(ctx, 0.08, 0.034)] });
    ctx.torso.push(paint(w, o.color));
  },
  sack(ctx, o) {
    const g = ell(0.05, 0.062, 0.046, 12, 10);
    xf(g, { p: [0.2, -0.03, 0.045] });
    ctx.torso.push(paint(g, o.color));
    const t = tube([[0.2, 0.02, 0.045], [0.2, 0.045, 0.045]], [0.022, 0.012], { radial: 6, seg: 3 });
    ctx.torso.push(paint(t, darker(o.color, 0.2)));
  },
  satchel(ctx, o) {
    const b = ctx.app.build;
    const pts = [torsoPoint(b, -60 * D, 0.27, 0.02), torsoPoint(b, -25 * D, 0.18, 0.022), torsoPoint(b, 15 * D, 0.09, 0.022), torsoPoint(b, 62 * D, 0.0, 0.022)];
    ctx.torso.push(paint(tube(pts, [0.017, 0.017, 0.017, 0.017], { radial: 6, seg: 10 }), o.strap || o.color));
    const bag = rbox(0.1, 0.11, 0.07, 0.02, 3);
    xf(bag, { p: [0.205, -0.04, 0.02] });
    ctx.torso.push(paint(bag, o.color, (x, y) => (y > -0.02 ? lighter(o.color, 0.12) : undefined)));
    const bl = ell(0.014, 0.014, 0.01, 6, 5);
    xf(bl, { p: [0.205, -0.03, 0.058] });
    ctx.torso.push(paint(bl, '#e6b84a'));
  },
  backpack(ctx, o) {
    const big = rbox(0.36, 0.4, 0.17, 0.05, 3);
    xf(big, { p: [0, 0.1, -0.23] });
    ctx.torso.push(paint(big, o.color, (x, y) => (y > 0.18 ? lighter(o.color, 0.08) : undefined)));
    const roll = tube([[-0.16, 0.34, -0.23], [0.16, 0.34, -0.23]], [0.062, 0.062], { radial: 10, seg: 4 });
    ctx.torso.push(paint(roll, o.roll || '#a8a070'));
    for (const s of [-1, 1]) {
      const pk = rbox(0.09, 0.14, 0.09, 0.03, 2);
      xf(pk, { p: [s * 0.21, 0.01, -0.2] });
      ctx.torso.push(paint(pk, darker(o.color, 0.1)));
      const st = tube([[s * 0.1, 0.26, -0.17], [s * 0.11, 0.282, 0.0], [s * 0.095, 0.2, front(ctx, 0.2, 0.014)], [s * 0.09, 0.08, front(ctx, 0.08, 0.014)]], [0.015, 0.015, 0.015, 0.015], { radial: 6, seg: 10 });
      ctx.torso.push(paint(st, darker(o.color, 0.25)));
    }
    const pot = ell(0.05, 0.05, 0.05, 8, 6);
    xf(pot, { p: [0.0, -0.05, -0.33] });
    ctx.torso.push(paint(pot, '#b8862e'));
  },
  poncho(ctx, o) {
    const b = ctx.app.build;
    const ps = o.patches || [];
    const g = bodyShell(b, { y0: 0.0, y1: 0.285, off: (y) => 0.024 + 0.075 * Math.pow(Math.max(0, (0.15 - y) / 0.15), 1.2), rows: 12, cols: 40 });
    paint(g, o.color, (x, y, z) => {
      if (y < 0.022) return darker(o.color, 0.25);
      const a = Math.atan2(x, z);
      const ca = Math.floor((a + Math.PI) / (TAU / 10)), cy = Math.floor(y / 0.065);
      const h = hash01(ca * 19 + cy * 23 + 5);
      if (h > 0.55) return ps[Math.floor(h * 997) % ps.length];
      if (y > 0.26) return darker(o.color, 0.2);
      return undefined;
    });
    ctx.torso.push(g);
  },
  cape(ctx, o) {
    const b = ctx.app.build;
    const yoke = bodyShell(b, { y0: 0.15, y1: 0.285, off: 0.03, rows: 6, cols: 32, range: () => [-Math.PI, Math.PI] });
    ctx.torso.push(paint(yoke, o.color, (x, y) => (y > 0.268 ? o.trim || lighter(o.color, 0.2) : undefined)));
    if (o.hood) {
      const hood = ell(0.14, 0.1, 0.1, 14, 10);
      xf(hood, { p: [0, 0.27, -0.12], r: [0.3, 0, 0] });
      ctx.torso.push(paint(hood, darker(o.color, 0.06)));
    }
    const sk = bodyShell(b, {
      y0: -0.1, y1: 0.19, off: 0.026, flare: 1.0, flareStart: 0.0, rows: 8, cols: 30,
      range: () => [70 * D, TAU - 70 * D],
    });
    addSway(ctx, 'torso', 'cape', [0, 0.2, -0.1], paint(sk, o.color, (x, y) => (y < -0.08 ? o.trim || lighter(o.color, 0.2) : undefined)));
  },
  shawl(ctx, o) {
    const b = ctx.app.build;
    const g = bodyShell(b, {
      y0: 0.07, y1: 0.272, off: 0.03, rows: 10, cols: 48, flare: 0.2, flareStart: 0.15,
      range: (y) => { const t = sm(0.07, 0.272, y); const gp = (16 + 28 * t) * D; return [gp, TAU - gp]; },
    });
    paint(g, o.color, (x, y, z, nx, ny, nz, i) => {
      if (y < 0.085) return o.plain ? lighter(o.color, 0.25) : darker(o.color, 0.3);
      if (o.dots && hash01(i * 1.7 + 3) > 0.9) return o.dots;
      return undefined;
    });
    ctx.torso.push(g);
  },
  charm(ctx, o) {
    const b = ctx.app.build;
    const pts = [];
    for (let i = 0; i <= 6; i++) { const a = -0.9 + (1.8 * i) / 6; pts.push(torsoPoint(b, a, 0.235 - 0.05 * (1 - (a / 0.9) ** 2), 0.03)); }
    ctx.torso.push(paint(tube(pts, [0.006, 0.006, 0.006, 0.006, 0.006, 0.006, 0.006], { radial: 5, seg: 14 }), o.color));
    const k = ell(0.016, 0.026, 0.008, 8, 6);
    xf(k, { p: [0, 0.172, front(ctx, 0.18, 0.034)] });
    ctx.torso.push(paint(k, o.color));
  },
  spyglass(ctx, o) {
    const t = tube([[0.2, -0.0, 0.0], [0.2, -0.08, 0.1], [0.19, -0.14, 0.2]], [0.028, 0.026, 0.034], { radial: 8, seg: 6 });
    ctx.torso.push(paint(t, o.color, (x, y, z) => (z > 0.17 ? '#d8b86a' : undefined)));
    const lens = ell(0.02, 0.02, 0.01, 8, 6);
    xf(lens, { p: [0.19, -0.145, 0.236] });
    ctx.torso.push(paint(lens, '#bfe6f0'));
  },
  basketarm(ctx, o) {
    const bowl = lathe([[0.0, -0.05], [0.05, -0.045], [0.085, 0.0], [0.095, 0.045], [0.085, 0.048], [0.075, 0.02], [0.04, -0.025]], 14);
    paint(bowl, o.color, (x, y) => (Math.floor((y + 0.05) / 0.018) % 2 ? darker(o.color, 0.18) : undefined));
    xf(bowl, { p: [0.0, -0.2, 0.06] });
    const handle = tube([[-0.085, -0.17, 0.06], [0.0, -0.08, 0.06], [0.085, -0.17, 0.06]], [0.012, 0.012, 0.012], { radial: 6, seg: 10 });
    paint(handle, darker(o.color, 0.1));
    ctx.armL.push(bowl, handle);
  },
};

// ---------------------------------------------------------------- head gear (head-local frame)
export const HEADGEAR = {
  hoops(ctx, o) {
    const H = ctx.H;
    for (const s of [-1, 1]) {
      const t = torus(0.04, 0.007, 14, 6);
      xf(t, { p: [s * (H.rx + 0.012), -0.07, 0.0], r: [0, Math.PI / 2, 0] });
      ctx.head.push(paint(t, o.color));
    }
  },
  goggles(ctx, o) {
    const H = ctx.H;
    ctx.head.push(headRing(H, 50, 66, 0.052, 0.022, o.strap));
    for (const s of [-1, 1]) {
      const a = s * 24 * D, th = 40 * D;
      const p = headPoint(H.rx, H.ry, H.rz, a, th, 0.075);
      const rot = [th - Math.PI / 2, a, 0];
      const rim = torus(0.074, 0.016, 16, 8);
      xf(rim, { p, r: rot, order: 'YXZ' });
      ctx.head.push(paint(rim, o.rim));
      const lens = ell(0.07, 0.07, 0.022, 14, 8);
      xf(lens, { p, r: rot, order: 'YXZ' });
      ctx.head.push(paint(lens, o.lens, (x, y, z, nx, ny, nz) => (nz > 0.85 && nx < 0 ? lighter(o.lens, 0.55) : undefined)));
    }
  },
  widehat(ctx, o) {
    const prof = [[0.335, 0.1], [0.4, 0.092], [0.44, 0.1], [0.45, 0.116], [0.4, 0.112], [0.345, 0.128], [0.34, 0.2], [0.3, 0.3], [0.2, 0.36], [0.0, 0.385]];
    const g = lathe(prof, 36);
    xf(g, { r: [-0.08, 0, 0] });
    paint(g, o.color, (x, y) => (y > 0.13 && y < 0.2 && Math.hypot(x, 0.0) < 0.36 ? o.band : undefined));
    ctx.head.push(g);
  },
  strawhat(ctx, o) {
    const prof = [[0.34, 0.085], [0.41, 0.075], [0.46, 0.085], [0.47, 0.105], [0.42, 0.103], [0.43, 0.12], [0.43, 0.2], [0.38, 0.3], [0.22, 0.36], [0.0, 0.375]];
    const g = lathe(prof, 36);
    xf(g, { r: [-0.06, 0, 0] });
    paint(g, o.color, (x, y, z, nx, ny) => {
      if (y > 0.115 && y < 0.17 && Math.abs(ny) < 0.5) return o.band;
      return hash01(Math.floor(Math.atan2(x, z) * 9) + Math.floor(y * 30)) > 0.85 ? darker(o.color, 0.1) : undefined;
    });
    ctx.head.push(g);
    const fl = o.flowers || [];
    for (let i = 0; i < 7; i++) {
      const a = 0.4 + i * 0.5 - 0.3;
      const r = 0.352;
      const f = ell(0.044, 0.044, 0.034, 8, 6);
      xf(f, { p: [Math.sin(a) * r, 0.145 + (i % 2) * 0.03, Math.cos(a) * r] });
      ctx.head.push(paint(f, fl[i % fl.length]));
      const c = ell(0.016, 0.016, 0.016, 6, 5);
      xf(c, { p: [Math.sin(a) * (r + 0.02), 0.145 + (i % 2) * 0.03, Math.cos(a) * (r + 0.02)] });
      ctx.head.push(paint(c, '#ffd23f'));
    }
  },
  beanie(ctx, o) {
    const H = ctx.H;
    const dome = patch(H.rx, H.ry, H.rz, { rows: 9, cols: 36, hi: (a) => (66 + 20 * Math.min(1, Math.abs(a) / (Math.PI / 2))) * D, off: () => 0.085 });
    paint(dome, o.color, (x, y, z, nx, ny, nz) => (ny * 0.55 + nz * 0.83 > 0.82 && ny * 0.55 + nz * 0.83 < 0.92 ? lighter(o.color, 0.22) : undefined));
    const band = patch(H.rx, H.ry, H.rz, { rows: 3, cols: 36, lo: (a) => (56 + 20 * Math.min(1, Math.abs(a) / (Math.PI / 2))) * D, hi: (a) => (68 + 20 * Math.min(1, Math.abs(a) / (Math.PI / 2))) * D, off: () => 0.1 });
    paint(band, o.band || lighter(o.color, 0.18));
    const pom = ell(0.07, 0.07, 0.07, 10, 8);
    xf(pom, { p: [0, H.ry + 0.1, 0] });
    ctx.head.push(dome, band, paint(pom, o.band || lighter(o.color, 0.3)));
  },
};
