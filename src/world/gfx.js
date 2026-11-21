// Tiny software pixel toolkit used by the tileset painters. Pure JS, no DOM: everything draws
// into a plain RGBA buffer (Canvas class below), so the whole atlas can be rendered in Node
// (tests, PNG dumps) and only copied to a <canvas> in the browser by tileset.js.

const HEX_CACHE = new Map();

/** '#rrggbb' | [r,g,b] -> [r,g,b] (cached). */
export function rgb(c) {
  if (Array.isArray(c)) return c;
  let v = HEX_CACHE.get(c);
  if (!v) {
    const n = parseInt(c.slice(1), 16);
    v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
    HEX_CACHE.set(c, v);
  }
  return v;
}
const toHex = ([r, g, b]) => '#' + ((1 << 24) | (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b)).toString(16).slice(1);
export const hexOf = (c) => (typeof c === 'string' ? c : toHex(c));

export function mix(a, b, t) {
  const A = rgb(a), B = rgb(b);
  return toHex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

function toHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (mx + mn) / 2;
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
function fromHsl([h, s, l]) {
  h = ((h % 1) + 1) % 1;
  const f = (p, q, t) => {
    t = ((t % 1) + 1) % 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255];
}
/**
 * Shade a colour: k < 0 darkens (and nudges hue toward blue-violet, keeping saturation, which
 * keeps shadows lush instead of muddy), k > 0 lightens (nudges toward warm yellow).
 */
export function shade(c, k) {
  const [h, s, l] = toHsl(rgb(c));
  const toward = (h0, target, amt) => {
    let d = target - h0;
    if (d > 0.5) d -= 1; else if (d < -0.5) d += 1;
    return h0 + d * amt;
  };
  if (k < 0) {
    const nl = l * (1 + k * 0.78);
    return toHex(fromHsl([toward(h, 0.68, -k * 0.07), Math.min(1, s * (1 - k * 0.1)), nl]));
  }
  const nl = l + (1 - l) * k * 0.85;
  return toHex(fromHsl([toward(h, 0.13, k * 0.05), Math.max(0, s * (1 - k * 0.1)), nl]));
}
/** Darker outline colour of an object colour (never pure black). */
export const outline = (c, k = -0.62) => shade(c, k);
/** 3-tone ramp [light, base, dark] */
export const ramp3 = (c) => [shade(c, 0.34), c, shade(c, -0.3)];

/** RGBA pixel buffer with drawing helpers. (0,0) is top-left. Out-of-range writes are ignored. */
export class Canvas {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }
  px(x, y, c, a = 255) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || c === null || c === undefined) return this;
    const [r, g, b] = rgb(c);
    const i = (y * this.w + x) * 4, d = this.data;
    if (a >= 255) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; return this; }
    const da = d[i + 3];
    if (da === 0) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a; return this; }
    const t = a / 255;
    d[i] += (r - d[i]) * t; d[i + 1] += (g - d[i + 1]) * t; d[i + 2] += (b - d[i + 2]) * t;
    d[i + 3] = Math.max(da, a);
    return this;
  }
  get(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return null;
    const i = (y * this.w + x) * 4, d = this.data;
    return [d[i], d[i + 1], d[i + 2], d[i + 3]];
  }
  alpha(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    return this.data[(y * this.w + x) * 4 + 3];
  }
  erase(x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return this;
    this.data[(y * this.w + x) * 4 + 3] = 0;
    return this;
  }
  clear() { this.data.fill(0); return this; }
  rect(x, y, w, h, c, a = 255) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.px(x + i, y + j, c, a);
    return this;
  }
  hline(x, y, w, c, a = 255) { for (let i = 0; i < w; i++) this.px(x + i, y, c, a); return this; }
  vline(x, y, h, c, a = 255) { for (let j = 0; j < h; j++) this.px(x, y + j, c, a); return this; }
  frame(x, y, w, h, c) {
    this.hline(x, y, w, c); this.hline(x, y + h - 1, w, c);
    this.vline(x, y + 1, h - 2, c); this.vline(x + w - 1, y + 1, h - 2, c);
    return this;
  }
  /** filled ellipse centred at (cx,cy) (pixel-centre coords allow .5) */
  ellipse(cx, cy, rx, ry, c, a = 255) {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.px(x, y, c, a);
      }
    }
    return this;
  }
  disc(cx, cy, r, c, a = 255) { return this.ellipse(cx, cy, r, r, c, a); }
  /** copy src (Canvas) onto this at (dx,dy) honouring alpha; optional source rect */
  blit(src, dx, dy, sx = 0, sy = 0, sw = src.w, sh = src.h) {
    for (let j = 0; j < sh; j++) {
      for (let i = 0; i < sw; i++) {
        const si = ((sy + j) * src.w + (sx + i)) * 4, s = src.data;
        const a = s[si + 3];
        if (a === 0) continue;
        this.px(dx + i, dy + j, [s[si], s[si + 1], s[si + 2]], a);
      }
    }
    return this;
  }
  slice(x, y, w, h) {
    const o = new Canvas(w, h);
    for (let j = 0; j < h; j++) {
      for (let i = 0; i < w; i++) {
        if (x + i < 0 || y + j < 0 || x + i >= this.w || y + j >= this.h) continue;
        const si = ((y + j) * this.w + x + i) * 4, di = (j * w + i) * 4;
        o.data[di] = this.data[si]; o.data[di + 1] = this.data[si + 1];
        o.data[di + 2] = this.data[si + 2]; o.data[di + 3] = this.data[si + 3];
      }
    }
    return o;
  }
  /** add a 1px outline (colour fn(c) of the neighbouring object pixel) around all opaque pixels */
  addOutline(fn = (c) => outline(toHex(c))) {
    const add = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.alpha(x, y) > 0) continue;
        let src = null;
        for (const [dx, dy] of [[0, 1], [1, 0], [-1, 0], [0, -1]]) {
          if (this.alpha(x + dx, y + dy) > 200) { src = this.get(x + dx, y + dy); break; }
        }
        if (src) add.push([x, y, fn(src)]);
      }
    }
    for (const [x, y, c] of add) this.px(x, y, c);
    return this;
  }
}

/** deterministic hash of ints -> [0,1) (position based, independent of draw order) */
export function hash2(x, y, seed = 0) {
  let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(seed | 0, 2147483647)) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) % 100003) / 100003;
}
