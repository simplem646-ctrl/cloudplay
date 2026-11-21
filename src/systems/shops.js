/** Shop hours, stock, buy/sell. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { timeInRange, rngFor, formatClock12, parseHHMM } from '../core/util.js';
import { svc } from './svc.js';
import { D, dayNum, curSeason, curWeekday, itemDef, itemName, toast, sfx, getFlag, parseLine } from './kit.js';

let current = null; // shopId currently open

function soldRec(shopId) {
  const w = Game.state.world;
  const all = (w.shopSold ||= {});
  const r = all[shopId];
  if (!r || r.day !== dayNum()) return (all[shopId] = { day: dayNum(), counts: {} });
  return r;
}

export const shops = {
  get current() {
    return current;
  },

  /** null when open, else {reason:'locked'|'festival'|'day'|'hours', text}. */
  closedInfo(area, minutes) {
    const b = D().buildings?.[area];
    if (!b || !Game.state) return null;
    const m = minutes ?? Game.state.time.minutes;
    if (b.lockFlag && !getFlag(b.lockFlag)) return { reason: 'locked', text: b.lockedText || b.closedText || 'It is locked.' };
    const fest = svc.events?.festivalToday?.();
    if (fest?.closes?.includes(area)) return { reason: 'festival', text: b.closedText || 'Closed for the festival today.' };
    if (b.closedDays?.includes(curWeekday())) return { reason: 'day', text: b.closedText || 'Closed today.' };
    if (b.open !== undefined && b.close !== undefined && !timeInRange(m, b.open, b.close)) {
      return { reason: 'hours', text: b.closedText || `Closed. Open ${formatClock12(parseHHMM(b.open))} – ${formatClock12(parseHHMM(b.close))}.` };
    }
    return null;
  },
  isOpen: (area, minutes) => !shops.closedInfo(area, minutes),
  closedText: (area, minutes) => shops.closedInfo(area, minutes)?.text || null,

  def: (id) => D().shops?.[id] || null,
  /** Shop id whose counter is this interactable (prefers matching area). */
  findByCounter(counterId, area) {
    const all = Object.values(D().shops || {}).filter((s) => s.counter === counterId);
    return all.find((s) => s.area === area) || all[0] || null;
  },

  /** Current stock: [{itemId, price, left?}] (season filter, per-day limits). */
  stockFor(shopId) {
    const def = shops.def(shopId);
    if (!def) return [];
    const sold = soldRec(shopId).counts;
    const out = [];
    for (const e of def.stock || []) {
      if (e.seasons && !e.seasons.includes(curSeason())) continue;
      const price = e.price ?? itemDef(e.item)?.price?.buy;
      if (price === null || price === undefined) continue;
      const row = { itemId: e.item, price };
      if (e.limit !== undefined) row.left = Math.max(0, e.limit - (sold[e.item] || 0));
      out.push(row);
    }
    return out;
  },

  buy(shopId, itemId, qty = 1) {
    qty = Math.max(1, Math.floor(qty));
    const row = shops.stockFor(shopId).find((r) => r.itemId === itemId);
    if (!row) return { ok: false, reason: 'unknown' };
    if (row.left !== undefined && row.left < qty) return { ok: false, reason: 'soldout' };
    if (!svc.inventory.canFit(itemId, qty)) {
      toast('Your pack is full.', { kind: 'warn' });
      return { ok: false, reason: 'full' };
    }
    const total = row.price * qty;
    if (!svc.inventory.spend(total)) return { ok: false, reason: 'money' };
    svc.inventory.add(itemId, qty, { silent: true });
    if (row.left !== undefined) {
      const c = soldRec(shopId).counts;
      c[itemId] = (c[itemId] || 0) + qty;
    }
    sfx('buy');
    toast(`Bought ${itemName(itemId)}${qty > 1 ? ` ×${qty}` : ''}`, { kind: 'item', icon: itemId });
    return { ok: true, cost: total };
  },

  /** Sell from a pack slot to the open shop (or `shopId`). */
  sell(slot, qty = 1, shopId = current) {
    const def = shopId ? shops.def(shopId) : null;
    if (!def) return { ok: false, reason: 'noshop' };
    const stack = Game.state.inventory.slots[slot];
    if (!stack) return { ok: false, reason: 'empty' };
    const item = itemDef(stack.id);
    const base = item?.price?.sell;
    if (base === null || base === undefined) return { ok: false, reason: 'worthless' };
    if (def.buys !== 'all' && !(Array.isArray(def.buys) && def.buys.includes(item.category))) return { ok: false, reason: 'notbought' };
    qty = Math.max(1, Math.min(Math.floor(qty), stack.qty));
    const gained = Math.floor(base * (def.sellMult ?? 1)) * qty;
    svc.inventory.removeSlot(slot, qty);
    svc.inventory.addMoney(gained);
    sfx('sell');
    return { ok: true, gained };
  },

  /** Open the shop UI. Resolves when the player leaves. */
  async openShop(shopId) {
    const def = shops.def(shopId);
    if (!def) {
      console.warn(`[systems] unknown shop "${shopId}"`);
      return false;
    }
    const ui = Game.ui;
    if (!ui?.shop?.open) return false;
    const prev = Game.mode;
    current = shopId;
    Game.setMode('shop');
    Game.bus.emit(EVT.SHOP_OPEN, { id: shopId });
    const greets = D().dialogue?.[def.owner]?.shop?.greet;
    let greeting = def.greeting;
    if (greets?.length) greeting = parseLine(greets[Math.floor(rngFor('shopgreet', shopId, dayNum())() * greets.length)]).text;
    try {
      await ui.shop.open({
        title: def.name,
        greeting: svc.script ? svc.script.interpolate(greeting || '') : greeting,
        portraitId: def.owner,
        stock: shops.stockFor(shopId),
        canSell: def.buys === 'all' ? true : def.buys || [],
        onBuy: (itemId, qty) => shops.buy(shopId, itemId, qty),
        onSell: (slot, qty) => shops.sell(slot, qty, shopId),
        // refresh hook for UIs that re-query stock after a purchase
        getStock: () => shops.stockFor(shopId),
      });
    } finally {
      current = null;
      Game.bus.emit(EVT.SHOP_CLOSE, { id: shopId });
      if (Game.mode === 'shop') Game.setMode(prev === 'shop' ? 'field' : prev);
    }
    return true;
  },
};
