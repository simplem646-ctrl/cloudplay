// 16x24 chibi character sprites: body, outfits, hair and accessories composed in code.
// Layers are drawn separately (back hair -> body -> head), each with its own 1px outline in a
// darker shade of the part colour, then stacked. 'right' frames are mirrored 'left' frames.
import { PixelBuffer } from './pixelbuffer.js';
import { C, ramp, mix, outlineOf, luma, lighten, darken, unpack, pack } from './color.js';
import { hairGrids } from './sprite_hair.js';

export const FW = 16;
export const FH = 24;
const HX = 3; // head interior left column

// ------------------------------------------------------------------ geometry
function makeGeom(ch, kind) {
  const child = ch.age === 'child';
  let HY = 3 - ch.height + (child ? 1 : 0);
  let dy = 0;
  if (kind === 'stepA' || kind === 'stepB' || kind === 'sad') dy = 1;
  if (kind === 'surprised' || kind === 'cheer') dy = HY >= 3 ? -1 : 0;
  if (kind === 'sit') dy = 3;
  HY += dy;
  const torsoH = child ? 5 : 6;
  const TT = HY + 9;
  const LT = TT + torsoH;
  const foot = 22 + Math.min(dy, 0);
  const b = ch.build;
  const wide = b === 'sturdy';
  return {
    HY, TT, LT, torsoH, dy, foot, wide, slim: b === 'slim', child,
    tx0: wide ? 4 : 5, tx1: wide ? 11 : 10,
  };
}

// ------------------------------------------------------------------ tiny helpers
const px = (B, x, y, c) => { B.set(x, y, c); };
const row = (B, y, x0, x1, c) => { for (let x = x0; x <= x1; x++) B.set(x, y, c); };

/** filled box with 3-tone shading (light left column, shade right column + bottom row) */
function shaded(B, x, y, w, h, r, o = {}) {
  if (w <= 0 || h <= 0) return;
  B.rect(x, y, w, h, r.base);
  if (!o.flat) {
    if (h > 1) row(B, y + h - 1, x, x + w - 1, r.shade);
    if (w > 2) for (let j = 0; j < h; j++) B.set(x + w - 1, y + j, r.shade);
    if (w > 2 && h > 2) for (let j = 0; j < h - 1; j++) B.set(x, y + j, r.light);
  }
}

function pickHat(ch) {
  const o = ch.outfit;
  const cands = [o.overColor, o.shirt, o.accent, o.bottom.color].filter(Boolean);
  for (const c of cands) { const l = luma(c); if (l < 0.78 && l > 0.12) return c; }
  return '#8a5a3a';
}

// ------------------------------------------------------------------ hair
const HAIR_HL_COLS = { down: [6, 7], up: [6, 7], left: [1, 2] };

/** paint grid rows into hair layer `L` (head-local origin), with automatic 3-tone shading. */
function paintHair(L, ch, view, layer, g, tieColor) {
  const grids = hairGrids(ch.hair.style, view);
  const rows = grids[layer];
  if (!rows) return;
  const R = ch.hair.ramp;
  const HL = ch.hair.hl;
  const set = new Map();
  rows.forEach((s, r) => {
    for (let c = 0; c < s.length; c++) {
      const chr = s[c];
      if (chr === '.') continue;
      const x = HX + c - 2, y = g.HY + r - 2;
      set.set(x + ',' + y, chr);
    }
  });
  const has = (x, y) => set.has(x + ',' + y);
  for (const [k, chr] of set) {
    const [x, y] = k.split(',').map(Number);
    let ramp_ = R;
    const lx = x - HX;
    if (HL && chr !== 't' && HAIR_HL_COLS[view].includes(lx) && y - g.HY < 6) ramp_ = HL;
    let c;
    if (chr === 't') c = ramp(tieColor).base;
    else if (chr === 'o') c = ramp_.light;
    else if (chr === 'x') c = ramp_.shade;
    else {
      const up = has(x, y - 1), up2 = has(x, y - 2), dn = has(x, y + 1), rt = has(x + 1, y);
      c = ramp_.base;
      if (!dn) c = ramp_.shade;
      else if (up && !up2 && lx >= 1 && lx <= 5 && y - g.HY < 4) c = ramp_.light;
      else if (!rt && lx >= 8 && up) c = ramp_.shade;
    }
    L.set(x, y, c);
  }
}

// ------------------------------------------------------------------ head
function skinShape(view, g, S) {
  const H = new PixelBuffer(FW, FH);
  const Y = (ly) => g.HY + ly;
  const spans = view === 'left'
    ? [[0, 1, 8], [1, 0, 9], [2, 0, 9], [3, 0, 9], [4, 0, 9], [5, 0, 9], [6, 0, 9], [7, 1, 8], [8, 3, 7]]
    : [[0, 1, 8], [1, 0, 9], [2, 0, 9], [3, 0, 9], [4, 0, 9], [5, 0, 9], [6, 0, 9], [7, 1, 8], [8, 2, 7]];
  for (const [ly, a, b] of spans) row(H, Y(ly), HX + a, HX + b, S.base);
  // chin shade and cheek light
  row(H, Y(8), HX + (view === 'left' ? 3 : 2), HX + (view === 'left' ? 7 : 7), S.shade);
  px(H, HX + (view === 'left' ? 0 : 1), Y(7), S.shade);
  if (view !== 'left') px(H, HX + 8, Y(7), S.shade);
  if (view === 'left') {
    px(H, HX - 1, Y(5), S.base); // nose
    px(H, HX - 1, Y(5), S.light);
    px(H, HX + 9, Y(7), S.shade); // nape
    px(H, HX + 6, Y(4), S.shade); px(H, HX + 6, Y(5), S.shade); // ear
  }
  return H;
}

function drawEyes(H, ch, view, expr, g) {
  const E = ch.eyes;
  const Y = (ly) => g.HY + ly;
  const eye = (x, y, tall) => {
    const w = C('#ffffff');
    if (tall) {
      px(H, x, y, E.dark); px(H, x + 1, y, E.dark);
      px(H, x, y + 1, w); px(H, x + 1, y + 1, E.dark);
      px(H, x, y + 2, E.dark); px(H, x + 1, y + 2, E.base);
    } else {
      px(H, x, y, E.dark); px(H, x + 1, y, E.dark);
      px(H, x, y + 1, E.dark); px(H, x + 1, y + 1, E.base);
      px(H, x, y, E.dark);
      px(H, x + 1, y, mix(E.dark, '#ffffff', 0.55));
    }
  };
  const sk = ch.skin;
  const tear = C('#bfe6ff');
  const mouth = C('#a8403f');
  const dark = E.dark;
  if (view === 'down') {
    const lx = [HX + 2, HX + 6];
    if (expr === 'happy' || expr === 'cheer') {
      // simple arcs: shape  .X.  / X.X  (3 wide, left aligned one px outward)
      for (const x of [HX + 1, HX + 6]) {
        H.set(x, Y(5), dark); H.set(x + 1, Y(4), dark); H.set(x + 2, Y(5), dark);
        H.set(x, Y(4), sk.base); H.set(x + 2, Y(4), sk.base); H.set(x + 1, Y(5), sk.base);
      }
      if (expr === 'cheer') { row(H, Y(6), HX + 4, HX + 5, mouth); row(H, Y(7), HX + 4, HX + 5, C('#e87a7a')); }
      else { row(H, Y(7), HX + 4, HX + 5, mouth); px(H, HX + 3, Y(6), mouth); px(H, HX + 6, Y(6), mouth); }
      px(H, HX + 1, Y(6), mix(sk.base, '#ff7a8a', 0.5)); px(H, HX + 8, Y(6), mix(sk.base, '#ff7a8a', 0.5));
    } else if (expr === 'surprised') {
      eye(lx[0], Y(4) - 1, true); eye(lx[1], Y(4) - 1, true);
      row(H, Y(6), HX + 4, HX + 5, mouth); row(H, Y(7), HX + 4, HX + 5, mouth);
      H.set(HX + 4, Y(6), mix(mouth, '#000000', 0.2)); H.set(HX + 5, Y(7), mix(mouth, '#000000', 0.2));
    } else if (expr === 'sad') {
      eye(lx[0], Y(4)); eye(lx[1], Y(4));
      px(H, lx[0], Y(3), mix(sk.base, '#3a2020', 0.45)); px(H, lx[1] + 1, Y(3), mix(sk.base, '#3a2020', 0.45));
      px(H, lx[0], Y(6), tear); px(H, lx[1] + 1, Y(6), tear);
      row(H, Y(7), HX + 4, HX + 5, mouth); px(H, HX + 3, Y(7) + 0, sk.base);
    } else {
      eye(lx[0], Y(4)); eye(lx[1], Y(4));
    }
    if (expr === 'neutral' || !expr) {
      // faint cheeks
      px(H, HX + 1, Y(6), mix(sk.base, '#ff8f8f', 0.28)); px(H, HX + 8, Y(6), mix(sk.base, '#ff8f8f', 0.28));
    }
  } else if (view === 'left') {
    const x = HX + 2;
    if (expr === 'happy' || expr === 'cheer') {
      H.set(x, Y(5), dark); H.set(x + 1, Y(4), dark); H.set(x + 2, Y(5), dark);
      if (expr === 'cheer') { row(H, Y(7), HX + 0, HX + 1, mouth); H.set(HX + 0, Y(6), mouth); }
      else row(H, Y(7), HX + 0, HX + 1, mouth);
    } else if (expr === 'surprised') {
      eye(x, Y(3), true); row(H, Y(7), HX, HX + 1, mouth); px(H, HX, Y(6), mouth);
    } else {
      eye(x, Y(4));
      if (expr === 'sad') { px(H, x, Y(6), tear); row(H, Y(7), HX + 1, HX + 2, mouth); }
    }
    px(H, HX + 1, Y(6), mix(sk.base, '#ff8f8f', 0.35));
  }
}

function drawFaceAccessories(H, ch, view, g, hairSet) {
  const A = ch.acc;
  const Y = (ly) => g.HY + ly;
  const hair = ch.hair.ramp;
  const sk = ch.skin;
  const frame = C('#3a3040');
  const gold = C('#a8742a');
  const lensGlint = C('#d9f1ff');

  if (A.has('freckles') && view !== 'up') {
    const fr = mix(sk.base, '#7a3a1a', 0.5);
    if (view === 'down') { for (const lx of [1, 3, 6, 8]) px(H, HX + lx, Y(6), fr); px(H, HX + 2, Y(7), fr); px(H, HX + 7, Y(7), fr); }
    else { px(H, HX + 1, Y(6), fr); px(H, HX + 3, Y(6), fr); px(H, HX + 2, Y(7), fr); }
  }
  if (A.has('bandage') && view !== 'up') {
    const pad = C('#f1dfc2'), dk = C('#c4a77c');
    if (view === 'down') { H.set(HX + 6, Y(6), pad); H.set(HX + 7, Y(6), pad); H.set(HX + 7, Y(7), pad); H.set(HX + 7, Y(5) + 0, pad); H.set(HX + 6, Y(7), dk); }
    else { H.set(HX + 1, Y(6), pad); H.set(HX + 2, Y(6), pad); H.set(HX + 2, Y(7), dk); }
  }
  if (A.has('glasses') || A.has('round_glasses')) {
    const round = A.has('round_glasses') && !A.has('glasses');
    const col = round ? gold : frame;
    if (view === 'down') {
      for (const a of [HX + 1, HX + 5]) {
        if (round) {
          row(H, Y(3), a + 1, a + 2, col); row(H, Y(6), a + 1, a + 2, col);
          for (const yy of [Y(4), Y(5)]) { px(H, a, yy, col); px(H, a + 3, yy, col); }
        } else {
          row(H, Y(3), a, a + 3, col); row(H, Y(6), a, a + 3, col);
          for (const yy of [Y(4), Y(5)]) { px(H, a, yy, col); px(H, a + 3, yy, col); }
        }
      }
      px(H, HX + 4, Y(4), col); px(H, HX + 5, Y(4), col);
      px(H, HX + 0, Y(4), col); px(H, HX + 9, Y(4), col);
      px(H, HX + 0, Y(3), col); px(H, HX + 9, Y(3), col);
    } else if (view === 'left') {
      const a = HX + 1;
      if (round) { row(H, Y(3), a + 1, a + 2, col); row(H, Y(6), a + 1, a + 2, col); for (const yy of [Y(4), Y(5)]) { px(H, a, yy, col); px(H, a + 3, yy, col); } }
      else { row(H, Y(3), a, a + 3, col); row(H, Y(6), a, a + 3, col); for (const yy of [Y(4), Y(5)]) { px(H, a, yy, col); px(H, a + 3, yy, col); } }
      row(H, Y(4), a + 4, a + 6, col);
    } else if (view === 'up') {
      px(H, HX - 1, Y(4), col); px(H, HX + 10, Y(4), col);
    }
  }
  if (A.has('mustache') || A.has('beard')) {
    const bc = hair.base;
    if (view === 'down') {
      if (A.has('beard')) {
        row(H, Y(7), HX + 1, HX + 8, bc); row(H, Y(8), HX + 2, HX + 7, hair.shade);
        px(H, HX, Y(6), bc); px(H, HX + 9, Y(6), bc); px(H, HX + 1, Y(6), bc); px(H, HX + 8, Y(6), bc);
        row(H, Y(6), HX + 3, HX + 6, hair.light); row(H, Y(7), HX + 4, HX + 5, mix(sk.shade, '#8a3a3a', 0.4));
        px(H, HX + 3, Y(7), bc); px(H, HX + 6, Y(7), bc);
      } else {
        row(H, Y(6), HX + 2, HX + 7, bc); px(H, HX + 1, Y(7), bc); px(H, HX + 8, Y(7), bc);
        px(H, HX + 4, Y(6), hair.light); px(H, HX + 5, Y(6), hair.light);
      }
    } else if (view === 'left') {
      if (A.has('beard')) { row(H, Y(6), HX + 0, HX + 4, bc); row(H, Y(7), HX + 0, HX + 7, bc); row(H, Y(8), HX + 3, HX + 7, hair.shade); px(H, HX - 1, Y(6), bc); }
      else { row(H, Y(6), HX - 1, HX + 2, bc); px(H, HX + 3, Y(7), bc); }
    } else if (view === 'up' && A.has('beard')) {
      row(H, Y(7), HX + 1, HX + 8, bc); row(H, Y(8), HX + 2, HX + 7, hair.shade);
    }
  }
}

function drawHeadAccessories(H, ch, view, g) {
  const A = ch.acc;
  const Y = (ly) => g.HY + ly;
  const o = ch.outfit;
  const accent = ramp(o.accent && o.accent !== '#ffffff' ? o.accent : '#d84a5a');
  const hatC = ramp(pickHat(ch));

  if (A.has('headband')) {
    const hb = ramp(mix(o.accent, '#ffffff', 0.0) === C('#ffffff') ? '#e0507a' : o.accent);
    const hbc = o.accent === '#ffffff' ? ramp(o.shirt) : hb;
    const stripe = (y, x0, x1) => { for (let x = x0; x <= x1; x++) H.paintOn(x, y, hbc.base); };
    if (view === 'down' || view === 'up') { stripe(Y(1), HX - 1, HX + 10); stripe(Y(2) - 0, HX - 1, HX - 1); stripe(Y(2), HX + 10, HX + 10); for (let x = HX - 1; x <= HX + 10; x++) H.paintOn(x, Y(1), (x % 3 === 0) ? hbc.light : hbc.base); if (view === 'down') for (let x = HX; x <= HX + 9; x++) H.paintOn(x, Y(2), hbc.shade); }
    else { stripe(Y(1), HX - 1, HX + 10); for (let x = HX - 1; x <= HX + 10; x++) H.paintOn(x, Y(1), (x % 3 === 0) ? hbc.light : hbc.base); }
  }
  if (A.has('hairclip')) {
    const cl = C('#ffd24a');
    if (view === 'down') { H.set(HX + 7, Y(1), cl); H.set(HX + 8, Y(2) - 1, cl); H.set(HX + 8, Y(1), mix(cl, '#a8742a', 0.4)); }
    else if (view === 'left') { H.set(HX + 2, Y(1), cl); H.set(HX + 3, Y(1), cl); }
    else { H.set(HX + 7, Y(1), cl); H.set(HX + 8, Y(1), cl); }
  }
  if (A.has('ribbon')) {
    const rb = ramp(o.accent === '#ffffff' ? '#e8507a' : o.accent);
    const bx = view === 'left' ? HX + 6 : HX + 7;
    const by = Y(-1);
    H.set(bx - 1, by, rb.base); H.set(bx - 1, by + 1, rb.shade); H.set(bx, by, rb.light); H.set(bx + 1, by, rb.base); H.set(bx, by + 1, rb.dark);
    H.set(bx + 2, by, rb.base); H.set(bx + 2, by + 1, rb.shade); H.set(bx + 1, by + 1, rb.shade);
  }
  if (A.has('cap') || A.has('beanie')) {
    const beanie = A.has('beanie') && !A.has('cap');
    const cap = hatC;
    const rows = beanie
      ? (view === 'left'
        ? ['...########...', '..##########..', '.############.', '.############.', '.############.']
        : ['...########...', '..##########..', '.############.', '.############.', '.############.'])
      : ['....######....', '..##########..', '.############.', '.############.'];
    // clear hair under hat area then draw hat
    rows.forEach((s, r) => {
      for (let c = 0; c < s.length; c++) {
        if (s[c] !== '#') continue;
        const x = HX + c - 2, y = Y(r - 2);
        let col = cap.base;
        if (beanie && r >= 3) col = ((x + y) & 1) ? cap.light : cap.base;
        else if (r === 0 || (r === 1 && c % 4 === 1)) col = cap.light;
        else if (r >= 3 && !beanie) col = cap.shade;
        if (beanie && r === 4) col = cap.shade;
        H.set(x, y, col);
      }
    });
    if (!beanie) {
      if (view === 'down') {
        row(H, Y(2), HX + 0, HX + 9, cap.shade); row(H, Y(2) + 0, HX - 1, HX - 1, cap.shade); px(H, HX + 10, Y(2), cap.shade);
        row(H, Y(3), HX + 2, HX + 7, mix(ch.skin.shade, '#000000', 0.15));
        px(H, HX + 4, Y(0), cap.light); px(H, HX + 5, Y(0), cap.light);
        px(H, HX + 4, Y(1), accent.base); px(H, HX + 5, Y(1), accent.base);
      } else if (view === 'left') {
        row(H, Y(2), HX - 2, HX + 9, cap.shade); row(H, Y(3), HX - 2, HX + 2, cap.base); row(H, Y(3) - 0, HX - 2, HX - 1, cap.dark);
      } else {
        row(H, Y(4), HX, HX + 9, cap.shade); px(H, HX + 4, Y(3), accent.base); px(H, HX + 5, Y(3), accent.base);
      }
    }
  }
  if (A.has('headphones')) {
    const band = C('#34313f'), pad = ramp(o.accent === '#ffffff' ? '#e8507a' : o.accent);
    if (view !== 'left') {
      for (let x = HX + 1; x <= HX + 8; x++) H.set(x, Y(-2), band);
      H.set(HX, Y(-1), band); H.set(HX + 9, Y(-1), band);
      H.set(HX - 1, Y(0), band); H.set(HX + 10, Y(0), band);
      for (let y = Y(1); y <= Y(2); y++) { H.set(HX - 1, y, band); H.set(HX + 10, y, band); }
      for (let y = Y(3); y <= Y(5); y++) {
        H.set(HX - 2, y, band); H.set(HX - 1, y, pad.base); H.set(HX + 11, y, band); H.set(HX + 10, y, pad.base);
      }
      H.set(HX - 2, Y(3), pad.light); H.set(HX + 11, Y(3), pad.light);
    } else {
      for (let x = HX + 1; x <= HX + 8; x++) H.set(x, Y(-2), band);
      H.set(HX + 0, Y(-1), band); H.set(HX + 9, Y(-1), band);
      for (let y = Y(0); y <= Y(2); y++) H.set(HX + 5, y, band);
      for (let y = Y(3); y <= Y(5); y++) { H.set(HX + 4, y, band); H.set(HX + 5, y, pad.base); H.set(HX + 6, y, pad.base); H.set(HX + 7, y, band); }
    }
  }
  if (A.has('earphones')) {
    const wc = C('#f4f0ec');
    if (view === 'down') { H.set(HX - 1, Y(4), wc); H.set(HX - 1, Y(5), wc); H.set(HX - 1, Y(6), mix(wc, '#888888', 0.3)); H.set(HX - 1, Y(7), mix(wc, '#888888', 0.4)); }
    else if (view === 'left') { H.set(HX + 6, Y(4), wc); H.set(HX + 6, Y(5), wc); H.set(HX + 6, Y(6), mix(wc, '#888888', 0.3)); H.set(HX + 6, Y(7), mix(wc, '#888888', 0.4)); }
    else { H.set(HX - 1, Y(4), wc); H.set(HX + 10, Y(4), wc); }
  }
}

function drawHead(ch, view, expr, g) {
  const H = new PixelBuffer(FW, FH);
  const S = ch.skin;
  H.blit(skinShape(view, g, S));
  const style = ch.hair.style;
  // bald head highlight
  if (style === 'bald') { px(H, HX + 3, g.HY, S.light); px(H, HX + 2, g.HY + 1, S.light); px(H, HX + 3, g.HY + 1, S.light); }
  if (view !== 'up') drawEyes(H, ch, view, expr, g);
  // hair shadow cast on the forehead
  const accent = ch.outfit.accent && ch.outfit.accent !== '#ffffff' ? ch.outfit.accent : '#d84a5a';
  const hairLayer = new PixelBuffer(FW, FH);
  paintHair(hairLayer, ch, view, 'f', g, accent);
  if (view !== 'up') {
    for (let x = 0; x < FW; x++) for (let y = 0; y < FH - 1; y++) {
      if (hairLayer.opaque(x, y) && !hairLayer.opaque(x, y + 1) && H.opaque(x, y + 1) && y + 1 < g.HY + 4) {
        const c = H.get(x, y + 1);
        if (c === S.base) H.set(x, y + 1, mix(S.base, S.shade, 0.7));
      }
    }
  }
  drawFaceAccessories(H, ch, view, g);
  H.blit(hairLayer);
  drawHeadAccessories(H, ch, view, g);
  H.outline();
  return H;
}

function drawBackHair(ch, view, g) {
  const L = new PixelBuffer(FW, FH);
  const accent = ch.outfit.accent && ch.outfit.accent !== '#ffffff' ? ch.outfit.accent : '#d84a5a';
  paintHair(L, ch, view, 'b', g, accent);
  if (L.countOpaque()) L.outline();
  return L;
}

// ------------------------------------------------------------------ body
function legColors(o) {
  const b = ramp(o.bottom.color);
  return b;
}

function drawLegsFront(B, ch, g, st, view) {
  const o = ch.outfit, S = ch.skin;
  const bt = o.bottom;
  const P = ramp(bt.color);
  const shoes = ramp(o.shoes);
  const sock = o.socks ? ramp(o.socks) : null;
  const slim = g.slim, wide = g.wide;
  const lw = wide ? 4 : slim ? 2 : 3;
  const lxL = wide ? 4 : 5;
  const lxR = wide ? 8 : slim ? 9 : 8;
  const legs = [[lxL, 'L'], [lxR, 'R']];
  const lift = { L: st.liftL || 0, R: st.liftR || 0 };
  const top = g.LT - 1;
  for (const [x0, side] of legs) {
    const bottom = g.foot - lift[side];
    const x1 = x0 + lw - 1;
    for (let y = top; y <= bottom; y++) {
      const fromBottom = bottom - y; // 0 = last row
      let color;
      const isShoe = fromBottom <= 1;
      if (isShoe) {
        color = fromBottom === 0 ? shoes.shade : shoes.base;
        if (bt.kind === 'long_skirt' && fromBottom === 1 && false) color = P.base;
      } else {
        const idx = y - top; // 0 = hip row
        let covered = true;
        if (bt.kind === 'trunks') covered = idx <= 0;
        else if (bt.kind === 'shorts') covered = idx <= (bt.short ? 0 : 1);
        else if (bt.kind === 'skirt') covered = idx <= 1;
        else if (bt.kind === 'long_skirt') covered = true;
        if (covered) color = (side === 'L' ? P.base : P.base);
        else if (sock && fromBottom <= 3) color = sock.base;
        else color = S_color(ch, side, wide);
        if (bt.kind === 'long_skirt' && fromBottom <= 2 && !isShoe) color = P.shade;
        if (bt.kind === 'long_skirt' && fromBottom > 2) color = P.base;
      }
      for (let x = x0; x <= x1; x++) B.set(x, y, color);
      // inner shading
      const inner = side === 'L' ? x1 : x0;
      if (!isShoe && color === P.base && y > top) B.set(inner, y, P.shade);
      else if (!isShoe && color === S_color(ch, side, wide)) B.set(inner, y, ch.skin.shade);
      else if (isShoe) B.set(inner, y, fromBottom === 0 ? shoes.dark : shoes.shade);
      if (isShoe && fromBottom === 1) B.set(x0 + (side === 'L' ? 0 : lw - 1), y, shoes.light);
    }
    if (slim) {
      // narrow legs: fill gap with outline later
    }
  }
  // hips (row LT-1 is part of the leg block above); crotch fill
  if (!slim) { /* legs adjacent */ } else { row(B, top, lxL, lxR + lw - 1, P.base); }
}

function S_color(ch, side, wide) { return ch.skin.base; }

function drawLegsSide(B, ch, g, st) {
  const o = ch.outfit, S = ch.skin, bt = o.bottom;
  const P = ramp(bt.color), shoes = ramp(o.shoes), sock = o.socks ? ramp(o.socks) : null;
  const top = g.LT - 1;
  const wide = g.wide;
  const cx = wide ? 6 : 6; // legs left edge at rest
  const legW = wide ? 3 : 3;
  // front leg offset (toward facing = left), back leg offset
  const f = st.legSwing || 0; // -1 front leg forward (left), +1 back..
  const draw = (x0, bottomY, back) => {
    for (let y = top; y <= bottomY; y++) {
      const fb = bottomY - y;
      const idx = y - top;
      let color;
      if (fb <= 1) color = fb === 0 ? shoes.shade : shoes.base;
      else {
        let covered = true;
        if (bt.kind === 'trunks') covered = idx <= 0;
        else if (bt.kind === 'shorts') covered = idx <= (bt.short ? 0 : 1);
        else if (bt.kind === 'skirt') covered = idx <= 1;
        if (covered) color = back ? P.shade : P.base;
        else if (sock && fb <= 3) color = back ? sock.shade : sock.base;
        else color = back ? S.shade : S.base;
      }
      for (let x = x0; x < x0 + legW; x++) B.set(x, y, color);
      if (fb <= 1) B.set(x0 - 1, y, fb === 0 ? shoes.shade : shoes.base); // toe forward (left)
      if (fb === 1) B.set(x0 - 1, y, shoes.light);
    }
  };
  const bottomBase = g.foot;
  if (st.legSwing) {
    // back leg
    draw(cx + 1 + (wide ? 0 : 0) + Math.abs(st.legSwing), bottomBase - (st.liftBack || 0), true);
    draw(cx - 1 + (wide ? 0 : 0), bottomBase - (st.liftFront || 0), false);
  } else {
    draw(cx + 1, bottomBase, true);
    draw(cx, bottomBase, false);
  }
  if (bt.kind === 'skirt' || bt.kind === 'long_skirt') {
    // skirt flare in side view (drawn by torso step for continuity)
  }
}

function drawSkirtFlare(B, ch, g, view, hipY) {
  const o = ch.outfit, bt = o.bottom;
  const P = ramp(bt.color);
  const long = bt.kind === 'long_skirt';
  const rows = long ? Math.max(3, g.foot - 1 - hipY) : 2;
  let x0, x1;
  if (view === 'left') { x0 = g.wide ? 4 : 5; x1 = g.wide ? 10 : 10; } else { x0 = g.tx0 - 1; x1 = g.tx1 + 1; }
  for (let r = 0; r < rows; r++) {
    const y = hipY + r;
    const grow = r >= 1 ? 1 : 0;
    const a = x0 - (long ? Math.min(1, grow) : grow), b = x1 + (long ? Math.min(1, grow) : grow);
    for (let x = a; x <= b; x++) {
      let c = P.base;
      if ((x - a) % 3 === 2 && r > 0) c = P.shade;
      if (r === rows - 1) c = (x - a) % 3 === 2 ? P.dark : P.shade;
      B.set(x, y, c);
    }
    B.set(a, y, P.light);
  }
}

function shirtShade(r, x, y, tx0, tx1) { return r.base; }

function drawArm(B, ch, g, side, mode, view) {
  const o = ch.outfit, S = ch.skin;
  const sleeveBase = o.over && o.sleeve !== 'none' && o.over !== 'vest' ? o.overColor : o.shirt;
  const SL = o.swim ? S : ramp(sleeveBase);
  const d = side === 'L' ? -1 : 1;
  const sx = side === 'L' ? g.tx0 - 1 : g.tx1 + 1;
  const sy = g.TT + 1;
  const len = o.sleeve === 'long' ? 4 : o.sleeve === 'short' ? 2 : 0;
  const draw = (pts) => {
    pts.forEach(([dx, dy], i) => {
      const x = sx + dx * 1, y = sy + dy;
      const isSleeve = i < len || (mode === 'cheer' && i < Math.max(len, 3) && o.sleeve !== 'none');
      let c;
      if (o.sleeve === 'none' || o.swim) c = (i === pts.length - 1) ? S.base : S.base;
      else if (isSleeve) c = (i === len - 1 || i === pts.length - 1) ? SL.shade : SL.base;
      else c = S.base;
      if (i === pts.length - 1 && (o.sleeve === 'none' || !isSleeve)) c = S.base;
      B.set(x, y, c);
    });
  };
  let pts;
  if (mode === 'hang') pts = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]];
  else if (mode === 'up') pts = [[0, -1], [0, 0], [0, 1], [0, 2], [0, 3]];
  else if (mode === 'down') pts = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5]];
  else if (mode === 'happy') pts = [[0, 0], [d, 0], [d * 2, -1], [d * 2, -2]];
  else if (mode === 'wide') pts = [[0, 0], [d, 0], [d * 2, 0], [d * 3, 0]];
  else if (mode === 'cheer') pts = [[0, 0], [d, -1], [d * 2, -1], [d * 3, -2], [d * 3, -3], [d * 3, -4], [d * 3, -5]];
  else if (mode === 'sit') pts = [[0, 0], [0, 1], [0, 2], [0, 3]];
  else pts = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]];
  draw(pts);
}

function drawTorsoFront(B, ch, g, view, dyArm) {
  const o = ch.outfit, S = ch.skin;
  const x0 = g.tx0, x1 = g.tx1, w = x1 - x0 + 1;
  const T = ramp(o.shirt);
  const back = view === 'up';
  const y0 = g.TT, h = g.torsoH;
  const mid0 = 7, mid1 = 8;

  // --- base shirt
  if (o.swim === 'trunks') {
    shaded(B, x0, y0, w, h, S, {});
    row(B, y0, mid0 - 1, mid1 + 1, S.shade);
  } else if (o.swim === 'one') {
    shaded(B, x0, y0, w, h, T);
    // strap neckline
    if (!back) { px(B, mid0, y0, S.base); px(B, mid1, y0, S.base); px(B, mid0 + 0, y0 + 1, S.light); px(B, mid1, y0 + 1, S.light); }
    else { for (let x = mid0 - 1; x <= mid1 + 1; x++) px(B, x, y0, S.base); px(B, mid0, y0 + 1, S.base); px(B, mid1, y0 + 1, S.base); }
  } else {
    shaded(B, x0, y0, w, h, T);
    row(B, y0, x0 + 1, x1 - 1, T.shade);
  }
  // bottom garment top row (waistband) handled by legs (hip row = LT-1 = torso last row)
  // --- neckline
  const neck = o.neck;
  if (!o.swim) {
    if (back) {
      if (neck === 'hood') { row(B, y0, x0 + 1, x1 - 1, T.light); row(B, y0 + 1, mid0, mid1, T.shade); }
      else { px(B, mid0, y0, S.shade); px(B, mid1, y0, S.shade); }
    } else if (neck === 'crew') { px(B, mid0, y0, S.shade); px(B, mid1, y0, S.shade); px(B, mid0, y0 + 1, T.shade); px(B, mid1, y0 + 1, T.shade); }
    else if (neck === 'turtle') { row(B, y0, mid0 - 1, mid1 + 1, T.light); row(B, y0, mid0 - 1, mid1 + 1, T.light); px(B, mid0 - 1, y0, T.base); px(B, mid1 + 1, y0, T.base); }
    else if (neck === 'hood') { row(B, y0, x0 + 1, x1 - 1, T.light); px(B, mid0, y0, T.shade); px(B, mid1, y0, T.shade); px(B, mid0 - 1, y0 + 1, T.dark); px(B, mid1 + 1, y0 + 1, T.dark); px(B, mid0 - 1, y0 + 2, T.light); px(B, mid1 + 1, y0 + 2, T.light); }
    else if (neck === 'collar') {
      const col = ramp(o.trim && o.name.includes('/') ? o.trim : mix(o.shirt, '#ffffff', 0.55));
      px(B, mid0, y0, S.shade); px(B, mid1, y0, S.shade);
      px(B, mid0 - 1, y0, col.light); px(B, mid1 + 1, y0, col.light); px(B, mid0, y0 + 1, col.base); px(B, mid1, y0 + 1, col.base);
      px(B, mid0 - 1, y0 + 1, col.shade); px(B, mid1 + 1, y0 + 1, col.shade);
    }
  }
  // --- stripes / trims
  if (o.stripe && !back && !o.over) {
    const sc = ramp(o.stripe);
    if (ch.outfit.name === 'track') { px(B, x0, y0 + 2, sc.base); for (let j = 1; j < h; j++) { px(B, x0 + 0, y0 + j, sc.base); px(B, x1, y0 + j, sc.shade); } }
    else if (o.neck === 'collar') { row(B, y0 + 3, x0, x1, sc.base); }
    else row(B, y0 + 3, x0, x1, sc.base);
  } else if (o.stripe && back && !o.over && ch.outfit.name !== 'track') row(B, y0 + 3, x0, x1, ramp(o.stripe).base);
  if (o.trim && !o.over && o.neck !== 'collar') { row(B, y0 + h - 1, x0, x1, ramp(o.trim).base); }
  if (o.extra === 'pocket' && !back) { row(B, y0 + 4, mid0 - 1, mid1 + 1, T.shade); px(B, mid0 - 1, y0 + 3, T.shade); px(B, mid1 + 1, y0 + 3, T.shade); }
  // --- overalls
  if (o.overalls) {
    const ob = ramp(o.bottom.color);
    if (!back) {
      shaded(B, mid0 - 1, y0 + 2, 4, h - 2, ob);
      px(B, mid0 - 1, y0, ob.base); px(B, mid1 + 1, y0, ob.base); px(B, mid0 - 1, y0 + 1, ob.base); px(B, mid1 + 1, y0 + 1, ob.base);
      px(B, mid0 - 1, y0 + 2, ob.light); px(B, mid1 + 1, y0 + 2, ob.light);
      px(B, mid0, y0 + 3, ramp(o.accent).light); px(B, mid1, y0 + 3, ramp(o.accent).light);
    } else {
      row(B, y0 + 2, x0, x1, ob.base); for (let j = 3; j < h; j++) row(B, y0 + j, x0, x1, ob.base);
      px(B, mid0 - 1, y0, ob.base); px(B, mid1 + 1, y0, ob.base); px(B, mid0 - 1, y0 + 1, ob.base); px(B, mid1 + 1, y0 + 1, ob.base);
    }
  }
  // --- over layers
  const over = o.over;
  if (over) {
    const O = ramp(o.overColor);
    const long = o.overLen === 'long';
    const rowsN = long ? h + 2 : h;
    if (over === 'blazer' || over === 'suit' || over === 'cardigan') {
      for (let j = 0; j < rowsN; j++) {
        const y = y0 + j;
        if (back) { row(B, y, x0, x1, j === rowsN - 1 ? O.shade : O.base); px(B, x1, y, O.shade); px(B, x0, y, O.light); }
        else {
          const lap = 2;
          for (let x = x0; x < x0 + lap + (w > 6 ? 1 : 0); x++) B.set(x, y, O.base);
          for (let x = x1 - lap - (w > 6 ? 1 : 0) + 1; x <= x1; x++) B.set(x, y, O.shade);
          if (j === rowsN - 1) { row(B, y, x0, x1, O.shade); }
        }
      }
      if (!back) {
        px(B, x0, y0 + 1, O.light); px(B, x0, y0 + 2, O.light);
        for (let j = 0; j < 2; j++) { px(B, mid0 - 0, y0 + j, S.shade); }
        // shirt inside: centre
        const inside = ramp(o.shirt);
        for (let j = 1; j < h - 1; j++) { px(B, mid0, y0 + j, inside.base); px(B, mid1, y0 + j, inside.shade); }
        px(B, mid0, y0, S.base); px(B, mid1, y0, S.shade); px(B, mid0 + 0, y0 + 1, inside.light);
        px(B, mid0 - 1, y0 + 1, O.dark); px(B, mid1 + 1, y0 + 1, O.dark);
        if (over === 'cardigan') { for (let j = 2; j < h - 1; j += 2) px(B, mid1, y0 + j, ramp(o.accent).light); }
        else if (over === 'suit' && o.trim) { for (let j = 2; j < h - 1; j += 2) px(B, mid0 - 1, y0 + j, ramp(o.trim).light); }
        if (o.vest) { const V = ramp(o.vest); for (let j = 2; j < h; j++) { px(B, mid0, y0 + j, V.base); px(B, mid1, y0 + j, V.shade); } }
      }
    } else if (over === 'jacket' || over === 'trackjacket' || over === 'coat' || over === 'labcoat') {
      for (let j = 0; j < rowsN; j++) {
        const y = y0 + j;
        const flare = long && j >= h ? 1 : 0;
        row(B, y, x0 - flare, x1 + flare, O.base);
        px(B, x1 + flare, y, O.shade); px(B, x0 - flare, y, O.light);
        if (j === rowsN - 1) row(B, y, x0 - flare, x1 + flare, over === 'coat' ? ramp(mix(o.overColor, '#fff4e0', 0.5)).base : O.shade);
      }
      if (!back) {
        // opening / zipper
        if (over === 'labcoat') {
          const inside = ramp(o.shirt);
          for (let j = 1; j < rowsN; j++) { px(B, mid0, y0 + j, j < h ? inside.base : S.base); px(B, mid1, y0 + j, j < h ? inside.shade : S.base); }
          for (let j = 1; j < rowsN; j++) { px(B, mid0 - 1, y0 + j, O.light); px(B, mid1 + 1, y0 + j, O.shade); }
          px(B, mid0, y0 + 1, O.light); px(B, mid0 - 2, y0 + 1, O.shade); px(B, mid1 + 2, y0 + 1, O.shade);
          row(B, y0 + 3, x0 + 0, x0 + 1, O.shade);
        } else {
          for (let j = 1; j < rowsN; j++) px(B, mid0, y0 + j, over === 'coat' ? O.dark : O.shade);
          if (over === 'coat') { for (let j = 1; j < rowsN; j += 2) px(B, mid1, y0 + j, ramp(o.accent).light); }
        }
        row(B, y0, x0 + 1, x1 - 1, over === 'coat' ? ramp(mix(o.overColor, '#fff4e0', 0.55)).light : O.light);
        px(B, mid0, y0, S.shade); px(B, mid1, y0, S.shade);
        if (over === 'trackjacket' || over === 'jacket') { const st = ramp(o.stripe || o.accent); px(B, x0 + 0, y0 + 2, st.base); px(B, x1, y0 + 2, st.base); for (let j = 1; j < h; j++) { px(B, x0 + 1, y0 + j, st.base); px(B, x1 - 1, y0 + j, st.shade); } }
      } else {
        row(B, y0, x0 + 1, x1 - 1, over === 'coat' ? ramp(mix(o.overColor, '#fff4e0', 0.55)).light : O.light);
      }
    }
  }
  // --- apron
  if (o.apron && !back) {
    const A = ramp(o.apron);
    shaded(B, mid0 - 1, y0 + 1, 4, h - 1, A);
    px(B, mid0 - 1, y0, A.base); px(B, mid1 + 1, y0, A.base);
    row(B, y0 + h - 1, x0, x1, A.base);
    row(B, y0 + h, x0, x1, A.base); row(B, y0 + h, x0, x1, A.base);
    px(B, x0, y0 + h, A.light); px(B, x1, y0 + h, A.shade);
    row(B, y0 + h + 1, x0, x1, A.shade);
    px(B, mid0, y0 + h + 0, A.shade); px(B, mid0 - 1, y0 + 3, A.shade); px(B, mid1 + 1, y0 + 3, A.shade);
  } else if (o.apron && back) {
    const A = ramp(o.apron);
    px(B, x0, y0 + h - 2, A.base); row(B, y0 + h - 2, x0, x1, A.base); row(B, y0 + h - 1, mid0 - 1, mid1 + 1, A.shade);
    px(B, mid0 - 1, y0 + h, A.base); px(B, mid1 + 1, y0 + h, A.base);
  }
  // --- ties & neckwear
  const tie = o.tie;
  if (tie && !back) {
    const A = ramp(tie.color);
    if (tie.kind === 'ribbon') {
      px(B, mid0 - 2, y0 + 1, A.base); px(B, mid0 - 1, y0 + 1, A.light); px(B, mid0 - 2, y0 + 2, A.shade); px(B, mid0 - 1, y0 + 2, A.base);
      px(B, mid1 + 2, y0 + 1, A.base); px(B, mid1 + 1, y0 + 1, A.light); px(B, mid1 + 2, y0 + 2, A.shade); px(B, mid1 + 1, y0 + 2, A.base);
      px(B, mid0, y0 + 1, A.base); px(B, mid1, y0 + 1, A.shade); px(B, mid0, y0 + 2, A.shade); px(B, mid1, y0 + 2, A.dark);
      px(B, mid0, y0 + 3, A.base); px(B, mid1, y0 + 3, A.shade);
    } else if (tie.kind === 'tie') {
      px(B, mid0, y0 + 1, A.light); px(B, mid1, y0 + 1, A.base);
      for (let j = 2; j < h - 1; j++) { px(B, mid0, y0 + j, A.base); px(B, mid1, y0 + j, A.shade); }
      px(B, mid0, y0 + h - 2, A.dark); px(B, mid1, y0 + h - 2, A.dark);
    } else if (tie.kind === 'brooch') {
      px(B, x1 - 1, y0 + 2, A.light); px(B, x1 - 1, y0 + 3, A.base);
      px(B, mid0, y0 + 1, A.base); px(B, mid1, y0 + 1, A.shade);
    } else if (tie.kind === 'pearls') {
      px(B, mid0 - 1, y0 + 1, C('#fff8ee')); px(B, mid0, y0 + 2, C('#ffffff')); px(B, mid1, y0 + 2, C('#f2ece0')); px(B, mid1 + 1, y0 + 1, C('#fff8ee'));
    }
  }
  if (o.trim && o.over === 'suit' && o.vest) { /* gold trim handled above */ }
  // --- scarf
  if (o.scarf) {
    const Sc = ramp(o.scarf);
    for (let x = x0; x <= x1; x++) { B.set(x, y0, ((x & 1) ? Sc.light : Sc.base)); B.set(x, y0 + 1, ((x & 1) ? Sc.base : Sc.shade)); }
    px(B, x0, y0, Sc.base); px(B, x1, y0 + 1, Sc.dark);
    if (!back) { for (let j = 2; j < 5; j++) { px(B, x0 + 1, y0 + j, j === 4 ? Sc.dark : Sc.base); px(B, x0 + 2, y0 + j, j === 2 ? Sc.light : Sc.shade); } px(B, x0 + 1, y0 + 4, Sc.light); }
    else { for (let j = 2; j < 4; j++) { px(B, x1 - 1, y0 + j, Sc.base); px(B, x1 - 2, y0 + j, Sc.shade); } }
  }
  // --- accessories on the body
  const A = ch.acc;
  if (A.has('whistle') && !back) { px(B, mid0 - 1, y0 + 1, C('#e8e8e8')); px(B, mid1 + 1, y0 + 1, C('#e8e8e8')); px(B, mid0, y0 + 2, C('#e8e8e8')); px(B, mid1, y0 + 2, C('#e8e8e8')); px(B, mid0, y0 + 3, C('#f2c24a')); px(B, mid1, y0 + 3, C('#c4902a')); }
  if (A.has('badge') && !back) { px(B, x1 - 1, y0 + 2, C('#f2c24a')); px(B, x1 - 1, y0 + 3, C('#c4902a')); }
  if (A.has('bag')) {
    const bg = ramp('#9a6a3a');
    if (back) { shaded(B, x0, y0 + 1, w, h - 1, bg); px(B, x0 + 1, y0 + 2, bg.light); row(B, y0 + 3, x0, x1, bg.shade); px(B, mid0, y0 + 3, C('#e8c46a')); px(B, mid1, y0 + 3, C('#e8c46a')); }
    else {
      for (let j = 0; j < h - 1; j++) px(B, x0 + Math.min(j, w - 2), y0 + j, bg.base);
      for (let j = 0; j < h - 1; j++) px(B, x0 + Math.min(j, w - 2), y0 + j, j % 2 ? bg.shade : bg.base);
    }
  }
}

function drawTorsoSide(B, ch, g) {
  const o = ch.outfit, S = ch.skin;
  const wide = g.wide;
  const x0 = wide ? 5 : 6, x1 = wide ? 10 : 9, w = x1 - x0 + 1;
  const y0 = g.TT, h = g.torsoH;
  const T = ramp(o.shirt);
  if (o.swim === 'trunks') shaded(B, x0, y0, w, h, S);
  else shaded(B, x0, y0, w, h, T);
  row(B, y0, x0, x1, T.shade);
  const over = o.over;
  const long = over && o.overLen === 'long';
  if (over) {
    const O = ramp(o.overColor);
    const rowsN = long ? h + 2 : h;
    for (let j = 0; j < rowsN; j++) {
      const fl = long && j >= h ? 1 : 0;
      row(B, y0 + j, x0 - fl, x1 + fl, over === 'blazer' || over === 'suit' || over === 'cardigan' ? O.base : O.base);
      B.set(x1 + fl, y0 + j, O.shade); B.set(x0 - fl, y0 + j, O.light);
    }
    row(B, y0 + rowsN - 1, x0 - (long ? 1 : 0), x1 + (long ? 1 : 0), O.shade);
    row(B, y0, x0, x1, O.light);
    if (over === 'blazer' || over === 'suit') { px(B, x0, y0 + 1, ramp(o.shirt).base); px(B, x0, y0 + 2, ramp(o.shirt).shade); if (o.tie && o.tie.kind !== 'brooch') px(B, x0 - 0, y0 + 2, ramp(o.tie.color).base); }
  }
  if (o.apron) { const A = ramp(o.apron); shaded(B, x0 - 1, y0 + 2, 2, h, A); row(B, y0 + h, x0 - 1, x1, A.base); row(B, y0 + h + 1, x0 - 1, x1, A.shade); }
  if (o.stripe && !over) row(B, y0 + 3, x0, x1, ramp(o.stripe).base);
  if (o.overalls) { const ob = ramp(o.bottom.color); shaded(B, x0, y0 + 2, 2, h - 2, ob); px(B, x0 + 1, y0, ob.base); px(B, x0 + 1, y0 + 1, ob.base); }
  if (o.neck === 'collar' && !over) px(B, x0, y0, ramp(mix(o.shirt, '#ffffff', 0.5)).light);
  if (o.neck === 'hood') { row(B, y0, x0, x1, T.light); px(B, x1, y0 + 1, T.light); px(B, x1, y0 + 2, T.shade); }
  if (o.scarf) {
    const Sc = ramp(o.scarf);
    for (let x = x0; x <= x1; x++) { B.set(x, y0, (x & 1) ? Sc.light : Sc.base); B.set(x, y0 + 1, (x & 1) ? Sc.base : Sc.shade); }
    for (let j = 2; j < 5; j++) { px(B, x1, y0 + j, Sc.base); px(B, x1 - 1, y0 + j, Sc.shade); }
    px(B, x1, y0 + 4, Sc.light);
  }
  if (o.tie && !over && o.tie.kind === 'tie') { px(B, x0, y0 + 1, ramp(o.tie.color).base); }
  if (o.tie && over && o.tie.kind === 'ribbon') { px(B, x0, y0 + 1, ramp(o.tie.color).base); px(B, x0, y0 + 2, ramp(o.tie.color).shade); }
  const A = ch.acc;
  if (A.has('bag')) { const bg = ramp('#9a6a3a'); shaded(B, x1, y0 + 3, 3, 4, bg); row(B, y0 + 4, x1, x1 + 2, bg.shade); for (let j = 0; j < 3; j++) px(B, x0 + 1 + j, y0 + 1 + j, bg.base); px(B, x1 + 1, y0 + 5, C('#e8c46a')); }
  if (A.has('whistle')) { px(B, x0, y0 + 2, C('#e8e8e8')); px(B, x0, y0 + 3, C('#f2c24a')); }
  if (A.has('badge')) { px(B, x0, y0 + 2, C('#f2c24a')); }
}

function drawArmSide(B, ch, g, swing, mode) {
  const o = ch.outfit, S = ch.skin;
  const sleeveBase = o.over && o.sleeve !== 'none' ? o.overColor : o.shirt;
  const SL = ramp(sleeveBase);
  const x = (g.wide ? 7 : 7) + swing; // arm column
  const sy = g.TT + 1;
  const len = o.sleeve === 'long' ? 4 : o.sleeve === 'short' ? 2 : 0;
  let pts;
  if (mode === 'cheer') pts = [[0, 0], [-1, -1], [-1, -2], [-1, -3], [-1, -4], [-1, -5]];
  else if (mode === 'happy') pts = [[0, 0], [-1, 0], [-2, -1], [-2, -2]];
  else if (mode === 'wide') pts = [[0, 0], [-1, 0], [-2, 0], [-3, 0]];
  else pts = [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]];
  pts.forEach(([dx, dy], i) => {
    let c = S.base;
    if (!o.swim && i < len) c = (i === len - 1) ? SL.shade : SL.base;
    if (o.sleeve === 'long' && i === len - 1) c = SL.shade;
    B.set(x + dx, sy + dy, c);
  });
  // front arm slightly darker edge
}

// ------------------------------------------------------------------ frame assembly
function drawStanding(ch, view, kind) {
  const g = makeGeom(ch, kind);
  const back = new PixelBuffer(FW, FH);
  const body = new PixelBuffer(FW, FH);
  const bhair = drawBackHair(ch, view, g);

  let st = {};
  let armL = 'hang', armR = 'hang';
  if (kind === 'stepA') { st = { liftL: 1, legSwing: -1, liftFront: 1 }; armL = 'up'; armR = 'down'; }
  if (kind === 'stepB') { st = { liftR: 1, legSwing: 1, liftBack: 1 }; armL = 'down'; armR = 'up'; }
  if (kind === 'happy') { armL = 'happy'; armR = 'happy'; }
  if (kind === 'surprised') { armL = 'wide'; armR = 'wide'; }
  if (kind === 'cheer') { armL = 'cheer'; armR = 'cheer'; }
  if (kind === 'sad') { armL = 'hang'; armR = 'hang'; }

  if (view === 'left') {
    const bt = ch.outfit.bottom.kind;
    // legs
    const stSide = kind === 'stepA' ? { legSwing: 1, liftBack: 1 } : kind === 'stepB' ? { legSwing: 1, liftFront: 1 } : {};
    drawLegsSide(body, ch, g, stSide);
    if (bt === 'skirt' || bt === 'long_skirt') drawSkirtFlare(body, ch, g, 'left', g.LT - 1);
    // far arm behind torso, near arm after
    drawTorsoSide(body, ch, g);
    const swing = kind === 'stepA' ? -1 : kind === 'stepB' ? 1 : 0;
    const mode = kind === 'happy' ? 'happy' : kind === 'surprised' ? 'wide' : kind === 'cheer' ? 'cheer' : 'hang';
    drawArmSide(body, ch, g, swing, mode);
  } else {
    const bt = ch.outfit.bottom.kind;
    drawLegsFront(body, ch, g, st, view);
    if (bt === 'skirt' || bt === 'long_skirt') drawSkirtFlare(body, ch, g, view, g.LT - 1);
    drawTorsoFront(body, ch, g, view);
    drawArm(body, ch, g, 'L', armL, view);
    drawArm(body, ch, g, 'R', armR, view);
    if (ch.outfit.apron && !ch.outfit.over) { /* apron drawn in torso */ }
  }
  body.outline();
  const head = drawHead(ch, view, kind === 'stepA' || kind === 'stepB' || kind === 'stand' ? 'neutral' : kind, g);
  const out = new PixelBuffer(FW, FH);
  out.blit(bhair);
  out.blit(body);
  out.blit(head);
  return out;
}

function drawSitting(ch, view) {
  const g = makeGeom(ch, 'sit');
  const o = ch.outfit, S = ch.skin;
  const body = new PixelBuffer(FW, FH);
  const bhair = drawBackHair(ch, view, g);
  const P = ramp(o.bottom.color), shoes = ramp(o.shoes);
  const bt = o.bottom.kind;
  const thigh = (bt === 'shorts' || bt === 'skirt' || bt === 'trunks') && bt !== 'long_skirt';
  const legCol = bt === 'skirt' || bt === 'long_skirt' || bt === 'pants' || bt === 'shorts' || bt === 'trunks' ? P : P;
  const y0 = g.TT;
  const topH = 5;
  if (view === 'left') {
    const gg = { ...g, torsoH: topH };
    drawTorsoSide(body, ch, gg);
    // thigh forward
    for (let x = 2; x <= 9; x++) { body.set(x, 20, x >= 8 ? P.base : P.light === 0 ? P.base : P.base); body.set(x, 21, P.shade); }
    row(body, 20, 3, 9, P.base); row(body, 21, 3, 9, P.shade);
    // lower leg + shoe
    for (let y = 21; y <= 22; y++) { body.set(3, y, thigh ? S.base : P.base); body.set(4, y, thigh ? S.shade : P.shade); }
    row(body, 22, 2, 4, shoes.base); body.set(2, 22, shoes.light); row(body, 22, 3, 4, shoes.shade);
    drawArmSide(body, ch, gg, 0, 'sit');
  } else if (view === 'up') {
    const gg = { ...g, torsoH: 7 };
    drawTorsoFront(body, ch, gg, 'up');
    drawArm(body, ch, gg, 'L', 'sit', 'up'); drawArm(body, ch, gg, 'R', 'sit', 'up');
    row(body, 22, g.tx0, g.tx0 + 1, shoes.base); row(body, 22, g.tx1 - 1, g.tx1, shoes.base);
  } else {
    const gg = { ...g, torsoH: topH };
    drawTorsoFront(body, ch, gg, 'down');
    drawArm(body, ch, gg, 'L', 'sit', 'down'); drawArm(body, ch, gg, 'R', 'sit', 'down');
    const x0 = g.tx0, x1 = g.tx1;
    const cover = bt === 'long_skirt' || bt === 'skirt' || bt === 'pants' || bt === 'shorts' || bt === 'trunks';
    for (let y = 20; y <= 21; y++) {
      row(body, y, x0, x1, y === 20 ? P.base : P.shade);
      body.set(x0, y, P.light); body.set(7, y, P.shade); body.set(8, y, P.dark);
    }
    if (thigh) { /* bare knees on skirts/shorts */ for (const x of [x0 + 1, x0 + 2, x1 - 2, x1 - 1]) body.set(x, 21, S.base); }
    for (const [a, b] of [[x0, 7], [8, x1]]) { row(body, 22, a, b, shoes.base); body.set(a, 22, shoes.light); body.set(b, 22, shoes.shade); }
    if (bt === 'skirt' || bt === 'long_skirt') { /* flare */ row(body, 20, x0 - 1, x1 + 1, P.base); body.set(x0 - 1, 20, P.light); body.set(x1 + 1, 20, P.shade); }
  }
  body.outline();
  const head = drawHead(ch, view, 'neutral', g);
  const out = new PixelBuffer(FW, FH);
  out.blit(bhair); out.blit(body); out.blit(head);
  return out;
}

function drawSleeping(ch) {
  const out = new PixelBuffer(FW, FH);
  const o = ch.outfit, S = ch.skin;
  const T = ramp(o.shirt), P = ramp(o.bottom.color);
  const body = new PixelBuffer(FW, FH);
  // body under blanket-like shirt colours, lying to the right
  const hy = 14;
  shaded(body, 8, hy, 7, 7, T);
  row(body, hy + 4, 8, 14, T.shade);
  for (let y = hy; y < hy + 7; y++) body.set(14, y, T.shade);
  row(body, hy, 9, 13, T.light);
  const acc = ramp(o.trim || o.accent || '#ffffff');
  row(body, hy + 2, 8, 14, mix(T.base, acc.base, 0.55));
  // feet
  body.set(15, hy + 5, S.base); body.set(15, hy + 6, S.shade); body.set(15, hy + 4, S.base);
  body.outline();
  // head (lying, seen from above/front), left
  const head = new PixelBuffer(FW, FH);
  const cx = 5, cy = 17;
  head.ellipse(cx, cy, 5.2, 4.8, S.base);
  const hairR = ch.hair.ramp;
  const style = ch.hair.style;
  if (style !== 'bald') {
    // hair: cap on the top half and back (left)
    head.ellipse(cx - 0.5, cy - 1.2, 5.4, 4.2, hairR.base, (x, y) => (y < cy - 1 ? hairR.light : hairR.base));
    for (let x = 0; x < 9; x++) for (let y = cy - 5; y <= cy; y++) { /* fringe */ }
    // fringe drips
    for (const dx of [-3, -1, 1, 3]) head.set(cx + dx, cy, hairR.shade);
    head.set(cx - 4, cy + 1, hairR.base); head.set(cx - 4, cy + 2, hairR.shade);
    if (['long', 'wavy', 'braid', 'sidebraid', 'twintails', 'ponytail'].includes(style)) { head.rect(0, cy - 2, 2, 7, hairR.base); head.set(0, cy + 4, hairR.shade); head.set(1, cy + 4, hairR.shade); }
  }
  head.rect(cx - 3, cy + 1, 7, 3, S.base);
  head.set(cx - 3, cy + 3, S.shade);
  row(head, cy + 4, cx - 2, cx + 2, S.shade);
  // closed eyes
  const dk = ch.eyes.dark;
  head.set(cx - 2, cy + 2, dk); head.set(cx - 1, cy + 2, dk); head.set(cx + 1, cy + 2, dk); head.set(cx + 2, cy + 2, dk);
  head.set(cx - 3, cy + 3, mix(S.base, '#ff8f8f', 0.5)); head.set(cx + 3, cy + 3, mix(S.base, '#ff8f8f', 0.5));
  head.set(cx, cy + 3, ch.eyes.dark); // tiny mouth
  head.set(cx, cy + 3, mix(S.shade, '#a8403f', 0.6));
  // accessories (glasses off, headband on)
  if (ch.acc.has('glasses') || ch.acc.has('round_glasses')) { head.set(cx + 4, cy + 1, C('#3a3040')); }
  if (ch.acc.has('freckles')) { head.set(cx - 2, cy + 3, mix(S.base, '#7a3a1a', 0.5)); head.set(cx + 2, cy + 3, mix(S.base, '#7a3a1a', 0.5)); }
  if (ch.acc.has('beard')) row(head, cy + 4, cx - 2, cx + 2, hairR.base);
  if (ch.acc.has('mustache')) row(head, cy + 3, cx - 1, cx + 1, hairR.shade);
  head.outline();
  // pillow hint (soft) below the head
  const pillow = new PixelBuffer(FW, FH);
  out.blit(pillow);
  out.blit(body);
  out.blit(head);
  return out;
}

/**
 * Render one 16x24 frame. view: down|left|right|up (right = mirrored left)
 * kind: stand|stepA|stepB|happy|sad|surprised|cheer|sleep|sit
 */
export function renderSpriteFrame(ch, view, kind) {
  if (kind === 'sleep') return drawSleeping(ch);
  if (view === 'right') return renderSpriteFrame(ch, 'left', kind).flipH();
  if (kind === 'sit') return drawSitting(ch, view);
  return drawStanding(ch, view, kind);
}
