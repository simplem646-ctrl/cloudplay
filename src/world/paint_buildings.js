// Building painters: roofs, walls, windows, doors, awnings, plaques, chimneys, stairs, bridges, cliffs.
import { Canvas, mix, shade, outline, hash2, SNOW, snowCaps, snowPatches } from './paint_common.js';

// ------------------------------------------------------------------ palettes
export const ROOF = {
  red: '#c9483c', blue: '#4a78b8', green: '#4d9a5c', slate: '#4b5a78', brown: '#8d5a38', orange: '#e0803c', purple: '#8a5aa8', teal: '#3f9a98',
};
export const WALLS = {
  cream: '#f2e2b8', pink: '#f4c4c0', blue: '#bcd8ee', yellow: '#f6dc88', brick: '#b5503c', stone: '#bdb7a8',
  wood: '#a56c3c', white: '#f4f0e6', green: '#b8dca8', timber: '#f0e4c4',
};
export const DOORS = {
  wood: '#a8683a', red: '#c0453a', blue: '#3f78b8', green: '#3f9a5a', yellow: '#e8b83c', white: '#f0ece0', glass: '#bfe6f6', grand: '#6a3f28',
};
export const AWNING = { red: '#d8453a', green: '#3f9a5a', blue: '#3f78b8', yellow: '#f0b83c', orange: '#f08a3c', purple: '#8a5aa8' };

// ------------------------------------------------------------------ roofs
export function roof(T, ctx, color, part) {
  const base = ROOF[color];
  const L = shade(base, 0.3), D = shade(base, -0.3), O = shade(base, -0.62), M = base;
  const winter = ctx.S.winter;
  const [pr, pc] = [part[0], part.slice(1)]; // unused; parts are explicit names
  const top = part === 'tl' || part === 't' || part === 'tr';
  const bot = part === 'bl' || part === 'b' || part === 'br';
  const lft = part === 'tl' || part === 'ml' || part === 'bl';
  const rgt = part === 'tr' || part === 'mr' || part === 'br';
  // shingle courses 4px tall, alternating offset
  for (let y = 0; y < 16; y++) {
    const course = y >> 2, ly = y & 3, off = course % 2 ? 4 : 0;
    for (let x = 0; x < 16; x++) {
      const lx = (x + off) & 7;
      let c = M;
      if (ly === 0) c = L;
      else if (ly === 3) c = D;
      if (lx === 7) c = D;
      if (lx === 0 && ly > 0 && ly < 3) c = shade(M, 0.14);
      if (ly === 3 && (lx === 3 || lx === 4)) c = O === M ? D : shade(D, -0.12); // scallop shadow
      if (hash2(x, y, 11 + color.length) > 0.93 && ly > 0 && ly < 3) c = shade(M, 0.1);
      T.px(x, y, c);
    }
  }
  if (top) { // ridge cap
    T.hline(0, 0, 16, O);
    T.hline(0, 1, 16, shade(base, 0.45));
    T.hline(0, 2, 16, L);
    T.hline(0, 3, 16, D);
    for (let x = 0; x < 16; x += 8) { T.px(x + 3, 1, shade(base, 0.6)); }
  }
  if (bot) { // eave: dark underside + thick edge
    T.hline(0, 13, 16, D);
    T.hline(0, 14, 16, O);
    T.hline(0, 15, 16, shade(O, -0.2));
    for (let x = 0; x < 16; x++) if (x % 8 === 3 || x % 8 === 4) T.px(x, 14, shade(D, -0.2));
  }
  if (lft) { T.vline(0, 0, 16, O); T.vline(1, 0, 16, shade(base, 0.2)); }
  if (rgt) { T.vline(15, 0, 16, O); T.vline(14, 0, 16, D); }
  if (top && lft) { T.px(0, 0, null); T.px(1, 0, null); T.px(0, 1, null); T.px(0, 0, null); T.px(1, 0, O); }
  if (top && rgt) { T.px(15, 0, null); T.px(14, 0, O); T.px(15, 1, null); }
  if (winter) roofSnow(T, ctx, top, bot, lft, rgt);
}

function roofSnow(T, ctx, top, bot, lft, rgt) {
  // snow blanket: thick on the ridge, thinning toward the eave with a drippy lower edge
  const depth = top ? 13 : 9;
  for (let x = 0; x < 16; x++) {
    const drip = ((x * 7 + 3) % 5 === 0 ? 2 : (x % 3 === 0 ? 1 : 0));
    const lim = bot ? 8 + (x % 4 === 1 ? 1 : 0) : depth + drip;
    for (let y = top ? 1 : 0; y < lim; y++) {
      if (T.alpha(x, y) === 0 && y < 2) continue;
      let c = y === (top ? 1 : 0) ? SNOW.l : (y > lim - 3 ? SNOW.s : SNOW.m);
      if ((x + y) % 5 === 0 && y > 2) c = SNOW.s;
      if (y === lim - 1) c = SNOW.d;
      T.px(x, y, c);
    }
  }
  if (bot) { // icicles
    for (let x = 1; x < 16; x += 4) { T.px(x, 13, '#dff3ff'); T.px(x, 14, '#bfe6f6'); }
    T.hline(0, 10, 16, 'rgba' && SNOW.s);
  }
  if (lft) T.vline(0, 0, bot ? 11 : 16, SNOW.d);
  if (rgt) T.vline(15, 0, bot ? 11 : 16, SNOW.d);
  if (top) T.hline(0, 0, 16, SNOW.s);
  if (T.alpha(0, 0) === 0) T.px(0, 0, null);
}

export function chimneyBase(T, ctx, color) {
  // top row of a roof with a chimney stack rising from it (stack continues in chimneyTop above)
  roof(T, ctx, color, 't');
  const b = '#b5503c';
  T.rect(5, 0, 7, 11, b);
  T.vline(5, 0, 11, shade(b, -0.6)); T.vline(11, 0, 11, shade(b, -0.6));
  T.vline(6, 0, 11, shade(b, 0.2)); T.vline(10, 0, 11, shade(b, -0.25));
  for (let y = 1; y < 11; y += 3) T.hline(6, y, 5, shade(b, -0.35));
  T.hline(5, 11, 7, shade(b, -0.6)); T.hline(6, 12, 5, 'rgba' && shade(b, -0.3));
  if (ctx.S.winter) { T.hline(5, 0, 7, SNOW.l); }
}

export function chimneyTop(T, ctx, kind, frame = 0) {
  const b = kind === 'stone' ? '#a9a498' : '#b5503c';
  T.rect(5, 8, 7, 8, b);
  T.vline(5, 8, 8, shade(b, -0.6)); T.vline(11, 8, 8, shade(b, -0.6));
  T.vline(6, 8, 8, shade(b, 0.2)); T.vline(10, 8, 8, shade(b, -0.25));
  for (let y = 9; y < 16; y += 3) T.hline(6, y, 5, shade(b, -0.35));
  // cap
  T.rect(4, 6, 9, 3, shade(b, 0.1)); T.hline(4, 6, 9, shade(b, 0.4)); T.hline(4, 8, 9, shade(b, -0.5));
  T.px(4, 7, shade(b, -0.5)); T.px(12, 7, shade(b, -0.5));
  if (ctx.S.winter) T.hline(4, 5, 9, SNOW.l), T.hline(5, 6, 7, SNOW.m);
  // smoke puffs
  const puffs = [[8, 3 - frame * 2, 2.2], [9 + (frame % 2), 0 - frame * 2, 2.8], [7, 4, 1.4]];
  const a = 0.85 - frame * 0.2;
  const fy = frame * 2;
  [[8, 4 - fy % 4, 2.2], [9 + (frame & 1), 1 - fy % 4, 2.6]].forEach(([x, y, r], i) => {
    if (y < -2) return;
    T.disc(x, y, r, '#f3f3f6', Math.floor(220 * Math.max(0.3, a - i * 0.15)));
    T.disc(x - 0.5, y - 0.5, r * 0.6, '#ffffff', 200);
  });
}

// ------------------------------------------------------------------ walls
function wallBody(T, ctx, style, part) {
  const base = WALLS[style];
  const L = shade(base, 0.25), D = shade(base, -0.18), DD = shade(base, -0.42);
  if (style === 'brick') {
    T.rect(0, 0, 16, 16, shade(base, -0.5));
    for (let row = 0; row < 4; row++) {
      const off = row % 2 ? 4 : 0;
      for (let bx = -1; bx < 3; bx++) {
        const x0 = bx * 8 + off, c = hash2(bx + (off ? 3 : 0), row, 5) > 0.5 ? base : shade(base, -0.1);
        for (let j = 0; j < 3; j++) for (let i = 0; i < 7; i++) T.px(x0 + i, row * 4 + j, j === 0 ? shade(c, 0.2) : c);
      }
    }
    return;
  }
  if (style === 'stone') {
    T.rect(0, 0, 16, 16, '#8e887a');
    [0, 8].forEach((y0, ri) => {
      const cuts = ri ? [0, 5, 16] : [0, 10, 16];
      for (let k = 0; k < cuts.length - 1; k++) {
        const c = hash2(k, ri, 7) > 0.5 ? base : shade(base, -0.1);
        for (let y = y0; y < y0 + 7; y++) for (let x = cuts[k]; x < cuts[k + 1] - 1; x++) T.px(x, y, y === y0 ? shade(c, 0.22) : c);
      }
    });
    return;
  }
  if (style === 'wood') {
    T.rect(0, 0, 16, 16, base);
    for (let y = 0; y < 16; y += 4) { T.hline(0, y, 16, shade(base, 0.2)); T.hline(0, y + 3, 16, shade(base, -0.4)); T.hline(0, y + 2, 16, D); }
    for (let i = 0; i < 6; i++) T.px((hash2(i, 2, 2) * 16) | 0, ((hash2(i, 3, 2) * 4) | 0) * 4 + 1, shade(base, -0.3));
    return;
  }
  // plaster family: dithered soft texture
  T.rect(0, 0, 16, 16, base);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const h = hash2(x, y, 3 + style.length);
    if (h > 0.93) T.px(x, y, L); else if (h < 0.06) T.px(x, y, D);
  }
  if (style === 'timber') {
    const beam = '#6a4a30';
    T.vline(0, 0, 16, shade(beam, -0.3)); T.vline(1, 0, 16, beam); T.vline(2, 0, 16, shade(beam, 0.2));
    T.vline(13, 0, 16, shade(beam, 0.2)); T.vline(14, 0, 16, beam); T.vline(15, 0, 16, shade(beam, -0.3));
    for (let i = 0; i < 8; i++) T.px(3 + i, 2 + i, beam), T.px(3 + i, 3 + i, shade(beam, -0.2));
  }
}

export function wall(T, ctx, style, part) {
  wallBody(T, ctx, style, part);
  const base = WALLS[style];
  if (part === 'eave') { // shadow under the roof overhang
    for (let y = 0; y < 5; y++) T.hline(0, y, 16, '#1d2340', [90, 55, 30, 18, 8][y]);
  }
  if (part === 'base') {
    const st = '#9a9486';
    T.rect(0, 11, 16, 5, st);
    T.hline(0, 11, 16, shade(st, 0.3));
    for (let x = 0; x < 16; x++) { if (x % 8 === 0 || (x + 4) % 8 === 0) T.vline(x, 12, 4, shade(st, -0.35)); }
    T.hline(0, 14, 16, shade(st, -0.3)); T.hline(0, 15, 16, shade(st, -0.5));
    for (let x = 0; x < 16; x++) if (hash2(x, 1, 8) > 0.7) T.px(x, 12 + (x % 2), shade(st, 0.15));
    if (ctx.S.winter) { T.hline(0, 14, 16, SNOW.m); T.hline(0, 15, 16, SNOW.l); for (let x = 0; x < 16; x += 3) T.px(x, 13, SNOW.m); T.hline(0, 12, 16, null); }
    else if (ctx.season === 'spring' || ctx.season === 'summer') for (let x = 2; x < 16; x += 5) { T.px(x, 15, ctx.S.grassL); T.px(x + 1, 14, ctx.S.grass); }
  }
}

// ------------------------------------------------------------------ windows
export function win(T, ctx, style, kind) {
  wallBody(T, ctx, style, 'mid');
  const frame = '#f7f3ea', frameD = '#c9bfa8', frameO = shade(WALLS[style], -0.62);
  const lit = kind === 'lit';
  // window rect
  const x0 = 3, y0 = 2, w = 10, h = 10;
  T.rect(x0 - 1, y0 - 1, w + 2, h + 2, frameO);
  T.rect(x0, y0, w, h, frame);
  const gx = x0 + 1, gy = y0 + 1, gw = w - 2, gh = h - 2;
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
    let c;
    if (lit) c = j < gh / 2 ? '#fff0a8' : '#ffd25a';
    else c = j < 3 ? '#cdeefc' : (j < gh - 2 ? '#a8d8f0' : '#8bc4e6');
    T.px(gx + i, gy + j, c);
  }
  // cross bars
  T.vline(gx + (gw >> 1) - 0, gy, gh, frame); T.hline(gx, gy + (gh >> 1), gw, frame);
  T.vline(gx + (gw >> 1) + 1, gy, gh, frameD);
  if (!lit) { T.px(gx, gy, '#ffffff'); T.px(gx + 1, gy, '#ffffff'); T.px(gx, gy + 1, '#ffffff'); T.px(gx + gw - 2, gy + gh - 3, '#e8faff'); }
  else { T.px(gx + 1, gy + gh - 2, '#c8782c'); T.px(gx + gw - 2, gy + gh - 2, '#c8782c'); }
  // sill
  T.hline(x0 - 2, y0 + h, w + 4, '#d8d2c2'); T.hline(x0 - 2, y0 + h + 1, w + 4, '#8e887a');
  if (kind === 'shut') {
    const sh = style === 'blue' ? '#3f78b8' : (style === 'green' ? '#2f7a4a' : '#3f9a5a');
    for (const sx of [0, 13]) {
      T.rect(sx, y0 - 1, 3, h + 2, sh); T.vline(sx, y0 - 1, h + 2, shade(sh, -0.55)); T.vline(sx + 2, y0 - 1, h + 2, shade(sh, -0.3));
      for (let y = y0; y < y0 + h; y += 2) T.px(sx + 1, y, shade(sh, 0.3));
    }
  }
  if (kind === 'box') {
    T.rect(x0 - 2, y0 + h + 1, w + 4, 3, '#7a4f2e'); T.hline(x0 - 2, y0 + h + 1, w + 4, '#a56c3c'); T.hline(x0 - 2, y0 + h + 3, w + 4, '#3b2a1f');
    const cols = ctx.S.winter ? ['#ffffff', '#dce9f6'] : ctx.S.bloom;
    for (let i = 0; i < 7; i++) {
      const fx = x0 - 1 + i * 2 - (i > 3 ? 0 : 0);
      const c = cols[i % cols.length];
      T.px(fx, y0 + h, ctx.S.winter ? SNOW.m : '#3f9a3c'); T.px(fx, y0 + h - 1, c);
      if (!ctx.S.winter) T.px(fx + 1, y0 + h, '#5bbf45');
    }
  }
  if (ctx.S.winter) { T.hline(x0 - 1, y0 - 1, w + 2, SNOW.l); }
}

// ------------------------------------------------------------------ doors
export function door(T, ctx, color, part, side = 'm') {
  const base = DOORS[color];
  const O = shade(base, -0.62);
  const grand = color === 'grand';
  const frame = grand ? '#e8dcc0' : '#f7f3ea', frameD = grand ? '#b8a880' : '#cfc6b0';
  const hi = part === 'hi';
  T.rect(0, 0, 16, 16, grand ? '#d8ccaa' : mix(frame, '#8a7a5a', 0.15));
  // frame uprights
  T.vline(0, 0, 16, frameD); T.vline(15, 0, 16, frameD);
  if (color === 'glass') {
    T.rect(2, hi ? 2 : 0, 12, hi ? 14 : 14, O);
    T.rect(3, hi ? 3 : 0, 10, hi ? 13 : 13, '#a8d8f0');
    for (let y = hi ? 3 : 0; y < (hi ? 16 : 13); y++) for (let x = 3; x < 13; x++) if (((x + y) % 7 === 0) || ((x + y) % 7 === 1 && y % 2 === 0)) T.px(x, y, '#e8faff');
    T.vline(8, hi ? 3 : 0, hi ? 13 : 13, frame);
    if (hi) { T.hline(2, 2, 12, frame); T.rect(5, 0, 6, 2, '#f0b83c'); T.px(6, 0, '#fff0a8'); } // transom bell bracket
    else { T.px(7, 7, '#f0b83c'); T.px(9, 7, '#f0b83c'); T.hline(2, 13, 12, '#8a8272'); }
  } else {
    const dx0 = 2, dw = 12;
    if (hi) {
      T.rect(dx0, 3, dw, 13, O);
      T.rect(dx0 + 1, 4, dw - 2, 12, base);
      T.hline(dx0 + 1, 4, dw - 2, shade(base, 0.3));
      T.vline(dx0 + 1, 4, 12, shade(base, 0.2));
      T.vline(dx0 + dw - 2, 4, 12, shade(base, -0.3));
      // arch top
      T.px(dx0, 3, null); T.px(dx0 + dw - 1, 3, null); T.px(dx0 + 1, 3, O);
      T.rect(5, 6, 6, 6, shade(base, -0.2)); T.frame(5, 6, 6, 6, O); T.rect(6, 7, 4, 4, shade(base, grand ? -0.1 : 0.06));
      T.hline(6, 7, 4, shade(base, 0.3));
      if (grand) { T.rect(5, 6, 6, 1, '#d8a040'); }
      T.hline(2, 2, 12, frame); T.hline(2, 1, 12, frameD); T.hline(1, 0, 14, shade(frameD, -0.3));
      T.px(7, 0, '#f0b83c');
    } else {
      T.rect(dx0, 0, dw, 14, O);
      T.rect(dx0 + 1, 0, dw - 2, 14, base);
      T.vline(dx0 + 1, 0, 14, shade(base, 0.2));
      T.vline(dx0 + dw - 2, 0, 14, shade(base, -0.3));
      T.rect(5, 2, 6, 5, shade(base, -0.2)); T.frame(5, 2, 6, 5, O); T.rect(6, 3, 4, 3, shade(base, 0.06));
      T.hline(6, 3, 4, shade(base, 0.3));
      T.rect(5, 9, 6, 4, shade(base, -0.15)); T.frame(5, 9, 6, 4, O); T.rect(6, 10, 4, 2, shade(base, 0.05));
      const kx = side === 'l' ? 11 : 4;
      T.px(kx + 0, 8, '#f6d060'); T.px(kx + 1, 8, '#c8902c');
      // step + mat
      T.hline(1, 14, 14, '#bdb7a8'); T.hline(1, 15, 14, '#8e887a'); T.hline(2, 14, 12, '#d8d2c2');
      T.rect(4, 14, 8, 1, '#a0453a'); T.rect(4, 15, 8, 1, '#7a3028');
    }
    if (side === 'l' && !hi) { /* grand double door seam on the right edge of the left leaf handled by knob side */ }
  }
  if (ctx.S.winter && hi) { T.hline(1, 0, 14, SNOW.l); }
}

// ------------------------------------------------------------------ awnings, plaques
export function awning(T, ctx, color, part) {
  const c = AWNING[color], O = shade(c, -0.55);
  const x0 = part === 'l' ? 1 : 0, x1 = part === 'r' ? 14 : 15;
  for (let x = x0; x <= x1; x++) {
    const stripe = (x >> 2) % 2 === 0;
    const col = stripe ? c : '#f7f3ea';
    const colD = stripe ? shade(c, -0.25) : '#d8d0bc';
    const colL = stripe ? shade(c, 0.25) : '#ffffff';
    const scallop = ((x & 3) === 0 || (x & 3) === 3) ? 8 : 9;
    T.px(x, 0, O);
    T.px(x, 1, colL); T.px(x, 2, colL);
    for (let y = 3; y < scallop; y++) T.px(x, y, y > scallop - 3 ? colD : col);
    T.px(x, scallop, O);
    // drop shadow under the awning
    for (let y = scallop + 1; y < scallop + 4; y++) T.px(x, y, '#1d2340', [70, 40, 20][y - scallop - 1]);
  }
  if (part === 'l') { T.vline(0, 1, 9, O); }
  if (part === 'r') { T.vline(15, 1, 9, O); }
  if (ctx.S.winter) { for (let x = x0; x <= x1; x++) { T.px(x, 0, SNOW.l); T.px(x, 1, SNOW.m); if ((x * 7) % 5 === 0) T.px(x, 2, SNOW.s); } }
}

const ICONS = {
  bread: (T) => { T.ellipse(8, 8, 5, 3, '#8a5028'); T.ellipse(8, 7.5, 4.4, 2.5, '#d89a4a'); T.px(6, 7, '#f6c878'); T.px(8, 6, '#f6c878'); T.px(10, 7, '#f6c878'); T.hline(5, 9, 6, '#a86a30'); },
  flower: (T) => { for (const [x, y] of [[8, 5], [6, 7], [10, 7], [8, 9], [7, 6], [9, 6]]) T.px(x, y, '#f58ab4'); T.px(8, 7, '#ffd23f'); T.px(7, 7, '#ffd23f'); T.vline(8, 10, 3, '#3f9a3c'); T.px(9, 11, '#5bbf45'); },
  book: (T) => { T.rect(4, 5, 8, 7, '#2f5a8a'); T.rect(5, 5, 6, 6, '#f7f3ea'); T.vline(8, 5, 6, '#c9bfa8'); T.hline(5, 7, 2, '#8a8272'); T.hline(9, 7, 2, '#8a8272'); T.hline(5, 9, 2, '#8a8272'); T.hline(9, 9, 2, '#8a8272'); },
  mart: (T) => { T.rect(4, 6, 8, 5, '#d8453a'); T.hline(4, 6, 8, '#ff8070'); T.rect(5, 4, 6, 2, '#d8453a'); T.frame(5, 4, 6, 2, '#a02a22'); T.disc(5.5, 12, 1.1, '#3b2a1f'); T.disc(10.5, 12, 1.1, '#3b2a1f'); T.hline(5, 8, 6, '#f7f3ea'); },
  clinic: (T) => { T.rect(4, 4, 8, 8, '#f7f3ea'); T.rect(7, 5, 2, 6, '#d8453a'); T.rect(5, 7, 6, 2, '#d8453a'); T.frame(4, 4, 8, 8, '#b8b0a0'); },
  cafe: (T) => { T.rect(5, 6, 5, 5, '#f7f3ea'); T.frame(5, 6, 5, 5, '#8a8272'); T.px(10, 7, '#8a8272'); T.px(11, 8, '#8a8272'); T.px(10, 9, '#8a8272'); T.hline(5, 7, 5, '#7a4f2e'); T.px(6, 4, '#f0f0f0'); T.px(8, 3, '#f0f0f0'); T.px(7, 5, '#f0f0f0'); },
  hall: (T) => { T.disc(8, 8, 4.4, '#8a6a20'); T.disc(8, 8, 3.6, '#f7f3ea'); T.vline(8, 5, 4, '#3b2a1f'); T.hline(8, 8, 3, '#3b2a1f'); },
  fish: (T) => { T.ellipse(7.5, 8, 4, 2.4, '#7fb6d8'); T.px(12, 6, '#7fb6d8'); T.px(12, 10, '#7fb6d8'); T.px(11, 7, '#7fb6d8'); T.px(11, 9, '#7fb6d8'); T.px(5, 7, '#1d2340'); T.hline(6, 9, 4, '#f7f3ea'); },
  bell: (T) => { T.ellipse(8, 8, 3.5, 3.8, '#e0a830'); T.rect(4, 10, 8, 2, '#e0a830'); T.px(8, 12, '#a87820'); T.px(8, 4, '#a87820'); T.px(6, 7, '#ffe27a'); T.hline(4, 11, 8, '#a87820'); },
  school: (T) => { T.rect(4, 6, 8, 6, '#b5503c'); T.px(8, 5, '#b5503c'); T.hline(5, 5, 6, '#b5503c'); T.rect(7, 9, 2, 3, '#f7f3ea'); T.px(8, 3, '#f0b83c'); T.vline(8, 3, 3, '#7a4f2e'); },
};

export function plaque(T, ctx, icon, style = 'wood') {
  const wood = style === 'blue' ? '#3f5a8a' : style === 'green' ? '#2f6a48' : style === 'dark' ? '#4f3220' : '#a56c3c';
  const O = shade(wood, -0.6);
  // bracket
  T.vline(1, 0, 3, '#3e4f48'); T.vline(14, 0, 3, '#3e4f48'); T.hline(1, 0, 14, '#3e4f48');
  T.rect(1, 3, 14, 11, O);
  T.rect(2, 4, 12, 9, wood);
  T.hline(2, 4, 12, shade(wood, 0.3)); T.hline(2, 12, 12, shade(wood, -0.3));
  const inner = new Canvas(16, 16);
  (ICONS[icon] || ICONS.bell)(inner);
  // icon sits on a cream disc for readability
  T.rect(3, 5, 10, 7, '#f6ecd2'); T.hline(3, 5, 10, '#fffaf0'); T.hline(3, 11, 10, '#d8c8a0');
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const a = inner.get(x, y);
    if (a && a[3] && x >= 3 && x < 13) T.px(x, y - 1, [a[0], a[1], a[2]]);
  }
  if (ctx.S.winter) T.hline(1, 3, 14, SNOW.l), T.hline(2, 2, 12, null);
}

// ------------------------------------------------------------------ stairs, bridges
export function stairs(T, ctx, kind, part) {
  const pal = kind === 'marble' ? { t: '#f2eee4', f: '#cfc8b8', o: '#8e8878', sh: '#a8a090' } : kind === 'wood' ? { t: '#c98b52', f: '#8a5a32', o: '#4f3220', sh: '#6a4228' } : { t: '#d0cabb', f: '#9a9484', o: '#6c6658', sh: '#807a6c' };
  // 4 treads going up (north): tread = light 2px, riser = darker 2px
  T.rect(0, 0, 16, 16, pal.f);
  for (let i = 0; i < 4; i++) {
    const y = i * 4;
    T.hline(0, y, 16, pal.t); T.hline(0, y + 1, 16, pal.t);
    T.hline(0, y + 2, 16, pal.f); T.hline(0, y + 3, 16, pal.sh);
    T.hline(0, y, 16, shade(pal.t, 0.2));
  }
  if (kind !== 'wood') for (let i = 0; i < 4; i++) { const y = i * 4; T.px(3 + i * 3, y + 1, shade(pal.t, -0.12)); T.px(11 - i * 2, y + 1, shade(pal.t, -0.12)); }
  if (part === 'l' || part === 'lr') { T.vline(0, 0, 16, pal.o); T.vline(1, 0, 16, pal.t); T.vline(2, 0, 16, pal.f); }
  if (part === 'r' || part === 'lr') { T.vline(15, 0, 16, pal.o); T.vline(14, 0, 16, pal.sh); }
  if (ctx.S.winter) { snowPatches(T, ctx, 0.4, 31); for (let i = 0; i < 4; i++) T.hline(0, i * 4, 16, null) && 0; }
}

export function stairsSide(T, ctx, kind, dir) {
  // staircase seen from the side climbing up-left / up-right (used on terraces)
  const pal = { t: '#d0cabb', f: '#9a9484', o: '#6c6658' };
  T.rect(0, 0, 16, 16, pal.f);
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
    const xx = dir === 'r' ? x : 15 - x;
    const step = Math.floor((xx) / 4);
    const top = 14 - step * 4;
    if (y < top) T.px(x, y, null);
    else if (y === top) T.px(x, y, pal.t);
    else if (xx % 4 === 0) T.px(x, y, pal.o);
  }
}

export function bridge(T, ctx, part) {
  const base = '#b87c46', L = '#d89a60', D = '#7a4f2e', O = '#3b2a1f';
  const planksH = () => {
    T.rect(0, 0, 16, 16, base);
    for (let y = 0; y < 16; y += 4) { T.hline(0, y, 16, L); T.hline(0, y + 3, 16, D); const j = (y * 3 + 2) % 12 + 2; T.vline(j, y, 4, D); }
  };
  const planksV = () => {
    T.rect(0, 0, 16, 16, base);
    for (let x = 0; x < 16; x += 4) { T.vline(x, 0, 16, L); T.vline(x + 3, 0, 16, D); const j = (x * 3 + 2) % 12 + 2; T.hline(x, j, 4, D); }
  };
  if (part === 'h') planksH();
  else if (part === 'v') planksV();
  else if (part === 'rt') { planksH(); T.rect(0, 0, 16, 7, base); T.hline(0, 6, 16, O); T.hline(0, 0, 16, shade(L, 0.2)); T.hline(0, 1, 16, L); T.hline(0, 2, 16, base); T.hline(0, 3, 16, D); T.hline(0, 4, 16, O); T.hline(0, 5, 16, shade(base, -0.1)); for (let x = 1; x < 16; x += 8) { T.rect(x, 0, 3, 7, D); T.vline(x, 0, 7, L); T.vline(x + 2, 0, 7, O); } T.hline(0, 7, 16, '#1d2340'); }
  else if (part === 'rb') { planksH(); T.hline(0, 9, 16, D); T.hline(0, 10, 16, L); T.hline(0, 11, 16, shade(L, 0.15)); T.rect(0, 12, 16, 4, D); T.hline(0, 12, 16, L); T.hline(0, 15, 16, O); for (let x = 1; x < 16; x += 8) { T.rect(x, 8, 3, 8, D); T.vline(x, 8, 8, L); T.vline(x + 2, 8, 8, O); } }
  else if (part === 'vl') { planksV(); T.rect(0, 0, 5, 16, D); T.vline(0, 0, 16, O); T.vline(1, 0, 16, L); T.vline(4, 0, 16, O); for (let y = 1; y < 16; y += 8) { T.rect(0, y, 6, 3, D); T.hline(0, y, 6, L); T.hline(0, y + 2, 6, O); } }
  else if (part === 'vr') { planksV(); T.rect(11, 0, 5, 16, D); T.vline(11, 0, 16, O); T.vline(12, 0, 16, L); T.vline(15, 0, 16, O); for (let y = 1; y < 16; y += 8) { T.rect(10, y, 6, 3, D); T.hline(10, y, 6, L); T.hline(10, y + 2, 6, O); } }
  if (ctx.S.winter) snowPatches(T, ctx, 0.35, 33 + part.length);
  else if (ctx.season === 'autumn') for (let i = 0; i < 2; i++) T.px(3 + i * 7, 8, '#ee8a3e');
}

// ------------------------------------------------------------------ cliffs / retaining walls
export function cliff(T, ctx, part) {
  const S = ctx.S;
  const stone = '#a9a498', L = '#c9c3b2', D = '#7e7a6c', O = '#4f4d44';
  const lft = part === 'l', rgt = part === 'r';
  const x0 = lft ? 1 : 0, x1 = rgt ? 14 : 15;
  for (let y = 0; y < 16; y++) for (let x = x0; x <= x1; x++) {
    if (lft && x === 1 && y < 3) continue;
    let c = stone;
    const row = y >> 2, off = row % 2 ? 4 : 0;
    const bx = (x + off) & 7;
    if (y % 4 === 3) c = D; else if (bx === 7) c = D; else if (y % 4 === 0) c = L;
    else if (hash2(x, y, 6) > 0.9) c = shade(stone, 0.12);
    if (y > 12) c = shade(c, -0.18);
    T.px(x, y, c);
  }
  if (lft) T.vline(x0, 3, 13, O);
  if (rgt) T.vline(x1, 3, 13, O);
  if (part === 'ivy') for (let i = 0; i < 12; i++) { const x = (hash2(i, 1, 4) * 16) | 0, y = 4 + ((hash2(i, 2, 4) * 11) | 0); T.px(x, y, S.winter ? '#8cae98' : '#3f9a3c'); T.px(x, y + 1, S.winter ? '#5a7a62' : '#2f7a2e'); }
  // grass lip overhanging the top edge
  const gc = S.winter ? [SNOW.l, SNOW.m, SNOW.s] : [S.grassL, S.grass, S.grassD];
  for (let x = x0; x <= x1; x++) {
    const d = 2 + ((x * 5) % 3 === 0 ? 1 : 0) + (x % 4 === 1 ? 1 : 0);
    for (let y = 0; y < d; y++) T.px(x, y, y === 0 ? gc[0] : (y === d - 1 ? gc[2] : gc[1]));
    T.px(x, d, '#2f2c26');
  }
  if (lft) { T.px(1, 2, null); }
  T.hline(x0, 15, x1 - x0 + 1, O);
}

export const PAINTERS = { roof, chimneyBase, chimneyTop, wall, win, door, awning, plaque, stairs, stairsSide, bridge, cliff };
export const SHEETS = {};
