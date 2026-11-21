// Machine-readable copy of docs/game/04_WORLD_SPEC.md: sizes, connections, mandatory anchors and the
// interactables the spec names. validateMap() and test/world/maps.test.mjs read it, so every map worker
// gets the doc-04 conventions checked for free. PURE DATA.

export const COMMON_ANCHORS = ['entrance', 'center', 'spot_a', 'spot_b', 'spot_c', 'spot_d', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6'];

export const SIZES = {
  town_square: [44, 34], town_harbor: [48, 30], town_park: [40, 30], beach: [40, 26], school_grounds: [46, 36],
  school_field: [44, 30], hill_observatory: [34, 28], school_hall_1f: [36, 14], school_hall_2f: [36, 14],
  school_classroom: [22, 16], school_library: [24, 16], school_cafeteria: [26, 16], school_art_room: [22, 14],
  school_music_room: [22, 14], school_gym: [30, 20], school_rooftop: [26, 16], bell_tower: [12, 16],
  home_theo: [20, 14], cafe_lantern: [24, 16], bakery: [16, 12], flower_shop: [16, 12], bookstore: [18, 13],
  corner_mart: [16, 12], clinic: [14, 12], town_hall: [22, 16], observatory_dome: [14, 12],
};

export const INDOOR = new Set([
  'school_hall_1f', 'school_hall_2f', 'school_classroom', 'school_library', 'school_cafeteria', 'school_art_room',
  'school_music_room', 'school_gym', 'school_rooftop', 'bell_tower', 'home_theo', 'cafe_lantern', 'bakery', 'flower_shop',
  'bookstore', 'corner_mart', 'clinic', 'town_hall', 'observatory_dome',
]);

// each pair is a two-way connection: A has warp to 'B:from_A' and anchor from_B (and vice versa)
export const CONNECTIONS = [
  ['home_theo', 'cafe_lantern'], ['cafe_lantern', 'town_harbor'], ['town_harbor', 'town_square'], ['town_harbor', 'beach'],
  ['town_square', 'town_park'], ['town_square', 'school_grounds'],
  ...['bakery', 'flower_shop', 'bookstore', 'corner_mart', 'clinic', 'town_hall'].map((m) => ['town_square', m]),
  ...['school_hall_1f', 'school_gym', 'school_field', 'hill_observatory'].map((m) => ['school_grounds', m]),
  ['hill_observatory', 'observatory_dome'],
  ...['school_library', 'school_cafeteria', 'school_hall_2f'].map((m) => ['school_hall_1f', m]),
  ...['school_classroom', 'school_art_room', 'school_music_room', 'school_rooftop'].map((m) => ['school_hall_2f', m]),
  ['school_rooftop', 'bell_tower'],
];
// one-way exceptions: the bell tower has no mandatory warp back requirement beyond the normal pair, but the
// rooftop -> tower warp must carry this `requires` (flag) and lockedText
export const GATED_WARPS = { 'school_rooftop>bell_tower': { requires: { flag: 'main_rope_found' }, lockedText: 'The tower door is chained shut.' } };

export const NEIGHBOURS = {};
for (const [a, b] of CONNECTIONS) {
  (NEIGHBOURS[a] ||= []).push(b);
  (NEIGHBOURS[b] ||= []).push(a);
}

const seats = ['theo', 'nina', 'clara', 'jules', 'dante', 'owen'].map((n) => `seat_${n}`)
  .concat(Array.from({ length: 14 }, (_, i) => `seat_${String(i + 1).padStart(2, '0')}`));
const n = (p, k) => Array.from({ length: k }, (_, i) => `${p}${i + 1}`);

export const EXTRA_ANCHORS = {
  town_square: ['door_bakery', 'door_flower', 'door_books', 'door_mart', 'door_clinic', 'door_hall', 'fountain', 'bench_1', 'bench_2', 'road_west', 'road_east', 'road_north'],
  town_harbor: ['door_cafe', 'dock_end', 'dock_bench', 'finch_spot', 'fish_stall', 'lighthouse_view', 'stairs_beach', 'lantern_row', 'road_east'],
  town_park: ['bridge', 'pond_edge', 'bandstand', 'bench_1', 'bench_2', 'bench_3', 'picnic_a', 'picnic_b', 'picnic_c', 'cat_spot', 'cherry_tree', 'road_west'],
  beach: ['shore', 'rocks', 'driftwood', 'sunrise_spot', 'stairs_up', 'fireworks_spot', 'sand_canvas'],
  school_grounds: ['gate', 'courtyard', 'fountain', 'bench_1', 'bench_2', 'bench_3', 'door_main', 'door_gym', 'road_field', 'path_hill', 'tree_shade', 'bike_rack', 'stage', 'stall_a', 'stall_b', 'stall_c', 'stall_d', 'ceremony_spot'],
  school_field: ['track_start', 'track_finish', 'bleacher_top', 'bleacher_low', 'goal_a', 'goal_b', 'shed', 'water_fountain', 'relay_start'],
  hill_observatory: ['terrace', 'bench', 'lookout', 'door_dome', 'path_south', 'moon_spot'],
  school_hall_1f: ['door_front', 'shoe_lockers', 'door_library', 'door_cafeteria', 'door_staff', 'stairs_up', 'trophy_case', 'board', 'vending', 'nurse_desk', 'nurse_bed'],
  school_hall_2f: ['door_class_a', 'door_class_b', 'door_class_c', 'door_music', 'door_art', 'council_door', 'stairs_down', 'stairs_roof', 'window_a', 'window_b', 'lockers'],
  school_classroom: ['door', 'teacher_desk', 'board', ...seats, 'window_seat'],
  school_library: ['door', 'desk', 'table_1', 'table_2', 'table_3', 'nook', 'shelf_a', 'shelf_b', 'shelf_c', 'computer'],
  school_cafeteria: ['door', 'counter', ...n('table_', 6), 'window_table'],
  school_art_room: ['door', 'easel_mari', ...n('easel_', 4), 'teacher_desk', 'window', 'sink'],
  school_music_room: ['door', 'piano', 'guitar_corner', 'chairs_1', 'chairs_2', 'window', 'drum_kit'],
  school_gym: ['door', 'court_center', 'stage', 'bleacher', 'equipment', 'hoop_a', 'hoop_b'],
  school_rooftop: ['door', 'fence_a', 'fence_b', 'bench', 'vending', 'cat_spot', 'tower_door', 'water_tank', 'garden'],
  bell_tower: ['base', 'stairs_mid', 'top', 'bell'],
  home_theo: ['bed', 'desk', 'kitchen_table', 'door_stairs', 'window', 'shelf'],
  cafe_lantern: ['door_front', 'door_back', 'counter', 'kitchen', ...n('table_', 4), 'window_seat', 'jukebox'],
  bakery: ['door', 'counter', 'oven', 'table_1'],
  flower_shop: ['door', 'counter', 'flowers_a', 'flowers_b', 'flowers_c'],
  bookstore: ['door', 'counter', 'shelf_a', 'shelf_b', 'shelf_c', 'reading_nook'],
  corner_mart: ['door', 'counter', 'shelf', 'fridge'],
  clinic: ['door', 'desk', 'bed_1', 'bed_2'],
  town_hall: ['door', 'lobby', 'stage', 'mayor_desk', 'notice_board', 'clock', 'archive_door'],
  observatory_dome: ['door', 'telescope', 'desk', 'ladder'],
};

// interactables named in doc 04 (short name -> expected action: type + required fields)
const T = (type, extra = {}) => ({ type, ...extra });
export const REQUIRED_INTERACTABLES = {
  town_square: { board: T('board', { id: 'town' }), vending: T('shop', { shop: 'vending_town' }), fountain: T('text') },
  town_harbor: { board: T('board', { id: 'town' }), fish_stall: T('text'), dock_bench: T('rest') },
  town_park: { pond: T('text'), playground: T('text') },
  beach: { shells: T('collect', { table: 'beach_shells' }), shell_hunt: T('activity', { id: 'shell_hunt' }), rocks_bench: T('rest') },
  school_grounds: { board: T('board', { id: 'school' }), vending: T('shop', { shop: 'vending_school' }) },
  school_field: { practice_track: T('activity', { id: 'club_practice' }), practice_soccer: T('activity', { id: 'club_practice' }), water_fountain: T('rest') },
  hill_observatory: { terrace_telescope: T('activity', { id: 'stargaze' }), bench: T('rest') },
  school_hall_1f: { board: T('board', { id: 'school' }), trophy_case: T('text'), vending: T('shop', { shop: 'vending_school' }), door_staff: T('door_locked'), nurse_bed: T('rest') },
  school_hall_2f: { door_class_a: T('door_locked'), door_class_c: T('door_locked'), council_door: T('door_locked') },
  school_classroom: { class_board: T('text'), desk_theo: T('text') },
  school_library: { study_table: T('study', { place: 'library' }), shelf_a: T('text'), nook: T('text') },
  school_cafeteria: { lunch_counter: T('shop', { shop: 'cafeteria_lunch' }), menu_board: T('text') },
  school_art_room: { practice_art: T('activity', { id: 'club_practice' }) },
  school_music_room: { practice_music: T('activity', { id: 'club_practice' }), piano: T('text') },
  school_gym: { equipment: T('text') },
  school_rooftop: { vending: T('shop', { shop: 'vending_school' }), bench: T('rest'), tower_door: T('door_locked') },
  bell_tower: { bell: T('text') },
  home_theo: { bed: T('sleep'), desk: T('study', { place: 'home' }), diary: T('save'), calendar: T('calendar'), shelf: T('text'), kitchen: T('text') },
  cafe_lantern: { cafe_counter: T('shop', { shop: 'cafe_menu' }), cafe_job: T('job', { id: 'cafe' }), jukebox: T('text') },
  bakery: { bakery_counter: T('shop', { shop: 'bakery' }) },
  flower_shop: { flower_counter: T('shop', { shop: 'flower_shop' }) },
  bookstore: { book_counter: T('shop', { shop: 'bookstore' }), shelf_a: T('text') },
  corner_mart: { mart_counter: T('shop', { shop: 'corner_mart' }) },
  clinic: { clinic_desk: T('shop', { shop: 'clinic_pharmacy' }), clinic_bed: T('rest') },
  town_hall: { hall_board: T('board', { id: 'town' }), archive_door: T('door_locked') },
  observatory_dome: { telescope: T('activity', { id: 'stargaze' }), star_chart: T('text') },
};

/** all anchors a map must define */
export function requiredAnchors(id) {
  return [...COMMON_ANCHORS, ...(EXTRA_ANCHORS[id] || []), ...(NEIGHBOURS[id] || []).map((m) => `from_${m}`)];
}
