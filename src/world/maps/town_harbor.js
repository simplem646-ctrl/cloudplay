// Harbor Street: seaside promenade below a row of shopfronts, the Lantern Cafe, fish stalls, a dock with benches and
// bollards, moored boats, a distant lighthouse on a rocky islet, stairs down to Gull Cove. 48x30.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('town_harbor', { name: 'Harbor Street', ambient: { music: 'town', lighting: 'outdoor', weather: true, ambience: 'waves' } });

  // ---- ground: backdrop grass, cobbled street, paved quay, sand cove, sea
  b.rect('grass_dark', 0, 0, 48, 3);
  b.rect('cobble', 0, 8, 48, 6);
  b.rect('plaza', 0, 14, 48, 5);
  b.rect('brick', 12, 15, 10, 2); // inlaid strip in front of the cafe steps
  b.rect('plaza', 0, 19, 10, 2);
  b.rect('sand', 0, 21, 10, 9);
  b.rect('sea', 10, 19, 38, 11);
  b.rect('sea', 0, 27, 12, 3);
  b.rect('sand', 0, 21, 8, 8);
  b.rect('boards_h', 10, 17, 38, 2); // boardwalk along the water
  b.rect('boards_v', 21, 17, 6, 11); // the dock
  b.rect('boards_h', 20, 26, 8, 2); // dock head
  // rocky islet for the lighthouse
  b.rect('sand', 40, 20, 7, 3); b.rect('gravel', 41, 22, 5, 4);
  b.rect('path', 3, 3, 1, 5); // alley behind house A

  // ---- the row of buildings (facades face south, doors on y=7, fronts on y=8)
  const houseA = b.stamp('house', 1, 3, { w: 6, roof: 'blue', wall: 'yellow', door: 'blue', chimney: true, windows: 'box' });
  const cafe = b.stamp('shopfront', 9, 3, { w: 8, roof: 'teal', wall: 'cream', awning: 'orange', icon: 'cafe', doorX: 3, chimney: 6 });
  const fishShop = b.stamp('shopfront', 19, 3, { w: 7, roof: 'blue', wall: 'white', awning: 'blue', icon: 'fish', chimney: 1 });
  const houseB = b.stamp('house', 28, 3, { w: 6, roof: 'green', wall: 'pink', door: 'green', windows: 'shut', chimney: 1 });
  const houseC = b.stamp('house', 35, 3, { w: 6, roof: 'brown', wall: 'timber', door: 'red', windows: 'lit' });
  const houseD = b.stamp('house', 42, 3, { w: 5, roof: 'orange', wall: 'cream', door: 'yellow', windows: 'box', chimney: 3 });
  for (const s of [houseA, houseB, houseC, houseD, fishShop]) {
    b.put('planter_wood', s.front.x - 1, s.front.y); b.put('planter_stone', s.front.x + 1, s.front.y);
  }
  b.put('planter_wood', cafe.front.x - 1, cafe.front.y); b.put('planter_wood', cafe.front.x + 1, cafe.front.y);
  b.put('signpost', cafe.front.x + 2, cafe.front.y);
  // gardens between the houses
  b.stamp('flowerbed', 7, 4, 2, 3, { seed: 11, kinds: ['flowers_pink', 'flowers_white', 'flowers_mixed_b'] });
  b.rect('hedge', 7, 7, 2, 1);
  b.stamp('flowerbed', 17, 4, 2, 3, { seed: 12, kinds: ['flowers_yellow', 'flowers_orange', 'flowers_red'] });
  b.rect('hedge', 17, 7, 2, 1);
  b.stamp('flowerbed', 26, 4, 2, 3, { seed: 13, kinds: ['flowers_blue', 'flowers_purple', 'flowers_white'] });
  b.rect('hedge', 26, 7, 2, 1);
  b.stamp('flowerbed', 34, 4, 1, 3, { seed: 14 });
  b.rect('picket', 41, 3, 1, 5);
  b.stamp('flowerbed', 41, 3, 1, 4, { seed: 15, kinds: ['flowers_mixed_a', 'flowers_pink'] });
  // trees behind and between
  for (const [x, y, k] of [[0, 2, 'pine'], [8, 2, 'cherry'], [18, 2, 'round'], [27, 2, 'pine'], [34, 2, 'cherry'], [41, 2, 'round'], [47, 2, 'pine'], [4, 1, 'round'], [14, 1, 'pine'], [24, 1, 'round'], [38, 1, 'pine'], [30, 1, 'cherry']]) b.stamp('tree', x, y, { kind: k });
  // washing line: stakes + a bit of colour between house A and the alley
  b.put('flowers_red', 6, 8); b.put('flowers_white', 7, 8);

  // ---- street furniture: lantern row of lamps along the quay, benches, bins
  const lampXs = [3, 8, 14, 19, 25, 30, 36, 41, 45];
  for (const x of lampXs) b.stamp('lamp', x, 13);
  b.stamp('bench', 5, 11); b.stamp('bench', 30, 10); b.stamp('bench', 43, 11);
  b.put('trash_can', 8, 12); b.put('trash_can', 33, 10);
  b.stamp('bike_rack', 20, 10);
  for (const x of [14, 25, 41]) { b.put('planter_stone', x, 9); b.put('planter_wood', x + 1, 9); }
  b.put('planter_wood', 1, 12); b.put('planter_stone', 2, 12); b.put('planter_wood', 46, 13); b.put('stump_a', 15, 10); 
  b.stamp('mailbox', 17, 9);
  b.stamp('notice_board', 38, 9);
  // fish stalls on the quay: awning above, table below, crates beside
  const stall = (x, y, awning, cloth) => {
    b.put(`awning_${awning}_l`, x, y); b.put(`awning_${awning}_m`, x + 1, y); b.put(`awning_${awning}_r`, x + 2, y);
    b.stamp('table', x, y + 1, { w: 3, cloth });
    b.put('planter_wood', x - 1, y + 1); b.put('planter_wood', x + 3, y + 1);
  };
  stall(29, 14, 'blue', 'blue');
  stall(34, 14, 'red', 'red');
  b.put('pebbles_a', 33, 16); b.put('shell_scallop', 31, 17);
  // stacks of crates and barrels by the dock
  b.put('planter_wood', 28, 16); b.put('planter_wood', 28, 17);
  b.put('planter_wood', 18, 16); b.put('planter_wood', 19, 16); b.put('planter_wood', 19, 15);
  b.put('stump_a', 17, 17);
  b.put('log_h', 38, 16);
  // quay railings with a gap at the dock and the fishing corner
  b.rect('railing', 10, 18, 11, 1);
  b.rect('railing', 27, 18, 13, 1);
  b.gap(10, 18, 1, 1);
  // dock: bollards, bench, crates
  b.stamp('bench', 22, 22);
  b.stamp('bench', 22, 19);
  for (const [x, y] of [[21, 20], [26, 20], [21, 25], [26, 25], [21, 17], [26, 17]]) b.put('stump_b', x, y);
  b.put('planter_wood', 26, 22); b.put('planter_wood', 26, 23);
  b.put('shell_spiral', 24, 24);
  b.stamp('lamp', 26, 27);
  b.stamp('lamp', 21, 27);

  // ---- boats (hull = planks with rails fore and aft, mast, cargo)
  const boat = (x, y, w, mast) => {
    b.rect('boards_h', x, y, w, 3);
    b.rect('railing', x, y, w, 1); b.rect('railing', x, y + 2, w, 1);
    b.put(mast ? 'trunk_pine' : 'stump_a', x + (w >> 1), y + 1);
    b.put('bush_small', x + 1, y + 1);
    b.block(x, y, w, 3);
  };
  boat(28, 21, 6, true);
  boat(12, 22, 5, true);
  boat(34, 24, 4, false);
  boat(14, 26, 4, false);
  b.put('stump_b', 27, 21); b.put('stump_b', 27, 24);

  // ---- lighthouse: slim white tower on the islet (faked with a 3-wide facade)
  b.stamp('house', 42, 20, { w: 3, roof: 'red', wall: 'white', door: 'red', windows: 'lit', doorX: 1 });
  b.put('plaque_bell', 43, 22);
  b.stamp('flowerbed', 41, 24, 1, 1, { seed: 3 });
  b.put('rock_a', 41, 25); b.put('rock_b', 46, 24); b.put('rock_c', 45, 26); b.put('rock_d', 40, 21); b.put('pebbles_b', 44, 25);
  b.put('rock_a', 38, 28); b.put('rock_c', 30, 28); b.put('rock_b', 8, 29);

  // ---- the beach cove (sand, driftwood, shells, tide pool, stairs up)
  b.stamp('stairs', 3, 21, 2, 2, { kind: 'stone' });
  b.put('driftwood_a', 7, 24); b.put('driftwood_b', 1, 26); b.put('driftwood_c', 6, 27);
  b.put('shell_starfish', 2, 24); b.put('shell_scallop', 5, 25); b.put('shell_spiral', 8, 22);
  b.put('tidepool', 1, 28); b.put('tidepool', 2, 28); b.put('rock_a', 0, 24); b.put('rock_b', 6, 22);
  b.put('reeds_a', 9, 25); b.put('pebbles_a', 4, 27);

  // ---- ground details: grass tufts, flowers, a bit of everything along edges
  b.scatter(['flowers_red', 'flowers_yellow', 'flowers_pink', 'flowers_white', 'flowers_blue'], { rect: [0, 0, 48, 3], count: 24, seed: 21, onlyOn: ['grass', 'grass_dark'] });
  b.scatter(['tallgrass_a', 'tallgrass_b', 'tuft_a', 'clover_a'], { rect: [0, 0, 48, 3], count: 20, seed: 22, onlyOn: ['grass', 'grass_dark'] });
  b.scatter(['pebbles_a', 'pebbles_b', 'shell_scallop', 'shell_spiral', 'weeds_a'], { rect: [0, 8, 48, 11], count: 22, seed: 23, gap: 1, onlyOn: ['cobble', 'plaza'] });
  b.scatter(['bush_round', 'bush_berry', 'bush_blossom', 'bush_small'], { rect: [0, 0, 48, 3], count: 8, seed: 24, gap: 1, onlyOn: ['grass', 'grass_dark'] });

  // ---- anchors
  b.setAnchors({
    entrance: [cafe.front.x, cafe.front.y + 1, 'up'], center: [24, 12, 'down'],
    spot_a: [10, 12, 'down'], spot_b: [22, 15, 'down'], spot_c: [36, 12, 'down'], spot_d: [31, 16, 'up'],
    npc_1: [15, 11, 'down'], npc_2: [30, 17, 'up'], npc_3: [36, 17, 'up'], npc_4: [46, 14, 'left'], npc_5: [7, 15, 'down'], npc_6: [24, 16, 'down'],
    door_cafe: [cafe.front.x, cafe.front.y, 'up'], dock_end: [24, 27, 'down'], dock_bench: [22, 23, 'up'], finch_spot: [13, 16, 'up'],
    fish_stall: [30, 16, 'up'], lighthouse_view: [44, 17, 'right'], stairs_beach: [3, 20, 'down'], lantern_row: [14, 14, 'right'],
    road_east: [46, 10, 'right'],
    from_cafe_lantern: [cafe.front.x, cafe.front.y, 'down'], from_town_square: [45, 10, 'left'], from_beach: [4, 20, 'down'],
  });
  // Mr. Finch's bench: facing the sea beside the railing
  b.stamp('bench', 12, 15);
  b.stamp('bench', 5, 18);
  b.rect('railing', 11, 18, 1, 1); b.gap(11, 18, 1, 1);

  // ---- warps
  b.warp(cafe.door.x, cafe.door.y, 1, 1, 'cafe_lantern:from_town_harbor', { sfx: 'door_open' });
  b.warp(47, 8, 1, 4, 'town_square:from_town_harbor');
  b.warp(3, 22, 2, 1, 'beach:from_town_harbor');

  // ---- interactables
  b.interact('board', 38, 9, 2, 1, 'Town notice board', { type: 'board', id: 'town' });
  b.interact('fish_stall', 29, 15, 3, 1, 'Fish stall', { type: 'text', lines: ['Silver mackerel on ice and a hand-lettered sign: "Caught at dawn, argued over by noon."', 'The stallholder swears the gulls have a union.'] });
  b.interact('fish_stall_2', 34, 15, 3, 1, 'Fish stall', { type: 'text', lines: ['Baskets of sardines, one lonely crab and a very smug cat guarding the till.'] });
  b.interact('dock_bench', 22, 22, 2, 1, 'Dock bench', { type: 'rest' });
  b.interact('lighthouse_view', 44, 18, 1, 1, 'Lighthouse', { type: 'text', lines: ['The old Bellhaven lighthouse on its little rock. It blinks twice, pauses, then blinks again, like it is thinking.'] });
  b.interact('finch_bench', 12, 15, 2, 1, "Mr. Finch's bench", { type: 'text', lines: ['A weathered bench facing the sea. The slats on the left are worn smooth from years of one person sitting in the same place.'] });
  return b.build();
}
