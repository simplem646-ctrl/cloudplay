// Shared painter helpers (pure). A painter is `(T, ctx, ...args)` where T is a Canvas (16x16 tile or a
// multi-tile sheet), ctx = { S (season palette), season, winter, rng (seeded per tile), name }.
import { Canvas, rgb, mix, shade, outline, hash2 } from './gfx.js';
import { SNOW } from './palette.js';

export { Canvas, rgb, mix, shade, outline, hash2, SNOW };

/** periodic (16px) smooth noise in -1..1, tile-local coordinates, so neighbouring tiles line up. */
export function pnoise(x, y, seed = 0) {
  const a = 2 * Math.PI / 16;
  const s1 = seed * 1.7, s2 = seed * 2.3 + 1;
  return (
    Math.sin(a * (x + 3) + s1) * Math.cos(a * 2 * (y + 1) + s2) * 0.55 +
    Math.sin(a * 2 * (x + 5) + s2) * Math.sin(a * (y + 7) + s1) * 0.45
  );
}

/** Paint a grass-like speckle fill (used by several painters) */
export function grassFill(T, ctx, x0 = 0, y0 = 0, w = 16, h = 16, o = {}) {
  const { S } = ctx;
  T.rect(x0, y0, w, h, o.base || S.grass);
  const r = ctx.rng;
  const n = o.dots ?? Math.round(w * h / 28);
  for (let i = 0; i < n; i++) {
    const x = x0 + r.int(0, w - 1), y = y0 + r.int(0, h - 1);
    T.px(x, y, o.dark || S.grassD);
    if (r.chance(0.45)) T.px(x + 1, y, o.dark || S.grassD);
  }
  const m = o.tufts ?? Math.round(w * h / 70);
  for (let i = 0; i < m; i++) {
    const x = x0 + r.int(1, w - 2), y = y0 + r.int(2, h - 1);
    T.px(x, y, o.light || S.grassL);
    T.px(x + 1, y - 1, o.light || S.grassL);
    T.px(x - 1, y - 1, o.light || S.grassL);
    T.px(x, y + 1, o.dark || S.grassD);
  }
}

/** seasonal litter on a ground tile: fallen leaves (autumn) / petals (spring) */
export function litter(T, ctx, n = 3) {
  const f = ctx.S.fallen;
  if (!f || !f.length) return;
  const r = ctx.rng;
  for (let i = 0; i < n; i++) {
    const x = r.int(1, 13), y = r.int(1, 14), c = f[r.int(0, f.length - 1)];
    if (ctx.season === 'spring') {
      T.px(x, y, c); if (r.chance(0.5)) T.px(x + 1, y, c);
    } else {
      T.px(x, y, c); T.px(x + 1, y, c); T.px(x + 1, y + 1, shade(c, -0.25));
      if (r.chance(0.5)) T.px(x, y - 1, shade(c, 0.2));
    }
  }
}

/** blend part of an opaque ground tile toward snow using periodic noise (winter paths etc.) */
export function snowPatches(T, ctx, amount = 0.4, seed = 1, opts = {}) {
  const th = 1 - amount * 2; // noise threshold
  for (let y = 0; y < T.h; y++) {
    for (let x = 0; x < T.w; x++) {
      if (T.alpha(x, y) === 0) continue;
      const n = pnoise(x, y, seed);
      if (n > th * 0.55) {
        const edge = n < th * 0.55 + 0.1;
        T.px(x, y, edge ? SNOW.s : (hash2(x, y, seed) > 0.85 ? SNOW.s : SNOW.m));
      } else if (n > th * 0.55 - 0.12 && opts.slush !== false) {
        const c = T.get(x, y);
        T.px(x, y, mix([c[0], c[1], c[2]], '#e8f0f8', 0.35));
      }
    }
  }
}

/** Put snow on the top-facing edges of whatever is painted (benches, fences, lamps...). */
export function snowCaps(T, ctx, depth = 2, o = {}) {
  const jag = o.jag ?? true;
  const tops = [];
  for (let x = 0; x < T.w; x++) {
    for (let y = 0; y < T.h; y++) {
      if (T.alpha(x, y) > 200 && T.alpha(x, y - 1) < 100) {
        if (o.minX !== undefined && (x < o.minX || x > o.maxX)) break;
        tops.push([x, y]);
        break; // topmost pixel of the column
      }
    }
  }
  for (const [x, y] of tops) {
    const d = Math.max(1, depth - (jag && hash2(x, y, 3) > 0.6 ? 1 : 0));
    for (let k = 0; k < d; k++) {
      if (T.alpha(x, y + k) > 200) T.px(x, y + k, k === 0 ? SNOW.l : SNOW.m);
    }
    if (T.alpha(x, y + d) > 200 && hash2(x, y, 5) > 0.5) T.px(x, y + d, SNOW.s);
  }
}

export const clampi = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
