import test from 'node:test';
import assert from 'node:assert/strict';
import { MapBuilder, validateMap, validateWarpTargets } from '../../src/world/builder.js';
import { NAME_TO_INDEX, TILES } from '../../src/world/tiles.js';

const mk = (o = {}) => new MapBuilder('bell_tower', { name: 'T', width: 12, height: 16, indoor: false, ...o });
const nameAt = (def, L, x, y) => TILES[def.layers[L][y * def.width + x]].name;
const base = (b) => {
  b.setAnchors({ entrance: [1, 1, 'down'] });
  return b;
};
const errs = (b, o) => validateMap(b.build({ validate: false }), { spec: false, ...o });

test('autotile: 4-neighbour masks, outside the map counts as connected', () => {
  const b = mk(); b.rect('path', 3, 3, 3, 3);
  const d = b.build({ validate: false });
  assert.equal(nameAt(d, 'ground', 3, 3), 'path_dirt_6'); // E+S
  assert.equal(nameAt(d, 'ground', 5, 3), 'path_dirt_12'); // S+W
  assert.equal(nameAt(d, 'ground', 3, 5), 'path_dirt_3'); // N+E
  assert.equal(nameAt(d, 'ground', 5, 5), 'path_dirt_9'); // N+W
  assert.equal(nameAt(d, 'ground', 4, 3), 'path_dirt_14'); // E+S+W
  assert.match(nameAt(d, 'ground', 4, 4), /^path_dirt_15/);
  const e = mk(); e.rect('path', 0, 0, 2, 2);
  assert.match(nameAt(e.build({ validate: false }), 'ground', 0, 0), /^path_dirt_15/); // OOB = same terrain
  const f = mk(); f.line('path', 1, 8, 1, 12, 1);
  assert.equal(nameAt(f.build({ validate: false }), 'ground', 1, 8), 'path_dirt_4'); // only S connected
});

test('autotile: water picks a shore kind and animates', () => {
  const b = mk(); b.rect('sand_flat', 0, 0, 12, 16); b.blob('water', 6, 8, 3, 3, { roughness: 0 });
  const d = b.build({ validate: false });
  const n = nameAt(d, 'ground', 6, 8);
  assert.match(n, /^water_[gsq]_15$/);
  assert.ok(TILES[NAME_TO_INDEX[n]].anim && TILES[NAME_TO_INDEX[n]].water);
  assert.ok([...d.layers.ground].some((i) => /^water_s_/.test(TILES[i].name)), 'sand shore');
  assert.equal(d.collision[8 * 12 + 6], 1, 'water is solid');
});

test('stamps: house, tree, bench, fountain', () => {
  const b = mk({ width: 12, height: 16 });
  const h = b.stamp('house', 1, 6, { w: 5, roof: 'blue' });
  assert.deepEqual(h.front, { x: h.door.x, y: 11 });
  const t = b.stamp('tree', 9, 12);
  b.stamp('bench', 6, 14);
  const d = base(b).build({ validate: false });
  assert.match(nameAt(d, 'deco', h.door.x, h.door.y), /^door_wood_lo$/);
  assert.equal(d.collision[h.door.y * 12 + h.door.x], 0, 'door tile is walkable');
  assert.equal(d.collision[6 * 12 + 1], 1, 'roof blocked');
  assert.equal(d.collision[10 * 12 + 1], 1, 'wall solid');
  assert.equal(nameAt(d, 'above', 8, 10), 'tree_round_0_0');
  assert.equal(d.collision[12 * 12 + 9], 1, 'trunk solid');
  assert.equal(d.collision[10 * 12 + 9], 0, 'canopy not solid');
  assert.equal(d.collision[14 * 12 + 7], 1, 'bench solid');
  void t;
  assert.throws(() => b.stamp('nope', 0, 0), /unknown stamp/);
  assert.throws(() => b.put('nope_tile', 0, 0), /unknown tile/);
  assert.throws(() => b.put('rock_a', 99, 0), /outside/);
});

test('block/clear override tile collision', () => {
  const b = mk(); b.put('rock_a', 4, 4); b.clear(4, 4); b.block(5, 5);
  const d = b.build({ validate: false });
  assert.equal(d.collision[4 * 12 + 4], 0); assert.equal(d.collision[5 * 12 + 5], 1);
});

test('validateMap: a clean map has no errors', () => {
  const b = base(mk());
  assert.deepEqual(errs(b), []);
});

test('validateMap negative cases', () => {
  let b = base(mk()); b.put('rock_a', 3, 3); b.anchor('spot_a', 3, 3);
  assert.ok(errs(b).some((e) => /anchor "spot_a".*solid/.test(e)));
  b = base(mk()); b.anchors.far = { x: 40, y: 1, dir: 'down' };
  assert.ok(errs(b).some((e) => /out of bounds/.test(e)));
  b = base(mk()); b.put('rock_a', 3, 3); b.warp(3, 3, 1, 1, 'clinic:from_x');
  assert.ok(errs(b).some((e) => /warp.*solid/.test(e)));
  b = base(mk()); b.warp(2, 2, 1, 1, 'not a target');
  assert.ok(errs(b).some((e) => /map_id:anchor_name/.test(e)));
  b = base(mk()); b.warp(2, 2, 1, 1, 'nowhere:from_x');
  assert.ok(errs(b).some((e) => /not in MAP_IDS/.test(e)));
  b = base(mk()); b.warp(2, 2, 1, 1, 'bell_tower:missing');
  assert.ok(errs(b).some((e) => /anchor "missing"/.test(e)));
  b = base(mk()); b.warp(2, 2, 1, 1, 'clinic:from_x', { requires: { bogus: 1 } });
  assert.ok(errs(b).some((e) => /requires/.test(e)));
  b = base(mk()); b.warp(2, 2, 1, 1, 'clinic:from_x', { sfx: 'nope' });
  assert.ok(errs(b).some((e) => /sfx/.test(e)));
  // sealed-off anchor
  b = base(mk()); b.rect('water', 6, 6, 3, 3); b.rect('hedge', 5, 5, 5, 5); b.gap(7, 7, 1, 1); b.anchor('island', 7, 7);
  b.block(5, 5, 5, 5); b.clear(7, 7);
  assert.ok(errs(b).some((e) => /anchor "island".*not reachable/.test(e)));
  // interactable embedded in a solid blob
  b = base(mk()); b.rect('hedge', 5, 5, 3, 3); b.block(5, 5, 3, 3); b.interact('x', 6, 6, 1, 1, 'X', { type: 'rest' });
  assert.ok(errs(b).some((e) => /no reachable walkable tile next to it/.test(e)));
  b = base(mk()); b.interact('x', 3, 3, 1, 1, 'X', { type: 'dance' });
  assert.ok(errs(b).some((e) => /INTERACT_ACTIONS/.test(e)));
  b = base(mk()); b.interact('x', 3, 3, 1, 1, 'X', { type: 'shop', shop: 'nope' });
  assert.ok(errs(b).some((e) => /SHOP_IDS/.test(e)));
  b = base(mk()); b.interact('x', 3, 3, 1, 1, 'X', { type: 'text' });
  assert.ok(errs(b).some((e) => /lines/.test(e)));
  b = base(mk()); b.interact('x', 3, 3, 1, 1, 'X', { type: 'rest' }); b.interact('x', 4, 3, 1, 1, 'Y', { type: 'rest' });
  assert.ok(errs(b).some((e) => /duplicate/.test(e)));
});

test('validateMap (spec mode): size, mandatory anchors, connections', () => {
  const d = base(mk()).build({ validate: false });
  const e = validateMap(d);
  assert.ok(e.some((x) => /missing mandatory anchor "spot_a"/.test(x)));
  assert.ok(e.some((x) => /missing mandatory anchor "bell"/.test(x)));
  assert.ok(e.some((x) => /missing mandatory anchor "from_school_rooftop"/.test(x)));
  assert.ok(e.some((x) => /no warp to 'school_rooftop:from_bell_tower'/.test(x)));
  assert.ok(e.some((x) => /missing interactable "bell_tower__bell"/.test(x)));
  assert.throws(() => base(mk()).build(), /is invalid/);
});

test('validateWarpTargets only checks maps that exist unless strict', () => {
  const a = base(mk()).build({ validate: false });
  a.warps.push({ x: 2, y: 2, w: 1, h: 1, to: 'clinic:from_bell_tower' });
  assert.deepEqual(validateWarpTargets({ bell_tower: a }), []);
  assert.equal(validateWarpTargets({ bell_tower: a }, { strict: true }).length, 1);
  const c = { id: 'clinic', anchors: {}, warps: [] };
  assert.equal(validateWarpTargets({ bell_tower: a, clinic: c }).length, 1);
});
