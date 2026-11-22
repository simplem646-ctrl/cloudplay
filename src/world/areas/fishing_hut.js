/** Pelham's Fishing Hut (interior, 14x10). Sea-weathered planks, tackle wall, stove, bunk, nets, a mounted fish and a ship in a bottle. Pure data. */
export default {
  id: 'fishing_hut',
  size: [14, 10],
  kind: 'interior',
  seed: 81,
  room: {
    wall: 'wood', wallColor: '#b4c0b4', wainscot: '#4f6f80', trim: '#e8e4d0', wallH: 3.7,
    windows: [{ at: 3.5, w: 1.2, h: 1.3, y: 1.6, curtain: '#e8e0c0' }, { at: 11.6, w: 1.0, h: 1.0, y: 1.9, curtain: '#d98a6a' }],
  },
  exit: { id: 'to_harbor', at: 7 },
  ground: {
    base: 'planks_dark',
    ops: [
      { rug: { rect: [1.4, 5.2, 3.6, 2.8], style: 'round', colors: ['#2f4a6a', '#e8dcc0', '#c9604a'] } },
      { rug: { rect: [8.0, 7.6, 3.6, 1.6], style: 'striped', colors: ['#2f4a6a', '#e8dcc0', '#4f8a8a'] } },
    ],
  },
  anchors: {
    counter_front: [9.0, 7.5, 'n'],
    behind_counter: [9.0, 4.4, 's'],
    tackle_wall_spot: [6.4, 2.4, 'n'],
    ledger_spot: [12.8, 7.3, 'n'],
    stove_fh: [12.9, 3.0, 'n'],
    bunk: [1.3, 4.3, 'n'],
  },
  props: [
    // back wall: bunk, window, tackle wall, nets, mounted fish, stove
    { t: 'bed', x: 1.4, z: 0.45, w: 1.5, color: '#4f6f90' },
    { t: 'wall_item', kind: 'chart', x: 1.4, y: 2.5, w: 0.9, h: 0.7 },
    { t: 'tackle_wall', x: 6.5, w: 3.2, id: 'tackle_wall' },
    { t: 'wall_item', kind: 'net', x: 9.2, y: 1.2, w: 1.6, h: 1.6 },
    { t: 'wall_item', kind: 'fish', x: 10.8, y: 2.5, color: '#6aa0b8' },
    { t: 'stove', x: 13.0, z: 1.8, id: 'stove_fh', label: 'Stove', text: 'A potbelly stove with a dented kettle that is always almost boiling.' },
    { t: 'plant', x: 5.0, z: 1.2, scale: 0.9 },
    { t: 'barrel', x: 8.2, z: 1.0, scale: 0.9 },
    { t: 'woodpile', x: 10.6, z: 3.5, w: 1.0 },
    { t: 'wall_sconce', x: 8.4, y: 2.2 },
    // counter + shelf
    { t: 'counter', x: 9.0, z: 6.4, w: 3.0, id: 'shop_fishing', type: 'shop', label: 'Counter', text: "Pelham's bait and tackle." },
    { t: 'bottle_ship', x: 7.9, y: 1.1, z: 5.9 },
    { t: 'lamp_table', x: 10.1, z: 5.9, y: 1.1 },
    { t: 'crates', x: 8.9, z: 5.9, n: 1 },
    { t: 'hanging_lamp', x: 9.0, z: 6.0, y: 3.0, color: '#ffd090' },
    { t: 'stool', x: 7.6, z: 4.6 },
    // ledger
    { t: 'ledger_stand', x: 12.8, z: 5.8, id: 'fish_ledger' },
    // front left: bait table, stools
    { t: 'table', x: 3.2, z: 6.6, w: 1.5, d: 1.5, round: true, cloth: '#e8c8a0' },
    { t: 'stool', x: 2.1, z: 6.6 }, { t: 'stool', x: 4.3, z: 6.6 }, { t: 'stool', x: 3.2, z: 7.8 },
    { t: 'hanging_lamp', x: 3.2, z: 6.6, y: 3.0, size: 0.9 },
    // front right: crates of fish, nets, barrels
    { t: 'crates', x: 12.6, z: 8.8, n: 3 },
    { t: 'barrel', x: 13.4, z: 4.6, scale: 0.85 },
    { t: 'barrel', x: 11.6, z: 9.1, scale: 0.8 },
    { t: 'sack', x: 1.0, z: 9.1 },
    { t: 'plant', x: 0.9, z: 3.4, scale: 0.8, kind: 'flower' },
    { t: 'chest', x: 5.6, z: 9.3, dir: 's' },
  ],
};
