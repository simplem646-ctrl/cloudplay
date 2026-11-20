// Seeded RNG (mulberry32). OWNED BY THE LEAD. All gameplay randomness that must be
// reproducible (weather, daily rolls) goes through this; cosmetic randomness may use Math.random.

export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class RNG {
  constructor(seed = 1) {
    this.seed = typeof seed === 'string' ? hashString(seed) : seed >>> 0;
    this._next = mulberry32(this.seed);
  }
  next() {
    return this._next();
  }
  /** integer in [lo, hi] inclusive */
  int(lo, hi) {
    return lo + Math.floor(this.next() * (hi - lo + 1));
  }
  chance(p) {
    return this.next() < p;
  }
  pick(arr) {
    return arr[Math.floor(this.next() * arr.length)];
  }
  /** weighted pick: items = [[value, weight], ...] */
  weighted(items) {
    const total = items.reduce((s, [, w]) => s + w, 0);
    let r = this.next() * total;
    for (const [v, w] of items) {
      r -= w;
      if (r <= 0) return v;
    }
    return items[items.length - 1][0];
  }
  shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
}

/** Convenience: deterministic one-shot RNG from a string key (e.g. `${seed}:weather:${dayIndex}`). */
export const rngFor = (key) => new RNG(hashString(String(key)));
