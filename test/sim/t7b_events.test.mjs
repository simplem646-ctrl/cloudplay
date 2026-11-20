// Events (catalog, triggers, priorities, repeat rules, running), dialogue picker + gifts, endings composer, glue.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildCatalog, listEligible, findEvent, runEvent, priorityOf, catalogStats, flattenModules, questsFromModules, getEvent,
} from '../../src/sim/events.js';
import { pickTalk, pickRepeat, buildPools, giftReaction, prefsFromPools, giftTaste } from '../../src/sim/dialogue.js';
import { composeEnding, slidesFromModules, GROUP_ORDER } from '../../src/sim/endings.js';
import { createEventSystem } from '../../src/sim/events_system.js';
import { createSim } from '../../src/sim/index.js';
import { MockStage } from '../../src/sim/mock_stage.js';
import * as D from '../../src/sim/script_dsl.js';
import { validateEvent, validateDialoguePool } from '../../src/sim/script_dsl.js';
import { fresh, named } from './_helpers.mjs';

const ev = (id, extra = {}) => ({ id, title: id, kind: 'story', trigger: { type: 'enterMap', map: 'town_square' }, script: [D.setFlag(`ran_${id}`)], ...extra });
const ids = (list) => list.map((e) => e.id);
const HERE = { type: 'enterMap', map: 'town_square' };

// ------------------------------------------------------------------ catalog + triggers
test('factory events pass the contract validator', () => {
  assert.deepEqual(validateEvent(ev('a')), []);
  assert.deepEqual(validateEvent(ev('b', { trigger: { type: 'clock', at: '15:00', map: 'bakery' }, repeat: 'daily', when: { flag: 'x' }, priority: 5 })), []);
});

test('buildCatalog: duplicates warn and the last definition wins; lookups work', () => {
  const warn = console.warn; const seen = []; console.warn = (m) => seen.push(m);
  try {
    const cat = buildCatalog([ev('a', { title: 'first' }), ev('a', { title: 'second' }), ev('b')]);
    assert.equal(cat.list.length, 2);
    assert.equal(getEvent('a', cat).title, 'second');
    assert.equal(getEvent('nope', cat), null);
    assert.ok(seen.some((m) => /duplicate event id "a"/.test(m)));
  } finally { console.warn = warn; }
});

test('flattenModules / questsFromModules accept the generated-registry module shapes', () => {
  const list = flattenModules({ one: { default: [ev('a'), ev('b')] }, two: { events: [ev('c')] }, three: { default: ev('d') }, empty: {} });
  assert.deepEqual(ids(list), ['a', 'b', 'c', 'd']);
  assert.deepEqual(questsFromModules({ x: { default: { q1: { title: 'One' } } }, y: { default: { q2: { title: 'Two' } } } }), { q1: { title: 'One' }, q2: { title: 'Two' } });
});

test('trigger types only match their own kind and target', () => {
  const { state } = fresh({ minute: 600 });
  const cat = buildCatalog([
    ev('enter_sq'), ev('enter_bk', { trigger: { type: 'enterMap', map: 'bakery' } }),
    ev('talk_nina', { trigger: { type: 'talk', npc: 'nina' } }), ev('talk_elise', { trigger: { type: 'talk', npc: 'elise' } }),
    ev('use_bench', { trigger: { type: 'interact', id: 'bench' } }), ev('on_wake', { trigger: { type: 'wake' } }),
    ev('on_sleep', { trigger: { type: 'sleep' } }), ev('on_auto', { trigger: { type: 'auto' } }),
  ]);
  const q = (trigger) => ids(listEligible(state, trigger, { map: 'town_square' }, cat));
  assert.deepEqual(q(HERE), ['enter_sq']);
  assert.deepEqual(q({ type: 'enterMap', map: 'bakery' }), ['enter_bk']);
  assert.deepEqual(q({ type: 'talk', npc: 'nina' }), ['talk_nina']);
  assert.deepEqual(q({ type: 'interact', id: 'bench' }), ['use_bench']);
  assert.deepEqual(q({ type: 'interact', id: 'lamp' }), []);
  assert.deepEqual(q({ type: 'wake' }), ['on_wake']);
  assert.deepEqual(q({ type: 'sleep' }), ['on_sleep']);
  assert.deepEqual(q({ type: 'auto' }), ['on_auto']);
});

test('trigger.time is a half-open window; trigger.at (clock) needs the minute reached and the right map', () => {
  const { state } = fresh({ minute: 600 });
  const cat = buildCatalog([
    ev('morning', { trigger: { type: 'enterMap', map: 'town_square', time: ['09:00', '11:00'] } }),
    ev('lunch', { trigger: { type: 'enterMap', map: 'town_square', time: ['12:00', '13:00'] } }),
    ev('three_pm', { trigger: { type: 'clock', at: '15:00', map: 'town_square' } }),
  ]);
  const at = (minute, trig, map = 'town_square') => ids(listEligible(state, trig, { minute, map }, cat));
  assert.deepEqual(at(600, HERE), ['morning']);
  assert.deepEqual(at(659, HERE), ['morning']);
  assert.deepEqual(at(660, HERE), []); // 11:00 is excluded
  assert.deepEqual(at(720, HERE), ['lunch']);
  assert.deepEqual(at(899, { type: 'clock' }), []);
  assert.deepEqual(at(900, { type: 'clock' }), ['three_pm']);
  assert.deepEqual(at(1000, { type: 'clock' }), ['three_pm']); // still pending later in the day
  assert.deepEqual(at(1000, { type: 'clock' }, 'bakery'), []); // wrong map
});

test('when-conditions gate eligibility (with ctx map and the event id for chance)', () => {
  const { state } = fresh();
  const cat = buildCatalog([ev('gated', { when: { flag: 'go' } }), ev('mapped', { when: { map: 'town_square' } }), ev('never', { when: { chance: 0 } }), ev('always', { when: { chance: 1 } })]);
  assert.deepEqual(ids(listEligible(state, HERE, { map: 'town_square' }, cat)).sort(), ['always', 'mapped']);
  state.flags.go = true;
  assert.deepEqual(ids(listEligible(state, HERE, { map: 'town_square' }, cat)).sort(), ['always', 'gated', 'mapped']);
  assert.deepEqual(ids(listEligible(state, HERE, { map: 'bakery' }, cat)).sort(), ['always', 'gated']);
});

test('a broken condition makes the event ineligible instead of throwing', () => {
  const { state } = fresh();
  const cat = buildCatalog([ev('broken', { when: { nonsense: 1 } }), ev('fine')]);
  const orig = console.error; console.error = () => {};
  try { assert.deepEqual(ids(listEligible(state, HERE, {}, cat)), ['fine']); } finally { console.error = orig; }
});

test('priority: explicit beats kind default; kinds rank festival > story > romance > friend > random; ties break by id', () => {
  const { state } = fresh();
  assert.equal(priorityOf({ kind: 'festival' }) > priorityOf({ kind: 'story' }), true);
  assert.equal(priorityOf({ kind: 'story' }) > priorityOf({ kind: 'romance' }), true);
  assert.equal(priorityOf({ kind: 'romance' }) > priorityOf({ kind: 'friend' }), true);
  assert.equal(priorityOf({ kind: 'friend' }) > priorityOf({ kind: 'random' }), true);
  assert.equal(priorityOf({ kind: 'random', priority: 99 }), 99);
  const cat = buildCatalog([ev('r', { kind: 'random' }), ev('f', { kind: 'friend' }), ev('s', { kind: 'story' }), ev('fest', { kind: 'festival' }), ev('boost', { kind: 'random', priority: 95 }), ev('a_story', { kind: 'story' })]);
  assert.deepEqual(ids(listEligible(state, HERE, {}, cat)), ['boost', 'fest', 'a_story', 's', 'f', 'r']);
  assert.equal(findEvent(state, HERE, {}, cat).id, 'boost');
  assert.equal(findEvent(state, { type: 'enterMap', map: 'nowhere' }, {}, cat), null);
});

test('repeat modes: once, daily, always', async () => {
  const env = fresh();
  const cat = buildCatalog([ev('once'), ev('daily', { repeat: 'daily' }), ev('always', { repeat: 'always' })]);
  const stage = new MockStage();
  const run = (id) => runEvent(env.state, getEvent(id, cat), { stage, bus: env.bus, opts: env.opts });
  assert.deepEqual(ids(listEligible(env.state, HERE, {}, cat)).sort(), ['always', 'daily', 'once']);
  await run('once'); await run('daily'); await run('always');
  assert.deepEqual(ids(listEligible(env.state, HERE, {}, cat)), ['always']);
  env.state.time.absDay += 1; // next day
  assert.deepEqual(ids(listEligible(env.state, HERE, {}, cat)).sort(), ['always', 'daily']);
  await run('daily');
  assert.equal(env.state.events.seen.daily.count, 2);
  assert.equal(env.state.events.seen.once.count, 1);
});

// ------------------------------------------------------------------ running
test('runEvent marks the event seen BEFORE its script runs, logs it today, emits bus events, calls stage hooks', async () => {
  const env = fresh();
  const log = [];
  env.bus.on('event:started', (p) => log.push(['started', p.id]));
  env.bus.on('event:finished', (p) => log.push(['finished', p.id]));
  class Probe extends MockStage {
    async say(p) { log.push(['say', !!env.state.events.seen.probe]); await super.say(p); }
  }
  const stage = new Probe();
  const e = ev('probe', { script: [D.say('nina', 'neutral', 'Hello'), D.setFlag('done')] });
  await runEvent(env.state, e, { stage, bus: env.bus, opts: env.opts });
  assert.deepEqual(log, [['started', 'probe'], ['say', true], ['finished', 'probe']]);
  assert.deepEqual(env.state.daily.events, ['probe']);
  assert.deepEqual(env.state.events.seen.probe, { count: 1, lastAbsDay: env.state.time.absDay });
  assert.equal(env.state.flags.done, true);
  assert.deepEqual(stage.of('begin').concat(stage.of('end')).map((l) => [l.type, l.id]), [['begin', 'probe'], ['end', 'probe']]);
});

test('a crashing script still finishes cleanly (end hook + finished event) and stays seen', async () => {
  const env = fresh();
  let finished = 0;
  env.bus.on('event:finished', () => finished++);
  class Boom extends MockStage { async say() { throw new Error('stage exploded'); } }
  const stage = new Boom();
  const orig = console.error; console.error = () => {};
  try { await runEvent(env.state, ev('boom', { script: [D.say('nina', 'neutral', 'x')] }), { stage, bus: env.bus, opts: env.opts }); } finally { console.error = orig; }
  assert.equal(finished, 1); assert.equal(stage.count('end'), 1);
  assert.ok(env.state.events.seen.boom);
});

test('catalogStats counts by kind and id prefix', () => {
  const s = catalogStats(buildCatalog([ev('main_a'), ev('main_b'), ev('nina_a', { kind: 'romance' }), ev('fest_x', { kind: 'festival' })]));
  assert.equal(s.total, 4); assert.deepEqual(s.byKind, { story: 2, romance: 1, festival: 1 });
  assert.deepEqual(s.byPrefix, { main: 2, nina: 1, fest: 1 });
});

// ------------------------------------------------------------------ dialogue
const POOLS = buildPools({
  nina: {
    default: {
      npc: 'nina',
      talk: [
        { say: ['Default chat.'] },
        { when: { weather: 'rain' }, priority: 20, say: [['sad', 'Ugh, rain.']] },
        { when: { hearts: ['nina', '>=', 3] }, priority: 30, say: [['happy', 'Hey you!'], 'Want to run later?'] },
      ],
      repeat: [{ say: ['Again? Hi.'] }],
      gift: {
        loves: ['sunflower'], likes: ['cookie'], dislikes: ['soda'], hates: ['bread'],
        lines: { loves: [['happy', 'Sunflowers!']], hates: [['angry', 'Bread?! Really?']], birthday: [['happy', 'You remembered my birthday!']] },
      },
    },
  },
  elise: { default: [{ npc: 'elise', talk: [{ priority: 10, say: ['A.'] }, { priority: 10, say: ['B.'] }, { priority: 10, say: ['C.'] }] }] },
});

test('buildPools accepts a pool or an array of pools per module', () => {
  assert.deepEqual(Object.keys(POOLS).sort(), ['elise', 'nina']);
  assert.deepEqual(validateDialoguePool(POOLS.nina), []);
});

test('pickTalk: highest eligible priority wins; lines are normalised to {face,text}', () => {
  const { state } = fresh({ seed: 3 });
  let t = pickTalk(state, 'nina', { pools: POOLS });
  assert.deepEqual(t.lines, [{ face: 'neutral', text: 'Default chat.' }]); assert.equal(t.fallback, false);
  state.weather.today = 'rain';
  t = pickTalk(state, 'nina', { pools: POOLS });
  assert.deepEqual(t.lines, [{ face: 'sad', text: 'Ugh, rain.' }]);
  state.relationships.nina.friendship = 30; // 3 hearts outranks the rain line (priority 30 > 20)
  t = pickTalk(state, 'nina', { pools: POOLS });
  assert.deepEqual(t.lines, [{ face: 'happy', text: 'Hey you!' }, { face: 'neutral', text: 'Want to run later?' }]);
});

test('pickRepeat uses the repeat pool and falls back to talk when it has none or none match', () => {
  const { state } = fresh({ seed: 3 });
  assert.equal(pickRepeat(state, 'nina', { pools: POOLS }).lines[0].text, 'Again? Hi.');
  const r = pickTalk(state, 'elise', { pools: POOLS, first: false }); // elise has no repeat pool
  assert.ok(['A.', 'B.', 'C.'].includes(r.lines[0].text)); assert.equal(r.fallback, false);
});

test('ties are broken deterministically per day and spread across entries over time', () => {
  const pick = (seed, day) => { const { state } = fresh({ seed }); state.time.absDay = day; return pickTalk(state, 'elise', { pools: POOLS }).lines[0].text; };
  assert.equal(pick(5, 10), pick(5, 10));
  const seen = new Set(); for (let d = 0; d < 60; d++) seen.add(pick(5, d));
  assert.deepEqual([...seen].sort(), ['A.', 'B.', 'C.']);
});

test('NPCs without a pool (or with nothing eligible) get a non-empty fallback line suited to their kind', () => {
  const { state } = fresh();
  for (const npc of ['jules', 'ms_delaney', 'roz', 'biscuit', 'some_extra']) {
    const t = pickTalk(state, npc, { pools: {} });
    assert.equal(t.fallback, true); assert.ok(t.lines.length === 1 && t.lines[0].text.length > 0, npc);
  }
  state.weather.today = 'sunny';
  const onlyRain = buildPools({ x: { default: { npc: 'jules', talk: [{ when: { weather: 'storm' }, say: ['Storm!'] }] } } });
  assert.equal(pickTalk(state, 'jules', { pools: onlyRain }).fallback, true);
});

test('gifts: taste lookup, reaction lines, consumption, once-per-day, failures carry no lines', () => {
  const env = fresh({ seed: 9 });
  const { state, opts } = env;
  assert.equal(giftTaste('nina', 'sunflower', POOLS), 'loves');
  assert.equal(giftTaste('nina', 'bread', POOLS), 'hates');
  assert.equal(giftTaste('nina', 'umbrella', POOLS), 'neutral');
  assert.deepEqual(prefsFromPools(POOLS).nina.gift.loves, ['sunflower']);
  state.inventory.sunflower = 1; state.inventory.cookie = 1; state.inventory.bread = 1; state.inventory.soda = 1;

  const loved = giftReaction(state, 'nina', 'sunflower', { pools: POOLS, bus: env.bus });
  assert.equal(loved.ok, true); assert.equal(loved.kind, 'loves'); assert.ok(loved.delta > 0);
  assert.deepEqual(loved.lines, [{ face: 'happy', text: 'Sunflowers!' }]);
  assert.equal(state.inventory.sunflower, undefined); // consumed
  assert.ok(state.relationships.nina.friendship > 0);
  assert.equal(named(env.events, 'gift:given').length, 1);

  const again = giftReaction(state, 'nina', 'cookie', { pools: POOLS, bus: env.bus });
  assert.equal(again.ok, false); assert.equal(again.reason, 'already_gifted'); assert.deepEqual(again.lines, []);
  assert.equal(state.inventory.cookie, 1); // not consumed on failure

  state.relationships.nina.giftedToday = false;
  const liked = giftReaction(state, 'nina', 'cookie', { pools: POOLS, bus: env.bus }); // 'likes' has no pool line: generic fallback
  assert.equal(liked.kind, 'likes'); assert.equal(liked.lines.length, 1); assert.ok(liked.lines[0].text.length > 0);

  state.relationships.nina.giftedToday = false;
  const hated = giftReaction(state, 'nina', 'bread', { pools: POOLS, bus: env.bus });
  assert.equal(hated.kind, 'hates'); assert.ok(hated.delta < 0); assert.deepEqual(hated.lines, [{ face: 'angry', text: 'Bread?! Really?' }]);

  assert.equal(giftReaction(state, 'nina', 'candy', { pools: POOLS }).reason, 'no_item');
  assert.equal(giftReaction(state, 'nobody', 'bread', { pools: POOLS }).reason, 'unknown_npc');
  assert.equal(giftReaction(state, 'nina', 'not_an_item', { pools: POOLS }).reason, 'unknown_item');
  assert.equal(opts.bus, env.bus);
});

// ------------------------------------------------------------------ endings
test('composeEnding filters by condition and orders by group, then order, then id', () => {
  const { state } = fresh();
  state.flags.saved = true; state.relationships.nina.friendship = 90;
  const slides = [
    { id: 'z_final', group: 'final', order: 1, when: undefined, text: 'The end.' },
    { id: 'main_saved', group: 'main', order: 10, when: { flag: 'saved' }, text: 'Saved.' },
    { id: 'main_lost', group: 'main', order: 10, when: { noFlag: 'saved' }, text: 'Lost.' },
    { id: 'nina_best', group: 'romance', order: 5, when: { hearts: ['nina', '>=', 8] }, text: 'Nina.' },
    { id: 'club_b', group: 'club', order: 20, text: 'B' }, { id: 'club_a', group: 'club', order: 20, text: 'A' },
    { id: 'main_early', group: 'main', order: 1, text: 'Early.' },
    { id: 'weird', group: 'mystery', text: 'Unknown group sorts last.' },
  ];
  assert.deepEqual(ids(composeEnding(state, slides)), ['main_early', 'main_saved', 'nina_best', 'club_a', 'club_b', 'z_final', 'weird']);
  assert.deepEqual(GROUP_ORDER, ['main', 'romance', 'academic', 'club', 'friends', 'final']);
  assert.deepEqual(composeEnding(state, []), []);
  assert.deepEqual(ids(slidesFromModules({ a: { default: { slides: [{ id: 'one' }] } }, b: { default: { slides: [{ id: 'two' }] } }, c: {} })), ['one', 'two']);
});

// ------------------------------------------------------------------ glue
test('createEventSystem binds everything to a sim and upgrades its condition evaluator', async () => {
  const env = fresh({ seed: 11, minute: 600 });
  const sim = createSim(env.state, { bus: env.bus, storage: env.storage, fallback: env.fallback, hooks: env.hooks, prefs: {}, schedules: {} });
  const catalog = buildCatalog([
    ev('intro', { kind: 'story', script: [D.say('nina', 'happy', 'Welcome!'), D.friend('nina', 10), D.quest('q_intro', 'start'), D.setFlag('intro_done')] }),
    ev('gated', { kind: 'random', when: { flag: 'intro_done' }, script: [D.setFlag('gated_done')] }),
  ]);
  const es = createEventSystem(sim, { catalog, pools: POOLS, slides: [{ id: 's', group: 'main', when: { flag: 'intro_done' } }], quests: { q_intro: { title: 'Intro' } } });

  // the schedule evaluator now understands leaves the T7a fallback did not (e.g. rank, hearts of nobody-met, quest)
  assert.equal(sim.ctx.evalCond({ quest: ['q_intro', 'none'] }, env.state, {}), true);
  assert.equal(es.conditions.evaluate({ flag: 'intro_done' }), false);

  const stage = new MockStage();
  assert.deepEqual(ids(es.events.listEligible(HERE, { map: 'town_square' })), ['intro']);
  const first = es.events.find(HERE, { map: 'town_square' });
  await es.events.run(first, stage);
  assert.equal(env.state.flags.intro_done, true);
  assert.equal(env.state.relationships.nina.friendship, 10);
  assert.equal(env.state.quests.q_intro.state, 'active');
  assert.ok(named(env.events, 'toast').some(([, p]) => p.text === 'New quest: Intro'));
  assert.deepEqual(ids(es.events.listEligible(HERE, { map: 'town_square' })), ['gated']);
  assert.equal(await es.events.runById('gated', stage), true);
  assert.equal(await es.events.runById('missing', stage), false);
  assert.equal(es.events.stats().total, 2);
  assert.equal(es.dialogue.talk('nina').lines.length >= 1, true);
  assert.equal(es.dialogue.repeat('nina').lines[0].text, 'Again? Hi.');
  assert.deepEqual(ids(es.endings.compose()), ['s']);
  const direct = await es.interpreter.run([D.setFlag('via_interpreter')], new MockStage());
  assert.equal(direct.ended, false); assert.equal(env.state.flags.via_interpreter, true);
});
