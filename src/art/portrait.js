// 48x48 dialogue portraits: head + shoulders, 8 expressions x (normal | blink | talk).
// Built from the same resolved appearance as the sprites so the two always match.
import { PixelBuffer } from './pixelbuffer.js';
import { C, ramp, mix } from './color.js';
import { PORTRAIT_SHEET } from '../data/sheet_layout.js';
import { EXPRESSIONS } from '../core/constants.js';
import { hashString } from '../core/rng.js';

const S = 48;
const CX = 24;

// ---- per-character face traits (art-only personality table) -------------------------------
const TRAITS = {
  theo: { eyeW: 7, eyeH: 8, brow: 2, lid: 0.0 },
  nina: { eyeW: 8, eyeH: 9, brow: 2, lash: true, mouthW: 6 },
  elise: { eyeW: 8, eyeH: 9, brow: 1, lash: true, soft: true },
  clara: { eyeW: 8, eyeH: 7, brow: 1, lash: true, lid: 0.18, sharp: true },
  mari: { eyeW: 9, eyeH: 9, brow: 2, lash: true },
  vera: { eyeW: 8, eyeH: 7, brow: 1, lash: true, lid: 0.38 },
  jules: { eyeW: 7, eyeH: 8, brow: 1, mouthW: 7 },
  dante: { eyeW: 7, eyeH: 7, brow: 3, lid: 0.12 },
  owen: { eyeW: 6, eyeH: 6, brow: 1, lid: 0.25 },
  bruno: { eyeW: 7, eyeH: 7, brow: 3, jaw: 1 },
  kit: { eyeW: 9, eyeH: 10, brow: 1 },
  ms_delaney: { eyeW: 7, eyeH: 8, brow: 1, lash: true },
  mr_brandt: { eyeW: 6, eyeH: 6, brow: 3, lid: 0.2 },
  dr_fennel: { eyeW: 9, eyeH: 9, brow: 2 },
  coach_mitchell: { eyeW: 7, eyeH: 8, brow: 2, jaw: 1 },
  mr_quill: { eyeW: 7, eyeH: 8, brow: 1, lid: 0.2, soft: true },
  principal_marsh: { eyeW: 7, eyeH: 7, brow: 1, lash: true, lid: 0.1 },
  mr_finch: { eyeW: 6, eyeH: 6, brow: 3, lid: 0.3 },
  rosa: { eyeW: 7, eyeH: 7, brow: 1, soft: true },
};

function traitsFor(ch) {
  const t = TRAITS[ch.id] || {};
  const h = hashString(ch.traitKey);
  const f = ch.gender === 'f';
  return {
    eyeW: t.eyeW || 6 + (h % 3), eyeH: t.eyeH || 7 + ((h >> 3) % 3), brow: t.brow || (f ? 1 : 2),
    lash: t.lash !== undefined ? t.lash : f, lid: t.lid || 0, jaw: t.jaw || 0, mouthW: t.mouthW || 5,
    sharp: !!t.sharp, soft: !!t.soft,
    elder: ch.age === 'elder' || ch.age === 'senior', child: ch.age === 'child',
  };
}

// ---- hair ------------------------------------------------------------------------------------
const tri = (x, p) => Math.abs(((x % p) + p) % p - p / 2) / (p / 2); // 0..1 zigzag

// hairline y(x) for the front cap; sideEnd = how far the side locks hang
const STYLES = {
  bald: null,
  buzz: { hl: () => 15, sideEnd: 20, lockW: 2, cap: 0.92 },
  short: { hl: (x) => 17 + tri(x, 8) * 3, sideEnd: 24, lockW: 3 },
  sidepart: { hl: (x) => 15 + Math.max(0, 30 - x) * 0.55 + (x > 31 ? 2 : 0), sideEnd: 25, lockW: 3 },
  messy: { hl: (x) => 17 + tri(x, 6) * 5, sideEnd: 26, lockW: 3, tufts: [[14, 8], [22, 6], [31, 7], [38, 11]] },
  spiky: { hl: (x) => 17 + tri(x, 5) * 4, sideEnd: 24, lockW: 3, spikes: [[10, 14], [16, 9], [22, 6], [28, 8], [34, 10], [39, 15]] },
  curly: { hl: (x) => 18 + tri(x, 5) * 3, sideEnd: 32, lockW: 5, vol: 1.08, curls: true },
  afro: { hl: (x) => 17 + tri(x, 10) * 2, sideEnd: 34, lockW: 6, vol: 1.3, curls: true },
  bob: { hl: (x) => 19 + tri(x, 24) * 1.5, sideEnd: 35, lockW: 4, back: [8, 14, 40, 36] },
  pixie: { hl: (x) => 16 + Math.max(0, 26 - x) * 0.3 + tri(x, 7) * 2, sideEnd: 27, lockW: 2 },
  long: { hl: (x) => 15 + Math.abs(x - 26) * 0.35, sideEnd: 46, lockW: 4, back: [6, 14, 42, 48] },
  wavy: { hl: (x) => 15 + Math.abs(x - 26) * 0.35, sideEnd: 46, lockW: 5, back: [6, 14, 42, 48], wave: true },
  ponytail: { hl: (x) => 15 + Math.abs(x - 26) * 0.25, sideEnd: 26, lockW: 2, tail: 'r' },
  twintails: { hl: (x) => 17 + tri(x, 8) * 3, sideEnd: 27, lockW: 2, twin: true },
  bun: { hl: (x) => 15 + Math.abs(x - 24) * 0.25, sideEnd: 25, lockW: 2, bun: true },
  braid: { hl: (x) => 16 + tri(x, 8) * 3, sideEnd: 26, lockW: 3, braid: 'l' },
  sidebraid: { hl: (x) => 15 + Math.max(0, 28 - x) * 0.3 + tri(x, 9) * 2, sideEnd: 26, lockW: 3, braid: 'r' },
};

function shadeHair(mask, R, hl) {
  const out = new PixelBuffer(S, S);
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    if (!mask.opaque(x, y)) continue;
    let d = 0;
    while (d < 7 && mask.opaque(x, y - 1 - d)) d++;
    const dn = mask.opaque(x, y + 1) ? (mask.opaque(x, y + 2) ? 2 : 1) : 0;
    let c = R.base;
    const rr = hl && ((x > 26 && x < 31 && y < 34) || (x > 33 && x < 36 && y < 20)) ? hl : R;
    c = rr.base;
    if (d >= 2 && d <= 3 && y < 26 && x > 12 && x < 36 && !(x > 22 && x < 25 && d === 3)) c = rr.light;
    if (dn === 0) c = rr.shade;
    else if (dn === 1 && y > 24) c = rr.shade;
    if (y > 26 && d >= 6 && (x % 5 === 0)) c = rr.shade;
    if (y > 22 && (x < 13 || x > 35) && !mask.opaque(x + (x < 24 ? -1 : 1), y)) c = rr.shade;
    if (d <= 1 && y < 12) c = rr.light === c ? c : (d === 1 && x % 3 === 0 ? rr.light : c);
    out.set(x, y, c);
  }
  return out;
}

function hairMasks(ch) {
  const st = STYLES[ch.hair.style];
  const front = new PixelBuffer(S, S), back = new PixelBuffer(S, S);
  if (!st) return { front, back, st };
  const B = ch.hair.ramp.base;
  const vol = st.vol || 1;
  // front cap
  const rx = 16 * vol, ry = 14.5 * vol;
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) {
    const dx = (x + 0.5 - CX) / rx, dy = (y + 0.5 - (22.5)) / ry;
    if (dx * dx + dy * dy > 1) continue;
    const inCap = y < st.hl(x) - 2.5;
    const lock = y < st.sideEnd && (x < 11 + st.lockW || x > 36 - st.lockW) && y >= 16;
    const lockMid = lock && (Math.abs(x - CX) > 11 - (y > 30 ? 0 : 0));
    if (inCap || lockMid) front.set(x, y, B);
  }
  // spikes / tufts
  for (const [x, h] of st.spikes || []) for (let k = 0; k < h; k++) {
    const w = Math.max(0, 3 - Math.floor(k / 3));
    for (let i = -w; i <= w; i++) front.set(x + i, 14 - k + Math.abs(x - CX) / 5, B);
  }
  for (const [x, h] of st.tufts || []) front.ellipse(x, 10 - h / 3 + Math.abs(x - CX) / 6, 3.2, h / 2.2, B);
  if (st.bun) { front.ellipse(CX, 7, 7, 6, B); }
  if (st.curls) for (let i = 0; i < 9; i++) { const a = Math.PI * (1 + i / 8); front.ellipse(CX + Math.cos(a) * 16 * vol, 22 + Math.sin(a) * 14 * vol + 2, 4.2, 4.2, B); }
  if (st.curls) for (const sx of [-1, 1]) for (let y = 24; y < st.sideEnd; y += 5) front.ellipse(CX + sx * (14.5 * vol), y + 2, 4.5, 4.5, B);
  if (st.braid) {
    const bx = st.braid === 'l' ? 12 : 36;
    for (let k = 0; k < 6; k++) front.ellipse(bx + (k % 2 ? 1 : -1) * 0.5, 30 + k * 3.6, 3.2, 2.4, B);
    front.rect(bx - 3, 24, 6, 6, B);
  }
  // back layer
  if (st.back) { const [x0, y0, x1, y1] = st.back; back.rect(x0, y0, x1 - x0, y1 - y0, B); back.ellipse(CX, y0 + 6, (x1 - x0) / 2, 9, B);
    if (st.wave) for (let y = y0 + 16; y < y1; y += 6) { back.ellipse(x0 + 1, y, 3, 3.5, B); back.ellipse(x1 - 1, y + 3, 3, 3.5, B); } }
  if (st.tail === 'r') { back.poly([[34, 14], [47, 20], [47, 36], [43, 46], [40, 36], [37, 24]], B); }
  if (st.twin) for (const sx of [-1, 1]) back.poly([[CX + sx * 15, 18], [CX + sx * 23, 24], [CX + sx * 23, 40], [CX + sx * 20, 46], [CX + sx * 17, 38], [CX + sx * 14, 26]], B);
  if (['bob'].includes(ch.hair.style)) back.ellipse(CX, 28, 18, 14, B);
  return { front, back, st };
}

// ---- body / shoulders -----------------------------------------------------------------------------
function drawShoulders(ch) {
  const B = new PixelBuffer(S, S);
  const o = ch.outfit, sk = ch.skin;
  const wide = ch.build === 'sturdy' ? 3 : ch.build === 'slim' ? -3 : 0;
  const T = ramp(o.swim === 'trunks' ? ch.skin.base : o.shirt);
  const half = 17 + wide;
  const top = 37;
  const body = (x, y) => Math.abs(x - CX) < half - Math.max(0, (y - top)) * -0.0 - Math.max(0, 3 - (y - top)) * 2.2;
  // neck
  B.rect(CX - 4, 33, 8, 8, sk.base); B.rect(CX - 4, 33, 8, 3, sk.shade);
  for (let y = top; y < S; y++) for (let x = 0; x < S; x++) if (body(x, y)) B.set(x, y, y - top < 2 ? T.light : T.base);
  for (let y = top; y < S; y++) for (let x = 0; x < S; x++) if (B.opaque(x, y) && !B.opaque(x + 1, y) && x > CX) B.set(x, y, T.shade);
  for (let y = top; y < S; y++) B.set(CX + half - 1 - 0, y, T.shade);
  const o2 = o.over;
  const O = o2 ? ramp(o.overColor) : null;
  const vNeck = (c0, c1, depth) => { for (let k = 0; k < depth; k++) for (let x = CX - (5 - k * 0.6); x <= CX + (5 - k * 0.6); x++) B.set(Math.round(x), top + 1 + k, c0); };
  if (o.swim === 'trunks') vNeck(sk.base, 0, 0);
  if (o2 === 'blazer' || o2 === 'suit' || o2 === 'cardigan' || o2 === 'jacket' || o2 === 'trackjacket' || o2 === 'coat' || o2 === 'labcoat') {
    for (let y = top; y < S; y++) for (let x = 0; x < S; x++) if (B.opaque(x, y) && y > top - 1) B.set(x, y, x > CX ? O.shade : O.base);
    for (let y = top; y < S; y++) for (let x = CX - 12; x < CX - 9; x++) if (B.opaque(x, y)) B.set(x, y, O.light);
    const inside = ramp(o.shirt);
    const open = o2 === 'jacket' || o2 === 'trackjacket' || o2 === 'coat' ? 1 : 3 + (o2 === 'cardigan' ? 0 : 1);
    for (let y = top; y < S; y++) { const w = Math.max(open, 6 - Math.floor((y - top) * 0.5)); for (let x = CX - w; x < CX + w; x++) { if (o2 === 'jacket' || o2 === 'trackjacket' || o2 === 'coat') B.set(x, y, x === CX - 1 || x === CX ? O.dark : (x < CX ? O.base : O.shade)); else B.set(x, y, x < CX ? inside.base : inside.shade); } }
    if (o2 === 'blazer' || o2 === 'suit' || o2 === 'labcoat' || o2 === 'cardigan') {
      for (let k = 0; k < 7; k++) { B.set(CX - 6 + k, top - 0 + 0 + Math.floor(k * 0.0), mix(inside.light, '#ffffff', 0.2)); }
      for (let y = top; y < top + 7; y++) { B.set(CX - 6 - Math.floor((y - top) / 3), y, O.dark); B.set(CX + 5 + Math.floor((y - top) / 3), y, O.dark); }
    }
    if (o2 === 'coat') { for (let x = CX - 9; x < CX + 9; x++) { B.set(x, top, '#f4e8d8'); B.set(x, top + 1, mix('#f4e8d8', '#b89a78', 0.4)); } }
  }
  if (o.neck === 'collar' && !o2) { const c = ramp(mix(o.shirt, '#ffffff', 0.5)); for (let k = 0; k < 6; k++) { B.set(CX - 3 - k, top + k, c.light); B.set(CX + 2 + k, top + k, c.shade); B.set(CX - 2 - k, top + k, c.base); B.set(CX + 1 + k, top + k, c.base); } }
  if (o.neck === 'hood') { for (let x = CX - 11; x < CX + 11; x++) { B.set(x, top, T.light); B.set(x, top + 1, T.light); B.set(x, top + 2, T.shade); } B.rect(CX - 5, top + 3, 10, 2, T.shade); B.set(CX - 4, top + 6, '#f4f0ec'); B.set(CX + 3, top + 6, '#f4f0ec'); B.set(CX - 4, top + 7, '#f4f0ec'); B.set(CX + 3, top + 7, '#f4f0ec'); }
  if (o.neck === 'turtle') { B.rect(CX - 6, 33, 12, 6, T.base); for (let x = CX - 6; x < CX + 6; x += 2) B.set(x, 36, T.shade); B.rect(CX - 6, 33, 12, 1, T.light); }
  if (o.neck === 'crew' && !o2) { for (let x = CX - 5; x < CX + 5; x++) B.set(x, top, T.shade); B.rect(CX - 4, top + 1, 8, 1, sk.base); }
  if (o.vest) { const V = ramp(o.vest); B.rect(CX - 3, top + 3, 3, 9, V.base); B.rect(CX, top + 3, 3, 9, V.shade); }
  if (o.apron) { const A = ramp(o.apron); B.rect(CX - 8, top + 4, 16, 9, A.base); B.rect(CX - 8, top + 4, 2, 9, A.light); B.rect(CX + 6, top + 4, 2, 9, A.shade); for (let y = top; y < top + 5; y++) { B.set(CX - 9 + (y - top) * 0.2, y, A.shade); B.set(CX + 8, y, A.shade); } }
  const tie = o.tie;
  if (tie) {
    const A = ramp(tie.color);
    if (tie.kind === 'tie') { B.rect(CX - 1, top + 3, 3, 3, A.base); B.rect(CX - 1, top + 6, 3, 8, A.base); B.rect(CX + 1, top + 6, 1, 8, A.shade); B.set(CX, top + 14, A.dark); }
    else if (tie.kind === 'ribbon') { B.poly([[CX, top + 4], [CX - 8, top + 1], [CX - 8, top + 8]], A.base); B.poly([[CX, top + 4], [CX + 8, top + 1], [CX + 8, top + 8]], A.shade); B.rect(CX - 1, top + 3, 3, 3, A.light); B.rect(CX - 2, top + 6, 2, 5, A.base); B.rect(CX, top + 6, 2, 5, A.shade); }
    else if (tie.kind === 'brooch') { B.ellipse(CX + 7, top + 7, 2, 2, A.base); B.set(CX + 6, top + 6, A.light); }
    else if (tie.kind === 'pearls') for (let k = 0; k < 7; k++) B.ellipse(CX - 6 + k * 2, top + 2 + (3 - Math.abs(k - 3)) * 1.1 + 1, 1.2, 1.2, '#fff8ee');
  }
  if (o.scarf) { const Sc = ramp(o.scarf); for (let x = CX - 9; x < CX + 9; x++) for (let y = top - 3; y < top + 3; y++) { if (Math.abs(x - CX) < 9 - Math.max(0, 2 - (y - top + 3))) B.set(x, y, (x + y) % 6 < 2 ? Sc.light : Sc.base); } B.rect(CX - 9, top + 3, 5, 8, Sc.base); B.rect(CX - 5, top + 3, 1, 8, Sc.shade); for (let x = CX - 9; x < CX - 4; x += 2) B.set(x, top + 10, Sc.dark); }
  if (o.stripe && !o2) B.rect(CX - 17, top + 6, 34, 2, ramp(o.stripe).base);
  if (ch.acc.has('scarf') && !o.scarf) { /* handled via outfit.scarf */ }
  if (ch.acc.has('whistle')) { B.line(CX - 5, top, CX, top + 7, '#e8e8e8'); B.line(CX + 5, top, CX, top + 7, '#e8e8e8'); B.rect(CX - 2, top + 7, 5, 3, '#f2c24a'); B.set(CX - 2, top + 7, '#ffe48a'); }
  if (ch.acc.has('badge')) { B.ellipse(CX + 9, top + 8, 2.4, 2.4, '#f2c24a'); B.set(CX + 8, top + 7, '#fff0a0'); }
  if (ch.acc.has('bag')) { for (let k = 0; k < 14; k++) B.rect(CX - 14 + k * 1.6, top + k * 0.8, 3, 2, '#9a6a3a'); }
  B.outline();
  return B;
}

// ---- face ---------------------------------------------------------------------------------------
function faceWidth(y, rx, jaw) {
  const cy = 24, ry = 14.5;
  const t = (y - cy) / ry;
  if (t < -1 || t > 1) return 0;
  const k = t > 0 ? 1 - (0.28 - jaw * 0.08) * t * t : 1;
  return rx * Math.sqrt(1 - t * t) * k + (t > 0.6 ? -t * 1.5 : 0);
}

function drawSkin(H, ch, T) {
  const sk = ch.skin;
  const rx = 13 + (T.child ? 1 : 0) + T.jaw * 1;
  for (let y = 9; y < 39; y++) {
    const w = faceWidth(y + 0.5, rx, T.jaw);
    for (let x = Math.ceil(CX - w); x < CX + w; x++) {
      let c = sk.base;
      if (y > 33 || (x > CX + w - 2.2 && y > 22)) c = sk.shade;
      else if (x < CX - w + 2 && y > 20 && y < 32) c = sk.light;
      H.set(x, y, c);
    }
  }
  // ears
  for (const sx of [-1, 1]) { H.ellipse(CX + sx * (rx + 0.6), 27, 2.2, 3.2, sk.base); H.set(CX + sx * (rx + 0.6), 27, sk.shade); }
  return rx;
}

const INK = C('#2a1a22');

function eyeDraw(H, ch, T, cx, cy, side, expr, closed) {
  const E = ch.eyes, sk = ch.skin;
  const hw = T.eyeW / 2, hh = T.eyeH / 2;
  const hairDark = ch.hair.ramp.dark;
  const lineC = mix(ch.hair.ramp.base, INK, 0.65);
  const lashes = (x0, y0, dir) => { if (T.lash) { H.set(x0 + dir, y0 - 1, lineC); H.set(x0 + dir * 2, y0 - 2, lineC); } };
  const inner = -side; // direction toward nose
  if (closed) {
    const happy = expr === 'happy' || expr === 'smug';
    for (let x = -hw; x <= hw; x++) {
      const t = x / hw;
      const y = happy ? cy - 1 - Math.round((1 - t * t) * 2.6) + 2 : cy + Math.round((1 - t * t) * 1.6) - 1;
      H.set(Math.round(cx + x), Math.round(y), lineC); H.set(Math.round(cx + x), Math.round(y) + (happy ? 0 : 0), lineC);
      if (!happy) H.set(Math.round(cx + x), Math.round(y) - 1, lineC);
    }
    lashes(cx + side * hw, Math.round(cy), side);
    return;
  }
  let ir = 3.1 * (T.eyeW >= 8 ? 1.1 : 1), irY = 3.7;
  let gx = 0, gy = 0, hhh = hh, hww = hw;
  if (expr === 'surprised') { hhh += 1; hww += 0.5; ir = 2.1; irY = 2.5; }
  if (expr === 'shy') { gx = -1.2; gy = 1.6; }
  if (expr === 'thinking') { gx = 1.8; gy = -1.6; }
  if (expr === 'sad') { gy = 1; }
  if (expr === 'smug') { gx = side * 0.5; }
  H.ellipse(cx, cy, hww, hhh, C('#fdfbff'));
  H.ellipse(cx, cy + 0.4, hww, hhh, C('#fdfbff'), (x, y) => (y > cy + hhh - 1.5 ? C('#e6e6f2') : C('#fdfbff')));
  // iris with vertical gradient
  H.ellipse(cx + gx, cy + gy + 0.5, ir, Math.min(irY, hhh), E.base, (x, y) => (y < cy + gy - 1 ? E.dark : y > cy + gy + 1.8 ? E.light : E.base));
  H.ellipse(cx + gx, cy + gy + 0.5, ir * 0.5, Math.min(irY, hhh) * 0.5, E.dark);
  // highlights
  const hx = Math.round(cx + gx - 1.6), hy = Math.round(cy + gy - 2.2);
  H.rect(hx, hy, 2, 2, C('#ffffff')); H.set(Math.round(cx + gx + 1.5), Math.round(cy + gy + 2), C('#ffffffcc'));
  // eye outline: clip with skin above (lid) and thick upper line
  const top = cy - hhh;
  let lidSlope = 0, lidFlat = T.lid;
  if (expr === 'angry') lidSlope = 3.2; if (expr === 'sad') lidSlope = -2.6; if (expr === 'smug') lidFlat = 0.42; if (expr === 'shy') lidFlat = Math.max(lidFlat, 0.12);
  for (let x = -Math.ceil(hww) - 1; x <= Math.ceil(hww) + 1; x++) {
    const t = (x * inner + hww) / (2 * hww); // 0 at outer, 1 at inner
    let yl = top + (T.sharp ? -0.4 : 0) + lidFlat * 2 * hhh + lidSlope * (lidSlope > 0 ? t : (1 - t));
    const arc = (1 - Math.pow(Math.abs(x) / (hww + 1), 2)) * 1.4;
    yl -= arc * 0.0;
    for (let y = Math.floor(top - 2); y < yl; y++) { if (H.opaque(Math.round(cx + x), y)) H.set(Math.round(cx + x), y, sk.base); }
    H.set(Math.round(cx + x), Math.round(yl), lineC); H.set(Math.round(cx + x), Math.round(yl) - 1, lineC);
    if (T.sharp || T.brow >= 3) H.set(Math.round(cx + x), Math.round(yl) + 1, mix(lineC, sk.base, 0.5));
  }
  // lower lid hint
  for (let x = -1; x <= 1; x++) H.set(Math.round(cx + x), Math.round(cy + hhh + 0.6), mix(sk.base, sk.shade, 0.7));
  lashes(cx + side * (hww + 0.5), Math.round(top + lidFlat * 2 * hhh + (lidSlope < 0 ? -lidSlope : 0)), side);
  if (expr === 'sad') { H.ellipse(cx + inner * 1, cy + hhh + 2.4, 1, 1.6, C('#bfe6ff')); H.set(Math.round(cx + inner * 1) , Math.round(cy + hhh + 1.6), C('#ffffff')); }
}

function browDraw(H, ch, T, cx, cy, side, expr) {
  const c = mix(ch.hair.ramp.base, INK, 0.2);
  let yo = -(T.eyeH / 2) - 4, tilt = 0, curve = 0.6, hi = 0;
  if (expr === 'happy') { yo -= 1; curve = 1.4; }
  if (expr === 'sad') tilt = -2.2; // inner end up
  if (expr === 'angry') { tilt = 2.8; yo += 1; }
  if (expr === 'surprised') { yo -= 3; curve = 1.4; }
  if (expr === 'shy') { tilt = -1.2; yo += 0; }
  if (expr === 'thinking') { if (side > 0) { yo -= 3; curve = 1.3; } else yo += 1; }
  if (expr === 'smug') { if (side < 0) { yo -= 3; curve = 1.3; } else { yo += 1; tilt = 0.8; } }
  const half = 4.4;
  for (let i = -half; i <= half; i += 0.5) {
    const t = (i * (-side) + half) / (2 * half); // 0 outer .. 1 inner
    const y = cy + yo + tilt * t - Math.sin(t * Math.PI) * curve;
    for (let k = 0; k < T.brow; k++) H.set(Math.round(cx + i), Math.round(y) + k - (T.brow > 2 ? 1 : 0), c);
  }
}

function mouthDraw(H, ch, T, expr, talk) {
  const dark = C('#7a2a34'), red = C('#c44a56'), teeth = C('#fff7f0'), lineC = mix(ch.skin.shade, INK, 0.55);
  const my = 33;
  const w = T.mouthW;
  const ell = (cx, cy, rx, ry) => { H.ellipse(cx, cy, rx, ry, dark); H.ellipse(cx, cy + ry * 0.45, rx * 0.7, ry * 0.45, red); };
  if (talk) {
    switch (expr) {
      case 'happy': H.ellipse(CX, my, 5, 4, dark); H.rect(CX - 4, my - 3, 9, 2, teeth); H.ellipse(CX, my + 2, 3, 1.5, red); return;
      case 'angry': H.rect(CX - 4, my - 2, 9, 5, dark); H.rect(CX - 4, my - 2, 9, 2, teeth); return;
      case 'surprised': ell(CX, my + 1, 3, 4); return;
      case 'smug': ell(CX + 2, my, 4, 2.6); return;
      case 'thinking': ell(CX + 3, my, 2.6, 3); return;
      default: ell(CX, my, 3.4, 3); return;
    }
  }
  const line = (pts) => { for (let i = 0; i < pts.length - 1; i++) H.line(CX + pts[i][0], my + pts[i][1], CX + pts[i + 1][0], my + pts[i + 1][1], lineC); };
  switch (expr) {
    case 'happy': H.poly([[CX - 5, my - 2], [CX + 5, my - 2], [CX + 3, my + 3], [CX, my + 4], [CX - 3, my + 3]], dark); H.rect(CX - 4, my - 2, 9, 2, teeth); H.ellipse(CX, my + 2.5, 2.4, 1.2, red); return;
    case 'sad': line([[-w / 2, 1], [-1, -1], [1, -1], [w / 2, 1]]); return;
    case 'angry': line([[-w / 2 - 1, 1], [-2, -1], [2, -1], [w / 2 + 1, 1]]); H.rect(CX - 2, my - 1, 4, 1, teeth); return;
    case 'surprised': ell(CX, my + 1, 2.4, 3); return;
    case 'shy': line([[-3, 0], [-1.5, 1], [0, 0], [1.5, 1], [3, 0]]); return;
    case 'thinking': line([[-1, 1], [1, 1], [3, 0], [5, -1]]); return;
    case 'smug': line([[-w / 2, 1], [0, 1], [w / 2 + 1, -1], [w / 2 + 2, -2]]); H.set(CX + w / 2 + 3, my - 2, lineC); return;
    default: line([[-w / 2, 0], [-1, 1], [1, 1], [w / 2, 0]]); return;
  }
}

function faceFeatures(H, ch, T, expr, row) {
  const sk = ch.skin;
  const ey = 26, ex = 6.6;
  const closed = row === 1 || expr === 'happy';
  eyeDraw(H, ch, T, Math.round(CX - ex), ey, -1, expr, closed);
  eyeDraw(H, ch, T, Math.round(CX + ex), ey, 1, expr, closed);
  browDraw(H, ch, T, Math.round(CX - ex), ey, -1, expr);
  browDraw(H, ch, T, Math.round(CX + ex), ey, 1, expr);
  // nose
  H.set(CX, 30, mix(sk.base, sk.shade, 0.8)); H.set(CX + 1, 30, sk.shade); H.set(CX, 29, sk.light);
  // blush
  const bl = expr === 'shy' ? 0.55 : expr === 'happy' ? 0.35 : expr === 'smug' ? 0.0 : 0.16;
  if (bl > 0) for (const sx of [-1, 1]) {
    const bc = C('#ff7a8a');
    for (let y = 29; y <= 32; y++) for (let x = -4; x <= 4; x++) {
      const dx = x / 4.2, dy = (y - 30.6) / 2.1;
      if (dx * dx + dy * dy <= 1 && H.opaque(CX + sx * 9 + x, y)) H.over(CX + sx * 9 + x, y, bc, bl);
    }
    if (expr === 'shy') for (let i = 0; i < 3; i++) H.line(CX + sx * 11 + i * 1 - 1, 30, CX + sx * 11 + i * 1 - 2, 32, mix('#ff4a6a', sk.base, 0.2));
  }
  mouthDraw(H, ch, T, expr, row === 2);
  if (T.elder) { for (const sx of [-1, 1]) { H.line(CX + sx * 13, 28, CX + sx * 11, 29, sk.shade); H.line(CX + sx * 6, 34, CX + sx * 7, 37, sk.shade); } H.line(CX - 5, 15, CX + 5, 15, sk.shade); }
  if (expr === 'angry') { const rc = C('#d83a3a'); const vx = CX + 11, vy = 14; H.line(vx - 2, vy, vx + 2, vy, rc); H.line(vx, vy - 2, vx, vy + 2, rc); H.line(vx - 2, vy - 2, vx - 1, vy - 1, rc); H.line(vx + 2, vy + 2, vx + 1, vy + 1, rc); }
  if (expr === 'shy' || expr === 'thinking') { const dc = C('#bfe6ff'); const dx = CX + 14, dy = 14; H.ellipse(dx, dy + 1, 1.6, 2.2, dc); H.set(dx, dy - 2, dc); H.set(dx - 1, dy, C('#ffffff')); }
}

// ---- accessories -------------------------------------------------------------------------------
function faceAcc(H, ch, T, rx) {
  const A = ch.acc, sk = ch.skin, ey = 26, ex = 6.6;
  if (A.has('freckles')) { const fr = mix(sk.base, '#7a3a1a', 0.5); for (const sx of [-1, 1]) for (const [dx, dy] of [[5, 30], [8, 29], [11, 30], [7, 32], [10, 32]]) H.set(CX + sx * dx - (sx > 0 ? 0 : 0), dy, fr); }
  if (A.has('bandage')) { H.rect(CX + 6, 29, 7, 4, '#f1dfc2'); H.rect(CX + 6, 29, 7, 1, '#fff6e6'); H.rect(CX + 6, 32, 7, 1, '#c4a77c'); H.rect(CX + 8, 29, 3, 4, '#e6cfa8'); }
  if (A.has('glasses') || A.has('round_glasses')) {
    const round = A.has('round_glasses') && !A.has('glasses');
    const fc = round ? C('#a8742a') : C('#3a3040');
    for (const sx of [-1, 1]) {
      const cx = CX + sx * ex;
      if (round) H.ring(cx, ey, 7.2, 7.2, 0.78, fc); else { for (let x = -7; x <= 7; x++) { H.set(Math.round(cx + x), ey - 6, fc); H.set(Math.round(cx + x), ey - 5, fc); H.set(Math.round(cx + x), ey + 6, fc); } for (let y = -6; y <= 6; y++) { H.set(Math.round(cx - 7), ey + y, fc); H.set(Math.round(cx + 7), ey + y, fc); } }
      H.set(Math.round(cx - 4), ey - 4, C('#e8f6ff')); H.set(Math.round(cx - 3), ey - 4, C('#e8f6ff')); H.set(Math.round(cx - 4), ey - 3, C('#e8f6ff'));
    }
    H.line(CX - 1, ey - 1, CX + 1, ey - 1, fc); H.line(CX - ex - 7, ey - 2, CX - ex - 10, ey - 3, fc); H.line(CX + ex + 7, ey - 2, CX + ex + 10, ey - 3, fc);
  }
  if (A.has('mustache') || A.has('beard')) {
    const bc = ch.hair.ramp;
    if (A.has('beard')) { H.poly([[CX - 13, 27], [CX - 11, 36], [CX - 5, 41], [CX + 5, 41], [CX + 11, 36], [CX + 13, 27], [CX + 9, 33], [CX + 3, 31], [CX - 3, 31], [CX - 9, 33]], bc.base); H.rect(CX - 8, 38, 16, 2, bc.shade); H.rect(CX - 5, 33, 10, 2, bc.base); mouthDraw(H, ch, T, 'neutral', false); }
    else { H.poly([[CX - 8, 31], [CX - 1, 30], [CX, 33], [CX - 4, 34]], bc.base); H.poly([[CX + 8, 31], [CX + 1, 30], [CX, 33], [CX + 4, 34]], bc.base); H.line(CX - 8, 33, CX - 6, 35, bc.shade); H.line(CX + 8, 33, CX + 6, 35, bc.shade); }
  }
}

function headAcc(H, ch, T, rx, st) {
  const A = ch.acc, o = ch.outfit;
  const acc = o.accent && o.accent !== '#ffffff' ? o.accent : '#e0507a';
  const R = ramp(acc);
  const hatC = (() => { for (const c of [o.overColor, o.shirt, o.accent, o.bottom.color]) { if (c) { const [r, g, b] = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; const l = (r * .3 + g * .59 + b * .11) / 255; if (l < 0.78 && l > 0.12) return c; } } return '#8a5a3a'; })();
  if (A.has('headband')) { const hb = ramp(o.accent === '#ffffff' ? o.shirt : acc); for (let x = CX - 15; x <= CX + 15; x++) { const y = Math.round(15 + Math.pow((x - CX) / 15, 2) * 5); for (let k = 0; k < 3; k++) H.paintOn(x, y + k, k === 0 ? hb.light : k === 2 ? hb.shade : hb.base); } }
  if (A.has('hairclip')) { H.rect(CX + 8, 16, 5, 2, '#ffd24a'); H.rect(CX + 8, 18, 5, 1, '#c4902a'); H.set(CX + 9, 16, '#fff0a0'); }
  if (A.has('ribbon')) { H.poly([[CX + 10, 10], [CX + 4, 5], [CX + 4, 15]], R.base); H.poly([[CX + 10, 10], [CX + 17, 5], [CX + 17, 15]], R.shade); H.ellipse(CX + 10, 10, 2.2, 2.4, R.light); H.line(CX + 4, 7, CX + 4, 13, R.light); }
  if (A.has('cap') || A.has('beanie')) {
    const beanie = A.has('beanie') && !A.has('cap'); const hc = ramp(hatC);
    for (let y = 2; y < 21; y++) for (let x = 0; x < S; x++) { const dx = (x + 0.5 - CX) / 17, dy = (y + 0.5 - 20) / 18; if (dx * dx + dy * dy < 1 && y < (beanie ? 19 : 16)) H.set(x, y, y < 7 ? hc.light : (x > CX + 8 ? hc.shade : hc.base)); }
    if (beanie) { for (let x = CX - 16; x <= CX + 16; x++) for (let k = 0; k < 4; k++) if (H.opaque(x, 17 + k) || true) H.set(x, 16 + k, (x + k) % 3 ? hc.shade : hc.base); H.ellipse(CX, 3, 3.5, 3.5, hc.light); }
    else { for (let x = CX - 17; x <= CX + 17; x++) { H.set(x, 16, hc.shade); H.set(x, 17, hc.dark); } H.poly([[CX - 14, 17], [CX + 14, 17], [CX + 12, 21], [CX - 12, 21]], hc.shade); H.rect(CX - 3, 9, 6, 4, R.base); }
  }
  if (A.has('headphones')) { const bc = C('#34313f'); for (let x = CX - 16; x <= CX + 16; x++) { const y = Math.round(21 - Math.sqrt(Math.max(0, 1 - Math.pow((x - CX) / 17, 2))) * 17); for (let k = 0; k < 3; k++) H.set(x, y + k, bc); } for (const sx of [-1, 1]) { H.rect(CX + sx * 17 - 3, 22, 6, 11, bc); H.rect(CX + sx * 17 - 2 - (sx > 0 ? 0 : 0), 24, 4, 7, R.base); H.set(CX + sx * 17 - 2, 24, R.light); } }
  if (A.has('earphones')) { for (const sx of [-1, 1]) { H.ellipse(CX + sx * 14, 29, 1.6, 1.6, '#f4f0ec'); H.line(CX + sx * 14, 30, CX + sx * 12, 40, '#f4f0ec'); } }
}

function finish(H, hairF, hairB, sh) {}

// ---- assembly -----------------------------------------------------------------------------------
function drawPortraitCell(ch, T, expr, row, parts) {
  const cell = new PixelBuffer(S, S);
  cell.blit(parts.back);
  cell.blit(parts.shoulders);
  const H = new PixelBuffer(S, S);
  const rx = drawSkin(H, ch, T);
  // hair shadow on forehead
  const forehead = new PixelBuffer(S, S);
  for (let y = 0; y < S - 3; y++) for (let x = 0; x < S; x++) {
    if (parts.front.opaque(x, y) && !parts.front.opaque(x, y + 1) && H.opaque(x, y + 1)) { for (let k = 1; k <= 3; k++) if (H.opaque(x, y + k) && !parts.front.opaque(x, y + k)) H.set(x, y + k, mix(ch.skin.base, ch.skin.shade, k === 1 ? 0.9 : 0.5)); }
  }
  faceFeatures(H, ch, T, expr, row);
  faceAcc(H, ch, T, rx);
  H.blit(parts.front);
  headAcc(H, ch, T, rx);
  H.outline();
  cell.blit(H);
  return cell;
}

export function buildPortraitSheet(ch) {
  const L = PORTRAIT_SHEET;
  const sheet = new PixelBuffer(L.cols * L.size, L.rows * L.size);
  const T = traitsFor(ch);
  const hm = hairMasks(ch);
  const hairF = shadeHair(hm.front, ch.hair.ramp, ch.hair.hl);
  const hairB = shadeHair(hm.back, mix(ch.hair.ramp.base, ch.hair.ramp.shade, 0.35) && ch.hair.ramp, ch.hair.hl);
  const backO = hairB.clone(); if (backO.countOpaque()) backO.outline();
  const parts = { front: hairF, back: backO, shoulders: drawShoulders(ch) };
  // back hair that sits behind shoulders is darker
  for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (backO.opaque(x, y)) { const c = backO.get(x, y); backO.set(x, y, mix(c, '#241420', 0.12)); }
  // tie colour pixels of hair accessories handled by accessories
  for (let r = 0; r < L.rows; r++) for (let c = 0; c < L.cols; c++) {
    const expr = EXPRESSIONS[c];
    sheet.blit(drawPortraitCell(ch, T, expr, r, parts), c * L.size, r * L.size);
  }
  return sheet;
}
