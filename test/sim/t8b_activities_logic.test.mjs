// Club practice, café job and free-time activities: rules, guards, costs.
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  joinClub, leaveClub, canPractice, practice, rankForXp, clubGame, CLUB_GAME, RANK_XP, XP_BY_RANK, PRACTICE_MINUTES,
} from '../../src/sim/clubs.js';
import { canWork, finishShift, payFor, shiftWindow } from '../../src/sim/jobs.js';
import { rest, nap, jog, canNap, canJog, NAP, JOG } from '../../src/sim/activities.js';
import { CLUBS } from '../../src/core/constants.js';
import { parseTime } from '../../src/core/util.js';
import { fresh, named } from './_helpers.mjs';

const T = parseTime;
const wed = (extra = {}) => fresh({ season: 'spring', day: 3, minute: T('15:40'), seed: 6, ...extra }); // Wed after school
const sat = (extra = {}) => fresh({ season: 'spring', day: 6, minute: T('10:00'), seed: 6, ...extra });

test('every club has a practice mini-game id and a rank ladder of 0..5', () => {
  for (const c of CLUBS) assert.ok(clubGame(c), c);
  assert.equal(CLUB_GAME.track, 'track_sprint'); assert.equal(CLUB_GAME.music, 'music_rhythm'); assert.equal(clubGame('chess'), null);
  assert.deepEqual([0, 19, 20, 49, 50, 90, 139, 140, 199, 200, 9999].map(rankForXp), [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5]);
  assert.equal(RANK_XP.length, 6);
});

test('joining and leaving clubs', () => {
  const env = wed();
  assert.deepEqual(joinClub(env.state, 'chess'), { ok: false, reason: 'unknown_club' });
  const j = joinClub(env.state, 'art', env.opts);
  assert.deepEqual([j.ok, j.club, j.previous], [true, 'art', null]);
  assert.equal(env.state.school.club, 'art'); assert.equal(env.state.flags.club_joined_art, true);
  assert.ok(named(env.events, 'toast').some(([, p]) => /Joined the/.test(p.text)));
  env.state.school.clubXp = 30; env.state.school.clubRank = 1;
  assert.equal(joinClub(env.state, 'art').already, true); assert.equal(env.state.school.clubXp, 30); // no reset when re-joining the same club
  joinClub(env.state, 'music');
  assert.deepEqual([env.state.school.club, env.state.school.clubXp, env.state.school.clubRank], ['music', 0, 0]); // switching resets
  assert.equal(leaveClub(env.state).previous, 'music'); assert.equal(env.state.school.club, null);
  assert.equal(leaveClub(env.state).ok, false);
});

test('canPractice guards: club, window, energy, once a day', () => {
  const env = wed();
  assert.equal(canPractice(env.state).reason, 'no_club');
  joinClub(env.state, 'track');
  assert.equal(canPractice(env.state, T('15:00')).reason, 'too_early'); // school day: after 15:30 only
  assert.equal(canPractice(env.state, T('15:30')).ok, true);
  assert.equal(canPractice(env.state, T('17:31')).reason, 'too_late');
  env.state.player.energy = 19; assert.equal(canPractice(env.state).reason, 'too_tired');
  env.state.player.energy = 20; assert.equal(canPractice(env.state).ok, true);
  const free = sat(); joinClub(free.state, 'track');
  assert.equal(canPractice(free.state, T('09:00')).ok, true); assert.equal(canPractice(free.state, T('08:59')).reason, 'too_early'); // weekends open in the morning
  assert.equal(practice(wed().state, { rank: 'gold' }).reason, 'no_club');
});

test('practice: energy, time, XP by rank, club rank-up, training, once per day, wins', () => {
  const env = wed(); joinClub(env.state, 'track', env.opts);
  const r = practice(env.state, { score: 90, rank: 'gold' }, env.opts);
  assert.equal(r.ok, true); assert.equal(r.xp, XP_BY_RANK.gold); assert.equal(r.xpTotal, 12); assert.equal(r.rank, 0); assert.equal(r.rankUp, false);
  assert.equal(r.energy, -20); assert.equal(env.state.player.energy, 80);
  assert.equal(r.minutes, PRACTICE_MINUTES); assert.equal(env.state.time.minute, T('15:40') + 120);
  assert.equal(r.traits.fitness, 3); // base 2 + 1 for gold
  assert.equal(env.state.player.traits.fitness, 13); assert.equal(env.state.daily.practiced, true);
  assert.equal(env.state.stats.miniGameWins, 1);
  assert.equal(practice(env.state, { rank: 'gold' }, env.opts).reason, 'already_practiced');
  assert.equal(named(env.events, 'energy:changed').length >= 1, true);

  env.state.daily.practiced = false; env.state.player.energy = 100; env.state.time.minute = T('15:40'); env.state.school.clubXp = 18;
  const up = practice(env.state, { rank: 'bronze' }, env.opts);
  assert.equal(up.rankUp, true); assert.equal(up.rank, 1); assert.equal(env.state.school.clubRank, 1);
  assert.ok(named(env.events, 'toast').some(([, p]) => /rank 1/.test(p.text)));
});

test('practice trains the right things per club and honours practice items', () => {
  const run = (club, rank = 'silver', prep) => { const env = wed(); joinClub(env.state, club); if (prep) prep(env.state); return { env, r: practice(env.state, { rank }, { ...env.opts, advanceClock: false }) }; };
  assert.deepEqual(run('art').r.traits, { creativity: 2 });
  assert.deepEqual(run('music').r.traits, { creativity: 1, charm: 1 });
  assert.deepEqual(run('astronomy').r.traits, { science: 1, creativity: 1 });
  assert.equal(run('astronomy').env.state.player.subjects.science, 11);
  assert.deepEqual(run('literature').r.traits, { creativity: 1, literature: 1 });
  assert.equal(run('soccer', 'gold').r.traits.fitness, 3);
  assert.equal(run('track', 'none').r.xp, XP_BY_RANK.none);
  const { env } = run('track', 'silver', (s) => { s.inventory.sneakers = 1; });
  assert.ok(env.state.school.clubXp >= XP_BY_RANK.silver); // sneakers (if they carry a practice bonus) add XP, never remove it
  const noClock = run('track'); assert.equal(noClock.env.state.time.minute, T('15:40')); // advanceClock:false leaves the clock alone
});

test('café job: windows, guards, pay, bonus, charm, first-shift sign-up', () => {
  const env = wed({ minute: T('16:00') });
  assert.deepEqual(shiftWindow(env.state), { open: '16:00', close: '19:00', from: T('15:30'), latest: T('16:00') });
  assert.equal(canWork(env.state, T('15:29')).reason, 'too_early');
  assert.equal(canWork(env.state, T('15:30')).ok, true);
  assert.equal(canWork(env.state, T('16:01')).reason, 'too_late');
  env.state.player.energy = 24; assert.equal(canWork(env.state, T('16:00')).reason, 'too_tired');
  env.state.player.energy = 100;
  const money0 = env.state.player.money;
  const r = finishShift(env.state, { score: 70, rank: 'silver' }, env.opts);
  assert.equal(r.ok, true); assert.equal(r.pay, 55); assert.equal(r.bonus, 10); assert.equal(env.state.player.money, money0 + 55);
  assert.equal(r.energy, -25); assert.equal(env.state.player.energy, 75); assert.equal(r.minutes, 180); assert.equal(env.state.time.minute, T('19:00'));
  assert.equal(env.state.player.traits.charm, 11); assert.equal(env.state.school.job, 'cafe'); assert.equal(env.state.school.jobShifts, 1);
  assert.equal(r.firstShift, true); assert.equal(env.state.flags.job_cafe_started, true); assert.equal(env.state.daily.workedShift, true);
  assert.equal(finishShift(env.state, { rank: 'gold' }, env.opts).reason, 'already_worked');
  assert.ok(named(env.events, 'money:changed').length >= 1);
  assert.deepEqual([payFor('none'), payFor('bronze'), payFor('silver'), payFor('gold')], [45, 45, 55, 55]);
});

test('café job on a weekend: long window, second visit is not a first shift', () => {
  const env = sat({ minute: T('13:00') });
  assert.deepEqual(shiftWindow(env.state), { open: '10:00', close: '17:00', from: T('09:30'), latest: T('14:00') });
  env.state.school.job = 'cafe'; env.state.school.jobShifts = 4;
  assert.equal(canWork(env.state, T('14:01')).reason, 'too_late');
  const r = finishShift(env.state, { rank: 'bronze' }, { ...env.opts, advanceClock: false });
  assert.deepEqual([r.firstShift, r.pay, r.shifts], [false, 45, 5]); assert.equal(env.state.time.minute, T('13:00'));
});

test('rest, nap and jog', () => {
  const env = wed({ minute: T('12:00') }); env.state.player.energy = 40;
  assert.equal(rest(env.state, { minutes: 45 }).reason, 'bad_minutes');
  let r = rest(env.state, { minutes: 30 }, env.opts); assert.deepEqual([r.energy, r.minutes, env.state.player.energy, env.state.time.minute], [10, 30, 50, T('12:30')]);
  r = rest(env.state, { minutes: 60 }, env.opts); assert.deepEqual([r.energy, env.state.player.energy], [20, 70]);
  env.state.player.energy = env.state.player.maxEnergy; assert.equal(rest(env.state).reason, 'already_rested');

  const n = wed({ minute: T('14:00') }); n.state.player.energy = 30;
  assert.equal(nap(n.state, n.opts).energy, NAP.energy); assert.equal(n.state.player.energy, 55); assert.equal(n.state.time.minute, T('15:00'));
  assert.equal(nap(n.state).reason, 'already_napped');
  const late = wed({ minute: T('20:00') }); late.state.player.energy = 30; assert.equal(canNap(late.state).reason, 'not_daytime');
  const early = wed({ minute: T('08:00') }); early.state.player.energy = 30; assert.equal(canNap(early.state).reason, 'not_daytime');
  const fine = wed({ minute: T('14:00') }); assert.equal(canNap(fine.state).reason, 'rested'); // full energy: no need

  const j = wed({ minute: T('17:00') });
  r = jog(j.state, j.opts);
  assert.deepEqual([r.ok, r.energy, r.gains.fitness, j.state.player.traits.fitness, j.state.time.minute], [true, JOG.energy, 2, 12, T('18:00')]);
  assert.equal(jog(j.state).reason, 'already_jogged');
  const tired = wed(); tired.state.player.energy = 14; assert.equal(canJog(tired.state).reason, 'too_tired');
  const storm = wed(); storm.state.weather.today = 'storm'; assert.equal(canJog(storm.state).reason, 'bad_weather');
});

test('daily flags reset overnight so activities are available again', async () => {
  const { sleep } = await import('../../src/sim/clock.js');
  const env = wed({ minute: T('21:00') });
  joinClub(env.state, 'track'); practice(env.state, { rank: 'silver' }, { ...env.opts, advanceClock: false });
  env.state.daily.workedShift = true; env.state.daily.napped = true; env.state.daily.jogged = true;
  env.state.time.minute = T('21:30');
  sleep(env.state, { ...env.opts, autosave: false });
  assert.deepEqual([env.state.daily.practiced, env.state.daily.workedShift, env.state.daily.napped, env.state.daily.jogged], [false, false, false, false]);
});
