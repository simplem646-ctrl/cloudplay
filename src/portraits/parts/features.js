// Brows and mouths.
import { lock, spindle, smoothOpen, smoothClosed, inked, P, ink, mix, rgba, tint } from '../util.js';
import { skinColors } from './face.js';

// ---------------------------------------------------------------- brows

export function drawBrows(ctx, G, spec, E) {
  const es = spec.eyes;
  const bushy = spec.brow?.bushy;
  const col = spec.brow?.color || ink(spec.hair.shade, 0.45);
  for (const side of [-1, 1]) {
    const b = (side < 0 ? E.browL : E.browR) || E.brow;
    ctx.save();
    ctx.translate(G.cx + side * G.eyeDX, G.EY);
    ctx.scale(-side, 1);
    const w = es.w;
    const base = -es.h - (bushy ? 12 : 17) - (b.raise || 0);
    const len = w * (bushy ? 2.1 : 1.85);
    const ang = ((b.angle || 0) * Math.PI) / 180;
    const inner = [w * 0.78, base - Math.sin(ang) * len * 0.5 + (es.tilt || 0) * 0.3];
    const outer = [inner[0] - Math.cos(ang) * len, base + Math.sin(ang) * len * 0.5 + 4 + (es.tilt || 0) * 0.8];
    if (bushy) {
      const p = P((p) => {
        const n = 6;
        for (let i = 0; i < n; i++) {
          const t = i / (n - 1);
          const x = inner[0] + (outer[0] - inner[0]) * t, y = inner[1] + (outer[1] - inner[1]) * t - Math.sin(t * Math.PI) * (b.curve || 0) * 0.8;
          const r = 11 - t * 3;
          p.moveTo(x + r * 1.15, y); p.ellipse(x, y, r * 1.15, r, 0, 0, Math.PI * 2);
        }
        lock(p, [outer[0] + 8, outer[1]], [outer[0] - 14, outer[1] + 10], 12, 2);
      });
      inked(ctx, [p], {
        fill: col, line: ink(spec.hair.shade, 0.6), lw: 2,
        shade: (L) => { L.fillStyle = spec.hair.shade; L.beginPath(); L.ellipse((inner[0] + outer[0]) / 2, (inner[1] + outer[1]) / 2 + 7, len * 0.5, 5, -ang * 0.5, 0, Math.PI * 2); L.fill(); },
      });
    } else {
      const thick = spec.eyes.male ? 7 : 5.4;
      const p = new Path2D();
      lock(p, inner, outer, thick, b.curve || 0);
      // thin skin-coloured halo so brows read over the bangs (anime convention)
      ctx.strokeStyle = rgba(spec.skin, 0.75); ctx.lineWidth = 2.4; ctx.lineJoin = 'round';
      ctx.stroke(p);
      ctx.fillStyle = col;
      ctx.fill(p);
    }
    ctx.restore();
  }
}

// ---------------------------------------------------------------- mouths

const MOUTH_IN = '#7c2a36';
const TONGUE = '#e8737f';

export function drawMouth(ctx, G, spec, E) {
  const sc = skinColors(spec);
  const line = mix(sc.line, '#5a1f22', 0.3);
  const s = spec.mouthW || 1;
  const t = E.mouth;
  ctx.save();
  ctx.translate(G.cx + (t === 'side' ? 8 : 0), G.mouthY);
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = line;
  const stroke = (fn, lw = 2.3) => { ctx.lineWidth = lw; ctx.beginPath(); fn(ctx); ctx.stroke(); };
  const open = (path, { tongue = true, teeth = false, tongueY = 0.62 } = {}) => {
    ctx.fillStyle = MOUTH_IN;
    ctx.fill(path);
    ctx.save(); ctx.clip(path);
    const bb = path.__bb;
    if (teeth) { ctx.fillStyle = '#ffffff'; ctx.fillRect(bb[0], bb[1] - 2, bb[2], bb[3] * 0.24 + 2); }
    if (tongue) { ctx.fillStyle = TONGUE; ctx.beginPath(); ctx.ellipse(bb[0] + bb[2] * 0.5, bb[1] + bb[3] * (tongueY + 0.42), bb[2] * 0.36, bb[3] * 0.44, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    ctx.lineWidth = 2.3; ctx.strokeStyle = line; ctx.stroke(path);
  };
  const mk = (bb, fn) => { const p = new Path2D(); fn(p); p.__bb = bb; return p; };
  switch (t) {
    case 'smile':
      stroke((c) => { c.moveTo(-11 * s, -1); c.quadraticCurveTo(0, 5, 11 * s, -2); });
      ctx.strokeStyle = rgba(sc.line, 0.35);
      stroke((c) => { c.moveTo(-4, 9); c.quadraticCurveTo(0, 10, 4, 9); }, 1.4);
      break;
    case 'grin': {
      const p = mk([-19 * s, -4, 38 * s, 24], (p) => { p.moveTo(-19 * s, -4); p.quadraticCurveTo(0, 1, 19 * s, -4); p.bezierCurveTo(15 * s, 18, -15 * s, 18, -19 * s, -4); p.closePath(); });
      open(p);
      break;
    }
    case 'frown':
      stroke((c) => { c.moveTo(-10 * s, 4); c.quadraticCurveTo(0, -4, 10 * s, 4); });
      break;
    case 'shout': {
      const p = mk([-13 * s, -1, 26 * s, 16], (p) => { p.moveTo(-13 * s, 2); p.quadraticCurveTo(0, -4, 13 * s, 2); p.bezierCurveTo(10 * s, 15, -10 * s, 15, -13 * s, 2); p.closePath(); });
      open(p, { teeth: true, tongueY: 0.75 });
      break;
    }
    case 'o': {
      const p = mk([-7, -5, 14, 20], (p) => { p.ellipse(0, 5, 7.5 * s, 9.5, 0, 0, Math.PI * 2); });
      open(p, { tongueY: 0.7 });
      break;
    }
    case 'wobble':
      stroke((c) => smoothOpen(c, [[-12 * s, 2], [-6 * s, -1.5], [0, 2], [6 * s, -1.5], [12 * s, 2]]), 2.1);
      break;
    case 'side':
      stroke((c) => { c.moveTo(-6 * s, 1); c.quadraticCurveTo(4 * s, 3, 12 * s, -3); });
      stroke((c) => { c.moveTo(12 * s, -3); c.lineTo(14 * s, -6); }, 1.6);
      break;
    case 'laugh': {
      const p = mk([-23 * s, -6, 46 * s, 32], (p) => { p.moveTo(-23 * s, -5); p.quadraticCurveTo(0, -1, 23 * s, -5); p.bezierCurveTo(19 * s, 30, -19 * s, 30, -23 * s, -5); p.closePath(); });
      open(p, { teeth: true });
      break;
    }
    case 'wavy': {
      const p = mk([-11 * s, -3, 22 * s, 8], (p) => { smoothOpen(p, [[-11 * s, 2], [-5 * s, -2], [1 * s, 1], [6 * s, -2], [11 * s, 2]]); smoothOpen(p, [[11 * s, 2], [5 * s, 4], [0, 4.5], [-6 * s, 4], [-11 * s, 2]], 1, false); p.closePath(); });
      open(p, { tongue: false });
      break;
    }
    case 'smirk':
      stroke((c) => { c.moveTo(-10 * s, 2); c.bezierCurveTo(-2 * s, 5, 8 * s, 2, 13 * s, -5); });
      stroke((c) => { c.moveTo(13 * s, -5); c.quadraticCurveTo(15 * s, -4, 15 * s, -1); }, 1.5);
      break;
    default:
      stroke((c) => { c.moveTo(-10, 0); c.lineTo(10, 0); });
  }
  if (spec.lips && (t === 'smile' || t === 'smirk' || t === 'frown' || t === 'wobble' || t === 'side')) {
    ctx.fillStyle = rgba(spec.lips, 0.45);
    ctx.beginPath(); ctx.ellipse(t === 'side' ? 3 : 0, 6, 8, 3, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}
