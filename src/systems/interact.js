/**
 * Interaction handlers for non-physical interactable types. S2 calls `interact.run(areaId, interactable)` and registers
 * handlers for lamp / forage / fishing (and may override any other).
 */
import { Game } from '../core/game.js';
import { ENERGY } from '../core/constants.js';
import { rngFor } from '../core/util.js';
import { svc } from './svc.js';
import { D, dayNum, toast, sfx, itemName, incFlag, setFlag, getFlag } from './kit.js';

const handlers = {};
let busy = false;
const dlg = () => Game.ui?.dialogue;
const narrate = (t) => dlg()?.narrate?.(svc.script.interpolate(t));
const pickText = (arr, key) => arr[Math.floor(rngFor('text', dayNum(), key)() * arr.length)];

/** Types whose interactions[...] entry is only an examine override (script/text). Transactional types are never overridden. */
const NO_OVERRIDE = new Set(['bed', 'diary', 'chest', 'mailbox', 'shop', 'noticeboard', 'job', 'lamp', 'forage', 'fishing', 'bench', 'rest']);

async function examine(ctx) {
  const { area, it } = ctx;
  const d = D();
  const ent = d.interactions?.[`${area}.${it.id}`];
  if (ent && svc.conditions.evalCond(ent.when, { key: it.id })) {
    const sc = Array.isArray(ent) ? ent : ent.script;
    if (sc?.length) return svc.script.run(sc, { source: `${area}.${it.id}` });
    if (ent.text?.length) return narrate(pickText(ent.text, it.id));
  }
  const def = d.interactions?._defaults?.[it.type];
  if (def?.length) return narrate(pickText(def, it.type));
  if (it.text) return narrate(it.text);
  return undefined;
}

const advance = (m) => svc.clock.advance(m);
async function playerAnim(name) {
  if (svc.script.hasOp('anim')) await svc.script.run([{ anim: 'player', name, loop: false, wait: true }], { source: 'interact' });
}

function bookFor(it) {
  return Object.values(D().books || {}).filter((b) => b.where === it.id);
}

export const interact = {
  handlers,
  registerHandler(type, fn) {
    handlers[type] = fn;
  },
  examine,
  /** Run the handler for an interactable. ctx = {area, it, player}. */
  async run(areaId, it) {
    if (!it || busy) return undefined;
    const ctx = { area: areaId, it, player: Game.state?.player };
    const ent = D().interactions?.[`${areaId}.${it.id}`];
    const override = ent && (Array.isArray(ent) || ent.script) && !NO_OVERRIDE.has(it.type);
    const h = override || !handlers[it.type] ? examine : handlers[it.type];
    busy = true;
    try {
      return await h(ctx);
    } finally {
      busy = false;
    }
  },
};

const H = handlers;

H.bed = async () => svc.director.sleep();

H.diary = async () => {
  const i = await dlg()?.ask?.({
    prompt: 'The diary lies open on the desk.',
    options: [{ text: 'Quick save' }, { text: 'Open save menu' }, { text: 'Close' }],
  });
  if (i === 0) {
    const r = svc.director.saveGame(Game.state.meta.slot || 1);
    toast(r?.ok === false ? 'Could not save.' : 'Game saved.', { kind: r?.ok === false ? 'warn' : 'info' });
  } else if (i === 1) await svc.director.openMenu('settings');
};

H.chest = async () => {
  const inv = svc.inventory;
  for (;;) {
    const i = await dlg()?.ask?.({
      prompt: 'The cottage chest.',
      options: [{ text: 'Put something in' }, { text: 'Take something out' }, { text: 'Close' }],
    });
    if (i === 0) {
      const slot = await Game.ui?.pickItem?.({ prompt: 'Put what in the chest?', filter: (s) => !!s });
      if (slot === null || slot === undefined) continue;
      const n = inv.storage.deposit(slot);
      toast(n ? 'Stored.' : 'The chest is full.', { kind: n ? 'info' : 'warn' });
    } else if (i === 1) {
      const rows = inv.storage.slots().map((s, idx) => (s ? { idx, s } : null)).filter(Boolean);
      if (!rows.length) {
        toast('The chest is empty.');
        continue;
      }
      let page = 0;
      for (;;) {
        const chunk = rows.slice(page * 8, page * 8 + 8);
        const more = rows.length > (page + 1) * 8;
        const options = [...chunk.map((r) => ({ text: `${itemName(r.s.id)} ×${r.s.qty}` })), ...(more ? [{ text: 'More…' }] : []), { text: 'Back' }];
        const c = await dlg()?.ask?.({ prompt: 'Take what out?', options });
        if (typeof c !== 'number' || c === options.length - 1) break;
        if (more && c === chunk.length) {
          page++;
          continue;
        }
        const n = inv.storage.withdraw(chunk[c].idx);
        toast(n ? 'Taken.' : 'Your pack is full.', { kind: n ? 'info' : 'warn' });
        break;
      }
    } else return;
  }
};

H.mailbox = async () => svc.mail.openMailbox();

H.shop = async (ctx) => {
  const def = svc.shops.findByCounter(ctx.it.id, ctx.area);
  if (!def) return examine(ctx);
  const closed = svc.shops.closedInfo(def.area || ctx.area);
  if (closed) return narrate(closed.text);
  return svc.shops.openShop(def.id);
};

H.noticeboard = async () => svc.quests?.openBoard?.() ?? narrate('Nothing is pinned to the board today.');

H.bookshelf = async (ctx) => {
  const books = bookFor(ctx.it);
  if (!books.length) return examine(ctx);
  let book = books[0];
  if (books.length > 1) {
    const i = await dlg()?.ask?.({ prompt: 'Which book?', options: books.map((b) => ({ text: b.title })) });
    if (typeof i !== 'number') return undefined;
    book = books[i];
  }
  sfx('page_turn');
  await Game.ui?.notes?.read?.({ title: book.title, lines: book.pages.map((p) => svc.script.interpolate(p)) });
  Game.state.log.books[book.id] = true;
  if (book.hint?.quest && svc.quests?.isActive(book.hint.quest)) toast(book.hint.text || 'You notice something useful.', { kind: 'quest' });
  return undefined;
};

H.bench = async () => {
  if (!(await Game.ui?.confirm?.('Sit and rest for a while?'))) return;
  await playerAnim('sit');
  advance(10);
  svc.inventory.addEnergy(ENERGY.benchPer10Min);
  toast(`You rest a moment. +${ENERGY.benchPer10Min} energy`, { kind: 'info' });
};

H.rest = async () => {
  const fee = 50;
  const p = Game.state.player;
  if (p.energy >= (p.maxEnergy ?? ENERGY.max) - 5) return narrate("You're feeling fine — no need to lie down.");
  if (!(await Game.ui?.confirm?.(`Rest in the clinic bed for two hours? (${fee} c)`))) return;
  if (!svc.inventory.spend(fee)) return;
  await Game.ui?.fade?.(1, 600);
  advance(120);
  svc.inventory.setEnergy(p.maxEnergy ?? ENERGY.max);
  await Game.ui?.fade?.(0, 600);
  toast('You feel fully rested.', { kind: 'info' });
};

H.fountain = async (ctx) => {
  if (!(await Game.ui?.confirm?.('Toss a coin and make a wish? (1 c)'))) return;
  if (!svc.inventory.spend(1)) return;
  sfx('splash');
  Game.state.stats.wishes = (Game.state.stats.wishes || 0) + 1;
  const lines = ['The coin sinks, glinting. You wish for a good day tomorrow.', 'Plink. You wish the lanterns would shine again.', 'You close your eyes and wish — quietly, for someone you care about.'];
  await narrate(lines[Math.floor(rngFor('wish', dayNum(), Game.state.stats.wishes)() * lines.length)]);
};

H.shrine = async (ctx) => {
  const d = D().interactions?._defaults?.shrine;
  if (getFlag(`shrine_${dayNum()}`)) return narrate('The little shrine is quiet and peaceful.');
  if (!(await Game.ui?.confirm?.('Leave a small offering? (5 c)'))) return d?.length ? narrate(pickText(d, 'shrine')) : undefined;
  if (!svc.inventory.spend(5)) return;
  setFlag(`shrine_${dayNum()}`, true);
  incFlag('shrine_offerings');
  await narrate(Game.state.story.lanterns > 0 ? 'A warm glow seems to flicker in the old lantern, just for a moment.' : 'The shrine lantern stays dark, but the air feels kind.');
};

H.telescope = async (ctx) => {
  if (!svc.clock.isNight()) return narrate('Through the telescope you can see the whole town, small and bright in the sun.');
  if (!(await Game.ui?.confirm?.('Gaze at the stars for a while?'))) return;
  advance(20);
  incFlag('stargaze_count');
  setFlag(`stargazed_${dayNum()}`, true);
  svc.inventory.addEnergy(2);
  await narrate('The sky is wide and full of stars. You trace a few constellations until your neck gets stiff.');
};

H.crafting = async (ctx) => examine(ctx);
H.sign = async (ctx) => examine(ctx);
H.object = async (ctx) => examine(ctx);

H.job = async (ctx) => {
  const def = Object.values(D().jobs || {}).find((j) => j.spot === ctx.it.id && (!j.area || j.area === ctx.area)) || Object.values(D().jobs || {}).find((j) => j.spot === ctx.it.id);
  if (!def || !svc.jobs?.start) return narrate(def ? 'There is nothing to do here just yet.' : 'Nobody is looking for help here.');
  return svc.jobs.start(def.id);
};
