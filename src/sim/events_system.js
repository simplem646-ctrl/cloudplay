// Glue: builds the event/dialogue/ending services on top of the sim facade (src/sim/index.js `createSim`) WITHOUT editing it.
//   const sim = createSim(state, {...});  const ev = createEventSystem(sim);
//   const e = ev.events.find({ type: 'enterMap', map: 'town_square' }, { map, minute });  if (e) await ev.events.run(e, stage);
//   const t = ev.dialogue.talk('nina');   const g = ev.dialogue.gift('nina', 'bread');   const slides = ev.endings.compose();
import { evaluateCondition, safeCondition } from './conditions.js';
import { runScript } from './interpreter.js';
import * as events from './events.js';
import * as dialogue from './dialogue.js';
import * as endings from './endings.js';

/** opts: { catalog, pools, slides, quests } (all default to the generated content registry). */
export function createEventSystem(sim, opts = {}) {
  const state = sim.state, bus = sim.bus;
  const catalog = opts.catalog || events.defaultCatalog();
  const pools = opts.pools || dialogue.defaultPools();
  const slides = opts.slides || endings.defaultSlides();
  const quests = opts.quests || events.defaultQuests();
  const simOpts = { bus, balance: sim.balance };

  const evaluate = (cond, st, ctx) => evaluateCondition(cond, st || state, ctx);
  if (typeof sim.setEvalCond === 'function') sim.setEvalCond(evaluate); // schedules etc. now use the full evaluator

  return {
    conditions: { evaluate: (cond, ctx) => evaluate(cond, state, ctx), safe: (cond, ctx) => safeCondition(cond, state, ctx) },
    events: {
      all: () => events.allEvents(catalog),
      get: (id) => events.getEvent(id, catalog),
      find: (trigger, ctx) => events.findEvent(state, trigger, ctx, catalog),
      listEligible: (trigger, ctx) => events.listEligible(state, trigger, ctx, catalog),
      run: (ev, stage) => events.runEvent(state, ev, { stage, bus, quests, opts: simOpts }),
      runById: async (id, stage) => { const ev = events.getEvent(id, catalog); if (!ev) return false; await events.runEvent(state, ev, { stage, bus, quests, opts: simOpts }); return true; },
      stats: () => events.catalogStats(catalog),
    },
    interpreter: { run: (ops, stage, extra = {}) => runScript(ops, { state, stage, bus, quests, opts: simOpts, ...extra }) },
    dialogue: {
      talk: (npc, o = {}) => dialogue.pickTalk(state, npc, { pools, ...o }),
      repeat: (npc, o = {}) => dialogue.pickRepeat(state, npc, { pools, ...o }),
      gift: (npc, item) => dialogue.giftReaction(state, npc, item, { pools, bus }),
      taste: (npc, item) => dialogue.giftTaste(npc, item, pools),
      prefs: () => dialogue.prefsFromPools(pools),
    },
    endings: { compose: () => endings.composeEnding(state, slides) },
    quests,
  };
}
