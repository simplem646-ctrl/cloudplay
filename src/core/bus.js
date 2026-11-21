/**
 * Tiny synchronous event bus. Listener errors are caught and logged so one
 * bad subscriber cannot break the emitter.
 */
export class EventBus {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this._h = new Map();
  }

  /** Subscribe. Returns an unsubscribe function. */
  on(name, fn) {
    let set = this._h.get(name);
    if (!set) this._h.set(name, (set = new Set()));
    set.add(fn);
    return () => this.off(name, fn);
  }

  /** Subscribe for a single emit. Returns an unsubscribe function. */
  once(name, fn) {
    const off = this.on(name, (payload) => {
      off();
      fn(payload);
    });
    return off;
  }

  off(name, fn) {
    const set = this._h.get(name);
    if (set) {
      set.delete(fn);
      if (!set.size) this._h.delete(name);
    }
  }

  /** Emit synchronously to every listener (snapshot, so handlers may unsubscribe). */
  emit(name, payload) {
    const set = this._h.get(name);
    if (!set) return;
    for (const fn of [...set]) {
      try {
        fn(payload);
      } catch (err) {
        console.error(`[bus] handler for "${name}" threw`, err);
      }
    }
  }

  listenerCount(name) {
    const set = this._h.get(name);
    return set ? set.size : 0;
  }

  clear() {
    this._h.clear();
  }
}
