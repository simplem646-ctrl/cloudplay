/**
 * Park + harbor extras: gazebo, swing, net rack, shells, bollard, petals, floating lanterns.
 * Registered via props/index.js. Tile coordinates, x east / z south.
 */
import * as THREE from 'three';
import { mulberry32 } from '../../core/util.js';
import { PAL, frame } from './util.js';

export const gazebo = {
  doc: 'Hexagonal wooden gazebo with deck, rails (open to the south) and a pointed roof. params: x,z (centre),r=2.1,roof:"blue"|"red"|"green", id',
  build(ctx, p) {
    const mb = ctx.mb;
    const r = p.r ?? 2.1, H = 2.7;
    const roofCol = { blue: '#6c98cc', red: '#da6252', green: '#79ae7e', plum: '#a97fb4' }[p.roof || 'green'];
    mb.cyl('stone', p.x, 0, p.z, r + 0.35, r + 0.45, 0.22, { seg: 6, color: '#cfc7b8', tex: 1.4, ao: { k: 0.3, h: 0.3 }, rotY: Math.PI / 6 });
    mb.cyl('wood', p.x, 0.2, p.z, r + 0.15, r + 0.15, 0.1, { seg: 6, color: '#c89a68', tex: 1.2, rotY: Math.PI / 6 });
    for (let i = 0; i < 4; i++) mb.cyl('stone', p.x, 0, p.z + r + 0.5 + i * 0.0, 0.01, 0.01, 0.01, { seg: 3 });
    // front steps
    mb.box('stone', p.x, 0, p.z + r + 0.35, 1.8, 0.14, 0.45, { color: '#e8e0cc', tex: 1.2 });
    mb.box('stone', p.x, 0, p.z + r + 0.7, 2.0, 0.08, 0.35, { color: '#e8e0cc', tex: 1.2 });
    const posts = [];
    for (let i = 0; i < 6; i++) {
      const a = Math.PI / 6 + (i / 6) * Math.PI * 2 + Math.PI / 6; // flat edge faces south
      posts.push([p.x + Math.cos(a) * r, p.z + Math.sin(a) * r, a]);
    }
    posts.forEach(([x, z], i) => {
      mb.cyl('wood', x, 0.3, z, 0.09, 0.11, H - 0.3, { seg: 8, color: '#fff4de', tex: 1 });
      mb.cyl('trim', x, 0.3, z, 0.15, 0.15, 0.12, { seg: 8, color: '#fff4de' });
      ctx.solidCircle(x, z, 0.16, { tile: false });
      const [nx, nz] = posts[(i + 1) % 6];
      const sx = (x + nx) / 2, sz = (z + nz) / 2;
      const ang = Math.atan2(-(nz - z), nx - x);
      const L = Math.hypot(nx - x, nz - z);
      // south-facing edge stays open (the entrance)
      const open = sz > p.z + r * 0.7;
      mb.box('wood', sx, 2.3, sz, L, 0.14, 0.14, { color: '#fff4de', rotY: ang });
      if (!open) {
        mb.box('wood', sx, 0.95, sz, L, 0.07, 0.07, { color: '#fff4de', rotY: ang });
        mb.box('wood', sx, 0.35, sz, L, 0.07, 0.07, { color: '#fff4de', rotY: ang });
        for (let k = 1; k < 5; k++) {
          const u = k / 5;
          mb.box('wood', x + (nx - x) * u, 0.35, z + (nz - z) * u, 0.05, 0.65, 0.05, { color: '#fff4de' });
        }
        ctx.solid(Math.min(x, nx) - 0.05, Math.min(z, nz) - 0.05, Math.max(x, nx) + 0.05, Math.max(z, nz) + 0.05, { tile: false });
      }
    });
    // roof
    mb.cyl('trim', p.x, H, p.z, r + 0.55, r + 0.62, 0.18, { seg: 6, color: '#fff4de', rotY: Math.PI / 6 });
    mb.cone('shingle', p.x, H + 0.16, p.z, r + 0.75, 1.5, { seg: 6, color: roofCol, rotY: Math.PI / 6 });
    mb.cone('flat', p.x, H + 1.6, p.z, 0.12, 0.3, { seg: 6, color: PAL.brass });
    mb.ball('metal', p.x, H + 1.95, p.z, 0.09, { color: PAL.brass, detail: 0 });
    ctx.mbFor('winter').cone('snow', p.x, H + 0.3, p.z, r + 0.65, 1.3, { seg: 6, rotY: Math.PI / 6 });
    // hanging lantern + bench inside
    mb.cyl('flat', p.x, H - 0.55, p.z, 0.015, 0.015, 0.55, { seg: 4, color: '#3c3844' });
    mb.box('glass', p.x, H - 0.85, p.z, 0.22, 0.3, 0.22, { color: '#ffffff' });
    mb.box('metal', p.x, H - 0.58, p.z, 0.28, 0.05, 0.28, { color: PAL.iron });
    for (const sx of [-1, 1]) mb.box('wood', p.x + sx * (r - 0.55), 0.3, p.z - 0.2, 0.4, 0.45, 1.5, { color: '#a87444', tex: 1 });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.1, rx: r + 0.9, rz: r + 0.8, a: 0.4, blur: 0.35 });
    ctx.surface(p.x - r, p.z - r, p.x + r, p.z + r + 0.6, 'wood');
    ctx.interactable(p, { x: p.x, z: p.z + 0.6, r: 1.8, type: 'object', label: 'Gazebo', text: 'A white gazebo with a view of the brook. Perfect for a quiet moment.' });
  },
};

export const swing = {
  doc: 'Wooden swing set with two swinging seats. params: x,z (centre),w=3',
  build(ctx, p) {
    const mb = ctx.mb;
    const w = p.w ?? 3, top = 2.5;
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) mb.cyl('wood', p.x + sx * (w / 2), 0, p.z + sz * 0.7 * (1 - 0.0), 0.07, 0.09, top, { seg: 6, color: '#b0764a', rotZ: 0 });
    }
    mb.cyl('wood', p.x, top - 0.02, p.z, 0.08, 0.08, w + 0.4, { seg: 6, color: '#8a5a34', rotZ: Math.PI / 2 });
    for (const sx of [-1, 1]) {
      mb.box('wood', p.x + sx * (w / 2), top * 0.5, p.z - 0.35, 0.06, 0.06, 1.4, { color: '#8a5a34', rotX: 0.3 });
    }
    const seats = [];
    for (const sx of [-0.6, 0.6]) {
      const piv = new THREE.Group();
      piv.position.set(p.x + sx, top - 0.04, p.z);
      const col = (c) => { const g = new THREE.BoxGeometry(0.05, 0.05, 0.05); return g; };
      for (const dx of [-0.2, 0.2]) {
        const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, top - 0.5, 4), ctx.mats.metal);
        const arr = new Float32Array(chain.geometry.attributes.position.count * 3).fill(0.4);
        chain.geometry.setAttribute('color', new THREE.BufferAttribute(arr, 3));
        chain.position.set(dx, -(top - 0.5) / 2, 0);
        piv.add(chain);
      }
      const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.22), ctx.mats.wood);
      const arr = new Float32Array(seat.geometry.attributes.position.count * 3);
      const c = new THREE.Color(sx < 0 ? '#d9534a' : '#4f9ac8');
      for (let i = 0; i < arr.length; i += 3) { arr[i] = c.r; arr[i + 1] = c.g; arr[i + 2] = c.b; }
      seat.geometry.setAttribute('color', new THREE.BufferAttribute(arr, 3));
      seat.position.set(0, -(top - 0.5), 0);
      piv.add(seat);
      ctx.object(piv);
      seats.push(piv);
    }
    const ph = (p.x * 1.3) % 6;
    ctx.updater((dt, t) => { seats.forEach((s, i) => { s.rotation.x = Math.sin(t * 1.5 + ph + i * 1.7) * 0.2 * (0.6 + 0.4 * Math.sin(t * 0.4 + i)); }); });
    ctx.solid(p.x - w / 2 - 0.1, p.z - 0.8, p.x + w / 2 + 0.1, p.z + 0.8, { tile: false });
    ctx.bake({ type: 'rect', x: p.x - w / 2 - 0.4, z: p.z - 0.9, w: w + 0.8, d: 1.8, a: 0.3, blur: 0.4 });
    ctx.interactable(p, { x: p.x, z: p.z + 1.4, r: 1.4, type: 'object', label: 'Swing', text: 'The swing creaks happily. Maybe later.' });
  },
};

export const net_rack = {
  doc: 'Fishing-net drying rack: two posts, a beam and a draped net with floats. params: x,z (centre),w=3.2,rot',
  build(ctx, p) {
    const w = p.w ?? 3.2;
    const F = frame(ctx.mb, p.x, 0, p.z, p.rot ?? 0);
    const rng = mulberry32(Math.floor(p.x * 5 + p.z));
    for (const sx of [-1, 1]) F.box('wooddark', sx * (w / 2), 0, 0, 0.14, 2.3, 0.14, { color: '#7a5a3a', tex: 1 });
    F.box('wooddark', 0, 2.1, 0, w + 0.3, 0.12, 0.12, { color: '#8a6a44' });
    const n = 12;
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + 0.15 + (i / (n - 1)) * (w - 0.3);
      const len = 1.1 + Math.sin(i / (n - 1) * Math.PI) * 0.55 + rng() * 0.12;
      F.box('cloth', x, 2.1 - len, 0.05, 0.05, len, 0.04, { color: '#c9b484' });
    }
    for (let r = 0; r < 5; r++) {
      const y = 2.0 - r * 0.28;
      F.box('cloth', 0, y, 0.05, w - 0.25 - r * 0.3, 0.035, 0.035, { color: '#c9b484' });
    }
    for (let i = 0; i < 6; i++) F.ball('flat', -w / 2 + 0.3 + i * ((w - 0.6) / 5), 2.0, 0.1, 0.08, { color: i % 2 ? '#d9534a' : '#fff4e0', detail: 0 });
    // pile of net + floats at the foot
    F.ball('cloth', w * 0.2, 0.15, 0.5, 0.3, { color: '#b9a478', detail: 1, sy: 0.55, sx: 1.4 });
    F.ball('flat', w * 0.2 + 0.4, 0.1, 0.6, 0.1, { color: '#d9534a', detail: 0 });
    ctx.solid(p.x - w / 2 - 0.1, p.z - 0.15, p.x + w / 2 + 0.1, p.z + 0.15, { tile: false });
    ctx.bake({ type: 'rect', x: p.x - w / 2 - 0.2, z: p.z - 0.2, w: w + 0.6, d: 1.1, a: 0.3, blur: 0.3 });
    ctx.interactable(p, { x: p.x, z: p.z + 1.2, r: 1.4, type: 'object', label: 'Net rack', text: 'Nets hang here to dry, smelling of salt and sunshine.' });
  },
};

export const shells = {
  doc: 'Scatter of shells, starfish and pebbles on sand. params: x,z,n=10,r=1.2',
  build(ctx, p) {
    const rng = mulberry32(Math.floor(p.x * 13 + p.z * 7));
    const n = p.n ?? 10, r = p.r ?? 1.2;
    const cols = ['#fff1e6', '#f7c8b8', '#fbe3c4', '#e8a8a0', '#ffffff'];
    for (let i = 0; i < n; i++) {
      const a = rng() * 6.28, d = Math.sqrt(rng()) * r;
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      const t = rng();
      if (t < 0.5) ctx.mb.ball('flat', x, 0.03, z, 0.07 + rng() * 0.04, { color: cols[(rng() * cols.length) | 0], detail: 1, sy: 0.55, sx: 1.2, rotY: rng() * 3 });
      else if (t < 0.75) ctx.mb.cone('flat', x, 0.0, z, 0.08, 0.14, { seg: 5, color: cols[(rng() * cols.length) | 0], rotZ: 1.2, rotY: rng() * 6 });
      else if (t < 0.9) ctx.mb.cyl('flat', x, 0.0, z, 0.1, 0.1, 0.03, { seg: 5, color: '#e8825a', rotY: rng() * 3 });
      else ctx.mb.ball('flat', x, 0.02, z, 0.06, { color: '#a8a2a0', detail: 1, sy: 0.6 });
    }
  },
};

export const bollard = {
  doc: 'Mooring bollard with a coil of rope. params: x,z,scale=1',
  build(ctx, p) {
    const s = p.scale ?? 1;
    ctx.mb.cyl('wooddark', p.x, 0, p.z, 0.13 * s, 0.17 * s, 0.55 * s, { seg: 8, color: '#5a4636' });
    ctx.mb.cyl('flat', p.x, 0.42 * s, p.z, 0.2 * s, 0.2 * s, 0.07 * s, { seg: 8, color: '#c9b484' });
    ctx.mb.cyl('flat', p.x, 0.3 * s, p.z, 0.2 * s, 0.2 * s, 0.07 * s, { seg: 8, color: '#b9a474' });
    ctx.solidCircle(p.x, p.z, 0.18 * s, { tile: false });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.03, rx: 0.4, rz: 0.34, a: 0.3, blur: 0.2 });
  },
};

export const petals = {
  doc: 'Drift of fallen petals (decor). params: x,z,n=40,r=2,colors',
  build(ctx, p) {
    const rng = mulberry32(Math.floor(p.x * 3 + p.z * 11));
    const cols = p.colors || ['#ffc4d6', '#ffd9e4', '#ffb0c8', '#fff0f4'];
    for (let i = 0; i < (p.n ?? 40); i++) {
      const a = rng() * 6.28, d = Math.sqrt(rng()) * (p.r ?? 2);
      ctx.mb.ball('flat', p.x + Math.cos(a) * d, 0.035, p.z + Math.sin(a) * d * 0.8, 0.045 + rng() * 0.03, { color: cols[(rng() * cols.length) | 0], detail: 0, sy: 0.12, rotY: rng() * 3 });
    }
  },
};

export const floating_lanterns = {
  doc: 'Paper lanterns floating on water, gently bobbing (decor). params: pts:[[x,z],...], colors',
  build(ctx, p) {
    const cols = p.colors || ['#ff8a5a', '#ffd23f', '#ff7fa3', '#ffb347'];
    const items = [];
    const sprites = [];
    p.pts.forEach(([x, z], i) => {
      const col = cols[i % cols.length];
      const g = new THREE.Group();
      g.position.set(x, 0.05, z);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.05, 8), ctx.mats.wood);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.26), ctx.mats.glow);
      body.position.y = 0.18;
      const cap = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 4), ctx.mats.flat || ctx.mats.wood);
      cap.position.y = 0.38;
      cap.rotation.y = Math.PI / 4;
      for (const m of [base, body, cap]) {
        const c = new THREE.Color(m === base ? '#8a5a34' : m === cap ? '#d98a5a' : col);
        const arr = new Float32Array(m.geometry.attributes.position.count * 3);
        for (let k = 0; k < arr.length; k += 3) { arr[k] = c.r; arr[k + 1] = c.g; arr[k + 2] = c.b; }
        m.geometry.setAttribute('color', new THREE.BufferAttribute(arr, 3));
        g.add(m);
      }
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0, color: col }));
      s.scale.set(1.8, 1.8, 1);
      s.position.set(x, 0.3, z);
      ctx.root.add(s);
      sprites.push(s);
      ctx.object(g, { cast: false });
      items.push({ g, s, ph: i * 1.9 + x });
    });
    ctx.updater((dt, t, env) => {
      const o = 0.2 + env.glow * 0.7;
      for (const it of items) {
        const y = 0.05 + Math.sin(t * 1.4 + it.ph) * 0.015;
        it.g.position.y = y;
        it.g.rotation.z = Math.sin(t * 1.1 + it.ph) * 0.06;
        it.s.position.y = y + 0.28;
        it.s.material.opacity = o * (0.9 + Math.sin(t * 3 + it.ph) * 0.1);
      }
    });
  },
};

export const pumpkins = {
  doc: 'Pile of pumpkins and gourds (harvest decor). params: x,z,n=6,r=0.7',
  build(ctx, p) {
    const rng = mulberry32(Math.floor(p.x * 17 + p.z * 5));
    const cols = ['#f08a2a', '#e8741e', '#f4a040', '#d9651a', '#f7f0d8', '#7aa04a'];
    for (let i = 0; i < (p.n ?? 6); i++) {
      const a = rng() * 6.28, d = Math.sqrt(rng()) * (p.r ?? 0.7);
      const x = p.x + Math.cos(a) * d, z = p.z + Math.sin(a) * d;
      const s = 0.2 + rng() * 0.16;
      const c = cols[(rng() * (rng() < 0.8 ? 4 : 6)) | 0];
      ctx.mb.ball('flat', x, s * 0.7, z, s, { color: c, detail: 1, sy: 0.78 });
      ctx.mb.cone('flat', x, s * 1.35, z, 0.05, 0.14, { seg: 4, color: '#5a7a34', rotZ: (rng() - 0.5) * 0.4 });
    }
  },
};
