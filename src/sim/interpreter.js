// Event-script interpreter. Implements EVERY op in OPS (src/sim/script_dsl.js).
// State changes (flags, hearts, money, items, quests...) happen here; everything presentational goes through the Stage
// the scene supplies (see docs/game/02_SIM_CONTENT_CONTRACTS.md section 7). Errors in an op are logged with the event id
// and op index and END the script (the game never crashes because of one bad op).
import { CLUBS, CLUB_LABEL, SUBJECT_LABEL, TRAIT_LABEL, CURRENCY } from '../core/constants.js';
import { evaluateCondition } from './conditions.js';
import * as relationships from './relationships.js';
import * as inventory from './inventory.js';
import * as player from './player.js';
import * as clock from './clock.js';
import { CAST_BY_ID } from '../data/cast.js';
import { ITEM_BY_ID } from '../data/items.js';

export const RANK_NUM = { gold: 3, silver: 2, bronze: 1, none: 0 };
export const MAX_OPS = 5000;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const nameOf = (id) => (CAST_BY_ID[id] ? CAST_BY_ID[id].short || CAST_BY_ID[id].name : id);
const isCharacter = (who) => !!who && who !== 'narrator' && who !== 'unknown' && who !== 'theo';

function toast(run, text, icon = null) {
  run.bus.emit('toast', { text, icon });
}
const cond = (run, c) => evaluateCondition(c, run.state, { map: run.stage && run.stage.currentMap ? run.stage.currentMap() : undefined, eventId: run.eventId });

const H = {
  // ---- dialogue
  async say(op, run) {
    if (isCharacter(op.who)) relationships.markMet(run.state, op.who, run.opts);
    await run.stage.say({ who: op.who, face: op.face || 'neutral', text: op.text, name: op.name });
  },
  async narrate(op, run) { await run.stage.narrate(op.text); },
  async think(op, run) { await run.stage.think(op.text); },
  async choice(op, run) {
    const avail = op.options.map((o, i) => ({ o, i })).filter(({ o }) => !o.if || cond(run, o.if));
    if (!avail.length) return;
    const idx = await run.stage.choice(avail.map(({ o }) => o.text));
    const picked = avail[clamp(Number.isInteger(idx) ? idx : 0, 0, avail.length - 1)];
    if (op.store) run.vars[op.store] = picked.i;
    run.vars.choice = picked.i;
    await execList(picked.o.do || [], run);
  },
  // ---- flow
  async if(op, run) { await execList(cond(run, op.cond) ? op.then : op.else || [], run); },
  async wait(op, run) { await run.stage.wait(op.ms); },
  async end(op, run) { run.ended = true; },
  // ---- staging (all forwarded to the Stage)
  async warp(op, run) { await run.stage.warp({ map: op.map, at: op.at || 'entrance', dir: op.dir, fade: op.fade !== false }); },
  async place(op, run) { await run.stage.place({ who: op.who, at: op.at, dir: op.dir }); },
  async hide(op, run) { await run.stage.hide(op.who); },
  async moveTo(op, run) { await run.stage.moveTo({ who: op.who, to: op.to, speed: op.speed || 'walk', wait: op.wait !== false }); },
  async face(op, run) { await run.stage.face({ who: op.who, dir: op.dir, toward: op.toward }); },
  async pose(op, run) { await run.stage.pose({ who: op.who, pose: op.pose }); },
  async emote(op, run) { await run.stage.emote({ who: op.who, emote: op.emote }); },
  async cam(op, run) { await run.stage.cam({ focus: op.focus, ms: op.ms, reset: op.reset, shake: op.shake }); },
  async fade(op, run) { await run.stage.fade({ dir: op.dir, ms: op.ms ?? 500, color: op.color || '#000000' }); },
  async flash(op, run) { await run.stage.flash({ ms: op.ms ?? 300, color: op.color || '#ffffff' }); },
  async lighting(op, run) { await run.stage.lighting(op.preset); },
  async sfx(op, run) { await run.stage.sfx(op.id); },
  async music(op, run) { await run.stage.music(op.id, op.fadeMs ?? 800); },
  async musicResume(op, run) { await run.stage.musicResume(); },
  async banner(op, run) { await run.stage.banner({ text: op.text, sub: op.sub, ms: op.ms ?? 2500 }); },
  // ---- state changes
  async setFlag(op, run) {
    const value = op.value === undefined ? true : op.value;
    player.setFlag(run.state, op.name, value, run.opts);
    const m = /^club_pick_(\w+)$/.exec(op.name);
    if (m && value && CLUBS.includes(m[1]) && run.state.school.club !== m[1]) {
      run.state.school.club = m[1]; run.state.school.clubRank = 0; run.state.school.clubXp = 0;
      toast(run, `Joined the ${CLUB_LABEL[m[1]]}!`, 'star');
    }
  },
  async addCounter(op, run) { run.state.counters[op.name] = (run.state.counters[op.name] || 0) + op.delta; },
  async friend(op, run) {
    if (!isCharacter(op.npc)) return;
    relationships.markMet(run.state, op.npc, run.opts);
    const applied = relationships.addFriendship(run.state, op.npc, op.delta, run.opts);
    if (applied) toast(run, `${nameOf(op.npc)} ♥ ${applied > 0 ? '+' : ''}${applied}`, applied > 0 ? 'heart_full' : 'heart_empty');
  },
  async money(op, run) {
    const applied = player.addMoney(run.state, op.delta, run.opts);
    if (applied) toast(run, `${applied > 0 ? '+' : '-'}${CURRENCY}${Math.abs(applied)}`, 'coin');
  },
  async energy(op, run) { player.addEnergy(run.state, op.delta, run.opts); },
  async stat(op, run) {
    const applied = player.addStat(run.state, op.stat, op.delta, run.opts);
    if (applied) toast(run, `${SUBJECT_LABEL[op.stat] || TRAIT_LABEL[op.stat] || 'Conduct'} ${applied > 0 ? '+' : ''}${applied}`);
  },
  async giveItem(op, run) {
    const qty = op.qty || 1, item = ITEM_BY_ID[op.item];
    if (inventory.canAdd(run.state, op.item, qty, run.opts)) {
      inventory.add(run.state, op.item, qty, run.opts);
      toast(run, `Got ${item ? item.name : op.item}${qty > 1 ? ` x${qty}` : ''}`, item && item.icon);
    } else toast(run, 'Your bag is full!', 'warning');
  },
  async takeItem(op, run) { inventory.remove(run.state, op.item, op.qty || 1, run.opts); },
  async time(op, run) { clock.advance(run.state, op.minutes, run.opts); },
  async quest(op, run) {
    const q = run.state.quests, title = (run.quests[op.id] && run.quests[op.id].title) || op.id;
    const abs = run.state.time.absDay;
    if (op.state === 'start') {
      if (!q[op.id]) { q[op.id] = { state: 'active', startedAbsDay: abs, notes: op.note ? [op.note] : [] }; toast(run, `New quest: ${title}`, 'star'); }
    } else {
      if (!q[op.id]) q[op.id] = { state: 'active', startedAbsDay: abs, notes: [] };
      if (op.note) q[op.id].notes.push(op.note);
      if (op.state === 'complete') { q[op.id].state = 'complete'; toast(run, `Quest complete: ${title}`, 'trophy'); }
      else if (op.state === 'fail') q[op.id].state = 'failed';
      else if (op.state === 'update' && op.note) toast(run, 'Journal updated', 'book');
    }
    run.bus.emit('quest:changed', { id: op.id, state: q[op.id].state });
  },
  async spirit(op, run) {
    const s = run.state.school, from = s.spirit;
    s.spirit = clamp(from + op.delta, 0, 100);
    if (s.spirit !== from) toast(run, `Community Spirit ${s.spirit > from ? '+' : ''}${s.spirit - from}`, 'bell');
  },
  async romance(op, run) {
    const r = run.state.romance;
    if (op.state === 'dating') {
      r.partner = op.npc; r.dating[op.npc] = { sinceAbsDay: run.state.time.absDay }; r.confessed[op.npc] = true;
      r.exes = r.exes.filter((x) => x !== op.npc);
    } else if (r.dating[op.npc] || r.partner === op.npc) {
      delete r.dating[op.npc];
      if (r.partner === op.npc) r.partner = null;
      if (!r.exes.includes(op.npc)) r.exes.push(op.npc);
    }
  },
  async call(op, run) {
    const r = (await run.stage.call({ scene: op.scene, id: op.id, opts: op.opts })) || {};
    if (op.store) {
      run.state.counters[op.store] = Number.isFinite(r.score) ? r.score : 0;
      run.state.counters[`${op.store}_rank`] = RANK_NUM[r.rank] ?? 0;
    }
    run.vars.lastCall = r;
  },
  async endGame(op, run) { await run.stage.endGame(); run.ended = true; },
};
export const HANDLERS = H;

async function execList(ops, run) {
  for (let i = 0; i < ops.length && !run.ended; i++) {
    if (++run.count > MAX_OPS) { console.error(`[script ${run.eventId}] op budget exceeded; stopping`); run.ended = true; return; }
    const op = ops[i];
    const h = H[op.op];
    if (!h) { console.error(`[script ${run.eventId}] unknown op "${op.op}" at ${i}`); run.ended = true; return; }
    try { await h(op, run); } catch (e) {
      console.error(`[script ${run.eventId}] op #${i} (${op.op}) failed:`, e);
      run.ended = true;
      return;
    }
  }
}

/**
 * Run a script. env: { state, stage, bus, quests (id -> {title}), vars, eventId, opts (passed to sim helpers) }.
 * Returns { ended, vars } once the script finishes (also after an error).
 */
export async function runScript(ops, env) {
  const run = {
    state: env.state, stage: env.stage, bus: env.bus, quests: env.quests || {}, vars: env.vars || {},
    eventId: env.eventId || null, opts: { bus: env.bus, ...(env.opts || {}) }, ended: false, count: 0,
  };
  await execList(ops, run);
  return { ended: run.ended, vars: run.vars };
}
