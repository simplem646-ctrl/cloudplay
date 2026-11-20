// Free-time activities: resting on a bench, napping, jogging (doc 02 section 4). Each returns plain deltas AND applies them;
// the clock moves through `clock.advance` unless `opts.advanceClock === false` (the scene animates first, then advances).
import { parseTime } from '../core/util.js';
import { BALANCE } from './balance.js';
import { addEnergy, addStat } from './player.js';
import { advance } from './clock.js';

export const NAP = { minutes: 60, energy: 25, from: '09:00', until: '17:00' };
export const JOG = { minutes: 60, energy: -10, fitness: 2, minEnergy: 15 };
export const REST_CHOICES = [30, 60];

function done(state, minutes, energy, extra, opts) {
  if (opts.advanceClock !== false) advance(state, minutes, opts);
  return { ok: true, minutes, energy, ...extra };
}

/** Sit on a bench: +10 energy per 30 minutes (30 or 60). */
export function rest(state, { minutes = 30 } = {}, opts = {}) {
  if (!REST_CHOICES.includes(minutes)) return { ok: false, reason: 'bad_minutes' };
  const per = (opts.balance || BALANCE).energy.benchRestPer30;
  if (state.player.energy >= state.player.maxEnergy) return { ok: false, reason: 'already_rested' };
  const energy = addEnergy(state, (minutes / 30) * per, opts);
  return done(state, minutes, energy, {}, opts);
}

/** { ok, reason? }: already_napped | not_daytime | rested. */
export function canNap(state, minute = state.time.minute) {
  if (state.daily.napped) return { ok: false, reason: 'already_napped' };
  if (minute < parseTime(NAP.from) || minute > parseTime(NAP.until)) return { ok: false, reason: 'not_daytime' };
  if (state.player.energy >= state.player.maxEnergy - 5) return { ok: false, reason: 'rested' };
  return { ok: true };
}
/** A one-hour daytime nap, once a day: +25 energy. */
export function nap(state, opts = {}) {
  const can = canNap(state);
  if (!can.ok) return can;
  state.daily.napped = true;
  return done(state, NAP.minutes, addEnergy(state, NAP.energy, opts), {}, opts);
}

/** { ok, reason? }: already_jogged | too_tired | bad_weather. */
export function canJog(state) {
  if (state.daily.jogged) return { ok: false, reason: 'already_jogged' };
  if (state.player.energy < JOG.minEnergy) return { ok: false, reason: 'too_tired' };
  if (state.weather.today === 'storm') return { ok: false, reason: 'bad_weather' };
  return { ok: true };
}
/** A one-hour jog, once a day: -10 energy, +2 fitness. */
export function jog(state, opts = {}) {
  const can = canJog(state);
  if (!can.ok) return can;
  state.daily.jogged = true;
  const fitness = addStat(state, 'fitness', JOG.fitness, opts);
  return done(state, JOG.minutes, addEnergy(state, JOG.energy, opts), { gains: { fitness } }, opts);
}

/** Dispatch by activity id for the generic `activity:<id>` scenes. */
export const ACTIVITY_LOGIC = { rest, nap, jog };
