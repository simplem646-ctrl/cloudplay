// Art gallery harness (Canvas2D). Build:  node scripts/build.mjs --entry src/dev/art_gallery.js --out dist/dev/art_gallery.html
// Query: ?view=cast|portraits|icons|extras|title|ending|animals  &season=summer &who=nina &scale=4 &slot=casual
import {
  getCharacterSheet, getPortraitSheet, getAnimalSheet, getIconAtlas, getTitleBackdrop, getEndingBackdrop, getLogo,
  ENDING_KEYS,
} from '../art/index.js';
import { CAST, EXTRAS } from '../data/cast.js';

const q = new URLSearchParams(location.search);
const view = q.get('view') || 'cast';
const season = q.get('season') || 'spring';
const slot = q.get('slot') || 'school';
const scale = Number(q.get('scale') || (view === 'icons' ? 4 : view === 'portraits' ? 3 : view === 'title' || view === 'ending' ? 1 : 3));
const who = q.get('who');

document.body.style.cssText = 'margin:0;background:#3a4a62;color:#f4ead5;font:12px monospace';
const root = document.createElement('div');
root.style.cssText = 'display:flex;flex-wrap:wrap;gap:10px;padding:8px';
document.body.appendChild(root);

function cell(canvas, label, w = canvas.width, h = canvas.height) {
  const d = document.createElement('div');
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  c.style.cssText = `width:${w * scale}px;height:${h * scale}px;image-rendering:pixelated;background:#8a9ab0`;
  c.getContext('2d').drawImage(canvas, 0, 0);
  d.appendChild(c);
  const l = document.createElement('div');
  l.textContent = label;
  d.appendChild(l);
  root.appendChild(d);
  return c;
}

const castIds = CAST.filter((c) => c.kind !== 'animal').map((c) => c.id);
const ids = who ? who.split(',') : view === 'extras' ? EXTRAS.map((e) => e.id) : castIds;

if (view === 'cast' || view === 'extras') for (const id of ids) cell(getCharacterSheet(id, slot, season).canvas, `${id} ${slot} ${season}`);
else if (view === 'portraits') for (const id of (who ? ids : ['theo', 'nina', 'elise', 'clara', 'mari', 'vera'])) cell(getPortraitSheet(id, slot).canvas, id);
else if (view === 'icons') cell(getIconAtlas().canvas, 'icons');
else if (view === 'animals') for (const fur of ['orange_tabby', 'black', 'gray', 'white', 'calico']) cell(getAnimalSheet('cat', fur).canvas, fur);
else if (view === 'title') { cell(getTitleBackdrop(season).canvas, 'title ' + season); cell(getLogo().canvas, 'logo'); }
else if (view === 'ending') for (const k of ENDING_KEYS) cell(getEndingBackdrop(k).canvas, k);
