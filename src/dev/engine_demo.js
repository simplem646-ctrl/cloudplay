// Engine dev harness. Build: node scripts/build.mjs --entry src/dev/engine_demo.js --out dist/dev/engine_demo.html
// Generates its own mock tileset/sprites (src/engine/mock/assets.js). Press H in the page for the key list.
// Scripted access: window.__engineDemo (see the bottom of this file).
import {
  createApp, Actor, Scene, moveActor, findPath, PathWalker, GRADING_PRESETS, gradingAt, nearestWalkable,
} from '../engine/index.js';
import { mockTileset, mockMap, mockCharSheet, mockCatSheet, mockIconAtlas, MOCK_EMOTES } from '../engine/mock/assets.js';
import { VIEW_W, VIEW_H, TILE } from '../core/constants.js';

// ---- tiny 3x5 bitmap font for the on-screen status (the real UI font arrives with T2) -----------
const G = {
  A: [2, 5, 7, 5, 5], B: [6, 5, 6, 5, 6], C: [3, 4, 4, 4, 3], D: [6, 5, 5, 5, 6], E: [7, 4, 6, 4, 7], F: [7, 4, 6, 4, 4], G: [3, 4, 5, 5, 3],
  H: [5, 5, 7, 5, 5], I: [7, 2, 2, 2, 7], J: [1, 1, 1, 5, 2], K: [5, 5, 6, 5, 5], L: [4, 4, 4, 4, 7], M: [5, 7, 7, 5, 5], N: [6, 5, 5, 5, 5],
  O: [2, 5, 5, 5, 2], P: [6, 5, 6, 4, 4], Q: [2, 5, 5, 6, 3], R: [6, 5, 6, 5, 5], S: [3, 4, 2, 1, 6], T: [7, 2, 2, 2, 2], U: [5, 5, 5, 5, 7],
  V: [5, 5, 5, 5, 2], W: [5, 5, 7, 7, 5], X: [5, 5, 2, 5, 5], Y: [5, 5, 2, 2, 2], Z: [7, 1, 2, 4, 7],
  0: [7, 5, 5, 5, 7], 1: [2, 6, 2, 2, 7], 2: [6, 1, 2, 4, 7], 3: [6, 1, 2, 1, 6], 4: [5, 5, 7, 1, 1], 5: [7, 4, 6, 1, 6], 6: [3, 4, 7, 5, 7],
  7: [7, 1, 2, 2, 2], 8: [7, 5, 7, 5, 7], 9: [7, 5, 7, 1, 6], ':': [0, 2, 0, 2, 0], '.': [0, 0, 0, 0, 2], '-': [0, 0, 7, 0, 0], '/': [1, 1, 2, 4, 4],
  '?': [6, 1, 2, 0, 2], ',': [0, 0, 0, 2, 4], '+': [0, 2, 7, 2, 0], ' ': [0, 0, 0, 0, 0],
};
function text(ctx, s, x, y, color = '#f6ecd2') {
  const str = s.toUpperCase();
  for (let i = 0; i < str.length; i++) {
    const g = G[str[i]] || G['?'];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) {
      if (g[r] & (4 >> c)) {
        ctx.fillStyle = '#1d2340';
        ctx.fillRect(x + i * 4 + c + 1, y + r + 1, 1, 1);
      }
    }
  }
  ctx.fillStyle = color;
  for (let i = 0; i < str.length; i++) {
    const g = G[str[i]] || G['?'];
    for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (g[r] & (4 >> c)) ctx.fillRect(x + i * 4 + c, y + r, 1, 1);
  }
}

const HELP = [
  'ARROWS/WASD MOVE  SHIFT RUN  Z EMOTE+FACE',
  '1-4 SEASON  C CLEAR R RAIN T STORM N SNOW',
  'P PETALS  L LEAVES  F FIREFLIES',
  'D DAY  U SUNSET  G NIGHT  I INDOOR  B LANTERN',
  'Y TIMELAPSE  O FADE  X FLASH  K SHAKE',
  'E EMOTE  V DEBUG  J NPC WALK  Q CAM SMOOTH',
  'M RELOAD MAP  H HIDE THIS',
];

const container = document.getElementById('app');
const forceTouch = /[?&]touch=1/.test(location.search);
const app = createApp({ container, touch: forceTouch ? true : 'auto' });
const { world, renderer, input } = app;

// UI layer (320x240 canvas composited on top)
const uiCanvas = document.createElement('canvas');
uiCanvas.width = VIEW_W;
uiCanvas.height = VIEW_H;
const uctx = uiCanvas.getContext('2d');
const state = { season: 'spring', weather: 'clear', time: 'day', helpOn: false, timelapse: false, clock: 8 * 60, debug: false, smooth: false, lights: false };
const ui = {
  canvas: uiCanvas,
  beginFrame() { uctx.clearRect(0, 0, VIEW_W, VIEW_H); },
  endFrame() {
    text(uctx, `${state.season} ${state.weather} ${state.time}${state.timelapse ? ` ${hhmm(state.clock)}` : ''}`, 4, 4);
    text(uctx, `${Math.round(renderer.perf.fps)} FPS  SCALE ${renderer.layout.scale.toFixed(2)}`, 4, 11, '#8fd0f0');
    if (state.helpOn) {
      uctx.fillStyle = 'rgba(29,35,64,0.82)';
      uctx.fillRect(2, VIEW_H - 52, 214, 50);
      HELP.forEach((l, i) => text(uctx, l, 5, VIEW_H - 49 + i * 7));
    }
  },
};
const hhmm = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
app.setUI(ui);

// ---- world content ---------------------------------------------------------------------------------
const map = mockMap();
world.setIconAtlas(mockIconAtlas());
world.loadMap(map, mockTileset('spring'), { season: 'spring' });

const player = new Actor({ id: 'theo', sheet: mockCharSheet(), tx: map.anchors.entrance.x, ty: map.anchors.entrance.y });
const npc = new Actor({ id: 'mari', sheet: mockCharSheet({ hair: '#e8b04a', shirt: '#e0556a', pants: '#7a4f2e', long: true }), tx: 24, ty: 17, dir: 'left' });
const npc2 = new Actor({ id: 'ken', sheet: mockCharSheet({ hair: '#2a2a3a', shirt: '#5aa860', pants: '#3b3f66', skin: '#e8b88c' }), tx: 16, ty: 3 + 6, dir: 'down' });
const cat = new Actor({ id: 'cat', kind: 'animal', sheet: mockCatSheet(), tx: map.anchors.cat_spot.x, ty: map.anchors.cat_spot.y, shadowSize: { w: 10, h: 5 } });
const sleeper = new Actor({ id: 'sleepy', sheet: mockCharSheet({ hair: '#8a5fd0', shirt: '#f2b84b' }), tx: 5, ty: 12, dir: 'down' });
sleeper.setPose('sit').setDir('right');
cat.setPose('sit');
for (const a of [player, npc, npc2, cat, sleeper]) world.addActor(a);
world.cam.follow(player);
world.cam.snapTo(player.x, player.y - 10);

for (const l of map.lights) world.addLight({ ...l, intensity: 0 });
state.lights = false;
let lightTarget = 0;

// ---- NPC pathing ------------------------------------------------------------------------------------
let walker = null;
const destinations = [[24, 17], [9, 19], [31, 20], [17, 12], [6, 12], [12, 27], [36, 20]];
let destIdx = 0;
function npcWalk(tx, ty) {
  if (tx === undefined) {
    [tx, ty] = destinations[destIdx++ % destinations.length];
  }
  const goal = nearestWalkable(map.collision, map.width, map.height, tx, ty);
  const path = findPath(map.collision, map.width, map.height, npc.tx, npc.ty, goal.x, goal.y);
  walker = path ? new PathWalker(npc, path, { blockers: [player, npc2, cat, sleeper] }) : null;
  return path;
}

// ---- scene ---------------------------------------------------------------------------------------------
let emoteIdx = 0;
class DemoScene extends Scene {
  enter() {}
  update(dt, inp) {
    const a = inp.axis();
    moveActor(player, a.x, a.y, dt, map, { run: inp.down('run'), blockers: [npc, npc2, cat, sleeper] });
    if (inp.pressed('confirm')) {
      // face + emote whoever is in front, else emote ourselves
      const near = [npc, npc2, cat].find((o) => Math.hypot(o.x - player.x, o.y - player.y) < 26);
      if (near) {
        near.faceToward(player);
        near.emote(MOCK_EMOTES[emoteIdx++ % MOCK_EMOTES.length], 2);
      }
      player.emote('exclaim', 1.2);
    }
    if (walker && walker.update(dt, map)) {
      walker = null;
      npc.emote('note', 1.5);
    }
    // lights ease in/out (night / lantern)
    for (const l of world.lights) l.intensity += (lightTarget - l.intensity) * Math.min(1, dt * 2.5);
    if (state.timelapse) {
      state.clock = (state.clock + dt * 90) % 1440; // 1.5 game minutes per real second... fast on purpose
      renderer.setGrading(gradingAt(state.clock));
      lightTarget = state.clock < 6 * 60 + 30 || state.clock > 18 * 60 + 30 ? 1 : 0;
    }
    // cat naps when the player is far away
    const far = Math.hypot(cat.x - player.x, cat.y - player.y) > 70;
    cat.setPose(far ? 'loaf' : 'sit');
  }
}
app.scenes.push(new DemoScene(app.game));

// ---- controls ---------------------------------------------------------------------------------------------
async function setSeason(s) {
  state.season = s;
  world.setSeason(s, mockTileset(s));
}
function setWeather(kind, intensity = 1) {
  state.weather = kind === 'none' ? 'clear' : kind;
  if (kind === 'clear' || kind === 'none') world.weather.clear(0.8);
  else if (kind === 'fireflies') world.weather.set('fireflies', intensity);
  else world.setWeather(kind, intensity);
}
function setTime(name) {
  state.time = name;
  state.timelapse = false;
  const g = name === 'indoor' ? 'indoor' : name;
  renderer.tweenGrading(GRADING_PRESETS[g] ? g : 'day', 1200);
  lightTarget = name === 'night' || name === 'lantern' ? 1 : 0;
}
function setDebug(v) {
  state.debug = v === undefined ? !state.debug : v;
  world.setDebug(state.debug);
}
function reloadMap(n = 1) {
  const before = renderer.memory;
  const sBefore = world.stats();
  for (let i = 0; i < n; i++) world.loadMap(mockMap(), mockTileset(state.season), { season: state.season });
  return { before, after: renderer.memory, worldBefore: sBefore, worldAfter: world.stats() };
}
async function fadeCycle() {
  await renderer.fade.out(400);
  await renderer.fade.in(400);
}
const KEYS = {
  Digit1: () => setSeason('spring'), Digit2: () => setSeason('summer'), Digit3: () => setSeason('autumn'), Digit4: () => setSeason('winter'),
  KeyC: () => setWeather('clear'), KeyR: () => setWeather('rain'), KeyT: () => setWeather('storm'), KeyN: () => setWeather('snow'),
  KeyP: () => setWeather('petals'), KeyL: () => setWeather('leaves'), KeyF: () => setWeather('fireflies'),
  KeyD: () => setTime('day'), KeyU: () => setTime('sunset'), KeyG: () => setTime('night'), KeyI: () => setTime('indoor'), KeyB: () => setTime('lantern'),
  KeyY: () => { state.timelapse = !state.timelapse; if (!state.timelapse) setTime('day'); },
  KeyO: () => fadeCycle(), KeyX: () => renderer.flash('#ffffff', 0.9, 260), KeyK: () => world.cam.shake(4, 400),
  KeyE: () => player.emote(MOCK_EMOTES[emoteIdx++ % MOCK_EMOTES.length], 2.2),
  KeyV: () => setDebug(), KeyJ: () => npcWalk(), KeyQ: () => { state.smooth = !state.smooth; world.cam.smooth = state.smooth ? 6 : 0; },
  KeyM: () => reloadMap(1), KeyH: () => { state.helpOn = !state.helpOn; },
};
window.addEventListener('keydown', (e) => {
  if (e.repeat || e.ctrlKey || e.metaKey) return;
  const f = KEYS[e.code];
  if (f) f();
});
// Z is bound to `confirm` by the engine input; Tab/M also map to `menu` there, M here reloads the map.

// ---- scripted access ----------------------------------------------------------------------------------------
window.__engineDemo = {
  app, world, renderer, input, map, player, npc, npc2, cat, sleeper, state,
  setSeason, setWeather, setTime, setDebug, reloadMap, npcWalk, fadeCycle,
  help(on = true) { state.helpOn = on; },
  teleport(tx, ty, dir) {
    player.setTile(tx, ty);
    if (dir) player.setDir(dir);
    world.cam.snapTo(player.x, player.y - 10);
  },
  /** Pause the rAF loop and advance n fixed steps (deterministic screenshots). */
  freeze(n = 1) { app.stop(); app.step(n); },
  step: (n = 1) => app.step(n),
  stats() { return { memory: renderer.memory, world: world.stats(), fps: renderer.perf.fps, quality: app.quality, layout: renderer.layout }; },
  png: () => renderer.toDataURL(),
  KEYS, gradingAt, TILE,
};
