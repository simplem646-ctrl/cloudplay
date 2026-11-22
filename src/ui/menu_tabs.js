// Pause-menu tabs, part 1: items, people, quests.
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { NPC_IDS } from '../core/registry.js';
import { h, clear, sfx, getItem, getNpc, dataList, cap, badgeColor, bump, append } from './dom.js';
import { itemIcon } from './icons.js';
import { slotGrid, heartsRow, navList } from './widgets.js';
import { sellPrice, isUsable, fmtNum } from './helpers.js';
import { HEART_SVG, LANTERN_SVG, CAKE_SVG } from './svgs.js';
import { frag } from './dom.js';

const state = () => Game.state || { inventory: { slots: [] }, rel: {}, quests: { active: {}, done: {} }, story: { lanterns: 0 } };

// ---------------------------------------------------------------- items
export function itemsTab() {
  const slots = () => (state().inventory && state().inventory.slots) || [];
  const detail = h('div', { class: 'lb-detail', testid: 'item-detail' });
  const sig = () => JSON.stringify(slots());
  let lastSig = sig();
  const grid = slotGrid(slots(), { cols: 6, onSelect: () => paintDetail(), onActivate: (i) => { if (grid.sel === i) use(); } });
  function use() {
    const s = slots()[grid.sel];
    const def = s && getItem(s.id);
    if (!s || !isUsable(def)) { sfx('ui_error'); return; }
    sfx('ui_confirm');
    Game.bus.emit(EVT.UI_USE_ITEM, { slot: grid.sel });
  }
  function paintDetail() {
    clear(detail);
    const s = slots()[grid.sel];
    const def = s && getItem(s.id);
    if (!s) { append(detail, h('div', { class: 'lb-detail-empty lb-muted' }, 'An empty pocket.')); return; }
    const icon = itemIcon(def || { icon: { shape: 'bag' } }, 64);
    icon.className = 'lb-icon-cvs';
    const price = sellPrice(def);
    const usable = isUsable(def);
    append(detail, 
      h('div', { class: 'lb-detail-head' }, h('div', { class: 'lb-detail-icon' }, icon), h('div', null, h('h3', { class: 'lb-detail-name', testid: 'item-name' }, def ? def.name : '???'),
        h('div', { class: 'lb-chips' }, h('span', { class: 'lb-chip' }, cap((def && def.category) || 'misc')), def && def.key ? h('span', { class: 'lb-chip key' }, '★ Key item') : null, s.qty > 1 ? h('span', { class: 'lb-chip' }, '×' + s.qty) : null))),
      h('p', { class: 'lb-detail-desc' }, (def && def.desc) || 'Hard to say what this is.'),
      h('div', { class: 'lb-detail-meta' }, price ? h('span', null, 'Sells for ', h('b', null, fmtNum(price)), ' coins') : h('span', { class: 'lb-muted' }, def && def.key ? 'Not for sale' : 'Cannot be sold'),
        def && def.energy ? h('span', null, 'Restores ', h('b', null, '+' + def.energy), ' energy') : null),
      usable ? h('button', { class: 'lb-btn primary lb-use', testid: 'item-use', onClick: use }, 'Use', h('span', { class: 'lb-kbd' }, 'Space')) : null,
    );
  }
  const el = h('div', { class: 'lb-tab-items' }, h('div', { class: 'lb-items-left' }, grid.el, h('div', { class: 'lb-cap-note lb-muted' }, `Pockets: ${slots().filter(Boolean).length} / ${slots().length}`)), detail);
  paintDetail();
  return {
    el, hint: 'Space: use',
    key(a) { if (grid.key(a)) return true; if (a === 'confirm') { use(); return true; } return false; },
    tick() { const s = sig(); if (s !== lastSig) { lastSig = s; grid.refresh(slots()); } },
  };
}

// ---------------------------------------------------------------- people
export function portraitThumb(id, name, silhouette, big) {
  const wrap = h('div', { class: 'lb-pthumb' + (big ? ' big' : '') });
  let src = null;
  if (Game.portraits && Game.portraits.hasPortrait(id)) { try { src = Game.portraits.getPortrait(id, 'neutral'); } catch (_) { src = null; } }
  if (src) {
    const c = document.createElement('canvas');
    c.width = big ? 256 : 96; c.height = big ? 320 : 120;
    c.getContext('2d').drawImage(src, 0, 0, c.width, c.height);
    c.className = 'lb-icon-cvs' + (silhouette ? ' sil' : '');
    wrap.appendChild(c);
  } else {
    wrap.appendChild(h('div', { class: 'lb-badge flat' + (silhouette ? ' sil' : ''), style: { background: silhouette ? '#b9a58d' : badgeColor(id) } }, silhouette ? '?' : (name || '?').charAt(0).toUpperCase()));
  }
  return wrap;
}

export function peopleTab() {
  const ids = NPC_IDS.slice();
  const rel = (id) => (state().rel && state().rel[id]) || {};
  const met = (id) => !!rel(id).met;
  let sel = 0;
  const list = h('div', { class: 'lb-plist lb-scroll', testid: 'people-list' });
  const detail = h('div', { class: 'lb-detail lb-pdetail', testid: 'people-detail' });
  const rows = ids.map((id, i) => {
    const n = getNpc(id);
    const r = h('div', { class: 'lb-prow', dataset: { id }, onClick: () => { setSel(i); }, onPointerenter: () => { if (sel !== i) setSel(i); } },
      portraitThumb(id, n && n.name, !met(id)), h('div', { class: 'lb-prow-name' }, met(id) && n ? n.name : '???'),
      met(id) && rel(id).status === 'dating' ? h('span', { class: 'lb-dating', html: HEART_SVG(), title: 'Dating' }) : null);
    list.appendChild(r);
    return r;
  });
  function paintDetail() {
    clear(detail);
    const id = ids[sel];
    const n = getNpc(id);
    const r = rel(id);
    const isMet = met(id);
    const bday = n && n.birthday ? `${cap(n.birthday.season)} ${n.birthday.day}` : '—';
    append(detail, 
      h('div', { class: 'lb-pbig' }, portraitThumb(id, n && n.name, !isMet, true)),
      h('div', { class: 'lb-pinfo' },
        h('h3', { class: 'lb-detail-name', testid: 'people-name' }, isMet && n ? n.name : '???'),
        isMet ? h('div', { class: 'lb-chips' }, h('span', { class: 'lb-chip' }, (n && n.role) || 'Townsperson'), r.status === 'dating' ? h('span', { class: 'lb-chip dating' }, '♥ Dating') : null) : h('div', { class: 'lb-muted' }, 'You have not met this person yet.'),
        isMet ? heartsRow(r.aff || 0, { size: '1.25em' }) : null,
        isMet ? h('div', { class: 'lb-detail-meta' }, h('span', { html: '' }, h('span', { class: 'lb-mini', html: CAKE_SVG }), ' Birthday: ', h('b', null, bday))) : null,
        isMet ? h('p', { class: 'lb-detail-desc' }, (n && n.bio) || '') : null),
    );
  }
  function setSel(i) {
    sel = Math.max(0, Math.min(ids.length - 1, i));
    rows.forEach((r, k) => r.classList.toggle('is-sel', k === sel));
    rows[sel].scrollIntoView({ block: 'nearest' });
    paintDetail();
  }
  const nav = navList(() => ids.length, () => sel, setSel, { wrap: false });
  const el = h('div', { class: 'lb-tab-people' }, list, detail);
  setSel(0);
  return { el, hint: '↑↓: browse', key: (a) => nav(a) || (a === 'left' || a === 'right') };
}

// ---------------------------------------------------------------- quests
export function questsTab() {
  const defs = {};
  for (const d of dataList(Game.data && Game.data.quests)) if (d && d.id) defs[d.id] = d;
  const st = () => state().quests || { active: {}, done: {} };
  const entries = () => [
    ...Object.keys(st().active || {}).map((id) => ({ id, done: false })),
    ...Object.keys(st().done || {}).map((id) => ({ id, done: true })),
  ];
  let sel = 0;
  const trackedId = () => st().tracked || null; // single source of truth: Systems toggles state.quests.tracked on ui:trackQuest
  const list = h('div', { class: 'lb-qlist lb-scroll', testid: 'quest-list' });
  const detail = h('div', { class: 'lb-detail lb-qdetail', testid: 'quest-detail' });
  const lanterns = () => (state().story && state().story.lanterns) || 0;
  const lbar = h('div', { class: 'lb-lanterns', testid: 'lanterns' });
  function paintLanterns() {
    clear(lbar);
    const n = lanterns();
    append(lbar, h('b', null, `Lanterns restored ${n}/6`));
    const row = h('span', { class: 'lb-lrow' });
    for (let i = 0; i < 6; i++) row.appendChild(h('span', { class: 'lb-lan' + (i < n ? ' lit' : ''), html: LANTERN_SVG }));
    lbar.appendChild(row);
  }
  function paintList() {
    clear(list);
    const es = entries();
    if (!es.length) list.appendChild(h('div', { class: 'lb-muted lb-qempty' }, 'No quests yet. Talk to the townsfolk!'));
    let shownActive = false, shownDone = false;
    es.forEach((e, i) => {
      if (!e.done && !shownActive) { list.appendChild(h('div', { class: 'lb-qhead' }, 'Active')); shownActive = true; }
      if (e.done && !shownDone) { list.appendChild(h('div', { class: 'lb-qhead' }, 'Completed')); shownDone = true; }
      const def = defs[e.id] || {};
      list.appendChild(h('div', { class: 'lb-qrow' + (e.done ? ' done' : '') + (i === sel ? ' is-sel' : ''), onClick: () => setSel(i), onPointerenter: () => { if (sel !== i) setSel(i); } },
        def.kind === 'main' ? h('span', { class: 'lb-mini', html: LANTERN_SVG }) : h('span', { class: 'lb-dotq' }, e.done ? '✓' : '•'),
        h('span', { class: 'lb-qname' }, def.title || e.id), trackedId() === e.id ? h('span', { class: 'lb-tracked' }, 'tracked') : null));
    });
  }
  function paintDetail() {
    clear(detail);
    const es = entries();
    const e = es[sel];
    if (!e) { detail.appendChild(h('div', { class: 'lb-detail-empty lb-muted' }, 'Nothing selected.')); return; }
    const def = defs[e.id] || {};
    const a = (st().active || {})[e.id];
    const stage = !e.done && def.stages ? def.stages[(a && a.stage) || 0] : null;
    const reward = def.reward || {};
    const bits = [];
    if (reward.money) bits.push(`${fmtNum(reward.money)} coins`);
    for (const it of reward.items || []) { const d = getItem(it.id); bits.push(`${it.qty > 1 ? it.qty + '× ' : ''}${d ? d.name : '???'}`); }
    append(detail, 
      h('h3', { class: 'lb-detail-name' }, def.title || e.id),
      h('div', { class: 'lb-chips' }, h('span', { class: 'lb-chip' + (def.kind === 'main' ? ' key' : '') }, def.kind === 'main' ? 'Main story' : cap(def.kind || 'quest')), e.done ? h('span', { class: 'lb-chip done' }, '✓ Done') : null),
      h('p', { class: 'lb-detail-desc' }, def.desc || ''),
      stage ? h('div', { class: 'lb-stage' }, h('b', null, 'Now: '), stage.text) : null,
      bits.length ? h('div', { class: 'lb-detail-meta' }, h('span', null, 'Reward: ', h('b', null, bits.join(', ')))) : null,
      !e.done ? h('button', { class: 'lb-btn primary', testid: 'quest-track', onClick: track }, trackedId() === e.id ? 'Tracked' : 'Track') : null,
    );
  }
  function track() {
    const e = entries()[sel];
    if (!e || e.done) { sfx('ui_error'); return; }
    sfx('ui_confirm');
    if (trackedId() !== e.id) Game.bus.emit(EVT.UI_TRACK_QUEST, { id: e.id }); // Systems toggles; only ask when it is not tracked yet
    paintList(); paintDetail();
  }
  function setSel(i) { sel = Math.max(0, Math.min(Math.max(0, entries().length - 1), i)); paintList(); paintDetail(); const s = list.querySelector('.is-sel'); if (s) s.scrollIntoView({ block: 'nearest' }); }
  const nav = navList(() => entries().length || 1, () => sel, setSel, { wrap: false });
  const el = h('div', { class: 'lb-tab-quests' }, h('div', { class: 'lb-qleft' }, lbar, list), detail);
  paintLanterns(); paintList(); paintDetail();
  return { el, hint: 'Space: track', key: (a) => { if (nav(a)) return true; if (a === 'confirm') { track(); return true; } return false; } };
}
export { bump, frag };
