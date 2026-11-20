import test from 'node:test';
import assert from 'node:assert/strict';
import { rankFor, clampScore, sprintTopSpeed, sprintOpponents, sprintScore, makeChart, judgeHit, rhythmScore, RHYTHM, makeOrders, cafeScore, CAFE } from '../../src/scenes/activities/logic.js';

test('ranking thresholds and clamping', () => {
  assert.deepEqual([100, 85, 84, 65, 64, 40, 39, 0].map(rankFor), ['gold', 'gold', 'silver', 'silver', 'bronze', 'bronze', 'none', 'none']);
  assert.equal(clampScore(140), 100); assert.equal(clampScore(-3), 0); assert.equal(clampScore(71.6), 72);
});

test('sprint: fitness raises top speed; winning beats losing; faster time scores more', () => {
  assert.ok(sprintTopSpeed(80) > sprintTopSpeed(10));
  const opp = sprintOpponents(0.5, 3);
  assert.equal(opp.length, 3); assert.ok(opp[0] < opp[2]);
  assert.deepEqual(sprintOpponents(0.5, 3), sprintOpponents(0.5, 3));
  assert.ok(sprintScore(1, 12) > sprintScore(2, 12));
  assert.ok(sprintScore(2, 12) > sprintScore(4, 12));
  assert.ok(sprintScore(1, 11) > sprintScore(1, 16));
  assert.ok(sprintScore(1, 12) >= 85 && sprintScore(4, 20) < 40);
});

test('rhythm chart is deterministic, sorted, spaced and dense enough', () => {
  const a = makeChart({ seed: 4, difficulty: 0.5 }), b = makeChart({ seed: 4, difficulty: 0.5 }), c = makeChart({ seed: 5, difficulty: 0.5 });
  assert.deepEqual(a, b); assert.notDeepEqual(a, c);
  assert.ok(a.length >= 25 && a.length <= 160, `notes: ${a.length}`);
  for (let i = 1; i < a.length; i++) assert.ok(a[i].t >= a[i - 1].t);
  const last = [-9, -9, -9, -9];
  for (const n of a) { assert.ok(n.lane >= 0 && n.lane < 4 && n.t >= 2); assert.ok(n.t - last[n.lane] >= 0.17, 'lane spacing'); last[n.lane] = n.t; }
  assert.ok(makeChart({ seed: 4, difficulty: 0.9 }).length > makeChart({ seed: 4, difficulty: 0.1 }).length);
  assert.equal(judgeHit(0.05), 'perfect'); assert.equal(judgeHit(-0.1), 'good'); assert.equal(judgeHit(0.3), null);
  assert.ok(RHYTHM.perfect < RHYTHM.good);
});

test('rhythm score rewards accuracy and combo', () => {
  assert.equal(rhythmScore({ perfect: 0, good: 0, total: 0 }), 0);
  const all = rhythmScore({ perfect: 50, good: 0, total: 50, maxCombo: 50 });
  assert.ok(all >= 99);
  assert.ok(rhythmScore({ perfect: 20, good: 20, total: 50, maxCombo: 10 }) < all);
  assert.ok(rhythmScore({ perfect: 0, good: 50, total: 50, maxCombo: 50 }) < all);
});

test('cafe orders are deterministic and score reflects service quality', () => {
  const o = makeOrders({ seed: 2 }), o2 = makeOrders({ seed: 2 });
  assert.deepEqual(o, o2);
  assert.ok(o.length >= 9 && o.length <= 20, `orders ${o.length}`);
  for (let i = 1; i < o.length; i++) assert.ok(o[i].at > o[i - 1].at);
  for (const x of o) assert.ok(x.item >= 0 && x.item < 4 && x.patience > 4 && x.at < CAFE.seconds);
  const great = cafeScore({ served: Array(10).fill({ remaining: 8, patience: 10 }), spawned: 10 });
  const poor = cafeScore({ served: Array(4).fill({ remaining: 2, patience: 10 }), spawned: 10, mistakes: 3, walkedOut: 6 });
  assert.ok(great >= 85 && poor < 40, `${great} ${poor}`);
  assert.equal(cafeScore({ spawned: 0 }), 0);
});
