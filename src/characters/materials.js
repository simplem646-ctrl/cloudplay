/** Shared toon material, 3-tone gradient and inverted-hull outline material. Safe to import in Node. */
import * as THREE from 'three';

export const OUTLINE_COLOR = '#2a1a14';
export const OUTLINE_THICKNESS = 0.017; // world units (view space) pushed along the normal

let gradient = null;
let toon = null;
let outline = null;
const outlineUniform = { value: OUTLINE_THICKNESS };

/** 3-tone gradient: shadow / mid / lit. */
export function gradientMap() {
  if (gradient) return gradient;
  const tones = [[150, 142, 168], [214, 208, 214], [255, 255, 255]];
  const data = new Uint8Array(tones.length * 4);
  tones.forEach((t, i) => { data[i * 4] = t[0]; data[i * 4 + 1] = t[1]; data[i * 4 + 2] = t[2]; data[i * 4 + 3] = 255; });
  gradient = new THREE.DataTexture(data, tones.length, 1, THREE.RGBAFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

/** One toon material for every vertex-coloured body part of every character. */
export function toonMaterial() {
  if (!toon) toon = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradientMap() });
  return toon;
}

/** Shared BackSide material: pushes vertices along the view-space normal by a constant world thickness. */
export function outlineMaterial() {
  if (outline) return outline;
  outline = new THREE.MeshBasicMaterial({ color: OUTLINE_COLOR, side: THREE.BackSide, fog: false });
  outline.onBeforeCompile = (shader) => {
    shader.uniforms.uOutline = outlineUniform;
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', 'uniform float uOutline;\nvoid main() {')
      .replace('#include <project_vertex>', `
        vec4 mvPosition = vec4( transformed, 1.0 );
        mvPosition = modelViewMatrix * mvPosition;
        vec3 olN = normalize( normalMatrix * normal );
        mvPosition.xyz += olN * uOutline;
        gl_Position = projectionMatrix * mvPosition;`);
  };
  outline.customProgramCacheKey = () => 'lb-outline-hull';
  return outline;
}
export function setOutlineThickness(t) {
  outlineUniform.value = t;
}

/** A Mesh drawing `geo` toon-shaded plus its outline hull (two material groups = one Mesh). */
export function toonMesh(geo, material = toonMaterial(), withOutline = true) {
  if (withOutline) {
    geo.clearGroups();
    const n = geo.index ? geo.index.count : geo.attributes.position.count;
    geo.addGroup(0, n, 0);
    geo.addGroup(0, n, 1);
  }
  const mesh = new THREE.Mesh(geo, withOutline ? [material, outlineMaterial()] : material);
  mesh.frustumCulled = true;
  return mesh;
}

/** Lazily-created canvas (OffscreenCanvas when available). Returns null without any canvas support (Node). */
export function makeCanvas(w, h) {
  try {
    if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(w, h);
    if (typeof document !== 'undefined') {
      const c = document.createElement('canvas');
      c.width = w; c.height = h;
      return c;
    }
  } catch (_) { /* fall through */ }
  return null;
}
export function canvasTexture(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  return t;
}
