/**
 * Entity manager (svc.entities): owns the loaded area, the player/NPC rigs ("actors"), critters, the scripted camera,
 * route following (A*), area entry (`enterArea`), and music/ambience/lamps/decor on entry.
 *
 * Actor = { id, rig, x, z, area, facing, route, ri, speed, resolve, staged, busy, slot, ... }; the player is actor 'player'.
 * Everything degrades gracefully without Game.world / Game.chars (Node tests): enterArea then only updates state + events.
 */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { AREAS } from '../core/registry.js';
import { SPEED } from '../core/constants.js';
import { seasonName, mulberry32, hashString } from '../core/util.js';
import { svc } from './svc.js';
import { opts, subs, warnOnce, dayNum } from './kit.js';
import { path } from './path.js';
import { audioDirector } from './audio-director.js';
import { registerStaging } from './staging.js';

const s = subs();

const E = {
  area: null,
  areaId: null,
  actors: new Map(),
  rigs: new Map(), // npcId -> cached rig (reused across areas)
  critters: [],
  playerLook: '',
  queue: Promise.resolve(),
  entering: false,
  sinceEnter: 99,
  cam: { focus: null, x: 0, z: 0, zoom: 1 }, // focus: null = follow the player | actor id | 'point'
  ctx: { isBlockedAt: (x, z, r) => (E.area ? E.area.isBlockedAt(x, z, r) : false), player: { x: 0, z: 0 } },
  cooldown: 0,
};

const seasonOf = () => (Game.state ? seasonName(Game.state.time.season) : 'spring');
const warnRig = (id, e) => warnOnce(`rig:${id}`, `could not create rig "${id}": ${e && e.message}`);

// ------------------------------------------------------------------ actors
function makeActor(id, rig, x, z, facing = 's') {
  return {
    id, rig, x, z, area: E.areaId, facing, isPlayer: id === 'player', route: null, ri: 0, speed: SPEED.walk, resolve: null, routeT: 0, routeMax: 0,
    staged: false, busy: false, hidden: false, slot: null, home: null, wanderT: 2, rng: mulberry32(hashString(id) + dayNum()), onArrive: null, leaving: false,
  };
}

function setPos(a, x, z) {
  a.x = x;
  a.z = z;
  a.rig?.group?.position?.set?.(x, 0, z);
}

function createRig(id) {
  if (!Game.chars?.createCharacter) return null;
  try {
    const look = id === 'player' ? Game.state?.meta?.look : undefined;
    return Game.chars.createCharacter(id, { season: seasonOf(), look });
  } catch (e) {
    warnRig(id, e);
    return null;
  }
}

function addToWorld(rig, shadow) {
  if (rig?.group) Game.world?.addEntity?.(rig.group, { shadow });
}
function removeFromWorld(rig) {
  if (rig?.group) Game.world?.removeEntity?.(rig.group);
}

function cancelRoute(a, ok = false) {
  if (a.route) {
    a.route = null;
    a.rig?.locomote?.(0);
  }
  if (a.resolve) {
    const r = a.resolve;
    a.resolve = null;
    r(ok);
  }
}

function stepRoute(a, dt) {
  const r = a.route;
  a.routeT += dt;
  let remaining = a.speed * dt;
  let dx = 0;
  let dz = 0;
  while (remaining > 0 && a.ri < r.length) {
    const w = r[a.ri];
    dx = w.x - a.x;
    dz = w.z - a.z;
    const d = Math.hypot(dx, dz);
    if (d <= remaining) {
      a.x = w.x;
      a.z = w.z;
      remaining -= d;
      a.ri++;
    } else {
      a.x += (dx / d) * remaining;
      a.z += (dz / d) * remaining;
      remaining = 0;
    }
  }
  a.rig?.group?.position?.set?.(a.x, 0, a.z);
  if (a.ri >= r.length) {
    cancelRoute(a, true);
    return;
  }
  if (dx || dz) a.rig?.setFacing?.(Math.atan2(dx, dz));
  a.rig?.locomote?.(a.speed);
  if (a.routeT > a.routeMax) {
    // never stuck: timeout -> teleport to the end of the route
    const last = r[r.length - 1];
    setPos(a, last.x, last.z);
    cancelRoute(a, true);
  }
}

// ------------------------------------------------------------------ point helpers
/** Resolve an anchor name / {x,z} / 'player' / actor id into {x,z,facing?} in the current area. */
function pointOf(spec, area = E.area) {
  if (spec === undefined || spec === null) return null;
  if (typeof spec === 'object' && Number.isFinite(spec.x) && Number.isFinite(spec.z)) return { x: spec.x, z: spec.z, facing: spec.facing };
  if (typeof spec !== 'string') return null;
  const an = area?.anchor?.(spec);
  if (an) return { x: an.x, z: an.z, facing: an.facing };
  const a = E.actors.get(spec === 'player' ? 'player' : spec);
  if (a) return { x: a.x, z: a.z };
  return null;
}

const FOOT = 0.3;
const walkableNear = (x, z) => {
  const area = E.area;
  if (!area || !area.isBlockedAt || !area.isBlockedAt(x, z, FOOT * 0.8)) return { x, z };
  const n = path.nearestWalkable(area, x, z, 4);
  return n ? { x: n.i + 0.5, z: n.j + 0.5 } : { x, z };
};

// ------------------------------------------------------------------ critters
const SKIP_IN = { butterfly: (w, season) => w === 'rain' || w === 'storm' || w === 'snow' || season === 'winter' };

function spawnCritters(area) {
  const hints = area.critters || [];
  if (!hints.length || !Game.chars?.createCritter) return;
  const weather = Game.state?.weather?.today || 'sunny';
  const season = seasonOf();
  const night = Game.state ? Game.state.time.minutes >= 1110 || Game.state.time.minutes < 360 : false;
  let seed = dayNum() * 13 + 1;
  for (const h of hints) {
    if (SKIP_IN[h.kind]?.(weather, season)) continue;
    if (night && (h.kind === 'sparrow' || h.kind === 'butterfly' || h.kind === 'gull')) continue;
    for (let i = 0; i < (h.count || 1); i++) {
      try {
        const c = Game.chars.createCritter(h.kind, { seed: seed++ });
        const b = h.bounds || { x: 1, z: 1, w: 6, h: 6 };
        c.setBounds?.(b);
        const rng = mulberry32(hashString(`${area.id}|${h.kind}|${i}|${seed}`));
        let x = b.x + rng() * b.w;
        let z = b.z + rng() * b.h;
        for (let t = 0; t < 8 && area.isBlockedAt?.(x, z, 0.2); t++) {
          x = b.x + rng() * b.w;
          z = b.z + rng() * b.h;
        }
        c.group.position.set(x, 0, z);
        Game.world?.addEntity?.(c.group, { shadow: 0.18 });
        E.critters.push(c);
      } catch (e) {
        warnOnce(`critter:${h.kind}`, `critter ${h.kind} failed: ${e && e.message}`);
      }
    }
  }
}

function clearCritters() {
  for (const c of E.critters) {
    if (c.group) Game.world?.removeEntity?.(c.group);
    c.dispose?.();
  }
  E.critters.length = 0;
}

function clearNpcActors() {
  for (const [id, a] of [...E.actors]) {
    if (a.isPlayer) continue;
    cancelRoute(a, false);
    removeFromWorld(a.rig);
    E.actors.delete(id);
  }
}

// ------------------------------------------------------------------ public service
export const entities = {
  init() {
    s.clear();
    if (Game.world?.loadArea) registerStaging(svc.script.registerOp);
    E.area = null;
    E.areaId = null;
    E.queue = Promise.resolve();
    E.cam.focus = null;
    for (const a of E.actors.values()) removeFromWorld(a.rig);
    E.actors.clear();
    for (const r of E.rigs.values()) r.dispose?.();
    E.rigs.clear();
    E.playerLook = '';
    clearCritters();
    if (Game.chars?.preload && !E.preloaded) {
      E.preloaded = true;
      try {
        Promise.resolve(Game.chars.preload()).catch((e) => console.warn('[systems] chars.preload failed', e));
      } catch (e) {
        console.warn('[systems] chars.preload failed', e);
      }
    }
    const refreshAudio = () => {
      if (E.areaId && !E.entering) audioDirector.apply(E.areaId);
    };
    s.on(EVT.TIME_HOUR, refreshAudio);
    s.on(EVT.WEATHER_CHANGE, refreshAudio);
    s.on(EVT.EVENT_END, () => {
      if (opts.faded) {
        // a cutscene ended with the screen still faded out: never leave the player in the dark
        opts.faded = false;
        Game.ui?.fade?.(0, opts.skipFades ? 0 : 400);
      }
      refreshAudio();
      entities.applyDecor();
    });
    s.on(EVT.TIME_SEASON, () => {
      const season = seasonOf();
      for (const a of E.actors.values()) a.rig?.setSeason?.(season);
      for (const r of E.rigs.values()) r.setSeason?.(season);
    });
    s.on(EVT.GAME_NEW, () => { opts.faded = false; entities.teardown(); });
    s.on(EVT.GAME_LOADED, () => { opts.faded = false; entities.teardown(); });
  },

  // ---- accessors
  area: () => E.area,
  areaId: () => E.areaId,
  actors: () => E.actors,
  actor: (id) => E.actors.get(id) || null,
  playerActor: () => E.actors.get('player') || null,
  getPlayerRig: () => E.actors.get('player')?.rig || null,
  getNpcRig: (id) => E.actors.get(id)?.rig || null,
  critters: () => E.critters,
  get entering() {
    return E.entering;
  },
  get sinceEnter() {
    return E.sinceEnter;
  },
  pointOf,
  getPlayerPos() {
    const a = E.actors.get('player');
    const p = Game.state?.player;
    if (!a) return p ? { area: E.areaId || p.area, x: p.x, z: p.z, facing: p.facing } : null;
    return { area: E.areaId || p?.area, x: a.x, z: a.z, facing: a.rig?.getFacing?.() || a.facing };
  },

  // ---- actors
  /** Spawn (or reposition) an NPC actor in the current area. Returns the actor or null (no world/chars). */
  spawnNpc(id, x, z, facing) {
    if (!E.area) return null;
    let a = E.actors.get(id);
    if (a) {
      cancelRoute(a, false);
      setPos(a, x, z);
      a.hidden = false;
      a.rig?.setVisible?.(true);
      if (facing) a.rig?.setFacing?.(facing, { snap: true });
      return a;
    }
    let rig = E.rigs.get(id);
    if (!rig) {
      rig = createRig(id);
      if (!rig) return null;
      E.rigs.set(id, rig);
    }
    rig.setSeason?.(seasonOf());
    rig.setVisible?.(true);
    rig.setHeld?.(null);
    rig.stop?.();
    a = makeActor(id, rig, x, z, facing || 's');
    a.rng = mulberry32(hashString(id) + dayNum());
    rig.group.position.set(x, 0, z);
    rig.setFacing?.(facing || 's', { snap: true });
    addToWorld(rig, 0.34);
    E.actors.set(id, a);
    return a;
  },
  despawnNpc(id) {
    const a = E.actors.get(id);
    if (!a || a.isPlayer) return;
    cancelRoute(a, false);
    removeFromWorld(a.rig);
    E.actors.delete(id);
  },
  /** Actor for a staging op: spawn on demand near the player (the op then positions it). */
  ensureActor(id) {
    if (id === 'player') return E.actors.get('player') || null;
    let a = E.actors.get(id);
    if (a) return a;
    if (!E.area) return null;
    const p = E.actors.get('player');
    const base = p ? { x: p.x + 1.5, z: p.z } : { x: E.area.width / 2, z: E.area.height / 2 };
    const pt = walkableNear(base.x, base.z);
    a = entities.spawnNpc(id, pt.x, pt.z, 's');
    return a;
  },
  ensureRig(id) {
    return entities.ensureActor(id)?.rig || null;
  },
  /** Route an actor to (x,z) with A*. Resolves true on arrival, false if cancelled or unreachable (then it teleports). */
  walk(a, x, z, o = {}) {
    if (!a) return Promise.resolve(false);
    const area = E.area;
    if (!area) return Promise.resolve(false);
    cancelRoute(a, false);
    const speed = o.speed ?? (o.run ? SPEED.run : SPEED.walk);
    const route = path.find(area, a.x, a.z, x, z);
    if (route === null) {
      entities.teleport(a, x, z);
      return Promise.resolve(false);
    }
    if (!route.length) return Promise.resolve(true);
    a.route = route;
    a.ri = 0;
    a.speed = speed;
    a.routeT = 0;
    a.routeMax = (path.length(route, a.x, a.z) / speed) * 2 + 6;
    return new Promise((res) => {
      a.resolve = res;
    });
  },
  teleport(a, x, z, facing) {
    if (!a) return;
    cancelRoute(a, false);
    const p = walkableNear(x, z);
    setPos(a, p.x, p.z);
    if (facing) a.rig?.setFacing?.(facing, { snap: true });
  },
  cancelRoute,
  setPos,

  // ---- camera (script op `camera`)
  /** focus: null | 'player' = follow the player; actor id; {x,z} / anchor name = fixed point. */
  setCameraFocus(focus, zoom) {
    const c = E.cam;
    if (zoom !== undefined) c.zoom = zoom;
    if (focus === null || focus === undefined || focus === 'player') {
      c.focus = null;
      return true;
    }
    if (typeof focus === 'string' && E.actors.has(focus)) {
      c.focus = focus;
      return true;
    }
    const p = pointOf(focus);
    if (!p) return false;
    c.focus = 'point';
    c.x = p.x;
    c.z = p.z;
    return true;
  },
  resetCamera() {
    E.cam.focus = null;
    E.cam.zoom = 1;
    Game.world?.setCamera?.({ ...(entities.camTarget() || {}), zoom: 1 });
  },
  camTarget() {
    const c = E.cam;
    if (c.focus === 'point') return { x: c.x, z: c.z };
    const a = E.actors.get(c.focus || 'player') || E.actors.get('player');
    return a ? { x: a.x, z: a.z } : null;
  },

  // ---- decor / audio
  /** Festival decor for the current area (setDecor(null) elsewhere). */
  applyDecor() {
    if (!Game.world?.setDecor) return;
    const f = svc.events?.festivalToday?.();
    Game.world.setDecor(f && f.area === E.areaId ? f.decor : null);
  },

  // ---- area entry
  /** enterArea(areaId, spawnAnchor, {fade=true, x?, z?, facing?}) -> Promise. Calls are serialised. */
  enterArea(areaId, anchor, o = {}) {
    const p = E.queue.then(() => doEnter(areaId, anchor, o));
    E.queue = p.catch(() => {});
    return p;
  },

  /** Remove rigs/critters (new game, load). Keeps the cached rigs for reuse except the player's. */
  teardown() {
    for (const [id, a] of [...E.actors]) {
      cancelRoute(a, false);
      removeFromWorld(a.rig);
      if (a.isPlayer) a.rig?.dispose?.();
      E.actors.delete(id);
    }
    clearCritters();
    E.playerLook = '';
    E.areaId = null;
  },

  update(dt) {
    if (!Game.state) {
      if (E.actors.size) entities.teardown();
      return;
    }
    E.sinceEnter += dt;
    if (!E.area) return;
    const field = Game.mode === 'field';
    for (const a of E.actors.values()) {
      if (a.route) {
        if (!a.isPlayer && !a.staged && (!field || a.busy)) a.rig?.locomote?.(0);
        else stepRoute(a, dt);
      }
      a.rig?.update?.(dt);
    }
    const pa = E.actors.get('player');
    if (pa) {
      E.ctx.player.x = pa.x;
      E.ctx.player.z = pa.z;
      const p = Game.state.player;
      p.x = pa.x;
      p.z = pa.z;
      p.area = E.areaId || p.area;
      p.facing = pa.rig?.getFacing?.() || pa.facing;
    }
    for (const c of E.critters) c.update?.(dt, E.ctx);
    if (Game.world?.setCamera) {
      const t = entities.camTarget();
      if (t) Game.world.setCamera(t);
    }
  },
};

// ------------------------------------------------------------------ enterArea implementation
function ensurePlayer() {
  const st = Game.state;
  const look = JSON.stringify(st?.meta?.look || {});
  let a = E.actors.get('player');
  if (a && E.playerLook !== look) {
    removeFromWorld(a.rig);
    a.rig?.dispose?.();
    E.actors.delete('player');
    a = null;
  }
  if (a) return a;
  const rig = createRig('player');
  if (!rig) return null;
  E.playerLook = look;
  a = makeActor('player', rig, 0, 0, 's');
  addToWorld(rig, 0.34);
  E.actors.set('player', a);
  return a;
}

async function doEnter(areaId, anchor, o) {
  const st = Game.state;
  if (!AREAS[areaId]) {
    warnOnce(`area:${areaId}`, `enterArea: unknown area "${areaId}"`);
    return;
  }
  const world = Game.world;
  const prevId = E.areaId;
  if (!world?.loadArea) {
    // headless fallback (Node tests): state + events only
    const from = st?.player?.area ?? null;
    if (st) {
      st.player.area = areaId;
      if (o.x !== undefined) {
        st.player.x = o.x;
        st.player.z = o.z;
      }
      if (o.facing) st.player.facing = o.facing;
    }
    E.areaId = areaId;
    if (prevId) Game.bus.emit(EVT.AREA_EXIT, { area: prevId });
    Game.bus.emit(EVT.AREA_ENTER, { area: areaId, from: prevId || from });
    return;
  }

  const prevMode = Game.mode;
  const lockMode = prevMode === 'field';
  if (lockMode) Game.setMode('transition');
  E.entering = true;
  const ui = Game.ui;
  const doFade = o.fade !== false && !!ui?.fade && !opts.faded;
  const ms = opts.skipFades ? 0 : 260;
  try {
    if (prevId) Game.bus.emit(EVT.AREA_EXIT, { area: prevId });
    if (doFade) await ui.fade(1, ms);
    for (const a of E.actors.values()) cancelRoute(a, false);
    clearNpcActors();
    clearCritters();
    let area;
    try {
      area = await world.loadArea(areaId, { spawn: anchor || undefined });
    } catch (e) {
      console.error(`[systems] loadArea(${areaId}) failed`, e);
      return;
    }
    E.area = area;
    E.areaId = areaId;
    E.sinceEnter = 0;
    path.clear();

    // position
    let pt = null;
    if (Number.isFinite(o.x) && Number.isFinite(o.z)) pt = { x: o.x, z: o.z, facing: o.facing };
    if (!pt && anchor) pt = pointOf(anchor, area);
    if (!pt && prevId) pt = pointOf(`from_${prevId}`, area);
    if (!pt) {
      // no usable anchor: any arrival anchor (never a transition rect, or the player would bounce straight back), else the centre
      const names = Object.keys(area.anchors || {});
      const n = names.find((k) => k.startsWith('from_')) || names[0];
      pt = (n && pointOf(n, area)) || { x: area.width / 2, z: area.height / 2 };
      if (anchor) warnOnce(`anchor:${areaId}.${anchor}`, `enterArea: unknown anchor "${areaId}.${anchor}"`);
    }
    const facing = o.facing || pt.facing || 's';
    if (st) {
      st.player.area = areaId;
      st.player.facing = facing;
    }
    const pa = ensurePlayer();
    if (pa) {
      pa.area = areaId;
      pa.staged = false;
      pa.rig?.setSeason?.(seasonOf());
      pa.rig?.setVisible?.(true);
      const w = walkableNear(pt.x, pt.z);
      setPos(pa, w.x, w.z);
      pa.rig?.setFacing?.(facing, { snap: true });
      pa.rig?.locomote?.(0);
    } else if (st) {
      st.player.x = pt.x;
      st.player.z = pt.z;
    }
    E.cam.focus = null;
    E.cam.zoom = 1;
    world.snapCamera?.({ x: pa ? pa.x : pt.x, z: pa ? pa.z : pt.z });
    world.setCamera?.({ x: pa ? pa.x : pt.x, z: pa ? pa.z : pt.z, zoom: 1 });

    svc.npcs?.populate?.();
    spawnCritters(area);
    svc.lamps?.apply?.();
    entities.applyDecor();
    audioDirector.apply(areaId);
    if (doFade) {
      await ui.fade(0, opts.skipFades ? 0 : 380);
    }
  } finally {
    E.entering = false;
    if (lockMode && Game.mode === 'transition') Game.setMode('field');
  }
  if (E.areaId === areaId) Game.bus.emit(EVT.AREA_ENTER, { area: areaId, from: prevId || null });
}

export { E as _state };
