// Pure presentation rules for the overworld: night factor, weather particles, music and ambience selection, grading target.
// (Engine and audio calls live in overworld.js; everything here is data in, data out.)
import { gradingAt, overcastGrading, resolveGrading } from '../engine/grading.js';

const smooth = (t) => { const k = Math.max(0, Math.min(1, t)); return k * k * (3 - 2 * k); };

/** 0 (bright) .. 1 (dark): lamps and lit windows follow this. Dusk 17:30-19:30, dawn 05:00-06:45. */
export function nightFactor(minute) {
  const m = ((minute % 1440) + 1440) % 1440;
  if (m >= 19 * 60 + 30 || m < 5 * 60) return 1;
  if (m >= 17 * 60 + 30) return smooth((m - (17 * 60 + 30)) / 120);
  if (m < 6 * 60 + 45) return 1 - smooth((m - 5 * 60) / 105);
  return 0;
}

const OVERCAST = { cloudy: 0.2, rain: 0.5, storm: 0.8, snow: 0.3, sunny: 0 };

/** Grading target: outdoor = smooth time-of-day curve + weather overcast; indoor preset otherwise; `override` (a Stage lighting preset) wins. */
export function gradingTarget({ outdoor, minute, weather = 'sunny', override = null }) {
  if (override) return resolveGrading(override);
  if (!outdoor) return resolveGrading('indoor');
  const g = gradingAt(minute);
  const amt = OVERCAST[weather] || 0;
  return amt ? overcastGrading(g, amt) : g;
}

/**
 * Weather particles for a scene: { kind, intensity, fireflies }. kind is an engine weather kind ('rain','storm','snow','petals',
 * 'leaves') or null. Indoors there are none; clear days get a light seasonal drift (petals in spring, leaves in autumn).
 */
export function weatherPlan({ outdoor, weather = 'sunny', season = 'spring', minute = 720 }) {
  if (!outdoor) return { kind: null, intensity: 0, fireflies: 0 };
  const dark = nightFactor(minute) > 0.6;
  let kind = null;
  let intensity = 1;
  if (weather === 'rain') kind = 'rain';
  else if (weather === 'storm') kind = 'storm';
  else if (weather === 'snow') kind = 'snow';
  else if (season === 'spring') { kind = 'petals'; intensity = 0.3; }
  else if (season === 'autumn') { kind = 'leaves'; intensity = 0.3; }
  const wet = weather === 'rain' || weather === 'storm';
  return { kind, intensity, fireflies: season === 'summer' && dark && !wet ? 0.8 : 0 };
}

/** Looping ambience bed id (or null). A map's own `ambient.ambience` wins; weather next; then dawn birds / night crickets. */
export function ambiencePlan({ outdoor, mapAmbience = null, weather = 'sunny', season = 'spring', minute = 720 }) {
  if (mapAmbience) return mapAmbience;
  if (!outdoor) return null;
  if (weather === 'rain' || weather === 'storm') return 'rain';
  if (weather === 'snow') return 'snow_wind';
  const dark = nightFactor(minute) > 0.6;
  if (dark) return season === 'summer' || season === 'spring' ? 'crickets' : null;
  if (minute >= 5 * 60 + 30 && minute < 10 * 60 && (season === 'spring' || season === 'summer')) return 'birds';
  return null;
}

/**
 * Music id for the map ambient hint. 'town' -> town_<season> by day, town_night after dark, `rain` in wet weather;
 * 'school' -> school_day (school_class during a lesson when `inLesson`); anything else is used as is (home_morning, cafe, ...).
 * `known` (optional MUSIC_IDS) filters unknown ids to null.
 */
export function musicPlan({ hint = null, season = 'spring', minute = 720, weather = 'sunny', inLesson = false, known = null }) {
  if (!hint) return null;
  const ok = (id) => (known ? known.includes(id) : true);
  let id = hint;
  if (hint === 'town') {
    if (nightFactor(minute) > 0.8) id = 'town_night';
    else if (weather === 'rain' || weather === 'storm') id = 'rain';
    else id = `town_${season}`;
  } else if (hint === 'school') {
    id = inLesson ? 'school_class' : 'school_day';
  } else if (/^town_(spring|summer|autumn|winter)$/.test(hint)) {
    id = nightFactor(minute) > 0.8 ? 'town_night' : `town_${season}`;
  }
  return ok(id) ? id : ok(hint) ? hint : null;
}

/** Footstep sfx id for a tile `sound` tag. */
export function stepSfx(sound) {
  switch (sound) {
    case 'stone': case 'tile': return 'step_stone';
    case 'wood': case 'carpet': return 'step_wood';
    case 'sand': case 'water': return 'step_sand';
    default: return 'step_grass';
  }
}
