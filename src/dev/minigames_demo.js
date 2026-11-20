// Mini-game harness on the REAL engine + UI service. Build: node scripts/build.mjs --entry src/dev/minigames_demo.js --out dist/dev/minigames_demo.html
// Query: ?game=track_sprint|music_rhythm|cafe_serve  &live=1 (real time, play with the keyboard)  &seed=7  &difficulty=0.45
// window.__mg = { app, game, scene, step, tap, start, run, autoplay, result }  (deterministic stepping + a scripted autoplayer for tests)
import { createApp } from '../engine/index.js';
import { UICanvas } from '../ui/index.js';
import { audio } from '../audio/index.js';
import { registerActivityScenes } from '../scenes/activities/index.js';
import { openScene } from '../scenes/registry.js';

const q = new URLSearchParams(location.search);
const ui = new UICanvas();
const app = createApp({ container: document.getElementById('app'), ui, autoStart: q.has('live') });
app.game.audio = audio;
registerActivityScenes();
const id = q.get('game') || 'track_sprint';
let result = null;
openScene(app.game, `minigame:${id}`, { seed: Number(q.get('seed') || 7), difficulty: Number(q.get('difficulty') || 0.45), fitness: 40 }).then((r) => { result = r; });

const step = (n = 1) => app.step(n);
const tap = (a) => app.input.tap(a);
const scene = () => app.game.scenes.top;

let fi = 0;
function policy() {
  const s = scene();
  if (!s) return;
  if (s.mode === 'result') { if (s.t > 0.7) tap('confirm'); return; }
  if (s.mode !== 'play') return;
  if (id === 'track_sprint') { if (s.clock > 0.4 && fi % 5 === 0) tap(Math.floor(fi / 5) % 2 ? 'left' : 'right'); }
  else if (id === 'music_rhythm') { for (const n of s.chart) if (!n.hit && !n.missed && Math.abs(n.t - s.song) < 0.025) tap(['left', 'down', 'up', 'right'][n.lane]); }
  else if (id === 'cafe_serve' && fi % 14 === 0) {
    let best = -1;
    s.seats.forEach((c, k) => { if (c && (best < 0 || c.remaining < s.seats[best].remaining)) best = k; });
    if (best >= 0) tap(['left', 'down', 'up', 'right'][s.seats[best].item]);
  }
}
/** Run the autoplayer for `frames` frames (stops early once the scene has popped with a result). */
function run(frames) { for (let k = 0; k < frames && !result && scene(); k++) { fi++; policy(); step(1); } return { mode: scene() && scene().mode, result }; }
function start() { tap('confirm'); step(2); }
function autoplay(max = 8000) { start(); run(max); return result; }

window.__mg = { app, game: app.game, scene, step, tap, start, run, autoplay, result: () => result };
step(1);
