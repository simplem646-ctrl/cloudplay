// HUD: clock, coins, energy, quest line, prompt chip, toasts, banner, fade, letterbox.
import { Game } from '../core/game.js';
import { SEASONS } from '../core/registry.js';
import { formatClock12, formatDate, clamp } from '../core/util.js';
import { h, frag, bump, cap, dataList, append } from './dom.js';
import { SEASON_SVG, WEATHER_SVG, MOON_SVG, COIN_SVG, FLAME_SVG, LANTERN_SVG } from './svgs.js';
import { itemIcon } from './icons.js';

let el = {};
let acc = 1;
let shownMoney = null;
let targetMoney = 0;
let last = {};
let tracked = null;
let promptTimer = null;
const toastEls = [];

export function buildHud(root) {
  el.hud = h('div', { class: 'lb-hud', testid: 'hud' });
  el.emblem = h('div', { class: 'lb-emblem' });
  el.date = h('div', { class: 'lb-cdate', testid: 'hud-date' });
  el.time = h('div', { class: 'lb-ctime', testid: 'hud-time' });
  el.moon = h('span', { class: 'lb-moon', html: MOON_SVG });
  el.wx = h('div', { class: 'lb-wx' });
  el.time.appendChild(el.moon);
  el.clock = h('div', { class: 'lb-clock lb-panel', testid: 'hud-clock' }, el.emblem, h('div', null, el.date, el.time), el.wx);
  el.qtitle = h('span');
  el.qtext = h('span');
  el.quest = h('div', { class: 'lb-questline', hidden: true, testid: 'hud-quest' }, h('div', { html: LANTERN_SVG, style: 'display:flex' }), h('div', null, el.qtitle, el.qtext));
  el.coinNum = h('span', { testid: 'hud-coins' }, '0');
  el.coins = h('div', { class: 'lb-coins lb-panel' }, h('div', { html: COIN_SVG, style: 'display:flex' }), el.coinNum);
  el.ebar = h('i');
  el.enum = h('span', { class: 'lb-enum' });
  el.energy = h('div', { class: 'lb-energy lb-panel', testid: 'hud-energy' }, h('div', { html: FLAME_SVG, style: 'display:flex' }), h('div', { class: 'lb-ebar' }, el.ebar), el.enum);
  el.prompt = h('div', { class: 'lb-prompt', testid: 'hud-prompt' });
  el.hud.append(el.clock, el.quest, el.coins, el.energy, el.prompt);
  el.toasts = h('div', { class: 'lb-toasts', testid: 'toasts' });
  el.bannerBox = h('div', { class: 'lb-banner', testid: 'banner' });
  el.fade = h('div', { class: 'lb-fade', testid: 'fade' });
  el.letter = h('div', { class: 'lb-letterbox' }, h('i'), h('i'));
  el.rotate = h('div', { class: 'lb-rotate' }, 'Rotate your device for the best view');
  root.append(el.hud, el.toasts, el.bannerBox, el.letter, el.fade, el.rotate);
  last = {};
  shownMoney = null;
  refresh(true);
  return el;
}

function questList() {
  const q = Game.data && Game.data.quests;
  const map = {};
  for (const d of dataList(q)) if (d && d.id) map[d.id] = d;
  return map;
}

export function setTracked(id) { tracked = id; last.q = null; }

function setText(node, key, text) {
  if (last[key] !== text) { last[key] = text; node.textContent = text; }
}

function refresh(force) {
  const s = Game.state;
  if (!s) { el.hud.style.visibility = 'hidden'; return; }
  el.hud.style.visibility = '';
  const t = s.time || { season: 0, day: 1, minutes: 360 };
  const sk = SEASONS[((t.season % 4) + 4) % 4];
  if (last.season !== sk) { last.season = sk; el.emblem.innerHTML = SEASON_SVG[sk]; el.emblem.firstChild.classList.add('lb-emblem-svg'); }
  setText(el.date, 'date', formatDate(t));
  const clockText = formatClock12(t.minutes);
  if (last.time !== clockText) { last.time = clockText; setTimeNode(clockText); }
  el.moon.classList.toggle('on', t.minutes >= 1140);
  const wx = (s.weather && s.weather.today) || 'sunny';
  if (last.wx !== wx) { last.wx = wx; el.wx.innerHTML = WEATHER_SVG[wx] || WEATHER_SVG.sunny; el.wx.title = cap(wx); }
  const money = (s.player && s.player.money) || 0;
  if (shownMoney === null) { shownMoney = money; targetMoney = money; el.coinNum.textContent = String(money); }
  else if (money !== targetMoney) {
    const d = money - targetMoney;
    targetMoney = money;
    const f = h('span', { class: 'lb-delta' + (d < 0 ? ' neg' : '') }, (d > 0 ? '+' : '') + d);
    el.coins.appendChild(f);
    setTimeout(() => f.remove(), 1700);
    bump(el.coinNum.parentNode.parentNode);
  }
  const en = (s.player && s.player.energy) || 0;
  const maxEn = (s.player && s.player.maxEnergy) || 100;
  const pct = clamp(en / maxEn, 0, 1);
  el.ebar.style.width = (pct * 100).toFixed(1) + '%';
  el.energy.classList.toggle('low', pct < 0.2);
  el.energy.classList.toggle('mid', pct >= 0.2 && pct < 0.45);
  setText(el.enum, 'en', String(Math.round(en)));
  // quest line
  const qs = questList();
  const active = (s.quests && s.quests.active) || {};
  const want = (s.quests && s.quests.tracked) || tracked;
  let id = want && active[want] ? want : Object.keys(active)[0];
  const sig = id ? id + ':' + (active[id] && active[id].stage) : '';
  if (force || last.q !== sig) {
    last.q = sig;
    if (!id) el.quest.hidden = true;
    else {
      const def = qs[id] || {};
      const st = (def.stages || [])[(active[id] && active[id].stage) || 0];
      el.qtitle.textContent = def.title || 'Quest';
      el.qtext.textContent = (st && st.text) || def.desc || '';
      el.quest.hidden = false;
    }
  }
}

function setTimeNode(text) {
  // keep moon icon as first child, text as second
  let tn = el.timeText;
  if (!tn) { tn = el.timeText = document.createElement('span'); el.time.insertBefore(tn, el.moon); }
  tn.textContent = text;
}

export function updateHud(dt) {
  if (shownMoney !== null && shownMoney !== targetMoney) {
    const diff = targetMoney - shownMoney;
    shownMoney += Math.sign(diff) * Math.max(1, Math.abs(diff) * Math.min(1, dt * 6));
    if (Math.abs(targetMoney - shownMoney) < 1) shownMoney = targetMoney;
    el.coinNum.textContent = String(Math.round(shownMoney));
  }
  acc += dt;
  if (acc >= 0.1) { acc = 0; refresh(false); }
}

export function setPrompt(text) {
  clearTimeout(promptTimer);
  if (!text) { el.prompt.classList.remove('on'); return; }
  el.prompt.textContent = text;
  el.prompt.classList.add('on');
}

export function hudVisible(v) { el.hud.classList.toggle('is-hidden', !v); }
export const hudIsVisible = () => !el.hud.classList.contains('is-hidden');

export function toast(text, opts = {}) {
  if (!el.toasts) return;
  const kind = opts.kind || 'info';
  const iconBox = h('div', { class: 'lb-ticon' });
  const ic = opts.icon;
  if (ic && typeof ic === 'object' && ic.icon) iconBox.appendChild(itemIcon(ic, 40));
  else if (typeof ic === 'string' && ic) {
    const idef = Game.data && Game.data.getItem ? safeItem(ic) : null;
    if (idef) iconBox.appendChild(itemIcon(idef, 40));
    else iconBox.textContent = ic.length <= 3 ? ic : '✦';
  } else iconBox.textContent = { quest: '!', heart: '♥', warn: '!', item: '✦' }[kind] || '✿';
  const node = h('div', { class: 'lb-toast k-' + kind, testid: 'toast' }, iconBox, h('span', null, String(text)));
  el.toasts.appendChild(node);
  toastEls.push(node);
  while (toastEls.length > 4) { const old = toastEls.shift(); old.remove(); }
  const ms = opts.ms || 2800;
  setTimeout(() => node.classList.add('out'), ms);
  setTimeout(() => { node.remove(); const i = toastEls.indexOf(node); if (i >= 0) toastEls.splice(i, 1); }, ms + 450);
}
function safeItem(id) { try { return Game.data.getItem(id); } catch (_) { return null; } }

let bannerTimer = null;
export function banner(title, sub, ms = 3000) {
  clearTimeout(bannerTimer);
  const b = el.bannerBox;
  b.classList.remove('on');
  b.textContent = '';
  append(b, h('div', { class: 'lb-bt' }, title), sub ? h('div', { class: 'lb-bs' }, sub) : null);
  void b.offsetWidth;
  b.style.animationDuration = ms + 'ms';
  b.classList.add('on');
  b.firstChild.parentNode.style.setProperty('--d', ms + 'ms');
  return new Promise((res) => { bannerTimer = setTimeout(() => { b.classList.remove('on'); res(); }, ms); });
}

let fadeAnim = null;
let fadeAlpha = 0;
export function fade(to, ms = 500, color = '#000') {
  const f = el.fade;
  f.style.background = color;
  if (fadeAnim) { fadeAnim.cancel(); fadeAnim = null; }
  const from = fadeAlpha;
  fadeAlpha = clamp(Number(to) || 0, 0, 1);
  f.classList.toggle('block', fadeAlpha > 0.05);
  return new Promise((res) => {
    if (!ms || ms <= 0 || !f.animate) { f.style.opacity = String(fadeAlpha); res(); return; }
    fadeAnim = f.animate([{ opacity: from }, { opacity: fadeAlpha }], { duration: ms, easing: 'ease-in-out', fill: 'forwards' });
    const a = fadeAnim;
    a.onfinish = () => { f.style.opacity = String(fadeAlpha); try { a.cancel(); } catch (_) { /* ignore */ } if (fadeAnim === a) fadeAnim = null; res(); };
    a.oncancel = () => res();
  });
}

export function letterbox(on) { el.letter.classList.toggle('on', !!on); el.quest.classList.toggle('cine', !!on); }
export { frag };
