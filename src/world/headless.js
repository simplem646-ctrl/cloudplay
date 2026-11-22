/**
 * Node-only helper: builds areas without WebGL/DOM (fake canvas + no-op textures) so the validator and unit tests
 * can inspect collision grids, anchors, transitions and interactables. Not used by the game.
 */
import * as THREE from 'three';
import { createMaterials, createWaterMaterial } from './materials.js';
import { buildArea } from './builder.js';
import { getDef } from './areas/index.js';

function installDocumentShim() {
  if (typeof document !== 'undefined') return;
  const noop = () => {};
  const ctxProxy = () => new Proxy(noop, { get: (t, k) => (k === 'canvas' ? {} : k === 'measureText' ? () => ({ width: 10 }) : ctxProxy()), apply: () => ctxProxy(), set: () => true });
  globalThis.document = {
    createElement: () => ({ width: 1, height: 1, getContext: () => ctxProxy(), style: {} }),
  };
}

let engine = null;
export function headlessEngine() {
  if (engine) return engine;
  installDocumentShim();
  const tex = { get: () => new THREE.Texture(), groundPattern: () => ({}), names: [] };
  const m = createMaterials(tex);
  engine = { mats: m.mats, meta: m.meta, tex, water: createWaterMaterial(tex), quality: 'low', maxAniso: 1, fx: null };
  return engine;
}

/** build an area in Node (no ground painting / no rendering) */
export function buildHeadless(id) {
  const def = getDef(id);
  if (!def) throw new Error(`no def for ${id}`);
  return buildArea(id, def, headlessEngine());
}
