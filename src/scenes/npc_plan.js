// Pure planning helpers for the NPC manager (testable without engine or DOM).
import { CAST_BY_ID, EXTRAS_BY_ID } from '../data/cast.js';

/**
 * What should this NPC be doing on `mapId` at `minute`?  `r` = sim.schedule.resolve() result (or null).
 * `lead(here, toRef, nextPoint)` -> minutes the walk will take (called only when the next waypoint is close), so NPCs
 * start walking early enough to ARRIVE at the scheduled time.
 * Returns { kind: 'anchor', ref, anchor, dir, activity, early } | { kind: 'away', early }.
 */
export function wantedTarget(r, mapId, minute, lead = null, here = null) {
  const cur = r && r.map === mapId && r.anchor ? { kind: 'anchor', ref: `${r.map}:${r.anchor}`, anchor: r.anchor, dir: r.dir, activity: r.activity, early: false } : null;
  const nx = r && r.nextPoint;
  if (nx && lead && nx.minute - minute <= 60) {
    const need = lead(here, nx.map === mapId && nx.anchor ? `${nx.map}:${nx.anchor}` : null, nx);
    if (nx.minute - minute <= need) {
      if (nx.map === mapId && nx.anchor) return { kind: 'anchor', ref: `${nx.map}:${nx.anchor}`, anchor: nx.anchor, dir: nx.dir, activity: nx.activity, early: true };
      if (cur) return { kind: 'away', early: true };
    }
  }
  return cur || { kind: 'away', early: false };
}

/** Walking minutes for `tiles` path tiles at walk speed (56 px/s, 16 px tiles) and the overworld clock pace. */
export function walkMinutes(tiles, secondsPerMinute = 0.7, speed = 56) {
  return Math.ceil((tiles * 16) / speed / secondsPerMinute) + 1;
}

/** Kind of an id for outfit / behaviour decisions: student | teacher | townsfolk | animal | player | extra_student | extra_townie. */
export function kindOf(id) {
  const c = CAST_BY_ID[id];
  if (c) return c.kind;
  const e = EXTRAS_BY_ID[id];
  if (e) return String(e.extraKind || '').startsWith('student') ? 'extra_student' : 'extra_townie';
  return 'townsfolk';
}

/** Display name for a speaker / toast. */
export function displayName(id) {
  const c = CAST_BY_ID[id];
  if (c) return c.short || c.name;
  const e = EXTRAS_BY_ID[id];
  if (e) return e.name;
  if (id === 'theo') return 'Theo';
  return String(id || '').replace(/_/g, ' ');
}

/**
 * Outfit slot for an NPC from the context: school hours -> school, evening / weekend -> casual, and the schedule point's
 * `activity` (sport, swim, work, sleep). Townsfolk wear their work outfit ('auto') in working hours.
 */
export function outfitSlotFor({ id, activity = null, mapId = '', minute = 720, info = null }) {
  if (activity === 'sleep') return 'sleep';
  if (activity === 'sport' || activity === 'pe') return 'sport';
  if (activity === 'swim' || activity === 'beach') return 'swim';
  if (activity === 'work') return 'work';
  const kind = kindOf(id);
  const schoolDay = !!(info && info.isSchoolDay);
  if (kind === 'student' || kind === 'extra_student') {
    if (schoolDay && minute >= 7 * 60 + 30 && minute < 16 * 60) return 'school';
    if (schoolDay && mapId.startsWith('school_') && minute < 17 * 60) return 'school';
    return 'casual';
  }
  if (kind === 'teacher') {
    if (schoolDay && minute >= 7 * 60 && minute < 17 * 60 + 30) return 'school';
    return 'casual';
  }
  if (kind === 'townsfolk') {
    if (mapId === 'home_theo' || minute >= 19 * 60 || minute < 7 * 60) return 'casual';
    return 'auto';
  }
  return 'casual';
}

/** Outfit slot for the player: pyjamas around bedtime, uniform on school days, casual otherwise (`state.player.outfit` overrides). */
export function playerSlotFor({ outfit = 'auto', mapId = '', minute = 720, info = null }) {
  if (outfit && outfit !== 'auto') return outfit;
  if (mapId === 'home_theo' && (minute < 6 * 60 + 50 || minute >= 22 * 60)) return 'sleep';
  if (info && info.isSchoolDay && info.hasLessons && minute >= 6 * 60 + 50 && minute < 15 * 60 + 30) return 'school';
  if (info && info.isSchoolDay && mapId.startsWith('school_') && minute < 17 * 60) return 'school';
  return 'casual';
}
