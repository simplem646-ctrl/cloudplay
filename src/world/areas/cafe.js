/** Copper Kettle Café (interior, 16x11): copper pots, long counter, coffee machine, three tables, upright piano, window nook, loft stairs. Pure data. */
export default {
  id: 'cafe',
  size: [16, 11],
  kind: 'interior',
  seed: 47,
  room: {
    wall: 'plaster', wallColor: '#d3e8da', wainscot: '#3f6a62', wallH: 3.9, trim: '#fff4de',
    windows: [{ at: 3.4, w: 2.6, h: 1.8, curtain: '#e8a08a' }, { at: 12.2, w: 1.6, h: 1.2, y: 1.9, curtain: '#4f9a8a' }],
  },
  exit: { id: 'to_town_square', at: 8 },
  ground: {
    base: 'planks_dark',
    ops: [
      { rug: { rect: [5.8, 6.6, 4.4, 3.8], style: 'striped', colors: ['#3f6a62', '#f1dfb4', '#c97a3a'] } },
      { rug: { rect: [2.5, 7.4, 2.0, 2.0], style: 'round', colors: ['#c97a3a', '#f1dfb4', '#3f6a62'] } },
      { rug: { rect: [11.6, 7.4, 2.0, 2.0], style: 'round', colors: ['#c97a3a', '#f1dfb4', '#3f6a62'] } },
      { rug: { rect: [12.9, 1.8, 2.6, 1.5], style: 'floral', colors: ['#b4533f', '#f1dfb4', '#4f7a6a'] } },
    ],
  },
  anchors: {
    counter_front: [8.4, 6.0, 'n'],
    behind_counter: [8.4, 3.2, 's'],
    coffee_machine_spot: [8.4, 1.9, 'n'],
    table_cf_1: [3.4, 9.4, 'n'],
    table_cf_2: [12.6, 9.4, 'n'],
    table_cf_3: [3.4, 4.5, 'n'],
    piano_spot: [14.0, 1.6, 'n'],
    upstairs: [1.0, 7.3, 'n'],
  },
  props: [
    // back wall: window nook, sign, coffee machine + copper pots, painting, piano
    { t: 'window_seat', x: 3.4, z: 1.35, w: 2.6, color: '#d9856a' },
    { t: 'plant', x: 5.1, z: 0.55, scale: 0.8, kind: 'flower' },
    { t: 'wall_sign', x: 6.1, y: 2.45, text: 'Copper Kettle', w: 1.7, h: 0.6, bg: '#e8c88c', fg: '#6a3a1c' },
    { t: 'coffee_machine', x: 8.4, z: 0.85, w: 1.8, id: 'coffee_machine', label: 'Coffee machine' },
    { t: 'pot_rail', x: 8.4, y: 3.0, w: 3.0 },
    { t: 'painting', x: 10.9, y: 1.9, w: 0.9, h: 0.75 },
    { t: 'piano', x: 14.0, z: 0.8, w: 2.1, id: 'piano_cf', label: 'Piano' },

    // stairs to the flat above
    { t: 'loft_stairs', x: 0.95, z: 6.5, dir: 's', w: 1.4 },

    // long counter and cake case
    { t: 'counter', x: 8.4, z: 5.0, w: 3.6, id: 'shop_cafe', type: 'shop', label: 'Café counter' },
    { t: 'display_case', x: 11.4, z: 5.0, w: 2.4 },
    { t: 'tabletop', x: 7.6, z: 4.55, y: 1.1, kind: 'cups' },
    { t: 'tabletop', x: 9.3, z: 4.55, y: 1.1, kind: 'pot' },
    { t: 'lamp_table', x: 8.4, z: 4.55, y: 1.1 },
    { t: 'stool', x: 7.2, z: 3.3 },
    { t: 'barrel', x: 5.8, z: 2.2, scale: 0.8 },
    { t: 'shelf', x: 11.0, y: 1.2, w: 1.6, z: 0.3 },

    // tables
    { t: 'table', x: 3.4, z: 3.1, w: 1.4, round: true, cloth: '#f4e0c4' },
    { t: 'chair', x: 2.4, z: 3.1, dir: 'e', color: '#3f6a62' },
    { t: 'chair', x: 4.4, z: 3.1, dir: 'w', color: '#3f6a62' },
    { t: 'table', x: 3.4, z: 8.3, w: 1.4, round: true, cloth: '#f6c8b0' },
    { t: 'chair', x: 2.4, z: 8.3, dir: 'e', color: '#c97a3a' },
    { t: 'chair', x: 4.4, z: 8.3, dir: 'w', color: '#c97a3a' },
    { t: 'table', x: 12.6, z: 8.3, w: 1.4, round: true, cloth: '#cfe6d8' },
    { t: 'chair', x: 11.6, z: 8.3, dir: 'e', color: '#c97a3a' },
    { t: 'chair', x: 13.6, z: 8.3, dir: 'w', color: '#c97a3a' },
    { t: 'plant', x: 15.2, z: 9.9, scale: 1.1 },
    { t: 'plant', x: 0.8, z: 9.9, scale: 1.0, kind: 'flower' },
    { t: 'lamp_table', x: 15.2, z: 6.0, floor: true },
    { t: 'plant', x: 15.2, z: 5.0, scale: 0.9, kind: 'flower' },
  ],
};
