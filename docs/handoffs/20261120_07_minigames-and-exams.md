# Handoff: mini-games and exam banks built by the lead (2026-11-20)

Audience: the orchestrating main session. Sequel to `20261120_06_audio-built.md` (read 01-06: request, contracts, decision log, trimmed scope, rate-limit pause,
engine, UI, audio). **No-ask run still in progress.** The wake-up for the failed wave-1 workers is still scheduled for 23:43 UTC (`trig_01T7Zye17BNb4FQNkdMhuhki`);
resume procedure in handoff 03.

## What happened

- Still in the sub-agent rate-limit window, the lead built two more independent pieces itself (zero worker tokens):
  1. **Exam banks** (half of S4c, task #15 now PARTIAL): `src/content/exams/{math,literature,science,history,art,pe}.js`: 18 questions per subject (6 per tier 1-3), a `Q()` helper that rotates
     the correct answer position, factual school-level content; `test/content/exams.test.mjs` checks shape, uniqueness, length limits and answer-position balance.
  2. **Three tier-1 mini-games** (task #18 now PARTIAL): `src/scenes/activities/{logic,minigame,track_sprint,music_rhythm,cafe_serve,index}.js`, registered as `minigame:track_sprint|music_rhythm|cafe_serve`
     through `registerActivityScenes()` (T9a's boot must call it). Pure logic in `logic.js` (ranking, sprint scoring, seeded rhythm chart + scoring, café orders + scoring) is Node-tested
     (`test/scenes/minigames_logic.test.mjs`); harness `src/dev/minigames_demo.js` boots the REAL engine with the UI service and has a scripted autoplayer; docs in `docs/game/api/minigames.md`.
- Bugs found by actually running it and fixed: rhythm/café `playDraw` read undefined state during the countdown (constructor defaults), harness `run()` could not see the promise resolve inside a synchronous loop,
  café intro line overflowed its window, "sandwich" label crowded its button.

3. **Early preview PUBLISHED as an Artifact (private): https://claude.ai/artifact/4LPrMM6ySuw2sn1DoeqyM4** (version 1, icon "game"). Source: `src/dev/preview_arcade.js` ("Bellhaven Days: Preview Build",
   a launcher with the title music and the three mini-games on the real engine + UI + audio). Build: `node scripts/build.mjs --entry src/dev/preview_arcade.js --out dist/preview.html --artifact --title "Bellhaven Days"`
   -> publish `dist/preview.artifact.html`. **The FINAL game must be published to the SAME url** (pass `url: https://claude.ai/artifact/4LPrMM6ySuw2sn1DoeqyM4`, file from
   `node scripts/build.mjs --artifact` = `dist/index.artifact.html`) so the link the user already has keeps working. `--artifact` now names its output `<out>.artifact.html`.
   Before publishing I scanned the bundle: no fetch/XHR/WebSocket/eval/external URLs (only the XHTML namespace), single inline script. The hosted page itself was NOT opened/verified (no preview tool; the same
   build was verified locally through real keyboard input in headless Chromium).

## Verification done

`npm test` 73/73. All three mini-games run intro -> countdown -> play -> result through the real engine + UI upload path in headless Chromium: autoplayer got sprint silver (2nd, 12.68 s),
rhythm gold (29/29 perfect), café gold (12/12). I reviewed screenshots of every state (intro, race, rhythm lanes with PERFECT!, waiting customers with patience bars, result cards with medals).
This also proves the engine <-> UI contract (`beginFrame/endFrame/canvas/dirty` upload) works end to end.
NOT verified: with the real art icons (café uses placeholder letter icons until `ui.configure({drawIcon})` is wired), keyboard play by a human, touch play, game balance by a human, audio cues in a browser.

## Git state

Branch `claude/intelligent-edison-7ygncq`; this checkpoint adds exams + mini-games (previous: audio `29eaca1`, UI `6050e70`, engine `c44124f`). **Push still blocked** (HTTP 403, GitHub App not installed): local only.

## Open follow-ups

1. 23:43 UTC (or on resume): resume `t3-world`, `t5-art`, `t7a-sim`, `s1-story` (handoff 03); integrate (BASE `26725ed1f010e208b0172a4d47f1d12a3c9fc4f1`), verify, checkpoint.
2. Still to dispatch (trimmed scope): T7b events; T4a/b/c tier-1 maps; T9a core flow (calls `registerActivityScenes()`, audio init, `ui.configure` with art icons/portraits); T8a academics; T9b menus;
   T8b REMAINDER (shop scene, activity scenes rest/nap/jog/job_cafe/club_practice, `src/sim/{clubs,jobs,activities}.js`, club_practice fallback for clubs without a mini-game);
   S4c REMAINDER (schedules); S2/S3/S4a/S4b content; QA.
3. If time remains before 23:40 the lead can keep building unblocked pieces (candidates: shop scene needs T7a's `sim.shop` API: read it from T7a's worktree/doc once integrated).
4. Final report: rate-limit event, lead-built UI/audio/mini-games/exams (no subagent), objective-only verification of audio, trimmed scope + what was NOT built (tier 2), no push, orchestrator model note.
