// Pure (DOM-free) map renderer: composes ground -> deco -> above from the season atlas into an RGBA buffer.
// Used by the dev previewer, by test/world/dump_maps.mjs (PNG per map+season) and handy for debugging.
import { TILES } from './tiles.js';
import { renderAtlasPixels } from './tileset.js';

/** @returns {{data:Uint8ClampedArray,width:number,height:number}} one pixel per world pixel (16 px tiles) */
export function renderMapPixels(def, season, { overlay = false, frame = 0, actors = true } = {}) {
  const atlas = renderAtlasPixels(season);
  const W = def.width * 16, H = def.height * 16;
  const out = new Uint8ClampedArray(W * H * 4);
  const blit = (ti, tx, ty) => {
    const meta = TILES[ti];
    if (meta.anim) ti = meta.anim.frames[frame % meta.anim.frames.length];
    const sx = (ti % atlas.cols) * 16, sy = Math.floor(ti / atlas.cols) * 16;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const si = ((sy + y) * atlas.width + sx + x) * 4;
        const a = atlas.data[si + 3];
        if (!a) continue;
        const di = ((ty * 16 + y) * W + tx * 16 + x) * 4;
        const t = a / 255;
        out[di] += (atlas.data[si] - out[di]) * t; out[di + 1] += (atlas.data[si + 1] - out[di + 1]) * t;
        out[di + 2] += (atlas.data[si + 2] - out[di + 2]) * t; out[di + 3] = 255;
      }
    }
  };
  for (let i = 0; i < W * H; i++) { out[i * 4] = 23; out[i * 4 + 1] = 18; out[i * 4 + 2] = 31; out[i * 4 + 3] = 255; }
  for (const L of ['ground', 'deco']) for (let y = 0; y < def.height; y++) for (let x = 0; x < def.width; x++) { const t = def.layers[L][y * def.width + x]; if (t) blit(t, x, y); }
  if (actors) for (const a of Object.values(def.anchors)) if (a.__actor) blit(a.__actor, a.x, a.y);
  for (let y = 0; y < def.height; y++) for (let x = 0; x < def.width; x++) { const t = def.layers.above[y * def.width + x]; if (t) blit(t, x, y); }
  if (overlay) {
    const tint = (tx, ty, r, g, b, a) => {
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const di = ((ty * 16 + y) * W + tx * 16 + x) * 4;
        out[di] += (r - out[di]) * a; out[di + 1] += (g - out[di + 1]) * a; out[di + 2] += (b - out[di + 2]) * a;
      }
    };
    const frameRect = (x0, y0, w, h, c) => {
      for (let x = x0 * 16; x < (x0 + w) * 16; x++) for (const y of [y0 * 16, (y0 + h) * 16 - 1]) { const di = (y * W + x) * 4; out[di] = c[0]; out[di + 1] = c[1]; out[di + 2] = c[2]; }
      for (let y = y0 * 16; y < (y0 + h) * 16; y++) for (const x of [x0 * 16, (x0 + w) * 16 - 1]) { const di = (y * W + x) * 4; out[di] = c[0]; out[di + 1] = c[1]; out[di + 2] = c[2]; }
    };
    for (let y = 0; y < def.height; y++) for (let x = 0; x < def.width; x++) if (def.collision[y * def.width + x]) tint(x, y, 255, 40, 40, 0.28);
    for (const w of def.warps) { for (let j = 0; j < w.h; j++) for (let i = 0; i < w.w; i++) tint(w.x + i, w.y + j, 60, 120, 255, 0.45); frameRect(w.x, w.y, w.w, w.h, [80, 160, 255]); }
    for (const it of def.interactables) frameRect(it.x, it.y, it.w, it.h, [255, 220, 40]);
    for (const a of Object.values(def.anchors)) tint(a.x, a.y, 40, 255, 120, 0.5);
  }
  return { data: out, width: W, height: H };
}
