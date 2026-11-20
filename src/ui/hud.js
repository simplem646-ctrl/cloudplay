// Always-on overlay widgets: HUD (location banner, date, clock, weather, money, energy), ToastStack, Banner, TextPage.
import { SEASON_SHORT, CURRENCY } from '../core/constants.js';
import { formatTime12 } from '../core/util.js';
import { Widget, THEME, drawWindow, drawBar, drawIconSafe } from './ui.js';
import { drawText, measureText, wrapText, LINE_H } from './font.js';

const WEATHER_ICON = { sunny: 'sun', cloudy: 'cloud', rain: 'rain', storm: 'storm', snow: 'snow' };
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/**
 * HUD. data: { season, day, weekday, minute, weather, money, energy, maxEnergy, festival?, year? }.
 * showLocation(name) pops the location banner (top-left); `visible=false` hides everything (during dialogue/cutscenes).
 */
export class HUD extends Widget {
  constructor({ services } = {}) {
    super({ services });
    this.visible = true;
    this.data = { season: 'spring', day: 1, weekday: 'Mon', minute: 390, weather: 'sunny', money: 0, energy: 100, maxEnergy: 100 };
    this.loc = null;
    this.locT = 0;
  }
  setData(d) { Object.assign(this.data, d); }
  showLocation(name) { this.loc = name; this.locT = 0; }
  update(dt) {
    this.tick(dt);
    if (this.loc) { this.locT += dt; if (this.locT > 3.1) this.loc = null; }
  }
  draw(ctx) {
    if (!this.visible) return;
    const d = this.data, ui = { services: this.services };
    // date + clock panel (top-right)
    drawWindow(ctx, 196, 4, 120, 32, 'hud');
    drawIconSafe(ui, ctx, `season_${d.season}`, 201, 12);
    drawText(ctx, `${SEASON_SHORT[d.season] || d.season} ${d.day}  ${d.weekday}`, 222, 9, { color: THEME.ink, shadow: null });
    drawText(ctx, formatTime12(d.minute), 222, 21, { color: '#8a3a1a', shadow: null });
    drawIconSafe(ui, ctx, WEATHER_ICON[d.weather] || 'sun', 295, 12);
    // money (below)
    drawWindow(ctx, 232, 40, 84, 15, 'hud');
    drawIconSafe(ui, ctx, 'coin', 235, 39);
    drawText(ctx, `${CURRENCY}${d.money}`, 312, 44, { color: THEME.ink, shadow: null, align: 'right' });
    if (d.festival) {
      const w = measureText(d.festival) + 22;
      drawWindow(ctx, 316 - w, 59, w, 14, 'hud');
      drawText(ctx, `★ ${d.festival}`, 316 - w + 8, 62, { color: '#a0521a', shadow: null });
    }
    // energy (bottom-left)
    const f = d.maxEnergy ? d.energy / d.maxEnergy : 0;
    drawWindow(ctx, 4, 224, 92, 13, 'hud');
    drawIconSafe(ui, ctx, 'energy', 4, 222 - 2);
    drawBar(ctx, 22, 228, 68, 5, d.energy, d.maxEnergy, { fill: f > 0.5 ? THEME.green : f > 0.25 ? THEME.gold : THEME.red, back: '#7a6a50', border: THEME.ink, segments: 10 });
    // location banner (top-left)
    if (this.loc) {
      const a = this.locT < 0.3 ? this.locT / 0.3 : this.locT > 2.6 ? 1 - (this.locT - 2.6) / 0.5 : 1;
      const w = measureText(this.loc) + 20;
      const prev = ctx.globalAlpha;
      ctx.globalAlpha = prev * clamp01(a);
      drawWindow(ctx, 4, 4, w, 16, 'dialogue');
      drawText(ctx, this.loc, 14, 8, { color: THEME.cream, shadow: THEME.navyDeep });
      ctx.globalAlpha = prev;
    }
  }
}

/** Stack of small notifications. push({ text, icon?, ttl? }). Non-blocking (never `done`). */
export class ToastStack extends Widget {
  constructor({ services, x = 4, y = 24, max = 4 } = {}) {
    super({ services });
    Object.assign(this, { x, y, max });
    this.items = [];
  }
  push({ text, icon = null, ttl = 2.6, color = null }) {
    this.items.push({ text, icon, ttl, age: 0, color });
    if (this.items.length > this.max + 2) this.items.shift();
  }
  update(dt) {
    this.tick(dt);
    for (const it of this.items) it.age += dt;
    this.items = this.items.filter((it) => it.age < it.ttl);
  }
  draw(ctx) {
    const ui = { services: this.services };
    this.items.slice(-this.max).forEach((it, i) => {
      const slide = clamp01(it.age / 0.25), fade = clamp01((it.ttl - it.age) / 0.4);
      const w = measureText(it.text) + (it.icon ? 36 : 20);
      const ex = this.x - Math.round((1 - slide) * (w + 8));
      const prev = ctx.globalAlpha;
      ctx.globalAlpha = prev * fade;
      drawWindow(ctx, ex, this.y + i * 19, w, 17, 'menu');
      let tx = ex + 9;
      if (it.icon) { drawIconSafe(ui, ctx, it.icon, ex + 5, this.y + i * 19 + 1); tx += 17; }
      drawText(ctx, it.text, tx, this.y + i * 19 + 4, { color: it.color || '#ffffff', shadow: THEME.navyDeep });
      ctx.globalAlpha = prev;
    });
  }
}

/** Full-screen title card: dim band, big text, sub-text, fade envelope. result: true when finished (confirm skips). */
export class Banner extends Widget {
  constructor({ services, text = '', sub = '', ms = 2600, fullDim = false } = {}) {
    super({ services });
    Object.assign(this, { text, sub, dur: ms / 1000, fullDim });
  }
  update(dt, input) {
    this.tick(dt);
    if (this.t >= this.dur || (input && input.pressed('confirm') && this.t > 0.5)) this.finish(true);
  }
  draw(ctx) {
    const fin = clamp01(this.t / 0.45), fout = clamp01((this.dur - this.t) / 0.45);
    const a = Math.min(fin, fout);
    const prev = ctx.globalAlpha;
    ctx.globalAlpha = prev * a;
    if (this.fullDim) { ctx.fillStyle = 'rgba(8,10,24,0.85)'; ctx.fillRect(0, 0, 320, 240); }
    ctx.fillStyle = 'rgba(12,14,34,0.88)'; ctx.fillRect(0, 84, 320, this.sub ? 72 : 52);
    ctx.fillStyle = THEME.gold; ctx.fillRect(0, 84, 320, 1); ctx.fillRect(0, (this.sub ? 156 : 136) - 1, 320, 1);
    const off = Math.round((1 - fin) * 12);
    drawText(ctx, this.text, 160 + off, 96, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center', scale: 2 });
    if (this.sub) drawText(ctx, this.sub, 160 - off, 126, { color: THEME.gold, shadow: THEME.navyDeep, align: 'center' });
    ctx.globalAlpha = prev;
  }
}

/**
 * Auto-scrolling text (credits, long notes). lines: [{ text, style?: 'title'|'head'|'text'|'blank', color? }].
 * Confirm speeds up; cancel finishes. result: true.
 */
export class TextPage extends Widget {
  constructor({ services, lines = [], speed = 22, x = 20, w = 280, top = 8, bottom = 232 } = {}) {
    super({ services });
    Object.assign(this, { x, w, speed, top, bottom });
    this.rows = [];
    let y = 0;
    for (const l of lines) {
      const st = l.style || 'text';
      if (st === 'blank') { y += 10; continue; }
      const scale = st === 'title' ? 2 : 1;
      const wrapped = st === 'title' ? [l.text] : wrapText(l.text, w - 4);
      for (const line of wrapped) {
        this.rows.push({ text: line, y, style: st, color: l.color, scale });
        y += st === 'title' ? 24 : st === 'head' ? 14 : LINE_H + 2;
      }
      y += st === 'head' ? 2 : st === 'title' ? 6 : 0;
    }
    this.contentH = y;
    this.scroll = -(bottom - top); // start with the text just below the screen
  }
  update(dt, input) {
    this.tick(dt);
    const fast = input && input.down && input.down('confirm');
    this.scroll += dt * this.speed * (fast ? 5 : 1);
    if (this.scroll > this.contentH + 8 || (input && input.pressed('cancel'))) this.finish(true);
  }
  draw(ctx) {
    ctx.save();
    ctx.beginPath(); ctx.rect(0, this.top, 320, this.bottom - this.top); ctx.clip();
    for (const r of this.rows) {
      const y = Math.round(this.top + r.y - this.scroll);
      if (y < this.top - 24 || y > this.bottom) continue;
      const color = r.color || (r.style === 'title' ? THEME.gold : r.style === 'head' ? THEME.gold : THEME.cream);
      drawText(ctx, r.text, this.x + this.w / 2, y, { color, shadow: THEME.navyDeep, align: 'center', scale: r.scale });
    }
    ctx.restore();
  }
}
