// Cross-check content against the BUILT maps: every anchor an event script or schedule names must exist, and nothing may stage on a map that
// is not built (tier-2 maps are absent: a script that warps there would break at runtime). The content validator only does this once all 26
// maps exist, which never happens in this build, so this test is the real safety net.
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultCatalog } from '../../src/sim/events.js';
import { getMap, listMaps } from '../../src/world/index.js';
import { SCHEDULE_MODULES } from '../../src/_generated/registry.js';
import { indexSchedules } from '../../src/sim/schedule.js';

const BUILT = new Set(listMaps());
const defs = {};
const mapDef = (id) => (defs[id] ??= getMap(id));
const hasAnchor = (map, name) => !!mapDef(map).anchors[name];
const CHARACTER = /^(theo|narrator|unknown)$/;

/** First `map` leaf found in a condition tree (string or list), or null. */
function mapFromWhen(w) {
  if (!w || typeof w !== 'object') return null;
  if (w.map) return [].concat(w.map);
  for (const k of ['all', 'any']) for (const c of w[k] || []) { const m = mapFromWhen(c); if (m) return m; }
  return null;
}
function initialMaps(ev) {
  const t = ev.trigger || {};
  if (t.map) return [t.map];
  return mapFromWhen(ev.when) || [null];
}

function* walk(ops, ctx) {
  for (const op of ops || []) {
    switch (op.op) {
      case 'warp': yield { kind: 'warp', op }; ctx.maps = [op.map]; yield { kind: 'anchor', map: op.map, name: op.at || 'entrance', what: 'warp.at' }; break;
      case 'place': yield* anchorRef(op.at, ctx, 'place.at'); break;
      case 'moveTo': yield* anchorRef(op.to, ctx, 'moveTo.to'); break;
      case 'choice': for (const o of op.options) yield* walk(o.do, { ...ctx }); break;
      case 'if': yield* walk(op.then, { ...ctx }); yield* walk(op.else, { ...ctx }); break;
      default: break;
    }
  }
}
function* anchorRef(ref, ctx, what) {
  if (typeof ref !== 'string') return;
  if (ref.includes(':')) { const [map, name] = ref.split(':'); yield { kind: 'anchor', map, name, what }; return; }
  yield { kind: 'anchor', maps: ctx.maps, name: ref, what };
}

test('event scripts only stage on built maps and only use anchors that exist', () => {
  const problems = [];
  for (const ev of defaultCatalog().list) {
    const ctx = { maps: initialMaps(ev) };
    for (const item of walk(ev.script, ctx)) {
      if (item.kind === 'warp') { if (!BUILT.has(item.op.map)) problems.push(`${ev.id}: warps to unbuilt map "${item.op.map}"`); continue; }
      const maps = item.maps || [item.map];
      if (maps.length === 1 && maps[0] === null) continue; // current map unknown (in-place scene): cannot check bare anchors
      if (maps.every((m) => m && !BUILT.has(m))) { problems.push(`${ev.id}: ${item.what} "${item.name}" on unbuilt map ${maps.join('|')}`); continue; }
      const ok = maps.filter((m) => BUILT.has(m)).some((m) => hasAnchor(m, item.name));
      if (!ok) problems.push(`${ev.id}: ${item.what} anchor "${item.name}" not found on ${maps.join('|')}`);
    }
  }
  assert.deepEqual(problems.slice(0, 40), []);
});

test('triggers and conditions only name built maps', () => {
  const problems = [];
  for (const ev of defaultCatalog().list) {
    const t = ev.trigger || {};
    if (t.map && !BUILT.has(t.map)) problems.push(`${ev.id}: trigger map "${t.map}" is not built`);
    const wm = mapFromWhen(ev.when);
    if (wm && wm.every((m) => !BUILT.has(m))) problems.push(`${ev.id}: can never fire, none of its condition maps is built (${wm.join(', ')})`); // a list that also names an unbuilt map is fine
  }
  assert.deepEqual(problems.slice(0, 40), []);
});

test('schedules only use anchors that exist on built maps', () => {
  const problems = [];
  for (const s of Object.values(indexSchedules(SCHEDULE_MODULES))) {
    for (const r of s.routines) for (const [, loc] of r.points) {
      if (!loc) continue;
      const [map, name] = loc.split(':');
      if (!BUILT.has(map)) problems.push(`${s.npc}/${r.id}: unbuilt map ${loc}`);
      else if (!hasAnchor(map, name)) problems.push(`${s.npc}/${r.id}: no anchor ${loc}`);
    }
  }
  assert.deepEqual([...new Set(problems)].slice(0, 40), []);
});
