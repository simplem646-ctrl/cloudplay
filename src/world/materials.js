/**
 * Shared material library for every area: Lambert materials with painterly textures, a wind-sway patch for
 * foliage/grass, seasonal leaf palettes, emissive window glass and the animated water shader.
 */
import * as THREE from 'three';

/** wind uniforms shared by every patched material (updated once per frame by the engine) */
export const WIND = { uTime: { value: 0 }, uWind: { value: 1 } };

const col = (hex) => new THREE.Color(hex);

export const LEAF_PALETTES = {
  leaf: {
    spring: ['#a6e07a', '#86cc62'], summer: ['#6cc552', '#48a644'], autumn: ['#f2a640', '#d4642c'], winter: ['#93b0a2', '#93b0a2'],
  },
  blossom: {
    spring: ['#ffd0e0', '#ffa8c8'], summer: ['#7ed05c', '#58b24c'], autumn: ['#efa458', '#d27a3e'], winter: ['#ffd0e0', '#ffd0e0'],
  },
  birch: {
    spring: ['#bdeb90', '#a3dc78'], summer: ['#86d462', '#a6dc70'], autumn: ['#ffd84e', '#f2b030'], winter: ['#bdeb90', '#bdeb90'],
  },
  willow: {
    spring: ['#bfe885', '#a4d870'], summer: ['#84c85e', '#6cb458'], autumn: ['#ddc765', '#c8a644'], winter: ['#a8c4a0', '#a8c4a0'],
  },
  pine: {
    spring: ['#4a9a64', '#357a54'], summer: ['#3f8a5a', '#2f6b4f'], autumn: ['#3f8a5a', '#2f6b4f'], winter: ['#58a078', '#3f8662'],
  },
};

function patchWind(mat, { leaf = null } = {}) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = WIND.uTime;
    shader.uniforms.uWind = WIND.uWind;
    if (leaf) {
      shader.uniforms.uLeafA = leaf.A;
      shader.uniforms.uLeafB = leaf.B;
    }
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
uniform float uTime; uniform float uWind;
attribute float sway; attribute float tone;
${leaf ? 'uniform vec3 uLeafA; uniform vec3 uLeafB;' : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  vec3 ip = instanceMatrix[3].xyz;
#else
  vec3 ip = vec3(0.0);
#endif
  float ph = (transformed.x + ip.x) * 0.8 + (transformed.z + ip.z) * 0.65;
  float gust = 0.6 + 0.4 * sin(uTime * 0.37 + (ip.x + transformed.x) * 0.08);
  transformed.x += (sin(uTime * 1.9 + ph) * 0.6 + sin(uTime * 0.7 + ph * 0.5) * 0.4) * sway * uWind * gust;
  transformed.z += cos(uTime * 1.4 + ph * 1.1) * sway * uWind * 0.5 * gust;`);
    if (leaf) {
      shader.vertexShader = shader.vertexShader.replace('#include <color_vertex>', `#include <color_vertex>
  vColor.rgb *= mix(uLeafA, uLeafB, tone);`);
    }
  };
  mat.customProgramCacheKey = () => (leaf ? 'windleaf' : 'wind');
}

/**
 * @param {ReturnType<import('./textures.js').createTextureLibrary>} tex
 */
export function createMaterials(tex) {
  const mats = {};
  const meta = {};
  const lam = (key, map, extra = {}, m = {}) => {
    const mat = new THREE.MeshLambertMaterial({ map: map ? tex.get(map) : null, vertexColors: true, ...extra });
    mats[key] = mat;
    meta[key] = { cast: true, receive: true, ...m };
    return mat;
  };

  lam('plaster', 'plaster');
  lam('trim', 'plaster');
  lam('brick', 'brick');
  lam('stone', 'stone');
  lam('plankwall', 'plankWall');
  lam('shingle', 'shingle');
  lam('thatch', 'thatch');
  lam('slate', 'slate');
  lam('wood', 'wood');
  lam('wooddark', 'woodDark');
  lam('bark', 'bark');
  lam('birchbark', 'birch');
  lam('flat', null);
  lam('metal', null, { emissive: new THREE.Color(0x0a0a10) });
  lam('cloth', null, { side: THREE.DoubleSide });
  lam('snow', null, { emissive: new THREE.Color(0x0a1018) });
  lam('ground', null);
  lam('glassdark', null);
  // door texture (non repeating) used by door meshes
  lam('door', 'door');

  // glass: day = bluish reflective pane, night = warm emissive glow
  const glass = new THREE.MeshLambertMaterial({
    map: tex.get('glass'), emissiveMap: tex.get('glassWarm'), emissive: new THREE.Color(0xffffff), emissiveIntensity: 0, vertexColors: true,
  });
  mats.glass = glass;
  meta.glass = { cast: false, receive: false };

  // wind-swayed foliage materials (palette uniforms updated by setSeason)
  const palettes = {};
  for (const key of Object.keys(LEAF_PALETTES)) {
    const A = { value: col('#6cc552') };
    const B = { value: col('#48a644') };
    palettes[key] = { A, B };
    const m = lam(`leaf_${key}`, 'leaves', { side: THREE.FrontSide }, { cast: true, receive: true });
    patchWind(m, { leaf: { A, B } });
  }
  // grass / flowers (instanced) use plain wind patch
  const grass = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  patchWind(grass);
  mats.grass = grass;
  meta.grass = { cast: false, receive: false };
  const stems = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  patchWind(stems);
  mats.flowerStem = stems;
  const heads = new THREE.MeshLambertMaterial({ vertexColors: true });
  patchWind(heads);
  mats.flowerHead = heads;
  // wind-swayed generic (cloth, banners, laundry) shares wind but is a MeshLambert w/ vertex colours + double side
  const sway = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  patchWind(sway);
  mats.swaycloth = sway;
  meta.swaycloth = { cast: true, receive: true };
  // wind-swayed willow strands etc use leaf_willow.

  // unlit / emissive bits (lantern flame, paper lanterns); brightness driven per frame
  mats.glow = new THREE.MeshBasicMaterial({ vertexColors: true });
  meta.glow = { cast: false, receive: false };

  // soft additive/alpha helpers
  mats.decal = new THREE.MeshBasicMaterial({ map: tex.get('softCircle'), transparent: true, depthWrite: false, color: 0x2a2030, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });

  const applySeason = (season) => {
    for (const [key, p] of Object.entries(palettes)) {
      const set = LEAF_PALETTES[key][season] || LEAF_PALETTES[key].summer;
      p.A.value.set(set[0]);
      p.B.value.set(set[1]);
    }
    mats.grass.color.set(season === 'winter' ? '#b8c8c8' : season === 'autumn' ? '#e8d890' : '#ffffff');
    mats.grass.emissive.set(season === 'winter' ? '#8497a6' : '#000000');
  };

  return { mats, meta, palettes, applySeason };
}

export function createWaterMaterial(tex) {
  const uniforms = {
    uTime: { value: 0 },
    uNoise: { value: tex.get('noise') },
    uDeep: { value: col('#2f9fb0') },
    uShallow: { value: col('#7fd4cf') },
    uFlow: { value: new THREE.Vector2(0.0, 0.0) },
    uLight: { value: new THREE.Color(1, 1, 1) },
    uSpark: { value: 1 },
    uAlpha: { value: 0.86 },
    uScale: { value: 0.16 },
  };
  const mat = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 vW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vW = wp.xz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uTime; uniform sampler2D uNoise; uniform vec3 uDeep; uniform vec3 uShallow; uniform vec2 uFlow;
      uniform vec3 uLight; uniform float uSpark; uniform float uAlpha; uniform float uScale;
      varying vec2 vW;
      void main() {
        vec2 p = vW * uScale;
        vec2 f = uFlow * uTime;
        float n1 = texture2D(uNoise, p + f * 0.5 + vec2(uTime * 0.012, 0.0)).r;
        float n2 = texture2D(uNoise, p * 1.9 - f * 0.8 + vec2(0.0, uTime * 0.017)).g;
        float n3 = texture2D(uNoise, p * 3.7 + f * 1.3 - vec2(uTime * 0.02, uTime * 0.01)).b;
        float h = n1 * 0.5 + n2 * 0.35 + n3 * 0.25;
        vec3 c = mix(uDeep, uShallow, smoothstep(0.25, 0.8, h));
        // soft ripple bands
        float rip = smoothstep(0.78, 0.9, sin((n1 * 6.0 + n2 * 4.0) * 3.14159 + uTime * 0.9) * 0.5 + 0.5);
        c += vec3(0.5, 0.65, 0.7) * rip * 0.09;
        // sparkles
        float sp = smoothstep(0.86, 0.97, texture2D(uNoise, p * 4.5 + vec2(uTime * 0.03, -uTime * 0.02)).r * 0.55 + n3 * 0.5);
        float tw = 0.55 + 0.45 * sin(uTime * 3.0 + n2 * 40.0);
        c += vec3(1.0, 0.98, 0.9) * sp * tw * 0.7 * uSpark;
        c *= uLight;
        gl_FragColor = vec4(c, uAlpha);
        #include <colorspace_fragment>
      }`,
  });
  return { mat, uniforms };
}
