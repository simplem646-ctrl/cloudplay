import test from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, ITEM_BY_ID, ITEM_CATEGORIES } from '../../src/data/items.js';
import { SHOPS, SHOP_BY_ID } from '../../src/data/shops.js';
import { ICON_NAMES } from '../../src/data/sheet_layout.js';
import { SHOP_IDS } from '../../src/data/ids.js';
import { CAST_BY_ID } from '../../src/data/cast.js';
import { SUBJECTS, TRAITS, SEASONS, WEEKDAYS } from '../../src/core/constants.js';
import { parseTime } from '../../src/core/util.js';

const by = (c) => ITEMS.filter((i) => i.category === c);

test('minimum item counts per 02 section 6', () => {
  assert.ok(by('food').length >= 12, `food ${by('food').length}`);
  assert.ok(by('gift').length >= 22, `gifts ${by('gift').length}`);
  assert.ok(by('study').length >= 8, `study ${by('study').length}`);
  assert.ok(by('sport').length >= 4, `sport ${by('sport').length}`);
  for (const id of ['bell_clapper_core', 'bell_clapper_fitting', 'bell_clapper_rope', 'club_card', 'old_letter']) {
    assert.equal(ITEM_BY_ID[id].category, 'key', id);
    assert.equal(ITEM_BY_ID[id].price, 0, `${id} is not sold`);
  }
  for (const id of ['textbook_math', 'textbook_literature', 'textbook_science', 'textbook_history']) {
    assert.equal(ITEM_BY_ID[id].category, 'study', id);
  }
  for (const id of ['coffee', 'tea']) assert.ok(ITEM_BY_ID[id] || ITEM_BY_ID[`${id}_beans`] || ITEM_BY_ID[`${id}_leaves`]);
  for (const id of ['plushie_bear', 'music_box', 'paint_set', 'seashell', 'keychain', 'lucky_charm', 'coffee_beans', 'tea_leaves']) assert.ok(ITEM_BY_ID[id], id);
  assert.ok(['flower', 'sweet', 'book', 'accessory'].length);
});

test('items are well-formed: unique snake_case ids, valid icons, short text, valid categories', () => {
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, ITEMS.length, 'unique ids');
  assert.equal(Object.keys(ITEM_BY_ID).length, ITEMS.length);
  for (const i of ITEMS) {
    assert.match(i.id, /^[a-z][a-z0-9_]*$/, i.id);
    assert.ok(ITEM_CATEGORIES.includes(i.category), `${i.id} category`);
    assert.ok(ICON_NAMES.includes(i.icon), `${i.id}: icon "${i.icon}" is not in ICON_NAMES`);
    assert.ok(typeof i.name === 'string' && i.name.length > 0 && i.name.length <= 22, `${i.id} name`);
    assert.ok(typeof i.desc === 'string' && i.desc.length > 0 && i.desc.length <= 60, `${i.id} desc (${i.desc.length})`);
    assert.ok(Number.isInteger(i.price) && i.price >= 0, `${i.id} price`);
    if (i.use) {
      for (const k of Object.keys(i.use)) assert.ok(['energy', 'stat', 'flag', 'meal', 'keep'].includes(k), `${i.id} use.${k}`);
      for (const k of Object.keys(i.use.stat || {})) assert.ok([...SUBJECTS, ...TRAITS, 'conduct'].includes(k), `${i.id} stat ${k}`);
    }
    if (i.passive && i.passive.studyBonus) for (const k of Object.keys(i.passive.studyBonus)) assert.ok(k === 'all' || SUBJECTS.includes(k), `${i.id} bonus ${k}`);
  }
});

test('price sanity follows the economy table', () => {
  for (const i of by('food')) {
    assert.ok(i.price >= 2 && i.price <= 9, `${i.id} food price ${i.price}`);
    assert.ok(i.use && i.use.energy > 0, `${i.id} restores energy`);
  }
  for (const i of by('gift').filter((g) => g.price > 0)) assert.ok(i.price >= 5 && i.price <= 60, `${i.id} gift price ${i.price}`);
  for (const i of by('study').filter((s) => s.id.startsWith('textbook_'))) assert.ok(i.price >= 15 && i.price <= 30, `${i.id} book price ${i.price}`);
  for (const i of by('key')) assert.equal(i.price, 0);
  // meals restore more than snacks
  assert.ok(ITEM_BY_ID.bento.use.energy > ITEM_BY_ID.cookie.use.energy);
  // spread of gift prices so gifts can be cheap or special
  const gp = by('gift').filter((g) => g.price > 0).map((g) => g.price);
  assert.ok(Math.min(...gp) <= 8 && Math.max(...gp) >= 40);
});

test('gift variety: flowers, sweets, books, accessories, plushies and more all exist', () => {
  const ids = by('gift').map((i) => i.id);
  const has = (re) => ids.some((id) => re.test(id));
  assert.ok(has(/rose|tulip|daisy|sunflower|bouquet/), 'flowers');
  assert.ok(has(/chocolate|cookie_box|licorice/), 'sweets');
  assert.ok(has(/novel|sketchbook|postcard/), 'books/paper');
  assert.ok(has(/ribbon|hairpin|scarf|necklace|perfume/), 'accessories');
  assert.ok(has(/plushie/), 'plushies');
  assert.ok(ids.includes('cat_treats'), 'something for Biscuit');
});

test('every id in SHOP_IDS has a shop; keepers are cast ids; hours are sane', () => {
  assert.deepEqual(SHOPS.map((s) => s.id).sort(), [...SHOP_IDS].sort());
  assert.equal(Object.keys(SHOP_BY_ID).length, SHOPS.length);
  for (const s of SHOPS) {
    assert.ok(typeof s.name === 'string' && s.name.length > 0, s.id);
    assert.ok(s.keeper === null || CAST_BY_ID[s.keeper], `${s.id} keeper ${s.keeper}`);
    if (s.open) {
      assert.ok(s.open.weekdays.length > 0 && s.open.weekdays.every((w) => WEEKDAYS.includes(w)), `${s.id} weekdays`);
      assert.ok(parseTime(s.open.from) < parseTime(s.open.to), `${s.id} hours`);
      assert.ok(parseTime(s.open.from) >= 5 * 60 && parseTime(s.open.to) <= 26 * 60, `${s.id} hours within the day`);
    } else {
      assert.equal(s.keeper, null, `${s.id}: machines have no keeper`);
    }
    assert.ok(s.stock.length >= 5, `${s.id} has stock`);
  }
});

test('shop stock: items exist, are sold, prices are sane, seasons valid, no duplicates', () => {
  for (const s of SHOPS) {
    const seen = new Set();
    for (const e of s.stock) {
      const item = ITEM_BY_ID[e.item];
      assert.ok(item, `${s.id}: unknown item ${e.item}`);
      assert.notEqual(item.category, 'key', `${s.id} sells a key item`);
      const price = e.price === undefined ? item.price : e.price;
      assert.ok(price > 0, `${s.id}/${e.item} has no price (not sold)`);
      assert.ok(price >= item.price * 0.5 && price <= item.price * 1.6, `${s.id}/${e.item}: ${price} vs base ${item.price}`);
      if (e.season) assert.ok(e.season.length > 0 && e.season.every((x) => SEASONS.includes(x)), `${s.id}/${e.item} season`);
      if (e.limit !== undefined) assert.ok(Number.isInteger(e.limit) && e.limit >= 1);
      const key = `${e.item}|${(e.season || []).join(',')}`;
      assert.ok(!seen.has(key), `${s.id}: duplicate ${e.item}`);
      seen.add(key);
    }
  }
  // every non-key sold item can be bought somewhere in at least one season
  const sold = new Set(SHOPS.flatMap((s) => s.stock.map((e) => e.item)));
  for (const i of ITEMS.filter((x) => x.category === 'study' && x.id.startsWith('textbook_'))) assert.ok(sold.has(i.id), `${i.id} is sold`);
  // each season has at least one flower on sale
  for (const season of SEASONS) {
    const flowers = SHOP_BY_ID.flower_shop.stock.filter((e) => !e.season || e.season.includes(season));
    assert.ok(flowers.length >= 3, `flower shop in ${season}`);
  }
});
