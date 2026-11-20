import test from 'node:test';
import assert from 'node:assert/strict';
import { isOpen, list, buy, priceOf, hoursLabel, boughtToday } from '../../src/sim/shop.js';
import { count, add } from '../../src/sim/inventory.js';
import { ITEMS } from '../../src/data/items.js';
import { sleep } from '../../src/sim/clock.js';
import { fresh, named } from './_helpers.mjs';

// Spring 2 is a Tuesday school day; Spring 7 is Sunday.
const tue = (extra = {}) => fresh({ season: 'spring', day: 2, minute: 12 * 60, ...extra });

test('isOpen: hours, weekdays, school days, always-open machines, unknown shops', () => {
  const { state } = tue();
  assert.equal(isOpen(state, 'bakery'), true);
  assert.equal(isOpen(state, 'bakery', { minute: '05:59' }), false);
  assert.equal(isOpen(state, 'bakery', { minute: '06:00' }), true);
  assert.equal(isOpen(state, 'bakery', { minute: 17 * 60 }), false, 'closing time is exclusive');
  assert.equal(isOpen(state, 'vending_town', { minute: 3 * 60 }), true);
  assert.equal(isOpen(state, 'corner_mart', { minute: 25 * 60 }), true, 'open past midnight');
  assert.equal(isOpen(state, 'cafeteria_lunch'), true);
  assert.equal(isOpen(state, 'cafeteria_lunch', { minute: '14:00' }), false);
  assert.equal(isOpen(state, 'nope'), false);
  // Sunday: bakery shut, cafe open, cafeteria shut
  const sun = fresh({ season: 'spring', day: 7, minute: 12 * 60 }).state;
  assert.equal(isOpen(sun, 'bakery'), false);
  assert.equal(isOpen(sun, 'cafe_menu'), true);
  assert.equal(isOpen(sun, 'cafeteria_lunch'), false);
  // school break (a weekday without lessons): cafeteria shut even in its hours
  const brk = fresh({ season: 'summer', day: 16, minute: 12 * 60 + 30 }).state;
  assert.equal(isOpen(brk, 'cafeteria_lunch'), false);
  assert.equal(isOpen(brk, 'bakery'), true);
  assert.equal(hoursLabel('vending_school'), 'Always open');
  assert.equal(hoursLabel('bakery'), '06:00-17:00');
});

test('list: season-filtered stock with prices, limits and affordability', () => {
  const { state } = tue();
  const spring = list(state, 'flower_shop').map((r) => r.item);
  assert.ok(spring.includes('tulip_pink'));
  assert.ok(!spring.includes('sunflower'));
  const winter = fresh({ season: 'winter', day: 2 }).state;
  assert.ok(!list(winter, 'flower_shop').some((r) => r.item === 'tulip_pink'));
  assert.ok(list(winter, 'cafe_menu').some((r) => r.item === 'hot_cocoa'));
  assert.ok(!list(state, 'cafe_menu').some((r) => r.item === 'hot_cocoa'));
  const row = list(state, 'bakery').find((r) => r.item === 'bread');
  assert.equal(row.price, 3);
  assert.equal(row.affordable, true);
  assert.equal(row.remaining, Infinity);
  assert.equal(list(state, 'nope').length, 0);
  assert.equal(priceOf(state, 'cafe_menu', 'coffee'), 4, 'shop price overrides the item price');
  assert.equal(priceOf(state, 'bakery', 'rose_red'), null);
  state.player.money = 2;
  assert.equal(list(state, 'bakery').find((r) => r.item === 'bread').affordable, false);
});

test('buy: money, stock, hours, season, capacity, events', () => {
  const { state, events, opts } = tue();
  const r = buy(state, 'bakery', 'bread', 2, opts);
  assert.deepEqual([r.ok, r.bought, r.spent, r.total], [true, 2, 6, 294]);
  assert.equal(state.player.money, 294);
  assert.equal(count(state, 'bread'), 2);
  assert.deepEqual(named(events, 'money:changed')[0][1], { delta: -6, total: 294 });
  assert.equal(named(events, 'item:gained').length, 1);
  // refusals never change state
  const snap = JSON.stringify(state);
  assert.equal(buy(state, 'nope', 'bread', 1, opts).reason, 'unknown_shop');
  assert.equal(buy(state, 'bakery', 'rose_red', 1, opts).reason, 'not_stocked');
  assert.equal(buy(state, 'bakery', 'bread', 0, opts).reason, 'bad_qty');
  assert.equal(buy(state, 'bakery', 'bread', 1, { ...opts, minute: '03:00' }).reason, 'closed');
  assert.equal(buy(state, 'flower_shop', 'sunflower', 1, opts).reason, 'out_of_season');
  assert.equal(buy(state, 'bakery', 'cake_slice', 99, opts).reason, 'money');
  assert.equal(JSON.stringify(state), snap);
  // exact money works, one short does not
  state.player.money = 5;
  assert.equal(buy(state, 'bakery', 'bread', 2, opts).reason, 'money');
  assert.equal(buy(state, 'bakery', 'sweet_bun', 1, opts).ok, true);
  assert.equal(state.player.money, 2);
  assert.equal(buy(state, 'bakery', 'cookie', 1, opts).ok, true);
  assert.equal(state.player.money, 0);
});

test('buy: bag capacity (30 stacks) refuses without charging', () => {
  const { state, opts } = tue();
  const ids = ITEMS.map((i) => i.id).filter((id) => !['bread', 'cookie'].includes(id)).slice(0, 30);
  for (const id of ids) add(state, id, 1, opts);
  assert.equal(buy(state, 'bakery', 'bread', 1, opts).reason, 'full');
  assert.equal(state.player.money, 300);
  // an existing stack still takes more
  assert.ok(state.inventory.sweet_bun, 'sweet_bun is one of the 30 stacks');
  assert.equal(buy(state, 'bakery', 'sweet_bun', 1, opts).ok, true);
  assert.equal(state.player.money, 297);
});

test('buy: daily limits count per shop+item and reset at the new day', () => {
  const { state, opts } = tue();
  assert.equal(buy(state, 'cafeteria_lunch', 'bento', 2, opts).ok, true);
  assert.equal(boughtToday(state, 'cafeteria_lunch', 'bento'), 2);
  const r = buy(state, 'cafeteria_lunch', 'bento', 1, opts);
  assert.deepEqual([r.ok, r.reason], [false, 'limit']);
  assert.equal(list(state, 'cafeteria_lunch').find((x) => x.item === 'bento').soldOut, true);
  assert.equal(buy(state, 'corner_mart', 'energy_drink', 1, { ...opts, minute: 600 }).ok, true, 'a different shop has its own counter');
  assert.equal(buy(state, 'cafeteria_lunch', 'curry_plate', 1, opts).ok, true);
  // asking for more than the remaining limit at once is refused as a whole
  assert.equal(buy(state, 'cafeteria_lunch', 'curry_plate', 2, opts).reason, 'limit');
  // next morning the limits are back
  state.time.minute = 22 * 60;
  sleep(state, opts);
  state.time.minute = 12 * 60 + 30;
  assert.equal(state.time.day, 3);
  assert.equal(buy(state, 'cafeteria_lunch', 'bento', 2, opts).ok, true);
});

test('buy with eatNow eats immediately (vending machine) and marks the meal', () => {
  const { state, opts } = tue();
  state.player.energy = 40;
  const r = buy(state, 'cafeteria_lunch', 'bento', 1, { ...opts, eatNow: true });
  assert.equal(r.ok, true);
  assert.equal(count(state, 'bento'), 0);
  assert.equal(state.player.energy, 68);
  assert.equal(state.daily.ate.lunch, true);
});
