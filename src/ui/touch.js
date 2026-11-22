// Touch overlay: virtual stick (left), A / B / Run buttons (right), Menu button (top-right under the coins).
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { h, unlockAudio } from './dom.js';

let el = null;
let offs = [];

function wantVisible() {
  const pref = (Game.settings && Game.settings.touchControls) || 'auto';
  if (pref === 'off') return false;
  let coarse = false;
  try { coarse = typeof matchMedia === 'function' && matchMedia('(pointer: coarse)').matches; } catch (_) { coarse = false; }
  const on = pref === 'on' || coarse;
  return on && Game.mode === 'field' && !!Game.state;
}

export function refreshTouch() { if (el) el.classList.toggle('on', wantVisible()); }

export function buildTouch(root) {
  destroyTouch();
  const knob = h('i', { class: 'lb-knob' });
  const base = h('div', { class: 'lb-stick', testid: 'touch-stick' }, knob);
  let pid = null;
  const move = (e) => {
    const r = base.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2, rad = r.width / 2;
    let dx = (e.clientX - cx) / rad, dy = (e.clientY - cy) / rad;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    knob.style.transform = `translate(${dx * 55}%, ${dy * 55}%)`;
    Game.input.setVirtualAxis(Math.abs(dx) < 0.12 ? 0 : dx, Math.abs(dy) < 0.12 ? 0 : dy);
  };
  base.addEventListener('pointerdown', (e) => { unlockAudio(); pid = e.pointerId; base.setPointerCapture(pid); move(e); e.preventDefault(); });
  base.addEventListener('pointermove', (e) => { if (e.pointerId === pid) move(e); });
  const release = (e) => { if (e.pointerId !== pid) return; pid = null; knob.style.transform = ''; Game.input.setVirtualAxis(0, 0); };
  base.addEventListener('pointerup', release);
  base.addEventListener('pointercancel', release);
  const hold = (label, action, cls) => {
    const b = h('button', { class: 'lb-tbtn ' + cls, testid: 'touch-' + action }, label);
    b.addEventListener('pointerdown', (e) => { unlockAudio(); b.setPointerCapture(e.pointerId); Game.input.setVirtual(action, true); b.classList.add('down'); e.preventDefault(); });
    const up = () => { Game.input.setVirtual(action, false); b.classList.remove('down'); };
    b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up);
    return b;
  };
  const menu = h('button', { class: 'lb-tbtn menu', testid: 'touch-menu', onPointerdown: (e) => { e.preventDefault(); unlockAudio(); Game.input.setVirtual('menu', true); Game.input.setVirtual('menu', false); } }, '☰');
  el = h('div', { class: 'lb-touch', testid: 'touch' }, base, h('div', { class: 'lb-tbtns' }, hold('Run', 'run', 'run'), hold('B', 'cancel', 'b'), hold('A', 'confirm', 'a')), menu);
  root.appendChild(el);
  offs = [Game.bus.on(EVT.MODE_CHANGE, refreshTouch), Game.bus.on(EVT.UI_SETTING, refreshTouch), Game.bus.on(EVT.GAME_NEW, refreshTouch), Game.bus.on(EVT.GAME_LOADED, refreshTouch)];
  refreshTouch();
}

export function destroyTouch() { offs.forEach((o) => o()); offs = []; if (el) { el.remove(); el = null; } }
