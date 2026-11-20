// Song data for Bellhaven Days. Each song: { bpm, parts:[{ v: voice, g: gain, n: note DSL | d: drum DSL, rev?: reverb send 0..1 }] }.
// Parts loop independently over the song length (the longest part); shorter parts must divide it evenly (checked in tests).
// Voices: pulse12 pulse25 pulse50 tri sine pluck bell pad drums. Melodies are hand-written against the listed chords.
import { chord, chordsToDsl, bassFrom, arpFrom, genMelody } from './theory.js';
import { MUSIC_IDS } from '../data/ids.js';

const c4 = (root, q, oct = 3) => ({ midi: chord(root, q, oct), beats: 4 });
const prog = (list, oct = 3) => list.map(([r, q]) => c4(r, q, oct));
const bars = (...b) => b.join(' ');
const drumBars = (pat, n) => pat.repeat(n);

// ---------- title (G major, warm and memorable) ----------
const titleA = prog([['G', 'maj'], ['D', 'maj'], ['E', 'min'], ['C', 'maj'], ['G', 'maj'], ['D', 'maj'], ['C', 'maj'], ['D', 'maj']]);
const titleB = prog([['E', 'min'], ['C', 'maj'], ['G', 'maj'], ['D', 'maj'], ['E', 'min'], ['C', 'maj'], ['D', 'maj'], ['D', 'maj']]);
const titleChords = [...titleA, ...titleB];
const titleMelody = bars(
  'B4:1 D5:1 G5:2', 'F#5:1 A5:1 D5:2', 'E5:1 G5:1 B4:1 E5:1', 'C5:1 E5:1 G5:2',
  'B4:1 D5:1 G5:1 B5:1', 'A5:1.5 F#5:0.5 D5:2', 'E5:1 G5:1 C6:1 B5:1', 'A5:2 F#5:1 D5:1',
  'G5:1.5 E5:0.5 B5:1 G5:1', 'E5:1.5 C5:0.5 G5:2', 'D5:1 G5:1 B5:1 D6:1', 'C6:1.5 A5:0.5 F#5:2',
  'G5:1 B5:1 E6:2', 'D6:1 C6:1 G5:2', 'A5:1 D6:1 F#6:1 A5:1', 'D6:2 A5:1 D5:1');

// ---------- town day (C major, cheerful bounce) ----------
const townA = prog([['C', 'maj'], ['A', 'min'], ['F', 'maj'], ['G', 'maj'], ['C', 'maj'], ['E', 'min'], ['F', 'maj'], ['G', 'maj']]);
const townB = prog([['F', 'maj'], ['G', 'maj'], ['E', 'min'], ['A', 'min'], ['F', 'maj'], ['G', 'maj'], ['C', 'maj'], ['G', 'maj']]);
const townChords = [...townA, ...townB];
const townMelody = bars(
  'E5:1 G5:0.5 E5:0.5 C5:1 E5:1', 'A5:1 G5:0.5 E5:0.5 A5:2', 'A5:1 C6:0.5 A5:0.5 F5:1 A5:1', 'G5:1.5 F5:0.5 D5:1 G5:1',
  'E5:1 G5:0.5 E5:0.5 C6:2', 'B5:1 G5:0.5 B5:0.5 E5:2', 'A5:1 G5:0.5 F5:0.5 E5:1 F5:1', 'D5:1 E5:0.5 F5:0.5 G5:2',
  'C6:1 A5:1 F5:1 A5:1', 'D6:1 B5:1 G5:1 B5:1', 'G5:1 B5:1 E6:2', 'C6:1 B5:0.5 A5:0.5 E5:2',
  'A5:1 C6:1 F6:1 E6:0.5 D6:0.5', 'D6:1 B5:1 G5:2', 'E5:1 G5:1 C6:2', 'D6:1 B5:1 G5:1 D5:1');

// ---------- town night (A minor, sparse and soft) ----------
const nightChords = prog([['A', 'min'], ['F', 'maj'], ['C', 'maj'], ['G', 'maj'], ['A', 'min'], ['F', 'maj'], ['D', 'min'], ['E', 'min']]);
const nightMelody = bars(
  'E5:2 r:1 A5:1', 'C6:3 r:1', 'G5:2 E5:1 r:1', 'D5:2 B4:2',
  'E5:1 r:1 A5:2', 'A5:2 C6:1 A5:1', 'F5:2 D5:2', 'E5:2 B4:1 G#4:1');

// ---------- school (F major, brisk) ----------
const schoolChords = prog([['F', 'maj'], ['D', 'min'], ['A#', 'maj'], ['C', 'maj'], ['F', 'maj'], ['A', 'min'], ['A#', 'maj'], ['C', 'maj']]);
const schoolMelody = bars(
  'A5:1 C6:0.5 A5:0.5 F5:1 A5:1', 'D6:1 C6:0.5 A5:0.5 F5:1 D5:1', 'D6:1 F6:0.5 D6:0.5 A#5:1 D6:1', 'E6:1 D6:0.5 C6:0.5 G5:2',
  'A5:1 C6:0.5 A5:0.5 F6:2', 'E6:1 C6:0.5 E6:0.5 A5:2', 'D6:1 C6:0.5 A#5:0.5 A5:1 A#5:1', 'C6:2 G5:1 E5:1');

// ---------- classroom (D major, calm) ----------
const classChords = prog([['D', 'maj'], ['B', 'min'], ['G', 'maj'], ['A', 'maj'], ['D', 'maj'], ['F#', 'min'], ['G', 'maj'], ['A', 'maj']]);
const classMelody = bars(
  'F#5:2 A5:1 F#5:1', 'D5:2 B4:2', 'B4:1 D5:1 G5:2', 'E5:2 C#5:2',
  'F#5:1 A5:1 D6:2', 'C#6:2 A5:2', 'B5:1 A5:1 G5:1 D5:1', 'E5:3 r:1');

// ---------- cafe (C major seventh jazz, lazy swing) ----------
const cafeChords = [['C', 'maj7'], ['A', 'min7'], ['D', 'min7'], ['G', 'dom7'], ['C', 'maj7'], ['E', 'min7'], ['F', 'maj7'], ['G', 'dom7']].map(([r, q]) => c4(r, q, 3));
const cafeMelody = bars(
  'E5:1.5 G5:0.5 B5:1 G5:1', 'C6:1 B5:0.5 A5:0.5 E5:2', 'F5:1.5 A5:0.5 C6:2', 'B5:1 D6:1 G5:2',
  'E5:1 G5:1 C6:1.5 B5:0.5', 'G5:1.5 E5:0.5 B5:2', 'A5:1 C6:1 E6:1 C6:1', 'D6:1.5 B5:0.5 G5:2');

// ---------- festival (D major, lively) ----------
const festChords = prog([['D', 'maj'], ['G', 'maj'], ['A', 'maj'], ['D', 'maj'], ['B', 'min'], ['G', 'maj'], ['A', 'maj'], ['A', 'maj']]);
const festMelody = bars(
  'F#5:0.5 A5:0.5 D6:1 A5:0.5 F#5:0.5 D5:1', 'G5:0.5 B5:0.5 D6:1 B5:0.5 G5:0.5 B5:1', 'A5:0.5 C#6:0.5 E6:1 C#6:0.5 A5:0.5 E5:1', 'D6:1 A5:1 F#5:1 D5:1',
  'D6:0.5 F#6:0.5 B5:1 D6:0.5 B5:0.5 F#5:1', 'G5:1 B5:1 D6:1 G6:1', 'E6:0.5 C#6:0.5 A5:1 E6:1 C#6:1', 'A5:1 C#6:1 E6:2');

// ---------- romantic (E major, tender) ----------
const romChords = prog([['E', 'maj'], ['C#', 'min'], ['A', 'maj'], ['B', 'maj'], ['E', 'maj'], ['G#', 'min'], ['A', 'maj'], ['B', 'maj']]);
const romMelody = bars(
  'G#5:2 B5:1 G#5:1', 'E5:2 G#5:1 C#6:1', 'A5:1.5 C#6:0.5 E6:2', 'D#6:2 B5:1 F#5:1',
  'G#5:2 B5:1 E6:1', 'D#6:1.5 B5:0.5 G#5:2', 'A5:1 C#6:1 B5:1 A5:1', 'B5:2 F#5:1 D#5:1');

// ---------- sad (A minor, slow) ----------
const sadChords = prog([['A', 'min'], ['F', 'maj'], ['C', 'maj'], ['G', 'maj'], ['A', 'min'], ['D', 'min'], ['E', 'maj'], ['A', 'min']]);
const sadMelody = bars('E5:2 A5:2', 'C6:2 A5:2', 'G5:2 E5:2', 'D5:2 B4:2', 'E5:2 A5:2', 'D6:2 A5:2', 'G#5:2 B5:2', 'A5:4');

// ---------- exam (D minor, tense ostinato) ----------
const examChords = prog([['D', 'min'], ['A#', 'maj'], ['G', 'min'], ['A', 'maj'], ['D', 'min'], ['A#', 'maj'], ['A', 'maj'], ['A', 'maj']]);
const examMelody = bars(
  'A5:2 r:1 A5:1', 'F5:2 D5:2', 'G5:2 r:1 A#5:1', 'C#6:3 r:1',
  'A5:2 D6:1 C6:1', 'A#5:2 F5:2', 'E5:1 A5:1 C#6:1 E6:1', 'A5:4');

// ---------- ending (C major, uplifting) ----------
const endChords = prog([['C', 'maj'], ['G', 'maj'], ['A', 'min'], ['F', 'maj'], ['C', 'maj'], ['G', 'maj'], ['F', 'maj'], ['C', 'maj']]);
const endMelody = bars(
  'E5:1 G5:1 C6:2', 'B5:1 D6:1 G5:2', 'A5:1 C6:1 E6:2', 'F6:1 E6:1 C6:2',
  'G5:1 C6:1 E6:2', 'D6:1 B5:1 G5:2', 'A5:1 C6:1 F6:1 A5:1', 'C6:3 G5:1');

const drum8 = 'k.h.s.h.'; // one bar of 8th-note steps
export const SONGS = {
  title: { bpm: 100, parts: [
    { v: 'pulse25', g: 0.15, n: titleMelody, rev: 0.25 },
    { v: 'pluck', g: 0.1, n: arpFrom(titleChords, [0, 1, 2, 1], 0.5, 12), rev: 0.3 },
    { v: 'tri', g: 0.28, n: bassFrom(titleChords, 'rfof', 1) },
    { v: 'pad', g: 0.07, n: chordsToDsl(titleChords), rev: 0.5 },
    { v: 'drums', g: 0.1, d: drumBars('k.h.s.h.k.h.s.hh', 16) },
  ] },
  town_spring: { bpm: 108, parts: [
    { v: 'pulse25', g: 0.14, n: townMelody, rev: 0.2 },
    { v: 'pluck', g: 0.09, n: arpFrom(townChords, [0, 2, 1, 2], 0.5, 12), rev: 0.3 },
    { v: 'tri', g: 0.26, n: bassFrom(townChords, 'rfrf', 1) },
    { v: 'pad', g: 0.05, n: chordsToDsl(townChords), rev: 0.4 },
    { v: 'drums', g: 0.07, d: drumBars('k.h.s.h.', 16) },
  ] },
  town_night: { bpm: 72, parts: [
    { v: 'bell', g: 0.12, n: nightMelody, rev: 0.6 },
    { v: 'pad', g: 0.09, n: chordsToDsl(nightChords), rev: 0.6 },
    { v: 'sine', g: 0.22, n: bassFrom(nightChords, 'r---', 1) },
    { v: 'pluck', g: 0.05, n: arpFrom(nightChords, [0, 2, 1, 2], 1, 12), rev: 0.5 },
  ] },
  school_day: { bpm: 112, parts: [
    { v: 'pulse50', g: 0.1, n: schoolMelody, rev: 0.15 },
    { v: 'pluck', g: 0.1, n: arpFrom(schoolChords, [0, 1, 2, 1], 0.5, 12), rev: 0.2 },
    { v: 'tri', g: 0.26, n: bassFrom(schoolChords, 'rrfr', 1) },
    { v: 'drums', g: 0.09, d: drumBars('k.h.skh.', 8) },
  ] },
  school_class: { bpm: 84, parts: [
    { v: 'bell', g: 0.1, n: classMelody, rev: 0.5 },
    { v: 'pad', g: 0.08, n: chordsToDsl(classChords), rev: 0.5 },
    { v: 'tri', g: 0.2, n: bassFrom(classChords, 'r-f-', 1) },
    { v: 'pluck', g: 0.06, n: arpFrom(classChords, [0, 1, 2, 1], 1, 12), rev: 0.4 },
  ] },
  cafe: { bpm: 92, parts: [
    { v: 'pluck', g: 0.13, n: cafeMelody, rev: 0.3 },
    { v: 'pad', g: 0.06, n: chordsToDsl(cafeChords), rev: 0.4 },
    { v: 'tri', g: 0.24, n: bassFrom(cafeChords, 'r-f-', 1) },
    { v: 'drums', g: 0.05, d: drumBars('h.h.sh.h', 8) },
  ] },
  festival: { bpm: 128, parts: [
    { v: 'pulse25', g: 0.14, n: festMelody, rev: 0.2 },
    { v: 'pluck', g: 0.1, n: arpFrom(festChords, [0, 1, 2, 1, 0, 1, 2, 1], 0.5, 12), rev: 0.2 },
    { v: 'tri', g: 0.28, n: bassFrom(festChords, 'rfrf', 1) },
    { v: 'pulse12', g: 0.05, n: chordsToDsl(festChords), rev: 0.3 },
    { v: 'drums', g: 0.12, d: drumBars('k.hcs.hck.hcs.hh', 16) },
  ] },
  romantic: { bpm: 76, parts: [
    { v: 'pulse12', g: 0.1, n: romMelody, rev: 0.5 },
    { v: 'pluck', g: 0.08, n: arpFrom(romChords, [0, 1, 2, 1, 2, 1], 0.5, 12), rev: 0.6 },
    { v: 'pad', g: 0.09, n: chordsToDsl(romChords), rev: 0.6 },
    { v: 'sine', g: 0.2, n: bassFrom(romChords, 'r-f-', 1) },
  ] },
  sad: { bpm: 60, parts: [
    { v: 'bell', g: 0.11, n: sadMelody, rev: 0.6 },
    { v: 'pad', g: 0.1, n: chordsToDsl(sadChords), rev: 0.7 },
    { v: 'sine', g: 0.2, n: bassFrom(sadChords, 'r---', 1) },
  ] },
  exam: { bpm: 120, parts: [
    { v: 'pulse25', g: 0.09, n: examMelody, rev: 0.2 },
    { v: 'pluck', g: 0.11, n: arpFrom(examChords, [0, 0, 1, 0, 2, 0, 1, 0], 0.5, 12), rev: 0.2 },
    { v: 'tri', g: 0.26, n: bassFrom(examChords, 'rrrr', 0.5) },
    { v: 'drums', g: 0.08, d: drumBars('hhhhhhhh', 16) },
  ] },
  ending_good: { bpm: 88, parts: [
    { v: 'pulse25', g: 0.13, n: endMelody, rev: 0.4 },
    { v: 'bell', g: 0.08, n: arpFrom(endChords, [0, 1, 2, 1], 1, 12), rev: 0.6 },
    { v: 'pad', g: 0.1, n: chordsToDsl(endChords), rev: 0.6 },
    { v: 'tri', g: 0.24, n: bassFrom(endChords, 'rfof', 1) },
    { v: 'drums', g: 0.06, d: drumBars('k...s...', 8) },
  ] },
  credits: { bpm: 88, parts: [
    { v: 'pulse12', g: 0.1, n: titleMelody, rev: 0.5 },
    { v: 'pluck', g: 0.08, n: arpFrom(titleChords, [0, 1, 2, 1], 1, 12), rev: 0.5 },
    { v: 'pad', g: 0.1, n: chordsToDsl(titleChords), rev: 0.6 },
    { v: 'tri', g: 0.2, n: bassFrom(titleChords, 'r-f-', 1) },
  ] },
};

// Ids without their own song alias to a base song (+ transposition in semitones and a tempo multiplier).
export const ALIASES = {
  town_summer: { base: 'town_spring', transpose: 2, tempo: 1.06 },
  town_autumn: { base: 'town_spring', transpose: -3, tempo: 0.9 },
  town_winter: { base: 'town_night', transpose: 3, tempo: 1.15 },
  home_morning: { base: 'cafe', transpose: 2, tempo: 0.88 },
  library: { base: 'school_class', transpose: -2, tempo: 0.88 },
  sports: { base: 'festival', transpose: 0, tempo: 1.06 },
  rooftop: { base: 'romantic', transpose: -2, tempo: 1.1 },
  observatory: { base: 'town_night', transpose: 5, tempo: 0.95 },
  beach: { base: 'town_spring', transpose: 5, tempo: 0.94 },
  rain: { base: 'school_class', transpose: -4, tempo: 0.8 },
  fireworks: { base: 'festival', transpose: 2, tempo: 1.1 },
  funny: { base: 'cafe', transpose: 3, tempo: 1.3 },
  tense: { base: 'exam', transpose: -2, tempo: 0.9 },
  ending_bittersweet: { base: 'sad', transpose: 3, tempo: 1.1 },
};

/** Resolve a music id to { song, transpose, tempo } or null. Every id in MUSIC_IDS resolves. */
export function resolveSong(id) {
  if (SONGS[id]) return { song: SONGS[id], transpose: 0, tempo: 1 };
  const a = ALIASES[id];
  return a ? { song: SONGS[a.base], transpose: a.transpose, tempo: a.tempo } : null;
}
export const missingTracks = () => MUSIC_IDS.filter((id) => !resolveSong(id));
void genMelody;
