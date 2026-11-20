// Music theory helpers + the compact note DSL used by src/audio/songs.js. Pure data/logic (no WebAudio): unit-testable in Node.
//
// Note DSL (space separated tokens):  C4:1  D#5:0.5  Bb3  r:1 (rest)  [C4,E4,G4]:2 (chord)  C4,E4,G4:2 (also a chord)
//   - `:beats` sets the duration; omitted = the previous token's duration (default 1). `~` after a note ties it into the next note of the same pitch? (not supported: use longer durations).
// Drum DSL: one character per step (default step = 0.5 beat):  k kick  s snare  h hat  o open hat  c clap  . rest (spaces ignored)

import { RNG } from '../core/rng.js';

const SEMI = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export const midiToFreq = (m) => 440 * 2 ** ((m - 69) / 12);

/** 'C#4' -> 61, 'Bb3' -> 58. Throws on garbage. */
export function noteToMidi(name) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(name);
  if (!m) throw new Error(`bad note "${name}"`);
  return SEMI[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
}

/** Parse the note DSL into events + total beats. Event: { t, d, midi: number[] } (empty midi = rest). */
export function parseNotes(str, transpose = 0) {
  const events = [];
  let t = 0, last = 1;
  for (const raw of str.replace(/\|/g, ' ').trim().split(/\s+/)) {
    if (!raw) continue;
    const [head, dur] = raw.split(':');
    const d = dur === undefined ? last : Number(dur);
    if (!Number.isFinite(d) || d <= 0) throw new Error(`bad duration in "${raw}"`);
    last = d;
    let midi = [];
    if (head !== 'r') midi = head.replace(/[\[\]]/g, '').split(',').map((n) => noteToMidi(n) + transpose);
    events.push({ t, d, midi });
    t += d;
  }
  return { events, beats: t };
}

/** Parse the drum DSL -> events { t, d, perc }. */
export function parseDrums(str, step = 0.5) {
  const events = [];
  let t = 0;
  for (const ch of str.replace(/\s+/g, '')) {
    if ('ksohc'.includes(ch)) events.push({ t, d: step, perc: ch });
    t += step;
  }
  return { events, beats: t };
}

// ---- scales and chords ------------------------------------------------------
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  lydian: [0, 2, 4, 6, 7, 9, 11], mixolydian: [0, 2, 4, 5, 7, 9, 10], pentatonic: [0, 2, 4, 7, 9], minorPent: [0, 3, 5, 7, 10],
};
export const CHORDS = { maj: [0, 4, 7], min: [0, 3, 7], dim: [0, 3, 6], sus2: [0, 2, 7], sus4: [0, 5, 7], maj7: [0, 4, 7, 11], min7: [0, 3, 7, 10], dom7: [0, 4, 7, 10], add9: [0, 4, 7, 14] };

/** Chord as MIDI notes: chord('C', 'maj', 3) -> [48, 52, 55]. */
export function chord(root, quality = 'maj', octave = 3) {
  const base = noteToMidi(`${root}${octave}`);
  return CHORDS[quality].map((i) => base + i);
}
export const chordTones = (ch) => ch.map((m) => m % 12);

/** Scale degrees -> MIDI, `degree` may be negative/over 7 (wraps octaves). */
export function scaleNote(tonic, scale, degree, octave = 4) {
  const s = SCALES[scale], n = s.length;
  const oct = Math.floor(degree / n), idx = ((degree % n) + n) % n;
  return noteToMidi(`${tonic}${octave}`) + s[idx] + oct * 12;
}

/**
 * Deterministic constrained melody. chords: [{ midi:[...], beats }]; rhythm: array of beat lengths repeated over each chord.
 * Strong beats (first note of each chord and every 2 beats) land on chord tones; other notes move by step within `scale`.
 * Returns a note-DSL string (so it goes through the same parser as hand-written parts).
 */
export function genMelody({ tonic = 'C', scale = 'major', chords, rhythm = [1, 0.5, 0.5, 1, 1], seed = 1, octave = 5, range = [60, 84], rest = 0.12 }) {
  const rng = new RNG(seed);
  const names = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const toName = (m) => `${names[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;
  const sc = SCALES[scale].map((i) => (noteToMidi(`${tonic}0`) + i) % 12);
  const inScale = (m) => sc.includes(((m % 12) + 12) % 12);
  let prev = noteToMidi(`${tonic}${octave}`);
  const out = [];
  for (const ch of chords) {
    const tones = chordTones(ch.midi);
    let pos = 0, i = 0;
    while (pos < ch.beats - 1e-6) {
      const d = Math.min(rhythm[i % rhythm.length], ch.beats - pos);
      const strong = pos === 0 || Math.abs(pos % 2) < 1e-6;
      if (!strong && rng.chance(rest)) out.push(`r:${d}`);
      else {
        // candidates around prev: step moves, or chord tones on strong beats
        let cands = [];
        for (let m = range[0]; m <= range[1]; m++) {
          if (strong ? tones.includes(m % 12) : inScale(m)) cands.push(m);
        }
        cands = cands.filter((m) => Math.abs(m - prev) <= (strong ? 7 : 4));
        if (!cands.length) cands = [prev];
        // prefer small motion; avoid repeating the same pitch too much
        const weights = cands.map((m) => [m, (m === prev ? 0.6 : 1) / (1 + Math.abs(m - prev) * 0.6)]);
        prev = rng.weighted(weights);
        out.push(`${toName(prev)}:${d}`);
      }
      pos += d; i++;
    }
  }
  return out.join(' ');
}

/** Block chords string for a pad/bass: [{midi, beats}] -> DSL with chords sustained. */
export function chordsToDsl(chords, transform = (m) => m) {
  return chords.map((c) => `[${c.midi.map((m) => midiName(transform(m))).join(',')}]:${c.beats}`).join(' ');
}
const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
export const midiName = (m) => `${NAMES[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`;

/** Root notes of chords as a walking-ish bass line: pattern entries are 'r' (root) or 'f' (fifth) or 'o' (octave) or '-' rest, each `step` beats. */
export function bassFrom(chords, pattern = 'r-f-', step = 1, octaveShift = -12) {
  const out = [];
  for (const c of chords) {
    const root = c.midi[0] + octaveShift;
    const n = Math.round(c.beats / step);
    for (let i = 0; i < n; i++) {
      const p = pattern[i % pattern.length];
      if (p === '-') out.push(`r:${step}`);
      else out.push(`${midiName(p === 'f' ? root + 7 : p === 'o' ? root + 12 : root)}:${step}`);
    }
  }
  return out.join(' ');
}

/** Arpeggio over each chord: pattern of indices into the chord (0..), each `step` beats. */
export function arpFrom(chords, pattern = [0, 1, 2, 1], step = 0.5, octaveShift = 12) {
  const out = [];
  for (const c of chords) {
    const n = Math.round(c.beats / step);
    for (let i = 0; i < n; i++) out.push(`${midiName(c.midi[pattern[i % pattern.length] % c.midi.length] + octaveShift)}:${step}`);
  }
  return out.join(' ');
}
