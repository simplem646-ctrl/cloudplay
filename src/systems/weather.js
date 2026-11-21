/** Seeded daily weather (DESIGN §5). */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { rngFor, weightedPick, fromDayNumber, seasonName } from '../core/util.js';
import { D, subs, dayNum } from './kit.js';

export const TABLES = {
  spring: { sunny: 50, cloudy: 25, rain: 22, storm: 3 },
  summer: { sunny: 60, cloudy: 15, rain: 15, storm: 10 },
  autumn: { sunny: 40, cloudy: 30, rain: 25, storm: 5 },
  winter: { sunny: 35, cloudy: 30, snow: 35 },
};

function festivalOn(season, day) {
  const fs = D().festivals || {};
  return Object.values(fs).some((f) => f?.date && f.date.season === season && f.date.day === day);
}

const s = subs();

export const weather = {
  init() {
    s.clear();
    s.on(EVT.TIME_NEWDAY, () => weather.onNewDay());
  },

  /** Pure, deterministic weather for an absolute day number. */
  roll(dn) {
    if (dn <= 3) return 'sunny';
    const { season, day } = fromDayNumber(dn);
    const name = seasonName(season);
    let entries = Object.entries(TABLES[name]);
    if (festivalOn(name, day)) entries = entries.filter(([w]) => w === 'sunny' || w === 'cloudy');
    const rng = rngFor('weather', dn);
    return weightedPick(entries, (e) => e[1], rng)[0];
  },

  onNewDay() {
    const w = Game.state?.weather;
    if (!w) return;
    const before = w.today;
    weather.reroll();
    if (w.today !== before) Game.bus.emit(EVT.WEATHER_CHANGE, { weather: w.today });
  },

  /** Recompute today/tomorrow from the current date. */
  reroll() {
    const w = Game.state?.weather;
    if (!w) return;
    w.today = weather.roll(dayNum());
    w.tomorrow = weather.roll(dayNum() + 1);
  },

  /** First-day setup (new game / old saves). */
  initState() {
    weather.reroll();
    Game.bus.emit(EVT.WEATHER_CHANGE, { weather: Game.state.weather.today });
  },

  current() {
    return Game.state?.weather?.today || 'sunny';
  },
  forecast() {
    return Game.state?.weather?.tomorrow || 'sunny';
  },
  /** Force today's weather (scripts / debug). */
  setToday(w) {
    if (!Game.state) return;
    Game.state.weather.today = w;
    Game.bus.emit(EVT.WEATHER_CHANGE, { weather: w });
  },
  isRaining() {
    return ['rain', 'storm'].includes(weather.current());
  },
};
