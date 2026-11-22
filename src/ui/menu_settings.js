// Settings tab: volume sliders, options, save / load / export / import / quit.
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { saveSettings, saveSlots } from '../core/state.js';
import { clamp } from '../core/util.js';
import { h, clear, sfx, fmtPlay } from './dom.js';
import { confirm } from './widgets.js';
import { exportDialog, importDialog } from './saveio.js';
import { fmtNum } from './helpers.js';

const SLIDERS = [['master', 'Master volume'], ['music', 'Music'], ['sfx', 'Sound effects'], ['ambience', 'Ambience']];
const OPTIONS = [
  ['textSpeed', 'Text speed', ['slow', 'normal', 'fast']],
  ['timeScale', 'Time speed', ['slow', 'normal', 'fast']],
  ['quality', 'Quality', ['low', 'medium', 'high']],
  ['touchControls', 'Touch controls', ['auto', 'on', 'off']],
];

/** Apply + persist one setting and tell Systems. */
export function applySetting(key, value) {
  if (!Game.settings) Game.settings = {};
  Game.settings[key] = value;
  try { saveSettings(Game.settings); } catch (_) { /* ignore */ }
  if (['master', 'music', 'sfx', 'ambience'].includes(key)) {
    try { Game.audio.setVolume({ master: Game.settings.master, music: Game.settings.music, sfx: Game.settings.sfx, ambience: Game.settings.ambience }); } catch (_) { /* ignore */ }
  }
  Game.bus.emit(EVT.UI_SETTING, { key, value });
}

export function settingsTab({ close }) {
  const s = () => Game.settings || {};
  const rows = []; // {el, left, right, activate}
  let sel = 0;
  const paint = () => rows.forEach((r, i) => r.el.classList.toggle('is-sel', i === sel));
  const add = (r) => { r.i = rows.length; rows.push(r); r.el.addEventListener('pointerenter', () => { sel = r.i; paint(); }); return r; };

  const left = h('div', { class: 'lb-set-col' }, h('h3', null, 'Sound'));
  for (const [key, label] of SLIDERS) {
    const val = h('span', { class: 'lb-set-val' });
    const fill = h('i');
    const track = h('div', { class: 'lb-slider', testid: 'slider-' + key }, fill);
    const paintV = () => { const v = clamp(Number(s()[key]) || 0, 0, 1); fill.style.width = v * 100 + '%'; val.textContent = Math.round(v * 100) + '%'; };
    const setV = (v) => { applySetting(key, Math.round(clamp(v, 0, 1) * 10) / 10); paintV(); };
    const fromPointer = (e) => { const r = track.getBoundingClientRect(); setV((e.clientX - r.left) / r.width); };
    track.addEventListener('pointerdown', (e) => { track.setPointerCapture(e.pointerId); fromPointer(e); sfx('ui_move'); track.onpointermove = fromPointer; });
    track.addEventListener('pointerup', () => { track.onpointermove = null; });
    const el = h('div', { class: 'lb-set-row' }, h('span', { class: 'lb-set-label' }, label), track, val);
    add({ el, left: () => setV((s()[key] || 0) - 0.1), right: () => setV((s()[key] || 0) + 0.1), activate: () => {} });
    paintV();
    left.appendChild(el);
  }
  left.appendChild(h('h3', null, 'Game'));
  for (const [key, label, vals] of OPTIONS) {
    const btns = vals.map((v) => h('button', { class: 'lb-seg', testid: `opt-${key}-${v}`, onClick: () => { set(v); sfx('ui_tab'); } }, v === 'auto' ? 'Auto' : v[0].toUpperCase() + v.slice(1)));
    const paintO = () => btns.forEach((b, i) => b.classList.toggle('on', vals[i] === s()[key]));
    const set = (v) => { applySetting(key, v); paintO(); };
    const step = (d) => { const i = Math.max(0, vals.indexOf(s()[key])); const n = (i + d + vals.length) % vals.length; set(vals[n]); sfx('ui_tab'); };
    const el = h('div', { class: 'lb-set-row' }, h('span', { class: 'lb-set-label' }, label), h('div', { class: 'lb-segs' }, btns));
    add({ el, left: () => step(-1), right: () => step(1), activate: () => step(1) });
    paintO();
    left.appendChild(el);
  }

  const right = h('div', { class: 'lb-set-col' }, h('h3', null, 'Save & Load'));
  const slotRows = [];
  const doSave = async (slot, statusEl) => {
    if (slot === 0) { sfx('ui_error'); return; }
    const info = saveSlots().find((x) => x.slot === slot);
    if (info && !info.empty && !(await confirm(`Overwrite the save in slot ${slot}?`))) return;
    Game.bus.emit(EVT.UI_SAVE, { slot });
    statusEl.textContent = 'Saved!'; statusEl.classList.add('ok');
    setTimeout(() => { statusEl.textContent = ''; statusEl.classList.remove('ok'); repaintSlots(); }, 1400);
    setTimeout(repaintSlots, 120);
  };
  const doLoad = async (slot) => {
    const info = saveSlots().find((x) => x.slot === slot);
    if (!info || info.empty) { sfx('ui_error'); return; }
    if (await confirm(`Load ${slot === 0 ? 'the autosave' : 'slot ' + slot}? Unsaved progress will be lost.`)) { Game.bus.emit(EVT.UI_LOAD, { slot }); close(); }
  };
  for (const slot of [1, 2, 3, 0]) {
    const info = h('div', { class: 'lb-slot-info' });
    const status = h('span', { class: 'lb-slot-status' });
    const saveB = h('button', { class: 'lb-btn small', testid: `save-${slot}`, onClick: () => { sub(slot, 0); doSave(slot, status); } }, 'Save');
    const loadB = h('button', { class: 'lb-btn small', testid: `load-${slot}`, onClick: () => { sub(slot, 1); doLoad(slot); } }, 'Load');
    if (slot === 0) saveB.classList.add('is-disabled');
    const el = h('div', { class: 'lb-set-row slotrow', testid: `slotrow-${slot}` }, info, status, saveB, loadB);
    const r = add({ el, sub: 1, subs: [saveB, loadB], left: () => { r.sub = 0; paintSub(); }, right: () => { r.sub = 1; paintSub(); }, activate: () => (r.sub === 0 ? doSave(slot, status) : doLoad(slot)) });
    const paintSub = () => r.subs.forEach((b, i) => b.classList.toggle('subsel', i === r.sub));
    r.paintSub = paintSub;
    paintSub();
    slotRows.push({ slot, info, el });
    right.appendChild(el);
  }
  function sub(slot, i) { const r = rows.find((x) => x.el.dataset.testid === `slotrow-${slot}`) || rows.find((x) => x.el.getAttribute('data-testid') === `slotrow-${slot}`); if (r) { r.sub = i; r.paintSub(); } }
  let lastSig = '';
  function repaintSlots() {
    const slots = saveSlots();
    const sig = JSON.stringify(slots);
    if (sig === lastSig) return;
    lastSig = sig;
    for (const { slot, info } of slotRows) {
      const sl = slots.find((x) => x.slot === slot);
      clear(info);
      info.append(h('b', null, slot === 0 ? 'Autosave' : `Slot ${slot}`));
      if (!sl || sl.empty) info.append(h('span', { class: 'lb-muted' }, 'Empty'));
      else info.append(h('span', { class: 'lb-muted' }, `${sl.meta.name} · ${sl.meta.dateLabel} · ${fmtPlay(sl.meta.playSeconds)} · ${fmtNum(sl.meta.money)}c · ${sl.meta.lanterns}/6 ✦`));
    }
  }
  const act = (label, testid, fn, cls = '') => { const b = h('button', { class: 'lb-btn small ' + cls, testid, onClick: fn }, label); return add({ el: b, activate: fn, left() {}, right() {} }).el; };
  right.appendChild(h('div', { class: 'lb-set-actions' },
    act('Export save', 'export-open', () => exportDialog()),
    act('Import save', 'import-open', async () => { if (await importDialog()) { lastSig = ''; repaintSlots(); } }),
    act('Quit to title', 'quit-open', async () => { if (await confirm('Quit to the title screen? Unsaved progress will be lost.', { yes: 'Quit', no: 'Stay' })) { Game.bus.emit(EVT.UI_QUIT, {}); close(); } }, 'danger')));
  right.appendChild(h('h3', null, 'Controls'));
  right.appendChild(h('div', { class: 'lb-controls' },
    ...[['Move', 'WASD / Arrows'], ['Talk · Select', 'Space / Enter'], ['Back', 'X / Esc'], ['Run', 'Shift'], ['Menu', 'Esc / Tab'], ['Tabs', 'Q / E'], ['Map · Journal', 'M · J']].map(([a, b]) => h('div', null, h('span', null, a), h('span', { class: 'lb-kbd' }, b)))));

  repaintSlots();
  const el = h('div', { class: 'lb-tab-settings lb-scroll', testid: 'settings' }, left, right);
  paint();
  const scrollSel = () => rows[sel].el.scrollIntoView({ block: 'nearest' });
  return {
    el, hint: '↑↓ ←→: adjust',
    key(a) {
      if (a === 'up') sel = (sel - 1 + rows.length) % rows.length;
      else if (a === 'down') sel = (sel + 1) % rows.length;
      else if (a === 'left') { rows[sel].left(); sfx('ui_move'); return true; } else if (a === 'right') { rows[sel].right(); sfx('ui_move'); return true; } else if (a === 'confirm') { rows[sel].activate(); return true; } else return false;
      sfx('ui_move'); paint(); scrollSel(); return true;
    },
    tick() { repaintSlots(); },
  };
}
