// Pixel movement with sliding AABB collision against the map `collision` grid (+ optional
// actor blockers). Pure logic: no DOM, importable in Node.
//
// Hitbox convention: a rect of (w x h) whose horizontal centre is the actor's x and whose
// BOTTOM edge is the actor's y (the feet). That matches `feetToTile` in core/util.js: an actor
// standing on tile (tx,ty) has feet y = ty*16+14 and its 10x6 hitbox sits inside that tile.
import { TILE } from '../core/constants.js';

export const WALK_SPEED = 56; // px/s
export const RUN_SPEED = 96; // px/s
export const HITBOX_W = 10;
export const HITBOX_H = 6;
export const CORNER_ASSIST = 4; // px an actor may be nudged around a corner it clips

const EPS = 1e-4;

/** Hitbox rect of an actor-like {x, y, hitbox?:{w,h,ox,oy}} into `out` (or a new object). */
export function getHitbox(a, out = {}) {
  const hb = a.hitbox;
  const w = hb ? hb.w : HITBOX_W;
  const h = hb ? hb.h : HITBOX_H;
  const x0 = a.x - w / 2 + (hb ? hb.ox || 0 : 0);
  const y1 = a.y + (hb ? hb.oy || 0 : 0);
  out.x0 = x0;
  out.x1 = x0 + w;
  out.y0 = y1 - h;
  out.y1 = y1;
  return out;
}

/** True if tile (tx,ty) blocks movement. Out of bounds counts as blocked. */
export function tileBlocked(map, tx, ty) {
  if (tx < 0 || ty < 0 || tx >= map.width || ty >= map.height) return true;
  if (map.collision[ty * map.width + tx]) return true;
  return map.blockedFn ? !!map.blockedFn(tx, ty) : false;
}

/** True if any tile overlapped by the pixel rect [x0,x1) x [y0,y1) is blocked. */
export function rectBlocked(map, x0, y0, x1, y1, tile = TILE) {
  const tx0 = Math.floor(x0 / tile);
  const tx1 = Math.floor((x1 - EPS) / tile);
  const ty0 = Math.floor(y0 / tile);
  const ty1 = Math.floor((y1 - EPS) / tile);
  for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) if (tileBlocked(map, tx, ty)) return true;
  return false;
}

const overlaps = (a, b) => a.x0 < b.x1 - EPS && a.x1 > b.x0 + EPS && a.y0 < b.y1 - EPS && a.y1 > b.y0 + EPS;

// Largest displacement (same sign as d, |result| <= |d|) the rect can travel along `axis`
// before touching a blocked tile. Walks tile boundaries, so it is exact at any speed.
function tileLimit(map, r, d, axis, tile) {
  const x = axis === 'x';
  const lo = x ? r.x0 : r.y0;
  const hi = x ? r.x1 : r.y1;
  const plo = x ? r.y0 : r.x0;
  const phi = x ? r.y1 : r.x1;
  const p0 = Math.floor(plo / tile);
  const p1 = Math.floor((phi - EPS) / tile);
  const blockedAt = (c) => {
    for (let p = p0; p <= p1; p++) if (x ? tileBlocked(map, c, p) : tileBlocked(map, p, c)) return true;
    return false;
  };
  if (d > 0) {
    let B = Math.ceil((hi - EPS) / tile) * tile;
    while (B + EPS < hi + d) {
      if (blockedAt(Math.round(B / tile))) return Math.max(0, B - hi);
      B += tile;
    }
  } else if (d < 0) {
    let B = Math.floor((lo + EPS) / tile) * tile;
    while (B - EPS > lo + d) {
      if (blockedAt(Math.round(B / tile) - 1)) return Math.min(0, B - lo);
      B -= tile;
    }
  }
  return d;
}

let _tileHit = false; // last moveAxis was cut short by a TILE (not an actor)
const _r = {};
const _b = {};

function moveAxis(actor, d, axis, map, blockers, tile) {
  if (d === 0) return 0;
  const r = getHitbox(actor, _r);
  let allowed = tileLimit(map, r, d, axis, tile);
  _tileHit = Math.abs(allowed - d) > EPS;
  if (blockers && allowed !== 0) {
    const x = axis === 'x';
    for (let i = 0; i < blockers.length; i++) {
      const o = blockers[i];
      if (o === actor || o.solid === false || o.visible === false) continue;
      const b = getHitbox(o, _b);
      if (overlaps(r, b)) continue; // already touching: let it walk away
      const pOver = x ? r.y0 < b.y1 - EPS && r.y1 > b.y0 + EPS : r.x0 < b.x1 - EPS && r.x1 > b.x0 + EPS;
      if (!pOver) continue;
      if (d > 0) {
        const gap = x ? b.x0 - r.x1 : b.y0 - r.y1;
        if (gap >= -EPS && gap < allowed) allowed = Math.max(0, gap);
      } else {
        const gap = x ? b.x1 - r.x0 : b.y1 - r.y0;
        if (gap <= EPS && gap > allowed) allowed = Math.min(0, gap);
      }
    }
  }
  if (axis === 'x') actor.x += allowed;
  else actor.y += allowed;
  return allowed;
}

const MAX_STEP = 6; // px per sub-step: keeps small blocker rects from being tunnelled at big dt

/**
 * Move an actor by a pixel displacement with sliding collision.
 * @param {object} actor  {x,y,hitbox?}
 * @param {object} map    {width,height,collision} (a MapDef works; optional blockedFn(tx,ty))
 * @param {object} [opts] {blockers?: actor[], assist?: px, tile?: 16}
 * @returns {{moved:number, dx:number, dy:number, blockedX:boolean, blockedY:boolean}}
 */
export function moveBy(actor, dx, dy, map, opts = {}) {
  const tile = opts.tile || TILE;
  const blockers = opts.blockers || null;
  const assist = opts.assist === undefined ? CORNER_ASSIST : opts.assist;
  const sx = actor.x;
  const sy = actor.y;
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / MAX_STEP));
  const stx = dx / n;
  const sty = dy / n;
  let blockedX = false;
  let blockedY = false;
  for (let i = 0; i < n; i++) {
    const mx = moveAxis(actor, stx, 'x', map, blockers, tile);
    const tx = _tileHit;
    const my = moveAxis(actor, sty, 'y', map, blockers, tile);
    const ty = _tileHit;
    const bx = Math.abs(mx - stx) > EPS;
    const by = Math.abs(my - sty) > EPS;
    if (bx) blockedX = true;
    if (by) blockedY = true;
    // Corner assist: pure-axis movement that clips a TILE corner slides around it (never around actors).
    if (assist > 0 && ((bx && tx && stx !== 0 && sty === 0) || (by && ty && sty !== 0 && stx === 0))) {
      nudge(actor, stx !== 0, stx !== 0 ? stx : sty, map, blockers, tile, assist);
    }
  }
  const ox = actor.x - sx;
  const oy = actor.y - sy;
  return { moved: Math.hypot(ox, oy), dx: ox, dy: oy, blockedX, blockedY };
}

function nudge(actor, alongX, want, map, blockers, tile, assist) {
  const r = getHitbox(actor, {});
  let best = 0;
  for (let s = 1; s <= assist && !best; s++) {
    for (const sg of [-1, 1]) {
      const px = alongX ? 0 : sg * s;
      const py = alongX ? sg * s : 0;
      const ax = alongX ? want : 0;
      const ay = alongX ? 0 : want;
      // free after the sideways shift, and free again after the forward step
      if (rectBlocked(map, r.x0 + px, r.y0 + py, r.x1 + px, r.y1 + py, tile)) continue;
      if (rectBlocked(map, r.x0 + px + ax, r.y0 + py + ay, r.x1 + px + ax, r.y1 + py + ay, tile)) continue;
      best = sg * s;
      break;
    }
  }
  if (!best) return;
  const step = Math.sign(best) * Math.min(Math.abs(best), Math.max(Math.abs(want), 0.75));
  moveAxis(actor, step, alongX ? 'y' : 'x', map, blockers, tile);
}

/** Facing for a movement vector; keeps `current` when it is one of the active axes (diagonals). */
export function dirFromVector(vx, vy, current = 'down') {
  const ax = Math.abs(vx);
  const ay = Math.abs(vy);
  if (ax < 1e-6 && ay < 1e-6) return current;
  if (ax > ay + 1e-6) return vx > 0 ? 'right' : 'left';
  if (ay > ax + 1e-6) return vy > 0 ? 'down' : 'up';
  if ((current === 'left' && vx < 0) || (current === 'right' && vx > 0)) return current;
  if ((current === 'up' && vy < 0) || (current === 'down' && vy > 0)) return current;
  return vy > 0 ? 'down' : 'up';
}

/**
 * Move an actor from a direction input (e.g. input.axis()) for one frame: 8-way, constant speed on
 * diagonals, sliding collision. Updates actor.dir and the walk-animation flag (actor.setMoving).
 * @param {object} actor
 * @param {number} ax  -1..1 horizontal intent      @param {number} ay  -1..1 vertical intent
 * @param {number} dt  seconds
 * @param {object} map {width,height,collision}
 * @param {object} [opts] {run, speed, blockers, assist}
 */
export function moveActor(actor, ax, ay, dt, map, opts = {}) {
  let vx = ax;
  let vy = ay;
  const len = Math.hypot(vx, vy);
  if (len > 1) {
    vx /= len;
    vy /= len;
  }
  const run = opts.run !== undefined ? opts.run : !!actor.running;
  const speed = (opts.speed || (run ? RUN_SPEED : WALK_SPEED)) * (actor.speedMul || 1);
  if (len < 1e-3) {
    if (actor.setMoving) actor.setMoving(false);
    return { moved: 0, dx: 0, dy: 0, blockedX: false, blockedY: false };
  }
  const res = moveBy(actor, vx * speed * dt, vy * speed * dt, map, opts);
  actor.dir = dirFromVector(vx, vy, actor.dir);
  const moving = res.moved > speed * dt * 0.2;
  if (actor.setMoving) actor.setMoving(moving, run);
  return res;
}

/**
 * Walks an actor along a tile path (from findPath) using the same collision as moveActor.
 *   const w = new PathWalker(npc, path, { run: false });  each frame: if (w.update(dt, map)) { arrived }
 * `path[0]` (the start tile) is skipped automatically. `w.stuck` is set if blocked for > 0.6 s.
 */
export class PathWalker {
  constructor(actor, path, opts = {}) {
    this.actor = actor;
    this.path = path || [];
    this.i = 0;
    this.opts = opts;
    this.done = !path || path.length === 0;
    this.stuck = false;
    this._stuckT = 0;
  }
  cancel() {
    this.done = true;
    if (this.actor.setMoving) this.actor.setMoving(false);
  }
  /** @returns {boolean} true once the final waypoint is reached (or cancelled/stuck) */
  update(dt, map, opts) {
    const a = this.actor;
    if (this.done) return true;
    const o = opts || this.opts;
    const run = o.run !== undefined ? o.run : !!a.running;
    const speed = (o.speed || (run ? RUN_SPEED : WALK_SPEED)) * (a.speedMul || 1);
    let budget = speed * dt;
    let moved = false;
    while (this.i < this.path.length && budget > 1e-6) {
      const t = this.path[this.i];
      const tx = t.x * TILE + TILE / 2;
      const ty = t.y * TILE + TILE - 2;
      const dx = tx - a.x;
      const dy = ty - a.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 0.01) { this.i++; continue; }
      const step = Math.min(dist, budget);
      const res = moveBy(a, (dx / dist) * step, (dy / dist) * step, map, o);
      a.dir = dirFromVector(dx, dy, a.dir);
      if (res.moved < step * 0.25) {
        this._stuckT += dt;
        if (this._stuckT > 0.6) {
          this.stuck = true;
          this.cancel();
          return true;
        }
        break;
      }
      moved = true;
      this._stuckT = 0;
      budget -= res.moved;
      if (Math.hypot(tx - a.x, ty - a.y) < 0.05) { a.x = tx; a.y = ty; this.i++; }
      else break;
    }
    if (a.setMoving) a.setMoving(moved, run);
    if (this.i >= this.path.length) {
      this.done = true;
      if (a.setMoving) a.setMoving(false);
      return true;
    }
    return false;
  }
}

/** Namespace form: mover.move(actor, ax, ay, dt, map, opts), mover.by(...), mover.PathWalker. */
export const mover = { move: moveActor, by: moveBy, PathWalker, getHitbox, rectBlocked, tileBlocked, WALK_SPEED, RUN_SPEED };
