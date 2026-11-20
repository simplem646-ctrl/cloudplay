// Canonical id lists shared across workstreams. OWNED BY THE LEAD.
// World implements MAP_IDS exactly; Audio implements MUSIC_IDS and SFX_IDS exactly;
// Sim implements SHOP_IDS / ACTIVITY_IDS / MINIGAME_IDS; content references only these.

export const MAP_IDS = [
  // town outdoors
  'town_square', 'town_harbor', 'town_park', 'beach',
  // school outdoors
  'school_grounds', 'school_field', 'hill_observatory',
  // school indoors
  'school_hall_1f', 'school_hall_2f', 'school_classroom', 'school_library', 'school_cafeteria',
  'school_art_room', 'school_music_room', 'school_gym', 'school_rooftop', 'bell_tower',
  // town indoors
  'home_theo', 'cafe_lantern', 'bakery', 'flower_shop', 'bookstore', 'corner_mart', 'clinic',
  'town_hall', 'observatory_dome',
];

export const SHOP_IDS = [
  'cafe_menu', 'corner_mart', 'bookstore', 'bakery', 'flower_shop',
  'vending_school', 'vending_town', 'cafeteria_lunch', 'clinic_pharmacy',
];

// `call` op / interactable action ids
export const ACTIVITY_IDS = [
  'study_home', 'study_library', 'club_practice', 'job_cafe', 'rest', 'stargaze', 'shell_hunt', 'jog', 'nap',
];
export const MINIGAME_IDS = [
  'track_sprint', 'soccer_penalty', 'art_palette', 'music_rhythm', 'literature_words', 'astronomy_stars', 'cafe_serve',
];

// Interactable `action.type` values a map may use (the overworld scene implements them all)
export const INTERACT_ACTIONS = [
  'sleep', 'save', 'study', 'shop', 'text', 'event', 'activity', 'job', 'rest', 'collect', 'board', 'calendar', 'door_locked',
];

export const MUSIC_IDS = [
  'title', 'home_morning', 'town_spring', 'town_summer', 'town_autumn', 'town_winter', 'town_night',
  'school_day', 'school_class', 'cafe', 'library', 'sports', 'rooftop', 'observatory', 'beach', 'rain',
  'festival', 'fireworks', 'exam', 'romantic', 'sad', 'funny', 'tense', 'ending_good', 'ending_bittersweet', 'credits',
];

export const SFX_IDS = [
  // ui
  'confirm', 'cancel', 'cursor', 'blip', 'blip_low', 'error', 'page',
  // world
  'step_grass', 'step_stone', 'step_wood', 'step_sand', 'door_open', 'door_close',
  'bell_school', 'bell_tower', 'coin', 'item', 'heart', 'heart_big', 'chime', 'shutter', 'swoosh', 'pour', 'eat', 'sleep', 'alarm', 'phone',
  // activities / mini-games
  'success', 'fail', 'exam_start', 'correct', 'wrong', 'whistle', 'kick', 'hit', 'splash', 'cheer', 'clap', 'fireworks',
];
// looping ambience (audio.ambience(id | null))
export const AMBIENCE_IDS = ['rain', 'wind', 'crowd', 'waves', 'crickets', 'birds', 'snow_wind'];
