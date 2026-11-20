// Content smoke test: every event in the registry catalog is executed against a MockStage with several choice policies and
// must not log an interpreter error, throw, or blow the op budget. (Conditions are NOT forced: this proves the scripts run, the
// validator proves their shape.) Passes trivially while the catalog is empty.
import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultCatalog, catalogStats } from '../../src/sim/events.js';
import { runScript } from '../../src/sim/interpreter.js';
import { MockStage } from '../../src/sim/mock_stage.js';
import { defaultQuests } from '../../src/sim/events.js';
import { fresh } from '../sim/_helpers.mjs';

const POLICIES = {
  first: () => 0,
  last: (labels) => labels.length - 1,
  alternate: (labels, n) => n % labels.length,
  second: (labels) => Math.min(1, labels.length - 1),
};

async function runOnce(ev, policyName, quests) {
  const env = fresh({ seed: 99, year: ev.smokeYear || 2, season: 'autumn', day: 9, minute: 600 });
  const { state } = env;
  for (const id of Object.keys(state.relationships)) { state.relationships[id].friendship = 70; state.relationships[id].met = true; }
  state.player.energy = 100; state.player.money = 500; state.school.spirit = 50;
  const stage = new MockStage({ choicePolicy: POLICIES[policyName], map: ev.trigger && ev.trigger.map || 'town_square' });
  const errors = [];
  const orig = console.error; console.error = (...a) => errors.push(a.map((x) => (x && x.message) || String(x)).join(' '));
  try { await runScript(ev.script, { state, stage, bus: env.bus, quests, eventId: ev.id, opts: env.opts }); } catch (e) { errors.push(`THROWN ${e.message}`); } finally { console.error = orig; }
  return { errors, ops: stage.log.length };
}

test('every event script runs to completion against a MockStage under four choice policies', async () => {
  const catalog = defaultCatalog();
  const quests = defaultQuests();
  const stats = catalogStats(catalog);
  const failures = [];
  let runs = 0;
  for (const ev of catalog.list) {
    for (const policy of Object.keys(POLICIES)) {
      const r = await runOnce(ev, policy, quests);
      runs++;
      if (r.errors.length) failures.push(`${ev.id} [${policy}]: ${r.errors[0]}`);
    }
  }
  if (process.env.SMOKE_VERBOSE) console.log(`events smoke: ${stats.total} events, ${runs} runs`, JSON.stringify(stats.byKind));
  assert.deepEqual(failures, []);
});
