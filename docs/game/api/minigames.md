# Mini-games API (`src/scenes/activities/**`, built by the lead as part of T8b tier 1)

Three full-screen mini-games, registered through the scene registry. T9a's boot must call `registerActivityScenes()` (from `src/scenes/activities/index.js`).

| scene name | game | controls | result |
|---|---|---|---|
| `minigame:track_sprint` | 100 m dash: 4 lanes, 3 AI runners, false-start penalty | alternate LEFT/RIGHT (or Z/X) | `{score, rank, place, time}` |
| `minigame:music_rhythm` | 4-lane falling-note rhythm game, seeded chart (~24 s) | arrow keys | `{score, rank, perfect, good, miss, maxCombo}` |
| `minigame:cafe_serve` | serve customers (coffee/tea/cake/sandwich) before patience runs out (45 s) | arrows = items | `{score, rank, served, spawned, tips}` |

All results also carry `minigame` (id), `context` (as passed) and `detail` (one-line text). `rank`: `gold >= 85, silver >= 65, bronze >= 40, none`.
Open one with `await openScene(game, 'minigame:track_sprint', { context: 'club'|'festival'|'exam'|'job'|'date', difficulty: 0..1, seed?, fitness? })`
(`fitness` defaults to `game.sim.state.player.traits.fitness`). Cancelling on the intro screen returns `{score:0, rank:'none', cancelled:true}`.

Structure: `minigame.js` (base class: intro -> 3-2-1 countdown -> play -> result with medal -> `scenes.pop(result)`; subclasses implement `startPlay/playUpdate/playDraw/drawBackground`
and call `this.end(score, extra)`), `logic.js` (pure and Node-tested: `rankFor`, sprint speed/scoring, seeded `makeChart`/`judgeHit`/`rhythmScore`, `makeOrders`/`cafeScore`),
one file per game. Mini-games paint an OPAQUE full-screen background (the UI canvas is blended over the world layer). They use `game.audio.sfx` if present and
`game.ui.services.drawIcon` for café item icons (placeholders otherwise). To add one: subclass `MiniGame`, add pure scoring to `logic.js` with tests, register it in `index.js`.

Harness: `node scripts/build.mjs --entry src/dev/minigames_demo.js --out dist/dev/minigames_demo.html`, open `?game=track_sprint|music_rhythm|cafe_serve` (`&live=1` to play with the keyboard).
It boots the REAL engine + UI service; `window.__mg` = `{ step(n), tap(action), start(), run(frames) /* scripted autoplayer */, scene(), result() }`.
Tests: `test/scenes/minigames_logic.test.mjs`. Verified: all three play from intro to result through the engine (autoplayer: sprint 2nd place 12.68 s, rhythm 29/29 perfect, café 12/12 served).

Added later by the lead: `ring_timing.js` (`minigame:astronomy_stars` "Star Gazing" for Moon Viewing Night and the Astronomy Club, `activity:shell_hunt` "Shell Hunt" for Beach Day, which pays 1/2/3 Spiral Shells by medal):
eight targets, a ring closes on each, confirm as it meets the target; pure helpers `ringProgress/ringAccuracy/ringScore/makeTargets`, tests in `test/scenes/ring_timing.test.mjs`.
Still NOT built: `soccer_penalty`, `art_palette`, `literature_words` (those clubs use the built-in timing drill of `activity:club_practice`).

## Activity scenes (`src/scenes/activities/{shop,activity_club,activity_job,activity_rest}.js`)
`registerActivityScenes()` now also registers `shop`, `activity:club_practice`, `activity:job_cafe`, `activity:rest`, `activity:nap`, `activity:jog`. All paint an opaque 320x240 backdrop,
call the sim with `advanceClock:false`, show a result card, then `clock.advance(minutes)` and `game.scenes.pop(result)`. Guard failures show one friendly line (`guardLine(kind, simResult)`) and pop an empty result.
- `shop` `{ shop: SHOP_ID }` -> `{ bought: [{ item, qty }] }`. Closed: keeper says when they open, pop `{ bought: [] }`. Otherwise greet -> stock ListMenu (icon, price; dimmed with `too dear` / `bag full` / `sold out`)
  -> quantity 1-9 (`maxQty`: money, daily limit, bag room) -> confirm -> `sim.shop.buy` (`coin` sfx) -> thanks -> list again; Cancel leaves. Keeper portrait via `ui.services.getPortraitSheet` (placeholder otherwise).
- `activity:club_practice` `{ forceFallback? }` -> `{ minutes, energy, gains, rank, medal?, score? }` (`rank` = club rank 0-5 after practice, `medal` = mini-game medal). `canPractice` guard, intro card (rank name, XP bar),
  `minigame:<clubGame>` with `{ context:'club', fitness, seed }` when registered (track, music), else the built-in timing drill (5 rounds x 3 s, marker on a bar, press confirm in the green zone; seeded;
  `makeTimingRounds`, `timingRoundScore`, `timingScore` -> `rankFor`). Cancelled/missing mini-game: no practice, `minutes: 0`.
- `activity:job_cafe` `{}` -> `{ minutes, energy, pay, rank }` (`rank` = medal, `null` when no shift). `canWork` guard, Aunt Roz briefing (long on the first shift, `rozBrief`), `minigame:cafe_serve` `{ context:'job' }`,
  `finishShift`, pay card (pay, tip, charm +1, shift count). Cancelled mini-game: Roz shrugs, no shift, `minutes: 0`.
- `activity:rest` -> `{ minutes, energy, gains }` bench, 30/60 min choice, park scene. `activity:nap` 1 h dim room. `activity:jog` 1 h side-scrolling run (+fitness). `canNap`/`canJog`/`rest` guards.
- Harness: `node scripts/build.mjs --entry src/dev/activities_demo.js --out dist/dev/activities_demo.html`, then `?scene=shop|club_practice|job_cafe|rest|nap|jog` (+ `&shop=corner_mart|cafe_menu &club=track|music|art &fallback=1
  &energy= &money= &minute= &day= &xp= &first=0 &storm=1 &napped=1 &full=1 &live=1`). `window.__act = { step(n), tap(action), scene(), result(), state }`. Tests: `test/scenes/activities_logic.test.mjs`.
