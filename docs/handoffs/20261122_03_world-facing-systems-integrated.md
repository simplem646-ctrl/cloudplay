# Handoff: world-facing systems + play lab integrated — the game now runs end to end (2026-11-22)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `20261122_02_areas-b-integrated.md` (see `20261121_01_*` for request/design/decisions; `20261121_04_*` for the usage‑limit recovery recipe).
**NO‑ASK RUN IN PROGRESS** (never call AskUserQuestion; log decisions; ends with the final report). User‑facing text in Indonesian.

## What happened
- **T11b world‑facing systems (S2, `sonnet·high`) finished and was integrated** (18 files: `src/systems/{path,lamps,player,interaction,npcs,activities,jobs,entities,staging,audio-director}.js`, small edits to `src/systems/{index,kit,script}.js` + README "S2" section, `tools/labs/play-lab.html`, `tests/unit/sys-s2-world.test.mjs`, `sys-s2-play.test.mjs`, `fixtures/sys-s2-env.mjs`; BASE `940adc7`; applied cleanly). Services registered in order: path, lamps, player, interaction, npcs, activities, jobs, entities. All 14 staging ops; music/ambience director; NPC schedules with A* walking, arrivals/departures, festival placement/decor; fishing/foraging/lamps; jobs (bakery, parcel run, lamplighter).
- **`tools/labs/play-lab.html` boots the real stack** (world, chars, ui, audio, portraits, data, systems) — its header documents the exact wiring that `src/main.js` must copy (all `Game` slots filled BEFORE `Systems.init()`; S2 services/ops/handlers register only if `Game.world.loadArea` exists). Query params: `q autostart skipPrologue fades=0 area anchor minutes season day weather run give lanterns money hud=0`; exposes `window.__lab = {Game, Systems, LB, svc, Data}`.
- **Lead verification (real browser, main checkout, SwiftShader ≈ 4 fps at q=low):** `npm test` **236/236**; held‑key movement works (slow only because of software rendering), walking through the cottage door and back out works, **all 18 areas load and place the player**, sleeping through the real day‑summary card wakes on day 2 ~06:00 in the cottage, save → mutate → load restores money/day/Mira's hearts, Escape opens/closes the menu, **no page errors**. Screenshots inspected: prologue (letterbox, Odell portrait, typewriter), roaming HUD + tutorial toast + "Space: Mail" prompt, town‑square dialogue with Odell, winter lantern festival crowd with lantern strings and snow, cottage interior, harbor. The game looks and plays like the target.
- Lead edit: lamplighter job `days` → Mon–Fri (the town hall is closed at weekends; T11b let job‑holders enter after hours but weekends stayed closed); DESIGN.md §10 updated.

## Known issues / not verified (honest list)
- Not exercised by anyone in a browser: **successful fishing minigame via real input**, **parcel run**, **lamplighter job**, touch input, continue‑screen load/delete/import/export, the real title → **keyboard new‑game flow** (UI lab only).
- Several NPCs share one festival anchor and overlap in the crowd; the foreground canopy near the town square's west edge can hide the player (world occlusion); lamps are `broken`/`unlit` until the story/job lights them (by design) so the early‑game town is dark at night except windows — verify it still reads well; the audio module logs "AudioContext not allowed" warnings before the first key press; HUD at the title must be confirmed hidden in `main.js`.
- `src/main.js` is STILL the pre‑integration version: audio and portraits are the null adapters there. The **play lab has the real wiring** — T14 must port it.

## Decided without asking (additions)
| Decision | Chosen | Why |
|---|---|---|
| Lamplighter days | Mon–Fri | matches the hall's weekday hours; lamps can still be lit by hand |
| T14 integration runs as a lone UNISOLATED writer in the main checkout | yes | worktrees were lost once on a worker restart; edits in the main tree survive; a lone writer needs no integration step |
| Split integration: T14a = wiring + loading screen + production/Artifact‑fragment builds + e2e smoke; then QA/play‑test/fix | yes | keeps each task bounded for the usage budget |

## Git state
Branch `claude/keen-bell-6isjol`, this commit = S2 + play lab + lamplighter fix + handoff, pushed. No worktrees running.

## Open follow‑ups
1. **T14a (`sonnet·high`, unisolated):** real `src/main.js` (port the play‑lab wiring; `?autostart/skipPrologue/q` params), loading screen, HUD hidden at the title, quiet audio before unlock, `npm run build` + a new Artifact **fragment** build (`dist/artifact.html`: no doctype/html/head/body; `<title>Lanternbrook Days</title>`; no `claude:viewport-fit-sides`), a check that wraps it in the documented skeleton and boots, `tests/e2e` smoke + `npm run e2e`, `docs/game/HOW_TO_PLAY.md`.
2. Then QA verifiers (fishing success path, parcel run, lamplighter, title keyboard flow, touch, seasons/weather, festival day) → fixes; fresh‑context review; publish the Artifact (`icon: lantern`, description); final honest report in Indonesian. Dialogue depth (T12/T13) only if budget remains.
3. Usage limit: window started ~07:18 UTC → expect it to end ~12:18 UTC; recovery recipe in handoff `20261121_04`.
