import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../../src/core/util.js';
import {
  fishingParams, createFishing, stepFishing, fishingResult, FISHING_TIME_LIMIT,
  createKneading, stepKneading, pressKneading, gradeHit, sweetWidth, kneadScore,
} from '../../src/ui/minigames/logic.js';

const FISH = { id: 'trout', name: 'Trout', difficulty: 3, speed: 1, size: 30 };

test('fishing params scale with difficulty and rod power', () => {
  const easy = fishingParams({ fish: { difficulty: 1, speed: 1 }, rodPower: 3 });
  const hard = fishingParams({ fish: { difficulty: 5, speed: 2 }, rodPower: 1 });
  assert.ok(easy.zoneSize > hard.zoneSize);
  assert.ok(hard.fishSpeed > easy.fishSpeed);
  assert.ok(hard.drain > easy.drain);
  assert.ok(easy.zoneSize <= 0.42 && hard.zoneSize >= 0.12);
});

test('fishing is deterministic with a seeded rng', () => {
  const run = () => {
    const rng = mulberry32(42);
    const s = createFishing({ fish: FISH, rodPower: 2 }, rng);
    for (let i = 0; i < 600; i++) stepFishing(s, 1 / 60, i % 90 < 45, rng);
    return [s.pos, s.fishPos, s.progress, s.phase];
  };
  assert.deepEqual(run(), run());
});

test('zone stays inside the column and obeys hold / gravity', () => {
  const rng = mulberry32(1);
  const s = createFishing({ fish: FISH, rodPower: 2 }, rng);
  for (let i = 0; i < 300; i++) stepFishing(s, 1 / 60, true, rng);
  assert.ok(s.pos <= 1 - s.p.zoneSize / 2 + 1e-9);
  for (let i = 0; i < 300; i++) { s.progress = 0.5; s.phase = 'playing'; stepFishing(s, 1 / 60, false, rng); }
  assert.ok(s.pos >= s.p.zoneSize / 2 - 1e-9);
});

test('progress fills while the fish is in the zone and ends in a catch', () => {
  const rng = mulberry32(7);
  const s = createFishing({ fish: { difficulty: 1, speed: 1 }, rodPower: 3 }, rng);
  s.fishTimer = 1e9; // fish never moves on its own
  s.p.jitter = 0;
  s.fishPos = s.pos;
  let phase = 'playing';
  for (let i = 0; i < 60 * 30 && phase === 'playing'; i++) { s.fishPos = s.pos; phase = stepFishing(s, 1 / 60, false, rng); s.fishPos = s.pos; }
  assert.equal(phase, 'caught');
  assert.deepEqual(fishingResult(s), { caught: true, perfect: true });
});

test('losing the fish ends the game; never perfect', () => {
  const rng = mulberry32(3);
  const s = createFishing({ fish: FISH, rodPower: 1 }, rng);
  s.fishTimer = 1e9; s.p.jitter = 0;
  let phase = 'playing';
  for (let i = 0; i < 60 * 40 && phase === 'playing'; i++) { s.fishPos = 0.98; s.pos = Math.min(s.pos, 0.2); phase = stepFishing(s, 1 / 60, false, rng); }
  assert.equal(phase, 'lost');
  assert.deepEqual(fishingResult(s), { caught: false, perfect: false });
});

test('time limit is 25 s', () => {
  assert.equal(FISHING_TIME_LIMIT, 25);
  const rng = mulberry32(5);
  const s = createFishing({ fish: FISH, rodPower: 2 }, rng);
  s.time = 24.99; s.progress = 0.5; s.fishTimer = 1e9; s.fishPos = s.pos;
  stepFishing(s, 0.05, false, rng);
  assert.equal(s.phase, 'lost');
});

test('kneading: sweet spot shrinks with difficulty', () => {
  assert.ok(sweetWidth(1) > sweetWidth(5));
  assert.ok(sweetWidth(5) >= 0.1);
});

test('kneading: grading thresholds', () => {
  const w = 0.2;
  assert.equal(gradeHit(0, w), 'great');
  assert.equal(gradeHit(0.05, w), 'good');
  assert.equal(gradeHit(0.15, w), 'okay');
  assert.equal(gradeHit(0.3, w), 'miss');
});

test('kneading: marker ping-pongs within 0..1', () => {
  const s = createKneading({ difficulty: 3, rounds: 3 }, mulberry32(2));
  for (let i = 0; i < 2000; i++) { stepKneading(s, 1 / 60); assert.ok(s.marker >= 0 && s.marker <= 1); }
});

test('kneading: perfect timing over 3 rounds scores 1, misses score 0', () => {
  const rng = mulberry32(9);
  const s = createKneading({ difficulty: 2, rounds: 3 }, rng);
  const grades = [];
  while (s.phase === 'playing') { s.marker = s.centre; grades.push(pressKneading(s, rng)); }
  assert.deepEqual(grades, ['great', 'great', 'great']);
  assert.equal(s.score, 1);
  const m = createKneading({ difficulty: 5, rounds: 2 }, rng);
  while (m.phase === 'playing') { m.marker = m.centre > 0.5 ? 0 : 1; pressKneading(m, rng); }
  assert.equal(m.score, 0);
  assert.equal(pressKneading(m), null);
});

test('kneadScore averages grades', () => {
  assert.equal(kneadScore(['great', 'miss']), 0.5);
  assert.equal(kneadScore([]), 0);
});
