# Handoff: main story + festivals + endings integrated; worker briefs now live in the repo (2026-11-20, ~23:30 UTC)

Audience: the orchestrating main session after a compaction/resume. Sequel to `20261120_08_sim-core-events-academics.md` (read it first, plus 01-03 for the request and decisions).
**No-ask run still in progress** (it ends with the final report).

## What happened

- `s1-story` (opus·medium) finished in ~3 min after resume and was **integrated** (verified by the lead: validator 0 errors, `npm test` 240 pass, 46 events x 4 choice policies = 184 clean smoke runs):
  33 main events (Y1-Y3, `main_01_wake_up` ... `main_33_finale_wakeup`), 13 festival events (`fest_all.js`, one per `FESTIVALS[].eventId`, daily-repeat, year variants, Spirit rewards, evening
  choice sets `fest_<id>_y<year>_with_<heroine|friends|alone>`), 3 quests (`main_first_week`, `main_silent_bell`, `main_save_school`), 15 ending slides (main saved/merged, academic x4, friends x3, final, friends-only),
  `docs/game/api/story_main.md` (table of ids/triggers/gates/flags: read it before writing romance/friend content).
- S1 decisions: festivals whose place is not built are staged on the nearest tier-1 map (Beach Day + Fireworks on the harbor, Moon Night on the rooftop, Closing Ceremony in the school grounds, each commented);
  `club_pick_*` flags are handled by the interpreter (`setFlag('club_pick_art')` joins the club). Not written: per-club ending slides (no condition for club rank: tier 2).
- **Scope change (lead)**: main events 19, 29, 30 (archive, board meeting, board vote) are staged on **`town_hall`**, which was a tier-2 map. It is PROMOTED TO TIER 1 (the Year-3 board vote is the story's climax): T4a builds
  `town_hall` too. Tier-1 maps are now 12 (+ T3's three): town_harbor, cafe_lantern, town_park, bakery, town_hall, school_grounds, school_field, school_rooftop, bell_tower, school_hall_1f, school_hall_2f, school_library.
- Worker briefs were copied into the repo: `docs/game/briefs/*.md` (+ README table), so dispatch prompts can say "read docs/game/briefs/<x>.md first" and a resumed session can re-dispatch without the old conversation.
- Dispatched (BASE `6b33783`, sonnet·medium, worktrees): `t8a-scenes` (class/exam/report_card/study scenes), `t9b-menus` (pause tabs, sleep, save/load, settings, ending, credits). Still running from wave 1: `t3-world`, `t5-art`
  (both sonnet·high, told to finish only core deliverables). The deleted 23:43 wake-up is no longer needed.

## Verification state

Main after S1: `npm test` 240/240, `npm run validate` 0 errors (27 warnings = missing dialogue pools/schedules), `npm run build` OK (stub main). Not verified: any scene; audio by ear; t3/t5/t8a/t9b outputs.

## Git state

Branch `claude/intelligent-edison-7ygncq`; this checkpoint follows `6b33783`. **Push blocked** (HTTP 403, GitHub App not installed): retry at checkpoints, list under Skipped. Live worktrees: t3-world `agent-a3aaf1a9054517742`,
t5-art `agent-a553941a6798b6baf` (BASE `26725ed1f010e208b0172a4d47f1d12a3c9fc4f1`), t8a-scenes and t9b-menus (BASE `6b33783d3196db43756c57c253284c104e6b61a6`).

## Open follow-ups

1. Integrate `t3-world`, `t5-art` (stage lead edits with `git add -A` first; `integrate-worktree.sh <path> <branch> <their BASE>`), then `t8a-scenes`, `t9b-menus`; verify (`npm test && npm run validate && npm run build`, one screenshot per visual module), cleanup, commit with a handoff.
2. Fill free slots in this order (prompt = standing rules + "read docs/game/briefs/<brief>.md first"; sonnet·medium unless noted; T9a sonnet·high): S2 (Nina, Elise), S4c schedules, T9a core flow (needs T3 + T5 integrated), T4a (harbor, cafe_lantern, park, bakery, **town_hall**),
   T4b (grounds, field, rooftop, bell_tower), T4c (hall_1f, hall_2f, library), S3 (Clara, Mari, Vera), S4b pools, T8b scenes, S4a friends/town events. At most 5 agents; commit before dispatching worktree waves that depend on integrated work.
3. Then: early playable Artifact (same url `https://claude.ai/artifact/4LPrMM6ySuw2sn1DoeqyM4`), QA via playwright-cli, honest final report (Model·effort table, Decided without asking, Skipped: push blocked + tier-2 content, rate-limit event,
   orchestrator-model note, in-session lead work listed in handoff 08).
