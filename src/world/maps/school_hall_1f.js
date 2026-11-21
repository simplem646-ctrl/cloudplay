// Main Hall 1F: shoe lockers by the front door (S), a long corridor, library and cafeteria doors, trophy case,
// notice board, vending machine, staff room, the nurse's corner (E) and the stairs up (W). 36x14.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('school_hall_1f', { name: 'Main Hall 1F', ambient: { music: 'school', lighting: 'indoor', weather: false, ambience: null } });
  b.stamp('room', 0, 0, 36, 14, { wall: 'school', floor: 'school' });

  // ---- corridor floor: checker runner and rugs
  b.stamp('rug', 4, 6, 24, 3, { color: 'red' });
  b.stamp('rug', 15, 10, 6, 3, { color: 'blue' });         // welcome mat inside the front door
  b.stamp('rug', 29, 3, 5, 5, { color: 'green' });         // nurse corner mat

  // ---- north wall, west to east
  const stairs = b.stamp('door_in', 2, 0, { kind: 'stairs' });
  b.put('wall_clock', 4, 0);
  b.stamp('window_in', 5, 0, { kind: 'school' });
  // trophy case (glass-fronted cases, cups on the shelf above)
  b.stamp('bookcase_row', 7, 1, 3, { color: 'white' });
  b.put('wall_shelf', 7, 0); b.put('wall_shelf', 8, 0); b.put('wall_shelf', 9, 0);
  b.stamp('window_in', 11, 0, { kind: 'school' });
  // notice board
  b.put('wall_notice', 13, 1); b.put('wall_notice', 14, 1); b.put('wall_poster', 15, 0); b.put('wall_calendar', 16, 0);
  const lib = b.stamp('door_in', 18, 0, { kind: 'school' });
  b.stamp('window_in', 20, 0, { kind: 'school' });
  b.stamp('tall', 21, 1, 'plant_tall');
  const caf = b.stamp('door_in', 23, 0, { kind: 'school' });
  b.stamp('window_in', 25, 0, { kind: 'school' });
  b.stamp('vending', 26, 2, { color: 'red' });
  b.stamp('window_in', 27, 0, { kind: 'school' });
  const staff = b.stamp('door_in', 28, 0, { kind: 'wood' });
  b.block(staff.door.x, staff.door.y, 1, 1);
  b.put('wall_poster', 30, 0);

  // ---- nurse's corner: bed, desk, curtain-white screen of plants, cabinet
  b.stamp('bed', 33, 2, { color: 'white' });
  b.stamp('bed', 32, 2, { color: 'white' });
  b.stamp('tall', 31, 1, 'fridge');
  b.put('frame_flower', 34, 1);
  b.stamp('desk', 30, 5, { w: 2, items: { 0: 'papers', 1: 'lamp' } });
  b.stamp('chair', 30, 6, { dir: 'u', color: 'red' });
  b.put('plant_pot', 34, 5);
  b.put('table_tea', 33, 5);
  b.stamp('rug', 32, 6, 3, 2, { color: 'cream' });

  // ---- shoe lockers flanking the front door (door at x17-18, y13)
  b.stamp('locker_row', 8, 11, 6, { color: 'blue' });
  b.stamp('locker_row', 22, 11, 6, { color: 'blue' });
  b.put('plant_pot', 14, 12); b.put('plant_pot', 21, 12);
  b.stamp('chair', 7, 12, { dir: 'u' }); b.stamp('chair', 28, 12, { dir: 'u' });
  b.put('idoor_school_lo', 17, 13); b.put('idoor_school_lo', 18, 13);

  // ---- corridor life: benches, potted plants, lost and found, an umbrella table
  b.stamp('chair', 6, 4, { dir: 'd' }); b.stamp('chair', 7, 4, { dir: 'd', color: 'red' });
  b.put('plant_pot', 1, 3); b.put('plant_pot', 1, 12); b.put('plant_pot', 34, 12); b.put('plant_pot', 12, 3);
  b.put('plant_pot', 17, 3); b.put('plant_pot', 22, 3);
  b.stamp('table', 2, 10, { w: 3, cloth: 'white' });
  b.put('desk_m_books', 2, 9); b.put('plant_pot', 5, 10);
  b.stamp('tall', 1, 6, 'plant_tall');
  b.put('frame_landscape', 10, 0, 'above'); b.put('frame_family', 24, 0, 'above');

  b.setAnchors({
    entrance: [17, 12, 'up'], center: [17, 7, 'up'], door_front: [17, 12, 'down'],
    spot_a: [8, 7, 'right'], spot_b: [26, 7, 'left'], spot_c: [12, 9, 'up'], spot_d: [22, 9, 'up'],
    npc_1: [8, 4, 'up'], npc_2: [14, 4, 'up'], npc_3: [25, 4, 'right'], npc_4: [30, 9, 'left'], npc_5: [4, 8, 'right'], npc_6: [20, 10, 'up'],
    shoe_lockers: [15, 10, 'down'], door_library: [lib.front.x, lib.front.y, 'up'], door_cafeteria: [caf.front.x, caf.front.y, 'up'],
    door_staff: [staff.front.x, staff.front.y, 'up'], stairs_up: [stairs.front.x, stairs.front.y, 'up'],
    trophy_case: [8, 3, 'up'], board: [14, 3, 'up'], vending: [26, 3, 'up'], nurse_desk: [31, 6, 'left'], nurse_bed: [32, 4, 'up'],
    from_school_grounds: [17, 12, 'up'], from_school_library: [lib.front.x, lib.front.y, 'down'],
    from_school_cafeteria: [caf.front.x, caf.front.y, 'down'], from_school_hall_2f: [stairs.front.x, stairs.front.y, 'down'],
  });

  b.warp(17, 13, 2, 1, 'school_grounds:from_school_hall_1f', { sfx: 'door_open' });
  b.warp(lib.door.x, lib.door.y, 1, 1, 'school_library:from_school_hall_1f', { sfx: 'door_open' });
  b.warp(caf.door.x, caf.door.y, 1, 1, 'school_cafeteria:from_school_hall_1f', { sfx: 'door_open' });
  b.warp(stairs.door.x, stairs.door.y, 1, 1, 'school_hall_2f:from_school_hall_1f', { sfx: 'door_open' });

  b.interact('board', 13, 1, 2, 1, 'School notice board', { type: 'board', id: 'school' });
  b.interact('trophy_case', 7, 1, 3, 2, 'Trophy case', { type: 'text', lines: ['The trophy case: a glass cup from the 1994 harbor regatta, three soccer pennants and a tiny, tarnished bell-shaped medal.', 'The brass plate under the medal reads "Bell Night Relay, last held 30 years ago."'] });
  b.interact('vending', 26, 1, 1, 2, 'Vending machine', { type: 'shop', shop: 'vending_school' });
  b.interact('door_staff', 28, 0, 1, 2, 'Staff room', { type: 'door_locked', text: 'The staff room. You can hear a kettle and a very tired sigh. Students are not allowed in.' });
  b.interact('nurse_bed', 32, 2, 2, 2, "Nurse's bed", { type: 'rest' });
  return b.build();
}
