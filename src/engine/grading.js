// Colour grading presets and maths (pure). The renderer's grading shader consumes a
// "grading" object:  { tint:[r,g,b], brightness, saturation, vignette }  (all numbers).
import { clamp } from '../core/util.js';

export const GRADING_PRESETS = {
  day: { tint: [1, 1, 1], brightness: 1, saturation: 1.05, vignette: 0.1 },
  dawn: { tint: [1, 0.88, 0.7], brightness: 0.98, saturation: 1.08, vignette: 0.22 },
  sunset: { tint: [1, 0.76, 0.58], brightness: 0.97, saturation: 1.12, vignette: 0.26 },
  night: { tint: [0.34, 0.42, 0.78], brightness: 0.92, saturation: 0.8, vignette: 0.42 },
  lantern: { tint: [0.62, 0.5, 0.74], brightness: 0.95, saturation: 0.95, vignette: 0.38 },
  indoor: { tint: [1, 0.95, 0.86], brightness: 1, saturation: 1.02, vignette: 0.2 },
};

export const cloneGrading = (g) => ({ tint: [g.tint[0], g.tint[1], g.tint[2]], brightness: g.brightness, saturation: g.saturation, vignette: g.vignette });

/** A preset name or (partial) grading object -> full grading object (fills gaps from `day`). */
export function resolveGrading(g) {
  if (typeof g === 'string') {
    const p = GRADING_PRESETS[g];
    if (!p) throw new Error(`Unknown grading preset "${g}"`);
    return cloneGrading(p);
  }
  const base = GRADING_PRESETS.day;
  return {
    tint: g && g.tint ? [g.tint[0], g.tint[1], g.tint[2]] : [...base.tint],
    brightness: g && g.brightness !== undefined ? g.brightness : base.brightness,
    saturation: g && g.saturation !== undefined ? g.saturation : base.saturation,
    vignette: g && g.vignette !== undefined ? g.vignette : base.vignette,
  };
}

/** Linear blend of two gradings into `out` (a grading object; allocated if omitted). */
export function lerpGrading(a, b, t, out = { tint: [0, 0, 0] }) {
  const k = clamp(t, 0, 1);
  for (let i = 0; i < 3; i++) out.tint[i] = a.tint[i] + (b.tint[i] - a.tint[i]) * k;
  out.brightness = a.brightness + (b.brightness - a.brightness) * k;
  out.saturation = a.saturation + (b.saturation - a.saturation) * k;
  out.vignette = a.vignette + (b.vignette - a.vignette) * k;
  return out;
}

// Keyframes for a whole day (minutes since midnight): continuous grading for the overworld clock.
const DAY_KEYS = [
  [0, 'night'],
  [5 * 60 + 15, 'night'],
  [6 * 60 + 30, 'dawn'],
  [8 * 60, 'day'],
  [16 * 60 + 30, 'day'],
  [18 * 60, 'sunset'],
  [19 * 60 + 30, 'night'],
  [24 * 60, 'night'],
];

/** Smooth outdoor grading for a clock time (minutes since midnight; values >= 1440 wrap). */
export function gradingAt(minutes, out) {
  const m = ((minutes % 1440) + 1440) % 1440;
  for (let i = 1; i < DAY_KEYS.length; i++) {
    if (m <= DAY_KEYS[i][0]) {
      const [m0, n0] = DAY_KEYS[i - 1];
      const [m1, n1] = DAY_KEYS[i];
      const t = m1 === m0 ? 1 : (m - m0) / (m1 - m0);
      return lerpGrading(GRADING_PRESETS[n0], GRADING_PRESETS[n1], t * t * (3 - 2 * t), out);
    }
  }
  return resolveGrading('night');
}

/** Overcast/rain look: scales a grading toward grey/dark. amount 0..1 (storm ~0.8). Returns a new grading. */
export function overcastGrading(g, amount = 0.5) {
  const r = resolveGrading(g);
  const k = clamp(amount, 0, 1);
  const grey = 0.55 + 0.45 * (r.tint[0] * 0.3 + r.tint[1] * 0.59 + r.tint[2] * 0.11);
  for (let i = 0; i < 3; i++) r.tint[i] = (r.tint[i] + (grey * 0.9 - r.tint[i]) * 0.35 * k) * (1 - 0.22 * k);
  r.tint[2] = Math.min(1.1, r.tint[2] * (1 + 0.05 * k));
  r.saturation *= 1 - 0.35 * k;
  r.vignette = r.vignette + 0.1 * k;
  return r;
}
