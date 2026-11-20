import test from 'node:test';
import assert from 'node:assert/strict';
import { WEATHER_KINDS } from '../../src/core/constants.js';
import { weatherFor, rollWeather, setWeather, WEATHER_WEIGHTS, isRaining } from '../../src/sim/weather.js';
import { fromAbsDay, TOTAL_DAYS, absDayOf } from '../../src/sim/calendar.js';
import { festivalOn } from '../../src/data/calendar.js';
import { fresh, named } from './_helpers.mjs';

test('weatherFor is deterministic per (seed, day) and independent of call order', () => {
  const a = Array.from({ length: TOTAL_DAYS }, (_, i) => weatherFor(42, i));
  const b = Array.from({ length: TOTAL_DAYS }, (_, i) => weatherFor(42, TOTAL_DAYS - 1 - i)).reverse();
  assert.deepEqual(a, b);
  const c = Array.from({ length: TOTAL_DAYS }, (_, i) => weatherFor(43, i));
  assert.notDeepEqual(a, c, 'different seeds differ');
});

test('constraints: day 1 sunny, snow only in winter, storm never in winter or on festival days', () => {
  assert.equal(weatherFor(1, 0), 'sunny');
  for (let seed = 1; seed <= 60; seed++) {
    assert.equal(weatherFor(seed, 0), 'sunny');
    for (let i = 1; i < TOTAL_DAYS; i++) {
      const d = fromAbsDay(i);
      const w = weatherFor(seed, i);
      assert.ok(WEATHER_KINDS.includes(w));
      if (w === 'snow') assert.equal(d.season, 'winter', `snow in ${d.season}`);
      if (w === 'storm') {
        assert.notEqual(d.season, 'winter');
        assert.equal(festivalOn(d.season, d.day), null, `storm on festival ${d.season} ${d.day}`);
      }
      assert.ok(WEATHER_WEIGHTS[d.season].map(([k]) => k).concat('rain').includes(w));
    }
  }
});

test('distribution roughly follows the seasonal weights', () => {
  const counts = { spring: {}, summer: {}, autumn: {}, winter: {} };
  const totals = { spring: 0, summer: 0, autumn: 0, winter: 0 };
  for (let seed = 1; seed <= 400; seed++) {
    for (let i = 1; i < 112; i++) {
      const d = fromAbsDay(i);
      const w = weatherFor(seed, i);
      counts[d.season][w] = (counts[d.season][w] || 0) + 1;
      totals[d.season]++;
    }
  }
  const frac = (s, k) => (counts[s][k] || 0) / totals[s];
  assert.ok(Math.abs(frac('spring', 'sunny') - 0.5) < 0.04, `spring sunny ${frac('spring', 'sunny')}`);
  assert.ok(Math.abs(frac('summer', 'storm') - 0.1) < 0.03);
  assert.ok(Math.abs(frac('winter', 'snow') - 0.4) < 0.04);
  assert.equal(frac('winter', 'rain'), 0);
  assert.equal(frac('spring', 'snow'), 0);
});

test('rollWeather: today = old forecast, new forecast for tomorrow, event on change', () => {
  const { state, events, opts } = fresh({ seed: 9, day: 5 });
  state.weather = { today: 'sunny', tomorrow: 'rain' };
  const r = rollWeather(state, opts);
  assert.equal(state.weather.today, 'rain');
  assert.equal(r.changed, true);
  assert.equal(state.weather.tomorrow, weatherFor(9, state.time.absDay + 1));
  assert.deepEqual(named(events, 'weather:changed')[0][1], { kind: 'rain', from: 'sunny' });
  state.weather = { today: 'rain', tomorrow: 'rain' };
  const r2 = rollWeather(state, opts);
  assert.equal(r2.changed, false);
  assert.equal(named(events, 'weather:changed').length, 1);
});

test('day 1 stays sunny even with a bad stored forecast; reseed uses the seed', () => {
  const { state, opts } = fresh({ seed: 5 });
  state.weather = { today: 'rain', tomorrow: 'storm' };
  rollWeather(state, opts);
  assert.equal(state.weather.today, 'sunny');
  const f = fresh({ seed: 5, season: 'summer', day: 3 });
  f.state.weather = { today: 'sunny', tomorrow: 'sunny' };
  rollWeather(f.state, { ...f.opts, reseed: true });
  assert.equal(f.state.weather.today, weatherFor(5, absDayOf(f.state)));
});

test('setWeather validates the kind and emits', () => {
  const { state, events, opts } = fresh();
  assert.equal(setWeather(state, 'tornado', opts), false);
  assert.equal(setWeather(state, 'storm', { ...opts, tomorrow: 'cloudy' }), true);
  assert.deepEqual(state.weather, { today: 'storm', tomorrow: 'cloudy' });
  assert.equal(named(events, 'weather:changed').length, 1);
  assert.equal(isRaining('storm'), true);
  assert.equal(isRaining('snow'), false);
});
