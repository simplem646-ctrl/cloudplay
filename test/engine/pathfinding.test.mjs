import test from 'node:test';
import assert from 'node:assert/strict';
import { findPath, nearestWalkable } from '../../src/engine/pathfinding.js';

const grid = (rows) => {
  const h = rows.length;
  const w = rows[0].length;
  const c = new Uint8Array(w * h);
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') c[y * w + x] = 1; }));
  return { c, w, h };
};
const adjacent = (p) => p.every((t, i) => i === 0 || Math.abs(t.x - p[i - 1].x) + Math.abs(t.y - p[i - 1].y) === 1);

test('straight and detour paths are shortest 4-way', () => {
  const { c, w, h } = grid(['.....', '.###.', '.....']);
  const p = findPath(c, w, h, 0, 1, 4, 1);
  assert.ok(adjacent(p));
  assert.deepEqual(p[0], { x: 0, y: 1 });
  assert.deepEqual(p[p.length - 1], { x: 4, y: 1 });
  assert.equal(p.length, 7); // up, across 4, down = 2 + 4 + 2 steps => 7 tiles with start? 0,1->0,0 ... 4,0->4,1
  for (const t of p) assert.equal(c[t.y * w + t.x], 0);
});

test('unreachable and solid goals return null; goalBlocked allows ending on a solid tile', () => {
  const { c, w, h } = grid(['..#..', '..#..', '..#..']);
  assert.equal(findPath(c, w, h, 0, 0, 4, 0), null);
  assert.equal(findPath(c, w, h, 0, 0, 2, 1), null);
  const p = findPath(c, w, h, 0, 0, 2, 1, { goalBlocked: true });
  assert.deepEqual(p[p.length - 1], { x: 2, y: 1 });
  assert.equal(findPath(c, w, h, -1, 0, 1, 1), null);
});

test('start equals goal gives a single tile', () => {
  const { c, w, h } = grid(['...']);
  assert.deepEqual(findPath(c, w, h, 1, 0, 1, 0), [{ x: 1, y: 0 }]);
});

test('extra blockers (other actors) are avoided', () => {
  const { c, w, h } = grid(['.....', '.....', '.....']);
  const p = findPath(c, w, h, 0, 1, 4, 1, { blocked: (x, y) => x === 2 && y === 1 });
  assert.ok(p.every((t) => !(t.x === 2 && t.y === 1)));
  const q = findPath(c, w, h, 0, 1, 4, 1, { blocked: new Set([1 * 5 + 2]) });
  assert.ok(q.every((t) => !(t.x === 2 && t.y === 1)));
});

test('paths prefer straight runs over staircases', () => {
  const { c, w, h } = grid(['......', '......', '......', '......']);
  const p = findPath(c, w, h, 0, 0, 5, 3);
  let turns = 0;
  for (let i = 2; i < p.length; i++) {
    const a = { x: p[i - 1].x - p[i - 2].x, y: p[i - 1].y - p[i - 2].y };
    const b = { x: p[i].x - p[i - 1].x, y: p[i].y - p[i - 1].y };
    if (a.x !== b.x || a.y !== b.y) turns++;
  }
  assert.equal(turns, 1);
});

test('large open map finishes quickly', () => {
  const w = 120, h = 90;
  const c = new Uint8Array(w * h);
  const t0 = Date.now();
  const p = findPath(c, w, h, 0, 0, w - 1, h - 1);
  assert.equal(p.length, w + h - 1);
  assert.ok(Date.now() - t0 < 500);
});

test('nearestWalkable', () => {
  const { c, w, h } = grid(['###', '#.#', '###']);
  assert.deepEqual(nearestWalkable(c, w, h, 0, 0), { x: 1, y: 1 });
  assert.equal(nearestWalkable(c, w, h, 0, 0, 0), null);
});
