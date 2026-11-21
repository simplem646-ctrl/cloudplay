// sequencer.js - compiles track data into per-bar note events and plays them with a look-ahead scheduler.
import { SCALES, parseChord, voiceChord, tonicMidi, degToMidi, parseMelody } from './theory.js';
import { INSTRUMENTS, DRUM_MAP, mtof } from './synth.js';

const cache = new WeakMap();
const mulberry = (a) => () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const hash = (s) => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; };

/** Parse + cache everything derivable from track data. */
export function compile(tr) {
  let c = cache.get(tr);
  if (c) return c;
  const bar = tr.bar || 4;
  c = { tr, bar, spb: 60 / tr.tempo, scale: SCALES[tr.mode], tonic: tonicMidi(tr.key), secs: {}, plan: [] };
  if (!c.scale) throw new Error('unknown mode ' + tr.mode);
  for (const [id, S] of Object.entries(tr.sections)) {
    const chordBars = S.chords.trim().split(/\s+/).map((tok) => tok.split(',').map(parseChord));
    const mel = {};
    for (const k of Object.keys(S)) if (k !== 'chords' && typeof S[k] === 'string') mel[k] = parseMelody(S[k], bar);
    c.secs[id] = { id, bars: chordBars.length, chordBars, mel, S };
  }
  const form = tr.form;
  let loopStart = 0;
  form.forEach((id, i) => {
    if (!c.secs[id]) throw new Error('form refers to missing section ' + id);
    if (i === (tr.loopFrom || 0)) loopStart = c.plan.length;
    for (let b = 0; b < c.secs[id].bars; b++) c.plan.push({ sec: id, bi: b });
  });
  c.loopStart = loopStart;
  c.loopBars = c.plan.length - loopStart;
  cache.set(tr, c);
  return c;
}
export function trackInfo(tr) {
  const c = compile(tr);
  const barSec = c.bar * c.spb;
  return { introBars: c.loopStart, loopBars: c.loopBars, introSec: c.loopStart * barSec, loopSec: c.loopBars * barSec, barSec };
}
export function planAt(c, n) {
  return c.plan[n < c.plan.length ? n : c.loopStart + ((n - c.loopStart) % c.loopBars)];
}
const chordAt = (cb, bar, t) => cb[Math.min(cb.length - 1, Math.floor(t / (bar / cb.length)))];

/** Note events for absolute bar n: [{ t (beats in bar), dur (beats), inst, f (Hz), vel, midi? }] */
export function barEvents(tr, n) {
  const c = compile(tr), p = planAt(c, n), sec = c.secs[p.sec], S = sec.S, bar = c.bar;
  const cb = sec.chordBars[p.bi], rng = mulberry(n * 7919 + hash(tr.id));
  const nextCb = sec.chordBars[(p.bi + 1) % sec.bars];
  const dyn = S.dyn || 1, ev = [];
  const push = (e) => { e.vel = Math.min(1.2, e.vel * dyn * (0.9 + rng() * 0.2)); ev.push(e); };
  for (const part of tr.parts) {
    if (part.sec && !part.sec.includes(p.sec)) continue;
    if (part.skip && part.skip.includes(p.sec)) continue;
    const pv = part.vel == null ? 0.8 : part.vel, pg = part.gain == null ? 1 : part.gain, oct = part.oct || 0;
    if (part.role === 'mel') {
      const notes = sec.mel[part.src || 'lead'];
      if (!notes || !notes[p.bi]) continue;
      for (const nt of notes[p.bi]) {
        if (nt.rest) continue;
        const midi = degToMidi(c, nt.deg, nt.oct + oct, nt.acc);
        const downbeat = Math.abs(nt.t % 1) < 1e-6;
        push({ t: nt.t + (part.delay || 0), dur: nt.dur * (nt.stac ? 0.4 : 0.96), inst: part.inst, f: mtof(midi), midi, vel: pv * pg * (downbeat ? 1 : 0.86) });
      }
    } else if (part.role === 'chords') {
      const grid = part.grid || 0.5;
      if (part.style === 'sustain' || !part.pat) {
        let t = 0;
        for (const ch of cb) {
          const len = bar / cb.length;
          voiceChord(ch, part.center || 60, part.tones || 4).forEach((m, i) => push({ t: t + i * (part.strum || 0.02), dur: len * (part.hold || 0.98), inst: part.inst, f: mtof(m + 12 * oct), midi: m + 12 * oct, vel: pv * pg }));
          t += len;
        }
      } else {
        const steps = Math.round(bar / grid);
        for (let i = 0; i < steps; i++) {
          const ch = part.pat[i % part.pat.length];
          if (ch === '.' || ch === ' ') continue;
          const t = i * grid, chord = chordAt(cb, bar, t), vo = voiceChord(chord, part.center || 60, part.tones || 4);
          const len = part.len || grid * 1.8;
          if (ch === 'x' || ch === 'X') vo.forEach((m, k) => push({ t: t + k * (part.strum || 0.015), dur: len, inst: part.inst, f: mtof(m + 12 * oct), midi: m + 12 * oct, vel: pv * pg * (ch === 'X' ? 1 : 0.8) }));
          else { const k = +ch; const m = vo[k % vo.length] + (k >= vo.length ? 12 : 0); push({ t, dur: len, inst: part.inst, f: mtof(m + 12 * oct), midi: m + 12 * oct, vel: pv * pg }); }
        }
      }
    } else if (part.role === 'bass') {
      const grid = part.grid || 1, steps = Math.round(bar / grid);
      for (let i = 0; i < steps; i++) {
        const ch = part.pat[i % part.pat.length];
        if (ch === '.' || ch === ' ') continue;
        const t = i * grid, chord = chordAt(cb, bar, t);
        let root = 36 + chord.bass + 12 * (part.oct || 0), m = root;
        if (ch === '5') m = 36 + (chord.root + 7) % 12 + 12 * (part.oct || 0);
        else if (ch === '8') m = root + 12;
        else if (ch === '3') m = 36 + (chord.root + chord.tones[1]) % 12 + 12 * (part.oct || 0);
        else if (ch === 'w') { const nx = chordAt(i * grid + grid >= bar ? nextCb : cb, bar, (i * grid + grid) % bar); m = 36 + ((nx.root + 11) % 12) + 12 * (part.oct || 0); }
        if (m < root - 5) m += 12; // keep the bass line from wandering far below the root
        const ghost = ch === 'x';
        push({ t, dur: (part.len || grid * 0.85) * (ghost ? 0.5 : 1), inst: part.inst, f: mtof(m), midi: m, vel: pv * pg * (ghost ? 0.6 : i % 4 === 0 ? 1 : 0.85) });
      }
    } else if (part.role === 'drums') {
      const grid = part.grid || 0.5, steps = Math.round(bar / grid);
      for (const [lane, pat] of Object.entries(part.pat)) {
        const inst = DRUM_MAP[lane];
        for (let i = 0; i < steps; i++) {
          const ch = pat[i % pat.length];
          if (ch === '.' || ch === ' ') continue;
          const acc = ch === 'X' ? 1.15 : ch === 'o' ? 0.5 : 1;
          push({ t: i * grid, dur: 0.1, inst, f: lane === 'o' ? 150 + rng() * 60 : 440, vel: pv * pg * acc * (i % 2 ? 0.85 : 1), drum: true });
        }
      }
    }
  }
  return ev;
}

/** Schedule one bar's events starting at barStart (seconds on ctx clock). */
export function scheduleBar(ctx, out, tr, n, barStart) {
  const c = compile(tr), sw = tr.swing || 0;
  for (const e of barEvents(tr, n)) {
    const fn = INSTRUMENTS[e.inst];
    if (!fn) throw new Error('unknown instrument ' + e.inst);
    let tb = e.t;
    if (sw && Math.abs((tb % 1) - 0.5) < 1e-6) tb += sw;
    const when = Math.max(ctx.currentTime, barStart + tb * c.spb + (e.drum ? 0 : (Math.sin(tb * 12.9898 + n) * 0.004)));
    fn(ctx, out, when, e.f, e.dur * c.spb, e.vel);
  }
}

/** Live look-ahead player. `out` receives the instruments' audio. */
export class Player {
  constructor(ctx, out, tr, startAt) {
    this.ctx = ctx; this.out = out; this.tr = tr; this.c = compile(tr);
    this.n = 0; this.nextStart = startAt; this.stopped = false;
  }
  tick(lookahead = 0.35) {
    if (this.stopped) return;
    const barSec = this.c.bar * this.c.spb;
    while (this.nextStart < this.ctx.currentTime + lookahead) {
      if (this.nextStart + barSec < this.ctx.currentTime - 0.5) { // timer was starved for a long time: skip ahead
        this.n++; this.nextStart += barSec; continue;
      }
      scheduleBar(this.ctx, this.out, this.tr, this.n, this.nextStart);
      this.n++; this.nextStart += barSec;
    }
  }
  stop() { this.stopped = true; }
}
/** Offline helper: schedule `bars` bars from time t0. */
export function scheduleTrack(ctx, out, tr, t0, bars) {
  const c = compile(tr), barSec = c.bar * c.spb;
  for (let n = 0; n < bars; n++) scheduleBar(ctx, out, tr, n, t0 + n * barSec);
}
