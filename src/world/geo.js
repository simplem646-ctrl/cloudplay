/**
 * MeshBuilder: collects geometry per material key, bakes vertex colour (tint, jitter, contact AO) and wind-sway /
 * leaf-tone attributes, then merges everything per material into a handful of Meshes (few draw calls).
 *
 * Every geometry added goes through the same normalisation so mergeGeometries always succeeds:
 * attributes = position, normal, uv, color(3), sway(1), tone(1) + index.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { smoothstep } from '../core/util.js';

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3();
const _c = new THREE.Color();
const _v = new THREE.Vector3();

export function placeMatrix(x = 0, y = 0, z = 0, o = {}) {
  _e.set(o.rotX || 0, o.rotY || 0, o.rotZ || 0, 'YXZ');
  _q.setFromEuler(_e);
  _p.set(x, y, z);
  _s.set(o.sx ?? o.s ?? 1, o.sy ?? o.s ?? 1, o.sz ?? o.s ?? 1);
  return new THREE.Matrix4().compose(_p, _q, _s);
}

export function colorOf(c) {
  if (c === undefined || c === null) return new THREE.Color(1, 1, 1);
  if (c.isColor) return c.clone();
  return new THREE.Color(c);
}

/** world-scale UV box: u/v measured in tiles / texScale so textures keep a constant world size. */
export function boxGeo(w, h, d, tex = 2, off = [0, 0]) {
  const g = new THREE.BoxGeometry(w, h, d);
  const uv = g.attributes.uv;
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) {
    for (let i = 0; i < 4; i++) {
      const k = f * 4 + i;
      uv.setXY(k, (uv.getX(k) * dims[f][0]) / tex + off[0], (uv.getY(k) * dims[f][1]) / tex + off[1]);
    }
  }
  return g;
}

/** Lumpy sphere (hand-modelled foliage/bush blob). */
export function blobGeo(r, detail = 2, seed = 1, lump = 0.18, sx = 1, sy = 1, sz = 1) {
  const g = new THREE.IcosahedronGeometry(r, detail);
  const pos = g.attributes.position;
  let s = seed * 9301 + 49297;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  // low-frequency lumps via a few random sine waves over the unit direction
  const waves = Array.from({ length: 5 }, () => ({ a: [rnd() * 2 - 1, rnd() * 2 - 1, rnd() * 2 - 1], f: 1.4 + rnd() * 2.2, p: rnd() * 6.28 }));
  for (let i = 0; i < pos.count; i++) {
    _v.fromBufferAttribute(pos, i);
    const len = _v.length();
    _v.multiplyScalar(1 / len);
    let n = 0;
    for (const w of waves) n += Math.sin((_v.x * w.a[0] + _v.y * w.a[1] + _v.z * w.a[2]) * w.f * 2 + w.p);
    const k = 1 + (n / waves.length) * lump;
    _v.multiplyScalar(len * k);
    pos.setXYZ(i, _v.x * sx, _v.y * sy, _v.z * sz);
  }
  // IcosahedronGeometry is non-indexed; weld so we can index it and smooth normals
  const welded = weld(g);
  welded.computeVertexNormals();
  return welded;
}

/** make an indexed geometry from a non-indexed one by position hashing (also drops uv seams: spherical uv). */
function weld(g) {
  const pos = g.attributes.position;
  const map = new Map();
  const verts = [];
  const index = [];
  for (let i = 0; i < pos.count; i++) {
    const key = `${pos.getX(i).toFixed(4)},${pos.getY(i).toFixed(4)},${pos.getZ(i).toFixed(4)}`;
    let id = map.get(key);
    if (id === undefined) {
      id = verts.length / 3;
      map.set(key, id);
      verts.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }
    index.push(id);
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  // planar-ish world uv
  const uv = new Float32Array((verts.length / 3) * 2);
  for (let i = 0; i < verts.length / 3; i++) {
    uv[i * 2] = verts[i * 3] * 0.5 + verts[i * 3 + 2] * 0.35;
    uv[i * 2 + 1] = verts[i * 3 + 1] * 0.5 + verts[i * 3 + 2] * 0.35;
  }
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  out.setIndex(index);
  return out;
}

/** single triangle (gable end): base width w along x, apex height h, facing +z. UV in tiles. */
export function triGeo(w, h, tex = 2) {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([-w / 2, 0, 0, w / 2, 0, 0, 0, h, 0], 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 0, 0, 1], 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, w / tex, 0, w / 2 / tex, h / tex], 2));
  g.setIndex([0, 1, 2]);
  return g;
}

/** Planar-UV remap from x/y position into 0..1 over a w x h rectangle starting at (minX,minY) (door/window shapes). */
export function planarUV(geo, minX, minY, w, h) {
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) - minX) / w;
    uv[i * 2 + 1] = (pos.getY(i) - minY) / h;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geo;
}

function ensureAttrs(geo) {
  if (!geo.index) geo = weldKeepUV(geo);
  const n = geo.attributes.position.count;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  if (!geo.attributes.uv) geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
  geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
  geo.setAttribute('sway', new THREE.BufferAttribute(new Float32Array(n), 1));
  geo.setAttribute('tone', new THREE.BufferAttribute(new Float32Array(n), 1));
  return geo;
}
function weldKeepUV(g) {
  const idx = new Uint32Array(g.attributes.position.count);
  for (let i = 0; i < idx.length; i++) idx[i] = i;
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  return g;
}

export class MeshBuilder {
  /** @param {Record<string,THREE.Material>} mats  @param {Record<string,{cast?:boolean,receive?:boolean}>} meta */
  constructor(mats, meta = {}) {
    this.mats = mats;
    this.meta = meta;
    this.parts = new Map();
    this.triCount = 0;
    this._seed = 1;
  }

  /** add a geometry (owned by the builder afterwards). opts: matrix | x,y,z,rot*,s*, color, jitter, ao{k,h,y0}, sway, swayH, swayY0, tone */
  add(matKey, geo, opts = {}) {
    if (!this.mats[matKey]) throw new Error(`MeshBuilder: unknown material "${matKey}"`);
    geo = ensureAttrs(geo);
    const m = opts.matrix || placeMatrix(opts.x, opts.y, opts.z, opts);
    geo.applyMatrix4(m);
    const pos = geo.attributes.position;
    const col = geo.attributes.color;
    const sway = geo.attributes.sway;
    const tone = geo.attributes.tone;
    const base = colorOf(opts.color);
    if (opts.jitter) {
      this._seed = (this._seed * 16807) % 2147483647;
      const j = ((this._seed / 2147483647) - 0.5) * 2 * opts.jitter;
      base.multiplyScalar(1 + j);
    }
    const ao = opts.ao;
    for (let i = 0; i < pos.count; i++) {
      let k = 1;
      const y = pos.getY(i);
      if (ao) k = 1 - ao.k * (1 - smoothstep(0, ao.h, y - (ao.y0 ?? 0)));
      if (opts.aoTop) k *= 1 - opts.aoTop.k * smoothstep(0, opts.aoTop.h, opts.aoTop.y - y);
      let c = base;
      if (opts.gradTop) {
        const t = smoothstep(opts.gradTop.y0, opts.gradTop.y1, y);
        _c.copy(base).lerp(colorOf(opts.gradTop.color), t * (opts.gradTop.amt ?? 1));
        c = _c;
      }
      col.setXYZ(i, c.r * k, c.g * k, c.b * k);
      if (opts.sway) {
        const sy = opts.swayH ? smoothstep(opts.swayY0 ?? 0, (opts.swayY0 ?? 0) + opts.swayH, y) : 1;
        sway.setX(i, opts.sway * sy);
      }
      if (opts.tone !== undefined) tone.setX(i, typeof opts.tone === 'function' ? opts.tone(pos.getX(i), y, pos.getZ(i)) : opts.tone);
    }
    this.triCount += geo.index.count / 3;
    let arr = this.parts.get(matKey);
    if (!arr) this.parts.set(matKey, (arr = []));
    arr.push(geo);
    return this;
  }

  box(mat, x, y, z, w, h, d, o = {}) {
    const g = boxGeo(w, h, d, o.tex ?? 2, o.uvOff || [((x * 0.37) % 1 + 1) % 1, ((z * 0.53) % 1 + 1) % 1]);
    return this.add(mat, g, { ...o, matrix: placeMatrix(x, y + h / 2, z, o), ao: o.ao === undefined ? undefined : { y0: y, ...o.ao } });
  }
  /** box by corners (x0,y0,z0)-(x1,y1,z1) */
  boxAB(mat, x0, y0, z0, x1, y1, z1, o = {}) {
    return this.box(mat, (x0 + x1) / 2, Math.min(y0, y1), (z0 + z1) / 2, Math.abs(x1 - x0), Math.abs(y1 - y0), Math.abs(z1 - z0), o);
  }
  cyl(mat, x, y, z, rTop, rBot, h, o = {}) {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, o.seg || 10, 1, !!o.open);
    return this.add(mat, g, { ...o, matrix: placeMatrix(x, y + h / 2, z, o), ao: o.ao === undefined ? undefined : { y0: y, ...o.ao } });
  }
  cone(mat, x, y, z, r, h, o = {}) {
    return this.cyl(mat, x, y, z, 0.001, r, h, o);
  }
  ball(mat, x, y, z, r, o = {}) {
    const g = o.lump ? blobGeo(r, o.detail ?? 2, o.seed ?? 1, o.lump, 1, 1, 1) : weld(new THREE.IcosahedronGeometry(r, o.detail ?? 1));
    if (!o.lump) g.computeVertexNormals();
    return this.add(mat, g, { ...o, matrix: placeMatrix(x, y, z, o) });
  }
  plane(mat, x, y, z, w, d, o = {}) {
    const g = new THREE.PlaneGeometry(w, d);
    g.rotateX(-Math.PI / 2);
    const uv = g.attributes.uv;
    const tex = o.tex ?? 2;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tex, (uv.getY(i) * d) / tex);
    return this.add(mat, g, { ...o, matrix: placeMatrix(x, y, z, o) });
  }
  /** vertical quad facing +z at (x,y..y+h), width w */
  wall(mat, x, y, z, w, h, o = {}) {
    const g = new THREE.PlaneGeometry(w, h);
    const uv = g.attributes.uv;
    const tex = o.tex ?? 2;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * w) / tex, (uv.getY(i) * h) / tex);
    return this.add(mat, g, { ...o, matrix: placeMatrix(x, y + h / 2, z, o) });
  }
  tri(mat, x, y, z, w, h, o = {}) {
    return this.add(mat, triGeo(w, h, o.tex ?? 2), { ...o, matrix: placeMatrix(x, y, z, o) });
  }

  isEmpty() {
    return this.parts.size === 0;
  }

  /** merge into a Group of Meshes (one per material). */
  build() {
    const group = new THREE.Group();
    for (const [key, geos] of this.parts) {
      const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
      if (!merged) continue;
      merged.computeBoundingSphere();
      const mesh = new THREE.Mesh(merged, this.mats[key]);
      const meta = this.meta[key] || {};
      mesh.castShadow = meta.cast !== false;
      mesh.receiveShadow = meta.receive !== false;
      mesh.name = `mb_${key}`;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      group.add(mesh);
      if (geos.length > 1) for (const g of geos) g.dispose();
    }
    this.parts.clear();
    return group;
  }
}
