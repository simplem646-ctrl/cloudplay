import test from 'node:test';
import assert from 'node:assert/strict';
import { moveActor, moveBy, getHitbox, rectBlocked, PathWalker, dirFromVector, WALK_SPEED, RUN_SPEED } from '../../src/engine/mover.js';
import { findPath } from '../../src/engine/pathfinding.js';
import { tileToFeet } from '../../src/core/util.js';

// 8x6 map, border walls, a wall block at (4,2)-(4,3)
function makeMap(w = 8, h = 6, extra = []) {
  const collision = new Uint8Array(w * h);
  for (let x = 0; x < w; x++) collision[x] = collision[(h - 1) * w + x] = 1;
  for (let y = 0; y < h; y++) collision[y * w] = collision[y * w + w - 1] = 1;
  for (const [x, y] of extra) collision[y * w + x] = 1;
  return { width: w, height: h, collision };
}
const actorAt = (tx, ty) => {
  const f = tileToFeet(tx, ty);
  const a = { x: f.x, y: f.y, dir: 'down', moving: false, setMoving(m, r) { this.moving = m; this.running = r; } };
  return a;
};

test('hitbox is 10x6 with feet at the bottom edge', () => {
  const r = getHitbox({ x: 40, y: 30 });
  assert.deepEqual([r.x0, r.x1, r.y0, r.y1], [35, 45, 24, 30]);
});

test('walk and run speeds (px/s), diagonals are normalised', () => {
  const map = makeMap(30, 20);
  const a = actorAt(5, 5);
  const x0 = a.x;
  for (let i = 0; i < 60; i++) moveActor(a, 1, 0, 1 / 60, map);
  assert.ok(Math.abs(a.x - x0 - WALK_SPEED) < 0.01, `walked ${a.x - x0}`);
  const b = actorAt(5, 5);
  for (let i = 0; i < 60; i++) moveActor(b, 1, 0, 1 / 60, map, { run: true });
  assert.ok(Math.abs(b.x - 88 - RUN_SPEED) < 0.01);
  const c = actorAt(5, 5);
  const cx = c.x, cy = c.y;
  for (let i = 0; i < 60; i++) moveActor(c, 1, 1, 1 / 60, map);
  assert.ok(Math.abs(Math.hypot(c.x - cx, c.y - cy) - WALK_SPEED) < 0.01);
});

test('collision stops flush against walls and slides along them', () => {
  const map = makeMap();
  const a = actorAt(1, 1);
  for (let i = 0; i < 120; i++) moveActor(a, -1, 0, 1 / 60, map);
  // left wall tile 0 ends at x=16, hitbox half width 5 -> x = 21
  assert.equal(a.x, 21);
  const y0 = a.y;
  for (let i = 0; i < 30; i++) moveActor(a, -1, 1, 1 / 60, map); // diagonal into the wall: slides down
  assert.equal(a.x, 21);
  assert.ok(a.y > y0 + 5);
  for (let i = 0; i < 300; i++) moveActor(a, 0, 1, 1 / 60, map);
  assert.equal(a.y, 5 * 16); // hitbox bottom flush with the bottom wall tile (y=80)
  assert.equal(a.dir, 'down');
});

test('map border blocks (out of bounds is solid)', () => {
  const map = { width: 3, height: 3, collision: new Uint8Array(9) };
  const a = actorAt(1, 1);
  for (let i = 0; i < 200; i++) moveActor(a, 1, 0, 1 / 60, map);
  assert.equal(a.x, 48 - 5);
});

test('big dt does not tunnel through a thin wall', () => {
  const map = makeMap(12, 6, [[6, 1], [6, 2], [6, 3], [6, 4]]);
  const a = actorAt(2, 2);
  for (let i = 0; i < 10; i++) moveBy(a, 40, 0, map);
  assert.ok(a.x <= 6 * 16 - 5 + 1e-6);
});

test('corner assist slides around a clipped corner', () => {
  const map = makeMap(10, 6, [[5, 2]]);
  const a = actorAt(3, 2);
  // block (5,2) occupies y in [32,48); hitbox y range is [y-6,y): y=34 overlaps the block's top 2px
  a.y = 34;
  for (let i = 0; i < 120; i++) moveActor(a, 1, 0, 1 / 60, map);
  assert.ok(a.x > 5 * 16 + 10, `got past the block, x=${a.x}`);
  const b = actorAt(3, 2);
  b.y = 34;
  for (let i = 0; i < 120; i++) moveActor(b, 1, 0, 1 / 60, map, { assist: 0 });
  assert.ok(b.x < 5 * 16, 'without assist it stays blocked');
});

test('actor blockers stop movement but do not trap overlapping actors', () => {
  const map = makeMap(12, 6);
  const a = actorAt(2, 2);
  const o = actorAt(5, 2);
  for (let i = 0; i < 200; i++) moveActor(a, 1, 0, 1 / 60, map, { blockers: [a, o] });
  assert.equal(a.x, o.x - 10); // 5+5 px of hitbox
  // overlapping start can walk away
  const c = actorAt(5, 2);
  c.x -= 3;
  const before = c.x;
  moveActor(c, -1, 0, 1 / 60, map, { blockers: [o] });
  assert.ok(c.x < before);
  o.solid = false;
  const d = actorAt(2, 2);
  for (let i = 0; i < 200; i++) moveActor(d, 1, 0, 1 / 60, map, { blockers: [o] });
  assert.ok(d.x > o.x);
});

test('moveActor sets facing and walking flag', () => {
  const map = makeMap();
  const a = actorAt(2, 2);
  moveActor(a, 0, -1, 1 / 60, map);
  assert.equal(a.dir, 'up');
  assert.equal(a.moving, true);
  moveActor(a, 0, 0, 1 / 60, map);
  assert.equal(a.moving, false);
  assert.equal(dirFromVector(1, 1, 'right'), 'right');
  assert.equal(dirFromVector(-1, 1, 'right'), 'down');
});

test('rectBlocked respects exclusive upper bounds', () => {
  const map = makeMap();
  assert.equal(rectBlocked(map, 16, 16, 32, 32), false); // exactly tile (1,1)
  assert.equal(rectBlocked(map, 16, 16, 32.5, 32), false); // tile (2,1) is open too
  assert.equal(rectBlocked(map, 16, 16, 32, 80.5), true); // dips into the bottom wall row
  assert.equal(rectBlocked(map, 0, 16, 16, 32), true);
});

test('PathWalker follows a findPath result and arrives exactly on the goal tile', () => {
  const map = makeMap(10, 8, [[4, 1], [4, 2], [4, 3], [4, 4]]);
  const a = actorAt(2, 2);
  const path = findPath(map.collision, map.width, map.height, 2, 2, 6, 2);
  assert.ok(path && path.length > 5);
  const w = new PathWalker(a, path);
  let n = 0;
  while (!w.update(1 / 60, map) && n++ < 2000);
  assert.ok(w.done && !w.stuck);
  const goal = tileToFeet(6, 2);
  assert.ok(Math.abs(a.x - goal.x) < 0.1 && Math.abs(a.y - goal.y) < 0.1, `${a.x},${a.y} vs ${goal.x},${goal.y}`);
  assert.equal(a.moving, false);
});
