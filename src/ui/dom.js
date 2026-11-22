// Small DOM + input + mode helpers shared by all UI modules. No DOM access at import time.
import { Game } from '../core/game.js';

/** Create an element. props: class, style(obj|str), text, html, on<Event>, dataset, testid, any attribute. */
export function h(tag, props, ...kids) {
  const el = document.createElement(tag);
  if (props) {
    for (const [k, v] of Object.entries(props)) {
      if (v == null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'style') { if (typeof v === 'object') Object.assign(el.style, v); else el.style.cssText = v; }
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'testid') el.dataset.testid = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
      else el.setAttribute(k, v === true ? '' : v);
    }
  }
  append(el, kids);
  return el;
}
/** Null-safe replacement for el.append(...): skips null/false, flattens arrays, wraps text. */
export function append(el, ...kids) {
  for (const k of kids.flat(Infinity)) {
    if (k == null || k === false) continue;
    el.appendChild(k.nodeType ? k : document.createTextNode(String(k)));
  }
  return el;
}
export function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); return el; }
/** Parse an inline SVG/HTML string into a node. */
export function frag(markup) {
  const t = document.createElement('template');
  t.innerHTML = markup.trim();
  return t.content.firstChild;
}
export const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- audio (null-safe) ----
export function sfx(id, opts) {
  try { if (Game.audio && Game.audio.playSfx) Game.audio.playSfx(id, opts); } catch (_) { /* ignore */ }
}
let unlocked = false;
export function unlockAudio() {
  if (unlocked) return;
  unlocked = true;
  try { if (Game.audio && Game.audio.unlock) Game.audio.unlock(); } catch (_) { /* ignore */ }
}
export function blip(voice) {
  try { if (Game.audio && Game.audio.blip) Game.audio.blip(voice); } catch (_) { /* ignore */ }
}

// ---- input stack: the top handler receives every logical press while any modal is open ----
const stack = [];
let installed = false;
export function installInput() {
  if (installed) return;
  installed = true;
  Game.input.onPress((a) => {
    if (!stack.length) return false;
    unlockAudio();
    const fn = stack[stack.length - 1];
    try { fn(a); } catch (err) { console.error('[ui] input handler', err); }
    return true;
  });
}
export function pushInput(fn) {
  stack.push(fn);
  return () => { const i = stack.indexOf(fn); if (i >= 0) stack.splice(i, 1); };
}
export const inputDepth = () => stack.length;

/** Switch Game.mode for a modal; returns restore(). Keeps cutscene/dialogue modes untouched. */
export function enterMode(mode) {
  const prev = Game.mode;
  const keep = prev === 'cutscene' || prev === 'dialogue' || prev === mode;
  if (!keep) Game.setMode(mode);
  return () => { if (!keep && Game.mode === mode) Game.setMode(prev); };
}

// ---- data access (tolerates sparse / missing data) ----
export const dataList = (x) => (Array.isArray(x) ? x : x && typeof x === 'object' ? Object.values(x) : []);
export function getItem(id) {
  const d = Game.data;
  if (!d) return null;
  try { if (typeof d.getItem === 'function') { const r = d.getItem(id); if (r) return r; } } catch (_) { /* ignore */ }
  const it = d.items;
  if (!it) return null;
  return Array.isArray(it) ? it.find((i) => i && i.id === id) || null : it[id] || null;
}
export function getNpc(id) {
  const d = Game.data;
  if (!d) return null;
  try { if (typeof d.getNpc === 'function') { const r = d.getNpc(id); if (r) return r; } } catch (_) { /* ignore */ }
  const n = d.npcs;
  if (!n) return null;
  return Array.isArray(n) ? n.find((i) => i && i.id === id) || null : n[id] || null;
}
export const itemName = (id) => (getItem(id) || {}).name || '???';
export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');
export function hashHue(id) {
  let x = 7;
  for (const ch of String(id)) x = (x * 31 + ch.charCodeAt(0)) >>> 0;
  return x % 360;
}
export const badgeColor = (id) => `hsl(${hashHue(id)} 55% 62%)`;
/** Format seconds as 1h 05m */
export function fmtPlay(sec) {
  const m = Math.floor((sec || 0) / 60);
  return m >= 60 ? `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`;
}
export function bump(el, cls = 'lb-bump') {
  el.classList.remove(cls);
  void el.offsetWidth;
  el.classList.add(cls);
}
