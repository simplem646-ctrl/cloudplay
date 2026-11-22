/**
 * Part-time jobs (svc.jobs): bakery shift (kneading), parcel run (delivery) and lamplighter.
 * `start(jobId)` is called by the S1 `job` interact handler. State: state.jobs.doneDay[id] = dayNum, state.jobs.parcel, state.jobs.lamp.
 */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { NPC_IDS } from '../core/registry.js';
import { clamp, rngFor, timeInRange, parseHHMM, formatClock12 } from '../core/util.js';
import { svc } from './svc.js';
import { D, subs, dayNum, curWeekday, toast, sfx, npcShort, getFlag, setFlag } from './kit.js';

const s = subs();
const dlg = () => Game.ui?.dialogue;
const narrate = (t) => dlg()?.narrate?.(svc.script.interpolate(t));
const playerRig = () => svc.entities?.getPlayerRig?.() || null;

async function locked(fn) {
  const prev = Game.mode;
  if (prev === 'field') Game.setMode('cutscene');
  try {
    return await fn();
  } finally {
    if (Game.mode === 'cutscene' && prev === 'field') Game.setMode('field');
  }
}

const defs = () => D().jobs || {};
const jobsState = () => Game.state.jobs;
const doneToday = (id) => jobsState().doneDay?.[id] === dayNum();
const windowText = (def) => `${formatClock12(parseHHMM(def.from))} and ${formatClock12(parseHHMM(def.to))}`;

/** Returns the reason text when the job cannot be worked right now, else null. */
function blocked(def) {
  const st = Game.state;
  if (doneToday(def.id)) return "You've already done your shift today. Come back tomorrow.";
  if (def.days && !def.days.includes(curWeekday())) return 'There is no work here today.';
  if (!timeInRange(st.time.minutes, def.from, def.to)) return `Come back between ${windowText(def)}.`;
  const info = svc.shops?.closedInfo?.(def.area);
  if (info && info.reason !== 'hours') return `No work today. ${info.text}`;
  if (st.player.energy < def.energy) return "You're too tired for a shift right now. Eat something or rest first.";
  return null;
}

async function finishJob(def, { score, pay, runDone = true }) {
  jobsState().doneDay[def.id] = dayNum();
  Game.bus.emit(EVT.JOB_DONE, { id: def.id, score, pay });
  if (runDone && def.done?.length) await svc.script.run(def.done, { npc: def.boss, source: `${def.id}.done` });
}

async function intro(def) {
  const flag = `job_intro_${def.id}`;
  if (getFlag(flag)) return;
  setFlag(flag, true);
  if (def.intro?.length) await svc.script.run(def.intro, { npc: def.boss, source: `${def.id}.intro` });
}

// ---------------------------------------------------------------- bakery
async function bakery(def) {
  const st = Game.state;
  if (!(await Game.ui?.confirm?.(`Start your shift at the bakery? (−${def.energy} energy)`, { yes: 'Start', no: 'Not now' }))) return;
  if (!svc.inventory.spendEnergy(def.energy)) return;
  await locked(async () => {
    const rig = playerRig();
    sfx('knead');
    rig?.play?.('knead', { loop: true });
    const res = await Game.ui?.minigames?.kneading?.({ difficulty: 2, rounds: 3 });
    rig?.stop?.();
    const score = clamp(res?.score ?? 0.5, 0, 1);
    const pay = def.pay.base + Math.round(def.pay.bonus * score);
    const end = parseHHMM(def.to);
    svc.clock.advance(Math.max(1, Math.min(180, end - st.time.minutes)));
    svc.rel.addAff('mira', 10);
    svc.rel.addAff('rosalind', 8);
    svc.inventory.addMoney(pay);
    toast(`Shift done! You earned ${pay} c.`, { kind: 'item', icon: 'coin' });
    await finishJob(def, { score, pay });
  });
}

// ---------------------------------------------------------------- parcels
function parcel() {
  const p = jobsState().parcel;
  if (p && p.day !== dayNum()) {
    delete jobsState().parcel;
    return null;
  }
  return p || null;
}

async function parcelRun(def) {
  const st = Game.state;
  const p = parcel();
  if (p) return parcelReport(def, p);
  if (!(await Game.ui?.confirm?.(`Take on a parcel run? (−${def.energy} energy)`, { yes: 'Take it', no: 'Not now' }))) return undefined;
  if (!svc.inventory.spendEnergy(def.energy)) return undefined;
  const rng = rngFor('parcel', dayNum());
  const here = NPC_IDS.filter((n) => n !== def.boss && svc.npcs?.whereIs?.(n)?.hidden === false);
  const pool = here.length >= 3 ? here : NPC_IDS.filter((n) => n !== def.boss);
  const want = 3 + Math.floor(rng() * 3);
  const list = [];
  const bag = pool.slice();
  while (list.length < want && bag.length) list.push({ to: bag.splice(Math.floor(rng() * bag.length), 1)[0], done: false });
  const m = st.time.minutes;
  jobsState().parcel = { day: dayNum(), start: m, deadline: m + 180, list, paid: 0 };
  sfx('item_get');
  const names = list.map((x) => npcShort(x.to)).join(', ');
  toast(`${list.length} parcels: ${names}`, { kind: 'quest', icon: 'parcel' });
  await narrate(`You pick up ${list.length} parcels for ${names}. Deliver them by ${formatClock12(m + 180)} for the best pay. Talk to each person to hand theirs over.`);
  return undefined;
}

async function parcelReport(def, p) {
  const m = Game.state.time.minutes;
  const left = p.list.filter((x) => !x.done);
  const total = p.list.length;
  if (left.length && m <= p.deadline) {
    return narrate(`You still have parcels for ${left.map((x) => npcShort(x.to)).join(', ')}. Deliver them by ${formatClock12(p.deadline)}.`);
  }
  const delivered = total - left.length;
  delete jobsState().parcel;
  if (!delivered) {
    toast('The parcels were returned undelivered.', { kind: 'warn' });
    return narrate('Time ran out and nothing was delivered. Theo sighs and takes the parcels back. Try again tomorrow.');
  }
  if (left.length) toast(`${left.length} parcel(s) came back late.`, { kind: 'warn' });
  return finishJob(def, { score: delivered / total, pay: p.paid });
}

/** Hand a parcel to its addressee (called from the NPC talk flow BEFORE svc.rel.talk). Returns true when handled. */
async function handOver(npcId) {
  const p = parcel();
  if (!p) return false;
  const m = Game.state.time.minutes;
  if (m > p.deadline) return false;
  const e = p.list.find((x) => !x.done && x.to === npcId);
  if (!e) return false;
  const frac = clamp((m - p.start) / (p.deadline - p.start), 0, 1);
  const bonus = Math.round(30 * (1 - frac));
  const pay = 25 + bonus;
  e.done = true;
  p.paid += pay;
  await svc.script.run([{ say: npcId, text: `A parcel for me? Thank you, {player}! That was quick.`, expr: 'happy' }], { npc: npcId, source: 'parcel' });
  svc.inventory.addMoney(pay);
  toast(`Delivered! +${pay} c${bonus ? ` (speed bonus ${bonus})` : ''}`, { kind: 'item', icon: 'coin' });
  if (p.list.every((x) => x.done)) toast('All parcels delivered! Report back to Theo at the post counter.', { kind: 'quest' });
  return true;
}

// ---------------------------------------------------------------- lamplighter
const lampState = () => {
  const l = jobsState().lamp;
  if (l && l.day !== dayNum()) {
    delete jobsState().lamp;
    return null;
  }
  return l || null;
};

async function settleLamps(def, { auto = false } = {}) {
  const l = lampState();
  if (!l) return;
  delete jobsState().lamp;
  const all = !!svc.lamps?.allRepairedLit?.();
  const bonus = all && l.count > 0 ? def.pay.bonus : 0;
  const pay = l.count * def.pay.base + bonus;
  if (pay) svc.inventory.addMoney(pay);
  toast(`${l.count} lamp${l.count === 1 ? '' : 's'} lit${bonus ? ' — the whole town glows! Bonus!' : ''} +${pay} c`, { kind: 'item', icon: 'coin' });
  await finishJob(def, { score: all ? 1 : Math.min(1, l.count / 6), pay, runDone: !auto });
}

async function lamplighter(def) {
  const l = lampState();
  if (l) {
    if (!l.count) return narrate('You have not lit any lamps yet. Light the mended street lamps around town, then come back.');
    return settleLamps(def);
  }
  const why = blocked(def);
  if (why) return narrate(why);
  await intro(def);
  if (!(await Game.ui?.confirm?.(`Start the lamplighter's round? (−${def.energy} energy)`, { yes: 'Start', no: 'Not now' }))) return undefined;
  if (!svc.inventory.spendEnergy(def.energy)) return undefined;
  jobsState().lamp = { day: dayNum(), count: 0 };
  toast("Light every mended street lamp, then return to Odell's desk.", { kind: 'quest' });
  return undefined;
}

export const jobs = {
  init() {
    s.clear();
    s.on(EVT.TIME_TICK, ({ minutes }) => {
      if (!Game.state || minutes < 1170 || !jobsState().lamp) return;
      const def = defs().lamplighter;
      if (def && lampState()) settleLamps(def, { auto: true });
    });
    s.on(EVT.TIME_NEWDAY, () => {
      const j = Game.state?.jobs;
      if (!j) return;
      delete j.parcel;
      delete j.lamp;
    });
  },

  parcel,
  lampState,

  /** May the player enter `areaId` outside opening hours because a job works there right now? */
  hasAccess(areaId, minutes) {
    const st = Game.state;
    if (!st) return false;
    const m = minutes ?? st.time.minutes;
    return Object.values(defs()).some((d) => d.area === areaId && (!d.days || d.days.includes(curWeekday())) && timeInRange(m, d.from, d.to));
  },

  /** Start / continue a job (the `job` interactable handler). */
  async start(jobId) {
    const def = defs()[jobId];
    if (!def || !Game.state) return undefined;
    if (def.kind === 'lamplighter') return lamplighter(def);
    if (def.kind === 'delivery') {
      if (parcel()) return parcelRun(def);
      const why = blocked(def);
      if (why) return narrate(why);
      await intro(def);
      return parcelRun(def);
    }
    const why = blocked(def);
    if (why) return narrate(why);
    await intro(def);
    return bakery(def);
  },

  handOver,

  /** A repaired lamp was lit (activities.js). Counts for the lamplighter job. */
  onLampLit() {
    const l = Game.state && lampState();
    if (l) {
      l.count += 1;
      toast(`Lamps lit: ${l.count}`, { kind: 'info' });
    }
  },
};
