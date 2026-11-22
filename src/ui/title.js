// Title screen: press any key -> New Game / Continue / Options. New game form has a live chibi avatar preview.
import { Game } from '../core/game.js';
import { saveSlots, deleteSlot, DEFAULT_LOOK } from '../core/state.js';
import { h, clear, sfx, unlockAudio, fmtPlay, frag, pushInput } from './dom.js';
import { openModal, confirm } from './widgets.js';
import { exportDialog, importDialog } from './saveio.js';
import { settingsTab } from './menu_settings.js';
import { LANTERN_SVG } from './svgs.js';
import { fmtNum } from './helpers.js';
import { hudVisible, hudIsVisible } from './hud.js';

export const SWATCHES = {
  hair: ['#4b3425', '#1f1a1a', '#c9833b', '#e8c46a', '#b94a3a', '#8e6bbf'],
  jacket: ['#3b5b9c', '#c0405a', '#4f8a5c', '#8a5aa8', '#d98a3a', '#3a3a4a'],
  scarf: ['#e8833a', '#e0607e', '#f4c542', '#6fb7e8', '#6fb85a', '#f4f0e0'],
};
/** Validate a player name: trimmed, 1..10 chars. @returns {{ok:boolean,name:string,error?:string}} */
export function validateName(raw) {
  const name = String(raw == null ? '' : raw).trim().replace(/\s+/g, ' ');
  if (!name) return { ok: false, name, error: 'Please enter a name.' };
  if (name.length > 10) return { ok: false, name: name.slice(0, 10), error: 'At most 10 characters.' };
  return { ok: true, name };
}

const shade = (hex, t) => {
  const n = parseInt(hex.slice(1), 16);
  const f = (v) => Math.max(0, Math.min(255, Math.round(v + (t < 0 ? v * t : (255 - v) * t))));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
};

/** Draw the cute chibi avatar preview on a canvas. */
export function drawChibi(canvas, look) {
  const c = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  c.clearRect(0, 0, W, H);
  c.save();
  c.scale(W / 240, H / 300);
  c.lineJoin = 'round'; c.lineCap = 'round';
  const INK = '#4a3426';
  const skin = '#ffe2c8';
  const blob = (fn, fill, lw = 4) => { c.beginPath(); fn(); c.fillStyle = fill; c.fill(); if (lw) { c.lineWidth = lw; c.strokeStyle = INK; c.stroke(); } };
  // ground shadow
  c.beginPath(); c.ellipse(120, 285, 62, 10, 0, 0, Math.PI * 2); c.fillStyle = 'rgba(70,40,20,.2)'; c.fill();
  // legs + boots
  for (const x of [98, 142]) { blob(() => c.roundRect(x - 11, 236, 22, 34, 8), '#5a4636'); blob(() => c.ellipse(x, 274, 17, 10, 0, 0, Math.PI * 2), '#7a5238'); }
  // back hair
  blob(() => { c.ellipse(120, 112, 80, 78, 0, 0, Math.PI * 2); }, look.hair);
  // body (jacket)
  blob(() => { c.moveTo(78, 172); c.quadraticCurveTo(120, 160, 162, 172); c.lineTo(172, 246); c.quadraticCurveTo(120, 262, 68, 246); c.closePath(); }, look.jacket);
  c.beginPath(); c.moveTo(120, 176); c.lineTo(120, 252); c.lineWidth = 3; c.strokeStyle = shade(look.jacket, -0.35); c.stroke();
  for (const y of [196, 218]) { c.beginPath(); c.arc(128, y, 3.200, 0, Math.PI * 2); c.fillStyle = '#ffe9a8'; c.fill(); }
  // arms + mitten hands
  for (const s of [-1, 1]) { blob(() => c.ellipse(120 + s * 56, 212, 15, 30, s * 0.18, 0, Math.PI * 2), look.jacket); blob(() => c.arc(120 + s * 62, 240, 11, 0, Math.PI * 2), skin); }
  // neck + scarf
  blob(() => c.rect(108, 160, 24, 18), skin, 0);
  blob(() => { c.ellipse(120, 172, 44, 17, 0, 0, Math.PI * 2); }, look.scarf);
  blob(() => { c.moveTo(138, 176); c.lineTo(160, 232); c.lineTo(140, 236); c.lineTo(128, 186); c.closePath(); }, shade(look.scarf, -0.1));
  c.beginPath(); c.moveTo(100, 170); c.quadraticCurveTo(120, 180, 140, 170); c.lineWidth = 2.500; c.strokeStyle = shade(look.scarf, -0.35); c.stroke();
  // head
  blob(() => c.ellipse(120, 110, 66, 60, 0, 0, Math.PI * 2), skin);
  // ears
  for (const s of [-1, 1]) blob(() => c.ellipse(120 + s * 64, 118, 9, 11, 0, 0, Math.PI * 2), skin, 3);
  // eyes
  for (const s of [-1, 1]) {
    const x = 120 + s * 26, y = 120;
    blob(() => c.ellipse(x, y, 11, 15, 0, 0, Math.PI * 2), '#3a2a22', 0);
    c.beginPath(); c.ellipse(x, y + 3, 7, 9, 0, 0, Math.PI * 2); c.fillStyle = shade(look.hair, 0.15); c.fill();
    c.beginPath(); c.arc(x - 3.500, y - 5, 4.200, 0, Math.PI * 2); c.fillStyle = '#fff'; c.fill();
    c.beginPath(); c.arc(x + 3, y + 5, 2, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.85)'; c.fill();
    c.beginPath(); c.moveTo(x - 12, y - 14 + s * 0); c.quadraticCurveTo(x, y - 20, x + 12, y - 14); c.lineWidth = 3.200; c.strokeStyle = INK; c.stroke();
    c.beginPath(); c.ellipse(x + s * 6, y + 20, 10, 6, 0, 0, Math.PI * 2); c.fillStyle = 'rgba(255,130,150,.45)'; c.fill();
  }
  // mouth + nose
  c.beginPath(); c.moveTo(112, 146); c.quadraticCurveTo(120, 154, 128, 146); c.lineWidth = 3; c.strokeStyle = '#a8523f'; c.stroke();
  c.beginPath(); c.arc(120, 136, 1.800, 0, Math.PI * 2); c.fillStyle = 'rgba(160,90,70,.6)'; c.fill();
  // bangs (tousled)
  blob(() => {
    c.moveTo(52, 112); c.quadraticCurveTo(48, 52, 120, 48); c.quadraticCurveTo(192, 52, 188, 112);
    c.quadraticCurveTo(176, 80, 160, 84); c.lineTo(168, 108); c.quadraticCurveTo(146, 76, 128, 82); c.lineTo(132, 106);
    c.quadraticCurveTo(108, 74, 88, 84); c.lineTo(94, 106); c.quadraticCurveTo(70, 80, 52, 112); c.closePath();
  }, look.hair);
  // ahoge + highlight
  c.beginPath(); c.moveTo(114, 52); c.quadraticCurveTo(100, 22, 122, 18); c.quadraticCurveTo(116, 34, 128, 50); c.closePath(); c.fillStyle = look.hair; c.fill(); c.lineWidth = 4; c.strokeStyle = INK; c.stroke();
  c.beginPath(); c.ellipse(96, 66, 22, 7, -0.5, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.28)'; c.fill();
  c.restore();
}

let active = null;

/** @returns {Promise<{action:'new'|'continue'|'quit', slot?:number, name?:string, look?:object}>} */
export function showTitle(layer) {
  if (active) return active.promise;
  if (Game.mode === 'boot') { try { Game.setMode('title'); } catch (_) { /* ignore */ } }
  let resolveFn;
  const promise = new Promise((r) => { resolveFn = r; });
  let stage = 'press';
  let sel = 0;
  let sub = null; // sub-screen controller {key(a)}
  const root = h('div', { class: 'lb-title', testid: 'title' });
  layer.appendChild(root);
  const logo = h('div', { class: 'lb-logo' },
    h('div', { class: 'lb-logo-lamp', html: LANTERN_SVG }),
    h('div', { class: 'lb-wordmark', testid: 'title-logo' }, h('span', null, 'Lanternbrook'), h('span', { class: 'lb-wm-days' }, 'Days')),
    h('div', { class: 'lb-logo-sub' }, 'a cosy little town story'));
  const stars = h('div', { class: 'lb-spark' });
  for (let i = 0; i < 18; i++) stars.appendChild(h('i', { style: { left: ((i * 53) % 100) + '%', top: (8 + ((i * 29) % 60)) + '%', animationDelay: ((i % 6) * 0.5) + 's' } }));
  const stageEl = h('div', { class: 'lb-title-stage' });
  root.append(stars, logo, stageEl);

  const hadHud = hudIsVisible();
  hudVisible(false);
  const done = (res) => { if (!active) return; active = null; offAny(); popInput(); root.remove(); hudVisible(hadHud); resolveFn(res); };
  let popInput = () => {};
  const offAny = (() => { const f = () => { if (stage === 'press') toMenu(); }; window.addEventListener('keydown', f); return () => window.removeEventListener('keydown', f); })();
  root.addEventListener('pointerdown', () => { unlockAudio(); if (stage === 'press') toMenu(); });

  function pressScreen() {
    stage = 'press';
    clear(stageEl);
    stageEl.append(h('div', { class: 'lb-press', testid: 'title-press' }, 'Press any key'));
  }
  const menuItems = () => {
    const hasSave = saveSlots().some((s) => !s.empty);
    return [
      { id: 'new', label: 'New Game', run: toNew },
      { id: 'continue', label: 'Continue', run: toContinue, disabled: !hasSave },
      { id: 'options', label: 'Options', run: toOptions },
    ];
  };
  function toMenu() {
    unlockAudio(); sfx('ui_confirm');
    stage = 'menu'; sub = null;
    clear(stageEl);
    const items = menuItems();
    if (items[sel].disabled) sel = 0;
    const els = items.map((it, i) => h('button', { class: 'lb-btn lb-title-btn' + (it.disabled ? ' is-disabled' : ''), testid: 'title-' + it.id, onClick: () => { sel = i; paint(); run(); }, onPointerenter: () => { if (!it.disabled && sel !== i) { sel = i; paint(); sfx('ui_move'); } } }, it.label));
    const paint = () => els.forEach((e, i) => e.classList.toggle('is-sel', i === sel));
    const run = () => { if (items[sel].disabled) { sfx('ui_error'); return; } sfx('ui_confirm'); items[sel].run(); };
    stageEl.append(h('div', { class: 'lb-title-menu lb-pop' }, els));
    paint();
    sub = {
      key(a) {
        if (a === 'up' || a === 'down') { let n = sel; for (let k = 0; k < items.length; k++) { n = (n + (a === 'up' ? -1 : 1) + items.length) % items.length; if (!items[n].disabled) break; } if (n !== sel) { sel = n; paint(); sfx('ui_move'); } } else if (a === 'confirm') run();
      },
    };
  }

  function toOptions() {
    const box = h('div', { class: 'lb-panel lb-options lb-pop', testid: 'title-options' }, h('h2', { class: 'lb-modal-title' }, 'Options'));
    const api = settingsTab({ close: () => m.close() });
    box.append(api.el, h('div', { class: 'lb-menu-foot' }, h('span', null, h('span', { class: 'lb-kbd' }, 'X'), ' back')));
    const t = setInterval(() => api.tick && api.tick(0.1), 100);
    const m = openModal(box, { mode: null, light: true, onPress: (a) => { if (api.key(a)) return; if (a === 'cancel' || a === 'menu') { sfx('ui_close'); m.close(); } }, onClose: () => clearInterval(t) });
  }

  // ---------- New game ----------
  function toNew() {
    stage = 'new';
    clear(stageEl);
    const look = { ...DEFAULT_LOOK };
    const cvs = h('canvas', { class: 'lb-avatar', width: 240, height: 300, testid: 'avatar' });
    const input = h('input', { class: 'lb-input', type: 'text', maxlength: '10', value: 'Kai', testid: 'name-input', autocomplete: 'off', spellcheck: 'false' });
    const err = h('div', { class: 'lb-err' }, ' ');
    const rows = [{ kind: 'name' }];
    const pal = h('div', { class: 'lb-pal' });
    for (const key of ['hair', 'jacket', 'scarf']) {
      const sw = SWATCHES[key].map((col, i) => h('button', { class: 'lb-sw', style: { background: col }, title: col, testid: `sw-${key}-${i}`, onClick: () => { setLook(key, i); rowSel = rows.findIndex((r) => r.key === key); paintRows(); } }));
      const row = h('div', { class: 'lb-palrow', dataset: { key } }, h('span', { class: 'lb-set-label' }, { hair: 'Hair', jacket: 'Jacket', scarf: 'Scarf' }[key]), h('div', { class: 'lb-swatches' }, sw));
      rows.push({ kind: 'sw', key, sw, row, idx: Math.max(0, SWATCHES[key].indexOf(look[key])) });
      pal.appendChild(row);
    }
    const start = h('button', { class: 'lb-btn primary lb-start', testid: 'new-start', onClick: () => go() }, 'Begin your story');
    const back = h('button', { class: 'lb-btn', testid: 'new-back', onClick: () => { sfx('ui_cancel'); toMenu(); } }, 'Back');
    rows.push({ kind: 'go' });
    let rowSel = 0;
    function setLook(key, i) { const r = rows.find((x) => x.key === key); r.idx = (i + SWATCHES[key].length) % SWATCHES[key].length; look[key] = SWATCHES[key][r.idx]; r.sw.forEach((b, k) => b.classList.toggle('on', k === r.idx)); drawChibi(cvs, look); }
    function paintRows() {
      rows.forEach((r, i) => { const el = r.kind === 'name' ? input.parentNode : r.kind === 'go' ? start : r.row; if (el) el.classList.toggle('is-sel', i === rowSel); });
      if (rows[rowSel].kind === 'name') input.focus(); else input.blur();
    }
    function go() {
      const v = validateName(input.value);
      if (!v.ok) { err.textContent = v.error; sfx('ui_error'); cvs.classList.remove('lb-shake'); void cvs.offsetWidth; input.focus(); return; }
      sfx('ui_confirm');
      done({ action: 'new', name: v.name, look: { ...look } });
    }
    input.addEventListener('input', () => { const v = validateName(input.value); err.textContent = v.ok ? ' ' : v.error; });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === 'ArrowDown') { e.preventDefault(); rowSel = 1; paintRows(); sfx('ui_move'); } else if (e.key === 'Escape') { e.preventDefault(); sfx('ui_cancel'); toMenu(); }
    });
    input.addEventListener('focus', () => { rowSel = 0; paintRows(); });
    const form = h('div', { class: 'lb-panel lb-newgame lb-pop', testid: 'newgame' },
      h('div', { class: 'lb-ng-avatar' }, cvs),
      h('div', { class: 'lb-ng-form' }, h('h2', { class: 'lb-modal-title' }, 'A new arrival'),
        h('div', { class: 'lb-set-row namerow' }, h('span', { class: 'lb-set-label' }, 'Name'), input), err, pal, h('div', { class: 'lb-ng-btns' }, back, start)));
    stageEl.appendChild(form);
    for (const k of ['hair', 'jacket', 'scarf']) setLook(k, rows.find((r) => r.key === k).idx);
    paintRows();
    sub = {
      key(a) {
        if (a === 'cancel') { sfx('ui_cancel'); toMenu(); return; }
        if (a === 'up') { rowSel = (rowSel - 1 + rows.length) % rows.length; sfx('ui_move'); paintRows(); } else if (a === 'down') { rowSel = (rowSel + 1) % rows.length; sfx('ui_move'); paintRows(); } else if (a === 'left' || a === 'right') { const r = rows[rowSel]; if (r.kind === 'sw') { setLook(r.key, r.idx + (a === 'left' ? -1 : 1)); sfx('ui_move'); } } else if (a === 'confirm') { if (rows[rowSel].kind === 'go' || rows[rowSel].kind === 'name') go(); else { rowSel = Math.min(rows.length - 1, rowSel + 1); paintRows(); } }
      },
    };
    input.focus();
  }

  // ---------- Continue ----------
  function toContinue() {
    stage = 'continue';
    clear(stageEl);
    let rsel = 0;
    const list = h('div', { class: 'lb-cont-list', testid: 'continue-list' });
    const rows = [];
    const slots = saveSlots();
    const order = [1, 2, 3, 0];
    function build() {
      clear(list); rows.length = 0;
      const sl = saveSlots();
      for (const slot of order) {
        const s = sl.find((x) => x.slot === slot);
        const empty = !s || s.empty;
        const m = empty ? null : s.meta;
        const loadB = h('button', { class: 'lb-btn small primary' + (empty ? ' is-disabled' : ''), testid: `cont-load-${slot}`, onClick: () => { rsel = rows.findIndex((r) => r.slot === slot); load(slot, empty); } }, 'Load');
        const delB = h('button', { class: 'lb-btn small danger' + (empty ? ' is-disabled' : ''), testid: `cont-del-${slot}`, onClick: () => del(slot, empty) }, 'Delete');
        const expB = h('button', { class: 'lb-btn small' + (empty ? ' is-disabled' : ''), testid: `cont-export-${slot}`, onClick: () => { if (!empty) exportDialog(slot); } }, 'Export');
        const card = h('div', { class: 'lb-card' + (empty ? ' empty' : ''), testid: `slot-card-${slot}`, onPointerenter: () => { const i = rows.findIndex((r) => r.slot === slot); if (i >= 0 && rsel !== i) { rsel = i; paint(); } } },
          h('div', { class: 'lb-card-slot' }, slot === 0 ? 'Auto' : String(slot)),
          h('div', { class: 'lb-card-info' }, empty ? h('b', { class: 'lb-muted' }, 'Empty slot') : [h('b', null, m.name), h('span', null, m.dateLabel), h('span', { class: 'lb-muted' }, `${fmtPlay(m.playSeconds)} played · ${fmtNum(m.money)} coins · `, h('span', { class: 'lb-mini', html: LANTERN_SVG }), ` ${m.lanterns}/6`)]),
          h('div', { class: 'lb-card-btns' }, loadB, expB, delB));
        list.appendChild(card);
        rows.push({ slot, empty, card, btns: [loadB, expB, delB], sub: 0 });
      }
      rsel = Math.max(0, Math.min(rows.length - 1, rsel));
      paint();
    }
    function paint() { rows.forEach((r, i) => { r.card.classList.toggle('is-sel', i === rsel); r.btns.forEach((b, k) => b.classList.toggle('subsel', i === rsel && k === r.sub)); }); }
    function load(slot, empty) { if (empty) { sfx('ui_error'); return; } sfx('ui_confirm'); done({ action: 'continue', slot }); }
    async function del(slot, empty) { if (empty) { sfx('ui_error'); return; } if (await confirm(`Delete ${slot === 0 ? 'the autosave' : 'slot ' + slot} for good?`, { yes: 'Delete', no: 'Keep' })) { deleteSlot(slot); build(); } }
    const imp = h('button', { class: 'lb-btn', testid: 'cont-import', onClick: async () => { if (await importDialog()) build(); } }, 'Import save');
    const back = h('button', { class: 'lb-btn', testid: 'cont-back', onClick: () => { sfx('ui_cancel'); toMenu(); } }, 'Back');
    stageEl.appendChild(h('div', { class: 'lb-panel lb-continue lb-pop', testid: 'continue' }, h('h2', { class: 'lb-modal-title' }, 'Continue your story'), list, h('div', { class: 'lb-ng-btns' }, back, imp)));
    build();
    void slots;
    sub = {
      key(a) {
        const r = rows[rsel];
        if (a === 'cancel') { sfx('ui_cancel'); toMenu(); } else if (a === 'up') { rsel = (rsel - 1 + rows.length) % rows.length; sfx('ui_move'); paint(); } else if (a === 'down') { rsel = (rsel + 1) % rows.length; sfx('ui_move'); paint(); } else if (a === 'left') { r.sub = (r.sub + 2) % 3; sfx('ui_move'); paint(); } else if (a === 'right') { r.sub = (r.sub + 1) % 3; sfx('ui_move'); paint(); } else if (a === 'confirm') { if (r.sub === 0) load(r.slot, r.empty); else if (r.sub === 1) { if (!r.empty) exportDialog(r.slot); else sfx('ui_error'); } else del(r.slot, r.empty); }
      },
    };
  }

  popInput = pushInput((a) => {
    if (stage === 'press') { toMenu(); return; }
    if (sub && sub.key) sub.key(a);
  });
  pressScreen();
  active = { promise, close: () => done({ action: 'quit' }) };
  return promise;
}
export { frag };
