// GPU texture cache for canvases: one THREE texture per source canvas, reference-counted so
// swapping maps / seasons / actor sets never leaks. All textures are pixel-exact (nearest, no mipmaps,
// no colour-space conversion), which is what the palette-faithful pipeline needs.
import * as THREE from 'three';

export function makePixelTexture(source) {
  const t = new THREE.Texture(source);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  t.generateMipmaps = false;
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  t.colorSpace = THREE.NoColorSpace;
  t.premultiplyAlpha = false;
  t.flipY = true;
  t.needsUpdate = true;
  return t;
}

export class TextureCache {
  constructor() {
    this._m = new Map(); // source -> {tex, refs}
  }
  /** Acquire (refs+1) the texture for a canvas. Call release(source) when done with it. */
  acquire(source) {
    let e = this._m.get(source);
    if (!e) {
      e = { tex: makePixelTexture(source), refs: 0 };
      this._m.set(source, e);
    }
    e.refs++;
    return e.tex;
  }
  /** Re-upload a canvas that was redrawn (e.g. an animated sheet). */
  refresh(source) {
    const e = this._m.get(source);
    if (e) e.tex.needsUpdate = true;
  }
  release(source) {
    const e = this._m.get(source);
    if (!e) return;
    if (--e.refs <= 0) {
      e.tex.dispose();
      this._m.delete(source);
    }
  }
  get size() {
    return this._m.size;
  }
  disposeAll() {
    for (const e of this._m.values()) e.tex.dispose();
    this._m.clear();
  }
}
