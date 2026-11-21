// Scheduled NPCs standing on their anchors must never cut a map in two: every warp stays reachable from the entrance (10 representative days, 15 minute steps).
import test from 'node:test';
import assert from 'node:assert/strict';
import { SCHEDULE_MODULES } from '../../src/_generated/registry.js';
import { indexSchedules, resolve } from '../../src/sim/schedule.js';
import { evaluateCondition } from '../../src/sim/conditions.js';
import { getMap } from '../../src/world/index.js';
import { fresh } from '../sim/_helpers.mjs';

const sched = indexSchedules(SCHEDULE_MODULES);
const DAYS = [
  { season: 'spring', day: 8, weather: 'sunny' }, { season: 'spring', day: 8, weather: 'rain' }, { season: 'autumn', day: 3, weather: 'cloudy', year: 2 },
  { season: 'spring', day: 22, weather: 'sunny' }, { season: 'summer', day: 6, weather: 'sunny' }, { season: 'summer', day: 7, weather: 'rain' },
  { season: 'summer', day: 27, weather: 'sunny' }, { season: 'spring', day: 14, weather: 'sunny' }, { season: 'autumn', day: 27, weather: 'cloudy' }, { season: 'spring', day: 1, weather: 'sunny' },
];
function reach(def, blocked, start) {
  const { width: W, height: H, collision } = def;
  const seen = new Uint8Array(W * H); const q = [start]; seen[start[1] * W + start[0]] = 1;
  while (q.length) {
    const [x, y] = q.pop();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
      const i = ny * W + nx;
      if (seen[i] || collision[i] || blocked.has(i)) continue;
      seen[i] = 1; q.push([nx, ny]);
    }
  }
  return seen;
}

test('NPCs on their scheduled anchors never block a door or cut a map in two', () => {
  const problems = new Map();
  for (const d of DAYS) {
    const { state } = fresh({ year: d.year || 1, season: d.season, day: d.day, seed: 1 });
    state.weather.today = d.weather;
    for (let m = 6 * 60; m <= 24 * 60; m += 15) {
      const byMap = {};
      for (const npc of Object.keys(sched)) { const r = resolve(npc, state, m, { schedules: sched, evalCond: evaluateCondition }); if (r && r.map) (byMap[r.map] = byMap[r.map] || []).push({ npc, anchor: r.anchor }); }
      for (const [mapId, list] of Object.entries(byMap)) {
        const def = getMap(mapId); const W = def.width; const ent = def.anchors.entrance;
        if (!ent) continue;
        const blocked = new Set();
        for (const { anchor } of list) { const a = def.anchors[anchor]; if (a) blocked.add(a.y * W + a.x); }
        const free = reach(def, new Set(), [ent.x, ent.y]); const crowded = reach(def, blocked, [ent.x, ent.y]);
        for (const w of def.warps) {
          const i = w.y * W + w.x;
          if (free[i] && !crowded[i] && !blocked.has(i)) {
            const near = list.filter(({ anchor }) => { const a = def.anchors[anchor]; return a && Math.abs(a.x - w.x) + Math.abs(a.y - w.y) <= 6; }).map((c) => `${c.npc}@${c.anchor}`);
            problems.set(`${mapId} -> ${w.to}`, `${d.season} ${d.day} ${d.weather} ${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')} near: ${near.join(', ')}`);
          }
        }
      }
    }
  }
  assert.deepEqual([...problems].map(([k, v]) => `${k}: ${v}`), []);
});
