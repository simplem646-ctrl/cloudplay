// Interaction flows of the overworld: interactable actions (INTERACT_ACTIONS), talking, gifts, the notice board.
// Every function takes the overworld scene (`ow`) and runs inside its busy guard (the caller wraps them).
import { ListMenu, ChoiceBox, ConfirmBox } from '../ui/index.js';
import { CLUBS, CLUB_LABEL } from '../core/constants.js';
import { joinClub, leaveClub } from '../sim/clubs.js';
import { openScene } from './registry.js';
import { displayName, kindOf } from './npc_plan.js';
import { CAST_BY_ID } from '../data/cast.js';
import { ITEM_BY_ID } from '../data/items.js';

const ctxOf = (ow) => ({ map: ow.mapId, minute: ow.sim.state.time.minute });

/** Open a registered scene; "Coming soon" toast when it is not registered yet. Returns the result. */
export async function openOrSoon(ow, name, params = {}) {
  const r = await openScene(ow.game, name, params);
  ow.afterSubScene();
  if (r && r.missing) ow.toast('Coming soon', 'warning');
  return r;
}

const HANDLERS = {
  async sleep(ow) { await ow.sleepFlow({ confirm: true }); },
  async save(ow) {
    ow.syncPlayerState();
    const r = await openScene(ow.game, 'save_menu', {});
    if (r && r.missing) {
      const w = ow.sim.save.write(1);
      ow.toast(w && w.ok ? 'Game saved (slot 1).' : 'Could not save.', w && w.ok ? 'check' : 'warning');
    }
    ow.afterSubScene();
  },
  async study(ow, it) { await openOrSoon(ow, `activity:study_${it.action.place || 'home'}`, {}); },
  async shop(ow, it) { await openOrSoon(ow, 'shop', { shop: it.action.shop }); },
  async text(ow, it) { for (const line of it.action.lines || []) await ow.showDialogue({ who: null, text: line, style: 'narrate' }); },
  async event(ow, it) { await ow.runEventById(it.action.id); },
  async activity(ow, it) { await openOrSoon(ow, `activity:${it.action.id}`, {}); },
  async job(ow, it) { await openOrSoon(ow, `activity:job_${it.action.id || 'cafe'}`, {}); },
  async rest(ow) { await openOrSoon(ow, 'activity:rest', {}); },
  async collect(ow, it) { await openOrSoon(ow, it.action.table === 'beach_shells' ? 'activity:shell_hunt' : `activity:${it.action.table}`, {}); },
  async board(ow, it) { await noticeBoard(ow, it.action.id || 'school'); },
  async calendar(ow) { await openOrSoon(ow, 'calendar', {}); },
  async door_locked(ow, it) { await ow.showDialogue({ who: null, text: it.action.text || 'It is locked.', style: 'narrate' }); },
};

/** Run an interactable: an `interact` event wins; otherwise its action. */
export async function runInteractable(ow, it) {
  const ev = ow.es.events.find({ type: 'interact', id: it.id }, ctxOf(ow));
  if (ev) { await ow.runEvent(ev); return; }
  const h = HANDLERS[it.action && it.action.type];
  if (!h) { console.warn(`[interact] no handler for action "${it.action && it.action.type}"`); return; }
  await h(ow, it);
}

/** Club sign-up sheet (school notice board): join, switch or leave a club. Switching resets the club rank and XP. */
export async function clubSignup(ow) {
  const state = ow.sim.state;
  const services = ow.game.ui.services;
  for (;;) {
    const cur = state.school.club;
    const items = CLUBS.map((c) => ({ label: CLUB_LABEL[c], value: c === cur ? 'joined' : '' }));
    if (cur) items.push({ label: 'Leave my club', value: '' });
    const menu = new ListMenu({ services, items, x: 24, y: 40, w: 272, rows: 8, title: 'Club Sign-ups', style: 'parchment', cancellable: true });
    const res = await ow.ask(menu, { dim: true });
    if (!res) return;
    if (res.index >= CLUBS.length) {
      const leave = await ow.ask(new ConfirmBox({ services, message: `Leave the ${CLUB_LABEL[cur]}? Your club rank resets.`, yes: 'Leave', no: 'Stay' }), { dim: true });
      if (leave) { leaveClub(state); ow.toast('Left the club.', 'check'); }
      continue;
    }
    const club = CLUBS[res.index];
    if (club === cur) { await ow.showDialogue({ who: null, text: `You are already in the ${CLUB_LABEL[club]}. Practice is after school at the running track.`, style: 'narrate' }); continue; }
    const message = cur ? `Switch from the ${CLUB_LABEL[cur]} to the ${CLUB_LABEL[club]}? Your club rank resets.` : `Join the ${CLUB_LABEL[club]}?`;
    const yes = await ow.ask(new ConfirmBox({ services, message, yes: 'Join', no: 'Not now' }), { dim: true });
    if (yes) joinClub(state, club, { bus: ow.game.bus });
  }
}

/** Notice board: upcoming festivals / exams / breaks (school, plus the club sign-up sheet) or festivals / birthdays (town). */
export async function noticeBoard(ow, id) {
  if (id === 'school') {
    const box = new ChoiceBox({ services: ow.game.ui.services, options: ['Upcoming events', 'Club sign-ups'], cancellable: true, title: 'School Notice Board', right: 200, bottom: 150 });
    const pick = await ow.ask(box);
    if (pick === undefined || pick === null || pick < 0) return;
    if (pick === 1) { await clubSignup(ow); return; }
  }
  const types = id === 'town' ? ['festival', 'birthday'] : ['festival', 'exam', 'results', 'break'];
  const rows = ow.sim.calendar.upcoming(8, { types });
  if (!rows.length) { await ow.showDialogue({ who: null, text: 'Nothing is posted right now.', style: 'narrate' }); return; }
  const when = (n) => (n === 1 ? 'tomorrow' : `in ${n} days`);
  const items = rows.map((r) => ({ label: r.name, value: when(r.daysUntil) }));
  const menu = new ListMenu({ services: ow.game.ui.services, items, x: 24, y: 40, w: 272, rows: 8, title: id === 'town' ? 'Town Notice Board' : 'School Notice Board', style: 'parchment', cancellable: true });
  await ow.ask(menu, { dim: true });
}

// ------------------------------------------------------------------------------------------------ talking
export function canGift(npc) {
  return !!CAST_BY_ID[npc] && kindOf(npc) !== 'animal' && CAST_BY_ID[npc].kind !== 'player';
}

/** The whole "talk to NPC" flow: events first, else a dialogue-pool chat; then a gift offer. */
export async function talkTo(ow, npc) {
  const sim = ow.sim, es = ow.es, state = sim.state;
  const actor = ow.npcs.actorOf(npc);
  ow.npcs.setTalking(npc, true);
  try {
    const before = sim.relationships.hearts(npc);
    const r = sim.relationships.talk(npc);
    if (r && r.newlyMet) ow.toast(`Met ${displayName(npc)}!`, 'heart_full');
    // birthday greeting
    if (state.flags[`birthday_${npc}`] && CAST_BY_ID[npc]) {
      state.daily.bdayGreeted = state.daily.bdayGreeted || {};
      if (!state.daily.bdayGreeted[npc]) {
        state.daily.bdayGreeted[npc] = true;
        await ow.showDialogue({ who: 'theo', face: 'happy', name: 'Theo', text: `Happy birthday, ${displayName(npc)}!` });
        if (actor) actor.emote('heart', 1.6);
      }
    }
    const ev = es.events.find({ type: 'talk', npc }, ctxOf(ow));
    if (ev) {
      await ow.runEvent(ev);
    } else {
      const t = es.dialogue.talk(npc, { first: !r || r.first !== false, ctx: ctxOf(ow) });
      for (const l of t.lines) await ow.showDialogue({ who: npc, face: l.face || 'neutral', name: displayName(npc), text: l.text });
      if (canGift(npc) && !state.relationships[npc].giftedToday && ow.giftItems().length) await offerGift(ow, npc);
    }
    const after = sim.relationships.hearts(npc);
    if (after > before) ow.toast(`${displayName(npc)}: ${after} heart${after === 1 ? '' : 's'}`, 'heart_full');
  } finally {
    ow.npcs.setTalking(npc, false);
  }
}

export async function offerGift(ow, npc) {
  const box = new ChoiceBox({ services: ow.game.ui.services, options: ['Give a gift', 'Never mind'], cancellable: true });
  const pick = await ow.ask(box, { keepLast: true });
  if (pick !== 0) return;
  await giftFlow(ow, npc);
}

export async function giftFlow(ow, npc) {
  const items = ow.giftItems().map((e) => ({ label: e.item.name, value: `x${e.qty}`, icon: e.item.icon, desc: e.item.desc, id: e.id }));
  if (!items.length) { await ow.showDialogue({ who: null, text: 'You have nothing to give.', style: 'narrate' }); return; }
  const menu = new ListMenu({ services: ow.game.ui.services, items, x: 60, y: 30, w: 200, rows: 6, title: 'Give what?', cancellable: true, descBox: true });
  const res = await ow.ask(menu, { dim: true });
  if (!res || !res.item) return;
  const before = ow.sim.relationships.hearts(npc);
  const g = ow.es.dialogue.gift(npc, res.item.id);
  const nm = displayName(npc);
  if (!g.ok) {
    const why = { already_gifted: `${nm} already received a gift today.`, weekly_cap: `${nm} has received enough gifts this week.`, key_item: 'That is too important to give away.' }[g.reason] || 'It does not seem right.';
    await ow.showDialogue({ who: null, text: why, style: 'narrate' });
    return;
  }
  ow.game.audio && ow.game.audio.sfx('item');
  const actor = ow.npcs.actorOf(npc);
  if (actor) actor.emote(g.delta > 3 ? 'heart' : g.delta < 0 ? 'sweat' : 'note', 1.8);
  for (const l of g.lines) await ow.showDialogue({ who: npc, face: l.face || 'neutral', name: nm, text: l.text });
  const after = ow.sim.relationships.hearts(npc);
  const name = (ITEM_BY_ID[res.item.id] || {}).name || res.item.id;
  ow.toast(`${nm} ${g.delta > 0 ? 'liked' : g.delta < 0 ? 'disliked' : 'accepted'} the ${name}  ${g.delta > 0 ? '+' : ''}${g.delta}`, g.delta < 0 ? 'warning' : 'heart_full');
  if (after > before) ow.toast(`${nm}: ${after} heart${after === 1 ? '' : 's'}`, 'heart_full');
}
