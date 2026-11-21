import test from 'node:test';
import assert from 'node:assert/strict';
import { createNewGame } from '../../src/sim/state.js';
import {
  buildFriends, buildCalendarData, calendarDayLines, takeSnapshot, diffSnapshots, buildSleepCard, formatSlot, formatPlayTime,
  selectEndingSlides, endingId, musicForSlide, buildJournal, buildItemList, normalizeSettings, textSpeedName, ENDING_FALLBACK, stepSeason,
} from '../../src/scenes/menus/data.js';

const game = () => createNewGame({ seed: 5 });

test('friends: only met characters, sorted partner > romance > friends > others', () => {
  const s = game();
  for (const id of ['nina', 'elise', 'jules', 'dante', 'roz', 'clara']) { s.relationships[id].met = true; }
  s.relationships.elise.friendship = 60; s.relationships.nina.friendship = 30; s.relationships.clara.friendship = 80;
  s.relationships.jules.friendship = 50; s.relationships.dante.friendship = 70;
  s.romance.partner = 'nina';
  const list = buildFriends(s);
  assert.deepEqual(list.map((f) => f.id).slice(0, 5), ['nina', 'clara', 'elise', 'dante', 'jules']);
  assert.equal(list[0].group, 'partner'); assert.equal(list[0].status, 'Dating');
  assert.equal(list.at(-1).id, 'roz');
  assert.ok(!list.some((f) => f.id === 'mari'));
  assert.equal(list[1].hearts, 8);
});

test('calendar data marks festivals, exams, breaks and birthdays of met people', () => {
  const s = game();
  const spring = buildCalendarData(s, 'spring');
  assert.equal(spring[14].festival, 'Blossom Day');
  assert.ok(spring[22].exam && spring[24].exam && !spring[25]);
  assert.ok(spring[26].results);
  assert.deepEqual(spring[18]?.birthdays, undefined); // Mari not met yet
  s.relationships.mari.met = true;
  assert.deepEqual(buildCalendarData(s, 'spring')[18].birthdays, ['Mari']);
  const summer = buildCalendarData(s, 'summer');
  assert.ok(summer[15].breakDay && summer[28].breakDay && !summer[14].breakDay);
  assert.equal(buildCalendarData(s, 'autumn')[27].festival, 'Bell Festival');
  assert.equal(buildCalendarData(s, 'autumn')[9].birthdays[0], 'You');
  assert.ok(calendarDayLines('spring', 22, spring).some((l) => l.includes('Math')));
  assert.equal(stepSeason('winter', 1, 1), null);
  assert.equal(stepSeason('spring', 1, 1).season, 'summer');
});

test('sleep card diff: money, hearts, subjects, events', () => {
  const s = game();
  const before = takeSnapshot(s);
  s.player.money += 25; s.relationships.nina.met = true; s.relationships.nina.friendship = 12;
  s.relationships.vera.friendship = 5; // not met: hidden
  s.player.subjects.math += 3;
  s.events.seen.intro_a = { count: 1, lastAbsDay: 0 };
  const diff = diffSnapshots(before, takeSnapshot(s), { isMet: (id) => s.relationships[id].met });
  assert.equal(diff.money, 25);
  assert.deepEqual(diff.hearts.map((h) => [h.id, h.delta, h.toHearts]), [['nina', 12, 1]]);
  assert.deepEqual(diff.subjects.map((x) => [x.key, x.delta]), [['math', 3]]);
  assert.deepEqual(diff.events, ['intro_a']);
  assert.deepEqual(diffSnapshots(null, takeSnapshot(s)), { money: 0, hearts: [], subjects: [], events: [] });
  const summary = {
    from: { year: 1, season: 'spring', day: 13, absDay: 12 }, date: { year: 1, season: 'spring', day: 14, absDay: 13 },
    dayInfo: { absDay: 13, festival: { name: 'Blossom Day' }, birthdays: ['mari'], exam: null }, weather: { today: 'rain', tomorrow: 'sunny' }, allowance: 0,
  };
  const card = buildSleepCard(summary, diff);
  assert.equal(card.title, 'Day 13');
  assert.equal(card.banner.line, 'Spring 14 - Sunday - Rainy');
  assert.deepEqual(card.notices.map((n) => n.kind), ['festival', 'birthday']);
});

test('save slot summary formatting', () => {
  assert.equal(formatPlayTime(3725), '1:02');
  const full = formatSlot({ slot: 'slot2', empty: false, corrupt: false, summary: { year: 2, season: 'autumn', day: 9, weekday: 'Mon', timeLabel: '3:05 PM', location: 'Bell Square', playSeconds: 7260, partnerName: 'Nina', money: 120, club: 'track' } });
  assert.equal(full.label, 'Slot 2'); assert.equal(full.kind, 'full');
  assert.match(full.lines[0], /Year 2.*Autumn 9.*3:05 PM/); assert.match(full.lines[1], /Bell Square.*2:01/); assert.match(full.lines[2], /Dating Nina/);
  const auto = formatSlot({ slot: 'auto', empty: true, corrupt: false }, { mode: 'save' });
  assert.ok(auto.readOnly && auto.kind === 'empty');
  assert.equal(formatSlot({ slot: 'slot1', empty: false, corrupt: true }).kind, 'corrupt');
  assert.match(formatSlot({ slot: 'slot1', empty: true }, { mode: 'save' }).lines[0], /save here/);
});

test('ending wiring: composer result, fallback, ids, music', () => {
  const s = game();
  const slides = [{ id: 'a', mood: 'good' }, { id: 'b', mood: 'bittersweet' }];
  assert.deepEqual(selectEndingSlides(s, () => slides), slides);
  assert.equal(selectEndingSlides(s, () => []), ENDING_FALLBACK);
  assert.equal(selectEndingSlides(s, () => { throw new Error('x'); }), ENDING_FALLBACK);
  s.school.spirit = 70; s.romance.partner = 'clara';
  assert.equal(endingId(s), 'saved_clara');
  s.school.spirit = 10; s.romance.partner = null;
  assert.equal(endingId(s), 'merged_solo');
  assert.equal(musicForSlide(slides[0], s), 'ending_good');
  assert.equal(musicForSlide(slides[1], s), 'ending_bittersweet');
  assert.equal(musicForSlide({}, s), 'ending_bittersweet');
});

test('journal order, item list, settings normalisation', () => {
  const s = game();
  s.quests = { a: { state: 'complete', startedAbsDay: 1, notes: [] }, b: { state: 'active', startedAbsDay: 2, notes: ['n'] }, c: { state: 'active', startedAbsDay: 3, notes: [] } };
  const j = buildJournal(s, { a: { title: 'A', main: true }, b: { title: 'B' }, c: { title: 'C' } });
  assert.deepEqual(j.map((q) => q.id), ['a', 'c', 'b']);
  s.inventory = { bread: 2, nope_item: 1, apple: 0 };
  const items = buildItemList(s.inventory);
  assert.equal(items.length, 2); assert.equal(items[0].id, 'bread'); assert.ok(items[0].usable);
  assert.deepEqual(normalizeSettings({ musicVolume: 0.33, textSpeed: 3, keyHints: false }), { masterVolume: 0.8, musicVolume: 0.3, sfxVolume: 0.8, textSpeed: 'fast', keyHints: false });
  assert.equal(textSpeedName(1), 'slow');
});
