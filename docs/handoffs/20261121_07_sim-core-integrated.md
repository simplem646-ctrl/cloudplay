# Handoff: sim core integrated and cross-checked against real content (2026-11-21)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `_06_characters-integrated.md` (see `_01_` for request/design/decisions; `_04_` for the usage‑limit recovery recipe).
**NO‑ASK RUN IN PROGRESS** (never call AskUserQuestion; log decisions; ends with the final report).

## What happened
- **T7 sim core (sonnet·medium) finished and was integrated** (23 files: `src/systems/**` incl. `README.md`, 3 sys test files + fixtures; BASE `280661a`). Services: clock, weather, conditions, inventory(+chest), rel (talk/gifts/dating), shops, script interpreter, quests (+board/errands), events (+festivals), mail, interact handlers, tutorial, director (new/continue/sleep/collapse/autosave/save), debug `LB` commands, save intents. Read `src/systems/README.md` first — it is the S2 extension contract.
- **Lead cross-check (real sim core × REAL content, fake UI/world, no‑op staging ops)** — found by neither worker alone — all green: new game fires the prologue by itself; **118 event-script runs** (59 events × 2 ask strategies) finish with no warnings and the mode restored; all 19 NPC talk/intro flows; **gift classification love/like/dislike/hate by item id matches every NpcDef**; 8 shops open with stock and buying works; all 32 quests start and the board yields 26 distinct errands over 14 days; 55 non‑physical interactables run; 70 nights of sleeping roll the calendar correctly (Y1 season 2 day 15); all 5 festivals fire in the right area/time. Now committed as `tests/unit/sys-content.test.mjs` (0.25 s; owned by the systems stream — S2 may adapt it). Suite: **163/163**.
- A first run of the festival check failed only because my harness used a time outside the event's own window (harness bug, not a system bug) — noted for honesty.
- Worker's known weaknesses (accepted for now): `visit` goal with `anchor/radius` is poll‑only and untested; **festival decor is not applied by S1** (S2 must call the `decor` op/`world.setDecor` from `events.festivalToday().decor`); quest `date` goals compare within the quest's start year; `ui:resumeDay` ignored; storage chest UI is a basic paged "take out" list; **scripts must never call `runScript` from inside an op** (deadlock; use `ctx.runSteps`/`call`); `quests.advance/complete` from script ops are queued, not awaited; custom bus event `npc:gift {npc,item,qty,reaction}` (not in `EVT`) drives `give` goals; `{mail}` goes to `world.mailPending` then `mailQueue` next morning.

## Decided without asking (additions)
| Decision | Chosen | Why |
|---|---|---|
| Keep the cross-check as a committed test | yes (`tests/unit/sys-content.test.mjs`) | guards the systems↔content seam through the coming S2/integration changes |
| Dispatch S2 (T11) before the world engine lands | yes, against the documented AreaRuntime contract with fakes | shortens the critical path; real‑world integration happens when T4 lands (T14) |

## Running now
t4‑world `agent-a930bf78049633152` (BASE a769d28; resumed after the limit) and t6b‑ui `agent-a201d812a17ecd1cc` (BASE f808822).

## Git state
Branch `claude/keen-bell-6isjol`, this commit = sim core + regression test + handoff, pushed.

## Open follow‑ups
1. Integrate t4/t6b when they report. Then T9/T10 (areas, need T4's engine + prop library) and finish T11 against the real world; T14 integration (wire audio, portraits, chars, ui, systems, world in `src/main.js`; `?autostart`); QA; review; publish. T12/T13 only if budget allows.
2. Watch for another usage‑limit hit (window ends ~04:10 UTC).
