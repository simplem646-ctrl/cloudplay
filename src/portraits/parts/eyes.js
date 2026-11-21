// Large glossy late-90s anime eyes, drawn in a mirrored local frame:
// origin = eye centre, +x = inner corner (toward the nose), -x = outer corner.
import { mix, ink, tint, rgba, spindle } from '../util.js';
import { starPath } from './hair.js';

const LASH = '#2a1614';

function bez(a, b, c, d, t) {
  const u = 1 - t;
  return [
    u * u * u * a[0] + 3 * u * u * t * b[0] + 3 * u * t * t * c[0] + t * t * t * d[0],
    u * u * u * a[1] + 3 * u * u * t * b[1] + 3 * u * t * t * c[1] + t * t * t * d[1],
  ];
}

/** Split a cubic at t, returning the first half's control points. */
function splitFirst(a, b, c, d, t) {
  const l = (p, q) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t];
  const ab = l(a, b), bc = l(b, c), cd = l(c, d), abc = l(ab, bc), bcd = l(bc, cd), m = l(abc, bcd);
  return [a, ab, abc, m];
}

export function drawEyes(ctx, G, spec, E) {
  const es = spec.eyes;
  const ex = E.eye;
  for (const side of [-1, 1]) {
    ctx.save();
    ctx.translate(G.cx + side * G.eyeDX, G.EY);
    ctx.scale(-side, 1);
    if (ex.type === 'happy' || ex.type === 'laugh') closedEye(ctx, es, ex.type);
    else openEye(ctx, es, ex, side);
    ctx.restore();
  }
}

function closedEye(ctx, es, type) {
  const w = es.w, h = es.h;
  const lw = Math.max(2.6, 4 * es.lash);
  ctx.strokeStyle = LASH; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.fillStyle = LASH;
  const p = new Path2D();
  if (type === 'laugh') {
    // tight squeezed arc
    spindle(p, [-w * 0.95, h * 0.2], [w * 0.85, h * 0.18], lw * 0.9, -h * 0.6);
  } else {
    spindle(p, [-w * 0.95, h * 0.28], [w * 0.85, h * 0.22], lw * 0.85, -h * 0.75);
  }
  ctx.fill(p);
  // small outer lash flick
  if (es.lash > 0.8) {
    const f = new Path2D();
    spindle(f, [-w * 0.8, h * 0.05], [-w * 1.15, -h * 0.12], 1.8, 0);
    ctx.fill(f);
  }
}

function openEye(ctx, es, ex, side) {
  const w = es.w, h = es.h;
  const open = ex.open ?? 1;
  const droop = ex.droop || 0, innerDrop = ex.innerDrop || 0, lowerUp = ex.lowerUp || 0;
  const tilt = es.tilt || 0;
  const top = -h * open;
  const O = [-w, -h * 0.08 + tilt * 1.4 + droop * h * 0.28];
  const I = [w * 0.9, -h * 0.22 + innerDrop * h * 0.32 - tilt * 0.4];
  const c1 = [-w * 0.72, top * 1.28 + droop * h * 0.5 + tilt * 0.6];
  const c2 = [w * 0.42, top * 1.2 + innerDrop * h * 0.95];
  const bottom = h * (0.84 - lowerUp);
  const c3 = [w * 0.72, bottom * 0.98];
  const c4 = [-w * 0.6, bottom * 1.12];

  const sclera = new Path2D();
  sclera.moveTo(O[0], O[1]);
  sclera.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], I[0], I[1]);
  sclera.bezierCurveTo(c3[0], c3[1], c4[0], c4[1], O[0], O[1]);
  sclera.closePath();

  const col = es.color;
  const lx = (ex.lookX || 0) * -side; // to local
  const ly = ex.lookY || 0;
  const is = (ex.iris || 1) * (es.iris || 1);
  const irx = w * 0.6 * is, iry = h * 0.86 * is;
  const ix = lx * w * 0.32, iy = h * 0.1 + ly * h * 0.2;
  const W = (v) => v * -side; // world-x offset -> local

  ctx.save();
  ctx.clip(sclera);
  ctx.fillStyle = '#fffdfb';
  ctx.fill(sclera);
  // lid shadow on the white
  ctx.strokeStyle = '#cfc8e2';
  ctx.lineWidth = h * 0.5;
  ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], I[0], I[1]); ctx.stroke();

  // iris
  const iris = new Path2D();
  iris.ellipse(ix, iy, irx, iry, 0, 0, Math.PI * 2);
  const g = ctx.createLinearGradient(0, iy - iry, 0, iy + iry);
  g.addColorStop(0, ink(col, 0.55));
  g.addColorStop(0.42, col);
  g.addColorStop(1, tint(mix(col, '#ffe9a8', 0.15), 0.42));
  ctx.fillStyle = g;
  ctx.fill(iris);
  ctx.save();
  ctx.clip(iris);
  // lower light crescent
  ctx.fillStyle = rgba(tint(col, 0.6), 0.75);
  ctx.beginPath(); ctx.ellipse(ix, iy + iry * 0.62, irx * 0.78, iry * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(col, 1);
  ctx.beginPath(); ctx.ellipse(ix, iy + iry * 0.32, irx * 0.72, iry * 0.42, 0, 0, Math.PI * 2); ctx.fill();
  // pupil
  const ps = ex.pupil || 1;
  ctx.fillStyle = ink(col, 0.82);
  ctx.beginPath(); ctx.ellipse(ix, iy - iry * 0.04, irx * 0.46 * ps, iry * 0.5 * ps, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = ink(col, 0.7);
  ctx.lineWidth = 1.6;
  ctx.stroke(iris);
  // upper lid shadow over the iris
  ctx.strokeStyle = rgba(ink(col, 0.8), 0.42);
  ctx.lineWidth = h * 0.46;
  ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], I[0], I[1]); ctx.stroke();

  // highlights (fixed world-space light from upper-left)
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.ellipse(ix + W(-irx * 0.34), iy - iry * 0.36, irx * 0.36, iry * 0.27, W(-0.5), 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(ix + W(irx * 0.42), iy + iry * 0.36, irx * 0.15, 0, Math.PI * 2); ctx.fill();
  if (es.stars) {
    const sp = new Path2D(); starPath(sp, ix + W(irx * 0.1), iy + iry * 0.52, irx * 0.2, irx * 0.07, 0, 4); ctx.fill(sp);
    ctx.beginPath(); ctx.arc(ix + W(irx * 0.5), iy - iry * 0.05, 1.6, 0, Math.PI * 2); ctx.fill();
  } else {
    ctx.beginPath(); ctx.arc(ix + W(-irx * 0.05), iy + iry * 0.55, irx * 0.08, 0, Math.PI * 2); ctx.fill();
  }
  if (ex.watery) {
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-w * 0.55, bottom - 5); ctx.quadraticCurveTo(0, bottom + 1, w * 0.55, bottom - 5); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath(); ctx.arc(ix + W(irx * 0.05), iy - iry * 0.05, irx * 0.1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();

  // upper lash line: base stroke + heavier outer half + wing
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = LASH;
  const lash = es.lash;
  ctx.lineWidth = 2.6 + 1.4 * lash;
  ctx.beginPath(); ctx.moveTo(O[0], O[1]); ctx.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], I[0], I[1]); ctx.stroke();
  if (lash > 0.7) {
    const s = splitFirst(O, c1, c2, I, 0.55);
    ctx.lineWidth = 3 + 3.4 * lash;
    ctx.beginPath(); ctx.moveTo(s[0][0], s[0][1] + 1); ctx.bezierCurveTo(s[1][0], s[1][1] + 1, s[2][0], s[2][1] + 0.5, s[3][0], s[3][1]); ctx.stroke();
  }
  ctx.fillStyle = LASH;
  const wing = es.wing || 0;
  if (wing > 0) {
    const f = new Path2D();
    f.moveTo(O[0] + 8, O[1] - 3);
    f.quadraticCurveTo(O[0] - 4 - 4 * wing, O[1] - 2 - 2 * wing, O[0] - 6 - 9 * wing, O[1] - 7 - 6 * wing);
    f.quadraticCurveTo(O[0] - 2, O[1] + 5, O[0] + 6, O[1] + 3);
    f.closePath();
    ctx.fill(f);
    if (lash > 0.8) {
      const f2 = new Path2D();
      const m = bez(O, c1, c2, I, 0.12);
      spindle(f2, [m[0] + 2, m[1] + 1], [m[0] - 7 - 3 * wing, m[1] - 9 - 2 * wing], 1.6, 0);
      ctx.fill(f2);
    }
  }
  // inner corner
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(I[0], I[1]); ctx.quadraticCurveTo(I[0] + 3, I[1] + 4, I[0] - 1, I[1] + 8); ctx.stroke();
  // lid crease (double eyelid)
  if (!es.male) {
    ctx.strokeStyle = rgba(LASH, 0.55); ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(-w * 0.75, c1[1] * 0.62 + 2 - 6); ctx.quadraticCurveTo(-w * 0.1, top * 1.08 - 8, w * 0.45, top * 0.86 - 6); ctx.stroke();
  }
  // lower lash: thin partial line + outer tick
  ctx.strokeStyle = rgba(LASH, 0.85);
  ctx.lineWidth = 1.3 + 0.5 * lash;
  const lo = splitFirst(O, c4, c3, I, 0.62);
  ctx.beginPath(); ctx.moveTo(lo[0][0] + 3, lo[0][1] + 5); ctx.bezierCurveTo(lo[1][0], lo[1][1], lo[2][0], lo[2][1], lo[3][0], lo[3][1]); ctx.stroke();
  if (lash > 0.8 && !es.elder) {
    const t = new Path2D();
    const m = bez(O, c4, c3, I, 0.2);
    spindle(t, [m[0], m[1]], [m[0] - 5, m[1] + 6], 1.1, 0);
    ctx.fill(t);
  }
}
