// Unit tests for src/audio (pure logic; Web Audio itself is exercised by tools/labs/audio-lab.html?autotest=1).
import test from 'node:test';
import assert from 'node:assert/strict';
import * as audio from '../../src/audio/index.js';
import { TRACKS, TRACK_IDS } from '../../src/audio/tracks/index.js';
import { compile, trackInfo, barEvents } from '../../src/audio/sequencer.js';
import { INSTRUMENTS, DRUM_MAP } from '../../src/audio/synth.js';
import { SFX, SFX_IDS } from '../../src/audio/sfx.js';
import { VOICE_IDS } from '../../src/audio/voices.js';
import { AMBIENCE_IDS, ambienceMix } from '../../src/audio/ambience.js';
import { parseChord, degToMidi } from '../../src/audio/theory.js';

// copied from docs/game/ARCHITECTURE.md section 4 (the audio module may not import core)
const MUSIC_TRACKS = ['title', 'prologue', 'home', 'town_spring', 'town_summer', 'town_autumn', 'town_winter', 'night', 'town_rain', 'shop', 'cafe', 'harbor', 'woods', 'hilltop', 'festival', 'festival_winter', 'romance', 'sad', 'comedy', 'minigame', 'ending'];
const REG_SFX = ['ui_move', 'ui_confirm', 'ui_cancel', 'ui_open', 'ui_close', 'ui_error', 'ui_tab', 'coin', 'buy', 'sell', 'item_get', 'item_get_rare', 'heart_up', 'quest_new', 'quest_done', 'door_open', 'door_close', 'step_grass', 'step_dirt', 'step_stone', 'step_wood', 'step_sand', 'step_snow', 'splash', 'cast', 'bite', 'reel', 'catch', 'fish_escape', 'shop_bell', 'pop', 'sparkle', 'whoosh', 'sleep_jingle', 'wake_jingle', 'firework_launch', 'firework_boom', 'lamp_light', 'page_turn', 'knead', 'oven_ding', 'bark', 'meow', 'gull', 'chirp', 'clock_chime', 'thunder', 'confirm_big'];
const REG_VOICES = ['soft', 'bright', 'deep', 'gruff', 'kid', 'elder', 'brisk', 'dreamy', 'narrator'];
const REG_AMBIENCE = ['birds', 'crickets', 'waves', 'rain', 'wind', 'stream', 'fire', 'crowd'];

test('public API is present and Node-safe', () => {
  for (const f of ['init', 'unlock', 'playMusic', 'stopMusic', 'duckMusic', 'playSfx', 'blip', 'footstep', 'setAmbience', 'setVolume', 'setMuted', 'stats', 'renderOffline']) assert.equal(typeof audio[f], 'function', f);
  assert.ok(Array.isArray(audio.tracks) && Array.isArray(audio.sfxList));
  audio.init(); audio.unlock();
  assert.equal(audio.playMusic('title'), false); // no AudioContext in Node
  assert.equal(audio.playSfx('coin'), false);
  assert.equal(audio.footstep('grass'), false);
  audio.setVolume({ master: 0.5 }); audio.setMuted(true); audio.setMuted(false); audio.stopMusic({ fadeMs: 10 }); audio.duckMusic(true);
  audio.setAmbience({ area: 'harbor', weather: 'sunny', season: 'summer', night: false });
  const s = audio.stats();
  assert.ok('state' in s && 'playing' in s);
});
test('renderOffline resolves null without OfflineAudioContext', async () => { assert.equal(await audio.renderOffline('title'), null); });

test('registry ids are all covered', () => {
  assert.deepEqual([...audio.tracks].sort(), [...MUSIC_TRACKS].sort());
  assert.deepEqual(TRACK_IDS, MUSIC_TRACKS);
  assert.deepEqual([...audio.sfxList].sort(), [...REG_SFX].sort());
  assert.deepEqual([...SFX_IDS].sort(), [...REG_SFX].sort());
  for (const id of SFX_IDS) assert.equal(typeof SFX[id], 'function', id);
  assert.deepEqual(VOICE_IDS, REG_VOICES);
  assert.deepEqual(AMBIENCE_IDS, REG_AMBIENCE);
});

test('theory helpers', () => {
  assert.deepEqual([...parseChord('Am7').pcs].sort((a, b) => a - b), [0, 4, 7, 9]);
  assert.equal(parseChord('G/B').bass, 11);
  assert.throws(() => parseChord('H'));
  const c = compile(TRACKS.title);
  assert.equal(degToMidi(c, 1, 0, 0), 60);
  assert.equal(degToMidi(c, 5, 1, 0), 79);
});

for (const id of MUSIC_TRACKS) {
  test(`track ${id}: structure, scale and chord membership`, () => {
    const tr = TRACKS[id];
    assert.ok(tr, 'exists');
    const c = compile(tr);
    const scalePcs = new Set(c.scale.map((s) => (c.tonic + s) % 12));
    const info = trackInfo(tr);
    assert.ok(info.loopSec >= 28 && info.loopSec <= 75, `loop ${info.loopSec.toFixed(1)}s should be 28-75s`);
    assert.ok(tr.tempo >= 55 && tr.tempo <= 150);
    for (const p of tr.parts) {
      assert.ok(['mel', 'chords', 'bass', 'drums'].includes(p.role), 'role ' + p.role);
      if (p.role !== 'drums') assert.ok(INSTRUMENTS[p.inst], 'instrument ' + p.inst);
      const grid = p.grid || (p.role === 'bass' ? 1 : 0.5), steps = Math.round(c.bar / grid);
      if (p.role === 'drums') for (const [lane, pat] of Object.entries(p.pat)) { assert.ok(DRUM_MAP[lane], 'lane ' + lane); assert.ok(/^[xXo.]+$/.test(pat), pat); assert.equal(steps % pat.length, 0, `drum pattern ${pat} must divide ${steps} steps`); }
      if (p.role === 'bass') { assert.ok(/^[R5835wx.]+$/.test(p.pat), p.pat); assert.equal(steps % p.pat.length, 0, 'bass pattern length ' + p.pat); }
      if (p.role === 'chords' && p.pat) { assert.ok(/^[xX0-9.]+$/.test(p.pat), p.pat); assert.equal(steps % p.pat.length, 0, 'chord pattern length ' + p.pat); }
      for (const s of [...(p.sec || []), ...(p.skip || [])]) assert.ok(tr.sections[s], 'part refers to section ' + s);
    }
    let strong = 0, strongOk = 0, down = 0, downOk = 0, total = 0;
    for (const sec of Object.values(c.secs)) {
      for (const [key, bars] of Object.entries(sec.mel)) {
        assert.equal(bars.length, sec.bars, `${sec.id}.${key} bar count`);
        bars.forEach((notes, bi) => {
          assert.ok(Math.abs(notes.total - c.bar) < 1e-9, `${sec.id}.${key} bar ${bi + 1} lasts ${notes.total} beats, expected ${c.bar}`);
          const chords = sec.chordBars[bi];
          for (const n of notes) {
            if (n.rest) continue;
            total++;
            const midi = degToMidi(c, n.deg, n.oct, n.acc);
            const pc = ((midi % 12) + 12) % 12;
            const chord = chords[Math.min(chords.length - 1, Math.floor(n.t / (c.bar / chords.length)))];
            assert.ok(scalePcs.has(pc) || chord.pcs.has(pc), `${id} ${sec.id}.${key} bar ${bi + 1}: pitch class ${pc} is outside the scale and chord ${chord.sym}`);
            assert.ok(midi >= 40 && midi <= 100, 'melody range');
            if (Number.isInteger(n.t)) { strong++; if (chord.pcs.has(pc)) strongOk++; }
            if (n.t === 0) { down++; if (chord.pcs.has(pc)) downOk++; }
          }
        });
      }
    }
    assert.ok(total > 40, 'enough melody notes');
    assert.ok(downOk / down >= 0.7, `${id}: only ${downOk}/${down} downbeat melody notes are chord tones`);
    assert.ok(strongOk / strong >= 0.55, `${id}: only ${strongOk}/${strong} on-beat melody notes are chord tones`);
  });
  test(`track ${id}: events are finite and the loop wraps`, () => {
    const tr = TRACKS[id], c = compile(tr);
    const n = c.plan.length + c.loopBars + 2;
    let count = 0;
    for (let b = 0; b < n; b++) for (const e of barEvents(tr, b)) {
      count++;
      assert.ok(Number.isFinite(e.f) && e.f > 20 && e.f < 8000, `${id} freq ${e.f}`);
      assert.ok(e.t >= 0 && e.t < c.bar && e.dur > 0 && e.vel > 0 && e.vel < 1.4);
      assert.ok(INSTRUMENTS[e.inst], 'inst ' + e.inst);
    }
    assert.ok(count > 100);
    const sig = (b) => JSON.stringify(barEvents(tr, b).map((e) => [e.inst, e.t, e.drum ? 0 : Math.round(e.f)]));
    assert.equal(sig(c.loopStart), sig(c.loopStart + c.loopBars));
  });
}

test('ambience mix rules', () => {
  assert.ok(ambienceMix({ area: 'harbor', weather: 'sunny', season: 'summer', night: false }).waves > 0.5);
  assert.ok(ambienceMix({ area: 'brook_lane', weather: 'sunny', season: 'spring', night: false }).birds > 0.5);
  assert.ok(ambienceMix({ area: 'town_square', weather: 'sunny', season: 'summer', night: true }).crickets > 0.3);
  assert.ok(!ambienceMix({ area: 'town_square', weather: 'sunny', season: 'winter', night: true }).crickets);
  const rain = ambienceMix({ area: 'brook_lane', weather: 'rain', season: 'spring', night: false });
  assert.ok(rain.rain > 0.5 && !rain.birds);
  const inn = ambienceMix({ area: 'inn', weather: 'sunny', season: 'spring', night: false });
  assert.ok(inn.fire > 0 && inn.crowd > 0 && !inn.birds);
  for (const v of Object.values(ambienceMix({ area: 'starview_hill', weather: 'storm', season: 'winter', night: true }))) assert.ok(v >= 0 && v <= 1);
});
