# Handoff: world engine + UI integrated; double-buy seam bug fixed (2026-11-21)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `_07_sim-core-integrated.md` (see `_01_` for request/design/decisions; `_04_` for the usage‑limit recovery recipe).
**NO‑ASK RUN IN PROGRESS** (never call AskUserQuestion; log decisions; ends with the final report).

## What happened
- **T4 world engine (sonnet·high, resumed once after the usage limit) finished and was integrated** (29 files: `src/world/**` incl. `AREAS.md` + `PROPS.md`, `tools/labs/world-lab.html`, `tools/validate-world.mjs`, 2 test files; BASE `a769d28`). Lead verification: `npm test` green, `validate-world` OK (3 built areas + placeholders OK for the other 15), screenshots inspected and re‑rendered from the main checkout: town_square noon (cobbles, fountain + working clock tower, striped stall, signs, lamps, petals), town_square night with lit lamps, brook_lane autumn golden hour and summer morning, placeholder market_street. Looks like the intended painted diorama. Perf (SwiftShader): brook_lane 144 draw calls / 141k tris / ~58 fps at high; town_square 176–237 calls.
  - **Built:** engine, fixed camera, textures (ground kinds: grass meadow moss forest dirt gravel sand cobble flagstone stone tile planks deck water carpet), prop library (houses, trees, street, interior), environment (time/season/weather, lightning), collision, effects, post pass, `brook_lane`, `cottage`, `town_square` (+ `lantern_festival` and `spring_picnic` decor).
  - **Not built:** 15 areas return auto‑generated placeholder defs (a field + crossroads + lamps) so Systems can already load every area id; decor sets `midsummer`, `harvest_fair`, `hearthlight` (`setDecor` accepts them, shows nothing).
  - Known weaknesses (worker): winter bare trees spiky; willow canopy reads as a blob in autumn; flagstone ring in the square slightly pale; birds barely visible; non‑axis fences collide as circles; a fence on a tile edge blocks two rows; brook_lane summer-morning/cottage-night were only reviewed at lower quality by the worker (I re‑rendered brook_lane summer at high — fine). three 0.187 has no `PCFSoftShadowMap` → `PCFShadowMap` used. `world.__setOverview()`/`__internals` exist for the lab only.
  - Authoring docs for wave‑2 workers: `src/world/AREAS.md` (AreaDef format, ground kinds, workflow; any prop with an `id` becomes an interactable; doors/edges generate transitions and `from_*` anchors automatically), `src/world/PROPS.md`.
- **T6b UI (sonnet·medium; first attempt t6 died on the limit with nothing saved) finished and was integrated** (src/ui/**, `tools/labs/ui-lab.html` + fixtures, 3 ui test files; BASE `f808822`). Lead verification: `npm test` 200/200 (after both integrations), the worker's keyboard+mouse flow script **re‑run against the main checkout: 29 checks, 0 errors** (dialogue typing/advance semantics, ask skipping disabled options + mouse, confirm, pickItem, menu tabs Q/E + click, save intent, shop buy/sell intents + coins, notes paging, daySummary, kneading, fishing, title → new game validation/result); screens inspected (items menu, dialogue with the real Mira portrait, title). Not exercised by the worker (still unverified): continue screen load/delete/export/import, settings Load, Import/Export dialogs, items‑tab Use button, real touch input, portrait‑orientation hint, real fishing outcome via UI; 844×390 text is small (11 px).
  - API notes: CSS split across `styles.js`, `styles_screens.js`, `styles_extra.js`; extra exports `itemIcon`, `setTouch`; `banner(title,sub,ms)`; title "Options" opens settings in a modal and the UI never produces `{action:'quit'}`; UI hides the energy bar and prompt chip while a dialogue is open; dialogue keeps its mode ~160 ms between lines; **the shop callbacks perform the trade and the UI then emits `ui:buy`/`ui:sell` with `done:true` as notifications only**.
- **Cross‑seam bug found by the lead and fixed:** Systems' `save.js` bought/sold again on every `ui:buy`/`ui:sell`, so the UI's `done:true` notification would have **double‑charged every purchase**. Fixed with a two‑line guard (`if (!done)`) in `src/systems/save.js`; `tests/unit/sys-content.test.mjs` check D now emits the notification after each purchase and fails if a second trade happens (proven by reverting the guard: it failed in several shops). Lesson: seams between independently built workstreams need lead cross‑checks, not just per‑worker green tests.

## Decided without asking (additions)
| Decision | Chosen | Why |
|---|---|---|
| Fix the double‑buy myself | yes (two lines + test) | trivial one‑line‑class edit in an integration seam |
| Keep placeholder areas until wave 2 | yes | engine already loads every area id; real areas are T9/T10 |
| Wave‑2 split of the 15 areas | T9: market_street, riverside_park, harbor + bakery, general_store, cafe; T10: whispering_woods, starview_hill + workshop, town_hall, clinic, library, inn, fishing_hut, observatory; decor: T9 adds `midsummer` (harbor), `lantern_festival`+`spring_picnic` on riverside_park, `harvest_fair` on town_square; T10 adds `hearthlight` (inn) | balances exteriors/interiors; every festival gets its venue decor |

## Running now
t11‑sim‑world `agent-ac2137e0b32268d0b` (S2, BASE b7b123c). T9/T10 are dispatched from this commit.

## Git state
Branch `claude/keen-bell-6isjol`, this commit = world + UI + fix + handoff, pushed.

## Open follow‑ups
1. Integrate T9/T10 and T11 when they report; then T14 integration (wire audio, portraits, chars, ui, systems, world in `src/main.js`; hide the HUD at the title; `?autostart`; verify UI↔Systems seams: shop/dialogue/menu/pickItem/daySummary shapes, `ui:save/load`, HUD with null state), QA flows with playwright‑cli, review, publish. T12/T13 only if budget allows.
2. Watch for another usage‑limit hit (window ends ~04:10 UTC).
