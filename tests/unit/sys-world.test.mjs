import test from 'node:test';
import assert from 'node:assert/strict';
import { setup, setDate, svc, Game, Sys } from './fixtures/sys-data.mjs';
import { EVT } from '../../src/core/events.js';
import { dayNumber } from '../../src/core/util.js';
import { loadFromSlot } from '../../src/core/state.js';
import { REL_EVT } from '../../src/systems/rel.js';

const wait = (ms = 20) => new Promise((r) => setTimeout(r, ms));
const settle = async () => {
  for (let i = 0; i < 4; i++) {
    await svc.quests.idle();
    await wait(0);
  }
};
const record = (evt) => {
  const got = [];
  Game.bus.on(evt, (p) => got.push(p));
  return got;
};
const fakeEntities = () => {
  const calls = [];
  svc.entities = {
    calls,
    async enterArea(area, anchor, o = {}) {
      calls.push({ area, anchor, ...o });
      const from = Game.state.player.area;
      Game.state.player.area = area;
      if (o.x !== undefined) Object.assign(Game.state.player, { x: o.x, z: o.z, facing: o.facing });
      Game.bus.emit(EVT.AREA_ENTER, { area, from });
    },
    getPlayerPos: () => ({ area: Game.state.player.area, x: Game.state.player.x + 1, z: Game.state.player.z + 2, facing: 'n' }),
  };
  return svc.entities;
};

// ---------- quests ----------
test('quests: multi-stage chain with have/catch/forage, onEnter/onDone, reward script', async () => {
  setup();
  const ev = { start: record(EVT.QUEST_START), adv: record(EVT.QUEST_ADVANCE), done: record(EVT.QUEST_COMPLETE) };
  assert.equal(svc.quests.start('q_multi'), true);
  assert.equal(svc.quests.start('q_multi'), false);
  await settle();
  assert.equal(Game.state.flags.entered_a, true);
  assert.equal(svc.quests.stageOf('q_multi'), 0);
  assert.equal(svc.quests.stageId('q_multi'), 'a');
  svc.inventory.add('bread', 2, { silent: true });
  await settle();
  assert.equal(Game.state.flags.done_a, true);
  assert.equal(svc.quests.stageOf('q_multi'), 1);
  Game.bus.emit(EVT.FISH_CAUGHT, { id: 'carp', size: 1, perfect: false });
  await settle();
  assert.equal(svc.quests.stageOf('q_multi'), 1);
  Game.bus.emit(EVT.FISH_CAUGHT, { id: 'eel', size: 1, perfect: false });
  await settle();
  assert.equal(svc.quests.stageOf('q_multi'), 2);
  Game.bus.emit(EVT.FORAGE_PICKED, { id: 'rock', spot: 's' });
  await settle();
  assert.equal(svc.quests.stageOf('q_multi'), 2);
  Game.bus.emit(EVT.FORAGE_PICKED, { id: 'honey', spot: 's' });
  await settle();
  assert.equal(svc.quests.isDone('q_multi'), true);
  assert.equal(svc.quests.isActive('q_multi'), false);
  assert.equal(Game.state.flags.multi_reward, true);
  assert.equal(ev.start.length, 1);
  assert.equal(ev.adv.length, 2);
  assert.equal(ev.done.length, 1);
  assert.equal(svc.quests.start('q_multi'), false); // not repeatable
});

test('quests: have goal already satisfied completes on start; rewards paid', async () => {
  setup();
  svc.inventory.add('bread', 1, { silent: true });
  svc.rel.meet('mira');
  svc.quests.start('q_talk');
  await settle();
  assert.equal(svc.quests.isActive('q_talk'), true);
  Game.bus.emit(EVT.NPC_TALK, { id: 'theo' });
  await settle();
  assert.equal(svc.quests.isActive('q_talk'), true);
  Game.bus.emit(EVT.NPC_TALK, { id: 'mira' });
  await settle();
  assert.equal(svc.quests.isDone('q_talk'), true);
  assert.equal(Game.state.player.money, 400);
  assert.equal(svc.inventory.count('bread'), 3);
  assert.equal(svc.rel.aff('mira'), 30);
  assert.equal(Game.state.flags.said_hi, true);
});

test('quests: every goal type progresses', async () => {
  setup();
  for (const id of ['q_visit', 'q_hearts', 'q_job', 'q_earn', 'q_flag', 'q_date', 'q_lantern', 'q_give']) svc.quests.start(id);
  await settle();
  const active = () => ['q_visit', 'q_hearts', 'q_job', 'q_earn', 'q_flag', 'q_date', 'q_lantern', 'q_give'].filter((i) => svc.quests.isActive(i));
  assert.equal(active().length, 8);
  Game.bus.emit(EVT.AREA_ENTER, { area: 'bakery', from: 'x' });
  Game.bus.emit(EVT.AREA_ENTER, { area: 'harbor', from: 'x' });
  svc.rel.addAff('mira', 200, { silent: true });
  Game.bus.emit(EVT.JOB_DONE, { id: 'bakery_shift', score: 1, pay: 10 });
  await settle();
  assert.ok(!svc.quests.isDone('q_job'));
  Game.bus.emit(EVT.JOB_DONE, { id: 'bakery_shift', score: 1, pay: 10 });
  svc.inventory.addMoney(60);
  await settle();
  assert.ok(!svc.quests.isDone('q_earn'));
  svc.inventory.addMoney(40);
  svc.script.run([{ setFlag: 'the_flag' }, { lantern: 1 }, { lantern: 1 }]);
  Game.bus.emit(REL_EVT.GIFT, { npc: 'mira', item: 'rose', qty: 1, reaction: 'like' });
  await settle();
  assert.ok(!svc.quests.isDone('q_give'));
  Game.bus.emit(REL_EVT.GIFT, { npc: 'mira', item: 'cookie', qty: 1, reaction: 'love' });
  svc.clock.rollDay();
  await settle();
  assert.ok(!svc.quests.isDone('q_date')); // day 2
  svc.clock.rollDay();
  await settle();
  assert.deepEqual(active(), []);
  for (const id of ['q_visit', 'q_hearts', 'q_job', 'q_earn', 'q_flag', 'q_date', 'q_lantern', 'q_give']) assert.ok(svc.quests.isDone(id), id);
});

test('quests: list, track, ui:trackQuest, unknown quest', async () => {
  setup();
  svc.quests.start('q_flag');
  svc.quests.start('q_visit');
  await settle();
  const l = svc.quests.list();
  assert.deepEqual(l.map((q) => q.id).sort(), ['q_flag', 'q_visit']);
  assert.equal(l.find((q) => q.id === 'q_visit').text, 'Go to the harbor');
  Game.bus.emit(EVT.UI_TRACK_QUEST, { id: 'q_flag' });
  assert.equal(svc.quests.tracked(), 'q_flag');
  assert.equal(svc.quests.list().find((q) => q.id === 'q_flag').tracked, true);
  const orig = console.warn;
  console.warn = () => {};
  assert.equal(svc.quests.start('nope'), false);
  console.warn = orig;
});

// ---------- notice board ----------
test('board: deterministic per dayNum, errand ids, 2-3 errands, unlocked board quests', () => {
  setup();
  const sig = () => svc.quests.board().map((o) => `${o.id}|${o.text}|${o.reward}`).join(';');
  const a = sig();
  assert.equal(sig(), a);
  const offers = svc.quests.board();
  const errands = offers.filter((o) => o.type === 'errand');
  assert.ok(errands.length >= 2 && errands.length <= 3, String(errands.length));
  assert.ok(errands.every((o, i) => o.id === `errand_1_${i + 1}`));
  assert.ok(errands.every((o) => !/[{}]/.test(o.text)));
  assert.ok(!offers.some((o) => o.type === 'quest'));
  // same state again => same board
  setup();
  assert.equal(sig(), a);
  // different day => (very likely) different
  const days = new Set();
  for (let i = 0; i < 6; i++) {
    svc.clock.rollDay();
    days.add(sig());
  }
  assert.ok(days.size > 1);
  Game.state.flags.board_unlocked = true;
  svc.quests.refreshBoard(true);
  assert.ok(svc.quests.board().some((o) => o.type === 'quest' && o.questId === 'q_board'));
});

test('board: accept errand creates errand_<dayNum>_<n> instance, max 3, expiry; quest offers start the quest', async () => {
  setup();
  Game.state.flags.board_unlocked = true;
  svc.quests.refreshBoard(true);
  const offers = svc.quests.board();
  const e = offers.find((o) => o.type === 'errand');
  assert.equal(svc.quests.accept(e.id), true);
  assert.equal(svc.quests.accept(e.id), false);
  assert.equal(svc.quests.isActive(e.id), true);
  assert.ok(/^errand_1_\d$/.test(e.id));
  assert.ok(!svc.quests.board().some((o) => o.id === e.id));
  await settle();
  assert.equal(svc.quests.list().find((q) => q.id === e.id).kind, 'errand');
  const q = offers.find((o) => o.type === 'quest');
  assert.equal(svc.quests.accept(q.id), true);
  assert.equal(svc.quests.isActive('q_board'), true);
  // expiry (2 days)
  svc.clock.rollDay();
  assert.equal(svc.quests.isActive(e.id), true);
  svc.clock.rollDay();
  svc.clock.rollDay();
  assert.equal(svc.quests.isActive(e.id), false);
  assert.equal(svc.quests.isDone(e.id), false);
  assert.equal(svc.quests.isActive('q_board'), true); // board quests do not expire
  // limit
  svc.quests.refreshBoard(true);
  let n = 0;
  let refused = 0;
  for (const o of svc.quests.board().filter((x) => x.type === 'errand')) (svc.quests.accept(o.id) ? n++ : refused++);
  assert.ok(n <= 3);
});

test('board: errand kinds complete with correct goals and consume items', async () => {
  setup();
  const q = svc.quests;
  const tpl = (k) => Game.data.errands.find((t) => t.kind === k);
  const rng = () => 0.5;
  const mk = (k, id) => q._expandErrand(tpl(k), id, rng);
  const deliver = mk('deliver', 'errand_t1');
  assert.deepEqual(deliver.def.stages[0].goal.type, 'talk');
  for (const a of deliver.accept) svc.inventory.give(a.id, a.qty, { silent: true });
  q.start(deliver.id, { def: deliver.def });
  await settle();
  const npc = deliver.def.stages[0].goal.npc;
  Game.bus.emit(EVT.NPC_TALK, { id: npc });
  await settle();
  assert.equal(q.isDone('errand_t1'), true);
  assert.equal(svc.inventory.count('bread'), 0); // consumed
  const money = Game.state.player.money;
  assert.ok(money > 300);
  const bring = mk('bring', 'errand_t2');
  assert.equal(bring.def.stages.length, 2);
  q.start('errand_t2', { def: bring.def });
  await settle();
  svc.inventory.add('cookie', 5, { silent: true });
  await settle();
  assert.equal(q.stageOf('errand_t2'), 1);
  Game.bus.emit(EVT.NPC_TALK, { id: 'mira' });
  await settle();
  assert.equal(q.isDone('errand_t2'), true);
  assert.equal(svc.inventory.count('cookie'), 5 - bring.def.consume[0].qty);
  const c = mk('catch', 'errand_t3');
  assert.equal(c.def.stages[0].goal.type, 'catch');
  const f = mk('forage', 'errand_t4');
  assert.equal(f.def.stages[0].goal.type, 'forage');
});

test('board: noticeboard UI lists offers, accepts via ask', async () => {
  setup();
  const offers = svc.quests.board();
  Game.ui.answers.ask.push(0, 0, offers.length + 5); // pick first, take it, then leave (index beyond -> exit)
  await svc.interact.run('town_square', { id: 'noticeboard', type: 'noticeboard' });
  assert.equal(svc.quests.isActive(offers[0].id), true);
  assert.equal(Game.ui.of('ask')[0].options.length, offers.length + 1);
  assert.equal(Game.ui.of('ask').length, 3);
});

// ---------- events ----------
test('events: highest priority first, once-only, chains, seen flag, start/end events', async () => {
  setup();
  Game.state.flags.prologue_done = true;
  Game.state.flags.trigger_a = true;
  const started = record(EVT.EVENT_START);
  const ended = record(EVT.EVENT_END);
  Game.audio.calls.length = 0;
  assert.equal(await svc.events.check(), 'high');
  assert.deepEqual(started.map((e) => e.id), ['high', 'low']);
  assert.equal(ended.length, 2);
  assert.equal(Game.state.flags.seen_high, true);
  assert.equal(Game.state.flags.ran_low, true);
  assert.equal(Game.state.world.eventsSeen.high, 1);
  assert.equal(await svc.events.check(), null);
  assert.equal(Game.mode, 'field');
});

test('events: only in field mode; cooldownDays honoured; music played', async () => {
  setup();
  Game.state.flags.prologue_done = true;
  Game.state.flags.trigger_r = true;
  Game.data.events.repeat.music = 'comedy';
  Game.mode = 'dialogue';
  assert.equal(await svc.events.check(), null);
  Game.mode = 'field';
  assert.equal(await svc.events.check(), 'repeat');
  assert.deepEqual(Game.audio.calls.find((c) => c[0] === 'music'), ['music', 'comedy']);
  assert.equal(Game.state.flags.repeat_count, 1);
  assert.equal(await svc.events.check(), null);
  svc.clock.rollDay();
  svc.clock.rollDay();
  assert.equal(await svc.events.check(), null);
  svc.clock.rollDay();
  assert.equal(await svc.events.check(), 'repeat');
  assert.equal(Game.state.flags.repeat_count, 2);
});

test('events: triggers on area:enter and every 10 minutes in field mode', async () => {
  setup();
  Game.state.flags.prologue_done = true;
  Game.state.flags.trigger_a = true;
  Game.bus.emit(EVT.TIME_TICK, { minutes: 601 });
  await wait();
  assert.equal(Game.state.flags.ran_high, undefined);
  Game.bus.emit(EVT.TIME_TICK, { minutes: 600 });
  await wait();
  assert.equal(Game.state.flags.ran_high, true);
  Game.state.flags.trigger_r = true;
  Game.bus.emit(EVT.AREA_ENTER, { area: 'harbor', from: 'x' });
  await wait();
  assert.equal(Game.state.flags.repeat_count, 1);
});

test('events: festival window (date, area, from..to) gates the festival event; closes + placement', async () => {
  setup();
  Game.state.flags.prologue_done = true;
  const E = svc.events;
  setDate('spring', 13, 11 * 60);
  Game.state.player.area = 'riverside_park';
  assert.equal(E.festivalToday(), null);
  assert.equal(await E.check(), null);
  setDate('spring', 14, 11 * 60);
  assert.equal(E.festivalToday().id, 'testfest');
  assert.deepEqual(E.closedBuildings(), ['bakery']);
  assert.equal(E.festivalPlacement().default.area, 'riverside_park');
  Game.state.player.area = 'town_square';
  assert.equal(await E.check(), null); // wrong place
  Game.state.player.area = 'riverside_park';
  setDate('spring', 14, 15 * 60);
  assert.equal(E.festivalActive(), null);
  assert.equal(await E.check(), null); // outside window
  setDate('spring', 14, 11 * 60);
  assert.equal(E.festivalActive().id, 'testfest');
  assert.equal(await E.check(), 'festival_test');
  assert.equal(Game.state.flags.festival_ran, true);
});

// ---------- mail ----------
test('mail: morning delivery, pending via op, reading grants attachments', async () => {
  setup();
  assert.deepEqual(svc.mail.queue(), []);
  svc.clock.rollDay();
  assert.deepEqual(svc.mail.queue(), ['welcome']);
  assert.equal(svc.mail.hasMail(), true);
  svc.clock.rollDay();
  assert.deepEqual(svc.mail.queue(), ['welcome']); // not duplicated
  await svc.script.run([{ mail: 'later' }]);
  assert.deepEqual(svc.mail.queue(), ['welcome']); // delivered next morning
  svc.clock.rollDay();
  assert.deepEqual(svc.mail.queue(), ['welcome', 'later']);
  const n = await svc.mail.openMailbox();
  assert.equal(n, 2);
  const notes = Game.ui.of('notes');
  assert.equal(notes[0].title, 'Hello Kai');
  assert.deepEqual(notes[0].lines, ['Welcome!', '— Odell']);
  assert.equal(Game.state.player.money, 350);
  assert.equal(svc.inventory.count('bread'), 1);
  assert.equal(Game.state.world.mailRead.welcome, 4);
  assert.deepEqual(svc.mail.queue(), []);
  svc.clock.rollDay();
  assert.deepEqual(svc.mail.queue(), []); // read letters never return
  await svc.mail.openMailbox();
  assert.equal(Game.ui.of('narrate').at(-1), 'The mailbox is empty.');
});

test('mail: conditional letters wait for their when', () => {
  setup();
  Game.state.world.mailRead.welcome = 1;
  svc.clock.rollDay();
  assert.deepEqual(svc.mail.queue(), []);
  Game.state.flags.later_ok = true;
  svc.clock.rollDay();
  assert.deepEqual(svc.mail.queue(), ['later']);
});

// ---------- tutorial ----------
test('tutorial: hint toasts once on their when; respects showHints', () => {
  setup();
  assert.equal(svc.tutorial.check(), null);
  Game.state.flags.hint_on = true;
  Game.bus.emit(EVT.FLAG_SET, { name: 'hint_on', value: true });
  assert.ok(Game.ui.toasts().includes('Press I for items, Kai.'));
  assert.equal(Game.state.tutorial.seen.hint1, true);
  const n = Game.ui.toasts().length;
  svc.tutorial.check();
  assert.equal(Game.ui.toasts().length, n);
  setup();
  Game.settings.showHints = false;
  Game.state.flags.hint_on = true;
  assert.equal(svc.tutorial.check(), null);
});

// ---------- director ----------
test('director: newGame builds state, fills storage, fires prologue, enters brook_lane in field mode', async () => {
  setup();
  const ent = fakeEntities();
  const modes = [];
  Game.bus.on(EVT.MODE_CHANGE, (m) => modes.push(m.to));
  const isNew = record(EVT.GAME_NEW);
  const st = await Sys.newGame({ name: 'Zed', look: { hair: '#111111' } });
  assert.equal(st.meta.name, 'Zed');
  assert.equal(st.meta.look.hair, '#111111');
  assert.equal(st.storage.slots.length, 48);
  assert.equal(isNew.length, 1);
  assert.deepEqual([ent.calls[0].area, ent.calls[0].anchor], ['brook_lane', 'cottage_front']);
  assert.equal(Game.state.flags.prologue_done, true);
  assert.equal(svc.inventory.count('cottage_key'), 1);
  assert.equal(Game.ui.of('say')[0].text, 'Welcome Zed.');
  assert.equal(Game.mode, 'field');
  assert.ok(modes.includes('cutscene'));
  assert.equal(Game.state.time.minutes, 360);
  assert.equal(Game.state.weather.today, 'sunny');
  assert.equal(svc.rel.met('gus'), true); // startMet
});

test('director: start() title loop (new / continue failing / quit)', async () => {
  setup();
  fakeEntities();
  Game.ui.answers.title.push({ action: 'continue', slot: 2 }, { action: 'new', name: 'Ann', look: {} });
  await Sys.start();
  assert.equal(Game.state.meta.name, 'Ann');
  assert.ok(Game.ui.toasts().some((t) => /could not be loaded/.test(t)));
  assert.equal(Game.ui.of('showTitle').length, 2);
  setup();
  Game.mode = 'boot';
  await Sys.start();
  assert.equal(Game.mode, 'title'); // quit leaves the title up
});

test('director: save/continue roundtrip via core slots, position from entities.getPlayerPos', async () => {
  setup();
  const ent = fakeEntities();
  await Sys.newGame({ name: 'Zed' });
  svc.inventory.add('bread', 5, { silent: true });
  Game.state.player.money = 777;
  Game.state.flags.custom = 42;
  Game.state.player.x = 3;
  Game.state.player.z = 4;
  const r = Sys.saveGame(2);
  assert.equal(r.ok, true);
  const saved = loadFromSlot(2);
  assert.equal(saved.player.money, 777);
  assert.deepEqual([saved.player.x, saved.player.z, saved.player.facing], [4, 6, 'n']);
  assert.equal(saved.meta.slot, 2);
  const events = record(EVT.GAME_SAVED);
  Sys.saveGame(3);
  assert.deepEqual(events, [{ slot: 3 }]);
  // wipe and continue
  Game.state = null;
  const loaded = record(EVT.GAME_LOADED);
  ent.calls.length = 0;
  assert.equal(await Sys.continueGame(2), true);
  assert.equal(Game.state.player.money, 777);
  assert.equal(Game.state.flags.custom, 42);
  assert.equal(svc.inventory.count('bread'), 5);
  assert.deepEqual([ent.calls[0].area, ent.calls[0].x, ent.calls[0].z, ent.calls[0].facing], ['brook_lane', 4, 6, 'n']);
  assert.deepEqual(loaded, [{ slot: 2 }]);
  assert.equal(Game.mode, 'field');
  assert.equal(await Sys.continueGame(1 /* empty */), false);
  // ui:save / ui:load intents
  Game.bus.emit(EVT.UI_SAVE, { slot: 1 });
  assert.ok(loadFromSlot(1));
  assert.ok(Game.ui.toasts().includes('Game saved.'));
});

test('director: save tracks playSeconds in update()', async () => {
  setup();
  Game.state.meta.playSeconds = 0;
  Sys.update(2);
  Game.mode = 'title';
  Sys.update(5);
  assert.equal(Game.state.meta.playSeconds, 2);
});

test('director: sleep rolls the day, resets energy by bedtime, summary, autosave, wake at the cottage', async () => {
  setup();
  const ent = fakeEntities();
  Game.state.flags.prologue_done = true;
  Game.state.flags.trigger_a = true;
  Game.state.player.energy = 5;
  svc.clock.set({ minutes: 20 * 60 });
  svc.inventory.addMoney(120);
  svc.rel.addAff('mira', 100, { silent: true });
  const started = record(EVT.SLEEP_START);
  const ended = record(EVT.SLEEP_END);
  const dayEvents = record(EVT.TIME_NEWDAY);
  assert.equal(await svc.director.sleep(), true);
  assert.equal(Game.ui.of('confirm').length, 1);
  assert.equal(Game.state.time.day, 2);
  assert.equal(Game.state.time.minutes, 360);
  assert.equal(Game.state.player.energy, 100);
  const sum = Game.ui.of('daySummary')[0];
  assert.equal(sum.earned, 120);
  assert.deepEqual(sum.hearts, [{ npc: 'mira', delta: 1 }]);
  assert.deepEqual([ent.calls.at(-1).area, ent.calls.at(-1).anchor], ['cottage', 'bed_spot']);
  assert.equal(loadFromSlot(0).time.day, 2); // autosave
  assert.equal(Game.ui.of('banner')[0].t, 'Spring 2 (Tue)');
  assert.equal(Game.audio.calls.some((c) => c[1] === 'wake_jingle'), true);
  assert.equal(Game.mode, 'field');
  assert.equal(started.length, 1);
  assert.equal(ended.length, 1);
  assert.equal(dayEvents.length, 1);
  assert.deepEqual(svc.mail.queue(), ['welcome']);
  assert.equal(Game.state.flags.ran_high, true); // events.check after waking
  // late bedtime -> 70%
  svc.clock.set({ minutes: 25 * 60 });
  Game.state.player.energy = 1;
  await svc.director.sleep({ confirm: false });
  assert.equal(Game.state.player.energy, 70);
  // cancelled
  Game.ui.answers.confirm.push(false);
  const day = Game.state.time.day;
  assert.equal(await svc.director.sleep(), false);
  assert.equal(Game.state.time.day, day);
});

test('director: collapse costs up to 50 coins, energy 50%, wakes at the cottage', async () => {
  setup();
  fakeEntities();
  Game.state.player.money = 30;
  await svc.director.collapse();
  assert.equal(Game.state.player.money, 0);
  assert.equal(Game.state.player.energy, 50);
  assert.equal(Game.state.time.day, 2);
  assert.equal(Game.state.player.area, 'cottage');
  assert.ok(Game.ui.of('narrate').some((t) => /30 coins/.test(t)));
  assert.equal(Game.mode, 'field');
});

test('director: field-mode menu keys open the right tab, no double-open; openMenu restores mode', async () => {
  setup();
  const pressed = new Set(['journal']);
  Game.input = { pressed: (a) => pressed.has(a) };
  Sys.update(0.016);
  await wait();
  assert.deepEqual(Game.ui.of('menu'), ['quests']);
  assert.equal(Game.mode, 'field');
  let resolve;
  Game.ui.menu.open = (tab) => new Promise((r) => { resolve = r; Game.ui.log('menu', tab); });
  pressed.clear();
  pressed.add('map');
  Sys.update(0.016);
  assert.equal(Game.mode, 'menu');
  Sys.update(0.016); // ignored while in menu mode
  assert.equal(Game.ui.of('menu').length, 2);
  resolve();
  await wait();
  assert.equal(Game.mode, 'field');
});

// ---------- interaction handlers ----------
const it = (id, type, extra = {}) => ({ id, type, x: 0, z: 0, r: 1, label: id, ...extra });

test('interact: bed -> sleep, diary -> quick save, mailbox, rest, bench, fountain, shrine, telescope', async () => {
  setup();
  fakeEntities();
  await svc.interact.run('cottage', it('bed', 'bed'));
  assert.equal(Game.state.time.day, 2);
  Game.ui.answers.ask.push(0);
  await svc.interact.run('cottage', it('diary', 'diary'));
  assert.ok(loadFromSlot(1));
  Game.ui.answers.ask.push(1);
  await svc.interact.run('cottage', it('diary', 'diary'));
  assert.equal(Game.ui.of('menu').at(-1), 'settings');
  // mailbox
  await svc.interact.run('brook_lane', it('mailbox', 'mailbox'));
  assert.equal(Game.ui.of('notes')[0].title, 'Hello Kai');
  // bench
  Game.state.player.energy = 50;
  const t0 = Game.state.time.minutes;
  await svc.interact.run('town_square', it('bench_sq_1', 'bench'));
  assert.equal(Game.state.player.energy, 53);
  assert.equal(Game.state.time.minutes, t0 + 10);
  Game.ui.answers.confirm.push(false);
  await svc.interact.run('town_square', it('bench_sq_1', 'bench'));
  assert.equal(Game.state.player.energy, 53);
  // bench plays the sit anim when S2 registered the op
  const anims = [];
  svc.script.registerOp('anim', async (s) => { anims.push(s.name); });
  await svc.interact.run('town_square', it('bench_sq_1', 'bench'));
  assert.deepEqual(anims, ['sit']);
  delete svc.script.ops.anim;
  // rest (clinic)
  Game.state.player.energy = 20;
  Game.state.player.money = 100;
  const t1 = Game.state.time.minutes;
  await svc.interact.run('clinic', it('clinic_bed', 'rest'));
  assert.equal(Game.state.player.energy, 100);
  assert.equal(Game.state.player.money, 50);
  assert.equal(Game.state.time.minutes, t1 + 120);
  await svc.interact.run('clinic', it('clinic_bed', 'rest')); // not tired
  assert.equal(Game.state.player.money, 50);
  // fountain
  await svc.interact.run('town_square', it('fountain', 'fountain'));
  assert.equal(Game.state.player.money, 49);
  // shrine once per day
  await svc.interact.run('whispering_woods', it('shrine', 'shrine'));
  assert.equal(Game.state.player.money, 44);
  await svc.interact.run('whispering_woods', it('shrine', 'shrine'));
  assert.equal(Game.state.player.money, 44);
  // telescope: day vs night
  svc.clock.set({ minutes: 600 });
  await svc.interact.run('starview_hill', it('telescope', 'telescope'));
  assert.ok(Game.ui.of('narrate').at(-1).includes('sun'));
  svc.clock.set({ minutes: 1200 });
  await svc.interact.run('starview_hill', it('telescope', 'telescope'));
  assert.equal(Game.state.flags.stargaze_count, 1);
  assert.equal(Game.state.time.minutes, 1220);
});

test('interact: chest put / take through pickItem and ask', async () => {
  setup();
  svc.inventory.add('bread', 5, { silent: true });
  Game.ui.answers.ask.push(0, 2); // put, then close
  Game.ui.answers.pickItem.push(0);
  await svc.interact.run('cottage', it('chest_spot', 'chest'));
  assert.equal(svc.inventory.count('bread'), 0);
  assert.equal(svc.inventory.storage.count('bread'), 5);
  Game.ui.answers.ask.push(1, 0, 2); // take out, pick first row, close
  await svc.interact.run('cottage', it('chest_spot', 'chest'));
  assert.equal(svc.inventory.count('bread'), 5);
  assert.equal(svc.inventory.storage.count('bread'), 0);
});

test('interact: shop counter opens the right shop; closed text when closed', async () => {
  setup();
  setDate('spring', 1, 9 * 60);
  await svc.interact.run('bakery', it('shop_bakery', 'shop'));
  assert.equal(Game.ui.lastShop.title, 'Rye & Rose');
  Game.ui.calls.length = 0;
  setDate('spring', 7, 9 * 60); // Sunday: closed
  await svc.interact.run('bakery', it('shop_bakery', 'shop'));
  assert.equal(Game.ui.of('shop').length, 0);
  assert.equal(Game.ui.of('narrate')[0], 'The bakery is closed.');
});

test('interact: bookshelf reads books, logs them, hints active quest; sign/object examine rules', async () => {
  setup();
  svc.quests.start('q_talk');
  await settle();
  await svc.interact.run('library', it('bookshelf_lib_1', 'bookshelf'));
  assert.deepEqual(Game.ui.of('notes')[0], { title: 'Old Book', lines: ['Page one', 'Page Kai'] });
  assert.equal(Game.state.log.books.b1, true);
  assert.ok(Game.ui.toasts().includes('Hint!'));
  await svc.interact.run('library', it('bookshelf_lib_2', 'bookshelf', { text: 'Empty shelf.' }));
  assert.equal(Game.ui.of('narrate').at(-1), 'Empty shelf.');
  // examine: script override, text override, _defaults, it.text
  await svc.interact.run('brook_lane', it('sign_bl', 'sign'));
  assert.equal(Game.ui.of('narrate').at(-1), 'Custom sign for Kai');
  await svc.interact.run('brook_lane', it('sign_x', 'sign'));
  assert.equal(Game.ui.of('narrate').at(-1), 'A sign.');
  await svc.interact.run('harbor', it('sign_hb', 'sign'));
  assert.equal(Game.ui.of('narrate').at(-1), 'Default sign.');
  await svc.interact.run('harbor', it('crate', 'object'));
  assert.equal(Game.ui.of('narrate').at(-1), 'Default object.');
  await svc.interact.run('harbor', it('thing', 'crafting', { text: 'A workbench.' }));
  assert.equal(Game.ui.of('narrate').at(-1), 'A workbench.');
});

test('interact: job delegates to svc.jobs.start; lamp unhandled falls back to text; registerHandler overrides', async () => {
  setup();
  await svc.interact.run('bakery', it('job_bakery', 'job'));
  assert.match(Game.ui.of('narrate').at(-1), /nothing to do/i);
  const started = [];
  svc.jobs = { start: async (id) => started.push(id) };
  await svc.interact.run('bakery', it('job_bakery', 'job'));
  assert.deepEqual(started, ['bakery_shift']);
  delete svc.jobs;
  await svc.interact.run('brook_lane', it('lamp_bl_1', 'lamp', { text: 'A cracked lamp.' }));
  assert.equal(Game.ui.of('narrate').at(-1), 'A cracked lamp.');
  const seen = [];
  svc.interact.registerHandler('lamp', async (ctx) => { seen.push([ctx.area, ctx.it.id, ctx.player === Game.state.player]); });
  await svc.interact.run('brook_lane', it('lamp_bl_1', 'lamp'));
  assert.deepEqual(seen, [['brook_lane', 'lamp_bl_1', true]]);
  delete svc.interact.handlers.lamp;
});

test('quests: autoStart begins every quest whose unlock now holds (tutorial / main / side), never board quests or errands', async () => {
  setup();
  const q = svc.quests;
  Game.data.quests.q_auto = { id: 'q_auto', kind: 'tutorial', title: 'Auto', desc: 'd', unlock: { flag: 'auto_go' }, stages: [{ id: 'a', text: 'a', goal: { type: 'flag', flag: 'never' } }], reward: {} };
  Game.state.flags.auto_go = true;
  q.poll();
  await settle();
  assert.equal(q.isActive('q_auto'), false, 'not before the prologue is done');
  Game.state.flags.prologue_done = true;
  delete Game.state.flags.auto_go;
  q.poll();
  await settle();
  assert.equal(q.isActive('q_auto'), false, 'locked until its condition holds');
  Game.state.flags.auto_go = true;
  q.poll();
  await settle();
  assert.equal(q.isActive('q_auto'), true);
  Game.state.flags.board_unlocked = true;
  q.poll();
  await settle();
  assert.equal(q.isActive('q_board'), false, 'board quests wait on the notice board');
  Game.data.quests.q_side = { id: 'q_side', kind: 'side', giver: 'mira', title: 'Side', desc: 'd', unlock: { flag: 'auto_go' }, stages: [{ id: 'a', text: 'a', goal: { type: 'flag', flag: 'never' } }], reward: {} };
  q.poll();
  await settle();
  assert.equal(q.isActive('q_side'), false, 'side quests wait for a talk with their giver');
  Game.bus.emit(EVT.NPC_TALK, { id: 'mira' });
  await settle();
  assert.equal(q.isActive('q_side'), true);
  delete Game.data.quests.q_auto;
  delete Game.data.quests.q_side;
});
