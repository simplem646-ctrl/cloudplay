/** Items, money, energy, cottage chest helpers. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { STACK_MAX, ENERGY, STORAGE_CAPACITY } from '../core/constants.js';
import { clamp } from '../core/util.js';
import { itemDef, itemName, toast, sfx } from './kit.js';

const st = () => Game.state;

function stackMax(id) {
  const d = itemDef(id);
  if (d?.key || d?.category === 'key') return 1;
  return Math.max(1, Math.min(d?.stack ?? STACK_MAX, STACK_MAX));
}

/** Container accessor: 'inventory' (default) | 'storage'. */
function box(which = 'inventory') {
  const c = st()[which];
  if (which === 'storage') {
    if (!Array.isArray(c.slots)) c.slots = [];
    while (c.slots.length < (c.capacity || STORAGE_CAPACITY)) c.slots.push(null);
  }
  return c;
}

/** Add into a container; returns the number added. */
function addTo(which, id, qty) {
  const c = box(which);
  const max = stackMax(id);
  let left = qty;
  for (const s of c.slots) {
    if (left <= 0) break;
    if (s && s.id === id && s.qty < max) {
      const n = Math.min(max - s.qty, left);
      s.qty += n;
      left -= n;
    }
  }
  for (let i = 0; i < c.slots.length && left > 0; i++) {
    if (!c.slots[i]) {
      const n = Math.min(max, left);
      c.slots[i] = { id, qty: n };
      left -= n;
    }
  }
  return qty - left;
}
function countIn(which, id) {
  return box(which).slots.reduce((a, s) => a + (s && s.id === id ? s.qty : 0), 0);
}
function removeFrom(which, id, qty) {
  if (countIn(which, id) < qty) return false;
  const c = box(which);
  let left = qty;
  for (let i = c.slots.length - 1; i >= 0 && left > 0; i--) {
    const s = c.slots[i];
    if (s && s.id === id) {
      const n = Math.min(s.qty, left);
      s.qty -= n;
      left -= n;
      if (s.qty <= 0) c.slots[i] = null;
    }
  }
  return true;
}
function room(which, id) {
  const max = stackMax(id);
  return box(which).slots.reduce((a, s) => a + (!s ? max : s.id === id ? max - s.qty : 0), 0);
}

const changed = () => Game.bus.emit(EVT.INVENTORY_CHANGED);

export const inventory = {
  stackMax,
  slots: () => st().inventory.slots,

  /** Add to the pack. Returns the leftover that did not fit. Toasts unless opts.silent. */
  add(id, qty = 1, o = {}) {
    if (!st() || qty <= 0) return 0;
    const added = addTo('inventory', id, qty);
    const leftover = qty - added;
    if (added > 0) {
      Game.bus.emit(EVT.ITEM_GAIN, { id, qty: added });
      changed();
      if (!o.silent) {
        toast(`${itemName(id)}${added > 1 ? ` ×${added}` : ''}`, { kind: 'item', icon: id });
        sfx(itemDef(id)?.key ? 'item_get_rare' : 'item_get');
      }
    }
    if (leftover > 0 && !o.silent) toast('Your pack is full.', { kind: 'warn' });
    return leftover;
  },
  /** Remove qty if the pack holds that many. Returns boolean. */
  remove(id, qty = 1) {
    if (qty <= 0) return true;
    if (!removeFrom('inventory', id, qty)) return false;
    Game.bus.emit(EVT.ITEM_LOSE, { id, qty });
    changed();
    return true;
  },
  /** Remove up to `qty` from a specific slot index. Returns {id, qty}|null. */
  removeSlot(i, qty = 1) {
    const s = st().inventory.slots[i];
    if (!s) return null;
    const n = Math.min(qty, s.qty);
    const id = s.id;
    s.qty -= n;
    if (s.qty <= 0) st().inventory.slots[i] = null;
    Game.bus.emit(EVT.ITEM_LOSE, { id, qty: n });
    changed();
    return { id, qty: n };
  },
  count: (id) => (st() ? countIn('inventory', id) : 0),
  has: (id, qty = 1) => inventory.count(id) >= qty,
  /** Could `qty` of `id` be added without loss? */
  canFit: (id, qty = 1) => room('inventory', id) >= qty,
  freeSlots: () => st().inventory.slots.filter((s) => !s).length,

  // ---- chest ----
  storage: {
    slots: () => box('storage').slots,
    add: (id, qty = 1) => {
      const n = addTo('storage', id, qty);
      return qty - n;
    },
    remove: (id, qty = 1) => removeFrom('storage', id, qty),
    count: (id) => countIn('storage', id),
    /** Pack slot -> chest. Returns number moved. */
    deposit(i, qty = Infinity) {
      const s = st().inventory.slots[i];
      if (!s) return 0;
      const want = Math.min(qty, s.qty);
      const n = addTo('storage', s.id, want);
      if (n > 0) {
        s.qty -= n;
        if (s.qty <= 0) st().inventory.slots[i] = null;
        changed();
      }
      return n;
    },
    /** Chest slot -> pack. Returns number moved. */
    withdraw(i, qty = Infinity) {
      const s = box('storage').slots[i];
      if (!s) return 0;
      const want = Math.min(qty, s.qty);
      const n = addTo('inventory', s.id, want);
      if (n > 0) {
        s.qty -= n;
        if (s.qty <= 0) box('storage').slots[i] = null;
        Game.bus.emit(EVT.ITEM_GAIN, { id: s.id, qty: n });
        changed();
      }
      return n;
    },
  },
  /** Give to the pack; whatever does not fit goes to the cottage chest. Used for rewards / key items. */
  give(id, qty = 1, o = {}) {
    const left = inventory.add(id, qty, { silent: true, ...o });
    if (!o.silent) {
      toast(`${itemName(id)}${qty > 1 ? ` ×${qty}` : ''}`, { kind: 'item', icon: id });
      sfx(itemDef(id)?.key ? 'item_get_rare' : 'item_get');
    }
    if (left > 0) {
      inventory.storage.add(id, left);
      toast('Your pack was full — the rest was sent to your cottage chest.', { kind: 'warn' });
    }
  },

  // ---- money ----
  money: () => st().player.money,
  addMoney(n) {
    if (!n) return;
    const p = st().player;
    p.money = Math.max(0, p.money + n);
    if (n > 0) st().stats.earned += n;
    Game.bus.emit(EVT.MONEY_CHANGE, { delta: n, total: p.money });
    if (n > 0) sfx('coin');
  },
  /** Pay n coins. Returns false (with a toast) if you cannot afford it. */
  spend(n) {
    if (n <= 0) return true;
    const p = st().player;
    if (p.money < n) {
      toast("You don't have enough coins.", { kind: 'warn' });
      sfx('ui_error');
      return false;
    }
    p.money -= n;
    st().stats.spent += n;
    Game.bus.emit(EVT.MONEY_CHANGE, { delta: -n, total: p.money });
    return true;
  },

  // ---- energy ----
  energy: () => st().player.energy,
  addEnergy(n) {
    const p = st().player;
    p.energy = clamp(p.energy + n, 0, p.maxEnergy ?? ENERGY.max);
    Game.bus.emit(EVT.ENERGY_CHANGE, { value: p.energy });
  },
  setEnergy(v) {
    const p = st().player;
    p.energy = clamp(Math.round(v), 0, p.maxEnergy ?? ENERGY.max);
    Game.bus.emit(EVT.ENERGY_CHANGE, { value: p.energy });
  },
  /** Spend energy for an activity. Refused (false + gentle toast) when already at 0. */
  spendEnergy(cost) {
    if (!cost || cost <= 0) return true;
    if (st().player.energy <= 0) {
      toast("You're too tired to do that right now. Try eating something or resting.", { kind: 'warn' });
      return false;
    }
    inventory.addEnergy(-cost);
    return true;
  },

  /** Use the item in a pack slot (food -> energy). */
  useItem(slot) {
    const s = st()?.inventory.slots[slot];
    if (!s) return false;
    const d = itemDef(s.id);
    const food = d && (d.category === 'food' || typeof d.energy === 'number') && typeof d.energy === 'number';
    if (!food) {
      toast("That isn't something you can use right now.", { kind: 'info' });
      return false;
    }
    inventory.removeSlot(slot, 1);
    inventory.addEnergy(d.energy);
    toast(`Ate ${d.name}. +${d.energy} energy`, { kind: 'item', icon: s.id });
    sfx('item_get');
    return true;
  },
};
