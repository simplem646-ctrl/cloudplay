/**
 * Game.systems (WS4). Public API = the named exports below (API_SURFACE.systems) + `svc` + `registerService`.
 *
 * EXTENSION POINTS for S2 (world-facing half) — only add files and `registerService(...)` lines here:
 *   registerService('entities', obj)    // obj.init?() / obj.update?(dt) run in registration order, after the S1 services
 *   registerOp('place', handler)        // script ops: handler(step, ctx) -> Promise | 'end'
 *   svc.interact.registerHandler('lamp', async ({area, it, player}) => {...})
 * See src/systems/README.md for the full contract.
 */
import { svc, registerService, initServices, updateServices } from './svc.js';
import { clock } from './clock.js';
import { weather } from './weather.js';
import { conditions } from './conditions.js';
import { inventory } from './inventory.js';
import { rel } from './rel.js';
import { shops } from './shops.js';
import { quests } from './quests.js';
import { script } from './script.js';
import { events } from './events.js';
import { mail } from './mail.js';
import { interact } from './interact.js';
import { tutorial } from './tutorial.js';
import { director } from './director.js';
import { save } from './save.js';
import { debug } from './debug.js';
import { path } from './path.js';
import { lamps } from './lamps.js';
import { player } from './player.js';
import { interaction } from './interaction.js';
import { npcs } from './npcs.js';
import { activities } from './activities.js';
import { jobs } from './jobs.js';
import { entities } from './entities.js';

// S1 services (order matters: clock/weather before anything that reacts to time:newday)
registerService('clock', clock);
registerService('weather', weather);
registerService('conditions', conditions);
registerService('inventory', inventory);
registerService('rel', rel);
registerService('shops', shops);
registerService('script', script);
registerService('quests', quests);
registerService('events', events);
registerService('mail', mail);
registerService('interact', interact);
registerService('tutorial', tutorial);
registerService('director', director);
registerService('save', save);
registerService('debug', debug);
// S2 services are registered below this line. Update order matters: player moves before entities steps the rigs + camera.
// The world-facing half goes live in init() only when Game.world.loadArea exists (staging ops + fishing/forage/lamp handlers),
// so the pure S1 tests (no world) keep their no-S2 behaviour.
registerService('path', path);
registerService('lamps', lamps);
registerService('player', player);
registerService('interaction', interaction);
registerService('npcs', npcs);
registerService('activities', activities);
registerService('jobs', jobs);
registerService('entities', entities);

export { svc, registerService };
export const init = () => initServices();
export const update = (dt) => updateServices(dt);
export const start = () => director.start();
export const newGame = (opts) => director.newGame(opts);
export const continueGame = (slot) => director.continueGame(slot);
export const openMenu = (tab) => director.openMenu(tab);
export const saveGame = (slot) => director.saveGame(slot);
export const runScript = (idOrSteps, ctx) => script.run(idOrSteps, ctx);
export const registerOp = (name, handler) => script.registerOp(name, handler);
