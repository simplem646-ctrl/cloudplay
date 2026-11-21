# Art API (`src/art/**`)

Procedural pixel art for Bellhaven Days: character sprite sheets, 48x48 portraits, the icon atlas, the cat,
background characters, title/ending backdrops and the logo. Everything draws into pure-JS RGBA
`PixelBuffer`s and wraps a DOM canvas **lazily**, so every module imports and runs in plain Node (tests).
All results are cached and deterministic (same input = identical bytes).

```js
import * as art from '../art/index.js';
```

## Functions

| call | returns |
|---|---|
| `getCharacterSheet(who, outfitSlot='auto', season='spring')` | `{canvas, buffer, width:96, height:144, ...CHAR_SHEET}` |
| `getPortraitSheet(who, outfitSlot='auto')` | `{canvas, buffer, width:384, height:144, ...PORTRAIT_SHEET}`, **`null` for animals** |
| `portraitRect(expression='neutral', face='normal'\|'blink'\|'talk')` | `{sx,sy,sw,sh}` source rect inside the portrait sheet |
| `drawPortrait(ctx, who, expression, face, x, y, slot='auto')` | blits one 48x48 cell; `false` if `who` has no portrait |
| `getAnimalSheet('cat', fur='orange_tabby')` | `{canvas, buffer, 96x80, ...ANIMAL_SHEET}`; fur = any key of `FUR` |
| `getIconAtlas()` | `{canvas, buffer, size:16, cols:16, rows, names:{name:index}}` for every `ICON_NAMES` entry |
| `drawIcon(ctx, name, x, y)` | blits a 16x16 icon; an unknown name draws a '?' box |
| `appearanceFromSeed(seed, extraKind)` | valid appearance (passes `validateAppearance`), deterministic |
| `getTitleBackdrop(season)` | 320x240 result (`canvas`, `buffer`) for spring/summer/autumn/winter |
| `getEndingBackdrop(key)` | 320x240; keys `ENDING_KEYS` = school_dawn, school_dusk, bell_night, harbor_dusk, classroom_sunset, rooftop_sunset |
| `getLogo()` / `drawLogo(ctx, x, y)` | "Bellhaven Days" logo, 176x68; `(x,y)` is the **top-left** corner |
| `clearArtCache()` | drops caches (tests only) |

`who` = cast id (`'nina'`), extras id (`'student_03'`, `'townie_01'`; built with `appearanceFromSeed(seed, extraKind)`)
or an appearance object (optionally with art-only `gender: 'm'|'f'`, `age: 'teen'|'adult'|'elder'|'child'`).
Result objects: `canvas` is a getter (browser: HTMLCanvasElement; Node: `null`), `buffer` is the raw
`Uint8ClampedArray` RGBA, `pixels` the `PixelBuffer`.

### UI hook (portraits and icons)
`ui.configure({ drawIcon, getPortraitSheet })`: pass `art.drawIcon` and `art.getPortraitSheet` directly. A `face`
for the dialogue box maps onto `portraitRect(expression, face)`, or call `art.drawPortrait(ctx, who, expr, face, x, y)`.

## Sheet semantics
* **Character sheet** exactly as `CHAR_SHEET`: rows 0-3 = down/left/right/up, cols 0-2 = stand/stepA/stepB (walk
  cycle `[1,0,2,0]`); row 4 = happy, sad, surprised, cheer, sleep (lying, fills the frame); row 5 = seated
  down/left/right/up. Anchor = bottom-centre of the 16x24 frame. 'right' frames are mirrored 'left' frames.
* **Outfit slot**: `school|casual|sport|swim|work|sleep`; a missing slot falls back to `casual`; `'auto'` = `school`
  (for townsfolk their `school` outfit is their work outfit).
* **Season**: summer = short sleeves, no blazer/cardigan/jacket; winter = scarf on uniforms and work outfits,
  coat layer over casual tops; spring/autumn = standard. Swim/sleep outfits keep their shape.
* **Height** (-1/0/1) moves the head and leg length; **build** (`slim|normal|sturdy`) changes torso/leg width;
  `age:'child'` shortens the body. The frame is always 16x24.
* **Portraits**: columns follow `EXPRESSIONS` (neutral, happy, sad, angry, surprised, shy, thinking, smug); row 0
  normal, row 1 eyes closed (blink), row 2 mouth open (talk). Face traits (eye size, brow weight, lashes, half-lids)
  come from a small per-character table in `portrait.js` (`TRAITS`) plus a hash of the appearance for extras, so
  every one of the 29 cast members and every extra has all 8 expressions.
* **Icons**: names/order come from `ICON_NAMES` (lead-owned, `src/data/sheet_layout.js`).

## Internals map
| file | role |
|---|---|
| `color.js` | packed `0xAARRGGBB` colours, `ramp(base)` -> {light, base, shade, dark}, `mix`, HSL |
| `pixelbuffer.js` | `PixelBuffer`: set/over/rect/line/ellipse/ring/poly/outline/blit/flipH/dither/toCanvas |
| `resolve.js` | `who` -> `resolveCharacter()`; `normalizeOutfit()` turns presets / top+bottom into one drawing description, applies season rules |
| `seed.js` | `appearanceFromSeed` |
| `sprite_hair.js` | hair silhouettes as ASCII grids per style/view (front `f` / back `b` layers) |
| `sprite.js` | 16x24 frames: body, outfits, hair, accessories, poses; layers are outlined separately |
| `sheets.js` | assembles the 96x144 character sheet |
| `portrait.js` | 48x48 portraits: hair masks + auto-shading, face, expressions, accessories, shoulders |
| `animals.js` | cat frames and sheet |
| `icons.js` | `DRAW` table: one small function per icon (+ emote bubbles) |
| `title.js` | title backdrops (4 seasons), logo (pixel font), 6 ending backdrops |
| `index.js` | public API, cache, lazy canvas wrapping |

Pipeline for sprites: back-hair layer -> body layer (legs, torso, arms) -> head layer (skin, face, hair front,
accessories); each gets a 1px outline in a darker shade of its own colour, then they are stacked.

## How to add things
* **Hair style**: add the name to `HAIR_STYLES` (lead-owned `appearance.js`), then an entry in `SPRITE_HAIR`
  (`sprite_hair.js`, `down/up/left`, grid rows start at head-local y=-2, cols at x=-2) and an entry in `STYLES`
  (`portrait.js`: `hl(x)` hairline, `sideEnd`, extras such as `back`, `tail`, `bun`).
* **Outfit preset / top / bottom**: handle it in `normalizeOutfit()` (`resolve.js`); the sprite and portrait code only
  consume the normalised fields (`shirt, sleeve, neck, over, apron, tie, scarf, stripe, bottom`).
* **Accessory**: add drawing in `drawFaceAccessories`/`drawHeadAccessories`/torso code (`sprite.js`) and
  `faceAcc`/`headAcc` (`portrait.js`).
* **Icon**: add `name: mk((B) => { ... })` to `DRAW` in `icons.js` (name must be in `ICON_NAMES`).
* **Ending backdrop**: add an entry to `ENDINGS` in `title.js`.

## Run the gallery / tests
```
node scripts/build.mjs --entry src/dev/art_gallery.js --out dist/dev/art_gallery.html
node scripts/shot.mjs dist/dev/art_gallery.html --out /tmp/gallery.png --scale 2
```
Query string: `?view=cast|portraits|icons|extras|title|ending|animals&season=summer&who=nina,elise&slot=casual&scale=4`.
Tests: `node --test test/art/*.test.mjs` (sizes, determinism, every cast member + 100 random seeds, pairwise-distinct
sprites, unique icons, season differences, titles/endings).

## Gotchas
* In Node `result.canvas` is `null`; use `buffer`/`pixels` for tests.
* `appearanceFromSeed` adds the art-only fields `gender`/`age` (ignored by `validateAppearance`).
* Elder / child looks are art-only traits (`age`); named cast ages are derived in `resolve.js`.
