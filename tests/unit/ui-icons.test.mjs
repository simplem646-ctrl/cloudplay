import test from 'node:test';
import assert from 'node:assert/strict';
import { ICON_SHAPES } from '../../src/core/registry.js';
import { ICON_DRAWERS, hasDrawer, coveredShapes, itemIcon, mix } from '../../src/ui/icons.js';

const TIER1 = ['fish_small', 'fish_long', 'fish_round', 'shell_spiral', 'mushroom', 'berry', 'herb', 'leaf', 'flower', 'flower_bunch', 'bread_loaf', 'bread_roll', 'cake_slice', 'cookie', 'mug', 'teapot', 'book', 'scroll', 'letter', 'key', 'coin', 'gem', 'lantern', 'parcel', 'rod', 'map', 'star', 'heart_charm', 'honey_jar', 'egg', 'fruit_apple', 'log', 'rock', 'feather', 'bottle', 'jar', 'lens', 'candle'];

test('every ICON_SHAPES entry has a drawer (the generic fallback covers anything else)', () => {
  const missing = ICON_SHAPES.filter((s) => !hasDrawer(s));
  assert.deepEqual(missing, []);
  assert.equal(coveredShapes().length, ICON_SHAPES.length);
});

test('tier 1 shapes are registered', () => {
  for (const s of TIER1) assert.ok(typeof ICON_DRAWERS[s] === 'function', s);
});

test('no stray drawers for unknown shapes', () => {
  for (const k of Object.keys(ICON_DRAWERS)) assert.ok(ICON_SHAPES.includes(k), k);
});

test('colour mix helper', () => {
  assert.equal(mix('#000000', '#ffffff', 0.5), '#808080');
  assert.equal(mix('#ff0000', '#ff0000', 0.3), '#ff0000');
});

test('itemIcon is importable in Node (no DOM at import time)', () => {
  assert.equal(typeof itemIcon, 'function');
});
