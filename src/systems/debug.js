/** window.LB debug commands. */
import { Game } from '../core/game.js';
import { installDebug } from '../core/debug.js';
import { svc } from './svc.js';
import { opts } from './kit.js';

export const debug = {
  init() {
    const LB = installDebug();
    if (!LB) return;
    const r = (name, fn, doc) => LB.register(name, fn, doc);
    r('goto', (area, anchor) => svc.entities?.enterArea?.(area, anchor), 'goto(area, anchor)');
    r('time', (h, m = 0) => svc.clock.set({ minutes: h * 60 + m }), 'time(h, m)');
    r('date', (season, day) => svc.clock.set({ season, day }), 'date(season, day)');
    r('weather', (w) => svc.weather.setToday(w), 'weather(w)');
    r('give', (id, qty = 1) => svc.inventory.give(id, qty), 'give(itemId, qty)');
    r('money', (n) => svc.inventory.addMoney(n - Game.state.player.money), 'money(n) set coins');
    r('hearts', (npc, n) => svc.rel.addAff(npc, n * 100 - svc.rel.aff(npc), { silent: true }), 'hearts(npc, n)');
    r('flag', (name, value = true) => (value === false ? delete Game.state.flags[name] : svc.script.run([{ setFlag: name, value }])), 'flag(name, value)');
    r('run', (idOrSteps) => svc.script.run(idOrSteps, { cutscene: true }), 'run(scriptIdOrSteps)');
    r('newGame', (name) => svc.director.newGame({ name }), 'newGame(name) skip title');
    r('skipFades', (v = true) => { opts.skipFades = !!v; }, 'skipFades(bool)');
    r('hud', (v = true) => Game.ui?.hudVisible?.(!!v), 'hud(bool)');
    r('quests', () => svc.quests.list({ done: true }), 'quests()');
    r('where', (npc) => svc.npcs?.whereIs?.(npc), 'where(npc)');
    r('sleep', () => svc.director.sleep({ confirm: false }), 'sleep()');
  },
};
