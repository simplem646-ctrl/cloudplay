// Scene stack. Scenes get `game` (the service bag) and are driven by the SceneManager:
//   enter(params) on push/replace, exit() on pop/replace, pause() when another scene is pushed on top,
//   resume(result) when the one above pops (result = what pop() was given).
// Only the TOP scene is updated. draw() renders from the lowest scene that must be visible:
// a scene with `transparent` true lets the scene below it draw first (dialogue over the overworld).
//
// push()/replace() return a Promise that resolves with the value given to the matching pop(result)
// (undefined when popped without one), and also resolves (undefined) when the scene is removed by
// replace() or reset():   const score = await game.scenes.push(new MiniGameScene(game), params);
export class Scene {
  constructor(game) {
    this.game = game;
  }
  enter(params) {}
  exit() {}
  pause() {}
  resume(result) {}
  update(dt, input) {}
  /** @param {object} ui the UI canvas wrapper (game.ui) */
  draw(ui) {}
  get transparent() {
    return false;
  }
}

export class SceneManager {
  constructor(game) {
    this.game = game;
    this.stack = [];
    this._waiters = new Map(); // scene -> resolve
  }
  get top() {
    return this.stack.length ? this.stack[this.stack.length - 1] : null;
  }
  get depth() {
    return this.stack.length;
  }

  _enter(scene, params) {
    let resolve;
    const p = new Promise((r) => { resolve = r; });
    this._waiters.set(scene, resolve);
    this.stack.push(scene);
    scene.enter(params);
    return p;
  }
  _settle(scene, result) {
    const r = this._waiters.get(scene);
    if (r) {
      this._waiters.delete(scene);
      r(result);
    }
  }

  /** Push a scene on top (the previous top is paused). Resolves with the scene's pop() result. */
  push(scene, params) {
    const cur = this.top;
    if (cur) cur.pause();
    return this._enter(scene, params);
  }
  /** Pop the top scene; the one below resumes with `result`. Returns the popped scene (or null). */
  pop(result) {
    const s = this.stack.pop();
    if (!s) return null;
    s.exit();
    this._settle(s, result);
    const below = this.top;
    if (below) below.resume(result);
    return s;
  }
  /** Replace the top scene (no resume of the scene below). The replaced scene's promise resolves undefined. */
  replace(scene, params) {
    const s = this.stack.pop();
    if (s) {
      s.exit();
      this._settle(s, undefined);
    }
    return this._enter(scene, params);
  }
  /** Remove every scene (exit() top-down, promises resolve undefined), then optionally push `scene`. */
  reset(scene, params) {
    while (this.stack.length) {
      const s = this.stack.pop();
      s.exit();
      this._settle(s, undefined);
    }
    return scene ? this._enter(scene, params) : Promise.resolve();
  }
  update(dt) {
    const s = this.top;
    if (s) s.update(dt, this.game.input);
  }
  draw() {
    const st = this.stack;
    if (!st.length) return;
    let i = st.length - 1;
    while (i > 0 && st[i].transparent) i--;
    const ui = this.game.ui;
    for (; i < st.length; i++) st[i].draw(ui);
  }
}
