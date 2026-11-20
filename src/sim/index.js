// Simulation facade. `createSim(state, opts)` groups every module with the state, bus and injectable
// services (storage, gift tastes, schedules, hook registry, condition evaluator) already bound, so scenes
// can write `sim.clock.advance(30)` or `sim.shop.buy('bakery', 'bread', 2)`.
// Every module's raw functions are re-exported too (namespaced) for code that prefers explicit state passing.

import { bus as defaultBus } from '../core/bus.js';
import * as clock from './clock.js';
import * as calendar from './calendar.js';
import * as weather from './weather.js';
import * as relationships from './relationships.js';
import * as inventory from './inventory.js';
import * as shop from './shop.js';
import * as schedule from './schedule.js';
import * as save from './save.js';
import * as player from './player.js';
import { BALANCE } from './balance.js';
import { ITEMS, ITEM_BY_ID } from '../data/items.js';
import { SHOPS, SHOP_BY_ID } from '../data/shops.js';

export { clock, calendar, weather, relationships, inventory, shop, schedule, save, player, BALANCE, ITEMS, ITEM_BY_ID, SHOPS, SHOP_BY_ID };
export * from './clock.js';
export { dayInfo, absDayOf, fromAbsDay, nextFestival, upcoming, dateLabel, addDays } from './calendar.js';

/**
 * Create the facade.
 * opts: { bus, storage, fallback, prefs (gift tastes), schedules, evalCond, hooks (hook registry), now, balance }
 * `sim.ready` is a promise that resolves once gift tastes / schedules have been loaded lazily from the
 * generated content registry (immediately resolved when both were injected). Replace the full condition
 * evaluator with `sim.setEvalCond(fn)` (T7b).
 */
export function createSim(state, opts = {}) {
  const bus = opts.bus || defaultBus;
  const ctx = {
    prefs: opts.prefs || {},
    schedules: opts.schedules || {},
    evalCond: opts.evalCond || schedule.evalCondition,
  };
  const base = () => ({ bus, storage: opts.storage, fallback: opts.fallback, hooks: opts.hooks, now: opts.now, balance: opts.balance });
  // opts objects are rebuilt per call so that late-loaded prefs/schedules are seen
  const live = (extra) => ({ ...base(), ...extra });

  const wrap = (mod, spec, extraOpts) => {
    const out = {};
    for (const [name, n] of Object.entries(spec)) {
      out[name] = (...a) => {
        const args = a.slice(0, n);
        while (args.length < n) args.push(undefined);
        return mod[name](state, ...args, live({ ...(extraOpts ? extraOpts() : {}), ...(a[n] || {}) }));
      };
    }
    return out;
  };

  const sim = {
    state,
    bus,
    balance: opts.balance || BALANCE,
    ctx,
    clock: {
      ...wrap(clock, { advance: 1, setTime: 1, setDate: 1, wake: 0, sleep: 0, collapse: 0 }),
      isDayOver: () => clock.isDayOver(state),
      timeLabel: (o) => clock.timeLabel(state, o),
      registerNewDayHook: (name, fn, o = {}) => clock.registerNewDayHook(name, fn, { registry: opts.hooks, ...o }),
      unregisterNewDayHook: (name) => clock.unregisterNewDayHook(name, opts.hooks),
      listNewDayHooks: (phase) => clock.listNewDayHooks(opts.hooks, phase),
    },
    calendar: {
      dayInfo: (x) => calendar.dayInfo(x === undefined ? state : x),
      today: () => calendar.dayInfo(state),
      dateLabel: (o) => calendar.dateLabel(state, o),
      nextFestival: (o) => calendar.nextFestival(state, o),
      upcoming: (n, o) => calendar.upcoming(state, n, o),
      absDayOf: calendar.absDayOf,
      fromAbsDay: calendar.fromAbsDay,
      addDays: (n) => calendar.addDays(state, n),
    },
    weather: {
      ...wrap(weather, { rollWeather: 0, setWeather: 1 }),
      today: () => state.weather.today,
      tomorrow: () => state.weather.tomorrow,
    },
    relationships: {
      ...wrap(relationships, { talk: 1, addFriendship: 2, markMet: 1, decay: 0, resetDaily: 0 }, () => ({ prefs: ctx.prefs })),
      hearts: (npc) => relationships.hearts(state, npc),
      friendship: (npc) => relationships.friendship(state, npc),
      giftOutcome: (npc, item, prefs) => relationships.giftOutcome(npc, item, prefs || ctx.prefs),
      giveGift: (npc, item, o = {}) => relationships.giveGift(state, npc, item, live({ prefs: ctx.prefs, ...o })),
    },
    inventory: {
      ...wrap(inventory, { add: 2, remove: 2, use: 1, canAdd: 2, room: 1, studyBonus: 1 }),
      count: (id) => inventory.count(state, id),
      has: (id, q) => inventory.has(state, id, q),
      list: (cat) => inventory.list(state, cat),
      isFull: () => inventory.isFull(state),
      stackCount: () => inventory.stackCount(state),
      practiceBonus: () => inventory.practiceBonus(state),
    },
    shop: {
      ...wrap(shop, { buy: 3 }),
      list: (shopId) => shop.list(state, shopId),
      isOpen: (shopId, o) => shop.isOpen(state, shopId, o),
      priceOf: (shopId, itemId) => shop.priceOf(state, shopId, itemId),
      hoursLabel: shop.hoursLabel,
    },
    schedule: {
      resolve: (npc, minute, o = {}) => schedule.resolve(npc, state, minute === undefined ? state.time.minute : minute, { schedules: ctx.schedules, evalCond: ctx.evalCond, ...o }),
      npcsOnMap: (map, minute, o = {}) => schedule.npcsOnMap(state, map, minute === undefined ? state.time.minute : minute, { schedules: ctx.schedules, evalCond: ctx.evalCond, ...o }),
      snapshot: (minute, o = {}) => schedule.snapshot(state, minute === undefined ? state.time.minute : minute, { schedules: ctx.schedules, evalCond: ctx.evalCond, ...o }),
    },
    save: {
      list: () => save.list(live()),
      write: (slot) => save.write(state, slot, live()),
      autosave: () => save.autosave(state, live()),
      read: (slot) => save.read(slot, live()),
      delete: (slot) => save.delete(slot, live()),
      settings: (patch) => save.settings(patch, live()),
      meta: (patch) => save.meta(patch, live()),
      recordEnding: (id) => save.recordEnding(id, live()),
      summary: () => save.summarize(state),
    },
    player: {
      ...wrap(player, { addEnergy: 1, addMoney: 1, addStat: 2, setFlag: 2 }),
      maxEnergy: () => player.maxEnergyFor(state),
    },
    setEvalCond(fn) { ctx.evalCond = fn; },
    setSchedules(s) { ctx.schedules = schedule.indexSchedules(s); },
    setPrefs(p) { ctx.prefs = p || {}; },
    ready: Promise.resolve(),
  };

  // lazy content loading (async: dynamic import of the generated registry)
  const jobs = [];
  if (!opts.prefs) jobs.push(relationships.loadGiftPrefs().then((p) => { ctx.prefs = p; }));
  if (!opts.schedules) jobs.push(schedule.loadSchedules().then((s) => { ctx.schedules = s; }));
  else ctx.schedules = schedule.indexSchedules(opts.schedules);
  if (jobs.length) sim.ready = Promise.all(jobs).then(() => sim);
  return sim;
}
