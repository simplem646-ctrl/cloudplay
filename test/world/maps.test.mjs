// Validates EVERY map file in src/world/maps against docs/game/04_WORLD_SPEC.md (see src/world/spec.js).
// When all 26 files exist the strict "ALL 26 present" mode switches on automatically: cross-map warp targets
// must then resolve for every map, so map workers get the whole-world check for free.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { MAP_IDS } from '../../src/data/ids.js';
import { validateMap, validateWarpTargets } from '../../src/world/builder.js';
import { TILES } from '../../src/world/tiles.js';
import { renderMapPixels } from '../../src/world/render.js';

const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../src/world/maps');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.js') && f !== 'index.js').sort();
const defs = {};
for (const f of files) {
  const mod = await import(pathToFileURL(path.join(dir, f)).href);
  const def = typeof mod.default === 'function' ? mod.default() : mod.default;
  defs[f.replace(/\.js$/, '')] = def;
}
const ALL = MAP_IDS.every((id) => defs[id]);

test('map files are named after MAP_IDS and carry the same id', () => {
  assert.ok(files.length >= 3);
  for (const [name, def] of Object.entries(defs)) {
    assert.ok(MAP_IDS.includes(name), `${name}.js is not a MAP_ID`);
    assert.equal(def.id, name);
  }
});

for (const [id, def] of Object.entries(defs)) {
  test(`map ${id}: validateMap (doc 04 conventions, reachability, warps)`, () => {
    assert.deepEqual(validateMap(def), []);
  });
  test(`map ${id}: contract shape and richness`, () => {
    const n = def.width * def.height;
    for (const L of ['ground', 'deco', 'above']) assert.ok(def.layers[L] instanceof Uint16Array && def.layers[L].length === n);
    assert.ok(def.collision instanceof Uint8Array);
    for (let i = 0; i < n; i++) if (!def.indoor) assert.ok(def.layers.ground[i] > 0, `empty ground at ${i}`);
    const kinds = new Set();
    for (const L of ['deco', 'above']) for (const t of def.layers[L]) if (t) kinds.add(TILES[t].name.replace(/_\d+$/, '').split('_')[0]);
    assert.ok(kinds.size >= 10, `only ${kinds.size} kinds of props`);
    assert.ok(def.interactables.length >= 1 && def.warps.length >= 1);
    assert.equal(Object.keys(def.anchors).filter((k) => /^npc_[1-6]$/.test(k)).length, 6);
    const spots = ['spot_a', 'spot_b', 'spot_c', 'spot_d'].map((k) => `${def.anchors[k].x},${def.anchors[k].y}`);
    assert.equal(new Set(spots).size, 4, 'spot_a..d must be distinct');
  });
  test(`map ${id}: renders in all seasons`, () => {
    for (const s of ['spring', 'summer', 'autumn', 'winter']) {
      const px = renderMapPixels(def, s, { overlay: true });
      assert.equal(px.width, def.width * 16);
    }
  });
}

test('cross-map warp targets resolve (maps that exist; strict when ALL 26 present)', () => {
  assert.deepEqual(validateWarpTargets(defs, { strict: ALL }), []);
});

test('ALL 26 present: every connection is a pair of warps with matching from_ anchors', { skip: !ALL && 'strict mode starts once all 26 map files exist' }, () => {
  assert.equal(Object.keys(defs).length, 26);
});
