// Pure helpers of the ring-timing mini-games (Star Gazing, Shell Hunt).
import test from 'node:test';
import assert from 'node:assert/strict';
import { RING, ringProgress, ringAccuracy, ringScore, makeTargets } from '../../src/scenes/activities/ring_timing.js';
import { rankFor } from '../../src/scenes/activities/logic.js';

test('ring progress: 0 at the start, 1 when the ring has closed', () => {
  assert.equal(ringProgress(2, 2, 1.25), 0);
  assert.ok(Math.abs(ringProgress(3.25, 2, 1.25) - 1) < 1e-9);
});

test('ring accuracy: perfect at 1, null when too early, 0 when late', () => {
  assert.equal(ringAccuracy(1), 1);
  assert.equal(ringAccuracy(RING.early - 0.01), null);
  assert.equal(ringAccuracy(RING.late + 0.01), 0);
  assert.ok(ringAccuracy(0.9) > ringAccuracy(0.7));
  assert.ok(ringAccuracy(1.1) > ringAccuracy(1.3));
  for (let p = RING.early; p <= RING.late; p += 0.05) { const a = ringAccuracy(p); assert.ok(a >= 0 && a <= 1); }
});

test('ring score: all perfect is gold, nothing is none, misses count as zero', () => {
  assert.equal(rankFor(ringScore(new Array(8).fill(1))), 'gold');
  assert.equal(rankFor(ringScore([])), 'none');
  assert.equal(ringScore([1, 1, 1, 1]), 50); // only four of eight hit
  assert.equal(ringScore([1, null, 1, 1, 1, 1, 1, 1]), 88);
});

test('targets are deterministic, inside the playfield and spaced in time', () => {
  const a = makeTargets(5, 0.45), b = makeTargets(5, 0.45), c = makeTargets(6, 0.45);
  assert.deepEqual(a, b);
  assert.notDeepEqual(a, c);
  assert.equal(a.length, RING.targets);
  a.forEach((t, i) => {
    assert.ok(t.x >= 44 && t.x < 276 && t.y >= 58 && t.y < 170);
    if (i) assert.ok(t.start - a[i - 1].start >= RING.gap - 1e-9);
  });
  assert.ok(makeTargets(5, 0.9)[0].life < makeTargets(5, 0.1)[0].life); // harder = faster ring
});
