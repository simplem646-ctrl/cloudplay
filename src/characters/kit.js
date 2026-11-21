/** Geometry kit for the chibi characters: every piece is a vertex-coloured indexed BufferGeometry
 *  (position, normal, color) so a whole body part merges into one mesh. No DOM, no WebGL. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const _c = new THREE.Color();
const _c2 = new THREE.Color();
const _v = new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();

export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;

/** Parse any colour spec (hex string / number / THREE.Color) into a colour (linear working space). */
export function toColor(spec, out = _c) {
  if (spec && spec.isColor) return out.copy(spec);
  return out.set(spec);
}
/** Mix two colour specs, returns a fresh THREE.Color. */
export function mix(a, b, t) {
  toColor(a, _c);
  toColor(b, _c2);
  return new THREE.Color().copy(_c).lerp(_c2, t);
}
export const darker = (hex, f) => mix(hex, '#000000', f);
export const lighter = (hex, f) => mix(hex, '#ffffff', f);
/** Colour spec -> '#rrggbb' sRGB string (for canvas drawing). */
export function hexOf(spec) {
  return '#' + toColor(spec, new THREE.Color()).getHexString();
}

/** Remove uv, add a colour attribute (constant or per-vertex fn(x,y,z,nx,ny,nz) -> spec|undefined). */
export function paint(geo, base, fn) {
  if (geo.attributes.uv) geo.deleteAttribute('uv');
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const n = pos.count;
  const col = new Float32Array(n * 3);
  toColor(base, _c);
  const br = _c.r, bg = _c.g, bb = _c.b;
  for (let i = 0; i < n; i++) {
    let r = br, g = bg, b = bb;
    if (fn) {
      const res = fn(pos.getX(i), pos.getY(i), pos.getZ(i), nor.getX(i), nor.getY(i), nor.getZ(i), i);
      if (res !== undefined && res !== null) {
        toColor(res, _c2);
        r = _c2.r; g = _c2.g; b = _c2.b;
      }
    }
    col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return fixWinding(geo);
}

/** Make triangle winding agree with the (outward) vertex normals. */
export function fixWinding(geo) {
  const idx = geo.index;
  if (!idx) return geo;
  const pos = geo.attributes.position, nor = geo.attributes.normal;
  let sum = 0;
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  const step = Math.max(3, Math.floor(idx.count / 3 / 300) * 3);
  for (let i = 0; i + 2 < idx.count; i += step) {
    const ia = idx.getX(i), ib = idx.getX(i + 1), ic = idx.getX(i + 2);
    a.fromBufferAttribute(pos, ia); b.fromBufferAttribute(pos, ib); c.fromBufferAttribute(pos, ic);
    b.sub(a); c.sub(a); b.cross(c);
    n.set(nor.getX(ia) + nor.getX(ib) + nor.getX(ic), nor.getY(ia) + nor.getY(ib) + nor.getY(ic), nor.getZ(ia) + nor.getZ(ib) + nor.getZ(ic));
    const l = b.length();
    if (l > 1e-9) sum += Math.sign(b.dot(n));
  }
  if (sum < 0) {
    for (let i = 0; i + 2 < idx.count; i += 3) {
      const t = idx.getX(i + 1);
      idx.setX(i + 1, idx.getX(i + 2));
      idx.setX(i + 2, t);
    }
    idx.needsUpdate = true;
  }
  return geo;
}

/** Apply translation / Euler rotation / scale (baked into vertices + normals). */
export function xf(geo, o = {}) {
  const p = o.p || [0, 0, 0], r = o.r || [0, 0, 0], s = o.s || [1, 1, 1];
  _e.set(r[0], r[1], r[2], o.order || 'XYZ');
  _q.setFromEuler(_e);
  _m.compose(_p.set(p[0], p[1], p[2]), _q, _s.set(s[0], s[1], s[2]));
  geo.applyMatrix4(_m);
  return geo;
}

export function merge(list) {
  const g = list.filter(Boolean);
  if (!g.length) return null;
  for (const x of g) {
    if (x.attributes.uv) x.deleteAttribute('uv');
    if (!x.attributes.color) paint(x, '#ff00ff');
  }
  const out = g.length === 1 ? g[0] : mergeGeometries(g, false);
  out.computeBoundingSphere();
  out.computeBoundingBox();
  return out;
}

// ---------------------------------------------------------------- primitives
export function ell(rx, ry, rz, ws = 20, hs = 14) {
  const g = new THREE.SphereGeometry(1, ws, hs);
  g.deleteAttribute('uv');
  return xf(g, { s: [rx, ry, rz] });
}
export function lathe(points, segs = 20, phiStart = 0, phiLen = TAU) {
  const g = new THREE.LatheGeometry(points.map((p) => new THREE.Vector2(p[0], p[1])), segs, phiStart, phiLen);
  g.deleteAttribute('uv');
  return g;
}
export function torus(R, r, seg = 18, tseg = 8) {
  const g = new THREE.TorusGeometry(R, r, tseg, seg);
  g.deleteAttribute('uv');
  return g;
}
/** Rounded box (backpacks, books, parcels). */
export function rbox(w, h, d, r = 0.02, seg = 3) {
  const g = new RoundedBoxGeometry(w, h, d, seg, r);
  g.deleteAttribute('uv');
  return indexify(g);
}

/** Smooth lookup in a sorted [[x,y],...] table. */
export function lookup(table, x) {
  if (x <= table[0][0]) return table[0][1];
  for (let i = 1; i < table.length; i++) {
    if (x <= table[i][0]) {
      const a = table[i - 1], b = table[i];
      const t = (x - a[0]) / (b[0] - a[0] || 1);
      const s = t * t * (3 - 2 * t);
      return a[1] + (b[1] - a[1]) * s;
    }
  }
  return table[table.length - 1][1];
}

/** Tapered tube along a Catmull-Rom path. radii (one per point, interpolated). ends: 'round'|'flat'. */
export function tube(pts, radii, o = {}) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(p[0], p[1], p[2])), false, 'catmullrom', 0.5);
  const n = o.seg || Math.max(6, pts.length * 3);
  const radial = o.radial || 8;
  const frames = curve.computeFrenetFrames(n, false);
  const total = curve.getLength() || 1;
  const rad = (t) => {
    const f = Math.min(1, Math.max(0, t)) * (radii.length - 1);
    const i = Math.min(radii.length - 2, Math.floor(f));
    return radii[i] + (radii[i + 1] - radii[i]) * (f - i);
  };
  const rings = [];
  const roundEnds = (o.ends || 'round') === 'round';
  const capA = [70, 45, 20];
  if (roundEnds) {
    const t0 = frames.tangents[0], r0 = rad(0), p0 = curve.getPointAt(0);
    for (const a of [90, ...capA]) {
      const s = Math.sin(a * DEG), c = Math.cos(a * DEG);
      rings.push({ c: p0.clone().addScaledVector(t0, -r0 * s * 0.95), r: r0 * c, N: frames.normals[0], B: frames.binormals[0], tn: -s, rc: c, T: t0 });
    }
  }
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const dr = (rad(t + 0.01) - rad(t - 0.01)) / (total * 0.02);
    rings.push({ c: curve.getPointAt(t), r: rad(t), N: frames.normals[i], B: frames.binormals[i], tn: -dr, rc: 1, T: frames.tangents[i] });
  }
  if (roundEnds) {
    const tl = frames.tangents[n], rl = rad(1), pl = curve.getPointAt(1);
    for (const a of [...capA].reverse().concat([90])) {
      const s = Math.sin(a * DEG), c = Math.cos(a * DEG);
      rings.push({ c: pl.clone().addScaledVector(tl, rl * s * 0.95), r: rl * c, N: frames.normals[n], B: frames.binormals[n], tn: s, rc: c, T: tl });
    }
  }
  const verts = [], norms = [], index = [];
  const R1 = radial + 1;
  rings.forEach((rg, i) => {
    const T = rg.T;
    for (let j = 0; j <= radial; j++) {
      const a = (j / radial) * TAU;
      const ca = Math.cos(a), sa = Math.sin(a);
      const dx = rg.N.x * ca + rg.B.x * sa, dy = rg.N.y * ca + rg.B.y * sa, dz = rg.N.z * ca + rg.B.z * sa;
      verts.push(rg.c.x + dx * rg.r, rg.c.y + dy * rg.r, rg.c.z + dz * rg.r);
      _v.set(dx * rg.rc + T.x * rg.tn, dy * rg.rc + T.y * rg.tn, dz * rg.rc + T.z * rg.tn).normalize();
      norms.push(_v.x, _v.y, _v.z);
    }
    if (i > 0) {
      for (let j = 0; j < radial; j++) {
        const a = (i - 1) * R1 + j, b = i * R1 + j;
        index.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  g.setIndex(index);
  return fixWinding(g);
}

/** Section of an ellipsoid shell around the head origin (hair caps, fringes, beards, hoods).
 *  a = azimuth from the front (+z) toward +x (viewer's right = character's left); th = polar angle from the top.
 *  lo(a)/hi(a) give the polar range; off(a,th) the outward offset. */
export function patch(rx, ry, rz, o) {
  const rows = o.rows || 10, cols = o.cols || 28;
  const a0 = o.a0 ?? -Math.PI, a1 = o.a1 ?? Math.PI;
  const lo = o.lo || (() => 0), hi = o.hi || (() => Math.PI * 0.5);
  const off = typeof o.off === 'number' ? () => o.off : o.off || (() => 0.03);
  const verts = [], norms = [], index = [];
  for (let i = 0; i <= rows; i++) {
    for (let j = 0; j <= cols; j++) {
      const a = a0 + (a1 - a0) * (j / cols);
      const l = lo(a), h = hi(a);
      const th = l + (h - l) * (i / rows);
      const dx = Math.sin(th) * Math.sin(a), dy = Math.cos(th), dz = Math.sin(th) * Math.cos(a);
      _v.set(dx / rx, dy / ry, dz / rz).normalize();
      const d = off(a, th);
      verts.push(rx * dx + _v.x * d, ry * dy + _v.y * d, rz * dz + _v.z * d);
      norms.push(_v.x, _v.y, _v.z);
    }
  }
  const C = cols + 1;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const v00 = i * C + j, v01 = v00 + 1, v10 = v00 + C, v11 = v10 + 1;
      index.push(v00, v10, v01, v10, v11, v01);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(norms, 3));
  g.setIndex(index);
  return fixWinding(g);
}

/** Point on the head ellipsoid (+ offset along the normal) at azimuth a / polar th. */
export function headPoint(rx, ry, rz, a, th, off = 0) {
  const dx = Math.sin(th) * Math.sin(a), dy = Math.cos(th), dz = Math.sin(th) * Math.cos(a);
  _v.set(dx / rx, dy / ry, dz / rz).normalize();
  return [rx * dx + _v.x * off, ry * dy + _v.y * off, rz * dz + _v.z * off];
}
export function headNormal(rx, ry, rz, a, th) {
  const dx = Math.sin(th) * Math.sin(a), dy = Math.cos(th), dz = Math.sin(th) * Math.cos(a);
  _v.set(dx / rx, dy / ry, dz / rz).normalize();
  return [_v.x, _v.y, _v.z];
}

/** 5-point star prism (clips, charms). */
export function star(R = 0.05, r = 0.022, depth = 0.014) {
  const sh = new THREE.Shape();
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r : R;
    const a = (i / 10) * TAU + Math.PI / 2;
    const x = Math.cos(a) * rad, y = Math.sin(a) * rad;
    if (i === 0) sh.moveTo(x, y); else sh.lineTo(x, y);
  }
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 1 });
  g.deleteAttribute('uv');
  g.translate(0, 0, -depth / 2);
  return indexify(g);
}
/** Give a non-indexed geometry a trivial index so it merges with indexed pieces. */
export function indexify(g) {
  if (g.index) return g;
  const n = g.attributes.position.count;
  const ix = new Array(n);
  for (let i = 0; i < n; i++) ix[i] = i;
  g.setIndex(ix);
  return g;
}

/** Deterministic pseudo random in [0,1) from an integer. */
export const hash01 = (i) => {
  const x = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
};
