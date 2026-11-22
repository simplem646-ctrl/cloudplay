/**
 * Interior shell (cut-away room) + furniture. Coordinates: room floor spans x 0..w, z 0..d; back wall at z=0,
 * the front is open (camera side). Furniture params are floor positions; `dir` = way the item faces.
 */
import * as THREE from 'three';
import { mulberry32 } from '../../core/util.js';
import { PAL, frame, signMat, colorize } from './util.js';
import { makeCanvas } from '../textures.js';
import { placeMatrix } from '../geo.js';

const dirRot = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };

function lightGlow(ctx, x, y, z, size, color = '#ffb468') {
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6, color }));
  halo.scale.set(size, size, 1);
  halo.position.set(x, y, z);
  ctx.root.add(halo);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.8, size * 1.8), new THREE.MeshBasicMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.35, color }));
  pool.rotation.x = -Math.PI / 2;
  pool.position.set(x, 0.05, z + 0.2);
  pool.renderOrder = 3;
  ctx.root.add(pool);
  ctx.updater((dt, t, env) => {
    const k = 0.5 + env.night * 0.5;
    halo.material.opacity = 0.42 * k * (0.96 + Math.sin(t * 6 + x) * 0.04);
    pool.material.opacity = 0.26 * k;
  });
}

export const room = {
  doc: 'Interior shell. Built automatically for kind:"interior" from def.room {wall,wallColor,wainscot,wallH,windows,exit}.',
  build(ctx, p) {
    const mb = ctx.mb;
    const w = p.w, d = p.d;
    const H = p.wallH ?? 3.8;
    const T = 0.45;
    const wallMat = p.wall === 'brick' ? 'brick' : p.wall === 'stone' ? 'stone' : p.wall === 'wood' ? 'plankwall' : 'plaster';
    const wc = p.wallColor || '#f1dcb8';
    const wain = p.wainscot || '#9a6a42';
    const trim = p.trim || '#fff0d6';
    // back wall + side walls
    mb.box(wallMat, w / 2, 0, -T / 2, w + T * 2, H, T, { color: wc, tex: 2.4, ao: { k: 0.35, h: 1.3 } });
    mb.box(wallMat, -T / 2, 0, d / 2 - T / 2 + 0.0, T, H, d + T, { color: wc, tex: 2.4 });
    mb.box(wallMat, w + T / 2, 0, d / 2 - T / 2, T, H, d + T, { color: wc, tex: 2.4 });
    // wall cap, crown
    mb.box('wood', w / 2, H, -T / 2, w + T * 2 + 0.1, 0.16, T + 0.1, { color: '#c8966a' });
    mb.box('wood', -T / 2, H, d / 2 - T / 2, T + 0.1, 0.16, d + T + 0.1, { color: '#c8966a' });
    mb.box('wood', w + T / 2, H, d / 2 - T / 2, T + 0.1, 0.16, d + T + 0.1, { color: '#c8966a' });
    // wainscot + baseboard on inner faces
    mb.box('wood', w / 2, 0, 0.07, w, 1.15, 0.1, { color: wain, tex: 1.6 });
    mb.box('trim', w / 2, 1.15, 0.09, w, 0.12, 0.14, { color: trim });
    mb.box('trim', w / 2, 0, 0.1, w, 0.2, 0.14, { color: trim });
    mb.box('trim', w / 2, H - 0.3, 0.07, w, 0.3, 0.14, { color: trim });
    for (const sx of [0, w]) {
      const dx = sx === 0 ? 0.06 : -0.06;
      mb.box('wood', sx + dx, 0, d / 2, 0.1, 1.15, d, { color: wain, tex: 1.6 });
      mb.box('trim', sx + dx, 1.15, d / 2, 0.14, 0.12, d, { color: trim });
      mb.box('trim', sx + dx * 1.2, 0, d / 2, 0.14, 0.2, d, { color: trim });
    }
    // floor slab lip (diorama cross-section)
    mb.box('wooddark', w / 2, -0.55, d + 0.25, w + T * 2, 0.55, 0.5, { color: '#a47850', tex: 1.4 });
    mb.box('trim', w / 2, 0, d + 0.12, w + 0.1, 0.1, 0.24, { color: '#c89a68' });
    for (const sx of [-T / 2, w + T / 2]) mb.box('wooddark', sx, -0.55, d + 0.25, T, 0.55, 0.5, { color: '#a47850' });
    // baked wall AO onto floor
    ctx.bake({ type: 'rect', x: -0.5, z: -0.5, w: w + 1, d: 1.2, a: 0.55, blur: 0.55 });
    ctx.bake({ type: 'rect', x: -0.6, z: -0.2, w: 1.2, d: d + 0.4, a: 0.45, blur: 0.5 });
    ctx.bake({ type: 'rect', x: w - 0.6, z: -0.2, w: 1.2, d: d + 0.4, a: 0.45, blur: 0.5 });
    // windows on the back wall
    const gi = ctx.mats.glassin || (ctx.mats.glassin = new THREE.MeshBasicMaterial({ map: ctx.tex.get('glass'), vertexColors: true }));
    ctx.s.meta.glassin = { cast: false, receive: false };
    for (const win of p.windows || []) {
      const ww = win.w ?? 1.8, wh = win.h ?? 1.7, wy = win.y ?? 1.5;
      mb.box('flat', win.at, wy - 0.1, 0.03, ww + 0.5, wh + 0.4, 0.06, { color: '#3a2a22' });
      mb.add('glassin', new THREE.PlaneGeometry(ww, wh), { matrix: placeMatrix(win.at, wy + wh / 2, 0.09, {}), color: '#ffffff' });
      const t = 0.12;
      mb.box('trim', win.at, wy - t, 0.1, ww + 0.4, 0.14, 0.18, { color: trim });
      mb.box('trim', win.at, wy + wh, 0.1, ww + 0.4, 0.14, 0.18, { color: trim });
      for (const sx of [-1, 1]) mb.box('trim', win.at + sx * (ww / 2 + 0.1), wy - t, 0.1, 0.14, wh + 0.28, 0.18, { color: trim });
      mb.box('trim', win.at, wy, 0.12, 0.08, wh, 0.1, { color: trim });
      mb.box('trim', win.at, wy + wh / 2, 0.12, ww, 0.08, 0.1, { color: trim });
      mb.box('trim', win.at, wy - t - 0.08, 0.2, ww + 0.55, 0.1, 0.34, { color: trim });
      // curtains
      for (const sx of [-1, 1]) {
        const cc = win.curtain || '#c9605a';
        mb.box('cloth', win.at + sx * (ww / 2 + 0.05), wy - 0.1, 0.22, 0.5, wh + 0.5, 0.1, { color: cc, jitter: 0.04 });
        mb.box('cloth', win.at + sx * (ww / 2 - 0.12), wy - 0.1, 0.25, 0.14, wh + 0.5, 0.1, { color: cc, jitter: -0.12 });
      }
      mb.cyl('metal', win.at, wy + wh + 0.34, 0.24, 0.03, 0.03, ww + 1.4, { seg: 5, color: PAL.brass, rotZ: Math.PI / 2 });
      // light shaft
      const shaft = new THREE.Mesh(new THREE.PlaneGeometry(ww * 0.95, 4.4), new THREE.MeshBasicMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0, color: '#fff0c0', side: THREE.DoubleSide }));
      shaft.position.set(win.at + 0.9, 1.6, 2.3);
      shaft.rotation.x = -0.95;
      shaft.rotation.z = 0.0;
      ctx.root.add(shaft);
      ctx.updater((dt, t, env) => {
        shaft.material.opacity = (1 - env.night) * (env.weather === 'sunny' ? 0.42 : 0.12);
        const day = 1 - env.night;
        gi.color.setRGB(0.35 + day * 0.65, 0.4 + day * 0.6, 0.55 + day * 0.45);
      });
    }
    // exit
    if (p.exit) {
      const at = p.exit.at ?? w / 2;
      const id = p.exit.id;
      const ew = p.exit.w ?? 2.0;
      ctx.transition({ id, kind: 'door', rect: { x: at - ew / 2, z: d - 1.1, w: ew, h: 1.1 }, stand: { x: at, z: d - 0.65 }, to: { area: p.exit.to || id.slice(3), spawn: p.exit.spawn || `from_${ctx.area.id}` } });
      mb.box('cloth', at, 0.02, d - 0.7, ew * 0.8, 0.03, 0.6, { color: '#b2563f' });
      mb.box('cloth', at, 0.02, d - 0.7, ew * 0.8 - 0.16, 0.035, 0.44, { color: '#e8c9a0' });
      for (const sx of [-1, 1]) {
        mb.box('wood', at + sx * (ew / 2 + 0.15), 0, d + 0.02, 0.2, 1.1, 0.2, { color: '#8a5a34' });
        mb.ball('flat', at + sx * (ew / 2 + 0.15), 1.1, d + 0.02, 0.12, { color: PAL.brass, detail: 0 });
      }
      // daylight spilling in through the open front door
      const spill = new THREE.Mesh(new THREE.PlaneGeometry(ew * 1.6, 2.4), new THREE.MeshBasicMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0, color: '#ffe6b0' }));
      spill.rotation.x = -Math.PI / 2;
      spill.position.set(at, 0.05, d - 1.0);
      ctx.root.add(spill);
      ctx.updater((dt, t, env) => { spill.material.opacity = (1 - env.night) * 0.38; });
    }
  },
};

const furniture = (name, doc, fn) => ({ doc, build: (ctx, p) => fn(ctx, p, frame(ctx.mb, p.x, 0, p.z, dirRot[p.dir || 's'] ?? 0)) });

function reg(ctx, p, rect, def = {}) {
  const [x0, z0, x1, z1] = rect;
  ctx.solid(x0, z0, x1, z1, { tile: def.tile !== false });
  ctx.bake({ type: 'rect', x: x0 - 0.15, z: z0 - 0.1, w: x1 - x0 + 0.3, d: z1 - z0 + 0.3, a: 0.4, blur: 0.28 });
  ctx.interactable(p, def);
}

export const bed = furniture('bed', 'Bed. params: x,z (head-end centre),dir=s,w=1.9,color,id', (ctx, p, F) => {
  const w = p.w ?? 1.9, L = 3.0;
  const col = p.color || '#6f9bd0';
  F.box('wood', 0, 0, L / 2, w + 0.2, 0.35, L + 0.1, { color: '#8a5a34', tex: 1 });
  F.box('wood', 0, 0, -0.08, w + 0.24, 1.35, 0.14, { color: '#8a5a34', tex: 1 });
  F.box('wood', 0, 0, L + 0.04, w + 0.24, 0.7, 0.12, { color: '#8a5a34', tex: 1 });
  F.box('cloth', 0, 0.35, L / 2 + 0.05, w, 0.18, L - 0.1, { color: '#fff4e0' });
  F.box('cloth', 0, 0.45, L * 0.62, w + 0.02, 0.22, L * 0.72, { color: col, jitter: 0.03 });
  F.box('cloth', 0, 0.5, L * 0.3, w + 0.03, 0.16, 0.35, { color: '#fff4e0' });
  F.ball('cloth', -w * 0.22, 0.62, 0.45, 0.28, { color: '#fffaf0', detail: 1, sy: 0.55, sx: 1.2 });
  F.ball('cloth', w * 0.22, 0.62, 0.45, 0.28, { color: '#fff0f5', detail: 1, sy: 0.55, sx: 1.2 });
  const sw = (dirRot[p.dir || 's'] === Math.PI / 2 || dirRot[p.dir || 's'] === -Math.PI / 2);
  reg(ctx, p, sw ? [p.x - (p.dir === 'e' ? 0.1 : L), p.z - w / 2 - 0.1, p.x + (p.dir === 'e' ? L : 0.1), p.z + w / 2 + 0.1] : [p.x - w / 2 - 0.1, p.z - 0.1, p.x + w / 2 + 0.1, p.z + L + 0.1], { type: 'bed', x: p.x + (sw ? (p.dir === 'e' ? L + 0.8 : -L - 0.8) : 0), z: p.z + (sw ? 0 : L + 0.9), r: 1.4, label: 'Bed', text: 'A cosy bed with a patchwork quilt.' });
});

export const table = furniture('table', 'Table (round|rect). params: x,z,w=2,d=1.2,round,cloth', (ctx, p, F) => {
  const w = p.w ?? 2, d = p.d ?? 1.2;
  const mb = ctx.mb;
  if (p.round) {
    mb.cyl('wood', p.x, 0, p.z, 0.08, 0.14, 0.78, { seg: 8, color: '#8a5a34' });
    mb.cyl('wood', p.x, 0.76, p.z, w / 2, w / 2, 0.08, { seg: 18, color: '#c89258', tex: 1 });
    if (p.cloth) mb.cyl('cloth', p.x, 0.8, p.z, w / 2 + 0.05, w / 2 + 0.12, 0.03, { seg: 18, color: p.cloth });
    reg(ctx, p, [p.x - w / 2, p.z - w / 2, p.x + w / 2, p.z + w / 2], { r: 1.4, type: 'object', label: 'Table', text: 'A sturdy table.' });
  } else {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.box('wood', sx * (w / 2 - 0.12), 0, sz * (d / 2 - 0.12), 0.12, 0.78, 0.12, { color: '#7a5030' });
    F.box('wood', 0, 0.76, 0, w, 0.09, d, { color: '#c89258', tex: 1 });
    if (p.cloth) F.box('cloth', 0, 0.85, 0, w * 0.8, 0.02, d * 0.85, { color: p.cloth });
    reg(ctx, p, [p.x - w / 2, p.z - d / 2, p.x + w / 2, p.z + d / 2], { r: 1.5, type: 'object', label: 'Table', text: 'A sturdy wooden table.' });
  }
  // tableware
  mb.cyl('flat', p.x - 0.2, 0.85, p.z, 0.13, 0.1, 0.1, { seg: 8, color: '#fff' });
  mb.cyl('flat', p.x + 0.35, 0.85, p.z + 0.1, 0.1, 0.08, 0.09, { seg: 8, color: '#e8b0a0' });
  mb.ball('flat', p.x + 0.05, 0.92, p.z - 0.15, 0.09, { color: '#e04a3f', detail: 1 });
});

export const chair = furniture('chair', 'Chair. params: x,z,dir=s,color', (ctx, p, F) => {
  F.box('wood', 0, 0.42, 0, 0.52, 0.07, 0.5, { color: p.color || '#b9824f' });
  F.box('wood', 0, 0.45, -0.24, 0.52, 0.68, 0.06, { color: p.color || '#b9824f' });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.box('wood', sx * 0.22, 0, sz * 0.21, 0.06, 0.44, 0.06, { color: '#7a5030' });
  F.box('cloth', 0, 0.49, 0.0, 0.42, 0.06, 0.4, { color: '#d9a35a' });
  ctx.solidCircle(p.x, p.z, 0.28, { tile: false });
  ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.05, rx: 0.5, rz: 0.45, a: 0.3, blur: 0.2 });
});

export const stool = {
  doc: 'Stool. params: x,z',
  build(ctx, p) {
    ctx.mb.cyl('wood', p.x, 0, p.z, 0.22, 0.25, 0.45, { seg: 8, color: '#b9824f' });
    ctx.solidCircle(p.x, p.z, 0.25, { tile: false });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.03, rx: 0.4, rz: 0.35, a: 0.3, blur: 0.2 });
  },
};

export const bookshelf = furniture('bookshelf', 'Tall bookshelf against a wall. params: x,z (front centre),w=2.2,h=2.8,dir=s,id', (ctx, p, F) => {
  const w = p.w ?? 2.2, h = p.h ?? 2.8, d = 0.6;
  const rng = mulberry32(Math.floor(p.x * 7 + p.z * 3));
  F.box('wood', 0, 0, -d / 2, w, h, d, { color: '#8a5a34', tex: 1.2 });
  F.box('flat', 0, 0.1, -d / 2 + 0.08, w - 0.2, h - 0.2, 0.3, { color: '#3b2a1c' });
  const rows = Math.round((h - 0.2) / 0.6);
  const cols = ['#c9605a', '#5a8ac9', '#e0b24a', '#6aa86a', '#9a6ac0', '#d98a4a', '#f0e6d0', '#4a7a7a'];
  for (let r = 0; r < rows; r++) {
    const y = 0.12 + r * ((h - 0.3) / rows);
    F.box('wood', 0, y, -d / 2 + 0.03, w - 0.1, 0.07, d - 0.08, { color: '#a87444' });
    let x = -w / 2 + 0.16;
    while (x < w / 2 - 0.2) {
      const bw = 0.08 + rng() * 0.1, bh = 0.38 + rng() * 0.14;
      F.box('flat', x + bw / 2, y + 0.07, -d / 2 + 0.2, bw, bh, 0.26, { color: cols[(rng() * 8) | 0], rotZ: rng() < 0.08 ? 0.2 : 0 });
      x += bw + 0.01;
    }
  }
  F.box('wood', 0, h, -d / 2, w + 0.1, 0.1, d + 0.1, { color: '#7a4a28' });
  reg(ctx, p, [p.x - w / 2, p.z - d, p.x + w / 2, p.z], { type: 'bookshelf', x: p.x, z: p.z + 0.9, r: 1.3, label: 'Bookshelf', text: 'Rows of well-thumbed books.' });
});

export const shelf = {
  doc: 'Wall-mounted shelf with jars/books. params: x,y=1.9,w=2,z=0',
  build(ctx, p) {
    const mb = ctx.mb;
    const z = p.z ?? 0.25, y = p.y ?? 1.9, w = p.w ?? 2;
    const rng = mulberry32(Math.floor(p.x * 5));
    mb.box('wood', p.x, y, z, w, 0.07, 0.42, { color: '#a87444' });
    for (const sx of [-1, 1]) mb.box('wood', p.x + sx * (w / 2 - 0.15), y - 0.25, z - 0.12, 0.06, 0.28, 0.2, { color: '#7a5030' });
    let x = p.x - w / 2 + 0.2;
    while (x < p.x + w / 2 - 0.2) {
      const t = rng();
      if (t < 0.4) { mb.cyl('glass', x, y + 0.07, z, 0.1, 0.1, 0.26, { seg: 8, color: ['#ffd0a0', '#c8e8b0', '#ffc0c8'][(rng() * 3) | 0] }); mb.cyl('wood', x, y + 0.33, z, 0.08, 0.08, 0.05, { seg: 8, color: '#8a5a34' }); x += 0.28; }
      else if (t < 0.75) { mb.box('flat', x, y + 0.07, z, 0.08, 0.34, 0.24, { color: ['#c9605a', '#5a8ac9', '#e0b24a'][(rng() * 3) | 0] }); x += 0.12; }
      else { mb.cyl('flat', x, y + 0.07, z, 0.12, 0.09, 0.14, { seg: 8, color: '#f4ead4' }); x += 0.3; }
    }
  },
};

export const stove = furniture('stove', 'Iron stove with pipe. params: x,z (front centre),dir=s,id', (ctx, p, F) => {
  F.box('brick', 0, 0, -0.45, 1.5, 1.0, 0.9, { color: '#d9d2c8', tex: 1.2, ao: { k: 0.3, h: 0.5 } });
  F.box('metal', 0, 1.0, -0.45, 1.56, 0.1, 0.96, { color: '#2d2a30' });
  F.box('metal', 0, 0.35, -0.0, 0.7, 0.5, 0.06, { color: '#2d2a30' });
  F.box('glow', 0, 0.42, 0.04, 0.5, 0.32, 0.02, { color: '#ff8a3a' });
  for (const sx of [-0.45, 0.2]) { F.cyl('metal', sx, 1.1, -0.45, 0.2, 0.2, 0.06, { seg: 10, color: '#1f1c22' }); }
  F.cyl('metal', 0.45, 1.1, -0.7, 0.13, 0.13, 2.4, { seg: 8, color: '#2d2a30' });
  F.cyl('flat', -0.4, 1.12, -0.45, 0.16, 0.18, 0.2, { seg: 8, color: '#c9605a' });
  F.cyl('metal', -0.4, 1.32, -0.45, 0.16, 0.16, 0.04, { seg: 8, color: '#8a8a94' });
  reg(ctx, p, [p.x - 0.8, p.z - 0.95, p.x + 0.8, p.z], { type: 'object', x: p.x, z: p.z + 0.9, r: 1.3, label: 'Stove', text: 'The old stove keeps the cottage warm.' });
  lightGlow(ctx, p.x, 0.5, p.z + 0.1, 2.2, '#ff8a3a');
});

export const counter = furniture('counter', 'Shop/kitchen counter. params: x,z (centre-front),w=4,id', (ctx, p, F) => {
  const w = p.w ?? 4;
  F.box('wood', 0, 0, -0.4, w, 1.0, 0.8, { color: '#b9824f', tex: 1.2, ao: { k: 0.25, h: 0.5 } });
  F.box('wood', 0, 1.0, -0.4, w + 0.2, 0.1, 1.0, { color: '#d9a870', tex: 1.2 });
  for (let i = 0; i < Math.floor(w / 0.8); i++) F.box('wood', -w / 2 + 0.5 + i * 0.8, 0.12, 0.0, 0.7, 0.75, 0.04, { color: '#8a5a34' });
  reg(ctx, p, [p.x - w / 2, p.z - 0.9, p.x + w / 2, p.z + 0.1], { type: 'object', x: p.x, z: p.z + 0.9, r: 1.4, label: 'Counter' });
});

export const desk = furniture('desk', 'Writing desk with lamp/papers. params: x,z,dir=s,w=2.2,id', (ctx, p, F) => {
  const w = p.w ?? 2.2;
  F.box('wood', 0, 0.72, -0.4, w, 0.08, 0.9, { color: '#b9824f', tex: 1.2 });
  for (const sx of [-1, 1]) F.box('wood', sx * (w / 2 - 0.1), 0, -0.4, 0.5, 0.74, 0.8, { color: '#8a5a34' });
  F.box('wood', 0.4, 0.8, -0.5, 0.6, 0.04, 0.45, { color: '#fff4e0', rotY: 0.1 });
  F.box('flat', -0.5, 0.8, -0.35, 0.3, 0.05, 0.4, { color: '#6a8ac0', rotY: -0.2 });
  F.cyl('flat', -0.8, 0.8, -0.7, 0.07, 0.06, 0.13, { seg: 8, color: '#3a3a4a' });
  F.box('flat', -0.8, 0.9, -0.7, 0.02, 0.3, 0.02, { color: '#fff', rotZ: 0.2 });
  reg(ctx, p, [p.x - w / 2, p.z - 0.85, p.x + w / 2, p.z + 0.05], { type: 'diary', x: p.x, z: p.z + 0.9, r: 1.3, label: 'Desk', text: 'A desk covered in notes and a half-written letter.' });
});

export const chest = furniture('chest', 'Wooden chest. params: x,z,dir,id', (ctx, p, F) => {
  F.box('wood', 0, 0, 0, 1.2, 0.6, 0.75, { color: '#8a5a34', tex: 0.9, ao: { k: 0.3, h: 0.4 } });
  F.cyl('wood', 0, 0.6, 0, 0.375, 0.375, 1.2, { seg: 10, color: '#9a6a3e', rotZ: Math.PI / 2, sy: 0.55, sz: 1.0 });
  for (const sx of [-0.4, 0.4]) F.box('metal', sx, 0, 0.0, 0.1, 0.78, 0.8, { color: '#3a3844' });
  F.box('metal', 0, 0.45, 0.38, 0.14, 0.18, 0.05, { color: PAL.brass });
  reg(ctx, p, [p.x - 0.65, p.z - 0.4, p.x + 0.65, p.z + 0.4], { type: 'chest', x: p.x, z: p.z + 0.95, r: 1.2, label: 'Chest', text: 'A sturdy wooden chest.' });
});

export const cupboard = furniture('cupboard', 'Cupboard / dresser. params: x,z (front centre),w=1.8,h=2.2,dir', (ctx, p, F) => {
  const w = p.w ?? 1.8, h = p.h ?? 2.2;
  F.box('wood', 0, 0, -0.3, w, h, 0.6, { color: p.color || '#c4915a', tex: 1.2, ao: { k: 0.25, h: 0.6 } });
  F.box('wood', 0, 0.06, 0.02, w / 2 - 0.08, h * 0.5, 0.04, { color: '#a87444', rotY: 0 });
  for (const sx of [-1, 1]) { F.box('wood', sx * (w / 4), 0.1, 0.02, w / 2 - 0.1, h * 0.46, 0.04, { color: '#a87444' }); F.ball('flat', sx * 0.1 * 0.5 + sx * 0.1, h * 0.28, 0.06, 0.05, { color: PAL.brass, detail: 0 }); }
  F.box('wood', 0, h * 0.58, 0.0, w - 0.1, 0.05, 0.5, { color: '#d9a870' });
  F.box('flat', -w * 0.25, h * 0.6, -0.2, 0.3, 0.3, 0.3, { color: '#fff4e0' });
  F.cyl('flat', w * 0.2, h * 0.6, -0.2, 0.14, 0.12, 0.3, { seg: 8, color: '#8fb8d0' });
  reg(ctx, p, [p.x - w / 2, p.z - 0.6, p.x + w / 2, p.z], { type: 'object', x: p.x, z: p.z + 0.9, r: 1.3, label: 'Cupboard', text: 'Plates and jars are neatly arranged.' });
});

export const plant = {
  doc: 'Potted plant. params: x,z,scale,kind: fern|flower',
  build(ctx, p) {
    const s = p.scale ?? 1;
    ctx.mb.cyl('flat', p.x, 0, p.z, 0.26 * s, 0.19 * s, 0.4 * s, { seg: 8, color: '#c9704a' });
    ctx.mb.cyl('flat', p.x, 0.38 * s, p.z, 0.28 * s, 0.28 * s, 0.06 * s, { seg: 8, color: '#d9805a' });
    const rng = mulberry32(Math.floor(p.x * 9 + p.z));
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * 6.28;
      ctx.mb.ball('leaf_leaf', p.x + Math.cos(a) * 0.2 * s, (0.8 + rng() * 0.3) * s, p.z + Math.sin(a) * 0.2 * s, 0.28 * s, { lump: 0.2, detail: 1, seed: i, sy: 1.3, tone: rng(), color: '#ffffff', sway: 0.04, swayH: 1 });
    }
    if (p.kind === 'flower') ctx.mb.ball('flat', p.x, 1.35 * s, p.z, 0.12 * s, { color: '#ff7fa3', detail: 1 });
    ctx.solidCircle(p.x, p.z, 0.26 * s, { tile: false });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.04, rx: 0.5 * s, rz: 0.42 * s, a: 0.3, blur: 0.25 });
  },
};

export const lamp_table = {
  doc: 'Table/floor lamp with warm glow. params: x,z,y=0 (table height),floor=false',
  build(ctx, p) {
    const mb = ctx.mb;
    const y = p.y ?? 0;
    if (p.floor) {
      mb.cyl('wood', p.x, 0, p.z, 0.2, 0.25, 0.08, { seg: 8, color: '#6a4a32' });
      mb.cyl('metal', p.x, 0.05, p.z, 0.03, 0.03, 1.3, { seg: 5, color: PAL.brass });
      mb.cone('cloth', p.x, 1.25, p.z, 0.3, 0.4, { seg: 8, color: '#ffe0a8' });
      mb.cyl('glass', p.x, 1.3, p.z, 0.2, 0.22, 0.3, { seg: 8, color: '#ffffff' });
      ctx.solidCircle(p.x, p.z, 0.2, { tile: false });
      lightGlow(ctx, p.x, 1.4, p.z, 3.4);
    } else {
      mb.cyl('metal', p.x, y, p.z, 0.1, 0.12, 0.07, { seg: 8, color: PAL.brass });
      mb.cyl('glass', p.x, y + 0.07, p.z, 0.1, 0.12, 0.24, { seg: 8, color: '#ffffff' });
      mb.cone('cloth', p.x, y + 0.28, p.z, 0.19, 0.17, { seg: 8, color: '#ffd89a' });
      lightGlow(ctx, p.x, y + 0.3, p.z, 2.4);
    }
  },
};

export const rug = {
  doc: 'Floor rug painted into the ground. params: rect:[x,z,w,h],style:floral|striped|round,colors:[3 css]',
  build(ctx, p) {
    ctx.bake({ type: 'rug', rug: { rect: p.rect, style: p.style, colors: p.colors }, seed: Math.floor(p.rect[0] * 7 + p.rect[1]) });
  },
};

export const clock_wall = {
  doc: 'Wall pendulum clock (back wall). params: x,y=2.0',
  build(ctx, p) {
    const mb = ctx.mb;
    const y = p.y ?? 1.9;
    mb.box('wood', p.x, y, 0.18, 0.6, 1.5, 0.22, { color: '#7a4a28', tex: 0.8 });
    mb.cone('wood', p.x, y + 1.5, 0.18, 0.4, 0.3, { seg: 4, color: '#7a4a28', rotY: Math.PI / 4 });
    mb.box('trim', p.x, y + 0.85, 0.3, 0.42, 0.42, 0.04, { color: '#fff4de' });
    mb.box('flat', p.x, y + 1.0, 0.33, 0.02, 0.12, 0.01, { color: '#222' });
    mb.box('flat', p.x + 0.04, y + 1.02, 0.33, 0.1, 0.02, 0.01, { color: '#222' });
    mb.cyl('metal', p.x, y + 0.2, 0.3, 0.03, 0.03, 0.4, { seg: 4, color: PAL.brass });
    mb.ball('metal', p.x, y + 0.18, 0.3, 0.08, { color: PAL.brass, detail: 0 });
    ctx.interactable(p, { type: 'object', x: p.x, z: 1.3, r: 1.2, label: 'Clock', text: 'The clock ticks softly.' });
  },
};

export const calendar = {
  doc: 'Wall calendar. params: x,y=2.0,id',
  build(ctx, p) {
    const mb = ctx.mb;
    const y = p.y ?? 2.0;
    const key = signMat(ctx, 'Calendar', { w: 128, h: 160, bg: '#fff6e0', fg: '#8a3a2a', font: 'bold 24px "Trebuchet MS", sans-serif' });
    mb.add(key, new THREE.PlaneGeometry(0.7, 0.9), { matrix: placeMatrix(p.x, y + 0.45, 0.15, {}) });
    mb.box('wood', p.x, y + 0.9, 0.12, 0.76, 0.06, 0.05, { color: '#7a4a28' });
    ctx.interactable(p, { type: 'object', x: p.x, z: 1.2, r: 1.3, label: 'Calendar', text: 'A calendar with the days crossed off in pencil.' });
  },
};

export const painting = {
  doc: 'Framed picture on the back wall. params: x,y=2.2,w=1.2,h=0.9,kind: landscape|lamp',
  build(ctx, p) {
    const w = p.w ?? 1.2, h = p.h ?? 0.9, y = p.y ?? 2.2;
    const key = `paint_${p.kind || 'landscape'}`;
    if (!ctx.mats[key]) {
      const c = makeCanvas(128, 96);
      const g = c.getContext('2d');
      const sky = g.createLinearGradient(0, 0, 0, 96);
      sky.addColorStop(0, '#9fd8ff'); sky.addColorStop(0.6, '#ffe0b0'); sky.addColorStop(1, '#8fd16a');
      g.fillStyle = sky; g.fillRect(0, 0, 128, 96);
      g.fillStyle = '#5f9a6a'; g.beginPath(); g.moveTo(0, 70); g.quadraticCurveTo(40, 40, 80, 66); g.quadraticCurveTo(110, 50, 128, 62); g.lineTo(128, 96); g.lineTo(0, 96); g.fill();
      g.fillStyle = '#e8a050'; g.beginPath(); g.arc(98, 28, 10, 0, 6.3); g.fill();
      g.fillStyle = '#c9605a'; g.fillRect(30, 62, 18, 14); g.fillStyle = '#7a4a28'; g.beginPath(); g.moveTo(27, 62); g.lineTo(39, 52); g.lineTo(51, 62); g.fill();
      ctx.mats[key] = new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c), vertexColors: true });
      ctx.mats[key].map.colorSpace = THREE.SRGBColorSpace;
      ctx.s.meta[key] = { cast: false, receive: true };
    }
    ctx.mb.box('wood', p.x, y, 0.1, w + 0.2, h + 0.2, 0.08, { color: '#8a5a34' });
    ctx.mb.add(key, new THREE.PlaneGeometry(w, h), { matrix: placeMatrix(p.x, y + 0.1 + h / 2, 0.15, {}) });
  },
};

export const window_seat = furniture('window_seat', 'Cushioned bench under a window. params: x,z (front centre),w=3', (ctx, p, F) => {
  const w = p.w ?? 3;
  F.box('wood', 0, 0, -0.35, w, 0.55, 0.7, { color: '#c4915a', tex: 1.2, ao: { k: 0.25, h: 0.4 } });
  F.box('cloth', 0, 0.55, -0.35, w - 0.1, 0.14, 0.62, { color: p.color || '#8fb4d9' });
  for (const sx of [-1, 1]) F.ball('cloth', sx * (w / 2 - 0.3), 0.8, -0.45, 0.25, { color: sx > 0 ? '#ffd0a0' : '#ffc0c8', detail: 1, sy: 0.7 });
  reg(ctx, p, [p.x - w / 2, p.z - 0.7, p.x + w / 2, p.z], { type: 'bench', x: p.x, z: p.z + 0.8, r: 1.4, label: 'Window seat', text: 'A sunny spot to sit and think.', facing: 'n' });
});

export const fireplace = furniture('fireplace', 'Stone fireplace with flicker. params: x,z (front centre),w=2.6', (ctx, p, F) => {
  const w = p.w ?? 2.6;
  F.box('stone', 0, 0, -0.45, w, 2.0, 0.9, { color: '#cfc7b8', tex: 1.4, ao: { k: 0.3, h: 0.8 } });
  F.box('flat', 0, 0.12, 0.0, w * 0.55, 1.0, 0.1, { color: '#1e1614' });
  F.box('wood', 0, 2.0, -0.45, w + 0.3, 0.14, 1.1, { color: '#7a4a28' });
  F.box('glow', 0, 0.2, 0.0, w * 0.4, 0.5, 0.04, { color: '#ff8a3a' });
  F.box('glow', 0.1, 0.3, 0.02, w * 0.2, 0.55, 0.03, { color: '#ffd05a' });
  reg(ctx, p, [p.x - w / 2, p.z - 0.9, p.x + w / 2, p.z], { type: 'object', x: p.x, z: p.z + 1.0, r: 1.4, label: 'Hearth', text: 'The fire crackles warmly.' });
  lightGlow(ctx, p.x, 0.6, p.z + 0.1, 4.0, '#ff8a3a');
});

export const hanging_herbs = {
  doc: 'Bunch of herbs/onions hanging from a beam. params: x,z,y=3.0',
  build(ctx, p) {
    const rng = mulberry32(Math.floor(p.x * 3 + p.z));
    for (let i = 0; i < 4; i++) {
      const x = p.x + (i - 1.5) * 0.28;
      ctx.mb.cyl('flat', x, (p.y ?? 3.0) - 0.6, p.z, 0.015, 0.015, 0.6, { seg: 4, color: '#6a5a4a' });
      ctx.mb.ball('leaf_leaf', x, (p.y ?? 3.0) - 0.75, p.z, 0.15, { lump: 0.3, detail: 1, seed: i, sy: 1.4, tone: rng(), color: '#ffffff', sway: 0.03, swayH: 0.3 });
    }
    ctx.mb.cyl('wooddark', p.x, p.y ?? 3.0, p.z, 0.04, 0.04, 1.4, { seg: 5, color: '#6a4a32', rotZ: Math.PI / 2 });
  },
};

export const rack = {
  doc: 'Coat/tool rack on the back wall. params: x,y=1.7',
  build(ctx, p) {
    ctx.mb.box('wood', p.x, p.y ?? 1.7, 0.1, 1.4, 0.1, 0.08, { color: '#7a4a28' });
    const cols = ['#c9605a', '#5a8ac9', '#e0b24a'];
    for (let i = 0; i < 3; i++) {
      ctx.mb.ball('flat', p.x - 0.5 + i * 0.5, (p.y ?? 1.7) + 0.1, 0.15, 0.04, { color: PAL.brass, detail: 0 });
      ctx.mb.box('cloth', p.x - 0.5 + i * 0.5, (p.y ?? 1.7) - 0.8, 0.2, 0.34, 0.9, 0.12, { color: cols[i] });
    }
  },
};
