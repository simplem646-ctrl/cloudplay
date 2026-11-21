// Regression: two scripted walks on one actor used to drag it in opposite directions forever (nina_04_festival never ended).
// A newer walk must supersede an older one, and place/hide cancel walks.
import test from 'node:test';
import assert from 'node:assert/strict';
import { OverworldScene } from '../../src/scenes/overworld.js';
import { TILE } from '../../src/core/constants.js';

const P = OverworldScene.prototype;
const mkOw = (w = 30, h = 12) => {
  const ow = { map: { width: w, height: h, collision: new Uint8Array(w * h) }, walkers: [], npcs: { blockers: [] }, skipping: false };
  ow.cancelWalks = P.cancelWalks; ow.walkActor = P.walkActor; ow.updateWalkers = P.updateWalkers;
  return ow;
};
const mkActor = (tx, ty) => ({
  x: tx * TILE + TILE / 2, y: ty * TILE + TILE - 2, dir: 'down', speedMul: 1, moving: false,
  get tx() { return Math.floor(this.x / TILE); }, get ty() { return Math.floor(this.y / TILE); },
  setMoving(m) { this.moving = m; },
  setTile(x, y) { this.x = x * TILE + TILE / 2; this.y = y * TILE + TILE - 2; },
});
const run = (ow, seconds) => { for (let i = 0; i < seconds * 60 && ow.walkers.length; i++) ow.updateWalkers(1 / 60); };

test('a single walk reaches its goal and resolves', async () => {
  const ow = mkOw(), a = mkActor(2, 2);
  const p = ow.walkActor(a, { x: 12, y: 2 }, { run: true });
  run(ow, 10);
  await p;
  assert.equal(ow.walkers.length, 0);
  assert.equal(a.tx, 12);
});

test('a newer walk supersedes an older walk of the same actor (no livelock)', async () => {
  const ow = mkOw(), a = mkActor(2, 2);
  let first = false, second = false;
  const p1 = ow.walkActor(a, { x: 25, y: 2 }, { run: true }).then(() => { first = true; });
  run(ow, 0.4); // the first walk is under way
  const p2 = ow.walkActor(a, { x: 5, y: 9 }, { run: true }).then(() => { second = true; });
  assert.equal(ow.walkers.length, 1, 'only the newest walker stays');
  run(ow, 20);
  await Promise.all([p1, p2]);
  assert.ok(first && second, 'both promises resolve');
  assert.equal(ow.walkers.length, 0);
  assert.ok(Math.abs(a.tx - 5) <= 1 && Math.abs(a.ty - 9) <= 1, `actor ends at the second goal (got ${a.tx},${a.ty})`);
});

test('walks of different actors do not interfere', async () => {
  const ow = mkOw(), a = mkActor(2, 2), b = mkActor(2, 8);
  const pa = ow.walkActor(a, { x: 20, y: 2 }, { run: true });
  const pb = ow.walkActor(b, { x: 20, y: 8 }, { run: true });
  assert.equal(ow.walkers.length, 2);
  run(ow, 20);
  await Promise.all([pa, pb]);
  assert.equal(a.tx, 20); assert.equal(b.tx, 20);
});

test('cancelWalks resolves and removes only that actor\'s walks', () => {
  const ow = mkOw(), a = mkActor(2, 2), b = mkActor(2, 8);
  let resolved = 0;
  ow.walkActor(a, { x: 20, y: 2 }).then(() => resolved++);
  ow.walkActor(b, { x: 20, y: 8 }).then(() => resolved++);
  ow.cancelWalks(a);
  assert.equal(ow.walkers.length, 1);
  assert.equal(ow.walkers[0].actor, b);
});
