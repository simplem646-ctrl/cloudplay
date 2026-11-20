// Camera maths: follow (optionally smoothed), clamp to the map, pans, shake, integer snapping.
// Pure logic (no DOM / three), importable in Node. The WorldView applies `camera.px/py` (the
// integer top-left of the view in world pixels) to the three.js camera each frame.
import { VIEW_W, VIEW_H } from '../core/constants.js';
import { resolveEase } from './ease.js';

/** Left edge of the view for a desired left edge, clamped to a map `mapSize` px long. Small maps are centred. */
export function clampAxis(left, mapSize, viewSize) {
  if (mapSize <= viewSize) return Math.floor((mapSize - viewSize) / 2);
  return Math.min(mapSize - viewSize, Math.max(0, left));
}

export class Camera {
  constructor({ viewW = VIEW_W, viewH = VIEW_H, rng = Math.random } = {}) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.rng = rng;
    /** centre of the view in world pixels (float, already clamped) */
    this.x = viewW / 2;
    this.y = viewH / 2;
    /** integer top-left actually rendered (includes shake) */
    this.px = 0;
    this.py = 0;
    this.bounds = null; // {w,h} in pixels
    this.target = null; // {x,y} read live
    this.offset = { x: 0, y: -10 }; // aim at the middle of a 24px sprite rather than the feet
    this.smooth = 0; // follow stiffness in 1/s; 0 = instant
    this._pan = null;
    this._shake = null;
    this._shakeTick = 0;
    this._sx = 0;
    this._sy = 0;
    this._apply();
  }

  /** Clamp the camera to a map (pixels). Pass null to remove the clamp. */
  setBounds(w, h) {
    this.bounds = w ? { w, h } : null;
    const c = this._clampCentre(this.x, this.y);
    this.x = c.x;
    this.y = c.y;
    this._apply();
  }

  /** Follow `target` ({x,y}, e.g. an Actor) or stop following (null). opts: {smooth, offsetX, offsetY, snap=true} */
  follow(target, opts = {}) {
    this.target = target || null;
    if (opts.smooth !== undefined) this.smooth = opts.smooth;
    if (opts.offsetX !== undefined) this.offset.x = opts.offsetX;
    if (opts.offsetY !== undefined) this.offset.y = opts.offsetY;
    if (target && opts.snap !== false) this.snapTo(target.x + this.offset.x, target.y + this.offset.y);
  }

  /** Jump the view centre to a world point immediately (cancels any pan). */
  snapTo(x, y) {
    this._pan = null;
    const c = this._clampCentre(x, y);
    this.x = c.x;
    this.y = c.y;
    this._apply();
  }

  /** Ease the view centre to a world point. Following is suspended during the pan and resumes after.
   *  @returns {Promise<void>} resolves when the pan ends */
  panTo(x, y, ms = 600, ease = 'inOut') {
    if (this._pan) this._pan.resolve();
    const to = this._clampCentre(x, y);
    if (ms <= 0) {
      this.snapTo(x, y);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this._pan = { fx: this.x, fy: this.y, tx: to.x, ty: to.y, t: 0, dur: ms / 1000, ease: resolveEase(ease), resolve };
    });
  }

  /** Focus an actor or point: pans to it (ms > 0) or snaps (ms = 0), then keeps following it. */
  focus(target, ms = 0, opts = {}) {
    this.target = target;
    const tx = target.x + this.offset.x;
    const ty = target.y + this.offset.y;
    if (ms > 0) return this.panTo(tx, ty, ms, opts.ease);
    this.snapTo(tx, ty);
    return Promise.resolve();
  }

  /** Screen shake: integer pixel jitter of up to `amp` px decaying linearly over `ms`. */
  shake(amp = 3, ms = 300) {
    this._shake = { amp, dur: ms / 1000, t: 0 };
  }

  get panning() {
    return !!this._pan;
  }

  update(dt) {
    if (this._pan) {
      const p = this._pan;
      p.t += dt;
      const k = Math.min(1, p.t / p.dur);
      const e = p.ease(k);
      this.x = p.fx + (p.tx - p.fx) * e;
      this.y = p.fy + (p.ty - p.fy) * e;
      if (k >= 1) {
        this._pan = null;
        p.resolve();
      }
    } else if (this.target) {
      const tx = this.target.x + this.offset.x;
      const ty = this.target.y + this.offset.y;
      const c = this._clampCentre(tx, ty);
      if (this.smooth <= 0) {
        this.x = c.x;
        this.y = c.y;
      } else {
        const a = 1 - Math.exp(-this.smooth * dt);
        this.x += (c.x - this.x) * a;
        this.y += (c.y - this.y) * a;
      }
    }
    if (this._shake) {
      const s = this._shake;
      s.t += dt;
      if (s.t >= s.dur) {
        this._shake = null;
        this._sx = this._sy = 0;
      } else {
        // new jitter ~30x/s so it reads as chunky pixel shake rather than a blur
        this._shakeTick -= dt;
        if (this._shakeTick <= 0) {
          this._shakeTick = 1 / 30;
          const f = s.amp * (1 - s.t / s.dur);
          this._sx = Math.round((this.rng() * 2 - 1) * f);
          this._sy = Math.round((this.rng() * 2 - 1) * f);
        }
      }
    }
    this._apply();
  }

  _clampCentre(cx, cy) {
    const b = this.bounds;
    if (!b) return { x: cx, y: cy };
    const l = clampAxis(cx - this.viewW / 2, b.w, this.viewW);
    const t = clampAxis(cy - this.viewH / 2, b.h, this.viewH);
    return { x: l + this.viewW / 2, y: t + this.viewH / 2 };
  }

  _apply() {
    this.px = Math.round(this.x - this.viewW / 2) + this._sx;
    this.py = Math.round(this.y - this.viewH / 2) + this._sy;
  }

  /** World -> screen pixel (no allocation: writes into `out`). */
  worldToScreen(wx, wy, out = {}) {
    out.x = wx - this.px;
    out.y = wy - this.py;
    return out;
  }
}
