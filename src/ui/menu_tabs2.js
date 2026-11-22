// Pause-menu tabs, part 2: map, calendar, collection.
import { Game } from '../core/game.js';
import { AREAS, SEASONS, WEEKDAYS } from '../core/registry.js';
import { clamp } from '../core/util.js';
import { h, clear, sfx, getItem, dataList, cap, frag, append } from './dom.js';
import { itemIcon } from './icons.js';
import { calendarGrid, birthdaysIn, festivalsIn, mapAreaFor, forageIds, fmtNum, sellPrice } from './helpers.js';
import { CAKE_SVG, STAR_SVG, SEASON_SVG, BOOK_SVG } from './svgs.js';

const state = () => Game.state || {};

// ---------------------------------------------------------------- map
const EXT = () => Object.keys(AREAS).filter((id) => AREAS[id].kind === 'exterior');
const W = 960;
const H = 600;
const P = (id) => { const m = AREAS[id].mapPos; return [m[0] * W * 0.88 + W * 0.06, m[1] * H * 0.84 + H * 0.08]; };

function wavy(c, pts, w, col) {
  c.beginPath();
  pts.forEach((p, i) => (i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])));
  c.lineWidth = w; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
}
function blob(c, x, y, rx, ry, fill, stroke) {
  c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = fill; c.fill();
  if (stroke) { c.lineWidth = 2; c.strokeStyle = stroke; c.stroke(); }
}
function tree(c, x, y, s, col = '#4f9a48') {
  c.fillStyle = '#7a5236'; c.fillRect(x - s * 0.1, y, s * 0.2, s * 0.35);
  c.beginPath(); c.arc(x, y - s * 0.05, s * 0.4, 0, Math.PI * 2); c.fillStyle = col; c.fill();
  c.lineWidth = 1.6; c.strokeStyle = '#2f6b3a'; c.stroke();
  c.beginPath(); c.arc(x - s * 0.12, y - s * 0.16, s * 0.12, 0, Math.PI * 2); c.fillStyle = 'rgba(255,255,255,.25)'; c.fill();
}
function house(c, x, y, s, wall, roof) {
  c.fillStyle = wall; c.fillRect(x - s * 0.38, y - s * 0.1, s * 0.76, s * 0.5);
  c.beginPath(); c.moveTo(x - s * 0.5, y - s * 0.08); c.lineTo(x, y - s * 0.55); c.lineTo(x + s * 0.5, y - s * 0.08); c.closePath(); c.fillStyle = roof; c.fill();
  c.lineWidth = 1.8; c.strokeStyle = '#5a3d2b'; c.stroke(); c.strokeRect(x - s * 0.38, y - s * 0.1, s * 0.76, s * 0.5);
  c.fillStyle = '#7a5236'; c.fillRect(x - s * 0.08, y + s * 0.15, s * 0.16, s * 0.25);
}
function landmark(c, id, x, y, s) {
  c.save();
  switch (id) {
    case 'brook_lane': house(c, x - s * 0.25, y, s * 0.8, '#fff0d0', '#d9634f'); house(c, x + s * 0.3, y + s * 0.1, s * 0.6, '#f5e2b8', '#6f8fd0'); break;
    case 'town_square': blob(c, x, y + s * 0.1, s * 0.55, s * 0.32, '#cfc8bc', '#5a3d2b'); blob(c, x, y + s * 0.06, s * 0.3, s * 0.17, '#8fd0f0', '#3a7aa8'); c.fillStyle = '#5a3d2b'; c.fillRect(x - 2, y - s * 0.3, 4, s * 0.3); blob(c, x, y - s * 0.34, s * 0.12, s * 0.12, '#ffd978', '#5a3d2b'); break;
    case 'market_street': for (const [dx, col] of [[-0.45, '#e0607e'], [0, '#6fb7e8'], [0.45, '#f4c542']]) { c.fillStyle = '#e8c88a'; c.fillRect(x + dx * s - s * 0.18, y, s * 0.36, s * 0.3); c.beginPath(); c.moveTo(x + dx * s - s * 0.24, y); c.lineTo(x + dx * s + s * 0.24, y); c.lineTo(x + dx * s + s * 0.16, y - s * 0.25); c.lineTo(x + dx * s - s * 0.16, y - s * 0.25); c.closePath(); c.fillStyle = col; c.fill(); c.lineWidth = 1.6; c.strokeStyle = '#5a3d2b'; c.stroke(); } break;
    case 'riverside_park': tree(c, x - s * 0.35, y, s * 0.9); tree(c, x + s * 0.3, y + s * 0.05, s * 0.8, '#6fb85a'); blob(c, x, y + s * 0.4, s * 0.5, s * 0.14, '#8fd0f0', '#3a7aa8'); break;
    case 'harbor': c.fillStyle = '#a8744a'; c.fillRect(x - s * 0.55, y + s * 0.15, s * 1.1, s * 0.14); c.fillRect(x - s * 0.45, y + s * 0.29, 4, s * 0.2); c.fillRect(x + s * 0.4, y + s * 0.29, 4, s * 0.2); c.beginPath(); c.moveTo(x - s * 0.2, y + s * 0.1); c.lineTo(x - s * 0.2, y - s * 0.45); c.lineTo(x + s * 0.3, y + s * 0.1); c.closePath(); c.fillStyle = '#fff'; c.fill(); c.lineWidth = 1.8; c.strokeStyle = '#5a3d2b'; c.stroke(); break;
    case 'whispering_woods': tree(c, x - s * 0.4, y + s * 0.1, s, '#3f8a4a'); tree(c, x + s * 0.1, y - s * 0.05, s * 1.15, '#4f9a48'); tree(c, x + s * 0.5, y + s * 0.15, s * 0.85, '#3f8a4a'); break;
    case 'starview_hill': blob(c, x, y + s * 0.2, s * 0.75, s * 0.4, '#8fd16a', '#4f8a3c'); house(c, x, y - s * 0.12, s * 0.5, '#e8e0f5', '#5a6aa8'); c.fillStyle = '#ffd23f'; c.font = `${s * 0.35}px sans-serif`; c.fillText('✦', x + s * 0.3, y - s * 0.35); break;
    default: house(c, x, y, s, '#fff0d0', '#d9634f');
  }
  c.restore();
}

export function mapTab() {
  const ids = EXT();
  const here = (() => { const a = state().player && state().player.area; return mapAreaFor(a, AREAS) || ids[0]; })();
  let sel = Math.max(0, ids.indexOf(here));
  const cvs = h('canvas', { class: 'lb-map-cvs', width: W, height: H, testid: 'map-canvas' });
  const info = h('div', { class: 'lb-map-info', testid: 'map-info' });
  let t0 = 0;
  const bg = document.createElement('canvas');
  bg.width = W; bg.height = H;
  (function paintBg() {
    const c = bg.getContext('2d');
    const g = c.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#f6e4b4'); g.addColorStop(1, '#ebd096');
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 420; i++) { c.fillStyle = `rgba(138,90,58,${0.02 + ((i * 7) % 5) * 0.01})`; c.fillRect((i * 97) % W, (i * 151) % H, 2 + (i % 3), 2); }
    // land
    c.beginPath(); c.moveTo(20, 40); c.bezierCurveTo(300, 10, 700, 30, 940, 70); c.lineTo(940, 400); c.bezierCurveTo(900, 470, 760, 470, 700, 560); c.lineTo(60, 580); c.bezierCurveTo(10, 400, 40, 200, 20, 40); c.closePath();
    const lg = c.createLinearGradient(0, 0, 0, H); lg.addColorStop(0, '#c8e49a'); lg.addColorStop(1, '#a9d27a'); c.fillStyle = lg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#8a5a3a'; c.stroke();
    // sea
    c.beginPath(); c.moveTo(W, 360); c.bezierCurveTo(900, 420, 790, 430, 740, 520); c.bezierCurveTo(720, 560, 700, 590, 690, H); c.lineTo(W, H); c.closePath();
    const sg = c.createLinearGradient(700, 400, W, H); sg.addColorStop(0, '#9fdcf2'); sg.addColorStop(1, '#5fb7dc'); c.fillStyle = sg; c.fill(); c.lineWidth = 4; c.strokeStyle = '#8a5a3a'; c.stroke();
    for (let i = 0; i < 9; i++) { wavy(c, [[780 + i * 14, 470 + i * 12], [792 + i * 14, 464 + i * 12], [804 + i * 14, 470 + i * 12], [816 + i * 14, 464 + i * 12]], 2, 'rgba(255,255,255,.7)'); }
    // hills
    for (const [x, y, r] of [[470, 70, 60], [560, 90, 70], [650, 70, 50]]) { blob(c, x, y + 20, r * 1.3, r * 0.6, '#9ccc6c', '#6f9f4c'); }
    // forest dots
    for (let i = 0; i < 26; i++) tree(c, 80 + (i * 29) % 190, 70 + (i * 41) % 130, 24 + (i % 3) * 4, i % 2 ? '#4f9a48' : '#3f8a4a');
    // brook & river
    wavy(c, [[150, 220], [160, 270], [140, 330], [130, 380], [180, 420]], 7, '#5fb7dc');
    wavy(c, [[300, 330], [330, 400], [380, 470], [420, 520], [560, 540], [700, 500]], 10, '#6fc0e4');
    // compass
    c.save(); c.translate(870, 120); c.strokeStyle = '#8a5a3a'; c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 26, 0, Math.PI * 2); c.stroke();
    c.fillStyle = '#e0607e'; c.beginPath(); c.moveTo(0, -24); c.lineTo(6, 0); c.lineTo(-6, 0); c.fill(); c.fillStyle = '#8a5a3a'; c.beginPath(); c.moveTo(0, 24); c.lineTo(6, 0); c.lineTo(-6, 0); c.fill();
    c.fillStyle = '#5a3d2b'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center'; c.fillText('N', 0, -32); c.restore();
  })();
  function draw(time = 0) {
    const c = cvs.getContext('2d');
    c.drawImage(bg, 0, 0);
    // dashed paths
    c.save(); c.setLineDash([10, 9]); c.lineCap = 'round';
    const drawn = new Set();
    for (const id of ids) for (const n of AREAS[id].neighbors) {
      if (!AREAS[n] || AREAS[n].kind !== 'exterior') continue;
      const k = [id, n].sort().join('|'); if (drawn.has(k)) continue; drawn.add(k);
      const a = P(id), b = P(n);
      c.beginPath(); c.moveTo(a[0], a[1]); c.quadraticCurveTo((a[0] + b[0]) / 2 + (a[1] - b[1]) * 0.08, (a[1] + b[1]) / 2 + (b[0] - a[0]) * 0.08, b[0], b[1]); c.lineWidth = 4; c.strokeStyle = '#a8744a'; c.stroke();
    }
    c.restore();
    ids.forEach((id, i) => {
      const [x, y] = P(id);
      if (i === sel) { const r = 54 + Math.sin(time * 4) * 2.5; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); const g = c.createRadialGradient(x, y, 8, x, y, r); g.addColorStop(0, 'rgba(255,230,120,.75)'); g.addColorStop(1, 'rgba(255,230,120,0)'); c.fillStyle = g; c.fill(); }
      landmark(c, id, x, y, 52);
      c.lineJoin = 'round'; c.font = `${i === sel ? 800 : 700} ${i === sel ? 20 : 16}px Fredoka, Nunito, system-ui, sans-serif`; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = 'rgba(255,248,226,.95)'; c.strokeText(AREAS[id].name, x, y + 56); c.fillStyle = i === sel ? '#a8402a' : '#4a3426'; c.fillText(AREAS[id].name, x, y + 56);
      if (id === here) {
        const by = Math.sin(time * 5) * 4;
        c.fillStyle = '#e0607e'; c.beginPath(); c.moveTo(x, y - 40 + by); c.bezierCurveTo(x - 22, y - 68 + by, x + 22, y - 68 + by, x, y - 40 + by); c.arc(x, y - 58 + by, 13, 0.6 * Math.PI, 2.4 * Math.PI, false); c.closePath(); c.fill(); c.lineWidth = 2.5; c.strokeStyle = '#5a3d2b'; c.stroke(); c.fillStyle = '#fff'; c.beginPath(); c.arc(x, y - 58 + by, 5, 0, Math.PI * 2); c.fill();
      }
    });
  }
  function paintInfo() {
    const id = ids[sel];
    info.textContent = '';
    append(info, h('b', null, AREAS[id].name), id === here ? h('span', { class: 'lb-chip here' }, '● You are here') : null, h('span', { class: 'lb-muted' }, `  ${AREAS[id].neighbors.filter((n) => AREAS[n].kind === 'interior').map((n) => AREAS[n].name).slice(0, 4).join(' · ')}`));
  }
  cvs.addEventListener('pointermove', (e) => {
    const r = cvs.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
    let best = -1, bd = 70;
    ids.forEach((id, i) => { const [px, py] = P(id); const d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = i; } });
    if (best >= 0 && best !== sel) { sel = best; paintInfo(); draw(t0); sfx('ui_move'); }
  });
  const el = h('div', { class: 'lb-tab-map' }, h('div', { class: 'lb-map-frame' }, cvs), info);
  paintInfo(); draw(0);
  let acc = 0;
  return {
    el, hint: '←→: places',
    key(a) { if (a === 'left' || a === 'up') sel = (sel - 1 + ids.length) % ids.length; else if (a === 'right' || a === 'down') sel = (sel + 1) % ids.length; else return false; sfx('ui_move'); paintInfo(); draw(t0); return true; },
    tick(dt) { acc += dt; t0 += dt; if (acc > 0.07) { acc = 0; draw(t0); } },
  };
}

// ---------------------------------------------------------------- calendar
export function calendarTab() {
  const now = state().time || { season: 0, day: 1, year: 1 };
  let season = now.season;
  const head = h('div', { class: 'lb-cal-head' });
  const grid = h('div', { class: 'lb-cal-grid', testid: 'calendar-grid' });
  const legend = h('div', { class: 'lb-cal-legend lb-scroll', testid: 'calendar-legend' });
  const npcs = () => Game.data && Game.data.npcs;
  function paint() {
    const sn = SEASONS[season];
    clear(head); clear(grid); clear(legend);
    const prev = h('button', { class: 'lb-btn small', testid: 'cal-prev', onClick: () => go(-1) }, '◀');
    const next = h('button', { class: 'lb-btn small', testid: 'cal-next', onClick: () => go(1) }, '▶');
    head.append(prev, h('div', { class: 'lb-cal-title' }, h('span', { class: 'lb-cal-emblem', html: SEASON_SVG[sn] }), h('h3', { testid: 'cal-title' }, `${cap(sn)}`), h('span', { class: 'lb-muted' }, `Year ${now.year || 1}`)), next);
    for (const wd of WEEKDAYS) grid.appendChild(h('div', { class: 'lb-cal-wd' }, cap(wd)));
    const fests = festivalsIn(season, Game.data && Game.data.festivals);
    const bdays = birthdaysIn(season, npcs());
    const by = (list) => { const m = {}; for (const x of list) (m[x.day] = m[x.day] || []).push(x); return m; };
    const fm = by(fests), bm = by(bdays);
    for (const row of calendarGrid()) for (const cell of row) {
      const isToday = season === now.season && cell.day === now.day;
      const tip = [...(fm[cell.day] || []).map((f) => f.name), ...(bm[cell.day] || []).map((b) => `${b.name}'s birthday`)].join(' · ');
      grid.appendChild(h('div', { class: 'lb-cal-cell' + (isToday ? ' today' : '') + (cell.day < now.day && season === now.season ? ' past' : ''), title: tip, dataset: { day: cell.day } },
        h('span', { class: 'lb-cal-day' }, String(cell.day)),
        h('span', { class: 'lb-cal-icons' }, fm[cell.day] ? h('span', { class: 'lb-cal-ic', html: STAR_SVG }) : null, bm[cell.day] ? h('span', { class: 'lb-cal-ic', html: CAKE_SVG }) : null)));
    }
    const wk = ((Game.data && Game.data.calendar && Game.data.calendar.weekly) || []);
    for (const f of fests) legend.appendChild(h('div', { class: 'lb-leg' }, h('span', { class: 'lb-cal-ic', html: STAR_SVG }), h('b', { class: 'lb-leg-date' }, `${cap(sn)} ${f.day}`), h('span', { class: 'lb-leg-text' }, f.name)));
    for (const b of bdays) legend.appendChild(h('div', { class: 'lb-leg' }, h('span', { class: 'lb-cal-ic', html: CAKE_SVG }), h('b', { class: 'lb-leg-date' }, `${cap(sn)} ${b.day}`), h('span', { class: 'lb-leg-text one', title: `${b.name}'s birthday` }, `${b.short}'s birthday`)));
    for (const w of wk) legend.appendChild(h('div', { class: 'lb-leg muted' }, h('span', { class: 'lb-cal-ic' }), h('b', { class: 'lb-leg-date' }, `Every ${cap(w.weekday)}`), h('span', { class: 'lb-leg-text' }, w.text)));
    if (!legend.firstChild) legend.appendChild(h('div', { class: 'lb-muted' }, 'A quiet season, nothing marked.'));
  }
  function go(d) { season = (season + d + 4) % 4; sfx('ui_tab'); paint(); }
  const el = h('div', { class: 'lb-tab-calendar' }, head, h('div', { class: 'lb-cal-main' }, grid, legend));
  paint();
  return { el, hint: '←→: seasons', key(a) { if (a === 'left') { go(-1); return true; } if (a === 'right') { go(1); return true; } return a === 'up' || a === 'down'; } };
}

// ---------------------------------------------------------------- collection
export function collectionTab() {
  const log = state().log || { fish: {}, forage: {}, books: {} };
  const el = h('div', { class: 'lb-tab-collection lb-scroll', testid: 'collection' });
  const fishDefs = dataList(Game.data && Game.data.fish);
  const section = (title, count, total, body) => h('section', { class: 'lb-col-sec' }, h('h3', null, title, h('span', { class: 'lb-muted' }, `  ${count}/${total}`)), body);
  // fish
  const fgrid = h('div', { class: 'lb-cgrid' });
  let fc = 0;
  for (const f of fishDefs) {
    const rec = (log.fish || {})[f.id];
    const def = getItem(f.id) || { icon: { shape: 'fish_small' }, name: f.name, price: {} };
    if (rec) fc++;
    const cv = itemIcon(def, 56); cv.className = 'lb-icon-cvs' + (rec ? '' : ' sil');
    fgrid.appendChild(h('div', { class: 'lb-ccard' + (rec ? '' : ' unknown'), testid: 'fish-card', title: rec ? f.desc || '' : 'Not caught yet' }, h('div', { class: 'lb-cicon' }, cv), h('b', null, rec ? f.name || def.name : '???'),
      h('span', { class: 'lb-muted' }, rec ? `Max ${rec.maxSize}cm · ×${rec.count}` : 'Undiscovered'), rec ? h('span', { class: 'lb-cprice' }, `${fmtNum(sellPrice(def))}c`) : null));
  }
  if (!fishDefs.length) fgrid.appendChild(h('div', { class: 'lb-muted' }, 'No fish are known yet.'));
  // forage
  const ids = forageIds(Game.data && Game.data.forage);
  const gcard = h('div', { class: 'lb-cgrid' });
  let gc = 0;
  for (const id of ids) {
    const def = getItem(id) || { icon: { shape: 'leaf' }, name: id, price: {} };
    const n = (log.forage || {})[id] || 0;
    if (n) gc++;
    const cv = itemIcon(def, 56); cv.className = 'lb-icon-cvs' + (n ? '' : ' sil');
    gcard.appendChild(h('div', { class: 'lb-ccard' + (n ? '' : ' unknown'), testid: 'forage-card' }, h('div', { class: 'lb-cicon' }, cv), h('b', null, n ? def.name : '???'), h('span', { class: 'lb-muted' }, n ? `Found ×${n}` : 'Undiscovered'), n ? h('span', { class: 'lb-cprice' }, `${fmtNum(sellPrice(def))}c`) : null));
  }
  if (!ids.length) gcard.appendChild(h('div', { class: 'lb-muted' }, 'Nothing foraged yet.'));
  // books
  const books = dataList(Game.data && Game.data.books);
  const blist = h('div', { class: 'lb-booklist' });
  let bc = 0;
  for (const b of books) {
    const read = !!(log.books || {})[b.id];
    if (read) bc++;
    blist.appendChild(h('div', { class: 'lb-bookrow' + (read ? '' : ' unknown') }, h('span', { class: 'lb-mini', html: BOOK_SVG }), h('b', null, read ? b.title : '???'), h('span', { class: 'lb-muted' }, read ? `by ${b.author || 'unknown'}` : 'Unread')));
  }
  if (!books.length) blist.appendChild(h('div', { class: 'lb-muted' }, 'No books found yet.'));
  el.append(section('Fish', fc, fishDefs.length, fgrid), section('Foraged', gc, ids.length, gcard), section('Books', bc, books.length, blist));
  return {
    el, hint: '↑↓: scroll',
    key(a) { if (a === 'up') { el.scrollTop -= 60; return true; } if (a === 'down') { el.scrollTop += 60; return true; } return a === 'left' || a === 'right'; },
  };
}
export { frag, clamp };
