# 00 · Bellhaven Days — project overview (read this first)

A **Harvest Moon: Back to Nature–style life-sim / relationship RPG, set in a high school and its
town, without farming.** The player is **Theo Hartley**, a transfer student who lives above his
aunt's café. Over **3 school years** (4 seasons × 28 days each) he attends classes, studies, sits exams,
joins a club, works part-time, befriends the town, can fall for one of **five** love interests, and helps
save the school and ring its long-silent bell. Frontend-only; **Three.js** rendering at 320×240 with a
pixel-art pipeline; **localStorage** saves; **all art and sound are procedural/original**.

Docs: `01` rendering/art/world/UI/audio formats · `02` simulation & content formats ·
`03` story bible · `04` the 26 maps. Contract code: `src/core/*`, `src/data/*`, `src/sim/state.js`,
`src/sim/script_dsl.js`. **If a doc and the code disagree, the code wins; report the discrepancy.**

## Pillars (what the player should feel)

1. **Cozy daily rhythm** — wake, choose how to spend the day, walk a small living town, see the same
   faces change with seasons and weather.
2. **People first** — memorable characters with real arcs, funny banter, choices that matter.
3. **Student life with texture** — lessons you can attend or skip, exams that reward real study, clubs and
   sports with small satisfying mini-games, festivals worth looking forward to.
4. **Authentic Harvest-Moon charm** — chunky readable pixel art, chibi sprites, warm palette, bouncy
   music, tiny animations everywhere.

## Workstreams and tasks

| WS | Name | Tasks (owner dirs) |
|---|---|---|
| 1 | Engine & Interface | **T1** engine (`src/engine/**`) · **T2** UI toolkit (`src/ui/**`) |
| 2 | World & Environment | **T3** tileset + builder + 3 maps · **T4a/b/c** remaining maps (`src/world/**`) |
| 3 | Characters & Sound | **T5** character/portrait/icon/title art (`src/art/**`) · **T6** audio (`src/audio/**`) |
| 4 | Simulation & Gameplay | **T7a** core sim · **T7b** events/interpreter/dialogue/endings · **T8a** academics + scenes · **T8b** clubs/jobs/mini-games/shops scenes · **T9a** core game flow (boot/title/overworld/stage) · **T9b** menus/sleep/endings UI (`src/sim/**`, `src/scenes/**`, `src/main.js`) |
| 5 | Story & Content | **S1** main story/festivals/endings/quests · **S2** Nina+Elise · **S3** Clara+Mari+Vera · **S4a** friends/staff/town events · **S4b** dialogue pools · **S4c** schedules + exam banks (`src/content/**`) |

Lead (main session) owns: `src/core/**`, `src/data/{appearance,cast,calendar,ids,sheet_layout}.js`,
`src/sim/{state,script_dsl}.js` (initial), `scripts/**`, `docs/game/0*.md`, `index.template.html`, `package.json`,
integration, and all commits. **Workers never edit lead-owned files**: if a contract is wrong or
missing something, say so in your report with the exact change you need.

## Repo layout

```
src/core/      constants, util, bus, rng               (lead)
src/data/      cast, calendar, ids, appearance, sheet_layout (lead); items, shops, timetable (sim)
src/engine/    renderer, tilemap, actors, camera, lights, weather, input, scenes, mover, pathfinding
src/ui/        pixel font, windows, dialogue box, menus, HUD widgets
src/art/       procedural sprite / portrait / icon / title-art generators
src/audio/     WebAudio synth: sfx, music sequencer, ambience
src/world/     tiles, tileset, builder, maps/<id>.js, index.js
src/sim/       state, clock, calendar, weather, relationships, inventory, shops, schedules, save, events, interpreter, ...
src/scenes/    title, overworld, stage, class, exam, shop, minigames/*, menus/*, sleep, ending, ...
src/content/   events/*.js, dialogue/*.js, schedules/*.js, exams/*.js, quests/*.js, endings/*.js (one file per author)
src/dev/       per-task harness pages (src/dev/<task>_<name>.js)
src/main.js    boot (T9a)         src/_generated/ (gitignored)     test/<area>/*.test.mjs
docs/game/     these docs; docs/game/api/<area>.md = each task's final API doc (required deliverable)
```

## Commands

```bash
npm ci --prefer-offline            # in a fresh worktree (node_modules is not in git)
npm test                           # gen registry + node --test "test/**/*.test.mjs"
npm run validate                   # content validator (events, dialogue, schedules, ids)
npm run build                      # dist/index.html (single self-contained file)
node scripts/build.mjs --entry src/dev/<x>.js --out dist/dev/<x>.html     # a dev harness page
node scripts/shot.mjs <page.html> --out <png> [--scale 2] [--wait ms] [--eval js] [--keys k:ms,...]
node scripts/serve.mjs dist 8080   # for playwright-cli: open http://172.17.0.1:8080/ (NOT localhost)
```
**Always look at your screenshots** with the Read tool (it displays PNGs). Fix what you see.
Host Playwright (`scripts/shot.mjs`) opens built files directly from disk with WebGL (software). The lead
uses `playwright-cli` (a containerised browser) for final QA.

## Worker rules

1. Own only the paths in your brief. Never edit another task's files or lead-owned files. New shared needs → report.
2. **No git writes** (no commit, stash, reset, branch, push). Leave changes in the working tree.
3. Pure logic must run in plain Node (no DOM at import time) and have `node --test` tests under `test/<area>/`.
   Browser modules get a dev harness page and screenshot verification.
4. Deliver `docs/game/api/<area>.md`: the real exported API (signatures, examples, gotchas, how to run the
   harness), concise (≤ 250 lines). Later tasks code against it.
5. Everything original. No copied assets, names or text from existing games. No external URLs at runtime,
   no audio/image files: sprites and sounds are generated by code.
6. Performance: keep the main loop allocation-light; no per-frame canvas re-creation; must run on software WebGL.
7. Quality bar: it must **look and feel good**, not just run. Re-read your screenshots critically, polish.
8. Be honest in the report: what works, what you verified (commands + results), what is rough.

## Definition of done (project)

New game → morning in Theo's room → walk the town and school → attend/skip class → study/club/job/shop →
talk/gift/hearts → day/season/weather progression → festivals → exams + report cards → romance events and
confession → main story → graduation → ending; save/load works; no console errors in a normal playthrough;
the single-file build runs from `file://`.
