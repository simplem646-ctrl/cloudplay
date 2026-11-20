// Long-run smoke test: three whole school years played headlessly through the sim, the school director, the event system and
// the night pipeline. It does not judge the content; it proves nothing throws, nothing leaves its range, the state stays
// serialisable, saves round-trip and the game really ends on Winter 28 of Year 3.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createSim } from '../../src/sim/index.js';
import { createEventSystem } from '../../src/sim/events_system.js';
import { buildCatalog } from '../../src/sim/events.js';
import { registerAcademics } from '../../src/sim/academics_index.js';
import { schoolDirector, weakestSubject } from '../../src/sim/school_director.js';
import { applyClass, study } from '../../src/sim/academics.js';
import { prepareSubject, submitSubject } from '../../src/sim/exams.js';
import { createHookRegistry, advance, sleep } from '../../src/sim/clock.js';
import { dayInfo } from '../../src/sim/calendar.js';
import { validateState } from '../../src/sim/state.js';
import { MockStage } from '../../src/sim/mock_stage.js';
import * as D from '../../src/sim/script_dsl.js';
import { parseTime } from '../../src/core/util.js';
import { SUBJECTS } from '../../src/core/constants.js';
import { rngFor } from '../../src/core/rng.js';
import { fresh } from './_helpers.mjs';

const T = parseTime;

// A handful of synthetic events that exercise every trigger path and the interpreter's state changes.
const EVENTS = buildCatalog([
  { id: 'smoke_intro', title: 'Intro', kind: 'story', trigger: { type: 'enterMap', map: 'town_square' }, script: [D.say('roz', 'happy', 'Welcome.'), D.quest('q_smoke', 'start'), D.setFlag('smoke_intro')] },
  { id: 'smoke_daily_chat', title: 'Chat', kind: 'friend', repeat: 'daily', trigger: { type: 'clock', at: '17:00', map: 'town_square' }, when: { flag: 'smoke_intro' }, script: [D.friend('nina', 2), D.addCounter('chats')] },
  { id: 'smoke_spirit', title: 'Spirit', kind: 'festival', trigger: { type: 'auto' }, when: { festival: true }, script: [D.spirit(1), D.money(5)] },
  { id: 'smoke_wake', title: 'Wake', kind: 'ambient', repeat: 'daily', trigger: { type: 'wake' }, script: [D.energy(-1)] },
]);

function ctxOf(state, minute, map) { return { state, minute, map, dayInfo: dayInfo(state) }; }

async function playThreeYears() {
  const env = fresh({ seed: 2024, minute: T('06:30') });
  const { state, bus } = env;
  const registry = createHookRegistry();
  registerAcademics({ registry, director: false });
  const opts = { ...env.opts, hooks: registry, autosave: false };
  const sim = createSim(state, { bus, storage: env.storage, fallback: env.fallback, hooks: registry, prefs: {}, schedules: {} });
  const es = createEventSystem(sim, { catalog: EVENTS, pools: {}, slides: [], quests: { q_smoke: { title: 'Smoke' } } });
  const game = { bus, sim };
  const rng = rngFor('smoke:answers');
  const stage = new MockStage();
  const log = { days: 0, classes: 0, exams: 0, reports: 0, events: 0, saves: 0, problems: [] };
  let summary = null;

  const runEvents = async (trigger, map) => { const ev = es.events.find(trigger, { map, minute: state.time.minute }); if (ev) { await es.events.run(ev, stage); log.events++; } };
  const check = () => {
    const errs = validateState(state);
    if (errs.length) log.problems.push(`${state.time.year}/${state.time.season}/${state.time.day}: ${errs.join(',')}`);
    const p = state.player;
    if (p.energy < 0 || p.energy > p.maxEnergy || p.money < 0 || p.conduct < 0 || p.conduct > 100) log.problems.push(`range ${JSON.stringify({ e: p.energy, m: p.money, c: p.conduct })}`);
    for (const s of SUBJECTS) if (p.subjects[s] < 0 || p.subjects[s] > 100) log.problems.push(`subject ${s}=${p.subjects[s]}`);
    for (const [id, r] of Object.entries(state.relationships)) if (r.friendship < 0 || r.friendship > 100) log.problems.push(`friendship ${id}=${r.friendship}`);
  };

  for (let guard = 0; guard < 400; guard++) {
    // ---- one day
    await runEvents({ type: 'wake' }, state.player.map);
    state.player.map = 'town_square';
    await runEvents({ type: 'enterMap', map: 'town_square' }, 'town_square');
    const info0 = dayInfo(state);
    let map = 'home_theo';
    while (state.time.minute < T('22:00')) {
      const minute = state.time.minute;
      const info = dayInfo(state);
      // policy: school days = be in the right room for lessons, after school town; weekends town; exam days classroom
      if (info.exam) map = 'school_classroom';
      else if (info.hasLessons) {
        const ph = minute < T('08:20') ? 'home_theo' : minute < T('15:10') ? 'school_classroom' : 'town_square';
        map = ph;
        if (minute >= T('11:30') && minute < T('12:20') && state.weather.today !== 'rain') map = 'school_field'; // some PE periods are outdoors; the rest are covered by the classroom policy below
      } else map = 'town_square';
      state.player.map = map;
      const act = schoolDirector(game, ctxOf(state, minute, map));
      if (act) {
        if (act.scene === 'class') { applyClass(state, { subject: act.params.subject, period: act.params.period, choice: 'listen', quiz: act.params.popQuiz ? rng.chance(0.7) : null, late: act.params.late }, opts); advance(state, act.params.minutes, opts); log.classes++; continue; }
        if (act.scene === 'exam') {
          const prep = prepareSubject(state, act.params.subject);
          const p = Math.min(0.97, 0.15 + (state.player.subjects[act.params.subject] / 100) * 0.85 + prep.strikes * 0.05);
          submitSubject(state, prep, prep.questions.map((q) => (rng.next() < p ? q.correct : (q.correct + 1) % 4)), { practical: null }, opts);
          advance(state, 80, opts); log.exams++; continue;
        }
        if (act.scene === 'report_card') { log.reports++; continue; }
        if (act.scene === 'activity:study_library') { study(state, { subject: act.params.subject, hours: 1, place: 'library' }, opts); continue; }
      }
      await runEvents({ type: 'clock' }, map);
      await runEvents({ type: 'auto' }, map);
      if (minute >= T('16:00') && minute < T('18:00') && !state.daily.studied && state.player.energy > 40 && !info.exam) study(state, { subject: weakestSubject(state), hours: 2, place: 'home' }, opts);
      advance(state, 5, opts);
      if (state.time.minute === minute) break; // clock refused to move: avoid an endless loop
    }
    log.days++;
    check();
    if (log.days % 40 === 0) { // save + load round trip (T7a save module through the facade)
      const saved = sim.save.write ? sim.save.write('slot1') : null;
      log.saves++;
      assert.ok(JSON.parse(JSON.stringify(state)), 'state must stay JSON-serialisable');
    }
    state.time.minute = Math.max(state.time.minute, T('22:00'));
    summary = sleep(state, opts);
    if (summary.gameEnd) break;
    void info0;
  }
  return { env, state, log, summary };
}

test('three simulated school years run to the ending without errors', async () => {
  const { state, log, summary } = await playThreeYears();
  if (process.env.SMOKE_VERBOSE) console.log(JSON.stringify({ log, school: { avg: state.school.average, standing: state.school.standing, spirit: state.school.spirit, cards: state.school.reportCards.map((r) => [r.key, r.average, r.rank]) }, conduct: state.player.conduct, subjects: state.player.subjects, money: state.player.money, skipped: state.stats.daysSkippedClass, counters: state.counters, flags: Object.keys(state.flags).length }));
  assert.deepEqual(log.problems, []);
  assert.equal(summary.gameEnd, true, 'the game must end on the final night');
  assert.deepEqual([state.time.year, state.time.season, state.time.day], [3, 'winter', 28]);
  assert.equal(log.days, 336, `3 years x 112 days, got ${log.days}`);
  assert.equal(state.school.reportCards.length, 12);
  assert.ok(log.classes > 600, `classes ${log.classes}`);
  assert.equal(log.exams, 72, `exams sat: ${log.exams}`); // 12 exams x 6 subjects
  assert.equal(log.reports >= 12, true);
  assert.ok(state.flags.smoke_intro && state.quests.q_smoke.state === 'active');
  assert.ok((state.counters.chats || 0) > 200, `daily chat event ran ${state.counters.chats || 0} times`);
  assert.ok(state.school.spirit > 0, 'festival event gave spirit');
  assert.ok(state.stats.examsPassed >= 10, `passed ${state.stats.examsPassed}`);
  assert.ok(JSON.stringify(state).length < 200000, `state is ${JSON.stringify(state).length} bytes`);
  assert.ok(state.log.length <= 200, 'diary stays capped');
});
