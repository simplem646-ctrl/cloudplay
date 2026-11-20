// Screen effects as small pure state machines driven by update(dt) (the app calls them from the
// fixed step, so they pause with the game). Promises resolve when a tween ends:
//   await renderer.fade.out(300);  ...swap scene...  await renderer.fade.in(300);
import { parseColor } from './color.js';
import { resolveEase } from './ease.js';
import { resolveGrading, cloneGrading, lerpGrading } from './grading.js';

/** Fade-to-colour overlay. amount 0 = clear, 1 = fully covered. */
export class Fader {
  constructor() {
    this.amount = 0;
    this.color = [0, 0, 0];
    this._tw = null;
  }
  /** Jump to an amount (optionally with a colour). Cancels a running tween (its promise resolves). */
  set(amount, color) {
    this._end();
    this.amount = amount;
    if (color !== undefined) parseColor(color, this.color);
  }
  /** Tween to `amount` over ms. Resolves immediately if ms <= 0. */
  to(amount, ms = 300, color, ease = 'inOut') {
    this._end();
    if (color !== undefined) parseColor(color, this.color);
    if (ms <= 0) {
      this.amount = amount;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this._tw = { from: this.amount, to: amount, t: 0, dur: ms / 1000, ease: resolveEase(ease), resolve };
    });
  }
  /** Fade to the colour (default black). */
  out(ms = 300, color) {
    return this.to(1, ms, color);
  }
  /** Fade back in. */
  in(ms = 300) {
    return this.to(0, ms);
  }
  get busy() {
    return !!this._tw;
  }
  _end() {
    if (this._tw) {
      const r = this._tw.resolve;
      this._tw = null;
      r();
    }
  }
  update(dt) {
    const w = this._tw;
    if (!w) return;
    w.t += dt;
    const k = Math.min(1, w.t / w.dur);
    this.amount = w.from + (w.to - w.from) * w.ease(k);
    if (k >= 1) {
      this.amount = w.to;
      this._tw = null;
      w.resolve();
    }
  }
}

/** Additive/mix flash (lightning, camera flash, "!" moments) that decays to 0. */
export class Flasher {
  constructor() {
    this.amount = 0;
    this.color = [1, 1, 1];
    this._peak = 0;
    this._t = 0;
    this._dur = 0;
    this._hold = 0;
  }
  /** Flash to `strength` (0..1) instantly then decay over ms (holdMs at full strength first). */
  trigger(color = '#ffffff', strength = 1, ms = 180, holdMs = 0) {
    parseColor(color, this.color);
    this._peak = strength;
    this.amount = strength;
    this._t = 0;
    this._dur = Math.max(0.001, ms / 1000);
    this._hold = holdMs / 1000;
  }
  update(dt) {
    if (this.amount <= 0) return;
    this._t += dt;
    if (this._t <= this._hold) return;
    const k = (this._t - this._hold) / this._dur;
    this.amount = k >= 1 ? 0 : this._peak * (1 - k) * (1 - k);
  }
}

/** Current grading + tweens between gradings. */
export class GradingState {
  constructor(initial = 'day') {
    this.current = resolveGrading(initial);
    this._tw = null;
    this._tmp = cloneGrading(this.current);
  }
  /** Jump (cancels a tween; its promise resolves). `g` is a preset name or a (partial) grading. */
  set(g) {
    this._end();
    this.current = resolveGrading(g);
  }
  /** Tween to a preset/grading over ms. Partial objects tween only what they specify. */
  tween(g, ms = 1500, ease = 'inOut') {
    this._end();
    const target = typeof g === 'string' ? resolveGrading(g) : { ...cloneGrading(this.current), ...g, tint: g.tint ? [...g.tint] : [...this.current.tint] };
    if (ms <= 0) {
      this.current = target;
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      this._tw = { from: cloneGrading(this.current), to: target, t: 0, dur: ms / 1000, ease: resolveEase(ease), resolve };
    });
  }
  get busy() {
    return !!this._tw;
  }
  _end() {
    if (this._tw) {
      const r = this._tw.resolve;
      this._tw = null;
      r();
    }
  }
  update(dt) {
    const w = this._tw;
    if (!w) return;
    w.t += dt;
    const k = Math.min(1, w.t / w.dur);
    lerpGrading(w.from, w.to, w.ease(k), this.current);
    if (k >= 1) {
      this._tw = null;
      this.current = w.to;
      w.resolve();
    }
  }
}
