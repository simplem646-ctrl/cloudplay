/** Shared pure helpers. No DOM, no imports beyond the registry. */
import { SEASONS, WEEKDAYS, DAYS_PER_SEASON, DAYS_PER_YEAR } from './registry.js';

// ---- math ----
export const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const invLerp = (a, b, v) => (a === b ? 0 : (v - a) / (b - a));
export const smoothstep = (a, b, v) => {
  const t = clamp(invLerp(a, b, v), 0, 1);
  return t * t * (3 - 2 * t);
};
/** Frame-rate independent exponential smoothing toward target. */
export const damp = (current, target, lambda, dt) => lerp(current, target, 1 - Math.exp(-lambda * dt));
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// ---- seeded randomness ----
/** @returns {() => number} deterministic PRNG in [0,1) */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rng() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** FNV-1a 32-bit string hash -> uint32. */
export function hashString(str) {
  let h = 0x811c9dc5;
  const s = String(str);
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}
/** Seeded rng from any parts: rngFor('forage', dayNum, areaId). */
export const rngFor = (...parts) => mulberry32(hashString(parts.join('|')));
export const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];
export function weightedPick(items, weightFn = (x) => x.weight ?? 1, rng = Math.random) {
  let total = 0;
  const ws = items.map((it) => {
    const w = Math.max(0, Number(weightFn(it)) || 0);
    total += w;
    return w;
  });
  if (total <= 0) return items.length ? items[0] : undefined;
  let r = rng() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r < 0) return items[i];
  }
  return items[items.length - 1];
}
/** Fisher-Yates; returns a NEW array. */
export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---- facing / direction ----
const DIR_YAW = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };
const DIR_VEC = { n: { x: 0, z: -1 }, e: { x: 1, z: 0 }, s: { x: 0, z: 1 }, w: { x: -1, z: 0 } };
export const dirToYaw = (dir) => DIR_YAW[dir] ?? 0;
/** Nearest cardinal direction for a yaw (radians). */
export function yawToDir(yaw) {
  const TAU = Math.PI * 2;
  const y = ((yaw % TAU) + TAU) % TAU; // 0..2pi
  if (y < Math.PI / 4 || y >= (7 * Math.PI) / 4) return 's';
  if (y < (3 * Math.PI) / 4) return 'e';
  if (y < (5 * Math.PI) / 4) return 'n';
  return 'w';
}
/** Dominant-axis facing for a movement vector (ties favour the x axis). */
export function vecToDir(dx, dz) {
  if (Math.abs(dx) >= Math.abs(dz)) return dx >= 0 ? 'e' : 'w';
  return dz >= 0 ? 's' : 'n';
}
export const dirVec = (dir) => {
  const v = DIR_VEC[dir] || DIR_VEC.s;
  return { x: v.x, z: v.z };
};

// ---- time ----
/** 'HH:MM' -> minutes since midnight (hours may be >= 24). Numbers pass through. */
export function parseHHMM(s) {
  if (typeof s === 'number') return s;
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(s).trim());
  if (!m) throw new Error(`bad HH:MM "${s}"`);
  return Number(m[1]) * 60 + Number(m[2]);
}
const pad2 = (n) => String(n).padStart(2, '0');
/** minutes -> 'HH:MM' (hours may be >= 24, e.g. 1560 -> '26:00'). */
export function formatHHMM(min) {
  const m = Math.max(0, Math.floor(min));
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}
/** minutes -> '6:00 AM' (wraps past midnight: 1560 -> '2:00 AM'). */
export function formatClock12(min) {
  const m = ((Math.floor(min) % 1440) + 1440) % 1440;
  const h24 = Math.floor(m / 60);
  const mm = m % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${pad2(mm)} ${h24 < 12 ? 'AM' : 'PM'}`;
}
/** from <= min < to; `from`/`to` may be 'HH:MM' strings or minutes. to < from wraps over midnight. */
export function timeInRange(min, from, to) {
  const a = parseHHMM(from);
  const b = parseHHMM(to);
  return a <= b ? min >= a && min < b : min >= a || min < b;
}
/** Absolute day number: Spring 1 Y1 = 1. */
export const dayNumber = (t) => (t.year - 1) * DAYS_PER_YEAR + t.season * DAYS_PER_SEASON + t.day;
export function fromDayNumber(n) {
  const z = n - 1;
  const year = Math.floor(z / DAYS_PER_YEAR) + 1;
  const rem = z - (year - 1) * DAYS_PER_YEAR;
  return { year, season: Math.floor(rem / DAYS_PER_SEASON), day: (rem % DAYS_PER_SEASON) + 1 };
}
/** Weekday index 0..6 (mon..sun) from day-of-season 1..28. */
export const weekdayIndex = (day) => (((day - 1) % 7) + 7) % 7;
export const weekdayName = (day) => WEEKDAYS[weekdayIndex(day)];
export const seasonName = (i) => SEASONS[((i % 4) + 4) % 4];
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/** 'Spring 1 (Mon)' */
export const formatDate = (time) => `${cap(seasonName(time.season))} ${time.day} (${cap(weekdayName(time.day))})`;

// ---- misc ----
export function deepClone(v) {
  if (typeof structuredClone === 'function') return structuredClone(v);
  return JSON.parse(JSON.stringify(v));
}
export const isPlainObject = (v) => v !== null && typeof v === 'object' && Object.getPrototypeOf(v) === Object.prototype;
/** Wrap fn so it runs at most once; later calls return the first result. */
export function once(fn) {
  let done = false;
  let result;
  return function onceWrapper(...args) {
    if (!done) {
      done = true;
      result = fn.apply(this, args);
    }
    return result;
  };
}
