// Registers the out-of-world screens with the scene registry. Boot calls registerMenuScenes() once.
// Also export startDayTracking(game) (call at boot and after loading) so the sleep card can diff the day.
import { registerScene } from '../registry.js';
import { PauseScene, PAUSE_TABS } from './pause.js';
import { SleepScene, startDayTracking } from './sleep.js';
import { SaveMenu, LoadMenu } from './saves.js';
import { SettingsScene } from './settings.js';
import { EndingScene } from './ending.js';
import { CreditsScene } from './credits.js';
import { applySettings } from './common.js';

export { PauseScene, SleepScene, SaveMenu, LoadMenu, SettingsScene, EndingScene, CreditsScene, startDayTracking, applySettings };
export * from './data.js';

export function registerMenuScenes() {
  registerScene('pause', (game, params) => new PauseScene(game, params));
  for (const [id] of PAUSE_TABS) if (id !== 'system') registerScene(id, (game, params) => new PauseScene(game, { ...params, only: id }));
  registerScene('sleep', (game, params) => new SleepScene(game, params));
  registerScene('save_menu', (game, params) => new SaveMenu(game, params));
  registerScene('load_menu', (game, params) => new LoadMenu(game, params));
  registerScene('settings', (game, params) => new SettingsScene(game, params));
  registerScene('ending', (game, params) => new EndingScene(game, params));
  registerScene('credits', (game, params) => new CreditsScene(game, params));
}
