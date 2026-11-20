import test from 'node:test';
import assert from 'node:assert/strict';
import { Camera, clampAxis } from '../../src/engine/camera.js';
import { computeLayout } from '../../src/engine/renderer.js';

test('clampAxis clamps big maps and centres small ones', () => {
  assert.equal(clampAxis(-50, 640, 320), 0);
  assert.equal(clampAxis(500, 640, 320), 320);
  assert.equal(clampAxis(100, 640, 320), 100);
  assert.equal(clampAxis(0, 200, 320), -60); // 200px map centred in 320px view
  assert.equal(clampAxis(0, 321, 320), 0);
});

test('follow clamps to map and rounds to integer pixels', () => {
  const cam = new Camera();
  cam.setBounds(640, 480);
  const t = { x: 10, y: 10 };
  cam.follow(t);
  cam.update(1 / 60);
  assert.equal(cam.px, 0);
  assert.equal(cam.py, 0);
  t.x = 333.4;
  t.y = 250.6;
  cam.update(1 / 60);
  assert.ok(Number.isInteger(cam.px) && Number.isInteger(cam.py));
  assert.equal(cam.px, Math.round(333.4 - 160));
  t.x = 9999;
  t.y = 9999;
  cam.update(1 / 60);
  assert.equal(cam.px, 320);
  assert.equal(cam.py, 240);
});

test('small maps are centred', () => {
  const cam = new Camera();
  cam.setBounds(200, 160);
  cam.follow({ x: 50, y: 50 });
  cam.update(1 / 60);
  assert.equal(cam.px, -60);
  assert.equal(cam.py, -40);
});

test('smoothing approaches the target without overshoot', () => {
  const cam = new Camera();
  cam.setBounds(2000, 2000);
  const t = { x: 500, y: 500 };
  cam.follow(t, { offsetX: 0, offsetY: 0 });
  cam.smooth = 8;
  t.x = 700;
  let prev = cam.x;
  for (let i = 0; i < 120; i++) {
    cam.update(1 / 60);
    assert.ok(cam.x >= prev && cam.x <= 700 + 1e-9);
    prev = cam.x;
  }
  assert.ok(700 - cam.x < 1);
});

test('panTo resolves, eases to the point, and focus snaps', async () => {
  const cam = new Camera();
  cam.setBounds(1000, 1000);
  cam.snapTo(300, 300);
  let done = false;
  const p = cam.panTo(600, 500, 500).then(() => { done = true; });
  for (let i = 0; i < 15; i++) cam.update(1 / 60);
  assert.ok(!done && cam.x > 300 && cam.x < 600);
  for (let i = 0; i < 30; i++) cam.update(1 / 60);
  await p;
  assert.ok(done);
  assert.equal(cam.x, 600);
  assert.equal(cam.y, 500);
  cam.focus({ x: 100, y: 100 });
  assert.equal(cam.px, 0);
});

test('shake is integer jitter that decays to zero', () => {
  let n = 0;
  const cam = new Camera({ rng: () => ((n++ * 0.37) % 1) });
  cam.setBounds(1000, 1000);
  cam.snapTo(500, 500);
  const base = cam.px;
  cam.shake(4, 200);
  let moved = false;
  for (let i = 0; i < 6; i++) {
    cam.update(1 / 60);
    assert.ok(Number.isInteger(cam.px));
    if (cam.px !== base) moved = true;
    assert.ok(Math.abs(cam.px - base) <= 4);
  }
  assert.ok(moved);
  for (let i = 0; i < 30; i++) cam.update(1 / 60);
  assert.equal(cam.px, base);
});

test('layout: integer scale from the CONTAINER box, fractional only when < 1 fits', () => {
  assert.deepEqual(computeLayout(960, 720, 1), { scale: 3, cssW: 960, cssH: 720, integer: true });
  const a = computeLayout(900, 700, 1); // 900/320=2.81, 700/240=2.91 -> 2
  assert.equal(a.scale, 2);
  assert.equal(a.cssW, 640);
  const b = computeLayout(300, 200, 1); // does not fit 1x: fit-to-box
  assert.equal(b.integer, false);
  assert.ok(Math.abs(b.cssW / b.cssH - 4 / 3) < 1e-9 && b.cssW <= 300 && b.cssH <= 200);
  const c = computeLayout(960, 720, 2); // dpr 2: device-pixel integer 6 -> css 3
  assert.equal(c.scale, 3);
  const d = computeLayout(1000, 800, 1.5); // fit 3.125 -> device 4.69 -> 4 dev px per px = 2.667 css
  assert.ok(Math.abs(d.scale - 4 / 1.5) < 1e-9);
});
