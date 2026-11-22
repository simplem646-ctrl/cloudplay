/**
 * Painterly procedural textures (Canvas2D -> THREE.CanvasTexture). Generated once at init (ground patterns per
 * season on demand). No DOM at import time. Everything is seeded so the art is identical on every run.
 *
 * Ground patterns are painted at the SAME pixel density as the ground canvas (`px` px per tile) so strokes line
 * up with the world. Building/prop textures are tileable and mostly light/neutral so vertex colours can tint them.
 */
import * as THREE from 'three';
import { mulberry32 } from '../core/util.js';

// ------------------------------------------------------------------ colour helpers
export function hexToRgb(hex) {
  if (hex.charCodeAt(0) === 114) { // 'rgb(...)' / 'rgba(...)'
    const m = hex.match(/[\d.]+/g);
    return [Number(m[0]), Number(m[1]), Number(m[2])];
  }
  const h = hex.replace('#', '');
  const n = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(n.slice(0, 2), 16), parseInt(n.slice(2, 4), 16), parseInt(n.slice(4, 6), 16)];
}
const clamp255 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v | 0);
export function rgbStr(r, g, b, a = 1) {
  return a >= 1 ? `rgb(${clamp255(r)},${clamp255(g)},${clamp255(b)})` : `rgba(${clamp255(r)},${clamp255(g)},${clamp255(b)},${a})`;
}
/** mix two hex colours, t 0..1 -> css */
export function mixHex(a, b, t, alpha = 1) {
  const A = hexToRgb(a), B = hexToRgb(b);
  return rgbStr(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t, alpha);
}
/** lighten (+) / darken (-) a hex colour by amount -1..1, optional hue warm shift */
export function shade(hex, amt, alpha = 1) {
  const [r, g, b] = hexToRgb(hex);
  if (amt >= 0) return rgbStr(r + (255 - r) * amt, g + (255 - g) * amt, b + (255 - b) * amt, alpha);
  const k = 1 + amt;
  return rgbStr(r * k, g * k * 0.99, b * k * 1.0 + (-amt) * 6, alpha);
}
export function jitterHex(hex, rng, amt = 0.08, alpha = 1) {
  return shade(hex, (rng() - 0.5) * 2 * amt, alpha);
}

export function makeCanvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.floor(w));
  c.height = Math.max(1, Math.floor(h));
  return c;
}

/** run fn at (x,y) and wrapped copies so strokes crossing the tile edge stay seamless */
function wrapDraw(S, x, y, rad, fn) {
  const xs = [0];
  const ys = [0];
  if (x - rad < 0) xs.push(S);
  if (x + rad > S) xs.push(-S);
  if (y - rad < 0) ys.push(S);
  if (y + rad > S) ys.push(-S);
  for (const dx of xs) for (const dy of ys) fn(x + dx, y + dy);
}

function softBlob(ctx, x, y, r, color, alpha) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  const [R, G, B] = typeof color === 'string' ? hexToRgb(color) : color;
  g.addColorStop(0, `rgba(${R},${G},${B},${alpha})`);
  g.addColorStop(1, `rgba(${R},${G},${B},0)`);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

function blades(ctx, S, rng, n, cols, len, w, upBias = 0.6, maxLen = 1) {
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = rng() * S;
    const y = rng() * S;
    const L = len * (0.55 + rng() * 0.9) * maxLen;
    const a = -Math.PI / 2 + (rng() - 0.5) * 2 * upBias * 1.3;
    const bend = (rng() - 0.5) * L * 0.6;
    ctx.strokeStyle = cols[(rng() * cols.length) | 0];
    ctx.lineWidth = w * (0.7 + rng() * 0.7);
    wrapDraw(S, x, y, L + 2, (px, py) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + Math.cos(a) * L * 0.5 + bend, py + Math.sin(a) * L * 0.5, px + Math.cos(a) * L, py + Math.sin(a) * L);
      ctx.stroke();
    });
  }
}

function toTexture(canvas, { repeat = true, srgb = true, anisotropy = 8, mip = true, nearest = false } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  else t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  t.generateMipmaps = mip;
  t.minFilter = mip ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter;
  t.magFilter = nearest ? THREE.NearestFilter : THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

// ------------------------------------------------------------------ SEASON PALETTES (ground)
export const SEASON_GRASS = {
  spring: { base: '#8fd16a', dark: '#6cb255', light: '#b4e583', accent: ['#ffffff', '#ffe27a', '#ffb7cf', '#d6b8ff'] },
  summer: { base: '#5fbf4a', dark: '#3d9a3a', light: '#86d85f', accent: ['#ffffff', '#ffd23f', '#ff9ab5'] },
  autumn: { base: '#c2b055', dark: '#9c8a3e', light: '#dccb75', accent: ['#e8923a', '#c2562b', '#b9772e'] },
  winter: { base: '#eef5fb', dark: '#c3d6e8', light: '#ffffff', accent: ['#ffffff', '#cfe6ff'] },
};

// ------------------------------------------------------------------ GROUND PATTERNS (px per tile aware)
/** returns a canvas of (tiles*px) square painting ground kind `kind` for `season` */
export function paintGroundPattern(kind, season, px, tiles = 8, seed = 1) {
  const S = Math.round(px * tiles);
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  const rng = mulberry32(seed * 977 + kind.length * 131 + season.length);
  const T = px; // px per tile
  const fn = PAINTERS[kind] || PAINTERS.grass;
  fn(ctx, S, T, rng, season);
  return c;
}

function blotchBase(ctx, S, T, rng, base, dark, light, nBig = 90, nSmall = 380, aBig = 0.2) {
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < nBig; i++) {
    const x = rng() * S, y = rng() * S, r = (0.7 + rng() * 2.2) * T;
    const col = rng() < 0.5 ? dark : light;
    wrapDraw(S, x, y, r, (px, py) => softBlob(ctx, px, py, r, col, aBig * (0.6 + rng() * 0.8)));
  }
  for (let i = 0; i < nSmall; i++) {
    const x = rng() * S, y = rng() * S, r = (0.1 + rng() * 0.3) * T;
    const col = rng() < 0.5 ? dark : light;
    wrapDraw(S, x, y, r, (px, py) => softBlob(ctx, px, py, r, col, 0.28));
  }
}

function drawDaisy(ctx, x, y, r, petal, centre) {
  ctx.fillStyle = petal;
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2 + x;
    ctx.beginPath();
    ctx.arc(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9, r * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = centre;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.6, 0, Math.PI * 2);
  ctx.fill();
}

const PAINTERS = {
  grass(ctx, S, T, rng, season) {
    const P = SEASON_GRASS[season] || SEASON_GRASS.spring;
    const b = hexToRgb(P.base), d = hexToRgb(P.dark), l = hexToRgb(P.light);
    blotchBase(ctx, S, T, rng, P.base, d, l, season === 'winter' ? 70 : 110, season === 'winter' ? 260 : 420, season === 'winter' ? 0.35 : 0.22);
    const cols = [rgbStr(...d, 0.8), rgbStr(...l, 0.85), rgbStr(...b, 0.9), rgbStr(...l, 0.7)];
    if (season === 'winter') {
      // dry tips poking through snow + sparkles
      blades(ctx, S, rng, Math.round(S * S / 900), ['rgba(170,150,110,0.75)', 'rgba(190,175,135,0.7)', 'rgba(200,215,230,0.8)'], T * 0.22, Math.max(1, T * 0.03));
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      for (let i = 0; i < S * S / 1400; i++) {
        const x = rng() * S, y = rng() * S, r = Math.max(0.8, T * 0.025);
        ctx.fillRect(x - r, y - r * 0.3, r * 2, r * 0.6);
        ctx.fillRect(x - r * 0.3, y - r, r * 0.6, r * 2);
      }
      return;
    }
    blades(ctx, S, rng, Math.round(S * S / 38), cols, T * 0.2, Math.max(1.1, T * 0.034), 0.6);
    // clover clusters
    const clover = rgbStr(...l, 0.9);
    ctx.fillStyle = clover;
    for (let i = 0; i < S * S / 5200; i++) {
      const x = rng() * S, y = rng() * S, r = T * 0.05;
      wrapDraw(S, x, y, r * 3, (px, py) => {
        for (let k = 0; k < 3; k++) {
          ctx.beginPath();
          ctx.arc(px + Math.cos(k * 2.1) * r, py + Math.sin(k * 2.1) * r, r, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    }
    if (season === 'autumn') {
      for (let i = 0; i < S * S / 5200; i++) {
        const x = rng() * S, y = rng() * S, r = T * (0.045 + rng() * 0.035);
        ctx.fillStyle = P.accent[(rng() * P.accent.length) | 0];
        ctx.globalAlpha = 0.85;
        wrapDraw(S, x, y, r * 2, (px, py) => {
          ctx.beginPath();
          ctx.ellipse(px, py, r * 1.6, r, rng() * 3, 0, Math.PI * 2);
          ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
    } else {
      const n = season === 'spring' ? S * S / 3600 : S * S / 6500;
      for (let i = 0; i < n; i++) {
        const x = rng() * S, y = rng() * S, r = Math.max(1.2, T * 0.035);
        const petal = P.accent[(rng() * P.accent.length) | 0];
        wrapDraw(S, x, y, r * 3, (px, py) => drawDaisy(ctx, px, py, r, petal, season === 'summer' && petal === '#ffffff' ? '#ffd23f' : '#ffcf4a'));
      }
    }
  },

  meadow(ctx, S, T, rng, season) {
    PAINTERS.grass(ctx, S, T, rng, season);
    if (season === 'winter') return;
    const cols = season === 'spring' ? ['#ffb7cf', '#fff', '#ffe27a', '#c9a4ff', '#ff9ab5'] : season === 'summer' ? ['#ff6f8f', '#ffd23f', '#fff', '#b78cff', '#ff9a4a'] : ['#e8923a', '#c2562b', '#d9b74a'];
    for (let i = 0; i < S * S / 700; i++) {
      const x = rng() * S, y = rng() * S, r = Math.max(1.3, T * (0.035 + rng() * 0.03));
      const col = cols[(rng() * cols.length) | 0];
      wrapDraw(S, x, y, r * 3, (px, py) => {
        ctx.strokeStyle = 'rgba(60,120,50,0.8)';
        ctx.lineWidth = Math.max(1, r * 0.5);
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px - r * 0.2, py + r * 1.8);
        ctx.stroke();
        drawDaisy(ctx, px, py, r, col, season === 'autumn' ? '#6a4a1a' : '#ffcf4a');
      });
    }
  },

  dirt(ctx, S, T, rng, season) {
    const base = season === 'winter' ? '#b8a58c' : season === 'autumn' ? '#c49a62' : '#cfa56f';
    blotchBase(ctx, S, T, rng, base, [150, 108, 66], [232, 200, 150], 80, 360, 0.3);
    // ruts / worn strokes
    ctx.lineCap = 'round';
    for (let i = 0; i < S / (T * 0.35); i++) {
      const x = rng() * S, y = rng() * S, L = T * (0.6 + rng() * 1.3);
      ctx.strokeStyle = rng() < 0.5 ? 'rgba(120,84,48,0.22)' : 'rgba(240,215,170,0.28)';
      ctx.lineWidth = Math.max(1, T * 0.05);
      wrapDraw(S, x, y, L, (px, py) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.quadraticCurveTo(px + L * 0.5, py + (rng() - 0.5) * T * 0.2, px + L, py + (rng() - 0.5) * T * 0.15);
        ctx.stroke();
      });
    }
    // pebbles
    for (let i = 0; i < S * S / 1500; i++) {
      const x = rng() * S, y = rng() * S, r = T * (0.025 + rng() * 0.05);
      wrapDraw(S, x, y, r * 2, (px, py) => {
        ctx.fillStyle = 'rgba(90,62,36,0.45)';
        ctx.beginPath();
        ctx.ellipse(px + r * 0.3, py + r * 0.35, r * 1.2, r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = jitterHex(rng() < 0.5 ? '#d9c3a0' : '#bfa57f', rng, 0.1);
        ctx.beginPath();
        ctx.ellipse(px, py, r * 1.2, r * 0.85, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,245,225,0.55)';
        ctx.beginPath();
        ctx.ellipse(px - r * 0.3, py - r * 0.3, r * 0.45, r * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    if (season === 'winter') {
      // trampled snow flecks
      for (let i = 0; i < S * S / 700; i++) {
        const x = rng() * S, y = rng() * S, r = T * (0.03 + rng() * 0.06);
        wrapDraw(S, x, y, r * 2, (px, py) => softBlob(ctx, px, py, r * 1.6, [245, 250, 255], 0.5));
      }
    }
  },

  gravel(ctx, S, T, rng) {
    blotchBase(ctx, S, T, rng, '#b3aca0', [120, 112, 104], [226, 220, 208], 60, 280, 0.25);
    for (let i = 0; i < S * S / 420; i++) {
      const x = rng() * S, y = rng() * S, r = T * (0.025 + rng() * 0.05);
      wrapDraw(S, x, y, r * 2, (px, py) => {
        ctx.fillStyle = 'rgba(70,64,58,0.5)';
        ctx.beginPath();
        ctx.ellipse(px + r * 0.3, py + r * 0.3, r * 1.2, r * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = jitterHex(['#d6cfc2', '#a9a094', '#c9b99f', '#b8b4ac'][(rng() * 4) | 0], rng, 0.1);
        ctx.beginPath();
        ctx.ellipse(px, py, r * 1.2, r * 0.9, rng() * 3, 0, Math.PI * 2);
        ctx.fill();
      });
    }
  },

  cobble(ctx, S, T, rng, season) {
    const mortar = '#5d5348';
    ctx.fillStyle = mortar;
    ctx.fillRect(0, 0, S, S);
    const tiles = S / T;
    const rows = Math.round(tiles / 0.42);
    const rh = S / rows;
    const palette = ['#d3c6b0', '#c4b8a6', '#d9c9ae', '#b9ad9c', '#cfbfb0', '#c7bba0', '#d8cdb9'];
    for (let r = 0; r < rows; r++) {
      const y0 = r * rh;
      // widths summing to S
      const ws = [];
      let sum = 0;
      while (sum < S - T * 0.2) {
        const w = T * (0.34 + rng() * 0.26);
        ws.push(w);
        sum += w;
      }
      const k = S / sum;
      let x = (r % 2) * T * 0.17;
      for (const w0 of ws) {
        const w = w0 * k;
        const gap = Math.max(1.2, T * 0.035);
        const bx = x + gap / 2, by = y0 + gap / 2 + (rng() - 0.5) * 1.2, bw = w - gap, bh = rh - gap;
        const rad = Math.min(bw, bh) * 0.38;
        const col = palette[(rng() * palette.length) | 0];
        const tint = (rng() - 0.5) * 0.12;
        wrapDraw(S, bx + bw / 2, by + bh / 2, bw, (cx, cy) => {
          const x0 = cx - bw / 2, y1 = cy - bh / 2;
          const g = ctx.createLinearGradient(x0, y1, x0 + bw * 0.6, y1 + bh);
          g.addColorStop(0, shade(col, 0.12 + tint));
          g.addColorStop(0.55, shade(col, tint));
          g.addColorStop(1, shade(col, -0.18 + tint));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.roundRect(x0, y1, bw, bh, rad);
          ctx.fill();
          // highlight and speckles
          ctx.fillStyle = 'rgba(255,250,235,0.35)';
          ctx.beginPath();
          ctx.ellipse(x0 + bw * 0.35, y1 + bh * 0.28, bw * 0.28, bh * 0.14, -0.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = 'rgba(80,70,60,0.18)';
          for (let q = 0; q < 4; q++) ctx.fillRect(x0 + rng() * bw, y1 + rng() * bh, 1.2, 1.2);
        });
        x += w;
      }
    }
    if (season === 'winter') {
      // snow packed into mortar lines
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < S * S / 900; i++) {
        const x = rng() * S, y = rng() * S;
        softBlob(ctx, x, y, T * 0.12, [240, 246, 255], 0.5);
      }
      ctx.globalAlpha = 1;
    }
  },

  flagstone(ctx, S, T, rng, season) {
    ctx.fillStyle = '#6e6458';
    ctx.fillRect(0, 0, S, S);
    const tiles = S / T;
    const rows = Math.max(2, Math.round(tiles / 1.0));
    const rh = S / rows;
    const palette = ['#cfc2aa', '#c4b8a2', '#d4c6ac', '#bcb19c', '#cabda4'];
    for (let r = 0; r < rows; r++) {
      const y0 = r * rh;
      const ws = [];
      let sum = 0;
      while (sum < S - T * 0.3) {
        const w = T * (0.9 + rng() * 0.6);
        ws.push(w);
        sum += w;
      }
      const k = S / sum;
      let x = rng() * T * 0.5;
      for (const w0 of ws) {
        const w = w0 * k;
        const gap = Math.max(1.5, T * 0.04);
        const col = palette[(rng() * palette.length) | 0];
        const tint = (rng() - 0.5) * 0.1;
        wrapDraw(S, x + w / 2, y0 + rh / 2, w, (cx, cy) => {
          const x0 = cx - w / 2 + gap / 2, y1 = cy - rh / 2 + gap / 2, bw = w - gap, bh = rh - gap;
          const g = ctx.createLinearGradient(x0, y1, x0 + bw * 0.7, y1 + bh);
          g.addColorStop(0, shade(col, 0.1 + tint));
          g.addColorStop(1, shade(col, -0.12 + tint));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.roundRect(x0, y1, bw, bh, T * 0.1);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.35)';
          ctx.lineWidth = Math.max(1, T * 0.025);
          ctx.beginPath();
          ctx.moveTo(x0 + T * 0.1, y1 + 1);
          ctx.lineTo(x0 + bw - T * 0.1, y1 + 1);
          ctx.stroke();
          // cracks & stains
          ctx.strokeStyle = 'rgba(90,80,70,0.35)';
          ctx.lineWidth = 1;
          if (rng() < 0.45) {
            ctx.beginPath();
            const sx = x0 + rng() * bw, sy = y1 + rng() * bh;
            ctx.moveTo(sx, sy);
            ctx.lineTo(sx + (rng() - 0.5) * T * 0.5, sy + (rng() - 0.5) * T * 0.4);
            ctx.stroke();
          }
          for (let q = 0; q < 14; q++) {
            ctx.fillStyle = rng() < 0.5 ? 'rgba(90,80,70,0.16)' : 'rgba(255,255,255,0.2)';
            ctx.fillRect(x0 + rng() * bw, y1 + rng() * bh, 1.4, 1.4);
          }
          if (rng() < 0.18) softBlob(ctx, x0 + rng() * bw, y1 + bh - 2, T * 0.25, [110, 150, 80], 0.3);
        });
        x += w;
      }
    }
    if (season === 'winter') {
      for (let i = 0; i < S * S / 1200; i++) softBlob(ctx, rng() * S, rng() * S, T * 0.2, [244, 250, 255], 0.45);
    }
  },

  stone(ctx, S, T, rng) {
    blotchBase(ctx, S, T, rng, '#bdb5a8', [130, 124, 116], [232, 226, 214], 70, 260, 0.3);
    for (let i = 0; i < S * S / 800; i++) {
      ctx.fillStyle = rng() < 0.5 ? 'rgba(90,84,76,0.16)' : 'rgba(255,255,255,0.2)';
      ctx.fillRect(rng() * S, rng() * S, 1.5, 1.5);
    }
  },

  planks(ctx, S, T, rng, season, opts = {}) {
    const base = opts.base || '#cd9a5f';
    const bw = T * (opts.board || 0.36);
    const n = Math.round(S / bw);
    const bh = S / n;
    ctx.fillStyle = '#4a3220';
    ctx.fillRect(0, 0, S, S);
    for (let i = 0; i < n; i++) {
      const y0 = i * bh;
      let x = -rng() * T * 1.2;
      while (x < S) {
        const len = T * (1.4 + rng() * 1.6);
        const col = jitterHex(base, rng, 0.1);
        const x0 = x, w = len;
        const gap = Math.max(1.4, T * 0.03);
        wrapDraw(S, x0 + w / 2, y0 + bh / 2, w, (cx, cy) => {
          const px0 = cx - w / 2, py0 = cy - bh / 2 + gap / 2, ph = bh - gap;
          const g = ctx.createLinearGradient(0, py0, 0, py0 + ph);
          g.addColorStop(0, shade(col, 0.1));
          g.addColorStop(0.5, col);
          g.addColorStop(1, shade(col, -0.12));
          ctx.fillStyle = g;
          ctx.fillRect(px0, py0, w - gap, ph);
          // grain
          ctx.lineCap = 'round';
          for (let q = 0; q < 6; q++) {
            ctx.strokeStyle = rng() < 0.6 ? 'rgba(90,55,25,0.22)' : 'rgba(255,230,190,0.2)';
            ctx.lineWidth = Math.max(1, T * 0.012);
            const gy = py0 + rng() * ph;
            const sx = px0 + rng() * w * 0.5;
            ctx.beginPath();
            ctx.moveTo(sx, gy);
            ctx.bezierCurveTo(sx + w * 0.15, gy + (rng() - 0.5) * 3, sx + w * 0.3, gy + (rng() - 0.5) * 3, sx + w * (0.3 + rng() * 0.4), gy + (rng() - 0.5) * 2);
            ctx.stroke();
          }
          // knot
          if (rng() < 0.12) {
            const kx = px0 + rng() * w, ky = py0 + ph * 0.5;
            ctx.strokeStyle = 'rgba(80,45,20,0.35)';
            ctx.lineWidth = 1.1;
            for (let q = 1; q < 3; q++) {
              ctx.beginPath();
              ctx.ellipse(kx, ky, T * 0.06 * q, T * 0.03 * q, 0, 0, Math.PI * 2);
              ctx.stroke();
            }
          }
          // nails
          ctx.fillStyle = 'rgba(60,40,25,0.55)';
          ctx.fillRect(px0 + 3, py0 + ph / 2 - 0.5, 1.8, 1.8);
          ctx.fillRect(px0 + w - gap - 5, py0 + ph / 2 - 0.5, 1.8, 1.8);
        });
        x += len;
      }
    }
  },
  planks_dark: (ctx, S, T, rng, s) => PAINTERS.planks(ctx, S, T, rng, s, { base: '#8e5f3b', board: 0.4 }),
  planks_pale: (ctx, S, T, rng, s) => PAINTERS.planks(ctx, S, T, rng, s, { base: '#dcb98a', board: 0.34 }),
  deck: (ctx, S, T, rng, s) => PAINTERS.planks(ctx, S, T, rng, s, { base: '#a98e6e', board: 0.45 }),

  tile(ctx, S, T, rng) {
    const n = Math.round(S / (T * 0.5));
    const sz = S / n;
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n; i++) {
        const dark = (i + j) % 2 === 0;
        const base = dark ? '#c7694a' : '#f1e1c0';
        const x = i * sz, y = j * sz;
        const g = ctx.createLinearGradient(x, y, x + sz, y + sz);
        g.addColorStop(0, shade(base, 0.1));
        g.addColorStop(1, shade(base, -0.1));
        ctx.fillStyle = g;
        ctx.fillRect(x, y, sz, sz);
        ctx.fillStyle = 'rgba(0,0,0,0.12)';
        ctx.fillRect(x, y + sz - 1.5, sz, 1.5);
        ctx.fillRect(x + sz - 1.5, y, 1.5, sz);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.fillRect(x, y, sz, 1.2);
        for (let q = 0; q < 6; q++) {
          ctx.fillStyle = rng() < 0.5 ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.1)';
          ctx.fillRect(x + rng() * sz, y + rng() * sz, 2, 2);
        }
      }
    }
  },

  sand(ctx, S, T, rng) {
    blotchBase(ctx, S, T, rng, '#ecd6a0', [214, 184, 124], [252, 240, 202], 60, 240, 0.3);
    ctx.lineCap = 'round';
    for (let i = 0; i < S / (T * 0.3); i++) {
      const x = rng() * S, y = rng() * S, L = T * (1 + rng() * 1.5);
      ctx.strokeStyle = rng() < 0.5 ? 'rgba(170,135,80,0.22)' : 'rgba(255,248,220,0.4)';
      ctx.lineWidth = Math.max(1, T * 0.04);
      wrapDraw(S, x, y, L, (px, py) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.bezierCurveTo(px + L * 0.3, py - T * 0.08, px + L * 0.6, py + T * 0.08, px + L, py);
        ctx.stroke();
      });
    }
    for (let i = 0; i < S * S / 500; i++) {
      ctx.fillStyle = rng() < 0.5 ? 'rgba(150,115,70,0.3)' : 'rgba(255,255,240,0.5)';
      ctx.fillRect(rng() * S, rng() * S, 1.3, 1.3);
    }
  },

  moss(ctx, S, T, rng) {
    blotchBase(ctx, S, T, rng, '#4d7a3c', [34, 70, 40], [120, 170, 80], 100, 380, 0.3);
    blades(ctx, S, rng, Math.round(S * S / 50), ['rgba(30,70,36,0.8)', 'rgba(110,160,70,0.8)', 'rgba(70,120,50,0.8)'], T * 0.17, Math.max(1, T * 0.03));
  },

  forest(ctx, S, T, rng) {
    blotchBase(ctx, S, T, rng, '#5a7b3e', [40, 68, 36], [120, 150, 70], 100, 380, 0.3);
    ctx.lineCap = 'round';
    for (let i = 0; i < S * S / 260; i++) {
      const x = rng() * S, y = rng() * S, L = T * (0.1 + rng() * 0.1);
      const a = rng() * Math.PI;
      ctx.strokeStyle = ['#8a5e34', '#a47040', '#6b4a2a', '#b88a50'][(rng() * 4) | 0];
      ctx.lineWidth = Math.max(1, T * 0.018);
      wrapDraw(S, x, y, L, (px, py) => {
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L);
        ctx.stroke();
      });
    }
    blades(ctx, S, rng, Math.round(S * S / 110), ['rgba(30,70,36,0.7)', 'rgba(130,170,80,0.7)'], T * 0.16, Math.max(1, T * 0.03));
  },

  path_snow(ctx, S, T, rng) {
    PAINTERS.grass(ctx, S, T, rng, 'winter');
  },
};

// ------------------------------------------------------------------ BUILDING / PROP TEXTURES (tileable)
function plaster(S, rng, base = '#f6efe0') {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) {
    const x = rng() * S, y = rng() * S, r = (0.08 + rng() * 0.26) * S;
    wrapDraw(S, x, y, r, (px, py) => softBlob(ctx, px, py, r, rng() < 0.5 ? [218, 204, 180] : [255, 252, 240], 0.28));
  }
  ctx.lineCap = 'round';
  for (let i = 0; i < 170; i++) {
    const x = rng() * S, y = rng() * S, L = S * (0.05 + rng() * 0.14);
    ctx.strokeStyle = rng() < 0.5 ? 'rgba(160,140,110,0.1)' : 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1 + rng() * 2.4;
    wrapDraw(S, x, y, L, (px, py) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.quadraticCurveTo(px + L * 0.5, py + (rng() - 0.5) * 6, px + L, py + (rng() - 0.5) * 4);
      ctx.stroke();
    });
  }
  for (let i = 0; i < 700; i++) {
    ctx.fillStyle = rng() < 0.5 ? 'rgba(120,100,70,0.09)' : 'rgba(255,255,255,0.16)';
    ctx.fillRect(rng() * S, rng() * S, 1.5, 1.5);
  }
  // hairline cracks
  ctx.strokeStyle = 'rgba(120,100,80,0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    let x = rng() * S, y = rng() * S;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let k = 0; k < 5; k++) {
      x += (rng() - 0.5) * S * 0.06;
      y += rng() * S * 0.05;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return c;
}

function brick(S, rng) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#9a7e6c';
  ctx.fillRect(0, 0, S, S);
  const rows = 8;
  const rh = S / rows;
  const bw = S / 4;
  const palette = ['#d0795a', '#c46a4e', '#d98a66', '#b95e46', '#cf8265', '#c27456'];
  for (let r = 0; r < rows; r++) {
    for (let i = -1; i < 5; i++) {
      const x = i * bw + (r % 2) * bw * 0.5;
      const y = r * rh;
      const col = palette[(rng() * palette.length) | 0];
      const g = ctx.createLinearGradient(x, y, x, y + rh);
      g.addColorStop(0, shade(col, 0.12));
      g.addColorStop(1, shade(col, -0.14));
      ctx.fillStyle = g;
      wrapDraw(S, x + bw / 2, y + rh / 2, bw, (cx, cy) => {
        ctx.beginPath();
        ctx.roundRect(cx - bw / 2 + 1.5, cy - rh / 2 + 1.5, bw - 3, rh - 3, 3);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,230,200,0.2)';
        ctx.fillRect(cx - bw / 2 + 4, cy - rh / 2 + 2, bw - 10, 2);
        for (let q = 0; q < 6; q++) {
          ctx.fillStyle = rng() < 0.5 ? 'rgba(80,30,20,0.18)' : 'rgba(255,220,190,0.2)';
          ctx.fillRect(cx - bw / 2 + 3 + rng() * (bw - 8), cy - rh / 2 + 3 + rng() * (rh - 7), 1.6, 1.6);
        }
        ctx.fillStyle = g;
      });
    }
  }
  return c;
}

function stoneBlocks(S, rng, base = '#b6b0a4') {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#6a645a';
  ctx.fillRect(0, 0, S, S);
  const rows = 5;
  const rh = S / rows;
  for (let r = 0; r < rows; r++) {
    let x = rng() * 30;
    const ws = [];
    let sum = 0;
    while (sum < S - 20) { const w = S * (0.2 + rng() * 0.18); ws.push(w); sum += w; }
    const k = S / sum;
    for (const w0 of ws) {
      const w = w0 * k;
      const col = jitterHex(base, rng, 0.1);
      wrapDraw(S, x + w / 2, r * rh + rh / 2, w, (cx, cy) => {
        const g = ctx.createLinearGradient(cx - w / 2, cy - rh / 2, cx + w / 2, cy + rh / 2);
        g.addColorStop(0, shade(col, 0.14));
        g.addColorStop(1, shade(col, -0.16));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.roundRect(cx - w / 2 + 2, cy - rh / 2 + 2, w - 4, rh - 4, 8);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,245,0.28)';
        ctx.fillRect(cx - w / 2 + 8, cy - rh / 2 + 4, w - 20, 3);
        for (let q = 0; q < 14; q++) {
          ctx.fillStyle = rng() < 0.5 ? 'rgba(70,64,56,0.14)' : 'rgba(255,255,255,0.18)';
          ctx.fillRect(cx - w / 2 + 4 + rng() * (w - 8), cy - rh / 2 + 4 + rng() * (rh - 8), 2, 2);
        }
        if (rng() < 0.25) softBlob(ctx, cx - w / 2 + rng() * w, cy + rh / 2 - 6, 14, [100, 140, 80], 0.35);
      });
      x += w;
    }
  }
  return c;
}

function plankWall(S, rng, base = '#bf8a54', vertical = true) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  const n = 7;
  const bw = S / n;
  ctx.fillStyle = '#3e2a1a';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < n; i++) {
    const col = jitterHex(base, rng, 0.1);
    const g = ctx.createLinearGradient(i * bw, 0, (i + 1) * bw, 0);
    g.addColorStop(0, shade(col, 0.1));
    g.addColorStop(0.5, col);
    g.addColorStop(1, shade(col, -0.14));
    ctx.fillStyle = g;
    ctx.fillRect(i * bw + 1.5, 0, bw - 3, S);
    ctx.lineCap = 'round';
    for (let q = 0; q < 9; q++) {
      ctx.strokeStyle = rng() < 0.6 ? 'rgba(80,45,20,0.22)' : 'rgba(255,230,190,0.2)';
      ctx.lineWidth = 1 + rng();
      const gx = i * bw + 4 + rng() * (bw - 8);
      const y0 = rng() * S;
      ctx.beginPath();
      ctx.moveTo(gx, y0);
      ctx.bezierCurveTo(gx + (rng() - 0.5) * 4, y0 + S * 0.1, gx + (rng() - 0.5) * 4, y0 + S * 0.2, gx, y0 + S * (0.2 + rng() * 0.3));
      ctx.stroke();
    }
    ctx.fillStyle = 'rgba(50,30,15,0.5)';
    for (const ny of [S * 0.12, S * 0.55, S * 0.9]) {
      ctx.fillRect(i * bw + bw / 2 - 1, ny, 2.4, 2.4);
    }
  }
  if (!vertical) {
    const c2 = makeCanvas(S);
    const x2 = c2.getContext('2d');
    x2.translate(S / 2, S / 2);
    x2.rotate(Math.PI / 2);
    x2.drawImage(c, -S / 2, -S / 2);
    return c2;
  }
  return c;
}

function shingles(S, rng) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#8a8a90';
  ctx.fillRect(0, 0, S, S);
  const rows = 8;
  const rh = S / rows;
  const cols = 4;
  const cw = S / cols;
  for (let r = rows - 1; r >= 0; r--) {
    for (let i = -1; i < cols + 1; i++) {
      const x = i * cw + (r % 2) * cw * 0.5;
      const y = r * rh;
      const v = 0.82 + rng() * 0.2;
      const base = `rgb(${(235 * v) | 0},${(235 * v) | 0},${(238 * v) | 0})`;
      wrapDraw(S, x + cw / 2, y + rh, cw, (cx, cy) => {
        const x0 = cx - cw / 2;
        const y1 = cy - rh * 1.0;
        const g = ctx.createLinearGradient(0, y1, 0, y1 + rh * 1.6);
        g.addColorStop(0, shade('#ffffff', -0.05));
        g.addColorStop(0.55, base);
        g.addColorStop(1, shade('#c8c8d0', -0.15));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x0, y1);
        ctx.lineTo(x0 + cw, y1);
        ctx.lineTo(x0 + cw, y1 + rh * 1.1);
        ctx.quadraticCurveTo(x0 + cw, y1 + rh * 1.62, x0 + cw / 2, y1 + rh * 1.62);
        ctx.quadraticCurveTo(x0, y1 + rh * 1.62, x0, y1 + rh * 1.1);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(40,40,60,0.45)';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(x0 + cw * 0.18, y1 + rh * 1.15);
        ctx.quadraticCurveTo(x0 + cw * 0.22, y1 + rh * 1.45, x0 + cw * 0.45, y1 + rh * 1.5);
        ctx.stroke();
      });
    }
  }
  return c;
}

function thatch(S, rng) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b9923f';
  ctx.fillRect(0, 0, S, S);
  const cols = ['#d9b45a', '#c7a04a', '#e6c874', '#b8923e', '#d2ac52', '#9c7a35'];
  ctx.lineCap = 'round';
  for (let i = 0; i < 1500; i++) {
    const x = rng() * S, y = rng() * S, L = S * (0.1 + rng() * 0.14);
    ctx.strokeStyle = cols[(rng() * cols.length) | 0];
    ctx.lineWidth = 1.5 + rng() * 2;
    wrapDraw(S, x, y, L, (px, py) => {
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px + (rng() - 0.5) * 6, py + L);
      ctx.stroke();
    });
  }
  for (let r = 0; r < 6; r++) {
    const y = (r / 6) * S;
    ctx.strokeStyle = 'rgba(80,55,20,0.4)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(S * 0.3, y + 4, S * 0.6, y - 4, S, y);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,235,170,0.25)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y + 4);
    ctx.bezierCurveTo(S * 0.3, y + 8, S * 0.6, y, S, y + 4);
    ctx.stroke();
  }
  return c;
}

function slateTiles(S, rng) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5d667a';
  ctx.fillRect(0, 0, S, S);
  const rows = 8, cols = 5;
  const rh = S / rows, cw = S / cols;
  for (let r = 0; r < rows; r++) {
    for (let i = -1; i < cols + 1; i++) {
      const x = i * cw + (r % 2) * cw * 0.5;
      const col = jitterHex('#a9b6cc', rng, 0.1);
      wrapDraw(S, x + cw / 2, r * rh + rh / 2, cw, (cx, cy) => {
        const g = ctx.createLinearGradient(0, cy - rh / 2, 0, cy + rh / 2);
        g.addColorStop(0, shade(col, 0.14));
        g.addColorStop(1, shade(col, -0.2));
        ctx.fillStyle = g;
        ctx.fillRect(cx - cw / 2 + 1.5, cy - rh / 2 + 1.5, cw - 3, rh - 2);
        ctx.fillStyle = 'rgba(255,255,255,0.22)';
        ctx.fillRect(cx - cw / 2 + 3, cy - rh / 2 + 2, cw - 8, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';
        ctx.fillRect(cx - cw / 2 + 1.5, cy + rh / 2 - 3, cw - 3, 2);
      });
    }
  }
  return c;
}

function wood(S, rng, base = '#a8744a') {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) {
    const y = rng() * S;
    wrapDraw(S, S / 2, y, S, (px, py) => softBlob(ctx, px, py, S * 0.3, rng() < 0.5 ? [70, 40, 18] : [255, 220, 170], 0.18));
  }
  ctx.lineCap = 'round';
  for (let i = 0; i < 90; i++) {
    const y0 = rng() * S;
    ctx.strokeStyle = rng() < 0.6 ? 'rgba(70,40,18,0.3)' : 'rgba(255,225,180,0.28)';
    ctx.lineWidth = 1 + rng() * 1.5;
    wrapDraw(S, 0, y0, S, (px, py) => {
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.bezierCurveTo(S * 0.3, py + (rng() - 0.5) * 8, S * 0.6, py + (rng() - 0.5) * 8, S, py + (rng() - 0.5) * 6);
      ctx.stroke();
    });
  }
  return c;
}

function bark(S, rng, birch = false) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = birch ? '#ece6dc' : '#7a5636';
  ctx.fillRect(0, 0, S, S);
  ctx.lineCap = 'round';
  if (birch) {
    for (let i = 0; i < 40; i++) {
      const x = rng() * S, y = rng() * S, w = S * (0.1 + rng() * 0.25);
      ctx.fillStyle = rng() < 0.7 ? 'rgba(50,45,40,0.75)' : 'rgba(150,140,125,0.5)';
      wrapDraw(S, x, y, w, (px, py) => {
        ctx.beginPath();
        ctx.ellipse(px, py, w, S * 0.012 + rng() * 2, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    for (let i = 0; i < 50; i++) {
      const x = rng() * S;
      ctx.strokeStyle = 'rgba(160,150,135,0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x + (rng() - 0.5) * 6, S);
      ctx.stroke();
    }
    return c;
  }
  for (let i = 0; i < 130; i++) {
    const x = rng() * S;
    ctx.strokeStyle = rng() < 0.6 ? 'rgba(40,24,12,0.5)' : 'rgba(210,170,120,0.35)';
    ctx.lineWidth = 2 + rng() * 5;
    wrapDraw(S, x, 0, S, (px) => {
      ctx.beginPath();
      ctx.moveTo(px, 0);
      let cx = px;
      for (let k = 1; k <= 6; k++) {
        cx += (rng() - 0.5) * 8;
        ctx.lineTo(cx, (k / 6) * S);
      }
      ctx.stroke();
    });
  }
  for (let i = 0; i < 6; i++) {
    const x = rng() * S, y = rng() * S;
    ctx.strokeStyle = 'rgba(40,24,12,0.5)';
    ctx.lineWidth = 2;
    for (let q = 1; q < 3; q++) {
      ctx.beginPath();
      ctx.ellipse(x, y, 5 * q, 9 * q, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  return c;
}

function leaves(S, rng) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b4b8b0';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 600; i++) {
    const x = rng() * S, y = rng() * S, r = S * (0.018 + rng() * 0.03);
    const v = 0.72 + rng() * 0.32;
    const col = `rgb(${(235 * v) | 0},${(240 * v) | 0},${(232 * v) | 0})`;
    const a = rng() * Math.PI * 2;
    wrapDraw(S, x, y, r * 2, (px, py) => {
      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(a);
      ctx.fillStyle = 'rgba(90,95,90,0.5)';
      ctx.beginPath();
      ctx.ellipse(r * 0.18, r * 0.22, r * 1.35, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 1.35, r * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.beginPath();
      ctx.ellipse(-r * 0.3, -r * 0.2, r * 0.7, r * 0.22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }
  return c;
}

function door(S, rng) {
  const c = makeCanvas(S, S * 1.5);
  const ctx = c.getContext('2d');
  const W = S, H = S * 1.5;
  ctx.fillStyle = '#3a2615';
  ctx.fillRect(0, 0, W, H);
  const n = 5;
  const bw = W / n;
  for (let i = 0; i < n; i++) {
    const col = jitterHex('#d7a46c', rng, 0.08);
    const g = ctx.createLinearGradient(i * bw, 0, (i + 1) * bw, 0);
    g.addColorStop(0, shade(col, 0.12));
    g.addColorStop(1, shade(col, -0.16));
    ctx.fillStyle = g;
    ctx.fillRect(i * bw + 2, 0, bw - 4, H);
    for (let q = 0; q < 7; q++) {
      ctx.strokeStyle = rng() < 0.6 ? 'rgba(80,45,20,0.22)' : 'rgba(255,230,190,0.2)';
      ctx.lineWidth = 1.2;
      const gx = i * bw + 5 + rng() * (bw - 10);
      const y0 = rng() * H;
      ctx.beginPath();
      ctx.moveTo(gx, y0);
      ctx.lineTo(gx + (rng() - 0.5) * 3, y0 + H * (0.1 + rng() * 0.3));
      ctx.stroke();
    }
  }
  // iron straps + hinges
  ctx.fillStyle = '#2d2a30';
  for (const y of [H * 0.2, H * 0.78]) {
    ctx.beginPath();
    ctx.roundRect(0, y - 6, W, 12, 3);
    ctx.fill();
    ctx.fillStyle = '#5b5762';
    ctx.fillRect(0, y - 5, W, 2);
    ctx.fillStyle = '#2d2a30';
    for (let k = 0; k < 4; k++) {
      ctx.beginPath();
      ctx.arc(W * (0.08 + k * 0.28), y, 2.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  // round handle
  ctx.fillStyle = '#e7c35a';
  ctx.beginPath();
  ctx.arc(W * 0.8, H * 0.55, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8f6d1a';
  ctx.beginPath();
  ctx.arc(W * 0.8 + 2, H * 0.55 + 2, 3.2, 0, Math.PI * 2);
  ctx.fill();
  return c;
}

function glass(S, warm) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  if (warm) {
    const g = ctx.createLinearGradient(0, 0, 0, S);
    g.addColorStop(0, '#ffd78a');
    g.addColorStop(0.6, '#ffb558');
    g.addColorStop(1, '#ff9a3e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    softBlob(ctx, S * 0.5, S * 0.72, S * 0.5, [255, 240, 190], 0.8);
    // curtain edges + silhouette hint
    ctx.fillStyle = 'rgba(170,70,40,0.35)';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(S * 0.22, 0); ctx.quadraticCurveTo(S * 0.1, S * 0.5, S * 0.2, S); ctx.lineTo(0, S); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(S, 0); ctx.lineTo(S * 0.78, 0); ctx.quadraticCurveTo(S * 0.9, S * 0.5, S * 0.8, S); ctx.lineTo(S, S); ctx.closePath();
    ctx.fill();
  } else {
    const g = ctx.createLinearGradient(0, 0, S, S);
    g.addColorStop(0, '#bfe3f2');
    g.addColorStop(0.5, '#7fb4cf');
    g.addColorStop(1, '#4f7e9e');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, S, S);
    ctx.fillStyle = 'rgba(255,230,200,0.28)';
    ctx.beginPath();
    ctx.moveTo(0, S * 0.85); ctx.lineTo(S, S * 0.45); ctx.lineTo(S, S); ctx.lineTo(0, S); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.beginPath();
    ctx.moveTo(S * 0.15, 0); ctx.lineTo(S * 0.35, 0); ctx.lineTo(S * 0.1, S); ctx.lineTo(-S * 0.1, S); ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.moveTo(S * 0.42, 0); ctx.lineTo(S * 0.5, 0); ctx.lineTo(S * 0.25, S); ctx.lineTo(S * 0.17, S); ctx.closePath();
    ctx.fill();
    // curtains
    ctx.fillStyle = 'rgba(255,240,225,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(S * 0.2, 0); ctx.quadraticCurveTo(S * 0.08, S * 0.5, S * 0.18, S); ctx.lineTo(0, S); ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(S, 0); ctx.lineTo(S * 0.8, 0); ctx.quadraticCurveTo(S * 0.92, S * 0.5, S * 0.82, S); ctx.lineTo(S, S); ctx.closePath();
    ctx.fill();
  }
  return c;
}

function radial(S, stops) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
  for (const [t, col] of stops) g.addColorStop(t, col);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  return c;
}

function softRect(S) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.filter = 'none';
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.clearRect(0, 0, S, S);
  // build with layered rounded rects of decreasing size
  for (let i = 0; i < 24; i++) {
    const t = i / 23;
    const m = (1 - t) * S * 0.42;
    ctx.fillStyle = `rgba(0,0,0,${0.07})`;
    ctx.beginPath();
    ctx.roundRect(m, m, S - m * 2, S - m * 2, (S - m * 2) * 0.35);
    ctx.fill();
  }
  return c;
}

function cloudShadow(S, rng) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  ctx.clearRect(0, 0, S, S);
  for (let i = 0; i < 26; i++) {
    const x = rng() * S, y = rng() * S, r = S * (0.1 + rng() * 0.16);
    wrapDraw(S, x, y, r, (px, py) => softBlob(ctx, px, py, r, [30, 45, 80], 0.5));
  }
  return c;
}

function noiseTex(S, rng) {
  const c = makeCanvas(S);
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  // tileable value noise via summed octaves of periodic grids
  const grids = [4, 8, 16, 32].map((n) => {
    const g = new Float32Array(n * n * 3);
    for (let i = 0; i < g.length; i++) g[i] = rng();
    return { n, g };
  });
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const out = [0, 0, 0];
      let amp = 0.5, tot = 0;
      for (const { n, g } of grids) {
        const fx = (x / S) * n, fy = (y / S) * n;
        const x0 = Math.floor(fx), y0 = Math.floor(fy);
        const tx = fx - x0, ty = fy - y0;
        const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
        for (let ch = 0; ch < 3; ch++) {
          const a = g[((y0 % n) * n + (x0 % n)) * 3 + ch];
          const b = g[((y0 % n) * n + ((x0 + 1) % n)) * 3 + ch];
          const c2 = g[(((y0 + 1) % n) * n + (x0 % n)) * 3 + ch];
          const d = g[(((y0 + 1) % n) * n + ((x0 + 1) % n)) * 3 + ch];
          out[ch] += (a + (b - a) * sx + (c2 + (d - c2) * sx - (a + (b - a) * sx)) * sy) * amp;
        }
        tot += amp;
        amp *= 0.5;
      }
      const i = (y * S + x) * 4;
      img.data[i] = (out[0] / tot) * 255;
      img.data[i + 1] = (out[1] / tot) * 255;
      img.data[i + 2] = (out[2] / tot) * 255;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  return c;
}

/** striped awning / bunting / cloth: colours cycle across `stripes` vertical bands */
export function stripeCanvas(colors, stripes = 8, S = 128) {
  const c = makeCanvas(S, S);
  const ctx = c.getContext('2d');
  const w = S / stripes;
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = colors[i % colors.length];
    ctx.fillRect(i * w, 0, w + 1, S);
  }
  // cloth weave + fold shading
  for (let i = 0; i < stripes; i++) {
    const g = ctx.createLinearGradient(i * w, 0, (i + 1) * w, 0);
    g.addColorStop(0, 'rgba(255,255,255,0.18)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.16)');
    ctx.fillStyle = g;
    ctx.fillRect(i * w, 0, w, S);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  for (let y = 0; y < S; y += 4) ctx.fillRect(0, y, S, 1);
  return c;
}

/** text sign board canvas. */
export function signCanvas(text, { w = 256, h = 96, bg = '#e9c98f', fg = '#4a2f1b', border = '#7a4a28', font = 'bold 40px "Trebuchet MS", "Segoe UI", sans-serif', icon } = {}) {
  const c = makeCanvas(w, h);
  const ctx = c.getContext('2d');
  const g = ctx.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, shade(bg, 0.1));
  g.addColorStop(1, shade(bg, -0.1));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  // wood grain
  const rng = mulberry32(text.length * 31 + 7);
  ctx.strokeStyle = 'rgba(90,55,25,0.16)';
  for (let i = 0; i < 14; i++) {
    const y = rng() * h;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(w * 0.3, y + (rng() - 0.5) * 6, w * 0.6, y + (rng() - 0.5) * 6, w, y + (rng() - 0.5) * 4);
    ctx.stroke();
  }
  ctx.strokeStyle = border;
  ctx.lineWidth = 7;
  ctx.strokeRect(3.5, 3.5, w - 7, h - 7);
  ctx.strokeStyle = 'rgba(255,240,200,0.4)';
  ctx.lineWidth = 2;
  ctx.strokeRect(9, 9, w - 18, h - 18);
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = parseInt(/(\d+)px/.exec(font)[1], 10);
  const lines = String(text).split('\n');
  const family = font.replace(/^.*?\d+px\s*/, '');
  const weight = /bold/.test(font) ? 'bold ' : '';
  const maxW = w - 36;
  for (;;) {
    ctx.font = `${weight}${size}px ${family}`;
    if (Math.max(...lines.map((l) => ctx.measureText(l).width)) <= maxW || size < 12) break;
    size -= 2;
  }
  const lh = size * 1.12;
  lines.forEach((l, i) => {
    const y = h / 2 + (i - (lines.length - 1) / 2) * lh;
    ctx.fillStyle = 'rgba(255,240,200,0.5)';
    ctx.fillText(l, w / 2 + 1.5, y + 1.5);
    ctx.fillStyle = fg;
    ctx.fillText(l, w / 2, y);
  });
  if (icon) {
    ctx.font = `${h * 0.5}px serif`;
    ctx.fillText(icon, w - 28, h / 2);
  }
  return c;
}

// ------------------------------------------------------------------ LIBRARY
/**
 * Create the shared texture set. `scale` ~ 0.5 (low) / 1 (medium) / 1.5 (high).
 * @returns {{ get(name):THREE.Texture, ground(kind,season,px):HTMLCanvasElement, dispose() }}
 */
export function createTextureLibrary(scale = 1) {
  const cache = new Map();
  const S = Math.round(256 * scale);
  const mk = (name, build, opts) => {
    if (cache.has(name)) return cache.get(name);
    const t = toTexture(build(), opts);
    cache.set(name, t);
    return t;
  };
  const R = (n) => mulberry32(n * 7919 + 13);
  const builders = {
    plaster: () => mk('plaster', () => plaster(S, R(1))),
    brick: () => mk('brick', () => brick(S, R(2))),
    stone: () => mk('stone', () => stoneBlocks(S, R(3))),
    plankWall: () => mk('plankWall', () => plankWall(S, R(4))),
    shingle: () => mk('shingle', () => shingles(S, R(5))),
    thatch: () => mk('thatch', () => thatch(S, R(6))),
    slate: () => mk('slate', () => slateTiles(S, R(7))),
    wood: () => mk('wood', () => wood(S, R(8))),
    woodDark: () => mk('woodDark', () => wood(S, R(9), '#6b4429')),
    bark: () => mk('bark', () => bark(S, R(10))),
    birch: () => mk('birch', () => bark(S, R(11), true)),
    leaves: () => mk('leaves', () => leaves(S, R(12))),
    door: () => mk('door', () => door(128, R(13)), { repeat: false }),
    glass: () => mk('glass', () => glass(64, false), { repeat: false }),
    glassWarm: () => mk('glassWarm', () => glass(64, true), { repeat: false }),
    halo: () => mk('halo', () => radial(128, [[0, 'rgba(255,230,160,1)'], [0.25, 'rgba(255,200,110,0.55)'], [0.6, 'rgba(255,170,70,0.14)'], [1, 'rgba(255,150,60,0)']]), { repeat: false, mip: false }),
    softCircle: () => mk('softCircle', () => radial(64, [[0, 'rgba(0,0,0,0.55)'], [0.5, 'rgba(0,0,0,0.3)'], [1, 'rgba(0,0,0,0)']]), { repeat: false, mip: false }),
    softRect: () => mk('softRect', () => softRect(64), { repeat: false, mip: false }),
    cloudShadow: () => mk('cloudShadow', () => cloudShadow(128, R(14))),
    noise: () => mk('noise', () => noiseTex(128, R(15)), { srgb: false }),
  };
  return {
    scale,
    get(name) {
      const b = builders[name];
      if (!b) throw new Error(`unknown texture ${name}`);
      return b();
    },
    names: Object.keys(builders),
    /** raw canvas of a ground pattern (px per tile aware) */
    groundPattern(kind, season, px, tiles = 8) {
      const key = `g:${kind}:${season}:${px}`;
      if (!cache.has(key)) cache.set(key, paintGroundPattern(kind, season, px, tiles, 1));
      return cache.get(key);
    },
    groundKinds: Object.keys(PAINTERS),
    dispose() {
      for (const v of cache.values()) if (v && v.dispose) v.dispose();
      cache.clear();
    },
  };
}
export { toTexture };
