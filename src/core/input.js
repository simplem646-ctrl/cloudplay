/**
 * Logical input (ARCHITECTURE §3.5): keyboard + gamepad + virtual (touch/test) sources.
 * Import-safe in Node: window/navigator are touched only inside init()/poll().
 */
export const ACTIONS = ['up', 'down', 'left', 'right', 'confirm', 'cancel', 'menu', 'run', 'tab_prev', 'tab_next', 'inventory', 'journal', 'map'];
const DIRS = ['up', 'down', 'left', 'right'];
const REPEAT_DELAY = 350; // ms before a held direction starts repeating
const REPEAT_RATE = 180;  // ms between repeats
const STICK_DEAD = 0.25;
const STICK_PRESS = 0.5;

/** Plain keys -> action. Esc/M/Tab are contextual (see resolveKey). */
const KEY_MAP = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down', arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
  ' ': 'confirm', enter: 'confirm', z: 'confirm', f: 'confirm',
  x: 'cancel', backspace: 'cancel',
  shift: 'run',
  q: 'tab_prev', '[': 'tab_prev', e: 'tab_next', ']': 'tab_next',
  i: 'inventory', j: 'journal',
};
const PREVENT_KEYS = new Set(['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'tab']);

const nowMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

export class InputController {
  constructor() {
    this._el = null;
    this._locked = false;
    this._keys = new Map();        // normalised key -> action it is currently holding
    this._pad = new Set();         // actions held by the gamepad
    this._padAxis = { x: 0, y: 0 };
    this._virtual = new Set();     // actions held virtually
    this._vAxis = { x: 0, y: 0 };
    this._pressed = new Set();     // edge actions, valid for one frame
    this._listeners = new Set();
    this._device = null;           // last-used device: 'keyboard' | 'gamepad' | 'touch' (null until first input)
    this._deviceListeners = new Set();
    this._repeat = new Map();      // action -> next repeat time (ms)
    this._cleanup = [];
    /** Returns the current Game mode string; set by main/Game so Esc/M resolve contextually. */
    this.modeProvider = () => 'field';
  }

  /** Attach DOM listeners. Safe to call in Node (no-op without window). */
  init(targetEl) {
    this.dispose();
    this._el = targetEl || null;
    if (typeof window === 'undefined') return;
    const on = (t, n, f, o) => {
      t.addEventListener(n, f, o);
      this._cleanup.push(() => t.removeEventListener(n, f, o));
    };
    on(window, 'keydown', (e) => this.handleKeyDown(e));
    on(window, 'keyup', (e) => this.handleKeyUp(e));
    on(window, 'blur', () => this.releaseAll());
    if (typeof document !== 'undefined') on(document, 'visibilitychange', () => document.hidden && this.releaseAll());
    if (targetEl && targetEl.addEventListener) {
      if (!targetEl.hasAttribute('tabindex')) targetEl.setAttribute('tabindex', '0');
      on(targetEl, 'pointerdown', () => targetEl.focus && targetEl.focus({ preventScroll: true }));
    }
  }

  dispose() {
    for (const fn of this._cleanup) fn();
    this._cleanup = [];
    this.releaseAll();
  }

  // ---- queries ----
  held(action) {
    if (this._locked) return false;
    return this._heldRaw(action);
  }
  _heldRaw(action) {
    if (this._virtual.has(action) || this._pad.has(action)) return true;
    for (const a of this._keys.values()) if (a === action) return true;
    return false;
  }
  pressed(action) {
    return !this._locked && this._pressed.has(action);
  }
  /** Movement vector, x east, y south, length <= 1 (diagonals normalised). */
  axis() {
    if (this._locked) return { x: 0, y: 0 };
    let x = (this._heldRaw('right') ? 1 : 0) - (this._heldRaw('left') ? 1 : 0);
    let y = (this._heldRaw('down') ? 1 : 0) - (this._heldRaw('up') ? 1 : 0);
    x += this._padAxis.x + this._vAxis.x;
    y += this._padAxis.y + this._vAxis.y;
    const len = Math.hypot(x, y);
    if (len > 1) {
      x /= len;
      y /= len;
    }
    return { x: x || 0, y: y || 0 };
  }

  /** Subscribe to logical presses (with direction key-repeat). Return true to consume. Returns unsubscribe. */
  onPress(fn) {
    this._listeners.add(fn);
    return () => this._listeners.delete(fn);
  }

  /** Call once at the end of each frame. */
  endFrame() {
    this._pressed.clear();
  }
  lock(on) {
    this._locked = !!on;
  }
  get locked() {
    return this._locked;
  }

  // ---- last-used input device (drives prompt labels: "Space: Talk" vs "A: Talk") ----
  get device() {
    return this._device;
  }
  setDevice(d) {
    if (!d || d === this._device) return;
    this._device = d;
    for (const fn of [...this._deviceListeners]) {
      try { fn(d); } catch (err) { console.error('[input] onDevice handler threw', err); }
    }
  }
  /** Subscribe to last-used-device changes. Returns unsubscribe. */
  onDevice(fn) {
    this._deviceListeners.add(fn);
    return () => this._deviceListeners.delete(fn);
  }

  // ---- virtual source (touch overlay / tests / debug) ----
  setVirtual(action, down) {
    if (down) {
      if (!this._virtual.has(action)) {
        this._virtual.add(action);
        this._press(action, true);
      }
    } else {
      this._virtual.delete(action);
      this._repeat.delete(action);
    }
  }
  /** Analog virtual stick; values are clamped to a unit circle. */
  setVirtualAxis(x, y) {
    let vx = Number(x) || 0;
    let vy = Number(y) || 0;
    const len = Math.hypot(vx, vy);
    if (len > 1) {
      vx /= len;
      vy /= len;
    }
    this._vAxis = { x: vx, y: vy };
  }

  releaseAll() {
    this._keys.clear();
    this._pad.clear();
    this._padAxis = { x: 0, y: 0 };
    this._virtual.clear();
    this._vAxis = { x: 0, y: 0 };
    this._repeat.clear();
  }

  // ---- keyboard ----
  /** Resolve Esc / M / Tab by game mode. */
  resolveKey(key) {
    const field = this.modeProvider() === 'field';
    if (key === 'escape') return field ? 'menu' : 'cancel';
    if (key === 'm') return field ? 'map' : 'cancel';
    if (key === 'tab') return 'menu';
    return KEY_MAP[key] || null;
  }

  handleKeyDown(e) {
    const key = String(e.key || '').toLowerCase();
    const t = e.target;
    const typing = t && (t.isContentEditable || /^(input|textarea|select)$/i.test(t.tagName || ''));
    if (typing) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (PREVENT_KEYS.has(key) && e.preventDefault) e.preventDefault();
    this.setDevice('keyboard');
    if (e.repeat || this._keys.has(key)) return; // own repeat logic handles held directions
    const action = this.resolveKey(key);
    if (!action) return;
    if (this._locked) return;
    if (e.preventDefault && (key === 'escape' || key === 'backspace')) e.preventDefault();
    this._keys.set(key, action);
    this._press(action, true);
  }

  handleKeyUp(e) {
    const key = String(e.key || '').toLowerCase();
    const action = this._keys.get(key);
    this._keys.delete(key);
    if (action && !this._heldRaw(action)) this._repeat.delete(action);
  }

  // ---- gamepad + repeat; call at the start of every frame ----
  poll(now = nowMs()) {
    this._pollPad(now);
    if (this._locked) return;
    for (const a of DIRS) {
      if (this._heldRaw(a)) {
        const next = this._repeat.get(a);
        if (next !== undefined && now >= next) {
          this._repeat.set(a, now + REPEAT_RATE);
          this._emit(a);
        }
      } else this._repeat.delete(a);
    }
  }

  _pollPad(now) {
    let pads = null;
    try {
      pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : null;
    } catch (_) {
      pads = null;
    }
    const pad = pads && Array.from(pads).find((p) => p && p.connected);
    if (!pad) {
      if (this._pad.size || this._padAxis.x || this._padAxis.y) {
        this._pad.clear();
        this._padAxis = { x: 0, y: 0 };
      }
      return;
    }
    const b = (i) => !!(pad.buttons[i] && pad.buttons[i].pressed);
    const ax = pad.axes[0] || 0;
    const ay = pad.axes[1] || 0;
    const mag = Math.hypot(ax, ay);
    this._padAxis = mag > STICK_DEAD ? { x: ax, y: ay } : { x: 0, y: 0 };
    const want = new Set();
    if (b(12) || ay < -STICK_PRESS) want.add('up');
    if (b(13) || ay > STICK_PRESS) want.add('down');
    if (b(14) || ax < -STICK_PRESS) want.add('left');
    if (b(15) || ax > STICK_PRESS) want.add('right');
    if (b(0)) want.add('confirm');
    if (b(1)) want.add('cancel');
    if (b(2)) want.add('run');
    if (b(9)) want.add('menu');
    if (b(4)) want.add('tab_prev');
    if (b(5)) want.add('tab_next');
    for (const a of want) {
      if (!this._pad.has(a)) {
        this._pad.add(a);
        this.setDevice('gamepad');
        this._press(a, true, now);
      }
    }
    for (const a of [...this._pad]) {
      if (!want.has(a)) {
        this._pad.delete(a);
        if (!this._heldRaw(a)) this._repeat.delete(a);
      }
    }
  }

  // ---- internals ----
  _press(action, fresh, now = nowMs()) {
    if (this._locked) return;
    if (fresh && DIRS.includes(action)) this._repeat.set(action, now + REPEAT_DELAY);
    this._emit(action);
  }
  _emit(action) {
    let consumed = false;
    for (const fn of [...this._listeners]) {
      try {
        if (fn(action) === true) {
          consumed = true;
          break;
        }
      } catch (err) {
        console.error('[input] onPress handler threw', err);
      }
    }
    if (!consumed) this._pressed.add(action);
  }
}

export const Input = new InputController();
