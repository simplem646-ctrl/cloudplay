/**
 * Harbor: seaside. Blues, sand and weathered wood. Long pier, moored boats, net racks, crates, beach with shells,
 * the little fishing hut, a lighthouse on the rocky point, animated sea with foam. Decor: midsummer. Pure data.
 */
const shore = [[-2, 19.2], [4, 18.6], [10, 19.3], [16, 19.0], [22, 19.4], [28, 18.8], [33, 19.2], [35.5, 19.8], [36.8, 22.4], [38.4, 24.6], [42, 25.4], [46, 25.0], [46, 31], [-2, 31]];

export default {
  id: 'harbor',
  size: [44, 28],
  kind: 'exterior',
  seed: 77,
  camStart: 'pier_start',
  ground: {
    base: 'grass',
    ops: [
      { kind: 'meadow', poly: [[1, 1], [14, 0.5], [16, 5], [8, 6.6], [1, 6]] },
      { kind: 'meadow', poly: [[28, 0.5], [43, 1], [43, 7], [33, 7.4]] },
      { kind: 'moss', ellipse: [20.5, 4.0, 3.0, 1.4] },
      // sand beach
      { kind: 'sand', poly: [[-1, 14.7], [8, 15.3], [16, 14.2], [26, 14.8], [36, 14.0], [45, 14.6], [45, 26], [-1, 23]] },
      // roads: west entrance, north entrance, to the pier and to the hut
      { kind: 'dirt', path: [[-1, 10.0], [6, 10.4], [14, 10.0], [22, 10.6], [30, 11.0], [34, 12.4], [38.4, 14.4]], w: 2.6, wobble: 0.07 },
      { kind: 'dirt', path: [[6.5, -1.5], [6.4, 4], [6.8, 9.6]], w: 2.4, wobble: 0.06 },
      { kind: 'cobble', rect: [19.6, 11.6, 8.8, 3.4], r: 0.9 },
      { kind: 'flagstone', rect: [21.4, 14.4, 5.2, 1.3], r: 0.3 },
      { kind: 'deck', rect: [34.6, 13.2, 6.8, 2.0] },
      { kind: 'planks_dark', rect: [4.6, 14.4, 4.8, 1.0] },
      // the sea (foam is part of the water rim) + rocky point for the lighthouse
      { kind: 'water', poly: shore, flow: [0.035, 0.02], deep: '#1b6a9c', shallow: '#62c0d0', scale: 1.5 },
      { kind: 'stone', ellipse: [41.2, 21.4, 4.6, 3.4] },
      { kind: 'sand', ellipse: [38.2, 20.2, 2.4, 1.6] },
      { kind: 'moss', ellipse: [43.2, 19.6, 1.8, 1.2] },
    ],
  },
  edges: [
    { id: 'to_market_street', side: 'w', at: [8.2, 11.8] },
    { id: 'to_riverside_park', side: 'n', at: [4.5, 8.5] },
  ],
  anchors: {
    pier_start: [24, 16.6, 's'],
    pier_end: [24, 25.6, 's'],
    beach_shells: [31.6, 17.6, 's'],
    boat_dock: [11, 22.0, 's'],
    hut_steps: [38.4, 14.9, 'n'],
    net_rack: [14.8, 13.9, 'n'],
    harbor_bench_spot: [30.4, 16.4, 's'],
    sunset_spot: [8.0, 17.4, 's'],
    // just west of the tower: the follow camera cannot centre on the rocky point at the far east end, so anything standing on
    // it (the old anchor at 41.4, 23.9) fell outside the frame; this spot is always on screen
    lighthouse_base: [38.4, 21.3, 'e'],
    crates: [17.6, 16.8, 'n'],
  },
  critters: [
    { kind: 'gull', count: 4, bounds: { x: 2, z: 13, w: 40, h: 10 } },
    { kind: 'crab', count: 2, bounds: { x: 2, z: 16, w: 32, h: 3 } },
    { kind: 'sparrow', count: 3, bounds: { x: 2, z: 2, w: 40, h: 12 } },
    { kind: 'cat', count: 1, bounds: { x: 26, z: 6, w: 10, h: 6 } },
    { kind: 'dog', count: 1, bounds: { x: 8, z: 11, w: 12, h: 4 } },
    { kind: 'butterfly', count: 2, bounds: { x: 2, z: 2, w: 14, h: 5 } },
  ],
  grass: { density: 0.8, avoid: [[-1, 14, 46, 14]] },
  props: [
    // ---- sheds along the road
    { t: 'house', x: 14.0, z: 7.8, w: 5.8, d: 4.2, h: 3.3, wall: 'wood', wallColor: '#a9c3d0', roof: 'red', rise: 1.5, overhang: 0.6, baseColor: '#8c8272',
      door: { at: -1.2, w: 1.5, color: '#c9453a', mat: false, lantern: true },
      windows: [{ at: 1.5, w: 1.1, h: 1.0, y: 1.5, shutters: '#fff4de', box: '#c9605a' }],
      sign: { text: 'Net Loft', at: 1.7, y: 2.4, w: 1.3, h: 0.5, style: 'plaque', bg: '#3a5a78', fg: '#f4e6c0' },
      chimney: { at: 1.6, smoke: true, rate: 1.0 }, seed: 3 },
    { t: 'house', x: 28.2, z: 8.6, w: 6.6, d: 4.6, h: 3.5, wall: 'timber', wallColor: '#f4ead4', roof: 'blue', rise: 1.7,
      door: { at: 0.8, w: 1.5, color: '#3f6fa8', mat: false },
      windows: [{ at: -2.0, w: 1.6, h: 1.2, y: 1.2, shutters: '#3f6fa8', box: true }, { at: 2.4, w: 1.0, h: 1.1, y: 1.3, shutters: '#3f6fa8', box: '#ffd23f' }],
      awning: { at: -2.0, w: 3.0, y: 2.4, d: 1.2, colors: ['#3f6fa8', '#fff4e0'] },
      sign: { text: 'Chandlery', at: 2.6, y: 2.0, w: 1.4, h: 0.55, style: 'hang', bg: '#e8d4a0', fg: '#2f4a68' },
      chimney: { at: -2.4, smoke: false }, seed: 5 },
    { t: 'woodpile', x: 17.4, z: 8.2, w: 1.4 },
    { t: 'barrel', x: 31.8, z: 9.6, scale: 0.9 },
    { t: 'crates', x: 10.8, z: 9.0, n: 2 },
    { t: 'laundry', pts: [[16.8, 9.6], [20.4, 9.2]], y: 2.6 },

    // ---- fishing hut
    { t: 'house', x: 38.0, z: 13.0, w: 5.6, d: 4.2, h: 3.2, wall: 'wood', wallColor: '#c8b08c', roof: 'brown', rise: 1.5, overhang: 0.7, baseColor: '#7a6e5e',
      door: { at: 0.4, w: 1.5, transition: 'to_fishing_hut', color: '#3f8aa8', mat: false, lantern: true },
      windows: [{ at: -1.8, w: 1.0, h: 1.0, y: 1.5, shutters: '#3f8aa8', box: '#e8c05a' }, { at: 2.0, w: 0.9, h: 0.9, y: 1.6, shutters: true }],
      chimney: { at: -1.6, smoke: true, rate: 1.4 }, patch: true, seed: 8 },
    { t: 'net_rack', x: 34.4, z: 11.0, w: 2.6, rot: 0.15 },
    { t: 'barrel', x: 35.6, z: 12.4, scale: 0.85 },
    { t: 'crates', x: 41.2, z: 11.0, n: 3, rot: 0.2 },
    { t: 'boat', x: 41.0, z: 15.8, rot: 0.3, color: '#d9534a' },
    { t: 'sack', x: 35.2, z: 13.4 },

    // ---- quay: net rack, crates, benches, signs
    { t: 'net_rack', x: 15.0, z: 12.6, w: 3.0 },
    { t: 'crates', x: 17.6, z: 15.4, n: 3 },
    { t: 'barrel', x: 16.4, z: 15.7, scale: 0.9 },
    { t: 'barrel', x: 18.6, z: 15.9, scale: 0.8 },
    { t: 'crates', x: 28.4, z: 12.9, n: 2, rot: 0.1 },
    { t: 'bench', x: 30.4, z: 15.2, dir: 's', w: 1.9, id: 'bench_hb_1', label: 'Bench', text: 'A salty bench with a view of the whole bay.' },
    { t: 'bench', x: 8.0, z: 16.2, dir: 's', w: 1.8 },
    { t: 'signpost', x: 3.8, z: 12.4, id: 'sign_hb', board: 'Harbor', label: 'Signpost',
      text: 'Harbor: Market Street to the west, Riverside Park to the north-west, the fishing hut to the east.' },
    { t: 'planter', x: 20.4, z: 12.2, w: 1.2, colors: ['#ff8aa8', '#fff', '#ffd23f'] },
    { t: 'planter', x: 27.6, z: 12.0, w: 1.2, colors: ['#9ac8ff', '#fff', '#ff8aa8'] },

    // lamps
    { t: 'lamp_post', x: 6.0, z: 11.8, id: 'lamp_hb_1' },
    { t: 'lamp_post', x: 17.6, z: 11.8, id: 'lamp_hb_2' },
    { t: 'lamp_post', x: 21.6, z: 14.6, id: 'lamp_hb_3' },
    { t: 'lamp_post', x: 26.6, z: 14.6, id: 'lamp_hb_4' },
    { t: 'lamp_post', x: 36.2, z: 15.8, id: 'lamp_hb_5' },

    // ---- main pier, jetty, boats
    { t: 'pier', x: 24, z: 15.3, len: 11.4, w: 2.6, dir: 's' },
    { t: 'bollard', x: 22.9, z: 17.4 },
    { t: 'bollard', x: 25.1, z: 17.4 },
    { t: 'bollard', x: 22.9, z: 22.2 },
    { t: 'bollard', x: 25.1, z: 24.6 },
    { t: 'crates', x: 25.0, z: 20.2, n: 2, rot: 0.15 },
    { t: 'barrel', x: 22.95, z: 20.4, scale: 0.8 },
    { t: 'boat', x: 21.2, z: 21.4, rot: Math.PI / 2, color: '#4f7fb5' },
    { t: 'boat', x: 27.0, z: 23.6, rot: Math.PI / 2 + 0.1, color: '#e8c05a' },
    { t: 'boat', x: 31.6, z: 22.2, rot: 0.4, color: '#4f9a8a' },
    { t: 'pier', x: 11, z: 16.2, len: 6.6, w: 1.8, dir: 's' },
    { t: 'boat', x: 13.4, z: 20.6, rot: Math.PI / 2, color: '#d9534a' },
    { t: 'boat', x: 8.6, z: 21.8, rot: Math.PI / 2 - 0.15, color: '#3f6fa8' },
    { t: 'bollard', x: 11.9, z: 21.8, scale: 0.9 },

    // fishing + foraging
    { t: 'marker', id: 'fishing_hb_1', type: 'fishing', x: 23.0, z: 23.6, r: 1.4, label: 'Pier fishing', text: 'The water under the pier is deep and green.' },
    { t: 'marker', id: 'fishing_hb_2', type: 'fishing', x: 24.2, z: 26.0, r: 1.4, label: 'Pier fishing', text: 'The end of the pier: big fish, big dreams.' },
    { t: 'marker', id: 'fishing_hb_3', type: 'fishing', x: 15.4, z: 18.2, r: 1.4, label: 'Beach fishing', text: 'Small waves lap at the sand. Something shimmers beyond.' },
    { t: 'marker', id: 'fishing_hb_4', type: 'fishing', x: 31.2, z: 18.2, r: 1.4, label: 'Beach fishing', text: 'A quiet spot between the rocks and the surf.' },
    { t: 'forage_spot', id: 'forage_hb_1', x: 4.6, z: 17.2, label: 'Shell cluster' },
    { t: 'forage_spot', id: 'forage_hb_2', x: 19.6, z: 17.6, label: 'Seaweed and shells' },
    { t: 'forage_spot', id: 'forage_hb_3', x: 33.2, z: 18.0, label: 'Beach finds' },
    { t: 'forage_spot', id: 'forage_hb_4', x: 8.8, z: 3.8, label: 'Dune herbs' },
    { t: 'shells', x: 4.6, z: 17.2, n: 12, r: 1.2 },
    { t: 'shells', x: 31.6, z: 17.6, n: 14, r: 1.6 },
    { t: 'shells', x: 19.6, z: 17.6, n: 9, r: 1.2 },
    { t: 'shells', x: 12.0, z: 17.8, n: 7, r: 1.0 },
    { t: 'shells', x: 37.2, z: 18.0, n: 8, r: 1.0 },
    { t: 'rock', x: 28.4, z: 17.8, scale: 0.9, color: '#9a9690' },
    { t: 'rock', x: 34.8, z: 17.2, scale: 0.8, color: '#a8a49c' },
    { t: 'rock', x: 5.6, z: 19.8, scale: 0.9 },
    { t: 'rock', x: 38.6, z: 23.6, scale: 1.0, color: '#8a8680' },
    { t: 'rock', x: 44.0, z: 22.4, scale: 1.1, color: '#8a8680' },
    { t: 'rock', x: 40.0, z: 18.6, scale: 0.8, color: '#9a9690' },

    // ---- lighthouse on the rocky point (decorative landmark)
    { t: 'lighthouse', x: 41.4, z: 20.6, h: 9.5, r: 1.7, stripe: '#3f6fa8' },

    // ---- greenery and scatter AFTER buildings so it avoids them
    { t: 'tree', kind: 'pine', x: 3.0, z: 6.6, scale: 1.15, seed: 2 },
    { t: 'tree', kind: 'oak', x: 21.8, z: 5.4, scale: 1.1, seed: 5 },
    { t: 'tree', kind: 'pine', x: 36.0, z: 5.6, scale: 1.2, seed: 7 },
    { t: 'flowers', x: 9.6, z: 4.4, rx: 2.0, rz: 0.9, n: 30 },
    { t: 'flowers', x: 24.6, z: 5.6, rx: 1.6, rz: 0.8, n: 26, colors: ['#9ac8ff', '#fff', '#b78cff'] },
    { t: 'bush', kind: 'hedge', x: 9.0, z: 12.2, w: 3.0 },
    { t: 'bush', kind: 'flower', x: 12.4, z: 12.2, scale: 0.9 },
    { scatter: true, t: 'tree', n: 12, in: { rect: [0, 0, 44, 3.6] }, minDist: 3.0, params: { kinds: ['pine', 'oak', 'pine', 'birch'], scaleRange: [0.95, 1.3] } },
    { scatter: true, t: 'tree', n: 3, in: { rect: [0, 3, 2.6, 8] }, minDist: 3.6, params: { kinds: ['pine', 'oak'], scaleRange: [1.0, 1.25] } },
    { scatter: true, t: 'tree', n: 3, in: { rect: [41.4, 3, 2.6, 7] }, minDist: 3.6, params: { kinds: ['pine', 'oak'], scaleRange: [1.0, 1.25] } },
    { scatter: true, t: 'flowers', n: 8, in: { rect: [1, 1, 42, 8] }, minDist: 2, clear: 0.3, params: { rx: 0.8, rz: 0.6, n: 22 } },
    { scatter: true, t: 'bush', n: 10, in: { rect: [1, 0.5, 42, 9] }, minDist: 2.6, params: { kinds: ['round', 'flower'], scaleRange: [0.8, 1.1] } },
    { scatter: true, t: 'rock', n: 4, in: { rect: [1, 1, 42, 8] }, minDist: 4, params: { scaleRange: [0.6, 0.9] } },
  ],
  decor: {
    midsummer: [
      // string lights and flags down the pier
      { t: 'lantern_string', pts: [[22.5, 15.8], [22.5, 21.0], [22.5, 26.2]], y: 3.1, sag: 0.5, poles: true, colors: ['#ffd23f', '#ffb347', '#fff0b0'] },
      { t: 'lantern_string', pts: [[25.5, 15.8], [25.5, 21.0], [25.5, 26.2]], y: 3.1, sag: 0.5, poles: true, colors: ['#ffd23f', '#ffb347', '#fff0b0'] },
      { t: 'lantern_string', pts: [[22.5, 15.8], [25.5, 15.8]], y: 3.2, sag: 0.3, poles: false },
      { t: 'lantern_string', pts: [[22.5, 26.0], [25.5, 26.0]], y: 3.2, sag: 0.3, poles: false },
      { t: 'bunting', pts: [[22.5, 17.6], [22.5, 21.0]], y: 2.6, sag: 0.4, colors: ['#3f8aa8', '#fff4e0', '#ffd23f', '#d9534a'], poles: false },
      { t: 'bunting', pts: [[25.5, 17.6], [25.5, 21.0]], y: 2.6, sag: 0.4, colors: ['#3f8aa8', '#fff4e0', '#ffd23f', '#d9534a'], poles: false },
      // beach: flags + lights on posts
      { t: 'bunting', pts: [[2.5, 13.4], [8, 13.8], [14, 13.4]], y: 3.6, sag: 0.8, colors: ['#3f8aa8', '#fff4e0', '#ffd23f', '#e8645a'], poles: true },
      { t: 'bunting', pts: [[28.5, 15.0], [33.5, 15.4], [38.0, 15.0]], y: 3.2, sag: 0.7, colors: ['#3f8aa8', '#fff4e0', '#ffd23f', '#e8645a'], poles: true },
      { t: 'lantern_string', pts: [[3.0, 18.0], [9, 18.6], [15.0, 18.0]], y: 3.2, sag: 0.7, colors: ['#ff8a5a', '#ffd23f', '#ff7fa3'] },
      { t: 'lantern_string', pts: [[27.0, 18.2], [31.5, 18.8], [36.0, 18.2]], y: 3.2, sag: 0.7, colors: ['#ff8a5a', '#ffd23f', '#ff7fa3'] },
      // a little stage with benches facing it
      { t: 'stage', x: 4.6, z: 17.2, w: 5.0, d: 2.6 },
      { t: 'bench', x: 3.2, z: 18.2, dir: 'n', w: 1.6 },
      { t: 'bench', x: 6.2, z: 18.2, dir: 'n', w: 1.6 },
      { t: 'bunting', pts: [[2.0, 14.4], [4.6, 14.9], [7.4, 14.4]], y: 3.2, sag: 0.5, colors: ['#3f8aa8', '#fff4e0', '#ffd23f', '#e8645a'], poles: true },
      { t: 'floating_lanterns', pts: [[19.0, 21.0], [18.0, 23.8], [28.4, 21.0], [29.8, 25.0], [20.2, 26.2], [16.2, 21.6], [33.8, 23.6], [36.0, 26.4]], colors: ['#ff8a5a', '#ffd23f', '#ff7fa3', '#9ad0ff'] },
    ],
  },
};
