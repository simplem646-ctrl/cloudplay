// Weather: seeded, deterministic per (seed, absDay) so it never depends on call order.
// Weights per season (02 section 2). No snow outside winter, no storm in winter, storms are
// downgraded to rain on festival days, and Year 1 Spring 1 is always sunny.

import { bus as defaultBus } from '../core/bus.js';
import { rngFor } from '../core/rng.js';
import { WEATHER_KINDS } from '../core/constants.js';
import { fromAbsDay, absDayOf } from './calendar.js';
import { festivalOn } from '../data/calendar.js';

export const WEATHER_WEIGHTS = Object.freeze({
  spring: [['sunny', 50], ['cloudy', 25], ['rain', 25]],
  summer: [['sunny', 55], ['cloudy', 15], ['rain', 20], ['storm', 10]],
  autumn: [['sunny', 35], ['cloudy', 30], ['rain', 30], ['storm', 5]],
  winter: [['sunny', 30], ['cloudy', 30], ['snow', 40]],
});

/** Weather of absolute day `absDay` for a game `seed` (pure). */
export function weatherFor(seed, absDay) {
  if (absDay <= 0) return 'sunny';
  const d = fromAbsDay(absDay);
  const kind = rngFor(`${seed}:weather:${absDay}`).weighted(WEATHER_WEIGHTS[d.season]);
  if (kind === 'storm' && festivalOn(d.season, d.day)) return 'rain';
  return kind;
}

/**
 * New-day weather step: `today` becomes the forecast made yesterday, a new forecast is rolled for
 * tomorrow. Emits `weather:changed` { kind, from } if today's weather differs from yesterday's.
 * `state.time` must already show the NEW day. Returns { today, tomorrow, changed }.
 */
export function rollWeather(state, opts = {}) {
  const bus = opts.bus || defaultBus;
  const w = state.weather;
  const from = w.today;
  const abs = absDayOf(state);
  // the stored forecast is authoritative (it was what the player saw); fall back to the seed
  w.today = WEATHER_KINDS.includes(w.tomorrow) && !opts.reseed ? w.tomorrow : weatherFor(state.meta.seed, abs);
  if (abs === 0) w.today = 'sunny';
  w.tomorrow = weatherFor(state.meta.seed, abs + 1);
  const changed = w.today !== from;
  if (changed) bus.emit('weather:changed', { kind: w.today, from });
  return { today: w.today, tomorrow: w.tomorrow, changed };
}

/** Force today's weather (debug / events). Emits `weather:changed`. */
export function setWeather(state, kind, opts = {}) {
  if (!WEATHER_KINDS.includes(kind)) return false;
  const bus = opts.bus || defaultBus;
  const from = state.weather.today;
  state.weather.today = kind;
  if (opts.tomorrow && WEATHER_KINDS.includes(opts.tomorrow)) state.weather.tomorrow = opts.tomorrow;
  if (from !== kind) bus.emit('weather:changed', { kind, from });
  return true;
}

export const isWet = (kind) => kind === 'rain' || kind === 'storm' || kind === 'snow';
export const isRaining = (kind) => kind === 'rain' || kind === 'storm';
