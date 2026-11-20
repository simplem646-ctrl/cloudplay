// createApp: builds renderer + world + input + scenes + the fixed-step loop and returns an object
// later code extends (app.game is the service bag every Scene receives).
//
//   const app = createApp({ container: document.getElementById('app') });
//   Object.assign(app.game, { ui, audio, art, sim });       // the integration task adds its services
//   app.game.scenes.push(new MyScene(app.game));
//
// Loop: fixed 1/60 s updates (dt clamped, max 6 catch-up steps), one render per animation frame,
// paused while the tab is hidden. Per step: input.update -> scenes.update -> world.update -> renderer.update.
import { bus } from '../core/bus.js';
import { Renderer } from './renderer.js';
import { WorldView } from './worldview.js';
import { Input } from './input.js';
import { SceneManager } from './scenes.js';

export const FIXED_DT = 1 / 60;

export function createApp({ container, ui = null, extra = {}, touch = 'auto', autoStart = true, expose = true, fpsGuard = true } = {}) {
  container = container || document.getElementById('app');
  const renderer = new Renderer({ container });
  const world = new WorldView();
  const input = new Input().attach(window);
  if (touch !== false) input.createTouchOverlay(container, { force: touch === true });

  const game = { renderer, world, input, ui, audio: null, art: null, sim: null, bus, scenes: null, debug: {}, paused: false, ...extra };
  game.scenes = new SceneManager(game);

  // lightning: flash the screen + tell the rest of the game (audio can play thunder)
  world.weather.onLightning = () => {
    renderer.flash('#e6efff', 0.7, 260);
    bus.emit('weather:lightning', {});
  };

  const app = {
    game, renderer, world, input,
    scenes: game.scenes,
    time: 0,
    running: false,
    /** Frame-time guard result: 'high' | 'low' (low halves weather particle counts). */
    quality: 'high',
    hooks: { beforeUpdate: [], afterUpdate: [] },
    get paused() { return game.paused; },
    start, stop, pause, resume, step, destroy, setUI,
  };

  function setUI(newUI) {
    game.ui = newUI;
    if (newUI && newUI.canvas) renderer.setUICanvas(newUI.canvas);
  }
  if (ui) setUI(ui);

  function tick(dt) {
    input.update();
    for (const f of app.hooks.beforeUpdate) f(dt);
    game.scenes.update(dt);
    world.update(dt);
    renderer.update(dt);
    for (const f of app.hooks.afterUpdate) f(dt);
    app.time += dt;
  }

  function draw() {
    const u = game.ui;
    if (u && u.beginFrame) u.beginFrame();
    game.scenes.draw();
    if (u && u.endFrame) u.endFrame();
    if (u && u.canvas) {
      if (!renderer.uiCanvas) renderer.setUICanvas(u.canvas);
      if (u.dirty !== false) renderer.markUIDirty();
    }
    renderer.render(world);
  }

  let raf = 0;
  let last = 0;
  let acc = 0;
  let slowT = 0;
  let fastT = 0;
  const frame = (ts) => {
    raf = requestAnimationFrame(frame);
    const raw = (ts - last) / 1000;
    last = ts;
    if (!game.paused) {
      acc += Math.min(raw, 0.1);
      let n = 0;
      while (acc >= FIXED_DT && n < 6) {
        tick(FIXED_DT);
        acc -= FIXED_DT;
        n++;
      }
      if (n === 6) acc = 0;
    }
    draw();
    if (fpsGuard && raw > 0 && raw < 1) {
      // sustained slow frames -> cheaper weather; sustained good frames -> back to full
      if (raw > 1 / 28) { slowT += raw; fastT = 0; } else if (raw < 1 / 50) { fastT += raw; slowT = Math.max(0, slowT - raw); } else slowT = Math.max(0, slowT - raw * 0.5);
      if (app.quality === 'high' && slowT > 2) { app.quality = 'low'; world.setQuality('low'); fastT = 0; }
      else if (app.quality === 'low' && fastT > 8) { app.quality = 'high'; world.setQuality('high'); slowT = 0; }
    }
  };

  function start() {
    if (app.running) return;
    app.running = true;
    last = performance.now();
    acc = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    app.running = false;
    cancelAnimationFrame(raf);
  }
  function pause() {
    game.paused = true;
  }
  function resume() {
    game.paused = false;
    last = performance.now();
    acc = 0;
  }
  /** Advance n fixed steps manually (tests / scripted screenshots) and draw once. Works while stopped. */
  function step(n = 1, dt = FIXED_DT) {
    for (let i = 0; i < n; i++) tick(dt);
    draw();
  }

  const onVis = () => {
    if (document.hidden) pause();
    else if (!game.userPaused) resume();
  };
  document.addEventListener('visibilitychange', onVis);

  function destroy() {
    stop();
    document.removeEventListener('visibilitychange', onVis);
    input.detach();
    world.dispose();
    renderer.dispose();
    if (expose && window.__game === game) delete window.__game;
  }

  if (expose && typeof window !== 'undefined') window.__game = game;
  if (autoStart) start();
  return app;
}
