// Terrain painters: grass, dirt, sand, pavers, planks, autotile paths, water, autotile hedges/fences.
import { RNG } from '../core/rng.js';
import { Canvas, mix, shade, outline, hash2, SNOW, pnoise, grassFill, litter, snowPatches, snowCaps } from './paint_common.js';
import { WATER } from './palette.js';

const WOB = [0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0];
const wob = (i, s = 0) => WOB[(((i + s) % 16) + 16) % 16];

// ------------------------------------------------------------------ grass / snow ground
function snowGround(T, ctx, v) {
  const { S } = ctx, r = ctx.rng;
  T.rect(0, 0, 16, 16, S.grass);
  // soft drifts
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const n = pnoise(x, y, v + 2);
    if (n > 0.28) T.px(x, y, S.grassD);
    if (n > 0.62) T.px(x, y, S.grassX);
    if (n < -0.55) T.px(x, y, S.grassL);
  }
  for (let i = 0; i < 4 + v; i++) {
    const x = r.int(0, 15), y = r.int(0, 15);
    T.px(x, y, r.chance(0.5) ? '#ffffff' : S.grassD);
  }
  // little frozen grass blades poking through
  const blades = [2, 3, 2, 1, 4, 2][v] ?? 2;
  for (let i = 0; i < blades; i++) {
    const x = r.int(2, 13), y = r.int(5, 14);
    T.px(x, y, '#7da58e'); T.px(x + 1, y - 1, '#a6c8b4'); T.px(x - 1, y - 1, '#a6c8b4'); T.px(x, y - 1, '#7da58e');
  }
  if (v === 3) { // hardy winter flower
    const x = r.int(3, 11), y = r.int(5, 11);
    T.px(x, y, '#e8a0c8'); T.px(x + 1, y, '#c97cb0'); T.px(x, y + 1, '#7da58e');
  }
}

export function grass(T, ctx, v = 0) {
  const { S } = ctx, r = ctx.rng;
  if (S.winter) return snowGround(T, ctx, v);
  const cfg = [
    { dots: 9, tufts: 3 }, { dots: 11, tufts: 4 }, { dots: 7, tufts: 5 }, { dots: 8, tufts: 3 },
    { dots: 16, tufts: 3, base: S.grassD, dark: S.grassX, light: S.grass }, // 4 dark
    { dots: 5, tufts: 6 }, // 5 lush light
  ][v] || { dots: 9, tufts: 3 };
  grassFill(T, ctx, 0, 0, 16, 16, cfg);
  if (v === 3) { // tiny clover flowers
    const cols = S.bloom;
    for (let i = 0; i < 3; i++) {
      const x = r.int(2, 13), y = r.int(3, 13), c = cols[r.int(0, cols.length - 1)];
      T.px(x, y, c); T.px(x + 1, y, shade(c, -0.15));
    }
  }
  if (ctx.season === 'autumn') litter(T, ctx, v === 4 ? 4 : 2 + (v & 1));
  if (ctx.season === 'spring' && v !== 4) litter(T, ctx, 1);
  if (ctx.season === 'summer' && (v === 1 || v === 5)) {
    const x = r.int(2, 13), y = r.int(3, 13);
    T.px(x, y, '#fff6c8'); T.px(x, y + 1, S.grassD);
  }
}

export function dirt(T, ctx, v = 0) {
  const base = ['#c9a56b', '#c19a60', '#a8814f'][v] || '#c9a56b';
  const r = ctx.rng;
  T.rect(0, 0, 16, 16, base);
  for (let i = 0; i < 14; i++) T.px(r.int(0, 15), r.int(0, 15), shade(base, -0.18));
  for (let i = 0; i < 8; i++) T.px(r.int(0, 15), r.int(0, 15), shade(base, 0.2));
  for (let i = 0; i < 3; i++) { const x = r.int(1, 13), y = r.int(1, 13); T.px(x, y, shade(base, -0.3)); T.px(x + 1, y, shade(base, -0.12)); }
  groundSeason(T, ctx, 0.35, 3);
}

export function gravel(T, ctx, v = 0) {
  const base = v ? '#9a9486' : '#b3ad9d', r = ctx.rng;
  T.rect(0, 0, 16, 16, base);
  for (let i = 0; i < 26; i++) {
    const x = r.int(0, 14), y = r.int(0, 14), c = r.chance(0.5) ? shade(base, 0.22) : shade(base, -0.25);
    T.px(x, y, c); T.px(x + 1, y, c); if (r.chance(0.5)) T.px(x, y + 1, shade(c, -0.15));
  }
  groundSeason(T, ctx, 0.3, 4);
}

export function sand(T, ctx, v = 0) {
  const base = ['#f0d79a', '#ecd090', '#e8c987', '#c9ad78'][v] || '#f0d79a'; // 3 = wet
  const r = ctx.rng;
  T.rect(0, 0, 16, 16, base);
  for (let i = 0; i < 16; i++) T.px(r.int(0, 15), r.int(0, 15), shade(base, -0.13));
  for (let i = 0; i < 10; i++) T.px(r.int(0, 15), r.int(0, 15), shade(base, 0.2));
  if (v === 1) for (let y = 3; y < 16; y += 6) for (let x = 0; x < 16; x++) if (wob(x, y) && x % 2 === 0) T.px(x, y, shade(base, -0.1));
  groundSeason(T, ctx, 0.12, 5);
}

export function snowfield(T, ctx, v = 0) {
  const fake = { ...ctx, S: { ...ctx.S, grass: '#f2f7fd', grassL: '#ffffff', grassD: '#d6e4f3', grassX: '#b8cde8', winter: true } };
  snowGround(T, fake, v);
}

/** shared seasonal treatment for non-grass ground tiles */
function groundSeason(T, ctx, snowAmt = 0.35, seed = 1) {
  if (ctx.S.winter) snowPatches(T, ctx, snowAmt, seed);
  else if (ctx.season === 'autumn') litter(T, ctx, 2);
  else if (ctx.season === 'spring') litter(T, ctx, 1);
}

// ------------------------------------------------------------------ pavers, flagstones, planks
export function paver(T, ctx, v = 0) {
  // cream / tan chequerboard slabs, 8x8 with grout
  const a = '#e6d6ae', b = '#d9c496', grout = '#b8a47a';
  const r = ctx.rng;
  for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
    const c = (sx + sy + v) % 2 ? b : a;
    T.rect(sx * 8, sy * 8, 8, 8, c);
    T.hline(sx * 8, sy * 8, 8, shade(c, 0.28));
    T.vline(sx * 8, sy * 8, 8, shade(c, 0.18));
    T.hline(sx * 8, sy * 8 + 7, 8, grout);
    T.vline(sx * 8 + 7, sy * 8, 8, grout);
    for (let i = 0; i < 3; i++) T.px(sx * 8 + r.int(1, 6), sy * 8 + r.int(1, 6), shade(c, -0.1));
  }
  groundSeason(T, ctx, 0.35, 6 + v);
}

export function paverBrick(T, ctx, v = 0) {
  // herringbone-ish brick pavement (terracotta)
  const cols = ['#c8704c', '#b9603f', '#d27e56', '#c06a48'];
  const grout = '#8a4a36';
  const r = ctx.rng;
  T.rect(0, 0, 16, 16, grout);
  for (let row = 0; row < 4; row++) {
    const off = (row + v) % 2 ? 4 : 0;
    for (let bx = -1; bx < 3; bx++) {
      const x0 = bx * 8 + off, y0 = row * 4;
      const c = cols[(hash2(bx + (off ? 5 : 0), row, 9 + v) * 4) | 0];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 7; i++) T.px(x0 + i, y0 + j, j === 0 ? shade(c, 0.18) : c);
      T.px(x0 + r.int(1, 5), y0 + 1, shade(c, -0.15));
    }
  }
  groundSeason(T, ctx, 0.35, 8 + v);
}

export function paverSlate(T, ctx, v = 0) {
  const grout = '#6a7088';
  const cols = ['#9aa3bb', '#8d97b0', '#a6aec4'];
  T.rect(0, 0, 16, 16, grout);
  const rows = v ? [[0, 5], [5, 11], [11, 16]] : [[0, 8], [8, 16]];
  rows.forEach(([y0, y1], ri) => {
    const cuts = ri % 2 ? [0, 6, 16] : [0, 10, 16];
    for (let k = 0; k < cuts.length - 1; k++) {
      const c = cols[(hash2(k, ri, 21 + v) * 3) | 0];
      for (let y = y0; y < y1 - 1; y++) for (let x = cuts[k]; x < cuts[k + 1] - 1; x++) T.px(x, y, y === y0 ? shade(c, 0.2) : c);
    }
  });
  groundSeason(T, ctx, 0.35, 10 + v);
}

export function flag(T, ctx, v = 0) { stoneLayout(T, ctx, 0, v, 8); }

function stoneLayout(T, ctx, variant, seedv, rowH) {
  const base = '#cdc7b6', grout = '#8f897b';
  T.rect(0, 0, 16, 16, grout);
  const rows = rowH === 8 ? [0, 8] : [0, 5, 11];
  rows.forEach((y0, ri) => {
    const y1 = rowH === 8 ? y0 + 8 : (rows[ri + 1] ?? 16);
    const cuts = ri % 2 ? [0, 5, 16] : [0, 11, 16];
    if (rowH === 8) { cuts.splice(0, 3, ...(ri % 2 ? [0, 4, 12, 16] : [0, 8, 16])); }
    for (let k = 0; k < cuts.length - 1; k++) {
      const hv = hash2(k + ri * 3, ri, 31 + seedv);
      const c = mix(base, hv > 0.5 ? '#e0d9c2' : '#b3ac9c', 0.25 + hv * 0.3);
      for (let y = y0; y < y1 - 1; y++) for (let x = cuts[k]; x < cuts[k + 1] - 1; x++) {
        T.px(x, y, y === y0 || x === cuts[k] ? shade(c, 0.22) : c);
      }
      for (let i = 0; i < 2; i++) T.px(cuts[k] + 1 + ((hv * 31 * (i + 1)) | 0) % Math.max(1, cuts[k + 1] - cuts[k] - 3), y0 + 2 + i * 2, shade(c, -0.15));
    }
  });
  groundSeason(T, ctx, 0.35, 12 + seedv);
}

export function plank(T, ctx, dir = 'h', v = 0) {
  const base = v ? '#a8713f' : '#b87c46', r = ctx.rng;
  T.rect(0, 0, 16, 16, base);
  const dark = shade(base, -0.4);
  if (dir === 'h') {
    for (let y = 0; y < 16; y += 4) {
      T.hline(0, y + 3, 16, dark);
      T.hline(0, y, 16, shade(base, 0.2));
      const j = ((y * 3 + v * 5) % 12) + 2;
      T.vline(j, y, 4, dark);
      for (let i = 0; i < 3; i++) T.px(r.int(0, 15), y + r.int(1, 2), shade(base, -0.15));
      T.px(j + 1, y + 1, shade(base, 0.12));
    }
  } else {
    for (let x = 0; x < 16; x += 4) {
      T.vline(x + 3, 0, 16, dark);
      T.vline(x, 0, 16, shade(base, 0.2));
      const j = ((x * 3 + v * 5) % 12) + 2;
      T.hline(x, j, 4, dark);
      for (let i = 0; i < 3; i++) T.px(x + r.int(1, 2), r.int(0, 15), shade(base, -0.15));
    }
  }
  if (ctx.S.winter) snowPatches(T, ctx, 0.5, 14 + v);
  else if (ctx.season === 'autumn') litter(T, ctx, 2);
}

// ------------------------------------------------------------------ generic 4-neighbour autotile
// mask bits: N=1 E=2 S=4 W=8 (set = connected / same terrain; outside-the-map counts as connected)
function autotile(T, mask, o) {
  const open = { n: !(mask & 1), e: !(mask & 2), s: !(mask & 4), w: !(mask & 8) };
  const ins0 = o.inset ?? 2;
  const R = o.round ?? 5;
  const inside = (x, y) => {
    if (x < 0 || y < 0 || x > 15 || y > 15) return true;
    if (open.n && y < ins0 + wob(x, 0) * (o.wobble ?? 1)) return false;
    if (open.s && y > 15 - ins0 - wob(x, 5) * (o.wobble ?? 1)) return false;
    if (open.w && x < ins0 + wob(y, 3) * (o.wobble ?? 1)) return false;
    if (open.e && x > 15 - ins0 - wob(y, 8) * (o.wobble ?? 1)) return false;
    // rounded convex corners
    const corner = (cx, cy, a, b) => {
      if (!(a && b)) return true;
      const px = cx === 0 ? ins0 + R : 15 - ins0 - R, py = cy === 0 ? ins0 + R : 15 - ins0 - R;
      const inQuadX = cx === 0 ? x < px : x > px, inQuadY = cy === 0 ? y < py : y > py;
      if (inQuadX && inQuadY) return (x - px) ** 2 + (y - py) ** 2 <= R * R + 1;
      return true;
    };
    return corner(0, 0, open.n, open.w) && corner(15, 0, open.n, open.e) && corner(0, 15, open.s, open.w) && corner(15, 15, open.s, open.e);
  };
  o.under(T);
  const map = [];
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) map[y * 16 + x] = inside(x, y);
  const isIn = (x, y) => (x < 0 || y < 0 || x > 15 || y > 15 ? true : map[y * 16 + x]);
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      if (!map[y * 16 + x]) continue;
      const rim = !isIn(x - 1, y) || !isIn(x + 1, y) || !isIn(x, y - 1) || !isIn(x, y + 1);
      const south = !isIn(x, y + 1) || (!isIn(x + 1, y + 1) && !isIn(x, y + 1));
      const c = o.fill(x, y);
      if (rim) T.px(x, y, o.rim ? (south && o.rimS ? o.rimS : o.rim) : c);
      else T.px(x, y, c);
    }
  }
  if (o.after) o.after(T, isIn, open);
}

function underGrass(ctx) {
  return (T) => {
    const sub = new RNG((ctx.rng.seed ^ 0x9e3779b9) >>> 0);
    grass(T, { ...ctx, rng: sub }, 0);
  };
}

function dirtFill(variant, seed = 0) {
  return (x, y) => {
    const h = hash2(x, y, 40 + variant * 7 + seed);
    if (h > 0.93) return '#e6cd96';
    if (h < 0.1) return '#b99555';
    if (h < 0.15) return '#d2b27a';
    return '#d9ba7e';
  };
}
function sandFill(variant) {
  return (x, y) => {
    const h = hash2(x, y, 60 + variant * 7);
    if (h > 0.92) return '#fbe9b8';
    if (h < 0.1) return '#dcc07c';
    return '#f0d79a';
  };
}

export function auto(T, ctx, terrain, mask, variant = 0) {
  const under = underGrass(ctx);
  const winter = ctx.S.winter;
  switch (terrain) {
    case 'path_dirt':
      autotile(T, mask, {
        under, fill: dirtFill(variant), rim: '#a8814f', rimS: '#9a7440', inset: 2,
        after: (T2) => seasonPath(T2, ctx, 0.4, 20, variant),
      });
      if (!winter) fringe(T, ctx, mask);
      break;
    case 'path_stone': {
      autotile(T, mask, {
        under, fill: stoneFill(variant, 'flag'), rim: '#7d7768', rimS: '#6d6759', inset: 2,
        after: (T2) => seasonPath(T2, ctx, 0.33, 22, variant),
      });
      if (!winter) fringe(T, ctx, mask);
      break;
    }
    case 'cobble':
      autotile(T, mask, {
        under, fill: stoneFill(variant, 'cobble'), rim: '#6f6a5e', rimS: '#5f5a50', inset: 1, round: 4,
        after: (T2) => seasonPath(T2, ctx, 0.36, 24, variant),
      });
      if (!winter) fringe(T, ctx, mask);
      break;
    case 'sand':
      autotile(T, mask, {
        under, fill: sandFill(variant), rim: '#d7bb78', inset: 2, wobble: 1, round: 5,
        after: (T2) => seasonPath(T2, ctx, 0.12, 26, variant),
      });
      break;
    case 'snow':
      autotile(T, mask, {
        under, fill: (x, y) => (hash2(x, y, 70 + variant) > 0.9 ? '#e1ecf8' : '#f6faff'), rim: '#cfe0f2', inset: 2,
        after: (T2) => { if (!winter) for (let i = 0; i < 6; i++) T2.px(ctx.rng.int(2, 13), ctx.rng.int(2, 13), '#ffffff'); },
      });
      break;
    default: throw new Error('auto terrain ' + terrain);
  }
}

function seasonPath(T, ctx, snowAmt, seed, variant) {
  if (ctx.S.winter) snowPatches(T, ctx, snowAmt, seed + variant);
  else if (ctx.season === 'autumn') litter(T, ctx, 2);
  else if (ctx.season === 'spring') litter(T, ctx, 1);
}

/** a few grass blades overlapping the rim of path-like tiles so edges feel hand-drawn */
function fringe(T, ctx, mask) {
  const r = ctx.rng, S = ctx.S;
  const put = (x, y) => { T.px(x, y, S.grassL); T.px(x, y - 1, S.grass); };
  for (let i = 0; i < 4; i++) {
    const side = r.int(0, 3), t = r.int(2, 13);
    if (side === 0 && !(mask & 1)) put(t, 2 + wob(t, 0));
    if (side === 1 && !(mask & 2)) put(14 - wob(t, 8), t);
    if (side === 2 && !(mask & 4)) put(t, 14 - wob(t, 5));
    if (side === 3 && !(mask & 8)) put(1 + wob(t, 3), t);
  }
}

function stoneFill(variant, kind) {
  if (kind === 'flag') {
    return (x, y) => {
      const row = y < 8 ? 0 : 1, xs = row ? (x + 8) % 16 : x;
      const k = xs < 8 ? 0 : 1, cx = (row ? 4 : 0) + k * 8;
      const hv = hash2(cx + row * 3, row, 33 + variant);
      let c = mix('#cdc7b6', hv > 0.5 ? '#e0d9c2' : '#b3ac9c', 0.25 + hv * 0.3);
      const lx = row ? (x + 4) % 8 : x % 8, ly = y % 8;
      if (lx === 7 || ly === 7) return '#9a9484';
      if (lx === 0 || ly === 0) return shade(c, 0.22);
      if (hash2(x, y, 90 + variant) > 0.9) c = shade(c, -0.14);
      return c;
    };
  }
  // cobble: staggered rounded stones 4px tall
  return (x, y) => {
    const row = (y / 4) | 0, off = row % 2 ? 2 : 0;
    const sx = (x + off) % 8 === 0 ? 0 : 1;
    const cx = Math.floor((x + off) / 8), lx = (x + off) % 8, ly = y % 4;
    const hv = hash2(cx, row, 41 + variant);
    const c = mix('#bdb6a8', hv > 0.5 ? '#d8cdb4' : '#9d978a', 0.25 + hv * 0.35);
    if (ly === 3 || lx === 7 || (lx === 0 && ly === 0)) return '#878175';
    if (ly === 0 || lx === 0) return shade(c, 0.2);
    return c;
  };
}

// ------------------------------------------------------------------ water
const SEA = { base: '#4a90c8', light: '#88c6f0', dark: '#3a76b0', deep: '#2d5f9a' };
const POND = { base: '#62b6e4', light: '#a8e2f8', dark: '#4a94cc', deep: '#3f84bc' };

export function water(T, ctx, kind, mask, frame = 0) {
  const P = kind === 'g' ? POND : SEA;
  const deepSea = kind === 'd';
  const winter = ctx.S.winter;
  const waterFill = (x, y) => {
    let c = deepSea ? P.dark : P.base;
    // moving highlights: bars drift 1 px per frame; period is 16 so neighbours line up
    for (let row = 0; row < 4; row++) {
      const ry = row * 4 + 1 + ((row * 3 + 1) % 3);
      if (y === ry) {
        const x0 = (row * 5 + frame * 4) % 16;
        const xx = (x - x0 + 16) % 16;
        if (xx < 4) c = xx === 0 || xx === 3 ? P.base : P.light;
      }
      if (y === ry + 2) {
        const x0 = (row * 9 + 6 + frame * 4) % 16;
        const xx = (x - x0 + 16) % 16;
        if (xx < 2) c = deepSea ? P.deep : P.dark;
      }
    }
    if (hash2(x, y, 3 + frame) > 0.985) c = '#ffffff';
    return c;
  };
  const under = (kind === 'g') ? underGrass(ctx) : (kind === 's' ? (T2) => { sand(T2, { ...ctx, rng: new RNG((ctx.rng.seed ^ 7) >>> 0) }, 1); } : (T2) => quay(T2, ctx));
  if (mask === 15) {
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) T.px(x, y, waterFill(x, y));
    return;
  }
  autotile(T, mask, {
    under, fill: waterFill, inset: 2, round: 5, wobble: 1,
    rim: winter ? '#e8f6ff' : '#e4f7ff',
    after: (T2, isIn, open) => {
      // bank shadow + foam/ice
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        if (T2 && isIn(x, y)) continue;
        // outside pixel adjacent to water: wet bank colour
        const adj = isIn(x - 1, y) || isIn(x + 1, y) || isIn(x, y - 1) || isIn(x, y + 1);
        if (adj) T2.px(x, y, kind === 'g' ? '#3b7a4a' : (kind === 's' ? '#c9ad74' : '#7a7468'));
      }
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        if (!isIn(x, y)) continue;
        const nearEdge = !isIn(x - 2, y) || !isIn(x + 2, y) || !isIn(x, y - 2) || !isIn(x, y + 2);
        if (winter && nearEdge) {
          const c = hash2(x, y, 4) > 0.8 ? '#ffffff' : '#d9eefa';
          const crack = hash2(x >> 1, y >> 1, 9) > 0.86;
          T2.px(x, y, crack ? '#b0d2ea' : c);
        } else if (!winter && kind !== 'g' && nearEdge && (x + y + frame) % 4 < 2 && (!isIn(x - 1, y) || !isIn(x + 1, y) || !isIn(x, y - 1) || !isIn(x, y + 1) || hash2(x, y, 6) > 0.7)) {
          T2.px(x, y, '#f4fbff'); // sea foam
        }
      }
      // north bank shadow
      if (open.n) for (let x = 0; x < 16; x++) for (let y = 0; y < 16; y++) {
        if (isIn(x, y) && isIn(x, y - 3) === false && y < 6 && !winter) T2.px(x, y, mixc(T2.get(x, y), P.dark, 0.35));
      }
    },
  });
}
function mixc(c, hex, t) { return mix([c[0], c[1], c[2]], hex, t); }

function quay(T, ctx) {
  // stone quay edge (harbor): flagstones
  stoneLayout(T, { ...ctx, S: { ...ctx.S, winter: false }, season: 'summer' }, 0, 3, 8);
  if (ctx.S.winter) snowPatches(T, ctx, 0.35, 15);
}

// ------------------------------------------------------------------ autotile deco: hedges, fences, rails, low walls
export function autoDeco(T, ctx, kind, mask) {
  const { S, season } = ctx;
  const n = mask & 1, e = mask & 2, s = mask & 4, w = mask & 8;
  if (kind === 'hedge' || kind === 'hedge_bloom') {
    const P = kind === 'hedge' ? S.bush : { l: S.bush.l, m: S.bush.m, d: S.bush.d, o: S.bush.o };
    const x0 = w ? 0 : 1, x1 = e ? 15 : 14, y0 = n ? 0 : 3, y1 = s ? 15 : 14;
    const rr = 3;
    const shape = (x, y) => {
      if (x < x0 || x > x1 || y < y0 || y > y1) return false;
      if (!n && !w && x < x0 + rr && y < y0 + rr) return (x - (x0 + rr)) ** 2 + (y - (y0 + rr)) ** 2 <= rr * rr + 1;
      if (!n && !e && x > x1 - rr && y < y0 + rr) return (x - (x1 - rr)) ** 2 + (y - (y0 + rr)) ** 2 <= rr * rr + 1;
      if (!s && !w && x < x0 + rr && y > y1 - rr) return (x - (x0 + rr)) ** 2 + (y - (y1 - rr)) ** 2 <= rr * rr + 1;
      if (!s && !e && x > x1 - rr && y > y1 - rr) return (x - (x1 - rr)) ** 2 + (y - (y1 - rr)) ** 2 <= rr * rr + 1;
      return true;
    };
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (!shape(x, y)) continue;
      const edge = !shape(x - 1, y) || !shape(x + 1, y) || !shape(x, y - 1) || !shape(x, y + 1);
      const topBand = !s ? (y - y0) / (y1 - y0 + 1) : 0.3;
      const h = hash2(x, y, 5);
      let c = h > 0.7 ? P.l : h < 0.28 ? P.d : P.m;
      if (!s && y >= y1 - 4) c = h > 0.75 ? P.m : P.d; // shaded front
      else if (topBand < 0.35 && h > 0.45) c = P.l;
      if (edge) c = P.o;
      T.px(x, y, c);
    }
    // inner highlight pixels on edge-adjacent
    if (kind === 'hedge_bloom' && !S.winter) {
      const cols = S.bloom;
      for (let i = 0; i < 7; i++) {
        const x = 2 + ((hash2(i, mask, 8) * 11) | 0), y = 3 + ((hash2(i, mask, 9) * 9) | 0);
        if (shape(x, y) && shape(x - 1, y) && shape(x + 1, y) && shape(x, y - 1) && shape(x, y + 1)) T.px(x, y, cols[i % cols.length]);
      }
    }
    if (S.winter) snowCaps(T, ctx, 3);
    return;
  }
  if (kind === 'fence_wood' || kind === 'fence_picket') {
    const wood = kind === 'fence_wood' ? '#a56c3c' : '#f3eee0';
    const woodL = shade(wood, 0.25), woodD = shade(wood, -0.28), woodO = shade(wood, -0.6);
    const post = (x, top) => {
      for (let y = top; y < 15; y++) { T.px(x, y, woodO); T.px(x + 1, y, y === top ? woodL : wood); T.px(x + 2, y, woodD); T.px(x + 3, y, woodO); }
      T.hline(x, top - 1, 4, woodO); T.px(x + 1, top, woodL);
    };
    if (kind === 'fence_wood') {
      if (e || w) {
        const xa = w ? 0 : 6, xb = e ? 16 : 10;
        for (let x = xa; x < xb; x++) {
          T.px(x, 6, woodO); T.px(x, 7, woodL); T.px(x, 8, wood); T.px(x, 9, woodO);
          T.px(x, 10, woodO); T.px(x, 11, woodL); T.px(x, 12, wood); T.px(x, 13, woodO);
        }
      }
      if (n || s) {
        const ya = n ? 0 : 4, yb = s ? 16 : 14;
        for (let y = ya; y < yb; y++) { T.px(6, y, woodO); T.px(7, y, woodL); T.px(8, y, wood); T.px(9, y, woodO); }
      }
      post(6, 3);
      if (!(e || w) && !(n || s)) post(6, 3);
    } else { // picket
      const xa = w ? 0 : 3, xb = e ? 16 : 13;
      if (e || w || !(n || s)) {
        for (let x = xa; x < xb; x++) {
          const k = x % 4;
          if (k === 0) { T.vline(x, 5, 9, woodO); T.px(x, 4, woodO); } else if (k === 1) { T.vline(x, 5, 9, woodL); T.px(x, 4, woodL); T.px(x, 3, woodO); T.px(x - 1, 4, woodO); T.px(x + 1, 4, woodO); }
          else if (k === 2) { T.vline(x, 5, 9, wood); T.px(x, 4, wood); } else { T.vline(x, 5, 9, woodD); T.px(x, 4, woodO); }
        }
        T.hline(xa, 7, xb - xa, woodO); T.hline(xa, 11, xb - xa, woodO);
        T.hline(xa, 8, xb - xa, woodD); T.hline(xa, 12, xb - xa, woodD);
      }
      if (n || s) { const ya = n ? 0 : 5, yb = s ? 16 : 14; for (let y = ya; y < yb; y++) { T.px(6, y, woodO); T.px(7, y, woodL); T.px(8, y, wood); T.px(9, y, woodO); } T.px(7, ya - 1, woodO); }
    }
    if (S.winter) snowCaps(T, ctx, 2);
    return;
  }
  if (kind === 'rail_iron') {
    const I = { o: '#1f2a28', m: '#3e5a52', l: '#6f9a8c' };
    if (e || w) {
      const xa = w ? 0 : 6, xb = e ? 16 : 10;
      T.hline(xa, 4, xb - xa, I.o); T.hline(xa, 5, xb - xa, I.l); T.hline(xa, 6, xb - xa, I.o);
      T.hline(xa, 11, xb - xa, I.o); T.hline(xa, 12, xb - xa, I.m);
      for (let x = xa; x < xb; x++) if (x % 4 === 2) { T.vline(x, 7, 4, I.m); }
    }
    if (n || s) { const ya = n ? 0 : 3, yb = s ? 16 : 14; for (let y = ya; y < yb; y++) { T.px(6, y, I.o); T.px(7, y, I.l); T.px(8, y, I.m); T.px(9, y, I.o); } }
    // post with finial
    T.rect(6, 3, 4, 11, I.m); T.vline(6, 3, 11, I.o); T.vline(9, 3, 11, I.o); T.vline(7, 4, 9, I.l); T.hline(6, 13, 4, I.o);
    T.px(7, 1, I.l); T.px(8, 1, I.m); T.rect(6, 2, 4, 1, I.o); T.px(7, 2, I.m); T.px(8, 2, I.m);
    if (S.winter) snowCaps(T, ctx, 2);
    return;
  }
  if (kind === 'lowwall') {
    const x0 = w ? 0 : 1, x1 = e ? 15 : 14, y0 = n ? 0 : 5, y1 = s ? 15 : 14;
    const base = '#bdb7a8';
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const top = !n && y < y0 + 4; // top surface lighter, 3/4 view
      let c = top ? '#d8d2c2' : base;
      const rowi = ((y - y0) / 4) | 0;
      if (!top && (y - y0) % 4 === 3) c = '#8e887a';
      if (!top && ((x + (rowi % 2 ? 4 : 0)) % 8 === 7)) c = '#8e887a';
      if (!top && (y - y0) % 4 === 0) c = '#cdc7b8';
      if (x === x0 && !w || x === x1 && !e || (y === y0 && !n) || (y === y1 && !s)) c = '#6c6658';
      T.px(x, y, c);
    }
    if (!n) { T.hline(x0 + 1, y0 + 1, x1 - x0 - 1, '#e8e2d2'); }
    if (S.winter) snowCaps(T, ctx, 3);
    return;
  }
  throw new Error('autoDeco ' + kind);
}

export const SHEETS = {};

export function fountainWater(T, ctx, frame = 0) {
  const P = POND;
  T.rect(0, 0, 16, 16, P.base);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const k = (x * 2 + y * 3 + frame * 5) % 16;
    if ((x + y * 2 + frame * 3) % 11 === 0) T.px(x, y, P.light);
    if (k === 4 && y % 3 === 1) T.px(x, y, P.dark);
  }
  for (let i = 0; i < 3; i++) T.px((frame * 5 + i * 7) % 16, (i * 5 + frame * 3) % 16, '#ffffff');
}

export const PAINTERS = { grass, dirt, gravel, sand, snowfield, paver, paverBrick, paverSlate, flag, plank, auto, water, autoDeco, fountainWater };
