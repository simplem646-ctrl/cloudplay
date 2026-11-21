// Actor construction for the overworld: character / animal sheets from the art service.
import { Actor } from '../engine/index.js';
import * as art from '../art/index.js';
import { CAST_BY_ID } from '../data/cast.js';

export const isAnimal = (id) => !!(CAST_BY_ID[id] && CAST_BY_ID[id].kind === 'animal');

/** Sprite sheet for any character id (cast, extras, the cat) in an outfit slot and season. Never throws: falls back to casual. */
export function sheetFor(id, slot = 'auto', season = 'spring') {
  if (isAnimal(id)) {
    const a = CAST_BY_ID[id].appearance || {};
    return art.getAnimalSheet(a.animal || 'cat', a.fur || 'orange_tabby');
  }
  try {
    return art.getCharacterSheet(id, slot, season);
  } catch (e) {
    return art.getCharacterSheet(id, 'casual', season);
  }
}

/** Create (not yet added to the world) an Actor standing on tile (tx, ty). */
export function makeActor(id, { slot = 'auto', season = 'spring', tx = 0, ty = 0, dir = 'down' } = {}) {
  const animal = isAnimal(id);
  const a = new Actor({
    id, kind: animal ? 'animal' : 'char', sheet: sheetFor(id, slot, season), tx, ty, dir,
    shadowSize: animal ? { w: 10, h: 5 } : undefined,
  });
  a.slot = slot;
  a.season = season;
  return a;
}

/** Re-skin an actor when the outfit slot or season changed (sheets are cached by the art service). */
export function reskin(actor, id, slot, season) {
  if (actor.slot === slot && actor.season === season) return;
  actor.slot = slot;
  actor.season = season;
  actor.setSheet(sheetFor(id, slot, season));
}
