// Heron Pond Park: west gate from Bell Square, a plaza hub with flower beds, bandstand to the north, cherry grove in the
// north-west, a pond with a wooden bridge, the playground (north-east) and a picnic lawn (south-west). 40x30.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('town_park', { name: 'Heron Pond Park', ambient: { music: 'town', lighting: 'outdoor', weather: true, ambience: 'birds' } });

  // ---- ground
  b.rect('grass_lush', 1, 18, 15, 11); // picnic lawn
  b.rect('grass_dark', 0, 0, 40, 2);
  b.rect('grass_dark', 0, 28, 40, 2);
  b.rect('path', 0, 14, 14, 3); // west road in
  b.rect('plaza', 14, 11, 9, 8); // hub
  b.rect('brick', 16, 13, 5, 4);
  b.rect('path', 17, 8, 3, 3); // to the bandstand
  b.rect('path', 13, 19, 9, 2); // hub -> pond
  b.rect('path', 4, 18, 3, 7); // lawn lane
  b.rect('path', 36, 10, 3, 15); // east bank lane
  b.rect('path', 28, 9, 9, 2); // to playground
  b.rect('path', 23, 12, 6, 2);
  b.rect('sand_flat', 27, 2, 11, 7); // playground sand
  b.blob('water', 29, 20, 7, 5, { seed: 11, roughness: 0.25 });
  b.rect('path', 18, 23, 2, 5);

  // ---- bandstand: boards, roof, posts
  b.rect('boards_h', 14, 4, 9, 4);
  b.rect('railing', 14, 7, 9, 1); b.gap(17, 7, 3, 1);
  for (let i = 0; i < 9; i++) for (const [r, row] of [[0, 'bl'], [1, 'b']]) void r, row;
  const roofRows = [['tl', 't', 'tr'], ['ml', 'm', 'mr'], ['bl', 'b', 'br']];
  const rx = 13, ry = 1, rw = 11;
  for (let j = 0; j < 3; j++) for (let i = 0; i < rw; i++) b.put(`roof_red_${roofRows[j][i === 0 ? 0 : i === rw - 1 ? 2 : 1]}`, rx + i, ry + j, 'above');
  b.put('lamp_base', 13, 7); b.put('lamp_base', 23, 7);
  b.put('plant_pot', 14, 4); b.put('plant_pot', 22, 4);
  b.put('table_o', 18, 4); // music stand
  b.stamp('rug', 16, 5, 5, 2, { color: 'red' });

  // ---- pond: bridge with rails, reeds, lilypads, shore stones
  for (let x = 21; x <= 37; x++) { b.put('bridge_h', x, 20); b.put('bridge_rt', x, 19); b.put('bridge_rb', x, 21); }
  for (const x of [21, 37]) { b.erase(x, 19, 1, 1); b.erase(x, 21, 1, 1); }
  for (const [x, y] of [[22, 17], [24, 24], [30, 17], [33, 24], [35, 22], [26, 18], [31, 23]]) b.put('lilypad_a', x, y);
  for (const [x, y] of [[20, 24], [21, 16], [36, 16], [34, 25]]) b.put('reeds_a', x, y);
  b.put('rock_b', 25, 26); b.put('rock_c', 38, 26); b.put('pebbles_a', 22, 25);

  // ---- playground: picket fence, climbing frames, seesaws, sandbox
  b.rect('picket', 26, 1, 1, 9); b.gap(26, 9, 1, 1);
  b.rect('picket', 26, 1, 13, 1); b.rect('picket', 38, 1, 1, 5);
  b.put('bikerack_l', 29, 3); b.put('bikerack_r', 30, 3); b.put('bikerack_l', 29, 4); b.put('bikerack_r', 30, 4);
  b.put('bench_l', 33, 3); b.put('bench_r', 34, 3); b.put('bench_l', 33, 5); b.put('bench_r', 34, 5);
  b.put('stump_a', 36, 6); b.put('stump_b', 28, 7); b.put('log_h', 31, 7);
  b.put('planter_wood', 36, 3); b.put('planter_wood', 36, 4);
  b.put('stepping_stone', 32, 8); b.put('stepping_stone', 34, 8);
  b.put('busstop_base', 28, 2); // slide stand-in (see report)

  // ---- picnic lawn: blankets, baskets, bench, low hedge
  b.stamp('rug', 4, 21, 3, 2, { color: 'red' });
  b.stamp('rug', 9, 23, 3, 2, { color: 'blue' });
  b.stamp('rug', 11, 19, 3, 2, { color: 'green' });
  b.stamp('rug', 2, 24, 2, 2, { color: 'cream' });
  b.put('mushrooms_b', 8, 22); b.put('tuft_a', 7, 24); b.put('stump_a', 12, 22);
  b.rect('hedge', 1, 27, 12, 1);

  // ---- benches, lamps, hub piece
  b.stamp('bench', 10, 13);
  b.stamp('bench', 24, 14);
  b.stamp('bench', 32, 12);
  b.stamp('bench', 14, 8);
  b.stamp('bench', 21, 8);
  b.stamp('lamp', 14, 17); b.stamp('lamp', 22, 12); b.stamp('lamp', 12, 17); b.stamp('lamp', 3, 13); b.stamp('lamp', 17, 22);
  b.stamp('lamp', 25, 11); b.stamp('lamp', 35, 11); b.stamp('lamp', 25, 27);
  b.put('planter_stone', 15, 14); b.put('planter_stone', 21, 14); b.put('planter_stone', 15, 16); b.put('planter_stone', 21, 16);
  b.put('signpost', 13, 14); b.put('trash_can', 23, 17); b.put('trash_can', 9, 13);
  b.stamp('vending', 12, 12, { color: 'red' });
  b.stamp('flowerbed', 17, 14, 3, 2, { seed: 2, kinds: ['flowers_pink', 'flowers_white', 'flowers_yellow'] });
  b.stamp('flowerbed', 9, 9, 3, 2, { seed: 4 });
  b.stamp('flowerbed', 22, 5, 1, 2, { seed: 6 });
  b.stamp('flowerbed', 14, 24, 3, 3, { seed: 7, border: 'hedge_bloom', kinds: ['flowers_red', 'flowers_orange', 'flowers_mixed_a', 'flowers_mixed_c'] });
  b.stamp('flowerbed', 23, 3, 2, 3, { seed: 8, kinds: ['flowers_blue', 'flowers_purple', 'flowers_white'] });
  b.stamp('flowerbed', 38, 12, 1, 10, { seed: 9 });

  // ---- cherry grove (NW) and scattered trees
  for (const [x, y] of [[3, 5], [6, 4], [9, 6], [4, 9], [11, 4], [7, 11], [12, 10], [2, 2]]) b.stamp('tree', x, y, { kind: 'cherry' });
  b.stamp('tree', 8, 8, { kind: 'cherry' }); // the big one, cherry_tree anchor below it
  for (const [x, y, k] of [[1, 12, 'round'], [1, 17, 'round'], [26, 12, 'round'], [24, 9, 'round'], [37, 27, 'round'], [30, 27, 'pine'], [38, 9, 'pine'], [20, 27, 'round'], [1, 27, 'pine'], [13, 27, 'round'], [39, 17, 'pine'], [26, 25, 'round'], [18, 0, 'pine']]) b.stamp('tree', x, y, { kind: k });
  b.rect('hedge', 0, 11, 1, 3); b.rect('hedge', 0, 17, 1, 3);
  b.rect('hedge', 39, 1, 1, 27);

  // ---- ambient scatter
  b.scatter(['flowers_red', 'flowers_yellow', 'flowers_pink', 'flowers_white', 'flowers_blue', 'flowers_mixed_a', 'flowers_mixed_b'], { count: 70, seed: 3, gap: 1, onlyOn: ['grass', 'grass_lush', 'grass_dark'] });
  b.scatter(['tallgrass_a', 'tallgrass_b', 'tuft_a', 'clover_a', 'weeds_a'], { count: 50, seed: 5, onlyOn: ['grass', 'grass_lush', 'grass_dark'] });
  b.scatter(['bush_round', 'bush_berry', 'bush_blossom', 'bush_small'], { count: 20, seed: 6, gap: 2, onlyOn: ['grass', 'grass_dark'] });
  b.scatter(['rock_a', 'rock_d', 'pebbles_b', 'mushrooms_a', 'fern_a'], { count: 10, seed: 8, gap: 2, onlyOn: ['grass', 'grass_dark'] });

  // ---- anchors
  b.setAnchors({
    entrance: [2, 15, 'right'], center: [18, 15, 'up'],
    spot_a: [16, 12, 'down'], spot_b: [17, 20, 'right'], spot_c: [6, 19, 'down'], spot_d: [33, 10, 'down'],
    npc_1: [13, 15, 'right'], npc_2: [19, 10, 'up'], npc_3: [31, 9, 'up'], npc_4: [8, 22, 'left'], npc_5: [29, 14, 'down'], npc_6: [37, 14, 'left'],
    bridge: [29, 20, 'down'], pond_edge: [20, 20, 'right'], bandstand: [18, 6, 'down'],
    bench_1: [10, 15, 'up'], bench_2: [24, 15, 'up'], bench_3: [32, 13, 'up'],
    picnic_a: [5, 21, 'down'], picnic_b: [10, 23, 'down'], picnic_c: [12, 19, 'down'],
    cat_spot: [18, 27, 'up'], cherry_tree: [8, 9, 'up'], road_west: [1, 15, 'right'],
    from_town_square: [1, 15, 'right'],
  });
  b.warp(0, 14, 1, 3, 'town_square:from_town_park');

  // ---- interactables
  b.interact('bench_1', 10, 13, 2, 1, 'Bench', { type: 'rest' });
  b.interact('bench_2', 24, 14, 2, 1, 'Bench', { type: 'rest' });
  b.interact('bench_3', 32, 12, 2, 1, 'Bench', { type: 'rest' });
  b.interact('bench_4', 14, 8, 2, 1, 'Bench', { type: 'rest' });
  b.interact('pond', 21, 20, 1, 1, 'Heron Pond', { type: 'text', lines: ['Heron Pond. A grey heron stands on one leg in the reeds as if it pays rent here.', 'Koi flash orange under the lily pads. The bridge planks creak like an old song.'] });
  b.interact('playground', 29, 3, 2, 2, 'Playground', { type: 'text', lines: ['The playground: a climbing frame, a sandpit and one seesaw that only works if the other side is Dante.', 'Somebody has built a sand bell. It is very accurate.'] });
  b.interact('bandstand', 16, 5, 5, 2, 'Bandstand', { type: 'text', lines: ['The bandstand. The brass band plays here on festival days, and on other days a pigeon conducts.'] });
  return b.build();
}
