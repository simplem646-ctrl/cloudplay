# AreaDef format (src/world/areas/<id>.js)

An area is **pure data** (no `three` import, importable in Node): one default-exported object. The builder
(`builder.js`) turns it into a scene + `AreaRuntime` (collision grid, anchors, transitions, interactables, lamps...).
Coordinates are tiles: **x east, z south**, origin = north-west corner, 1 tile = 1 unit. Building fronts face south.

Register a new area by importing it in `areas/index.js` (`BUILT = {...}`). Un-built registry areas automatically get an
auto-generated placeholder def so the game stays playable.

## Authoring workflow
1. Copy `areas/brook_lane.js` (exterior) or `areas/cottage.js` (interior) and edit.
2. Check the layout top-down: `.../tools/labs/world-lab.html?area=<id>&overview=1&q=low` (lab only).
3. Look through the game camera: `...?area=<id>&cam=x,z&minutes=660&season=spring&q=medium` and screenshot with
   `node tools/shot.cjs "<url>" /tmp/x.png --ready --strict`. Review night (`minutes=1230&lamps=lit`), winter, rain.
4. `node tools/validate-world.mjs <id>` must pass (anchors, transitions, interactables, lamps, connectivity, bounds).
5. Place scatter entries (trees, bushes, flowers, rocks) **after** buildings/fences in `props`: scatter is expanded in order
   and avoids solids, anchors, transition stands and interactables built before it.

## Top-level fields
```js
export default {
  id: 'brook_lane',            // registry id
  size: [36, 26],              // tiles (must equal registry size)
  kind: 'exterior',            // 'exterior' | 'interior'
  seed: 11,                    // seeds ground painting & grass; changes the look, never gameplay
  camStart: 'cottage_front',   // anchor the camera starts on when no spawn is given
  margin: 4,                   // optional: extra painted tiles outside the map (default 4 ext / 5 int)
  ground:  { base, ops: [...] },
  edges:   [ { id:'to_town_square', side:'e', at:[17.8, 21.6] } ],      // exteriors: map-border exits
  exit:    { id:'to_brook_lane', at: 7 },                                // interiors: door on the open (south) edge
  room:    { wall:'plaster', wallColor:'#f3dfb8', wainscot:'#9a6a42', wallH:3.8, windows:[{at:2.8,w:1.8,h:1.7,curtain:'#c9605a'}] }, // interiors
  anchors: { name:[x, z, facing] },       // facing 'n'|'e'|'s'|'w'
  critters:[ { kind:'sparrow', count:3, bounds:{x,z,w,h} } ],           // hints for Systems (exteriors require it)
  grass:   { density:0.95, avoid:[[x,z,w,h]] } | false,                 // instanced 3D grass tufts (exteriors)
  props:   [ ... ],              // see PROPS.md; each entry { t:'<prop>', x, z, ...params }  or  { scatter:true, ... }
  decor:   { lantern_festival:[...props], spring_picnic:[...props] },   // toggled by world.setDecor(id); non-solid
};
```

### Ground (`ground.ops`, painted in order; later ops cover earlier ones)
Each op: **one shape** + `kind` (+ optional `edge:'soft'|'raised'|'none'`, `fuzz:false`):
| shape | form |
|---|---|
| rect | `rect:[x,z,w,h], r:cornerRadius` |
| poly | `poly:[[x,z],...]` |
| circle / ellipse | `circle:[cx,cz,r]` / `ellipse:[cx,cz,rx,rz]` |
| path | `path:[[x,z],...], w: 2.8 \| [w0,w1,...], wobble:0.08, cap:'round'\|'butt'` (Catmull-Rom smoothed stroke; may start/end outside the map) |
| rug | `{ rug:{ rect:[x,z,w,h], style:'floral'\|'striped'\|'round', colors:[c1,c2,c3] } }` (interior floors) |

Ground kinds: `grass meadow moss forest` (walk: grass) · `dirt gravel` (dirt) · `sand` · `cobble flagstone stone tile` (stone) ·
`planks planks_dark planks_pale deck` (wood) · `water` (blocks walking, animated mesh; options `flow:[dx,dz]`, `deep`, `shallow`, `alpha`) · `carpet`.
`base` is the kind filling everything (default grass / planks). Soft kinds (dirt, sand, gravel) get a halo + grass fuzz;
raised kinds (cobble, flagstone, planks...) get a baked drop shadow. Seasons repaint the ground automatically
(snow cover, autumn leaves, blossoms...). `surfaceAt()` returns the surface of the top-most op (`snow` in winter on grass/dirt).

### edges / exit / doors -> transitions
* `edges`: `{ id:'to_<neighbour>', side:'n'|'e'|'s'|'w', at:[a0,a1] }` creates the rect on the border strip, `stand` on it and
  the arrival anchor `from_<neighbour>` 2.6 tiles inside (facing inward). Registry rule: neighbour `N` => `to_N` + `from_N`.
* Doors: a `house` with `door:{ transition:'to_cottage' }` creates a `kind:'door'` transition on the door mat; the
  arrival anchor `from_cottage` is placed 1.1 tiles south of the mat (override by defining it in `anchors`).
* Interior `exit` creates the mat + rect on the south edge; arrival anchor `from_<neighbour>` is 1.2 tiles inside.
* `world.setDoorOpen('to_cottage', true)` swings the door open.

### Interactables
Any prop entry with an `id` registers an interactable: `{ t:'mailbox', x, z, id:'mailbox', label?, text?, type?, r?, ix?, iz?, facing? }`
(`ix/iz` = interaction point if different from the prop). Defaults per prop (type/label/text/r) live in the prop, and
`type` must be one of `INTERACT_TYPES`. `lamp_post` with `id:'lamp_<code>_<n>'` becomes a lamp (group from `LAMP_GROUPS`);
`marker` is an invisible interactable (use for `fishing_*`, `forage` with no model, `shrine`...); `forage_spot` shows a
seasonal tuft. `fishing` interactables get `water` from `fishingWaterKind`. Every interactable needs a `label`; `object`/`sign`/
`bench`/`bookshelf`/`noticeboard`/`chest`/`mailbox` also a one-line `text` (the validator checks).

### Scatter
`{ scatter:true, t:'tree', n:12, in:{rect|poly|circle|path}, ground:['grass'], minDist:2.8, clear:0.7, avoid:[[x,z,w,h]],
   params:{ kinds:['oak','pine'], scaleRange:[0.9,1.3], ...prop params } , seed }` -> seeded rejection sampling; positions only on
the listed surfaces (`'any'` allowed), never inside solids. `params` may also be a function `(rng, i) => params`.

## Collision
Generated from the def: building footprints, fences, tree trunks, rocks, furniture (`solid`/`solidCircle` called by props), water,
map bounds. `tile:true` solids block every tile they touch in `grid.walk` (a fence on a tile *edge* blocks two rows — put fences on
`n + 0.5` to block one). Bridges (`bridge`, `pier`) clear water cells and set the surface to wood.
`moveCircle(x,z,dx,dz,r=0.3)` sub-steps by 0.12 tile and slides along walls (never tunnels at steps <= 0.5).

## Camera
Fixed (yaw 0, pitch 52, FOV 30); exteriors show ~24x14 tiles, interiors auto-fit the room (floor + wall tops) and lock to it;
exteriors clamp so the view never leaves the map (+1 tile). `setCamera({x,z,zoom})` follows smoothly, `snapCamera` jumps.

## Worked example (condensed brook_lane)
```js
export default {
  id:'brook_lane', size:[36,26], kind:'exterior', seed:11, camStart:'cottage_front',
  ground:{ base:'grass', ops:[
    { kind:'meadow', poly:[[1,1],[13,0.5],[15.5,5],[11,8.8],[2,8]] },
    { kind:'dirt',  path:[[37.5,19.6],[29,20.1],[21,20],[11,20.1],[2.5,19.4]], w:2.8 },
    { kind:'water', path:[[24.5,-1.5],[25.5,9],[25,19.6],[25,27.5]], w:3.2, flow:[0,0.07], cap:'butt' } ] },
  edges:[ { id:'to_town_square', side:'e', at:[17.8,21.6] }, { id:'to_whispering_woods', side:'n', at:[15.4,19.6] } ],
  anchors:{ cottage_front:[9.5,16.9,'s'], willow:[21.4,13,'n'] /* ...all registry anchors */ },
  critters:[ { kind:'sparrow', count:3, bounds:{x:2,z:2,w:30,h:22} } ],
  props:[
    { t:'house', x:9.5, z:15, w:8, d:4.8, h:3.7, wall:'plaster', wallColor:'#f2dcb5', roof:'terracotta', patch:true, ivy:10,
      door:{ at:0, transition:'to_cottage', color:'#3f7a5a', style:'arch' },
      windows:[{ at:-2.7, shutters:'#6fa48a', box:true }, { at:2.7, shutters:'#6fa48a', box:'#a8643a' }], chimney:{ at:2.6, smoke:true } },
    { t:'fence', kind:'picket', pts:[[8,18.5],[4.5,18.5],[4.5,10.5]] },
    { t:'mailbox', x:11.9, z:17.3, id:'mailbox', ix:10.9, iz:17.9 },
    { t:'lamp_post', x:33.6, z:17.9, id:'lamp_bl_1' },
    { t:'bridge', kind:'wood', x:25, z:19.7, len:6.4, w:2.4, dir:'x' },
    { t:'tree', kind:'willow', x:21.4, z:10.8, scale:1.15 },
    { t:'marker', id:'fishing_bl_1', type:'fishing', x:22.4, z:15.9, r:1.4 },
    { scatter:true, t:'tree', n:11, in:{ rect:[0,0,36,3.4] }, minDist:2.8, params:{ kinds:['pine','oak','birch'], scaleRange:[0.95,1.3] } },
  ],
};
```

## Interiors
`kind:'interior'`: the builder adds the cut-away shell (back + side walls, wainscot, baseboards, windows with curtains and a
daylight shaft, floor-slab lip, exit mat). Floor = `ground.base` (planks...) + rugs. The room spans x 0..w, z 0..d; back wall at z=0.
Furniture props take floor positions (`dir` = facing). Keep >= 1 walkable tile around the furniture; the validator checks
that all anchors/stands are reachable from the entrance.

## Quality & lab
`?q=low|medium|high` (low: no shadow maps / post, fewer particles). Lab params: `area minutes season(0-3|name) weather(sunny|cloudy|rain|storm|snow)
q cam=x,z zoom lamps=lit|unlit|broken decor=<id> overview=1 open=1 hl=<interactableId> fx=<effect> anim=<ms>`; exposes `window.__world`.
