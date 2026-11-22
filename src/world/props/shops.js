/**
 * Shop interior furniture (bakery, general store, cafe): display cases, brick oven, upright piano, coffee machine,
 * staircase to the loft, pigeonholes, copper pot rail, goods shelves, bread rack, wall sign, tabletop dressing.
 * Floor coordinates, `dir` = way the front faces (like interior.js). Pure helpers; registered via props/index.js.
 */
import * as THREE from 'three';
import { mulberry32 } from '../../core/util.js';
import { PAL, frame, signMat } from './util.js';
import { placeMatrix } from '../geo.js';

const dirRot = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };
const furniture = (doc, fn) => ({ doc, build: (ctx, p) => fn(ctx, p, frame(ctx.mb, p.x, 0, p.z, dirRot[p.dir || 's'] ?? 0)) });

function glow(ctx, x, y, z, size, color = '#ffb468', k = 0.4) {
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.5, color }));
  halo.scale.set(size, size, 1);
  halo.position.set(x, y, z);
  ctx.root.add(halo);
  ctx.updater((dt, t, env) => { halo.material.opacity = k * (0.55 + env.night * 0.45) * (0.95 + Math.sin(t * 5 + x * 3) * 0.05); });
}

function reg(ctx, p, rect, def = {}) {
  const [x0, z0, x1, z1] = rect;
  ctx.solid(x0, z0, x1, z1, { tile: def.tile !== false });
  ctx.bake({ type: 'rect', x: x0 - 0.15, z: z0 - 0.1, w: x1 - x0 + 0.3, d: z1 - z0 + 0.3, a: 0.4, blur: 0.28 });
  ctx.interactable(p, def);
}

const BREAD = ['#d79a55', '#c4803f', '#e6b46e', '#b9722f', '#e8c081'];

function loaf(F, x, y, z, rng, s = 1) {
  const c = BREAD[(rng() * BREAD.length) | 0];
  if (rng() < 0.35) F.box('flat', x, y, z, 0.07 * s, 0.07 * s, 0.5 * s, { color: c, rotY: (rng() - 0.5) * 0.9 });
  else F.ball('flat', x, y + 0.09 * s, z, 0.14 * s, { color: c, detail: 1, sy: 0.7, sx: 1.25 });
}

export const display_case = furniture('Glass-fronted bakery counter with pastries. params: x,z (front centre),w=3,dir,id', (ctx, p, F) => {
  const w = p.w ?? 3;
  const rng = mulberry32(Math.floor(p.x * 11 + p.z * 5));
  F.box('wood', 0, 0, -0.45, w, 0.95, 0.9, { color: '#a8643a', tex: 1.2, ao: { k: 0.25, h: 0.5 } });
  for (let i = 0; i < Math.floor(w / 0.8); i++) F.box('wood', -w / 2 + 0.45 + i * 0.8, 0.12, 0.0, 0.66, 0.7, 0.04, { color: '#8a4a28' });
  F.box('trim', 0, 0.95, -0.45, w + 0.12, 0.07, 0.96, { color: '#fff4de' });
  // glass case on top with trays
  F.box('flat', 0, 1.02, -0.45, w - 0.1, 0.05, 0.8, { color: '#f4ead4' });
  for (let i = 0; i < Math.floor((w - 0.3) / 0.5); i++) {
    const x = -w / 2 + 0.4 + i * 0.5;
    const t = rng();
    if (t < 0.4) F.ball('flat', x, 1.12, -0.35, 0.13, { color: ['#f3b7c8', '#f0d3a0', '#c88a56'][(rng() * 3) | 0], detail: 1, sy: 0.75 });
    else if (t < 0.75) F.cyl('flat', x, 1.07, -0.35, 0.15, 0.17, 0.12, { seg: 8, color: ['#f6e4b0', '#e9a05a', '#d9855a'][(rng() * 3) | 0] });
    else loaf(F, x, 1.07, -0.4, rng, 0.9);
    F.ball('flat', x + 0.1, 1.2, -0.55, 0.05, { color: '#d9534a', detail: 0 });
  }
  F.box('glass', 0, 1.05, -0.05, w - 0.1, 0.34, 0.03, { color: '#ffffff' });
  
  for (const sx of [-1, 1]) F.box('glass', sx * (w / 2 - 0.05), 1.05, -0.45, 0.03, 0.34, 0.8, { color: '#ffffff' });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.box('metal', sx * (w / 2 - 0.05), 1.0, -0.45 + sz * 0.38, 0.05, 0.66, 0.05, { color: PAL.brass });
  reg(ctx, p, [p.x - w / 2 - 0.1, p.z - 0.95, p.x + w / 2 + 0.1, p.z + 0.1], { type: 'object', x: p.x, z: p.z + 0.9, r: 1.4, label: 'Pastry case', text: 'Buns, tarts and pastries glisten behind the glass.' });
});

export const brick_oven = furniture('Big brick bread oven with hood and wood store. params: x,z (front centre),w=3,dir,id', (ctx, p, F) => {
  const w = p.w ?? 3.2;
  F.box('brick', 0, 0, -0.75, w, 1.25, 1.5, { color: '#d98a6a', tex: 1.4, ao: { k: 0.3, h: 0.6 } });
  // arched mouth
  F.box('flat', 0, 0.3, -0.02, 1.15, 0.7, 0.1, { color: '#1c1210' });
  F.cyl('flat', 0, 0.98, -0.02, 0.58, 0.58, 0.1, { seg: 12, color: '#1c1210', rotX: Math.PI / 2, sy: 0.45 });
  F.box('glow', 0, 0.34, 0.04, 0.8, 0.28, 0.03, { color: '#ff8a3a' });
  F.box('glow', 0.1, 0.4, 0.06, 0.4, 0.4, 0.02, { color: '#ffd05a' });
  for (let i = 0; i <= 8; i++) { const a = (i / 8) * Math.PI; F.box('stone', Math.cos(a) * 0.68, 0.55 + Math.sin(a) * 0.6, 0.0, 0.2, 0.16, 0.22, { color: '#e8dcc4', rotZ: a - Math.PI / 2 }); }
  F.box('stone', -0.7, 0, 0.0, 0.18, 0.62, 0.22, { color: '#e8dcc4' });
  F.box('stone', 0.7, 0, 0.0, 0.18, 0.62, 0.22, { color: '#e8dcc4' });
  // top slab, hood and flue up the wall
  F.box('stone', 0, 1.25, -0.75, w + 0.16, 0.12, 1.62, { color: '#d9d2c8', tex: 1.2 });
  F.box('brick', 0, 1.37, -0.8, 1.7, 1.2, 1.0, { color: '#d98a6a', tex: 1.4 });
  F.box('brick', 0, 2.57, -0.9, 0.9, 1.4, 0.7, { color: '#cf7f60', tex: 1.4 });
  // peel + wood store on the side
  F.box('wood', -w / 2 - 0.5, 0, -0.5, 0.8, 0.9, 0.9, { color: '#7a4a28' });
  for (let i = 0; i < 4; i++) F.cyl('wood', -w / 2 - 0.5, 0.18 + i * 0.19, -0.5, 0.07, 0.07, 0.75, { seg: 6, color: ['#b9824f', '#a06a3a'][i % 2], rotZ: Math.PI / 2 });
  F.cyl('wood', w / 2 - 0.35, 0.0, 0.14, 0.03, 0.03, 1.9, { seg: 5, color: '#a87444', rotZ: 0.12 });
  F.box('wood', w / 2 - 0.3, 1.78, 0.14, 0.34, 0.03, 0.34, { color: '#c4915a' });
  reg(ctx, p, [p.x - w / 2 - 0.9, p.z - 1.5, p.x + w / 2, p.z], { type: 'object', x: p.x, z: p.z + 1.0, r: 1.5, label: 'Brick oven', text: 'The big brick oven is always warm and smells of fresh rye.' });
  glow(ctx, p.x, 0.5, p.z + 0.15, 3.2, '#ff8a3a', 0.5);
});

export const piano = furniture('Upright piano with stool. params: x,z (front centre),w=2,dir,id', (ctx, p, F) => {
  const w = p.w ?? 2.1;
  F.box('wooddark', 0, 0, -0.3, w, 1.35, 0.6, { color: '#5a3424', tex: 1.2, ao: { k: 0.25, h: 0.8 } });
  F.box('wooddark', 0, 1.35, -0.3, w + 0.1, 0.07, 0.68, { color: '#4a2a1c', tex: 1.2 });
  F.box('wooddark', 0, 0.72, 0.1, w - 0.1, 0.1, 0.34, { color: '#4a2a1c' });
  F.box('flat', 0, 0.82, 0.0, w - 0.2, 0.05, 0.28, { color: '#fffaf0' });
  for (let i = 0; i < 18; i++) if (i % 7 !== 2 && i % 7 !== 6) F.box('flat', -w / 2 + 0.2 + i * ((w - 0.4) / 18) + 0.06, 0.86, -0.03, 0.045, 0.04, 0.14, { color: '#1a1414' });
  F.box('flat', 0, 0.92, -0.35, w - 0.3, 0.38, 0.04, { color: '#2a1a14' });
  F.box('flat', 0, 1.0, -0.26, 0.5, 0.3, 0.02, { color: '#fff4de' }); // sheet music
  F.box('wooddark', 0, 0, 0.04, 0.1, 0.7, 0.1, { color: '#4a2a1c' });
  for (const sx of [-1, 1]) F.box('wooddark', sx * (w / 2 - 0.12), 0, 0.0, 0.14, 0.72, 0.5, { color: '#4a2a1c' });
  F.cyl('metal', -0.6, 1.42, -0.3, 0.06, 0.08, 0.2, { seg: 6, color: PAL.brass });
  F.cyl('flat', 0, 0.0, 0.62, 0.22, 0.24, 0.5, { seg: 8, color: '#8a4a3a' });
  F.cyl('cloth', 0, 0.5, 0.62, 0.26, 0.26, 0.07, { seg: 10, color: '#b9453a' });
  reg(ctx, p, [p.x - w / 2, p.z - 0.62, p.x + w / 2, p.z + 0.1], { type: 'object', x: p.x, z: p.z + 1.0, r: 1.5, label: 'Piano', text: 'An upright piano, a little out of tune but much loved.' });
});

export const coffee_machine = furniture('Brass espresso machine on a cabinet. params: x,z (front centre),w=1.8,dir,id', (ctx, p, F) => {
  const w = p.w ?? 1.8;
  F.box('wood', 0, 0, -0.35, w, 1.0, 0.7, { color: '#a8643a', tex: 1.2, ao: { k: 0.25, h: 0.5 } });
  F.box('wood', 0, 1.0, -0.35, w + 0.1, 0.07, 0.78, { color: '#d9a870', tex: 1.2 });
  F.box('metal', 0, 1.07, -0.4, 1.1, 0.7, 0.5, { color: '#c97a3a' });
  F.box('metal', 0, 1.77, -0.4, 1.2, 0.08, 0.56, { color: PAL.brass });
  F.cyl('metal', -0.36, 1.85, -0.4, 0.14, 0.14, 0.22, { seg: 10, color: PAL.brass });
  F.ball('metal', -0.36, 2.1, -0.4, 0.1, { color: PAL.brass, detail: 0 });
  F.ball('metal', 0.36, 1.45, -0.12, 0.07, { color: '#2d2a30', detail: 0 });
  F.ball('metal', -0.12, 1.45, -0.12, 0.07, { color: '#2d2a30', detail: 0 });
  F.cyl('metal', 0.1, 1.1, -0.12, 0.05, 0.05, 0.3, { seg: 6, color: '#2d2a30' });
  F.box('flat', 0.1, 1.07, -0.04, 0.5, 0.04, 0.2, { color: '#3a3a42' });
  for (const sx of [-0.55, 0.55]) F.cyl('flat', sx, 1.07, 0.0, 0.07, 0.06, 0.1, { seg: 8, color: '#fff4e0' });
  F.cyl('flat', 0.75, 1.07, -0.35, 0.16, 0.18, 0.28, { seg: 8, color: '#8fb8d0' });
  reg(ctx, p, [p.x - w / 2, p.z - 0.72, p.x + w / 2, p.z + 0.05], { type: 'object', x: p.x, z: p.z + 0.9, r: 1.4, label: 'Coffee machine', text: 'The brass coffee machine hisses and gurgles like a happy dragon.' });
  glow(ctx, p.x, 1.2, p.z + 0.3, 1.6, '#ffb468', 0.25);
});

export const stairs = furniture('Wooden staircase up to a loft landing along a side wall (rises toward -z in its frame). params: x,z (foot centre),dir=s,w=1.4,n=11,run=3.4,rise=2.7', (ctx, p, F) => {
  const w = p.w ?? 1.4, n = p.n ?? 11, run = p.run ?? 3.4, rise = p.rise ?? 2.7;
  const sd = run / n, sh = rise / n;
  for (let i = 0; i < n; i++) {
    const zc = -sd * (i + 0.5);
    F.box('wood', 0, 0, zc, w, sh * (i + 1), sd, { color: i % 2 ? '#c4915a' : '#b9824f', tex: 1.2, ao: { k: 0.15, h: sh } });
    F.box('wood', 0, sh * (i + 1) - 0.02, zc + 0.04, w + 0.02, 0.05, sd + 0.1, { color: '#d9a870' });
  }
  // stringers + rail
  for (const sx of [-1, 1]) {
    F.box('wooddark', sx * (w / 2 + 0.04), 0, -run / 2, 0.08, 0.5, run, { color: '#6a4a32' });
    for (let k = 0; k <= 5; k++) {
      const u = k / 5;
      F.box('wooddark', sx * (w / 2 - 0.02), sh * (u * n) * 1.0, -run * u + (k === 0 ? 0 : 0.0), 0.06, 0.95, 0.06, { color: '#6a4a32' });
    }
  }
  const ang = Math.atan2(rise, run);
  F.box('wooddark', w / 2 - 0.02, rise / 2 + 0.88, -run / 2, 0.08, 0.07, Math.hypot(run, rise), { color: '#8a5a34', rotX: ang });
  // landing
  const L = 1.5;
  F.box('wood', 0, rise - 0.12, -run - L / 2, w + 0.3, 0.14, L, { color: '#b9824f', tex: 1.2 });
  F.box('wooddark', 0, rise - 0.14, -run - L - 0.01, w + 0.4, 0.3, 0.12, { color: '#6a4a32' });
  for (let k = 0; k < 4; k++) F.box('wooddark', w / 2 + 0.1, rise, -run - 0.1 - k * 0.38, 0.06, 0.9, 0.06, { color: '#6a4a32' });
  F.box('wooddark', w / 2 + 0.1, rise + 0.9, -run - L / 2, 0.07, 0.07, L, { color: '#8a5a34' });
  for (let k = 0; k < 4; k++) F.box('wooddark', -w / 2 - 0.1, rise, -run - 0.1 - k * 0.38, 0.06, 0.9, 0.06, { color: '#6a4a32' });
  F.box('wooddark', -w / 2 - 0.1, rise + 0.9, -run - L / 2, 0.07, 0.07, L, { color: '#8a5a34' });
  // little door at the top of the stairs
  F.box('wooddark', 0, rise - 0.1, -run - L - 0.02, 1.0, 2.0, 0.12, { color: '#7a4a30' });
  ctx.solid(Math.min(p.x, p.x) - w / 2 - 0.15, p.z - run - L, p.x + w / 2 + 0.15, p.z);
  ctx.bake({ type: 'rect', x: p.x - w / 2 - 0.4, z: p.z - run - L - 0.1, w: w + 0.8, d: run + L + 0.5, a: 0.45, blur: 0.4 });
});

export const pigeonholes = {
  doc: 'Wall unit of mail pigeonholes with letters. params: x (centre),z=0.6 (front),w=2.6,h=2.2',
  build(ctx, p) {
    const w = p.w ?? 2.6, h = p.h ?? 2.2, z = p.z ?? 0.6, d = 0.5;
    const rng = mulberry32(Math.floor(p.x * 13));
    const mb = ctx.mb;
    mb.box('wood', p.x, 0.0, z - d / 2, w, h, d, { color: '#8a5a34', tex: 1.2, ao: { k: 0.3, h: 0.5 } });
    mb.box('flat', p.x, 0.0, z - d / 2 + 0.05, w - 0.1, h, d - 0.08, { color: '#3b2a1c' });
    const cols = 6, rows = 5;
    const cw = (w - 0.14) / cols, rh = (h - 0.14) / rows;
    for (let c = 1; c < cols; c++) mb.box('wood', p.x - w / 2 + 0.07 + c * cw, 0.07, z - d / 2 + 0.1, 0.04, h - 0.14, d - 0.04, { color: '#a87444' });
    for (let r = 0; r <= rows; r++) mb.box('wood', p.x, 0.07 + r * rh - 0.02, z - d / 2 + 0.1, w - 0.1, 0.05, d - 0.04, { color: '#a87444' });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      if (rng() < 0.35) continue;
      mb.box('flat', p.x - w / 2 + 0.07 + (c + 0.5) * cw + (rng() - 0.5) * 0.04, 0.1 + r * rh, z - 0.06 + (rng() - 0.5) * 0.04, cw * 0.55, rh * 0.62, 0.02, { color: ['#fff4e0', '#f4e0b0', '#e8d4b8', '#d8e8f0'][(rng() * 4) | 0], rotZ: (rng() - 0.5) * 0.25 });
      if (rng() < 0.4) mb.box('flat', p.x - w / 2 + 0.07 + (c + 0.5) * cw + 0.06, 0.2 + r * rh, z - 0.04, 0.08, 0.06, 0.02, { color: '#c9453a' });
    }
    mb.box('wood', p.x, h, z - d / 2, w + 0.12, 0.08, d + 0.1, { color: '#7a4a28' });
    ctx.solid(p.x - w / 2, z - d, p.x + w / 2, z);
    const key = signMat(ctx, 'Post', { w: 160, h: 56, bg: '#c9453a', fg: '#fff4e0' });
    mb.add(key, new THREE.PlaneGeometry(0.9, 0.32), { matrix: placeMatrix(p.x, h + 0.35, z - 0.08, {}) });
    mb.box('wood', p.x, h + 0.2, z - 0.1, 1.0, 0.04, 0.05, { color: '#7a4a28' });
  },
};

export const pot_rail = {
  doc: 'Wall rail with hanging copper pots, pans and ladles. params: x,y=2.1,w=2.6,z=0.3',
  build(ctx, p) {
    const w = p.w ?? 2.6, y = p.y ?? 2.1, z = p.z ?? 0.3;
    const mb = ctx.mb;
    const rng = mulberry32(Math.floor(p.x * 7 + 3));
    mb.cyl('metal', p.x, y, z, 0.03, 0.03, w + 0.2, { seg: 5, color: '#3c3844', rotZ: Math.PI / 2 });
    const n = Math.floor(w / 0.42);
    for (let i = 0; i < n; i++) {
      const x = p.x - w / 2 + 0.3 + i * ((w - 0.5) / Math.max(1, n - 1));
      const t = rng();
      mb.cyl('flat', x, y - 0.08, z, 0.012, 0.012, 0.1, { seg: 4, color: '#3c3844' });
      if (t < 0.5) {
        mb.cyl('metal', x, y - 0.5, z + 0.04, 0.17, 0.14, 0.34, { seg: 10, color: ['#c97a3a', '#d98a4a', '#b86a30'][(rng() * 3) | 0] });
        mb.cyl('metal', x, y - 0.5, z + 0.04, 0.12, 0.12, 0.02, { seg: 10, color: '#2a2018' });
      } else if (t < 0.8) {
        mb.cyl('metal', x, y - 0.42, z + 0.05, 0.19, 0.19, 0.05, { seg: 10, color: '#c97a3a', rotX: Math.PI / 2 });
        mb.box('wood', x, y - 0.6, z + 0.05, 0.05, 0.3, 0.05, { color: '#7a4a28' });
      } else {
        mb.cyl('metal', x, y - 0.5, z, 0.02, 0.02, 0.45, { seg: 4, color: '#c97a3a' });
        mb.cyl('metal', x, y - 0.62, z, 0.07, 0.05, 0.1, { seg: 8, color: '#c97a3a' });
      }
    }
  },
};

export const goods_shelf = furniture('Crowded shop shelving: jars, tins, boxes, sacks. params: x,z (front centre),w=2.4,h=2.5,dir,tiers=4,id', (ctx, p, F) => {
  const w = p.w ?? 2.4, h = p.h ?? 2.5, d = 0.6, tiers = p.tiers ?? 4;
  const rng = mulberry32(Math.floor(p.x * 17 + p.z * 3));
  F.box('wood', 0, 0, -d / 2, w, h, d, { color: p.color || '#c4915a', tex: 1.2, ao: { k: 0.3, h: 0.8 } });
  F.box('flat', 0, 0.1, -d / 2 + 0.08, w - 0.16, h - 0.2, d - 0.14, { color: '#b58a5a' });
  const th = (h - 0.25) / tiers;
  for (let r = 0; r < tiers; r++) {
    const y = 0.14 + r * th;
    F.box('wood', 0, y, -d / 2 + 0.04, w - 0.08, 0.06, d - 0.1, { color: '#d9a870' });
    let x = -w / 2 + 0.16;
    while (x < w / 2 - 0.2) {
      const t = rng();
      if (t < 0.28) { const hh = 0.28 + rng() * 0.12; F.cyl('glass', x + 0.08, y + 0.06, -d / 2 + 0.22, 0.08, 0.08, hh, { seg: 8, color: ['#ffd0a0', '#c8e8b0', '#ffc0c8', '#f4d870'][(rng() * 4) | 0] }); F.cyl('wood', x + 0.08, y + 0.06 + hh, -d / 2 + 0.22, 0.07, 0.07, 0.04, { seg: 8, color: '#8a5a34' }); x += 0.2; }
      else if (t < 0.55) { const bw = 0.2 + rng() * 0.14; F.box('flat', x + bw / 2, y + 0.06, -d / 2 + 0.2, bw, 0.2 + rng() * 0.16, 0.22, { color: ['#c9605a', '#5a8ac9', '#e0b24a', '#6aa86a', '#f0e6d0', '#d98a4a'][(rng() * 6) | 0] }); x += bw + 0.02; }
      else if (t < 0.8) { F.cyl('metal', x + 0.1, y + 0.06, -d / 2 + 0.2, 0.1, 0.1, 0.15, { seg: 8, color: ['#cfd6dc', '#e8c05a', '#c9605a'][(rng() * 3) | 0] }); x += 0.24; }
      else { F.ball('cloth', x + 0.17, y + 0.2, -d / 2 + 0.2, 0.19, { color: ['#e8d4a0', '#d8c08a'][(rng() * 2) | 0], detail: 1, sy: 0.85 }); x += 0.38; }
    }
  }
  F.box('wood', 0, h, -d / 2, w + 0.1, 0.1, d + 0.1, { color: '#7a4a28' });
  reg(ctx, p, [p.x - w / 2, p.z - d, p.x + w / 2, p.z], { type: 'object', x: p.x, z: p.z + 0.9, r: 1.3, label: 'Shelves', text: 'Jars, tins and boxes are stacked all the way up to the ceiling.' });
});

export const bread_rack = furniture('Floor rack of loaves and baguettes. params: x,z (front centre),w=2,h=2.0,dir,tiers=3,id', (ctx, p, F) => {
  const w = p.w ?? 2, h = p.h ?? 2.0, d = 0.55, tiers = p.tiers ?? 3;
  const rng = mulberry32(Math.floor(p.x * 5 + p.z * 11));
  for (const sx of [-1, 1]) F.box('wood', sx * (w / 2 - 0.05), 0, -d / 2, 0.1, h, d, { color: '#8a5a34', tex: 1.2 });
  F.box('flat', 0, 0.1, -d / 2 + 0.2, w - 0.1, h - 0.1, 0.06, { color: '#8a6040' });
  const th = (h - 0.2) / tiers;
  for (let r = 0; r < tiers; r++) {
    const y = 0.2 + r * th;
    F.box('wood', 0, y, -d / 2, w, 0.06, d, { color: '#b9824f', tex: 1.2 });
    F.box('wood', 0, y + 0.06, 0.0, w - 0.1, 0.1, 0.04, { color: '#a87444' });
    let x = -w / 2 + 0.22;
    while (x < w / 2 - 0.2) { loaf(F, x, y + 0.06, -d / 2 + 0.05 + (rng() - 0.5) * 0.1, rng, 1.3); x += 0.38 + rng() * 0.08; }
  }
  F.box('wood', 0, h, -d / 2, w + 0.1, 0.08, d + 0.1, { color: '#7a4a28' });
  reg(ctx, p, [p.x - w / 2, p.z - d, p.x + w / 2, p.z], { type: 'object', x: p.x, z: p.z + 0.9, r: 1.3, label: 'Bread rack', text: 'Loaves of rye and golden rolls, still warm.' });
});

export const wall_sign = {
  doc: 'Sign board hanging from a bracket on the back wall. params: x,y=2.5,z=0.2,text,w=1.8,h=0.7,bg,fg',
  build(ctx, p) {
    const w = p.w ?? 1.8, h = p.h ?? 0.7, y = p.y ?? 2.5, z = p.z ?? 0.5;
    const key = signMat(ctx, p.text || 'Shop', { w: Math.round(w * 128), h: Math.round(h * 128), bg: p.bg, fg: p.fg, icon: p.icon });
    ctx.mb.box('metal', p.x, y + h + 0.12, 0.2, w + 0.5, 0.06, 0.06, { color: '#3c3844' });
    ctx.mb.box('metal', p.x, y + h + 0.12, 0.2, 0.06, 0.06, z - 0.2, { color: '#3c3844' });
    ctx.mb.box('metal', p.x - w / 2 - 0.2, y + h + 0.1, z * 0.5 + 0.1, 0.06, 0.06, z - 0.1, { color: '#3c3844' });
    ctx.mb.box('wood', p.x, y - 0.06, z, w + 0.12, h + 0.12, 0.06, { color: '#6e4524' });
    ctx.mb.add(key, new THREE.PlaneGeometry(w, h), { matrix: placeMatrix(p.x, y + h / 2, z + 0.04, {}) });
    for (const sx of [-1, 1]) ctx.mb.cyl('flat', p.x + sx * (w / 2 - 0.15), y + h, z, 0.012, 0.012, 0.14, { seg: 4, color: '#3c3844' });
  },
};

export const tabletop = {
  doc: 'Items on a table surface. params: x,z,y=0.85,kind: dough|loaves|cups|pot, r=0.5',
  build(ctx, p) {
    const mb = ctx.mb;
    const y = p.y ?? 0.85;
    const rng = mulberry32(Math.floor(p.x * 31 + p.z * 7));
    if (p.kind === 'dough') {
      mb.box('flat', p.x, y, p.z, 1.1, 0.02, 0.8, { color: '#f4ead4', rotY: 0.05 });
      for (let i = 0; i < 3; i++) mb.ball('flat', p.x - 0.3 + i * 0.3, y + 0.11, p.z + (rng() - 0.5) * 0.2, 0.13, { color: '#f0dcb4', detail: 1, sy: 0.7 });
      mb.cyl('wood', p.x + 0.05, y + 0.05, p.z + 0.28, 0.035, 0.035, 0.5, { seg: 6, color: '#c4915a', rotZ: Math.PI / 2, rotY: 0.2 });
      mb.cyl('flat', p.x - 0.45, y, p.z + 0.35, 0.1, 0.09, 0.08, { seg: 8, color: '#fff' });
      for (let i = 0; i < 26; i++) mb.ball('flat', p.x + (rng() - 0.5) * 1.3, y + 0.025, p.z + (rng() - 0.5) * 0.9, 0.05 + rng() * 0.05, { color: '#fffaf0', detail: 0, sy: 0.1 });
    } else if (p.kind === 'loaves') {
      mb.box('wood', p.x, y, p.z, 0.9, 0.03, 0.5, { color: '#a87444' });
      for (let i = 0; i < 4; i++) mb.ball('flat', p.x - 0.32 + i * 0.22, y + 0.12, p.z, 0.12, { color: BREAD[(rng() * 5) | 0], detail: 1, sy: 0.7, sx: 1.2 });
    } else if (p.kind === 'cups') {
      for (let i = 0; i < 2; i++) { mb.cyl('flat', p.x - 0.15 + i * 0.35, y, p.z + (i ? 0.05 : -0.05), 0.07, 0.05, 0.09, { seg: 8, color: '#fff4e0' }); mb.cyl('flat', p.x - 0.15 + i * 0.35, y + 0.085, p.z + (i ? 0.05 : -0.05), 0.058, 0.058, 0.01, { seg: 8, color: '#5a3424' }); }
      mb.cyl('flat', p.x + 0.1, y, p.z - 0.2, 0.09, 0.08, 0.14, { seg: 8, color: '#8fb8d0' });
    } else {
      mb.cyl('metal', p.x, y, p.z, 0.13, 0.11, 0.2, { seg: 8, color: '#c97a3a' });
    }
  },
};
