// Clubs: joining, the after-school practice rules and what a practice gives (doc 02 section 5). Rules only; the
// `activity:club_practice` scene runs the club's mini-game and hands the result to `practice()`.
import { CLUBS, CLUB_LABEL } from '../core/constants.js';
import { parseTime } from '../core/util.js';
import { BALANCE } from './balance.js';
import { addEnergy, addStat, setFlag, trackSubjects } from './player.js';
import { practiceBonus } from './inventory.js';
import { advance } from './clock.js';
import { dayInfo } from './calendar.js';

/** Each club's practice mini-game id. Some are not built yet: `game.hasScene('minigame:<id>')` decides, else the scene uses its fallback. */
export const CLUB_GAME = { track: 'track_sprint', soccer: 'soccer_penalty', art: 'art_palette', music: 'music_rhythm', literature: 'literature_words', astronomy: 'astronomy_stars' };
export const clubGame = (club) => CLUB_GAME[club] || null;

/** What a practice trains: [trait|subject, amount] pairs added to the base (gold adds +1 to the first one). */
export const CLUB_TRAINING = {
  track: [['fitness', 2]], soccer: [['fitness', 2]], art: [['creativity', 2]], literature: [['creativity', 1], ['literature', 1]],
  music: [['creativity', 1], ['charm', 1]], astronomy: [['science', 1], ['creativity', 1]],
};
export const XP_BY_RANK = { gold: 12, silver: 8, bronze: 5, none: 3 };
/** Club rank n (0..5) needs this much XP. */
export const RANK_XP = [0, 20, 50, 90, 140, 200];
export const rankForXp = (xp) => RANK_XP.reduce((r, need, i) => (xp >= need ? i : r), 0);
export const PRACTICE_MINUTES = 120;
/** Start windows: school days after the bell, other days from the morning. Practice must be able to start by `latest`. */
export const WINDOWS = { schoolDay: ['15:30', '17:30'], freeDay: ['09:00', '17:30'] };

export const clubName = (club) => CLUB_LABEL[club] || club;

/** Join (or switch to) a club: rank and XP reset. Returns { ok, reason?, club, previous }. */
export function joinClub(state, club, opts = {}) {
  if (!CLUBS.includes(club)) return { ok: false, reason: 'unknown_club' };
  const previous = state.school.club;
  if (previous === club) return { ok: true, club, previous, already: true };
  state.school.club = club; state.school.clubRank = 0; state.school.clubXp = 0;
  setFlag(state, `club_joined_${club}`, true, opts);
  if (opts.bus) opts.bus.emit('toast', { text: `Joined the ${clubName(club)}!`, icon: 'star' });
  return { ok: true, club, previous };
}
export function leaveClub(state) {
  const previous = state.school.club;
  state.school.club = null; state.school.clubRank = 0; state.school.clubXp = 0;
  return { ok: !!previous, previous };
}

/** { ok, reason? }: no_club | already_practiced | too_early | too_late | too_tired. */
export function canPractice(state, minute = state.time.minute, opts = {}) {
  const b = opts.balance || BALANCE;
  if (!state.school.club) return { ok: false, reason: 'no_club' };
  if (state.daily.practiced) return { ok: false, reason: 'already_practiced' };
  const [from, to] = dayInfo(state).isSchoolDay ? WINDOWS.schoolDay : WINDOWS.freeDay;
  if (minute < parseTime(from)) return { ok: false, reason: 'too_early', opensAt: from };
  if (minute > parseTime(to)) return { ok: false, reason: 'too_late' };
  if (state.player.energy < b.energy.cost.clubPractice) return { ok: false, reason: 'too_tired' };
  return { ok: true };
}

/**
 * Apply a practice result `{ score, rank }`: energy -20, 2 hours, XP by rank (+ carried practice items), club rank from XP,
 * training gains, `daily.practiced`, `stats.miniGameWins` for silver+. `opts.advanceClock === false` leaves the clock to the scene.
 * Returns { ok, reason?, club, xp, xpTotal, rank, rankUp, traits, energy, minutes }.
 */
export function practice(state, { score = 0, rank = 'none' } = {}, opts = {}) {
  const can = canPractice(state, state.time.minute, opts);
  if (!can.ok && !opts.force) return can;
  const b = opts.balance || BALANCE;
  const club = state.school.club;
  const xp = (XP_BY_RANK[rank] ?? XP_BY_RANK.none) + practiceBonus(state);
  state.school.clubXp += xp;
  const before = state.school.clubRank;
  state.school.clubRank = Math.min(5, rankForXp(state.school.clubXp));
  const rankUp = state.school.clubRank > before;
  const traits = {};
  (CLUB_TRAINING[club] || []).forEach(([stat, n], i) => { traits[stat] = addStat(state, stat, n + (i === 0 && rank === 'gold' ? 1 : 0), opts); });
  trackSubjects(state, state.time.absDay);
  const energy = addEnergy(state, -b.energy.cost.clubPractice, opts);
  state.daily.practiced = true;
  if (rank === 'gold' || rank === 'silver') state.stats.miniGameWins = (state.stats.miniGameWins || 0) + 1;
  if (opts.advanceClock !== false) advance(state, PRACTICE_MINUTES, opts);
  if (opts.bus) {
    opts.bus.emit('club:practiced', { club, xp, rank: state.school.clubRank, score });
    if (rankUp) opts.bus.emit('toast', { text: `${clubName(club)} rank ${state.school.clubRank}!`, icon: 'star' });
  }
  return { ok: true, club, xp, xpTotal: state.school.clubXp, rank: state.school.clubRank, rankUp, traits, energy, minutes: PRACTICE_MINUTES };
}
