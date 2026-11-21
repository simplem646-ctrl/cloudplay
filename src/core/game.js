import { EventBus } from './bus.js';
import { Input } from './input.js';
import { EVT } from './events.js';
import { nullAudio, nullPortraits } from './nulls.js';
import { dayNumber, weekdayName } from './util.js';

const MODES = ['boot', 'title', 'field', 'dialogue', 'menu', 'shop', 'cutscene', 'minigame', 'transition', 'sleep'];

function pageParams() {
  try {
    return new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  } catch (_) {
    return new URLSearchParams('');
  }
}

/**
 * The shared singleton (ARCHITECTURE §3.2). Modules talk to each other only through these slots and the bus.
 * Only mode === 'field' advances the clock and accepts player movement.
 */
export const Game = {
  bus: new EventBus(),
  input: Input,
  state: null,
  settings: {},
  mode: 'boot',
  data: null, world: null, chars: null, portraits: nullPortraits, ui: null, audio: nullAudio, systems: null,
  /** URLSearchParams of the page URL (empty in Node). */
  params: pageParams(),

  /** Switch mode and emit EVT.MODE_CHANGE {from,to}. No-op when unchanged. */
  setMode(m) {
    if (!MODES.includes(m)) throw new Error(`Game.setMode: unknown mode "${m}"`);
    const from = this.mode;
    if (from === m) return;
    this.mode = m;
    this.bus.emit(EVT.MODE_CHANGE, { from, to: m });
  },
  isMode(...modes) {
    return modes.includes(this.mode);
  },
  /** Snapshot of the game clock {year,season,day,minutes,dayNum,weekday}, or null before a game starts. */
  now() {
    const t = this.state && this.state.time;
    return t ? { year: t.year, season: t.season, day: t.day, minutes: t.minutes, dayNum: dayNumber(t), weekday: weekdayName(t.day) } : null;
  },
};

// Esc / M resolve contextually (field vs UI) based on the current mode.
Input.modeProvider = () => Game.mode;
