export const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
export const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const WEATHERS = ['sunny', 'cloudy', 'rain', 'storm', 'snow'];
export const FACINGS = ['n', 'e', 's', 'w'];
export const DAY_START = 360, DAY_END = 1560, DAYS_PER_SEASON = 28, DAYS_PER_YEAR = 112;

export const NPC_IDS = ['mira','willa','juno','rhea','celeste','odell','theo','nana_fen','gus','rosalind','barnaby','elias','pip','lottie','ferris','bramwell','sable','hattie','henrik'];
export const PORTRAIT_IDS = ['mira','willa','juno','rhea','celeste','odell','theo','nana_fen','gus'];
export const ROMANCE_IDS = ['mira','willa','juno','rhea','celeste'];
export const KID_IDS = ['pip','lottie'];
export const ELDER_IDS = ['nana_fen','gus','ferris','bramwell','odell'];

export const EXPRESSIONS = ['neutral','happy','sad','angry','surprised','shy','thinking','laugh','worried','smug'];
export const ANIMATIONS = ['idle','walk','run','talk','nod','shake_head','wave','happy_hop','cheer','sad','surprised','angry','shy','think','laugh','bow','sit','sleep','pickup','show_item','carry_idle','carry_walk','fish_cast','fish_wait','fish_bite','fish_reel','fish_catch','knead','sweep','light_lamp','dance','eat','drink','read','stargaze','point','shrug','stretch','yawn','hammer','serve','write','sit_read','fall','spin'];
export const EMOTES = ['heart','music','sweat','anger','question','exclaim','zzz','sparkle','sad','idea'];
export const HELD_PROPS = ['rod','basket','parcel','bread','flower','book','lantern','broom','mug','net','bag','tray','telescope','paper','fish','umbrella'];
export const CRITTERS = ['cat','dog','sparrow','gull','duck','butterfly','crab','rabbit'];
export const VOICES = ['soft','bright','deep','gruff','kid','elder','brisk','dreamy','narrator'];

export const ITEM_CATEGORIES = ['food','fish','forage','gift','material','book','tool','key','misc'];
export const ITEM_TAGS = ['sweet','baked','savory','seafood','fish','flower','herb','mushroom','berry','fruit','book','tea','coffee','cocoa','gem','star','shell','lantern','craft','drink','egg','cheese','trinket','tool','junk','honey'];
export const ICON_SHAPES = ['fish_small','fish_long','fish_round','fish_flat','eel','crab_item','shrimp','shell_spiral','shell_fan','starfish','mushroom','berry','herb','leaf','flower','flower_bunch','acorn','pinecone','nut','honey_jar','bread_loaf','bread_roll','croissant','cake_slice','cookie','pie','sandwich','soup_bowl','mug','teapot','cup_cocoa','fruit_apple','fruit_orange','egg','cheese','book','scroll','letter','key','coin','gem','crystal','feather','bottle','jar','lantern','candle','wick','glass_shard','lens','gear','log','plank','rock','ore','rope','parcel','ribbon','bag','rod','bait','net','map','star','heart_charm'];

export const INTERACT_TYPES = ['sign','noticeboard','bed','rest','diary','chest','mailbox','shop','job','fishing','forage','lamp','bench','fountain','shrine','telescope','bookshelf','crafting','object'];
export const WATER_KINDS = ['brook','river','pier','beach','stream'];
export const DECOR_SETS = ['spring_picnic','midsummer','harvest_fair','hearthlight','lantern_festival'];
export const LAMP_GROUPS = { town_square: 1, market_street: 2, harbor: 3, riverside_park: 4, starview_hill: 5, whispering_woods: 5, brook_lane: 6 };   // lamp restored when story.lanterns >= group

export const MUSIC_TRACKS = ['title','prologue','home','town_spring','town_summer','town_autumn','town_winter','night','town_rain','shop','cafe','harbor','woods','hilltop','festival','festival_winter','romance','sad','comedy','minigame','ending'];
export const SFX_IDS = ['ui_move','ui_confirm','ui_cancel','ui_open','ui_close','ui_error','ui_tab','coin','buy','sell','item_get','item_get_rare','heart_up','quest_new','quest_done','door_open','door_close','step_grass','step_dirt','step_stone','step_wood','step_sand','step_snow','splash','cast','bite','reel','catch','fish_escape','shop_bell','pop','sparkle','whoosh','sleep_jingle','wake_jingle','firework_launch','firework_boom','lamp_light','page_turn','knead','oven_ding','bark','meow','gull','chirp','clock_chime','thunder','confirm_big'];
export const AMBIENCE_IDS = ['birds','crickets','waves','rain','wind','stream','fire','crowd'];
export const AREA_MUSIC = { brook_lane:'town', town_square:'town', market_street:'town', riverside_park:'town', harbor:'harbor', whispering_woods:'woods', starview_hill:'hilltop', cottage:'home', workshop:'home', bakery:'shop', cafe:'cafe', town_hall:'shop', general_store:'shop', clinic:'shop', library:'shop', inn:'cafe', fishing_hut:'harbor', observatory:'hilltop' };
// 'town' resolves to town_<season> by day, 'night' at night (exteriors), 'town_rain' when raining; Systems picks, Audio plays.

/** Every area. anchors = named standing points (World MUST define all, incl. generated from_<neighbor>); singles = id→type interactables;
 *  lamps/forage/fishing = counts (ids lamp_<code>_<n>, forage_<code>_<n>, fishing_<code>_<n>, n from 1). Every neighbor N needs transition `to_N` and anchor `from_N`. */
export const AREAS = {
  brook_lane:       { name: 'Brook Lane', kind: 'exterior', size: [36, 26], code: 'bl', mapPos: [0.14, 0.58], neighbors: ['town_square','whispering_woods','cottage','workshop'],
    anchors: ['cottage_front','workshop_front','mailbox_spot','garden_bench','willow','footbridge','meadow','stream_bank','lamp_corner'],
    singles: { mailbox: 'mailbox', sign_bl: 'sign' }, lamps: 4, forage: 3, fishing: 1 },
  town_square:      { name: 'Town Square', kind: 'exterior', size: [44, 30], code: 'sq', mapPos: [0.42, 0.55], neighbors: ['brook_lane','market_street','riverside_park','bakery','cafe','town_hall'],
    anchors: ['fountain_spot','bench_sq_1_spot','bench_sq_2_spot','noticeboard_spot','clock_tower','plaza_center','hall_steps','flower_stall','cafe_terrace_1','cafe_terrace_2','bakery_steps','stage','tree_shade'],
    singles: { noticeboard: 'noticeboard', fountain: 'fountain', sign_sq: 'sign', bench_sq_1: 'bench', bench_sq_2: 'bench' }, lamps: 6, forage: 0, fishing: 0 },
  market_street:    { name: 'Market Street', kind: 'exterior', size: [46, 24], code: 'ms', mapPos: [0.70, 0.45], neighbors: ['town_square','harbor','starview_hill','general_store','clinic','library','inn'],
    anchors: ['street_west','street_mid','street_east','store_steps','clinic_steps','library_steps','inn_steps','bench_ms_1_spot','postbox_spot','hill_stairs','fruit_stand','cat_corner'],
    singles: { sign_ms: 'sign', bench_ms_1: 'bench' }, lamps: 6, forage: 0, fishing: 0 },
  riverside_park:   { name: 'Riverside Park', kind: 'exterior', size: [40, 28], code: 'rp', mapPos: [0.45, 0.82], neighbors: ['town_square','harbor'],
    anchors: ['gazebo_spot','bridge_mid','pond_edge','picnic_blanket','flower_bed','bench_rp_1_spot','bench_rp_2_spot','river_bank_1','river_bank_2','duck_corner','swing'],
    singles: { sign_rp: 'sign', bench_rp_1: 'bench', bench_rp_2: 'bench', gazebo: 'object' }, lamps: 5, forage: 4, fishing: 3 },
  harbor:           { name: 'Harbor', kind: 'exterior', size: [44, 28], code: 'hb', mapPos: [0.82, 0.78], neighbors: ['market_street','riverside_park','fishing_hut'],
    anchors: ['pier_start','pier_end','beach_shells','boat_dock','hut_steps','net_rack','harbor_bench_spot','sunset_spot','lighthouse_base','crates'],
    singles: { sign_hb: 'sign', bench_hb_1: 'bench' }, lamps: 5, forage: 4, fishing: 4 },
  whispering_woods: { name: 'Whispering Woods', kind: 'exterior', size: [40, 30], code: 'ww', mapPos: [0.15, 0.22], neighbors: ['brook_lane','starview_hill'],
    anchors: ['trail_start','shrine_spot','mushroom_grove','berry_patch','hollow_log_spot','clearing','hermit_hut','stream_crossing','trail_end'],
    singles: { sign_ww: 'sign', shrine: 'shrine', hollow_log: 'object' }, lamps: 3, forage: 8, fishing: 1 },
  starview_hill:    { name: 'Starview Hill', kind: 'exterior', size: [34, 26], code: 'sh', mapPos: [0.55, 0.12], neighbors: ['market_street','whispering_woods','observatory'],
    anchors: ['summit','view_bench_spot','telescope_spot','observatory_steps','big_oak','trail_south','trail_west'],
    singles: { sign_sh: 'sign', telescope: 'telescope', bench_sh_1: 'bench' }, lamps: 3, forage: 3, fishing: 0 },
  cottage:          { name: "Old Lamplighter's Cottage", kind: 'interior', size: [14, 10], code: 'ct', neighbors: ['brook_lane'],
    anchors: ['bed_spot','table','stove_spot','diary_spot','chest_spot','shelf_spot','window_seat','rug'],
    singles: { bed: 'bed', diary: 'diary', chest: 'chest', bookshelf_home: 'bookshelf', calendar_wall: 'object', stove: 'object' } },
  workshop:         { name: "Tobias' Workshop", kind: 'interior', size: [12, 9], code: 'wk', neighbors: ['brook_lane'],
    anchors: ['bench_spot','shelf_spot','centre'], singles: { bench_workshop: 'crafting', lantern_shelf: 'object', trunk_workshop: 'chest' } },
  bakery:           { name: 'Rye & Rose Bakery', kind: 'interior', size: [16, 11], code: 'bk', neighbors: ['town_square'],
    anchors: ['counter_front','behind_counter','oven_spot','kneading_table','table_bk_1','table_bk_2','window_bk','upstairs'],
    singles: { shop_bakery: 'shop', job_bakery: 'job', oven: 'object' } },
  cafe:             { name: 'Copper Kettle Café', kind: 'interior', size: [16, 11], code: 'cf', neighbors: ['town_square'],
    anchors: ['counter_front','behind_counter','coffee_machine_spot','table_cf_1','table_cf_2','table_cf_3','piano_spot','upstairs'],
    singles: { shop_cafe: 'shop', coffee_machine: 'object', piano_cf: 'object' } },
  town_hall:        { name: 'Town Hall', kind: 'interior', size: [16, 11], code: 'th', neighbors: ['town_square'],
    anchors: ['desk_front','behind_desk','meeting_table','window_th','flag_spot'], singles: { desk_mayor: 'object', job_lamplighter: 'job', flag_hall: 'object' } },
  general_store:    { name: 'Pennywhistle Provisions', kind: 'interior', size: [16, 11], code: 'gs', neighbors: ['market_street'],
    anchors: ['counter_front','behind_counter','post_counter_spot','shelf_row_1','shelf_row_2','back_room'], singles: { shop_general: 'shop', post_counter: 'job', shelf_gs_1: 'object' } },
  clinic:           { name: 'Whitlock Clinic', kind: 'interior', size: [14, 10], code: 'cl', neighbors: ['market_street'],
    anchors: ['reception_front','behind_reception','exam_bed_spot','waiting_chairs','back_room'], singles: { shop_clinic: 'shop', clinic_bed: 'rest' } },
  library:          { name: 'Thornfield Library', kind: 'interior', size: [18, 12], code: 'lb', neighbors: ['market_street'],
    anchors: ['desk_front','behind_desk','reading_nook','shelf_row_1','shelf_row_2','ladder','window_lib','upstairs'],
    singles: { bookshelf_lib_1: 'bookshelf', bookshelf_lib_2: 'bookshelf', bookshelf_lib_3: 'bookshelf', bookshelf_lib_4: 'bookshelf', bookshelf_lib_5: 'bookshelf', bookshelf_lib_6: 'bookshelf', desk_library: 'object' } },
  inn:              { name: 'Heron Inn', kind: 'interior', size: [18, 12], code: 'in', neighbors: ['market_street'],
    anchors: ['reception_front','behind_reception','hearth_spot','table_inn_1','table_inn_2','table_inn_3','stairs','kitchen'], singles: { shop_inn: 'shop', hearth: 'object' } },
  fishing_hut:      { name: "Pelham's Fishing Hut", kind: 'interior', size: [14, 10], code: 'fh', neighbors: ['harbor'],
    anchors: ['counter_front','behind_counter','tackle_wall_spot','ledger_spot','stove_fh','bunk'], singles: { shop_fishing: 'shop', fish_ledger: 'object', tackle_wall: 'object' } },
  observatory:      { name: 'Starview Observatory', kind: 'interior', size: [14, 12], code: 'ob', neighbors: ['starview_hill'],
    anchors: ['telescope_big_spot','desk_obs_spot','star_map_spot','stairs_obs','cot'], singles: { telescope_big: 'telescope', star_map: 'object', desk_obs: 'object' } },
};
export const AREA_IDS = Object.keys(AREAS);
const ids = (p, code, n) => Array.from({ length: n || 0 }, (_, i) => `${p}_${code}_${i + 1}`);
export const lampIds = (a) => ids('lamp', AREAS[a].code, AREAS[a].lamps);
export const forageIds = (a) => ids('forage', AREAS[a].code, AREAS[a].forage);
export const fishingIds = (a) => ids('fishing', AREAS[a].code, AREAS[a].fishing);
/** id → type for every REQUIRED interactable of an area */
export const areaInteractables = (a) => Object.assign({}, AREAS[a].singles,
  ...lampIds(a).map((i) => ({ [i]: 'lamp' })), ...forageIds(a).map((i) => ({ [i]: 'forage' })), ...fishingIds(a).map((i) => ({ [i]: 'fishing' })));
/** every REQUIRED anchor name (listed + from_<neighbor>) */
export const areaAnchorNames = (a) => [...AREAS[a].anchors, ...AREAS[a].neighbors.map((n) => `from_${n}`)];
/** every REQUIRED transition id: to_<neighbor> */
export const areaTransitionIds = (a) => AREAS[a].neighbors.map((n) => `to_${n}`);
/** water kind of a fishing spot: bl→brook, rp→river, hb_1..2→pier, hb_3..4→beach, ww→stream */
export const fishingWaterKind = (a, id) => (a === 'brook_lane' ? 'brook' : a === 'riverside_park' ? 'river' : a === 'whispering_woods' ? 'stream' : Number(id.split('_').pop()) <= 2 ? 'pier' : 'beach');

/** Public API surface checked by tools/check-contract.mjs (dotted = nested object). Missing names fail `npm run contract`. */
export const API_SURFACE = {
  world: ['init','resize','loadArea','getArea','listAreas','getAreaDef','update','render','setEnvironment','setCamera','snapCamera','addEntity','removeEntity','screenToGround','groundToScreen','setLampStates','setDecor','playEffect','setHighlight','setDoorOpen','setQuality','getStats'],
  chars: ['createCharacter','createCritter','listAppearances','preload'],
  portraits: ['hasPortrait','getPortrait','drawPortrait','preload'],
  ui: ['init','update','showTitle','toast','banner','fade','confirm','pickItem','setPrompt','hudVisible','letterbox','dialogue.say','dialogue.ask','dialogue.narrate','dialogue.close','menu.open','menu.close','shop.open','notes.read','daySummary','minigames.fishing','minigames.kneading'],
  audio: ['init','unlock','playMusic','stopMusic','playSfx','blip','footstep','setAmbience','setVolume','setMuted','duckMusic'],
  systems: ['init','update','start','newGame','continueGame','openMenu','saveGame','runScript','registerOp'],
  data: ['npcs','items','fish','forage','shops','jobs','buildings','schedules','quests','events','festivals','calendar','mail','books','interactions','dialogue','tutorial','errands','getItem','getNpc'],
};
