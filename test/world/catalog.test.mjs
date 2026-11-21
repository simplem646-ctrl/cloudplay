import test from 'node:test';
import assert from 'node:assert/strict';
import { TILES, NAME_TO_INDEX, TERRAINS } from '../../src/world/tiles.js';
import { PAINTERS, SHEETS, renderAtlasPixels } from '../../src/world/tileset.js';
import { SEASONS } from '../../src/core/constants.js';

test('catalog: unique names, aligned indices, index 0 is empty', () => {
  assert.equal(TILES[0].name, 'empty');
  const seen = new Set();
  TILES.forEach((t, i) => {
    assert.ok(!seen.has(t.name), `duplicate ${t.name}`);
    seen.add(t.name);
    assert.equal(NAME_TO_INDEX[t.name], i);
  });
  assert.ok(TILES.length >= 300, `only ${TILES.length} tiles`);
});

test('catalog: animation frames are valid tiles', () => {
  for (const t of TILES) {
    if (!t.anim) continue;
    assert.ok(t.anim.fps > 0 && t.anim.frames.length >= 2, t.name);
    assert.equal(t.anim.frames[0], NAME_TO_INDEX[t.name]);
    for (const f of t.anim.frames) assert.ok(f > 0 && f < TILES.length, `${t.name} frame ${f}`);
  }
});

test('catalog: every recipe has a painter and layers are valid', () => {
  for (const t of TILES.slice(1)) {
    const kind = t.art[0];
    if (kind[0] === '@') assert.ok(SHEETS[kind.slice(1)], `${t.name}: no sheet painter ${kind}`);
    else assert.ok(PAINTERS[kind], `${t.name}: no painter ${kind}`);
    assert.ok(['ground', 'deco', 'above'].includes(t.layer), t.name);
  }
});

test('catalog: terrain table references real tiles', () => {
  for (const [name, t] of Object.entries(TERRAINS)) {
    for (const n of t.tiles || []) assert.ok(NAME_TO_INDEX[n] !== undefined, `${name}: ${n}`);
    if (t.auto) for (let m = 0; m < 16; m++) assert.ok(NAME_TO_INDEX[`${t.auto}_${m}`] !== undefined, `${name} mask ${m}`);
    if (t.autoWater) for (let m = 0; m < 16; m++) assert.ok(NAME_TO_INDEX[`water_${t.autoWater}_${m}`] !== undefined);
  }
});

test('tileset: all four seasons render; indoor tiles identical, outdoor ground differs', () => {
  const px = Object.fromEntries(SEASONS.map((s) => [s, renderAtlasPixels(s)]));
  const tilePixels = (s, i) => {
    const a = px[s], x0 = (i % a.cols) * 16, y0 = Math.floor(i / a.cols) * 16, out = [];
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) { const o = ((y0 + y) * a.width + x0 + x) * 4; out.push(a.data[o], a.data[o + 1], a.data[o + 2], a.data[o + 3]); }
    return out.join(',');
  };
  TILES.forEach((t, i) => {
    if (!t.indoor) return;
    const ref = tilePixels('spring', i);
    for (const s of SEASONS) assert.equal(tilePixels(s, i), ref, `${t.name} differs in ${s}`);
  });
  const g = NAME_TO_INDEX.grass_a;
  assert.notEqual(tilePixels('spring', g), tilePixels('winter', g));
  assert.notEqual(tilePixels('summer', g), tilePixels('autumn', g));
  // painted tiles are not blank
  for (const name of ['grass_a', 'path_dirt_15', 'roof_red_m', 'bench_l', 'floor_wood_a']) assert.ok(tilePixels('spring', NAME_TO_INDEX[name]).split(',').some((v, k) => k % 4 === 3 && v === '255'), name);
});
