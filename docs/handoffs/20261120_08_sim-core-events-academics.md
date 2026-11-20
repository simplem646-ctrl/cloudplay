# Handoff: sim core integrated + events/academics/activities rules built (2026-11-20, ~23:20 UTC)

Audience: the orchestrating main session after a compaction/resume. Sequel to `20261120_07_minigames-and-exams.md` (read 01-03 for the request, contracts,
decision log and the trimmed-scope rules; 03 has the tier lists). **No-ask run still in progress** (it ends with the final report).

## What happened this session

- **The API limit lifted earlier than the stated 23:40 UTC**: at ~23:11 `SendMessage` resumed workers fine. Resumed: `t7a-sim` (finished in ~90 s), `t3-world`, `t5-art`,
  `s1-story` (all three still running when this was written; each got a strict "finish ONLY core deliverables, <= 4 screenshots, reply <= 250 words" brief).
  The scheduled wake-up `trig_01T7Zye17BNb4FQNkdMhuhki` (23:43) is now redundant; ignore or delete it.
- While rate-limited the lead built **in-session** (a deviation from "delegate everything": the workers could not run, the rules are pure and test-heavy, and the
  lead had the contracts in hand; scenes stay delegated): 
  - **T7b** `src/sim/{conditions,interpreter,events,dialogue,endings,mock_stage,events_system}.js`, `docs/game/api/events.md` (how scenes use it, when to ask which trigger).
  - **T8a rules** `src/data/timetable.js`, `src/sim/{academics,exams,school_director,academics_index}.js`, `docs/game/api/academics.md`.
  - **T8b rules** `src/sim/{clubs,jobs,activities}.js` (tests: `test/sim/t8b_activities_logic.test.mjs`).
  - Tests: `test/sim/t7b_*`, `t8a_*`, `t8b_*`, `t9_longrun_smoke` (3 simulated years: 336 days, 72 exam sittings, 12 report cards, 0 problems) and
    `test/content/events_smoke.test.mjs` (runs every catalog event under 4 choice policies; passes trivially while the catalog is empty, ran 132 clean runs on S1's 33 events in a scratch overlay).
- **T7a integrated** (sim core: clock, calendar, weather, relationships, inventory, items, shops, schedules, save/load, `createSim` facade; 81 of its own tests; `docs/game/api/sim.md`).
  Its worker's decisions: relationship decay needs a `peak` of 30 points (optional field), meal penalty only when >= 2 meals skipped, extra `clock.collapse`, the date only changes in `sleep()`
  (`advance` never rolls the day), hook registry is module-level (`createHookRegistry()` for tests).
- Lead decisions logged (no-ask): `time` conditions and `trigger.time` windows are half-open `[from, to)`; `ctx.time` is an alias of `ctx.minute`; PE is on `school_field` when dry and in the classroom when wet;
  standing comes from the RUNNING exam average, probation sets `remedialDays = 5` (forced library hour after school 15:10-16:30 on school grounds); results day = 15:10 report card, processed lazily by the director
  with the night hook as a safety net; an exam sitting may start <= 15 min late, later = zero; scene entry points are discovered at boot through the generated `src/_generated/registrars.js`
  (`REGISTRARS`), kept in a SEPARATE generated file so content/sim modules never sit in an import cycle with scene modules.
- Quality checks by the lead: rendered T3's tileset atlas and T5's character sprites to PNG (scratchpad `dump/*.mjs`, no DOM needed): both look genuinely good (HM-style 16x16 tiles with outlines;
  16x24 chibi sprites with distinct hair/outfits, 4 directions). Told both workers not to redo them.
- Balance observation from the long-run bot (diligent: attends everything + 2 h study/day): every subject reaches 100 during Year 2 and the bot ranks 1st-2nd from Year 1's finals on
  (Clara ~90-98 is the only rival). Fine for now; if exams feel too easy in QA, lower study gains in `src/sim/balance.js` (`stats.studyGain`) or strengthen classmates in `exams.classmateAverages`.

## Where things live

`src/sim/` T7a modules + lead's `{conditions,interpreter,events,dialogue,endings,mock_stage,events_system,academics,academics_index,exams,school_director,clubs,jobs,activities}.js`;
`src/data/{timetable,items,shops}.js`; generated (gitignored) `src/_generated/{registry,registrars}.js` (`npm run gen`); docs `docs/game/api/{sim,events,academics}.md` (+ engine, ui, audio, minigames).
Scratchpad briefs (updated, trimmed scope): `/tmp/claude-0/-home-user-cloudplay/a12cffcd-0bbf-5bf9-b5fa-e7cad974b968/scratchpad/briefs/` (`t8a_academics.md` and `t8b_activities.md` are now SCENES-ONLY briefs;
`t9a_core_flow.md` mentions `createEventSystem`, `REGISTRARS`; `romance_common.md`, `s4a/b/c`, `t4_maps_template.md`, `t9b_menus.md` unchanged).
Scratch overlay used for verification before integration: `.../scratchpad/overlay` (disposable).

## Verification done

- Main checkout after integrating T7a: `npm test` = 240 tests, 0 fail; `npm run validate` = 0 errors (40 warnings: dialogue pools etc. that do not exist yet); `npm run build` OK (still the stub `src/main.js`).
- NOT verified: nothing of the academics/club/job/activity rules has been exercised through real scenes (scenes do not exist yet); audio never heard; the t3/t5/s1 outputs are unintegrated.

## Git state

Branch `claude/intelligent-edison-7ygncq`. This checkpoint commit follows `3ac873b`. **Push is blocked** (HTTP 403, Claude GitHub App not installed for `simplem646-ctrl/cloudplay`): retry `git push -u origin HEAD`
at checkpoints; report under **Skipped**. Live worktrees: t3-world `agent-a3aaf1a9054517742`, t5-art `agent-a553941a6798b6baf`, s1-story `agent-af86ea4b35f16b61c` (BASE `26725ed1f010e208b0172a4d47f1d12a3c9fc4f1`).

## Open follow-ups (in order)

1. Wait for `t3-world`, `t5-art`, `s1-story` reports -> verify in each worktree (`npm test`, spot-check one PNG) -> `integrate-worktree.sh <path> <branch> 26725ed...` (stage lead edits first: `git add -A`) ->
   `npm test && npm run validate && npm run build` -> `cleanup-worktree.sh` -> checkpoint commit with handoff. S1 owes: `fest_entrance_ceremony`, `fest_blossom_day`, `fest_bell_festival` (3 validator errors in a scratch run), quests/main.js, endings/main.js, story_main.md.
2. Dispatch next (sonnet·medium, strict budgets, from the new HEAD so they get sim+events+rules): S2 (Nina+Elise), S3 (Clara+Mari+Vera) [`romance_common.md`], S4c schedules, S4b pools, S4a friends/town, T4a/b/c tier-1 maps (after T3 lands), T8a-scenes, T8b-scenes, T9b menus;
   then T9a core flow (needs T3 + T5 integrated; sonnet·high). Keep <= 5 agents; tokens are the scarce resource (one window was burned by 5 parallel high-effort workers).
3. Final: build `dist/index.artifact.html` (`node scripts/build.mjs --artifact`) and publish to the SAME url `https://claude.ai/artifact/4LPrMM6ySuw2sn1DoeqyM4`; early playable Artifact as soon as T9a lands; QA with playwright-cli; honest report with
   Model·effort table, "Decided without asking", "Skipped" (GitHub push blocked; tier-2 maps/mini-games/romance events not built), the rate-limit event, orchestrator-model note (session ran Sonnet 5.5; skill expects Opus), in-session lead work list above.
