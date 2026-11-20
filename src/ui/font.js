// Original proportional pixel font for Bellhaven Days: 5-wide glyphs, 7-row caps/digits (baseline = row 6),
// lowercase with 2-row descenders (cell height 9). Pure data + metrics (importable in Node, no DOM);
// drawing uses cached per-colour glyph atlases (canvas) when a document exists.
//
// Inline markup in strings: {y} gold, {r} red, {g} green, {b} blue, {p} pink, {k} grey, {w} white, {c} cyan,
// {#rrggbb} any colour, {/} back to the base colour. `\n` breaks lines.

export const LINE_H = 10; // line advance used by wrapped text
export const CELL_H = 9;
export const SPACE_W = 3;

// '/' separates rows (row 0 first), '.' off, '#' on. Rows beyond the string are blank. Each glyph is trimmed to its used columns.
// Caps/digits occupy rows 0-6; lowercase x-height rows 2-6 with ascenders from row 0 and descenders on rows 7-8.
const RAW = {
  A: '.###./#...#/#...#/#####/#...#/#...#/#...#', B: '####./#...#/#...#/####./#...#/#...#/####.',
  C: '.###./#...#/#..../#..../#..../#...#/.###.', D: '####./#...#/#...#/#...#/#...#/#...#/####.',
  E: '#####/#..../#..../####./#..../#..../#####', F: '#####/#..../#..../####./#..../#..../#....',
  G: '.###./#...#/#..../#.###/#...#/#...#/.###.', H: '#...#/#...#/#...#/#####/#...#/#...#/#...#',
  I: '###/.#./.#./.#./.#./.#./###', J: '..###/...#./...#./...#./...#./#..#./.##..',
  K: '#...#/#..#./#.#../##.../#.#../#..#./#...#', L: '#..../#..../#..../#..../#..../#..../#####',
  M: '#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#', N: '#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',
  O: '.###./#...#/#...#/#...#/#...#/#...#/.###.', P: '####./#...#/#...#/####./#..../#..../#....',
  Q: '.###./#...#/#...#/#...#/#.#.#/#..#./.##.#', R: '####./#...#/#...#/####./#.#../#..#./#...#',
  S: '.####/#..../#..../.###./....#/....#/####.', T: '#####/..#../..#../..#../..#../..#../..#..',
  U: '#...#/#...#/#...#/#...#/#...#/#...#/.###.', V: '#...#/#...#/#...#/#...#/#...#/.#.#./..#..',
  W: '#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#', X: '#...#/#...#/.#.#./..#../.#.#./#...#/#...#',
  Y: '#...#/#...#/.#.#./..#../..#../..#../..#..', Z: '#####/....#/...#./..#../.#.../#..../#####',
  a: '//.###./....#/.####/#...#/.####', b: '#..../#..../#.##./##..#/#...#/##..#/#.##.',
  c: '//.###./#...#/#..../#...#/.###.', d: '....#/....#/.##.#/#..##/#...#/#..##/.##.#',
  e: '//.###./#...#/#####/#..../.###.', f: '..##./.#..#/.#.../###../.#.../.#.../.#...',
  g: '//.####/#...#/#...#/#...#/.####/....#/.###.', h: '#..../#..../#.##./##..#/#...#/#...#/#...#',
  i: '.#./.../##./.#./.#./.#./###', j: '..#/.../..#/..#/..#/..#/..#/..#/##.',
  k: '#..../#..../#..#./#.#../##.../#.#../#..#.', l: '##./.#./.#./.#./.#./.#./.##',
  m: '//##.#./#.#.#/#.#.#/#...#/#...#', n: '//#.##./##..#/#...#/#...#/#...#',
  o: '//.###./#...#/#...#/#...#/.###.', p: '//####./#...#/#...#/#...#/####./#..../#....',
  q: '//.####/#...#/#...#/#...#/.####/....#/....#', r: '//#.##./##..#/#..../#..../#....',
  s: '//.####/#..../.###./....#/####.', t: '.#.../.#.../###../.#.../.#.../.#..#/..##.',
  u: '//#...#/#...#/#...#/#..##/.##.#', v: '//#...#/#...#/#...#/.#.#./..#..',
  w: '//#...#/#...#/#.#.#/#.#.#/.#.#.', x: '//#...#/.#.#./..#../.#.#./#...#',
  y: '//#...#/#...#/#...#/#...#/.####/....#/.###.', z: '//#####/...#./..#../.#.../#####',
  0: '.###./#...#/#..##/#.#.#/##..#/#...#/.###.', 1: '..#../.##../..#../..#../..#../..#../.###.',
  2: '.###./#...#/....#/...#./..#../.#.../#####', 3: '.###./#...#/....#/..##./....#/#...#/.###.',
  4: '...#./..##./.#.#./#..#./#####/...#./...#.', 5: '#####/#..../####./....#/....#/#...#/.###.',
  6: '..##./.#.../#..../####./#...#/#...#/.###.', 7: '#####/....#/...#./..#../.#.../.#.../.#...',
  8: '.###./#...#/#...#/.###./#...#/#...#/.###.', 9: '.###./#...#/#...#/.####/....#/...#./.##..',
  '!': '#/#/#/#/#/./#', '"': '#.#/#.#', "'": '#/#', '`': '#./.#',
  '#': '.#.#./#####/.#.#./.#.#./#####/.#.#.', $: '..#../.####/#.#../.###./..#.#/####./..#..',
  '%': '#...#/#..#./...#./..#../.#.../.#..#/#...#', '&': '.##../#..#./#.#../.#.../#.#.#/#..#./.##.#',
  '(': '..#/.#./#../#../#../.#./..#', ')': '#../.#./..#/..#/..#/.#./#..',
  '*': '//..#../#.#.#/.###./#.#.#/..#..', '+': '//..#../..#../#####/..#../..#..',
  ',': '//////.#/#.', '-': '///####', '.': '//////#', '/': '....#/....#/...#./..#../.#.../#..../#....',
  ':': '//#///#', ';': '//#////.#/#.', '<': '...#./..#../.#.../#..../.#.../..#../...#.', '=': '//#####//#####',
  '>': '.#.../..#../...#./....#/...#./..#../.#...', '?': '.###./#...#/....#/...#./..#../...../..#..',
  '@': '.###./#...#/#.###/#.#.#/#.###/#..../.###.', '[': '###/#../#../#../#../#../###',
  '\\': '#..../#..../.#.../..#../...#./....#/....#', ']': '###/..#/..#/..#/..#/..#/###',
  '^': '..#../.#.#./#...#', _: '//////#####', '{': '.##/.#./.#./#../.#./.#./.##', '|': '#/#/#/#/#/#/#',
  '}': '##./.#./.#./..#/.#./.#./##.', '~': '//.#.../#.#.#/...#.',
  // symbols
  '♥': '/.#.#./#####/#####/#####/.###./..#..', // heart
  '▼': '//#####/.###./..#..', // prompt triangle
  '►': '/#../##./###/##./#..', '◄': '/..#/.##/###/.##/..#', '▲': '//..#../.###./#####',
  '★': '/..#../..#../#####/.###./.#.#./#...#', '♪': '..##./..#.#/..#../..#../###../###..',
  '✓': '///....#/...#./#.#../.#...', '×': '//#...#/.#.#./..#../.#.#./#...#', '•': '///.##./.##.',
};

const GLYPHS = new Map(); // char -> { w, rows: [[x,y],...] pixel list relative to trimmed left, idx }
const ORDER = [];
function build() {
  for (const [ch, str] of Object.entries(RAW)) {
    const rows = str.split('/');
    let minX = 99, maxX = -1;
    rows.forEach((r) => { for (let x = 0; x < r.length; x++) if (r[x] === '#') { minX = Math.min(minX, x); maxX = Math.max(maxX, x); } });
    if (maxX < 0) { GLYPHS.set(ch, { w: SPACE_W, px: [], idx: ORDER.length }); ORDER.push(ch); continue; }
    const px = [];
    rows.forEach((r, y) => { for (let x = minX; x <= maxX; x++) if (r[x] === '#') px.push([x - minX, y]); });
    GLYPHS.set(ch, { w: maxX - minX + 1, px, idx: ORDER.length });
    ORDER.push(ch);
  }
  GLYPHS.set(' ', { w: SPACE_W, px: [], idx: ORDER.length });
  ORDER.push(' ');
}
build();

export const hasGlyph = (ch) => GLYPHS.has(ch);
const glyphOf = (ch) => GLYPHS.get(ch) || GLYPHS.get('?');
export const charAdvance = (ch) => glyphOf(ch).w + 1;

// ---- colour markup ---------------------------------------------------------
export const COLOR_CODES = { y: '#f2b84b', r: '#e8645a', g: '#7fd36a', b: '#7fb4ff', p: '#f4a6c8', k: '#9a9fb5', w: '#ffffff', c: '#7fe0e0' };

/** Split a string into tokens: {t:'text', s} | {t:'color', c|null} | {t:'nl'}. */
export function tokenize(text) {
  const out = [];
  const re = /\{(#[0-9a-fA-F]{6}|[ygrbpkwc]|\/)\}|\n/g;
  let last = 0, m;
  const str = String(text);
  while ((m = re.exec(str))) {
    if (m.index > last) out.push({ t: 'text', s: str.slice(last, m.index) });
    if (m[0] === '\n') out.push({ t: 'nl' });
    else out.push({ t: 'color', c: m[1] === '/' ? null : (COLOR_CODES[m[1]] || m[1]) });
    last = m.index + m[0].length;
  }
  if (last < str.length) out.push({ t: 'text', s: str.slice(last) });
  return out;
}

export function stripMarkup(text) {
  return tokenize(text).map((t) => (t.t === 'text' ? t.s : t.t === 'nl' ? '\n' : '')).join('');
}

/** Pixel width of the widest line of `text` (markup ignored). */
export function measureText(text) {
  let best = 0, cur = 0;
  for (const tk of tokenize(text)) {
    if (tk.t === 'nl') { best = Math.max(best, cur); cur = 0; } else if (tk.t === 'text') for (const ch of tk.s) cur += charAdvance(ch);
  }
  return Math.max(best, cur) - (best || cur ? 1 : 0);
}

/**
 * Greedy word wrap to `maxWidth` pixels. Returns lines as strings (colour state is carried across breaks, so every
 * returned line can be drawn on its own). Words wider than the box are split by character.
 */
export function wrapText(text, maxWidth) {
  const lines = [];
  let line = '', width = 0, color = null, word = '', wordW = 0;
  const tag = (c) => (c ? `{${c}}` : '{/}');
  const flushLine = () => { lines.push(line.replace(/\s+$/, '')); line = color ? tag(color) : ''; width = 0; };
  const pushWord = () => {
    if (!word) return;
    if (width + wordW > maxWidth && width > 0) flushLine();
    if (wordW > maxWidth) { // split an over-long word
      let piece = '', pw = 0;
      for (const ch of word) {
        const cw = charAdvance(ch);
        if (pw + cw > maxWidth && piece) { line += piece; flushLine(); piece = ''; pw = 0; }
        piece += ch; pw += cw;
      }
      line += piece; width += pw;
    } else { line += word; width += wordW; }
    word = ''; wordW = 0;
  };
  for (const tk of tokenize(text)) {
    if (tk.t === 'nl') { pushWord(); flushLine(); continue; }
    if (tk.t === 'color') { word += tag(tk.c); color = tk.c; continue; }
    for (const ch of tk.s) {
      if (ch === ' ') {
        pushWord();
        const sw = charAdvance(' ');
        if (width + sw <= maxWidth && width > 0) { line += ' '; width += sw; }
      } else { word += ch; wordW += charAdvance(ch); }
    }
  }
  pushWord();
  if (line.replace(/\{[^}]*\}/g, '').trim() || !lines.length) lines.push(line.replace(/\s+$/, ''));
  return lines;
}

// ---- drawing (browser) -------------------------------------------------------
const atlasCache = new Map();
const COLS = 20;
function atlasFor(color) {
  let a = atlasCache.get(color);
  if (a) return a;
  const rows = Math.ceil(ORDER.length / COLS);
  const canvas = document.createElement('canvas');
  canvas.width = COLS * 6; canvas.height = rows * CELL_H;
  const g = canvas.getContext('2d');
  g.fillStyle = color;
  for (const [ch, gl] of GLYPHS) {
    const cx = (gl.idx % COLS) * 6, cy = Math.floor(gl.idx / COLS) * CELL_H;
    void ch;
    for (const [x, y] of gl.px) g.fillRect(cx + x, cy + y, 1, 1);
  }
  a = canvas;
  atlasCache.set(color, a);
  return a;
}

/**
 * Draw `text` with its top-left at (x, y). opts: { color='#ffffff', shadow='#1d2340'|null, align='left'|'center'|'right',
 * scale=1, alpha=1, outline=null, maxChars (typewriter: draw only the first N visible characters) }.
 * Returns the pixel width drawn.
 */
export function drawText(ctx, text, x, y, opts = {}) {
  const base = opts.color || '#ffffff';
  const shadow = opts.shadow === undefined ? '#1d2340' : opts.shadow;
  const scale = opts.scale || 1;
  const toks = tokenize(text);
  let remaining = opts.maxChars === undefined ? Infinity : opts.maxChars;
  // alignment is per call (first line): measure the full text
  const total = measureText(text) * scale;
  let ox = x;
  if (opts.align === 'center') ox = Math.round(x - total / 2);
  else if (opts.align === 'right') ox = Math.round(x - total);
  const prevAlpha = ctx.globalAlpha;
  if (opts.alpha !== undefined) ctx.globalAlpha = prevAlpha * opts.alpha;
  let cx = ox, cy = y, color = base;
  const blit = (ch, c, px, py) => {
    const gl = glyphOf(ch);
    if (!gl.px.length) return;
    const at = atlasFor(c);
    const sx = (gl.idx % COLS) * 6, sy = Math.floor(gl.idx / COLS) * CELL_H;
    ctx.drawImage(at, sx, sy, gl.w, CELL_H, px, py, gl.w * scale, CELL_H * scale);
  };
  const lineH = LINE_H * scale;
  outer:
  for (const tk of toks) {
    if (tk.t === 'nl') { cx = ox; cy += lineH; continue; }
    if (tk.t === 'color') { color = tk.c || base; continue; }
    for (const ch of tk.s) {
      if (remaining <= 0) break outer;
      remaining--;
      if (opts.outline) { for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) blit(ch, opts.outline, cx + dx * scale, cy + dy * scale); }
      if (shadow) blit(ch, shadow, cx + scale, cy + scale);
      blit(ch, color, cx, cy);
      cx += charAdvance(ch) * scale;
    }
  }
  ctx.globalAlpha = prevAlpha;
  return total;
}

/** Draw pre-wrapped lines, one per LINE_H. */
export function drawLines(ctx, lines, x, y, opts = {}) {
  lines.forEach((l, i) => drawText(ctx, l, x, y + i * LINE_H * (opts.scale || 1), opts));
}

/** Number of visible characters in a string once markup is removed. */
export const visibleLength = (text) => stripMarkup(text).length;
