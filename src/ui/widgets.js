// Shared widgets: modal host, slot grid, confirm, pickItem, notes reader, day summary, hearts.
import { Game } from '../core/game.js';
import { h, frag, pushInput, enterMode, sfx, unlockAudio, getItem, getNpc, dataList, append } from './dom.js';
import { itemIcon } from './icons.js';
import { HEART_SVG } from './svgs.js';
import { paginate, heartsFor, fmtNum } from './helpers.js';

let layer = null;
export const setLayer = (el) => { layer = el; };
export const getLayer = () => layer;

/**
 * Open a modal in the UI layer. Returns { el, scrim, close(value), handler(fn) }.
 * opts: mode (Game.mode to enter), light (lighter scrim), onPress(action) called for logical presses, onClose().
 */
export function openModal(content, opts = {}) {
  const scrim = h('div', { class: 'lb-scrim' + (opts.light ? ' light' : ''), testid: opts.testid || 'modal' });
  scrim.appendChild(content);
  layer.appendChild(scrim);
  const restore = opts.mode ? enterMode(opts.mode) : () => {};
  let closed = false;
  const m = { el: content, scrim, onPress: opts.onPress || (() => {}), closed: () => closed };
  const pop = pushInput((a) => m.onPress(a));
  m.close = () => {
    if (closed) return;
    closed = true;
    pop();
    restore();
    scrim.remove();
    if (opts.onClose) opts.onClose();
  };
  return m;
}

/** Vertical/horizontal menu navigation helper: returns handler(action)->bool for a list of focusable rows. */
export function navList(count, get, set, { cols = 1, wrap = true } = {}) {
  return (a) => {
    const i = get();
    let n = i;
    if (a === 'up') n = cols > 1 ? i - cols : i - 1;
    else if (a === 'down') n = cols > 1 ? i + cols : i + 1;
    else if (a === 'left' && cols > 1) n = i - 1;
    else if (a === 'right' && cols > 1) n = i + 1;
    else return false;
    const c = count();
    if (wrap && cols === 1) n = (n + c) % c;
    n = Math.max(0, Math.min(c - 1, n));
    if (n !== i) { set(n); sfx('ui_move'); }
    return true;
  };
}

// ---- slot grid ----
/**
 * Inventory-style grid. slots: array of {id,qty}|null. opts: cols, onSelect(i), onActivate(i), dim(slot,i)->bool.
 * Returns { el, sel, setSel(i), key(action), refresh(slots) }.
 */
export function slotGrid(slots, opts = {}) {
  const cols = opts.cols || 6;
  const el = h('div', { class: 'lb-slotgrid', style: { gridTemplateColumns: `repeat(${cols}, 1fr)` }, testid: 'slotgrid' });
  const g = { el, sel: opts.sel || 0, slots, cells: [] };
  g.build = () => {
    el.textContent = '';
    g.cells = g.slots.map((s, i) => {
      const def = s ? getItem(s.id) : null;
      const cell = h('div', {
        class: 'lb-slot' + (s ? '' : ' empty') + (s && opts.dim && opts.dim(s, i) ? ' dim' : ''), dataset: { i },
        onPointerenter: () => { if (g.sel !== i) { g.setSel(i); sfx('ui_move'); } },
        onClick: () => { unlockAudio(); g.setSel(i); if (opts.onActivate) opts.onActivate(i); },
      });
      if (s) {
        const box = h('div', { class: 'lb-slot-icon' });
        const cv = itemIcon(def || { icon: { shape: 'bag' } }, 56);
        cv.className = 'lb-icon-cvs'; cv.style.width = ''; cv.style.height = '';
        box.appendChild(cv);
        append(cell, box, s.qty > 1 ? h('span', { class: 'lb-qty' }, String(s.qty)) : null, def && def.key ? h('span', { class: 'lb-keytag' }, '★') : null);
      }
      el.appendChild(cell);
      return cell;
    });
    g.paint();
  };
  g.paint = () => g.cells.forEach((c, i) => c.classList.toggle('is-sel', i === g.sel));
  g.setSel = (i) => { g.sel = Math.max(0, Math.min(g.slots.length - 1, i)); g.paint(); if (opts.onSelect) opts.onSelect(g.sel); };
  g.key = (a) => navList(() => g.slots.length, () => g.sel, (n) => g.setSel(n), { cols, wrap: false })(a);
  g.refresh = (slotsNew) => { g.slots = slotsNew; g.build(); if (opts.onSelect) opts.onSelect(g.sel); };
  g.build();
  return g;
}

export function heartsRow(aff, { size = '1.1em', gap = '.1em' } = {}) {
  const { full, half } = heartsFor(aff);
  const row = h('div', { class: 'lb-hearts', style: { display: 'flex', gap }, testid: 'hearts', dataset: { hearts: String(full) } });
  for (let i = 0; i < 10; i++) {
    const n = frag(HEART_SVG(i < full ? '#e0607e' : '#e8d8c0'));
    n.style.width = size; n.style.height = size;
    if (i === full && half) n.style.background = 'linear-gradient(90deg,#e0607e 50%,transparent 50%)';
    if (i === full && half) n.style.borderRadius = '50%';
    row.appendChild(n);
  }
  return row;
}

// ---- confirm ----
/** @returns {Promise<boolean>} */
export function confirm(question, { yes = 'Yes', no = 'No' } = {}) {
  return new Promise((resolve) => {
    let sel = 0;
    const btns = [yes, no].map((label, i) => h('button', { class: 'lb-btn' + (i === 0 ? ' primary' : ''), testid: i === 0 ? 'confirm-yes' : 'confirm-no', onClick: () => finish(i === 0), onPointerenter: () => { sel = i; paint(); } }, label));
    const box = h('div', { class: 'lb-panel lb-confirm lb-pop', testid: 'confirm' }, h('div', { class: 'lb-confirm-q' }, String(question)), h('div', { class: 'lb-confirm-btns' }, btns));
    const paint = () => btns.forEach((b, i) => b.classList.toggle('is-sel', i === sel));
    const m = openModal(box, {
      mode: Game.mode === 'title' ? null : 'menu', light: true,
      onPress: (a) => {
        if (a === 'left' || a === 'right' || a === 'up' || a === 'down') { sel = 1 - sel; paint(); sfx('ui_move'); } else if (a === 'confirm') finish(sel === 0);
        else if (a === 'cancel' || a === 'menu') finish(false);
      },
    });
    function finish(v) { if (m.closed()) return; sfx(v ? 'ui_confirm' : 'ui_cancel'); m.close(); resolve(v); }
    paint();
  });
}

// ---- pickItem ----
/** @returns {Promise<number|null>} inventory slot index */
export function pickItem({ prompt = 'Choose an item', filter } = {}) {
  return new Promise((resolve) => {
    const slots = (Game.state && Game.state.inventory && Game.state.inventory.slots) || [];
    const ok = (s) => !!s && (!filter || !!filter(s));
    const nameEl = h('div', { class: 'lb-pick-name' }, ' ');
    const descEl = h('div', { class: 'lb-pick-desc lb-muted' }, ' ');
    const info = (i) => { const s = slots[i]; const d = s && getItem(s.id); nameEl.textContent = s ? (d ? d.name : '???') : 'Empty'; descEl.textContent = s ? (ok(s) ? (d && d.desc) || '' : 'That won\'t do.') : ''; };
    const first = Math.max(0, slots.findIndex(ok));
    const grid = slotGrid(slots, { cols: 6, sel: first, dim: (s) => !ok(s), onSelect: info, onActivate: (i) => pick(i) });
    const box = h('div', { class: 'lb-panel lb-pick lb-pop', testid: 'pick' }, h('h2', { class: 'lb-modal-title' }, prompt), grid.el, h('div', { class: 'lb-pick-foot' }, nameEl, descEl, h('div', { class: 'lb-hint-row' }, h('span', { class: 'lb-kbd' }, 'Space'), ' choose  ', h('span', { class: 'lb-kbd' }, 'X'), ' cancel')));
    const m = openModal(box, {
      mode: 'menu',
      onPress: (a) => {
        if (grid.key(a)) return;
        if (a === 'confirm') pick(grid.sel);
        else if (a === 'cancel' || a === 'menu') { sfx('ui_cancel'); m.close(); resolve(null); }
      },
    });
    function pick(i) {
      if (!ok(slots[i])) { sfx('ui_error'); return; }
      sfx('ui_confirm'); m.close(); resolve(i);
    }
    info(grid.sel);
    sfx('ui_open');
  });
}

// ---- notes reader ----
/** @returns {Promise<void>} */
export function readNotes({ title = '', lines = [] } = {}) {
  return new Promise((resolve) => {
    const pages = paginate(lines, 300);
    let p = 0;
    const body = h('div', { class: 'lb-notes-body', testid: 'notes-body' });
    const pageNum = h('div', { class: 'lb-notes-num' });
    const next = h('div', { class: 'lb-notes-next' }, '▶');
    const paper = h('div', { class: 'lb-paper lb-pop', testid: 'notes', onClick: () => go(1) }, h('div', { class: 'lb-notes-title' }, title), h('div', { class: 'lb-notes-rule' }), body, pageNum, next);
    const render = (dir) => {
      body.textContent = '';
      for (const para of pages[p]) body.appendChild(h('p', null, para));
      pageNum.textContent = `${p + 1} / ${pages.length}`;
      next.textContent = p < pages.length - 1 ? '▶' : '✓';
      if (dir) { body.classList.remove('turn-fwd', 'turn-back'); void body.offsetWidth; body.classList.add(dir > 0 ? 'turn-fwd' : 'turn-back'); }
    };
    const m = openModal(paper, {
      mode: 'menu',
      onPress: (a) => {
        if (a === 'confirm' || a === 'right' || a === 'down') go(1);
        else if (a === 'left' || a === 'up') go(-1);
        else if (a === 'cancel' || a === 'menu') end();
      },
    });
    function go(d) {
      if (d > 0 && p >= pages.length - 1) { end(); return; }
      const n = Math.max(0, Math.min(pages.length - 1, p + d));
      if (n === p) return;
      p = n; sfx('page_turn'); render(d);
    }
    function end() { sfx('ui_close'); m.close(); resolve(); }
    render(0);
    sfx('ui_open');
  });
}

// ---- day summary ----
/** @returns {Promise<void>} */
export function daySummary({ earned = 0, spent = 0, fishCaught = 0, hearts = [], note } = {}) {
  return new Promise((resolve) => {
    const rows = [
      ['Coins earned', earned, '+', 'coin'],
      ['Coins spent', spent, '-', 'coin'],
      ['Fish caught', fishCaught, '', 'fish'],
    ];
    const list = h('div', { class: 'lb-sum-list' });
    const valEls = [];
    const lines = [];
    for (const [label, value, sign] of rows) {
      const v = h('b', { class: 'lb-sum-val' }, '0');
      valEls.push([v, value, sign]);
      lines.push(h('div', { class: 'lb-sum-row' }, h('span', null, label), v));
    }
    for (const x of hearts || []) {
      const n = getNpc(x.npc);
      lines.push(h('div', { class: 'lb-sum-row heart' }, h('span', null, (n && n.name) || x.npc), h('b', { class: 'lb-sum-val' }, (x.delta >= 0 ? '+' : '') + x.delta + ' ♥')));
    }
    lines.forEach((l, i) => { l.style.animationDelay = `${0.25 + i * 0.28}s`; list.appendChild(l); });
    const btn = h('button', { class: 'lb-btn primary is-sel', testid: 'summary-sleep', onClick: () => end() }, 'Sleep tight');
    const stars = h('div', { class: 'lb-stars' });
    for (let i = 0; i < 26; i++) stars.appendChild(h('i', { style: { left: ((i * 37) % 100) + '%', top: ((i * 53) % 100) + '%', animationDelay: ((i % 7) * 0.4) + 's' } }));
    const card = h('div', { class: 'lb-panel dark lb-summary lb-pop', testid: 'summary' }, stars, h('h2', { class: 'lb-modal-title' }, 'The day is done'), list, note ? h('div', { class: 'lb-sum-note' }, note) : null, btn);
    const m = openModal(card, {
      mode: 'menu',
      onPress: (a) => { if (a === 'confirm' || a === 'cancel') end(); },
    });
    let t = 0;
    const iv = setInterval(() => {
      t += 0.04;
      for (const [el, val, sign] of valEls) { const k = Math.min(1, Math.max(0, (t - 0.3) / 1.2)); el.textContent = (val ? sign : '') + fmtNum(val * (1 - Math.pow(1 - k, 3))); }
      if (t > 2) clearInterval(iv);
    }, 40);
    function end() { clearInterval(iv); sfx('ui_confirm'); m.close(); resolve(); }
    sfx('ui_open');
  });
}
export { dataList };
