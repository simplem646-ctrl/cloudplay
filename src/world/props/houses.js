/**
 * Buildings: house (the workhorse: shops, cottages, halls, sheds), lighthouse, clock tower.
 * Fronts face SOUTH (+z, toward the camera). Position (x,z) = centre of the FRONT wall at ground level; the
 * building extends north (-z) by `d`.
 */
import * as THREE from 'three';
import { PAL, ROOF_STYLES, WALL_STYLES, frame, awningMat, signMat, colorize, rect } from './util.js';
import { placeMatrix } from '../geo.js';
import { smoothstep } from '../../core/util.js';

function planeGeo(w, h) {
  return new THREE.PlaneGeometry(w, h);
}

function roofSlopePoint(g, u, xOff = 0) {
  // u: 0 = south eave, 1 = ridge
  return {
    x: g.cx + xOff,
    y: g.eaveY + (g.ridgeY - g.eaveY) * u,
    z: g.eaveZ + (g.ridgeZ - g.eaveZ) * u,
  };
}

function buildWindow(ctx, F, cx, o) {
  const mb = ctx.mb;
  const w = o.w ?? 1.1, h = o.h ?? 1.25, y = o.y ?? 1.35;
  const trim = o.trim || PAL.trim;
  // recessed dark reveal, glass, frame
  F.box('flat', cx, y - 0.02, 0.0, w + 0.1, h + 0.1, 0.08, { color: '#4a3a30' });
  const glass = new THREE.PlaneGeometry(w, h);
  const [gx, gz] = F.world(cx, 0.075);
  mb.add('glass', glass, { matrix: placeMatrix(gx, F.oy + y + h / 2, gz, { rotY: F.rotY }) });
  // frame
  const t = 0.1;
  F.box('trim', cx, y - t, 0.06, w + t * 2.2, t, 0.16, { color: trim });
  F.box('trim', cx, y + h, 0.06, w + t * 2.2, t, 0.16, { color: trim });
  F.box('trim', cx - w / 2 - t / 2, y, 0.06, t, h, 0.16, { color: trim });
  F.box('trim', cx + w / 2 + t / 2, y, 0.06, t, h, 0.16, { color: trim });
  F.box('trim', cx, y + h / 2 - 0.025, 0.1, w, 0.055, 0.07, { color: trim });
  F.box('trim', cx - 0.0, y, 0.1, 0.055, h, 0.07, { color: trim });
  // lintel hood + sill
  F.box('trim', cx, y + h + t, 0.08, w + 0.42, 0.12, 0.24, { color: trim, ao: { k: 0.15, h: 0.12 } });
  F.box('trim', cx, y - t - 0.1, 0.12, w + 0.4, 0.11, 0.3, { color: trim, ao: { k: 0.2, h: 0.1 } });
  if (o.shutters) {
    const sc = typeof o.shutters === 'string' ? o.shutters : '#4f8a7a';
    for (const sgn of [-1, 1]) {
      const sx = cx + sgn * (w / 2 + t + 0.28);
      F.box('flat', sx, y - 0.04, 0.07, 0.5, h + 0.14, 0.07, { color: sc, jitter: 0.04 });
      for (let k = 0; k < 4; k++) F.box('flat', sx, y + 0.18 + k * ((h - 0.2) / 4), 0.115, 0.4, 0.04, 0.03, { color: sc, ao: undefined, jitter: -0.14 });
    }
  }
  if (o.box) {
    const boxCol = typeof o.box === 'string' ? o.box : '#9b6a42';
    const by = y - t - 0.34;
    F.box('wood', cx, by, 0.28, w + 0.28, 0.3, 0.34, { color: boxCol, tex: 1 });
    F.box('flat', cx, by + 0.3, 0.28, w + 0.2, 0.05, 0.26, { color: '#3b2a1a' });
    const rng = ctx.rngFor(Math.round(cx * 10));
    const n = Math.max(3, Math.round(w * 4));
    const mbW = ctx.mbFor('notwinter');
    const Fw = frame(mbW, F.ox, F.oy, F.oz, F.rotY);
    for (let i = 0; i < n; i++) {
      const fx = cx - w / 2 - 0.05 + ((i + 0.5) / n) * (w + 0.1);
      const col = (o.flowers || PAL.flowerCols)[(rng() * (o.flowers || PAL.flowerCols).length) | 0];
      Fw.ball('leaf_leaf', fx, by + 0.34, 0.28, 0.13, { lump: 0.2, detail: 1, seed: i + 1, tone: rng() });
      Fw.ball('flat', fx + (rng() - 0.5) * 0.08, by + 0.5 + rng() * 0.1, 0.3, 0.075, { color: col, detail: 0 });
    }
    const Fs = frame(ctx.mbFor('winter'), F.ox, F.oy, F.oz, F.rotY);
    Fs.box('snow', cx, by + 0.3, 0.28, w + 0.16, 0.1, 0.28, {});
  }
}

function buildDoor(ctx, F, cx, o, g) {
  const mb = ctx.mb;
  const w = o.w ?? 1.5, h = o.h ?? 2.2;
  const trim = o.trim || PAL.trim;
  const doorColor = o.color || PAL.doorBrown;
  // deep dark reveal so the opened door reads
  F.box('flat', cx, 0, 0.0, w + 0.18, h + 0.08, 0.1, { color: '#2a1b12' });
  F.box('flat', cx, 0.0, 0.2, w + 0.18, 0.02, 0.5, { color: '#463324' });
  // frame
  F.box('trim', cx - w / 2 - 0.1, 0, 0.1, 0.2, h + 0.18, 0.26, { color: trim, ao: { k: 0.3, h: 0.5 } });
  F.box('trim', cx + w / 2 + 0.1, 0, 0.1, 0.2, h + 0.18, 0.26, { color: trim, ao: { k: 0.3, h: 0.5 } });
  if (o.style === 'arch') {
    // arch built from a half-ring of trim boxes
    const R = w / 2 + 0.1;
    for (let i = 0; i <= 8; i++) {
      const a = (i / 8) * Math.PI;
      F.box('trim', cx + Math.cos(a) * R, h + 0.08 + Math.sin(a) * R - 0.12, 0.1, 0.22, 0.24, 0.26, { color: trim, rotZ: a - Math.PI / 2 });
    }
  } else {
    F.box('trim', cx, h, 0.1, w + 0.4, 0.2, 0.28, { color: trim });
    F.box('trim', cx, h + 0.2, 0.12, w + 0.55, 0.1, 0.34, { color: trim });
  }
  // door panel (separate mesh with hinge pivot)
  const shape = new THREE.Shape();
  const hw = w / 2;
  if (o.style === 'arch') {
    const straight = h - hw;
    shape.moveTo(-hw, 0);
    shape.lineTo(hw, 0);
    shape.lineTo(hw, straight);
    shape.absarc(0, straight, hw, 0, Math.PI, false);
    shape.lineTo(-hw, 0);
  } else {
    shape.moveTo(-hw, 0);
    shape.lineTo(hw, 0);
    shape.lineTo(hw, h);
    shape.lineTo(-hw, h);
    shape.lineTo(-hw, 0);
  }
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 0.09, bevelEnabled: false });
  // planar uv
  const pos = geo.attributes.position;
  const uv = new Float32Array(pos.count * 2);
  for (let i = 0; i < pos.count; i++) {
    uv[i * 2] = (pos.getX(i) + hw) / w;
    uv[i * 2 + 1] = pos.getY(i) / h;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  colorize(geo, doorColor);
  geo.translate(hw, 0, 0); // hinge at x=0
  const panel = new THREE.Mesh(geo, ctx.mats.door);
  const pivot = new THREE.Group();
  const [px, pz] = F.world(cx - hw, 0.02);
  pivot.position.set(px, F.oy, pz);
  pivot.rotation.y = F.rotY;
  pivot.add(panel);
  // little window in upper door + knocker
  const lite = new THREE.Mesh(colorize(new THREE.PlaneGeometry(0.5, 0.5), '#ffffff'), ctx.mats.glass);
  lite.position.set(hw, h * 0.7, 0.1);
  if (o.window !== false) pivot.add(lite);
  ctx.object(pivot, { receive: true });
  if (o.transition) ctx.door(o.transition, pivot, { dir: o.dir ?? -1, max: 1.6 });
  // step + mat
  if (o.step !== false) {
    F.box('stone', cx, 0, 0.62, w + 0.9, 0.2, 0.95, { tex: 1.2, ao: { k: 0.25, h: 0.25 } });
    F.box('stone', cx, 0.0, 1.15, w + 1.3, 0.1, 0.4, { tex: 1.2, ao: { k: 0.25, h: 0.12 } });
    const Fs = frame(ctx.mbFor('winter'), F.ox, F.oy, F.oz, F.rotY);
    Fs.box('snow', cx, 0.2, 0.62, w + 0.8, 0.07, 0.85, {});
  }
  if (o.mat !== false) {
    F.box('cloth', cx, 0.2, 0.65, w * 0.8, 0.03, 0.55, { color: o.matColor || '#b2563f' });
    F.box('cloth', cx, 0.2, 0.65, w * 0.8 - 0.14, 0.035, 0.41, { color: '#e8c9a0' });
  }
  // lantern by the door (glass pane glows at night)
  if (o.lantern !== false) {
    const lx = cx + w / 2 + 0.55;
    F.box('metal', lx, h - 0.5, 0.18, 0.06, 0.5, 0.06, { color: PAL.iron });
    F.box('metal', lx, h - 0.55, 0.3, 0.05, 0.05, 0.3, { color: PAL.iron });
    F.box('glass', lx, h - 0.88, 0.4, 0.2, 0.28, 0.2, { color: '#ffffff' });
    F.box('metal', lx, h - 0.6, 0.4, 0.26, 0.06, 0.26, { color: PAL.iron });
    F.box('metal', lx, h - 0.92, 0.4, 0.24, 0.05, 0.24, { color: PAL.iron });
  }
}

function buildAwning(ctx, F, o) {
  const mb = ctx.mb;
  const w = o.w ?? 3, y = o.y ?? 2.6, proj = o.d ?? 1.2;
  const colors = o.colors || ['#d9534a', '#fff4e0'];
  const key = awningMat(ctx, colors);
  const cx = o.at ?? 0;
  // sloped canopy: from wall at height y+0.5 to front at height y
  const len = Math.hypot(proj, 0.5);
  const ang = Math.atan2(0.5, proj); // slope downward to front
  const g = planeGeo(w, len);
  g.rotateX(-Math.PI / 2 + ang); // lay flat then tilt
  // plane is in XZ after -90deg; tilt so the south edge is lower
  const midZ = proj / 2, midY = y + 0.25;
  const [wx, wz] = F.world(cx, midZ);
  const m = new THREE.Matrix4().compose(new THREE.Vector3(wx, F.oy + midY, wz), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, F.rotY, 0)), new THREE.Vector3(1, 1, 1));
  // remap uv so stripes run front-to-back
  const uv = g.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i), uv.getY(i));
  mb.add(key, g, { matrix: m });
  // valance (front hanging strip) + scallops
  const vg = planeGeo(w, 0.3);
  const [vx, vz] = F.world(cx, proj);
  mb.add(key, vg, { matrix: placeMatrix(vx, F.oy + y - 0.12, vz, { rotY: F.rotY }) });
  const n = Math.round(w / 0.375);
  for (let i = 0; i < n; i++) {
    const sx = cx - w / 2 + ((i + 0.5) / n) * w;
    const col = colors[Math.floor((i / n) * 8) % colors.length];
    F.ball('flat', sx, y - 0.28, proj, 0.19, { color: col, detail: 1, sy: 0.45, sx: 1, sz: 0.5 });
  }
  // end triangles + poles
  for (const sgn of [-1, 1]) {
    F.box('metal', cx + sgn * (w / 2 - 0.06), 0, proj - 0.06, 0.07, y - 0.1, 0.07, { color: PAL.iron });
  }
  // snow
  const sb = ctx.mbFor('winter');
  const Fs = frame(sb, F.ox, F.oy, F.oz, F.rotY);
  Fs.box('snow', cx, y + 0.28, proj * 0.5, w - 0.1, 0.07, proj * 0.9, { rotX: ang * 0.9 });
}

function buildSign(ctx, F, o, wallW) {
  const text = o.text || 'Shop';
  const sw = o.w ?? 1.9, sh = o.h ?? 0.8;
  const key = signMat(ctx, text, { w: Math.round(sw * 128), h: Math.round(sh * 128), bg: o.bg, fg: o.fg, icon: o.icon });
  const at = o.at ?? 0;
  const y = o.y ?? 2.4;
  if (o.style === 'plaque') {
    F.box('trim', at, y - 0.06, 0.06, sw + 0.2, sh + 0.2, 0.12, { color: PAL.trim });
    const g = planeGeo(sw, sh);
    const [x, z] = F.world(at, 0.13);
    ctx.mb.add(key, g, { matrix: placeMatrix(x, F.oy + y + sh / 2 - 0.06, z, { rotY: F.rotY }) });
    return;
  }
  // hanging sign: bracket arm out of the wall, board hangs on two chains and sways
  const armZ = 0.55;
  const left = at - sw / 2 - 0.15;
  F.box('metal', at - sw / 2 - 0.2, y + sh + 0.05, 0.1, 0.1, 0.1, 0.32, { color: PAL.iron });
  F.box('metal', at, y + sh + 0.02, armZ - 0.02, sw + 0.5, 0.07, 0.07, { color: PAL.iron });
  F.box('metal', at - sw / 2 - 0.2, y + sh + 0.02, 0.35, 0.06, 0.06, 0.5, { color: PAL.iron });
  F.ball('metal', at + sw / 2 + 0.28, y + sh + 0.05, armZ, 0.07, { color: PAL.brass, detail: 0 });
  const pivot = new THREE.Group();
  const [px, pz] = F.world(at, armZ);
  pivot.position.set(px, F.oy + y + sh + 0.02, pz);
  pivot.rotation.y = F.rotY;
  const board = new THREE.Mesh(colorize(planeGeo(sw, sh), '#ffffff'), ctx.mats[key]);
  board.position.set(0, -0.35 - sh / 2, 0);
  const back = new THREE.Mesh(colorize(planeGeo(sw, sh), '#ffffff'), ctx.mats[key]);
  back.position.copy(board.position);
  back.rotation.y = Math.PI;
  const frameMesh = new THREE.Mesh(new THREE.BoxGeometry(sw + 0.12, sh + 0.12, 0.06), ctx.mats.wood);
  colorize(frameMesh.geometry, '#6e4524');
  frameMesh.position.copy(board.position);
  frameMesh.position.z = -0.001;
  board.position.z = 0.032;
  back.position.z = -0.032;
  pivot.add(frameMesh, board, back);
  for (const sx of [-sw / 2 + 0.15, sw / 2 - 0.15]) {
    const chain = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 4), ctx.mats.metal);
    colorize(chain.geometry, PAL.iron);
    chain.position.set(sx, -0.17, 0);
    pivot.add(chain);
  }
  ctx.object(pivot);
  const ph = ((ctx.propIndex * 1.7) % 6.28);
  ctx.updater((dt, t) => {
    pivot.rotation.z = Math.sin(t * 1.3 + ph) * 0.035 * (0.6 + 0.4 * Math.sin(t * 0.31));
  });
}

export const house = {
  doc: 'Generic building. See PROPS.md.',
  build(ctx, p) {
    const mb = ctx.mb;
    const w = p.w ?? 8, d = p.d ?? 6, h = p.h ?? 3.4;
    const x = p.x, z = p.z;
    const wallStyle = WALL_STYLES[p.wall || 'plaster'] || WALL_STYLES.plaster;
    const wallColor = p.wallColor || (wallStyle.mat === 'plaster' ? PAL.cream : '#ffffff');
    const trim = p.trim || PAL.trim;
    const baseColor = p.baseColor || '#a49a8a';
    const roofDef = ROOF_STYLES[p.roof || 'terracotta'] || ROOF_STYLES.terracotta;
    const roofColor = p.roofColor || roofDef.color;
    const style = p.roofStyle || 'gable';
    const rise = p.rise ?? Math.min(2.2, 0.9 + d * 0.14);
    const oh = p.overhang ?? 0.6;
    const rt = roofDef.thick ?? 0.22;
    const F = frame(mb, x, 0, z, 0);

    // ---- footprint collision + baked AO
    ctx.solid(x - w / 2, z - d, x + w / 2, z - 0.05);
    ctx.bake({ type: 'rect', x: x - w / 2 - 0.35, z: z - d - 0.3, w: w + 0.7, d: d + 0.75, a: 0.5, blur: 0.5 });
    ctx.bake({ type: 'rect', x: x - w / 2 - 0.05, z: z - 0.25, w: w + 0.1, d: 0.5, a: 0.42, blur: 0.28 });

    // ---- foundation + walls
    mb.box('stone', x, 0, z - d / 2, w + 0.16, 0.5, d + 0.16, { color: baseColor, tex: 1.6, ao: { k: 0.3, h: 0.5 } });
    const wallH = h - 0.5;
    mb.box(wallStyle.mat, x, 0.5, z - d / 2, w, wallH, d, { color: wallColor, tex: wallStyle.tex, ao: { k: 0.28, h: 1.1, y0: 0.5 } });
    // belt course between floors
    if (p.floors === 2) mb.box('trim', x, h * 0.5, z - d / 2 + 0.02, w + 0.1, 0.2, d + 0.1, { color: trim });
    // corner posts + eave band
    for (const sx of [-1, 1]) F.box('trim', sx * (w / 2 + 0.02), 0.5, -0.0, 0.3, wallH, 0.3, { color: trim, ao: { k: 0.25, h: 0.8, y0: 0.5 } });
    mb.box('trim', x, h - 0.28, z - d / 2 + 0.02, w + 0.22, 0.3, d + 0.22, { color: trim });
    if (wallStyle.beams || p.beams) {
      const bm = '#5b3b25';
      const nb = Math.max(2, Math.round(w / 1.9));
      for (let i = 0; i <= nb; i++) F.box('wooddark', -w / 2 + (w * i) / nb, 0.5, 0.0, 0.2, wallH - 0.2, 0.12, { color: bm, tex: 1.5 });
      F.box('wooddark', 0, h * 0.55, 0.0, w, 0.2, 0.12, { color: bm, tex: 1.5 });
      F.box('wooddark', 0, 0.5, 0.0, w, 0.2, 0.12, { color: bm, tex: 1.5 });
      for (let i = 0; i < nb; i += 2) {
        const bx = -w / 2 + (w * (i + 0.5)) / nb;
        F.box('wooddark', bx, 0.7, 0.0, 0.14, Math.hypot((w / nb), h * 0.45) * 0.9, 0.1, { color: bm, tex: 1.5, rotZ: Math.atan2(w / nb, h * 0.5) * (i % 4 === 0 ? 1 : -1) });
      }
    }

    // ---- roof
    const g = { cx: x, eaveZ: z + oh, eaveY: h - oh * (rise / (d / 2)) + 0.05, ridgeZ: z - d / 2, ridgeY: h + rise };
    if (style === 'gable' || style === 'hip') {
      const run = d / 2 + oh;
      const dy = g.ridgeY - g.eaveY;
      const len = Math.hypot(run, dy);
      const th = Math.atan2(dy, run);
      const rw = w + oh * 2;
      const midZ = (g.eaveZ + g.ridgeZ) / 2, midY = (g.eaveY + g.ridgeY) / 2;
      const nz = Math.cos(th) * rt * 0.5, ny = Math.sin(th) * rt * 0.5;
      // south slope (lit, visible)
      mb.box(roofDef.mat, x, midY + rt * 0.5 - 0.0, midZ + 0, rw, rt, len, { color: roofColor, rotX: th, tex: roofDef.mat === 'thatch' ? 2.4 : 2.0, uvOff: [0.07 * (p.seed || 1), 0], jitter: 0.02, y: 0 });
      // north slope (rarely seen)
      mb.box(roofDef.mat, x, midY + rt * 0.5, (g.ridgeZ + (z - d - oh)) / 2, rw, rt, len, { color: roofColor, rotX: -th, tex: 2.0 });
      // ridge cap
      mb.box('flat', x, g.ridgeY + rt * 0.5 - 0.05, g.ridgeZ, rw + 0.12, 0.2, 0.42, { color: roofDef.ridge, jitter: 0.03 });
      // eave fascia
      mb.box('trim', x, g.eaveY - 0.02, g.eaveZ + 0.03, rw, 0.2, 0.12, { color: trim, rotX: 0 });
      mb.box('wooddark', x, g.eaveY - 0.12, g.eaveZ - 0.1, rw - 0.1, 0.1, 0.2, { color: '#5b3b25' });
      // gable end trim (rake boards)
      for (const sgn of [-1, 1]) {
        const ex = x + sgn * (rw / 2 - 0.04);
        const [bx, bz] = [ex, midZ];
        mb.box('trim', bx, midY + rt * 0.5 + 0.02, bz, 0.12, 0.26, len + 0.1, { color: trim, rotX: th });
      }
      // snow on the south slope + ridge
      const sb = ctx.mbFor('winter');
      sb.box('snow', x, midY + rt * 0.5 + 0.16, midZ - 0.05, rw - 0.08, 0.2, len - 0.12, { rotX: th, color: '#e6eefa' });
      sb.box('snow', x, g.ridgeY + 0.1, g.ridgeZ, rw, 0.22, 0.5, {});
      // patched roof (cottage charm)
      if (p.patch) {
        const pts = Array.isArray(p.patch) ? p.patch : [[-w * 0.2, 0.45], [w * 0.22, 0.7]];
        for (const [px, pu] of pts) {
          const sp = roofSlopePoint(g, pu, px);
          mb.box('shingle', sp.x, sp.y + rt * 0.5 + 0.012, sp.z, 1.7, 0.05, 1.15, { color: p.patchColor || '#b9a07e', rotX: th, tex: 1.6, jitter: 0.05 });
        }
      }
      // dormers
      for (const dm of p.dormers || []) {
        const sp = roofSlopePoint(g, 0.52, dm.at || 0);
        const dw = dm.w ?? 1.5;
        const dz = sp.z - 0.1;
        mb.box(wallStyle.mat, sp.x, sp.y - 0.45, dz, dw, 1.55, 1.1, { color: wallColor, tex: 2 });
        const Fd = frame(mb, sp.x, sp.y - 0.45, dz + 0.55, 0);
        buildWindow(ctx, Fd, 0, { w: 0.7, h: 0.8, y: 0.45, trim, shutters: dm.shutters });
        const dr = 0.85;
        const dTh = Math.atan2(dr, dw / 2 + 0.2);
        const dl = Math.hypot(dw / 2 + 0.2, dr);
        for (const sgn of [-1, 1]) mb.box(roofDef.mat, sp.x + sgn * (dw / 4 + 0.05), sp.y + 1.1 + dr * 0.5 - 0.05, dz + 0.05, dl, 0.14, 1.5, { color: roofColor, rotZ: -sgn * dTh, tex: 1.5 });
      }
    }

    // ---- gable end triangles (wall colour) so the sides are not hollow
    // (simple triangular prisms built from thin boxes are overkill; use tri geometry)
    for (const sgn of [-1, 1]) {
      mb.tri(wallStyle.mat, x + sgn * (w / 2 - 0.02), h - 0.1, z - d / 2, d + 0.2, rise + 0.1, { color: wallColor, rotY: sgn * Math.PI / 2, tex: 2.4 });
    }

    // ---- door
    let doorX = null;
    if (p.door !== false) {
      const dd = { ...(p.door || {}) };
      doorX = x + (dd.at || 0);
      buildDoor(ctx, F, doorX - x, dd, g);
      if (dd.transition) {
        const tid = dd.transition;
        ctx.transition({
          id: tid, kind: 'door', rect: { x: doorX - 0.85, z: z + 0.05, w: 1.7, h: 1.25 }, stand: { x: doorX, z: z + 0.8 },
          to: { area: dd.to || tid.slice(3), spawn: dd.spawn || `from_${ctx.area.id}` },
        });
      }
      if (dd.anchor) ctx.anchor(dd.anchor, doorX, z + 1.9, 's');
    }

    // ---- windows
    let wins = p.windows;
    if (typeof wins === 'number') {
      const n = wins;
      wins = [];
      const dx = p.door ? p.door.at || 0 : 0;
      for (let i = 0; i < n; i++) {
        const at = -w / 2 + ((i + 0.5) / n) * w;
        if (p.door !== false && Math.abs(at - dx) < 1.7) continue;
        wins.push({ at, shutters: p.shutters, box: p.boxes });
      }
    }
    for (const wdef of wins || []) {
      const side = wdef.wall || 's';
      if (side === 's') buildWindow(ctx, F, wdef.at, { trim, ...wdef });
      else {
        const sgn = side === 'e' ? 1 : -1;
        const Fs = frame(mb, x + sgn * (w / 2), 0, z - d / 2, sgn * Math.PI / 2);
        buildWindow(ctx, Fs, wdef.at || 0, { trim, ...wdef });
      }
    }
    // ---- awning, sign, chimney, extras
    if (p.awning) buildAwning(ctx, F, p.awning);
    if (p.sign) buildSign(ctx, F, p.sign, w);
    {
      const c = p.chimney || {};
      if (p.chimney !== false) {
        const cx = x + (c.at ?? w * 0.27);
        const cz = z - d / 2 - 0.25;
        const top = g.ridgeY + 1.05;
        mb.box('brick', cx, h - 0.5, cz, 0.95, top - (h - 0.5), 0.95, { tex: 1.2, ao: { k: 0.2, h: 0.8, y0: h } });
        mb.box('stone', cx, top - 0.02, cz, 1.2, 0.2, 1.2, { tex: 1.2, color: '#c9c0b0' });
        mb.box('flat', cx, top + 0.18, cz, 0.7, 0.06, 0.7, { color: '#2a2220' });
        ctx.mbFor('winter').box('snow', cx, top + 0.18, cz, 1.15, 0.09, 1.15, {});
        if (c.smoke !== false) ctx.smoke(cx, top + 0.3, cz, { rate: c.rate ?? 1.2 });
      }
    }
    if (p.ivy) {
      const rng = ctx.rngFor(5);
      for (let i = 0; i < (p.ivy === true ? 14 : p.ivy); i++) {
        const sx = rng() < 0.5 ? -1 : 1;
        const ix = x + sx * (w / 2 - 0.15 - rng() * 1.2);
        const iy = 0.6 + rng() * (h - 1.2);
        mb.ball('leaf_leaf', ix, iy, z + 0.12, 0.28 + rng() * 0.18, { lump: 0.3, detail: 1, seed: i + 3, sy: 0.9, sz: 0.55, tone: rng(), sway: 0.02 });
      }
    }
    if (p.flag) {
      const fx = x + (p.flag.at || 0);
      const fy = g.ridgeY;
      mb.cyl('metal', fx, fy, g.ridgeZ, 0.05, 0.06, 2.2, { color: PAL.iron, seg: 6 });
      mb.ball('metal', fx, fy + 2.25, g.ridgeZ, 0.09, { color: PAL.brass, detail: 0 });
      const cloth = new THREE.PlaneGeometry(1.1, 0.7, 6, 1);
      colorize(cloth, p.flag.color || '#d9534a');
      const fm = new THREE.Mesh(cloth, ctx.mats.swaycloth);
      fm.position.set(fx + 0.6, fy + 1.8, g.ridgeZ);
      ctx.object(fm);
      const posA = cloth.attributes.position;
      const base = posA.array.slice();
      ctx.updater((dt, t) => {
        for (let i = 0; i < posA.count; i++) {
          const px = base[i * 3] + 0.55;
          posA.setZ(i, Math.sin(t * 3.2 + px * 3.5) * 0.12 * px);
        }
        posA.needsUpdate = true;
      });
    }
    if (p.steps) {
      const s = p.steps;
      const sw = s.w ?? 5;
      const n = s.n ?? 3;
      for (let i = 0; i < n; i++) {
        mb.box('stone', x + (s.at || 0), 0, z + 0.55 + (n - i) * 0.42 - 0.2, sw - i * 0.15, 0.18 * (i + 1), 0.46, { color: '#e8e2d4', tex: 1.4, ao: { k: 0.2, h: 0.25 } });
      }
    }
    ctx.interactable(p, { x: doorX ?? x, z: z + 1.6, r: 1.4, type: 'object' });
  },
};

export const lighthouse = {
  doc: 'Tapered striped lighthouse with gallery + lamp room. params: x,z (base centre), h=9, r=1.8, light:true',
  build(ctx, p) {
    const mb = ctx.mb;
    const h = p.h ?? 9, r = p.r ?? 1.8;
    ctx.solidCircle(p.x, p.z, r + 0.4, { tile: true });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: r + 0.9, rz: r + 0.8, a: 0.5 });
    mb.cyl('stone', p.x, 0, p.z, r * 1.05, r * 1.3, 0.8, { seg: 18, color: '#b8b0a2', tex: 2, ao: { k: 0.3, h: 0.8 } });
    const segs = 5;
    for (let i = 0; i < segs; i++) {
      const y0 = 0.8 + (i * (h - 2.4)) / segs, y1 = 0.8 + ((i + 1) * (h - 2.4)) / segs;
      const t0 = 1 - (i / segs) * 0.32, t1 = 1 - ((i + 1) / segs) * 0.32;
      mb.cyl('plaster', p.x, y0, p.z, r * t1, r * t0, y1 - y0, { seg: 18, color: i % 2 ? (p.stripe || '#d9534a') : '#fbf4e6', tex: 2.2 });
    }
    const yTop = h - 1.6;
    mb.cyl('wooddark', p.x, yTop, p.z, r * 0.9, r * 0.78, 0.2, { seg: 18, color: '#4a3a30' });
    mb.cyl('wooddark', p.x, yTop + 0.2, p.z, r * 0.88, r * 0.88, 0.12, { seg: 18, color: '#4a3a30' });
    mb.cyl('glass', p.x, yTop + 0.3, p.z, r * 0.56, r * 0.56, 1.0, { seg: 12, color: '#ffffff' });
    mb.cone('shingle', p.x, yTop + 1.3, p.z, r * 0.85, 0.9, { seg: 14, color: '#c4473c' });
    mb.ball('metal', p.x, yTop + 2.28, p.z, 0.12, { color: PAL.brass, detail: 0 });
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      mb.box('metal', p.x + Math.cos(a) * r * 0.86, yTop + 0.32, p.z + Math.sin(a) * r * 0.86, 0.06, 0.55, 0.06, { color: PAL.iron });
    }
    mb.box('door', p.x, 0.8, p.z + r * 1.0, 0.8, 1.3, 0.1, { color: '#7a4a2c' });
    ctx.interactable(p, { x: p.x, z: p.z + r + 1.2 });
  },
};

export const clocktower = {
  doc: 'Free-standing clock tower; hands show real game time. params: x,z (base centre), h=6.5, w=1.8, base:"stone"',
  build(ctx, p) {
    const mb = ctx.mb;
    const w = p.w ?? 1.9, h = p.h ?? 6.2;
    ctx.solidCircle(p.x, p.z, w * 0.62, { tile: true });
    ctx.bake({ type: 'ellipse', x: p.x, z: p.z, rx: w + 0.6, rz: w + 0.5, a: 0.4 });
    mb.box('stone', p.x, 0, p.z, w + 0.5, 0.5, w + 0.5, { color: '#cfc8ba', tex: 1.6, ao: { k: 0.25, h: 0.5 } });
    mb.box('stone', p.x, 0.5, p.z, w, h - 2.3, w, { color: '#e8e0cd', tex: 2, ao: { k: 0.3, h: 1 } });
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) mb.box('trim', p.x + sx * w / 2, 0.5, p.z + sz * w / 2, 0.22, h - 2.3, 0.22, { color: '#fff4de' });
    // clock block
    const cy = h - 1.8;
    mb.box('trim', p.x, cy, p.z, w + 0.5, 1.7, w + 0.5, { color: '#fff4de' });
    mb.box('wooddark', p.x, cy + 1.7, p.z, w + 0.8, 0.22, w + 0.8, { color: '#5a3a24' });
    // roof: pyramid
    mb.cone('shingle', p.x, cy + 1.9, p.z, (w + 0.9) * 0.74, 1.7, { seg: 4, color: p.roofColor || '#6c98cc', rotY: Math.PI / 4 });
    mb.ball('metal', p.x, cy + 3.7, p.z, 0.14, { color: PAL.brass, detail: 0 });
    mb.cyl('metal', p.x, cy + 3.7, p.z, 0.02, 0.03, 0.5, { color: PAL.brass, seg: 4 });
    ctx.mbFor('winter').cone('snow', p.x, cy + 2.35, p.z, (w + 0.9) * 0.5, 1.1, { seg: 4, rotY: Math.PI / 4 });
    // dial (dynamic)
    const dial = new THREE.Group();
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.68, 28), new THREE.MeshLambertMaterial({ color: '#fffaf0' }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.74, 28), new THREE.MeshLambertMaterial({ color: '#c79a3a' }));
    ring.position.z = 0.003;
    dial.add(face, ring);
    const tickMat = new THREE.MeshBasicMaterial({ color: '#4a3426' });
    for (let i = 0; i < 12; i++) {
      const t = new THREE.Mesh(new THREE.PlaneGeometry(0.05, i % 3 === 0 ? 0.16 : 0.08), tickMat);
      const a = (i / 12) * Math.PI * 2;
      t.position.set(Math.sin(a) * 0.52, Math.cos(a) * 0.52, 0.006);
      t.rotation.z = -a;
      dial.add(t);
    }
    const handMat = new THREE.MeshBasicMaterial({ color: '#3a2a22' });
    const mkHand = (len, wd) => {
      const hg = new THREE.PlaneGeometry(wd, len);
      hg.translate(0, len / 2 - 0.04, 0);
      return new THREE.Mesh(hg, handMat);
    };
    const hourHand = mkHand(0.36, 0.08);
    const minHand = mkHand(0.54, 0.055);
    hourHand.position.z = 0.012;
    minHand.position.z = 0.016;
    dial.add(hourHand, minHand);
    dial.position.set(p.x, cy + 0.85, p.z + (w + 0.5) / 2 + 0.01);
    ctx.object(dial, { cast: false });
    const dial2 = dial.clone();
    dial2.position.set(p.x - (w + 0.5) / 2 - 0.01, cy + 0.85, p.z);
    dial2.rotation.y = -Math.PI / 2;
    ctx.object(dial2, { cast: false });
    const hands2 = [dial2.children[dial2.children.length - 2], dial2.children[dial2.children.length - 1]];
    ctx.updater((dt, t, env) => {
      const m = ((env.minutes % 720) + 720) % 720;
      const hr = (m / 60) * (Math.PI * 2 / 12);
      const mn = ((m % 60) / 60) * Math.PI * 2;
      hourHand.rotation.z = -hr;
      minHand.rotation.z = -mn;
      hands2[0].rotation.z = -hr;
      hands2[1].rotation.z = -mn;
    });
    ctx.interactable(p, { x: p.x, z: p.z + w, r: 1.6, type: 'object', label: 'Clock tower', text: 'The old clock tower keeps good time.' });
  },
};
