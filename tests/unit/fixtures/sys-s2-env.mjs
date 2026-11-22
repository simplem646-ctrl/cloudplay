/**
 * Test environment for the world-facing systems (S2): REAL Data + REAL headless AreaRuntimes (src/world/headless.js),
 * fake characters (rig stubs), fake world calls and a scripted fake UI. No WebGL, no DOM.
 */
import { Game } from '../../../src/core/game.js';
import { Input } from '../../../src/core/input.js';
import { defaultState, _resetStorage } from '../../../src/core/state.js';
import { Data } from '../../../src/data/index.js';
import * as Sys from '../../../src/systems/index.js';
import { opts, _resetWarnings } from '../../../src/systems/kit.js';
import { buildHeadless } from '../../../src/world/headless.js';

export { Game, Sys, Data, Input };
export const { svc } = Sys;

const fakeStorage = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), clear: () => m.clear() };
};

/** Rig stub implementing the Rig API; records what was asked of it. */
export function fakeRig(id) {
  const g = { position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } }, visible: true };
  const rig = {
    id, group: g, calls: [], facing: 's', speed: 0, held: null, expr: 'neutral', playing: null, season: 'spring', disposed: false,
    setFacing(d, o) { rig.facing = d; rig.calls.push(['setFacing', d]); },
    getFacing() { return typeof rig.facing === 'string' ? rig.facing : 's'; },
    faceTowards(x, z) {
      const dx = x - g.position.x, dz = z - g.position.z;
      rig.facing = Math.abs(dx) > Math.abs(dz) ? (dx > 0 ? 'e' : 'w') : dz > 0 ? 's' : 'n';
      rig.calls.push(['faceTowards', x, z]);
    },
    locomote(s) { rig.speed = s; },
    play(name, o = {}) { rig.playing = name; rig.calls.push(['play', name, o]); return rig.quickAnims ? Promise.resolve() : (o.loop === false ? new Promise((r) => setTimeout(r, 1)) : Promise.resolve()); },
    stop() { rig.playing = null; },
    setExpression(n) { rig.expr = n; },
    emote(n) { rig.calls.push(['emote', n]); },
    setHeld(p) { rig.held = p; },
    setVisible(b) { g.visible = !!b; },
    setSeason(s) { rig.season = s; },
    update() {},
    dispose() { rig.disposed = true; },
  };
  return rig;
}

/** Install fake chars + world + ui + audio around the REAL data/areas. Returns handles for assertions. */
export function boot(o = {}) {
  globalThis.localStorage = fakeStorage();
  _resetStorage();
  _resetWarnings();
  Game.bus.clear();
  Game.data = Data;
  Game.settings = { timeScale: 'normal', textSpeed: 'fast', quality: 'low' };
  const env = { rigs: [], critters: [], entities: new Set(), world: {}, toasts: [], says: [], narrates: [], asks: [], askQueue: [], sfx: [], music: [], effects: [], fades: [], lampStates: {}, decor: null, camera: [], prompts: [], areaLoads: [] };
  Game.chars = {
    preload() { return Promise.resolve(); },
    createCharacter(id) { const r = fakeRig(id); r.quickAnims = !!o.quickAnims; env.rigs.push(r); return r; },
    createCritter(kind) {
      const c = { kind, group: { position: { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; } } }, setBounds() {}, update() {}, dispose() {} };
      env.critters.push(c);
      return c;
    },
  };
  Game.world = {
    async loadArea(id, op) { env.areaLoads.push([id, op?.spawn]); const rt = buildHeadless(id).runtime; env.area = rt; return rt; },
    addEntity(obj) { env.entities.add(obj); },
    removeEntity(obj) { env.entities.delete(obj); },
    setLampStates(m) { Object.assign(env.lampStates, m); },
    setDecor(d) { env.decor = d; (env.decorLog ||= []).push(d); },
    setDoorOpen(id, v) { (env.doors ||= []).push([id, v]); },
    setHighlight(id) { env.highlight = id; },
    playEffect(n, p) { env.effects.push([n, p]); },
    setCamera(c) { env.camera.push(c); env.cam = c; },
    snapCamera(c) { env.snap = c; },
    getArea: () => env.area || null,
  };
  Game.ui = {
    toast(t, op) { env.toasts.push(t); },
    banner: async () => {}, fade: async (a, ms) => { env.fades.push([a, ms]); }, confirm: async () => true, pickItem: async () => null,
    setPrompt(t) { env.prompts.push(t); env.prompt = t; }, hudVisible() {}, letterbox() {}, daySummary: async () => {},
    dialogue: {
      say: async (x) => { env.says.push([x.speaker, x.text]); },
      narrate: async (t) => { env.narrates.push(t); },
      ask: async (x) => { env.asks.push(x); return env.askQueue.length ? env.askQueue.shift() : 0; },
      close() {},
    },
    menu: { open: async () => {}, close() {} },
    shop: { open: async () => {} }, notes: { read: async () => {} },
    minigames: { fishing: async () => ({ caught: true, perfect: false }), kneading: async () => ({ score: 0.8 }) },
  };
  Game.audio = {
    playSfx(id) { env.sfx.push(id); env.onSfx?.(id); }, playMusic(t) { env.music.push(t); }, stopMusic() {}, setAmbience(a) { env.ambience = a; },
    footstep(s, op) { env.sfx.push(`step_${s}`); }, setVolume() {},
  };
  Game.state = defaultState({ name: 'Kai' });
  Game.state.flags.prologue_done = true;
  Game.mode = 'field';
  opts.skipFades = true;
  opts.faded = false;
  Sys.init();
  Sys.svc.weather.initState();
  return env;
}

/** Build a fresh state with the player standing in `area` at an anchor, field mode, at game time `minutes`. */
export async function startIn(area, anchor, { minutes = 600, season, day, weather } = {}) {
  const st = Game.state;
  if (season !== undefined || day !== undefined || minutes !== undefined) svc.clock.set({ season, day, minutes });
  if (weather) st.weather.today = weather;
  Game.mode = 'field';
  await svc.entities.enterArea(area, anchor, { fade: false });
  return st;
}

/** Drive the per-frame services for `seconds` of game-real time at 20 fps. */
export function frames(seconds, dt = 0.05) {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    Sys.update(dt);
    Input.endFrame();
  }
}

export const wait = (ms = 5) => new Promise((r) => setTimeout(r, ms));
/** Run frames until `pred()` or timeout (in sim seconds). Yields to the event loop every step so promises settle. */
export async function until(pred, seconds = 20, dt = 0.05) {
  const n = Math.round(seconds / dt);
  for (let i = 0; i < n; i++) {
    if (pred()) return true;
    Sys.update(dt);
    Input.endFrame();
    await wait(0);
  }
  return pred();
}

/** Hold a movement axis for `seconds`. */
export async function hold(x, y, seconds) {
  Input.setVirtualAxis(x, y);
  frames(seconds);
  Input.setVirtualAxis(0, 0);
  await wait(0);
}

export const actors = () => svc.entities.actors();
