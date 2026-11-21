// Colour helpers for the procedural art. Colours are packed 32-bit ints 0xAARRGGBB
// (unsigned). 0 = fully transparent. Everything here is pure (no DOM).

const cache = new Map();

/** '#rrggbb' | '#rgb' | packed int | [r,g,b(,a)] -> packed int. */
export function C(c) {
  if (typeof c === 'number') return c >>> 0;
  if (Array.isArray(c)) return pack(c[0], c[1], c[2], c[3] === undefined ? 255 : c[3]);
  let v = cache.get(c);
  if (v !== undefined) return v;
  let s = c.replace('#', '');
  if (s.length === 3) s = s[0] + s[0] + s[1] + s[1] + s[2] + s[2];
  const n = parseInt(s.slice(0, 6), 16);
  const a = s.length >= 8 ? parseInt(s.slice(6, 8), 16) : 255;
  v = pack((n >> 16) & 255, (n >> 8) & 255, n & 255, a);
  cache.set(c, v);
  return v;
}

export const pack = (r, g, b, a = 255) =>
  (((a & 255) << 24) | ((r & 255) << 16) | ((g & 255) << 8) | (b & 255)) >>> 0;
export const unpack = (c) => [(c >>> 16) & 255, (c >>> 8) & 255, c & 255, (c >>> 24) & 255];
export const alphaOf = (c) => (c >>> 24) & 255;
export const hex = (c) => '#' + (c & 0xffffff).toString(16).padStart(6, '0');

export function mix(a, b, t) {
  const [r1, g1, b1] = unpack(C(a));
  const [r2, g2, b2] = unpack(C(b));
  return pack(
    Math.round(r1 + (r2 - r1) * t), Math.round(g1 + (g2 - g1) * t), Math.round(b1 + (b2 - b1) * t),
  );
}

export function luma(c) {
  const [r, g, b] = unpack(C(c));
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}

export function rgb2hsl(c) {
  const [r0, g0, b0] = unpack(C(c));
  const r = r0 / 255, g = g0 / 255, b = b0 / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const l = (mx + mn) / 2;
  let h = 0, s = 0;
  if (mx !== mn) {
    const d = mx - mn;
    s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
    if (mx === r) h = (g - b) / d + (g < b ? 6 : 0);
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

export function hsl(h, s, l) {
  h = ((h % 1) + 1) % 1;
  s = Math.min(1, Math.max(0, s));
  l = Math.min(1, Math.max(0, l));
  const f = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) { const v = Math.round(l * 255); return pack(v, v, v); }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return pack(Math.round(f(p, q, h + 1 / 3) * 255), Math.round(f(p, q, h) * 255), Math.round(f(p, q, h - 1 / 3) * 255));
}

const WARM_LIGHT = C('#fff3d6');
const COOL_SHADE = C('#3a2358');
const INK = C('#241420');

/** light/base/shade/dark(outline) ramp of a base colour (cached). */
const rampCache = new Map();
export function ramp(base) {
  const b = C(base);
  let r = rampCache.get(b);
  if (r) return r;
  const l = luma(b);
  const lightT = 0.26 + (1 - l) * 0.16;
  const light = mix(b, WARM_LIGHT, lightT);
  const shade = mix(mix(b, COOL_SHADE, 0.2), '#000000', 0.12 + l * 0.08);
  const dark = mix(mix(b, INK, 0.5), '#000000', 0.12);
  const deep = mix(dark, INK, 0.4);
  r = { light, base: b, shade, dark, deep };
  rampCache.set(b, r);
  return r;
}

export const darken = (c, t) => mix(c, INK, t);
export const lighten = (c, t) => mix(c, WARM_LIGHT, t);

/** Outline colour for a pixel colour (never pure black). */
export function outlineOf(c) {
  const [r, g, b] = unpack(c);
  const k = 0.46;
  return pack(
    Math.max(18, Math.round(r * k * 0.9 + 22)),
    Math.max(12, Math.round(g * k * 0.85 + 12)),
    Math.max(20, Math.round(b * k * 0.95 + 22)),
  );
}

export const WHITE = C('#ffffff');
export const CREAM = C('#f6ecd2');
export const PARCHMENT = C('#e8d5a8');
export const WOOD = C('#7a4f2e');
export const DARK_BROWN = C('#3b2a1f');
export const INK_NAVY = C('#1d2340');
export const SKY = C('#8fd0f0');
export const GRASS = C('#6cc24a');
export const DEEP_GRASS = C('#3f8f3a');
export const BLOSSOM = C('#f4b6c8');
export const SUNSET = C('#f08a4b');
export const HARBOR = C('#4a90c8');
export const BRICK = C('#b5503c');
export const SLATE = C('#4b5a78');
export const GOLD = C('#f2b84b');
