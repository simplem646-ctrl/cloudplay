// Sound-effect recipes: pure data interpreted by the engine (src/audio/engine.js). One recipe per id in SFX_IDS.
// Event kinds: tone { at, f0, f1, dur, wave, gain, rand? }   noise { at, dur, gain, lp?, hp?, bp?, sweep? }   bell { at, f, dur, gain }
import { midiToFreq, noteToMidi } from './theory.js';
import { SFX_IDS, AMBIENCE_IDS } from '../data/ids.js';

const F = (n) => midiToFreq(noteToMidi(n));
const tone = (at, f0, f1, dur, wave = 'square', gain = 0.12, o = {}) => ({ k: 'tone', at, f0, f1, dur, wave, gain, ...o });
const noise = (at, dur, gain = 0.1, o = {}) => ({ k: 'noise', at, dur, gain, ...o });
const bell = (at, f, dur, gain = 0.14) => ({ k: 'bell', at, f, dur, gain });
const seq = (notes, step, wave = 'square', gain = 0.12, len = step * 1.4) => notes.map((n, i) => tone(i * step, F(n), F(n), len, wave, gain));

export const SFX = {
  // ui
  confirm: [tone(0, F('E6'), F('E6'), 0.05, 'square', 0.1), tone(0.05, F('A6'), F('A6'), 0.1, 'square', 0.1)],
  cancel: [tone(0, F('A5'), F('A5'), 0.05, 'square', 0.1), tone(0.05, F('E5'), F('E5'), 0.09, 'square', 0.1)],
  cursor: [tone(0, F('C7'), F('C7'), 0.03, 'square', 0.07)],
  blip: [tone(0, 720, 720, 0.035, 'square', 0.06, { rand: 0.22 })],
  blip_low: [tone(0, 380, 380, 0.045, 'square', 0.06, { rand: 0.15 })],
  error: [tone(0, 170, 150, 0.1, 'sawtooth', 0.1), tone(0.11, 150, 120, 0.14, 'sawtooth', 0.1)],
  page: [noise(0, 0.05, 0.07, { bp: 2400 }), tone(0, 1800, 1500, 0.03, 'triangle', 0.04)],
  // world
  step_grass: [noise(0, 0.07, 0.05, { lp: 1500, hp: 350 })],
  step_stone: [tone(0, 430, 300, 0.035, 'square', 0.045), noise(0, 0.035, 0.05, { bp: 3200 })],
  step_wood: [tone(0, 210, 120, 0.07, 'triangle', 0.11), noise(0, 0.04, 0.04, { lp: 1200 })],
  step_sand: [noise(0, 0.1, 0.04, { lp: 900 })],
  door_open: [noise(0, 0.14, 0.09, { bp: 700, sweep: [400, 1300] }), tone(0.02, 220, 340, 0.16, 'sawtooth', 0.04)],
  door_close: [tone(0, 170, 70, 0.11, 'sine', 0.18), noise(0, 0.07, 0.09, { lp: 900 })],
  bell_school: [bell(0, F('G5'), 1.4, 0.16), bell(0.7, F('E5'), 1.6, 0.16), bell(1.4, F('C5'), 2.4, 0.18), bell(2.1, F('G4'), 2.8, 0.18)],
  bell_tower: [bell(0, F('C3'), 4, 0.26), bell(0, F('G3'), 3.4, 0.14), bell(0.02, F('E4'), 2.6, 0.08)],
  coin: [tone(0, F('B5'), F('B5'), 0.06, 'square', 0.1), tone(0.06, F('E6'), F('E6'), 0.22, 'square', 0.1)],
  item: seq(['C6', 'E6', 'G6', 'C7'], 0.07, 'triangle', 0.14),
  heart: [bell(0, F('E6'), 0.6, 0.1), bell(0.09, F('B6'), 0.9, 0.08)],
  heart_big: [...seq(['C6', 'E6', 'G6', 'C7', 'E7'], 0.08, 'triangle', 0.12), bell(0.4, F('G6'), 1.4, 0.1), bell(0.5, F('C7'), 1.6, 0.08)],
  chime: [bell(0, F('A6'), 1.3, 0.1), bell(0.15, F('E6'), 1.5, 0.08)],
  shutter: [noise(0, 0.025, 0.14, { bp: 4000 }), noise(0.07, 0.04, 0.12, { bp: 2500 })],
  swoosh: [noise(0, 0.28, 0.1, { bp: 600, sweep: [400, 3200] })],
  pour: [noise(0, 0.55, 0.06, { bp: 2400, sweep: [1800, 2800] })],
  eat: [noise(0, 0.05, 0.12, { bp: 1800 }), noise(0.11, 0.05, 0.12, { bp: 1500 }), noise(0.22, 0.05, 0.1, { bp: 1900 })],
  sleep: seq(['C6', 'A5', 'F5', 'C5'], 0.28, 'triangle', 0.1, 0.5),
  alarm: [0, 0.2, 0.4, 0.6].map((t) => tone(t, 1800, 1800, 0.1, 'square', 0.07)),
  phone: [0, 0.12, 0.5, 0.62].map((t, i) => tone(t, i % 2 ? 660 : 880, i % 2 ? 660 : 880, 0.1, 'square', 0.07)),
  // activities / mini-games
  success: [...seq(['C5', 'E5', 'G5'], 0.1, 'square', 0.1, 0.12), tone(0.3, F('C6'), F('C6'), 0.5, 'square', 0.1), bell(0.3, F('C6'), 1.2, 0.08)],
  fail: [tone(0, F('A4'), F('A4'), 0.2, 'triangle', 0.14), tone(0.22, F('F4'), F('F4'), 0.2, 'triangle', 0.14), tone(0.44, F('D4'), F('D4'), 0.5, 'triangle', 0.14)],
  exam_start: [bell(0, F('D5'), 1.2, 0.14), tone(0.2, F('A5'), F('A5'), 0.1, 'square', 0.06)],
  correct: [tone(0, F('G5'), F('G5'), 0.07, 'square', 0.1), tone(0.07, F('C6'), F('C6'), 0.18, 'square', 0.1)],
  wrong: [tone(0, F('E4'), F('E4'), 0.12, 'sawtooth', 0.09), tone(0.12, F('D#4'), F('D#4'), 0.22, 'sawtooth', 0.09)],
  whistle: [tone(0, 2400, 2700, 0.18, 'sine', 0.12), tone(0.2, 2700, 2500, 0.3, 'sine', 0.12)],
  kick: [tone(0, 170, 50, 0.14, 'sine', 0.3), noise(0, 0.03, 0.12, { lp: 1500 })],
  hit: [tone(0, 140, 60, 0.12, 'square', 0.14), noise(0, 0.08, 0.14, { bp: 1200 })],
  splash: [noise(0, 0.45, 0.14, { bp: 1500, sweep: [3000, 600] })],
  cheer: [noise(0, 0.9, 0.1, { bp: 1300, sweep: [800, 1700] }), noise(0.3, 0.6, 0.06, { bp: 2200 })],
  clap: [0, 0.07, 0.14, 0.24, 0.32].map((t) => noise(t, 0.04, 0.12, { bp: 2000 })),
  fireworks: [tone(0, 100, 28, 0.55, 'sine', 0.3), noise(0.05, 0.4, 0.14, { lp: 900 }), ...[0.35, 0.45, 0.6, 0.7, 0.85].map((t) => noise(t, 0.05, 0.08, { bp: 5000 }))],
};

// Ambience beds interpreted by the engine: { type: 'noise'|'chirps', ... }
export const AMBIENCE = {
  rain: { type: 'noise', bp: 1700, q: 0.5, hp: 500, gain: 0.3, lfo: [0.17, 0.25] },
  wind: { type: 'noise', lp: 450, gain: 0.3, lfo: [0.09, 0.5], sweep: [250, 650] },
  crowd: { type: 'noise', bp: 750, q: 0.9, gain: 0.2, lfo: [2.4, 0.2] },
  waves: { type: 'noise', lp: 1000, gain: 0.34, lfo: [0.11, 0.75] },
  snow_wind: { type: 'noise', lp: 260, gain: 0.22, lfo: [0.06, 0.4] },
  crickets: { type: 'chirps', f: 4300, rate: [0.12, 0.45], burst: 3, gain: 0.035, wave: 'sine' },
  birds: { type: 'chirps', f: 2600, rate: [1.2, 4.5], burst: 2, gain: 0.05, wave: 'sine', sweep: 1.5 },
};

export const missingSfx = () => SFX_IDS.filter((id) => !SFX[id]);
export const missingAmbience = () => AMBIENCE_IDS.filter((id) => !AMBIENCE[id]);
