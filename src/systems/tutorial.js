/** One-time hint toasts from Data.tutorial. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { svc } from './svc.js';
import { D, subs, toast } from './kit.js';

const s = subs();

export const tutorial = {
  init() {
    s.clear();
    s.on(EVT.AREA_ENTER, () => tutorial.check());
    s.on(EVT.FLAG_SET, () => tutorial.check());
    s.on(EVT.QUEST_START, () => tutorial.check());
    s.on(EVT.ITEM_GAIN, () => tutorial.check());
    s.on(EVT.TIME_TICK, ({ minutes }) => {
      if (minutes % 10 === 0) tutorial.check();
    });
  },
  /** Show the first unseen hint whose `when` passes (one per call). Returns its id or null. */
  check() {
    const st = Game.state;
    if (!st || Game.mode !== 'field' || Game.settings?.showHints === false) return null;
    for (const h of D().tutorial || []) {
      if (!h || st.tutorial.seen[h.id]) continue;
      if (!svc.conditions.evalCond(h.when, { key: h.id })) continue;
      st.tutorial.seen[h.id] = true;
      toast(svc.script.interpolate(h.text), { kind: 'info', icon: h.icon, ms: 6000 });
      return h.id;
    }
    return null;
  },
};
