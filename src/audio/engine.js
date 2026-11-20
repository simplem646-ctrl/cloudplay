// WebAudio synthesis engine: graph, voices, drums, SFX recipes, ambience beds, song compiler and lookahead player.
// Everything takes the AudioContext as a parameter so the same code renders in real time and in an OfflineAudioContext.
import { midiToFreq, parseNotes, parseDrums } from './theory.js';
import { SFX, AMBIENCE } from './sfx.js';

// ---------------------------------------------------------------- graph
export function createGraph(ctx) {
  const g = { ctx, pulse: {} };
  g.master = ctx.createGain();
  g.comp = ctx.createDynamicsCompressor();
  g.comp.threshold.value = -16; g.comp.ratio.value = 5; g.comp.attack.value = 0.004; g.comp.release.value = 0.22; g.comp.knee.value = 12;
  g.master.connect(g.comp); g.comp.connect(ctx.destination);
  g.musicBus = ctx.createGain(); g.sfxBus = ctx.createGain(); g.ambBus = ctx.createGain();
  for (const b of [g.musicBus, g.sfxBus, g.ambBus]) b.connect(g.master);
  g.reverb = ctx.createConvolver();
  g.reverb.buffer = makeImpulse(ctx, 1.6);
  g.revGain = ctx.createGain(); g.revGain.gain.value = 0.34;
  g.reverb.connect(g.revGain); g.revGain.connect(g.musicBus);
  g.noise = makeNoise(ctx);
  return g;
}

function makeNoise(ctx) {
  const len = Math.floor(ctx.sampleRate * 1.5);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let seed = 12345;
  for (let i = 0; i < len; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; d[i] = (seed / 4294967296) * 2 - 1; }
  return buf;
}
function makeImpulse(ctx, seconds) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let seed = 777 + c * 91;
    for (let i = 0; i < len; i++) { seed = (seed * 1664525 + 1013904223) >>> 0; d[i] = ((seed / 4294967296) * 2 - 1) * (1 - i / len) ** 2.6; }
  }
  return buf;
}
function pulseWave(g, duty) {
  if (g.pulse[duty]) return g.pulse[duty];
  const N = 40, real = new Float32Array(N), imag = new Float32Array(N);
  for (let n = 1; n < N; n++) { real[n] = Math.sin(2 * Math.PI * n * duty) / (n * Math.PI); imag[n] = (1 - Math.cos(2 * Math.PI * n * duty)) / (n * Math.PI); }
  return (g.pulse[duty] = g.ctx.createPeriodicWave(real, imag));
}

// ---------------------------------------------------------------- voices
function ampEnv(param, t, dur, peak, attack = 0.006, release = 0.05) {
  const end = t + Math.max(dur, attack + 0.01);
  param.setValueAtTime(0.0001, t);
  param.linearRampToValueAtTime(peak, t + attack);
  param.setValueAtTime(peak, Math.max(t + attack, end - release));
  param.linearRampToValueAtTime(0.0001, end);
  return end;
}
function connectOut(g, node, out, rev) {
  node.connect(out);
  if (rev > 0) { const s = g.ctx.createGain(); s.gain.value = rev; node.connect(s); s.connect(g.reverb); }
}

/** Play one melodic note. voice: pulse12|pulse25|pulse50|tri|sine|pluck|bell|pad */
export function playNote(g, out, t, midi, durSec, voice, gain, rev = 0) {
  const ctx = g.ctx, f = midiToFreq(midi), amp = ctx.createGain();
  let stop;
  if (voice === 'pad') {
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 1500;
    const a = ctx.createOscillator(), b = ctx.createOscillator();
    a.type = b.type = 'sawtooth'; a.frequency.value = f; b.frequency.value = f; a.detune.value = -7; b.detune.value = 7;
    a.connect(lp); b.connect(lp); lp.connect(amp);
    stop = ampEnv(amp.gain, t, durSec, gain * 0.55, Math.min(0.35, durSec * 0.4), Math.min(0.5, durSec * 0.4));
    a.start(t); b.start(t); a.stop(stop + 0.05); b.stop(stop + 0.05);
  } else if (voice === 'bell') {
    const car = ctx.createOscillator(), mod = ctx.createOscillator(), mg = ctx.createGain();
    car.type = 'sine'; mod.type = 'sine'; car.frequency.value = f; mod.frequency.value = f * 3.5;
    mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + 0.6);
    mod.connect(mg); mg.connect(car.frequency); car.connect(amp);
    const len = Math.min(Math.max(durSec, 0.4) * 1.6, 2.4);
    amp.gain.setValueAtTime(0.0001, t); amp.gain.linearRampToValueAtTime(gain, t + 0.004); amp.gain.exponentialRampToValueAtTime(0.0001, t + len);
    car.start(t); mod.start(t); car.stop(t + len + 0.05); mod.stop(t + len + 0.05); stop = t + len;
  } else if (voice === 'pluck') {
    const o = ctx.createOscillator(), lp = ctx.createBiquadFilter();
    o.type = 'triangle'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(8000, f * 8), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.5), t + 0.25);
    o.connect(lp); lp.connect(amp);
    const len = Math.min(Math.max(durSec * 0.9, 0.15), 0.7);
    amp.gain.setValueAtTime(0.0001, t); amp.gain.linearRampToValueAtTime(gain, t + 0.004); amp.gain.exponentialRampToValueAtTime(0.0001, t + len);
    o.start(t); o.stop(t + len + 0.05); stop = t + len;
  } else {
    const o = ctx.createOscillator();
    if (voice === 'pulse12') o.setPeriodicWave(pulseWave(g, 0.125));
    else if (voice === 'pulse25') o.setPeriodicWave(pulseWave(g, 0.25));
    else if (voice === 'pulse50') o.setPeriodicWave(pulseWave(g, 0.5));
    else o.type = voice === 'sine' ? 'sine' : 'triangle';
    o.frequency.value = f; o.connect(amp);
    stop = ampEnv(amp.gain, t, durSec * 0.94, gain, 0.006, Math.min(0.06, durSec * 0.4));
    o.start(t); o.stop(stop + 0.05);
  }
  connectOut(g, amp, out, rev);
  return stop;
}

/** Drum hit. perc: k kick, s snare, h hat, o open hat, c clap */
export function playPerc(g, out, t, perc, gain) {
  const ctx = g.ctx;
  const burst = (dur, filterType, freq, q = 0.8) => {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), a = ctx.createGain();
    s.buffer = g.noise; f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    a.gain.setValueAtTime(gain, t); a.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(a); a.connect(out); s.start(t, (t * 7.3) % 1); s.stop(t + dur + 0.02);
  };
  if (perc === 'k') {
    const o = ctx.createOscillator(), a = ctx.createGain();
    o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    a.gain.setValueAtTime(gain * 2.2, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.17);
    o.connect(a); a.connect(out); o.start(t); o.stop(t + 0.2);
  } else if (perc === 's') {
    burst(0.12, 'bandpass', 1900, 0.7);
    const o = ctx.createOscillator(), a = ctx.createGain();
    o.type = 'triangle'; o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(120, t + 0.08);
    a.gain.setValueAtTime(gain * 0.8, t); a.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
    o.connect(a); a.connect(out); o.start(t); o.stop(t + 0.1);
  } else if (perc === 'h') burst(0.045, 'highpass', 7500, 0.5);
  else if (perc === 'o') burst(0.16, 'highpass', 6500, 0.5);
  else if (perc === 'c') { burst(0.03, 'bandpass', 1600, 0.9); }
}

// ---------------------------------------------------------------- SFX recipes
export function playRecipe(g, recipe, t0, out, rnd = Math.random) {
  const ctx = g.ctx;
  for (const e of recipe) {
    const t = t0 + e.at;
    if (e.k === 'tone') {
      const o = ctx.createOscillator(), a = ctx.createGain();
      const m = e.rand ? 1 + (rnd() * 2 - 1) * e.rand : 1;
      o.type = e.wave; o.frequency.setValueAtTime(e.f0 * m, t);
      if (e.f1 !== e.f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, e.f1 * m), t + e.dur);
      ampEnv(a.gain, t, e.dur, e.gain, 0.004, Math.min(0.05, e.dur * 0.5));
      o.connect(a); a.connect(out); o.start(t); o.stop(t + e.dur + 0.06);
    } else if (e.k === 'noise') {
      const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), a = ctx.createGain();
      s.buffer = g.noise; s.loop = true;
      const type = e.bp ? 'bandpass' : e.lp ? 'lowpass' : 'highpass';
      f.type = type; f.frequency.setValueAtTime(e.bp || e.lp || e.hp || 3000, t); f.Q.value = e.bp ? 1.1 : 0.7;
      if (e.sweep) f.frequency.exponentialRampToValueAtTime(e.sweep[1], t + e.dur);
      if (e.sweep) f.frequency.setValueAtTime(e.sweep[0], t);
      ampEnv(a.gain, t, e.dur, e.gain, Math.min(0.01, e.dur * 0.3), Math.min(0.08, e.dur * 0.6));
      s.connect(f); f.connect(a); a.connect(out); s.start(t, rnd()); s.stop(t + e.dur + 0.06);
    } else if (e.k === 'bell') {
      playNote(g, out, t, 12 * Math.log2(e.f / 440) + 69, e.dur, 'bell', e.gain, 0);
    }
  }
}
export const recipeDuration = (recipe) => Math.max(...recipe.map((e) => e.at + (e.dur || 0.5))) + 0.1;

// ---------------------------------------------------------------- ambience
export function startAmbience(g, def, out) {
  const ctx = g.ctx, timers = [], nodes = [];
  const bus = ctx.createGain();
  bus.gain.value = 0; bus.gain.linearRampToValueAtTime(1, ctx.currentTime + 1.5);
  bus.connect(out);
  if (def.type === 'noise') {
    const s = ctx.createBufferSource(), f = ctx.createBiquadFilter(), a = ctx.createGain();
    s.buffer = g.noise; s.loop = true;
    f.type = def.bp ? 'bandpass' : 'lowpass'; f.frequency.value = def.bp || def.lp; f.Q.value = def.q || 0.7;
    a.gain.value = def.gain * (1 - (def.lfo ? def.lfo[1] * 0.5 : 0));
    s.connect(f);
    if (def.hp) { const h = ctx.createBiquadFilter(); h.type = 'highpass'; h.frequency.value = def.hp; f.connect(h); h.connect(a); } else f.connect(a);
    a.connect(bus);
    if (def.lfo) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.type = 'sine'; l.frequency.value = def.lfo[0]; lg.gain.value = def.gain * def.lfo[1] * 0.5;
      l.connect(lg); lg.connect(a.gain); l.start(); nodes.push(l);
    }
    if (def.sweep) {
      const l = ctx.createOscillator(), lg = ctx.createGain();
      l.type = 'sine'; l.frequency.value = def.lfo ? def.lfo[0] * 0.7 : 0.1; lg.gain.value = (def.sweep[1] - def.sweep[0]) / 2; f.frequency.value = (def.sweep[0] + def.sweep[1]) / 2;
      l.connect(lg); lg.connect(f.frequency); l.start(); nodes.push(l);
    }
    s.start(0, Math.random()); nodes.push(s);
  } else if (def.type === 'chirps') {
    const chirp = () => {
      const t = ctx.currentTime + 0.02;
      for (let i = 0; i < def.burst; i++) {
        const o = ctx.createOscillator(), a = ctx.createGain();
        o.type = def.wave; const f = def.f * (0.9 + Math.random() * 0.25);
        o.frequency.setValueAtTime(f, t + i * 0.07);
        if (def.sweep) o.frequency.linearRampToValueAtTime(f * (1 + def.sweep * 0.3), t + i * 0.07 + 0.05);
        a.gain.setValueAtTime(0.0001, t + i * 0.07); a.gain.linearRampToValueAtTime(def.gain, t + i * 0.07 + 0.008); a.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.06);
        o.connect(a); a.connect(bus); o.start(t + i * 0.07); o.stop(t + i * 0.07 + 0.08);
      }
      timers.push(setTimeout(chirp, (def.rate[0] + Math.random() * (def.rate[1] - def.rate[0])) * 1000));
    };
    chirp();
  }
  return {
    stop(fade = 1) {
      timers.forEach(clearTimeout);
      try { bus.gain.cancelScheduledValues(ctx.currentTime); bus.gain.setValueAtTime(bus.gain.value, ctx.currentTime); bus.gain.linearRampToValueAtTime(0, ctx.currentTime + fade); } catch { /* closed */ }
      setTimeout(() => { nodes.forEach((n) => { try { n.stop(); } catch { /* already stopped */ } }); try { bus.disconnect(); } catch { /* ignore */ } }, fade * 1000 + 100);
    },
  };
}

// ---------------------------------------------------------------- songs
/** Compile a resolved song ({song, transpose, tempo}) into events per part with absolute beat times for ONE loop. */
export function compileSong({ song, transpose = 0, tempo = 1 }) {
  const parts = song.parts.map((p) => {
    const parsed = p.d !== undefined ? parseDrums(p.d) : parseNotes(p.n, transpose);
    return { voice: p.v, gain: p.g, rev: p.rev || 0, events: parsed.events, beats: parsed.beats };
  });
  const loopBeats = Math.max(...parts.map((p) => p.beats));
  return { bpm: song.bpm * tempo, loopBeats, parts };
}

/** Schedule every event whose time falls in [fromSec, toSec) (song-relative seconds, looping). Returns nothing. */
export function scheduleRange(g, out, compiled, songStart, fromSec, toSec) {
  const spb = 60 / compiled.bpm;
  for (const part of compiled.parts) {
    const partLen = part.beats * spb;
    const firstLoop = Math.floor(fromSec / partLen);
    for (let loop = firstLoop; loop * partLen < toSec; loop++) {
      for (const ev of part.events) {
        const ts = loop * partLen + ev.t * spb;
        if (ts < fromSec || ts >= toSec) continue;
        const at = songStart + ts;
        if (ev.perc) playPerc(g, out, at, ev.perc, part.gain);
        else for (const m of ev.midi) playNote(g, out, at, m, ev.d * spb, part.voice, part.gain / (part.voice === 'pad' || ev.midi.length < 2 ? 1 : Math.sqrt(ev.midi.length)), part.rev);
      }
    }
  }
}

/** Realtime lookahead player for one compiled song. */
export class MusicPlayer {
  constructor(g, compiled, out, startTime) {
    Object.assign(this, { g, compiled, out, start: startTime, done: 0 });
    this.lookahead = 0.3;
  }
  tick() {
    const now = this.g.ctx.currentTime - this.start;
    const to = now + this.lookahead;
    if (to > this.done) { scheduleRange(this.g, this.out, this.compiled, this.start, Math.max(this.done, 0), to); this.done = to; }
  }
}

void SFX; void AMBIENCE;
