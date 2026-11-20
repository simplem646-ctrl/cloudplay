// Shops: opening hours, seasonal stock, daily purchase limits, money and bag capacity.
// Data: src/data/shops.js. Purchases of the day are tracked in `state.daily.purchases`
// ({ shopId: { itemId: qty } }), which the daily reset clears. Mutates `state`, emits on `opts.bus`.

import { bus as defaultBus } from '../core/bus.js';
import { parseTime } from '../core/util.js';
import { SHOP_BY_ID } from '../data/shops.js';
import { ITEM_BY_ID } from '../data/items.js';
import { dayInfo } from './calendar.js';
import * as inventory from './inventory.js';
import { addMoney } from './player.js';

export const shopOf = (id) => SHOP_BY_ID[id] || null;

/** Is the shop open right now (or at `opts.minute`)? Unknown shops are closed; `open: null` is always open. */
export function isOpen(state, shopId, opts = {}) {
  const shop = SHOP_BY_ID[shopId];
  if (!shop) return false;
  if (!shop.open) return true;
  const minute = opts.minute === undefined ? state.time.minute : parseTime(opts.minute);
  const d = dayInfo(state);
  const o = shop.open;
  if (o.weekdays && !o.weekdays.includes(d.weekday)) return false;
  if (o.schoolDay && !d.isSchoolDay) return false;
  return minute >= parseTime(o.from) && minute < parseTime(o.to);
}

/** 'HH:MM' opening hours text for UI ("Always open" for machines). */
export function hoursLabel(shopId) {
  const s = SHOP_BY_ID[shopId];
  if (!s) return '';
  if (!s.open) return 'Always open';
  return `${s.open.from}-${s.open.to}`;
}

export const boughtToday = (state, shopId, itemId) =>
  ((state.daily && state.daily.purchases && state.daily.purchases[shopId]) || {})[itemId] || 0;

/**
 * The stock currently on offer (season-filtered) as UI rows:
 * { item, name, icon, desc, category, price, limit, bought, remaining, soldOut, affordable, canCarry }.
 * `remaining` is Infinity without a limit. Unknown shop -> [].
 */
export function list(state, shopId, opts = {}) {
  const shop = SHOP_BY_ID[shopId];
  if (!shop) return [];
  const season = state.time.season;
  const rows = [];
  for (const s of shop.stock) {
    if (s.season && !s.season.includes(season)) continue;
    const item = ITEM_BY_ID[s.item];
    if (!item) continue;
    const price = s.price === undefined ? item.price : s.price;
    const bought = boughtToday(state, shopId, s.item);
    const remaining = s.limit === undefined ? Infinity : Math.max(0, s.limit - bought);
    rows.push({
      item: s.item, name: item.name, icon: item.icon, desc: item.desc, category: item.category, price,
      limit: s.limit === undefined ? null : s.limit, bought, remaining, soldOut: remaining === 0,
      affordable: state.player.money >= price, canCarry: inventory.canAdd(state, s.item, 1, opts),
    });
  }
  return rows;
}

/** Current price of an item in a shop (null if not on offer). */
export function priceOf(state, shopId, itemId) {
  const row = list(state, shopId).find((r) => r.item === itemId);
  return row ? row.price : null;
}

/**
 * Buy `qty` of an item. All-or-nothing. Checks, in order: shop exists, open, stocked this season,
 * daily limit, bag capacity, money. Returns { ok, reason?, bought, spent, total }.
 * reasons: bad_qty | unknown_shop | closed | not_stocked | out_of_season | limit | full | money.
 * `opts.eatNow` eats each purchased item immediately (vending machines, lunch counter).
 * Emits `money:changed`, `item:gained`, `shop:bought` { shop, item, qty, spent }.
 */
export function buy(state, shopId, itemId, qty = 1, opts = {}) {
  qty = Math.floor(qty);
  const res = (reason, extra = {}) => ({ ok: false, reason, bought: 0, spent: 0, total: state.player.money, ...extra });
  if (!(qty > 0)) return res('bad_qty');
  const shop = SHOP_BY_ID[shopId];
  if (!shop) return res('unknown_shop');
  if (!isOpen(state, shopId, opts)) return res('closed');
  const entry = shop.stock.find((s) => s.item === itemId);
  const item = ITEM_BY_ID[itemId];
  if (!entry || !item) return res('not_stocked');
  if (entry.season && !entry.season.includes(state.time.season)) return res('out_of_season');
  const price = entry.price === undefined ? item.price : entry.price;
  if (entry.limit !== undefined && boughtToday(state, shopId, itemId) + qty > entry.limit) return res('limit');
  if (!inventory.canAdd(state, itemId, qty, opts)) return res('full');
  const cost = price * qty;
  if (state.player.money < cost) return res('money', { cost });

  addMoney(state, -cost, opts);
  inventory.add(state, itemId, qty, opts);
  if (!state.daily.purchases) state.daily.purchases = {};
  const day = (state.daily.purchases[shopId] = state.daily.purchases[shopId] || {});
  day[itemId] = (day[itemId] || 0) + qty;
  if (opts.eatNow) for (let i = 0; i < qty; i++) inventory.use(state, itemId, opts);
  (opts.bus || defaultBus).emit('shop:bought', { shop: shopId, item: itemId, qty, spent: cost });
  return { ok: true, bought: qty, spent: cost, total: state.player.money };
}
