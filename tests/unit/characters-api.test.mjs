import test from 'node:test';
import assert from 'node:assert/strict';
import * as Chars from '../../src/characters/index.js';
import { APPEARANCES } from '../../src/characters/appearances.js';
import { HAIR_STYLES } from '../../src/characters/hair.js';
import { DEFS, AUTO_PROP, IMPLEMENTED } from '../../src/characters/anim.js';
import { PROP_KINDS, propGeometry } from '../../src/characters/props.js';
import { NPC_IDS, KID_IDS, ELDER_IDS, ANIMATIONS, EXPRESSIONS, EMOTES, HELD_PROPS, CRITTERS } from '../../src/core/registry.js';

const TIER3_OK = ['spin']; // everything else must exist
const step = (rig, secs, dt = 1 / 30) => { for (let t = 0; t < secs; t += dt) rig.update(dt); };

test('API surface: named exports exist', () => {
  for (const n of ['createCharacter', 'createCritter', 'listAppearances', 'preload']) assert.equal(typeof Chars[n], 'function', n);
});

test('appearance coverage: player + every NPC id, valid hair styles and sizes', () => {
  assert.deepEqual(Chars.listAppearances().sort(), ['player', ...NPC_IDS].sort());
  for (const id of ['player', ...NPC_IDS]) {
    const a = APPEARANCES[id];
    assert.ok(a, id);
    assert.ok(HAIR_STYLES.includes(a.hair.style), `${id} hair ${a.hair.style}`);
    assert.ok(/^#[0-9a-f]{6}$/i.test(a.skin), `${id} skin`);
    if (KID_IDS.includes(id)) assert.ok(a.height >= 0.85 && a.height <= 0.95, `${id} kid height`);
    else if (ELDER_IDS.includes(id)) assert.ok(a.height >= 0.98 && a.height <= 1.1, `${id} elder height`);
    else assert.ok(a.height >= 1.08 && a.height <= 1.22, `${id} adult height`);
  }
});

test('animations: implemented names are a subset of ANIMATIONS and only `spin`-class names may be missing', () => {
  for (const n of IMPLEMENTED) assert.ok(ANIMATIONS.includes(n), n);
  for (const n of ANIMATIONS) if (!TIER3_OK.includes(n)) assert.ok(IMPLEMENTED.includes(n), `missing animation ${n}`);
  for (const n of Object.keys(AUTO_PROP)) assert.ok(HELD_PROPS.includes(AUTO_PROP[n]) && ANIMATIONS.includes(n), n);
});

test('held props: geometry exists for every HELD_PROPS entry', () => {
  for (const p of HELD_PROPS) assert.ok(propGeometry(p), p);
  assert.ok(PROP_KINDS.length >= HELD_PROPS.length);
});

test('every character builds a rig with the Rig shape (no WebGL / canvas needed)', () => {
  for (const id of Chars.listAppearances()) {
    const rig = Chars.createCharacter(id);
    for (const m of ['setFacing', 'getFacing', 'faceTowards', 'locomote', 'play', 'stop', 'setExpression', 'emote', 'setHeld', 'setVisible', 'setSeason', 'update', 'dispose']) assert.equal(typeof rig[m], 'function', `${id}.${m}`);
    assert.ok(rig.group && rig.group.isObject3D);
    assert.ok(rig.height > 0.8 && rig.height < 1.25, `${id} height ${rig.height}`);
    assert.ok(rig.stats.meshes <= 30, `${id} meshes ${rig.stats.meshes}`);
    step(rig, 0.2);
    rig.dispose();
  }
});

test('facing: dirs, snap, faceTowards', () => {
  const rig = Chars.createCharacter('mira');
  rig.setFacing('e', { snap: true });
  assert.equal(rig.getFacing(), 'e');
  rig.setFacing(Math.PI);
  assert.equal(rig.getFacing(), 'n');
  rig.group.position.set(0, 0, 0);
  rig.faceTowards(-5, 0.2);
  assert.equal(rig.getFacing(), 'w');
  rig.faceTowards(0.1, 5);
  assert.equal(rig.getFacing(), 's');
});

test('play(): one-shots resolve at their end (fake clock), loops resolve on stop(), onDone fires', async () => {
  const rig = Chars.createCharacter('theo');
  let done = 0, resolved = false;
  const p = rig.play('wave', { onDone: () => done++ }).then(() => { resolved = true; });
  step(rig, DEFS.wave.dur * 0.5);
  await Promise.resolve();
  assert.equal(resolved, false);
  step(rig, DEFS.wave.dur * 0.6);
  await p;
  assert.equal(resolved, true);
  assert.equal(done, 1);
  // speed option halves the duration
  let fast = false;
  rig.play('nod', { speed: 2 }).then(() => { fast = true; });
  step(rig, DEFS.nod.dur * 0.55);
  await Promise.resolve();
  assert.equal(fast, true);
  // looping animation resolves on stop()
  let looped = false;
  rig.play('talk').then(() => { looped = true; });
  step(rig, 5);
  await Promise.resolve();
  assert.equal(looped, false);
  rig.stop();
  await Promise.resolve();
  assert.equal(looped, true);
  step(rig, 1);
  assert.equal(rig._state().act, null);
  // replacing an animation resolves the previous promise
  let first = false;
  rig.play('talk').then(() => { first = true; });
  rig.play('think');
  await Promise.resolve();
  assert.equal(first, true);
  rig.dispose();
});

test('unknown animation / prop names degrade gracefully (warn once, never throw)', async () => {
  const rig = Chars.createCharacter('mira');
  const warns = [];
  const orig = console.warn;
  console.warn = (m) => warns.push(m);
  try {
    await rig.play('moonwalk_of_doom');
    await rig.play('moonwalk_of_doom');
    rig.setHeld('flamethrower');
    rig.setHeld('flamethrower');
    rig.setExpression('bogus');
    rig.emote('bogus');
    rig.setSeason('monsoon');
  } finally { console.warn = orig; }
  assert.equal(warns.length, 2);
  assert.equal(rig._state().held, null);
  rig.dispose();
});

test('held props / emotes / expressions / seasons are accepted for every registry name', () => {
  const rig = Chars.createCharacter('player', { look: { hair: '#222222', jacket: '#aa3333', scarf: '#33aa33' } });
  for (const p of HELD_PROPS) { rig.setHeld(p); assert.equal(rig._state().held, p); }
  rig.setHeld(null);
  for (const e of EXPRESSIONS) rig.setExpression(e);
  for (const e of EMOTES) { rig.emote(e); step(rig, 0.1); }
  step(rig, 2);
  assert.equal(rig._state().emote, null);
  for (const s of ['summer', 'autumn', 'winter', 'spring']) { rig.setSeason(s); step(rig, 0.1); assert.equal(rig.getSeason(), s); }
  rig.dispose();
});

test('default hand items persist (pip net) and auto props are restored after the animation', async () => {
  const pip = Chars.createCharacter('pip');
  assert.equal(pip._state().held, 'net');
  const mira = Chars.createCharacter('mira');
  assert.equal(mira._state().held, null);
  const p = mira.play('drink');
  assert.equal(mira._state().held, 'mug');
  step(mira, DEFS.drink.dur + 0.1);
  await p;
  assert.equal(mira._state().held, null);
});

test('locomote blends toward walk/run and keeps pose finite', () => {
  const rig = Chars.createCharacter('juno');
  for (const sp of [0, 2.6, 5, 0]) {
    rig.locomote(sp);
    step(rig, 1.5);
    for (const v of rig._state().pose) assert.ok(Number.isFinite(v));
  }
});

test('visible=false still advances action promises', async () => {
  const rig = Chars.createCharacter('gus');
  rig.setVisible(false);
  const p = rig.play('bow');
  step(rig, 3);
  await p;
});

test('critters: every kind builds, wanders inside bounds and respects isBlockedAt', () => {
  for (const kind of CRITTERS) {
    const c = Chars.createCritter(kind, { seed: 3 });
    c.setBounds({ x: 2, z: 3, w: 4, h: 3 });
    const ctx = { isBlockedAt: () => false, player: { x: 99, z: 99 } };
    for (let i = 0; i < 600; i++) c.update(1 / 30, ctx);
    const p = c.group.position;
    assert.ok(p.x >= 1.9 && p.x <= 6.1 && p.z >= 2.9 && p.z <= 6.1, `${kind} at ${p.x},${p.z}`);
    c.dispose();
  }
  const blocked = Chars.createCritter('cat', { seed: 1 });
  blocked.setBounds({ x: 0, z: 0, w: 6, h: 6 });
  for (let i = 0; i < 300; i++) blocked.update(1 / 30, { isBlockedAt: () => true, player: { x: 99, z: 99 } });
  assert.ok(Number.isFinite(blocked.group.position.x));
});

test('preload resolves in Node', async () => { await Chars.preload(); });
