// Renderer: owns the WebGL canvas (exactly 320x240 backing store), the fit-to-container layout, the
// post-process grading quad, fades/flashes, and the UI canvas layer.
//
// Frame:  world scene -> 320x240 render target (nearest) -> grading quad (tint, brightness, saturation,
//         vignette, point lights, flash) -> overlay scene (fireflies) -> fade quad -> UI canvas quad.
import * as THREE from 'three';
import { VIEW_W, VIEW_H } from '../core/constants.js';
import { MAX_LIGHTS } from './worldview.js';
import { Fader, Flasher, GradingState } from './transitions.js';
import { makePixelTexture } from './textures.js';

THREE.ColorManagement.enabled = false;

const GRADE_VERT = `
varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const GRADE_FRAG = `
uniform sampler2D tMap;
uniform vec3 uTint; uniform float uBright; uniform float uSat; uniform float uVignette;
uniform vec3 uFlashCol; uniform float uFlash;
uniform int uLightN; uniform vec4 uLights[${MAX_LIGHTS}]; uniform vec3 uLightCol[${MAX_LIGHTS}];
uniform vec2 uRes; uniform float uSteps;
varying vec2 vUv;
const float BAYER[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
void main(){
  vec3 src = texture2D(tMap, vUv).rgb;
  float luma = dot(src, vec3(0.299, 0.587, 0.114));
  vec3 col = mix(vec3(luma), src, uSat) * uTint * uBright;
  vec2 q = (vUv - 0.5) * vec2(1.0, 1.15);
  col *= 1.0 - uVignette * smoothstep(0.55, 1.15, length(q) * 1.4142);
  vec2 frag = vec2(floor(vUv.x * uRes.x) + 0.5, floor((1.0 - vUv.y) * uRes.y) + 0.5);
  for (int i = 0; i < ${MAX_LIGHTS}; i++) {
    if (i >= uLightN) break;
    vec4 L = uLights[i];
    vec2 d = (frag - L.xy) * vec2(1.0, 1.18);
    float t = clamp(1.0 - length(d) / L.z, 0.0, 1.0);
    t *= t;
    if (uSteps > 0.5) {
      ivec2 bi = ivec2(mod(frag, 4.0));
      t = min(1.0, floor(t * uSteps + (BAYER[bi.x + bi.y * 4] + 0.5) / 16.0) / uSteps);
    }
    col += (src * 0.8 + 0.24) * uLightCol[i] * (t * L.w);
  }
  col = mix(col, uFlashCol, uFlash);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const FLAT_VERT = GRADE_VERT;
const UI_FRAG = `
uniform sampler2D tUI;
varying vec2 vUv;
void main(){ gl_FragColor = texture2D(tUI, vUv); }`;
const FADE_FRAG = `
uniform vec3 uColor; uniform float uAmount;
void main(){ gl_FragColor = vec4(uColor, uAmount); }`;

/** Content-box size of an element (clientWidth minus padding). */
export function contentSize(el) {
  let w = el.clientWidth;
  let h = el.clientHeight;
  try {
    const cs = getComputedStyle(el);
    w -= (parseFloat(cs.paddingLeft) || 0) + (parseFloat(cs.paddingRight) || 0);
    h -= (parseFloat(cs.paddingTop) || 0) + (parseFloat(cs.paddingBottom) || 0);
  } catch { /* detached element */ }
  return { w: Math.max(0, w), h: Math.max(0, h) };
}

/**
 * CSS size of the canvas for a container content box: integer DEVICE-pixel scale when >= 1 fits,
 * otherwise fit-to-box (fractional). Pure; exported for tests.
 * @returns {{scale:number, cssW:number, cssH:number, integer:boolean}}
 */
export function computeLayout(boxW, boxH, dpr = 1, viewW = VIEW_W, viewH = VIEW_H) {
  const fit = Math.min(boxW / viewW, boxH / viewH);
  const devInt = Math.floor((fit * dpr) / 1 + 1e-6);
  if (devInt >= 1) {
    const scale = devInt / dpr;
    return { scale, cssW: viewW * scale, cssH: viewH * scale, integer: true };
  }
  const scale = Math.max(fit, 0.01);
  return { scale, cssW: viewW * scale, cssH: viewH * scale, integer: false };
}

export class Renderer {
  /** @param {{container: HTMLElement, canvas?: HTMLCanvasElement}} o */
  constructor({ container, canvas } = {}) {
    this.container = container;
    this.width = VIEW_W;
    this.height = VIEW_H;
    const gl = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance', preserveDrawingBuffer: false });
    gl.setPixelRatio(1);
    gl.setSize(VIEW_W, VIEW_H, false);
    gl.outputColorSpace = THREE.LinearSRGBColorSpace;
    gl.autoClear = false;
    gl.toneMapping = THREE.NoToneMapping;
    this.gl = gl;
    this.domElement = gl.domElement;
    const st = this.domElement.style;
    st.imageRendering = 'pixelated';
    st.display = 'block';
    st.flex = 'none';
    st.background = '#17121f';
    this.domElement.setAttribute('aria-label', 'Game screen');

    this.rt = new THREE.WebGLRenderTarget(VIEW_W, VIEW_H, {
      minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthBuffer: false, stencilBuffer: false, generateMipmaps: false,
    });
    this.rt.texture.colorSpace = THREE.NoColorSpace;

    this.grading = new GradingState('day');
    this.fade = new Fader();
    this.flasher = new Flasher();
    /** Quantise light falloff into N dithered bands (pixel-art look). 0 = smooth. */
    this.lightSteps = 5;
    /** Apply the fade over the UI too (full-screen transitions that must hide dialogue boxes). */
    this.fadeUI = false;

    this._lightPos = new Float32Array(MAX_LIGHTS * 4);
    this._lightCol = new Float32Array(MAX_LIGHTS * 3);
    this._buildPasses();

    this.uiCanvas = null;
    this.uiTex = null;
    this.uiDirty = false;
    this.lastWorld = null;
    this.frames = 0;
    this.layout = { scale: 1, cssW: VIEW_W, cssH: VIEW_H, integer: true };
    this.perf = { ms: 16.7, fps: 60 };
    this._lastT = 0;
    this._bootGone = false;

    container.appendChild(this.domElement);
    this._onResize = () => this.resize();
    window.addEventListener('resize', this._onResize);
    if (typeof ResizeObserver !== 'undefined') {
      this._ro = new ResizeObserver(this._onResize);
      this._ro.observe(container);
    }
    this._onLost = (e) => e.preventDefault();
    this.domElement.addEventListener('webglcontextlost', this._onLost);
    this.resize();
  }

  _buildPasses() {
    const quad = new THREE.PlaneGeometry(2, 2);
    this.gradeMat = new THREE.ShaderMaterial({
      uniforms: {
        tMap: { value: this.rt.texture },
        uTint: { value: new THREE.Vector3(1, 1, 1) }, uBright: { value: 1 }, uSat: { value: 1 }, uVignette: { value: 0 },
        uFlashCol: { value: new THREE.Vector3(1, 1, 1) }, uFlash: { value: 0 },
        uLightN: { value: 0 }, uLights: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4()) },
        uLightCol: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector3()) },
        uRes: { value: new THREE.Vector2(VIEW_W, VIEW_H) }, uSteps: { value: this.lightSteps },
      },
      vertexShader: GRADE_VERT, fragmentShader: GRADE_FRAG, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    });
    this.gradeScene = new THREE.Scene();
    const gm = new THREE.Mesh(quad, this.gradeMat);
    gm.frustumCulled = false;
    this.gradeScene.add(gm);

    this.fadeMat = new THREE.ShaderMaterial({
      uniforms: { uColor: { value: new THREE.Vector3() }, uAmount: { value: 0 } },
      vertexShader: FLAT_VERT, fragmentShader: FADE_FRAG, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    });
    this.fadeScene = new THREE.Scene();
    const fm = new THREE.Mesh(quad, this.fadeMat);
    fm.frustumCulled = false;
    this.fadeScene.add(fm);

    this.uiMat = new THREE.ShaderMaterial({
      uniforms: { tUI: { value: null } },
      vertexShader: FLAT_VERT, fragmentShader: UI_FRAG, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, toneMapped: false,
    });
    this.uiScene = new THREE.Scene();
    const um = new THREE.Mesh(quad, this.uiMat);
    um.frustumCulled = false;
    this.uiScene.add(um);
    this.dummyCam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this._quad = quad;
  }

  // ---- layout ---------------------------------------------------------------------------------
  /** Re-measure the container (content box) and rescale the canvas with CSS. Called on resize. */
  resize() {
    const { w, h } = contentSize(this.container);
    if (w <= 0 || h <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    const l = computeLayout(w, h, dpr);
    this.layout = l;
    const st = this.domElement.style;
    st.width = `${l.cssW}px`;
    st.height = `${l.cssH}px`;
    this.container.dataset.scale = String(l.scale);
  }

  // ---- UI layer -------------------------------------------------------------------------------
  /** The 320x240 Canvas2D the UI toolkit draws into; composited on top of the graded world. */
  setUICanvas(canvas) {
    if (this.uiTex) this.uiTex.dispose();
    this.uiCanvas = canvas;
    this.uiTex = canvas ? makePixelTexture(canvas) : null;
    this.uiMat.uniforms.tUI.value = this.uiTex;
    this.uiDirty = true;
  }
  /** Re-upload the UI canvas on the next frame (call after drawing into it). */
  markUIDirty() {
    this.uiDirty = true;
  }

  // ---- effects --------------------------------------------------------------------------------
  /** Jump to a grading preset name ('day'|'dawn'|'sunset'|'night'|'lantern'|'indoor') or object. */
  setGrading(g) {
    this.grading.set(g);
  }
  /** Tween grading; resolves when finished. `g` may be partial: {tint, brightness, saturation, vignette}. */
  tweenGrading(g, ms = 1500, ease = 'inOut') {
    return this.grading.tween(g, ms, ease);
  }
  /** Screen flash (mix toward colour, decays). */
  flash(color = '#ffffff', strength = 1, ms = 180, holdMs = 0) {
    this.flasher.trigger(color, strength, ms, holdMs);
  }
  /** Advance fades/tweens/flashes by dt seconds (the app calls this from the fixed step). */
  update(dt) {
    this.grading.update(dt);
    this.fade.update(dt);
    this.flasher.update(dt);
  }

  // ---- drawing --------------------------------------------------------------------------------
  /** Draw one frame of `world` (WorldView): world -> grade -> overlay -> fade -> UI. */
  render(world) {
    const gl = this.gl;
    const now = performance.now();
    if (this._lastT) {
      const ms = now - this._lastT;
      this.perf.ms += (ms - this.perf.ms) * 0.05;
      this.perf.fps = 1000 / this.perf.ms;
    }
    this._lastT = now;
    this.lastWorld = world;
    world.beforeRender();

    gl.setRenderTarget(this.rt);
    gl.setClearColor(world.background, 1);
    gl.clear(true, false, false);
    gl.render(world.scene, world.threeCamera);

    gl.setRenderTarget(null);
    const g = this.grading.current;
    const u = this.gradeMat.uniforms;
    u.uTint.value.set(g.tint[0], g.tint[1], g.tint[2]);
    u.uBright.value = g.brightness;
    u.uSat.value = g.saturation;
    u.uVignette.value = g.vignette;
    u.uSteps.value = this.lightSteps;
    u.uFlash.value = this.flasher.amount;
    u.uFlashCol.value.set(this.flasher.color[0], this.flasher.color[1], this.flasher.color[2]);
    const n = world.collectLights(this._lightPos, this._lightCol);
    u.uLightN.value = n;
    for (let i = 0; i < n; i++) {
      u.uLights.value[i].set(this._lightPos[i * 4], this._lightPos[i * 4 + 1], this._lightPos[i * 4 + 2], this._lightPos[i * 4 + 3]);
      u.uLightCol.value[i].set(this._lightCol[i * 3], this._lightCol[i * 3 + 1], this._lightCol[i * 3 + 2]);
    }
    gl.render(this.gradeScene, this.dummyCam);
    if (world.hasOverlay) gl.render(world.overlayScene, world.threeCamera);

    const fadeOn = this.fade.amount > 0.001;
    if (fadeOn) {
      this.fadeMat.uniforms.uColor.value.set(this.fade.color[0], this.fade.color[1], this.fade.color[2]);
      this.fadeMat.uniforms.uAmount.value = this.fade.amount;
    }
    if (fadeOn && !this.fadeUI) gl.render(this.fadeScene, this.dummyCam);
    if (this.uiTex) {
      if (this.uiDirty) {
        this.uiTex.needsUpdate = true;
        this.uiDirty = false;
      }
      gl.render(this.uiScene, this.dummyCam);
    }
    if (fadeOn && this.fadeUI) gl.render(this.fadeScene, this.dummyCam);

    this.frames++;
    if (!this._bootGone) {
      this._bootGone = true;
      const boot = this.container.querySelector('#boot');
      if (boot) boot.remove();
    }
  }

  /** PNG data URL of the current frame (re-renders the last world so the buffer is readable). */
  toDataURL(type = 'image/png') {
    if (this.lastWorld) this.render(this.lastWorld);
    return this.domElement.toDataURL(type);
  }

  /** three.js memory counters (geometries/textures alive) for leak checks. */
  get memory() {
    return { ...this.gl.info.memory };
  }

  dispose() {
    window.removeEventListener('resize', this._onResize);
    if (this._ro) this._ro.disconnect();
    this.domElement.removeEventListener('webglcontextlost', this._onLost);
    this.rt.dispose();
    this._quad.dispose();
    this.gradeMat.dispose();
    this.fadeMat.dispose();
    this.uiMat.dispose();
    if (this.uiTex) this.uiTex.dispose();
    this.gl.dispose();
    this.domElement.remove();
  }
}

export function createRenderer(opts) {
  return new Renderer(opts);
}
