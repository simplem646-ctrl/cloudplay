# src/systems — simulation core (S1)

Pure logic, importable in Node. Talks to the rest of the game only through `Game.world / chars / ui / audio / data / state`
(all optional-chained) and `Game.bus` (`EVT` constants). Unit tests: `tests/unit/sys-*.test.mjs` with fakes in
`tests/unit/fixtures/sys-data.mjs`.

## Public API (`index.js`)

`init() update(dt) start() newGame({name,look}) continueGame(slot) openMenu(tab) saveGame(slot) runScript(idOrSteps, ctx?) registerOp(name, handler)`
plus `svc` (service registry) and `registerService(name, obj)`.

## Extension points for S2

`index.js` is intentionally tiny: S2 adds files and `registerService(...)` lines **below the "S2 services" comment**.

* `registerService('entities', obj)` — `obj.init?()` / `obj.update?(dt)` run in registration order (S1 services first).
* `registerOp(name, handler)` — script ops. `handler(step, ctx) => Promise | 'end' | {goto}`;
  `ctx = {vars, runSteps(steps), interpolate(str), npc?, source}`. Register the staging ops
  `area place move face anim expr emote hold camera hide show effect lamps decor`. Until registered they warn once and are skipped.
  **Never call `runScript` from inside an op** (use `ctx.runSteps` / a `call` step); `svc.script.runQueued(...)` is for code
  outside scripts (quests/events use it) and waits for running scripts.
* `svc.interact.registerHandler(type, async ({area, it, player}) => …)` — S2 registers `lamp`, `forage`, `fishing` and may
  override any other type. S2's interaction code calls `svc.interact.run(areaId, interactable)`; unhandled types fall back to
  the examine text. NPC conversation: `svc.rel.talk(npcId)` and `svc.rel.giftFlow(npcId)`.
* `svc.jobs.start(jobId)` (S2) is called by the `job` handler.

### Interfaces S1 calls on S2 (all optional-chained, graceful fallbacks)

* `svc.entities.enterArea(areaId, spawnAnchor, {fade=true, x?, z?, facing?}) → Promise` — must emit `area:enter {area, from}`
  (fallback: S1 sets `state.player.area` and emits it).
* `svc.entities.getPlayerPos() → {area,x,z,facing}` (used when saving).
* `svc.npcs.whereIs(npcId, minutes?)` (debug `where`).
* Script op `anim` (bench uses `{anim:'player', name:'sit', loop:false, wait:true}` when registered).
* Festival data for S2: `svc.events.festivalToday()`, `festivalActive()`, `closedBuildings()`, `festivalPlacement()`;
  S2 listens to `event:end` to restore music/ambience after events (S1 starts `def.music` with `Game.audio.playMusic`).

## Services (`svc.*`)

| service | notes |
|---|---|
| `clock` | `update(dt)` (only in `field`), `advance(min)`, `set({season,day,minutes})`, `now()`, `isNight()`, `rollDay()`, `sleepToMorning()`; 24:00 toast, 26:00 `director.collapse()`; events `time:tick/hour/newday/season` |
| `weather` | `roll(dayNum)` pure + seeded, `setToday(w)`, `current()`, `forecast()`; rerolled on `time:newday` |
| `conditions` | `evalCond(cond, ctx?)`; ctx `{area?, minutes?, npc?, key?}`; unknown primitive warns once -> false |
| `inventory` | `add(id,qty,{silent}) → leftover`, `remove`, `count`, `has`, `give` (overflow -> chest), `addMoney/spend`, `addEnergy/setEnergy/spendEnergy`, `useItem(slot)`, `storage.{add,remove,count,deposit,withdraw,slots}` |
| `rel` | `aff hearts met status partner addAff meet talk giftFlow preference isBirthday setDating`; dating **derives from flag `<npc>_dating`** (state.rel[npc].status kept in sync, one partner). Emits custom `npc:gift {npc,item,qty,reaction}` (`REL_EVT.GIFT`) |
| `shops` | `isOpen(area,min)`, `closedInfo`, `closedText`, `stockFor`, `buy`, `sell`, `openShop(id)`, `findByCounter` |
| `script` | `run`, `runQueued`, `registerOp`, `hasOp`, `resolve`, `interpolate`, `idle` |
| `quests` | `start advance complete isActive isDone stageOf stageId list track board accept openBoard refreshBoard idle` (stage index 0-based) |
| `events` | `check(trigger)`, `run`, `festivalToday/festivalActive/closedBuildings/festivalPlacement` |
| `mail` | `send(id)` (next morning), `deliver()`, `queue()`, `openMailbox()` |
| `interact` | `handlers`, `registerHandler`, `run(area, it)`, `examine` |
| `tutorial` | `check()` |
| `director` | `start newGame continueGame saveGame openMenu sleep collapse quitToTitle` |
| `save` | slot helpers + UI intent wiring (`ui:useItem buy sell save load newgame setting quit`); `ui:trackQuest` is handled by quests |

Extra state keys (inside existing sub-objects): `world.mailPending`, `world.shopSold`, `quests.tracked`, `quests.active[id].def/expires`
(errand instances), `stats.dayMark`, `stats.wishes`, `rel[npc].seen._last/_n/_nDay`.

## Script engine notes

Op is picked as the first step key that is a registered op (`wait` is a modifier when boolean). `ask` branches continue after the
ask unless they `end`/`goto`; `goto` unwinds to top-level labels; `call` is a sub-script (its own labels/`end`). Runaway guard:
`MAX_STEPS = 5000` per top-level script. `{lantern: n}` adds n lanterns (and sets `lantern_<count>` flags). Event scripts
(and `{cutscene:true}`) run in `cutscene` mode and restore the previous mode. `quests.advance/complete` called from a script op
are not awaited (they queue behind the running script); `await svc.quests.idle()` to wait.
Debug: `LB.skipFades(true)` makes `fade`/`wait` instant.
