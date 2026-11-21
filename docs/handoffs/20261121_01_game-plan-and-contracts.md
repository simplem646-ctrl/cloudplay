# Handoff: Lanternbrook Days — plan, contracts, environment fix (2026-11-21)

Audience: a future Claude session resuming the orchestrated game build. First handoff of the run.

**Request (verbatim intent):** build a cozy Harvest‑Moon‑BTN‑inspired (no farming) life‑sim RPG in Three.js, frontend‑only, localStorage saves, fixed 3/4 camera, 3D chibi
characters, painterly 2.5D environments, anime bust portraits for key characters, original assets; lead the work with up to 5 parallel sub‑agents in worktrees, Sonnet 5.5 for main
development, test with playwright‑cli, publish as an Artifact, report honestly.
**NO‑ASK RUN IN PROGRESS** — the user said "work independently without asking me technical questions … without needing further instructions". Never call AskUserQuestion;
log decisions below and in the final report. (Applies to this request only; ends with the final report.)

## What happened this session
1. Loaded the `orchestrate` skill; preflight clean on `claude/keen-bell-6isjol` (the branch the system prompt names; not `main`), BASE `bc0664c`.
2. **Environment repair:** dockerd failed to start (stale `/var/run/docker.pid` held PID 201, which in this boot is a *thread* of the Claude process, so dockerd refused). Fixed in the repo script
   (`scripts/setup-env.sh`, a guard line before `starting dockerd`) and re‑ran the provided script → docker, Firecrawl (:3663) and the CDP Chromium (:9222) are up. Firecrawl not needed for this build (all assets original).
3. **Proved the test path:** WebGL2 works in host headless Chromium (SwiftShader) with no flags, and in the containerised CDP browser; `playwright-cli open http://172.17.0.1:<port>/…` reaches a server bound to 0.0.0.0 on this host.
4. **Wrote the settled decisions** (read these first): `docs/game/DESIGN.md` (rules, numbers, cast, story, calendar, art/audio direction) and `docs/game/ARCHITECTURE.md` (ownership, tooling, core API, authoritative registry
   code block, module APIs, script language, conditions, data schemas, verification protocol). Registry block was extracted and validated (18 areas, 32 lamps, 22 forage spots, 9 fishing spots, 122 required interactables, consistent neighbours).
5. Created tasks #1–#17 (wave plan below).

## Decided without asking
| Decision | Chosen | Why |
|---|---|---|
| Ask‑mode | no‑ask run | user said not to ask technical questions / needs no further instructions |
| Branch | stay on `claude/keen-bell-6isjol` | named in system prompt; not `main` |
| Session model not Opus | noted; user explicitly asked for Sonnet 5.5 | report line |
| Game identity | "Lanternbrook Days"; protagonist default "Kai"; 19 named villagers (5 romance, 9 portraits) | original names, no protected branding |
| Tech | Three.js via npm + esbuild → one self‑contained `dist/index.html`; area‑by‑area scenes; DOM/CSS UI; WebAudio synthesis; all assets procedural | frontend‑only, artifact‑publishable, no asset files |
| Camera | perspective FOV≈30°, yaw 0, pitch≈52°, pan‑only follow | "fixed 3/4, never rotates" |
| Routing | Sonnet for main dev (`sonnet·medium`, `·high` for world+characters); **Opus** for portraits (art taste, user will scrutinise), integration (hard debug) and reviews | user: Sonnet for main work, orchestration guide for the rest; Fable never |
| Test tooling | workers use host Playwright via `tools/shot.cjs`; lead alone uses playwright‑cli (single shared CDP browser) | avoid CDP contention |
| Modified repo infra | one guard line in `scripts/setup-env.sh` | needed to run the provided CloudPlay setup; reported |

## Plan (waves; ≤5 agents at once; writers in worktrees from BASE)
- **Wave 0:** T1 F0 foundation (sonnet·medium) · T2 portraits (opus·medium) · T3 audio (sonnet·medium)
- **Wave 1 (after T1 integrated+committed):** T4 world engine (sonnet·high) · T5 chibi characters (sonnet·high) · T6 UI (sonnet·medium) · T7 sim core (sonnet·medium) · T8 core content (sonnet·medium)
- **Wave 2:** T9 areas A · T10 areas B · T11 world‑facing systems · T12 dialogue/events A · T13 dialogue/events B
- **Wave 3+:** T14 integration (opus·high) · T15 QA flows/bug cycles · T16 review (opus·high) · T17 build + publish Artifact + report

## Where things live
`docs/game/DESIGN.md`, `docs/game/ARCHITECTURE.md` (contracts) · `scripts/setup-env.sh` (stale pid guard) · task list via TaskList (metadata holds agent/model/effort/BASE).

## Verification done
Registry block syntax + consistency (node). Test path (WebGL, playwright‑cli reaches host). **Nothing of the game itself exists yet.**

## Git state
Branch `claude/keen-bell-6isjol`; this handoff + docs + script fix are the first checkpoint commit, pushed to origin.

## Open follow‑ups
1. Dispatch wave 0 (T1–T3) from the new BASE, integrate T1 first, commit, then wave 1.
2. After wave 0, wire `Game.audio` / `Game.portraits` real modules in `src/main.js` (F0 deliberately ships null adapters for them).
3. Keep one `playwright-cli` browser user at a time; close it when done (`playwright-cli close`).
