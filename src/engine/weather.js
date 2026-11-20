// Weather particles: rain, storm (+ lightning), snow, petals, leaves, fireflies.
// Every particle is a pixel-snapped quad moved entirely in the vertex shader (zero per-frame CPU work,
// one draw call per layer), so it is cheap even on software WebGL. Intensity changes the number of
// quads drawn (drawRange) and ramps smoothly.
//
// Rain/snow/petals/leaves live in the world pass above the `above` layer (so they are graded with the
// scene); fireflies are glowing additive sprites drawn in an overlay pass AFTER grading so the night
// tint does not dim them.
import * as THREE from 'three';
import { ORDER } from './sprites.js';

const VERT = `
attribute vec4 aSeed;
uniform float uTime; uniform vec2 uView; uniform vec2 uCam; uniform vec2 uVel; uniform vec2 uSize;
uniform vec2 uSway; uniform float uParallax; uniform float uSpeedVar; uniform float uMode; uniform float uWander;
uniform vec3 uCol[4]; uniform float uColN;
varying vec2 vLocal; varying vec3 vCol; varying float vPhase;
void main(){
  float margin = 12.0;
  vec2 span = uView + vec2(margin * 2.0);
  float f = 1.0 + (aSeed.z - 0.5) * uSpeedVar;
  vec2 p = aSeed.xy * span + uVel * f * uTime;
  p.x += sin(uTime * uSway.y * (0.7 + aSeed.w * 0.6) + aSeed.w * 6.2831) * uSway.x;
  p.y += cos(uTime * uSway.y * 0.77 * (0.7 + aSeed.z * 0.6) + aSeed.z * 6.2831) * uSway.x * uWander;
  p -= uCam * uParallax;
  p = mod(p, span) - vec2(margin);
  vec2 size = uSize;
  if (uMode > 2.5 && mod(floor(uTime * 2.0 + aSeed.w * 8.0), 2.0) > 0.5) size = size.yx;
  p = floor(p);
  vec2 local = position.xy * size;
  vec2 v = p + local;
  gl_Position = vec4(v.x / uView.x * 2.0 - 1.0, 1.0 - v.y / uView.y * 2.0, 0.0, 1.0);
  vLocal = local;
  vPhase = aSeed.w;
  vCol = uCol[int(floor(fract(aSeed.w * 7.13) * uColN))];
}`;

const FRAG = `
uniform float uMode; uniform float uTime; uniform float uAlpha; uniform vec2 uSize; uniform vec2 uVel;
varying vec2 vLocal; varying vec3 vCol; varying float vPhase;
void main(){
  vec2 px = floor(vLocal);
  float a = uAlpha;
  vec3 c = vCol;
  if (uMode > 0.5 && uMode < 1.5) {
    float slope = abs(uVel.x / uVel.y);
    float expectX = floor(px.y * slope);
    float xi = uVel.x >= 0.0 ? px.x : (uSize.x - 1.0 - px.x);
    if (xi != expectX) discard;
    a *= mix(0.3, 1.0, px.y / max(uSize.y - 1.0, 1.0));
  } else if (uMode > 1.5 && uMode < 2.5) {
    vec2 d = abs(px - floor(uSize * 0.5));
    float m = d.x + d.y;
    float pulse = smoothstep(0.1, 0.8, 0.5 + 0.5 * sin(uTime * (1.4 + vPhase * 1.6) + vPhase * 40.0));
    if (m < 0.5) { a *= pulse; c = mix(c, vec3(1.0), 0.3); }
    else if (m < 1.5) a *= pulse * 0.5;
    else if (m < 2.5) a *= pulse * 0.16;
    else discard;
  } else if (uMode > 2.5) {
    if (px.x + px.y < 0.5) c = mix(c, vec3(1.0), 0.35);
    else if (px.x + px.y > uSize.x + uSize.y - 2.5) c *= 0.78;
  }
  gl_FragColor = vec4(c, a);
}`;

// Effect table. vel = px/s, sway = [amplitude px, frequency], parallax = how much camera motion shifts
// the layer (0 = screen-fixed, 1 = world-fixed). mode: 0 solid, 1 streak, 2 glow, 3 leaf/petal.
const EFFECTS = {
  rain: {
    layers: [
      { count: 150, mode: 1, size: [2, 7], vel: [58, 236], speedVar: 0.25, sway: [0, 0], parallax: 0.0, alpha: 0.6, colors: ['#cfe6ff'] },
      { count: 110, mode: 1, size: [2, 4], vel: [46, 188], speedVar: 0.25, sway: [0, 0], parallax: 0.0, alpha: 0.38, colors: ['#a9cdf0'] },
    ],
  },
  storm: {
    layers: [
      { count: 240, mode: 1, size: [3, 8], vel: [126, 268], speedVar: 0.25, sway: [0, 0], parallax: 0.0, alpha: 0.66, colors: ['#d6e8ff'] },
      { count: 170, mode: 1, size: [2, 5], vel: [104, 214], speedVar: 0.25, sway: [0, 0], parallax: 0.0, alpha: 0.4, colors: ['#a3c4ea'] },
    ],
    lightning: true,
  },
  snow: {
    layers: [
      { count: 90, mode: 0, size: [1, 1], vel: [-5, 20], speedVar: 0.5, sway: [7, 1.3], parallax: 0.25, alpha: 0.85, colors: ['#ffffff'] },
      { count: 46, mode: 0, size: [2, 2], vel: [-8, 30], speedVar: 0.4, sway: [9, 1.0], parallax: 0.5, alpha: 0.95, colors: ['#ffffff', '#e6f2ff'] },
    ],
  },
  petals: {
    layers: [
      { count: 30, mode: 3, size: [3, 2], vel: [26, 17], speedVar: 0.6, sway: [10, 1.5], parallax: 0.4, alpha: 1, colors: ['#f08fb0', '#f4b6c8', '#ffd0de'] },
    ],
  },
  leaves: {
    layers: [
      { count: 26, mode: 3, size: [3, 2], vel: [22, 21], speedVar: 0.6, sway: [13, 1.2], parallax: 0.4, alpha: 1, colors: ['#d9782f', '#b5503c', '#e0a43a', '#8a5a2b'] },
    ],
  },
  fireflies: {
    overlay: true,
    layers: [
      { count: 26, mode: 2, size: [5, 5], vel: [0, 0], speedVar: 0, sway: [16, 0.55], wander: 1, parallax: 1, alpha: 0.95, colors: ['#e8f58a', '#b8f080'], additive: true },
    ],
  },
};

export const WEATHER_EFFECTS = Object.keys(EFFECTS);
/** sim WEATHER_KINDS (sunny|cloudy|rain|storm|snow) -> particle effect name or null */
export const WEATHER_KIND_EFFECT = { sunny: null, cloudy: null, none: null, clear: null, rain: 'rain', storm: 'storm', snow: 'snow', petals: 'petals', leaves: 'leaves', fireflies: 'fireflies' };

class ParticleLayer {
  constructor(def, view, overlay) {
    this.def = def;
    this.max = def.count;
    const n = def.count;
    const pos = new Float32Array(n * 12);
    const seed = new Float32Array(n * 16);
    const idx = new Uint16Array(n * 6);
    const corners = [0, 0, 1, 0, 1, 1, 0, 1];
    for (let i = 0; i < n; i++) {
      // stratified so particles cover the screen evenly instead of clumping
      const sx = ((i + Math.random()) / n + 0.0) % 1;
      const sy = Math.random();
      const sz = Math.random();
      const sw = Math.random();
      for (let c = 0; c < 4; c++) {
        pos[(i * 4 + c) * 3] = corners[c * 2];
        pos[(i * 4 + c) * 3 + 1] = corners[c * 2 + 1];
        const o = (i * 4 + c) * 4;
        seed[o] = sx; seed[o + 1] = sy; seed[o + 2] = sz; seed[o + 3] = sw;
      }
      const v = i * 4;
      idx.set([v, v + 1, v + 2, v, v + 2, v + 3], i * 6);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    g.setDrawRange(0, 0);
    const cols = [];
    for (let i = 0; i < 4; i++) cols.push(new THREE.Color(def.colors[i % def.colors.length]));
    this.material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uView: { value: new THREE.Vector2(view.w, view.h) },
        uCam: { value: new THREE.Vector2() },
        uVel: { value: new THREE.Vector2(def.vel[0], def.vel[1] || 0.0001) },
        uSize: { value: new THREE.Vector2(def.size[0], def.size[1]) },
        uSway: { value: new THREE.Vector2(def.sway[0], def.sway[1]) },
        uParallax: { value: def.parallax },
        uSpeedVar: { value: def.speedVar },
        uMode: { value: def.mode },
        uWander: { value: def.wander || 0 },
        uAlpha: { value: def.alpha },
        uCol: { value: cols.map((c) => new THREE.Vector3(c.r, c.g, c.b)) },
        uColN: { value: Math.min(4, def.colors.length) },
      },
      vertexShader: VERT,
      fragmentShader: FRAG,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      side: THREE.DoubleSide,
      blending: def.additive ? THREE.AdditiveBlending : THREE.NormalBlending,
      toneMapped: false,
    });
    this.mesh = new THREE.Mesh(g, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = ORDER.weather;
    this.mesh.visible = false;
    (overlay || view.scene).add(this.mesh);
    this.parent = overlay || view.scene;
  }
  set(time, cam, count) {
    const u = this.material.uniforms;
    u.uTime.value = time;
    u.uCam.value.set(cam.px, cam.py);
    this.mesh.visible = count > 0;
    this.mesh.geometry.setDrawRange(0, count * 6);
  }
  dispose() {
    this.parent.remove(this.mesh);
    this.mesh.geometry.dispose();
    this.material.dispose();
  }
}

class Effect {
  constructor(name, view) {
    this.name = name;
    this.def = EFFECTS[name];
    this.layers = this.def.layers.map((l) => new ParticleLayer(l, view, this.def.overlay ? view.overlayScene : null));
    this.cur = 0;
    this.target = 0;
    this.rate = 1 / 1.5;
  }
}

export class Weather {
  /** @param {{scene, overlayScene, w, h}} view */
  constructor(view) {
    this.view = view;
    this.effects = new Map();
    this.time = 0;
    this.quality = 'high';
    this.onLightning = null; // () => void ; the app flashes the screen and emits a bus event
    this._bolt = 4 + Math.random() * 6;
    this._pending = 0;
    this._pendingCount = 0;
  }

  /** Kind currently dominant ('rain'|'storm'|... or 'none'). */
  get kind() {
    let best = 'none';
    let bi = 0.001;
    for (const e of this.effects.values()) if (e.target > bi) { best = e.name; bi = e.target; }
    return best;
  }
  /** Target intensity (0..1) of an effect. */
  intensity(name) {
    const e = this.effects.get(name);
    return e ? e.target : 0;
  }

  /** Set one effect's intensity (0 = off), ramping over rampSec. Other effects are untouched. */
  set(name, intensity = 1, rampSec = 1.5) {
    if (!EFFECTS[name]) throw new Error(`Unknown weather effect "${name}" (${WEATHER_EFFECTS.join(', ')})`);
    let e = this.effects.get(name);
    if (!e) {
      if (intensity <= 0) return;
      e = new Effect(name, this.view);
      this.effects.set(name, e);
    }
    e.target = Math.max(0, Math.min(1, intensity));
    e.rate = rampSec <= 0 ? 1e6 : 1 / rampSec;
  }

  /** Make `kind` the only precipitation: turns off other effects except those named in `keep`. */
  setExclusive(kind, intensity = 1, rampSec = 1.5, keep = ['fireflies']) {
    const name = WEATHER_KIND_EFFECT[kind];
    if (name === undefined) throw new Error(`Unknown weather kind "${kind}"`);
    for (const e of this.effects.values()) if (e.name !== name && !keep.includes(e.name)) e.target = 0;
    if (name) this.set(name, intensity, rampSec);
  }
  clear(rampSec = 1) {
    for (const e of this.effects.values()) {
      e.target = 0;
      e.rate = rampSec <= 0 ? 1e6 : 1 / rampSec;
    }
  }

  setQuality(q) {
    this.quality = q;
  }

  /** Trigger a lightning strike now (double flash). */
  strike() {
    if (this.onLightning) this.onLightning();
    this._pending = 0.14 + Math.random() * 0.1;
  }

  update(dt, cam) {
    this.time += dt;
    const qm = this.quality === 'low' ? 0.5 : 1;
    for (const [name, e] of this.effects) {
      const step = e.rate * dt;
      e.cur = e.cur < e.target ? Math.min(e.target, e.cur + step) : Math.max(e.target, e.cur - step);
      e.layers.forEach((l) => l.set(this.time, cam, Math.round(l.max * e.cur * qm)));
      if (e.cur <= 0 && e.target <= 0) {
        e.layers.forEach((l) => l.dispose());
        this.effects.delete(name);
      }
    }
    const storm = this.effects.get('storm');
    if (storm && storm.target > 0.25) {
      this._bolt -= dt;
      if (this._bolt <= 0) {
        this._bolt = 4 + Math.random() * 8;
        this.strike();
      }
    }
    if (this._pending > 0) {
      this._pending -= dt;
      if (this._pending <= 0 && this.onLightning) this.onLightning();
    }
  }

  dispose() {
    for (const e of this.effects.values()) e.layers.forEach((l) => l.dispose());
    this.effects.clear();
  }
}
