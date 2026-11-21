// Registers the scenes and directors this task owns ('title', 'overworld', forced_sleep, energy_collapse).
import { registerScene } from './registry.js';
import { TitleScene } from './title.js';
import { OverworldScene } from './overworld.js';
import { registerCoreDirectors } from './directors.js';

export { TitleScene, OverworldScene, registerCoreDirectors };

export function registerCoreScenes() {
  registerScene('title', (game, params) => new TitleScene(game, params));
  registerScene('overworld', (game, params) => new OverworldScene(game, params));
  registerCoreDirectors();
}
