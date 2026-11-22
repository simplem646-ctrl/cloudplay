# Handoff: real main.js, loading screen, Artifact build, e2e (2026-11-22)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `20261122_03_world-facing-systems-integrated.md` (see `20261121_01_*` for request/design/decisions; `20261121_04_*` for the usage‑limit recovery recipe).
**NO‑ASK RUN IN PROGRESS** (never call AskUserQuestion; log decisions; ends with the final report). User‑facing text in Indonesian.

## What happened
- **T14a integration (`sonnet·high`, lone unisolated writer in the main checkout) finished** (13 modified + 4 new files, all within its stated ownership; checked against `git status`):
  - `src/main.js` = the play‑lab wiring for the real stack (real audio + portraits), params `?q`, `?autostart=<name>`, `?skipPrologue=1`, `?fast=1`, exposes `window.__game = {Game, Systems, LB, svc, Data}`, applies saved volume settings, plays the title theme on entering title mode, wires the Settings quality button to `world.setQuality`. HUD hidden at the title. `index.html` has `BUILD:STYLE`/`BUILD:BODY` markers + a pure‑CSS loading screen ("Lighting the lanterns…") with a progress bar driven by `world.init`'s `onProgress` (it now yields to a paint between texture slices).
  - `tools/build.mjs --artifact` → **`dist/artifact.html`**, an Artifact‑page FRAGMENT; `tools/check-artifact.mjs` (`npm run check:artifact`) wraps it in a simulated Artifact skeleton and boots it via `file://` and the local server. `npm run e2e` (`tests/e2e/smoke.cjs`, ~85 s, 13 steps) drives the PRODUCTION bundle with Playwright. `docs/game/HOW_TO_PLAY.md` written.
  - **Bug fixes found by T14a:** the day‑summary card and narration were invisible behind the black fade (sleep showed a black screen) → z‑index fix in `src/ui/styles.js` (e2e now asserts the card is visible); touch Run button was hidden under A/B; tracked quest never reached the HUD and the Track button toggle disagreed with Systems (`src/ui/hud.js`, `menu_tabs.js`); the audio module created an AudioContext before any gesture and logged warnings → now creates it on the first key/pointer (`src/audio/index.js`, test `audio-gesture.test.mjs`); festival guests sharing an anchor now get stable per‑id spots (`src/systems/npcs.js`, test added); the west oak/trees of `town_square` moved so the player isn't hidden at the west spawn; HUD/touch overlay respect `env(safe-area-inset-*)`.
- **Lead verification:** `npm test` **239/239**; `npm run build` (dist/index.html 1.52 MB) and `npm run build:artifact` (dist/artifact.html 1.52 MB) OK; **independent fragment lint** (no `<!doctype>/<html>/<head>/<body>`, no `claude:viewport-fit-sides`, `<title>Lanternbrook Days</title>` at byte 0, the only external reference is the Google Fonts stylesheet, one inline script, no external scripts, no dialog calls); `npm run check:artifact` re‑run by the lead: **OK, 38 checks** (boots, loading overlay removed, canvas 1280×720, title UI present, HUD hidden at title, mode `title`, no horizontal scroll, no page/console errors, only Google Fonts hosts requested); `npm run e2e` re‑run in progress at commit time — the first 3 steps passed (boot, title with HUD hidden, **keyboard‑only new game incl. name and swatches**); T14a's own run passed all 13. Screenshots reviewed: title over the real Brook Lane scene, "A new arrival" form with live chibi preview, day‑summary card (now visible), artifact‑wrapped boot identical to the full page, phone‑landscape touch layout (stick, A/B/Run, menu, HUD).

## Known issues / not verified (honest list)
- Not exercised in a browser by anyone: **successful fishing minigame via real input**, **kneading minigame via real input**, **parcel run**, **lamplighter job**, **heart events**, seasons/weather transitions over time, real safe‑area insets (headless = 0 px), touch on a real device. T14a checked their argument shapes statically.
- Touch prompts still say "Space: Mail"; the B button doesn't dismiss narration; the loading bar moves in coarse steps (long synchronous boot stretches); several NPCs may still crowd festival anchors (min spacing ≈ 0.92 tiles); audio has never been heard (headless) — only analysed offline.
- Dialogue/heart events are the short baseline (T12/T13 depth deferred, optional).

## Decided without asking (additions)
| Decision | Chosen | Why |
|---|---|---|
| Publish the Artifact BEFORE the QA/fix pass, then republish | yes | guarantees a playable deliverable exists early; republish keeps the same URL |
| Next: ONE QA‑and‑fix agent (`sonnet·high`, unisolated) instead of verifier + separate fixers | yes | fewer handoffs, saves usage; it plays the unverified list above and fixes what breaks |

## Git state
Branch `claude/keen-bell-6isjol`, this commit = T14a work + this handoff, pushed. No worktrees. Strays (old headless chromium / serve processes) were killed.

## Open follow‑ups
1. Publish `dist/artifact.html` (`Artifact` tool: `file_path`, `icon: "lantern"`, one‑sentence description; quickstart already done — the page contract is satisfied) → give the user the link.
2. QA‑and‑fix agent over the "not exercised" list; rebuild; re‑run `npm test`, `check:artifact`, `e2e`; commit; republish to the same URL.
3. Fresh‑context requirements review (opus) if budget allows; optional dialogue depth; final honest report in Indonesian (what works, what was tested, what is unfinished, how to play).
4. Usage window started ~07:18 UTC → expected end ~12:18 UTC.
