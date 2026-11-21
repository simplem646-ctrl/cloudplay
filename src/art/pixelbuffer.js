// Pure-JS RGBA pixel buffer: the drawing surface of every generator in src/art.
// No DOM at import time; `toCanvas` creates a canvas lazily (browser only).
import { C, pack, unpack, outlineOf, alphaOf } from './color.js';

export class PixelBuffer {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
  }

  clone() {
    const b = new PixelBuffer(this.w, this.h);
    b.data.set(this.data);
    return b;
  }

  clear() { this.data.fill(0); return this; }

  inb(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; }

  /** packed colour at (x,y), 0 when out of bounds / transparent */
  get(x, y) {
    if (!this.inb(x, y)) return 0;
    const i = (y * this.w + x) * 4;
    const d = this.data;
    return (((d[i + 3] << 24) | (d[i] << 16) | (d[i + 1] << 8) | d[i + 2]) >>> 0);
  }

  opaque(x, y) { return this.inb(x, y) && this.data[(y * this.w + x) * 4 + 3] > 0; }

  /** plain overwrite (colour may carry alpha; alpha 0 erases) */
  set(x, y, c) {
    x = Math.round(x); y = Math.round(y);
    if (!this.inb(x, y)) return this;
    c = C(c);
    const i = (y * this.w + x) * 4;
    const d = this.data;
    d[i] = (c >>> 16) & 255; d[i + 1] = (c >>> 8) & 255; d[i + 2] = c & 255; d[i + 3] = (c >>> 24) & 255;
    return this;
  }

  /** alpha-composite colour `c` (with its own alpha, optionally scaled by `a` 0..1) over the pixel */
  over(x, y, c, a = 1) {
    x = Math.round(x); y = Math.round(y);
    if (!this.inb(x, y)) return this;
    c = C(c);
    const sa = ((c >>> 24) & 255) / 255 * a;
    if (sa <= 0) return this;
    const i = (y * this.w + x) * 4;
    const d = this.data;
    const da = d[i + 3] / 255;
    const oa = sa + da * (1 - sa);
    if (oa <= 0) return this;
    d[i] = Math.round((((c >>> 16) & 255) * sa + d[i] * da * (1 - sa)) / oa);
    d[i + 1] = Math.round((((c >>> 8) & 255) * sa + d[i + 1] * da * (1 - sa)) / oa);
    d[i + 2] = Math.round(((c & 255) * sa + d[i + 2] * da * (1 - sa)) / oa);
    d[i + 3] = Math.round(oa * 255);
    return this;
  }

  /** set only where the pixel is still transparent */
  under(x, y, c) { if (!this.opaque(Math.round(x), Math.round(y))) this.set(x, y, c); return this; }

  /** paint only where something is already drawn */
  paintOn(x, y, c) { if (this.opaque(Math.round(x), Math.round(y))) this.set(x, y, c); return this; }

  rect(x, y, w, h, c) {
    c = C(c);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
    return this;
  }

  /** horizontal span x0..x1 inclusive at row y */
  span(y, x0, x1, c) { for (let x = x0; x <= x1; x++) this.set(x, y, c); return this; }

  line(x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
    return this;
  }

  /** filled ellipse centred at (cx,cy); radii may be fractional. */
  ellipse(cx, cy, rx, ry, c, fn) {
    c = C(c);
    const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx);
    const y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const dx = (x + 0.5 - cx) / (rx + 0.0001), dy = (y + 0.5 - cy) / (ry + 0.0001);
        if (dx * dx + dy * dy <= 1) this.set(x, y, fn ? fn(x, y) : c);
      }
    }
    return this;
  }

  /** elliptical ring between radii (inner scale `t` of outer) */
  ring(cx, cy, rx, ry, t, c) {
    c = C(c);
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        const d = dx * dx + dy * dy;
        if (d <= 1 && d >= t * t) this.set(x, y, c);
      }
    }
    return this;
  }

  /** scanline polygon fill (even-odd) of [[x,y],...]; pixel centres tested. */
  poly(pts, c, fn) {
    c = C(c);
    let miny = Infinity, maxy = -Infinity;
    for (const p of pts) { miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); }
    for (let y = Math.floor(miny); y <= Math.ceil(maxy); y++) {
      const yc = y + 0.5;
      const xs = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= yc && b[1] > yc) || (b[1] <= yc && a[1] > yc)) {
          xs.push(a[0] + ((yc - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
        }
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) {
        for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++) this.set(x, y, fn ? fn(x, y) : c);
      }
    }
    return this;
  }

  /** 1px outline (4-neighbour) around everything opaque, coloured from the neighbour. */
  outline(colorFn = outlineOf, diag = false) {
    const w = this.w, h = this.h;
    const src = this.data.slice();
    const op = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 0;
    const col = (x, y) => {
      const i = (y * w + x) * 4;
      return pack(src[i], src[i + 1], src[i + 2], 255);
    };
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (src[(y * w + x) * 4 + 3] > 0) continue;
        let best = 0, bl = 1e9;
        const consider = (nx, ny) => {
          if (!op(nx, ny)) return;
          const c = col(nx, ny);
          const [r, g, b] = unpack(c);
          const l = r * 0.3 + g * 0.59 + b * 0.11;
          if (l < bl) { bl = l; best = c; }
        };
        consider(x, y - 1); consider(x - 1, y); consider(x + 1, y); consider(x, y + 1);
        if (diag && !best) { consider(x - 1, y - 1); consider(x + 1, y - 1); consider(x - 1, y + 1); consider(x + 1, y + 1); }
        if (best) this.set(x, y, colorFn(best));
      }
    }
    return this;
  }

  /** copy `src` onto this at (dx,dy); transparent source pixels are skipped; alpha blends. */
  blit(src, dx = 0, dy = 0, sx = 0, sy = 0, sw = src.w, sh = src.h) {
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const px = sx + x, py = sy + y;
        if (!src.inb(px, py)) continue;
        const i = (py * src.w + px) * 4;
        const a = src.data[i + 3];
        if (!a) continue;
        const tx = dx + x, ty = dy + y;
        if (!this.inb(tx, ty)) continue;
        if (a === 255) {
          const j = (ty * this.w + tx) * 4;
          this.data[j] = src.data[i]; this.data[j + 1] = src.data[i + 1];
          this.data[j + 2] = src.data[i + 2]; this.data[j + 3] = 255;
        } else {
          this.over(tx, ty, pack(src.data[i], src.data[i + 1], src.data[i + 2], a));
        }
      }
    }
    return this;
  }

  /** horizontally mirrored copy of the whole buffer */
  flipH() {
    const b = new PixelBuffer(this.w, this.h);
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const i = (y * this.w + x) * 4, j = (y * this.w + (this.w - 1 - x)) * 4;
      b.data[j] = this.data[i]; b.data[j + 1] = this.data[i + 1];
      b.data[j + 2] = this.data[i + 2]; b.data[j + 3] = this.data[i + 3];
    }
    return b;
  }

  /** sub-rectangle copy */
  crop(x, y, w, h) {
    const b = new PixelBuffer(w, h);
    b.blit(this, 0, 0, x, y, w, h);
    return b;
  }

  /** ordered 2x2 dither of colour `c` over the rectangle; `density` 0..4 */
  dither(x, y, w, h, c, density = 2) {
    const pat = [[0, 2], [3, 1]];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      if (pat[(y + j) & 1][(x + i) & 1] < density) this.set(x + i, y + j, c);
    }
    return this;
  }

  /** apply fn(x,y,packed) -> packed to every opaque pixel */
  mapOpaque(fn) {
    for (let y = 0; y < this.h; y++) for (let x = 0; x < this.w; x++) {
      const c = this.get(x, y);
      if (alphaOf(c)) this.set(x, y, fn(x, y, c));
    }
    return this;
  }

  countOpaque() {
    let n = 0;
    for (let i = 3; i < this.data.length; i += 4) if (this.data[i] > 0) n++;
    return n;
  }

  /** Lazily wrap into a DOM canvas (browser). Returns null outside the browser. */
  toCanvas() {
    let cv = null;
    if (typeof document !== 'undefined') {
      cv = document.createElement('canvas');
    } else if (typeof OffscreenCanvas !== 'undefined') {
      cv = new OffscreenCanvas(this.w, this.h);
    }
    if (!cv) return null;
    cv.width = this.w;
    cv.height = this.h;
    const ctx = cv.getContext('2d');
    ctx.putImageData(new ImageData(new Uint8ClampedArray(this.data), this.w, this.h), 0, 0);
    return cv;
  }
}
