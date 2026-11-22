// End-to-end story completability: a scripted "natural player" plays Lanternbrook Days from a new game to the Winter 24
// ending through gameplay-level entry points only (see fixtures/sys-story-player.mjs for what is real and what is faked).
// Real: systems, content, headless areas, schedules, shops, forage/fishing handlers, jobs, events, quests, mail.
// Faked (no WebGL): walking (teleport between areas; no travel time), minigames (always succeed), UI.
import test from 'node:test';
import assert from 'node:assert/strict';
import * as P from './fixtures/sys-story-player.mjs';
const { svc, Game, Data, Sys } = P;

const DEBUG = !!process.env.STORY_DEBUG;
const warns = [];
const errors = [];
const origWarn = console.warn;
const origErr = console.error;
console.warn = (...a) => { warns.push(a.join(' ').slice(0, 200)); if (DEBUG) origWarn(...a); };
console.error = (...a) => { errors.push(a.join(' ').slice(0, 200)); origErr(...a); };

const T = (name, fn) => test(name, { timeout: 120000 }, async () => {
  warns.length = 0; errors.length = 0;
  const t0 = Date.now();
  await fn();
  if (DEBUG) origWarn(`   (${name}: ${Date.now() - t0} ms)`);
});
const step = (msg) => { if (DEBUG) origWarn(`  - ${msg}  [${P.dateStr()}] money=${P.money()}`); };

async function newGame() {
  const env = P.bootStory({ log: DEBUG });
  await P.pump(svc.director.newGame({ name: 'Kai' }));
  await P.settle();
  return env;
}

const quests = () => Game.state.quests;
const assertClean = () => {
  assert.deepEqual(errors, [], 'console.error during the run');
  assert.deepEqual(warns, [], 'console.warn during the run:\n' + warns.join('\n'));
  assert.equal(Game.mode, 'field');
};

/** Tutorial + the first days. Leaves the player at Spring 3, morning, journal found. */
async function playTutorial() {
  assert.ok(P.flag('prologue_done'), 'prologue ran by itself');
  assert.ok(svc.quests.isActive('t_meet_town') && svc.quests.isActive('m1_arrival'));
  for (const q of ['t_first_shift', 't_first_catch', 't_forage']) assert.ok(svc.quests.isActive(q), `${q} auto-started after the prologue`);
  step('first bakery shift');
  await P.shift();
  assert.ok(P.questDone('t_first_shift'), 'first shift finishes the tutorial quest');
  step('say hello to six villagers');
  for (const npc of ['hattie', 'theo', 'mira', 'barnaby', 'nana_fen', 'willa']) await P.talk(npc);
  assert.ok(P.questDone('t_meet_town') && P.flag('met_town'));
  step('fishing hut -> rod -> first catch');
  await P.whenOpen('fishing_hut', 9 * 60);
  await P.go('fishing_hut', 'counter_front');
  assert.ok(P.has('fishing_rod') && P.has('bait', 5), 'Gus lends a rod and bait');
  await P.fish('harbor', () => true, 1);
  assert.ok(P.questDone('t_first_catch'));
  step('forage three things');
  await P.forageUntil(['brook_lane', 'riverside_park'], null, () => P.questDone('t_forage'));
  step('cottage + noticeboard, sleep until Spring 3');
  await P.go('cottage', 'from_brook_lane');
  await P.go('town_square', 'noticeboard_spot');
  await P.nextDay();
  await P.nextDay();
  assert.equal(`${Game.state.time.season}.${Game.state.time.day}`, '0.3');
  assert.ok(P.flag('journal_found') && P.has('tobias_journal'), 'journal found on Spring 3 morning at the cottage');
  assert.ok(P.questDone('m1_arrival'), 'm1 done by sleeping to Spring 3');
}

async function playM2() {
  step('m2 journal -> Odell');
  assert.ok(svc.quests.isActive('m2_journal'));
  await P.talk('odell');
  assert.ok(P.flag('workshop_unlocked') && P.has('workshop_key'));
  await P.go('brook_lane', 'workshop_front');
  await P.go('workshop');
  assert.ok(P.questDone('m2_journal'));
}

async function playM3() {
  step('m3 baker');
  assert.ok(svc.quests.isActive('m3_baker'), 'm3 starts after m2');
  await P.talk('rosalind');
  await P.shift();
  await P.shift();
  await P.forageUntil(['whispering_woods'], new Set(['wild_honey']), () => P.has('wild_honey'));
  assert.equal(svc.quests.stageId('m3_baker'), 'honey');
  assert.ok(await P.gift('rosalind', 'wild_honey'));
  await P.settle();
  assert.ok(P.questDone('m3_baker') && Game.state.story.lanterns === 1 && P.has('ember_glass'));
}

async function playM4() {
  step('m4 reader');
  await P.skipTo('spring', 15);
  await P.talk('willa');
  assert.ok(svc.quests.isActive('m4_reader') && P.has('library_riddle'));
  await P.whenOpen('library', 11 * 60);
  await P.go('library', 'reading_nook');
  const shelf = svc.entities.area().interactables.find((i) => i.id === 'bookshelf_lib_4');
  await P.pump(svc.interact.run('library', shelf));
  await P.settle();
  assert.ok(P.flag('found_blueprint_book'));
  await P.talk('willa');
  assert.ok(P.questDone('m4_reader') && P.has('brass_blueprint') && Game.state.story.lanterns === 2);
}

async function playM5() {
  step('m5 sailor');
  await P.skipTo('summer', 1);
  await P.talk('gus');
  assert.ok(svc.quests.isActive('m5_sailor'));
  await P.forageUntil(['harbor'], new Set(['sea_glass']), () => P.has('sea_glass', 3), 40);
  assert.equal(svc.quests.stageId('m5_sailor'), 'return');
  // bulk hand-in: all three at once (one gift day), instead of one per day
  assert.ok(await P.gift('gus', 'sea_glass'), 'bulk hand-in');
  await P.settle();
  assert.ok(P.questDone('m5_sailor'), 'one hand-in finishes m5');
  if (Game.state.story.lanterns < 3) await P.nextDay(); // the lantern cutscene plays on the next event check
  assert.ok(P.questDone('m5_sailor') && Game.state.story.lanterns === 3 && P.has('sea_lens'));
}

async function playM6() {
  step('m6 cafe');
  await P.skipTo('summer', 15);
  await P.talk('rhea');
  assert.ok(svc.quests.isActive('m6_cafe'));
  await P.buy('cafe', 'cocoa_beans', 2);
  assert.equal(svc.quests.stageId('m6_cafe'), 'trust');
  // loved gift: coffee (3 full-value gifts a week)
  for (let d = 0; d < 40 && svc.rel.hearts('rhea') < 3; d++) {
    if (d % 2 === 0 && Game.state.player.money > 80) {
      await P.buy('cafe', 'coffee', 1);
      await P.gift('rhea', 'coffee');
    }
    await P.talk('rhea');
    if (svc.rel.hearts('rhea') >= 3) break;
    await P.nextDay();
  }
  await P.settle();
  assert.ok(svc.rel.hearts('rhea') >= 3);
  assert.ok(P.questDone('m6_cafe') && P.has('spiced_lamp_oil') && Game.state.story.lanterns === 4);
}

async function playM7() {
  step('m7 stargazer');
  await P.skipTo('autumn', 1);
  await P.talk('celeste');
  assert.ok(svc.quests.isActive('m7_stargazer'));
  await P.whenOpen('observatory', 17 * 60);
  await P.go('observatory', 'star_map_spot');
  const map = svc.entities.area().interactables.find((i) => i.id === 'star_map');
  await P.pump(svc.interact.run('observatory', map));
  await P.settle();
  assert.ok(P.has('mentor_notes'));
  await P.forageUntil(['starview_hill'], new Set(['moonpetal']), () => P.questDone('m7_stargazer'), 40);
  assert.ok(P.has('starlight_wick') && Game.state.story.lanterns === 5);
}

async function playM8() {
  step('m8 great lantern');
  assert.ok(svc.quests.isActive('m8_greatlantern'), 'm8 starts once five pieces are held');
  await P.go('workshop', 'bench_spot');
  await P.settle();
  assert.ok(P.has('great_lantern'));
  for (const piece of ['ember_glass', 'brass_blueprint', 'sea_lens', 'spiced_lamp_oil', 'starlight_wick']) assert.ok(!P.has(piece), `${piece} consumed`);
  await P.talk('henrik');
  await P.talk('odell');
  assert.ok(P.questDone('m8_greatlantern') && Game.state.story.lanterns === 6);
  assert.ok(svc.quests.isActive('m9_festival'));
}

async function festival() {
  step('winter 24 festival');
  await P.skipTo('winter', 24);
  assert.equal(Game.state.time.day, 24);
  P.setClock(17 * 60 + 15);
  await P.go('brook_lane');
  const seen = [];
  const off = Game.bus.on('event:start', (e) => seen.push(e.id));
  await P.go('town_square', 'plaza_center');
  await P.settle();
  off();
  return seen;
}

T('story: new game -> tutorial -> m1..m9 -> Winter 24 ending (friends)', async () => {
  await newGame();
  await playTutorial();
  await playM2();
  await playM3();
  await playM4();
  await playM5();
  await playM6();
  await playM7();
  await playM8();
  const seen = await festival();
  assert.ok(seen.includes('festival_lantern'), `festival event ran: ${seen}`);
  for (const id of Object.keys(Data.quests).filter((k) => /^(t_|m\d)/.test(k))) assert.ok(P.questDone(id), `${id} done`);
  assert.equal(Game.state.story.lanterns, 6);
  assert.ok(P.has('great_lantern'));
  assert.ok(P.flag('festival_lit') && P.flag('year1_complete'));
  assert.ok(P.flag('ending_friends') && !P.flag('ending_together'));
  assertClean();
});

// ------------------------------------------------------------------------------------------------ slow player
T('slow player: nothing done but the prologue, arrives at Winter 24 -> the festival still runs, ends in the friends ending', async () => {
  await newGame();
  // sleep the whole year away (the journal still turns up on Spring 3: it is an event, not a chore)
  await P.skipTo('winter', 24);
  assert.ok(P.flag('journal_found'));
  assert.equal(Game.state.story.lanterns, 0);
  assert.ok(!svc.quests.isDone('m3_baker'));
  // arrive early (16:30) and wait for the square to start the ceremony at 17:00 like a player standing around would
  P.setClock(16 * 60 + 30);
  await P.go('brook_lane');
  await P.go('town_square', 'plaza_center');
  assert.ok(!P.flag('festival_lit'), 'not before 17:00');
  const seen = [];
  Game.bus.on('event:start', (e) => seen.push(e.id));
  for (let i = 0; i < 12; i++) { svc.clock.advance(10); await P.settle(); }
  assert.ok(seen.includes('festival_lantern'), `festival ran while waiting: ${seen}`);
  assert.ok(P.flag('festival_lit') && P.flag('ending_friends') && !P.flag('ending_together'));
  assert.ok(!P.has('great_lantern'));
  assert.ok(!P.questDone('m8_greatlantern') && !svc.quests.isActive('m9_festival'));
  assertClean();
  // the story is still finishable afterwards: the unfinished lantern stories remain open (Year 2)
  assert.ok(svc.quests.isActive('m3_baker') || svc.quests.isActive('m2_journal') || P.questDone('m2_journal'));
});

// ------------------------------------------------------------------------------------------------ stalls (peddler, flower stall)
T('stalls: Sable (Sat square / Sun park) and Hattie sell through the NPC menu "Browse wares"', async () => {
  await newGame();
  await P.skipTo('spring', 6); // Saturday
  assert.equal(P.weekday(), 'sat');
  let r = await P.browseStall('sable', 'peddler', 'spice_mix', 1);
  assert.ok(r.opened.length === 1 && r.opened[0].title === "Sable's Stall" && P.has('spice_mix'), 'peddler on Saturday');
  assert.ok(r.asks[0].options.some((o) => o.text === 'Browse wares'));
  await P.nextDay(); // Sunday: she moved to the park
  assert.equal(P.weekday(), 'sun');
  const loc = await P.findNpc('sable');
  assert.equal(loc.area, 'riverside_park');
  r = await P.browseStall('hattie', 'flower_stall', 'daisy_bundle', 1);
  assert.ok(P.has('daisy_bundle'), 'flower stall');
  // a villager at a real counter still gets the counter entry, and plain villagers get none
  const asks = [];
  const origAsk = Game.ui.dialogue.ask;
  Game.ui.dialogue.ask = async (x) => { asks.push(x.options.map((o) => o.text)); return x.options.length - 1; };
  await P.findNpc('odell');
  await P.pump(svc.interaction.activate({ kind: 'npc', id: 'odell' }));
  Game.ui.dialogue.ask = origAsk;
  assert.deepEqual(asks[0], ['Talk', 'Give a gift', 'Never mind']);
  assertClean();
});

// ------------------------------------------------------------------------------------------------ romance
const court = { refuseOnce: false, env: null };
const COURT = {
  mira: ['bakery', 'cake_slice'], willa: ['general_store', 'ink_bottle'], juno: ['fishing_hut', 'grilled_fish'],
  rhea: ['cafe', 'coffee'], celeste: ['cafe', 'tea'],
};

/** Evening routine: talk to them every day and give a gift three days a week (the weekly full-value cap). */
function startCourting(npc) {
  const [shopId, item] = COURT[npc];
  P.hooks.beforeSleep = async () => {
    if (Game.state.time.minutes > 20 * 60) return;
    await P.talk(npc, { sameDay: true });
    if (![1, 3, 5].includes(Game.state.time.day % 7)) return;
    if (!P.has(item) && P.money() > 250) await P.buy(shopId, item, 1, { sameDay: true });
    if (P.has(item) && Game.state.time.minutes < 21 * 60) await P.gift(npc, item, { sameDay: true });
  };
  P.hooks.afterWake = async () => {
    for (const n of [2, 4, 6, 8]) {
      const id = `heart_${npc}_${n}`;
      if (n === 8 ? P.flag(`${npc}_dating`) : P.flag(`seen_${id}`)) continue;
      if (svc.rel.hearts(npc) < n) break;
      const gates = [].concat(Data.events[id].when).filter((c) => c.flag || c.item);
      if (!svc.conditions.evalCond(gates)) break; // e.g. needs lantern_3 / lantern_5: not yet
      if (n === 8 && court.refuseOnce) { court.refuseOnce = false; court.env.askQueue.push(1); }
      await P.attendEvent(id, { maxDays: 90 });
      break;
    }
  };
}
const stopCourting = () => { P.hooks.beforeSleep = null; P.hooks.afterWake = null; };

async function courtUntilDating(npc, maxDays = 150) {
  for (let d = 0; d < maxDays && !P.flag(`${npc}_dating`); d++) {
    // work for the gift money; the job also keeps the player busy like a real day
    if (P.money() < 400) await P.shift();
    await P.nextDay();
  }
}

async function romanceRun(npc, { story = [], refuse = false } = {}) {
  const env = await newGame();
  court.env = env;
  await P.skipTo('spring', 3); // the journal turns up on Spring 3 (needed by the story steps below)
  await P.whenOpen('fishing_hut', 9 * 60); await P.go('fishing_hut', 'counter_front'); // the rod (juno's 2-heart scene needs one)
  court.refuseOnce = refuse;
  startCourting(npc);
  for (const f of story) await f();
  await courtUntilDating(npc);
  assert.ok(P.flag(`${npc}_dating`) && svc.rel.status(npc) === 'dating', `${npc} dating by ${P.dateStr()}`);
  for (const n of [2, 4, 6, 8]) assert.ok(P.flag(`seen_heart_${npc}_${n}`), `heart event ${n} seen`);
  stopCourting();
  return env;
}

async function festivalEnding(npc) {
  const seen = await festival();
  assert.ok(seen.includes('festival_lantern'), `festival: ${seen}`);
  assert.ok(P.flag('ending_together') && P.flag(`seen_ending_together_${npc}`), 'together ending');
  assert.ok(!P.flag('ending_friends'));
  assertClean();
}

T('romance (Mira): 2/4/6/8 hearts through talk + gifts, decline the first confession, accept the second, together ending at the festival', async () => {
  await romanceRun('mira', { refuse: true });
  assert.ok(P.flag('seen_heart_mira_8'));
  await P.skipTo('winter', 24);
  await festivalEnding('mira');
  assert.equal(Game.state.story.lanterns, 0, 'the romance ending does not need the lantern stories');
});

for (const npc of ['rhea', 'willa']) {
  T(`romance (${npc}): all four heart events trigger in play and the confession leads to the together ending`, async () => {
    await romanceRun(npc);
    await P.skipTo('winter', 24);
    await festivalEnding(npc);
  });
}

T('romance (Juno): needs three lanterns for the 8-heart scene; together ending after the full story', async () => {
  await romanceRun('juno', { story: [playM2, playM3, async () => { await P.skipTo('summer', 1); await playM5(); }] });
  await P.skipTo('winter', 24);
  await festivalEnding('juno');
});

T('romance (Celeste): five lanterns + a winter night for the 8-heart scene; full story + together ending', async () => {
  const env = await newGame();
  court.env = env;
  startCourting('celeste');
  await playTutorial();
  await playM2();
  await playM3();
  await playM4();
  await playM5();
  await playM6();
  await playM7();
  assert.ok(P.flag('lantern_5'));
  await courtUntilDating('celeste');
  assert.ok(P.flag('celeste_dating'), `celeste dating by ${P.dateStr()}`);
  stopCourting();
  await playM8();
  const seen = await festival();
  assert.ok(seen.includes('festival_lantern'));
  assert.ok(P.flag('ending_together') && P.flag('seen_ending_together_celeste') && Game.state.story.lanterns === 6 && P.flag('year1_complete'));
  assertClean();
});
