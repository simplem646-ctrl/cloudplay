// Easing functions (t in 0..1) shared by camera pans, grading tweens and fades. Pure.
export const EASE = {
  linear: (t) => t,
  in: (t) => t * t,
  out: (t) => 1 - (1 - t) * (1 - t),
  inOut: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  smooth: (t) => t * t * (3 - 2 * t),
};

export function resolveEase(e) {
  if (typeof e === 'function') return e;
  return EASE[e] || EASE.inOut;
}
