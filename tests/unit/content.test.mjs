import test from 'node:test';
import assert from 'node:assert/strict';
import { validateContent, MINIMUMS } from '../../tools/validate-content.mjs';
import { API_SURFACE, NPC_IDS } from '../../src/core/registry.js';
import { Data } from '../../src/data/index.js';

test('content validates with zero errors', async () => {
  const { errors } = await validateContent();
  assert.deepEqual(errors, []);
});

test('content meets minimum counts', async () => {
  const { summary } = await validateContent();
  for (const [k, min] of Object.entries(MINIMUMS)) assert.ok(summary[k] >= min, `${k}: ${summary[k]} < ${min}`);
});

test('Data exposes every API_SURFACE.data key', () => {
  for (const k of API_SURFACE.data) assert.notEqual(Data[k], undefined, k);
  assert.equal(Data.getItem('bread').name, 'Rye Loaf');
  assert.equal(Data.getNpc('mira').short, 'Mira');
  assert.equal(Data.getItem('nope'), null);
  for (const id of NPC_IDS) assert.ok(Data.npcs[id] && Data.dialogue[id] && Data.schedules[id], id);
});
