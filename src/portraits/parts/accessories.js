// Face accessories (glasses, earrings) and facial hair (beard, moustache).
import { P, inked, ellipse, smoothClosed, lock, mix, ink, tint, rgba, spindle } from '../util.js';
import { hairColors } from './hair.js';

export function drawGlasses(ctx, G, spec) {
  const gc = spec.extras.glasses;
  const r = spec.eyes.w + 9;
  const y = G.EY + 4;
  const rims = P((p) => {
    for (const s of [-1, 1]) {
      const x = G.cx + s * G.eyeDX;
      p.moveTo(x + r, y); p.ellipse(x, y, r, r * 0.92, 0, 0, Math.PI * 2);
      p.moveTo(x + r - 3, y); p.ellipse(x, y, r - 3, r * 0.92 - 3, 0, 0, Math.PI * 2, true);
    }
  });
  // lens tint + glare
  for (const s of [-1, 1]) {
    const x = G.cx + s * G.eyeDX;
    ctx.fillStyle = 'rgba(220,235,255,0.14)';
    ctx.beginPath(); ctx.ellipse(x, y, r - 3, r * 0.92 - 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - r * 0.62, y - r * 0.1); ctx.lineTo(x - r * 0.2, y - r * 0.55); ctx.stroke();
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x - r * 0.52, y + r * 0.18); ctx.lineTo(x + r * 0.02, y - r * 0.5); ctx.stroke();
  }
  ctx.fillStyle = gc;
  ctx.fill(rims, 'evenodd');
  ctx.strokeStyle = ink(gc, 0.6); ctx.lineWidth = 1.2;
  ctx.stroke(rims);
  // bridge + temples
  ctx.strokeStyle = gc; ctx.lineWidth = 3.2; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(G.cx - G.eyeDX + r - 2, y - 4); ctx.quadraticCurveTo(G.cx, y - 14, G.cx + G.eyeDX - r + 2, y - 4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(G.cx - G.eyeDX - r, y - 4); ctx.lineTo(G.cx - G.F.cheekW + 2, y - 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(G.cx + G.eyeDX + r, y - 4); ctx.lineTo(G.cx + G.F.cheekW - 2, y - 8); ctx.stroke();
  ctx.fillStyle = tint(gc, 0.5);
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(G.cx + s * G.eyeDX - r * 0.6, y - r * 0.68, 2, 0, Math.PI * 2); ctx.fill(); }
}

export function drawHoops(ctx, G, spec) {
  const hc = spec.extras.hoops;
  // only the tucked (viewer's left) ear shows; the right hoop peeks below the bob
  const pts = [[G.cx - G.F.cheekW - 4, G.EY + 58, 15], [G.cx + G.F.cheekW - 2, G.EY + 104, 12]];
  for (const [x, y, r] of pts) {
    const ring = P((p) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); p.moveTo(x + r - 3.4, y); p.arc(x, y, r - 3.4, 0, Math.PI * 2, true); });
    ctx.fillStyle = hc; ctx.fill(ring, 'evenodd');
    ctx.strokeStyle = ink(hc, 0.6); ctx.lineWidth = 1.2; ctx.stroke(ring);
    ctx.fillStyle = '#fff5c8'; ctx.beginPath(); ctx.arc(x - r * 0.6, y - r * 0.6, 1.8, 0, Math.PI * 2); ctx.fill();
  }
}

/** Gus's full beard: drawn over the face, before the mouth. */
export function drawBeard(ctx, G, spec) {
  const c = hairColors(spec);
  const { cx, F } = G;
  const outer = [];
  const N = 15;
  for (let i = 0; i <= N; i++) {
    const t = i / N;
    const a = Math.PI * (1 - t);
    const r = (i % 2 ? 1 : 1.05);
    outer.push([cx + Math.cos(a) * (F.cheekW + 10) * r, 330 + Math.sin(a) * 140 * r * (0.7 + 0.3 * Math.sin(t * Math.PI))]);
  }
  const upper = [[cx + F.cheekW - 2, 320], [cx + 80, 362], [cx + 40, 358], [cx, 352], [cx - 40, 358], [cx - 80, 362], [cx - F.cheekW + 2, 320]];
  const beard = P((p) => smoothClosed(p, [...outer.reverse(), ...upper.reverse()].reverse(), 0.9));
  inked(ctx, [beard], {
    fill: c.base, line: c.line, lw: 2.6,
    shade: (L) => {
      L.fillStyle = c.shade;
      L.beginPath(); L.ellipse(cx + 40, 470, 110, 50, 0, 0, Math.PI * 2); L.fill();
      L.beginPath(); L.ellipse(cx + 120, 380, 30, 70, 0, 0, Math.PI * 2); L.fill();
      L.fillStyle = c.strand;
      for (const [a, b, bend] of [[[cx - 90, 380], [cx - 70, 450], -6], [[cx - 50, 400], [cx - 36, 470], -4], [[cx - 10, 410], [cx - 4, 470], 0], [[cx + 30, 410], [cx + 34, 466], 4], [[cx + 70, 390], [cx + 70, 450], 6], [[cx + 100, 360], [cx + 96, 420], 6], [[cx - 104, 350], [cx - 100, 410], -6]]) {
        const p = new Path2D(); spindle(p, a, b, 1.3, bend); L.fill(p);
      }
      L.fillStyle = rgba(c.hi, 0.9);
      L.beginPath(); L.ellipse(cx - 60, 420, 22, 6, 1.1, 0, Math.PI * 2); L.fill();
    },
  });
  // mouth opening in the beard (skin-dark) so mouths read
  ctx.fillStyle = mix(spec.skin, '#7a3a2a', 0.35);
  ctx.beginPath(); ctx.ellipse(cx, G.mouthY + 3, 22, 11, 0, 0, Math.PI * 2); ctx.fill();
}

/** Walrus / sea-captain moustache, drawn after the mouth. */
export function drawMoustache(ctx, G, spec, big) {
  const col = spec.extras.moustache || spec.extras.beard;
  const line = ink(spec.hair.shade, 0.6);
  const { cx } = G;
  const y = G.mouthY - 12;
  const half = (s) => P((p) => {
    smoothClosed(p, [[cx, y - 14], [cx + s * 22, y - 18], [cx + s * 46, y - 10], [cx + s * (big ? 66 : 54), y + 10], [cx + s * (big ? 62 : 50), y + 22], [cx + s * 40, y + 14], [cx + s * 24, y + 16], [cx + s * 8, y + 8], [cx, y + 4]], 1);
  });
  inked(ctx, [half(-1), half(1)], {
    fill: col, line, lw: 2.4,
    shade: (L) => {
      L.fillStyle = spec.hair.shade;
      L.beginPath(); L.ellipse(cx + 24, y + 12, 34, 8, 0.1, 0, Math.PI * 2); L.ellipse(cx - 30, y + 14, 26, 5, -0.1, 0, Math.PI * 2); L.fill();
      L.strokeStyle = rgba(line, 0.5); L.lineWidth = 1.3; L.lineCap = 'round';
      for (const s of [-1, 1]) for (const d of [14, 28, 42]) { L.beginPath(); L.moveTo(cx + s * d, y - 10); L.quadraticCurveTo(cx + s * (d + 8), y, cx + s * (d + 10), y + 10); L.stroke(); }
      L.fillStyle = '#ffffff';
      L.beginPath(); L.ellipse(cx - 28, y - 8, 12, 4, -0.2, 0, Math.PI * 2); L.fill();
    },
  });
  // centre parting line
  ctx.strokeStyle = line; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(cx, y - 12); ctx.lineTo(cx, y + 2); ctx.stroke();
}
