// NPC schedules for the whole cast, GENERATED from compact personas (S4c). Default export = array of Schedule
// ({ npc, routines:[{ id, when?, priority?, points:[['HH:MM', 'map:anchor' | null, { dir?, activity? }?]] }] }).
// Only tier-1 maps are used (home_theo, town_square, town_harbor, town_park, cafe_lantern, bakery, town_hall, school_grounds, school_field,
// school_hall_1f/2f, school_library, school_classroom, school_rooftop); anything that would happen in an unbuilt map (flower shop, bookstore,
// clinic, observatory, art/music room, gym, beach) is `null` = off-screen. Priorities: free day 1, school day 10, exam day 20, festival window 30.
import { TIMETABLE, TEACHER } from '../../data/timetable.js';
import { FESTIVALS } from '../../data/calendar.js';
import { all, any } from '../../sim/script_dsl.js';

const WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WET = { weather: ['rain', 'storm', 'snow'] };
const DRY = { weather: ['sunny', 'cloudy'] };
const weather = (wet) => (wet ? WET : DRY);
const EXAM = any(all({ season: 'spring' }, { day: [22, 24] }), all({ season: 'summer' }, { day: [8, 10] }), all({ season: 'autumn' }, { day: [22, 24] }), all({ season: 'winter' }, { day: [8, 10] }));
const PERIOD_START = ['08:30', '09:30', '10:30', '11:30', '13:10', '14:10'];
const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const fromMin = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
const shift = (s, d) => fromMin(toMin(s) + d);

// Persistent personal anchors for people without a hand-picked spot: the i-th character gets the i-th anchor of a map (mod its length).
const ANCHORS = {
  school_grounds: ['gate', 'courtyard', 'fountain', 'bench_1', 'bench_2', 'bench_3', 'tree_shade', 'bike_rack', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d', 'stall_a', 'stall_b', 'stall_c', 'stall_d', 'stage', 'center'],
  school_field: ['bleacher_low', 'bleacher_top', 'track_start', 'relay_start', 'goal_a', 'goal_b', 'water_fountain', 'shed', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d', 'center'],
  school_hall_1f: ['shoe_lockers', 'trophy_case', 'board', 'vending', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d'],
  school_hall_2f: ['lockers', 'window_a', 'window_b', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d'],
  school_rooftop: ['bench', 'vending', 'fence_a', 'fence_b', 'garden', 'water_tank', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d'],
  town_square: ['fountain', 'bench_1', 'bench_2', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d', 'center'],
  town_harbor: ['dock_bench', 'dock_end', 'fish_stall', 'lighthouse_view', 'lantern_row', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d'],
  town_park: ['bench_1', 'bench_2', 'bench_3', 'picnic_a', 'picnic_b', 'picnic_c', 'bandstand', 'pond_edge', 'bridge', 'cherry_tree', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d'],
};
// Generic pools for extras and wanderers: anchors no named character stands on, so two people never share a spot.
const POOL = {
  school_grounds: ['spot_a', 'spot_b', 'spot_c', 'spot_d', 'stall_a', 'stall_b', 'stall_c', 'stall_d', 'stage', 'center'],
  school_field: ['spot_a', 'spot_b', 'spot_c', 'spot_d', 'water_fountain'],
  school_hall_1f: ['spot_a', 'spot_b', 'spot_c', 'spot_d', 'shoe_lockers', 'trophy_case', 'board'],
  school_hall_2f: ['spot_a', 'spot_b', 'spot_c', 'spot_d'],
  town_square: ['spot_a', 'spot_b', 'spot_c', 'spot_d', 'center'],
  town_harbor: ['spot_a', 'spot_b', 'spot_c', 'spot_d', 'fish_stall'],
  town_park: ['spot_a', 'spot_b', 'spot_c', 'spot_d', 'picnic_c', 'bandstand', 'pond_edge', 'bridge', 'cherry_tree'],
  cafe_lantern: ['spot_a', 'spot_b', 'spot_c', 'spot_d', 'jukebox'],
  town_hall: ['spot_a', 'spot_b', 'spot_c', 'spot_d', 'notice_board', 'clock'],
};
const ORDER = ['nina', 'elise', 'clara', 'mari', 'vera', 'jules', 'dante', 'owen', 'bruno', 'kit', 'ms_delaney', 'mr_brandt', 'dr_fennel', 'coach_mitchell', 'mr_abel', 'mr_quill', 'principal_marsh', 'nurse_hale',
  'roz', 'mr_finch', 'mrs_calder', 'rosa', 'mr_larkin', 'tomas', 'dr_patel', 'mayor_greer', 'm_voss', 'biscuit',
  ...Array.from({ length: 14 }, (_, i) => `student_${String(i + 1).padStart(2, '0')}`), ...Array.from({ length: 8 }, (_, i) => `townie_${String(i + 1).padStart(2, '0')}`)];
const spot = (map, id, off = 0) => `${map}:${POOL[map][(ORDER.indexOf(id) + off) % POOL[map].length]}`;

/** Point list builder that drops consecutive duplicates and keeps times ascending. */
function line() {
  const pts = []; const keys = [];
  const at = (t, loc, o) => {
    const k = JSON.stringify([loc || null, o || null]);
    if (keys.length && keys[keys.length - 1] === k) return;
    if (pts.length && toMin(t) <= toMin(pts[pts.length - 1][0])) t = fromMin(toMin(pts[pts.length - 1][0]) + 1);
    pts.push(o ? [t, loc || null, o] : [t, loc || null]); keys.push(k);
  };
  return { at, pts };
}

// ---------------------------------------------------------------------------------------------- students
/**
 * cfg: { cls:'B'|'other', seat, arrive, pe (field spot, dry PE), lunch:[dry, wet], after:[dry, wet], evening:[[t, loc]...] (dry), eveningWet, dawn:[[t, loc]], skip(wd, n) -> loc|null,
 *        free:{ sat, satWet, sun, sunWet } (point lists), year: cond }
 */
function studentRoutines(npc, c) {
  const out = [];
  const extra = c.year ? [c.year] : [];
  const mk = (id, priority, ...conds) => ({ id, priority, when: all(...conds, ...extra) });
  WD.forEach((d, wd) => {
    for (const wet of [false, true]) {
      const L = line();
      for (const p of c.dawn || []) L.at(...p);
      L.at('07:45', c.arrive);
      L.at('08:15', c.cls === 'B' ? `school_classroom:${c.seat}` : null);
      TIMETABLE[wd].forEach((subject, i) => {
        const n = i + 1;
        let loc = null;
        if (c.cls === 'B') loc = subject === 'pe' && !wet ? c.pe : `school_classroom:${c.seat}`;
        else if (c.skip) loc = c.skip(wd, n);
        const t = n === 1 ? '08:20' : n === 5 ? '13:05' : shift(PERIOD_START[i], -5);
        if (n === 5) L.at('12:15', c.lunch[wet ? 1 : 0]);
        L.at(t, loc);
      });
      L.at('15:05', c.after[wet ? 1 : 0]);
      for (const e of (wet && c.eveningWet) || c.evening || []) L.at(...e);
      out.push({ ...mk(`school_${d.toLowerCase()}_${wet ? 'wet' : 'dry'}`, 10, { schoolDay: true }, { weekday: d }, weather(wet)), points: L.pts });
    }
  });
  // exam days (any weekday): Class B sits in the classroom until the sittings are over, everyone else is in their own room
  const E = line();
  E.at('07:45', c.arrive); E.at('08:15', c.cls === 'B' ? `school_classroom:${c.seat}` : null);
  E.at('12:10', c.lunch[0]); E.at('13:20', c.exam ?? null);
  out.push({ ...mk('exam_day', 20, { schoolDay: true }, EXAM), points: E.pts });
  // free days: Saturday (and breaks / cancelled days), Sunday
  for (const wet of [false, true]) {
    if ((wet ? c.free.satWet : c.free.sat) && (wet ? c.free.satWet : c.free.sat).length) out.push({ ...mk(`free_${wet ? 'wet' : 'dry'}`, 1, { schoolDay: false }, { not: { weekday: 'Sun' } }, weather(wet)), points: wet ? c.free.satWet : c.free.sat });
    if ((wet ? c.free.sunWet : c.free.sun) && (wet ? c.free.sunWet : c.free.sun).length) out.push({ ...mk(`sunday_${wet ? 'wet' : 'dry'}`, 2, { schoolDay: false }, { weekday: 'Sun' }, weather(wet)), points: wet ? c.free.sunWet : c.free.sun });
  }
  return out;
}

const CAFE = (n) => `cafe_lantern:table_${n}`;
const STUDENTS = {
  nina: { cls: 'B', seat: 'seat_nina', arrive: 'school_grounds:courtyard', pe: 'school_field:track_start', lunch: ['school_grounds:bench_1', 'school_hall_2f:window_a'],
    after: ['school_field:track_finish', 'school_hall_1f:npc_1'], evening: [['17:45', 'bakery:table_1'], ['19:30', null]], exam: 'bakery:table_1',
    dawn: [['06:00', 'bakery:table_1'], ['06:25', 'town_harbor:lantern_row'], ['06:50', 'town_square:fountain'], ['07:15', 'bakery:table_1']],
    free: { sat: [['06:00', 'bakery:table_1'], ['06:25', 'town_harbor:lantern_row'], ['06:55', 'town_square:fountain'], ['08:30', 'school_field:track_start'], ['11:30', 'bakery:table_1'], ['16:00', 'town_park:picnic_a'], ['18:30', null]],
      satWet: [['06:00', 'bakery:table_1'], ['07:30', 'bakery:table_1'], ['13:00', CAFE(1)], ['16:00', null]],
      sun: [['06:30', 'bakery:table_1'], ['08:30', 'bakery:table_1'], ['13:00', 'town_park:picnic_b'], ['16:30', null]], sunWet: [['08:00', 'bakery:table_1'], ['14:00', null]] } },
  clara: { cls: 'B', seat: 'seat_clara', arrive: 'school_hall_2f:lockers', pe: 'school_field:bleacher_top', lunch: ['school_library:table_1', 'school_library:table_1'],
    after: ['school_library:table_3', 'school_library:table_3'], evening: [['18:00', null]], exam: 'school_library:table_1',
    free: { sat: [['09:30', 'town_square:bench_1'], ['12:00', null], ['14:00', 'town_park:bench_3'], ['17:00', null]], satWet: [['10:00', 'cafe_lantern:window_seat'], ['13:00', null]],
      sun: [['15:00', 'town_harbor:npc_5'], ['17:30', null]], sunWet: [] } },
  jules: { cls: 'B', seat: 'seat_jules', arrive: 'school_grounds:fountain', pe: 'school_field:goal_a', lunch: ['school_grounds:bench_2', 'school_hall_1f:vending'],
    after: ['school_field:goal_a', 'school_hall_1f:npc_2'], evening: [['18:00', 'town_square:bench_1'], ['19:45', null]], exam: 'town_square:bench_1',
    free: { sat: [['10:00', 'school_field:goal_a'], ['13:00', 'town_square:bench_2'], ['17:00', CAFE(2)], ['19:30', null]], satWet: [['11:00', CAFE(2)], ['16:00', null]],
      sun: [['12:00', CAFE(2)], ['15:00', 'town_square:fountain'], ['18:00', null]], sunWet: [['12:00', CAFE(2)], ['16:00', null]] } },
  dante: { cls: 'B', seat: 'seat_dante', arrive: 'school_grounds:bike_rack', pe: 'school_field:goal_b', lunch: ['school_grounds:bench_3', 'school_hall_2f:npc_2'],
    after: ['school_field:goal_b', 'school_hall_1f:npc_3'], evening: [['18:15', 'town_harbor:npc_1'], ['19:45', null]], exam: 'town_harbor:npc_1',
    free: { sat: [['09:00', 'school_field:bleacher_low'], ['12:00', 'town_square:npc_1'], ['16:00', 'town_harbor:npc_2'], ['19:00', null]], satWet: [['13:00', CAFE(3)], ['17:00', null]],
      sun: [['11:00', 'town_square:npc_5'], ['15:00', 'town_harbor:npc_3'], ['18:00', null]], sunWet: [] } },
  owen: { cls: 'B', seat: 'seat_owen', arrive: 'school_grounds:tree_shade', pe: 'school_field:shed', lunch: ['school_rooftop:water_tank', 'school_hall_2f:lockers'],
    after: ['school_rooftop:garden', 'school_library:computer'], evening: [['17:45', null]], exam: 'school_rooftop:water_tank',
    free: { sat: [['11:00', 'town_square:npc_2'], ['15:00', 'town_harbor:lighthouse_view'], ['18:00', null]], satWet: [['14:00', 'school_library:computer'], ['17:00', null]],
      sun: [['14:00', 'town_harbor:lighthouse_view'], ['17:00', null]], sunWet: [] } },
  kit: { cls: 'B', seat: 'seat_13', year: { year: [2, 3] }, arrive: 'school_grounds:bench_1', pe: 'school_field:relay_start', lunch: ['school_grounds:stage', 'school_hall_1f:board'],
    after: ['school_field:track_start', 'school_hall_1f:npc_4'], evening: [['18:00', 'town_square:npc_3'], ['19:30', null]], exam: null,
    free: { sat: [['09:00', 'school_field:track_start'], ['12:30', 'town_square:fountain'], ['17:00', null]], satWet: [['14:00', CAFE(4)], ['16:30', null]], sun: [['13:00', 'town_park:picnic_a'], ['17:00', null]], sunWet: [] } },
  elise: { cls: 'other', arrive: 'school_library:nook', lunch: ['school_library:nook', 'school_library:nook'], after: ['school_library:table_2', 'school_library:table_2'], evening: [['17:45', null]], exam: 'school_library:nook',
    free: { sat: [['10:00', 'town_square:npc_4'], ['12:30', null]], satWet: [['11:00', CAFE(1)], ['13:00', null]], sun: [['14:00', 'town_park:bench_2'], ['17:00', null]], sunWet: [['14:00', CAFE(1)], ['16:00', null]] } },
  mari: { cls: 'other', arrive: 'school_grounds:bench_2', lunch: ['school_grounds:tree_shade', 'school_hall_2f:npc_1'], after: ['school_grounds:bench_2', null], evening: [['16:45', 'town_square:npc_6'], ['18:30', null]], exam: 'town_square:npc_6',
    free: { sat: [['10:00', 'town_park:picnic_c'], ['14:00', 'town_square:bench_1'], ['17:00', null]], satWet: [['13:00', 'cafe_lantern:npc_1'], ['16:00', null]],
      sun: [['14:00', 'town_harbor:dock_bench'], ['17:00', null]], sunWet: [] } },
  vera: { cls: 'other', arrive: 'school_rooftop:bench', lunch: ['school_rooftop:bench', 'school_rooftop:bench'], after: [null, null], evening: [], exam: 'school_rooftop:bench',
    skip: (wd, n) => ((wd === 0 || wd === 4) && n <= 2 ? 'school_rooftop:bench' : null),
    free: { sat: [['11:00', 'town_square:npc_6'], ['15:00', 'town_harbor:dock_end'], ['18:00', null]], satWet: [], sun: [['16:00', 'town_harbor:dock_end'], ['18:00', null]], sunWet: [] } },
  bruno: { cls: 'other', year: { year: 1 }, arrive: 'school_grounds:bench_3', lunch: ['school_field:bleacher_top', 'school_hall_1f:npc_5'], after: ['school_field:center', 'school_hall_1f:npc_5'], evening: [['18:00', 'town_harbor:npc_4'], ['19:30', null]], exam: null,
    free: { sat: [['09:30', 'school_field:center'], ['13:00', 'town_square:fountain'], ['17:00', null]], satWet: [['14:00', 'cafe_lantern:npc_2'], ['17:00', null]], sun: [['12:00', 'town_harbor:npc_6'], ['16:00', null]], sunWet: [] } },
};

// ---------------------------------------------------------------------------------------------- extras
const STUDENT_EXTRAS = Array.from({ length: 14 }, (_, i) => {
  const id = `student_${String(i + 1).padStart(2, '0')}`;
  const inB = i < 12;
  const peAt = i < 4 ? spot('school_field', id) : null;
  return [id, {
    cls: inB ? 'B' : 'other', seat: `seat_${String(i + 1).padStart(2, '0')}`, arrive: i < 10 ? spot('school_grounds', id) : null, pe: peAt,
    lunch: [i < 8 ? spot('school_grounds', id, 3) : null, i < 4 ? spot('school_hall_2f', id) : null], after: [i % 3 === 0 ? spot('school_grounds', id, 6) : null, i % 4 === 0 ? spot('school_hall_1f', id) : null],
    evening: [], free: { sat: i % 3 === 1 ? [['11:00', spot('town_square', id)], ['15:00', null]] : [], satWet: [], sun: [], sunWet: [] },
  }];
});
const wanderer = (id, k) => ({
  npc: id,
  routines: [
    { id: 'day_dry', priority: 5, when: DRY, points: k % 2 ? [['07:00', spot('town_square', id)], ['11:00', spot('town_harbor', id)], ['14:30', spot('town_park', id)], ['18:00', spot('town_square', id, 2)], ['20:00', null]] : [['07:00', spot('town_harbor', id)], ['11:00', spot('town_park', id)], ['14:30', spot('town_square', id)], ['18:00', spot('town_harbor', id, 2)], ['20:00', null]] },
    { id: 'day_wet', priority: 6, when: WET, points: k % 2 ? [['09:00', spot('cafe_lantern', id)], ['17:00', null]] : [['11:00', spot('town_hall', id)], ['15:00', null]] },
  ],
});

// ---------------------------------------------------------------------------------------------- teachers & townsfolk
/** Teacher day from the timetable: at the room `5 min` before each of their periods, off-screen otherwise. */
function teacherRoutines(npc, { homeroom = false, room = 'school_classroom:teacher_desk', peRoom = null, after = null, afterWet = null }) {
  const out = [];
  WD.forEach((d, wd) => {
    for (const wet of [false, true]) {
      const L = line();
      if (homeroom) L.at('08:10', 'school_classroom:teacher_desk');
      const teachesFirst = TEACHER[TIMETABLE[wd][0]] === npc;
      if (homeroom && !teachesFirst) L.at('08:25', null);
      TIMETABLE[wd].forEach((subject, i) => {
        if (TEACHER[subject] !== npc) return;
        const r = subject === 'pe' && peRoom && !wet ? peRoom : room;
        L.at(shift(PERIOD_START[i], -5), r);
        L.at(shift(PERIOD_START[i], 50), null);
      });
      if (homeroom) { /* leaves after homeroom unless teaching period 1 (handled above) */ }
      const club = wet ? afterWet : after;
      if (club) { L.at('15:20', club[0]); L.at(club[1], null); }
      if (L.pts.length) out.push({ id: `school_${d.toLowerCase()}_${wet ? 'wet' : 'dry'}`, priority: 10, when: all({ schoolDay: true }, { weekday: d }, weather(wet)), points: L.pts });
    }
  });
  return out;
}
const examProctor = (npc) => ({ id: 'exam_day', priority: 20, when: all({ schoolDay: true }, EXAM), points: [['08:20', npc === 'ms_delaney' ? 'school_classroom:teacher_desk' : null], ['12:10', null]] });

const TEACHERS = {
  ms_delaney: { homeroom: true, after: ['school_library:table_1', '17:00'], afterWet: ['school_library:table_1', '17:00'], exam: true },
  mr_brandt: {}, mr_abel: {}, mr_quill: {}, dr_fennel: {},
  coach_mitchell: { room: 'school_classroom:teacher_desk', peRoom: 'school_field:bleacher_low', after: ['school_field:bleacher_low', '17:30'], afterWet: ['school_hall_1f:npc_6', '16:30'] },
};

const alwaysAt = (id, loc, from, to, when, priority = 10) => ({ id, priority, when, points: [[from, loc], [to, null]] });
const simple = {
  principal_marsh: [
    { id: 'school_day', priority: 10, when: { schoolDay: true }, points: [['07:50', 'school_grounds:gate'], ['08:20', null], ['12:30', 'school_hall_1f:npc_4'], ['12:50', null], ['15:10', 'school_grounds:fountain'], ['15:45', null]] },
  ],
  nurse_hale: [alwaysAt('school_day', 'school_hall_1f:nurse_desk', '08:00', '16:00', { schoolDay: true })],
  roz: [
    { id: 'every_day', priority: 5, points: [['06:00', 'cafe_lantern:counter'], ['11:30', 'cafe_lantern:kitchen'], ['13:00', 'cafe_lantern:counter'], ['20:00', 'home_theo:kitchen_table'], ['22:30', null]] },
  ],
  mr_finch: [
    { id: 'dry', priority: 5, when: DRY, points: [['08:30', 'town_harbor:finch_spot'], ['17:30', 'town_harbor:dock_bench'], ['19:30', null]] },
    { id: 'wet', priority: 6, when: WET, points: [['10:00', 'cafe_lantern:window_seat'], ['16:00', null]] },
  ],
  mrs_calder: [{ id: 'every_day', priority: 5, points: [['05:30', 'bakery:oven'], ['07:30', 'bakery:counter'], ['18:30', null]] }],
  rosa: [
    { id: 'dry', priority: 5, when: DRY, points: [['15:00', 'town_park:bench_1'], ['16:30', null]] },
  ],
  mr_larkin: [],
  tomas: [{ id: 'weekend', priority: 5, when: { schoolDay: false }, points: [['14:00', 'town_hall:npc_1'], ['16:00', null]] }],
  dr_patel: [],
  mayor_greer: [
    { id: 'weekday', priority: 5, when: { not: { weekday: ['Sat', 'Sun'] } }, points: [['09:00', 'town_hall:mayor_desk'], ['12:15', 'town_square:fountain'], ['12:50', 'town_hall:mayor_desk'], ['17:00', null]] },
    { id: 'saturday', priority: 6, when: { weekday: 'Sat' }, points: [['11:00', 'town_square:fountain'], ['13:00', null]] },
  ],
  m_voss: [{ id: 'weekday', priority: 5, when: { not: { weekday: ['Sat', 'Sun'] } }, points: [['10:00', 'town_hall:lobby'], ['16:00', null]] }],
  biscuit: [
    { id: 'school_dry', priority: 10, when: all({ schoolDay: true }, DRY), points: [['07:00', 'school_rooftop:cat_spot'], ['15:30', 'town_park:cat_spot'], ['18:00', null]] },
    { id: 'free_dry', priority: 5, when: DRY, points: [['08:30', 'town_park:cat_spot'], ['17:30', 'school_rooftop:cat_spot'], ['19:00', null]] },
    { id: 'wet', priority: 11, when: WET, points: [['08:00', 'school_hall_2f:npc_6'], ['16:00', null]] },
  ],
};

// ---------------------------------------------------------------------------------------------- festivals
/** A festival that happens in an unbuilt map is staged on the nearest built one (same choice the story events make). */
const FEST_MAP = { beach: 'town_harbor', hill_observatory: 'school_rooftop', school_gym: 'school_grounds', observatory_dome: 'school_rooftop' };
const FEST_POOL = {
  school_grounds: ['courtyard', 'fountain', 'stage', 'center', 'stall_a', 'stall_b', 'stall_c', 'stall_d', 'bench_1', 'bench_2', 'bench_3', 'tree_shade', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d', 'gate', 'bike_rack'],
  town_park: ['bandstand', 'bridge', 'pond_edge', 'cherry_tree', 'picnic_a', 'picnic_b', 'picnic_c', 'bench_1', 'bench_2', 'bench_3', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d'],
  school_field: ['track_start', 'track_finish', 'bleacher_low', 'bleacher_top', 'relay_start', 'goal_a', 'goal_b', 'shed', 'water_fountain', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d', 'center'],
  town_harbor: ['dock_end', 'dock_bench', 'lighthouse_view', 'lantern_row', 'fish_stall', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d'],
  school_rooftop: ['bench', 'fence_a', 'fence_b', 'garden', 'water_tank', 'vending', 'npc_1', 'npc_2', 'npc_3', 'npc_4', 'npc_5', 'npc_6', 'spot_a', 'spot_b', 'spot_c', 'spot_d'],
};
const CORE = ['nina', 'elise', 'clara', 'mari', 'vera', 'jules', 'dante', 'owen', 'bruno', 'kit'];
const TOWN_FEST = ['roz', 'mr_finch', 'mrs_calder', 'mayor_greer', 'rosa'];
const SCHOOL_FEST = ['ms_delaney', 'coach_mitchell', 'principal_marsh', 'mr_abel'];
const EXTRA_FEST = ['student_01', 'student_02', 'student_03', 'student_04', 'townie_01', 'townie_02'];
const OVERRIDE_YEAR = { bruno: { year: 1 }, kit: { year: [2, 3] } };
function festivalRoutines() {
  const by = {};
  const NON_ATTENDING = [...Array.from({ length: 10 }, (_, i) => `student_${String(i + 5).padStart(2, '0')}`), ...Array.from({ length: 6 }, (_, i) => `townie_${String(i + 3).padStart(2, '0')}`)];
  FESTIVALS.forEach((f) => {
    const map = FEST_MAP[f.place] || f.place;
    for (const id of NON_ATTENDING) (by[id] = by[id] || []).push({ id: `festival_${f.id}_away`, priority: 31, when: all({ festival: f.id }, { time: [shift(f.start, -30), f.end] }), points: [[shift(f.start, -30), null]] });
    const pool = FEST_POOL[map] || ANCHORS[map];
    const attendees = [...CORE, ...(f.kind === 'town' ? TOWN_FEST : SCHOOL_FEST), ...EXTRA_FEST].slice(0, pool.length);
    const from = shift(f.start, -30);
    attendees.forEach((id, i) => {
      const anchor = pool[i];
      (by[id] = by[id] || []).push({
        id: `festival_${f.id}`, priority: 30,
        when: all({ festival: f.id }, { time: [from, f.end] }, ...(OVERRIDE_YEAR[id] ? [OVERRIDE_YEAR[id]] : [])),
        points: [[from, `${map}:${anchor}`, { activity: 'festival' }]],
      });
    });
  });
  return by;
}

// ---------------------------------------------------------------------------------------------- assemble
function build() {
  const fest = festivalRoutines();
  const sch = {};
  const add = (npc, routines) => { sch[npc] = { npc, routines: [...routines, ...(fest[npc] || [])] }; };
  for (const [npc, c] of Object.entries(STUDENTS)) add(npc, studentRoutines(npc, c));
  for (const [npc, c] of STUDENT_EXTRAS) add(npc, studentRoutines(npc, c));
  for (const [npc, c] of Object.entries(TEACHERS)) add(npc, [...teacherRoutines(npc, c), examProctor(npc)]); // exam days: only the homeroom teacher sits in the classroom
  for (const [npc, routines] of Object.entries(simple)) if (routines.length) add(npc, routines);
  for (let i = 1; i <= 8; i++) { const id = `townie_${String(i).padStart(2, '0')}`; const w = wanderer(id, i); add(id, w.routines); }
  return Object.values(sch).filter((s) => s.routines.length);
}

export default build();
