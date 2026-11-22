/**
 * Extra interior/diorama props for the wave-2 areas (library, inn, workshop, observatory, fishing hut, town hall, clinic):
 * hanging lamps, sconces, ladder, staircase, telescope, wall items, workbench, lantern rack, tackle wall, ledger stand,
 * map table, globe, garland, gifts. Same conventions as interior.js (floor coords, `dir` = facing).
 */
import * as THREE from 'three';
import { mulberry32 } from '../../core/util.js';
import { PAL, frame, cachedMat } from './util.js';
import { makeCanvas } from '../textures.js';
import { placeMatrix } from '../geo.js';

const dirRot = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };

function glow(ctx, x, y, z, size, color = '#ffb468', flicker = 0.04, pool = true) {
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.6, color }));
  halo.scale.set(size, size, 1);
  halo.position.set(x, y, z);
  ctx.root.add(halo);
  let p = null;
  if (pool) {
    p = new THREE.Mesh(new THREE.PlaneGeometry(size * 1.6, size * 1.6), new THREE.MeshBasicMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.3, color }));
    p.rotation.x = -Math.PI / 2;
    p.position.set(x, 0.05, z + 0.3);
    p.renderOrder = 3;
    ctx.root.add(p);
  }
  ctx.updater((dt, t, env) => {
    const k = 0.55 + env.night * 0.45;
    halo.material.opacity = 0.4 * k * (1 - flicker + Math.sin(t * 5.3 + x * 3 + z) * flicker);
    if (p) p.material.opacity = 0.22 * k;
  });
}

function reg(ctx, p, rect, def = {}) {
  const [x0, z0, x1, z1] = rect;
  ctx.solid(x0, z0, x1, z1, { tile: def.tile !== false });
  ctx.bake({ type: 'rect', x: x0 - 0.12, z: z0 - 0.08, w: x1 - x0 + 0.24, d: z1 - z0 + 0.26, a: 0.38, blur: 0.26 });
  if (p.id) ctx.interactable(p, def);
}

const furn = (doc, fn) => ({ doc, build: (ctx, p) => fn(ctx, p, frame(ctx.mb, p.x, 0, p.z, dirRot[p.dir || 's'] ?? 0)) });

export const hanging_lamp = {
  doc: 'Glowing lantern on a chain (from out of frame). params: x,z,y=3.0 (lamp height),color,len=1.4,size=1',
  build(ctx, p) {
    const mb = ctx.mb, y = p.y ?? 3.0, s = p.size ?? 1, col = p.color || '#ffd28a';
    mb.cyl('metal', p.x, y + 0.5 * s, p.z, 0.012, 0.012, p.len ?? 1.4, { seg: 3, color: '#3a3640' });
    mb.cone('metal', p.x, y + 0.4 * s, p.z, 0.2 * s, 0.13 * s, { seg: 6, color: '#8a6a2a' });
    mb.cyl('glow', p.x, y - 0.02 * s, p.z, 0.15 * s, 0.12 * s, 0.42 * s, { seg: 6, color: col });
    mb.cyl('metal', p.x, y - 0.06 * s, p.z, 0.17 * s, 0.1 * s, 0.06 * s, { seg: 6, color: '#8a6a2a' });
    glow(ctx, p.x, y + 0.2 * s, p.z, 3.4 * s, col, 0.05, false);
  },
};

export const wall_sconce = {
  doc: 'Wall candle sconce on the back wall. params: x,y=2.1,color',
  build(ctx, p) {
    const mb = ctx.mb, y = p.y ?? 2.1;
    mb.box('metal', p.x, y, 0.12, 0.12, 0.2, 0.08, { color: PAL.brass });
    mb.box('metal', p.x, y + 0.04, 0.22, 0.04, 0.04, 0.22, { color: PAL.brass });
    mb.cyl('flat', p.x, y + 0.08, 0.34, 0.05, 0.05, 0.18, { seg: 6, color: '#fff4d8' });
    mb.ball('glow', p.x, y + 0.3, 0.34, 0.05, { color: '#ffd878', detail: 0, sy: 1.5 });
    glow(ctx, p.x, y + 0.3, 0.45, 1.9, p.color || '#ffc878', 0.08, false);
  },
};

export const ladder = furn('Leaning ladder (rolls on a rail). params: x,z (foot),dir=s,h=2.8,w=0.6,color', (ctx, p, F) => {
  const h = p.h ?? 2.8, w = p.w ?? 0.6, col = p.color || '#a8743f';
  const lean = 0.2;
  for (const sx of [-1, 1]) F.box('wood', sx * w / 2, 0, 0, 0.07, h, 0.07, { color: col, rotX: -lean });
  const n = Math.floor(h / 0.38);
  for (let i = 0; i < n; i++) { const y = 0.3 + i * 0.38; F.box('wood', 0, y, -y * Math.tan(lean) + 0.02, w, 0.05, 0.06, { color: '#8a5a34' }); }
  F.cyl('metal', -w / 2 - 0.03, h - 0.1, -h * Math.tan(lean) - 0.02, 0.05, 0.05, 0.12, { seg: 6, color: '#35323d', rotZ: Math.PI / 2 });
  ctx.solid(p.x - w / 2 - 0.1, p.z - 0.15, p.x + w / 2 + 0.1, p.z + 0.15, { tile: false });
  ctx.bake({ type: 'rect', x: p.x - w / 2 - 0.1, z: p.z - 0.4, w: w + 0.2, d: 0.7, a: 0.25, blur: 0.2 });
});

export const stairs = {
  doc: 'Staircase climbing along the back wall out of frame. params: x,z (front edge, first step), dir:"e"|"w" climb direction, n=9, run=0.44, rise=0.32, d=1.4, color, rail=true',
  build(ctx, p) {
    const mb = ctx.mb, n = p.n ?? 9, run = p.run ?? 0.44, rise = p.rise ?? 0.32, d = p.d ?? 1.4, col = p.color || '#b9824f';
    const sg = p.dir === 'w' ? -1 : 1;
    for (let i = 0; i < n; i++) {
      const cx = p.x + sg * (i + 0.5) * run;
      mb.box('wood', cx, 0, p.z - d / 2, run, (i + 1) * rise, d, { color: col, tex: 1.2, ao: { k: 0.2, h: 0.5 } });
      mb.box('wood', cx, (i + 1) * rise - 0.01, p.z - d / 2 + 0.02, run + 0.01, 0.045, d + 0.08, { color: '#d9a870' });
    }
    const L = n * run, H = n * rise;
    const x0 = p.x, x1 = p.x + sg * L;
    mb.box('wooddark', (x0 + x1) / 2, 0, p.z + 0.02, L, 0.2, 0.06, { color: '#6a4528' });
    if (p.rail !== false) {
      for (let i = 0; i <= n; i += 2) {
        const px = p.x + sg * i * run;
        mb.cyl('wood', px, i * rise, p.z + 0.08, 0.035, 0.035, 0.95, { seg: 5, color: '#7a4a28' });
      }
      const ang = Math.atan2(H, L);
      const len = Math.hypot(L, H);
      mb.box('wood', (x0 + x1) / 2, H / 2 + 0.95, p.z + 0.08, len, 0.07, 0.09, { color: '#6a4528', rotZ: sg * ang });
    }
    ctx.solid(Math.min(x0, x1), p.z - d, Math.max(x0, x1), p.z, { tile: true });
    ctx.bake({ type: 'rect', x: Math.min(x0, x1) - 0.1, z: p.z - d, w: L + 0.2, d: d + 0.45, a: 0.4, blur: 0.3 });
    if (p.id) ctx.interactable(p, { type: 'object', x: p.x - sg * 0.7, z: p.z + 0.8, r: 1.4, label: 'Stairs', text: 'The stairs creak invitingly.' });
  },
};

export const telescope = furn('Brass telescope on a tripod. params: x,z,dir=s,scale=1,big=false,id', (ctx, p, F) => {
  const s = (p.scale ?? 1) * (p.big ? 1.45 : 1);
  const br = PAL.brass;
  const piv = 1.25 * s, th = 1.0, dy = Math.cos(th), dz = -Math.sin(th), Lt = 1.9 * s;
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * 6.283 + 0.5;
    const dx = Math.cos(a) * 0.62 * s, dzz = Math.sin(a) * 0.62 * s, len = Math.hypot(dx, dzz, piv);
    F.cyl('wood', dx / 2, piv / 2 - len / 2, dzz / 2, 0.028 * s, 0.036 * s, len, { seg: 5, color: '#7a4a28', rotZ: Math.atan2(dx, piv), rotX: -Math.atan2(dzz, piv) });
    F.ball('metal', dx, 0.03, dzz, 0.045 * s, { color: '#3a3640', detail: 0 });
  }
  F.cyl('metal', 0, piv - 0.14 * s, 0, 0.1 * s, 0.12 * s, 0.2 * s, { seg: 8, color: br });
  const cc = (Lt / 2 - 0.45 * s);
  F.cyl('metal', 0, piv + cc * dy - Lt / 2, cc * dz, 0.13 * s, 0.09 * s, Lt, { seg: 10, color: br, rotX: -th });
  const tipC = (Lt - 0.45 * s);
  F.cyl('metal', 0, piv + tipC * dy - 0.1 * s, tipC * dz, 0.15 * s, 0.15 * s, 0.2 * s, { seg: 10, color: '#8a6a2a', rotX: -th });
  const eb = -0.45 * s - 0.2 * s;
  F.cyl('metal', 0, piv + eb * dy - 0.18 * s, eb * dz, 0.045 * s, 0.045 * s, 0.36 * s, { seg: 8, color: '#3a3640', rotX: -th });
  const fc = 0.5 * s;
  F.cyl('metal', 0.14 * s, piv + fc * dy - 0.3 * s, fc * dz, 0.04 * s, 0.04 * s, 0.6 * s, { seg: 6, color: '#8a6a2a', rotX: -th });
  F.cyl('metal', 0, piv - 0.02, 0, 0.16 * s, 0.16 * s, 0.05 * s, { seg: 10, color: '#8a6a2a' });
  ctx.solidCircle(p.x, p.z, 0.42 * s, { tile: false });
  ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: 0.8 * s, rz: 0.7 * s, a: 0.3, blur: 0.3 });
  if (p.id) ctx.interactable(p, { type: 'telescope', x: p.x, z: p.z + 0.95, r: 1.4, label: 'Telescope', text: 'A brass telescope pointed at the sky.', facing: 'n' });
});

export const globe = {
  doc: 'Standing globe. params: x,z,scale',
  build(ctx, p) {
    const s = p.scale ?? 1;
    ctx.mb.cyl('wood', p.x, 0, p.z, 0.2 * s, 0.26 * s, 0.1 * s, { seg: 8, color: '#6a4528' });
    ctx.mb.cyl('wood', p.x, 0.1 * s, p.z, 0.04 * s, 0.04 * s, 0.7 * s, { seg: 5, color: '#6a4528' });
    ctx.mb.ball('flat', p.x, 1.05 * s, p.z, 0.34 * s, { color: '#6fb0d8', detail: 1 });
    ctx.mb.ball('flat', p.x - 0.07 * s, 1.1 * s, p.z + 0.14 * s, 0.22 * s, { color: '#8fc07a', detail: 1, sy: 0.8 });
    ctx.mb.ball('flat', p.x + 0.15 * s, 0.95 * s, p.z - 0.2 * s, 0.16 * s, { color: '#d9b36a', detail: 1 });
    ctx.mb.cyl('metal', p.x, 0.62 * s, p.z, 0.4 * s, 0.4 * s, 0.025 * s, { seg: 14, color: PAL.brass, rotZ: 0.4 });
    ctx.solidCircle(p.x, p.z, 0.28 * s, { tile: false });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.04, rx: 0.5 * s, rz: 0.42 * s, a: 0.3, blur: 0.22 });
  },
};

function skyCanvas() {
  const c = makeCanvas(128, 192);
  const g = c.getContext('2d');
  const grd = g.createLinearGradient(0, 0, 0, 192);
  grd.addColorStop(0, '#0e1a44'); grd.addColorStop(0.6, '#2a2f78'); grd.addColorStop(1, '#6a4a8a');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 192);
  const r = mulberry32(7);
  for (let i = 0; i < 46; i++) { g.fillStyle = `rgba(255,248,210,${0.5 + r() * 0.5})`; const q = 1 + (r() * 2.2) | 0; g.fillRect(r() * 126, r() * 190, q, q); }
  g.fillStyle = '#fff3c0'; g.beginPath(); g.arc(88, 44, 9, 0, 6.3); g.fill();
  g.fillStyle = '#0e1a44'; g.beginPath(); g.arc(94, 41, 8, 0, 6.3); g.fill();
  return c;
}
function mapCanvas(kind) {
  const c = makeCanvas(160, 120);
  const g = c.getContext('2d');
  const r = mulberry32(kind.length * 13 + 5);
  if (kind === 'stars') {
    g.fillStyle = '#152256'; g.fillRect(0, 0, 160, 120);
    g.strokeStyle = 'rgba(255,230,160,0.7)'; g.lineWidth = 1.4;
    const pts = [];
    for (let i = 0; i < 16; i++) pts.push([10 + r() * 140, 8 + r() * 104]);
    g.beginPath(); pts.slice(0, 9).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    g.beginPath(); pts.slice(9).forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
    for (const [x, y] of pts) { g.fillStyle = '#fff3c0'; g.beginPath(); g.arc(x, y, 2.4, 0, 6.3); g.fill(); }
    g.strokeStyle = 'rgba(255,230,160,0.35)'; g.beginPath(); g.arc(80, 60, 50, 0, 6.3); g.stroke();
  } else if (kind === 'chart') {
    g.fillStyle = '#e9d9b0'; g.fillRect(0, 0, 160, 120);
    g.strokeStyle = '#6a8aa8'; g.lineWidth = 1;
    for (let i = 1; i < 8; i++) { g.beginPath(); g.moveTo(i * 20, 0); g.lineTo(i * 20, 120); g.stroke(); }
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(0, i * 20); g.lineTo(160, i * 20); g.stroke(); }
    g.fillStyle = '#b8c88a'; g.beginPath(); g.moveTo(60, 20); g.quadraticCurveTo(110, 30, 120, 70); g.quadraticCurveTo(90, 100, 50, 85); g.quadraticCurveTo(30, 50, 60, 20); g.fill();
    g.strokeStyle = '#9a4a3a'; g.setLineDash([4, 3]); g.beginPath(); g.moveTo(10, 100); g.quadraticCurveTo(70, 60, 140, 20); g.stroke();
  } else { // parchment
    g.fillStyle = '#efe0b8'; g.fillRect(0, 0, 160, 120);
    g.fillStyle = '#8a6a4a'; for (let i = 0; i < 9; i++) g.fillRect(14, 14 + i * 11, 40 + r() * 90, 3);
  }
  return c;
}
function imageItem(ctx, key, makeFn, x, y, w, h, frameCol = '#6a4528', z = 0.1) {
  const mk = cachedMat(ctx, key, makeFn, {});
  ctx.mb.box('wood', x, y, z, w + 0.2, h + 0.2, 0.08, { color: frameCol });
  ctx.mb.add(mk, new THREE.PlaneGeometry(w, h), { matrix: placeMatrix(x, y + 0.1 + h / 2, z + 0.05, {}) });
}

export const wall_item = {
  doc: 'Back-wall decoration. params: x,y,w,h,kind:"sky"|"stars"|"chart"|"fish"|"net"|"tools"|"flag"|"hooks"|"antlers"|"shield"|"clock", id',
  build(ctx, p) {
    const mb = ctx.mb, k = p.kind, x = p.x, y = p.y ?? 1.6, rng = mulberry32(Math.floor(x * 11 + y * 3));
    let def = { x, z: 1.3, r: 1.3 };
    if (k === 'sky') {
      const w = p.w ?? 1.6, h = p.h ?? 2.4;
      mb.box('wooddark', x, y - 0.12, 0.05, w + 0.5, h + 0.55, 0.1, { color: '#6a4a2a' });
      const mk = cachedMat(ctx, 'sky_slit', skyCanvas, {});
      mb.add(mk, new THREE.PlaneGeometry(w, h), { matrix: placeMatrix(x, y + h / 2, 0.11, {}) });
      for (const sx of [-1, 1]) mb.box('metal', x + sx * (w / 2 + 0.02), y, 0.14, 0.07, h, 0.1, { color: PAL.brass });
      for (let i = 1; i < 4; i++) mb.box('metal', x, y + (h * i) / 4, 0.14, w, 0.04, 0.05, { color: PAL.brass });
      mb.box('metal', x, y + h - 0.02, 0.14, 0.05, 0.4, 0.05, { color: PAL.brass });
    } else if (k === 'stars' || k === 'chart') {
      const w = p.w ?? 1.5, h = p.h ?? 1.1;
      imageItem(ctx, `map_${k}`, () => mapCanvas(k), x, y, w, h, '#4a3220');
    } else if (k === 'fish') { // mounted trophy fish
      const col = p.color || '#7ab0c8';
      mb.box('wood', x, y - 0.05, 0.1, 1.5, 0.12, 0.1, { color: '#6a4528' });
      mb.ball('flat', x, y + 0.45, 0.22, 0.36, { color: col, detail: 1, sx: 1.9, sy: 0.62, sz: 0.42 });
      mb.ball('flat', x, y + 0.34, 0.24, 0.3, { color: '#f0e8d0', detail: 1, sx: 1.6, sy: 0.28, sz: 0.36 });
      mb.tri('flat', x + 0.84, y + 0.29, 0.22, 0.4, 0.36, { color: '#e89a6a', rotZ: Math.PI / 2, rotY: 0 });
      mb.ball('flat', x - 0.5, y + 0.52, 0.42, 0.04, { color: '#222', detail: 0 });
      def = { x, z: 1.3, r: 1.3, label: 'Mounted fish', text: 'A trophy fish, glassy-eyed and proud.' };
    } else if (k === 'net') {
      const w = p.w ?? 1.8, h = p.h ?? 1.5;
      mb.box('wood', x, y + h, 0.1, w + 0.3, 0.08, 0.08, { color: '#6a4528' });
      for (let i = 0; i < 8; i++) mb.box('cloth', x - w / 2 + (i * w) / 7, y, 0.14, 0.025, h, 0.03, { color: '#c9b890', rotZ: (i % 2 ? 1 : -1) * 0.12 });
      for (let j = 0; j < 6; j++) mb.box('cloth', x, y + (j * h) / 5, 0.16, w, 0.025, 0.03, { color: '#b8a880' });
      for (let i = 0; i < 4; i++) mb.ball('flat', x - w / 2 + 0.3 + i * (w / 4), y + 0.2 + rng() * 0.6, 0.2, 0.08, { color: ['#e8645a', '#f4d27a', '#e8645a', '#fff'][i], detail: 1 });
    } else if (k === 'tools') {
      const w = p.w ?? 2.4;
      mb.box('wood', x, y - 0.1, 0.08, w, 1.3, 0.06, { color: '#8a6a44', tex: 1 });
      const cols = ['#b8bcc8', '#c9704a', '#9aa0b0', '#e0b24a'];
      for (let i = 0; i < 6; i++) {
        const tx = x - w / 2 + 0.25 + i * ((w - 0.5) / 5);
        mb.box('wood', tx, y + 0.1, 0.16, 0.06, 0.62 + rng() * 0.3, 0.05, { color: '#7a4a28' });
        mb.box('metal', tx, y + 0.72 + rng() * 0.2, 0.17, 0.2, 0.14, 0.05, { color: cols[i % 4] });
      }
      mb.cyl('metal', x - w / 2 + 0.5, y + 0.88, 0.18, 0.2, 0.2, 0.04, { seg: 10, color: '#8a8e9c', rotX: Math.PI / 2 });
      mb.box('flat', x + 0.3, y + 0.15, 0.22, 0.5, 0.2, 0.12, { color: '#c9605a' });
      def = { x, z: 1.3, r: 1.4, label: 'Tool wall', text: 'Every tool hangs on its own hook, outlined in chalk.' };
    } else if (k === 'hooks') {
      mb.box('wood', x, y, 0.1, p.w ?? 1.6, 0.14, 0.08, { color: '#6a4528' });
      for (let i = 0; i < 4; i++) { mb.ball('flat', x - 0.55 + i * 0.37, y + 0.14, 0.17, 0.035, { color: PAL.brass, detail: 0 }); mb.box('cloth', x - 0.55 + i * 0.37, y - 0.7, 0.19, 0.3, 0.8, 0.1, { color: ['#7ab0c8', '#e0b24a', '#c9605a', '#6aa86a'][i] }); }
    } else if (k === 'flag') {
      const w = p.w ?? 1.4, h = p.h ?? 1.8, col = p.color || '#d9534a';
      mb.cyl('wooddark', x, y + h + 0.1, 0.2, 0.04, 0.04, w + 0.5, { seg: 5, color: '#6a4528', rotZ: Math.PI / 2 });
      mb.ball('flat', x - w / 2 - 0.3, y + h + 0.1, 0.2, 0.07, { color: PAL.brass, detail: 0 });
      mb.ball('flat', x + w / 2 + 0.3, y + h + 0.1, 0.2, 0.07, { color: PAL.brass, detail: 0 });
      mb.box('cloth', x, y, 0.2, w, h, 0.05, { color: col, jitter: 0.03 });
      mb.box('flat', x, y + h * 0.4, 0.23, w * 0.55, h * 0.06, 0.02, { color: '#fff4d8' });
      mb.ball('glow', x, y + h * 0.62, 0.24, 0.16, { color: '#ffd878', detail: 1, sz: 0.2 });
      mb.cone('cloth', x, y - 0.18, 0.2, 0.1, 0.18, { seg: 4, color: PAL.brass, rotX: Math.PI });
      def = { x, z: 1.4, r: 1.4, label: 'Town flag', text: 'The Lamplight Valley flag: a golden lantern on red.' };
    } else if (k === 'antlers') {
      mb.box('wood', x, y, 0.1, 0.5, 0.4, 0.1, { color: '#7a4a28' });
      for (const sx of [-1, 1]) { mb.box('flat', x + sx * 0.4, y + 0.3, 0.16, 0.05, 0.55, 0.05, { color: '#e8dcc0', rotZ: sx * -0.5 }); mb.box('flat', x + sx * 0.6, y + 0.55, 0.16, 0.04, 0.3, 0.04, { color: '#e8dcc0', rotZ: sx * 0.3 }); }
    } else if (k === 'door') { // interior doorway on the back wall (kitchen / back room), ajar with a warm glow
      const w = p.w ?? 1.3, h = p.h ?? 2.3, col = p.color || '#8a5230', y0 = p.y ?? 0;
      mb.box('flat', x, y0, 0.04, w, h, 0.08, { color: '#2a1c14' });
      mb.box('flat', x, y0, 0.07, w - 0.2, h - 0.15, 0.04, { color: p.glowColor || '#ffcf86' });
      for (const sx of [-1, 1]) mb.box('wood', x + sx * (w / 2 + 0.06), y0, 0.1, 0.14, h + 0.12, 0.16, { color: '#5a3a24' });
      mb.box('wood', x, y0 + h, 0.1, w + 0.38, 0.16, 0.18, { color: '#5a3a24' });
      mb.box('wood', x - w * 0.3, y0, 0.3, w * 0.5, h - 0.1, 0.07, { color: col, tex: 1, rotY: 0.85 });
      mb.ball('flat', x - w * 0.12, y0 + 1.1, 0.5, 0.05, { color: PAL.brass, detail: 0 });
      glow(ctx, x, y0 + 1.0, 0.5, 2.8, '#ffc070', 0.07, false);
    } else if (k === 'clock') {
      mb.cyl('flat', x, y, 0.12, 0.34, 0.34, 0.07, { seg: 16, color: '#fff4de', rotX: Math.PI / 2 });
      mb.box('flat', x, y - 0.03, 0.17, 0.02, 0.2, 0.01, { color: '#222' });
      mb.box('flat', x + 0.05, y, 0.17, 0.14, 0.02, 0.01, { color: '#222' });
      def = { x, z: 1.2, r: 1.2, label: 'Clock', text: 'The clock ticks softly.' };
    }
    if (p.id) ctx.interactable(p, { type: 'object', ...def });
  },
};

export const workbench = furn('Lamp-maker workbench with vise, lantern frame and tools. params: x,z,dir=s,w=3.2,id', (ctx, p, F) => {
  const w = p.w ?? 3.2;
  F.box('wood', 0, 0, -0.45, w, 0.9, 0.9, { color: '#9a6a3e', tex: 1.2, ao: { k: 0.25, h: 0.5 } });
  F.box('wood', 0, 0.9, -0.45, w + 0.15, 0.1, 1.0, { color: '#c89258', tex: 1.2 });
  for (let i = 0; i < 3; i++) F.box('wooddark', -w / 2 + 0.6 + i * 0.9, 0.55, 0.0, 0.72, 0.28, 0.04, { color: '#6a4528' });
  F.box('metal', -w / 2 + 0.4, 1.0, -0.2, 0.2, 0.2, 0.3, { color: '#4a4854' });
  F.box('metal', -w / 2 + 0.4, 1.18, -0.05, 0.08, 0.1, 0.16, { color: '#8a8e9c' });
  // lantern frame under construction
  F.cyl('metal', 0.1, 1.0, -0.45, 0.2, 0.17, 0.05, { seg: 6, color: '#35323d' });
  for (let i = 0; i < 6; i++) { const a = (i / 6) * 6.283; F.box('metal', 0.1 + Math.cos(a) * 0.17, 1.04, -0.45 + Math.sin(a) * 0.17, 0.025, 0.5, 0.025, { color: '#35323d' }); }
  F.cyl('metal', 0.1, 1.5, -0.45, 0.001, 0.24, 0.18, { seg: 6, color: '#35323d' });
  F.cyl('glass', 1.0, 1.0, -0.5, 0.1, 0.1, 0.26, { seg: 8, color: '#dff3ff' });
  F.box('flat', 0.7, 1.0, -0.2, 0.3, 0.05, 0.2, { color: '#e8d8b0', rotY: 0.3 });
  F.cyl('flat', -0.5, 1.0, -0.6, 0.1, 0.08, 0.18, { seg: 8, color: '#c9605a' });
  F.box('metal', 0.9, 1.0, -0.2, 0.34, 0.04, 0.05, { color: '#b8bcc8', rotY: -0.4 });
  F.cyl('metal', 1.2, 1.0, -0.2, 0.05, 0.05, 0.05, { seg: 8, color: PAL.brass });
  reg(ctx, p, [p.x - w / 2, p.z - 0.95, p.x + w / 2, p.z + 0.05], { type: 'crafting', x: p.x, z: p.z + 0.9, r: 1.4, label: 'Workbench', text: 'Tobias\'s workbench, scattered with brass and glass.' });
  glow(ctx, p.x + (dirRot[p.dir || 's'] ? 0 : 0.1), 1.3, p.z - 0.3, 1.8, '#ffc878', 0.06, false);
});

export const lantern_rack = furn('Open shelving of unfinished lanterns. params: x,z (front centre),dir=s,w=3,h=2.4,id', (ctx, p, F) => {
  const w = p.w ?? 3, h = p.h ?? 2.4, rng = mulberry32(Math.floor(p.x * 9 + p.z * 5));
  for (const sx of [-1, 1]) F.box('wood', sx * (w / 2 - 0.05), 0, -0.3, 0.1, h, 0.5, { color: '#7a4a28', tex: 1 });
  F.box('flat', 0, 0.05, -0.54, w - 0.1, h - 0.1, 0.04, { color: '#3b2a1c' });
  const rows = 3;
  for (let r = 0; r < rows; r++) {
    const y = 0.1 + r * (h - 0.3) / rows;
    F.box('wood', 0, y, -0.28, w, 0.07, 0.48, { color: '#a87444', tex: 1 });
    let x = -w / 2 + 0.35;
    while (x < w / 2 - 0.3) {
      const t = rng();
      const col = ['#35323d', '#8a6a2a', '#5a6a58', '#a8643a'][(rng() * 4) | 0];
      if (t < 0.5) {
        F.cyl('metal', x, y + 0.07, -0.28, 0.15, 0.13, 0.04, { seg: 6, color: col });
        for (let i = 0; i < 4; i++) { const a = (i / 4) * 6.283 + 0.78; F.box('metal', x + Math.cos(a) * 0.12, y + 0.1, -0.28 + Math.sin(a) * 0.12, 0.02, 0.3, 0.02, { color: col }); }
        if (t < 0.25) F.cyl('glass', x, y + 0.12, -0.28, 0.1, 0.1, 0.24, { seg: 6, color: '#e8f6ff' });
        F.cyl('metal', x, y + 0.4, -0.28, 0.001, 0.18, 0.12, { seg: 6, color: col });
        x += 0.5;
      } else if (t < 0.8) {
        F.cyl('flat', x, y + 0.07, -0.28, 0.12, 0.12, 0.2, { seg: 8, color: '#d9d2c8' }); F.cyl('flat', x, y + 0.27, -0.28, 0.12, 0.12, 0.2, { seg: 8, color: '#e8b070' }); x += 0.38;
      } else { F.box('flat', x, y + 0.07, -0.28, 0.4, 0.14, 0.3, { color: '#c9a070' }); F.box('flat', x, y + 0.21, -0.28, 0.3, 0.12, 0.26, { color: '#d9b080' }); x += 0.52; }
    }
  }
  F.box('wood', 0, h, -0.3, w + 0.1, 0.08, 0.56, { color: '#6a4528' });
  reg(ctx, p, [p.x - w / 2, p.z - 0.58, p.x + w / 2, p.z], { type: 'object', x: p.x, z: p.z + 0.9, r: 1.4, label: 'Lantern shelf', text: 'Half-finished lanterns wait their turn: frames, glass, and a lot of patience.' });
});

export const tackle_wall = {
  doc: 'Back-wall tackle display: rods, floats, lures, hooks. params: x,w=3.4,id',
  build(ctx, p) {
    const mb = ctx.mb, w = p.w ?? 3.4, rng = mulberry32(Math.floor(p.x * 13));
    mb.box('plankwall', p.x, 0.95, 0.07, w, 2.0, 0.07, { color: '#a88a64', tex: 1.2 });
    mb.box('wood', p.x, 2.9, 0.1, w + 0.2, 0.1, 0.12, { color: '#6a4528' });
    for (let i = 0; i < 6; i++) {
      const rx = p.x - w / 2 + 0.3 + i * ((w - 0.6) / 5);
      mb.cyl('wood', rx, 0.5, 0.2, 0.02, 0.03, 2.3 - rng() * 0.4, { seg: 4, color: ['#8a5a34', '#c8966a', '#6a4528'][i % 3], rotZ: (i % 2 ? 1 : -1) * 0.05 });
      mb.cyl('metal', rx, 1.25, 0.24, 0.05, 0.05, 0.14, { seg: 6, color: '#5a5e6a', rotX: Math.PI / 2 });
    }
    mb.box('wood', p.x, 0.5, 0.18, w - 0.2, 0.06, 0.2, { color: '#7a4a28' });
    for (let i = 0; i < 9; i++) mb.ball('flat', p.x - w / 2 + 0.3 + i * ((w - 0.6) / 8), 0.62, 0.2, 0.06, { color: ['#e8645a', '#fff4e0', '#f4d27a', '#6fb7e8'][i % 4], detail: 1, sy: 1.3 });
    for (let i = 0; i < 7; i++) { const lx = p.x - w / 2 + 0.4 + i * ((w - 0.8) / 6); mb.box('metal', lx, 2.1, 0.18, 0.03, 0.22, 0.02, { color: '#b8bcc8' }); mb.ball('flat', lx, 2.0, 0.19, 0.045, { color: ['#e0b24a', '#c9605a', '#6aa86a'][i % 3], detail: 0 }); }
    mb.cyl('metal', p.x - w / 2 + 0.5, 1.7, 0.2, 0.16, 0.16, 0.05, { seg: 10, color: '#c8a050', rotX: Math.PI / 2 });
    ctx.bake({ type: 'rect', x: p.x - w / 2, z: 0.1, w, d: 0.8, a: 0.15, blur: 0.4 });
    if (p.id) ctx.interactable(p, { type: 'object', x: p.x, z: 1.4, r: 1.5, label: 'Tackle wall', text: 'Rods, floats and lures in every colour, each with a story attached.' });
  },
};

export const ledger_stand = furn('Lectern with a big fish ledger and hanging scale. params: x,z,dir=s,id', (ctx, p, F) => {
  F.cyl('wood', 0, 0, 0, 0.18, 0.28, 0.12, { seg: 8, color: '#6a4528' });
  F.box('wood', 0, 0.1, 0, 0.22, 0.95, 0.22, { color: '#8a5a34' });
  F.box('wood', 0, 1.0, 0, 0.9, 0.08, 0.6, { color: '#a87444', rotX: -0.35 });
  F.box('flat', 0, 1.06, 0.0, 0.7, 0.07, 0.46, { color: '#f4ead4', rotX: -0.35 });
  F.box('flat', -0.18, 1.1, 0, 0.3, 0.02, 0.38, { color: '#d8c9a4', rotX: -0.35 });
  F.cyl('flat', 0.4, 1.05, -0.05, 0.03, 0.03, 0.22, { seg: 4, color: '#2a2a3a', rotZ: 0.9 });
  F.box('metal', 0.7, 1.55, 0.0, 0.04, 0.5, 0.04, { color: '#35323d' });
  F.box('metal', 0.7, 1.55, 0.0, 0.5, 0.03, 0.03, { color: PAL.brass });
  F.cyl('metal', 0.95, 1.2, 0.0, 0.14, 0.12, 0.04, { seg: 8, color: PAL.brass });
  F.cyl('metal', 0.45, 1.2, 0.0, 0.1, 0.1, 0.04, { seg: 8, color: '#8a8e9c' });
  reg(ctx, p, [p.x - 0.55, p.z - 0.35, p.x + 0.55, p.z + 0.3], { type: 'object', x: p.x, z: p.z + 0.9, r: 1.4, label: 'Fish ledger', text: 'Pelham records every catch in the big ledger, in careful pencil.' });
});

export const map_table = furn('Slanted star-map table. params: x,z,dir=s,w=2.2,id', (ctx, p, F) => {
  const w = p.w ?? 2.2, d = 1.4;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) F.box('wood', sx * (w / 2 - 0.12), 0, sz * (d / 2 - 0.12), 0.12, 0.85, 0.12, { color: '#5a3a24' });
  F.box('wood', 0, 0.84, 0, w, 0.1, d, { color: '#7a4a28', tex: 1 });
  const mk = cachedMat(ctx, 'map_stars', () => mapCanvas('stars'), {});
  const [x, z] = F.world(0, 0);
  ctx.mb.add(mk, new THREE.PlaneGeometry(w - 0.3, d - 0.3).rotateX(-Math.PI / 2), { matrix: placeMatrix(x, 0.95, z, { rotY: F.rotY }) });
  F.cyl('metal', 0.55, 0.95, 0.15, 0.14, 0.14, 0.03, { seg: 14, color: PAL.brass });
  F.cyl('metal', -0.5, 0.95, -0.25, 0.04, 0.04, 0.3, { seg: 5, color: '#8a6a2a', rotZ: 1.2 });
  F.cyl('flat', 0.8, 0.95, -0.4, 0.07, 0.06, 0.1, { seg: 8, color: '#e8d8b0' });
  F.ball('glow', 0.8, 1.1, -0.4, 0.04, { color: '#ffd878', detail: 0, sy: 1.4 });
  reg(ctx, p, [p.x - w / 2, p.z - d / 2, p.x + w / 2, p.z + d / 2], { type: 'object', x: p.x, z: p.z + d / 2 + 0.7, r: 1.4, label: 'Star map', text: 'A star map, pinned and pencilled with tonight\'s comets.' });
});

export const reading_desk = furn('Tall reading lectern. params: x,z,dir', (ctx, p, F) => {
  F.box('wood', 0, 0, 0, 0.5, 1.0, 0.4, { color: '#8a5a34' });
  F.box('wood', 0, 1.0, 0, 0.8, 0.07, 0.6, { color: '#a87444', rotX: -0.35 });
  F.box('flat', 0, 1.07, 0, 0.55, 0.05, 0.4, { color: '#f4ead4', rotX: -0.35 });
  ctx.solid(p.x - 0.4, p.z - 0.3, p.x + 0.4, p.z + 0.3, { tile: false });
  ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: 0.6, rz: 0.5, a: 0.3, blur: 0.2 });
});

export const book_stack = {
  doc: 'Pile of books. params: x,y=0,z,n=4,colors',
  build(ctx, p) {
    const rng = mulberry32(Math.floor(p.x * 17 + p.z * 5));
    const cols = p.colors || ['#c9605a', '#5a8ac9', '#e0b24a', '#6aa86a', '#9a6ac0'];
    let y = p.y ?? 0;
    for (let i = 0; i < (p.n ?? 4); i++) {
      const h = 0.07 + rng() * 0.07;
      ctx.mb.box('flat', p.x + (rng() - 0.5) * 0.06, y, p.z, 0.36 - i * 0.02, h, 0.26, { color: cols[(rng() * cols.length) | 0], rotY: (rng() - 0.5) * 0.5 });
      y += h;
    }
    if (p.floor) { ctx.solidCircle(p.x, p.z, 0.22, { tile: false }); ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: 0.4, rz: 0.3, a: 0.25, blur: 0.2 }); }
  },
};

export const screen = furn('Folding privacy screen. params: x,z,dir,w=1.9,color', (ctx, p, F) => {
  const w = p.w ?? 1.9, col = p.color || '#9fd0c8';
  for (let i = 0; i < 3; i++) {
    const lx = -w / 2 + (i + 0.5) * (w / 3);
    F.box('wood', lx, 0, i % 2 ? 0.08 : -0.08, w / 3 - 0.02, 1.7, 0.06, { color: '#8a5a34' });
    F.box('cloth', lx, 0.2, i % 2 ? 0.12 : -0.04, w / 3 - 0.14, 1.3, 0.03, { color: col, jitter: 0.04 });
    F.box('flat', lx, 1.1, i % 2 ? 0.14 : -0.02, 0.12, 0.12, 0.01, { color: '#fff4e0' });
  }
  ctx.solid(p.x - w / 2, p.z - 0.15, p.x + w / 2, p.z + 0.15, { tile: false });
  ctx.bake({ type: 'rect', x: p.x - w / 2, z: p.z - 0.2, w, d: 0.5, a: 0.3, blur: 0.2 });
});

export const garland = {
  doc: 'Pine/holly garland with berries and bows along a line (festive decor). params: pts,y=2.4,sag=0.35,colors',
  build(ctx, p) {
    const mb = ctx.mb, rng = mulberry32(5);
    for (let s = 0; s < p.pts.length - 1; s++) {
      const [ax, az] = p.pts[s], [bx, bz] = p.pts[s + 1];
      const L = Math.hypot(bx - ax, bz - az), n = Math.max(3, Math.round(L / 0.3));
      for (let k = 0; k <= n; k++) {
        const u = k / n, x = ax + (bx - ax) * u, z = az + (bz - az) * u, y = (p.y ?? 2.4) - Math.sin(u * Math.PI) * (p.sag ?? 0.35);
        mb.ball('leaf_pine', x, y, z, 0.15 + rng() * 0.05, { detail: 1, color: '#ffffff', tone: rng(), lump: 0.2, seed: k });
        if (k % 3 === 1) mb.ball('flat', x + 0.05, y - 0.08, z + 0.12, 0.05, { color: '#d9403a', detail: 0 });
        if (k % 5 === 2) mb.ball('glow', x, y - 0.12, z + 0.12, 0.055, { color: '#ffd878', detail: 0 });
      }
      for (const [x, z, u] of [[ax, az], [bx, bz]]) { mb.box('cloth', x, (p.y ?? 2.4) - 0.1, z + 0.1, 0.22, 0.16, 0.05, { color: '#c8403a' }); mb.box('cloth', x, (p.y ?? 2.4) - 0.34, z + 0.1, 0.08, 0.3, 0.04, { color: '#c8403a' }); }
    }
  },
};

export const gifts = {
  doc: 'Pile of wrapped presents. params: x,z,n=5 (decor; non-solid)',
  build(ctx, p) {
    const rng = mulberry32(Math.floor(p.x * 3 + p.z * 7));
    const cols = ['#c8403a', '#3f7a5a', '#e0b24a', '#5a8ac9', '#9a6ac0', '#fff4e0'];
    const rib = ['#f4d27a', '#fff4e0', '#c8403a', '#fff4e0', '#f4d27a', '#c8403a'];
    for (let i = 0; i < (p.n ?? 5); i++) {
      const w = 0.28 + rng() * 0.22, h = 0.2 + rng() * 0.22, x = p.x + (rng() - 0.5) * 0.9, z = p.z + (rng() - 0.5) * 0.45, y = p.y ?? 0, c = (rng() * 6) | 0;
      ctx.mb.box('flat', x, y, z, w, h, w, { color: cols[c], rotY: rng() * 1.5 });
      ctx.mb.box('flat', x, y, z, w + 0.01, h + 0.01, 0.05, { color: rib[c], rotY: 0 });
      ctx.mb.box('flat', x, y + h, z, 0.1, 0.07, 0.1, { color: rib[c] });
    }
  },
};

export const wreath = {
  doc: 'Door/wall wreath with a red bow. params: x,y=2.0,z=0.12,r=0.38',
  build(ctx, p) {
    const r = p.r ?? 0.38, z = p.z ?? 0.14, rng = mulberry32(Math.floor(p.x * 5));
    for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.283; ctx.mb.ball('leaf_pine', p.x + Math.cos(a) * r, (p.y ?? 2.0) + Math.sin(a) * r, z, 0.12, { detail: 1, color: '#ffffff', tone: rng(), lump: 0.2, seed: i }); }
    ctx.mb.box('cloth', p.x, (p.y ?? 2.0) - r, z + 0.06, 0.2, 0.16, 0.05, { color: '#c8403a' });
    for (let i = 0; i < 4; i++) ctx.mb.ball('flat', p.x + Math.cos(i * 1.7) * r, (p.y ?? 2.0) + Math.sin(i * 1.7) * r, z + 0.1, 0.045, { color: '#d9403a', detail: 0 });
  },
};

export const candles = {
  doc: 'Cluster of lit candles on a surface. params: x,z,y=0.85,n=3,color',
  build(ctx, p) {
    const rng = mulberry32(Math.floor(p.x * 7 + p.z));
    for (let i = 0; i < (p.n ?? 3); i++) {
      const x = p.x + (i - 1) * 0.12 + (rng() - 0.5) * 0.04, h = 0.14 + rng() * 0.14;
      ctx.mb.cyl('flat', x, p.y ?? 0.85, p.z + (rng() - 0.5) * 0.08, 0.035, 0.04, h, { seg: 6, color: p.color || '#f8f0d8' });
      ctx.mb.ball('glow', x, (p.y ?? 0.85) + h + 0.05, p.z, 0.04, { color: '#ffd060', detail: 0, sy: 1.5 });
    }
    glow(ctx, p.x, (p.y ?? 0.85) + 0.3, p.z, 1.5, '#ffc060', 0.1, false);
  },
};

export const rail_bar = {
  doc: 'Row of hanging pots/pans on a bar on the back wall. params: x,y=2.5,w=2.2',
  build(ctx, p) {
    const w = p.w ?? 2.2, y = p.y ?? 2.5;
    ctx.mb.cyl('metal', p.x, y, 0.2, 0.025, 0.025, w, { seg: 5, color: '#3a3640', rotZ: Math.PI / 2 });
    for (let i = 0; i < 5; i++) {
      const x = p.x - w / 2 + 0.25 + i * ((w - 0.5) / 4), r = 0.1 + (i % 3) * 0.04;
      ctx.mb.cyl('metal', x, y - 0.22, 0.2, 0.012, 0.012, 0.22, { seg: 3, color: '#3a3640' });
      ctx.mb.cyl('metal', x, y - 0.5, 0.22, r + 0.03, r, 0.2, { seg: 10, color: ['#c9704a', '#b8bcc8', '#e0a050', '#8a8e9c', '#c9704a'][i], rotX: 0 });
    }
  },
};

export const hearth = furn('Big stone hearth with a real animated fire, mantel and chimney breast. params: x,z (front centre),w=3.2,h=2.8,id', (ctx, p, F) => {
  const w = p.w ?? 3.2, h = p.h ?? 2.8, ow = w * 0.52;
  F.box('stone', 0, 0, -0.5, w, h, 1.0, { color: '#bdb2a0', tex: 1.3, ao: { k: 0.3, h: 0.9 } });
  F.box('stone', 0, 0, 0.12, w + 0.3, 0.16, 0.4, { color: '#a49a8a', tex: 1.2 });
  F.box('flat', 0, 0.16, 0.0, ow, 1.15, 0.04, { color: '#140c0a' });
  F.box('stone', 0, 1.3, 0.02, ow + 0.4, 0.2, 0.14, { color: '#8a8070' });
  for (const sx of [-1, 1]) F.box('stone', sx * (ow / 2 + 0.1), 0.16, 0.04, 0.2, 1.2, 0.12, { color: '#8a8070' });
  F.box('wood', 0, 1.62, -0.45, w + 0.4, 0.16, 1.1, { color: '#6a4528', tex: 1 });
  F.box('wood', 0, 1.5, -0.1, w + 0.2, 0.12, 0.3, { color: '#7a4a28' });
  // mantel clutter
  F.cyl('flat', -w * 0.34, 1.78, -0.15, 0.09, 0.1, 0.3, { seg: 8, color: '#8fb8d0' });
  F.cyl('flat', -w * 0.24, 1.78, -0.15, 0.07, 0.07, 0.22, { seg: 8, color: '#d9a870' });
  F.box('flat', w * 0.3, 1.78, -0.15, 0.4, 0.12, 0.26, { color: '#a8453f' });
  F.cyl('flat', w * 0.36, 1.9, -0.15, 0.04, 0.04, 0.18, { seg: 6, color: '#f8f0d8' });
  F.ball('glow', w * 0.36, 2.1, -0.15, 0.04, { color: '#ffd060', detail: 0, sy: 1.5 });
  F.cyl('flat', 0, 1.78, -0.2, 0.2, 0.2, 0.05, { seg: 14, color: '#c8a050', rotX: 0 });
  // logs + embers
  for (const [lx, lz, ry] of [[-0.25, 0.14, 0.2], [0.2, 0.1, -0.15], [0.0, 0.0, 1.45]]) F.cyl('wood', lx, 0.26, lz, 0.11, 0.11, 0.85, { seg: 7, color: '#4a2f1c', rotZ: Math.PI / 2, rotY: ry });
  F.box('glow', 0, 0.2, 0.1, ow * 0.7, 0.07, 0.4, { color: '#ff7a2a' });
  F.cyl('metal', 0, 0.16, 0.24, 0.05, 0.05, 0.6, { seg: 4, color: '#2a2630', rotZ: Math.PI / 2 });
  // animated flames
  const g = new THREE.Group();
  const fm = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.92, depthWrite: false });
  const flames = [];
  const defs = [[-0.28, 0.5, 0.34, '#ff6a1a'], [0.05, 0.62, 0.42, '#ff8f2a'], [0.3, 0.46, 0.3, '#ff6a1a'], [-0.05, 0.5, 0.28, '#ffd05a'], [0.18, 0.5, 0.2, '#fff0a0']];
  const [fx, fz] = F.world(0, 0.2);
  for (const [dx, hh, rr, c] of defs) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(rr * 0.5, hh * 1.5, 6), fm(c));
    const [wx, wz] = F.world(dx, 0.2);
    m.position.set(wx, 0.32 + hh * 0.75, wz);
    g.add(m); flames.push([m, dx, hh]);
  }
  ctx.root.add(g);
  ctx.updater((dt, t) => { for (const [m, dx, hh] of flames) { const s = 0.85 + Math.sin(t * 9 + dx * 11) * 0.16 + Math.sin(t * 14 + dx * 3) * 0.08; m.scale.set(1, s, 1); m.position.y = 0.32 + hh * 0.75 * s; m.rotation.z = Math.sin(t * 7 + dx * 5) * 0.08; } });
  reg(ctx, p, rotRect(F, -w / 2, -1.0, w / 2, 0.1), { type: 'object', x: p.x, z: p.z + 1.1, r: 1.5, label: 'Hearth', text: 'A great stone hearth. The fire never seems to go out.' });
  glow(ctx, fx, 0.7, fz + 0.1, 5.2, '#ff8a3a', 0.12, true);
  glow(ctx, fx, 0.6, fz + 0.5, 2.4, '#ffb060', 0.15, false);
});

export const spiral_stairs = {
  doc: 'Brass-and-oak spiral staircase rising out of frame. params: x,z (axis),r=1.15,n=16,rise=0.3,turn=0.5,start=1.2 (radians; 1.57 = first step toward south),id',
  build(ctx, p) {
    const mb = ctx.mb, r = p.r ?? 1.15, n = p.n ?? 16, rise = p.rise ?? 0.3, turn = p.turn ?? 0.5, a0 = p.start ?? 1.2;
    mb.cyl('metal', p.x, 0, p.z, 0.1, 0.12, n * rise + 1.0, { seg: 8, color: '#8a6a2a' });
    mb.cyl('wooddark', p.x, 0, p.z, 0.36, 0.42, 0.14, { seg: 10, color: '#4a3220' });
    for (let k = 0; k < n; k++) {
      const a = a0 + k * turn, y = 0.22 + k * rise;
      const cx = p.x + Math.cos(a) * r / 2, cz = p.z + Math.sin(a) * r / 2;
      mb.box('wood', cx, y, cz, r, 0.09, 0.62, { color: k % 2 ? '#b9824f' : '#c89258', rotY: -a, tex: 1 });
      mb.box('wooddark', cx, y - 0.06, cz, r * 0.96, 0.05, 0.5, { color: '#5a3a24', rotY: -a });
      if (k % 2 === 0) {
        const ex = p.x + Math.cos(a) * (r - 0.06), ez = p.z + Math.sin(a) * (r - 0.06);
        mb.cyl('metal', ex, y, ez, 0.022, 0.022, 0.8, { seg: 4, color: PAL.brass });
      }
    }
    ctx.solidCircle(p.x, p.z, r * 0.9, { tile: true });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.1, rx: r * 1.05, rz: r * 0.95, a: 0.38, blur: 0.3 });
    if (p.id) ctx.interactable(p, { type: 'object', x: p.x, z: p.z + r + 0.8, r: 1.4, label: 'Spiral stairs', text: 'The spiral stairs wind up to the dome.' });
  },
};

// ---- exterior woodland / hilltop props (used by whispering_woods + starview_hill) ----

export const stone_lantern = {
  doc: 'Small mossy stone lantern that glows at night. params: x,z,scale=1,moss=true',
  build(ctx, p) {
    const s = p.scale ?? 1, mb = ctx.mb, x = p.x, z = p.z;
    mb.cyl('stone', x, 0, z, 0.2 * s, 0.26 * s, 0.14 * s, { seg: 6, color: '#a9a898', tex: 1 });
    mb.cyl('stone', x, 0.14 * s, z, 0.09 * s, 0.11 * s, 0.5 * s, { seg: 6, color: '#b2b0a0', tex: 1 });
    mb.cyl('stone', x, 0.64 * s, z, 0.2 * s, 0.16 * s, 0.1 * s, { seg: 6, color: '#a9a898' });
    mb.cyl('glow', x, 0.74 * s, z, 0.14 * s, 0.14 * s, 0.26 * s, { seg: 6, color: '#ffcf80' });
    for (let i = 0; i < 3; i++) { const a = (i / 3) * 6.283; mb.box('stone', x + Math.cos(a) * 0.15 * s, 0.74 * s, z + Math.sin(a) * 0.15 * s, 0.05 * s, 0.26 * s, 0.05 * s, { color: '#a09e8e' }); }
    mb.cone('stone', x, 1.0 * s, z, 0.3 * s, 0.22 * s, { seg: 6, color: '#a9a898', tex: 1 });
    mb.ball('stone', x, 1.24 * s, z, 0.06 * s, { color: '#b2b0a0', detail: 0 });
    if (p.moss !== false) { mb.ball('leaf_leaf', x + 0.08 * s, 1.18 * s, z, 0.13 * s, { lump: 0.3, detail: 1, color: '#7ab060', sy: 0.5 }); mb.ball('leaf_leaf', x - 0.1 * s, 0.1 * s, z + 0.12 * s, 0.14 * s, { lump: 0.3, detail: 1, color: '#6aa050', sy: 0.5 }); }
    ctx.solidCircle(x, z, 0.22 * s);
    ctx.bake({ type: 'ellipse', x, z, rx: 0.5 * s, rz: 0.4 * s, a: 0.3 });
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.0, color: '#ffc070' }));
    halo.scale.set(2.2 * s, 2.2 * s, 1);
    halo.position.set(x, 0.88 * s, z);
    ctx.root.add(halo);
    ctx.updater((dt, t, env) => { halo.material.opacity = (0.1 + env.glow * 0.75) * (0.92 + Math.sin(t * 2.3 + x * 3) * 0.08); });
  },
};

export const shrine = {
  doc: 'Mossy forest lantern shrine: stone plinth, tiny wooden hokora, offerings, two stone lanterns, paper streamers. params: x,z,id,scale=1',
  build(ctx, p) {
    const s = p.scale ?? 1, mb = ctx.mb, x = p.x, z = p.z;
    mb.box('stone', x, 0, z, 2.4 * s, 0.16, 1.7 * s, { color: '#9a9a88', tex: 1.2 });
    mb.box('stone', x, 0.16, z, 1.9 * s, 0.14, 1.3 * s, { color: '#a8a894', tex: 1.2 });
    mb.box('stone', x, 0.3, z - 0.1 * s, 0.9 * s, 0.34, 0.7 * s, { color: '#a0a08e', tex: 1 });
    mb.box('wood', x, 0.64, z - 0.1 * s, 0.74 * s, 0.7 * s, 0.56 * s, { color: '#8a5a38', tex: 1 });
    mb.box('flat', x, 0.7, z + 0.19 * s, 0.4 * s, 0.4 * s, 0.03, { color: '#241810' });
    mb.ball('glow', x, 0.9, z + 0.2 * s, 0.07, { color: '#ffd078', detail: 0, sy: 1.3 });
    mb.box('wood', x, 1.34, z - 0.1 * s, 1.08 * s, 0.08, 0.84 * s, { color: '#6a4528', rotZ: 0 });
    mb.box('shingle', x - 0.25 * s, 1.4, z - 0.1 * s, 0.7 * s, 0.07, 0.96 * s, { color: '#7a6a58', rotZ: 0.55 });
    mb.box('shingle', x + 0.25 * s, 1.4, z - 0.1 * s, 0.7 * s, 0.07, 0.96 * s, { color: '#7a6a58', rotZ: -0.55 });
    for (const sx of [-1, 1]) mb.box('wood', x + sx * 0.3 * s, 0.64, z + 0.2 * s, 0.07, 0.7, 0.07, { color: '#6a4528' });
    for (let i = 0; i < 4; i++) { mb.ball('leaf_leaf', x + (i - 1.5) * 0.5 * s, 0.2 + (i % 2) * 0.03, z + 0.55 * s, 0.16, { lump: 0.3, detail: 1, color: ['#6aa050', '#7ab060', '#5a9048', '#86b868'][i], sy: 0.5 }); }
    mb.ball('leaf_leaf', x + 0.4 * s, 1.5, z - 0.3 * s, 0.22, { lump: 0.3, detail: 1, color: '#6aa050', sy: 0.5 });
    for (let i = 0; i < 3; i++) mb.cyl('flat', x - 0.35 + i * 0.35, 0.3, z + 0.52 * s, 0.07, 0.06, 0.1, { seg: 6, color: ['#e8d8b0', '#c9605a', '#e8d8b0'][i] });
    // paper streamers (shide)
    for (let i = 0; i < 4; i++) mb.box('flat', x - 0.45 * s + i * 0.3 * s, 1.0, z + 0.18 * s, 0.1, 0.34, 0.01, { color: '#fff6e0', rotZ: (i % 2 ? 1 : -1) * 0.05 });
    mb.cyl('cloth', x, 1.2, z + 0.18 * s, 0.025, 0.025, 1.2 * s, { seg: 4, color: '#c8403a', rotZ: Math.PI / 2 });
    ctx.solid(x - 1.2 * s, z - 0.95 * s, x + 1.2 * s, z + 0.75 * s, { tile: true });
    ctx.bake({ type: 'rect', x: x - 1.4 * s, z: z - 1.0 * s, w: 2.8 * s, d: 2.2 * s, a: 0.3, blur: 0.5 });
    stone_lantern.build(ctx, { x: x - 1.55 * s, z: z + 0.45 * s, scale: 1.05 });
    stone_lantern.build(ctx, { x: x + 1.55 * s, z: z + 0.45 * s, scale: 0.95 });
    if (p.id) ctx.interactable(p, { type: 'shrine', x: x, z: z + 1.7 * s, r: 1.6, label: 'Lantern shrine', text: 'A moss-covered shrine where travellers leave small lights.' });
  },
};

export const fallen_log = {
  doc: 'Big fallen hollow log with moss and bracket fungi. params: x,z,len=3.6,r=0.5,dir:"x"|"z",id',
  build(ctx, p) {
    const mb = ctx.mb, len = p.len ?? 3.6, r = p.r ?? 0.5, x = p.x, z = p.z, alongX = p.dir !== 'z';
    const o = alongX ? { rotZ: Math.PI / 2 } : { rotX: Math.PI / 2 };
    mb.cyl('bark', x, r * 0.95 - len / 2 + len / 2 - len / 2 + 0.0, z, r, r * 1.05, len, { seg: 9, color: '#8a6a4a', ...o, tex: 1.2 });
    // hollow end
    const ex = alongX ? x - len / 2 : x, ez = alongX ? z : z - len / 2;
    mb.cyl('flat', alongX ? ex + 0.02 : ex, r * 0.95 - 0.025, alongX ? ez : ez + 0.02, r * 0.72, r * 0.72, 0.05, { seg: 9, color: '#1c130c', ...o });
    mb.cyl('wood', alongX ? ex - 0.02 : ex, r * 0.95 - 0.03, alongX ? ez : ez - 0.02, r * 0.92, r * 0.92, 0.06, { seg: 9, color: '#c8a070', ...o });
    mb.cyl('flat', alongX ? ex - 0.04 : ex, r * 0.95 - 0.025, alongX ? ez : ez - 0.04, r * 0.62, r * 0.62, 0.05, { seg: 9, color: '#1c130c', ...o });
    for (let i = 0; i < 6; i++) {
      const u = (i + 0.5) / 6 - 0.5;
      const mx = alongX ? x + u * len * 0.9 : x + (i % 2 ? 0.1 : -0.1), mz = alongX ? z + (i % 2 ? 0.1 : -0.1) : z + u * len * 0.9;
      mb.ball('leaf_leaf', mx, r * 1.9, mz, 0.26, { lump: 0.35, detail: 1, color: ['#6aa050', '#7ab060', '#5a9048'][i % 3], sy: 0.45, seed: i });
    }
    for (let i = 0; i < 3; i++) {
      const u = (i - 1) * 0.28 * len, bx = alongX ? x + u : x + r * 0.9, bz = alongX ? z + r * 0.9 : z + u;
      mb.cyl('flat', bx, r * 0.9 + (i % 2) * 0.1, bz, 0.17, 0.15, 0.05, { seg: 8, color: ['#e8a860', '#d98a4a', '#f0c880'][i] });
    }
    const rx = alongX ? len / 2 : r + 0.1, rz = alongX ? r + 0.1 : len / 2;
    ctx.solid(x - rx, z - rz, x + rx, z + rz, { tile: true });
    ctx.bake({ type: 'ellipse', x, z: z + 0.05, rx: rx + 0.3, rz: rz + 0.3, a: 0.4, blur: 0.4 });
    if (p.id) ctx.interactable(p, { type: 'object', x: x + (alongX ? 0 : 1.2), z: z + (alongX ? 1.3 : 0), r: 1.6, label: 'Hollow log', text: 'A hollow log, damp and soft with moss. Something small seems to live inside.' });
  },
};

let _shaftTex = null;
export const light_shaft = {
  doc: 'Soft slanting sunbeam through the canopy (daytime only). params: x,z,w=2.4,h=5,yaw=0,lean=0.35,strength=1',
  build(ctx, p) {
    if (!_shaftTex) {
      const c = makeCanvas(64, 128);
      const g = c.getContext('2d');
      const grd = g.createLinearGradient(0, 0, 0, 128);
      grd.addColorStop(0, 'rgba(255,240,190,0.0)'); grd.addColorStop(0.18, 'rgba(255,236,170,0.55)'); grd.addColorStop(0.7, 'rgba(255,226,150,0.35)'); grd.addColorStop(1, 'rgba(255,220,140,0.0)');
      g.fillStyle = grd; g.fillRect(0, 0, 64, 128);
      g.globalCompositeOperation = 'destination-in';
      const hg = g.createLinearGradient(0, 0, 64, 0);
      hg.addColorStop(0, 'rgba(0,0,0,0)'); hg.addColorStop(0.35, 'rgba(0,0,0,1)'); hg.addColorStop(0.65, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = hg; g.fillRect(0, 0, 64, 128);
      _shaftTex = new THREE.CanvasTexture(c);
      _shaftTex.colorSpace = THREE.SRGBColorSpace;
    }
    const w = p.w ?? 2.4, h = p.h ?? 5;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: _shaftTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide, color: '#fff0c0' }));
    m.position.set(p.x, h / 2 - 0.1, p.z);
    m.rotation.order = 'YXZ';
    m.rotation.y = p.yaw ?? 0.3;
    m.rotation.z = p.lean ?? 0.35;
    m.renderOrder = 4;
    ctx.root.add(m);
    const k = p.strength ?? 1;
    ctx.updater((dt, t, env) => { m.material.opacity = (1 - env.night) * (env.weather === 'sunny' ? 0.5 : env.weather === 'cloudy' ? 0.16 : 0.03) * k * (0.8 + Math.sin(t * 0.7 + p.x) * 0.2); });
  },
};

export const dome = {
  doc: 'Verdigris observatory dome with an open slit and a brass telescope tube, sits on a house footprint. params: x,z (footprint centre),y (wall top height),r=3.1,color,slitYaw=0',
  build(ctx, p) {
    const mb = ctx.mb, r = p.r ?? 3.1, y = p.y ?? 3.4, x = p.x, z = p.z, col = p.color || '#74b0a4';
    mb.cyl('stone', x, y - 0.05, z, r + 0.12, r + 0.12, 0.22, { seg: 20, color: '#d9d2c4', tex: 2 });
    mb.ball('shingle', x, y + 0.1, z, r, { detail: 3, color: col, sy: 0.82, jitter: 0.02 });
    // brass ribs
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI;
      for (let k = 0; k < 7; k++) {
        const t = (k + 0.5) / 7 * Math.PI;
        const px = Math.cos(a) * Math.cos(t) * r * 1.0, pz = Math.sin(a) * Math.cos(t) * r * 1.0, py = Math.sin(t) * r * 0.82;
        mb.ball('metal', x + px * 1.005, y + 0.1 + py * 1.005, z + pz * 1.005, 0.07, { color: '#d8b050', detail: 0 });
        mb.ball('metal', x - px * 1.005, y + 0.1 + py * 1.005, z - pz * 1.005, 0.07, { color: '#d8b050', detail: 0 });
      }
    }
    // slit facing south-east, dark opening + the telescope poking out
    mb.box('flat', x + 0.2, y + r * 0.45, z + r * 0.62, 0.9, r * 0.85, 0.2, { color: '#15182e', rotX: -0.55, rotY: 0 });
    mb.box('metal', x + 0.2, y + r * 0.45, z + r * 0.62, 0.06, r * 0.9, 0.24, { color: '#d8b050', rotX: -0.55 });
    mb.cyl('metal', x + 0.2, y + r * 0.62, z + r * 0.78, 0.22, 0.28, 1.5, { seg: 10, color: '#e8c05a', rotX: -0.85 });
    mb.cyl('metal', x + 0.2, y + r * 0.62, z + r * 0.78, 0.24, 0.24, 0.12, { seg: 10, color: '#8a6a2a', rotX: -0.85 });
    mb.cyl('metal', x, y + r * 0.82 + 0.3, z, 0.04, 0.04, 0.6, { seg: 4, color: '#8a6a2a' });
    mb.ball('metal', x, y + r * 0.82 + 0.9, z, 0.1, { color: '#e8c05a', detail: 1 });
  },
};

export const bottle_ship = {
  doc: 'Ship in a bottle on a little stand. params: x,y=0,z,scale=1',
  build(ctx, p) {
    const s = p.scale ?? 1, y = p.y ?? 0, mb = ctx.mb;
    mb.box('wood', p.x, y, p.z, 0.62 * s, 0.07 * s, 0.26 * s, { color: '#6a4528' });
    mb.cyl('glass', p.x, y + 0.2 * s, p.z, 0.12 * s, 0.12 * s, 0.5 * s, { seg: 8, color: '#bfe8f0', rotZ: Math.PI / 2 });
    mb.cyl('glass', p.x + 0.3 * s, y + 0.2 * s, p.z, 0.04 * s, 0.07 * s, 0.14 * s, { seg: 8, color: '#bfe8f0', rotZ: Math.PI / 2 });
    mb.cyl('wood', p.x + 0.38 * s, y + 0.2 * s, p.z, 0.05 * s, 0.05 * s, 0.07 * s, { seg: 6, color: '#c8966a', rotZ: Math.PI / 2 });
    mb.box('flat', p.x, y + 0.16 * s, p.z, 0.22 * s, 0.07 * s, 0.07 * s, { color: '#4a5a8a' });
    mb.box('flat', p.x, y + 0.2 * s, p.z, 0.02 * s, 0.2 * s, 0.02 * s, { color: '#6a4528' });
    mb.box('cloth', p.x + 0.02 * s, y + 0.25 * s, p.z, 0.12 * s, 0.12 * s, 0.01 * s, { color: '#fff4e0' });
  },
};

function rotRect(F, x0, z0, x1, z1) {
  const a = F.world(x0, z0), b = F.world(x1, z1);
  return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])];
}

export const bookcase = furn('Tall bookcase against any wall (dir = the way it faces). params: x,z (front centre),dir=s,w=2.4,h=3.0,id,spines:[css],top:"urns"|"none"', (ctx, p, F) => {
  const w = p.w ?? 2.4, h = p.h ?? 3.0, d = 0.6, wood = p.wood || '#7a4a28';
  const rng = mulberry32(Math.floor(p.x * 7 + p.z * 13));
  const cols = p.spines || ['#a8453f', '#3f6aa0', '#d9a83a', '#4f8a5a', '#7a4a9a', '#c9702f', '#e8dcc0', '#2f6a6a', '#8a3a4a'];
  F.box('wood', 0, 0, -d / 2, w, h, d, { color: wood, tex: 1.2 });
  F.box('flat', 0, 0.12, -d / 2 + 0.08, w - 0.22, h - 0.3, 0.32, { color: '#2e2016' });
  const rows = Math.round((h - 0.3) / 0.55);
  for (let r = 0; r < rows; r++) {
    const y = 0.14 + r * ((h - 0.35) / rows);
    F.box('wood', 0, y, -d / 2 + 0.03, w - 0.12, 0.07, d - 0.06, { color: '#a87444' });
    let x = -w / 2 + 0.17;
    const fill = 0.8 + rng() * 0.2;
    while (x < -w / 2 + 0.17 + (w - 0.4) * fill) {
      const bw = 0.07 + rng() * 0.09, bh = 0.3 + rng() * 0.17;
      const lean = rng() < 0.07;
      F.box('flat', x + bw / 2, y + 0.07, -d / 2 + 0.2, bw, bh, 0.26, { color: cols[(rng() * cols.length) | 0], rotZ: lean ? 0.28 : 0, jitter: 0.08 });
      if (rng() < 0.12) F.box('metal', x + bw / 2, y + 0.07 + bh * 0.6, -d / 2 + 0.335, bw + 0.005, 0.02, 0.01, { color: PAL.brass });
      x += bw + 0.012;
    }
    if (fill < 0.9) F.cyl('flat', -w / 2 + 0.17 + (w - 0.4) * fill + 0.2, y + 0.07, -d / 2 + 0.2, 0.09, 0.09, 0.2, { seg: 8, color: ['#e8d8b0', '#8fb8d0', '#c9a070'][(rng() * 3) | 0] });
  }
  F.box('wood', 0, h, -d / 2, w + 0.12, 0.1, d + 0.12, { color: '#6a4528' });
  F.box('wood', 0, h + 0.1, -d / 2 - 0.02, w - 0.1, 0.1, d - 0.1, { color: '#8a5a34' });
  for (const sx of [-1, 1]) F.box('wood', sx * (w / 2 - 0.04), 0, 0.0, 0.1, h, 0.06, { color: '#6a4528' });
  if (p.top !== 'none') {
    for (let i = 0; i < 3; i++) F.cyl('flat', -w / 2 + 0.4 + i * (w - 0.8) / 2, h + 0.2, -d / 2, 0.1, 0.12, 0.28, { seg: 8, color: ['#8fb8d0', '#e8d8b0', '#c9704a'][(i + ((rng() * 3) | 0)) % 3] });
  }
  const rect = rotRect(F, -w / 2, -d, w / 2, 0);
  const ip = F.world(0, 0.95);
  reg(ctx, p, rect, { type: 'bookshelf', x: ip[0], z: ip[1], r: 1.4, label: 'Bookshelf', text: 'Rows of well-thumbed books.' });
});

export const armchair = furn('Plush armchair. params: x,z,dir=s,color', (ctx, p, F) => {
  const col = p.color || '#a8453f';
  F.box('wood', 0, 0, 0, 0.9, 0.22, 0.85, { color: '#5a3a24' });
  F.box('cloth', 0, 0.2, 0.02, 0.84, 0.3, 0.78, { color: col, jitter: 0.03 });
  F.box('cloth', 0, 0.2, -0.36, 0.9, 0.95, 0.2, { color: col, jitter: -0.06 });
  for (const sx of [-1, 1]) F.box('cloth', sx * 0.42, 0.2, 0.02, 0.18, 0.55, 0.8, { color: col, jitter: -0.04 });
  F.ball('cloth', -0.18, 0.62, 0.08, 0.19, { color: '#f0d8a0', detail: 1, sy: 0.7 });
  ctx.solid(p.x - 0.5, p.z - 0.45, p.x + 0.5, p.z + 0.45, { tile: false });
  ctx.bake({ type: 'rect', x: p.x - 0.5, z: p.z - 0.42, w: 1.0, d: 0.95, a: 0.35, blur: 0.25 });
});
