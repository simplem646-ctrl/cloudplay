/**
 * STUB — replaced by workstream 1 (World & Rendering).
 * Minimal real Three scene (renderer, ground, one box) with the FIXED camera of ARCHITECTURE §5:
 * yaw 0, pitch 52 deg, vertical FOV 30 deg.
 */
import * as THREE from 'three';
import { AREAS, AREA_IDS, areaAnchorNames, areaTransitionIds, areaInteractables } from '../core/registry.js';
import { clamp, damp } from '../core/util.js';

const PITCH = (52 * Math.PI) / 180;
const FOV = 30;
let renderer = null;
let scene = null;
let camera = null;
let box = null;
let ground = null;
let hemi = null;
let sun = null;
let area = null;
let size = { w: 1, h: 1 };
const cam = { x: 0, z: 0, tx: 0, tz: 0 };
const raycaster = new THREE.Raycaster();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function placeCamera() {
  const aspect = size.w / size.h;
  const tilesW = clamp(aspect * 13.5, 16, 24);
  const dist = tilesW / aspect / 2 / Math.tan((FOV * Math.PI) / 360);
  camera.aspect = aspect;
  camera.position.set(cam.x, Math.sin(PITCH) * dist, cam.z + Math.cos(PITCH) * dist);
  camera.lookAt(cam.x, 0, cam.z);
  camera.updateProjectionMatrix();
}

export async function init({ canvas, quality = 'medium' } = {}) {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: quality !== 'low' });
  renderer.setClearColor(0x9fd8ff);
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(FOV, 16 / 9, 0.1, 200);
  ground = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshLambertMaterial({ color: 0x8fd16a }));
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  box = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.5, 1.5), new THREE.MeshLambertMaterial({ color: 0xe8833a }));
  box.position.y = 0.75;
  scene.add(box);
  hemi = new THREE.HemisphereLight(0xffffff, 0x88aa66, 1.4);
  sun = new THREE.DirectionalLight(0xfff0d0, 1.6);
  sun.position.set(-6, 10, 8);
  scene.add(hemi, sun);
  setQuality(quality);
  resize(canvas.clientWidth || 1280, canvas.clientHeight || 720);
  await loadArea('brook_lane');
}

export function setQuality(q) {
  if (renderer) renderer.setPixelRatio(q === 'low' ? 1 : Math.min(globalThis.devicePixelRatio || 1, 2));
}

export function resize(w, h, dpr) {
  if (!renderer) return;
  if (dpr) renderer.setPixelRatio(dpr);
  size = { w: Math.max(1, w), h: Math.max(1, h) };
  renderer.setSize(size.w, size.h, false);
  placeCamera();
}

export const listAreas = () => AREA_IDS.slice();
export const getAreaDef = (id) => AREAS[id] || null;
export const getArea = () => area;

function buildRuntime(id) {
  const def = AREAS[id];
  if (!def) throw new Error(`unknown area "${id}"`);
  const [width, height] = def.size;
  const cx = width / 2;
  const cz = height / 2;
  const anchors = {};
  for (const n of areaAnchorNames(id)) anchors[n] = { x: cx, z: cz, facing: 's' };
  const walk = new Uint8Array(width * height).fill(1);
  return {
    id, name: def.name, kind: def.kind, width, height,
    anchors,
    anchor: (n) => anchors[n] || null,
    transitions: areaTransitionIds(id).map((t) => ({ id: t, kind: def.kind === 'interior' ? 'door' : 'edge', rect: { x: cx, z: cz, w: 1, h: 1 }, stand: { x: cx, z: cz }, to: { area: t.slice(3), spawn: `from_${id}` } })),
    interactables: Object.entries(areaInteractables(id)).map(([iid, type]) => ({ id: iid, type, x: cx, z: cz, r: 0.8, label: iid })),
    critters: [],
    isWalkable: (i, j) => i >= 0 && j >= 0 && i < width && j < height,
    isBlockedAt: (x, z) => x < 0 || z < 0 || x > width || z > height,
    moveCircle(x, z, dx, dz) {
      const nx = clamp(x + dx, 0.3, width - 0.3);
      const nz = clamp(z + dz, 0.3, height - 0.3);
      return { x: nx, z: nz, blocked: nx !== x + dx || nz !== z + dz };
    },
    surfaceAt: () => (def.kind === 'interior' ? 'wood' : 'grass'),
    grid: { w: width, h: height, walk },
  };
}

export async function loadArea(id, { spawn } = {}) {
  area = buildRuntime(id);
  if (ground) {
    ground.scale.set(area.width, area.height, 1);
    ground.position.set(area.width / 2, 0, area.height / 2);
    box.position.set(area.width / 2, 0.75, area.height / 2);
    const a = (spawn && area.anchor(spawn)) || { x: area.width / 2, z: area.height / 2 };
    snapCamera({ x: a.x, z: a.z });
  }
  return area;
}

export function update(dt) {
  if (!camera) return;
  cam.x = damp(cam.x, cam.tx, 6, dt);
  cam.z = damp(cam.z, cam.tz, 6, dt);
  box.rotation.y += dt * 0.6;
  placeCamera();
}

export function render() {
  if (renderer) renderer.render(scene, camera);
}

export function setEnvironment({ minutes = 720 } = {}) {
  if (!hemi) return;
  const night = minutes < 360 || minutes > 1200;
  hemi.intensity = night ? 0.6 : 1.4;
  renderer.setClearColor(night ? 0x1b2650 : 0x9fd8ff);
}

export function setCamera({ x, z } = {}) {
  if (x !== undefined) cam.tx = x;
  if (z !== undefined) cam.tz = z;
}
export function snapCamera({ x, z }) {
  cam.x = cam.tx = x;
  cam.z = cam.tz = z;
  if (camera) placeCamera();
}

export function addEntity(obj) { if (scene) scene.add(obj); }
export function removeEntity(obj) { if (scene) scene.remove(obj); }

export function screenToGround(clientX, clientY) {
  if (!renderer) return null;
  const r = renderer.domElement.getBoundingClientRect();
  const ndc = new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
  const p = new THREE.Vector3();
  return raycaster.ray.intersectPlane(plane, p) ? { x: p.x, z: p.z } : null;
}
export function groundToScreen(x, z, y = 0) {
  if (!renderer) return { x: 0, y: 0 };
  const r = renderer.domElement.getBoundingClientRect();
  const v = new THREE.Vector3(x, y, z).project(camera);
  return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
}

export function setLampStates() {}
export function setDecor() {}
export function playEffect() {}
export function setHighlight() {}
export function setDoorOpen() {}
export function getStats() {
  const i = renderer ? renderer.info.render : { calls: 0, triangles: 0 };
  return { drawCalls: i.calls, triangles: i.triangles, fps: 0 };
}
