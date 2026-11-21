import * as t1 from './tier1.js';
import * as t2 from './tier2.js';
import * as t3 from './tier3.js';

export const TRACKS = Object.assign({}, t1, t2, t3);
/** Registry order of MUSIC_TRACKS (ARCHITECTURE section 4). */
export const TRACK_IDS = ['title', 'prologue', 'home', 'town_spring', 'town_summer', 'town_autumn', 'town_winter', 'night', 'town_rain', 'shop', 'cafe', 'harbor', 'woods', 'hilltop', 'festival', 'festival_winter', 'romance', 'sad', 'comedy', 'minigame', 'ending'];
