// NPC schedules. First rule whose `when` passes wins. Slot = latest `from` <= now. hidden = at home / inside.
const S = (from, area, at, anim, o = {}) => ({ from, area, at, ...(anim ? { anim } : {}), ...o });
const H = (from, area, at) => ({ from, area, at, hidden: true });
const WET = { weather: ['rain', 'storm', 'snow'] };

// ---------------------------------------------------------------- mira
const mira = [
  { when: { weekday: 'sun' }, slots: [
    H('06:00', 'bakery', 'upstairs'), S('09:30', 'bakery', 'table_bk_1', 'eat', { hold: 'mug' }),
    S('11:00', 'riverside_park', 'picnic_blanket', 'sit', { hold: 'basket' }), S('14:00', 'library', 'shelf_row_1', 'idle', { wander: 2 }),
    S('16:30', 'riverside_park', 'gazebo_spot', 'sit'), S('18:30', 'town_square', 'bench_sq_1_spot', 'sit'), H('20:00', 'bakery', 'upstairs'),
  ] },
  { when: WET, slots: [
    S('06:00', 'bakery', 'oven_spot', 'knead'), S('07:00', 'bakery', 'kneading_table', 'knead'), S('09:00', 'bakery', 'behind_counter', 'serve'),
    S('12:00', 'bakery', 'table_bk_1', 'eat'), S('13:00', 'bakery', 'behind_counter', 'serve'), S('17:00', 'bakery', 'table_bk_2', 'write'),
    H('20:00', 'bakery', 'upstairs'),
  ] },
  { slots: [
    S('06:00', 'bakery', 'oven_spot', 'knead'), S('07:00', 'bakery', 'kneading_table', 'knead'), S('09:00', 'bakery', 'behind_counter', 'serve'),
    S('11:30', 'town_square', 'bakery_steps', 'walk'), S('12:00', 'town_square', 'bench_sq_1_spot', 'eat', { hold: 'bread' }),
    S('13:00', 'bakery', 'behind_counter', 'serve'), S('16:00', 'bakery', 'kneading_table', 'knead'),
    S('17:00', 'riverside_park', 'bench_rp_1_spot', 'sit', { wander: 3 }), S('19:00', 'riverside_park', 'gazebo_spot', 'idle'),
    H('20:00', 'bakery', 'upstairs'),
  ] },
];

// ---------------------------------------------------------------- willa
const willaDay = (evening) => [
  H('06:00', 'library', 'upstairs'), S('09:30', 'library', 'behind_desk', 'write'), S('10:00', 'library', 'desk_front', 'idle'),
  S('12:30', 'library', 'reading_nook', 'sit_read', { hold: 'book' }), S('14:00', 'library', 'shelf_row_1', 'idle', { wander: 2 }),
  S('15:30', 'library', 'behind_desk', 'write'), S('17:45', 'library', 'desk_front', 'idle'), ...evening,
];
const willa = [
  { when: { weekday: 'tue' }, slots: [
    H('06:00', 'library', 'upstairs'), S('09:00', 'riverside_park', 'bench_rp_2_spot', 'sit_read', { hold: 'book' }),
    S('13:00', 'riverside_park', 'pond_edge', 'sit_read', { hold: 'book' }), S('17:30', 'starview_hill', 'view_bench_spot', 'sit'),
    H('21:00', 'library', 'upstairs'),
  ] },
  { when: WET, slots: [
    H('06:00', 'library', 'upstairs'), S('09:30', 'library', 'behind_desk', 'write'), S('10:00', 'library', 'reading_nook', 'sit_read', { hold: 'book' }),
    S('12:30', 'library', 'desk_front', 'idle'), S('14:00', 'library', 'reading_nook', 'sit_read', { hold: 'book' }),
    S('17:00', 'library', 'desk_front', 'idle'), H('18:30', 'library', 'upstairs'),
  ] },
  { when: { weekday: 'fri' }, slots: willaDay([S('19:00', 'starview_hill', 'view_bench_spot', 'sit'), H('22:00', 'library', 'upstairs')]) },
  { slots: willaDay([H('18:30', 'library', 'upstairs')]) },
];

// ---------------------------------------------------------------- juno
const juno = [
  { when: { weekday: 'thu' }, slots: [
    H('05:00', 'fishing_hut', 'bunk'), S('06:30', 'harbor', 'pier_start', 'run'), S('07:00', 'market_street', 'street_east', 'run'),
    S('08:00', 'market_street', 'street_mid', 'run'), S('09:00', 'market_street', 'street_west', 'run'), S('10:00', 'town_square', 'plaza_center', 'stretch'),
    S('11:30', 'market_street', 'street_east', 'run'), S('12:30', 'harbor', 'harbor_bench_spot', 'eat'), S('14:00', 'fishing_hut', 'tackle_wall_spot', 'hammer'),
    S('18:00', 'harbor', 'sunset_spot', 'sit'), H('21:00', 'fishing_hut', 'bunk'),
  ] },
  { when: WET, slots: [
    H('05:00', 'fishing_hut', 'bunk'), S('07:00', 'fishing_hut', 'tackle_wall_spot', 'hammer'), S('12:00', 'fishing_hut', 'stove_fh', 'eat'),
    S('13:00', 'fishing_hut', 'tackle_wall_spot', 'hammer'), S('18:00', 'fishing_hut', 'ledger_spot', 'write'), H('21:00', 'fishing_hut', 'bunk'),
  ] },
  { slots: [
    S('05:00', 'harbor', 'boat_dock', 'idle', { wander: 2 }), S('07:00', 'harbor', 'pier_end', 'fish_wait', { hold: 'rod' }),
    S('12:00', 'harbor', 'harbor_bench_spot', 'eat'), S('13:00', 'fishing_hut', 'tackle_wall_spot', 'hammer'),
    S('17:00', 'harbor', 'hut_steps', 'stretch'), S('18:00', 'harbor', 'sunset_spot', 'sit'), H('21:00', 'fishing_hut', 'bunk'),
  ] },
];

// ---------------------------------------------------------------- rhea
const rheaWorkday = [
  H('06:00', 'cafe', 'upstairs'), S('07:30', 'cafe', 'coffee_machine_spot', 'serve'), S('08:00', 'cafe', 'behind_counter', 'serve'),
  S('11:30', 'cafe', 'coffee_machine_spot', 'serve', { hold: 'mug' }), S('14:00', 'town_square', 'cafe_terrace_1', 'drink', { hold: 'mug' }),
  S('14:30', 'cafe', 'behind_counter', 'serve'), S('20:00', 'cafe', 'piano_spot', 'sit'), H('23:00', 'cafe', 'upstairs'),
];
const rhea = [
  { when: [{ weekday: 'mon' }, WET], slots: [
    H('06:00', 'cafe', 'upstairs'), S('09:00', 'cafe', 'coffee_machine_spot', 'serve'), S('12:00', 'cafe', 'table_cf_1', 'eat'),
    S('14:00', 'cafe', 'behind_counter', 'write'), S('19:00', 'cafe', 'piano_spot', 'sit'), H('23:00', 'cafe', 'upstairs'),
  ] },
  { when: { weekday: 'mon' }, slots: [
    H('06:00', 'cafe', 'upstairs'), S('09:00', 'general_store', 'shelf_row_1', 'idle', { wander: 2 }), S('10:30', 'general_store', 'counter_front', 'idle'),
    S('11:15', 'market_street', 'fruit_stand', 'idle'), S('12:30', 'riverside_park', 'bench_rp_2_spot', 'sit', { hold: 'bag' }),
    S('16:00', 'riverside_park', 'river_bank_2', 'sit'), S('18:30', 'cafe', 'coffee_machine_spot', 'idle'), S('20:00', 'cafe', 'piano_spot', 'sit'),
    H('23:00', 'cafe', 'upstairs'),
  ] },
  { slots: rheaWorkday },
];

// ---------------------------------------------------------------- celeste
const celeste = [
  { when: WET, slots: [
    H('06:00', 'observatory', 'cot'), S('15:00', 'observatory', 'star_map_spot', 'yawn'), S('16:00', 'observatory', 'desk_obs_spot', 'write'),
    S('20:00', 'observatory', 'telescope_big_spot', 'stargaze'), S('23:00', 'observatory', 'desk_obs_spot', 'write'), H('25:00', 'observatory', 'cot'),
  ] },
  { slots: [
    H('06:00', 'observatory', 'cot'), S('15:00', 'observatory', 'star_map_spot', 'stretch'), S('16:00', 'observatory', 'desk_obs_spot', 'write'),
    S('20:00', 'starview_hill', 'telescope_spot', 'stargaze', { hold: 'telescope' }), H('25:00', 'observatory', 'cot'),
  ] },
];

// ---------------------------------------------------------------- theo
const theoWorkday = (store) => [
  H('06:00', 'general_store', 'back_room'), S('07:00', ...store, 'idle', { hold: 'parcel' }), S('09:00', 'market_street', 'street_mid', 'carry_walk', { hold: 'parcel' }),
  S('10:00', 'town_square', 'noticeboard_spot', 'idle'), S('11:00', 'harbor', 'net_rack', 'idle'), S('12:00', 'riverside_park', 'bench_rp_1_spot', 'eat', { hold: 'bread' }),
  S('13:00', ...store, 'idle'), S('15:00', 'market_street', 'postbox_spot', 'idle'), S('16:00', 'town_square', 'plaza_center', 'run'),
  S('17:00', 'harbor', 'crates', 'idle'), S('18:00', 'inn', 'table_inn_1', 'sit'), H('21:30', 'general_store', 'back_room'),
];
const theo = [
  { when: { weekday: 'sun' }, slots: [
    H('06:00', 'general_store', 'back_room'), S('10:00', 'riverside_park', 'swing', 'sit'), S('12:00', 'harbor', 'beach_shells', 'idle', { wander: 3 }),
    S('15:00', 'market_street', 'bench_ms_1_spot', 'sit'), S('18:00', 'inn', 'table_inn_1', 'sit'), H('22:00', 'general_store', 'back_room'),
  ] },
  { when: { weekday: 'wed' }, slots: theoWorkday(['market_street', 'store_steps']) },
  { when: WET, slots: [
    H('06:00', 'general_store', 'back_room'), S('07:00', 'general_store', 'post_counter_spot', 'idle'), S('12:00', 'general_store', 'back_room', 'eat'),
    S('13:00', 'general_store', 'post_counter_spot', 'idle'), S('18:00', 'inn', 'table_inn_1', 'sit'), H('21:30', 'general_store', 'back_room'),
  ] },
  { slots: theoWorkday(['general_store', 'post_counter_spot']) },
];

// ---------------------------------------------------------------- odell
const odell = [
  { when: { weekday: ['sat', 'sun'] }, slots: [
    H('06:00', 'town_hall', 'flag_spot'), S('09:00', 'town_square', 'fountain_spot', 'idle'), S('10:30', 'riverside_park', 'bench_rp_1_spot', 'sit'),
    S('12:00', 'market_street', 'fruit_stand', 'idle'), S('13:30', 'harbor', 'harbor_bench_spot', 'sit'), S('15:30', 'town_square', 'tree_shade', 'idle'),
    S('17:30', 'town_square', 'clock_tower', 'idle'), S('19:30', 'town_square', 'bench_sq_1_spot', 'sit'), H('21:00', 'town_hall', 'flag_spot'),
  ] },
  { when: WET, slots: [
    H('06:00', 'town_hall', 'flag_spot'), S('09:00', 'town_hall', 'behind_desk', 'write'), S('12:00', 'town_hall', 'window_th', 'eat', { hold: 'mug' }),
    S('13:00', 'town_hall', 'behind_desk', 'write'), S('16:00', 'town_hall', 'meeting_table', 'idle'), S('17:30', 'town_hall', 'window_th', 'idle'),
    H('19:30', 'town_hall', 'flag_spot'),
  ] },
  { slots: [
    H('06:00', 'town_hall', 'flag_spot'), S('09:00', 'town_hall', 'behind_desk', 'write'), S('12:00', 'town_square', 'fountain_spot', 'eat'),
    S('13:00', 'town_hall', 'behind_desk', 'write'), S('16:00', 'town_square', 'plaza_center', 'idle', { wander: 3 }), S('17:30', 'town_square', 'clock_tower', 'idle'),
    S('19:30', 'town_square', 'bench_sq_1_spot', 'sit'), H('21:00', 'town_hall', 'flag_spot'),
  ] },
];

// ---------------------------------------------------------------- nana_fen
const nana_fen = [
  { when: WET, slots: [
    H('06:00', 'inn', 'stairs'), S('08:00', 'inn', 'behind_reception', 'serve'), S('12:30', 'inn', 'hearth_spot', 'sit', { hold: 'mug' }),
    S('16:30', 'inn', 'behind_reception', 'serve'), H('21:00', 'inn', 'stairs'),
  ] },
  { slots: [
    H('06:00', 'inn', 'stairs'), S('08:00', 'inn', 'behind_reception', 'serve'), S('12:30', 'inn', 'hearth_spot', 'sit', { hold: 'mug' }),
    S('14:00', 'market_street', 'bench_ms_1_spot', 'sit'), S('16:30', 'inn', 'behind_reception', 'serve'), S('19:00', 'inn', 'hearth_spot', 'sit'),
    H('21:00', 'inn', 'stairs'),
  ] },
];

// ---------------------------------------------------------------- gus
const gus = [
  { when: [{ weekday: 'thu' }], slots: [
    H('06:00', 'fishing_hut', 'bunk'), S('08:00', 'harbor', 'harbor_bench_spot', 'sit'), S('12:00', 'harbor', 'boat_dock', 'idle'),
    S('14:00', 'harbor', 'lighthouse_base', 'idle', { wander: 2 }), S('18:00', 'harbor', 'sunset_spot', 'sit'), H('20:00', 'fishing_hut', 'bunk'),
  ] },
  { when: WET, slots: [
    S('06:00', 'fishing_hut', 'behind_counter', 'idle'), S('12:00', 'fishing_hut', 'stove_fh', 'eat'), S('13:00', 'fishing_hut', 'ledger_spot', 'write'),
    S('18:00', 'fishing_hut', 'stove_fh', 'sit'), H('21:00', 'fishing_hut', 'bunk'),
  ] },
  { slots: [
    S('06:00', 'fishing_hut', 'behind_counter', 'idle'), S('09:00', 'harbor', 'harbor_bench_spot', 'sit'), S('11:00', 'harbor', 'boat_dock', 'idle', { wander: 2 }),
    S('12:30', 'harbor', 'harbor_bench_spot', 'eat'), S('14:00', 'harbor', 'lighthouse_base', 'idle', { wander: 2 }), S('18:00', 'fishing_hut', 'stove_fh', 'sit'),
    H('21:00', 'fishing_hut', 'bunk'),
  ] },
];

// ---------------------------------------------------------------- rosalind
const rosalind = [
  { when: { weekday: 'sun' }, slots: [
    H('06:00', 'bakery', 'upstairs'), S('09:00', 'market_street', 'fruit_stand', 'idle'), S('11:00', 'town_square', 'bench_sq_2_spot', 'sit'),
    S('13:00', 'inn', 'table_inn_2', 'eat'), S('15:00', 'riverside_park', 'gazebo_spot', 'sit'), H('17:00', 'bakery', 'upstairs'),
  ] },
  { slots: [
    S('06:00', 'bakery', 'oven_spot', 'knead'), S('07:00', 'bakery', 'behind_counter', 'serve'), S('12:00', 'bakery', 'table_bk_2', 'eat'),
    S('13:00', 'bakery', 'behind_counter', 'serve'), S('16:30', 'bakery', 'oven_spot', 'sweep'), H('19:00', 'bakery', 'upstairs'),
  ] },
];

// ---------------------------------------------------------------- barnaby
const barnaby = [
  { when: { weekday: 'wed' }, slots: [
    H('06:00', 'general_store', 'back_room'), S('10:00', 'market_street', 'fruit_stand', 'idle'), S('11:30', 'inn', 'table_inn_3', 'eat'),
    S('13:30', 'harbor', 'net_rack', 'idle', { wander: 2 }), S('16:00', 'market_street', 'bench_ms_1_spot', 'sit'), H('19:00', 'general_store', 'back_room'),
  ] },
  { slots: [
    H('06:00', 'general_store', 'back_room'), S('08:30', 'general_store', 'behind_counter', 'serve'), S('12:30', 'general_store', 'shelf_row_1', 'idle'),
    S('13:00', 'general_store', 'behind_counter', 'serve'), S('18:00', 'market_street', 'store_steps', 'idle'), S('19:00', 'inn', 'table_inn_2', 'eat'),
    H('21:00', 'general_store', 'back_room'),
  ] },
];

// ---------------------------------------------------------------- elias
const elias = [
  { when: { weekday: 'sun' }, slots: [
    H('06:00', 'clinic', 'back_room'), S('10:00', 'riverside_park', 'bench_rp_2_spot', 'sit', { hold: 'mug' }), S('12:00', 'inn', 'table_inn_1', 'drink'),
    S('15:00', 'market_street', 'hill_stairs', 'walk'), S('17:00', 'starview_hill', 'view_bench_spot', 'sit'), H('19:00', 'clinic', 'back_room'),
  ] },
  { slots: [
    H('06:00', 'clinic', 'back_room'), S('08:30', 'clinic', 'behind_reception', 'serve'), S('12:30', 'clinic', 'waiting_chairs', 'drink', { hold: 'mug' }),
    S('13:30', 'clinic', 'behind_reception', 'serve'), S('17:00', 'market_street', 'clinic_steps', 'idle'), S('17:30', 'inn', 'table_inn_1', 'drink'),
    H('19:00', 'clinic', 'back_room'),
  ] },
];

// ---------------------------------------------------------------- pip & lottie
const pip = [
  { when: WET, slots: [H('06:00', 'brook_lane', 'meadow'), S('13:00', 'inn', 'table_inn_3', 'sit'), H('17:00', 'brook_lane', 'meadow')] },
  { slots: [
    H('06:00', 'brook_lane', 'meadow'), S('08:00', 'brook_lane', 'stream_bank', 'run', { wander: 4 }), S('11:00', 'riverside_park', 'flower_bed', 'idle', { wander: 4 }),
    S('13:00', 'market_street', 'cat_corner', 'idle'), S('15:00', 'riverside_park', 'swing', 'sit'), S('16:30', 'riverside_park', 'duck_corner', 'run', { wander: 3 }),
    S('17:30', 'town_square', 'fountain_spot', 'run', { wander: 3 }), H('19:00', 'brook_lane', 'meadow'),
  ] },
];
const lottie = [
  { when: WET, slots: [H('06:00', 'brook_lane', 'garden_bench'), S('13:00', 'inn', 'table_inn_3', 'sit'), H('17:00', 'brook_lane', 'garden_bench')] },
  { slots: [
    H('06:00', 'brook_lane', 'garden_bench'), S('08:00', 'brook_lane', 'garden_bench', 'sit'), S('09:30', 'town_square', 'plaza_center', 'run', { wander: 3 }),
    S('11:30', 'riverside_park', 'duck_corner', 'idle'), S('13:30', 'market_street', 'fruit_stand', 'idle'), S('15:00', 'riverside_park', 'swing', 'sit'),
    S('16:30', 'riverside_park', 'picnic_blanket', 'sit'), S('17:30', 'town_square', 'fountain_spot', 'run', { wander: 3 }), H('19:00', 'brook_lane', 'garden_bench'),
  ] },
];

// ---------------------------------------------------------------- ferris
const ferris = [
  { when: WET, slots: [
    H('06:00', 'market_street', 'street_west'), S('08:00', 'inn', 'table_inn_1', 'sit_read', { hold: 'book' }), S('12:00', 'inn', 'table_inn_1', 'eat'),
    S('14:00', 'inn', 'hearth_spot', 'sit'), H('17:00', 'market_street', 'street_west'),
  ] },
  { slots: [
    H('06:00', 'market_street', 'street_west'), S('08:30', 'market_street', 'bench_ms_1_spot', 'sit_read', { hold: 'book' }),
    S('10:00', 'riverside_park', 'duck_corner', 'idle', { hold: 'bag' }), S('12:00', 'inn', 'table_inn_1', 'eat'),
    S('13:30', 'market_street', 'bench_ms_1_spot', 'sit_read', { hold: 'book' }), S('15:00', 'riverside_park', 'duck_corner', 'idle', { hold: 'bag' }),
    S('17:00', 'town_square', 'bench_sq_2_spot', 'sit'), H('19:00', 'market_street', 'street_west'),
  ] },
];

// ---------------------------------------------------------------- bramwell
const bramwell = [
  { when: WET, slots: [
    H('06:00', 'whispering_woods', 'hermit_hut'), S('08:00', 'whispering_woods', 'hermit_hut', 'idle', { wander: 1 }),
    S('12:00', 'whispering_woods', 'hermit_hut', 'eat'), S('16:00', 'whispering_woods', 'hollow_log_spot', 'idle'), H('19:00', 'whispering_woods', 'hermit_hut'),
  ] },
  { slots: [
    H('06:00', 'whispering_woods', 'hermit_hut'), S('07:00', 'whispering_woods', 'mushroom_grove', 'pickup', { hold: 'basket', wander: 3 }),
    S('10:00', 'whispering_woods', 'berry_patch', 'pickup', { hold: 'basket', wander: 3 }), S('12:00', 'whispering_woods', 'hermit_hut', 'eat'),
    S('13:30', 'whispering_woods', 'shrine_spot', 'idle'), S('16:00', 'whispering_woods', 'clearing', 'idle', { wander: 3 }),
    S('18:00', 'whispering_woods', 'hermit_hut', 'sit'), H('20:00', 'whispering_woods', 'hermit_hut'),
  ] },
];

// ---------------------------------------------------------------- sable (Sat & Sun only)
const sable = [
  { when: { weekday: 'sat' }, slots: [
    H('06:00', 'town_square', 'stage'), S('08:00', 'town_square', 'stage', 'serve', { hold: 'bag' }), S('12:30', 'town_square', 'cafe_terrace_1', 'eat'),
    S('13:30', 'town_square', 'stage', 'serve', { hold: 'bag' }), S('18:00', 'town_square', 'tree_shade', 'sit'), H('19:30', 'town_square', 'stage'),
  ] },
  { when: { weekday: 'sun' }, slots: [
    H('06:00', 'town_square', 'stage'), S('08:00', 'riverside_park', 'gazebo_spot', 'serve', { hold: 'bag' }), S('12:30', 'riverside_park', 'pond_edge', 'eat'),
    S('13:30', 'riverside_park', 'gazebo_spot', 'serve', { hold: 'bag' }), S('18:00', 'riverside_park', 'bench_rp_2_spot', 'sit'), H('19:30', 'town_square', 'stage'),
  ] },
  { slots: [H('06:00', 'town_square', 'stage')] },
];

// ---------------------------------------------------------------- hattie
const hattie = [
  { when: WET, slots: [
    H('06:00', 'town_square', 'flower_stall'), S('09:00', 'inn', 'table_inn_2', 'drink', { hold: 'mug' }), S('13:00', 'inn', 'hearth_spot', 'sit'),
    S('16:00', 'town_square', 'flower_stall', 'serve', { hold: 'flower' }), H('18:00', 'town_square', 'flower_stall'),
  ] },
  { slots: [
    H('06:00', 'town_square', 'flower_stall'), S('08:30', 'town_square', 'flower_stall', 'idle'), S('09:00', 'town_square', 'flower_stall', 'serve', { hold: 'flower' }),
    S('12:30', 'town_square', 'bench_sq_1_spot', 'eat'), S('13:00', 'town_square', 'flower_stall', 'serve', { hold: 'flower' }),
    S('17:30', 'town_square', 'cafe_terrace_2', 'drink', { hold: 'mug' }), H('19:00', 'town_square', 'flower_stall'),
  ] },
];

// ---------------------------------------------------------------- henrik
const henrik = [
  { when: { weekday: 'sat' }, slots: [
    H('06:00', 'brook_lane', 'cottage_front'), S('08:00', 'brook_lane', 'workshop_front', 'hammer'), S('10:00', 'riverside_park', 'picnic_blanket', 'sit'),
    S('13:00', 'town_square', 'bench_sq_2_spot', 'eat'), S('15:00', 'riverside_park', 'swing', 'idle'), H('18:00', 'brook_lane', 'cottage_front'),
  ] },
  { when: WET, slots: [
    H('06:00', 'brook_lane', 'cottage_front'), S('07:30', 'brook_lane', 'workshop_front', 'hammer'), S('12:00', 'brook_lane', 'garden_bench', 'eat'),
    S('13:00', 'brook_lane', 'workshop_front', 'hammer'), H('17:30', 'brook_lane', 'cottage_front'),
  ] },
  { slots: [
    H('06:00', 'brook_lane', 'cottage_front'), S('07:30', 'brook_lane', 'workshop_front', 'hammer'), S('12:00', 'town_square', 'bench_sq_2_spot', 'eat'),
    S('13:00', 'market_street', 'street_mid', 'hammer'), S('15:00', 'brook_lane', 'workshop_front', 'hammer'), S('17:00', 'town_square', 'fountain_spot', 'idle'),
    H('18:30', 'brook_lane', 'cottage_front'),
  ] },
];

export default {
  mira, willa, juno, rhea, celeste, theo, odell, nana_fen, gus, rosalind, barnaby, elias, pip, lottie, ferris, bramwell, sable, hattie, henrik,
};
