# Lanternbrook Days — Architecture & Contracts

Frontend‑only, **Three.js** (npm `three`), vanilla ES modules, no framework, no runtime asset files
(everything — textures, models, portraits, icons, music, SFX — is generated in code). Content text and tuning
live in plain JS data modules. Saves go to `localStorage`.

Read `DESIGN.md` for names/rules/cast/story. **This file is the contract between workstreams. Do not rename or
re‑shape anything here; if something is impossible, do the closest thing and flag it in your report.**

---

## 0. Workstreams, ownership, waves

| WS | Domain | Owns (create/edit freely) |
|---|---|---|
| **F0** | Foundation scaffold (wave 0, shared) | `package.json`, `package-lock.json`, `index.html`, `src/main.js`, `src/core/**`, `tools/{build.mjs,serve.mjs,shot.cjs,check-contract.mjs,run-validators.mjs}`, `tools/labs/_template.html`, stubs of `src/{world,characters,ui,systems,data}/index.js`, `tests/unit/core.test.mjs` |
| **WS1 World & Rendering** | Three.js scene, fixed camera, painterly environments, areas, lighting, weather, seasons, FX, collision | `src/world/**`, `tools/labs/world-*.html`, `tools/validate-world.mjs`, `tests/unit/world-*.test.mjs` |
| **WS2 Characters & Portraits** | 3D chibi rigs, animation, critters, 2D anime bust portraits | `src/characters/**`, `src/portraits/**`, `tools/labs/{characters,portraits}-lab.html` |
| **WS3 Interface & Sound** | DOM UI, HUD, dialogue, menus, shops, mini‑game overlays, icons, touch controls, WebAudio music/SFX | `src/ui/**`, `src/audio/**`, `tools/labs/{ui,audio}-lab.html` |
| **WS4 Game Systems** | simulation: time, weather, inventory, shops, relationships, quests, script interpreter, events, save flow, player, NPC schedules/pathfinding, activities, jobs | `src/systems/**`, `tests/unit/sys-*.test.mjs` |
| **WS5 Story & Content** | all content data (cast, items, schedules, quests, dialogue, events, festivals, mail, books) + validator | `src/data/**`, `tools/validate-content.mjs` |
| Lead | docs, integration, `src/main.js` wiring after wave 0 | `docs/**` |

Workers **never edit files outside what they own** (report needed changes instead). Workers never commit/push.

## 1. Conventions

- ES2022 modules, 2‑space indent, semicolons, single quotes, JSDoc for public functions. No TypeScript, no extra runtime deps (only `three`). Dev deps: `esbuild`.
- **Modules must be importable in Node with no DOM/WebGL**: touch `window/document/canvas` only inside functions, never at import time (needed for `node --test`, `check-contract`, validators).
- Modules talk to each other **only through `Game.*` slots and the event bus** (never `import` another workstream's module): `Game.world`, `Game.chars`, `Game.portraits`, `Game.ui`, `Game.audio`, `Game.systems`, `Game.data`. Shared pure helpers come from `src/core/{util,registry,events}.js` (importable by anyone).
- **Pure‑data files** (`src/world/areas/*.js`, `src/data/**`) must not import `three`.
- Randomness for **gameplay** is seeded (`core/util.js: rngFor(...)`) so reloads don't change outcomes; visuals may use `Math.random`.
- Coordinates: **1 unit = 1 tile**. `x` east, `z` south (toward the camera), `y` up. Area origin = north‑west corner. Facings `'n'|'e'|'s'|'w'`. Yaw 0 = facing south (+z, toward camera), +π/2 = east, π = north, −π/2 = west.
- Time: game minutes since midnight; a day runs 360 → 1560 (06:00 → 26:00). `"HH:MM"` strings may exceed 24 (e.g. `"25:00"`). Season index 0–3, day 1–28, weekday derived (`day−1) % 7` → mon..sun, every season starts Monday).
- Quality tiers: `'low' | 'medium' | 'high'` (URL `?q=low`; default medium). `low` = pixel ratio 1, no shadow maps (blob shadows only), no post‑processing, reduced particles — used by headless tests (SwiftShader is slow).
- No `fetch`/XHR of local files at runtime and no external assets — the production build is **one self‑contained HTML file**. CSS lives in JS template strings (`src/ui/styles.js`).
- Only `window.LB` (debug API, §3.6) and `Game` (module scope) are global. Test hook: **`window.__ready = true`** once the first frame is rendered (labs and the game).
- Keyboard focus: canvas/page must `preventDefault` arrow keys/space; call `Game.audio.unlock()` on the first pointer/key gesture.

## 2. Tooling (F0 builds all of this)

```
npm install                  # three + esbuild (worktrees: run `npm ci` first)
npm run serve -- --port N    # static server for the repo root, binds 0.0.0.0, prints URLs. Dev game = http://127.0.0.1:N/index.html (unbundled ES modules via import map)
npm run build                # esbuild → dist/index.html (single file: bundle inlined, minified)   ·  npm run build:dev (no minify, sourcemap inline)
npm test                     # node --test tests/unit/  +  contract check  +  validators (if present)
npm run contract             # tools/check-contract.mjs: every module exposes the API_SURFACE names (dotted paths allowed)
node tools/shot.cjs <url> <out.png> [--w 1280] [--h 720] [--wait 800] [--ready] [--eval "js"] [--evalfile f.js] [--keys "ArrowRight:600,Space"] [--strict]
                             # host headless Chromium (WebGL via SwiftShader), prints console errors/page errors; --ready waits for window.__ready; --eval runs in page (promises awaited) before the screenshot
node tools/shot.cjs --script flow.cjs   # exports async (page, helpers) => {...} for multi‑step flows (helpers.shot(name), helpers.sleep(ms), helpers.eval(js))
```
- **Labs**: `tools/labs/<name>.html` import `/src/...` via the import map (`three` → `/node_modules/three/build/three.module.js`, `three/addons/` → `/node_modules/three/examples/jsm/`). They read query params, build their own canvas/DOM, set `window.__ready`.
- Host Playwright is global (`require('playwright')` from `.cjs`; Chromium needs no flags, WebGL2 works). `playwright-cli` (containerised browser) is reserved for the **lead's** final inspection (reach the dev server at `http://172.17.0.1:<port>`); workers use `tools/shot.cjs`.
- **Look at your screenshots** (the `Read` tool shows PNGs). A visual module is not done until you have inspected it and fixed what looks wrong.
- Ports: each task gets its own port range in its brief; never use 3663 (Firecrawl) or 9222 (CDP).

## 3. Core (F0) — `src/core/`

### 3.1 Files
`bus.js` (EventBus) · `events.js` (`EVT` name constants) · `game.js` (`Game` singleton) · `state.js` (default state, saves, settings) · `input.js` · `loop.js` · `util.js` · `constants.js` · `registry.js` (§4) · `nulls.js` (`nullAudio`, `nullPortraits` no‑op adapters with the full API) · `debug.js` · `../main.js` (boot).

### 3.2 `Game` (module `core/game.js`)
```js
export const Game = {
  bus, input,                       // EventBus, Input
  state: null,                      // GameState (§3.3) — null until a game starts
  settings: {},                     // persisted separately: { master, music, sfx, ambience, textSpeed:'slow'|'normal'|'fast', timeScale:'slow'|'normal'|'fast', quality, showHints, touchControls:'auto'|'on'|'off' }
  mode: 'boot',                     // 'boot'|'title'|'field'|'dialogue'|'menu'|'shop'|'cutscene'|'minigame'|'transition'|'sleep'
  data: null, world: null, chars: null, portraits: nullPortraits, ui: null, audio: nullAudio, systems: null,   // module slots, filled by main.js
  setMode(m), isMode(...modes), now(),                                                                          // emits EVT.MODE_CHANGE {from,to}
};
```
**Only `mode === 'field'` advances the clock and accepts player movement.** All modals set the mode and restore `'field'` when done.

### 3.3 `GameState` (serialisable root; version 1) — created by `core/state.js: defaultState({name,look})`
```js
{
  version: 1,
  meta:   { name:'Kai', look:{ hair:'#4b3425', jacket:'#3b5b9c', scarf:'#e8833a' }, created:ISO, saved:ISO, playSeconds:0, slot:1 },
  time:   { year:1, season:0, day:1, minutes:360 },                 // season 0..3, day 1..28, minutes 360..1560
  weather:{ today:'sunny', tomorrow:'sunny' },
  player: { area:'brook_lane', x:0, z:0, facing:'s', energy:100, maxEnergy:100, money:300 },
  inventory:{ capacity:24, slots:[ /* {id,qty} | null, length = capacity */ ] },
  storage:  { capacity:48, slots:[] },
  rel:    { /* [npcId]: { aff:0, met:false, talkedDay:-1, giftDay:-1, giftWeek:-1, giftsThisWeek:0, status:'none'|'dating', seen:{} } — every id in NPC_IDS present */ },
  quests: { active:{ /* [id]:{ stage:0, progress:{}, since:dayNum } */ }, done:{ /* [id]:dayNum */ }, board:{ day:-1, offered:[], accepted:[] } },
  flags:  {},                                                       // string → any (story/event flags)
  story:  { lanterns:0 },                                           // 0..6
  world:  { lamps:{ /* lampId: dayNum it was lit (lit tonight if === today) */ }, forage:{ /* areaId:{ day, spots:{ [spotId]: itemId|null } } */ }, mailRead:{}, mailQueue:[], eventsSeen:{} },
  jobs:   { doneDay:{ /* jobId: dayNum */ }, stats:{} },
  log:    { fish:{ /* fishId:{ count, maxSize } */ }, forage:{ /* itemId:count */ }, books:{ /* bookId:true */ }, gifts:{ /* npcId:{ itemId:count } */ } },
  stats:  { earned:0, spent:0, daysPlayed:1, fishCaught:0, forageCount:0, steps:0 },
  tutorial:{ seen:{} },
}
```
`dayNum = (year−1)*112 + season*28 + day` (Spring 1 Y1 = 1). Modules may add keys **inside their own sub‑objects** (e.g. `jobs.stats.*`) but never rename/remove the above.

### 3.4 `core/state.js` exports
`SAVE_VERSION`, `defaultState(opts)`, `dayNumber(time)`, `saveSlots() → [{slot, empty, meta?:{name, dateLabel, playSeconds, money, lanterns}}]` (slot 0 = autosave, 1–3 manual), `saveToSlot(slot,state) → {ok,error?}`, `loadFromSlot(slot) → state|null` (runs migrations), `deleteSlot(slot)`, `loadSettings()`, `saveSettings(s)`, `exportSave(slot) → string`, `importSave(slot,text) → {ok,error?}`, `storageOK` (false → in‑memory fallback; localStorage access is always `try/catch`ed and may throw/come back empty). Keys: `lanternbrook.v1.save.<slot>`, `lanternbrook.v1.settings`.

### 3.5 `core/input.js` (logical actions)
Actions: `up down left right confirm cancel menu run tab_prev tab_next inventory journal map`.
Keys: arrows/WASD → move+UI nav; confirm = Space/Enter/Z/F; cancel = X/Backspace/Esc*; menu = Esc/Tab/M*; run = Shift; tab_prev = Q/`[`; tab_next = E/`]`; inventory = I; journal = J; map = M. (*Esc/M resolve contextually: in field → `menu`/`map`; in UI → `cancel`.) Gamepad: stick/d‑pad, A confirm, B cancel, Start menu, LB/RB tabs, X run.
```js
Input.init(targetEl); Input.axis() → {x,y} (−1..1, x east, y south, normalised diagonals); Input.held(action); Input.pressed(action) /* edge, valid for one frame */;
Input.onPress(fn) → unsubscribe   // fn(action) per logical press, with key‑repeat (~180ms, after 350ms) for directions; return true to consume
Input.endFrame();                 // main loop calls after update
Input.setVirtual(action, down); Input.setVirtualAxis(x,y);     // touch overlay / tests / debug
Input.lock(on); // while locked: pressed()/held() return false, onPress is silent
```

### 3.6 Debug API `window.LB` (core/debug.js; modules extend it)
`LB.game`, `LB.state()`, `LB.mode()`, `LB.register(name, fn)` (modules add commands), `LB.help()`. Systems must register at least: `goto(area, anchor)`, `time(h,m)`, `date(season,day)`, `weather(w)`, `give(itemId,qty)`, `money(n)`, `hearts(npc,n)`, `flag(name,value)`, `run(scriptIdOrSteps)`, `newGame(name)` (skip title), `skipFades(bool)`, `hud(bool)`, `quests()`, `where(npc)`. World registers `cam(x,z)`, `stats()`. Tests drive the game through these.

### 3.7 Bus events (`core/events.js: EVT`)
`mode:change {from,to}` · `game:new` · `game:loaded {slot}` · `game:saved {slot}` · `time:tick {minutes}` (each game minute) · `time:hour {hour}` · `time:newday {dayNum}` · `time:season {season}` · `weather:change {weather}` · `area:exit {area}` · `area:enter {area, from}` · `interact:target {kind:'npc'|'transition'|'object', id, label}|null` · `npc:talk {id}` · `dialogue:start {id}` · `dialogue:end {id}` · `item:gain {id,qty}` · `item:lose {id,qty}` · `inventory:changed` · `money:change {delta,total}` · `energy:change {value}` · `affection:change {npc,delta,total,hearts}` · `quest:start|advance|complete {id}` · `story:lantern {count}` · `fish:caught {id,size,perfect}` · `forage:picked {id,spot}` · `job:done {id,score,pay}` · `shop:open|close {id}` · `sleep:start|end` · `event:start|end {id}` · `ui:toast` (UI listens; payload {text,icon,kind}) · `flag:set {name,value}`.
UI → Systems **intent events**: `ui:useItem {slot}` · `ui:buy {shopId,itemId,qty}` · `ui:sell {slot,qty}` · `ui:save {slot}` · `ui:load {slot}` · `ui:newgame {name,look}` · `ui:setting {key,value}` · `ui:trackQuest {id}` · `ui:resumeDay` · `ui:quit`.

## 4. Registry — `src/core/registry.js` (copy VERBATIM; pure data, no imports)

```js
export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const WEATHERS = ['sunny', 'cloudy', 'rain', 'storm', 'snow'];
export const FACINGS = ['n', 'e', 's', 'w'];
export const DAY_START = 360, DAY_END = 1560, DAYS_PER_SEASON = 28, DAYS_PER_YEAR = 112;

export const NPC_IDS = ['mira','willa','juno','rhea','celeste','odell','theo','nana_fen','gus','rosalind','barnaby','elias','pip','lottie','ferris','bramwell','sable','hattie','henrik'];
export const PORTRAIT_IDS = ['mira','willa','juno','rhea','celeste','odell','theo','nana_fen','gus'];
export const ROMANCE_IDS = ['mira','willa','juno','rhea','celeste'];
export const KID_IDS = ['pip','lottie'];
export const ELDER_IDS = ['nana_fen','gus','ferris','bramwell','odell'];

export const EXPRESSIONS = ['neutral','happy','sad','angry','surprised','shy','thinking','laugh','worried','smug'];
export const ANIMATIONS = ['idle','walk','run','talk','nod','shake_head','wave','happy_hop','cheer','sad','surprised','angry','shy','think','laugh','bow','sit','sleep','pickup','show_item','carry_idle','carry_walk','fish_cast','fish_wait','fish_bite','fish_reel','fish_catch','knead','sweep','light_lamp','dance','eat','drink','read','stargaze','point','shrug','stretch','yawn','hammer','serve','write','sit_read','fall','spin'];
export const EMOTES = ['heart','music','sweat','anger','question','exclaim','zzz','sparkle','sad','idea'];
export const HELD_PROPS = ['rod','basket','parcel','bread','flower','book','lantern','broom','mug','net','bag','tray','telescope','paper','fish','umbrella'];
export const CRITTERS = ['cat','dog','sparrow','gull','duck','butterfly','crab','rabbit'];
export const VOICES = ['soft','bright','deep','gruff','kid','elder','brisk','dreamy','narrator'];

export const ITEM_CATEGORIES = ['food','fish','forage','gift','material','book','tool','key','misc'];
export const ITEM_TAGS = ['sweet','baked','savory','seafood','fish','flower','herb','mushroom','berry','fruit','book','tea','coffee','cocoa','gem','star','shell','lantern','craft','drink','egg','cheese','trinket','tool','junk','honey'];
export const ICON_SHAPES = ['fish_small','fish_long','fish_round','fish_flat','eel','crab_item','shrimp','shell_spiral','shell_fan','starfish','mushroom','berry','herb','leaf','flower','flower_bunch','acorn','pinecone','nut','honey_jar','bread_loaf','bread_roll','croissant','cake_slice','cookie','pie','sandwich','soup_bowl','mug','teapot','cup_cocoa','fruit_apple','fruit_orange','egg','cheese','book','scroll','letter','key','coin','gem','crystal','feather','bottle','jar','lantern','candle','wick','glass_shard','lens','gear','log','plank','rock','ore','rope','parcel','ribbon','bag','rod','bait','net','map','star','heart_charm'];

export const INTERACT_TYPES = ['sign','noticeboard','bed','rest','diary','chest','mailbox','shop','job','fishing','forage','lamp','bench','fountain','shrine','telescope','bookshelf','crafting','object'];
export const WATER_KINDS = ['brook','river','pier','beach','stream'];
export const DECOR_SETS = ['spring_picnic','midsummer','harvest_fair','hearthlight','lantern_festival'];
export const LAMP_GROUPS = { town_square: 1, market_street: 2, harbor: 3, riverside_park: 4, starview_hill: 5, whispering_woods: 5, brook_lane: 6 };   // lamp restored when story.lanterns >= group

export const MUSIC_TRACKS = ['title','prologue','home','town_spring','town_summer','town_autumn','town_winter','night','town_rain','shop','cafe','harbor','woods','hilltop','festival','festival_winter','romance','sad','comedy','minigame','ending'];
export const SFX_IDS = ['ui_move','ui_confirm','ui_cancel','ui_open','ui_close','ui_error','ui_tab','coin','buy','sell','item_get','item_get_rare','heart_up','quest_new','quest_done','door_open','door_close','step_grass','step_dirt','step_stone','step_wood','step_sand','step_snow','splash','cast','bite','reel','catch','fish_escape','shop_bell','pop','sparkle','whoosh','sleep_jingle','wake_jingle','firework_launch','firework_boom','lamp_light','page_turn','knead','oven_ding','bark','meow','gull','chirp','clock_chime','thunder','confirm_big'];
export const AMBIENCE_IDS = ['birds','crickets','waves','rain','wind','stream','fire','crowd'];
export const AREA_MUSIC = { brook_lane:'town', town_square:'town', market_street:'town', riverside_park:'town', harbor:'harbor', whispering_woods:'woods', starview_hill:'hilltop', cottage:'home', workshop:'home', bakery:'shop', cafe:'cafe', town_hall:'shop', general_store:'shop', clinic:'shop', library:'shop', inn:'cafe', fishing_hut:'harbor', observatory:'hilltop' };
// 'town' resolves to town_<season> by day, 'night' at night (exteriors), 'town_rain' when raining; Systems picks, Audio plays.

/** Every area. anchors = named standing points (World MUST define all, incl. generated from_<neighbor>); singles = id→type interactables;
 *  lamps/forage/fishing = counts (ids lamp_<code>_<n>, forage_<code>_<n>, fishing_<code>_<n>, n from 1). Every neighbor N needs transition `to_N` and anchor `from_N`. */
export const AREAS = {
  brook_lane:       { name: 'Brook Lane', kind: 'exterior', size: [36, 26], code: 'bl', mapPos: [0.14, 0.58], neighbors: ['town_square','whispering_woods','cottage','workshop'],
    anchors: ['cottage_front','workshop_front','mailbox_spot','garden_bench','willow','footbridge','meadow','stream_bank','lamp_corner'],
    singles: { mailbox: 'mailbox', sign_bl: 'sign' }, lamps: 4, forage: 3, fishing: 1 },
  town_square:      { name: 'Town Square', kind: 'exterior', size: [44, 30], code: 'sq', mapPos: [0.42, 0.55], neighbors: ['brook_lane','market_street','riverside_park','bakery','cafe','town_hall'],
    anchors: ['fountain_spot','bench_sq_1_spot','bench_sq_2_spot','noticeboard_spot','clock_tower','plaza_center','hall_steps','flower_stall','cafe_terrace_1','cafe_terrace_2','bakery_steps','stage','tree_shade'],
    singles: { noticeboard: 'noticeboard', fountain: 'fountain', sign_sq: 'sign', bench_sq_1: 'bench', bench_sq_2: 'bench' }, lamps: 6, forage: 0, fishing: 0 },
  market_street:    { name: 'Market Street', kind: 'exterior', size: [46, 24], code: 'ms', mapPos: [0.70, 0.45], neighbors: ['town_square','harbor','starview_hill','general_store','clinic','library','inn'],
    anchors: ['street_west','street_mid','street_east','store_steps','clinic_steps','library_steps','inn_steps','bench_ms_1_spot','postbox_spot','hill_stairs','fruit_stand','cat_corner'],
    singles: { sign_ms: 'sign', bench_ms_1: 'bench' }, lamps: 6, forage: 0, fishing: 0 },
  riverside_park:   { name: 'Riverside Park', kind: 'exterior', size: [40, 28], code: 'rp', mapPos: [0.45, 0.82], neighbors: ['town_square','harbor'],
    anchors: ['gazebo_spot','bridge_mid','pond_edge','picnic_blanket','flower_bed','bench_rp_1_spot','bench_rp_2_spot','river_bank_1','river_bank_2','duck_corner','swing'],
    singles: { sign_rp: 'sign', bench_rp_1: 'bench', bench_rp_2: 'bench', gazebo: 'object' }, lamps: 5, forage: 4, fishing: 3 },
  harbor:           { name: 'Harbor', kind: 'exterior', size: [44, 28], code: 'hb', mapPos: [0.82, 0.78], neighbors: ['market_street','riverside_park','fishing_hut'],
    anchors: ['pier_start','pier_end','beach_shells','boat_dock','hut_steps','net_rack','harbor_bench_spot','sunset_spot','lighthouse_base','crates'],
    singles: { sign_hb: 'sign', bench_hb_1: 'bench' }, lamps: 5, forage: 4, fishing: 4 },
  whispering_woods: { name: 'Whispering Woods', kind: 'exterior', size: [40, 30], code: 'ww', mapPos: [0.15, 0.22], neighbors: ['brook_lane','starview_hill'],
    anchors: ['trail_start','shrine_spot','mushroom_grove','berry_patch','hollow_log_spot','clearing','hermit_hut','stream_crossing','trail_end'],
    singles: { sign_ww: 'sign', shrine: 'shrine', hollow_log: 'object' }, lamps: 3, forage: 8, fishing: 1 },
  starview_hill:    { name: 'Starview Hill', kind: 'exterior', size: [34, 26], code: 'sh', mapPos: [0.55, 0.12], neighbors: ['market_street','whispering_woods','observatory'],
    anchors: ['summit','view_bench_spot','telescope_spot','observatory_steps','big_oak','trail_south','trail_west'],
    singles: { sign_sh: 'sign', telescope: 'telescope', bench_sh_1: 'bench' }, lamps: 3, forage: 3, fishing: 0 },
  cottage:          { name: "Old Lamplighter's Cottage", kind: 'interior', size: [14, 10], code: 'ct', neighbors: ['brook_lane'],
    anchors: ['bed_spot','table','stove_spot','diary_spot','chest_spot','shelf_spot','window_seat','rug'],
    singles: { bed: 'bed', diary: 'diary', chest: 'chest', bookshelf_home: 'bookshelf', calendar_wall: 'object', stove: 'object' } },
  workshop:         { name: "Tobias' Workshop", kind: 'interior', size: [12, 9], code: 'wk', neighbors: ['brook_lane'],
    anchors: ['bench_spot','shelf_spot','centre'], singles: { bench_workshop: 'crafting', lantern_shelf: 'object', trunk_workshop: 'chest' } },
  bakery:           { name: 'Rye & Rose Bakery', kind: 'interior', size: [16, 11], code: 'bk', neighbors: ['town_square'],
    anchors: ['counter_front','behind_counter','oven_spot','kneading_table','table_bk_1','table_bk_2','window_bk','upstairs'],
    singles: { shop_bakery: 'shop', job_bakery: 'job', oven: 'object' } },
  cafe:             { name: 'Copper Kettle Café', kind: 'interior', size: [16, 11], code: 'cf', neighbors: ['town_square'],
    anchors: ['counter_front','behind_counter','coffee_machine_spot','table_cf_1','table_cf_2','table_cf_3','piano_spot','upstairs'],
    singles: { shop_cafe: 'shop', coffee_machine: 'object', piano_cf: 'object' } },
  town_hall:        { name: 'Town Hall', kind: 'interior', size: [16, 11], code: 'th', neighbors: ['town_square'],
    anchors: ['desk_front','behind_desk','meeting_table','window_th','flag_spot'], singles: { desk_mayor: 'object', job_lamplighter: 'job', flag_hall: 'object' } },
  general_store:    { name: 'Pennywhistle Provisions', kind: 'interior', size: [16, 11], code: 'gs', neighbors: ['market_street'],
    anchors: ['counter_front','behind_counter','post_counter_spot','shelf_row_1','shelf_row_2','back_room'], singles: { shop_general: 'shop', post_counter: 'job', shelf_gs_1: 'object' } },
  clinic:           { name: 'Whitlock Clinic', kind: 'interior', size: [14, 10], code: 'cl', neighbors: ['market_street'],
    anchors: ['reception_front','behind_reception','exam_bed_spot','waiting_chairs','back_room'], singles: { shop_clinic: 'shop', clinic_bed: 'rest' } },
  library:          { name: 'Thornfield Library', kind: 'interior', size: [18, 12], code: 'lb', neighbors: ['market_street'],
    anchors: ['desk_front','behind_desk','reading_nook','shelf_row_1','shelf_row_2','ladder','window_lib','upstairs'],
    singles: { bookshelf_lib_1: 'bookshelf', bookshelf_lib_2: 'bookshelf', bookshelf_lib_3: 'bookshelf', bookshelf_lib_4: 'bookshelf', bookshelf_lib_5: 'bookshelf', bookshelf_lib_6: 'bookshelf', desk_library: 'object' } },
  inn:              { name: 'Heron Inn', kind: 'interior', size: [18, 12], code: 'in', neighbors: ['market_street'],
    anchors: ['reception_front','behind_reception','hearth_spot','table_inn_1','table_inn_2','table_inn_3','stairs','kitchen'], singles: { shop_inn: 'shop', hearth: 'object' } },
  fishing_hut:      { name: "Pelham's Fishing Hut", kind: 'interior', size: [14, 10], code: 'fh', neighbors: ['harbor'],
    anchors: ['counter_front','behind_counter','tackle_wall_spot','ledger_spot','stove_fh','bunk'], singles: { shop_fishing: 'shop', fish_ledger: 'object', tackle_wall: 'object' } },
  observatory:      { name: 'Starview Observatory', kind: 'interior', size: [14, 12], code: 'ob', neighbors: ['starview_hill'],
    anchors: ['telescope_big_spot','desk_obs_spot','star_map_spot','stairs_obs','cot'], singles: { telescope_big: 'telescope', star_map: 'object', desk_obs: 'object' } },
};
export const AREA_IDS = Object.keys(AREAS);
const ids = (p, code, n) => Array.from({ length: n || 0 }, (_, i) => `${p}_${code}_${i + 1}`);
export const lampIds = (a) => ids('lamp', AREAS[a].code, AREAS[a].lamps);
export const forageIds = (a) => ids('forage', AREAS[a].code, AREAS[a].forage);
export const fishingIds = (a) => ids('fishing', AREAS[a].code, AREAS[a].fishing);
/** id → type for every REQUIRED interactable of an area */
export const areaInteractables = (a) => Object.assign({}, AREAS[a].singles,
  ...lampIds(a).map((i) => ({ [i]: 'lamp' })), ...forageIds(a).map((i) => ({ [i]: 'forage' })), ...fishingIds(a).map((i) => ({ [i]: 'fishing' })));
/** every REQUIRED anchor name (listed + from_<neighbor>) */
export const areaAnchorNames = (a) => [...AREAS[a].anchors, ...AREAS[a].neighbors.map((n) => `from_${n}`)];
/** every REQUIRED transition id: to_<neighbor> */
export const areaTransitionIds = (a) => AREAS[a].neighbors.map((n) => `to_${n}`);
/** water kind of a fishing spot: bl→brook, rp→river, hb_1..2→pier, hb_3..4→beach, ww→stream */
export const fishingWaterKind = (a, id) => (a === 'brook_lane' ? 'brook' : a === 'riverside_park' ? 'river' : a === 'whispering_woods' ? 'stream' : Number(id.split('_').pop()) <= 2 ? 'pier' : 'beach');

/** Public API surface checked by tools/check-contract.mjs (dotted = nested object). Missing names fail `npm run contract`. */
export const API_SURFACE = {
  world: ['init','resize','loadArea','getArea','listAreas','getAreaDef','update','render','setEnvironment','setCamera','snapCamera','addEntity','removeEntity','screenToGround','groundToScreen','setLampStates','setDecor','playEffect','setHighlight','setDoorOpen','setQuality','getStats'],
  chars: ['createCharacter','createCritter','listAppearances','preload'],
  portraits: ['hasPortrait','getPortrait','drawPortrait','preload'],
  ui: ['init','update','showTitle','toast','banner','fade','confirm','pickItem','setPrompt','hudVisible','letterbox','dialogue.say','dialogue.ask','dialogue.narrate','dialogue.close','menu.open','menu.close','shop.open','notes.read','daySummary','minigames.fishing','minigames.kneading'],
  audio: ['init','unlock','playMusic','stopMusic','playSfx','blip','footstep','setAmbience','setVolume','setMuted','duckMusic'],
  systems: ['init','update','start','newGame','continueGame','openMenu','saveGame','runScript','registerOp'],
  data: ['npcs','items','fish','forage','shops','jobs','buildings','schedules','quests','events','festivals','calendar','mail','books','interactions','dialogue','tutorial','errands','getItem','getNpc'],
};
```

## 5. World (WS1) — `src/world/`

```js
// index.js (named exports; this is Game.world)
init({ canvas, quality, seed })  → Promise<void>      // renderer, scene, camera, lights, textures, post; no DOM at import
resize(w, h, dpr?)  ·  setQuality('low'|'medium'|'high')  ·  getStats() → { drawCalls, triangles, fps }
listAreas() → string[]  ·  getAreaDef(id) → AreaDef (pure data)  ·  getArea() → AreaRuntime|null
loadArea(id, { spawn?: anchorName }) → Promise<AreaRuntime>   // disposes previous area; spawn = anchor to place the camera first
update(dt)  ·  render()
setEnvironment({ minutes, season, weather, festival? })        // lighting, sky, colour grade, fog, particles; called every frame (cheap) — interpolate smoothly internally
setCamera({ x, z, zoom? })  // target to follow smoothly       ·  snapCamera({ x, z })   // jump
addEntity(object3D, { shadow?: radiusOrFalse })  ·  removeEntity(object3D)            // characters/critters live in the scene; blob shadow follows x,z
screenToGround(clientX, clientY) → {x,z}|null  ·  groundToScreen(x, z, y=0) → {x,y} (CSS px)
setLampStates({ [lampId]: 'broken'|'unlit'|'lit' })  ·  setDecor(decorId|null)  ·  setHighlight(interactableId|null)  ·  setDoorOpen(transitionId, bool)
playEffect(name, { x, z, y?, count?, color? })   // names: sparkle splash dust hearts confetti firework leaves steam ripple notes
```
**Camera (fixed, never rotates, never user‑controlled):** perspective, vertical FOV ≈ 30°, yaw 0, pitch ≈ 52° down. Distance chosen so a 16:9 view shows ≈ **24 × 14 tiles** in exteriors and ≈ **16 × 9** in interiors (characters ≈ 1/9 of screen height); on narrow/tall aspect ratios keep ≥ 16 tiles horizontal. Follow with smoothing; clamp so the view never shows beyond the area edge (+1 tile margin); small interiors lock the camera to the room centre. Scripted pans (`setCamera`) are allowed; the *angle* never changes.
**AreaRuntime** (returned by `loadArea`/`getArea`):
```js
{ id, name, kind:'exterior'|'interior', width, height,
  anchors:{ [name]:{ x, z, facing } },  anchor(name) → {x,z,facing}|null,
  transitions:[ { id, kind:'door'|'edge', rect:{x,z,w,h}, stand:{x,z}, to:{ area, spawn } } ],   // walk into rect (doors: stand on mat) → Systems performs transition
  interactables:[ { id, type, x, z, r, facing?, label, text?, group?, water? } ],               // type ∈ INTERACT_TYPES; lamps have group (LAMP_GROUPS); fishing have water (WATER_KINDS); text = default examine line
  critters:[ { kind, count, bounds:{x,z,w,h} } ],                                              // Systems spawns them via Game.chars.createCritter
  isWalkable(i, j) → bool (tile ints), isBlockedAt(x, z, r=0.3) → bool,
  moveCircle(x, z, dx, dz, r=0.3) → { x, z, blocked }       // slides along walls, never tunnels at ≤ 0.5 tiles/step
  surfaceAt(x, z) → 'grass'|'dirt'|'stone'|'wood'|'sand'|'snow'|'carpet'|'water',
  grid:{ w, h, walk:Uint8Array },                            // 1 = walkable tile (A* input for Systems)
}
```
**AreaDef** files `src/world/areas/<id>.js` (pure data/descriptors, no `three`) must include every anchor from `areaAnchorNames(id)`, every transition from `areaTransitionIds(id)` and every interactable from `areaInteractables(id)` with matching types (`tools/validate-world.mjs` enforces; exteriors also need `critters` hints, lamp posts at lamp interactables, ≥ 1 walkable path from every `from_*` anchor to every other).
**Art direction (see DESIGN §13.2):** MeshLambert/Standard painterly textures generated on canvas (`THREE.CanvasTexture`, sRGB, anisotropy, mipmaps), vertex‑colour/baked AO, merged static geometry per material, InstancedMesh for grass tufts/flowers/foliage, painted sky dome + distant layers, warm key light + hemisphere fill, soft shadows (medium/high), lit windows & lamp halos at night, season/weather/time grading, lightweight custom post (vignette, grade, grain; skipped in `low`). Characters use toon materials so they pop slightly from the soft backdrop. Budget: ≤ ~350 draw calls/area, 60 fps on integrated GPUs at `medium`.

## 6. Characters (WS2) — `src/characters/`

```js
createCharacter(id, { season?, scale? }) → Rig        // id: 'player' | NPC_IDS entry
createCritter(kind, { seed? }) → Critter              // kind ∈ CRITTERS
listAppearances() → string[]  ·  preload() → Promise  // build shared geometry/materials/face atlases
Rig = { id, group:THREE.Group /*feet at y=0, +z = front*/, height,
  setFacing(dirOrYaw, { snap? }), getFacing(), faceTowards(x, z),
  locomote(speedTilesPerSec),                    // 0 → idle blend, ~2.6 walk, ~5 run (drives cycle rate); preferred for moving characters
  play(name, { loop=true, speed=1, onDone? }) → Promise   // name ∈ ANIMATIONS; non-looping resolves at end; `stop()` returns to locomotion
  stop(), setExpression(name /*EXPRESSIONS*/), emote(name /*EMOTES*/), setHeld(prop|null /*HELD_PROPS*/),
  setVisible(bool), setSeason(season), update(dt), dispose() }
Critter = { group, update(dt, ctx /* {isBlockedAt(x,z,r), player:{x,z}} */), setBounds({x,z,w,h}), dispose() }
```
Look (DESIGN §13.3): chibi (head ≈ 55% of height; adult height ≈ 1.15 tiles, kids ≈ 0.9, elders ≈ 1.05), layered hair pieces, mitten hands, round boots, toon material with 2–3 tone gradient + **inverted‑hull outlines**, big painted anime eyes on a face decal with expressions + auto‑blink + blush, soft squash‑and‑stretch procedural animation, outfits from colours in DESIGN §7 (all 19 NPCs + `player` with `meta.look` colours: `hair`, `jacket`, `scarf`), seasonal variants (winter coats/scarves, summer light wear). Appearance data lives in `characters/appearances.js` (keyed by id). Critters: simple cute low‑poly + toon (cat, dog, sparrow, gull, duck, butterfly, crab, rabbit) with wander/flee behaviour inside bounds.

## 7. Portraits (WS2) — `src/portraits/`

```js
hasPortrait(id) → bool  (true only for PORTRAIT_IDS)
getPortrait(id, expression='neutral', { season? }) → HTMLCanvasElement|null   // cached; 512×640 logical px (draw at 2× internally), transparent background
drawPortrait(ctx, id, expression, x, y, w, h)
preload(ids?) → Promise      // renders all expressions in idle slices; must not hitch frames > 50ms
```
Procedural Canvas2D only. Each portrait = layered paths (back hair, neck, body/outfit, face, ears, eyes [sclera, iris gradient, pupil, 2–3 highlights, lashes], brows, nose, mouth, blush, bangs/front hair with strand highlights, accessories) driven by a spec built from DESIGN §7 (hair style, colours, eye shape/colour, skin, outfit, accessories). Expression changes eyes/brows/mouth/blush/extra marks (sweat drop, sparkle, anger vein, tears) and a slight head tilt. Style: late‑90s anime (clean mid‑weight outline, flat cel shading with one soft shadow tone, glossy eyes, flowing hair strands with highlight bands). **Characters must be instantly distinguishable at thumbnail size.**

## 8. UI (WS3) — `src/ui/`  (DOM overlay inside `#ui-root`; all CSS in `styles.js`)

```js
init({ root })  ·  update(dt)  // reads Game.state at ~10 Hz for HUD; no per-frame DOM thrash
showTitle() → Promise<{ action:'new'|'continue'|'quit', slot?, name?, look? }>   // title screen over the live 3D scene; New Game form (name 1–10 chars, look presets); Continue lists slots (+ import/export)
dialogue.say({ speaker, name?, text, expr?, side?, voice? }) → Promise<void>    // typewriter + blips; portrait via Game.portraits when hasPortrait(speaker); speaker 'player' → state.meta.name; hold confirm = fast-forward
dialogue.ask({ prompt?, options:[{ text, disabled?, hint? }], speaker?, expr? }) → Promise<number>
dialogue.narrate(text) → Promise<void>  ·  dialogue.close()
toast(text, { icon?, kind?:'info'|'item'|'quest'|'heart'|'warn', ms? })  ·  banner(title, sub?, ms?) → Promise  ·  fade(toAlpha0to1, ms=500, color='#000') → Promise
confirm(question, { yes='Yes', no='No' }) → Promise<boolean>  ·  pickItem({ prompt, filter?(slot)→bool }) → Promise<number|null>  // inventory slot index
setPrompt(text|null)  // contextual "Space: Talk" prompt near bottom-centre  ·  hudVisible(bool)  ·  letterbox(bool)  // cinematic bars
menu.open(tab?) → Promise<void> / menu.close()   // tabs: items, people, quests, map, calendar, collection, settings (save/load/export/import/quit inside settings)
shop.open({ title, greeting?, portraitId?, stock:[{ itemId, price, left? }], canSell:true|string[] /*categories*/, onBuy(itemId, qty)→{ok,reason?}, onSell(slot, qty)→{ok,gained?} }) → Promise<void>
notes.read({ title, lines:string[] }) → Promise<void>       // letters, books, signs (paged)
daySummary({ earned, spent, fishCaught, hearts:[{npc,delta}], note? }) → Promise<void>
minigames.fishing({ fish:{ id, name, difficulty:1..5, speed, size }, rodPower:1..3 }) → Promise<{ caught, perfect }>
minigames.kneading({ difficulty:1..5, rounds:3 }) → Promise<{ score:0..1 }>
icons: itemIcon(itemDef, size=48) → HTMLCanvasElement  (draws ICON_SHAPES with icon.colors)   // exported as ui.itemIcon too
```
Menu/HUD read items/NPCs/quests/calendar via `Game.data` and state via `Game.state`; they **emit intent events** (§3.7) rather than mutating state. Touch overlay (virtual stick + A/B/Menu) appears on coarse‑pointer devices via `Input.setVirtual*`. Responsive 16:9 → 4:3 → phone landscape; scale with `clamp()`; the layout must not depend on webfont metrics. Every screen is keyboard‑navigable (arrows, confirm, cancel, tab_prev/next) and clickable. Aesthetic: DESIGN §13.5 (parchment panels, rounded, warm), animated, cosy. UI calls `Game.audio.playSfx('ui_*')`.

## 9. Audio (WS3) — `src/audio/`  (self‑contained, no imports from other workstreams; WebAudio synthesis only)

```js
init()  ·  unlock()            // create/resume AudioContext on first gesture (safe to call repeatedly / before gesture)
playMusic(trackId, { fadeMs=1200 })  ·  stopMusic({ fadeMs })  ·  duckMusic(bool)   // trackId ∈ MUSIC_TRACKS; same track = no-op; crossfade
playSfx(id, { volume=1, rate=1, pan=0 })      // id ∈ SFX_IDS
blip(voice, { pitch=1 })                       // per-character text blip, voice ∈ VOICES
footstep(surface, { run=false })               // surfaceAt() strings
setAmbience({ area, weather, season, night })  // mixes AMBIENCE_IDS beds appropriately
setVolume({ master, music, sfx, ambience })  ·  setMuted(bool)  ·  tracks (string[]) · sfxList (string[]) · stats() → { state, playing }
```
Original compositions: a tiny sequencer (look‑ahead scheduling) + instrument presets (marimba/pluck, flute‑like, soft pad, warm bass, shaker/kick/hat, bell) with chord progressions, motifs, seasonal variants of the town theme. Tier 1 tracks: `title home town_spring night shop romance festival minigame`; Tier 2: `town_summer town_autumn town_winter harbor woods hilltop cafe sad comedy town_rain`; Tier 3: `prologue festival_winter ending`. Tests render with `OfflineAudioContext` to check non‑silence / no clipping.

## 10. Systems (WS4) — `src/systems/`

Public (`Game.systems`): `init()`, `update(dt)`, `start()` (title → new/continue → prologue → field), `newGame({name,look})`, `continueGame(slot)`, `openMenu(tab)`, `saveGame(slot)`, `runScript(idOrSteps, ctx?) → Promise`, `registerOp(name, handler)`, plus `svc` (internal services: `clock weather inventory rel quests script events shops save` from **S1**; `player interaction entities npcs path activities jobs` from **S2**).
- **S1 (pure logic, Node‑testable with fakes):** `clock` (time scale, advance, season/day rollover, weekday, `isNight`), `weather` (seeded daily roll + tomorrow forecast by season; festival → fair), `conditions` (`evalCond`, §12), `inventory` (+money, energy, `useItem` for food), `shops` (hours/closed days from `Data.buildings`, stock, buy/sell), `relationships` (talk, gifts by loves/likes/tags, hearts, dating), `quests` (stages, goals via bus events, notice board from `Data.errands`, rewards), `script` (§11 interpreter + `registerOp`), `events` (heart/story/festival triggers, priorities, once), `director` (title→game flow, sleep/day rollover, autosave, collapse at 26:00, mail delivery), save integration, `LB` debug commands.
- **S2 (world‑facing):** `player` (movement via `area.moveCircle`, run, facing, footsteps, camera follow), `interaction` (nearest target in front, prompt via `ui.setPrompt`, handlers per interactable type + doors/edges + NPC talk/gift), `entities` (spawn player/NPC rigs via `Game.chars`, add to `Game.world`, critters, lamps → `world.setLampStates`, area enter/exit, music/ambience selection), `npcs` (`whereIs(npc, time)` from `Data.schedules`, festival overrides, walking via A* on `area.grid`, virtual positions when not observed), `path`, `activities` (fishing, foraging, stargazing, reading, resting), `jobs` (bakery/parcel/lamplighter flows), staging ops (§11).
Frame order (main loop): `Input` → `Systems.update(dt)` → `World.update/setEnvironment/setCamera` → `UI.update` → `World.render` → `Input.endFrame`.

## 11. Script language (dialogue & cutscenes) — authored by WS5, run by WS4, shown by WS3

A **script** = array of **steps**; a step is an object with one op key. Scripts may live in `Data.events[id].script`, `Data.dialogue[npc].intro`, `Data.interactions[...]`, `Data.quests[...]` hooks, or be passed inline. Text tokens: `{player}` `{name:npcId}` `{short:npcId}` `{item:itemId}` `{season}` `{weekday}` `{date}` `{money}` `{hearts:npcId}`.
| Op | Fields |
|---|---|
| `say` | `say: speakerId` (`npcId` \| `'player'` \| `'narrator'` \| `'???'`), `text`, `expr?`, `name?` (override label), `side?:'left'|'right'` |
| `ask` | `ask:[{ text, then?:Step[], if?:Cond, hint? }]`, `prompt?`, `speaker?`, `expr?`, `var?` (store chosen index) |
| `narrate` | `narrate: text` |
| `if` | `if: Cond, then?:Step[], else?:Step[]` |
| `label` / `goto` | `label:'x'` / `goto:'x'` (labels at the script's top level only) |
| `end` | `end:true` |
| `wait` | `wait: ms` |
| `parallel` | `parallel:[Step[], Step[]]` (all run together; waits for all) |
| `call` | `call:'scriptId'` (event/dialogue/interaction id) |
| flags | `setFlag:'x'` (+`value?`), `clearFlag:'x'`, `incFlag:'x'` (+`by?`) |
| items/money | `giveItem:'id'` (+`qty?`, `silent?`), `takeItem:'id'` (+`qty?`), `money:+n/-n`, `energy:+n/-n` |
| social | `affection:'npcId'` + `amount:n`, `meet:'npcId'` |
| quests | `startQuest:'id'`, `advanceQuest:'id'`, `completeQuest:'id'`, `lantern:n` |
| world state | `setTime:'HH:MM'`, `setWeather:'sunny'`, `mail:'mailId'` (deliver next morning) |
| presentation | `fade:'out'|'in'` (+`ms?`,`color?`), `title:'text'` (+`sub?`,`ms?`), `music:'track'|null` (+`fadeMs?`), `sfx:'id'`, `toast:'text'` (+`icon?`), `letterbox:true|false`, `shop:'shopId'`, `notes:{title,lines}` |
| staging (S2) | `area:'areaId'` + `at:'anchor'` (+`facing?`) · `place:'npcId'|'player'` + `at:'anchor'|{x,z}` (+`area?`,`facing?`:`n|e|s|w|'player'`) · `move:'id'` + `to:'anchor'|{x,z}` (+`speed?:'walk'|'run'`, `wait?:true`) · `face:'id'` + `toward:'player'|'npcId'|'anchor'|'n'|'e'|'s'|'w'` · `anim:'id'` + `name` (+`loop?`,`wait?`) · `expr:'id'` + `name` · `emote:'id'` + `icon` · `hold:'id'` + `prop:'rod'|null` · `camera:{ focus:'id'|'anchor'|{x,z}|'player', ms?, zoom? }` or `camera:'reset'` · `hide:'npcId'`, `show:'npcId'` · `effect:'name'` + `at?` · `lamps:'all_lit'|'restore'|'normal'` · `decor:'id'|null` |
Control rules: `ask.then` branches continue after the ask unless they `end`/`goto`. Scripts lock input (`mode:'dialogue'/'cutscene'`) and restore `'field'`. `{ fade }`, `say`, `move wait:true`, `anim wait:true`, `wait`, `camera` all block until done.

## 12. Conditions (`Cond`) — shared by schedules, events, dialogue, quests, mail, tutorial
A `Cond` is an array (= all), `{all:[]}`, `{any:[]}`, `{not:Cond}`, or one primitive:
`{flag:'x'}` `{notFlag:'x'}` `{flagGte:['x',n]}` · `{hearts:{npc,gte?,lte?}}` `{status:{npc,is:'dating'|'none'}}` `{met:'npc'}` · `{season:'spring'|[…]}` `{weekday:'mon'|[…]}` `{weather:'rain'|[…]}` `{year:{gte?,lte?}}` `{day:{gte?,lte?}}` (absolute dayNum) `{date:{season,day}}` `{dateFrom:{season,day}}` `{dateTo:{season,day}}` · `{time:{from:'HH:MM',to:'HH:MM'}}` `{night:true}` · `{area:'id'|[…]}` `{indoors:true}` · `{item:{id,gte?}}` `{money:{gte?,lte?}}` `{energy:{lte?,gte?}}` · `{quest:{id,state:'active'|'done'|'none',stage?}}` `{lanterns:{gte?}}` `{jobDone:'jobId'}` (done today) · `{festival:true|'id'}` · `{chance:0.3}` (seeded by dayNum+context). Evaluated by `Game.systems.svc.conditions.evalCond(cond, ctx?)`.

## 13. Content data (WS5) — `src/data/` — schemas

`src/data/index.js` exports `Data` with the keys in `API_SURFACE.data`. Seasons/weekdays in data are **names** (`'spring'`, `'mon'`), not indices. `dialogue/` and `events/` have barrel files; **D1 creates a valid placeholder file for every module named below**, later workers overwrite only the files they own (never the barrels).
```js
ItemDef   { id, name, desc, category, price:{ buy:n|null, sell:n|null }, icon:{ shape:ICON_SHAPES, colors:['#hex','#hex'] }, tags:[ITEM_TAGS], energy?:n, stack?:n, key?:true }
NpcDef    { id, name, short, age, role, gender:'f'|'m', romance:bool, portrait:bool, birthday:{season,day}|null, home:areaId, bio, personality:[str], voice:VOICES,
            loves:{items:[id],tags:[tag]}, likes:{…}, dislikes:{…}, hates:{…}, startMet?:bool }
Schedule  schedules[npcId] = [ { when?:Cond, slots:[ { from:'HH:MM', area:areaId, at:anchorName, facing?:'n|e|s|w', anim?:ANIMATION, hold?:HELD_PROP, hidden?:true, wander?:radiusTiles } ] } ]   // first rule whose `when` passes wins (last has none); slot = latest `from` <= now; hidden = at home/inside, not rendered
FishDef   { id (= item id), name, spots:[WATER_KINDS], seasons:[…], weather:[…], time:{from,to}, weight:1..10, difficulty:1..5, size:[min,max], desc }
ForageTbl forage[areaId] = { spring:[{item,weight}], summer:[…], autumn:[…], winter:[…] }    // one roll per forage spot per day (seeded); weight 0..N, include {item:null,weight} for empty
ShopDef   { id, name, owner:npcId, area, counter:interactableId, greeting, stock:[{ item, price?, seasons?:[…], limit?:n }], buys:'all'|[ITEM_CATEGORIES], sellMult?:n }
JobDef    { id, name, boss:npcId, area, spot:interactableId, days:[weekday], from, to, energy:n, kind:'kneading'|'delivery'|'lamplighter', pay:{ base, bonus }, intro:Script, done:Script, desc }
Building  buildings[interiorAreaId] = { open:'HH:MM', close:'HH:MM', closedDays:[weekday], lockFlag?:flag, closedText:str, lockedText?:str }
QuestDef  { id, kind:'tutorial'|'main'|'side'|'errand', title, giver?:npcId, desc, unlock?:Cond, repeat?:bool, expiresDays?:n, board?:bool,
            stages:[ { id, text, goal:Goal, onEnter?:Script, onDone?:Script } ], reward:{ money?, items?:[{id,qty}], aff?:{npc:n}, flags?:[str], script?:Script } }
Goal      {type:'talk',npc} {type:'give',npc,item,qty} {type:'have',item,qty} {type:'catch',fish:id|'any',qty} {type:'forage',item?:id,qty} {type:'visit',area,anchor?,radius?}
          {type:'hearts',npc,hearts} {type:'job',job,times} {type:'earn',amount} {type:'flag',flag} {type:'date',season,day} {type:'lanterns',count}
ErrandTpl errands = [ { id, text (with {npc} {item} {qty} placeholders), kind:'deliver'|'bring'|'catch'|'forage'|'visit', pool:{ npcs:[…], items:[…], qty:[min,max] }, reward:{ money:[min,max], aff?:n }, weight } ]
EventDef  events[id] = { id, kind:'story'|'heart'|'friend'|'festival'|'misc', npc?, when:Cond, priority:n, once:true, cooldownDays?:n, music?:track, script:Script }   // evaluated on area:enter, every 10 game minutes in field mode, and after sleeping
Festival  festivals[id] = { id, name, date:{season,day}, area, from, to, eventId, decor:DECOR_SETS, closes:[interiorAreaIds], placement:{ default:{ area, anchors:[names] }, byNpc:{ [npcId]:{ area, at } } } }
Calendar  calendar = { festivals:[ids], weekly:[ { weekday, text } ] }  (birthdays derived from NpcDef)
Mail      mail[id] = { id, from:npcId|'town', subject, body:[str], when:Cond, once:true, attach?:{ money?, items?:[{id,qty}] } }     // delivered next morning when `when` passes; read at the cottage mailbox
Book      books[id] = { id, title, author, where:interactableId, pages:[str], hint?:{ quest?:id, text } }
Interact  interactions['<areaId>.<interactableId>'] = { when?:Cond, script?:Script, text?:[str] }  ·  interactions._defaults = { <type>:[str] }   // override World's default examine text
Dialogue  dialogue[npcId] = { npc, intro:Script, talk:[ { id, when?:Cond, weight?:n, lines:[ 'text' | ['text','expr'] ] } ], gifts:{ love:[Line], like:[Line], neutral:[Line], dislike:[Line], hate:[Line], birthday:[Line], again:[Line] }, shop?:{ greet:[Line] } }   // Line = 'text' | ['text','expr']; the first matching highest-weight/random `talk` entry runs per conversation
Tutorial  tutorial = [ { id, when:Cond, text, icon? } ]  // one-time hint toasts
```
**Main quest ids (settled):** `t_meet_town` `t_first_shift` `t_first_catch` `t_forage` · `m1_arrival` `m2_journal` `m3_baker` `m4_reader` `m5_sailor` `m6_cafe` `m7_stargazer` `m8_greatlantern` `m9_festival`.
**Key items (settled ids):** `town_map` `cottage_key` `workshop_key` `tobias_journal` `fishing_rod` `ember_glass` `brass_blueprint` `sea_lens` `spiced_lamp_oil` `starlight_wick` `great_lantern`.
**Flags (settled):** `prologue_done` `journal_found` `workshop_unlocked` `lantern_1`…`lantern_5` `met_<npc>` `<npc>_dating` `seen_<eventId>` `ending_together` `ending_friends`.
**Event ids (settled):** `prologue` `journal_found` `lantern_restored_1`…`_6` `festival_blossom` `festival_midsummer` `festival_harvest` `festival_hearthlight` `festival_lantern` `ending_together_<npc>` `ending_friends` `heart_<npc>_<2|4|6|8>` `friend_<npc>_<n>`.
**Content file plan (D1 placeholders; owners later):** `data/{index,npcs,items,fish,forage,shops,jobs,buildings,schedules,quests,festivals,calendar,mail,books,interactions,tutorial,errands}.js` · `data/dialogue/{index,<19 npc ids>}.js` · `data/events/{index,prologue,story_main,festivals,heart_mira,heart_willa,heart_juno,heart_rhea,heart_celeste,friends,misc}.js`.

## 14. Verification protocol (every worker)

1. `npm ci` (worktrees), then work. Keep a **lab page** for your module and drive it with `tools/shot.cjs`; inspect screenshots (`Read` the PNG); iterate until it looks right.
2. Unit‑test logic with `node --test` (`tests/unit/<ws>-*.test.mjs`) using fakes for other modules (set `Game.world = fake…`).
3. `npm run contract` must pass for your module (all `API_SURFACE` names present with the right shape).
4. No console errors/warnings in the lab (`tools/shot.cjs --strict`), no top‑level DOM access, no imports from other workstreams.
5. Report: what exists, what is partial/missing (tiered list), deviations from this contract, decisions you made, anything the lead must wire.
