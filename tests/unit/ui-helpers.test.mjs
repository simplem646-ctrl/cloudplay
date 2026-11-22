import test from 'node:test';
import assert from 'node:assert/strict';
import { AREAS } from '../../src/core/registry.js';
import { heartsFor, paginate, calendarGrid, birthdaysIn, festivalsIn, sellPrice, isUsable, forageIds, mapAreaFor, fmtNum } from '../../src/ui/helpers.js';
import { validateName, SWATCHES } from '../../src/ui/title.js';
import { DEFAULT_LOOK } from '../../src/core/state.js';

test('heartsFor: 100 affinity per heart, half hearts, capped at 10', () => {
  assert.deepEqual(heartsFor(0), { full: 0, half: false, hearts: 0 });
  assert.equal(heartsFor(250).full, 2);
  assert.equal(heartsFor(250).half, true);
  assert.equal(heartsFor(99).full, 0);
  assert.equal(heartsFor(1000).full, 10);
  assert.equal(heartsFor(5000).hearts, 10);
  assert.equal(heartsFor(-5).full, 0);
  assert.equal(heartsFor(undefined).full, 0);
});

test('paginate: short text is one page, long text splits and keeps all words', () => {
  assert.deepEqual(paginate(['a', 'b']), [['a', 'b']]);
  const long = Array.from({ length: 12 }, (_, i) => `Paragraph number ${i} with a few words in it to take space.`);
  const pages = paginate(long, 200);
  assert.ok(pages.length > 2);
  assert.equal(pages.flat().join(' '), long.join(' '));
  const huge = 'word '.repeat(300).trim();
  const p2 = paginate([huge], 120);
  assert.ok(p2.length > 5);
  assert.equal(p2.flat().join(' ').replace(/\s+/g, ' '), huge);
  assert.deepEqual(paginate([]), [['']]);
});

test('calendarGrid: 4 weeks x Mon..Sun, days 1..28', () => {
  const g = calendarGrid();
  assert.equal(g.length, 4);
  assert.ok(g.every((r) => r.length === 7));
  assert.equal(g[0][0].weekday, 'mon');
  assert.equal(g[3][6].day, 28);
  assert.equal(g[3][6].weekday, 'sun');
});

test('birthdays and festivals by season', () => {
  const npcs = { a: { id: 'a', name: 'A', birthday: { season: 'summer', day: 5 } }, b: { id: 'b', name: 'B', birthday: { season: 'spring', day: 2 } }, c: { id: 'c', birthday: null }, d: { id: 'd', name: 'D', birthday: { season: 'summer', day: 1 } } };
  assert.deepEqual(birthdaysIn(1, npcs).map((x) => x.npc), ['d', 'a']);
  assert.deepEqual(birthdaysIn(2, npcs), []);
  assert.deepEqual(birthdaysIn(0, [npcs.b]).map((x) => x.day), [2]);
  const f = { x: { id: 'x', name: 'X Fair', date: { season: 'winter', day: 28 } }, y: { id: 'y', date: { season: 'winter', day: 14 } } };
  assert.deepEqual(festivalsIn(3, f).map((x) => x.id), ['y', 'x']);
  assert.deepEqual(festivalsIn(0, f), []);
  assert.deepEqual(festivalsIn(0, undefined), []);
});

test('price / usable helpers tolerate sparse data', () => {
  assert.equal(sellPrice(null), 0);
  assert.equal(sellPrice({ price: { sell: 12 } }), 12);
  assert.equal(sellPrice({ price: { sell: null } }), 0);
  assert.equal(isUsable({ category: 'food' }), true);
  assert.equal(isUsable({ category: 'food', key: true }), false);
  assert.equal(isUsable({ category: 'misc', energy: 10 }), true);
  assert.equal(isUsable(undefined), false);
});

test('forageIds walks ForageTbl', () => {
  const t = { a: { spring: [{ item: 'x', weight: 1 }, { item: null, weight: 2 }], summer: [{ item: 'y', weight: 1 }] }, b: { winter: [{ item: 'x', weight: 3 }] } };
  assert.deepEqual(forageIds(t).sort(), ['x', 'y']);
  assert.deepEqual(forageIds(null), []);
});

test('mapAreaFor maps interiors to their exterior neighbour', () => {
  assert.equal(mapAreaFor('bakery', AREAS), 'town_square');
  assert.equal(mapAreaFor('harbor', AREAS), 'harbor');
  assert.equal(mapAreaFor('fishing_hut', AREAS), 'harbor');
  assert.equal(mapAreaFor('nowhere', AREAS), null);
  for (const [id, a] of Object.entries(AREAS)) assert.equal(AREAS[mapAreaFor(id, AREAS)].kind, 'exterior', id);
});

test('fmtNum adds thousands separators', () => {
  assert.equal(fmtNum(1234567), '1,234,567');
  assert.equal(fmtNum('12'), '12');
  assert.equal(fmtNum(undefined), '0');
});

test('validateName enforces 1..10 characters', () => {
  assert.equal(validateName('Kai').ok, true);
  assert.equal(validateName('  Kai  ').name, 'Kai');
  assert.equal(validateName('').ok, false);
  assert.equal(validateName('   ').ok, false);
  assert.equal(validateName('abcdefghij').ok, true);
  const long = validateName('abcdefghijk');
  assert.equal(long.ok, false);
  assert.equal(long.name.length, 10);
});

test('swatches: 6 each and include the default look', () => {
  for (const k of ['hair', 'jacket', 'scarf']) {
    assert.equal(SWATCHES[k].length, 6);
    assert.ok(SWATCHES[k].includes(DEFAULT_LOOK[k]), k);
  }
});
