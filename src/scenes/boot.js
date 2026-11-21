// Boot sequence: error overlay -> engine app -> services (ui, audio, art) -> scene registrations (ours + every generated registrar)
// -> debug API -> title. `bootGame()` never leaves a blank page: any failure lands in the error overlay.
import { createApp } from '../engine/index.js';
import { UICanvas } from '../ui/index.js';
import { audio } from '../audio/index.js';
import * as art from '../art/index.js';
import { REGISTRARS } from '../_generated/registrars.js';
import { applySettings } from './menus/index.js';
import { registerCoreScenes } from './index.js';
import { createScene } from './registry.js';
import { createTitleSession } from './session.js';
import { createDebugApi } from './debug.js';
import { GAME_TITLE } from '../core/constants.js';

/** Dismissible DOM overlay with the error text (and a copy of the last few). */
export function installErrorOverlay() {
  const errors = [];
  let box = null;
  const show = (title, err) => {
    const msg = err && (err.stack || err.message) ? String(err.stack || err.message) : String(err);
    errors.push(`${title}: ${msg}`);
    console.error(`[${title}]`, err);
    if (typeof document === 'undefined') return;
    if (!box) {
      box = document.createElement('div');
      box.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;max-height:45%;overflow:auto;z-index:99999;background:rgba(40,12,20,.94);color:#ffd8d0;font:12px/1.35 ui-monospace,Menlo,Consolas,monospace;padding:8px 10px;border:1px solid #e8645a;border-radius:4px;white-space:pre-wrap;user-select:text';
      const btn = document.createElement('button');
      btn.textContent = 'dismiss';
      btn.style.cssText = 'float:right;margin-left:8px;font:inherit';
      btn.onclick = () => { box.remove(); box = null; };
      box.appendChild(btn);
      box.appendChild(document.createElement('pre')).style.margin = '0';
      document.body.appendChild(box);
    }
    box.querySelector('pre').textContent = errors.slice(-3).join('\n\n');
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('error', (e) => show('error', e.error || e.message));
    window.addEventListener('unhandledrejection', (e) => show('unhandled rejection', e.reason));
  }
  return { show, errors };
}

export function bootGame({ container } = {}) {
  const overlay = installErrorOverlay();
  try {
    const host = container || document.getElementById('app');
    const ui = new UICanvas();
    const app = createApp({ container: host, ui });
    const game = app.game;
    game.app = app;
    game.audio = audio;
    game.art = art;
    game.errors = overlay.errors;
    ui.configure({ drawIcon: art.drawIcon, getPortraitSheet: (who) => art.getPortraitSheet(who), sfx: (n) => { try { audio.sfx(n); } catch { /* optional */ } } });
    try { game.world.setIconAtlas(art.getIconAtlas()); } catch (e) { console.warn('[boot] icon atlas failed', e); }
    createTitleSession(game); // menus expect game.sim before a game exists
    applySettings(game);

    // scenes: ours first, then every task's registration entry point that exists in this tree
    registerCoreScenes();
    for (const r of REGISTRARS) {
      try { r.fn(); } catch (e) { console.error(`[boot] registrar "${r.label}" (${r.name}) failed`, e); }
    }
    createDebugApi(game);

    // audio needs a user gesture; the first key / click / touch unlocks it and acts as "Press Start"
    const unlock = () => {
      try { audio.init(); } catch (e) { console.warn('[boot] audio.init failed', e); }
      game.titleGesture = true;
    };
    for (const ev of ['keydown', 'pointerdown', 'touchstart']) window.addEventListener(ev, unlock, { once: true, capture: true });

    document.title = GAME_TITLE;
    game.scenes.push(createScene('title', game, {}), {});
    return game;
  } catch (e) {
    overlay.show('boot failed', e);
    const boot = document.getElementById('boot');
    if (boot) boot.textContent = 'Something went wrong while starting. See the message below.';
    throw e;
  }
}
