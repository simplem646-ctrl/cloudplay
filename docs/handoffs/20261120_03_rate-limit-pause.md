# Handoff: rate-limit pause and re-prioritised plan (2026-11-20)

Audience: the orchestrating main session after a resume. Sequel to `20261120_02_wave1-in-flight.md` (read 01 and 02 for the request,
contracts, decision log and queue). **No-ask run still in progress** (ends with the final report).

## What happened

- ~22:13-22:18 UTC the account hit its **API 5-hour usage limit (resets 23:40 UTC)**. Wave-1 workers died with HTTP 429 ("out of usage credits"):
  `s1-story` (af86ea4b35f16b61c, opus), `t3-world` (a3aaf1a9054517742), `t5-art` (a553941a6798b6baf), `t7a-sim` (a1b2df200f90edad1).
  `t1-engine` (a114aca6c71118d6a) was still running at 22:18 (worktree locked); it will probably fail the same way. **No work was lost**: every worktree
  under `/home/user/cloudplay/.claude/worktrees/agent-<id>/` holds the partial output, and a worker can be resumed with `SendMessage {to: <name>}` once the limit resets
  (it continues from its transcript).
- Partial state at 22:18 (uncommitted files inside the worktrees; BASE for integration remains `26725ed1f010e208b0172a4d47f1d12a3c9fc4f1`):
  T1 `src/engine/**` + `test/engine/**` (~4.2k lines); T3 `src/world/{palette,gfx,paint_*,tiles,tileset}.js` (tileset art done, builder/maps/index NOT yet; early tile sheets looked good);
  T5 `src/art/**` (~1.8k lines, gallery not verified); T7a `src/sim/{balance,calendar,clock,index,inventory,player,relationships,save,schedule,shop,weather}.js`,
  `src/data/{items,shops}.js`, `test/sim/**` (~3.4k lines, nearly complete, docs/verification pending); S1 `src/content/events/{main_y1,main_y2,main_y3,fest_shared}.js` (~1.6k lines, quests/endings/doc pending).
- **A wake-up message is scheduled for 2026-11-20 23:43 UTC** (trigger `trig_01T7Zye17BNb4FQNkdMhuhki`, task "Resume build after rate-limit reset"). If this session was
  reclaimed or restarted, do the resume steps below by hand (`git worktree list` first; if the worktrees are gone, re-dispatch from the briefs in the scratchpad
  `/tmp/claude-0/-home-user-cloudplay/a12cffcd-0bbf-5bf9-b5fa-e7cad974b968/scratchpad/briefs/`, which may also be gone: briefs are recoverable from docs 00-04 + task descriptions).
- Lesson: five parallel high-effort workers (each re-reading ~25k tokens of docs and looping on screenshots) consumed a whole window in ~15 minutes. **Tokens are the
  scarce resource**; the plan below spends them on the playable core first.

## Resume procedure (after 23:40 UTC)

1. `git worktree list`; confirm the five worktrees exist (failed workers are unlocked).
2. `SendMessage` each of `t1-engine`, `t3-world`, `t5-art`, `t7a-sim`, `s1-story`: "The rate limit has reset. Finish ONLY your core deliverables, in this order of importance:
   <their list>. Skip stretch goals; at most 4 more screenshot reviews; write the API doc concisely (<= 150 lines); run the Verify command; reply in <= 250 words."
   (T3: builder + `index.js` + the 3 maps + `world.md`; T5: finish sheets/portraits/icons/title + a gallery check; T7a: tests green + `sim.md`; S1: quests/main.js, endings, remaining
   festival events, `story_main.md`; T1: any missing pieces from its feature list + `engine.md`, the two lead additions: promise-returning `push()` and container-box sizing.)
3. When each reports: read the report, run its Verify command in the worktree, integrate (`integrate-worktree.sh <path> <branch> 26725ed1f010e208b0172a4d47f1d12a3c9fc4f1`),
   `npm test && npm run validate && npm run build`, look at ONE screenshot per visual module, `cleanup-worktree.sh`, checkpoint commit (new handoff), then dispatch the next batch.

## Trimmed scope and budget rules (SUPERSEDE task descriptions / briefs where they conflict)

Principle: a **polished, playable, honest** first version; breadth is added by tier only if budget remains. Publish an **early playable Artifact as soon as T9a lands**
(same `url` is updated in place later), so something playable exists even if credits run out.

- Effort: `sonnet·medium` by default (high only for engine/sim/flow fixes). **No new Opus workers**; S1 (already opus) finishes and S2/S3 become `sonnet·medium`.
  Briefs must say: read only the sections you need (not all docs), <= 6 screenshot reads per task, concise API docs, no stretch goals, reply <= 250 words.
- Maps. Tier 1 (build first; 13 total with T3's 3): `town_harbor`, `cafe_lantern`, `school_grounds`, `school_hall_1f`, `school_hall_2f`, `school_library`, `school_rooftop`,
  `school_field`, `town_park`, `bakery`, `bell_tower` (small, needed for the finale). Tier 2 (only if budget remains): `beach`, `flower_shop`, `bookstore`, `corner_mart`, `clinic`,
  `town_hall`, `school_cafeteria`, `school_art_room`, `school_music_room`, `school_gym`, `hill_observatory`, `observatory_dome`. Missing maps must degrade gracefully (T9a: closed door line);
  schedules/events only reference built maps (the validator checks anchors only when all 26 exist).
- Mini-games tier 1: `track_sprint`, `music_rhythm`, `cafe_serve` + shop, rest, nap, jog, study. Tier 2: `soccer_penalty`, `art_palette`, `literature_words`, `astronomy_stars`, stargaze, shell_hunt
  (a club whose mini-game is missing falls back to a simple timing mini-game or auto-result in `club_practice`).
- Audio tier 1: `title`, `town_spring`, `town_night`, `school_day`, `school_class`, `cafe`, `festival`, `romantic`, `sad`, `exam`, `ending_good`, `credits` + core SFX + 3 ambiences
  (`rain`, `waves`, `birds`); every other id aliases to the nearest implemented one (seasonal town themes via transposition) so nothing is silent or throws.
- Romance tier 1 (per heroine, 6 events): `_01_meet`, `_02_spark`, `_03_secret`, `_04_festival`, `_06_confession`, `_09_promise` (+ `_08_climax` if cheap); dialogue pools >= 15 `talk`
  and 6 `repeat` entries; gifts; endings slides. Tier 2: `_05_crisis`, `_07_date`, `_08_climax`, `_10_farewell`, small slice-of-life events.
- Friends/staff/town (S4a) tier 1: `jules_01_guide`, `dante_01_rival`, `owen_01_observatory` (stage on built maps), `bruno_03_farewell`, 4 `roz_*`, 3 `finch_*`, 6 `rand_*`, 10 `class_*`.
  S4b pools >= 10 `talk` entries per NPC. S4c: schedules only for characters/maps that exist + exam banks >= 16 questions per subject (6 per tier).
- QA: the lead drives the build with `playwright-cli`/`scripts/shot.mjs` and fixes small issues directly; delegate only substantial fixes.

## Git state

Branch `claude/intelligent-edison-7ygncq`: `26725ed` (contracts), `0c85d2e` (conventions + Artifact-ready template + scene registry), plus this handoff's commit. **Push is blocked** (HTTP 403,
Claude GitHub App not installed for `simplem646-ctrl/cloudplay`); all commits are local. Retry `git push -u origin HEAD` at checkpoints; list under **Skipped** in the final report.

## Open follow-ups

1. At 23:43 UTC (or on resume) follow "Resume procedure" above; verify T1's final state (it may have finished or failed after this note).
2. Dispatch order after wave 1 integrates (each with the trimmed scope): T2 UI + T7b events + T6 audio + T4 tier-1 maps (a: harbor/cafe/park/bakery, b: grounds/field/rooftop/bell_tower,
   c: hall_1f/hall_2f/library) -> T9a core flow (needs T1,T2,T3,T5,T7a,T7b, audio) + T8a academics + T9b menus + T8b tier-1 -> content S4c/S2/S3/S4a/S4b -> early Artifact -> QA/polish.
3. Final report additions: this rate-limit event, the trimmed scope actually delivered, what was NOT built (list tier-2 items), no GitHub push, orchestrator model note.
