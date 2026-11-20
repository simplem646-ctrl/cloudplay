// Scene & director registry. OWNED BY THE LEAD. Pure JS (no DOM): importable in Node and tests.
//
// WHY: the integration tasks (T8a academics, T8b activities/mini-games/shop, T9a overworld+stage,
// T9b menus/sleep/ending) are built in parallel. They meet HERE and never import each other:
//   * SCENES register a factory under a well-known name; anyone opens one with
//     `openScene(game, name, params)` and awaits its result (the value passed to `game.scenes.pop(result)`).
//   * DIRECTORS are small per-minute policies the overworld consults while idle; a director can take
//     over the game (start a class, an exam, a forced sleep...) without the overworld knowing about it.
//
// Scene names (the contract: the owner registers it; callers pass `params` and read the `result`):
//   T9a  'title' | 'overworld' | 'dialogue' (internal)
//   T9b  'pause' | 'save_menu' | 'load_menu' | 'settings' | 'sleep' (day summary; params {summary}) | 'ending' | 'credits'
//        | 'status' | 'items' | 'friends' | 'journal' | 'calendar' | 'records'
//   T8a  'class'   params {period, subject, late}      -> { attended, gains }
//        'exam'    params {examId, dayIndex, subjects}  -> { scores: { subject: 0..100 } }
//        'report_card' params {examId}                  -> {}
//        'activity:study_home' | 'activity:study_library'   params {}   -> { minutes, gains }
//   T8b  'shop'    params {shop: SHOP_ID}               -> { bought: [{item, qty}] }
//        'activity:<id>' for club_practice, job_cafe, rest, stargaze, shell_hunt, jog, nap   -> { minutes, energy }
//        'minigame:<id>' (MINIGAME_IDS) params {context:'club'|'festival'|'exam'|'job'|'date', difficulty?} -> { score: 0..100, rank: 'gold'|'silver'|'bronze'|'none' }
//
// `game` is the services object assembled by the boot code: { renderer, world, input, ui, audio, art, sim,
// bus, scenes, debug }. `game.scenes.push(scene, params)` MUST return a Promise resolved by `pop(result)`.
//
// Director contract: registerDirector(name, fn, order = 50). `fn(game, ctx)` -> null | { scene, params } (or
// { call: async () => {} } for pure side effects). The overworld calls `runDirectors(game, ctx)` once per
// in-game minute while no scene/script is active and, if it returns an action, pauses the clock, opens it
// (`await openScene`) and resumes. ctx = { map, minute, state, dayInfo, player } (plain data).

const factories = new Map();
const directors = [];
const warned = new Set();

export function registerScene(name, factory) {
  if (typeof factory !== 'function') throw new Error(`registerScene(${name}): factory must be a function (game, params) => Scene`);
  factories.set(name, factory);
}
export const hasScene = (name) => factories.has(name);
export const listScenes = () => [...factories.keys()].sort();

export function createScene(name, game, params = {}) {
  const f = factories.get(name);
  return f ? f(game, params) : null;
}

/** Push scene `name`; resolves with its result. A missing scene resolves `{ missing: true, score: 0, rank: 'none' }` (never throws). */
export async function openScene(game, name, params = {}) {
  const scene = createScene(name, game, params);
  if (!scene) {
    if (!warned.has(name)) { warned.add(name); console.warn(`[scenes] scene "${name}" is not registered yet`); }
    return { missing: true, score: 0, rank: 'none' };
  }
  const result = await game.scenes.push(scene, params);
  return result === undefined ? {} : result;
}

/** Map the script `call` op ({scene:'minigame'|'activity'|'shop'|'exam', id, opts}) to a registered scene. */
export function callTarget(scene, id, opts = {}) {
  switch (scene) {
    case 'minigame': return { name: `minigame:${id}`, params: { context: 'festival', ...opts } };
    case 'activity': return { name: `activity:${id}`, params: { ...opts } };
    case 'shop': return { name: 'shop', params: { shop: id, ...opts } };
    case 'exam': return { name: 'exam', params: { examId: id, ...opts } };
    default: return { name: scene, params: { id, ...opts } };
  }
}
export const openCall = (game, scene, id, opts) => {
  const t = callTarget(scene, id, opts);
  return openScene(game, t.name, t.params);
};

export function registerDirector(name, fn, order = 50) {
  unregisterDirector(name);
  directors.push({ name, fn, order });
  directors.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name));
}
export function unregisterDirector(name) {
  const i = directors.findIndex((d) => d.name === name);
  if (i >= 0) directors.splice(i, 1);
}
export const listDirectors = () => directors.map((d) => d.name);

/** First non-null action from the directors, in order. A throwing director is logged once and skipped. */
export function runDirectors(game, ctx) {
  for (const d of directors) {
    try {
      const action = d.fn(game, ctx);
      if (action) return { ...action, director: d.name };
    } catch (e) {
      const key = `director:${d.name}`;
      if (!warned.has(key)) { warned.add(key); console.error(`[scenes] director "${d.name}" threw`, e); }
    }
  }
  return null;
}

/** Test helper. */
export function resetRegistry() {
  factories.clear();
  directors.length = 0;
  warned.clear();
}
