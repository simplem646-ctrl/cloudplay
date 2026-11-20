// Appearance vocabulary: the CONTRACT between cast data (src/data/cast.js), the art
// generator (src/art/**) and anyone describing a character. OWNED BY THE LEAD.
// Art must implement every value listed here. Art may ADD extra colours/styles in its
// own module but must never rename or drop a value below.

export const SKIN_TONES = {
  porcelain: '#fde3d0',
  fair: '#f8d2b4',
  light: '#f2c29b',
  medium: '#d9a073',
  tan: '#bd8456',
  brown: '#8d5a3b',
  deep: '#5f3b27',
};

export const HAIR_COLORS = {
  black: '#2a2332',
  brown: '#5b3a29',
  chestnut: '#7a4a2b',
  copper: '#b8562a',
  ginger: '#d27a3a',
  blonde: '#e3b95a',
  ash: '#c9bfa8',
  silver: '#cfd3dc',
  white: '#f1f1f1',
  gray: '#8d8d99',
  blue: '#4d6cc2',
  navy: '#26305a',
  pink: '#e68bb0',
  purple: '#8a5bb5',
  green: '#4f9a6a',
  red: '#b22a3a',
  teal: '#3a9a9a',
};

export const EYE_COLORS = {
  brown: '#4a2c1a',
  hazel: '#8a6a2a',
  green: '#3f7f4f',
  blue: '#3f6fb5',
  gray: '#7a8794',
  amber: '#b87a1a',
  violet: '#7a4aa5',
  black: '#1a1620',
};

// Hair styles. 'highlight' (optional, a HAIR_COLORS key) adds a streak/tips.
export const HAIR_STYLES = [
  'bald', 'buzz', 'short', 'sidepart', 'messy', 'spiky', 'curly', 'afro',
  'bob', 'pixie', 'long', 'wavy', 'ponytail', 'twintails', 'bun', 'braid', 'sidebraid',
];

export const ACCESSORIES = [
  'glasses', 'round_glasses', 'headband', 'hairclip', 'ribbon', 'cap', 'beanie',
  'earphones', 'headphones', 'bandage', 'freckles', 'scarf', 'bag', 'badge',
  'whistle', 'mustache', 'beard',
];

// Outfit presets (special designs) and the free-form parts for casual wear.
export const OUTFIT_PRESETS = [
  'uniform_m', 'uniform_f', // school: navy blazer + ribbon/tie (accent colour). Art auto-switches: summer = short sleeves/no blazer, winter = adds scarf.
  'pe', 'track', 'soccer', 'swim', 'apron', 'labcoat', 'suit', 'coach', 'formal', 'pajamas',
];
export const TOPS = ['tee', 'tank', 'hoodie', 'sweater', 'blouse', 'cardigan', 'jacket', 'jersey', 'shirt', 'turtleneck'];
export const BOTTOMS = ['pants', 'shorts', 'skirt', 'long_skirt', 'overalls'];
// Outfit slots a character can define. 'school' and 'casual' are mandatory for
// students/teachers/townsfolk; others optional (Art falls back to 'casual').
export const OUTFIT_SLOTS = ['school', 'casual', 'sport', 'swim', 'work', 'sleep'];

// Outfit spec: { preset } OR { top, bottom }, plus colours (all hex strings):
//   { preset:'uniform_f', colors:{ top, bottom, accent, shoes } }
//   { top:'hoodie', bottom:'pants', colors:{ top, bottom, accent, shoes } }
// In winter Art adds a coat/scarf layer to casual outfits; in summer it shortens sleeves.

export const HEIGHTS = { short: -1, normal: 0, tall: 1 }; // sprite stays 16x24; Art varies head/body proportions slightly
export const BUILDS = ['slim', 'normal', 'sturdy'];
export const ANIMALS = ['cat'];
export const FUR = { orange_tabby: '#e08a3c', black: '#2a2630', gray: '#8e8e9a', white: '#f2efe9', calico: '#e8c9a0' };

// Seeded "extra" (background) characters: Art provides appearanceFromSeed(seed, kind).
export const EXTRA_KINDS = ['student_m', 'student_f', 'adult_m', 'adult_f', 'elder_m', 'elder_f', 'child'];

/** Returns a list of problems (empty = valid). Used by tests and validate-content. */
export function validateAppearance(a, label = 'appearance') {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(`${label}: ${msg}`); };
  if (a.animal) {
    need(ANIMALS.includes(a.animal), `unknown animal ${a.animal}`);
    need(a.fur in FUR, `unknown fur ${a.fur}`);
    return errs;
  }
  need(a.skin in SKIN_TONES, `unknown skin ${a.skin}`);
  need(a.hair && HAIR_STYLES.includes(a.hair.style), `unknown hair style ${a.hair && a.hair.style}`);
  need(a.hair && a.hair.color in HAIR_COLORS, `unknown hair colour ${a.hair && a.hair.color}`);
  if (a.hair && a.hair.highlight) need(a.hair.highlight in HAIR_COLORS, `unknown highlight ${a.hair.highlight}`);
  need(a.eyes in EYE_COLORS, `unknown eyes ${a.eyes}`);
  for (const acc of a.accessories || []) need(ACCESSORIES.includes(acc), `unknown accessory ${acc}`);
  need(a.outfits && a.outfits.school && a.outfits.casual, 'needs outfits.school and outfits.casual');
  for (const [slot, o] of Object.entries(a.outfits || {})) {
    need(OUTFIT_SLOTS.includes(slot), `unknown outfit slot ${slot}`);
    if (o.preset) need(OUTFIT_PRESETS.includes(o.preset), `unknown preset ${o.preset} in ${slot}`);
    else {
      need(TOPS.includes(o.top), `unknown top ${o.top} in ${slot}`);
      need(BOTTOMS.includes(o.bottom), `unknown bottom ${o.bottom} in ${slot}`);
    }
    need(o.colors && o.colors.top, `outfit ${slot} needs colors.top`);
  }
  return errs;
}
