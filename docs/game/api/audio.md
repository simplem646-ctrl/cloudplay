# Audio API (`src/audio/**`, task T6, built by the lead)

All sound is synthesised in code with WebAudio (no files, no network). `import { audio } from '../audio/index.js'`. Importing is safe in Node (no-op) and
without WebAudio. Autoplay policy: call `audio.init()` from a user gesture ("Press Start"); music/ambience requested earlier start automatically on init.

```js
audio.init();                                  // creates/resumes the AudioContext (idempotent), returns audio
audio.sfx('confirm');                          // one-shot; ids = SFX_IDS (39), unknown ids warn once and are silent
audio.music('town_spring', { fadeMs: 800 });   // crossfade; same id = no-op; null (or audio.stopMusic()) fades out; ids = MUSIC_IDS (26)
audio.ambience('rain');                        // looping bed; ids = AMBIENCE_IDS (rain wind crowd waves crickets birds snow_wind); null stops
audio.setVolume({ master: .8, music: .6, sfx: .9, ambience: .6 });   // 0..1, applied live
audio.mute(true);  audio.current();  audio.isReady();
```
Persist volumes yourself (settings screen) and re-apply them at boot: `audio.setVolume(settings)`. The tab-hidden state suspends the context automatically.

## Music
12 hand-composed songs in `src/audio/songs.js` (`title, town_spring, town_night, school_day, school_class, cafe, festival, romantic, sad, exam, ending_good, credits`),
16-bar loops (about 35-60 s) with melody, arpeggio/counter line, bass, pad and drums from a compact note DSL (`src/audio/theory.js`). The other 14 ids are
**aliases** of those (transposed/retimed): `town_summer, town_autumn, town_winter, home_morning, library, sports, rooftop, observatory, beach, rain, fireworks, funny, tense,
ending_bittersweet`. Overworld mapping suggestions: map `ambient.music: 'town'` -> `town_<season>` by day, `town_night` after 19:00; `'school'` -> `school_day`, `school_class` during lessons.
Voices: pulse 12/25/50 %, triangle, sine, pluck, FM bell, detuned-saw pad, noise/sine drums, reverb sends, master compressor.

## Add / change sound
- New SFX: add an entry to `SFX` in `src/audio/sfx.js` (events `tone/noise/bell`) and its id to `SFX_IDS` in `src/data/ids.js` (lead-owned). New ambience: `AMBIENCE`.
- New track: add `{ bpm, parts:[{v, g, n|d, rev}] }` to `SONGS` (all parts must divide the loop length; run `npm test`), or an alias in `ALIASES`.
- Note DSL: `C4:1 E4 [G4,B4]:2 r:0.5` (default = previous duration); drum DSL: one char per half-beat `k s h o c .`.

## Verification
`npm test` (test/audio: DSL/theory, every id resolves, loop/bass/range rules, every SFX recipe valid). Browser self-test (objective levels, NaN, clipping, silence for every track and sfx via
`OfflineAudioContext`): `node scripts/build.mjs --entry src/dev/audio_player.js --out dist/dev/audio_player.html`, then run `window.__audioSelfTest({seconds: 6})`
(see the header of `src/dev/audio_player.js`; the page also has play buttons for manual listening). Last result: 26/26 tracks and 39/39 sfx clean (peaks 0.32-0.44).
NOT verified by ear: musical taste, mix balance on real speakers.
