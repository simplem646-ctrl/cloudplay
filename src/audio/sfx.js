// sfx.js - every sound effect is synthesised on demand. Soft, rounded, no harsh beeps.
import { gain, filt, osc, noise, decayEnv, mtof, INSTRUMENTS } from './synth.js';
import { birdChirp } from './ambience.js';

/** Helper kit bound to one playback: times are divided by `rate`, pitches multiplied by it. */
function kit(ctx, out, t0, rate) {
  const T = (dt) => t0 + (dt || 0) / rate;
  return {
    tone(o) {
      const t = T(o.dt), d = (o.dur || 0.15) / rate, f = o.f * rate;
      const x = osc(ctx, o.type || 'sine', f, t, t + d + 0.06), g = gain(ctx);
      if (o.f2) x.frequency.exponentialRampToValueAtTime(o.f2 * rate, t + (o.glide ? o.glide / rate : d));
      decayEnv(g.gain, t, o.vol == null ? 0.3 : o.vol, o.att == null ? 0.004 : o.att, d);
      let n = x;
      if (o.lp) { const l = filt(ctx, 'lowpass', o.lp * rate, 0.7); x.connect(l); n = l; }
      n.connect(g); g.connect(out);
    },
    noise(o) {
      const t = T(o.dt), d = (o.dur || 0.1) / rate;
      const s = noise(ctx, t, t + d + 0.06), f = filt(ctx, o.type || 'bandpass', (o.f || 1000) * rate, o.q || 0.8), g = gain(ctx);
      if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2 * rate, t + d);
      decayEnv(g.gain, t, o.vol == null ? 0.2 : o.vol, o.att == null ? 0.003 : o.att, d);
      s.connect(f); f.connect(g); g.connect(out);
    },
    note(inst, midi, dt, dur, vel) { INSTRUMENTS[inst](ctx, out, T(dt), mtof(midi) * rate, (dur || 0.3) / rate, vel == null ? 0.8 : vel); },
    chirp(dt, base, vol, syll) { birdChirp(ctx, out, T(dt), base * rate, vol, syll); },
    T,
  };
}
const arp = (c, inst, notes, step, vel, dur) => notes.forEach((m, i) => c.note(inst, m, i * step, dur || 0.3, vel));

export const SFX = {
  ui_move: (c) => c.tone({ f: 880, f2: 820, dur: 0.05, vol: 0.2, type: 'triangle', lp: 3000 }),
  ui_confirm: (c) => { c.tone({ f: 660, dur: 0.09, vol: 0.22, type: 'triangle' }); c.tone({ dt: 0.08, f: 990, dur: 0.16, vol: 0.22, type: 'triangle' }); c.tone({ dt: 0.08, f: 1980, dur: 0.1, vol: 0.04 }); },
  ui_cancel: (c) => { c.tone({ f: 620, dur: 0.08, vol: 0.2, type: 'triangle' }); c.tone({ dt: 0.08, f: 440, dur: 0.14, vol: 0.2, type: 'triangle' }); },
  ui_open: (c) => { c.tone({ f: 420, f2: 840, dur: 0.14, vol: 0.18, lp: 2500 }); c.note('marimba', 79, 0.08, 0.2, 0.5); },
  ui_close: (c) => { c.tone({ f: 840, f2: 420, dur: 0.14, vol: 0.18, lp: 2500 }); c.note('marimba', 67, 0.06, 0.2, 0.45); },
  ui_error: (c) => { c.tone({ f: 196, f2: 165, dur: 0.2, type: 'triangle', vol: 0.32, lp: 700 }); c.tone({ dt: 0.11, f: 175, f2: 147, dur: 0.24, type: 'triangle', vol: 0.32, lp: 650 }); },
  ui_tab: (c) => c.note('marimba', 84, 0, 0.1, 0.5),
  coin: (c) => { c.note('glock', 88, 0, 0.3, 0.85); c.note('glock', 93, 0.07, 0.4, 0.85); },
  buy: (c) => { arp(c, 'glock', [88, 91, 95], 0.06, 0.8, 0.3); c.noise({ type: 'highpass', f: 5500, dur: 0.14, vol: 0.06, dt: 0.02 }); c.note('marimba', 72, 0.22, 0.2, 0.5); },
  sell: (c) => { arp(c, 'glock', [93, 88], 0.08, 0.8, 0.3); c.note('marimba', 76, 0.2, 0.2, 0.5); c.tone({ dt: 0.2, f: 500, f2: 800, dur: 0.05, vol: 0.2 }); },
  item_get: (c) => arp(c, 'marimba', [72, 76, 79, 84], 0.06, 0.8, 0.3),
  item_get_rare: (c) => { arp(c, 'celesta', [72, 76, 79, 84, 88, 91], 0.07, 0.8, 0.5); [84, 88, 91, 96].forEach((m) => c.note('bell', m, 0.5, 1.2, 0.45)); c.noise({ type: 'highpass', f: 6000, dur: 0.8, vol: 0.05, att: 0.3, dt: 0.4 }); },
  heart_up: (c) => { c.tone({ f: 95, f2: 60, dur: 0.14, vol: 0.5 }); c.tone({ dt: 0.17, f: 95, f2: 60, dur: 0.16, vol: 0.5 }); arp(c, 'celesta', [84, 88, 91].map((m) => m), 0.1, 0.7, 0.6); c.note('celesta', 96, 0.5, 0.8, 0.5); },
  quest_new: (c) => { arp(c, 'marimba', [67, 72, 76], 0.1, 0.8, 0.2); c.note('bell', 84, 0.34, 1.2, 0.5); },
  quest_done: (c) => { arp(c, 'marimba', [60, 64, 67, 72], 0.09, 0.8, 0.3); [72, 76, 79].forEach((m) => c.note('bell', m, 0.4, 1.2, 0.45)); c.note('strings', 60, 0.38, 0.8, 0.5); c.note('strings', 64, 0.38, 0.8, 0.5); },
  door_open: (c) => { c.tone({ f: 180, f2: 320, dur: 0.28, type: 'sawtooth', vol: 0.1, lp: 900, att: 0.05 }); c.noise({ f: 1200, q: 3, dur: 0.25, vol: 0.07, att: 0.05 }); c.noise({ dt: 0.3, type: 'highpass', f: 2500, dur: 0.02, vol: 0.12 }); },
  door_close: (c) => { c.tone({ f: 110, f2: 60, dur: 0.15, vol: 0.5 }); c.noise({ type: 'lowpass', f: 400, dur: 0.08, vol: 0.3 }); c.tone({ dt: 0.12, f: 1500, dur: 0.02, vol: 0.12 }); },
  step_grass: (c) => c.noise({ type: 'lowpass', f: 1800, dur: 0.09, vol: 0.24, att: 0.012 }),
  step_dirt: (c) => { c.noise({ f: 900, q: 0.8, dur: 0.08, vol: 0.28 }); c.tone({ f: 120, f2: 70, dur: 0.06, vol: 0.25 }); },
  step_stone: (c) => { c.noise({ type: 'highpass', f: 2500, dur: 0.04, vol: 0.2 }); c.tone({ f: 200, f2: 150, dur: 0.05, vol: 0.18 }); c.tone({ f: 3000, dur: 0.01, vol: 0.05 }); },
  step_wood: (c) => { c.tone({ f: 160, f2: 110, dur: 0.09, vol: 0.42, type: 'triangle' }); c.noise({ f: 1300, q: 2, dur: 0.05, vol: 0.1 }); },
  step_sand: (c) => c.noise({ type: 'highpass', f: 1500, dur: 0.14, vol: 0.17, att: 0.04 }),
  step_snow: (c) => { c.noise({ f: 3200, q: 1.5, dur: 0.05, vol: 0.14, att: 0.005 }); c.noise({ dt: 0.03, f: 2600, q: 1.5, dur: 0.07, vol: 0.12, att: 0.005 }); },
  splash: (c) => { c.noise({ f: 600, f2: 2200, q: 0.8, dur: 0.45, vol: 0.34, att: 0.02 }); c.tone({ f: 350, f2: 180, dur: 0.15, vol: 0.2 }); c.tone({ dt: 0.2, f: 500, f2: 900, dur: 0.06, vol: 0.12 }); c.tone({ dt: 0.3, f: 420, f2: 800, dur: 0.06, vol: 0.1 }); },
  cast: (c) => { c.noise({ f: 400, f2: 3000, q: 0.9, dur: 0.28, vol: 0.2, att: 0.12 }); c.tone({ dt: 0.3, f: 1400, f2: 1800, dur: 0.05, vol: 0.12 }); },
  bite: (c) => { c.tone({ f: 880, dur: 0.07, vol: 0.22, type: 'triangle' }); c.tone({ dt: 0.1, f: 880, dur: 0.07, vol: 0.22, type: 'triangle' }); c.tone({ dt: 0.02, f: 300, f2: 500, dur: 0.08, vol: 0.15 }); },
  reel: (c) => { let dt = 0; for (let i = 0; i < 7; i++) { c.tone({ dt, f: 1400, dur: 0.025, vol: 0.16, type: 'square', lp: 2200 }); dt += 0.1 - i * 0.01; } },
  catch: (c) => { c.noise({ f: 900, f2: 2000, dur: 0.2, vol: 0.14 }); arp(c, 'marimba', [72, 76, 79, 84], 0.07, 0.8, 0.3); c.note('bell', 88, 0.35, 1, 0.45); },
  fish_escape: (c) => { c.tone({ f: 900, f2: 250, dur: 0.3, vol: 0.18, lp: 2000 }); c.noise({ dt: 0.1, f: 1200, f2: 600, dur: 0.2, vol: 0.12 }); },
  shop_bell: (c) => { c.note('bell', 96, 0, 1, 0.55); c.note('bell', 100, 0.15, 1.2, 0.5); },
  pop: (c) => { c.tone({ f: 500, f2: 1500, dur: 0.07, vol: 0.3, lp: 4000 }); c.tone({ dt: 0.09, f: 700, f2: 2000, dur: 0.05, vol: 0.18, lp: 4500 }); },
  sparkle: (c) => { [88, 93, 91, 96, 100, 95, 98].forEach((m, i) => c.note(i % 2 ? 'celesta' : 'glock', m, i * 0.05, 0.4, 0.5)); },
  whoosh: (c) => { c.noise({ f: 300, f2: 2500, q: 0.7, dur: 0.25, vol: 0.2, att: 0.12 }); c.noise({ dt: 0.2, f: 2500, f2: 400, q: 0.7, dur: 0.25, vol: 0.18, att: 0.02 }); },
  sleep_jingle: (c) => { [79, 76, 72, 67].forEach((m, i) => c.note('musicbox', m, i * 0.45, 1, 0.7)); c.note('pad', 48, 0, 2.2, 0.5); c.note('pad', 52, 0, 2.2, 0.5); },
  wake_jingle: (c) => { arp(c, 'marimba', [72, 76, 79, 84], 0.12, 0.8, 0.3); arp(c, 'glock', [84, 88], 0.12, 0.4, 0.4); c.note('flute', 84, 0.36, 0.6, 0.7); },
  firework_launch: (c) => { c.tone({ f: 300, f2: 2600, dur: 0.7, vol: 0.12, lp: 4000 }); c.noise({ type: 'highpass', f: 5000, dur: 0.7, vol: 0.05, att: 0.5 }); },
  firework_boom: (c) => { c.noise({ type: 'lowpass', f: 2500, f2: 200, q: 0.5, dur: 0.9, vol: 0.5, att: 0.003 }); c.tone({ f: 100, f2: 38, dur: 0.6, vol: 0.6 }); for (let i = 0; i < 14; i++) c.noise({ dt: 0.2 + i * 0.1 + ((i * 37) % 7) * 0.01, type: 'highpass', f: 4500, dur: 0.02, vol: 0.07 }); },
  lamp_light: (c) => { c.tone({ f: 130, f2: 180, dur: 0.5, vol: 0.35, att: 0.08 }); c.note('bell', 88, 0.1, 1, 0.5); c.note('glock', 100, 0.25, 0.6, 0.3); },
  page_turn: (c) => { c.noise({ f: 3500, f2: 2500, q: 1, dur: 0.14, vol: 0.15, att: 0.03 }); c.noise({ dt: 0.1, f: 3000, dur: 0.06, vol: 0.06 }); },
  knead: (c) => { c.noise({ type: 'lowpass', f: 500, dur: 0.12, vol: 0.2, att: 0.03 }); c.noise({ dt: 0.22, type: 'lowpass', f: 450, dur: 0.12, vol: 0.2, att: 0.03 }); c.tone({ f: 80, dur: 0.1, vol: 0.2 }); },
  oven_ding: (c) => { c.note('bell', 100, 0, 1.4, 0.7); c.tone({ f: 5274, dur: 0.3, vol: 0.03 }); },
  bark: (c) => { for (const [dt, f, v] of [[0, 320, 0.35], [0.19, 280, 0.28]]) { c.tone({ dt, f, f2: f * 0.6, dur: 0.09, type: 'sawtooth', lp: 900, vol: v }); c.noise({ dt, f: 700, q: 1, dur: 0.05, vol: 0.1 }); } },
  meow: (c) => { c.tone({ f: 480, f2: 800, dur: 0.18, type: 'sawtooth', lp: 1500, vol: 0.12, att: 0.03 }); c.tone({ dt: 0.18, f: 800, f2: 520, dur: 0.28, type: 'sawtooth', lp: 1300, vol: 0.12, att: 0.01 }); },
  gull: (c) => { c.tone({ f: 1300, f2: 2300, dur: 0.18, type: 'sawtooth', lp: 3500, vol: 0.1, att: 0.02 }); c.tone({ dt: 0.18, f: 2300, f2: 1500, dur: 0.3, type: 'sawtooth', lp: 3500, vol: 0.1 }); c.tone({ dt: 0.5, f: 1400, f2: 2200, dur: 0.12, type: 'sawtooth', lp: 3500, vol: 0.08 }); c.tone({ dt: 0.62, f: 2200, f2: 1500, dur: 0.2, type: 'sawtooth', lp: 3500, vol: 0.08 }); },
  chirp: (c) => { c.chirp(0, 3400, 0.16, 3); c.chirp(0.4, 3900, 0.13, 2); },
  clock_chime: (c) => { [67, 71, 74, 79].forEach((m, i) => c.note('bell', m, i * 0.55, 2, 0.6)); c.note('bell', 55, 2.3, 3, 0.6); },
  thunder: (c) => { c.noise({ type: 'lowpass', f: 180, f2: 90, q: 0.5, dur: 2.6, vol: 0.6, att: 0.15 }); c.noise({ dt: 0.1, type: 'lowpass', f: 400, f2: 120, q: 0.5, dur: 1.2, vol: 0.3, att: 0.02 }); c.noise({ dt: 0.9, type: 'lowpass', f: 150, f2: 80, q: 0.5, dur: 1.5, vol: 0.25, att: 0.2 }); },
  confirm_big: (c) => { arp(c, 'marimba', [60, 64, 67, 72, 76], 0.06, 0.8, 0.3); [72, 76, 79, 84].forEach((m) => c.note('bell', m, 0.35, 1.2, 0.45)); c.note('pad', 60, 0.3, 0.8, 0.6); },
  // footstep surfaces without a registry id
  step_carpet: (c) => c.noise({ type: 'lowpass', f: 500, dur: 0.08, vol: 0.13, att: 0.015 }),
  step_water: (c) => { c.noise({ f: 500, f2: 1800, dur: 0.14, vol: 0.2, att: 0.01 }); c.tone({ f: 300, f2: 600, dur: 0.08, vol: 0.1 }); },
};
export const SFX_IDS = ['ui_move', 'ui_confirm', 'ui_cancel', 'ui_open', 'ui_close', 'ui_error', 'ui_tab', 'coin', 'buy', 'sell', 'item_get', 'item_get_rare', 'heart_up', 'quest_new', 'quest_done', 'door_open', 'door_close', 'step_grass', 'step_dirt', 'step_stone', 'step_wood', 'step_sand', 'step_snow', 'splash', 'cast', 'bite', 'reel', 'catch', 'fish_escape', 'shop_bell', 'pop', 'sparkle', 'whoosh', 'sleep_jingle', 'wake_jingle', 'firework_launch', 'firework_boom', 'lamp_light', 'page_turn', 'knead', 'oven_ding', 'bark', 'meow', 'gull', 'chirp', 'clock_chime', 'thunder', 'confirm_big'];
/** Loudness trims (measured with the offline analysis) so that every effect lands at a similar perceived level. */
const TRIM = { ui_move: 2.17, ui_confirm: 1.34, ui_cancel: 1.59, ui_open: 0.92, ui_close: 1.09, ui_error: 1.02, ui_tab: 1.23, coin: 0.95, buy: 0.79, sell: 0.8, item_get: 0.53, item_get_rare: 0.57, heart_up: 0.75, quest_new: 0.79, quest_done: 0.8, door_open: 1.65, door_close: 0.94, step_grass: 2.12, step_dirt: 1.07, step_stone: 0.81, step_wood: 0.76, step_sand: 1.03, step_snow: 4.22, splash: 1.85, cast: 1.89, bite: 1.26, reel: 1.15, catch: 0.69, fish_escape: 1.97, shop_bell: 1.12, pop: 1.18, sparkle: 0.79, whoosh: 1.73, sleep_jingle: 1.04, wake_jingle: 0.7, firework_launch: 2.59, firework_boom: 1.03, lamp_light: 0.93, page_turn: 2.15, knead: 2.34, oven_ding: 1.37, bark: 1.37, meow: 2.32, gull: 2.92, chirp: 1.9, clock_chime: 1.19, thunder: 2.7, confirm_big: 0.61, step_carpet: 2.5, step_water: 1.2 };
export function playSfxOn(ctx, out, id, t, rate = 1) {
  const fn = SFX[id];
  if (!fn) return false;
  const g = gain(ctx, TRIM[id] || 1); g.connect(out);
  fn(kit(ctx, g, t, rate));
  return true;
}
/** Approximate sound length (s) for offline rendering. */
export const sfxLength = (id) => ({ clock_chime: 6, thunder: 3.5, firework_boom: 2, sleep_jingle: 3.5, quest_done: 2, item_get_rare: 2.2, confirm_big: 2 }[id] || 1.6);
