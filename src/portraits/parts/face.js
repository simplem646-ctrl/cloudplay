// Face shape, ears, skin shading, nose, blush, freckles and skin marks.
import { P, inked, ellipse, spindle, shade, mix, ink, rgba, lock, smoothClosed } from '../util.js';
import { FACES } from '../specs.js';

export const LINE = '#3a2320';

/** Head geometry for a spec. */
export function geom(spec) {
  const F = FACES[spec.face];
  const e = spec.eyes;
  return {
    cx: 256, F,
    EY: e.elder ? 306 : 302,
    eyeDX: e.spacing || 52,
    noseY: e.elder ? 346 : 344,
    mouthY: 374 + (spec.mouthDY || 0),
  };
}

/** Face outline: top half-dome of the skull, temples, cheeks, jaw, chin. */
export function facePath(p, F, cx = 256, ox = 0, oy = 0) {
  const { rx, ry, cy, cheekW, cheekY, jawW, jawY, chinW, chinY } = F;
  const X = (x) => x + ox, Y = (y) => y + oy;
  p.moveTo(X(cx - rx), Y(cy));
  p.ellipse(X(cx), Y(cy), rx, ry, 0, Math.PI, Math.PI * 2);
  p.bezierCurveTo(X(cx + rx), Y(cy + 30), X(cx + cheekW + 1), Y(cheekY - 34), X(cx + cheekW), Y(cheekY));
  p.bezierCurveTo(X(cx + cheekW - 2), Y(cheekY + 32), X(cx + jawW + 22), Y(jawY - 16), X(cx + jawW), Y(jawY));
  p.bezierCurveTo(X(cx + jawW - 18), Y(jawY + 15), X(cx + chinW + 8), Y(chinY), X(cx), Y(chinY));
  p.bezierCurveTo(X(cx - chinW - 8), Y(chinY), X(cx - jawW + 18), Y(jawY + 15), X(cx - jawW), Y(jawY));
  p.bezierCurveTo(X(cx - jawW - 22), Y(jawY - 16), X(cx - cheekW + 2), Y(cheekY + 32), X(cx - cheekW), Y(cheekY));
  p.bezierCurveTo(X(cx - cheekW - 1), Y(cheekY - 34), X(cx - rx), Y(cy + 30), X(cx - rx), Y(cy));
  p.closePath();
}

export function skinColors(spec) {
  const s = spec.skin;
  return {
    base: s,
    shade: mix(mix(s, '#c9756c', 0.3), shade(s, 0.28), 0.4),
    line: ink(mix(s, '#8a3a2a', 0.5), 0.62),
    blush: spec.extras?.ruddy ? '#e8786a' : '#f0868e',
  };
}

export function drawEars(ctx, G, spec) {
  const { cx, F } = G;
  const sc = skinColors(spec);
  const y0 = G.EY - 8, y1 = G.EY + 44;
  const ear = (s) => P((p) => {
    const x = cx + s * (F.cheekW - 6);
    p.moveTo(x, y0);
    p.bezierCurveTo(x + s * 26, y0 - 10, x + s * 30, y0 + 26, x + s * 16, y1 - 6);
    p.bezierCurveTo(x + s * 10, y1, x + s * 2, y1, x - s * 2, y1 - 4);
    p.closePath();
  });
  inked(ctx, [ear(-1), ear(1)], {
    fill: sc.base, line: sc.line, lw: 2.2,
    shade: (L) => {
      L.strokeStyle = sc.shade; L.lineWidth = 5; L.lineCap = 'round';
      for (const s of [-1, 1]) {
        const x = cx + s * (F.cheekW - 6);
        L.beginPath(); L.moveTo(x + s * 6, y0 + 6); L.quadraticCurveTo(x + s * 20, y0 + 6, x + s * 12, y1 - 14); L.stroke();
      }
    },
    inner: (L) => {
      L.strokeStyle = rgba(sc.line, 0.7); L.lineWidth = 1.4;
      for (const s of [-1, 1]) {
        const x = cx + s * (F.cheekW - 6);
        L.beginPath(); L.moveTo(x + s * 8, y0 + 4); L.quadraticCurveTo(x + s * 22, y0 + 6, x + s * 14, y1 - 14); L.stroke();
      }
    },
  });
}

/** Face skin with cel shading (side crescent, bang shadow) and the jaw outline. */
export function drawFace(ctx, G, spec, hair) {
  const { F, cx } = G;
  const sc = skinColors(spec);
  const face = P((p) => facePath(p, F, cx));
  inked(ctx, [face], {
    fill: sc.base, line: sc.line, lw: 2.6,
    shade: (L) => {
      // shadow crescent on the right / under the jaw (light from upper-left)
      const cres = new Path2D();
      cres.rect(0, 0, 512, 640);
      facePath(cres, F, cx, -7, -5);
      L.fillStyle = sc.shade;
      L.fill(cres, 'evenodd');
      if (hair && hair.faceShadow) {
        const sp = new Path2D();
        hair.faceShadow(sp);
        L.fill(sp);
      }
      if (spec.hair.style === 'bald') {
        // head shine
        L.fillStyle = 'rgba(255,255,255,0.75)';
        L.beginPath(); L.ellipse(214, 146, 34, 14, -0.45, 0, Math.PI * 2); L.fill();
        L.beginPath(); L.ellipse(258, 126, 9, 5, -0.2, 0, Math.PI * 2); L.fill();
      }
      // soft light on the cheek
      L.fillStyle = rgba('#ffffff', 0.18);
      L.beginPath(); L.ellipse(cx - 62, G.EY + 46, 26, 14, 0, 0, Math.PI * 2); L.fill();
    },
  });
}

export function drawBlush(ctx, G, spec, amount) {
  const sc = skinColors(spec);
  const ex = spec.extras || {};
  const a = Math.min(1, amount + (ex.rosy ? 0.35 : 0) + (ex.ruddy ? 0.45 : 0));
  if (a <= 0.02) return;
  const y = G.EY + 50;
  for (const s of [-1, 1]) {
    const x = G.cx + s * (G.eyeDX + 14);
    const g = ctx.createRadialGradient(x, y, 2, x, y, 32);
    g.addColorStop(0, rgba(sc.blush, 0.55 * a));
    g.addColorStop(0.6, rgba(sc.blush, 0.32 * a));
    g.addColorStop(1, rgba(sc.blush, 0));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y, 34, 17, 0, 0, Math.PI * 2); ctx.fill();
    if (amount > 0.45) {
      ctx.strokeStyle = rgba(mix(sc.blush, '#b0304a', 0.4), Math.min(1, 0.4 + amount * 0.5));
      ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      const n = amount > 0.85 ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const hx = x - (n - 1) * 5 + i * 10;
        ctx.beginPath(); ctx.moveTo(hx + 4, y - 8); ctx.lineTo(hx - 4, y + 7); ctx.stroke();
      }
    }
  }
}

export function drawNose(ctx, G, spec) {
  const sc = skinColors(spec);
  const { cx, noseY } = G;
  const ex = spec.extras || {};
  if (spec.eyes.elder) {
    // rounder, more present nose for elders
    const nose = P((p) => { p.moveTo(cx - 10, noseY + 6); p.bezierCurveTo(cx - 16, noseY - 4, cx - 4, noseY - 12, cx + 6, noseY - 8); p.bezierCurveTo(cx + 18, noseY - 4, cx + 16, noseY + 10, cx + 4, noseY + 10); });
    ctx.fillStyle = ex.ruddy ? rgba('#e58f7a', 0.55) : rgba(sc.shade, 0.6);
    ctx.beginPath(); ctx.ellipse(cx + 2, noseY + 1, 15, 11, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = sc.line; ctx.lineWidth = 2; ctx.lineCap = 'round';
    ctx.stroke(nose);
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.beginPath(); ctx.ellipse(cx - 2, noseY - 4, 4, 2.5, -0.3, 0, Math.PI * 2); ctx.fill();
    return;
  }
  // late-90s anime nose: tiny shadow wedge + short tip stroke
  ctx.fillStyle = rgba(sc.shade, 0.9);
  const w = P((p) => { p.moveTo(cx + 2, noseY - 18); p.quadraticCurveTo(cx + 9, noseY - 4, cx + 6, noseY + 4); p.lineTo(cx, noseY + 3); p.quadraticCurveTo(cx + 4, noseY - 6, cx + 2, noseY - 18); p.closePath(); });
  ctx.fill(w);
  ctx.strokeStyle = sc.line; ctx.lineWidth = 1.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx + 1, noseY + 3); ctx.quadraticCurveTo(cx + 5, noseY + 5, cx + 8, noseY + 1); ctx.stroke();
}

export function drawSkinExtras(ctx, G, spec) {
  const ex = spec.extras || {};
  const { cx, EY } = G;
  const sc = skinColors(spec);
  if (ex.freckles) {
    ctx.fillStyle = rgba(ex.freckles, 0.8);
    const pts = [[-70, 36], [-58, 42], [-78, 46], [-64, 52], [-48, 38], [-86, 38], [70, 36], [58, 42], [78, 46], [64, 52], [48, 38], [86, 38]];
    for (const [x, y] of pts) { ctx.beginPath(); ctx.ellipse(cx + x, EY + y, 2.2, 1.8, 0, 0, Math.PI * 2); ctx.fill(); }
  }
  if (ex.flour) {
    // powdery flour smudge on the cheek near the jaw
    for (const [x, y, rx, ry, a] of [[-84, 70, 11, 6, 0.7], [-74, 76, 7, 4, 0.6], [-92, 64, 5, 3, 0.5]]) {
      ctx.fillStyle = `rgba(255,255,255,${a})`;
      ctx.beginPath(); ctx.ellipse(cx + x, EY + y, rx, ry, -0.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    for (const [x, y] of [[-98, 72], [-80, 84], [-70, 66]]) { ctx.beginPath(); ctx.arc(cx + x, EY + y, 1.4, 0, Math.PI * 2); ctx.fill(); }
  }
  if (ex.beautyMark) {
    ctx.fillStyle = '#4a2a26';
    ctx.beginPath(); ctx.arc(cx + 32, G.mouthY + 4, 2.4, 0, Math.PI * 2); ctx.fill();
  }
  if (ex.bandaid) {
    ctx.save();
    ctx.translate(cx + 74, EY + 48); ctx.rotate(-0.45);
    const b = P((p) => { p.roundRect(-20, -8, 40, 16, 8); });
    ctx.fillStyle = '#f3d1a6'; ctx.fill(b);
    ctx.strokeStyle = '#8a5a3a'; ctx.lineWidth = 1.6; ctx.stroke(b);
    ctx.fillStyle = '#e6b98a'; ctx.fillRect(-7, -6, 14, 12);
    ctx.fillStyle = '#b8865a';
    for (const [x, y] of [[-14, -2], [-14, 3], [14, -2], [14, 3]]) { ctx.beginPath(); ctx.arc(x, y, 0.9, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  }
  if (ex.wrinkles) {
    ctx.strokeStyle = rgba(sc.line, 0.55); ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    const d = G.eyeDX;
    for (const s of [-1, 1]) {
      const ox = cx + s * (d + spec.eyes.w + 6);
      // crow's feet
      for (const [a, l] of [[-0.35, 11], [0.05, 12], [0.45, 10]]) {
        ctx.beginPath(); ctx.moveTo(ox, EY + 2 + a * 8); ctx.lineTo(ox + s * Math.cos(a) * l, EY + 2 + a * 8 + Math.sin(a) * l); ctx.stroke();
      }
      // under-eye
      ctx.beginPath(); ctx.moveTo(cx + s * (d - 12), EY + 26); ctx.quadraticCurveTo(cx + s * d, EY + 32, cx + s * (d + 14), EY + 25); ctx.stroke();
      // smile lines
      ctx.beginPath(); ctx.moveTo(cx + s * 24, G.noseY + 10); ctx.quadraticCurveTo(cx + s * 36, G.noseY + 20, cx + s * 32, G.mouthY - 2); ctx.stroke();
    }
    if (ex.weathered) {
      ctx.strokeStyle = rgba(sc.line, 0.35);
      ctx.beginPath(); ctx.moveTo(cx - 40, 240); ctx.quadraticCurveTo(cx, 234, cx + 40, 240); ctx.stroke();
    }
  }
}
