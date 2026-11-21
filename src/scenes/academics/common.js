// Shared base for the academic scenes: sfx, services, one active input widget, clock advance, result card.
import { Scene } from '../../engine/scenes.js';
import { drawText, drawWindow, drawPrompt, THEME, wrapText, LINE_H } from '../../ui/index.js';

export class AcademicScene extends Scene {
  constructor(game, params = {}) {
    super(game);
    this.params = params;
    this.t = 0;
    this.mt = 0;
    this.widget = null; // the one input-taking widget
    this.onDone = null;
    this.mode = 'init';
    this.finished = false;
  }
  get sim() { return this.game.sim; }
  get state() { return this.game.sim.state; }
  get services() { return (this.game.ui && this.game.ui.services) || { settings: {} }; }
  sfx(name) { try { this.game.audio && this.game.audio.sfx && this.game.audio.sfx(name); } catch { /* audio is optional */ } }
  setMode(m) { this.mode = m; this.mt = 0; }
  /** Show `widget`; when it finishes, `cb(result)` runs. */
  ask(widget, cb) { this.widget = widget; this.onDone = cb; }
  advanceClock(minutes) { if (minutes > 0 && this.sim && this.sim.clock) this.sim.clock.advance(minutes); }
  finish(result) {
    if (this.finished) return;
    this.finished = true;
    this.game.scenes.pop(result);
  }
  tickWidget(dt, input) {
    const w = this.widget;
    if (!w) return;
    w.update(dt, input);
    if (w.done) {
      const cb = this.onDone;
      const r = w.result;
      this.widget = null;
      this.onDone = null;
      if (cb) cb(r);
    }
  }
  update(dt, input) {
    this.t += dt;
    this.mt += dt;
    this.step(dt, input);
  }
  step() {}
}

/** Centered result card: title, lines [{text,color,gap}], footer prompt. Returns its height. */
export function drawCard(ctx, { x = 40, y = 50, w = 240, title, lines = [], footer = 'Press Z to continue', t = 0, style = 'menu' } = {}) {
  const wrapped = [];
  for (const l of lines) {
    if (l.gap) { wrapped.push({ gap: true }); continue; }
    for (const s of wrapText(l.text, w - 24)) wrapped.push({ text: s, color: l.color });
  }
  const h = 30 + wrapped.reduce((n, l) => n + (l.gap ? 5 : LINE_H + 1), 0) + (footer ? 18 : 6);
  drawWindow(ctx, x, y, w, h, style);
  const pk = style === 'parchment';
  if (title) drawText(ctx, title, x + w / 2, y + 8, { color: pk ? '#8a3a1a' : THEME.gold, shadow: pk ? null : THEME.navyDeep, align: 'center', scale: 2 });
  let cy = y + 28;
  for (const l of wrapped) {
    if (l.gap) { cy += 5; continue; }
    drawText(ctx, l.text, x + w / 2, cy, { color: l.color || (pk ? THEME.ink : '#ffffff'), shadow: pk ? null : THEME.navyDeep, align: 'center' });
    cy += LINE_H + 1;
  }
  if (footer) {
    drawText(ctx, footer, x + w / 2 - 6, y + h - 14, { color: pk ? THEME.wood : THEME.cream, shadow: pk ? null : THEME.navyDeep, align: 'center' });
    drawPrompt(ctx, x + w - 16, y + h - 12, t);
  }
  return h;
}
