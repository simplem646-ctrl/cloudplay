#!/usr/bin/env node
/**
 * Static obtainability / reachability analysis of the game content (quests, items, shops, forage, fish, jobs,
 * schedules, events, mail, dialogue, interactions). Answers: "can a player actually finish every quest?"
 *
 *   node tools/analyze-content.mjs            readable report, exit 1 when there are blockers
 *   node tools/analyze-content.mjs --json     machine-readable facts (used to write docs/game/WALKTHROUGH.md)
 *
 * Method: a fix-point over "containers" (quest stages/rewards, events, interactable scripts, mail, dialogue entries).
 * A container is LIVE when its gate condition is satisfiable with what has been proven achievable so far (flags set by
 * live scripts, items from live sources, quests started/done ...). Live containers contribute items, flags, lanterns and
 * quest starts. Quest goals are then checked against the proven sources. The analysis is deliberately optimistic about
 * *which day/time* things happen (a `not` is assumed satisfiable) but strict about whether a source exists at all.
 */
import { fileURLToPath } from 'node:url';
import * as R from '../src/core/registry.js';
import { parseHHMM, weekdayName } from '../src/core/util.js';
import { AFFECTION, START_MONEY } from '../src/core/constants.js';

const WEEKDAYS = R.WEEKDAYS;
const SEASONS = R.SEASONS;
const DAY_END_MIN = 30 * 60;
const arr = (v) => (Array.isArray(v) ? v : v === undefined || v === null ? [] : [v]);
const dayIdx = (season, day) => SEASONS.indexOf(season) * 28 + day; // 1..112
const fmtDay = (i) => `${SEASONS[Math.floor((i - 1) / 28)]} ${((i - 1) % 28) + 1}`;

export function analyze(Data, { year1Only = true } = {}) {
  const blockers = [];
  const warnings = [];
  const info = [];
  const B = (m) => blockers.push(m);
  const W = (m) => warnings.push(m);
  const I = (m) => info.push(m);

  const ITEMS = Data.items;
  const QUESTS = Data.quests;
  const EVENTS = Data.events;
  const NPCS = Data.npcs;
  const hasItem = (id) => !!ITEMS[id];

  // ------------------------------------------------------------------ areas, buildings, water
  const AREA_OK = (a) => !!R.AREAS[a];
  const connected = (() => {
    const seen = new Set(['brook_lane']);
    const q = ['brook_lane'];
    while (q.length) for (const n of R.AREAS[q.shift()].neighbors) if (!seen.has(n)) { seen.add(n); q.push(n); }
    return seen;
  })();
  for (const a of R.AREA_IDS) if (!connected.has(a)) B(`area ${a} is not connected to Brook Lane`);

  const waterAreas = {}; // water kind -> [areas]
  for (const a of R.AREA_IDS) for (const id of R.fishingIds(a)) (waterAreas[R.fishingWaterKind(a, id)] ||= new Set()).add(a);

  /** Weekdays + [from,to) window a building can be entered (interiors only). null = always. */
  const building = (area) => {
    if (R.AREAS[area]?.kind !== 'interior') return null;
    const b = Data.buildings?.[area];
    if (!b) return null;
    return { days: WEEKDAYS.filter((d) => !(b.closedDays || []).includes(d)), from: parseHHMM(b.open ?? '00:00'), to: parseHHMM(b.close ?? '30:00'), lockFlag: b.lockFlag };
  };
  const overlaps = (a0, a1, b0, b1) => Math.max(a0, b0) < Math.min(a1, b1);
  /** Can the player be inside `area` on `weekday` during [from,to)? (festival closures ignored: they are one-day) */
  const areaOpen = (area, weekday, from = 0, to = DAY_END_MIN) => {
    const b = building(area);
    if (!b) return true;
    return b.days.includes(weekday) && overlaps(from, to, b.from, b.to);
  };

  // ------------------------------------------------------------------ NPC presence (schedules)
  const evalSched = (when, ctx) => {
    if (when === undefined || when === null) return true;
    if (Array.isArray(when)) return when.every((c) => evalSched(c, ctx));
    return Object.entries(when).every(([k, v]) => {
      if (k === 'weekday') return arr(v).includes(ctx.weekday);
      if (k === 'weather') return arr(v).includes(ctx.weather);
      if (k === 'season') return arr(v).includes(ctx.season);
      return true;
    });
  };
  const presence = {}; // npc -> [{weekday, weather, area, at, from, to}]
  for (const npc of R.NPC_IDS) {
    const rules = Data.schedules?.[npc];
    const out = [];
    if (!rules) { B(`NPC ${npc} has no schedule`); presence[npc] = out; continue; }
    for (const weekday of WEEKDAYS) {
      for (const weather of ['sunny', 'rain', 'snow']) {
        const rule = rules.find((r) => evalSched(r.when, { weekday, weather, season: 'spring' }));
        if (!rule) continue;
        const slots = rule.slots.slice().sort((a, b) => parseHHMM(a.from) - parseHHMM(b.from));
        slots.forEach((s, i) => {
          if (s.hidden) return;
          const from = parseHHMM(s.from);
          const to = i + 1 < slots.length ? parseHHMM(slots[i + 1].from) : DAY_END_MIN;
          if (!AREA_OK(s.area)) { B(`schedule ${npc}: slot area ${s.area} does not exist`); return; }
          if (areaOpen(s.area, weekday, from, to)) out.push({ weekday, weather, area: s.area, at: s.at, from, to });
        });
      }
    }
    presence[npc] = out;
  }
  const npcReachable = (npc) => !!presence[npc]?.length || Object.values(Data.festivals || {}).some((f) => f.placement?.byNpc?.[npc]);
  const npcDays = (npc) => [...new Set((presence[npc] || []).map((p) => p.weekday))];
  for (const npc of R.NPC_IDS) if (!npcReachable(npc)) B(`NPC ${npc} is never visible anywhere (every slot hidden or in a closed building)`);

  // ------------------------------------------------------------------ fish
  const fishOk = {}; // fish id -> {ok, why}
  for (const f of Object.values(Data.fish || {})) {
    let why = null;
    if (!hasItem(f.id)) why = 'no item definition';
    else if (!(f.weight > 0)) why = 'weight 0';
    else if (!arr(f.seasons).length) why = 'no seasons';
    else if (!arr(f.weather).length) why = 'no weather';
    else if (!f.time || parseHHMM(f.time.from) >= parseHHMM(f.time.to)) why = 'empty time window';
    else if (!arr(f.spots).some((k) => waterAreas[k]?.size)) why = `no fishing spot with water kind ${arr(f.spots).join('/')}`;
    fishOk[f.id] = { ok: !why, why };
    if (why) W(`fish ${f.id} can never be caught: ${why}`);
  }

  // ------------------------------------------------------------------ sources
  /** item -> [{kind, detail, renewable, seasons?, price?, gate?}] */
  const sources = new Map();
  const addSource = (item, s) => {
    if (!sources.has(item)) sources.set(item, []);
    sources.get(item).push(s);
  };

  // shops
  const shopAvail = {}; // shop id -> {ok, days, why}
  for (const sh of Object.values(Data.shops || {})) {
    let ok = true;
    let days = WEEKDAYS.slice();
    let why = '';
    if (!R.AREAS[sh.area]) { ok = false; why = `area ${sh.area} missing`; }
    else if (sh.counter) {
      const b = building(sh.area);
      if (b) { days = b.days; ok = days.length > 0; }
      if (R.AREAS[sh.area].kind === 'interior' && sh.counter && R.areaInteractables(sh.area)[sh.counter] !== 'shop') { ok = false; why = `counter ${sh.counter} is not a shop interactable`; }
    } else {
      // stall: reached by talking to its owner (NPC menu "Browse wares"), who has to be standing there
      const here = (presence[sh.owner] || []).filter((p) => p.area === sh.area || sh.id === 'peddler');
      days = [...new Set(here.map((p) => p.weekday))];
      ok = days.length > 0;
      if (!ok) why = `owner ${sh.owner} is never in ${sh.area}`;
    }
    shopAvail[sh.id] = { ok, days, why };
    if (!ok) B(`shop ${sh.id} is unreachable: ${why || 'closed every day'}`);
    for (const row of sh.stock || []) {
      if (!hasItem(row.item)) { B(`shop ${sh.id} sells unknown item ${row.item}`); continue; }
      const price = row.price ?? ITEMS[row.item].price?.buy;
      if (price === null || price === undefined) { W(`shop ${sh.id}: ${row.item} has no price (never listed)`); continue; }
      if (!ok) continue;
      addSource(row.item, { kind: 'shop', detail: sh.id, price, days, seasons: row.seasons || SEASONS, limit: row.limit, renewable: row.limit === undefined });
    }
  }

  // forage
  const forageSpots = (a) => R.AREAS[a]?.forage || 0;
  for (const [area, bySeason] of Object.entries(Data.forage || {})) {
    if (!R.AREAS[area]) { B(`forage table for unknown area ${area}`); continue; }
    if (!forageSpots(area)) { W(`forage table for ${area}, which has no forage spots`); continue; }
    for (const [season, rows] of Object.entries(bySeason)) {
      const total = rows.reduce((s, r) => s + (r.weight || 0), 0);
      for (const r of rows) {
        if (!r.item) continue;
        if (!hasItem(r.item)) { B(`forage ${area}/${season}: unknown item ${r.item}`); continue; }
        if (!(r.weight > 0)) continue;
        addSource(r.item, { kind: 'forage', detail: area, seasons: [season], chance: r.weight / total, spots: forageSpots(area), renewable: true });
      }
    }
  }

  // fish
  for (const f of Object.values(Data.fish || {})) {
    if (!fishOk[f.id]?.ok) continue;
    const areas = [...new Set(arr(f.spots).flatMap((k) => [...(waterAreas[k] || [])]))];
    addSource(f.id, { kind: 'fish', detail: areas.join('/'), seasons: f.seasons, renewable: true });
  }

  // ------------------------------------------------------------------ containers (scripts that grant things)
  /** Walk script steps. cb(step, gates) is called for every step; nested `if`/`ask` add their conditions as gates. */
  const walk = (steps, gates, cb, depth = 0) => {
    if (depth > 12) return;
    for (const s of arr(steps)) {
      if (!s || typeof s !== 'object') continue;
      cb(s, gates);
      if (s.if !== undefined && (s.then || s.else)) {
        walk(s.then, [...gates, s.if], cb, depth + 1);
        walk(s.else, [...gates, { not: s.if }], cb, depth + 1);
      }
      if (Array.isArray(s.ask)) for (const o of s.ask) walk(o.then, o.if !== undefined ? [...gates, o.if] : gates, cb, depth + 1);
      if (Array.isArray(s.parallel)) for (const b of s.parallel) walk(b, gates, cb, depth + 1);
    }
  };
  const resolveScript = (id) => {
    if (EVENTS[id]?.script) return EVENTS[id].script;
    if (typeof id === 'string' && id.endsWith('.intro') && Data.dialogue?.[id.slice(0, -6)]?.intro) return Data.dialogue[id.slice(0, -6)].intro;
    const ia = Data.interactions?.[id];
    if (ia) return Array.isArray(ia) ? ia : ia.script || null;
    if (Data.dialogue?.[id]?.intro) return Data.dialogue[id].intro;
    return null;
  };

  /** Containers: { id, kind, gates:[cond], steps, quest?:{id, upTo} } */
  const containers = [];
  const addC = (c) => containers.push(c);

  for (const q of Object.values(QUESTS)) {
    q.stages.forEach((st, i) => {
      if (st.onEnter) addC({ id: `${q.id}#${i}.onEnter`, kind: 'quest', gates: [], steps: st.onEnter, quest: { id: q.id, upTo: i - 1 } });
      if (st.onDone) addC({ id: `${q.id}#${i}.onDone`, kind: 'quest', gates: [], steps: st.onDone, quest: { id: q.id, upTo: i } });
    });
    const rw = q.reward || {};
    const rsteps = [
      ...arr(rw.items).map((it) => ({ giveItem: it.id, qty: it.qty })),
      ...arr(rw.flags).map((f) => ({ setFlag: f })),
      ...arr(rw.script),
    ];
    addC({ id: `${q.id}.reward`, kind: 'quest', gates: [], steps: rsteps, quest: { id: q.id, upTo: q.stages.length - 1 } });
  }
  for (const ev of Object.values(EVENTS)) addC({ id: `event:${ev.id}`, kind: 'event', gates: [ev.when], steps: ev.script, event: ev });
  for (const [key, ia] of Object.entries(Data.interactions || {})) {
    if (key === '_defaults') continue;
    const [area] = key.split('.');
    const b = building(area);
    const gates = [];
    if (ia.when) gates.push(ia.when);
    if (b?.lockFlag) gates.push({ flag: b.lockFlag });
    if (b && !b.days.length) gates.push(false);
    const steps = Array.isArray(ia) ? ia : ia.script;
    if (steps) addC({ id: `interact:${key}`, kind: 'interact', gates, steps });
  }
  for (const m of Object.values(Data.mail || {})) {
    const steps = [...arr(m.attach?.items).map((it) => ({ giveItem: it.id, qty: it.qty }))];
    addC({ id: `mail:${m.id}`, kind: 'mail', gates: [m.when], steps, mail: m.id });
  }
  for (const [npc, d] of Object.entries(Data.dialogue || {})) {
    if (d.intro) addC({ id: `dlg:${npc}.intro`, kind: 'dialogue', gates: [{ met: npc }], steps: d.intro, npc });
    for (const e of d.talk || []) if (e.after) addC({ id: `dlg:${npc}.${e.id}`, kind: 'dialogue', gates: [e.when, { met: npc }], steps: e.after, npc });
  }
  for (const j of Object.values(Data.jobs || {})) {
    addC({ id: `job:${j.id}`, kind: 'job', gates: [], steps: [...arr(j.intro), ...arr(j.done)] });
  }

  // ------------------------------------------------------------------ fix-point state
  const flags = new Set();
  const items = new Map(); // item -> renewable?
  const startable = new Set();
  const done = new Set();
  const liveC = new Set();
  const mailSent = new Set();
  const startedBy = new Map(); // quest -> [container ids]
  const lanternGrants = new Set(); // container ids granting a lantern
  const lanternMax = () => Math.min(6, lanternGrants.size); // each live container grants >= 1
  const flagSetters = new Map(); // flag -> [container ids]

  // initial achievable things: renewable shop/forage/fish sources are items; seasonal availability ignored (a season exists in a year)
  for (const [item, ss] of sources) items.set(item, ss.some((s) => s.renewable));

  // optimistic engine flags
  const engineFlag = (f) => /^(met_|job_intro_)/.test(f);

  /** Date bounds of a cond (year 1): returns {lo, hi} day index. */
  const dateBounds = (cond) => {
    let lo = 1;
    let hi = 112;
    const visit = (c) => {
      if (!c || typeof c !== 'object') return;
      if (Array.isArray(c)) return c.forEach(visit);
      if (c.dateFrom) lo = Math.max(lo, dayIdx(c.dateFrom.season, c.dateFrom.day));
      if (c.dateTo) hi = Math.min(hi, dayIdx(c.dateTo.season, c.dateTo.day));
      if (c.date) { lo = Math.max(lo, dayIdx(c.date.season, c.date.day)); hi = Math.min(hi, dayIdx(c.date.season, c.date.day)); }
      if (c.day) { if (c.day.gte !== undefined) lo = Math.max(lo, c.day.gte); if (c.day.lte !== undefined) hi = Math.min(hi, c.day.lte); }
      if (c.all) arr(c.all).forEach(visit);
    };
    visit(cond);
    return { lo, hi };
  };

  const sat = (cond) => {
    if (cond === undefined || cond === null || cond === true) return true;
    if (cond === false) return false;
    if (Array.isArray(cond)) {
      if (!cond.every(sat)) return false;
      const { lo, hi } = dateBounds(cond);
      return lo <= hi;
    }
    if (typeof cond !== 'object') return false;
    for (const [k, v] of Object.entries(cond)) {
      let ok = true;
      switch (k) {
        case 'all': ok = arr(v).every(sat); break;
        case 'any': ok = arr(v).some(sat); break;
        case 'not': ok = true; break; // optimistic
        case 'flag': ok = flags.has(v) || engineFlag(v); break;
        case 'notFlag': ok = true; break;
        case 'flagGte': ok = flags.has(v[0]); break;
        case 'hearts': ok = !!NPCS[v.npc] && (v.gte === undefined || v.gte <= AFFECTION.maxHearts); break;
        case 'status': ok = !!NPCS[v.npc] && (v.is !== 'dating' || flags.has(`${v.npc}_dating`)); break;
        case 'met': ok = !!NPCS[v] && npcReachable(v); break;
        case 'season': ok = arr(v).every((s) => SEASONS.includes(s)); break;
        case 'weekday': ok = arr(v).every((d) => WEEKDAYS.includes(d)); break;
        case 'weather': ok = arr(v).every((w) => R.WEATHERS.includes(w)); break;
        case 'year': ok = v.lte === undefined || v.lte >= 1; if (year1Only && v.gte !== undefined && v.gte > 1) ok = false; break;
        case 'day': ok = (v.lte === undefined || v.lte >= 1) && (v.gte === undefined || v.gte <= 112); break;
        case 'date': ok = SEASONS.includes(v.season) && v.day >= 1 && v.day <= 28; break;
        case 'dateFrom': ok = SEASONS.includes(v.season) && dayIdx(v.season, v.day) <= 112; break;
        case 'dateTo': ok = SEASONS.includes(v.season); break;
        case 'time': ok = parseHHMM(v.from) !== parseHHMM(v.to); break;
        case 'night': ok = true; break;
        case 'area': ok = arr(v).every(AREA_OK); break;
        case 'indoors': ok = true; break;
        case 'item': ok = items.has(v.id); break;
        case 'money': ok = true; break;
        case 'energy': ok = true; break;
        case 'quest': {
          if (!QUESTS[v.id]) { ok = false; break; }
          ok = v.state === 'done' ? done.has(v.id) : v.state === 'active' ? startable.has(v.id) : true;
          break;
        }
        case 'lanterns': ok = v.gte === undefined || v.gte <= lanternMax(); break;
        case 'jobDone': ok = !!Data.jobs?.[v]; break;
        case 'festival': ok = v === true || !!Data.festivals?.[v]; break;
        case 'chance': ok = v > 0; break;
        default: ok = false;
      }
      if (!ok) return false;
    }
    return true;
  };

  // ---- goals
  const itemObtainable = (id) => items.has(id);
  const goalCheck = (g, q) => {
    switch (g.type) {
      case 'talk': return NPCS[g.npc] ? (npcReachable(g.npc) ? null : `NPC ${g.npc} never visible`) : `unknown NPC ${g.npc}`;
      case 'give': {
        if (!NPCS[g.npc]) return `unknown NPC ${g.npc}`;
        if (!npcReachable(g.npc)) return `NPC ${g.npc} never visible`;
        if (!hasItem(g.item)) return `unknown item ${g.item}`;
        if (ITEMS[g.item].key || ITEMS[g.item].category === 'key') return `item ${g.item} is a key item: the gift picker never offers it`;
        if ((g.qty ?? 1) > 1 && ITEMS[g.item].stack === 1) return `item ${g.item} does not stack, cannot hold ${g.qty}`;
        if (!itemObtainable(g.item)) return `item ${g.item} has no source`;
        return null;
      }
      case 'have':
        if (!hasItem(g.item)) return `unknown item ${g.item}`;
        if ((g.qty ?? 1) > 1 && ITEMS[g.item].stack === 1) return `item ${g.item} does not stack, cannot hold ${g.qty}`;
        return itemObtainable(g.item) ? null : `item ${g.item} has no source`;
      case 'catch': {
        if (!(items.has('fishing_rod'))) return 'no fishing rod obtainable';
        if (g.fish === 'any') return Object.values(fishOk).some((f) => f.ok) ? null : 'no fish can be caught';
        return fishOk[g.fish]?.ok ? null : `fish ${g.fish} cannot be caught (${fishOk[g.fish]?.why || 'unknown fish'})`;
      }
      case 'forage': {
        if (!g.item) return [...sources.values()].some((ss) => ss.some((s) => s.kind === 'forage')) ? null : 'nothing to forage';
        return sources.get(g.item)?.some((s) => s.kind === 'forage') ? null : `item ${g.item} is not in any forage table`;
      }
      case 'visit': {
        if (!AREA_OK(g.area)) return `unknown area ${g.area}`;
        if (g.anchor && !R.areaAnchorNames(g.area).includes(g.anchor)) return `area ${g.area} has no anchor ${g.anchor}`;
        const b = building(g.area);
        if (b && !b.days.length) return `${g.area} is closed every day`;
        if (b?.lockFlag && !flags.has(b.lockFlag)) return `${g.area} needs flag ${b.lockFlag}, which nothing sets`;
        return null;
      }
      case 'job': {
        const j = Data.jobs?.[g.job];
        if (!j) return `unknown job ${g.job}`;
        const b = building(j.area);
        const days = arr(j.days).filter((d) => !b || b.days.includes(d));
        if (!days.length) return `job ${g.job}: ${j.area} is closed on all its work days`;
        if (b && !overlaps(parseHHMM(j.from), parseHHMM(j.to), b.from, b.to)) return `job ${g.job}: hours do not overlap the building hours`;
        return null;
      }
      case 'hearts': {
        if (!NPCS[g.npc]) return `unknown NPC ${g.npc}`;
        if (g.hearts > AFFECTION.maxHearts) return `${g.hearts} hearts > max ${AFFECTION.maxHearts}`;
        return npcReachable(g.npc) ? null : `NPC ${g.npc} never visible`;
      }
      case 'date': return SEASONS.includes(g.season) && g.day >= 1 && g.day <= 28 ? null : 'bad date';
      case 'lanterns': return g.count <= lanternMax() ? null : `needs ${g.count} lanterns, only ${lanternMax()} grantable`;
      case 'flag': return flags.has(g.flag) ? null : `flag ${g.flag} is never set`;
      case 'earn': return null;
      default: return `unknown goal type ${g.type}`;
    }
  };
  const questUpTo = (id, upTo) => {
    const q = QUESTS[id];
    if (!q || !startable.has(id)) return false;
    for (let i = 0; i <= upTo && i < q.stages.length; i++) if (goalCheck(q.stages[i].goal, q)) return false;
    return true;
  };
  const questFeasible = (id) => questUpTo(id, QUESTS[id].stages.length - 1);

  // ---- main fix-point
  const startTargets = new Map(); // quest -> container ids that start it
  let changed = true;
  let guard = 0;
  while (changed && guard++ < 60) {
    changed = false;
    const mark = (set, v) => { if (!set.has(v)) { set.add(v); changed = true; } };

    // quests startable: unlock holds AND (started by a live script, or auto-start kind with an unlock)
    for (const q of Object.values(QUESTS)) {
      if (startable.has(q.id)) continue;
      const scripted = (startTargets.get(q.id) || []).length > 0;
      const auto = q.unlock !== undefined && q.kind !== 'errand';
      const unlockOk = q.unlock !== undefined && sat(q.unlock);
      if (scripted || (auto && unlockOk && (q.kind !== 'side' || npcReachable(q.giver)))) mark(startable, q.id);
    }
    // quest completion
    for (const q of Object.values(QUESTS)) if (!done.has(q.id) && questFeasible(q.id)) mark(done, q.id);

    for (const c of containers) {
      const live = c.gates.every(sat) && (!c.quest || questUpTo(c.quest.id, c.quest.upTo) || (c.quest.upTo < 0 && startable.has(c.quest.id)));
      if (live && !liveC.has(c.id)) { liveC.add(c.id); changed = true; }
      if (!live) continue;
      if (c.event) mark(flags, `seen_${c.event.id}`);
      if (c.mail) mailSent.add(c.mail);
      const visit = (steps, gates, depth) => walk(steps, gates, (s, g) => {
        if (!g.every(sat)) return;
        if (s.giveItem) {
          if (!hasItem(s.giveItem)) B(`${c.id}: giveItem unknown item ${s.giveItem}`);
          else {
            const prevRen = items.get(s.giveItem);
            if (!items.has(s.giveItem)) { items.set(s.giveItem, false); changed = true; }
            const list = (sources.has(s.giveItem) ? sources : sources.set(s.giveItem, [])).get(s.giveItem);
            if (!list.some((x) => x.detail === c.id)) list.push({ kind: 'reward', detail: c.id, renewable: false });
            void prevRen;
          }
        }
        if (s.setFlag) {
          mark(flags, s.setFlag);
          if (!flagSetters.has(s.setFlag)) flagSetters.set(s.setFlag, new Set());
          flagSetters.get(s.setFlag).add(c.id);
        }
        if (s.startQuest) {
          if (!QUESTS[s.startQuest]) B(`${c.id}: startQuest unknown quest ${s.startQuest}`);
          else {
            const l = startTargets.get(s.startQuest) || [];
            if (!l.includes(c.id)) { l.push(c.id); startTargets.set(s.startQuest, l); changed = true; }
          }
        }
        if (s.completeQuest) {
          if (!QUESTS[s.completeQuest]) B(`${c.id}: completeQuest unknown quest ${s.completeQuest}`);
          else mark(done, s.completeQuest);
        }
        if (s.lantern) {
          if (!lanternGrants.has(c.id)) { lanternGrants.add(c.id); changed = true; }
          for (let k = 1; k <= Math.min(6, lanternGrants.size); k++) mark(flags, `lantern_${k}`);
        }
        if (s.mail) {
          if (!Data.mail?.[s.mail]) B(`${c.id}: mail unknown id ${s.mail}`);
          else mailSent.add(s.mail);
        }
        if (s.shop && !Data.shops?.[s.shop]) B(`${c.id}: shop op unknown shop ${s.shop}`);
        if (s.call) {
          const sub = resolveScript(s.call);
          if (!sub) B(`${c.id}: call of missing script "${s.call}"`);
          else if (depth < 6) visit(sub, g, depth + 1);
        }
      });
      visit(c.steps, [], 0);
    }
    // mail sent by script is live even when `when` is false: handled by gates only for periodic mail
    for (const m of mailSent) {
      const mc = containers.find((c) => c.mail === m);
      if (mc && !liveC.has(mc.id)) { liveC.add(mc.id); changed = true; for (const it of arr(Data.mail[m].attach?.items)) if (!items.has(it.id)) items.set(it.id, false); }
    }
    // mail attach items from live mail containers were already handled via steps
    // engine-set flags: dating / met are set by scripts we scan; met_* by talking
  }

  // ------------------------------------------------------------------ checks
  // data integrity of ids referenced by content
  for (const id of new Set(Object.values(Data.npcs).flatMap((n) => ['loves', 'likes', 'dislikes', 'hates'].flatMap((k) => arr(n[k]?.items))))) if (!hasItem(id)) B(`NPC preference lists unknown item ${id}`);
  for (const [qid, q] of Object.entries(QUESTS)) {
    if (!NPCS[q.giver]) B(`quest ${qid}: unknown giver ${q.giver}`);
    for (const it of arr(q.reward?.items)) if (!hasItem(it.id)) B(`quest ${qid}: reward item ${it.id} is not defined`);
  }

  const questReport = [];
  for (const q of Object.values(QUESTS)) {
    const row = { id: q.id, kind: q.kind, title: q.title, giver: q.giver, startable: startable.has(q.id), unlock: q.unlock, earliest: dateBounds(q.unlock).lo, stages: [], money: q.reward?.money || 0, rewardItems: arr(q.reward?.items) };
    if (!startable.has(q.id)) {
      const how = q.unlock === undefined ? 'has no unlock and nothing runs startQuest on it' : `unlock ${JSON.stringify(q.unlock)} is not satisfiable`;
      B(`quest ${q.id} can never start: ${how}`);
    }
    if (q.unlock !== undefined) {
      const { lo, hi } = dateBounds(q.unlock);
      if (lo > hi) B(`quest ${q.id}: unlock date window is empty (${fmtDay(lo)} > ${fmtDay(hi)})`);
      if (year1Only && lo > 112) B(`quest ${q.id}: unlock only opens after Year 1`);
    }
    q.stages.forEach((st, i) => {
      const why = goalCheck(st.goal, q);
      let src = '';
      const g = st.goal;
      const itm = g.item && sources.get(g.item);
      if (itm) src = itm.map((s) => (s.kind === 'shop' ? `shop ${s.detail} ${s.price}c` : s.kind === 'reward' ? `reward ${s.detail}` : `${s.kind} ${s.detail}`)).join('; ');
      row.stages.push({ i, id: st.id, goal: g, text: st.text, ok: !why, why, src });
      if (why && startable.has(q.id)) B(`quest ${q.id} stage ${i} (${st.id}): ${why}`);
      else if (why) B(`quest ${q.id} stage ${i} (${st.id}): ${why}`);
    });
    questReport.push(row);
  }

  // main chain date consistency (DESIGN sections 8/9)
  const expectChain = { m3_baker: ['spring', 3], m4_reader: ['spring', 15], m5_sailor: ['summer', 1], m6_cafe: ['summer', 15], m7_stargazer: ['autumn', 1] };
  for (const [id, [s, d]] of Object.entries(expectChain)) {
    const q = QUESTS[id];
    if (!q) { B(`main quest ${id} missing`); continue; }
    const lo = dateBounds(q.unlock).lo;
    if (lo !== dayIdx(s, d)) B(`${id}: unlock opens ${fmtDay(lo)}, DESIGN says ${s} ${d}`);
    if (!arr(q.unlock).some((c) => c.quest?.id === 'm2_journal' && c.quest.state === 'done')) B(`${id}: should require m2_journal done`);
  }
  const m8 = QUESTS.m8_greatlantern;
  if (!m8 || !JSON.stringify(m8.unlock).includes('workshop_unlocked') || !JSON.stringify(m8.unlock).includes('"gte":5')) B('m8_greatlantern should unlock on workshop_unlocked + lanterns >= 5');
  const m9 = QUESTS.m9_festival;
  if (!m9 || !m9.stages.some((s) => s.goal.type === 'date' && s.goal.season === 'winter' && s.goal.day === 24)) B('m9_festival should wait for Winter 24');
  const j = QUESTS.m2_journal;
  if (j && !flags.has('journal_found')) B('flag journal_found is never set');
  if (!flags.has('workshop_unlocked')) B('flag workshop_unlocked is never set');
  if (!flags.has('festival_lit')) B('flag festival_lit is never set');
  for (const f of ['ending_friends', ...R.ROMANCE_IDS.map((n) => `ending_together_${n}`)]) if (!liveC.has(`event:${f}`)) B(`ending event ${f} can never run`);
  if (lanternMax() < 6) B(`only ${lanternMax()} of 6 lanterns can be granted`);

  // festival events: placed in a real area, window inside the festival window
  for (const f of Object.values(Data.festivals || {})) {
    if (!EVENTS[f.eventId]) B(`festival ${f.id}: event ${f.eventId} missing`);
    else if (!liveC.has(`event:${f.eventId}`)) B(`festival ${f.id}: event ${f.eventId} can never run (its condition is unsatisfiable)`);
  }
  // heart events live?
  for (const ev of Object.values(EVENTS)) if (!liveC.has(`event:${ev.id}`) && !/^lantern_restored_/.test(ev.id)) W(`event ${ev.id} can never trigger (condition unsatisfiable): ${JSON.stringify(ev.when).slice(0, 120)}`);

  // ---- event trigger feasibility: can the player actually BE in the trigger area, at that time, on such a day?
  // (catches e.g. an event in a building that is closed on the required weekday or before the required hour)
  const dnf = (cond) => {
    if (cond === undefined || cond === null || cond === true) return [[]];
    if (Array.isArray(cond)) return cond.reduce((acc, c) => acc.flatMap((a) => dnf(c).map((b) => [...a, ...b])), [[]]);
    return Object.entries(cond).reduce((acc, [k, v]) => {
      let alts;
      if (k === 'all') alts = dnf(arr(v));
      else if (k === 'any') alts = arr(v).flatMap((c) => dnf(c));
      else alts = [[{ k, v }]];
      return acc.flatMap((a) => alts.map((b) => [...a, ...b]));
    }, [[]]);
  };
  const NIGHT = [1110, 30 * 60];
  const eventTriggerProblem = (ev) => {
    const alts = dnf(ev.when);
    const reasons = [];
    const okAlts = [];
    for (const conj of alts) {
      let days = WEEKDAYS.slice();
      let win = [360, 26 * 60];
      let areas = null;
      let fest = null;
      let why = null;
      for (const { k, v } of conj) {
        if (k === 'area') areas = areas ? areas.filter((a) => arr(v).includes(a)) : arr(v);
        else if (k === 'weekday') days = days.filter((d) => arr(v).includes(d));
        else if (k === 'not' && v.weekday) days = days.filter((d) => !arr(v.weekday).includes(d));
        else if (k === 'time') win = [Math.max(win[0], parseHHMM(v.from)), Math.min(win[1], parseHHMM(v.to))];
        else if (k === 'night') win = v ? [Math.max(win[0], NIGHT[0]), Math.min(win[1], NIGHT[1])] : win;
        else if (k === 'festival' && v !== true) fest = Data.festivals?.[v] || null;
        else if (k === 'dateFrom' || k === 'date' || k === 'dateTo' || k === 'season') { /* calendar: handled by satisfiability */ }
      }
      if (areas && areas.length === 0) { reasons.push('conflicting area conditions'); continue; }
      if (fest) {
        days = [weekdayName(fest.date.day)];
        win = [Math.max(win[0], parseHHMM(fest.from)), Math.min(win[1], parseHHMM(fest.to))];
        if (areas && !areas.includes(fest.area)) { reasons.push(`festival ${fest.id} happens in ${fest.area}`); continue; }
        if (areas?.some((a) => fest.closes?.includes(a))) why = 'closed for the festival';
      }
      if (!days.length) { reasons.push('no weekday allowed'); continue; }
      if (win[0] >= win[1]) { reasons.push('empty time window'); continue; }
      if (why) { reasons.push(why); continue; }
      const here = areas || [null];
      let anyOk = false;
      for (const a of here) {
        if (a === null || R.AREAS[a]?.kind !== 'interior') { anyOk = true; continue; }
        const b = building(a);
        const open = days.some((d) => b.days.includes(d) && overlaps(win[0], win[1], b.from, b.to));
        const viaJob = Object.values(Data.jobs || {}).some((j) => j.area === a && days.some((d) => arr(j.days).includes(d)) && overlaps(win[0], win[1], parseHHMM(j.from), parseHHMM(j.to)));
        if (open || viaJob) anyOk = true;
        else reasons.push(`${a} is closed when this event needs it (${days.join('/')} ${Math.floor(win[0] / 60)}:00-${Math.floor(win[1] / 60)}:00; opens ${b.days.join('/')} ${Math.floor(b.from / 60)}:00-${Math.floor(b.to / 60)}:00)`);
      }
      if (anyOk) okAlts.push({ fest: !!fest });
    }
    if (!okAlts.length) return { why: reasons[0] || 'unsatisfiable' };
    return { branches: alts.length, ok: okAlts.length, bad: reasons, onlyFestival: okAlts.every((a) => a.fest) };
  };
  for (const ev of Object.values(EVENTS)) {
    if (/^lantern_restored_|^ending_/.test(ev.id)) continue; // run by `call` from quests / the festival script, not by their own trigger
    const r = eventTriggerProblem(ev);
    if (r.why) B(`event ${ev.id} can never trigger in play: ${r.why}`);
    else {
      if (r.ok < r.branches && r.bad.length) W(`event ${ev.id}: ${r.branches - r.ok} of ${r.branches} trigger branches can never fire (${r.bad[0]})`);
      if (r.onlyFestival && ev.kind !== 'festival') W(`event ${ev.id} can only fire on one festival day (a single chance in Year 1)`);
    }
  }

  // call targets everywhere (not only live containers)
  for (const c of containers) walk(c.steps, [], (s) => { if (s.call && !resolveScript(s.call)) B(`${c.id}: call of missing script "${s.call}"`); });

  // soft-locks: consumed items that cannot be re-obtained
  const consumed = new Map(); // item -> [who]
  const consume = (item, who) => { if (!consumed.has(item)) consumed.set(item, []); consumed.get(item).push(who); };
  for (const q of Object.values(QUESTS)) {
    for (const st of q.stages) if (['give'].includes(st.goal.type)) consume(st.goal.item, `${q.id} give-goal`);
    for (const c of arr(q.consume)) consume(c.id, `${q.id} consume`);
  }
  for (const c of containers) walk(c.steps, [], (s) => { if (s.takeItem) consume(s.takeItem, c.id); });
  for (const [item, who] of consumed) {
    const ss = sources.get(item) || [];
    const renewable = ss.some((s) => s.renewable);
    const losable = hasItem(item) && !ITEMS[item].key && ITEMS[item].category !== 'key';
    if (!renewable && ss.length) {
      const onlyOnce = ss.every((s) => s.kind === 'reward' || s.limit !== undefined);
      if (losable) W(`soft-lock risk: ${item} is consumed by ${who.join(', ')} but only comes from one-time sources (${ss.map((s) => s.kind + ':' + s.detail).join(', ')}) and can be sold or gifted away`);
      else if (onlyOnce) I(`${item} is consumed by ${who.join(', ')}; one-time source (${ss.map((s) => s.detail).join(', ')}); key item, cannot be lost`);
    }
    if (!ss.length && who.some((w) => !/^event:/.test(w))) W(`${item} is consumed by ${who.join(', ')} but has no source`);
  }

  // main-chain feasibility windows: item sources must exist in the right season for dated quests
  const seasonOf = (idx) => SEASONS[Math.floor((idx - 1) / 28)];
  const windowNotes = [];
  for (const q of Object.values(QUESTS)) {
    if (q.kind !== 'main') continue;
    const lo = dateBounds(q.unlock).lo;
    for (const st of q.stages) {
      const g = st.goal;
      if (!g.item || !['have', 'give'].includes(g.type)) continue;
      const ss = (sources.get(g.item) || []).filter((s) => s.kind !== 'reward');
      if (!ss.length) continue;
      const seasons = new Set(ss.flatMap((s) => s.seasons || SEASONS));
      // seasons from unlock to the end of autumn (Winter 24 is the deadline; keep to winter day 23)
      const avail = [];
      for (let d = lo; d <= dayIdx('winter', 23); d += 28) avail.push(seasonOf(d));
      avail.push(seasonOf(dayIdx('winter', 23)));
      const usable = [...new Set(avail)].filter((s) => seasons.has(s));
      if (!usable.length) B(`main quest ${q.id} needs ${g.item} but no source works between ${fmtDay(lo)} and Winter 23`);
      windowNotes.push(`${q.id}: ${g.item} obtainable in ${usable.join('/')}`);
    }
  }

  // price sanity for required shop items
  for (const q of Object.values(QUESTS)) {
    for (const st of q.stages) {
      const it = st.goal.item;
      if (!it) continue;
      const ss = sources.get(it) || [];
      const cheap = ss.filter((s) => s.kind === 'shop' && s.price <= START_MONEY * 2);
      if (ss.length && ss.every((s) => s.kind === 'shop') && !cheap.length) W(`quest ${q.id}: ${it} is only sold for ${Math.min(...ss.map((s) => s.price))}c`);
      const forageOnly = ss.length && ss.every((s) => s.kind === 'forage');
      if (forageOnly && q.kind === 'main') {
        const odds = ss.map((s) => (s.chance || 0) * (s.spots || 1));
        const best = Math.max(...odds);
        if (best < 0.02) W(`quest ${q.id}: ${it} is very rare (best ${(best * 100).toFixed(1)}% per visit)`);
      }
    }
  }

  // never-obtainable items (info)
  const never = Object.keys(ITEMS).filter((id) => !items.has(id) && !(sources.get(id) || []).length);
  for (const id of never) I(`item ${id} is never obtainable (${ITEMS[id].category})`);

  // peddler / stalls
  for (const sh of Object.values(Data.shops || {})) if (!sh.counter) I(`shop ${sh.id} is a stall opened by talking to ${sh.owner} (days ${shopAvail[sh.id].days.join(',')})`);

  // heart pace (info)
  const heartRows = [];
  for (const q of Object.values(QUESTS)) for (const st of q.stages) if (st.goal.type === 'hearts') {
    const need = st.goal.hearts * AFFECTION.perHeart;
    const talkOnly = Math.ceil(need / AFFECTION.talk);
    const perWeek = AFFECTION.giftsPerWeekSoftCap * AFFECTION.gift.love + 7 * AFFECTION.talk;
    heartRows.push({ quest: q.id, npc: st.goal.npc, hearts: st.goal.hearts, talkOnlyDays: talkOnly, withLovedGiftsDays: Math.ceil((need / perWeek) * 7) });
  }
  const pace = { talkPerDay: AFFECTION.talk, lovedGift: AFFECTION.gift.love, likedGift: AFFECTION.gift.like, giftsPerWeekFullValue: AFFECTION.giftsPerWeekSoftCap, eightHeartsTalkOnlyDays: Math.ceil(800 / AFFECTION.talk), eightHeartsWithLovedGiftsDays: Math.ceil((800 / (AFFECTION.giftsPerWeekSoftCap * AFFECTION.gift.love + 7 * AFFECTION.talk)) * 7) };

  return {
    blockers, warnings, info,
    facts: { questReport, sources: Object.fromEntries(sources), flags: [...flags], startable: [...startable], done: [...done], lanterns: lanternMax(), presence, shopAvail, heartRows, pace, windowNotes, never, liveContainers: liveC.size, containers: containers.length, waterAreas: Object.fromEntries(Object.entries(waterAreas).map(([k, v]) => [k, [...v]])), fishOk, flagSetters: Object.fromEntries([...flagSetters].map(([k, v]) => [k, [...v]])) },
  };
}

// ------------------------------------------------------------------ report
export function formatReport(res) {
  const { blockers, warnings, info, facts } = res;
  const out = [];
  out.push('LANTERNBROOK DAYS - content obtainability / reachability analysis');
  out.push('='.repeat(64));
  out.push(`containers ${facts.containers} (live ${facts.liveContainers}), quests ${facts.questReport.length} (startable ${facts.startable.length}, completable ${facts.done.length}), lanterns grantable ${facts.lanterns}/6`);
  out.push('');
  out.push('QUESTS');
  for (const q of facts.questReport) {
    const when = q.earliest > 1 ? ` from ${fmtDay(q.earliest)}` : '';
    out.push(`  [${q.startable ? 'ok' : 'XX'}] ${q.id.padEnd(18)} ${q.kind.padEnd(8)} giver ${String(q.giver).padEnd(9)}${when}`);
    for (const s of q.stages) out.push(`        ${s.ok ? 'ok' : 'XX'} stage ${s.i} ${s.goal.type}${s.goal.item ? ' ' + s.goal.item + (s.goal.qty ? ' x' + s.goal.qty : '') : s.goal.npc ? ' ' + s.goal.npc : s.goal.area ? ' ' + s.goal.area : s.goal.job ? ' ' + s.goal.job : s.goal.flag ? ' ' + s.goal.flag : s.goal.fish ? ' ' + s.goal.fish : ''}${s.src ? '  <- ' + s.src.slice(0, 110) : ''}${s.why ? '  !! ' + s.why : ''}`);
  }
  out.push('');
  out.push('HEART PACE (talk 12/day, loved gift 80, 3 full-value gifts per week)');
  out.push(`  8 hearts: ${facts.pace.eightHeartsTalkOnlyDays} days talk only, ~${facts.pace.eightHeartsWithLovedGiftsDays} days with loved gifts`);
  for (const h of facts.heartRows) out.push(`  ${h.quest}: ${h.hearts} hearts with ${h.npc}: ${h.talkOnlyDays} days talk only, ~${h.withLovedGiftsDays} with loved gifts`);
  out.push('');
  out.push(`BLOCKERS (${blockers.length})`);
  for (const b of blockers) out.push(`  BLOCKER ${b}`);
  out.push(`WARNINGS (${warnings.length})`);
  for (const w of warnings) out.push(`  warn    ${w}`);
  out.push(`INFO (${info.length})`);
  for (const i of info) out.push(`  info    ${i}`);
  out.push('');
  out.push(blockers.length ? `RESULT: ${blockers.length} blocker(s)` : 'RESULT: 0 blockers - every quest can start and finish; all five Lantern Pieces, the Great Lantern and the endings are reachable.');
  return out.join('\n');
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const { Data } = await import('../src/data/index.js');
  const res = analyze(Data);
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(res, (k, v) => (v instanceof Set ? [...v] : v), 1));
  } else console.log(formatReport(res));
  process.exit(res.blockers.length ? 1 : 0);
}
