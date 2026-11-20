import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS } from '../../src/data/items.js';
import {
  add, remove, count, has, use, list, canAdd, room, isFull, stackCount, studyBonus, practiceBonus,
} from '../../src/sim/inventory.js';
import { addEnergy, addStat, addMoney, setFlag, maxEnergyFor, trackSubjects, decaySubjects } from '../../src/sim/player.js';
import { fresh, named } from './_helpers.mjs';

test('add/remove/count/has with events', () => {
  const { state, events, opts } = fresh();
  assert.equal(add(state, 'bread', 3, opts), 3);
  assert.equal(count(state, 'bread'), 3);
  assert.equal(has(state, 'bread', 3), true);
  assert.equal(has(state, 'bread', 4), false);
  assert.deepEqual(named(events, 'item:gained')[0][1], { item: 'bread', qty: 3 });
  assert.equal(remove(state, 'bread', 5, opts), false, 'all or nothing');
  assert.equal(count(state, 'bread'), 3);
  assert.equal(remove(state, 'bread', 2, opts), true);
  assert.equal(remove(state, 'bread', 1, opts), true);
  assert.equal(state.inventory.bread, undefined, 'empty stacks disappear');
  assert.equal(add(state, 'nope', 1, opts), 0, 'unknown item');
  assert.equal(add(state, 'bread', 0, opts), 0);
  assert.equal(add(state, 'bread', -2, opts), 0);
  assert.equal(remove(state, 'bread', 0, opts), false);
});

test('capacity: 30 stacks, 99 per stack, partial adds', () => {
  const { state, opts } = fresh();
  const ids = ITEMS.map((i) => i.id).slice(0, 31);
  for (let i = 0; i < 30; i++) assert.equal(add(state, ids[i], 1, opts), 1);
  assert.equal(stackCount(state), 30);
  assert.equal(isFull(state), true);
  assert.equal(add(state, ids[30], 1, opts), 0, 'a 31st stack does not fit');
  assert.equal(canAdd(state, ids[30], 1), false);
  assert.equal(add(state, ids[0], 5, opts), 5, 'existing stacks still grow');
  assert.equal(count(state, ids[0]), 6);
  assert.equal(add(state, ids[0], 500, opts), 93, 'partial add up to 99');
  assert.equal(count(state, ids[0]), 99);
  assert.equal(room(state, ids[0]), 0);
  assert.equal(add(state, ids[0], 1, opts), 0);
  remove(state, ids[5], 1, opts);
  assert.equal(isFull(state), false);
  assert.equal(add(state, ids[30], 1, opts), 1, 'a freed stack makes room');
  // balance override
  const f = fresh();
  const small = { ...f.opts, balance: { inventory: { maxStacks: 2, maxStack: 3 } } };
  assert.equal(add(f.state, 'bread', 9, small), 3);
  assert.equal(add(f.state, 'apple', 1, small), 1);
  assert.equal(add(f.state, 'cookie', 1, small), 0);
});

test('use: food restores energy (clamped), consumes one, marks meals by time of day', () => {
  const { state, events, opts } = fresh({ minute: 7 * 60 });
  state.player.energy = 50;
  add(state, 'bento', 3, opts);
  const r = use(state, 'bento', opts);
  assert.equal(r.ok, true);
  assert.equal(r.consumed, true);
  assert.equal(r.effects.energy, 28);
  assert.equal(state.player.energy, 78);
  assert.equal(count(state, 'bento'), 2);
  assert.equal(r.effects.meal, 'breakfast');
  assert.equal(state.daily.ate.breakfast, true);
  state.time.minute = 12 * 60 + 30;
  assert.equal(use(state, 'bento', opts).effects.meal, 'lunch');
  state.time.minute = 19 * 60;
  assert.equal(use(state, 'bento', opts).effects.meal, 'dinner');
  assert.deepEqual(state.daily.ate, { breakfast: true, lunch: true, dinner: true });
  // clamp at max, snack does not count as a meal
  state.player.energy = 99;
  add(state, 'apple', 1, opts);
  assert.equal(use(state, 'apple', opts).effects.energy, 1);
  assert.equal(use(state, 'apple', opts).reason, 'no_item');
  assert.ok(named(events, 'energy:changed').length >= 1);
});

test('use: stat gains with diminishing returns above 70, flags, keep, refusals', () => {
  const { state, opts } = fresh();
  add(state, 'flashcards', 2, opts);
  const r = use(state, 'flashcards', opts);
  assert.deepEqual(r.effects.stats, { history: 3, literature: 2 });
  assert.equal(state.player.subjects.history, 13);
  state.player.subjects.history = 80;
  const r2 = use(state, 'flashcards', opts);
  assert.equal(r2.effects.stats.history, 2, '3 * 0.6 rounds to 2');
  assert.equal(state.player.subjects.history, 82);
  // reusable item keeps its stack
  add(state, 'water_bottle', 1, opts);
  state.player.energy = 10;
  const w = use(state, 'water_bottle', opts);
  assert.equal(w.consumed, false);
  assert.equal(count(state, 'water_bottle'), 1);
  // refusals
  assert.equal(use(state, 'bread', opts).reason, 'no_item');
  add(state, 'textbook_math', 1, opts);
  assert.equal(use(state, 'textbook_math', opts).reason, 'not_usable');
  assert.equal(use(state, 'nope', opts).reason, 'unknown_item');
  assert.equal(count(state, 'textbook_math'), 1);
});

test('use: flag effects set a flag and emit flag:set (custom item)', async () => {
  const { ITEM_BY_ID } = await import('../../src/data/items.js');
  const { state, opts } = fresh();
  const events = [];
  opts.bus.on('flag:set', (p) => events.push(p));
  ITEM_BY_ID.__test_letter = { id: '__test_letter', name: 'T', category: 'key', price: 0, icon: 'letter', desc: 'x', use: { flag: 'main_test_read', keep: true } };
  try {
    state.inventory.__test_letter = 1;
    const r = use(state, '__test_letter', opts);
    assert.equal(r.effects.flag, 'main_test_read');
    assert.equal(state.flags.main_test_read, true);
    assert.deepEqual(events, [{ name: 'main_test_read', value: true }]);
  } finally {
    delete ITEM_BY_ID.__test_letter;
  }
});

test('list sorts by category then name; study/practice bonuses are capped and passive', () => {
  const { state, opts } = fresh();
  for (const id of ['textbook_math', 'bread', 'rose_red', 'apple', 'sneakers', 'club_card']) add(state, id, 1, opts);
  assert.deepEqual(list(state).map((e) => e.id), ['apple', 'bread', 'rose_red', 'textbook_math', 'sneakers', 'club_card']);
  assert.deepEqual(list(state, 'food').map((e) => e.id), ['apple', 'bread']);
  assert.equal(studyBonus(state, 'math'), 1);
  assert.equal(studyBonus(state, 'history'), 0);
  add(state, 'notebook', 1, opts);
  assert.equal(studyBonus(state, 'math'), 2);
  add(state, 'calculator', 1, opts);
  assert.equal(studyBonus(state, 'math'), 2, 'capped at balance.stats.bookBonusMax');
  assert.equal(studyBonus(state, 'nonsense'), 0);
  assert.equal(practiceBonus(state), 1);
});

test('player helpers: energy/money clamp and events, stat diminishing returns, max energy from fitness', () => {
  const { state, events, opts } = fresh();
  assert.equal(addEnergy(state, 50, opts), 0);
  assert.equal(addEnergy(state, -130, opts), -100);
  assert.equal(state.player.energy, 0);
  assert.equal(addMoney(state, -999, opts), -300);
  assert.equal(state.player.money, 0);
  assert.deepEqual(named(events, 'money:changed')[0][1], { delta: -300, total: 0 });
  assert.equal(addStat(state, 'charm', 5, opts), 5);
  assert.equal(addStat(state, 'conduct', 50, opts), 20, 'clamped at 100');
  assert.equal(addStat(state, 'nonsense', 5, opts), 0);
  assert.equal(setFlag(state, 'a_b', 1, opts), true);
  assert.equal(setFlag(state, 'a_b', 1, opts), false);
  state.player.traits.fitness = 25;
  assert.equal(maxEnergyFor(state), 101);
  addStat(state, 'fitness', 20, opts);
  assert.equal(state.player.maxEnergy, 103);
});

test('knowledge decay: -1 per week after 21 untouched days, floor 10, gains reset the clock', () => {
  const { state, opts } = fresh();
  state.player.subjects.math = 40;
  state.player.subjects.art = 12;
  trackSubjects(state, 0);
  assert.deepEqual(decaySubjects(state, 14, opts), []);
  const d = decaySubjects(state, 21, opts).map((x) => x.subject);
  assert.ok(d.includes('math') && d.includes('art'));
  assert.equal(state.player.subjects.math, 39);
  decaySubjects(state, 28, opts);
  decaySubjects(state, 35, opts);
  assert.equal(state.player.subjects.art, 10, 'floor 10');
  // a gain (from anywhere) counts as touched
  state.player.subjects.math += 5;
  trackSubjects(state, 40);
  assert.ok(!decaySubjects(state, 49, opts).some((x) => x.subject === 'math'));
  assert.ok(decaySubjects(state, 61, opts).some((x) => x.subject === 'math'));
});
