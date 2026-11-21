// synth.js - instrument presets + low-level helpers, all built from oscillators, gains, filters and generated noise.
// Instruments share one signature: fn(ctx, out, t, freqHz, durSec, vel, opts)
export const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const FLOOR = 0.0001;

const noiseCache = new WeakMap();
export function noiseBuffer(ctx) {
  let b = noiseCache.get(ctx);
  if (!b) {
    const n = Math.floor(ctx.sampleRate * 2);
    b = ctx.createBuffer(1, n, ctx.sampleRate);
    const d = b.getChannelData(0);
    let s = 22222;
    for (let i = 0; i < n; i++) { s = (s * 1664525 + 1013904223) >>> 0; d[i] = s / 2147483648 - 1; }
    noiseCache.set(ctx, b);
  }
  return b;
}
export function gain(ctx, v = 0) { const n = ctx.createGain(); n.gain.value = v; return n; }
export function filt(ctx, type, f, q = 0.7) { const n = ctx.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; return n; }
export function osc(ctx, type, f, t0, t1) {
  const o = ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(Math.min(f, ctx.sampleRate * 0.45), t0); o.start(t0); o.stop(t1); return o;
}
export function noise(ctx, t0, t1) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuffer(ctx); s.loop = true;
  s.start(t0, (t0 * 0.37 + Math.random()) % 1.5); s.stop(t1); return s;
}
export function decayEnv(p, t, peak, att, dec) {
  p.setValueAtTime(FLOOR, t); p.linearRampToValueAtTime(Math.max(peak, FLOOR), t + att); p.exponentialRampToValueAtTime(FLOOR, t + att + dec);
}
export function sustainEnv(p, t, peak, att, dur, rel) {
  const hold = Math.max(t + att, t + dur);
  p.setValueAtTime(FLOOR, t); p.linearRampToValueAtTime(Math.max(peak, FLOOR), t + att);
  p.setValueAtTime(Math.max(peak, FLOOR), hold); p.exponentialRampToValueAtTime(FLOOR, hold + rel);
}
function vibrato(ctx, target, t, end, rate, depth, delay) {
  const l = osc(ctx, 'sine', rate, t, end), lg = gain(ctx, 0);
  lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(depth, t + delay + 0.3);
  l.connect(lg); lg.connect(target);
}
function partials(ctx, out, t, f, list, peak, decScale = 1) {
  for (const [r, a, d] of list) {
    if (f * r > 18000) continue;
    const dd = d * decScale, o = osc(ctx, 'sine', f * r, t, t + dd + 0.1), gg = gain(ctx);
    decayEnv(gg.gain, t, peak * a, 0.003, dd);
    o.connect(gg); gg.connect(out);
  }
}
const pitchDecay = (f) => clamp(1.5 - f / 1500, 0.3, 1.4);

export const INSTRUMENTS = {
  marimba(ctx, out, t, f, dur, v) {
    const d = pitchDecay(f) * 0.8;
    partials(ctx, out, t, f, [[1, 1, d], [4, 0.22, 0.07], [10, 0.05, 0.03]], 0.55 * v);
  },
  pluck(ctx, out, t, f, dur, v) {
    const d = 0.55 + 0.4 * pitchDecay(f), end = t + d + 0.1;
    const lp = filt(ctx, 'lowpass', 1, 0.8);
    lp.frequency.setValueAtTime(clamp(f * 7, 500, 6000), t); lp.frequency.exponentialRampToValueAtTime(clamp(f * 1.6, 200, 3000), t + 0.3);
    const gg = gain(ctx); decayEnv(gg.gain, t, 0.3 * v, 0.004, d);
    const a = osc(ctx, 'sawtooth', f, t, end), b = osc(ctx, 'triangle', f * 2.003, t, end), bg = gain(ctx, 0.35);
    a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(gg); gg.connect(out);
  },
  nylon(ctx, out, t, f, dur, v) {
    const d = 0.9 + 0.5 * pitchDecay(f), end = t + d + 0.1;
    const lp = filt(ctx, 'lowpass', clamp(f * 5, 600, 4000), 0.5), gg = gain(ctx);
    decayEnv(gg.gain, t, 0.32 * v, 0.003, d);
    const a = osc(ctx, 'triangle', f, t, end), b = osc(ctx, 'sine', f * 2, t, end), bg = gain(ctx, 0.4), c = osc(ctx, 'sine', f * 3, t, t + 0.2), cg = gain(ctx, 0.15);
    a.connect(lp); b.connect(bg); bg.connect(lp); c.connect(cg); cg.connect(lp); lp.connect(gg); gg.connect(out);
  },
  flute(ctx, out, t, f, dur, v) {
    const att = 0.07, rel = 0.14, end = t + Math.max(dur, att) + rel + 0.1;
    const gg = gain(ctx); sustainEnv(gg.gain, t, 0.3 * v, att, dur, rel);
    const o = osc(ctx, 'sine', f, t, end), o2 = osc(ctx, 'triangle', f * 2, t, end), g2 = gain(ctx, 0.07);
    vibrato(ctx, o.frequency, t, end, 5.2, f * 0.007, 0.25); vibrato(ctx, o2.frequency, t, end, 5.2, f * 0.014, 0.25);
    const n = noise(ctx, t, end), bp = filt(ctx, 'bandpass', clamp(f * 2.2, 800, 6000), 3), ng = gain(ctx);
    sustainEnv(ng.gain, t, 0.05 * v, 0.04, dur, rel);
    o.connect(gg); o2.connect(g2); g2.connect(gg); n.connect(bp); bp.connect(ng); ng.connect(out); gg.connect(out);
  },
  whistle(ctx, out, t, f, dur, v) { // airy pure lead
    const end = t + dur + 0.3, gg = gain(ctx); sustainEnv(gg.gain, t, 0.25 * v, 0.05, dur, 0.15);
    const o = osc(ctx, 'sine', f, t, end); vibrato(ctx, o.frequency, t, end, 5.8, f * 0.01, 0.2);
    o.connect(gg); gg.connect(out);
  },
  pad(ctx, out, t, f, dur, v) {
    const att = Math.min(0.8, dur * 0.4 + 0.05), rel = 0.9, end = t + Math.max(dur, att) + rel + 0.05;
    const lp = filt(ctx, 'lowpass', clamp(500 + f * 2.5, 500, 1700), 0.4), gg = gain(ctx);
    sustainEnv(gg.gain, t, 0.1 * v, att, dur, rel);
    for (const [ty, c] of [['sawtooth', -8], ['sawtooth', 8], ['triangle', 0]]) { const o = osc(ctx, ty, f, t, end); o.detune.value = c; o.connect(lp); }
    lp.connect(gg); gg.connect(out);
  },
  strings(ctx, out, t, f, dur, v) {
    const att = Math.min(0.25, dur * 0.4 + 0.04), rel = 0.4, end = t + Math.max(dur, att) + rel + 0.05;
    const lp = filt(ctx, 'lowpass', clamp(f * 3.2, 700, 3200), 0.5), gg = gain(ctx);
    sustainEnv(gg.gain, t, 0.1 * v, att, dur, rel);
    for (const c of [-9, 0, 9]) { const o = osc(ctx, 'sawtooth', f, t, end); o.detune.value = c; vibrato(ctx, o.detune, t, end, 5.4, 9, 0.3); o.connect(lp); }
    lp.connect(gg); gg.connect(out);
  },
  choir(ctx, out, t, f, dur, v) {
    const att = Math.min(0.7, dur * 0.4 + 0.1), rel = 1.0, end = t + Math.max(dur, att) + rel + 0.05;
    const sum = gain(ctx, 1), gg = gain(ctx); sustainEnv(gg.gain, t, 0.1 * v, att, dur, rel);
    const b1 = filt(ctx, 'bandpass', 650, 5), b2 = filt(ctx, 'bandpass', 1100, 6), b3 = filt(ctx, 'bandpass', 2500, 8), g3 = gain(ctx, 0.3);
    for (const c of [-10, 0, 10]) { const o = osc(ctx, 'sawtooth', f, t, end); o.detune.value = c; vibrato(ctx, o.detune, t, end, 5, 8, 0.5); o.connect(sum); }
    sum.connect(b1); sum.connect(b2); sum.connect(b3); b3.connect(g3);
    b1.connect(gg); b2.connect(gg); g3.connect(gg); gg.connect(out);
  },
  bass(ctx, out, t, f, dur, v) {
    const rel = 0.12, end = t + Math.max(dur, 0.1) + rel + 0.05;
    const lp = filt(ctx, 'lowpass', 420 + f * 2, 0.6), gg = gain(ctx);
    gg.gain.setValueAtTime(FLOOR, t); gg.gain.linearRampToValueAtTime(0.5 * v, t + 0.012);
    gg.gain.exponentialRampToValueAtTime(0.25 * v, t + Math.min(0.4, dur));
    gg.gain.setValueAtTime(0.25 * v, t + Math.max(dur, 0.1)); gg.gain.exponentialRampToValueAtTime(FLOOR, t + Math.max(dur, 0.1) + rel);
    const a = osc(ctx, 'sine', f, t, end), b = osc(ctx, 'triangle', f, t, end), bg = gain(ctx, 0.35);
    a.connect(lp); b.connect(bg); bg.connect(lp); lp.connect(gg); gg.connect(out);
  },
  upright(ctx, out, t, f, dur, v) { // plucky walking bass
    const d = clamp(dur * 1.1, 0.2, 0.7), end = t + d + 0.1;
    const lp = filt(ctx, 'lowpass', 1, 0.7); lp.frequency.setValueAtTime(900 + f * 3, t); lp.frequency.exponentialRampToValueAtTime(260, t + d);
    const gg = gain(ctx); decayEnv(gg.gain, t, 0.55 * v, 0.008, d);
    const a = osc(ctx, 'sawtooth', f, t, end), b = osc(ctx, 'sine', f, t, end), bg = gain(ctx, 0.7);
    a.connect(lp); lp.connect(gg); b.connect(bg); bg.connect(gg); gg.connect(out);
  },
  bell(ctx, out, t, f, dur, v) { partials(ctx, out, t, f, [[1, 1, 2.6], [2.0, 0.45, 1.8], [2.76, 0.3, 1.2], [5.4, 0.12, 0.6]], 0.32 * v, clamp(1.6 - f / 2500, 0.45, 1.3)); },
  celesta(ctx, out, t, f, dur, v) { partials(ctx, out, t, f, [[1, 1, 1.6], [4, 0.3, 0.4], [2, 0.12, 0.7]], 0.4 * v, clamp(1.5 - f / 3000, 0.5, 1.2)); },
  glock(ctx, out, t, f, dur, v) { partials(ctx, out, t, f, [[1, 1, 1.5], [2.76, 0.28, 0.8], [5.4, 0.14, 0.35], [8.9, 0.05, 0.15]], 0.3 * v, clamp(1.5 - f / 3500, 0.4, 1.2)); },
  musicbox(ctx, out, t, f, dur, v) {
    partials(ctx, out, t, f, [[1, 1, 1.1], [2.01, 0.28, 0.5], [4.1, 0.1, 0.2]], 0.34 * v, clamp(1.5 - f / 3500, 0.5, 1.2));
    const n = noise(ctx, t, t + 0.03), hp = filt(ctx, 'highpass', 5000, 1), ng = gain(ctx); decayEnv(ng.gain, t, 0.03 * v, 0.001, 0.02);
    n.connect(hp); hp.connect(ng); ng.connect(out);
  },
  epiano(ctx, out, t, f, dur, v) {
    const d = clamp(1.8 - f / 800, 0.5, 1.6), end = t + d + 0.1;
    const c = osc(ctx, 'sine', f, t, end), m = osc(ctx, 'sine', f, t, end), mg = gain(ctx), gg = gain(ctx);
    mg.gain.setValueAtTime(f * 1.6 * (0.5 + v), t); mg.gain.exponentialRampToValueAtTime(f * 0.2, t + 0.5);
    m.connect(mg); mg.connect(c.frequency);
    decayEnv(gg.gain, t, 0.38 * v, 0.004, d);
    const tn = osc(ctx, 'sine', f * 14, t, t + 0.12), tg = gain(ctx); decayEnv(tg.gain, t, 0.025 * v, 0.002, 0.08);
    c.connect(gg); tn.connect(tg); tg.connect(gg); gg.connect(out);
  },
  piano(ctx, out, t, f, dur, v) {
    const d = Math.min(clamp(2.6 - f / 450, 0.6, 2.4), dur + 0.9), end = t + d + 0.15;
    const lp = filt(ctx, 'lowpass', 1800 + v * 1800, 0.4), gg = gain(ctx); decayEnv(gg.gain, t, 0.42 * v, 0.004, d);
    const a = osc(ctx, 'triangle', f, t, end), b = osc(ctx, 'sine', f * 2, t, end), bg = gain(ctx, 0.3), c = osc(ctx, 'sine', f * 3, t, t + d * 0.5), cg = gain(ctx, 0.1);
    a.connect(lp); b.connect(bg); bg.connect(lp); c.connect(cg); cg.connect(lp); lp.connect(gg); gg.connect(out);
    const n = noise(ctx, t, t + 0.025), nb = filt(ctx, 'bandpass', 1400, 1), ng = gain(ctx); decayEnv(ng.gain, t, 0.04 * v, 0.001, 0.02);
    n.connect(nb); nb.connect(ng); ng.connect(out);
  },
  reed(ctx, out, t, f, dur, v) { // accordion-like
    const att = 0.05, rel = 0.1, end = t + Math.max(dur, att) + rel + 0.05;
    const lp = filt(ctx, 'lowpass', clamp(f * 4, 900, 3000), 0.8), pk = filt(ctx, 'peaking', 1300, 1.2); pk.gain.value = 5;
    const gg = gain(ctx), trem = gain(ctx, 1), tl = osc(ctx, 'sine', 6.2, t, end), tg = gain(ctx, 0.12);
    tl.connect(tg); tg.connect(trem.gain); sustainEnv(gg.gain, t, 0.17 * v, att, dur, rel);
    for (const [ty, c] of [['sawtooth', -9], ['square', 8]]) { const o = osc(ctx, ty, f, t, end); o.detune.value = c; const og = gain(ctx, ty === 'square' ? 0.5 : 0.8); o.connect(og); og.connect(lp); }
    lp.connect(pk); pk.connect(trem); trem.connect(gg); gg.connect(out);
  },
  hollow(ctx, out, t, f, dur, v) { // log-drum / woodblock-ish
    const d = 0.3, end = t + d + 0.1, o = osc(ctx, 'sine', f, t, end), gg = gain(ctx);
    o.frequency.exponentialRampToValueAtTime(f * 0.7, t + 0.15); decayEnv(gg.gain, t, 0.55 * v, 0.002, d);
    const n = noise(ctx, t, t + 0.05), bp = filt(ctx, 'bandpass', 1500, 2), ng = gain(ctx); decayEnv(ng.gain, t, 0.12 * v, 0.001, 0.03);
    o.connect(gg); gg.connect(out); n.connect(bp); bp.connect(ng); ng.connect(out);
  },
  kick(ctx, out, t, f, dur, v) {
    const o = osc(ctx, 'sine', 135, t, t + 0.4), gg = gain(ctx);
    o.frequency.exponentialRampToValueAtTime(46, t + 0.13); decayEnv(gg.gain, t, 0.85 * v, 0.003, 0.28);
    o.connect(gg); gg.connect(out);
  },
  snare(ctx, out, t, f, dur, v) { // soft brush-snare
    const n = noise(ctx, t, t + 0.3), bp = filt(ctx, 'bandpass', 3200, 0.7), gg = gain(ctx);
    decayEnv(gg.gain, t, 0.3 * v, 0.006, 0.17);
    const o = osc(ctx, 'triangle', 190, t, t + 0.12), og = gain(ctx); decayEnv(og.gain, t, 0.18 * v, 0.002, 0.08);
    n.connect(bp); bp.connect(gg); gg.connect(out); o.connect(og); og.connect(out);
  },
  brush(ctx, out, t, f, dur, v) {
    const n = noise(ctx, t, t + 0.4), bp = filt(ctx, 'bandpass', 4500, 0.6), gg = gain(ctx);
    gg.gain.setValueAtTime(FLOOR, t); gg.gain.linearRampToValueAtTime(0.16 * v, t + 0.045); gg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.24);
    n.connect(bp); bp.connect(gg); gg.connect(out);
  },
  hat(ctx, out, t, f, dur, v) {
    const n = noise(ctx, t, t + 0.12), hp = filt(ctx, 'highpass', 7000, 0.7), gg = gain(ctx);
    decayEnv(gg.gain, t, 0.16 * v, 0.002, 0.05); n.connect(hp); hp.connect(gg); gg.connect(out);
  },
  shaker(ctx, out, t, f, dur, v) {
    const n = noise(ctx, t, t + 0.2), bp = filt(ctx, 'bandpass', 6500, 1.4), gg = gain(ctx);
    gg.gain.setValueAtTime(FLOOR, t); gg.gain.linearRampToValueAtTime(0.2 * v, t + 0.014); gg.gain.exponentialRampToValueAtTime(FLOOR, t + 0.09);
    n.connect(bp); bp.connect(gg); gg.connect(out);
  },
  click(ctx, out, t, f, dur, v) { // rim / wood tick
    const o = osc(ctx, 'sine', 1100, t, t + 0.1), gg = gain(ctx); o.frequency.exponentialRampToValueAtTime(760, t + 0.05);
    decayEnv(gg.gain, t, 0.3 * v, 0.001, 0.05); o.connect(gg); gg.connect(out);
  },
  tom(ctx, out, t, f, dur, v) {
    const o = osc(ctx, 'sine', 210, t, t + 0.4), gg = gain(ctx); o.frequency.exponentialRampToValueAtTime(120, t + 0.2);
    decayEnv(gg.gain, t, 0.6 * v, 0.003, 0.3); o.connect(gg); gg.connect(out);
  },
  swell(ctx, out, t, f, dur, v) { // soft cymbal-ish noise swell
    const d = Math.max(dur, 0.6), n = noise(ctx, t, t + d + 0.6), hp = filt(ctx, 'highpass', 4500, 0.6), gg = gain(ctx);
    sustainEnv(gg.gain, t, 0.12 * v, d * 0.85, d, 0.5); n.connect(hp); hp.connect(gg); gg.connect(out);
  },
};
export const DRUM_MAP = { k: 'kick', s: 'snare', b: 'brush', h: 'hat', S: 'shaker', t: 'tom', w: 'click', c: 'swell', o: 'hollow' };
