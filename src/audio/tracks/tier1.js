// Tier 1 tracks. Melodies are scale degrees (1-7, ' up an octave, , down, :beats, | bar line, r rest, # b chromatic).
// All music is original. Chords are written as absolute chord names in the track's key.
const J = (...bars) => bars.join(' | ');

const titleA = J("5:1.5 3:.5 5:1 6:1", "5:2 3:1 2:1", "3:1.5 2:.5 1:1 6,:1", "7,:2 5,:1 3,:1", "6:1.5 5:.5 4:1 3:1", "5:1.5 3:.5 5:1 1':1", "2':1.5 1':.5 7:1 6:1", "5:3 r:1");
const titleA2 = J("5:1.5 3:.5 5:1 6:1", "5:2 3:1 2:1", "3:1.5 2:.5 1:1 6,:1", "7,:2 5,:1 3,:1", "6:1.5 5:.5 4:1 3:1", "5:1.5 3:.5 5:1 1':1", "2':1.5 7:.5 5:1 2:1", "1':3 r:1");
const titleB = J("6:2 1':1 6:1", "7:2 5:1 2':1", "3':2 2':1 1':1", "1':1.5 7:.5 6:2", "4:1 6:1 2':2", "7:1.5 6:.5 5:2", "3:1 5:1 1':2", "2':1 7:1 5:2");

export const title = {
  id: 'title', name: 'Lanternbrook Days', tempo: 84, bar: 4, key: 'C', mode: 'major', reverb: 0.3, gain: 0.65,
  form: ['intro', 'A', 'A2', 'B'], loopFrom: 1,
  sections: {
    intro: { chords: 'C G', lead: J("5:1.5 3:.5 5:1 6:1", "5:4"), dyn: 0.9 },
    A: { chords: 'C G Am Em F C Dm7 G', lead: titleA },
    A2: { chords: 'C G Am Em F C G C', lead: titleA2, dyn: 1.05 },
    B: { chords: 'F G Em Am Dm G C G', lead: titleB, dyn: 1.1 },
  },
  parts: [
    { role: 'mel', inst: 'musicbox', oct: 1, vel: 0.8, sec: ['intro'] },
    { role: 'mel', inst: 'flute', oct: 0, vel: 0.85, skip: ['intro'] },
    { role: 'mel', inst: 'glock', oct: 2, vel: 0.28, sec: ['B'] },
    { role: 'chords', inst: 'pad', style: 'sustain', center: 56, vel: 0.65, skip: ['intro'] },
    { role: 'chords', inst: 'pad', style: 'sustain', center: 56, vel: 0.5, sec: ['intro'] },
    { role: 'chords', inst: 'nylon', pat: '0.1.2.1.', center: 60, vel: 0.4, len: 1.2, sec: ['A2', 'B'] },
    { role: 'bass', inst: 'bass', pat: 'R.5.', grid: 1, len: 1.6, vel: 0.7, skip: ['intro'] },
  ],
};

export const home = {
  id: 'home', name: 'Hearth and Slippers', tempo: 66, bar: 4, key: 'Bb', mode: 'major', reverb: 0.28, gain: 0.91,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Bb Gm Eb F Bb Dm Eb F', lead: J("3:1.5 2:.5 1:1 3:1", "3:2 1:1 6,:1", "4:1.5 3:.5 2:1 4:1", "5:3 r:1", "3:1 5:1 1':2", "3:1.5 5:.5 7:1 5:1", "4:2 2:1 4:1", "5:2 4:1 3:1") },
    B: { chords: 'Eb Bb Cm F Eb Bb Cm7 F', lead: J("1':1.5 7:.5 6:1 4:1", "3:2 5:1 3:1", "4:1.5 2:.5 4:1 6:1", "5:2 7:1 5:1", "6:1.5 4:.5 6:1 1':1", "1':1.5 5:.5 3:1 1:1", "4:1 6:1 7:1 2':1", "5:3 r:1"), dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'piano', oct: 1, vel: 0.7 },
    { role: 'chords', inst: 'nylon', pat: '0.1.2.1.', center: 55, vel: 0.45, len: 1.4 },
    { role: 'chords', inst: 'pad', style: 'sustain', center: 54, vel: 0.5 },
    { role: 'bass', inst: 'bass', pat: 'R.5.', grid: 1, len: 1.7, vel: 0.65 },
    { role: 'drums', pat: { w: '.......x' }, vel: 0.35 },
  ],
};

const springA = J("5:.5 3:.5 5:1 1':1.5 5:.5", "6:1 5:.5 3:.5 6:1 3:1", "4:.5 6:.5 1':1 6:.5 5:.5 4:1", "5:1.5 4:.5 5:1 2':1", "5:.5 3:.5 5:1 1':1.5 3':.5", "6:1 3':.5 5':.5 3':1 6:1", "6:.5 1':.5 3':1 2':.5 1':.5 6:1", "5:2 r:.5 5:.5 6:1");
const springB = J("1':1 7:.5 6:.5 4:1 6:1", "7:1.5 5:.5 2':1 7:1", "3:1 5:.5 7:.5 5':1 3':1", "6:1.5 5:.5 3:1 1:1", "4:.5 6:.5 1':.5 6:.5 4':1 1':1", "5':1 7:.5 5:.5 2':1 7:1", "5:.5 3:.5 5:.5 1':.5 3':1 1':1", "2':2 7:1 5:1");
export const town_spring = {
  id: 'town_spring', name: 'Brook Lane Morning', tempo: 108, bar: 4, key: 'G', mode: 'major', reverb: 0.2, gain: 1,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'G Em C D G Em Am D', lead: springA },
    B: { chords: 'C D Bm Em C D G D', lead: springB, dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'marimba', oct: 1, vel: 0.85 },
    { role: 'chords', inst: 'pluck', pat: '.x.x.x.x', tones: 3, center: 62, vel: 0.3, len: 0.3 },
    { role: 'bass', inst: 'upright', pat: 'R.5.R.5.', grid: 0.5, len: 0.4, vel: 0.7 },
    { role: 'drums', pat: { S: 'XoxoXoxo', k: 'x...x...', w: '..x...x.' }, vel: 0.55 },
  ],
};

const nightA = J("5:2 3:1 1:1", "6:1.5 5:.5 3:2", "4:2 6:1 1':1", "7:1.5 5:.5 2:2", "3:2 5:1 7:1", "5:1.5 3:.5 5:1 3:1", "6:2 4:1 3:1", "2:2 1:1 5,:1");
const nightB = J("1':2 7:1 6:1", "5:2 3:1 5:1", "3:2 4:1 3:1", "2:2 4:1 6:1", "6:1.5 4:.5 6:1 1':1", "2':1 7:1 5:2", "3:1.5 5:.5 1':2", "5:3 r:1");
export const night = {
  id: 'night', name: 'Lamplight Hours', tempo: 64, bar: 4, key: 'Eb', mode: 'major', reverb: 0.4, gain: 0.89,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Ebmaj7 Cm7 Abmaj7 Bb Ebmaj7 Gm7 Abmaj7 Bb7sus4', lead: nightA },
    B: { chords: 'Abmaj7 Gm7 Cm7 Fm7 Abmaj7 Bb Ebmaj7 Bb', lead: nightB, dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'piano', oct: 0, vel: 0.7 },
    { role: 'chords', inst: 'strings', style: 'sustain', center: 58, vel: 0.55 },
    { role: 'chords', inst: 'musicbox', pat: '0...2.1.', center: 70, vel: 0.3, len: 1, sec: ['A'] },
    { role: 'chords', inst: 'celesta', pat: '....0.2.', center: 70, vel: 0.3, len: 1, sec: ['B'] },
    { role: 'bass', inst: 'bass', pat: 'R', grid: 4, len: 3.8, vel: 0.6 },
  ],
};

const shopA = J("3:.5 5:.5 1':1 5:.5 3:.5 1:1", "6:1 1':.5 3':.5 1':1 6:1", "4:.5 6:.5 2':1 6:.5 4:.5 2:1", "5:1 7:.5 2':.5 4':1 2':1", "3:.5 5:.5 7:1 5:.5 3:.5 5:1", "6:1.5 5:.5 3:1 #1':1", "2':1 4':.5 2':.5 6:1 4:1", "5:2 7:1 5:1");
const shopB = J("6:.5 1':.5 4':1 1':.5 6:.5 4:1", "7:.5 2':.5 5':1 4':.5 2':.5 7:1", "5':1.5 3':.5 1':1 5:1", "6:1 1':.5 3':.5 6':1 3':1", "4:.5 6:.5 2':1 4':1 6':1", "5':1.5 4':.5 2':1 7:1", "1':1 3':.5 5':.5 3':1 1':1", "2':1.5 7:.5 5:2");
export const shop = {
  id: 'shop', name: 'Pennywhistle Hour', tempo: 120, bar: 4, key: 'C', mode: 'major', swing: 0.12, reverb: 0.18, gain: 1,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'C Am Dm G7 Em A7 Dm G7', lead: shopA },
    B: { chords: 'F G7 C Am Dm G7 C G7', lead: shopB, dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'marimba', oct: 0, vel: 0.85 },
    { role: 'chords', inst: 'pluck', pat: '..x...x.', tones: 3, center: 60, vel: 0.35, len: 0.4 },
    { role: 'bass', inst: 'upright', pat: 'R35w', grid: 1, len: 0.9, vel: 0.75 },
    { role: 'drums', pat: { h: '.x.x.x.x', b: '..x...x.', k: 'x...x...' }, vel: 0.5 },
  ],
};

const romA = J("5:2 3:1 5:1", "6:1.5 5:.5 3:1 1:1", "4:2 6:1 4:1", "5:2 7:1 5:1", "3:1.5 5:.5 1':1 5:1", "2:2 4:1 2:1", "5:1.5 4:.5 3:1 2:1", "1:3 r:1");
const romB = J("6:2 4:1 6:1", "5:1.5 3:.5 5:1 1':1", "2:2 4:1 5:1", "3:2 5:1 3:1", "4:1.5 6:.5 1':1 6:1", "5:2 4:1 5:1", "7:2 5:1 3:1", "1:4");
export const romance = {
  id: 'romance', name: 'Two Lanterns', tempo: 72, bar: 4, key: 'F', mode: 'major', reverb: 0.35, gain: 0.93,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'F Dm Bb C F/A Gm7 C7 F', lead: romA },
    B: { chords: 'Bb F/A Gm Dm Bb C7sus4 C7 F', lead: romB, dyn: 1.08 },
  },
  parts: [
    { role: 'mel', inst: 'piano', oct: 0, vel: 0.75 },
    { role: 'chords', inst: 'strings', style: 'sustain', center: 57, vel: 0.5 },
    { role: 'chords', inst: 'epiano', pat: '0.1.2.1.', center: 58, vel: 0.35, len: 1.2 },
    { role: 'bass', inst: 'bass', pat: 'R.5.', grid: 1, len: 1.7, vel: 0.6 },
  ],
};

const fesA = J("1':1 5:.5 3:.5 5:.5 3:.5 1:1", "4':1 3':.5 4':.5 6':1 4':1", "5':1 3':.5 2':.5 1':1 5:1", "2':1.5 1':.5 7:1 5:1", "1':.5 1':.5 5:1 3:.5 5:.5 1':1", "6':1 5':.5 4':.5 3':.5 4':.5 5':1", "2':1 4:.5 5:.5 7:1 5:1", "1':2 5:.5 3:.5 1:1");
const fesB = J("3':1 6:.5 3':.5 5':1 3':1", "6':1.5 5':.5 3':1 1':1", "2':1 7:.5 2':.5 5':1 2':1", "1':2 5:1 3:1", "4':1 6':.5 5':.5 6':1 4':1", "6':1 5':.5 3':.5 5':1 6':1", "7':1.5 5':.5 2':1 5:1", "5':2 3':1 5:1");
export const festival = {
  id: 'festival', name: 'Lantern Fair Polka', tempo: 132, bar: 4, key: 'G', mode: 'major', reverb: 0.2, gain: 0.95,
  form: ['A', 'B', 'A2'],
  sections: {
    A: { chords: 'G C G D G C D G', lead: fesA },
    B: { chords: 'Em Am D G C Am D G', lead: fesB, dyn: 1.05 },
    A2: { chords: 'G C G D G C D G', lead: fesA, dyn: 1.1 },
  },
  parts: [
    { role: 'mel', inst: 'marimba', oct: 1, vel: 0.85 },
    { role: 'mel', inst: 'reed', oct: 0, vel: 0.5, sec: ['B', 'A2'] },
    { role: 'chords', inst: 'reed', pat: '.x.x.x.x', tones: 3, center: 56, vel: 0.35, len: 0.3 },
    { role: 'bass', inst: 'upright', pat: 'R...5...', grid: 0.5, len: 0.4, vel: 0.75 },
    { role: 'drums', pat: { k: 'x...x...', s: '..x...x.', S: 'XoxoXoxo' }, vel: 0.55 },
  ],
};

const miniA = J("5:.5 5:.5 3:.5 5:.5 1':1 5:1", "7:.5 7:.5 5:.5 7:.5 2':1 7:1", "6:.5 6:.5 3:.5 6:.5 3':1 6:1", "4:.5 4:.5 6:.5 1':.5 6:1 4:1", "1':1 5:.5 1':.5 3':1 1':1", "7:1 5:.5 7:.5 2':1 5':1", "4':1 3':.5 4':.5 6':1 4':1", "5:1.5 7:.5 2':1 7:1");
const miniB = J("4:.5 6:.5 1':.5 6:.5 4':1 1':1", "3':.5 1':.5 5:.5 3:.5 5:1 1':1", "2':1 6:.5 2':.5 4':1 2':1", "5':1.5 3':.5 2':1 7:1", "4':.5 4':.5 6':.5 4':.5 1':1 6:1", "5':.5 3':.5 1':.5 3':.5 5':1 3':1", "7:1 5:1 2':1 7:1", "5:1 7:.5 5:.5 2':2");
export const minigame = {
  id: 'minigame', name: 'Pip\'s Playtime', tempo: 128, bar: 4, key: 'E', mode: 'major', reverb: 0.15, gain: 1,
  form: ['A', 'B', 'A2'],
  sections: {
    A: { chords: 'E B C#m A E B A B', lead: miniA },
    B: { chords: 'A E F#m B A E B B', lead: miniB, dyn: 1.05 },
    A2: { chords: 'E B C#m A E B A B', lead: miniA, dyn: 1.1 },
  },
  parts: [
    { role: 'mel', inst: 'pluck', oct: 0, vel: 0.85 },
    { role: 'chords', inst: 'marimba', pat: '01210121', center: 60, vel: 0.3, len: 0.4, oct: 1 },
    { role: 'bass', inst: 'upright', pat: 'R.R.R.5.', grid: 0.5, len: 0.4, vel: 0.75 },
    { role: 'drums', pat: { k: 'x...x...', h: '.x.x.x.x', s: '..x...x.' }, vel: 0.42 },
  ],
};
