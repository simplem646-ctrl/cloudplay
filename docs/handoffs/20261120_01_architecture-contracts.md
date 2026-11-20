# Handoff: Bellhaven Days — architecture, contracts and toolchain (2026-11-20)

Audience: a future Claude session (the orchestrating main session) resuming the build. **No-ask run in
progress** (the user said "work independently without asking me technical questions"); it ends with the final
report. Read `docs/game/00_OVERVIEW.md` first, then the doc for your area.

## The request (verbatim essentials)

Build the user's "dream video game": a **Harvest Moon: Back to Nature–style school-life sim / relationship RPG without
farming** (high school + town; fixed-name male protagonist; daily schedule with free choices; classes/studying/exams/
grades/progression; multiple romance options with unique stories; friendships; clubs/sports/events; connected explorable
town + school; seasonal calendar + festivals; main story + optional character stories + multiple endings). Strict HM:BtN
visual feel (pixel art, chibi proportions, cozy) with **entirely original** characters/locations/dialogue/art/music.
Tech: **Three.js**, frontend-only, **localStorage** saves, genuinely playable. Process: follow CloudPlay instructions +
`orchestrate` skill; 5 workstreams; ≤5 parallel sub-agents in worktrees; Sonnet 5.5 for main dev work; Firecrawl only via
the provided setup; **playwright-cli** to open/inspect/screenshot; fix problems; **publish as a Claude Artifact** if
supported; honest final report (what works, what was tested, what's unfinished, how to play).

## What happened this session

1. Read orchestrate skill + references, ran preflight (branch `claude/intelligent-edison-7ygncq`, clean, BASE bc0664c).
2. Probed the environment: npm works (three@0.170.0, esbuild@0.24.0 installed), Node 22, host Playwright Chromium has WebGL
   (SwiftShader), and the **container browser used by `playwright-cli` reaches host servers at `http://172.17.0.1:<port>/`**
   (not localhost) with WebGL too. Verified a gotcha: y-down ortho camera flips winding (use `DoubleSide`).
3. Designed the game and wrote the **contracts** every worker builds against (so parallel work fits together):
   `docs/game/00_OVERVIEW.md` (pillars, ownership, commands, worker rules), `01_RENDER_ART_UI_CONTRACTS.md` (320×240 pixel
   pipeline, tileset/map/sprite/portrait/icon/UI/input/audio formats), `02_SIM_CONTENT_CONTRACTS.md` (rules, balance, Stage
   API, event/dialogue/schedule/quest/ending/exam formats, save, debug API), `03_STORY_BIBLE.md` (world, main plot with
   dates, 5 romance routes with 10 canonical event ids each, friends, endings, writing guide), `04_WORLD_SPEC.md` (26 maps,
   mandatory anchors, connections, interactables).
4. Wrote lead-owned code contracts: `src/core/{constants,util,bus,rng}.js`, `src/data/{appearance,cast,calendar,ids,sheet_layout}.js`
   (29 named characters + seeded extras), `src/sim/state.js` (full JSON state schema + `createNewGame`), `src/sim/script_dsl.js`
   (all event ops, condition grammar, validators for events/dialogue/schedules).
5. Tooling: `scripts/{build,gen-registry,serve,shot,validate-content}.mjs`, `index.template.html`, `package.json` scripts
   (`gen build build:dev test validate serve`), `test/contracts.test.mjs`, stub `src/main.js`. The registry generator makes
   content/map/quest/ending files **drop-in** (no shared index files → no merge conflicts).
6. Created the 24-task plan (TaskList) with model·effort labels and dependencies.

## Decided without asking (no-ask log)

| Decision | Chosen | Why |
|---|---|---|
| Branch | stayed on `claude/intelligent-edison-7ygncq` (the system-prompt branch) | not on `main`; no new branch needed |
| Session model | Sonnet 5.5 orchestrator (skill expects Opus) | report line only; user asked for Sonnet 5.5 for main dev work |
| Setting/cast | Western-named cast, Japanese-style school life; fictional town **Bellhaven**; protagonist **Theo Hartley** | user left it open; natural English dialogue, matches HM:BtN localisation feel |
| Length | 3 school years × 4 seasons × 28 days | "academic progression" + multiple endings |
| Romance | 5 female love interests (Nina, Elise, Clara, Mari, Vera), 10 canonical events each | quality over count |
| Rendering | 320×240 logical, 16 px tiles, 16×24 chibi sprites, Three.js ortho + low-res render target | authentic HM:BtN pixel look |
| Packaging | esbuild → single self-contained `dist/index.html` | works from `file://`, publishable as an Artifact |
| Content layout | quests/endings/events/dialogue/schedules are one-file-per-author directories merged by `gen-registry` | avoids merge conflicts between parallel writers |
| Routing | code → sonnet (high for engine/world/art/sim core/academics, medium otherwise); story/romance + game-flow integration → opus·medium; review → opus·high | orchestrate model guide (taste/judgement vs scoped coding) |

## Task list (TaskList is the source of truth; ids as created)

Wave 1 (dispatch first): #1 T1 engine · #2 T3 world core · #3 T5 character art · #4 T7a sim core · #5 S1 main story.
Next as slots free: #6 T2 UI · #7 T7b events (after #4) · #8/#9/#10 T4a/b/c maps (after #2) · #11 S2 Nina+Elise, #12 S3 Clara+Mari+Vera,
#14 S4b dialogue (after #4) · #13 S4a friends/town events · #15 S4c schedules+exams · #16 T6 audio · #17 T8a academics, #18 T8b mini-games,
#20 T9b menus (after #1,#6,#4,#7) · #19 T9a core flow (after #1,#6,#2,#3,#4,#7) · then QA #21–#23 and review #24.
Re-plan trigger: if the task count passes ~36, stop and re-plan.

## Where things live

`docs/game/*` (contracts) · `src/core`, `src/data` (lead) · `scripts/*` · `test/contracts.test.mjs`. Workers add files only in
their owned dirs (see 00 §Workstreams) and write `docs/game/api/<area>.md`. Generated: `src/_generated/registry.js` (gitignored).

## Verification done

`npm test` → 5/5 pass (cast, calendar, state, DSL validator, ids/time/RNG). `npm run validate` → 0 errors (40 expected warnings:
no content yet). `npm run build` → 465 KB single file; `node scripts/shot.mjs` rendered the stub (320×240 canvas, geometry drawn).
`playwright-cli open http://172.17.0.1:8123/` worked (container browser, WebGL = SwiftShader). NOT yet verified: anything beyond the toolchain.

## Git state

Branch `claude/intelligent-edison-7ygncq`; this checkpoint is the first commit of the build (contracts + toolchain, no gameplay yet).
Push only this branch (`git push -u origin HEAD`). Worktree agents start from the commit that includes this handoff (`worktree.baseRef: head`).

## Open follow-ups

1. Dispatch wave 1 (#1–#5) in worktrees from the new BASE; integrate each with `integrate-worktree.sh`; verify; checkpoint-commit.
2. Keep dispatching queued tasks as slots free (≤5 running); commit a checkpoint after each integration batch (handoff → commit → push).
3. T9a/T9b need the `docs/game/api/*.md` of T1, T2, T3, T5, T7a, T7b: read them before briefing.
4. Final: playwright-cli QA with screenshots; build `dist/index.html`; publish as Artifact (quickstart → artifact-design skill; page contract:
   title 2–4 words, `:root` tokens, dark mode, phone-width layout); honest report; add `Model·effort used` table + Skipped list.
5. Report line: orchestrator session ran Sonnet 5.5 (skill expects Opus) — mention once in the final report.
