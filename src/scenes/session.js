// A "session" = one running game: the sim built on a state, plus the event system. New Game, Continue and in-game loads all go
// through startSession(); the overworld and menus read `game.sim` / `game.events` live, so swapping them is enough.
import { createSim } from '../sim/index.js';
import { createEventSystem } from '../sim/events_system.js';
import { createNewGame } from '../sim/state.js';
import { startDayTracking, applySettings } from './menus/index.js';

/** Build sim + events for `state` (a fresh game when omitted) and install them on `game`. Resolves once schedules / tastes are loaded. */
export async function startSession(game, state = null) {
  const st = state || createNewGame();
  const sim = createSim(st, { bus: game.bus });
  game.sim = sim;
  game.events = createEventSystem(sim);
  await sim.ready;
  // the sleep card diffs the day: re-arm the tracker for the new state
  if (game.menus) game.menus.current = null;
  game.menus = null;
  startDayTracking(game);
  applySettings(game);
  return sim;
}

/** Placeholder session for the title screen (menus expect `game.sim` to exist). */
export function createTitleSession(game) {
  const sim = createSim(createNewGame({ seed: 1 }), { bus: game.bus });
  game.sim = sim;
  game.events = createEventSystem(sim);
  return sim;
}
