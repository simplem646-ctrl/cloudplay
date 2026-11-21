// Calder Bakery: baker's side behind a display counter (oven, work table, flour sacks), a window table for
// customers, family photos on the wall. 16x12.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('bakery', { name: 'Calder Bakery', ambient: { music: 'cafe', lighting: 'indoor', weather: false, ambience: null } });
  b.stamp('room', 0, 0, 16, 12, { wall: 'pink', floor: 'wood_light', floor2: 'wood' });

  // flour-dusted baker's floor and rugs for the customers
  b.tiles(['floor_tile_white_a', 'floor_tile_white_b'], 1, 2, 9, 3);
  b.stamp('rug', 2, 7, 5, 3, { color: 'red' });
  b.stamp('rug', 10, 7, 5, 3, { color: 'blue' });

  // wall row: windows, door, frames
  b.stamp('window_in', 3, 0, { kind: 'curtain' });
  b.stamp('window_in', 9, 0, { kind: 'plain' });
  const door = b.stamp('door_in', 11, 0, { kind: 'wood' });
  b.stamp('window_in', 13, 0, { kind: 'curtain' });
  b.put('wall_shelf', 5, 1); b.put('wall_shelf', 6, 1); b.put('wall_shelf', 7, 1);
  b.put('wall_clock', 1, 1);
  b.put('frame_family', 2, 1); b.put('frame_flower', 12, 1);
  b.put('wall_calendar', 14, 1);

  // baker's side: work counter, oven, fridge, flour sacks
  b.stamp('counter', 2, 2, { w: 3, kind: 'wood' });
  b.put('stove', 5, 2); b.put('stove', 6, 2);
  b.stamp('tall', 8, 1, 'fridge');
  b.stamp('table', 3, 4, { w: 3 }); // dough bench
  b.put('planter_wood', 1, 3); b.put('planter_wood', 1, 4); b.put('planter_wood', 1, 5); b.put('plant_pot', 7, 4);

  // display counter (gap at x9 for the baker)
  b.stamp('counter', 2, 5, { w: 7, kind: 'marble' });
  b.put('plant_pot', 10, 5); b.put('plant_pot', 14, 3);

  // customers' corner: a table with four chairs, plants
  b.stamp('table', 11, 8, { w: 2, cloth: 'red' });
  b.stamp('chair', 10, 8, { dir: 'r' }); b.stamp('chair', 13, 8, { dir: 'l' });
  b.stamp('chair', 11, 7, { dir: 'd', color: 'red' }); b.stamp('chair', 12, 9, { dir: 'u', color: 'red' });
  b.put('plant_pot', 14, 10); b.put('plant_pot', 1, 10); b.put('plant_pot', 8, 10);
  b.put('lamp_head', 4, 7, 'above'); b.put('lamp_head', 12, 5, 'above'); b.put('lamp_head', 7, 9, 'above');

  b.setAnchors({
    entrance: [11, 3, 'down'], center: [7, 8, 'up'],
    spot_a: [4, 8, 'up'], spot_b: [8, 7, 'up'], spot_c: [6, 10, 'up'], spot_d: [13, 5, 'left'],
    npc_1: [6, 6, 'up'], npc_2: [4, 3, 'down'], npc_3: [6, 3, 'up'], npc_4: [12, 9, 'up'], npc_5: [10, 3, 'down'], npc_6: [9, 8, 'left'],
    door: [door.front.x, door.front.y, 'up'], counter: [4, 6, 'up'], oven: [6, 3, 'up'], table_1: [12, 9, 'up'],
    from_town_square: [door.front.x, door.front.y, 'down'],
  });
  b.warp(door.door.x, door.door.y, 1, 1, 'town_square:from_bakery', { sfx: 'door_open' });

  b.interact('bakery_counter', 2, 5, 7, 1, 'Display counter', { type: 'shop', shop: 'bakery' });
  b.interact('oven', 5, 2, 2, 1, 'Oven', { type: 'text', lines: ['The big brick oven ticks as it cools. Everything in here smells of butter and warm crust.', 'Mrs. Calder starts it at four every morning. Nina does the deliveries before the first bell.'] });
  return b.build();
}
