// Procedurally drawn item icons (cute, outlined, soft-gradient glyphs on a 100x100 design grid).
// itemIcon(itemDef, size) -> cached canvas. No DOM access at import time.
import { ICON_SHAPES } from '../core/registry.js';

const INK = '#5a3d2b';
const TAU = Math.PI * 2;

// ---- colour helpers ----
function parse(hex) {
  let s = String(hex || '#999999').replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s, 16);
  if (Number.isNaN(n)) return [153, 153, 153];
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export function mix(hex, to, t) {
  const a = parse(hex);
  const b = parse(to);
  return '#' + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
const light = (c, t = 0.4) => mix(c, '#ffffff', t);
const dark = (c, t = 0.25) => mix(c, '#3a2418', t);
function grad(c, col, y0 = 8, y1 = 92) {
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, light(col, 0.38));
  g.addColorStop(0.5, col);
  g.addColorStop(1, dark(col, 0.2));
  return g;
}

// ---- drawing primitives ----
function shape(c, build, col, lw = 3.4) {
  c.beginPath();
  build(c);
  c.fillStyle = typeof col === 'string' && col[0] === '#' ? grad(c, col) : col;
  c.fill();
  if (!lw) return;
  c.lineWidth = lw;
  c.strokeStyle = INK;
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.stroke();
}
const ell = (x, y, rx, ry, rot = 0) => (c) => c.ellipse(x, y, rx, ry, rot, 0, TAU);
const circ = (x, y, r) => (c) => c.arc(x, y, r, 0, TAU);
const rr = (x, y, w, h, r) => (c) => c.roundRect(x, y, w, h, r);
const poly = (pts, close = true) => (c) => {
  pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  if (close) c.closePath();
};
function line(c, pts, w = 3.4, col = INK) {
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.lineWidth = w;
  c.strokeStyle = col;
  c.lineCap = 'round';
  c.lineJoin = 'round';
  c.stroke();
}
function curve(c, fn, w = 3.4, col = INK) {
  c.beginPath();
  fn(c);
  c.lineWidth = w;
  c.strokeStyle = col;
  c.lineCap = 'round';
  c.stroke();
}
function shine(c, x, y, rx, ry, rot = -0.5, a = 0.6) {
  c.beginPath();
  c.ellipse(x, y, rx, ry, rot, 0, TAU);
  c.fillStyle = `rgba(255,255,255,${a})`;
  c.fill();
}
function dot(c, x, y, r, col = INK) {
  c.beginPath();
  c.arc(x, y, r, 0, TAU);
  c.fillStyle = col;
  c.fill();
}
function eye(c, x, y, r = 3.6) {
  dot(c, x, y, r, '#fff');
  dot(c, x + r * 0.15, y + r * 0.1, r * 0.62, INK);
  dot(c, x - r * 0.1, y - r * 0.2, r * 0.22, '#fff');
}

// ---- shapes: fn(c, a, b) with a = primary colour, b = secondary ----
const D = {};

function fishBody(c, a, b, o) {
  const { cx, cy, rx, ry, tailW = 22, tailH = 22 } = o;
  const tx = cx + rx - 4;
  shape(c, poly([[tx, cy], [tx + tailW, cy - tailH], [tx + tailW - 7, cy], [tx + tailW, cy + tailH]]), b || dark(a, 0.15));
  shape(c, poly([[cx - 6, cy - ry + 3], [cx + 4, cy - ry - 12], [cx + 16, cy - ry + 4]]), b || dark(a, 0.15));
  shape(c, ell(cx, cy, rx, ry), a);
  c.save();
  c.beginPath();
  ell(cx, cy, rx, ry)(c);
  c.clip();
  c.fillStyle = 'rgba(255,255,255,.4)';
  c.fillRect(cx - rx, cy + ry * 0.35, rx * 2, ry);
  if (b) { c.fillStyle = b; c.globalAlpha = 0.45; for (let i = 0; i < 3; i++) c.fillRect(cx - 2 + i * 9, cy - ry, 4, ry * 1.4); }
  c.restore();
  curve(c, (k) => k.arc(cx - rx * 0.45, cy, ry * 0.7, -0.9, 0.9), 2.4);
  eye(c, cx - rx * 0.62, cy - ry * 0.18, Math.max(3, ry * 0.2));
  shine(c, cx - 2, cy - ry * 0.5, rx * 0.35, ry * 0.14, -0.1, 0.45);
}
D.fish_small = (c, a, b) => fishBody(c, a, b, { cx: 42, cy: 52, rx: 28, ry: 19 });
D.fish_long = (c, a, b) => fishBody(c, a, b, { cx: 42, cy: 52, rx: 36, ry: 12, tailW: 18, tailH: 16 });
D.fish_round = (c, a, b) => fishBody(c, a, b, { cx: 44, cy: 52, rx: 30, ry: 28, tailW: 16, tailH: 14 });
D.fish_flat = (c, a, b) => {
  shape(c, ell(50, 52, 40, 24), b || dark(a, 0.12));
  shape(c, ell(50, 52, 33, 18), a);
  eye(c, 30, 46, 3.4); eye(c, 40, 42, 3.4);
  for (const [x, y] of [[52, 52], [62, 46], [60, 60], [70, 54]]) dot(c, x, y, 2.4, dark(a, 0.3));
  shine(c, 48, 44, 12, 3.5, -0.2, 0.4);
};
D.eel = (c, a) => {
  const p = (k) => { k.moveTo(14, 66); k.bezierCurveTo(30, 22, 44, 82, 58, 44); k.bezierCurveTo(66, 24, 78, 32, 86, 22); };
  curve(c, p, 17, INK); curve(c, p, 11, a); curve(c, p, 3, 'rgba(255,255,255,.45)');
  eye(c, 18, 62, 3);
};
D.crab_item = (c, a, b) => {
  for (const s of [-1, 1]) {
    line(c, [[50 + s * 14, 62], [50 + s * 30, 70], [50 + s * 34, 80]], 4, INK);
    line(c, [[50 + s * 12, 56], [50 + s * 32, 58], [50 + s * 38, 68]], 4, INK);
    line(c, [[50 + s * 20, 44], [50 + s * 30, 32]], 4, INK);
    shape(c, circ(50 + s * 32, 26, 12), b || a);
    shape(c, poly([[50 + s * 28, 20], [50 + s * 34, 6], [50 + s * 40, 20]]), b || a);
  }
  shape(c, ell(50, 56, 28, 20), a);
  eye(c, 40, 40, 3.2); eye(c, 60, 40, 3.2);
  curve(c, (k) => k.arc(50, 56, 7, 0.3, Math.PI - 0.3), 2.4);
  shine(c, 40, 50, 9, 3, -0.3, 0.5);
};
D.shrimp = (c, a, b) => {
  const body = (k) => { k.moveTo(78, 30); k.bezierCurveTo(48, 10, 14, 34, 28, 64); k.bezierCurveTo(32, 74, 44, 74, 48, 68); };
  curve(c, body, 24, INK); curve(c, body, 17, a);
  curve(c, (k) => { k.moveTo(60, 20); k.lineTo(52, 40); }, 2.6, dark(a, 0.3));
  curve(c, (k) => { k.moveTo(42, 18); k.lineTo(36, 40); }, 2.6, dark(a, 0.3));
  shape(c, poly([[40, 62], [30, 84], [42, 76], [54, 82], [50, 62]]), b || dark(a, 0.1));
  line(c, [[78, 30], [92, 18]], 2.6); line(c, [[80, 34], [94, 36]], 2.6);
  eye(c, 74, 32, 3.2);
};
D.shell_spiral = (c, a, b) => {
  shape(c, poly([[50, 6], [76, 70], [50, 88], [24, 70]]), a);
  shape(c, ell(50, 74, 28, 16), b || light(a, 0.2));
  for (let i = 0; i < 4; i++) curve(c, (k) => k.ellipse(50, 28 + i * 14, 8 + i * 5, 4 + i * 1.5, 0, Math.PI * 1.05, Math.PI * 1.95), 2.6);
  curve(c, (k) => { k.moveTo(36, 74); k.quadraticCurveTo(50, 82, 66, 72); }, 2.6);
  shine(c, 44, 40, 4, 12, 0.2, 0.5);
};
D.shell_fan = (c, a, b) => {
  shape(c, (k) => { k.moveTo(50, 84); k.bezierCurveTo(6, 64, 4, 24, 28, 18); k.quadraticCurveTo(50, 8, 72, 18); k.bezierCurveTo(96, 24, 94, 64, 50, 84); }, a);
  for (let i = -3; i <= 3; i++) line(c, [[50, 82], [50 + i * 12, 24 + Math.abs(i) * 3]], 2.4, dark(a, 0.35));
  shape(c, rr(40, 78, 20, 10, 4), b || dark(a, 0.15));
  shine(c, 34, 34, 8, 3, 0.6, 0.45);
};
D.starfish = (c, a) => {
  const pts = [];
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 17 : 42; const ang = -Math.PI / 2 + (i * Math.PI) / 5; pts.push([50 + Math.cos(ang) * r, 54 + Math.sin(ang) * r]); }
  shape(c, poly(pts), a, 5);
  for (let i = 0; i < 5; i++) { const ang = -Math.PI / 2 + (i * TAU) / 5; dot(c, 50 + Math.cos(ang) * 22, 54 + Math.sin(ang) * 22, 2.2, dark(a, 0.3)); }
  dot(c, 50, 54, 3, dark(a, 0.3));
  eye(c, 44, 50, 2.6); eye(c, 56, 50, 2.6);
};
D.mushroom = (c, a, b) => {
  shape(c, (k) => { k.moveTo(38, 52); k.quadraticCurveTo(34, 86, 40, 90); k.lineTo(60, 90); k.quadraticCurveTo(66, 86, 62, 52); k.closePath(); }, b || '#fff1d6');
  shape(c, (k) => { k.moveTo(8, 56); k.bezierCurveTo(8, 18, 92, 18, 92, 56); k.quadraticCurveTo(50, 66, 8, 56); }, a);
  for (const [x, y, r] of [[30, 40, 6], [52, 30, 7], [72, 42, 5.5], [48, 50, 3.5]]) { dot(c, x, y, r, '#fff8ea'); }
  shine(c, 28, 30, 9, 3, -0.5, 0.45);
  eye(c, 45, 74, 2.4); eye(c, 55, 74, 2.4);
};
D.berry = (c, a) => {
  shape(c, poly([[48, 28], [38, 14], [52, 18], [62, 8], [58, 26]]), '#6fb85a');
  for (const [x, y] of [[34, 56], [66, 56], [50, 70], [50, 44]]) { shape(c, circ(x, y, 17), a); shine(c, x - 5, y - 6, 4, 6, 0.4, 0.55); dot(c, x + 4, y + 6, 1.8, dark(a, 0.4)); }
};
D.herb = (c, a, b) => {
  curve(c, (k) => { k.moveTo(50, 92); k.quadraticCurveTo(48, 60, 50, 22); }, 4.5, INK);
  curve(c, (k) => { k.moveTo(50, 92); k.quadraticCurveTo(48, 60, 50, 22); }, 2, dark(a, 0.2));
  const leaf = (x, y, rot, col) => { c.save(); c.translate(x, y); c.rotate(rot); shape(c, ell(0, -12, 8, 15), col); line(c, [[0, 0], [0, -22]], 1.6, dark(col, 0.35)); c.restore(); };
  leaf(50, 28, 0, a); leaf(49, 50, -1.0, b || a); leaf(50, 50, 1.0, b || a); leaf(49, 72, -0.95, a); leaf(50, 72, 0.95, a);
};
D.leaf = (c, a) => {
  shape(c, (k) => { k.moveTo(14, 84); k.bezierCurveTo(8, 30, 52, 6, 90, 12); k.bezierCurveTo(94, 56, 56, 92, 14, 84); }, a);
  curve(c, (k) => { k.moveTo(14, 84); k.quadraticCurveTo(46, 58, 80, 22); }, 3, dark(a, 0.45));
  for (const [x, y, x2, y2] of [[34, 70, 30, 48], [48, 58, 50, 36], [60, 46, 74, 46]]) line(c, [[x, y], [x2, y2]], 2, dark(a, 0.4));
  shine(c, 40, 30, 10, 3, -0.7, 0.4);
};
function petals(c, cx, cy, n, r, pr, col) {
  for (let i = 0; i < n; i++) { const ang = (i * TAU) / n - Math.PI / 2; shape(c, circ(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, pr), col, 3); }
}
D.flower = (c, a, b) => {
  curve(c, (k) => { k.moveTo(50, 92); k.quadraticCurveTo(54, 70, 50, 56); }, 4.5, INK);
  curve(c, (k) => { k.moveTo(50, 92); k.quadraticCurveTo(54, 70, 50, 56); }, 2, '#5aa84a');
  shape(c, ell(62, 76, 12, 6, -0.5), '#6fb85a', 2.6);
  petals(c, 50, 38, 5, 17, 13, a);
  shape(c, circ(50, 38, 11), b || '#f4c542');
  shine(c, 46, 34, 4, 3, 0, 0.6);
};
D.flower_bunch = (c, a, b) => {
  const f = (x, y, s, col) => { c.save(); c.translate(x, y); c.scale(s, s); petals(c, 0, 0, 5, 10, 8, col); shape(c, circ(0, 0, 7), b || '#f4c542', 2.4); c.restore(); };
  for (const [x, y] of [[26, 30], [74, 30], [50, 22]]) line(c, [[x, y], [50, 88]], 4.5, INK);
  for (const [x, y] of [[26, 30], [74, 30], [50, 22]]) line(c, [[x, y], [50, 88]], 2, '#5aa84a');
  f(26, 32, 1.05, a); f(74, 32, 1.05, light(a, 0.2)); f(50, 22, 1.2, a);
  shape(c, poly([[36, 76], [64, 76], [58, 92], [42, 92]]), '#e8c88a', 3);
  line(c, [[32, 76], [68, 76]], 4);
};
D.acorn = (c, a) => {
  shape(c, (k) => { k.moveTo(24, 46); k.quadraticCurveTo(26, 90, 50, 92); k.quadraticCurveTo(74, 90, 76, 46); k.closePath(); }, a);
  shape(c, (k) => { k.moveTo(18, 48); k.bezierCurveTo(18, 22, 82, 22, 82, 48); k.closePath(); }, dark(a, 0.25));
  for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) dot(c, 30 + j * 13 + (i % 2) * 6, 32 + i * 6, 1.8, 'rgba(255,255,255,.35)');
  line(c, [[50, 24], [52, 12]], 4.5);
  shine(c, 38, 66, 4, 10, 0.2, 0.5);
};
D.pinecone = (c, a) => {
  shape(c, ell(50, 54, 26, 38), a);
  c.save(); c.beginPath(); ell(50, 54, 26, 38)(c); c.clip();
  for (let r = 0; r < 6; r++) for (let q = 0; q < 4; q++) { shape(c, ell(30 + q * 14 + (r % 2) * 7, 26 + r * 12, 8, 6.5), light(a, 0.1 + r * 0.03), 2.2); }
  c.restore();
  shape(c, ell(50, 54, 26, 38), 'rgba(0,0,0,0)', 3.6);
  line(c, [[50, 16], [50, 8]], 4);
};
D.nut = (c, a) => {
  shape(c, ell(50, 54, 30, 28), a);
  curve(c, (k) => { k.moveTo(50, 28); k.quadraticCurveTo(40, 54, 50, 82); }, 2.6);
  for (const x of [34, 66]) curve(c, (k) => { k.moveTo(x, 36); k.quadraticCurveTo(x + (x < 50 ? -4 : 4), 54, x, 72); }, 2, dark(a, 0.4));
  shine(c, 38, 40, 7, 4, -0.6, 0.5);
};
D.honey_jar = (c, a, b) => {
  shape(c, rr(30, 14, 40, 14, 5), b || '#c79a6b');
  shape(c, (k) => { k.moveTo(28, 30); k.quadraticCurveTo(14, 52, 22, 76); k.quadraticCurveTo(26, 90, 40, 90); k.lineTo(60, 90); k.quadraticCurveTo(74, 90, 78, 76); k.quadraticCurveTo(86, 52, 72, 30); k.closePath(); }, a || '#f2b632');
  shape(c, rr(34, 48, 32, 24, 6), '#fff4dc', 2.6);
  c.fillStyle = INK; c.font = 'bold 15px sans-serif'; c.textAlign = 'center'; c.fillText('~', 50, 66);
  curve(c, (k) => { k.moveTo(30, 30); k.quadraticCurveTo(36, 40, 34, 46); }, 4, light(a || '#f2b632', 0.4));
  shine(c, 28, 62, 3, 10, 0, 0.5);
};
D.bread_loaf = (c, a) => {
  shape(c, (k) => { k.moveTo(12, 66); k.bezierCurveTo(4, 28, 30, 22, 50, 24); k.bezierCurveTo(70, 22, 96, 28, 88, 66); k.quadraticCurveTo(86, 80, 74, 80); k.lineTo(26, 80); k.quadraticCurveTo(14, 80, 12, 66); }, a);
  for (const x of [32, 50, 68]) curve(c, (k) => { k.moveTo(x - 6, 36); k.quadraticCurveTo(x, 44, x - 2, 54); }, 3.4, dark(a, 0.35));
  shine(c, 30, 34, 10, 3, -0.4, 0.45);
};
D.bread_roll = (c, a) => {
  shape(c, ell(50, 56, 38, 30), a);
  curve(c, (k) => { k.moveTo(34, 44); k.quadraticCurveTo(50, 56, 66, 44); }, 3, dark(a, 0.35));
  curve(c, (k) => { k.moveTo(40, 60); k.quadraticCurveTo(50, 70, 60, 60); }, 3, dark(a, 0.35));
  shine(c, 34, 40, 10, 4, -0.5, 0.5);
};
D.croissant = (c, a) => {
  const seg = [[50, 50, 18, 24, 0], [32, 54, 14, 20, -0.5], [68, 54, 14, 20, 0.5], [18, 64, 10, 14, -0.9], [82, 64, 10, 14, 0.9]];
  for (const s of [seg[3], seg[4], seg[1], seg[2], seg[0]]) shape(c, ell(s[0], s[1], s[2], s[3], s[4]), a);
  for (const x of [38, 50, 62]) curve(c, (k) => { k.moveTo(x, 34); k.quadraticCurveTo(x - 3, 48, x, 62); }, 2.4, dark(a, 0.35));
  shine(c, 46, 34, 6, 3, 0, 0.5);
};
D.cake_slice = (c, a, b) => {
  shape(c, poly([[12, 40], [88, 22], [88, 78], [12, 78]]), '#ffe9b8');
  shape(c, poly([[12, 54], [88, 44], [88, 52], [12, 64]]), a || '#ff9fb8', 3);
  shape(c, (k) => { k.moveTo(12, 40); k.lineTo(88, 22); k.lineTo(88, 34); k.quadraticCurveTo(70, 50, 62, 38); k.quadraticCurveTo(50, 48, 40, 40); k.quadraticCurveTo(28, 52, 12, 46); k.closePath(); }, b || '#fff');
  shape(c, circ(52, 22, 7), '#e0305a', 2.6); line(c, [[52, 15], [56, 8]], 2.2);
  shine(c, 20, 70, 3, 5, 0, 0.4);
};
D.cookie = (c, a, b) => {
  shape(c, circ(50, 52, 36), a);
  for (const [x, y] of [[36, 40], [58, 36], [64, 58], [42, 62], [50, 50], [30, 56]]) shape(c, ell(x, y, 5.5, 4.5, 0.5), b || '#5a3524', 1.6);
  curve(c, (k) => k.arc(50, 52, 29, 3.4, 4.5), 2, light(a, 0.5));
};
D.pie = (c, a, b) => {
  shape(c, poly([[10, 54], [90, 54], [78, 84], [22, 84]]), b || '#e8b86a');
  shape(c, ell(50, 52, 42, 22), a || '#d98a3a');
  for (let i = -2; i <= 2; i++) line(c, [[50 + i * 14 - 12, 36], [50 + i * 14 + 14, 68]], 4, light(b || '#e8b86a', 0.1));
  for (let i = -2; i <= 2; i++) line(c, [[50 + i * 14 + 12, 36], [50 + i * 14 - 14, 68]], 4, light(b || '#e8b86a', 0.1));
  shape(c, ell(50, 52, 42, 22), 'rgba(0,0,0,0)', 3.6);
  for (let i = 0; i < 12; i++) dot(c, 50 + Math.cos((i * TAU) / 12) * 42, 52 + Math.sin((i * TAU) / 12) * 22, 3, light(b || '#e8b86a', 0.2));
};
D.sandwich = (c, a, b) => {
  shape(c, (k) => { k.moveTo(10, 44); k.quadraticCurveTo(10, 20, 50, 20); k.quadraticCurveTo(90, 20, 90, 44); k.closePath(); }, '#e8b86a');
  shape(c, (k) => { k.moveTo(8, 46); for (let i = 0; i < 8; i++) k.quadraticCurveTo(8 + i * 12 + 3, 56, 8 + (i + 1) * 12, 46); k.lineTo(92, 46); k.closePath(); }, a || '#6fb85a');
  shape(c, rr(10, 52, 80, 8, 4), b || '#ff9fb8', 3);
  shape(c, rr(14, 60, 72, 8, 4), '#f4c542', 3);
  shape(c, (k) => { k.moveTo(10, 68); k.lineTo(90, 68); k.quadraticCurveTo(90, 84, 50, 84); k.quadraticCurveTo(10, 84, 10, 68); }, '#e8b86a');
};
const steam = (c, x, y) => { for (const dx of [-8, 0, 8]) curve(c, (k) => { k.moveTo(x + dx, y); k.bezierCurveTo(x + dx - 6, y - 8, x + dx + 6, y - 14, x + dx, y - 22); }, 3, 'rgba(255,255,255,.85)'); };
D.soup_bowl = (c, a, b) => {
  steam(c, 50, 36);
  shape(c, (k) => { k.moveTo(10, 48); k.lineTo(90, 48); k.quadraticCurveTo(88, 86, 50, 86); k.quadraticCurveTo(12, 86, 10, 48); }, b || '#e8d2a8');
  shape(c, ell(50, 48, 40, 9), a || '#e8873a', 3);
  for (const [x, y] of [[36, 47], [52, 50], [64, 46]]) dot(c, x, y, 3, light(a || '#e8873a', 0.5));
  shine(c, 22, 64, 3, 8, -0.3, 0.45);
};
D.mug = (c, a, b) => {
  steam(c, 44, 30);
  curve(c, (k) => { k.moveTo(72, 48); k.bezierCurveTo(98, 44, 98, 76, 70, 74); }, 11, INK);
  curve(c, (k) => { k.moveTo(72, 48); k.bezierCurveTo(98, 44, 98, 76, 70, 74); }, 5, a);
  shape(c, (k) => { k.moveTo(18, 40); k.lineTo(74, 40); k.lineTo(70, 82); k.quadraticCurveTo(68, 88, 60, 88); k.lineTo(32, 88); k.quadraticCurveTo(24, 88, 22, 82); k.closePath(); }, a);
  shape(c, ell(46, 42, 28, 5), b || '#8a5a3a', 2.4);
  shine(c, 28, 66, 3, 12, 0, 0.45);
};
D.teapot = (c, a, b) => {
  shape(c, (k) => { k.moveTo(72, 42); k.lineTo(94, 24); k.lineTo(90, 52); k.lineTo(72, 56); k.closePath(); }, a);
  curve(c, (k) => { k.moveTo(24, 40); k.bezierCurveTo(4, 36, 4, 68, 26, 68); }, 9, INK);
  curve(c, (k) => { k.moveTo(24, 40); k.bezierCurveTo(4, 36, 4, 68, 26, 68); }, 4, b || a);
  shape(c, ell(48, 58, 30, 26), a);
  shape(c, (k) => { k.moveTo(28, 36); k.quadraticCurveTo(48, 24, 68, 36); k.closePath(); }, b || dark(a, 0.1));
  dot(c, 48, 22, 5, INK); dot(c, 48, 22, 3, b || a);
  curve(c, (k) => k.arc(48, 62, 14, 0.2, 2.9), 3, 'rgba(255,255,255,.7)');
  shine(c, 34, 50, 4, 8, 0.4, 0.5);
};
D.cup_cocoa = (c, a, b) => {
  steam(c, 46, 34);
  shape(c, ell(50, 82, 40, 9), '#fff4dc');
  curve(c, (k) => { k.moveTo(72, 52); k.bezierCurveTo(94, 50, 94, 74, 70, 74); }, 9, INK);
  curve(c, (k) => { k.moveTo(72, 52); k.bezierCurveTo(94, 50, 94, 74, 70, 74); }, 4, '#fff4dc');
  shape(c, (k) => { k.moveTo(20, 44); k.lineTo(76, 44); k.quadraticCurveTo(74, 82, 48, 82); k.quadraticCurveTo(22, 82, 20, 44); }, '#fff4dc');
  shape(c, ell(48, 45, 28, 6), a || '#7a4a30', 2.4);
  shape(c, (k) => { k.moveTo(34, 44); k.quadraticCurveTo(40, 34, 48, 40); k.quadraticCurveTo(56, 30, 62, 44); k.closePath(); }, '#fff', 2.4);
  shape(c, rr(30, 58, 36, 10, 5), b || '#e0607e', 2.4);
};
D.fruit_apple = (c, a) => {
  shape(c, (k) => { k.moveTo(50, 28); k.bezierCurveTo(30, 14, 8, 30, 12, 56); k.bezierCurveTo(16, 84, 38, 92, 50, 84); k.bezierCurveTo(62, 92, 84, 84, 88, 56); k.bezierCurveTo(92, 30, 70, 14, 50, 28); }, a);
  line(c, [[50, 28], [54, 10]], 4.5);
  shape(c, ell(66, 16, 14, 7, -0.4), '#6fb85a', 3);
  shine(c, 28, 46, 6, 12, 0.3, 0.55);
};
D.fruit_orange = (c, a) => {
  shape(c, circ(50, 56, 34), a);
  for (let i = 0; i < 14; i++) dot(c, 30 + ((i * 37) % 40), 40 + ((i * 53) % 34), 1.3, dark(a, 0.25));
  shape(c, ell(52, 22, 14, 7, -0.3), '#6fb85a', 3);
  dot(c, 50, 24, 3, '#5aa84a');
  shine(c, 36, 40, 8, 12, 0.5, 0.5);
};
D.egg = (c, a) => {
  shape(c, (k) => { k.moveTo(50, 10); k.bezierCurveTo(78, 10, 86, 54, 80, 70); k.bezierCurveTo(74, 90, 26, 90, 20, 70); k.bezierCurveTo(14, 54, 22, 10, 50, 10); }, a || '#fff4dc');
  shine(c, 36, 34, 6, 12, 0.3, 0.6);
  for (const [x, y] of [[56, 60], [44, 70], [62, 46]]) dot(c, x, y, 2, dark(a || '#fff4dc', 0.18));
};
D.cheese = (c, a) => {
  shape(c, poly([[10, 60], [86, 30], [90, 66], [10, 72]]), a);
  shape(c, poly([[10, 60], [86, 30], [90, 66], [88, 66], [12, 62]]), light(a, 0.25), 2);
  shape(c, ell(50, 34, 40, 3), 'rgba(0,0,0,0)', 0.1);
  for (const [x, y, r] of [[30, 66, 5], [54, 62, 4], [72, 54, 6], [64, 45, 3.2]]) { dot(c, x, y, r, dark(a, 0.28)); }
  curve(c, (k) => { k.moveTo(10, 60); k.lineTo(86, 30); }, 3.4);
};
D.book = (c, a, b) => {
  shape(c, rr(18, 12, 66, 78, 8), a);
  shape(c, rr(24, 12, 60, 76, 6), dark(a, 0.1), 2.4);
  shape(c, rr(26, 8, 56, 74, 6), a);
  shape(c, rr(36, 20, 38, 24, 4), b || '#f4e2b0', 2.6);
  line(c, [[40, 54], [70, 54]], 3, light(a, 0.5)); line(c, [[40, 62], [62, 62]], 3, light(a, 0.5));
  line(c, [[30, 12], [30, 80]], 3, dark(a, 0.3));
};
D.scroll = (c, a, b) => {
  shape(c, rr(24, 20, 56, 62, 4), a || '#f4e2b0');
  for (const y of [32, 44, 56, 68]) line(c, [[34, y], [70, y]], 2.6, dark(a || '#f4e2b0', 0.3));
  shape(c, rr(14, 14, 76, 12, 6), b || '#c79a6b'); shape(c, rr(14, 76, 76, 12, 6), b || '#c79a6b');
};
D.letter = (c, a, b) => {
  shape(c, rr(10, 22, 80, 58, 6), a || '#fffaf0');
  curve(c, (k) => { k.moveTo(10, 28); k.lineTo(50, 56); k.lineTo(90, 28); }, 3.4);
  curve(c, (k) => { k.moveTo(10, 78); k.lineTo(38, 52); }, 2.4, dark(a || '#fffaf0', 0.2));
  curve(c, (k) => { k.moveTo(90, 78); k.lineTo(62, 52); }, 2.4, dark(a || '#fffaf0', 0.2));
  shape(c, circ(50, 56, 9), b || '#e0607e', 2.6);
  c.save(); c.translate(50, 56); c.scale(0.4, 0.4); shape(c, (k) => { k.moveTo(0, 12); k.bezierCurveTo(-26, -6, -12, -20, 0, -8); k.bezierCurveTo(12, -20, 26, -6, 0, 12); }, '#fff', 0); c.restore();
};
D.key = (c, a) => {
  shape(c, circ(30, 36, 22), a); shape(c, circ(30, 36, 9), 'rgba(0,0,0,0)', 3.4); c.beginPath(); c.arc(30, 36, 9, 0, TAU); c.fillStyle = 'rgba(255,248,230,.9)'; c.fill(); c.stroke();
  shape(c, rr(42, 52, 12, 44, 3), a); c.save(); c.translate(0, 0);
  c.restore();
  shape(c, poly([[46, 54], [88, 80], [80, 90], [40, 62]]), a);
  shape(c, rr(66, 70, 14, 10, 2), a, 2.6);
  shine(c, 22, 28, 6, 3, -0.6, 0.6);
};
D.coin = (c, a) => {
  shape(c, circ(50, 50, 38), a || '#f4c542');
  shape(c, circ(50, 50, 28), light(a || '#f4c542', 0.2), 2.6);
  c.fillStyle = dark(a || '#f4c542', 0.45); c.font = 'bold 36px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('✦', 50, 52);
  shine(c, 34, 30, 10, 4, -0.7, 0.6);
};
D.gem = (c, a) => {
  shape(c, poly([[24, 20], [76, 20], [92, 40], [50, 90], [8, 40]]), a);
  const t = light(a, 0.35), s = dark(a, 0.2);
  shape(c, poly([[24, 20], [40, 20], [30, 40], [8, 40]]), t, 2); shape(c, poly([[76, 20], [60, 20], [70, 40], [92, 40]]), s, 2);
  shape(c, poly([[40, 20], [60, 20], [70, 40], [50, 90], [30, 40]]), a, 2);
  line(c, [[8, 40], [92, 40]], 2.4);
  shine(c, 42, 28, 4, 2, 0, 0.7);
};
D.crystal = (c, a) => {
  shape(c, poly([[30, 90], [22, 44], [36, 14], [50, 44], [46, 90]]), light(a, 0.1));
  shape(c, poly([[50, 90], [44, 36], [60, 6], [76, 36], [72, 90]]), a);
  shape(c, poly([[66, 90], [64, 54], [76, 38], [90, 56], [86, 90]]), dark(a, 0.1));
  shine(c, 56, 34, 3, 12, 0.15, 0.55);
};
D.feather = (c, a) => {
  shape(c, (k) => { k.moveTo(16, 90); k.bezierCurveTo(10, 40, 40, 8, 88, 8); k.bezierCurveTo(90, 54, 54, 84, 16, 90); }, a);
  curve(c, (k) => { k.moveTo(12, 94); k.quadraticCurveTo(44, 56, 84, 12); }, 3.4);
  for (let i = 0; i < 5; i++) line(c, [[24 + i * 12, 76 - i * 12], [24 + i * 12 - 2, 54 - i * 12]], 2, dark(a, 0.3));
};
D.bottle = (c, a, b) => {
  shape(c, rr(40, 6, 20, 12, 3), b || '#c79a6b');
  shape(c, (k) => { k.moveTo(42, 18); k.lineTo(42, 32); k.quadraticCurveTo(22, 40, 22, 62); k.lineTo(22, 80); k.quadraticCurveTo(22, 92, 34, 92); k.lineTo(66, 92); k.quadraticCurveTo(78, 92, 78, 80); k.lineTo(78, 62); k.quadraticCurveTo(78, 40, 58, 32); k.lineTo(58, 18); k.closePath(); }, 'rgba(206,238,250,.9)');
  shape(c, (k) => { k.moveTo(24, 62); k.lineTo(76, 62); k.lineTo(76, 80); k.quadraticCurveTo(76, 90, 66, 90); k.lineTo(34, 90); k.quadraticCurveTo(24, 90, 24, 80); k.closePath(); }, a, 2.4);
  shine(c, 32, 70, 3, 10, 0, 0.55);
};
D.jar = (c, a, b) => {
  shape(c, rr(26, 10, 48, 14, 5), b || '#c79a6b');
  shape(c, (k) => { k.moveTo(28, 26); k.lineTo(72, 26); k.quadraticCurveTo(84, 36, 82, 56); k.lineTo(82, 80); k.quadraticCurveTo(82, 92, 70, 92); k.lineTo(30, 92); k.quadraticCurveTo(18, 92, 18, 80); k.lineTo(18, 56); k.quadraticCurveTo(16, 36, 28, 26); }, 'rgba(216,240,248,.92)');
  shape(c, (k) => { k.moveTo(20, 50); k.lineTo(80, 50); k.lineTo(80, 80); k.quadraticCurveTo(80, 90, 70, 90); k.lineTo(30, 90); k.quadraticCurveTo(20, 90, 20, 80); k.closePath(); }, a, 2.4);
  shine(c, 28, 62, 3, 12, 0, 0.55);
};
D.lantern = (c, a, b) => {
  curve(c, (k) => { k.moveTo(32, 20); k.quadraticCurveTo(50, -6, 68, 20); }, 4);
  shape(c, rr(30, 18, 40, 10, 4), '#6a4a3a');
  shape(c, (k) => { k.moveTo(32, 28); k.lineTo(68, 28); k.quadraticCurveTo(84, 50, 68, 76); k.lineTo(32, 76); k.quadraticCurveTo(16, 50, 32, 28); }, a || '#ffd978');
  c.save(); c.beginPath(); c.moveTo(32, 28); c.lineTo(68, 28); c.quadraticCurveTo(84, 50, 68, 76); c.lineTo(32, 76); c.quadraticCurveTo(16, 50, 32, 28); c.clip();
  const g = c.createRadialGradient(50, 54, 2, 50, 54, 28); g.addColorStop(0, 'rgba(255,255,230,.95)'); g.addColorStop(1, 'rgba(255,200,80,0)'); c.fillStyle = g; c.fillRect(10, 20, 80, 70); c.restore();
  shape(c, (k) => { k.moveTo(50, 40); k.quadraticCurveTo(62, 54, 56, 64); k.quadraticCurveTo(50, 70, 44, 64); k.quadraticCurveTo(38, 54, 50, 40); }, '#ffb43a', 2);
  line(c, [[42, 28], [38, 76]], 2.6); line(c, [[58, 28], [62, 76]], 2.6);
  shape(c, rr(28, 76, 44, 10, 4), b || '#6a4a3a');
};
D.candle = (c, a) => {
  shape(c, (k) => { k.moveTo(50, 6); k.quadraticCurveTo(64, 22, 56, 30); k.quadraticCurveTo(50, 34, 44, 30); k.quadraticCurveTo(36, 22, 50, 6); }, '#ffb43a', 3);
  shape(c, (k) => { k.moveTo(50, 16); k.quadraticCurveTo(56, 24, 53, 28); k.quadraticCurveTo(50, 30, 47, 28); k.quadraticCurveTo(44, 24, 50, 16); }, '#fff6c0', 0.1);
  line(c, [[50, 32], [50, 38]], 3);
  shape(c, (k) => { k.moveTo(34, 40); k.lineTo(66, 40); k.lineTo(66, 82); k.lineTo(34, 82); k.closePath(); }, a || '#fff4dc');
  shape(c, ell(50, 40, 16, 4), light(a || '#fff4dc', 0.3), 2.6);
  curve(c, (k) => { k.moveTo(58, 42); k.quadraticCurveTo(60, 56, 56, 56); }, 4, light(a || '#fff4dc', 0.5));
  shape(c, ell(50, 86, 26, 7), '#c79a6b');
};
D.wick = (c, a) => {
  shape(c, rr(36, 50, 28, 40, 8), a || '#fff4dc');
  for (let y = 58; y < 86; y += 8) line(c, [[36, y], [64, y + 4]], 2.4, dark(a || '#fff4dc', 0.25));
  curve(c, (k) => { k.moveTo(50, 50); k.quadraticCurveTo(44, 36, 54, 24); }, 3.6);
  shape(c, (k) => { k.moveTo(54, 6); k.quadraticCurveTo(66, 16, 58, 26); k.quadraticCurveTo(52, 28, 50, 22); k.quadraticCurveTo(48, 14, 54, 6); }, '#ffb43a', 2.6);
  for (const [x, y] of [[26, 34], [78, 30], [74, 52]]) { c.save(); c.translate(x, y); shape(c, poly([[0, -6], [2, -2], [6, 0], [2, 2], [0, 6], [-2, 2], [-6, 0], [-2, -2]]), '#ffe27a', 1.6); c.restore(); }
};
D.glass_shard = (c, a) => {
  shape(c, poly([[16, 70], [34, 8], [58, 26], [84, 18], [70, 84], [40, 90]]), a || 'rgba(190,230,245,.9)');
  line(c, [[34, 8], [44, 56], [70, 84]], 2.4, 'rgba(255,255,255,.8)'); line(c, [[58, 26], [44, 56], [16, 70]], 2.4, 'rgba(255,255,255,.8)');
  shine(c, 28, 40, 3, 10, 0.3, 0.5);
};
D.lens = (c, a) => {
  line(c, [[66, 66], [90, 90]], 11, INK); line(c, [[66, 66], [90, 90]], 5, '#c79a6b');
  shape(c, circ(42, 42, 32), a || '#f4c542', 5);
  shape(c, circ(42, 42, 24), 'rgba(205,236,252,.88)', 2.4);
  shine(c, 32, 30, 9, 4, -0.7, 0.8);
};
D.gear = (c, a) => {
  const pts = [];
  for (let i = 0; i < 16; i++) { const r = i % 2 ? 26 : 38; for (const da of [-0.12, 0.12]) { const ang = (i * TAU) / 16 + da * (i % 2 ? 1 : 0.4); pts.push([50 + Math.cos(ang) * r, 50 + Math.sin(ang) * r]); } }
  shape(c, poly(pts), a, 3.2);
  shape(c, circ(50, 50, 24), light(a, 0.15), 2.4);
  shape(c, circ(50, 50, 10), '#fff4dc', 3);
  shine(c, 36, 34, 6, 3, -0.7, 0.5);
};
D.log = (c, a) => {
  shape(c, rr(8, 28, 74, 46, 10), a || '#a8744a');
  for (let i = 0; i < 3; i++) line(c, [[18 + i * 18, 36 + i * 3], [28 + i * 18, 64 - i * 2]], 2, dark(a || '#a8744a', 0.3));
  shape(c, ell(80, 50, 14, 24), light(a || '#a8744a', 0.35));
  shape(c, ell(80, 50, 8, 14), 'rgba(0,0,0,0)', 2); shape(c, ell(80, 50, 3, 6), 'rgba(0,0,0,0)', 2);
};
D.plank = (c, a) => {
  shape(c, poly([[8, 38], [78, 22], [92, 56], [22, 74]]), a || '#d9a86a');
  line(c, [[22, 44], [70, 34]], 2.2, dark(a || '#d9a86a', 0.25)); line(c, [[30, 60], [82, 48]], 2.2, dark(a || '#d9a86a', 0.25));
  dot(c, 20, 56, 2.5, INK); dot(c, 80, 40, 2.5, INK);
};
D.rock = (c, a) => {
  shape(c, (k) => { k.moveTo(10, 78); k.quadraticCurveTo(6, 50, 26, 34); k.quadraticCurveTo(40, 14, 62, 24); k.quadraticCurveTo(90, 34, 90, 64); k.quadraticCurveTo(92, 82, 74, 82); k.closePath(); }, a || '#a9a4a0');
  curve(c, (k) => { k.moveTo(36, 40); k.quadraticCurveTo(46, 52, 40, 66); }, 2.4, dark(a || '#a9a4a0', 0.35));
  shine(c, 38, 32, 10, 4, -0.4, 0.45);
};
D.ore = (c, a, b) => {
  D.rock(c, '#8c8782');
  for (const [x, y, r] of [[34, 56, 7], [58, 40, 8], [66, 64, 6]]) shape(c, poly([[x, y - r], [x + r, y], [x, y + r], [x - r, y]]), a || '#f4c542', 2.4);
  shine(c, 56, 36, 2.5, 2, 0, 0.9);
};
D.rope = (c, a) => {
  c.save();
  for (let r = 0; r < 3; r++) { curve(c, (k) => k.ellipse(50, 56, 38 - r * 11, 28 - r * 8, 0, 0, TAU), 11, INK); }
  for (let r = 0; r < 3; r++) { curve(c, (k) => k.ellipse(50, 56, 38 - r * 11, 28 - r * 8, 0, 0, TAU), 6, a || '#d9b36a'); }
  for (let i = 0; i < 18; i++) { const ang = (i * TAU) / 18; line(c, [[50 + Math.cos(ang) * 34, 56 + Math.sin(ang) * 24], [50 + Math.cos(ang + 0.15) * 38, 56 + Math.sin(ang + 0.15) * 28]], 1.8, dark(a || '#d9b36a', 0.35)); }
  c.restore();
};
D.parcel = (c, a, b) => {
  shape(c, poly([[10, 34], [50, 18], [90, 34], [50, 50]]), light(a || '#c79a6b', 0.2));
  shape(c, poly([[10, 34], [50, 50], [50, 90], [10, 72]]), a || '#c79a6b');
  shape(c, poly([[90, 34], [50, 50], [50, 90], [90, 72]]), dark(a || '#c79a6b', 0.14));
  line(c, [[30, 26], [70, 42]], 7, INK); line(c, [[30, 26], [70, 42]], 3.4, b || '#e0607e');
  line(c, [[50, 50], [50, 90]], 7, INK); line(c, [[50, 50], [50, 90]], 3.4, b || '#e0607e');
  shape(c, ell(42, 22, 8, 5, -0.4), b || '#e0607e', 2.6); shape(c, ell(58, 22, 8, 5, 0.4), b || '#e0607e', 2.6);
};
D.ribbon = (c, a) => {
  shape(c, poly([[34, 58], [20, 92], [38, 82], [46, 94], [52, 62]]), dark(a || '#e0607e', 0.1));
  shape(c, poly([[48, 58], [64, 92], [66, 76], [80, 86], [60, 58]]), dark(a || '#e0607e', 0.1));
  shape(c, (k) => { k.moveTo(48, 44); k.bezierCurveTo(30, 14, 4, 22, 14, 46); k.bezierCurveTo(22, 60, 42, 52, 48, 44); }, a || '#e0607e');
  shape(c, (k) => { k.moveTo(52, 44); k.bezierCurveTo(70, 14, 96, 22, 86, 46); k.bezierCurveTo(78, 60, 58, 52, 52, 44); }, a || '#e0607e');
  shape(c, circ(50, 48, 10), light(a || '#e0607e', 0.15));
  shine(c, 26, 32, 7, 3, 0.5, 0.5);
};
D.bag = (c, a, b) => {
  shape(c, (k) => { k.moveTo(34, 24); k.lineTo(66, 24); k.quadraticCurveTo(96, 44, 88, 80); k.quadraticCurveTo(84, 92, 70, 92); k.lineTo(30, 92); k.quadraticCurveTo(16, 92, 12, 80); k.quadraticCurveTo(4, 44, 34, 24); }, a || '#c79a6b');
  shape(c, (k) => { k.moveTo(30, 22); k.quadraticCurveTo(50, 36, 70, 22); k.lineTo(66, 12); k.quadraticCurveTo(50, 20, 34, 12); k.closePath(); }, b || '#e8c88a');
  curve(c, (k) => { k.moveTo(36, 28); k.quadraticCurveTo(50, 42, 64, 28); }, 3.4);
  shape(c, circ(50, 60, 8), b || '#e8c88a', 2.6);
  shine(c, 28, 56, 4, 12, 0.3, 0.4);
};
D.rod = (c, a, b) => {
  curve(c, (k) => { k.moveTo(8, 92); k.lineTo(84, 12); }, 9, INK); curve(c, (k) => { k.moveTo(8, 92); k.lineTo(84, 12); }, 4.5, a || '#a8744a');
  shape(c, circ(30, 70, 9), b || '#c0c8d0', 3); dot(c, 30, 70, 2.5);
  curve(c, (k) => { k.moveTo(84, 12); k.quadraticCurveTo(96, 40, 80, 70); }, 2.2, '#7a6a5a');
  shape(c, circ(80, 76, 6), '#e0607e', 2.6); shape(c, (k) => { k.arc(80, 76, 6, Math.PI, TAU); }, '#fff', 2.2);
};
D.bait = (c, a) => {
  shape(c, (k) => { k.moveTo(14, 70); k.bezierCurveTo(14, 28, 62, 28, 66, 56); k.bezierCurveTo(70, 80, 40, 86, 30, 70); k.bezierCurveTo(24, 62, 44, 56, 46, 64); }, a || '#e08a8a', 3.6);
  eye(c, 62, 46, 3); curve(c, (k) => { k.moveTo(70, 66); k.quadraticCurveTo(86, 72, 84, 88); k.quadraticCurveTo(82, 94, 76, 90); }, 3.6);
  shine(c, 30, 44, 5, 2, -0.5, 0.5);
};
D.net = (c, a) => {
  line(c, [[14, 92], [58, 44]], 7, INK); line(c, [[14, 92], [58, 44]], 3.4, '#a8744a');
  shape(c, circ(66, 36, 28), 'rgba(255,255,255,.18)', 5);
  for (let i = -2; i <= 2; i++) { line(c, [[66 + i * 11, 10], [66 + i * 11, 62]], 1.8, a || '#8a6a4a'); line(c, [[40, 36 + i * 11], [92, 36 + i * 11]], 1.8, a || '#8a6a4a'); }
  shape(c, circ(66, 36, 28), 'rgba(0,0,0,0)', 5);
};
D.map = (c, a) => {
  shape(c, poly([[8, 22], [36, 14], [64, 24], [92, 14], [92, 78], [64, 88], [36, 78], [8, 86]]), a || '#f4e2b0');
  line(c, [[36, 14], [36, 78]], 2.2, dark(a || '#f4e2b0', 0.35)); line(c, [[64, 24], [64, 88]], 2.2, dark(a || '#f4e2b0', 0.35));
  curve(c, (k) => { k.moveTo(16, 66); k.quadraticCurveTo(30, 40, 50, 56); k.quadraticCurveTo(68, 66, 84, 34); }, 2.4, '#c0405a');
  line(c, [[76, 28], [84, 38]], 3, '#c0405a'); line(c, [[84, 28], [76, 38]], 3, '#c0405a');
  shape(c, poly([[20, 36], [28, 28], [34, 40]]), '#6fb85a', 2);
};
D.star = (c, a) => {
  const pts = [];
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 20 : 44; const ang = -Math.PI / 2 + (i * Math.PI) / 5; pts.push([50 + Math.cos(ang) * r, 54 + Math.sin(ang) * r]); }
  shape(c, poly(pts), a || '#f4c542', 5);
  eye(c, 43, 54, 2.8); eye(c, 57, 54, 2.8);
  shine(c, 40, 36, 5, 3, -0.8, 0.6);
};
D.heart_charm = (c, a) => {
  curve(c, (k) => k.arc(50, 18, 12, 0, TAU), 4, '#c0c8d0');
  shape(c, (k) => { k.moveTo(50, 90); k.bezierCurveTo(8, 60, 4, 36, 14, 28); k.bezierCurveTo(30, 12, 46, 26, 50, 38); k.bezierCurveTo(54, 26, 70, 12, 86, 28); k.bezierCurveTo(96, 36, 92, 60, 50, 90); }, a || '#e0607e');
  shine(c, 30, 40, 6, 9, 0.6, 0.55);
};

// pleasant generic fallback glyph: a little gift sack with a sparkle
function fallbackGlyph(c, a, b) {
  D.bag(c, a, b);
  c.save(); c.translate(50, 58); shape(c, poly([[0, -12], [3.500, -3.500], [12, 0], [3.500, 3.500], [0, 12], [-3.500, 3.500], [-12, 0], [-3.500, -3.500]]), '#fff4dc', 2.2); c.restore();
}

export const ICON_DRAWERS = D;
/** Every ICON_SHAPES entry has a drawer; unknown shapes fall back to fallbackGlyph. */
export const hasDrawer = (shapeName) => Object.prototype.hasOwnProperty.call(D, shapeName);
export const coveredShapes = () => ICON_SHAPES.filter((s) => hasDrawer(s));

const cache = new Map();
/**
 * Cached canvas for an item definition (or {icon:{shape,colors}}); never throws.
 * @param {{icon?:{shape?:string,colors?:string[]}}} itemDef
 * @param {number} size CSS px
 */
export function itemIcon(itemDef, size = 48) {
  const ic = (itemDef && itemDef.icon) || {};
  const shapeName = ic.shape || 'bag';
  const colors = Array.isArray(ic.colors) && ic.colors.length ? ic.colors : ['#c79a6b', '#e8c88a'];
  const dpr = Math.min(2, (typeof devicePixelRatio === 'number' && devicePixelRatio) || 1);
  const px = Math.max(8, Math.round(size * dpr));
  const key = `${shapeName}|${colors.join(',')}|${px}`;
  let src = cache.get(key);
  if (!src) {
    src = document.createElement('canvas');
    src.width = px; src.height = px;
    const c = src.getContext('2d');
    if (c) {
      c.scale(px / 100, px / 100);
      c.save();
      try {
        (D[shapeName] || fallbackGlyph)(c, colors[0], colors[1]);
      } catch (_) {
        try { c.restore(); c.save(); fallbackGlyph(c, '#c79a6b', '#e8c88a'); } catch (__) { /* ignore */ }
      }
      c.restore();
    }
    cache.set(key, src);
  }
  const out = document.createElement('canvas'); // fresh element per call so it can be placed in several spots
  out.width = src.width; out.height = src.height;
  out.style.width = size + 'px'; out.style.height = size + 'px';
  const oc = out.getContext('2d');
  if (oc) oc.drawImage(src, 0, 0);
  return out;
}
