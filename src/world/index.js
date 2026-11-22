/**
 * World engine (Game.world): renderer, fixed 3/4 camera, painterly environment, areas, collision, effects.
 * Public API = named exports (ARCHITECTURE section 5). Area content lives in ./areas/*.js (pure data),
 * documented in AREAS.md; props in ./props (PROPS.md).
 */
import * as THREE from 'three';
import { AREA_IDS, SEASONS, WEATHERS, AREAS, areaAnchorNames, areaTransitionIds, areaInteractables } from '../core/registry.js';
import { clamp, smoothstep } from '../core/util.js';
import { installDebug } from '../core/debug.js';
import { createTextureLibrary } from './textures.js';
import { createMaterials, createWaterMaterial, WIND } from './materials.js';
import { createCameraRig } from './camera.js';
import { Environment } from './environment.js';
import { Effects, Ambient, SHAPES } from './effects.js';
import { Post } from './post.js';
import { buildArea } from './builder.js';
import { getDef } from './areas/index.js';

const W = {
  renderer: null, canvas: null, scene: null, rig: null, env: new Environment(), tex: null, mats: null, meta: null, water: null,
  hemi: null, sun: null, quality: 'medium', size: { w: 1280, h: 720 }, dpr: 1, post: null, fx: null, ambient: null, area: null,
  entities: new Map(), entityGroup: null, sky: null, cloudPlane: null, t: 0, fps: 60, frames: 0, stats: { drawCalls: 0, triangles: 0, fps: 60 },
  input: { minutes: 720, season: 'spring', weather: 'sunny', festival: null }, lampStates: {}, decor: null, highlight: null, hlTarget: null, hlT: 0,
  seasonName: 'spring', lastLoad: null, overview: false, loading: null, maxAniso: 4,
};

const seasonName = (s) => (typeof s === 'number' ? SEASONS[((s % 4) + 4) % 4] : SEASONS.includes(s) ? s : 'spring');

function pixelRatio() {
  if (W.quality === 'low') return 1;
  return Math.min(globalThis.devicePixelRatio || 1, 1.5);
}

function makeSky() {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { uTop: { value: new THREE.Color('#6fb7e8') }, uHorizon: { value: new THREE.Color('#cfe8ff') }, uNight: { value: 0 }, uTime: { value: 0 } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `varying vec3 vP; uniform vec3 uTop; uniform vec3 uHorizon; uniform float uNight; uniform float uTime;
      float h(vec3 p){ p = fract(p * 0.3183 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
      void main(){
        float k = smoothstep(-0.1, 0.8, vP.y);
        vec3 c = mix(uHorizon, uTop, k);
        vec3 g = floor(vP * 160.0);
        float s = step(0.9965, h(g)) * smoothstep(0.1, 0.5, vP.y) * uNight;
        c += s * vec3(1.0, 0.95, 0.85);
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(180, 24, 12), mat);
  m.frustumCulled = false;
  m.renderOrder = -10;
  return m;
}

/** ---------------------------------------------------------------- init */
export async function init({ canvas, quality = 'medium', seed = 1, onProgress } = {}) {
  W.canvas = canvas;
  W.quality = ['low', 'medium', 'high'].includes(quality) ? quality : 'medium';
  const post = W.quality !== 'low';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: !post && W.quality !== 'low', powerPreference: 'high-performance', alpha: false });
  W.renderer = renderer;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  renderer.info.autoReset = false;
  renderer.shadowMap.enabled = W.quality !== 'low';
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x9fd8ff);
  W.maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  onProgress && onProgress(0.1);

  W.scene = new THREE.Scene();
  W.tex = createTextureLibrary(W.quality === 'low' ? 0.5 : W.quality === 'high' ? 1.5 : 1);
  for (const n of W.tex.names) W.tex.get(n);
  for (const t of Object.values({})) void t;
  onProgress && onProgress(0.4);
  const m = createMaterials(W.tex);
  W.mats = m.mats; W.meta = m.meta; W.applySeasonMats = m.applySeason;
  W.water = createWaterMaterial(W.tex);
  W.rig = createCameraRig();

  W.hemi = new THREE.HemisphereLight(0xffffff, 0x888866, 2.2);
  W.sun = new THREE.DirectionalLight(0xfff0d0, 3);
  W.sun.castShadow = W.quality !== 'low';
  const ms = W.quality === 'high' ? 2048 : 1024;
  W.sun.shadow.mapSize.set(ms, ms);
  const sc = W.sun.shadow.camera;
  sc.left = -20; sc.right = 20; sc.top = 18; sc.bottom = -18; sc.near = 1; sc.far = 90;
  W.sun.shadow.bias = -0.0006;
  W.sun.shadow.normalBias = 0.04;
  W.sun.shadow.radius = 3;
  W.scene.add(W.hemi, W.sun, W.sun.target);

  W.sky = makeSky();
  W.scene.add(W.sky);
  const cs = W.tex.get('cloudShadow');
  cs.repeat.set(2.4, 2.4);
  W.cloudPlane = new THREE.Mesh(new THREE.PlaneGeometry(90, 90).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: cs, transparent: true, depthWrite: false, opacity: 0.0, polygonOffset: true, polygonOffsetFactor: -4 }));
  W.cloudPlane.position.y = 0.06;
  W.cloudPlane.renderOrder = 4;
  W.scene.add(W.cloudPlane);

  W.entityGroup = new THREE.Group();
  W.scene.add(W.entityGroup);
  W.fx = new Effects(W.quality);
  W.scene.add(W.fx.group);
  W.ambient = new Ambient(W.quality);
  W.scene.add(W.ambient.group);
  W.fx.alphaPool.points.name = 'fx_alpha';

  // highlight marker (arrow + ring)
  const hl = new THREE.Group();
  const arrow = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.45, 4), new THREE.MeshBasicMaterial({ color: '#ffd23f' }));
  arrow.rotation.x = Math.PI;
  arrow.position.y = 0.3;
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 28).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#fff3b0', transparent: true, opacity: 0.8, depthWrite: false }));
  ring.position.y = 0.06;
  hl.add(arrow, ring);
  hl.visible = false;
  hl.userData = { arrow, ring };
  W.highlight = hl;
  W.scene.add(hl);

  if (post) {
    W.post = new Post(renderer, W.quality === 'high' ? 4 : 2);
  }
  resize(canvas.clientWidth || 1280, canvas.clientHeight || 720);
  onProgress && onProgress(0.7);

  const dbg = installDebug();
  if (dbg) {
    dbg.register('cam', (x, z) => { if (x !== undefined) W.rig.snap(x, z); return { x: W.rig.st.x, z: W.rig.st.z }; }, 'cam(x,z) snap camera');
    dbg.register('stats', () => getStats(), 'world stats');
  }
  await loadArea(Object.keys({ brook_lane: 1 })[0]).catch((e) => { console.error('[world] initial area failed', e); throw e; });
  onProgress && onProgress(1);
}

export function setQuality(q) {
  if (!['low', 'medium', 'high'].includes(q) || q === W.quality) return;
  const prev = W.quality;
  W.quality = q;
  if (!W.renderer) return;
  W.renderer.shadowMap.enabled = q !== 'low';
  W.sun.castShadow = q !== 'low';
  const ms = q === 'high' ? 2048 : 1024;
  W.sun.shadow.mapSize.set(ms, ms);
  if (W.sun.shadow.map) { W.sun.shadow.map.dispose(); W.sun.shadow.map = null; }
  if (q !== 'low' && !W.post) W.post = new Post(W.renderer, q === 'high' ? 4 : 2);
  if (q === 'low' && W.post) { W.post.dispose(); W.post = null; }
  resize(W.size.w, W.size.h);
  if (prev !== q && W.area) loadArea(W.area.runtime.id, { spawn: null, keepCamera: true });
}

export function resize(w, h, dpr) {
  if (!W.renderer) return;
  W.size = { w: Math.max(1, w), h: Math.max(1, h) };
  W.dpr = dpr || pixelRatio();
  W.renderer.setPixelRatio(W.dpr);
  W.renderer.setSize(W.size.w, W.size.h, false);
  W.rig.setAspect(W.size.w / W.size.h);
  if (W.post) W.post.setSize(W.size.w, W.size.h, W.dpr);
  const scale = (W.size.h * W.dpr) / 2 / Math.tan((30 * Math.PI) / 360);
  W.fx && W.fx.setScale(scale);
}

export const listAreas = () => AREA_IDS.slice();
export const getAreaDef = (id) => getDef(id);
export const getArea = () => (W.area ? W.area.runtime : null);

/** ---------------------------------------------------------------- areas */
export async function loadArea(id, { spawn, keepCamera } = {}) {
  const def = getDef(id);
  if (!def) throw new Error(`unknown area "${id}"`);
  if (W.area) {
    W.scene.remove(W.area.group);
    W.area.dispose();
    W.area = null;
    W.fx.alphaPool.clear();
    W.fx.addPool.clear();
  }
  const area = buildArea(id, def, { mats: W.mats, meta: W.meta, tex: W.tex, water: W.water, quality: W.quality, maxAniso: W.maxAniso, fx: W.fx });
  W.area = area;
  W.scene.add(area.group);
  W.fx.smokers = area.smokers;
  area.setSeason(W.seasonName);
  W.applySeasonMats(W.seasonName);
  area.setLampStates(W.lampStates);
  area.setDecor(W.decor);
  W.rig.setArea(area);
  const a = (spawn && area.runtime.anchor(spawn)) || (keepCamera ? null : area.runtime.anchor(def.camStart) || { x: area.width / 2, z: area.height / 2 });
  if (a) W.rig.snap(a.x, a.z);
  applyEnvironment(true);
  W.env.snap();
  W.env.update(0);
  return area.runtime;
}

/** ---------------------------------------------------------------- environment */
function applyEnvironment() {
  const i = W.input;
  W.env.set({ minutes: i.minutes, season: seasonName(i.season), weather: WEATHERS.includes(i.weather) ? i.weather : 'sunny', kind: W.area ? W.area.kind : 'exterior' });
}

export function setEnvironment({ minutes = 720, season = 0, weather = 'sunny', festival = null, snap = false } = {}) {
  const prevSeason = W.seasonName;
  W.input = { minutes: ((minutes % 1560) + 1560) % 1560, season, weather, festival };
  W.seasonName = seasonName(season);
  applyEnvironment();
  if (snap) W.env.snap();
  if (W.area && prevSeason !== W.seasonName) {
    W.area.setSeason(W.seasonName);
    W.applySeasonMats(W.seasonName);
  } else if (W.area && W.area.shared && !W.area._seasonInit) {
    W.area._seasonInit = true;
  }
}

function updateLights(dt) {
  const e = W.env.s;
  const P = Math.PI;
  W.hemi.color.copy(e.hemiSky);
  W.hemi.groundColor.copy(e.hemiGnd);
  W.hemi.intensity = e.hemiInt * 2.15 + e.flash * 2;
  W.sun.color.copy(e.sunColor);
  W.sun.intensity = e.sunInt * 2.4 + e.flash * 1.5;
  const st = W.rig.st;
  const snapT = 0.12;
  const tx = Math.round(st.x / snapT) * snapT, tz = Math.round(st.z / snapT) * snapT;
  W.sun.target.position.set(tx, 0, tz);
  W.sun.position.set(tx + e.sunDir.x * 45, e.sunDir.y * 45, tz + e.sunDir.z * 45);
  W.sun.target.updateMatrixWorld();
  W.sky.position.copy(W.rig.camera.position);
  const mat = W.sky.material;
  mat.uniforms.uTop.value.copy(e.hemiSky).multiplyScalar(0.8);
  mat.uniforms.uHorizon.value.copy(e.bg);
  mat.uniforms.uNight.value = e.night;
  W.renderer.setClearColor(e.bg);
  // glass glow + cloud shadows
  W.mats.glass.emissiveIntensity = e.glow * 1.15;
  W.mats.glass.color.setScalar(1 - e.glow * 0.5);
  W.mats.glow.color.setScalar(0.7 + e.glow * 0.6);
  const cp = W.cloudPlane;
  cp.position.x = Math.round(st.x);
  cp.position.z = Math.round(st.z);
  const tex = cp.material.map;
  tex.offset.set((W.t * 0.004 + st.x / 90 * 2.4) % 1, (W.t * 0.0015 + st.z / 90 * 2.4) % 1);
  cp.material.opacity = W.area && W.area.kind === 'exterior' ? clamp(e.cloud * (1 - e.night * 0.8) * 0.3, 0, 0.3) : 0;
  cp.visible = cp.material.opacity > 0.005;
}

/** ---------------------------------------------------------------- frame */
export function update(dt) {
  if (!W.renderer) return;
  dt = Math.min(dt, 0.1);
  W.t += dt;
  W.frames++;
  W.fps += (1 / Math.max(dt, 1e-4) - W.fps) * 0.05;
  WIND.uTime.value = W.t;
  WIND.uWind.value = 1 + (W.env.s.weather === 'storm' ? 1.4 : W.env.s.weather === 'rain' ? 0.6 : 0);
  W.env.update(dt);
  W.rig.update(dt);
  const e = W.env.s;
  if (W.area) {
    const envForArea = e;
    envForArea.waterLight = e.waterLight;
    W.area.update(dt, W.t, envForArea);
  }
  const st = W.rig.st;
  W.fx.setAmounts(e, W.area ? W.area.kind : 'exterior');
  W.fx.update(dt, W.t, st.x, st.z, e, W.area ? W.area.kind : 'exterior', W.area);
  W.ambient.update(dt, W.t, st.x, st.z, e, W.area ? W.area.kind : 'exterior');
  updateLights(dt);
  // entity blob shadows
  for (const [obj, rec] of W.entities) {
    if (!rec.blob) continue;
    rec.blob.position.set(obj.position.x, 0.05, obj.position.z);
    rec.blob.visible = obj.visible;
    const lift = Math.max(0, obj.position.y);
    rec.blob.material.opacity = (W.quality === 'low' ? 0.55 : 0.32) * (1 - Math.min(1, lift * 0.6));
  }
  // highlight
  if (W.hlTarget) {
    W.hlT += dt;
    const { arrow, ring } = W.highlight.userData;
    arrow.position.y = 1.9 + Math.sin(W.hlT * 4) * 0.18;
    ring.scale.setScalar(1 + Math.sin(W.hlT * 4) * 0.1);
    ring.material.opacity = 0.55 + Math.sin(W.hlT * 4) * 0.25;
    W.hlSpark = (W.hlSpark || 0) - dt;
    if (W.hlSpark < 0) { W.hlSpark = 0.35; W.fx.play('sparkle', { x: W.hlTarget.x, z: W.hlTarget.z, y: 0.3, count: 2, color: '#fff0a0' }); }
  }
}

export function render() {
  if (!W.renderer || !W.area) return;
  const cam = W.rig.active();
  const e = W.env.s;
  if (W.post && !W.overview) {
    W.post.render(W.scene, cam, e, W.t);
  } else {
    W.renderer.setRenderTarget(null);
    W.renderer.render(W.scene, cam);
  }
  const info = W.renderer.info.render;
  W.stats.drawCalls = info.calls;
  W.stats.triangles = info.triangles;
  W.stats.fps = Math.round(W.fps);
  W.renderer.info.reset();
}

export function getStats() {
  return { drawCalls: W.stats.drawCalls, triangles: W.stats.triangles, fps: W.stats.fps };
}

/** ---------------------------------------------------------------- camera */
export function setCamera({ x, z, zoom } = {}) { if (W.rig) W.rig.setTarget(x, z, zoom); }
export function snapCamera({ x, z } = {}) { if (W.rig) W.rig.snap(x, z); }
/** lab only: top-down orthographic overview (unreachable from the game) */
export function __setOverview(on) { W.overview = !!on; W.rig.setOverview(on); }

const _ray = new THREE.Raycaster();
const _plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
export function screenToGround(clientX, clientY) {
  if (!W.renderer) return null;
  const r = W.renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  _ray.setFromCamera(ndc, W.rig.active());
  const p = new THREE.Vector3();
  return _ray.ray.intersectPlane(_plane, p) ? { x: p.x, z: p.z } : null;
}
export function groundToScreen(x, z, y = 0) {
  if (!W.renderer) return { x: 0, y: 0 };
  const r = W.renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector3(x, y, z).project(W.rig.active());
  return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
}

/** ---------------------------------------------------------------- entities */
export function addEntity(obj, { shadow = false } = {}) {
  if (!W.scene) return;
  W.entityGroup.add(obj);
  const rec = { blob: null };
  if (W.quality !== 'low') obj.traverse((o) => { if (o.isMesh && !o.userData.noShadow) o.castShadow = true; });
  if (shadow !== false && shadow !== undefined) {
    const r = typeof shadow === 'number' ? shadow : 0.45;
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(r * 2.4, r * 2.4).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: W.tex.get('softCircle'), transparent: true, depthWrite: false, color: '#20182a', opacity: 0.4, polygonOffset: true, polygonOffsetFactor: -3 }));
    blob.renderOrder = 2;
    W.scene.add(blob);
    rec.blob = blob;
  }
  W.entities.set(obj, rec);
}
export function removeEntity(obj) {
  const rec = W.entities.get(obj);
  if (!rec) return;
  W.entityGroup.remove(obj);
  if (rec.blob) { W.scene.remove(rec.blob); rec.blob.geometry.dispose(); rec.blob.material.dispose(); }
  W.entities.delete(obj);
}

/** ---------------------------------------------------------------- area state */
export function setLampStates(map) {
  Object.assign(W.lampStates, map || {});
  if (W.area) W.area.setLampStates(map);
}
export function setDecor(id) {
  W.decor = id || null;
  if (W.area) W.area.setDecor(W.decor);
}
export function setDoorOpen(tid, open) { if (W.area) W.area.setDoorOpen(tid, !!open); }
export function setHighlight(id) {
  const it = id && W.area ? W.area.runtime.interactables.find((i) => i.id === id) : null;
  W.hlTarget = it || null;
  W.highlight.visible = !!it;
  if (it) { W.highlight.position.set(it.x, 0, it.z); W.hlT = 0; }
}
export function playEffect(name, opts = {}) { if (W.fx) W.fx.play(name, opts); }

/** lab/debug access (not part of the contract) */
export const __internals = W;
export { SHAPES };
