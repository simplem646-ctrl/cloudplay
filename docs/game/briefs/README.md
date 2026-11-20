# Worker briefs (Bellhaven Days)

The task briefs the orchestrator hands to sub-agents. A worker's prompt carries the standing rules (no commits, worktree base check, reply size) and names ONE of these
files: read it completely first, it holds the context, deliverables, owned files and done-criteria. They are kept in the repo so a resumed session can re-dispatch
without the original conversation. Briefs reflect the TRIMMED scope (see `docs/handoffs/20261120_03_rate-limit-pause.md`): where a brief and an old task description
disagree, the brief wins.

| brief | task |
|---|---|
| `romance_common.md` | S2 (Nina, Elise) and S3 (Clara, Mari, Vera): the prompt names the characters |
| `s4a_friends_town_events.md` | friends, staff, town, random and class events |
| `s4b_dialogue_pools.md` | dialogue pools for all non-romance NPCs and extras |
| `s4c_schedules_exams.md` | NPC schedules (the exam banks part is DONE) |
| `t4_maps_template.md` | tier-1 maps (the prompt names the maps) |
| `t8a_academics.md` | academic scenes (rules are done) |
| `t8b_activities.md` | shop / club / job / rest / nap / jog scenes (rules + mini-games done) |
| `t9a_core_flow.md` | boot, title, overworld, NPCs, stage, interactions, directors, debug |
| `t9b_menus.md` | pause tabs, sleep, save/load, settings, ending, credits |
