// Resolves "who" (cast id / extras id / appearance object) + outfit slot + season into a
// plain drawing description used by both the sprite and the portrait generators.
// Pure data logic: no DOM.
import { CAST_BY_ID, EXTRAS_BY_ID } from '../data/cast.js';
import {
  SKIN_TONES, HAIR_COLORS, EYE_COLORS, FUR, OUTFIT_SLOTS, HAIR_STYLES, ACCESSORIES,
} from '../data/appearance.js';
import { hashString } from '../core/rng.js';
import { C, mix, ramp, lighten, darken, hsl, rgb2hsl } from './color.js';
import { appearanceFromSeed } from './seed.js';

export const SEASON_LIST = ['spring', 'summer', 'autumn', 'winter'];

/** Returns { key, app, id, gender, age, kind } for any `who`. */
export function lookupWho(who) {
  if (who && typeof who === 'object') {
    const app = who.appearance && !who.skin ? who.appearance : who;
    let gender = who.gender || app.gender;
    if (!gender) gender = guessGender(app);
    return { key: 'o:' + JSON.stringify(app), app, id: null, gender, age: app.age || guessAge(app, who), kind: who.kind || 'student' };
  }
  const id = String(who);
  const c = CAST_BY_ID[id];
  if (c) return { key: 'c:' + id, app: c.appearance, id, gender: c.gender, age: ageOfCast(c), kind: c.kind };
  const e = EXTRAS_BY_ID[id];
  if (e) {
    const app = appearanceFromSeed(e.seed, e.extraKind);
    return { key: 'e:' + id, app, id, gender: app.gender, age: app.age, kind: 'extra' };
  }
  throw new Error(`art: unknown character "${id}"`);
}

function guessGender(app) {
  const o = app.outfits && (app.outfits.school || app.outfits.casual);
  if (o && o.preset === 'uniform_f') return 'f';
  if (o && o.preset === 'uniform_m') return 'm';
  if (o && (o.bottom === 'skirt' || o.bottom === 'long_skirt')) return 'f';
  const st = app.hair && app.hair.style;
  if (['bob', 'twintails', 'sidebraid', 'braid', 'bun', 'pixie', 'long', 'wavy'].includes(st)) return 'f';
  return 'm';
}

function guessAge(app, who) {
  if (who.age) return who.age;
  const st = app.hair && app.hair.style;
  const hc = app.hair && app.hair.color;
  if (['white', 'silver', 'gray'].includes(hc) && !['spiky', 'messy'].includes(st)) return 'elder';
  return 'teen';
}

function ageOfCast(c) {
  if (c.kind === 'student' || c.kind === 'player') return 'teen';
  if (c.id === 'rosa' || c.id === 'mr_finch') return 'elder';
  if (c.id === 'principal_marsh' || c.id === 'mr_larkin' || c.id === 'dr_fennel' || c.id === 'mayor_greer') return 'senior';
  if (c.id === 'tomas') return 'young';
  return 'adult';
}

// ---- colour pieces ------------------------------------------------------------
export function skinRamp(skin) { return ramp(SKIN_TONES[skin] || SKIN_TONES.light); }

export function hairRamp(name) {
  const base = HAIR_COLORS[name] || HAIR_COLORS.brown;
  return ramp(base);
}

export function eyeColors(name) {
  const base = C(EYE_COLORS[name] || EYE_COLORS.brown);
  return { base, dark: mix(base, '#1a1220', 0.55), light: mix(base, '#fff6dc', 0.4) };
}

// ---- outfit normalisation -----------------------------------------------------
const shortTops = new Set(['tee', 'tank', 'jersey']);

/** Tone down a top colour into a winter coat colour. */
function coatColor(topHex) {
  const [h, s, l] = rgb2hsl(C(topHex));
  return hsl(h, Math.min(0.6, s * 0.8 + 0.1), Math.min(0.46, Math.max(0.26, l * 0.8)));
}

/**
 * Normalise an outfit spec (+ season, gender) to:
 * { shirt, sleeve:'long'|'short'|'none', neck, over, overColor, overLen, apron, tie:{kind,color}|null,
 *   scarf, stripe, bottom:{kind,color}, overalls, swim:null|'one'|'trunks', shoes, socks, accent, vest, trim, name }
 */
export function normalizeOutfit(o, season, gender) {
  const col = o.colors || {};
  const top = col.top, bottomC = col.bottom || col.top, accent = col.accent || '#ffffff', shoes = col.shoes || '#4a3a30';
  const female = gender === 'f';
  const out = {
    name: o.preset || `${o.top}/${o.bottom}`,
    shirt: top, sleeve: 'long', neck: 'crew', over: null, overColor: null, overLen: 'short',
    apron: null, tie: null, scarf: null, stripe: null, vest: null, trim: null,
    bottom: { kind: 'pants', color: bottomC }, overalls: false, swim: null,
    shoes, socks: null, accent, extra: null,
  };
  const summer = season === 'summer';
  const winter = season === 'winter';

  if (o.preset) {
    switch (o.preset) {
      case 'uniform_m':
      case 'uniform_f': {
        const f = o.preset === 'uniform_f';
        out.shirt = '#f6f2ea'; out.neck = 'collar';
        out.over = summer ? null : 'blazer'; out.overColor = top;
        out.sleeve = summer ? 'short' : 'long';
        out.tie = { kind: f ? 'ribbon' : 'tie', color: accent };
        out.bottom = { kind: f ? 'skirt' : 'pants', color: bottomC };
        if (winter) out.scarf = mix(accent, '#f6ecd2', 0.2);
        if (summer && !f) out.shirt = '#f6f2ea';
        break;
      }
      case 'pe':
        out.sleeve = winter ? 'long' : 'short'; out.neck = 'crew'; out.stripe = accent;
        out.bottom = { kind: winter ? 'pants' : 'shorts', color: bottomC };
        break;
      case 'track':
        out.sleeve = 'none'; out.neck = 'crew'; out.stripe = accent;
        out.bottom = { kind: 'shorts', color: bottomC, short: true };
        break;
      case 'soccer':
        out.sleeve = 'short'; out.neck = 'collar'; out.stripe = accent;
        out.bottom = { kind: 'shorts', color: bottomC }; out.socks = top;
        break;
      case 'swim':
        out.swim = female ? 'one' : 'trunks'; out.sleeve = 'none';
        out.shirt = top; out.bottom = { kind: 'trunks', color: bottomC };
        break;
      case 'apron':
        out.sleeve = 'short'; out.neck = 'collar'; out.apron = accent;
        out.bottom = { kind: 'pants', color: bottomC };
        if (winter) out.scarf = mix(accent, '#f6ecd2', 0.35);
        break;
      case 'labcoat':
        out.shirt = accent; out.neck = 'collar'; out.over = 'labcoat'; out.overColor = top; out.overLen = 'long';
        out.sleeve = 'long';
        out.bottom = { kind: female ? 'skirt' : 'pants', color: bottomC };
        if (winter) out.scarf = '#c9573f';
        break;
      case 'suit':
        out.shirt = '#f6f2ea'; out.neck = 'collar'; out.over = 'suit'; out.overColor = top;
        out.tie = { kind: female ? 'brooch' : 'tie', color: accent };
        out.bottom = { kind: female ? 'skirt' : 'pants', color: bottomC };
        out.sleeve = summer ? 'short' : 'long';
        if (summer) out.over = null, out.shirt = '#f6f2ea';
        if (winter) out.scarf = mix(accent, '#a05a4a', 0.4);
        break;
      case 'coach':
        out.shirt = accent; out.neck = 'collar'; out.over = 'trackjacket'; out.overColor = top; out.stripe = accent;
        out.bottom = { kind: 'pants', color: bottomC };
        out.sleeve = summer ? 'short' : 'long';
        if (summer) out.over = null, out.shirt = top;
        break;
      case 'formal':
        out.shirt = '#f6f2ea'; out.neck = 'collar'; out.over = 'suit'; out.overColor = top;
        out.vest = accent; out.trim = accent;
        out.tie = { kind: female ? 'pearls' : 'tie', color: accent };
        out.bottom = { kind: female ? 'long_skirt' : 'pants', color: bottomC };
        out.sleeve = summer ? 'short' : 'long';
        if (summer) out.over = null;
        if (winter) out.scarf = mix(accent, '#f6ecd2', 0.2);
        break;
      case 'pajamas':
        out.sleeve = 'long'; out.neck = 'collar'; out.trim = accent;
        out.bottom = { kind: 'pants', color: bottomC, loose: true };
        if (summer) { out.sleeve = 'short'; out.bottom = { kind: 'shorts', color: bottomC, loose: true }; }
        break;
      default: break;
    }
  } else {
    // free-form casual wear
    out.bottom = { kind: o.bottom === 'overalls' ? 'pants' : o.bottom, color: bottomC };
    out.overalls = o.bottom === 'overalls';
    switch (o.top) {
      case 'tee': out.sleeve = 'short'; out.neck = 'crew'; break;
      case 'tank': out.sleeve = 'none'; out.neck = 'crew'; break;
      case 'hoodie': out.neck = 'hood'; out.extra = 'pocket'; break;
      case 'sweater': out.neck = 'crew'; out.trim = mix(top, '#ffffff', 0.25); break;
      case 'blouse': out.neck = 'collar'; out.sleeve = 'long'; out.trim = accent; break;
      case 'cardigan': out.shirt = accent; out.neck = 'crew'; out.over = 'cardigan'; out.overColor = top; break;
      case 'jacket': out.shirt = accent; out.neck = 'crew'; out.over = 'jacket'; out.overColor = top; break;
      case 'jersey': out.sleeve = 'short'; out.neck = 'collar'; out.stripe = accent; break;
      case 'shirt': out.neck = 'collar'; out.sleeve = 'long'; break;
      case 'turtleneck': out.neck = 'turtle'; break;
      default: break;
    }
    if (summer && !shortTops.has(o.top)) {
      out.sleeve = 'short';
      if (out.over === 'cardigan' || out.over === 'jacket') { out.over = null; out.shirt = top; }
    }
    if (out.overalls) out.stripe = null;
    if (winter && o.top !== 'jacket') {
      out.over = 'coat'; out.overColor = coatColor(top); out.overLen = 'long'; out.sleeve = 'long';
      out.coatInner = top;
    } else if (winter) {
      out.scarf = mix(accent, '#c9573f', 0.5);
    }
  }
  return out;
}

/** Everything the drawing code needs. */
export function resolveCharacter(who, outfitSlot = 'auto', season = 'spring') {
  const w = lookupWho(who);
  const app = w.app;
  if (app.animal) throw new Error('art: resolveCharacter called for an animal');
  let slot = outfitSlot;
  if (!slot || slot === 'auto' || !OUTFIT_SLOTS.includes(slot)) slot = 'school';
  let outfit = app.outfits[slot];
  if (!outfit) { outfit = app.outfits.casual || app.outfits.school; slot = app.outfits.casual ? 'casual' : 'school'; }
  const norm = normalizeOutfit(outfit, SEASON_LIST.includes(season) ? season : 'spring', w.gender);
  const hair = app.hair || { style: 'short', color: 'brown' };
  const acc = new Set(app.accessories || []);
  if (!norm.scarf && acc.has('scarf')) norm.scarf = norm.accent && norm.accent !== '#ffffff' ? norm.accent : '#c9573f';
  const traitKey = w.id || 'x' + (hashString(JSON.stringify(app)) % 997);
  return {
    key: `${w.key}|${slot}|${season}`,
    id: w.id, gender: w.gender, age: w.age, kind: w.kind, slot,
    skin: skinRamp(app.skin), skinName: app.skin,
    hair: { style: hair.style, ramp: hairRamp(hair.color), hl: hair.highlight ? hairRamp(hair.highlight) : null, name: hair.color },
    eyes: eyeColors(app.eyes), eyeName: app.eyes,
    acc, outfit: norm,
    height: typeof app.height === 'number' ? Math.max(-1, Math.min(1, app.height)) : 0,
    build: app.build || 'normal',
    traitKey,
  };
}

export { SKIN_TONES, HAIR_COLORS, EYE_COLORS, FUR, HAIR_STYLES, ACCESSORIES, lighten, darken };
