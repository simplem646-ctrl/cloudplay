#!/usr/bin/env node
// Static reachability audit of the authored content: finds conditions that can never become true and triggers that can
// never fire, so no event, dialogue line or ending slide is dead by accident.
//   node scripts/audit-reachability.mjs          -> report; exit 1 when a definite problem is found
//
// What it checks (all static, no game run):
//   - `flag` conditions whose flag is never set (by a setFlag op, or by any string in the engine code)
//   - `counter` conditions without any addCounter op, `quest` conditions on quests nothing ever starts
//   - `item` conditions on items nothing gives, sells or drops, `hearts` thresholds above the maximum
//   - event triggers on maps that are not built, on interactables that do not exist, on unknown NPCs
// "Set by engine code" is approximated by "the name appears as a string literal outside src/content" (template literals
// count when their literal prefix matches), so a miss here means the name is spelt nowhere that could set it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, [path.join(root, 'scripts/gen-registry.mjs')], { stdio: 'ignore' });
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);
const reg = await imp('src/_generated/registry.js');
const { CAST, EXTRAS } = await imp('src/data/cast.js');
const { MAX_HEARTS } = await imp('src/core/constants.js').catch(() => ({}));

// ---- engine-code strings (everything except src/content and the generated registry) -----------------------------------
const codeStrings = new Set();
const codePrefixes = new Set();
const walkDir = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) { if (!['content', '_generated', 'dev'].includes(f.name)) walkDir(p); continue; }
    if (!f.name.endsWith('.js')) continue;
    const src = fs.readFileSync(p, 'utf8');
    for (const m of src.matchAll(/(['"`])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
      const body = m[2];
      if (m[1] === '`' && body.includes('${')) codePrefixes.add(body.split('${')[0]);
      else codeStrings.add(body);
    }
  }
};
walkDir(path.join(root, 'src'));
const inCode = (name) => codeStrings.has(name) || [...codePrefixes].some((p) => p.length >= 3 && name.startsWith(p));

// ---- content --------------------------------------------------------------------------------------------------------------
const events = [];
for (const [file, mod] of Object.entries(reg.EVENT_MODULES)) for (const e of mod.default || mod.events || []) events.push({ ...e, __file: file });
const pools = [];
for (const [file, mod] of Object.entries(reg.DIALOGUE_MODULES)) for (const p of [].concat(mod.default || [])) pools.push({ ...p, __file: file });
const slides = [];
for (const [file, mod] of Object.entries(reg.ENDING_MODULES)) for (const s of (mod.default && mod.default.slides) || []) slides.push({ ...s, __file: file });

const setFlags = new Set(), counters = new Set(), questOps = new Set(), itemsGiven = new Set(), romanceOps = new Set();
const reads = []; // { kind, a, b, where }
const walkOps = (node) => {
  if (Array.isArray(node)) { node.forEach(walkOps); return; }
  if (!node || typeof node !== 'object') return;
  if (node.op === 'setFlag' && node.value !== false) setFlags.add(node.name);
  if (node.op === 'addCounter') counters.add(node.name);
  if (node.op === 'call' && node.store) { counters.add(node.store); counters.add(`${node.store}_rank`); } // the interpreter stores score and rank
  if (node.op === 'quest') questOps.add(node.id);
  if (node.op === 'giveItem') itemsGiven.add(node.item);
  if (node.op === 'romance') romanceOps.add(`${node.npc}:${node.state}`);
  for (const [k, v] of Object.entries(node)) {
    if (k === 'cond' || k === 'if') readCond(v, `${k}`);
    else walkOps(v);
  }
};
let curWhere = '';
const readCond = (c, where) => {
  if (!c || typeof c !== 'object') return;
  for (const [k, v] of Object.entries(c)) {
    if (k === 'all' || k === 'any') v.forEach((x) => readCond(x, where));
    else if (k === 'not') readCond(v, where);
    else reads.push({ kind: k, v, where: curWhere });
  }
};
for (const e of events) {
  curWhere = `event ${e.id}`;
  readCond(e.when, 'when');
  walkOps(e.script);
}
for (const p of pools) for (const key of Object.keys(p)) {
  if (!Array.isArray(p[key])) continue;
  for (const ent of p[key]) { curWhere = `dialogue ${p.npc}`; if (ent && ent.when) readCond(ent.when, 'when'); }
}
for (const s of slides) { curWhere = `ending slide ${s.id}`; if (s.when) readCond(s.when, 'when'); }

// ---- checks ---------------------------------------------------------------------------------------------------------------
const problems = [];
const notes = [];
const flagOk = (n) => setFlags.has(n) || inCode(n);
for (const r of reads) {
  if (r.kind === 'flag' && !flagOk(r.v)) problems.push(`${r.where}: needs flag "${r.v}", which nothing sets`);
  else if (r.kind === 'counter' && !(counters.has(r.v[0]) || inCode(r.v[0]))) problems.push(`${r.where}: counter "${r.v[0]}" is never incremented`);
  else if (r.kind === 'quest' && r.v[1] !== 'none' && !(questOps.has(r.v[0]) || inCode(r.v[0]))) problems.push(`${r.where}: quest "${r.v[0]}" is never started`);
  else if (r.kind === 'item' && ['>=', '>', '=='].includes(r.v[1]) && r.v[2] >= (r.v[1] === '>' ? 0 : 1) && !(itemsGiven.has(r.v[0]) || inCode(r.v[0]))) problems.push(`${r.where}: item "${r.v[0]}" is never given or sold`);
  else if (r.kind === 'hearts' && MAX_HEARTS && ['>=', '>', '=='].includes(r.v[1]) && r.v[2] > MAX_HEARTS) problems.push(`${r.where}: hearts ${r.v[1]} ${r.v[2]} is above the maximum (${MAX_HEARTS})`);
}

const mapDefs = {};
for (const [, mod] of Object.entries(reg.MAP_MODULES)) {
  try { const d = typeof mod.default === 'function' ? mod.default() : mod.default; if (d && d.id) mapDefs[d.id] = d; } catch { /* validator reports it */ }
}
const interactIds = new Set();
for (const d of Object.values(mapDefs)) for (const it of d.interactables || []) interactIds.add(it.id);
const npcIds = new Set([...CAST, ...EXTRAS].map((c) => c.id));
for (const e of events) {
  const t = e.trigger || {};
  if (t.type === 'enterMap' && t.map && !mapDefs[t.map]) problems.push(`event ${e.id}: enterMap trigger on map "${t.map}", which is not built`);
  if (t.type === 'interact' && t.id && !interactIds.has(t.id)) problems.push(`event ${e.id}: interact trigger on "${t.id}", which no built map has`);
  if (t.type === 'talk' && t.npc && !npcIds.has(t.npc)) problems.push(`event ${e.id}: talk trigger on unknown npc "${t.npc}"`);
}

// events whose own `when` needs another event's `seen` that nothing can ever mark as seen (that event is dead itself)
const seenIds = new Set(events.map((e) => e.id));
for (const r of reads) if (r.kind === 'seen' && !seenIds.has(r.v)) problems.push(`${r.where}: needs seen "${r.v}", an event that does not exist`);

// ---- fixpoint: an event can fire only if the events/flags its top-level `when` requires can come about -------------------
const setBy = new Map(); // flag -> events whose script sets it
const collectSets = (node, id) => {
  if (Array.isArray(node)) { node.forEach((n) => collectSets(n, id)); return; }
  if (!node || typeof node !== 'object') return;
  if (node.op === 'setFlag' && node.value !== false) { if (!setBy.has(node.name)) setBy.set(node.name, new Set()); setBy.get(node.name).add(id); }
  for (const v of Object.values(node)) collectSets(v, id);
};
for (const e of events) collectSets(e.script, e.id);
const topReqs = (c, out = { flags: new Set(), seen: new Set() }) => {
  if (!c || typeof c !== 'object') return out;
  for (const [k, v] of Object.entries(c)) {
    if (k === 'all') v.forEach((x) => topReqs(x, out));
    else if (k === 'flag') out.flags.add(v);
    else if (k === 'seen') out.seen.add(v);
  }
  return out;
};
const reach = new Set();
const reqOf = new Map(events.map((e) => [e.id, topReqs(e.when)]));
for (let changed = true; changed;) {
  changed = false;
  for (const e of events) {
    if (reach.has(e.id)) continue;
    const r = reqOf.get(e.id);
    const okSeen = [...r.seen].every((id) => reach.has(id));
    // a flag is obtainable when a reachable event sets it, or when engine code might (any engine string spelling it counts)
    const okFlags = [...r.flags].every((f) => inCode(f) || (setBy.get(f) && [...setBy.get(f)].some((id) => reach.has(id))));
    if (okSeen && okFlags) { reach.add(e.id); changed = true; }
  }
}
for (const e of events) if (!reach.has(e.id)) problems.push(`event ${e.id}: can never fire (its required events/flags depend on each other or on a dead event)`);

console.log(`audit: ${events.length} events, ${pools.length} dialogue pools, ${slides.length} ending slides; ${reads.length} condition reads, ${setFlags.size} flags set by content, ${codeStrings.size} engine strings`);
for (const n of notes) console.log(`NOTE  ${n}`);
for (const p of [...new Set(problems)].sort()) console.log(`DEAD  ${p}`);
console.log(`${new Set(problems).size} problem(s)`);
process.exit(problems.length ? 1 : 0);
