// Cross-check: real sim core (src/systems) + REAL content (src/data) + fake UI/world + no-op staging ops.
// Guards the seam between the systems and content workstreams. Owned by the systems workstream (sys-*).
import test from 'node:test';
const ROOT = new URL('../../src', import.meta.url).pathname;
const { Game } = await import(`${ROOT}/core/game.js`);
const R = await import(`${ROOT}/core/registry.js`);
const { Data } = await import(`${ROOT}/data/index.js`);
const Systems = await import(`${ROOT}/systems/index.js`);
const { opts } = await import(`${ROOT}/systems/kit.js`);
const { svc } = Systems;

const warns = [];
const origWarn = console.warn;
console.warn = (...a) => warns.push(a.join(' ').slice(0, 200));

const log = [];
let askMode = 'first', askIdx = 0, pickAnswer = null, lastShop = null;
Game.settings = { timeScale: 'normal', textSpeed: 'fast', quality: 'low' };
Game.data = Data;
Game.ui = {
  init() {}, update() {},
  showTitle: async () => ({ action: 'new', name: 'Kai', look: { hair: '#4b3425', jacket: '#3b5b9c', scarf: '#e8833a' } }),
  toast(t) { log.push(['toast', t]); }, banner: async (t) => { log.push(['banner', t]); },
  fade: async () => {}, confirm: async () => true, pickItem: async () => pickAnswer, setPrompt() {}, hudVisible() {}, letterbox() {},
  dialogue: {
    say: async (o) => { log.push(['say', o.speaker, o.text]); },
    ask: async (o) => {
      log.push(['ask', o.options.map((x) => x.text)]);
      const en = o.options.map((x, i) => i).filter((i) => !o.options[i].disabled);
      return askMode === 'last' ? en[en.length - 1] : askMode === 'rotate' ? en[askIdx++ % en.length] : en[0];
    },
    narrate: async (t) => { log.push(['narrate', t]); }, close() {},
  },
  menu: { open: async () => {}, close() {} },
  shop: { open: async (o) => { log.push(['shop', o.title, o.stock.length]); lastShop = o; } },
  notes: { read: async (o) => { log.push(['notes', o.title, o.lines && o.lines.length]); } },
  daySummary: async () => {}, minigames: { fishing: async () => ({ caught: true, perfect: true }), kneading: async () => ({ score: 0.9 }) },
};
Game.world = { getArea: () => null, setLampStates() {}, setDecor() {}, playEffect() {}, setCamera() {}, snapCamera() {} };
for (const op of ['area', 'place', 'move', 'face', 'anim', 'expr', 'emote', 'hold', 'camera', 'hide', 'show', 'effect', 'lamps', 'decor']) {
  if (!svc.script.hasOp(op)) Systems.registerOp(op, async () => {});
}
Systems.init();
opts.skipFades = true;

const withTimeout = (p, ms, label) => {
  let timer;
  const guard = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error(`TIMEOUT ${ms}ms: ${label}`)), ms); timer.unref?.(); });
  return Promise.race([p, guard]).finally(() => clearTimeout(timer));
};
const T = (name, fn) => test(name, { timeout: 60000 }, async () => { await withTimeout(fn(), 50000, name); });
const fresh = async () => { log.length = 0; askMode = 'first'; await Systems.newGame({ name: 'Kai' }); Game.setMode('field'); };

T('A. new game fires the prologue by itself', async () => {
  await fresh();
  const f = Game.state.flags;
  const says = log.filter((l) => l[0] === 'say').length;
  if (!f.prologue_done) throw new Error('prologue_done not set; says=' + says);
  if (svc.inventory.count('cottage_key') !== 1) throw new Error('no cottage_key');
  if (svc.inventory.count('town_map') !== 1) throw new Error('no town_map');
  if (!svc.quests.isActive('t_meet_town') || !svc.quests.isActive('m1_arrival')) throw new Error('quests not started');
  if (Game.mode !== 'field') throw new Error('mode ' + Game.mode);
  return `says=${says} money=${Game.state.player.money} quests=${Object.keys(Game.state.quests.active).join(',')}`;
});

T('B. every event script runs to completion (staging ops no-op)', async () => {
  await fresh();
  const bad = [];
  let n = 0;
  for (const [id, ev] of Object.entries(Data.events)) {
    for (const mode of ['first', 'last']) {
      askMode = mode;
      const w0 = warns.length;
      try { await withTimeout(Systems.runScript(ev.script, { cutscene: true, source: id }), 4000, `${id}/${mode}`); n++; }
      catch (e) { bad.push(`${id}/${mode}: ${String(e.message).slice(0, 90)}`); }
      if (warns.length > w0) bad.push(`${id}/${mode} warned: ${warns.slice(w0).join(' ; ').slice(0, 120)}`);
      if (Game.mode !== 'field') { bad.push(`${id}/${mode}: mode left as ${Game.mode}`); Game.setMode('field'); }
    }
  }
  askMode = 'first';
  if (bad.length) throw new Error(`${bad.length} problem(s) of ${n} runs:\n  - ` + bad.slice(0, 12).join('\n  - '));
  return `${n} script runs OK (${Object.keys(Data.events).length} events × 2 ask strategies)`;
});

T('C. talk + intro for all 19 NPCs; gifts classify per NpcDef', async () => {
  await fresh();
  const problems = [];
  const reactions = [];
  Game.bus.on('npc:gift', (e) => reactions.push(e));
  for (const id of R.NPC_IDS) {
    const before = svc.rel.aff(id);
    log.length = 0;
    try {
      await svc.rel.talk(id); // intro
      await svc.rel.talk(id); // normal talk
    } catch (e) { problems.push(`${id} talk threw ${e.message}`); continue; }
    if (!log.some((l) => l[0] === 'say')) problems.push(`${id}: talk produced no dialogue`);
    const def = Data.npcs[id];
    const probe = { love: def.loves?.items?.[0], like: def.likes?.items?.[0], dislike: def.dislikes?.items?.[0], hate: def.hates?.items?.[0] };
    for (const [exp, item] of Object.entries(probe)) {
      if (!item) continue;
      Game.state.rel[id].giftDay = -1; Game.state.rel[id].giftsThisWeek = 0;
      svc.inventory.give(item, 1);
      const slot = Game.state.inventory.slots.findIndex((s) => s && s.id === item);
      pickAnswer = slot;
      reactions.length = 0;
      try { await svc.rel.giftFlow(id); } catch (e) { problems.push(`${id} gift ${item} threw ${e.message}`); continue; }
      const got = reactions[0]?.reaction;
      if (got !== exp) problems.push(`${id}: gave ${item} expected ${exp} got ${got}`);
      svc.inventory.remove(item, svc.inventory.count(item));
    }
  }
  pickAnswer = null;
  if (problems.length) throw new Error(`${problems.length} problem(s):\n  - ` + problems.slice(0, 12).join('\n  - '));
  return 'all 19 talk flows + gift classification (love/like/dislike/hate by id) OK';
});

T('D. every shop opens with stock; buying works', async () => {
  await fresh();
  Game.state.player.money = 99999;
  const problems = [];
  for (const id of Object.keys(Data.shops)) {
    lastShop = null;
    try { await svc.shops.openShop(id); } catch (e) { problems.push(`${id} threw ${e.message}`); continue; }
    if (!lastShop) { problems.push(`${id}: UI shop not opened`); continue; }
    if (!lastShop.stock.length) { problems.push(`${id}: empty stock`); continue; }
    const first = lastShop.stock[0];
    const money0 = Game.state.player.money;
    const res = await lastShop.onBuy(first.itemId, 1);
    if (!res || res.ok === false) problems.push(`${id}: buy ${first.itemId} failed ${JSON.stringify(res)}`);
    else if (Game.state.player.money >= money0) problems.push(`${id}: money did not drop`);
  }
  if (problems.length) throw new Error(problems.join('\n  - '));
  return `${Object.keys(Data.shops).length} shops OK`;
});

T('E. every quest starts; board offers errands for 14 days', async () => {
  await fresh();
  const problems = [];
  for (const id of Object.keys(Data.quests)) {
    try { await svc.quests.start(id); await svc.quests.idle?.(); } catch (e) { problems.push(`${id} start threw ${e.message}`); }
  }
  const started = Object.keys(Game.state.quests.active).length;
  const offered = new Set();
  for (let d = 1; d <= 14; d++) {
    svc.clock.set({ season: 0, day: d, minutes: 600 });
    let b;
    try { b = svc.quests.board(); } catch (e) { problems.push(`board day ${d} threw ${e.message}`); continue; }
    if (!Array.isArray(b) || b.length === 0) problems.push(`board day ${d} empty`);
    for (const o of b || []) offered.add(o.text || o.title || o.id);
  }
  if (problems.length) throw new Error(problems.slice(0, 8).join('\n  - '));
  return `${started} quests active after start-all; ${offered.size} distinct board offers over 14 days`;
});

T('F. every non-physical interactable handler runs', async () => {
  await fresh();
  const problems = [];
  let n = 0;
  const physical = new Set(['lamp', 'forage', 'fishing', 'job']);
  for (const area of R.AREA_IDS) {
    for (const [iid, type] of Object.entries(R.areaInteractables(area))) {
      if (physical.has(type) || type === 'bed') continue;
      const it = { id: iid, type, x: 1, z: 1, r: 1, label: iid, text: `(${iid})` };
      Game.state.player.area = area;
      askMode = 'last';
      try { await withTimeout(svc.interact.run(area, it), 5000, `${area}.${iid}`); n++; }
      catch (e) { problems.push(`${area}.${iid} (${type}): ${String(e.message).slice(0, 100)}`); }
      if (Game.mode !== 'field') { problems.push(`${area}.${iid}: mode left ${Game.mode}`); Game.setMode('field'); }
    }
  }
  askMode = 'first';
  if (problems.length) throw new Error(`${problems.length} problem(s) of ${n}:\n  - ` + problems.slice(0, 10).join('\n  - '));
  return `${n} interactables handled`;
});

T('G. 70 nights of sleeping: rollover, mail, board, events, no exceptions', async () => {
  await fresh();
  const seen = new Set();
  Game.bus.on('event:start', (e) => seen.add(e.id));
  const dates = [];
  for (let d = 0; d < 70; d++) {
    Game.state.time.minutes = 22 * 60;
    Game.state.player.area = 'cottage';
    await svc.director.sleep({ confirm: false });
    dates.push(`${Game.state.time.year}.${Game.state.time.season}.${Game.state.time.day}`);
    if (Game.state.time.minutes !== 360) throw new Error('did not wake at 06:00: ' + Game.state.time.minutes);
    if (Game.mode !== 'field') Game.setMode('field');
    await svc.events.check('tick');
  }
  const t = Game.state.time;
  // started Spring 1; after 70 sleeps -> day 71 => season index 2, day 15
  if (!(t.year === 1 && t.season === 2 && t.day === 15)) throw new Error(`unexpected date after 70 nights: y${t.year} s${t.season} d${t.day}`);
  return `reached Y${t.year} season ${t.season} day ${t.day}; mail queued=${(Game.state.world.mailQueue || []).length}; events fired=${[...seen].join(',') || 'none'}; weather today=${Game.state.weather.today}`;
});

T('H. festival day triggers its event in the right area/time', async () => {
  const problems = [];
  const ran = [];
  for (const [fid, f] of Object.entries(Data.festivals)) {
    await fresh();
    Game.state.flags.prologue_done = true;
    const seasonIdx = R.SEASONS.indexOf(f.date.season);
    const evDef = Data.events[f.eventId];
    const conds = Array.isArray(evDef.when) ? evDef.when : [evDef.when];
    const tc = conds.find((c) => c && c.time);
    const [hh, mm] = (tc ? tc.time.from : f.from).split(':').map(Number);
    svc.clock.set({ season: seasonIdx, day: f.date.day, minutes: hh * 60 + mm + 30 });
    Game.state.player.area = f.area;
    log.length = 0;
    const seen = [];
    const off = Game.bus.on('event:start', (e) => seen.push(e.id));
    await svc.events.check('area:enter');
    off();
    if (!seen.includes(f.eventId)) problems.push(`${fid}: expected event ${f.eventId}, got [${seen.join(',')}]`);
    else ran.push(fid);
  }
  if (problems.length) throw new Error(problems.join('\n  - '));
  return `festivals fired: ${ran.join(', ')}`;
});

