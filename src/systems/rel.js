/** Relationships: affection, hearts, talk, gifts, dating. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { AFFECTION } from '../core/constants.js';
import { ROMANCE_IDS, NPC_IDS, SEASONS } from '../core/registry.js';
import { defaultRel } from '../core/state.js';
import { clamp, rngFor, weightedPick } from '../core/util.js';
import { svc } from './svc.js';
import { D, subs, dayNum, npcDef, npcShort, itemDef, itemName, playerName, toast, sfx, setFlag, getFlag, parseLine } from './kit.js';

export const REL_EVT = { GIFT: 'npc:gift' };
const s = subs();
const LEVELS = ['love', 'like', 'dislike', 'hate'];

const rec = (npc) => {
  const r = Game.state.rel;
  return r[npc] || (r[npc] = defaultRel());
};
const week = () => Math.floor((dayNum() - 1) / 7);

export const rel = {
  init() {
    s.clear();
    s.on(EVT.TIME_NEWDAY, () => rel.onNewDay());
    s.on(EVT.FLAG_SET, ({ name, value }) => {
      const m = /^(.+)_dating$/.exec(name);
      if (m && Game.state?.rel?.[m[1]]) rel._syncDating(m[1], value);
    });
  },

  rec,
  aff: (npc) => (Game.state ? rec(npc).aff : 0),
  hearts: (npc) => Math.floor(rel.aff(npc) / AFFECTION.perHeart),
  met: (npc) => !!(Game.state && (rec(npc).met || getFlag(`met_${npc}`) || npcDef(npc)?.startMet)),
  /** Dating is derived from the flag `<npc>_dating`; rel.status is kept in sync. */
  status: (npc) => (getFlag(`${npc}_dating`) ? 'dating' : 'none'),
  partner: () => ROMANCE_IDS.concat(NPC_IDS).find((n, i, a) => a.indexOf(n) === i && getFlag(`${n}_dating`)) || null,
  canRomance(npc) {
    const p = rel.partner();
    return (ROMANCE_IDS.includes(npc) || npcDef(npc)?.romance) && (!p || p === npc);
  },
  _syncDating(npc, value) {
    const p = rec(npc);
    if (value) {
      const other = NPC_IDS.find((n) => n !== npc && getFlag(`${n}_dating`));
      if (other) {
        // only one partner: the first one wins
        delete Game.state.flags[`${npc}_dating`];
        return;
      }
      p.status = 'dating';
    } else p.status = 'none';
  },
  setDating(npc, on = true) {
    if (on && !rel.canRomance(npc)) return false;
    setFlag(`${npc}_dating`, !!on);
    return rel.status(npc) === (on ? 'dating' : 'none');
  },

  meet(npc) {
    const r = rec(npc);
    if (!r.met) r.met = true;
    if (!getFlag(`met_${npc}`)) setFlag(`met_${npc}`, true);
  },

  /** Add affection (clamped 0..1000); emits affection:change; heart toast + sfx on heart gain. */
  addAff(npc, delta, o = {}) {
    if (!Game.state || !delta) return 0;
    const r = rec(npc);
    const beforeH = Math.floor(r.aff / AFFECTION.perHeart);
    const before = r.aff;
    r.aff = clamp(r.aff + delta, 0, AFFECTION.max);
    const applied = r.aff - before;
    const h = Math.floor(r.aff / AFFECTION.perHeart);
    if (applied === 0) return 0;
    Game.bus.emit(EVT.AFFECTION_CHANGE, { npc, delta: applied, total: r.aff, hearts: h });
    if (h > beforeH && !o.silent) {
      toast(`${npcShort(npc)} ♥ ${h}`, { kind: 'heart', icon: 'heart' });
      sfx('heart_up');
    }
    return applied;
  },

  isBirthday(npc) {
    const b = npcDef(npc)?.birthday;
    const t = Game.state?.time;
    return !!(b && t && SEASONS.indexOf(b.season) === t.season && b.day === t.day);
  },

  /** Preference of an item for an NPC: love|like|dislike|hate|neutral. Item ids beat tags; love > like > dislike > hate. */
  preference(npc, itemId) {
    const def = npcDef(npc);
    if (!def) return 'neutral';
    const tags = itemDef(itemId)?.tags || [];
    for (const lv of LEVELS) if (def[lv + 's']?.items?.includes(itemId) || def[lv]?.items?.includes(itemId)) return lv;
    for (const lv of LEVELS) {
      const t = def[lv + 's']?.tags || def[lv]?.tags;
      if (t && tags.some((x) => t.includes(x))) return lv;
    }
    return 'neutral';
  },

  /** Daily decay of partial heart progress after 3+ idle days. */
  onNewDay() {
    if (!Game.state) return;
    const dn = dayNum();
    for (const npc of Object.keys(Game.state.rel)) {
      const r = rec(npc);
      if (!r.met) continue;
      const last = Math.max(r.talkedDay, r.giftDay);
      if (last < 0 || dn - last < AFFECTION.decayAfterDays) continue;
      const partial = r.aff % AFFECTION.perHeart;
      if (partial > 0) r.aff -= Math.min(AFFECTION.decayPerDay, partial);
    }
  },

  async _say(npc, line, expr) {
    const { text, expr: e } = parseLine(line);
    await svc.script.run([{ say: npc, text, expr: e || expr }], { npc, source: 'talk' });
  },

  /** Conversation with an NPC: intro on first meeting, else a seeded weighted talk entry. */
  async talk(npcId) {
    if (!Game.state) return;
    const dn = dayNum();
    const r = rec(npcId);
    const dlg = D().dialogue?.[npcId];
    Game.bus.emit(EVT.NPC_TALK, { id: npcId });
    Game.bus.emit(EVT.DIALOGUE_START, { id: npcId });
    try {
      if (!rel.met(npcId)) {
        rel.meet(npcId);
        if (dlg?.intro?.length) await svc.script.run(dlg.intro, { npc: npcId, source: `${npcId}.intro` });
        else await rel._say(npcId, `Hello! I'm ${npcShort(npcId)}. Nice to meet you, ${playerName()}.`);
      } else {
        const entries = (dlg?.talk || []).filter((e) => svc.conditions.evalCond(e.when, { npc: npcId, key: e.id }));
        const lastId = r.seen._last;
        let pool = entries.filter((e) => e.id !== lastId);
        if (!pool.length) pool = entries;
        if (pool.length) {
          const n = r.seen._nDay === dn ? r.seen._n : 0;
          const e = weightedPick(pool, (x) => x.weight ?? 1, rngFor('talk', npcId, dn, n));
          r.seen._last = e.id;
          r.seen._nDay = dn;
          r.seen._n = n + 1;
          const steps = (e.lines || []).map((l) => {
            const { text, expr } = parseLine(l);
            return { say: npcId, text, expr };
          });
          await svc.script.run(steps, { npc: npcId, source: `${npcId}.talk.${e.id}` });
          if (e.after) await svc.script.run(e.after, { npc: npcId, source: `${npcId}.talk.${e.id}.after` });
        } else await rel._say(npcId, '…');
      }
      if (r.talkedDay !== dn) {
        r.talkedDay = dn;
        rel.addAff(npcId, AFFECTION.talk * (rel.isBirthday(npcId) ? AFFECTION.birthdayMult : 1));
      }
    } finally {
      Game.bus.emit(EVT.DIALOGUE_END, { id: npcId });
    }
  },

  /** Gift flow: pick an item, react, apply affection, consume. Returns {gave, reaction, delta}|null. */
  async giftFlow(npcId) {
    if (!Game.state || !Game.ui?.pickItem) return null;
    const dn = dayNum();
    const r = rec(npcId);
    const gl = D().dialogue?.[npcId]?.gifts || {};
    const sayLine = async (list, fallback) => {
      const pool = list?.length ? list : [fallback];
      const line = pool[Math.floor(rngFor('giftline', npcId, dn, r.giftsThisWeek)() * pool.length)];
      await rel._say(npcId, line);
    };
    if (r.giftDay === dn) {
      await sayLine(gl.again, "You've already given me something today, but thank you!");
      return null;
    }
    const slot = await Game.ui.pickItem({
      prompt: `Give what to ${npcShort(npcId)}?`,
      filter: (sl) => sl && !itemDef(sl.id)?.key && itemDef(sl.id)?.category !== 'key',
    });
    if (slot === null || slot === undefined) return null;
    const stack = Game.state.inventory.slots[slot];
    if (!stack) return null;
    const itemId = stack.id;
    const reaction = rel.preference(npcId, itemId);
    if (r.giftWeek !== week()) {
      r.giftWeek = week();
      r.giftsThisWeek = 0;
    }
    const capped = r.giftsThisWeek >= AFFECTION.giftsPerWeekSoftCap;
    let delta = AFFECTION.gift[reaction];
    const birthday = rel.isBirthday(npcId) && (reaction === 'love' || reaction === 'like');
    if (birthday) delta *= AFFECTION.birthdayMult;
    if (capped) delta = 0;
    inventoryRemove(slot);
    r.giftDay = dn;
    r.giftsThisWeek += 1;
    const lg = (Game.state.log.gifts[npcId] ||= {});
    lg[itemId] = (lg[itemId] || 0) + 1;
    Game.bus.emit(REL_EVT.GIFT, { npc: npcId, item: itemId, qty: 1, reaction });
    Game.bus.emit(EVT.DIALOGUE_START, { id: npcId });
    if (capped) {
      await sayLine(gl.generous, `You've been so generous this week, ${playerName()}! I really can't accept more.`);
    } else if (birthday) {
      await sayLine(gl.birthday, 'You remembered my birthday? Thank you!');
    } else {
      await sayLine(gl[reaction], reaction === 'hate' ? "Oh… I don't really like this." : 'Thank you!');
    }
    Game.bus.emit(EVT.DIALOGUE_END, { id: npcId });
    if (delta) rel.addAff(npcId, delta);
    rel.meet(npcId);
    return { gave: itemId, reaction, delta, birthday, capped, name: itemName(itemId) };
  },
};

function inventoryRemove(slot) {
  svc.inventory.removeSlot(slot, 1);
}
