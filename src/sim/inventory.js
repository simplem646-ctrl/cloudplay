// Inventory: `state.inventory` = { itemId: qty }. Capacity = 30 stacks (distinct item ids),
// 99 per stack (balance.js). Functions mutate `state` in place and emit on `opts.bus`.

import { bus as defaultBus } from '../core/bus.js';
import { ITEM_BY_ID } from '../data/items.js';
import { SUBJECTS } from '../core/constants.js';
import { BALANCE } from './balance.js';
import { addEnergy, addStat, setFlag } from './player.js';

const B = (o) => (o && o.bus) || defaultBus;
const bal = (o) => (o && o.balance) || BALANCE;

export const count = (state, id) => state.inventory[id] || 0;
export const has = (state, id, qty = 1) => count(state, id) >= qty;
export const stackCount = (state) => Object.keys(state.inventory).length;
export const isFull = (state, opts) => stackCount(state) >= bal(opts).inventory.maxStacks;
export const itemOf = (id) => ITEM_BY_ID[id] || null;

/** How many of `id` still fit (0 for unknown ids). */
export function room(state, id, opts) {
  if (!ITEM_BY_ID[id]) return 0;
  const b = bal(opts).inventory;
  const have = count(state, id);
  if (have === 0) return stackCount(state) >= b.maxStacks ? 0 : b.maxStack;
  return Math.max(0, b.maxStack - have);
}
export const canAdd = (state, id, qty = 1, opts) => qty > 0 && room(state, id, opts) >= qty;

/**
 * Add up to `qty` items. Returns how many were actually added (0..qty): less than `qty` when the bag
 * is full (30 stacks) or the stack is at 99, 0 for unknown ids. Emits `item:gained` { item, qty }.
 */
export function add(state, id, qty = 1, opts = {}) {
  qty = Math.floor(qty);
  if (!(qty > 0)) return 0;
  const n = Math.min(qty, room(state, id, opts));
  if (n <= 0) return 0;
  state.inventory[id] = count(state, id) + n;
  B(opts).emit('item:gained', { item: id, qty: n });
  return n;
}

/** Remove exactly `qty` (all or nothing). Returns true on success. Emits `item:removed`. */
export function remove(state, id, qty = 1, opts = {}) {
  qty = Math.floor(qty);
  if (!(qty > 0) || count(state, id) < qty) return false;
  const left = count(state, id) - qty;
  if (left === 0) delete state.inventory[id];
  else state.inventory[id] = left;
  B(opts).emit('item:removed', { item: id, qty });
  return true;
}

/** Sorted list for menus: [{ id, qty, item }] by category, then name. */
export function list(state, category) {
  const order = ['food', 'gift', 'study', 'sport', 'misc', 'key'];
  return Object.entries(state.inventory)
    .map(([id, qty]) => ({ id, qty, item: ITEM_BY_ID[id] }))
    .filter((e) => e.item && (!category || e.item.category === category))
    .sort((a, b) => order.indexOf(a.item.category) - order.indexOf(b.item.category) || a.item.name.localeCompare(b.item.name));
}

const mealSlot = (minute) => (minute < 10 * 60 + 30 ? 'breakfast' : minute < 15 * 60 + 30 ? 'lunch' : 'dinner');

/**
 * Use an item. Effects of `item.use`: energy (+/-), stat ({subject|trait: delta}, with diminishing
 * returns on high knowledge), flag (name or {name, value}), meal (marks today's meal as eaten).
 * The item is consumed unless `use.keep`. Returns { ok, reason?, consumed, effects } with
 * effects = { energy, stats: {name: appliedDelta}, flag, meal }. reasons: unknown_item | no_item | not_usable.
 * Emits `item:used` { item, effects }.
 */
export function use(state, id, opts = {}) {
  const item = ITEM_BY_ID[id];
  if (!item) return { ok: false, reason: 'unknown_item', consumed: false, effects: {} };
  if (!has(state, id)) return { ok: false, reason: 'no_item', consumed: false, effects: {} };
  const u = item.use;
  if (!u) return { ok: false, reason: 'not_usable', consumed: false, effects: {} };
  const effects = { energy: 0, stats: {}, flag: null, meal: null };
  if (u.energy) effects.energy = addEnergy(state, u.energy, opts);
  if (u.stat) for (const [k, v] of Object.entries(u.stat)) effects.stats[k] = addStat(state, k, v, opts);
  if (u.flag) {
    const name = typeof u.flag === 'string' ? u.flag : u.flag.name;
    const value = typeof u.flag === 'string' ? true : u.flag.value;
    setFlag(state, name, value, opts);
    effects.flag = name;
  }
  if (u.meal && state.daily && state.daily.ate) {
    effects.meal = mealSlot(state.time.minute);
    state.daily.ate[effects.meal] = true;
  }
  const consumed = !u.keep;
  if (consumed) remove(state, id, 1, opts);
  B(opts).emit('item:used', { item: id, effects });
  return { ok: true, consumed, effects };
}

/** Sum of `passive.studyBonus` of carried items for a subject (textbook +1, notebook +1 ...), capped (balance). */
export function studyBonus(state, subject, opts) {
  let sum = 0;
  if (!SUBJECTS.includes(subject)) return 0;
  for (const id of Object.keys(state.inventory)) {
    const sb = ITEM_BY_ID[id] && ITEM_BY_ID[id].passive && ITEM_BY_ID[id].passive.studyBonus;
    if (sb) sum += (sb[subject] || 0) + (sb.all || 0);
  }
  return Math.min(sum, bal(opts).stats.bookBonusMax);
}

/** Sum of `passive.practiceBonus` of carried items (sneakers ...). */
export function practiceBonus(state) {
  let sum = 0;
  for (const id of Object.keys(state.inventory)) {
    const p = ITEM_BY_ID[id] && ITEM_BY_ID[id].passive;
    if (p && p.practiceBonus) sum += p.practiceBonus;
  }
  return sum;
}
