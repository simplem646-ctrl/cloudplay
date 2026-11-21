/** Assembles the merged, vertex-coloured geometry of one character (cached per id|season|look). Pure geometry; no WebGL. */
import { APPEARANCES } from './appearances.js';
import { DIM, buildTorso, buildLeg, buildArm, buildSkull } from './body.js';
import { buildHair } from './hair.js';
import { LAYERS, HEADGEAR } from './outfit.js';
import { merge, xf, mix } from './kit.js';

const cache = new Map();
/** mirrors core/state.js DEFAULT_LOOK (kept local so this module only imports registry/util-level code) */
export const DEFAULT_LOOK = { hair: '#4b3425', jacket: '#3b5b9c', scarf: '#e8833a' };

function resolveVars(v, look) {
  if (typeof v === 'string') {
    if (v[0] === '$') return look[v.slice(1)] || v;
    return v;
  }
  if (Array.isArray(v)) return v.map((x) => resolveVars(x, look));
  if (v && typeof v === 'object') {
    const o = {};
    for (const k of Object.keys(v)) o[k] = resolveVars(v[k], look);
    return o;
  }
  return v;
}

const SUMMER_DROP = new Set(['shawl', 'scarf', 'coat', 'jacket', 'vest']);

/** Seasonal variant of an appearance: winter coat + scarf + beanie, summer light wear. */
export function seasonalAppearance(app, season) {
  if (season === 'winter') {
    const a = JSON.parse(JSON.stringify(app));
    const w = app.warm || {};
    const coat = w.coat || '#6a5a7a', scarf = w.scarf || '#e8e2d0';
    const keepOuter = new Set(['cape', 'poncho', 'backpack', 'satchel', 'sack', 'basketarm', 'apron', 'spyglass']);
    a.layers = a.layers.filter(([k]) => keepOuter.has(k) || k === 'skirt' || k === 'bib' || k === 'toolbelt' || k === 'suspenders' || k === 'tie' || k === 'bowtie' || k === 'chain' || k === 'charm' || k === 'buttons' || k === 'belt');
    const hasBulky = a.layers.some(([k]) => k === 'cape' || k === 'poncho');
    if (!hasBulky && !a.layers.some(([k]) => k === 'coat')) {
      a.layers = a.layers.filter(([k]) => k !== 'apron' && k !== 'skirt' && k !== 'bib' && k !== 'suspenders' && k !== 'tie' && k !== 'buttons' && k !== 'chain' && k !== 'charm' && k !== 'bowtie');
      a.layers.unshift(['coat', { color: coat, puff: true, bottom: a.kind === 'kid' ? -0.06 : -0.1 }]);
      a.arms = { ...a.arms, color: coat, len: 1, stripes: null, plaid: null };
    }
    if (!a.layers.some(([k]) => k === 'scarf')) a.layers.push(['scarf', { color: scarf, tail: null }]);
    const hatted = (a.headgear || []).some(([k]) => k === 'strawhat' || k === 'widehat') || ['beard_cap', 'wild_beard'].includes(a.hair.style);
    if (!hatted) {
      a.headgear = (a.headgear || []).filter(([k]) => k !== 'goggles');
      a.headgear.push(['beanie', { color: scarf === coat ? '#c04050' : mix(scarf, coat, 0.25), band: scarf }]);
    }
    if (a.hair.style === 'bun' || a.hair.style === 'bun_needle' || a.hair.style === 'wavy_halfup') { /* hair stays, hat sits over the top */ }
    a.legs = { ...a.legs, len: 1, color: a.legs.len >= 0.9 ? a.legs.color : mix(a.legs.color === a.skin ? '#6a5a50' : a.legs.color, '#3a3040', 0.3) };
    return a;
  }
  if (season === 'summer') {
    const a = JSON.parse(JSON.stringify(app));
    const keep = new Set((a.summer && a.summer.keep) || []);
    const dropped = a.layers.filter(([k]) => SUMMER_DROP.has(k) && !keep.has(k));
    a.layers = a.layers.filter(([k]) => !(SUMMER_DROP.has(k) && !keep.has(k)));
    if (dropped.length) a.arms = { ...a.arms, color: a.torso.color, len: Math.min(0.3, a.arms.len), cuff: null, stripes: null };
    else a.arms = { ...a.arms, len: Math.min(a.arms.len, 0.35) };
    if (a.legs.len > 0.9 && a.kind !== 'elder') a.legs = { ...a.legs, len: 0.45 };
    return a;
  }
  return app;
}

export function resolveAppearance(id, season = 'spring', lookIn = {}) {
  const look = { ...DEFAULT_LOOK, ...(lookIn || {}) };
  const base = APPEARANCES[id];
  if (!base) return null;
  const withLook = resolveVars(base, look);
  if (id === 'player' && look.hair) withLook.hair = { ...withLook.hair, color: look.hair };
  const app = seasonalAppearance(withLook, season);
  app.id = id;
  app.build = app.build || { w: 1, belly: 0 };
  app.headgear = app.headgear || [];
  return app;
}

/** Geometry bundle for a character. */
export function buildParts(id, season = 'spring', lookIn = {}) {
  const look = { ...DEFAULT_LOOK, ...(lookIn || {}) };
  const key = `${id}|${season}|${look.hair}|${look.jacket}|${look.scarf}`;
  if (cache.has(key)) return cache.get(key);
  const app = resolveAppearance(id, season, look);
  if (!app) throw new Error(`unknown character "${id}"`);
  const skull = buildSkull(app);
  const H = { rx: skull.rx, ry: skull.ry, rz: skull.rz };
  const ctx = { app, H, torso: [], head: [], armL: [], armR: [], legs: [], sway: {} };
  for (const [kind, opts] of app.layers) {
    if (!LAYERS[kind]) throw new Error(`unknown layer ${kind}`);
    LAYERS[kind](ctx, opts);
  }
  for (const [kind, opts] of app.headgear) {
    if (!HEADGEAR[kind]) throw new Error(`unknown headgear ${kind}`);
    HEADGEAR[kind](ctx, opts);
  }
  const headParts = [skull.geo, ...ctx.head];
  for (const piece of buildHair(app, H, look)) {
    if (piece.sway) {
      const k = `head:${piece.sway}`;
      (ctx.sway[k] ||= { parent: 'head', id: piece.sway, pivot: piece.pivot || [0, 0, 0], geos: [] }).geos.push(piece.geo);
    } else headParts.push(piece.geo);
  }
  const colors = { torso: app.torso.color };
  const armL = merge([buildArm(app, colors, 1), ...ctx.armL]);
  const armR = ctx.armR.length ? merge([buildArm(app, colors, -1), ...ctx.armR]) : buildArm(app, colors, -1);
  const sways = Object.values(ctx.sway).map((s) => {
    const g = merge(s.geos);
    xf(g, { p: [-s.pivot[0], -s.pivot[1], -s.pivot[2]] });
    return { parent: s.parent, id: s.id, pivot: s.pivot, geo: g };
  });
  const parts = {
    app, key, H, skull, sways, nominalTop: DIM.topY,
    torso: merge([buildTorso(app, colors), ...ctx.torso]),
    leg: buildLeg(app, colors),
    armL, armR,
    head: merge(headParts),
  };
  cache.set(key, parts);
  return parts;
}

export function clearBuildCache() {
  for (const p of cache.values()) for (const g of [p.torso, p.leg, p.armL, p.armR, p.head, ...p.sways.map((s) => s.geo)]) g && g.dispose();
  cache.clear();
}
