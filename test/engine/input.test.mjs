import test from 'node:test';
import assert from 'node:assert/strict';
import { Input, readPad, ACTIONS } from '../../src/engine/input.js';

const mk = () => {
  const clock = { t: 0 };
  const input = new Input({ now: () => clock.t, getPads: () => [] });
  return { input, clock };
};

test('keyboard bindings and press/down/release edges', () => {
  const { input } = mk();
  input.keyDown('ArrowLeft');
  input.update();
  assert.ok(input.pressed('left') && input.down('left'));
  input.update();
  assert.ok(!input.pressed('left') && input.down('left'));
  input.keyUp('ArrowLeft');
  input.update();
  assert.ok(input.released('left') && !input.down('left'));
  for (const [code, a] of [['KeyW', 'up'], ['KeyS', 'down'], ['KeyD', 'right'], ['KeyZ', 'confirm'], ['Enter', 'confirm'], ['Space', 'confirm'],
    ['KeyX', 'cancel'], ['Backspace', 'cancel'], ['Escape', 'cancel'], ['Escape', 'menu'], ['Tab', 'menu'], ['KeyM', 'menu'], ['ShiftLeft', 'run']]) {
    input.keyDown(code);
    input.update();
    assert.ok(input.down(a), `${code} -> ${a}`);
    input.keyUp(code);
    input.update();
  }
  assert.equal(input.keyDown('KeyQ'), false);
});

test('a tap shorter than one frame is not lost', () => {
  const { input } = mk();
  input.keyDown('KeyZ');
  input.keyUp('KeyZ');
  input.update();
  assert.ok(input.pressed('confirm') && input.released('confirm') && !input.down('confirm'));
  input.update();
  assert.ok(!input.pressed('confirm'));
});

test('axis combines opposing keys and diagonals', () => {
  const { input } = mk();
  input.keyDown('ArrowRight');
  input.keyDown('ArrowUp');
  input.update();
  assert.deepEqual(input.axis(), { x: 1, y: -1 });
  input.keyDown('ArrowLeft');
  input.update();
  assert.deepEqual(input.axis(), { x: 0, y: -1 });
});

test('inject / tap / clear', () => {
  const { input } = mk();
  input.inject('confirm', true);
  input.update();
  assert.ok(input.pressed('confirm'));
  input.inject('confirm', false);
  input.update();
  assert.ok(input.released('confirm'));
  input.tap('cancel');
  input.update();
  assert.ok(input.pressed('cancel') && input.down('cancel'));
  input.update();
  assert.ok(!input.down('cancel'));
  input.keyDown('ArrowUp');
  input.inject('run', true);
  input.clear();
  input.update();
  assert.ok(!input.down('up') && !input.down('run'));
  assert.throws(() => input.inject('nope', true));
});

test('repeat: first press, then after 350 ms every 120 ms', () => {
  const { input, clock } = mk();
  const hits = [];
  input.keyDown('ArrowDown');
  for (let t = 0; t <= 1000; t += 16) {
    clock.t = t;
    input.update();
    if (input.repeat('down')) hits.push(t);
  }
  assert.equal(hits[0], 0);
  assert.ok(hits[1] >= 350 && hits[1] < 366, `second at ${hits[1]}`);
  const gaps = hits.slice(2).map((t, i) => t - hits[i + 1]);
  assert.ok(gaps.every((g) => g >= 112 && g <= 136), gaps.join(','));
  input.keyUp('ArrowDown');
  clock.t += 16;
  input.update();
  assert.ok(!input.repeat('down'));
  input.keyDown('ArrowDown');
  clock.t += 16;
  input.update();
  assert.ok(input.repeat('down')); // a fresh press repeats immediately again
});

test('gamepad mapping: buttons, d-pad, stick deadzone', () => {
  const buttons = Array.from({ length: 17 }, () => ({ pressed: false, value: 0 }));
  const pad = { connected: true, buttons, axes: [0, 0] };
  const out = {};
  readPad(pad, out);
  for (const a of ACTIONS) assert.equal(out[a], false);
  buttons[0].pressed = true; buttons[1].pressed = true; buttons[9].pressed = true; buttons[14].pressed = true; buttons[2].pressed = true;
  readPad(pad, out);
  assert.ok(out.confirm && out.cancel && out.menu && out.left && out.run);
  pad.axes = [0.1, -0.1];
  readPad(pad, out);
  assert.equal(out.ax, 0);
  pad.axes = [1, 0];
  readPad(pad, out);
  assert.ok(out.right && out.ax > 0.99);

  const { clock } = mk();
  const input = new Input({ now: () => clock.t, getPads: () => [pad] });
  buttons[0].pressed = false; buttons[1].pressed = false; buttons[9].pressed = false; buttons[14].pressed = false; buttons[2].pressed = false;
  pad.axes = [0.6, 0];
  input.update();
  assert.ok(input.down('right'));
  assert.ok(input.axis().x > 0.3 && input.axis().x <= 1);
  assert.equal(input.lastDevice, 'pad');
  pad.axes = [0, 0];
  input.update();
  assert.ok(!input.down('right'));
});
