#!/usr/bin/env node
// Validates all game content against the contracts (script DSL, conditions, ids).
//   npm run validate            -> report; exit 1 on ERRORS (warnings do not fail)
//   npm run validate -- --strict   -> warnings also fail
// Reads: src/data/cast.js, src/data/calendar.js, src/data/ids.js, src/sim/script_dsl.js,
//        the generated registry (events/dialogue/schedules/maps/quests/endings) and, if present,
//        src/data/items.js.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
execFileSync(process.execPath, [path.join(root, 'scripts/gen-registry.mjs')], { stdio: 'ignore' });
const errors_early = [];
const imp = (rel) => import(pathToFileURL(path.join(root, rel)).href);
const exists = (rel) => fs.existsSync(path.join(root, rel));

const { CAST, EXTRAS, validateCast, ROMANCE_IDS } = await imp('src/data/cast.js');
const { FESTIVALS } = await imp('src/data/calendar.js');
const { MAP_IDS } = await imp('src/data/ids.js');
const dsl = await imp('src/sim/script_dsl.js');
const reg = await imp('src/_generated/registry.js');

// quests: every file in src/content/quests/ default-exports { id: {title, summary, ...} }
const quests = {};
for (const [file, mod] of Object.entries(reg.QUEST_MODULES)) {
  for (const [id, q] of Object.entries(mod.default || {})) {
    if (quests[id]) errors_early.push(`duplicate quest id ${id} (file ${file})`);
    if (!q || typeof q.title !== 'string' || typeof q.summary !== 'string') errors_early.push(`quest ${id} (file ${file}): title and summary strings required`);
    quests[id] = q;
  }
}
const questIds = Object.keys(quests).length ? new Set(Object.keys(quests)) : null;

const errors = [];
const warnings = [];
const err = (m) => errors.push(m);
const warn = (m) => warnings.push(m);
for (const m of errors_early) err(m);

// ---- id sets ----
const npcIds = new Set([...CAST.map((c) => c.id), ...EXTRAS.map((e) => e.id)]);
const mapIds = new Set(MAP_IDS);
let itemIds = null;
if (exists('src/data/items.js')) {
  try {
    const m = await imp('src/data/items.js');
    const list = m.ITEMS || m.default;
    itemIds = new Set(Array.isArray(list) ? list.map((i) => i.id) : Object.keys(list));
  } catch (e) { warn(`items.js failed to load: ${e.message}`); }
}

// anchors from maps that exist
let anchorNames = null;
const mapDefs = {};
for (const [file, mod] of Object.entries(reg.MAP_MODULES)) {
  try {
    const def = typeof mod.default === 'function' ? mod.default() : mod.default;
    if (def && def.id) mapDefs[def.id] = def;
  } catch (e) { warn(`map ${file} failed to build in Node: ${e.message}`); }
}
if (Object.keys(mapDefs).length === MAP_IDS.length) {
  anchorNames = new Set();
  for (const [id, def] of Object.entries(mapDefs)) for (const a of Object.keys(def.anchors || {})) anchorNames.add(`${id}:${a}`);
}

// ---- events ----
const events = [];
for (const [file, mod] of Object.entries(reg.EVENT_MODULES)) {
  const list = mod.default || mod.events || [];
  if (!Array.isArray(list)) { err(`events/${file}.js: default export must be an array`); continue; }
  for (const e of list) events.push({ ...e, __file: file });
}
const eventIds = new Set(events.map((e) => e.id));
const seenIds = new Set();
const ctx = { npcIds, mapIds, itemIds, questIds, anchorNames, eventIds };
for (const e of events) {
  if (seenIds.has(e.id)) err(`duplicate event id ${e.id} (file ${e.__file})`);
  seenIds.add(e.id);
  for (const m of dsl.validateEvent(e, ctx)) err(`[${e.__file}] ${m}`);
}
for (const f of FESTIVALS) if (!eventIds.has(f.eventId)) warn(`festival "${f.id}" has no event "${f.eventId}" yet`);

// ---- dialogue pools ----
const pools = {};
for (const [file, mod] of Object.entries(reg.DIALOGUE_MODULES)) {
  const list = [].concat(mod.default || []);
  for (const p of list) {
    pools[p.npc] = p;
    for (const m of dsl.validateDialoguePool(p, ctx)) err(`[dialogue/${file}] ${m}`);
  }
}
for (const id of CAST.filter((c) => c.kind !== 'player' && c.kind !== 'animal').map((c) => c.id)) {
  if (!pools[id]) warn(`no dialogue pool for ${id}`);
}

// ---- schedules ----
const scheds = {};
for (const [file, mod] of Object.entries(reg.SCHEDULE_MODULES)) {
  for (const s of [].concat(mod.default || [])) {
    scheds[s.npc] = s;
    for (const m of dsl.validateSchedule(s, ctx)) err(`[schedules/${file}] ${m}`);
  }
}

// ---- endings ----
const SLIDE_GROUPS = ['main', 'romance', 'academic', 'club', 'friends', 'final'];
let slideCount = 0;
for (const [file, mod] of Object.entries(reg.ENDING_MODULES)) {
  const slides = (mod.default && mod.default.slides) || [];
  if (!Array.isArray(slides)) { err(`endings/${file}.js: default export must be { slides: [...] }`); continue; }
  for (const s of slides) {
    slideCount++;
    const p = `[endings/${file}] slide ${s && s.id}`;
    if (!s || typeof s.id !== 'string') { err(`[endings/${file}] slide without id`); continue; }
    if (!SLIDE_GROUPS.includes(s.group)) err(`${p}: group must be one of ${SLIDE_GROUPS.join('|')}`);
    if (!Array.isArray(s.lines) || s.lines.length < 1 || s.lines.length > 3) err(`${p}: lines must be 1-3 strings`);
    else for (const l of s.lines) if (typeof l !== 'string' || l.length > 90) err(`${p}: each line must be a string <= 90 chars`);
    if (s.when) for (const m of dsl.validateCondition(s.when, ctx, `${p}.when`)) err(m);
  }
}

// ---- cast / appearance ----
for (const m of validateCast()) err(`cast: ${m}`);

// ---- report ----
const byKind = {};
for (const e of events) byKind[e.kind] = (byKind[e.kind] || 0) + 1;
const romanceCoverage = ROMANCE_IDS.map((id) => `${id}:${events.filter((e) => e.id.startsWith(id + '_')).length}`).join(' ');
console.log(`content: ${events.length} events (${Object.entries(byKind).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'}), ` +
  `${Object.keys(pools).length} dialogue pools, ${Object.keys(scheds).length} schedules, ${Object.keys(quests).length} quests, ${slideCount} ending slides, ${Object.keys(mapDefs).length}/${MAP_IDS.length} maps`);
console.log(`romance events by prefix: ${romanceCoverage}`);
for (const w of warnings) console.log(`WARN  ${w}`);
for (const e of errors) console.log(`ERROR ${e}`);
console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
process.exit(errors.length || (process.argv.includes('--strict') && warnings.length) ? 1 : 0);
