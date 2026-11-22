/** Save integration (thin wrapper over core/state.js + director) and UI intent handlers. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { saveSlots, exportSave, importSave, deleteSlot, saveSettings } from '../core/state.js';
import { svc } from './svc.js';
import { subs, toast } from './kit.js';

const s = subs();

export const save = {
  init() {
    s.clear();
    s.on(EVT.UI_USE_ITEM, ({ slot }) => svc.inventory.useItem(slot));
    // The shop UI performs the trade through its onBuy/onSell callbacks and then emits these events with done:true as a
    // notification only — acting on those would trade twice.
    s.on(EVT.UI_BUY, ({ shopId, itemId, qty, done }) => { if (!done) svc.shops.buy(shopId || svc.shops.current, itemId, qty ?? 1); });
    s.on(EVT.UI_SELL, ({ slot, qty, done }) => { if (!done) svc.shops.sell(slot, qty ?? 1); });
    s.on(EVT.UI_SAVE, ({ slot }) => {
      const r = svc.director.saveGame(slot);
      toast(r.ok ? 'Game saved.' : 'Could not save.', { kind: r.ok ? 'info' : 'warn' });
    });
    s.on(EVT.UI_LOAD, ({ slot }) => {
      svc.director.continueGame(slot);
    });
    s.on(EVT.UI_NEWGAME, ({ name, look }) => {
      svc.director.newGame({ name, look });
    });
    s.on(EVT.UI_SETTING, ({ key, value }) => save.setSetting(key, value));
    s.on(EVT.UI_QUIT, () => {
      svc.director.quitToTitle();
    });
  },
  slots: saveSlots,
  save: (slot) => svc.director.saveGame(slot),
  autosave: () => svc.director.saveGame(0),
  load: (slot) => svc.director.continueGame(slot),
  exportSlot: exportSave,
  importSlot: importSave,
  deleteSlot,
  setSetting(key, value) {
    Game.settings[key] = value;
    saveSettings(Game.settings);
    if (['master', 'music', 'sfx', 'ambience'].includes(key)) {
      const { master, music, sfx, ambience } = Game.settings;
      Game.audio?.setVolume?.({ master, music, sfx, ambience });
    }
  },
};
