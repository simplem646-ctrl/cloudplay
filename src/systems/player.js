/**
 * Player controller (svc.player): free movement in 'field' mode, 4-way facing with hysteresis, footsteps, soft NPC
 * collision, and area transitions (doors / edges, with opening-hours and lock checks).
 */
import { Game } from '../core/game.js';
import { AREAS } from '../core/registry.js';
import { SPEED } from '../core/constants.js';
import { svc } from './svc.js';
import { subs, toast, sfx, opts } from './kit.js';

const RADIUS = 0.3;
const NPC_R = 0.3;
const s = subs();
let stepT = 0;
let busy = false;
const cool = {}; // transitionId -> seconds until it may trigger again

export const player = {
  init() {
    s.clear();
    stepT = 0;
    busy = false;
    for (const k of Object.keys(cool)) delete cool[k];
  },

  /** null when `areaId` may be entered right now, else {reason, text}. Job-holders may enter their workplace after hours. */
  canEnter(areaId) {
    const info = svc.shops?.closedInfo?.(areaId);
    if (!info) return null;
    if (info.reason === 'hours' && svc.jobs?.hasAccess?.(areaId)) return null;
    return info;
  },

  /** Walk into a transition rect: closed -> toast + nudge back, else open the door and change area. */
  async useTransition(t) {
    if (busy) return;
    busy = true;
    const ent = svc.entities;
    const a = ent?.playerActor?.();
    try {
      const to = t.to;
      const interior = AREAS[to.area]?.kind === 'interior';
      const closed = interior ? player.canEnter(to.area) : null;
      if (closed) {
        toast(closed.text, { kind: 'info' });
        sfx('door_close');
        cool[t.id] = 1.6;
        if (a) player._nudgeOut(a, t);
        return;
      }
      const door = t.kind === 'door' || interior || AREAS[ent.areaId?.()]?.kind === 'interior';
      if (door) {
        Game.world?.setDoorOpen?.(t.id, true);
        sfx('door_open');
      }
      cool[t.id] = 1.2;
      await ent.enterArea(to.area, to.spawn);
    } finally {
      busy = false;
    }
  },

  /** Move the player just outside a transition rect (closed door). */
  _nudgeOut(a, t) {
    const r = t.rect;
    const dl = a.x - r.x;
    const dr = r.x + r.w - a.x;
    const dt = a.z - r.z;
    const db = r.z + r.h - a.z;
    const m = Math.min(dl, dr, dt, db);
    const pad = 0.45;
    let x = a.x;
    let z = a.z;
    if (m === db) z = r.z + r.h + pad;
    else if (m === dt) z = r.z - pad;
    else if (m === dl) x = r.x - pad;
    else x = r.x + r.w + pad;
    const area = svc.entities.area();
    const res = area.moveCircle(a.x, a.z, x - a.x, z - a.z, RADIUS);
    svc.entities.setPos(a, res.x, res.z);
    a.rig?.locomote?.(0);
  },

  update(dt) {
    const ent = svc.entities;
    const a = ent?.playerActor?.();
    const area = ent?.area?.();
    if (!a || !area || !Game.state) return;
    for (const k in cool) {
      cool[k] -= dt;
      if (cool[k] <= 0) delete cool[k];
    }
    if (a.route) return; // scripted movement (staging ops) drives the rig
    if (Game.mode !== 'field' || ent.entering || busy) {
      a.rig?.locomote?.(0);
      stepT = 0.2;
      return;
    }
    const inp = Game.input;
    const ax = inp.axis();
    const mag = Math.hypot(ax.x, ax.y);
    if (mag < 0.12) {
      a.rig?.locomote?.(0);
      stepT = 0.18;
    } else {
      const run = inp.held('run');
      const speed = (run ? SPEED.run : SPEED.walk) * Math.min(1, mag);
      const k = (speed * dt) / mag;
      let res = area.moveCircle(a.x, a.z, ax.x * k, ax.y * k, RADIUS);
      let nx = res.x;
      let nz = res.z;
      // soft collision against NPC rigs
      for (const o of ent.actors().values()) {
        if (o.isPlayer || o.hidden || o.rig?.group?.visible === false) continue;
        const dx = nx - o.x;
        const dz = nz - o.z;
        const d = Math.hypot(dx, dz);
        const min = RADIUS + NPC_R;
        if (d < min && d > 1e-4) {
          const push = min - d;
          res = area.moveCircle(nx, nz, (dx / d) * push, (dz / d) * push, RADIUS);
          nx = res.x;
          nz = res.z;
        }
      }
      const moved = Math.hypot(nx - a.x, nz - a.z);
      a.x = nx;
      a.z = nz;
      a.rig?.group?.position?.set?.(nx, 0, nz);
      // facing: dominant axis with hysteresis
      const adx = Math.abs(ax.x);
      const adz = Math.abs(ax.y);
      const horiz = a.facing === 'e' || a.facing === 'w';
      let f = a.facing;
      if (horiz) f = adz > adx * 1.25 ? (ax.y > 0 ? 's' : 'n') : ax.x > 0 ? 'e' : ax.x < 0 ? 'w' : f;
      else f = adx > adz * 1.25 ? (ax.x > 0 ? 'e' : 'w') : ax.y > 0 ? 's' : ax.y < 0 ? 'n' : f;
      if (f !== a.facing) {
        a.facing = f;
      }
      a.rig?.setFacing?.(f);
      const v = moved / Math.max(dt, 1e-4);
      a.rig?.locomote?.(v < 0.4 ? 0 : Math.min(v, SPEED.run));
      if (moved > 1e-4) {
        stepT -= dt;
        if (stepT <= 0) {
          stepT = run ? 0.27 : 0.4;
          if (!opts.noFootsteps) Game.audio?.footstep?.(area.surfaceAt(nx, nz), { run });
          if (Game.state) Game.state.stats.steps = (Game.state.stats.steps || 0) + 1;
        }
      }
    }
    // transitions
    if (ent.sinceEnter < 0.5) return;
    for (const t of area.transitions) {
      const r = t.rect;
      if (a.x >= r.x && a.x <= r.x + r.w && a.z >= r.z && a.z <= r.z + r.h && !cool[t.id]) {
        player.useTransition(t);
        break;
      }
    }
  },
};
