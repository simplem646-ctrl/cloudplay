# Handoff: chibi characters integrated (2026-11-21)

Audience: a future Claude session resuming the orchestrated game build. Sequel to `_05_content-integrated.md` (see `_01_` for request/design/decisions; `_04_` for the usage‑limit recovery recipe).
**NO‑ASK RUN IN PROGRESS** (never call AskUserQuestion; log decisions; ends with the final report).

## What happened
- **T5 characters (sonnet·high, resumed once after the usage limit) finished and was integrated** (16 files: `src/characters/**`, `tools/labs/characters-lab.html`, `tests/unit/characters-api.test.mjs`; BASE `a769d28`; the worker's scratch file was deleted and is not in the patch). Lead verification in the main checkout: `npm test` 84/84, contract `chars` OK, lineup of all 20 + game‑scale view + a Willa close‑up (`think` + `shy`, autumn) + the 8 critters inspected.
- **Delivered:** player + 19 NPCs (colour‑accurate hair/outfits per DESIGN §7), toon + inverted‑hull outlines, face atlas with blink/mouth flap, 10 emotes, 16 held props, all animations except a first‑pass `spin` (Tier 1–2 incl. `serve write hammer sit_read fall` as requested), 8 critters, `setSeason` (winter coat/scarf/beanie, summer light wear — least polished). 6–9 meshes / 12–18 draw calls per character; `update()` ≈ 0.002 ms; zero per‑frame allocations.
- **Contract notes for wiring:** call `Game.chars.preload()` once at load; put `rig.group.position` in world coordinates; pass `look:{hair,jacket,scarf}` from `state.meta.look` for `'player'`; `play(name)` with no `loop` uses the animation's own default; unknown animation/prop names degrade to idle/no prop with one warn; some animations auto‑equip a prop (rod for `fish_*`, broom, mug, book, …) and `setHeld(null)` restores the character's default item (pip net, ferris cane, bramwell staff); `sit`/`sleep` assume a seat/bed height the world must supply (group origin stays at the feet); blob shadows are the world's job (`addEntity(obj,{shadow})`).
- **Known weaknesses (accepted):** faces are tiny at game scale (silhouette/colour carry recognition; expressions read mainly in close‑ups); winter beanie doesn't cover juno/theo's spikes; poncho/cape hide arms; wide hats hide hair; beards hide mouths (gus/odell/bramwell); `bow/pickup/sad` show mostly the head top from the 52° camera; critter walk = body bob only; seasonal variants not checked up close.

## Decided without asking (additions)
| Decision | Chosen | Why |
|---|---|---|
| Accept head tilt‑back (0.3 rad) and constant outline 0.017 | yes | faces read better from the fixed 52° camera |
| Defer polishing seasonal outfits/critter legs | yes | cosmetic; budget is for the critical path |

## Running now
t4‑world (BASE a769d28), t6b‑ui (f808822), t7‑sim (280661a). Waiting on them before dispatching T9/T10 (areas, need T4) and T11 (world‑facing systems, needs T4+T6+T7; T5/T8 are done).

## Git state
Branch `claude/keen-bell-6isjol`, this commit = characters + handoff, pushed.

## Open follow‑ups
1. Integrate t4/t6b/t7 as they report; then T9/T10/T11 → T14 integration (wire audio, portraits, chars, ui, systems, world in `src/main.js`; add `?autostart`) → QA → review → publish. T12/T13 only if budget allows.
2. Watch for another usage‑limit hit (window ends ~04:10 UTC).
