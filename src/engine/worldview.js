// WorldView: the world pass. Owns the three.js scene (tile layers, actors, weather, debug), the
// camera logic, point lights (world coordinates) and all GPU handles of the loaded map.
//
// Draw order (renderOrder bands): ground -> deco -> shadows -> actors y-sorted by feet y -> above ->
// emotes -> debug -> weather. Grading/fade/UI are applied by the Renderer afterwards.
import * as THREE from 'three';
import { VIEW_W, VIEW_H, TILE } from '../core/constants.js';
import { Camera } from './camera.js';
import { TextureCache } from './textures.js';
import { TileMap } from './tilemap.js';
import { ActorView, disposeSharedGeometry } from './sprites.js';
import { Weather, WEATHER_KIND_EFFECT } from './weather.js';
import { DebugOverlay } from './debug_overlay.js';
import { parseColor } from './color.js';

export const MAX_LIGHTS = 16;

export class WorldView {
  constructor({ viewW = VIEW_W, viewH = VIEW_H } = {}) {
    this.viewW = viewW;
    this.viewH = viewH;
    this.scene = new THREE.Scene();
    this.overlayScene = new THREE.Scene(); // drawn after grading (fireflies / glows)
    // y-down ortho camera: top=0, bottom=H (this flips triangle winding: all materials are DoubleSide)
    this.threeCamera = new THREE.OrthographicCamera(0, viewW, 0, viewH, -1000, 1000);
    this.cam = new Camera({ viewW, viewH });
    this.textures = new TextureCache();
    this.background = '#17121f';
    this.map = null;
    this.tilemap = null;
    this.season = null;
    this.actors = [];
    this.iconAtlas = null;
    this.lights = [];
    this.time = 0;
    this.weather = new Weather({ scene: this.scene, overlayScene: this.overlayScene, w: viewW, h: viewH });
    this.debug = new DebugOverlay(this);
    this.debugOn = false;
    this._sorted = [];
  }

  // ---- map ------------------------------------------------------------------------------------
  get mapWidthPx() { return this.map ? this.map.width * TILE : 0; }
  get mapHeightPx() { return this.map ? this.map.height * TILE : 0; }

  /**
   * Load a MapDef with a tileset atlas. Replaces (and disposes) the previous map; actors are kept.
   * opts: {season, snapCamera = true}
   */
  loadMap(map, tileset, opts = {}) {
    this.unloadMap();
    this.map = map;
    this.season = opts.season || this.season;
    this.tilemap = new TileMap(this.scene, map, tileset, this.textures);
    this.tilemap.animate(this.time);
    this.cam.setBounds(map.width * TILE, map.height * TILE);
    if (opts.snapCamera !== false && this.cam.target) this.cam.snapTo(this.cam.target.x + this.cam.offset.x, this.cam.target.y + this.cam.offset.y);
    if (this.debugOn) this.debug.build();
    return this;
  }

  unloadMap() {
    if (this.tilemap) this.tilemap.dispose();
    this.tilemap = null;
    this.debug.dispose(true);
    this.map = null;
  }

  /** Swap the tileset atlas for a new season (indices are identical across seasons). */
  setSeason(season, tileset) {
    this.season = season;
    if (tileset && this.tilemap) this.tilemap.setTileset(tileset);
  }

  /** Change a tile at runtime: layer 'ground'|'deco'|'above' (also update map.collision yourself). */
  setTile(layer, tx, ty, index) {
    if (this.tilemap) this.tilemap.setTile(layer, tx, ty, index);
  }

  /** Icon atlas {canvas,size,cols,names} providing `emote_<kind>` bubbles. */
  setIconAtlas(atlas) {
    for (const a of this.actors) if (a.view) a.view.resetEmote();
    this.iconAtlas = atlas;
  }

  // ---- actors ---------------------------------------------------------------------------------
  addActor(actor) {
    if (this.actors.includes(actor)) return actor;
    actor.view = new ActorView(actor, this);
    this.actors.push(actor);
    return actor;
  }
  removeActor(actor) {
    const i = this.actors.indexOf(actor);
    if (i < 0) return;
    this.actors.splice(i, 1);
    if (actor.view) actor.view.dispose();
    actor.view = null;
  }
  clearActors() {
    for (const a of [...this.actors]) this.removeActor(a);
  }
  /** Actors whose feet are inside the tile rect (for interaction lookups). */
  actorsAt(tx, ty, w = 1, h = 1) {
    return this.actors.filter((a) => a.tx >= tx && a.tx < tx + w && a.ty >= ty && a.ty < ty + h);
  }

  // ---- weather / lights -----------------------------------------------------------------------
  /**
   * Set the weather. kind: 'sunny'|'cloudy'|'none' (clear), 'rain','storm','snow','petals','leaves','fireflies'.
   * Replaces the current precipitation (fireflies are kept). Use world.weather.set(name, i) to layer effects.
   */
  setWeather(kind, intensity = 1, rampSec = 1.5) {
    if (WEATHER_KIND_EFFECT[kind] === undefined) throw new Error(`Unknown weather kind "${kind}"`);
    this.weather.setExclusive(kind, intensity, rampSec);
  }
  setQuality(q) {
    this.weather.setQuality(q);
  }

  /**
   * Point lights in WORLD pixel coordinates (max 16 are drawn): {x, y, radius = 48, color = '#ffd9a0',
   * intensity = 1, flicker = 0 (0..1), id?}. Returns the stored light (mutate x/y/intensity freely).
   */
  addLight(l) {
    const light = { radius: 48, color: '#ffd9a0', intensity: 1, flicker: 0, on: true, ...l };
    light._rgb = parseColor(light.color);
    light._seed = Math.random() * 100;
    this.lights.push(light);
    return light;
  }
  removeLight(l) {
    const i = this.lights.indexOf(l);
    if (i >= 0) this.lights.splice(i, 1);
  }
  clearLights() {
    this.lights.length = 0;
  }
  setLights(list) {
    this.clearLights();
    for (const l of list) this.addLight(l);
  }

  // ---- debug ----------------------------------------------------------------------------------
  /** true/false or flags {collision,warps,anchors,interactables,hitboxes,grid}. */
  setDebug(flags) {
    this.debugOn = flags !== false;
    if (this.debugOn) this.debug.setFlags(flags === true ? {} : flags);
    else {
      this.debug.dispose();
    }
  }

  // ---- frame ----------------------------------------------------------------------------------
  update(dt) {
    this.time += dt;
    for (let i = 0; i < this.actors.length; i++) this.actors[i].update(dt);
    this.cam.update(dt);
    this.weather.update(dt, this.cam);
  }

  /** Called by the Renderer right before drawing: pushes logic state into the GPU objects. */
  beforeRender() {
    const cam = this.cam;
    this.threeCamera.position.set(cam.px, cam.py, 0);
    this.threeCamera.updateMatrixWorld();
    if (this.tilemap) this.tilemap.animate(this.time);
    // y-sort: feet y (+ bias), stable by insertion order
    const s = this._sorted;
    s.length = 0;
    for (let i = 0; i < this.actors.length; i++) s.push(this.actors[i]);
    s.sort((a, b) => a.y + a.sortBias - (b.y + b.sortBias) || this.actors.indexOf(a) - this.actors.indexOf(b));
    for (let i = 0; i < s.length; i++) s[i].view.sync(i);
    if (this.debugOn) this.debug.update();
  }

  /** Active lights as screen-space data for the grading shader. Fills the given typed arrays; returns count. */
  collectLights(pos, col) {
    const cam = this.cam;
    let n = 0;
    for (let i = 0; i < this.lights.length && n < MAX_LIGHTS; i++) {
      const l = this.lights[i];
      if (!l.on || l.intensity <= 0) continue;
      const sx = l.x - cam.px;
      const sy = l.y - cam.py;
      if (sx < -l.radius || sy < -l.radius || sx > this.viewW + l.radius || sy > this.viewH + l.radius) continue;
      let k = l.intensity;
      if (l.flicker > 0) {
        const t = this.time * 9 + l._seed;
        k *= 1 - l.flicker * (0.5 + 0.5 * Math.sin(t) * Math.sin(t * 0.37 + 1.3));
      }
      pos[n * 4] = sx;
      pos[n * 4 + 1] = sy;
      pos[n * 4 + 2] = l.radius;
      pos[n * 4 + 3] = k;
      col[n * 3] = l._rgb[0];
      col[n * 3 + 1] = l._rgb[1];
      col[n * 3 + 2] = l._rgb[2];
      n++;
    }
    return n;
  }

  get hasOverlay() {
    return this.overlayScene.children.length > 0;
  }

  /** GPU-side counts for leak checks (textures cached by this world). */
  stats() {
    return { textures: this.textures.size, actors: this.actors.length, sceneChildren: this.scene.children.length };
  }

  dispose() {
    this.clearActors();
    this.unloadMap();
    this.debug.dispose();
    this.weather.dispose();
    this.textures.disposeAll();
    disposeSharedGeometry();
  }
}
