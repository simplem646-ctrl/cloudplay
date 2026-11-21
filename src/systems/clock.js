/** Game clock & calendar. Advances only in 'field' mode. */
import { Game } from '../core/game.js';
import { EVT } from '../core/events.js';
import { TIME_SCALE, CLOCK } from '../core/constants.js';
import { DAYS_PER_SEASON, DAY_START } from '../core/registry.js';
import { dayNumber, weekdayName, seasonName } from '../core/util.js';
import { svc } from './svc.js';
import { toast } from './kit.js';

let acc = 0;
let warnedDay = -1;
let collapsing = false;

export const clock = {
  init() {
    acc = 0;
    warnedDay = -1;
    collapsing = false;
  },

  /** Per-frame: real seconds -> game minutes (fractional accumulation). */
  update(dt) {
    if (Game.mode !== 'field' || !Game.state) return;
    const scale = TIME_SCALE[Game.settings?.timeScale || 'normal'] ?? TIME_SCALE.normal;
    acc += dt * scale;
    while (acc >= 1 && Game.mode === 'field') {
      acc -= 1;
      if (!clock.advance(1)) break;
    }
  },

  /** Advance game minutes (also usable outside field mode: benches, resting). Returns false if a collapse started. */
  advance(minutes) {
    const t = Game.state?.time;
    if (!t) return false;
    for (let i = 0; i < minutes; i++) {
      t.minutes += 1;
      Game.bus.emit(EVT.TIME_TICK, { minutes: t.minutes });
      if (t.minutes % 60 === 0) Game.bus.emit(EVT.TIME_HOUR, { hour: t.minutes / 60 });
      const dn = dayNumber(t);
      if (t.minutes >= CLOCK.warning && warnedDay !== dn) {
        warnedDay = dn;
        toast("It's getting late… you should get some rest.", { kind: 'warn', icon: 'clock' });
      }
      if (t.minutes >= CLOCK.collapse) {
        if (!collapsing) {
          collapsing = true;
          Promise.resolve(svc.director?.collapse?.()).finally(() => { collapsing = false; });
        }
        return false;
      }
    }
    return true;
  },

  /** Debug / scripts: set parts of the date or time without any day-rollover side effects. */
  set({ season, day, minutes } = {}) {
    const t = Game.state?.time;
    if (!t) return;
    const before = dayNumber(t);
    if (season !== undefined) t.season = typeof season === 'string' ? ['spring', 'summer', 'autumn', 'winter'].indexOf(season) : season;
    if (day !== undefined) t.day = day;
    if (minutes !== undefined) {
      t.minutes = minutes;
      if (minutes < CLOCK.warning) warnedDay = -1;
    }
    if (dayNumber(t) !== before) svc.weather?.reroll?.();
  },

  now() {
    const n = Game.now();
    if (!n) return null;
    return { ...n, hour: Math.floor(n.minutes / 60), minute: n.minutes % 60 };
  },
  weekdayName() {
    return Game.state ? weekdayName(Game.state.time.day) : 'mon';
  },
  seasonName() {
    return Game.state ? seasonName(Game.state.time.season) : 'spring';
  },
  dayNum() {
    return Game.state ? dayNumber(Game.state.time) : 0;
  },
  isNight(minutes) {
    const m = minutes ?? Game.state?.time?.minutes ?? DAY_START;
    return m >= 1110 || m < 360;
  },

  /** Roll the calendar forward one day (no time-of-day change). Emits time:season / time:newday. */
  rollDay() {
    const t = Game.state.time;
    t.day += 1;
    let seasonChanged = false;
    if (t.day > DAYS_PER_SEASON) {
      t.day = 1;
      t.season += 1;
      seasonChanged = true;
      if (t.season > 3) {
        t.season = 0;
        t.year += 1;
      }
    }
    if (Game.state.stats) Game.state.stats.daysPlayed = (Game.state.stats.daysPlayed || 0) + 1;
    if (seasonChanged) Game.bus.emit(EVT.TIME_SEASON, { season: t.season });
    Game.bus.emit(EVT.TIME_NEWDAY, { dayNum: dayNumber(t) });
  },

  /** Day + 1 at 06:00. */
  sleepToMorning() {
    clock.rollDay();
    Game.state.time.minutes = CLOCK.wake;
    acc = 0;
    warnedDay = -1;
  },
};
