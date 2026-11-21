// Portraits API shape + id coverage (no canvas needed: runs in plain Node).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as portraits from '../../src/portraits/index.js';
import { SPECS } from '../../src/portraits/specs.js';
import { EXPR } from '../../src/portraits/expressions.js';

const IDS = ['mira', 'willa', 'juno', 'rhea', 'celeste', 'odell', 'theo', 'nana_fen', 'gus'];
const EXPRS = ['neutral', 'happy', 'sad', 'angry', 'surprised', 'shy', 'thinking', 'laugh', 'worried', 'smug'];

test('exports the ARCHITECTURE §7 API', () => {
  for (const name of ['hasPortrait', 'getPortrait', 'drawPortrait', 'preload']) {
    assert.equal(typeof portraits[name], 'function', name);
  }
  assert.deepEqual(portraits.PORTRAIT_IDS, IDS);
  assert.deepEqual(portraits.EXPRESSIONS, EXPRS);
});

test('hasPortrait is true only for the 9 portrait ids', () => {
  for (const id of IDS) assert.equal(portraits.hasPortrait(id), true, id);
  for (const id of ['rosalind', 'barnaby', 'pip', 'player', '', undefined, null, 'MIRA']) {
    assert.equal(portraits.hasPortrait(id), false, String(id));
  }
});

test('every portrait id has a spec and every expression has parameters', () => {
  for (const id of IDS) {
    const s = SPECS[id];
    assert.ok(s, id);
    for (const k of ['skin', 'hair', 'eyes', 'outfit', 'face', 'build']) assert.ok(s[k], `${id}.${k}`);
  }
  assert.deepEqual(Object.keys(SPECS).sort(), [...IDS].sort());
  for (const e of EXPRS) {
    const x = EXPR[e];
    assert.ok(x && x.eye && x.brow && typeof x.mouth === 'string' && Array.isArray(x.marks), e);
  }
});

test('without a canvas implementation the API degrades gracefully', async () => {
  if (typeof document !== 'undefined' || typeof OffscreenCanvas !== 'undefined') return;
  assert.equal(portraits.getPortrait('mira', 'happy'), null);
  assert.equal(portraits.getPortrait('rosalind'), null);
  assert.equal(portraits.drawPortrait(null, 'mira', 'happy', 0, 0, 10, 10), false);
  assert.equal(await portraits.preload(), 0);
});
