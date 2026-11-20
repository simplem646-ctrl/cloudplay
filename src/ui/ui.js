// UI core: the UICanvas service (what the engine loop draws on top of the world), window frames, bars, hearts,
// cursor and small helpers. Pure canvas-2D at 320x240, integer coordinates only. No engine/art imports: art and
// audio arrive through `ui.services` callbacks (see UICanvas).
import { VIEW_W, VIEW_H } from '../core/constants.js';
import { drawText } from './font.js';

export const THEME = {
  navy: '#1d2340', navyLight: '#2b3560', navyDeep: '#141a33', cream: '#f6ecd2', parchment: '#e8d5a8', parchmentDark: '#cdb27a',
  wood: '#7a4f2e', ink: '#3b2a1f', gold: '#f2b84b', goldDark: '#c98a22', white: '#ffffff', red: '#e8645a', green: '#7fd36a',
  blue: '#7fb4ff', pink: '#f4a6c8', grey: '#9a9fb5', shadow: 'rgba(8,10,24,0.45)',
};

/**
 * The `ui` service. The engine loop calls beginFrame() -> scenes draw into ctx -> endFrame() and uploads `canvas`
 * unless `dirty === false`. `services` carries injected helpers so widgets never import art/audio:
 *   drawIcon(ctx, name, x, y)  ·  getPortraitSheet(who) -> {canvas, ...PORTRAIT_SHEET} | null  ·  sfx(name)
 *   settings: { textSpeed: 'slow'|'normal'|'fast' }
 */
export class UICanvas {
  constructor({ width = VIEW_W, height = VIEW_H, canvas = null } = {}) {
    this.width = width;
    this.height = height;
    this.canvas = canvas || (typeof document !== 'undefined' ? document.createElement('canvas') : null);
    this.ctx = null;
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.ctx = this.canvas.getContext('2d');
      this.ctx.imageSmoothingEnabled = false;
    }
    this.dirty = true;
    this.services = { drawIcon: null, getPortraitSheet: null, sfx: null, settings: { textSpeed: 'normal', keyHints: true } };
  }
  beginFrame() {
    if (this.ctx) this.ctx.clearRect(0, 0, this.width, this.height);
    this.dirty = true;
  }
  endFrame() {}
  /** Wire in art/audio: ui.configure({ drawIcon, getPortraitSheet, sfx }) */
  configure(services) {
    Object.assign(this.services, services);
    return this;
  }
}

// ---- windows ---------------------------------------------------------------
const STYLES = {
  // fill, outer (cream) border, inner line, text colour
  dialogue: { fill: 'rgba(29,35,64,0.94)', border: THEME.cream, inner: '#3a4678', dark: THEME.navyDeep },
  menu: { fill: 'rgba(36,44,82,0.95)', border: THEME.cream, inner: '#4a5896', dark: THEME.navyDeep },
  parchment: { fill: THEME.parchment, border: THEME.wood, inner: THEME.cream, dark: THEME.ink },
  hud: { fill: 'rgba(246,236,210,0.94)', border: THEME.wood, inner: '#fff7de', dark: THEME.ink },
  tooltip: { fill: 'rgba(20,26,51,0.96)', border: THEME.parchmentDark, inner: '#2b3560', dark: '#0c1020' },
  dim: { fill: 'rgba(12,14,30,0.62)', border: null, inner: null, dark: null },
};

/**
 * Rounded pixel window. style: dialogue | menu | parchment | hud | tooltip | dim.
 * Draws a 1px dark outline, a 1px bright border with clipped corners, a thin inner line, and a drop shadow.
 */
export function drawWindow(ctx, x, y, w, h, style = 'menu') {
  const s = STYLES[style] || STYLES.menu;
  x |= 0; y |= 0; w |= 0; h |= 0;
  if (style === 'dim') { ctx.fillStyle = s.fill; ctx.fillRect(x, y, w, h); return; }
  // drop shadow
  ctx.fillStyle = THEME.shadow;
  ctx.fillRect(x + 1, y + h, w - 1, 2);
  ctx.fillRect(x + w, y + 1, 2, h - 1);
  // outline (clipped corners)
  ctx.fillStyle = s.dark;
  ctx.fillRect(x + 1, y, w - 2, h);
  ctx.fillRect(x, y + 1, w, h - 2);
  // border
  ctx.fillStyle = s.border;
  ctx.fillRect(x + 2, y + 1, w - 4, h - 2);
  ctx.fillRect(x + 1, y + 2, w - 2, h - 4);
  // fill (translucent fills must not show the border colour through)
  ctx.clearRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = s.fill;
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  // inner line
  ctx.fillStyle = s.inner;
  ctx.fillRect(x + 3, y + 3, w - 6, 1);
  ctx.fillRect(x + 3, y + 3, 1, h - 6);
  // sparkle corners
  ctx.fillStyle = s.border;
  ctx.fillRect(x + 3, y + 3, 1, 1);
  ctx.fillRect(x + w - 4, y + 3, 1, 1);
  ctx.fillRect(x + 3, y + h - 4, 1, 1);
  ctx.fillRect(x + w - 4, y + h - 4, 1, 1);
}

/** Text colour that reads on a given window style. */
export const textColorFor = (style) => (style === 'parchment' || style === 'hud' ? THEME.ink : THEME.white);
export const shadowFor = (style) => (style === 'parchment' || style === 'hud' ? 'rgba(255,247,222,0.0)' : THEME.navyDeep);

/** Small name tab (used above dialogue boxes and as list titles). Returns its width. */
export function drawTab(ctx, text, x, y, style = 'dialogue') {
  const w = Math.max(30, textWidth(text) + 14);
  drawWindow(ctx, x, y, w, 14, style);
  drawText(ctx, text, x + 7, y + 3, { color: textColorFor(style), shadow: shadowFor(style) });
  return w;
}
import { measureText } from './font.js';
export const textWidth = (t) => measureText(t);

// ---- bars, hearts, cursor ----------------------------------------------------
/** Filled meter. opts: { fill, back, border, segments } */
export function drawBar(ctx, x, y, w, h, value, max, opts = {}) {
  const f = Math.max(0, Math.min(1, max > 0 ? value / max : 0));
  ctx.fillStyle = opts.border || THEME.ink;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = opts.back || '#3a3f5e';
  ctx.fillRect(x + 1, y + 1, w - 2, h - 2);
  const fw = Math.round((w - 2) * f);
  ctx.fillStyle = opts.fill || THEME.green;
  ctx.fillRect(x + 1, y + 1, fw, h - 2);
  if (fw > 0 && h > 4) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 1, y + 1, fw, 1); }
  if (opts.segments) {
    ctx.fillStyle = opts.border || THEME.ink;
    for (let i = 1; i < opts.segments; i++) ctx.fillRect(x + Math.round((w * i) / opts.segments), y + 1, 1, h - 2);
  }
}

const HEART = ['.##.##.', '#######', '#######', '.#####.', '..###..', '...#...'];
/** 7x6 pixel heart. state: 'full' | 'half' | 'empty' */
export function drawHeart(ctx, x, y, state = 'full', color = '#ee4466') {
  for (let r = 0; r < HEART.length; r++) {
    for (let c = 0; c < 7; c++) {
      if (HEART[r][c] !== '#') continue;
      const lit = state === 'full' || (state === 'half' && c < 3.5);
      ctx.fillStyle = lit ? color : '#4a4560';
      ctx.fillRect(x + c, y + r, 1, 1);
    }
  }
  if (state !== 'empty') { ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(x + 1, y + 1, 1, 1); }
}

/** 0-10 hearts row; `points` (0-100) gives half hearts. Returns the width drawn. */
export function drawHeartsRow(ctx, x, y, { hearts = 0, points = null, max = 10, color = '#ee4466' } = {}) {
  const full = points === null ? hearts : Math.floor(points / 10);
  const half = points !== null && points % 10 >= 5;
  for (let i = 0; i < max; i++) drawHeart(ctx, x + i * 8, y, i < full ? 'full' : i === full && half ? 'half' : 'empty', color);
  return max * 8;
}

/** Bouncing selection arrow. */
export function drawCursor(ctx, x, y, t = 0, color = THEME.gold) {
  const o = Math.round(Math.sin(t * 8) * 1);
  ctx.fillStyle = THEME.navyDeep;
  ctx.fillRect(x + o, y, 1, 7);
  ctx.fillRect(x + o + 1, y + 1, 1, 5);
  ctx.fillRect(x + o + 2, y + 2, 1, 3);
  ctx.fillRect(x + o + 3, y + 3, 1, 1);
  ctx.fillStyle = color;
  ctx.fillRect(x + o, y + 1, 1, 5);
  ctx.fillRect(x + o + 1, y + 2, 1, 3);
  ctx.fillRect(x + o + 2, y + 3, 1, 1);
}

/** Bouncing down-arrow prompt used by the dialogue box. */
export function drawPrompt(ctx, x, y, t = 0, color = THEME.gold) {
  const o = Math.round(Math.abs(Math.sin(t * 5)) * 2);
  drawText(ctx, '▼', x, y + o, { color, shadow: THEME.navyDeep });
}

/** Safe icon draw: uses the injected drawer, otherwise a labelled placeholder box. */
export function drawIconSafe(ui, ctx, name, x, y) {
  const fn = ui && ui.services && ui.services.drawIcon;
  if (fn) { fn(ctx, name, x, y); return true; }
  ctx.fillStyle = '#8a8fb0'; ctx.fillRect(x + 1, y + 1, 14, 14);
  ctx.fillStyle = '#2b3560'; ctx.fillRect(x + 2, y + 2, 12, 12);
  ctx.fillStyle = '#cfd3ec'; ctx.fillRect(x + 6, y + 5, 4, 6);
  return false;
}

/** Play a UI sound through the injected sfx hook (never throws). */
export function playSfx(services, name) {
  try { if (services && services.sfx) services.sfx(name); } catch { /* audio is optional */ }
}

/** Base class for widgets: update(dt, input), draw(ctx), done, result. */
export class Widget {
  constructor({ services = null } = {}) {
    this.services = services || { settings: {} };
    this.done = false;
    this.result = undefined;
    this.t = 0;
  }
  finish(result) {
    this.done = true;
    this.result = result;
  }
  tick(dt) { this.t += dt; }
  sfx(name) { playSfx(this.services, name); }
  update(dt) { this.tick(dt); }
  draw() {}
}
