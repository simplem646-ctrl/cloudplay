/** Director: title -> new/continue, sleep & day rollover, collapse, autosave, save, menu. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { ENERGY, CLOCK, INVENTORY_CAPACITY, STORAGE_CAPACITY } from '../core/constants.js';
import { defaultState, saveToSlot, loadFromSlot } from '../core/state.js';
import { formatDate } from '../core/util.js';
import { svc } from './svc.js';
import { toast, sfx, npcDef, cap } from './kit.js';
import { NPC_IDS } from '../core/registry.js';

let busy = false;
const MENU_KEYS = { menu: 'items', inventory: 'items', journal: 'quests', map: 'map' };

async function enter(area, anchor, o = {}) {
  const st = Game.state;
  if (svc.entities?.enterArea) return svc.entities.enterArea(area, anchor, o);
  const from = st.player.area;
  st.player.area = area;
  if (o.x !== undefined) {
    st.player.x = o.x;
    st.player.z = o.z;
  }
  if (o.facing) st.player.facing = o.facing;
  Game.bus.emit(EVT.AREA_ENTER, { area, from });
  return undefined;
}

function backfill(st) {
  const inv = st.inventory;
  inv.capacity ||= INVENTORY_CAPACITY;
  while (inv.slots.length < inv.capacity) inv.slots.push(null);
  st.storage.capacity ||= STORAGE_CAPACITY;
  while (st.storage.slots.length < st.storage.capacity) st.storage.slots.push(null);
}

function markDay(st) {
  st.stats.dayMark = {
    earned: st.stats.earned, spent: st.stats.spent, fishCaught: st.stats.fishCaught,
    aff: Object.fromEntries(Object.entries(st.rel).map(([k, v]) => [k, v.aff])),
  };
}

function summary(st) {
  const m = st.stats.dayMark || { earned: 0, spent: 0, fishCaught: 0, aff: {} };
  const hearts = [];
  for (const npc of NPC_IDS) {
    const d = Math.floor((st.rel[npc]?.aff || 0) / 100) - Math.floor((m.aff[npc] || 0) / 100);
    if (d) hearts.push({ npc, delta: d });
  }
  return {
    earned: st.stats.earned - m.earned, spent: st.stats.spent - m.spent, fishCaught: st.stats.fishCaught - m.fishCaught, hearts,
    note: st.weather.tomorrow ? `Tomorrow's forecast: ${st.weather.tomorrow}.` : undefined,
  };
}

async function wake({ energyFactor, banner = true }) {
  const st = Game.state;
  const ui = Game.ui;
  svc.clock.sleepToMorning();
  svc.inventory.setEnergy(st.player.maxEnergy * energyFactor);
  markDay(st);
  st.player.area = 'cottage';
  await enter('cottage', 'bed_spot', { fade: false });
  director.saveGame(0);
  sfx('wake_jingle');
  await ui?.fade?.(0, 800);
  if (banner) await ui?.banner?.(formatDate(st.time), `Year ${st.time.year} · ${cap(st.weather.today)}`);
}

export const director = {
  get busy() {
    return busy;
  },

  init() {
    busy = false;
  },

  update(dt) {
    const st = Game.state;
    if (!st) return;
    if (['field', 'dialogue', 'cutscene', 'menu', 'shop', 'minigame'].includes(Game.mode)) st.meta.playSeconds = (st.meta.playSeconds || 0) + dt;
    if (Game.mode === 'field' && !busy) {
      for (const [action, tab] of Object.entries(MENU_KEYS)) {
        if (Game.input?.pressed?.(action)) {
          director.openMenu(tab);
          break;
        }
      }
    }
  },

  /** Title loop. Resolves once a game has started (or quit chosen). */
  async start() {
    Game.setMode('title');
    const ui = Game.ui;
    if (!ui?.showTitle) return;
    for (;;) {
      const res = await ui.showTitle();
      if (!res || res.action === 'quit') return;
      if (res.action === 'new') {
        await director.newGame({ name: res.name, look: res.look });
        return;
      }
      if (res.action === 'continue') {
        if (await director.continueGame(res.slot)) return;
        toast('That save could not be loaded.', { kind: 'warn' });
      }
    }
  },

  async newGame({ name, look } = {}) {
    busy = true;
    try {
      const st = defaultState({ name, look });
      backfill(st);
      Game.state = st;
      for (const id of NPC_IDS) if (npcDef(id)?.startMet) svc.rel.meet(id);
      svc.weather.initState();
      markDay(st);
      Game.bus.emit(EVT.GAME_NEW);
      Game.setMode('transition');
      await enter('brook_lane', 'cottage_front');
    } finally {
      busy = false;
    }
    Game.setMode('field');
    await svc.events.check('newgame');
    return Game.state;
  },

  async continueGame(slot) {
    const st = loadFromSlot(slot);
    if (!st) return false;
    busy = true;
    try {
      backfill(st);
      Game.state = st;
      if (!st.weather?.today) svc.weather.reroll();
      if (!st.stats.dayMark) markDay(st);
      Game.bus.emit(EVT.GAME_LOADED, { slot });
      Game.setMode('transition');
      const p = st.player;
      await enter(p.area, undefined, { fade: true, x: p.x, z: p.z, facing: p.facing });
    } finally {
      busy = false;
    }
    Game.setMode('field');
    await svc.events.check('load');
    return true;
  },

  saveGame(slot) {
    const st = Game.state;
    if (!st) return { ok: false, error: 'no game' };
    slot = slot ?? st.meta.slot ?? 1;
    const pos = svc.entities?.getPlayerPos?.();
    if (pos) Object.assign(st.player, { area: pos.area, x: pos.x, z: pos.z, facing: pos.facing });
    const r = saveToSlot(slot, st);
    if (slot !== 0 && r.ok) st.meta.slot = slot;
    if (r.ok) Game.bus.emit(EVT.GAME_SAVED, { slot });
    return r;
  },

  async openMenu(tab = 'items') {
    if (!Game.ui?.menu?.open || Game.mode === 'menu' || busy) return;
    const prev = Game.mode;
    Game.setMode('menu');
    try {
      await Game.ui.menu.open(tab);
    } finally {
      if (Game.mode === 'menu') Game.setMode(prev === 'menu' ? 'field' : prev);
    }
  },

  /** Go to bed. Returns false if cancelled. */
  async sleep(o = {}) {
    const st = Game.state;
    if (!st || busy) return false;
    const ui = Game.ui;
    const early = st.time.minutes < 1080;
    if (o.confirm !== false) {
      const ok = await ui?.confirm?.(early ? "It's still early. Go to bed anyway?" : 'Go to sleep for the night?', { yes: 'Sleep', no: 'Not yet' });
      if (ok === false) return false;
    }
    busy = true;
    try {
      const factor = st.time.minutes <= CLOCK.warning ? ENERGY.sleepInBedByMidnight : ENERGY.sleepLate;
      Game.setMode('sleep');
      Game.bus.emit(EVT.SLEEP_START);
      sfx('sleep_jingle');
      await ui?.fade?.(1, 800);
      await ui?.daySummary?.(summary(st));
      await wake({ energyFactor: factor });
      Game.setMode('field');
      Game.bus.emit(EVT.SLEEP_END);
    } finally {
      busy = false;
    }
    await svc.events.check('wake');
    return true;
  },

  /** 26:00 forced collapse. */
  async collapse() {
    const st = Game.state;
    if (!st || busy) return;
    busy = true;
    try {
      const ui = Game.ui;
      Game.setMode('sleep');
      Game.bus.emit(EVT.SLEEP_START);
      await ui?.fade?.(1, 800);
      const lost = Math.min(50, st.player.money);
      if (lost) svc.inventory.addMoney(-lost);
      await ui?.dialogue?.narrate?.('You stayed up far too late… everything goes dark.');
      await wake({ energyFactor: ENERGY.sleepCollapse, banner: false });
      await ui?.dialogue?.narrate?.(lost ? `Someone must have carried you home. You lost ${lost} coins along the way.` : 'Someone must have carried you home.');
      Game.setMode('field');
      Game.bus.emit(EVT.SLEEP_END);
    } finally {
      busy = false;
    }
    await svc.events.check('wake');
  },

  /** Back to the title screen (ui:quit). */
  async quitToTitle() {
    Game.state = null;
    await director.start();
  },

};
