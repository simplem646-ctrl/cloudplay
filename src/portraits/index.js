// Procedural late-90s anime bust portraits (Canvas2D only, no image files).
// API: ARCHITECTURE §7. Importable in Node: canvases are created lazily inside functions.
import { W, H, now } from './util.js';
import { SPECS } from './specs.js';
import { EXPRESSIONS as EXPR_LIST } from './expressions.js';
import { renderPortrait } from './render.js';

/** Characters that have portraits (mirrors core/registry PORTRAIT_IDS). */
export const PORTRAIT_IDS = ['mira', 'willa', 'juno', 'rhea', 'celeste', 'odell', 'theo', 'nana_fen', 'gus'];
/** Supported expressions (mirrors core/registry EXPRESSIONS). */
export const EXPRESSIONS = EXPR_LIST.slice();
/** Logical portrait size in px (canvases are drawn at 2x). */
export const PORTRAIT_SIZE = { w: W, h: H };

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const cache = new Map();
/** Timing info for the lab/tests (JS-side render ms; preload slice ms include rasterisation). */
export const renderStats = { count: 0, totalMs: 0, lastMs: 0, maxMs: 0, slices: 0, maxSliceMs: 0 };

function canRender() {
  return (typeof document !== 'undefined' && !!document.createElement) || typeof OffscreenCanvas !== 'undefined';
}

function normSeason(season) {
  const s = typeof season === 'number' ? SEASONS[season] : season;
  return s === 'winter' ? 'winter' : ''; // only winter has a variant (scarf)
}

/** True only for the 9 portrait characters. */
export function hasPortrait(id) {
  return PORTRAIT_IDS.includes(id);
}

/**
 * Cached portrait canvas: 1024x1280 backing store for a 512x640 logical portrait, transparent.
 * @param {string} id
 * @param {string} [expression='neutral'] unknown expressions fall back to neutral
 * @param {{season?: string|number, outline?: boolean}} [opts]
 * @returns {HTMLCanvasElement|OffscreenCanvas|null}
 */
export function getPortrait(id, expression = 'neutral', opts = {}) {
  if (!hasPortrait(id) || !canRender()) return null;
  const expr = EXPRESSIONS.includes(expression) ? expression : 'neutral';
  const season = normSeason(opts && opts.season);
  const outline = !(opts && opts.outline === false);
  const key = `${id}|${expr}|${season}|${outline ? 1 : 0}`;
  let c = cache.get(key);
  if (c) return c;
  const t0 = now();
  c = renderPortrait(id, expr, { season, outline });
  const dt = now() - t0;
  renderStats.count++; renderStats.totalMs += dt; renderStats.lastMs = dt; renderStats.maxMs = Math.max(renderStats.maxMs, dt);
  cache.set(key, c);
  return c;
}

/** Draw a portrait into a 2D context; w/h default to the logical 512x640 size. */
export function drawPortrait(ctx, id, expression = 'neutral', x = 0, y = 0, w = W, h = H) {
  const c = getPortrait(id, expression);
  if (!c || !ctx) return false;
  ctx.drawImage(c, x, y, w, h);
  return true;
}

function nextSlice(fn) {
  if (typeof requestIdleCallback === 'function') requestIdleCallback(fn, { timeout: 120 });
  else setTimeout(fn, 0);
}

/**
 * Render every expression of the given characters in small idle slices so frames never hitch.
 * @param {string[]} [ids=PORTRAIT_IDS]
 * @param {{season?: string|number, budgetMs?: number}} [opts]
 * @returns {Promise<number>} number of portraits rendered
 */
export function preload(ids = PORTRAIT_IDS, opts = {}) {
  const list = (Array.isArray(ids) ? ids : [ids]).filter(hasPortrait);
  if (!canRender()) return Promise.resolve(0);
  const budget = opts.budgetMs ?? 30;
  const queue = [];
  for (const id of list) for (const e of EXPRESSIONS) queue.push([id, e]);
  let done = 0, last = 0;
  return new Promise((resolve) => {
    const step = () => {
      const t0 = now();
      // at least one portrait per slice; more only while the slice stays under budget.
      // A 1px read-back forces the GPU to rasterise now, inside this slice, instead of
      // spilling deferred work into the next animation frame.
      do {
        const item = queue.shift();
        if (!item) break;
        const s = now();
        const c = getPortrait(item[0], item[1], { season: opts.season });
        try { c.getContext('2d').getImageData(0, 0, 1, 1); } catch (e) { /* ignore */ }
        last = now() - s;
        done++;
      } while (queue.length && now() - t0 + last < budget);
      renderStats.slices++;
      renderStats.maxSliceMs = Math.max(renderStats.maxSliceMs, now() - t0);
      if (queue.length) nextSlice(step); else resolve(done);
    };
    nextSlice(step);
  });
}

/** Drop cached canvases (e.g. on quality change). */
export function clearCache() { cache.clear(); }
