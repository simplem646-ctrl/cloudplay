# Handoff: activity scenes integrated (shop, club practice, cafe job, rest, nap, jog) (2026-11-21, ~10:00 UTC)

Audience: the orchestrating main session after a compaction/resume. Sequel to `20261121_04_s4a-events-and-anchor-test.md` (read it first, then 03 for the worker list and the worktree-base quirk).
**No-ask run still in progress** (it ends with the final report).

## What happened

- `t8b-scenes-b` (sonnet·medium) finished and was **integrated** (verified by the lead in main: `npm test` 346 tests, 345 pass, 1 skipped (the strict "all 26 maps" check), `npm run validate` 0 errors, `npm run build` OK):
  `src/scenes/activities/{shop,activity_club,activity_job,activity_rest}.js` (+ registrations in `index.js`, `src/dev/activities_demo.js`, `test/scenes/activities_logic.test.mjs`, an appended section in `docs/game/api/minigames.md`).
  Registered scene names: `shop`, `activity:club_practice`, `activity:job_cafe`, `activity:rest`, `activity:nap`, `activity:jog` (plus the three mini-games). The worker drove each scene through the real engine/UI/sim (shop purchase, club practice via the fallback timing drill, a real cafe shift paying $45, rest/jog results).
- Result shapes worth knowing for T9a/QA: `activity:club_practice` returns `rank` = club rank 0-5 after practice (+ `medal`, `score`); `activity:job_cafe` returns `rank` = the medal, or `null` when no shift happened; a cancelled/missing club mini-game means no practice; shop rows are dimmed and labelled "too dear" / "bag full" / "sold out".
- Not re-viewed by the worker after its last change: the shop panel's money and opening-hours layout. Portraits/icons are placeholders in the harness (no art service), they light up when T9a wires `game.art`.
- Still running at time of writing: `t9a-flow` (T9a core flow, worktree base `65ad962`; has the 12 new maps copied in as untracked files: delete `src/world/maps/{cafe_lantern,town_harbor,bakery,school_grounds,school_hall_1f,school_hall_2f,school_rooftop,bell_tower,school_library,school_field,town_park,town_hall}.js` from it before integrating),
  `s3-romance-b` (base `65ad962`), `s4b-pools-b` (base `d030090`).

## Git state

Branch `claude/intelligent-edison-7ygncq`; this checkpoint follows `f01527c`. **Push is still blocked** (HTTP 403: the Claude GitHub App is not installed for `simplem646-ctrl/cloudplay`; the user must install/reconnect it at https://claude.ai/connect-github; retried several times this session, same error). All commits are local.
Reminder: write the handoff file with the Write tool BEFORE the `git commit` command (a hook blocks commits without a new handoff).

## Open follow-ups

1. Wait for `t9a-flow`, `s3-romance-b`, `s4b-pools-b`; verify in each worktree, integrate (stage lead edits first), full checks (`npm test`, `npm run validate`, `npm run build`, `node --test test/content/anchors.test.mjs`), cleanup, commit with handoff.
2. After T9a: QA with `node scripts/shot.mjs dist/index.html --script flow.mjs` using `window.__game.debug`, fix what breaks, publish the early playable Artifact (same url `https://claude.ai/artifact/4LPrMM6ySuw2sn1DoeqyM4`), then the honest final report (Model·effort table, Decided without asking, Skipped: push blocked, tier-2 maps/mini-games/events, usage-limit events, worktree-base quirk, orchestrator-model note, in-session lead work).
