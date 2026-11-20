// UI toolkit harness. Build: node scripts/build.mjs --entry src/dev/ui_demo.js --out dist/dev/ui_demo.html
// Query: ?widget=dialogue|choice|list|grid|hud|calendar|table|banner|text|all  (default all). Keys: arrows, Z confirm, X cancel.
// window.__uiDemo = { step(n, actions?), press(action), scene(name), ui, widgets }
import { EXPRESSIONS } from '../core/constants.js';
import { PORTRAIT_SHEET } from '../data/sheet_layout.js';
import {
  UICanvas, DialogueBox, ChoiceBox, ConfirmBox, NumberPicker, ListMenu, GridMenu, TabBar, HUD, ToastStack, Banner, TextPage,
  CalendarGrid, drawTable, drawStatBars, drawHeartsRow, drawWindow, drawText, THEME,
} from '../ui/index.js';

const ui = new UICanvas();
const hashColor = (s) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return `hsl(${h % 360},55%,58%)`; };

// ---- mock services ----
function mockPortraitSheet(who) {
  const S = PORTRAIT_SHEET.size;
  const c = document.createElement('canvas');
  c.width = S * PORTRAIT_SHEET.cols; c.height = S * PORTRAIT_SHEET.rows;
  const g = c.getContext('2d');
  const hair = hashColor(who);
  for (let r = 0; r < PORTRAIT_SHEET.rows; r++) {
    EXPRESSIONS.forEach((e, ci) => {
      const x = ci * S, y = r * S;
      g.fillStyle = '#cfe6f5'; g.fillRect(x, y, S, S);
      g.fillStyle = hair; g.fillRect(x + 8, y + 6, 32, 30);
      g.fillStyle = '#f6cfa8'; g.fillRect(x + 12, y + 14, 24, 24);
      g.fillStyle = '#3b2a1f';
      if (r === 1) { g.fillRect(x + 16, y + 25, 6, 1); g.fillRect(x + 27, y + 25, 6, 1); } else { g.fillRect(x + 17, y + 22, 3, 5); g.fillRect(x + 28, y + 22, 3, 5); }
      g.fillStyle = e === 'sad' ? '#9a5a5a' : '#b0453a';
      if (r === 2) g.fillRect(x + 21, y + 31, 6, 4); else g.fillRect(x + 21, y + 32, 6, e === 'happy' ? 2 : 1);
      g.fillStyle = hair; g.fillRect(x + 12, y + 10, 24, 5);
      g.fillStyle = '#4a5a8a'; g.fillRect(x + 8, y + 40, 32, 8);
    });
  }
  return { canvas: c, ...PORTRAIT_SHEET };
}
const sheets = {};
ui.configure({
  getPortraitSheet: (who) => (sheets[who] ||= mockPortraitSheet(who)),
  drawIcon: (ctx, name, x, y) => {
    ctx.fillStyle = '#1d2340'; ctx.fillRect(x + 1, y + 1, 14, 14);
    ctx.fillStyle = hashColor(name); ctx.fillRect(x + 2, y + 2, 12, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(x + 3, y + 3, 10, 2);
    drawText(ctx, name[0].toUpperCase(), x + 8, y + 4, { color: '#1d2340', shadow: null, align: 'center' });
  },
  sfx: () => {},
});

// ---- fake input driven by keyboard / __uiDemo.press ----
const pending = new Set();
const held = new Set();
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', KeyZ: 'confirm', Enter: 'confirm', KeyX: 'cancel', Escape: 'cancel', ControlLeft: 'fast' };
addEventListener('keydown', (e) => { const a = KEYMAP[e.code]; if (a) { pending.add(a); held.add(a); e.preventDefault(); } });
addEventListener('keyup', (e) => { const a = KEYMAP[e.code]; if (a) held.delete(a); });
let frameActions = new Set();
const input = { pressed: (a) => frameActions.has(a), repeat: (a) => frameActions.has(a), down: (a) => held.has(a) || frameActions.has(a) };

// ---- scenes ----
const hud = new HUD({ services: ui.services });
hud.setData({ season: 'spring', day: 14, weekday: 'Sun', minute: 15 * 60 + 5, weather: 'sunny', money: 320, energy: 72, maxEnergy: 100, festival: 'Blossom Day' });
hud.showLocation('Bell Square');
const toasts = new ToastStack({ services: ui.services });
['Got a Melon Bun!', '+2 hearts: Nina', 'Math +4'].forEach((t, i) => toasts.push({ text: t, icon: ['bread', 'heart_full', 'textbook_math'][i], ttl: 99 }));

const ITEMS = ['Melon Bun', 'Lemon Soda', 'Math Workbook', 'Bouquet', 'Cat Plushie', 'Music Box', 'Stopwatch', 'Sketchbook', 'Hairpin', 'Sports Drink', 'Novel', 'Postcard', 'Dark Chocolate', 'Green Tea'];
const makers = {
  dialogue: () => [new DialogueBox({ services: ui.services, who: 'nina', name: 'Nina', face: 'happy', text: 'Hey, Newbie! You are up early. {y}Race you{/} to the school gate? Loser buys the {p}melon buns{/}!' })],
  choice: () => [new DialogueBox({ services: ui.services, who: 'theo', name: 'Theo', face: 'neutral', text: 'She grins at me, one foot already on the start line.' }),
    new ChoiceBox({ services: ui.services, options: ['Accept the challenge', 'Politely decline', 'Challenge her to a rematch tomorrow', { text: 'Locked option', disabled: true }] })],
  list: () => [new ListMenu({ services: ui.services, title: 'Corner Mart', x: 24, y: 28, w: 200, rows: 6, descBox: true,
    items: ITEMS.map((n, i) => ({ label: n, value: `$${3 + i * 2}`, icon: ['bread', 'soda', 'workbook', 'bouquet', 'plushie', 'music_box', 'stopwatch'][i % 7], desc: `A fine ${n.toLowerCase()}. Somebody will like this.`, disabled: i === 9 })) })],
  grid: () => [new GridMenu({ services: ui.services, title: 'Items', x: 40, y: 24, cols: 8, rows: 4,
    items: ITEMS.concat(ITEMS).map((n, i) => ({ label: n, icon: ['bread', 'soda', 'workbook', 'bouquet', 'plushie', 'music_box', 'stopwatch'][i % 7], qty: (i % 4) + 1, desc: 'Selected item description that wraps across two lines when it is long enough to need it.' })) })],
  hud: () => [],
  calendar: () => [new CalendarGrid({ services: ui.services, season: 'spring', year: 1, today: 14, data: { 1: { festival: 'Entrance Ceremony' }, 5: { festival: 'Club Fair' }, 10: { birthdays: ['Jules'] }, 14: { festival: 'Blossom Day' }, 18: { birthdays: ['Mari'] }, 22: { exam: 'Midterm Exams' }, 23: { exam: 'Midterm Exams' }, 24: { exam: 'Midterm Exams' }, 26: { exam: 'Results day' } } })],
  table: () => [],
  banner: () => [new Banner({ services: ui.services, text: 'Spring, Year 1', sub: 'Bellhaven High - Day 1', ms: 99999 })],
  text: () => [new TextPage({ services: ui.services, speed: 40, lines: [{ text: 'Bellhaven Days', style: 'title' }, { text: 'A school year story', style: 'text' }, { text: '', style: 'blank' }, { text: 'Design', style: 'head' }, { text: 'Created with Claude. Every sprite, tune and line of dialogue is original.', style: 'text' }] })],
};
let widgets = [];
let name = new URLSearchParams(location.search).get('widget') || 'all';
function scene(n) {
  name = n; widgets = [];
  if (n === 'all') widgets = [...makers.choice().slice(0, 1)];
  else widgets = makers[n] ? makers[n]() : [];
}
scene(name);

function drawFrame() {
  ui.beginFrame();
  const ctx = ui.ctx;
  // backdrop: a pretend game screen
  ctx.fillStyle = '#6cc24a'; ctx.fillRect(0, 0, 320, 240);
  ctx.fillStyle = '#e0c88f'; ctx.fillRect(130, 0, 40, 240);
  if (name === 'all' || name === 'hud') { hud.draw(ctx); toasts.draw(ctx); }
  if (name === 'table' || name === 'all') {
    drawTable(ctx, { x: name === 'all' ? 6 : 40, y: name === 'all' ? 60 : 28, title: 'Midterm 1 - Report Card', columns: [{ key: 's', label: 'Subject', w: 90 }, { key: 'sc', label: 'Score', w: 50, align: 'right' }, { key: 'g', label: 'Grade', w: 50, align: 'center' }],
      rows: [{ s: 'Math', sc: 78, g: 'B' }, { s: 'Literature', sc: 91, g: '{g}A' }, { s: 'Science', sc: 64, g: 'C' }, { s: 'History', sc: 70, g: 'B' }], footer: { s: 'Average / Rank', sc: '75.8', g: '8th' } });
    drawStatBars(ctx, name === 'all' ? 6 : 40, name === 'all' ? 150 : 140, [{ label: 'Math', value: 48 }, { label: 'Fitness', value: 72, color: THEME.gold }, { label: 'Charm', value: 30, color: '#f4a6c8' }], { w: 150, style: 'menu' });
    drawHeartsRow(ctx, name === 'all' ? 6 : 40, name === 'all' ? 192 : 180, { points: 63 });
  }
  for (const w of widgets) w.draw(ctx);
  ui.endFrame();
  present();
}

const view = document.createElement('canvas');
view.width = 320; view.height = 240;
view.style.cssText = 'image-rendering:pixelated;width:960px;height:720px;display:block;margin:0 auto;background:#000';
document.body.style.margin = '0';
document.body.style.background = '#17121f';
document.getElementById('app')?.replaceChildren(view);
if (!document.getElementById('app')) document.body.appendChild(view);
const vctx = view.getContext('2d');
vctx.imageSmoothingEnabled = false;
function present() { vctx.clearRect(0, 0, 320, 240); vctx.drawImage(ui.canvas, 0, 0); }

function step(n = 1, actions = []) {
  for (let i = 0; i < n; i++) {
    frameActions = i === 0 ? new Set([...actions, ...pending]) : new Set();
    pending.clear();
    hud.update(1 / 60); toasts.update(1 / 60);
    widgets.forEach((w) => w.update(1 / 60, input));
    // cascade: dialogue finished -> drop it so the choice box becomes the top widget
  }
  drawFrame();
}
let last = performance.now();
function loop(now) { const dt = Math.min(0.1, (now - last) / 1000); last = now; const n = Math.max(1, Math.round(dt * 60)); step(n); requestAnimationFrame(loop); }
requestAnimationFrame(loop);
window.__uiDemo = { ui, step, press: (a) => pending.add(a), scene, get widgets() { return widgets; }, ConfirmBox, NumberPicker, TabBar };
