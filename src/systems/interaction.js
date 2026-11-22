/**
 * Interaction targeting (svc.interaction): each field-mode frame pick the best NPC / interactable in front of the player,
 * show the prompt + highlight, and run it on `confirm`.
 */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { svc } from './svc.js';
import { subs, npcName } from './kit.js';

const NPC_RANGE = 1.45;
const AHEAD = 0.6;
const FRONT = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };

export const LABELS = {
  bed: 'Sleep', shop: 'Shop', fishing: 'Fish', forage: 'Pick', lamp: 'Light lamp', sign: 'Read', mailbox: 'Mail', noticeboard: 'Notices',
  diary: 'Save', chest: 'Chest', job: 'Work', bench: 'Sit', rest: 'Rest', fountain: 'Make a wish', shrine: 'Pray', telescope: 'Look',
  bookshelf: 'Browse', crafting: 'Craft', object: 'Look',
};
export const promptFor = (type) => `Space: ${LABELS[type] || 'Use'}`;

const s = subs();
let target = null; // {kind:'npc'|'object', id, label, it?}
let busy = false;
let cool = 0;
let wasField = false;

function pick(ent, a, area) {
  const f = FRONT[a.facing] || FRONT.s;
  const ax = a.x + f[0] * AHEAD;
  const az = a.z + f[1] * AHEAD;
  let best = null;
  let bestD = Infinity;
  for (const o of ent.actors().values()) {
    if (o.isPlayer || o.hidden || o.leaving || o.rig?.group?.visible === false) continue;
    const dx = o.x - a.x;
    const dz = o.z - a.z;
    const d = Math.hypot(dx, dz);
    if (d > NPC_RANGE) continue;
    // roughly in front (or very close)
    if (d > 0.8 && (dx * f[0] + dz * f[1]) / d < 0.35) continue;
    const score = d - 10; // a person in front always wins over props that share the spot (anchors sit on interaction points)
    if (score < bestD) {
      bestD = score;
      best = { kind: 'npc', id: o.id, label: `Space: Talk`, actor: o };
    }
  }
  for (const it of area.interactables) {
    const d = Math.hypot(it.x - ax, it.z - az);
    if (d > (it.r || 1) + 0.5) continue;
    if (d < bestD) {
      bestD = d;
      best = { kind: 'object', id: it.id, label: promptFor(it.type), it };
    }
  }
  return best;
}

function setTarget(t) {
  const same = (!t && !target) || (t && target && t.id === target.id && t.kind === target.kind);
  if (same) return;
  target = t;
  Game.ui?.setPrompt?.(t ? t.label : null);
  Game.world?.setHighlight?.(t && t.kind === 'object' ? t.id : null);
  Game.bus.emit(EVT.INTERACT_TARGET, t ? { kind: t.kind, id: t.id, label: t.label } : null);
}

/** Talk / gift menu for an NPC (parcel hand-over first). */
async function talkTo(npcId) {
  const ent = svc.entities;
  const a = ent.actor(npcId);
  const pa = ent.playerActor();
  if (!a) return;
  a.busy = true;
  a.rig?.locomote?.(0);
  if (pa) {
    a.rig?.faceTowards?.(pa.x, pa.z);
    pa.rig?.faceTowards?.(a.x, a.z);
  }
  try {
    if (await svc.jobs?.handOver?.(npcId)) return;
    const i = await Game.ui?.dialogue?.ask?.({
      speaker: npcId,
      prompt: npcName(npcId),
      options: [{ text: 'Talk' }, { text: 'Give a gift' }, { text: 'Never mind' }],
    });
    if (i === 0) await svc.rel.talk(npcId);
    else if (i === 1) await svc.rel.giftFlow(npcId);
  } finally {
    const still = ent.actor(npcId);
    if (still) {
      still.busy = false;
      if (still.slot) svc.npcs?.applySlot?.(still, still.slot);
    }
  }
}

export const interaction = {
  init() {
    s.clear();
    target = null;
    busy = false;
    cool = 0;
    wasField = false;
  },
  get target() {
    return target;
  },
  /** Run the current target (also used by tests / touch UI). */
  async activate(t = target) {
    if (!t || busy) return;
    busy = true;
    try {
      const ent = svc.entities;
      const area = ent.area();
      setTarget(null);
      if (t.kind === 'npc') await talkTo(t.id);
      else {
        const pa = ent.playerActor();
        if (pa && t.it) pa.rig?.faceTowards?.(t.it.x, t.it.z);
        await svc.interact.run(area.id, t.it);
      }
    } catch (e) {
      console.error('[systems] interaction failed', e);
    } finally {
      busy = false;
      cool = 0.3;
    }
  },

  update(dt) {
    const ent = svc.entities;
    const a = ent?.playerActor?.();
    const area = ent?.area?.();
    const field = Game.mode === 'field' && !!a && !!area && !busy && !ent.entering;
    if (!field) {
      if (target) setTarget(null);
      wasField = false;
      return;
    }
    if (!wasField) {
      wasField = true;
      cool = Math.max(cool, 0.25);
    }
    if (cool > 0) {
      cool -= dt;
      return;
    }
    if (a.route) {
      if (target) setTarget(null);
      return;
    }
    setTarget(pick(ent, a, area));
    if (target && Game.input.pressed('confirm')) interaction.activate();
  },
};

