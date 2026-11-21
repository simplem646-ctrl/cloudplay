/** The chibi Rig: node hierarchy, locomotion blend, action layer with crossfades, face, emotes, held props, sway springs. */
import * as THREE from 'three';
import { EXPRESSIONS, ANIMATIONS, HELD_PROPS, EMOTES } from '../core/registry.js';
import { dirToYaw, yawToDir, mulberry32, hashString } from '../core/util.js';
import { toonMesh, gradientMap } from './materials.js';
import { buildParts, resolveAppearance } from './build.js';
import { DIM } from './body.js';
import { createFaceAtlas, instanceFace, decalGeometry, EYE_DECAL, MOUTH_DECAL, EXPR_INDEX, TALK_FRAME0 } from './face.js';
import { C, NCH, REST, DEFS, AUTO_PROP, poseIdle, poseWalk, poseRun } from './anim.js';
import { propGeometry } from './props.js';
import { createEmoteSprite } from './emotes.js';

const warned = new Set();
function warnOnce(key, msg) { if (!warned.has(key)) { warned.add(key); console.warn(msg); } }
const TAU = Math.PI * 2;
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const wrapPi = (a) => { a %= TAU; if (a > Math.PI) a -= TAU; if (a < -Math.PI) a += TAU; return a; };

/** Expression an animation implies while it plays. */
const ANIM_EXPR = {
  laugh: 'laugh', sad: 'sad', angry: 'angry', surprised: 'surprised', shy: 'shy', think: 'thinking', cheer: 'happy', happy_hop: 'happy', wave: 'happy',
  fish_bite: 'surprised', fish_catch: 'happy', show_item: 'happy', dance: 'happy', stargaze: 'happy', fall: 'surprised', spin: 'happy', eat: 'happy', pickup: 'neutral',
};
const CLOSED_EYES = new Set(['sleep', 'yawn']);
const LOCO_DEFS = {
  idle: { loop: true, dur: 1, fn: (P, t) => poseIdle(P, t) },
  walk: { loop: true, dur: 1, fn: (P, t) => poseWalk(P, t * 8) },
  run: { loop: true, dur: 1, fn: (P, t) => poseRun(P, t * 11) },
};
const ALL_DEFS = { ...DEFS, ...LOCO_DEFS };
const SWAY_GAIN = { scarf: 1.7, cape: 1.4, back: 1.0, left: 1.0, right: 1.0 };

export function createRig(id, opts = {}) {
  let season = opts.season || 'spring';
  const look = opts.look || {};
  const userScale = opts.scale ?? 1;
  const rng = mulberry32(hashString(id) + 17);
  let parts = buildParts(id, season, look);
  const app0 = parts.app;
  const baseHeight = app0.height;

  const group = new THREE.Group();
  group.name = `char:${id}`;
  group.scale.setScalar(userScale);
  const yaw = new THREE.Group();
  group.add(yaw);

  // ---------------------------------------------------------------- scene graph (rebuilt on season change)
  let N = null;
  let face = null;
  const stats = { meshes: 0, drawCalls: 0, vertices: 0 };
  const ownMats = [];
  let propMesh = null;
  const emote = createEmoteSprite();
  group.add(emote.sprite);

  function assemble() {
    parts = buildParts(id, season, look);
    const app = parts.app;
    const body = new THREE.Group();
    body.position.y = DIM.hipY;
    const upper = new THREE.Group();
    body.add(upper);
    upper.add(toonMesh(parts.torso));
    const legs = [], arms = [];
    for (const s of [1, -1]) {
      const n = new THREE.Group();
      n.position.set(s * DIM.legX, 0, 0);
      n.add(toonMesh(parts.leg));
      body.add(n);
      legs.push(n);
    }
    let hand = null;
    for (const s of [1, -1]) {
      const n = new THREE.Group();
      n.position.set(s * DIM.shoulder.x, DIM.shoulder.y, 0);
      n.add(toonMesh(s > 0 ? parts.armL : parts.armR));
      upper.add(n);
      arms.push(n);
      if (s < 0) {
        hand = new THREE.Group();
        hand.position.set(0, -(DIM.armLen + 0.024), 0.004);
        n.add(hand);
      }
    }
    const neck = new THREE.Group();
    neck.position.y = DIM.neckY;
    upper.add(neck);
    const head = new THREE.Group();
    head.position.y = DIM.headC;
    neck.add(head);
    head.add(toonMesh(parts.head));
    // face decals
    face = null;
    const atlas = createFaceAtlas(app, id);
    if (atlas) {
      face = instanceFace(atlas);
      parts.eyeGeo = parts.eyeGeo || decalGeometry(parts.skull, app.head.jaw, EYE_DECAL);
      parts.mouthGeo = parts.mouthGeo || decalGeometry(parts.skull, app.head.jaw, MOUTH_DECAL);
      for (const [geo, map] of [[parts.eyeGeo, face.eye], [parts.mouthGeo, face.mouth]]) {
        const m = new THREE.MeshToonMaterial({ map, transparent: true, alphaTest: 0.04, depthWrite: false, gradientMap: gradientMap(), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 });
        ownMats.push(m);
        const mesh = new THREE.Mesh(geo, m);
        mesh.renderOrder = 2;
        head.add(mesh);
      }
    }
    const sway = [];
    for (const sp of parts.sways) {
      const n = new THREE.Group();
      n.position.set(sp.pivot[0], sp.pivot[1], sp.pivot[2]);
      n.add(toonMesh(sp.geo));
      (sp.parent === 'head' ? head : upper).add(n);
      sway.push({ node: n, gain: SWAY_GAIN[sp.id] || 1, ax: 0, vx: 0, az: 0, vz: 0, phase: rng() * 6 });
    }
    yaw.add(body);
    yaw.scale.setScalar(baseHeight / parts.nominalTop);
    N = { body, upper, legs, arms, neck, head, hand, sway };
    stats.meshes = 0; stats.drawCalls = 0; stats.vertices = 0;
    body.traverse((o) => {
      if (o.isMesh) {
        stats.meshes++;
        stats.drawCalls += Array.isArray(o.material) ? o.material.length : 1;
        stats.vertices += o.geometry.attributes.position.count;
      }
    });
    propMesh = null;
    refreshProp(true);
  }

  function teardown() {
    if (!N) return;
    yaw.remove(N.body);
    for (const m of ownMats.splice(0)) m.dispose();
    if (face) face.dispose();
    face = null;
    N = null;
  }

  // ---------------------------------------------------------------- state
  let time = 0, visible = true;
  let targetYaw = 0, curYaw = 0;
  let speedTarget = 0, speed = 0, gait = 0;
  let exprBase = 'neutral';
  let heldName = null, autoProp = null, shownProp = undefined;
  let act = null, xfade = null;
  let blinkT = 1.5 + rng() * 2, blinkLeft = 0, talkClock = 0;
  const pI = new Float32Array(NCH), pW = new Float32Array(NCH), pR = new Float32Array(NCH);
  const pA = new Float32Array(NCH), f = new Float32Array(NCH), snap = new Float32Array(NCH);
  f.set(REST);
  let lastVy = 0, lastBy = 0;

  function refreshProp(force) {
    const want = autoProp || heldName || (parts.app.held ? parts.app.held.kind : null);
    if (!force && want === shownProp) return;
    shownProp = want;
    if (propMesh && N && N.hand) { N.hand.remove(propMesh); propMesh = null; }
    if (!want || !N || !N.hand) return;
    const geo = propGeometry(want, parts.app.held && parts.app.held.kind === want ? parts.app.held : {});
    if (!geo) return;
    propMesh = toonMesh(geo);
    propMesh.position.set(0, 0, 0.012);
    N.hand.add(propMesh);
  }

  function endAct(resolved = true) {
    if (!act) return;
    const a = act;
    act = null;
    autoProp = null;
    if (a.resolve) a.resolve();
    if (a.onDone && resolved) { try { a.onDone(); } catch (e) { console.error(e); } }
    refreshProp();
  }

  // ---------------------------------------------------------------- API
  const rig = {
    id, group, height: baseHeight * userScale,
    get stats() { return stats; },
    setFacing(d, o = {}) {
      targetYaw = typeof d === 'number' ? d : dirToYaw(d);
      if (o.snap) { curYaw = targetYaw; yaw.rotation.y = curYaw; }
    },
    getFacing() { return yawToDir(targetYaw); },
    faceTowards(x, z) {
      const dx = x - group.position.x, dz = z - group.position.z;
      if (Math.abs(dx) + Math.abs(dz) < 1e-4) return;
      targetYaw = Math.atan2(dx, dz);
    },
    locomote(s) { speedTarget = Math.max(0, +s || 0); },
    play(name, o = {}) {
      let def = ALL_DEFS[name];
      if (!def || !ANIMATIONS.includes(name)) { // data-driven callers: degrade to idle, warn once per name
        warnOnce(`animation:${name}`, `[characters] unknown/unimplemented animation "${name}" -> idle`);
        def = null;
      }
      if (!def) { rig.stop(); return Promise.resolve(); }
      if (act) { snap.set(f); xfade = { pose: new Float32Array(snap), w: 1 }; endAct(false); }
      return new Promise((resolve) => {
        const loop = o.loop === undefined ? !!def.loop : !!o.loop;
        act = { name, def, t: 0, w: 0, loop, speed: o.speed || 1, resolve, onDone: o.onDone, out: false, done: false };
        autoProp = AUTO_PROP[name] || null;
        refreshProp();
      });
    },
    stop() { if (act && !act.out) { act.out = true; if (act.resolve) { act.resolve(); act.resolve = null; } autoProp = null; refreshProp(); } },
    setExpression(name) { if (EXPR_INDEX[name] !== undefined) exprBase = name; },
    emote(name) { if (EMOTES.includes(name)) emote.start(name, baseHeight + 0.0); },
    setHeld(p) {
      if (p && !HELD_PROPS.includes(p)) warnOnce(`prop:${p}`, `[characters] unknown held prop "${p}" -> none`);
      heldName = p && HELD_PROPS.includes(p) ? p : null; refreshProp();
    },
    setVisible(b) { visible = !!b; group.visible = visible; },
    setSeason(s) { if (s !== season && ['spring', 'summer', 'autumn', 'winter'].includes(s)) { season = s; teardown(); assemble(); } },
    getSeason() { return season; },
    update(dt) {
      dt = clamp(dt, 0, 0.1);
      time += dt;
      // action timeline (advances even when hidden so promises always resolve)
      if (act) {
        act.t += dt * act.speed;
        if (!act.loop && !act.out && act.t >= act.def.dur) {
          act.out = true; act.done = true;
          const r = act.resolve; act.resolve = null; if (r) r();
          if (act.onDone) { try { act.onDone(); } catch (e) { console.error(e); } act.onDone = null; }
          autoProp = null; refreshProp();
        }
        act.w = act.out ? act.w - dt * 4.5 : Math.min(1, act.w + dt * 5.5);
        if (act.out && act.w <= 0) { act = null; }
      }
      if (!visible) return;
      // facing
      const diff = wrapPi(targetYaw - curYaw);
      curYaw += diff * (1 - Math.exp(-14 * dt));
      yaw.rotation.y = curYaw;
      // locomotion blend
      speed += (speedTarget - speed) * (1 - Math.exp(-10 * dt));
      if (speed < 0.02 && speedTarget === 0) speed = 0;
      const stride = speed < 3.8 ? 1.15 : 1.7;
      gait += dt * (speed / stride) * TAU;
      const wRun = clamp((speed - 3.4) / 1.4, 0, 1);
      const wIdle = clamp(1 - speed / 0.9, 0, 1);
      const wWalk = (1 - wIdle) * (1 - wRun);
      poseIdle(pI, time);
      if (wIdle < 1) { poseWalk(pW, gait); poseRun(pR, gait); }
      for (let i = 0; i < NCH; i++) f[i] = pI[i] * wIdle + (wIdle < 1 ? pW[i] * wWalk + pR[i] * wRun : 0);
      // action layer
      if (act && act.w > 0.001) {
        pA.set(f);
        act.def.fn(pA, act.t, act.loop && !act.def.loop ? (act.t / act.def.dur) % 1 : Math.min(1, act.t / act.def.dur), act);
        const w = act.w * act.w * (3 - 2 * act.w);
        for (let i = 0; i < NCH; i++) f[i] += (pA[i] - f[i]) * w;
      }
      if (xfade) {
        xfade.w -= dt * 5;
        if (xfade.w <= 0) xfade = null;
        else { const w = xfade.w * xfade.w * (3 - 2 * xfade.w); for (let i = 0; i < NCH; i++) f[i] += (xfade.pose[i] - f[i]) * w; }
      }
      // apply pose
      const { body, upper, legs, arms, head, hand } = N;
      const lift = Math.min(1 - Math.cos(f[C.llf]), 1 - Math.cos(f[C.lrf]));
      const drop = f[C.lock] * Math.max(0, lift) * DIM.hipY;
      body.position.set(f[C.bx], DIM.hipY + f[C.by] - drop, f[C.bz]);
      body.rotation.set(f[C.brx], f[C.bry], f[C.brz]);
      const sq = f[C.sq];
      upper.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
      legs[0].rotation.set(-f[C.llf], 0, f[C.lsp]);
      legs[1].rotation.set(-f[C.lrf], 0, -f[C.lsp]);
      arms[0].rotation.set(-f[C.alf], f[C.alt], f[C.alo]);
      arms[1].rotation.set(-f[C.arf], f[C.art], -f[C.aro]);
      head.rotation.set(f[C.hx] - 0.3, f[C.hy], f[C.hz]); // slight chin-up so the face reads from the high camera
      head.position.y = DIM.headC + f[C.hoy];
      if (hand) hand.rotation.x = f[C.arf] * 0.85 + f[C.prx];
      // sway springs
      const vy = dt > 0 ? (f[C.by] - lastBy) / dt : 0;
      lastBy = f[C.by];
      for (const s of N.sway) {
        const tx = speed * 0.07 * s.gain - vy * 0.12 + 0.02 * Math.sin(time * 1.7 + s.phase);
        const tz = 0.03 * Math.sin(time * 1.1 + s.phase) + 0.1 * (f[C.bry] + f[C.hy] * 0.4) * s.gain + (speed > 0.5 ? 0.06 * Math.sin(time * 13 + s.phase) * s.gain : 0);
        s.vx += ((tx - s.ax) * 90 - s.vx * 9) * dt; s.ax += s.vx * dt;
        s.vz += ((tz - s.az) * 90 - s.vz * 9) * dt; s.az += s.vz * dt;
        s.node.rotation.set(s.ax, 0, s.az);
      }
      // face
      if (face) {
        const animName = act && act.w > 0.2 ? act.name : null;
        const exprName = (animName && ANIM_EXPR[animName]) || exprBase;
        blinkT -= dt;
        if (blinkT <= 0) { blinkLeft = 0.13; blinkT = 2.2 + rng() * 3.8; if (rng() < 0.2) blinkT = 0.35; }
        if (blinkLeft > 0) blinkLeft -= dt;
        const closed = blinkLeft > 0 || (animName && CLOSED_EYES.has(animName));
        face.setEye(EXPR_INDEX[exprName], closed);
        const talking = animName === 'talk';
        if (talking) { talkClock += dt * 9; const k = [1, 0, 2, 1, 0, 2, 1, 1][Math.floor(talkClock) % 8]; face.setMouth(TALK_FRAME0 + k); }
        else { talkClock = 0; face.setMouth(animName === 'yawn' ? TALK_FRAME0 + 1 : EXPR_INDEX[exprName]); }
      }
      emote.update(dt);
    },
    dispose() {
      teardown();
      emote.dispose();
      if (act && act.resolve) act.resolve();
      act = null;
      if (group.parent) group.parent.remove(group);
    },
    /** debug / tests */
    _state() { return { time, speed, act: act ? act.name : null, exprBase, held: shownProp, emote: emote.active ? emote.name : null, pose: f }; },
  };
  assemble();
  yaw.rotation.y = curYaw;
  return rig;
}
