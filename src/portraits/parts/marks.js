// Manga emotion marks: sparkles, tears, anger vein, sweat drop, shock lines.
import { P, inked, spindle, lock } from '../util.js';
import { starPath } from './hair.js';

function drop(p, x, y, r, rot = 0) {
  const c = Math.cos(rot), s = Math.sin(rot);
  const T = (dx, dy) => [x + dx * c - dy * s, y + dx * s + dy * c];
  const a = T(0, -r * 2.2), b1 = T(r * 1.1, -r * 0.2), b2 = T(r, r * 0.9), m = T(0, r), b3 = T(-r, r * 0.9), b4 = T(-r * 1.1, -r * 0.2);
  p.moveTo(a[0], a[1]);
  p.bezierCurveTo(b1[0], b1[1], b2[0], b2[1], m[0], m[1]);
  p.bezierCurveTo(b3[0], b3[1], b4[0], b4[1], a[0], a[1]);
  p.closePath();
}

export function drawMarks(ctx, G, spec, E) {
  const { cx, EY } = G;
  for (const m of E.marks) {
    if (m === 'sparkle') {
      for (const [x, y, r] of [[cx + 156, 150, 15], [cx + 178, 196, 8], [cx - 168, 176, 11]]) {
        inked(ctx, [P((p) => starPath(p, x, y, r, r * 0.3, 0, 4))], { fill: '#fff6c4', line: '#d9a640', lw: 1.6 });
      }
    } else if (m === 'tear') {
      const x = cx - G.eyeDX - 6, y = EY + 42;
      inked(ctx, [P((p) => drop(p, x, y + 10, 5.5))], { fill: '#bfe6ff', line: '#5a8fc0', lw: 1.6, shade: (L) => { L.fillStyle = '#fff'; L.beginPath(); L.arc(x - 2, y + 9, 1.8, 0, Math.PI * 2); L.fill(); } });
      ctx.strokeStyle = 'rgba(150,205,240,0.8)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x - 2, EY + 28); ctx.quadraticCurveTo(x - 4, EY + 40, x - 1, y); ctx.stroke();
    } else if (m === 'joyTear') {
      for (const s of [-1, 1]) {
        const x = cx + s * (G.eyeDX + spec.eyes.w + 8), y = EY + 4;
        inked(ctx, [P((p) => drop(p, x, y, 4.5, s * -0.9))], { fill: '#d4efff', line: '#5a8fc0', lw: 1.4 });
      }
    } else if (m === 'vein') {
      const x = cx + 104, y = 176;
      const v = P((p) => {
        for (let i = 0; i < 4; i++) {
          const a = Math.PI / 4 + (i * Math.PI) / 2;
          const ox = Math.cos(a) * 9, oy = Math.sin(a) * 9;
          const tx = -Math.sin(a), ty = Math.cos(a);
          p.moveTo(x + ox + tx * 9, y + oy + ty * 9);
          p.quadraticCurveTo(x + ox * 0.2, y + oy * 0.2, x + ox - tx * 9, y + oy - ty * 9);
        }
      });
      ctx.lineCap = 'round';
      ctx.strokeStyle = '#fff4ec'; ctx.lineWidth = 9; ctx.stroke(v);
      ctx.strokeStyle = '#d8323e'; ctx.lineWidth = 4.2; ctx.stroke(v);
    } else if (m === 'sweat') {
      const x = cx + 120, y = 222;
      inked(ctx, [P((p) => drop(p, x, y, 10, 0.15))], {
        fill: '#bfe6ff', line: '#4f86b8', lw: 2,
        shade: (L) => { L.fillStyle = '#8cc8ef'; L.beginPath(); L.ellipse(x + 3, y + 5, 6, 5, 0, 0, Math.PI * 2); L.fill(); L.fillStyle = '#fff'; L.beginPath(); L.ellipse(x - 3, y - 4, 2.5, 5, 0.2, 0, Math.PI * 2); L.fill(); },
      });
    } else if (m === 'shock') {
      ctx.fillStyle = '#3a2320';
      for (const [a, b] of [[[cx - 150, 150], [cx - 176, 126]], [[cx - 160, 184], [cx - 192, 176]], [[cx + 150, 150], [cx + 176, 126]], [[cx + 160, 184], [cx + 192, 176]], [[cx - 128, 126], [cx - 140, 98]], [[cx + 128, 126], [cx + 140, 98]]]) {
        const p = new Path2D(); spindle(p, a, b, 2.6, 0); ctx.fill(p);
      }
    } else if (m === 'shyLines') {
      ctx.strokeStyle = 'rgba(224,96,126,0.75)'; ctx.lineWidth = 2; ctx.lineCap = 'round';
      for (const [x, y] of [[cx + 150, 330], [cx + 160, 346], [cx + 150, 362]]) { ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 4, x + 16, y + 2); ctx.stroke(); }
    }
  }
}
