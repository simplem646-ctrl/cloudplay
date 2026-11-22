import test from 'node:test';
import assert from 'node:assert/strict';
import { AREA_IDS, API_SURFACE, areaAnchorNames, areaTransitionIds, areaInteractables } from '../../src/core/registry.js';
import { builtAreaIds, getDef } from '../../src/world/areas/index.js';
import { buildHeadless } from '../../src/world/headless.js';
import * as world from '../../src/world/index.js';

test('world module exposes the contract API', () => {
  for (const n of API_SURFACE.world) assert.equal(typeof world[n], 'function', n);
  assert.deepEqual(world.listAreas(), AREA_IDS);
});

test('every registry area resolves to a def (built or placeholder)', () => {
  for (const id of AREA_IDS) assert.ok(getDef(id), id);
  assert.deepEqual(builtAreaIds().sort(), ['brook_lane', 'cottage', 'town_square']);
});

for (const id of ['brook_lane', 'cottage', 'town_square']) {
  test(`${id}: anchors, transitions, interactables and walkable anchors`, () => {
    const b = buildHeadless(id);
    const a = b.runtime;
    for (const n of areaAnchorNames(id)) {
      assert.ok(a.anchors[n], `anchor ${n}`);
      assert.equal(a.isBlockedAt(a.anchors[n].x, a.anchors[n].z, 0.28), false, `anchor ${n} walkable`);
    }
    for (const t of areaTransitionIds(id)) assert.ok(a.transitions.find((x) => x.id === t), `transition ${t}`);
    for (const [iid, type] of Object.entries(areaInteractables(id))) {
      const it = a.interactables.find((x) => x.id === iid);
      assert.ok(it, iid);
      assert.equal(it.type, type, iid);
      assert.ok(it.label, `${iid} label`);
    }
    assert.equal(a.grid.walk.length, a.width * a.height);
  });
}

test('moveCircle keeps the player inside the map', () => {
  const a = buildHeadless('cottage').runtime;
  let p = { x: 7, z: 5 };
  for (let i = 0; i < 60; i++) p = a.moveCircle(p.x, p.z, -0.4, -0.4, 0.3);
  assert.ok(p.x >= 0.3 && p.z >= 0.3);
});
