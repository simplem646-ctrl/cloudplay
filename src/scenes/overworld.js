// The overworld scene: map loading with fades, free pixel movement, camera, interaction, warps, HUD, the in-game clock,
// day/night/season/weather presentation, NPC placement (npc_manager.js), the Stage (stage.js) that runs event scripts,
// triggers, directors, pause, sleeping. Sub-scenes (shop, class, pause, ...) are pushed on top through the scene registry;
// while one is open this scene is not updated, so the clock is paused.
import {
  Scene, moveActor, findPath, PathWalker, lerpGrading, resolveGrading,
} from '../engine/index.js';
import { HUD, ToastStack, DialogueBox, ChoiceBox, ConfirmBox, Banner, drawWindow, drawText, THEME } from '../ui/index.js';
import { DIR_VEC, SECONDS_PER_GAME_MINUTE, DAY_END, TILE } from '../core/constants.js';
import { MUSIC_IDS } from '../data/ids.js';
import { getMap, getTileset } from '../world/index.js';
import { dayInfo as calcDayInfo } from '../sim/calendar.js';
import { schoolPhase } from '../sim/academics.js';
import { openScene, runDirectors, createScene } from './registry.js';
import { makeActor, reskin } from './actors.js';
import { NpcManager } from './npc_manager.js';
import { OverworldStage } from './stage.js';
import { TriggerGate, TriggerQueue } from './triggers.js';
import { resolveAnchorRef, findFreeTile, warpTile, walkableTile } from './anchors.js';
import { playerSlotFor, displayName } from './npc_plan.js';
import { gradingTarget, weatherPlan, ambiencePlan, musicPlan, nightFactor, stepSfx } from './presentation.js';
import { startSession } from './session.js';
import { runInteractable, talkTo } from './interactions.js';

const CAM_OFFSET_Y = -8;
const LOCKED_LINE = 'The door is locked for now.';

export class OverworldScene extends Scene {
  constructor(game, params = {}) {
    super(game);
    this.params = params;
    const services = game.ui.services;
    this.hud = new HUD({ services });
    this.toasts = new ToastStack({ services });
    this.stage = new OverworldStage(this);
    this.npcs = new NpcManager(this);
    this.gate = new TriggerGate({ autoEvery: 1, cooldown: 2 });
    this.queue = new TriggerQueue();
    this.player = null;
    this.map = null;
    this.mapId = null;
    this.tileset = null;
    this.dayInfo = null;
    this.season = null;
    // flow state
    this.busy = 0;
    this.scriptDepth = 0;
    this.currentEvent = null;
    this.modals = [];
    this.lastBox = null;
    this.paused = false;
    this.dead = false;
    this.cool = 0;
    this.skipping = false;
    this.pendingEnding = false;
    this.auto = null; // debug: { delay, choice } auto-advances dialogue
    // timing
    this.t = 0;
    this.minuteAcc = 0;
    this.lastMinute = -1;
    this.needResync = false;
    this.dayDirty = false;
    this.clockPending = false;
    this.timers = [];
    this.frameWaiters = [];
    this.walkers = [];
    this.autoWalk = null;
    this.warpLock = null;
    this.stepT = 0;
    this.idleFor = 0;
    // presentation
    this.grade = resolveGrading('day');
    this.gradeTarget = resolveGrading('day');
    this.gradeT = 0;
    this.snapGrade = true;
    this.lighting = null;
    this.musicOverride = undefined;
    this.curMusic = undefined;
    this.curAmbience = undefined;
    this.presSig = null;
    this.lights = [];
    this.showFps = false;
    this.offs = [];
  }

  get sim() { return this.game.sim; }
  get es() { return this.game.events; }
  get transparent() { return false; }

  // =============================================================================================
  // lifecycle
  // =============================================================================================
  enter(params = {}) {
    this.params = params;
    this.game.overworld = this;
    this.dead = false;
    const g = this.game;
    this.offs.push(g.bus.on('toast', (p) => p && p.text && this.toast(p.text, p.icon)));
    this.offs.push(g.bus.on('time:day', () => { this.dayDirty = true; }));
    this.offs.push(g.bus.on('weather:changed', () => { this.presSig = null; }));
    g.world.setIconAtlas && g.art && g.world.setIconAtlas(g.art.getIconAtlas());
    this.player = makeActor('theo', { slot: 'casual', season: this.sim.state.time.season });
    g.world.addActor(this.player);
    g.world.cam.follow(this.player, { smooth: 0, offsetY: CAM_OFFSET_Y });
    this.begin(params).catch((e) => console.error('[overworld] begin failed', e));
  }

  exit() {
    this.dead = true;
    for (const off of this.offs) off();
    this.offs = [];
    const g = this.game;
    this.npcs.reset();
    if (this.player) g.world.removeActor(this.player);
    g.world.clearLights();
    g.world.weather.clear(0);
    g.renderer.fade.set(0);
    try { g.audio && g.audio.ambience(null); } catch { /* optional */ }
    this.curAmbience = undefined;
    this.curMusic = undefined;
    for (const m of this.modals) m.resolve(undefined);
    this.modals = [];
    for (const t of this.timers) t.res();
    this.timers = [];
    for (const w of this.walkers) w.resolve();
    this.walkers = [];
    for (const f of this.frameWaiters) f();
    this.frameWaiters = [];
    if (g.overworld === this) g.overworld = null;
  }

  pause() { this.paused = true; }
  resume() { this.paused = false; this.cool = 0.15; this.afterSubScene(); }

  async begin(params) {
    const g = this.game, st = this.sim.state, r = g.renderer;
    this.busy++;
    try {
      r.fade.set(1);
      this.hud.visible = false;
      if (params.fresh) {
        st.player.map = 'home_theo'; st.player.anchor = 'bed'; st.player.x = null; st.player.y = null;
        this.loadMapNow('home_theo', 'bed');
        await this.nextFrame();
        await this.ask(new Banner({ services: g.ui.services, text: 'Bellhaven', sub: 'Spring, Year 1', ms: 3200, fullDim: true }));
        await r.fade.in(700);
      } else {
        this.enterSaved();
        await this.nextFrame();
        await r.fade.in(500);
      }
    } finally { this.busy--; this.hud.visible = true; }
    this.queue.push(params.fresh ? { type: 'wake' } : { type: 'enterMap', map: this.mapId });
  }

  /** Place the player from `state.player` (saved position, else anchor, else Theo's bed) on the right map. */
  enterSaved() {
    const p = this.sim.state.player;
    let mapId = p.map;
    try { getMap(mapId); } catch { mapId = 'home_theo'; p.anchor = 'bed'; p.x = null; }
    if (typeof p.x === 'number' && typeof p.y === 'number') this.loadMapNow(mapId, null, { tile: { x: p.x, y: p.y, dir: p.dir } });
    else this.loadMapNow(mapId, p.anchor || 'entrance');
  }

  /** Swap in a whole new session (after a load from the pause menu). */
  async loadSession(state) {
    const r = this.game.renderer;
    await r.fade.out(300);
    await startSession(this.game, state);
    this.npcs.reset();
    this.queue.clear();
    this.gate.reset();
    this.enterSaved();
    this.lastMinute = -1;
    this.dayDirty = false;
    await this.nextFrame();
    await r.fade.in(400);
    this.queue.push({ type: 'enterMap', map: this.mapId });
  }

  // =============================================================================================
  // small async helpers (driven by update(), so they pause with the game)
  // =============================================================================================
  nextFrame() { return new Promise((res) => this.frameWaiters.push(res)); }
  sleep(ms) {
    if (ms <= 0) return Promise.resolve();
    return new Promise((res) => this.timers.push({ t: ms / 1000, res }));
  }
  scale(ms) { return this.skipping ? Math.max(0, Math.round(ms / 6)) : ms; }
  get idle() {
    return !this.dead && !this.busy && !this.modals.length && !this.scriptDepth && !this.paused && this.game.scenes.top === this;
  }
  toast(text, icon = null) { this.toasts.push({ text, icon: icon || undefined }); }
  getMapDef(id) { return getMap(id); }

  async runExclusive(fn) {
    this.busy++;
    try { return await fn(); } catch (e) { console.error('[overworld]', e); } finally { this.busy--; this.cool = Math.max(this.cool, 0.12); }
  }

  // =============================================================================================
  // modal widgets (dialogue, choices, menus)
  // =============================================================================================
  /** Show a widget and resolve with its result when it is done. opts: { keepLast (draw the last dialogue box under it), dim }. */
  ask(widget, opts = {}) {
    if (!opts.keepLast && !(widget instanceof DialogueBox)) this.lastBox = null;
    return new Promise((resolve) => this.modals.push({ widget, resolve, opts, age: 0 }));
  }
  async showDialogue({ who = null, face = 'neutral', text = '', name = null, style = 'normal' }) {
    const box = new DialogueBox({ services: this.game.ui.services, who, name, face, text, style });
    await this.ask(box);
    this.lastBox = box;
  }

  updateModal(dt, input) {
    const m = this.modals[this.modals.length - 1];
    m.age += dt;
    const w = m.widget;
    if (this.auto && m.age > this.auto.delay) {
      if (w instanceof DialogueBox) { w.skipToEnd(); w.finish(true); }
      else if (w instanceof ChoiceBox) w.finish(Math.min(this.auto.choice || 0, w.options.length - 1));
      else if (w instanceof ConfirmBox) w.finish(true);
      else if (w instanceof Banner) w.finish(true);
      else if (w.finish) w.finish(w.cancellable ? null : undefined);
    } else if (this.skipping && w instanceof DialogueBox && m.age > 0.05) {
      w.skipToEnd(); w.finish(true);
    } else w.update(dt, input);
    if (w.done) {
      this.modals.pop();
      this.cool = 0.12;
      m.resolve(w.result);
    }
  }

  // =============================================================================================
  // maps
  // =============================================================================================
  /** Synchronous map swap (call between fades). Throws when the map does not exist (nothing is changed then). */
  loadMapNow(mapId, ref, { dir = null, tile = null } = {}) {
    const g = this.game, st = this.sim.state;
    const def = getMap(mapId); // throws for missing maps
    let a;
    if (tile) a = { x: tile.x, y: tile.y, dir: tile.dir || 'down' };
    else a = resolveAnchorRef(ref || 'entrance', mapId, getMap);
    if (a.fallback) console.warn(`[overworld] anchor "${ref}" missing on ${mapId}; using ${a.name}`);
    const spot = walkableTile(def, a.x, a.y) ? a : { ...a, ...(findFreeTile(def, a.x, a.y, null, { radius: 6, allowWarp: true }) || {}) };

    this.npcs.reset();
    for (const w of this.walkers) w.resolve();
    this.walkers.length = 0;
    if (this.autoWalk) { this.autoWalk.resolve(true); this.autoWalk = null; }
    this.map = def;
    this.mapId = mapId;
    this.season = st.time.season;
    this.tileset = getTileset(this.season);
    this.player.visible = true;
    this.player.setPose(null);
    this.player.setTile(spot.x, spot.y);
    this.player.setDir(dir || a.dir || 'down');
    g.world.loadMap(def, this.tileset, { season: this.season });
    g.world.addActor(this.player);
    g.world.cam.follow(this.player, { smooth: 0, offsetY: CAM_OFFSET_Y });
    g.world.cam.snapTo(this.player.x, this.player.y + CAM_OFFSET_Y);
    this.dayInfo = calcDayInfo(st);
    this.npcs.syncMap();
    this.buildLights();
    this.refreshPlayerOutfit();
    this.presSig = null;
    this.snapGrade = true;
    this.applyPresentation(true);
    this.hud.showLocation(def.name);
    this.warpLock = this.warpAt(this.player.tx, this.player.ty);
    this.syncPlayerState();
    this.lastMinute = st.time.minute;
  }

  /** Fade-wrapped map change used by warps, scripts and the debug API. Rejects when the map does not exist. */
  async changeMap(mapId, ref, { dir = null, fade = true, scripted = false, sfx = null } = {}) {
    getMap(mapId); // fail early, before any fade
    const r = this.game.renderer;
    const wasBlack = r.fade.amount > 0.5;
    if (sfx) try { this.game.audio && this.game.audio.sfx(sfx); } catch { /* optional */ }
    if (fade && !wasBlack) await r.fade.out(this.scale(220));
    this.loadMapNow(mapId, ref, { dir });
    await this.nextFrame();
    if (fade && !wasBlack) await r.fade.in(this.scale(260));
    void scripted;
  }

  warpAt(tx, ty) {
    if (!this.map) return null;
    return (this.map.warps || []).find((w) => tx >= w.x && tx < w.x + w.w && ty >= w.y && ty < w.y + w.h) || null;
  }

  async useWarp(w) {
    const [mapId, anchor] = String(w.to).split(':');
    if (this.autoWalk) { this.autoWalk.walker.cancel(); this.autoWalk.resolve(true); this.autoWalk = null; this.player.setMoving(false); }
    const ctx ={ map: this.mapId, minute: this.sim.state.time.minute };
    if (w.requires && !this.es.conditions.safe(w.requires, ctx)) {
      this.warpLock = w;
      await this.showDialogue({ who: null, text: w.lockedText || LOCKED_LINE, style: 'narrate' });
      this.stepOffWarp();
      return;
    }
    let exists = true;
    try { getMap(mapId); } catch { exists = false; }
    if (!exists) {
      this.warpLock = w;
      this.game.audio && this.game.audio.sfx('error');
      await this.showDialogue({ who: null, text: LOCKED_LINE, style: 'narrate' });
      this.stepOffWarp();
      return;
    }
    await this.changeMap(mapId, anchor, { sfx: w.sfx || null });
    this.queue.push({ type: 'enterMap', map: this.mapId });
  }

  /** After a refused door: move the player to the nearest walkable non-warp tile. */
  stepOffWarp() {
    const p = this.player;
    const t = findFreeTile(this.map, p.tx, p.ty, (x, y) => warpTile(this.map, x, y), { radius: 3 });
    if (t) p.setTile(t.x, t.y);
  }

  // =============================================================================================
  // lights, grading, weather, music
  // =============================================================================================
  buildLights() {
    const w = this.game.world;
    w.clearLights();
    this.lights = [];
    if (!this.map || this.map.indoor) return;
    const meta = this.tileset.meta;
    const { width, height, layers } = this.map;
    for (const layerName of ['above', 'deco']) {
      const layer = layers[layerName];
      for (let i = 0; i < layer.length; i++) {
        const idx = layer[i];
        if (!idx) continue;
        const name = meta[idx] && meta[idx].name;
        if (!name) continue;
        const x = (i % width) * TILE + 8, y = Math.floor(i / width) * TILE;
        if (name === 'lamp_head') this.lights.push({ base: 1, light: w.addLight({ x, y: y + 12, radius: 46, color: '#ffd28a', intensity: 0, flicker: 0.08 }) });
        else if (/^win_[a-z]+$/.test(name)) this.lights.push({ base: 0.65, light: w.addLight({ x, y: y + 10, radius: 26, color: '#ffe0a8', intensity: 0, flicker: 0 }) });
      }
    }
    void height;
  }

  get outdoor() { return !!this.map && !this.map.indoor && !(this.map.ambient && this.map.ambient.weather === false); }

  setLighting(preset) {
    this.lighting = !preset || preset === 'auto' ? null : preset;
  }

  setMusicOverride(id, fadeMs = 800) {
    this.musicOverride = id;
    const a = this.game.audio;
    if (!a) return;
    try {
      if (id === undefined) this.applyPresentation(true);
      else { a.music(id, { fadeMs }); this.curMusic = id; }
    } catch { /* optional */ }
  }

  /** Weather particles, ambience bed and music for the current map / time / weather (cheap; re-applies only on change). */
  applyPresentation(force = false) {
    if (!this.map || !this.sim) return;
    const g = this.game, st = this.sim.state;
    const minute = st.time.minute, season = st.time.season, weather = st.weather.today;
    const outdoor = this.outdoor;
    const dark = nightFactor(minute) > 0.6;
    const sig = `${this.mapId}|${outdoor}|${weather}|${season}|${dark}`;
    if (force || sig !== this.presSig) {
      this.presSig = sig;
      const wp = weatherPlan({ outdoor, weather, season, minute });
      g.world.weather.clear(force ? 0.05 : 1.2);
      if (wp.kind) g.world.setWeather(wp.kind, wp.intensity, 1.5);
      if (wp.fireflies) g.world.weather.set('fireflies', wp.fireflies, 2);
      const amb = ambiencePlan({ outdoor, mapAmbience: this.map.ambient && this.map.ambient.ambience, weather, season, minute });
      if (amb !== this.curAmbience) {
        this.curAmbience = amb;
        try { g.audio && g.audio.ambience(amb); } catch { /* optional */ }
      }
    }
    if (this.musicOverride === undefined) {
      const inLesson = !!(this.dayInfo && this.dayInfo.hasLessons && this.mapId === 'school_classroom' && schoolPhase(minute).phase === 'period');
      const id = musicPlan({ hint: this.map.ambient && this.map.ambient.music, season, minute, weather, inLesson, known: MUSIC_IDS });
      if (id !== this.curMusic) {
        this.curMusic = id;
        try { g.audio && g.audio.music(id, { fadeMs: 800 }); } catch { /* optional */ }
      }
    }
  }

  updatePresentation(dt) {
    const g = this.game, st = this.sim.state;
    this.gradeT -= dt;
    if (this.gradeT <= 0 || this.snapGrade) {
      this.gradeT = 0.2;
      const minute = st.time.minute + Math.min(1, this.minuteAcc / SECONDS_PER_GAME_MINUTE);
      this.gradeTarget = gradingTarget({ outdoor: this.outdoor, minute, weather: st.weather.today, override: this.lighting });
    }
    if (this.snapGrade) { lerpGrading(this.gradeTarget, this.gradeTarget, 1, this.grade); this.snapGrade = false; }
    else lerpGrading(this.grade, this.gradeTarget, Math.min(1, dt * 3), this.grade);
    g.renderer.setGrading(this.grade);
    // lamps / lit windows follow the night factor (indoors none)
    const nf = this.outdoor || this.lighting === 'night' || this.lighting === 'lantern' ? Math.max(nightFactor(st.time.minute), this.lighting === 'night' || this.lighting === 'lantern' ? 1 : 0) : 0;
    const k = Math.min(1, dt * 2);
    for (const l of this.lights) l.light.intensity += (nf * l.base - l.light.intensity) * k;
  }

  refreshPlayerOutfit() {
    const st = this.sim.state;
    const slot = playerSlotFor({ outfit: st.player.outfit, mapId: this.mapId || '', minute: st.time.minute, info: this.dayInfo });
    reskin(this.player, 'theo', slot, st.time.season);
  }

  // =============================================================================================
  // state sync
  // =============================================================================================
  syncPlayerState() {
    const p = this.sim.state.player, a = this.player;
    if (!a || !this.mapId) return;
    p.map = this.mapId; p.x = a.tx; p.y = a.ty; p.dir = a.dir;
  }

  /** Called whenever a sub-scene / script / flow may have moved the clock or state: resync NPCs and presentation next idle frame. */
  afterSubScene() {
    this.needResync = true;
    this.lastMinute = -1;
  }

  giftItems() { return this.sim.inventory.list().filter((e) => e.item.category !== 'key'); }

  // =============================================================================================
  // events and scripts
  // =============================================================================================
  beginScript(ev) {
    this.scriptDepth++;
    if (this.scriptDepth === 1) {
      this.currentEvent = ev;
      this.mapAtBegin = this.mapId;
      this.hud.visible = false;
      this.autoWalk = null;
      this.player.setMoving(false);
    }
  }

  async endScript() {
    this.scriptDepth = Math.max(0, this.scriptDepth - 1);
    if (this.scriptDepth > 0) return;
    const g = this.game, r = g.renderer;
    for (const w of this.walkers) { w.walker.cancel(); w.resolve(); }
    this.walkers = [];
    if (r.fade.amount > 0.01 && !this.dead) await r.fade.in(350);
    this.currentEvent = null;
    this.skipping = false;
    this.lastBox = null;
    this.hud.visible = true;
    this.lighting = null;
    this.player.visible = true;
    this.player.setMoving(false);
    g.world.cam.follow(this.player, { smooth: 0, offsetY: CAM_OFFSET_Y });
    g.world.cam.snapTo(this.player.x, this.player.y + CAM_OFFSET_Y);
    this.dayInfo = calcDayInfo(this.sim.state);
    this.musicOverride = undefined;
    this.refreshPlayerOutfit();
    this.npcs.releaseScripted();
    this.npcs.onMinute(this.sim.state.time.minute);
    this.applyPresentation(true);
    this.syncPlayerState();
    this.warpLock = this.warpAt(this.player.tx, this.player.ty);
    if (this.mapId !== this.mapAtBegin) this.queue.push({ type: 'enterMap', map: this.mapId });
    if (this.pendingEnding && !this.dead) { this.pendingEnding = false; await this.runEnding(); }
  }

  /** Run one event with the Stage (marks seen, locks input, restores the map afterwards). Never rejects. */
  async runEvent(ev) {
    this.busy++;
    try { await this.es.events.run(ev, this.stage); } catch (e) { console.error(`[overworld] event ${ev && ev.id} failed`, e); if (this.scriptDepth) { this.scriptDepth = 1; await this.endScript(); } } finally {
      this.busy--;
      this.gate.eventEnded();
    }
  }
  async runEventById(id) {
    const ev = this.es.events.get(id);
    if (!ev) { console.warn(`[overworld] unknown event "${id}"`); return false; }
    await this.runEvent(ev);
    return true;
  }

  /** Ask for events of one trigger type until none is eligible (a finished event may unlock the next). */
  async runTrigger(trigger) {
    let t = trigger;
    for (let i = 0; i < 6 && !this.dead; i++) {
      const ev = this.es.events.find(t, { map: this.mapId, minute: this.sim.state.time.minute });
      if (!ev) break;
      await this.runEvent(ev);
      if (t.type === 'enterMap') t = { type: 'enterMap', map: this.mapId };
    }
  }

  // =============================================================================================
  // walking (Stage moveTo / debug walkTo)
  // =============================================================================================
  walkActor(actor, goal, { run = false } = {}) {
    const m = this.map;
    const path = findPath(m.collision, m.width, m.height, actor.tx, actor.ty, goal.x, goal.y, { maxNodes: 8000 });
    if (!path || path.length < 2) {
      if (!path) actor.setTile(goal.x, goal.y);
      return Promise.resolve();
    }
    return new Promise((resolve) => {
      const walker = new PathWalker(actor, path, { run, blockers: this.npcs.blockers });
      this.walkers.push({ walker, actor, goal, resolve });
    });
  }

  /** Debug / tests: walk the player to a tile along A*; resolves true on arrival (false if cancelled). */
  walkPlayerTo(tx, ty, { run = true } = {}) {
    const m = this.map;
    const path = findPath(m.collision, m.width, m.height, this.player.tx, this.player.ty, tx, ty, { maxNodes: 12000 });
    if (!path) return Promise.resolve(false);
    if (this.autoWalk) this.autoWalk.resolve(false);
    return new Promise((resolve) => {
      this.autoWalk = { walker: new PathWalker(this.player, path, { run, blockers: this.npcs.blockers }), resolve, goal: { x: tx, y: ty } };
    });
  }

  updateWalkers(dt) {
    if (!this.walkers.length) return;
    for (const w of [...this.walkers]) {
      w.actor.speedMul = this.skipping ? 3 : 1;
      if (w.walker.update(dt, this.map)) {
        w.actor.speedMul = 1;
        if (w.walker.stuck) w.actor.setTile(w.goal.x, w.goal.y);
        this.walkers.splice(this.walkers.indexOf(w), 1);
        w.resolve();
      }
    }
  }

  // =============================================================================================
  // interaction
  // =============================================================================================
  /** What the player is facing: { type:'npc', id, actor, label } | { type:'object', it, label } | null. */
  facingTarget() {
    const p = this.player, v = DIR_VEC[p.dir] || [0, 1];
    let best = null;
    for (const e of this.npcs.entries.values()) {
      const a = e.actor;
      if (!a.visible || e.leaving) continue;
      const dx = a.x - p.x, dy = a.y - p.y;
      const fwd = dx * v[0] + dy * v[1];
      const lat = Math.abs(dx * v[1] - dy * v[0]);
      if (fwd > -3 && fwd < 22 && lat < 11 && (!best || fwd < best.fwd)) best = { fwd, id: e.id, actor: a };
    }
    if (best) return { type: 'npc', id: best.id, actor: best.actor };
    // interactables: the tiles in front (widened by the body width), then our own tile
    const tiles = [];
    const fx = p.tx + v[0], fy = p.ty + v[1];
    if (v[1] !== 0) {
      for (const ox of [0, -5, 5]) tiles.push({ x: Math.floor((p.x + ox) / TILE), y: fy });
    } else {
      for (const oy of [-1, -5, -9]) tiles.push({ x: fx, y: Math.floor((p.y + oy) / TILE) });
    }
    tiles.push({ x: p.tx, y: p.ty });
    for (const t of tiles) {
      const it = (this.map.interactables || []).find((i) => t.x >= i.x && t.x < i.x + i.w && t.y >= i.y && t.y < i.y + i.h);
      if (it) return { type: 'object', it };
    }
    return null;
  }

  interact() {
    const tg = this.facingTarget();
    if (!tg) return false;
    this.autoWalk = null;
    if (tg.type === 'npc') {
      this.game.audio && this.game.audio.sfx('confirm');
      this.runExclusive(() => talkTo(this, tg.id));
    } else {
      this.game.audio && this.game.audio.sfx('confirm');
      this.runExclusive(() => runInteractable(this, tg.it));
    }
    return true;
  }

  // =============================================================================================
  // pause
  // =============================================================================================
  async openPause() {
    await this.runExclusive(async () => {
      this.syncPlayerState();
      this.game.audio && this.game.audio.sfx('confirm');
      let res = await openScene(this.game, 'pause', {});
      if (res && res.missing) res = await this.fallbackPause();
      if (res && res.loaded) await this.loadSession(res.state);
      else this.afterSubScene();
    });
  }

  async fallbackPause() {
    const box = new ChoiceBox({ services: this.game.ui.services, options: ['Resume', 'Save', 'Title'], cancellable: true, title: 'Paused', right: 200, bottom: 150 });
    const pick = await this.ask(box);
    if (pick === 1) {
      const w = this.sim.save.write(1);
      this.toast(w && w.ok ? 'Game saved (slot 1).' : 'Could not save.');
    } else if (pick === 2) {
      await this.toTitle();
    }
    return {};
  }

  async toTitle() {
    await this.game.scenes.reset(createScene('title', this.game, {}), {});
  }

  // =============================================================================================
  // sleeping, collapsing, endings
  // =============================================================================================
  /** Bed -> (confirm) -> sleep event -> night pipeline -> `sleep` scene -> new morning -> `wake` events. Runs inside a busy guard. */
  async sleepFlow({ confirm = false, forced = false, quick = false } = {}) {
    const g = this.game, r = g.renderer, st = this.sim.state;
    if (confirm && !forced) {
      const early = st.time.minute < 18 * 60;
      const box = new ConfirmBox({ services: g.ui.services, message: early ? 'It is still early. Go to bed anyway?' : 'Go to bed and end the day?', yes: 'Sleep', no: 'Not yet' });
      if (!(await this.ask(box, { dim: true }))) return false;
    }
    if (!forced) await this.runTrigger({ type: 'sleep' });
    this.hud.visible = false;
    g.audio && g.audio.sfx('sleep');
    await r.fade.out(quick ? 0 : 700);
    this.syncPlayerState();
    const summary = this.sim.clock.sleep({ forced });
    this.dayDirty = true;
    if (!quick) {
      const res = await openScene(g, 'sleep', { summary });
      if (res && res.missing) {
        const d = summary.date || {};
        await this.ask(new Banner({ services: g.ui.services, text: 'A new day', sub: `${String(d.season || '').replace(/^./, (c) => c.toUpperCase())} ${d.day || ''}`, ms: 2000, fullDim: true }));
      }
    }
    if (summary.gameEnd) { await this.runEnding(); return true; }
    this.enterMorning();
    await this.nextFrame();
    await r.fade.in(quick ? 0 : 900);
    this.hud.visible = true;
    if (forced && st.flags.sim_forced_sleep) await this.scoldForcedSleep(summary);
    this.queue.push({ type: 'wake' });
    return summary;
  }

  /** Put the player in bed on the new morning (state.player is set by clock.wake()). */
  enterMorning() {
    const p = this.sim.state.player;
    this.dayInfo = calcDayInfo(this.sim.state);
    this.loadMapNow(p.map || 'home_theo', p.anchor || 'bed');
    this.lastMinute = this.sim.state.time.minute - 1;
    this.minuteAcc = 0;
    this.cool = 0.3;
  }

  async scoldForcedSleep(summary) {
    const st = this.sim.state;
    const school = summary && summary.missedHomeroom;
    await this.showDialogue({ who: null, text: 'You collapsed into bed at two in the morning and slept like a stone.', style: 'narrate' });
    await this.showDialogue({ who: 'roz', face: 'angry', name: 'Aunt Roz', text: school ? 'Two in the morning, Theo! And now you have missed homeroom. Bed by eleven. I mean it.' : 'Two in the morning, Theo! I found you asleep with the light on. Bed by eleven, please.' });
    await this.showDialogue({ who: 'roz', face: 'thinking', name: 'Aunt Roz', text: 'Eat something and drink some water. You only got half a night of rest.' });
    if (st.daily) st.daily.forcedScolded = true;
  }

  /** 02:00: collapse into bed (director `forced_sleep`). */
  async forcedSleep() {
    await this.runExclusive(async () => {
      await this.showDialogue({ who: null, text: 'It is far too late. Theo can barely keep his eyes open...', style: 'narrate' });
      await this.sleepFlow({ forced: true });
    });
  }

  /** 0 energy: the clinic (or school nurse) patches Theo up (director `energy_collapse`). */
  async energyCollapse() {
    await this.runExclusive(async () => {
      const g = this.game, r = g.renderer;
      this.hud.visible = false;
      await this.showDialogue({ who: null, text: 'Theo\'s legs give out. Everything goes quiet...', style: 'narrate' });
      await r.fade.out(700);
      const res = this.sim.clock.collapse();
      this.dayDirty = true;
      const p = this.sim.state.player;
      try { getMap(p.map); } catch { p.map = 'home_theo'; p.anchor = 'bed'; res.fallback = true; }
      const def = getMap(p.map);
      if (!def.anchors[p.anchor]) p.anchor = def.anchors.bed ? 'bed' : 'entrance';
      this.enterMorning();
      this.lastMinute = -1;
      await this.nextFrame();
      await r.fade.in(900);
      this.hud.visible = true;
      const where = res.fallback ? 'You woke up at home. Aunt Roz must have carried you up.' : res.place === 'clinic' ? `You woke up at the clinic.${res.fee ? ` The visit cost $${res.fee}.` : ''}` : 'You woke up in the school nurse\'s office.';
      await this.showDialogue({ who: null, text: where, style: 'narrate' });
    });
  }

  async runEnding() {
    const r = await openScene(this.game, 'ending', {});
    if (this.dead || r === undefined) return; // the credits reset the stack to the title
    await this.toTitle();
  }

  // =============================================================================================
  // per-frame
  // =============================================================================================
  update(dt, input) {
    if (this.dead || !this.map) return;
    this.t += dt;
    // async helpers
    if (this.frameWaiters.length) { const w = this.frameWaiters; this.frameWaiters = []; for (const f of w) f(); }
    if (this.timers.length) {
      for (const tm of [...this.timers]) {
        tm.t -= dt;
        if (tm.t <= 0) { this.timers.splice(this.timers.indexOf(tm), 1); tm.res(); }
      }
    }
    const st = this.sim.state;
    this.hud.update(dt);
    this.toasts.update(dt);
    this.skipping = !!(this.scriptDepth && this.currentEvent && this.currentEvent.skippable && input.down('skip'));
    this.updateWalkers(dt);
    this.npcs.update(dt);
    this.updatePresentation(dt);
    const di = this.dayInfo;
    this.hud.setData({
      season: st.time.season, day: st.time.day, weekday: di ? di.weekday : 'Mon', minute: st.time.minute, weather: st.weather.today,
      money: st.player.money, energy: st.player.energy, maxEnergy: st.player.maxEnergy, festival: di && di.festival ? di.festival.name : null,
    });
    this.gate.update(dt, this.idle);

    if (this.modals.length) { this.updateModal(dt, input); return; }
    if (this.busy || this.scriptDepth) return;

    this.freeUpdate(dt, input);
  }

  freeUpdate(dt, input) {
    const p = this.player, st = this.sim.state;
    this.cool = Math.max(0, this.cool - dt);
    st.meta.playSeconds = (st.meta.playSeconds || 0) + dt;

    if (this.needResync) {
      this.needResync = false;
      this.dayDirty = false;
      this.refreshDayState(true);
    } else if (this.dayDirty) {
      this.dayDirty = false;
      this.refreshDayState(false);
    }

    if (this.cool <= 0) {
      if (input.pressed('menu')) { this.openPause(); return; }
      if (input.pressed('confirm') && this.interact()) return;
    }

    // movement
    const a = input.axis();
    const manual = Math.abs(a.x) + Math.abs(a.y) > 0.01;
    if (this.autoWalk && manual) { this.autoWalk.walker.cancel(); this.autoWalk.resolve(false); this.autoWalk = null; }
    if (this.autoWalk) {
      if (this.autoWalk.walker.update(dt, this.map)) { const aw = this.autoWalk; this.autoWalk = null; p.setMoving(false); aw.resolve(!aw.walker.stuck); }
    } else if (this.cool <= 0 || !manual) {
      moveActor(p, this.cool > 0 ? 0 : a.x, this.cool > 0 ? 0 : a.y, dt, this.map, { run: input.down('run'), blockers: this.npcs.blockers });
    }
    // footsteps
    if (p.moving) {
      this.stepT -= dt;
      if (this.stepT <= 0) {
        this.stepT = p.running ? 0.2 : 0.3;
        try { this.game.audio && this.game.audio.sfx(stepSfx(this.tileSound(p.tx, p.ty))); } catch { /* optional */ }
      }
    } else this.stepT = 0.05;
    this.syncPlayerState();

    // warps
    const w = this.warpAt(p.tx, p.ty);
    if (!w) this.warpLock = null;
    else if (w !== this.warpLock) { this.warpLock = w; this.runExclusive(() => this.useWarp(w)); return; }

    // the in-game clock only runs while idle
    this.minuteAcc += dt;
    if (this.minuteAcc >= SECONDS_PER_GAME_MINUTE) {
      this.minuteAcc -= SECONDS_PER_GAME_MINUTE;
      if (st.time.minute < DAY_END) this.sim.clock.advance(1);
    }
    if (st.time.minute !== this.lastMinute) { this.onMinute(); if (this.busy) return; }

    // 02:00 safety net: the forced_sleep director normally handles it
    if (st.time.minute >= DAY_END) {
      this.idleFor += dt;
      if (this.idleFor > 3) { this.idleFor = 0; this.forcedSleep(); return; }
    } else this.idleFor = 0;

    // triggers
    if (this.queue.length) { const t = this.queue.shift(); this.runTrigger(t); return; }
    if (this.clockPending && this.gate.canAsk()) { this.clockPending = false; this.runTrigger({ type: 'clock' }); return; }
    if (this.gate.takeAuto()) this.runTrigger({ type: 'auto' });
  }

  /** New day / time jump: season swap, outfits, NPCs, weather, music. */
  refreshDayState(resync) {
    const st = this.sim.state;
    this.dayInfo = calcDayInfo(st);
    if (st.time.season !== this.season) {
      this.season = st.time.season;
      this.tileset = getTileset(this.season);
      this.game.world.setSeason(this.season, this.tileset);
      this.npcs.reskinAll();
    }
    this.refreshPlayerOutfit();
    if (resync) this.npcs.syncMap();
    this.presSig = null;
    this.applyPresentation(true);
    this.snapGrade = resync;
    this.lastMinute = -1;
  }

  onMinute() {
    const st = this.sim.state, minute = st.time.minute;
    this.lastMinute = minute;
    const prevDay = this.dayInfo && this.dayInfo.absDay;
    this.dayInfo = calcDayInfo(st);
    if (prevDay !== undefined && prevDay !== this.dayInfo.absDay) { this.refreshDayState(true); return; }
    this.refreshPlayerOutfit();
    this.npcs.onMinute(minute);
    this.applyPresentation(false);
    const action = runDirectors(this.game, { map: this.mapId, minute, state: st, dayInfo: this.dayInfo, player: { tx: this.player.tx, ty: this.player.ty } });
    if (action) { this.runDirectorAction(action); return; }
    this.clockPending = true;
  }

  async runDirectorAction(action) {
    await this.runExclusive(async () => {
      if (action.call) await action.call();
      else if (action.scene) {
        const r = await openScene(this.game, action.scene, action.params || {});
        if (r && r.missing) console.warn(`[overworld] director ${action.director} wants scene "${action.scene}" which is not registered`);
        this.afterSubScene();
      }
    });
  }

  tileSound(tx, ty) {
    const i = ty * this.map.width + tx;
    const meta = this.tileset.meta;
    const d = this.map.layers.deco[i], gd = this.map.layers.ground[i];
    return (d && meta[d] && meta[d].sound) || (gd && meta[gd] && meta[gd].sound) || 'grass';
  }

  // =============================================================================================
  // drawing
  // =============================================================================================
  draw(ui) {
    if (this.dead) return;
    const ctx = ui.ctx;
    this.hud.draw(ctx);
    this.toasts.draw(ctx);
    if (this.idle && !this.cool) {
      const tg = this.facingTarget();
      if (tg) this.drawHint(ctx, tg);
    }
    for (let i = 0; i < this.modals.length; i++) {
      const m = this.modals[i];
      if (m.opts.dim) drawWindow(ctx, 0, 0, 320, 240, 'dim');
      if (m.opts.keepLast && this.lastBox && i === this.modals.length - 1) this.lastBox.draw(ctx);
      m.widget.draw(ctx);
    }
    if (this.skipping) drawText(ctx, 'SKIP >>', 312, 6, { color: THEME.gold, shadow: THEME.navyDeep, align: 'right' });
    if (this.showFps) drawText(ctx, `${Math.round(this.game.renderer.perf.fps)} fps`, 4, 4, { color: '#ffffff', shadow: THEME.navyDeep });
  }

  drawHint(ctx, tg) {
    let label = null;
    if (tg.type === 'npc') label = `Talk: ${this.nameOf(tg.id)}`;
    else if (tg.it && tg.it.label) label = tg.it.label;
    if (!label) return;
    const w = Math.max(40, label.length * 5 + 22);
    const x = Math.round((320 - w) / 2);
    drawWindow(ctx, x, 207, w, 16, 'tooltip');
    drawText(ctx, label, 160, 211, { color: THEME.cream, shadow: THEME.navyDeep, align: 'center' });
  }

  nameOf(id) { return displayName(id); }
}
