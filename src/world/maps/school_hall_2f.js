// Main Hall 2F: classroom doors A, B (ours) and C, the art and music rooms, the student-council door, lockers,
// tall windows over the grounds, stairs down (W) and up to the roof (E). 36x14.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('school_hall_2f', { name: 'Main Hall 2F', ambient: { music: 'school', lighting: 'indoor', weather: false, ambience: null } });
  b.stamp('room', 0, 0, 36, 14, { wall: 'school', floor: 'school' });

  b.stamp('rug', 3, 6, 30, 3, { color: 'blue' });
  b.stamp('rug', 9, 3, 3, 2, { color: 'cream' });
  b.stamp('rug', 22, 10, 6, 2, { color: 'red' });

  // ---- north wall, west to east
  const down = b.stamp('door_in', 2, 0, { kind: 'stairs' });
  b.put('wall_clock', 4, 0);
  const ca = b.stamp('door_in', 6, 0, { kind: 'school' });
  b.block(ca.door.x, ca.door.y, 1, 1);
  b.put('wall_notice', 8, 1);
  b.stamp('window_in', 9, 0, { kind: 'school' });
  const cb = b.stamp('door_in', 11, 0, { kind: 'school' });
  b.put('wall_poster', 13, 0);
  b.stamp('window_in', 14, 0, { kind: 'school' });
  const cc = b.stamp('door_in', 16, 0, { kind: 'school' });
  b.block(cc.door.x, cc.door.y, 1, 1);
  b.put('wall_calendar', 18, 0);
  b.stamp('window_in', 19, 0, { kind: 'school' });
  b.stamp('window_in', 20, 0, { kind: 'school' });
  const council = b.stamp('door_in', 22, 0, { kind: 'wood' });
  b.block(council.door.x, council.door.y, 1, 1);
  b.put('frame_landscape', 24, 0, 'above');
  const art = b.stamp('door_in', 26, 0, { kind: 'school' });
  b.stamp('window_in', 28, 0, { kind: 'school' });
  const music = b.stamp('door_in', 30, 0, { kind: 'school' });
  const roof = b.stamp('door_in', 33, 0, { kind: 'stairs' });
  b.put('wall_poster', 32, 0); b.put('frame_flower', 34, 1);

  // ---- south wall: big windows over the grounds, lockers between
  b.stamp('locker_row', 1, 11, 5, { color: 'blue' });
  b.stamp('locker_row', 7, 11, 1, { color: 'blue' });
  b.stamp('locker_row', 9, 11, 5, { color: 'blue' });
  b.stamp('locker_row', 15, 11, 5, { color: 'green' });
  b.stamp('locker_row', 29, 11, 5, { color: 'blue' });
  b.put('plant_pot', 20, 12); b.put('plant_pot', 28, 12); b.put('plant_pot', 14, 12); b.put('plant_pot', 8, 12);

  // ---- a bench under the stairwell poster (the tall north windows at x9 and x14 are window_a / window_b)
  b.stamp('bench', 23, 11);
  b.put('wall_poster', 22, 12, 'above'); b.put('wall_notice', 26, 12, 'above');
  b.stamp('chair', 33, 3, { dir: 'd' }); b.stamp('chair', 34, 3, { dir: 'd', color: 'red' });

  // ---- corridor life
  b.put('plant_pot', 1, 3); b.put('plant_pot', 34, 12); b.put('plant_pot', 12, 3); b.put('plant_pot', 21, 3);
  b.stamp('tall', 1, 6, 'plant_tall'); b.stamp('tall', 34, 6, 'plant_tall');
  b.stamp('table', 25, 3, { w: 2, cloth: 'blue' }); b.put('desk_m_plant', 25, 2, 'above');
  b.stamp('chair', 8, 3, { dir: 'd' });
  b.put('table_tea', 31, 4);

  b.setAnchors({
    entrance: [2, 3, 'down'], center: [17, 7, 'down'],
    spot_a: [8, 8, 'right'], spot_b: [27, 8, 'left'], spot_c: [13, 4, 'down'], spot_d: [20, 9, 'up'],
    npc_1: [5, 4, 'down'], npc_2: [14, 7, 'up'], npc_3: [19, 4, 'down'], npc_4: [24, 4, 'left'], npc_5: [30, 8, 'left'], npc_6: [23, 9, 'up'],
    door_class_a: [ca.front.x, ca.front.y, 'up'], door_class_b: [cb.front.x, cb.front.y, 'up'], door_class_c: [cc.front.x, cc.front.y, 'up'],
    door_music: [music.front.x, music.front.y, 'up'], door_art: [art.front.x, art.front.y, 'up'], council_door: [council.front.x, council.front.y, 'up'],
    stairs_down: [down.front.x, down.front.y, 'up'], stairs_roof: [roof.front.x, roof.front.y, 'up'],
    window_a: [9, 2, 'up'], window_b: [14, 2, 'up'], lockers: [12, 10, 'down'],
    from_school_hall_1f: [down.front.x, down.front.y, 'down'], from_school_classroom: [cb.front.x, cb.front.y, 'down'],
    from_school_art_room: [art.front.x, art.front.y, 'down'], from_school_music_room: [music.front.x, music.front.y, 'down'],
    from_school_rooftop: [roof.front.x, roof.front.y, 'down'],
  });

  const door = (s, to) => b.warp(s.door.x, s.door.y, 1, 1, `${to}:from_school_hall_2f`, { sfx: 'door_open' });
  door(down, 'school_hall_1f'); door(cb, 'school_classroom'); door(art, 'school_art_room'); door(music, 'school_music_room'); door(roof, 'school_rooftop');

  const locked = (n, s, label, text) => b.interact(n, s.door.x, 0, 1, 2, label, { type: 'door_locked', text });
  locked('door_class_a', ca, 'Class A', 'Class A is locked. Through the glass: neat rows of desks and a sleeping fern.');
  locked('door_class_c', cc, 'Class C', 'Class C is locked. A sign says "Chemistry in progress: please do not knock."');
  locked('council_door', council, 'Student council', 'The student council room is locked. A schedule on the door says "Meetings: whenever Clara says so."');
  return b.build();
}
