/**
 * AreaDef -> scene + AreaRuntime. See AREAS.md for the def format and PROPS.md for the prop catalogue.
 */
import * as THREE from 'three';
import { AREAS, LAMP_GROUPS, INTERACT_TYPES, fishingWaterKind, areaAnchorNames } from '../core/registry.js';
import { mulberry32, clamp, hashString, damp, smoothstep } from '../core/util.js';
import { MeshBuilder, placeMatrix } from './geo.js';
import { CollisionWorld } from './collision.js';
import { opToPoly, pointInPoly, polyBounds } from './shapes.js';
import { paintGround, surfaceOfKind } from './ground.js';
import { PROPS } from './props/index.js';
import { createWaterMaterial, WIND } from './materials.js';
import { toTexture } from './textures.js';

export const SEASON_ALIASES = { notwinter: ['spring', 'summer', 'autumn'], warm: ['spring', 'summer'], cool: ['autumn', 'winter'], always: null };

const DEFAULT_LABEL = {
  sign: 'Sign', noticeboard: 'Notice board', bed: 'Bed', rest: 'Rest', diary: 'Diary', chest: 'Chest', mailbox: 'Mailbox', shop: 'Shop', job: 'Job board',
  fishing: 'Fishing spot', forage: 'Forage', lamp: 'Street lamp', bench: 'Bench', fountain: 'Fountain', shrine: 'Shrine', telescope: 'Telescope',
  bookshelf: 'Bookshelf', crafting: 'Workbench', object: 'Look',
};
const DEFAULT_TEXT = {
  sign: 'A weathered wooden sign.', noticeboard: 'The notice board is pinned with colourful notes.', bench: 'A comfortable bench. Nice place to rest.',
  fountain: 'Water splashes softly in the fountain.', bookshelf: 'Rows of well-thumbed books.', chest: 'A sturdy wooden chest.', mailbox: 'The little mailbox.',
  lamp: 'A street lamp.', object: 'Nothing unusual.', bed: 'A cosy bed.', diary: 'A diary lies here.', forage: 'Something might be growing here.',
  fishing: 'The water looks promising.',
};

/** Shared, per-area build context handed to every prop builder. */
export class BuildCtx {
  constructor(shared, { decor = false } = {}) {
    this.s = shared;
    this.mats = shared.mats;
    this.tex = shared.tex;
    this.area = shared.area;
    this.q = shared.q;
    this.decor = decor;
    this.mb = new MeshBuilder(shared.mats, shared.meta);
    this.mbs = new Map([['always', this.mb]]);
    this.root = new THREE.Group();
    this.objects = []; // { obj, seasons }
    this.updaters = [];
    this.flowerData = { spring: [], summer: [], autumn: [], winter: [] };
    this.rng = mulberry32(shared.seed);
    this.propIndex = 0;
  }

  get collision() { return this.s.collision; }

  /** seeded rng for the current prop (stable across rebuilds) */
  rngFor(n = 0) { return mulberry32(this.s.seed + this.propIndex * 7919 + n * 131); }

  mbFor(seasons) {
    if (!seasons || seasons === 'always') return this.mb;
    const list = Array.isArray(seasons) ? seasons : SEASON_ALIASES[seasons] || String(seasons).split(',');
    const key = list.slice().sort().join(',');
    let b = this.mbs.get(key);
    if (!b) this.mbs.set(key, (b = new MeshBuilder(this.mats, this.s.meta)));
    return b;
  }

  solid(x0, z0, x1, z1, o) { if (!this.decor) this.collision.addRect(x0, z0, x1, z1, o); }
  solidCircle(x, z, r, o) { if (!this.decor) this.collision.addCircle(x, z, r, o); }
  walkable(x0, z0, x1, z1) { this.collision.clearWater(x0, z0, x1, z1); }
  surface(x0, z0, x1, z1, name) { this.collision.addSurfaceRect(x0, z0, x1, z1, name); }
  bake(b) { if (!this.decor) this.s.bakes.push(b); }

  /** add a dynamic Object3D to the area. opts.seasons restricts visibility. */
  object(obj, opts = {}) {
    obj.traverse((o) => {
      if (o.isMesh) {
        if (opts.cast !== false) o.castShadow = true;
        if (opts.receive !== false) o.receiveShadow = true;
      }
    });
    this.root.add(obj);
    const list = opts.seasons ? (Array.isArray(opts.seasons) ? opts.seasons : SEASON_ALIASES[opts.seasons] || String(opts.seasons).split(',')) : null;
    if (list) this.objects.push({ obj, seasons: new Set(list) });
    return obj;
  }
  /** per-frame callback (dt, t, env) for animated props */
  updater(fn) { this.updaters.push(fn); }

  smoke(x, y, z, o = {}) { this.s.smokers.push({ x, y, z, rate: o.rate ?? 1.4, t: Math.random(), size: o.size ?? 1 }); }

  anchor(name, x, z, facing = 's') { this.s.anchors[name] = this.s.anchors[name] || { x, z, facing }; }

  transition(t) { this.s.transitions.push(t); }

  door(transitionId, pivot, o = {}) { this.s.doors[transitionId] = { pivot, open: 0, target: 0, dir: o.dir ?? -1, max: o.max ?? 1.7 }; }

  lamp(l) { this.s.lamps.push(l); }

  /** register an interactable from a prop entry `p` (needs p.id) merged with defaults d */
  interactable(p, d = {}) {
    if (this.decor) return;
    const id = p.id || d.id;
    if (!id) return;
    const type = p.type || d.type || 'object';
    const it = {
      id, type,
      x: (p.ix ?? d.x ?? p.x), z: (p.iz ?? d.z ?? p.z), r: p.r ?? d.r ?? 1.0,
      facing: p.facing ?? d.facing ?? 's',
      label: p.label ?? d.label ?? DEFAULT_LABEL[type] ?? 'Look',
    };
    const text = p.text ?? d.text ?? DEFAULT_TEXT[type];
    if (text) it.text = text;
    this.s.interactables.push(it);
    return it;
  }

  flowers(arr, seasons) {
    const list = seasons ? (Array.isArray(seasons) ? seasons : SEASON_ALIASES[seasons] || String(seasons).split(',')) : ['spring', 'summer', 'autumn'];
    for (const s of list) for (const f of arr) this.flowerData[s].push(f);
  }

  finish() {
    const seasonal = [];
    for (const [key, b] of this.mbs) {
      if (b.isEmpty()) continue;
      const g = b.build();
      g.name = `static_${key}`;
      this.root.add(g);
      if (key !== 'always') seasonal.push({ obj: g, seasons: new Set(key.split(',')) });
    }
    return { root: this.root, seasonal: seasonal.concat(this.objects) };
  }
}

// ---------------------------------------------------------------- instanced helpers
function tuftGeo() {
  const pos = [], nor = [], uv = [], col = [], sway = [], tone = [], idx = [];
  const blades = 6;
  const base = new THREE.Color('#3b8d35'), tip = new THREE.Color('#9fe06a');
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2 + i * 0.7;
    const lean = 0.12 + (i % 3) * 0.05;
    const h = 0.34 + ((i * 37) % 10) * 0.025;
    const bx = Math.cos(a) * 0.05, bz = Math.sin(a) * 0.05;
    const tx = Math.cos(a + 1.5708), tz = Math.sin(a + 1.5708);
    const w = 0.045;
    const k = pos.length / 3;
    pos.push(bx - tx * w, 0, bz - tz * w, bx + tx * w, 0, bz + tz * w, bx + Math.cos(a) * lean, h, bz + Math.sin(a) * lean);
    for (let v = 0; v < 3; v++) nor.push(0, 1, 0);
    uv.push(0, 0, 1, 0, 0.5, 1);
    col.push(base.r, base.g, base.b, base.r, base.g, base.b, tip.r, tip.g, tip.b);
    sway.push(0, 0, 0.14);
    tone.push(0, 0, 0);
    idx.push(k, k + 1, k + 2);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('sway', new THREE.Float32BufferAttribute(sway, 1));
  g.setAttribute('tone', new THREE.Float32BufferAttribute(tone, 1));
  g.setIndex(idx);
  return g;
}

function flowerGeos() {
  // stem + leaves (green, vertex coloured) and a flat petal head (white, tinted by instance colour)
  const stem = new MeshBuilder({ s: new THREE.MeshBasicMaterial() });
  const green = new THREE.Color('#4f9a40'), light = new THREE.Color('#7ed05a');
  const g1 = new THREE.CylinderGeometry(0.012, 0.018, 0.28, 4, 1);
  g1.translate(0, 0.14, 0);
  stem.add('s', g1, { color: green, sway: 0.1, swayH: 0.28 });
  const lf = new THREE.PlaneGeometry(0.1, 0.12);
  lf.translate(0.05, 0.06, 0);
  stem.add('s', lf, { color: light, rotY: 0.6, y: 0.04, sway: 0.05 });
  const lf2 = new THREE.PlaneGeometry(0.1, 0.12);
  lf2.translate(-0.05, 0.06, 0);
  stem.add('s', lf2, { color: green, rotY: -0.5, y: 0.07, sway: 0.05 });
  const stemGeo = (stem.build().children[0].geometry);
  const head = new THREE.IcosahedronGeometry(0.1, 0);
  head.scale(1, 0.55, 1);
  head.translate(0, 0.3, 0);
  const hb = new MeshBuilder({ h: new THREE.MeshBasicMaterial() });
  hb.add('h', head, { sway: 0.1 });
  // center dot
  const c = new THREE.IcosahedronGeometry(0.05, 0);
  c.translate(0, 0.33, 0);
  hb.add('h', c, { color: '#ffd23f', sway: 0.1 });
  const headGeo = hb.build().children[0].geometry;
  return { stemGeo, headGeo };
}

let _tuft = null;
let _flowers = null;

function instanced(geo, mat, list, setup) {
  const m = new THREE.InstancedMesh(geo, mat, list.length);
  const d = new THREE.Object3D();
  const c = new THREE.Color();
  list.forEach((it, i) => {
    setup(it, d, c);
    d.updateMatrix();
    m.setMatrixAt(i, d.matrix);
    if (c) m.setColorAt(i, c);
  });
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.frustumCulled = false;
  return m;
}

// ---------------------------------------------------------------- area builder
/**
 * @param {string} id
 * @param {object} def area def
 * @param {object} eng engine services { mats, meta, tex, water, quality, season }
 */
export function buildArea(id, def, eng) {
  const reg = AREAS[id];
  const [width, height] = def.size || (reg && reg.size);
  const kind = def.kind || (reg && reg.kind) || 'exterior';
  const quality = eng.quality;
  const q = {
    grass: quality === 'low' ? 0.4 : quality === 'high' ? 1.4 : 1,
    px: quality === 'low' ? 16 : quality === 'high' ? 40 : 28,
    foliageDetail: quality === 'low' ? 1 : 2, strands: quality === 'low' ? 12 : 26,
  };
  const seed = hashString(`${id}|${def.seed || 0}`);
  const collision = new CollisionWorld(width, height);
  const margin = def.margin ?? (kind === 'exterior' ? 4 : 5);
  const shared = {
    mats: eng.mats, meta: eng.meta, tex: eng.tex, area: { id, w: width, h: height, kind }, q, seed, collision,
    bakes: [], anchors: {}, transitions: [], interactables: [], doors: {}, lamps: [], smokers: [], quality, waterMat: eng.water.mat, extraWater: [], fx: eng.fx,
  };
  const ctx = new BuildCtx(shared);
  const group = new THREE.Group();
  group.name = `area_${id}`;

  // ---- ground: surfaces + water
  const groundDef = def.ground || {};
  const baseKind = groundDef.base || (kind === 'interior' ? 'planks' : 'grass');
  collision.surfNames[0] = surfaceOfKind(baseKind);
  const waterShapes = [];
  (groundDef.ops || []).forEach((op, i) => {
    if (op.rug) return;
    const poly = opToPoly(op, i + 3);
    collision.paintSurface(poly, surfaceOfKind(op.kind));
    if (op.kind === 'water') {
      collision.addWater(poly);
      waterShapes.push({ poly, flow: op.flow || [0, 0], deep: op.deep, shallow: op.shallow, alpha: op.alpha, scale: op.scale });
    }
  });

  // ---- explicit anchors / edges
  for (const [name, a] of Object.entries(def.anchors || {})) shared.anchors[name] = { x: a[0], z: a[1], facing: a[2] || 's' };
  for (const e of def.edges || []) {
    const [a0, a1] = e.at;
    const s = e.side;
    let rect, stand, from;
    if (s === 'e') { rect = { x: width - 1, z: a0, w: 1, h: a1 - a0 }; stand = { x: width - 0.5, z: (a0 + a1) / 2 }; from = { x: width - 2.6, z: stand.z, facing: 'w' }; }
    else if (s === 'w') { rect = { x: 0, z: a0, w: 1, h: a1 - a0 }; stand = { x: 0.5, z: (a0 + a1) / 2 }; from = { x: 2.6, z: stand.z, facing: 'e' }; }
    else if (s === 'n') { rect = { x: a0, z: 0, w: a1 - a0, h: 1 }; stand = { x: (a0 + a1) / 2, z: 0.5 }; from = { x: stand.x, z: 2.6, facing: 's' }; }
    else { rect = { x: a0, z: height - 1, w: a1 - a0, h: 1 }; stand = { x: (a0 + a1) / 2, z: height - 0.5 }; from = { x: stand.x, z: height - 2.6, facing: 'n' }; }
    const to = e.to || e.id.slice(3);
    shared.transitions.push({ id: e.id, kind: 'edge', rect, stand, to: { area: to, spawn: `from_${id}` } });
    if (!shared.anchors[`from_${to}`]) shared.anchors[`from_${to}`] = from;
  }

  // ---- props (+ lazy scatter expansion, so scatter sees solids of earlier props)
  let propCounter = 0;
  const reservedPoints = () => [
    ...Object.values(shared.anchors).map((a) => [a.x, a.z]),
    ...shared.transitions.map((t) => [t.stand.x, t.stand.z]),
    ...shared.interactables.map((i) => [i.x, i.z]),
  ];
  const buildEntry = (c, p) => {
    const prop = PROPS[p.t];
    if (!prop) throw new Error(`area ${id}: unknown prop "${p.t}"`);
    c.propIndex = ++propCounter;
    prop.build(c, p);
  };
  const buildList = (c, list) => {
    for (const p of list || []) {
      if (p.scatter) for (const e of scatterEntries(p, collision, id, width, height, seed + propCounter, reservedPoints())) buildEntry(c, e);
      else buildEntry(c, p);
    }
  };
  if (kind === 'interior') {
    ctx.propIndex = 9000;
    PROPS.room.build(ctx, { x: width / 2, z: height, w: width, d: height, ...(def.room || {}), exit: def.exit });
  }
  buildList(ctx, def.props);
  // decor sets get their own context so they can be toggled together
  const decorCtx = {};
  for (const [decorId, list] of Object.entries(def.decor || {})) {
    decorCtx[decorId] = new BuildCtx(shared, { decor: true });
    buildList(decorCtx[decorId], list);
  }

  // ---- transitions from interior exit already registered by room; finalize collision
  collision.finalize();

  // ---- grass tufts & ground scatter (exterior)
  const flowersExtra = [];
  let tufts = null;
  if (kind === 'exterior' && def.grass !== false) {
    const density = (def.grass && def.grass.density) || 0.9;
    const nTarget = Math.round(width * height * density * 3.2 * q.grass);
    const rng = mulberry32(seed ^ 0x9e3779b9);
    const list = [];
    let tries = 0;
    const noTufts = (def.grass && def.grass.avoid) || [];
    while (list.length < nTarget && tries < nTarget * 3) {
      tries++;
      const x = rng() * width, z = rng() * height;
      if (collision.surfaceAt(x, z) !== 'grass' && !(collision.winter && false)) continue;
      if (collision.blockedAt(x, z, 0.5) && !collision.isWaterAt(x, z)) continue;
      if (collision.isWaterAt(x, z)) continue;
      let skip = false;
      for (const r of noTufts) if (x >= r[0] && x <= r[0] + r[2] && z >= r[1] && z <= r[1] + r[3]) skip = true;
      if (skip) continue;
      list.push({ x, z, s: 0.7 + rng() * 0.8, r: rng() * 6.28, c: rng() });
    }
    if (!_tuft) _tuft = tuftGeo();
    tufts = instanced(_tuft, eng.mats.grass, list, (it, d, c) => {
      d.position.set(it.x, 0, it.z);
      d.rotation.set(0, it.r, 0);
      d.scale.setScalar(it.s);
      c.setHSL(0.27 + (it.c - 0.5) * 0.05, 0.35 + it.c * 0.15, 0.7 + it.c * 0.28);
    });
    tufts.receiveShadow = false;
    tufts.castShadow = false;
    tufts.userData.full = list.length;
    tufts.name = 'grass_tufts';
  }

  // ---- finish meshes
  const fin = ctx.finish();
  group.add(fin.root);
  const decorGroups = {};
  const seasonal = fin.seasonal.slice();
  for (const [decorId, c] of Object.entries(decorCtx)) {
    const f = c.finish();
    f.root.visible = false;
    group.add(f.root);
    decorGroups[decorId] = f.root;
    for (const s of f.seasonal) seasonal.push(s);
  }
  if (tufts) group.add(tufts);

  // flowers (instanced, seasonal)
  const flowerMeshes = [];
  if (!_flowers) _flowers = flowerGeos();
  for (const season of ['spring', 'summer', 'autumn']) {
    const list = [...ctx.flowerData[season]];
    if (!list.length) continue;
    const stems = instanced(_flowers.stemGeo, eng.mats.flowerStem, list, (it, d, c) => {
      d.position.set(it.x, 0, it.z);
      d.rotation.set(0, it.r ?? 0, 0);
      d.scale.set(it.s ?? 1, (it.s ?? 1) * (it.h ?? 1), it.s ?? 1);
      c.setRGB(1, 1, 1);
    });
    const heads = instanced(_flowers.headGeo, eng.mats.flowerHead, list, (it, d, c) => {
      d.position.set(it.x, 0, it.z);
      d.rotation.set(0, it.r ?? 0, 0);
      d.scale.set(it.s ?? 1, (it.s ?? 1) * (it.h ?? 1), it.s ?? 1);
      c.set(it.c);
    });
    for (const m of [stems, heads]) {
      m.visible = false;
      group.add(m);
      seasonal.push({ obj: m, seasons: new Set([season]) });
      flowerMeshes.push(m);
    }
  }

  // ---- water meshes
  const waterMeshes = [];
  for (const w of waterShapes) {
    const shape = new THREE.Shape(w.poly.map(([x, z]) => new THREE.Vector2(x, z)));
    const geo = new THREE.ShapeGeometry(shape);
    geo.rotateX(Math.PI / 2);
    // per-shape material clone so tints/flow can differ
    const mat = eng.water.mat.clone();
    mat.uniforms = THREE.UniformsUtils.clone(eng.water.mat.uniforms);
    mat.uniforms.uNoise.value = eng.tex.get('noise');
    mat.uniforms.uFlow.value.set(w.flow[0] || 0, w.flow[1] || 0);
    if (w.deep) mat.uniforms.uDeep.value.set(w.deep);
    if (w.shallow) mat.uniforms.uShallow.value.set(w.shallow);
    if (w.alpha) mat.uniforms.uAlpha.value = w.alpha;
    if (w.scale) mat.uniforms.uScale.value = w.scale;
    mat.side = THREE.DoubleSide;
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = 0.035;
    mesh.renderOrder = 2;
    mesh.name = 'water';
    group.add(mesh);
    waterMeshes.push(mesh);
  }
  for (const m of shared.extraWater) waterMeshes.push(m);

  // ---- ground mesh (texture painted per season)
  const groundCanvases = {};
  const groundMat = eng.mats.ground.clone();
  groundMat.vertexColors = false;
  const groundGeo = new THREE.PlaneGeometry(width + margin * 2, height + margin * 2);
  groundGeo.rotateX(-Math.PI / 2);
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.position.set(width / 2, 0, height / 2);
  ground.receiveShadow = true;
  ground.name = 'ground';
  group.add(ground);
  const setGroundSeason = (season) => {
    if (!groundCanvases[season]) {
      const g = paintGround({ width, height, margin, px: q.px, season, def: { ...groundDef, seed: def.seed || 5, base: baseKind }, bakes: shared.bakes, tex: eng.tex, kind });
      const t = toTexture(g.canvas, { repeat: false, anisotropy: eng.maxAniso });
      groundCanvases[season] = t;
    }
    groundMat.map = groundCanvases[season];
    groundMat.needsUpdate = true;
  };

  // ---- interior floor under-shadow & backdrop handled by room prop. ----
  // ---- lamps
  const lampMap = {};
  for (const l of shared.lamps) if (l.id) lampMap[l.id] = l;

  // ---- derive anchors from transitions (from_<n>) for doors
  for (const t of shared.transitions) {
    const n = t.to.area;
    if (!shared.anchors[`from_${n}`]) {
      const facing = t.kind === 'door' ? (kind === 'interior' ? 'n' : 's') : 's';
      const off = t.kind === 'door' ? (kind === 'interior' ? { x: 0, z: -1.2 } : { x: 0, z: 1.1 }) : { x: 0, z: 0 };
      shared.anchors[`from_${n}`] = { x: t.stand.x + off.x, z: t.stand.z + off.z, facing };
    }
  }

  // ---- interactables defaults
  const interactables = shared.interactables.map((it) => {
    const out = { ...it };
    if (out.type === 'lamp') out.group = LAMP_GROUPS[id];
    if (out.type === 'fishing') out.water = fishingWaterKind(id, out.id);
    return out;
  });

  // ---- runtime
  const lampStates = {};
  const season = { current: null };
  const runtime = {
    id, name: (reg && reg.name) || def.name || id, kind, width, height,
    anchors: shared.anchors,
    anchor: (n) => shared.anchors[n] || null,
    transitions: shared.transitions,
    interactables,
    critters: def.critters || [],
    isWalkable: (i, j) => i >= 0 && j >= 0 && i < width && j < height && collision.grid.walk[j * width + i] === 1,
    isBlockedAt: (x, z, r = 0.3) => collision.blockedAt(x, z, r),
    moveCircle: (x, z, dx, dz, r = 0.3) => collision.moveCircle(x, z, dx, dz, r),
    surfaceAt: (x, z) => collision.surfaceAt(x, z),
    grid: collision.grid,
  };

  const smokers = shared.smokers;
  const area = {
    runtime, group, ground, collision, def, kind, width, height, margin, lamps: shared.lamps, lampMap, doors: shared.doors,
    smokers, decorGroups, waterMeshes, tufts, shared, seasonal, flowerMeshes, updaters: ctx.updaters.concat(...Object.values(decorCtx).map((c) => c.updaters)),
    highlightTarget: null, triangles: 0,
    setSeason(s) {
      if (season.current === s) return;
      season.current = s;
      collision.winter = s === 'winter';
      setGroundSeason(s);
      for (const { obj, seasons } of seasonal) obj.visible = seasons.has(s);
      if (tufts) {
        tufts.count = s === 'winter' ? Math.round(tufts.userData.full * 0.3) : tufts.userData.full;
      }
    },
    setLampStates(map) {
      for (const [lid, st] of Object.entries(map || {})) {
        lampStates[lid] = st;
        const l = lampMap[lid];
        if (l) l.setState(st);
      }
    },
    setDoorOpen(tid, open) {
      const d = shared.doors[tid];
      if (d) d.target = open ? 1 : 0;
    },
    setDecor(decorId) {
      for (const [k, g] of Object.entries(decorGroups)) g.visible = k === decorId;
    },
    update(dt, t, env) {
      for (const l of shared.lamps) l.update(dt, t, env);
      for (const d of Object.values(shared.doors)) {
        d.open = damp(d.open, d.target, 9, dt);
        d.pivot.rotation.y = d.dir * d.max * d.open;
      }
      for (const u of area.updaters) u(dt, t, env);
      for (const w of waterMeshes) {
        const u = w.material.uniforms;
        u.uTime.value = t;
        u.uLight.value.copy(env.waterLight);
        u.uSpark.value = env.sparkle;
      }
    },
    dispose() {
      group.traverse((o) => {
        if (o.geometry && !o.userData.shared) o.geometry.dispose();
      });
      for (const t of Object.values(groundCanvases)) t.dispose();
      groundMat.dispose();
      for (const m of waterMeshes) m.material.dispose();
    },
  };
  area.interactableMap = Object.fromEntries(interactables.map((i) => [i.id, i]));
  // triangle estimate for stats
  area.triangles = 0;
  return area;
}

// ---------------------------------------------------------------- scatter
/**
 * { scatter:true, t:'tree', n:12, in:{rect|poly|circle|path+w}, ground:['grass'], minDist:2, params:{...}, avoid:[[x,z,w,h]], seed }
 * -> prop entries with positions chosen by seeded rejection sampling.
 */
function scatterEntries(sc, collision, areaId, width, height, seed, reserved) {
  const rng = mulberry32(hashString(`${areaId}|scatter|${sc.seed ?? seed}`));
  const poly = sc.in ? opToPoly(sc.in, 1) : [[0, 0], [width, 0], [width, height], [0, height]];
  const b = polyBounds(poly);
  const out = [];
  const pts = [];
  const want = sc.n || 10;
  const surfaces = sc.ground || ['grass'];
  const minDist = sc.minDist ?? 1.5;
  const clearance = sc.clear ?? 0.7;
  let tries = 0;
  while (out.length < want && tries < want * 60) {
    tries++;
    const x = b.x0 + rng() * (b.x1 - b.x0);
    const z = b.z0 + rng() * (b.z1 - b.z0);
    if (!pointInPoly(x, z, poly)) continue;
    if (x < 0.5 || z < 0.5 || x > width - 0.5 || z > height - 0.5) { if (!sc.offmap) continue; }
    if (!surfaces.includes('any') && !surfaces.includes(collision.surfaceAt(clamp(x, 0, width - 0.01), clamp(z, 0, height - 0.01)))) continue;
    if (collision.blockedAt(x, z, clearance) && !sc.overlap) continue;
    if (reserved && reserved.some((r) => (r[0] - x) ** 2 + (r[1] - z) ** 2 < 1.7 * 1.7)) continue;
    let bad = false;
    for (const a of sc.avoid || []) if (x >= a[0] && x <= a[0] + a[2] && z >= a[1] && z <= a[1] + a[3]) { bad = true; break; }
    if (bad) continue;
    for (const p of pts) if ((p[0] - x) ** 2 + (p[1] - z) ** 2 < minDist * minDist) { bad = true; break; }
    if (bad) continue;
    pts.push([x, z]);
    const params = typeof sc.params === 'function' ? sc.params(rng, out.length) : { ...(sc.params || {}) };
    if (params.kinds) { params.kind = params.kinds[(rng() * params.kinds.length) | 0]; delete params.kinds; }
    if (params.scaleRange) { params.scale = params.scaleRange[0] + rng() * (params.scaleRange[1] - params.scaleRange[0]); delete params.scaleRange; }
    out.push({ ...params, t: sc.t, x, z, seed: Math.floor(rng() * 1e6) });
  }
  // keep scatter solids from blocking walking surfaces: solids added by props themselves
  // (collision is queried live above, so later scatter entries respect earlier solids only when props
  //  are built in order; scatter runs BEFORE the build loop, so collision of authored props is not yet known.)
  return out;
}
