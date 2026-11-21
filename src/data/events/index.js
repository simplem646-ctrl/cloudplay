// Merges every event file ({ [eventId]: EventDef }) into one object.
import prologue from './prologue.js';
import story_main from './story_main.js';
import festivals from './festivals.js';
import heart_mira from './heart_mira.js';
import heart_willa from './heart_willa.js';
import heart_juno from './heart_juno.js';
import heart_rhea from './heart_rhea.js';
import heart_celeste from './heart_celeste.js';
import friends from './friends.js';
import misc from './misc.js';

export default Object.assign({}, prologue, story_main, festivals, heart_mira, heart_willa, heart_juno, heart_rhea, heart_celeste, friends, misc);
