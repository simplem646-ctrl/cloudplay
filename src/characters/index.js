/**
 * Characters module (WS2): procedural 3D chibi villagers + critters. See docs/game/ARCHITECTURE.md §6.
 * Imports only three, three/addons and core/{registry,util}. Importable in Node (canvases are created lazily).
 */
import { createRig } from './rig.js';
import { createCritter as makeCritter } from './critters.js';
import { APPEARANCE_IDS } from './appearances.js';
import { createFaceAtlas } from './face.js';
import { buildParts } from './build.js';
import { propGeometry } from './props.js';
import { emoteTexture } from './emotes.js';
import { gradientMap, toonMaterial, outlineMaterial } from './materials.js';
import { EMOTES, HELD_PROPS } from '../core/registry.js';

/** createCharacter(id, { season?, scale?, look? }) → Rig. id is 'player' or an NPC id. */
export function createCharacter(id, opts = {}) {
  if (!APPEARANCE_IDS.includes(id)) throw new Error(`createCharacter: unknown character "${id}"`);
  return createRig(id, opts);
}

/** createCritter(kind, { seed? }) → Critter */
export function createCritter(kind, opts = {}) {
  return makeCritter(kind, opts);
}

/** ['player', ...NPC ids] that have an appearance. */
export function listAppearances() {
  return APPEARANCE_IDS.slice();
}

/** Build shared geometry, materials, face atlases, emote textures (call once at load; safe in Node, a no-op for canvases). */
export function preload() {
  gradientMap(); toonMaterial(); outlineMaterial();
  for (const id of APPEARANCE_IDS) {
    const p = buildParts(id, 'spring', {});
    createFaceAtlas(p.app, id);
  }
  for (const e of EMOTES) emoteTexture(e);
  for (const p of HELD_PROPS) propGeometry(p);
  return Promise.resolve();
}
