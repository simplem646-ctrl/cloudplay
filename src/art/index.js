// Public art API (see docs/game/api/art.md). Everything is drawn into pure-JS pixel buffers; DOM canvases
// are created lazily (the `canvas` getter), so this module imports and runs in plain Node too.
import { CHAR_SHEET, ANIMAL_SHEET, PORTRAIT_SHEET, ICON_SHEET, ICON_NAMES } from '../data/sheet_layout.js';
import { EXPRESSIONS } from '../core/constants.js';
import { lookupWho, resolveCharacter } from './resolve.js';
import { buildCharacterSheet } from './sheets.js';
import { buildPortraitSheet } from './portrait.js';
import { buildAnimalSheet } from './animals.js';
import { buildIconAtlas } from './icons.js';
import { buildTitleBackdrop, buildLogo, buildEndingBackdrop, ENDING_KEYS } from './title.js';
import { appearanceFromSeed } from './seed.js';

export { appearanceFromSeed, ENDING_KEYS, ICON_NAMES };

const cache = new Map();
const memo = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };

/** wrap a PixelBuffer into { canvas (lazy), buffer (RGBA bytes), width, height, ...extra } */
function wrap(pb, extra) {
  let cv;
  const o = {
    ...extra, width: pb.w, height: pb.h, pixels: pb,
    get buffer() { return pb.data; },
    get canvas() { if (cv === undefined) cv = pb.toCanvas(); return cv; },
  };
  return o;
}

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const seasonOf = (s) => (SEASONS.includes(s) ? s : 'spring');

/** Character sprite sheet (96x144). outfitSlot: school|casual|sport|swim|work|sleep|'auto' ('auto' = school). */
export function getCharacterSheet(who, outfitSlot = 'auto', season = 'spring') {
  const ch = resolveCharacter(who, outfitSlot, seasonOf(season));
  return memo('cs|' + ch.key, () => wrap(buildCharacterSheet(ch), { ...CHAR_SHEET, slot: ch.slot, season: seasonOf(season) }));
}

/** 48x48 portrait sheet (8 expressions x normal/blink/talk) or null for animals. */
export function getPortraitSheet(who, outfitSlot = 'auto') {
  const w = lookupWho(who);
  if (w.app.animal) return null;
  const ch = resolveCharacter(who, outfitSlot, 'spring');
  return memo('ps|' + ch.key, () => wrap(buildPortraitSheet(ch), { ...PORTRAIT_SHEET }));
}

/** Source rect of one portrait cell in the sheet. face: 'normal'|'blink'|'talk'. */
export function portraitRect(expression = 'neutral', face = 'normal') {
  const col = Math.max(0, EXPRESSIONS.indexOf(expression));
  const row = face === 'blink' ? PORTRAIT_SHEET.rowBlink : face === 'talk' ? PORTRAIT_SHEET.rowTalk : PORTRAIT_SHEET.rowNormal;
  return { sx: col * PORTRAIT_SHEET.size, sy: row * PORTRAIT_SHEET.size, sw: PORTRAIT_SHEET.size, sh: PORTRAIT_SHEET.size };
}

/** Convenience for the UI toolkit: draws one portrait cell at (x,y). Returns false when `who` has none. */
export function drawPortrait(ctx, who, expression, face, x, y, slot = 'auto') {
  const sh = getPortraitSheet(who, slot);
  if (!sh || !sh.canvas) return false;
  const r = portraitRect(expression, face);
  ctx.drawImage(sh.canvas, r.sx, r.sy, r.sw, r.sh, x, y, r.sw, r.sh);
  return true;
}

/** Cat sheet (96x80). */
export function getAnimalSheet(kind = 'cat', fur = 'orange_tabby') {
  return memo(`as|${kind}|${fur}`, () => wrap(buildAnimalSheet(kind, fur), { ...ANIMAL_SHEET, fur }));
}

/** Icon atlas { canvas, size:16, cols:16, names:{name:index}, rows }. */
export function getIconAtlas() {
  return memo('icons', () => {
    const a = buildIconAtlas();
    return wrap(a.sheet, { size: ICON_SHEET.size, cols: ICON_SHEET.cols, rows: a.rows, names: a.names });
  });
}

/** Blit one 16x16 icon at (x,y); unknown names draw a '?' box. */
export function drawIcon(ctx, name, x, y) {
  const a = getIconAtlas();
  let i = a.names[name];
  if (i === undefined) { i = -1; }
  const cv = a.canvas;
  if (!cv) return;
  if (i < 0) { ctx.drawImage(getUnknownIcon().canvas, x, y); return; }
  ctx.drawImage(cv, (i % a.cols) * 16, Math.floor(i / a.cols) * 16, 16, 16, x, y, 16, 16);
}
import { drawIconBuffer } from './icons.js';
function getUnknownIcon() { return memo('icon?', () => wrap(drawIconBuffer('__unknown__'), {})); }

export function getTitleBackdrop(season = 'spring') {
  return memo('tb|' + seasonOf(season), () => wrap(buildTitleBackdrop(seasonOf(season)), { season: seasonOf(season) }));
}

export function getEndingBackdrop(key) {
  return memo('eb|' + key, () => wrap(buildEndingBackdrop(key), { key }));
}

export function getLogo() { return memo('logo', () => wrap(buildLogo(), {})); }

/** Draws the logo with its top-left corner at (x,y); size is getLogo().width x height (176x68). */
export function drawLogo(ctx, x, y) {
  const l = getLogo();
  if (l.canvas) ctx.drawImage(l.canvas, x, y);
}

/** Drop caches (tests). */
export function clearArtCache() { cache.clear(); }
