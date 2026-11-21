/**
 * STUB — replaced by workstream 3 (Interface & Sound).
 * Writes a boot banner into #ui-root; every async call resolves immediately.
 */
let root = null;

export function init({ root: el } = {}) {
  root = el || null;
  if (!root) return;
  const d = document.createElement('div');
  d.textContent = 'Lanternbrook Days — foundation boot OK';
  d.style.cssText = 'position:absolute;left:0;right:0;top:12px;text-align:center;font:600 22px/1.2 system-ui,sans-serif;color:#fff4dc;text-shadow:0 2px 4px #000;pointer-events:none';
  root.appendChild(d);
}
export function update() {}
export function showTitle() { return Promise.resolve({ action: 'new', name: 'Kai' }); }
export function toast() {}
export function banner() { return Promise.resolve(); }
export function fade() { return Promise.resolve(); }
export function confirm() { return Promise.resolve(true); }
export function pickItem() { return Promise.resolve(null); }
export function setPrompt() {}
export function hudVisible() {}
export function letterbox() {}
export const dialogue = {
  say: () => Promise.resolve(),
  ask: () => Promise.resolve(0),
  narrate: () => Promise.resolve(),
  close() {},
};
export const menu = { open: () => Promise.resolve(), close() {} };
export const shop = { open: () => Promise.resolve() };
export const notes = { read: () => Promise.resolve() };
export function daySummary() { return Promise.resolve(); }
export const minigames = {
  fishing: () => Promise.resolve({ caught: true, perfect: false }),
  kneading: () => Promise.resolve({ score: 0.5 }),
};
