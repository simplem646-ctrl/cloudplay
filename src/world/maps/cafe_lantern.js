// The Lantern Cafe: counter and kitchen pass on the east side, five tables, a window seat, paper lanterns, a jukebox
// and a lounge corner. Door to the harbor (top, centre) and a stairs door up to Theo's room (top, east). 24x16.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('cafe_lantern', { name: 'The Lantern Café', ambient: { music: 'cafe', lighting: 'indoor', weather: false, ambience: null } });
  b.stamp('room', 0, 0, 24, 16, { wall: 'wood', floor: 'wood', floor2: 'wood_light' });

  // ---- kitchen floor (behind the counter) and the entrance mat
  b.tiles(['floor_tile_checker_a', 'floor_tile_checker_b'], 14, 3, 9, 3);
  b.stamp('rug', 11, 3, 3, 3, { color: 'red' });
  b.stamp('rug', 2, 12, 6, 2, { color: 'blue' });

  // ---- wall row: windows with harbor light, menu board, doors, frames
  b.stamp('tall', 1, 1, 'plant_tall');
  b.stamp('window_in', 3, 0, { kind: 'harbor' });
  b.stamp('window_in', 5, 0, { kind: 'curtain' });
  b.stamp('blackboard', 7, 1, 3);
  b.put('wall_clock', 10, 1);
  const front = b.stamp('door_in', 12, 0, { kind: 'wood' });
  b.stamp('window_in', 14, 0, { kind: 'harbor' });
  const back = b.stamp('door_in', 22, 0, { kind: 'stairs' });
  b.put('wall_shelf', 17, 1); b.put('wall_shelf', 18, 1); b.put('wall_shelf', 19, 1);
  b.put('frame_landscape', 8, 1, 'above');
  b.put('frame_family', 21, 1);

  // ---- window seat (under the harbor windows)
  b.stamp('table', 2, 2, { w: 2, cloth: 'white' });
  b.stamp('chair', 2, 3, { dir: 'u', color: 'red' });
  b.stamp('chair', 3, 3, { dir: 'u', color: 'red' });
  b.put('plant_pot', 4, 2);

  // ---- dining tables 1-4 with four chairs each
  const set = (x, y, cloth) => {
    b.stamp('table', x, y, { w: 2, cloth });
    b.stamp('chair', x - 1, y, { dir: 'r' }); b.stamp('chair', x + 2, y, { dir: 'l' });
    b.stamp('chair', x, y - 1, { dir: 'd', color: 'red' }); b.stamp('chair', x + 1, y + 1, { dir: 'u', color: 'red' });
  };
  set(3, 6, 'red'); set(8, 6, 'blue'); set(3, 9, 'blue'); set(8, 9, 'red');

  // ---- counter, stools, kitchen
  b.stamp('counter', 13, 6, { w: 7, kind: 'marble' });
  b.put('counter_marble_l', 13, 6);
  for (const x of [14, 16, 18]) b.stamp('chair', x, 7, { dir: 'u', color: 'red' });
  b.stamp('tall', 16, 1, 'fridge');
  b.put('counter_wood_l', 15, 2);
  b.put('stove', 20, 2); b.put('sink', 21, 2);
  b.put('counter_wood_m', 17, 2); b.put('counter_wood_m', 18, 2); b.put('counter_wood_r', 19, 2);
  b.stamp('table', 15, 4, { w: 2 }); b.stamp('table', 19, 4, { w: 3 });
  b.put('plant_pot', 22, 5);

  // ---- lounge corner: sofa, tea table, jukebox
  b.stamp('rug', 15, 10, 6, 4, { color: 'red' });
  b.stamp('sofa', 16, 10, { w: 3, color: 'blue' });
  b.put('table_tea', 17, 12);
  b.stamp('chair', 16, 12, { dir: 'r', color: 'red' });
  b.stamp('chair', 18, 12, { dir: 'l', color: 'red' });
  b.put('tv_stand', 22, 11);
  b.put('plant_pot', 22, 13); b.put('plant_pot', 1, 13); b.put('plant_pot', 12, 13);

  // ---- hanging paper lanterns (lamp heads on the overhead layer)
  for (const [x, y] of [[4, 5], [9, 5], [4, 8], [9, 8], [12, 7], [17, 8], [21, 8], [7, 12]]) b.put('lamp_head', x, y, 'above');

  // ---- anchors
  b.setAnchors({
    entrance: [12, 3, 'down'], center: [11, 8, 'down'],
    spot_a: [6, 8, 'right'], spot_b: [12, 5, 'down'], spot_c: [13, 11, 'right'], spot_d: [6, 12, 'up'],
    npc_1: [14, 7, 'up'], npc_2: [18, 7, 'up'], npc_3: [17, 4, 'down'], npc_4: [9, 7, 'up'], npc_5: [3, 3, 'up'], npc_6: [16, 12, 'right'],
    door_front: [front.front.x, front.front.y, 'up'], door_back: [back.front.x, back.front.y, 'up'],
    counter: [16, 7, 'up'], kitchen: [19, 3, 'up'],
    table_1: [4, 7, 'up'], table_2: [9, 7, 'up'], table_3: [4, 10, 'up'], table_4: [9, 10, 'up'],
    window_seat: [2, 3, 'up'], jukebox: [21, 11, 'right'],
    from_town_harbor: [front.front.x, front.front.y, 'down'], from_home_theo: [back.front.x, back.front.y, 'down'],
  });
  b.warp(front.door.x, front.door.y, 1, 1, 'town_harbor:from_cafe_lantern', { sfx: 'door_open' });
  b.warp(back.door.x, back.door.y, 1, 1, 'home_theo:from_cafe_lantern', { sfx: 'door_open' });

  // ---- interactables
  b.interact('cafe_counter', 13, 6, 4, 1, 'Counter', { type: 'shop', shop: 'cafe_menu' });
  b.interact('cafe_job', 17, 6, 3, 1, 'Work a shift', { type: 'job', id: 'cafe' });
  b.interact('jukebox', 22, 11, 1, 1, 'Jukebox', { type: 'text', lines: ['An old jukebox with a cracked chrome trim. Aunt Roz only ever lets it play three songs, and one of them is always the same one.', 'The little lantern on top flickers in time with the music.'] });
  b.interact('menu', 7, 1, 3, 1, 'Chalkboard menu', { type: 'text', lines: ['Today: lantern latte, cinnamon toast, soup of the day (ask Roz which day).', 'Underneath, in smaller chalk: "Theo works here, be nice."'] });
  return b.build();
}
