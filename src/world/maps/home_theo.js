// Theo's Room: bedroom + kitchen nook above the Lantern Cafe. 20x14 = exactly one screen.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('home_theo', { name: "Theo's Room", ambient: { music: 'home_morning', lighting: 'indoor', weather: false, ambience: null } });
  b.stamp('room', 0, 0, 20, 14, { wall: 'cream', floor: 'wood' });

  // windows (harbor view) and the stairs door down to the cafe
  b.stamp('window_in', 3, 0, { kind: 'harbor' });
  b.stamp('window_in', 16, 0, { kind: 'harbor' });
  b.stamp('window_in', 14, 0, { kind: 'curtain' });
  b.stamp('door_in', 17, 0, { kind: 'stairs' });

  // wall decoration (overlays on `above`)
  b.put('frame_family', 10, 1);
  b.put('wall_calendar', 7, 1);
  b.put('wall_clock', 13, 1);
  b.put('frame_landscape', 5, 1);
  b.put('wall_shelf', 12, 1);
  b.put('frame_flower', 1, 0);

  // bedroom corner: wardrobe, bed, desk with diary, bookshelf
  b.stamp('tall', 1, 1, 'wardrobe');
  b.stamp('bed', 2, 2, { color: 'blue' });
  b.stamp('desk', 4, 2, { w: 3, items: { 0: 'lamp', 1: 'diary', 2: 'books' } });
  b.stamp('chair', 5, 3, { dir: 'u' });
  b.stamp('bookcase_row', 8, 1, 2);
  // reading rug with a tea table
  b.stamp('rug', 2, 6, 5, 3, { color: 'blue' });
  b.put('table_tea', 4, 7);
  b.stamp('chair', 3, 7, { dir: 'r' });
  b.stamp('chair', 5, 7, { dir: 'l' });
  b.put('plant_pot', 1, 12);
  b.stamp('chair', 1, 9, { dir: 'r', color: 'red' });

  // living / kitchen nook
  b.put('tv_stand', 10, 2);
  b.stamp('rug', 8, 4, 5, 3, { color: 'green' });
  b.stamp('sofa', 9, 4, { w: 3, color: 'red' });
  b.stamp('tall', 11, 1, 'fridge');
  b.put('stove', 12, 2);
  b.put('sink', 13, 2);
  b.put('counter_wood_m', 14, 2);
  b.put('counter_wood_r', 15, 2);
  b.stamp('table', 14, 7, { w: 2, cloth: 'red' });
  b.stamp('chair', 13, 7, { dir: 'r' });
  b.stamp('chair', 16, 7, { dir: 'l' });
  b.stamp('chair', 14, 6, { dir: 'd' });
  b.stamp('chair', 15, 8, { dir: 'u' });
  b.stamp('tall', 18, 1, 'plant_tall');
  b.put('plant_pot', 18, 12);
  b.stamp('rug', 14, 10, 4, 2, { color: 'cream' });

  // anchors
  b.setAnchors({
    entrance: [16, 4, 'down'], center: [9, 9, 'down'],
    spot_a: [4, 10, 'up'], spot_b: [8, 10, 'up'], spot_c: [12, 10, 'up'], spot_d: [16, 5, 'left'],
    npc_1: [7, 3, 'left'], npc_2: [12, 4, 'down'], npc_3: [16, 3, 'left'], npc_4: [11, 8, 'right'], npc_5: [3, 5, 'right'], npc_6: [17, 10, 'up'],
    bed: [3, 3, 'left'], desk: [6, 3, 'up'], kitchen_table: [14, 8, 'up'], door_stairs: [17, 2, 'up'], window: [3, 2, 'up'], shelf: [8, 3, 'up'],
    from_cafe_lantern: [17, 3, 'down'],
  });
  b.warp(17, 1, 1, 1, 'cafe_lantern:from_home_theo', { sfx: 'door_open' });

  // interactables
  b.interact('bed', 2, 2, 1, 2, 'Bed', { type: 'sleep' });
  b.interact('desk', 6, 2, 1, 1, 'Desk', { type: 'study', place: 'home' });
  b.interact('diary', 5, 2, 1, 1, 'Diary', { type: 'save' });
  b.interact('calendar', 7, 1, 1, 1, 'Calendar', { type: 'calendar' });
  b.interact('shelf', 8, 2, 2, 1, 'Bookshelf', { type: 'text', lines: ['Mostly Aunt Roz\'s cookbooks, a few paperbacks and one very dusty atlas.', 'Somebody has dog-eared a page about lighthouses.'] });
  b.interact('kitchen', 12, 2, 4, 1, 'Kitchen', { type: 'text', lines: ['The kettle is still warm. Aunt Roz is always one step ahead of the morning.', 'Smells like toast and coffee drifting up from the cafe below.'] });
  return b.build();
}
