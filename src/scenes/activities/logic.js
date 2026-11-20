// Pure logic for the mini-games (Node-testable): ranking, scoring, seeded chart/order generation.
import { RNG } from '../../core/rng.js';

/** Common result ranking: score 0..100 -> 'gold' | 'silver' | 'bronze' | 'none'. */
export const rankFor = (score) => (score >= 85 ? 'gold' : score >= 65 ? 'silver' : score >= 40 ? 'bronze' : 'none');
export const RANK_COMMENT = {
  gold: ['Spectacular!', 'You nailed it!', 'Absolutely brilliant.'],
  silver: ['Nicely done!', 'Solid work.', 'Almost perfect!'],
  bronze: ['Not bad at all.', 'A decent effort.', 'You will get there.'],
  none: ['Better luck next time.', 'Keep practising!', 'Shake it off and try again.'],
};
export const clampScore = (v) => Math.max(0, Math.min(100, Math.round(v)));

// ---------------------------------------------------------------- track sprint (100 m)
export const SPRINT = { distance: 100, maxSpeedBase: 8.2, maxSpeedFitness: 2.0, decay: 0.55, boost: 0.62, falseStartPenalty: 0.6 };

/** Player's top speed from fitness 0..100 (m/s). */
export const sprintTopSpeed = (fitness = 10) => SPRINT.maxSpeedBase + (Math.min(100, fitness) / 100) * SPRINT.maxSpeedFitness;

/** Opponent target speeds (m/s) for a difficulty 0..1: three runners, slowest to fastest. */
export function sprintOpponents(difficulty = 0.5, seed = 1) {
  const rng = new RNG(seed);
  const base = 7.6 + difficulty * 1.5;
  return [base - 0.55 + rng.next() * 0.3, base - 0.05 + rng.next() * 0.3, base + 0.45 + rng.next() * 0.3];
}

/** Score from finishing place (1-4) and time in seconds. */
export function sprintScore(place, time) {
  const byPlace = [88, 70, 50, 25][Math.max(0, Math.min(3, place - 1))];
  const timeBonus = Math.max(0, Math.min(12, (15 - time) * 3));
  return clampScore(byPlace + timeBonus);
}

// ---------------------------------------------------------------- rhythm
export const RHYTHM = { perfect: 0.075, good: 0.15, travel: 1.4, lanes: 4 };

/**
 * Deterministic note chart. Returns notes sorted by time: { t (seconds), lane 0..3 }.
 * bpm sets the grid; difficulty 0..1 raises note density. Min spacing per lane 0.18 s; never more than 2 simultaneous notes.
 */
export function makeChart({ seed = 1, bpm = 112, seconds = 24, difficulty = 0.4, lead = 2.0 } = {}) {
  const rng = new RNG(seed);
  const beat = 60 / bpm, step = beat / 2;
  const notes = [];
  const lastLane = [-9, -9, -9, -9];
  let lane = rng.int(0, 3);
  for (let t = lead; t < seconds; t += step) {
    const strong = Math.abs((t - lead) % beat) < 1e-6;
    const p = strong ? 0.55 + difficulty * 0.4 : 0.15 + difficulty * 0.45;
    if (!rng.chance(p)) continue;
    // mostly stepwise motion across lanes, sometimes a jump
    lane = rng.chance(0.65) ? Math.max(0, Math.min(3, lane + rng.pick([-1, 1]))) : rng.int(0, 3);
    if (t - lastLane[lane] < 0.18) lane = (lane + 1) % 4;
    notes.push({ t: +t.toFixed(3), lane });
    lastLane[lane] = t;
    if (difficulty > 0.5 && strong && rng.chance(0.18)) {
      const l2 = (lane + 2) % 4;
      if (t - lastLane[l2] >= 0.18) { notes.push({ t: +t.toFixed(3), lane: l2 }); lastLane[l2] = t; }
    }
  }
  return notes;
}

/** Judge a hit: |dt| in seconds -> 'perfect' | 'good' | null (miss). */
export const judgeHit = (dt) => (Math.abs(dt) <= RHYTHM.perfect ? 'perfect' : Math.abs(dt) <= RHYTHM.good ? 'good' : null);

export function rhythmScore({ perfect = 0, good = 0, total = 0, maxCombo = 0 }) {
  if (!total) return 0;
  const acc = (perfect + good * 0.6) / total;
  return clampScore(acc * 95 + Math.min(5, (maxCombo / total) * 5));
}

// ---------------------------------------------------------------- cafe
export const CAFE_ITEMS = ['coffee', 'tea', 'cake', 'sandwich']; // lanes: left, down, up, right
export const CAFE = { seconds: 45, patience: 11, firstDelay: 1.2 };

/** Customers: { at (spawn second), item (index into CAFE_ITEMS), patience (seconds) }. */
export function makeOrders({ seed = 1, seconds = CAFE.seconds, difficulty = 0.4 } = {}) {
  const rng = new RNG(seed);
  const out = [];
  let t = CAFE.firstDelay;
  while (t < seconds - 6) {
    out.push({ at: +t.toFixed(2), item: rng.int(0, 3), patience: +(CAFE.patience - difficulty * 3 - rng.next() * 1.5).toFixed(2) });
    t += 3.4 - difficulty * 1.4 + rng.next() * 0.8;
  }
  return out;
}

/** served: [{ remaining, patience }] for each correctly served order; spawned = customers that appeared. */
export function cafeScore({ served = [], spawned = 0, mistakes = 0, walkedOut = 0 }) {
  if (!spawned) return 0;
  const speed = served.length ? served.reduce((s, o) => s + o.remaining / o.patience, 0) / served.length : 0;
  return clampScore((served.length / spawned) * 80 + speed * 20 - mistakes * 2 - walkedOut * 1);
}
