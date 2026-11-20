# 04 · World spec — the 26 maps of Bellhaven

Audience: World workers (T3 tileset/builder + first maps, T4a–c remaining maps), content writers
(staging anchors), schedule authors. Map ids are fixed (`MAP_IDS` in `src/data/ids.js`). Format
contract: `01_RENDER_ART_UI_CONTRACTS.md` §3–4. **Anchor names below are mandatory** (events and
schedules refer to them); you may add more anchors, never rename these.

## 1. Conventions

- Every map defines: `entrance` (default arrival), `center`, `spot_a`..`spot_d` (four distinct,
  visible, walkable staging spots, spaced out, away from walls so two characters can stand side by
  side), `npc_1`..`npc_6` (idle spots where NPCs may stand/chat; `dir` set to face something
  sensible), `from_<neighbour>` for every connection, plus the map-specific anchors listed here.
- **Connections** (each is a pair of warps + `from_` anchors; `to` is `'map:from_other'`):
  `home_theo`–`cafe_lantern` · `cafe_lantern`–`town_harbor` · `town_harbor`–`town_square` ·
  `town_harbor`–`beach` · `town_square`–`town_park` · `town_square`–`school_grounds` ·
  `town_square`–{`bakery`,`flower_shop`,`bookstore`,`corner_mart`,`clinic`,`town_hall`} ·
  `school_grounds`–{`school_hall_1f`,`school_gym`,`school_field`,`hill_observatory`} ·
  `hill_observatory`–`observatory_dome` · `school_hall_1f`–{`school_library`,`school_cafeteria`,`school_hall_2f`} ·
  `school_hall_2f`–{`school_classroom`,`school_art_room`,`school_music_room`,`school_rooftop`} ·
  `school_rooftop`–`bell_tower` (warp `requires: { flag: 'main_rope_found' }`, `lockedText: 'The tower door is chained shut.'`).
  Warp extras: `requires?: Cond`, `lockedText?: string`, `sfx?` (`door_open` indoors, none outdoors).
- **Interactable ids are globally unique**: the builder auto-prefixes `${mapId}__${name}`; event authors use the
  full id (`bell_tower__bell`). Action shapes: see 01 §4.
- `ambient.music`: a `MUSIC_IDS` value, or `'town'` (the overworld picks `town_<season>`/`town_night`)
  or `'school'` (→ `school_day`, `school_class` during lessons). Weather applies outdoors only.
- Every connection must be reachable on foot from `entrance`; no sealed rooms; doors are 1–2 tiles wide;
  corridors ≥ 2 tiles wide outdoors so two characters can pass. Interiors: leave a walkable 1-tile border
  inside the walls clear of furniture where possible.
- Visual richness minimum: outdoors — ≥ 6 kinds of vegetation/props, lamp posts, benches, signs, animated
  water/flowers, path edges; indoors — wall variety, floor variety, windows with light, rugs/plants, props
  that tell who lives/works there. Make each place feel handmade, cozy, a little crowded.

## 2. Outdoor maps

| id | size | name (banner) | music / ambience | contents | extra anchors | interactables |
|---|---|---|---|---|---|---|
| `town_square` | 44×34 | Bell Square | `town` / — | plaza with fountain + clock post, cobbles, 6 doors: bakery (NW), flower shop (NE), bookstore (E), corner mart (SE), clinic (SW), town hall (N, grand steps); roads W→harbor, E→park, N→school hill (a gentle switchback up); benches, lamps, planters, a bus stop sign | `door_bakery`,`door_flower`,`door_books`,`door_mart`,`door_clinic`,`door_hall`,`fountain`,`bench_1`,`bench_2`,`road_west`,`road_east`,`road_north` | `board` {board town}, `vending` {shop vending_town}, `fountain` {text} |
| `town_harbor` | 48×30 | Harbor Street | `town` / waves | seaside promenade, Lantern Café (door), fish stalls, boats and crates, dock with benches and bollards, distant lighthouse, stairs to the beach, gulls; Mr. Finch's bench | `door_cafe`,`dock_end`,`dock_bench`,`finch_spot`,`fish_stall`,`lighthouse_view`,`stairs_beach`,`lantern_row`,`road_east` | `board` {board town}, `fish_stall` {text}, `dock_bench` {rest} |
| `town_park` | 40×30 | Heron Pond Park | `town` / birds | pond with a wooden bridge, cherry trees, bandstand, playground, picnic lawn, flower beds, benches, a cat nap spot | `bridge`,`pond_edge`,`bandstand`,`bench_1`,`bench_2`,`bench_3`,`picnic_a`,`picnic_b`,`picnic_c`,`cat_spot`,`cherry_tree`,`road_west` | benches {rest}, `pond` {text}, `playground` {text} |
| `beach` | 40×26 | Gull Cove | `beach` / waves | sandy cove, rocks and tide pools, driftwood, a boat on the sand, beach huts, steps up to the harbor | `shore`,`rocks`,`driftwood`,`sunrise_spot`,`stairs_up`,`fireworks_spot`,`sand_canvas` | `shells` {collect beach_shells}, `shell_hunt` {activity shell_hunt}, `rocks_bench` {rest} |
| `school_grounds` | 46×36 | Bellhaven High | `school` / birds | front gate (S), fountain courtyard, flower beds, bike racks, vending machine, main building façade (door) with the **bell tower** rising above, gym (W), path E to field, path N up to the observatory, festival stage (E), benches under trees | `gate`,`courtyard`,`fountain`,`bench_1`,`bench_2`,`bench_3`,`door_main`,`door_gym`,`road_field`,`path_hill`,`tree_shade`,`bike_rack`,`stage`,`stall_a`,`stall_b`,`stall_c`,`stall_d`,`ceremony_spot` | `board` {board school}, `vending` {shop vending_school}, benches {rest} |
| `school_field` | 44×30 | Sports Field | `sports` / birds | running track oval around a soccer pitch, bleachers, club shed, water fountain, hurdles, goal nets, long-jump pit | `track_start`,`track_finish`,`bleacher_top`,`bleacher_low`,`goal_a`,`goal_b`,`shed`,`water_fountain`,`relay_start` | `practice_track` {activity club_practice}, `practice_soccer` {activity club_practice}, `water_fountain` {rest} |
| `hill_observatory` | 34×28 | Lantern Hill Top | `observatory` / crickets (night) | grassy summit, small white dome observatory (door), stone terrace with telescope, bench, string lanterns, wide view of the harbor lights | `terrace`,`bench`,`lookout`,`door_dome`,`path_south`,`moon_spot` | `terrace_telescope` {activity stargaze}, `bench` {rest} |

## 3. School interiors

| id | size | name | music | contents | extra anchors | interactables |
|---|---|---|---|---|---|---|
| `school_hall_1f` | 36×14 | Main Hall, 1F | `school` | shoe lockers at the entrance, long corridor, doors to library and cafeteria, nurse's corner with a bed (east end), staff-room door, trophy case, notice board, vending machine, stairs up | `door_front`,`shoe_lockers`,`door_library`,`door_cafeteria`,`door_staff`,`stairs_up`,`trophy_case`,`board`,`vending`,`nurse_desk`,`nurse_bed` | `board` {board school}, `trophy_case` {text}, `vending` {shop vending_school}, `door_staff` {door_locked}, `nurse_bed` {rest} |
| `school_hall_2f` | 36×14 | Main Hall, 2F | `school` | classroom doors A, B (ours), C; art room, music room, student-council door, windows over the grounds, lockers, stairs down and stairs up to the roof | `door_class_a`,`door_class_b`,`door_class_c`,`door_music`,`door_art`,`council_door`,`stairs_down`,`stairs_roof`,`window_a`,`window_b`,`lockers` | `door_class_a` {door_locked}, `door_class_c` {door_locked}, `council_door` {door_locked} |
| `school_classroom` | 22×16 | Class B | `school` (→ `school_class` in lessons) | blackboard, teacher's desk, 24 desks in a 4×6 grid with seat anchors, windows with curtains, lockers, a plant, class notice board | `door`,`teacher_desk`,`board`,`seat_theo`,`seat_nina`,`seat_clara`,`seat_jules`,`seat_dante`,`seat_owen`,`seat_01`…`seat_14`,`window_seat` | `class_board` {text}, `desk_theo` {text} |
| `school_library` | 24×16 | Library | `library` | tall shelves, reading tables with lamps, a window-seat nook, librarian desk, computers, a cosy rug | `door`,`desk`,`table_1`,`table_2`,`table_3`,`nook`,`shelf_a`,`shelf_b`,`shelf_c`,`computer` | `study_table` {study library}, `shelf_a` {text}, `nook` {text} |
| `school_cafeteria` | 26×16 | Cafeteria | `school` | lunch counter with trays, long tables with benches, a menu board, windows, vending | `door`,`counter`,`table_1`…`table_6`,`window_table` | `lunch_counter` {shop cafeteria_lunch}, `menu_board` {text} |
| `school_art_room` | 22×14 | Art Room | `school` | easels, sinks, shelves of paint, drying racks, plaster busts, student art on walls | `door`,`easel_mari`,`easel_1`…`easel_4`,`teacher_desk`,`window`,`sink` | `practice_art` {activity club_practice} |
| `school_music_room` | 22×14 | Music Room | `school` | grand piano under a dust sheet, upright, drum kit, guitars, rows of chairs, window | `door`,`piano`,`guitar_corner`,`chairs_1`,`chairs_2`,`window`,`drum_kit` | `practice_music` {activity club_practice}, `piano` {text} |
| `school_gym` | 30×20 | Gymnasium | `sports` | basketball court markings, bleachers, a stage with curtains, equipment room | `door`,`court_center`,`stage`,`bleacher`,`equipment`,`hoop_a`,`hoop_b` | `equipment` {text} |
| `school_rooftop` | 26×16 | Rooftop | `rooftop` / wind | fence and a wide sky/sea view, benches, vending machine, small herb garden, water tank, Biscuit's cardboard bed, chained door to the bell tower | `door`,`fence_a`,`fence_b`,`bench`,`vending`,`cat_spot`,`tower_door`,`water_tank`,`garden` | `vending` {shop vending_school}, `bench` {rest}, `tower_door` {door_locked} |
| `bell_tower` | 12×16 | Bell Tower | `tense`/`sad` set by events | narrow stone stair, small landings, the great bell at the top | `base`,`stairs_mid`,`top`,`bell` | `bell` {text} (events override) |

## 4. Town interiors

| id | size | name | music | contents | extra anchors | interactables |
|---|---|---|---|---|---|---|
| `home_theo` | 20×14 | Theo's Room | `home_morning` | bedroom (bed, desk with a diary and lamp, bookshelf, wardrobe, window with a view of the harbor), small living/kitchen nook with table, a framed family photo, a calendar, TV; stairs door down to the café | `bed`,`desk`,`kitchen_table`,`door_stairs`,`window`,`shelf` | `bed` {sleep}, `desk` {study home}, `diary` {save}, `calendar` {calendar}, `shelf` {text}, `kitchen` {text} |
| `cafe_lantern` | 24×16 | The Lantern Café | `cafe` | counter with espresso machine, kitchen pass, 5 tables, window seats, hanging paper lanterns, chalkboard menu, jukebox, a door to the stairs up | `door_front`,`door_back`,`counter`,`kitchen`,`table_1`…`table_4`,`window_seat`,`jukebox` | `cafe_counter` {shop cafe_menu}, `cafe_job` {job cafe}, `jukebox` {text} |
| `bakery` | 16×12 | Calder Bakery | `cafe` | display cases of bread, oven, flour sacks, a table, family photos | `door`,`counter`,`oven`,`table_1` | `bakery_counter` {shop bakery} |
| `flower_shop` | 16×12 | Reyes Blooms | `cafe` | buckets and shelves of flowers, a work table with ribbon, a stool for Grandma Rosa, Mari's sketches pinned up | `door`,`counter`,`flowers_a`,`flowers_b`,`flowers_c` | `flower_counter` {shop flower_shop} |
| `bookstore` | 18×13 | Larkin Books | `library` | crammed shelves, a ladder, a reading nook with armchair, a cat-shaped bookend, counter | `door`,`counter`,`shelf_a`,`shelf_b`,`shelf_c`,`reading_nook` | `book_counter` {shop bookstore}, `shelf_a` {text} |
| `corner_mart` | 16×12 | Corner Mart | `town_night` (quiet) | shelves of snacks, drink fridges, a counter with a hand-written sign | `door`,`counter`,`shelf`,`fridge` | `mart_counter` {shop corner_mart} |
| `clinic` | 14×12 | Patel Clinic | `school_class` (soft) | waiting chairs, reception desk, two beds behind a curtain, a plant | `door`,`desk`,`bed_1`,`bed_2` | `clinic_desk` {shop clinic_pharmacy}, `clinic_bed` {rest} |
| `town_hall` | 22×16 | Town Hall | `school_class` (soft) | lobby with a big clock, mayor's office, meeting hall with rows of chairs and a stage, notice board, archive door | `door`,`lobby`,`stage`,`mayor_desk`,`notice_board`,`clock`,`archive_door` | `hall_board` {board town}, `archive_door` {door_locked} |
| `observatory_dome` | 14×12 | The Little Dome | `observatory` | round room, big brass telescope, star charts, a ladder, a kettle | `door`,`telescope`,`desk`,`ladder` | `telescope` {activity stargaze}, `star_chart` {text} |

## 5. What the World tasks deliver

- **T3**: `src/world/tiles.js` (catalog), `src/world/tileset.js` (4 seasons), `src/world/builder.js`
  (MapBuilder DSL + stamps/prefabs + autotile + validation), `src/world/index.js`
  (`getTileset(season)`, `getMap(id)`, `listMaps()`, `getAnchor('map:anchor')`, `MAP_IDS`), a 2D canvas
  **previewer** for dev (`src/dev/world_preview.js`), tests (`test/world/maps.test.mjs`: every map in
  `src/world/maps/` satisfies the conventions above, warps target existing `from_` anchors, everything
  reachable, no warp on a solid tile), and the first three maps `town_square`, `home_theo`,
  `school_classroom`. Doc: `docs/game/api/world.md` including the builder cheat-sheet and the tile catalog.
- **T4a/b/c**: the remaining 23 maps using the builder; same tests must stay green.
