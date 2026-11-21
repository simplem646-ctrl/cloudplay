// NPC manager: keeps the actors of the CURRENT map in line with sim.schedule.
//   * onMinute(): every in-game minute, resolve each scheduled NPC; spawn / despawn / walk (A*) as needed. NPCs whose next
//     waypoint is on this map start walking early enough to ARRIVE on time; across maps they appear at / leave through doors.
//   * syncMap(): after a map load, everyone scheduled here is placed on their anchor (no walking).
//   * An actor landing on an occupied tile is offset to a free nearby tile; `seat_*` anchors use the sit pose.
//   * The Stage takes over actors with ensure()/place() (`scripted`): the schedule leaves them alone until releaseScripted().
import { PathWalker, findPath, WALK_SPEED } from '../engine/index.js';
import { SECONDS_PER_GAME_MINUTE } from '../core/constants.js';
import { resolveAnchorRef, findFreeTile, nearestDoor } from './anchors.js';
import { wantedTarget, walkMinutes, outfitSlotFor } from './npc_plan.js';
import { makeActor, reskin, isAnimal } from './actors.js';

export class NpcManager {
  constructor(ow) {
    this.ow = ow;
    this.entries = new Map(); // npcId -> entry
    this.blockers = []; // live list handed to PathWalker / moveActor
    this.pathCache = new Map();
  }

  get game() { return this.ow.game; }
  get sim() { return this.ow.game.sim; }
  get map() { return this.ow.map; }

  // ---- bookkeeping -----------------------------------------------------------------------------
  rebuildBlockers() {
    this.blockers.length = 0;
    if (this.ow.player) this.blockers.push(this.ow.player);
    for (const e of this.entries.values()) this.blockers.push(e.actor);
  }
  occupied(exceptId = null) {
    const s = new Set();
    for (const e of this.entries.values()) {
      if (e.id === exceptId) continue;
      s.add(`${e.tile.x},${e.tile.y}`);
      s.add(`${e.actor.tx},${e.actor.ty}`);
    }
    return s;
  }
  list() { return [...this.entries.values()]; }
  actorOf(id) { const e = this.entries.get(id); return e ? e.actor : null; }
  entryOf(id) { return this.entries.get(id) || null; }

  reset() {
    for (const e of [...this.entries.values()]) this.despawn(e.id);
    this.entries.clear();
    this.pathCache.clear();
    this.rebuildBlockers();
  }

  despawn(id) {
    const e = this.entries.get(id);
    if (!e) return;
    if (e.walker) e.walker.cancel();
    this.game.world.removeActor(e.actor);
    this.entries.delete(id);
    this.rebuildBlockers();
  }

  // ---- spawning --------------------------------------------------------------------------------
  slotFor(id, activity) {
    return outfitSlotFor({ id, activity, mapId: this.ow.mapId, minute: this.sim.state.time.minute, info: this.ow.dayInfo });
  }

  spawn(id, tile, dir, { activity = null, scripted = false } = {}) {
    const season = this.sim.state.time.season;
    const actor = makeActor(id, { slot: this.slotFor(id, activity), season, tx: tile.x, ty: tile.y, dir: dir || 'down' });
    this.game.world.addActor(actor);
    const e = { id, actor, ref: null, tile: { x: tile.x, y: tile.y }, dir: dir || 'down', activity, walker: null, leaving: false, scripted, talking: false, stuck: 0, seat: false };
    this.entries.set(id, e);
    this.rebuildBlockers();
    return e;
  }

  /** Free tile near an anchor ref for `id` (never the tile of another NPC). Returns { x, y, dir, onAnchor, anchor }. */
  slot(id, ref) {
    const a = resolveAnchorRef(ref, this.ow.mapId, (m) => this.ow.getMapDef(m));
    const t = findFreeTile(this.map, a.x, a.y, this.occupied(id), { radius: 6 }) || { x: a.x, y: a.y };
    return { x: t.x, y: t.y, dir: a.dir, onAnchor: t.x === a.x && t.y === a.y, anchor: a };
  }

  applyIdle(e) {
    const a = e.actor;
    if (e.dir) a.setDir(e.dir);
    if (isAnimal(e.id)) a.setPose('sit');
    else if (e.activity === 'sleep') a.setPose('sleep');
    else a.setPose(e.seat ? 'sit' : null);
  }

  // ---- map sync --------------------------------------------------------------------------------
  /** Place everyone scheduled on the current map at their anchors (map load / time jump). */
  syncMap() {
    this.reset();
    this.onMinute(this.sim.state.time.minute, { initial: true });
  }

  // ---- per-minute planning -----------------------------------------------------------------------
  pathTiles(fromTile, toTile) {
    const key = `${fromTile.x},${fromTile.y}>${toTile.x},${toTile.y}`;
    if (this.pathCache.has(key)) return this.pathCache.get(key);
    const m = this.map;
    const p = findPath(m.collision, m.width, m.height, fromTile.x, fromTile.y, toTile.x, toTile.y, { maxNodes: 4000 });
    const n = p ? p.length : 40;
    this.pathCache.set(key, n);
    return n;
  }

  onMinute(minute, { initial = false } = {}) {
    if (!this.map) return;
    const snap = this.sim.schedule.snapshot(minute);
    for (const id of Object.keys(snap)) this.step(id, snap[id], minute, initial);
    for (const id of [...this.entries.keys()]) if (!snap[id]) this.step(id, null, minute, initial);
  }

  step(id, r, minute, initial) {
    let e = this.entries.get(id);
    if (e && (e.scripted || e.talking)) return;
    const mapId = this.ow.mapId;
    const here = e ? { x: e.actor.tx, y: e.actor.ty } : null;
    const lead = initial ? null : (from, toRef) => {
      const f = from || (toRef ? this.doorFor(toRef) : null);
      if (!f) return 0;
      if (!toRef) { const d = nearestDoor(this.map, f.x, f.y); return d ? walkMinutes(this.pathTiles(f, d), SECONDS_PER_GAME_MINUTE, WALK_SPEED) : 0; }
      const s = this.slot(id, toRef);
      return walkMinutes(this.pathTiles(f, s), SECONDS_PER_GAME_MINUTE, WALK_SPEED);
    };
    const want = wantedTarget(r, mapId, minute, lead, here);

    if (want.kind === 'away') {
      if (e && !e.leaving) this.startLeave(e);
      return;
    }
    const activity = want.activity || null;
    if (!e) {
      const s = this.slot(id, want.ref);
      if (initial) {
        e = this.spawn(id, s, s.dir, { activity });
        e.ref = want.ref; e.dir = want.dir || s.dir; e.activity = activity; e.seat = /^seat_/.test(want.anchor) && s.onAnchor;
        e.tile = { x: s.x, y: s.y };
        this.applyIdle(e);
      } else {
        const door = this.doorFor(want.ref) || { x: s.x, y: s.y };
        const start = findFreeTile(this.map, door.x, door.y, this.occupied(id), { radius: 3, allowWarp: true }) || door;
        e = this.spawn(id, start, 'down', { activity });
        e.ref = want.ref; e.dir = want.dir || s.dir; e.activity = activity; e.seat = /^seat_/.test(want.anchor) && s.onAnchor;
        e.tile = { x: s.x, y: s.y };
        this.startWalk(e, s);
      }
      return;
    }
    e.leaving = false;
    if (e.ref !== want.ref) {
      const s = this.slot(id, want.ref);
      e.ref = want.ref; e.dir = want.dir || s.dir; e.activity = activity;
      e.seat = /^seat_/.test(want.anchor) && s.onAnchor;
      e.tile = { x: s.x, y: s.y };
      if (initial) { e.actor.setTile(s.x, s.y); this.applyIdle(e); } else this.startWalk(e, s);
    }
    reskin(e.actor, id, this.slotFor(id, e.activity), this.sim.state.time.season);
  }

  doorFor(ref) {
    try {
      const a = resolveAnchorRef(ref, this.ow.mapId, (m) => this.ow.getMapDef(m));
      return nearestDoor(this.map, a.x, a.y);
    } catch { return null; }
  }

  startWalk(e, goal) {
    const a = e.actor;
    a.setPose(null);
    const m = this.map;
    if (a.tx === goal.x && a.ty === goal.y) { this.applyIdle(e); return; }
    const path = findPath(m.collision, m.width, m.height, a.tx, a.ty, goal.x, goal.y, { maxNodes: 6000 });
    if (!path) {
      a.setTile(goal.x, goal.y);
      this.applyIdle(e);
      return;
    }
    e.walker = new PathWalker(a, path, { blockers: this.blockers });
  }

  startLeave(e) {
    const a = e.actor;
    const door = nearestDoor(this.map, a.tx, a.ty);
    if (!door || (a.tx === door.x && a.ty === door.y)) { this.despawn(e.id); return; }
    e.leaving = true;
    e.ref = null;
    e.tile = { x: door.x, y: door.y };
    a.setPose(null);
    this.startWalk(e, door);
    if (!e.walker) this.despawn(e.id);
  }

  // ---- per-frame ---------------------------------------------------------------------------------
  update(dt) {
    const map = this.map;
    if (!map) return;
    const player = this.ow.player;
    for (const e of [...this.entries.values()]) {
      if (e.scripted) continue;
      const a = e.actor;
      if (e.talking) { a.setMoving(false); continue; }
      if (e.walker) {
        if (e.walker.update(dt, map)) {
          const stuck = e.walker.stuck;
          e.walker = null;
          if (e.leaving) { this.despawn(e.id); continue; }
          if (stuck) {
            e.stuck++;
            if (e.stuck >= 2) { a.setTile(e.tile.x, e.tile.y); e.stuck = 0; this.applyIdle(e); } else e.ref = null; // retry next minute
          } else { e.stuck = 0; this.applyIdle(e); }
        }
      } else if (player && isAnimal(e.id) && !e.activity) {
        const far = Math.hypot(a.x - player.x, a.y - player.y) > 80;
        a.setPose(far ? 'loaf' : 'sit');
      }
    }
  }

  // ---- talking -------------------------------------------------------------------------------------
  /** Freeze an NPC and turn it toward the player (talk start) / let it carry on and face its anchor again (talk end). */
  setTalking(id, on) {
    const e = this.entries.get(id);
    if (!e) return;
    e.talking = on;
    if (on) {
      if (e.walker) { e.walker.cancel(); e.walker = null; e.ref = null; }
      e.actor.faceToward(this.ow.player);
      if (isAnimal(id)) e.actor.setPose('sit');
    } else if (!e.walker && !e.scripted) {
      this.applyIdle(e);
    }
  }

  // ---- Stage support -------------------------------------------------------------------------------
  /** Actor for a script: the existing one or a new one on a free tile near the entrance. Marks it scripted. */
  ensure(id) {
    let e = this.entries.get(id);
    if (!e) {
      const s = this.slot(id, 'entrance');
      e = this.spawn(id, s, s.dir, { scripted: true });
    }
    e.scripted = true;
    if (e.walker) { e.walker.cancel(); e.walker = null; }
    e.leaving = false;
    return e.actor;
  }
  place(id, tile, dir) {
    const a = this.ensure(id);
    a.setPose(null);
    a.setTile(tile.x, tile.y);
    if (dir) a.setDir(dir);
    const e = this.entries.get(id);
    e.tile = { x: tile.x, y: tile.y };
    return a;
  }
  /** After an event: hand every scripted actor back to the schedule (they walk to their anchor / leave). */
  releaseScripted() {
    for (const e of this.entries.values()) {
      if (!e.scripted) continue;
      e.scripted = false;
      e.ref = null;
      e.actor.setPose(null);
      e.actor.clearEmote();
    }
  }
  reskinAll() {
    const season = this.sim.state.time.season;
    for (const e of this.entries.values()) reskin(e.actor, e.id, this.slotFor(e.id, e.activity), season);
  }
}
