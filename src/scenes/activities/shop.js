// Scene 'shop': params { shop: SHOP_ID } -> { bought: [{ item, qty }] }.
// Keeper greets (or says when the shop opens and you leave) -> stock ListMenu (icons, prices, dimmed when unaffordable / bag full / sold out)
// -> quantity picker 1-9 -> confirm -> sim.shop.buy -> thank-you line -> back to the list; Cancel leaves.
// Pure helpers (Node-testable): shopRows, maxQty, closedLine, keeperLines, buyFailLine.
import { ListMenu, NumberPicker, ConfirmBox, DialogueBox, drawText, drawWindow, drawIconSafe, wrapText, LINE_H, THEME } from '../../ui/index.js';
import { PORTRAIT_SHEET } from '../../data/sheet_layout.js';
import { CURRENCY } from '../../core/constants.js';
import { parseTime } from '../../core/util.js';
import { SHOP_BY_ID } from '../../data/shops.js';
import { CAST_BY_ID } from '../../data/cast.js';
import { dayInfo } from '../../sim/calendar.js';
import { canAdd } from '../../sim/inventory.js';
import { AcademicScene } from '../academics/common.js';

export const MAX_QTY = 9;

/** The status shown in place of the price when a row cannot be bought: 'sold out' | 'bag full' | 'too dear' | null. */
export function rowStatus(row) {
  if (row.soldOut) return 'sold out';
  if (!row.canCarry) return 'bag full';
  if (!row.affordable) return 'too dear';
  return null;
}

/** ListMenu items from `sim.shop.list` rows. Unbuyable rows are disabled; the value column shows the price or the reason. */
export function shopRows(rows) {
  return rows.map((r) => {
    const status = rowStatus(r);
    const lim = r.limit !== null && r.limit !== undefined && !r.soldOut ? `  (${r.remaining} left today)` : '';
    return { label: r.name, value: status || `${CURRENCY}${r.price}`, icon: r.icon, disabled: !!status, id: r.item, price: r.price, row: r, desc: `${r.desc || ''}${lim}`.trim() };
  });
}

/** Largest quantity (1-9) the player can take: money, daily limit remaining and bag room. 0 = cannot buy. `fits(q)` tells if q fits in the bag. */
export function maxQty(row, money, fits = () => true) {
  let q = 0;
  const cap = Math.min(MAX_QTY, row.remaining === undefined ? Infinity : row.remaining, row.price > 0 ? Math.floor(money / row.price) : MAX_QTY);
  while (q < cap && fits(q + 1)) q++;
  return q;
}

const DAY_NAME = { Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday', Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday' };
const hhmm = (s) => { const m = parseTime(s) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

/** What the keeper says when the shop is closed. `now` = { weekday, minute, isSchoolDay }. */
export function closedLine(shop, now) {
  const o = shop.open;
  if (!o) return 'The machine is out of order.';
  if (o.weekdays && !o.weekdays.includes(now.weekday)) {
    const days = o.weekdays.length >= 6 ? `every day but ${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].filter((d) => !o.weekdays.includes(d)).map((d) => DAY_NAME[d]).join('')}` : o.weekdays.map((d) => DAY_NAME[d]).join(', ');
    return `We are closed on ${DAY_NAME[now.weekday]}s. Come by ${days}, ${hhmm(o.from)} to ${hhmm(o.to)}.`;
  }
  if (o.schoolDay && !now.isSchoolDay) return `We only open on school days, ${hhmm(o.from)} to ${hhmm(o.to)}.`;
  if (now.minute < parseTime(o.from)) return `We are not open yet. Come back at ${hhmm(o.from)}.`;
  return `We are closed for the day. We open again at ${hhmm(o.from)}.`;
}

/** 'HH:MM - HH:MM' opening hours (26:00 shows as 02:00); always-open machines say so. */
export function hoursText(shop) {
  if (!shop || !shop.open) return 'Always open';
  return `${hhmm(shop.open.from)} - ${hhmm(shop.open.to)}`;
}

/** Greeting / thanks / goodbye lines (seeded pick by `n`). */
export function keeperLines(kind, n = 0) {
  const L = {
    greet: ['Welcome in! Take a look around.', 'Hello there! What can I get you?', 'Good to see you. Have a look!'],
    thanks: ['Thank you! Anything else?', 'There you go. Enjoy!', 'Thanks a lot! Something else?'],
    bye: ['See you again soon!', 'Come back any time.', 'Take care now!'],
  };
  const a = L[kind];
  return a[Math.abs(n) % a.length];
}

export const buyFailLine = (reason) => ({
  money: 'You do not have enough money for that.',
  full: 'Your bag is full. Make some room first.',
  limit: 'That is all I can sell you today.',
  closed: 'Sorry, we just closed.',
  out_of_season: 'That is out of season.',
}[reason] || 'Sorry, I cannot sell you that right now.');

const rect = (ctx, c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(x | 0, y | 0, w | 0, h | 0); };

function drawShopBack(ctx, shopId, t) {
  const cafe = shopId === 'cafe_menu';
  rect(ctx, cafe ? '#e8d0a0' : '#cfd8e8', 0, 0, 320, 240);
  rect(ctx, cafe ? '#c9a870' : '#a8b4cc', 0, 0, 320, 10);
  for (let x = 0; x < 320; x += 24) rect(ctx, cafe ? '#dcc490' : '#bcc8dc', x, 10, 2, 150);
  rect(ctx, cafe ? '#a8744a' : '#8a96b0', 0, 160, 320, 80);
  for (let y = 160; y < 240; y += 14) rect(ctx, cafe ? '#966440' : '#7a86a0', 0, y, 320, 1);
  // shelves
  for (let s = 0; s < 3; s++) {
    rect(ctx, '#7a4f2e', 8, 40 + s * 36, 300, 4);
    for (let i = 0; i < 18; i++) rect(ctx, ['#e8645a', '#f2b84b', '#7fb4ff', '#7fd36a', '#f4a6c8', '#fff7de'][(i + s * 2) % 6], 12 + i * 16, 26 + s * 36 + (i % 3) * 2, 11, 14 - (i % 3) * 2);
  }
  rect(ctx, '#7a4f2e', 0, 176, 320, 8); rect(ctx, '#b07a44', 0, 184, 320, 40);
  rect(ctx, 'rgba(255,255,255,0.4)', 20 + ((t * 10) % 280), 14, 3, 3);
}

export class ShopScene extends AcademicScene {
  constructor(game, params = {}) {
    super(game, params);
    this.shopId = params.shop;
    this.shop = SHOP_BY_ID[this.shopId] || null;
    this.bought = new Map();
    this.line = null;
    this.visits = 0;
  }
  get keeper() { return this.shop && this.shop.keeper; }
  get keeperName() { const c = this.keeper && CAST_BY_ID && CAST_BY_ID[this.keeper]; return c ? (c.short || c.name) : 'Shopkeeper'; }

  say(text, face, cb) {
    this.ask(new DialogueBox({ services: this.services, who: this.keeper || 'unknown', name: this.keeper ? this.keeperName : 'Clerk', text, face: face || 'neutral' }), cb);
  }
  done() {
    this.finish({ bought: [...this.bought].map(([item, qty]) => ({ item, qty })) });
  }

  enter() {
    this.sheet = (this.keeper && this.services.getPortraitSheet && this.services.getPortraitSheet(this.keeper)) || null;
    if (!this.shop) { this.setMode('talk'); this.say('This shop is not open for business.', 'neutral', () => this.done()); return; }
    if (!this.sim.shop.isOpen(this.shopId)) {
      this.setMode('talk');
      const d = dayInfo(this.state);
      this.say(closedLine(this.shop, { weekday: d.weekday, minute: this.state.time.minute, isSchoolDay: d.isSchoolDay }), 'neutral', () => this.done());
      return;
    }
    this.setMode('talk');
    this.say(keeperLines('greet', this.state.time.absDay || 0), 'happy', () => this.browse());
  }

  rows() { return this.sim.shop.list(this.shopId); }

  browse(keep = 0) {
    this.setMode('browse');
    const items = shopRows(this.rows());
    this.cursorItem = items[keep] || null;
    this.ask(new ListMenu({
      services: this.services, items, x: 8, y: 22, w: 196, rows: 7, title: this.shop.name, cursor: keep, cancellable: true,
      onCursor: (i, it) => { this.cursorItem = it; },
    }), (r) => {
      if (!r) { this.setMode('talk'); this.say(keeperLines('bye', this.state.time.absDay || 0), 'happy', () => this.done()); return; }
      this.choose(r.item, r.index);
    });
  }

  choose(item, index) {
    const row = item.row;
    const fits = (q) => canAdd(this.state, row.item, q);
    const max = maxQty(row, this.state.player.money, fits);
    if (max < 1) { this.sfx('error'); this.browse(index); return; }
    this.setMode('qty');
    this.ask(new NumberPicker({ services: this.services, label: row.name, min: 1, max, value: 1, unitPrice: row.price, currency: CURRENCY, x: 36, y: 56 }), (qty) => {
      if (!qty) { this.browse(index); return; }
      this.setMode('confirm');
      this.ask(new ConfirmBox({ services: this.services, message: `Buy ${qty} ${row.name} for ${CURRENCY}${qty * row.price}?`, yes: 'Buy', no: 'No', defaultYes: true }), (yes) => {
        if (!yes) { this.browse(index); return; }
        this.purchase(row, qty, index);
      });
    });
  }

  purchase(row, qty, index) {
    const res = this.sim.shop.buy(this.shopId, row.item, qty);
    this.setMode('talk');
    if (res && res.ok) {
      this.sfx('coin');
      this.bought.set(row.item, (this.bought.get(row.item) || 0) + res.bought);
      this.visits++;
      this.say(keeperLines('thanks', this.visits + (this.state.time.absDay || 0)), 'happy', () => this.browse(index));
    } else {
      this.sfx('error');
      this.say(buyFailLine(res && res.reason), 'sad', () => this.browse(index));
    }
  }

  step(dt, input) { this.tickWidget(dt, input); }

  drawKeeper(ctx) {
    const x = 218, y = 22, S = PORTRAIT_SHEET.size;
    drawWindow(ctx, x - 4, y - 4, S + 8, S + 20, 'parchment');
    drawWindow(ctx, x - 2, y - 2, S + 4, S + 4, 'parchment');
    if (this.sheet && this.sheet.canvas) ctx.drawImage(this.sheet.canvas, 0, 0, S, S, x, y, S, S);
    else { ctx.fillStyle = '#b9a47a'; ctx.fillRect(x, y, S, S); ctx.fillStyle = '#8a7650'; ctx.fillRect(x + 14, y + 10, 20, 20); ctx.fillRect(x + 8, y + 32, 32, 16); }
    drawText(ctx, this.keeperName, x + S / 2, y + S + 4, { color: THEME.ink, shadow: null, align: 'center' });
  }

  draw(ui) {
    const ctx = ui.ctx;
    drawShopBack(ctx, this.shopId, this.t);
    const talking = this.mode === 'talk';
    if (this.shop) this.drawKeeper(ctx);
    if (this.shop && !talking) {
      // money + hours + description
      drawWindow(ctx, 216, 92, 96, 40, 'menu');
      drawText(ctx, 'Money', 224, 99, { color: THEME.gold, shadow: THEME.navyDeep });
      drawText(ctx, `${CURRENCY}${this.state.player.money}`, 304, 99, { color: '#ffffff', shadow: THEME.navyDeep, align: 'right' });
            drawText(ctx, hoursText(this.shop), 264, 113, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
      const it = this.cursorItem;
      drawWindow(ctx, 8, 168, 304, 64, 'tooltip');
      if (it) {
        drawIconSafe(ui, ctx, it.icon, 16, 176);
        drawText(ctx, it.label, 38, 178, { color: THEME.gold, shadow: THEME.navyDeep });
        drawText(ctx, `${CURRENCY}${it.price}`, 304, 178, { color: '#ffffff', shadow: THEME.navyDeep, align: 'right' });
        wrapText(it.desc || '', 280).slice(0, 3).forEach((l, i) => drawText(ctx, l, 16, 194 + i * LINE_H, { color: THEME.cream, shadow: THEME.navyDeep }));
      }
    }
    if (this.widget) this.widget.draw(ctx);
  }
}
