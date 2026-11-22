/** Small shared helpers for systems modules. Everything is defensive: Game.ui/world/data/audio may be missing. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { dayNumber, seasonName, weekdayName, deepClone } from '../core/util.js';

/** Debug/test switches. skipFades makes fade/wait script ops instant. `faded` = a script faded the screen out (set by the fade op; S2 area changes then skip their own fade). */
export const opts = { skipFades: false, faded: false };

export const D = () => Game.data || {};
export const S = () => Game.state;
export const dayNum = () => (Game.state ? dayNumber(Game.state.time) : 0);
export const curSeason = () => (Game.state ? seasonName(Game.state.time.season) : 'spring');
export const curWeekday = () => (Game.state ? weekdayName(Game.state.time.day) : 'mon');
export const cap = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);
export const money = (n) => `${Math.round(n).toLocaleString('en-US')} c`;
export const clone = deepClone;

const warned = new Set();
export function warnOnce(key, ...msg) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn('[systems]', ...msg);
}
export function _resetWarnings() {
  warned.clear();
}

export function toast(text, o = {}) {
  const ui = Game.ui;
  if (ui && typeof ui.toast === 'function') ui.toast(text, o);
  else Game.bus.emit(EVT.UI_TOAST, { text, icon: o.icon, kind: o.kind || 'info' });
}
export const sfx = (id, o) => Game.audio?.playSfx?.(id, o);

export function itemDef(id) {
  const d = D();
  return (typeof d.getItem === 'function' ? d.getItem(id) : d.items?.[id]) || null;
}
export const itemName = (id) => itemDef(id)?.name || String(id).replace(/_/g, ' ');
export function npcDef(id) {
  const d = D();
  return (typeof d.getNpc === 'function' ? d.getNpc(id) : d.npcs?.[id]) || null;
}
export const npcName = (id) => npcDef(id)?.name || cap(String(id).replace(/_/g, ' '));
export const npcShort = (id) => npcDef(id)?.short || npcDef(id)?.name?.split(' ')[0] || cap(String(id).replace(/_/g, ' '));
export const playerName = () => Game.state?.meta?.name || 'Kai';

// ---- flags ----
export const getFlag = (name) => Game.state?.flags?.[name];
export function setFlag(name, value = true) {
  if (!Game.state) return;
  Game.state.flags[name] = value;
  Game.bus.emit(EVT.FLAG_SET, { name, value });
}
export function clearFlag(name) {
  if (!Game.state) return;
  delete Game.state.flags[name];
  Game.bus.emit(EVT.FLAG_SET, { name, value: false });
}
export function incFlag(name, by = 1) {
  const v = (Number(getFlag(name)) || 0) + by;
  setFlag(name, v);
  return v;
}

/** Subscription holder: re-calling clear() makes service init() idempotent. */
export function subs() {
  let offs = [];
  return {
    on(evt, fn) {
      offs.push(Game.bus.on(evt, fn));
    },
    clear() {
      offs.forEach((o) => o());
      offs = [];
    },
  };
}

export const sleepMs = (ms) => new Promise((r) => setTimeout(r, ms));

/** 'text' | ['text','expr'] -> {text, expr} */
export function parseLine(line) {
  if (Array.isArray(line)) return { text: String(line[0] ?? ''), expr: line[1] };
  if (line && typeof line === 'object') return { text: String(line.text ?? ''), expr: line.expr };
  return { text: String(line ?? ''), expr: undefined };
}
