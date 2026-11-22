/** Starview Observatory (interior, 14x12). Dusky indigo room under the dome: brass telescope, star-map table, desk, spiral stairs and a cot. Pure data. */
export default {
  id: 'observatory',
  size: [14, 12],
  kind: 'interior',
  seed: 101,
  room: {
    wall: 'plaster', wallColor: '#a49acb', wainscot: '#2f2a4a', trim: '#e8dcc0', wallH: 4.6,
    windows: [],
  },
  exit: { id: 'to_starview_hill', at: 7 },
  ground: {
    base: 'planks_dark',
    ops: [
      { rug: { rect: [3.2, 2.2, 7.6, 7.2], style: 'round', colors: ['#2a2f6a', '#e0b870', '#7a3a6a'] } },
      { rug: { rect: [5.2, 4.2, 3.6, 3.2], style: 'round', colors: ['#7a3a6a', '#e8dcc0', '#2a2f6a'] } },
      { rug: { rect: [0.5, 4.2, 1.9, 2.4], style: 'striped', colors: ['#4a4a8a', '#e8dcc0', '#7a3a6a'] } },
    ],
  },
  anchors: {
    telescope_big_spot: [7.0, 5.2, 'n'],
    desk_obs_spot: [11.4, 3.5, 'n'],
    star_map_spot: [3.3, 7.4, 'n'],
    stairs_obs: [11.6, 10.4, 'n'],
    cot: [1.5, 4.5, 'n'],
  },
  props: [
    // back wall: cot, star charts, dome slit, desk
    { t: 'bed', x: 1.45, z: 0.45, w: 1.3, color: '#5a6aa8', label: 'Cot', text: 'A narrow cot for long nights of stargazing.' },
    { t: 'wall_item', kind: 'stars', x: 4.2, y: 1.9, w: 1.6, h: 1.15 },
    { t: 'wall_item', kind: 'sky', x: 7.0, y: 0.95, w: 1.8, h: 2.9 },
    { t: 'wall_item', kind: 'chart', x: 9.7, y: 2.1, w: 1.2, h: 0.9 },
    { t: 'wall_sconce', x: 5.8, y: 2.6 },
    { t: 'wall_sconce', x: 8.2, y: 2.6 },
    { t: 'desk', x: 11.7, z: 2.3, w: 2.4, id: 'desk_obs', type: 'object', label: "Astronomer's desk", text: 'Notebooks full of sketches of tonight\'s comets, and one cold cup of tea.' },
    { t: 'lamp_table', x: 10.8, z: 1.8, y: 0.8 },
    { t: 'book_stack', x: 12.5, y: 0.8, z: 1.8, n: 4, colors: ['#2a2f6a', '#7a3a6a', '#e0b870'] },
    { t: 'chair', x: 12.9, z: 3.3, dir: 'w', color: '#4a3a5a' },
    { t: 'plant', x: 13.0, z: 4.6, scale: 1.1 },
    { t: 'bookcase', x: 13.38, z: 7.2, dir: 'w', w: 2.2, h: 2.6, top: 'none', spines: ['#2a2f6a', '#7a3a6a', '#e0b870', '#4a6a8a'] },
    // centre: the big brass telescope on the round rug
    { t: 'telescope', x: 7.0, z: 4.1, dir: 'e', big: true, scale: 1.0, id: 'telescope_big', label: 'Big telescope', text: 'The great brass telescope, aimed straight up through the dome slit.' },
    { t: 'stool', x: 8.3, z: 5.5 },
    { t: 'hanging_lamp', x: 5.2, z: 8.4, y: 3.2, color: '#c8d0ff', size: 1.1 },
    { t: 'hanging_lamp', x: 4.0, z: 3.4, y: 3.4, color: '#ffd28a', size: 0.8 },
    { t: 'hanging_lamp', x: 10.0, z: 5.4, y: 3.3, color: '#ffd28a', size: 0.8 },
    // left: star-map table, globe, chest
    { t: 'map_table', x: 3.3, z: 6.0, w: 2.2, id: 'star_map' },
    { t: 'globe', x: 1.2, z: 8.6, scale: 1.1 },
    { t: 'chest', x: 1.6, z: 10.4, dir: 's' },
    { t: 'lamp_table', x: 0.8, z: 7.0, floor: true },
    { t: 'book_stack', x: 5.2, z: 8.8, n: 5, floor: true },
    { t: 'candles', x: 5.2, z: 8.8, y: 0.5, n: 1 },
    // right: spiral stairs up to the dome
    { t: 'spiral_stairs', x: 11.6, z: 8.2, r: 1.2, n: 14, start: 1.4, turn: 0.55 },
    { t: 'barrel', x: 13.0, z: 10.6, scale: 0.8 },
    { t: 'plant', x: 9.0, z: 10.8, scale: 1.0, kind: 'flower' },
    { t: 'crates', x: 9.6, z: 9.4, n: 2 },
  ],
};
