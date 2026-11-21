# Handoff: twelve more maps integrated (15/26) + friend, Roz and Finch events (2026-11-21, ~09:30 UTC)

Audience: the orchestrating main session after a compaction/resume. Sequel to `20261121_02_world-core.md` (read it, then 01 and `20261120_08/09` for the request, contracts and decisions).
**No-ask run still in progress** (it ends with the final report).

## What happened

- **Four T4 map workers finished and were integrated** (main `npm test` 332 pass / 1 skipped (strict "all 26 maps" check), validate 0 errors, build OK, 15 of 26 maps):
  - PATH-1: `cafe_lantern`, `town_harbor` (lead looked at the spring PNG: shopfront row, cobbled promenade, quay with fish stalls, dock with benches, moored boats, islet lighthouse, sand cove: lovely), `bakery`.
  - PATH-2: `school_grounds` (bell tower over the main door, stage/stalls for festivals), `school_hall_1f`, `school_hall_2f` (class A/C/council doors are `door_locked`).
  - EXTRA-1: `school_rooftop` (tower warp with `requires main_rope_found`), `bell_tower`, `school_library`, `school_field`.
  - EXTRA-2: `town_park`, `town_hall` (every anchor the main-story events use exists).
  Together with T3's `town_square`, `home_theo`, `school_classroom` the whole path home -> cafe -> harbor -> square -> grounds -> hall 1F -> hall 2F -> classroom is walkable. Not built (tier 2): beach, flower_shop, bookstore, corner_mart, clinic,
  school_cafeteria, school_art_room, school_music_room, school_gym, hill_observatory, observatory_dome (their warps/anchors exist as ids; the overworld must show a locked-door line).
  Painters the map workers faked and asked for (optional polish, lead work in `src/world/tiles.js`): lighthouse tower, boat hulls/sails, crates/barrels, bollards, nets, gulls, jukebox, espresso machine, bread cases, hanging indoor lantern, trophy case, bell + rope, chain/padlock overlay,
  drinking fountain, computer, goal net, track lane lines, hurdles, bandstand roof, playground equipment, picnic baskets, stage curtains, lobby clock.
- **Lead wrote part of S4a in-session** (friend/town events; the rest of S4a is still to do): `src/content/events/jules_friends.js` (`jules_01_guide`, `dante_01_rival`, `owen_01_observatory`, `bruno_01_captain`, `bruno_03_farewell`, `kit_01_admirer`) and
  `src/content/events/roz_town.js` (`roz_01_sunday_call`, `roz_02_cafe_rush`, `roz_03_worry`, `roz_04_midnight`, `finch_01_tide_tea`, `finch_02_gull_feud` (kind random), `finch_03_old_photograph`). All pass validate and the 4-policy MockStage smoke test (77 events total).
  Still owed from S4a: `rand_*` random events (6), `class_*` classroom vignettes (~10, trigger `auto` in `school_classroom` during breaks/homeroom, windows chosen by weekday/time), `jules_02_press`, `dante_02_crush` etc. are tier 2.
- Dispatch state at time of writing: running `t9a-flow` (T9a, sonnet·high), `s3-romance-b` (Clara, Mari, Vera), `t8b-scenes-b` (shop, club, job, rest/nap/jog scenes). Worktree-base quirk persists (new worktrees start at `26725ed`); dispatch prompts carry the orchestrator-granted
  "`git reset --hard <BASE>` once if HEAD differs and the tree is clean" exception, and it works.

## Where things live

`src/world/maps/*.js` (15 maps), `src/content/events/{jules_friends,roz_town}.js`. Map style references: `town_square.js`, `town_harbor.js`, `school_grounds.js`. Dump PNGs without a browser: `node test/world/dump_maps.mjs <outDir> <mapIds> --seasons=spring,winter --scale=1 [--overlay]`.

## Git state

Branch `claude/intelligent-edison-7ygncq`; this checkpoint follows `65ad962`. **Push still blocked** (HTTP 403, GitHub App not installed): retry at checkpoints, report under Skipped.
Reminder: write the handoff file with the Write tool BEFORE the `git commit` command (a hook blocks commits without a new handoff).

## Open follow-ups (in order)

1. Wait for `t9a-flow`, `s3-romance-b`, `t8b-scenes-b`; verify each in its worktree (BASE `65ad9624b584e1f91e762240aa2c76e363914ee4`), integrate (stage lead edits first with `git add -A`), full checks, cleanup, commit with handoff.
   When the maps are committed, copy `src/world/maps/*.js` into t9a's worktree and ask it to test travel along the path (SendMessage by name `t9a-flow`).
2. Dispatch S4b dialogue pools (brief `docs/game/briefs/s4b_dialogue_pools.md`, owner prefix list in the prompt used earlier: all non-romance NPCs + `_extras.js`) when a slot frees; finish S4a leftovers in-session (rand_*, class_*).
3. Early playable Artifact as soon as T9a lands (same url `https://claude.ai/artifact/4LPrMM6ySuw2sn1DoeqyM4`), QA via playwright-cli/`scripts/shot.mjs`, honest final report (Model·effort table, Decided without asking, Skipped: push blocked, tier-2 maps/mini-games/events, `_08_climax`/`_05`/`_07`/`_10`,
   usage-limit events, worktree-base quirk, orchestrator-model note, in-session lead work).
