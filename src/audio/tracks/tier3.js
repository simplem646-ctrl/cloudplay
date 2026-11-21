// Tier 3 tracks (see tier1.js for notation). `ending` re-uses the title motif (degrees) in D major with a swelling arrangement.
const J = (...bars) => bars.join(' | ');

export const prologue = {
  id: 'prologue', name: 'Once Upon a Lamp', tempo: 66, bar: 4, key: 'D', mode: 'major', reverb: 0.5, gain: 0.93,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Dmaj7 Bm7 Gmaj7 A Dmaj7 F#m7 Gmaj7 A', lead: J("5:2 3:1 5:1", "6:1.5 5:.5 3:1 1:1", "4:2 6:1 1':1", "5:1.5 7:.5 2':2", "3:1 5:1 1':1 2':1", "3:1.5 5:.5 7:1 5:1", "4:2 6:1 5:1", "5:3 r:1") },
    B: { chords: 'Bm7 Gmaj7 Dmaj7 A Bm7 Gmaj7 A Dmaj7', lead: J("6:2 3:1 5:1", "4:1.5 6:.5 1':2", "1':2 5:1 3:1", "5:1.5 7:.5 2':1 7:1", "6:1 1':.5 3':.5 1':1 6:1", "4:1.5 6:.5 1':1 6:1", "5:1 7:1 2':2", "1':4"), dyn: 1.05 },
  },
  parts: [
    { role: 'mel', inst: 'celesta', oct: 0, vel: 0.8 },
    { role: 'chords', inst: 'musicbox', pat: '0.1.2.1.', center: 66, vel: 0.28, len: 1.2, oct: 1 },
    { role: 'chords', inst: 'strings', style: 'sustain', center: 55, vel: 0.55 },
    { role: 'bass', inst: 'bass', pat: 'R', grid: 4, len: 3.8, vel: 0.5 },
  ],
};

export const festival_winter = {
  id: 'festival_winter', name: 'Hearthlight Gathering', tempo: 100, bar: 4, key: 'Bb', mode: 'major', reverb: 0.4, gain: 0.73,
  form: ['A', 'B'],
  sections: {
    A: { chords: 'Bb Eb Bb/D F Gm Eb F Bb', lead: J("5:1.5 3:.5 5:1 1':1", "4:1.5 6:.5 1':1 6:1", "3:1 5:1 1':1 5:1", "5:2 7:1 5:1", "6:1.5 5:.5 3:1 1:1", "4:1 6:1 1':2", "5:1.5 7:.5 2':1 7:1", "1':3 r:1") },
    B: { chords: 'Eb Bb Cm F Dm Gm F Bb', lead: J("6:1 1':.5 3':.5 4':2", "5':1.5 3':.5 1':1 5:1", "2':1 4':1 6':1 4':1", "5':2 3':1 2':1", "3':1.5 5:.5 7:1 5:1", "6:1 3':.5 5':.5 3':1 6:1", "5':1.5 3':.5 2':1 5:1", "1':4"), dyn: 1.1 },
  },
  parts: [
    { role: 'mel', inst: 'celesta', oct: 1, vel: 0.75 },
    { role: 'mel', inst: 'bell', oct: 1, vel: 0.45 },
    { role: 'chords', inst: 'choir', style: 'sustain', center: 56, vel: 0.7 },
    { role: 'chords', inst: 'strings', style: 'sustain', center: 50, vel: 0.35 },
    { role: 'bass', inst: 'bass', pat: 'R.5.', grid: 1, len: 1.5, vel: 0.65 },
    { role: 'drums', pat: { k: 'x...x...', S: 'XoxoXoxo' }, vel: 0.4 },
  ],
};

// Same motif as the title screen, now in D major and growing from solo piano into full choir.
const tA = J("5:1.5 3:.5 5:1 6:1", "5:2 3:1 2:1", "3:1.5 2:.5 1:1 6,:1", "7,:2 5,:1 3,:1", "6:1.5 5:.5 4:1 3:1", "5:1.5 3:.5 5:1 1':1", "2':1.5 1':.5 7:1 6:1", "5:3 r:1");
const tA2 = J("5:1.5 3:.5 5:1 6:1", "5:2 3:1 2:1", "3:1.5 2:.5 1:1 6,:1", "7,:2 5,:1 3,:1", "6:1.5 5:.5 4:1 3:1", "5:1.5 3:.5 5:1 1':1", "2':1.5 7:.5 5:1 2:1", "1':3 r:1");
const tB = J("6:2 1':1 6:1", "7:2 5:1 2':1", "3':2 2':1 1':1", "1':1.5 7:.5 6:2", "4:1 6:1 2':2", "7:1.5 6:.5 5:2", "3:1 5:1 1':2", "2':1 7:1 5:2");
export const ending = {
  id: 'ending', name: 'Lanternbrook Days (Reprise)', tempo: 84, bar: 4, key: 'D', mode: 'major', reverb: 0.4, gain: 0.72,
  form: ['intro', 'A', 'A2', 'B'], loopFrom: 1,
  sections: {
    intro: { chords: 'D A', lead: J("5:1.5 3:.5 5:1 6:1", "5:4"), dyn: 0.75 },
    A: { chords: 'D A Bm F#m G D Em7 A', lead: tA, dyn: 0.85 },
    A2: { chords: 'D A Bm F#m G D A D', lead: tA2, dyn: 1 },
    B: { chords: 'G A F#m Bm Em A D A', lead: tB, dyn: 1.15 },
  },
  parts: [
    { role: 'mel', inst: 'piano', oct: 0, vel: 0.8, sec: ['intro', 'A'] },
    { role: 'mel', inst: 'flute', oct: 0, vel: 0.8, sec: ['A2', 'B'] },
    { role: 'mel', inst: 'celesta', oct: 1, vel: 0.35, sec: ['A2', 'B'] },
    { role: 'mel', inst: 'bell', oct: 1, vel: 0.3, sec: ['B'] },
    { role: 'chords', inst: 'strings', style: 'sustain', center: 56, vel: 0.5, skip: ['intro'] },
    { role: 'chords', inst: 'pad', style: 'sustain', center: 54, vel: 0.5, sec: ['intro'] },
    { role: 'chords', inst: 'choir', style: 'sustain', center: 58, vel: 0.65, sec: ['B'] },
    { role: 'chords', inst: 'nylon', pat: '0.1.2.1.', center: 62, vel: 0.35, len: 1.2, sec: ['A', 'A2'] },
    { role: 'bass', inst: 'bass', pat: 'R.5.', grid: 1, len: 1.6, vel: 0.65, skip: ['intro'] },
    { role: 'drums', pat: { k: 'x...x...', c: 'x.......' }, vel: 0.4, sec: ['B'] },
  ],
};
