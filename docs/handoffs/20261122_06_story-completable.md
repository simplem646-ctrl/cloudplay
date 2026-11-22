# Handoff: the story is provably finishable — T16 blockers fixed (2026-11-22)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `20261122_05_qa-pass-fixes.md` (see `20261121_01_*` for request/design/decisions; `20261121_04_*` for the usage‑limit recovery recipe).
**NO‑ASK RUN IN PROGRESS** (never call AskUserQuestion; log decisions; ends with the final report). User‑facing text in Indonesian.

## What happened
- Artifact **v2** (QA fixes) was republished to https://claude.ai/artifact/JckDuu1gSS5WLBogdCvDY9 before this task; **v3 must be republished from the rebuilt `dist/artifact.html` after this commit**.
- **T16 story completability (`sonnet·high`, unisolated lone writer) finished.** New: `tools/analyze-content.mjs` (`npm run analyze`, exit ≠ 0 on blockers, `--json`), `tests/unit/content-obtainable.test.mjs` (6 tests incl. negative controls proving the analyzer flags broken content), `tests/unit/sys-story.test.mjs` + `fixtures/sys-story-player.mjs` (8 tests, ~8 s: tutorial → m1–m9 → Winter 24 → friends ending; a slow player with nothing done; the stalls; romance variants for Mira (declines the first confession, accepts the second), Willa, Juno, Rhea, Celeste incl. their lantern gates and `ending_together_*`), `docs/game/WALKTHROUGH.md` (SPOILERS; "tested" = that path ran). Static analysis covers all 32 quests: item sources, schedules, building hours, jobs, hearts pace, main‑chain dates, missing `call` targets, soft‑locks, whether each event's trigger is physically possible.
- **Real blockers found and fixed:**
  1. **Peddler and flower stall could not be opened** (`counter: null`): `src/systems/interaction.js` NPC menu now offers **"Browse wares"** for a stall owner.
  2. **`heart_mira_4`** needed the bakery open 06:00–07:00 but it opens at 07:00 → now triggers from `town_square` (`heart_mira.js`).
  3. **`heart_rhea_8`** needed the café on Monday but the café is closed Mondays → now triggers from `town_square` (`heart_rhea.js`).
  4. **`heart_willa_8`** fired only on Autumn 14 itself → `trigger:false`, with a line variant when no crowd is present (`heart_willa.js`).
  5. **All five 8♥ confessions were `once:true`** so "I need a little more time" lost the romance forever → now `once:false` + `cooldownDays:7`, eligible until `<npc>_dating` is set (`_heart.js`; `tools/validate-content.mjs` allows this for `heart_*_8` only).
  6. `m6_cafe` quest text wrongly said the peddler sells cocoa beans → says the café.
- **Lead verification:** changed files match the report exactly; `npm test` **255/255**; `npm run analyze` **0 blockers** (info only: books/feather listed as "never obtainable" are library/collection entries); read the `_heart.js` and `interaction.js` diffs (retry logic is sound: after acceptance `<npc>_dating` blocks the event); full chain re‑run (`build`, `build:artifact`, `check:artifact` OK; `e2e` re‑running at commit time — first steps passed; T16's own run: all steps green in 180 s).

## Known issues (honest list)
- **Give‑quests take one item per day** (`giftFlow` hands over one item): e.g. 3 sea glass = 3 gift days; sea glass is the rarest main‑quest item (m5 took 18 sim days). Not a blocker; a "hand over the whole stack" option is the proposed fix.
- Closed building sign doesn't show opening hours although HOW_TO_PLAY says it does; calendar birthday list wraps date and name; touch prompts say "Space: …"; B doesn't dismiss narration; an NPC in front of a noticeboard/counter still wins the prompt (use the NPC menu entry).
- Not verified: audio never heard; touch on a real device; real safe‑area insets; real‑hardware frame rate (sandbox ≈ 4 fps). The simulation teleports instead of walking and uses fake minigames; heart/event staging was checked by brute‑forcing conditions and a scripted player, not by a human.
- Dialogue depth is the short baseline (T12/T13 deferred).

## Decided without asking (additions)
| Decision | Chosen | Why |
|---|---|---|
| Next: polish agent (bulk hand‑in for give‑quests, opening hours on closed doors, calendar wrap, touch "A:" prompts), then a depth agent for the 20 heart events + endings | yes, sequentially, unisolated | both guarded by `analyze` + `sys-story` + e2e; the artifact (v3) is published first so a usage cutoff cannot lose the deliverable |
| `playwright-cli` inspection of the final bundle after v3 | yes | the user asked for it; the docker CDP browser reaches the host at `http://172.17.0.1:<port>` |

## Git state
Branch `claude/keen-bell-6isjol`, this commit = T16 fixes + analyzer + story simulation + walkthrough + handoff, pushed. No worktrees. Window ends ≈ 17:10 UTC (now ≈ 14:30).

## Open follow‑ups
1. Republish artifact v3. 2. `playwright-cli` inspection. 3. Polish agent, then depth agent (each: verify with `npm test && npm run analyze && build && build:artifact && check:artifact && e2e`, commit, republish). 4. Final honest report in Indonesian (what works, what was tested, what is unfinished, how to play: artifact link + how to run locally).
