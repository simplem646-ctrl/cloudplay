/** Mail: morning delivery into state.world.mailQueue, reading at the mailbox. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { svc } from './svc.js';
import { D, subs, dayNum, toast, sfx, npcName } from './kit.js';

const s = subs();
const w = () => Game.state.world;

export const mail = {
  init() {
    s.clear();
    s.on(EVT.TIME_NEWDAY, () => mail.deliver());
  },

  /** `{mail:id}` op: queue for delivery next morning. */
  send(id) {
    if (!Game.state || !D().mail?.[id]) return false;
    const pending = (w().mailPending ||= []);
    if (!pending.includes(id)) pending.push(id);
    return true;
  },

  /** Morning delivery. Returns ids newly queued. */
  deliver() {
    if (!Game.state) return [];
    const queue = w().mailQueue;
    const added = [];
    const consider = (id) => {
      if (w().mailRead[id] !== undefined || queue.includes(id)) return;
      queue.push(id);
      added.push(id);
    };
    const pending = w().mailPending || [];
    w().mailPending = [];
    pending.forEach(consider);
    for (const m of Object.values(D().mail || {})) {
      if (!m || w().mailRead[m.id] !== undefined || queue.includes(m.id)) continue;
      if (svc.conditions.evalCond(m.when, { key: m.id })) consider(m.id);
    }
    return added;
  },

  queue: () => (Game.state ? w().mailQueue.slice() : []),
  hasMail: () => !!Game.state && w().mailQueue.length > 0,

  /** Read every queued letter; grant attachments. Returns number read. */
  async openMailbox() {
    const q = w().mailQueue;
    const ui = Game.ui;
    if (!q.length) {
      await ui?.dialogue?.narrate?.('The mailbox is empty.');
      return 0;
    }
    let n = 0;
    while (q.length) {
      const id = q.shift();
      const m = D().mail?.[id];
      w().mailRead[id] = dayNum();
      if (!m) continue;
      sfx('page_turn');
      const from = m.from && m.from !== 'town' ? npcName(m.from) : 'Lanternbrook Town';
      await ui?.notes?.read?.({ title: svc.script.interpolate(m.subject || 'Letter'), lines: [...(m.body || []).map((l) => svc.script.interpolate(l)), `— ${from}`] });
      const a = m.attach;
      if (a?.money) svc.inventory.addMoney(a.money);
      for (const it of a?.items || []) svc.inventory.give(it.id, it.qty ?? 1);
      if (a?.money) toast(`Received ${a.money} c`, { kind: 'item', icon: 'coin' });
      n++;
    }
    return n;
  },
};
