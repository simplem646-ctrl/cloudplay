# 01 · Rendering, Art, World, UI, Audio contracts

Audience: workers on Engine (T1), UI (T2), World (T3/T4), Art (T5), Audio (T6) and the
scene-integration task (T9). Everything here is a **data/format contract**. Where it says
"you define", document your final API in `docs/game/api/<area>.md` (required deliverable) so
later workers can use it. Shared constants: `src/core/constants.js`. Layouts:
`src/data/sheet_layout.js`. Ids: `src/data/ids.js`.

## 1. Presentation targets (Harvest Moon: Back to Nature feel, original assets)

- Logical screen **320×240** (4:3). The WebGL canvas backing store is exactly 320×240 and is
  CSS-scaled up (nearest-neighbour, integer scale when possible, letterboxed on a dark
  `#17121f` page). All world, UI and effects are drawn at this resolution, so the pixel grid
  is uniform. Camera positions are snapped to whole pixels (no shimmer).
- Top-down 3/4 view. **Tiles 16×16**, characters **16×24** (chibi, ~2.5 heads tall, big
  heads, stubby bodies, 1px darker-hue outline), 4-direction walk cycles.
  Houses show their front wall + roof; the player walks *behind* roofs and tree canopies.
- Warm, saturated, cozy palette. Soft 3-tone shading per material (light, base, shade),
  outlines in a darker shade of the object's colour (never pure black). Grass has dotted
  texture, paths are lighter tan, water light blue with moving highlights, flowers in clusters.
- Seasons recolour the world (spring = pink blossoms, summer = deep green, autumn =
  orange/brown leaves, winter = snow on ground and roofs).
- Day/night: tint grading (dawn gold, day clear, sunset orange, night deep blue) with lit
  windows and lamp glows at night. Weather: rain streaks, storm, snow, petals, leaves.
- Reference palette ("Bellhaven palette"; extend, don't fight it): cream `#f6ecd2`,
  parchment `#e8d5a8`, wood `#7a4f2e`, dark brown `#3b2a1f`, ink navy `#1d2340`, sky
  `#8fd0f0`, grass `#6cc24a`, deep grass `#3f8f3a`, blossom `#f4b6c8`, sunset `#f08a4b`,
  harbor blue `#4a90c8`, brick `#b5503c`, slate roof `#4b5a78`, gold `#f2b84b`.
- UI: dialogue box at the bottom with a 48×48 portrait at the left (blinks, mouth moves while
  text types), a name tab, typewriter text with a bouncing ▼. HUD top-right: season icon, date
  + weekday, clock, weather icon; top-left: location banner that fades; bottom-left: energy bar.
  Menus are cozy dark-navy/cream panels with warm-yellow selection.

## 2. Coordinates, layers, camera (Engine)

- World units = pixels. Tile (tx,ty) covers pixels [tx·16, tx·16+16) × [ty·16, ty·16+16).
- An actor's position `(x, y)` is the pixel position of its **feet** (bottom-centre of its
  sprite). Standing on tile (tx,ty): `x = tx·16+8`, `y = ty·16+14` (helper `tileToFeet` in
  `src/core/util.js`). Collision hitbox = 10×6 px centred on the feet.
- Draw order: `ground` layer → `deco` layer → actors **y-sorted by feet y** (+ props) →
  `above` layer (roof overhangs, tree canopies, high shelves) → weather → grading → UI.
- **Gotcha (verified):** Three.js with `OrthographicCamera(0, W, 0, H)` (y-down) flips the
  triangle winding, so single-sided meshes vanish. Use `side: THREE.DoubleSide`, or build
  y-up and flip coordinates. Use `THREE.NearestFilter`, `generateMipmaps = false`,
  `premultiplyAlpha` as needed, and `THREE.ColorManagement.enabled = false` +
  `renderer.outputColorSpace = THREE.LinearSRGBColorSpace` so palette colours pass through
  unchanged.
- Camera follows the player, clamped to the map (maps smaller than the screen are centred),
  supports `panTo`, `snapTo`, `shake`, `focus(actor|point)`. Positions rounded to integers.

## 3. Tileset contract (World T3 provides, Engine consumes)

`src/world/tiles.js` (pure data, **no DOM**, importable in Node) exports the tile catalog;
`src/world/tileset.js` (draws pixels, DOM allowed inside functions only) exports
`getTileset(season)`:

```js
{ canvas,            // HTMLCanvasElement, width = cols*16, height = rows*16 (cached per season)
  cols, rows, tileSize: 16,
  names: { grass_a: 1, ... },      // tile name -> index. Index 0 = empty (transparent)
  meta: [ { name, solid?: bool, sound?: 'grass'|'stone'|'wood'|'sand'|'water'|'carpet'|'tile',
            water?: bool, anim?: { frames: [idx, idx, ...], fps: 3 } }, ... ] }  // index-aligned
```
- Indices and names are **identical in all four seasons**; only the pixels differ
  (indoor tiles are identical across seasons). Engine swaps the atlas texture on season
  change. Animated tiles (water, flowers swaying, lantern flames): maps store the base index;
  Engine advances frames from `meta[i].anim`.
- Autotile terrains (water, paths, sand, ...) are resolved by the **map builder** at build
  time into plain indices, so Engine never needs terrain logic.

## 4. Map contract (World provides, Engine + overworld consume)

`src/world/maps/<map_id>.js` default-exports a **MapDef** (or a function returning one):

```js
{ id, name,                       // 'town_square', 'Bell Square' (name shows in the HUD banner)
  width, height,                  // tiles
  indoor: bool,
  layers: { ground, deco, above },// each a Uint16Array(width*height) of tile indices (0 = none)
  collision: Uint8Array(width*height),   // 1 = blocked (derived from tile meta + builder block/clear)
  warps: [ { x, y, w, h, to: 'map_id:anchor', sfx?: 'door_open',
             requires?: Cond, lockedText?: string } ],              // tile rect; step on = travel (Cond: script_dsl.js)
  anchors: { entrance: {x,y,dir}, center: {...}, spot_a: {...}, ... }, // tile coords + facing
  interactables: [ { id, x, y, w, h, label, action: { type, ... } } ],  // tile rect, face it + confirm
  ambient: { music: 'town_spring'|null, lighting: 'outdoor'|'indoor', weather: bool, ambience: 'waves'|null } }
```
- Anchor naming (global, deterministic): every connection A→B gives **map B an anchor
  `from_<A>`** (where the player appears when arriving from A); warps in A use
  `to: 'B:from_A'`. Every map also defines `entrance` (default arrival), `center`, and
  `spot_a`–`spot_d` (four distinct, visible, walkable staging spots for cutscenes), plus
  `npc_1`–`npc_6` idle spots, plus the map-specific anchors listed in `04_WORLD_SPEC.md`.
- A global anchor id is `map_id:anchor_name` (used by NPC schedules and events).
- `interactables[].action.type` ∈ `INTERACT_ACTIONS` in `src/data/ids.js` with shapes:
  `{type:'sleep'}`, `{type:'save'}`, `{type:'study', place:'home'|'library'}`,
  `{type:'shop', shop:<SHOP_IDS>}`, `{type:'text', lines:[...]}`, `{type:'event', id}`,
  `{type:'activity', id:<ACTIVITY_IDS>}`, `{type:'job', id:'cafe'}`, `{type:'rest'}`,
  `{type:'collect', table:'beach_shells'}`, `{type:'board', id:'school'|'town'}`,
  `{type:'calendar'}`, `{type:'door_locked', text}`.
- Warps and interactables are plain JSON, so the builder validates them in Node
  (targets exist, anchors in bounds, no warp on a solid tile, everything reachable from
  `entrance`).

## 5. Character art contract (Art provides)

`src/art/index.js` exports (all cached; DOM canvases):

| function | returns |
|---|---|
| `getCharacterSheet(who, outfitSlot = 'auto', season)` | `{ canvas, ...CHAR_SHEET }`; `who` = cast id, extras id, or an appearance object. `outfitSlot` ∈ school/casual/sport/swim/work/sleep (falls back to casual). Winter adds scarf/coat, summer uses short sleeves |
| `getPortraitSheet(who, outfitSlot)` | `{ canvas, ...PORTRAIT_SHEET }` (48×48 faces, blink + talk rows; shoulders show the outfit colours) |
| `getAnimalSheet('cat', fur)` | `{ canvas, ...ANIMAL_SHEET }` |
| `getIconAtlas()` | `{ canvas, size:16, cols:16, names:{ name: index } }` for every `ICON_NAMES` entry |
| `drawIcon(ctx, name, x, y)` | blits one 16×16 icon |
| `appearanceFromSeed(seed, extraKind)` | a valid appearance for background characters |
| `getTitleBackdrop(season)` | 320×240 canvas: Bellhaven hill, school with bell tower, harbor, sky |
| `drawLogo(ctx, x, y)` | pixel-lettered "Bellhaven Days" logo |

Sheets follow `src/data/sheet_layout.js` exactly. The cast's appearances are in
`src/data/cast.js` (`CAST`), vocabulary in `src/data/appearance.js`.
Every character must be **instantly distinguishable at 16×24** (silhouette, hair colour,
outfit colour). Portraits carry the personality (eyes, brows, mouth shapes per expression).

## 6. UI contract (UI provides, scenes consume)

- UI draws into a single 320×240 Canvas2D (`ui.canvas`) every frame; Engine uploads it as the
  top layer (nearest filtering, premultiplied alpha correct). Text uses a **custom pixel bitmap
  font** you draw yourself (5×7 glyph cell, 1px spacing, drop-shadow variant, ASCII 32–126 + `$`
  and a few symbols `♥ ▼ ► ★ ♪`). Measure/wrap/typewriter helpers included.
- Widgets are plain objects/classes with: `update(dt, input)`, `draw(ctx)`, `done` (bool) and
  `result` (when done). They never touch the DOM, the clock or game state directly; scenes pass
  data in. Icon drawing goes through an injected `drawIcon(ctx, name, x, y)`.
- Required widgets: `DialogueBox` (speaker name tab, portrait w/ blink + talk animation via a
  `getPortrait(who, face)` callback, typewriter, auto-paginate, ▼ prompt, hold-to-speed, call
  `onBlip()` for text sfx), `ChoiceBox` (2–4 options), `ListMenu` (scroll, icons, disabled rows,
  right-aligned values), `GridMenu`, `ConfirmBox`, `NumberPicker`, `Toast` stack, `HUD`
  (location banner, clock, date, weather, season icon, money, energy bar), `HeartsRow`,
  `Meter`/`Bar`, `TabBar`, `CalendarGrid` (28 days, weekday header, festival/exam/birthday
  markers), `Banner` (full-screen title card), `TextPage` (scrolling text/credits),
  `Table` (report card), `WindowFrame` (9-slice panel), `Cursor`.
- Style: dark-navy translucent panels with cream border and white text, warm-yellow selection,
  parchment accents for status screens, matching the Bellhaven palette.

## 7. Input contract (Engine provides)

Actions: `up down left right confirm cancel menu run fast skip debug`.
Keyboard: arrows/WASD move · Z/Enter/Space confirm/interact · X/Backspace/Esc cancel/back ·
Esc/Tab/M menu (menu in the overworld, cancel elsewhere) · Shift run · Ctrl or hold confirm = fast
text. Gamepad (standard mapping) and a **touch overlay** (virtual D-pad + A/B/Menu, shown only on
touch devices) must work. API: `input.down(a)`, `input.pressed(a)`, `input.released(a)`,
`input.axis()` → `{x,y}` in −1..1, `input.update()` once per frame, and **`input.inject(action, down)`** for
tests/automation. Key repeat for menus: `input.repeat(a)` (first press, then every 120 ms after
350 ms).

## 8. Scenes & services (Engine provides the skeleton, T9 fills it)

```js
class Scene { constructor(game); enter(params); exit(); pause(); resume();
              update(dt, input); draw(ui /* UICanvas ctx wrapper */);  // dt in seconds
              get transparent() { return false }  // true: scene below is still drawn/updated? (draw only)
}
SceneManager { push(scene, params), pop(result), replace(scene, params), top, update(dt), draw() }
game = { renderer, world (WorldView), input, ui, audio, art, sim, bus, scenes, debug }
```
Fixed update step 1/60 s with `dt` clamped (no spiral of death); render once per animation
frame; pause updates when the tab is hidden (the clock must not run in the background).
`window.__game = game` is exposed for testing (see 02 §9 for the debug API).

## 9. Engine feature checklist (T1)

Pixel renderer + resize/letterbox · tilemap (3 layers, animated tiles, season swap) · actor
sprites (y-sort, soft ellipse shadows, emote bubbles above heads, flip not needed) ·
camera · `mover` (pixel movement with sliding AABB collision vs `collision` grid, 8-way speed,
walk 56 px/s, run 96 px/s) · A* pathfinding on the tile grid · post-process grading
(tint, brightness, saturation, vignette, fade, flash) · point **lights** (≤16 additive glows
used at night) · weather particles (rain, storm w/ lightning flash, snow, petals, leaves,
fireflies) · screen transitions as promises (`await fade.out(300)`) · input + touch overlay ·
scene manager · screenshot (`renderer.toDataURL()`) · FPS guard. Everything must run
acceptably on software WebGL (SwiftShader).

## 10. Audio contract (Audio T6)

`src/audio/index.js` exports a singleton `audio`: `init()` (call from a user gesture; creates
the AudioContext, safe to call repeatedly), `sfx(id)`, `music(id, { fadeMs = 800 } = {})`
(`null` stops; the same id is a no-op), `ambience(id | null)` (looping beds), `setVolume({ master, music, sfx })`
(0..1, persisted by the caller), `mute(bool)`, `current()` → current music id. All sound is
**synthesised in code** (WebAudio oscillators/noise/filters, a small step-sequencer for music):
no audio files. It must implement every id in `MUSIC_IDS`, `SFX_IDS`, `AMBIENCE_IDS` (src/data/ids.js);
unknown ids log once and play nothing. Music is warm, melodic, cozy (soft square/triangle/pulse
voices with gentle reverb), seasonal variants of the town theme, tense exam theme, romantic and
sad event themes, fanfares for endings. Loops are seamless; tracks are 1–2 minutes of material.

## 11. Dev harnesses & verification (every task)

- Add `src/dev/<task>_<name>.js` entry pages (e.g. `src/dev/engine_demo.js`), build them with
  `node scripts/build.mjs --entry src/dev/engine_demo.js --out dist/dev/engine_demo.html`
  (or `npm run build:dev -- --all-dev`), then look at them:
  `node scripts/shot.mjs dist/dev/engine_demo.html --out /tmp/x.png --scale 2` and **open the PNG
  with the Read tool** to inspect it. Look for: wrong colours, missing sprites, text overflow,
  seams, off-by-one tile errors. Iterate until it looks good, not just until it runs.
- Pure logic gets `node --test` tests under `test/<area>/*.test.mjs` (`npm test`).
- Modules must be importable in Node: no `window`/`document` access at import time.
