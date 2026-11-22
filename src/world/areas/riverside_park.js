/**
 * Riverside Park: fresh greens and water. Meadow along the brook, stone bridge, gazebo, picnic lawn, duck pond,
 * flowerbeds, swing, willows. Decor: spring_picnic, lantern_festival. Pure data.
 */
const brook = [[-1.5, 9.8], [4, 10.6], [10, 11.8], [16, 12.6], [21, 13.4], [27, 13.0], [31.5, 13.9]];
const brookW = [3.0, 3.2, 3.4, 3.6, 3.6, 3.4, 3.2];
const picnicLawn = [17, 23.8];

export default {
  id: 'riverside_park',
  size: [40, 28],
  kind: 'exterior',
  seed: 63,
  camStart: 'bridge_mid',
  ground: {
    base: 'grass',
    ops: [
      { kind: 'meadow', poly: [[1, 1], [16, 0.5], [17, 6], [14, 9], [2, 9]] },
      { kind: 'meadow', poly: [[24, 0.5], [39, 1], [39, 9.5], [30, 10.4], [25, 7]] },
      { kind: 'meadow', ellipse: [picnicLawn[0], picnicLawn[1], 5.6, 2.8] },
      { kind: 'meadow', poly: [[1, 14.5], [8, 15.5], [12, 17], [10, 26], [1, 26]] },
      { kind: 'moss', ellipse: [7.4, 9.0, 2.4, 1.0] },
      { kind: 'moss', ellipse: [27.0, 10.2, 2.6, 1.0] },
      { kind: 'moss', ellipse: [4.2, 22.4, 2.4, 1.4] },
      // paths: north entrance to the bridge, south fork to the gazebo and out east to the harbor
      { kind: 'dirt', path: [[20, -1.5], [20.1, 4], [20.8, 9], [21, 11]], w: 2.4, wobble: 0.06 },
      { kind: 'dirt', path: [[21, 15.8], [21.2, 18.4], [23, 21.2], [28, 22.8], [34, 23.1], [41.5, 23.1]], w: 2.4, wobble: 0.06 },
      { kind: 'dirt', path: [[21.2, 18.4], [16, 20.4], [12, 21.6], [9.5, 22.2]], w: 2.0, wobble: 0.05 },
      { kind: 'dirt', path: [[20.1, 4.4], [14, 5.4], [8.4, 5.8]], w: 1.5, wobble: 0.06 },
            { kind: 'flagstone', circle: [9.5, 19.0, 3.6] },
      { kind: 'flagstone', rect: [18.7, 9.6, 4.6, 1.8], r: 0.4 },
      { kind: 'flagstone', rect: [18.9, 15.4, 4.4, 1.8], r: 0.4 },
      { kind: 'flagstone', circle: [12.2, 5.4, 2.6] },
      // water: the brook and the duck pond it feeds
      { kind: 'water', path: brook, w: brookW, flow: [0.07, 0], wobble: 0.05, cap: 'butt' },
      { kind: 'water', ellipse: [35, 14.8, 4.3, 3.2], flow: [0.01, 0.0] },
    ],
  },
  edges: [
    { id: 'to_town_square', side: 'n', at: [18.6, 21.4] },
    { id: 'to_harbor', side: 'e', at: [21.4, 25] },
  ],
  anchors: {
    gazebo_spot: [9.5, 19.8, 'n'],
    bridge_mid: [21, 13.4, 's'],
    pond_edge: [29.7, 16.8, 'e'],
    picnic_blanket: [17, 23.6, 'n'],
    flower_bed: [12.2, 7.9, 'n'],
    bench_rp_1_spot: [14.2, 9.7, 's'],
    bench_rp_2_spot: [34.0, 19.5, 'n'],
    river_bank_1: [6.4, 8.4, 's'],
    river_bank_2: [24.6, 15.6, 'n'],
    duck_corner: [37.6, 19.3, 'n'],
    swing: [6.6, 7.3, 'n'],
  },
  critters: [
    { kind: 'duck', count: 3, bounds: { x: 31, z: 12, w: 8, h: 5.4 } },
    { kind: 'duck', count: 2, bounds: { x: 4, z: 10.4, w: 22, h: 3.4 } },
    { kind: 'sparrow', count: 4, bounds: { x: 2, z: 2, w: 36, h: 24 } },
    { kind: 'butterfly', count: 4, bounds: { x: 2, z: 2, w: 16, h: 7 } },
    { kind: 'butterfly', count: 2, bounds: { x: 12, z: 21, w: 12, h: 5 } },
    { kind: 'rabbit', count: 1, bounds: { x: 2, z: 14, w: 8, h: 10 } },
    { kind: 'cat', count: 1, bounds: { x: 22, z: 3, w: 10, h: 6 } },
  ],
  grass: { density: 0.9, avoid: [] },
  props: [
    // gazebo and picnic lawn
    { t: 'gazebo', x: 9.5, z: 19.0, r: 2.1, roof: 'blue', id: 'gazebo', label: 'Gazebo' },
    { t: 'flowers', x: 6.0, z: 21.8, rx: 1.4, rz: 0.8, n: 30, bed: true },
    { t: 'flowers', x: 13.2, z: 22.4, rx: 1.2, rz: 0.7, n: 26 },
    { t: 'bush', kind: 'hedge', x: 6.4, z: 16.2, w: 3.4 },
    { t: 'bush', kind: 'hedge', x: 12.9, z: 16.1, w: 2.6 },
    { t: 'flowers', x: 12.4, z: 23.6, rx: 1.4, rz: 0.8, n: 26 },
    { t: 'flowers', x: 20.0, z: 25.2, rx: 1.3, rz: 0.7, n: 24, colors: ['#ffd23f', '#fff', '#ff9a4a'] },
    { t: 'bench', x: 21.2, z: 25.6, dir: 'n', w: 1.7 },

    // stone bridge over the brook
    { t: 'bridge', kind: 'stone', x: 21, z: 13.4, len: 6.6, w: 2.6, dir: 'z' },
    { t: 'lamp_post', x: 22.8, z: 9.5, id: 'lamp_rp_2' },
    { t: 'lamp_post', x: 19.4, z: 17.4, id: 'lamp_rp_3' },
    { t: 'lamp_post', x: 18.5, z: 4.8, id: 'lamp_rp_1' },
    { t: 'lamp_post', x: 27.6, z: 21.4, id: 'lamp_rp_4' },
    { t: 'lamp_post', x: 12.4, z: 21.9, id: 'lamp_rp_5' },
    { t: 'signpost', x: 17.4, z: 3.4, id: 'sign_rp', board: 'Riverside Park', label: 'Signpost',
      text: 'Riverside Park: Town Square to the north, the Harbor to the east along the path.' },

    // north meadow: flowerbed, swing, benches
    { t: 'flowers', x: 12.2, z: 5.4, rx: 1.8, rz: 1.4, n: 70, bed: true },
    { t: 'flowers', x: 12.2, z: 5.4, rx: 1.0, rz: 0.8, n: 18, colors: ['#ff5f6d', '#ffd23f'], h: 1.3 },
    { t: 'flowers', x: 26.5, z: 4.4, rx: 2.0, rz: 1.1, n: 40 },
    { t: 'swing', x: 6.6, z: 5.6, w: 3 },
    { t: 'bench', x: 14.2, z: 8.7, dir: 's', w: 1.9, id: 'bench_rp_1', label: 'Bench', text: 'A bench facing the brook. The water chatters over the stones.' },
    { t: 'bench', x: 23.8, z: 6.5, dir: 'w', w: 1.8 },
    { t: 'planter', x: 17.9, z: 7.0, w: 1.2 },
    { t: 'bush', kind: 'hedge', x: 24.6, z: 2.8, w: 3.2 },

    // pond side
    { t: 'bench', x: 34.0, z: 20.5, dir: 'n', w: 1.9, id: 'bench_rp_2', label: 'Bench', text: 'A bench by the pond, where the ducks hold court.' },
    { t: 'reeds', x: 31.0, z: 18.0, n: 10, r: 0.9 },
    { t: 'reeds', x: 39.0, z: 12.0, n: 9, r: 0.8 },
    { t: 'reeds', x: 36.5, z: 11.2, n: 8, r: 0.8 },
    { t: 'reeds', x: 9.0, z: 9.6, n: 8, r: 0.7 },
    { t: 'reeds', x: 25.0, z: 15.3, n: 8, r: 0.8 },
    { t: 'rock', x: 38.5, z: 17.6, scale: 0.9 },
    { t: 'rock', x: 33.0, z: 11.0, scale: 0.8 },
    { t: 'rock', x: 14.0, z: 14.6, scale: 0.7 },
    { t: 'rock', x: 4.0, z: 12.4, scale: 1.0 },
    { t: 'sunflowers', x: 38.6, z: 20.8, n: 4, r: 0.8 },

    // fishing + foraging
    { t: 'marker', id: 'fishing_rp_1', type: 'fishing', x: 9.4, z: 9.5, r: 1.4, label: 'Fishing spot', text: 'Minnows flash between the stones.' },
    { t: 'marker', id: 'fishing_rp_2', type: 'fishing', x: 16.6, z: 15.4, r: 1.4, label: 'Fishing spot', text: 'The brook runs slow and deep here.' },
    { t: 'marker', id: 'fishing_rp_3', type: 'fishing', x: 36.8, z: 10.2, r: 1.4, label: 'Fishing spot', text: 'The pond is calm; something stirs below.' },
    { t: 'forage_spot', id: 'forage_rp_1', x: 4.4, z: 4.2, label: 'Wildflowers' },
    { t: 'forage_spot', id: 'forage_rp_2', x: 25.6, z: 2.2, label: 'Berry bush' },
    { t: 'forage_spot', id: 'forage_rp_3', x: 3.6, z: 20.8, label: 'Wild herbs' },
    { t: 'forage_spot', id: 'forage_rp_4', x: 37.4, z: 5.4, label: 'Meadow flowers' },
    { t: 'bush', kind: 'berry', x: 26.8, z: 2.6 },
    { t: 'bush', kind: 'flower', x: 38.4, z: 4.6, scale: 1.0 },

    // willows and trees
    { t: 'tree', kind: 'willow', x: 9.8, z: 7.6, scale: 1.25, seed: 3 },
    { t: 'tree', kind: 'willow', x: 27.4, z: 9.4, scale: 1.2, seed: 7 },
    { t: 'tree', kind: 'willow', x: 29.4, z: 18.8, scale: 1.1, seed: 11 },
    { t: 'tree', kind: 'cherry', x: 22.8, z: 26.4, scale: 0.95, seed: 2 },
    { t: 'tree', kind: 'cherry', x: 4.0, z: 17.4, scale: 1.05, seed: 5 },
    { t: 'tree', kind: 'oak', x: 32.0, z: 3.6, scale: 1.2, seed: 9 },
    { t: 'tree', kind: 'oak', x: 3.0, z: 12.4, scale: 1.1, seed: 4 },
    { t: 'tree', kind: 'birch', x: 24.0, z: 20.0, scale: 1.0, seed: 6 },

    // scatter AFTER the buildings/props so it avoids them
    { scatter: true, t: 'tree', n: 10, in: { rect: [0, 0, 40, 2.8] }, minDist: 3.0, params: { kinds: ['oak', 'pine', 'birch', 'oak'], scaleRange: [0.95, 1.3] } },
    { scatter: true, t: 'tree', n: 6, in: { rect: [0, 25.6, 40, 2.4] }, avoid: [[9, 21, 17, 7]], minDist: 3.4, params: { kinds: ['oak', 'birch', 'cherry', 'pine'], scaleRange: [0.95, 1.2] } },
    { scatter: true, t: 'tree', n: 5, in: { rect: [0, 3, 2.6, 22] }, minDist: 3.6, params: { kinds: ['oak', 'pine', 'birch'], scaleRange: [1.0, 1.25] } },
    { scatter: true, t: 'tree', n: 3, in: { rect: [37.6, 2, 2.4, 8] }, minDist: 3.6, params: { kinds: ['oak', 'pine'], scaleRange: [1.0, 1.2] } },
    { scatter: true, t: 'flowers', n: 14, in: { poly: [[1, 1], [16, 0.5], [17, 6], [14, 9], [2, 9]] }, minDist: 1.5, clear: 0.2, params: { rx: 0.9, rz: 0.7, n: 26 } },
    { scatter: true, t: 'flowers', n: 8, in: { rect: [24, 1, 14, 8] }, minDist: 1.8, clear: 0.2, params: { rx: 0.8, rz: 0.6, n: 22 } },
    { scatter: true, t: 'flowers', n: 6, in: { rect: [1, 15, 10, 11] }, minDist: 2, clear: 0.2, params: { rx: 0.9, rz: 0.7, n: 24 } },
    { scatter: true, t: 'bush', n: 12, in: { rect: [1, 1, 38, 26] }, minDist: 2.6, params: { kinds: ['round', 'flower', 'round'], scaleRange: [0.8, 1.15] } },
    { scatter: true, t: 'rock', n: 4, in: { rect: [1, 1, 38, 26] }, minDist: 4, params: { scaleRange: [0.6, 0.9] } },
    { scatter: true, t: 'mushrooms', n: 2, in: { rect: [1, 14, 8, 11] }, minDist: 4, params: { n: 4 } },
  ],
  decor: {
    spring_picnic: [
      { t: 'picnic', x: 16.4, z: 23.4, w: 3.0, color: '#e8645a', rot: 0.12 },
      { t: 'picnic', x: 19.8, z: 24.2, color: '#5a8ac9', rot: -0.25 },
      { t: 'picnic', x: 13.8, z: 24.9, w: 2.4, d: 1.8, color: '#e0b24a', rot: 0.3 },
      { t: 'picnic', x: 28.5, z: 25.2, color: '#d9608a', rot: 0.1 },
      { t: 'bunting', pts: [[8.0, 17.0], [9.5, 16.6], [11.0, 17.0]], y: 2.8, sag: 0.35, colors: ['#ffc4d6', '#fff4f0', '#ffe08a', '#c8f0d0'], poles: false },
      { t: 'bunting', pts: [[14.0, 22.0], [17, 22.8], [20.6, 22.0]], y: 2.6, sag: 0.5, colors: ['#ffc4d6', '#fff4f0', '#ffe08a', '#c8f0d0'], poles: true },
      { t: 'bunting', pts: [[18.4, 7.4], [21.6, 7.8], [24.8, 7.2]], y: 3.2, sag: 0.6, colors: ['#ffc4d6', '#fff4f0', '#ffe08a', '#c8f0d0'], poles: true },
      { t: 'bunting', pts: [[19.4, 18.2], [21.2, 17.8], [23.2, 18.4]], y: 3.0, sag: 0.4, colors: ['#ffc4d6', '#fff4f0', '#ffe08a'], poles: false },
      { t: 'petals', x: 16.5, z: 24.0, n: 40, r: 2.8 },
      { t: 'petals', x: 4.8, z: 18.6, n: 30, r: 2.0 },
      { t: 'petals', x: 21, z: 14.4, n: 20, r: 1.4 },
      { t: 'petals', x: 13.0, z: 6.5, n: 24, r: 2.0 },
    ],
    lantern_festival: [
      { t: 'lantern_string', pts: [[15.0, 9.2], [15.2, 16.4]], y: 4.0, sag: 0.9 },
      { t: 'lantern_string', pts: [[26.0, 9.2], [26.2, 16.4]], y: 4.0, sag: 0.9 },
      { t: 'lantern_string', pts: [[8.4, 8.6], [8.6, 14.0]], y: 3.8, sag: 0.7 },
      { t: 'lantern_string', pts: [[15.0, 9.2], [26.0, 9.2]], y: 4.0, sag: 0.8, poles: false },
      { t: 'lantern_string', pts: [[15.2, 16.4], [26.2, 16.4]], y: 4.0, sag: 0.8, poles: false },
      { t: 'lantern_string', pts: [[7.4, 16.2], [9.5, 16.6], [11.6, 16.2]], y: 3.2, sag: 0.4, poles: false },
      { t: 'floating_lanterns', pts: [[3.0, 10.2], [6.5, 11.2], [9.6, 11.7], [12.6, 12.3], [14.4, 12.2], [17.6, 13.0], [19.0, 12.4], [23.2, 13.2], [24.6, 13.6], [28.6, 13.0],
        [33.2, 14.4], [35.4, 16.0], [36.8, 13.6], [34.4, 12.8], [38.0, 15.4]] },
    ],
  },
};
