# Handoff: art, academic scenes, menus, Nina/Elise routes and NPC schedules integrated (2026-11-21, ~08:10 UTC)

Audience: the orchestrating main session after a compaction/resume. Sequel to `20261120_09_story-integrated.md` (read it, 08 and 01-03 for the request, contracts and decisions).
**No-ask run still in progress** (it ends with the final report).

## What happened

- ~23:35 UTC (Nov 20) all five running workers died on the account usage limit again ("resets 3:10am UTC"); the session was restarted and the user typed "keep going" at ~07:24 UTC (Nov 21). The limit had
  reset; workers were resumed (t8a-scenes, t9b-menus, s2-romance by name; t3-world and t5-art only by raw agent id `a3aaf1a9054517742` / `a553941a6798b6baf`: the names were lost in the restart).
  Observation: usage behaves like a rolling 5-hour budget and five parallel workers burn it in ~1.5 h. Keep concurrency modest and scopes tight.
- **Integrated and verified by the lead** (main `npm test` 271/271, `npm run validate` 0 errors (25 warnings = missing pools/maps), `npm run build` OK):
  - **T5 art** (`src/art/**`, `docs/game/api/art.md`): sheets for the whole cast + extras (`appearanceFromSeed`), 8-expression portraits (+ blink/talk rows), icon atlas, cat, 4 title backdrops + logo, 6 ending backdrops.
    The lead rendered portraits/sprites to PNG (scratchpad `dump/*.mjs`): they look good. Rough spots: portrait fringes cover brows on a few characters; the logo's "s" reads a bit like "z".
  - **T8a scenes** (`src/scenes/academics/**`, `src/dev/academics_demo.js`): `class`, `exam`, `report_card`, `activity:study_home|study_library`, `registerAcademicScenes()`. One attention menu (4 choices); bell sfx id is
    `bell_school`; the art practical is skipped (`minigame:art_palette` not built); portraits are placeholders until the art service is wired.
  - **T9b menus** (`src/scenes/menus/**`, `src/dev/menus_demo.js`, `docs/game/api/menus.md`): `pause` (+ tabs status/items/friends/journal/calendar("Dates")/records/system), `sleep`, `save_menu`, `load_menu`, `settings`, `ending`, `credits`,
    `registerMenuScenes()`. **Wiring T9a must do**: call `startDayTracking(game)` at boot and after a load (needs `game.bus`) or the sleep card shows no deltas; call `applySettings(game)` at boot; `load_menu` pops
    `{loaded:true, slot, state}` and the CALLER builds the new sim; settings add `masterVolume`, `textSpeed` 1..3 read via `ui.services.settings.textSpeed`; `credits` resets to a registered `title` scene.
  - **S2 romance, Nina and Elise** (18 events: `_01_meet`, `_02_spark`, `_03_secret`, `_04_festival` + friend variant, `_06_confession`, `_09_promise`, two slice-of-life each; 30 talk + 8 repeat entries each; gifts; quests
    `nina_comeback`, `elise_manuscript`; 4 ending slides each). Not written: `_08_climax` (both) and a late-meet fallback for `nina_01_meet`. Nina's `_04_festival` is a `clock` event at 14:30 on `school_field` (the Sports Festival has no evening choice).
  - **NPC schedules (lead, in-session)**: `src/content/schedules/cast.js` generates schedules for 48 characters (named cast, 14 student extras, 8 townies) from compact personas + the timetable; tier-1 maps only (unbuilt-map activities are `null`);
    Class B follows lessons (PE on the field when dry, classroom when wet), exam days, free days (Sat/Sun/breaks), 13 festival windows staged on built maps; `test/content/schedules.test.mjs` (7 tests: coverage, PE, exams, festivals, no anchor clashes between
    named characters). Mr. Larkin and Dr. Patel have none (their shops are not built). Anchor check vs doc 04: scratchpad `qa/sched_check.mjs`. Some extras share spots (cosmetic): the NPC manager should offset actors that land on the same tile.
- Still running: `t3-world` (builder, stamps, indoor/street painters done; owes `src/world/index.js`, the three maps, previewer + tests, `world.md`).

## Where things live

New: `src/art/**`, `src/scenes/{academics,menus}/**`, `src/dev/{art_gallery,academics_demo,menus_demo}.js`, `src/content/{events/{nina,elise}_*,dialogue/{nina,elise},quests/{nina,elise},endings/{nina,elise},schedules/cast}.js`,
`test/{art,content/schedules,scenes/academics_logic,scenes/menus_data}*`. Briefs: `docs/game/briefs/*.md` (dispatch prompts say "read docs/game/briefs/<x>.md first").

## Process notes

- A PreToolUse hook blocks `git commit` unless a NEW handoff file already exists: write it with the Write tool in a separate call BEFORE the commit command (writing it inside the same Bash command fails).
- Integration recipe that works: verify in the worktree (`node scripts/gen-registry.mjs && node --test "test/**/*.test.mjs"`), `integrate-worktree.sh <path> <branch> <their BASE>`, then `npm test && npm run validate && npm run build` in main, `cleanup-worktree.sh`.

## Git state

Branch `claude/intelligent-edison-7ygncq`; this checkpoint follows `91dc28f`. **Push still blocked** (HTTP 403, GitHub App not installed): retry at checkpoints, report under Skipped.

## Open follow-ups (in order)

1. Wait for `t3-world`; verify in its worktree (BASE `26725ed1f010e208b0172a4d47f1d12a3c9fc4f1`), integrate, full checks, cleanup, commit with handoff.
2. Then dispatch (sonnet·medium except T9a sonnet·high; prompt = standing rules + brief path): **T9a core flow** (needs `world.md` + `art.md`), T4a (harbor, cafe_lantern, park, bakery, town_hall), T4b (grounds, field, rooftop, bell_tower),
   T4c (hall_1f, hall_2f, library). Meanwhile free slots: S3 (Clara, Mari, Vera), T8b scenes (shop, club practice, job, rest/nap/jog), S4b dialogue pools, S4a friend/town events.
3. Early playable Artifact as soon as T9a lands (same url `https://claude.ai/artifact/4LPrMM6ySuw2sn1DoeqyM4`), QA with playwright-cli, then the honest final report (Model·effort table, Decided without asking, Skipped: push blocked + tier-2 content +
   `_08_climax`/`_05`/`_07`/`_10` events, two usage-limit events, orchestrator-model note, in-session lead work).
