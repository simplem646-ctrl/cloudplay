// Registers the activity/mini-game scenes with the scene registry. T9a's boot calls registerActivityScenes().
import { registerScene } from '../registry.js';
import { TrackSprint } from './track_sprint.js';
import { MusicRhythm } from './music_rhythm.js';
import { CafeServe } from './cafe_serve.js';
import { StarGazing, ShellHunt } from './ring_timing.js';
import { ShopScene } from './shop.js';
import { ClubPractice } from './activity_club.js';
import { JobCafe } from './activity_job.js';
import { RestScene, NapScene, JogScene } from './activity_rest.js';

export { TrackSprint, MusicRhythm, CafeServe, StarGazing, ShellHunt, ShopScene, ClubPractice, JobCafe, RestScene, NapScene, JogScene };
export * from './logic.js';

export function registerActivityScenes() {
  registerScene('minigame:track_sprint', (game, params) => new TrackSprint(game, params));
  registerScene('minigame:music_rhythm', (game, params) => new MusicRhythm(game, params));
  registerScene('minigame:cafe_serve', (game, params) => new CafeServe(game, params));
  registerScene('minigame:astronomy_stars', (game, params) => new StarGazing(game, params));
  registerScene('activity:shell_hunt', (game, params) => new ShellHunt(game, params));
  registerScene('shop', (game, params) => new ShopScene(game, params));
  registerScene('activity:club_practice', (game, params) => new ClubPractice(game, params));
  registerScene('activity:job_cafe', (game, params) => new JobCafe(game, params));
  registerScene('activity:rest', (game, params) => new RestScene(game, params));
  registerScene('activity:nap', (game, params) => new NapScene(game, params));
  registerScene('activity:jog', (game, params) => new JogScene(game, params));
}
