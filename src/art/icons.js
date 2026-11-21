// 16x16 icon atlas: every name in ICON_NAMES is drawn by code (flat 3-tone fills + auto outline).
// Unknown names draw a '?' box. To add an icon: add an entry to DRAW below (and the name to ICON_NAMES in
// src/data/sheet_layout.js, which is lead-owned).
import { PixelBuffer } from './pixelbuffer.js';
import { C, ramp, mix } from './color.js';
import { ICON_NAMES, ICON_SHEET } from '../data/sheet_layout.js';

const mk = (fn) => () => { const B = new PixelBuffer(16, 16); fn(B); B.outline(); return B; };
const box = (B, x, y, w, h, c) => {
  const r = ramp(c);
  B.rect(x, y, w, h, r.base);
  if (h > 1) B.rect(x, y + h - 1, w, 1, r.shade);
  if (w > 1) B.rect(x + w - 1, y, 1, h, r.shade);
  if (w > 2 && h > 2) { B.rect(x, y, 1, h - 1, r.light); B.rect(x, y, w - 1, 1, r.light); }
};
const ball = (B, cx, cy, rx, ry, c) => {
  const r = ramp(c);
  B.ellipse(cx, cy, rx, ry, r.base, (x, y) => {
    const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
    return dx + dy > 0.7 ? r.shade : dx + dy < -0.8 ? r.light : r.base;
  });
};
const P = (B, pts, c) => pts.forEach(([x, y]) => B.set(x, y, c));
const W = '#ffffff';

// ---- shared designs
const heart = (c, half, empty) => mk((B) => {
  const r = ramp(empty ? '#6a5a78' : c);
  const shape = ['..XX...XX..', '.XXXX.XXXX.', 'XXXXXXXXXXX', 'XXXXXXXXXXX', '.XXXXXXXXX.', '..XXXXXXX..', '...XXXXX...', '....XXX....', '.....X.....'];
  shape.forEach((s, j) => [...s].forEach((ch, i) => {
    if (ch !== 'X') return;
    let col = r.base;
    if (j <= 1 && i < 5) col = r.light; else if (j > 4 || i > 8) col = r.shade;
    if (half && i > 5) col = empty ? r.base : ramp('#6a5a78').base;
    if (empty) col = j % 2 ? r.shade : r.base;
    B.set(i + 2, j + 3, col);
  }));
  if (!empty && !half) { B.set(4, 5, W); B.set(4, 6, W); }
});
const flower = (c, center = '#f2d04a') => mk((B) => {
  box(B, 7, 8, 2, 7, '#4f9a4a'); B.rect(5, 11, 2, 1, '#6cc24a'); B.rect(9, 12, 2, 1, '#6cc24a');
  for (const [x, y] of [[8, 3], [4, 6], [12, 6], [6, 8], [10, 8]].slice(0, 5)) ball(B, x, y, 2.6, 2.6, c);
  ball(B, 8, 6, 2, 2, center);
});
const textbook = (c, mark) => mk((B) => {
  box(B, 3, 2, 10, 13, c); B.rect(3, 2, 2, 13, ramp(c).shade); B.rect(5, 13, 8, 2, '#f6ecd2');
  box(B, 6, 4, 6, 5, '#f6ecd2'); mark(B);
});
const medal = (c) => mk((B) => {
  B.rect(5, 1, 2, 5, '#c0392b'); B.rect(9, 1, 2, 5, '#2f6f9f'); B.rect(7, 4, 2, 2, '#f6ecd2');
  ball(B, 8, 10, 4.5, 4.5, c); const r = ramp(c); B.ring(8, 10, 3.2, 3.2, 0.7, r.light); B.set(8, 10, r.shade); P(B, [[8, 8], [7, 9], [9, 9], [8, 11], [7, 12], [9, 12]], r.shade);
});
const food = (draw) => mk(draw);

const bubble = (sym) => mk((B) => {
  B.ellipse(8, 7, 6.5, 5.5, C(W));
  B.poly([[4, 11], [8, 11], [3, 15]], C(W));
  B.rect(7, 11, 3, 1, C(W));
  sym(B);
});

const DRAW = {
  heart_full: heart('#e8505a'), heart_half: heart('#e8505a', true), heart_empty: heart('#e8505a', false, true),
  coin: mk((B) => { ball(B, 8, 8, 6, 6, '#f2b84b'); B.ring(8, 8, 4.4, 4.4, 0.8, '#c4902a'); B.rect(7, 5, 2, 6, '#c4902a'); B.rect(7, 5, 1, 6, '#ffe48a'); B.set(5, 4, W); B.set(4, 5, W); }),
  energy: mk((B) => { B.poly([[9, 1], [3, 9], [7, 9], [6, 15], [13, 6], [9, 6], [11, 1]], C('#f2d04a')); B.poly([[9, 3], [6, 8], [9, 8], [8, 12], [11, 7], [8, 7]], C('#fff2a0')); }),
  clock: mk((B) => { ball(B, 8, 8, 6.5, 6.5, '#f6ecd2'); B.ring(8, 8, 6.5, 6.5, 0.85, '#7a4f2e'); B.line(8, 8, 8, 4, '#3b2a1f'); B.line(8, 8, 11, 9, '#3b2a1f'); B.set(8, 8, '#b5503c'); P(B, [[8, 3], [8, 13], [3, 8], [13, 8]], '#7a4f2e'); }),
  calendar: mk((B) => { box(B, 2, 3, 12, 12, '#f6ecd2'); B.rect(2, 3, 12, 3, '#d8503f'); B.rect(5, 1, 1, 3, '#7a4f2e'); B.rect(10, 1, 1, 3, '#7a4f2e'); for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) B.set(4 + i * 2 + (i > 1 ? 0 : 0), 8 + j * 3, '#7a6a5a'); B.set(10, 11, '#d8503f'); }),
  book: textbook('#4a78c4', (B) => { B.rect(7, 6, 4, 1, '#4a78c4'); }),
  pencil: mk((B) => { B.line(3, 13, 12, 4, '#f2b84b'); B.line(4, 13, 13, 4, '#f2b84b'); B.line(3, 12, 12, 3, '#e0a030'); B.poly([[2, 14], [4, 14], [2, 12]], C('#f2d8b0')); B.set(2, 14, '#3b2a1f'); B.rect(12, 2, 3, 3, '#e8808a'); }),
  star: mk((B) => { B.poly([[8, 1], [10, 6], [15, 6], [11, 9], [13, 14], [8, 11], [3, 14], [5, 9], [1, 6], [6, 6]], C('#f2d04a')); B.poly([[8, 4], [9, 7], [7, 7]], C('#fff2a0')); }),
  check: mk((B) => { B.line(2, 8, 6, 12, '#3f9a4a'); B.line(3, 8, 6, 11, '#3f9a4a'); B.line(6, 12, 14, 3, '#3f9a4a'); B.line(6, 11, 13, 3, '#6cc24a'); B.line(5, 12, 13, 4, '#3f9a4a'); }),
  cross: mk((B) => { B.line(3, 3, 13, 13, '#d8503f'); B.line(4, 3, 13, 12, '#d8503f'); B.line(13, 3, 3, 13, '#d8503f'); B.line(12, 3, 3, 12, '#d8503f'); }),
  arrow_up: mk((B) => { B.poly([[8, 2], [14, 9], [10, 9], [10, 14], [6, 14], [6, 9], [2, 9]], C('#6cc24a')); B.rect(6, 9, 1, 5, '#a8e88a'); }),
  arrow_down: mk((B) => { B.poly([[8, 14], [14, 7], [10, 7], [10, 2], [6, 2], [6, 7], [2, 7]], C('#d8503f')); B.rect(6, 2, 1, 5, '#f09080'); }),
  arrow_right: mk((B) => { B.poly([[14, 8], [7, 2], [7, 6], [2, 6], [2, 10], [7, 10], [7, 14]], C('#f2b84b')); B.rect(2, 6, 5, 1, '#ffe48a'); }),
  lock: mk((B) => { B.ring(8, 6, 4, 4.4, 0.62, '#9a9aa8'); B.rect(4, 6, 8, 1, '#9a9aa8'); box(B, 3, 7, 10, 8, '#f2b84b'); B.rect(7, 9, 2, 3, '#3b2a1f'); }),
  bell: mk((B) => { B.poly([[8, 2], [11, 4], [12, 9], [14, 12], [2, 12], [4, 9], [5, 4]], C('#f2b84b')); B.rect(5, 4, 2, 7, '#ffe48a'); B.rect(11, 8, 1, 4, '#c4902a'); B.rect(3, 12, 10, 1, '#c4902a'); ball(B, 8, 14, 1.6, 1.4, '#7a4f2e'); B.rect(7, 1, 2, 2, '#c4902a'); }),
  music_note: mk((B) => { B.rect(6, 3, 1, 9, '#3b3a5a'); B.rect(12, 2, 1, 9, '#3b3a5a'); B.rect(6, 2, 7, 2, '#5a5a8a'); ball(B, 5, 12, 2.6, 2, '#5a5a8a'); ball(B, 11, 11, 2.6, 2, '#5a5a8a'); }),
  paw: mk((B) => { ball(B, 8, 11, 4, 3.4, '#a0704a'); for (const [x, y] of [[3, 7], [6, 4], [10, 4], [13, 7]]) ball(B, x, y, 1.8, 2.2, '#a0704a'); }),
  warning: mk((B) => { B.poly([[8, 1], [15, 14], [1, 14]], C('#f2b84b')); B.rect(7, 5, 2, 5, '#3b2a1f'); B.rect(7, 11, 2, 2, '#3b2a1f'); }),
  sun: mk((B) => { for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; B.line(8 + Math.cos(t) * 5.2, 8 + Math.sin(t) * 5.2, 8 + Math.cos(t) * 7.3, 8 + Math.sin(t) * 7.3, '#f2b84b'); } ball(B, 8, 8, 4.4, 4.4, '#f6c84b'); B.set(6, 6, '#fff2a0'); }),
  cloud: mk((B) => { ball(B, 5, 9, 3.4, 3.2, '#f4f4fa'); ball(B, 9, 7, 4.2, 4.2, '#f4f4fa'); ball(B, 12, 10, 3, 2.8, '#f4f4fa'); B.rect(4, 10, 10, 3, '#e0e4f0'); }),
  rain: mk((B) => { ball(B, 5, 5, 3, 2.8, '#c8d0e0'); ball(B, 9, 4, 4, 3.6, '#c8d0e0'); ball(B, 12, 6, 2.6, 2.4, '#c8d0e0'); B.rect(4, 6, 10, 2, '#aab4cc'); for (const [x, y] of [[4, 10], [8, 11], [12, 10], [6, 13]]) { B.line(x, y, x - 1, y + 2, '#4a90c8'); } }),
  storm: mk((B) => { ball(B, 5, 5, 3, 2.8, '#7a8098'); ball(B, 9, 4, 4, 3.6, '#7a8098'); ball(B, 12, 6, 2.6, 2.4, '#7a8098'); B.rect(4, 6, 10, 2, '#5a6078'); B.poly([[9, 8], [5, 13], [8, 13], [7, 15], [12, 10], [9, 10], [10, 8]], C('#f2d04a')); }),
  snow: mk((B) => { for (let a = 0; a < 3; a++) { const t = a * Math.PI / 3; B.line(8 + Math.cos(t) * 6.5, 8 + Math.sin(t) * 6.5, 8 - Math.cos(t) * 6.5, 8 - Math.sin(t) * 6.5, '#bfe0ff'); } ball(B, 8, 8, 1.8, 1.8, '#ffffff'); P(B, [[8, 2], [8, 14], [2, 5], [14, 11], [2, 11], [14, 5]], '#ffffff'); }),
  season_spring: mk((B) => { for (let a = 0; a < 5; a++) { const t = a * Math.PI * 2 / 5 - Math.PI / 2; ball(B, 8 + Math.cos(t) * 3.6, 8 + Math.sin(t) * 3.6, 2.8, 2.8, '#f4b6c8'); } ball(B, 8, 8, 2, 2, '#f2d04a'); }),
  season_summer: mk((B) => { for (let a = 0; a < 8; a++) { const t = a * Math.PI / 4; B.line(8 + Math.cos(t) * 5, 8 + Math.sin(t) * 5, 8 + Math.cos(t) * 7, 8 + Math.sin(t) * 7, '#f2b84b'); } ball(B, 8, 8, 4.2, 4.2, '#f08a4b'); B.set(6, 6, '#ffd890'); }),
  season_autumn: mk((B) => { B.poly([[8, 1], [11, 5], [14, 4], [12, 9], [14, 11], [9, 11], [8, 15], [7, 11], [2, 11], [4, 9], [2, 4], [5, 5]], C('#d8662a')); B.line(8, 5, 8, 14, '#7a3a14'); B.rect(5, 6, 2, 2, '#f08a4b'); }),
  season_winter: mk((B) => { for (let a = 0; a < 3; a++) { const t = a * Math.PI / 3; B.line(8 + Math.cos(t) * 7, 8 + Math.sin(t) * 7, 8 - Math.cos(t) * 7, 8 - Math.sin(t) * 7, '#8fc4f0'); } P(B, [[8, 3], [7, 2], [9, 2], [8, 13], [7, 14], [9, 14]], '#bfe0ff'); ball(B, 8, 8, 1.6, 1.6, '#ffffff'); }),
  moon: mk((B) => { B.ellipse(8, 8, 6, 6, C('#f2e6a0')); B.ellipse(11, 6, 5, 5, C(0)); B.ellipse(8, 8, 6, 6, C('#f2e6a0'), (x, y) => ((x - 11) ** 2 + (y - 6) ** 2 < 28 ? 0 : mix('#f2e6a0', '#c8b870', (x + y) % 5 === 0 ? 0.5 : 0))); }),

  // food
  bread: food((B) => { ball(B, 8, 9, 6.5, 4.5, '#d8a05a'); B.rect(4, 7, 8, 1, '#a8703a'); for (const x of [5, 8, 11]) B.line(x, 5, x - 1, 8, '#a8703a'); B.rect(5, 11, 7, 2, '#b8803a'); B.set(5, 6, '#f4d49a'); }),
  riceball: food((B) => { B.poly([[8, 2], [14, 12], [2, 12]], C('#fbfbf6')); B.rect(3, 12, 10, 2, '#e0e0d4'); box(B, 5, 9, 6, 5, '#26332a'); B.rect(5, 12, 6, 1, '#3a4a3a'); B.set(7, 5, W); }),
  sandwich: food((B) => { B.poly([[2, 12], [14, 12], [14, 6]], C('#e8c47a')); B.poly([[2, 12], [2, 6], [14, 6]], C('#f0d490')); B.rect(2, 8, 12, 1, '#6cc24a'); B.rect(2, 9, 12, 1, '#d8503f'); B.rect(2, 10, 12, 1, '#f2d04a'); B.rect(2, 11, 12, 2, '#e8c47a'); B.rect(2, 5, 12, 2, '#f0d490'); }),
  cookie: food((B) => { ball(B, 8, 8, 6, 6, '#d8a05a'); P(B, [[5, 5], [10, 5], [7, 8], [11, 9], [5, 10], [8, 12]], '#5a3420'); P(B, [[6, 5], [10, 6]], '#7a4a2a'); }),
  cake: food((B) => { box(B, 2, 8, 12, 6, '#f8e0b0'); B.rect(2, 8, 12, 2, '#f4a0b8'); for (const x of [3, 6, 9, 12]) B.rect(x, 10, 1, 2, '#f4a0b8'); B.rect(2, 11, 12, 1, '#e8b078'); B.rect(7, 4, 2, 4, '#f6ecd2'); B.rect(7, 2, 2, 2, '#f2d04a'); ball(B, 4, 6, 1.6, 1.6, '#d8503f'); ball(B, 12, 6, 1.6, 1.6, '#d8503f'); }),
  candy: food((B) => { ball(B, 8, 8, 4, 4, '#e8508a'); B.poly([[1, 4], [5, 7], [5, 9], [1, 12]], C('#f4a0c8')); B.poly([[15, 4], [11, 7], [11, 9], [15, 12]], C('#f4a0c8')); B.line(6, 6, 9, 10, '#ffffff'); }),
  chocolate: food((B) => { box(B, 3, 3, 10, 11, '#6a3a22'); for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) B.rect(4 + i * 4, 4 + j * 3, 3, 2, '#8a5a3a'); B.rect(3, 12, 10, 4, '#d8d8e0'); B.rect(3, 12, 10, 1, '#f8f8ff'); }),
  juice: food((B) => { box(B, 4, 4, 8, 11, '#f08a2a'); B.rect(4, 4, 8, 2, '#f6c04a'); B.rect(5, 3, 1, 1, W); B.rect(9, 1, 1, 5, '#3f9a4a'); B.rect(9, 1, 4, 1, '#3f9a4a'); B.rect(5, 7, 1, 4, '#ffd890'); }),
  soda: food((B) => { box(B, 4, 3, 8, 12, '#d8503f'); B.rect(4, 6, 8, 3, '#f6ecd2'); B.rect(5, 1, 6, 2, '#b8b8c8'); B.rect(5, 14, 6, 1, '#b8b8c8'); B.rect(5, 4, 1, 9, '#f08a80'); }),
  coffee: food((B) => { box(B, 3, 6, 8, 8, '#f6ecd2'); B.rect(4, 6, 6, 2, '#6a3a22'); B.ring(12, 9, 3, 3, 0.6, '#f6ecd2'); B.rect(2, 14, 10, 1, '#d8c8a0'); P(B, [[5, 3], [6, 2], [8, 3], [9, 2]], '#e8e8f0'); }),
  tea: food((B) => { box(B, 3, 6, 8, 8, '#8fd0c0'); B.rect(4, 6, 6, 2, '#b8782a'); B.ring(12, 9, 3, 3, 0.6, '#8fd0c0'); B.rect(2, 14, 10, 1, '#5aa090'); B.line(7, 3, 9, 1, '#e8e8f0'); P(B, [[5, 2], [6, 3]], '#e8e8f0'); B.rect(7, 4, 1, 2, '#c8c8a0'); }),
  bento: food((B) => { box(B, 1, 4, 14, 10, '#7a4f2e'); B.rect(2, 5, 6, 4, '#fbfbf6'); B.rect(8, 5, 6, 4, '#f08a2a'); B.rect(2, 9, 6, 4, '#6cc24a'); B.rect(8, 9, 6, 4, '#f4a0b8'); B.rect(2, 7, 2, 1, '#26332a'); B.set(10, 6, '#f2d04a'); }),
  apple: food((B) => { ball(B, 5.5, 9, 4.4, 5, '#d8402f'); ball(B, 10.5, 9, 4.4, 5, '#d8402f'); B.rect(7, 2, 1, 4, '#6a4a2a'); B.poly([[8, 3], [12, 1], [12, 4]], C('#4f9a4a')); B.set(4, 7, '#ff9080'); }),
  icecream: food((B) => { B.poly([[4, 8], [12, 8], [8, 15]], C('#e0a860')); for (let i = 0; i < 4; i++) B.line(5 + i, 8, 8, 14, '#b8803a'); ball(B, 8, 6, 4.2, 3.4, '#f4a0c8'); ball(B, 6, 4, 2.6, 2.2, '#f8e8f0'); B.set(9, 2, '#d8503f'); }),
  soup: food((B) => { B.ellipse(8, 10, 7, 4.5, C('#f6ecd2')); B.ellipse(8, 8.5, 6, 2.5, C('#e0903a')); B.rect(3, 12, 10, 2, '#d8c8a0'); P(B, [[6, 8], [9, 9], [11, 8]], '#6cc24a'); P(B, [[5, 4], [6, 3], [10, 3], [11, 2]], '#e8e8f0'); }),
  curry: food((B) => { B.ellipse(8, 11, 7, 3.6, C('#f6ecd2')); B.ellipse(5, 9, 4.5, 3, C('#fbfbf6')); B.ellipse(10, 9, 5, 3, C('#b8782a')); P(B, [[9, 8], [11, 9], [8, 10]], '#d8903a'); B.set(10, 8, '#6cc24a'); B.rect(12, 5, 1, 5, '#c0c0d0'); }),
  energy_drink: food((B) => { box(B, 5, 2, 6, 13, '#2f9a8a'); B.rect(5, 2, 6, 2, '#b8b8c8'); B.poly([[9, 5], [6, 9], [8, 9], [7, 13], [10, 8], [8, 8]], C('#f2d04a')); }),
  milk: food((B) => { box(B, 4, 5, 8, 10, '#f6f6fb'); B.poly([[4, 5], [12, 5], [8, 1]], C('#f6f6fb')); B.rect(5, 8, 6, 4, '#4a90c8'); B.rect(7, 9, 2, 2, W); }),

  // gifts
  flower_red: flower('#e0402f'), flower_pink: flower('#f08ab0'), flower_white: flower('#f8f8ff', '#f2b84b'), flower_yellow: flower('#f6d03a', '#c0682a'),
  bouquet: mk((B) => { B.poly([[8, 15], [3, 8], [13, 8]], C('#f6ecd2')); B.line(5, 9, 8, 14, '#d8c8a0'); for (const [x, y, c] of [[5, 5, '#e0402f'], [8, 3, '#f08ab0'], [11, 5, '#f6d03a'], [6, 8, '#f8f8ff'], [10, 8, '#e0402f']]) ball(B, x, y, 2.4, 2.4, c); B.rect(5, 12, 6, 1, '#e8508a'); }),
  plushie: mk((B) => { ball(B, 8, 11, 4.4, 3.8, '#e8b080'); ball(B, 8, 6, 4.2, 3.8, '#e8b080'); ball(B, 4, 3, 1.8, 1.8, '#e8b080'); ball(B, 12, 3, 1.8, 1.8, '#e8b080'); P(B, [[6, 6], [10, 6]], '#2a1a22'); B.set(8, 8, '#e8508a'); ball(B, 8, 8, 1.4, 1, '#f6e0c8'); B.set(8, 8, '#2a1a22'); }),
  ribbon: mk((B) => { B.poly([[8, 7], [1, 3], [1, 11]], C('#e8508a')); B.poly([[8, 7], [15, 3], [15, 11]], C('#d03a78')); box(B, 6, 5, 4, 4, '#f48ab0'); B.rect(5, 9, 2, 5, '#e8508a'); B.rect(9, 9, 2, 5, '#d03a78'); }),
  hairpin: mk((B) => { B.line(3, 12, 12, 3, '#d8b04a'); B.line(4, 13, 13, 4, '#b8903a'); ball(B, 11, 4, 3, 3, '#f4a0c8'); B.set(10, 3, W); }),
  scarf: mk((B) => { box(B, 2, 3, 12, 5, '#d8503f'); for (let i = 0; i < 6; i++) B.rect(2 + i * 2, 4 + (i % 2), 1, 2, '#f6ecd2'); box(B, 3, 8, 4, 6, '#d8503f'); B.rect(3, 13, 4, 1, '#a83a2f'); for (const x of [3, 5]) B.set(x, 14, '#f6ecd2'); }),
  necklace: mk((B) => { B.ring(8, 6, 6, 5.5, 0.85, '#f2b84b'); B.ring(8, 6, 6, 5.5, 0.85, '#f2b84b'); B.ellipse(8, 6, 5, 4, C(0)); B.ring(8, 6, 6, 5.5, 0.82, '#f2b84b'); B.poly([[8, 14], [5, 11], [11, 11]], C('#5ac0e8')); B.set(8, 12, '#d8f4ff'); }),
  perfume: mk((B) => { box(B, 3, 7, 10, 8, '#e8a0d0'); B.rect(5, 9, 6, 3, '#fbe8f4'); B.rect(6, 4, 4, 3, '#b8b8c8'); B.rect(5, 2, 6, 2, '#f2b84b'); B.rect(4, 8, 1, 5, '#f8c8e8'); }),
  keychain: mk((B) => { B.ring(5, 5, 3.4, 3.4, 0.6, '#b8b8c8'); B.line(5, 8, 8, 10, '#b8b8c8'); ball(B, 10, 11, 3.4, 3.4, '#e8508a'); B.set(9, 10, W); }),
  charm: mk((B) => { B.line(8, 1, 8, 4, '#d8503f'); box(B, 4, 4, 8, 10, '#d8503f'); B.rect(5, 5, 6, 8, '#e87060'); B.rect(7, 6, 2, 6, '#f2d04a'); B.rect(6, 8, 4, 1, '#f2d04a'); B.rect(4, 13, 8, 1, '#a83a2f'); }),
  music_box: mk((B) => { box(B, 2, 7, 12, 8, '#8a5a3a'); B.poly([[2, 7], [14, 7], [12, 3], [4, 3]], C('#a87a4a')); B.rect(6, 10, 4, 2, '#f2b84b'); B.set(8, 5, '#f6ecd2'); B.line(7, 4, 9, 4, '#f2d04a'); }),
  sketchbook: textbook('#6aa5a0', (B) => { B.line(7, 8, 10, 5, '#4a90c8'); B.rect(7, 5, 2, 2, '#f08a2a'); }),
  novel: textbook('#8a4a7a', (B) => { B.rect(7, 5, 4, 1, '#8a4a7a'); B.rect(7, 7, 3, 1, '#8a4a7a'); }),
  postcard: mk((B) => { box(B, 1, 4, 14, 9, '#f6ecd2'); B.rect(2, 5, 6, 5, '#8fd0f0'); B.rect(2, 8, 6, 2, '#6cc24a'); B.rect(10, 6, 4, 1, '#7a6a5a'); B.rect(10, 8, 4, 1, '#7a6a5a'); B.rect(12, 5, 2, 2, '#d8503f'); }),
  shell: mk((B) => { B.poly([[8, 14], [2, 6], [5, 2], [8, 3], [11, 2], [14, 6]], C('#f4c8b0')); for (const x of [5, 8, 11]) B.line(8, 13, x, 4, '#d89878'); B.rect(6, 13, 4, 2, '#e8b098'); }),
  paint_set: mk((B) => { box(B, 1, 5, 14, 9, '#a07a4a'); for (const [x, c] of [[3, '#d8503f'], [6, '#f2d04a'], [9, '#4a78c4'], [12, '#4f9a4a']]) ball(B, x, 8, 1.6, 1.6, c); B.line(3, 12, 12, 11, '#3b2a1f'); B.rect(11, 2, 2, 5, '#c0985a'); B.rect(11, 1, 2, 2, '#d8503f'); }),
  headphones: mk((B) => { for (let x = 3; x <= 12; x++) { const y = Math.round(9 - Math.sqrt(Math.max(0, 1 - ((x - 7.5) / 5.5) ** 2)) * 7); B.set(x, y, C('#34313f')); B.set(x, y + 1, C('#34313f')); } B.rect(2, 8, 1, 3, C('#34313f')); B.rect(13, 8, 1, 3, C('#34313f')); box(B, 1, 9, 4, 6, '#d8503f'); box(B, 11, 9, 4, 6, '#d8503f'); }),

  // study & sport
  textbook_math: textbook('#4a78c4', (B) => { B.rect(7, 5, 4, 1, '#4a78c4'); B.rect(8, 4, 1, 4, '#4a78c4'); B.rect(7, 8, 4, 1, '#d8503f'); }),
  textbook_lit: textbook('#c0504a', (B) => { B.rect(7, 5, 4, 1, '#c0504a'); B.rect(7, 7, 3, 1, '#c0504a'); }),
  textbook_sci: textbook('#3f9a6a', (B) => { ball(B, 8, 6, 2, 2, '#3f9a6a'); B.set(10, 5, '#f2d04a'); }),
  textbook_hist: textbook('#a0702a', (B) => { B.rect(7, 5, 4, 3, '#a0702a'); B.rect(8, 4, 2, 1, '#a0702a'); }),
  workbook: textbook('#e0a030', (B) => { B.line(7, 8, 10, 5, '#e0a030'); B.set(7, 5, '#e0a030'); }),
  notebook: mk((B) => { box(B, 3, 2, 10, 13, '#6a8fb5'); B.rect(3, 2, 2, 13, '#4a6f95'); for (let j = 0; j < 5; j++) B.set(3, 3 + j * 2, '#f6ecd2'); box(B, 6, 4, 6, 4, '#f6ecd2'); B.rect(7, 6, 4, 1, '#6a8fb5'); }),
  pen: mk((B) => { B.line(3, 13, 12, 4, '#2f3f77'); B.line(4, 13, 13, 4, '#4a5a9a'); B.line(3, 12, 11, 4, '#2f3f77'); B.poly([[2, 14], [3, 14], [2, 13]], C('#3b2a1f')); B.rect(12, 2, 2, 3, '#b8b8c8'); }),
  calculator: mk((B) => { box(B, 3, 1, 10, 14, '#4a4a5a'); B.rect(4, 2, 8, 4, '#a8d8a0'); for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) B.rect(4 + i * 3, 7 + j * 2, 2, 1, j === 2 && i === 2 ? '#d8503f' : '#d8d8e8'); }),
  flashcards: mk((B) => { box(B, 3, 5, 9, 9, '#8ac0f0'); box(B, 5, 3, 9, 9, '#f6ecd2'); B.rect(7, 6, 5, 1, '#4a78c4'); B.rect(7, 8, 4, 1, '#d8503f'); }),
  sneakers: mk((B) => { B.poly([[2, 5], [7, 5], [8, 9], [14, 10], [14, 13], [2, 13]], C('#f4f4fa')); B.rect(2, 12, 12, 2, '#d8503f'); B.rect(3, 5, 4, 2, '#d8503f'); B.line(5, 8, 7, 9, '#7a7a8a'); B.line(4, 9, 6, 10, '#7a7a8a'); B.rect(2, 13, 12, 1, '#e8e8f0'); }),
  ball_soccer: mk((B) => { ball(B, 8, 8, 6.5, 6.5, '#f6f6fb'); B.poly([[8, 5], [11, 7], [10, 10], [6, 10], [5, 7]], C('#34313f')); P(B, [[8, 2], [3, 5], [13, 5], [4, 12], [12, 12]], '#34313f'); }),
  towel: mk((B) => { box(B, 2, 4, 12, 9, '#6ac0e0'); B.rect(2, 7, 12, 2, '#f6f6fb'); for (const x of [3, 5, 7, 9, 11, 13]) B.set(x, 13, '#4a90b0'); B.rect(2, 4, 12, 1, '#9ae0f4'); }),
  water_bottle: mk((B) => { box(B, 5, 4, 6, 11, '#8ac8f0'); B.rect(6, 1, 4, 3, '#d8503f'); B.rect(5, 8, 6, 3, '#4a90c8'); B.rect(6, 5, 1, 8, '#d8f0ff'); }),
  stopwatch: mk((B) => { ball(B, 8, 9, 6, 6, '#f6ecd2'); B.ring(8, 9, 6, 6, 0.85, '#8a8a9a'); B.rect(7, 1, 2, 2, '#8a8a9a'); B.rect(12, 3, 2, 2, '#8a8a9a'); B.line(8, 9, 10, 6, '#d8503f'); B.set(8, 9, '#3b2a1f'); }),
  medal_gold: medal('#f2b84b'), medal_silver: medal('#c8ccd8'), medal_bronze: medal('#c0803a'),
  trophy: mk((B) => { box(B, 4, 2, 8, 7, '#f2b84b'); B.ring(3, 5, 2.4, 2.4, 0.5, '#f2b84b'); B.ring(13, 5, 2.4, 2.4, 0.5, '#f2b84b'); B.rect(7, 9, 2, 3, '#d8a030'); box(B, 4, 12, 8, 3, '#7a4f2e'); B.rect(5, 3, 1, 4, '#ffe48a'); }),
  baton: mk((B) => { B.line(3, 13, 13, 3, '#d8503f'); B.line(4, 13, 13, 4, '#e86a5a'); B.line(3, 12, 12, 3, '#d8503f'); B.line(8, 8, 9, 7, '#f6f6fb'); B.line(7, 9, 8, 8, '#f6f6fb'); }),

  // misc / key items
  key: mk((B) => { B.ring(5, 5, 3.6, 3.6, 0.5, '#f2b84b'); B.line(7, 7, 13, 13, '#d8a030'); B.line(8, 7, 13, 12, '#f2b84b'); P(B, [[11, 13], [11, 14], [13, 11], [14, 11]], '#d8a030'); }),
  letter: mk((B) => { box(B, 1, 3, 14, 10, '#f6ecd2'); B.line(1, 3, 8, 9, '#c8b890'); B.line(15, 3, 8, 9, '#c8b890'); ball(B, 8, 9, 1.6, 1.6, '#d8503f'); }),
  ticket: mk((B) => { box(B, 1, 4, 14, 8, '#f2a050'); B.rect(10, 4, 1, 8, '#c07020'); B.set(10, 5, C(0)); B.set(10, 7, C(0)); B.set(10, 9, C(0)); B.rect(3, 6, 5, 1, '#fff2d0'); B.rect(3, 8, 4, 1, '#fff2d0'); }),
  photo: mk((B) => { box(B, 2, 2, 12, 13, '#f6f6fb'); B.rect(3, 3, 10, 8, '#8fd0f0'); B.rect(3, 8, 10, 3, '#6cc24a'); ball(B, 10, 5, 1.6, 1.6, '#f2d04a'); B.poly([[3, 11], [6, 7], [9, 11]], C('#5aa04a')); }),
  map: mk((B) => { box(B, 1, 3, 14, 11, '#e8d5a8'); B.rect(5, 3, 1, 11, '#c8b078'); B.rect(10, 3, 1, 11, '#c8b078'); B.line(3, 11, 7, 7, '#d8503f'); B.line(7, 7, 12, 10, '#d8503f'); B.set(12, 10, '#d8503f'); B.rect(2, 4, 2, 2, '#8fd0f0'); }),
  bell_clapper: mk((B) => { B.rect(7, 1, 2, 9, '#6a6a7a'); B.rect(7, 1, 1, 9, '#9a9aaa'); ball(B, 8, 12, 3.4, 3.4, '#7a7a8a'); B.rect(5, 1, 6, 2, '#5a5a6a'); }),
  club_card: mk((B) => { box(B, 1, 3, 14, 10, '#f6ecd2'); B.rect(1, 3, 14, 3, '#4a78c4'); ball(B, 5, 9, 2, 2, '#d8a070'); B.rect(9, 8, 4, 1, '#7a6a5a'); B.rect(9, 10, 3, 1, '#7a6a5a'); B.set(8, 4, '#f2d04a'); }),
  id_card: mk((B) => { box(B, 1, 3, 14, 10, '#f6f6fb'); B.rect(1, 3, 14, 2, '#2f3f77'); box(B, 3, 6, 4, 5, '#d8a070'); B.rect(9, 7, 4, 1, '#7a6a5a'); B.rect(9, 9, 4, 1, '#7a6a5a'); }),
  report_card: mk((B) => { box(B, 3, 1, 10, 14, '#f6ecd2'); B.rect(5, 3, 6, 1, '#7a6a5a'); for (const y of [6, 8, 10]) { B.rect(5, y, 4, 1, '#7a6a5a'); B.set(10, y, '#d8503f'); } B.rect(5, 12, 6, 1, '#4a78c4'); }),
  umbrella: mk((B) => { B.poly([[1, 8], [3, 4], [8, 2], [13, 4], [15, 8]], C('#d8503f')); B.line(5, 8, 5, 5, '#a83a2f'); B.line(8, 8, 8, 3, '#f6ecd2'); B.line(11, 8, 11, 5, '#a83a2f'); B.rect(8, 8, 1, 6, '#7a4f2e'); B.rect(6, 13, 3, 1, '#7a4f2e'); B.set(6, 14, '#7a4f2e'); }),
  camera: mk((B) => { box(B, 1, 5, 14, 9, '#4a4a5a'); B.rect(4, 3, 4, 2, '#4a4a5a'); ball(B, 8, 9, 3.6, 3.6, '#b8c8d8'); ball(B, 8, 9, 2, 2, '#34445a'); B.set(7, 8, W); B.rect(11, 6, 3, 1, '#f2d04a'); }),
  lantern: mk((B) => { B.rect(6, 1, 4, 2, '#5a4a3a'); box(B, 4, 3, 8, 10, '#f2a030'); B.rect(5, 4, 6, 8, '#ffd870'); B.rect(7, 5, 2, 5, '#fff4c0'); B.rect(5, 13, 6, 2, '#5a4a3a'); B.rect(4, 7, 8, 1, '#c07020'); }),
};

// emote bubbles: white bubble + symbol
const EMOTE = {
  heart: (B) => P(B, [[5, 5], [6, 4], [7, 5], [8, 6], [9, 5], [10, 4], [11, 5], [11, 6], [10, 7], [9, 8], [8, 9], [7, 8], [6, 7], [5, 6]], C('#e8505a')) || B.rect(6, 5, 5, 3, C('#e8505a')),
  sweat: (B) => { B.poly([[8, 2], [11, 7], [8, 10], [5, 7]], C('#6ab8f0')); B.set(7, 6, W); },
  note: (B) => { B.rect(10, 3, 1, 7, C('#5a5a8a')); B.ellipse(8.5, 9, 2.4, 1.8, C('#5a5a8a')); B.rect(10, 3, 3, 2, C('#5a5a8a')); },
  anger: (B) => { for (const [x, y] of [[4, 3], [10, 3], [4, 8], [10, 8]]) { B.rect(x, y, 2, 1, C('#d83a3a')); B.rect(x + (x < 8 ? 0 : 1), y, 1, 3, C('#d83a3a')); } B.rect(7, 5, 2, 2, C('#d83a3a')); },
  exclaim: (B) => { B.rect(7, 2, 3, 6, C('#d8503f')); B.rect(7, 9, 3, 2, C('#d8503f')); },
  question: (B) => { P(B, [[6, 3], [7, 2], [8, 2], [9, 2], [10, 3], [10, 4], [10, 5], [9, 6], [8, 7], [8, 8]], C('#4a78c4')); B.rect(8, 10, 2, 2, C('#4a78c4')); B.rect(7, 3, 4, 1, C('#4a78c4')); },
  dots: (B) => { for (const x of [4, 8, 12]) B.rect(x - 1, 6, 2, 2, C('#7a7a8a')); },
  sparkle: (B) => { B.poly([[8, 1], [9, 6], [14, 7], [9, 8], [8, 13], [7, 8], [2, 7], [7, 6]], C('#f2b84b')); },
  zzz: (B) => { B.rect(4, 3, 4, 1, C('#4a78c4')); B.line(7, 4, 4, 7, C('#4a78c4')); B.rect(4, 7, 4, 1, C('#4a78c4')); B.rect(9, 6, 3, 1, C('#4a78c4')); B.line(11, 7, 9, 9, C('#4a78c4')); B.rect(9, 9, 3, 1, C('#4a78c4')); },
};
for (const [k, fn] of Object.entries(EMOTE)) DRAW['emote_' + k] = bubble(fn);

function questionBox() {
  const B = new PixelBuffer(16, 16);
  box(B, 1, 1, 14, 14, '#8a8aa8');
  B.rect(2, 2, 12, 12, C('#34344a'));
  for (const [x, y] of [[6, 4], [7, 3], [8, 3], [9, 4], [9, 5], [8, 6], [7, 7], [7, 8]]) B.set(x, y, C('#f6ecd2'));
  B.rect(7, 10, 2, 2, C('#f6ecd2'));
  return B;
}

export function drawIconBuffer(name) {
  const f = DRAW[name];
  return f ? f() : questionBox();
}

export function buildIconAtlas() {
  const names = {};
  const n = ICON_NAMES.length;
  const rows = Math.ceil(n / ICON_SHEET.cols);
  const sheet = new PixelBuffer(ICON_SHEET.cols * 16, rows * 16);
  ICON_NAMES.forEach((name, i) => {
    names[name] = i;
    sheet.blit(drawIconBuffer(name), (i % ICON_SHEET.cols) * 16, Math.floor(i / ICON_SHEET.cols) * 16);
  });
  return { sheet, names, rows };
}
