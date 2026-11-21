# World API (T3): tileset, MapBuilder, loader, previewer

Code: `src/world/{tiles,tileset,builder,stamps,spec,index,render}.js`, painters `paint_*.js`, maps `src/world/maps/<id>.js`.
Pure modules (`tiles, builder, stamps, spec, render, maps/*`) import in Node; only `getTileset()` touches `document`.

## Loader API (for the overworld, T9a) — `src/world/index.js`
```js
import { getMap, loadMap, getMapDef, listMaps, getAnchor, getInteractable, warpsAt, isBlocked, getTileset, MAP_IDS } from '../world/index.js';
getMap('town_square')            // MapDef (cached). loadMap / getMapDef are aliases. Throws a clear error if the file is missing.
listMaps()                       // ids that have a file (MAP_IDS order)
getAnchor('home_theo:bed')       // { map, name, x, y, dir }  (tile coords)
getInteractable('home_theo__bed')// full id lookup;  warpsAt(map, tx, ty) -> warps under a tile;  isBlocked(def, tx, ty)
getTileset('autumn')             // { canvas, cols, rows, tileSize:16, season, names:{name:idx}, meta:[{name,solid?,sound?,water?,anim?,layer?,door?,bridge?,hidden?}] }
```
MapDef = `{ id, name, width, height, indoor, layers:{ground,deco,above: Uint16Array}, collision: Uint8Array (1=blocked),
warps:[{x,y,w,h,to:'map:anchor',sfx?,requires?,lockedText?}], anchors:{name:{x,y,dir}}, interactables:[{id,x,y,w,h,label,action}], ambient }`
(contract: 01 §4). Registry: maps are found through `src/_generated/registry.js` (`npm run gen`; `npm test`/`npm run build` run it).
Rendering notes: draw ground, deco, actors, above. Animated tile `i`: `meta[i].anim = {frames:[idx..], fps}`. Collision is already
derived (solid tiles in ground/deco, water, plus builder block/clear). Door tiles (`meta.door`) are walkable; the warp sits on them.
Indoor tiles are pixel-identical in every season. `meta.sound` = footstep type. Interactable ids are `${mapId}__${name}`.

## Adding a map (T4 workers)
1. Create `src/world/maps/<map_id>.js` (id from `MAP_IDS`; size, anchors, interactables per `04_WORLD_SPEC.md`, machine-readable in `src/world/spec.js`).
2. `export default function build() { const b = new MapBuilder('id', { name:'Banner', ambient:{...} }); ...; return b.build(); }`
3. `build()` validates and THROWS with every problem listed (size, mandatory anchors, `from_<neighbour>` anchors + warps, anchor/warp tiles walkable,
   no warp on solid tile, flood-fill reachability from `entrance`, interactables usable, action shapes vs `ids.js`, warp `requires` via script_dsl).
4. `npm test` (maps.test.mjs validates every file; cross-map warp targets are checked for maps that exist, strict once all 26 exist).
5. Look at it: `node test/world/dump_maps.mjs /tmp/out <map_id> [--overlay] [--scale=2] [--seasons=spring,winter]` (PNG per map+season, no browser) or
   `node scripts/build.mjs --entry src/dev/world_preview.js --out dist/dev/world_preview.html` then open
   `world_preview.html?map=town_square&season=autumn&overlay=1&scale=3` (`crop=x,y,w,h`, `anim=0`; `?sheet=winter&labels=1` shows the atlas).
   Reference maps to copy from: `home_theo.js` (indoor), `school_classroom.js` (desk grid, seats), `town_square.js` (outdoor).

## MapBuilder cheat-sheet (`import { MapBuilder } from '../builder.js'`)
`new MapBuilder(id, { name, ambient:{music,lighting,weather,ambience}, base?:'grass'|null })` — width/height/indoor default from doc 04; outdoor starts filled with grass.
| call | what |
|---|---|
| `fill(t)` `rect(t,x,y,w,h)` `line(t,x1,y1,x2,y2,thick)` `path(t,[[x,y],..],thick)` `blob(t,cx,cy,rx,ry,{seed,roughness})` | paint a terrain (autotiled at `build()`; later paint wins) |
| `gap(x,y,w,h)` | remove hedge/fence cells (leave a gate) |
| `put(tile,x,y,layer?)` `putRows(x,y,[[..],..])` `tiles(nameOrList,x,y,w,h)` `erase(x,y,w,h,layers?)` | raw tiles; layer defaults to the tile's own (`meta.layer`) |
| `block(x,y,w,h)` `clear(x,y,w,h)` | force collision on/off |
| `stamp(name,x,y,...args)` (`furnish` = alias) | prefab, returns info (see below). `defineStamp(name, fn(b,x,y,...))` for local prefabs |
| `scatter([tiles],{rect,count,seed,onlyOn:['grass'],gap})` | seeded random decoration on free cells |
| `anchor(name,x,y,dir)` `setAnchors({name:[x,y,dir]})` | dir: down/left/right/up. Must be walkable + reachable |
| `warp(x,y,w,h,'map:anchor',{sfx,requires,lockedText})` | step-on travel; indoors/doors use `sfx:'door_open'`; `requires` is a script_dsl Cond |
| `interact(name,x,y,w,h,label,action)` | id `mapId__name`; action: `{type:'sleep'}` `save` `{type:'study',place}` `{type:'shop',shop}` `{type:'text',lines:[..]}` `{type:'board',id}` `activity`/`job`/`collect`/`rest`/`calendar`/`door_locked`/`event` |
| `build({validate:true})` | resolve autotiles + collision, validate, return MapDef |
Terrains (`rect('name',..)`): `grass grass_dark grass_lush dirt gravel plaza(cream pavers) brick(red pavers) slate flagstone boards_h boards_v sand_flat snowfield`
and AUTOTILED (4-neighbour masks, map edge counts as same): `path`(dirt) `stone` `cobble` `sand` `snow` `water`(pond; shore auto: grass/sand/quay) `sea`(deep in the middle)
and on the deco layer: `hedge hedge_bloom fence picket railing lowwall`. Surfaces (path/stone/cobble/plaza/brick/sand...) join each other seamlessly.

### Stamps (x,y = top-left unless noted) — all return coordinates you can reuse for anchors/warps
- Buildings (facades face south, 3 roof rows + 2 wall rows, roof footprint auto-blocked): `house(x,y,{w,roof,wall,door,doorX,doorW,windows,chimney,plaque})`,
  `shopfront(x,y,{w,roof,wall,door:'glass',awning,icon})`, `town_hall(x,y,{w:12})`, `school_building(x,y,{w:18})` -> `{door:{x,y,w},front:{x,y},w,h}`; the door tile is `door.y`
  (put the warp there, 1 wide / `doorW`), `front` is the walkable tile in front of it (anchor/`from_` spot).
  roof: red blue green slate brown orange purple teal; wall: cream pink blue yellow brick stone wood white green timber; door: wood red blue green yellow white glass grand; awning: red green blue yellow orange purple; icon: bread flower book mart clinic cafe hall fish bell school.
- Nature: `tree(x,y,{kind:'round'|'cherry'|'pine'|'palm'})` (x,y = TRUNK; canopy overlays the rows above), `flowerbed(x,y,w,h,{kinds,seed,density,border})`,
  `fence_line(x1,y1,x2,y2,{kind})`, `cliff_wall(x,y,w,{ivy})`, `stairs(x,y,w,h,{kind:'stone'|'wood'|'marble'})` (cliff walls are solid: `erase` a gap, then `stairs`).
- Street: `bench(x,y)` (2w) `lamp(x,y)` (base tile; head on `above`) `fountain(x,y)` (5x5) `clock_post(x,y)` `planter` `notice_board` (2w) `vending(x,y,{color})` (bottom tile) `bus_stop` `bike_rack` `mailbox`; tiles `trash_can signpost`.
- Indoor: `room(x,y,w,h,{wall,floor,floor2})` (walls: top 2 rows hi+face, 1-tile caps on the other sides; interior = x+1..x+w-2, y+2..y+h-2), `window_in(x,y,{kind:'harbor'|'plain'|'curtain'|'school'})`,
  `door_in(x,0,{kind})` (walkable door tile (x,1), front (x,2)), `bed`, `desk(x,y,{w,items:{col:'diary'|'lamp'|'books'|'papers'|'plant'|'globe'|'bell'}})`, `table`, `counter`, `sofa`,
  `rug(x,y,w,h,{color})` (ground layer), `chair(x,y,{dir,color})` (walkable), `bookcase_row(x,1,n)`, `tall(x,1,'wardrobe'|'fridge'|'plant_tall')`, `locker_row`, `blackboard(x,y,w)`,
  `desk_grid(x,y,cols,rows,{pitchY})` -> `{seats:[{x,y}]}` (seat = chair tile). Tall furniture: upper tile on the wall-face row (y=1), lower on the first floor row (y=2).
  wall: cream school wood blue pink brick stone; floor: wood wood_dark wood_light gym tile_white school tile_kitchen tile_checker carpet_* stone.

## Tile catalog (1000+ tiles, names stable; `meta.hidden` = animation frames only)
Use `put('name',x,y)`; every name below is a literal tile name pattern. Full list: `Object.keys(NAME_TO_INDEX)` or the previewer sheet.
`grass_a-d dirt_a-c sand_a-c paver_a/b paver_red_* paver_slate_* flagstone_* plank_h_*` · autotiles `path_dirt_0..15 path_stone_* cobble_* sand_* snow_* water_{g,s,q}_0..15 sea_deep hedge_* hedge_bloom_* fence_wood_* fence_picket_* rail_iron_* lowwall_*` ·
nature `flowers_{red,yellow,pink,white,blue,purple,orange,mixed_a-c}` (animated) `tallgrass_a/b tuft_a clover_a weeds_a/b mushrooms_a/b fern_a reeds_a lilypad_a bush_{round,berry,blossom,small} trunk_* sapling_a stump_a/b log_h rock_a-d pebbles_a/b stepping_stone driftwood_a-c shell_* tidepool tree_{round,cherry,pine,palm}_<c>_<r>` ·
buildings `roof_<color>_{tl,t,tr,ml,m,mr,bl,b,br,chim} chimney_brick_top wall_<style>[_eave|_base] win_<style>[_shut|_box|_lit] door_<color>_{hi,lo} awning_<color>_{l,m,r} plaque_<icon> stairs_<kind>_{m,l,r,lr} bridge_{h,v,rt,rb,vl,vr} cliff_{a,l,r,ivy}` ·
street `lamp_{head,mid,base} bench_{l,r} fountain_<c>_<r> clockpost_* noticeboard_* vending_{blue,red}_{hi,lo} busstop_* bikerack_* planter_* mailbox_*` ·
indoor `floor_<kind>_{a,b} iwall_<style>_{hi,face,cap,cap_s,cap_l,cap_r} iwin_<kind>_{hi,face} idoor_<kind>_{hi,lo} bed_<color>_{head,foot} desk_{l,m,r} desk_m_<item> chair_{wood,red}_{d,u,l,r} table_[cloth_]{l,m,r,o} counter_{wood,marble}_{l,m,r} bookcase_{brown,white}_{hi,lo} wardrobe_* fridge_* stove sink sofa_<c>_{l,m,r} tv_stand plant_* blackboard_* schooldesk_{a,b} locker_<c>_{hi,lo} rug_<c>_{tl,t,tr,l,c,r,bl,b,br} frame_* wall_{clock,calendar,shelf,notice,poster}`.
Layers: roofs, awnings, plaques, lamp heads, canopies and wall overlays (`frame_*`, `wall_*`) live on `above`; furniture/walls on `deco`; floors/rugs/paths on `ground`.

## Gotchas
- Everything faces south: shop fronts need free ground south of them. Keep `front` tiles clear (planters beside, never on it).
- Overlays on `above` over a solid wall tile are fine; an `interact` rect on a wall needs a walkable tile next to it.
- Autotiles are resolved at `build()`: use terrains for paths/water/hedges, `put()` is for single tiles. `put` on ground/deco cancels terrain painting in that cell.
- `from_<neighbour>` anchors must exist even if the neighbour map is not written yet; warps to unwritten maps are fine until all 26 exist.
- Anchors/warps are validated against collision: stand-spots must be on walkable tiles (chairs and rugs are walkable; benches, counters, trees are not).
- Spec sizes are enforced; seeds make `scatter`/terrain variants deterministic, so a rebuilt map is identical.
