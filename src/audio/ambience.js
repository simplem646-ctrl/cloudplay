// ambience.js - synthesised beds (filtered noise with slow LFO swells) plus random one-shot events (chirps, crackles, drips).
import { gain, filt, osc, noise, decayEnv, noiseBuffer } from './synth.js';

export const AMBIENCE_IDS = ['birds', 'crickets', 'waves', 'rain', 'wind', 'stream', 'fire', 'crowd'];
const rnd = (a, b) => a + Math.random() * (b - a);

/** Short FM-ish bird chirp: a few rapid pitch sweeps. */
export function birdChirp(ctx, out, t, base = 3000, vol = 0.1, syll = 3) {
  let at = t;
  for (let i = 0; i < syll; i++) {
    const d = rnd(0.045, 0.09), f0 = base * rnd(0.9, 1.15), f1 = f0 * rnd(0.7, 1.45);
    const o = osc(ctx, 'sine', f0, at, at + d + 0.02), g = gain(ctx), m = osc(ctx, 'sine', rnd(30, 60), at, at + d + 0.02), mg = gain(ctx, f0 * 0.04);
    o.frequency.exponentialRampToValueAtTime(Math.max(300, f1), at + d);
    m.connect(mg); mg.connect(o.frequency);
    decayEnv(g.gain, at, vol * rnd(0.7, 1), 0.008, d);
    o.connect(g); g.connect(out);
    at += d + rnd(0.03, 0.08);
  }
}
function cricket(ctx, out, t, pitch, vol) {
  for (let i = 0; i < 3; i++) {
    const a = t + i * 0.055, o = osc(ctx, 'sine', pitch, a, a + 0.05), g = gain(ctx);
    decayEnv(g.gain, a, vol, 0.012, 0.035);
    o.connect(g); g.connect(out);
  }
}
function tick(ctx, out, t, f, vol, d = 0.02) {
  const n = noise(ctx, t, t + d + 0.02), hp = filt(ctx, 'bandpass', f, 1.2), g = gain(ctx);
  decayEnv(g.gain, t, vol, 0.001, d); n.connect(hp); hp.connect(g); g.connect(out);
}
/** Per-bed random events: gap (s until next) and fire(). */
const EVENTS = {
  birds: { gap: () => rnd(0.5, 3.2), fire: (c, o, t) => birdChirp(c, o, t, rnd(2200, 4800), rnd(0.05, 0.12), 1 + Math.floor(rnd(0, 4))) },
  crickets: { gap: () => rnd(0.12, 0.4), fire: (c, o, t) => cricket(c, o, t, [4300, 4700, 5100][Math.floor(rnd(0, 3))], rnd(0.025, 0.05)) },
  rain: { gap: () => rnd(0.04, 0.25), fire: (c, o, t) => tick(c, o, t, rnd(2500, 6000), rnd(0.02, 0.06), 0.012) },
  stream: { gap: () => rnd(0.08, 0.35), fire: (c, o, t) => { const f = rnd(500, 1400), x = osc(c, 'sine', f, t, t + 0.06), g = gain(c); x.frequency.exponentialRampToValueAtTime(f * 1.6, t + 0.05); decayEnv(g.gain, t, rnd(0.015, 0.04), 0.004, 0.045); x.connect(g); g.connect(o); } },
  fire: { gap: () => rnd(0.08, 0.7), fire: (c, o, t) => tick(c, o, t, rnd(1500, 4500), rnd(0.05, 0.2), rnd(0.008, 0.03)) },
};
export function hasEvents(id) { return !!EVENTS[id]; }
export function newEventState(t) { return { next: t }; }
/** Fire all events with start time < `to`. */
export function tickEvents(ctx, out, id, st, to) {
  const ev = EVENTS[id];
  if (!ev) return;
  if (st.next < ctx.currentTime) st.next = ctx.currentTime;
  while (st.next < to) { ev.fire(ctx, out, st.next); st.next += ev.gap(); }
}

const BED_TRIM = { rain: 0.4, wind: 0.9, stream: 0.8, fire: 1.2, crowd: 0.75, waves: 0.7, birds: 3, crickets: 3.5 };
function loopSrc(ctx, t0, t1) {
  const s = ctx.createBufferSource(); s.buffer = noiseBuffer(ctx); s.loop = true; s.start(t0, Math.random() * 1.5);
  if (t1 != null) s.stop(t1);
  return s;
}
function lfo(ctx, target, rate, depth, t0, t1) {
  const o = osc(ctx, 'sine', rate, t0, t1 == null ? 1e9 : t1), g = gain(ctx, depth);
  o.connect(g); g.connect(target); return o;
}
/** Build a continuous bed. Returns { out (GainNode feeding `dest`), sources[], stop(t) }.  t1 = hard stop time (offline) or null. */
export function createBed(ctx, dest, id, t0 = 0, t1 = null) {
  const level = gain(ctx, 1); level.connect(dest);          // mix level (set by the caller)
  const out = gain(ctx, BED_TRIM[id] || 1); out.connect(level); // per-bed loudness trim; events also feed this node
  const src = [];
  const noiseTo = (node) => { const s = loopSrc(ctx, t0, t1); s.connect(node); src.push(s); return s; };
  const osrc = (o) => { src.push(o); return o; };
  const end = t1 == null ? 1e9 : t1;
  if (id === 'rain') {
    const hp = filt(ctx, 'highpass', 700, 0.5), lp = filt(ctx, 'lowpass', 8000, 0.5), g = gain(ctx, 0.5);
    noiseTo(hp); hp.connect(lp); lp.connect(g); g.connect(out);
    const bp = filt(ctx, 'bandpass', 2400, 0.5), g2 = gain(ctx, 0.3); noiseTo(bp); bp.connect(g2); g2.connect(out);
  } else if (id === 'wind') {
    const bp = filt(ctx, 'bandpass', 380, 0.9), g = gain(ctx, 0.5);
    noiseTo(bp); bp.connect(g); g.connect(out);
    osrc(lfo(ctx, bp.frequency, 0.07, 220, t0, end)); osrc(lfo(ctx, g.gain, 0.11, 0.3, t0, end));
  } else if (id === 'stream') {
    const bp = filt(ctx, 'bandpass', 1700, 0.7), g = gain(ctx, 0.35), hp = filt(ctx, 'highpass', 3500, 0.7), g2 = gain(ctx, 0.12);
    noiseTo(bp); bp.connect(g); g.connect(out); noiseTo(hp); hp.connect(g2); g2.connect(out);
    osrc(lfo(ctx, g.gain, 0.4, 0.08, t0, end));
  } else if (id === 'fire') {
    const lp = filt(ctx, 'lowpass', 550, 0.7), g = gain(ctx, 0.45);
    noiseTo(lp); lp.connect(g); g.connect(out); osrc(lfo(ctx, g.gain, 0.23, 0.12, t0, end));
  } else if (id === 'crowd') {
    const g = gain(ctx, 0.5);
    for (const f of [420, 800, 1450]) { const b = filt(ctx, 'bandpass', f, 2.2); noiseTo(b); b.connect(g); }
    g.connect(out); osrc(lfo(ctx, g.gain, 0.31, 0.18, t0, end));
  } else if (id === 'waves') {
    const lp = filt(ctx, 'lowpass', 750, 0.6), g = gain(ctx, 0.35), hp = filt(ctx, 'highpass', 2600, 0.6), g2 = gain(ctx, 0.08);
    noiseTo(lp); lp.connect(g); g.connect(out); noiseTo(hp); hp.connect(g2); g2.connect(out);
    osrc(lfo(ctx, g.gain, 0.125, 0.3, t0, end)); osrc(lfo(ctx, g2.gain, 0.125, 0.07, t0 + 0.4, end));
  } // birds / crickets: events only
  return { out, level, sources: src, stop(t) { for (const s of src) { try { s.stop(t); } catch (e) { /* already stopped */ } } } };
}

/** Pure: which beds should play and how loudly (0..1). Interiors muffle the outside. */
const INTERIOR = new Set(['cottage', 'workshop', 'bakery', 'cafe', 'town_hall', 'general_store', 'clinic', 'library', 'inn', 'fishing_hut', 'observatory']);
export function ambienceMix({ area, weather = 'sunny', season = 'spring', night = false } = {}) {
  const m = {}, inside = INTERIOR.has(area);
  if (area === 'none') return m; // silence all beds
  const wet = weather === 'rain' || weather === 'storm', snow = weather === 'snow';
  const set = (id, v) => { if (v > 0.01) m[id] = Math.min(1, (m[id] || 0) + v); };
  if (inside) {
    if (wet) set('rain', weather === 'storm' ? 0.3 : 0.2);
    if (area === 'inn') { set('fire', 0.4); set('crowd', 0.25); }
    if (area === 'cottage') set('fire', wet || season === 'winter' ? 0.35 : 0.12);
    if (area === 'cafe' || area === 'bakery') set('crowd', 0.22);
    if (area === 'fishing_hut') { set('waves', 0.2); set('fire', 0.15); }
    if (area === 'town_hall' || area === 'library') set('crowd', 0.05);
    return m;
  }
  if (wet) set('rain', weather === 'storm' ? 1 : 0.8);
  set('wind', (weather === 'storm' ? 0.8 : 0.1) + (season === 'winter' || snow ? 0.3 : 0) + (area === 'starview_hill' ? 0.4 : 0) + (area === 'whispering_woods' || area === 'harbor' ? 0.15 : 0));
  if (!night && !wet && !snow) set('birds', (season === 'winter' ? 0.25 : season === 'spring' ? 1 : 0.75) * (area === 'harbor' ? 0.3 : 1));
  if (night && !wet && !snow && season !== 'winter') set('crickets', season === 'autumn' ? 0.45 : 0.65);
  if (area === 'harbor') set('waves', 0.8);
  if (area === 'riverside_park') set('stream', 0.3);
  if (area === 'brook_lane' || area === 'whispering_woods') set('stream', 0.45);
  if (area === 'town_square' && !night) set('crowd', 0.12);
  return m;
}
