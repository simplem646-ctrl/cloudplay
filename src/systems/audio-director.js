/**
 * Music + ambience selection (ARCHITECTURE section 4: AREA_MUSIC). Systems picks, Audio plays.
 * `pickMusic()` is pure (given the context); `apply()` pushes the result to Game.audio.
 */
import { Game } from '../core/game.js';
import { AREA_MUSIC, SEASONS } from '../core/registry.js';
import { seasonName } from '../core/util.js';
import { svc } from './svc.js';

const DAY_FROM = 360; // 06:00
const DAY_TO = 1110; // 18:30

/** Context for the current game state (or explicit overrides). */
export function audioContext(area, o = {}) {
  const st = Game.state;
  const minutes = o.minutes ?? st?.time?.minutes ?? 720;
  const season = o.season ?? (st ? seasonName(st.time.season) : 'spring');
  const weather = o.weather ?? st?.weather?.today ?? 'sunny';
  return { area, minutes, season: SEASONS.includes(season) ? season : seasonName(season), weather };
}

/** Track id for the area in the given context. */
export function pickMusic(ctx) {
  const { area, minutes, season, weather } = ctx;
  const fest = svc.events?.festivalActive?.(minutes) || null;
  if (fest && fest.area === area) return fest.date?.season === 'winter' ? 'festival_winter' : 'festival';
  const kind = AREA_MUSIC[area] || 'town';
  if (kind !== 'town') return kind;
  const day = minutes >= DAY_FROM && minutes < DAY_TO;
  if (!day) return 'night';
  if (weather === 'rain' || weather === 'storm') return 'town_rain';
  return `town_${season}`;
}

export const ambienceFor = (ctx) => ({
  area: ctx.area,
  weather: ctx.weather,
  season: ctx.season,
  night: ctx.minutes < DAY_FROM || ctx.minutes >= DAY_TO,
});

export const audioDirector = {
  pickMusic,
  ambienceFor,
  /** Play the area's music + ambience (skipped for music while an event owns the soundtrack). */
  apply(area, o = {}) {
    if (!area || !Game.audio) return null;
    const ctx = audioContext(area, o);
    const track = pickMusic(ctx);
    if (!(svc.events?.running && !o.force)) Game.audio.playMusic?.(track, { fadeMs: o.fadeMs ?? 1200 });
    Game.audio.setAmbience?.(ambienceFor(ctx));
    return track;
  },
};
