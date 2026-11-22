/**
 * NPC schedules and movement (svc.npcs).
 *  - whereIs(npc, minutes?) : which slot an NPC is in (festival placement overrides)
 *  - populate()             : on area entry, place everyone directly at their current slot anchors
 *  - sync(minutes)          : every 5 game minutes (and on time jumps): slot changes -> walk (A*), leave toward the exit, arrive
 *  - resyncAll()            : after cutscenes (event:end): every staged NPC returns to its schedule
 * Only NPCs in the CURRENT area are simulated; the others are virtual (lastLoc).
 */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { AREAS, NPC_IDS } from '../core/registry.js';
import { SPEED } from '../core/constants.js';
import { parseHHMM, hashString, mulberry32 } from '../core/util.js';
import { svc } from './svc.js';
import { D, subs, dayNum, warnOnce } from './kit.js';
import { path } from './path.js';

const s = subs();
const IDLE_ANIMS = new Set(['idle', 'walk', 'run', 'carry_walk']);
const lastLoc = {}; // npcId -> loc (last known)
let lastDay = -1;
let lastMin = -1;
let lastSync = -1;
const routeCache = new Map();

const ent = () => svc.entities;

/** BFS over AREAS[].neighbors: [from, ..., to] or null. */
export function routeAreas(from, to) {
  if (from === to) return [from];
  const key = `${from}>${to}`;
  if (routeCache.has(key)) return routeCache.get(key);
  let res = null;
  if (AREAS[from] && AREAS[to]) {
    const prev = { [from]: null };
    const q = [from];
    while (q.length && !res) {
      const c = q.shift();
      for (const n of AREAS[c].neighbors) {
        if (n in prev) continue;
        prev[n] = c;
        if (n === to) {
          res = [n];
          for (let k = c; k !== null; k = prev[k]) res.unshift(k);
          break;
        }
        q.push(n);
      }
    }
  }
  routeCache.set(key, res);
  return res;
}

function slotsFor(npcId, minutes) {
  const rules = D().schedules?.[npcId];
  if (!rules) return null;
  const rule = rules.find((r) => svc.conditions.evalCond(r.when, { npc: npcId, minutes }));
  return rule?.slots || null;
}

function festivalLoc(npcId, m) {
  const f = svc.events?.festivalActive?.(m);
  const pl = svc.events?.festivalPlacement?.();
  if (!f || !pl) return null;
  const by = pl.byNpc?.[npcId];
  let area;
  let at;
  if (by) ({ area, at } = by);
  else {
    const anchors = pl.default?.anchors || [];
    if (!anchors.length) return null;
    area = pl.default.area;
    at = anchors[hashString(npcId) % anchors.length];
  }
  const from = parseHHMM(f.from || '00:00');
  return { area, at, hidden: false, anim: 'idle', wander: by ? 1 : 2, from, festival: true, npc: npcId, key: `fest|${f.id}|${area}|${at}` };
}

const npcs = {
  init() {
    s.clear();
    for (const k of Object.keys(lastLoc)) delete lastLoc[k];
    lastDay = -1;
    lastMin = -1;
    lastSync = -1;
    s.on(EVT.EVENT_END, () => npcs.resyncAll());
  },

  routeAreas,
  lastLoc: () => lastLoc,

  /** {area, at, x?, z?, hidden, anim?, facing?, hold?, wander?, from, key}. */
  whereIs(npcId, minutes) {
    const st = Game.state;
    if (!st) return null;
    const m = minutes ?? st.time.minutes;
    const fl = festivalLoc(npcId, m);
    if (fl) return fl;
    const slots = slotsFor(npcId, m);
    let best = null;
    let bestFrom = -1;
    if (slots) {
      for (const sl of slots) {
        const f = parseHHMM(sl.from);
        if (f <= m && f >= bestFrom) {
          best = sl;
          bestFrom = f;
        }
      }
    }
    if (!best) return { area: D().npcs?.[npcId]?.home || 'cottage', at: null, hidden: true, from: -1, key: 'none' };
    return {
      area: best.area, at: best.at, hidden: !!best.hidden, anim: best.anim, facing: best.facing, hold: best.hold, wander: best.wander || 0,
      from: bestFrom, key: `${best.from}|${best.area}|${best.at}`,
    };
  },

  /** Anchor point of a loc in the current area (offset inside the wander radius when `jitter`). */
  _point(loc, a, jitter) {
    const area = ent().area();
    let p = Number.isFinite(loc.x) ? { x: loc.x, z: loc.z } : ent().pointOf(loc.at, area);
    if (!p) {
      warnOnce(`anchor:${loc.area}.${loc.at}`, `schedule anchor "${loc.area}.${loc.at}" not found`);
      p = { x: area.width / 2, z: area.height / 2 };
    }
    const home = { x: p.x, z: p.z, facing: p.facing };
    if (jitter && loc.wander > 0) {
      // Festival crowds share a few anchors: every guest gets a stable spot of their own (seeded by id, not by day) and steers
      // clear of whoever already stands there, so nobody overlaps.
      const fest = !!(loc.festival && loc.npc);
      const rng = fest ? mulberry32(hashString(`${loc.npc}|${loc.key}`)) : a?.rng || mulberry32(hashString(`${loc.key}|${dayNum()}`));
      const reach = Math.min(loc.wander, 2.2);
      const others = fest ? [...ent().actors().values()].filter((o) => o.id !== loc.npc && !o.hidden && !o.leaving) : [];
      let fallback = null;
      for (let k = 0; k < (fest ? 16 : 6); k++) {
        const r = fest ? reach * (0.35 + 0.65 * Math.sqrt(rng())) : reach * Math.sqrt(rng());
        const th = rng() * Math.PI * 2;
        const x = home.x + Math.cos(th) * r;
        const z = home.z + Math.sin(th) * r;
        if (area.isBlockedAt(x, z, 0.32) || !path.lineClear(area, home.x, home.z, x, z, 0.2)) continue;
        const pt = { x, z, facing: home.facing, home };
        if (!others.some((o) => Math.hypot(o.x - x, o.z - z) < 0.8)) return pt;
        fallback ||= pt;
      }
      if (fallback) return fallback;
    }
    return { x: home.x, z: home.z, facing: home.facing, home };
  },

  /** Play the slot's pose/anim/held prop on an arrived actor. */
  applySlot(a, loc) {
    a.slot = loc;
    a.wander = loc.wander || 0;
    a.leaving = false;
    const rig = a.rig;
    rig.setHeld?.(loc.hold || null);
    if (loc.facing) rig.setFacing?.(loc.facing);
    if (loc.anim && !IDLE_ANIMS.has(loc.anim)) rig.play?.(loc.anim, { loop: true });
    else rig.stop?.();
  },

  _spawnAt(id, loc) {
    const area = ent().area();
    const p = npcs._point(loc, null, true);
    const a = ent().spawnNpc(id, p.x, p.z, loc.facing || p.facing || 's');
    if (!a) return null;
    a.home = p.home;
    a.rng = mulberry32(hashString(id) + dayNum());
    npcs.applySlot(a, loc);
    a.wanderT = 2 + a.rng() * 4;
    if (loc.facing) a.rig.setFacing?.(loc.facing, { snap: true });
    return a;
  },

  /** Area entry: despawn leftovers and place every NPC of this area at its current slot. */
  populate() {
    const area = ent()?.area?.();
    if (!area || !Game.state) return;
    for (const id of NPC_IDS) {
      const a = ent().actor(id);
      if (a && !a.staged) ent().despawnNpc(id);
    }
    const m = Game.state.time.minutes;
    for (const id of NPC_IDS) {
      const loc = npcs.whereIs(id, m);
      lastLoc[id] = loc;
      if (!loc || loc.area !== area.id || loc.hidden) continue;
      if (ent().actor(id)?.staged) continue;
      npcs._spawnAt(id, loc);
    }
    lastDay = dayNum();
    lastMin = m;
    lastSync = Math.floor(m / 5);
  },

  /** Walk an actor to its slot anchor; arrival applies the slot pose. */
  _walkToSlot(a, loc, late) {
    const p = npcs._point(loc, a, true);
    a.home = p.home;
    a.slot = loc;
    a.leaving = false;
    a.rig.stop?.();
    a.rig.setHeld?.(loc.hold || null);
    const token = (a.token = (a.token || 0) + 1);
    ent()
      .walk(a, p.x, p.z, { speed: late ? SPEED.run : SPEED.walk })
      .then((ok) => {
        if (a.token !== token || !ent().actor(a.id)) return;
        if (ok !== false || !a.route) npcs.applySlot(a, loc);
      });
  },

  /** Walk to a point then despawn (leaving the area). */
  _walkOut(a, p) {
    a.leaving = true;
    a.slot = null;
    a.rig.stop?.();
    const token = (a.token = (a.token || 0) + 1);
    ent()
      .walk(a, p.x, p.z, {})
      .then((ok) => {
        if (a.token !== token) return;
        ent().despawnNpc(a.id);
        return ok;
      });
  },

  _leave(a, destArea) {
    const area = ent().area();
    const r = routeAreas(area.id, destArea);
    const hop = r && r.length > 1 ? r[1] : null;
    const t = hop ? area.transitions.find((x) => x.to.area === hop) : null;
    if (!t) {
      ent().despawnNpc(a.id);
      return;
    }
    npcs._walkOut(a, t.stand);
  },

  _arrive(id, prev, loc, late) {
    const area = ent().area();
    let entry = null;
    if (prev && prev.area !== area.id) {
      const r = routeAreas(prev.area, area.id);
      const hop = r && r.length > 1 ? r[r.length - 2] : AREAS[area.id].neighbors[0];
      entry = ent().pointOf(`from_${hop}`, area);
    } else if (prev && prev.at) entry = ent().pointOf(prev.at, area);
    if (!entry) {
      npcs._spawnAt(id, loc);
      return;
    }
    const a = ent().spawnNpc(id, entry.x, entry.z, entry.facing || 's');
    if (!a) return;
    npcs._walkToSlot(a, loc, late);
  },

  _changed(id, prev, loc, m) {
    const area = ent().area();
    const a = ent().actor(id);
    if (a?.staged) return;
    const here = area.id;
    const target = loc.area === here && !loc.hidden;
    const late = m - loc.from > 20;
    if (a) {
      if (a.busy) return;
      if (target) npcs._walkToSlot(a, loc, late);
      else if (loc.area === here && loc.hidden && loc.at && ent().pointOf(loc.at, area)) npcs._walkOut(a, ent().pointOf(loc.at, area));
      else npcs._leave(a, loc.area);
    } else if (target) npcs._arrive(id, prev, loc, late);
  },

  /** Compare every NPC's slot with the last known one and react to changes. */
  sync(m) {
    if (!ent()?.area?.() || !Game.state) return;
    for (const id of NPC_IDS) {
      const loc = npcs.whereIs(id, m);
      const prev = lastLoc[id];
      if (prev && loc && prev.key === loc.key) continue;
      lastLoc[id] = loc;
      if (loc) npcs._changed(id, prev, loc, m);
    }
  },

  /** After a cutscene: unstage everyone and move them back to their scheduled slots. */
  resyncAll() {
    const area = ent()?.area?.();
    if (!area || !Game.state) return;
    const m = Game.state.time.minutes;
    for (const id of NPC_IDS) {
      const loc = npcs.whereIs(id, m);
      lastLoc[id] = loc;
      const a = ent().actor(id);
      const wasStaged = !!a?.staged;
      if (a) {
        a.staged = false;
        a.busy = false;
        a.rig.setVisible?.(true);
      }
      const target = loc.area === area.id && !loc.hidden;
      if (a) {
        if (!wasStaged && a.slot && a.slot.key === loc.key && !a.leaving) continue;
        if (target) {
          const p = npcs._point(loc, a, true);
          if (Math.hypot(a.x - p.x, a.z - p.z) > 0.4) npcs._walkToSlot(a, loc, false);
          else npcs.applySlot(a, loc);
        } else if (loc.area === area.id && loc.hidden && loc.at && ent().pointOf(loc.at, area)) npcs._walkOut(a, ent().pointOf(loc.at, area));
        else npcs._leave(a, loc.area);
      } else if (target) npcs._spawnAt(id, loc);
    }
  },

  update(dt) {
    const st = Game.state;
    const area = ent()?.area?.();
    if (!st || !area) return;
    const m = st.time.minutes;
    const dn = dayNum();
    if (lastDay < 0 || dn !== lastDay || m < lastMin) {
      npcs.populate();
    } else {
      lastMin = m;
      const b = Math.floor(m / 5);
      if (b !== lastSync) {
        lastSync = b;
        npcs.sync(m);
      }
    }
    if (Game.mode !== 'field') return;
    for (const a of ent().actors().values()) {
      if (a.isPlayer || a.staged || a.busy || a.route || a.leaving || !(a.wander > 0) || !a.home) continue;
      a.wanderT -= dt;
      if (a.wanderT > 0) continue;
      a.wanderT = 3 + a.rng() * 5;
      const r = a.wander * Math.sqrt(a.rng());
      const th = a.rng() * Math.PI * 2;
      const x = a.home.x + Math.cos(th) * r;
      const z = a.home.z + Math.sin(th) * r;
      if (area.isBlockedAt(x, z, 0.32) || !path.lineClear(area, a.x, a.z, x, z, 0.2)) continue;
      const slot = a.slot;
      a.rig.stop?.();
      const token = (a.token = (a.token || 0) + 1);
      ent()
        .walk(a, x, z, { speed: SPEED.walk * 0.75 })
        .then(() => {
          if (a.token === token && slot && ent().actor(a.id) && !a.route) npcs.applySlot(a, slot);
        });
    }
  },
};

export { npcs };
