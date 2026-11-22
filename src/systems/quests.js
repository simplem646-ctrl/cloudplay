/** Quests: stage goals driven by bus events, rewards, notice board + errands. Stage indexes are 0-based. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { SEASONS } from '../core/registry.js';
import { dayNumber, rngFor, weightedPick } from '../core/util.js';
import { svc } from './svc.js';
import { REL_EVT } from './rel.js';
import { D, subs, dayNum, toast, sfx, itemName, npcShort, getFlag, setFlag } from './kit.js';

const s = subs();
let chain = Promise.resolve();
const enqueue = (fn) => {
  chain = chain.then(fn).catch((e) => console.error('[quests]', e));
  return chain;
};
const MAX_ERRANDS = 3;
const runQ = (script) => (script?.length ? svc.script.runQueued(script, { cutscene: true, source: 'quest' }) : undefined);

const act = () => Game.state.quests.active;

export const quests = {
  init() {
    s.clear();
    chain = Promise.resolve();
    const hit = (type, fn) => (p) => quests._event(type, fn, p);
    s.on(EVT.NPC_TALK, hit('talk', (g, r, p) => p.id === g.npc && (r.progress.done = true)));
    s.on(REL_EVT.GIFT, hit('give', (g, r, p) => {
      if (p.npc === g.npc && p.item === g.item) r.progress.n = (r.progress.n || 0) + (p.qty || 1);
    }));
    s.on(EVT.FISH_CAUGHT, hit('catch', (g, r, p) => {
      if (g.fish === 'any' || g.fish === p.id) r.progress.n = (r.progress.n || 0) + 1;
    }));
    s.on(EVT.FORAGE_PICKED, hit('forage', (g, r, p) => {
      if (!g.item || g.item === p.id) r.progress.n = (r.progress.n || 0) + 1;
    }));
    s.on(EVT.AREA_ENTER, hit('visit', (g, r, p) => {
      if (g.area === p.area && !g.anchor) r.progress.done = true;
    }));
    s.on(EVT.JOB_DONE, hit('job', (g, r, p) => {
      if (!g.job || g.job === p.id) r.progress.n = (r.progress.n || 0) + 1;
    }));
    s.on(EVT.MONEY_CHANGE, hit('earn', (g, r, p) => {
      if (p.delta > 0) r.progress.n = (r.progress.n || 0) + p.delta;
    }));
    for (const e of [EVT.AFFECTION_CHANGE, EVT.ITEM_GAIN, EVT.ITEM_LOSE, EVT.FLAG_SET, EVT.STORY_LANTERN, EVT.TIME_NEWDAY, EVT.INVENTORY_CHANGED]) {
      s.on(e, () => quests.poll());
    }
    s.on(EVT.AREA_ENTER, () => quests.poll());
    s.on(EVT.NPC_TALK, ({ id }) => {
      quests.autoStart(id);
    });
    s.on(EVT.TIME_TICK, ({ minutes }) => {
      if (minutes % 10 === 0 && Game.mode === 'field') quests.poll();
    });
    s.on(EVT.TIME_NEWDAY, () => {
      quests.expire();
      quests.refreshBoard();
    });
    s.on(EVT.UI_TRACK_QUEST, ({ id }) => quests.track(id));
  },

  // ---- lookup ----
  def(id) {
    const a = Game.state?.quests.active[id];
    return D().quests?.[id] || a?.def || null;
  },
  isActive: (id) => !!Game.state?.quests.active[id],
  isDone: (id) => Game.state?.quests.done[id] !== undefined,
  stageOf: (id) => (Game.state?.quests.active[id] ? Game.state.quests.active[id].stage : -1),
  stageId(id) {
    const r = Game.state?.quests.active[id];
    return r ? quests.def(id)?.stages?.[r.stage]?.id : undefined;
  },
  idle: () => chain,

  /** Active quests for UI: [{id,title,kind,text,stage,total,tracked}] */
  list({ done = false } = {}) {
    const st = Game.state.quests;
    const out = [];
    for (const [id, r] of Object.entries(st.active)) {
      const def = quests.def(id);
      if (!def) continue;
      out.push({
        id, title: def.title, kind: def.kind, giver: def.giver, desc: def.desc, text: def.stages?.[r.stage]?.text || '',
        stage: r.stage, total: def.stages?.length || 1, tracked: st.tracked === id, state: 'active', progress: r.progress,
      });
    }
    if (done) {
      for (const id of Object.keys(st.done)) {
        const def = D().quests?.[id];
        if (def) out.push({ id, title: def.title, kind: def.kind, giver: def.giver, desc: def.desc, text: '', stage: -1, total: def.stages?.length || 1, tracked: false, state: 'done' });
      }
    }
    return out;
  },
  track(id) {
    const st = Game.state.quests;
    st.tracked = st.tracked === id ? null : id;
  },
  tracked: () => Game.state?.quests.tracked || null,

  // ---- lifecycle ----
  /** Start a quest (by def id, or a prepared def for errands). Returns boolean. */
  start(id, o = {}) {
    if (!Game.state) return false;
    const def = o.def || D().quests?.[id];
    if (!def) {
      console.warn(`[systems] startQuest: unknown quest "${id}"`);
      return false;
    }
    if (quests.isActive(id)) return false;
    if (quests.isDone(id) && !def.repeat) return false;
    const rec = { stage: 0, progress: {}, since: dayNum() };
    if (o.def) rec.def = o.def;
    if (def.expiresDays) rec.expires = dayNum() + def.expiresDays;
    if (o.expires) rec.expires = o.expires;
    act()[id] = rec;
    toast(`New: ${def.title}`, { kind: 'quest', icon: 'quest' });
    sfx('quest_new');
    Game.bus.emit(EVT.QUEST_START, { id });
    enqueue(async () => {
      await runQ(def.stages?.[0]?.onEnter);
      await quests._evaluate(id);
    });
    return true;
  },

  /** Finish the current stage regardless of its goal (script op advanceQuest). */
  advance(id) {
    return enqueue(() => quests._finishStage(id));
  },
  /** Complete the whole quest (skipping remaining stages) and pay out. */
  complete(id) {
    return enqueue(() => quests._finish(id));
  },

  _event(type, fn, payload) {
    if (!Game.state) return;
    for (const [id, r] of Object.entries(act())) {
      const g = quests.def(id)?.stages?.[r.stage]?.goal;
      if (!g || g.type !== type) continue;
      fn(g, r, payload);
      enqueue(() => quests._evaluate(id));
    }
  },

  /** Re-check polled goals (have, hearts, flag, date, lanterns, visit-with-anchor, plus counters). */
  poll() {
    if (!Game.state) return;
    quests.autoStart();
    for (const id of Object.keys(act())) enqueue(() => quests._evaluate(id));
  },

  /** Start every tutorial/main quest whose `unlock` condition now holds; a side quest starts when you talk to its giver
   * (`talkedTo`). Board quests are offered on the notice board instead. */
  autoStart(talkedTo = null) {
    if (!Game.state || !getFlag('prologue_done')) return; // nothing auto-starts over the opening cutscene
    for (const def of Object.values(D().quests || {})) {
      if (!def?.unlock || def.board || def.kind === 'errand' || quests.isActive(def.id)) continue;
      if (def.kind === 'side' && def.giver !== talkedTo) continue;
      if (quests.isDone(def.id) && !def.repeat) continue;
      if (svc.conditions.evalCond(def.unlock, { key: def.id })) quests.start(def.id);
    }
  },

  goalMet(g, r) {
    const st = Game.state;
    switch (g.type) {
      case 'talk': case 'visit': return !!r.progress.done || quests._visitNear(g);
      case 'give': case 'catch': case 'forage': return (r.progress.n || 0) >= (g.qty ?? 1);
      case 'job': return (r.progress.n || 0) >= (g.times ?? 1);
      case 'earn': return (r.progress.n || 0) >= g.amount;
      case 'have': return svc.inventory.count(g.item) >= (g.qty ?? 1);
      case 'hearts': return svc.rel.hearts(g.npc) >= g.hearts;
      case 'flag': return !!getFlag(g.flag);
      case 'lanterns': return st.story.lanterns >= g.count;
      case 'date': {
        const target = dayNumber({ year: Math.floor((r.since - 1) / 112) + 1, season: SEASONS.indexOf(g.season), day: g.day });
        return dayNumber(st.time) >= target;
      }
      default: return false;
    }
  },
  _visitNear(g) {
    if (g.type !== 'visit' || !g.anchor) return false;
    const pos = svc.entities?.getPlayerPos?.();
    const a = Game.world?.getArea?.()?.anchor?.(g.anchor);
    if (!pos || !a || pos.area !== g.area) return false;
    return Math.hypot(pos.x - a.x, pos.z - a.z) <= (g.radius ?? 2);
  },

  async _evaluate(id) {
    const r = act()[id];
    if (!r) return;
    const g = quests.def(id)?.stages?.[r.stage]?.goal;
    if (g && quests.goalMet(g, r)) await quests._finishStage(id);
  },

  async _finishStage(id) {
    const r = act()[id];
    const def = quests.def(id);
    if (!r || !def) return;
    const stage = def.stages?.[r.stage];
    await runQ(stage?.onDone);
    if (!act()[id]) return;
    if (r.stage + 1 >= (def.stages?.length || 0)) return quests._finish(id);
    r.stage += 1;
    r.progress = {};
    Game.bus.emit(EVT.QUEST_ADVANCE, { id });
    toast(def.stages[r.stage].text || 'Quest updated', { kind: 'quest' });
    await runQ(def.stages[r.stage].onEnter);
    await quests._evaluate(id);
  },

  async _finish(id) {
    const r = act()[id];
    const def = quests.def(id);
    if (!r || !def) return;
    delete act()[id];
    Game.state.quests.done[id] = dayNum();
    if (Game.state.quests.tracked === id) Game.state.quests.tracked = null;
    for (const c of def.consume || []) svc.inventory.remove(c.id, c.qty);
    const rw = def.reward || {};
    if (rw.money) svc.inventory.addMoney(rw.money);
    for (const it of rw.items || []) svc.inventory.give(it.id, it.qty ?? 1);
    for (const [npc, n] of Object.entries(rw.aff || {})) svc.rel.addAff(npc, n);
    for (const f of rw.flags || []) setFlag(f, true);
    toast(`Done: ${def.title}${rw.money ? ` (+${rw.money} c)` : ''}`, { kind: 'quest', icon: 'quest' });
    sfx('quest_done');
    Game.bus.emit(EVT.QUEST_COMPLETE, { id });
    await runQ(rw.script);
  },

  /** Drop errands/quests past their expiry. */
  expire() {
    if (!Game.state) return;
    const dn = dayNum();
    for (const [id, r] of Object.entries(act())) {
      if (r.expires !== undefined && dn > r.expires) {
        delete act()[id];
        toast(`${quests.def(id)?.title || 'An errand'} has expired.`, { kind: 'info' });
      }
    }
  },

  // ---- notice board ----
  /** Today's offers (stable per dayNum). [{id,type:'errand'|'quest',title,text,giver,reward,def?,questId?}] */
  board() {
    quests.refreshBoard();
    return Game.state.quests.board.offered.filter((o) => !Game.state.quests.board.accepted.includes(o.id));
  },

  refreshBoard(force = false) {
    const b = Game.state.quests.board;
    const dn = dayNum();
    if (!force && b.day === dn) return;
    b.day = dn;
    b.accepted = [];
    const rng = rngFor('board', dn);
    const offers = [];
    const tpls = (D().errands || []).slice();
    const count = 2 + Math.floor(rng() * 2);
    const pool = tpls.slice();
    for (let n = 1; n <= count && pool.length; n++) {
      const t = weightedPick(pool, (x) => x.weight ?? 1, rng);
      pool.splice(pool.indexOf(t), 1);
      const o = quests._expandErrand(t, `errand_${dn}_${n}`, rng);
      if (o) offers.push(o);
    }
    for (const q of Object.values(D().quests || {})) {
      if (!q.board || quests.isActive(q.id)) continue;
      if (quests.isDone(q.id) && !q.repeat) continue;
      if (!svc.conditions.evalCond(q.unlock, { key: q.id })) continue;
      offers.push({ id: `quest_${q.id}`, type: 'quest', questId: q.id, title: q.title, text: q.desc, giver: q.giver, reward: q.reward?.money || 0 });
    }
    b.offered = offers;
  },

  _expandErrand(t, id, rng) {
    const p = t.pool || {};
    const npc = p.npcs?.length ? p.npcs[Math.floor(rng() * p.npcs.length)] : null;
    const item = p.items?.length ? p.items[Math.floor(rng() * p.items.length)] : null;
    const [q0, q1] = p.qty || [1, 1];
    const qty = q0 + Math.floor(rng() * (q1 - q0 + 1));
    const [m0, m1] = t.reward?.money || [20, 40];
    const pay = Math.round((m0 + rng() * (m1 - m0)) / 5) * 5;
    const itemLabel = t.kind === 'visit' ? (Game.world?.getAreaDef?.(item)?.name || String(item).replace(/_/g, ' ')) : item ? itemName(item) : '';
    const fill = (str) => String(str).replace(/\{npc\}/g, npc ? npcShort(npc) : 'someone').replace(/\{item\}/g, itemLabel).replace(/\{qty\}/g, String(qty));
    const text = fill(t.text);
    const stages = [];
    let consume;
    let accept;
    switch (t.kind) {
      case 'deliver':
        stages.push({ id: 'deliver', text, goal: { type: 'talk', npc } });
        accept = [{ id: item, qty }];
        consume = accept;
        break;
      case 'bring':
        stages.push({ id: 'gather', text: `Gather ${qty} × ${itemLabel}`, goal: { type: 'have', item, qty } });
        stages.push({ id: 'bring', text: `Bring them to ${npc ? npcShort(npc) : 'the client'}`, goal: { type: 'talk', npc } });
        consume = [{ id: item, qty }];
        break;
      case 'catch': stages.push({ id: 'catch', text, goal: { type: 'catch', fish: item || 'any', qty } }); break;
      case 'forage': stages.push({ id: 'forage', text, goal: { type: 'forage', item, qty } }); break;
      case 'visit': stages.push({ id: 'visit', text, goal: { type: 'visit', area: item } }); break;
      default: return null;
    }
    const aff = t.reward?.aff && npc ? { [npc]: t.reward.aff } : undefined;
    const def = { id, kind: 'errand', title: text.length > 40 ? `${text.slice(0, 38)}…` : text, giver: npc, desc: text, stages, reward: { money: pay, ...(aff ? { aff } : {}) }, consume };
    return { id, type: 'errand', title: def.title, text, giver: npc, reward: pay, def, accept };
  },

  /** Accept an offer from today's board. Returns boolean. */
  accept(offerId) {
    const b = Game.state.quests.board;
    const o = b.offered.find((x) => x.id === offerId);
    if (!o || b.accepted.includes(offerId)) return false;
    if (o.type === 'quest') {
      if (!quests.start(o.questId)) return false;
    } else {
      const errands = Object.keys(act()).filter((k) => k.startsWith('errand_')).length;
      if (errands >= MAX_ERRANDS) {
        toast(`You're already helping with ${MAX_ERRANDS} errands.`, { kind: 'warn' });
        return false;
      }
      for (const a of o.accept || []) svc.inventory.give(a.id, a.qty, { silent: false });
      quests.start(o.id, { def: o.def, expires: dayNum() + 2 });
    }
    b.accepted.push(offerId);
    return true;
  },

  /** Notice-board UI: list offers via dialogue.ask, confirm, accept. */
  async openBoard() {
    const ui = Game.ui?.dialogue;
    if (!ui) return;
    for (;;) {
      const offers = quests.board();
      if (!offers.length) {
        await ui.narrate?.('The board has nothing new today. Check back tomorrow!');
        return;
      }
      const idx = await ui.ask({
        prompt: 'Notice Board — pick a job to read:',
        options: [...offers.map((o) => ({ text: `${o.title}${o.reward ? ` — ${o.reward} c` : ''}` })), { text: 'Step away' }],
      });
      if (typeof idx !== 'number' || idx >= offers.length) return;
      const o = offers[idx];
      const yes = await ui.ask({
        prompt: `${o.text}${o.reward ? ` (Reward: ${o.reward} c)` : ''}`,
        options: [{ text: 'Take this job' }, { text: 'Not now' }],
      });
      if (yes === 0) quests.accept(o.id);
    }
  },
};
