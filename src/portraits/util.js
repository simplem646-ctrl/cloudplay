// Portrait helpers: colour maths, Bezier path builders, canvases, layered "inked" groups.
// Pure functions; nothing here touches the DOM at import time.

/** Logical portrait size and internal supersampling. */
export const W = 512;
export const H = 640;
export const SS = 2;

// ---------------------------------------------------------------- colour

const hexCache = new Map();
/** '#rrggbb' -> [r,g,b] */
export function hex2rgb(hex) {
  let v = hexCache.get(hex);
  if (v) return v;
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  v = [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  hexCache.set(hex, v);
  return v;
}

export function rgb2hex([r, g, b]) {
  const c = (x) => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

/** Linear mix of two hex colours. */
export function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t]);
}

/** Cel shadow tone: multiply toward a cool-warm purple-brown, keeps saturation. */
export function shade(c, t = 0.28) {
  const [r, g, b] = hex2rgb(c);
  const m = [0.8, 0.72, 0.8];
  return mix(c, rgb2hex([r * m[0], g * m[1], b * m[2] + 6]), Math.min(1, t / 0.28));
}

export function tint(c, t = 0.3) { return mix(c, '#ffffff', t); }

/** Dark line colour derived from a fill colour (coloured line art). */
export function ink(c, t = 0.72) { return mix(c, '#24130f', t); }

export function rgba(c, a) {
  const [r, g, b] = hex2rgb(c);
  return `rgba(${r},${g},${b},${a})`;
}

// ---------------------------------------------------------------- canvases

/** Create a canvas lazily: DOM canvas when a document exists, else OffscreenCanvas. */
export function makeCanvas(w, h, preferDom = true) {
  if (preferDom && typeof document !== 'undefined' && document.createElement) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
  if (typeof document !== 'undefined') {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    return c;
  }
  return null;
}

export const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// ---------------------------------------------------------------- seeded jitter

export function seeded(seed) {
  let s = 0;
  for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------- path builders
// Every builder takes a path-like target `p` (Path2D or ctx) and appends sub-paths.

/**
 * Tapered hair lock: wide at `root`, pointed at `tip`.
 * bend = perpendicular offset (number or [b1,b2] for S-curves) in px.
 */
export function lock(p, root, tip, w, bend = 0, tipW = 0) {
  const dx = tip[0] - root[0], dy = tip[1] - root[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const [b1, b2] = Array.isArray(bend) ? bend : [bend, bend * 0.8];
  const c1 = [root[0] + dx * 0.36 + nx * b1, root[1] + dy * 0.36 + ny * b1];
  const c2 = [root[0] + dx * 0.72 + nx * b2, root[1] + dy * 0.72 + ny * b2];
  const h = w / 2;
  p.moveTo(root[0] + nx * h, root[1] + ny * h);
  p.bezierCurveTo(c1[0] + nx * h * 0.95, c1[1] + ny * h * 0.95, c2[0] + nx * h * 0.55, c2[1] + ny * h * 0.55, tip[0] + nx * tipW, tip[1] + ny * tipW);
  if (tipW) p.lineTo(tip[0] - nx * tipW, tip[1] - ny * tipW);
  p.bezierCurveTo(c2[0] - nx * h * 0.55, c2[1] - ny * h * 0.55, c1[0] - nx * h * 0.95, c1[1] - ny * h * 0.95, root[0] - nx * h, root[1] - ny * h);
  p.closePath();
}

/** Spindle: tapered at both ends (strand lines, lash flicks, marks). */
export function spindle(p, a, b, w, bend = 0) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const L = Math.hypot(dx, dy) || 1;
  const nx = -dy / L, ny = dx / L;
  const m = [a[0] + dx * 0.5 + nx * bend, a[1] + dy * 0.5 + ny * bend];
  p.moveTo(a[0], a[1]);
  p.quadraticCurveTo(m[0] + nx * w, m[1] + ny * w, b[0], b[1]);
  p.quadraticCurveTo(m[0] - nx * w, m[1] - ny * w, a[0], a[1]);
  p.closePath();
}

/** Smooth closed curve through points (Catmull-Rom -> Bezier). */
export function smoothClosed(p, pts, tension = 1) {
  const n = pts.length;
  p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const k = tension / 6;
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k,
      p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
  p.closePath();
}

/** Smooth open curve through points. */
export function smoothOpen(p, pts, tension = 1, move = true) {
  const n = pts.length;
  if (move) p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const k = tension / 6;
    p.bezierCurveTo(p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k,
      p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k, p2[0], p2[1]);
  }
}

/** Cloud/puff outline around a centre (beards, moustaches, buns). */
export function puffs(p, pts, r) {
  for (const [x, y, rr] of pts) {
    p.moveTo(x + (rr || r), y);
    p.arc(x, y, rr || r, 0, Math.PI * 2);
  }
}

export function ellipse(p, x, y, rx, ry, rot = 0) {
  p.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot));
  p.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2);
  p.closePath();
}

/** Mirror a list of points around x = cx. */
export const mx = (cx, pts) => pts.map(([x, y, r]) => (r === undefined ? [2 * cx - x, y] : [2 * cx - x, y, r]));

/** Build a Path2D from a builder callback. */
export function P(fn) {
  const p = new Path2D();
  fn(p);
  return p;
}

// ---------------------------------------------------------------- inked groups

let sil = null; // silhouette pass colour (sticker outline), or null for normal painting
/** Enable/disable the silhouette pass used for the sticker outline. */
export function setSilhouette(color) { sil = color; }
export const STICKER_PAD = 3;

/**
 * Draw a group of shapes as one inked cel mass: outlines of every member first,
 * then all fills (covering the inner edges, so only the union's silhouette keeps a
 * line), then shading clipped to the union, then optional inner detail lines.
 * Everything stays on one canvas (no layer copies, which force GPU syncs).
 *
 * opts: { fill, line, lw (visible outline width, logical px), shade(ctx), inner(ctx) }
 */
export function inked(ctx, paths, opts) {
  const { fill, line = '#2b1a17', lw = 2.6, shade: shadeFn, inner } = opts;
  if (sil) {
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = sil;
    ctx.fillStyle = sil;
    ctx.lineWidth = (lw + STICKER_PAD) * 2;
    for (const p of paths) { ctx.stroke(p); ctx.fill(p); }
    ctx.restore();
    return;
  }
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  if (lw > 0) {
    ctx.strokeStyle = line;
    ctx.lineWidth = lw * 2;
    for (const p of paths) ctx.stroke(p);
  }
  ctx.fillStyle = fill;
  for (const p of paths) ctx.fill(p);
  if (shadeFn) {
    if (paths.length === 1) {
      ctx.save(); ctx.clip(paths[0]); shadeFn(ctx); ctx.restore();
    } else {
      // one union clip (nonzero); member shapes are built with consistent winding
      const u = new Path2D();
      for (const p of paths) u.addPath(p);
      ctx.save(); ctx.clip(u); shadeFn(ctx); ctx.restore();
    }
  }
  if (inner) inner(ctx);
  ctx.restore();
}

/** Fill helper. */
export function fillP(ctx, p, style) { ctx.fillStyle = style; ctx.fill(p); }
export function strokeP(ctx, p, style, lw) { ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(p); }
