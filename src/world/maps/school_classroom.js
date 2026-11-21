// Class B: blackboard, teacher's desk, 24 desks in a 6 x 4 grid (each chair tile is a seat anchor), windows, lockers.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('school_classroom', { name: 'Class B', ambient: { music: 'school', lighting: 'indoor', weather: false, ambience: null } });
  b.stamp('room', 0, 0, 22, 16, { wall: 'school', floor: 'school' });

  // north wall: windows, blackboard, notice board, door
  for (const x of [2, 3, 4]) b.stamp('window_in', x, 0, { kind: 'school' });
  b.stamp('blackboard', 7, 1, 9);
  b.put('wall_clock', 11, 0);
  b.put('wall_notice', 17, 1);
  b.put('wall_poster', 1, 0);
  b.stamp('door_in', 19, 0, { kind: 'school' });
  b.stamp('tall', 16, 1, 'plant_tall');

  // front of the class: rug, teacher's desk and chair, window seat
  b.stamp('rug', 8, 2, 5, 3, { color: 'red' });
  b.stamp('desk', 9, 3, { w: 3, items: { 0: 'papers', 2: 'bell' } });
  b.stamp('chair', 10, 2, { dir: 'd' });
  b.stamp('chair', 3, 2, { dir: 'd' });
  b.put('plant_pot', 1, 3);
  b.put('plant_pot', 20, 4);
  b.put('desk_m_globe', 1, 5);

  // 24 student desks: 6 columns (pairs) x 4 rows; seat = chair tile south of each desk
  const cols = [4, 5, 9, 10, 14, 15];
  const { seats } = b.stamp('desk_grid', 0, 6, cols, 4);
  const at = (c, r) => seats[r * 6 + c];
  const named = { theo: at(0, 1), nina: at(1, 1), clara: at(0, 0), jules: at(0, 2), dante: at(1, 2), owen: at(5, 3) };
  const used = new Set(Object.values(named).map((s) => `${s.x},${s.y}`));
  const anchors = {};
  for (const [n, s] of Object.entries(named)) anchors[`seat_${n}`] = [s.x, s.y, 'up'];
  let k = 1;
  for (const s of seats) {
    if (used.has(`${s.x},${s.y}`)) continue;
    anchors[`seat_${String(k).padStart(2, '0')}`] = [s.x, s.y, 'up'];
    k++;
  }
  // the 4 desks beyond seat_14 are still real seats: extra anchors
  void anchors;

  // reading corner on the right-hand side
  b.stamp('rug', 17, 7, 4, 3, { color: 'blue' });
  b.stamp('sofa', 17, 8, { w: 3, color: 'blue' });
  b.put('table_tea', 19, 11);
  b.put('plant_pot', 20, 12);
  b.put('desk_m_books', 20, 6);

  // back of the class: bookcase and lockers
  b.stamp('bookcase_row', 1, 13, 2);
  b.stamp('locker_row', 17, 13, 4, { color: 'blue' });
  b.put('plant_pot', 8, 14);

  b.setAnchors({
    entrance: [19, 4, 'down'], center: [12, 4, 'down'],
    spot_a: [2, 7, 'right'], spot_b: [7, 12, 'up'], spot_c: [12, 7, 'left'], spot_d: [17, 11, 'left'],
    npc_1: [8, 4, 'right'], npc_2: [12, 3, 'left'], npc_3: [7, 8, 'left'], npc_4: [12, 10, 'right'], npc_5: [17, 6, 'left'], npc_6: [2, 10, 'right'],
    door: [19, 2, 'up'], teacher_desk: [10, 5, 'up'], board: [11, 2, 'up'], window_seat: [3, 3, 'up'],
    from_school_hall_2f: [19, 3, 'down'],
    ...anchors,
  });
  b.warp(19, 1, 1, 1, 'school_hall_2f:from_school_classroom', { sfx: 'door_open' });

  b.interact('class_board', 17, 1, 1, 1, 'Class notice board', { type: 'text', lines: ['Class B notice board: "Cleaning rota: this week it is the window row." and "Reminder: the Bell Committee needs volunteers."', 'Someone has drawn a tiny bell next to the word "volunteers".'] });
  b.interact('blackboard', 7, 1, 9, 1, 'Blackboard', { type: 'text', lines: ['The blackboard is covered in neat chalk diagrams and one tiny, hopeful doodle of a bell.'] });
  const t = named.theo;
  b.interact('desk_theo', t.x, t.y - 1, 1, 1, "Theo's desk", { type: 'text', lines: ["Your desk. Someone has carved 'Class B forever' into the corner, then thought better of it and added a smiley."] });
  return b.build();
}
