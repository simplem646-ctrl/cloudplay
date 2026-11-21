// Rooftop: wide sea view beyond an iron rail, benches, vending machine, herb garden, water tank, Biscuit's
// cardboard bed and the chained door to the bell tower. 26x16.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('school_rooftop', { name: 'Rooftop', ambient: { music: 'rooftop', lighting: 'indoor', weather: false, ambience: 'wind' } });

  // sky / sea view across the north, roof floor below
  b.rect('sea', 0, 0, 26, 2);
  b.rect('flagstone', 0, 2, 26, 14);
  b.rect('slate', 9, 4, 8, 9); // worn central patch

  // stairwell house (top-left) with the door down to the hall, tower base (top-right) with the chained door
  for (let x = 0; x < 9; x++) { b.put('iwall_stone_hi', x, 2); b.put('iwall_stone_face', x, 3); }
  b.stamp('door_in', 4, 2, { kind: 'wood' });
  b.stamp('window_in', 1, 2, { kind: 'plain' });
  b.stamp('window_in', 7, 2, { kind: 'plain' });
  for (let x = 17; x < 25; x++) { b.put('iwall_stone_hi', x, 2); b.put('iwall_stone_face', x, 3); }
  b.stamp('door_in', 21, 2, { kind: 'stairs' });
  b.put('plant_pot', 20, 4); b.put('plant_pot', 22, 4);

  // rails: north (between the houses), west/east/south edges
  b.rect('railing', 9, 2, 8, 1);
  b.rect('railing', 25, 2, 1, 14);
  b.rect('railing', 0, 4, 1, 12);
  b.rect('railing', 0, 15, 26, 1);

  // vending machines and benches
  b.stamp('vending', 1, 7, { color: 'blue' });
  b.stamp('vending', 2, 7, { color: 'red' });
  b.stamp('bench', 10, 5);
  b.stamp('bench', 13, 5);
  b.put('plant_pot', 9, 5); b.put('plant_pot', 15, 5);
  b.stamp('bench', 4, 13);
  b.put('trash_can', 6, 13);

  // water tank (stacked stone masses) east
  for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) b.put(j === 0 ? 'iwall_stone_hi' : j === 1 ? 'iwall_stone_face' : 'iwall_stone_cap_s', 22 + i, 8 + j);
  b.put('pebbles_a', 22, 11);

  // herb garden in the south-east
  b.stamp('flowerbed', 17, 12, 7, 2, { seed: 12, kinds: ['flowers_white', 'flowers_yellow', 'flowers_mixed_a', 'tallgrass_a', 'clover_a'], border: 'lowwall' });

  // Biscuit's cardboard bed: rug scrap, crate and bowl by the sunny corner
  b.stamp('rug', 4, 10, 2, 2, { color: 'cream' });
  b.put('table_o', 6, 10);
  b.put('pebbles_b', 3, 12);

  // clutter
  b.put('plant_pot', 12, 12); b.put('plant_pot', 14, 12);
  b.put('stump_b', 11, 9);
  b.put('log_h', 19, 8);
  b.put('weeds_a', 8, 7); b.put('weeds_b', 18, 6); b.put('mushrooms_a', 3, 14);

  b.setAnchors({
    entrance: [4, 5, 'down'], center: [12, 8, 'down'],
    spot_a: [7, 11, 'up'], spot_b: [12, 10, 'up'], spot_c: [19, 6, 'left'], spot_d: [14, 14, 'up'],
    npc_1: [3, 9, 'right'], npc_2: [11, 7, 'down'], npc_3: [8, 5, 'down'], npc_4: [15, 10, 'left'], npc_5: [20, 9, 'up'], npc_6: [9, 9, 'right'],
    door: [4, 4, 'up'], fence_a: [12, 3, 'up'], fence_b: [1, 13, 'left'], bench: [11, 6, 'up'], vending: [1, 9, 'up'],
    cat_spot: [5, 12, 'left'], tower_door: [21, 4, 'up'], water_tank: [21, 9, 'right'], garden: [19, 10, 'down'],
    from_school_hall_2f: [4, 4, 'down'], from_bell_tower: [21, 4, 'down'],
  });
  b.warp(4, 3, 1, 1, 'school_hall_2f:from_school_rooftop', { sfx: 'door_open' });
  b.warp(21, 3, 1, 1, 'bell_tower:from_school_rooftop', { sfx: 'door_open', requires: { flag: 'main_rope_found' }, lockedText: 'The tower door is chained shut.' });

  b.interact('vending', 1, 7, 2, 1, 'Vending machines', { type: 'shop', shop: 'vending_school' });
  b.interact('bench', 10, 5, 4, 1, 'Bench', { type: 'rest' });
  b.interact('tower_door', 21, 3, 1, 1, 'Tower door', { type: 'door_locked', text: 'The tower door is chained shut.' });
  return b.build();
}
