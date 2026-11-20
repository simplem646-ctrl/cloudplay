// TileMap: three layers (ground, deco, above), each ONE mesh of textured quads sampling the tileset
// atlas. Animated tiles are advanced per quad (meta[i].anim = {frames, fps}); the season swap just
// replaces the atlas texture. All geometry/texture handles are released by dispose().
import * as THREE from 'three';
import { TILE } from '../core/constants.js';
import { makePixelMaterial, ORDER } from './sprites.js';

export const LAYER_NAMES = ['ground', 'deco', 'above'];
const LAYER_ORDER = { ground: ORDER.ground, deco: ORDER.deco, above: ORDER.above };

function hash2(x, y) {
  let h = Math.imul(x + 374761393, 668265263) ^ Math.imul(y + 1442695041, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

class LayerMesh {
  constructor(tileMap, name) {
    this.tm = tileMap;
    this.name = name;
    this.mesh = null;
    this.uv = null;
    this.anims = []; // {slot, frames, fps, phase, last}
  }

  build() {
    const tm = this.tm;
    const { width: w, height: h } = tm.map;
    const data = tm.map.layers[this.name];
    this.dispose();
    if (!data) return;
    let n = 0;
    for (let i = 0; i < w * h; i++) if (data[i]) n++;
    if (!n) return;
    const pos = new Float32Array(n * 8);
    const uv = new Float32Array(n * 8);
    const idx = n * 4 > 65535 ? new Uint32Array(n * 6) : new Uint16Array(n * 6);
    this.anims = [];
    let q = 0;
    for (let ty = 0; ty < h; ty++) {
      for (let tx = 0; tx < w; tx++) {
        const t = data[ty * w + tx];
        if (!t) continue;
        const x0 = tx * TILE;
        const y0 = ty * TILE;
        const p = q * 8;
        pos[p] = x0; pos[p + 1] = y0;
        pos[p + 2] = x0 + TILE; pos[p + 3] = y0;
        pos[p + 4] = x0 + TILE; pos[p + 5] = y0 + TILE;
        pos[p + 6] = x0; pos[p + 7] = y0 + TILE;
        const v = q * 4;
        const k = q * 6;
        idx[k] = v; idx[k + 1] = v + 1; idx[k + 2] = v + 2;
        idx[k + 3] = v; idx[k + 4] = v + 2; idx[k + 5] = v + 3;
        tm.writeUV(uv, q, t);
        const meta = tm.tileset.meta && tm.tileset.meta[t];
        if (meta && meta.anim && meta.anim.frames && meta.anim.frames.length > 1) {
          // water highlights stay in sync across the pond; flowers/flames are de-phased per tile
          const phase = meta.water ? 0 : hash2(tx, ty) % meta.anim.frames.length;
          this.anims.push({ slot: q, frames: meta.anim.frames, fps: meta.anim.fps || 3, phase, last: -1 });
        }
        q++;
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 12), 3));
    // positions are 2D in the source arrays; expand to xyz
    const p3 = g.attributes.position.array;
    for (let i = 0; i < n * 4; i++) {
      p3[i * 3] = pos[i * 2];
      p3[i * 3 + 1] = pos[i * 2 + 1];
      p3[i * 3 + 2] = 0;
    }
    this.uv = new THREE.BufferAttribute(uv, 2);
    this.uv.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('uv', this.uv);
    g.setIndex(new THREE.BufferAttribute(idx, 1));
    const mat = makePixelMaterial(tm.texture);
    const mesh = new THREE.Mesh(g, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = LAYER_ORDER[this.name];
    this.mesh = mesh;
    tm.scene.add(mesh);
  }

  setTexture(tex) {
    if (this.mesh) this.mesh.material.uniforms.uMap.value = tex;
  }

  /** Advance animated tiles to time t (seconds). */
  animate(t) {
    if (!this.anims.length) return;
    let dirty = false;
    const arr = this.uv.array;
    for (let i = 0; i < this.anims.length; i++) {
      const a = this.anims[i];
      const tick = Math.floor(t * a.fps) + a.phase;
      if (tick === a.last) continue;
      a.last = tick;
      this.tm.writeUV(arr, a.slot, a.frames[tick % a.frames.length]);
      dirty = true;
    }
    if (dirty) this.uv.needsUpdate = true;
  }

  dispose() {
    if (this.mesh) {
      this.tm.scene.remove(this.mesh);
      this.mesh.geometry.dispose();
      this.mesh.material.dispose();
      this.mesh = null;
    }
    this.uv = null;
    this.anims = [];
  }
}

export class TileMap {
  /**
   * @param {THREE.Scene} scene
   * @param {object} map      MapDef {width,height,layers:{ground,deco,above}}
   * @param {object} tileset  {canvas, cols, rows, tileSize, names, meta[]}
   * @param {TextureCache} textures
   */
  constructor(scene, map, tileset, textures) {
    this.scene = scene;
    this.map = map;
    this.textures = textures;
    this.tileset = null;
    this.texture = null;
    this.layers = LAYER_NAMES.map((n) => new LayerMesh(this, n));
    this.time = 0;
    this._setTileset(tileset);
    for (const l of this.layers) l.build();
  }

  _setTileset(tileset) {
    const old = this.tileset;
    this.texture = this.textures.acquire(tileset.canvas);
    if (old) this.textures.release(old.canvas);
    this.tileset = tileset;
    this._tw = tileset.canvas.width;
    this._th = tileset.canvas.height;
    this._cols = tileset.cols || Math.floor(this._tw / (tileset.tileSize || TILE));
    this._ts = tileset.tileSize || TILE;
  }

  /** Write the 4 uv pairs of quad `q` for tile index `t`. */
  writeUV(arr, q, t) {
    const col = t % this._cols;
    const row = Math.floor(t / this._cols);
    const u0 = (col * this._ts) / this._tw;
    const u1 = ((col + 1) * this._ts) / this._tw;
    const vTop = 1 - (row * this._ts) / this._th;
    const vBot = 1 - ((row + 1) * this._ts) / this._th;
    const o = q * 8;
    arr[o] = u0; arr[o + 1] = vTop;
    arr[o + 2] = u1; arr[o + 3] = vTop;
    arr[o + 4] = u1; arr[o + 5] = vBot;
    arr[o + 6] = u0; arr[o + 7] = vBot;
  }

  /** Swap the atlas (new season). Indices are identical across seasons, so no rebuild unless animation meta differs. */
  setTileset(tileset) {
    const sameMeta = tileset.meta === this.tileset.meta;
    this._setTileset(tileset);
    for (const l of this.layers) {
      if (!sameMeta && l.mesh) l.build();
      else l.setTexture(this.texture);
    }
    this.animate(this.time);
  }

  /** Change one tile at runtime (opening a door, placing an item). Rebuilds that layer's quads. */
  setTile(layer, tx, ty, index) {
    const { width, height } = this.map;
    if (tx < 0 || ty < 0 || tx >= width || ty >= height) return;
    this.map.layers[layer][ty * width + tx] = index;
    this.layers[LAYER_NAMES.indexOf(layer)].build();
  }

  animate(t) {
    this.time = t;
    for (const l of this.layers) l.animate(t);
  }

  dispose() {
    for (const l of this.layers) l.dispose();
    if (this.tileset) this.textures.release(this.tileset.canvas);
    this.tileset = null;
  }
}
