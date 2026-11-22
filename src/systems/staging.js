/**
 * Cutscene staging ops (ARCHITECTURE section 11): area place move face anim expr emote hold camera hide show effect lamps decor.
 * Registered via `registerStaging(registerOp)` from index.js. Every op is a quiet no-op when no area is loaded (Node tests).
 * Staged NPCs are exempt from schedule movement until the script ends (npcs.resyncAll on event:end).
 */
import { Game } from '../core/game.js';
import { SPEED } from '../core/constants.js';
import { svc } from './svc.js';
import { opts, warnOnce, sleepMs } from './kit.js';

const DIRS = new Set(['n', 'e', 's', 'w']);
const ent = () => svc.entities;
const live = () => !!ent()?.area?.();

/** The actor for an id ('player' or npc id); NPCs are spawned on demand and marked staged. */
function actorOf(id, op) {
  if (!id) return null;
  const e = ent();
  const a = id === 'player' ? e.playerActor() : e.ensureActor(id);
  if (!a) {
    warnOnce(`stage:${op}:${id}`, `staging op "${op}": no rig for "${id}"`);
    return null;
  }
  if (!a.isPlayer) a.staged = true;
  return a;
}

function face(a, toward) {
  if (!a?.rig) return;
  if (DIRS.has(toward)) {
    a.rig.setFacing?.(toward);
    if (a.isPlayer) a.facing = toward;
    return;
  }
  const pt = ent().pointOf(toward);
  if (!pt) {
    warnOnce(`stage:face:${toward}`, `face: unknown target "${toward}"`);
    return;
  }
  a.rig.faceTowards?.(pt.x, pt.z);
  if (a.isPlayer) a.facing = a.rig.getFacing?.() || a.facing;
}

const speedOf = (s) => (s === 'run' ? SPEED.run : SPEED.walk);

export function registerStaging(reg) {
  reg('area', async (s) => {
    const e = ent();
    if (!e) return;
    const to = s.area;
    if (!to) return;
    const o = { facing: s.facing };
    if (e.area() && e.areaId() === to) {
      const pa = e.playerActor();
      const pt = e.pointOf(s.at);
      if (pa && pt) {
        e.teleport(pa, pt.x, pt.z, s.facing || pt.facing);
        Game.world?.snapCamera?.({ x: pa.x, z: pa.z });
      }
      return;
    }
    if (s.at && typeof s.at === 'object') Object.assign(o, { x: s.at.x, z: s.at.z });
    await e.enterArea(to, typeof s.at === 'string' ? s.at : undefined, o);
  });

  reg('place', async (s) => {
    if (!live() && !(s.place === 'player' && s.area)) return;
    const e = ent();
    const id = s.place;
    if (s.area && s.area !== e.areaId()) {
      if (id === 'player') {
        const o = { facing: DIRS.has(s.facing) ? s.facing : undefined };
        if (s.at && typeof s.at === 'object') Object.assign(o, { x: s.at.x, z: s.at.z });
        await e.enterArea(s.area, typeof s.at === 'string' ? s.at : undefined, o);
      }
      return; // an NPC placed in another area is simply not here
    }
    const a = actorOf(id, 'place');
    if (!a) return;
    const pt = e.pointOf(s.at);
    if (!pt) {
      warnOnce(`stage:place:${s.at}`, `place: unknown anchor "${s.at}" for ${id}`);
      return;
    }
    e.teleport(a, pt.x, pt.z);
    a.rig?.stop?.();
    a.rig?.locomote?.(0);
    a.hidden = false;
    a.rig?.setVisible?.(true);
    const f = s.facing || pt.facing;
    if (f === 'player') {
      if (id !== 'player') {
        const pa = e.playerActor();
        if (pa) a.rig?.faceTowards?.(pa.x, pa.z);
      }
    } else if (DIRS.has(f)) {
      a.rig?.setFacing?.(f, { snap: true });
      if (a.isPlayer) a.facing = f;
    }
    if (a.isPlayer) Game.world?.snapCamera?.({ x: a.x, z: a.z });
  });

  reg('move', async (s) => {
    if (!live()) return;
    const a = actorOf(s.move, 'move');
    if (!a) return;
    const pt = ent().pointOf(s.to);
    if (!pt) {
      warnOnce(`stage:move:${s.to}`, `move: unknown target "${s.to}"`);
      return;
    }
    a.rig?.stop?.();
    const p = ent().walk(a, pt.x, pt.z, { speed: speedOf(s.speed) });
    if (s.wait) await p;
  });

  reg('face', async (s) => {
    if (!live()) return;
    const a = actorOf(s.face, 'face');
    if (a) face(a, s.toward);
  });

  reg('anim', async (s) => {
    if (!live()) return;
    const a = actorOf(s.anim, 'anim');
    if (!a?.rig?.play) return;
    const o = {};
    if (s.loop !== undefined) o.loop = !!s.loop;
    else if (s.wait) o.loop = false;
    if (s.speed) o.speed = s.speed;
    const p = a.rig.play(s.name, o);
    if (s.wait) await p;
  });

  reg('expr', async (s) => {
    if (!live()) return;
    actorOf(s.expr, 'expr')?.rig?.setExpression?.(s.name);
  });

  reg('emote', async (s) => {
    if (!live()) return;
    actorOf(s.emote, 'emote')?.rig?.emote?.(s.icon ?? s.name);
  });

  reg('hold', async (s) => {
    if (!live()) return;
    actorOf(s.hold, 'hold')?.rig?.setHeld?.(s.prop || null);
  });

  reg('camera', async (s) => {
    if (!live()) return;
    const e = ent();
    const c = s.camera;
    if (c === 'reset' || c === null || (c && c.reset)) {
      e.resetCamera();
      return;
    }
    const spec = typeof c === 'string' ? { focus: c } : c || {};
    if (!e.setCameraFocus(spec.focus, spec.zoom)) {
      warnOnce(`stage:camera:${JSON.stringify(spec.focus)}`, `camera: unknown focus "${JSON.stringify(spec.focus)}"`);
      return;
    }
    const t = e.camTarget();
    if (t && Game.world?.setCamera) Game.world.setCamera(spec.zoom !== undefined ? { ...t, zoom: spec.zoom } : t);
    if (spec.ms && !opts.skipFades) await sleepMs(spec.ms);
  });

  reg('hide', async (s) => {
    if (!live()) return;
    const a = actorOf(s.hide, 'hide');
    if (!a) return;
    a.hidden = true;
    a.rig?.setVisible?.(false);
  });

  reg('show', async (s) => {
    if (!live()) return;
    const a = actorOf(s.show, 'show');
    if (!a) return;
    a.hidden = false;
    a.rig?.setVisible?.(true);
  });

  reg('effect', async (s) => {
    if (!live() || !Game.world?.playEffect) return;
    const e = ent();
    let pt = s.at !== undefined ? e.pointOf(s.at) : null;
    if (!pt) {
      const cam = e.camTarget();
      const focused = e.playerActor() && (cam.x !== e.playerActor().x || cam.z !== e.playerActor().z);
      if (focused) pt = cam;
      else {
        const pa = e.playerActor();
        const other = [...e.actors().values()].find((x) => !x.isPlayer && x.staged && !x.hidden);
        pt = pa && other ? { x: (pa.x + other.x) / 2, z: (pa.z + other.z) / 2 } : pa ? { x: pa.x, z: pa.z } : cam;
      }
    }
    if (!pt) return;
    const o = { x: pt.x, z: pt.z };
    if (s.count) o.count = s.count;
    if (s.color) o.color = s.color;
    Game.world.playEffect(s.effect, o);
  });

  reg('lamps', async (s) => {
    svc.lamps?.setOverride?.(s.lamps);
  });

  reg('decor', async (s) => {
    Game.world?.setDecor?.(s.decor || null);
  });
}
