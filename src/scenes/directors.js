// Overworld directors (src/scenes/registry.js): per-in-game-minute policies the overworld consults while idle.
//   forced_sleep    clock reached 02:00 -> collapse into bed (new day, 09:00 wake, Aunt Roz scolds)
//   energy_collapse energy 0 -> the clinic / school nurse patches Theo up (clinic costs money), or home when the map is missing
// The school-day director (class / exam / report card / remedial) is registered by registerAcademics().
import { DAY_END } from '../core/constants.js';
import { registerDirector } from './registry.js';

export function forcedSleepDirector(game, ctx) {
  if ((ctx.minute ?? 0) < DAY_END) return null;
  return { call: () => game.overworld.forcedSleep() };
}

export function energyCollapseDirector(game, ctx) {
  const st = ctx.state || (game.sim && game.sim.state);
  if (!st || st.player.energy > 0) return null;
  return { call: () => game.overworld.energyCollapse() };
}

export function registerCoreDirectors() {
  registerDirector('forced_sleep', forcedSleepDirector, 5);
  registerDirector('energy_collapse', energyCollapseDirector, 8);
}
