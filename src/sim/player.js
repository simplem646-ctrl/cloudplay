// Small player-state helpers shared by inventory, shops, clock and (later) the interpreter.
// All functions mutate `state` in place and emit events on `opts.bus`.

import { bus as defaultBus } from '../core/bus.js';
import { clamp } from '../core/util.js';
import { SUBJECTS, TRAITS } from '../core/constants.js';
import { BALANCE } from './balance.js';

const B = (opts) => (opts && opts.bus) || defaultBus;

export const isSubject = (name) => SUBJECTS.includes(name);
export const isTrait = (name) => TRAITS.includes(name);

/** Max energy for the player's current fitness (100 + 1 per 10 fitness above 10). */
export function maxEnergyFor(state, balance = BALANCE) {
  const fit = (state.player.traits && state.player.traits.fitness) || 0;
  const bonus = Math.max(0, Math.floor((fit - balance.energy.fitnessFree) / balance.energy.fitnessPerBonus));
  return balance.energy.base + bonus;
}

export function refreshMaxEnergy(state, opts = {}) {
  const p = state.player;
  p.maxEnergy = maxEnergyFor(state, opts.balance || BALANCE);
  if (p.energy > p.maxEnergy) p.energy = p.maxEnergy;
  return p.maxEnergy;
}

/** Add (or remove) energy, clamped to 0..maxEnergy. Returns the delta actually applied. */
export function addEnergy(state, delta, opts = {}) {
  const p = state.player;
  const from = p.energy;
  p.energy = clamp(Math.round(from + delta), 0, p.maxEnergy);
  const applied = p.energy - from;
  if (applied !== 0) B(opts).emit('energy:changed', { from, to: p.energy, delta: applied });
  return applied;
}

export function setEnergy(state, value, opts = {}) {
  return addEnergy(state, value - state.player.energy, opts);
}

/** Add money (negative = spend), clamped at 0..max. Returns the delta actually applied. */
export function addMoney(state, delta, opts = {}) {
  const p = state.player;
  const from = p.money;
  p.money = clamp(Math.round(from + delta), 0, BALANCE.money.max);
  const applied = p.money - from;
  if (applied !== 0) B(opts).emit('money:changed', { delta: applied, total: p.money });
  return applied;
}

export const canAfford = (state, amount) => state.player.money >= amount;

/**
 * Change a subject / trait / conduct value (0..100). Positive subject gains above the
 * diminishing-returns threshold are multiplied (`opts.diminish !== false`). Returns the applied delta.
 */
export function addStat(state, name, delta, opts = {}) {
  const p = state.player;
  const bal = opts.balance || BALANCE;
  let group = null;
  if (isSubject(name)) group = p.subjects;
  else if (isTrait(name)) group = p.traits;
  else if (name === 'conduct') group = p;
  if (!group) return 0;
  const from = group[name];
  let d = delta;
  if (d > 0 && isSubject(name) && opts.diminish !== false && from >= bal.stats.diminishAbove) {
    d = Math.max(1, Math.round(d * bal.stats.diminishFactor));
  }
  group[name] = clamp(Math.round(from + d), bal.stats.min, bal.stats.max);
  const applied = group[name] - from;
  if (applied !== 0) {
    B(opts).emit('stat:changed', { stat: name, from, to: group[name], delta: applied });
    if (name === 'fitness') refreshMaxEnergy(state, opts);
  }
  return applied;
}

export function getStat(state, name) {
  const p = state.player;
  if (isSubject(name)) return p.subjects[name];
  if (isTrait(name)) return p.traits[name];
  if (name === 'conduct') return p.conduct;
  return undefined;
}

export function setFlag(state, name, value = true, opts = {}) {
  if (state.flags[name] === value) return false;
  state.flags[name] = value;
  B(opts).emit('flag:set', { name, value });
  return true;
}

/**
 * Record knowledge gains made since the last call as "touched on `absDay`". Works no matter who
 * changed `player.subjects` (interpreter, study scene, items): it only compares values.
 */
export function trackSubjects(state, absDay) {
  const p = state.player;
  if (!p.subjectTrack) p.subjectTrack = {};
  for (const s of SUBJECTS) {
    const cur = p.subjects[s];
    const tr = p.subjectTrack[s];
    if (!tr || cur > tr.value) p.subjectTrack[s] = { value: cur, absDay };
    else tr.value = cur;
  }
}

/** Weekly knowledge decay: subjects not improved for 21 days lose 1 point (floor 10). Call on Mondays, after trackSubjects. */
export function decaySubjects(state, absDay, opts = {}) {
  const bal = opts.balance || BALANCE;
  const p = state.player;
  if (!p.subjectTrack) trackSubjects(state, absDay);
  const changed = [];
  for (const s of SUBJECTS) {
    const cur = p.subjects[s];
    const tr = p.subjectTrack[s];
    if (absDay - tr.absDay >= bal.stats.subjectDecayIdleDays && cur > bal.stats.subjectDecayFloor) {
      p.subjects[s] = cur - 1;
      tr.value = cur - 1;
      changed.push({ subject: s, from: cur, to: cur - 1 });
      B(opts).emit('stat:changed', { stat: s, from: cur, to: cur - 1, delta: -1, reason: 'decay' });
    }
  }
  return changed;
}

const SCHOOL_MAPS = new Set([
  'school_grounds', 'school_field', 'school_hall_1f', 'school_hall_2f', 'school_classroom', 'school_library',
  'school_cafeteria', 'school_art_room', 'school_music_room', 'school_gym', 'school_rooftop', 'bell_tower',
]);
export const isSchoolMap = (m) => SCHOOL_MAPS.has(m);
