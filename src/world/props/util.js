/** Shared helpers for prop builders (no DOM at import). */
import * as THREE from 'three';
import { stripeCanvas, signCanvas, toTexture } from '../textures.js';
import { placeMatrix } from '../geo.js';

export const PAL = {
  cream: '#f4e4c4', peach: '#f3c9a4', mint: '#cfe6d0', sky: '#c9ddef', butter: '#f8e49c', rose: '#f1c4c4', lilac: '#dccdf0', white: '#fbf6ea',
  trim: '#fff4de', timber: '#5a3a24', stone: '#a79d8c', iron: '#3c3844', brass: '#e8c05a',
  terracotta: '#e48d5e', blue: '#6f9bd0', green: '#7bb07f', slate: '#8c98b0', red: '#d85d4e', thatch: '#ffffff', plum: '#9c6aa8',
  doorRed: '#a8432e', doorBlue: '#3f6fa8', doorGreen: '#3f7a5a', doorBrown: '#8a5230', doorYellow: '#d9a33a',
  flowerCols: ['#ff7fa3', '#ffd23f', '#ffffff', '#b78cff', '#ff9a4a', '#ff5f6d'],
};

export const ROOF_STYLES = {
  terracotta: { mat: 'shingle', color: '#e48a5a', ridge: '#b9603a' },
  red: { mat: 'shingle', color: '#da6252', ridge: '#a9443a' },
  blue: { mat: 'shingle', color: '#6c98cc', ridge: '#46689a' },
  green: { mat: 'shingle', color: '#79ae7e', ridge: '#4d7f58' },
  slate: { mat: 'slate', color: '#ffffff', ridge: '#5d6a82' },
  brown: { mat: 'shingle', color: '#a97a58', ridge: '#74513a' },
  plum: { mat: 'shingle', color: '#a97fb4', ridge: '#765582' },
  thatch: { mat: 'thatch', color: '#ffffff', ridge: '#8a6a2a', thick: 0.34 },
};

export const WALL_STYLES = {
  plaster: { mat: 'plaster', tex: 2.4 },
  brick: { mat: 'brick', tex: 2.0 },
  stone: { mat: 'stone', tex: 2.4 },
  wood: { mat: 'plankwall', tex: 2.2 },
  timber: { mat: 'plaster', tex: 2.4, beams: true },
};

/** local coordinate frame: place boxes relative to an origin rotated about Y */
export function frame(mb, ox, oy, oz, rotY = 0) {
  const c = Math.cos(rotY);
  const s = Math.sin(rotY);
  const world = (lx, lz) => [ox + lx * c + lz * s, oz - lx * s + lz * c];
  return {
    ox, oy, oz, rotY, world,
    box(mat, lx, ly, lz, w, h, d, o = {}) {
      const [x, z] = world(lx, lz);
      return mb.box(mat, x, oy + ly, z, w, h, d, { ...o, rotY: rotY + (o.rotY || 0) });
    },
    cyl(mat, lx, ly, lz, rt, rb, h, o = {}) {
      const [x, z] = world(lx, lz);
      return mb.cyl(mat, x, oy + ly, z, rt, rb, h, { ...o, rotY: rotY + (o.rotY || 0) });
    },
    ball(mat, lx, ly, lz, r, o = {}) {
      const [x, z] = world(lx, lz);
      return mb.ball(mat, x, oy + ly, z, r, { ...o, rotY: rotY + (o.rotY || 0) });
    },
    wall(mat, lx, ly, lz, w, h, o = {}) {
      const [x, z] = world(lx, lz);
      return mb.wall(mat, x, oy + ly, z, w, h, { ...o, rotY: rotY + (o.rotY || 0) });
    },
  };
}

/** Lambert material with a canvas map, cached on the engine materials dict under `key`. */
export function cachedMat(ctx, key, makeCanvas, extra = {}) {
  if (!ctx.mats[key]) {
    ctx.mats[key] = new THREE.MeshLambertMaterial({ map: toTexture(makeCanvas(), { repeat: false, anisotropy: 4 }), vertexColors: true, ...extra });
    ctx.s.meta[key] = { cast: true, receive: true };
  }
  return key;
}

export function awningMat(ctx, colors) {
  const key = `awn_${colors.join('').replace(/#/g, '')}`;
  return cachedMat(ctx, key, () => stripeCanvas(colors, 8, 128), { side: THREE.DoubleSide });
}

export function signMat(ctx, text, o = {}) {
  const key = `sign_${text}_${o.bg || ''}_${o.fg || ''}_${o.w || ''}`;
  return cachedMat(ctx, key, () => signCanvas(text, o), { side: THREE.DoubleSide });
}

/** attach vertex colours to a standalone geometry (for dynamic meshes using vertexColors materials) */
export function colorize(geo, color) {
  const c = new THREE.Color(color);
  const n = geo.attributes.position.count;
  const a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    a[i * 3] = c.r;
    a[i * 3 + 1] = c.g;
    a[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return geo;
}

export function rect(x, z, w, d) {
  return [x - w / 2, z - d, x + w / 2, z];
}

export { placeMatrix };
