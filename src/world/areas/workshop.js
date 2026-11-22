/** Tobias' Workshop (interior, 12x9). Lamp-maker's bench, tool wall, shelves of unfinished lanterns, dust and warm light. Pure data. */
export default {
  id: 'workshop',
  size: [12, 9],
  kind: 'interior',
  seed: 91,
  room: {
    wall: 'wood', wallColor: '#d6b684', wainscot: '#5a3f2a', trim: '#e8d4a8', wallH: 3.7,
    windows: [{ at: 2.1, w: 1.3, h: 1.4, y: 1.5, curtain: '#d98a4a' }],
  },
  exit: { id: 'to_brook_lane', at: 6 },
  ground: {
    base: 'planks_dark',
    ops: [
      { rug: { rect: [4.4, 3.9, 4.6, 2.8], style: 'floral', colors: ['#7a4a2a', '#e0b870', '#4a5a6a'] } },
    ],
  },
  anchors: {
    bench_spot: [6.0, 3.3, 'n'],
    shelf_spot: [10.0, 2.2, 'n'],
    centre: [6.0, 4.6, 's'],
  },
  props: [
    // back wall: window, workbench with tool wall, ladder, lantern shelves
    { t: 'plant', x: 0.9, z: 1.0, scale: 1.0 },
    { t: 'wall_item', kind: 'tools', x: 6.0, y: 1.75, w: 2.8 },
    { t: 'workbench', x: 6.0, z: 2.0, w: 3.4, id: 'bench_workshop' },
    { t: 'stool', x: 4.6, z: 3.2 },
    { t: 'lantern_rack', x: 10.0, z: 0.62, w: 2.6, h: 2.6, id: 'lantern_shelf' },
    { t: 'ladder', x: 8.35, z: 0.95, h: 2.8 },
    { t: 'wall_sconce', x: 3.6, y: 2.2 },
    { t: 'wall_item', kind: 'hooks', x: 2.1, y: 2.45, w: 1.2 },
    // hanging unfinished lanterns
    { t: 'hanging_lamp', x: 6.0, z: 3.4, y: 3.0, color: '#ffd28a' },
    { t: 'hanging_lamp', x: 4.2, z: 4.4, y: 3.2, color: '#c8e0ff', size: 0.8 },
    { t: 'hanging_lamp', x: 8.0, z: 4.0, y: 2.9, color: '#ffb868', size: 0.9 },
    { t: 'hanging_lamp', x: 9.6, z: 3.2, y: 3.3, color: '#ffd28a', size: 0.7 },
    // left: trunk, barrels, parts
    { t: 'chest', x: 1.7, z: 3.5, dir: 's', id: 'trunk_workshop', label: 'Trunk', text: "Tobias's old trunk, full of brass fittings and spare wicks." },
    { t: 'lamp_table', x: 0.8, z: 5.0, floor: true },
    { t: 'barrel', x: 0.9, z: 6.2, scale: 0.9 },
    { t: 'crates', x: 1.3, z: 7.8, n: 3 },
    { t: 'lamp_parts', x: 2.7, z: 8.0 },
    // middle: assembly table and stools
    { t: 'table', x: 3.6, z: 6.6, w: 2.0, d: 1.1 },
    { t: 'book_stack', x: 4.2, y: 0.88, z: 6.6, n: 2, colors: ['#8a5a34', '#e8d4a8'] },
    { t: 'candles', x: 3.0, z: 6.6, y: 0.88, n: 2 },
    { t: 'stool', x: 3.0, z: 7.6 }, { t: 'stool', x: 4.3, z: 7.6 },
    // right: wood stack, sacks of wicks, plant
    { t: 'woodpile', x: 10.9, z: 6.4, w: 1.1 },
    { t: 'sack', x: 10.7, z: 4.8 },
    { t: 'sack', x: 11.2, z: 5.4 },
    { t: 'barrel', x: 10.8, z: 8.0, scale: 0.8 },
    { t: 'plant', x: 9.2, z: 8.3, scale: 0.9, kind: 'flower' },
  ],
};
