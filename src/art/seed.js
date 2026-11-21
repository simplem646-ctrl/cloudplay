// appearanceFromSeed: deterministic, valid appearances for background characters.
// Pure data (no DOM). Output passes validateAppearance() from src/data/appearance.js and
// carries two extra art-only fields: `gender` ('m'|'f') and `age` ('teen'|'adult'|'elder'|'child').
import { mulberry32 } from '../core/rng.js';

const SKINS = [['porcelain', 1], ['fair', 3], ['light', 4], ['medium', 3], ['tan', 2], ['brown', 2], ['deep', 1]];
const NATURAL_HAIR = [['black', 5], ['brown', 5], ['chestnut', 4], ['copper', 1], ['ginger', 1], ['blonde', 2], ['navy', 1]];
const DYED_HAIR = ['blue', 'pink', 'purple', 'green', 'red', 'teal', 'silver'];
const OLD_HAIR = [['gray', 4], ['white', 4], ['silver', 3], ['ash', 1]];
const EYES = [['brown', 6], ['black', 4], ['hazel', 2], ['green', 1], ['blue', 1], ['gray', 1], ['amber', 1]];

const TOP_COLORS = ['#e8742a', '#4f8a5b', '#4a78c4', '#c0392b', '#e0a030', '#8a6ad0', '#2a8fbd', '#d8607a', '#6a8fb5', '#7a9a4a', '#a0522d', '#3a8f8a', '#d4a34a', '#9a5aa0', '#5a6a8a'];
const BOTTOM_COLORS = ['#4a4a5a', '#2f3f77', '#6a5a4a', '#4a6a9a', '#5a4a6a', '#3a3a44', '#8a7a5c', '#4a5a4a', '#7a4a4a'];
const ACCENTS = ['#b8332f', '#2f6f4f', '#e0a030', '#2f6f9f', '#7a9bd0', '#e0508a', '#26305a', '#c97a3a', '#8a5ad0'];
const SHOES = ['#3a2c26', '#f2f2f2', '#4a3a30', '#2a2a32', '#6a3a2a'];

const STYLE_BY_KIND = {
  student_m: ['short', 'short', 'sidepart', 'messy', 'spiky', 'buzz', 'curly', 'messy', 'sidepart'],
  student_f: ['bob', 'long', 'ponytail', 'twintails', 'wavy', 'pixie', 'bun', 'braid', 'sidebraid', 'bob', 'ponytail', 'short'],
  adult_m: ['short', 'sidepart', 'messy', 'buzz', 'curly', 'spiky', 'short'],
  adult_f: ['bob', 'long', 'ponytail', 'wavy', 'bun', 'braid', 'pixie', 'curly'],
  elder_m: ['bald', 'short', 'sidepart', 'buzz', 'bald', 'curly'],
  elder_f: ['bun', 'bob', 'short', 'wavy', 'bun', 'curly', 'pixie'],
  child: ['short', 'messy', 'twintails', 'pixie', 'ponytail', 'bun', 'bob', 'spiky'],
};

const TOP_KINDS_CASUAL = ['tee', 'hoodie', 'sweater', 'shirt', 'jersey', 'jacket', 'cardigan', 'blouse', 'turtleneck', 'tank'];
const BOTTOM_KINDS_M = ['pants', 'pants', 'shorts', 'pants'];
const BOTTOM_KINDS_F = ['skirt', 'pants', 'shorts', 'skirt', 'long_skirt', 'overalls'];

export function appearanceFromSeed(seed, extraKind = 'student_m') {
  const kind = STYLE_BY_KIND[extraKind] ? extraKind : 'student_m';
  const rnd = mulberry32((Number(seed) >>> 0) ^ 0x9e3779b9 ^ (kind.length * 7919));
  for (let i = 0; i < 4; i++) rnd();
  const R = {
    next: rnd,
    int: (lo, hi) => lo + Math.floor(rnd() * (hi - lo + 1)),
    pick: (a) => a[Math.floor(rnd() * a.length)],
    chance: (p) => rnd() < p,
    weighted(items) {
      const total = items.reduce((s, [, w]) => s + w, 0);
      let r = rnd() * total;
      for (const [v, w] of items) { r -= w; if (r <= 0) return v; }
      return items[items.length - 1][0];
    },
  };
  const gender = kind.endsWith('_f') ? 'f' : kind.endsWith('_m') ? 'm' : R.chance(0.5) ? 'f' : 'm';
  const age = kind.startsWith('student') ? 'teen' : kind.startsWith('adult') ? 'adult' : kind.startsWith('elder') ? 'elder' : 'child';

  const style = R.pick(STYLE_BY_KIND[kind]);
  let hairColor;
  if (age === 'elder') hairColor = R.weighted(OLD_HAIR);
  else if (age === 'teen' && R.chance(0.1)) hairColor = R.pick(DYED_HAIR);
  else hairColor = R.weighted(NATURAL_HAIR);
  const hair = { style, color: hairColor };
  if (age !== 'elder' && style !== 'bald' && R.chance(0.1)) hair.highlight = R.pick(['blonde', 'copper', 'blue', 'pink', 'ash']);

  const acc = [];
  if (R.chance(age === 'elder' ? 0.55 : 0.2)) acc.push(R.pick(['glasses', 'round_glasses']));
  if (R.chance(0.2) && gender === 'f' && !['bald', 'bun', 'twintails'].includes(style)) acc.push(R.pick(['ribbon', 'hairclip', 'headband']));
  if (R.chance(0.12) && gender === 'm') acc.push('headband');
  if (R.chance(0.15) && age !== 'elder') acc.push('freckles');
  if (R.chance(0.2) && (age === 'teen' || age === 'child')) acc.push('bag');
  if (gender === 'm' && age !== 'teen' && age !== 'child' && R.chance(0.3)) acc.push(R.pick(['mustache', 'beard']));
  if (age === 'elder' && gender === 'm' && R.chance(0.4) && !acc.includes('beard') && !acc.includes('mustache')) acc.push(R.pick(['mustache', 'beard']));
  if (R.chance(0.08)) acc.push(R.pick(['cap', 'beanie']));
  if (R.chance(0.06) && age === 'teen') acc.push(R.pick(['earphones', 'headphones']));
  if (R.chance(0.05)) acc.push('scarf');
  if (R.chance(0.05)) acc.push('bandage');
  const accessories = [...new Set(acc)];

  const topC = R.pick(TOP_COLORS), botC = R.pick(BOTTOM_COLORS), acc1 = R.pick(ACCENTS), shoes = R.pick(SHOES);
  const wear = (top, bottom, tc, bc, ac = '#ffffff', sh = shoes) => ({ top, bottom, colors: { top: tc, bottom: bc, accent: ac, shoes: sh } });
  const casualKinds = gender === 'f' ? BOTTOM_KINDS_F : BOTTOM_KINDS_M;
  const outfits = {};
  let casual;
  if (age === 'child') {
    casual = wear(R.pick(['tee', 'hoodie', 'tee', 'sweater']), R.pick(['shorts', 'overalls', 'pants', 'skirt']), topC, R.pick(['#4a6a9a', '#6a5a4a', '#3f6f9f', '#8a5a7a']), R.pick(ACCENTS), R.pick(['#f2f2f2', '#c0392b', '#4a78c4']));
    outfits.school = casual;
  } else if (age === 'elder') {
    casual = wear(R.pick(['cardigan', 'sweater', 'shirt', 'blouse']), gender === 'f' ? R.pick(['long_skirt', 'pants', 'skirt']) : 'pants',
      R.pick(['#8a7a5a', '#6a7a5a', '#a0805a', '#7a6a8a', '#5a7a8a', '#b07a7a']), R.pick(['#4a4a44', '#5a4a4a', '#4a4a5a']), '#ffffff', '#2a2420');
    outfits.school = casual;
  } else {
    casual = wear(R.pick(TOP_KINDS_CASUAL), R.pick(casualKinds), topC, botC, R.pick(['#ffffff', '#f2e8d0', acc1]), shoes);
    if (age === 'teen') {
      const blazer = '#2f3f77';
      outfits.school = gender === 'f'
        ? { preset: 'uniform_f', colors: { top: blazer, bottom: R.pick(['#59507a', '#59507a', '#4b4f6e']), accent: acc1, shoes: '#3a2c26' } }
        : { preset: 'uniform_m', colors: { top: blazer, bottom: '#4b4f6e', accent: acc1, shoes: '#3a2c26' } };
    } else {
      outfits.school = wear(R.pick(['shirt', 'jacket', 'sweater', 'blouse', 'jersey']), gender === 'f' ? R.pick(['skirt', 'pants', 'long_skirt']) : 'pants', R.pick(TOP_COLORS), botC, '#ffffff', shoes);
    }
  }
  outfits.casual = casual;
  const app = {
    skin: R.weighted(SKINS),
    height: age === 'child' ? -1 : age === 'elder' ? R.pick([-1, 0, 0]) : R.pick([-1, 0, 0, 0, 1]),
    build: age === 'child' ? 'slim' : R.pick(['slim', 'normal', 'normal', 'sturdy']),
    hair,
    eyes: R.weighted(EYES),
    accessories,
    outfits,
    gender,
    age,
  };
  return app;
}
