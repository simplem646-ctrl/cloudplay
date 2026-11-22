/** Pennywhistle Provisions (interior, 16x11): crowded shelves, barrels, shop counter, post counter with pigeonholes, back room. Pure data. */
export default {
  id: 'general_store',
  size: [16, 11],
  kind: 'interior',
  seed: 43,
  room: {
    wall: 'plaster', wallColor: '#efe0bd', wainscot: '#4f7a5a', wallH: 3.9, trim: '#fff4de',
    windows: [{ at: 4.1, w: 1.8, h: 1.6, curtain: '#4f9a6a' }, { at: 12.9, w: 1.4, h: 1.2, y: 1.9, curtain: '#e8c05a' }],
  },
  exit: { id: 'to_market_street', at: 8 },
  ground: {
    base: 'planks',
    ops: [
      { rug: { rect: [5.8, 6.4, 4.4, 4.0], style: 'striped', colors: ['#4f7a5a', '#f1dfb4', '#c9605a'] } },
      { rug: { rect: [8.6, 3.0, 3.0, 1.6], style: 'floral', colors: ['#c9605a', '#f1dfb4', '#6f9bd0'] } },
    ],
  },
  anchors: {
    counter_front: [4.4, 6.2, 'n'],
    behind_counter: [4.4, 3.6, 's'],
    post_counter_spot: [9.9, 3.8, 'n'],
    shelf_row_1: [4.2, 9.5, 'n'],
    shelf_row_2: [11.6, 9.5, 'n'],
    back_room: [13.3, 2.4, 'n'],
  },
  props: [
    // back wall: shelves, window, mail corner
    { t: 'goods_shelf', x: 1.6, z: 0.75, w: 2.4, h: 2.5, tiers: 4 },
    { t: 'wall_sign', x: 1.6, y: 2.85, text: 'Provisions', w: 2.0, h: 0.55, bg: '#f0d9a0', fg: '#3f6a4a' },
    { t: 'goods_shelf', x: 6.5, z: 0.75, w: 2.4, h: 2.5, tiers: 4, id: 'shelf_gs_1', label: 'Shop shelves' },
    { t: 'pigeonholes', x: 9.9, z: 0.6, w: 2.6, h: 2.0 },
    { t: 'counter', x: 9.9, z: 2.7, w: 3.0, id: 'post_counter', type: 'job', label: 'Post counter' },
    { t: 'tabletop', x: 9.4, z: 2.3, y: 1.1, kind: 'loaves' },
    { t: 'lamp_table', x: 10.9, z: 2.3, y: 1.1 },
    { t: 'clock_wall', x: 8.2, y: 1.9 },

    // back room behind a low partition
    { t: 'fence', kind: 'rail', pts: [[11.5, 0.2], [11.5, 3.5], [15.7, 3.5]], gaps: [[4.3, 5.9]], color: '#8a5a34', h: 1.3 },
    { t: 'crates', x: 14.8, z: 1.1, n: 3 },
    { t: 'crates', x: 12.5, z: 1.0, n: 2, rot: 0.2 },
    { t: 'barrel', x: 13.5, z: 0.8, scale: 0.9 },
    { t: 'barrel', x: 14.2, z: 2.6, scale: 0.8 },
    { t: 'sack', x: 15.2, z: 2.7 },
    { t: 'sack', x: 12.5, z: 2.7 },
    { t: 'lamp_table', x: 12.2, z: 1.9, floor: true },

    // shop counter with till
    { t: 'counter', x: 4.4, z: 5.1, w: 4.4, id: 'shop_general', type: 'shop', label: 'Shop counter' },
    { t: 'tabletop', x: 3.4, z: 4.65, y: 1.1, kind: 'cups' },
    { t: 'tabletop', x: 5.4, z: 4.65, y: 1.1, kind: 'loaves' },
    { t: 'stool', x: 2.9, z: 3.6 },

    // free-standing shelf rows
    { t: 'goods_shelf', x: 4.2, z: 8.7, w: 3.0, h: 1.9, tiers: 3 },
    { t: 'goods_shelf', x: 11.6, z: 8.7, w: 3.0, h: 1.9, tiers: 3 },

    // barrels, sacks, crates all round
    { t: 'barrel', x: 15.2, z: 5.4, scale: 0.95 },
    { t: 'barrel', x: 15.2, z: 6.4, scale: 0.85 },
    { t: 'barrel', x: 14.5, z: 5.9, scale: 0.8 },
    { t: 'crates', x: 15.0, z: 7.4, n: 2, rot: 0.1 },
    { t: 'sack', x: 0.9, z: 6.0 },
    { t: 'sack', x: 0.85, z: 6.6 },
    { t: 'crates', x: 0.9, z: 7.8, n: 3 },
    { t: 'barrel', x: 0.8, z: 9.2, scale: 0.9 },
    { t: 'plant', x: 15.2, z: 9.9, scale: 1.0 },
    { t: 'plant', x: 7.0, z: 10.0, scale: 0.8, kind: 'flower' },
    { t: 'hanging_herbs', x: 6.0, z: 6.0, y: 3.3 },
    { t: 'rack', x: 14.4, y: 1.8 },
  ],
};
