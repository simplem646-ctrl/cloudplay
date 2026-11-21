# Scenes API: boot, title, overworld, Stage, NPCs, directors, debug (`src/main.js`, `src/scenes/*.js`, task T9a)

How the game is assembled and how the playable loop works. Entry: `src/main.js` -> `bootGame()` (`src/scenes/boot.js`).

## Assembly (`boot.js`)
1. `installErrorOverlay()`: `window.onerror` / `unhandledrejection` show a dismissible DOM overlay (never a blank page); messages also in `game.errors`.
2. `UICanvas` + `createApp({container, ui})`; `game = app.game` gets `app, audio, art, errors`; `ui.configure({drawIcon, getPortraitSheet, sfx})`; icon atlas into the world.
3. `createTitleSession(game)` (a throw-away sim so menus never see `game.sim === null`), `applySettings(game)`.
4. `registerCoreScenes()` (`title`, `overworld`, directors `forced_sleep`, `energy_collapse`), then EVERY `REGISTRARS[i].fn()` from `src/_generated/registrars.js`
   (try/catch each, failures logged). New task entry points light up with no wiring.
5. `createDebugApi(game)`, a first-gesture handler (`keydown|pointerdown|touchstart`) calls `audio.init()` and acts as "Press Start", push `title`.

`game = { renderer, world, input, ui, audio, art, sim, events, bus, scenes, debug, app, menus, settings, overworld, errors }`.
`game.sim` / `game.events` are replaced per session (`startSession(game, state)` in `session.js`: `createSim` + `createEventSystem`, `await sim.ready`,
re-arms `startDayTracking`, `applySettings`). Always read `game.sim` live; never cache it across a load. `game.overworld` is the running overworld scene (null on the title).

## Flow
`title` (Press Start -> New Game / Continue (newest save, auto included) / Options (`settings` scene)) -> `scenes.replace(new OverworldScene(game, {fresh}))`.
`fresh`: black screen, banner "Bellhaven - Spring, Year 1", Theo on `home_theo:bed` at 06:30, fade in, `wake` trigger. Continue/load: saved tile (else anchor, else bed), `enterMap` trigger.
`credits` resets the stack to the registered `title`. A pause-menu load (`{loaded:true, state}`) calls `overworld.loadSession(state)`.

## Overworld (`overworld.js`)
- **Maps**: `loadMapNow(id, anchorRef)` (sync, between fades) / `changeMap(id, ref, {fade, scripted})`. Tileset by `state.time.season` (swapped on a new season), collision from the MapDef,
  camera rigidly follows Theo (offsetY -8; rigid keeps the sprite/background pixel phase stable), location banner on entry. A warp to a map that does not exist (or whose `requires` fails)
  shows `lockedText` / "The door is locked for now." and steps the player off the door tile. Warps use `warpLock` so a door is not re-triggered while standing on it.
- **Movement**: `moveActor` with NPCs as blockers, walk/run, footsteps by tile `meta.sound` (`step_*`), a hint tooltip (label) when facing an NPC or interactable. Confirm interacts, Esc/Tab/M (`menu`) opens `pause`
  (fallback: Resume / Save / Title when not registered).
- **Clock**: `SECONDS_PER_GAME_MINUTE` per `sim.clock.advance(1)` ONLY while idle (no dialogue, script, sub-scene, fade, flow). `onMinute()` (also after any jump, via `afterSubScene()`) refreshes dayInfo, outfits,
  NPCs, presentation, runs `runDirectors`, and queues the `clock` trigger.
- **Presentation** (rules are pure, `presentation.js`): grading = `gradingAt(minute)` + weather overcast outdoors, `indoor` preset inside, eased every frame; lamp (`lamp_head`) and window (`win_*`) lights follow `nightFactor`;
  weather particles by `state.weather.today` (+ light petals in spring / leaves in autumn / fireflies on summer nights), none indoors; ambience (rain, snow_wind, crickets, birds, map `ambient.ambience`);
  music from `ambient.music` (`town` -> `town_<season>` / `town_night` / `rain`; `school` -> `school_day` / `school_class` in a lesson).
- **Triggers** (`triggers.js`): pending asks (`wake`, `enterMap`, ...) first; then `clock` (once per minute, needs the cool-down), then `auto` (about once a second while idle). One event per ask, `runTrigger` re-asks
  up to 6 times so a finished event can unlock the next; 2 s cool-down after any event (`TriggerGate`). `interact` events replace an interactable's default action; `talk` events replace chat.
- **Sleep** (`sleepFlow`): confirm -> `sleep` trigger -> fade -> `sim.clock.sleep()` -> `sleep` scene (`{summary}`) -> new morning on `home_theo:bed` -> `wake` trigger (autosave happens inside `clock.sleep`).
  `summary.gameEnd` -> `ending` scene. Forced (02:00): narration + Aunt Roz scolding. 0 energy: `clock.collapse()` -> clinic / nurse (home when that map is missing).
- **Sub-scenes**: everything via `openScene` (registry). Missing ones toast "Coming soon". Actions implemented in `interactions.js` for all of `INTERACT_ACTIONS`
  (`sleep save study shop text event activity job rest collect board calendar door_locked`; `board` lists `sim.calendar.upcoming`; the SCHOOL board first asks "Upcoming events / Club sign-ups": `clubSignup` in `interactions.js` joins, switches or leaves a club, the only sign-up path after the Club Fair).
- **Talking** (`talkTo`): face the player, `relationships.talk`, birthday greeting, `talk` event else `dialogue.talk` lines (portrait + face), hearts toast, then "Give a gift?" (ChoiceBox -> ListMenu of non-key items
  -> `dialogue.gift` -> reaction lines + toast) when not gifted today.

## Title (`title.js`)
`Press Start` -> New Game / Continue / Options / How to Play (a controls sheet drawn in the scene: keyboard keys, touch note, two tips). Continue is preselected when a save exists.

## Stage (`stage.js`)
Implements the whole Stage of doc 02 s7 over the overworld: `say narrate think choice warp place hide moveTo(A*) face pose emote cam fade flash lighting sfx music musicResume banner wait call endGame resolveAnchor`
+ `begin/end/currentMap`. `begin` locks input and hides the HUD; `end` restores camera, lighting, music, HUD, hands scripted NPCs back to the schedule and re-asks `enterMap` if the map changed.
`warp` keeps the screen black if the script already faded out. Hold `skip` (C / gamepad Back) in a `skippable` event to fast-forward (dialogue auto-turns, waits and fades shrink, "SKIP >>" shows; choices still wait).
Anchor refs: `'spot_a'` (current map), `'map:anchor'`, `{x,y}` tiles (`anchors.js`, falls back to `entrance`). `endGame()` opens `ending` after the script finishes.

## NPC manager (`npc_manager.js`, `npc_plan.js`)
Per minute `sim.schedule.snapshot(minute)` decides for every scheduled character: spawn / leave / walk. Walks use A* + `PathWalker`; NPCs start early (`wantedTarget` + `walkMinutes`) to arrive on time; across maps they
appear at / leave through the nearest door. Occupied anchors get a free neighbour tile (`findFreeTile`), `seat_*` anchors use the `sit` pose, `activity` picks the outfit slot (`outfitSlotFor`: school hours school, evening/weekend casual, sport/swim/work/sleep),
extras use their ids (art `lookupWho`), the cat uses the animal sheet. Stage-touched actors are `scripted` (schedule ignores them) until `releaseScripted()`.

## Directors (`directors.js`)
`forced_sleep` (order 5, minute >= 02:00) and `energy_collapse` (order 8, energy 0) return `{call}`; the school director (order 20) comes from `registerAcademics`. `runDirectors` runs once per in-game minute while idle.

## Debug API (`window.__game.debug`, `debug.js`)
`warp(map, anchor?)` `setTime('HH:MM')` `setDate(y, season, d)` `giveMoney(n)` `giveItem(id, n)` `setFlag(name, v)` `addFriend(npc, pts)` `setStat(name, v)` `sleep({scene?})` `skipDays(n)` `runEvent(id)` (not awaited; use waitIdle)
`listEvents()` `state()` `loadState(json)` `press(action, ms)` `screenshot()`; helpers `nextFrame()` `waitIdle({timeout})` `walkTo(tx, ty)` `teleport(tx, ty)` `talkTo(npcId)` `npcs()` `where()`
`autoAdvance(on, choiceIndex)` (auto-confirms dialogue so events run unattended) `overlay(on)` `fps(on)`.

## Tests and harness
`test/scenes/flow_pure.test.mjs` (anchors, free tiles, NPC planning, outfits, trigger gate/queue, presentation rules, directors).
`npm run build -- --dev && node scripts/shot.mjs dist/index.html --out /tmp/flow/x.png --script src/dev/flow_playthrough.js`: title -> new game -> wake -> travel
home -> cafe -> harbor -> square -> locked door -> talk -> event -> bed -> next morning, with `FLOW` log lines and screenshots.

## Known limits
- `shop`, club / job / rest / nap / jog activity scenes and several mini-games are not registered yet: the overworld toasts "Coming soon".
- Maps that do not exist yet (beach, flower_shop, bookstore, corner_mart, clinic, cafeteria, art/music room, gym, observatory) show the locked-door line; the collapse falls back to home.
- NPCs jump to their schedule position after a sub-scene that moved the clock (class, study); they walk only during normal play and after events.
- Windows are lit with point lights, not tile swaps. No thunder sfx exists. Camera follow is rigid (no smoothing) on purpose.
