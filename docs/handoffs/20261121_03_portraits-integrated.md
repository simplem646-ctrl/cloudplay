# Handoff: portraits integrated, wave 1 in flight (2026-11-21)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `20261121_02_foundation-integrated.md` (and `_01_` for the request/design/decisions table).
**NO‑ASK RUN IN PROGRESS** (never call AskUserQuestion; log decisions; ends with the final report).

## What happened
- **T2 portraits (opus·medium) finished and was integrated** (14 files: `src/portraits/**`, `tools/labs/portraits-lab.html`, `tests/unit/portraits.test.mjs`). Lead verification in the main checkout: `npm test` 20/20, contract `portraits: 4 names` OK (API plus extras `PORTRAIT_IDS, EXPRESSIONS, PORTRAIT_SIZE, clearCache, renderStats`), Node import OK, contact sheet (9×10) and Celeste's 10 expressions inspected, Mira happy re-rendered from the integrated copy. Style = clean cel‑shaded late‑90s anime with sticker outline; all 9 characters distinct at thumbnail size. Preload of all 90 ≈ 1.8 s over ~85 idle slices (max slice ≈ 48 ms, just under the 50 ms cap).
- Known portrait weaknesses (from the worker, accepted): Theo's spikes read slightly sunburst, Willa's dark hair flat, bangs cover one eye on mira/rhea/celeste, Gus's mouth hidden by moustache when calm, clothing shadows lean purple, shy/thinking differ mostly by blush/gaze; winter variant only adds a scarf.
- Wave 1 dispatched from BASE `a769d28` (still running, worktrees locked): **T4 world** (sonnet·high, `t4-world`, ports 4130–4139), **T5 characters** (sonnet·high, `t5-chars`, 4140–4149), **T8 content** (sonnet·medium, `t8-content`). **T3 audio** (wave 0, BASE `62eb2af`) also still running.
- Next dispatches as slots free (cap 5 running): **T6 UI** (needs portraits → dispatched from this commit), **T7 sim core**.

## Decided without asking (additions)
| Decision | Chosen | Why |
|---|---|---|
| Portrait weaknesses | accept for v1, revisit in the art‑polish pass if time | contact sheet shows all nine appealing and distinct; the listed flaws are small |
| T6 UI dispatched after portraits are committed | yes | UI lab can use the real portraits |

## Where things live
`src/portraits/{index,render,specs,expressions,util}.js`, `src/portraits/parts/*.js` · lab `tools/labs/portraits-lab.html` (`?id=mira&expr=happy&scale=1`, `id=all`, `season=winter`) · screenshots in `/tmp/orchestrate/t2/` (may vanish).
`Game.portraits` is still the null adapter — the lead wires the real module in `src/main.js` in the integration wave (T14).

## Verification done / not done
Done: above. **Not yet verified:** audio (T3), anything from wave 1.

## Git state
Branch `claude/keen-bell-6isjol`, commit = portraits + this handoff, pushed. Running worktrees: t3 (BASE `62eb2af` — integrate with that BASE), t4/t5/t8 (BASE `a769d28`).

## Open follow‑ups
1. Integrate T3/T4/T5/T8 as they report (verify each in the main checkout; keep the ROLLBACK line until verified; clean up the worktree).
2. Dispatch T6 now, T7 when a slot frees, then wave 2 (T9/T10 after T4; T12/T13 after T8; T11 after T4–T8), wave 3 integration.
3. Wire `Game.audio`/`Game.portraits` real modules in `src/main.js`; add `?autostart` support for tests.
