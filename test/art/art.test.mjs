import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getCharacterSheet, getPortraitSheet, getAnimalSheet, getIconAtlas, getTitleBackdrop, getEndingBackdrop,
  appearanceFromSeed, ENDING_KEYS, getLogo, clearArtCache,
} from '../../src/art/index.js';
import { drawIconBuffer } from '../../src/art/icons.js';
import { CHAR_SHEET, ANIMAL_SHEET, PORTRAIT_SHEET, ICON_SHEET, ICON_NAMES } from '../../src/data/sheet_layout.js';
import { CAST, EXTRAS } from '../../src/data/cast.js';
import { validateAppearance, EXTRA_KINDS, OUTFIT_SLOTS } from '../../src/data/appearance.js';

const people = CAST.filter((c) => c.kind !== 'animal');
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const diff = (a, b) => { let n = 0; for (let i = 3; i < a.length; i += 4) if (a[i] !== b[i] || a[i - 1] !== b[i - 1] || a[i - 2] !== b[i - 2] || a[i - 3] !== b[i - 3]) n++; return n; };

test('character sheet size and determinism, all cast + extras', () => {
  for (const c of [...people, ...EXTRAS]) {
    const s = getCharacterSheet(c.id, 'auto', 'spring');
    assert.equal(s.width, CHAR_SHEET.cols * CHAR_SHEET.frameW);
    assert.equal(s.height, CHAR_SHEET.rows * CHAR_SHEET.frameH);
    assert.equal(s.buffer.length, s.width * s.height * 4);
    let opaque = 0; for (let i = 3; i < s.buffer.length; i += 4) if (s.buffer[i]) opaque++;
    assert.ok(opaque > 600, `${c.id} drawn`);
  }
  const a = Uint8ClampedArray.from(getCharacterSheet('nina', 'school', 'winter').buffer);
  clearArtCache();
  assert.ok(same(a, getCharacterSheet('nina', 'school', 'winter').buffer), 'deterministic');
});

test('every slot and season renders; seasons change the clothes', () => {
  for (const slot of OUTFIT_SLOTS) for (const season of ['spring', 'summer', 'autumn', 'winter']) {
    const s = getCharacterSheet('theo', slot, season);
    assert.equal(s.width, 96);
  }
  const sp = getCharacterSheet('nina', 'school', 'spring').buffer, su = getCharacterSheet('nina', 'school', 'summer').buffer, wi = getCharacterSheet('nina', 'school', 'winter').buffer;
  assert.ok(diff(sp, su) > 40 && diff(sp, wi) > 40);
});

test('named cast stand frames are pairwise distinct', () => {
  const L = CHAR_SHEET;
  const frames = people.map((c) => {
    const s = getCharacterSheet(c.id, 'school', 'spring');
    const out = [];
    for (let y = 0; y < L.frameH; y++) for (let x = 0; x < L.frameW; x++) { const i = (y * s.width + x) * 4; out.push(s.buffer[i], s.buffer[i + 1], s.buffer[i + 2], s.buffer[i + 3]); }
    return out;
  });
  for (let i = 0; i < frames.length; i++) for (let j = i + 1; j < frames.length; j++) {
    assert.ok(diff(frames[i], frames[j]) > 25, `${people[i].id} vs ${people[j].id}`);
  }
});

test('portrait sheets: size, all cast, animals null', () => {
  for (const c of people) {
    const p = getPortraitSheet(c.id, 'school');
    assert.equal(p.width, PORTRAIT_SHEET.cols * 48);
    assert.equal(p.height, PORTRAIT_SHEET.rows * 48);
  }
  assert.equal(getPortraitSheet('biscuit'), null);
  const p = getPortraitSheet('clara');
  const cell = (c, r) => { const o = []; for (let y = 0; y < 48; y++) for (let x = 0; x < 48; x++) { const i = ((r * 48 + y) * p.width + c * 48 + x) * 4; o.push(p.buffer[i], p.buffer[i + 1], p.buffer[i + 2], p.buffer[i + 3]); } return o; };
  for (let a = 0; a < 8; a++) for (let b = a + 1; b < 8; b++) assert.ok(diff(cell(a, 0), cell(b, 0)) > 20, `expr ${a} vs ${b}`);
  assert.ok(diff(cell(0, 0), cell(0, 1)) > 20 && diff(cell(0, 0), cell(0, 2)) > 5);
});

test('animal sheet', () => {
  for (const fur of ['orange_tabby', 'black', 'gray', 'white', 'calico']) {
    const a = getAnimalSheet('cat', fur);
    assert.equal(a.width, ANIMAL_SHEET.cols * 16); assert.equal(a.height, ANIMAL_SHEET.rows * 16);
  }
});

test('icons: atlas layout, opaque pixels, all unique', () => {
  const a = getIconAtlas();
  assert.equal(a.width, ICON_SHEET.cols * 16);
  assert.equal(a.height, Math.ceil(ICON_NAMES.length / ICON_SHEET.cols) * 16);
  const seen = new Map();
  for (const n of ICON_NAMES) {
    const b = drawIconBuffer(n);
    assert.ok(b.countOpaque() >= 20, `${n} has pixels`);
    const key = Buffer.from(b.data).toString('base64');
    assert.ok(!seen.has(key), `${n} duplicates ${seen.get(key)}`);
    seen.set(key, n);
    assert.equal(a.names[n], ICON_NAMES.indexOf(n));
  }
  assert.ok(drawIconBuffer('nope').countOpaque() > 50, 'unknown name draws a ? box');
});

test('appearanceFromSeed validates and is deterministic; 100 seeds render', () => {
  for (const kind of EXTRA_KINDS) for (let s = 0; s < 15; s++) {
    const a = appearanceFromSeed(s * 31 + 7, kind);
    assert.deepEqual(validateAppearance(a, kind), []);
    assert.deepEqual(a, appearanceFromSeed(s * 31 + 7, kind));
  }
  for (let s = 0; s < 100; s++) {
    const a = appearanceFromSeed(s, EXTRA_KINDS[s % EXTRA_KINDS.length]);
    const sh = getCharacterSheet(a, 'auto', ['spring', 'summer', 'autumn', 'winter'][s % 4]);
    assert.equal(sh.width, 96);
    if (s % 10 === 0) assert.equal(getPortraitSheet(a).width, 384);
  }
});

test('title, endings, logo', () => {
  for (const s of ['spring', 'summer', 'autumn', 'winter']) { const t = getTitleBackdrop(s); assert.equal(t.width, 320); assert.equal(t.height, 240); }
  assert.ok(diff(getTitleBackdrop('spring').buffer, getTitleBackdrop('winter').buffer) > 5000);
  assert.equal(ENDING_KEYS.length, 6);
  for (const k of ENDING_KEYS) { const e = getEndingBackdrop(k); assert.equal(e.width, 320); assert.equal(e.height, 240); }
  assert.ok(getLogo().width > 100);
});
