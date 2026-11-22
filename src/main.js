/**
 * Boot (ARCHITECTURE §10 frame order). Wires every module into `Game`, runs the loop, shows the title.
 * URL params: q=low|medium|high, autostart=<name> (skip the title), skipPrologue=1, fast=1 (instant fades/waits, for tests).
 */
import { Game } from './core/game.js';
import { Input } from './core/input.js';
import { loadSettings } from './core/state.js';
import { createLoop } from './core/loop.js';
import { installDebug } from './core/debug.js';
import * as world from './world/index.js';
import * as characters from './characters/index.js';
import * as ui from './ui/index.js';
import * as audio from './audio/index.js';
import * as portraits from './portraits/index.js';
import * as Systems from './systems/index.js';
import { Data } from './data/index.js';

const P = Game.params;
const el = (id) => document.getElementById(id);

/** Loading overlay (markup lives in index.html): progress 0..1, fade out when the title or the world is up. */
const loading = {
  node: el('boot-loading'),
  bar: el('boot-bar'),
  progress(f) { if (this.bar) this.bar.style.transform = `scaleX(${Math.max(0.06, Math.min(1, f))})`; },
  hide() {
    const n = this.node;
    if (!n) return;
    this.node = null;
    n.classList.add('bl-out');
    setTimeout(() => n.remove(), 800);
  },
};

async function boot() {
  const canvas = el('game-canvas');
  const root = el('ui-root');
  // let the loading overlay paint once before the heavy synchronous work starts
  await new Promise((r) => { requestAnimationFrame(() => r()); setTimeout(r, 60); });

  // 1. settings + quality (?q wins over the saved setting)
  Game.settings = loadSettings();
  const q = P.get('q');
  const quality = ['low', 'medium', 'high'].includes(q) ? q : Game.settings.quality || 'medium';
  Game.settings.quality = quality;

  // 2. every module slot BEFORE Systems.init() (the world-facing systems go live only when Game.world.loadArea exists)
  Game.data = Data;
  Game.world = world;
  Game.chars = characters;
  Game.ui = ui;
  Game.audio = audio;
  Game.portraits = portraits;
  Game.systems = Systems;

  // 3. input + audio (the audio context is created on the first key/pointer; music requested earlier starts then)
  Input.init(canvas);
  audio.init();
  const { master, music, sfx, ambience } = Game.settings;
  audio.setVolume({ master, music, sfx, ambience });
  // the title theme (requested now, it starts once the first key/pointer unlocks audio); in-game music takes over from the area director
  Game.bus.on('mode:change', ({ to }) => { if (to === 'title') audio.playMusic('title'); });
  const unlock = () => audio.unlock();
  window.addEventListener('pointerdown', unlock, { once: true });
  window.addEventListener('keydown', unlock, { once: true });

  // 4. engines
  await world.init({ canvas, quality, onProgress: (f) => loading.progress(f) });
  ui.init({ root });
  Systems.init();
  const LB = installDebug();
  if (P.get('fast') === '1') LB.skipFades(true);
  window.__game = { Game, Systems, LB, svc: Systems.svc, Data };
  Game.bus.on('ui:setting', ({ key, value }) => { if (key === 'quality') world.setQuality(value); });
  const resize = () => world.resize(window.innerWidth, window.innerHeight);
  window.addEventListener('resize', resize);
  resize();
  // portraits are drawn lazily too; warm them up in idle slices so the first dialogue does not hitch
  (window.requestIdleCallback || ((f) => setTimeout(f, 300)))(() => portraits.preload?.());

  // 5. frame loop (pauses itself while the tab is hidden)
  const auto = P.has('autostart');
  let inWorld = !auto; // autostart: ready once the first area is up; title: ready after the first frames
  let frames = 0;
  const loop = createLoop((dt) => {
    Input.poll();
    Systems.update(dt);
    world.update(dt);
    const s = Game.state;
    if (s) {
      const m = s.time.minutes;
      world.setEnvironment({ minutes: m, season: s.time.season, weather: s.weather.today, festival: Systems.svc.events?.festivalActive?.(m) ? Systems.svc.events.festivalToday().id : null });
    }
    ui.update(dt);
    world.render();
    Input.endFrame();
    frames++;
    if (frames > 2 && inWorld && !window.__ready) {
      window.__ready = true;
      loading.hide();
    }
  });
  loop.start();
  LB.register('fps', () => loop.fps);

  // 6. start: title (new/continue) or straight into a new game
  if (auto) {
    Game.bus.on('game:new', () => {
      if (P.get('skipPrologue') === '1') Game.state.flags.prologue_done = true;
    });
    Game.bus.once('area:enter', () => { inWorld = true; });
    await Systems.newGame({ name: P.get('autostart') || 'Kai' });
  } else {
    await Systems.start();
  }
}

boot().catch((err) => {
  console.error('[boot] failed', err);
  const msg = `Could not start the game: ${(err && err.message) || err}. WebGL is required; try a different browser or reload the page.`;
  if (loading.node) {
    loading.node.querySelector('.bl-msg').textContent = msg;
    loading.bar && (loading.bar.style.background = '#c0405a');
  } else {
    const root = el('ui-root');
    if (root) root.textContent = msg;
  }
});
