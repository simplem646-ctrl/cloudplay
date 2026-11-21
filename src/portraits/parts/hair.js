// Hair styles. Each style returns layered Path2D groups plus shading callbacks:
//   back:   paths drawn behind the body (long hair, nape mass)
//   front:  paths drawn over the face (cap, bangs, side locks)
//   locks:  bang lock descriptors used for cel streaks + strand lines
//   faceShadow(p): adds the cast-shadow silhouette of the bangs onto the face
//   after(ctx): accessories that sit on the hair (headband, goggles, clip, needle, cap)
import { P, lock, spindle, smoothClosed, puffs, ellipse, mix, ink, tint, rgba, inked, mx } from '../util.js';

const CX = 256;

// ---------------------------------------------------------------- shared shading

/** Highlight "angel ring": smooth upper edge, toothed lower edge, on a dome. */
export function angelRing(L, color, { cx = CX, cy = 250, rx = 172, ry = 142, a0 = 1.1, a1 = 1.9, s1 = 0.74, s2 = 0.6, teeth = 12, depth = 0.07, alpha = 1 } = {}) {
  const p = new Path2D();
  const N = 40;
  for (let i = 0; i <= N; i++) {
    const a = Math.PI * (a0 + (a1 - a0) * (i / N));
    const x = cx + rx * s1 * Math.cos(a), y = cy + ry * s1 * Math.sin(a);
    if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
  }
  const M = teeth * 2;
  for (let i = M; i >= 0; i--) {
    const a = Math.PI * (a0 + (a1 - a0) * (i / M));
    const s = i % 2 ? s2 : s2 + depth;
    p.lineTo(cx + rx * s * Math.cos(a), cy + ry * s * Math.sin(a));
  }
  p.closePath();
  L.globalAlpha = alpha;
  L.fillStyle = color;
  L.fill(p);
  L.globalAlpha = 1;
}

/** Cel streak on the shadow side (viewer's right) of each lock + thin strand lines. */
function lockShade(L, locks, shadeC) {
  L.fillStyle = shadeC;
  for (const k of locks) {
    if (k.noShade) continue;
    const [r, t, w, b] = [k.r, k.t, k.w, k.b || 0];
    const dx = t[0] - r[0], dy = t[1] - r[1], len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const s = k.side || (nx < 0 ? 1 : -1); // shade toward +x
    const off = w * 0.3 * s;
    const p = new Path2D();
    lock(p, [r[0] + nx * off + dx * 0.35, r[1] + ny * off + dy * 0.35], t, w * 0.3, b);
    L.fill(p);
  }
}

function strands(L, locks, lineC, lw = 1.2, hiC = null) {
  if (hiC) {
    // glossy highlight streak on long locks (lit side)
    L.fillStyle = hiC;
    for (const k of locks) {
      const dx = k.t[0] - k.r[0], dy = k.t[1] - k.r[1], len = Math.hypot(dx, dy);
      if (len < 150) continue;
      const nx = -dy / len, ny = dx / len, o = k.w * 0.18 * (nx < 0 ? 1 : -1);
      const b = Array.isArray(k.b) ? k.b[0] : (k.b || 0);
      const p = new Path2D();
      spindle(p, [k.r[0] + dx * 0.3 + nx * o, k.r[1] + dy * 0.3 + ny * o], [k.r[0] + dx * 0.62 + nx * o, k.r[1] + dy * 0.62 + ny * o], 2.4, b * 0.3);
      L.fill(p);
    }
  }
  L.fillStyle = lineC;
  for (const k of locks) {
    if (k.noStrand) continue;
    const [r, t, w] = [k.r, k.t, k.w];
    const b = Array.isArray(k.b) ? k.b[1] : (k.b || 0);
    const dx = t[0] - r[0], dy = t[1] - r[1], len = Math.hypot(dx, dy);
    const nx = -dy / len, ny = dx / len;
    const o = -w * 0.12;
    const a = [t[0] - dx * 0.1 + nx * o, t[1] - dy * 0.1 + ny * o];
    const e = [t[0] - dx * 0.55 + nx * (o - w * 0.05), t[1] - dy * 0.55 + ny * (o - w * 0.05)];
    const p = new Path2D();
    spindle(p, a, e, lw, b * 0.35);
    L.fill(p);
  }
}

function lockPaths(locks) {
  return locks.map((k) => P((p) => lock(p, k.r, k.t, k.w, k.b || 0, k.tw || 0)));
}

/** Mirror lock descriptors around the centre line. */
function mirrorLocks(locks) {
  return locks.map((k) => ({ ...k, r: [2 * CX - k.r[0], k.r[1]], t: [2 * CX - k.t[0], k.t[1]], b: Array.isArray(k.b) ? k.b.map((v) => -v) : -(k.b || 0), side: k.side ? -k.side : undefined }));
}

/** Standard dome cap used under the bangs. */
function capPath(p, { top = 98, w = 142, y = 262, cy = 250 } = {}) {
  p.moveTo(CX - w, y);
  p.bezierCurveTo(CX - w - 4, cy - 70, CX - w * 0.62, top, CX, top);
  p.bezierCurveTo(CX + w * 0.62, top, CX + w + 4, cy - 70, CX + w, y);
  p.bezierCurveTo(CX + w * 0.6, 190, CX - w * 0.6, 190, CX - w, y);
  p.closePath();
}

// ---------------------------------------------------------------- styles

const STYLES = {
  // Mira: soft side-swept bangs, thick braid over her left shoulder (viewer's right)
  braid(h) {
    const locks = [
      { r: [310, 150], t: [154, 250], w: 74, b: [-20, -10] },
      { r: [296, 152], t: [196, 286], w: 68, b: [-12, -6] },
      { r: [298, 154], t: [244, 276], w: 60, b: [-8, -2] },
      { r: [310, 154], t: [292, 288], w: 52, b: [2, 4] },
      { r: [326, 156], t: [336, 270], w: 50, b: [10, 8] },
      { r: [340, 160], t: [376, 248], w: 46, b: [14, 8] },
      { r: [176, 196], t: [136, 400], w: 50, b: [-12, 10], tw: 0 },
      { r: [190, 214], t: [168, 352], w: 26, b: [-6, 4] },
      { r: [356, 196], t: [378, 318], w: 36, b: [10, -2] },
    ];
    const braid = [];
    const pts = [[378, 318], [392, 362], [398, 406], [398, 450], [394, 494], [388, 536]];
    for (let i = 0; i < pts.length; i++) {
      const [x, y] = pts[i];
      const k = 1 - i * 0.06;
      braid.push({ x: x - 9 * k, y, rx: 25 * k, ry: 20, rot: 0.55 });
      braid.push({ x: x + 9 * k, y: y + 20, rx: 25 * k, ry: 20, rot: -0.55 });
    }
    return {
      back: [P((p) => smoothClosed(p, [[256, 96], [372, 132], [402, 250], [396, 340], [350, 396], [162, 396], [116, 340], [110, 250], [140, 132]]))],
      front: [P((p) => capPath(p)), ...lockPaths(locks)],
      locks,
      braid,
      faceShadow: (p) => { for (const k of locks.slice(0, 6)) lock(p, [k.r[0] + 4, k.r[1] + 14], [k.t[0] + 4, k.t[1] + 14], k.w, k.b); },
    };
  },

  // Willa: long straight hair with a blunt fringe
  longBangs(h) {
    const side = [
      { r: [150, 214], t: [140, 560], w: 54, b: [-6, 4], noShade: false },
      { r: [176, 238], t: [170, 470], w: 26, b: [-4, 2] },
    ];
    const locks = [...side, ...mirrorLocks(side)];
    const fringe = (p, oy = 0) => {
      p.moveTo(116, 270 + oy);
      p.bezierCurveTo(112, 170, 170, 98, 256, 98);
      p.bezierCurveTo(342, 98, 400, 170, 396, 270 + oy);
      const xs = [380, 360, 340, 320, 300, 280, 256, 232, 212, 192, 172, 152, 132];
      xs.forEach((x, i) => {
        const y = 262 + oy + (i % 2 ? 6 : 0) + Math.sin(i * 1.7) * 1.5 + (Math.abs(x - 256) < 60 ? 3 : 0);
        p.lineTo(x, y);
      });
      p.closePath();
    };
    return {
      back: [P((p) => smoothClosed(p, [[256, 96], [366, 120], [406, 220], [414, 380], [422, 560], [428, 660], [84, 660], [90, 560], [98, 380], [106, 220], [146, 120]]))],
      backShade: (L, c) => { L.fillStyle = c; L.beginPath(); L.ellipse(256, 430, 150, 250, 0, 0, Math.PI * 2); L.fill(); },
      front: [P((p) => fringe(p)), ...lockPaths(locks)],
      locks,
      fringeLines: true,
      faceShadow: (p) => fringe(p, 12),
    };
  },

  // Juno: short, messy copper tufts sticking out
  tufts(h) {
    const locks = [
      { r: [220, 140], t: [150, 250], w: 70, b: [-14, -4] },
      { r: [230, 140], t: [196, 278], w: 56, b: [-6, 4] },
      { r: [262, 138], t: [246, 266], w: 52, b: [4, 2] },
      { r: [284, 140], t: [296, 284], w: 52, b: [8, -2] },
      { r: [300, 140], t: [346, 262], w: 56, b: [12, 2] },
      { r: [320, 150], t: [380, 236], w: 54, b: [10, 4] },
      // side tufts (stick out)
      { r: [150, 210], t: [96, 262], w: 40, b: [8, 2] },
      { r: [140, 190], t: [92, 176], w: 36, b: [-10, 0] },
      { r: [362, 210], t: [416, 258], w: 40, b: [-8, -2] },
      { r: [372, 188], t: [418, 168], w: 34, b: [10, 0] },
      { r: [150, 236], t: [140, 312], w: 32, b: [-4, 2] },
      { r: [362, 236], t: [372, 306], w: 30, b: [4, -2] },
      // crown tufts
      { r: [236, 120], t: [206, 70], w: 40, b: [6, 2] },
      { r: [270, 118], t: [290, 74], w: 38, b: [-6, -2] },
      { r: [300, 124], t: [338, 96], w: 34, b: [-6, 0] },
    ];
    return {
      back: [P((p) => smoothClosed(p, [[256, 98], [370, 130], [402, 240], [392, 330], [360, 372], [152, 372], [120, 330], [110, 240], [142, 130]])),
        P((p) => { lock(p, [140, 320], [112, 384], 34, -4); lock(p, [372, 320], [404, 382], 34, 4); })],
      front: [P((p) => capPath(p, { top: 102 })), ...lockPaths(locks)],
      locks,
      faceShadow: (p) => { for (const k of locks.slice(0, 6)) lock(p, [k.r[0] + 4, k.r[1] + 14], [k.t[0] + 4, k.t[1] + 14], k.w, k.b); },
    };
  },

  // Rhea: sleek chin-length bob, side part on viewer's left, left side tucked behind the ear
  bob(h) {
    const locks = [
      { r: [214, 140], t: [126, 300], w: 62, b: [-22, -8] }, // left panel, tucked behind ear
      { r: [226, 142], t: [318, 262], w: 96, b: [16, 20] }, // swept fringe
      { r: [272, 142], t: [376, 330], w: 92, b: [20, 14] },
      { r: [326, 160], t: [394, 410], w: 72, b: [18, 0] }, // right panel to jaw
      { r: [352, 260], t: [366, 412], w: 40, b: [2, -10] },
    ];
    const back = [[256, 94], [368, 122], [408, 230], [410, 340], [400, 404], [372, 420], [330, 404], [182, 404], [140, 420], [112, 404], [102, 340], [104, 230], [144, 122]];
    return {
      back: [P((p) => smoothClosed(p, back))],
      backShade: (L, c) => { L.fillStyle = c; L.beginPath(); L.ellipse(256, 380, 130, 120, 0, 0, Math.PI * 2); L.fill(); },
      front: [P((p) => capPath(p, { top: 96, w: 144 })), ...lockPaths(locks)],
      locks,
      sleek: true,
      faceShadow: (p) => { lock(p, [226, 130], [322, 276], 104, [18, 22]); lock(p, [274, 132], [380, 346], 100, [22, 16]); lock(p, [212, 134], [126, 314], 66, [-22, -8]); },
    };
  },

  // Celeste: long wavy hair, half-up, centre-ish soft bangs
  wavy(h) {
    const bangs = [
      { r: [250, 142], t: [158, 262], w: 72, b: [-16, 10] },
      { r: [246, 134], t: [204, 288], w: 58, b: [-6, 8] },
      { r: [262, 134], t: [262, 280], w: 50, b: [6, -6] },
      { r: [272, 134], t: [314, 290], w: 58, b: [8, -8] },
      { r: [276, 142], t: [360, 258], w: 70, b: [16, -10] },
    ];
    const side = [
      { r: [152, 216], t: [128, 580], w: 56, b: [-26, 26] },
      { r: [178, 240], t: [170, 470], w: 30, b: [-14, 14] },
    ];
    const locks = [...bangs, ...side, ...mirrorLocks(side)];
    const L = [], R = [];
    for (let i = 0; i <= 8; i++) {
      const y = 230 + i * 56;
      const wob = Math.sin(i * 1.6) * 14;
      L.push([104 - i * 3 + wob, y]);
      R.push([408 + i * 3 - wob, y]);
    }
    const back = [[256, 92], [374, 118], ...R, [436, 700], [76, 700], ...L.reverse(), [138, 118]];
    return {
      back: [P((p) => smoothClosed(p, back, 0.9)), P((p) => smoothClosed(p, [[214, 96], [240, 62], [282, 60], [306, 92], [256, 110]]))],
      backShade: (L2, c) => { L2.fillStyle = c; L2.beginPath(); L2.ellipse(256, 440, 160, 260, 0, 0, Math.PI * 2); L2.fill(); },
      front: [P((p) => capPath(p, { top: 98, w: 140 })), ...lockPaths(locks)],
      locks,
      faceShadow: (p) => { for (const k of bangs) lock(p, [k.r[0] + 4, k.r[1] + 14], [k.t[0] + 4, k.t[1] + 14], k.w, k.b); },
    };
  },

  // Odell: bald crown, fluffy white side tufts
  bald(h) {
    const tuft = [[124, 236, 16], [114, 258, 18], [116, 284, 18], [126, 306, 15], [140, 222, 13]];
    return {
      back: [],
      front: [P((p) => { puffs(p, tuft); puffs(p, mx(CX, tuft)); })],
      locks: [],
      tuftLines: [...tuft, ...mx(CX, tuft)],
    };
  },

  // Theo: spiky sandy hair, goggles pushed up
  spiky(h) {
    const spikes = [];
    const ang = [0.93, 1.02, 1.12, 1.2, 1.29, 1.37, 1.45, 1.53, 1.62, 1.7, 1.79, 1.88, 1.98, 2.07];
    const len = [150, 176, 168, 192, 178, 198, 186, 200, 184, 196, 176, 186, 166, 150];
    const wid = [70, 84, 80, 90, 86, 92, 84, 90, 86, 90, 82, 86, 78, 70];
    ang.forEach((a0, i) => {
      const a = Math.PI * a0;
      const lean = (a0 - 1.5) * 0.5; // spikes lean outward and slightly up
      const tx = 256 + Math.cos(a + lean * 0.4) * len[i], ty = 250 + Math.sin(a + lean * 0.4) * len[i] * 0.92 - 6;
      spikes.push({ r: [256 + Math.cos(a) * 64, 240 + Math.sin(a) * 64], t: [tx, ty], w: wid[i], b: ((i * 5) % 3 - 1) * 10, noStrand: true, noShade: true });
    });
    const locks = [
      { r: [214, 150], t: [150, 268], w: 68, b: [-8, 6] },
      { r: [236, 150], t: [206, 290], w: 56, b: [-4, 6] },
      { r: [262, 150], t: [262, 276], w: 54, b: [4, -2] },
      { r: [286, 150], t: [318, 292], w: 58, b: [8, -4] },
      { r: [306, 150], t: [372, 262], w: 64, b: [12, -6] },
      { r: [154, 226], t: [146, 330], w: 34, b: [-6, 2] },
      { r: [360, 226], t: [370, 326], w: 32, b: [6, -2] },
    ];
    return {
      back: [P((p) => smoothClosed(p, [[256, 110], [366, 140], [398, 250], [386, 340], [352, 374], [160, 374], [126, 340], [114, 250], [146, 140]])),
        ...lockPaths(spikes)],
      front: [P((p) => capPath(p, { top: 104 })), ...lockPaths(locks)],
      locks: [...locks],
      backLocks: spikes,
      faceShadow: (p) => { for (const k of locks.slice(0, 5)) lock(p, [k.r[0] + 4, k.r[1] + 14], [k.t[0] + 4, k.t[1] + 14], k.w, k.b); },
    };
  },

  // Nana Fen: silver hair swept back into a top bun with a knitting needle
  bun(h) {
    const wisps = [
      { r: [150, 214], t: [138, 304], w: 22, b: [-6, 4] },
      { r: [362, 214], t: [374, 300], w: 20, b: [6, -4] },
    ];
    const capF = (p) => {
      p.moveTo(118, 300);
      p.bezierCurveTo(108, 170, 170, 104, 256, 104);
      p.bezierCurveTo(342, 104, 404, 170, 394, 300);
      p.bezierCurveTo(380, 250, 372, 220, 352, 196);
      p.bezierCurveTo(320, 168, 290, 180, 256, 178);
      p.bezierCurveTo(222, 180, 192, 168, 160, 196);
      p.bezierCurveTo(140, 220, 130, 250, 118, 300);
      p.closePath();
    };
    return {
      back: [P((p) => smoothClosed(p, [[256, 104], [366, 136], [400, 250], [388, 330], [124, 330], [112, 250], [146, 136]]))],
      front: [P((p) => ellipse(p, 256, 86, 58, 46)), P(capF), ...lockPaths(wisps)],
      locks: wisps,
      bun: true,
      
    };
  },

  // Gus: navy knit cap, grey tufts at the sides
  cap(h) {
    const tufts = [
      { r: [140, 214], t: [116, 280], w: 34, b: [-6, 4] },
      { r: [146, 220], t: [130, 300], w: 26, b: [-4, 2] },
      { r: [154, 226], t: [150, 290], w: 20, b: [-2, 2] },
    ];
    const locks = [...tufts, ...mirrorLocks(tufts)];
    return {
      back: [P((p) => smoothClosed(p, [[256, 110], [366, 140], [396, 250], [388, 330], [124, 330], [116, 250], [146, 140]]))],
      front: lockPaths(locks),
      locks,
      knitCap: true,
    };
  },
};

// ---------------------------------------------------------------- drawing

export function buildHair(spec) {
  const f = STYLES[spec.hair.style];
  return f(spec);
}

export function hairColors(spec) {
  const hc = spec.hair;
  const light = hex(hc.base) > 0.6;
  return {
    base: hc.base, shade: hc.shade, hi: hc.hi,
    line: ink(hc.shade, light ? 0.62 : 0.62),
    strand: ink(hc.shade, light ? 0.35 : 0.4),
  };
}

function hex(c) {
  const n = parseInt(c.slice(1), 16);
  return (((n >> 16) & 255) * 0.3 + ((n >> 8) & 255) * 0.59 + (n & 255) * 0.11) / 255;
}

export function drawHairBack(ctx, hair, spec) {
  if (!hair.back.length) return;
  const c = hairColors(spec);
  inked(ctx, hair.back, {
    fill: c.base, line: c.line, lw: 2.6,
    shade: (L) => {
      if (hair.backShade) hair.backShade(L, c.shade);
      else { L.fillStyle = c.shade; L.beginPath(); L.ellipse(256, 380, 140, 110, 0, 0, Math.PI * 2); L.fill(); }
      if (hair.backLocks) {
        L.fillStyle = c.shade;
        for (const k of hair.backLocks) {
          const p = new Path2D();
          lock(p, [k.r[0] * 0.5 + k.t[0] * 0.5 + 8, k.r[1] * 0.5 + k.t[1] * 0.5 + 6], [k.t[0] + 3, k.t[1] + 2], k.w * 0.32, 0);
          L.fill(p);
        }
        angelRing(L, c.hi, { cy: 246, rx: 180, ry: 150, s1: 0.86, s2: 0.74, alpha: 0.85 });
      }
      if (spec.hair.style === 'longBangs' || spec.hair.style === 'wavy') {
        // long strand lines on back hair
        L.fillStyle = c.strand;
        const xs = spec.hair.style === 'wavy' ? [104, 124, 388, 408] : [108, 126, 386, 404];
        for (const x of xs) {
          const p = new Path2D();
          spindle(p, [x, 420], [x + (x < 256 ? -6 : 6), 640], 1.3, spec.hair.style === 'wavy' ? 14 : 2);
          L.fill(p);
        }
      }
    },
  });
}

/** Front hair (cap + bangs + side locks) over the face. */
export function drawHairFront(ctx, hair, spec) {
  const c = hairColors(spec);
  const st = spec.hair.style;
  if (hair.front.length) {
    inked(ctx, hair.front, {
      fill: c.base, line: c.line, lw: 2.6,
      shade: (L) => {
        if (st === 'bald') {
          // soft single shadow on the lower half of each tuft cluster + wispy lines
          L.fillStyle = c.shade;
          L.beginPath(); L.ellipse(128, 300, 22, 30, 0, 0, Math.PI * 2); L.ellipse(384, 300, 22, 30, 0, 0, Math.PI * 2); L.fill();
          L.strokeStyle = c.strand; L.lineWidth = 1.2;
          for (const s of [-1, 1]) for (const [y, d] of [[244, 0], [266, 6], [290, 2]]) {
            const x = 256 + s * (128 - d);
            L.beginPath(); L.moveTo(x - s * 6, y - 6); L.quadraticCurveTo(x + s * 4, y, x - s * 2, y + 10); L.stroke();
          }
          return;
        }
        if (st === 'bun') {
          // swept-back strands + bun shading
          L.fillStyle = c.shade;
          L.beginPath(); L.ellipse(272, 98, 44, 34, 0.2, 0, Math.PI * 2); L.fill();
          L.fillStyle = c.base;
          L.beginPath(); L.ellipse(250, 80, 40, 28, 0.2, 0, Math.PI * 2); L.fill();
          L.fillStyle = c.shade;
          const sp = new Path2D();
          lock(sp, [330, 150], [384, 300], 30, [10, 0]);
          lock(sp, [182, 150], [128, 300], 26, [-10, 0]);
          L.fill(sp);
          angelRing(L, c.hi, { cy: 250, rx: 160, ry: 146, s1: 0.8, s2: 0.68, teeth: 9, alpha: 0.95 });
          L.fillStyle = c.strand;
          for (const [a, b, bend] of [[[180, 200], [232, 120], -10], [[210, 186], [246, 118], -6], [[300, 186], [266, 118], 6], [[332, 200], [280, 120], 10], [[150, 250], [186, 150], -12], [[362, 250], [326, 150], 12]]) {
            const p = new Path2D(); spindle(p, a, b, 1.2, bend); L.fill(p);
          }
          for (const [a, b, bend] of [[[220, 92], [292, 76], -10], [[226, 108], [300, 92], -8], [[214, 76], [270, 58], -6]]) {
            const p = new Path2D(); spindle(p, a, b, 1.2, bend); L.fill(p);
          }
          lockShade(L, hair.locks, c.shade);
          return;
        }
        lockShade(L, hair.locks, c.shade);
        if (st === 'longBangs') {
          L.fillStyle = c.shade;
          L.fillRect(100, 236, 312, 40);
        }
        if (st !== 'cap') {
          angelRing(L, c.hi, {
            s1: hair.sleek ? 0.78 : 0.74, s2: hair.sleek ? 0.58 : 0.61, teeth: hair.sleek ? 8 : 12,
            depth: hair.sleek ? 0.09 : 0.07, alpha: 0.95,
          });
          // thin secondary sheen above the ring
          angelRing(L, tint(c.hi, 0.4), { s1: 0.8, s2: 0.765, teeth: 0, depth: 0, alpha: 0.7, a0: 1.2, a1: 1.45 });
          if (hair.sleek) {
            // long glossy sweep on the bob
            L.fillStyle = rgba(c.hi, 0.9);
            const p = new Path2D();
            lock(p, [300, 190], [384, 360], 18, [10, 4]);
            lock(p, [196, 176], [140, 290], 14, [-8, -2]);
            L.fill(p);
          }
        }
        strands(L, hair.locks, c.strand, 1.25, rgba(c.hi, 0.85));
        if (st === 'longBangs') {
          L.fillStyle = c.strand;
          for (const x of [150, 190, 228, 270, 310, 348]) {
            const p = new Path2D(); spindle(p, [x, 262], [x + 2, 214], 1.1, 0); L.fill(p);
          }
        }
      },
    });
  }
  if (hair.braid) drawBraid(ctx, hair, spec, c);
}

function drawBraid(ctx, hair, spec, c) {
  const segs = hair.braid.map((s) => P((p) => ellipse(p, s.x, s.y, s.rx, s.ry, s.rot)));
  inked(ctx, segs, {
    fill: c.base, line: c.line, lw: 2.6,
    shade: (L) => {
      L.fillStyle = c.shade;
      for (const s of hair.braid) { L.beginPath(); L.ellipse(s.x + 6 * Math.sign(s.rot), s.y + 6, s.rx * 0.7, s.ry * 0.55, s.rot, 0, Math.PI * 2); L.fill(); }
      L.fillStyle = rgba(c.hi, 0.9);
      for (const s of hair.braid) { L.beginPath(); L.ellipse(s.x - 6 * Math.sign(s.rot), s.y - 7, s.rx * 0.45, s.ry * 0.2, s.rot, 0, Math.PI * 2); L.fill(); }
      // segment separation lines (drawn per segment in order so later ones overlap)
      L.strokeStyle = c.line;
      L.lineWidth = 1.6;
      for (const s of hair.braid) {
        L.beginPath();
        L.ellipse(s.x, s.y, s.rx, s.ry, s.rot, Math.PI * 1.05, Math.PI * 1.95);
        L.stroke();
      }
    },
  });
  // braid tail + ribbon
  const last = hair.braid[hair.braid.length - 1];
  const bx = last.x - 6, by = last.y + 18;
  const tail = [P((p) => { lock(p, [bx - 8, by], [bx - 18, by + 56], 26, -6); lock(p, [bx + 6, by], [bx + 14, by + 60], 24, 6); lock(p, [bx, by], [bx - 2, by + 70], 22, 0); })];
  inked(ctx, tail, { fill: c.base, line: c.line, lw: 2.4, shade: (L) => { L.fillStyle = c.shade; const p = new Path2D(); lock(p, [bx + 6, by + 6], [bx + 12, by + 60], 12, 4); L.fill(p); } });
  const rc = spec.outfit.ribbon || '#ff9fb5';
  const bow = [P((p) => {
    smoothClosed(p, [[bx - 2, by - 2], [bx - 34, by - 22], [bx - 42, by + 4], [bx - 30, by + 14]]);
    smoothClosed(p, [[bx + 2, by - 2], [bx + 32, by - 24], [bx + 42, by + 2], [bx + 30, by + 14]]);
    lock(p, [bx - 4, by + 4], [bx - 20, by + 44], 14, -4, 4);
    lock(p, [bx + 4, by + 4], [bx + 20, by + 42], 14, 4, 4);
    ellipse(p, bx, by, 9, 8);
  })];
  inked(ctx, bow, {
    fill: rc, line: ink(rc, 0.65), lw: 2.2,
    shade: (L) => {
      L.fillStyle = mix(rc, '#c0405e', 0.45);
      L.beginPath(); L.ellipse(bx - 30, by + 6, 10, 6, 0, 0, Math.PI * 2); L.ellipse(bx + 32, by + 6, 10, 6, 0, 0, Math.PI * 2); L.fill();
      L.fillStyle = tint(rc, 0.6);
      L.beginPath(); L.ellipse(bx - 26, by - 10, 8, 3, -0.5, 0, Math.PI * 2); L.ellipse(bx + 24, by - 12, 8, 3, 0.5, 0, Math.PI * 2); L.fill();
    },
  });
}

/** Accessories that sit on the hair: headband, goggles, star clip, needle, knit cap. */
export function drawHairAccessories(ctx, hair, spec) {
  const ex = spec.extras || {};
  const c = hairColors(spec);
  if (ex.headband) {
    const hb = ex.headband;
    const band = P((p) => {
      const N = 30;
      for (let i = 0; i <= N; i++) {
        const a = Math.PI * (1.06 + 0.88 * (i / N));
        const x = 256 + 146 * Math.cos(a), y = 262 + 150 * Math.sin(a);
        if (i === 0) p.moveTo(x, y); else p.lineTo(x, y);
      }
      for (let i = N; i >= 0; i--) {
        const a = Math.PI * (1.06 + 0.88 * (i / N));
        p.lineTo(256 + 140 * Math.cos(a), 262 + 132 * Math.sin(a));
      }
      p.closePath();
    });
    inked(ctx, [band], {
      fill: hb, line: ink(hb, 0.6), lw: 2.4,
      shade: (L) => { L.fillStyle = tint(hb, 0.25); L.beginPath(); L.ellipse(200, 120, 50, 8, -0.5, 0, Math.PI * 2); L.fill(); },
    });
    // tufts poking over the band
    const t = [{ r: [236, 132], t: [212, 84], w: 30, b: [6, 2] }, { r: [274, 130], t: [290, 86], w: 28, b: [-6, -2] }];
    inked(ctx, lockPaths(t), { fill: c.base, line: c.line, lw: 2.4, shade: (L) => lockShade(L, t, c.shade) });
  }
  if (ex.goggles) {
    const lens = ex.goggles;
    const strap = P((p) => {
      p.moveTo(116, 214); p.bezierCurveTo(150, 150, 362, 150, 396, 214);
      p.lineTo(398, 230); p.bezierCurveTo(362, 168, 150, 168, 114, 230); p.closePath();
    });
    inked(ctx, [strap], { fill: '#6b5a4a', line: '#2b1d16', lw: 2.2 });
    const rims = [P((p) => { ellipse(p, 214, 150, 36, 30, -0.12); ellipse(p, 298, 150, 36, 30, 0.12); p.rect(244, 144, 24, 12); })];
    inked(ctx, rims, {
      fill: '#8a7766', line: '#2b1d16', lw: 2.4,
      shade: (L) => { L.fillStyle = '#5e4e40'; L.beginPath(); L.ellipse(220, 160, 34, 22, -0.12, 0, Math.PI * 2); L.ellipse(304, 160, 34, 22, 0.12, 0, Math.PI * 2); L.fill(); },
    });
    const lenses = [P((p) => { ellipse(p, 214, 150, 26, 21, -0.12); ellipse(p, 298, 150, 26, 21, 0.12); })];
    inked(ctx, lenses, {
      fill: lens, line: '#2b1d16', lw: 1.6,
      shade: (L) => {
        L.fillStyle = mix(lens, '#3a6f8f', 0.5);
        L.beginPath(); L.ellipse(222, 158, 22, 14, -0.12, 0, Math.PI * 2); L.ellipse(306, 158, 22, 14, 0.12, 0, Math.PI * 2); L.fill();
        L.fillStyle = 'rgba(255,255,255,0.95)';
        L.beginPath(); L.ellipse(205, 142, 9, 5, -0.6, 0, Math.PI * 2); L.ellipse(289, 142, 9, 5, -0.6, 0, Math.PI * 2); L.fill();
        L.beginPath(); L.arc(226, 160, 3, 0, Math.PI * 2); L.arc(310, 160, 3, 0, Math.PI * 2); L.fill();
      },
    });
  }
  if (ex.starClip) {
    const sc = ex.starClip;
    const star = P((p) => starPath(p, 364, 176, 22, 9, -0.25));
    inked(ctx, [star], {
      fill: sc, line: ink(sc, 0.62), lw: 2.2,
      shade: (L) => { L.fillStyle = mix(sc, '#c08a20', 0.5); const p = new Path2D(); starPath(p, 370, 182, 14, 6, -0.25); L.fill(p); L.fillStyle = '#fffbe0'; L.beginPath(); L.arc(358, 170, 3.5, 0, Math.PI * 2); L.fill(); },
    });
    const small = P((p) => starPath(p, 392, 204, 10, 4, 0.3));
    inked(ctx, [small], { fill: sc, line: ink(sc, 0.62), lw: 1.8 });
  }
  if (hair.bun && ex.needle) {
    const nc = ex.needle;
    // the needle passes through the bun: draw the two visible ends
    const a = [P((p) => { p.moveTo(176, 52); p.lineTo(212, 66); p.lineTo(210, 72); p.lineTo(174, 60); p.closePath(); ellipse(p, 172, 54, 9, 9); })];
    inked(ctx, a, { fill: nc, line: ink(nc, 0.65), lw: 2, shade: (L) => { L.fillStyle = '#e07a8a'; L.beginPath(); L.arc(172, 54, 9, 0, Math.PI * 2); L.fill(); L.fillStyle = '#fff'; L.beginPath(); L.arc(169, 51, 2.5, 0, Math.PI * 2); L.fill(); } });
    const b = [P((p) => { p.moveTo(304, 100); p.lineTo(356, 120); p.lineTo(302, 108); p.closePath(); })];
    inked(ctx, b, { fill: nc, line: ink(nc, 0.65), lw: 2 });
  }
  if (hair.knitCap) {
    const cc = ex.cap;
    const dome = P((p) => {
      p.moveTo(118, 218);
      p.bezierCurveTo(112, 120, 180, 76, 256, 76);
      p.bezierCurveTo(332, 76, 400, 120, 394, 218);
      p.closePath();
    });
    inked(ctx, [dome], {
      fill: cc, line: ink(cc, 0.65), lw: 2.6,
      shade: (L) => {
        L.fillStyle = mix(cc, '#0d1a30', 0.4);
        L.beginPath(); L.ellipse(340, 190, 90, 110, 0, 0, Math.PI * 2); L.fill();
        L.strokeStyle = mix(cc, '#0d1a30', 0.55); L.lineWidth = 1.4;
        for (let x = 140; x <= 372; x += 18) {
          L.beginPath(); L.moveTo(x, 214); L.quadraticCurveTo(256 + (x - 256) * 0.7, 120, 256 + (x - 256) * 0.25, 80); L.stroke();
        }
      },
    });
    const cuff = P((p) => {
      p.moveTo(112, 236); p.bezierCurveTo(150, 176, 362, 176, 400, 236);
      p.lineTo(398, 198); p.bezierCurveTo(362, 144, 150, 144, 114, 198); p.closePath();
    });
    inked(ctx, [cuff], {
      fill: mix(cc, '#ffffff', 0.08), line: ink(cc, 0.65), lw: 2.6,
      shade: (L) => {
        L.strokeStyle = mix(cc, '#0d1a30', 0.5); L.lineWidth = 2;
        for (let i = 0; i <= 26; i++) {
          const t = i / 26, x = 118 + t * 276;
          const yTop = 196 - Math.sin(t * Math.PI) * 44, yBot = 234 - Math.sin(t * Math.PI) * 50;
          L.beginPath(); L.moveTo(x, yTop + 2); L.lineTo(x + (x - 256) * 0.02, yBot - 2); L.stroke();
        }
        L.fillStyle = mix(cc, '#0d1a30', 0.35);
        L.beginPath(); L.ellipse(340, 214, 70, 30, 0, 0, Math.PI * 2); L.fill();
      },
    });
  }
}

export function starPath(p, x, y, R, r, rot = 0, n = 5) {
  for (let i = 0; i < n * 2; i++) {
    const a = rot - Math.PI / 2 + (i * Math.PI) / n;
    const rr = i % 2 ? r : R;
    const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
    if (i === 0) p.moveTo(px, py); else p.lineTo(px, py);
  }
  p.closePath();
}

