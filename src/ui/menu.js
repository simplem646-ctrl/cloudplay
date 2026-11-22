// Pause menu frame with seven tabs. menu.open(tab?) resolves when the menu closes.
import { h, clear, sfx, frag } from './dom.js';
import { openModal } from './widgets.js';
import { itemsTab, peopleTab, questsTab } from './menu_tabs.js';
import { mapTab, calendarTab, collectionTab } from './menu_tabs2.js';
import { settingsTab } from './menu_settings.js';

const ico = (body) => `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
export const TABS = [
  { id: 'items', label: 'Items', icon: ico('<path d="M6 12h20l-2 15H8Z"/><path d="M11 12a5 5 0 0 1 10 0"/>'), build: itemsTab },
  { id: 'people', label: 'People', icon: ico('<circle cx="16" cy="11" r="5"/><path d="M6 27c0-6 4-9 10-9s10 3 10 9"/>'), build: peopleTab },
  { id: 'quests', label: 'Quests', icon: ico('<path d="M8 5h13a3 3 0 0 1 3 3v19H11a3 3 0 0 1-3-3Z"/><path d="M12 11h8M12 16h8M12 21h5"/>'), build: questsTab },
  { id: 'map', label: 'Map', icon: ico('<path d="M4 8l8-3 8 3 8-3v19l-8 3-8-3-8 3Z"/><path d="M12 5v19M20 8v19"/>'), build: mapTab },
  { id: 'calendar', label: 'Calendar', icon: ico('<rect x="5" y="7" width="22" height="20" rx="3"/><path d="M5 13h22M11 4v6M21 4v6"/>'), build: calendarTab },
  { id: 'collection', label: 'Collection', icon: ico('<path d="M16 4l3.600 7.400 8 1.100-5.800 5.600 1.400 8L16 22.200 8.800 26l1.400-8L4.400 12.500l8-1.100Z"/>'), build: collectionTab },
  { id: 'settings', label: 'Settings', icon: ico('<circle cx="16" cy="16" r="4.500"/><path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l3 3M22 22l3 3M25 7l-3 3M10 22l-3 3"/>'), build: settingsTab },
];

let current = null;

export function openMenu(tab = 'items') {
  if (current) { current.switchTo(TABS.findIndex((t) => t.id === tab)); return current.promise; }
  let idx = Math.max(0, TABS.findIndex((t) => t.id === tab));
  let api = null;
  let resolveFn;
  const promise = new Promise((r) => { resolveFn = r; });
  const tabBtns = TABS.map((t, i) => h('button', { class: 'lb-tab', dataset: { tab: t.id }, testid: 'tab-' + t.id, onClick: () => switchTo(i) }, h('span', { class: 'lb-tab-ico', html: t.icon }), h('span', { class: 'lb-tab-label' }, t.label)));
  const body = h('div', { class: 'lb-menu-body', testid: 'menu-body' });
  const hint = h('span', { class: 'lb-menu-hint' });
  const foot = h('div', { class: 'lb-menu-foot' }, h('span', null, h('span', { class: 'lb-kbd' }, 'Q'), ' ', h('span', { class: 'lb-kbd' }, 'E'), ' tabs'), hint, h('span', null, h('span', { class: 'lb-kbd' }, 'X'), ' close'));
  const closeBtn = h('button', { class: 'lb-menu-close', testid: 'menu-close', title: 'Close', onClick: () => close() }, '✕');
  const panel = h('div', { class: 'lb-panel lb-menu lb-pop', testid: 'menu' }, h('div', { class: 'lb-menu-tabs' }, tabBtns, closeBtn), body, foot);
  const ctx = { close: () => close() };
  const modal = openModal(panel, {
    mode: 'menu', testid: 'menu-scrim',
    onPress: (a) => {
      if (a === 'tab_next') return switchTo((idx + 1) % TABS.length, 'ui_tab');
      if (a === 'tab_prev') return switchTo((idx + TABS.length - 1) % TABS.length, 'ui_tab');
      if (api && api.key && api.key(a)) return undefined;
      if (a === 'cancel' || a === 'menu') close();
      return undefined;
    },
    onClose: () => { clearInterval(timer); current = null; resolveFn(); },
  });
  function switchTo(i, snd) {
    if (i < 0) return;
    idx = i;
    if (api && api.destroy) api.destroy();
    clear(body);
    try { api = TABS[idx].build(ctx); } catch (err) { console.error('[ui] tab build failed', err); api = { el: h('div', { class: 'lb-muted' }, 'Something went wrong in this tab.'), key: () => false }; }
    body.appendChild(api.el);
    api.el.classList.add('lb-tabin');
    tabBtns.forEach((b, k) => b.classList.toggle('on', k === idx));
    hint.textContent = api.hint || '';
    if (snd) sfx(snd);
  }
  function close() { if (modal.closed()) return; sfx('ui_close'); modal.close(); }
  let last = performance.now();
  const timer = setInterval(() => { const n = performance.now(); const dt = (n - last) / 1000; last = n; if (api && api.tick) { try { api.tick(dt); } catch (_) { /* ignore */ } } }, 60);
  current = { promise, switchTo, close };
  switchTo(idx);
  sfx('ui_open');
  return promise;
}
export function closeMenu() { if (current) current.close(); }
export { frag };
