// Input: keyboard, standard gamepad, touch overlay and scripted injection merged into one set of
// actions. The state machine is pure (feed it events, call update()), so it is testable in Node;
// DOM wiring lives in attach() and in TouchOverlay, both browser-only and created on demand.

export const ACTIONS = ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'menu', 'run', 'fast', 'skip', 'debug'];

export const DEFAULT_KEYS = {
  up: ['ArrowUp', 'KeyW'],
  down: ['ArrowDown', 'KeyS'],
  left: ['ArrowLeft', 'KeyA'],
  right: ['ArrowRight', 'KeyD'],
  confirm: ['KeyZ', 'Enter', 'NumpadEnter', 'Space'],
  cancel: ['KeyX', 'Backspace', 'Escape'],
  menu: ['Tab', 'KeyM', 'Escape'],
  run: ['ShiftLeft', 'ShiftRight'],
  fast: ['ControlLeft', 'ControlRight'],
  skip: ['KeyC'],
  debug: ['Backquote', 'F2'],
};

// Codes whose browser default (scroll, focus change, history back) must be suppressed in-game.
const PREVENT = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Tab', 'Backspace', 'Backquote', 'F2']);

const PAD_BUTTONS = {
  confirm: [0], cancel: [1], run: [2, 6], menu: [3, 9], fast: [5, 7], skip: [8],
  up: [12], down: [13], left: [14], right: [15],
};
const STICK_DEAD = 0.25;

/** Standard-mapping gamepad -> out: {up,down,left,right,... booleans, ax, ay analog -1..1}. Pure. */
export function readPad(pad, out) {
  for (const a of ACTIONS) out[a] = false;
  out.ax = 0;
  out.ay = 0;
  if (!pad) return out;
  const b = pad.buttons || [];
  const pressed = (i) => !!(b[i] && (b[i].pressed || b[i].value > 0.5));
  for (const a of Object.keys(PAD_BUTTONS)) for (const i of PAD_BUTTONS[a]) if (pressed(i)) out[a] = true;
  const ax = (pad.axes && pad.axes[0]) || 0;
  const ay = (pad.axes && pad.axes[1]) || 0;
  const mag = Math.hypot(ax, ay);
  if (mag > STICK_DEAD) {
    const k = Math.min(1, (mag - STICK_DEAD) / (1 - STICK_DEAD)) / mag;
    out.ax = ax * k;
    out.ay = ay * k;
    if (ax < -0.5) out.left = true;
    if (ax > 0.5) out.right = true;
    if (ay < -0.5) out.up = true;
    if (ay > 0.5) out.down = true;
  }
  return out;
}

const defaultNow = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const defaultPads = () => (typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : []);

export class Input {
  /**
   * @param {object} [o] {now: ()=>ms, getPads: ()=>Gamepad[], keys: {action: codes[]}, repeatDelay: 350, repeatInterval: 120}
   */
  constructor(o = {}) {
    this.now = o.now || defaultNow;
    this.getPads = o.getPads || defaultPads;
    this.repeatDelay = o.repeatDelay ?? 350;
    this.repeatInterval = o.repeatInterval ?? 120;
    this.keymap = new Map(); // code -> actions[]
    this.bindKeys(o.keys || DEFAULT_KEYS);
    this._keys = new Set(); // physical codes held
    this._src = { touch: {}, inject: {}, pad: {} };
    this._latchP = {};
    this._latchR = {};
    this._st = {};
    this._next = {};
    for (const a of ACTIONS) {
      this._st[a] = { down: false, pressed: false, released: false, repeat: false };
      this._src.touch[a] = this._src.inject[a] = this._src.pad[a] = false;
      this._latchP[a] = this._latchR[a] = false;
      this._next[a] = 0;
    }
    this._padOut = {};
    this._padAx = 0;
    this._padAy = 0;
    this._ax = 0;
    this._ay = 0;
    this._attached = null;
    this.lastDevice = 'keyboard'; // 'keyboard' | 'pad' | 'touch' (for prompts)
    this.touch = null; // TouchOverlay once created
  }

  /** Replace key bindings: { action: ['KeyZ', ...] }. */
  bindKeys(map) {
    this.keymap.clear();
    for (const a of Object.keys(map)) for (const code of map[a]) {
      if (!this.keymap.has(code)) this.keymap.set(code, []);
      this.keymap.get(code).push(a);
    }
  }

  _raw(a) {
    if (this._src.touch[a] || this._src.inject[a] || this._src.pad[a]) return true;
    for (const code of this._keys) {
      const l = this.keymap.get(code);
      if (l && l.includes(a)) return true;
    }
    return false;
  }

  _mutate(fn, actions) {
    const before = actions.map((a) => this._raw(a));
    fn();
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      const now = this._raw(a);
      if (!before[i] && now) this._latchP[a] = true;
      if (before[i] && !now) this._latchR[a] = true;
    }
  }

  /** Feed a keydown. Returns true when the code is bound (the caller may preventDefault). */
  keyDown(code) {
    const acts = this.keymap.get(code);
    if (!acts) return false;
    this.lastDevice = 'keyboard';
    this._mutate(() => this._keys.add(code), acts);
    return true;
  }
  keyUp(code) {
    const acts = this.keymap.get(code);
    if (!acts) return false;
    this._mutate(() => this._keys.delete(code), acts);
    return true;
  }
  /** Touch overlay / on-screen controls drive this. */
  setTouch(action, down) {
    if (down) this.lastDevice = 'touch';
    this._mutate(() => { this._src.touch[action] = !!down; }, [action]);
  }
  /** Scripted/automation input: input.inject('confirm', true) ... later inject('confirm', false). */
  inject(action, down) {
    if (!ACTIONS.includes(action)) throw new Error(`Unknown input action "${action}"`);
    this._mutate(() => { this._src.inject[action] = !!down; }, [action]);
  }
  /** Inject a tap that is visible for exactly one update(). */
  tap(action) {
    this.inject(action, true);
    this._tapRelease = (this._tapRelease || []).concat(action);
  }

  /** Release everything (window blur, tab hidden, scene change that must not carry held keys). */
  clear() {
    this._mutate(() => {
      this._keys.clear();
      for (const a of ACTIONS) this._src.touch[a] = this._src.inject[a] = this._src.pad[a] = false;
    }, ACTIONS);
  }

  /** Call once per frame: latches edges, polls the gamepad, computes repeats and the axis. */
  update(nowMs) {
    const now = nowMs === undefined ? this.now() : nowMs;
    this._pollPad();
    for (const a of ACTIONS) {
      const st = this._st[a];
      const d = this._raw(a);
      st.pressed = (d && !st.down) || this._latchP[a];
      st.released = (!d && st.down) || this._latchR[a];
      st.down = d;
      this._latchP[a] = this._latchR[a] = false;
      if (st.pressed) {
        st.repeat = true;
        this._next[a] = now + this.repeatDelay;
      } else if (d && now >= this._next[a]) {
        st.repeat = true;
        this._next[a] += this.repeatInterval;
        if (this._next[a] <= now) this._next[a] = now + this.repeatInterval;
      } else st.repeat = false;
    }
    const s = this._st;
    this._ax = Math.max(-1, Math.min(1, (s.right.down ? 1 : 0) - (s.left.down ? 1 : 0) + this._padAx));
    this._ay = Math.max(-1, Math.min(1, (s.down.down ? 1 : 0) - (s.up.down ? 1 : 0) + this._padAy));
    if (this._tapRelease) {
      const list = this._tapRelease;
      this._tapRelease = null;
      for (const a of list) this.inject(a, false);
    }
  }

  _pollPad() {
    let pads;
    try { pads = this.getPads(); } catch { pads = []; }
    let pad = null;
    for (let i = 0; i < (pads ? pads.length : 0); i++) if (pads[i] && pads[i].connected !== false) { pad = pads[i]; break; }
    const out = readPad(pad, this._padOut);
    this._padAx = out.ax;
    this._padAy = out.ay;
    for (const a of ACTIONS) {
      if (this._src.pad[a] !== out[a]) {
        if (out[a]) this.lastDevice = 'pad';
        this._mutate(() => { this._src.pad[a] = out[a]; }, [a]);
      }
    }
  }

  down(a) { return this._st[a].down; }
  pressed(a) { return this._st[a].pressed; }
  released(a) { return this._st[a].released; }
  /** true on the first press, then every repeatInterval ms after repeatDelay ms of holding (menus). */
  repeat(a) { return this._st[a].repeat; }
  /** Movement intent -1..1 per axis (digital keys + analog stick). Not normalised: moveActor does that. */
  axis() { return { x: this._ax, y: this._ay }; }
  /** True if any action was pressed this frame. */
  anyPressed() {
    for (const a of ACTIONS) if (this._st[a].pressed) return true;
    return false;
  }

  /** Wire DOM listeners (browser). Returns this. */
  attach(win = window) {
    if (this._attached) return this;
    const onDown = (e) => {
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if ((e.ctrlKey || e.metaKey) && !e.code.startsWith('Control') && !e.code.startsWith('Meta')) return; // browser shortcuts
      if (this.keyDown(e.code) && PREVENT.has(e.code)) e.preventDefault();
    };
    const onUp = (e) => { this.keyUp(e.code); };
    const onBlur = () => this.clear();
    const onVis = () => { if (win.document && win.document.hidden) this.clear(); };
    win.addEventListener('keydown', onDown);
    win.addEventListener('keyup', onUp);
    win.addEventListener('blur', onBlur);
    if (win.document) win.document.addEventListener('visibilitychange', onVis);
    this._attached = () => {
      win.removeEventListener('keydown', onDown);
      win.removeEventListener('keyup', onUp);
      win.removeEventListener('blur', onBlur);
      if (win.document) win.document.removeEventListener('visibilitychange', onVis);
    };
    return this;
  }
  detach() {
    if (this._attached) this._attached();
    this._attached = null;
    if (this.touch) this.touch.destroy();
    this.touch = null;
  }

  /** Create the touch overlay inside `container` (shown only on touch devices unless `force`). */
  createTouchOverlay(container, opts = {}) {
    if (!this.touch) this.touch = new TouchOverlay(this, container, opts);
    return this.touch;
  }
}

export function isTouchDevice() {
  if (typeof window === 'undefined') return false;
  return 'ontouchstart' in window || (navigator.maxTouchPoints || 0) > 0 || (window.matchMedia && window.matchMedia('(pointer: coarse)').matches);
}

/** Virtual D-pad + A/B/Menu/Run overlay made of DOM elements inside the game container. */
export class TouchOverlay {
  constructor(input, container, { force = false } = {}) {
    this.input = input;
    this.container = container;
    this.visible = false;
    this._build();
    this.show(force || isTouchDevice());
    // a first touch anywhere reveals it on hybrid devices
    this._onFirstTouch = () => this.show(true);
    window.addEventListener('touchstart', this._onFirstTouch, { once: true, passive: true });
  }

  _build() {
    const doc = this.container.ownerDocument;
    const css = doc.createElement('style');
    css.textContent = `
.tc-root{position:absolute;inset:0;pointer-events:none;z-index:20;display:none;touch-action:none;
  padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.tc-root *{touch-action:none;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
.tc-pad{position:absolute;left:max(14px,env(safe-area-inset-left));bottom:max(14px,env(safe-area-inset-bottom));width:min(34vmin,168px);height:min(34vmin,168px);
  border-radius:50%;background:rgba(29,35,64,.45);border:2px solid rgba(246,236,210,.55);pointer-events:auto}
.tc-pad:before,.tc-pad:after{content:"";position:absolute;background:rgba(246,236,210,.22);border-radius:3px}
.tc-pad:before{left:50%;top:14%;bottom:14%;width:4px;margin-left:-2px}
.tc-pad:after{top:50%;left:14%;right:14%;height:4px;margin-top:-2px}
.tc-knob{position:absolute;left:50%;top:50%;width:38%;height:38%;margin:-19% 0 0 -19%;border-radius:50%;
  background:rgba(246,236,210,.5);border:2px solid rgba(246,236,210,.85);transition:transform 50ms linear}
.tc-btn{position:absolute;pointer-events:auto;border-radius:50%;background:rgba(29,35,64,.5);border:2px solid rgba(246,236,210,.6);
  color:#f6ecd2;font:700 15px ui-monospace,Menlo,Consolas,monospace;display:flex;align-items:center;justify-content:center}
.tc-btn.on{background:rgba(242,184,75,.85);color:#3b2a1f;border-color:#fff3c8}
.tc-a{right:max(16px,env(safe-area-inset-right));bottom:calc(max(14px,env(safe-area-inset-bottom)) + min(10vmin,52px));width:min(20vmin,92px);height:min(20vmin,92px);font-size:22px}
.tc-b{right:calc(max(16px,env(safe-area-inset-right)) + min(22vmin,100px));bottom:max(14px,env(safe-area-inset-bottom));width:min(15vmin,70px);height:min(15vmin,70px);font-size:18px}
.tc-menu,.tc-run{border-radius:12px;width:min(17vmin,76px);height:min(8vmin,36px);font-size:11px;letter-spacing:.06em}
.tc-menu{right:max(12px,env(safe-area-inset-right));top:max(10px,env(safe-area-inset-top))}
.tc-run{left:max(14px,env(safe-area-inset-left));bottom:calc(max(14px,env(safe-area-inset-bottom)) + min(34vmin,168px) + 10px)}`;
    const root = doc.createElement('div');
    root.className = 'tc-root';
    root.appendChild(css);
    const pad = doc.createElement('div');
    pad.className = 'tc-pad';
    const knob = doc.createElement('div');
    knob.className = 'tc-knob';
    pad.appendChild(knob);
    root.appendChild(pad);
    const mk = (cls, label, action, toggle) => {
      const b = doc.createElement('div');
      b.className = `tc-btn ${cls}`;
      b.textContent = label;
      root.appendChild(b);
      if (toggle) {
        let on = false;
        b.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          on = !on;
          b.classList.toggle('on', on);
          this.input.setTouch(action, on);
        });
      } else {
        const set = (d) => { b.classList.toggle('on', d); this.input.setTouch(action, d); };
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); b.setPointerCapture(e.pointerId); set(true); });
        const up = () => set(false);
        b.addEventListener('pointerup', up);
        b.addEventListener('pointercancel', up);
        b.addEventListener('lostpointercapture', up);
      }
      return b;
    };
    mk('tc-a', 'A', 'confirm');
    mk('tc-b', 'B', 'cancel');
    mk('tc-menu', 'MENU', 'menu');
    mk('tc-run', 'RUN', 'run', true);

    const setDir = (dx, dy, kx, ky) => {
      const T = 0.32;
      const s = { left: dx < -T, right: dx > T, up: dy < -T, down: dy > T };
      for (const k of Object.keys(s)) if (this.input._src.touch[k] !== s[k]) this.input.setTouch(k, s[k]);
      knob.style.transform = `translate(${kx}px,${ky}px)`;
    };
    const track = (e) => {
      const r = pad.getBoundingClientRect();
      const rad = r.width / 2;
      let dx = (e.clientX - (r.left + rad)) / rad;
      let dy = (e.clientY - (r.top + rad)) / rad;
      const m = Math.hypot(dx, dy);
      const dead = 0.2;
      if (m < dead) return setDir(0, 0, 0, 0);
      const lim = Math.min(1, m);
      const nx = (dx / m) * lim;
      const ny = (dy / m) * lim;
      setDir(nx, ny, nx * rad * 0.45, ny * rad * 0.45);
    };
    pad.addEventListener('pointerdown', (e) => { e.preventDefault(); pad.setPointerCapture(e.pointerId); track(e); });
    pad.addEventListener('pointermove', (e) => { if (pad.hasPointerCapture(e.pointerId)) track(e); });
    const release = () => setDir(0, 0, 0, 0);
    pad.addEventListener('pointerup', release);
    pad.addEventListener('pointercancel', release);
    pad.addEventListener('lostpointercapture', release);
    this.root = root;
    this.container.appendChild(root);
  }

  show(v = true) {
    this.visible = !!v;
    this.root.style.display = v ? 'block' : 'none';
  }
  destroy() {
    window.removeEventListener('touchstart', this._onFirstTouch);
    this.root.remove();
  }
}
