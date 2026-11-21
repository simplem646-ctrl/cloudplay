// Library: reading tables with lamps, tall shelves, a window-seat nook (Elise and Clara's place), librarian desk,
// computer corner and a cosy rug. 24x16, one door (top wall) back to the ground-floor hall.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('school_library', { name: 'Library', ambient: { music: 'library', lighting: 'indoor', weather: false, ambience: null } });
  b.stamp('room', 0, 0, 24, 16, { wall: 'wood', floor: 'wood_dark' });

  // ---- north wall: nook window, shelves, clock, windows, notice, door
  b.stamp('window_in', 2, 0, { kind: 'curtain' });
  b.stamp('window_in', 3, 0, { kind: 'curtain' });
  b.stamp('bookcase_row', 6, 1, 4);
  b.put('wall_clock', 10, 0);
  b.stamp('window_in', 11, 0, { kind: 'plain' });
  b.stamp('window_in', 12, 0, { kind: 'plain' });
  b.put('wall_poster', 13, 1);
  b.stamp('bookcase_row', 14, 1, 4);
  b.put('wall_notice', 18, 1);
  b.stamp('door_in', 20, 0, { kind: 'wood' });
  b.stamp('tall', 22, 1, 'plant_tall');
  b.put('frame_landscape', 5, 0);
  b.put('frame_flower', 1, 0);

  // ---- window-seat nook (top-left): rug, two cushioned seats under the curtains, tea table, plant
  b.stamp('rug', 1, 3, 4, 3, { color: 'blue' });
  b.stamp('chair', 2, 2, { dir: 'd', color: 'red' });
  b.stamp('chair', 3, 2, { dir: 'd', color: 'red' });
  b.put('plant_pot', 1, 2);
  b.put('plant_pot', 4, 2);
  b.put('table_tea', 3, 4);

  // ---- librarian desk by the door
  b.stamp('chair', 17, 3, { dir: 'd' });
  b.stamp('desk', 16, 4, { w: 3, items: { 0: 'papers', 2: 'plant' } });
  b.put('desk_m_bell', 17, 4);

  // ---- three reading tables, each with a lamp and chairs both sides
  const tables = [[5, 8], [10, 8], [15, 8]];
  tables.forEach(([x, y], i) => {
    b.stamp('desk', x, y, { w: 3, items: { 0: 'books', 1: 'lamp', 2: i === 1 ? 'papers' : 'books' } });
    for (const cx of [x, x + 2]) { b.stamp('chair', cx, y - 1, { dir: 'd' }); b.stamp('chair', cx, y + 1, { dir: 'u' }); }
    b.stamp('chair', x + 1, y + 1, { dir: 'u', color: 'red' });
  });
  b.stamp('rug', 4, 10, 5, 1, { color: 'cream' });
  b.stamp('rug', 14, 10, 5, 1, { color: 'cream' });

  // ---- stacks across the back
  b.stamp('bookcase_row', 1, 12, 4, { color: 'white' });
  b.stamp('bookcase_row', 7, 12, 5);
  b.stamp('bookcase_row', 14, 12, 3, { color: 'white' });
  b.put('plant_pot', 6, 13);
  b.put('plant_pot', 13, 13);
  b.put('desk_m_globe', 5, 14);

  // ---- computer corner (right wall) and cosy rug with a sofa
  b.stamp('desk', 19, 7, { w: 3, items: { 0: 'papers', 2: 'lamp' } });
  b.put('tv_stand', 19, 6); b.put('tv_stand', 21, 6);
  b.stamp('chair', 19, 8, { dir: 'u' });
  b.stamp('chair', 21, 8, { dir: 'u' });
  b.stamp('rug', 19, 11, 4, 3, { color: 'green' });
  b.stamp('sofa', 19, 12, { w: 3, color: 'green' });
  b.put('plant_pot', 22, 14);
  b.put('table_tea', 21, 11);

  b.setAnchors({
    entrance: [20, 4, 'down'], center: [12, 5, 'down'],
    spot_a: [8, 3, 'down'], spot_b: [4, 8, 'right'], spot_c: [13, 11, 'up'], spot_d: [18, 10, 'left'],
    npc_1: [3, 3, 'up'], npc_2: [2, 3, 'right'], npc_3: [17, 3, 'down'], npc_4: [11, 11, 'up'], npc_5: [20, 9, 'up'], npc_6: [9, 5, 'left'],
    door: [20, 2, 'up'], desk: [17, 5, 'up'], table_1: [6, 9, 'up'], table_2: [11, 9, 'up'], table_3: [16, 9, 'up'], nook: [3, 3, 'up'],
    shelf_a: [7, 3, 'up'], shelf_b: [15, 3, 'up'], shelf_c: [8, 11, 'up'], computer: [20, 9, 'up'],
    from_school_hall_1f: [20, 3, 'down'],
  });
  b.warp(20, 1, 1, 1, 'school_hall_1f:from_school_library', { sfx: 'door_open' });

  b.interact('study_table', 10, 8, 3, 1, 'Study table', { type: 'study', place: 'library' });
  b.interact('shelf_a', 6, 1, 4, 2, 'Bookshelf', { type: 'text', lines: ['Neat rows of paperbacks, local histories and a dog-eared "Birds of the Bellhaven Coast".', 'A slip tucked in one spine reads: "Due back: before the bell rings again."'] });
  b.interact('nook', 2, 2, 2, 1, 'Window seat', { type: 'text', lines: ['A window seat with two faded cushions, worn into the shape of people who stay all afternoon.', 'There is a pencilled note on the sill: "Reserved for readers. Silently."'] });
  b.interact('shelf_c', 7, 12, 5, 2, 'Back stacks', { type: 'text', lines: ['Atlases, old yearbooks and a shelf labelled "Bell Committee, minutes (incomplete)".'] });
  return b.build();
}
