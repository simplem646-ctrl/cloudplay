// Export / import save dialogs (copyable text box, paste box). Shared by the title screen and the settings tab.
import { Game } from '../core/game.js';
import { exportSave, importSave, saveSlots } from '../core/state.js';
import { h, sfx } from './dom.js';
import { openModal } from './widgets.js';

function slotOption(s, label) {
  return h('option', { value: String(s.slot) }, `${label || (s.slot === 0 ? 'Autosave' : 'Slot ' + s.slot)}${s.empty ? ' (empty)' : ` — ${s.meta.name}, ${s.meta.dateLabel}`}`);
}

/** Show a copyable text box with the save data of a slot. @returns {Promise<void>} */
export function exportDialog(slot) {
  return new Promise((resolve) => {
    const slots = saveSlots();
    const sel = h('select', { class: 'lb-select', testid: 'export-slot' }, slots.map((s) => slotOption(s)));
    const first = slot != null ? slot : (slots.find((s) => !s.empty) || slots[1]).slot;
    sel.value = String(first);
    const ta = h('textarea', { class: 'lb-textarea', readonly: true, rows: 6, testid: 'export-text', spellcheck: 'false' });
    const status = h('div', { class: 'lb-muted lb-io-status' });
    const fill = () => { const t = exportSave(Number(sel.value)); ta.value = t; status.textContent = t ? 'Copy this text and keep it somewhere safe.' : 'That slot is empty: nothing to export.'; };
    sel.addEventListener('change', fill);
    const copy = h('button', { class: 'lb-btn primary', testid: 'export-copy', onClick: async () => { ta.select(); try { await navigator.clipboard.writeText(ta.value); status.textContent = 'Copied to the clipboard!'; } catch (_) { try { document.execCommand('copy'); status.textContent = 'Copied!'; } catch (__) { status.textContent = 'Press Ctrl+C to copy.'; } } sfx('ui_confirm'); } }, 'Copy');
    const closeBtn = h('button', { class: 'lb-btn', testid: 'export-close', onClick: () => done() }, 'Close');
    const box = h('div', { class: 'lb-panel lb-io lb-pop', testid: 'export-dialog' }, h('h2', { class: 'lb-modal-title' }, 'Export save'), sel, ta, status, h('div', { class: 'lb-io-btns' }, copy, closeBtn));
    const m = openModal(box, { mode: Game.mode === 'title' ? null : 'menu', light: true, onPress: (a) => { if (a === 'cancel') done(); } });
    box.addEventListener('keydown', (e) => { if (e.key === 'Escape') done(); });
    function done() { if (m.closed()) return; sfx('ui_close'); m.close(); resolve(); }
    fill();
    ta.focus();
  });
}

/** Paste box to import a save into a manual slot. Resolves true when something was imported. @returns {Promise<boolean>} */
export function importDialog() {
  return new Promise((resolve) => {
    let imported = false;
    const slots = saveSlots().filter((s) => s.slot > 0);
    const sel = h('select', { class: 'lb-select', testid: 'import-slot' }, slots.map((s) => slotOption(s)));
    const ta = h('textarea', { class: 'lb-textarea', rows: 6, placeholder: 'Paste exported save text here…', testid: 'import-text', spellcheck: 'false' });
    const status = h('div', { class: 'lb-muted lb-io-status' }, 'This replaces whatever is in the chosen slot.');
    const go = h('button', { class: 'lb-btn primary', testid: 'import-go', onClick: () => {
      const r = importSave(Number(sel.value), ta.value);
      if (r.ok) { imported = true; status.textContent = 'Imported!'; sfx('ui_confirm'); setTimeout(() => done(), 500); } else { status.textContent = r.error || 'Could not import.'; status.classList.add('err'); sfx('ui_error'); }
    } }, 'Import');
    const closeBtn = h('button', { class: 'lb-btn', testid: 'import-close', onClick: () => done() }, 'Cancel');
    const box = h('div', { class: 'lb-panel lb-io lb-pop', testid: 'import-dialog' }, h('h2', { class: 'lb-modal-title' }, 'Import save'), sel, ta, status, h('div', { class: 'lb-io-btns' }, go, closeBtn));
    const m = openModal(box, { mode: Game.mode === 'title' ? null : 'menu', light: true, onPress: (a) => { if (a === 'cancel') done(); } });
    box.addEventListener('keydown', (e) => { if (e.key === 'Escape') done(); });
    function done() { if (m.closed()) return; sfx('ui_close'); m.close(); resolve(imported); }
    ta.focus();
  });
}
