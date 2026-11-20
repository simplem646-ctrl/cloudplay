// Event-script DSL + validator. OWNED BY THE LEAD. This file is THE contract between
//   - content writers (they author events with these helpers or plain objects),
//   - the interpreter (src/sim/interpreter.js must implement EVERY op in OPS), and
//   - scripts/validate-content.mjs (which calls validateEvent below).
// Full documentation with examples: docs/game/02_SIM_CONTENT_CONTRACTS.md
//
// A script is an array of ops. An op is a plain object { op: 'name', ...fields }.
// The helpers below just build those objects, so both styles are valid.

import {
  EXPRESSIONS, EMOTE_KINDS, POSES, LIGHTING_PRESETS, SUBJECTS, TRAITS, DIRS, SEASONS,
  WEEKDAYS, WEATHER_KINDS, CLUBS,
} from '../core/constants.js';

// ---------------------------------------------------------------- op table
// req = required fields, opt = optional fields. The interpreter must handle each op.
export const OPS = {
  // dialogue
  say: { req: ['who', 'text'], opt: ['face', 'name'] }, // who: character id | 'narrator' | 'unknown' ('???')
  narrate: { req: ['text'], opt: [] }, // box without portrait
  think: { req: ['text'], opt: [] }, // Theo's inner voice (italic style, Theo portrait 'thinking')
  choice: { req: ['options'], opt: ['store'] }, // options: [{ text, do:[ops], if?:cond }]
  // flow
  if: { req: ['cond', 'then'], opt: ['else'] },
  wait: { req: ['ms'], opt: [] },
  end: { req: [], opt: [] }, // stop this script now
  // staging (only meaningful on a map scene; interpreter calls the Stage API)
  warp: { req: ['map'], opt: ['at', 'dir', 'fade'] }, // move the player (+scene) to map:anchor ('entrance' default)
  place: { req: ['who', 'at'], opt: ['dir'] }, // instantly put an actor on an anchor ('theo' or npc id)
  hide: { req: ['who'], opt: [] },
  moveTo: { req: ['who', 'to'], opt: ['speed', 'wait'] }, // speed: 'walk'|'run'; wait defaults true
  face: { req: ['who'], opt: ['dir', 'toward'] },
  pose: { req: ['who', 'pose'], opt: [] },
  emote: { req: ['who', 'emote'], opt: [] },
  cam: { req: [], opt: ['focus', 'ms', 'reset', 'shake'] },
  fade: { req: ['dir'], opt: ['ms', 'color'] }, // dir: 'out' | 'in'
  flash: { req: [], opt: ['ms', 'color'] },
  lighting: { req: ['preset'], opt: [] },
  sfx: { req: ['id'], opt: [] },
  music: { req: ['id'], opt: ['fadeMs'] }, // id null = silence
  musicResume: { req: [], opt: [] },
  banner: { req: ['text'], opt: ['sub', 'ms'] }, // full-screen title card
  // state changes
  setFlag: { req: ['name'], opt: ['value'] },
  addCounter: { req: ['name', 'delta'], opt: [] },
  friend: { req: ['npc', 'delta'], opt: [] }, // friendship points (10 = 1 heart)
  money: { req: ['delta'], opt: [] },
  energy: { req: ['delta'], opt: [] },
  stat: { req: ['stat', 'delta'], opt: [] }, // a subject or a trait
  giveItem: { req: ['item'], opt: ['qty'] },
  takeItem: { req: ['item'], opt: ['qty'] },
  time: { req: ['minutes'], opt: [] }, // advance the clock
  quest: { req: ['id', 'state'], opt: ['note'] }, // state: start|update|complete|fail
  spirit: { req: ['delta'], opt: [] }, // Community Spirit
  romance: { req: ['npc', 'state'], opt: [] }, // state: 'dating' | 'single'
  call: { req: ['scene', 'id'], opt: ['opts', 'store'] }, // scene: minigame|exam|shop|activity; result stored in var `store`
  endGame: { req: [], opt: [] }, // begin the ending sequence
};

// ---------------------------------------------------------------- builders
export const say = (who, face, text, extra = {}) => ({ op: 'say', who, face, text, ...extra });
export const narrate = (text) => ({ op: 'narrate', text });
export const think = (text) => ({ op: 'think', text });
export const opt = (text, doOps, cond) => (cond ? { text, do: doOps, if: cond } : { text, do: doOps });
export const choice = (options, store) => (store ? { op: 'choice', options, store } : { op: 'choice', options });
export const iff = (cond, then, otherwise) => (otherwise ? { op: 'if', cond, then, else: otherwise } : { op: 'if', cond, then });
export const wait = (ms) => ({ op: 'wait', ms });
export const end = () => ({ op: 'end' });
export const warp = (map, at = 'entrance', extra = {}) => ({ op: 'warp', map, at, ...extra });
export const place = (who, at, dir) => (dir ? { op: 'place', who, at, dir } : { op: 'place', who, at });
export const hide = (who) => ({ op: 'hide', who });
export const moveTo = (who, to, extra = {}) => ({ op: 'moveTo', who, to, ...extra });
export const face = (who, dirOrToward) =>
  DIRS.includes(dirOrToward) ? { op: 'face', who, dir: dirOrToward } : { op: 'face', who, toward: dirOrToward };
export const pose = (who, p) => ({ op: 'pose', who, pose: p });
export const emote = (who, e) => ({ op: 'emote', who, emote: e });
export const cam = (opts = {}) => ({ op: 'cam', ...opts }); // { focus:'nina'|'anchor'|{x,y}, ms, reset:true, shake:{amp,ms} }
export const fade = (dir, ms = 500, color = '#000000') => ({ op: 'fade', dir, ms, color });
export const flash = (ms = 300, color = '#ffffff') => ({ op: 'flash', ms, color });
export const lighting = (preset) => ({ op: 'lighting', preset });
export const sfx = (id) => ({ op: 'sfx', id });
export const music = (id, fadeMs = 800) => ({ op: 'music', id, fadeMs });
export const musicResume = () => ({ op: 'musicResume' });
export const banner = (text, sub, ms = 2500) => ({ op: 'banner', text, sub, ms });
export const setFlag = (name, value = true) => ({ op: 'setFlag', name, value });
export const addCounter = (name, delta = 1) => ({ op: 'addCounter', name, delta });
export const friend = (npc, delta) => ({ op: 'friend', npc, delta });
export const money = (delta) => ({ op: 'money', delta });
export const energy = (delta) => ({ op: 'energy', delta });
export const stat = (name, delta) => ({ op: 'stat', stat: name, delta });
export const giveItem = (item, qty = 1) => ({ op: 'giveItem', item, qty });
export const takeItem = (item, qty = 1) => ({ op: 'takeItem', item, qty });
export const advanceTime = (minutes) => ({ op: 'time', minutes });
export const quest = (id, state, note) => (note ? { op: 'quest', id, state, note } : { op: 'quest', id, state });
export const spirit = (delta) => ({ op: 'spirit', delta });
export const romance = (npc, state) => ({ op: 'romance', npc, state });
export const callScene = (scene, id, opts, store) => ({ op: 'call', scene, id, ...(opts ? { opts } : {}), ...(store ? { store } : {}) });
export const endGame = () => ({ op: 'endGame' });

// condition combinators (leaf conditions are plain objects, see COND_LEAVES)
export const all = (...c) => ({ all: c });
export const any = (...c) => ({ any: c });
export const not = (c) => ({ not: c });

// ---------------------------------------------------------------- conditions
export const CMP_OPS = ['>=', '>', '<=', '<', '==', '!='];
export const TRIGGER_TYPES = ['enterMap', 'talk', 'interact', 'wake', 'sleep', 'clock', 'auto'];
export const EVENT_KINDS = ['story', 'romance', 'friend', 'festival', 'random', 'class', 'ambient'];
export const REPEAT_MODES = ['once', 'daily', 'always'];

const isStr = (v) => typeof v === 'string' && v.length > 0;
const isNum = (v) => typeof v === 'number' && Number.isFinite(v);
const isTime = (v) => typeof v === 'string' && /^\d{1,2}:\d{2}$/.test(v);
const numOrRange = (v) => isNum(v) || (Array.isArray(v) && v.length === 2 && v.every(isNum));
const strOrList = (v, allowed) =>
  (isStr(v) && (!allowed || allowed.includes(v))) ||
  (Array.isArray(v) && v.length > 0 && v.every((x) => isStr(x) && (!allowed || allowed.includes(x))));
const cmp3 = (v) => Array.isArray(v) && v.length === 3 && isStr(v[0]) && CMP_OPS.includes(v[1]) && isNum(v[2]);
const cmp2 = (v) => Array.isArray(v) && v.length === 2 && CMP_OPS.includes(v[0]) && isNum(v[1]);

// Leaf validators. ctx may carry id sets (all optional): npcIds, mapIds, itemIds, eventIds, questIds.
export const COND_LEAVES = {
  flag: (v) => isStr(v),
  noFlag: (v) => isStr(v),
  counter: cmp3, // ['name', '>=', 3]
  hearts: (v, c) => cmp3(v) && (!c.npcIds || c.npcIds.has(v[0])), // ['nina', '>=', 4]
  friendship: (v, c) => cmp3(v) && (!c.npcIds || c.npcIds.has(v[0])), // points
  year: numOrRange, // 2  or  [1, 2]
  season: (v) => strOrList(v, SEASONS),
  day: numOrRange, // 1..28 or [lo, hi]
  date: (v) => v && SEASONS.includes(v.season) && isNum(v.day) && (v.year === undefined || isNum(v.year)),
  weekday: (v) => strOrList(v, WEEKDAYS),
  schoolDay: (v) => typeof v === 'boolean',
  time: (v) => Array.isArray(v) && v.length === 2 && v.every(isTime), // ['15:00', '18:30']
  map: (v, c) => strOrList(v) && (!c.mapIds || [].concat(v).every((m) => c.mapIds.has(m))),
  weather: (v) => strOrList(v, WEATHER_KINDS),
  item: (v, c) => cmp3(v) && (!c.itemIds || c.itemIds.has(v[0])),
  money: cmp2,
  energy: cmp2,
  stat: (v) => cmp3(v) && (SUBJECTS.includes(v[0]) || TRAITS.includes(v[0]) || v[0] === 'conduct'),
  club: (v) => v === null || (isStr(v) && CLUBS.includes(v)),
  job: (v) => v === null || isStr(v),
  partner: (v, c) => v === null || (isStr(v) && (!c.npcIds || c.npcIds.has(v))),
  dating: (v, c) => isStr(v) && (!c.npcIds || c.npcIds.has(v)),
  confessed: (v, c) => isStr(v) && (!c.npcIds || c.npcIds.has(v)),
  seen: (v, c) => isStr(v) && (!c.eventIds || c.eventIds.has(v)),
  notSeen: (v, c) => isStr(v) && (!c.eventIds || c.eventIds.has(v)),
  quest: (v, c) => Array.isArray(v) && v.length === 2 && isStr(v[0]) && ['none', 'active', 'complete', 'failed'].includes(v[1]) && (!c.questIds || c.questIds.has(v[0])),
  spirit: cmp2,
  rank: cmp2, // class rank of the most recent exam (1 = top)
  average: cmp2, // running exam average 0..100
  standing: (v) => strOrList(v, ['honors', 'good', 'fair', 'probation']),
  chance: (v) => isNum(v) && v >= 0 && v <= 1,
  festival: (v) => v === true || isStr(v), // today is a festival day (or that specific festival)
  breakDay: (v) => typeof v === 'boolean',
};

export function validateCondition(cond, ctx = {}, path = 'cond') {
  const errs = [];
  if (cond === undefined || cond === null) return errs;
  if (typeof cond !== 'object' || Array.isArray(cond)) return [`${path}: condition must be an object`];
  const keys = Object.keys(cond);
  if (keys.length === 0) return [`${path}: empty condition`];
  for (const k of keys) {
    const v = cond[k];
    if (k === 'all' || k === 'any') {
      if (!Array.isArray(v) || v.length === 0) errs.push(`${path}.${k}: needs a non-empty array`);
      else v.forEach((c, i) => errs.push(...validateCondition(c, ctx, `${path}.${k}[${i}]`)));
    } else if (k === 'not') {
      errs.push(...validateCondition(v, ctx, `${path}.not`));
    } else if (k in COND_LEAVES) {
      let ok = false;
      try { ok = COND_LEAVES[k](v, ctx); } catch { ok = false; }
      if (!ok) errs.push(`${path}.${k}: invalid value ${JSON.stringify(v)}`);
    } else {
      errs.push(`${path}: unknown condition key "${k}"`);
    }
  }
  return errs;
}

// ---------------------------------------------------------------- scripts
const ANCHOR_RE = /^[a-z0-9_]+(:[a-z0-9_]+)?$/;
const FLAG_RE = /^[a-z][a-z0-9_]*$/;

function checkAnchorRef(ref, ctx, path, errs) {
  if (ref && typeof ref === 'object' && isNum(ref.x) && isNum(ref.y)) return;
  if (!isStr(ref) || !ANCHOR_RE.test(ref)) { errs.push(`${path}: bad anchor/position ${JSON.stringify(ref)} (use 'anchor', 'map:anchor' or {x,y})`); return; }
  if (ctx.anchorNames && ref.includes(':') && !ctx.anchorNames.has(ref)) errs.push(`${path}: unknown anchor ${ref}`);
}
function checkWho(who, ctx, path, errs, { allowNarrator = false } = {}) {
  const special = allowNarrator ? ['narrator', 'unknown'] : [];
  if (!isStr(who) || (!special.includes(who) && who !== 'theo' && ctx.npcIds && !ctx.npcIds.has(who))) {
    errs.push(`${path}: unknown character "${who}"`);
  }
}

export function validateScript(ops, ctx = {}, path = 'script') {
  const errs = [];
  if (!Array.isArray(ops)) return [`${path}: script must be an array of ops`];
  ops.forEach((o, i) => {
    const p = `${path}[${i}]`;
    if (!o || typeof o !== 'object' || !isStr(o.op)) { errs.push(`${p}: not an op object`); return; }
    const def = OPS[o.op];
    if (!def) { errs.push(`${p}: unknown op "${o.op}"`); return; }
    for (const f of def.req) if (o[f] === undefined) errs.push(`${p} (${o.op}): missing "${f}"`);
    for (const f of Object.keys(o)) if (f !== 'op' && !def.req.includes(f) && !def.opt.includes(f)) errs.push(`${p} (${o.op}): unexpected field "${f}"`);

    switch (o.op) {
      case 'say':
        checkWho(o.who, ctx, p, errs, { allowNarrator: true });
        if (o.face !== undefined && !EXPRESSIONS.includes(o.face)) errs.push(`${p}: unknown face "${o.face}"`);
        if (!isStr(o.text)) errs.push(`${p}: text must be a non-empty string`);
        else if (o.text.length > 220) errs.push(`${p}: text too long (${o.text.length} > 220); split it into several say ops`);
        break;
      case 'narrate':
      case 'think':
        if (!isStr(o.text)) errs.push(`${p}: text must be a non-empty string`);
        else if (o.text.length > 220) errs.push(`${p}: text too long (${o.text.length} > 220)`);
        break;
      case 'choice':
        if (!Array.isArray(o.options) || o.options.length < 2 || o.options.length > 4) errs.push(`${p}: choice needs 2-4 options`);
        else o.options.forEach((op, j) => {
          if (!isStr(op.text) || op.text.length > 44) errs.push(`${p}.options[${j}]: text required, max 44 chars`);
          errs.push(...validateScript(op.do || [], ctx, `${p}.options[${j}].do`));
          if (op.if) errs.push(...validateCondition(op.if, ctx, `${p}.options[${j}].if`));
        });
        break;
      case 'if':
        errs.push(...validateCondition(o.cond, ctx, `${p}.cond`));
        errs.push(...validateScript(o.then, ctx, `${p}.then`));
        if (o.else) errs.push(...validateScript(o.else, ctx, `${p}.else`));
        break;
      case 'wait': if (!isNum(o.ms) || o.ms < 0 || o.ms > 10000) errs.push(`${p}: ms 0..10000`); break;
      case 'warp':
        if (ctx.mapIds && !ctx.mapIds.has(o.map)) errs.push(`${p}: unknown map "${o.map}"`);
        if (o.at !== undefined) checkAnchorRef(o.at, ctx, `${p}.at`, errs);
        break;
      case 'place': checkWho(o.who, ctx, p, errs); checkAnchorRef(o.at, ctx, `${p}.at`, errs); break;
      case 'hide': checkWho(o.who, ctx, p, errs); break;
      case 'moveTo':
        checkWho(o.who, ctx, p, errs); checkAnchorRef(o.to, ctx, `${p}.to`, errs);
        if (o.speed !== undefined && !['walk', 'run'].includes(o.speed)) errs.push(`${p}: speed must be 'walk' or 'run'`);
        break;
      case 'face':
        checkWho(o.who, ctx, p, errs);
        if (o.dir === undefined && o.toward === undefined) errs.push(`${p}: face needs dir or toward`);
        if (o.dir !== undefined && !DIRS.includes(o.dir)) errs.push(`${p}: bad dir ${o.dir}`);
        if (o.toward !== undefined) checkWho(o.toward, ctx, `${p}.toward`, errs);
        break;
      case 'pose': checkWho(o.who, ctx, p, errs); if (!POSES.includes(o.pose)) errs.push(`${p}: unknown pose "${o.pose}" (${POSES.join(', ')})`); break;
      case 'emote': checkWho(o.who, ctx, p, errs); if (!EMOTE_KINDS.includes(o.emote)) errs.push(`${p}: unknown emote "${o.emote}" (${EMOTE_KINDS.join(', ')})`); break;
      case 'cam':
        if (o.focus !== undefined && !(typeof o.focus === 'object') && !isStr(o.focus)) errs.push(`${p}: bad focus`);
        break;
      case 'fade': if (!['out', 'in'].includes(o.dir)) errs.push(`${p}: dir must be 'out' or 'in'`); break;
      case 'lighting': if (!LIGHTING_PRESETS.includes(o.preset)) errs.push(`${p}: unknown lighting "${o.preset}"`); break;
      case 'sfx': if (!isStr(o.id)) errs.push(`${p}: sfx id`); break;
      case 'music': if (o.id !== null && !isStr(o.id)) errs.push(`${p}: music id string or null`); break;
      case 'banner': if (!isStr(o.text)) errs.push(`${p}: banner text`); break;
      case 'setFlag': if (!isStr(o.name) || !FLAG_RE.test(o.name)) errs.push(`${p}: flag names are snake_case: "${o.name}"`); break;
      case 'addCounter': if (!isStr(o.name) || !FLAG_RE.test(o.name) || !isNum(o.delta)) errs.push(`${p}: counter name/delta`); break;
      case 'friend':
        if (ctx.npcIds && !ctx.npcIds.has(o.npc)) errs.push(`${p}: unknown npc "${o.npc}"`);
        if (!isNum(o.delta) || o.delta < -30 || o.delta > 30) errs.push(`${p}: friend delta -30..30`);
        break;
      case 'money': if (!isNum(o.delta)) errs.push(`${p}: money delta`); break;
      case 'energy': if (!isNum(o.delta)) errs.push(`${p}: energy delta`); break;
      case 'stat': if (!(SUBJECTS.includes(o.stat) || TRAITS.includes(o.stat) || o.stat === 'conduct') || !isNum(o.delta)) errs.push(`${p}: stat must be a subject/trait/conduct`); break;
      case 'giveItem': case 'takeItem':
        if (!isStr(o.item) || (ctx.itemIds && !ctx.itemIds.has(o.item))) errs.push(`${p}: unknown item "${o.item}"`);
        break;
      case 'time': if (!isNum(o.minutes) || o.minutes < 0 || o.minutes > 600) errs.push(`${p}: minutes 0..600`); break;
      case 'quest':
        if (!isStr(o.id) || !['start', 'update', 'complete', 'fail'].includes(o.state)) errs.push(`${p}: quest id/state`);
        else if (ctx.questIds && !ctx.questIds.has(o.id)) errs.push(`${p}: unknown quest "${o.id}"`);
        break;
      case 'spirit': if (!isNum(o.delta) || o.delta < -20 || o.delta > 20) errs.push(`${p}: spirit delta -20..20`); break;
      case 'romance':
        if (!['dating', 'single'].includes(o.state)) errs.push(`${p}: romance state`);
        if (ctx.npcIds && !ctx.npcIds.has(o.npc)) errs.push(`${p}: unknown npc "${o.npc}"`);
        break;
      case 'call': if (!['minigame', 'exam', 'shop', 'activity'].includes(o.scene) || !isStr(o.id)) errs.push(`${p}: call scene/id`); break;
      default: break;
    }
  });
  return errs;
}

// ---------------------------------------------------------------- events
export function validateEvent(ev, ctx = {}) {
  const id = ev && ev.id;
  const p = `event ${id}`;
  const errs = [];
  if (!isStr(id) || !/^[a-z][a-z0-9_]*$/.test(id)) return [`event has a bad id: ${JSON.stringify(id)} (snake_case)`];
  if (!isStr(ev.title)) errs.push(`${p}: title required`);
  if (!EVENT_KINDS.includes(ev.kind)) errs.push(`${p}: kind must be one of ${EVENT_KINDS.join('|')}`);
  const t = ev.trigger;
  if (!t || !TRIGGER_TYPES.includes(t.type)) errs.push(`${p}: trigger.type must be one of ${TRIGGER_TYPES.join('|')}`);
  else {
    if (t.type === 'enterMap' && (!isStr(t.map) || (ctx.mapIds && !ctx.mapIds.has(t.map)))) errs.push(`${p}: trigger.map unknown "${t.map}"`);
    if (t.type === 'talk' && (!isStr(t.npc) || (ctx.npcIds && !ctx.npcIds.has(t.npc)))) errs.push(`${p}: trigger.npc unknown "${t.npc}"`);
    if (t.type === 'interact' && !isStr(t.id)) errs.push(`${p}: trigger.id required`);
    if (t.type === 'clock' && !isTime(t.at)) errs.push(`${p}: trigger.at must be 'HH:MM'`);
    if (t.time !== undefined && !(Array.isArray(t.time) && t.time.length === 2 && t.time.every(isTime))) errs.push(`${p}: trigger.time must be ['HH:MM','HH:MM']`);
  }
  if (ev.when) errs.push(...validateCondition(ev.when, ctx, `${p}.when`));
  if (ev.repeat !== undefined && !REPEAT_MODES.includes(ev.repeat)) errs.push(`${p}: repeat must be ${REPEAT_MODES.join('|')}`);
  if (ev.priority !== undefined && !isNum(ev.priority)) errs.push(`${p}: priority must be a number`);
  errs.push(...validateScript(ev.script, ctx, `${p}.script`));
  return errs;
}

// ---------------------------------------------------------------- dialogue pools & schedules
const sayLine = (l) => isStr(l) || (Array.isArray(l) && l.length === 2 && EXPRESSIONS.includes(l[0]) && isStr(l[1]));
export function validateDialoguePool(pool, ctx = {}) {
  const errs = [];
  const p = `dialogue ${pool && pool.npc}`;
  if (!pool || !isStr(pool.npc) || (ctx.npcIds && !ctx.npcIds.has(pool.npc))) return [`${p}: unknown npc`];
  for (const key of ['talk', 'repeat']) {
    for (const [i, e] of (pool[key] || []).entries()) {
      if (e.when) errs.push(...validateCondition(e.when, ctx, `${p}.${key}[${i}].when`));
      if (!Array.isArray(e.say) || e.say.length === 0 || !e.say.every(sayLine)) errs.push(`${p}.${key}[${i}]: say must be a non-empty array of 'text' | ['face','text']`);
      else for (const l of e.say) {
        const txt = Array.isArray(l) ? l[1] : l;
        if (txt.length > 220) errs.push(`${p}.${key}[${i}]: line too long (${txt.length})`);
      }
    }
  }
  if (pool.gift) {
    for (const k of ['loves', 'likes', 'dislikes', 'hates']) {
      for (const it of pool.gift[k] || []) if (ctx.itemIds && !ctx.itemIds.has(it)) errs.push(`${p}.gift.${k}: unknown item ${it}`);
    }
    for (const [k, arr] of Object.entries(pool.gift.lines || {})) {
      if (!['loves', 'likes', 'neutral', 'dislikes', 'hates', 'birthday'].includes(k)) errs.push(`${p}.gift.lines: unknown key ${k}`);
      if (!Array.isArray(arr) || !arr.every(sayLine)) errs.push(`${p}.gift.lines.${k}: array of lines`);
    }
  }
  return errs;
}

export function validateSchedule(sch, ctx = {}) {
  const errs = [];
  const p = `schedule ${sch && sch.npc}`;
  if (!sch || !isStr(sch.npc) || (ctx.npcIds && !ctx.npcIds.has(sch.npc))) return [`${p}: unknown npc`];
  if (!Array.isArray(sch.routines) || sch.routines.length === 0) return [`${p}: routines required`];
  for (const [i, r] of sch.routines.entries()) {
    const rp = `${p}.routines[${i}]`;
    if (!isStr(r.id)) errs.push(`${rp}: id required`);
    if (r.when) errs.push(...validateCondition(r.when, ctx, `${rp}.when`));
    if (!Array.isArray(r.points) || r.points.length === 0) { errs.push(`${rp}: points required`); continue; }
    let prev = -1;
    r.points.forEach((pt, j) => {
      const pp = `${rp}.points[${j}]`;
      if (!Array.isArray(pt) || !isTime(pt[0])) { errs.push(`${pp}: [ 'HH:MM', 'map:anchor' | null, {opts}? ]`); return; }
      const [h, m] = pt[0].split(':').map(Number);
      const mins = h * 60 + m;
      if (mins < prev) errs.push(`${pp}: times must be ascending`);
      prev = mins;
      if (pt[1] !== null && !(isStr(pt[1]) && /^[a-z0-9_]+:[a-z0-9_]+$/.test(pt[1]))) errs.push(`${pp}: location must be 'map:anchor' or null`);
      else if (pt[1] && ctx.anchorNames && !ctx.anchorNames.has(pt[1])) errs.push(`${pp}: unknown anchor ${pt[1]}`);
    });
  }
  return errs;
}
