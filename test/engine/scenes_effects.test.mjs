import test from 'node:test';
import assert from 'node:assert/strict';
import { Scene, SceneManager } from '../../src/engine/scenes.js';
import { Fader, Flasher, GradingState } from '../../src/engine/transitions.js';
import { GRADING_PRESETS, gradingAt, resolveGrading, lerpGrading, overcastGrading } from '../../src/engine/grading.js';
import { Actor } from '../../src/engine/actor.js';
import { CHAR_SHEET, ANIMAL_SHEET } from '../../src/data/sheet_layout.js';

class Rec extends Scene {
  constructor(game, name, log, transparent = false) {
    super(game);
    this.name = name;
    this.log = log;
    this._t = transparent;
  }
  get transparent() { return this._t; }
  enter(p) { this.log.push(`${this.name}:enter:${JSON.stringify(p)}`); }
  exit() { this.log.push(`${this.name}:exit`); }
  pause() { this.log.push(`${this.name}:pause`); }
  resume(r) { this.log.push(`${this.name}:resume:${JSON.stringify(r)}`); }
  update(dt) { this.log.push(`${this.name}:update`); }
  draw() { this.log.push(`${this.name}:draw`); }
}

test('SceneManager lifecycle, update only top, draw through transparent scenes', () => {
  const log = [];
  const game = { input: {}, ui: {} };
  const sm = new SceneManager(game);
  const a = new Rec(game, 'a', log);
  const b = new Rec(game, 'b', log, true);
  sm.push(a, { x: 1 });
  sm.push(b);
  assert.equal(sm.top, b);
  log.length = 0;
  sm.update(0.016);
  assert.deepEqual(log, ['b:update']);
  log.length = 0;
  sm.draw();
  assert.deepEqual(log, ['a:draw', 'b:draw']);
  log.length = 0;
  sm.pop('r');
  assert.deepEqual(log, ['b:exit', 'a:resume:"r"']);
  const c = new Rec(game, 'c', log);
  sm.push(c);
  log.length = 0;
  sm.draw();
  assert.deepEqual(log, ['c:draw']); // opaque top: nothing below drawn
});

test('push() resolves with the pop() result; replace/reset resolve undefined', async () => {
  const game = { input: {}, ui: {} };
  const sm = new SceneManager(game);
  const log = [];
  const base = new Rec(game, 'base', log);
  sm.push(base);
  const shop = new Rec(game, 'shop', log);
  const p = sm.push(shop, { id: 'cafe' });
  assert.ok(p instanceof Promise);
  let got = 'pending';
  p.then((v) => { got = v; });
  await Promise.resolve();
  assert.equal(got, 'pending');
  sm.pop({ bought: 3 });
  assert.deepEqual(await p, { bought: 3 });

  const q = sm.push(new Rec(game, 'q', log));
  sm.pop();
  assert.equal(await q, undefined);

  const r = sm.push(new Rec(game, 'r', log));
  const r2 = sm.replace(new Rec(game, 'r2', log));
  assert.equal(await r, undefined);
  sm.pop('done');
  assert.equal(await r2, 'done');

  const s1 = sm.push(new Rec(game, 's1', log));
  const s2 = sm.push(new Rec(game, 's2', log));
  await sm.reset();
  assert.equal(await s1, undefined);
  assert.equal(await s2, undefined);
  assert.equal(sm.depth, 0);
  assert.equal(sm.pop(), null);
});

test('Fader tweens and resolves; Flasher decays; GradingState tweens', async () => {
  const f = new Fader();
  let done = false;
  const p = f.out(500).then(() => { done = true; });
  for (let i = 0; i < 15; i++) f.update(1 / 60);
  assert.ok(f.amount > 0 && f.amount < 1 && !done);
  for (let i = 0; i < 20; i++) f.update(1 / 60);
  await p;
  assert.equal(f.amount, 1);
  const q = f.in(0);
  await q;
  assert.equal(f.amount, 0);
  const interrupted = f.out(1000);
  f.set(0);
  await interrupted; // cancelled tweens still resolve

  const fl = new Flasher();
  fl.trigger('#fff', 1, 200);
  assert.equal(fl.amount, 1);
  for (let i = 0; i < 20; i++) fl.update(1 / 60);
  assert.equal(fl.amount, 0);

  const g = new GradingState('day');
  const t = g.tween('night', 1000);
  for (let i = 0; i < 30; i++) g.update(1 / 60);
  assert.ok(g.current.tint[0] < 1 && g.current.tint[0] > GRADING_PRESETS.night.tint[0]);
  for (let i = 0; i < 40; i++) g.update(1 / 60);
  await t;
  assert.deepEqual(g.current.tint, GRADING_PRESETS.night.tint);
  g.tween({ vignette: 0.9 }, 0);
  assert.equal(g.current.vignette, 0.9);
  assert.deepEqual(g.current.tint, GRADING_PRESETS.night.tint);
});

test('grading presets, day curve, overcast', () => {
  for (const k of ['day', 'sunset', 'night', 'lantern', 'indoor']) assert.ok(GRADING_PRESETS[k], k);
  assert.throws(() => resolveGrading('nope'));
  const noon = gradingAt(12 * 60);
  assert.deepEqual(noon.tint, GRADING_PRESETS.day.tint);
  const late = gradingAt(26 * 60); // 02:00 wraps
  assert.ok(late.tint[0] < 0.5);
  const dusk = gradingAt(17 * 60 + 15);
  assert.ok(dusk.tint[2] < 1 && dusk.tint[2] > GRADING_PRESETS.sunset.tint[2]);
  const mid = lerpGrading(GRADING_PRESETS.day, GRADING_PRESETS.night, 0.5);
  assert.ok(Math.abs(mid.tint[0] - (1 + GRADING_PRESETS.night.tint[0]) / 2) < 1e-9);
  const oc = overcastGrading('day', 1);
  assert.ok(oc.saturation < 1 && oc.tint[0] < 1);
});

test('Actor frame selection follows CHAR_SHEET / ANIMAL_SHEET', () => {
  const a = new Actor({ sheet: { canvas: {}, ...CHAR_SHEET }, tx: 3, ty: 4 });
  assert.equal(a.x, 56);
  assert.equal(a.y, 78);
  assert.equal(a.tx, 3);
  assert.equal(a.ty, 4);
  a.update(0.016);
  assert.deepEqual([a.row, a.col], [0, 0]);
  a.setDir('right');
  a.setMoving(true);
  const cols = [];
  for (let i = 0; i < 40; i++) {
    a.setMoving(true);
    a.update(1 / 60);
    if (!cols.length || cols[cols.length - 1] !== a.col) cols.push(a.col);
  }
  assert.equal(a.row, 2);
  assert.deepEqual(cols.slice(0, 5), [1, 0, 2, 0, 1]);
  a.update(1 / 60); // no setMoving -> stands
  assert.equal(a.col, 0);
  a.setPose('cheer').update(0.1);
  assert.deepEqual([a.row, a.col], [4, 3]);
  a.setPose('sit').setDir('left').update(0.1);
  assert.deepEqual([a.row, a.col], [5, 1]);
  a.faceToward(a.x, a.y - 30);
  assert.equal(a.dir, 'up');
  a.emote('heart', 1);
  assert.equal(a.emoteKind, 'heart');
  for (let i = 0; i < 70; i++) a.update(1 / 60);
  assert.equal(a.emoteKind, null);

  const cat = new Actor({ kind: 'animal', sheet: { canvas: {}, ...ANIMAL_SHEET } });
  cat.setPose('sit').setDir('right').update(0.1);
  assert.deepEqual([cat.row, cat.col], [4, 2]);
  cat.setPose('sleep').update(0.1);
  assert.equal(cat.col, 3);
});
