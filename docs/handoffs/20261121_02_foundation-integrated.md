# Handoff: foundation scaffold integrated (2026-11-21)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `20261121_01_game-plan-and-contracts.md` (read it first for the request, the settled design and the decisions table).
**NO‑ASK RUN IN PROGRESS** (same request as handoff 01: never call AskUserQuestion; log decisions; ends with the final report).

## What happened this session
- Wave 0 dispatched from BASE `62eb2af`: **T1 foundation** (sonnet·medium, `t1-foundation`), **T2 portraits** (opus·medium, `t2-portraits`), **T3 audio** (sonnet·medium, `t3-audio`), each in its own worktree.
- **T1 finished and was integrated** via `integrate-worktree.sh` (27 files, all within F0 ownership), verified by the lead in the main checkout: `npm ci`, `npm run build` (dist/index.html 548.5 KB), `npm test` (16 unit tests green; contract OK for world/chars/ui/systems/data, portraits+audio SKIP until integrated), registry.js diffed against the ARCHITECTURE §4 block by an *independent* extraction (identical), dev (unbundled) and dist screenshots boot (green plane + orange box + "foundation boot OK"), `LB.mode()` = `title`.
- Wrote the as‑built notes into `docs/game/ARCHITECTURE.md` §3.8 (Game.now shape, util/constants/EVT export names, Input.poll, test glob, pinned versions `three@0.187.0`, `esbuild@0.28.2`).

## Decided without asking (additions to handoff 01)
| Decision | Chosen | Why |
|---|---|---|
| T1's deviations (test glob `tests/unit/*.test.mjs`, `Game.now()` shape, `Input.poll()`, `setMode` throws on unknown) | accepted | all sensible; documented in ARCHITECTURE §3.8 |
| Wave‑1 dispatch order under the 5‑agent cap (T2/T3 still running) | T4 world, T8 content, T5 characters first; T7 sim and T6 UI as slots free | T4/T8 gate the most downstream tasks (T9/T10/T11 and T12/T13/T11) |

## Where things live
`src/core/**` (bus, events, game, state, input, loop, util, constants, registry, nulls, debug) · `src/main.js` · stubs `src/{world,characters,ui,systems,data}/index.js` · `tools/{build,serve,check-contract,run-validators}.mjs`, `tools/shot.cjs`, `tools/labs/_template.html` · `tests/unit/core.test.mjs` · `docs/game/{DESIGN,ARCHITECTURE}.md`.
Dev: `npm run serve -- --port N` → `http://127.0.0.1:N/index.html`; build: `npm run build`; screenshots: `node tools/shot.cjs <url> <png> --ready --strict`.

## Verification done
See above (lead‑verified). **Not yet verified:** portraits (T2) and audio (T3) outputs; nothing of the game itself beyond the stub scene.

## Git state
Branch `claude/keen-bell-6isjol`; this commit = foundation + ARCHITECTURE §3.8 + this handoff, pushed. t2/t3 worktrees still locked/running (their BASE is `62eb2af` — integrate them with that BASE, not the new HEAD).

## Open follow‑ups
1. Integrate T2/T3 when they report: `integrate-worktree.sh <path> <branch> 62eb2aff47121bdf07a123dbf7beb5e3fda7cec6`, then verify (portraits lab screenshots, audio offline report), cleanup, commit.
2. Dispatch wave 1 (T4, T8, T5 now; T7, T6 when T2/T3 free slots) from the new BASE; later wave 2 (T9–T13), wave 3 integration (wire real audio/portraits in `src/main.js`), QA, review, publish.
3. Keep the lead's playwright‑cli use to one browser at a time (`playwright-cli close` after).
