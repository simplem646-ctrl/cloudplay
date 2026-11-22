# Handoff: areas A integrated (2026-11-22)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `20261121_08_world-and-ui-integrated.md` (see `20261121_01_*` for request/design/decisions; `20261121_04_*` for the usage‑limit recovery recipe).
**NO‑ASK RUN IN PROGRESS** (never call AskUserQuestion; log decisions; ends with the final report). The user wrote once mid‑run (Indonesian): their own usage limit had been hit and had reset — "continue from where you left off". Reply to the user in Indonesian from now on.

## What happened
- **Usage limit hit again (~04:00 UTC):** t11 (S2) died and its worktree was lost in a worker‑process restart (no branch left); the user's limit reset and the user asked me to continue at 07:18 UTC. The environment stack (Firecrawl, CDP Chromium) had to be re‑provisioned with `./scripts/setup-env.sh` (done). The staged world+UI patches survived on disk and were committed (`940adc7`).
- **Re‑dispatched from `940adc7`:** t11b‑sim‑world (S2 fresh, `sonnet·high`, now with the REAL world/UI/characters in its base and a required `tools/labs/play-lab.html` that boots the real stack), t9‑areas‑a, t10‑areas‑b (all `isolation: worktree`).
- **T9 areas A (sonnet·medium) finished and was integrated:** `market_street`, `riverside_park`, `harbor`, `bakery`, `general_store`, `cafe` + decor sets `riverside_park.spring_picnic`, `riverside_park.lantern_festival`, `harbor.midsummer`, `town_square.harvest_fair`; new props `src/world/props/{shops,outdoor}.js` (display_case, brick_oven, piano, coffee_machine, stairs, pigeonholes, pot_rail, goods_shelf, bread_rack, wall_sign, tabletop; gazebo, swing, net_rack, shells, bollard, petals, floating_lanterns, pumpkins). Lead verification: `npm test` **207/207** (after I relaxed a stale hard‑coded built‑list assertion in `tests/unit/world-areas.test.mjs` to a superset check), `validate-world` OK for 9 built areas (+ 9 placeholders), screenshots inspected (market street, harbor, bakery) and decor re‑rendered from the main checkout (park lantern festival in winter dusk, square harvest fair) — cohesive with the benchmark areas. Draw calls ≤ 252 (budget 350).
- T9 known weaknesses (accepted): harbor lighthouse lamp room can't be made dark (prop has no switch); library "round window" impossible (rectangular windows) — t10 uses a large square window; harbor's park edge is north near x≈6.5 and the park's harbor edge is east near z≈23; non‑registry props (postbox, bread rack) are not interactable; store shelf goods and hanging signs are small at game‑camera distance.

## Decided without asking (additions)
| Decision | Chosen | Why |
|---|---|---|
| Relax `world-areas.test.mjs` built‑list to a superset check | yes (lead edit) | it was a stale equality assertion that would fail for every new area |
| Reply language | Indonesian for user‑facing text | the user's mid‑run message was in Indonesian |

## Running now
t11b‑sim‑world (S2 + play lab), t10‑areas‑b (woods, hill, workshop, town_hall, clinic, library, inn, fishing_hut, observatory + `hearthlight` decor). Worktrees under `.claude/worktrees/` (BASE `940adc7`).

## Git state
Branch `claude/keen-bell-6isjol`, this commit = areas A + handoff, pushed.

## Open follow‑ups
1. Integrate t10 and t11b when they report (verify in main; keep ROLLBACK until verified; cleanup). Then T14 integration (`sonnet·high`): wire real audio+portraits+all modules in `src/main.js` (reuse the play lab wiring), hide the HUD at the title, `?autostart`, verify UI↔Systems seams; QA flows with playwright‑cli; review; publish the Artifact; honest report. T12/T13 (dialogue depth) only if budget allows.
2. Watch for another usage‑limit hit; recovery recipe is in handoff `20261121_04`. Worktrees can be lost on a worker restart — re‑dispatch from the current BASE if so.
