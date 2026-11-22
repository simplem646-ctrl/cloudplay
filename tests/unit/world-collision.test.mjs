import test from 'node:test';
import assert from 'node:assert/strict';
import { CollisionWorld } from '../../src/world/collision.js';
import { opToPoly, pointInPoly, pathToPoly, polyBounds } from '../../src/world/shapes.js';

function world() {
  const w = new CollisionWorld(20, 14);
  w.addRect(8, 3, 12, 8); // building
  w.addRect(2, 10.4, 7, 10.6, { tile: false }); // thin fence
  w.addCircle(15, 5, 0.5, { tile: true });
  w.addWater(opToPoly({ rect: [0, 12, 20, 2] }));
  w.finalize();
  return w;
}

test('moveCircle slides along walls and never tunnels thin fences', () => {
  const w = world();
  // walk straight at the fence in 0.5 tile steps
  let x = 4, z = 8;
  for (let i = 0; i < 30; i++) ({ x, z } = w.moveCircle(x, z, 0, 0.5, 0.3));
  assert.ok(z < 10.4, `stopped before the fence, z=${z}`);
  // diagonal into the building: slides along the south wall
  let r = { x: 6, z: 9 };
  for (let i = 0; i < 12; i++) r = w.moveCircle(r.x, r.z, 0.3, -0.3, 0.3);
  assert.equal(w.blockedAt(r.x, r.z, 0.29), false, 'never inside the building');
  assert.ok(r.x <= 7.71 && r.z < 8.5, 'slid along the west wall');
});

test('water blocks, bridges (clearWater) allow walking', () => {
  const w = world();
  assert.equal(w.blockedAt(10, 12.5, 0.3), true);
  w.clearWater(9, 11.8, 11, 14.2);
  assert.equal(w.blockedAt(10, 12.5, 0.3), false);
});

test('grid.walk blocks tiles under solids, trunks and water', () => {
  const w = world();
  const g = w.grid;
  assert.equal(g.walk[5 * g.w + 10], 0);
  assert.equal(g.walk[5 * g.w + 15], 0);
  assert.equal(g.walk[12 * g.w + 3], 0);
  assert.equal(g.walk[1 * g.w + 1], 1);
});

test('surfaceAt follows painted ground kinds and winter snow', () => {
  const w = new CollisionWorld(10, 10);
  w.paintSurface(opToPoly({ rect: [2, 2, 3, 3] }), 'stone');
  assert.equal(w.surfaceAt(3, 3), 'stone');
  assert.equal(w.surfaceAt(8, 8), 'grass');
  w.winter = true;
  assert.equal(w.surfaceAt(8, 8), 'snow');
  assert.equal(w.surfaceAt(3, 3), 'stone');
});

test('shapes: path polygon contains its centre line, rect and circle ops', () => {
  const poly = pathToPoly([[0, 5], [10, 5], [20, 8]], 2.4, { wobble: 0 });
  assert.ok(pointInPoly(5, 5, poly));
  assert.ok(!pointInPoly(5, 9, poly));
  const b = polyBounds(poly);
  assert.ok(b.x1 >= 20 && b.z1 > 8);
  assert.ok(pointInPoly(5, 5, opToPoly({ circle: [5, 5, 2] })));
  assert.ok(!pointInPoly(9, 9, opToPoly({ rect: [0, 0, 5, 5], r: 1 })));
});
