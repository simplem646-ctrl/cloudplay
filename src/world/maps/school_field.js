// Sports Field: red running track around a striped soccer pitch, bleachers on the north infield, club shed,
// drinking-fountain corner, hurdles, goals and a long-jump pit. West gate from the school grounds. 44x30.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('school_field', { name: 'Sports Field', ambient: { music: 'sports', lighting: 'outdoor', weather: true, ambience: 'birds' } });
  const CX = 22, CY = 15;
  const outline = (t, x, y, w, h) => { b.rect(t, x, y, w, 1); b.rect(t, x, y + h - 1, w, 1); b.rect(t, x, y, 1, h); b.rect(t, x + w - 1, y, 1, h); };

  // ---- ground: lush outer lawn, red track ellipse, mown infield, striped pitch with white lines
  b.rect('grass_lush', 0, 0, 44, 30);
  b.rect('grass', 0, 20, 7, 10);
  b.blob('brick', CX, CY, 20, 13, { roughness: 0 });
  b.blob('grass', CX, CY, 17, 10, { roughness: 0 });
  for (let x = 10; x < 34; x += 2) b.rect(x % 4 === 2 ? 'grass_lush' : 'grass_dark', x, 10, 2, 11);
  outline('plaza', 10, 10, 24, 11);            // touch lines
  b.rect('plaza', 22, 10, 1, 11);              // halfway line
  outline('plaza', 10, 12, 4, 7); outline('plaza', 30, 12, 4, 7); // penalty boxes
  // start / finish lines and relay zone across the track
  b.rect('plaza', 28, 24, 1, 4);
  b.rect('plaza', 14, 3, 1, 5);
  // gate path in from the west, and a path to the shed
  b.rect('path', 0, 14, 4, 3);
  b.rect('path', 35, 5, 3, 4);
  b.rect('gravel', 34, 6, 3, 1);
  // long jump runway and pit (south-west)
  b.rect('path', 4, 27, 6, 1);
  b.rect('sand_flat', 1, 26, 3, 3);
  // drinking-fountain corner pad (south-east)
  b.rect('plaza', 37, 24, 5, 4);
  b.rect('path', 31, 24, 7, 1);

  // ---- boundary fence with a gate, goals, hurdles
  b.rect('picket', 0, 0, 44, 1);
  b.rect('picket', 43, 0, 1, 30);
  b.rect('picket', 0, 29, 44, 1);
  b.rect('picket', 0, 0, 1, 30);
  b.gap(0, 13, 1, 5);
  b.rect('railing', 9, 13, 1, 5);   // goal A frame
  b.rect('railing', 34, 13, 1, 5);  // goal B frame
  for (const x of [1, 3, 5, 7]) b.put('log_h', x, 3);
  b.put('stump_a', 8, 3); b.put('stump_b', 1, 5);

  // ---- bleachers (north infield), scoreboard, team benches (south infield)
  b.stamp('stairs', 17, 6, 11, 3, { kind: 'wood' });
  b.rect('lowwall', 16, 5, 13, 1);
  b.gap(21, 5, 2, 1);
  b.stamp('notice_board', 29, 7);
  b.put('bush_small', 16, 8); b.put('bush_small', 28, 9);
  b.stamp('bench', 14, 22); b.stamp('bench', 17, 22);
  b.stamp('bench', 26, 22); b.stamp('bench', 29, 22);
  b.put('plant_pot', 20, 22); b.put('plant_pot', 24, 22);
  b.put('rock_a', 22, 23);

  // ---- club shed (north-east) with a flower bed, bikes and bins
  const shed = b.stamp('house', 36, 0, { w: 6, roof: 'green', wall: 'wood', door: 'green' });
  b.stamp('flowerbed', 41, 4, 2, 3, { seed: 14, kinds: ['flowers_red', 'flowers_yellow', 'flowers_white'], border: 'picket' });
  b.put('trash_can', 34, 5); b.stamp('bike_rack', 38, 7);
  b.put('plant_pot', 35, 4);

  // ---- drinking fountain corner: pedestal, vending, bench, lamps
  b.put('planter_stone', 39, 25);
  b.put('tidepool', 40, 25);
  b.stamp('vending', 41, 26, { color: 'blue' });
  b.stamp('bench', 37, 26);
  b.stamp('lamp', 38, 24);

  // ---- entrance furniture: sign, bikes, benches, lamp
  b.put('signpost', 2, 12);
  b.stamp('bench', 1, 19);
  b.stamp('lamp', 4, 18);
  b.stamp('bike_rack', 1, 9);
  b.stamp('flowerbed', 1, 22, 5, 3, { seed: 15, border: 'hedge_bloom', kinds: ['flowers_pink', 'flowers_white', 'flowers_mixed_b'] });

  // ---- trees along the outer lawn corners and edges
  for (const [x, y, k] of [[1, 1, 'round'], [10, 1, 'cherry'], [14, 1, 'pine'], [30, 1, 'round'], [26, 1, 'cherry'], [42, 21, 'pine'], [8, 28, 'cherry'], [40, 29, 'pine'], [3, 8, 'cherry']]) b.stamp('tree', x, y, { kind: k });

  // ---- life: seeded scatter on free lawn (never on the track or pitch: only plain grass cells)
  b.scatter(['flowers_red', 'flowers_yellow', 'flowers_pink', 'flowers_white', 'flowers_mixed_a', 'flowers_mixed_c'], { rect: [0, 0, 44, 30], count: 40, seed: 3, onlyOn: ['grass_lush'], gap: 1 });
  b.scatter(['tallgrass_a', 'tallgrass_b', 'tuft_a', 'clover_a'], { rect: [0, 0, 44, 30], count: 50, seed: 5, onlyOn: ['grass_lush', 'grass'] });
  b.scatter(['rock_b', 'pebbles_a', 'mushrooms_a', 'bush_round'], { rect: [0, 0, 44, 30], count: 8, seed: 7, onlyOn: ['grass_lush'], gap: 2 });

  b.setAnchors({
    entrance: [3, 15, 'right'], center: [22, 15, 'down'],
    spot_a: [12, 23, 'up'], spot_b: [32, 23, 'up'], spot_c: [22, 8, 'down'], spot_d: [22, 4, 'left'],
    npc_1: [20, 26, 'right'], npc_2: [16, 26, 'right'], npc_3: [5, 18, 'up'], npc_4: [22, 9, 'down'], npc_5: [38, 8, 'left'], npc_6: [30, 24, 'left'],
    track_start: [16, 26, 'right'], track_finish: [29, 26, 'left'], relay_start: [13, 5, 'right'],
    bleacher_top: [22, 6, 'down'], bleacher_low: [22, 9, 'down'], goal_a: [11, 15, 'left'], goal_b: [32, 15, 'right'],
    shed: [shed.front.x, shed.front.y, 'up'], water_fountain: [40, 24, 'down'],
    from_school_grounds: [3, 15, 'right'],
  });
  b.warp(0, 14, 1, 3, 'school_grounds:from_school_field');

  b.interact('practice_track', 18, 25, 6, 3, 'Running track', { type: 'activity', id: 'club_practice' });
  b.interact('practice_soccer', 19, 12, 7, 7, 'Soccer pitch', { type: 'activity', id: 'club_practice' });
  b.interact('water_fountain', 39, 25, 2, 1, 'Drinking fountain', { type: 'rest' });
  b.interact('bleachers', 17, 6, 11, 3, 'Bleachers', { type: 'text', lines: ['Wooden bleachers, sun-warmed and faintly sticky with old lemonade. Names are carved into the top row.', 'Someone has written "RUN, CLARA" in marker. Someone else has added "SLOWLY".'] });
  b.interact('shed_door', shed.door.x, shed.door.y, 1, 1, 'Club shed', { type: 'text', lines: ['The club shed: cones, hurdles, a deflated ball and a very proud sign reading "Athletics Club HQ".'] });
  return b.build();
}
