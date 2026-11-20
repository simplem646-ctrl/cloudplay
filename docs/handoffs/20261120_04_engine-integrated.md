# Handoff: T1 engine integrated (2026-11-20)

Audience: the orchestrating main session. Sequel to `20261120_03_rate-limit-pause.md` (read 01-03 for request, contracts, decision log, trimmed
scope). **No-ask run still in progress.** The API rate limit resets 23:40 UTC; a wake-up message is scheduled for 23:43 UTC
(`trig_01T7Zye17BNb4FQNkdMhuhki`) to resume the four failed workers.

## What happened

- `t1-engine` (a114aca6c71118d6a) was NOT cut off: it finished and reported before the limit hit. Integrated its patch (27 files, 4,608 lines) from worktree
  `agent-a114aca6c71118d6a` onto the feature branch with `integrate-worktree.sh` (BASE 26725ed, rollback tree 860eb46), verified, cleaned the worktree up.
- Cost yardstick: that worker used ~315k tokens / 79 tool calls / 22.5 min at sonnet·high. Plan remaining spend accordingly (see handoff 03 budget rules).
- Still down (resume at/after 23:40 UTC with `SendMessage {to: <name>}`; worktrees intact, BASE `26725ed1f010e208b0172a4d47f1d12a3c9fc4f1`):
  `t3-world` (a3aaf1a9054517742), `t5-art` (a553941a6798b6baf), `t7a-sim` (a1b2df200f90edad1), `s1-story` (af86ea4b35f16b61c). Their worktrees are the only 4 left in `git worktree list`.

## Engine facts later tasks must know (full API: `docs/game/api/engine.md`, 131 lines)

- `src/engine/index.js`: `createApp, Renderer/createRenderer, WorldView, Actor, Camera, Input, Scene, SceneManager, moveActor/mover/PathWalker, findPath` + grading/weather/fade helpers.
- `SceneManager.push/replace` RETURN A PROMISE resolved by the matching `pop(result)` (`undefined` on bare pop/replace/reset): `src/scenes/registry.js` `openScene` relies on it. Verified by unit tests.
- The canvas is sized from the container's content box (ResizeObserver), integer scale when it fits (`computeLayout`, unit-tested): the page template's 16px gutters hold.
- UI hooks the loop expects from the UI object: `ui.beginFrame()`, `ui.endFrame()`, `ui.canvas`, `ui.dirty` (false = skip upload). Added to the T2 brief.
- Input keys: arrows/WASD move, Z/Enter/Space confirm, X/Backspace cancel, **Esc = both cancel and menu**, Tab/M menu, Shift run, **C skip**, **Ctrl fast**, `` ` ``/F2 debug; touch overlay (`?touch=1` forces it); `input.inject(action, down)`, `repeat`, `axis`.
- Weather bus event `weather:lightning` (no thunder sfx id). Fireflies draw in an overlay pass after grading. Fade is a separate quad (does not cover the UI unless `renderer.fadeUI = true`).
  `findPath` returns `[{x,y}]` including start and goal. Lights are posterised to 5 Bayer-dithered bands (`renderer.lightSteps`). Extras: `gradingAt(minutes)`, `overcastGrading`, a `dawn` preset.
- `src/engine/mock/assets.js` (mock tileset x4 seasons, 40x30 map, CHAR_SHEET sprites, cat sheet, emote atlas) is NOT in the barrel but reusable by dev harnesses (T2/T8/T9 should reuse it to save tokens).

## Verification done

`npm test` 44/44 (incl. 35 engine tests); `engine_demo` harness built and screenshot reviewed by me (crisp 320x240 pixel output, y-sorting, shadows, lanterns, tileset, characters, letterbox);
`npm run build` OK. The worker also reviewed ~25 screenshots (seasons, weather, night lights, poses, touch overlay) and measured 60 fps on software WebGL plus a flat-memory map-reload check.
NOT verified by me: hidden-tab pause (only a `visibilitychange` handler), gamepad, touch on a real device.

## Git state

Branch `claude/intelligent-edison-7ygncq`; this checkpoint adds the engine. **Push still blocked** (HTTP 403, GitHub App not installed for the repo): local commits only.

## Open follow-ups

1. 23:43 UTC (or on resume): resume `t3-world`, `t5-art`, `t7a-sim`, `s1-story` per handoff 03; integrate each (BASE 26725ed...), verify, checkpoint.
2. Then dispatch in trimmed-scope order: T2 UI + T7b events + T6 audio + T4 tier-1 maps -> T9a flow + T8a academics + T9b menus + T8b tier-1 -> content -> early Artifact -> QA.
3. Final report: rate-limit event, trimmed scope, no push, orchestrator model note, token yardsticks.
