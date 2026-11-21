# Handoff: the core game flow is integrated, the game is playable end to end (2026-11-21, ~13:30 UTC)

Audience: the orchestrating main session after a compaction/resume. Sequel to `20261121_06_all-five-routes.md` (read it first; 03 has the worktree-base quirk). **No-ask run still in progress** (it ends with the final report).

## What happened

- `t9a-flow` (sonnet·high; ~47 min, ~460k tokens, survived one usage-limit stall) finished and was **integrated** (main: `npm test` 355 tests, 354 pass, 1 skipped (the strict "all 26 maps" check), `npm run validate` 0 errors / 0 warnings, `npm run build` OK:
  `dist/index.html` is now the real game, 1538 KB). Files: `src/main.js` (28 lines changed), `src/scenes/{boot,index,session,title,overworld,stage,interactions,npc_manager,npc_plan,anchors,triggers,presentation,directors,debug,actors}.js`, `src/dev/flow_playthrough.js`,
  `test/scenes/flow_pure.test.mjs`, `docs/game/api/scenes.md` (how the game is assembled, flows, the Stage, NPC manager, directors, the `window.__game.debug` API: warp/setTime/setDate/giveMoney/giveItem/setFlag/addFriend/setStat/sleep/skipDays/runEvent/listEvents/state/loadState/press/screenshot/waitIdle/walkTo/teleport/talkTo/npcs/where/autoAdvance/overlay/fps).
- The worker's own scripted run (title -> New Game -> wake -> real travel home -> cafe -> harbor -> square -> grounds -> halls -> classroom with 19 NPCs seated, a talk with Nina, locked-door line, bed -> sleep scene -> next morning) had no console errors; fps 56-60 on software WebGL.
  It did NOT exercise: the pause menu, the gift flow, Continue-from-title, forced sleep (02:00) and energy collapse (unit tests only), and (in its tree) the `shop` / activity scenes (they were not in its BASE; now registered through `REGISTRARS` in main).
- Worker decisions: the camera follows Theo rigidly (no smoothing, keeps the pixel grid stable); `title` creates a throw-away sim at boot so menus have a `game.sim`; the bed confirm defaults to "Not yet"; `debug.runEvent` is not awaited (use `waitIdle`); lit windows/lamps are point lights;
  a collapse with no clinic map falls back to home; NPCs walk only during normal play (after a class/study scene they snap to schedule).
- All 12 task workers' branches/worktrees are cleaned; `git worktree list` shows only the main checkout.

## Git state

Branch `claude/intelligent-edison-7ygncq`, pushed through `6309dfa`; this checkpoint follows it. Reminder: write the handoff file with the Write tool BEFORE the `git commit` command (a hook blocks commits without a new handoff).

## Open follow-ups

1. **QA (lead, in-session, `node scripts/shot.mjs dist/index.html --script <flow.mjs>`; `window.__game.debug` is the scripting API)**: title -> new game -> first morning; school route; classes (director at the bell), exam day, report card; shop / job / club / rest scenes; gifts and talk; pause menu; save / load / Continue; forced sleep; a full week via `skipDays`. Fix what breaks.
2. Publish the early playable Artifact to the SAME url `https://claude.ai/artifact/4LPrMM6ySuw2sn1DoeqyM4` (`node scripts/build.mjs --artifact` writes `dist/index.artifact.html`; load the `artifact-design` skill first, keep the contract: single fragment, `<title>` 2-4 words, sound after first gesture).
3. Final report (honest): Model·effort table (workers: sonnet high/medium, one opus·medium story worker; lead in-session work: T7b events, academics/club/job rules, schedules, S4a events, QA), Decided without asking, Skipped (tier-2: 11 maps, 4 mini-games, `_05/_07/_08/_10` romance events, per-club endings, hand-painted extras such as boats/lighthouse), the three usage-limit stalls, the worktree-base quirk, the orchestrator-model note (session ran Sonnet 5.5; the skill expects Opus), what was and was not tested (audio never heard).
