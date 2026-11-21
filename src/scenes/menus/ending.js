// ending: plays composeEnding(state) slides (params.slides overrides), typewriter text over an art backdrop
// (game.art.getEndingBackdrop(key) or a season-tinted gradient). Records the ending in the meta save, opens 'credits'.
import { drawText, drawWindow, THEME, wrapText, LINE_H } from '../../ui/index.js';
import { composeEnding } from '../../sim/endings.js';
import { openScene } from '../registry.js';
import { MenuScene, drawBands, drawHints, music, saveApi, SEASON_SKY } from './common.js';
import { selectEndingSlides, endingId, musicForSlide, tintSeason } from './data.js';

const ART_TONES = {
  school_dawn: ['#f6c8a0', '#f0a8a0'], school_dusk: ['#7a5a9a', '#d08a8a'], bell_night: ['#0e1330', '#26366a'],
  harbor_dusk: ['#5a6aa8', '#e8a47a'], classroom_sunset: ['#e8945a', '#f6d49a'], rooftop_sunset: ['#d8706a', '#f8c88a'],
};
const lerpHex = (a, b, t) => {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [x, y] = [p(a), p(b)];
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
};

export function drawBackdrop(game, ctx, slide, season) {
  const img = game.art && game.art.getEndingBackdrop ? (() => { try { return game.art.getEndingBackdrop(slide.art); } catch { return null; } })() : null;
  if (img) { ctx.imageSmoothingEnabled = false; ctx.drawImage(img.canvas || img, 0, 0, 320, 240); return; }
  const [top, bot] = ART_TONES[slide.art] || SEASON_SKY[season] || SEASON_SKY.spring;
  drawBands(ctx, Array.from({ length: 12 }, (_, i) => lerpHex(top, bot, i / 11)), 0, 170);
  const [s1] = SEASON_SKY[season] || SEASON_SKY.spring;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 170, 320, 70);
  ctx.fillStyle = '#10152e';
  for (let x = 0; x < 320; x += 2) ctx.fillRect(x, 150 + Math.round(Math.sin(x / 30) * 5 + Math.sin(x / 11) * 2), 2, 30);
  ctx.fillRect(0, 176, 320, 64);
  ctx.fillStyle = s1; ctx.globalAlpha = 0.12; ctx.fillRect(0, 0, 320, 240); ctx.globalAlpha = 1;
  // little bell tower silhouette
  ctx.fillStyle = '#0a0e22'; ctx.fillRect(150, 100, 20, 60); ctx.fillRect(146, 94, 28, 8); ctx.fillRect(154, 84, 12, 10);
}

export class EndingScene extends MenuScene {
  constructor(game, params = {}) {
    super(game, params);
    this.state = game.sim.state;
    this.slides = params.slides && params.slides.length ? params.slides : selectEndingSlides(this.state, composeEnding);
    this.i = -1; this.shown = 0; this.age = 0; this.fade = 0; this.finishing = false;
  }
  enter() { this.next(); }
  get slide() { return this.slides[this.i]; }
  get text() { const s = this.slide; return [s.title ? `{y}${s.title}` : '', ...(s.lines || [])].filter(Boolean).join('\n'); }
  next() {
    this.i++;
    if (this.i >= this.slides.length) { this.finish(); return; }
    this.shown = 0; this.age = 0; this.acc = 0; this.fade = 1;
    this.lines = wrapText(this.text, 276);
    this.total = this.lines.reduce((n, l) => n + l.replace(/\{[^}]*\}/g, '').length, 0);
    music(this.game, musicForSlide(this.slide, this.state), 1200);
  }
  async finish() {
    if (this.finishing) return;
    this.finishing = true; this.i = this.slides.length - 1;
    try { const api = saveApi(this.game); api.recordEnding(endingId(this.state)); api.meta({ plays: ((api.meta().plays) || 0) + 1 }); } catch { /* meta is best-effort */ }
    const r = await openScene(this.game, 'credits', { endingId: endingId(this.state) });
    if (this.game.scenes.top === this) this.game.scenes.pop({ ended: true, endingId: endingId(this.state), credits: r });
  }
  update(dt, input) {
    if (this.updateModal(dt, input)) return;
    if (this.finishing || this.i < 0 || this.i >= this.slides.length) return;
    this.age += dt; this.fade = Math.max(0, this.fade - dt * 1.6);
    if (this.shown < this.total && this.age > 0.5) { this.acc += dt * (input.down('fast') ? 90 : 34); this.shown = Math.min(this.total, Math.floor(this.acc)); }
    if (input.pressed('confirm')) {
      if (this.shown < this.total) { this.shown = this.total; this.acc = this.total; this.sfx('blip'); } else { this.sfx('page'); this.next(); }
    } else if (input.pressed('cancel') || input.pressed('skip')) {
      this.confirm('Skip the ending?', (y) => { if (y) this.finish(); });
    }
  }
  draw(ui) {
    const ctx = ui.ctx;
    if (this.finishing || !this.slide) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 320, 240); return; }
    drawBackdrop(this.game, ctx, this.slide, tintSeason(this.slide, this.state));
    const h = this.lines.length * LINE_H + 16, y = 232 - h;
    drawWindow(ctx, 14, y, 292, h, 'dialogue');
    let left = this.shown;
    this.lines.forEach((l, k) => {
      const vis = l.replace(/\{[^}]*\}/g, '').length;
      drawText(ctx, l, 26, y + 8 + k * LINE_H, { color: THEME.cream, shadow: THEME.navyDeep, maxChars: Math.max(0, left) });
      left -= vis;
    });
    if (this.shown >= this.total) drawText(ctx, '▼', 296, y + h - 12 + Math.round(Math.abs(Math.sin(this.t * 5)) * 2), { color: THEME.gold, shadow: THEME.navyDeep });
    drawText(ctx, `${this.i + 1}/${this.slides.length}`, 312, 6, { color: '#ffffff', shadow: THEME.navyDeep, align: 'right' });
    if (this.fade > 0) { ctx.fillStyle = `rgba(0,0,0,${this.fade})`; ctx.fillRect(0, 0, 320, 240); }
    this.drawModal(ctx);
  }
}
