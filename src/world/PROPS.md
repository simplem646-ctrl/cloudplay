# Prop catalogue (src/world/props/*.js)

Every prop is `{ t:'<name>', x, z, ...params }` in an AreaDef's `props` (or `decor.<id>`). `x,z` are tile coordinates of the
prop's anchor point (stated per prop). All props: merged into few meshes, bake a soft contact shadow into the ground, register
collision, and are season aware (leaves/flowers/snow caps switch automatically). `id` (+`label`,`text`,`type`,`r`,`ix`,`iz`,
`facing`) turns any prop into an interactable (see AREAS.md). Colours are CSS hex strings.

## Buildings (houses.js)
**`house`** — x,z = centre of the FRONT (south) wall at ground level; it extends north by `d`.
`w=8 d=6 h=3.4` (wall height) · `wall: plaster|brick|stone|wood|timber` · `wallColor` (tint for plaster) · `trim='#fff4de'` · `baseColor` (stone plinth) ·
`roof: terracotta|red|blue|green|slate|brown|plum|thatch` · `roofColor` · `rise` (roof height) · `overhang=0.6` · `floors:2` (belt course) ·
`door:{ at, w=1.5, h=2.2, color, style:'arch'|'plain', transition:'to_x', to, spawn, anchor, step, mat, matColor, lantern, window }` (`at` = x offset from centre; `false` = no door) ·
`windows:[{ at, y=1.35, w=1.1, h=1.25, wall:'s'|'e'|'w', shutters:'#hex'|true, box:true|'#hex' (flower box), flowers:[...] }]` or a number (auto spaced) ·
`awning:{ at, w, y, d, colors:[a,b] }` · `sign:{ text, at, y, w, h, bg, fg, style:'hang'|'plaque' }` (hanging signs sway) ·
`chimney:{ at, smoke, rate }` (`false` = none) · `patch:true|[[xOff,u]]` (patched roof) · `dormers:[{at,w}]` · `ivy:true|n` · `flag:{at,color}` ·
`steps:{ w, n, at }` (wide front steps) · `beams:true` (forced half-timber). Windows glow at night; doors animate with `setDoorOpen`.
**`lighthouse`** — x,z base centre; `h=9 r=1.8 stripe`. **`clocktower`** — x,z centre; `h=6.2 w=1.9 roofColor`; hands follow game time (`setEnvironment.minutes`).

## Nature (trees.js)
**`tree`** — x,z = trunk; `kind: oak|willow|pine|cherry|birch` (default oak), `scale=1`, `seed`. Leaves are wind-swayed; autumn recolours, winter hides
deciduous leaves (bare twigs + snow caps on pines); cherry is pink in spring. Heights ~4-6.
**`bush`** — `kind: round|berry|flower|hedge`, `scale`, hedge: `w`. **`flowers`** — patch: `rx,rz` (or `r`), `n`, `colors`, `h`, `bed:true` (soil bed).
**`sunflowers`** — `n r` (summer only). **`rock`** `scale color`. **`stump`**. **`reeds`** `n r`. **`mushrooms`** `n`.
**`forage_spot`** — needs `id:'forage_<code>_<n>'`; seasonal berries/herbs/mushrooms tuft.

## Street furniture (street.js)
**`lamp_post`** — x,z; `id:'lamp_<code>_<n>'` makes it the lamp interactable (states via `world.setLampStates`, default `unlit`; `lit` = halo + ground glow at night). Without `id` it is a decorative always-lit lamp. `h=3.2`.
**`bench`** — `dir:'s'|'n'|'e'|'w'` (way the seat faces), `w=1.9`, `id` -> bench interactable (point in front of the seat).
**`fence`** — `kind: picket|rail|stone`, `pts:[[x,z],...]`, `gaps:[[arcStart,arcEnd]]` (arc length along the polyline), `color`, `h`. Axis-aligned segments get exact colliders; put them on `n+0.5` to block one tile row.
**`signpost`** — `board` (text drawn on the sign), `id` -> sign, `text` (examine line). **`mailbox`** `color id`. **`noticeboard`** `w id`.
**`crates`** `n`. **`barrel`** `scale`. **`sack`**. **`well`**. **`woodpile`** `w`. **`lamp_parts`** (workshop clutter). **`planter`** `w colors`.
**`market_stall`** — x,z centre; `w=3 goods:fruit|flowers|bread colors:[a,b]`. **`cafe_table`** — `chairs=2 parasol colors`.
**`bridge`** — x,z centre; `kind:wood|stone`, `len`, `w=2.4`, `dir:'x'|'z'` (span direction); clears water + wood surface + rail colliders.
**`pier`** — x,z start; `len w dir`. **`boat`** `rot color`. **`fountain`** — `r=2.6`, `column` (central spout; false when a tower stands inside), animated water + spray, `id`.
**`stage`** — x,z front centre; `w=7 d=3.4`. **`marker`** — invisible interactable (`id type label text r`).
**`bunting`** — `pts, y=3.2, sag, colors, poles`. **`lantern_string`** — glowing paper lanterns (festival): `pts, y, sag, colors, poles`.
**`picnic`** — gingham blanket + basket: `w d color rot`. **`laundry`** — `pts:[[x,z],[x,z]] y`.

## Interior (interior.js) — floor coordinates; `dir` = facing
Shell is automatic (`room` in the def). **`bed`** (x,z = head end; extends south for `dir:'s'`; `w color id`) · **`table`** (`w d round cloth`) ·
**`chair`** · **`stool`** · **`bookshelf`** (x,z = front centre against a wall; `w h id`) · **`shelf`** (wall shelf: `x y w`) · **`stove`** · **`counter`** (`w`) ·
**`desk`** · **`chest`** · **`cupboard`** (`w h color`) · **`plant`** (`scale kind:'fern'|'flower'`) · **`lamp_table`** (`y` table height, or `floor:true`) ·
**`rug`** (`rect style colors`, painted into the floor) · **`window_seat`** · **`fireplace`** · **`clock_wall`** · **`calendar`** · **`painting`** · **`hanging_herbs`** · **`rack`**.
Furniture with an `id` becomes an interactable of its natural type (`bed`, `bookshelf`, `chest`, `diary` (desk), `object`...).

## Adding a prop
Create `{ doc, build(ctx, p) }` in a file under `props/` and export it from `props/index.js`'s modules. Use `ctx.mb.box/cyl/cone/ball/tri/plane`
(materials: plaster brick stone plankwall shingle thatch slate wood wooddark trim flat metal cloth snow glass glow leaf_leaf|blossom|birch|willow|pine bark birchbark),
`ctx.mbFor('winter'|'notwinter'|'spring,summer')` for seasonal geometry, `ctx.solid/solidCircle`, `ctx.bake({type:'rect'|'ellipse',...})` for contact shadows,
`ctx.object(obj3d)` + `ctx.updater((dt,t,env)=>...)` for animated parts, `ctx.interactable(p, defaults)`, `ctx.smoke(x,y,z)`, `ctx.transition(...)`.
