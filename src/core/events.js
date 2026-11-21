/** Bus event names (ARCHITECTURE §3.7). Payload shapes are documented there. */
export const EVT = {
  MODE_CHANGE: 'mode:change',          // {from,to}
  GAME_NEW: 'game:new',
  GAME_LOADED: 'game:loaded',          // {slot}
  GAME_SAVED: 'game:saved',            // {slot}
  TIME_TICK: 'time:tick',              // {minutes}
  TIME_HOUR: 'time:hour',              // {hour}
  TIME_NEWDAY: 'time:newday',          // {dayNum}
  TIME_SEASON: 'time:season',          // {season}
  WEATHER_CHANGE: 'weather:change',    // {weather}
  AREA_EXIT: 'area:exit',              // {area}
  AREA_ENTER: 'area:enter',            // {area, from}
  INTERACT_TARGET: 'interact:target',  // {kind,id,label}|null
  NPC_TALK: 'npc:talk',                // {id}
  DIALOGUE_START: 'dialogue:start',    // {id}
  DIALOGUE_END: 'dialogue:end',        // {id}
  ITEM_GAIN: 'item:gain',              // {id,qty}
  ITEM_LOSE: 'item:lose',              // {id,qty}
  INVENTORY_CHANGED: 'inventory:changed',
  MONEY_CHANGE: 'money:change',        // {delta,total}
  ENERGY_CHANGE: 'energy:change',      // {value}
  AFFECTION_CHANGE: 'affection:change', // {npc,delta,total,hearts}
  QUEST_START: 'quest:start',          // {id}
  QUEST_ADVANCE: 'quest:advance',      // {id}
  QUEST_COMPLETE: 'quest:complete',    // {id}
  STORY_LANTERN: 'story:lantern',      // {count}
  FISH_CAUGHT: 'fish:caught',          // {id,size,perfect}
  FORAGE_PICKED: 'forage:picked',      // {id,spot}
  JOB_DONE: 'job:done',                // {id,score,pay}
  SHOP_OPEN: 'shop:open',              // {id}
  SHOP_CLOSE: 'shop:close',            // {id}
  SLEEP_START: 'sleep:start',
  SLEEP_END: 'sleep:end',
  EVENT_START: 'event:start',          // {id}
  EVENT_END: 'event:end',              // {id}
  UI_TOAST: 'ui:toast',                // {text,icon,kind}
  FLAG_SET: 'flag:set',                // {name,value}

  // UI -> Systems intent events
  UI_USE_ITEM: 'ui:useItem',           // {slot}
  UI_BUY: 'ui:buy',                    // {shopId,itemId,qty}
  UI_SELL: 'ui:sell',                  // {slot,qty}
  UI_SAVE: 'ui:save',                  // {slot}
  UI_LOAD: 'ui:load',                  // {slot}
  UI_NEWGAME: 'ui:newgame',            // {name,look}
  UI_SETTING: 'ui:setting',            // {key,value}
  UI_TRACK_QUEST: 'ui:trackQuest',     // {id}
  UI_RESUME_DAY: 'ui:resumeDay',
  UI_QUIT: 'ui:quit',
};
