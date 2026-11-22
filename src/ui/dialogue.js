// Dialogue box: say / ask / narrate / close.
import { Game } from '../core/game.js';
import { h, clear, pushInput, enterMode, sfx, blip, getNpc, badgeColor, unlockAudio } from './dom.js';

const SPEEDS = { slow: 22, normal: 42, fast: 90 };
let box = null;
let cur = null; // active line/ask session
let dlgRelease = null;
let dlgTimer = null;
let portraitSig = '';
let holdTime = 0;

export function buildDialogue(root) {
  const mk = () => ({});
  box = mk();
  box.wrap = h('div', { class: 'lb-dlg', hidden: true, testid: 'dialogue' });
  box.narrWrap = h('div', { class: 'lb-narrate', hidden: true, testid: 'narrate' });
  root.append(box.wrap, box.narrWrap);
}

function dlgClass(on) { if (box && box.wrap.parentNode) box.wrap.parentNode.classList.toggle('lb-in-dlg', on); }
function enter() {
  dlgClass(true);
  clearTimeout(dlgTimer);
  if (!dlgRelease) dlgRelease = enterMode('dialogue');
}
function leaveSoon() {
  clearTimeout(dlgTimer);
  dlgTimer = setTimeout(() => {
    if (cur) return;
    if (box) { box.wrap.hidden = true; box.narrWrap.hidden = true; box.box = null; box.pnode = null; portraitSig = ''; }
    dlgClass(false);
    if (dlgRelease) { dlgRelease(); dlgRelease = null; }
  }, 160);
}

function speakerInfo(speaker, nameOverride) {
  const s = Game.state;
  if (speaker === 'player') return { id: 'player', name: nameOverride || (s && s.meta && s.meta.name) || 'Kai', portrait: false, voice: 'soft' };
  if (speaker === '???') return { id: '???', name: nameOverride || '???', portrait: false, voice: 'soft' };
  if (!speaker || speaker === 'narrator') return { id: 'narrator', name: nameOverride || '', portrait: false, voice: 'narrator' };
  const npc = getNpc(speaker);
  return { id: speaker, name: nameOverride || (npc && npc.name) || String(speaker), portrait: !!(Game.portraits && Game.portraits.hasPortrait(speaker)), voice: (npc && npc.voice) || 'soft', npc };
}

function portraitNode(info, expr, side) {
  const wrap = h('div', { class: 'lb-dlg-portrait' + (side === 'right' ? ' right' : ''), testid: 'dialogue-portrait' });
  if (info.portrait) {
    const cvs = paintPortrait(info.id, expr);
    if (cvs) { wrap.appendChild(cvs); return wrap; }
  }
  wrap.classList.add('is-badge');
  wrap.appendChild(h('div', { class: 'lb-badge', style: { background: badgeColor(info.id) } }, (info.name || '?').charAt(0).toUpperCase()));
  return wrap;
}
function paintPortrait(id, expr) {
  let src = null;
  try { src = Game.portraits.getPortrait(id, expr || 'neutral'); } catch (_) { src = null; }
  if (!src) return null;
  const c = document.createElement('canvas');
  c.width = 256; c.height = 320;
  c.getContext('2d').drawImage(src, 0, 0, 256, 320);
  return c;
}

/** Prepare the box for a speaker; reuses portrait element when the speaker is unchanged (cross-fades expression). */
function setupBox(info, expr, side, withOptions) {
  const w = box.wrap;
  w.hidden = false;
  box.narrWrap.hidden = true;
  const sig = info.id + '|' + side;
  const hasP = info.portrait || (info.id !== 'narrator');
  if (!box.box || !w.contains(box.box)) {
    box.box = h('div', { class: 'lb-dlg-box lb-panel', testid: 'dialogue-box' });
    box.box.addEventListener('pointerdown', () => { unlockAudio(); onClick(); });
    box.nameTab = h('div', { class: 'lb-dlg-name', testid: 'dialogue-name' });
    box.text = h('div', { class: 'lb-dlg-text', testid: 'dialogue-text' });
    box.more = h('div', { class: 'lb-dlg-more' }, '▼');
    box.body = h('div', { class: 'lb-dlg-body' });
    box.box.append(box.nameTab, box.body, box.more);
    clear(w).appendChild(box.box);
    portraitSig = '';
  }
  box.nameTab.hidden = !info.name;
  box.nameTab.textContent = info.name || '';
  box.box.classList.toggle('has-portrait', hasP && info.portrait);
  box.box.classList.toggle('has-badge', hasP && !info.portrait && info.id !== 'narrator');
  box.box.classList.toggle('right', side === 'right');
  if (sig !== portraitSig || !box.pnode) {
    if (box.pnode) box.pnode.remove();
    box.pnode = info.id === 'narrator' ? null : portraitNode(info, expr, side);
    if (box.pnode) box.box.appendChild(box.pnode);
    portraitSig = sig;
    box.expr = expr || 'neutral';
  } else if (info.portrait && (expr || 'neutral') !== box.expr) {
    box.expr = expr || 'neutral';
    const fresh = paintPortrait(info.id, box.expr);
    if (fresh) {
      fresh.classList.add('fresh');
      box.pnode.appendChild(fresh);
      const olds = [...box.pnode.querySelectorAll('canvas')].slice(0, -1);
      setTimeout(() => olds.forEach((o) => o.remove()), 240);
    }
  }
  clear(box.body);
  return box.body;
}

function finishCur(value) {
  const c = cur;
  if (!c) return;
  cur = null;
  if (c.pop) c.pop();
  box.more && box.more.classList.remove('on');
  c.resolve(value);
  leaveSoon();
}

function onClick() {
  if (!cur) return;
  if (cur.kind === 'say') advance();
}
function advance() {
  if (!cur || cur.kind === 'ask') return;
  if (cur.shown < cur.total) { cur.shown = cur.total; renderText(); sfx('ui_move'); return; }
  sfx('ui_confirm');
  finishCur();
}

function renderText() {
  const c = cur;
  if (!c || !c.textEl) return;
  const n = Math.floor(c.shown);
  if (c.lastN === n) return;
  c.lastN = n;
  c.shownNode.data = c.text.slice(0, n);
  c.hidNode.data = c.text.slice(n);
  c.moreEl.classList.toggle('on', n >= c.total);
}

function startTyping(textEl, text, moreEl, voice) {
  const shownNode = document.createTextNode('');
  const hidNode = document.createTextNode(text);
  const hid = h('span', { class: 'hid' });
  hid.appendChild(hidNode);
  clear(textEl).append(shownNode, hid);
  cur.textEl = textEl; cur.text = text; cur.total = text.length; cur.shown = 0; cur.lastN = -1;
  cur.shownNode = shownNode; cur.hidNode = hidNode; cur.moreEl = moreEl; cur.voice = voice; cur.blipAt = 0;
  holdTime = -0.35;
  renderText();
}

function handlePress(a) {
  if (!cur) return;
  if (cur.kind === 'say') {
    if (a === 'confirm' || (cur.narrate && a === 'cancel')) advance(); // narration: B / X / Esc also continue
    return;
  }
  if (cur.kind === 'ask') {
    const n = cur.opts.length;
    const move = (d) => {
      let i = cur.sel;
      for (let k = 0; k < n; k++) { i = (i + d + n) % n; if (!cur.opts[i].disabled) break; }
      if (i !== cur.sel) { cur.sel = i; paintSel(); sfx('ui_move'); }
    };
    if (a === 'up' || a === 'left') move(-1);
    else if (a === 'down' || a === 'right') move(1);
    else if (a === 'confirm') choose(cur.sel);
  }
}
function paintSel() {
  if (!cur || !cur.optEls) return;
  cur.optEls.forEach((e, i) => e.classList.toggle('is-sel', i === cur.sel));
}
function choose(i) {
  if (!cur || cur.kind !== 'ask') return;
  const o = cur.opts[i];
  if (!o || o.disabled) { sfx('ui_error'); return; }
  sfx('ui_confirm');
  finishCur(i);
}

/** @returns {Promise<void>} */
export function say({ speaker, name, text, expr, side, voice } = {}) {
  if (cur) finishCur();
  enter();
  const info = speakerInfo(speaker, name);
  if (speaker === 'narrator' || !speaker) return narrate(String(text == null ? '' : text));
  const body = setupBox(info, expr, side === 'right' ? 'right' : 'left');
  const textEl = body.appendChild(h('div', { class: 'lb-dlg-text', testid: 'dialogue-text' }));
  return new Promise((resolve) => {
    cur = { kind: 'say', resolve };
    cur.pop = pushInput(handlePress);
    startTyping(textEl, String(text == null ? '' : text), box.more, voice || info.voice);
  });
}

export function narrate(text) {
  if (cur) finishCur();
  enter();
  box.wrap.hidden = true;
  box.narrWrap.hidden = false;
  const more = h('div', { class: 'lb-dlg-more' }, '▼');
  const t = h('div', { class: 'lb-narrate-text' });
  const nb = h('div', { class: 'lb-narrate-box', testid: 'narrate-box' }, t, more);
  nb.addEventListener('pointerdown', () => { unlockAudio(); onClick(); });
  clear(box.narrWrap).appendChild(nb);
  return new Promise((resolve) => {
    cur = { kind: 'say', resolve, narrate: true };
    cur.pop = pushInput(handlePress);
    startTyping(t, String(text == null ? '' : text), more, 'narrator');
  });
}

export function ask({ prompt, options = [], speaker, expr } = {}) {
  if (cur) finishCur();
  enter();
  const info = speakerInfo(speaker || 'narrator');
  const hasName = speaker && speaker !== 'narrator';
  const body = setupBox(hasName ? info : { id: 'narrator', name: '', portrait: false }, expr, 'left');
  if (prompt) body.appendChild(h('div', { class: 'lb-dlg-prompt' }, String(prompt)));
  const list = h('div', { class: 'lb-dlg-opts', testid: 'dialogue-options' });
  const opts = options.map((o) => (typeof o === 'string' ? { text: o } : o));
  const optEls = opts.map((o, i) => {
    const el = h('div', {
      class: 'lb-opt' + (o.disabled ? ' is-disabled' : ''), testid: 'dialogue-option',
      onPointerenter: () => { if (cur && cur.kind === 'ask' && !o.disabled && cur.sel !== i) { cur.sel = i; paintSel(); sfx('ui_move'); } },
      onPointerdown: (e) => { e.stopPropagation(); unlockAudio(); choose(i); },
    }, h('span', { class: 'lb-caret' }, '▶'), h('span', null, String(o.text)), o.hint ? h('span', { class: 'lb-hint' }, o.hint) : null);
    list.appendChild(el);
    return el;
  });
  body.appendChild(list);
  box.more.classList.remove('on');
  return new Promise((resolve) => {
    let sel = opts.findIndex((o) => !o.disabled);
    if (sel < 0) sel = 0;
    cur = { kind: 'ask', resolve, opts, optEls, sel };
    cur.pop = pushInput(handlePress);
    paintSel();
  });
}

export function close() {
  clearTimeout(dlgTimer);
  if (cur) { const c = cur; cur = null; if (c.pop) c.pop(); c.resolve(c.kind === 'ask' ? -1 : undefined); }
  if (box) { box.wrap.hidden = true; box.narrWrap.hidden = true; box.box = null; box.pnode = null; portraitSig = ''; }
  dlgClass(false);
  if (dlgRelease) { dlgRelease(); dlgRelease = null; }
}

export function updateDialogue(dt) {
  const c = cur;
  if (!c || c.kind !== 'say' || !c.textEl) return;
  const held = Game.input.held('confirm');
  if (held) holdTime += dt; else holdTime = 0;
  const fast = held && holdTime > 0.3;
  if (c.shown < c.total) {
    const sp = fast ? 400 : SPEEDS[(Game.settings && Game.settings.textSpeed)] || SPEEDS.normal;
    const before = Math.floor(c.shown);
    c.shown = Math.min(c.total, c.shown + sp * dt);
    const after = Math.floor(c.shown);
    for (let i = before; i < after; i++) {
      const ch = c.text[i];
      if (ch && ch.trim() && (i % 2 === 0)) blip(c.voice);
    }
    renderText();
  } else if (fast && holdTime > 0.55) {
    holdTime = 0.31;
    advance();
  }
}
export const isOpen = () => !!cur;
