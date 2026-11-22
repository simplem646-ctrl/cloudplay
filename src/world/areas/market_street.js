/**
 * Market Street: long cobbled shopping street (west <-> east), timber-and-plaster shop fronts facing south,
 * stairs up to Starview Hill through the gap in the shop row. Warm brick & timber mood. Pure data.
 */
const FRONT = 10.4; // z of the shop fronts

export default {
  id: 'market_street',
  size: [46, 24],
  kind: 'exterior',
  seed: 52,
  camStart: 'street_mid',
  ground: {
    base: 'grass',
    ops: [
      // meadow patches behind the shops and in the south garden strip
      { kind: 'meadow', poly: [[0, 0], [14, 0.5], [18, 6], [8, 8], [0, 9]] },
      { kind: 'meadow', poly: [[30, 0.5], [46, 0], [46, 9], [36, 8.4]] },
      { kind: 'moss', ellipse: [29.2, 3.6, 3.0, 1.6] },
      { kind: 'meadow', poly: [[0, 19.6], [20, 19.2], [26, 21.4], [12, 24], [0, 24]] },
      { kind: 'moss', ellipse: [38.5, 22.6, 3.2, 1.2] },
      // dirt tracks out of the map (west to Town Square, east to the Harbor)
      { kind: 'dirt', path: [[-1, 15.4], [2.5, 15.6], [5, 15.4]], w: 3.4 },
      { kind: 'dirt', path: [[41, 15.5], [44, 15.3], [47, 15.4]], w: 3.4 },
      // pavements and the cobbled road
      { kind: 'flagstone', rect: [1.4, FRONT, 43.2, 2.1], r: 0.35 },
      { kind: 'cobble', rect: [0.4, 12.2, 45.2, 6.2], r: 1.2 },
      { kind: 'flagstone', rect: [2.0, 18.3, 42, 1.2], r: 0.3 },
      // a gutter of dark stone and a paving patch around the fruit stand
      { kind: 'stone', path: [[1, 17.2], [14, 17.35], [30, 17.2], [44, 17.3]], w: 0.34, wobble: 0.04, edge: 'none' },
      { kind: 'stone', path: [[1, 13.0], [16, 12.9], [30, 13.0], [44, 12.95]], w: 0.3, wobble: 0.04, edge: 'none' },
      { kind: 'flagstone', rect: [25.6, 13.4, 8.2, 3.6], r: 0.9 },
      { kind: 'flagstone', rect: [20.8, 14.0, 4.2, 2.6], r: 1.0 },
      // stairs up the hill through the gap between clinic and library
      { kind: 'flagstone', path: [[24.1, 11.0], [24.1, 6], [24.0, -1]], w: 3.1, edge: 'raised' },
      { kind: 'stone', rect: [22.5, 8.6, 3.2, 0.34], edge: 'none' },
      { kind: 'stone', rect: [22.5, 7.4, 3.2, 0.34], edge: 'none' },
      { kind: 'stone', rect: [22.5, 6.2, 3.2, 0.34], edge: 'none' },
      { kind: 'stone', rect: [22.5, 5.0, 3.2, 0.34], edge: 'none' },
      { kind: 'stone', rect: [22.5, 3.8, 3.2, 0.34], edge: 'none' },
      { kind: 'gravel', path: [[24.0, 2.6], [23.6, 0], [23.9, -1]], w: 3.6 },
      // alley between the provisions store and the clinic, cat corner
      { kind: 'cobble', rect: [12.7, 5.5, 2.3, 5.2], r: 0.3 },
      // garden strip south of the road
      { kind: 'dirt', circle: [22.5, 21.6, 2.6] },
      { kind: 'flagstone', circle: [22.5, 21.6, 1.7] },
    ],
  },
  edges: [
    { id: 'to_town_square', side: 'w', at: [13.8, 17.6] },
    { id: 'to_harbor', side: 'e', at: [13.8, 17.6] },
    { id: 'to_starview_hill', side: 'n', at: [22.6, 25.6] },
  ],
  anchors: {
    street_west: [5.2, 16.0, 'e'],
    street_mid: [23.0, 15.6, 'e'],
    street_east: [41.2, 16.2, 'w'],
    store_steps: [10.3, 12.3, 'n'],
    clinic_steps: [17.1, 12.3, 'n'],
    library_steps: [30.5, 12.3, 'n'],
    inn_steps: [38.7, 12.3, 'n'],
    bench_ms_1_spot: [17.5, 18.2, 'n'],
    postbox_spot: [20.2, 12.4, 'n'],
    hill_stairs: [24.1, 9.6, 'n'],
    fruit_stand: [29.5, 16.5, 'n'],
    cat_corner: [13.8, 11.2, 'n'],
  },
  critters: [
    { kind: 'sparrow', count: 4, bounds: { x: 3, z: 10, w: 40, h: 12 } },
    { kind: 'cat', count: 1, bounds: { x: 12.4, z: 9, w: 3, h: 4 } },
    { kind: 'dog', count: 1, bounds: { x: 30, z: 18, w: 12, h: 5 } },
    { kind: 'butterfly', count: 3, bounds: { x: 2, z: 19, w: 20, h: 5 } },
    { kind: 'sparrow', count: 2, bounds: { x: 2, z: 1, w: 40, h: 5 } },
  ],
  grass: { density: 0.78, avoid: [] },
  props: [
    // ---- the shop row, west to east
    { t: 'house', x: 8.5, z: FRONT, w: 9, d: 5.2, h: 3.8, wall: 'timber', wallColor: '#f4dfb4', roof: 'red', rise: 1.8, floors: 2,
      door: { at: 1.8, w: 1.7, transition: 'to_general_store', color: '#3f7a5a', style: 'plain', matColor: '#3f7a5a' },
      windows: [
        { at: -2.4, y: 1.15, w: 2.2, h: 1.35, shutters: false, box: '#7a4a28' },
        { at: 4.0, y: 1.2, w: 0.9, h: 1.3, shutters: '#3f7a5a', box: true },
        { at: -3.4, y: 2.45, w: 0.9, h: 0.9, shutters: '#3f7a5a', box: '#c9605a' },
        { at: -0.9, y: 2.45, w: 0.9, h: 0.9, shutters: '#3f7a5a' },
        { at: 1.8, y: 2.45, w: 0.9, h: 0.9, shutters: '#3f7a5a', box: true },
      ],
      awning: { at: -2.4, w: 3.6, y: 2.45, d: 1.25, colors: ['#4f9a6a', '#fff4e0'] },
      sign: { text: 'Pennywhistle Provisions', at: 4.1, y: 1.95, w: 1.9, h: 0.75, bg: '#f0d9a0', fg: '#4a3220', style: 'hang' },
      chimney: { at: -3.0, smoke: true, rate: 1.2 }, seed: 2 },

    { t: 'house', x: 18, z: FRONT, w: 6.5, d: 5.6, h: 4.1, wall: 'plaster', wallColor: '#e9f2ec', roof: 'green', rise: 1.9, floors: 2, baseColor: '#9aa49a',
      door: { at: -0.9, w: 1.6, transition: 'to_clinic', color: '#6fa8c8', style: 'arch', matColor: '#6fa8c8' },
      windows: [
        { at: 1.7, y: 1.2, w: 1.5, h: 1.4, shutters: '#6fa8c8', box: '#f0f0f0', flowers: ['#ff8aa8', '#fff', '#ffd23f'] },
        { at: -2.4, y: 1.25, w: 0.9, h: 1.3, shutters: '#6fa8c8', box: true },
        { at: -2.0, y: 2.65, w: 1.0, h: 1.05, shutters: '#6fa8c8' },
        { at: 0.2, y: 2.65, w: 1.0, h: 1.05, shutters: '#6fa8c8', box: true },
        { at: 2.3, y: 2.65, w: 1.0, h: 1.05, shutters: '#6fa8c8' },
      ],
      sign: { text: 'Whitlock Clinic', style: 'plaque', at: -0.9, y: 2.75, w: 1.8, h: 0.5, bg: '#f4fbf6', fg: '#3c7a6a' },
      chimney: { at: 2.2, smoke: false }, seed: 7 },

    { t: 'house', x: 30.5, z: FRONT, w: 6.5, d: 6.2, h: 4.6, wall: 'stone', wallColor: '#d6c9ae', roof: 'slate', rise: 2.1, floors: 2, baseColor: '#8c8272', ivy: 22, overhang: 0.7,
      door: { at: 0, w: 1.9, h: 2.5, transition: 'to_library', color: '#7a3a3a', style: 'arch', matColor: '#7a3a3a', step: true },
      windows: [
        { at: -2.2, y: 1.3, w: 1.0, h: 1.9, shutters: false },
        { at: 2.2, y: 1.3, w: 1.0, h: 1.9, shutters: false },
        { at: -1.6, y: 3.0, w: 1.1, h: 1.1 },
        { at: 0, y: 3.15, w: 1.4, h: 1.4, trim: '#fff4de' },
        { at: 1.6, y: 3.0, w: 1.1, h: 1.1 },
      ],
      sign: { text: 'Thornfield Library', style: 'plaque', at: 0, y: 2.95, w: 2.4, h: 0.5, bg: '#3c4a62', fg: '#f6e8c0' },
      dormers: [], chimney: { at: -2.4, smoke: false }, flag: { at: 1.2, color: '#4a6ac0' }, seed: 9 },

    { t: 'house', x: 39.5, z: FRONT, w: 8.5, d: 6, h: 4.3, wall: 'brick', wallColor: '#e8b49a', roof: 'brown', rise: 1.9, floors: 2, overhang: 0.65,
      door: { at: -1.0, w: 1.8, transition: 'to_inn', color: '#4a2f22', style: 'arch', matColor: '#8a3a2a', lantern: true },
      windows: [
        { at: -3.1, y: 1.2, w: 1.3, h: 1.4, shutters: '#a8432e', box: '#7a4a28', flowers: ['#ffd23f', '#ff9a4a', '#ff7a7a'] },
        { at: 1.4, y: 1.2, w: 1.5, h: 1.4, shutters: '#a8432e', box: '#7a4a28' },
        { at: 3.4, y: 1.2, w: 1.1, h: 1.4, shutters: '#a8432e', box: true },
        { at: -3.0, y: 2.8, w: 1.0, h: 1.1, shutters: '#a8432e' },
        { at: -0.8, y: 2.8, w: 1.0, h: 1.1, shutters: '#a8432e', box: true },
        { at: 1.6, y: 2.8, w: 1.0, h: 1.1, shutters: '#a8432e' },
        { at: 3.6, y: 2.8, w: 1.0, h: 1.1, shutters: '#a8432e', box: '#7a4a28' },
      ],
      sign: { text: 'Heron Inn', at: 2.6, y: 1.55, w: 1.7, h: 0.8, bg: '#2f4a5a', fg: '#f4e2b0', style: 'hang' },
      chimney: { at: 2.9, smoke: true, rate: 1.6 }, patch: true, seed: 12 },

    // ---- shop-front life
    { t: 'barrel', x: 5.7, z: 11.5, scale: 0.9 },
    { t: 'crates', x: 6.8, z: 11.4, n: 3 },
    { t: 'planter', x: 4.4, z: 11.4, w: 1.3, colors: ['#ff9a4a', '#ffd23f', '#fff'] },
    { t: 'sack', x: 12.2, z: 11.4 },
    { t: 'planter', x: 15.6, z: 11.4, w: 1.2, colors: ['#ff8aa8', '#fff', '#ffd23f'] },
    { t: 'planter', x: 19.8, z: 11.4, w: 1.3, colors: ['#9ac8ff', '#fff', '#ff8aa8'] },
    { t: 'planter', x: 27.9, z: 11.5, w: 1.2, colors: ['#ffd23f', '#fff', '#ff9a4a'] },
    { t: 'planter', x: 33.1, z: 11.5, w: 1.2, colors: ['#ff8aa8', '#ffd23f', '#fff'] },
    { t: 'barrel', x: 34.8, z: 11.4, scale: 0.85 },
    { t: 'barrel', x: 35.7, z: 11.6, scale: 0.8 },
    { t: 'planter', x: 43.1, z: 11.4, w: 1.2, colors: ['#ffd23f', '#ff7a7a', '#fff'] },
    { t: 'bench', x: 36.6, z: 12.0, dir: 's', w: 1.7 },
    { t: 'mailbox', x: 20.8, z: 11.1, color: '#c9453a' },
    { t: 'laundry', pts: [[13.05, 8.4], [14.65, 8.2]], y: 3.0 },

    // ---- alley / cat corner
    { t: 'crates', x: 14.1, z: 8.4, n: 2, rot: 0.3 },
    { t: 'barrel', x: 13.3, z: 7.4, scale: 0.9 },
    { t: 'flowers', x: 14.0, z: 6.2, rx: 0.6, rz: 0.5, n: 12 },

    // ---- stairs flanks
    { t: 'fence', kind: 'stone', pts: [[22.1, 10.2], [22.1, 4.0], [22.4, 2.6]], h: 0.7 },
    { t: 'fence', kind: 'stone', pts: [[26.1, 10.2], [26.1, 4.0], [25.8, 2.6]], h: 0.7 },
    { t: 'lamp_post', x: 22.2, z: 3.2 },
    { t: 'lamp_post', x: 26.0, z: 3.2 },
    { t: 'bush', kind: 'hedge', x: 21.2, z: 9.6, w: 1.6 },
    { t: 'bush', kind: 'flower', x: 26.9, z: 9.4, scale: 0.9 },

    // ---- the street proper
    { t: 'market_stall', x: 29.6, z: 14.6, w: 3.2, goods: 'fruit', colors: ['#d9534a', '#fff4e0'] },
    { t: 'crates', x: 27.2, z: 15.2, n: 3, rot: 0.2 },
    { t: 'barrel', x: 32.2, z: 15.1, scale: 0.85 },
    { t: 'market_stall', x: 8.0, z: 14.2, w: 2.8, goods: 'flowers', colors: ['#f0a0b8', '#fff4e0'] },
    { t: 'signpost', x: 3.4, z: 12.9, id: 'sign_ms', board: 'Market Street', label: 'Signpost',
      text: 'Market Street: Town Square to the west, the Harbor east, Starview Hill up the steps.' },

    // lamps
    { t: 'lamp_post', x: 5.3, z: 12.45, id: 'lamp_ms_1' },
    { t: 'lamp_post', x: 13.4, z: 12.45, id: 'lamp_ms_2' },
    { t: 'lamp_post', x: 22.2, z: 12.45, id: 'lamp_ms_3' },
    { t: 'lamp_post', x: 34.4, z: 12.45, id: 'lamp_ms_4' },
    { t: 'lamp_post', x: 38.2, z: 18.85, id: 'lamp_ms_5' },
    { t: 'lamp_post', x: 9.6, z: 18.85, id: 'lamp_ms_6' },

    // ---- south garden strip
    { t: 'bench', x: 17.5, z: 19.8, dir: 'n', w: 1.9, id: 'bench_ms_1', label: 'Bench', text: 'A shady bench for watching the whole street go by.' },
    { t: 'bench', x: 34.0, z: 19.8, dir: 'n', w: 1.9 },
    { t: 'flowers', x: 22.5, z: 21.6, rx: 1.3, rz: 1.0, n: 44, bed: true },
    { t: 'flowers', x: 13.0, z: 20.9, rx: 1.4, rz: 0.7, n: 26 },
    { t: 'flowers', x: 29.0, z: 21.2, rx: 1.6, rz: 0.7, n: 30, colors: ['#ffd23f', '#ff9a4a', '#fff'] },
    { t: 'bush', kind: 'hedge', x: 26.4, z: 20.2, w: 2.6 },
    { t: 'bush', kind: 'hedge', x: 40.6, z: 20.3, w: 3.4 },
    { t: 'bush', kind: 'hedge', x: 4.4, z: 20.3, w: 3.0 },
    { t: 'tree', kind: 'cherry', x: 6.8, z: 22.0, scale: 1.05, seed: 3 },
    { t: 'tree', kind: 'oak', x: 19.6, z: 22.4, scale: 1.1, seed: 4 },
    { t: 'tree', kind: 'oak', x: 36.5, z: 22.0, scale: 1.15, seed: 6 },
    { t: 'tree', kind: 'cherry', x: 43.4, z: 21.6, scale: 1.0, seed: 8 },
    { t: 'tree', kind: 'birch', x: 1.6, z: 11.6, scale: 1.0, seed: 5 },
    { t: 'tree', kind: 'oak', x: 44.6, z: 11.4, scale: 1.1, seed: 10 },

    // ---- trees and scatter AFTER the buildings so they avoid solids
    { scatter: true, t: 'tree', n: 12, in: { rect: [0, 0, 46, 3.6] }, minDist: 3.0, params: { kinds: ['pine', 'oak', 'birch', 'pine'], scaleRange: [0.95, 1.3] } },
    { scatter: true, t: 'tree', n: 5, in: { rect: [0, 3, 2.8, 8] }, minDist: 3.4, params: { kinds: ['oak', 'pine'], scaleRange: [1.0, 1.25] } },
    { scatter: true, t: 'tree', n: 4, in: { rect: [43.2, 3, 2.8, 8] }, minDist: 3.4, params: { kinds: ['oak', 'pine', 'birch'], scaleRange: [1.0, 1.25] } },
    { scatter: true, t: 'tree', n: 6, in: { rect: [0, 22.4, 46, 1.6] }, minDist: 3.6, params: { kinds: ['oak', 'birch', 'pine'], scaleRange: [0.95, 1.2] } },
    { scatter: true, t: 'flowers', n: 9, in: { rect: [1, 1, 44, 9] }, minDist: 2, clear: 0.3, params: { rx: 0.8, rz: 0.6, n: 22 } },
    { scatter: true, t: 'bush', n: 12, in: { rect: [1, 0.5, 44, 9.5] }, minDist: 2.4, params: { kinds: ['round', 'flower', 'round'], scaleRange: [0.8, 1.15] } },
    { scatter: true, t: 'bush', n: 5, in: { rect: [1, 20, 44, 3.6] }, minDist: 3, params: { kinds: ['round', 'flower', 'berry'], scaleRange: [0.8, 1.1] } },
    { scatter: true, t: 'rock', n: 4, in: { rect: [1, 0.5, 44, 8] }, minDist: 4, params: { scaleRange: [0.6, 1.0] } },
    { scatter: true, t: 'mushrooms', n: 2, in: { rect: [1, 1, 44, 6] }, minDist: 5, params: { n: 4 } },
  ],
};
