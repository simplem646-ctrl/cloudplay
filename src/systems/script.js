/**
 * Script interpreter (ARCHITECTURE §11). Staging ops (area place move face anim expr emote hold camera hide show
 * effect lamps decor) are registered by S2 via registerOp.
 *
 * Op handler: `async (step, ctx) => void | 'end' | {goto}`; ctx = {vars, runSteps(steps), interpolate(str), npc, source}.
 */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { clamp, formatDate, seasonName, weekdayName, parseHHMM } from '../core/util.js';
import { svc } from './svc.js';
import {
  D, opts, warnOnce, toast, sfx, sleepMs, setFlag, clearFlag, incFlag, itemName, npcName, npcShort, npcDef, playerName, cap, money,
} from './kit.js';

export const MAX_STEPS = 5000;
const MAX_DEPTH = 16;
const ops = Object.create(null);
const active = new Set();
let queueTail = Promise.resolve();

/** Modifier keys that never name an op by themselves. */
const MODIFIERS = new Set(['wait', 'at', 'to', 'toward', 'name', 'loop', 'speed', 'facing', 'sub', 'ms', 'text', 'expr', 'side', 'prompt',
  'var', 'value', 'by', 'qty', 'silent', 'amount', 'icon', 'fadeMs', 'color', 'prop', 'then', 'else', 'speaker', 'zoom', 'count']);

const WEEKDAY_FULL = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

// ---- text tokens ----
export function interpolate(str) {
  if (typeof str !== 'string' || !str.includes('{')) return str;
  const st = Game.state;
  return str.replace(/\{(\w+)(?::([\w]+))?\}/g, (m, k, arg) => {
    switch (k) {
      case 'player': return playerName();
      case 'name': return arg ? npcName(arg) : m;
      case 'short': return arg ? npcShort(arg) : m;
      case 'item': return arg ? itemName(arg) : m;
      case 'season': return st ? seasonName(st.time.season) : m;
      case 'weekday': return st ? WEEKDAY_FULL[weekdayName(st.time.day)] : m;
      case 'date': return st ? formatDate(st.time) : m;
      case 'money': return st ? money(st.player.money) : m;
      case 'hearts': return arg && st ? String(svc.rel?.hearts(arg) ?? 0) : m;
      default: return m;
    }
  });
}

/** Resolve a script id to steps: events, '<npc>.intro', interactions, dialogue intro. */
export function resolveScript(id) {
  const d = D();
  if (d.events?.[id]?.script) return d.events[id].script;
  if (typeof id === 'string' && id.endsWith('.intro') && d.dialogue?.[id.slice(0, -6)]?.intro) return d.dialogue[id.slice(0, -6)].intro;
  const ia = d.interactions?.[id];
  if (ia) return Array.isArray(ia) ? ia : ia.script || null;
  if (d.dialogue?.[id]?.intro) return d.dialogue[id].intro;
  return null;
}

class Abort extends Error {}

function pickOp(step) {
  const keys = Object.keys(step);
  const cands = keys.filter((k) => ops[k] && !(k === 'wait' && typeof step.wait === 'boolean'));
  if (cands.length) return cands[0];
  if (typeof step.wait === 'number' && keys.length === 1) return 'wait';
  return null;
}

async function execSteps(steps, rctx, top) {
  const labels = rctx.labels;
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!step || typeof step !== 'object') continue;
    if (++rctx.guard.n > MAX_STEPS) {
      console.warn(`[systems] script "${rctx.source}" exceeded ${MAX_STEPS} steps; aborting`);
      throw new Abort();
    }
    const op = pickOp(step);
    if (!op) {
      const name = Object.keys(step).find((k) => !MODIFIERS.has(k)) || Object.keys(step)[0];
      warnOnce(`op:${name}`, `unknown script op "${name}" (skipped)`);
      continue;
    }
    const sig = await ops[op](step, rctx);
    if (sig === 'end') return 'end';
    if (sig && typeof sig === 'object' && 'goto' in sig) {
      if (top && labels && sig.goto in labels) {
        i = labels[sig.goto];
        continue;
      }
      if (top) {
        warnOnce(`label:${sig.goto}`, `goto unknown label "${sig.goto}" in "${rctx.source}"`);
        return 'end';
      }
      return sig;
    }
  }
  return undefined;
}

function makeCtx(base, steps, extra = {}) {
  const labels = {};
  steps.forEach((s, i) => {
    if (s && typeof s === 'object' && typeof s.label === 'string') labels[s.label] = i;
  });
  const rctx = {
    vars: base?.vars || {},
    npc: base?.npc,
    source: base?.source || 'inline',
    guard: base?.guard || { n: 0 },
    depth: base?.depth || 0,
    labels,
    interpolate,
    ...extra,
  };
  rctx.runSteps = (sub) => execSteps(Array.isArray(sub) ? sub : [], rctx, false);
  return rctx;
}

async function runTop(steps, o) {
  const rctx = makeCtx(o, steps);
  try {
    await execSteps(steps, rctx, true);
  } catch (err) {
    if (!(err instanceof Abort)) throw err;
  }
}

/** Run a script by id or inline steps. Event scripts (and opts.cutscene) switch to 'cutscene' mode and restore it afterwards. */
async function run(idOrSteps, o = {}) {
  let steps = idOrSteps;
  let source = o.source;
  if (typeof idOrSteps === 'string') {
    source ||= idOrSteps;
    steps = resolveScript(idOrSteps);
    if (!steps) {
      warnOnce(`script:${idOrSteps}`, `unknown script "${idOrSteps}"`);
      return;
    }
    if (o.cutscene === undefined && D().events?.[idOrSteps]) o = { ...o, cutscene: true };
  }
  if (steps && !Array.isArray(steps)) steps = [steps];
  if (!steps?.length) return;
  const prev = Game.mode;
  const switchMode = o.cutscene && prev !== 'cutscene';
  if (switchMode) Game.setMode('cutscene');
  const p = runTop(steps, { ...o, source: source || 'inline' });
  active.add(p);
  try {
    await p;
  } finally {
    active.delete(p);
    if (switchMode && (Game.mode === 'cutscene' || Game.mode === 'dialogue')) Game.setMode(prev);
  }
}

async function waitIdle() {
  while (active.size) await Promise.allSettled([...active]);
}

export const script = {
  init() {
    active.clear();
    queueTail = Promise.resolve();
  },
  MAX_STEPS,
  ops,
  interpolate,
  resolve: resolveScript,
  run,
  /** Like run, but waits for any running script to finish first and serialises with other queued scripts. */
  runQueued(idOrSteps, o) {
    const p = queueTail.then(async () => {
      await waitIdle();
      return run(idOrSteps, o);
    });
    queueTail = p.catch(() => {});
    return p;
  },
  idle: waitIdle,
  isRunning: () => active.size > 0,
  hasOp: (name) => !!ops[name],
  registerOp(name, handler) {
    ops[name] = async (step, ctx) => handler(step, ctx);
  },
};

const reg = script.registerOp;

// ---- dialogue ----
reg('say', async (s, ctx) => {
  const lines = Array.isArray(s.text) ? s.text : [s.text];
  const npc = s.say;
  for (const l of lines) {
    await Game.ui?.dialogue?.say?.({
      speaker: npc, name: s.name, text: interpolate(String(l ?? '')), expr: s.expr, side: s.side, voice: npcDef(npc)?.voice,
    });
  }
});
reg('narrate', async (s) => {
  await Game.ui?.dialogue?.narrate?.(interpolate(String(s.narrate)));
});
reg('ask', async (s, ctx) => {
  const shown = [];
  (s.ask || []).forEach((o, idx) => {
    if (o.if === undefined || svc.conditions.evalCond(o.if, { npc: ctx.npc })) shown.push({ o, idx });
  });
  if (!shown.length) return undefined;
  const choice = await Game.ui?.dialogue?.ask?.({
    prompt: s.prompt ? interpolate(s.prompt) : undefined,
    speaker: s.speaker, expr: s.expr,
    options: shown.map(({ o }) => ({ text: interpolate(o.text), hint: o.hint, disabled: o.disabled })),
  });
  const pick = typeof choice === 'number' ? shown[choice] : undefined;
  if (!pick) return undefined;
  if (s.var) ctx.vars[s.var] = pick.idx;
  if (pick.o.then) return ctx.runSteps(pick.o.then);
  return undefined;
});

// ---- control flow ----
reg('if', async (s, ctx) => {
  const ok = svc.conditions.evalCond(s.if, { npc: ctx.npc });
  const branch = ok ? s.then : s.else;
  return branch ? ctx.runSteps(branch) : undefined;
});
reg('label', async () => undefined);
reg('goto', async (s) => ({ goto: s.goto }));
reg('end', async () => 'end');
reg('wait', async (s) => {
  if (!opts.skipFades) await sleepMs(Number(s.wait) || 0);
});
reg('parallel', async (s, ctx) => {
  await Promise.all((s.parallel || []).map((b) => ctx.runSteps(b)));
  return undefined;
});
reg('call', async (s, ctx) => {
  if (ctx.depth >= MAX_DEPTH) {
    warnOnce('call:depth', 'script call depth exceeded');
    return undefined;
  }
  const steps = resolveScript(s.call);
  if (!steps) {
    warnOnce(`call:${s.call}`, `call: unknown script "${s.call}"`);
    return undefined;
  }
  const id = String(s.call);
  const npc = id.endsWith('.intro') ? id.slice(0, -6) : ctx.npc;
  const sub = makeCtx({ vars: ctx.vars, npc, source: id, guard: ctx.guard, depth: ctx.depth + 1 }, steps);
  await execSteps(steps, sub, true);
  return undefined;
});

// ---- flags / items / money / social / quests ----
reg('setFlag', async (s) => setFlag(s.setFlag, s.value === undefined ? true : s.value));
reg('clearFlag', async (s) => clearFlag(s.clearFlag));
reg('incFlag', async (s) => { incFlag(s.incFlag, s.by ?? 1); });
reg('giveItem', async (s) => { svc.inventory.give(s.giveItem, s.qty ?? 1, { silent: !!s.silent }); });
reg('takeItem', async (s) => { svc.inventory.remove(s.takeItem, s.qty ?? 1); });
reg('money', async (s) => {
  const n = Number(s.money) || 0;
  svc.inventory.addMoney(n < 0 ? -Math.min(-n, Game.state.player.money) : n);
});
reg('energy', async (s) => { svc.inventory.addEnergy(Number(s.energy) || 0); });
reg('affection', async (s) => { svc.rel.addAff(s.affection, Number(s.amount) || 0); });
reg('meet', async (s) => { svc.rel.meet(s.meet); });
reg('startQuest', async (s) => { svc.quests?.start(s.startQuest); });
// Not awaited: quest scripts are queued behind the running script (awaiting here would deadlock). Use quests.idle() to await.
reg('advanceQuest', async (s) => { svc.quests?.advance(s.advanceQuest); });
reg('completeQuest', async (s) => { svc.quests?.complete(s.completeQuest); });
reg('lantern', async (s) => {
  const st = Game.state.story;
  const n = s.lantern === true ? 1 : Number(s.lantern) || 0;
  const before = st.lanterns;
  st.lanterns = clamp(before + n, 0, 6);
  if (st.lanterns !== before) {
    for (let c = before + 1; c <= st.lanterns; c++) setFlag(`lantern_${c}`, true);
    Game.bus.emit(EVT.STORY_LANTERN, { count: st.lanterns });
  }
});

// ---- world state ----
reg('setTime', async (s) => { svc.clock.set({ minutes: parseHHMM(s.setTime) }); });
reg('setWeather', async (s) => { svc.weather.setToday(s.setWeather); });
reg('mail', async (s) => { svc.mail?.send(s.mail); });

// ---- presentation ----
reg('fade', async (s) => {
  const out = s.fade === 'out';
  opts.faded = out;
  await Game.ui?.fade?.(out ? 1 : 0, opts.skipFades ? 0 : s.ms ?? 500, s.color || '#000');
});
reg('title', async (s) => { await Game.ui?.banner?.(interpolate(s.title), s.sub ? interpolate(s.sub) : undefined, s.ms); });
reg('music', async (s) => {
  if (s.music) Game.audio?.playMusic?.(s.music, { fadeMs: s.fadeMs ?? 1200 });
  else Game.audio?.stopMusic?.({ fadeMs: s.fadeMs ?? 1200 });
});
reg('sfx', async (s) => { sfx(s.sfx); });
reg('toast', async (s) => { toast(interpolate(s.toast), { icon: s.icon }); });
reg('letterbox', async (s) => { Game.ui?.letterbox?.(!!s.letterbox); });
reg('shop', async (s) => { await svc.shops.openShop(s.shop); });
reg('notes', async (s) => {
  await Game.ui?.notes?.read?.({ title: interpolate(s.notes.title || ''), lines: (s.notes.lines || []).map(interpolate) });
});
