/** Vegetation & nature props: tree, bush, flowers, sunflowers, rock, stump, reeds, mushrooms, forage_spot. */
import { mulberry32 } from '../../core/util.js';
import { PAL } from './util.js';

const rr = (r, a, b) => a + r() * (b - a);

function canopyBlob(ctx, mbD, mat, x, y, z, r, rng, o = {}) {
  mbD.ball(mat, x, y, z, r, {
    lump: o.lump ?? 0.2, detail: ctx.q.foliageDetail ?? 2, seed: Math.floor(rng() * 999), sx: o.sx, sy: o.sy ?? 0.88, sz: o.sz, tone: rng(),
    sway: o.sway ?? 0.1, swayH: o.swayH ?? 3, swayY0: o.swayY0 ?? 1.5, color: o.color ?? '#ffffff',
    ao: { k: 0.42, h: r * 1.7, y0: y - r }, gradTop: { y0: y - r * 0.2, y1: y + r, color: '#ffffff', amt: 0 },
  });
}

export const tree = {
  doc: 'Tree. kind: oak|willow|pine|cherry|birch|maple. params: x,z,scale,seed',
  build(ctx, p) {
    const kind = p.kind || 'oak';
    const s = p.scale ?? 1;
    const rng = mulberry32(p.seed ?? Math.floor(p.x * 91 + p.z * 17));
    const mb = ctx.mb;
    const deco = ctx.mbFor('notwinter');
    const x = p.x, z = p.z;
    const lean = (rng() - 0.5) * 0.12;
    const bark = kind === 'birch' ? 'birchbark' : 'bark';
    const barkCol = kind === 'cherry' ? '#8a5a52' : kind === 'birch' ? '#ffffff' : '#c9a07a';
    let trunkH, canopy;
    const branch = (bx, by, bz, ex, ey, ez, r0) => {
      const dx = ex - bx, dy = ey - by, dz = ez - bz;
      const len = Math.hypot(dx, dy, dz);
      const rotZ = -Math.atan2(dx, dy) * 0.0;
      mb.cyl(bark, (bx + ex) / 2, (by + ey) / 2 - len / 2, (bz + ez) / 2, r0 * 0.55, r0, len, { seg: 5, color: barkCol, tex: 1.2, rotZ: -Math.atan2(dx, Math.hypot(dy, dz)), rotX: Math.atan2(dz, dy) * 0.9 });
    };
    if (kind === 'pine') {
      trunkH = 1.1 * s;
      mb.cyl(bark, x, 0, z, 0.2 * s, 0.32 * s, trunkH + 0.6, { seg: 7, color: '#b89070', tex: 1.2, ao: { k: 0.3, h: 0.6 } });
      const layers = 4;
      for (let i = 0; i < layers; i++) {
        const r = (1.75 - i * 0.38) * s, y0 = (0.8 + i * 1.05) * s, h = (1.7 - i * 0.12) * s;
        mb.cone('leaf_pine', x, y0, z, r, h, { seg: 9, color: '#ffffff', tone: rng(), sway: 0.07, swayH: 5, ao: { k: 0.4, h: h * 0.8, y0 }, lump: 0 });
        ctx.mbFor('winter').cone('snow', x, y0 + h * 0.34, z, r * 0.72, h * 0.62, { seg: 9 });
      }
      canopy = 1.7 * s;
      ctx.solidCircle(x, z, 0.4 * s);
      ctx.bake({ type: 'ellipse', x, z, rx: 1.5 * s, rz: 1.25 * s, a: 0.42 });
    } else if (kind === 'willow') {
      trunkH = 2.4 * s;
      mb.cyl(bark, x, 0, z, 0.38 * s, 0.62 * s, trunkH, { seg: 9, color: '#bfa080', tex: 1.4, rotZ: lean + 0.08, ao: { k: 0.3, h: 0.8 } });
      branch(x, trunkH * 0.9, z, x - 1.2 * s, 3.6 * s, z, 0.2 * s);
      branch(x, trunkH * 0.9, z, x + 1.3 * s, 3.5 * s, z + 0.3, 0.2 * s);
      const cy = 3.7 * s;
      canopyBlob(ctx, deco, 'leaf_willow', x, cy, z, 2.1 * s, rng, { sy: 0.7, swayY0: 2.5, sway: 0.05 });
      for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.28; canopyBlob(ctx, deco, 'leaf_willow', x + Math.cos(a) * 1.5 * s, cy - 0.1, z + Math.sin(a) * 1.4 * s, 1.1 * s, rng, { sy: 0.8 }); }
      const strands = ctx.q.strands ?? 26;
      for (let i = 0; i < strands; i++) {
        const a = (i / strands) * 6.28 + rng() * 0.2;
        const rad = (1.7 + rng() * 1.0) * s;
        const len = rr(rng, 1.8, 3.0) * s;
        deco.ball('leaf_willow', x + Math.cos(a) * rad, cy - len * 0.45, z + Math.sin(a) * rad * 0.92, 0.3 * s, { lump: 0.15, detail: 1, seed: i, sx: 0.8, sy: len / 0.3 * 0.5, sz: 0.8, tone: rng(), sway: 0.45, swayH: len, swayY0: cy - len * 0.95, color: '#ffffff', ao: { k: 0.3, h: 2.5, y0: cy - len * 0.95 } });
      }
      canopy = 2.6 * s;
      ctx.solidCircle(x, z, 0.62 * s, { tile: true });
      ctx.bake({ type: 'ellipse', x, z, rx: 3.1 * s, rz: 2.6 * s, a: 0.4, blur: 0.6 });
    } else if (kind === 'birch') {
      trunkH = 2.8 * s;
      mb.cyl(bark, x, 0, z, 0.13 * s, 0.22 * s, trunkH + 0.8, { seg: 7, color: '#ffffff', tex: 1.4, rotZ: lean, ao: { k: 0.3, h: 0.5 } });
      branch(x, trunkH, z, x + 0.7 * s, trunkH + 1.0 * s, z + 0.1, 0.07 * s);
      branch(x, trunkH - 0.2, z, x - 0.6 * s, trunkH + 0.9 * s, z, 0.07 * s);
      canopyBlob(ctx, deco, 'leaf_birch', x, trunkH + 1.2 * s, z, 1.0 * s, rng, { sy: 1.2 });
      for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.28 + 0.5; canopyBlob(ctx, deco, 'leaf_birch', x + Math.cos(a) * 0.8 * s, trunkH + 0.7 * s + rng() * 0.9, z + Math.sin(a) * 0.7 * s, 0.7 * s, rng, { sy: 1.1 }); }
      canopy = 1.4 * s;
      ctx.solidCircle(x, z, 0.28 * s);
      ctx.bake({ type: 'ellipse', x, z, rx: 1.3 * s, rz: 1.1 * s, a: 0.35 });
    } else {
      const mat = kind === 'cherry' ? 'leaf_blossom' : 'leaf_leaf';
      trunkH = (kind === 'cherry' ? 1.7 : 2.0) * s;
      mb.cyl(bark, x, 0, z, 0.28 * s, 0.46 * s, trunkH, { seg: 8, color: kind === 'cherry' ? '#8a6058' : barkCol, tex: 1.4, rotZ: lean, ao: { k: 0.3, h: 0.8 } });
      mb.cone(bark, x, 0, z, 0.8 * s, 0.5 * s, { seg: 8, color: barkCol, tex: 1.2 });
      branch(x, trunkH * 0.85, z, x - 0.9 * s, trunkH + 1.0 * s, z + 0.2, 0.17 * s);
      branch(x, trunkH * 0.85, z, x + 0.9 * s, trunkH + 0.9 * s, z - 0.2, 0.17 * s);
      branch(x, trunkH * 0.9, z, x + 0.1, trunkH + 1.6 * s, z + 0.2, 0.15 * s);
      const R = (kind === 'cherry' ? 1.35 : 1.6) * s;
      const cy = trunkH + R * 0.85;
      canopyBlob(ctx, deco, mat, x, cy, z, R, rng, { swayY0: trunkH });
      const n = kind === 'cherry' ? 5 : 6;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 6.28 + rng() * 0.6;
        canopyBlob(ctx, deco, mat, x + Math.cos(a) * R * 0.85, cy - R * 0.25 + rng() * R * 0.6, z + Math.sin(a) * R * 0.8, R * rr(rng, 0.55, 0.72), rng, { swayY0: trunkH });
      }
      canopy = R * 1.5;
      ctx.solidCircle(x, z, 0.42 * s);
      ctx.bake({ type: 'ellipse', x, z, rx: R * 1.1, rz: R * 0.95, a: 0.4, blur: 0.5 });
    }
    if (kind !== 'pine') {
      // bare winter crown: slim twigs (only visible when the leaves are gone)
      const wm = ctx.mbFor('winter');
      const top = (kind === 'willow' ? 2.6 : kind === 'birch' ? 2.9 : 2.0) * s;
      const tw = ctx.rngFor(3);
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * 6.28 + tw() * 0.5, up = 0.9 + tw() * 1.3, out = (0.6 + tw() * 0.9) * s;
        const ex = x + Math.cos(a) * out, ez = z + Math.sin(a) * out, ey = top + up * s;
        const dx = ex - x, dy = ey - top, dz = ez - z, len = Math.hypot(dx, dy, dz);
        wm.cyl(bark, (x + ex) / 2, (top + ey) / 2 - len / 2, (z + ez) / 2, 0.015 * s, 0.05 * s, len, { seg: 4, color: barkCol, rotZ: -Math.atan2(dx, Math.hypot(dy, dz)), rotX: Math.atan2(dz, dy) });
      }
    }
    ctx.interactable(p, { x, z: z + 1.2, r: 1.4, type: 'object' });
    // falling leaves/petals are global; nothing else here
    void canopy;
  },
};

export const bush = {
  doc: 'Bush. kind: round|berry|flower|hedge. params: x,z,w,scale',
  build(ctx, p) {
    const rng = mulberry32(p.seed ?? Math.floor(p.x * 31 + p.z * 7));
    const kind = p.kind || 'round';
    const s = p.scale ?? 1;
    const deco = ctx.mbFor('notwinter');
    const n = kind === 'hedge' ? Math.max(2, Math.round((p.w ?? 3) / 0.8)) : 3;
    for (let i = 0; i < n; i++) {
      const bx = p.x + (kind === 'hedge' ? -((p.w ?? 3) / 2) + (i + 0.5) * ((p.w ?? 3) / n) : (rng() - 0.5) * 0.9 * s);
      const bz = p.z + (kind === 'hedge' ? 0 : (rng() - 0.5) * 0.6 * s);
      const r = (kind === 'hedge' ? 0.6 : 0.55 + rng() * 0.25) * s;
      const y = r * 0.7;
      deco.ball('leaf_leaf', bx, y, bz, r, { lump: 0.22, detail: 1, seed: i + 5, sy: kind === 'hedge' ? 1.1 : 0.85, tone: rng(), sway: 0.05, swayH: 1, color: '#ffffff', ao: { k: 0.45, h: r * 1.5, y0: 0 } });
      if (kind === 'berry') for (let k = 0; k < 4; k++) deco.ball('flat', bx + (rng() - 0.5) * r * 1.4, y + rng() * r * 0.6, bz + r * 0.5 + rng() * 0.2, 0.06, { color: '#d93a55', detail: 0 });
      if (kind === 'flower') for (let k = 0; k < 6; k++) deco.ball('flat', bx + (rng() - 0.5) * r * 1.5, y + rng() * r * 0.7, bz + r * 0.35 + rng() * 0.25, 0.09, { color: (p.colors || PAL.flowerCols)[(rng() * 6) | 0 % 6] || '#ff7fa3', detail: 0 });
      // winter: bare twig mound + snow
      ctx.mbFor('winter').ball('wood', bx, y * 0.8, bz, r * 0.8, { lump: 0.3, detail: 1, seed: i, sy: 0.7, color: '#8a6a4a' });
      ctx.mbFor('winter').ball('snow', bx, y * 1.05, bz, r * 0.85, { lump: 0.2, detail: 1, seed: i, sy: 0.45 });
    }
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.1, rx: (kind === 'hedge' ? (p.w ?? 3) / 2 + 0.2 : 0.9 * s), rz: (kind === 'hedge' ? 0.7 : 0.7 * s), a: 0.35 });
    if (kind === 'hedge') ctx.solid(p.x - (p.w ?? 3) / 2, p.z - 0.5, p.x + (p.w ?? 3) / 2, p.z + 0.5);
    else if (p.solid !== false) ctx.solidCircle(p.x, p.z, 0.5 * s);
    ctx.interactable(p, { x: p.x, z: p.z + 1, r: 1.2 });
  },
};

const SEASON_FLOWERS = {
  spring: ['#ff9ec0', '#fff6e8', '#ffe27a', '#c9a4ff', '#ff7fa3'],
  summer: ['#ff6f8f', '#ffd23f', '#ffffff', '#b78cff', '#ff9a4a', '#ff5f6d'],
  autumn: ['#e8923a', '#c2562b', '#d9b74a', '#a35bb0'],
};

export const flowers = {
  doc: 'Patch of instanced flowers. params: x,z,rx,rz (or r),n,colors?,h (height scale)',
  build(ctx, p) {
    const rng = mulberry32(p.seed ?? Math.floor(p.x * 13 + p.z * 29));
    const rx = p.rx ?? p.r ?? 1.5, rz = p.rz ?? p.r ?? 1.2;
    const n = Math.round((p.n ?? 40) * (ctx.s.quality === 'low' ? 0.5 : 1));
    for (const season of ['spring', 'summer', 'autumn']) {
      const cols = p.colors || SEASON_FLOWERS[season];
      const list = [];
      for (let i = 0; i < n; i++) {
        const a = rng() * 6.28, r = Math.sqrt(rng());
        list.push({ x: p.x + Math.cos(a) * r * rx, z: p.z + Math.sin(a) * r * rz, c: cols[(rng() * cols.length) | 0], s: 0.8 + rng() * 0.6, h: p.h ?? 1, r: rng() * 6.28 });
      }
      ctx.flowers(list, [season]);
    }
    if (p.bed) {
      ctx.bake({ type: 'paint', fn: (c, px, ox, oz) => { c.fillStyle = 'rgba(92,62,38,0.95)'; c.shadowColor = 'rgba(40,24,12,0.5)'; c.shadowBlur = 0.2 * px; c.beginPath(); c.ellipse((p.x + ox) * px, (p.z + oz) * px, (rx + 0.35) * px, (rz + 0.3) * px, 0, 0, 6.3); c.fill(); } });
    }
  },
};

export const sunflowers = {
  doc: 'Summer sunflowers. params: x,z,n,r',
  build(ctx, p) {
    const rng = mulberry32(p.seed ?? 77);
    const mb = ctx.mbFor('summer');
    for (let i = 0; i < (p.n ?? 5); i++) {
      const a = rng() * 6.28, r = Math.sqrt(rng()) * (p.r ?? 1);
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r * 0.8;
      const h = 1.2 + rng() * 0.6;
      mb.cyl('flat', x, 0, z, 0.03, 0.045, h, { seg: 5, color: '#4f9a40', sway: 0.12, swayH: h });
      mb.ball('flat', x - 0.12, h * 0.4, z, 0.1, { color: '#5aa84a', detail: 0, sy: 0.3, sx: 2.2 });
      mb.cyl('flat', x, h, z + 0.08, 0.3, 0.3, 0.05, { seg: 14, color: '#ffd23f', rotX: -0.7, sway: 0.12, swayH: h, swayY0: h - 0.1 });
      mb.cyl('flat', x, h + 0.02, z + 0.09, 0.15, 0.15, 0.08, { seg: 10, color: '#5a3a1e', rotX: -0.7 });
    }
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: (p.r ?? 1) + 0.3, rz: (p.r ?? 1) * 0.8 + 0.2, a: 0.2 });
  },
};

export const rock = {
  doc: 'Boulder/rock. params: x,z,scale,color',
  build(ctx, p) {
    const rng = mulberry32(p.seed ?? Math.floor(p.x * 7 + p.z));
    const s = p.scale ?? 1;
    const col = p.color || '#a8a49c';
    ctx.mb.ball('flat', p.x, 0.28 * s, p.z, 0.65 * s, { lump: 0.3, detail: 1, seed: Math.floor(rng() * 99), sy: 0.62, sx: 1 + rng() * 0.3, color: col, jitter: 0.08, ao: { k: 0.4, h: 0.6 * s, y0: 0 } });
    if (rng() < 0.6) ctx.mb.ball('flat', p.x + 0.55 * s, 0.14 * s, p.z + 0.2, 0.3 * s, { lump: 0.3, detail: 1, seed: 5, sy: 0.6, color: col, jitter: 0.1 });
    ctx.mbFor('notwinter').ball('leaf_leaf', p.x - 0.1 * s, 0.5 * s, p.z - 0.15 * s, 0.34 * s, { lump: 0.3, detail: 1, seed: 3, sy: 0.4, tone: 0.5, color: '#ffffff' });
    ctx.mbFor('winter').ball('snow', p.x, 0.5 * s, p.z, 0.5 * s, { lump: 0.2, detail: 1, seed: 3, sy: 0.4 });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.05, rx: 0.95 * s, rz: 0.7 * s, a: 0.4 });
    ctx.solidCircle(p.x, p.z, 0.55 * s);
    ctx.interactable(p, { x: p.x, z: p.z + 0.9, r: 1.0 });
  },
};

export const stump = {
  doc: 'Tree stump. params: x,z,scale',
  build(ctx, p) {
    const s = p.scale ?? 1;
    ctx.mb.cyl('bark', p.x, 0, p.z, 0.4 * s, 0.5 * s, 0.55 * s, { seg: 9, color: '#c9a07a', tex: 1.2, ao: { k: 0.3, h: 0.5 } });
    ctx.mb.cyl('wood', p.x, 0.55 * s, p.z, 0.38 * s, 0.38 * s, 0.03, { seg: 9, color: '#e6c490' });
    ctx.mbFor('winter').cyl('snow', p.x, 0.56 * s, p.z, 0.4 * s, 0.4 * s, 0.1, { seg: 9 });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: 0.8 * s, rz: 0.65 * s, a: 0.35 });
    ctx.solidCircle(p.x, p.z, 0.42 * s);
    ctx.interactable(p, { x: p.x, z: p.z + 0.9, r: 1 });
  },
};

export const reeds = {
  doc: 'Reeds/cattails by the water. params: x,z,n,r',
  build(ctx, p) {
    const rng = mulberry32(p.seed ?? Math.floor(p.x * 3 + p.z * 5));
    const mb = ctx.mbFor('notwinter');
    for (let i = 0; i < (p.n ?? 6); i++) {
      const a = rng() * 6.28, r = Math.sqrt(rng()) * (p.r ?? 0.7);
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r;
      const h = 0.9 + rng() * 0.8;
      mb.cyl('flat', x, 0, z, 0.012, 0.025, h, { seg: 4, color: '#5f9a48', sway: 0.14, swayH: h, rotZ: (rng() - 0.5) * 0.25 });
      if (rng() < 0.55) mb.cyl('flat', x, h * 0.74, z, 0.045, 0.045, 0.3, { seg: 5, color: '#6b4426', sway: 0.14, swayH: h });
    }
  },
};

export const mushrooms = {
  doc: 'Cluster of mushrooms. params: x,z,n',
  build(ctx, p) {
    const rng = mulberry32(p.seed ?? 11);
    const mb = ctx.mbFor('notwinter');
    for (let i = 0; i < (p.n ?? 4); i++) {
      const x = p.x + (rng() - 0.5) * 0.8, z = p.z + (rng() - 0.5) * 0.6, h = 0.18 + rng() * 0.18;
      mb.cyl('flat', x, 0, z, 0.04, 0.05, h, { seg: 6, color: '#f4ead4' });
      mb.ball('flat', x, h, z, 0.12 + rng() * 0.07, { detail: 1, sy: 0.6, color: rng() < 0.6 ? '#d9473f' : '#c9904a' });
    }
  },
};

export const forage_spot = {
  doc: 'Forageable spot (needs id forage_*). Visual: herb tuft + berries/mushrooms by season. params: x,z,id,label',
  build(ctx, p) {
    const rng = mulberry32(p.seed ?? Math.floor(p.x * 5 + p.z * 3));
    for (const [season, fn] of [
      ['spring', (mb) => { for (let i = 0; i < 6; i++) mb.ball('flat', p.x + (rng() - 0.5) * 0.7, 0.1, p.z + (rng() - 0.5) * 0.5, 0.07, { color: '#fff6e8', detail: 0, sy: 0.5 }); }],
      ['summer', (mb) => { for (let i = 0; i < 5; i++) mb.ball('flat', p.x + (rng() - 0.5) * 0.7, 0.12, p.z + (rng() - 0.5) * 0.5, 0.075, { color: '#c0364e', detail: 0 }); }],
      ['autumn', (mb) => { for (let i = 0; i < 4; i++) { const x = p.x + (rng() - 0.5) * 0.7, z = p.z + (rng() - 0.5) * 0.5; mb.cyl('flat', x, 0, z, 0.03, 0.04, 0.14, { seg: 5, color: '#f4ead4' }); mb.ball('flat', x, 0.14, z, 0.1, { color: '#b9772e', detail: 1, sy: 0.6 }); } }],
    ]) {
      const mb = ctx.mbFor([season]);
      for (let i = 0; i < 5; i++) mb.cone('leaf_leaf', p.x + (rng() - 0.5) * 0.7, 0, p.z + (rng() - 0.5) * 0.5, 0.12, 0.3 + rng() * 0.15, { seg: 5, tone: rng(), sway: 0.06, swayH: 0.4, color: '#ffffff', rotZ: (rng() - 0.5) * 0.5 });
      fn(mb);
    }
    ctx.interactable({ type: 'forage', r: 1.0, ...p }, { label: 'Forage spot', text: 'Something might be growing here.' });
  },
};
