# Handoff: core content integrated (2026-11-21)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `_04_audio-integrated-usage-limit.md` (see `_01_` for request/design/decisions).
**NO‑ASK RUN IN PROGRESS** (never call AskUserQuestion; log decisions; ends with the final report).

## What happened
- **T8 core content (sonnet·medium, resumed once after the usage limit) finished and was integrated** (51 files: `src/data/**`, `tools/validate-content.mjs`, `tests/unit/content.test.mjs`; BASE `a769d28`). Lead verification in the main checkout: `npm test` 70/70, `node tools/validate-content.mjs` OK (0 errors, 3 warnings), **mutation‑tested the validator** (7 deliberate breakages — bad anchor, icon shape, tag, goal type, expression, speaker, festival area — all caught with specific messages), read the prologue and Mira samples (in voice, correct ops/staging).
- Counts: 165 items (21 fish incl. 2 legendary, 34 forage, 23 food, 34 gift, 20 material, 17 key, 12 book), 8 shops, 3 jobs, 11 buildings, 19 NPCs, 331 schedule slots, 32 quests (4 tutorial, 9 main, 19 side), 11 errand templates, 5 festivals, 51 mail, 12 books, 63 interactions, 16 tutorial hints, 578 dialogue lines (192 talk entries), 59 events (20 heart, 19 friend, prologue, journal_found, lantern_restored_1..6, 5 festivals, 5 ending_together_*, ending_friends, misc).
- **Baseline vs depth:** data is final quality; dialogue/events are a functional baseline (every NPC has intro + ≥6 talk entries + all gift pools; every event has a short real script; sprite‑only villagers are thin). T12/T13 (dialogue depth) are **deliberately deferred** until the critical path is safe (usage‑limit lesson).
- Messages sent to running workers because of what the content needs: **t7‑sim** (talk entries may have `after: Script`; dating derived from flag `<npc>_dating`; quest stage indexes are 0‑based; `lantern:1` = +1; festival ids `blossom midsummer harvest hearthlight lantern`; Hattie/Sable shops have `counter:null`) and **t5‑chars** (promote `serve write hammer sit_read fall` to Tier 2 — the data uses them 29/16/11/9/1 times; unknown anim/prop names must degrade to idle, never throw). Animation names used by data: idle sit serve eat write run hammer sit_read knead drink carry_walk stretch stargaze walk pickup fish_wait yawn sweep fall fish_cast fish_catch; props: mug basket bread book rod bag telescope parcel flower.

## Decided without asking (additions)
| Decision | Chosen | Why |
|---|---|---|
| Free slot after T8 | leave it empty; defer T12/T13 | nothing else on the critical path is dispatchable yet; optional depth would burn shared usage budget |
| Parcel run on Wednesday (store closed) | accept; S2 jobs should treat a closed building as "no job today" | tiny; content worker flagged it |
| Content schema bends accepted | `after` on talk entries; `<npc>_dating` flag; 0‑based stages | documented to T7 |

## Where things live
`src/data/{index,npcs,items,fish,forage,shops,jobs,buildings,schedules,quests,errands,festivals,calendar,mail,books,interactions,tutorial}.js`, `src/data/dialogue/*` (19 NPCs + barrel), `src/data/events/*` (+ `_heart.js` helper, not in the barrel) · `tools/validate-content.mjs` (also run by `npm test`).

## Running now (worktrees under `.claude/worktrees/`)
t4‑world `agent-a930bf78049633152` (BASE a769d28) · t5‑chars `agent-a17469806dc9f661a` (a769d28; stray `.scratch_k.mjs` must not be integrated) · t6b‑ui `agent-a201d812a17ecd1cc` (f808822) · t7‑sim `agent-a031b0a9f4cab75d5`'s worktree (280661a).

## Verification done / not done
Done: above. **Not yet verified:** that the real script interpreter/world can execute these events (shape‑validated only); world, characters, UI, sim core.

## Git state
Branch `claude/keen-bell-6isjol`, this commit = content + handoff, pushed.

## Open follow‑ups
1. Integrate t4/t5/t6b/t7 as they report (verify in main; keep ROLLBACK until verified; cleanup).
2. Then wave 2 critical path: T9/T10 (areas, after T4), T11 (world‑facing systems, after T4–T8); T14 integration; QA; review; publish. T12/T13 only if budget allows.
3. Watch for another usage‑limit hit (window should end ~04:10 UTC); recovery recipe is in handoff 04.
