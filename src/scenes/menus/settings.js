// settings: master/music/sfx volume (live), text speed, key hints, reset all data (double confirm).
// Persisted through the save module's settings(); applied with applySettings(game, s) (also use it at boot).
import { drawText, drawWindow, drawTab, drawCursor, drawBar, THEME } from '../../ui/index.js';
import { MenuScene, drawVeil, drawHints, saveApi, applySettings } from './common.js';
import { normalizeSettings, TEXT_SPEEDS, textSpeedValue } from './data.js';
import { BALANCE } from '../../sim/balance.js';

const ROWS = [
  { key: 'masterVolume', label: 'Master volume', type: 'vol' }, { key: 'musicVolume', label: 'Music volume', type: 'vol' },
  { key: 'sfxVolume', label: 'Sound effects', type: 'vol' }, { key: 'textSpeed', label: 'Text speed', type: 'speed' },
  { key: 'keyHints', label: 'Key hints', type: 'bool' }, { key: 'reset', label: 'Reset all data', type: 'action' }, { key: 'back', label: 'Back', type: 'action' },
];

export class SettingsScene extends MenuScene {
  constructor(game, params = {}) {
    super(game, params);
    this.api = saveApi(game);
    this.s = normalizeSettings(this.api.settings());
    this.cursor = 0;
    this.result = {};
  }
  persist() {
    const patch = { ...this.s, textSpeed: textSpeedValue(this.s.textSpeed) };
    try { this.api.settings(patch); } catch { this.say('Could not store settings.', '#e8645a'); }
    applySettings(this.game, this.s);
  }
  adjust(d) {
    const r = ROWS[this.cursor];
    if (r.type === 'vol') this.s[r.key] = Math.round(Math.max(0, Math.min(1, this.s[r.key] + d * 0.1)) * 10) / 10;
    else if (r.type === 'speed') this.s.textSpeed = TEXT_SPEEDS[(TEXT_SPEEDS.indexOf(this.s.textSpeed) + d + 3) % 3];
    else if (r.type === 'bool') this.s.keyHints = !this.s.keyHints;
    else return;
    this.sfx(r.key === 'sfxVolume' ? 'confirm' : 'cursor');
    this.persist();
  }
  resetAll() {
    this.confirm('Reset ALL data? Every save, setting and record is erased.', (a) => {
      if (!a) return;
      this.confirm('Really erase everything? This cannot be undone.', (b) => {
        if (!b) return;
        for (const slot of ['auto', 1, 2, 3]) { try { this.api.delete(slot); } catch { /* ignore */ } }
        try { this.api.meta({ endingsSeen: [], bestRecords: {}, plays: 0 }); this.api.settings({ ...BALANCE.save.defaultSettings }); } catch { /* ignore */ }
        this.s = normalizeSettings(BALANCE.save.defaultSettings); applySettings(this.game, this.s);
        this.result = { reset: true }; this.say('All data erased.', '#e8645a');
      });
    });
  }
  update(dt, input) {
    if (this.updateModal(dt, input)) return;
    if (this.t < 0.1) return;
    if (input.repeat('up')) { this.cursor = (this.cursor + ROWS.length - 1) % ROWS.length; this.sfx('cursor'); }
    if (input.repeat('down')) { this.cursor = (this.cursor + 1) % ROWS.length; this.sfx('cursor'); }
    if (input.repeat('left')) this.adjust(-1);
    if (input.repeat('right')) this.adjust(1);
    if (input.pressed('confirm')) {
      const r = ROWS[this.cursor];
      if (r.key === 'reset') this.resetAll();
      else if (r.key === 'back') { this.sfx('cancel'); this.game.scenes.pop(this.result); }
      else if (r.type === 'bool' || r.type === 'speed') this.adjust(1);
    } else if (input.pressed('cancel') || input.pressed('menu')) { this.sfx('cancel'); this.game.scenes.pop(this.result); }
  }
  draw(ui) {
    const ctx = ui.ctx;
    drawVeil(ctx);
    drawTab(ctx, 'Settings', 20, 14, 'menu');
    drawWindow(ctx, 20, 26, 280, 176, 'menu');
    ROWS.forEach((r, i) => {
      const y = 36 + i * 22 + (r.type === 'action' ? 6 : 0), sel = i === this.cursor;
      if (sel) { ctx.fillStyle = 'rgba(242,184,75,0.22)'; ctx.fillRect(24, y - 4, 272, 17); drawCursor(ctx, 27, y, this.t); }
      drawText(ctx, r.label, 38, y, { color: r.key === 'reset' ? '#e8645a' : sel ? THEME.gold : '#ffffff', shadow: THEME.navyDeep });
      if (r.type === 'vol') {
        const v = this.s[r.key];
        drawBar(ctx, 160, y + 1, 90, 6, v, 1, { fill: sel ? THEME.gold : '#7fb4ff', back: '#3a3f5e', border: THEME.navyDeep, segments: 10 });
        drawText(ctx, `${Math.round(v * 100)}%`, 290, y, { color: '#cfd3ec', shadow: THEME.navyDeep, align: 'right' });
      } else if (r.type === 'speed') {
        TEXT_SPEEDS.forEach((n, k) => drawText(ctx, n[0].toUpperCase() + n.slice(1), 160 + k * 42, y, { color: this.s.textSpeed === n ? THEME.gold : '#6b7090', shadow: THEME.navyDeep }));
      } else if (r.type === 'bool') drawText(ctx, this.s.keyHints ? 'On' : 'Off', 290, y, { color: this.s.keyHints ? '#7fd36a' : '#e8645a', shadow: THEME.navyDeep, align: 'right' });
    });
    drawHints(this.game, ctx, 'Left/Right: change    Cancel: back');
    this.drawNotice(ctx, 208);
    this.drawModal(ctx);
  }
}
