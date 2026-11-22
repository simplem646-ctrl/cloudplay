/**
 * Street lamps: broken (story.lanterns < group) / unlit / lit (lit tonight by the player, or festival night).
 * State lives in `state.world.lamps[lampId] = dayNum it was lit`. `apply()` pushes the states of the current area to
 * Game.world.setLampStates. The interaction handler for type 'lamp' is registered in activities.js.
 */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { AREAS, LAMP_GROUPS, lampIds } from '../core/registry.js';
import { svc } from './svc.js';
import { subs, dayNum } from './kit.js';

export const DUSK = 1050; // 17:30
export const DAWN = 360; // 06:00
const s = subs();
let override = null; // null | 'lit'  (script op `lamps`)

export const isDusk = (m) => m >= DUSK || m < DAWN;

export const lamps = {
  init() {
    s.clear();
    override = null;
    s.on(EVT.TIME_HOUR, () => lamps.apply());
    s.on(EVT.TIME_NEWDAY, () => lamps.apply());
    s.on(EVT.STORY_LANTERN, () => lamps.apply());
  },

  isDusk,
  get override() {
    return override;
  },
  /** Script op `lamps`: 'all_lit' forces every lamp lit; 'restore' / 'normal' recompute from the story state. */
  setOverride(mode) {
    override = mode === 'all_lit' ? 'lit' : null;
    lamps.apply();
  },

  group: (areaId, it) => it?.group ?? LAMP_GROUPS[areaId] ?? 0,
  repaired: (areaId, it) => (Game.state?.story?.lanterns ?? 0) >= lamps.group(areaId, it),
  litTonight: (lampId) => Game.state?.world?.lamps?.[lampId] === dayNum(),

  /** 'broken' | 'unlit' | 'lit' for one lamp. */
  stateOf(areaId, lampId, it, minutes) {
    const st = Game.state;
    if (!st) return 'broken';
    if (override === 'lit') return 'lit';
    if (!lamps.repaired(areaId, it)) return 'broken';
    const m = minutes ?? st.time.minutes;
    if (!isDusk(m)) return 'unlit';
    if (lamps.litTonight(lampId)) return 'lit';
    if (svc.events?.festivalToday?.()) return 'lit';
    return 'unlit';
  },

  /** {lampId: state} for the current area (or an explicit area id). */
  statesFor(areaId, list) {
    const out = {};
    const items = list || lampIds(areaId).map((id) => ({ id }));
    for (const it of items) if (!it.type || it.type === 'lamp') out[it.id] = lamps.stateOf(areaId, it.id, it);
    return out;
  },

  apply() {
    const area = svc.entities?.area?.();
    if (!area || !Game.world?.setLampStates || !Game.state) return;
    Game.world.setLampStates(lamps.statesFor(area.id, area.interactables));
  },

  /** Mark a lamp lit for tonight. */
  light(lampId) {
    if (!Game.state) return;
    Game.state.world.lamps[lampId] = dayNum();
    lamps.apply();
  },

  /** Every repaired lamp in the whole town (registry ids) is lit tonight? */
  allRepairedLit() {
    let n = 0;
    for (const a of Object.keys(AREAS)) {
      for (const id of lampIds(a)) {
        if (!lamps.repaired(a, { group: LAMP_GROUPS[a] })) continue;
        n++;
        if (!lamps.litTonight(id)) return false;
      }
    }
    return n > 0;
  },
};
