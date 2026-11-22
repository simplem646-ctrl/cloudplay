// Content validator for Lanternbrook Days. Usage: node tools/validate-content.mjs
// Exports validateContent() for tests; exits 1 when run directly and errors exist.
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  SEASONS, WEEKDAYS, WEATHERS, FACINGS, NPC_IDS, PORTRAIT_IDS, ROMANCE_IDS, EXPRESSIONS, ANIMATIONS, HELD_PROPS, VOICES,
  ITEM_CATEGORIES, ITEM_TAGS, ICON_SHAPES, INTERACT_TYPES, WATER_KINDS, DECOR_SETS, MUSIC_TRACKS, SFX_IDS, AREAS, AREA_IDS,
  areaAnchorNames, areaInteractables, API_SURFACE,
} from '../src/core/registry.js';

const HEX = /^#[0-9a-fA-F]{6}$/;
const GOAL_TYPES = ['talk', 'give', 'have', 'catch', 'forage', 'visit', 'hearts', 'job', 'earn', 'flag', 'date', 'lanterns'];
const OPS = ['say', 'ask', 'narrate', 'if', 'label', 'goto', 'end', 'wait', 'parallel', 'call', 'setFlag', 'clearFlag', 'incFlag', 'giveItem', 'takeItem',
  'money', 'energy', 'affection', 'meet', 'startQuest', 'advanceQuest', 'completeQuest', 'lantern', 'setTime', 'setWeather', 'mail', 'fade', 'title',
  'music', 'sfx', 'toast', 'letterbox', 'shop', 'notes', 'area', 'place', 'move', 'face', 'anim', 'expr', 'emote', 'hold', 'camera', 'hide', 'show',
  'effect', 'lamps', 'decor'];
const COND_PRIMS = ['flag', 'notFlag', 'flagGte', 'hearts', 'status', 'met', 'season', 'weekday', 'weather', 'year', 'day', 'date', 'dateFrom', 'dateTo',
  'time', 'night', 'area', 'indoors', 'item', 'money', 'energy', 'quest', 'lanterns', 'jobDone', 'festival', 'chance'];
const COND_COMB = ['all', 'any', 'not'];
const EMOTES = ['heart', 'music', 'sweat', 'anger', 'question', 'exclaim', 'zzz', 'sparkle', 'sad', 'idea'];
const SETTLED_FLAG = /^(prologue_done|journal_found|workshop_unlocked|lantern_[1-6]|met_.+|.+_dating|seen_.+|ending_together|ending_friends)$/;
const SHOP_REQUIRED = ['general_store', 'bakery', 'cafe', 'clinic', 'inn', 'fishing_hut', 'peddler', 'flower_stall'];
const EVENT_REQUIRED = ['prologue', 'journal_found', 'festival_blossom', 'festival_midsummer', 'festival_harvest', 'festival_hearthlight', 'festival_lantern', 'ending_friends'];
const MAIN_QUESTS = ['t_meet_town', 't_first_shift', 't_first_catch', 't_forage', 'm1_arrival', 'm2_journal', 'm3_baker', 'm4_reader', 'm5_sailor', 'm6_cafe', 'm7_stargazer', 'm8_greatlantern', 'm9_festival'];
const KEY_ITEMS = ['town_map', 'cottage_key', 'workshop_key', 'tobias_journal', 'fishing_rod', 'ember_glass', 'brass_blueprint', 'sea_lens', 'spiced_lamp_oil', 'starlight_wick', 'great_lantern'];
const INTERIORS = AREA_IDS.filter((a) => AREAS[a].kind === 'interior');

const hhmm = (s) => {
  const m = /^(\d{1,2}):([0-5]\d)$/.exec(String(s));
  return m ? Number(m[1]) * 60 + Number(m[2]) : NaN;
};

export async function validateContent() {
  const errors = [];
  const warnings = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const warn = (where, msg) => warnings.push(`${where}: ${msg}`);

  const { Data } = await import(pathToFileURL(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src/data/index.js')).href);
  for (const k of API_SURFACE.data) if (Data[k] === undefined) err('Data', `missing key ${k}`);

  const items = Data.items, npcs = Data.npcs, quests = Data.quests, events = Data.events, shops = Data.shops;
  const isNpc = (id) => NPC_IDS.includes(id);
  const hasItem = (id) => Object.prototype.hasOwnProperty.call(items, id);
  const area = (id) => AREAS[id];
  const anchorOk = (a, at) => area(a) && areaAnchorNames(a).includes(at);
  const anyAnchor = (at) => AREA_IDS.some((a) => areaAnchorNames(a).includes(at));
  const counts = { lines: 0 };

  // ---------------- flags
  const flagsSet = new Set();
  const flagsUsed = [];
  const collectFlagsSet = (steps) => {
    for (const s of steps || []) {
      if (!s || typeof s !== 'object') continue;
      if (s.setFlag) flagsSet.add(s.setFlag);
      if (s.incFlag) flagsSet.add(s.incFlag);
      if (s.then) collectFlagsSet(s.then);
      if (s.else) collectFlagsSet(s.else);
      if (s.ask) for (const o of s.ask) collectFlagsSet(o.then);
      if (s.parallel) for (const p of s.parallel) collectFlagsSet(p);
    }
  };

  // ---------------- conditions
  const checkCond = (c, where) => {
    if (c == null) return;
    if (Array.isArray(c)) { c.forEach((x) => checkCond(x, where)); return; }
    if (typeof c !== 'object') { err(where, `bad cond ${JSON.stringify(c)}`); return; }
    const keys = Object.keys(c);
    if (keys.length !== 1) { err(where, `cond object must have exactly one key: ${JSON.stringify(c)}`); return; }
    const k = keys[0], v = c[k];
    if (COND_COMB.includes(k)) {
      if (k === 'not') checkCond(v, where); else if (!Array.isArray(v)) err(where, `${k} needs an array`); else v.forEach((x) => checkCond(x, where));
      return;
    }
    if (!COND_PRIMS.includes(k)) { err(where, `unknown cond primitive "${k}"`); return; }
    const list = (x) => (Array.isArray(x) ? x : [x]);
    if (k === 'flag' || k === 'notFlag') flagsUsed.push([v, where]);
    if (k === 'flagGte') flagsUsed.push([v[0], where]);
    if (k === 'hearts') { if (!isNpc(v.npc)) err(where, `hearts: unknown npc ${v.npc}`); }
    if (k === 'status' && !isNpc(v.npc)) err(where, `status: unknown npc ${v.npc}`);
    if (k === 'met' && !isNpc(v)) err(where, `met: unknown npc ${v}`);
    if (k === 'season') list(v).forEach((s) => !SEASONS.includes(s) && err(where, `bad season ${s}`));
    if (k === 'weekday') list(v).forEach((s) => !WEEKDAYS.includes(s) && err(where, `bad weekday ${s}`));
    if (k === 'weather') list(v).forEach((s) => !WEATHERS.includes(s) && err(where, `bad weather ${s}`));
    if (['date', 'dateFrom', 'dateTo'].includes(k) && (!SEASONS.includes(v.season) || !(v.day >= 1 && v.day <= 28))) err(where, `bad ${k} ${JSON.stringify(v)}`);
    if (k === 'time' && (Number.isNaN(hhmm(v.from)) || Number.isNaN(hhmm(v.to)))) err(where, `bad time ${JSON.stringify(v)}`);
    if (k === 'area') list(v).forEach((a) => !area(a) && err(where, `unknown area ${a}`));
    if (k === 'item' && !hasItem(v.id)) err(where, `cond item ${v.id} unknown`);
    if (k === 'quest') { if (!quests[v.id]) err(where, `cond quest ${v.id} unknown`); if (!['active', 'done', 'none'].includes(v.state)) err(where, `bad quest state ${v.state}`); }
    if (k === 'jobDone' && !Data.jobs[v]) err(where, `jobDone ${v} unknown`);
    if (k === 'festival' && v !== true && !Data.festivals[v]) err(where, `festival ${v} unknown`);
  };

  // ---------------- scripts
  const checkSpeaker = (s, where) => {
    if (!(isNpc(s) || ['player', 'narrator', '???'].includes(s))) err(where, `unknown speaker "${s}"`);
  };
  const checkText = (t, where) => {
    if (typeof t !== 'string' || !t) { err(where, 'empty text'); return; }
    counts.lines++;
    if (t.length > 175) err(where, `line too long (${t.length}): ${t.slice(0, 40)}...`);
    else if (t.length > 125) warn(where, `long line (${t.length}): ${t.slice(0, 40)}...`);
  };
  const checkScript = (steps, where) => {
    if (!Array.isArray(steps)) { err(where, 'script is not an array'); return; }
    const labels = new Set(steps.filter((s) => s && s.label).map((s) => s.label));
    steps.forEach((s, i) => {
      const w = `${where}[${i}]`;
      if (!s || typeof s !== 'object') { err(w, 'step is not an object'); return; }
      const op = Object.keys(s).find((k) => OPS.includes(k));
      if (!op) { err(w, `no known op in ${JSON.stringify(s).slice(0, 80)}`); return; }
      const v = s[op];
      switch (op) {
        case 'say': checkSpeaker(v, w); checkText(s.text, w); if (s.expr && !EXPRESSIONS.includes(s.expr)) err(w, `bad expression ${s.expr}`); break;
        case 'ask':
          if (!Array.isArray(v) || !v.length) err(w, 'ask needs options');
          else v.forEach((o, j) => { checkText(o.text, `${w}.ask[${j}]`); if (o.if) checkCond(o.if, w); if (o.then) checkScript(o.then, `${w}.ask[${j}].then`); });
          if (s.speaker) checkSpeaker(s.speaker, w);
          if (s.expr && !EXPRESSIONS.includes(s.expr)) err(w, `bad expression ${s.expr}`);
          break;
        case 'narrate': checkText(v, w); break;
        case 'if': checkCond(v, w); if (s.then) checkScript(s.then, `${w}.then`); if (s.else) checkScript(s.else, `${w}.else`); break;
        case 'goto': if (!labels.has(v)) err(w, `goto unknown label ${v}`); break;
        case 'wait': if (typeof v !== 'number') err(w, 'wait needs ms'); break;
        case 'parallel': if (!Array.isArray(v)) err(w, 'parallel needs arrays'); else v.forEach((p, j) => checkScript(p, `${w}.parallel[${j}]`)); break;
        case 'call': if (!(events[v] || Data.dialogue[v] || Data.interactions[v])) err(w, `call unknown script ${v}`); break;
        case 'setFlag': case 'clearFlag': case 'incFlag': if (typeof v !== 'string') err(w, 'flag name needs a string'); break;
        case 'giveItem': case 'takeItem': if (!hasItem(v)) err(w, `${op}: unknown item ${v}`); break;
        case 'money': case 'energy': if (typeof v !== 'number') err(w, `${op} needs a number`); break;
        case 'affection': if (!isNpc(v)) err(w, `affection: unknown npc ${v}`); if (typeof s.amount !== 'number') err(w, 'affection needs amount'); break;
        case 'meet': if (!isNpc(v)) err(w, `meet: unknown npc ${v}`); break;
        case 'startQuest': case 'advanceQuest': case 'completeQuest': if (!quests[v]) err(w, `${op}: unknown quest ${v}`); break;
        case 'lantern': if (typeof v !== 'number') err(w, 'lantern needs a number'); break;
        case 'setTime': if (Number.isNaN(hhmm(v))) err(w, `bad time ${v}`); break;
        case 'setWeather': if (!WEATHERS.includes(v)) err(w, `bad weather ${v}`); break;
        case 'mail': if (!Data.mail[v]) err(w, `mail: unknown ${v}`); break;
        case 'fade': if (!['in', 'out'].includes(v)) err(w, `bad fade ${v}`); break;
        case 'title': checkText(v, w); break;
        case 'music': if (v !== null && !MUSIC_TRACKS.includes(v)) err(w, `unknown music ${v}`); break;
        case 'sfx': if (!SFX_IDS.includes(v)) err(w, `unknown sfx ${v}`); break;
        case 'toast': checkText(v, w); break;
        case 'shop': if (!shops[v]) err(w, `shop: unknown ${v}`); break;
        case 'notes': if (!v || !Array.isArray(v.lines)) err(w, 'notes needs {title,lines}'); break;
        case 'area': if (!area(v)) err(w, `area: unknown ${v}`); else if (!anchorOk(v, s.at)) err(w, `area ${v}: unknown anchor ${s.at}`); break;
        case 'place': case 'move': {
          if (v !== 'player' && !isNpc(v)) err(w, `${op}: unknown id ${v}`);
          const to = op === 'place' ? s.at : s.to;
          if (typeof to === 'string') { if (s.area && area(s.area) ? !anchorOk(s.area, to) : !anyAnchor(to)) err(w, `${op}: unknown anchor ${to}`); }
          else if (!(to && typeof to.x === 'number')) err(w, `${op} needs a target`);
          break;
        }
        case 'face': case 'anim': case 'expr': case 'emote': case 'hold':
          if (v !== 'player' && !isNpc(v)) err(w, `${op}: unknown id ${v}`);
          if (op === 'anim' && !ANIMATIONS.includes(s.name)) err(w, `unknown animation ${s.name}`);
          if (op === 'expr' && !EXPRESSIONS.includes(s.name)) err(w, `unknown expression ${s.name}`);
          if (op === 'emote' && !EMOTES.includes(s.icon)) err(w, `unknown emote ${s.icon}`);
          if (op === 'hold' && s.prop !== null && !HELD_PROPS.includes(s.prop)) err(w, `unknown prop ${s.prop}`);
          break;
        case 'hide': case 'show': if (!isNpc(v)) err(w, `${op}: unknown npc ${v}`); break;
        case 'decor': if (v !== null && !DECOR_SETS.includes(v)) err(w, `unknown decor ${v}`); break;
        case 'lamps': if (!['all_lit', 'restore', 'normal'].includes(v)) err(w, `bad lamps ${v}`); break;
        default: break;
      }
    });
  };

  // ================= items
  const itemList = Object.values(items);
  const byCat = {};
  for (const it of itemList) {
    const w = `item ${it.id}`;
    byCat[it.category] = (byCat[it.category] || 0) + 1;
    if (!ITEM_CATEGORIES.includes(it.category)) err(w, `bad category ${it.category}`);
    if (!it.name || !it.desc) err(w, 'missing name/desc');
    if (!it.icon || !ICON_SHAPES.includes(it.icon.shape)) err(w, `bad icon shape ${it.icon && it.icon.shape}`);
    else if (!Array.isArray(it.icon.colors) || it.icon.colors.length !== 2 || !it.icon.colors.every((c) => HEX.test(c))) err(w, 'icon colors need 2 hex values');
    for (const t of it.tags || []) if (!ITEM_TAGS.includes(t)) err(w, `bad tag ${t}`);
    if (!it.price || !('buy' in it.price) || !('sell' in it.price)) err(w, 'price needs buy and sell');
    if (it.key && (it.price.buy !== null || it.price.sell !== null)) err(w, 'key items need buy:null sell:null');
    if (it.category === 'food' && typeof it.energy !== 'number') err(w, 'food needs energy');
    if (it.id !== it.id.toLowerCase()) err(w, 'id must be snake_case');
  }
  for (const k of KEY_ITEMS) if (!hasItem(k) || !items[k].key) err('items', `missing key item ${k}`);
  const keyCount = itemList.filter((i) => i.key).length;
  const giftCount = (byCat.gift || 0);

  // ================= fish
  const fishList = Object.values(Data.fish);
  const kindsSeen = new Set();
  for (const f of fishList) {
    const w = `fish ${f.id}`;
    if (!hasItem(f.id)) err(w, 'no matching item');
    else if (!['fish'].includes(items[f.id].category)) err(w, 'item is not category fish');
    if (!f.spots || !f.spots.length) err(w, 'no spots');
    for (const s of f.spots || []) { if (!WATER_KINDS.includes(s)) err(w, `bad spot ${s}`); kindsSeen.add(s); }
    for (const s of f.seasons || []) if (!SEASONS.includes(s)) err(w, `bad season ${s}`);
    for (const s of f.weather || []) if (!WEATHERS.includes(s)) err(w, `bad weather ${s}`);
    if (!f.seasons || !f.seasons.length || !f.weather || !f.weather.length) err(w, 'needs seasons and weather');
    if (Number.isNaN(hhmm(f.time && f.time.from)) || Number.isNaN(hhmm(f.time && f.time.to))) err(w, 'bad time');
    if (!(f.weight >= 1 && f.weight <= 10)) err(w, 'weight 1..10');
    if (!(f.difficulty >= 1 && f.difficulty <= 5)) err(w, 'difficulty 1..5');
    if (!Array.isArray(f.size) || f.size.length !== 2 || f.size[0] > f.size[1]) err(w, 'bad size');
  }
  for (const k of WATER_KINDS) if (!kindsSeen.has(k)) err('fish', `no fish for water kind ${k}`);
  for (const k of WATER_KINDS) for (const s of SEASONS) if (!fishList.some((f) => f.spots.includes(k) && f.seasons.includes(s))) err('fish', `no fish for ${k} in ${s}`);
  const legendary = fishList.filter((f) => f.difficulty >= 5).length;

  // ================= forage
  const FORAGE_AREAS = AREA_IDS.filter((a) => AREAS[a].forage > 0);
  let forageCount = 0;
  const forageItems = new Set();
  for (const a of FORAGE_AREAS) {
    const tbl = Data.forage[a];
    if (!tbl) { err('forage', `missing table for ${a}`); continue; }
    for (const s of SEASONS) {
      const rows = tbl[s];
      if (!rows || !rows.length) { err(`forage ${a}.${s}`, 'missing/empty'); continue; }
      if (!rows.some((r) => r.item === null)) warn(`forage ${a}.${s}`, 'no empty-spot entry');
      for (const r of rows) {
        if (r.item !== null && !hasItem(r.item)) err(`forage ${a}.${s}`, `unknown item ${r.item}`);
        else if (r.item) forageItems.add(r.item);
        if (!(r.weight >= 0)) err(`forage ${a}.${s}`, 'bad weight');
      }
    }
  }
  forageCount = itemList.filter((i) => i.category === 'forage').length;
  const forageSeasonItems = Object.fromEntries(SEASONS.map((s) => [s, new Set()]));
  for (const a of FORAGE_AREAS) for (const s of SEASONS) for (const r of (Data.forage[a] || {})[s] || []) if (r.item) forageSeasonItems[s].add(r.item);
  for (const s of SEASONS) if (forageSeasonItems[s].size < 5) err('forage', `fewer than 5 forage items in ${s}`);

  // ================= npcs & gift prefs
  const resolves = (list) => {
    const out = new Set();
    for (const id of list.items || []) { if (!hasItem(id)) err('npc prefs', `unknown item ${id}`); else out.add(id); }
    for (const t of list.tags || []) { if (!ITEM_TAGS.includes(t)) err('npc prefs', `unknown tag ${t}`); else itemList.forEach((i) => i.tags.includes(t) && out.add(i.id)); }
    return out;
  };
  const MIN = { loves: 3, likes: 4, dislikes: 3, hates: 2 };
  for (const id of NPC_IDS) {
    const n = npcs[id], w = `npc ${id}`;
    if (!n) { err(w, 'missing NpcDef'); continue; }
    if (n.id !== id) err(w, 'id mismatch');
    if (!n.name || !n.short || !n.role || !n.bio || !(n.age > 0)) err(w, 'missing name/short/role/bio/age');
    if (!['f', 'm'].includes(n.gender)) err(w, 'bad gender');
    if (n.romance !== ROMANCE_IDS.includes(id)) err(w, 'romance flag mismatch');
    if (n.portrait !== PORTRAIT_IDS.includes(id)) err(w, 'portrait flag mismatch');
    if (!VOICES.includes(n.voice)) err(w, `bad voice ${n.voice}`);
    if (!area(n.home)) err(w, `bad home ${n.home}`);
    if (n.birthday !== null && !(SEASONS.includes(n.birthday.season) && n.birthday.day >= 1 && n.birthday.day <= 28)) err(w, 'bad birthday');
    if (id === 'sable' && n.birthday !== null) err(w, 'sable has no birthday');
    if (!Array.isArray(n.personality) || n.personality.length < 2) err(w, 'needs personality tags');
    for (const k of Object.keys(MIN)) {
      const list = n[k];
      if (!list) { err(w, `missing ${k}`); continue; }
      const count = (list.items || []).length + (list.tags || []).length;
      if (count < MIN[k]) err(w, `${k} needs >= ${MIN[k]} entries (has ${count})`);
      if (resolves(list).size < 1) err(w, `${k} resolves to no item`);
    }
    if (id === 'odell' && !n.startMet) err(w, 'odell must be startMet');
  }

  // ================= shops
  for (const id of SHOP_REQUIRED) if (!shops[id]) err('shops', `missing shop ${id}`);
  for (const [id, s] of Object.entries(shops)) {
    const w = `shop ${id}`;
    if (s.id !== id) err(w, 'id mismatch');
    if (!isNpc(s.owner)) err(w, `bad owner ${s.owner}`);
    if (!area(s.area)) err(w, `bad area ${s.area}`);
    if (s.counter !== null && !(area(s.area) && areaInteractables(s.area)[s.counter] === 'shop')) err(w, `counter ${s.counter} is not a shop interactable in ${s.area}`);
    if (!s.greeting) err(w, 'no greeting');
    if (!Array.isArray(s.stock) || s.stock.length < 5) err(w, 'stock too small');
    for (const st of s.stock || []) {
      if (!hasItem(st.item)) err(w, `unknown stock item ${st.item}`);
      for (const se of st.seasons || []) if (!SEASONS.includes(se)) err(w, `bad season ${se}`);
    }
    if (s.buys !== 'all' && !(Array.isArray(s.buys) && s.buys.every((c) => ITEM_CATEGORIES.includes(c)))) err(w, 'bad buys');
  }

  // ================= jobs & buildings
  for (const id of ['bakery_shift', 'parcel_run', 'lamplighter']) if (!Data.jobs[id]) err('jobs', `missing job ${id}`);
  for (const [id, j] of Object.entries(Data.jobs)) {
    const w = `job ${id}`;
    if (!isNpc(j.boss)) err(w, 'bad boss');
    if (!area(j.area) || areaInteractables(j.area)[j.spot] !== 'job') err(w, `spot ${j.spot} not a job interactable in ${j.area}`);
    if (!j.days.every((d) => WEEKDAYS.includes(d))) err(w, 'bad days');
    if (Number.isNaN(hhmm(j.from)) || Number.isNaN(hhmm(j.to)) || hhmm(j.from) >= hhmm(j.to)) err(w, 'bad hours');
    if (!['kneading', 'delivery', 'lamplighter'].includes(j.kind)) err(w, 'bad kind');
    if (!(j.energy > 0) || !j.pay || !(j.pay.base >= 0) || !(j.pay.bonus >= 0)) err(w, 'bad energy/pay');
    checkScript(j.intro, `${w}.intro`); checkScript(j.done, `${w}.done`);
  }
  for (const a of INTERIORS) {
    const b = Data.buildings[a], w = `building ${a}`;
    if (!b) { err(w, 'missing'); continue; }
    if (Number.isNaN(hhmm(b.open)) || Number.isNaN(hhmm(b.close))) err(w, 'bad hours');
    if (!(b.closedDays || []).every((d) => WEEKDAYS.includes(d))) err(w, 'bad closedDays');
    if (!b.closedText) err(w, 'no closedText');
    if (b.lockFlag && !b.lockedText) err(w, 'lockFlag needs lockedText');
  }
  if (!Data.buildings.workshop || Data.buildings.workshop.lockFlag !== 'workshop_unlocked') err('buildings', 'workshop must use lockFlag workshop_unlocked');

  // ================= schedules
  let slotCount = 0;
  for (const id of NPC_IDS) {
    const rules = Data.schedules[id], w = `schedule ${id}`;
    if (!Array.isArray(rules) || !rules.length) { err(w, 'missing'); continue; }
    if (rules[rules.length - 1].when) err(w, 'last rule must have no `when`');
    rules.forEach((r, ri) => {
      const rw = `${w}.rule${ri}`;
      if (r.when) checkCond(r.when, rw);
      if (!Array.isArray(r.slots) || !r.slots.length || r.slots.length > 12) err(rw, `needs 1..12 slots (has ${r.slots && r.slots.length})`);
      else if (r.slots.length < 4 && ri < rules.length - 1) warn(rw, 'fewer than 4 slots');
      let prev = -1;
      (r.slots || []).forEach((s, si) => {
        const sw = `${rw}.slot${si}`;
        slotCount++;
        const t = hhmm(s.from);
        if (Number.isNaN(t)) err(sw, `bad time ${s.from}`);
        else { if (t <= prev) err(sw, 'slots must be strictly sorted'); prev = t; if (si === 0 && t > 360) err(sw, 'first slot must start by 06:00'); }
        if (!area(s.area) || !areaAnchorNames(s.area).includes(s.at)) err(sw, `unknown anchor ${s.area}.${s.at}`);
        if (s.facing && !FACINGS.includes(s.facing)) err(sw, 'bad facing');
        if (s.anim && !ANIMATIONS.includes(s.anim)) err(sw, `bad anim ${s.anim}`);
        if (s.hold && !HELD_PROPS.includes(s.hold)) err(sw, `bad hold ${s.hold}`);
      });
    });
  }

  // ================= quests
  const questList = Object.values(quests);
  const checkReward = (r, w) => {
    if (!r) { err(w, 'no reward'); return; }
    for (const it of r.items || []) { if (!hasItem(it.id)) err(w, `reward item ${it.id} unknown`); if (!(it.qty >= 1)) err(w, 'bad reward qty'); }
    for (const n of Object.keys(r.aff || {})) if (!isNpc(n)) err(w, `reward aff npc ${n}`);
    for (const f of r.flags || []) flagsSet.add(f);
    if (r.script) { checkScript(r.script, `${w}.script`); collectFlagsSet(r.script); }
  };
  for (const id of MAIN_QUESTS) if (!quests[id]) err('quests', `missing quest ${id}`);
  for (const q of questList) {
    const w = `quest ${q.id}`;
    if (!['tutorial', 'main', 'side', 'errand'].includes(q.kind)) err(w, 'bad kind');
    if (!q.title || !q.desc) err(w, 'missing title/desc');
    if (q.giver && !isNpc(q.giver)) err(w, 'bad giver');
    if (q.kind === 'side' && !q.giver) err(w, 'side quest needs giver');
    if (q.unlock) checkCond(q.unlock, `${w}.unlock`);
    if (!Array.isArray(q.stages) || !q.stages.length) err(w, 'stages empty');
    (q.stages || []).forEach((st, i) => {
      const sw = `${w}.stage${i}`;
      if (!st.id || !st.text) err(sw, 'needs id and text');
      const g = st.goal;
      if (!g || !GOAL_TYPES.includes(g.type)) { err(sw, `bad goal ${JSON.stringify(g)}`); return; }
      if (['talk', 'give', 'hearts'].includes(g.type) && !isNpc(g.npc)) err(sw, `goal npc ${g.npc}`);
      if (['give', 'have'].includes(g.type) && (!hasItem(g.item) || !(g.qty >= 1))) err(sw, `goal item ${g.item}`);
      if (g.type === 'forage' && g.item && !hasItem(g.item)) err(sw, `forage item ${g.item}`);
      if (g.type === 'catch' && g.fish !== 'any' && !Data.fish[g.fish]) err(sw, `catch fish ${g.fish}`);
      if (g.type === 'visit') { if (!area(g.area)) err(sw, `visit area ${g.area}`); else if (g.anchor && !areaAnchorNames(g.area).includes(g.anchor)) err(sw, `visit anchor ${g.anchor}`); }
      if (g.type === 'job' && !Data.jobs[g.job]) err(sw, `goal job ${g.job}`);
      if (g.type === 'flag') flagsUsed.push([g.flag, sw]);
      if (g.type === 'date' && !(SEASONS.includes(g.season) && g.day >= 1 && g.day <= 28)) err(sw, 'bad date goal');
      if (st.onEnter) { checkScript(st.onEnter, `${sw}.onEnter`); collectFlagsSet(st.onEnter); }
      if (st.onDone) { checkScript(st.onDone, `${sw}.onDone`); collectFlagsSet(st.onDone); }
    });
    checkReward(q.reward, `${w}.reward`);
  }
  for (let n = 3; n <= 8; n++) {
    const q = questList.find((x) => x.id === ['m3_baker', 'm4_reader', 'm5_sailor', 'm6_cafe', 'm7_stargazer', 'm8_greatlantern'][n - 3]);
    if (q && q.stages.length !== 3) err(`quest ${q.id}`, 'lantern chains need exactly 3 stages');
    if (q && !JSON.stringify(q.reward.script).includes(`lantern_restored_${n - 2}`)) err(`quest ${q.id}`, `reward must call lantern_restored_${n - 2}`);
  }
  const sideCount = questList.filter((q) => q.kind === 'side').length;

  // ================= errands
  const errandKinds = ['deliver', 'bring', 'catch', 'forage', 'visit'];
  for (const e of Data.errands) {
    const w = `errand ${e.id}`;
    if (!errandKinds.includes(e.kind)) err(w, 'bad kind');
    if (!e.text || !(e.weight > 0)) err(w, 'bad text/weight');
    for (const n of e.pool.npcs || []) if (!isNpc(n)) err(w, `bad npc ${n}`);
    for (const i of e.pool.items || []) if (i !== 'any' && !hasItem(i)) err(w, `bad item ${i}`);
    if (!Array.isArray(e.pool.qty) || e.pool.qty[0] > e.pool.qty[1]) err(w, 'bad qty');
    if (!Array.isArray(e.reward.money) || e.reward.money[0] > e.reward.money[1]) err(w, 'bad reward');
    if (['deliver', 'bring'].includes(e.kind) && !(e.pool.items || []).length) err(w, 'needs items');
  }

  // ================= festivals & calendar
  for (const [id, f] of Object.entries(Data.festivals)) {
    const w = `festival ${id}`;
    if (!SEASONS.includes(f.date.season) || !(f.date.day >= 1 && f.date.day <= 28)) err(w, 'bad date');
    if (!area(f.area)) err(w, 'bad area');
    if (Number.isNaN(hhmm(f.from)) || Number.isNaN(hhmm(f.to))) err(w, 'bad times');
    if (!events[f.eventId]) err(w, `eventId ${f.eventId} not found`);
    if (!DECOR_SETS.includes(f.decor)) err(w, `bad decor ${f.decor}`);
    for (const c of f.closes || []) if (!INTERIORS.includes(c)) err(w, `closes: ${c} is not an interior`);
    const dp = f.placement && f.placement.default;
    if (!dp || !area(dp.area) || !dp.anchors.every((a) => areaAnchorNames(dp.area).includes(a))) err(w, 'bad default placement');
    for (const [n, p] of Object.entries((f.placement && f.placement.byNpc) || {})) if (!isNpc(n) || !anchorOk(p.area, p.at)) err(w, `bad placement for ${n}`);
  }
  for (const id of ['blossom', 'midsummer', 'harvest', 'hearthlight', 'lantern']) if (!Data.festivals[id]) err('festivals', `missing ${id}`);
  for (const f of Data.calendar.festivals) if (!Data.festivals[f]) err('calendar', `unknown festival ${f}`);
  for (const wk of Data.calendar.weekly) if (!WEEKDAYS.includes(wk.weekday)) err('calendar', `bad weekday ${wk.weekday}`);

  // ================= mail
  const mailList = Object.values(Data.mail);
  for (const m of mailList) {
    const w = `mail ${m.id}`;
    if (m.from !== 'town' && !isNpc(m.from)) err(w, `bad sender ${m.from}`);
    if (!m.subject || !Array.isArray(m.body) || !m.body.length) err(w, 'needs subject and body');
    (m.body || []).forEach((l) => checkText(l, w));
    checkCond(m.when, w);
    for (const it of (m.attach && m.attach.items) || []) if (!hasItem(it.id)) err(w, `attach item ${it.id}`);
  }

  // ================= books
  const bookList = Object.values(Data.books);
  for (const b of bookList) {
    const w = `book ${b.id}`;
    if (!hasItem(b.id) || items[b.id].category !== 'book') err(w, 'needs a matching book item');
    if (!/^bookshelf_lib_[1-6]$/.test(b.where)) err(w, `bad shelf ${b.where}`);
    if (!b.pages || !b.pages.length) err(w, 'no pages');
    if (b.hint && b.hint.quest && !quests[b.hint.quest]) err(w, 'hint quest unknown');
  }

  // ================= interactions
  const inter = Data.interactions;
  let interCount = 0;
  for (const [k, v] of Object.entries(inter)) {
    if (k === '_defaults') { for (const t of Object.keys(v)) if (!INTERACT_TYPES.includes(t)) err('interactions._defaults', `bad type ${t}`); continue; }
    interCount++;
    const [a, id] = k.split('.');
    if (!area(a) || !areaInteractables(a)[id]) err(`interaction ${k}`, 'unknown area/interactable');
    if (v.when) checkCond(v.when, `interaction ${k}`);
    if (v.script) { checkScript(v.script, `interaction ${k}`); collectFlagsSet(v.script); }
    if (!v.script && !(v.text && v.text.length)) err(`interaction ${k}`, 'needs script or text');
    (v.text || []).forEach((t) => checkText(t, `interaction ${k}`));
  }
  for (const t of INTERACT_TYPES) if (!(inter._defaults && inter._defaults[t])) warn('interactions._defaults', `no default for ${t}`);

  // ================= tutorial
  for (const t of Data.tutorial) {
    checkCond(t.when, `tutorial ${t.id}`);
    checkText(t.text, `tutorial ${t.id}`);
    if (t.icon && !ICON_SHAPES.includes(t.icon)) err(`tutorial ${t.id}`, `bad icon ${t.icon}`);
  }

  // ================= dialogue
  const GIFT_POOLS = ['love', 'like', 'neutral', 'dislike', 'hate', 'birthday', 'again'];
  const shopOwners = new Set(Object.values(shops).map((s) => s.owner));
  let talkEntries = 0;
  const lineText = (l) => (Array.isArray(l) ? l[0] : l);
  const checkLine = (l, w) => {
    checkText(lineText(l), w);
    if (Array.isArray(l) && l[1] && !EXPRESSIONS.includes(l[1])) err(w, `bad expression ${l[1]}`);
  };
  for (const id of NPC_IDS) {
    const d = Data.dialogue[id], w = `dialogue ${id}`;
    if (!d) { err(w, 'missing'); continue; }
    if (d.npc !== id) err(w, 'npc field mismatch');
    checkScript(d.intro, `${w}.intro`); collectFlagsSet(d.intro);
    if (!JSON.stringify(d.intro).includes(`"meet":"${id}"`)) err(w, 'intro must contain meet');
    if (!d.intro.some((s) => s.say)) err(w, 'intro needs say steps');
    if (!Array.isArray(d.talk) || d.talk.length < 6) err(w, `needs >= 6 talk entries (has ${d.talk && d.talk.length})`);
    const ids = new Set();
    for (const t of d.talk || []) {
      talkEntries++;
      if (ids.has(t.id)) err(w, `duplicate talk id ${t.id}`);
      ids.add(t.id);
      if (t.when) checkCond(t.when, `${w}.${t.id}`);
      if (!t.lines || !t.lines.length) err(`${w}.${t.id}`, 'no lines');
      (t.lines || []).forEach((l) => checkLine(l, `${w}.${t.id}`));
      if (t.after) { checkScript(t.after, `${w}.${t.id}.after`); }
    }
    if (!(d.talk || []).some((t) => !t.when)) err(w, 'needs at least one unconditional talk entry');
    for (const p of GIFT_POOLS) {
      const pool = d.gifts && d.gifts[p];
      if (!pool || pool.length < 2) err(w, `gifts.${p} needs >= 2 lines`);
      (pool || []).forEach((l) => checkLine(l, `${w}.gifts.${p}`));
    }
    if (shopOwners.has(id) && !(d.shop && d.shop.greet && d.shop.greet.length)) err(w, 'shopkeeper needs shop.greet');
    (d.shop && d.shop.greet || []).forEach((l) => checkLine(l, `${w}.shop`));
  }
  for (const [npc, shop] of [['hattie', 'flower_stall'], ['sable', 'peddler']]) {
    const d = Data.dialogue[npc];
    if (d && !JSON.stringify(d.intro).includes(`"shop":"${shop}"`)) err(`dialogue ${npc}`, `intro must offer shop ${shop}`);
    if (d && !d.talk.some((t) => t.after && JSON.stringify(t.after).includes(`"shop":"${shop}"`))) err(`dialogue ${npc}`, 'talk must offer the shop');
  }

  // ================= events
  const evList = Object.values(events);
  for (const id of EVENT_REQUIRED) if (!events[id]) err('events', `missing ${id}`);
  for (let n = 1; n <= 6; n++) if (!events[`lantern_restored_${n}`]) err('events', `missing lantern_restored_${n}`);
  for (const r of ROMANCE_IDS) {
    if (!events[`ending_together_${r}`]) err('events', `missing ending_together_${r}`);
    for (const h of [2, 4, 6, 8]) if (!events[`heart_${r}_${h}`]) err('events', `missing heart_${r}_${h}`);
  }
  for (const [id, e] of Object.entries(events)) {
    const w = `event ${id}`;
    if (e.id !== id) err(w, 'id mismatch');
    if (!['story', 'heart', 'friend', 'festival', 'misc'].includes(e.kind)) err(w, 'bad kind');
    if (e.npc && !isNpc(e.npc)) err(w, 'bad npc');
    if (typeof e.priority !== 'number') err(w, 'needs priority');
    // heart_*_8 may repeat (weekly) until the confession is accepted; everything else is one-shot
    if (e.once !== true && !(e.kind === 'heart' && /_8$/.test(id) && e.once === false && e.cooldownDays > 0)) err(w, 'needs once:true');
    if (e.music && !MUSIC_TRACKS.includes(e.music)) err(w, `bad music ${e.music}`);
    checkCond(e.when, `${w}.when`);
    checkScript(e.script, w);
    collectFlagsSet(e.script);
    const n = (e.script || []).length;
    if (n < 5) warn(w, `short script (${n} steps)`);
    if (e.kind === 'heart' && !JSON.stringify(e.when).includes('"hearts"')) err(w, 'heart event needs a hearts condition');
    if (e.kind === 'heart' && id.endsWith('_8') && !JSON.stringify(e.script).includes(`${e.npc}_dating`)) err(w, '8-heart event must set <npc>_dating');
  }
  const heartCount = evList.filter((e) => e.kind === 'heart').length;
  const friendCount = evList.filter((e) => e.kind === 'friend').length;
  for (const id of NPC_IDS) if (!evList.some((e) => e.id.startsWith(`friend_${id}_`)) && !ROMANCE_IDS.includes(id)) err('events', `no friend event for ${id}`);

  // ================= flags used must be set somewhere or settled
  for (const [f, where] of flagsUsed) {
    if (!flagsSet.has(f) && !SETTLED_FLAG.test(f)) err(where, `flag "${f}" is read but never set`);
  }

  const lineCountDialogue = Object.values(Data.dialogue).reduce((n, d) => n
    + d.talk.reduce((m, t) => m + t.lines.length, 0) + GIFT_POOLS.reduce((m, p) => m + d.gifts[p].length, 0)
    + d.intro.filter((s) => s.say).length, 0);

  const summary = {
    items: itemList.length, fish: fishList.length, legendary, forage: forageCount, foods: byCat.food || 0, gifts: giftCount, materials: byCat.material || 0,
    keyItems: keyCount, books: bookList.length, shops: Object.keys(shops).length, jobs: Object.keys(Data.jobs).length, buildings: Object.keys(Data.buildings).length,
    npcs: Object.keys(npcs).length, scheduleSlots: slotCount, quests: questList.length, sideQuests: sideCount, errands: Data.errands.length,
    festivals: Object.keys(Data.festivals).length, mail: mailList.length, interactions: interactCountSafe(interCount), tutorial: Data.tutorial.length,
    dialogueLines: lineCountDialogue, talkEntries, events: evList.length, heartEvents: heartCount, friendEvents: friendCount, textLines: counts.lines,
    forageSeasonItems: Math.min(...SEASONS.map((s) => forageSeasonItems[s].size)),
  };
  return { errors, warnings, summary };
}
function interactCountSafe(n) { return n; }

export const MINIMUMS = {
  items: 120, fish: 16, legendary: 2, forage: 24, foods: 16, gifts: 20, materials: 10, keyItems: 14, books: 10, shops: 8, jobs: 3, buildings: 11, npcs: 19,
  quests: 27, sideQuests: 14, errands: 8, festivals: 5, mail: 30, interactions: 60, tutorial: 12, heartEvents: 20, friendEvents: 14,
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const { errors, warnings, summary } = await validateContent();
  for (const [k, min] of Object.entries(MINIMUMS)) if (summary[k] < min) errors.push(`minimum: ${k} is ${summary[k]}, needs >= ${min}`);
  console.log('Content summary');
  for (const [k, v] of Object.entries(summary)) console.log(`  ${k.padEnd(18)} ${v}`);
  if (warnings.length) { console.log(`\n${warnings.length} warning(s):`); warnings.slice(0, 40).forEach((w) => console.log(`  warn  ${w}`)); }
  if (errors.length) {
    console.log(`\n${errors.length} ERROR(S):`);
    errors.slice(0, 200).forEach((e) => console.log(`  ERROR ${e}`));
    process.exit(1);
  }
  console.log('\nOK: content valid');
}
