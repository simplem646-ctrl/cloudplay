// Neck, shoulders and outfits (not rotated with the head).
import { P, inked, lock, smoothClosed, ellipse, mix, ink, tint, shade, rgba, spindle } from '../util.js';
import { skinColors } from './face.js';
import { starPath } from './hair.js';

const CX = 256;
const BUILDS = {
  f:      { nw: 26, sw: 158, sy: 476, bw: 186 },
  m:      { nw: 31, sw: 178, sy: 474, bw: 200 },
  portly: { nw: 40, sw: 186, sy: 480, bw: 230 },
  elderF: { nw: 30, sw: 166, sy: 482, bw: 196 },
  broad:  { nw: 38, sw: 196, sy: 474, bw: 224 },
};

function torso(p, b, ox = 0, oy = 0) {
  const { nw, sw, sy, bw } = b;
  p.moveTo(CX - nw + ox, 430 + oy);
  p.bezierCurveTo(CX - nw - 20, 452 + oy, CX - sw * 0.55, sy - 14 + oy, CX - sw * 0.8, sy - 4 + oy);
  p.bezierCurveTo(CX - sw * 1.02, sy + 4 + oy, CX - sw * 1.1, sy + 40 + oy, CX - bw + 4, sy + 100 + oy);
  p.lineTo(CX - bw, 700);
  p.lineTo(CX + bw, 700);
  p.lineTo(CX + bw - 4, sy + 100 + oy);
  p.bezierCurveTo(CX + sw * 1.1, sy + 40 + oy, CX + sw * 1.02, sy + 4 + oy, CX + sw * 0.8, sy - 4 + oy);
  p.bezierCurveTo(CX + sw * 0.55, sy - 14 + oy, CX + nw + 20, 452 + oy, CX + nw + ox, 430 + oy);
  p.closePath();
}

function neckPath(p, b, depth = 470) {
  const { nw } = b;
  p.moveTo(CX - nw, 330);
  p.lineTo(CX - nw, 420);
  p.bezierCurveTo(CX - nw - 2, 440, CX - nw - 18, 452, CX - nw - 30, 460);
  p.quadraticCurveTo(CX, depth + 30, CX + nw + 30, 460);
  p.bezierCurveTo(CX + nw + 18, 452, CX + nw + 2, 440, CX + nw, 420);
  p.lineTo(CX + nw, 330);
  p.closePath();
}

export function drawBody(ctx, G, spec, opts = {}) {
  const b = BUILDS[spec.build] || BUILDS.f;
  const sc = skinColors(spec);
  const o = spec.outfit;
  const fn = OUTFITS[o.style];
  if (fn.behind) fn.behind(ctx, b, o, spec);
  // neck
  inked(ctx, [P((p) => neckPath(p, b, fn.neckDepth || 470))], {
    fill: sc.base, line: sc.line, lw: 2.4,
    shade: (L) => {
      L.fillStyle = sc.shade;
      L.beginPath(); L.ellipse(CX + 6, G.F.chinY - 6, G.F.jawW + 26, 44, 0, 0, Math.PI * 2); L.fill();
      L.fillRect(CX + b.nw - 12, 330, 20, 120);
    },
    inner: (L) => {
      // collarbone hints
      L.strokeStyle = rgba(sc.line, 0.45); L.lineWidth = 1.4; L.lineCap = 'round';
      L.beginPath(); L.moveTo(CX - 44, 470); L.quadraticCurveTo(CX - 26, 466, CX - 12, 474); L.stroke();
      L.beginPath(); L.moveTo(CX + 44, 470); L.quadraticCurveTo(CX + 26, 466, CX + 12, 474); L.stroke();
    },
  });
  fn(ctx, b, o, spec, G);
  if (opts.season === 'winter') drawScarf(ctx, b, spec);
}

// ---------------------------------------------------------------- helpers

const LN = '#3a2320';
const lineOf = (c) => ink(c, 0.68);

function cloth(ctx, paths, color, extra = {}) {
  inked(ctx, paths, { fill: color, line: extra.line || lineOf(color), lw: extra.lw ?? 2.6, shade: extra.shade, inner: extra.inner });
}

function sideShade(L, color, b, x0 = CX + 40) {
  // shadow down the right side of the torso (outer part of the far shoulder)
  L.fillStyle = color;
  L.beginPath();
  x0 = Math.max(x0, CX + b.sw * 0.62);
  L.moveTo(x0, 700); L.bezierCurveTo(x0 + 6, 620, CX + b.sw * 0.86, 540, CX + b.sw * 0.9, b.sy + 4);
  L.lineTo(CX + b.sw * 1.2, 470);
  L.lineTo(600, 480); L.lineTo(600, 700); L.closePath(); L.fill();
}

function buttons(ctx, xs, color) {
  for (const [x, y] of xs) {
    inked(ctx, [P((p) => ellipse(p, x, y, 5.5, 5.5))], {
      fill: color, line: lineOf(color), lw: 1.6,
      shade: (L) => { L.fillStyle = '#fff8d8'; L.beginPath(); L.arc(x - 1.6, y - 1.6, 1.8, 0, Math.PI * 2); L.fill(); },
    });
  }
}

// ---------------------------------------------------------------- outfits

const OUTFITS = {
  baker(ctx, b, o, spec) {
    // cream blouse with puffed sleeves
    const blouse = [P((p) => torso(p, b)), P((p) => { ellipse(p, CX - b.sw * 0.9, b.sy + 26, 46, 44, -0.3); ellipse(p, CX + b.sw * 0.9, b.sy + 26, 46, 44, 0.3); })];
    cloth(ctx, blouse, o.blouse, {
      shade: (L) => {
        sideShade(L, shade(o.blouse, 0.22), b);
        L.fillStyle = shade(o.blouse, 0.22);
        L.beginPath(); L.ellipse(CX + b.sw * 0.96, b.sy + 40, 30, 34, 0.3, 0, Math.PI * 2); L.fill();
        L.strokeStyle = lineOf(o.blouse); L.lineWidth = 1.4;
        for (const s of [-1, 1]) for (const d of [-14, 4, 20]) {
          L.beginPath(); L.moveTo(CX + s * (b.sw * 0.9 + d), b.sy - 8); L.quadraticCurveTo(CX + s * (b.sw * 0.9 + d * 1.3), b.sy + 20, CX + s * (b.sw * 0.9 + d), b.sy + 50); L.stroke();
        }
      },
    });
    // apron bib + straps
    const ap = o.apron;
    const apron = [P((p) => {
      p.moveTo(CX - 84, 700); p.lineTo(CX - 78, 556); p.quadraticCurveTo(CX - 76, 540, CX - 60, 538);
      p.lineTo(CX + 60, 538); p.quadraticCurveTo(CX + 76, 540, CX + 78, 556); p.lineTo(CX + 84, 700); p.closePath();
      lock(p, [CX - 70, 546], [CX - 122, 470], 20, -6, 9);
      lock(p, [CX + 70, 546], [CX + 122, 470], 20, 6, 9);
    })];
    cloth(ctx, apron, ap, {
      shade: (L) => {
        L.fillStyle = shade(ap, 0.25); L.fillRect(CX + 40, 530, 60, 200);
        L.fillStyle = '#ffffff';
        for (let x = CX - 60; x <= CX + 60; x += 12) { L.beginPath(); L.arc(x, 541, 6, 0, Math.PI); L.fill(); }
        L.strokeStyle = tint(ap, 0.4); L.lineWidth = 1.5; L.setLineDash([4, 4]);
        L.beginPath(); L.moveTo(CX - 66, 556); L.lineTo(CX - 72, 700); L.moveTo(CX + 66, 556); L.lineTo(CX + 72, 700); L.stroke();
        L.setLineDash([]);
      },
    });
    // heart pocket
    const heart = P((p) => { p.moveTo(CX, 612); p.bezierCurveTo(CX - 26, 594, CX - 16, 570, CX, 584); p.bezierCurveTo(CX + 16, 570, CX + 26, 594, CX, 612); p.closePath(); });
    cloth(ctx, [heart], tint(ap, 0.45), { lw: 1.8, line: ink(ap, 0.6) });
    // peter pan collar
    const collar = [P((p) => {
      smoothClosed(p, [[CX - 2, 452], [CX - 34, 440], [CX - 66, 452], [CX - 64, 480], [CX - 30, 490], [CX - 6, 474]]);
      smoothClosed(p, [[CX + 2, 452], [CX + 34, 440], [CX + 66, 452], [CX + 64, 480], [CX + 30, 490], [CX + 6, 474]]);
    })];
    cloth(ctx, collar, '#ffffff', { lw: 2.2, shade: (L) => { L.fillStyle = '#eee3d6'; L.beginPath(); L.ellipse(CX + 40, 482, 26, 8, 0, 0, Math.PI * 2); L.fill(); } });
    // little rose bow at the collar
    const rc = o.ribbon;
    const bow = [P((p) => { smoothClosed(p, [[CX, 470], [CX - 18, 460], [CX - 20, 480]]); smoothClosed(p, [[CX, 470], [CX + 18, 460], [CX + 20, 480]]); ellipse(p, CX, 471, 5, 5); })];
    cloth(ctx, bow, rc, { lw: 1.8 });
  },

  cardigan(ctx, b, o) {
    const dress = [P((p) => torso(p, b))];
    cloth(ctx, dress, o.dress, {
      shade: (L) => sideShade(L, shade(o.dress, 0.25), b, CX + 20),
      inner: (L) => {},
    });
    // neckline trim of the dress
    const neck = P((p) => { p.moveTo(CX - 52, 464); p.quadraticCurveTo(CX, 520, CX + 52, 464); });
    ctx.strokeStyle = lineOf(o.dress); ctx.lineWidth = 2.2; ctx.stroke(neck);
    // key-charm necklace
    ctx.strokeStyle = '#a7782f'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(CX - 30, 448); ctx.quadraticCurveTo(CX - 6, 530, CX, 532); ctx.quadraticCurveTo(CX + 6, 530, CX + 30, 448); ctx.stroke();
    const key = [P((p) => { ellipse(p, CX, 542, 8, 8); p.rect(CX - 2.5, 548, 5, 26); p.rect(CX + 2, 562, 7, 4); p.rect(CX + 2, 569, 5, 4); })];
    cloth(ctx, key, o.key, { lw: 1.6, line: '#6a4a1a', shade: (L) => { L.fillStyle = '#fff2b0'; L.beginPath(); L.arc(CX - 3, 539, 2, 0, Math.PI * 2); L.fill(); } });
    ctx.fillStyle = mix(o.dress, '#ffffff', 0.5); ctx.beginPath(); ctx.arc(CX, 542, 3, 0, Math.PI * 2); ctx.fill();
    // open cardigan panels
    const cd = o.cardigan;
    const panels = [P((p) => {
      p.moveTo(CX - 40, 456); p.bezierCurveTo(CX - 90, 470, CX - b.sw * 0.8, b.sy - 10, CX - b.sw * 0.92, b.sy);
      p.bezierCurveTo(CX - b.sw * 1.08, b.sy + 16, CX - b.sw * 1.12, b.sy + 50, CX - b.bw - 2, b.sy + 110);
      p.lineTo(CX - b.bw - 4, 700); p.lineTo(CX - 64, 700); p.bezierCurveTo(CX - 70, 600, CX - 70, 520, CX - 40, 456); p.closePath();
      p.moveTo(CX + 40, 456); p.bezierCurveTo(CX + 90, 470, CX + b.sw * 0.8, b.sy - 10, CX + b.sw * 0.92, b.sy);
      p.bezierCurveTo(CX + b.sw * 1.08, b.sy + 16, CX + b.sw * 1.12, b.sy + 50, CX + b.bw + 2, b.sy + 110);
      p.lineTo(CX + b.bw + 4, 700); p.lineTo(CX + 64, 700); p.bezierCurveTo(CX + 70, 600, CX + 70, 520, CX + 40, 456); p.closePath();
    })];
    cloth(ctx, panels, cd, {
      shade: (L) => {
        sideShade(L, shade(cd, 0.26), b, CX + 60);
        L.fillStyle = shade(cd, 0.26);
        L.beginPath(); L.moveTo(CX - 40, 456); L.bezierCurveTo(CX - 70, 520, CX - 70, 600, CX - 64, 700); L.lineTo(CX - 86, 700); L.bezierCurveTo(CX - 90, 600, CX - 88, 520, CX - 58, 462); L.closePath(); L.fill();
        // rib knit placket + texture
        L.strokeStyle = rgba(lineOf(cd), 0.45); L.lineWidth = 1.2;
        for (const s of [-1, 1]) {
          L.beginPath(); L.moveTo(CX + s * 56, 462); L.bezierCurveTo(CX + s * 82, 520, CX + s * 84, 600, CX + s * 80, 700); L.stroke();
        }
        for (let y = 520; y < 700; y += 14) for (const s of [-1, 1]) {
          for (let x = 100; x < 190; x += 16) {
            L.beginPath(); L.moveTo(CX + s * x - 3, y); L.lineTo(CX + s * x, y + 4); L.lineTo(CX + s * x + 3, y); L.stroke();
          }
        }
      },
    });
    buttons(ctx, [[CX - 72, 560], [CX - 75, 610], [CX - 76, 660]], '#8a6a4a');
  },

  raincoat: Object.assign(function raincoat(ctx, b, o) {
    // white tank
    const tank = [P((p) => { p.moveTo(CX - 70, 700); p.lineTo(CX - 66, 520); p.quadraticCurveTo(CX, 560, CX + 66, 520); p.lineTo(CX + 70, 700); p.closePath(); })];
    cloth(ctx, tank, o.tank, { shade: (L) => { L.fillStyle = '#e4e6ee'; L.fillRect(CX + 30, 500, 60, 220); } });
    // overall bib + straps
    const ov = o.overall;
    const bib = [P((p) => {
      p.moveTo(CX - 62, 700); p.lineTo(CX - 56, 592); p.lineTo(CX + 56, 592); p.lineTo(CX + 62, 700); p.closePath();
      lock(p, [CX - 50, 600], [CX - 74, 500], 16, 0, 7); lock(p, [CX + 50, 600], [CX + 74, 500], 16, 0, 7);
    })];
    cloth(ctx, bib, ov, {
      shade: (L) => { L.fillStyle = shade(ov, 0.3); L.fillRect(CX + 28, 580, 50, 140); L.strokeStyle = '#e8c070'; L.lineWidth = 1.4; L.setLineDash([3, 3]); L.strokeRect(CX - 30, 612, 60, 40); L.setLineDash([]); },
    });
    buttons(ctx, [[CX - 52, 600], [CX + 52, 600]], '#e6c25a');
    // raincoat
    const jc = o.jacket;
    const coat = [P((p) => {
      for (const s of [-1, 1]) {
        p.moveTo(CX + s * 40, 452); p.bezierCurveTo(CX + s * 90, 466, CX + s * b.sw * 0.8, b.sy - 10, CX + s * b.sw * 0.94, b.sy);
        p.bezierCurveTo(CX + s * b.sw * 1.12, b.sy + 16, CX + s * b.sw * 1.16, b.sy + 50, CX + s * (b.bw + 6), b.sy + 110);
        p.lineTo(CX + s * (b.bw + 8), 700); p.lineTo(CX + s * 92, 700); p.bezierCurveTo(CX + s * 92, 600, CX + s * 84, 540, CX + s * 60, 480); p.closePath();
      }
    })];
    cloth(ctx, coat, jc, {
      shade: (L) => {
        sideShade(L, shade(jc, 0.25), b, CX + 100);
        L.fillStyle = shade(jc, 0.25);
        for (const s of [-1, 1]) { L.beginPath(); L.ellipse(CX + s * 110, 700, 24, 110, 0, 0, Math.PI * 2); L.fill(); }
        L.strokeStyle = rgba(lineOf(jc), 0.5); L.lineWidth = 1.6;
        for (const s of [-1, 1]) { L.beginPath(); L.moveTo(CX + s * b.sw * 0.92, b.sy + 6); L.quadraticCurveTo(CX + s * (b.sw * 0.92 - 10), b.sy + 80, CX + s * (b.sw * 0.84), 700); L.stroke(); }
      },
    });
    // big collar flaps
    const collar = [P((p) => {
      for (const s of [-1, 1]) {
        p.moveTo(CX + s * 30, 446); p.bezierCurveTo(CX + s * 70, 440, CX + s * 110, 452, CX + s * 128, 474);
        p.lineTo(CX + s * 96, 536); p.quadraticCurveTo(CX + s * 70, 500, CX + s * 46, 480); p.closePath();
      }
    })];
    cloth(ctx, collar, jc, { shade: (L) => { L.fillStyle = tint(jc, 0.25); L.beginPath(); L.ellipse(CX - 80, 468, 30, 8, 0.3, 0, Math.PI * 2); L.fill(); L.fillStyle = shade(jc, 0.25); L.beginPath(); L.ellipse(CX + 90, 500, 20, 30, 0.6, 0, Math.PI * 2); L.fill(); } });
    // toggles
    for (const y of [580, 640]) {
      inked(ctx, [P((p) => p.roundRect(CX - 104, y - 5, 22, 10, 5))], { fill: '#f7efe0', line: '#5a4320', lw: 1.6 });
    }
  }, {
    behind(ctx, b, o) {
      // bunched hood behind the neck
      const jc = o.jacket;
      cloth(ctx, [P((p) => smoothClosed(p, [[CX - 120, 476], [CX - 80, 430], [CX, 418], [CX + 80, 430], [CX + 120, 476], [CX, 470]]))], jc, {
        shade: (L) => { L.fillStyle = shade(jc, 0.32); L.fillRect(CX - 140, 440, 280, 50); },
      });
    },
  }),

  vest(ctx, b, o) {
    const shirt = [P((p) => torso(p, b))];
    cloth(ctx, shirt, o.shirt, { shade: (L) => { sideShade(L, '#e2e2ec', b); L.strokeStyle = '#d6d6e2'; L.lineWidth = 1.4; for (const s of [-1, 1]) { L.beginPath(); L.moveTo(CX + s * b.sw * 0.9, b.sy + 30); L.quadraticCurveTo(CX + s * b.sw * 0.8, b.sy + 80, CX + s * b.sw * 0.95, b.sy + 140); L.stroke(); } } });
    // charcoal vest V
    const vc = o.vest;
    const vest = [P((p) => {
      for (const s of [-1, 1]) {
        p.moveTo(CX + s * 36, 470); p.bezierCurveTo(CX + s * 70, 476, CX + s * b.sw * 0.62, b.sy, CX + s * b.sw * 0.72, b.sy + 6);
        p.bezierCurveTo(CX + s * b.sw * 0.86, b.sy + 60, CX + s * b.sw * 0.9, b.sy + 120, CX + s * (b.bw - 20), 700);
        p.lineTo(CX, 700); p.lineTo(CX, 610); p.closePath();
      }
    })];
    cloth(ctx, vest, vc, { line: '#141418', shade: (L) => { L.fillStyle = '#1c1c24'; L.fillRect(CX + 60, 480, 120, 240); } });
    // green apron with neck strap
    const ac = o.apron;
    const apron = [P((p) => {
      p.moveTo(CX - 70, 700); p.lineTo(CX - 64, 614); p.quadraticCurveTo(CX - 62, 600, CX - 48, 600); p.lineTo(CX + 48, 600); p.quadraticCurveTo(CX + 62, 600, CX + 64, 614); p.lineTo(CX + 70, 700); p.closePath();
      lock(p, [CX - 54, 606], [CX - 34, 448], 12, -10, 5); lock(p, [CX + 54, 606], [CX + 34, 448], 12, 10, 5);
    })];
    cloth(ctx, apron, ac, { shade: (L) => { L.fillStyle = shade(ac, 0.3); L.fillRect(CX + 26, 590, 60, 140); L.strokeStyle = tint(ac, 0.35); L.lineWidth = 1.3; L.setLineDash([4, 3]); L.beginPath(); L.moveTo(CX - 56, 614); L.lineTo(CX + 56, 614); L.stroke(); L.setLineDash([]); } });
    // shirt collar points
    const collar = [P((p) => {
      for (const s of [-1, 1]) { p.moveTo(CX + s * 4, 470); p.lineTo(CX + s * 30, 436); p.quadraticCurveTo(CX + s * 50, 450, CX + s * 60, 470); p.lineTo(CX + s * 22, 492); p.closePath(); }
    })];
    cloth(ctx, collar, '#ffffff', { lw: 2.2, shade: (L) => { L.fillStyle = '#dcdce8'; L.beginPath(); L.ellipse(CX + 40, 470, 18, 10, 0.5, 0, Math.PI * 2); L.fill(); } });
    buttons(ctx, [[CX - 18, 640], [CX - 18, 680]], '#9a9aa8');
  },

  shawl(ctx, b, o) {
    const dress = [P((p) => torso(p, b))];
    cloth(ctx, dress, o.dress, { shade: (L) => sideShade(L, shade(o.dress, 0.22), b, CX + 20) });
    ctx.strokeStyle = lineOf(o.dress); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(CX - 54, 462); ctx.quadraticCurveTo(CX, 512, CX + 54, 462); ctx.stroke();
    // lace trim
    ctx.fillStyle = '#fffbea';
    for (let i = -4; i <= 4; i++) { const x = CX + i * 11, y = 487 - Math.abs(i) * Math.abs(i) * 1.2; ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI); ctx.fill(); }
    const sc = o.shawl;
    const shawl = [P((p) => {
      for (const s of [-1, 1]) {
        p.moveTo(CX + s * 48, 452); p.bezierCurveTo(CX + s * 100, 456, CX + s * b.sw * 0.84, b.sy - 16, CX + s * b.sw * 0.98, b.sy);
        p.bezierCurveTo(CX + s * b.sw * 1.14, b.sy + 20, CX + s * b.sw * 1.18, b.sy + 60, CX + s * (b.bw + 10), b.sy + 120);
        p.lineTo(CX + s * (b.bw + 12), 700); p.lineTo(CX + s * 20, 700);
        p.bezierCurveTo(CX + s * 40, 620, CX + s * 70, 540, CX + s * 48, 452); p.closePath();
      }
    })];
    cloth(ctx, shawl, sc, {
      line: '#121530',
      shade: (L) => {
        sideShade(L, mix(sc, '#0a0c22', 0.45), b, CX + 50);
        L.fillStyle = tint(sc, 0.12);
        L.beginPath(); L.ellipse(CX - 150, 500, 40, 14, -0.4, 0, Math.PI * 2); L.fill();
        L.strokeStyle = rgba('#121530', 0.6); L.lineWidth = 1.5;
        for (const s of [-1, 1]) for (const d of [0, 40]) { L.beginPath(); L.moveTo(CX + s * (110 + d), b.sy + 10); L.quadraticCurveTo(CX + s * (100 + d), 600, CX + s * (80 + d), 700); L.stroke(); }
        // embroidered stars
        L.fillStyle = o.star;
        const rnd = [[-150, 520, 7], [-110, 590, 5], [-170, 630, 6], [-80, 660, 5], [-130, 480, 4], [140, 530, 6], [100, 610, 5], [170, 650, 7], [120, 480, 4], [70, 680, 5]];
        for (const [x, y, r] of rnd) { const sp = new Path2D(); starPath(sp, CX + x, y, r, r * 0.42, 0.2); L.fill(sp); }
      },
    });
    // star brooch
    const br = P((p) => starPath(p, CX + 38, 566, 15, 6.5, 0));
    cloth(ctx, [br], o.star, { lw: 1.8, line: '#8a6a10', shade: (L) => { L.fillStyle = '#fff6c0'; L.beginPath(); L.arc(CX + 34, 561, 3, 0, Math.PI * 2); L.fill(); } });
  },

  mayor(ctx, b, o) {
    const shirt = [P((p) => torso(p, b))];
    cloth(ctx, shirt, o.shirt);
    // waistcoat
    const wc = o.waistcoat;
    const vest = [P((p) => {
      for (const s of [-1, 1]) {
        p.moveTo(CX + s * 20, 500); p.lineTo(CX + s * 70, 480); p.lineTo(CX + s * 150, 520); p.lineTo(CX + s * 170, 700); p.lineTo(CX, 700); p.lineTo(CX, 600); p.closePath();
      }
    })];
    cloth(ctx, vest, wc, { shade: (L) => { L.fillStyle = shade(wc, 0.3); L.fillRect(CX + 40, 480, 140, 240); } });
    // tie
    const tc = o.tie;
    const tie = [P((p) => { p.moveTo(CX - 14, 470); p.lineTo(CX + 14, 470); p.lineTo(CX + 8, 486); p.lineTo(CX + 18, 590); p.lineTo(CX, 612); p.lineTo(CX - 18, 590); p.lineTo(CX - 8, 486); p.closePath(); })];
    cloth(ctx, tie, tc, { lw: 2, shade: (L) => { L.fillStyle = shade(tc, 0.3); L.fillRect(CX + 2, 470, 20, 150); L.strokeStyle = tint(tc, 0.3); L.lineWidth = 3; for (const y of [510, 540, 570]) { L.beginPath(); L.moveTo(CX - 20, y); L.lineTo(CX + 20, y - 14); L.stroke(); } } });
    // shirt collar
    const collar = [P((p) => { for (const s of [-1, 1]) { p.moveTo(CX + s * 6, 472); p.lineTo(CX + s * 36, 432); p.quadraticCurveTo(CX + s * 52, 448, CX + s * 58, 466); p.lineTo(CX + s * 24, 496); p.closePath(); } })];
    cloth(ctx, collar, o.shirt, { lw: 2.2 });
    // tweed jacket with lapels
    const jc = o.jacket;
    const jacket = [P((p) => {
      for (const s of [-1, 1]) {
        p.moveTo(CX + s * 52, 454); p.bezierCurveTo(CX + s * 100, 466, CX + s * b.sw * 0.8, b.sy - 10, CX + s * b.sw * 0.92, b.sy);
        p.bezierCurveTo(CX + s * b.sw * 1.1, b.sy + 16, CX + s * b.sw * 1.14, b.sy + 50, CX + s * (b.bw + 4), b.sy + 110);
        p.lineTo(CX + s * (b.bw + 6), 700); p.lineTo(CX + s * 140, 700); p.lineTo(CX + s * 120, 600); p.lineTo(CX + s * 96, 540); p.lineTo(CX + s * 110, 520); p.lineTo(CX + s * 70, 480); p.closePath();
      }
    })];
    cloth(ctx, jacket, jc, {
      shade: (L) => {
        sideShade(L, shade(jc, 0.3), b, CX + 130);
        // tweed flecks
        L.fillStyle = rgba(ink(jc, 0.4), 0.35);
        for (let y = 470; y < 700; y += 9) for (let x = 60; x < 250; x += 9) {
          const j = ((x * 7 + y * 13) % 5) - 2;
          L.fillRect(CX - x + j, y + j, 3, 1.4); L.fillRect(CX + x - j, y + 3, 1.4, 3);
        }
        L.strokeStyle = rgba(ink(jc, 0.6), 0.7); L.lineWidth = 1.5;
        for (const s of [-1, 1]) { L.beginPath(); L.moveTo(CX + s * 110, 520); L.lineTo(CX + s * 140, 560); L.stroke(); }
      },
    });
    // gold watch chain across the waistcoat
    ctx.strokeStyle = ink(o.chain, 0.3); ctx.lineWidth = 3; ctx.setLineDash([4, 2]);
    ctx.beginPath(); ctx.moveTo(CX - 4, 640); ctx.quadraticCurveTo(CX + 50, 680, CX + 100, 642); ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = o.chain; ctx.lineWidth = 1.6; ctx.setLineDash([4, 2]);
    ctx.beginPath(); ctx.moveTo(CX - 4, 640); ctx.quadraticCurveTo(CX + 50, 680, CX + 100, 642); ctx.stroke();
    ctx.setLineDash([]);
    buttons(ctx, [[CX - 4, 620], [CX - 4, 664]], o.chain);
  },

  postal(ctx, b, o) {
    const jc = o.jacket;
    const jacket = [P((p) => torso(p, b))];
    cloth(ctx, jacket, jc, {
      shade: (L) => {
        sideShade(L, shade(jc, 0.28), b, CX + 30);
        L.strokeStyle = rgba(lineOf(jc), 0.6); L.lineWidth = 1.8;
        L.beginPath(); L.moveTo(CX, 500); L.lineTo(CX, 700); L.stroke();
        for (const s of [-1, 1]) { L.beginPath(); L.moveTo(CX + s * b.sw * 0.95, b.sy + 10); L.quadraticCurveTo(CX + s * b.sw * 0.84, b.sy + 80, CX + s * b.sw * 0.98, 700); L.stroke(); }
        // chest pocket
        L.strokeRect(CX - 120, 560, 56, 46);
        L.beginPath(); L.moveTo(CX - 124, 560); L.lineTo(CX - 60, 560); L.lineTo(CX - 70, 578); L.lineTo(CX - 114, 578); L.closePath(); L.stroke();
      },
    });
    // shirt V
    const v = [P((p) => { p.moveTo(CX - 34, 450); p.lineTo(CX, 506); p.lineTo(CX + 34, 450); p.closePath(); })];
    cloth(ctx, v, o.shirt, { lw: 2 });
    // collar
    const collar = [P((p) => { for (const s of [-1, 1]) { p.moveTo(CX + s * 2, 506); p.lineTo(CX + s * 28, 436); p.quadraticCurveTo(CX + s * 60, 446, CX + s * 78, 464); p.lineTo(CX + s * 56, 520); p.closePath(); } })];
    cloth(ctx, collar, shade(jc, 0.12), { shade: (L) => { L.fillStyle = tint(jc, 0.2); L.beginPath(); L.ellipse(CX - 40, 456, 20, 6, -0.4, 0, Math.PI * 2); L.fill(); } });
    // satchel strap (diagonal)
    const sc = o.strap;
    const strap = [P((p) => { p.moveTo(CX - 150, 480); p.lineTo(CX - 120, 470); p.lineTo(CX + 150, 700); p.lineTo(CX + 112, 700); p.closePath(); })];
    cloth(ctx, strap, sc, { shade: (L) => { L.strokeStyle = tint(sc, 0.3); L.lineWidth = 1.3; L.setLineDash([4, 3]); L.beginPath(); L.moveTo(CX - 140, 482); L.lineTo(CX + 126, 700); L.stroke(); L.setLineDash([]); } });
    cloth(ctx, [P((p) => p.roundRect(CX - 26, 560, 26, 22, 3))], '#e8c14a', { lw: 2, shade: (L) => { L.fillStyle = sc; L.fillRect(CX - 20, 566, 14, 10); } });
    buttons(ctx, [[CX + 20, 540], [CX + 20, 600], [CX + 20, 660]], o.button);
    // postal badge
    cloth(ctx, [P((p) => ellipse(p, CX + 100, 560, 12, 12))], o.button, { lw: 1.8, shade: (L) => { L.fillStyle = '#fff'; L.fillRect(CX + 93, 555, 14, 10); L.strokeStyle = '#a06a20'; L.lineWidth = 1.2; L.beginPath(); L.moveTo(CX + 93, 555); L.lineTo(CX + 100, 561); L.lineTo(CX + 107, 555); L.stroke(); } });
  },

  nana(ctx, b, o) {
    const dress = [P((p) => torso(p, b))];
    cloth(ctx, dress, o.dress, { shade: (L) => sideShade(L, shade(o.dress, 0.28), b, CX + 20) });
    // white apron top
    const ap = [P((p) => { p.moveTo(CX - 70, 700); p.lineTo(CX - 64, 600); p.lineTo(CX + 64, 600); p.lineTo(CX + 70, 700); p.closePath(); })];
    cloth(ctx, ap, o.apron, { shade: (L) => { L.fillStyle = '#e6e2ee'; L.fillRect(CX + 30, 590, 50, 120); } });
    // round collar
    const collar = [P((p) => { smoothClosed(p, [[CX, 470], [CX - 40, 452], [CX - 58, 470], [CX - 30, 494]]); smoothClosed(p, [[CX, 470], [CX + 40, 452], [CX + 58, 470], [CX + 30, 494]]); })];
    cloth(ctx, collar, '#fbf6ee', { lw: 2 });
    // knitted shawl
    const sc = o.shawl;
    const shawl = [P((p) => {
      p.moveTo(CX - 60, 456);
      p.bezierCurveTo(CX - 110, 462, CX - b.sw * 0.86, b.sy - 16, CX - b.sw, b.sy);
      p.bezierCurveTo(CX - b.sw * 1.16, b.sy + 20, CX - b.sw * 1.2, b.sy + 60, CX - b.bw - 10, b.sy + 120);
      p.lineTo(CX - b.bw - 12, 700); p.lineTo(CX + b.bw + 12, 700); p.lineTo(CX + b.bw + 10, b.sy + 120);
      p.bezierCurveTo(CX + b.sw * 1.2, b.sy + 60, CX + b.sw * 1.16, b.sy + 20, CX + b.sw, b.sy);
      p.bezierCurveTo(CX + b.sw * 0.86, b.sy - 16, CX + 110, 462, CX + 60, 456);
      p.bezierCurveTo(CX + 80, 520, CX + 50, 580, CX, 588);
      p.bezierCurveTo(CX - 50, 580, CX - 80, 520, CX - 60, 456);
      p.closePath();
      p.moveTo(CX - 70, 700); p.lineTo(CX - 60, 620); p.lineTo(CX + 60, 620); p.lineTo(CX + 70, 700); p.closePath();
    })];
    const holeFree = [P((p) => {
      p.moveTo(CX - 60, 456);
      p.bezierCurveTo(CX - 110, 462, CX - b.sw * 0.86, b.sy - 16, CX - b.sw, b.sy);
      p.bezierCurveTo(CX - b.sw * 1.16, b.sy + 20, CX - b.sw * 1.2, b.sy + 60, CX - b.bw - 10, b.sy + 120);
      p.lineTo(CX - b.bw - 12, 700); p.lineTo(CX - 110, 700);
      p.bezierCurveTo(CX - 90, 640, CX - 40, 600, CX, 590);
      p.bezierCurveTo(CX - 50, 580, CX - 80, 520, CX - 60, 456); p.closePath();
      p.moveTo(CX + 60, 456);
      p.bezierCurveTo(CX + 110, 462, CX + b.sw * 0.86, b.sy - 16, CX + b.sw, b.sy);
      p.bezierCurveTo(CX + b.sw * 1.16, b.sy + 20, CX + b.sw * 1.2, b.sy + 60, CX + b.bw + 10, b.sy + 120);
      p.lineTo(CX + b.bw + 12, 700); p.lineTo(CX + 110, 700);
      p.bezierCurveTo(CX + 90, 640, CX + 40, 600, CX, 590);
      p.bezierCurveTo(CX + 50, 580, CX + 80, 520, CX + 60, 456); p.closePath();
    })];
    void shawl;
    cloth(ctx, holeFree, sc, {
      shade: (L) => {
        sideShade(L, shade(sc, 0.3), b, CX + 60);
        L.strokeStyle = rgba(ink(sc, 0.5), 0.45); L.lineWidth = 1.3;
        for (let y = 470; y < 700; y += 13) for (let x = -230; x <= 230; x += 13) {
          const xx = CX + x + ((y / 13) % 2) * 6;
          L.beginPath(); L.moveTo(xx - 4, y); L.lineTo(xx, y + 5); L.lineTo(xx + 4, y); L.stroke();
        }
      },
    });
    // shawl knot / brooch
    cloth(ctx, [P((p) => ellipse(p, CX, 590, 16, 12))], shade(sc, 0.15), { lw: 2 });
    cloth(ctx, [P((p) => ellipse(p, CX, 590, 7, 6))], '#f4e2c8', { lw: 1.6, line: '#7a5a3a' });
  },

  sailor(ctx, b, o) {
    const sw = o.sweater;
    const body = [P((p) => torso(p, b))];
    cloth(ctx, body, sw, {
      shade: (L) => {
        L.fillStyle = o.stripe;
        for (let y = 520; y < 700; y += 36) {
          L.beginPath(); L.moveTo(0, y); L.quadraticCurveTo(CX, y + 14, 512, y); L.lineTo(512, y + 14); L.quadraticCurveTo(CX, y + 28, 0, y + 14); L.closePath(); L.fill();
        }
        L.globalAlpha = 0.28; sideShade(L, '#3a3040', b, CX + 60); L.globalAlpha = 1;
        L.strokeStyle = rgba(ink(sw, 0.5), 0.4); L.lineWidth = 1.2;
        for (const s of [-1, 1]) { L.beginPath(); L.moveTo(CX + s * b.sw * 0.94, b.sy + 6); L.quadraticCurveTo(CX + s * b.sw * 0.86, b.sy + 80, CX + s * b.sw, 700); L.stroke(); }
      },
    });
    // roll neck
    const roll = [P((p) => { p.moveTo(CX - 62, 456); p.bezierCurveTo(CX - 64, 416, CX + 64, 416, CX + 62, 456); p.bezierCurveTo(CX + 60, 486, CX - 60, 486, CX - 62, 456); p.closePath(); })];
    cloth(ctx, roll, sw, {
      shade: (L) => {
        L.fillStyle = shade(sw, 0.22); L.fillRect(CX + 20, 410, 60, 80);
        L.strokeStyle = rgba(ink(sw, 0.5), 0.5); L.lineWidth = 1.4;
        for (let x = -54; x <= 54; x += 9) { L.beginPath(); L.moveTo(CX + x, 432 + Math.abs(x) * 0.15); L.lineTo(CX + x * 1.04, 474 - Math.abs(x) * 0.1); L.stroke(); }
      },
    });
  },
};
OUTFITS.baker.neckDepth = 470;

function drawScarf(ctx, b, spec) {
  const base = spec.outfit.ribbon || spec.outfit.apron || spec.outfit.jacket || spec.outfit.shawl || spec.outfit.waistcoat || '#c0504d';
  const c = tint(mix(base, '#c4544a', 0.4), 0.12);
  const scarf = [P((p) => {
    p.moveTo(CX - 70, 450); p.bezierCurveTo(CX - 72, 410, CX + 72, 410, CX + 70, 450);
    p.bezierCurveTo(CX + 72, 492, CX - 72, 492, CX - 70, 450); p.closePath();
    p.moveTo(CX + 22, 470); p.lineTo(CX + 64, 470); p.lineTo(CX + 72, 600); p.lineTo(CX + 30, 600); p.closePath();
  })];
  inked(ctx, scarf, {
    fill: c, line: ink(c, 0.65), lw: 2.6,
    shade: (L) => {
      L.fillStyle = shade(c, 0.28); L.fillRect(CX + 40, 400, 60, 220);
      L.fillStyle = tint(c, 0.55);
      for (let y = 488; y < 600; y += 22) L.fillRect(CX + 22, y, 52, 8);
      L.strokeStyle = rgba(ink(c, 0.5), 0.5); L.lineWidth = 1.3;
      for (let x = -60; x <= 60; x += 10) { L.beginPath(); L.moveTo(CX + x, 428); L.lineTo(CX + x, 478); L.stroke(); }
    },
  });
  ctx.strokeStyle = ink(c, 0.3); ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  for (let x = CX + 34; x <= CX + 70; x += 7) { ctx.beginPath(); ctx.moveTo(x, 600); ctx.lineTo(x + 1, 612); ctx.stroke(); }
}
