/**
 * A scripted "natural player" for the end-to-end story tests (sys-story.test.mjs).
 *
 * It drives the REAL simulation (src/systems) against the REAL content (src/data) and REAL headless areas through the same
 * entry points the game uses: svc.rel.talk / giftFlow, svc.shops.buy, svc.interact.run (forage / fishing / shelves / star map),
 * svc.jobs.start, svc.director.sleep and the event/quest buses. What is NOT real (no WebGL here):
 *   - walking: the player teleports with svc.entities.enterArea(area, anchor). Travel time between areas is not charged
 *     to the clock; opening hours, NPC schedules (svc.npcs.whereIs), closed days and festival closures ARE enforced.
 *   - the fishing / kneading minigames: a fake that always succeeds (the real handler runs around it, bite window included).
 *   - UI: a scripted fake (say/narrate no-ops, asks answered from a queue, gift picker answers from `pickSlot`).
 */
import { boot, svc, Game, Data, Sys, Input, wait } from './sys-s2-env.mjs';
import { timing } from '../../../src/systems/activities.js';
import { buildHeadless } from '../../../src/world/headless.js';
import { AREAS, areaInteractables, WEEKDAYS } from '../../../src/core/registry.js';
import { weekdayName, dayNumber } from '../../../src/core/util.js';

export { svc, Game, Data, Sys, Input, wait, timing };

export const SEASON_IDX = { spring: 0, summer: 1, autumn: 2, winter: 3 };

// Building an area's geometry takes ~10-30 ms; the story tests enter areas thousands of times, so build each one once.
const areaCache = new Map();

export function bootStory({ log = false } = {}) {
  const env = boot({ quickAnims: true });
  Game.world.loadArea = async (id, op) => {
    env.areaLoads.push([id, op?.spawn]);
    if (!areaCache.has(id)) areaCache.set(id, buildHeadless(id).runtime);
    env.area = areaCache.get(id);
    return env.area;
  };
  timing.scale = 0.001;
  // fakes: successful minigames, gift picker, scripted asks
  env.pickSlot = null;
  Game.ui.pickItem = async () => env.pickSlot;
  Game.ui.minigames.fishing = async () => ({ caught: true, perfect: false });
  Game.ui.minigames.kneading = async () => ({ score: 0.85 });
  env.onSfx = (id) => { if (id === 'bite') setTimeout(() => Input._emit('confirm'), 0); };
  env.log = (...a) => { if (log) console.log('   ·', ...a); };
  return env;
}

export const dn = () => dayNumber(Game.state.time);
export const dateStr = () => {
  const t = Game.state.time;
  return `${['spring', 'summer', 'autumn', 'winter'][t.season]} ${t.day} (${weekdayName(t.day)}) ${String(Math.floor(t.minutes / 60)).padStart(2, '0')}:${String(t.minutes % 60).padStart(2, '0')}`;
};
export const flag = (f) => !!Game.state.flags[f];
export const has = (item, n = 1) => svc.inventory.count(item) >= n;
export const questDone = (id) => svc.quests.isDone(id);
export const money = () => Game.state.player.money;

/** Drive frames until a promise settles (scripts with `move ... wait:true` need the world to tick). */
export async function pump(p, maxFrames = 6000) {
  let done = false;
  let err;
  let val;
  Promise.resolve(p).then((v) => { val = v; done = true; }, (e) => { err = e; done = true; });
  for (let i = 0; i < maxFrames && !done; i++) {
    await wait(0);
    if (done) break;
    Sys.update(0.05);
    Input.endFrame();
  }
  if (!done) throw new Error('pump: promise did not settle');
  if (err) throw err;
  return val;
}

/** Wait until no event / script / queued quest work is running (ticking the world while scripts play). */
export async function settle(maxFrames = 6000) {
  for (let i = 0; i < maxFrames; i++) {
    await wait(0);
    if (!svc.events.running && !svc.script.isRunning()) {
      await svc.quests.idle();
      await wait(0);
      if (!svc.events.running && !svc.script.isRunning()) return;
    }
    Sys.update(0.05);
    Input.endFrame();
  }
  throw new Error(`settle: still busy (event running=${svc.events.running}, script=${svc.script.isRunning()}) at ${dateStr()}`);
}

export const setClock = (minutes) => {
  if (minutes < Game.state.time.minutes) throw new Error(`clock cannot run backwards: ${Game.state.time.minutes} -> ${minutes}`);
  svc.clock.set({ minutes });
};

/** Walk into an area (teleport to an anchor). Enforces opening hours like the real door does. */
export async function go(area, anchor) {
  if (AREAS[area].kind === 'interior') {
    const closed = svc.player.canEnter(area);
    if (closed) throw new Error(`cannot enter ${area} at ${dateStr()}: ${closed.reason} (${closed.text})`);
  }
  await svc.entities.enterArea(area, anchor, { fade: false });
  await settle();
}

/** Optional per-day routines (the romance courtship): beforeSleep runs in the evening, afterWake right after waking up. */
export const hooks = { beforeSleep: null, afterWake: null };
let inHook = false;
const runHook = async (name) => {
  if (!hooks[name] || inHook) return;
  inHook = true;
  try { await hooks[name](); } finally { inHook = false; }
};

/** Go to bed (22:00 unless later) and wake up the next morning at home. Runs the wake-up events. */
export async function nextDay() {
  await runHook('beforeSleep');
  const t = Game.state.time;
  if (t.minutes < 22 * 60) t.minutes = 22 * 60;
  Game.state.player.area = 'cottage';
  await pump(svc.director.sleep({ confirm: false }));
  if (Game.mode !== 'field') Game.setMode('field');
  await settle();
  await runHook('afterWake');
}

export async function sleepDays(n) {
  for (let i = 0; i < n; i++) await nextDay();
}

/** Sleep until a calendar date (season name, day) at 06:00. */
export async function skipTo(season, day) {
  const target = (SEASON_IDX[season]) * 28 + day;
  for (let guard = 0; guard < 120; guard++) {
    const t = Game.state.time;
    const now = (t.year - 1) * 112 + t.season * 28 + t.day;
    if (now >= target) return;
    await nextDay();
  }
  throw new Error('skipTo overran');
}

export const weekday = () => weekdayName(Game.state.time.day);

/** Move the clock to the first time >= minutes today (or a later day) when `area` is open; sleeps through closed days. */
export async function whenOpen(area, preferred = 11 * 60) {
  for (let d = 0; d < 9; d++) {
    const t = Game.state.time;
    const from = Math.max(t.minutes, preferred);
    for (let m = from; m < 21 * 60; m += 30) {
      if (svc.shops.isOpen(area, m)) {
        // the Heron Inn style closed-day check uses the real weekday; hours are checked with minutes
        if (m > t.minutes) setClock(m);
        return;
      }
    }
    await nextDay();
  }
  throw new Error(`${area} never opens`);
}

/** Find the villager and go to them: scans the rest of today (then following days) for a visible, enterable schedule slot. */
export async function findNpc(npc, { from = 7 * 60, to = 21 * 60, sameDay = false } = {}) {
  for (let d = 0; d < (sameDay ? 1 : 9); d++) {
    const t = Game.state.time;
    for (let m = Math.max(t.minutes, from); m <= to; m += 15) {
      const loc = svc.npcs.whereIs(npc, m);
      if (!loc || loc.hidden) continue;
      if (AREAS[loc.area].kind === 'interior' && !svc.shops.isOpen(loc.area, m)) continue;
      if (m > t.minutes) setClock(m);
      await go(loc.area, loc.at || undefined);
      const a = svc.entities.actor(npc);
      if (!a || a.hidden) throw new Error(`${npc} not standing in ${loc.area} at ${dateStr()} though the schedule says so`);
      return loc;
    }
    if (!sameDay) await nextDay();
  }
  if (sameDay) return null;
  throw new Error(`could not find ${npc} within 9 days (${dateStr()})`);
}

export async function talk(npc, { sameDay = false } = {}) {
  if (!(await findNpc(npc, { sameDay }))) return false;
  await pump(svc.rel.talk(npc));
  await settle();
  return true;
}

/** Talk to the NPC every day (once per day counts) until `pred()` or n days. */
export async function talkDaily(npc, pred, maxDays = 40) {
  for (let i = 0; i < maxDays && !pred(); i++) {
    await talk(npc);
    if (pred()) return;
    await nextDay();
  }
}

export const slotOf = (item) => Game.state.inventory.slots.findIndex((s) => s && s.id === item);

/** Give `item` to `npc` (their daily gift). With a multi-item give-quest open, the simulated player takes the bulk hand-in
 * ("Hand over all N") unless `one` is set ("Just one, as a gift"). Returns false if the daily gift was already used. */
export async function gift(npc, item, { sameDay = false, one = false } = {}) {
  if (!has(item)) throw new Error(`gift: no ${item} in the pack`);
  if (!(await findNpc(npc, { sameDay }))) return false;
  if (Game.state.rel[npc].giftDay === dn()) return false;
  const slot = slotOf(item);
  Game.ui.pickItem = async () => slot;
  const origAsk = Game.ui.dialogue.ask;
  Game.ui.dialogue.ask = async () => (one ? 1 : 0);
  const before = svc.inventory.count(item);
  try {
    await pump(svc.rel.giftFlow(npc));
    await settle();
  } finally {
    Game.ui.pickItem = async () => null;
    Game.ui.dialogue.ask = origAsk;
  }
  return svc.inventory.count(item) < before;
}

/** Buy at a counter shop: goes there when open. */
export async function buy(shopId, item, qty = 1, { sameDay = false } = {}) {
  const def = Data.shops[shopId];
  if (sameDay) {
    const t = Game.state.time;
    let m = null;
    for (let x = Math.max(t.minutes, 9 * 60); x < 17 * 60; x += 30) if (svc.shops.isOpen(def.area, x)) { m = x; break; }
    if (m === null) return null;
    if (m > t.minutes) setClock(m);
  } else await whenOpen(def.area, 10 * 60);
  await go(def.area, 'counter_front');
  const res = svc.shops.buy(shopId, item, qty);
  if (!res.ok) throw new Error(`buy ${item} x${qty} at ${shopId} failed: ${JSON.stringify(res)} (money ${money()})`);
  await settle(); // quest polling reacts to the item gain
  return res;
}

/** Run a bakery shift (needs 07:00-11:00, Mon-Sat). */
export async function shift() {
  for (let d = 0; d < 9; d++) {
    const t = Game.state.time;
    const wd = weekday();
    if (wd !== 'sun' && t.minutes <= 10 * 60 && !svc.shops.closedInfo('bakery', Math.max(t.minutes, 7 * 60 + 15))) {
      if (t.minutes < 7 * 60 + 15) setClock(7 * 60 + 15);
      if (Game.state.jobs.doneDay.bakery_shift !== dn()) {
        await go('bakery', 'counter_front');
        const before = Game.state.jobs.doneDay.bakery_shift;
        await pump(svc.jobs.start('bakery_shift'));
        await settle();
        if (Game.state.jobs.doneDay.bakery_shift !== before) return;
      }
    }
    await nextDay();
  }
  throw new Error('could not work a bakery shift');
}

/** Pick everything wanted from the forage spots of `areas` (a real sweep: each spot goes through the real handler). */
export async function forageSweep(areas, wanted /* Set|null = any */) {
  let got = 0;
  for (const area of areas) {
    await go(area);
    const spots = svc.entities.area().interactables.filter((i) => i.type === 'forage');
    for (const it of spots) {
      // The sparkle only shows at spots with something in them; the player sees which ones. We peek via the same seeded roll.
      const item = svc.activities.rollForage(area, it.id);
      if (!item || (wanted && !wanted.has(item))) continue;
      const before = svc.inventory.count(item);
      await pump(svc.interact.run(area, it));
      await settle();
      if (svc.inventory.count(item) > before) got++;
    }
  }
  return got;
}

/** Forage day after day until `pred()`; up to maxDays. */
export async function forageUntil(areas, wanted, pred, maxDays = 30) {
  for (let d = 0; d < maxDays && !pred(); d++) {
    if (Game.state.time.minutes > 16 * 60) await nextDay();
    if (Game.state.time.minutes < 9 * 60) setClock(9 * 60);
    await forageSweep(areas, wanted);
    if (pred()) return;
    await nextDay();
  }
  if (!pred()) throw new Error(`forageUntil: gave up after ${maxDays} days (${dateStr()})`);
}

/** Cast at the spots of `area` until `want(fishId)` caught `n` times in total. */
export async function fish(area, want = () => true, n = 1, maxDays = 20) {
  let caught = 0;
  const off = Game.bus.on('fish:caught', (e) => { if (want(e.id)) caught++; });
  try {
    for (let d = 0; d < maxDays && caught < n; d++) {
      if (Game.state.time.minutes < 7 * 60) setClock(7 * 60);
      if (Game.state.time.minutes > 16 * 60) { await nextDay(); continue; }
      await go(area);
      const spots = svc.entities.area().interactables.filter((i) => i.type === 'fishing');
      for (let cast = 0; cast < 6 && caught < n; cast++) {
        for (const it of spots) {
          if (caught >= n) break;
          if (Game.state.player.energy < 6) break;
          await pump(svc.interact.run(area, it));
          await settle();
        }
      }
      if (caught < n) await nextDay();
    }
  } finally {
    off?.();
  }
  if (caught < n) throw new Error(`fish: only ${caught}/${n} after ${maxDays} days at ${area}`);
  return caught;
}

/** Area ids named by `area` conditions anywhere inside a condition tree. */
const areasIn = (c, out = new Set()) => {
  if (Array.isArray(c)) c.forEach((x) => areasIn(x, out));
  else if (c && typeof c === 'object') {
    for (const [k, v] of Object.entries(c)) {
      if (k === 'area') [].concat(v).forEach((a) => out.add(a));
      else areasIn(v, out);
    }
  }
  return out;
};

/**
 * Run an event the way the game would: wait for a day/time on which the event's own `when` (evaluated by the real condition
 * engine) holds in one of its trigger areas, be somewhere else first, then walk in. Resolves when the event has run.
 */
export async function attendEvent(id, { maxDays = 40 } = {}) {
  const ev = Data.events[id];
  const areas = [...areasIn(ev.when)];
  for (let d = 0; d < maxDays; d++) {
    const t = Game.state.time;
    for (let m = Math.max(t.minutes, 360); m < 26 * 60; m += 10) {
      for (const a of areas) {
        if (AREAS[a].kind === 'interior' && !svc.shops.isOpen(a, m) && !svc.jobs.hasAccess(a, m)) continue;
        if (!svc.conditions.evalCond(ev.when, { area: a, minutes: m, key: id })) continue;
        if (svc.events.eligible().every((e) => e.id !== id) && m === t.minutes) { /* conditions use the player's current area; checked after entering */ }
        if (m > t.minutes) setClock(m);
        if (Game.state.player.area === a) await go('brook_lane');
        const seen = [];
        const off = Game.bus.on('event:start', (e) => seen.push(e.id));
        await go(a);
        await settle();
        off();
        if (seen.includes(id)) return true;
        // something else (higher priority) ran first, or a condition only the live state could judge: look again later today
      }
    }
    await nextDay();
  }
  throw new Error(`event ${id} never fired in ${maxDays} days (${dateStr()})`);
}

/** Buy from the peddler stall: Sable stands in the square on Saturdays, in the park on Sundays. Uses the NPC interaction menu. */
export async function browseStall(npc, shopId, item, qty = 1) {
  await findNpc(npc);
  const opened = [];
  const orig = Game.ui.shop.open;
  Game.ui.shop.open = async (o) => { opened.push(o); await o.onBuy(item, qty); };
  const asks = [];
  const origAsk = Game.ui.dialogue.ask;
  Game.ui.dialogue.ask = async (x) => {
    asks.push(x);
    const i = x.options.findIndex((o) => /wares|Shop/i.test(o.text));
    return i;
  };
  try {
    await pump(svc.interaction.activate({ kind: 'npc', id: npc }));
  } finally {
    Game.ui.shop.open = orig;
    Game.ui.dialogue.ask = origAsk;
  }
  return { opened, asks };
}

export { areaInteractables, WEEKDAYS, SEASONS_ORDER };
const SEASONS_ORDER = ['spring', 'summer', 'autumn', 'winter'];
