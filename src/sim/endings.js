// Ending composer: every slide (src/content/endings/*.js) whose `when` holds, ordered by group, then `order`, then id.
import { ENDING_MODULES } from '../_generated/registry.js';
import { safeCondition } from './conditions.js';

export const GROUP_ORDER = ['main', 'romance', 'academic', 'club', 'friends', 'final'];

export function slidesFromModules(modules) {
  const out = [];
  for (const mod of Object.values(modules)) for (const s of (mod.default && mod.default.slides) || []) out.push(s);
  return out;
}
let cached = null;
export const defaultSlides = () => cached || (cached = slidesFromModules(ENDING_MODULES));

/** Ordered slides to show for the current state. Returns [] when there is no content at all. */
export function composeEnding(state, slides = defaultSlides()) {
  const idx = (g) => { const i = GROUP_ORDER.indexOf(g); return i < 0 ? GROUP_ORDER.length : i; };
  return slides
    .filter((s) => safeCondition(s.when, state, { eventId: `ending_${s.id}` }))
    .sort((a, b) => idx(a.group) - idx(b.group) || (a.order ?? 50) - (b.order ?? 50) || (a.id < b.id ? -1 : 1));
}
