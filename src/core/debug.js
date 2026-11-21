/** window.LB debug API (ARCHITECTURE §3.6). Other modules add commands with LB.register(name, fn). */
import { Game } from './game.js';

/** Install window.LB (call lazily from main.js, never at import). Idempotent. */
export function installDebug() {
  if (typeof window === 'undefined') return null;
  if (window.LB) return window.LB;
  const commands = {};
  const LB = {
    game: Game,
    state: () => Game.state,
    mode: () => Game.mode,
    register(name, fn, doc) {
      commands[name] = doc || '';
      LB[name] = fn;
    },
    help() {
      const names = ['game', 'state()', 'mode()', 'register(name, fn)', 'help()', ...Object.keys(commands).map((n) => `${n}()`)];
      const text = `LB commands: ${names.join(', ')}`;
      console.log(text);
      return text;
    },
  };
  window.LB = LB;
  return LB;
}
