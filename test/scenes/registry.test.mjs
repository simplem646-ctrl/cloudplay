import test from 'node:test';
import assert from 'node:assert/strict';
import {
  registerScene, hasScene, listScenes, openScene, openCall, callTarget,
  registerDirector, runDirectors, listDirectors, resetRegistry,
} from '../../src/scenes/registry.js';

const fakeGame = () => {
  const pushed = [];
  return { pushed, scenes: { push: async (scene, params) => { pushed.push([scene, params]); return scene.result; } } };
};

test('scenes register, open and return the pushed scene result', async () => {
  resetRegistry();
  registerScene('shop', (game, params) => ({ name: 'shop', result: { bought: [], shop: params.shop } }));
  assert.ok(hasScene('shop'));
  assert.deepEqual(listScenes(), ['shop']);
  const g = fakeGame();
  const r = await openScene(g, 'shop', { shop: 'bakery' });
  assert.deepEqual(r, { bought: [], shop: 'bakery' });
  assert.equal(g.pushed.length, 1);
});

test('a missing scene resolves with a harmless default and never throws', async () => {
  resetRegistry();
  const r = await openScene(fakeGame(), 'minigame:track_sprint', {});
  assert.deepEqual(r, { missing: true, score: 0, rank: 'none' });
});

test('openCall maps script call ops to registered scene names', async () => {
  resetRegistry();
  assert.deepEqual(callTarget('minigame', 'track_sprint', { context: 'club' }), { name: 'minigame:track_sprint', params: { context: 'club' } });
  assert.deepEqual(callTarget('activity', 'rest'), { name: 'activity:rest', params: {} });
  assert.deepEqual(callTarget('shop', 'bakery'), { name: 'shop', params: { shop: 'bakery' } });
  assert.deepEqual(callTarget('exam', 'midterm1', { dayIndex: 0 }), { name: 'exam', params: { examId: 'midterm1', dayIndex: 0 } });
  registerScene('activity:rest', () => ({ result: { minutes: 30 } }));
  assert.deepEqual(await openCall(fakeGame(), 'activity', 'rest'), { minutes: 30 });
});

test('directors run in order, first action wins, a throwing director is skipped', () => {
  resetRegistry();
  const silent = console.error; console.error = () => {};
  registerDirector('late', () => ({ scene: 'sleep' }), 90);
  registerDirector('boom', () => { throw new Error('x'); }, 10);
  registerDirector('school', (g, ctx) => (ctx.minute === 510 ? { scene: 'class', params: { period: 1 } } : null), 20);
  assert.deepEqual(listDirectors(), ['boom', 'school', 'late']);
  assert.deepEqual(runDirectors({}, { minute: 510 }), { scene: 'class', params: { period: 1 }, director: 'school' });
  assert.deepEqual(runDirectors({}, { minute: 100 }), { scene: 'sleep', director: 'late' });
  console.error = silent;
});
