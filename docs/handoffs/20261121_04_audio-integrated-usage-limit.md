# Handoff: audio integrated; usage-limit interruption recovered (2026-11-21)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `_03_portraits-integrated.md` (see `_01_` for the request, design and decisions table).
**NO‑ASK RUN IN PROGRESS** (never call AskUserQuestion; log decisions; ends with the final report).

## What happened
- **Usage‑limit event (~23:05 UTC):** all five running workers (t3 audio, t4 world, t5 chars, t6 UI, t8 content) were killed by the account's **5‑hour usage limit** (HTTP 429, window reset **23:10 UTC**). Their work stayed saved in their worktrees. At 23:15 the limit had reset; the environment (docker, Firecrawl, CDP) was still up.
  - **Resumed with SendMessage** (cache still warm): t3, t4, t5, t8 — each told what was saved, what is missing, and to build a minimal visible end‑to‑end path first, then go by tier. Counts as retry 1 each (infrastructure interruption, not a quality miss).
  - **t6 (UI)** had saved nothing (worktree auto‑removed) → **re‑dispatched fresh as `t6b-ui`** from BASE `f808822`.
  - Expect the next limit window to end ~**04:10 UTC** if usage stays heavy. If all agents die again: wait for the reset (`mcp__claude-code-remote__send_later`), then `SendMessage` the same agent names to resume (worktrees persist; never run unisolated writers on main).
- **T3 audio (sonnet·medium) finished** after resume and was integrated (14 files: `src/audio/**`, `tests/unit/audio.test.mjs`, `tools/labs/audio-lab.html`; BASE was `62eb2af`). Lead verification in the main checkout: `npm test` 67/67, contract `audio: 11 names`, Node import OK, lab offline autotest run from the main checkout: **21 tracks, 50 sfx, 9 voices, 8 ambience beds, 0 failures, 0 near‑duplicate SFX, no page errors**. **Not verified by ear** (headless): timbre/hummability/loop‑seam feel; `town_spring`/`festival`/`minigame` peak 0.90–0.95; cafe/minigame ≈3 dB quieter; animal SFX are simple synths.
- Audio API extras beyond the contract: `getAnalyser, trackMeta, ambienceMix, voiceList, ambienceList, renderOffline`. `setAmbience({area:'none'})` silences beds. Footsteps also cover `carpet`/`water`.

## Decided without asking (additions)
| Decision | Chosen | Why |
|---|---|---|
| Recovery from the limit | resume t3/t4/t5/t8 with SendMessage; fresh t6b | prompt cache still warm; t6 had no saved work |
| Budget order for resumed workers | "minimal visible path first, then tiers; finish a tier cleanly rather than leave half‑wired code" | the usage window is finite |
| Count the interruption as a retry? | yes (retry 1), but not as a model miss | skill says "cut off" = partial |
| Lead cwd drift | always `cd /home/user/cloudplay &&` in Bash | a `cd` into worktrees changed the primary dir twice |

## Where things live
`src/audio/{index,synth,sequencer,theory,reverb,sfx,voices,ambience}.js`, `src/audio/tracks/{index,tier1,tier2,tier3}.js` · lab `tools/labs/audio-lab.html` (`?autotest=1` → `window.__audioReport`) · `/tmp/orchestrate/t3-audio-report.json` (may vanish).
`Game.audio`/`Game.portraits` are still the null adapters — real wiring in `src/main.js` is the integration task (T14).

## Running now (worktrees under `.claude/worktrees/`)
t4‑world `agent-a930bf78049633152` (BASE a769d28) · t5‑chars `agent-a17469806dc9f661a` (a769d28; has stray `.scratch_k.mjs` to drop at integration) · t8‑content `agent-abcfc9349370bca20` (a769d28) · t6b‑ui `agent-a201d812a17ecd1cc` (f808822). T7 sim core is dispatched from this commit.

## Git state
Branch `claude/keen-bell-6isjol`, this commit = audio + handoff, pushed.

## Open follow‑ups
1. Integrate t4/t5/t8/t6b as they report (verify each in the main checkout; ROLLBACK line kept until verified; cleanup worktree).
2. T7 (sim core) running next; then wave 2 (T9/T10 areas after T4; T11 world‑facing systems after T4–T8; T12/T13 dialogue depth after T8 — may be reduced/dropped if budget is tight), wave 3 integration (wire audio+portraits in `src/main.js`), QA, review, publish.
3. If budget runs short: keep the game playable — prefer fewer, finished areas/features over many half‑done ones, and say so honestly in the final report.
