# Engine API (`src/engine/**`, task T1)

Import everything from the barrel: `import { createApp, Actor, ... } from '../engine/index.js'`.
All modules import in Node (no DOM at import time); only constructing a `Renderer`, `Input.attach`,
the touch overlay and the mock assets need a browser.

## Run the harness
```bash
node scripts/build.mjs --entry src/dev/engine_demo.js --out dist/dev/engine_demo.html
node scripts/shot.mjs dist/dev/engine_demo.html --out /tmp/x.png --scale 2      # or open the file / serve dist
node --test "test/engine/**/*.test.mjs"                                         # pure-logic tests
```
Keys in the page (H toggles the list): arrows/WASD move, Shift run, Z interact/emote, 1-4 season, C/R/T/N/P/L/F weather
(clear/rain/storm/snow/petals/leaves/fireflies), D/U/G/I/B time (day/sunset/night/indoor/lantern), Y time-lapse, O fade,
X flash, K shake, E emote, V debug overlay, J NPC walks a path, Q camera smoothing, M reload map. `?touch=1` forces the touch overlay.
`window.__engineDemo` exposes `{app, world, renderer, player, npc, setSeason, setWeather, setTime, setDebug, teleport, npcWalk, step, freeze, stats, reloadMap}`.

## createApp
```js
const app = createApp({ container: document.getElementById('app') });   // also: ui, extra, touch:'auto'|true|false, autoStart, expose
Object.assign(app.game, { ui, audio, art, sim });                        // integration adds its services
app.game.scenes.push(new MyScene(app.game));
```
`app = { game, renderer, world, input, scenes, time, quality, hooks:{beforeUpdate[],afterUpdate[]}, start(), stop(), pause(), resume(), step(n, dt), setUI(ui), destroy() }`.
`game = { renderer, world, input, ui, audio, art, sim, bus (core bus), scenes, debug, paused }` (also `window.__game`).
Loop: fixed 1/60 s steps (frame dt clamped to 0.1 s, max 6 catch-up steps), one render per animation frame, paused while the
tab is hidden. Per step: `input.update()` -> `scenes.update(dt)` -> `world.update(dt)` -> `renderer.update(dt)`.
Per frame: `ui.beginFrame?.()` -> `scenes.draw()` -> `ui.endFrame?.()` -> upload `ui.canvas` (unless `ui.dirty === false`) -> `renderer.render(world)`.
UI contract the loop expects (T2 should provide): `ui.canvas` (320x240), optional `beginFrame()` (clear), `endFrame()`, `dirty`.
FPS guard: sustained <28 fps for 2 s sets `app.quality='low'` (weather particle counts halved); back to high after 8 s of >50 fps.
`app.step(n)` works while stopped (deterministic screenshots/tests). Lightning emits `bus.emit('weather:lightning')` (no thunder sfx id exists in `SFX_IDS`).

## Renderer (`app.renderer`)
Canvas backing store is exactly 320x240; CSS-scaled nearest-neighbour and centred in the container. Sizing comes from the
container CONTENT box (`clientWidth/Height` minus padding; ResizeObserver + window resize), never `window.innerWidth`:
integer device-pixel scale when >= 1x fits, otherwise fit-to-box. `renderer.layout = {scale, cssW, cssH, integer}`; `resize()`.
`#boot` inside the container is removed on the first frame.
```js
renderer.setGrading('night' | {tint:[r,g,b], brightness, saturation, vignette});     // jump
await renderer.tweenGrading('sunset', 1500, 'inOut');                                  // partial objects tween only given keys
renderer.fade.out(300, '#000') / .in(300) / .to(amount, ms, color) / .set(amount, color)   // promises; renderer.fadeUI = true also covers the UI
renderer.flash('#fff', 0.8, 200, holdMs);   renderer.lightSteps = 5 /* dithered light bands, 0 = smooth */
renderer.setUICanvas(canvas); renderer.markUIDirty();                                   // UI quad, alpha-blended on top (not graded/faded unless fadeUI)
renderer.toDataURL();  renderer.perf = {ms, fps};  renderer.memory = {geometries, textures}   // screenshot / leak counters
```
`GRADING_PRESETS.day|dawn|sunset|night|lantern|indoor`; `gradingAt(minutes)` = smooth outdoor curve for the clock;
`overcastGrading(g, 0..1)` darkens/desaturates for rain/storm; `lerpGrading`, `resolveGrading`.
`fade/flash/grading` tick from `renderer.update(dt)` (the app calls it), so they pause with the game.
Frame: world -> 320x240 target -> grading quad (tint, brightness, saturation, vignette, <=16 dithered point lights, flash) ->
overlay (fireflies) -> fade -> UI.

## WorldView (`app.world`)
```js
world.loadMap(mapDef, tileset, { season });   // replaces + disposes the old map (actors kept); cam bounds set to the map
world.setSeason('winter', getTileset('winter'));   // atlas swap only (indices identical across seasons)
world.setTile('deco', tx, ty, index);              // runtime tile edit (rebuilds that layer; update map.collision yourself)
world.setIconAtlas(getIconAtlas());                // needs names `emote_<kind>`
world.addActor(a) / removeActor(a) / clearActors() / actorsAt(tx, ty, w, h)
world.setWeather('rain', 1, rampSec) ; world.weather.set('fireflies', 0.8) ; world.weather.clear() ; world.weather.strike()
world.addLight({ x, y, radius: 48, color: '#ffd9a0', intensity: 1, flicker: 0, on: true }) -> light (mutate it) / removeLight / clearLights / setLights
world.setDebug(true | {collision,warps,anchors,interactables,hitboxes,grid} | false)
world.cam (Camera) ; world.stats() ; world.dispose()
```
Draw order is fixed: ground -> deco -> shadows -> actors y-sorted by feet y (`actor.sortBias` for props) -> `above` -> emotes -> debug -> weather -> grading -> UI.
Animated tiles use `meta[i].anim = {frames, fps}`; water tiles (`meta.water`) animate in sync, others are de-phased per tile.
Weather kinds: `sunny|cloudy|none` (clear precipitation), `rain`, `storm` (+ lightning every 4-12 s), `snow`, `petals`, `leaves`, `fireflies`.
`setWeather` replaces precipitation but keeps fireflies; `weather.set(name, i)` layers effects; `weather.clear()` stops everything.
Fireflies are additive sprites drawn AFTER grading so the night tint does not dim them.

## Actor
```js
const a = new Actor({ id, sheet /* {canvas, ...CHAR_SHEET} */, kind: 'char'|'animal', tx, ty /* or x, y = feet */, dir, shadow, shadowSize, hitbox, solid });
a.setTile(tx, ty); a.setPos(x, y); a.setDir('left'); a.faceToward(otherActorOrPoint); a.setSheet(sheet);
a.setPose('happy'|'sad'|'surprised'|'cheer'|'sleep'|'sit'|null)   // animals: 'sit'|'sleep'|'stretch'|'loaf'|'sit_left'...
a.emote('heart', 1.8)  // kinds from EMOTE_KINDS; pops up, bobs, fades, auto-expires; a.clearEmote()
a.tint = [1,.8,.8]; a.alpha = .5; a.visible = false; a.flashColor = [1,1,1,0.6]; a.speedMul = 1.2; a.emoteOffsetY = -4
a.x, a.y (feet), a.tx, a.ty (tile), a.dir, a.moving, a.running
```
Walk animation plays `walkCycle [1,0,2,0]` (0.14 s/frame, 0.09 running) only on frames where `moveActor`/`PathWalker` (or you,
via `a.setMoving(true, run)`) reported movement; otherwise the stand frame shows. Positions are floats; sprites are drawn at rounded pixels.

## Camera (`world.cam`)
```js
cam.follow(actor, { smooth: 0 /* 1/s, 0 = instant */, offsetX: 0, offsetY: -10 });   cam.follow(null)
cam.snapTo(x, y); await cam.panTo(x, y, 600, 'inOut'); await cam.focus(actorOrPoint, ms);   cam.shake(3, 300)
cam.px, cam.py = integer top-left in world px;  cam.worldToScreen(wx, wy)
```
Clamped to the map; maps smaller than 320x240 are centred. Shake is integer jitter at ~30 Hz. Following resumes after a pan.

## Input (`app.input`)
`down/pressed/released/repeat(action)`, `axis()` -> `{x,y}` (-1..1, analog stick aware), `update()`, `inject(action, down)`,
`tap(action)` (one-frame press), `clear()`, `lastDevice` ('keyboard'|'pad'|'touch'), `bindKeys({action:[codes]})`.
Actions: `up down left right confirm cancel menu run fast skip debug`. Keys: arrows/WASD; Z/Enter/Space confirm; X/Backspace/Esc cancel;
Tab/M/Esc menu; Shift run; Ctrl fast; C skip; ` or F2 debug. Esc triggers both `cancel` and `menu` (the scene decides which it reads).
Standard gamepad: A confirm, B cancel, X/LT run, Y/Start menu, RB/RT fast, Back skip, d-pad + left stick. Edges latch between frames
(a tap shorter than a frame is not lost); `repeat` fires on press, then every 120 ms after 350 ms. Touch overlay (D-pad slide zone,
A/B, MENU, RUN toggle) is DOM inside the container, shown on touch devices; `input.touch.show(true)` forces it. Keys clear on blur/hidden.

## Scenes
```js
class Shop extends Scene { enter(params){}  update(dt, input){ if (input.pressed('cancel')) this.game.scenes.pop({bought: 3}); }  draw(ui){} }
const result = await game.scenes.push(new Shop(game), { shop: 'cafe' });   // resolves with the pop() value
```
`push(scene, params)` and `replace(scene, params)` return a Promise resolving with the value given to the matching `pop(result)`
(`undefined` if popped without one, replaced, or cleared by `reset()`). `pop(result)` also calls `resume(result)` on the scene below.
Only the top scene updates; `draw` runs from the lowest scene up to the top, starting below any `transparent` scenes. `reset(scene?)` clears all.

## Movement and pathfinding (pure)
```js
moveActor(actor, ax, ay, dt, map, { run, speed, blockers: [otherActors], assist: 4 })   // ax/ay = input.axis(); sets dir + walk flag
moveBy(actor, dx, dy, map, opts) -> { moved, dx, dy, blockedX, blockedY }                // raw displacement with sliding collision
const path = findPath(map.collision, map.width, map.height, sx, sy, tx, ty, { goalBlocked, blocked: (x,y)=>bool|Set, maxNodes })  // [{x,y}] incl. start+goal, or null
const walker = new PathWalker(npc, path, { run, blockers }); if (walker.update(dt, map)) { /* arrived (walker.stuck if blocked) */ }
nearestWalkable(collision, w, h, tx, ty, radius)
```
`map` = anything with `{width, height, collision}` (a MapDef; optional `blockedFn(tx,ty)` for dynamic blockers). Speeds: `WALK_SPEED` 56, `RUN_SPEED` 96 px/s; diagonals are normalised.
Hitbox: 10x6 px, horizontally centred on x with its BOTTOM edge at y (matches `feetToTile`). Out-of-bounds is solid. Sliding is per axis; pure-axis
movement that clips a tile corner by <= 4 px nudges around it (never around actors). Overlapping actors may walk apart. Paths are 4-way and prefer straight runs.

## Mock assets for harnesses (`src/engine/mock/assets.js`, not in the barrel)
`mockTileset(season)`, `mockMap()` (40x30, house with roof in `above`, pond, flowers, lanterns, trees with `above` canopy, lights),
`mockCharSheet({hair, shirt, pants, skin, long})` (CHAR_SHEET), `mockCatSheet()` (ANIMAL_SHEET), `mockIconAtlas()` (emote bubbles), `MOCK_TILES`.

## Gotchas
- A y-down ortho camera flips winding: every engine material is `DoubleSide`; do the same for custom meshes added to `world.scene`.
- `ColorManagement` is disabled and textures are `NoColorSpace` + nearest: canvas colours pass through unchanged. Use `TextureCache.acquire/release` (ref-counted)
  or `makePixelTexture` for your own textures; do not leave raw `THREE.CanvasTexture`s around across map swaps.
- All materials are `transparent` so `renderOrder` decides order (opaque objects would always draw first). Do not put a `Group` with a `renderOrder` in the scene.
- Redrawn canvases (animated sheets) need `world.textures.refresh(canvas)`.
- The `fade` does not cover the UI unless `renderer.fadeUI = true`.
- `input.axis()` returns a fresh object each call; `input.update()` must run once per frame (the app does it).
