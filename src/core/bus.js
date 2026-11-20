// Tiny event bus. OWNED BY THE LEAD.
// Well-known event names (payloads are plain objects):
//   'time:minute' {state}        'time:day' {state, from, to}      'time:season' {state}
//   'weather:changed' {kind}     'hearts:changed' {npc, from, to}  'flag:set' {name, value}
//   'item:gained' {item, qty}    'money:changed' {delta, total}    'toast' {text, icon?}
//   'sfx' {id}                   'music' {id, fadeMs}              'quest:changed' {id, state}
//   'event:started' {id}         'event:finished' {id}             'save:written' {slot}

export class Bus {
  constructor() {
    this._m = new Map();
  }
  on(evt, fn) {
    if (!this._m.has(evt)) this._m.set(evt, new Set());
    this._m.get(evt).add(fn);
    return () => this.off(evt, fn);
  }
  once(evt, fn) {
    const off = this.on(evt, (p) => {
      off();
      fn(p);
    });
    return off;
  }
  off(evt, fn) {
    const s = this._m.get(evt);
    if (s) s.delete(fn);
  }
  emit(evt, payload) {
    const s = this._m.get(evt);
    if (!s) return;
    for (const fn of [...s]) {
      try {
        fn(payload);
      } catch (e) {
        console.error(`[bus] handler for "${evt}" threw`, e);
      }
    }
  }
  clear() {
    this._m.clear();
  }
}

/** Shared app-wide bus. Modules may also create private Bus instances for tests. */
export const bus = new Bus();
