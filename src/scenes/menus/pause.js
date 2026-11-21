// Pause menu: tabbed (Status, Items, Friends, Journal, Calendar, Records, System). Also registered per tab
// ('status', 'items', ...) so any scene can open one screen directly (no tab bar, cancel closes it).
// Focus model: 'tabs' (left/right switch tab, confirm/down enters the tab, cancel closes) and 'content'
// (the panel owns the arrows, cancel goes back to the tab bar).
import {
  drawText, drawWindow, drawBar, drawStatBars, drawTable, drawHeartsRow, drawIconSafe, wrapText, THEME, LINE_H,
  ListMenu, GridMenu, TabBar, CalendarGrid, measureText,
} from '../../ui/index.js';
import { SEASONS, SEASON_LABEL, CLUB_LABEL, CURRENCY } from '../../core/constants.js';
import { defaultQuests } from '../../sim/events.js';
import { openScene } from '../registry.js';
import { MenuScene, drawPortrait, drawHints, goToTitle, saveApi } from './common.js';
import {
  buildStatus, buildItemList, useResultText, buildFriends, buildJournal, buildCalendarData, calendarDayLines, stepSeason,
  buildRecords, prettify,
} from './data.js';

export const PAUSE_TABS = [
  ['status', 'Status'], ['items', 'Items'], ['friends', 'Friends'], ['journal', 'Journal'],
  ['calendar', 'Dates'], ['records', 'Records'], ['system', 'System'],
];
const SUBJECT_COLOR = { math: '#5a8fd8', literature: '#d8645a', science: '#5aa86a', history: '#d8a23a', art: '#d878a8', pe: '#4ab0b8' };
const TRAIT_COLOR = { fitness: '#d8783a', charm: '#d878a8', creativity: '#8a6ad8' };
const INK = THEME.ink, HEAD = '#8a3a1a', PAPER_BACK = '#a89870';

/** Pump a list/grid/calendar widget: returns 'back' (cancelled) | {select: result} | null. Re-arms the widget. */
function pump(w, dt, input) {
  w.update(dt, input);
  if (!w.done) return null;
  const r = w.result;
  w.done = false; w.result = undefined;
  return r === null ? 'back' : { select: r };
}

// ------------------------------------------------------------------ panels
function statusPanel(sc) {
  return {
    interactive: false, hint: 'Left/Right: tab    Cancel: close',
    update() {},
    draw(ctx) {
      const st = buildStatus(sc.state);
      drawWindow(ctx, 8, 26, 304, 196, 'parchment');
      drawText(ctx, st.name, 18, 33, { color: HEAD, shadow: null, scale: 1 });
      drawText(ctx, st.dateLine, 18, 44, { color: INK, shadow: null });
      const bar = (label, y, v, max, fill, text) => {
        drawText(ctx, label, 18, y, { color: INK, shadow: null });
        drawBar(ctx, 68, y + 1, 70, 6, v, max, { fill, back: PAPER_BAR(), border: INK });
        drawText(ctx, text, 158, y, { color: INK, shadow: null, align: 'right' });
      };
      bar('Energy', 60, st.energy.value, st.energy.max, st.energy.value / st.energy.max > 0.4 ? '#7fd36a' : '#e8645a', `${Math.round(st.energy.value)}`);
      drawText(ctx, 'Money', 18, 73, { color: INK, shadow: null });
      drawText(ctx, `${CURRENCY}${st.money}`, 156, 73, { color: HEAD, shadow: null, align: 'right' });
      bar('Conduct', 86, st.conduct, 100, '#5a8fd8', `${Math.round(st.conduct)}`);
      bar('Spirit', 99, st.spirit, 100, '#d8a23a', `${Math.round(st.spirit)}`);
      ctx.fillStyle = THEME.wood; ctx.fillRect(18, 113, 138, 1);
      drawText(ctx, st.club, 18, 120, { color: INK, shadow: null });
      drawText(ctx, st.job, 18, 132, { color: INK, shadow: null });
      drawText(ctx, st.standing, 18, 144, { color: INK, shadow: null });
      ctx.fillStyle = THEME.wood; ctx.fillRect(18, 158, 138, 1);
      if (st.partner) {
        drawText(ctx, `Dating ${st.partner.name}`, 18, 166, { color: '#c8406a', shadow: null });
        drawHeartsRow(ctx, 18, 178, { hearts: st.partner.hearts });
      } else drawText(ctx, 'No partner yet', 18, 166, { color: '#7a6a50', shadow: null });
      ctx.fillStyle = THEME.wood; ctx.fillRect(164, 32, 1, 182);
      drawText(ctx, 'Subjects', 172, 32, { color: HEAD, shadow: null });
      drawStatBars(ctx, 172, 45, st.subjects.map((s) => ({ label: s.label, value: s.value, color: SUBJECT_COLOR[s.key] })), { w: 134, labelW: 62, style: 'parchment', rowH: 13 });
      drawText(ctx, 'Traits', 172, 134, { color: HEAD, shadow: null });
      drawStatBars(ctx, 172, 147, st.traits.map((s) => ({ label: s.label, value: s.value, color: TRAIT_COLOR[s.key] })), { w: 134, labelW: 62, style: 'parchment', rowH: 13 });
    },
  };
}
const PAPER_BAR = () => PAPER_BACK;

function itemsPanel(sc) {
  let grid = null, rows = [];
  const rebuild = (keep = 0) => {
    rows = buildItemList(sc.state.inventory);
    grid = new GridMenu({ services: sc.services, items: rows, x: 12, y: 30, cols: 10, rows: 4, cell: 27, title: 'Bag', cursor: Math.min(keep, Math.max(0, rows.length - 1)) });
  };
  rebuild();
  return {
    interactive: true, hint: 'Confirm: use    Cancel: back',
    refresh() { rebuild(); },
    update(dt, input) {
      if (!rows.length) { if (input.pressed('cancel')) return 'back'; return undefined; }
      const r = pump(grid, dt, input);
      if (r === 'back') return 'back';
      if (r && r.select) {
        const it = r.select.item;
        if (!it.usable) { sc.say('That cannot be used here.', '#cfd3ec'); sc.sfx('error'); return undefined; }
        sc.choose([`Use ${it.label}`, 'Cancel'], (i) => {
          if (i !== 0) return;
          const res = sc.game.sim.inventory.use(it.id);
          sc.say(useResultText(res, it), res.ok ? '#7fd36a' : '#e8645a');
          sc.sfx(res.ok ? 'confirm' : 'error');
          rebuild(grid.cursor);
        }, { title: it.label });
      }
      return undefined;
    },
    draw(ctx) {
      const ui = sc.game.ui;
      if (!rows.length) {
        drawWindow(ctx, 12, 30, 282, 120, 'menu');
        drawText(ctx, 'Your bag is empty.', 153, 84, { color: '#cfd3ec', shadow: THEME.navyDeep, align: 'center' });
      } else grid.draw(ctx);
      const used = rows.length;
      if (sc.noticeT > 0) return;
      drawWindow(ctx, 12, 204, 282, 15, 'tooltip');
      drawIconSafe(ui, ctx, 'coin', 16, 203);
      drawText(ctx, `${CURRENCY}${sc.state.player.money}`, 36, 208, { color: THEME.gold, shadow: THEME.navyDeep });
      drawText(ctx, `Bag ${used}/30`, 290, 208, { color: '#cfd3ec', shadow: THEME.navyDeep, align: 'right' });
    },
  };
}

function friendsPanel(sc) {
  let list = null, friends = [];
  const build = () => {
    friends = buildFriends(sc.state);
    const GC = { partner: '#f4a6c8', romance: '#ffd9a0', friend: '#ffffff', other: '#b9c0dc' };
    list = new ListMenu({
      services: sc.services, x: 8, y: 27, w: 126, rows: 14,
      items: friends.map((f) => ({ label: f.short, value: `${f.hearts}`, color: GC[f.group], desc: f.bio })),
    });
  };
  build();
  return {
    interactive: true, hint: 'Up/Down: choose    Cancel: back',
    refresh() { build(); },
    update(dt, input) {
      if (!friends.length) return input.pressed('cancel') ? 'back' : undefined;
      return pump(list, dt, input) === 'back' ? 'back' : undefined;
    },
    draw(ctx) {
      if (!friends.length) {
        drawWindow(ctx, 8, 27, 304, 100, 'menu');
        drawText(ctx, "You haven't met anyone yet.", 160, 70, { color: '#cfd3ec', shadow: THEME.navyDeep, align: 'center' });
        return;
      }
      list.draw(ctx);
      for (let i = 0; i < friends.length; i++) { /* hearts glyph column handled by value text */ }
      const f = friends[list.cursor];
      const x = 140, y = 27, w = 172, h = 195;
      drawWindow(ctx, x, y, w, h, 'menu');
      drawPortrait(sc.game, ctx, f.id, x + 8, y + 8, 48, f.group === 'partner' ? 'happy' : 'neutral');
      const nameLines = wrapText(f.name, w - 72).slice(0, 2);
      nameLines.forEach((l, i) => drawText(ctx, l, x + 64, y + 10 + i * LINE_H, { color: THEME.gold, shadow: THEME.navyDeep }));
      const sub = f.status ? f.status : prettify(f.kind);
      drawText(ctx, sub, x + 64, y + 12 + nameLines.length * LINE_H, { color: f.group === 'partner' ? '#f4a6c8' : '#cfd3ec', shadow: THEME.navyDeep });
      drawHeartsRow(ctx, x + 64, y + 44, { points: f.points });
      drawText(ctx, `${f.hearts}/10 hearts`, x + 64, y + 54, { color: '#cfd3ec', shadow: THEME.navyDeep });
      ctx.fillStyle = '#4a5896'; ctx.fillRect(x + 8, y + 66, w - 16, 1);
      drawText(ctx, 'Birthday', x + 10, y + 74, { color: '#9aa4d0', shadow: THEME.navyDeep });
      drawText(ctx, f.birthdayLabel, x + w - 10, y + 74, { color: '#ffffff', shadow: THEME.navyDeep, align: 'right' });
      drawText(ctx, 'Bond', x + 10, y + 86, { color: '#9aa4d0', shadow: THEME.navyDeep });
      drawBar(ctx, x + 48, y + 87, w - 62, 6, f.points, 100, { fill: '#ee4466', back: '#3a3f5e', border: THEME.navyDeep });
      ctx.fillStyle = '#4a5896'; ctx.fillRect(x + 8, y + 100, w - 16, 1);
      wrapText(f.bio || 'A new face in Bellhaven.', w - 20).slice(0, 7).forEach((l, i) => drawText(ctx, l, x + 10, y + 108 + i * LINE_H, { color: '#ffffff', shadow: THEME.navyDeep }));
    },
  };
}

function journalPanel(sc) {
  let list = null, rows = [];
  const build = () => {
    rows = buildJournal(sc.state, defaultQuests());
    list = new ListMenu({
      services: sc.services, style: 'parchment', x: 8, y: 27, w: 134, rows: 14,
      items: rows.map((q) => ({ label: `${q.main ? '* ' : ''}${q.title}`, value: q.state === 'complete' ? 'Done' : q.state === 'failed' ? 'x' : '', color: q.state === 'complete' ? '#4a7a3a' : q.state === 'failed' ? '#9a5a5a' : undefined })),
    });
  };
  build();
  return {
    interactive: true, hint: 'Up/Down: choose    Cancel: back',
    refresh() { build(); },
    update(dt, input) {
      if (!rows.length) return input.pressed('cancel') ? 'back' : undefined;
      return pump(list, dt, input) === 'back' ? 'back' : undefined;
    },
    draw(ctx) {
      if (!rows.length) {
        drawWindow(ctx, 8, 27, 304, 100, 'parchment');
        drawText(ctx, 'No quests yet.', 160, 64, { color: INK, shadow: null, align: 'center' });
        drawText(ctx, 'Talk to people around town!', 160, 78, { color: '#7a6a50', shadow: null, align: 'center' });
        return;
      }
      list.draw(ctx);
      const q = rows[list.cursor];
      const x = 148, y = 27, w = 164;
      drawWindow(ctx, x, y, w, 195, 'parchment');
      const stateTxt = q.state === 'complete' ? '{g}Complete' : q.state === 'failed' ? '{r}Failed' : '{b}In progress';
      let cy = y + 8;
      for (const l of wrapText(q.title, w - 20).slice(0, 2)) { drawText(ctx, l, x + 10, cy, { color: HEAD, shadow: null }); cy += LINE_H; }
      drawText(ctx, `${q.main ? '{y}Main goal   ' : ''}${stateTxt}`, x + 10, cy, { color: INK, shadow: null }); cy += LINE_H + 4;
      ctx.fillStyle = THEME.wood; ctx.fillRect(x + 8, cy - 2, w - 16, 1); cy += 3;
      const body = [];
      if (q.summary) body.push(...wrapText(q.summary, w - 20), '');
      q.steps.forEach((s) => body.push(...wrapText(`- ${s}`, w - 20)));
      if (q.notes.length) { if (body.length) body.push(''); body.push('{r}Notes'); q.notes.forEach((n) => body.push(...wrapText(`> ${n}`, w - 20))); }
      const room = Math.floor((y + 195 - 8 - cy) / LINE_H);
      body.slice(0, room).forEach((l, i) => drawText(ctx, l, x + 10, cy + i * LINE_H, { color: INK, shadow: null }));
    },
  };
}

function calendarPanel(sc) {
  const t = sc.state.time;
  let season = t.season, data = buildCalendarData(sc.state, season);
  const grid = new CalendarGrid({
    services: sc.services, season, year: t.year, today: t.day, data, x: 8, y: 40, cursor: t.day,
    detail: (d) => calendarDayLines(season, d, data),
  });
  const setSeason = (s, cursor) => {
    season = s; data = buildCalendarData(sc.state, season);
    grid.season = s; grid.data = data; grid.today = s === t.season ? t.day : null; grid.cursor = cursor;
    sc.sfx('page');
  };
  return {
    interactive: true, hint: 'Arrows: pick day (past the edge: season)    Cancel: back',
    refresh() { data = buildCalendarData(sc.state, season); grid.data = data; },
    update(dt, input) {
      if (input.repeat('left') && grid.cursor === 1) { const p = stepSeason(season, t.year, -1); if (p) { setSeason(p.season, 28); return undefined; } }
      if (input.repeat('right') && grid.cursor === 28) { const n = stepSeason(season, t.year, 1); if (n) { setSeason(n.season, 1); return undefined; } }
      const r = pump(grid, dt, input);
      return r === 'back' ? 'back' : undefined;
    },
    draw(ctx) {
      grid.draw(ctx);
      const x = 226, y = 40, w = 86;
      drawWindow(ctx, x, y, w, 112, 'menu');
      drawText(ctx, SEASON_LABEL[season], x + w / 2, y + 8, { color: THEME.gold, shadow: THEME.navyDeep, align: 'center' });
      drawText(ctx, `Year ${t.year}`, x + w / 2, y + 19, { color: '#cfd3ec', shadow: THEME.navyDeep, align: 'center' });
      const idx = SEASONS.indexOf(season);
      drawText(ctx, '◄', x + 8, y + 8, { color: idx > 0 ? THEME.gold : '#4a5896', shadow: THEME.navyDeep });
      drawText(ctx, '►', x + w - 14, y + 8, { color: idx < 3 ? THEME.gold : '#4a5896', shadow: THEME.navyDeep });
      ctx.fillStyle = '#4a5896'; ctx.fillRect(x + 8, y + 32, w - 16, 1);
      const leg = [['★', '#e0a020', 'Festival'], ['', '#d0443a', 'Exam'], ['', '#ee6a9a', 'Birthday'], ['', '#7fb4ff', 'Break']];
      leg.forEach(([g, c, label], i) => {
        const ly = y + 40 + i * 14;
        if (g) drawText(ctx, g, x + 10, ly, { color: c, shadow: null });
        else { ctx.fillStyle = c; ctx.fillRect(x + 10, ly + 2, 6, 4); }
        drawText(ctx, label, x + 24, ly, { color: '#ffffff', shadow: THEME.navyDeep });
      });
    },
  };
}

function recordsPanel(sc) {
  let list = null, rec = null;
  const build = () => {
    rec = buildRecords(sc.state, saveApi(sc.game).meta());
    const items = rec.exams.length ? rec.exams.map((e) => ({ label: e.label, value: e.average !== null ? `${Math.round(e.average)}` : '' })) : [{ label: 'No exams yet', disabled: true }];
    list = new ListMenu({ services: sc.services, style: 'parchment', x: 8, y: 27, w: 122, rows: 7, items });
  };
  build();
  return {
    interactive: true, hint: 'Up/Down: choose exam    Cancel: back',
    refresh() { build(); },
    update(dt, input) {
      if (!rec.exams.length) return input.pressed('cancel') ? 'back' : undefined;
      return pump(list, dt, input) === 'back' ? 'back' : undefined;
    },
    draw(ctx) {
      list.draw(ctx);
      // attendance
      const a = rec.attendance;
      drawWindow(ctx, 8, 128, 122, 94, 'parchment');
      drawText(ctx, 'Attendance', 18, 135, { color: HEAD, shadow: null });
      [['Present', a.present], ['Late', a.late], ['Absent', a.absent], ['Skipped days', a.skipped]].forEach(([k, v], i) => {
        drawText(ctx, k, 18, 148 + i * 12, { color: INK, shadow: null });
        drawText(ctx, String(v), 120, 148 + i * 12, { color: INK, shadow: null, align: 'right' });
      });
      drawText(ctx, `Average ${rec.average}`, 18, 198, { color: HEAD, shadow: null });
      drawText(ctx, rec.standing, 120, 198, { color: INK, shadow: null, align: 'right' });
      // detail
      const e = rec.exams[list.cursor];
      if (e) {
        drawTable(ctx, {
          x: 136, y: 36, title: e.label, rowH: 12,
          columns: [{ key: 'label', label: 'Subject', w: 96 }, { key: 'score', label: 'Score', w: 66, align: 'right' }],
          rows: e.subjects.map((s) => ({ label: s.label, score: s.score === null ? '-' : String(Math.round(s.score)) })),
          footer: { label: e.rank !== null ? `Total  (rank ${e.rank})` : 'Total', score: e.total !== null ? String(Math.round(e.total)) : '-' },
        });
        const c = e.card;
        drawWindow(ctx, 136, 152, 176, 28, 'parchment');
        drawText(ctx, c ? 'Report card' : 'No report card yet', 144, 158, { color: HEAD, shadow: null });
        if (c) drawText(ctx, `Avg ${Math.round(c.average)}  Rank ${c.rank}  ${prettify(c.standing)}`, 144, 169, { color: INK, shadow: null });
      } else {
        drawWindow(ctx, 136, 36, 176, 60, 'parchment');
        drawText(ctx, 'Exam results will appear here.', 224, 62, { color: '#7a6a50', shadow: null, align: 'center' });
      }
      drawWindow(ctx, 136, 186, 176, 36, 'parchment');
      drawText(ctx, 'Endings seen', 144, 192, { color: HEAD, shadow: null });
      const es = rec.endings.length ? rec.endings.join(', ') : 'None yet';
      wrapText(es, 160).slice(0, 2).forEach((l, i) => drawText(ctx, l, 144, 203 + i * 9, { color: INK, shadow: null }));
    },
  };
}

function systemPanel(sc) {
  const items = [
    { label: 'Save Game', value: '', id: 'save' }, { label: 'Load Game', id: 'load' },
    { label: 'Settings', id: 'settings' }, { label: 'Return to Title', id: 'title' },
  ];
  const list = new ListMenu({ services: sc.services, x: 96, y: 62, w: 128, rows: 4, items, title: 'System' });
  return {
    interactive: true, hint: 'Confirm: select    Cancel: back',
    update(dt, input) {
      const r = pump(list, dt, input);
      if (r === 'back') return 'back';
      if (r && r.select) sc.system(r.select.item.id);
      return undefined;
    },
    draw(ctx) {
      list.draw(ctx);
      drawText(ctx, 'Progress is saved automatically each night.', 160, 140, { color: '#9aa4d0', shadow: THEME.navyDeep, align: 'center' });
    },
  };
}

const FACTORIES = { status: statusPanel, items: itemsPanel, friends: friendsPanel, journal: journalPanel, calendar: calendarPanel, records: recordsPanel, system: systemPanel };

// ------------------------------------------------------------------ scene
export class PauseScene extends MenuScene {
  /** params: { tab?: id, only?: id } (`only` = single screen without tab bar). */
  constructor(game, params = {}) {
    super(game, params);
    this.only = params.only || null;
    this.state = game.sim.state;
    this.panels = {};
    const start = this.only || params.tab || 'status';
    this.tabIndex = Math.max(0, PAUSE_TABS.findIndex(([id]) => id === start));
    this.focus = this.only && this.panel().interactive ? 'content' : 'tabs';
    this.tabBar = new TabBar({ services: this.services, labels: PAUSE_TABS.map((t) => t[1]), index: this.tabIndex, x: 2, y: 4, w: 316, onChange: (i) => { this.tabIndex = i; this.panel().refresh && this.panel().refresh(); } });
  }
  get transparent() { return true; }
  enter() { this.sfx('page'); }
  get tabId() { return PAUSE_TABS[this.tabIndex][0]; }
  panel() { return this.panels[this.tabId] || (this.panels[this.tabId] = FACTORIES[this.tabId](this)); }

  system(id) {
    const g = this.game;
    if (id === 'save') openScene(g, 'save_menu');
    else if (id === 'settings') openScene(g, 'settings');
    else if (id === 'load') {
      openScene(g, 'load_menu').then((r) => { if (r && r.loaded) g.scenes.pop(r); });
    } else if (id === 'title') {
      this.confirm('Return to the title screen? Unsaved progress since the last night is lost.', (yes) => { if (yes) goToTitle(g); });
    }
  }
  close(result = {}) { this.game.scenes.pop(result); }

  resume() { const p = this.panel(); if (p.refresh) p.refresh(); }

  update(dt, input) {
    if (this.updateModal(dt, input)) return;
    if (this.t < 0.1) return;
    const panel = this.panel();
    const closeKey = input.pressed('menu') && !input.pressed('cancel');
    if (closeKey) { this.sfx('cancel'); this.close(); return; }
    if (this.focus === 'content') {
      const r = panel.update(dt, input);
      if (r === 'back') { if (this.only) this.close(); else this.focus = 'tabs'; }
      return;
    }
    if (!this.only) this.tabBar.update(dt, input);
    if (input.pressed('cancel')) { this.sfx('cancel'); this.close(); return; }
    if (panel.interactive && (input.pressed('confirm') || input.pressed('down'))) {
      this.sfx('confirm'); this.focus = 'content';
    }
  }

  draw(ui) {
    const ctx = ui.ctx;
    drawWindow(ctx, 0, 0, 320, 240, 'dim');
    if (this.only) {
      const label = PAUSE_TABS[this.tabIndex][1];
      drawWindow(ctx, 8, 4, 304, 18, 'menu');
      drawText(ctx, label, 160, 9, { color: THEME.gold, shadow: THEME.navyDeep, align: 'center' });
    } else {
      this.tabBar.draw(ctx);
      if (this.focus === 'content') { ctx.fillStyle = 'rgba(8,10,24,0.0)'; }
    }
    const panel = this.panel();
    panel.draw(ctx);
    drawHints(this.game, ctx, this.focus === 'tabs' ? (panel.interactive ? 'Left/Right: tab    Confirm/Down: open    Cancel: close' : 'Left/Right: tab    Cancel: close') : panel.hint);
    this.drawNotice(ctx, 206);
    this.drawModal(ctx);
    void measureText;
  }
}
