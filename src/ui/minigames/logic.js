// Pure, deterministic mini-game logic (no DOM). rng is injectable (defaults to Math.random).
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export const FISHING_TIME_LIMIT = 25;

/** Static tuning derived from fish + rod. */
export function fishingParams({ fish = {}, rodPower = 1 } = {}) {
  const difficulty = clamp(Number(fish.difficulty) || 1, 1, 5);
  const speed = clamp(Number(fish.speed) || 1, 0.3, 3);
  const rod = clamp(Number(rodPower) || 1, 1, 3);
  return {
    difficulty, speed, rod,
    zoneSize: clamp(0.2 + 0.05 * rod - 0.02 * difficulty, 0.12, 0.42),
    fill: 0.2 + 0.03 * rod,            // progress per second while the fish is inside the zone
    drain: 0.1 + 0.02 * difficulty,    // progress per second while outside
    fishSpeed: 0.18 + 0.1 * difficulty * speed, // max fish speed (fraction of the column per second)
    jitter: 0.02 * difficulty,
    limit: FISHING_TIME_LIMIT,
  };
}

/** Fresh fishing state. pos/fishPos are 0 (bottom) .. 1 (top). */
export function createFishing(opts, rng = Math.random) {
  const p = fishingParams(opts);
  return {
    p, phase: 'playing', time: 0, pos: p.zoneSize / 2, vel: 0, fishPos: 0.5, fishTarget: 0.5, fishTimer: 0.5,
    progress: 0.3, inside: true, outTime: 0, slips: 0, rngSeed: rng(), perfect: true,
  };
}

/**
 * Advance one tick. holding = confirm/pointer held. Returns state.phase: 'playing' | 'caught' | 'lost'.
 */
export function stepFishing(s, dt, holding, rng = Math.random) {
  if (s.phase !== 'playing') return s.phase;
  const p = s.p;
  dt = Math.min(dt, 0.1);
  s.time += dt;
  // catch zone: hold to rise, gravity otherwise
  const accel = holding ? 2.6 : -2.1;
  s.vel = clamp(s.vel + accel * dt, -1.1, 1.1);
  s.pos += s.vel * dt;
  const lo = p.zoneSize / 2, hi = 1 - p.zoneSize / 2;
  if (s.pos < lo) { s.pos = lo; s.vel = Math.max(0, -s.vel * 0.25); }
  if (s.pos > hi) { s.pos = hi; s.vel = Math.min(0, -s.vel * 0.25); }
  // fish: darts toward random targets
  s.fishTimer -= dt;
  if (s.fishTimer <= 0) {
    const far = rng() < 0.5 + 0.08 * p.difficulty;
    s.fishTarget = far ? (rng() < 0.5 ? rng() * 0.3 : 0.7 + rng() * 0.3) : clamp(s.fishPos + (rng() - 0.5) * 0.5, 0.04, 0.96);
    s.fishTimer = (0.45 + rng() * 1.1) / (0.55 + 0.2 * p.difficulty * p.speed);
  }
  const maxStep = p.fishSpeed * dt;
  s.fishPos += clamp(s.fishTarget - s.fishPos, -maxStep, maxStep);
  s.fishPos = clamp(s.fishPos + (rng() - 0.5) * p.jitter * dt * 8, 0.02, 0.98);
  // progress
  const inside = Math.abs(s.fishPos - s.pos) <= p.zoneSize / 2;
  if (inside) { s.progress += p.fill * dt; s.outTime = 0; } else {
    s.progress -= p.drain * dt; s.outTime += dt;
    if (s.outTime > 0.7 && s.perfect) s.perfect = false;
  }
  if (inside !== s.inside) { if (!inside) s.slips += 1; s.inside = inside; }
  s.progress = clamp(s.progress, 0, 1);
  if (s.progress >= 1) { s.phase = 'caught'; } else if (s.progress <= 0 || s.time >= p.limit) { s.phase = 'lost'; s.perfect = false; }
  return s.phase;
}
export const fishingResult = (s) => ({ caught: s.phase === 'caught', perfect: s.phase === 'caught' && s.perfect });

// ---------------------------------------------------------------- kneading
export const GRADES = { great: 1, good: 0.75, okay: 0.4, miss: 0 };

/** Sweet-spot width (fraction of the bar) for a difficulty 1..5. */
export const sweetWidth = (difficulty) => clamp(0.3 - 0.045 * (clamp(Number(difficulty) || 1, 1, 5) - 1), 0.1, 0.3);

/** Grade a press: d = |marker - centre|. */
export function gradeHit(d, width) {
  const half = width / 2;
  if (d <= half * 0.35) return 'great';
  if (d <= half) return 'good';
  if (d <= half * 1.8) return 'okay';
  return 'miss';
}

export function createKneading({ difficulty = 1, rounds = 3 } = {}, rng = Math.random) {
  const d = clamp(Number(difficulty) || 1, 1, 5);
  const s = {
    difficulty: d, rounds: Math.max(1, Math.floor(rounds)), round: 0, marker: 0, dir: 1, speed: 0.75 + 0.2 * d,
    width: sweetWidth(d), centre: 0.5, results: [], phase: 'playing', score: 0,
  };
  s.centre = pickCentre(s, rng);
  return s;
}
function pickCentre(s, rng) { return clamp(0.22 + rng() * 0.56, s.width / 2, 1 - s.width / 2); }

/** Move the marker (ping-pong across 0..1). */
export function stepKneading(s, dt) {
  if (s.phase !== 'playing') return;
  s.marker += s.dir * s.speed * Math.min(dt, 0.1);
  if (s.marker > 1) { s.marker = 2 - s.marker; s.dir = -1; }
  if (s.marker < 0) { s.marker = -s.marker; s.dir = 1; }
}

/** Register a press; returns the grade. Finishes after the last round (score = mean of grade values). */
export function pressKneading(s, rng = Math.random) {
  if (s.phase !== 'playing') return null;
  const grade = gradeHit(Math.abs(s.marker - s.centre), s.width);
  s.results.push(grade);
  s.round += 1;
  if (s.round >= s.rounds) {
    s.phase = 'done';
    s.score = kneadScore(s.results);
  } else {
    s.centre = pickCentre(s, rng);
    s.speed *= 1.08;
  }
  return grade;
}
export const kneadScore = (results) => (results.length ? results.reduce((a, g) => a + GRADES[g], 0) / results.length : 0);
