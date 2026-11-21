import test from 'node:test';
import assert from 'node:assert/strict';
import { markerPos, makeTimingRounds, timingRoundScore, timingScore, xpProgress, clubResultLines, TIMING } from '../../src/scenes/activities/activity_club.js';
import { shopRows, maxQty, closedLine, hoursText, rowStatus, keeperLines, buyFailLine } from '../../src/scenes/activities/shop.js';
import { guardLine, restOptions, restLines, clockLabel, jogOffset } from '../../src/scenes/activities/activity_rest.js';
import { rozBrief, payLines } from '../../src/scenes/activities/activity_job.js';
import { registerActivityScenes } from '../../src/scenes/activities/index.js';
import { listScenes, resetRegistry } from '../../src/scenes/registry.js';
import { SHOP_BY_ID } from '../../src/data/shops.js';

test('timing fallback: marker is a triangle wave in 0..1', () => {
  for (let t = 0; t < 6; t += 0.07) { const p = markerPos(t, 0.9, 0.3); assert.ok(p >= 0 && p <= 1); }
  assert.equal(markerPos(0, 1, 0), 0); assert.equal(markerPos(1, 1, 0), 1); assert.ok(Math.abs(markerPos(2, 1, 0)) < 1e-9);
});

test('timing fallback: rounds are deterministic and inside the bar', () => {
  const a = makeTimingRounds(5), b = makeTimingRounds(5), c = makeTimingRounds(6);
  assert.deepEqual(a, b); assert.notDeepEqual(a, c);
  assert.equal(a.length, TIMING.rounds);
  for (const r of a) assert.ok(r.center - r.half > 0 && r.center + r.half < 1 && r.half > 0.04);
  assert.ok(makeTimingRounds(5, 1)[0].half < makeTimingRounds(5, 0)[0].half);
});

test('timing fallback: scoring is monotonic and maps onto ranks', () => {
  assert.equal(timingRoundScore(0.5, 0.5, 0.1), 100);
  assert.ok(timingRoundScore(0.55, 0.5, 0.1) < 100 && timingRoundScore(0.55, 0.5, 0.1) >= 70);
  assert.ok(timingRoundScore(0.62, 0.5, 0.1) < 40 && timingRoundScore(0.62, 0.5, 0.1) > 0);
  assert.equal(timingRoundScore(0.95, 0.5, 0.1), 0);
  assert.equal(timingRoundScore(null, 0.5, 0.1), 0);
  const rounds = makeTimingRounds(9);
  const perfect = timingScore(rounds.map((r) => r.center), rounds);
  assert.equal(perfect.score, 100); assert.equal(perfect.rank, 'gold'); assert.equal(perfect.hits, 5);
  const edge = timingScore(rounds.map((r) => r.center + r.half * 0.9), rounds);
  assert.ok(edge.rank === 'silver' || edge.rank === 'gold'); assert.equal(edge.hits, 5);
  const none = timingScore([], rounds);
  assert.equal(none.score, 0); assert.equal(none.rank, 'none'); assert.equal(none.hits, 0);
  const mixed = timingScore([rounds[0].center, rounds[1].center, null, null, null], rounds);
  assert.ok(mixed.score >= 35 && mixed.score <= 45);
});

test('club xp bar and result lines', () => {
  assert.deepEqual(xpProgress(0), { rank: 0, cur: 0, need: 20, frac: 0, max: false });
  assert.equal(xpProgress(35).rank, 1); assert.equal(xpProgress(35).cur, 15); assert.equal(xpProgress(35).need, 30);
  assert.equal(xpProgress(250).max, true);
  const lines = clubResultLines('track', { xp: 8, rankUp: true, rank: 1, traits: { fitness: 2 }, energy: -20 }, 70, 'silver').map((l) => l.text);
  assert.ok(lines.some((l) => l.includes('XP +8')) && lines.some((l) => l.includes('Rank up')) && lines.some((l) => l.includes('Fitness +2')) && lines.some((l) => l.includes('Silver medal')));
});

test('shop rows: dimmed by affordability, bag and daily limit; price column', () => {
  const base = { item: 'coffee', name: 'Coffee', icon: 'coffee', desc: 'Hot.', price: 4, limit: null, remaining: Infinity, soldOut: false, affordable: true, canCarry: true };
  const rows = shopRows([
    base,
    { ...base, item: 'cake', name: 'Cake', price: 60, affordable: false },
    { ...base, item: 'tea', name: 'Tea', canCarry: false },
    { ...base, item: 'soda', name: 'Soda', limit: 4, remaining: 0, soldOut: true },
    { ...base, item: 'candy', name: 'Candy', limit: 4, remaining: 3 },
  ]);
  assert.deepEqual(rows.map((r) => r.disabled), [false, true, true, true, false]);
  assert.deepEqual(rows.map((r) => r.value), ['$4', 'too dear', 'bag full', 'sold out', '$4']);
  assert.match(rows[4].desc, /3 left today/);
  assert.equal(rowStatus(base), null);
});

test('shop quantity: money, daily limit, bag room, cap of 9', () => {
  const row = { price: 4, remaining: Infinity };
  assert.equal(maxQty(row, 100), 9);
  assert.equal(maxQty(row, 10), 2);
  assert.equal(maxQty(row, 3), 0);
  assert.equal(maxQty({ price: 4, remaining: 3 }, 100), 3);
  assert.equal(maxQty(row, 100, (q) => q <= 5), 5);
  assert.equal(maxQty({ price: 0, remaining: Infinity }, 0), 9);
});

test('shop closed lines come from opening hours', () => {
  const mart = SHOP_BY_ID.corner_mart, cafe = SHOP_BY_ID.cafe_menu;
  assert.match(closedLine(cafe, { weekday: 'Mon', minute: 6 * 60, isSchoolDay: true }), /07:00/);
  assert.match(closedLine(cafe, { weekday: 'Mon', minute: 21 * 60, isSchoolDay: true }), /closed for the day.*07:00/);
  const weekdayShop = Object.values(SHOP_BY_ID).find((s) => s.open && s.open.weekdays && s.open.weekdays.length < 7);
  if (weekdayShop) { const off = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].find((d) => !weekdayShop.open.weekdays.includes(d)); assert.match(closedLine(weekdayShop, { weekday: off, minute: 600, isSchoolDay: false }), /closed on/); }
  assert.equal(hoursText(mart), '06:30 - 02:00'); assert.equal(hoursText({ open: null }), 'Always open');
  assert.ok(keeperLines('greet', 1).length > 5 && keeperLines('bye', -4).length > 5);
  assert.match(buyFailLine('full'), /bag/); assert.match(buyFailLine('money'), /enough money/);
});

test('guard lines are friendly for every sim reason', () => {
  const reasons = { rest: ['already_rested'], nap: ['already_napped', 'not_daytime', 'rested'], jog: ['already_jogged', 'too_tired', 'bad_weather'], club: ['no_club', 'already_practiced', 'too_late', 'too_tired'], job: ['already_worked', 'too_late', 'too_tired'] };
  for (const [kind, rs] of Object.entries(reasons)) for (const reason of rs) { const l = guardLine(kind, { reason }); assert.ok(l.length > 10 && l !== 'Not right now.', `${kind}/${reason}`); }
  assert.match(guardLine('club', { reason: 'too_early', opensAt: '15:30' }), /15:30/);
  assert.match(guardLine('job', { reason: 'too_early', window: { open: '16:00', close: '19:00' } }), /16:00/);
  assert.match(guardLine('job', { reason: 'too_late', window: { open: '16:00', close: '19:00' } }), /19:00/);
  assert.equal(guardLine('jog', { reason: 'weird' }), 'Not right now.');
});

test('rest options, result lines, clock label, jog scroll', () => {
  assert.deepEqual(restOptions(50, 100), [{ minutes: 30, gain: 10 }, { minutes: 60, gain: 20 }]);
  assert.deepEqual(restOptions(95, 100), [{ minutes: 30, gain: 5 }, { minutes: 60, gain: 5 }]);
  const t = restLines('jog', { energy: -10, gains: { fitness: 2 }, minutes: 60 }).map((l) => l.text);
  assert.ok(t.includes('Energy -10') && t.includes('Fitness +2') && t.includes('Time passed: 1 h'));
  assert.ok(restLines('rest', { energy: 20, minutes: 30 }).map((l) => l.text).includes('Time passed: 30 min'));
  assert.equal(clockLabel(965), '16:05'); assert.equal(clockLabel(1500), '01:00');
  assert.ok(jogOffset(2, 10) === 20 && jogOffset(0.19, 10) === 1);
});

test('cafe job text: long first-shift welcome, pay card with bonus and shift count', () => {
  assert.ok(rozBrief({ firstShift: true }).length > rozBrief({ firstShift: false, shifts: 1 }).length * 2);
  assert.notEqual(rozBrief({ shifts: 1 }), rozBrief({ shifts: 5 }));
  const t = payLines({ pay: 55, bonus: 10, shifts: 1, firstShift: true, energy: -25 }, 'gold').map((l) => l.text);
  assert.ok(t[0] === 'Pay  $55' && t.some((l) => l.includes('$10 tip')) && t.some((l) => l.includes('Charm +1')) && t.some((l) => l.includes('first')));
  assert.ok(!payLines({ pay: 45, bonus: 0, shifts: 2, firstShift: false, energy: -25 }, 'none').some((l) => l.text.includes('tip')));
});

test('registerActivityScenes registers the mini-games and the six screens', () => {
  resetRegistry();
  registerActivityScenes();
  const names = listScenes();
  for (const n of ['minigame:track_sprint', 'minigame:music_rhythm', 'minigame:cafe_serve', 'shop', 'activity:club_practice', 'activity:job_cafe', 'activity:rest', 'activity:nap', 'activity:jog']) assert.ok(names.includes(n), n);
});
