/** Critters: cute low-poly toon animals that wander / flee inside bounds. createCritter(kind, {seed}) → { group, update(dt, ctx), setBounds, dispose } */
import * as THREE from 'three';
import { CRITTERS } from '../core/registry.js';
import { mulberry32, hashString } from '../core/util.js';
import { ell, tube, paint, xf, merge, darker, lighter } from './kit.js';
import { toonMesh } from './materials.js';

const E = (r, p, col, rot) => paint(xf(ell(r[0], r[1], r[2], 10, 7), { p, r: rot || [0, 0, 0] }), col);
const eyes = (z, y, x, r = 0.016) => [E([r, r, r * 0.6], [x, y, z], '#1a1214'), E([r, r, r * 0.6], [-x, y, z], '#1a1214')];

/** kind → { body:[geos], parts:{tail?, wingL?, wingR?}: {geo,pivot}, speed, fleeR, hop, flies } */
const KINDS = {
  cat(rng) {
    const pal = [['#e8a05a', '#fff0dc'], ['#4a4650', '#c8c8d0'], ['#f4eadc', '#d9a05a'], ['#8a7a6a', '#f0e4d0']][Math.floor(rng() * 4)];
    const c = pal[0], w = pal[1];
    return {
      body: [E([0.14, 0.12, 0.22], [0, 0.15, 0], c), E([0.115, 0.105, 0.105], [0, 0.25, 0.19], c), E([0.04, 0.05, 0.02], [0.07, 0.34, 0.17], c, [0, 0, -0.3]), E([0.04, 0.05, 0.02], [-0.07, 0.34, 0.17], c, [0, 0, 0.3]),
        E([0.055, 0.04, 0.045], [0, 0.22, 0.27], w), E([0.04, 0.09, 0.05], [0.08, 0.05, 0.14], c), E([0.04, 0.09, 0.05], [-0.08, 0.05, 0.14], c), E([0.04, 0.08, 0.06], [0.08, 0.05, -0.14], c), E([0.04, 0.08, 0.06], [-0.08, 0.05, -0.14], c), ...eyes(0.285, 0.265, 0.05)],
      tail: { geo: paint(tube([[0, 0, 0], [0, 0.08, -0.1], [0, 0.22, -0.12], [0, 0.3, -0.08]], [0.032, 0.028, 0.026, 0.02], { radial: 6, seg: 8 }), c), pivot: [0, 0.18, -0.2] },
      speed: 1.1, fleeR: 2.2, sitChance: 0.55,
    };
  },
  dog(rng) {
    const pal = [['#b07a4a', '#f4e8d6'], ['#f0e4cc', '#b07a4a'], ['#4a3a30', '#e8d8c0']][Math.floor(rng() * 3)];
    const c = pal[0], w = pal[1];
    return {
      body: [E([0.15, 0.14, 0.26], [0, 0.2, 0], c), E([0.12, 0.115, 0.115], [0, 0.31, 0.24], c), E([0.06, 0.05, 0.07], [0, 0.28, 0.35], w), E([0.02, 0.02, 0.015], [0, 0.3, 0.41], '#1a1214'), E([0.05, 0.08, 0.025], [0.1, 0.33, 0.21], darker(c, 0.2), [0, 0, 0.5]), E([0.05, 0.08, 0.025], [-0.1, 0.33, 0.21], darker(c, 0.2), [0, 0, -0.5]),
        E([0.045, 0.1, 0.05], [0.09, 0.06, 0.17], c), E([0.045, 0.1, 0.05], [-0.09, 0.06, 0.17], c), E([0.045, 0.1, 0.06], [0.09, 0.06, -0.17], c), E([0.045, 0.1, 0.06], [-0.09, 0.06, -0.17], c), ...eyes(0.34, 0.33, 0.055)],
      tail: { geo: paint(tube([[0, 0, 0], [0, 0.1, -0.06], [0, 0.2, -0.04]], [0.035, 0.03, 0.02], { radial: 6, seg: 6 }), c), pivot: [0, 0.26, -0.25] },
      speed: 1.6, fleeR: 0, sitChance: 0.3, bob: 0.025,
    };
  },
  sparrow(rng) {
    const c = '#9a6a42';
    return {
      body: [E([0.065, 0.06, 0.1], [0, 0.1, 0], c), E([0.055, 0.052, 0.052], [0, 0.15, 0.08], '#b58a5a'), E([0.02, 0.014, 0.03], [0, 0.145, 0.14], '#e8a040'), E([0.05, 0.04, 0.06], [0, 0.08, 0.02], '#e8dcc0'), ...eyes(0.12, 0.165, 0.03, 0.01),
        E([0.01, 0.04, 0.01], [0.02, 0.03, 0], '#c07a50'), E([0.01, 0.04, 0.01], [-0.02, 0.03, 0], '#c07a50'), E([0.03, 0.012, 0.07], [0, 0.1, -0.12], '#7a5030')],
      wingL: { geo: paint(xf(ell(0.1, 0.012, 0.06, 8, 5), { p: [0.1, 0, 0] }), '#7a5030'), pivot: [0.05, 0.12, 0] },
      wingR: { geo: paint(xf(ell(0.1, 0.012, 0.06, 8, 5), { p: [-0.1, 0, 0] }), '#7a5030'), pivot: [-0.05, 0.12, 0] },
      speed: 0.9, fleeR: 2.6, hop: 0.05, flies: true,
    };
  },
  gull() {
    return {
      body: [E([0.1, 0.09, 0.17], [0, 0.22, 0], '#fdfdfd'), E([0.075, 0.07, 0.075], [0, 0.32, 0.13], '#ffffff'), E([0.02, 0.02, 0.07], [0, 0.31, 0.22], '#f2b230'), ...eyes(0.19, 0.34, 0.04, 0.012), E([0.07, 0.03, 0.12], [0, 0.22, -0.16], '#8a94a0'),
        E([0.012, 0.1, 0.012], [0.04, 0.1, 0], '#f09040'), E([0.012, 0.1, 0.012], [-0.04, 0.1, 0], '#f09040'), E([0.04, 0.012, 0.05], [0.04, 0.01, 0.03], '#f09040'), E([0.04, 0.012, 0.05], [-0.04, 0.01, 0.03], '#f09040')],
      wingL: { geo: paint(xf(ell(0.22, 0.015, 0.1, 10, 5), { p: [0.2, 0, 0] }), '#aeb8c4', (x) => (x > 0.34 ? '#303846' : undefined)), pivot: [0.08, 0.26, 0] },
      wingR: { geo: paint(xf(ell(0.22, 0.015, 0.1, 10, 5), { p: [-0.2, 0, 0] }), '#aeb8c4', (x) => (x < -0.34 ? '#303846' : undefined)), pivot: [-0.08, 0.26, 0] },
      speed: 0.6, fleeR: 2.8, flies: true, flapIdle: true,
    };
  },
  duck(rng) {
    const mall = rng() < 0.5;
    const b = mall ? '#9a8a76' : '#fff4c8';
    return {
      body: [E([0.13, 0.1, 0.17], [0, 0.11, 0], b), E([0.075, 0.075, 0.075], [0, 0.24, 0.12], mall ? '#2f8a58' : '#fff4c8'), E([0.04, 0.016, 0.05], [0, 0.225, 0.2], '#f2a830'), ...eyes(0.17, 0.26, 0.04, 0.012), E([0.05, 0.04, 0.07], [0, 0.12, -0.15], b, [0.5, 0, 0]),
        E([0.06, 0.035, 0.1], [0.11, 0.13, 0], darker(b, 0.12)), E([0.06, 0.035, 0.1], [-0.11, 0.13, 0], darker(b, 0.12))],
      speed: 0.55, fleeR: 1.6, waddle: true,
    };
  },
  butterfly(rng) {
    const c = ['#ff9fc5', '#ffd23f', '#8fd3ff', '#c79fff'][Math.floor(rng() * 4)];
    return {
      body: [E([0.012, 0.012, 0.05], [0, 0, 0], '#3a2a30')],
      wingL: { geo: merge([paint(xf(ell(0.07, 0.006, 0.06, 8, 5), { p: [0.065, 0, 0.02] }), c), paint(xf(ell(0.05, 0.006, 0.045, 8, 5), { p: [0.05, 0, -0.04] }), lighter(c, 0.3))]), pivot: [0.01, 0, 0] },
      wingR: { geo: merge([paint(xf(ell(0.07, 0.006, 0.06, 8, 5), { p: [-0.065, 0, 0.02] }), c), paint(xf(ell(0.05, 0.006, 0.045, 8, 5), { p: [-0.05, 0, -0.04] }), lighter(c, 0.3))]), pivot: [-0.01, 0, 0] },
      speed: 0.7, fleeR: 0, butterfly: true, noOutline: false,
    };
  },
  crab() {
    const c = '#e8553c';
    return {
      body: [E([0.1, 0.05, 0.075], [0, 0.06, 0], c), E([0.014, 0.03, 0.014], [0.04, 0.12, 0.04], '#3a2a2a'), E([0.014, 0.03, 0.014], [-0.04, 0.12, 0.04], '#3a2a2a'), E([0.02, 0.02, 0.02], [0.04, 0.15, 0.04], '#fff'), E([0.02, 0.02, 0.02], [-0.04, 0.15, 0.04], '#fff'),
        E([0.045, 0.035, 0.04], [0.14, 0.07, 0.06], c), E([0.045, 0.035, 0.04], [-0.14, 0.07, 0.06], c), ...[-1, 1].flatMap((s) => [0, 1, 2].map((i) => E([0.04, 0.01, 0.01], [s * 0.11, 0.025, -0.03 + i * 0.03], darker(c, 0.2))))],
      speed: 0.5, fleeR: 1.6, sideways: true,
    };
  },
  rabbit(rng) {
    const c = rng() < 0.5 ? '#f4efe6' : '#a58a6a';
    return {
      body: [E([0.1, 0.09, 0.13], [0, 0.11, 0], c), E([0.075, 0.07, 0.075], [0, 0.19, 0.11], c), E([0.022, 0.1, 0.014], [0.03, 0.34, 0.09], c, [0.2, 0, -0.1]), E([0.022, 0.1, 0.014], [-0.03, 0.34, 0.09], c, [0.2, 0, 0.1]),
        E([0.012, 0.06, 0.008], [0.03, 0.34, 0.1], '#f2a0b0', [0.2, 0, -0.1]), E([0.012, 0.06, 0.008], [-0.03, 0.34, 0.1], '#f2a0b0', [0.2, 0, 0.1]), E([0.04, 0.04, 0.04], [0, 0.09, -0.14], '#fff'), E([0.02, 0.016, 0.016], [0, 0.18, 0.18], '#f2a0b0'), ...eyes(0.17, 0.205, 0.035, 0.012),
        E([0.03, 0.05, 0.07], [0.07, 0.04, -0.02], c), E([0.03, 0.05, 0.07], [-0.07, 0.04, -0.02], c)],
      speed: 1.3, fleeR: 2.6, hop: 0.12, hopper: true,
    };
  },
};

const geoCache = new Map();

export function createCritter(kind, opts = {}) {
  if (!KINDS[kind]) { console.warn(`[characters] unknown critter "${kind}", using cat`); kind = 'cat'; }
  const seed = opts.seed ?? 1;
  const rng = mulberry32(hashString(kind) + seed * 7919);
  const def = KINDS[kind](mulberry32(seed * 31 + 5));
  const ckey = `${kind}|${seed % 4}`;
  let built = geoCache.get(ckey);
  if (!built) {
    built = { body: merge(def.body) };
    for (const k of ['tail', 'wingL', 'wingR']) if (def[k]) { const g = def[k].geo; xf(g, { p: [-def[k].pivot[0], -def[k].pivot[1], -def[k].pivot[2]] }); built[k] = g; }
    geoCache.set(ckey, built);
  } else for (const k of ['tail', 'wingL', 'wingR']) if (def[k]) { /* pivot offset already baked into cached geo */ }
  const group = new THREE.Group();
  group.name = `critter:${kind}`;
  const flyGroup = new THREE.Group();
  group.add(flyGroup);
  const body = toonMesh(built.body);
  flyGroup.add(body);
  const nodes = {};
  for (const k of ['tail', 'wingL', 'wingR']) {
    if (!def[k]) continue;
    const n = new THREE.Group();
    n.position.set(def[k].pivot[0], def[k].pivot[1], def[k].pivot[2]);
    n.add(toonMesh(built[k]));
    flyGroup.add(n);
    nodes[k] = n;
  }
  let bounds = { x: -3, z: -3, w: 6, h: 6 };
  let state = 'idle', timer = rng() * 2, tx = 0, tz = 0, yaw = rng() * 6.28, t = rng() * 10, air = 0, sit = false, speedMul = 1;
  let fly = 0; // 0 grounded .. 1 airborne
  const cx = () => bounds.x + bounds.w / 2, cz = () => bounds.z + bounds.h / 2;

  function pickTarget(ctx, awayFrom) {
    for (let i = 0; i < 6; i++) {
      let x, z;
      if (awayFrom) {
        const ax = group.position.x - awayFrom.x, az = group.position.z - awayFrom.z, l = Math.hypot(ax, az) || 1;
        x = group.position.x + (ax / l) * (2 + rng() * 2) + (rng() - 0.5); z = group.position.z + (az / l) * (2 + rng() * 2) + (rng() - 0.5);
      } else {
        x = bounds.x + 0.3 + rng() * Math.max(0.1, bounds.w - 0.6); z = bounds.z + 0.3 + rng() * Math.max(0.1, bounds.h - 0.6);
      }
      x = Math.min(bounds.x + bounds.w - 0.2, Math.max(bounds.x + 0.2, x)); z = Math.min(bounds.z + bounds.h - 0.2, Math.max(bounds.z + 0.2, z));
      if (!ctx || !ctx.isBlockedAt || !ctx.isBlockedAt(x, z, 0.2)) { tx = x; tz = z; return true; }
    }
    tx = group.position.x; tz = group.position.z;
    return false;
  }

  const critter = {
    group, kind,
    setBounds(b) {
      bounds = { x: b.x, z: b.z, w: Math.max(0.5, b.w), h: Math.max(0.5, b.h) };
      const p = group.position;
      if (p.x < bounds.x || p.x > bounds.x + bounds.w || p.z < bounds.z || p.z > bounds.z + bounds.h) p.set(cx(), p.y, cz());
    },
    update(dt, ctx = {}) {
      dt = Math.min(dt, 0.1);
      t += dt;
      const p = group.position;
      const pl = ctx.player;
      const pd = pl ? Math.hypot(pl.x - p.x, pl.z - p.z) : 99;
      if (def.fleeR && pd < def.fleeR && state !== 'flee') { state = 'flee'; sit = false; pickTarget(ctx, pl); speedMul = def.flies ? 3.2 : 2.6; if (def.flies) air = 1; }
      timer -= dt;
      if (state === 'idle') {
        if (timer <= 0) {
          if (rng() < (def.sitChance || 0)) { sit = !sit; timer = 1.5 + rng() * 3; }
          else { sit = false; state = 'move'; speedMul = 1; pickTarget(ctx); timer = 6; }
        }
      } else {
        const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
        if (d < 0.1 || timer <= -8) {
          if (state === 'flee' && pd < (def.fleeR || 0) * 1.3 && pickTarget(ctx, pl)) { /* keep running */ }
          else { state = 'idle'; timer = 0.8 + rng() * 2.5; air = 0; }
        } else {
          const sp = def.speed * speedMul * (def.butterfly ? 0.8 : 1);
          const nx = p.x + (dx / d) * sp * dt, nz = p.z + (dz / d) * sp * dt;
          if (ctx.isBlockedAt && ctx.isBlockedAt(nx, nz, 0.15)) { pickTarget(ctx); timer = 4; } else { p.x = nx; p.z = nz; }
          const want = def.sideways ? Math.atan2(dx, dz) + Math.PI / 2 : Math.atan2(dx, dz);
          let df = want - yaw; df = Math.atan2(Math.sin(df), Math.cos(df));
          yaw += df * (1 - Math.exp(-10 * dt));
        }
      }
      group.rotation.y = yaw;
      const moving = state !== 'idle';
      // animation
      fly += ((def.flies && (air || (def.flapIdle && 0)) ? 1 : 0) - fly) * Math.min(1, dt * 6);
      let y = 0, rx = 0, rz = 0, sy = 1;
      if (def.butterfly) { y = 0.55 + 0.25 * Math.sin(t * 1.3) + 0.08 * Math.sin(t * 7); rz = 0.2 * Math.sin(t * 1.7); }
      else if (def.flies) {
        if (fly > 0.05) { y = 0.12 + fly * (0.5 + 0.12 * Math.sin(t * 9)); rx = -0.3 * fly; }
        else if (moving) y = Math.abs(Math.sin(t * 11)) * def.hop || 0;
        else y = 0;
      } else if (def.hopper) {
        if (moving) { const h = Math.abs(Math.sin(t * 7)); y = h * def.hop; rx = -Math.cos(t * 7) * 0.2; sy = 1 + 0.12 * (1 - h) * 0.0; } else { sy = 1 + 0.02 * Math.sin(t * 2.2); }
      } else if (def.waddle) { rz = moving ? 0.18 * Math.sin(t * 8) : 0; y = moving ? Math.abs(Math.sin(t * 8)) * 0.012 : 0; }
      else if (def.sideways) { y = moving ? Math.abs(Math.sin(t * 14)) * 0.012 : 0; rz = moving ? 0.06 * Math.sin(t * 14) : 0; }
      else { // cat / dog
        y = moving ? Math.abs(Math.sin(t * 9)) * (def.bob || 0.018) : 0.0;
        rx = sit ? -0.55 : 0; if (sit) y = -0.02; sy = sit ? 1.0 : 1 + 0.015 * Math.sin(t * 2.2);
        if (!moving && !sit && kind === 'cat' && (Math.floor(t / 4) % 3 === 2)) sy = 0.82; // loaf
      }
      flyGroup.position.y = y;
      flyGroup.rotation.set(rx, 0, rz);
      flyGroup.scale.set(1, sy, 1);
      if (nodes.tail) {
        const wag = kind === 'dog' ? (moving || pd < 3 ? 0.7 * Math.sin(t * 14) : 0.15 * Math.sin(t * 3)) : 0.35 * Math.sin(t * 2.4);
        nodes.tail.rotation.set(sit ? 0.6 : (kind === 'dog' ? -0.3 : 0.2), wag * (kind === 'dog' ? 1 : 0.6), kind === 'dog' ? 0 : wag * 0.4);
      }
      if (nodes.wingL) {
        const flap = def.butterfly ? Math.sin(t * 22) * 0.9 : fly > 0.05 ? Math.sin(t * 36) * 0.9 * fly : def.flapIdle && !moving && Math.floor(t / 5) % 4 === 3 ? Math.sin(t * 14) * 0.7 : -0.1;
        const fold = def.butterfly ? 0.25 : fly > 0.05 || (def.flapIdle && flap !== -0.1) ? 0 : 1.2;
        nodes.wingL.rotation.z = flap + (fold ? -fold * 0.9 : 0.1);
        nodes.wingR.rotation.z = -flap + (fold ? fold * 0.9 : -0.1);
        if (fold) { nodes.wingL.rotation.z = -1.1 + 0.05 * Math.sin(t * 3); nodes.wingR.rotation.z = 1.1 - 0.05 * Math.sin(t * 3); }
      }
    },
    dispose() { if (group.parent) group.parent.remove(group); },
  };
  group.position.set(cx(), 0, cz());
  return critter;
}
export const CRITTER_KINDS = CRITTERS;
