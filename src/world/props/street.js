/** Street furniture & outdoor props. Documented in PROPS.md. */
import * as THREE from 'three';
import { mulberry32 } from '../../core/util.js';
import { PAL, frame, awningMat, signMat, cachedMat, colorize } from './util.js';
import { makeCanvas } from '../textures.js';
import { placeMatrix } from '../geo.js';

const dirRot = { s: 0, e: Math.PI / 2, n: Math.PI, w: -Math.PI / 2 };

function lampMats(ctx) {
  const m = ctx.mats;
  if (!m.lamp_lit) {
    m.lamp_lit = new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffd68a') });
    m.lamp_unlit = new THREE.MeshLambertMaterial({ color: new THREE.Color('#6b8190'), emissive: new THREE.Color('#0a1218'), transparent: true, opacity: 0.88 });
    m.lamp_broken = new THREE.MeshLambertMaterial({ color: new THREE.Color('#3a4650'), emissive: new THREE.Color('#05080a'), transparent: true, opacity: 0.7 });
    m.lampIron = new THREE.MeshLambertMaterial({ vertexColors: true });
  }
  return m;
}

export const lamp_post = {
  doc: 'Street lamp. params: x,z,id (lamp_<code>_<n> => lamp interactable), state?, h=3.2',
  build(ctx, p) {
    const m = lampMats(ctx);
    const mb = ctx.mb;
    const h = p.h ?? 3.2;
    const x = p.x, z = p.z;
    mb.cyl('stone', x, 0, z, 0.2, 0.28, 0.32, { seg: 8, color: '#9d948a', tex: 1 });
    mb.cyl('metal', x, 0.3, z, 0.075, 0.1, h - 0.5, { seg: 7, color: '#35323d' });
    mb.cyl('metal', x, 0.9, z, 0.13, 0.13, 0.1, { seg: 7, color: '#35323d' });
    mb.cyl('metal', x, h - 0.4, z, 0.16, 0.1, 0.18, { seg: 7, color: '#35323d' });
    const head = new THREE.Group();
    head.position.set(x, h - 0.2, z);
    const glassMat = m.lamp_unlit;
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.15, 0.5, 6), glassMat);
    glass.position.y = 0.28;
    const frameMat = m.lampIron;
    const mk = (g, y, col) => { colorize(g, col); const me = new THREE.Mesh(g, frameMat); me.position.y = y; head.add(me); };
    mk(new THREE.CylinderGeometry(0.26, 0.2, 0.08, 6), 0.02, '#2f2c36');
    mk(new THREE.ConeGeometry(0.34, 0.26, 6), 0.7, '#2f2c36');
    mk(new THREE.SphereGeometry(0.06, 6, 4), 0.88, '#e8c05a');
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * 6.283;
      const b = new THREE.Mesh(colorize(new THREE.BoxGeometry(0.035, 0.5, 0.035), '#2f2c36'), frameMat);
      b.position.set(Math.cos(a) * 0.19, 0.28, Math.sin(a) * 0.19);
      b.rotation.z = 0;
      head.add(b);
    }
    head.add(glass);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#fff3c0' }));
    flame.position.y = 0.28;
    flame.visible = false;
    head.add(flame);
    ctx.object(head);
    // halo + ground pool
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0 }));
    halo.scale.set(3.4, 3.4, 1);
    halo.position.set(x, h + 0.05, z);
    ctx.root.add(halo);
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(6.2, 6.2), new THREE.MeshBasicMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0, color: '#ffb468' }));
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(x, 0.045, z + 0.4);
    pool.renderOrder = 3;
    ctx.root.add(pool);
    ctx.bake({ type: 'ellipse', x, z, rx: 0.5, rz: 0.4, a: 0.35 });
    ctx.solidCircle(x, z, 0.2);
    let state = 'unlit';
    const lamp = {
      id: p.id, x, z,
      setState(s) {
        state = s;
        glass.material = s === 'lit' ? m.lamp_lit : s === 'broken' ? m.lamp_broken : m.lamp_unlit;
        flame.visible = s === 'lit';
        head.rotation.z = s === 'broken' ? 0.12 : 0;
        head.rotation.x = s === 'broken' ? -0.06 : 0;
        glass.scale.y = s === 'broken' ? 0.7 : 1;
      },
      update(dt, t, env) {
        const on = state === 'lit' ? Math.max(env.glow, env.weather === 'sunny' ? 0.06 : 0.25) : 0;
        const fl = 0.94 + Math.sin(t * 7 + x) * 0.03 + Math.sin(t * 13 + z) * 0.03;
        halo.material.opacity = on * fl;
        pool.material.opacity = on * 0.75 * fl;
        halo.visible = on > 0.01;
        pool.visible = on > 0.01;
      },
    };
    lamp.setState(p.state || (p.id ? 'unlit' : 'lit'));
    ctx.lamp(lamp);
    ctx.interactable(p, { type: 'lamp', x, z: z + 0.9, r: 1.3, label: 'Street lamp', text: 'An old street lamp.' });
  },
};

export const bench = {
  doc: 'Park bench. params: x,z,dir (s|e|w|n = way it faces), id, w=1.9',
  build(ctx, p) {
    const dir = p.dir || 's';
    const rot = dirRot[dir] ?? 0;
    const w = p.w ?? 1.9;
    const F = frame(ctx.mb, p.x, 0, p.z, rot);
    const wood = p.color || '#b9824f';
    for (let i = 0; i < 3; i++) F.box('wood', 0, 0.5, -0.18 + i * 0.18, w, 0.05, 0.15, { color: wood, tex: 1.4 });
    for (let i = 0; i < 3; i++) F.box('wood', 0, 0.72 + i * 0.17, -0.42 - i * 0.04, w, 0.13, 0.05, { color: wood, tex: 1.4 });
    for (const sx of [-1, 1]) {
      F.box('metal', sx * (w / 2 - 0.1), 0, -0.05, 0.07, 0.5, 0.55, { color: PAL.iron });
      F.box('metal', sx * (w / 2 - 0.1), 0.5, -0.42, 0.07, 0.62, 0.07, { color: PAL.iron });
      F.box('metal', sx * (w / 2 - 0.1), 0.5, -0.2, 0.07, 0.07, 0.34, { color: PAL.iron });
    }
    const Fs = frame(ctx.mbFor('winter'), p.x, 0, p.z, rot);
    Fs.box('snow', 0, 0.55, 0, w, 0.07, 0.55, {});
    const vx = Math.abs(Math.sin(rot)) > 0.5;
    ctx.bake({ type: 'rect', x: p.x - (vx ? 0.6 : w / 2 + 0.1), z: p.z - (vx ? w / 2 + 0.1 : 0.55), w: vx ? 1.2 : w + 0.2, d: vx ? w + 0.2 : 1.1, a: 0.3, blur: 0.25 });
    ctx.solid(p.x - (vx ? 0.35 : w / 2), p.z - (vx ? w / 2 : 0.35), p.x + (vx ? 0.35 : w / 2), p.z + (vx ? w / 2 : 0.35), { tile: false });
    const off = { s: [0, 1.0], n: [0, -1.0], e: [1.0, 0], w: [-1.0, 0] }[dir];
    ctx.interactable(p, { type: 'bench', x: p.x + off[0], z: p.z + off[1], r: 1.2, facing: dir === 's' ? 'n' : dir === 'n' ? 's' : dir === 'e' ? 'w' : 'e' });
  },
};

export const fence = {
  doc: 'Fence/wall along a polyline. kind: picket|rail|stone. params: pts:[[x,z],...], gaps:[[arcStart,arcEnd]], color, h',
  build(ctx, p) {
    const kind = p.kind || 'picket';
    const col = p.color || (kind === 'stone' ? '#b3ab9c' : kind === 'picket' ? '#fbf3e2' : '#b98a5a');
    const mat = kind === 'stone' ? 'stone' : kind === 'picket' ? 'trim' : 'wood';
    const H = p.h ?? (kind === 'stone' ? 0.8 : 0.85);
    const gaps = p.gaps || [];
    let arc = 0;
    const inGap = (a) => gaps.some((g) => a > g[0] && a < g[1]);
    const rng = mulberry32(7);
    const sb = ctx.mbFor('winter');
    for (let i = 0; i < p.pts.length - 1; i++) {
      const [ax, az] = p.pts[i], [bx, bz] = p.pts[i + 1];
      const L = Math.hypot(bx - ax, bz - az);
      const ux = (bx - ax) / L, uz = (bz - az) / L;
      const ang = Math.atan2(ux, uz) - Math.PI / 2 + Math.PI / 2; // box local x along segment => rotY
      const rotY = Math.atan2(-uz, ux);
      // sub-run list
      const cuts = [0, L];
      for (const g of gaps) for (const c of g) { const l = c - arc; if (l > 0 && l < L) cuts.push(l); }
      cuts.sort((a, b) => a - b);
      for (let k = 0; k < cuts.length - 1; k++) {
        const s0 = cuts[k], s1 = cuts[k + 1];
        if (s1 - s0 < 0.05 || inGap(arc + (s0 + s1) / 2)) continue;
        const len = s1 - s0;
        const cx = ax + ux * (s0 + s1) / 2, cz = az + uz * (s0 + s1) / 2;
        if (kind === 'stone') {
          ctx.mb.box('stone', cx, 0, cz, len, H, 0.5, { rotY, color: col, tex: 1.4, ao: { k: 0.3, h: 0.5 }, jitter: 0.04 });
          ctx.mb.box('stone', cx, H, cz, len + 0.05, 0.16, 0.62, { rotY, color: '#c9c1b2', tex: 1.2 });
          sb.box('snow', cx, H + 0.14, cz, len, 0.1, 0.6, { rotY });
        } else {
          ctx.mb.box(mat, cx, H * 0.6, cz, len, 0.08, 0.05, { rotY, color: col, tex: 1.2 });
          ctx.mb.box(mat, cx, H * 0.25, cz, len, 0.08, 0.05, { rotY, color: col, tex: 1.2 });
          sb.box('snow', cx, H * 0.6 + 0.07, cz, len, 0.06, 0.09, { rotY });
          if (kind === 'picket') {
            const n = Math.floor(len / 0.3);
            for (let q = 0; q <= n; q++) {
              const d = s0 + (q + 0.5) * (len / (n + 1)) ;
              const px = ax + ux * (s0 + (q + 0.5) * len / (n + 1)), pz = az + uz * (s0 + (q + 0.5) * len / (n + 1));
              void d;
              const hh = H + (rng() - 0.5) * 0.06;
              ctx.mb.box(mat, px, 0, pz, 0.15, hh, 0.045, { rotY, color: col, tex: 1, ao: { k: 0.2, h: 0.3 } });
              ctx.mb.cone(mat, px, hh, pz, 0.1, 0.12, { seg: 4, color: col, rotY: rotY + Math.PI / 4, tex: 1 });
            }
          }
        }
        // posts at both run ends
        for (const s of [s0, s1]) {
          const px = ax + ux * s, pz = az + uz * s;
          if (kind !== 'stone') {
            ctx.mb.box(mat, px, 0, pz, 0.14, H + 0.18, 0.14, { color: col, tex: 1 });
            ctx.mb.cone(mat, px, H + 0.18, pz, 0.12, 0.1, { seg: 4, color: col });
          }
        }
        // collision
        if (Math.abs(ux) > 0.99 || Math.abs(uz) > 0.99) {
          const t = kind === 'stone' ? 0.3 : 0.12;
          ctx.solid(cx - Math.abs(ux) * len / 2 - t * Math.abs(uz), cz - Math.abs(uz) * len / 2 - t * Math.abs(ux), cx + Math.abs(ux) * len / 2 + t * Math.abs(uz), cz + Math.abs(uz) * len / 2 + t * Math.abs(ux));
        } else {
          for (let s = s0; s < s1; s += 0.3) ctx.solidCircle(ax + ux * s, az + uz * s, 0.16);
        }
        ctx.bake({ type: 'ellipse', x: cx, z: cz + 0.08, rx: len / 2 + 0.15, rz: 0.22, a: 0.3, blur: 0.18 });
      }
      arc += L;
    }
  },
};

export const signpost = {
  doc: 'Signpost with wooden board. params: x,z,text,id (sign interactable),dir',
  build(ctx, p) {
    const mb = ctx.mb;
    mb.box('wood', p.x, 0, p.z, 0.16, 1.9, 0.16, { color: '#9a6a3e', tex: 1.2, ao: { k: 0.3, h: 0.5 } });
    mb.cone('wood', p.x, 1.9, p.z, 0.14, 0.12, { seg: 4, color: '#9a6a3e' });
    const text = p.board || p.label || 'Lanternbrook';
    const key = signMat(ctx, text, { w: 320, h: 112, bg: '#e8c88c' });
    mb.add(key, new THREE.PlaneGeometry(1.7, 0.6), { matrix: placeMatrix(p.x, 1.52, p.z + 0.1, { rotZ: (p.tilt ?? 0.04) }) });
    mb.box('wood', p.x, 1.2, p.z + 0.07, 1.78, 0.68, 0.05, { color: '#7a4a28', tex: 1.2, rotZ: p.tilt ?? 0.04 });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: 0.5, rz: 0.4, a: 0.35 });
    ctx.solidCircle(p.x, p.z, 0.2);
    ctx.interactable(p, { type: 'sign', x: p.x, z: p.z + 1.0, r: 1.2, label: 'Sign' });
  },
};

export const mailbox = {
  doc: 'Mailbox on a post. params: x,z,id,color',
  build(ctx, p) {
    const mb = ctx.mb;
    const c = p.color || '#4f7fb5';
    mb.box('wood', p.x, 0, p.z, 0.12, 1.0, 0.12, { color: '#8a5a34', ao: { k: 0.3, h: 0.5 } });
    mb.box('flat', p.x, 1.0, p.z, 0.56, 0.34, 0.4, { color: c });
    mb.cyl('flat', p.x, 1.34, p.z, 0.2, 0.2, 0.4, { seg: 8, color: c, rotX: Math.PI / 2, sx: 1.4 });
    mb.box('flat', p.x + 0.32, 1.1, p.z, 0.03, 0.24, 0.05, { color: '#d9423f' });
    mb.box('flat', p.x + 0.32, 1.3, p.z, 0.03, 0.16, 0.16, { color: '#d9423f' });
    ctx.mbFor('winter').box('snow', p.x, 1.52, p.z, 0.3, 0.08, 0.3, {});
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: 0.45, rz: 0.35, a: 0.35 });
    ctx.solidCircle(p.x, p.z, 0.2);
    ctx.interactable(p, { type: 'mailbox', x: p.x, z: p.z + 0.9, r: 1.2, label: 'Mailbox', text: 'The mailbox is a little crooked.' });
  },
};

export const noticeboard = {
  doc: 'Notice board with pinned notes. params: x,z,id,w=2.6',
  build(ctx, p) {
    const mb = ctx.mb;
    const w = p.w ?? 2.6;
    for (const sx of [-1, 1]) mb.box('wood', p.x + sx * (w / 2 - 0.05), 0, p.z, 0.16, 2.3, 0.16, { color: '#8a5a34', ao: { k: 0.3, h: 0.5 } });
    mb.box('wood', p.x, 0.9, p.z + 0.02, w, 1.2, 0.1, { color: '#a77848', tex: 1 });
    mb.box('flat', p.x, 0.98, p.z + 0.09, w - 0.2, 1.04, 0.03, { color: '#c89a64' });
    mb.box('wood', p.x, 2.05, p.z, w + 0.5, 0.14, 0.5, { color: '#7a4a28', rotX: 0.12 });
    ctx.mbFor('winter').box('snow', p.x, 2.15, p.z - 0.02, w + 0.5, 0.1, 0.5, { rotX: 0.12 });
    const rng = mulberry32(31);
    const cols = ['#fff6e0', '#ffe3a8', '#ffc9d6', '#cfe6ff', '#d6f0c8'];
    for (let i = 0; i < 7; i++) {
      const nx = p.x - w / 2 + 0.3 + rng() * (w - 0.6), ny = 0.62 + rng() * 0.7;
      mb.box('flat', nx, ny, p.z + 0.115, 0.34, 0.4, 0.015, { color: cols[i % 5], rotZ: (rng() - 0.5) * 0.3 });
      mb.ball('flat', nx, ny + 0.34, p.z + 0.13, 0.03, { color: '#d9423f', detail: 0 });
    }
    ctx.bake({ type: 'rect', x: p.x - w / 2 - 0.2, z: p.z - 0.3, w: w + 0.4, d: 0.8, a: 0.35, blur: 0.25 });
    ctx.solid(p.x - w / 2, p.z - 0.2, p.x + w / 2, p.z + 0.2);
    ctx.interactable(p, { type: 'noticeboard', x: p.x, z: p.z + 1.1, r: 1.5, label: 'Notice board' });
  },
};

export const crates = {
  doc: 'Stack of crates. params: x,z,n=2,rot',
  build(ctx, p) {
    const rng = mulberry32(p.seed ?? Math.floor(p.x * 3 + p.z * 11));
    const n = p.n ?? 2;
    for (let i = 0; i < n; i++) {
      const s = 0.8 + rng() * 0.15;
      const cx = p.x + (i === 2 ? 0.1 : i * 0.85), cz = p.z + (i === 1 ? 0.12 : 0);
      const y = i === 2 ? s : 0;
      const col = ['#b58452', '#a97a4a', '#c19059'][i % 3];
      ctx.mb.box('wood', cx, y, cz, s, s, s, { color: col, rotY: (rng() - 0.5) * 0.3, tex: 0.9, ao: { k: 0.3, h: 0.4 } });
      for (const dz of [-1, 1]) ctx.mb.box('wood', cx, y + s * 0.2, cz + dz * s * 0.5, s * 1.02, 0.1, 0.03, { color: '#7a5030', rotY: 0 });
      ctx.mbFor('winter').box('snow', cx, y + s, cz, s * 0.95, 0.07, s * 0.95, {});
    }
    ctx.bake({ type: 'rect', x: p.x - 0.55, z: p.z - 0.55, w: n * 0.85 + 0.3, d: 1.3, a: 0.4, blur: 0.25 });
    ctx.solid(p.x - 0.45, p.z - 0.45, p.x + (n > 1 ? 1.3 : 0.45), p.z + 0.45);
    ctx.interactable(p, { x: p.x, z: p.z + 1.1, r: 1.1 });
  },
};

export const barrel = {
  doc: 'Barrel. params: x,z,scale',
  build(ctx, p) {
    const s = p.scale ?? 1;
    const mb = ctx.mb;
    mb.cyl('wood', p.x, 0, p.z, 0.36 * s, 0.32 * s, 0.82 * s, { seg: 10, color: '#a87444', tex: 0.9, ao: { k: 0.3, h: 0.4 } });
    mb.cyl('wood', p.x, 0.36 * s, p.z, 0.4 * s, 0.4 * s, 0.1 * s, { seg: 10, color: '#a87444' });
    for (const y of [0.12, 0.62]) mb.cyl('metal', p.x, y * s, p.z, 0.375 * s, 0.375 * s, 0.07 * s, { seg: 10, color: '#4a4650' });
    mb.cyl('wood', p.x, 0.81 * s, p.z, 0.31 * s, 0.31 * s, 0.04, { seg: 10, color: '#d4a56a' });
    ctx.mbFor('winter').cyl('snow', p.x, 0.83 * s, p.z, 0.32 * s, 0.32 * s, 0.07, { seg: 10 });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.03, rx: 0.65 * s, rz: 0.5 * s, a: 0.4 });
    ctx.solidCircle(p.x, p.z, 0.36 * s);
    ctx.interactable(p, { x: p.x, z: p.z + 0.9, r: 1 });
  },
};

export const sack = {
  doc: 'Grain sack. params: x,z',
  build(ctx, p) {
    ctx.mb.ball('cloth', p.x, 0.3, p.z, 0.36, { detail: 1, sy: 0.95, sx: 0.9, color: '#d9c49a', lump: 0.15, seed: 4, ao: { k: 0.3, h: 0.5, y0: 0 } });
    ctx.mb.cyl('cloth', p.x, 0.55, p.z, 0.1, 0.18, 0.18, { seg: 6, color: '#cbb386' });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: 0.5, rz: 0.4, a: 0.35 });
    ctx.solidCircle(p.x, p.z, 0.3);
  },
};

export const well = {
  doc: 'Stone well with little roof. params: x,z',
  build(ctx, p) {
    const mb = ctx.mb;
    mb.cyl('stone', p.x, 0, p.z, 0.8, 0.9, 0.85, { seg: 14, color: '#bfb7a8', tex: 1.4, ao: { k: 0.3, h: 0.6 } });
    mb.cyl('flat', p.x, 0.7, p.z, 0.62, 0.62, 0.05, { seg: 14, color: '#1e5a6e' });
    for (const sx of [-1, 1]) mb.box('wood', p.x + sx * 0.78, 0, p.z, 0.12, 2.4, 0.12, { color: '#8a5a34' });
    mb.box('wood', p.x, 1.55, p.z, 0.12, 0.12, 0.12, { color: '#6a4224' });
    mb.cyl('wood', p.x, 1.6, p.z, 0.08, 0.08, 1.5, { seg: 6, color: '#8a5a34', rotZ: Math.PI / 2 });
    mb.box('shingle', p.x, 2.3, p.z - 0.3, 2.1, 0.12, 0.9, { color: '#d86a52', rotX: 0.5, tex: 1.2 });
    mb.box('shingle', p.x, 2.3, p.z + 0.3, 2.1, 0.12, 0.9, { color: '#d86a52', rotX: -0.5, tex: 1.2 });
    mb.cyl('wood', p.x, 1.1, p.z, 0.02, 0.02, 0.5, { seg: 4, color: '#4a3a2a' });
    mb.cyl('wood', p.x, 0.75, p.z, 0.16, 0.13, 0.28, { seg: 8, color: '#9a6a3e' });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: 1.4, rz: 1.2, a: 0.4 });
    ctx.solidCircle(p.x, p.z, 0.9, { tile: true });
    ctx.interactable(p, { x: p.x, z: p.z + 1.4, r: 1.4, label: 'Well', text: 'The water far below is cool and clear.' });
  },
};

export const woodpile = {
  doc: 'Stacked firewood. params: x,z,w',
  build(ctx, p) {
    const w = p.w ?? 1.6;
    const rng = mulberry32(p.seed ?? 21);
    for (let r = 0; r < 3; r++) {
      const n = Math.round(w / 0.22) - r;
      for (let i = 0; i < n; i++) {
        ctx.mb.cyl('bark', p.x - (n * 0.22) / 2 + i * 0.22 + 0.11, 0.1 + r * 0.19, p.z, 0.1, 0.1, 0.6, { seg: 6, color: ['#c9a07a', '#b98e68', '#d8b088'][(rng() * 3) | 0], rotX: Math.PI / 2, tex: 0.6 });
      }
    }
    ctx.mb.box('wood', p.x - w / 2 - 0.05, 0, p.z, 0.08, 0.7, 0.7, { color: '#7a5030' });
    ctx.mb.box('wood', p.x + w / 2 + 0.05, 0, p.z, 0.08, 0.7, 0.7, { color: '#7a5030' });
    ctx.mbFor('winter').box('snow', p.x, 0.62, p.z, w, 0.08, 0.66, {});
    ctx.bake({ type: 'rect', x: p.x - w / 2 - 0.2, z: p.z - 0.4, w: w + 0.4, d: 0.95, a: 0.4, blur: 0.25 });
    ctx.solid(p.x - w / 2, p.z - 0.35, p.x + w / 2, p.z + 0.35);
  },
};

export const lamp_parts = {
  doc: 'Pile of old lamp posts, lanterns and ironwork (workshop clutter). params: x,z',
  build(ctx, p) {
    const mb = ctx.mb;
    const rng = mulberry32(p.seed ?? 5);
    for (let i = 0; i < 3; i++) mb.cyl('metal', p.x - 0.2 + i * 0.22, 0.12 + i * 0.1, p.z + (rng() - 0.5) * 0.3, 0.06, 0.08, 2.2, { seg: 6, color: '#3b3844', rotZ: Math.PI / 2 + (rng() - 0.5) * 0.2, rotY: (rng() - 0.5) * 0.4 });
    for (let i = 0; i < 3; i++) {
      const lx = p.x + 1.0 + i * 0.5, lz = p.z + 0.25 - (i % 2) * 0.4;
      mb.cyl('metal', lx, 0, lz, 0.2, 0.17, 0.5, { seg: 6, color: '#3b3844' });
      mb.cyl('glass', lx, 0.04, lz, 0.17, 0.14, 0.4, { seg: 6, color: '#ffffff' });
      mb.cone('metal', lx, 0.5, lz, 0.28, 0.2, { seg: 6, color: '#3b3844' });
    }
    mb.box('wood', p.x + 0.4, 0, p.z - 0.65, 1.0, 0.5, 0.7, { color: '#a87444', tex: 0.9 });
    mb.cyl('metal', p.x - 0.7, 0, p.z + 0.5, 0.35, 0.35, 0.12, { seg: 12, color: '#4a4650' });
    ctx.bake({ type: 'rect', x: p.x - 1.4, z: p.z - 1.1, w: 3.9, d: 2.2, a: 0.35, blur: 0.4 });
    ctx.solid(p.x - 1.1, p.z - 0.9, p.x + 2.3, p.z + 0.7);
    ctx.interactable(p, { x: p.x + 0.5, z: p.z + 1.3, r: 1.3, type: 'object', label: 'Lamp parts', text: 'Old lamp posts and lanterns, waiting to be fixed.' });
  },
};

export const planter = {
  doc: 'Wooden flower tub. params: x,z,w=1.2',
  build(ctx, p) {
    const w = p.w ?? 1.2;
    const rng = mulberry32(p.seed ?? 19);
    ctx.mb.box('wood', p.x, 0, p.z, w, 0.45, 0.6, { color: p.color || '#9b6a42', tex: 0.9, ao: { k: 0.3, h: 0.4 } });
    ctx.mb.box('flat', p.x, 0.43, p.z, w - 0.1, 0.04, 0.5, { color: '#3b2a1a' });
    const mb = ctx.mbFor('notwinter');
    const n = Math.round(w * 5);
    for (let i = 0; i < n; i++) {
      const fx = p.x - w / 2 + 0.1 + (i / n) * (w - 0.2), fz = p.z + (rng() - 0.5) * 0.3;
      mb.ball('leaf_leaf', fx, 0.55, fz, 0.14, { lump: 0.2, detail: 1, seed: i, tone: rng(), color: '#ffffff' });
      mb.ball('flat', fx, 0.7 + rng() * 0.08, fz, 0.08, { color: (p.colors || PAL.flowerCols)[(rng() * 6) | 0], detail: 0 });
    }
    ctx.mbFor('winter').box('snow', p.x, 0.45, p.z, w - 0.05, 0.1, 0.5, {});
    ctx.bake({ type: 'rect', x: p.x - w / 2 - 0.15, z: p.z - 0.3, w: w + 0.3, d: 0.8, a: 0.35, blur: 0.2 });
    ctx.solid(p.x - w / 2, p.z - 0.3, p.x + w / 2, p.z + 0.3);
  },
};

export const market_stall = {
  doc: 'Striped market stall. params: x,z,w=3,goods:fruit|flowers|bread,colors,id',
  build(ctx, p) {
    const mb = ctx.mb;
    const w = p.w ?? 3, d = 1.6, H = 2.5;
    const colors = p.colors || ['#d9534a', '#fff4e0'];
    const key = awningMat(ctx, colors);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mb.box('wood', p.x + sx * (w / 2 - 0.08), 0, p.z - 0.6 + (sz > 0 ? d - 0.4 : -0.4) , 0.13, H, 0.13, { color: '#8a5a34', ao: { k: 0.25, h: 0.5 } });
    // counter
    mb.box('wood', p.x, 0, p.z + 0.15, w - 0.1, 0.95, 0.7, { color: '#b58452', tex: 1.2, ao: { k: 0.3, h: 0.6 } });
    mb.box('wood', p.x, 0.95, p.z + 0.15, w, 0.08, 0.82, { color: '#d3a46e', tex: 1.2 });
    // roof canopy (sloped striped)
    const g = new THREE.PlaneGeometry(w + 0.5, d + 0.9);
    g.rotateX(-Math.PI / 2 + 0.28);
    mb.add(key, g, { matrix: placeMatrix(p.x, H + 0.1, p.z - 0.5 + 0.2, {}) });
    const vg = new THREE.PlaneGeometry(w + 0.5, 0.3);
    mb.add(key, vg, { matrix: placeMatrix(p.x, H - 0.1, p.z + 0.35 + 0.35, {}) });
    const n = Math.round((w + 0.5) / 0.375);
    for (let i = 0; i < n; i++) mb.ball('flat', p.x - (w + 0.5) / 2 + ((i + 0.5) / n) * (w + 0.5), H - 0.27, p.z + 0.7, 0.19, { color: colors[Math.floor((i / n) * 8) % colors.length], detail: 1, sy: 0.45, sz: 0.5 });
    ctx.mbFor('winter').box('snow', p.x, H + 0.28, p.z - 0.4, w + 0.4, 0.07, d + 0.5, { rotX: 0.22 });
    // goods
    const rng = mulberry32(p.seed ?? 17);
    const goods = p.goods || 'fruit';
    const cols = goods === 'flowers' ? PAL.flowerCols : goods === 'bread' ? ['#d9a35a', '#c98c46', '#e6b872'] : ['#e04a3f', '#f2a03a', '#8fd16a', '#e8c040'];
    const nb = Math.floor((w - 0.5) / 0.7);
    for (let i = 0; i < nb; i++) {
      const bx = p.x - (w - 0.7) / 2 + (i / Math.max(1, nb - 1)) * (w - 0.7);
      mb.box('wood', bx, 1.03, p.z + 0.2, 0.55, 0.14, 0.5, { color: '#8a5a34' });
      for (let k = 0; k < 6; k++) {
        const bx2 = bx + (rng() - 0.5) * 0.4, bz2 = p.z + 0.2 + (rng() - 0.5) * 0.35;
        if (goods === 'bread') mb.ball('flat', bx2, 1.22, bz2, 0.11, { color: cols[(rng() * 3) | 0], detail: 1, sy: 0.6, sx: 1.5 });
        else mb.ball('flat', bx2, 1.22 + (goods === 'flowers' ? 0.08 : 0), bz2, goods === 'flowers' ? 0.1 : 0.1, { color: cols[(rng() * cols.length) | 0], detail: 1 });
      }
    }
    ctx.bake({ type: 'rect', x: p.x - w / 2 - 0.2, z: p.z - 0.5, w: w + 0.4, d: 1.7, a: 0.4, blur: 0.35 });
    ctx.solid(p.x - w / 2, p.z - 0.25, p.x + w / 2, p.z + 0.55);
    ctx.interactable(p, { x: p.x, z: p.z + 1.2, r: 1.5, type: 'object', label: 'Market stall' });
  },
};

export const cafe_table = {
  doc: 'Round cafe table with chairs and a striped parasol. params: x,z,chairs=2,parasol=true,colors',
  build(ctx, p) {
    const mb = ctx.mb;
    mb.cyl('wood', p.x, 0, p.z, 0.05, 0.1, 0.78, { seg: 6, color: '#7a5030' });
    mb.cyl('wood', p.x, 0.76, p.z, 0.55, 0.55, 0.06, { seg: 14, color: '#d9a566', tex: 0.8 });
    mb.cyl('flat', p.x, 0.82, p.z, 0.2, 0.2, 0.02, { seg: 10, color: '#fff4e0' });
    const nch = p.chairs ?? 2;
    for (let i = 0; i < nch; i++) {
      const a = Math.PI * (nch === 2 ? i * 1 + 0.5 : (i / nch) * 2);
      const cx = p.x + Math.cos(a) * 0.95, cz = p.z + Math.sin(a) * 0.8;
      const F = frame(mb, cx, 0, cz, -a + Math.PI / 2 * 0 + (Math.PI / 2 - a) * 0);
      mb.cyl('wood', cx, 0.42, cz, 0.24, 0.24, 0.06, { seg: 8, color: '#b9824f' });
      for (const [lx, lz] of [[-0.14, -0.14], [0.14, -0.14], [-0.14, 0.14], [0.14, 0.14]]) mb.box('wood', cx + lx, 0, cz + lz, 0.05, 0.44, 0.05, { color: '#7a5030' });
      mb.box('wood', cx + Math.cos(a) * 0.2, 0.48, cz + Math.sin(a) * 0.2, 0.45, 0.4, 0.05, { color: '#b9824f', rotY: -a + Math.PI / 2 });
      void F;
      ctx.solidCircle(cx, cz, 0.25);
    }
    if (p.parasol !== false) {
      const key = awningMat(ctx, p.colors || ['#e8847a', '#fff4e0']);
      mb.cyl('wood', p.x, 0.0, p.z, 0.03, 0.04, 2.4, { seg: 5, color: '#7a5030' });
      mb.cyl(key, p.x, 2.2, p.z, 0.05, 1.45, 0.45, { seg: 8, color: '#ffffff' });
      mb.ball('flat', p.x, 2.68, p.z, 0.07, { color: PAL.brass, detail: 0 });
      ctx.mbFor('winter').cyl('snow', p.x, 2.35, p.z, 0.02, 1.0, 0.2, { seg: 8 });
    }
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z + 0.1, rx: 1.7, rz: 1.5, a: 0.3, blur: 0.4 });
    ctx.solidCircle(p.x, p.z, 0.55);
    ctx.interactable(p, { x: p.x, z: p.z + 1.4, r: 1.3, type: 'object', label: 'Table' });
  },
};

export const bridge = {
  doc: 'Footbridge. kind wood|stone. params: x,z (centre),len,w=2.4,dir (x = spans east-west | z)',
  build(ctx, p) {
    const dirX = (p.dir || 'x') === 'x';
    const len = p.len ?? 6, w = p.w ?? 2.4;
    const stone = p.kind === 'stone';
    const rot = dirX ? 0 : Math.PI / 2;
    const F = frame(ctx.mb, p.x, 0, p.z, rot);
    const n = 8;
    for (let i = 0; i < n; i++) {
      const u = (i + 0.5) / n;
      const lx = -len / 2 + u * len;
      const arch = Math.sin(u * Math.PI) * (stone ? 0.5 : 0.28);
      F.box(stone ? 'stone' : 'wood', lx, 0.08 + arch - 0.06, 0, len / n + 0.02, 0.2, w, { color: stone ? '#cfc7b8' : '#b98a5a', tex: 1.2, ao: { k: 0.2, h: 0.3 } });
      for (const sz of [-1, 1]) {
        const ry = 0.08 + arch + 0.14;
        if (stone) F.box('stone', lx, ry - 0.2, sz * (w / 2 - 0.12), len / n + 0.02, 0.62, 0.26, { color: '#d6cebf', tex: 1.2 });
        else {
          F.box('wood', lx, ry + 0.55, sz * (w / 2 - 0.05), len / n + 0.02, 0.08, 0.08, { color: '#c89a68' });
          F.box('wood', lx, ry + 0.25, sz * (w / 2 - 0.05), len / n + 0.02, 0.06, 0.06, { color: '#c89a68' });
        }
      }
    }
    if (!stone) for (let i = 0; i <= 4; i++) {
      const u = i / 4, lx = -len / 2 + u * len;
      const arch = Math.sin(u * Math.PI) * 0.28;
      for (const sz of [-1, 1]) F.box('wood', lx, 0.0, sz * (w / 2 - 0.05), 0.14, 1.0 + arch, 0.14, { color: '#9a6a3e' });
    }
    const sb = frame(ctx.mbFor('winter'), p.x, 0, p.z, rot);
    sb.box('snow', 0, 0.3, 0, len - 0.4, 0.07, w - 0.2, {});
    // collision: walkable deck, solid rails
    const hx = dirX ? len / 2 : w / 2, hz = dirX ? w / 2 : len / 2;
    ctx.walkable(p.x - hx - 0.2, p.z - hz - 0.2, p.x + hx + 0.2, p.z + hz + 0.2);
    ctx.surface(p.x - hx, p.z - hz, p.x + hx, p.z + hz, 'wood');
    const t = 0.1;
    if (dirX) {
      ctx.solid(p.x - hx, p.z - hz - t, p.x + hx, p.z - hz + t, { tile: false });
      ctx.solid(p.x - hx, p.z + hz - t, p.x + hx, p.z + hz + t, { tile: false });
    } else {
      ctx.solid(p.x - hx - t, p.z - hz, p.x - hx + t, p.z + hz, { tile: false });
      ctx.solid(p.x + hx - t, p.z - hz, p.x + hx + t, p.z + hz, { tile: false });
    }
    ctx.bake({ type: 'rect', x: p.x - hx - 0.1, z: p.z - hz + 0.1, w: hx * 2 + 0.2, d: hz * 2 + 0.2, a: 0.45, blur: 0.5 });
  },
};

export const fountain = {
  doc: 'Round fountain with animated water. params: x,z,r=2.6,id,column=true',
  build(ctx, p) {
    const mb = ctx.mb;
    const R = p.r ?? 2.6;
    mb.cyl('stone', p.x, 0, p.z, R + 0.15, R + 0.3, 0.34, { seg: 32, color: '#d6cebe', tex: 2, ao: { k: 0.2, h: 0.3 } });
    mb.cyl('stone', p.x, 0.3, p.z, R - 0.1, R - 0.1, 0.26, { seg: 32, color: '#9fb0b0', tex: 2 });
    const nRim = 30;
    for (let i = 0; i < nRim; i++) {
      const a = (i / nRim) * Math.PI * 2;
      const rr0 = R + 0.02;
      mb.box('stone', p.x + Math.cos(a) * rr0, 0.3, p.z + Math.sin(a) * rr0, (Math.PI * 2 * rr0) / nRim + 0.04, 0.58, 0.46, { rotY: -a + Math.PI / 2, color: i % 2 ? '#efe8d8' : '#e6dfcd', tex: 1.4, ao: { k: 0.15, h: 0.3, y0: 0.3 } });
      mb.box('stone', p.x + Math.cos(a) * rr0, 0.88, p.z + Math.sin(a) * rr0, (Math.PI * 2 * rr0) / nRim + 0.05, 0.1, 0.56, { rotY: -a + Math.PI / 2, color: '#f6f0e2', tex: 1.4 });
    }
    // water surface
    const mat = ctx.s.waterMat.clone();
    mat.uniforms = THREE.UniformsUtils.clone(ctx.s.waterMat.uniforms);
    mat.uniforms.uNoise.value = ctx.tex.get('noise');
    mat.uniforms.uDeep.value.set('#4aaebd');
    mat.uniforms.uShallow.value.set('#a6e4e0');
    mat.uniforms.uScale.value = 0.5;
    const disc = new THREE.Mesh(new THREE.CircleGeometry(R - 0.1, 32).rotateX(-Math.PI / 2), mat);
    disc.position.set(p.x, 0.62, p.z);
    ctx.s.extraWater.push(disc);
    ctx.root.add(disc);
    if (p.column !== false) {
      mb.cyl('stone', p.x, 0.7, p.z, 0.5, 0.7, 0.4, { seg: 12, color: '#efe8d8', tex: 1.4 });
      mb.cyl('stone', p.x, 1.1, p.z, 0.2, 0.28, 0.9, { seg: 10, color: '#efe8d8', tex: 1.2 });
      mb.cyl('stone', p.x, 1.95, p.z, 0.9, 0.2, 0.28, { seg: 16, color: '#f6f0e2', tex: 1.4 });
      mb.ball('stone', p.x, 2.35, p.z, 0.22, { detail: 1, color: '#f6f0e2' });
      const fx = ctx.s.fx;
      let acc = 0;
      ctx.updater((dt) => {
        if (!fx) return;
        acc += dt;
        while (acc > 0.045) {
          acc -= 0.045;
          const a = Math.random() * 6.28, s = 0.3 + Math.random() * 0.5;
          fx.alphaPool.spawn(p.x + Math.cos(a) * 0.1, 2.5, p.z + Math.sin(a) * 0.1, Math.cos(a) * s, 2.2 + Math.random() * 0.6, Math.sin(a) * s, 1.1, 0.1, '#e4f6ff', 4, { gravity: 7.5, alpha: 0.9 });
          const b = Math.random() * 6.28;
          fx.alphaPool.spawn(p.x + Math.cos(b) * 0.85, 1.97, p.z + Math.sin(b) * 0.85, Math.cos(b) * 0.6, 0.2, Math.sin(b) * 0.6, 0.7, 0.08, '#e4f6ff', 4, { gravity: 7.5, alpha: 0.8 });
        }
      });
    } else {
      // ring of small jets around the centre (a tower or statue stands there)
      const fx = ctx.s.fx;
      let acc = 0;
      ctx.updater((dt) => {
        if (!fx) return;
        acc += dt;
        while (acc > 0.06) {
          acc -= 0.06;
          const k = Math.floor(Math.random() * 6);
          const a = (k / 6) * 6.283 + 0.3, jr = R * 0.78;
          fx.alphaPool.spawn(p.x + Math.cos(a) * jr, 0.75, p.z + Math.sin(a) * jr, -Math.cos(a) * 0.5 + (Math.random() - 0.5) * 0.2, 2.4 + Math.random() * 0.5, -Math.sin(a) * 0.5 + (Math.random() - 0.5) * 0.2, 1.0, 0.1, '#e4f6ff', 4, { gravity: 7.5, alpha: 0.9 });
        }
      });
    }
    ctx.mbFor('winter').cyl('snow', p.x, 0.97, p.z, R + 0.2, R + 0.2, 0.06, { seg: 28 });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: R + 0.9, rz: R + 0.8, a: 0.45, blur: 0.6 });
    ctx.solidCircle(p.x, p.z, R + 0.2, { tile: true });
    ctx.interactable(p, { type: 'fountain', x: p.x, z: p.z + R + 0.9, r: 1.6, label: 'Fountain' });
  },
};

export const stage = {
  doc: 'Small wooden stage. params: x,z (front centre),w=7,d=3.4,h=0.55',
  build(ctx, p) {
    const w = p.w ?? 7, d = p.d ?? 3.4, h = p.h ?? 0.55;
    const mb = ctx.mb;
    mb.box('wood', p.x, 0, p.z - d / 2, w, h, d, { color: '#c4915a', tex: 1.4, ao: { k: 0.3, h: 0.5 } });
    mb.box('wood', p.x, h, p.z - d / 2, w + 0.2, 0.08, d + 0.2, { color: '#d9a870', tex: 1.4 });
    mb.box('trim', p.x, 0.05, p.z + 0.02, w, h - 0.1, 0.05, { color: '#8a5a34' });
    for (const sx of [-1, 1]) mb.box('wood', p.x + sx * (w / 2 - 0.1), h, p.z - d + 0.2, 0.2, 2.6, 0.2, { color: '#8a5a34' });
    mb.box('cloth', p.x, 2.4, p.z - d + 0.2, w, 0.4, 0.1, { color: '#d9534a' });
    for (let i = 0; i < 6; i++) mb.box('cloth', p.x - w / 2 + 0.3 + i * (w - 0.6) / 5, 1.1, p.z - d + 0.18, 0.5, 1.3, 0.05, { color: i % 2 ? '#f4d27a' : '#e07b6a' });
    for (let i = 0; i < 3; i++) mb.box('stone', p.x, 0, p.z + 0.25 + (2 - i) * 0.0 + 0.0, 1.6 - i * 0.0, 0.18 * (i + 1), 0.3, { color: '#e8e0cc' }), void 0;
    ctx.mbFor('winter').box('snow', p.x, h + 0.08, p.z - d / 2, w, 0.07, d, {});
    ctx.bake({ type: 'rect', x: p.x - w / 2 - 0.3, z: p.z - d - 0.2, w: w + 0.6, d: d + 0.8, a: 0.4, blur: 0.4 });
    ctx.solid(p.x - w / 2, p.z - d, p.x + w / 2, p.z - 0.2);
    ctx.surface(p.x - w / 2, p.z - d, p.x + w / 2, p.z, 'wood');
    ctx.interactable(p, { x: p.x, z: p.z + 1.4, r: 1.6, type: 'object', label: 'Stage', text: 'A little stage for the town festivals.' });
  },
};

export const marker = {
  doc: 'Invisible interactable marker. params: x,z,id,type,label,text,r',
  build(ctx, p) {
    ctx.interactable(p, { x: p.x, z: p.z, r: 1.0 });
  },
};

function catenary(ctx, pts, y, sag, fn) {
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1];
    const L = Math.hypot(bx - ax, bz - az);
    const n = Math.max(2, Math.round(L / 0.55));
    for (let k = 0; k <= n; k++) {
      const u = k / n;
      fn(ax + (bx - ax) * u, y - Math.sin(u * Math.PI) * sag, az + (bz - az) * u, u, Math.atan2(-(bz - az), bx - ax), k);
    }
  }
}

export const bunting = {
  doc: 'String of triangular flags. params: pts:[[x,z],...],y=3.2,sag=0.45,colors',
  build(ctx, p) {
    const cols = p.colors || ['#e8645a', '#f4d27a', '#6fb7e8', '#8fd16a', '#ffb7cf'];
    const mb = ctx.mb;
    let c = 0;
    catenary(ctx, p.pts, p.y ?? 3.2, p.sag ?? 0.45, (x, y, z, u, ang, k) => {
      mb.box('flat', x, y, z, 0.6, 0.03, 0.03, { color: '#6a5a4a', rotY: ang });
      mb.tri('swaycloth', x, y - 0.38, z, 0.36, 0.38, { color: cols[c++ % cols.length], rotY: ang, rotX: 0, sway: 0.1, swayH: 0.38, swayY0: y - 0.38, tex: 0.4 });
    });
    for (const [x, z] of [p.pts[0], p.pts[p.pts.length - 1]]) if (p.poles) mb.cyl('wood', x, 0, z, 0.07, 0.1, (p.y ?? 3.2) + 0.3, { seg: 6, color: '#8a5a34' });
  },
};

export const lantern_string = {
  doc: 'String of glowing paper lanterns (festival). params: pts,y=3.4,sag=0.5,colors,poles=true',
  build(ctx, p) {
    const cols = p.colors || ['#ff6f5a', '#ffd23f', '#ff9a4a', '#ff7fa3'];
    const mb = ctx.mb;
    let c = 0;
    const sprites = [];
    catenary(ctx, p.pts, p.y ?? 3.4, p.sag ?? 0.5, (x, y, z, u, ang, k) => {
      mb.box('flat', x, y, z, 0.6, 0.03, 0.03, { color: '#4a3a2a', rotY: ang });
      if (k % 2 === 0) {
        const col = cols[c++ % cols.length];
        mb.ball('glow', x, y - 0.38, z, 0.24, { color: col, detail: 1, sy: 1.15 });
        mb.cyl('flat', x, y - 0.12, z, 0.07, 0.07, 0.06, { seg: 5, color: '#3a2a1a' });
        const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ctx.tex.get('halo'), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0, color: col }));
        s.scale.set(1.5, 1.5, 1);
        s.position.set(x, y - 0.38, z);
        ctx.root.add(s);
        sprites.push(s);
      }
    });
    if (p.poles !== false) for (const [x, z] of [p.pts[0], p.pts[p.pts.length - 1]]) { mb.cyl('wood', x, 0, z, 0.07, 0.11, (p.y ?? 3.4) + 0.3, { seg: 6, color: '#8a5a34' }); mb.ball('flat', x, (p.y ?? 3.4) + 0.32, z, 0.1, { color: PAL.brass, detail: 0 }); }
    ctx.updater((dt, t, env) => { const o = 0.15 + env.glow * 0.7; for (const s of sprites) s.material.opacity = o * (0.9 + Math.sin(t * 3 + s.position.x) * 0.1); });
  },
};

export const picnic = {
  doc: 'Gingham picnic blanket with basket and cups (spring_picnic decor). params: x,z,w=2.8,d=2.2,color',
  build(ctx, p) {
    const w = p.w ?? 2.8, d = p.d ?? 2.2;
    const col = p.color || '#e8645a';
    const key = cachedMat(ctx, `gingham_${col}`, () => {
      const c = makeCanvas(64, 64);
      const g = c.getContext('2d');
      g.fillStyle = '#fff8ee'; g.fillRect(0, 0, 64, 64);
      g.fillStyle = col; g.globalAlpha = 0.75;
      for (let i = 0; i < 4; i++) { g.fillRect(i * 16, 0, 8, 64); g.fillRect(0, i * 16, 64, 8); }
      return c;
    }, { side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(w, d);
    geo.rotateX(-Math.PI / 2);
    ctx.mb.add(key, geo, { matrix: placeMatrix(p.x, 0.04, p.z, { rotY: p.rot ?? 0.1 }) });
    ctx.mb.box('flat', p.x - w * 0.18, 0.04, p.z - 0.2, 0.6, 0.36, 0.42, { color: '#b88a5a', rotY: 0.3, tex: 0.5 });
    ctx.mb.cyl('flat', p.x - w * 0.18, 0.4, p.z - 0.2, 0.28, 0.28, 0.05, { seg: 8, color: '#8a5a34', rotX: 0, sx: 1.1 });
    ctx.mb.cyl('flat', p.x + w * 0.18, 0.04, p.z + 0.25, 0.1, 0.08, 0.14, { seg: 8, color: '#fff' });
    ctx.mb.cyl('flat', p.x + w * 0.1, 0.04, p.z + 0.4, 0.1, 0.08, 0.14, { seg: 8, color: '#ffd7e0' });
    ctx.mb.ball('flat', p.x + w * 0.3, 0.14, p.z - 0.3, 0.14, { color: '#e04a3f', detail: 1 });
    ctx.mb.ball('flat', p.x + w * 0.38, 0.12, p.z - 0.2, 0.12, { color: '#f2a03a', detail: 1 });
    ctx.bake({ type: 'rect', x: p.x - w / 2 - 0.1, z: p.z - d / 2 - 0.05, w: w + 0.2, d: d + 0.2, a: 0.25, blur: 0.15 });
  },
};

export const laundry = {
  doc: 'Laundry line with clothes. params: pts:[[x,z],[x,z]],y=2.4',
  build(ctx, p) {
    const mb = ctx.mb;
    const rng = mulberry32(p.seed ?? 3);
    const cols = ['#fff6e8', '#9cc8ff', '#ffb7cf', '#f4d27a', '#c9a4ff'];
    catenary(ctx, p.pts, p.y ?? 2.4, 0.18, (x, y, z, u, ang, k) => {
      mb.box('flat', x, y, z, 0.6, 0.02, 0.02, { color: '#6a5a4a', rotY: ang });
      if (k % 2 === 1) mb.box('swaycloth', x, y - 0.65, z, 0.42 + rng() * 0.1, 0.62, 0.03, { color: cols[(rng() * cols.length) | 0], rotY: ang, sway: 0.08, swayH: 0.65, swayY0: y - 0.65 });
    });
    for (const [x, z] of [p.pts[0], p.pts[p.pts.length - 1]]) mb.cyl('wood', x, 0, z, 0.06, 0.09, (p.y ?? 2.4) + 0.2, { seg: 6, color: '#8a5a34' });
  },
};

export const boat = {
  doc: 'Little rowing boat. params: x,z,rot,color',
  build(ctx, p) {
    const F = frame(ctx.mb, p.x, 0.05, p.z, p.rot ?? 0);
    const col = p.color || '#4f7fb5';
    F.box('wood', 0, 0, 0, 2.6, 0.12, 1.0, { color: '#a8794a' });
    for (const sz of [-1, 1]) { F.box('flat', 0, 0.05, sz * 0.5, 2.6, 0.5, 0.1, { color: col }); F.box('trim', 0, 0.5, sz * 0.5, 2.6, 0.06, 0.14, { color: '#fff4de' }); }
    F.box('flat', 1.3, 0.05, 0, 0.1, 0.5, 1.0, { color: col });
    F.box('flat', -1.3, 0.05, 0, 0.1, 0.5, 1.0, { color: col });
    F.box('wood', 0, 0.12, 0, 0.3, 0.06, 0.95, { color: '#c9a070' });
    F.box('wood', 0.5, 0.2, 0.0, 0.05, 0.05, 1.9, { color: '#8a5a34', rotY: 0.2 });
    ctx.mbFor('winter').box('snow', p.x, 0.5, p.z, 2.4, 0.07, 0.8, { rotY: p.rot ?? 0 });
    ctx.solid(p.x - 1.3, p.z - 0.55, p.x + 1.3, p.z + 0.55);
  },
};

export const pier = {
  doc: 'Wooden pier. params: x,z (start centre),len,w=2.4,dir:n|s|e|w (direction it extends)',
  build(ctx, p) {
    const len = p.len ?? 10, w = p.w ?? 2.4;
    const dir = p.dir || 's';
    const rot = { n: Math.PI, s: 0, e: Math.PI / 2, w: -Math.PI / 2 }[dir];
    const F = frame(ctx.mb, p.x, 0, p.z, rot);
    const n = Math.round(len / 0.5);
    for (let i = 0; i < n; i++) F.box('wood', 0, 0.28, (i + 0.5) * (len / n), w, 0.07, len / n - 0.03, { color: i % 2 ? '#b08c64' : '#a07c54', tex: 1.2 });
    for (let i = 0; i <= len / 2; i++) for (const sx of [-1, 1]) {
      F.box('wooddark', sx * (w / 2 - 0.05), -0.4, i * 2, 0.16, 1.6, 0.16, { color: '#6a4a30' });
      if (i < len / 2) F.box('wood', sx * (w / 2), 0.9, i * 2 + 1, 0.06, 0.06, 2, { color: '#c0a07a' });
    }
    const v = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[dir];
    const ex = p.x + v[0] * len + (v[0] ? 0 : w / 2), ez = p.z + v[1] * len + (v[1] ? 0 : w / 2);
    const sx = v[0] ? p.x : p.x - w / 2, sz = v[1] ? p.z : p.z - w / 2;
    const x0 = Math.min(sx, v[0] ? ex : p.x + w / 2), x1 = Math.max(sx, v[0] ? ex : p.x + w / 2);
    const z0 = Math.min(sz, v[1] ? ez : p.z + w / 2), z1 = Math.max(sz, v[1] ? ez : p.z + w / 2);
    ctx.walkable(x0, z0, x1, z1);
    ctx.surface(x0, z0, x1, z1, 'wood');
  },
};
