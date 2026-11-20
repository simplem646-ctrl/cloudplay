import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hearts, talk, addFriendship, giftOutcome, giveGift, decay, resetDaily, markMet, prefsFromModules,
} from '../../src/sim/relationships.js';
import { add, count } from '../../src/sim/inventory.js';
import { sleep } from '../../src/sim/clock.js';
import { fresh, named } from './_helpers.mjs';
import { fromAbsDay } from '../../src/sim/calendar.js';

const setAbs = (state, abs) => { const d = fromAbsDay(abs); Object.assign(state.time, { year: d.year, season: d.season, day: d.day, absDay: abs }); };

// injected tastes: tests never depend on src/content
const PREFS = {
  nina: { loves: ['bread'], likes: ['sports_drink'], dislikes: ['rose_red'], hates: ['black_licorice'], lines: {
    loves: [['happy', 'Bread!']], likes: ['Nice.'], neutral: ['Thanks.'], dislikes: ['Uh.'], hates: ['Ew.'], birthday: ['Best birthday gift!'],
  } },
  vera: { loves: ['coffee'], likes: [], dislikes: [], hates: ['plushie_bear'] },
};
const optsWith = (f) => ({ ...f.opts, prefs: PREFS });

test('hearts and addFriendship clamp 0..100 and emit hearts:changed only when hearts change', () => {
  const f = fresh();
  const { state, events, opts } = f;
  assert.equal(hearts(state, 'nina'), 0);
  assert.equal(addFriendship(state, 'nina', 5, opts), 5);
  assert.equal(named(events, 'hearts:changed').length, 0);
  addFriendship(state, 'nina', 7, opts); // 12 -> 1 heart
  const ev = named(events, 'hearts:changed');
  assert.deepEqual(ev[0][1], { npc: 'nina', from: 0, to: 1, points: 12, delta: 7 });
  assert.equal(hearts(state, 'nina'), 1);
  assert.equal(addFriendship(state, 'nina', 500, opts), 88);
  assert.equal(state.relationships.nina.friendship, 100);
  assert.equal(hearts(state, 'nina'), 10);
  assert.equal(addFriendship(state, 'nina', -500, opts), -100);
  assert.equal(state.relationships.nina.friendship, 0);
  assert.equal(addFriendship(state, 'nobody', 5, opts), 0);
  assert.equal(state.relationships.nina.peak, 100, 'peak remembers the best');
  setAbs(state, 12);
  addFriendship(state, 'nina', 1, opts);
  assert.equal(state.relationships.nina.lastContactAbsDay, 12);
  addFriendship(state, 'nina', 1, { ...opts, contact: false });
  assert.equal(state.relationships.nina.lastContactAbsDay, 12);
});

test('talk: first talk of the day +2 and marks met; later talks give nothing', () => {
  const f = fresh({ day: 3 });
  const { state, events, opts } = f;
  assert.equal(state.relationships.jules.met, false);
  const t1 = talk(state, 'jules', opts);
  assert.deepEqual([t1.ok, t1.first, t1.gained, t1.newlyMet], [true, true, 2, true]);
  assert.equal(state.relationships.jules.met, true);
  assert.equal(state.relationships.jules.friendship, 2);
  assert.equal(state.relationships.jules.lastContactAbsDay, 2);
  const t2 = talk(state, 'jules', opts);
  assert.deepEqual([t2.first, t2.gained, t2.newlyMet], [false, 0, false]);
  assert.equal(state.relationships.jules.friendship, 2);
  assert.equal(talk(state, 'nobody', opts).ok, false);
  // new day: first talk counts again
  resetDaily(state);
  assert.equal(talk(state, 'jules', opts).first, true);
  assert.equal(state.relationships.jules.friendship, 4);
  assert.equal(named(events, 'hearts:changed').length, 0);
  for (let i = 0; i < 3; i++) { resetDaily(state); talk(state, 'jules', opts); }
  assert.equal(hearts(state, 'jules'), 1);
  assert.equal(named(events, 'hearts:changed').length, 1);
});

test('giftOutcome: tastes from injected prefs, unknown is neutral', () => {
  assert.equal(giftOutcome('nina', 'bread', PREFS), 'loves');
  assert.equal(giftOutcome('nina', 'sports_drink', PREFS), 'likes');
  assert.equal(giftOutcome('nina', 'rose_red', PREFS), 'dislikes');
  assert.equal(giftOutcome('nina', 'black_licorice', PREFS), 'hates');
  assert.equal(giftOutcome('nina', 'apple', PREFS), 'neutral');
  assert.equal(giftOutcome('mari', 'bread', PREFS), 'neutral');
  assert.equal(giftOutcome('nina', 'bread'), 'neutral');
  assert.equal(giftOutcome('nina', 'bread', { nina: { gift: { loves: ['bread'] } } }), 'loves');
  const mods = { a: { default: { npc: 'x', gift: { loves: ['apple'] } } }, b: { default: [{ npc: 'y' }, { npc: 'z', gift: { hates: ['cookie'] } }] } };
  assert.deepEqual(Object.keys(prefsFromModules(mods)), ['x', 'z']);
  assert.equal(giftOutcome('x', 'apple', prefsFromModules(mods)), 'loves');
});

test('gift points: +8 +4 +1 -3 -6, item consumed, one gift per NPC per day', () => {
  const cases = [['bread', 'loves', 8], ['sports_drink', 'likes', 4], ['apple', 'neutral', 1], ['rose_red', 'dislikes', -3], ['black_licorice', 'hates', -6]];
  for (const [item, kind, delta] of cases) {
    const f = fresh({ day: 3 });
    f.state.relationships.nina.friendship = 40;
    add(f.state, item, 2, f.opts);
    const r = giveGift(f.state, 'nina', item, optsWith(f));
    assert.equal(r.ok, true);
    assert.equal(r.kind, kind);
    assert.equal(r.delta, delta);
    assert.equal(f.state.relationships.nina.friendship, 40 + delta);
    assert.equal(count(f.state, item), 1);
    assert.equal(f.state.relationships.nina.giftedToday, true);
    assert.equal(f.state.relationships.nina.giftsThisWeek, 1);
    assert.equal(f.state.relationships.nina.met, true);
    const again = giveGift(f.state, 'nina', item, optsWith(f));
    assert.deepEqual([again.ok, again.reason], [false, 'already_gifted']);
    assert.equal(count(f.state, item), 1, 'a refused gift does not consume the item');
    assert.equal(named(f.events, 'gift:given').length, 1);
  }
});

test('gift refusals: unknown npc/item, not owned, key items; line selection', () => {
  const f = fresh({ day: 3 });
  const o = optsWith(f);
  assert.equal(giveGift(f.state, 'nobody', 'bread', o).reason, 'unknown_npc');
  assert.equal(giveGift(f.state, 'nina', 'not_an_item', o).reason, 'unknown_item');
  assert.equal(giveGift(f.state, 'nina', 'bread', o).reason, 'no_item');
  add(f.state, 'club_card', 1, f.opts);
  assert.equal(giveGift(f.state, 'nina', 'club_card', o).reason, 'key_item');
  add(f.state, 'bread', 1, f.opts);
  const r = giveGift(f.state, 'nina', 'bread', o);
  assert.equal(r.line, 'Bread!');
  assert.equal(r.lineFace, 'happy');
  assert.deepEqual(r.hearts, { from: 0, to: 0 });
  // no lines in the pool -> no line, still ok
  add(f.state, 'coffee', 1, f.opts);
  const v = giveGift(f.state, 'vera', 'coffee', o);
  assert.equal(v.ok, true);
  assert.equal(v.line, null);
  // weekly cap (off by default, balance override)
  const g = fresh({ day: 3 });
  const capped = { ...optsWith(g), balance: { friendship: { ...{ perHeart: 10, max: 100, talk: 2, gift: { loves: 8, likes: 4, neutral: 1, dislikes: -3, hates: -6 }, birthdayMultiplier: 3, decay: { idleDays: 7, minPeakPoints: 30, everyDays: 3, floor: 20, exempt: [] } }, giftsPerWeekCap: 1 } } };
  g.state.relationships.nina.giftsThisWeek = 1;
  add(g.state, 'bread', 1, g.opts);
  assert.equal(giveGift(g.state, 'nina', 'bread', capped).reason, 'weekly_cap');
});

test('birthday: positive gifts x3 once per year; bad gifts do not use the bonus', () => {
  // Nina's birthday = summer 9 (Thursday... any weekday)
  const f = fresh({ season: 'summer', day: 9 });
  const { state, opts } = f;
  const o = { ...opts, prefs: PREFS };
  add(state, 'bread', 5, opts);
  add(state, 'black_licorice', 1, opts);
  // a bad gift first: -6, no multiplier, birthday bonus still available
  let r = giveGift(state, 'nina', 'black_licorice', o);
  assert.deepEqual([r.delta, r.birthday], [-6, false]);
  assert.equal(state.relationships.nina.birthdayGiftYear, 0);
  resetDaily(state);
  r = giveGift(state, 'nina', 'bread', o);
  assert.deepEqual([r.delta, r.birthday], [24, true]);
  assert.equal(state.relationships.nina.birthdayGiftYear, 1);
  assert.equal(r.line, 'Best birthday gift!');
  // same day, next gift (after the daily flag reset to simulate the test): no second bonus this year
  resetDaily(state);
  r = giveGift(state, 'nina', 'bread', o);
  assert.deepEqual([r.delta, r.birthday], [8, false]);
  // next year's birthday works again
  const g = fresh({ year: 2, season: 'summer', day: 9 });
  g.state.relationships.nina.birthdayGiftYear = 1;
  add(g.state, 'bread', 1, g.opts);
  r = giveGift(g.state, 'nina', 'bread', { ...g.opts, prefs: PREFS });
  assert.deepEqual([r.delta, r.birthday], [24, true]);
  assert.equal(g.state.relationships.nina.birthdayGiftYear, 2);
  // not her birthday: normal
  const h = fresh({ season: 'summer', day: 10 });
  add(h.state, 'bread', 1, h.opts);
  assert.equal(giveGift(h.state, 'nina', 'bread', { ...h.opts, prefs: PREFS }).delta, 8);
});

test('decay: after 7 idle days at >=3 hearts, -1 every 3 days, floor 20, family exempt', () => {
  const f = fresh({ day: 1 });
  const { state, opts } = f;
  const n = state.relationships.nina;
  Object.assign(n, { met: true, friendship: 33, peak: 33, lastContactAbsDay: 0 });
  const timeline = {};
  for (let abs = 1; abs <= 20; abs++) {
    setAbs(state, abs);
    const d = decay(state, opts);
    if (d.length) timeline[abs] = n.friendship;
  }
  // idle 7 -> abs 7, then every 3rd day: 10, 13, 16, 19
  assert.deepEqual(timeline, { 7: 32, 10: 31, 13: 30, 16: 29, 19: 28 });
  // never below the floor, even after a very long absence
  state.relationships.elise = { ...state.relationships.elise, met: true, friendship: 22, peak: 60, lastContactAbsDay: 0 };
  for (let abs = 1; abs <= 80; abs++) { setAbs(state, abs); decay(state, opts); }
  assert.equal(state.relationships.elise.friendship, 20);
  // below 3 hearts at its best: no decay
  state.relationships.mari = { ...state.relationships.mari, met: true, friendship: 25, peak: 25, lastContactAbsDay: 0 };
  setAbs(state, 7);
  assert.ok(!decay(state, opts).some((d) => d.npc === 'mari'));
  assert.equal(state.relationships.mari.friendship, 25);
  // Aunt Roz (family) and unmet NPCs never decay
  state.relationships.roz.lastContactAbsDay = 0;
  state.relationships.clara = { ...state.relationships.clara, met: false, friendship: 50, peak: 50, lastContactAbsDay: 0 };
  assert.ok(!decay(state, opts).some((d) => d.npc === 'roz' || d.npc === 'clara'));
  // contact resets the clock
  setAbs(state, 30);
  n.lastContactAbsDay = 28;
  assert.ok(!decay(state, opts).some((d) => d.npc === 'nina'));
});

test('contact today (talk) prevents decay in the new-day pipeline; markMet is idempotent', () => {
  const f = fresh({ day: 7, minute: 22 * 60 });
  const n = f.state.relationships.nina;
  Object.assign(n, { met: true, friendship: 50, peak: 50, lastContactAbsDay: 6 });
  sleep(f.state, f.opts);
  assert.equal(n.friendship, 50);
  assert.equal(markMet(f.state, 'dante', f.opts), true);
  assert.equal(markMet(f.state, 'dante', f.opts), false);
  assert.equal(markMet(f.state, 'nobody', f.opts), false);
});

test('resetDaily clears flags and the weekly gift counter on Mondays only', () => {
  const f = fresh({ day: 8 }); // Monday
  const r = f.state.relationships.nina;
  Object.assign(r, { talkedToday: true, giftedToday: true, giftsThisWeek: 3 });
  resetDaily(f.state);
  assert.deepEqual([r.talkedToday, r.giftedToday, r.giftsThisWeek], [false, false, 0]);
  const g = fresh({ day: 9 }); // Tuesday
  const q = g.state.relationships.nina;
  Object.assign(q, { talkedToday: true, giftedToday: true, giftsThisWeek: 3 });
  resetDaily(g.state);
  assert.equal(q.giftsThisWeek, 3);
});
