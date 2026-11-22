// UI module (Game.ui) — DOM overlay: HUD, dialogue, menus, shop, mini-games, icons, touch. See ARCHITECTURE §8.
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { getCss } from './styles.js';
import { h, installInput, unlockAudio } from './dom.js';
import * as Hud from './hud.js';
import * as Dlg from './dialogue.js';
import * as W from './widgets.js';
import { openMenu, closeMenu } from './menu.js';
import { openShop } from './shop.js';
import { showTitle as _showTitle } from './title.js';
import * as MG from './minigames/index.js';
import { buildTouch, refreshTouch } from './touch.js';
import { itemIcon as _itemIcon } from './icons.js';

let rootEl = null;
let layer = null;
let styleEl = null;
let offToast = null;
let touchAcc = 0;

/** Mount the UI inside `root` (#ui-root). Calling again re-mounts. */
export function init({ root } = {}) {
  if (!root) return;
  if (rootEl) { rootEl.remove(); if (styleEl) styleEl.remove(); if (offToast) offToast(); }
  styleEl = document.createElement('style');
  styleEl.dataset.lb = 'ui';
  styleEl.textContent = getCss();
  document.head.appendChild(styleEl);
  rootEl = h('div', { class: 'lb-root', testid: 'ui-root' });
  root.appendChild(rootEl);
  layer = h('div', { class: 'lb-layer', testid: 'ui-layer' });
  Hud.buildHud(rootEl);
  Dlg.buildDialogue(rootEl);
  buildTouch(rootEl);
  rootEl.appendChild(layer);
  W.setLayer(layer);
  installInput();
  rootEl.addEventListener('pointerdown', unlockAudio, true);
  offToast = Game.bus.on(EVT.UI_TOAST, (p) => { if (p) Hud.toast(p.text, { icon: p.icon, kind: p.kind }); });
}

/** Per-frame tick; the HUD itself refreshes its text at ~10 Hz. */
export function update(dt = 0.016) {
  if (!rootEl) return;
  Hud.updateHud(dt);
  Dlg.updateDialogue(dt);
  MG.updateMinigames(dt);
  touchAcc += dt;
  if (touchAcc > 0.5) { touchAcc = 0; refreshTouch(); }
}

/** @returns {Promise<{action:'new'|'continue'|'quit', slot?:number, name?:string, look?:object}>} */
export function showTitle() { return _showTitle(layer); }
export function toast(text, opts) { Hud.toast(text, opts); }
export function banner(title, sub, ms) { return Hud.banner(title, sub, ms); }
export function fade(toAlpha, ms, color) { return Hud.fade(toAlpha, ms, color); }
export function confirm(question, opts) { return W.confirm(question, opts); }
export function pickItem(opts) { return W.pickItem(opts); }
export function setPrompt(text) { Hud.setPrompt(text); }
export function hudVisible(v) { Hud.hudVisible(v); }
export function letterbox(on) { Hud.letterbox(on); }
export const dialogue = { say: Dlg.say, ask: Dlg.ask, narrate: Dlg.narrate, close: Dlg.close };
export const menu = { open: openMenu, close: closeMenu };
export const shop = { open: openShop };
export const notes = { read: W.readNotes };
export function daySummary(opts) { return W.daySummary(opts); }
export const minigames = { fishing: MG.fishing, kneading: MG.kneading };
/** Cached canvas icon for an item def. */
export function itemIcon(def, size = 48) { return _itemIcon(def, size); }
/** Re-evaluate touch overlay visibility (after settings changed). */
export function setTouch() { refreshTouch(); }
