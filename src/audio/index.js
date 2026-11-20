// Public audio API: a singleton `audio`. All sound is synthesised (no files). Safe in Node (no-op) and when WebAudio is missing.
//   audio.init()            call from a user gesture (creates/resumes the AudioContext); idempotent
//   audio.sfx(id)           one-shot effect (ids: SFX_IDS)
//   audio.music(id, {fadeMs})  background music with crossfade (ids: MUSIC_IDS; null stops; same id = no-op)
//   audio.ambience(id)      looping bed (ids: AMBIENCE_IDS; null stops)
//   audio.setVolume({master, music, sfx, ambience}) 0..1   ·  audio.mute(bool)  ·  audio.current()  ·  audio.isReady()
// Music and ambience requested before init() start automatically on init().
import { createGraph, playRecipe, startAmbience, compileSong, MusicPlayer } from './engine.js';
import { SFX, AMBIENCE } from './sfx.js';
import { resolveSong } from './songs.js';

class AudioService {
  constructor() {
    this.g = null;
    this.vol = { master: 0.8, music: 0.6, sfx: 0.9, ambience: 0.6 };
    this.muted = false;
    this.wantMusic = null; this.wantFade = 800;
    this.wantAmb = null;
    this.inst = null; this.old = [];
    this.amb = null; this.ambId = null;
    this.compiled = new Map();
    this.warned = new Set();
    this.last = new Map();
    this.timer = null;
  }

  isReady() { return !!this.g && this.g.ctx.state !== 'closed'; }
  current() { return this.wantMusic; }

  init() {
    if (this.g) { this.resume(); return this; }
    const AC = typeof window !== 'undefined' ? window.AudioContext || window.webkitAudioContext : null;
    if (!AC) return this;
    try {
      const ctx = new AC();
      this.g = createGraph(ctx);
      this.applyVolumes(true);
      this.resume();
      this.timer = setInterval(() => this.tick(), 30);
      if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => (document.hidden ? this.g.ctx.suspend() : this.resume()));
      if (this.wantMusic) this.startMusic(this.wantMusic, 400);
      if (this.wantAmb) this.startAmb(this.wantAmb);
    } catch (e) { console.warn('[audio] WebAudio unavailable', e); this.g = null; }
    return this;
  }
  resume() { try { if (this.g && this.g.ctx.state === 'suspended') this.g.ctx.resume(); } catch { /* ignore */ } }

  applyVolumes(instant = false) {
    if (!this.g) return;
    const t = this.g.ctx.currentTime, set = (p, v) => (instant ? (p.value = v) : p.setTargetAtTime(v, t, 0.03));
    set(this.g.master.gain, this.muted ? 0 : this.vol.master);
    set(this.g.musicBus.gain, this.vol.music);
    set(this.g.sfxBus.gain, this.vol.sfx);
    set(this.g.ambBus.gain, this.vol.ambience);
  }
  setVolume(v = {}) {
    for (const k of ['master', 'music', 'sfx', 'ambience']) if (typeof v[k] === 'number') this.vol[k] = Math.max(0, Math.min(1, v[k]));
    this.applyVolumes();
  }
  mute(b = true) { this.muted = !!b; this.applyVolumes(); }

  warnOnce(kind, id) {
    const k = `${kind}:${id}`;
    if (!this.warned.has(k)) { this.warned.add(k); console.warn(`[audio] unknown ${kind} id "${id}"`); }
  }

  sfx(id) {
    const recipe = SFX[id];
    if (!recipe) { this.warnOnce('sfx', id); return; }
    if (!this.isReady() || this.muted) return;
    const now = this.g.ctx.currentTime;
    if (now - (this.last.get(id) || -1) < 0.03) return; // collapse same-frame duplicates
    this.last.set(id, now);
    try { playRecipe(this.g, recipe, now + 0.004, this.g.sfxBus); } catch (e) { console.warn('[audio] sfx failed', id, e); }
  }

  music(id, { fadeMs = 800 } = {}) {
    if (id === this.wantMusic) return;
    this.wantMusic = id; this.wantFade = fadeMs;
    if (!this.isReady()) return;
    this.startMusic(id, fadeMs);
  }
  stopMusic(fadeMs = 800) { this.music(null, { fadeMs }); }

  startMusic(id, fadeMs) {
    const ctx = this.g.ctx, now = ctx.currentTime, fade = Math.max(0.05, fadeMs / 1000);
    if (this.inst) { // fade the old one out
      const o = this.inst;
      o.out.gain.cancelScheduledValues(now); o.out.gain.setValueAtTime(o.out.gain.value, now); o.out.gain.linearRampToValueAtTime(0, now + fade);
      o.endAt = now + fade + 0.3; this.old.push(o); this.inst = null;
    }
    if (!id) return;
    const resolved = resolveSong(id);
    if (!resolved) { this.warnOnce('music', id); return; }
    let compiled = this.compiled.get(id);
    if (!compiled) { compiled = compileSong(resolved); this.compiled.set(id, compiled); }
    const out = ctx.createGain();
    out.gain.setValueAtTime(0.0001, now); out.gain.linearRampToValueAtTime(1, now + fade);
    out.connect(this.g.musicBus);
    this.inst = { id, out, player: new MusicPlayer(this.g, compiled, out, now + 0.06) };
  }

  tick() {
    if (!this.isReady()) return;
    if (this.inst) this.inst.player.tick();
    const now = this.g.ctx.currentTime;
    this.old = this.old.filter((o) => { if (now >= o.endAt) { try { o.out.disconnect(); } catch { /* ignore */ } return false; } o.player.tick(); return true; });
  }

  ambience(id) {
    if (id === this.wantAmb) return;
    this.wantAmb = id;
    if (this.isReady()) this.startAmb(id);
  }
  startAmb(id) {
    if (this.amb) { this.amb.stop(1.2); this.amb = null; this.ambId = null; }
    if (!id) return;
    const def = AMBIENCE[id];
    if (!def) { this.warnOnce('ambience', id); return; }
    this.amb = startAmbience(this.g, def, this.g.ambBus);
    this.ambId = id;
  }
}

export const audio = new AudioService();
export { SFX, AMBIENCE };
export { SONGS, ALIASES, resolveSong } from './songs.js';
