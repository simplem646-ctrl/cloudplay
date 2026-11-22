/** Rye & Rose Bakery (interior, 16x11): warm, flour-dusted. Brick oven on the back wall, pastry counter, kneading table, loft stairs. Pure data. */
export default {
  id: 'bakery',
  size: [16, 11],
  kind: 'interior',
  seed: 41,
  room: {
    wall: 'plaster', wallColor: '#f7dcae', wainscot: '#a8643a', wallH: 3.9,
    windows: [{ at: 6.8, w: 2.2, h: 1.6, curtain: '#d9534a' }, { at: 15.0, w: 1.6, h: 1.6, curtain: '#e8a08a' }],
  },
  exit: { id: 'to_town_square', at: 8 },
  ground: {
    base: 'planks_pale',
    ops: [
      { rug: { rect: [5.6, 6.0, 4.8, 4.2], style: 'striped', colors: ['#c9605a', '#f6e4c0', '#d98a4a'] } },
      { rug: { rect: [2.4, 7.5, 2.6, 2.6], style: 'round', colors: ['#7aa88a', '#f1dfb4', '#c9605a'] } },
      { rug: { rect: [11.4, 7.5, 2.6, 2.6], style: 'round', colors: ['#6f9bd0', '#f1dfb4', '#c9605a'] } },
    ],
  },
  anchors: {
    counter_front: [6.2, 6.0, 'n'],
    behind_counter: [7.4, 3.0, 's'],
    oven_spot: [11.2, 2.7, 'n'],
    kneading_table: [13.0, 5.2, 'n'],
    table_bk_1: [3.6, 9.4, 'n'],
    table_bk_2: [12.6, 9.4, 'n'],
    window_bk: [15.0, 2.4, 'n'],
    upstairs: [1.0, 7.3, 'n'],
  },
  props: [
    // back wall: bread rack, hanging sign, low dresser under the window, oven, clock
    { t: 'bread_rack', x: 3.6, z: 0.75, w: 2.2, h: 2.0, tiers: 3 },
    { t: 'wall_sign', x: 3.6, y: 2.4, text: 'Rye & Rose', w: 2.0, h: 0.62, bg: '#f4d9a0', fg: '#8a3a2a', icon: '' },
    { t: 'cupboard', x: 6.8, z: 0.7, w: 2.2, h: 1.0, color: '#c4915a' },
    { t: 'plant', x: 5.9, z: 0.5, scale: 0.7, kind: 'flower' },
    { t: 'clock_wall', x: 8.75, y: 1.9 },
    { t: 'brick_oven', x: 11.4, z: 1.6, w: 3.0, id: 'oven', label: 'Brick oven' },
    { t: 'shelf', x: 15.0, y: 1.0, w: 1.4 },

    // stairs up to the baker's flat
    { t: 'loft_stairs', x: 0.95, z: 6.5, dir: 's', w: 1.4 },

    // shop counter: pastry cases + till counter
    { t: 'display_case', x: 6.2, z: 5.0, w: 3.6, id: 'shop_bakery', type: 'shop', label: 'Bakery counter' },
    { t: 'counter', x: 9.9, z: 5.0, w: 2.8 },
    { t: 'tabletop', x: 9.9, z: 4.55, y: 1.1, kind: 'loaves' },
    { t: 'lamp_table', x: 11.0, z: 4.55, y: 1.1 },
    { t: 'stool', x: 8.0, z: 3.4 },

    // kneading table, flour sacks, wood
    { t: 'table', x: 13.2, z: 3.6, w: 2.4, d: 1.2, id: 'job_bakery', type: 'job', label: 'Kneading table', ix: 13.2, iz: 5.2 },
    { t: 'tabletop', x: 13.2, z: 3.6, y: 0.85, kind: 'dough' },
    { t: 'sack', x: 15.3, z: 5.3 },
    { t: 'sack', x: 15.35, z: 5.9 },
    { t: 'barrel', x: 15.2, z: 4.4, scale: 0.85 },

    // cafe corner
    { t: 'table', x: 3.6, z: 8.3, w: 1.3, round: true, cloth: '#f6e0c4' },
    { t: 'chair', x: 2.6, z: 8.3, dir: 'e' },
    { t: 'chair', x: 4.6, z: 8.3, dir: 'w' },
    { t: 'table', x: 12.6, z: 8.3, w: 1.3, round: true, cloth: '#d6e6f4' },
    { t: 'chair', x: 11.6, z: 8.3, dir: 'e' },
    { t: 'chair', x: 13.6, z: 8.3, dir: 'w' },
    { t: 'plant', x: 15.2, z: 9.9, scale: 1.1 },
    { t: 'plant', x: 0.8, z: 9.9, scale: 1.0, kind: 'flower' },
    { t: 'lamp_table', x: 1.0, z: 8.7, floor: true },
    { t: 'painting', x: 1.0, y: 2.3, w: 0.9, h: 0.7 },
  ],
};
