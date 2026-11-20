// GPU side of sprites: one tiny ShaderMaterial for every textured quad (tiles, sprites, shadows, emotes)
// and ActorView, the meshes that draw one Actor. Colours pass through unchanged (no colour management).
//
// GOTCHA baked in here: the world camera is y-down, which flips triangle winding => DoubleSide.
import * as THREE from 'three';

const VERT = `
uniform vec4 uRect;
varying vec2 vUv;
void main(){
  vUv = uRect.xy + uv * uRect.zw;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const FRAG = `
uniform sampler2D uMap;
uniform vec3 uTint;
uniform float uAlpha;
uniform vec4 uMix;
varying vec2 vUv;
void main(){
  vec4 c = texture2D(uMap, vUv);
  if (c.a < 0.004) discard;
  vec3 rgb = c.rgb * uTint;
  rgb = mix(rgb, uMix.rgb, uMix.a);
  gl_FragColor = vec4(rgb, c.a * uAlpha);
}`;

/** Material sampling `texture` (sub-rect via uniforms.uRect = (u0,v0,du,dv)). */
export function makePixelMaterial(texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uRect: { value: new THREE.Vector4(0, 0, 1, 1) },
      uTint: { value: new THREE.Vector3(1, 1, 1) },
      uAlpha: { value: 1 },
      uMix: { value: new THREE.Vector4(1, 1, 1, 0) },
    },
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
}

const geoCache = new Map();
/** Shared quad of w x h px anchored at bottom-centre (y-down world: spans y in [-h, 0]). uv 0..1. */
export function anchoredQuad(w, h) {
  const key = `a${w}x${h}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-w / 2, -h, 0, w / 2, -h, 0, w / 2, 0, 0, -w / 2, 0, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    geoCache.set(key, g);
  }
  return g;
}
/** Quad centred on its origin. */
export function centeredQuad(w, h) {
  const key = `c${w}x${h}`;
  let g = geoCache.get(key);
  if (!g) {
    g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-w / 2, -h / 2, 0, w / 2, -h / 2, 0, w / 2, h / 2, 0, -w / 2, h / 2, 0], 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 1, 1, 1, 1, 0, 0, 0], 2));
    g.setIndex([0, 1, 2, 0, 2, 3]);
    geoCache.set(key, g);
  }
  return g;
}
export function disposeSharedGeometry() {
  for (const g of geoCache.values()) g.dispose();
  geoCache.clear();
}

// Render order bands (three sorts transparent objects by renderOrder; everything here is transparent).
export const ORDER = { ground: 0, deco: 10, debugBelow: 20, shadow: 30, actor: 1000, above: 100000, emote: 100500, debug: 100600, weather: 101000 };

/** Soft pixel ellipse (two tones) for ground shadows. Cached per size. */
const shadowCache = new Map();
export function shadowCanvas(w, h) {
  const key = `${w}x${h}`;
  let c = shadowCache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x + 0.5 - w / 2) / (w / 2);
      const ny = (y + 0.5 - h / 2) / (h / 2);
      const d = nx * nx + ny * ny;
      const a = d <= 0.45 ? 0.36 : d <= 1 ? 0.2 : 0;
      const i = (y * w + x) * 4;
      img.data[i] = 29;
      img.data[i + 1] = 35;
      img.data[i + 2] = 64;
      img.data[i + 3] = Math.round(a * 255);
    }
  }
  ctx.putImageData(img, 0, 0);
  shadowCache.set(key, c);
  return c;
}

/** The meshes of one actor (sprite, shadow, emote bubble). Created/owned by WorldView. */
export class ActorView {
  constructor(actor, world) {
    this.actor = actor;
    this.world = world;
    this.sheetCanvas = null;
    this.sprite = null;
    this.shadow = null;
    this.shadowKey = '';
    this.emote = null;
    this.setSheet(actor.sheet);
  }

  setSheet(sheet) {
    const w = this.world;
    if (this.sheetCanvas === (sheet && sheet.canvas)) return;
    if (this.sprite) {
      w.scene.remove(this.sprite);
      this.sprite.material.dispose();
      w.textures.release(this.sheetCanvas);
      this.sprite = null;
    }
    this.sheetCanvas = null;
    if (!sheet) return;
    const tex = w.textures.acquire(sheet.canvas);
    this.sheetCanvas = sheet.canvas;
    this.sprite = new THREE.Mesh(anchoredQuad(sheet.frameW, sheet.frameH), makePixelMaterial(tex));
    this.sprite.frustumCulled = false;
    w.scene.add(this.sprite);
  }

  _ensureShadow(a) {
    const key = a.shadow ? `${a.shadowSize.w}x${a.shadowSize.h}` : '';
    if (key === this.shadowKey) return;
    if (this.shadow) {
      this.world.scene.remove(this.shadow);
      this.shadow.material.dispose();
      this.world.textures.release(this.shadowCanvasRef);
      this.shadow = null;
    }
    this.shadowKey = key;
    if (!a.shadow) return;
    const c = shadowCanvas(a.shadowSize.w, a.shadowSize.h);
    this.shadowCanvasRef = c;
    this.shadow = new THREE.Mesh(centeredQuad(a.shadowSize.w, a.shadowSize.h), makePixelMaterial(this.world.textures.acquire(c)));
    this.shadow.frustumCulled = false;
    this.shadow.renderOrder = ORDER.shadow;
    this.world.scene.add(this.shadow);
  }

  /** Push actor state into the meshes. `rank` is the actor's y-sort rank (0 = furthest back). */
  sync(rank) {
    const a = this.actor;
    const sprite = this.sprite;
    const show = a.visible && a.alpha > 0.001 && !!sprite;
    this._ensureShadow(a);
    if (sprite) {
      sprite.visible = show;
      if (show) {
        const s = a.sheet;
        const u = s.canvas.width;
        const v = s.canvas.height;
        const r = sprite.material.uniforms;
        r.uRect.value.set((a.col * s.frameW) / u, 1 - ((a.row + 1) * s.frameH) / v, s.frameW / u, s.frameH / v);
        r.uTint.value.set(a.tint[0], a.tint[1], a.tint[2]);
        r.uAlpha.value = a.alpha;
        r.uMix.value.set(a.flashColor[0], a.flashColor[1], a.flashColor[2], a.flashColor[3]);
        sprite.position.set(Math.round(a.x), Math.round(a.y) + a.yOffset, 0);
        sprite.renderOrder = ORDER.actor + rank * 2;
      }
    }
    if (this.shadow) {
      this.shadow.visible = show;
      if (show) {
        this.shadow.position.set(Math.round(a.x), Math.round(a.y) - 1, 0);
        this.shadow.material.uniforms.uAlpha.value = a.alpha;
      }
    }
    this._syncEmote(a, show);
  }

  _syncEmote(a, show) {
    const atlas = this.world.iconAtlas;
    if (!a.emoteKind || !show || !atlas) {
      if (this.emote) this.emote.visible = false;
      return;
    }
    const idx = atlas.names[`emote_${a.emoteKind}`];
    if (idx === undefined) {
      if (this.emote) this.emote.visible = false;
      return;
    }
    if (!this.emote) {
      this.emoteCanvas = atlas.canvas;
      const tex = this.world.textures.acquire(atlas.canvas);
      this.emote = new THREE.Mesh(anchoredQuad(atlas.size, atlas.size), makePixelMaterial(tex));
      this.emote.frustumCulled = false;
      this.emote.renderOrder = ORDER.emote;
      this.world.scene.add(this.emote);
    }
    const m = this.emote;
    m.visible = true;
    const size = atlas.size;
    const col = idx % atlas.cols;
    const row = Math.floor(idx / atlas.cols);
    const cw = atlas.canvas.width;
    const ch = atlas.canvas.height;
    const u = m.material.uniforms;
    u.uRect.value.set((col * size) / cw, 1 - ((row + 1) * size) / ch, size / cw, size / ch);
    const t = a.emoteTime;
    const rise = Math.max(0, 1 - t / 0.15) * 5; // pops up from 5px lower
    const bob = Math.round(Math.sin(t * 7) * 1.2);
    const fh = a.sheet ? a.sheet.frameH : 24;
    const head = a.pose === 'sleep' ? fh - 12 : a.pose === 'sit' ? fh - 4 : fh;
    u.uAlpha.value = a.emoteAlpha * a.alpha;
    m.position.set(Math.round(a.x), Math.round(a.y - head - 1 - bob + rise + a.yOffset + a.emoteOffsetY), 0);
  }

  /** Drop the emote mesh (icon atlas replaced). */
  resetEmote() {
    if (!this.emote) return;
    this.world.scene.remove(this.emote);
    this.emote.material.dispose();
    this.world.textures.release(this.emoteCanvas);
    this.emote = null;
  }

  dispose() {
    const w = this.world;
    if (this.sprite) {
      w.scene.remove(this.sprite);
      this.sprite.material.dispose();
      w.textures.release(this.sheetCanvas);
    }
    if (this.shadow) {
      w.scene.remove(this.shadow);
      this.shadow.material.dispose();
      w.textures.release(this.shadowCanvasRef);
    }
    this.resetEmote();
    this.sprite = this.shadow = null;
  }
}
