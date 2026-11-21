/** Boot (ARCHITECTURE §10 frame order). Lead wires real audio/portraits here later by importing them. */
import { Game } from './core/game.js';
import { Input } from './core/input.js';
import { loadSettings } from './core/state.js';
import { createLoop } from './core/loop.js';
import { installDebug } from './core/debug.js';
import * as world from './world/index.js';
import * as characters from './characters/index.js';
import * as ui from './ui/index.js';
import * as systems from './systems/index.js';
import { Data } from './data/index.js';

async function boot() {
  const canvas = document.getElementById('game-canvas');
  const root = document.getElementById('ui-root');
  const q = Game.params.get('q');

  Game.settings = loadSettings();
  const quality = ['low', 'medium', 'high'].includes(q) ? q : Game.settings.quality || 'medium';
  Game.settings.quality = quality;

  Game.data = Data;
  Game.world = world;
  Game.chars = characters;
  Game.ui = ui;
  Game.systems = systems;

  Input.init(canvas);
  Game.audio.init();
  const unlock = () => Game.audio.unlock();
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  await Game.world.init({ canvas, quality });
  Game.ui.init({ root });
  Game.systems.init();
  Game.systems.start();
  window.addEventListener('resize', () => Game.world.resize(window.innerWidth, window.innerHeight));
  Game.world.resize(window.innerWidth, window.innerHeight);

  const loop = createLoop((dt) => {
    Input.poll();
    Game.systems.update(dt);
    Game.world.update(dt);
    const s = Game.state;
    if (s) Game.world.setEnvironment({ minutes: s.time.minutes, season: s.time.season, weather: s.weather.today });
    Game.ui.update(dt);
    Game.world.render();
    Input.endFrame();
    if (!window.__ready) window.__ready = true;
  });
  loop.start();

  installDebug();
  window.LB.register('fps', () => loop.fps);
}

boot().catch((err) => {
  console.error('[boot] failed', err);
  const root = document.getElementById('ui-root');
  if (root) root.textContent = `Boot failed: ${err && err.message}`;
});
