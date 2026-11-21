// Tier 2 tracks (see tier1.js for notation).
const J = (...bars) => bars.join(' | ');

export const town_summer = {
  id: 'town_summer', name: 'Sunny Side Street', tempo: 112, bar: 4, key: 'D', mode: 'mixolydian', reverb: 0.2, gain: 0.98,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'D C G D D C G Am', lead: J("3:1 5:.5 1':1 7:.5 5:1", "7:1 5:.5 7:.5 2':1 7:1", "4:1 6:.5 1':.5 6:1 4:1", "5:1.5 3:.5 5:1 1':1", "3:.5 5:.5 1':1 3':.5 1':.5 5:1", "7:1 2':.5 7:.5 5:1 4:1", "4:.5 6:.5 1':1 2':1 1':1", "2':1.5 1':.5 5:2") },
    B: { chords: 'G D Em C G D C D', lead: J("6:1 1':.5 4':.5 6':1 4':1", "3':1 1':.5 5:.5 3:1 5:1", "2':1.5 6:.5 4':1 6:1", "7:1 2':.5 4':.5 2':1 7:1", "4':1 3':.5 4':.5 6':1 4':1", "5':1 3':.5 1':.5 5:1 3:1", "7:1.5 5:.5 4:1 2:1", "5:2 3:1 5:1"), dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'pluck', oct: 1, vel: 0.85 },
    { role: 'mel', inst: 'glock', oct: 2, vel: 0.2, sec: ['B'] },
    { role: 'chords', inst: 'nylon', pat: 'x..x..x.', tones: 3, center: 62, vel: 0.35, len: 0.5 },
    { role: 'bass', inst: 'bass', pat: 'R..5..R.', grid: 0.5, len: 0.5, vel: 0.7 },
    { role: 'drums', pat: { k: 'x...x...', S: 'xoxxxoxx', w: '..x...x.' }, vel: 0.5 },
  ],
};

export const town_autumn = {
  id: 'town_autumn', name: 'Falling Leaves Lane', tempo: 92, bar: 4, key: 'A', mode: 'dorian', reverb: 0.3, gain: 0.64,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Am D Am G Am D G Em', lead: J("5:1.5 3:.5 5:1 1':1", "6:1 5:.5 4:.5 6:1 4:1", "3:1.5 2:.5 1:1 5,:1", "2:1.5 4:.5 7:1 4:1", "5:1 6:.5 5:.5 3:1 5:1", "4:1.5 6:.5 1':1 6:1", "7:1 2':.5 4':.5 2':1 7:1", "5:2 7:1 2:1") },
    B: { chords: 'D G Am Em D G Am Em', lead: J("6:2 4:1 6:1", "7:1.5 2:.5 4:1 2:1", "1':2 5:1 3:1", "5:1.5 7:.5 2':1 7:1", "4':1 6:.5 4':.5 1':1 6:1", "2':1.5 1':.5 7:1 4:1", "3':2 2':1 1':1", "5:3 r:1"), dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'flute', oct: 1, vel: 0.85 },
    { role: 'chords', inst: 'strings', style: 'sustain', center: 55, vel: 0.55 },
    { role: 'chords', inst: 'nylon', pat: '0.1.2.1.', center: 57, vel: 0.35, len: 1.2 },
    { role: 'bass', inst: 'bass', pat: 'R.5.', grid: 1, len: 1.7, vel: 0.65 },
    { role: 'drums', pat: { b: '..x...x.' }, vel: 0.4 },
  ],
};

export const town_winter = {
  id: 'town_winter', name: 'Snowglobe Square', tempo: 76, bar: 4, key: 'F', mode: 'major', reverb: 0.4, gain: 0.88,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Fmaj7 Am7 Bbmaj7 C Dm7 Gm7 C F', lead: J("5:2 3:1 1:1", "3:1.5 5:.5 7:1 5:1", "4:2 6:1 5:1", "5:2 7:1 5:1", "6:1.5 5:.5 3:1 1:1", "2:2 4:1 2:1", "5:1.5 7:.5 2':1 7:1", "1':3 r:1") },
    B: { chords: 'Bb F Gm Dm Bb F C F', lead: J("6:2 4:1 6:1", "5:1.5 3:.5 5:1 1':1", "2:2 4:1 5:1", "3:1.5 5:.5 6:1 5:1", "4:1.5 6:.5 1':1 6:1", "5:1 3:.5 5:.5 1':2", "5:2 7:1 5:1", "1:4"), dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'celesta', oct: 0, vel: 0.85 },
    { role: 'mel', inst: 'bell', oct: 1, vel: 0.22, sec: ['B'] },
    { role: 'chords', inst: 'pad', style: 'sustain', center: 54, vel: 0.6 },
    { role: 'chords', inst: 'glock', pat: '..0...1.', center: 70, vel: 0.22, len: 1 },
    { role: 'bass', inst: 'bass', pat: 'R', grid: 4, len: 3.6, vel: 0.5 },
    { role: 'drums', pat: { S: 'x.......' }, vel: 0.25 },
  ],
};

export const town_rain = {
  id: 'town_rain', name: 'Umbrella Weather', tempo: 72, bar: 4, key: 'Db', mode: 'major', reverb: 0.45, gain: 0.94,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Dbmaj7 Bbm7 Gbmaj7 Ab Dbmaj7 Fm7 Gbmaj7 Ab7sus4', lead: J("5:2 r:2", "6:1 5:1 3:2", "4:2 6:1 r:1", "5:1.5 3:.5 2:2", "3:2 5:1 1':1", "3:1 1:1 6,:2", "4:2 3:1 1:1", "2:2 1:1 5,:1") },
    B: { chords: 'Gbmaj7 Ab Fm7 Bbm7 Gbmaj7 Ab Dbmaj7 Ab', lead: J("6:2 4:1 3:1", "5:2 7:1 5:1", "3:1.5 5:.5 7:2", "6:2 5:1 3:1", "4:1 6:1 1':2", "7:1.5 6:.5 5:2", "3:2 1:1 5,:1", "5:2 r:2"), dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'piano', oct: 0, vel: 0.75 },
    { role: 'chords', inst: 'pad', style: 'sustain', center: 54, vel: 0.5 },
    { role: 'chords', inst: 'glock', pat: '..0...2.', center: 72, vel: 0.25, len: 1 },
    { role: 'bass', inst: 'bass', pat: 'R', grid: 4, len: 3.8, vel: 0.5 },
    { role: 'drums', pat: { w: '....x.x.' }, vel: 0.25 },
  ],
};

export const cafe = {
  id: 'cafe', name: 'Copper Kettle Jazz', tempo: 96, bar: 4, key: 'Ab', mode: 'major', swing: 0.14, reverb: 0.22, gain: 1,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Abmaj7 Fm7 Bbm7 Eb7 Abmaj7 Dbmaj7 Bbm7 Eb7', lead: J("5:1 3:.5 5:.5 1':1.5 7:.5", "6:1 1':.5 6:.5 5:1 3:1", "2:1.5 4:.5 6:1 4:1", "5:1 7:.5 5:.5 4:1 3:1", "3:1 5:.5 7:.5 1':1.5 5:.5", "4:1.5 6:.5 1':1 7:1", "2:1 4:.5 6:.5 1':1 6:1", "5:1.5 4:.5 3:1 2:1") },
    B: { chords: 'Dbmaj7 Cm7 Bbm7 Eb7 Fm7 Bbm7 Eb7 Abmaj7', lead: J("1':1 7:.5 6:.5 4:1 6:1", "5:1.5 3:.5 5:1 7:1", "4:1 6:.5 1':.5 6:1 4:1", "7:1.5 5:.5 2:1 4:1", "6:1 1':.5 3':.5 1':1 6:1", "2:1.5 4:.5 6:1 1':1", "5:1 4:.5 3:.5 2:1 5,:1", "1':3 r:1"), dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'epiano', oct: 1, vel: 0.85 },
    { role: 'chords', inst: 'nylon', pat: '.x...x..', tones: 4, center: 58, vel: 0.3, len: 0.5 },
    { role: 'bass', inst: 'upright', pat: 'R35w', grid: 1, len: 0.9, vel: 0.7 },
    { role: 'drums', pat: { b: 'x.xxx.xx', h: '..x...x.' }, vel: 0.55 },
  ],
};

const harA = J("1:1.5 3:.5 5:.5 3:.5", "1':1.5 6:.5 4:.5 6:.5", "5:1.5 3:.5 1:.5 3:.5", "7:1.5 5:.5 2':.5 7:.5", "1':1.5 5:.5 3:.5 5:.5", "6:1.5 5:.5 3:.5 5:.5", "2:1.5 4:.5 6:.5 4:.5", "7:1.5 5:.5 7:.5 5:.5");
const harB = J("4:1.5 6:.5 1':.5 6:.5", "3':1.5 1':.5 5:.5 1':.5", "6:1.5 4:.5 6:.5 1':.5", "7:1 5:.5 2':1 7:.5", "6:1.5 1':.5 3':.5 1':.5", "4':1.5 2':.5 1':.5 6:.5", "5:1 7:.5 2':1 7:.5", "1':3");
export const harbor = {
  id: 'harbor', name: 'Salt and Rope', tempo: 150, bar: 3, key: 'D', mode: 'major', reverb: 0.25, gain: 0.77,
  form: ['A', 'B', 'A2', 'B'],
  sections: {
    A: { chords: 'D G D A D Bm Em A', lead: harA },
    B: { chords: 'G D G A Bm G A D', lead: harB, dyn: 1.05 },
    A2: { chords: 'D G D A D Bm Em A', lead: harA, dyn: 1.1 },
  },
  parts: [
    { role: 'mel', inst: 'reed', oct: 0, vel: 0.85 },
    { role: 'mel', inst: 'whistle', oct: 1, vel: 0.3, sec: ['A2'] },
    { role: 'chords', inst: 'reed', pat: '.xx.xx', tones: 3, center: 56, vel: 0.28, len: 0.4 },
    { role: 'bass', inst: 'bass', pat: 'R..5..', grid: 0.5, len: 0.7, vel: 0.75 },
    { role: 'drums', pat: { k: 'x..x..', w: '..x..x' }, vel: 0.5 },
  ],
};

export const woods = {
  id: 'woods', name: 'Whispering Trail', tempo: 70, bar: 4, key: 'A', mode: 'minpent', reverb: 0.55, gain: 0.67,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Am Am Fmaj7 Am Am Fmaj7 G Am', lead: J("1:2 3:1 4:1", "4:1 5:1 4:1 2:1", "1:1.5 2:.5 4:2", "3:2 2:1 1:1", "1:1 2:1 4:2", "2:1.5 1:.5 5,:2", "3:1 5:1 3:2", "4:3 r:1") },
    B: { chords: 'Dm Am Fmaj7 G Dm Am G Am', lead: J("3:2 4:1 3:1", "4:1 5:1 4:2", "2:1 1:1 2:2", "5:2 3:1 5:1", "1':2 5:1 3:1", "4:1.5 5:.5 4:2", "3:1 5:1 3:1 2:1", "1:3 r:1"), dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'flute', oct: 1, vel: 0.8 },
    { role: 'mel', inst: 'glock', oct: 2, delay: 0.75, vel: 0.15 },
    { role: 'chords', inst: 'pad', style: 'sustain', center: 50, vel: 0.5 },
    { role: 'bass', inst: 'bass', pat: 'R.5.', grid: 1, len: 1.5, vel: 0.6 },
    { role: 'drums', pat: { o: 'x....o..', t: '..o.....' }, vel: 0.5 },
  ],
};

export const hilltop = {
  id: 'hilltop', name: 'Starview Hill', tempo: 60, bar: 4, key: 'E', mode: 'lydian', reverb: 0.5, gain: 0.77,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Emaj7 F# Emaj7 F# C#m7 B F# Emaj7', lead: J("5:2 3:1 5:1", "2:2 4:1 6:1", "3:1.5 5:.5 7:1 5:1", "4:2 2:1 6:1", "6:1.5 5:.5 3:2", "5:1 7:1 2':2", "2':1.5 6:.5 4:2", "1':3 r:1") },
    B: { chords: 'C#m7 B Emaj7 F# C#m7 B F# B', lead: J("6:2 3:1 5:1", "5:1.5 7:.5 2':2", "3:1 5:1 1':2", "2':1.5 4:.5 6:2", "1':1 7:1 6:2", "5:2 7:1 5:1", "4:1 6:1 2':2", "5:3 r:1"), dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'celesta', oct: 0, vel: 0.8 },
    { role: 'chords', inst: 'glock', pat: '0.1.2.3.', tones: 4, center: 64, vel: 0.28, len: 1.5, oct: 1 },
    { role: 'chords', inst: 'pad', style: 'sustain', center: 52, vel: 0.6 },
    { role: 'chords', inst: 'strings', style: 'sustain', center: 60, vel: 0.3 },
    { role: 'bass', inst: 'bass', pat: 'R', grid: 4, len: 3.9, vel: 0.55 },
  ],
};

export const sad = {
  id: 'sad', name: 'Empty Chair', tempo: 60, bar: 4, key: 'D', mode: 'minor', reverb: 0.4, gain: 0.98,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Dm Bb F C Dm Gm Am Dm', lead: J("5:2 3:1 1:1", "6:1.5 5:.5 4:2", "3:2 5:1 3:1", "2:1.5 4:.5 5:1 4:1", "1':2 7:1 5:1", "6:1.5 5:.5 4:1 2:1", "5:2 7:1 5:1", "1:3 r:1") },
    B: { chords: 'Bb F Gm Dm Bb F C Am', lead: J("6:2 4:1 6:1", "5:2 3:1 5:1", "4:2 6:1 1':1", "1':2 5:1 3:1", "6:1.5 5:.5 6:1 1':1", "5:1 3:1 5:2", "7:2 5:1 4:1", "5:3 r:1"), dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'piano', oct: 0, vel: 0.8 },
    { role: 'chords', inst: 'strings', style: 'sustain', center: 55, vel: 0.55 },
    { role: 'bass', inst: 'bass', pat: 'R', grid: 4, len: 3.8, vel: 0.55 },
  ],
};

const comA = J("1:.5! 1:.5! 3:.5! 5:.5! 1':1! r:1", "4:.5! 4:.5! 6:.5! 1':.5! 6:1! r:1", "5:.5! 3:.5! 1:.5! 3:.5! 5:1! 3:1!", "5:.5! 7:.5! 2':.5! 7:.5! 5':1! r:1", "1':.5! 1':.5! 5:.5! 3:.5! 1:1! 1:1!", "6:.5! 1':.5! 3':.5! 1':.5! 6:1! r:1", "4:.5! 6:.5! 1':.5! 6:.5! 4:1! 6:1!", "5:1! 5:.5! 7:.5! 2':1! r:1");
const comB = J("6:.5! 6:.5! 1':.5! 6:.5! 4':1! r:1", "1':.5! 5:.5! 3:.5! 5:.5! 1':1! r:1", "4':.5! 1':.5! 6:.5! 1':.5! 4':1! 1':1!", "3':.5! 1':.5! 5:.5! 1':.5! 3':1! r:1", "6:.5! 3':.5! 1':.5! 3':.5! 6':1! 3':1!", "4':.5! 6:.5! 1':.5! 6:.5! 4':1! r:1", "5:.5! 7:.5! 2':.5! 7:.5! 5':.5! 2':.5! 5':1!", "5':1! 2':1! 7:1! 5:1!");
export const comedy = {
  id: 'comedy', name: 'Slippery Banana Peel', tempo: 140, bar: 4, key: 'A', mode: 'major', reverb: 0.12, gain: 1,
  form: ['A', 'B', 'A2'],
  sections: {
    A: { chords: 'A D A E A F#m D E', lead: comA },
    B: { chords: 'D A D A F#m D E E', lead: comB, dyn: 1.05 },
    A2: { chords: 'A D A E A F#m D E', lead: comA, dyn: 1.1 },
  },
  parts: [
    { role: 'mel', inst: 'pluck', oct: 1, vel: 0.85 },
    { role: 'mel', inst: 'marimba', oct: 0, vel: 0.35 },
    { role: 'chords', inst: 'marimba', pat: '.x.x.x.x', tones: 3, center: 60, vel: 0.3, len: 0.25 },
    { role: 'bass', inst: 'upright', pat: 'R.R.5.5.', grid: 0.5, len: 0.3, vel: 0.75 },
    { role: 'drums', pat: { k: 'x...x...', w: '..x...x.', h: '.x.x.x.x' }, vel: 0.5 },
  ],
};
