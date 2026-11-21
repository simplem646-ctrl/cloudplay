# Handoff: first QA pass over the integrated game (2026-11-21, ~14:30 UTC)

Audience: the orchestrating main session after a compaction/resume. Sequel to `20261121_07_playable-core-flow.md` (read it first). **No-ask run still in progress** (it ends with the final report).

## What was tested (lead, real game, host Playwright via `scripts/shot.mjs --script`, `window.__game.debug` as the driver)

Scripts live in the scratchpad `/tmp/claude-0/-home-user-cloudplay/a12cffcd-0bbf-5bf9-b5fa-e7cad974b968/scratchpad/qa/` (`school.mjs`, `life.mjs`, `forced.mjs`, `acts.mjs`, `hall*.mjs`, `blockers.mjs`, `sched_check.mjs`; may be gone). All of this ran without page errors; fps 56-60 on software WebGL.
- Worker's playthrough (`src/dev/flow_playthrough.js`) in main: title -> New Game -> wake event with portraits -> home -> cafe -> harbor -> square (locked-door line on unbuilt maps) -> grounds -> halls -> next morning. OK.
- Academics through the real director: at the bell the `class` scene opens (attendance recorded, math +2, clock to the end of the period); on an exam day the `exam` scene opens at 08:30 (score stored in `school.examPending`, -10 energy, 80 min); on results day (15:10) the `report_card` scene opens and `school.exams['Y1_midterm1']` is written. OK.
- Talk with Nina (friendship rises), shop (bakery counter: `ShopScene`, buying works: money and inventory change), café counter + school vending machine shops, `StudyHomeScene`, `StudyLibraryScene`, `RestScene`, `ClubPractice` (with `school.club = 'track'`), `JobCafe` (opens; the 45 s mini-game was not played), board (modal list), trophy-case text, calendar interactable -> pause calendar tab, pause menu -> System -> Save (localStorage key `bellhaven_days_v1:slot1`) -> page reload -> title shows "Continue: Spring 1, Year 1 Theo's Room" -> Continue restores the game. OK.
- Forced sleep at 02:00 (`setTime('25:55')`): the night pipeline runs, sleep scene, wake at 09:00 in Theo's room, conduct -1, flags `sim_forced_sleep` + `sim_missed_homeroom`; zero-energy collapse at 15:00: wakes at home (clinic map missing) around 17:00 with energy 40 and absences counted. OK.
- Looks (screenshots read by the lead): title screen (autumn/spring variants, logo, menu), wake dialogue with portrait, hall 2F with HUD, class pop quiz (panels are translucent and the classroom shows through: slightly busy, readable), report card (parchment, grades, rank, teacher comment), shop with Aunt Roz's portrait. All in the intended pixel style.

## Fixes made during QA

- `src/content/schedules/cast.js`: Roz's lunch spot moved from `cafe_lantern:kitchen` (it blocked the stairs door to Theo's room 11:30-13:00) to `npc_2`.
- New test `test/content/npc_blockers.test.mjs`: with every scheduled NPC standing on its anchor (10 representative days, 15 min steps) every warp stays reachable from the entrance (it caught the Roz case).
- `src/scenes/academics/report_card.js`: title now says "BELLHAVEN HIGH" (was "ACADEMY").

## Known rough spots / not tested

- `debug.walkTo` plans a path once and returns false when an NPC steps into it (debug helper only; the player walks manually in real play).
- Shop: after Cancel the keeper's goodbye needs a Confirm (cancel does not skip it).
- Not played: the café-job mini-game, the other two mini-games from the overworld, gifts through the ChoiceBox (the talk path ran), endings/credits, a full year, audio by ear (never heard), touch controls.
- Class pop-quiz panels are translucent over the classroom backdrop (cosmetic).

## Git state

Branch `claude/intelligent-edison-7ygncq`, pushed through `9135a2b`; this checkpoint follows it. Reminder: write the handoff with the Write tool BEFORE `git commit` (a hook blocks commits without a new handoff).

## Open follow-ups

1. Publish the playable Artifact to the SAME url `https://claude.ai/artifact/4LPrMM6ySuw2sn1DoeqyM4` (`node scripts/build.mjs --artifact` -> `dist/index.artifact.html`; load `artifact-design` first; the old page was a mini-game launcher).
2. More QA: gifts, café job + other mini-games from the overworld, ending/credits (`debug.setDate(3,'winter',28)` + `sleep`), a simulated year via `debug.skipDays`, touch controls; polish rough spots; optionally tier-2 content if budget remains.
3. Final report (honest): Model·effort table, Decided without asking, Skipped (tier-2 maps/mini-games/events, `_05/_07/_08/_10` romance events, per-club endings, extra painters), three usage-limit stalls, worktree-base quirk, orchestrator-model note (session ran Sonnet 5.5; the skill expects Opus), what was not verified (audio by ear).
