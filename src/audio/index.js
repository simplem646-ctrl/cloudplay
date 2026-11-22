// src/audio/index.js - public audio API. Self-contained WebAudio synthesis; import-safe in Node (no globals touched at import).
import { gain } from './synth.js';
import { makeReverb } from './reverb.js';
import { Player, trackInfo, scheduleTrack, compile } from './sequencer.js';
import { TRACKS, TRACK_IDS } from './tracks/index.js';
import { SFX, SFX_IDS, playSfxOn, sfxLength } from './sfx.js';
import { VOICE_IDS, voiceBlip } from './voices.js';
import { AMBIENCE_IDS, createBed, hasEvents, newEventState, tickEvents, ambienceMix } from './ambience.js';

export const tracks = TRACK_IDS.slice();
export const sfxList = SFX_IDS.slice();
export const voiceList = VOICE_IDS.slice();
export const ambienceList = AMBIENCE_IDS.slice();
export { ambienceMix };

const DEFAULT_VOL = { master: 0.9, music: 0.7, sfx: 0.9, ambience: 0.6 };
const vol = { ...DEFAULT_VOL };
let muted = false;
let ctx = null, G = null, state = 'uninit';
let current = null;           // { id, player, tg }
const fading = [];            // players on their way out
let ticker = null, ambTicker = null;
const beds = {};              // id -> { bed, st, level }
let ambTarget = {};
let wantedTrack = null;
let ambOpts = null;
const lastSfx = {};

/** Master chain + buses; shared by the live context and offline renders. */
function buildGraph(c, v = vol) {
  const master = gain(c, v.master);
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -16; comp.knee.value = 22; comp.ratio.value = 3.5; comp.attack.value = 0.008; comp.release.value = 0.25;
  const analyser = c.createAnalyser(); analyser.fftSize = 1024;
  master.connect(comp); comp.connect(analyser); analyser.connect(c.destination);
  const reverb = makeReverb(c), revReturn = gain(c, 0.9);
  reverb.connect(revReturn); revReturn.connect(master);
  const music = gain(c, v.music), duck = gain(c, 1), sfx = gain(c, v.sfx), amb = gain(c, v.ambience), sfxSend = gain(c, 0.14);
  duck.connect(music); music.connect(master); sfx.connect(master); amb.connect(master);
  sfx.connect(sfxSend); sfxSend.connect(reverb);
  return { master, comp, analyser, reverb, music, duck, sfx, amb };
}
function trackChain(c, g, tr) {
  const tg = gain(c, 0), send = gain(c, tr.reverb == null ? 0.25 : tr.reverb);
  tg.connect(g.duck); tg.connect(send); send.connect(g.reverb);
  return { tg, send };
}

const GESTURES = ['pointerdown', 'keydown', 'touchend'];
let gestured = false, armed = false;
/** Re-apply what was requested before the context existed (music + ambience), once the context runs. */
function applyWanted() {
  if (!ctx || ctx.state !== 'running') return;
  if (wantedTrack && !current) playMusic(wantedTrack.id, wantedTrack.opts);
  if (ambOpts) setAmbience(ambOpts);
}
function onGesture() {
  if (gestured) return;
  gestured = true;
  for (const e of GESTURES) document.removeEventListener(e, onGesture, true);
  unlock();
}
/**
 * Browsers only allow an AudioContext after a user gesture, so before the first key/pointer nothing is created (no console
 * noise): init() arms a one-shot gesture listener and reports 'locked'. Music/ambience requested meanwhile start on unlock.
 */
export function init() {
  if (ctx || state === 'unavailable') return state;
  const AC = typeof globalThis !== 'undefined' && (globalThis.AudioContext || globalThis.webkitAudioContext);
  if (!AC) { state = 'unavailable'; return state; }
  if (!gestured) {
    state = 'locked';
    if (!armed && typeof document !== 'undefined') { armed = true; for (const e of GESTURES) document.addEventListener(e, onGesture, true); }
    return state;
  }
  try {
    ctx = new AC({ latencyHint: 'interactive' });
    G = buildGraph(ctx);
    state = ctx.state;
    ctx.onstatechange = () => { state = ctx.state; applyWanted(); };
    ticker = setInterval(tick, 25);
    ambTicker = setInterval(ambTick, 250);
    applyWanted();
  } catch (e) { ctx = null; G = null; state = 'unavailable'; }
  return state;
}
export function unlock() {
  gestured = true;
  init();
  if (ctx && ctx.state === 'suspended') { try { const p = ctx.resume(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* ignore */ } }
  if (ctx) state = ctx.state;
  return state;
}
function tick() {
  if (!ctx) return;
  if (current) current.player.tick();
  for (let i = fading.length - 1; i >= 0; i--) {
    const f = fading[i];
    if (ctx.currentTime > f.until) { f.player.stop(); try { f.tg.disconnect(); f.send.disconnect(); } catch (e) { /* ignore */ } fading.splice(i, 1); }
    else if (ctx.currentTime < f.fadeEnd) f.player.tick();
  }
}
function ambTick() {
  if (!ctx || ctx.state !== 'running') return;
  for (const [id, b] of Object.entries(beds)) if (b.st) tickEvents(ctx, b.bed.out, id, b.st, ctx.currentTime + 1.2);
}

export function playMusic(trackId, { fadeMs = 1200 } = {}) {
  const tr = TRACKS[trackId];
  if (!tr) return false;
  wantedTrack = { id: trackId, opts: { fadeMs } };
  init();
  if (!ctx) return false;
  if (current && current.id === trackId) return true;
  const now = ctx.currentTime, fade = Math.max(0.02, fadeMs / 1000);
  if (current) {
    const o = current;
    o.tg.gain.cancelScheduledValues(now); o.tg.gain.setValueAtTime(o.tg.gain.value, now); o.tg.gain.linearRampToValueAtTime(0, now + fade);
    fading.push({ ...o, fadeEnd: now + fade, until: now + fade + 3 });
  }
  const { tg, send } = trackChain(ctx, G, tr);
  tg.gain.setValueAtTime(0, now); tg.gain.linearRampToValueAtTime(tr.gain == null ? 1 : tr.gain, now + fade);
  current = { id: trackId, player: new Player(ctx, tg, tr, now + 0.08), tg, send };
  return true;
}
export function stopMusic({ fadeMs = 1200 } = {}) {
  wantedTrack = null;
  if (!ctx || !current) return;
  const now = ctx.currentTime, fade = Math.max(0.02, fadeMs / 1000), o = current;
  o.tg.gain.cancelScheduledValues(now); o.tg.gain.setValueAtTime(o.tg.gain.value, now); o.tg.gain.linearRampToValueAtTime(0, now + fade);
  fading.push({ ...o, fadeEnd: now + fade, until: now + fade + 3 });
  current = null;
}
export function duckMusic(on) { if (G) G.duck.gain.setTargetAtTime(on ? 0.35 : 1, ctx.currentTime, 0.12); }

export function playSfx(id, { volume = 1, rate = 1, pan = 0 } = {}) {
  if (!SFX[id]) return false;
  init();
  if (!ctx || ctx.state !== 'running') return false;
  const now = ctx.currentTime;
  if (lastSfx[id] && now - lastSfx[id] < 0.025) return false;
  lastSfx[id] = now;
  const g = gain(ctx, volume);
  let node = g;
  if (pan && ctx.createStereoPanner) { const p = ctx.createStereoPanner(); p.pan.value = Math.max(-1, Math.min(1, pan)); g.connect(p); node = p; }
  node.connect(G.sfx);
  playSfxOn(ctx, g, id, now + 0.005, rate);
  return true;
}
export function blip(voice, { pitch = 1 } = {}) {
  init();
  if (!ctx || ctx.state !== 'running') return false;
  voiceBlip(ctx, G.sfx, ctx.currentTime + 0.005, VOICE_IDS.includes(voice) ? voice : 'soft', pitch);
  return true;
}
const STEP_ID = { grass: 'step_grass', dirt: 'step_dirt', stone: 'step_stone', wood: 'step_wood', sand: 'step_sand', snow: 'step_snow', carpet: 'step_carpet', water: 'step_water' };
export function footstep(surface, { run = false } = {}) {
  return playSfx(STEP_ID[surface] || 'step_dirt', { volume: (run ? 0.9 : 0.65) * (0.85 + Math.random() * 0.3), rate: (run ? 1.12 : 1) * (0.93 + Math.random() * 0.14) });
}

export function setAmbience(o = {}) {
  ambTarget = ambienceMix(o);
  ambOpts = o;
  init();
  if (!ctx) return ambTarget;
  const now = ctx.currentTime;
  for (const id of AMBIENCE_IDS) {
    const level = ambTarget[id] || 0;
    let b = beds[id];
    if (level > 0 && !b) {
      b = beds[id] = { bed: createBed(ctx, G.amb, id, now), st: hasEvents(id) ? newEventState(now) : null, level: 0 };
      b.bed.level.gain.setValueAtTime(0, now);
    }
    if (b) {
      b.level = level;
      b.bed.level.gain.setTargetAtTime(level, now, 1.4);
      if (level === 0) { // retire the bed once it has faded out
        const dead = b; delete beds[id];
        dead.st = null;
        setTimeout(() => { try { dead.bed.stop(); dead.bed.level.disconnect(); } catch (e) { /* ignore */ } }, 7000);
      }
    }
  }
  return ambTarget;
}

function applyVolumes() {
  if (!G) return;
  const now = ctx.currentTime;
  G.master.gain.setTargetAtTime(muted ? 0 : vol.master, now, 0.03);
  G.music.gain.setTargetAtTime(vol.music, now, 0.05);
  G.sfx.gain.setTargetAtTime(vol.sfx, now, 0.05);
  G.amb.gain.setTargetAtTime(vol.ambience, now, 0.05);
}
export function setVolume(v = {}) {
  for (const k of ['master', 'music', 'sfx', 'ambience']) if (typeof v[k] === 'number' && isFinite(v[k])) vol[k] = Math.max(0, Math.min(1, v[k]));
  applyVolumes();
}
export function setMuted(b) { muted = !!b; applyVolumes(); }
export function stats() {
  return { state: ctx ? ctx.state : state, playing: current ? current.id : null, muted, volume: { ...vol }, ambience: Object.keys(beds), fading: fading.length };
}
export function getAnalyser() { return G ? G.analyser : null; }
export function trackMeta(id) {
  const tr = TRACKS[id]; if (!tr) return null;
  return { id, name: tr.name, tempo: tr.tempo, key: tr.key, mode: tr.mode, bar: tr.bar || 4, ...trackInfo(tr) };
}

// ---------- offline analysis ----------
const dbOf = (x) => (x > 1e-9 ? 20 * Math.log10(x) : -180);
function analyse(buf, mainSec, seamAt) {
  const sr = buf.sampleRate, n = buf.length, chs = [];
  for (let c = 0; c < buf.numberOfChannels; c++) chs.push(buf.getChannelData(c));
  let peak = 0, nan = false, sum = 0;
  const mainN = Math.min(n, Math.floor(mainSec * sr));
  for (let i = 0; i < n; i++) {
    let m = 0;
    for (const d of chs) { const x = d[i]; if (!Number.isFinite(x)) { nan = true; continue; } const a = Math.abs(x); if (a > peak) peak = a; m += x; }
    m /= chs.length;
    if (i < mainN) sum += m * m;
  }
  const rms = Math.sqrt(sum / Math.max(1, mainN));
  const win = Math.floor(sr * 0.05);
  let silent = 0, windows = 0, activeSum = 0, activeN = 0;
  for (let s = 0; s + win <= mainN; s += win) {
    let e = 0;
    for (let i = s; i < s + win; i++) { let m = 0; for (const d of chs) m += d[i]; m /= chs.length; e += m * m; }
    windows++;
    if (Math.sqrt(e / win) < 1e-3) silent++; else { activeSum += e; activeN += win; }
  }
  const r = { rmsDb: +dbOf(rms).toFixed(2), activeRmsDb: +dbOf(Math.sqrt(activeSum / Math.max(1, activeN))).toFixed(2), peak: +peak.toFixed(4), silentRatio: +(windows ? silent / windows : 1).toFixed(3), nan, seconds: +(n / sr).toFixed(2) };
  if (seamAt == null) { // fingerprint used by the lab to prove effects sound distinct: 50 ms level envelope + zero-crossing rate
    const d = chs[0], env = [];
    for (let b = 0; b < 30; b++) { let e = 0; const a = b * win, z = Math.min(n, a + win); for (let i = a; i < z; i++) e += d[i] * d[i]; env.push(+Math.max(-70, dbOf(Math.sqrt(e / win))).toFixed(1)); }
    let zc = 0, act = 0;
    for (let i = 1; i < mainN; i++) if (Math.abs(d[i]) > 0.003) { act++; if ((d[i] >= 0) !== (d[i - 1] >= 0)) zc++; }
    const zb = []; // per-bin dominant-frequency estimate (a crude pitch/brightness contour)
    for (let b = 0; b < 30; b++) {
      let z = 0, a = 0;
      for (let i = Math.max(1, b * win); i < Math.min(n, (b + 1) * win); i++) if (Math.abs(d[i]) > 0.003) { a++; if ((d[i] >= 0) !== (d[i - 1] >= 0)) z++; }
      zb.push(a > win / 4 ? Math.round((z / a) * sr / 2) : 0);
    }
    r.env = env; r.zcrBins = zb; r.zcrHz = Math.round((zc / Math.max(1, act)) * sr / 2);
  }
  if (seamAt != null) {
    const s0 = Math.floor(seamAt * sr), w = Math.floor(sr * 0.05), d = chs[0];
    const rmsRange = (a, b) => { let e = 0; for (let i = a; i < b; i++) e += d[i] * d[i]; return Math.sqrt(e / Math.max(1, b - a)); };
    const stepMax = (a, b) => { let m = 0; for (let i = Math.max(1, a); i < b; i++) m = Math.max(m, Math.abs(d[i] - d[i - 1])); return m; };
    if (s0 + w <= n) {
      const before = rmsRange(s0 - w, s0), after = rmsRange(s0, s0 + w);
      const near = stepMax(s0 - Math.floor(sr * 0.015), s0 + Math.floor(sr * 0.015)), all = stepMax(1, mainN);
      r.seam = { beforeDb: +dbOf(before).toFixed(1), afterDb: +dbOf(after).toFixed(1), deltaDb: +(dbOf(after) - dbOf(before)).toFixed(1), stepNear: +near.toFixed(4), stepMax: +all.toFixed(4), ok: Math.abs(dbOf(after) - dbOf(before)) < 9 && near <= all * 0.95 + 1e-4 };
    }
  }
  return r;
}
/**
 * Render a track / sfx / voice ('voice:soft' or 'soft') / ambience ('ambience:rain' or 'rain') offline and analyse it.
 * Resolves null when OfflineAudioContext is unavailable (Node). Tracks: default length = intro + one loop + 2.5 s of the loop restart.
 */
export async function renderOffline(id, seconds, { sampleRate = 24000 } = {}) {
  const OAC = typeof globalThis !== 'undefined' && (globalThis.OfflineAudioContext || globalThis.webkitOfflineAudioContext);
  if (!OAC) return null;
  let kind, name = id;
  if (id.startsWith('voice:')) { kind = 'voice'; name = id.slice(6); } else if (id.startsWith('ambience:')) { kind = 'ambience'; name = id.slice(9); }
  else if (TRACKS[id]) kind = 'track'; else if (SFX[id]) kind = 'sfx'; else if (VOICE_IDS.includes(id)) kind = 'voice'; else if (AMBIENCE_IDS.includes(id)) kind = 'ambience';
  else throw new Error('renderOffline: unknown id ' + id);
  let mainSec, seamAt = null, dur = seconds;
  if (kind === 'track') {
    const info = trackInfo(TRACKS[name]);
    seamAt = info.introSec + info.loopSec; mainSec = seamAt;
    dur = seconds || seamAt + 2.5;
    if (seconds) mainSec = Math.min(seconds, seamAt);
  } else if (kind === 'sfx') { dur = seconds || sfxLength(name); mainSec = dur; }
  else if (kind === 'voice') { dur = seconds || 2; mainSec = dur; }
  else { dur = seconds || 10; mainSec = dur; }
  const c = new OAC(2, Math.ceil(dur * sampleRate), sampleRate);
  const g = buildGraph(c, DEFAULT_VOL);
  const t0 = 0.05;
  if (kind === 'track') {
    const tr = TRACKS[name], ch = trackChain(c, g, tr);
    ch.tg.gain.value = tr.gain == null ? 1 : tr.gain;
    const cm = compile(tr), bars = Math.ceil((dur - t0) / (cm.bar * cm.spb)) + 1;
    scheduleTrack(c, ch.tg, tr, t0, bars);
  } else if (kind === 'sfx') {
    const o = gain(c, 1); o.connect(g.sfx); playSfxOn(c, o, name, t0, 1);
  } else if (kind === 'voice') {
    let s = 7; const rand = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 8; i++) voiceBlip(c, g.sfx, t0 + i * 0.11 + (i > 4 ? 0.3 : 0), name, 1, rand);
  } else {
    const bed = createBed(c, g.amb, name, 0, dur);
    if (hasEvents(name)) tickEvents(c, bed.out, name, newEventState(0), dur);
  }
  const buf = await c.startRendering();
  return { id, kind, ...analyse(buf, mainSec, seamAt) };
}
