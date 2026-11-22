// Static obtainability / reachability analysis of the real content (tools/analyze-content.mjs): zero blockers, plus
// negative controls proving the analyzer would actually notice broken content.
import test from 'node:test';
import assert from 'node:assert/strict';
const ROOT = new URL('../../', import.meta.url).pathname;
const { analyze, formatReport } = await import(`${ROOT}tools/analyze-content.mjs`);
const { Data } = await import(`${ROOT}src/data/index.js`);

const clone = () => {
  const d = JSON.parse(JSON.stringify(Data));
  d.getItem = (id) => d.items[id] || null;
  return d;
};

test('content: zero obtainability blockers; every quest can start and be finished in Year 1', () => {
  const res = analyze(Data);
  assert.deepEqual(res.blockers, [], formatReport(res));
  assert.equal(res.facts.lanterns, 6);
  assert.equal(res.facts.startable.length, Object.keys(Data.quests).length);
  assert.equal(res.facts.done.length, Object.keys(Data.quests).length);
});

test('content: warnings are only the known, accepted kinds', () => {
  const res = analyze(Data);
  assert.deepEqual(res.warnings, [], res.warnings.join('\n'));
});

test('analyzer negative control: an item with no source is a blocker', () => {
  const d = clone();
  d.quests.m3_baker.stages[2].goal.item = 'rusty_can'; // never obtainable
  const res = analyze(d);
  assert.ok(res.blockers.some((b) => /m3_baker stage 2/.test(b) && /rusty_can/.test(b)), res.blockers.join('\n'));
});

test('analyzer negative control: unsatisfiable unlocks, missing call targets and impossible goals are blockers', () => {
  const d = clone();
  d.quests.m5_sailor.unlock = [{ quest: { id: 'm2_journal', state: 'done' } }, { dateFrom: { season: 'winter', day: 5 } }, { dateTo: { season: 'summer', day: 2 } }];
  d.quests.m4_reader.stages[1].goal = { type: 'flag', flag: 'nobody_sets_this' };
  d.quests.m6_cafe.stages[2].goal = { type: 'hearts', npc: 'rhea', hearts: 12 };
  d.quests.m7_stargazer.reward.script = [{ call: 'no_such_script' }];
  d.quests.m3_baker.stages[1].goal = { type: 'job', job: 'lamplighter_nope', times: 1 };
  d.quests.s_gus_tale.stages[0].goal = { type: 'catch', fish: 'moon_whale', qty: 1 };
  d.quests.s_theo_parcel.stages[0].goal = { type: 'visit', area: 'harbor', anchor: 'no_such_anchor' };
  d.quests.s_celeste_lunch.stages[0].goal = { type: 'give', npc: 'celeste', item: 'workshop_key', qty: 1 }; // key items cannot be gifted
  const res = analyze(d);
  const text = res.blockers.join('\n');
  for (const re of [/s_celeste_lunch stage 0.*key item/, /m5_sailor/, /m4_reader stage 1/, /m6_cafe stage 2/, /no_such_script/, /m3_baker stage 1/, /s_gus_tale stage 0/, /s_theo_parcel stage 0/]) assert.match(text, re);
});

test('analyzer negative control: a quest nothing starts, and a shop that is closed every day', () => {
  const d = clone();
  delete d.quests.m9_festival.unlock;
  d.quests.m8_greatlantern.reward.script = [];
  d.buildings.general_store.closedDays = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
  d.quests.s_willa_ink.stages[0].goal.item = 'plank';
  const res = analyze(d);
  const text = res.blockers.join('\n');
  assert.match(text, /m9_festival can never start/);
  assert.match(text, /shop general_store is unreachable/);
});

test('analyzer: peddler stock is only offered Saturday/Sunday', () => {
  const res = analyze(Data);
  assert.deepEqual(res.facts.shopAvail.peddler.days.sort(), ['sat', 'sun']);
});
