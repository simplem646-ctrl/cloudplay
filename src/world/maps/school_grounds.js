// Bellhaven High front grounds: gate (S), fountain courtyard, the main building with its stone bell tower, gym (W),
// field path (E), hill path (N-E), festival stage (SE) and four stall bays. 46x36.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('school_grounds', { name: 'Bellhaven High', ambient: { music: 'school', lighting: 'outdoor', weather: true, ambience: 'birds' } });

  // local prefab: a festival stall (striped awning over a cloth-covered counter); front = tile to stand on
  b.defineStamp('stall', (bb, x, y, color) => {
    const cloth = color === 'red' ? 'red' : color === 'blue' ? 'blue' : 'white';
    bb.put(`awning_${color}_l`, x, y, 'above'); bb.put(`awning_${color}_m`, x + 1, y, 'above'); bb.put(`awning_${color}_r`, x + 2, y, 'above');
    bb.put(`table_${cloth}_l`, x, y + 1); bb.put(`table_${cloth}_m`, x + 1, y + 1); bb.put(`table_${cloth}_r`, x + 2, y + 1);
    return { front: { x: x + 1, y: y + 2 } };
  });

  // ---- ground
  b.rect('grass_lush', 0, 0, 46, 5);
  b.rect('plaza', 11, 13, 24, 18);           // courtyard
  b.rect('brick', 13, 15, 20, 14);
  b.rect('plaza', 15, 17, 16, 10);
  b.rect('cobble', 20, 30, 6, 5);            // gate avenue
  b.rect('path', 34, 0, 2, 14);              // hill path north
  b.rect('path', 35, 20, 11, 3);             // field road east
  b.rect('path', 6, 17, 2, 4);
  b.rect('path', 6, 19, 6, 3);               // gym walk west
  b.rect('stone', 20, 13, 6, 1);             // steps apron
  b.rect('boards_h', 35, 25, 10, 5);         // festival stage
  b.rect('grass_dark', 0, 30, 10, 6);
  b.rect('grass_dark', 36, 31, 10, 5);

  // ---- main building and bell tower
  const main = b.stamp('school_building', 14, 8, { w: 18 });
  const tx = main.door.x - 1; // tower is 4 wide, centred over the door
  const roofNames = [['tl', 't', 't', 'tr'], ['ml', 'm', 'm', 'mr'], ['bl', 'b', 'b', 'br']];
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) b.put(`roof_slate_${roofNames[r][c]}`, tx + c, 0 + r);
  for (let c = 0; c < 4; c++) {
    b.put('wall_stone_eave', tx + c, 3);
    b.put('wall_stone', tx + c, 4);
    b.put(c === 1 || c === 2 ? 'win_stone_lit' : 'wall_stone', tx + c, 5);
    b.put(c === 1 || c === 2 ? 'win_stone_lit' : 'wall_stone', tx + c, 6);
    b.put('wall_stone_base', tx + c, 7);
  }
  b.put('plaque_bell', tx + 1, 3);
  b.put('wall_clock', tx + 2, 3, 'above');
  b.block(tx, 0, 4, 8);

  // ---- gym (west wing)
  const gym = b.stamp('house', 2, 12, { w: 9, roof: 'blue', wall: 'brick', door: 'wood', doorW: 2, doorX: 4, windows: 'lit', plaque: 'school_blue' });
  b.put('signpost', gym.front.x + 2, gym.front.y);
  b.put('planter_wood', gym.front.x - 1, gym.front.y);
  b.stamp('flowerbed', 1, 18, 3, 1, { seed: 11 });

  // ---- hedges, gate
  b.rect('hedge', 0, 33, 20, 1); b.rect('hedge', 26, 33, 20, 1);
  b.gap(20, 33, 6, 1);
  b.put('planter_stone', 19, 32); b.put('planter_stone', 26, 32);
  b.rect('hedge_bloom', 10, 13, 1, 6);
  b.rect('hedge', 33, 1, 1, 12); b.rect('hedge', 36, 1, 1, 12);
  b.stamp('flowerbed', 12, 14, 2, 1, { seed: 4 });

  // ---- courtyard centrepiece, lamps, benches
  const fountain = b.stamp('fountain', 20, 18);
  for (const [x, y] of [[14, 14], [31, 15], [14, 29], [31, 29], [19, 31], [26, 31], [10, 21], [34, 17]]) b.stamp('lamp', x, y);
  b.stamp('bench', 15, 22); b.stamp('bench', 29, 22);
  b.stamp('bench', 5, 26);
  b.stamp('notice_board', 28, 14);
  b.stamp('vending', 32, 14, { color: 'blue' });
  b.stamp('bike_rack', 3, 22); b.stamp('bike_rack', 5, 22); b.stamp('bike_rack', 7, 24);
  b.put('trash_can', 33, 22); b.put('trash_can', 12, 24);
  b.put('planter_stone', 17, 14); b.put('planter_wood', 27, 14);

  // ---- stalls for festivals
  b.stamp('stall', 13, 24, 'red');
  b.stamp('stall', 17, 24, 'blue');
  b.stamp('stall', 26, 24, 'green');
  b.stamp('stall', 30, 24, 'yellow');

  // ---- stage: boards, backdrop, railing, steps
  b.rect('hedge', 35, 24, 10, 1);
  b.gap(35, 24, 1, 1);
  b.rect('railing', 35, 26, 1, 4); b.rect('railing', 44, 26, 1, 4);
  b.put('awning_red_l', 35, 25, 'above'); b.put('awning_red_r', 44, 25, 'above');
  for (let x = 36; x < 44; x++) b.put(x % 2 ? 'awning_blue_m' : 'awning_red_m', x, 25, 'above');
  b.stamp('stairs', 39, 30, 2, 1, { kind: 'wood' });
  b.stamp('flowerbed', 36, 31, 3, 1, { seed: 6 });
  b.put('planter_wood', 35, 31); b.put('planter_wood', 44, 31);
  b.put('plant_pot', 37, 27); b.put('plant_pot', 42, 27);

  // ---- trees and vegetation
  const trees = [[8, 7, 'cherry'], [12, 6, 'round'], [38, 8, 'cherry'], [42, 12, 'round'], [40, 17, 'cherry'], [3, 28, 'round'], [8, 30, 'pine'],
    [14, 32, 'round'], [32, 32, 'cherry'], [43, 33, 'pine'], [27, 4, 'pine'], [30, 6, 'round'], [2, 21, 'cherry'], [2, 8, 'pine'], [38, 23, 'round']];
  for (const [x, y, kind] of trees) b.stamp('tree', x, y, { kind });
  b.stamp('flowerbed', 15, 31, 3, 1, { seed: 9, border: 'hedge_bloom' });
  b.stamp('flowerbed', 27, 31, 3, 1, { seed: 10, border: 'hedge_bloom' });
  b.stamp('bench', 38, 12); b.stamp('bench', 8, 9);
  b.scatter(['flowers_red', 'flowers_yellow', 'flowers_pink', 'flowers_white', 'flowers_blue', 'flowers_mixed_a', 'flowers_mixed_b', 'flowers_mixed_c'], { count: 70, seed: 21, gap: 1 });
  b.scatter(['tallgrass_a', 'tallgrass_b', 'tuft_a', 'clover_a', 'weeds_a'], { count: 50, seed: 22 });
  b.scatter(['bush_round', 'bush_berry', 'bush_blossom', 'bush_small'], { count: 24, seed: 23, gap: 2 });
  b.scatter(['rock_a', 'rock_b', 'pebbles_a', 'mushrooms_a', 'stump_a'], { count: 10, seed: 24, gap: 2 });

  for (const [x, y] of [[9, 10], [9, 25], [8, 20], [4, 23], [5, 27], [44, 21], [43, 21], [39, 32], [34, 1], [34, 2]]) b.erase(x, y, 1, 1, ['deco']);

  // ---- anchors
  b.setAnchors({
    entrance: [22, 32, 'up'], center: [23, 29, 'up'], gate: [22, 34, 'up'],
    spot_a: [17, 20, 'right'], spot_b: [28, 20, 'left'], spot_c: [17, 28, 'up'], spot_d: [28, 28, 'up'],
    npc_1: [fountain.front.x - 3, fountain.front.y, 'right'], npc_2: [fountain.front.x + 3, fountain.front.y, 'left'], npc_3: [30, 23, 'left'],
    npc_4: [9, 25, 'right'], npc_5: [8, 20, 'left'], npc_6: [33, 16, 'left'],
    courtyard: [23, 27, 'up'], fountain: [fountain.front.x, fountain.front.y, 'up'],
    bench_1: [15, 23, 'up'], bench_2: [29, 23, 'up'], bench_3: [5, 27, 'up'],
    door_main: [main.front.x, main.front.y, 'up'], door_gym: [gym.front.x, gym.front.y, 'up'],
    road_field: [44, 21, 'right'], path_hill: [34, 2, 'up'], tree_shade: [9, 10, 'down'], bike_rack: [4, 23, 'up'],
    stage: [39, 28, 'down'], stall_a: [14, 26, 'up'], stall_b: [18, 26, 'up'], stall_c: [27, 26, 'up'], stall_d: [31, 26, 'up'],
    ceremony_spot: [39, 32, 'up'],
    from_town_square: [22, 34, 'up'], from_school_hall_1f: [main.front.x, main.front.y, 'down'],
    from_school_gym: [gym.front.x, gym.front.y, 'down'], from_school_field: [43, 21, 'left'], from_hill_observatory: [34, 1, 'down'],
  });

  // ---- warps
  b.warp(20, 35, 6, 1, 'town_square:from_school_grounds');
  b.warp(main.door.x, main.door.y, main.door.w, 1, 'school_hall_1f:from_school_grounds', { sfx: 'door_open' });
  b.warp(gym.door.x, gym.door.y, gym.door.w, 1, 'school_gym:from_school_grounds', { sfx: 'door_open' });
  b.warp(45, 20, 1, 3, 'school_field:from_school_grounds');
  b.warp(34, 0, 2, 1, 'hill_observatory:from_school_grounds');

  // ---- interactables
  b.interact('board', 28, 14, 2, 1, 'School notice board', { type: 'board', id: 'school' });
  b.interact('vending', 32, 13, 1, 2, 'Vending machine', { type: 'shop', shop: 'vending_school' });
  for (const [n, x, y] of [['bench_1', 15, 22], ['bench_2', 29, 22], ['bench_3', 5, 26]]) b.interact(n, x, y, 2, 1, 'Bench', { type: 'rest' });
  b.interact('fountain', 20, 18, 5, 5, 'Courtyard fountain', { type: 'text', lines: ['The courtyard fountain. A faded paper boat sits on the rim: a tiny wish, waiting for Bell Night.'] });
  return b.build();
}
