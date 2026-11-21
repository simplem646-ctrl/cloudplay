/** Procedural pose animation. A pose is a Float32Array of channels (see CH). Animations edit a pose that is
 *  pre-filled with the locomotion base; the rig crossfades base <-> action. Pure math, no three. */
import { ANIMATIONS } from '../core/registry.js';

export const CH = ['by', 'bx', 'bz', 'brx', 'bry', 'brz', 'sq', 'hx', 'hy', 'hz', 'hoy', 'alf', 'alo', 'alt', 'arf', 'aro', 'art', 'llf', 'lrf', 'lsp', 'lock', 'prx'];
export const C = Object.fromEntries(CH.map((n, i) => [n, i]));
export const NCH = CH.length;
export const REST = new Float32Array(NCH);
REST[C.lock] = 1;

const sm = (t) => { t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); };
/** smooth in over [0,a], out over [b,1] */
const env = (u, a = 0.15, b = 0.85) => sm(u / a) * sm((1 - u) / (1 - b));
const S = Math.sin, Co = Math.cos, PI = Math.PI;
const arms = (P, lf, lo, rf, ro) => { P[C.alf] = lf; P[C.alo] = lo; P[C.arf] = rf; P[C.aro] = ro; };
const lerpTo = (P, ch, v, w) => { P[ch] += (v - P[ch]) * w; };

// ------------------------------------------------------------------ locomotion base
export function poseIdle(P, t) {
  P.set(REST);
  const b = S(t * 2.3);
  P[C.sq] = 0.014 * b; P[C.hz] = 0.025 * S(t * 0.8); P[C.hx] = 0.02 * S(t * 2.3 + 1); P[C.bry] = 0.04 * S(t * 0.6);
  P[C.alo] = 0.1 + 0.012 * b; P[C.aro] = 0.1 + 0.012 * b; P[C.alf] = 0.03 * S(t * 0.9); P[C.arf] = -0.03 * S(t * 0.9);
  const g = sm((S(t * 0.23) - 0.55) / 0.3);
  P[C.hy] = 0.5 * g * S(t * 0.9);
  P[C.hx] += 0.05 * g;
}
export function poseWalk(P, ph) {
  P.set(REST);
  const s = S(ph), c = Co(ph);
  P[C.llf] = s * 0.72; P[C.lrf] = -s * 0.72;
  P[C.alf] = -s * 0.6; P[C.arf] = s * 0.6; P[C.alo] = 0.12; P[C.aro] = 0.12;
  P[C.by] = Math.abs(c) * 0.02; P[C.bry] = s * 0.08; P[C.brz] = c * 0.03; P[C.brx] = 0.05;
  P[C.hz] = -c * 0.04; P[C.hy] = -s * 0.04; P[C.sq] = -Math.abs(c) * 0.01;
}
export function poseRun(P, ph) {
  P.set(REST);
  const s = S(ph), c = Co(ph);
  P[C.llf] = s * 1.05; P[C.lrf] = -s * 1.05;
  P[C.alf] = -s * 1.0 + 0.35; P[C.arf] = s * 1.0 + 0.35; P[C.alo] = 0.22; P[C.aro] = 0.22;
  P[C.by] = Math.abs(s) * 0.06; P[C.bry] = s * 0.14; P[C.brx] = 0.22; P[C.brz] = c * 0.03;
  P[C.hx] = -0.08; P[C.hz] = -c * 0.05; P[C.sq] = -Math.abs(s) * 0.03;
  P[C.lock] = 0.4;
}

// ------------------------------------------------------------------ actions: (P, t, u, o) edit the base pose
const hop = (P, u, h) => { P[C.by] += Math.abs(S(u * PI)) * h; P[C.lock] = 0; };

export const DEFS = {
  talk: { loop: true, dur: 1, fn(P, t) { const b = S(t * 7); P[C.hx] += 0.05 * b; P[C.hz] += 0.05 * S(t * 2.1); P[C.hy] += 0.08 * S(t * 1.3); P[C.sq] += 0.02 * b; P[C.arf] = 0.55 + 0.45 * S(t * 3.1); P[C.aro] = 0.35 + 0.15 * S(t * 2.3); } },
  nod: { dur: 0.75, fn(P, t, u) { P[C.hx] += 0.38 * S(u * PI * 4) * env(u, 0.1, 0.9); P[C.sq] += 0.015 * S(u * PI * 4); } },
  shake_head: { dur: 0.95, fn(P, t, u) { P[C.hy] += 0.45 * S(u * PI * 6) * env(u, 0.1, 0.9); P[C.hz] += 0.08 * S(u * PI * 6 + 1); } },
  wave: { dur: 1.7, fn(P, t, u) { const e = env(u, 0.18, 0.85); P[C.aro] = lerp0(P[C.aro], 2.35 + 0.3 * S(t * 12), e); P[C.arf] = lerp0(P[C.arf], 0, e); P[C.hz] += 0.1 * e; P[C.hx] -= 0.04 * e; P[C.sq] += 0.015 * S(t * 6) * e; } },
  happy_hop: { dur: 0.8, fn(P, t, u) { const e = env(u, 0.1, 0.9); hop(P, u, 0.2); P[C.sq] += (u < 0.18 ? 0.14 * sm(u / 0.18) : -0.07 * S(u * PI)) * (1) + (u > 0.88 ? 0.1 * (u - 0.88) / 0.12 * 0 : 0); const up = S(u * PI); P[C.alo] += 1.2 * up; P[C.aro] += 1.2 * up; P[C.hx] -= 0.1 * up; } },
  cheer: { dur: 1.6, fn(P, t, u) { const e = env(u, 0.1, 0.9); P[C.by] += Math.abs(S(u * PI * 2.5)) * 0.15 * e; P[C.lock] = 1 - e; P[C.alo] += (2.4 + 0.3 * S(t * 10)) * e; P[C.aro] += (2.4 + 0.3 * S(t * 10 + 1)) * e; P[C.hx] -= 0.15 * e; P[C.sq] += 0.04 * S(u * PI * 5) * e; P[C.brx] -= 0.1 * e; } },
  sad: { dur: 2.4, fn(P, t, u) { const e = env(u, 0.2, 0.8); P[C.hx] += 0.3 * e; P[C.brx] += 0.08 * e; P[C.by] -= 0.012 * e; P[C.alo] -= 0.08 * e; P[C.aro] -= 0.08 * e; P[C.alf] += 0.08 * e; P[C.arf] += 0.08 * e; P[C.hz] += 0.06 * S(t * 1.5) * e; P[C.sq] += 0.02 * S(t * 1.4) * e; } },
  surprised: { dur: 1.1, fn(P, t, u) { const e = env(u, 0.06, 0.8); P[C.by] += 0.09 * S(Math.min(1, u * 3) * PI); P[C.lock] = Math.min(P[C.lock], 1 - S(Math.min(1, u * 3) * PI)); P[C.sq] += -0.1 * e; P[C.alo] += 0.9 * e; P[C.aro] += 0.9 * e; P[C.hx] -= 0.16 * e; P[C.brx] -= 0.1 * e; } },
  angry: { dur: 1.5, fn(P, t, u) { const e = env(u, 0.1, 0.9); P[C.bx] += 0.008 * S(t * 38) * e; P[C.brx] += 0.12 * e; P[C.hx] += 0.16 * e; P[C.alo] += 0.45 * e; P[C.aro] += 0.45 * e; P[C.alf] += 0.25 * e; P[C.arf] += 0.25 * e; P[C.llf] += 0.4 * S(t * 9) * e; P[C.lrf] -= 0.4 * S(t * 9) * e; P[C.by] += Math.abs(S(t * 9)) * 0.012 * e; P[C.lock] = 1; } },
  shy: { dur: 2.2, fn(P, t, u) { const e = env(u, 0.2, 0.8); P[C.bry] += 0.35 * e; P[C.hx] += 0.3 * e; P[C.hz] += 0.16 * e; P[C.hy] -= 0.25 * e; P[C.alf] = lerp0(P[C.alf], 0.95, e); P[C.arf] = lerp0(P[C.arf], 0.95, e); P[C.alo] = lerp0(P[C.alo], -0.2, e); P[C.aro] = lerp0(P[C.aro], -0.2, e); P[C.sq] += 0.02 * S(t * 3) * e; P[C.brz] += 0.05 * S(t * 2.2) * e; P[C.lsp] = 0.0; } },
  think: { loop: true, dur: 1, fn(P, t) { P[C.arf] = 2.0; P[C.aro] = -0.25; P[C.alf] = 0.9; P[C.alo] = -0.25; P[C.hz] += 0.16; P[C.hy] += 0.22; P[C.hx] -= 0.05; P[C.brz] += 0.03 * S(t * 1.1); P[C.sq] += 0.012 * S(t * 2); } },
  laugh: { dur: 1.7, fn(P, t, u) { const e = env(u, 0.1, 0.88); const b = S(t * 15); P[C.sq] += 0.05 * b * e; P[C.brx] -= 0.1 * e; P[C.hx] -= 0.12 * e; P[C.hz] += 0.08 * S(t * 7.5) * e; P[C.alf] = lerp0(P[C.alf], 1.2, e); P[C.arf] = lerp0(P[C.arf], 1.2, e); P[C.alo] = lerp0(P[C.alo], -0.15, e); P[C.aro] = lerp0(P[C.aro], -0.15, e); P[C.by] += Math.abs(b) * 0.012 * e; } },
  bow: { dur: 1.6, fn(P, t, u) { const e = env(u, 0.3, 0.7); P[C.brx] += 0.95 * e; P[C.hx] += 0.15 * e; P[C.alf] = lerp0(P[C.alf], -0.4, e); P[C.arf] = lerp0(P[C.arf], 0.5, e); P[C.aro] = lerp0(P[C.aro], -0.3, e); P[C.alo] = lerp0(P[C.alo], 0.4, e); P[C.lock] = 1 - 0.5 * e; } },
  sit: { loop: true, dur: 1, fn(P, t) { P[C.by] = -0.1; P[C.lock] = 0; P[C.llf] = 1.5; P[C.lrf] = 1.5; P[C.lsp] = 0.08; P[C.alf] = 0.75; P[C.arf] = 0.75; P[C.alo] = 0.08; P[C.aro] = 0.08; P[C.brx] = -0.03; P[C.hx] += 0.03; P[C.sq] = 0.012 * S(t * 2.2); P[C.hy] *= 0.5; } },
  sleep: { loop: true, dur: 1, fn(P, t) { P[C.brx] = -1.52; P[C.by] = -0.135; P[C.bz] = 0.0; P[C.lock] = 0; P[C.llf] = 0.05; P[C.lrf] = 0.05; P[C.lsp] = 0.1; P[C.alf] = 0.1; P[C.arf] = 0.1; P[C.alo] = 0.25; P[C.aro] = 0.25; P[C.hx] = 0.1; P[C.hz] = 0.12; P[C.hy] = 0.2; P[C.sq] = 0.02 * S(t * 1.6); P[C.bry] = 0; } },
  pickup: { dur: 1.2, fn(P, t, u) { const e = u < 0.45 ? sm(u / 0.45) : sm((1 - u) / 0.55); P[C.brx] += 0.85 * e; P[C.hx] -= 0.25 * e; P[C.arf] = lerp0(P[C.arf], 0.55, e) ; P[C.alf] = lerp0(P[C.alf], 0.3, e); P[C.alo] += 0.1 * e; P[C.by] -= 0.02 * e; P[C.lock] = 1 - 0.4 * e; if (u > 0.5) P[C.arf] = lerp0(P[C.arf], 1.5, sm((u - 0.5) / 0.3) * (1 - sm((u - 0.85) / 0.15))); } },
  show_item: { dur: 2.0, fn(P, t, u) { const e = env(u, 0.2, 0.85); P[C.arf] = lerp0(P[C.arf], 2.95, e); P[C.aro] = lerp0(P[C.aro], 0.1, e); P[C.hx] -= 0.2 * e; P[C.sq] -= 0.04 * e; P[C.by] += 0.03 * e * Math.abs(S(t * 6)); P[C.hz] += 0.06 * S(t * 3) * e; P[C.alo] += 0.3 * e; P[C.lock] = 1 - e * 0.5; } },
  carry_idle: { loop: true, dur: 1, fn(P) { arms(P, 1.15, -0.28, 1.15, -0.28); P[C.hx] += 0.06; } },
  carry_walk: { loop: true, dur: 1, fn(P, t, u, o) { const ph = t * 8; const s = S(ph); P[C.llf] = s * 0.7; P[C.lrf] = -s * 0.7; P[C.by] = Math.abs(Co(ph)) * 0.018; arms(P, 1.15 + s * 0.05, -0.28, 1.15 - s * 0.05, -0.28); P[C.brx] = 0.05; P[C.bry] = s * 0.05; } },
  fish_cast: { dur: 1.5, fn(P, t, u) { const back = sm(u / 0.35) * (1 - sm((u - 0.35) / 0.1)); const fwd = sm((u - 0.38) / 0.18) * (1 - 0.2 * sm((u - 0.7) / 0.3)); P[C.arf] = -0.3 * 0 + (back ? -1.0 * back : 0) + 2.0 * fwd; P[C.alf] = 0.9 * sm(u / 0.2); P[C.brx] += -0.2 * back + 0.22 * fwd; P[C.prx] = -0.3; P[C.hx] += 0.0; P[C.sq] -= 0.02 * fwd; } },
  fish_wait: { loop: true, dur: 1, fn(P, t) { P[C.arf] = 1.45 + 0.04 * S(t * 1.2); P[C.alf] = 1.1; P[C.alo] = -0.1; P[C.aro] = 0.0; P[C.prx] = -0.3 + 0.05 * S(t * 1.2); P[C.hx] += 0.08; P[C.brx] += 0.04; P[C.hy] += 0.05 * S(t * 0.4); P[C.sq] = 0.01 * S(t * 2); } },
  fish_bite: { dur: 0.9, fn(P, t, u) { const e = u < 0.2 ? sm(u / 0.2) : sm((1 - u) / 0.8); P[C.arf] = lerp0(1.45, 2.3, e); P[C.alf] = 1.2; P[C.prx] = -0.3; P[C.hx] -= 0.2 * e; P[C.brx] -= 0.2 * e; P[C.by] += 0.06 * e; P[C.lock] = 1 - e; } },
  fish_reel: { loop: true, dur: 1, fn(P, t) { P[C.arf] = 1.5 + 0.1 * Co(t * 10); P[C.alf] = 0.9 + 0.45 * S(t * 10); P[C.alo] = -0.15; P[C.prx] = -0.3; P[C.brx] = -0.12; P[C.hx] += 0.05; P[C.bx] = 0.01 * S(t * 10); P[C.sq] = 0.012 * S(t * 20); } },
  fish_catch: { dur: 1.8, fn(P, t, u) { const e = env(u, 0.15, 0.85); P[C.arf] = lerp0(1.45, 2.95, e); P[C.alf] = lerp0(1.0, 2.6, e); P[C.alo] += 0.3 * e; P[C.aro] = 0.1 * e; P[C.by] += Math.abs(S(u * PI * 2)) * 0.1 * e; P[C.lock] = 1 - e * 0.7; P[C.sq] += 0.02 * S(t * 10) * e; P[C.hx] -= 0.15 * e; P[C.prx] = 0.6; } },
  knead: { loop: true, dur: 1, fn(P, t) { const p = S(t * 6); P[C.brx] = 0.3 + 0.08 * p; P[C.alf] = 0.95 + 0.3 * S(t * 6); P[C.arf] = 0.95 + 0.3 * S(t * 6 + PI); P[C.alo] = -0.05; P[C.aro] = -0.05; P[C.hx] += 0.06; P[C.sq] = 0.025 * Math.abs(p); P[C.bry] = 0.06 * S(t * 3); } },
  sweep: { loop: true, dur: 1, fn(P, t) { const s = S(t * 3.4); P[C.arf] = 0.95; P[C.alf] = 0.85; P[C.alo] = -0.2; P[C.aro] = 0.0; P[C.prx] = 0.55; P[C.bry] = 0.3 * s; P[C.brx] = 0.12; P[C.hx] += 0.03; P[C.hy] = -0.25 * s; P[C.llf] += 0.18 * Co(t * 3.4); P[C.lrf] -= 0.18 * Co(t * 3.4); } },
  light_lamp: { dur: 2.4, fn(P, t, u) { const e = env(u, 0.25, 0.8); P[C.arf] = lerp0(P[C.arf], 2.75, e); P[C.aro] = 0.05 * e; P[C.hx] -= 0.34 * e; P[C.sq] -= 0.05 * e; P[C.brx] -= 0.06 * e; P[C.llf] += 0.0; P[C.alo] += 0.1 * e; P[C.prx] = 0.2; } },
  dance: { loop: true, dur: 1, fn(P, t) { const s = S(t * 6); P[C.by] = Math.abs(s) * 0.055; P[C.lock] = 0.3; P[C.bry] = 0.4 * S(t * 3); P[C.alo] = 1.3 + 0.5 * s; P[C.aro] = 1.3 - 0.5 * s; P[C.alf] = 0.3 * S(t * 3); P[C.arf] = -0.3 * S(t * 3); P[C.llf] = 0.45 * s; P[C.lrf] = -0.45 * s; P[C.hz] = 0.16 * S(t * 3); P[C.sq] = -0.04 * Math.abs(s) + 0.03 * Co(t * 6); P[C.brz] = 0.08 * S(t * 3); } },
  eat: { dur: 2.4, fn(P, t, u) { const e = env(u, 0.2, 0.85); const bite = S(t * 11) * 0.5 + 0.5; P[C.arf] = lerp0(P[C.arf], 2.05, e); P[C.aro] = lerp0(P[C.aro], -0.12, e); P[C.prx] = 0.4; P[C.hx] += (0.08 + 0.06 * bite) * e; P[C.sq] += 0.02 * bite * e; P[C.hz] += 0.05 * S(t * 4) * e; } },
  drink: { dur: 2.4, fn(P, t, u) { const e = env(u, 0.2, 0.85); const tilt = sm((u - 0.3) / 0.2) * (1 - sm((u - 0.65) / 0.15)); P[C.arf] = lerp0(P[C.arf], 2.2, e); P[C.aro] = lerp0(P[C.aro], -0.1, e); P[C.prx] = 0.2 - 0.5 * tilt; P[C.hx] -= 0.2 * tilt; P[C.brx] -= 0.05 * tilt; P[C.alo] += 0.05 * e; } },
  read: { loop: true, dur: 1, fn(P, t) { arms(P, 1.35, -0.35, 1.35, -0.35); P[C.prx] = 0.25; P[C.hx] += 0.22 + 0.02 * S(t * 0.7); P[C.sq] = 0.01 * S(t * 2); P[C.hy] += 0.04 * S(t * 0.9); } },
  stargaze: { loop: true, dur: 1, fn(P, t) { P[C.hx] = -0.55; P[C.brx] -= 0.12; P[C.arf] = 2.2; P[C.aro] = -0.1; P[C.alf] = 0.4; P[C.prx] = 0.5; P[C.bry] = 0.06 * S(t * 0.4); P[C.hy] += 0.1 * S(t * 0.5); } },
  point: { dur: 1.3, fn(P, t, u) { const e = env(u, 0.2, 0.85); P[C.arf] = lerp0(P[C.arf], 1.55, e); P[C.aro] = lerp0(P[C.aro], 0.12, e); P[C.hz] += 0.07 * e; P[C.hy] += 0.1 * e; P[C.brx] += 0.04 * e; P[C.prx] = 0.3; } },
  shrug: { dur: 1.3, fn(P, t, u) { const e = env(u, 0.2, 0.8); P[C.alo] += 0.75 * e; P[C.aro] += 0.75 * e; P[C.alf] += 0.35 * e; P[C.arf] += 0.35 * e; P[C.hz] += 0.2 * e; P[C.sq] -= 0.03 * e; P[C.by] += 0.012 * e; P[C.hx] -= 0.05 * e; } },
  stretch: { dur: 2.2, fn(P, t, u) { const e = env(u, 0.25, 0.8); P[C.alo] += 3.0 * e; P[C.aro] += 3.0 * e; P[C.brx] -= 0.22 * e; P[C.hx] -= 0.25 * e; P[C.sq] -= 0.05 * e; P[C.lock] = 1 - 0.2 * e; P[C.bx] += 0.006 * S(t * 18) * e; } },
  yawn: { dur: 2.2, fn(P, t, u) { const e = env(u, 0.25, 0.8); P[C.arf] = lerp0(P[C.arf], 2.1, e * 0.9); P[C.aro] = lerp0(P[C.aro], -0.1, e); P[C.hx] -= 0.2 * e; P[C.sq] -= 0.04 * e; P[C.brx] -= 0.08 * e; P[C.alo] += 0.5 * e; P[C.prx] = 0.2; } },
  // Tier 3
  hammer: { loop: true, dur: 1, fn(P, t) { const s = S(t * 7); P[C.arf] = 1.2 + 1.0 * Math.max(0, s); P[C.alf] = 0.8; P[C.alo] = -0.1; P[C.brx] = 0.15 + 0.12 * Math.max(0, -s); P[C.hx] += 0.05; P[C.prx] = 0.3; P[C.sq] = 0.02 * Math.max(0, -s); } },
  serve: { loop: true, dur: 1, fn(P, t) { arms(P, 1.0, -0.1, 1.25, -0.3); P[C.prx] = 0.2; P[C.hx] += 0.05; P[C.sq] = 0.01 * S(t * 2); P[C.brz] = 0.02 * S(t * 1.5); } },
  write: { loop: true, dur: 1, fn(P, t) { arms(P, 0.95, -0.25, 1.1 + 0.05 * S(t * 9), -0.2); P[C.hx] += 0.2; P[C.hz] += 0.1; P[C.bry] = 0.04 * S(t * 1.1); P[C.brx] = 0.1; } },
  sit_read: { loop: true, dur: 1, fn(P, t) { DEFS.sit.fn(P, t); arms(P, 1.35, -0.35, 1.35, -0.35); P[C.hx] += 0.4; P[C.prx] = 0.25; } },
  fall: { dur: 2.2, fn(P, t, u) { const k = sm(u / 0.3) * (1 - sm((u - 0.75) / 0.25)); P[C.brx] -= 1.45 * k; P[C.by] -= 0.13 * k; P[C.lock] = 1 - k; P[C.alo] += 1.4 * k; P[C.aro] += 1.4 * k; P[C.hx] -= 0.1 * k; P[C.llf] += 0.3 * k; P[C.lrf] += 0.3 * k; P[C.sq] += 0.04 * S(u * PI); } },
  spin: { dur: 0.9, fn(P, t, u) { P[C.bry] += u * PI * 2; P[C.by] += S(u * PI) * 0.12; P[C.lock] = 1 - S(u * PI); P[C.alo] += 1.4 * S(u * PI); P[C.aro] += 1.4 * S(u * PI); P[C.sq] += -0.05 * S(u * PI); } },
};
function lerp0(a, b, e) { return a + (b - a) * e; }

/** Props a named animation equips automatically (restored afterwards). */
export const AUTO_PROP = {
  fish_cast: 'rod', fish_wait: 'rod', fish_bite: 'rod', fish_reel: 'rod', fish_catch: 'fish',
  sweep: 'broom', eat: 'bread', drink: 'mug', read: 'book', sit_read: 'book', stargaze: 'telescope', serve: 'tray', write: 'paper',
};
/** Animations whose expression should look sleepy/closed. */
export const EYES_CLOSED = new Set(['sleep']);

export const IMPLEMENTED = Object.keys(DEFS).concat(['idle', 'walk', 'run']);
export const NAMES_OK = IMPLEMENTED.every((n) => ANIMATIONS.includes(n));
