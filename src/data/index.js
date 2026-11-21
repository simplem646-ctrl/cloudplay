// Content data hub. Exposes Game.data (see ARCHITECTURE section 13).
import npcs from './npcs.js';
import { ITEM_MAP } from './items.js';
import fish from './fish.js';
import { FISH } from './fish.js';
import forage from './forage.js';
import shops from './shops.js';
import jobs from './jobs.js';
import buildings from './buildings.js';
import schedules from './schedules.js';
import quests from './quests.js';
import events from './events/index.js';
import festivals from './festivals.js';
import calendar from './calendar.js';
import mail from './mail.js';
import books from './books.js';
import interactions from './interactions.js';
import dialogue from './dialogue/index.js';
import tutorial from './tutorial.js';
import errands from './errands.js';

void FISH;

export const Data = {
  npcs, items: ITEM_MAP, fish, forage, shops, jobs, buildings, schedules, quests, events, festivals, calendar,
  mail, books, interactions, dialogue, tutorial, errands,
  getItem(id) { return this.items[id] || null; },
  getNpc(id) { return this.npcs[id] || null; },
};

export default Data;
