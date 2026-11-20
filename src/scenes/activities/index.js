// Registers the activity/mini-game scenes with the scene registry. T9a's boot calls registerActivityScenes().
import { registerScene } from '../registry.js';
import { TrackSprint } from './track_sprint.js';
import { MusicRhythm } from './music_rhythm.js';
import { CafeServe } from './cafe_serve.js';

export { TrackSprint, MusicRhythm, CafeServe };
export * from './logic.js';

export function registerActivityScenes() {
  registerScene('minigame:track_sprint', (game, params) => new TrackSprint(game, params));
  registerScene('minigame:music_rhythm', (game, params) => new MusicRhythm(game, params));
  registerScene('minigame:cafe_serve', (game, params) => new CafeServe(game, params));
}
