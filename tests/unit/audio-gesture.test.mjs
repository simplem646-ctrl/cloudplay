// Audio stays silent (no AudioContext, so no browser console warnings) until the first user gesture.
import test from 'node:test';
import assert from 'node:assert/strict';

let created = 0;
class FakeAudioContext { constructor() { created++; throw new Error('fake context: construction counted, graph not needed'); } }
globalThis.AudioContext = FakeAudioContext;
const listeners = {};
globalThis.document = { addEventListener: (e, f) => { (listeners[e] ||= []).push(f); }, removeEventListener: (e, f) => { listeners[e] = (listeners[e] || []).filter((x) => x !== f); } };
const audio = await import('../../src/audio/index.js');

test('no AudioContext is created before a user gesture', () => {
  assert.equal(audio.init(), 'locked');
  assert.equal(audio.playMusic('title'), false);
  audio.setAmbience({ area: 'brook_lane', time: 600 });
  assert.equal(audio.playSfx('ui_confirm'), false);
  assert.equal(created, 0);
  assert.equal(audio.stats().state, 'locked');
});

test('the first key/pointer creates the context', () => {
  assert.ok(listeners.keydown && listeners.keydown.length === 1, 'gesture listener armed');
  listeners.keydown[0]();
  assert.equal(created, 1);
  assert.equal(listeners.keydown.length, 0, 'gesture listener removed after use');
});
