/** Starview Hill (exterior, 34x26). Windy hilltop meadow: huge old oak, view bench, brass telescope, domed observatory, stone-walled summit, wildflowers. Pure data. */
export default {
  id: 'starview_hill',
  size: [34, 26],
  kind: 'exterior',
  seed: 121,
  camStart: 'summit',
  margin: 8,
  ground: {
    base: 'meadow',
    ops: [
      { kind: 'grass', ellipse: [8, 20, 9, 5] },
      { kind: 'grass', ellipse: [28, 21, 7, 4] },
      { kind: 'moss', ellipse: [4, 6, 4.5, 3.5] },
      { kind: 'meadow', ellipse: [24, 6, 6, 3.4] },
      // vista beyond the eastern cliff edge: the bay far below
      { kind: 'water', rect: [37, -10, 14, 50], deep: true },
      { kind: 'sand', path: [[36.4, -4], [36.0, 8], [36.6, 18], [36.2, 32]], w: 2.4, cap: 'butt' },
      // summit
      { kind: 'gravel', circle: [15, 6.2, 3.6] },
      { kind: 'flagstone', circle: [15, 6.2, 2.2] },
      // observatory yard
      { kind: 'flagstone', rect: [20.2, 11.6, 5.2, 3.0], r: 0.4 },
      // trails
      { kind: 'dirt', path: [[-1, 14.8], [5, 14.6], [10, 15.7], [15, 16.4], [19.2, 14.6], [22.8, 13.6]], w: [2.4, 2.4, 2.2, 2.4, 2.4, 2.4], wobble: 0.08 },
      { kind: 'dirt', path: [[22.4, 27.5], [22.2, 24], [21.0, 20.4], [20.0, 17.0], [19.6, 14.8]], w: [2.6, 2.4, 2.4, 2.2, 2.2], wobble: 0.08 },
      { kind: 'dirt', path: [[19.4, 15.2], [17.8, 12], [16, 9.2]], w: 2.0, wobble: 0.08 },
      // stone stairs up the southern slope
      { kind: 'flagstone', rect: [20.4, 22.4, 3.6, 0.9], r: 0.1 },
      { kind: 'flagstone', rect: [20.2, 21.0, 3.6, 0.9], r: 0.1 },
      { kind: 'flagstone', rect: [20.0, 19.6, 3.6, 0.9], r: 0.1 },
    ],
  },
  edges: [
    { id: 'to_market_street', side: 's', at: [20.4, 24.2] },
    { id: 'to_whispering_woods', side: 'w', at: [13.2, 16.6] },
  ],
  anchors: {
    summit: [15.0, 8.6, 's'],
    view_bench_spot: [12.6, 6.2, 'n'],
    telescope_spot: [17.3, 8.4, 'n'],
    observatory_steps: [22.8, 15.4, 'n'],
    big_oak: [8.6, 18.0, 'n'],
    trail_south: [21.4, 21.4, 'n'],
    trail_west: [6.2, 14.9, 'e'],
  },
  critters: [
    { kind: 'sparrow', count: 4, bounds: { x: 2, z: 2, w: 28, h: 20 } },
    { kind: 'butterfly', count: 5, bounds: { x: 3, z: 14, w: 26, h: 10 } },
    { kind: 'rabbit', count: 2, bounds: { x: 3, z: 16, w: 10, h: 8 } },
  ],
  grass: { density: 1.0, avoid: [] },
  props: [
    // the observatory: round-ish white base under a verdigris dome
    { t: 'house', x: 22.8, z: 11.8, w: 6.2, d: 6.2, h: 3.5, wall: 'plaster', wallColor: '#f4eee0', baseColor: '#b8b0a0', roof: 'slate', rise: 0.5, overhang: 0.3,
      door: { at: 0, w: 1.7, h: 2.3, transition: 'to_observatory', color: '#2f3a6a', style: 'arch', matColor: '#2f3a6a', lantern: true },
      windows: [{ at: -2.2, y: 1.5, w: 0.9, h: 1.3, shutters: '#2f3a6a' }, { at: 2.2, y: 1.5, w: 0.9, h: 1.3, shutters: '#2f3a6a' }],
      steps: { w: 3.2, n: 3 }, sign: { text: 'Starview Observatory', style: 'plaque', at: 0, y: 3.0, w: 3.2, h: 0.6 }, chimney: false, seed: 14 },
    { t: 'dome', x: 22.8, z: 8.7, y: 3.5, r: 3.2 },
    { t: 'planter', x: 20.6, z: 12.6, w: 1.2, colors: ['#b78cff', '#fff', '#ffd23f'] },
    { t: 'planter', x: 25.4, z: 12.6, w: 1.2, colors: ['#ff7fa3', '#fff', '#ffd23f'] },
    { t: 'barrel', x: 26.8, z: 12.4, scale: 0.85 },
    // summit: low stone wall, view bench, brass telescope on its stand
    { t: 'fence', kind: 'stone', pts: [[11.2, 9.6], [10.6, 6.8], [11.6, 4.4], [14.0, 3.0], [17.0, 3.0], [19.4, 4.4]], h: 0.7 },
    { t: 'bench', x: 12.8, z: 5.0, dir: 's', w: 1.9, id: 'bench_sh_1', label: 'View bench', text: 'A weathered bench with a view of the whole valley, and a bit of the sea.' },
    { t: 'telescope', x: 17.3, z: 6.8, dir: 'e', id: 'telescope', label: 'Telescope', text: 'A brass telescope on a stand. The town looks tiny, and the harbour sparkles.' },
    { t: 'rock', x: 10.4, z: 10.4, scale: 0.8 },
    { t: 'rock', x: 19.8, z: 6.2, scale: 1.0 },
    { t: 'flowers', x: 13.2, z: 8.4, rx: 1.4, rz: 0.8, n: 22, colors: ['#fff', '#ffd23f', '#ff7fa3'] },
    // big old oak
    { t: 'tree', kind: 'oak', x: 6.0, z: 19.0, scale: 2.1, seed: 31 },
    { t: 'stump', x: 10.2, z: 18.6 },
    { t: 'picnic', x: 9.6, z: 17.2, w: 2.2, d: 1.8, color: '#5a8ac9', rot: -0.15 },
    // signage, lamps, forage
    { t: 'signpost', x: 18.0, z: 17.6, id: 'sign_sh', board: 'Starview Hill', text: 'Starview Hill: the observatory to the north-east, Market Street down the steps, Whispering Woods to the west.', label: 'Signpost' },
    { t: 'lamp_post', x: 21.2, z: 20.8, id: 'lamp_sh_1' },
    { t: 'lamp_post', x: 12.2, z: 16.2, id: 'lamp_sh_2' },
    { t: 'lamp_post', x: 17.6, z: 9.8, id: 'lamp_sh_3' },
    { t: 'forage_spot', id: 'forage_sh_1', x: 3.8, z: 6.4, label: 'Hilltop herbs' },
    { t: 'forage_spot', id: 'forage_sh_2', x: 29.6, z: 19.6, label: 'Wild thyme' },
    { t: 'forage_spot', id: 'forage_sh_3', x: 11.6, z: 22.4, label: 'Clover patch' },
    // stone stair wall + wind-bent trees on the slopes
    { t: 'fence', kind: 'stone', pts: [[19.6, 22.8], [19.6, 19.4]], h: 0.5 },
    { t: 'fence', kind: 'stone', pts: [[24.2, 22.8], [24.2, 19.4]], h: 0.5 },
    { t: 'tree', kind: 'pine', x: 28.6, z: 6.4, scale: 1.3, seed: 32 },
    { t: 'tree', kind: 'birch', x: 3.2, z: 10.2, scale: 1.2, seed: 33 },
    { t: 'tree', kind: 'pine', x: 30.8, z: 14.0, scale: 1.2, seed: 34 },
    // wildflower meadows
    { t: 'flowers', x: 6.0, z: 20.6, rx: 3.4, rz: 1.8, n: 70, colors: ['#ff7fa3', '#ffd23f', '#fff', '#b78cff'] },
    { t: 'flowers', x: 27.6, z: 20.6, rx: 3.0, rz: 1.6, n: 60, colors: ['#ff9a4a', '#ffd23f', '#fff', '#ff5f6d'] },
    { t: 'flowers', x: 14.6, z: 21.6, rx: 2.6, rz: 1.4, n: 54, colors: ['#b78cff', '#fff', '#ffd23f'] },
    { t: 'flowers', x: 28.4, z: 10.2, rx: 2.2, rz: 1.8, n: 40, colors: ['#fff', '#ff7fa3', '#ffd23f'] },
    { t: 'flowers', x: 5.2, z: 8.6, rx: 2.0, rz: 1.4, n: 36, colors: ['#ffd23f', '#fff', '#ff9a4a'] },
    { t: 'sunflowers', x: 30.0, z: 17.0, n: 6, r: 1.0 },
    { t: 'sunflowers', x: 2.6, z: 21.4, n: 5, r: 0.9 },
    // scatter last
    { scatter: true, t: 'tree', n: 7, in: { rect: [0, 0, 34, 3] }, ground: ['grass'], minDist: 3.2, params: { kinds: ['pine', 'oak', 'birch'], scaleRange: [1.0, 1.35] } },
    { scatter: true, t: 'tree', n: 5, in: { rect: [30.6, 3, 3.4, 20] }, ground: ['grass'], minDist: 3.2, params: { kinds: ['pine', 'oak'], scaleRange: [0.95, 1.3] } },
    { scatter: true, t: 'tree', n: 5, in: { rect: [0, 23.4, 18, 2.6] }, ground: ['grass'], minDist: 3.4, params: { kinds: ['oak', 'birch', 'pine'], scaleRange: [0.95, 1.25] } },
    { scatter: true, t: 'tree', n: 3, in: { rect: [26, 23.4, 8, 2.6] }, ground: ['grass'], minDist: 3.2, params: { kinds: ['oak', 'pine'], scaleRange: [0.95, 1.2] } },
    { scatter: true, t: 'bush', n: 12, in: { rect: [1, 1, 32, 24] }, ground: ['grass'], minDist: 2.6, params: { kinds: ['round', 'flower', 'round'], scaleRange: [0.7, 1.1] } },
    { scatter: true, t: 'rock', n: 8, in: { rect: [1, 1, 32, 24] }, ground: ['grass'], minDist: 3.2, params: { scaleRange: [0.5, 1.0] } },
    { scatter: true, t: 'flowers', n: 14, in: { rect: [1, 12, 32, 12] }, ground: ['grass'], minDist: 2.2, clear: 0.2, params: { rx: 0.9, rz: 0.7, n: 24 } },
  ],
};
