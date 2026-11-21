// Shared plumbing for the menu scenes: base class with a modal slot (ConfirmBox/ChoiceBox) and a notice line,
// store access (works with or without game.sim), portraits, backdrops and key hints.
import { Scene } from '../../engine/scenes.js';
import { drawText, drawWindow, drawIconSafe, THEME, ConfirmBox, ChoiceBox } from '../../ui/index.js';
import { PORTRAIT_SHEET } from '../../data/sheet_layout.js';
import * as saveModule from '../../sim/save.js';
import { hasScene, createScene } from '../registry.js';
import { normalizeSettings, textSpeedValue } from './data.js';

export const SEASON_SKY = {
  spring: ['#f6d6e0', '#c8dff0'], summer: ['#9fd8f5', '#e8f4ff'], autumn: ['#f0b878', '#f7e3c0'], winter: ['#b8c8e8', '#e6eef8'],
};

/** Storage API: the sim's bound save group when a sim exists, otherwise the raw module (title screen). */
export function saveApi(game) {
  if (game.sim && game.sim.save) return game.sim.save;
  return {
    list: () => saveModule.list(), read: (s) => saveModule.read(s), write: () => ({ ok: false, error: 'no_game' }),
    delete: (s) => saveModule.delete(s), settings: (p) => saveModule.settings(p), meta: (p) => saveModule.meta(p),
    recordEnding: (id) => saveModule.recordEnding(id),
  };
}

/** Apply settings to the live services: audio volumes, dialogue text speed, key hints. Returns the normalised settings. */
export function applySettings(game, raw) {
  const s = normalizeSettings(raw || saveApi(game).settings());
  try { game.audio && game.audio.setVolume && game.audio.setVolume({ master: s.masterVolume, music: s.musicVolume, sfx: s.sfxVolume }); } catch { /* optional */ }
  if (game.ui && game.ui.services) game.ui.services.settings = Object.assign(game.ui.services.settings || {}, { textSpeed: s.textSpeed, keyHints: s.keyHints });
  game.settings = { ...s, textSpeedLevel: textSpeedValue(s.textSpeed) };
  return s;
}

export function goToTitle(game) {
  if (hasScene('title')) return game.scenes.reset(createScene('title', game, {}), {});
  return game.scenes.reset();
}

export function music(game, id, fadeMs = 900) {
  try { game.audio && game.audio.music && game.audio.music(id, { fadeMs }); } catch { /* optional */ }
}

/** Draw a portrait (art when available, else a silhouette). size 48 or smaller (scaled with nearest neighbour). */
export function drawPortrait(game, ctx, who, x, y, size = 48, face = 'neutral') {
  const get = game.art && game.art.getPortraitSheet ? game.art.getPortraitSheet.bind(game.art) : game.ui && game.ui.services && game.ui.services.getPortraitSheet;
  let sheet = null;
  try { sheet = get ? get(who) : null; } catch { sheet = null; }
  const S = PORTRAIT_SHEET.size;
  ctx.fillStyle = THEME.navyDeep; ctx.fillRect(x - 1, y - 1, size + 2, size + 2);
  if (sheet && sheet.canvas) {
    const col = PORTRAIT_SHEET.exprCol[face] ?? 0;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet.canvas, col * S, PORTRAIT_SHEET.rowNormal * S, S, S, x, y, size, size);
  } else {
    const k = size / S;
    ctx.fillStyle = '#b9a47a'; ctx.fillRect(x, y, size, size);
    ctx.fillStyle = '#8a7650';
    ctx.fillRect(x + Math.round(14 * k), y + Math.round(10 * k), Math.round(20 * k), Math.round(20 * k));
    ctx.fillRect(x + Math.round(8 * k), y + Math.round(32 * k), Math.round(32 * k), Math.round(16 * k));
  }
}

/** Fill the whole screen with a vertical banded gradient (cheap, pixel-art friendly). bands: [[y0, color], ...] */
export function drawBands(ctx, colors, y0 = 0, y1 = 240) {
  const n = colors.length, h = (y1 - y0) / n;
  colors.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, Math.round(y0 + i * h), 320, Math.ceil(h) + 1); });
}

/** Navy veil used behind full-screen menus (opaque enough to hide whatever the world draws). */
export function drawVeil(ctx) {
  drawBands(ctx, ['#161c3a', '#181f40', '#1a2244', '#1c2548', '#1a2244', '#181f40']);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let y = 0; y < 240; y += 4) ctx.fillRect(0, y, 320, 1);
}

export function drawHints(game, ctx, text) {
  const st = game.ui && game.ui.services && game.ui.services.settings;
  if (st && st.keyHints === false) return;
  drawText(ctx, text, 160, 228, { color: '#cfd3ec', shadow: THEME.navyDeep, align: 'center' });
}

export function drawBadge(game, ctx, icon, x, y) { return drawIconSafe(game.ui, ctx, icon, x, y); }

/** Scene base: modal slot + notice line + sfx helper. Subclasses call `this.updateModal(dt, input)` first. */
export class MenuScene extends Scene {
  constructor(game, params = {}) {
    super(game);
    this.params = params || {};
    this.t = 0;
    this.modal = null;
    this.onModal = null;
    this.notice = null;
    this.noticeT = 0;
  }
  get services() { return this.game.ui.services; }
  sfx(n) { try { this.game.audio && this.game.audio.sfx && this.game.audio.sfx(n); } catch { /* optional */ } }
  say(text, color = '#ffffff') { this.notice = { text, color }; this.noticeT = 2.6; }
  confirm(message, cb, { yes = 'Yes', no = 'No', defaultYes = false } = {}) {
    this.modal = new ConfirmBox({ services: this.services, message, yes, no, defaultYes });
    this.onModal = cb;
  }
  choose(options, cb, { title = null, cursor = 0, x, y } = {}) {
    this.modal = new ChoiceBox({ services: this.services, options, cursor, cancellable: true, title });
    this.modal.x = x !== undefined ? x : Math.round((320 - this.modal.w) / 2);
    this.modal.y = y !== undefined ? y : Math.round((240 - this.modal.h) / 2) - 8;
    this.onModal = cb;
  }
  /** Runs the modal if any. Returns true while one is open (the caller must skip its own input). */
  updateModal(dt, input) {
    this.t += dt;
    if (this.noticeT > 0) this.noticeT -= dt;
    if (!this.modal) return false;
    this.modal.update(dt, input);
    if (this.modal.done) {
      const r = this.modal.result, cb = this.onModal;
      this.modal = null; this.onModal = null;
      if (cb) cb(r);
    }
    return true;
  }
  drawModal(ctx) {
    if (!this.modal) return;
    drawWindow(ctx, 0, 0, 320, 240, 'dim');
    this.modal.draw(ctx);
  }
  drawNotice(ctx, y = 214) {
    if (!this.notice || this.noticeT <= 0) return;
    const w = Math.min(300, 20 + this.notice.text.length * 5);
    const x = Math.round((320 - w) / 2);
    drawWindow(ctx, x, y, w, 15, 'tooltip');
    drawText(ctx, this.notice.text, 160, y + 4, { color: this.notice.color, shadow: THEME.navyDeep, align: 'center' });
  }
}
