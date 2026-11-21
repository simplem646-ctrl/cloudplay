// voices.js - short pitched text blips per speaker voice (envelope + filter + per-call pitch jitter).
import { gain, filt, osc, noise, decayEnv } from './synth.js';

export const VOICE_IDS = ['soft', 'bright', 'deep', 'gruff', 'kid', 'elder', 'brisk', 'dreamy', 'narrator'];
const V = {
  soft: { type: 'sine', f: 520, dur: 0.075, att: 0.012, lp: 1800, glide: 1.0, vol: 0.3 },
  bright: { type: 'triangle', f: 780, dur: 0.06, att: 0.005, lp: 5000, glide: 1.18, vol: 0.26, harm: 0.1 },
  deep: { type: 'sine', f: 150, dur: 0.11, att: 0.015, lp: 700, glide: 0.92, vol: 0.55, harm: 0.5, htype: 'triangle', hr: 1 },
  gruff: { type: 'sawtooth', f: 115, dur: 0.09, att: 0.008, lp: 650, q: 2, glide: 0.9, vol: 0.3, grit: 0.12 },
  kid: { type: 'sine', f: 1050, dur: 0.055, att: 0.004, lp: 4000, glide: 1.3, vol: 0.24, harm: 0.15, hr: 2 },
  elder: { type: 'triangle', f: 300, dur: 0.13, att: 0.03, lp: 1400, glide: 0.96, vol: 0.32, vib: 6 },
  brisk: { type: 'square', f: 640, dur: 0.04, att: 0.003, lp: 2200, glide: 1.0, vol: 0.15 },
  dreamy: { type: 'sine', f: 660, dur: 0.16, att: 0.05, lp: 2500, glide: 1.05, vol: 0.26, harm: 0.4, hr: 1.5, vib: 4.5 },
  narrator: { type: 'triangle', f: 260, dur: 0.085, att: 0.01, lp: 2000, glide: 1.0, vol: 0.32, harm: 0.3, hr: 2 },
};
const TRIM = { soft: 0.88, bright: 1.06, deep: 0.39, gruff: 0.81, kid: 1.01, elder: 0.89, brisk: 1.56, dreamy: 0.73, narrator: 0.71 };
const STEPS =[1, 1.122, 0.944, 1.26, 1.059];
export function voiceBlip(ctx, dest, t, voice, pitch = 1, rand = Math.random) {
  const v = V[voice] || V.soft;
  const out = gain(ctx, TRIM[voice] || 1); out.connect(dest);
  const f = v.f * pitch * STEPS[Math.floor(rand() * STEPS.length)] * (0.97 + rand() * 0.06);
  const end = t + v.dur + 0.08;
  const o = osc(ctx, v.type, f, t, end), lp = filt(ctx, 'lowpass', v.lp, v.q || 0.7), g = gain(ctx);
  if (v.glide !== 1) o.frequency.exponentialRampToValueAtTime(f * v.glide, t + v.dur);
  decayEnv(g.gain, t, v.vol, v.att, v.dur);
  o.connect(lp);
  if (v.harm) { const h = osc(ctx, v.htype || 'sine', f * (v.hr || 2), t, end), hg = gain(ctx, v.harm); if (v.glide !== 1) h.frequency.exponentialRampToValueAtTime(f * (v.hr || 2) * v.glide, t + v.dur); h.connect(hg); hg.connect(lp); }
  if (v.vib) { const l = osc(ctx, 'sine', v.vib, t, end), lg = gain(ctx, f * 0.02); l.connect(lg); lg.connect(o.frequency); }
  if (v.grit) { const n = noise(ctx, t, end), b = filt(ctx, 'bandpass', 420, 1.5), ng = gain(ctx); decayEnv(ng.gain, t, v.grit, v.att, v.dur); n.connect(b); b.connect(ng); ng.connect(out); }
  lp.connect(g); g.connect(out);
}
