# Menu screens API (`src/scenes/menus/**`, task T9b)

Out-of-world screens, registered with the scene registry by `registerMenuScenes()` (`src/scenes/menus/index.js`).
Open them with `openScene(game, name, params)`; the promise resolves with the scene's result. Pure data builders live in
`data.js` (no DOM, unit-tested in `test/scenes/menus_data.test.mjs`); scenes only draw them. Everything works with
keyboard, gamepad and touch (only `up/down/left/right/confirm/cancel/menu` are read).

## Scenes
| name | params | result |
|---|---|---|
| `pause` | `{ tab? }` (`status items friends journal calendar records system`) | `{}`; `{ loaded:true, slot, state }` if a save was loaded from its System tab |
| `status` `items` `friends` `journal` `calendar` `records` | `{}` | `{}` (one screen, no tab bar, cancel closes) |
| `sleep` | `{ summary, before? }` (`summary` = `sim.clock.sleep()`; `before` = `takeSnapshot(state)` from the morning) | `{}` (on `summary.gameEnd` it pops right after the card, no night/banner) |
| `save_menu` | `{}` | `{ saved, slot?, fallback? }` |
| `load_menu` | `{}` | `{ loaded:true, slot, state, migrated }` or `{ loaded:false }`. The CALLER builds the new sim from `state` |
| `settings` | `{}` | `{}` or `{ reset:true }` after "reset all data" |
| `ending` | `{ slides? }` (default `composeEnding(state)`; empty -> one fallback slide) | `{ ended, endingId, credits }` (or `undefined` if the stack was reset to the title) |
| `credits` | `{ endingId? }` | `{ toTitle:true }`; with a registered `title` the whole stack is replaced by it |

Pause navigation: tab bar focus (left/right switch, confirm/down enter, cancel closes) -> content focus (cancel goes back).
Menu key (Tab/M) closes from anywhere. Pause is `transparent` (the overworld shows dimmed); all other screens paint their own backdrop.

## Data each screen reads
- **status** `buildStatus(state)`: player, school (club, job, standing, spirit), `romance.partner`, hearts.
- **items** `buildItemList(state.inventory)` + `ITEM_BY_ID`; Use calls `game.sim.inventory.use(id)` for food/study items with `use`.
- **friends** `buildFriends(state)`: met characters only; order partner, romance options, `FRIEND_IDS`, others (hearts desc). Portrait: `game.art.getPortraitSheet(id)` else `ui.services.getPortraitSheet`, else a silhouette.
- **journal** `buildJournal(state, defaultQuests())`: `state.quests` + `{title, summary, main, steps}` from `src/content/quests/*` (unknown id -> prettified id). Main goals first, then active, complete, failed.
- **calendar** `buildCalendarData(state, season)` from `FESTIVALS/EXAMS/BREAKS` + birthdays of met NPCs (and "You"); `calendarDayLines` for the detail box. Moving past day 1/28 changes season inside the year.
- **records** `buildRecords(state, meta)`: `school.exams`, `reportCards`, `attendance`, `meta.endingsSeen`.
- **sleep** `buildSleepCard(summary, diffSnapshots(before, after))`. The diff needs a start-of-day snapshot: call `startDayTracking(game)` once at boot and after loading a game (it listens to `time:day` on `game.bus`); without it the card shows no money/hearts/subject lines. Notices come from `summary.dayInfo`.
- **save/load** `game.sim.save.list/write/read/delete` (falls back to the raw `save.js` module without a sim); `formatSlots`. Storage failures show a notice; memory-fallback writes say "this session only".
- **settings** `save.settings()` keys `masterVolume musicVolume sfxVolume textSpeed(1..3) keyHints`. `applySettings(game, settings?)` (exported; call at boot) sets `audio.setVolume`, `game.ui.services.settings.textSpeed` ('slow'|'normal'|'fast', read by `DialogueBox`) and `keyHints`, and `game.settings`.
- **ending** `selectEndingSlides`, `musicForSlide` (`mood` good -> `ending_good`; bittersweet/sad -> `ending_bittersweet`), backdrop `game.art.getEndingBackdrop(slide.art)` else a tinted gradient; records `endingId(state)` (`saved|merged` + `_partner|_solo`) with `save.recordEnding`.
- **credits** `CREDITS` (TextPage lines) then `buildStats(state, meta)`.

## Harness
`node scripts/build.mjs --entry src/dev/menus_demo.js --out dist/dev/menus_demo.html`, then open
`?scene=pause|sleep|save|load|settings|ending|credits|status|items|friends|journal|calendar|records` (`&tab=` for pause, `&live=1` real time).
`window.__menu = { step(n), tap(action), scene(), result(), open(name, params), game }`. It builds a mid-game state on the real sim and a stub `title`.

## Extending
- New pause tab: add `[id, 'Label']` to `PAUSE_TABS` and a panel factory to `FACTORIES` in `pause.js` (`{interactive, hint, refresh?, update(dt,input)->'back'|undefined, draw(ctx)}`); `registerMenuScenes` registers the direct scene name automatically.
- New settings row: add to `ROWS` in `settings.js` and to `normalizeSettings`.
- New data screen logic goes in `data.js` first, with a test.

## Known limits
- Labels avoid accents (font has none). Item/portrait/ending art are placeholders until `game.art` provides them.
- The calendar and journal detail panes clip long text instead of scrolling. Reset-all-data does not touch the running game state.
