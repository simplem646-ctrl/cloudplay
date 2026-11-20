// Interpreter: every op in OPS has a handler and behaves; error handling and budgets.
import test from 'node:test';
import assert from 'node:assert/strict';
import { runScript, HANDLERS, MAX_OPS } from '../../src/sim/interpreter.js';
import { MockStage } from '../../src/sim/mock_stage.js';
import * as D from '../../src/sim/script_dsl.js';
import { OPS } from '../../src/sim/script_dsl.js';
import { START_MONEY } from '../../src/core/constants.js';
import { fresh, named } from './_helpers.mjs';

async function run(ops, { stage = new MockStage(), quests = {}, seed, ...date } = {}) {
  const env = fresh({ seed, ...date });
  const res = await runScript(ops, { state: env.state, stage, bus: env.bus, quests, opts: env.opts, eventId: 'test_event' });
  return { ...env, stage, res };
}
const quiet = async (fn) => { const o = console.error; console.error = () => {}; try { return await fn(); } finally { console.error = o; } };

test('the interpreter implements exactly the ops of the DSL', () => {
  assert.deepEqual(Object.keys(HANDLERS).sort(), Object.keys(OPS).sort());
});

test('dialogue ops go to the stage; characters become "met"; narrator does not', async () => {
  const r = await run([D.say('nina', 'happy', 'Hi!'), D.say('narrator', 'neutral', 'The wind.'), D.narrate('Plain.'), D.think('Hm.')]);
  assert.deepEqual(r.stage.of('say').map((l) => [l.who, l.face, l.text]), [['nina', 'happy', 'Hi!'], ['narrator', 'neutral', 'The wind.']]);
  assert.equal(r.stage.of('narrate')[0].text, 'Plain.');
  assert.equal(r.stage.of('think')[0].text, 'Hm.');
  assert.equal(r.state.relationships.nina.met, true);
  assert.equal(r.res.ended, false);
});

test('say defaults the face to neutral', async () => {
  const r = await run([{ op: 'say', who: 'elise', text: 'Oh.' }]);
  assert.equal(r.stage.of('say')[0].face, 'neutral');
});

test('choice: runs the picked branch, stores indices, filters options by condition', async () => {
  const ops = [D.choice([
    D.opt('A', [D.setFlag('picked_a')]),
    D.opt('B', [D.setFlag('picked_b')]),
    D.opt('C (locked)', [D.setFlag('picked_c')], { flag: 'unlock_c' }),
  ], 'pick')];
  const r1 = await run(ops, { stage: new MockStage({ choices: [1] }) });
  assert.equal(r1.state.flags.picked_b, true); assert.equal(r1.state.flags.picked_a, undefined);
  assert.deepEqual(r1.stage.of('choice')[0].labels, ['A', 'B']); // locked option hidden
  assert.equal(r1.res.vars.pick, 1);
  const r2 = await run(ops, { stage: new MockStage({ choices: [99] }) }); // out-of-range answers clamp
  assert.equal(r2.state.flags.picked_b, true);
  // unlocked: three labels, index 2 is the third option
  const env = fresh(); env.state.flags.unlock_c = true;
  await runScript(ops, { state: env.state, stage: new MockStage({ choices: [2] }), bus: env.bus, opts: env.opts });
  assert.equal(env.state.flags.picked_c, true);
});

test('if / else / end', async () => {
  const r = await run([
    D.iff({ flag: 'x' }, [D.setFlag('then')], [D.setFlag('else')]),
    D.iff({ flag: 'x' }, [D.setFlag('never')]),
    D.end(),
    D.setFlag('after_end'),
  ]);
  assert.equal(r.state.flags.else, true);
  assert.equal(r.state.flags.then, undefined); assert.equal(r.state.flags.never, undefined);
  assert.equal(r.state.flags.after_end, undefined);
  assert.equal(r.res.ended, true);
});

test('end inside a choice branch stops the whole script', async () => {
  const r = await run([D.choice([D.opt('stop', [D.end()])]), D.setFlag('after')]);
  assert.equal(r.state.flags.after, undefined);
});

test('staging ops are forwarded to the stage with defaults filled in', async () => {
  const r = await run([
    D.warp('cafe_lantern'), D.place('nina', 'cafe_lantern:counter', 'left'), D.hide('nina'), D.moveTo('elise', 'door'), D.face('nina', 'down'),
    D.face('nina', 'elise'), D.pose('theo', 'sit'), D.emote('nina', 'heart'), D.cam({ focus: 'nina', ms: 400 }), D.fade('out'), D.flash(), D.lighting('dusk'),
    D.sfx('door'), D.music('cafe'), D.musicResume(), D.banner('Day 1', 'Spring'), D.wait(250),
  ]);
  const t = (type) => r.stage.of(type);
  assert.deepEqual(t('warp')[0], { type: 'warp', map: 'cafe_lantern', at: 'entrance', dir: undefined, fade: true });
  assert.equal(t('place')[0].dir, 'left');
  assert.deepEqual([t('moveTo')[0].speed, t('moveTo')[0].wait], ['walk', true]);
  assert.equal(t('face')[0].dir, 'down'); assert.equal(t('face')[1].toward, 'elise');
  assert.equal(t('pose')[0].pose, 'sit'); assert.equal(t('emote')[0].emote, 'heart');
  assert.equal(t('cam')[0].focus, 'nina');
  assert.deepEqual([t('fade')[0].dir, t('fade')[0].ms, t('fade')[0].color], ['out', 500, '#000000']);
  assert.deepEqual([t('flash')[0].ms, t('flash')[0].color], [300, '#ffffff']);
  assert.equal(t('lighting')[0].preset, 'dusk'); assert.equal(t('sfx')[0].id, 'door');
  assert.deepEqual([t('music')[0].id, t('music')[0].fadeMs], ['cafe', 800]);
  assert.equal(t('musicResume').length, 1);
  assert.deepEqual([t('banner')[0].text, t('banner')[0].sub, t('banner')[0].ms], ['Day 1', 'Spring', 2500]);
  assert.equal(t('wait')[0].ms, 250);
  assert.equal(r.stage.currentMap(), 'cafe_lantern');
});

test('setFlag (default true, explicit values) and club_pick_* joins the club', async () => {
  const r = await run([{ op: 'setFlag', name: 'a' }, D.setFlag('b', false), D.setFlag('c', 7), D.setFlag('club_pick_art')]);
  assert.equal(r.state.flags.a, true); assert.equal(r.state.flags.b, false); assert.equal(r.state.flags.c, 7);
  assert.equal(r.state.school.club, 'art'); assert.equal(r.state.school.clubRank, 0);
  assert.ok(named(r.events, 'toast').some(([, p]) => /Joined the/.test(p.text)));
});

test('counters, friendship, money, energy, stats', async () => {
  const r = await run([
    D.addCounter('visits'), D.addCounter('visits', 2), D.friend('nina', 12), D.friend('theo', 50), D.money(25), D.energy(-10), D.stat('math', 5), D.stat('charm', 3),
  ]);
  assert.equal(r.state.counters.visits, 3);
  assert.equal(r.state.relationships.nina.friendship, 12);
  assert.equal(r.state.relationships.nina.met, true);
  assert.equal(r.state.player.money, START_MONEY + 25);
  assert.equal(r.state.player.energy, r.state.player.maxEnergy - 10);
  assert.equal(r.state.player.subjects.math, 15); assert.equal(r.state.player.traits.charm, 13);
  const toasts = named(r.events, 'toast').map(([, p]) => p.text);
  assert.ok(toasts.some((t) => /Nina/.test(t)), toasts.join('|'));
  assert.ok(toasts.some((t) => /\+\$25/.test(t)));
});

test('friendship and money clamp instead of overflowing', async () => {
  const r = await run([D.friend('nina', 500), D.friend('elise', -50), D.money(-100000)]);
  assert.equal(r.state.relationships.nina.friendship, 100);
  assert.equal(r.state.relationships.elise.friendship, 0);
  assert.equal(r.state.player.money, 0);
});

test('giveItem / takeItem (bag full is handled)', async () => {
  const r = await run([D.giveItem('bread', 3), D.takeItem('bread', 1), D.giveItem('sunflower')]);
  assert.equal(r.state.inventory.bread, 2); assert.equal(r.state.inventory.sunflower, 1);
  assert.ok(named(r.events, 'toast').some(([, p]) => /Fresh Bread x3/.test(p.text)));
  const env = fresh();
  for (let i = 0; i < 30; i++) env.state.inventory[`junk_${i}`] = 1; // fill every stack
  const full = await runScript([D.giveItem('bread')], { state: env.state, stage: new MockStage(), bus: env.bus, opts: env.opts });
  assert.equal(env.state.inventory.bread, undefined);
  assert.ok(named(env.events, 'toast').some(([, p]) => /bag is full/i.test(p.text)));
  assert.equal(full.ended, false);
});

test('time advances the clock', async () => {
  const r = await run([D.advanceTime(45)], { minute: 600 });
  assert.equal(r.state.time.minute, 645);
});

test('quest lifecycle: start, update with notes, complete, fail; start is idempotent', async () => {
  const quests = { q_main: { title: 'Save the School' } };
  const r = await run([D.quest('q_main', 'start', 'Talk to Roz'), D.quest('q_main', 'start'), D.quest('q_main', 'update', 'Found a clue'), D.quest('q_side', 'start'), D.quest('q_side', 'fail')], { quests });
  assert.equal(r.state.quests.q_main.state, 'active');
  assert.deepEqual(r.state.quests.q_main.notes, ['Talk to Roz', 'Found a clue']);
  assert.equal(r.state.quests.q_side.state, 'failed');
  assert.ok(named(r.events, 'toast').some(([, p]) => p.text === 'New quest: Save the School'));
  const done = await run([D.quest('q_main', 'start'), D.quest('q_main', 'complete')], { quests });
  assert.equal(done.state.quests.q_main.state, 'complete');
  assert.ok(named(done.events, 'toast').some(([, p]) => /Quest complete: Save the School/.test(p.text)));
});

test('spirit clamps to 0..100', async () => {
  const r = await run([D.spirit(30), D.spirit(90), D.spirit(-500)]);
  assert.equal(r.state.school.spirit, 0);
  const up = await run([D.spirit(80), D.spirit(80)]);
  assert.equal(up.state.school.spirit, 100);
});

test('romance: dating then single', async () => {
  const env = fresh();
  await runScript([D.romance('nina', 'dating')], { state: env.state, stage: new MockStage(), bus: env.bus, opts: env.opts });
  assert.equal(env.state.romance.partner, 'nina'); assert.ok(env.state.romance.dating.nina); assert.equal(env.state.romance.confessed.nina, true);
  await runScript([D.romance('nina', 'single')], { state: env.state, stage: new MockStage(), bus: env.bus, opts: env.opts });
  assert.equal(env.state.romance.partner, null); assert.equal(env.state.romance.dating.nina, undefined); assert.deepEqual(env.state.romance.exes, ['nina']);
  await runScript([D.romance('nina', 'dating')], { state: env.state, stage: new MockStage(), bus: env.bus, opts: env.opts });
  assert.deepEqual(env.state.romance.exes, []); // dating again removes the ex entry
});

test('call stores score and numeric rank; lastCall var; default result when the stage has none', async () => {
  const stage = new MockStage({ callResults: { track_sprint: { score: 88, rank: 'gold' } } });
  const r = await run([D.callScene('minigame', 'track_sprint', { laps: 2 }, 'sprint'), D.callScene('minigame', 'unknown_game', undefined, 'other')], { stage });
  assert.equal(r.state.counters.sprint, 88); assert.equal(r.state.counters.sprint_rank, 3);
  assert.deepEqual(r.stage.of('call')[0].opts, { laps: 2 });
  assert.equal(r.state.counters.other, 70); assert.equal(r.state.counters.other_rank, 2);
  assert.equal(r.res.vars.lastCall.score, 70);
  const none = await run([D.callScene('minigame', 'x', undefined, 's')], { stage: { ...new MockStage(), call: async () => undefined, currentMap: () => 'x' } });
  assert.equal(none.state.counters.s, 0); assert.equal(none.state.counters.s_rank, 0);
});

test('endGame calls the stage and stops the script', async () => {
  const r = await run([D.endGame(), D.setFlag('after')]);
  assert.equal(r.stage.ended, true); assert.equal(r.state.flags.after, undefined); assert.equal(r.res.ended, true);
});

test('errors never escape: unknown ops and throwing stages end the script and log', async () => {
  await quiet(async () => {
    const bad = await run([D.setFlag('before'), { op: 'nonsense' }, D.setFlag('after')]);
    assert.equal(bad.state.flags.before, true); assert.equal(bad.state.flags.after, undefined); assert.equal(bad.res.ended, true);
    class Throwing extends MockStage { async say() { throw new Error('boom'); } }
    const t = await run([D.setFlag('a'), D.say('nina', 'neutral', 'x'), D.setFlag('b')], { stage: new Throwing() });
    assert.equal(t.state.flags.a, true); assert.equal(t.state.flags.b, undefined); assert.equal(t.res.ended, true);
  });
});

test('op budget stops runaway scripts', async () => {
  await quiet(async () => {
    const r = await run(Array.from({ length: MAX_OPS + 50 }, () => D.wait(1)));
    assert.equal(r.res.ended, true);
    assert.equal(r.stage.count('wait'), MAX_OPS);
  });
});

test('nested ifs and choices compose', async () => {
  const r = await run([
    D.iff({ year: 1 }, [D.choice([D.opt('go', [D.iff({ flag: 'never' }, [D.setFlag('no')], [D.setFlag('deep')])])])]),
  ]);
  assert.equal(r.state.flags.deep, true);
});
