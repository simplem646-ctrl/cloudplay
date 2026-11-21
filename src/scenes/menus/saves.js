// save_menu / load_menu: 3 manual slots + auto (read-only when saving). Results:
//   save_menu -> { saved: bool, slot? }     load_menu -> { loaded: true, slot, state } | { loaded: false }
import { drawText, drawWindow, drawTab, drawCursor, THEME } from '../../ui/index.js';
import { MenuScene, drawVeil, drawHints, saveApi } from './common.js';
import { formatSlots } from './data.js';

const ROW_H = 46;

export class SlotScene extends MenuScene {
  constructor(game, params = {}, mode = 'save') {
    super(game, params);
    this.mode = mode;
    this.cursor = 1;
    this.reload();
    if (mode === 'load') { const i = this.rows.findIndex((r) => r.kind === 'full'); this.cursor = i < 0 ? 0 : i; }
    this.result = mode === 'save' ? { saved: false } : { loaded: false };
  }
  reload() {
    let list = [];
    try { list = saveApi(this.game).list(); } catch { list = []; }
    this.rows = formatSlots(list, { mode: this.mode });
    if (!this.rows.length) this.say('Storage is unavailable: nothing to show.', '#e8645a');
  }
  close() { this.game.scenes.pop(this.result); }
  activate() {
    const r = this.rows[this.cursor];
    if (!r) return;
    if (this.mode === 'save') {
      if (r.readOnly) { this.sfx('error'); this.say('The auto slot is written every night.', '#cfd3ec'); return; }
      if (r.kind === 'empty') { this.doSave(r); return; }
      this.choose(['Overwrite', 'Delete', 'Back'], (i) => {
        if (i === 0) this.confirm(`Overwrite ${r.label}?`, (y) => { if (y) this.doSave(r); });
        else if (i === 1) this.askDelete(r);
      }, { title: r.label });
    } else {
      if (r.kind === 'empty') { this.sfx('error'); this.say('That slot is empty.', '#cfd3ec'); return; }
      if (r.kind === 'corrupt') { this.sfx('error'); this.say('That save cannot be read.', '#e8645a'); this.askDelete(r, true); return; }
      this.choose(r.readOnly ? ['Load', 'Back'] : ['Load', 'Delete', 'Back'], (i) => {
        if (i === 0) this.confirm(`Load ${r.label}? Current progress is lost.`, (y) => { if (y) this.doLoad(r); });
        else if (i === 1 && !r.readOnly) this.askDelete(r);
      }, { title: r.label });
    }
  }
  askDelete(r, corrupt = false) {
    if (r.readOnly) { this.say('The auto slot cannot be deleted.', '#cfd3ec'); return; }
    this.confirm(`Delete ${r.label}${corrupt ? ' (unreadable)' : ''}? This cannot be undone.`, (y) => {
      if (!y) return;
      try { saveApi(this.game).delete(r.slot); } catch { /* never throws to the player */ }
      this.say(`${r.label} deleted.`); this.reload();
    });
  }
  doSave(r) {
    let res;
    try { res = saveApi(this.game).write(r.slot); } catch { res = { ok: false }; }
    if (res && res.ok) {
      this.sfx('confirm');
      this.result = { saved: true, slot: r.slot, fallback: !!res.fallback };
      this.say(res.fallback ? 'Saved for this session only (storage unavailable).' : 'Game saved!', res.fallback ? '#f2b84b' : '#7fd36a');
    } else { this.sfx('error'); this.say('Could not save. You can keep playing.', '#e8645a'); }
    this.reload();
  }
  doLoad(r) {
    let res;
    try { res = saveApi(this.game).read(r.slot); } catch { res = { ok: false, error: 'error' }; }
    if (res && res.ok) { this.sfx('confirm'); this.game.scenes.pop({ loaded: true, slot: r.slot, state: res.state, migrated: !!res.migrated }); }
    else { this.sfx('error'); this.say(`Could not load (${(res && res.error) || 'error'}).`, '#e8645a'); this.reload(); }
  }
  update(dt, input) {
    if (this.updateModal(dt, input)) return;
    if (this.t < 0.1) return;
    const n = this.rows.length;
    if (n && input.repeat('up')) { this.cursor = (this.cursor + n - 1) % n; this.sfx('cursor'); }
    if (n && input.repeat('down')) { this.cursor = (this.cursor + 1) % n; this.sfx('cursor'); }
    if (input.pressed('confirm')) this.activate();
    else if (input.pressed('cancel') || input.pressed('menu')) { this.sfx('cancel'); this.close(); }
  }
  draw(ui) {
    const ctx = ui.ctx;
    drawVeil(ctx);
    drawTab(ctx, this.mode === 'save' ? 'Save Game' : 'Load Game', 12, 6, 'menu');
    this.rows.forEach((r, i) => {
      const y = 24 + i * (ROW_H + 4), sel = i === this.cursor;
      drawWindow(ctx, 12, y, 296, ROW_H, sel ? 'tooltip' : 'menu');
      if (sel) drawCursor(ctx, 15, y + 18, this.t);
      const dim = r.kind !== 'full';
      drawText(ctx, r.label, 26, y + 6, { color: r.readOnly ? '#7fb4ff' : sel ? THEME.gold : '#ffffff', shadow: THEME.navyDeep });
      if (r.readOnly && this.mode === 'save') drawText(ctx, 'read-only', 300, y + 6, { color: '#6b7090', shadow: THEME.navyDeep, align: 'right' });
      r.lines.forEach((l, k) => drawText(ctx, l, k ? 26 : 70, y + 6 + k * 11 + (k ? 3 : 0), { color: dim ? (r.kind === 'corrupt' ? '#e8645a' : '#6b7090') : k === 0 ? '#ffffff' : '#cfd3ec', shadow: THEME.navyDeep }));
    });
    drawHints(this.game, ctx, 'Confirm: choose    Cancel: back');
    this.drawNotice(ctx, 212);
    this.drawModal(ctx);
  }
}
export class SaveMenu extends SlotScene { constructor(g, p) { super(g, p, 'save'); } }
export class LoadMenu extends SlotScene { constructor(g, p) { super(g, p, 'load'); } }
