# Handoff: artifact published, event soak, two soft-lock fixes and polish (2026-11-21, ~14:55 UTC)

Audience: the orchestrating main session after a compaction/resume. Sequel to `20261121_08_qa-first-pass.md` (read it first; 03 has the worker list and the worktree-base quirk).
**No-ask run ends with this report** (request: "build my dream video game", a Harvest-Moon-style school life sim with Three.js, orchestrated, published as a Claude Artifact, honest report; see `20261120_01_architecture-contracts.md`).

## What happened

- **Artifact published** to the same URL `https://claude.ai/artifact/4LPrMM6ySuw2sn1DoeqyM4` (version 2, ~14:12 UTC, from `dist/index.artifact.html`, 1.58 MB, one fragment, no external resources). Checked inside the publisher's own skeleton in headless
  Chromium (`art.mjs`, scratchpad `art/`): boots and starts a new game with `localStorage` throwing (save falls back to memory, no error) and at a 400x780 touch viewport (the on-screen pad shows), 0 page errors.
  This checkpoint changes the game, so it must be **republished** (version 3) after the commit.
- **Event soak** (scratchpad `qa/events_soak.mjs`, `debug.runEvent` through the REAL Stage, dialogue auto-advanced, an input robot mashes keys whenever a registry scene such as a mini-game is on top): all 119 non-finale events x 2 choice policies
  (first option, last option). Result: 0 console errors, heap flat at 32-33 MB over 120 events, 57-60 fps. **One real soft lock found and fixed**: `nina_04_festival` never ended because `moveTo(..., { wait:false })` followed by another `moveTo` of the
  same actor left two walkers dragging the actor in opposite directions forever (`overworld.walkActor` now cancels an older walk of the same actor, `Stage.place/hide` cancel walks too; `test/scenes/walkers.test.mjs` reproduces the old livelock).
- **Bell Night endings** (`ending.mjs`, three entry paths): natural `auto` trigger at 23:35 (saved school, 9 slides), going to bed on Bell Night (`main_33_finale_wakeup`, merged school, 8 slides), `runEvent` of the finale: each plays slides -> credits -> title.
  **Bug fixed**: after the sleep-path ending the interrupted `sleepFlow` carried on and opened a stray "Day 336" sleep summary over the title; it now returns when the overworld is dead.
- **Polish added by the lead**: title "How to Play" panel (keys, touch note, tips); a **club sign-up sheet** on the school notice board (the Club Fair in spring was the only way to join a club; join / switch with a rank-reset confirm / leave);
  `src/scenes/activities/ring_timing.js` (`minigame:astronomy_stars` "Star Gazing" and `activity:shell_hunt` "Shell Hunt", replacing two "Coming soon" festival options; the Astronomy Club now has its mini-game);
  `scripts/audit-reachability.mjs` (`npm run audit`, static scan for dead content: flags never set, counters, quests, items, triggers on unbuilt maps, event dependency cycles: 0 problems); README section about the game; API docs updated.
- **Other checks that passed this window**: offline audio self-test (26 tracks, 39 SFX: no silence, NaN or clipping; peaks 0.32-0.44); gift flow (talk -> "Give a gift" -> item list -> reaction, friendship and bag change); club practice for track, music,
  astronomy and the timing-drill fallback; café job shift (pay +$45, energy -25); Star Gazing and Shell Hunt through their festival options (science +1, one Spiral Shell); club join / switch / leave.

## Where things live

`src/scenes/{overworld,stage,interactions,title}.js` (edited), `src/scenes/activities/{ring_timing,index}.js`, `test/scenes/{walkers,ring_timing}.test.mjs`, `scripts/audit-reachability.mjs`, `README.md`, `docs/game/api/{scenes,minigames,academics}.md`.
QA scripts (scratchpad, may be gone): `/tmp/claude-0/-home-user-cloudplay/a12cffcd-0bbf-5bf9-b5fa-e7cad974b968/scratchpad/qa/{events_soak,newfeat,ending,gift,dbg_nina04}.mjs`, run with `node scripts/shot.mjs dist/index.html --out <dir>/x.png --script <file>`.

## Verification done

`npm test` 364 tests (363 pass, 1 skipped by design: the strict "all 26 maps" check), `npm run validate` 0 errors / 0 warnings, `npm run audit` 0 problems, prod build and artifact fragment OK, wrapped-artifact smoke tests (desktop, no-storage, phone) 0 errors.
**Not verified**: sound by ear (signal analysis only), real touch devices (only the emulated phone viewport and the overlay's presence), the café-job and mini-game *skill* feel (a key-mashing robot played them, medals were low), a hand-played full year with real classes
and exams on every day (the soak covers content and flows; the 336-day sim smoke test covers rules), every NPC schedule collision on every date.

## Decided without asking (this window)

| Decision | Chosen | Why |
|---|---|---|
| Club sign-up path | notice-board sheet | the Club Fair was the only way in; "Advisors take sign-ups any day" promised more |
| Two missing event scenes | built a small ring-timing game for each | "Coming soon" in a festival choice reads as unfinished |
| Newer `moveTo` vs older walk of one actor | newer supersedes | the only rule that cannot livelock |
| Static audit "engine code sets this flag" | any engine string spelling it counts | cheap and errs towards fewer false alarms; documented in the script header |

## Git state

Branch `claude/intelligent-edison-7ygncq`; this checkpoint follows `2d57391` (pushed). Reminder: write the handoff with the Write tool BEFORE `git commit` (a hook blocks commits without a new handoff).

## Open follow-ups

1. Republish the artifact from `dist/index.artifact.html` to the SAME url (`node scripts/build.mjs --artifact` first; omit `icon`).
2. Final report (this run's last step): Model-effort table (workers sonnet high/medium; S1 opus-medium; lead in-session: UI toolkit, audio, three mini-games + exam banks, T7b events/interpreter, academics/club/job rules, schedules, S4a events, T9 integration, QA), Decided without asking, Skipped
   (11 maps, 3 club mini-games, crisis/date/climax/farewell beats of each romance route, per-club endings, extra painters), the three usage-limit stalls, the worktree-base quirk, the Sonnet-5.5 orchestrator note.
3. Optional tier 2 if budget remains: the 11 unbuilt maps, `soccer_penalty` / `art_palette` / `literature_words`, `_05/_07/_08/_10` romance beats, a hand-played balance pass, a sound check by a human.
