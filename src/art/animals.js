// Cat sprites (16x16 frames) following ANIMAL_SHEET. Fur options come from appearance.js FUR.
import { PixelBuffer } from './pixelbuffer.js';
import { C, ramp, mix } from './color.js';
import { FUR } from '../data/appearance.js';
import { ANIMAL_SHEET } from '../data/sheet_layout.js';

function palette(fur) {
  const base = fur === 'calico' ? '#f2efe9' : FUR[fur] || FUR.orange_tabby;
  const R = ramp(base);
  return {
    R, stripe: fur === 'orange_tabby' ? ramp(mix(base, '#7a3a14', 0.5)).base : fur === 'gray' ? ramp(mix(base, '#2a2a34', 0.5)).base : fur === 'black' ? mix(base, '#5a5a6a', 0.3) : null,
    belly: fur === 'black' ? R.base : mix(base, '#fff6e8', 0.55), calico: fur === 'calico',
    eye: fur === 'black' ? C('#f2d23a') : C('#5aae5a'), nose: C('#e88a8a'),
  };
}

function patches(B, P, spots) {
  if (!P.calico) return;
  const o = ramp('#e08a3c'), k = ramp('#34303a');
  spots.forEach(([x, y, c], i) => { if (B.opaque(x, y)) B.set(x, y, c === 'o' ? o.base : k.base); });
}

function side(P, step, pose) {
  const B = new PixelBuffer(16, 16);
  const R = P.R;
  const sit = pose === 'sit', loaf = pose === 'loaf', stretch = pose === 'stretch';
  const by = sit ? 8 : loaf ? 11 : stretch ? 10 : 9;
  const bx = stretch ? 9 : 8;
  if (sit) { B.ellipse(9, 10.5, 3.3, 4.2, R.base); B.rect(6, 13, 6, 2, R.base); }
  else if (loaf) { B.ellipse(8, 12, 6, 3, R.base); }
  else B.ellipse(bx, by, stretch ? 5.5 : 5, stretch ? 2.5 : 3, R.base);
  // legs
  const lg = (x, y, h, c = R.base) => { for (let j = 0; j < h; j++) B.set(x, y + j, j === h - 1 ? R.light : c); };
  if (!sit && !loaf) {
    const f = [0, 1, -1][step] || 0;
    if (stretch) { lg(3, 11, 3); lg(4, 12, 2); lg(11, 11, 3); lg(12, 11, 3); }
    else { lg(4 + f, 11, 3); lg(5 - f, 11, 3, R.shade); lg(11 - f, 11, 3); lg(12 + f, 11, 3, R.shade); }
  }
  // head
  const hx = sit ? 4 : stretch ? 2 : 3, hy = sit ? 5 : stretch ? 11 : 6;
  B.ellipse(hx, hy, 3, 2.8, R.base);
  B.set(hx - 2, hy - 3, R.base); B.set(hx - 2, hy - 4, R.base); B.set(hx + 1, hy - 3, R.base); B.set(hx + 1, hy - 4, R.base);
  B.set(hx - 2, hy - 3, mix(R.base, '#e89aa0', 0.5));
  B.set(hx - 3, hy, P.nose); B.set(hx - 1, hy - 1, P.eye); B.set(hx - 1, hy, C('#1a1620'));
  B.set(hx - 2, hy + 1, P.belly);
  // tail
  if (sit) { B.line(12, 14, 14, 12, R.base); B.line(14, 12, 14, 10, R.base); }
  else if (loaf) { B.line(13, 12, 14, 10, R.base); }
  else { B.line(13, by - 1, 14, by - 4, R.base); B.line(14, by - 4, 13, by - 6, R.base); B.set(13, by - 6, R.shade); }
  if (P.stripe) { for (const x of [6, 8, 10]) { if (B.opaque(x, by - 2)) B.set(x, by - 2, P.stripe); if (B.opaque(x, by - 1)) B.set(x, by - 1, P.stripe); } B.set(hx, hy - 2, P.stripe); B.set(hx - 1, hy - 2, P.stripe); }
  patches(B, P, [[7, by - 2, 'k'], [8, by - 2, 'k'], [10, by - 1, 'o'], [3, hy - 1, 'o'], [4, hy - 2, 'o']]);
  for (let x = 5; x <= 11; x++) if (B.opaque(x, by + 2)) B.set(x, by + 2, R.shade);
  B.outline();
  return B;
}

function front(P, step, pose) {
  const B = new PixelBuffer(16, 16);
  const R = P.R;
  const sit = pose === 'sit';
  const hy = sit ? 5 : 6;
  B.ellipse(8, sit ? 11 : 10.5, sit ? 3.4 : 3.6, sit ? 4 : 3.6, R.base);
  B.rect(5, 12, 6, 2, R.base);
  const f = [0, 1, -1][step] || 0;
  if (!sit) { B.rect(5, 12 + (f > 0 ? 0 : 0), 2, 3 - (f > 0 ? 1 : 0), R.base); B.rect(9, 12, 2, 3 - (f < 0 ? 1 : 0), R.base); B.set(5, 14, R.light); B.set(10, 14, R.light); }
  else { B.rect(5, 13, 2, 2, P.belly); B.rect(9, 13, 2, 2, P.belly); }
  B.rect(7, 9, 2, 5, P.belly);
  B.ellipse(8, hy, 4, 3.2, R.base);
  B.set(4, hy - 3, R.base); B.set(4, hy - 4, R.base); B.set(11, hy - 3, R.base); B.set(11, hy - 4, R.base); B.set(5, hy - 3, R.base); B.set(10, hy - 3, R.base);
  B.set(5, hy - 3, mix(R.base, '#e89aa0', 0.4)); B.set(10, hy - 3, mix(R.base, '#e89aa0', 0.4));
  B.set(6, hy - 0, P.eye); B.set(9, hy - 0, P.eye); B.set(6, hy - 1, C('#1a1620')); B.set(9, hy - 1, C('#1a1620'));
  B.set(7, hy + 1, P.nose); B.set(8, hy + 1, P.nose); B.set(7, hy + 2, P.belly); B.set(8, hy + 2, P.belly);
  if (P.stripe) { B.set(7, hy - 3, P.stripe); B.set(8, hy - 3, P.stripe); B.set(7, hy - 2, P.stripe); B.set(8, hy - 2, P.stripe); B.set(4, 10, P.stripe); B.set(11, 10, P.stripe); B.set(4, 12, P.stripe); B.set(11, 12, P.stripe); }
  patches(B, P, [[6, hy - 2, 'o'], [5, hy - 1, 'o'], [10, 11, 'k'], [11, 10, 'k'], [5, 10, 'o']]);
  B.line(12, sit ? 14 : 13, 14, sit ? 12 : 11, R.base);
  B.outline();
  return B;
}

function back(P, step) {
  const B = new PixelBuffer(16, 16);
  const R = P.R;
  B.ellipse(8, 10.5, 3.8, 3.6, R.base);
  B.ellipse(8, 6.5, 3.8, 3, R.base);
  B.set(4, 3, R.base); B.set(4, 4, R.base); B.set(11, 3, R.base); B.set(11, 4, R.base);
  const f = [0, 1, -1][step] || 0;
  B.rect(5, 12, 2, 3 - (f > 0 ? 1 : 0), R.shade); B.rect(9, 12, 2, 3 - (f < 0 ? 1 : 0), R.shade);
  B.line(8, 8, 8, 1, R.base); B.line(9, 8, 9, 2, R.base); B.set(8, 1, R.shade);
  if (P.stripe) for (const y of [9, 11, 13]) { B.set(6, y, P.stripe); B.set(10, y, P.stripe); }
  patches(B, P, [[6, 9, 'k'], [7, 10, 'k'], [10, 12, 'o'], [5, 6, 'o']]);
  B.outline();
  return B;
}

function curled(P) {
  const B = new PixelBuffer(16, 16);
  const R = P.R;
  B.ellipse(8, 11.5, 6, 3.6, R.base);
  B.ellipse(5, 11, 3, 2.6, R.light);
  B.line(11, 14, 6, 14, R.shade); B.line(6, 14, 4, 12, R.base);
  B.set(3, 9, R.base); B.set(3, 8, R.base); B.set(5, 8, R.base);
  B.set(4, 11, C('#1a1620')); B.set(5, 11, C('#1a1620'));
  B.set(2, 12, P.nose);
  if (P.stripe) for (const x of [8, 10, 12]) B.set(x, 9, P.stripe);
  patches(B, P, [[8, 10, 'k'], [9, 10, 'k'], [5, 10, 'o']]);
  B.outline();
  return B;
}

export function buildAnimalSheet(kind, fur = 'orange_tabby') {
  const L = ANIMAL_SHEET;
  const P = palette(fur in FUR ? fur : 'orange_tabby');
  const sheet = new PixelBuffer(L.cols * L.frameW, L.rows * L.frameH);
  const put = (f, c, r) => sheet.blit(f, c * L.frameW, r * L.frameH);
  for (let s = 0; s < 3; s++) {
    put(front(P, s, 'walk'), s, L.dirRow.down);
    put(side(P, s, 'walk'), s, L.dirRow.left);
    put(side(P, s, 'walk').flipH(), s, L.dirRow.right);
    put(back(P, s), s, L.dirRow.up);
  }
  const pc = L.poseCol;
  put(front(P, 0, 'sit'), pc.sit_front, L.poseRow);
  put(side(P, 0, 'sit'), pc.sit_left, L.poseRow);
  put(side(P, 0, 'sit').flipH(), pc.sit_right, L.poseRow);
  put(curled(P), pc.sleep, L.poseRow);
  put(side(P, 0, 'stretch'), pc.stretch, L.poseRow);
  put(side(P, 0, 'loaf'), pc.loaf, L.poseRow);
  return sheet;
}
