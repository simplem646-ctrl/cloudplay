// Bellhaven Town Hall: lobby (clock, notice board) on the west, mayor's office south-west, the meeting hall with
// rows of chairs and a curtained stage on the east, archive door in the hall's north wall. 22x16.
// The Year-2 archive scene and the Year-3 school board meeting/vote are staged here (npc_1..6 are front-rows seats).
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('town_hall', { name: 'Town Hall', ambient: { music: 'school_class', lighting: 'indoor', weather: false, ambience: null } });
  b.stamp('room', 0, 0, 22, 16, { wall: 'cream', floor: 'wood' });

  const floor = (kind, x, y, w, h) => {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) b.put(`floor_${kind}_${(x + i + y + j) % 5 === 0 ? 'b' : 'a'}`, x + i, y + j, 'ground');
  };
  floor('tile_checker', 1, 2, 8, 7); // lobby
  floor('carpet_red', 1, 10, 8, 5); // mayor's office
  floor('wood_light', 10, 5, 11, 10); // meeting hall
  floor('wood_dark', 13, 2, 7, 3); // stage platform

  // ---- north wall: window, door, frames, big clock, notice board, plant pillar, archive door, stage curtains
  b.stamp('window_in', 1, 0, { kind: 'plain' });
  const door = b.stamp('door_in', 3, 0, { kind: 'wood' });
  b.put('frame_landscape', 4, 1);
  b.put('wall_clock', 5, 1);
  b.put('frame_family', 6, 1);
  b.put('wall_notice', 7, 1); b.put('wall_notice', 8, 1);
  b.stamp('tall', 9, 1, 'plant_tall');
  b.stamp('door_in', 11, 0, { kind: 'white' }); // archive door
  b.stamp('window_in', 12, 0, { kind: 'plain' });
  b.stamp('window_in', 13, 0, { kind: 'curtain' });
  b.put('frame_flower', 15, 1); b.put('frame_family', 16, 1); b.put('frame_landscape', 17, 1);
  b.stamp('window_in', 19, 0, { kind: 'curtain' });
  b.stamp('window_in', 20, 0, { kind: 'plain' });

  // ---- stage: red apron, side plants, a lectern
  b.stamp('rug', 14, 4, 5, 1, { color: 'red' });
  b.put('table_o', 16, 2); // lectern
  b.put('plant_pot', 13, 2); b.put('plant_pot', 19, 2);
  b.put('table_blue_l', 14, 3); b.put('table_blue_r', 15, 3); // speakers' table
  b.put('table_blue_l', 17, 3); b.put('table_blue_r', 18, 3);

  // ---- lobby
  b.stamp('rug', 2, 3, 6, 3, { color: 'red' });
  b.stamp('sofa', 2, 7, { w: 3, color: 'blue' });
  b.stamp('sofa', 6, 7, { w: 3, color: 'blue' });
  b.put('table_tea', 4, 5);
  b.put('plant_pot', 1, 8); b.put('plant_pot', 8, 2);
  b.put('trash_can', 1, 2);

  // ---- partition between lobby/office and hall (open arch above), office door gap at x4
  for (let y = 9; y <= 14; y++) b.put('iwall_cream_cap_r', 9, y);
  for (let x = 1; x <= 8; x++) if (x !== 4) b.put('iwall_cream_cap_s', x, 9);
  b.put('iwall_cream_cap_s', 9, 8);
  b.put('plant_pot', 8, 8);

  // ---- mayor's office
  b.stamp('bookcase_row', 6, 10, 3);
  b.stamp('rug', 2, 11, 5, 4, { color: 'blue' });
  b.stamp('desk', 3, 12, { w: 3, items: { 0: 'papers', 1: 'lamp', 2: 'plant' } });
  b.stamp('chair', 4, 11, { dir: 'd', color: 'red' });
  b.stamp('chair', 3, 13, { dir: 'u' }); b.stamp('chair', 5, 13, { dir: 'u' });
  b.stamp('tall', 1, 10, 'plant_tall');
  b.put('wall_shelf', 2, 9); b.put('plant_pot', 8, 14);

  // ---- meeting hall: four rows of chairs facing the stage, centre aisle at x15
  for (const y of [6, 8, 10, 12]) for (const x of [11, 12, 13, 14, 16, 17, 18, 19]) b.stamp('chair', x, y, { dir: 'u', color: (x + y) % 7 === 0 ? 'red' : 'wood' });
  b.stamp('table', 17, 14, { w: 3, cloth: 'red' }); // refreshments (Mrs. Calder's rolls)
  b.put('plant_pot', 10, 14); b.put('plant_pot', 20, 5); b.put('plant_pot', 10, 5);
  b.stamp('rug', 14, 5, 3, 1, { color: 'red' });

  // ---- anchors
  b.setAnchors({
    entrance: [3, 4, 'down'], center: [15, 9, 'up'],
    spot_a: [4, 6, 'right'], spot_b: [8, 5, 'left'], spot_c: [15, 12, 'up'], spot_d: [6, 12, 'up'],
    npc_1: [12, 6, 'up'], npc_2: [13, 6, 'up'], npc_3: [17, 6, 'up'], npc_4: [18, 6, 'up'], npc_5: [12, 8, 'up'], npc_6: [18, 8, 'up'],
    door: [3, 2, 'up'], lobby: [5, 5, 'down'], stage: [16, 3, 'down'], mayor_desk: [4, 11, 'down'],
    notice_board: [7, 2, 'up'], clock: [5, 2, 'up'], archive_door: [11, 2, 'up'],
    from_town_square: [door.front.x, door.front.y + 1, 'down'],
  });
  b.warp(door.door.x, door.door.y, 1, 1, 'town_square:from_town_hall', { sfx: 'door_open' });

  // ---- interactables
  b.interact('hall_board', 7, 1, 2, 1, 'Town notice board', { type: 'board', id: 'town' });
  b.interact('archive_door', 11, 1, 1, 1, 'Archive door', { type: 'door_locked', text: 'The archive door is locked. A paper sign says: "Renovations. Back soon. (Mostly.)"' });
  b.interact('clock', 5, 1, 1, 1, 'Big clock', { type: 'text', lines: ['The big lobby clock. It ticks one second slower than the clock in the square, and the mayor insists that is "character".'] });
  b.interact('stage', 13, 3, 7, 1, 'Stage', { type: 'text', lines: ['The meeting stage: velvet curtains, a lectern and a slightly wobbly speakers\' table.'] });
  b.interact('mayor_desk', 3, 12, 3, 1, "Mayor's desk", { type: 'text', lines: ['Mayor Greer\'s desk: a mountain of forms, a half-eaten roll and a tiny brass bell labelled "Wonderful".'] });
  return b.build();
}
