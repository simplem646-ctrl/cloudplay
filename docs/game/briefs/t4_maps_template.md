# T4 brief template: build maps with the builder (src/world/maps/**)

Tier-1 maps: T4a = town_harbor, cafe_lantern, town_park, bakery, town_hall (town_hall was promoted from tier 2: the Year-3 board vote is staged there); T4b = school_grounds, school_field, school_rooftop, bell_tower; T4c = school_hall_1f, school_hall_2f, school_library.

## Context
- Tasks #8/#9/#10 (T4a/b/c) in the plan run by the orchestrator. Game: "Bellhaven Days", a Harvest-Moon-Back-to-Nature-style school life sim. The tileset (4 seasons), the MapBuilder DSL, validation, the Canvas2D previewer and three finished maps (`town_square`, `home_theo`, `school_classroom`) are already integrated (T3). You build the maps assigned in your prompt using the builder.
- READ FIRST: `docs/game/api/world.md` (the builder cheat-sheet, tile/stamp catalog, conventions; everything you need), `docs/game/04_WORLD_SPEC.md` (the rows for YOUR maps: size, contents, mandatory anchors, interactables, connections, music/ambience; the conventions in section 1), `docs/game/01_RENDER_ART_UI_CONTRACTS.md` sections 1 and 4, `src/data/ids.js`, and study the three finished maps in `src/world/maps/` for style and detail level. `docs/game/03_STORY_BIBLE.md` section 1 for flavour.
- Quality bar: each map must be beautiful, cozy and handmade, in all four seasons (outdoor maps) - dense with life (props, planters, signs, lamps, laundry lines, crates, bicycles, flower beds, clutter that tells who lives/works there), with a clear readable layout, natural paths, varied ground, edges and vegetation, so the town feels like one connected place. Interiors: a believable floor plan, windows with light, rugs, plants, personal props. Respect all mandatory anchors, `from_<neighbour>` anchors and warps (`to: 'neighbour:from_thismap'`) EXACTLY as in doc 04, and interactable actions from the spec. Ensure the NPC idle anchors (`npc_1..6`) are sensible standing spots facing something interesting.
- Neighbour maps that are not built yet (or are built by another parallel worker) are referenced by id only: warps/anchors must follow the naming convention so they connect automatically later.

## Required deliverables
1. One file per assigned map `src/world/maps/<id>.js` (default export per the builder docs).
2. Preview screenshots of every map (outdoor maps in all four seasons; indoor in one), reviewed and iterated until good (use the previewer described in world.md; open PNGs with the Read tool; also use `overlay=1` to check collision/anchors/warps).
3. `npm test` green (the world maps test validates your maps: anchors, warps, reachability, solid-tile warps...).
4. Add NO other files except small per-map helpers inside your own map files. If the builder lacks something you need (a tile, a stamp), do NOT edit `src/world/builder.js` / `tiles.js` / `tileset.js` (another worker may be editing in parallel); instead compose it from existing tiles/stamps and report the gap in your reply with a precise request.

## Tools and sources
- `npm ci --prefer-offline`; previewer build/shot commands are in `docs/game/api/world.md`; `npm test`.
