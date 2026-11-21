// Event-trigger pacing for the overworld (pure, Node-testable).
//   * TriggerGate: "auto" check about once a second while idle, plus a short cool-down after each event so scripts never chain
//     into a wall of cutscenes (the next ask waits `cooldown` seconds).
//   * TriggerQueue: pending one-shot asks (enterMap / wake / interact), de-duplicated, served before clock/auto asks.

export class TriggerGate {
  constructor({ autoEvery = 1, cooldown = 2 } = {}) {
    this.autoEvery = autoEvery;
    this.cooldown = cooldown;
    this.cool = 0;
    this.autoT = 0;
  }
  /** Advance real time. `idle` = nothing is running (no modal, no script, no sub-scene). */
  update(dt, idle) {
    if (this.cool > 0) this.cool = Math.max(0, this.cool - dt);
    if (idle && this.cool === 0) this.autoT += dt;
  }
  /** True once per `autoEvery` seconds of idle, cooled-down time. */
  takeAuto() {
    if (this.cool > 0 || this.autoT < this.autoEvery) return false;
    this.autoT = 0;
    return true;
  }
  canAsk() { return this.cool <= 0; }
  /** Call when an event finished: starts the cool-down and restarts the auto timer. */
  eventEnded() {
    this.cool = this.cooldown;
    this.autoT = 0;
  }
  reset() { this.cool = 0; this.autoT = 0; }
}

export class TriggerQueue {
  constructor() { this.items = []; }
  /** Add a trigger ({type, ...}); an identical pending one is not added twice. */
  push(trigger) {
    const key = JSON.stringify(trigger);
    if (this.items.some((t) => JSON.stringify(t) === key)) return false;
    this.items.push(trigger);
    return true;
  }
  shift() { return this.items.shift() || null; }
  clear() { this.items.length = 0; }
  get length() { return this.items.length; }
}
