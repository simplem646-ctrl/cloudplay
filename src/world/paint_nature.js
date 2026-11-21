// Nature painters: flowers, grass, bushes, trees (multi-tile sheets), rocks, driftwood, shells...
import { Canvas, mix, shade, outline, hash2, SNOW, pnoise, snowCaps } from './paint_common.js';

const STEM = '#3f9a3c';
const FLOWER_COL = {
  red: '#e8403c', yellow: '#ffd23f', pink: '#f58ab4', white: '#fffaf0', blue: '#5b8cf0', purple: '#b06ae0', orange: '#ff9a3c',
};
const FLOWER_AUTUMN = {
  red: '#d4572b', yellow: '#f4b92c', pink: '#c964a8', white: '#fff1c8', blue: '#8a78d6', purple: '#a85cc8', orange: '#f08a2c',
};

function snowMound(T, ctx, x, y, w) {
  // little snow bump with soft shading
  const h = 4;
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const nx = (i + 0.5) / w * 2 - 1, ny = (j + 0.5) / h;
    const lim = Math.sqrt(Math.max(0, 1 - nx * nx));
    if (ny > 1 - lim) {
      const edge = ny < 1 - lim + 0.3 && ny > 1 - lim;
      T.px(x + i, y + j, j === 0 || (edge && i < w / 2) ? '#ffffff' : (i > w * 0.65 || j === h - 1 ? SNOW.s : SNOW.m));
    }
  }
}

export function flowers(T, ctx, set, frame = 0) {
  const { S, season } = ctx, r = ctx.rng;
  const mixed = set.startsWith('mixed');
  const pal = (k) => (season === 'autumn' ? FLOWER_AUTUMN : FLOWER_COL)[k];
  const mixSets = {
    mixed_a: ['red', 'yellow', 'white', 'pink'], mixed_b: ['blue', 'purple', 'white', 'pink'], mixed_c: ['orange', 'yellow', 'red', 'purple'],
  };
  const cols = mixed ? mixSets[set].map(pal) : [pal(set), pal(set), shade(pal(set), 0.2)];
  if (S.winter) {
    // frosted bed: snow humps with a hardy bloom or two
    snowMound(T, ctx, 1, 9, 8); snowMound(T, ctx, 7, 8, 8); snowMound(T, ctx, 3, 11, 9);
    const c = cols[0];
    T.px(5, 9, c); T.px(6, 9, shade(c, -0.2)); T.px(11, 8, cols[1]); T.px(12, 8, shade(cols[1], -0.2));
    T.px(5, 10, '#3f8a62'); T.px(11, 9, '#3f8a62');
    return;
  }
  const n = mixed ? 6 : 5;
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([2 + ((hash2(i, set.length, 17) * 12) | 0), 5 + ((hash2(i, set.length, 18) * 9) | 0)]);
  pts.sort((a, b) => a[1] - b[1]);
  const sway = frame ? 1 : 0;
  pts.forEach(([x, y], i) => {
    const c = cols[i % cols.length];
    T.px(x, y + 1, STEM); T.px(x, y + 2, STEM); T.px(x + (sway ? 0 : 0), y + 3, shade(STEM, -0.2));
    if (i % 3 === 0) { T.px(x - 1, y + 2, '#5bbf45'); T.px(x + 1, y + 3, '#5bbf45'); }
    const hx = x + (i % 2 ? sway : -sway) * 0;
    // head: plus shape, centre lighter
    T.px(hx, y - 1, c); T.px(hx - 1, y, c); T.px(hx + 1, y, c); T.px(hx, y + 1, c);
    T.px(hx, y, i % 2 ? '#fff6c0' : shade(c, 0.45));
    T.px(hx - 1, y + 1, shade(c, -0.3)); T.px(hx + 1, y + 1, shade(c, -0.3));
    if (sway) { T.px(hx + 1, y - 1, shade(c, 0.1)); T.px(hx - 1, y - 1, null); }
  });
}

export function tallgrass(T, ctx, v = 0, frame = 0) {
  const { S } = ctx, r = ctx.rng;
  const col = S.winter ? ['#b8a888', '#d8cdb0', '#8a7a5a'] : ctx.season === 'autumn' ? ['#b8a23c', '#d9c457', '#8a7a2c'] : [S.grassD, S.grassL, S.grassX];
  const blades = v ? 9 : 7;
  for (let i = 0; i < blades; i++) {
    const x = 1 + ((i * 13 + v * 5) % 14), h = 5 + ((i * 7 + v * 3) % 6);
    const lean = ((i % 3) - 1) * (frame ? 1 : 0) + ((i + v) % 2 ? 0 : 0);
    for (let k = 0; k < h; k++) {
      const xx = x + Math.round(lean * k / h * 1.5) + (frame && k > h / 2 ? (i % 2 ? 1 : -1) : 0);
      T.px(xx, 15 - k, k > h * 0.6 ? col[1] : (i % 2 ? col[0] : col[2]));
    }
  }
  if (S.winter) { for (let i = 0; i < 4; i++) T.px(2 + i * 3, 12 + (i % 2), '#ffffff'); snowMound(T, ctx, 2, 12, 12); }
}

export function tuft(T, ctx, v = 0) {
  const { S } = ctx;
  if (S.winter) { snowMound(T, ctx, 3, 10, 10); T.px(8, 9, '#7da58e'); T.px(7, 10, '#a6c8b4'); return; }
  const c = [S.grassD, S.grassL];
  [[4, 12], [8, 13], [11, 12], [6, 10]].forEach(([x, y], i) => {
    T.px(x, y, c[0]); T.px(x, y - 1, c[1]); T.px(x + 1, y - 2 + (i % 2), c[1]); T.px(x - 1, y - 2, c[0]);
  });
}

export function clover(T, ctx) {
  const { S } = ctx;
  if (S.winter) { snowMound(T, ctx, 2, 11, 12); return; }
  for (const [x, y] of [[4, 10], [9, 8], [11, 12], [6, 13]]) {
    T.px(x, y, '#5bbf45'); T.px(x + 1, y, '#3f9a3c'); T.px(x, y - 1, '#7ad65a'); T.px(x + 1, y - 1, '#5bbf45');
  }
  T.px(9, 6, '#ffffff'); T.px(9, 7, '#d8f0c8'); T.px(4, 8, '#ffffff'); T.px(4, 9, '#d8f0c8');
}

export function weeds(T, ctx, v = 0) {
  const { S } = ctx, r = ctx.rng;
  if (S.winter) { snowMound(T, ctx, 2, 10, 12); T.px(5, 8, '#8a7a5a'); T.px(5, 9, '#8a7a5a'); T.px(10, 7, '#8a7a5a'); T.px(10, 8, '#8a7a5a'); T.px(10, 6, '#ffffff'); return; }
  const dead = ctx.season === 'autumn';
  for (let i = 0; i < 5; i++) {
    const x = 2 + i * 3, h = 4 + ((i * 5) % 5);
    for (let k = 0; k < h; k++) T.px(x + (k > 2 ? (i % 2 ? 1 : -1) : 0), 14 - k, dead ? (k % 2 ? '#a89040' : '#7a6a2c') : (k % 2 ? '#5bbf45' : '#3f9a3c'));
    T.px(x + (i % 2 ? 1 : -1), 14 - h, v ? '#ffffff' : '#f4d23c');
  }
}

export function mushrooms(T, ctx, v = 0) {
  const caps = v ? ['#e8e0c8', '#d0c4a0'] : ['#e84a3c', '#c8342c'];
  const dots = v ? '#a89c78' : '#ffffff';
  const draw = (x, y, s) => {
    T.rect(x + (s ? 1 : 1), y + 2, s ? 2 : 3, s ? 2 : 3, '#f2ead0');
    T.px(x + (s ? 2 : 3), y + 3, shade('#f2ead0', -0.15));
    const w = s ? 5 : 7;
    for (let j = 0; j < (s ? 2 : 3); j++) for (let i = 0; i < w - (j === 0 ? 2 : 0); i++) T.px(x - (s ? 1 : 2) + i + (j === 0 ? 1 : 0) + 1, y + j, j === 2 ? caps[1] : caps[0]);
    T.px(x + 1, y, dots); T.px(x + 3, y + 1, dots);
  };
  draw(4, 8, false); draw(10, 11, true);
  if (ctx.S.winter) snowMound(T, ctx, 2, 12, 12);
}

export function ferns(T, ctx, v = 0) {
  const { S } = ctx;
  const c = S.winter ? ['#5a7a62', '#8cae98'] : [S.grassX, S.grassL];
  const frond = (x, y, dir) => {
    for (let k = 0; k < 7; k++) { T.px(x + dir * Math.floor(k * 0.7), y - k, c[0]); T.px(x + dir * Math.floor(k * 0.7) + dir, y - k + 1, c[1]); T.px(x + dir * Math.floor(k * 0.7) - dir, y - k + 1, c[1]); }
  };
  frond(8, 14, 0); frond(7, 14, -1); frond(9, 14, 1);
  if (S.winter) snowMound(T, ctx, 2, 12, 12);
}

export function reeds(T, ctx, v = 0, frame = 0) {
  const { S } = ctx;
  const stem = S.winter ? '#b8a888' : '#6a9a3a', stemL = S.winter ? '#d8cdb0' : '#8cc050';
  [[4, 11, 8], [7, 13, 10], [10, 12, 9], [12, 13, 7]].forEach(([x, y, h], i) => {
    for (let k = 0; k < h; k++) T.px(x + (frame && k > 5 ? (i % 2 ? 1 : -1) : 0), y - k, k % 3 === 0 ? stemL : stem);
    if (i % 2 === 0) { const hx = x + (frame ? (i % 2 ? 1 : -1) : 0); T.rect(hx, y - h - 2, 2, 3, '#7a4f2e'); T.px(hx, y - h - 2, '#a56c3c'); T.px(hx, y - h - 3, stem); }
  });
  if (S.winter) { T.px(4, 3, '#fff'); T.px(10, 2, '#fff'); }
}

export function lilypad(T, ctx, v = 0) {
  const g = ctx.S.winter ? ['#d8eefa', '#b0d2ea'] : ['#4faa4a', '#6fcc5c'];
  const draw = (cx, cy, r) => {
    T.ellipse(cx, cy, r, r * 0.75, g[0]);
    T.ellipse(cx - 0.5, cy - 0.5, r * 0.6, r * 0.4, g[1]);
    T.px(cx + r - 1, cy, null);
  };
  draw(6, 8, 4); draw(12, 12, 3);
  if (!ctx.S.winter && ctx.season !== 'autumn') { T.px(5, 6, '#ffb8d0'); T.px(6, 6, '#ffffff'); T.px(5, 7, '#f58ab4'); }
}

// ------------------------------------------------------------------ bushes
export function bush(T, ctx, v = 0) {
  const { S } = ctx;
  const P = S.bush;
  // ground shadow
  T.ellipse(8, 13.5, 7, 2, '#1d2340', 55);
  const M = (x, y) => {
    const d = (cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
    return d(8, 9.5, 7, 4.8) || d(5, 8.5, 4.2, 4) || d(11, 8.5, 4.2, 4) || d(8, 6.5, 4, 3.6);
  };
  const small = v === 3;
  const Mf = small ? (x, y) => M(x * 1.25 - 1.5, y * 1.25 - 4) : M;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!Mf(x, y)) continue;
    const edge = !Mf(x - 1, y) || !Mf(x + 1, y) || !Mf(x, y - 1) || !Mf(x, y + 1);
    let c = P.m;
    if (!Mf(x - 2, y - 2)) c = P.l;
    else if (!Mf(x + 2, y + 2) || y > 11) c = P.d;
    else if (hash2(x, y, 4) > 0.78) c = P.l;
    else if (hash2(x, y, 5) < 0.2) c = P.d;
    if (edge) c = P.o;
    T.px(x, y, c);
  }
  if (!S.winter) {
    if (v === 1) { for (const [x, y] of [[5, 8], [9, 6], [11, 9], [7, 10], [4, 10]]) { T.px(x, y, '#e8403c'); T.px(x, y - 1, '#ff8a7a'); } }
    if (v === 2) { const cols = S.bloom; for (let i = 0; i < 8; i++) { const x = 3 + ((hash2(i, 2, 7) * 10) | 0), y = 4 + ((hash2(i, 3, 7) * 7) | 0); if (Mf(x, y) && Mf(x - 1, y) && Mf(x + 1, y)) { T.px(x, y, cols[i % cols.length]); T.px(x + 1, y, shade(cols[i % cols.length], -0.15)); } } }
  } else {
    snowCaps(T, ctx, 3);
    if (v === 1) { T.px(6, 8, '#e8403c'); T.px(10, 9, '#e8403c'); }
  }
}

// ------------------------------------------------------------------ trees
function treeColors(ctx, kind) {
  const { S } = ctx;
  if (kind === 'cherry') return S.cherry;
  if (kind === 'pine') return S.pine;
  if (kind === 'round2') return S.leaf2;
  return S.leaf;
}

/** union-of-discs silhouette: discs = [cx, cy, rx, ry] */
function silhouette(w, h, discs) {
  const m = new Uint8Array(w * h);
  for (const [cx, cy, rx, ry] of discs) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1) m[y * w + x] = 1;
    }
  }
  return m;
}

function paintCanopy(C, ctx, kind, w, h, discs, seed) {
  const P = treeColors(ctx, kind);
  const winter = ctx.S.winter;
  const r = ctx.rng;
  // bubbly canopy: each disc is a leaf mass with its own light/dark sides; later discs overlap earlier ones
  for (const [cx, cy, rx, ry] of discs) {
    for (let y = Math.floor(cy - ry) - 1; y <= Math.ceil(cy + ry) + 1; y++) {
      for (let x = Math.floor(cx - rx) - 1; x <= Math.ceil(cx + rx) + 1; x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        const d2 = dx * dx + dy * dy;
        if (d2 > 1) continue;
        let c = P.m;
        const lightDir = -(dx * 0.65 + dy * 0.75);
        if (d2 > 0.76 || (rx > 8 && d2 > 0.7 && (x + y) % 2 === 0 && false)) c = P.o;
        else if (lightDir > 0.42) c = P.l;
        else if (lightDir < -0.35) c = P.d;
        else if (hash2(x, y, seed) > 0.86) c = P.l;
        else if (hash2(x, y, seed + 1) < 0.14) c = P.d;
        C.px(x, y, c);
      }
    }
  }
  // soft darker underside across the whole canopy (the lower rim reads as shade)
  for (let y = Math.floor(h * 0.62); y < h; y++) for (let x = 0; x < w; x++) {
    const a = C.get(x, y);
    if (!a || a[3] === 0) continue;
    const hex = '#' + ((1 << 24) | (a[0] << 16) | (a[1] << 8) | a[2]).toString(16).slice(1);
    if (hex === P.o) continue;
    if (y > h * 0.62 && (x + y) % 2 === 0 || y > h * 0.8) C.px(x, y, shade(hex, -0.2));
  }
  // leaf flecks
  for (let i = 0; i < Math.round(w * h / 45); i++) {
    const x = r.int(4, w - 6), y = r.int(3, h - 8);
    if (C.alpha(x, y) && C.alpha(x + 2, y) && C.alpha(x + 1, y + 2)) {
      C.px(x, y, P.l); C.px(x + 1, y, P.l); C.px(x + 1, y + 1, P.m);
      C.px(x + 2, y + 2, P.d);
    }
  }
  if (winter) {
    for (let i = 0; i < 14; i++) {
      const x = r.int(5, w - 8), y = r.int(5, h - 8);
      if (!C.alpha(x, y)) continue;
      C.px(x, y, '#8a6a58'); C.px(x + 1, y + 1, '#8a6a58'); C.px(x + 2, y + 1, '#6c5448'); C.px(x - 1, y + 1, '#6c5448');
    }
    // twigs poking out of the silhouette
    for (let i = 0; i < 10; i++) {
      const x = r.int(3, w - 4), y = r.int(2, h - 4);
      if (!C.alpha(x, y) && (C.alpha(x, y + 1) || C.alpha(x + 1, y) || C.alpha(x - 1, y))) { C.px(x, y, '#6c5448'); C.px(x + (i % 2 ? 1 : -1), y - 1, '#6c5448'); }
    }
  }
  if (kind === 'cherry' && ctx.season === 'spring') {
    for (let i = 0; i < 60; i++) {
      const x = r.int(2, w - 3), y = r.int(2, h - 5);
      if (C.alpha(x, y) && C.alpha(x + 1, y) && C.alpha(x, y + 1) && C.alpha(x - 1, y) && C.alpha(x, y - 1)) { C.px(x, y, '#ffffff'); C.px(x + 1, y, '#fbd0dc'); }
    }
  }
  if (ctx.season === 'spring' && kind === 'round') {
    for (let i = 0; i < 6; i++) { const x = r.int(3, w - 4), y = r.int(3, h - 6); if (C.alpha(x, y) && C.alpha(x + 1, y)) { C.px(x, y, '#ffffff'); C.px(x + 1, y, '#f9d6e0'); } }
  }
  if (ctx.season === 'autumn') { // a few green-gold holdouts for colour variety
    for (let i = 0; i < 14; i++) {
      const x = r.int(4, w - 6), y = r.int(3, h - 8);
      if (C.alpha(x, y) && C.alpha(x + 1, y)) { C.px(x, y, '#ffe27a'); C.px(x + 1, y, '#f7c04e'); }
    }
  }
}

function bareTree(C, ctx, kind, w, h) {
  // winter: branch lattice dusted with snow
  const r = ctx.rng;
  const bark = kind === 'cherry' ? '#6a4a52' : '#6b4a38', barkD = shade(bark, -0.3), barkL = shade(bark, 0.2);
  const branch = (x, y, ang, len, th) => {
    for (let k = 0; k < len; k++) {
      const px = x + Math.cos(ang) * k, py = y + Math.sin(ang) * k;
      C.px(px, py, k % 3 === 0 ? barkL : bark);
      if (th > 1) { C.px(px + 1, py, barkD); }
      if (k > len * 0.45 && k % 4 === 2 && th > 0) {
        const sub = ang + (k % 8 < 4 ? -0.7 : 0.7);
        const sl = Math.floor(len * 0.4);
        for (let q = 0; q < sl; q++) C.px(px + Math.cos(sub) * q, py + Math.sin(sub) * q, bark);
      }
    }
    return [x + Math.cos(ang) * len, y + Math.sin(ang) * len];
  };
  const cx = Math.floor(w / 2);
  for (let k = 0; k < h; k++) { C.px(cx - 1, h - 1 - k, barkD); C.px(cx, h - 1 - k, bark); C.px(cx + 1, h - 1 - k, barkL); if (k < 6) C.px(cx + 2, h - 1 - k, barkD); }
  const angs = [-2.5, -2.1, -1.8, -1.57, -1.3, -1.0, -0.65, -2.8, -0.35];
  const tips = [];
  angs.forEach((a, i) => {
    const sy = h - 6 - (i % 3) * 3;
    const [ex, ey] = branch(cx + (a > -1.57 ? 1 : -1), sy, a, 9 + ((i * 5) % 8), 1);
    tips.push([ex, ey]);
  });
  // snow clumps along branches
  const snow = (x, y, rr) => { C.ellipse(x, y, rr, rr * 0.6, SNOW.m); C.ellipse(x - 0.5, y - 0.7, rr * 0.7, rr * 0.4, '#ffffff'); C.px(x + rr - 1, y + 1, SNOW.s); };
  tips.forEach(([x, y]) => { snow(x, y - 1, 2.5); });
  for (let i = 0; i < 9; i++) snow(cx - 14 + ((hash2(i, 1, 33) * 28) | 0), 5 + ((hash2(i, 2, 33) * (h - 14)) | 0), 2.4 + hash2(i, 3, 33));
  for (let i = 0; i < 10; i++) C.px(r.int(2, w - 3), r.int(2, h - 8), '#ffffff');
}

export const SHEETS = {
  // 3x2 canopy (+ trunk drawn by 'trunk'): round / cherry / round2
  tree: {
    w: 3, h: 2,
    draw(C, ctx, kind) {
      const discs = [[24, 9, 9, 8], [14, 14, 9, 8], [34, 14, 9, 8], [24, 17, 11, 9], [8, 22, 7.5, 7], [40, 22, 7.5, 7], [17, 23, 10, 8], [31, 23, 10, 8], [24, 25, 9, 6]];
      paintCanopy(C, ctx, kind, 48, 32, discs, 7);
    },
  },
  // 3x3 conifer
  pine: {
    w: 3, h: 3,
    draw(C, ctx) {
      const P = ctx.S.pine, winter = ctx.S.winter;
      // tiers: [apexY, bottomY, halfWidth]
      const tiers = [[1, 16, 10], [10, 30, 15], [22, 46, 21]];
      tiers.forEach(([y0, y1, hw], ti) => {
        const cx = 24;
        for (let y = y0; y <= y1; y++) {
          const t = (y - y0) / (y1 - y0);
          const half = Math.max(0, Math.round(hw * Math.pow(t, 0.85)));
          // jagged drooping lower edge
          const jag = y > y1 - 4 ? ((y - (y1 - 4)) * 1.0) : 0;
          for (let x = cx - half; x <= cx + half; x++) {
            const dx = x - cx;
            const tipDrop = y > y1 - 5 ? ((Math.abs(dx) + ti * 2) % 6 < 3 ? 1 : 0) : 0;
            if (y > y1 - 2 + tipDrop && Math.abs(dx) < half - 1) continue;
            let c = P.m;
            if (dx < -half * 0.25) c = P.l; else if (dx > half * 0.35) c = P.d;
            if (hash2(x >> 1, y >> 1, 40 + ti) > 0.8) c = dx > 0 ? P.m : P.l;
            // layered needles
            if ((y - y0) % 5 === 4 && Math.abs(dx) < half - 2) c = P.d;
            if (winter) {
              const topBand = (y - y0) < 2 + t * 6 && Math.abs(dx) <= half * 0.9;
              const sideBand = ((y - y0) % 5 === 0 && (y - y0) > 3) && Math.abs(dx) < half - 1;
              if (topBand) c = dx > 0 ? SNOW.s : (hash2(x, y, 9) > 0.7 ? SNOW.m : '#ffffff');
              else if (sideBand) c = dx > half * 0.3 ? SNOW.s : SNOW.m;
            }
            C.px(x, y, c);
          }
        }
      });
      // outline
      C.addOutline((c) => (winter && c[0] > 200 ? '#6a7c98' : P.o));
      // decorative cones/ornaments
      if (!winter) { for (const [x, y] of [[20, 30], [30, 38], [16, 40], [28, 22]]) { C.px(x, y, shade(P.m, 0.4)); C.px(x + 1, y, shade(P.l, 0.2)); } }
    },
  },
  // 3x2 palm canopy
  palm: {
    w: 3, h: 2,
    draw(C, ctx) {
      const lc = ctx.season === 'autumn' ? { l: '#9ccf4a', m: '#6aa83a', d: '#3f7a30', o: '#244e28' } : ctx.S.winter ? { l: '#7ab86a', m: '#4f9a52', d: '#2f7040', o: '#1c4a2c' } : { l: '#8fe05a', m: '#4fb840', d: '#2f8a36', o: '#1c5a2c' };
      const leaf = (ang, len) => {
        let x = 24, y = 20;
        for (let k = 0; k < len; k++) {
          const t = k / len;
          x = 24 + Math.cos(ang) * k * 1.0;
          y = 20 + Math.sin(ang) * k * 0.8 + t * t * 10 * (Math.cos(ang) > 0 ? 1 : 1);
          C.px(x, y, lc.o); C.px(x, y - 1, lc.l); C.px(x, y + 1, lc.m); C.px(x, y + 2, lc.d); C.px(x, y + 3, k < len - 4 ? lc.o : null);
          if (k % 3 === 0) { C.px(x, y + 4, lc.d); }
        }
      };
      [-0.1, 0.5, 1.1, 2.0, 2.6, 3.2, -0.6, 3.75].forEach((a, i) => leaf(a, 17 + (i % 3) * 2));
      C.ellipse(24, 20, 3, 3, '#7a4f2e'); C.ellipse(23, 19.5, 1.5, 1.5, '#a56c3c');
      C.px(21, 22, '#5a3a22'); C.px(26, 22, '#5a3a22');
      if (ctx.S.winter) for (let i = 0; i < 20; i++) C.px(6 + ((hash2(i, 3, 5) * 36) | 0), 16 + ((hash2(i, 4, 5) * 10) | 0), '#ffffff');
    },
  },
};

export function trunk(T, ctx, kind = 'round') {
  const bark = { round: '#7a4f2e', cherry: '#6f4a4f', pine: '#7a4a32', palm: '#a8814f', sapling: '#7a4f2e' }[kind];
  const o = shade(bark, -0.6), d = shade(bark, -0.3), l = shade(bark, 0.25);
  T.ellipse(8, 13.5, 7.5, 2.2, '#1d2340', 60);
  if (kind === 'palm') {
    for (let y = 0; y < 14; y++) {
      const sh = y < 5 ? 0 : (y < 9 ? 1 : 2);
      const x0 = 6 + (y > 8 ? -((y - 8) >> 1) : 0) + (y < 4 ? 0 : 0);
      T.px(x0, y, o); T.px(x0 + 1, y, l); T.px(x0 + 2, y, bark); T.px(x0 + 3, y, d); T.px(x0 + 4, y, o);
      if (y % 3 === 1) T.hline(x0 + 1, y, 3, d);
    }
    return;
  }
  const w = kind === 'pine' ? 4 : (kind === 'sapling' ? 3 : 6);
  const x0 = 8 - w / 2;
  for (let y = 0; y < 14; y++) {
    const flare = y > 10 ? y - 10 : 0;
    const xa = x0 - flare, xb = x0 + w - 1 + flare;
    T.px(xa - 0, y, o); T.px(xb, y, o);
    for (let x = xa + 1; x < xb; x++) T.px(x, y, x === xa + 1 ? l : (x >= xb - 1 ? d : bark));
    if (y % 4 === 2 && w > 3) T.px(x0 + 2, y, d);
  }
  T.hline(x0 - 3, 14, w + 6, o);
  T.px(x0 + 1, 13, shade(bark, -0.45)); T.px(x0 + w - 2, 13, shade(bark, -0.45));
  if (ctx.S.winter) { T.hline(x0 - 1, 13, w + 2, SNOW.m); T.px(x0, 12, '#fff'); T.px(x0 + w, 12, SNOW.s); }
}

export function sapling(T, ctx) {
  const P = ctx.S.leaf;
  T.ellipse(8, 13.5, 6, 2, '#1d2340', 55);
  T.rect(7, 8, 2, 6, '#7a4f2e'); T.vline(7, 8, 6, '#9a6a3c'); T.vline(9, 8, 6, '#3b2a1f');
  if (ctx.S.winter) { T.px(6, 7, '#6b4a38'); T.px(5, 6, '#6b4a38'); T.px(10, 6, '#6b4a38'); T.px(11, 5, '#6b4a38'); T.ellipse(8, 5, 3, 1.5, '#fff'); T.px(5, 5, '#fff'); T.px(11, 4, '#fff'); return; }
  const disc = (cx, cy, r, c) => T.disc(cx, cy, r, c);
  disc(8, 6, 5.5, P.o); disc(8, 6, 4.6, P.m); disc(7, 5, 3.2, P.l); T.px(10, 8, P.d); T.px(9, 9, P.d); T.px(11, 7, P.d);
}

export function stump(T, ctx, v = 0) {
  T.ellipse(8, 13, 6.5, 2, '#1d2340', 55);
  T.rect(4, 7, 8, 6, '#7a4f2e'); T.vline(4, 8, 5, '#4f3220'); T.vline(11, 8, 5, '#3b2a1f'); T.hline(5, 13, 6, '#3b2a1f');
  T.vline(5, 8, 5, '#9a6a3c'); T.vline(9, 8, 5, '#5f3d24');
  T.ellipse(8, 7, 4.5, 2.5, '#3b2a1f'); T.ellipse(8, 7, 3.8, 1.9, '#d9b078'); T.ellipse(8, 7, 2.4, 1.1, '#b88a52'); T.px(8, 7, '#8a6030');
  if (ctx.S.winter) { T.ellipse(8, 6.5, 3.8, 1.8, '#fff'); T.ellipse(8, 7, 3, 1, SNOW.m); }
  else if (v) { T.px(5, 6, '#5bbf45'); T.px(4, 7, '#3f9a3c'); T.px(11, 7, '#c8342c'); T.px(12, 7, '#f2ead0'); }
}

export function log(T, ctx, v = 0) {
  T.ellipse(8, 12.5, 7, 2, '#1d2340', 50);
  T.rect(1, 6, 14, 6, '#7a4f2e'); T.hline(1, 6, 14, '#a56c3c'); T.hline(1, 11, 14, '#3b2a1f'); T.hline(2, 10, 12, '#5f3d24');
  for (let x = 3; x < 14; x += 4) T.px(x, 8, '#4f3220');
  T.ellipse(2, 8.5, 2.2, 3.2, '#3b2a1f'); T.ellipse(2, 8.5, 1.6, 2.6, '#d9b078'); T.ellipse(2, 8.5, 0.8, 1.2, '#a8743c');
  if (ctx.S.winter) T.hline(3, 5, 11, '#ffffff'), T.hline(4, 6, 9, SNOW.m);
}

// ------------------------------------------------------------------ rocks & beach bits
export function rock(T, ctx, v = 0) {
  const base = ['#a9a498', '#9a9a9e', '#b4a898', '#9aa398'][v] || '#a9a498';
  const mossy = v === 3;
  T.ellipse(8, 13.5, 7, 2, '#1d2340', 55);
  const M = (x, y) => {
    const d = (cx, cy, rx, ry) => ((x + 0.5 - cx) / rx) ** 2 + ((y + 0.5 - cy) / ry) ** 2 <= 1;
    if (v === 1) return d(8, 9, 6.5, 4.6) || d(5, 10, 4, 3);
    if (v === 2) return d(7, 9.5, 5.4, 4.2) || d(11, 10.5, 3.5, 3);
    return d(8, 9, 6.8, 5) || d(11, 10, 4, 3.5);
  };
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    if (!M(x, y)) continue;
    const edge = !M(x - 1, y) || !M(x + 1, y) || !M(x, y - 1) || !M(x, y + 1);
    let c = base;
    if (!M(x - 2, y - 2)) c = shade(base, 0.32);
    else if (!M(x + 2, y + 1) || y > 11) c = shade(base, -0.28);
    else if (hash2(x, y, 3) > 0.9) c = shade(base, 0.15);
    if (edge) c = shade(base, -0.6);
    T.px(x, y, c);
  }
  T.px(7, 7, shade(base, -0.4)); T.px(8, 8, shade(base, -0.4)); T.px(8, 9, shade(base, -0.4));
  if (mossy) for (const [x, y] of [[4, 6], [5, 5], [6, 5], [10, 6], [11, 7], [5, 7]]) T.px(x, y, ctx.S.winter ? '#b8d2c0' : '#5bbf45');
  if (ctx.S.winter) snowCaps(T, ctx, 3);
}

export function pebbles(T, ctx, v = 0) {
  const spots = v ? [[3, 11], [8, 7], [12, 12], [6, 13]] : [[4, 9], [10, 11], [7, 13], [12, 7]];
  spots.forEach(([x, y], i) => {
    const c = i % 2 ? '#aaa496' : '#c4bdac';
    T.px(x, y, shade(c, 0.25)); T.px(x + 1, y, c); T.px(x, y + 1, shade(c, -0.25)); T.px(x + 1, y + 1, shade(c, -0.4));
  });
  if (ctx.S.winter) T.px(8, 6, '#fff');
}

export function steppingStone(T, ctx, v = 0) {
  T.ellipse(8, 9, 6, 4.5, '#6c6658'); T.ellipse(8, 8.5, 5.4, 3.8, '#c9c3b2'); T.ellipse(7.5, 8, 3.6, 2.4, '#ddd7c6');
  T.px(10, 10, '#a39d8c'); T.px(5, 10, '#a39d8c');
  if (ctx.S.winter) { T.ellipse(8, 8, 4, 2.3, '#fff'); }
}

export function driftwood(T, ctx, v = 0) {
  const w = '#b8a07c', wl = '#d8c4a0', wd = '#7e6a4c', wo = '#4f4030';
  T.ellipse(8, 12.5, 7, 1.6, '#1d2340', 40);
  if (v === 0) { T.rect(1, 8, 14, 3, w); T.hline(1, 8, 14, wl); T.hline(1, 10, 14, wd); T.hline(1, 7, 4, wo); T.hline(1, 11, 14, wo); T.vline(0, 8, 3, wo); T.vline(15, 8, 3, wo); T.px(6, 8, wo); T.px(10, 9, wo); T.rect(5, 5, 2, 3, w); T.vline(5, 5, 3, wl); T.vline(7, 5, 3, wd); }
  else if (v === 1) { T.rect(2, 9, 12, 3, w); T.hline(2, 9, 12, wl); T.hline(2, 11, 12, wd); T.hline(2, 12, 12, wo); T.hline(2, 8, 12, wo); T.rect(10, 4, 2, 5, w); T.vline(10, 4, 5, wl); T.vline(11, 4, 5, wd); T.px(10, 3, wo); T.px(11, 3, wo); T.px(9, 6, wo); }
  else { T.rect(3, 6, 4, 6, w); T.vline(3, 6, 6, wl); T.vline(6, 6, 6, wd); T.hline(3, 5, 4, wo); T.rect(7, 9, 7, 3, w); T.hline(7, 9, 7, wl); T.hline(7, 11, 7, wd); T.hline(7, 12, 7, wo); T.hline(7, 8, 7, wo); }
  if (ctx.S.winter) { T.hline(2, 7, 11, '#fff'); T.px(5, 4, '#fff'); }
}

export function shell(T, ctx, v = 0) {
  if (v === 0) { // scallop
    T.ellipse(8, 9, 4, 3.4, '#c9788a'); T.ellipse(8, 8.5, 3.4, 2.8, '#f6c6d0'); for (let i = 0; i < 4; i++) T.vline(5 + i * 2, 7, 3, '#e08fa0'); T.rect(6, 12, 4, 1, '#c9788a');
  } else if (v === 1) { // spiral
    T.ellipse(8, 9, 3.5, 3, '#c4906a'); T.ellipse(8, 9, 2.6, 2.2, '#f6e0c4'); T.px(8, 9, '#c4906a'); T.px(9, 8, '#c4906a'); T.px(7, 10, '#c4906a');
  } else { // starfish
    const c = '#f08a4b';
    for (const [x, y] of [[8, 5], [8, 6], [8, 7], [8, 8], [8, 9], [5, 7], [6, 7], [10, 7], [11, 7], [6, 11], [7, 10], [10, 11], [9, 10], [7, 9], [9, 9]]) T.px(x, y, c);
    T.px(8, 7, '#ffb870'); T.px(7, 7, '#ffb870'); T.px(9, 8, '#c8602c'); T.px(8, 4, '#c8602c');
  }
}

export function tidepool(T, ctx, frame = 0) {
  const rimC = ['#8e887a', '#6a6558'];
  T.ellipse(8, 8.5, 7.5, 5.8, rimC[1]); T.ellipse(8, 8.5, 6.8, 5.1, '#5fb4e0'); T.ellipse(8, 8, 6, 4.2, '#4a94cc');
  T.ellipse(7, 7, 3, 1.5, '#a8e2f8');
  T.px(((frame * 3 + 4) % 10) + 3, 8, '#e8faff'); T.px(((frame * 3 + 7) % 10) + 3, 10, '#a8e2f8');
  T.px(6, 10, '#f08a4b'); T.px(7, 10, '#c8602c'); T.px(11, 9, '#c9788a');
  for (let x = 2; x < 14; x++) { if (hash2(x, 1, 2) > 0.5) T.px(x, 3, '#b3ad9d'); }
  if (ctx.S.winter) for (let x = 3; x < 13; x++) T.px(x, 4 + (x % 2), '#e8f6ff');
}

export const PAINTERS = {
  flowers, tallgrass, tuft, clover, weeds, mushrooms, ferns, reeds, lilypad, bush, trunk, sapling, stump, log, rock, pebbles,
  steppingStone, driftwood, shell, tidepool,
};
