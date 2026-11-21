// Indoor painters: floors, walls, windows, doors and furniture. NEVER read the season: indoor tiles are
// identical in all four seasons (the catalog marks them `indoor: true` and tests enforce it).
import { shade, hash2, mix } from './paint_common.js';

const WOOD = { b: '#b87c46', l: '#d89a60', d: '#7a4f2e', o: '#3b2a1f' };

function box(T, x, y, w, h, base, o = shade(base, -0.62)) {
  T.rect(x, y, w, h, o);
  T.rect(x + 1, y + 1, w - 2, h - 2, base);
  T.hline(x + 1, y + 1, w - 2, shade(base, 0.32));
  T.vline(x + 1, y + 1, h - 2, shade(base, 0.18));
  T.vline(x + w - 2, y + 1, h - 2, shade(base, -0.22));
  T.hline(x + 1, y + h - 2, w - 2, shade(base, -0.28));
}
const shadowAt = (T, x, y, w) => { T.ellipse(x, y, w, 1.6, '#1d2340', 38); };

// ------------------------------------------------------------------ floors
export function floor(T, ctx, kind, v = 0) {
  const r = ctx.rng;
  const plank = (base, rows) => {
    T.rect(0, 0, 16, 16, base);
    const h = 16 / rows;
    for (let i = 0; i < rows; i++) {
      const y = i * h;
      T.hline(0, y, 16, shade(base, 0.14)); T.hline(0, y + h - 1, 16, shade(base, -0.3));
      const j = (i * 5 + v * 7 + 3) % 12 + 2; T.vline(j, y, h, shade(base, -0.3));
      for (let k = 0; k < 2; k++) T.px(r.int(0, 15), y + r.int(1, h - 2), shade(base, -0.12));
    }
  };
  if (kind === 'wood') plank('#c98b48', 4);
  else if (kind === 'wood_dark') plank('#8a5a38', 4);
  else if (kind === 'wood_light') plank('#e0b878', 4);
  else if (kind === 'gym') { plank('#d9a85e', 2); T.hline(0, 0, 16, '#f2d28e'); }
  else if (kind === 'tile_white' || kind === 'school' || kind === 'tile_kitchen' || kind === 'tile_checker') {
    const pal = {
      tile_white: ['#f4f0e6', '#e0dccd', '#c4bfae'], school: ['#e8e0c4', '#d8cfae', '#b8ae88'],
      tile_kitchen: ['#d89060', '#c47a4c', '#8a5030'], tile_checker: ['#f2e6c8', '#8a5a38', '#5f3d24'],
    }[kind];
    for (let sy = 0; sy < 2; sy++) for (let sx = 0; sx < 2; sx++) {
      const c = kind === 'tile_checker' ? ((sx + sy + v) % 2 ? pal[1] : pal[0]) : ((sx + sy + v) % 2 ? pal[1] : pal[0]);
      T.rect(sx * 8, sy * 8, 8, 8, c);
      T.hline(sx * 8, sy * 8, 8, shade(c, 0.2)); T.vline(sx * 8, sy * 8, 8, shade(c, 0.12));
      T.hline(sx * 8, sy * 8 + 7, 8, pal[2]); T.vline(sx * 8 + 7, sy * 8, 8, pal[2]);
      if (kind === 'school') for (let i = 0; i < 3; i++) T.px(sx * 8 + r.int(1, 6), sy * 8 + r.int(1, 6), shade(c, -0.15));
    }
  } else if (kind.startsWith('carpet_')) {
    const base = { carpet_red: '#b8454a', carpet_blue: '#4a6aa8', carpet_green: '#4a8a5a', carpet_cream: '#e8d8b0', carpet_purple: '#8a5aa8' }[kind];
    T.rect(0, 0, 16, 16, base);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const h = hash2(x, y, 5 + v); if (h > 0.8) T.px(x, y, shade(base, 0.12)); else if (h < 0.12) T.px(x, y, shade(base, -0.12)); }
  } else if (kind === 'stone') {
    T.rect(0, 0, 16, 16, '#9a9486');
    [0, 8].forEach((y0, ri) => { const cuts = ri ? [0, 6, 16] : [0, 10, 16]; for (let k = 0; k < 2; k++) { const c = hash2(k, ri, 9 + v) > 0.5 ? '#bdb7a8' : '#aca696'; for (let y = y0; y < y0 + 7; y++) for (let x = cuts[k]; x < cuts[k + 1] - 1; x++) T.px(x, y, y === y0 ? shade(c, 0.2) : c); } });
  } else throw new Error('floor ' + kind);
}

// ------------------------------------------------------------------ walls
const IW = {
  cream: { up: '#f0e0bc', low: '#c98b48', trim: '#f7f3ea', cap: '#8a7a5a' },
  school: { up: '#d8ecd0', low: '#7fae98', trim: '#f7f3ea', cap: '#5a7a70' },
  wood: { up: '#c9975a', low: '#8a5a38', trim: '#e0b878', cap: '#4f3220' },
  blue: { up: '#c4dcf0', low: '#6a8fbd', trim: '#f7f3ea', cap: '#3f5a82' },
  pink: { up: '#f6d4d0', low: '#c8707a', trim: '#f7f3ea', cap: '#8a4a58' },
  brick: { up: '#c0614a', low: '#8a4030', trim: '#e0b878', cap: '#4f2a24' },
  stone: { up: '#c8c2b2', low: '#8e887a', trim: '#e0dccd', cap: '#5a564c' },
};
export const INDOOR_WALL_STYLES = Object.keys(IW);

export function iwall(T, ctx, style, part) {
  const P = IW[style];
  const fillUp = (y0, y1) => {
    T.rect(0, y0, 16, y1 - y0, P.up);
    for (let y = y0; y < y1; y++) for (let x = 0; x < 16; x++) { const h = hash2(x, y, 4 + style.length); if (h > 0.94) T.px(x, y, shade(P.up, 0.12)); else if (h < 0.05) T.px(x, y, shade(P.up, -0.08)); }
    if (style === 'brick') for (let y = y0; y < y1; y += 4) { T.hline(0, y + 3, 16, shade(P.up, -0.3)); for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) T.vline(x, y, 4, shade(P.up, -0.3)); }
    if (style === 'stone') for (let y = y0; y < y1; y += 8) { T.hline(0, y + 7, 16, shade(P.up, -0.3)); T.vline(((y / 8) % 2) ? 5 : 11, y, 8, shade(P.up, -0.3)); }
    if (style === 'wood') for (let y = y0; y < y1; y += 4) { T.hline(0, y, 16, shade(P.up, 0.15)); T.hline(0, y + 3, 16, shade(P.up, -0.3)); }
  };
  if (part === 'hi') { // upper wall with crown molding
    fillUp(0, 16);
    T.rect(0, 0, 16, 3, P.cap); T.hline(0, 3, 16, P.trim); T.hline(0, 4, 16, shade(P.up, -0.25));
    for (let y = 5; y < 8; y++) T.hline(0, y, 16, '#1d2340', [40, 22, 10][y - 5]);
  } else if (part === 'face') { // lower wall: plaster over wainscot + baseboard
    fillUp(0, 8);
    T.hline(0, 8, 16, P.trim); T.hline(0, 9, 16, shade(P.trim, -0.25));
    T.rect(0, 10, 16, 6, P.low);
    for (let x = 0; x < 16; x += 4) { T.vline(x, 10, 6, shade(P.low, -0.22)); T.vline(x + 1, 10, 5, shade(P.low, 0.15)); }
    T.hline(0, 15, 16, shade(P.low, -0.55)); T.hline(0, 14, 16, shade(P.low, -0.25));
  } else if (part === 'cap' || part === 'cap_s' || part === 'cap_l' || part === 'cap_r') {
    T.rect(0, 0, 16, 16, P.cap);
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash2(x, y, 8) > 0.92) T.px(x, y, shade(P.cap, 0.14));
    if (part === 'cap_s') { T.hline(0, 0, 16, P.trim); T.hline(0, 1, 16, shade(P.cap, 0.3)); T.hline(0, 2, 16, '#1d2340', 60); }
    if (part === 'cap_l') { T.vline(15, 0, 16, shade(P.cap, 0.3)); T.vline(14, 0, 16, shade(P.cap, 0.12)); T.vline(13, 0, 16, '#1d2340', 50); }
    if (part === 'cap_r') { T.vline(0, 0, 16, shade(P.cap, 0.3)); T.vline(1, 0, 16, shade(P.cap, 0.12)); T.vline(2, 0, 16, '#1d2340', 50); }
  } else throw new Error('iwall part ' + part);
}

// ------------------------------------------------------------------ windows / doors
export function iwin(T, ctx, kind, part) {
  // 1-wide window over 2 rows (hi = upper pane, face = lower pane + sill)
  const st = 'cream';
  iwall(T, ctx, kind === 'school' ? 'school' : st, part);
  const frame = '#f7f3ea', frameD = '#c9bfa8', fo = '#5a4a38';
  const hi = part === 'hi';
  const gy0 = hi ? 7 : 0, gy1 = hi ? 16 : 9;
  T.rect(1, gy0 - (hi ? 1 : 0), 14, gy1 - gy0 + (hi ? 1 : 1), fo);
  T.rect(2, gy0, 12, gy1 - gy0, frame);
  for (let y = gy0 + 1; y < gy1 - (hi ? 0 : 1); y++) for (let x = 3; x < 13; x++) {
    let c;
    if (kind === 'harbor') c = (hi ? y < 12 : false) ? '#a8dcf6' : (hi ? '#bfe6f6' : (y < 3 ? '#bfe6f6' : y < 5 ? '#6aaee0' : '#4a90c8'));
    else c = hi ? '#bfe6f6' : '#a8d8f0';
    T.px(x, y, c);
  }
  if (kind === 'harbor') {
    if (hi) { T.hline(3, 11, 10, '#ffffff'); T.rect(4, 9, 3, 1, '#ffffff'); T.rect(9, 8, 3, 1, '#f4f8ff'); }
    else { T.hline(3, 3, 10, '#d8f0fa'); T.px(5, 7, '#9ad8f6'); T.px(10, 6, '#9ad8f6'); T.px(8, 7, '#9ad8f6'); T.vline(11, 0, 3, '#f7f3ea'); T.px(11, 0, '#d8453a'); T.hline(9, 2, 5, '#f7f3ea'); T.px(11, 1, '#f7f3ea'); }
  }
  T.vline(7, gy0, gy1 - gy0, frame); T.vline(8, gy0, gy1 - gy0, frameD);
  if (!hi) { T.hline(3, 4, 10, frame); T.hline(3, 5, 10, frameD); T.hline(0, 9, 16, '#e8e0c8'); T.hline(0, 10, 16, '#a89c78'); }
  if (kind === 'curtain') {
    const c = '#d8606a';
    for (const [x0, w] of [[2, 3], [11, 3]]) { T.rect(x0, hi ? 7 : 0, w, hi ? 9 : 9, c); T.vline(x0, hi ? 7 : 0, 9, shade(c, -0.3)); T.vline(x0 + w - 1, hi ? 7 : 0, 9, shade(c, 0.2)); }
    if (hi) T.hline(1, 6, 14, '#a56c3c');
  }
}

export function idoor(T, ctx, kind, part) {
  const hi = part === 'hi';
  if (kind === 'stairs') { // opening to stairs going down
    iwall(T, ctx, 'cream', hi ? 'hi' : 'face');
    T.rect(2, hi ? 4 : 0, 12, hi ? 12 : 14, '#1d2340');
    if (!hi) for (let i = 0; i < 4; i++) { T.hline(2, i * 3 + 1, 12, shade('#8a5a38', 0.1 - i * 0.2)); T.hline(2, i * 3 + 2, 12, shade('#5f3d24', -i * 0.15)); }
    else { T.hline(2, 4, 12, '#f7f3ea'); T.rect(1, 3, 14, 1, '#a56c3c'); }
    return;
  }
  const pal = kind === 'school' ? { b: '#c9a878', f: '#7fae98' } : kind === 'white' ? { b: '#f0ece0', f: '#a89c78' } : { b: '#a8683a', f: '#5f3d24' };
  iwall(T, ctx, kind === 'school' ? 'school' : 'cream', hi ? 'hi' : 'face');
  const o = shade(pal.b, -0.62);
  if (hi) {
    T.rect(2, 4, 12, 12, o); T.rect(3, 5, 10, 11, pal.b); T.hline(3, 5, 10, shade(pal.b, 0.3)); T.vline(3, 5, 11, shade(pal.b, 0.18));
    T.rect(5, 7, 6, 5, shade(pal.b, -0.18)); T.frame(5, 7, 6, 5, o); T.rect(6, 8, 4, 3, kind === 'school' ? '#bfe6f6' : shade(pal.b, 0.05));
  } else {
    T.rect(2, 0, 12, 15, o); T.rect(3, 0, 10, 15, pal.b); T.vline(3, 0, 15, shade(pal.b, 0.18)); T.vline(12, 0, 15, shade(pal.b, -0.25));
    T.rect(5, 2, 6, 5, shade(pal.b, -0.12)); T.frame(5, 2, 6, 5, o); T.rect(5, 9, 6, 4, shade(pal.b, -0.12)); T.frame(5, 9, 6, 4, o);
    T.px(11, 8, '#f6d060'); T.px(10, 8, '#c8902c');
    T.hline(1, 15, 14, '#6a4228'); T.rect(4, 14, 8, 2, '#a0453a');
  }
}

// ------------------------------------------------------------------ furniture (3/4 front view)
export function furn(T, ctx, kind, part, extra) {
  const W = WOOD;
  switch (kind) {
    case 'bed': { // colour = extra; head = top tile with pillow, foot = bottom tile
      const c = { blue: '#4a78b8', red: '#c9483c', green: '#4d9a5c', pink: '#e88aa8', white: '#f0ece0' }[extra] || '#4a78b8';
      if (part === 'head') {
        shadowAt(T, 8, 15, 7);
        box(T, 1, 0, 14, 16, W.d); T.rect(2, 1, 12, 4, W.b); T.hline(2, 1, 12, W.l); T.rect(2, 5, 12, 11, '#f7f3ea'); T.rect(3, 6, 10, 5, '#ffffff'); T.hline(3, 10, 10, '#d8d0c0');
        T.rect(5, 12, 6, 4, c); T.hline(5, 12, 6, shade(c, 0.35));
        T.vline(2, 5, 11, shade(c, -0.3)); T.vline(13, 5, 11, shade(c, -0.3));
        T.rect(2, 11, 12, 5, c); T.hline(2, 11, 12, shade(c, 0.35)); T.vline(2, 11, 5, shade(c, -0.2));
      } else {
        T.rect(1, 0, 14, 13, '#1d2340'); T.rect(2, 0, 12, 12, c); T.hline(2, 0, 12, shade(c, 0.3));
        for (let x = 2; x < 14; x += 4) T.vline(x, 1, 11, shade(c, -0.15));
        T.rect(1, 12, 14, 3, W.d); T.hline(1, 12, 14, W.l); T.hline(1, 15, 14, W.o); shadowAt(T, 8, 15.5, 7);
      }
      break;
    }
    case 'desk': { // part l/m/r ; extra = item
      const sides = part;
      shadowAt(T, 8, 15.5, 8);
      T.rect(0, 4, 16, 6, W.o); T.rect(sides === 'l' ? 1 : 0, 5, 16 - (sides === 'l' ? 1 : 0) - (sides === 'r' ? 1 : 0), 4, W.l); T.hline(0, 5, 16, shade(W.l, 0.25));
      T.rect(0, 10, 16, 5, W.o); T.rect(sides === 'l' ? 1 : 0, 10, 16 - (sides === 'l' ? 1 : 0) - (sides === 'r' ? 1 : 0), 4, W.b);
      T.hline(0, 10, 16, W.d); T.hline(0, 13, 16, W.d);
      if (part !== 'r' || true) { T.rect(5, 11, 6, 2, W.d); T.px(7, 12, '#f6d060'); T.px(8, 12, '#f6d060'); }
      if (extra === 'diary') { T.rect(3, 3, 6, 5, '#7a3030'); T.rect(4, 4, 4, 3, '#f7f3ea'); T.vline(6, 4, 3, '#c9bfa8'); T.hline(10, 4, 4, '#f0b83c'); T.px(13, 3, '#d8453a'); }
      if (extra === 'lamp') { T.rect(10, 0, 4, 2, '#f0b83c'); T.rect(11, 2, 2, 3, '#3e5a52'); T.rect(9, 5, 6, 1, '#3e5a52'); T.px(11, 0, '#fff0a8'); }
      if (extra === 'books') { T.rect(2, 2, 6, 3, '#3f78b8'); T.rect(3, 1, 5, 2, '#d8453a'); T.rect(9, 3, 4, 2, '#4d9a5c'); T.hline(2, 2, 6, '#8fb8f0'); }
      if (extra === 'papers') { T.rect(3, 4, 5, 4, '#f7f3ea'); T.rect(6, 3, 5, 4, '#fffaf0'); T.hline(7, 5, 3, '#a89c78'); T.px(12, 6, '#d8453a'); T.px(12, 5, '#f0b83c'); }
      if (extra === 'plant') { T.rect(6, 4, 5, 4, '#a0453a'); T.disc(8.5, 3, 3, '#4d9a5c'); T.px(8, 2, '#8fe06a'); }
      if (extra === 'globe') { T.disc(8, 3.5, 3.5, '#3f78b8'); T.rect(6, 3, 3, 2, '#4d9a5c'); T.px(8, 1, '#8fb8f0'); T.rect(7, 6, 3, 2, W.o); }
      if (extra === 'bell') { T.ellipse(8, 5, 3, 2.5, '#e0a830'); T.px(8, 2, '#a87820'); T.px(7, 4, '#ffe27a'); }
      break;
    }
    case 'chair': { // part = facing
      shadowAt(T, 8, 15, 5);
      const c = extra === 'red' ? '#c9483c' : W.b;
      if (part === 'u') { box(T, 3, 3, 10, 7, c); T.rect(3, 10, 10, 2, W.d); T.rect(4, 12, 2, 3, W.o); T.rect(10, 12, 2, 3, W.o); }
      else if (part === 'd') { box(T, 3, 8, 10, 4, c); T.rect(3, 12, 10, 1, W.d); T.rect(4, 13, 2, 2, W.o); T.rect(10, 13, 2, 2, W.o); T.rect(3, 3, 10, 5, W.d); T.hline(4, 3, 8, W.l); }
      else { const lf = part === 'l'; box(T, 3, 8, 10, 4, c); T.rect(lf ? 11 : 3, 3, 2, 6, W.d); T.rect(4, 12, 2, 3, W.o); T.rect(10, 12, 2, 3, W.o); }
      break;
    }
    case 'table': { // l/m/r/o ; extra = cloth colour
      shadowAt(T, 8, 15.5, 8);
      const cl = extra ? { red: '#d8453a', blue: '#4a78b8', white: '#f7f3ea', green: '#4d9a5c' }[extra] : null;
      const top = cl || W.l;
      const x0 = part === 'l' || part === 'o' ? 1 : 0, x1 = part === 'r' || part === 'o' ? 15 : 16;
      T.rect(x0, 4, x1 - x0, 7, W.o); T.rect(x0 + 1, 5, x1 - x0 - 2 + (part === 'm' ? 2 : 0), 5, top); T.hline(x0, 5, x1 - x0, shade(top, 0.3));
      if (cl) { T.rect(x0, 10, x1 - x0, 3, shade(cl, -0.2)); for (let x = x0; x < x1; x += 2) T.px(x, 12, shade(cl, -0.4)); }
      else { T.rect(x0 + 1, 10, x1 - x0 - 2, 2, W.d); T.rect(x0 + 1, 12, 2, 3, W.o); T.rect(x1 - 3, 12, 2, 3, W.o); }
      if (extra === 'tea') { T.rect(4, 3, 4, 3, '#f7f3ea'); }
      break;
    }
    case 'counter': {
      shadowAt(T, 8, 15.5, 8);
      const top = extra === 'marble' ? '#e8e4da' : '#e0b070', face = extra === 'marble' ? '#cfc8b8' : W.b;
      const x0 = part === 'l' ? 1 : 0, x1 = part === 'r' ? 15 : 16;
      T.rect(x0, 3, x1 - x0, 5, W.o); T.rect(x0, 4, x1 - x0, 3, top); T.hline(x0, 4, x1 - x0, shade(top, 0.3));
      T.rect(x0, 8, x1 - x0, 7, W.o); T.rect(x0 + (part === 'l' ? 0 : 0), 8, x1 - x0, 6, face); T.hline(x0, 8, x1 - x0, W.d);
      for (let x = x0 + 2; x < x1 - 2; x += 6) { T.frame(x, 9, 5, 4, shade(face, -0.4)); T.px(x + 2, 11, '#f6d060'); }
      break;
    }
    case 'bookcase': { // hi / lo ; extra = colour
      const c = extra === 'white' ? '#e8e0c8' : W.b;
      const cols = ['#c9483c', '#4a78b8', '#4d9a5c', '#f0b83c', '#8a5aa8', '#f7f3ea', '#e88a4a'];
      T.rect(0, part === 'hi' ? 2 : 0, 16, part === 'hi' ? 14 : 16, shade(c, -0.62));
      T.rect(1, part === 'hi' ? 3 : 0, 14, part === 'hi' ? 13 : 15, shade(c, -0.3));
      const rows = part === 'hi' ? [[3, 8], [9, 15]] : [[0, 6], [7, 14]];
      for (const [y0, y1] of rows) {
        T.rect(2, y0, 12, y1 - y0, '#2a1c14');
        let x = 2;
        for (let k = 0; x < 14; k++) { const w = 2 + ((k * 7 + y0) % 2), h = (y1 - y0) - 1 - ((k * 3) % 3); const col = cols[(k + y0) % cols.length]; T.rect(x, y1 - h, w, h, col); T.vline(x, y1 - h, h, shade(col, 0.3)); x += w; }
        T.hline(1, y1, 14, c);
      }
      if (part === 'hi') { T.rect(0, 0, 16, 3, shade(c, -0.62)); T.rect(1, 1, 14, 2, c); T.hline(1, 1, 14, shade(c, 0.3)); }
      else { T.hline(0, 15, 16, shade(c, -0.62)); shadowAt(T, 8, 15.5, 7); }
      break;
    }
    case 'wardrobe': {
      T.rect(1, part === 'hi' ? 1 : 0, 14, part === 'hi' ? 15 : 15, W.o); T.rect(2, part === 'hi' ? 2 : 0, 12, part === 'hi' ? 14 : 14, W.b);
      T.vline(7, part === 'hi' ? 2 : 0, 14, W.o); T.vline(8, part === 'hi' ? 2 : 0, 14, W.d); T.vline(2, part === 'hi' ? 2 : 0, 14, W.l);
      T.frame(3, part === 'hi' ? 3 : 1, 4, 11, W.d); T.frame(9, part === 'hi' ? 3 : 1, 4, 11, W.d);
      T.px(6, part === 'hi' ? 9 : 8, '#f6d060'); T.px(9, part === 'hi' ? 9 : 8, '#f6d060');
      if (part === 'hi') T.hline(1, 1, 14, W.l); else { T.hline(1, 15, 14, W.o); shadowAt(T, 8, 15.5, 7); }
      break;
    }
    case 'fridge': {
      const c = '#e8f0f0';
      T.rect(1, part === 'hi' ? 1 : 0, 14, 15, '#6a7a82'); T.rect(2, part === 'hi' ? 2 : 0, 12, part === 'hi' ? 14 : 14, c); T.vline(2, 0, 16, '#ffffff'); T.vline(13, 0, 16, '#a8b8c0');
      if (part === 'hi') { T.hline(2, 8, 12, '#8a9aa2'); T.vline(4, 4, 3, '#6a7a82'); T.vline(4, 10, 3, '#6a7a82'); } else { T.vline(4, 1, 4, '#6a7a82'); T.hline(1, 15, 14, '#4a5a62'); shadowAt(T, 8, 15.5, 7); }
      break;
    }
    case 'stove': {
      shadowAt(T, 8, 15.5, 8);
      T.rect(1, 3, 14, 12, '#4a5a62'); T.rect(2, 4, 12, 3, '#2a3238'); T.disc(5, 5.5, 1.8, '#1a1f24'); T.disc(11, 5.5, 1.8, '#1a1f24'); T.px(4, 5, '#d8453a'); T.px(5, 5, '#d8453a');
      T.rect(2, 8, 12, 6, '#dfe6e8'); T.frame(3, 9, 10, 4, '#6a7a82'); T.rect(4, 10, 8, 2, '#1a1f24'); T.hline(4, 10, 8, '#3a4a52'); T.hline(3, 8, 10, '#aab4b8');
      break;
    }
    case 'sink': {
      shadowAt(T, 8, 15.5, 8);
      T.rect(0, 3, 16, 12, W.o); T.rect(0, 4, 16, 4, '#dfe6e8'); T.rect(3, 4, 10, 3, '#9aaab0'); T.rect(4, 5, 8, 1, '#bfe6f6'); T.vline(7, 1, 4, '#aab4b8'); T.hline(7, 1, 3, '#aab4b8');
      T.rect(0, 8, 16, 7, W.b); T.hline(0, 8, 16, W.d); T.frame(2, 9, 5, 5, W.d); T.frame(9, 9, 5, 5, W.d);
      break;
    }
    case 'sofa': {
      const c = { red: '#b8454a', blue: '#4a6aa8', green: '#4a8a5a' }[extra] || '#b8454a';
      shadowAt(T, 8, 15.5, 8);
      const x0 = part === 'l' ? 0 : 0, x1 = 16;
      T.rect(0, 2, 16, 8, shade(c, -0.55)); T.rect(part === 'l' ? 1 : 0, 3, 16 - (part === 'l' ? 1 : 0) - (part === 'r' ? 1 : 0), 6, shade(c, -0.05)); T.hline(0, 3, 16, shade(c, 0.3));
      T.rect(0, 9, 16, 6, shade(c, -0.55)); T.rect(part === 'l' ? 3 : 0, 10, 16 - (part === 'l' ? 3 : 0) - (part === 'r' ? 3 : 0), 4, c); T.hline(part === 'l' ? 3 : 0, 10, 16, shade(c, 0.3));
      if (part === 'l') { T.rect(0, 4, 3, 11, shade(c, -0.1)); T.vline(0, 4, 11, shade(c, -0.55)); T.vline(1, 5, 9, shade(c, 0.2)); }
      if (part === 'r') { T.rect(13, 4, 3, 11, shade(c, -0.1)); T.vline(15, 4, 11, shade(c, -0.55)); T.vline(13, 5, 9, shade(c, -0.3)); }
      if (part === 'm') T.vline(8, 10, 4, shade(c, -0.3));
      break;
    }
    case 'tv': {
      shadowAt(T, 8, 15.5, 7);
      T.rect(2, 11, 12, 4, W.o); T.rect(3, 12, 10, 2, W.b); T.hline(3, 12, 10, W.l);
      T.rect(2, 1, 12, 10, '#2a3238'); T.rect(3, 2, 10, 7, '#1d2340'); T.rect(4, 3, 8, 5, '#3f6a98'); T.hline(4, 3, 8, '#7fb0e8'); T.px(5, 4, '#ffffff'); T.rect(9, 5, 2, 2, '#f0b83c'); T.px(12, 9, '#4d9a5c'); T.px(11, 9, '#d8453a');
      break;
    }
    case 'plant': {
      if (part === 'pot') { shadowAt(T, 8, 15, 5); T.rect(4, 9, 8, 6, '#8a3a2c'); T.rect(5, 9, 6, 5, '#c0604a'); T.hline(4, 9, 8, '#e08a70'); T.vline(10, 10, 4, '#9a4a38'); const g = '#4d9a5c'; T.disc(8, 6, 4, g); T.disc(6, 5, 2.5, '#6fcc5c'); T.disc(10, 7, 2.5, '#3a7a48'); T.px(7, 3, '#8fe06a'); }
      else if (part === 'hi') { const g = '#3a8a48'; T.disc(8, 8, 7, shade(g, -0.5)); T.disc(8, 8, 6, g); T.disc(6, 6, 3.5, '#5fb860'); T.disc(11, 9, 3.5, '#2f7a3c'); T.px(6, 5, '#8fe06a'); T.px(7, 5, '#8fe06a'); T.vline(8, 12, 4, '#7a4f2e'); }
      else { shadowAt(T, 8, 15, 6); T.rect(8, 0, 1, 8, '#7a4f2e'); T.rect(4, 7, 8, 8, '#8a3a2c'); T.rect(5, 7, 6, 7, '#c0604a'); T.hline(4, 7, 8, '#e08a70'); T.hline(5, 9, 6, '#8a3a2c'); T.disc(8, 6, 3, '#4d9a5c'); }
      break;
    }
    case 'blackboard': { // l/m/r ; extra = text variant 0/1/2
      const x0 = part === 'l' ? 0 : 0, x1 = 16;
      T.rect(0, 1, 16, 14, '#6a4228'); T.rect(part === 'l' ? 1 : 0, 2, 16 - (part === 'l' ? 1 : 0) - (part === 'r' ? 1 : 0), 11, '#2f4a3a');
      T.hline(0, 1, 16, '#a56c3c'); T.hline(0, 14, 16, '#a56c3c'); T.rect(0, 13, 16, 2, '#8a5a38');
      for (let y = 3; y < 12; y++) for (let x = 1; x < 15; x++) if (hash2(x, y, 3) > 0.96) T.px(x, y, '#3f6a50');
      const ch = '#f0f0e8';
      if (extra === 1 && part === 'm') { T.hline(3, 4, 9, ch); T.hline(3, 6, 6, ch); T.px(10, 6, ch); T.hline(3, 8, 8, ch); T.hline(3, 10, 5, ch); }
      if (extra === 2 && part === 'l') { T.disc(8, 7, 3, null); T.hline(4, 4, 8, ch); T.px(5, 5, ch); T.px(8, 6, ch); T.px(11, 5, ch); T.hline(4, 9, 6, '#f6dc88'); }
      if (part === 'm' && extra === 2) { T.hline(2, 4, 10, ch); T.hline(2, 7, 7, ch); T.px(10, 7, ch); T.hline(2, 10, 9, '#bcd8ee'); }
      if (part === 'r') { T.rect(4, 12, 4, 1, '#f7f3ea'); T.rect(10, 12, 3, 1, '#f6dc88'); }
      break;
    }
    case 'schooldesk': {
      shadowAt(T, 8, 15.5, 6);
      T.rect(1, 3, 14, 8, '#6a4228'); T.rect(2, 4, 12, 5, '#e0b878'); T.hline(2, 4, 12, '#f2d28e'); T.hline(2, 8, 12, '#b88a50');
      T.rect(3, 11, 2, 4, '#4f3220'); T.rect(11, 11, 2, 4, '#4f3220'); T.hline(3, 11, 10, '#7a4f2e');
      if (extra === 1) { T.rect(4, 5, 4, 3, '#f7f3ea'); T.px(10, 6, '#d8453a'); }
      break;
    }
    case 'locker': { // hi / lo ; extra colour
      const c = { blue: '#4a78b8', green: '#4d9a5c', red: '#c9483c', grey: '#8a96a4' }[extra] || '#4a78b8';
      const o = shade(c, -0.6);
      T.rect(0, part === 'hi' ? 2 : 0, 16, part === 'hi' ? 14 : 16, o);
      for (const x0 of [1, 8]) {
        T.rect(x0, part === 'hi' ? 3 : 0, 7, part === 'hi' ? 13 : 15, c); T.vline(x0, part === 'hi' ? 3 : 0, 13, shade(c, 0.3));
        if (part === 'hi') { for (let y = 5; y < 9; y += 2) T.hline(x0 + 2, y, 3, o); T.px(x0 + 5, 11, '#e8e0c8'); } else { T.px(x0 + 5, 3, '#e8e0c8'); T.hline(x0 + 1, 10, 5, shade(c, -0.2)); }
      }
      if (part === 'lo') { T.hline(0, 15, 16, o); shadowAt(T, 8, 15.5, 7); } else T.hline(0, 2, 16, shade(c, 0.3));
      break;
    }
    case 'rug': { // extra = colour, part = tl,t,tr,l,c,r,bl,b,br
      const c = { red: '#b8454a', blue: '#4a6aa8', green: '#4a8a5a', cream: '#e8d8b0', purple: '#8a5aa8' }[extra];
      const edge = shade(c, -0.35), trim = '#f0d89a';
      T.rect(0, 0, 16, 16, c);
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (hash2(x, y, 6) > 0.9) T.px(x, y, shade(c, 0.12));
      const top = part[0] === 't', bot = part[0] === 'b' || part === 'bl' || part === 'br', lf = part.endsWith('l') && part.length <= 2 && part !== 'bl' ? true : part.endsWith('l'), rt = part.endsWith('r');
      const isT = part.startsWith('t'), isB = part.startsWith('b'), isL = part === 'l' || part.endsWith('l'), isR = part === 'r' || part.endsWith('r');
      if (isT) { T.hline(0, 0, 16, edge); T.hline(0, 2, 16, trim); T.hline(0, 3, 16, edge); }
      if (isB) { T.hline(0, 15, 16, edge); T.hline(0, 13, 16, trim); T.hline(0, 12, 16, edge); }
      if (isL) { T.vline(0, 0, 16, edge); T.vline(2, 0, 16, trim); T.vline(3, 0, 16, edge); }
      if (isR) { T.vline(15, 0, 16, edge); T.vline(13, 0, 16, trim); T.vline(12, 0, 16, edge); }
      if (part === 'c') { T.px(8, 8, trim); T.px(7, 7, trim); T.px(9, 9, trim); T.px(7, 9, trim); T.px(9, 7, trim); }
      break;
    }
    case 'frame': { // above-layer wall overlays: part = family/landscape/flower/clock/calendar/shelf
      if (part === 'family') { box(T, 3, 3, 10, 9, '#a56c3c'); T.rect(5, 5, 6, 5, '#f4e8d0'); T.disc(7, 7, 1.2, '#f6c8a0'); T.disc(10, 8, 1.2, '#f6c8a0'); T.rect(6, 8, 2, 2, '#4a78b8'); T.rect(9, 9, 2, 1, '#c9483c'); }
      else if (part === 'landscape') { box(T, 2, 4, 12, 8, '#7a4f2e'); T.rect(4, 6, 8, 4, '#8fd0f0'); T.rect(4, 9, 8, 1, '#5fb85a'); T.px(6, 7, '#ffffff'); T.px(9, 7, '#ffffff'); }
      else if (part === 'flower') { box(T, 3, 3, 10, 10, '#e0b878'); T.rect(5, 5, 6, 6, '#f7f3ea'); T.px(8, 7, '#f58ab4'); T.px(7, 8, '#f58ab4'); T.px(9, 8, '#f58ab4'); T.px(8, 9, '#f58ab4'); T.px(8, 8, '#ffd23f'); T.vline(8, 10, 1, '#3f9a3c'); }
      else if (part === 'clock') { T.disc(8, 8, 6, '#3b2a1f'); T.disc(8, 8, 5, '#f7f3ea'); T.vline(8, 4, 5, '#3b2a1f'); T.hline(8, 8, 3, '#3b2a1f'); T.px(8, 8, '#c8402c'); }
      else if (part === 'calendar') { T.rect(3, 2, 10, 12, '#d8cdb0'); T.rect(3, 2, 10, 3, '#d8453a'); T.rect(4, 6, 8, 7, '#fffaf0'); for (let y = 7; y < 13; y += 2) for (let x = 5; x < 12; x += 2) T.px(x, y, '#a89c78'); T.px(9, 9, '#d8453a'); T.px(4, 1, '#3b2a1f'); T.px(11, 1, '#3b2a1f'); }
      else if (part === 'shelf') { T.rect(1, 9, 14, 2, '#a56c3c'); T.hline(1, 9, 14, '#d89a60'); T.hline(1, 11, 14, '#3b2a1f'); T.rect(3, 5, 3, 4, '#c9483c'); T.rect(6, 4, 3, 5, '#4a78b8'); T.rect(10, 6, 3, 3, '#f0b83c'); T.rect(2, 12, 2, 2, '#7a4f2e'); T.rect(12, 12, 2, 2, '#7a4f2e'); }
      else if (part === 'notice') { box(T, 1, 3, 14, 10, '#a56c3c'); T.rect(2, 4, 12, 8, '#c9975a'); T.rect(3, 5, 4, 4, '#f7f3ea'); T.rect(8, 6, 4, 3, '#bcd8ee'); T.rect(5, 9, 5, 2, '#f6dc88'); T.px(5, 5, '#d8453a'); T.px(10, 6, '#d8453a'); }
      else if (part === 'poster') { box(T, 3, 2, 10, 12, '#f7f3ea'); T.rect(4, 3, 8, 6, '#8fd0f0'); T.disc(8, 6, 2, '#f0b83c'); T.hline(5, 11, 6, '#8a8272'); T.hline(5, 12, 4, '#8a8272'); }
      else throw new Error('frame ' + part);
      break;
    }
    default: throw new Error('furn ' + kind);
  }
}

export const PAINTERS = { floor, iwall, iwin, idoor, furn };
export const SHEETS = {};
