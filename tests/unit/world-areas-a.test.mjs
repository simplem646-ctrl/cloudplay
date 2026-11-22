import test from 'node:test';
import assert from 'node:assert/strict';
import { AREAS, areaAnchorNames, areaTransitionIds, areaInteractables } from '../../src/core/registry.js';
import { getDef } from '../../src/world/areas/index.js';
import { buildHeadless } from '../../src/world/headless.js';

const IDS = ['market_street', 'riverside_park', 'harbor', 'bakery', 'general_store', 'cafe'];

for (const id of IDS) {
  test(`${id}: built (not a placeholder), registry size, anchors/transitions/interactables`, () => {
    const def = getDef(id);
    assert.ok(!def.placeholder, 'not a placeholder');
    assert.deepEqual(def.size, AREAS[id].size);
    const a = buildHeadless(id).runtime;
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
  });
}

test('decor sets exist: park, harbor, town square', () => {
  assert.ok(getDef('riverside_park').decor.spring_picnic.length);
  assert.ok(getDef('riverside_park').decor.lantern_festival.length);
  assert.ok(getDef('harbor').decor.midsummer.length);
  assert.ok(getDef('town_square').decor.harvest_fair.length);
});
