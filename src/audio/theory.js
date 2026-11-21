// theory.js - scales, chords and compact melody notation. Pure data/logic, no Web Audio.
export const SCALES = {
  major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11],
  minpent: [0, 3, 5, 7, 10], majpent: [0, 2, 4, 7, 9],
};
const LET = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function pcOf(name) {
  let pc = LET[name[0]];
  if (name[1] === '#') pc += 1; else if (name[1] === 'b') pc -= 1;
  return (pc + 12) % 12;
}
const QUAL = {
  '': [0, 4, 7], m: [0, 3, 7], 7: [0, 4, 7, 10], maj7: [0, 4, 7, 11], m7: [0, 3, 7, 10], dim: [0, 3, 6], sus4: [0, 5, 7], sus2: [0, 2, 7],
  6: [0, 4, 7, 9], m6: [0, 3, 7, 9], add9: [0, 4, 7, 14], 9: [0, 4, 7, 10, 14], maj9: [0, 4, 7, 11, 14], m9: [0, 3, 7, 10, 14],
  '7sus4': [0, 5, 7, 10], aug: [0, 4, 8], m7b5: [0, 3, 6, 10], 5: [0, 7], '7b9': [0, 4, 7, 10, 13], 13: [0, 4, 7, 10, 21], m11: [0, 3, 7, 10, 17],
};
const chordCache = new Map();
/** 'Am7' / 'G/B' -> { sym, root (pc), bass (pc), tones (semitone offsets from root), pcs:Set } */
export function parseChord(sym) {
  if (chordCache.has(sym)) return chordCache.get(sym);
  const m = /^([A-G][b#]?)([^/]*)(?:\/([A-G][b#]?))?$/.exec(sym);
  if (!m || !(m[2] in QUAL)) throw new Error('bad chord ' + sym);
  const root = pcOf(m[1]);
  const tones = QUAL[m[2]];
  const c = { sym, root, bass: m[3] ? pcOf(m[3]) : root, tones, pcs: new Set(tones.map((t) => (root + t) % 12)) };
  if (m[3]) c.pcs.add(c.bass);
  chordCache.set(sym, c);
  return c;
}
/** Close voicing of a chord around `center` midi. */
export function voiceChord(chord, center = 62, maxTones = 4) {
  const out = [];
  const tones = chord.tones.slice(0, maxTones);
  for (const t of tones) {
    let n = 12 * Math.floor(center / 12) + ((chord.root + t) % 12);
    while (n < center - 6) n += 12;
    while (n > center + 8) n -= 12;
    out.push(n);
  }
  return out.sort((a, b) => a - b);
}
export function tonicMidi(key) { const pc = pcOf(key); return pc <= 6 ? 60 + pc : 48 + pc; }
export function degToMidi(c, deg, oct, acc) {
  const idx = deg - 1, n = c.scale.length;
  return c.tonic + c.scale[idx % n] + 12 * (Math.floor(idx / n) + oct) + acc;
}
/** Parse melody text. Bars split by '|'. Token: [#|b]<1-9|r>['|,]*[:dur][!]  (dur sticky; ! = staccato) */
export function parseMelody(str, bar) {
  let dur = 1;
  return str.split('|').map((barStr) => {
    const notes = [];
    let t = 0;
    for (const tok of barStr.trim().split(/\s+/).filter(Boolean)) {
      const m = /^([#b]?)([1-9r])([',]*)(?::([\d.]+))?(!?)$/.exec(tok);
      if (!m) throw new Error('bad melody token "' + tok + '"');
      if (m[4]) dur = parseFloat(m[4]);
      const n = { t, dur, rest: m[2] === 'r', stac: !!m[5] };
      if (!n.rest) {
        n.deg = +m[2];
        n.acc = m[1] === '#' ? 1 : m[1] === 'b' ? -1 : 0;
        n.oct = (m[3].match(/'/g) || []).length - (m[3].match(/,/g) || []).length;
      }
      notes.push(n);
      t += dur;
    }
    notes.total = t;
    return notes;
  });
}
