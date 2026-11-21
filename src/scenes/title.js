// Title screen: season backdrop (art), drifting clouds, birds and seasonal particles, the logo, "Press Start" (the first gesture
// unlocks audio), then New Game / Continue / Options. Continue loads the newest save (auto-save included).
import { Scene } from '../engine/index.js';
import { drawText, drawWindow, drawCursor, THEME } from '../ui/index.js';
import * as saveModule from '../sim/save.js';
import { createNewGame } from '../sim/state.js';
import { openScene } from './registry.js';
import { startSession } from './session.js';
import { applySettings } from './menus/index.js';
import { OverworldScene } from './overworld.js';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const MENU = ['New Game', 'Continue', 'Options'];

/** Newest readable save slot: { slot, summary, savedAt } or null. */
export function newestSave() {
  let best = null;
  try {
    for (const e of saveModule.list()) {
      if (e.empty || e.corrupt) continue;
      if (!best || (e.savedAt || 0) > (best.savedAt || 0)) best = e;
    }
  } catch { /* storage unavailable */ }
  return best;
}

function cloud(ctx, x, y, s, a) {
  ctx.globalAlpha = a;
  ctx.fillStyle = '#ffffff';
  const r = (dx, dy, w, h) => ctx.fillRect(Math.round(x + dx * s), Math.round(y + dy * s), Math.round(w * s), Math.round(h * s));
  r(4, 4, 24, 5); r(0, 7, 34, 5); r(8, 1, 12, 5); r(18, 3, 10, 4);
  ctx.fillStyle = '#dbe8f6';
  r(2, 11, 30, 2);
  ctx.globalAlpha = 1;
}

export class TitleScene extends Scene {
  constructor(game) {
    super(game);
    this.t = 0;
    this.phase = 'press';
    this.cursor = 0;
    this.save = null;
    this.season = 'spring';
    this.busy = false;
    this.msg = null;
    this.msgT = 0;
    this.clouds = Array.from({ length: 5 }, (_, i) => ({ x: i * 72 - 20, y: 14 + (i * 23) % 56, s: 0.9 + (i % 3) * 0.35, v: 3 + (i % 4) * 1.6 }));
    this.birds = Array.from({ length: 3 }, (_, i) => ({ x: -30 - i * 60, y: 40 + i * 14, v: 16 + i * 4, ph: i }));
    this.parts = [];
  }

  enter() {
    const g = this.game;
    g.overworld = null;
    g.world.clearActors();
    g.world.clearLights();
    g.world.weather.clear(0);
    g.renderer.fade.set(0);
    g.renderer.setGrading('day');
    this.save = newestSave();
    this.season = this.save && this.save.summary && SEASONS.includes(this.save.summary.season) ? this.save.summary.season : SEASONS[Math.floor(Date.now() / 86400000) % 4];
    const n = this.season === 'summer' ? 26 : 44;
    this.parts = Array.from({ length: n }, (_, i) => ({ x: (i * 53) % 320, y: (i * 37) % 240, vx: 0, vy: 0, ph: i * 1.7, k: i % 3 }));
    this.cursor = this.save ? 1 : 0;
    this.phase = g.titleGesture ? 'menu' : 'press';
    try { g.audio && g.audio.music('title', { fadeMs: 1200 }); } catch { /* optional */ }
  }

  exit() {}

  say(text) { this.msg = text; this.msgT = 3; }

  update(dt, input) {
    this.t += dt;
    if (this.msgT > 0) this.msgT -= dt;
    for (const c of this.clouds) { c.x += c.v * dt; if (c.x > 330) c.x = -60; }
    for (const b of this.birds) { b.x += b.v * dt; b.y += Math.sin(this.t * 1.3 + b.ph) * 4 * dt; if (b.x > 350) b.x = -40 - b.ph * 50; }
    for (const p of this.parts) {
      const s = this.season;
      if (s === 'summer') { p.x += Math.sin(this.t * 0.7 + p.ph) * 6 * dt; p.y += Math.cos(this.t * 0.5 + p.ph) * 4 * dt; if (p.y < 120) p.y = 200; if (p.y > 236) p.y = 130; }
      else {
        const fall = s === 'winter' ? 14 : s === 'autumn' ? 20 : 15;
        p.y += (fall + p.k * 4) * dt;
        p.x += (Math.sin(this.t * 1.1 + p.ph) * 14 + (s === 'winter' ? 3 : 9)) * dt;
        if (p.y > 244) { p.y = -4; p.x = (p.x * 7 + 31) % 320; }
        if (p.x > 324) p.x = -4;
      }
    }
    if (this.busy) return;
    const g = this.game;
    if (this.phase === 'press') {
      if (input.pressed('confirm') || input.pressed('menu') || g.titleGesture) { g.titleGesture = false; this.phase = 'menu'; g.audio && g.audio.sfx('confirm'); }
      return;
    }
    if (input.repeat('up')) { this.cursor = (this.cursor + MENU.length - 1) % MENU.length; g.audio && g.audio.sfx('cursor'); }
    if (input.repeat('down')) { this.cursor = (this.cursor + 1) % MENU.length; g.audio && g.audio.sfx('cursor'); }
    if (input.pressed('confirm')) this.choose(this.cursor);
  }

  async choose(i) {
    const g = this.game;
    if (i === 1 && !this.save) { g.audio && g.audio.sfx('error'); this.say('No saved game yet.'); return; }
    g.audio && g.audio.sfx('confirm');
    this.busy = true;
    try {
      if (i === 0) {
        await startSession(g, createNewGame());
        g.scenes.replace(new OverworldScene(g, { fresh: true }), { fresh: true });
        return;
      }
      if (i === 1) {
        const r = saveModule.read(this.save.slot);
        if (!r.ok) { this.say('That save could not be read.'); this.save = newestSave(); return; }
        await startSession(g, r.state);
        g.scenes.replace(new OverworldScene(g, { loaded: true }), { loaded: true });
        return;
      }
      await openScene(g, 'settings', {});
      applySettings(g);
    } catch (e) {
      console.error('[title] failed', e);
      this.say('Something went wrong.');
    } finally { this.busy = false; }
  }

  draw(ui) {
    const ctx = ui.ctx;
    const bd = this.game.art.getTitleBackdrop(this.season);
    if (bd && bd.canvas) ctx.drawImage(bd.canvas, 0, 0);
    else { ctx.fillStyle = '#8fd0f0'; ctx.fillRect(0, 0, 320, 240); }
    for (const c of this.clouds) cloud(ctx, c.x, c.y, c.s, 0.85);
    // birds
    ctx.fillStyle = '#2b2a4a';
    for (const b of this.birds) {
      const f = Math.floor(this.t * 6 + b.ph) % 2;
      const x = Math.round(b.x), y = Math.round(b.y);
      ctx.fillRect(x, y + (f ? 0 : 1), 2, 1); ctx.fillRect(x + 2, y + (f ? 1 : 0), 1, 1); ctx.fillRect(x + 3, y + (f ? 0 : 1), 2, 1);
    }
    // seasonal particles
    for (const p of this.parts) {
      const x = Math.round(p.x), y = Math.round(p.y);
      if (this.season === 'spring') { ctx.fillStyle = p.k ? '#f8c8d8' : '#f4a6c8'; ctx.fillRect(x, y, 2, 1); ctx.fillRect(x + 1, y + 1, 1, 1); }
      else if (this.season === 'autumn') { ctx.fillStyle = ['#e0702a', '#c8501e', '#e8a02e'][p.k]; ctx.fillRect(x, y, 2, 2); }
      else if (this.season === 'winter') { ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, p.k ? 2 : 1, p.k ? 2 : 1); }
      else { const tw = 0.5 + 0.5 * Math.sin(this.t * 3 + p.ph); ctx.globalAlpha = tw; ctx.fillStyle = '#fff3a0'; ctx.fillRect(x, y, 2, 2); ctx.globalAlpha = 0.35 * tw; ctx.fillRect(x - 1, y - 1, 4, 4); ctx.globalAlpha = 1; }
    }
    // logo
    const bob = Math.round(Math.sin(this.t * 1.4) * 1.5);
    this.game.art.drawLogo(ctx, 72, 20 + bob);
    if (this.phase === 'press') {
      if (Math.floor(this.t * 1.6) % 2 === 0) drawText(ctx, 'Press Start', 160, 168, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center', scale: 2 });
    } else {
      drawWindow(ctx, 104, 138, 112, 58, 'menu');
      MENU.forEach((label, i) => {
        const y = 147 + i * 16;
        const dis = i === 1 && !this.save;
        const sel = this.cursor === i;
        if (sel) { ctx.fillStyle = 'rgba(242,184,75,0.25)'; ctx.fillRect(110, y - 3, 100, 13); drawCursor(ctx, 113, y - 1, this.t); }
        drawText(ctx, label, 160, y, { color: dis ? '#6b7090' : sel ? THEME.gold : '#ffffff', shadow: THEME.navyDeep, align: 'center' });
      });
      if (this.save && this.save.summary) {
        const s = this.save.summary;
        drawText(ctx, `${s.timeLabel ? '' : ''}${String(s.season || '').replace(/^./, (c) => c.toUpperCase())} ${s.day}, Year ${s.year}  ${s.location || ''}`, 160, 202, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
      }
    }
    if (this.msgT > 0) drawText(ctx, this.msg, 160, 218, { color: '#ffb0a0', shadow: THEME.navyDeep, align: 'center' });
  }
}
