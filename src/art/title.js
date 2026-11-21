// Title-screen backdrop (320x240, four seasons), logo, and ending backdrops. Pure pixel code.
import { PixelBuffer } from './pixelbuffer.js';
import { C, mix, ramp, unpack, pack } from './color.js';
import { mulberry32 } from '../core/rng.js';
import { drawIconBuffer } from './icons.js';

const W = 320, H = 240;

const SEASON = {
  spring: { sky: ['#a8c4f0', '#c4c0ec', '#e4bce0', '#f6bcc8', '#f8cfb8', '#fadcb0'], sun: '#fff0b8', grass: ['#7ccc5a', '#5fb54a', '#4a9a40'], leaf: '#4f9a4a', sea: ['#6aaee0', '#4a90c8', '#3a78b0'], cloud: '#fff0f0', snow: false },
  summer: { sky: ['#3f9ae0', '#5ab4ec', '#7cc8f2', '#9cd8f6', '#bce6f8', '#dcf2f8'], sun: '#fffbd0', grass: ['#5cc040', '#46a838', '#348a30'], leaf: '#2f8a3a', sea: ['#3aa0e0', '#2a88cc', '#2070b0'], cloud: '#ffffff', snow: false },
  autumn: { sky: ['#d8845a', '#e8985a', '#f0ac60', '#f4c070', '#f8d488', '#fce4a8'], sun: '#fff4c0', grass: ['#c8b448', '#a89a3a', '#8a8030'], leaf: '#d8662a', sea: ['#6a9ac0', '#4a80a8', '#386890'], cloud: '#ffe8c8', snow: false },
  winter: { sky: ['#7a9ac8', '#94b0d6', '#acc4e2', '#c4d4ec', '#dce6f4', '#eef0f8'], sun: '#ffffff', grass: ['#f4f8ff', '#e0eaf6', '#c8d8ec'], leaf: '#e8f0fa', sea: ['#7aa0cc', '#5a88b8', '#4870a0'], cloud: '#ffffff', snow: true },
};

const BRICK = '#b5503c', SLATE = '#4b5a78', STONE = '#c8c0b0', GOLD = '#f2b84b';

function bands(B, cols, y0, y1) {
  const n = cols.length, h = (y1 - y0) / n;
  for (let i = 0; i < n; i++) {
    const a = Math.round(y0 + i * h), b = Math.round(y0 + (i + 1) * h);
    B.rect(0, a, W, b - a, C(cols[i]));
    if (i + 1 < n) for (let x = 0; x < W; x++) if ((x + (i & 1)) % 2 === 0) B.set(x, b - 1, C(cols[i + 1])); // dither seam
  }
}

function cloud(B, x, y, s, c) {
  const r = ramp(c);
  const blobs = [[0, 2, 7 * s, 4 * s], [6 * s, -1 * s, 8 * s, 5 * s], [13 * s, 2, 7 * s, 4 * s], [6 * s, 2 * s, 12 * s, 3 * s]];
  for (const [dx, dy, rx, ry] of blobs) B.ellipse(x + dx + rx, y + dy + ry, rx, ry, r.base);
  B.rect(x + 2, y + 5 * s - 1, 20 * s, 2, r.shade);
}

function bird(B, x, y, c = '#34313f') { B.set(x, y, C(c)); B.set(x + 1, y + 1, C(c)); B.set(x + 2, y, C(c)); B.set(x - 1, y - 1, C(c)); B.set(x + 3, y - 1, C(c)); }

function school(B, cx, gy, o = {}) {
  const night = !!o.night;
  const wall = ramp(o.brick || BRICK), roof = ramp(SLATE), stone = ramp(STONE);
  const win = (x, y) => {
    B.rect(x, y, 4, 5, C(night ? '#ffd870' : '#a8d8f0'));
    B.rect(x, y, 4, 1, C(night ? '#fff0a0' : '#d8f0ff')); B.rect(x + 2, y, 1, 5, C(wall.dark));
    B.rect(x - 1, y + 5, 6, 1, C(stone.base));
  };
  // main block
  const bx = cx - 4, bw = 64, bh = 28;
  B.rect(bx, gy - bh, bw, bh, wall.base);
  for (let y = gy - bh; y < gy; y += 3) B.rect(bx, y, bw, 1, wall.shade);
  B.rect(bx + bw - 3, gy - bh, 3, bh, wall.shade);
  B.rect(bx, gy - 3, bw, 3, stone.base);
  B.poly([[bx - 4, gy - bh], [bx + bw + 4, gy - bh], [bx + bw - 6, gy - bh - 14], [bx + 6, gy - bh - 14]], roof.base);
  for (let i = 0; i < 12; i++) B.rect(bx - 2 + i * 6, gy - bh - 12 + (i & 1), 3, 1, roof.light);
  B.rect(bx - 4, gy - bh, bw + 8, 2, roof.shade);
  for (let i = 0; i < 4; i++) win(bx + 6 + i * 14, gy - bh + 6);
  for (const i of [0, 1, 3]) win(bx + 6 + i * 14, gy - bh + 17);
  // door
  B.rect(bx + 34, gy - 13, 8, 13, C('#7a4f2e')); B.rect(bx + 34, gy - 13, 8, 2, C('#5a3a22')); B.rect(bx + 37, gy - 13, 2, 13, C('#5a3a22')); B.set(bx + 40, gy - 6, C(GOLD));
  B.rect(bx + 31, gy - 15, 14, 2, stone.light);
  // bell tower (stone)
  const tx = bx - 18, tw = 20, th = 62;
  B.rect(tx, gy - th, tw, th, stone.base);
  for (let y = gy - th; y < gy; y += 4) { B.rect(tx, y, tw, 1, stone.shade); for (let x = tx + ((y / 4) & 1) * 5; x < tx + tw; x += 10) B.rect(x, y, 1, 4, stone.shade); }
  B.rect(tx + tw - 3, gy - th, 3, th, stone.shade); B.rect(tx, gy - th, 2, th, stone.light);
  // belfry arch
  B.rect(tx + 5, gy - th + 8, 10, 14, C('#2a2438'));
  B.ellipse(tx + 10, gy - th + 8, 5, 4, C('#2a2438'));
  B.ellipse(tx + 10, gy - th + 17, 3, 3, C(GOLD)); B.rect(tx + 7, gy - th + 13, 6, 5, C(GOLD)); B.rect(tx + 6, gy - th + 18, 8, 1, C('#c4902a')); B.set(tx + 10, gy - th + 20, C('#7a4f2e'));
  B.rect(tx + 4, gy - th + 22, 12, 2, stone.light);
  // clock face
  B.ellipse(tx + 10, gy - th + 32, 4, 4, C('#f6ecd2')); B.line(tx + 10, gy - th + 32, tx + 10, gy - th + 29, C('#3b2a1f')); B.line(tx + 10, gy - th + 32, tx + 12, gy - th + 33, C('#3b2a1f'));
  B.rect(tx + 6, gy - 8, 8, 8, C('#5a3a22')); B.ellipse(tx + 10, gy - 8, 4, 3, C('#5a3a22'));
  // spire
  B.poly([[tx - 2, gy - th], [tx + tw + 2, gy - th], [tx + tw / 2, gy - th - 24]], roof.base);
  B.poly([[tx + tw / 2, gy - th - 24], [tx + tw + 2, gy - th], [tx + tw / 2 + 2, gy - th]], roof.shade);
  B.rect(tx + tw / 2, gy - th - 30, 1, 7, C('#3b2a1f')); B.rect(tx + tw / 2 + 1, gy - th - 30, 4, 2, C('#d8503f'));
}

function tree(B, x, y, leaf, trunk = '#6a4a2a', snow = false, blossom = false) {
  B.rect(x - 1, y - 8, 3, 8, C(trunk));
  const L = ramp(leaf);
  for (const [dx, dy, r] of [[0, -16, 8], [-6, -11, 6], [6, -11, 6], [0, -10, 7]]) B.ellipse(x + dx, y + dy, r, r * 0.9, L.base, (px, py) => (py < y + dy - r * 0.3 ? L.light : px > x + dx + r * 0.3 ? L.shade : L.base));
  if (snow) for (const [dx, dy] of [[-3, -22], [2, -21], [-8, -14], [7, -14]]) B.rect(x + dx, y + dy, 5, 2, C('#ffffff'));
  if (blossom) for (const [dx, dy] of [[-3, -19], [3, -15], [-6, -12], [5, -20]]) B.set(x + dx, y + dy, C('#ffe0ec'));
}

function branch(B, season, side) {
  const s = SEASON[season];
  const sgn = side === 'l' ? 1 : -1;
  const ox = side === 'l' ? 0 : W - 1;
  const wood = C('#5a3a2a');
  const pts = [[0, 20], [30, 14], [62, 30], [90, 24], [118, 40]];
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
    for (let k = 0; k < 3 - Math.floor(i / 2); k++) B.line(ox + sgn * x0, y0 + k, ox + sgn * x1, y1 + k, wood);
  }
  B.line(ox + sgn * 62, 30, ox + sgn * 78, 56, wood); B.line(ox + sgn * 30, 14, ox + sgn * 44, 2, wood);
  const rnd = mulberry32(side === 'l' ? 5 : 9);
  const cols = season === 'spring' ? ['#f4b6c8', '#f8d0dc', '#ec9ab4', '#fff0f4'] : season === 'summer' ? ['#3f9a4a', '#58b44a', '#2f7a3a'] : season === 'autumn' ? ['#e07a2a', '#f2a840', '#c0502a', '#f2c850'] : ['#ffffff', '#e0ecf8'];
  const n = season === 'winter' ? 40 : 90;
  for (let i = 0; i < n; i++) {
    const t = rnd() * 4.2, seg = Math.min(3, Math.floor(t)), f = t - seg;
    const px = pts[seg][0] + (pts[seg + 1] ? (pts[seg + 1][0] - pts[seg][0]) * f : 0), py = pts[seg][1] + (pts[seg + 1] ? (pts[seg + 1][1] - pts[seg][1]) * f : 0);
    const x = ox + sgn * (px + (rnd() - 0.5) * 18), y = py + (rnd() - 0.2) * 20;
    const c = cols[Math.floor(rnd() * cols.length)];
    if (season === 'spring') { B.set(x, y, C(c)); B.set(x + 1, y, C(c)); B.set(x, y + 1, C(c)); B.set(x + 1, y + 1, C(mix(c, '#ffffff', 0.4))); if (rnd() < 0.3) B.set(x + 2, y + 1, C('#e8c050')); }
    else if (season === 'summer') { B.ellipse(x, y, 3, 2, C(c)); }
    else if (season === 'autumn') { B.set(x, y, C(c)); B.set(x + 1, y, C(c)); B.set(x, y + 1, C(mix(c, '#7a3a14', 0.3))); B.set(x + 1, y - 1, C(c)); }
    else { B.rect(x - 2, y - 2, 5, 2, C('#ffffff')); B.rect(x - 1, y - 3, 3, 1, C('#e0ecf8')); }
  }
}

function seaAndHarbor(B, s, hy, rnd) {
  const sea = s.sea;
  B.rect(0, hy, W, 70, C(sea[0]));
  for (let y = hy; y < hy + 70; y++) { const k = (y - hy) / 70; const c = k < 0.3 ? sea[0] : k < 0.65 ? sea[1] : sea[2]; for (let x = 0; x < W; x++) B.set(x, y, C(c)); }
  for (let i = 0; i < 70; i++) { const x = Math.floor(rnd() * W), y = hy + 3 + Math.floor(rnd() * 64); B.rect(x, y, 3 + Math.floor(rnd() * 4), 1, C(mix(sea[0], '#ffffff', 0.55))); }
  // sun glitter path
  for (let y = hy + 2; y < hy + 40; y += 3) B.rect(236 - (y - hy) / 3 + (y % 2) * 2, y, 10 + (y - hy) / 3, 1, C(mix(s.sun, sea[0], 0.35)));
  // boats
  const boat = (x, y, c) => { B.poly([[x, y], [x + 14, y], [x + 11, y + 4], [x + 3, y + 4]], C('#6a4a2a')); B.rect(x + 6, y - 12, 1, 12, C('#4a3a2a')); B.poly([[x + 7, y - 12], [x + 13, y - 3], [x + 7, y - 3]], C(c)); B.poly([[x + 5, y - 10], [x + 5, y - 3], [x, y - 3]], C(mix(c, '#ffffff', 0.5))); B.rect(x + 1, y + 4, 12, 1, C(mix(sea[1], '#ffffff', 0.3))); };
  boat(206, hy + 14, '#f6f0e0'); boat(262, hy + 26, '#f6f0e0'); boat(180, hy + 40, '#e8d0a0');
  // pier & lighthouse
  B.rect(270, hy - 4, 50, 5, C('#7a4f2e')); for (let x = 272; x < 320; x += 6) B.rect(x, hy + 1, 2, 6, C('#5a3a22'));
  B.rect(300, hy - 28, 8, 24, C('#f6f0e8')); B.rect(300, hy - 20, 8, 3, C('#d8503f')); B.rect(300, hy - 12, 8, 3, C('#d8503f')); B.rect(299, hy - 32, 10, 4, C('#34313f')); B.rect(301, hy - 30, 6, 2, C('#fff0a0')); B.poly([[299, hy - 32], [309, hy - 32], [304, hy - 38]], C('#d8503f'));
}

export function buildTitleBackdrop(season = 'spring') {
  const s = SEASON[season] || SEASON.spring;
  const B = new PixelBuffer(W, H);
  const rnd = mulberry32(77 + (season || 'x').length);
  bands(B, s.sky, 0, 150);
  // sun near horizon
  B.ellipse(236, 128, 22, 22, C(mix(s.sun, s.sky[5], 0.5))); B.ellipse(236, 128, 15, 15, C(s.sun));
  // clouds & birds
  cloud(B, 30, 40, 1.3, s.cloud); cloud(B, 168, 20, 1, s.cloud); cloud(B, 250, 60, 1.2, s.cloud); cloud(B, 96, 84, 0.8, s.cloud);
  if (season !== 'winter') { bird(B, 150, 54); bird(B, 162, 60); bird(B, 200, 44); } else for (let i = 0; i < 50; i++) B.set(Math.floor(rnd() * W), Math.floor(rnd() * 150), C('#ffffff'));
  // far hills
  const farC = season === 'winter' ? '#c4d4e8' : season === 'autumn' ? '#a88a58' : '#7aa86a';
  for (let x = 0; x < W; x++) B.rect(x, Math.round(112 + Math.sin(x / 38) * 8 + Math.sin(x / 13) * 2), 1, 40, C(mix(farC, s.sky[5], 0.35)));
  seaAndHarbor(B, s, 140, rnd);
  // main hill (left/centre) with school
  const hillTop = (x) => 150 - Math.max(0, 62 * Math.exp(-Math.pow((x - 120) / 92, 2)));
  for (let x = 0; x < W; x++) {
    const top = Math.round(hillTop(x) + (x > 210 ? (x - 210) * 0.9 : 0));
    for (let y = top; y < H; y++) {
      const d = y - top;
      const c = d < 3 ? s.grass[0] : d < 40 ? s.grass[1] : s.grass[2];
      B.set(x, y, C((x + y) % 7 === 0 && d > 3 ? mix(c, s.grass[0], 0.4) : c));
    }
  }
  // sea in front of hill right side down to bottom: shore
  for (let y = 190; y < H; y++) for (let x = 250; x < W; x++) if (x - 250 > (y - 190) * 0.3 && y < 215) B.set(x, y, C(s.sea[2]));
  school(B, 128, 110, { night: false });
  // path
  for (let y = 112; y < H; y++) { const w = 4 + (y - 112) * 0.28, cx = 160 + Math.sin((y - 112) / 20) * 8 - (y - 112) * 0.18; for (let x = Math.round(cx - w); x < cx + w; x++) B.set(x, y, C(s.snow ? '#e8e0d8' : '#e8d5a8')); }
  // trees & bushes
  tree(B, 40, 190, s.leaf, '#6a4a2a', s.snow, season === 'spring'); tree(B, 220, 160, s.leaf, '#6a4a2a', s.snow, season === 'spring'); tree(B, 290, 232, s.leaf, '#6a4a2a', s.snow, season === 'spring'); tree(B, 14, 128, s.leaf, '#6a4a2a', s.snow, season === 'spring');
  for (let i = 0; i < 40; i++) { const x = Math.floor(rnd() * W), y = 170 + Math.floor(rnd() * 70); if (hillTop(x) < y - 8) { if (season === 'spring') B.set(x, y, C(['#f4b6c8', '#fff0f4', '#f8e070'][i % 3])); else if (season === 'summer') B.set(x, y, C(['#f8e070', '#ffffff', '#e8508a'][i % 3])); else if (season === 'autumn') B.set(x, y, C(['#e07a2a', '#c0502a'][i % 2])); else B.set(x, y, C('#ffffff')); } }
  branch(B, season, 'l'); branch(B, season, 'r');
  if (season === 'winter') for (let i = 0; i < 70; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H); B.set(x, y, C('#ffffff')); if (i % 4 === 0) B.set(x + 1, y, C('#ffffffaa')); }
  if (season === 'autumn') for (let i = 0; i < 18; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * H); B.set(x, y, C('#e07a2a')); B.set(x + 1, y, C('#f2a840')); }
  return B;
}

// ---- logo ------------------------------------------------------------------------------------------
const FONT = {
  B: ['1111.', '1...1', '1...1', '1111.', '1...1', '1...1', '1111.'],
  e: ['.....', '.....', '.111.', '1...1', '11111', '1....', '.1111'],
  l: ['11.', '.1.', '.1.', '.1.', '.1.', '.1.', '111'],
  h: ['1....', '1....', '1111.', '1...1', '1...1', '1...1', '1...1'],
  a: ['.....', '.....', '.111.', '....1', '.1111', '1...1', '.1111'],
  v: ['.....', '.....', '1...1', '1...1', '1...1', '.1.1.', '..1..'],
  n: ['.....', '.....', '1111.', '1...1', '1...1', '1...1', '1...1'],
  D: ['1111.', '1...1', '1...1', '1...1', '1...1', '1...1', '1111.'],
  y: ['.....', '.....', '1...1', '1...1', '.1111', '....1', '111..'],
  s: ['.....', '.....', '.1111', '1....', '.111.', '....1', '1111.'],
};

function textMask(text, scale, gap = 1) {
  const glyphs = [...text].map((ch) => FONT[ch]);
  const w = glyphs.reduce((s, g) => s + g[0].length + gap, -gap);
  const M = new PixelBuffer(w * scale, 8 * scale);
  let x = 0;
  for (const g of glyphs) {
    g.forEach((r, j) => [...r].forEach((c, i) => { if (c === '1') M.rect((x + i) * scale, j * scale, scale, scale, C('#ffffff')); }));
    x += g[0].length + gap;
  }
  return M;
}

export function buildLogo() {
  const S = 3;
  const pad = 4;
  const L = new PixelBuffer(176, 68);
  const outlineC = C('#3b2a1f');
  const paint = (mask, ox, oy) => {
    for (let y = 0; y < mask.h; y++) for (let x = 0; x < mask.w; x++) {
      if (!mask.opaque(x, y)) continue;
      const t = y / mask.h;
      const c = t < 0.2 ? '#fff2b8' : t < 0.55 ? '#f6c84b' : t < 0.85 ? '#e0983a' : '#b8682a';
      const edge = !mask.opaque(x, y - 1) ? '#fffbe0' : !mask.opaque(x + 1, y) || !mask.opaque(x, y + 1) ? '#b8682a' : c;
      L.set(ox + x, oy + y, C(edge));
    }
  };
  const m1 = textMask('Bellhaven', S), m2 = textMask('Days', S);
  const x1 = Math.floor((176 - m1.w) / 2), y1 = pad;
  paint(m1, x1, y1);
  const x2 = 26 + Math.floor((176 - 26 - m2.w) / 2) - 6, y2 = y1 + m1.h + 4;
  paint(m2, x2, y2);
  // bell next to "Days"
  const bell = drawIconBuffer('bell');
  const bx = 18, by = y2 - 6;
  for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const c = bell.get(x, y); if (c >>> 24) L.rect(bx + x * 2, by + y * 2, 2, 2, c); }
  // swing marks
  for (const [dx, dy] of [[-4, 8], [-2, 4], [66, 8], [68, 4]]) L.rect(bx + dx - 2, by + 10 + dy, 2, 1, C('#f2b84b'));
  // outline (2px for chunky look) + drop shadow
  const base = L.clone();
  const shadow = new PixelBuffer(176, 68);
  for (let y = 0; y < 68; y++) for (let x = 0; x < 176; x++) if (base.opaque(x, y)) { shadow.set(x + 1, y + 2, outlineC); }
  L.outline(() => outlineC, true);
  const L2 = L.clone();
  L2.outline(() => outlineC, true);
  const out = new PixelBuffer(176, 68);
  out.blit(shadow);
  out.blit(L2);
  out.blit(L);
  out.blit(base);
  return out;
}

// ---- ending backdrops -----------------------------------------------------------------------------
const ENDINGS = {
  school_dawn: { sky: ['#2a3a78', '#5a58a0', '#9a70b0', '#e090a0', '#f8b890', '#fcd8a0'], sun: '#fff0c0', sunY: 132, night: false, scene: 'school', tint: 0.0 },
  school_dusk: { sky: ['#3a3a7a', '#7a4a8a', '#c0587a', '#e8785a', '#f4a050', '#fcc870'], sun: '#ffd890', sunY: 134, scene: 'school', night: false },
  bell_night: { sky: ['#0e1430', '#162048', '#1e2c5a', '#2a3a6a', '#3a4a7a', '#4a5a88'], sunY: 0, scene: 'school', night: true, stars: true },
  harbor_dusk: { sky: ['#3a3a7a', '#7a4a8a', '#c0587a', '#e8785a', '#f4a050', '#fcc870'], sun: '#ffd890', sunY: 126, scene: 'harbor' },
  classroom_sunset: { sky: ['#e8785a', '#f08a5a', '#f4a060', '#f8b870', '#fcd088', '#fce0a0'], sun: '#fff0c0', sunY: 120, scene: 'classroom' },
  rooftop_sunset: { sky: ['#5a4a8a', '#a0508a', '#d86a7a', '#f08a5a', '#f8a860', '#fcc878'], sun: '#fff0c0', sunY: 138, scene: 'rooftop' },
};
export const ENDING_KEYS = Object.keys(ENDINGS);

export function buildEndingBackdrop(key) {
  const e = ENDINGS[key] || ENDINGS.school_dawn;
  const B = new PixelBuffer(W, H);
  const rnd = mulberry32(31 + key.length * 17);
  bands(B, e.sky, 0, 170);
  if (e.stars) for (let i = 0; i < 90; i++) { const x = Math.floor(rnd() * W), y = Math.floor(rnd() * 120); B.set(x, y, C(i % 5 === 0 ? '#ffffff' : '#a8b8e8')); if (i % 9 === 0) { B.set(x + 1, y, C('#ffffff88')); B.set(x, y + 1, C('#ffffff88')); } }
  if (e.stars) { B.ellipse(250, 40, 14, 14, C('#f6f0c8')); B.ellipse(256, 36, 12, 12, C(mix('#1e2c5a', '#2a3a6a', 0.5))); B.ellipse(250, 40, 14, 14, C('#f6f0c8'), (x, y) => ((x - 257) ** 2 + (y - 35) ** 2 < 130 ? 0 : '#f6f0c8')); }
  if (e.sun) { B.ellipse(236, e.sunY, 26, 26, C(mix(e.sun, e.sky[4], 0.6))); B.ellipse(236, e.sunY, 17, 17, C(e.sun)); }
  cloud(B, 40, 60, 1.2, mix(e.sky[3], '#ffffff', 0.45)); cloud(B, 190, 34, 1, mix(e.sky[2], '#ffffff', 0.4));
  const dark = e.stars ? '#0e1226' : '#2a2040';
  if (e.scene === 'school' || e.scene === 'harbor') {
    seaAndHarbor(B, { sea: e.stars ? ['#1a2a58', '#14204a', '#0e1838'] : ['#c06a7a', '#8a5a8a', '#4a3a78'], sun: e.sun || '#f6f0c8' }, 150, rnd);
  }
  if (e.scene === 'school') {
    for (let x = 0; x < W; x++) { const top = Math.round(162 - Math.max(0, 60 * Math.exp(-Math.pow((x - 130) / 100, 2)))); B.rect(x, top, 1, H - top, C(e.stars ? '#1a3040' : mix('#3a5a50', e.sky[4], 0.1))); }
    school(B, 130, 118, { night: e.stars, brick: e.stars ? '#6a3a40' : '#8a4a44' });
    if (e.stars) for (let i = 0; i < 6; i++) B.set(104 + i * 4, 56, C('#ffd870'));
    for (let i = 0; i < 10; i++) { const x = 20 + i * 30, y = 200 + (i % 3) * 8; B.rect(x, y, 2, 4, C(dark)); B.ellipse(x + 1, y - 3, 6, 6, C(e.stars ? '#12203a' : '#2a4a40')); }
  }
  if (e.scene === 'harbor') {
    B.rect(0, 190, W, 50, C('#2a2040')); B.rect(0, 190, W, 3, C('#3a2c50'));
    for (let x = 6; x < W; x += 52) { B.rect(x, 168, 2, 24, C('#1a1430')); B.ellipse(x + 1, 168, 4, 4, C('#ffd870')); B.ellipse(x + 1, 168, 2, 2, C('#fff4c0')); }
    for (let x = 10; x < 300; x += 40) { B.rect(x, 192 + (x % 3), 20, 6, C('#4a3050')); }
  }
  if (e.scene === 'classroom') {
    B.rect(0, 0, W, H, C('#e8d0a8')); B.rect(0, 150, W, 90, C('#a8784a'));
    for (let x = 0; x < W; x += 20) B.rect(x, 150, 1, 90, C('#8a5a34'));
    bands(B, e.sky, 16, 100); B.rect(0, 0, W, 16, C('#e8d0a8'));
    for (const x0 of [30, 120, 210]) { B.rect(x0 - 2, 14, 84, 90, C('#7a4f2e')); B.rect(x0, 16, 80, 86, C('#f6c88a')); bands2(B, e.sky, x0, 16, 80, 86); B.rect(x0 + 39, 16, 2, 86, C('#7a4f2e')); B.rect(x0, 56, 80, 2, C('#7a4f2e')); }
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) { const x = 20 + c * 74 + r * 10, y = 150 + r * 28; B.rect(x, y, 34, 5, C(['#5a3a24', '#4a2e1c', '#3a2416'][r])); B.rect(x + 2, y + 5, 3, 14, C('#2a1a10')); B.rect(x + 28, y + 5, 3, 14, C('#2a1a10')); B.rect(x + 8, y + 22, 18, 3, C('#3a2416')); }
    B.rect(0, 100, W, 6, C('#c8a070'));
    for (let i = 0; i < 40; i++) B.rect(Math.floor(rnd() * 300), 108 + Math.floor(rnd() * 40), 2, 1, C('#f8d890'));
  }
  if (e.scene === 'rooftop') {
    // skyline
    for (let x = 0; x < W; x += 24) { const h = 30 + ((x * 7) % 40); B.rect(x, 170 - h, 22, h + 70, C('#3a2c58')); for (let y = 176 - h; y < 168; y += 8) for (let xx = x + 3; xx < x + 20; xx += 6) if (((xx + y) / 3 | 0) % 3) B.rect(xx, y, 3, 4, C('#ffd870')); }
    B.rect(0, 190, W, 50, C('#8a8a98')); B.rect(0, 190, W, 4, C('#a8a8b8'));
    for (let x = 0; x < W; x += 32) B.rect(x, 194, 1, 46, C('#6a6a78'));
    B.rect(0, 172, W, 2, C('#c8c8d8')); B.rect(0, 186, W, 2, C('#a8a8c0'));
    for (let x = 4; x < W; x += 14) B.rect(x, 172, 2, 20, C('#b8b8cc'));
  }
  return B;
}
function bands2(B, cols, x0, y0, w, h) {
  const n = cols.length;
  for (let i = 0; i < n; i++) B.rect(x0, y0 + Math.round(i * h / n), w, Math.round(h / n) + 1, C(cols[i]));
}
