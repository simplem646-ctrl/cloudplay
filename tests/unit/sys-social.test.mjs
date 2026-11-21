import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, setDate, svc, Game } from './fixtures/sys-data.mjs';
import { EVT } from '../../src/core/events.js';
import { dayNumber } from '../../src/core/util.js';

const record = (evt) => {
  const got = [];
  Game.bus.on(evt, (p) => got.push(p));
  return got;
};
const give = async (npc, id) => {
  svc.inventory.add(id, 1, { silent: true });
  const slot = Game.state.inventory.slots.findIndex((s) => s?.id === id);
  Game.ui.answers.pickItem.push(slot);
  return svc.rel.giftFlow(npc);
};

// ---------- relationships ----------
test('rel: talk gives +12 once per day, intro on first meeting, met flag', async () => {
  setup();
  const aff = record(EVT.AFFECTION_CHANGE);
  const talks = record(EVT.NPC_TALK);
  await svc.rel.talk('mira');
  assert.equal(svc.rel.met('mira'), true);
  assert.equal(Game.state.flags.met_mira, true);
  assert.equal(Game.ui.of('say')[0].text, 'Hi, I am Mira!');
  assert.equal(svc.rel.aff('mira'), 12);
  await svc.rel.talk('mira');
  assert.equal(svc.rel.aff('mira'), 12);
  assert.equal(aff.length, 1);
  assert.equal(talks.length, 2);
  svc.clock.rollDay();
  await svc.rel.talk('mira');
  assert.equal(svc.rel.aff('mira'), 24);
});

test('rel: talk picks seeded entries, filters by when, never the same twice in a row, runs after', async () => {
  setup();
  svc.rel.meet('mira');
  const seen = [];
  for (let i = 0; i < 8; i++) {
    Game.ui.calls.length = 0;
    await svc.rel.talk('mira');
    seen.push(Game.state.rel.mira.seen._last);
    assert.ok(!Game.ui.of('say').some((s) => s.text === 'Gated line'));
  }
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1]);
  assert.deepEqual([...new Set(seen)].sort(), ['t1', 't2']);
  Game.state.flags.only_flag = true;
  const seen2 = new Set();
  for (let i = 0; i < 30; i++) {
    await svc.rel.talk('mira');
    seen2.add(Game.state.rel.mira.seen._last);
  }
  assert.ok(seen2.has('t3'));
  assert.equal(Game.state.flags.after_ran, true);
  // expr tuples are passed through
  Game.ui.calls.length = 0;
  Game.state.flags.only_flag = false;
  Game.state.rel.mira.seen._last = 't2';
  await svc.rel.talk('mira');
  assert.deepEqual(Game.ui.of('say').map((s) => [s.text, s.expr]), [['Line one', undefined], ['Line two', 'happy']]);
});

test('rel: birthday talk is worth more', async () => {
  setup();
  svc.rel.meet('mira');
  setDate('spring', 12);
  await svc.rel.talk('mira');
  assert.equal(svc.rel.aff('mira'), 36);
});

test('rel: hearts, heart-up toast and sfx, clamp', () => {
  setup();
  svc.rel.addAff('mira', 99);
  assert.equal(svc.rel.hearts('mira'), 0);
  svc.rel.addAff('mira', 1);
  assert.equal(svc.rel.hearts('mira'), 1);
  assert.ok(Game.ui.toasts().some((t) => /Mira ♥ 1/.test(t)));
  assert.ok(Game.audio.calls.some((c) => c[1] === 'heart_up'));
  svc.rel.addAff('mira', 5000);
  assert.equal(svc.rel.aff('mira'), 1000);
  assert.equal(svc.rel.hearts('mira'), 10);
  svc.rel.addAff('mira', -5000);
  assert.equal(svc.rel.aff('mira'), 0);
});

test('rel: gift preference by id then tag, love > like > dislike > hate', () => {
  setup();
  const p = (n, i) => svc.rel.preference(n, i);
  assert.equal(p('mira', 'cookie'), 'love'); // by id
  assert.equal(p('mira', 'rose'), 'like'); // by tag
  assert.equal(p('mira', 'rock'), 'dislike');
  assert.equal(p('mira', 'eel'), 'hate');
  assert.equal(p('mira', 'plain'), 'neutral');
  // willa: loves flower tag but hates flower tag too: love wins; rose liked by id but tag love wins? id first within level order
  assert.equal(p('willa', 'rose'), 'like'); // id match (like) is found before tag match (love)... level order checks ids for all levels first
  assert.equal(p('willa', 'tulip'), 'love');
  assert.equal(p('gus', 'eel'), 'like');
});

test('rel: gift flow applies deltas, consumes, logs, once per day', async () => {
  setup();
  svc.rel.meet('mira');
  let r = await give('mira', 'cookie');
  assert.equal(r.reaction, 'love');
  assert.equal(svc.rel.aff('mira'), 80);
  assert.equal(svc.inventory.count('cookie'), 0);
  assert.equal(Game.state.log.gifts.mira.cookie, 1);
  assert.equal(Game.ui.of('say').at(-1).text, 'Love it!');
  // second gift same day: polite refusal, item kept
  svc.inventory.add('rose', 1, { silent: true });
  r = await svc.rel.giftFlow('mira'); // refused before the picker opens
  assert.equal(Game.ui.of('pickItem').length, 1);
  assert.equal(r, null);
  assert.equal(Game.ui.of('say').at(-1).text, 'Already gave.');
  assert.equal(svc.inventory.count('rose'), 1);
  assert.equal(svc.rel.aff('mira'), 80);
  // cancel picker
  svc.clock.rollDay();
  Game.ui.answers.pickItem.push(null);
  assert.equal(await svc.rel.giftFlow('mira'), null);
  // dislike / hate
  r = await give('mira', 'rock');
  assert.equal(svc.rel.aff('mira'), 60);
  svc.clock.rollDay();
  r = await give('mira', 'eel');
  assert.equal(r.reaction, 'hate');
  assert.equal(svc.rel.aff('mira'), 0);
  for (let i = 0; i < 7; i++) svc.clock.rollDay(); // new week (soft cap not hit)
  Game.state.rel.mira.talkedDay = dayNumber(Game.state.time);
  r = await give('mira', 'plain');
  assert.equal(svc.rel.aff('mira'), 20);
  svc.clock.rollDay();
  r = await give('mira', 'rose');
  assert.equal(svc.rel.aff('mira'), 65);
});

test('rel: key items cannot be picked as gifts (filter)', async () => {
  setup();
  svc.rel.meet('mira');
  svc.inventory.add('cottage_key', 1, { silent: true });
  svc.inventory.add('bread', 1, { silent: true });
  Game.ui.answers.pickItem.push(null);
  await svc.rel.giftFlow('mira');
  const filter = Game.ui.of('pickItem')[0].filter;
  assert.equal(filter(Game.state.inventory.slots[0]), false);
  assert.equal(filter(Game.state.inventory.slots[1]), true);
});

test('rel: birthday multiplies love/like x3 with birthday line', async () => {
  setup();
  svc.rel.meet('mira');
  setDate('spring', 12);
  const r = await give('mira', 'cookie');
  assert.equal(r.birthday, true);
  assert.equal(svc.rel.aff('mira'), 240);
  assert.equal(Game.ui.of('say').at(-1).text, 'Birthday!');
  svc.clock.set({ day: 13 });
  svc.clock.set({ day: 12 });
  // neutral on birthday is not multiplied
  Game.state.rel.mira.giftDay = -1;
  Game.state.rel.mira.aff = 0;
  await give('mira', 'plain');
  assert.equal(svc.rel.aff('mira'), 20);
});

test('rel: weekly soft cap gives +0 with the polite line', async () => {
  setup();
  svc.rel.meet('mira');
  setDate('spring', 1); // week 0: days 1..7
  const gains = [];
  for (let i = 0; i < 4; i++) {
    const r = await give('mira', 'cookie');
    gains.push(r.delta);
    svc.clock.set({ day: Game.state.time.day + 1 });
  }
  assert.deepEqual(gains, [80, 80, 80, 0]);
  assert.match(Game.ui.of('say').at(-1).text, /generous/);
  assert.equal(svc.inventory.count('cookie'), 0); // still consumed
  // new week resets
  svc.clock.set({ day: 8 });
  const r = await give('mira', 'cookie');
  assert.equal(r.delta, 80);
});

test('rel: heart floor and partial decay after 3 idle days', () => {
  setup();
  svc.rel.meet('mira');
  Game.state.rel.mira.aff = 250;
  Game.state.rel.mira.talkedDay = dayNumber(Game.state.time);
  for (let i = 0; i < 2; i++) svc.clock.rollDay();
  assert.equal(svc.rel.aff('mira'), 250); // 2 days: nothing
  svc.clock.rollDay();
  assert.equal(svc.rel.aff('mira'), 248);
  for (let i = 0; i < 100; i++) svc.clock.rollDay();
  assert.equal(svc.rel.aff('mira'), 200); // never below the reached heart
  assert.equal(svc.rel.hearts('mira'), 2);
  // unmet NPCs never decay
  Game.state.rel.theo.aff = 55;
  svc.clock.rollDay();
  assert.equal(svc.rel.aff('theo'), 55);
});

test('rel: dating derives from flag, only one partner', () => {
  setup();
  assert.equal(svc.rel.status('mira'), 'none');
  assert.equal(svc.rel.canRomance('mira'), true);
  assert.equal(svc.rel.setDating('mira'), true);
  assert.equal(svc.rel.status('mira'), 'dating');
  assert.equal(Game.state.rel.mira.status, 'dating');
  assert.equal(Game.state.flags.mira_dating, true);
  assert.equal(svc.rel.partner(), 'mira');
  assert.equal(svc.rel.canRomance('willa'), false);
  assert.equal(svc.rel.setDating('willa'), false);
  // a script setting the second flag directly is reverted
  Game.bus.emit(EVT.FLAG_SET, { name: 'willa_dating', value: true });
  Game.state.flags.willa_dating = true;
  Game.bus.emit(EVT.FLAG_SET, { name: 'willa_dating', value: true });
  assert.equal(Game.state.flags.willa_dating, undefined);
  assert.equal(svc.rel.status('willa'), 'none');
  assert.equal(svc.rel.canRomance('theo'), false);
});

// ---------- shops ----------
test('shops: hours, closed days, lockFlag, festival closes, wrap past midnight', () => {
  setup();
  const S = svc.shops;
  setDate('spring', 1, 8 * 60); // Mon
  assert.equal(S.isOpen('bakery'), true);
  assert.equal(S.isOpen('bakery', 6 * 60), false);
  assert.equal(S.closedInfo('bakery', 6 * 60).reason, 'hours');
  assert.equal(S.isOpen('bakery', 17 * 60), false);
  assert.equal(S.isOpen('town_square'), true); // no building entry
  setDate('spring', 7, 8 * 60); // Sun
  assert.equal(S.closedInfo('bakery').reason, 'day');
  assert.equal(S.closedText('bakery'), 'The bakery is closed.');
  setDate('spring', 3, 10 * 60); // Wed
  assert.equal(S.isOpen('general_store'), false);
  assert.equal(S.closedInfo('workshop').reason, 'locked');
  assert.equal(S.closedText('workshop'), 'The shed is locked tight.');
  Game.state.flags.workshop_unlocked = true;
  assert.equal(S.isOpen('workshop'), true);
  setDate('spring', 1, 15 * 60);
  assert.equal(S.isOpen('observatory'), false);
  assert.equal(S.isOpen('observatory', 16 * 60), true);
  assert.equal(S.isOpen('observatory', 25 * 60), true);
  setDate('spring', 14, 10 * 60); // festival Sun? (day 14 = Sun) -> use festival closes
  assert.equal(S.closedInfo('bakery').reason, 'festival');
});

test('shops: stock filters by season, price override, null price skipped, limits', () => {
  setup();
  const S = svc.shops;
  let stock = S.stockFor('bakery');
  assert.deepEqual(stock.map((r) => r.itemId), ['bread', 'cookie']); // rose is summer-only, rock has no buy price
  assert.equal(stock.find((r) => r.itemId === 'bread').price, 40);
  assert.equal(stock.find((r) => r.itemId === 'cookie').price, 30);
  assert.equal(stock.find((r) => r.itemId === 'bread').left, 2);
  setDate('summer', 2);
  stock = S.stockFor('bakery');
  assert.deepEqual(stock.map((r) => r.itemId), ['bread', 'rose']);
});

test('shops: buy rules, limits per day, full pack, money', () => {
  setup();
  const S = svc.shops;
  Game.state.player.money = 100;
  assert.deepEqual(S.buy('bakery', 'bread', 1), { ok: true, cost: 40 });
  assert.equal(Game.state.player.money, 60);
  assert.equal(svc.inventory.count('bread'), 1);
  assert.equal(S.buy('bakery', 'bread', 2).reason, 'soldout');
  assert.equal(S.buy('bakery', 'bread', 1).ok, true);
  assert.equal(S.stockFor('bakery')[0].left, 0);
  assert.equal(S.buy('bakery', 'bread', 1).reason, 'soldout');
  svc.clock.rollDay(); // limit resets next day
  assert.equal(S.stockFor('bakery')[0].left, 2);
  assert.equal(S.buy('bakery', 'cookie', 3).reason, 'money'); // 90 > 20
  assert.equal(S.buy('bakery', 'nope', 1).reason, 'unknown');
  Game.state.inventory.slots = Game.state.inventory.slots.map(() => ({ id: 'plain', qty: 99 }));
  Game.state.player.money = 1000;
  assert.equal(S.buy('bakery', 'cookie', 1).reason, 'full');
  assert.equal(Game.state.player.money, 1000);
});

test('shops: sell uses floor(sell * sellMult), checks buys categories', () => {
  setup();
  const S = svc.shops;
  svc.inventory.add('carp', 1, { silent: true });
  svc.inventory.add('bread', 3, { silent: true });
  svc.inventory.add('rose', 1, { silent: true });
  svc.inventory.add('cottage_key', 1, { silent: true });
  assert.equal(S.sell(0, 1, 'bakery').gained, 25); // 50 * .5
  const breadSlot = Game.state.inventory.slots.findIndex((s) => s?.id === 'bread');
  assert.equal(S.sell(breadSlot, 2, 'bakery').gained, 20); // floor(20*.5)=10 each
  assert.equal(svc.inventory.count('bread'), 1);
  const roseSlot = Game.state.inventory.slots.findIndex((s) => s?.id === 'rose');
  assert.equal(S.sell(roseSlot, 1, 'bakery').reason, 'notbought');
  const keySlot = Game.state.inventory.slots.findIndex((s) => s?.id === 'cottage_key');
  assert.equal(S.sell(keySlot, 1, 'store').reason, 'worthless');
  assert.equal(S.sell(roseSlot, 1, 'store').gained, 15); // buys all, mult 1
  assert.equal(S.sell(0, 1, null).reason, 'noshop');
  assert.equal(Game.state.player.money, 300 + 25 + 20 + 15);
});

test('shops: openShop passes stock, greeting, canSell, callbacks; mode restored; intents', async () => {
  setup();
  Game.mode = 'field';
  const opened = record(EVT.SHOP_OPEN);
  const closed = record(EVT.SHOP_CLOSE);
  await svc.shops.openShop('bakery');
  const o = Game.ui.lastShop;
  assert.equal(o.title, 'Rye & Rose');
  assert.equal(o.greeting, 'Fresh bread!'); // dialogue shop.greet wins
  assert.equal(o.portraitId, 'mira');
  assert.deepEqual(o.canSell, ['food', 'fish']);
  assert.equal(o.stock[0].itemId, 'bread');
  assert.equal(o.onBuy('bread', 1).ok, true);
  assert.equal(opened.length, 1);
  assert.equal(closed.length, 1);
  assert.equal(Game.mode, 'field');
  await svc.shops.openShop('store');
  assert.equal(Game.ui.lastShop.canSell, true);
  assert.equal(Game.ui.lastShop.greeting, 'Hi');
  // intents
  Game.state.player.money = 500;
  Game.bus.emit(EVT.UI_BUY, { shopId: 'bakery', itemId: 'cookie', qty: 2 });
  assert.equal(svc.inventory.count('cookie'), 2);
  assert.equal(await svc.shops.openShop('nope'), false);
});

// ---------- script interpreter ----------
const run = (steps, o) => svc.script.run(steps, o);

test('script: say/narrate/interpolation tokens', async () => {
  setup();
  Game.state.player.money = 1250;
  Game.state.rel.mira.aff = 320;
  await run([
    { say: 'mira', text: 'Hi {player}, I am {name:mira} ({short:mira}).', expr: 'happy' },
    { narrate: '{season} {weekday} {date} {money} {hearts:mira} {item:bread} {unknown}' },
  ]);
  const say = Game.ui.of('say')[0];
  assert.equal(say.text, 'Hi Kai, I am Mira Calloway (Mira).');
  assert.equal(say.expr, 'happy');
  assert.equal(say.speaker, 'mira');
  assert.equal(Game.ui.of('narrate')[0], 'spring Monday Spring 1 (Mon) 1,250 c 3 Bread {unknown}');
});

test('script: flags, items, money, energy, affection, meet', async () => {
  setup();
  const flags = record(EVT.FLAG_SET);
  await run([
    { setFlag: 'a' }, { setFlag: 'b', value: 5 }, { incFlag: 'b', by: 2 }, { incFlag: 'c' }, { clearFlag: 'a' },
    { giveItem: 'bread', qty: 3 }, { takeItem: 'bread', qty: 1 }, { giveItem: 'carp', silent: true },
    { money: 50 }, { money: -30 }, { energy: -40 }, { energy: 5 },
    { affection: 'mira', amount: 30 }, { meet: 'theo' },
  ]);
  const f = Game.state.flags;
  assert.equal(f.a, undefined);
  assert.equal(f.b, 7);
  assert.equal(f.c, 1);
  assert.equal(svc.inventory.count('bread'), 2);
  assert.equal(svc.inventory.count('carp'), 1);
  assert.equal(Game.state.player.money, 320);
  assert.equal(Game.state.player.energy, 65);
  assert.equal(svc.rel.aff('mira'), 30);
  assert.equal(svc.rel.met('theo'), true);
  assert.ok(flags.length >= 6);
  assert.deepEqual(flags[0], { name: 'a', value: true });
  await run([{ money: -9999 }]);
  assert.equal(Game.state.player.money, 0);
});

test('script: ask branches continue after the ask unless end; var; option if', async () => {
  setup();
  Game.state.flags.vip = true;
  Game.ui.answers.ask.push(1);
  await run([
    { ask: [{ text: 'A', then: [{ setFlag: 'ra' }] }, { text: 'B', then: [{ setFlag: 'rb' }] }, { text: 'VIP', if: { flag: 'nope' } }], var: 'pick' },
    { setFlag: 'after' },
  ]);
  assert.equal(Game.state.flags.rb, true);
  assert.equal(Game.state.flags.ra, undefined);
  assert.equal(Game.state.flags.after, true);
  assert.deepEqual(Game.ui.of('ask')[0].options.map((o) => o.text), ['A', 'B']); // option hidden by `if`
  // end in a branch stops the script
  Game.ui.answers.ask.push(0);
  await run([{ ask: [{ text: 'Stop', then: [{ setFlag: 'stopped' }, { end: true }] }] }, { setFlag: 'not_reached' }]);
  assert.equal(Game.state.flags.stopped, true);
  assert.equal(Game.state.flags.not_reached, undefined);
});

test('script: label/goto loops, if/else, runaway guard', async () => {
  setup();
  await run([
    { label: 'top' },
    { incFlag: 'n' },
    { if: { flagGte: ['n', 3] }, then: [{ goto: 'done' }] },
    { goto: 'top' },
    { setFlag: 'skipped' },
    { label: 'done' },
    { if: { flag: 'n' }, then: [{ setFlag: 'then' }], else: [{ setFlag: 'else' }] },
    { if: { flag: 'zz' }, then: [{ setFlag: 'then2' }], else: [{ setFlag: 'else2' }] },
  ]);
  const f = Game.state.flags;
  assert.equal(f.n, 3);
  assert.equal(f.skipped, undefined);
  assert.equal(f.then, true);
  assert.equal(f.else, undefined);
  assert.equal(f.else2, true);
  // runaway
  const warns = [];
  const orig = console.warn;
  console.warn = (...a) => warns.push(a.join(' '));
  try {
    await run([{ label: 'x' }, { incFlag: 'loop' }, { goto: 'x' }]);
  } finally {
    console.warn = orig;
  }
  assert.ok(Game.state.flags.loop > 100);
  assert.ok(Game.state.flags.loop <= svc.script.MAX_STEPS);
  assert.ok(warns.some((w) => /exceeded/.test(w)));
});

test('script: goto from inside nested branch unwinds to top-level label', async () => {
  setup();
  Game.ui.answers.ask.push(0);
  await run([
    { ask: [{ text: 'Go', then: [{ goto: 'end_here' }] }] },
    { setFlag: 'skipped' },
    { label: 'end_here' },
    { setFlag: 'landed' },
  ]);
  assert.equal(Game.state.flags.skipped, undefined);
  assert.equal(Game.state.flags.landed, true);
});

test('script: parallel waits for all branches; call resolves events, intros, interactions', async () => {
  setup();
  await run([{ parallel: [[{ wait: 5 }, { setFlag: 'p1' }], [{ setFlag: 'p2' }]] }, { setFlag: 'after_parallel' }]);
  assert.deepEqual([Game.state.flags.p1, Game.state.flags.p2, Game.state.flags.after_parallel], [true, true, true]);
  await run([{ call: 'low' }, { call: 'mira.intro' }, { call: 'brook_lane.sign_bl' }]);
  assert.equal(Game.state.flags.ran_low, true);
  assert.equal(Game.ui.of('say')[0].text, 'Hi, I am Mira!');
  assert.equal(Game.ui.of('narrate')[0], 'Custom sign for Kai');
  // end inside a called script only ends that script
  await run([{ call: 'prologue' }, { setFlag: 'continued' }]);
  assert.equal(Game.state.flags.continued, true);
});

test('script: unknown op warns once and skips; unknown script id; registerOp custom ops', async () => {
  setup();
  const warns = [];
  const orig = console.warn;
  console.warn = (...a) => warns.push(a.join(' '));
  try {
    await run([{ place: 'mira', at: 'x' }, { place: 'mira', at: 'y' }, { move: 'mira', to: 'x', wait: true }, { setFlag: 'ok' }]);
    await svc.script.run('does_not_exist');
  } finally {
    console.warn = orig;
  }
  assert.equal(Game.state.flags.ok, true);
  assert.equal(warns.filter((w) => /"place"/.test(w)).length, 1);
  assert.ok(warns.some((w) => /"move"/.test(w)));
  const seen = [];
  svc.script.registerOp('place', async (step, ctx) => { seen.push([step.place, ctx.interpolate('{player}')]); });
  svc.script.registerOp('stopper', async () => 'end');
  await run([{ place: 'mira', at: 'x' }, { stopper: true }, { setFlag: 'nope' }]);
  assert.deepEqual(seen, [['mira', 'Kai']]);
  assert.equal(Game.state.flags.nope, undefined);
  delete svc.script.ops.place;
  delete svc.script.ops.stopper;
});

test('script: wait:true modifier on a registered staging op is not a wait', async () => {
  setup();
  const calls = [];
  svc.script.registerOp('anim', async (s) => { calls.push(s.name); });
  await run([{ anim: 'player', name: 'sit', wait: true }]);
  assert.deepEqual(calls, ['sit']);
  delete svc.script.ops.anim;
});

test('script: lantern is +1 and sets flags; quests/mail/setTime/setWeather/music/sfx/toast/fade/title/letterbox/shop/notes', async () => {
  setup();
  const lan = record(EVT.STORY_LANTERN);
  await run([
    { lantern: 1 }, { lantern: 1 }, { setTime: '09:30' }, { setWeather: 'rain' }, { mail: 'later' },
    { music: 'shop', fadeMs: 10 }, { music: null }, { sfx: 'coin' }, { toast: 'Hello {player}', icon: 'x' },
    { fade: 'out', ms: 100 }, { fade: 'in' }, { title: 'Title {player}', sub: 'sub' }, { letterbox: true },
    { notes: { title: 'T', lines: ['a {player}'] } }, { shop: 'store' },
  ]);
  assert.equal(Game.state.story.lanterns, 2);
  assert.equal(Game.state.flags.lantern_2, true);
  assert.deepEqual(lan.map((l) => l.count), [1, 2]);
  assert.equal(Game.state.time.minutes, 570);
  assert.equal(Game.state.weather.today, 'rain');
  assert.deepEqual(Game.state.world.mailPending, ['later']);
  assert.deepEqual(Game.audio.calls.filter((c) => c[0] !== 'sfx' || c[1] === 'coin').slice(0, 3), [['music', 'shop'], ['stop'], ['sfx', 'coin']]);
  assert.ok(Game.ui.toasts().includes('Hello Kai'));
  assert.deepEqual(Game.ui.of('fade').map((f) => f.a), [1, 0]);
  assert.deepEqual(Game.ui.of('banner')[0], { t: 'Title Kai', s: 'sub' });
  assert.equal(Game.ui.of('letterbox')[0], true);
  assert.deepEqual(Game.ui.of('notes')[0], { title: 'T', lines: ['a Kai'] });
  assert.equal(Game.ui.lastShop.title, 'Store');
});

test('script: startQuest/advanceQuest/completeQuest ops', async () => {
  setup();
  await run([{ startQuest: 'q_flag' }]);
  await svc.quests.idle();
  assert.equal(svc.quests.isActive('q_flag'), true);
  await run([{ completeQuest: 'q_flag' }]);
  await svc.quests.idle();
  assert.equal(svc.quests.isDone('q_flag'), true);
  await run([{ startQuest: 'q_multi' }, { advanceQuest: 'q_multi' }]);
  await svc.quests.idle();
  assert.equal(svc.quests.stageOf('q_multi'), 1);
});

test('script: event scripts run in cutscene mode and restore the previous mode', async () => {
  setup();
  const modes = [];
  Game.ui.dialogue.say = async () => { modes.push(Game.mode); };
  await svc.script.run('prologue');
  assert.deepEqual(modes, ['cutscene']);
  assert.equal(Game.mode, 'field');
  await svc.script.run([{ say: 'mira', text: 'x' }]);
  assert.equal(modes[1], 'field');
  await svc.script.run([{ say: 'mira', text: 'x' }], { cutscene: true });
  assert.equal(modes[2], 'cutscene');
  assert.equal(Game.mode, 'field');
});

test('script: runQueued waits for the running script', async () => {
  setup();
  const order = [];
  const a = svc.script.run([{ wait: 20 }, { setFlag: 'first' }]).then(() => order.push('a'));
  // skipFades makes wait instant; use a custom slow op instead
  svc.script.registerOp('slow', () => new Promise((r) => setTimeout(r, 25)));
  const slow = svc.script.run([{ slow: true }]).then(() => order.push('slow'));
  const q = svc.script.runQueued([{ setFlag: 'queued' }]).then(() => order.push('queued'));
  await Promise.all([a, slow, q]);
  assert.deepEqual(order.slice(-2), ['slow', 'queued']);
  delete svc.script.ops.slow;
});
