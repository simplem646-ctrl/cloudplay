/**
 * Fixed 3/4 camera rig. Yaw 0 (looks north), pitch 52 deg, vertical FOV 30 deg. Never rotates, never user controlled.
 * Smooth follow (damp), clamp so the view never shows beyond the area edge (+1 tile margin), small interiors are
 * locked to a computed best fit. Lab-only overview mode (orthographic top-down) is exposed through setOverview().
 */
import * as THREE from 'three';
import { clamp, damp } from '../core/util.js';

export const PITCH = (52 * Math.PI) / 180;
export const FOV = 30;
const TAN = Math.tan((FOV * Math.PI) / 360);

export function createCameraRig() {
  const camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.5, 400);
  const ortho = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  const st = {
    x: 0, z: 0, tx: 0, tz: 0, zoom: 1, aspect: 16 / 9, area: null, locked: false, fit: null, overview: false, dist: 30,
    ext: { x0: -12, x1: 12, z0: -8, z1: 8 },
  };

  const tilesWide = () => {
    const interior = st.area && st.area.kind === 'interior';
    return (interior ? 16 : clamp(st.aspect * 13.5, 16, 24)) / st.zoom;
  };
  const distFor = (tilesW) => tilesW / st.aspect / 2 / TAN;

  function place() {
    const D = st.fit ? st.fit.dist : distFor(tilesWide());
    st.dist = D;
    camera.aspect = st.aspect;
    camera.position.set(st.x, Math.sin(PITCH) * D, st.z + Math.cos(PITCH) * D);
    camera.lookAt(st.x, 0, st.z);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    if (st.overview) {
      const a = st.area;
      const W = a ? a.width + 4 : 40;
      const H = a ? a.height + 4 : 30;
      let hw = W / 2, hh = hw / st.aspect;
      if (hh < H / 2) { hh = H / 2; hw = hh * st.aspect; }
      ortho.left = -hw; ortho.right = hw; ortho.top = hh; ortho.bottom = -hh;
      ortho.position.set(a ? a.width / 2 : 0, 100, a ? a.height / 2 : 0);
      ortho.up.set(0, 0, -1);
      ortho.lookAt(a ? a.width / 2 : 0, 0, a ? a.height / 2 : 0);
      ortho.updateProjectionMatrix();
      ortho.updateMatrixWorld();
    }
  }

  /** ground footprint of the view relative to the target */
  function computeExtents() {
    const saveX = st.x, saveZ = st.z;
    st.x = 0; st.z = 0;
    place();
    const ext = { x0: Infinity, x1: -Infinity, z0: Infinity, z1: -Infinity };
    const v = new THREE.Vector3();
    for (const [nx, ny] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {
      v.set(nx, ny, 0.5).unproject(camera).sub(camera.position);
      const t = -camera.position.y / v.y;
      const gx = camera.position.x + v.x * t, gz = camera.position.z + v.z * t;
      ext.x0 = Math.min(ext.x0, gx); ext.x1 = Math.max(ext.x1, gx);
      ext.z0 = Math.min(ext.z0, gz); ext.z1 = Math.max(ext.z1, gz);
    }
    st.ext = ext;
    st.x = saveX; st.z = saveZ;
    place();
  }

  const _p = new THREE.Vector3();
  function ndcOf(x, y, z, cam) {
    return _p.set(x, y, z).project(cam);
  }

  /** best-fit distance/target for a small interior: floor + wall tops inside the view */
  function fitInterior(a) {
    const wallH = (a.def && a.def.room && a.def.room.wallH) || 3.8;
    const pts = [];
    for (const [x, z] of [[0, 0], [a.width, 0], [0, a.height], [a.width, a.height]]) { pts.push([x, 0, z]); }
    for (const [x, z] of [[0, 0], [a.width, 0]]) pts.push([x, wallH + 0.4, z]);
    const cx = a.width / 2;
    let D = distFor(16);
    let tz = a.height / 2 - 1;
    const tmp = new THREE.PerspectiveCamera(FOV, st.aspect, 0.5, 400);
    const k = (d) => (d * TAN) / Math.sin(PITCH);
    for (let it = 0; it < 14; it++) {
      tmp.position.set(cx, Math.sin(PITCH) * D, tz + Math.cos(PITCH) * D);
      tmp.lookAt(cx, 0, tz);
      tmp.updateMatrixWorld();
      tmp.updateProjectionMatrix();
      let mnx = 9, mxx = -9, mny = 9, mxy = -9;
      for (const [x, y, z] of pts) {
        ndcOf(x, y, z, tmp);
        mnx = Math.min(mnx, _p.x); mxx = Math.max(mxx, _p.x); mny = Math.min(mny, _p.y); mxy = Math.max(mxy, _p.y);
      }
      tz -= ((mny + mxy) / 2) * k(D) * 0.9;
      const need = Math.max((mxx - mnx) / 2 / 0.93, (mxy - mny) / 2 / 0.93);
      D *= clamp(need, 0.9, 1.15);
      D = Math.max(D, distFor(16));
    }
    return { dist: D, x: cx, z: tz };
  }

  function clampTarget(x, z) {
    const a = st.area;
    if (!a) return [x, z];
    if (st.fit) return [st.fit.x, st.fit.z];
    const m = 1;
    const e = st.ext;
    const lo = -m - e.x0, hi = a.width + m - e.x1;
    const zlo = -m - e.z0, zhi = a.height + m - e.z1;
    const cx = lo > hi ? a.width / 2 - (e.x0 + e.x1) / 2 : clamp(x, lo, hi);
    const cz = zlo > zhi ? a.height / 2 - (e.z0 + e.z1) / 2 : clamp(z, zlo, zhi);
    return [cx, cz];
  }

  const rig = {
    camera, ortho, st,
    active: () => (st.overview ? ortho : camera),
    setAspect(a) { st.aspect = a; this.refit(); },
    setArea(area) {
      st.area = area;
      this.refit();
    },
    refit() {
      st.fit = null;
      if (st.area && st.area.kind === 'interior') st.fit = fitInterior(st.area);
      computeExtents();
      if (st.area) this.snap(st.tx, st.tz);
    },
    setTarget(x, z, zoom) {
      if (zoom !== undefined && zoom !== st.zoom) { st.zoom = clamp(zoom, 0.6, 1.8); this.refit(); }
      if (x !== undefined) st.tx = x;
      if (z !== undefined) st.tz = z;
    },
    snap(x, z) {
      st.tx = x ?? st.tx; st.tz = z ?? st.tz;
      [st.x, st.z] = clampTarget(st.tx, st.tz);
      place();
    },
    update(dt) {
      const [cx, cz] = clampTarget(st.tx, st.tz);
      st.x = damp(st.x, cx, 6, dt);
      st.z = damp(st.z, cz, 6, dt);
      place();
    },
    setOverview(on) { st.overview = !!on; place(); },
  };
  return rig;
}
