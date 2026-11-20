// Small shared helpers (pure, no DOM). OWNED BY THE LEAD.

export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
export const lerp = (a, b, t) => a + (b - a) * t;
export const approach = (v, target, step) =>
  v < target ? Math.min(target, v + step) : Math.max(target, v - step);

/** 'HH:MM' -> minutes since midnight. Accepts 24:00-27:59 for after-midnight times. */
export function parseTime(str) {
  if (typeof str === 'number') return str;
  const m = /^(\d{1,2}):(\d{2})$/.exec(str);
  if (!m) throw new Error(`Bad time string: ${str}`);
  return Number(m[1]) * 60 + Number(m[2]);
}

/** minutes since midnight -> 'HH:MM' (24h, wraps past 24h to 00:xx). */
export function formatTime24(min) {
  const m = ((Math.floor(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** minutes since midnight -> '3:05 PM' style label. */
export function formatTime12(min) {
  const m = ((Math.floor(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const ap = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${ap}`;
}

export const deepClone = (o) => JSON.parse(JSON.stringify(o));
export const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
export const toArray = (v) => (v === undefined || v === null ? [] : Array.isArray(v) ? v : [v]);

/** Tile coords -> pixel position of an actor's feet (bottom-centre of the tile). */
export const tileToFeet = (tx, ty, tile = 16) => ({ x: tx * tile + tile / 2, y: ty * tile + tile - 2 });
/** Feet pixel position -> tile coords. */
export const feetToTile = (px, py, tile = 16) => ({ x: Math.floor(px / tile), y: Math.floor((py - 1) / tile) });
