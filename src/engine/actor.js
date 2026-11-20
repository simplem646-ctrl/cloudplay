// Actor: logic + animation state of one sprite (character or animal). No GPU objects live here:
// WorldView builds an ActorView (sprites.js) when the actor is added. Importable in Node.
//
// Position (x,y) is the pixel position of the FEET (bottom-centre of the sprite).
import { DIRS, TILE } from '../core/constants.js';

const WALK_FRAME = 0.14; // seconds per walk-cycle frame
const RUN_FRAME = 0.09;

export class Actor {
  /**
   * @param {object} o {id, sheet, kind:'char'|'animal', x, y, tx, ty, dir, shadow, shadowSize:{w,h},
   *                    hitbox:{w,h,ox,oy}, solid, tint, alpha, visible}
   * `sheet` = {canvas, ...CHAR_SHEET} or {canvas, ...ANIMAL_SHEET} (what src/art returns).
   */
  constructor(o = {}) {
    this.id = o.id || `actor${Actor._n++}`;
    this.kind = o.kind || 'char';
    this.sheet = null;
    this.x = 0;
    this.y = 0;
    this.dir = o.dir || 'down';
    this.pose = null;
    this.moving = false;
    this.running = false;
    this.speedMul = 1;
    this.solid = o.solid !== undefined ? o.solid : true;
    this.visible = o.visible !== undefined ? o.visible : true;
    this.alpha = o.alpha !== undefined ? o.alpha : 1;
    this.tint = o.tint ? [o.tint[0], o.tint[1], o.tint[2]] : [1, 1, 1]; // multiplied into the sprite
    this.flashColor = [1, 1, 1, 0]; // rgb + mix amount (hit flash / highlight)
    this.shadow = o.shadow !== undefined ? o.shadow : true;
    this.shadowSize = o.shadowSize || (this.kind === 'animal' ? { w: 10, h: 5 } : { w: 12, h: 6 });
    this.hitbox = o.hitbox || { w: 10, h: 6, ox: 0, oy: 0 };
    this.sortBias = o.sortBias || 0; // added to y when y-sorting (props)
    this.yOffset = 0; // visual lift in px (jumps, hops); does not move the feet
    this.emoteOffsetY = o.emoteOffsetY || 0;
    this.col = 0;
    this.row = 0;
    this.animTime = 0;
    this.time = 0;
    this._moveFlag = false;
    this._wasMoving = false;
    this.emoteKind = null;
    this._emoteT = 0;
    this._emoteDur = 0;
    this.view = null; // set by WorldView
    if (o.sheet) this.setSheet(o.sheet);
    if (o.tx !== undefined) this.setTile(o.tx, o.ty);
    if (o.x !== undefined) this.x = o.x;
    if (o.y !== undefined) this.y = o.y;
    this._pickFrame();
  }

  setSheet(sheet) {
    this.sheet = sheet;
    if (this.view) this.view.setSheet(sheet);
    this._pickFrame();
    return this;
  }
  setPos(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }
  /** Stand centred on tile (tx,ty): x = tx*16+8, y = ty*16+14. */
  setTile(tx, ty) {
    this.x = tx * TILE + TILE / 2;
    this.y = ty * TILE + TILE - 2;
    return this;
  }
  get tx() {
    return Math.floor(this.x / TILE);
  }
  get ty() {
    return Math.floor((this.y - 1) / TILE);
  }
  setDir(d) {
    if (DIRS.includes(d)) this.dir = d;
    return this;
  }
  /** Turn toward a point or another actor/object with {x,y} (dominant axis wins). */
  faceToward(a, b) {
    const tx = typeof a === 'number' ? a : a.x;
    const ty = typeof a === 'number' ? b : a.y;
    const dx = tx - this.x;
    const dy = ty - this.y;
    if (Math.abs(dx) < 0.01 && Math.abs(dy) < 0.01) return this;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    return this;
  }
  /**
   * Pose: characters 'happy'|'sad'|'surprised'|'cheer'|'sleep'|'sit' (sit follows `dir`);
   * animals 'sit'|'sit_front'|'sit_left'|'sit_right'|'sleep'|'stretch'|'loaf'. null = normal.
   */
  setPose(p) {
    this.pose = p || null;
    return this;
  }
  /** Walk-animation control for code that moves the actor itself (moveActor/PathWalker call this). */
  setMoving(moving, running = false) {
    this._moveFlag = !!moving;
    this.running = !!running;
    return this;
  }

  /** Show an emote bubble ('heart','sweat','note','anger','exclaim','question','dots','sparkle','zzz'). */
  emote(kind, duration = 1.8) {
    this.emoteKind = kind;
    this._emoteT = 0;
    this._emoteDur = duration;
    return this;
  }
  clearEmote() {
    this.emoteKind = null;
    return this;
  }
  /** 0..1..0 envelope of the current emote (for alpha), 0 when none. */
  get emoteAlpha() {
    if (!this.emoteKind) return 0;
    const t = this._emoteT;
    const d = this._emoteDur;
    return Math.max(0, Math.min(1, t / 0.12, (d - t) / 0.25));
  }
  get emoteTime() {
    return this._emoteT;
  }

  update(dt) {
    this.time += dt;
    const moving = this._moveFlag;
    this._moveFlag = false;
    if (moving && !this._wasMoving) this.animTime = 0; // first frame of a step on the very first tick
    this._wasMoving = moving;
    this.moving = moving;
    if (moving) this.animTime += dt;
    this.yOffset = this.pose === 'cheer' ? -Math.round(Math.abs(Math.sin(this.time * 9)) * 2) : 0;
    if (this.emoteKind) {
      this._emoteT += dt;
      if (this._emoteT >= this._emoteDur) this.emoteKind = null;
    }
    this._pickFrame();
  }

  _pickFrame() {
    const s = this.sheet;
    if (!s) return;
    const dirRow = s.dirRow[this.dir] ?? 0;
    const pose = this.pose;
    if (pose) {
      if (this.kind === 'animal') {
        let name = pose;
        if (pose === 'sit') name = this.dir === 'left' ? 'sit_left' : this.dir === 'right' ? 'sit_right' : 'sit_front';
        const c = s.poseCol[name];
        if (c !== undefined) { this.row = s.poseRow; this.col = c; return; }
      } else if (pose === 'sit') {
        this.row = s.sitRow;
        this.col = s.sitCol[this.dir] ?? 0;
        return;
      } else if (s.poseCol[pose] !== undefined) {
        this.row = s.poseRow;
        this.col = s.poseCol[pose];
        return;
      }
    }
    this.row = dirRow;
    if (this.moving) {
      const cycle = s.walkCycle;
      const fd = this.running ? RUN_FRAME : WALK_FRAME;
      this.col = cycle[Math.floor(this.animTime / fd) % cycle.length];
    } else this.col = s.standCol ?? 0;
  }
}
Actor._n = 1;
