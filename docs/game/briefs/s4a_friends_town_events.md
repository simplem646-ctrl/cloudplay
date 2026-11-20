# S4a brief: friends, staff and town events (src/content/events/**)

## Context
- Task #13 in the plan run by the orchestrator. Game: "Bellhaven Days", a Harvest-Moon-Back-to-Nature-style school life sim, all original; you write EVENTS (scripted scenes) as game data. The user will read every line: charm, humour, specificity.
- READ FIRST: `docs/game/03_STORY_BIBLE.md` (all; sections 5, 6, 9, 10 are yours), `docs/game/02_SIM_CONTENT_CONTRACTS.md` sections 8-9, `src/sim/script_dsl.js` (only ops/conditions allowed + builder helpers), `src/data/cast.js` (voices!), `src/data/calendar.js`, `src/data/ids.js`, `docs/game/04_WORLD_SPEC.md` (maps + anchors to stage on), `src/data/items.js`, `docs/game/api/story_main.md` (S1's main/festival ids and flags), `docs/game/api/events.md` + `src/sim/mock_stage.js` if present.
- Rules: same technical rules as the romance writers (event ids start with the owner prefix; triggers enterMap/talk/interact/wake/sleep/clock/auto; `repeat` once/daily/always; never hard-lock with wide windows; `say` <= 220 chars (ideal <= 150); choices 2-4 options <= 44 chars; faces from EXPRESSIONS; flags snake_case prefixed by owner; friend deltas in points).

## Required deliverables (TRIMMED SCOPE, token budget; files you own: `src/content/events/{jules,dante,owen,bruno,kit,roz,finch,rand,class,staff,town}_*.js`, `src/content/quests/friends.js`)
1. FRIEND events (stage ONLY on maps that exist in your tree; read `docs/game/api/world.md` for the built maps): `jules_01_guide` (Y1 Sp1 lunch tour, trigger `auto`, `when: seen main_02_homeroom`, time 11:30-17:00, see doc 03 section 10), `dante_01_rival` (PE/field), `owen_01_observatory` (stage in the library or school_grounds if the observatory map is missing), `bruno_03_farewell` (Y1 Winter 26, bittersweet). 25-50 ops each, funny + sincere, choices that move friendship and set flags.
2. FAMILY & TOWN: `roz_*` (4: Sunday phone call from Theo's parents, a café rush morning, her worry about the school, a midnight talk via trigger `sleep` or clock 23:00), `finch_*` (3: the bell, his workshop/harbor bench, trust-building that matches `story_main.md`).
3. `rand_*` RANDOM EVENTS (6, kind `random`, small slice-of-life with `{ chance: p }` gates and place/season/weather conditions: found coin, stray cat, shared umbrella, dropped notes, a tune from the music room, a seasonal vignette).
4. `class_*` CLASS VIGNETTES (10 across the six subjects; kind `class`; trigger `auto` in `school_classroom`; `when` includes `{ schoolDay: true }` plus small `chance`; teacher flavour lines, a joke from Jules, Clara's perfect answer, Dante's boast, Owen's statistic; `repeat: 'daily'`).
5. `src/content/quests/friends.js` for any quests you use. `npm run validate` 0 errors for your files; `npm test` green; run every script once with MockStage (if `src/sim/mock_stage.js` exists), forced-true conditions, no exceptions.

## Tools
- `npm ci --prefer-offline`, `npm run validate`, `npm test`.
