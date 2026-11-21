/** Event / festival manager. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { SEASONS } from '../core/registry.js';
import { timeInRange } from '../core/util.js';
import { svc } from './svc.js';
import { D, subs, dayNum, setFlag } from './kit.js';

const s = subs();
let running = false;

export const events = {
  init() {
    s.clear();
    running = false;
    s.on(EVT.AREA_ENTER, () => events.check('area'));
    s.on(EVT.TIME_TICK, ({ minutes }) => {
      if (minutes % 10 === 0 && Game.mode === 'field') events.check('tick');
    });
  },
  get running() {
    return running;
  },

  /** Festival def for a date, or null. */
  festivalOn(season, day) {
    const si = typeof season === 'number' ? season : SEASONS.indexOf(season);
    return Object.values(D().festivals || {}).find((f) => f?.date && SEASONS.indexOf(f.date.season) === si && f.date.day === day) || null;
  },
  festivalToday() {
    const t = Game.state?.time;
    return t ? events.festivalOn(t.season, t.day) : null;
  },
  /** Is the festival currently running (date + from..to window)? */
  festivalActive(minutes) {
    const f = events.festivalToday();
    if (!f) return null;
    const m = minutes ?? Game.state.time.minutes;
    return !f.from || !f.to || timeInRange(m, f.from, f.to) ? f : null;
  },
  /** Interior area ids closed today by a festival. */
  closedBuildings: () => events.festivalToday()?.closes || [],
  /** Placement data for S2: {default:{area,anchors}, byNpc:{npc:{area,at}}} or null. */
  festivalPlacement: () => events.festivalToday()?.placement || null,

  _festivalFor(eventId) {
    return Object.values(D().festivals || {}).find((f) => f?.eventId === eventId) || null;
  },

  /** Eligible events sorted by priority (desc). */
  eligible() {
    const st = Game.state;
    const dn = dayNum();
    const out = [];
    for (const def of Object.values(D().events || {})) {
      if (!def || !def.script) continue;
      const seen = st.world.eventsSeen[def.id];
      if (seen !== undefined) {
        if (def.once === true) continue;
        if (def.cooldownDays) {
          if (dn - seen < def.cooldownDays) continue;
        } else if (def.once !== false) continue;
      }
      const fest = events._festivalFor(def.id);
      if (fest) {
        if (!events.festivalToday() || events.festivalToday().id !== fest.id) continue;
        if (st.player.area !== fest.area) continue;
        if (!events.festivalActive()) continue;
      }
      if (!svc.conditions.evalCond(def.when, { key: def.id })) continue;
      out.push(def);
    }
    out.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0) || (a.id < b.id ? -1 : 1));
    return out;
  },

  /** Run the best eligible event (field mode only). Returns the event id run, or null. */
  async check(trigger = 'manual', depth = 0) {
    if (!Game.state || running || Game.mode !== 'field' || depth > 5) return null;
    const def = events.eligible()[0];
    if (!def) return null;
    await events.run(def);
    await events.check('chain', depth + 1);
    return def.id;
  },

  async run(def) {
    if (typeof def === 'string') def = D().events?.[def];
    if (!def) return;
    running = true;
    Game.state.world.eventsSeen[def.id] = dayNum();
    setFlag(`seen_${def.id}`, true);
    Game.bus.emit(EVT.EVENT_START, { id: def.id });
    if (def.music) Game.audio?.playMusic?.(def.music);
    try {
      await svc.script.run(def.script, { cutscene: true, source: def.id, npc: def.npc });
    } finally {
      running = false;
      Game.bus.emit(EVT.EVENT_END, { id: def.id });
    }
  },
};
