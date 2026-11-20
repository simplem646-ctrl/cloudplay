// Part-time job: the Lantern Café (doc 02 sections 4-5). Rules only; `activity:job_cafe` runs `minigame:cafe_serve`
// and hands the result to `finishShift()`.
import { CURRENCY } from '../core/constants.js';
import { parseTime } from '../core/util.js';
import { BALANCE } from './balance.js';
import { addEnergy, addMoney, addStat, setFlag } from './player.js';
import { advance } from './clock.js';
import { dayInfo } from './calendar.js';

export const JOBS = {
  cafe: { id: 'cafe', name: 'Lantern Cafe', boss: 'roz', map: 'cafe_lantern', game: 'cafe_serve', minutes: 180, trait: 'charm' },
};
/** Shift hours (doc 02): weekdays 16:00-19:00, weekends and breaks 10:00-17:00. A shift may START from 30 min before opening until close - 3 h. */
export const HOURS = { weekday: ['16:00', '19:00'], freeDay: ['10:00', '17:00'], earlyStart: 30 };
const SILVER_UP = ['silver', 'gold'];

export function shiftWindow(state) {
  const [open, close] = dayInfo(state).isSchoolDay ? HOURS.weekday : HOURS.freeDay;
  return { open, close, from: parseTime(open) - HOURS.earlyStart, latest: parseTime(close) - JOBS.cafe.minutes };
}

/** { ok, reason?, window }: already_worked | too_early | too_late | too_tired. The first shift also signs the player up. */
export function canWork(state, minute = state.time.minute, opts = {}) {
  const b = opts.balance || BALANCE;
  const window = shiftWindow(state);
  if (state.daily.workedShift) return { ok: false, reason: 'already_worked', window };
  if (minute < window.from) return { ok: false, reason: 'too_early', window };
  if (minute > window.latest) return { ok: false, reason: 'too_late', window };
  if (state.player.energy < b.energy.cost.shift) return { ok: false, reason: 'too_tired', window };
  return { ok: true, window };
}

/** Pay for a result: base, plus the bonus for silver or better. */
export const payFor = (rank, opts = {}) => { const m = (opts.balance || BALANCE).money; return m.cafeShift + (SILVER_UP.includes(rank) ? m.cafeShiftBonus : 0); };

/**
 * Finish a shift with the mini-game result `{ score, rank }`: pay, energy -25, 3 hours, +1 charm, `school.job = 'cafe'`,
 * `school.jobShifts++`, `daily.workedShift`. Returns { ok, reason?, pay, bonus, energy, minutes, shifts, firstShift }.
 */
export function finishShift(state, { score = 0, rank = 'none' } = {}, opts = {}) {
  const can = canWork(state, state.time.minute, opts);
  if (!can.ok && !opts.force) return can;
  const b = opts.balance || BALANCE;
  const firstShift = !state.school.job;
  state.school.job = 'cafe';
  const pay = addMoney(state, payFor(rank, opts), opts);
  const energy = addEnergy(state, -b.energy.cost.shift, opts);
  addStat(state, JOBS.cafe.trait, 1, opts);
  state.school.jobShifts += 1;
  state.daily.workedShift = true;
  if (state.stats && (rank === 'gold' || rank === 'silver')) state.stats.miniGameWins = (state.stats.miniGameWins || 0) + 1;
  if (firstShift) setFlag(state, 'job_cafe_started', true, opts);
  if (opts.advanceClock !== false) advance(state, JOBS.cafe.minutes, opts);
  if (opts.bus) opts.bus.emit('job:shift', { job: 'cafe', pay, rank, score, shifts: state.school.jobShifts });
  return { ok: true, pay, bonus: SILVER_UP.includes(rank) ? b.money.cafeShiftBonus : 0, energy, minutes: JOBS.cafe.minutes, shifts: state.school.jobShifts, firstShift, currency: CURRENCY };
}
