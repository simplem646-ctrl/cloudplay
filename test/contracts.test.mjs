// Contract self-checks: the shared data files the whole project builds on.
import test from 'node:test';
import assert from 'node:assert/strict';
import { CAST, EXTRAS, validateCast, ROMANCE_IDS, NPC_IDS } from '../src/data/cast.js';
import { FESTIVALS, EXAMS, BREAKS, festivalOn, breakOn, examDayInfo } from '../src/data/calendar.js';
import { MAP_IDS, MUSIC_IDS, SFX_IDS } from '../src/data/ids.js';
import { createNewGame, validateState } from '../src/sim/state.js';
import * as dsl from '../src/sim/script_dsl.js';
import { parseTime, formatTime12, formatTime24 } from '../src/core/util.js';
import { RNG } from '../src/core/rng.js';

test('cast is structurally valid', () => {
  assert.deepEqual(validateCast(), []);
  assert.deepEqual(ROMANCE_IDS, ['nina', 'elise', 'clara', 'mari', 'vera']);
  assert.ok(NPC_IDS.includes('roz') && !NPC_IDS.includes('theo'));
  assert.equal(new Set([...CAST, ...EXTRAS].map((c) => c.id)).size, CAST.length + EXTRAS.length);
});

test('calendar data is consistent', () => {
  for (const f of FESTIVALS) {
    assert.ok(f.days.every((d) => d >= 1 && d <= 28), f.id);
    assert.match(f.eventId, /^fest_/);
    assert.ok(MAP_IDS.includes(f.place), `${f.id} place ${f.place}`);
  }
  assert.equal(festivalOn('autumn', 28).id, 'bell_festival');
  assert.equal(breakOn('summer', 15).id, 'summer_break');
  assert.equal(breakOn('summer', 14), null);
  assert.deepEqual(examDayInfo('spring', 23).subjects, ['science', 'history']);
  assert.equal(EXAMS.length, 4);
  assert.equal(BREAKS.length, 2);
});

test('new game state validates and is JSON-safe', () => {
  const st = createNewGame({ seed: 7 });
  assert.deepEqual(validateState(st), []);
  assert.deepEqual(JSON.parse(JSON.stringify(st)), st);
  assert.equal(st.relationships.roz.met, true);
  assert.equal(Object.keys(st.relationships).length, NPC_IDS.length);
});

test('script DSL builders produce valid ops; validator catches mistakes', () => {
  const ctx = { npcIds: new Set([...CAST, ...EXTRAS].map((c) => c.id)), mapIds: new Set(MAP_IDS) };
  const script = [
    dsl.fade('in', 400), dsl.place('nina', 'spot_a', 'down'), dsl.say('nina', 'happy', 'Hey, Newbie!'),
    dsl.choice([dsl.opt('Hi', [dsl.friend('nina', 2)]), dsl.opt('Hm.', [dsl.setFlag('nina_cold')])]),
    dsl.iff({ hearts: ['nina', '>=', 4] }, [dsl.emote('nina', 'heart')]), dsl.warp('school_rooftop'),
  ];
  assert.deepEqual(dsl.validateScript(script, ctx), []);
  assert.ok(dsl.validateScript([{ op: 'say', who: 'nobody', text: 'x' }], ctx).length > 0);
  assert.ok(dsl.validateScript([{ op: 'bogus' }], ctx).length > 0);
  assert.ok(dsl.validateCondition({ hearts: ['nina', '>=', 'x'] }, ctx).length > 0);
  assert.deepEqual(dsl.validateCondition({ all: [{ flag: 'a' }, { not: { year: [1, 2] } }] }, ctx), []);
  const ev = { id: 'nina_test', title: 'T', kind: 'romance', trigger: { type: 'talk', npc: 'nina' }, script };
  assert.deepEqual(dsl.validateEvent(ev, ctx), []);
  assert.ok(dsl.validateEvent({ ...ev, trigger: { type: 'nope' } }, ctx).length > 0);
});

test('ids, time helpers and RNG', () => {
  assert.equal(MAP_IDS.length, 26);
  assert.equal(new Set(MUSIC_IDS).size, MUSIC_IDS.length);
  assert.equal(new Set(SFX_IDS).size, SFX_IDS.length);
  assert.equal(parseTime('08:30'), 510);
  assert.equal(formatTime12(15 * 60 + 5), '3:05 PM');
  assert.equal(formatTime24(25 * 60), '01:00');
  const a = new RNG(5), b = new RNG(5);
  assert.deepEqual([a.next(), a.int(1, 9)], [b.next(), b.int(1, 9)]);
});
