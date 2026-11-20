import test from 'node:test';
import assert from 'node:assert/strict';
import { noteToMidi, midiToFreq, parseNotes, parseDrums, chord, scaleNote, genMelody, bassFrom, arpFrom, midiName } from '../../src/audio/theory.js';
import { SONGS, ALIASES, resolveSong, missingTracks } from '../../src/audio/songs.js';
import { SFX, AMBIENCE, missingSfx, missingAmbience } from '../../src/audio/sfx.js';
import { compileSong } from '../../src/audio/engine.js';
import { MUSIC_IDS, SFX_IDS, AMBIENCE_IDS } from '../../src/data/ids.js';

test('note names, frequencies and the note DSL', () => {
  assert.equal(noteToMidi('C4'), 60); assert.equal(noteToMidi('A4'), 69); assert.equal(noteToMidi('Bb3'), 58); assert.equal(noteToMidi('F#5'), 78);
  assert.ok(Math.abs(midiToFreq(69) - 440) < 1e-9); assert.ok(Math.abs(midiToFreq(81) - 880) < 1e-9);
  assert.throws(() => noteToMidi('H4'));
  const p = parseNotes('C4:1 E4 [G4,B4]:2 r:0.5 D5:0.5');
  assert.equal(p.beats, 5);
  assert.deepEqual(p.events.map((e) => [e.t, e.d, e.midi.length]), [[0, 1, 1], [1, 1, 1], [2, 2, 2], [4, 0.5, 0], [4.5, 0.5, 1]]);
  assert.deepEqual(parseNotes('C4:1', 12).events[0].midi, [72]);
  assert.equal(parseNotes('C4:1 | D4:1').beats, 2);
  assert.throws(() => parseNotes('C4:0'));
  assert.deepEqual(parseDrums('k.h. s').events.map((e) => [e.t, e.perc]), [[0, 'k'], [1, 'h'], [2, 's']]);
});

test('theory helpers: chords, scales, generators are deterministic and in range', () => {
  assert.deepEqual(chord('C', 'maj', 3), [48, 52, 55]);
  assert.equal(scaleNote('C', 'major', 7, 4), 72); assert.equal(scaleNote('A', 'minor', -1, 4), 67);
  const chords = [{ midi: chord('C', 'maj', 3), beats: 4 }, { midi: chord('G', 'maj', 3), beats: 4 }];
  const a = genMelody({ tonic: 'C', chords, seed: 5 }), b = genMelody({ tonic: 'C', chords, seed: 5 }), c = genMelody({ tonic: 'C', chords, seed: 6 });
  assert.equal(a, b); assert.notEqual(a, c);
  const mel = parseNotes(a);
  assert.equal(mel.beats, 8);
  for (const e of mel.events) for (const m of e.midi) assert.ok(m >= 60 && m <= 84);
  assert.equal(parseNotes(bassFrom(chords, 'rfof', 1)).beats, 8);
  assert.equal(parseNotes(arpFrom(chords, [0, 1, 2, 1], 0.5)).beats, 8);
  assert.equal(midiName(61), 'C#4');
});

test('every music id resolves; every song is musically well-formed', () => {
  assert.deepEqual(missingTracks(), []);
  for (const a of Object.values(ALIASES)) assert.ok(SONGS[a.base], `alias base ${a.base}`);
  for (const id of MUSIC_IDS) assert.ok(resolveSong(id), id);
  for (const [id, song] of Object.entries(SONGS)) {
    assert.ok(song.bpm >= 56 && song.bpm <= 140, `${id} bpm`);
    const c = compileSong({ song, transpose: 0, tempo: 1 });
    assert.ok(c.loopBeats % 4 === 0 && c.loopBeats >= 32, `${id} loop ${c.loopBeats}`);
    assert.ok(c.loopBeats / 60 * song.bpm >= 18, `${id} should loop for at least ~18 s`);
    let melodic = 0;
    for (const p of c.parts) {
      const reps = c.loopBeats / p.beats;
      assert.ok(Number.isInteger(reps), `${id}/${p.voice}: part length ${p.beats} must divide ${c.loopBeats}`);
      for (const e of p.events) {
        assert.ok(e.d > 0 && Number.isFinite(e.t));
        for (const m of e.midi || []) assert.ok(m >= 28 && m <= 100, `${id}/${p.voice} note ${m}`);
      }
      if (p.voice !== 'drums') melodic++;
    }
    assert.ok(melodic >= 2, `${id} needs at least two melodic parts`);
    assert.ok(c.parts.some((p) => ['tri', 'sine'].includes(p.voice)), `${id} has a bass`);
  }
});

test('every sfx and ambience id has a valid recipe', () => {
  assert.deepEqual(missingSfx(), []); assert.deepEqual(missingAmbience(), []);
  for (const id of SFX_IDS) {
    assert.ok(SFX[id].length > 0, id);
    for (const e of SFX[id]) {
      assert.ok(['tone', 'noise', 'bell'].includes(e.k));
      assert.ok(e.at >= 0 && Number.isFinite(e.at) && e.gain > 0 && e.gain <= 0.35, `${id} gain/at`);
      if (e.k !== 'bell') assert.ok(e.dur > 0 && e.dur < 3, `${id} dur`);
      if (e.k === 'tone') assert.ok(e.f0 > 20 && e.f1 > 20 && e.f0 < 12000);
    }
  }
  for (const id of AMBIENCE_IDS) assert.ok(AMBIENCE[id].type, id);
});
