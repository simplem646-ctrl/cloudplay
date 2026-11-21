// MapBuilder: the DSL every Bellhaven map is written with, plus validateMap().
// See docs/game/api/world.md for the cheat-sheet. Pure data/logic: no DOM, importable in Node.
import { TILES, NAME_TO_INDEX, TERRAINS } from './tiles.js';
import { MAP_IDS, INTERACT_ACTIONS, SHOP_IDS, ACTIVITY_IDS } from '../data/ids.js';
import { SFX_IDS } from '../data/ids.js';
import { validateCondition } from '../sim/script_dsl.js';
import { RNG } from '../core/rng.js';
import { hash2 } from './gfx.js';
import { SIZES, INDOOR, NEIGHBOURS, GATED_WARPS, REQUIRED_INTERACTABLES, requiredAnchors } from './spec.js';
import { STAMPS } from './stamps.js';

const DIRS = ['down', 'left', 'right', 'up'];
const MUSIC_SPECIAL = ['town', 'school'];

export class MapBuilder {
  /**
   * @param {string} id  map id from MAP_IDS
   * @param {{name:string,width?:number,height?:number,indoor?:boolean,base?:string|null,ambient?:object}} o
   * width/height default to the doc-04 size; `base` is the terrain the map starts filled with
   * (outdoor default 'grass', indoor default none).
   */
  constructor(id, o = {}) {
    this.id = id;
    this.name = o.name || id;
    const [dw, dh] = SIZES[id] || [o.width, o.height];
    this.width = o.width ?? dw;
    this.height = o.height ?? dh;
    if (!this.width || !this.height) throw new Error(`MapBuilder(${id}): width/height required`);
    this.indoor = o.indoor ?? INDOOR.has(id);
    this.ambient = {
      music: null, lighting: this.indoor ? 'indoor' : 'outdoor', weather: !this.indoor, ambience: null, ...(o.ambient || {}),
    };
    const n = this.width * this.height;
    this.layers = { ground: new Uint16Array(n), deco: new Uint16Array(n), above: new Uint16Array(n) };
    this.terr = { ground: new Array(n).fill(null), deco: new Array(n).fill(null) };
    this.override = new Uint8Array(n); // 1 = block, 2 = clear
    this.anchors = {};
    this.warps = [];
    this.interactables = [];
    this.seed = o.seed ?? 1;
    const base = o.base === undefined ? (this.indoor ? null : 'grass') : o.base;
    if (base) this.fill(base);
  }

  // ------------------------------------------------------------ helpers
  idx(x, y) { return y * this.width + x; }
  inBounds(x, y) { return x >= 0 && y >= 0 && x < this.width && y < this.height; }
  _check(x, y, what) {
    if (!this.inBounds(x, y)) throw new Error(`${this.id}: ${what} at (${x},${y}) is outside the ${this.width}x${this.height} map`);
  }
  _tile(name) {
    const i = NAME_TO_INDEX[name];
    if (i === undefined) throw new Error(`${this.id}: unknown tile "${name}" (see the catalog in docs/game/api/world.md)`);
    return i;
  }

  // ------------------------------------------------------------ terrain painting (autotiled at build())
  _terrain(name) {
    const t = TERRAINS[name];
    if (!t) throw new Error(`${this.id}: unknown terrain "${name}". Known: ${Object.keys(TERRAINS).join(', ')}`);
    return t;
  }
  _paintCell(name, x, y) {
    if (!this.inBounds(x, y)) return;
    const t = this._terrain(name);
    this.terr[t.layer][this.idx(x, y)] = name;
  }
  /** fill the whole ground layer with a terrain */
  fill(terrain) { return this.rect(terrain, 0, 0, this.width, this.height); }
  rect(terrain, x, y, w, h) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this._paintCell(terrain, x + i, y + j);
    return this;
  }
  /** one-cell-wide (or `thick`) straight/diagonal line (Bresenham) */
  line(terrain, x1, y1, x2, y2, thick = 1) {
    const dx = Math.abs(x2 - x1), dy = Math.abs(y2 - y1), sx = x1 < x2 ? 1 : -1, sy = y1 < y2 ? 1 : -1;
    let err = dx - dy, x = x1, y = y1;
    const off = Math.floor((thick - 1) / 2);
    for (;;) {
      this.rect(terrain, x - off, y - off, thick, thick);
      if (x === x2 && y === y2) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }
    return this;
  }
  /** polyline of axis-aligned/diagonal segments through [[x,y],...] */
  path(terrain, pts, thick = 2) {
    for (let i = 0; i < pts.length - 1; i++) this.line(terrain, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], thick);
    return this;
  }
  /** organic blob (pond, lawn, patch of sand). roughness 0..1 wobbles the edge deterministically */
  blob(terrain, cx, cy, rx, ry, { seed = 1, roughness = 0.25 } = {}) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        const wob = 1 + (hash2(x, y, seed) - 0.5) * 2 * roughness;
        if (dx * dx + dy * dy <= wob) this._paintCell(terrain, x, y);
      }
    }
    return this;
  }
  /** remove deco-terrain (hedge/fence) cells in a rect, e.g. to leave a gap for a gate */
  gap(x, y, w = 1, h = 1) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.inBounds(x + i, y + j)) this.terr.deco[this.idx(x + i, y + j)] = null;
    return this;
  }

  // ------------------------------------------------------------ raw tile placement
  /** put a catalog tile (layer defaults to the tile's own layer) */
  put(name, x, y, layer) {
    this._check(x, y, `put("${name}")`);
    const i = this._tile(name);
    const L = layer || TILES[i].layer;
    this.layers[L][this.idx(x, y)] = i;
    if (L === 'deco' || L === 'ground') { if (this.terr[L]) this.terr[L][this.idx(x, y)] = null; }
    return this;
  }
  /** put rows of names: rows[j][i] -> (x+i, y+j); '' / null / '.' skip */
  putRows(x, y, rows, layer) {
    rows.forEach((row, j) => row.forEach((n, i) => { if (n && n !== '.') this.put(n, x + i, y + j, layer); }));
    return this;
  }
  /** fill a rect of one tile name (`hashed:[a,b]` alternates deterministically) */
  tiles(name, x, y, w, h, layer) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.put(Array.isArray(name) ? name[Math.floor(hash2(x + i, y + j, 7) * name.length)] : name, x + i, y + j, layer);
    return this;
  }
  /** erase deco/above (default) or any layers in a rect */
  erase(x, y, w = 1, h = 1, layers = ['deco', 'above']) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.inBounds(x + i, y + j)) for (const L of layers) { this.layers[L][this.idx(x + i, y + j)] = 0; if (this.terr[L]) this.terr[L][this.idx(x + i, y + j)] = null; }
    return this;
  }
  /** force collision on / off (rect) regardless of tile meta */
  block(x, y, w = 1, h = 1) { return this._ov(x, y, w, h, 1); }
  clear(x, y, w = 1, h = 1) { return this._ov(x, y, w, h, 2); }
  _ov(x, y, w, h, v) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (this.inBounds(x + i, y + j)) this.override[this.idx(x + i, y + j)] = v;
    return this;
  }

  // ------------------------------------------------------------ stamps / prefabs
  /** place a prefab: b.stamp('house', x, y, {w:6, roof:'red'}). Returns info ({door, front, w, h, ...}). */
  stamp(name, x, y, ...rest) {
    const fn = STAMPS[name] || this.custom?.[name];
    if (!fn) throw new Error(`${this.id}: unknown stamp "${name}". Known: ${[...Object.keys(STAMPS), ...Object.keys(this.custom || {})].join(', ')}`);
    return fn(this, x, y, ...rest);
  }
  /** furniture is just a stamp too (readability alias) */
  furnish(name, x, y, ...rest) { return this.stamp(name, x, y, ...rest); }
  /** register a local prefab: fn(builder, x, y, opts) */
  defineStamp(name, fn) { (this.custom ||= {})[name] = fn; return this; }

  /** scatter decorations at random (seeded) free cells: b.scatter(['flowers_red'], {rect:[x,y,w,h], count:20}) */
  scatter(names, { rect, count = 10, seed = 1, layer, onlyOn = ['grass', 'grass_lush'], gap = 0 } = {}) {
    const r = new RNG(seed * 7919 + this.width);
    const [rx, ry, rw, rh] = rect || [0, 0, this.width, this.height];
    const coll = this._collision();
    const placed = [];
    let tries = 0;
    while (placed.length < count && tries++ < count * 40) {
      const x = rx + r.int(0, rw - 1), y = ry + r.int(0, rh - 1);
      const i = this.idx(x, y);
      if (!this.inBounds(x, y) || coll[i] || this.layers.deco[i] || this.layers.above[i]) continue;
      if (onlyOn && !onlyOn.includes(this.terr.ground[i])) continue;
      if (this.terr.deco[i]) continue;
      if (Object.values(this.anchors).some((a) => a.x === x && a.y === y)) continue;
      if (placed.some(([px, py]) => Math.abs(px - x) <= gap && Math.abs(py - y) <= gap)) continue;
      this.put(r.pick(names), x, y, layer);
      placed.push([x, y]);
    }
    return this;
  }

  // ------------------------------------------------------------ anchors, warps, interactables
  anchor(name, x, y, dir = 'down') {
    this._check(x, y, `anchor "${name}"`);
    if (!DIRS.includes(dir)) throw new Error(`${this.id}: anchor "${name}" dir "${dir}" must be one of ${DIRS.join('|')}`);
    this.anchors[name] = { x, y, dir };
    return this;
  }
  /** b.anchors({ spot_a: [x,y,dir], ... }) */
  setAnchors(obj) { for (const [k, v] of Object.entries(obj)) this.anchor(k, v[0], v[1], v[2]); return this; }
  /** warp(x,y,w,h,'map:anchor',{sfx,requires,lockedText}) or warp({x,y,w,h,to,...}) */
  warp(x, y, w, h, to, opts = {}) {
    const wp = typeof x === 'object' ? { w: 1, h: 1, ...x } : { x, y, w, h, to, ...opts };
    this.warps.push(wp);
    return this;
  }
  /** interact(name,x,y,w,h,label,action) -> id `${mapId}__${name}` */
  interact(name, x, y, w, h, label, action) {
    this.interactables.push({ id: `${this.id}__${name}`, x, y, w, h, label, action });
    return this;
  }

  // ------------------------------------------------------------ build
  _resolveGround() {
    const { width: W, height: H } = this;
    const out = this.layers.ground;
    const tg = this.terr.ground;
    const get = (x, y) => (this.inBounds(x, y) ? tg[this.idx(x, y)] : undefined);
    for (const L of ['ground', 'deco']) {
      const T = this.terr[L], dest = this.layers[L];
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          const name = T[this.idx(x, y)];
          if (!name) continue;
          const def = TERRAINS[name];
          const same = (nx, ny) => {
            if (!this.inBounds(nx, ny)) return true;
            const o = T[this.idx(nx, ny)];
            return !!o && TERRAINS[o].group === def.group;
          };
          if (def.tiles) {
            const k = def.weights ? weightedPick(def.weights, hash2(x, y, 3)) : Math.floor(hash2(x, y, 3) * def.tiles.length);
            dest[this.idx(x, y)] = NAME_TO_INDEX[def.tiles[k]];
            continue;
          }
          const mask = (same(x, y - 1) ? 1 : 0) | (same(x + 1, y) ? 2 : 0) | (same(x, y + 1) ? 4 : 0) | (same(x - 1, y) ? 8 : 0);
          let tile;
          if (def.autoWater) {
            const all8 = mask === 15 && same(x - 1, y - 1) && same(x + 1, y - 1) && same(x - 1, y + 1) && same(x + 1, y + 1);
            if (def.autoWater === 's' && all8 && this._deep(x, y, same)) tile = 'sea_deep';
            else {
              let kind = def.autoWater;
              const near = [get(x, y - 1), get(x + 1, y), get(x, y + 1), get(x - 1, y)].filter((n) => n && TERRAINS[n].group !== 'water');
              if (def.autoWater === 'g') kind = near.some((n) => /sand/.test(n)) ? 's' : near.some((n) => TERRAINS[n].group === 'surface') ? 'q' : 'g';
              else kind = near.some((n) => TERRAINS[n].group === 'surface' && !/sand/.test(n)) ? 'q' : 's';
              tile = `water_${kind}_${mask}`;
            }
          } else {
            tile = `${def.auto}_${mask}`;
            if (mask === 15) { const h = hash2(x, y, 5); tile = h > 0.88 ? `${def.auto}_15c` : h > 0.7 ? `${def.auto}_15b` : tile; }
          }
          dest[this.idx(x, y)] = NAME_TO_INDEX[tile];
        }
      }
    }
  }
  _deep(x, y, same) {
    for (let d = 2; d <= 2; d++) for (const [dx, dy] of [[d, 0], [-d, 0], [0, d], [0, -d]]) if (!same(x + dx, y + dy)) return false;
    return true;
  }
  _collision() {
    const n = this.width * this.height;
    const c = new Uint8Array(n);
    const { ground, deco } = this.layers;
    for (let i = 0; i < n; i++) {
      const g = TILES[ground[i]], d = TILES[deco[i]];
      c[i] = ((g.solid && !d.bridge) || d.solid) ? 1 : 0;
      if (this.override[i] === 1) c[i] = 1; else if (this.override[i] === 2) c[i] = 0;
    }
    return c;
  }

  /** resolve autotiles + collision, validate (throws with every problem listed) and return the MapDef */
  build({ validate = true } = {}) {
    this._resolveGround();
    const def = {
      id: this.id, name: this.name, width: this.width, height: this.height, indoor: this.indoor,
      layers: this.layers, collision: this._collision(),
      warps: this.warps, anchors: this.anchors, interactables: this.interactables, ambient: this.ambient,
    };
    if (validate) {
      const errs = validateMap(def);
      if (errs.length) throw new Error(`Map "${this.id}" is invalid (${errs.length}):\n  - ${errs.join('\n  - ')}`);
    }
    return def;
  }
}

function weightedPick(weights, r) {
  const total = weights.reduce((a, b) => a + b, 0);
  let t = r * total;
  for (let i = 0; i < weights.length; i++) { t -= weights[i]; if (t <= 0) return i; }
  return weights.length - 1;
}

// ====================================================================================== validation
const ID_RE = /^[a-z][a-z0-9_]*$/;
const TO_RE = /^([a-z][a-z0-9_]*):([a-z][a-z0-9_]*)$/;

function validateAction(a, p, errs) {
  if (!a || typeof a !== 'object') return errs.push(`${p}: action must be an object`);
  if (!INTERACT_ACTIONS.includes(a.type)) return errs.push(`${p}: action.type "${a.type}" not in INTERACT_ACTIONS (${INTERACT_ACTIONS.join(', ')})`);
  const s = (v) => typeof v === 'string' && v.length > 0;
  switch (a.type) {
    case 'study': if (!['home', 'library'].includes(a.place)) errs.push(`${p}: study needs place 'home'|'library'`); break;
    case 'shop': if (!SHOP_IDS.includes(a.shop)) errs.push(`${p}: shop "${a.shop}" not in SHOP_IDS`); break;
    case 'text': if (!Array.isArray(a.lines) || !a.lines.length || !a.lines.every(s)) errs.push(`${p}: text needs lines:[non-empty strings]`); break;
    case 'event': if (!s(a.id)) errs.push(`${p}: event needs id`); break;
    case 'activity': if (!ACTIVITY_IDS.includes(a.id)) errs.push(`${p}: activity id "${a.id}" not in ACTIVITY_IDS`); break;
    case 'job': if (a.id !== 'cafe') errs.push(`${p}: job id must be 'cafe'`); break;
    case 'collect': if (!s(a.table)) errs.push(`${p}: collect needs table`); break;
    case 'board': if (!['school', 'town'].includes(a.id)) errs.push(`${p}: board id must be 'school'|'town'`); break;
    case 'door_locked': if (!s(a.text)) errs.push(`${p}: door_locked needs text`); break;
    default: break;
  }
}

/**
 * Validate a built MapDef against the contract (01 s4) and doc-04 conventions. Returns an array of
 * human-readable problems (empty = valid). Cross-map warp targets are checked by validateWarpTargets().
 */
export function validateMap(def, { spec = true } = {}) {
  const errs = [];
  const id = def && def.id;
  if (!MAP_IDS.includes(id)) { errs.push(`id "${id}" is not in MAP_IDS`); return errs; }
  const W = def.width, H = def.height, n = W * H;
  if (spec && SIZES[id] && (SIZES[id][0] !== W || SIZES[id][1] !== H)) errs.push(`size is ${W}x${H} but doc 04 says ${SIZES[id].join('x')}`);
  if (spec && INDOOR.has(id) !== !!def.indoor) errs.push(`indoor flag should be ${INDOOR.has(id)}`);
  if (typeof def.name !== 'string' || !def.name) errs.push('missing name');
  for (const L of ['ground', 'deco', 'above']) {
    const a = def.layers && def.layers[L];
    if (!(a instanceof Uint16Array) || a.length !== n) { errs.push(`layers.${L} must be a Uint16Array(${n})`); continue; }
    for (let i = 0; i < n; i++) if (a[i] >= TILES.length) { errs.push(`layers.${L}[${i}] tile index ${a[i]} out of range`); break; }
  }
  if (!(def.collision instanceof Uint8Array) || def.collision.length !== n) { errs.push(`collision must be a Uint8Array(${n})`); return errs; }
  if (errs.some((e) => e.startsWith('layers'))) return errs;
  const amb = def.ambient || {};
  if (!['outdoor', 'indoor'].includes(amb.lighting)) errs.push(`ambient.lighting must be outdoor|indoor`);
  if (typeof amb.weather !== 'boolean') errs.push('ambient.weather must be boolean');
  if (amb.music !== null && typeof amb.music !== 'string') errs.push('ambient.music must be a MUSIC_IDS value, "town", "school" or null');
  // every ground cell should have a tile
  let empty = 0;
  for (let i = 0; i < n; i++) if (!def.layers.ground[i]) empty++;
  if (empty && !def.indoor) errs.push(`${empty} ground cells are empty (fill a base terrain)`);

  const blocked = (x, y) => !(x >= 0 && y >= 0 && x < W && y < H) || def.collision[y * W + x] === 1;

  // anchors
  const anchors = def.anchors || {};
  for (const [k, a] of Object.entries(anchors)) {
    if (!ID_RE.test(k)) errs.push(`anchor "${k}": names are snake_case`);
    if (!(a.x >= 0 && a.y >= 0 && a.x < W && a.y < H)) errs.push(`anchor "${k}" (${a.x},${a.y}) is out of bounds`);
    else if (blocked(a.x, a.y)) errs.push(`anchor "${k}" (${a.x},${a.y}) is on a solid tile (${TILES[def.layers.deco[a.y * W + a.x] || def.layers.ground[a.y * W + a.x]].name})`);
    if (!DIRS.includes(a.dir)) errs.push(`anchor "${k}": bad dir "${a.dir}"`);
  }
  if (spec) for (const k of requiredAnchors(id)) if (!anchors[k]) errs.push(`missing mandatory anchor "${k}"`);

  // reachability by flood fill from entrance
  const reach = new Uint8Array(n);
  const ent = anchors.entrance;
  if (ent && !blocked(ent.x, ent.y)) {
    const q = [[ent.x, ent.y]];
    reach[ent.y * W + ent.x] = 1;
    while (q.length) {
      const [x, y] = q.pop();
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + dx, ny = y + dy;
        if (blocked(nx, ny) || reach[ny * W + nx]) continue;
        reach[ny * W + nx] = 1; q.push([nx, ny]);
      }
    }
    for (const [k, a] of Object.entries(anchors)) if (a.x >= 0 && a.x < W && a.y >= 0 && a.y < H && !blocked(a.x, a.y) && !reach[a.y * W + a.x]) errs.push(`anchor "${k}" (${a.x},${a.y}) is not reachable from entrance`);
  }

  // warps
  (def.warps || []).forEach((w, i) => {
    const p = `warp[${i}] (${w.x},${w.y} ${w.w}x${w.h} -> ${w.to})`;
    if (!(w.w >= 1 && w.h >= 1)) errs.push(`${p}: w/h must be >= 1`);
    const m = TO_RE.exec(w.to || '');
    if (!m) errs.push(`${p}: "to" must look like 'map_id:anchor_name'`);
    else if (!MAP_IDS.includes(m[1])) errs.push(`${p}: target map "${m[1]}" is not in MAP_IDS`);
    else if (m[1] === id && !anchors[m[2]]) errs.push(`${p}: target anchor "${m[2]}" does not exist in this map`);
    if (w.sfx !== undefined && !SFX_IDS.includes(w.sfx)) errs.push(`${p}: sfx "${w.sfx}" not in SFX_IDS`);
    if (w.requires !== undefined) for (const e of validateCondition(w.requires, {}, 'requires')) errs.push(`${p}: ${e}`);
    if (w.lockedText !== undefined && typeof w.lockedText !== 'string') errs.push(`${p}: lockedText must be a string`);
    let anyReach = false;
    for (let j = 0; j < w.h; j++) for (let k = 0; k < w.w; k++) {
      const x = w.x + k, y = w.y + j;
      if (!(x >= 0 && y >= 0 && x < W && y < H)) { errs.push(`${p}: tile (${x},${y}) is out of bounds`); continue; }
      if (blocked(x, y)) errs.push(`${p}: tile (${x},${y}) is solid (a warp needs a walkable tile)`);
      else if (reach[y * W + x]) anyReach = true;
    }
    if (ent && !anyReach) errs.push(`${p}: not reachable from entrance`);
  });
  if (spec) {
    for (const nb of NEIGHBOURS[id] || []) {
      const ws = (def.warps || []).filter((w) => w.to === `${nb}:from_${id}`);
      if (!ws.length) errs.push(`no warp to '${nb}:from_${id}' (connection ${id} <-> ${nb})`);
      const gate = GATED_WARPS[`${id}>${nb}`];
      if (gate && ws.length && !ws.some((w) => JSON.stringify(w.requires) === JSON.stringify(gate.requires) && w.lockedText === gate.lockedText)) errs.push(`warp to ${nb} must carry requires ${JSON.stringify(gate.requires)} and lockedText "${gate.lockedText}"`);
    }
  }

  // interactables
  const seen = new Set();
  (def.interactables || []).forEach((it, i) => {
    const p = `interactable[${i}] ${it.id}`;
    if (!it.id || !it.id.startsWith(`${id}__`)) errs.push(`${p}: id must start with "${id}__" (use b.interact(name, ...))`);
    if (seen.has(it.id)) errs.push(`${p}: duplicate id`);
    seen.add(it.id);
    if (!(it.w >= 1 && it.h >= 1)) errs.push(`${p}: w/h must be >= 1`);
    if (typeof it.label !== 'string' || !it.label) errs.push(`${p}: missing label`);
    validateAction(it.action, `${p}.action`, errs);
    // must be usable: some tile of the rect or a 4-neighbour of the rect is walkable and reachable
    let ok = false, inb = true;
    for (let j = -1; j <= it.h; j++) for (let k = -1; k <= it.w; k++) {
      const corner = (j === -1 || j === it.h) && (k === -1 || k === it.w);
      const x = it.x + k, y = it.y + j;
      if (j >= 0 && j < it.h && k >= 0 && k < it.w && !(x >= 0 && y >= 0 && x < W && y < H)) inb = false;
      if (corner || !(x >= 0 && y >= 0 && x < W && y < H)) continue;
      if (!blocked(x, y) && reach[y * W + x]) ok = true;
    }
    if (!inb) errs.push(`${p}: rect is out of bounds`);
    else if (ent && !ok) errs.push(`${p} (${it.x},${it.y} ${it.w}x${it.h}): no reachable walkable tile next to it (inside a solid blob?)`);
  });
  if (spec && REQUIRED_INTERACTABLES[id]) {
    for (const [name, want] of Object.entries(REQUIRED_INTERACTABLES[id])) {
      const it = (def.interactables || []).find((q) => q.id === `${id}__${name}`);
      if (!it) { errs.push(`missing interactable "${id}__${name}" (doc 04)`); continue; }
      for (const [k, v] of Object.entries(want)) if (it.action && it.action[k] !== v) errs.push(`interactable ${it.id}: action.${k} should be ${JSON.stringify(v)} (doc 04)`);
    }
  }
  return errs;
}

/**
 * Cross-map check: every warp target 'map:anchor' must exist. defs = { id: MapDef }. Targets whose map is not
 * in defs are skipped unless strict (all 26 maps present) -- then a missing map is an error too.
 */
export function validateWarpTargets(defs, { strict = false } = {}) {
  const errs = [];
  for (const def of Object.values(defs)) {
    (def.warps || []).forEach((w, i) => {
      const m = TO_RE.exec(w.to || '');
      if (!m) return;
      const target = defs[m[1]];
      if (!target) { if (strict) errs.push(`${def.id} warp[${i}]: target map "${m[1]}" has no file`); return; }
      if (!target.anchors[m[2]]) errs.push(`${def.id} warp[${i}]: ${m[1]} has no anchor "${m[2]}"`);
    });
  }
  return errs;
}
