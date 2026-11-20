// Shared test helpers for the sim tests (not a test file itself).
import { createNewGame } from '../../src/sim/state.js';
import { Bus } from '../../src/core/bus.js';
import { createMemoryStorage } from '../../src/sim/save.js';
import { createHookRegistry } from '../../src/sim/clock.js';
import { absDayOf } from '../../src/sim/calendar.js';

/** Fresh state on a given date/minute with isolated bus, storage and hook registry. */
export function fresh({ seed = 1, year = 1, season = 'spring', day = 1, minute = 390 } = {}) {
  const state = createNewGame({ seed });
  state.time = { year, season, day, minute, absDay: absDayOf({ year, season, day }) };
  const bus = new Bus();
  const events = [];
  for (const e of ['time:minute', 'energy:changed', 'time:day', 'time:season', 'time:year', 'weather:changed', 'hearts:changed', 'money:changed', 'item:gained', 'gift:given', 'toast', 'save:written']) {
    bus.on(e, (p) => events.push([e, p]));
  }
  const storage = createMemoryStorage();
  const fallback = createMemoryStorage();
  const hooks = createHookRegistry();
  const opts = { bus, storage, fallback, hooks };
  return { state, bus, events, storage, fallback, hooks, opts };
}
export const named = (events, n) => events.filter(([e]) => e === n);
