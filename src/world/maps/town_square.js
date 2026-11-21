// Bell Square: cobbled plaza with a fountain and clock post, six doors around it, roads west/east, and a
// switchback stair-path climbing the north-east hill to the school. 44x34.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('town_square', { name: 'Bell Square', ambient: { music: 'town', lighting: 'outdoor', weather: true, ambience: null } });

  // ---- ground: grass base, cobbled plaza, paver inlay, brick ring, roads
  b.rect('cobble', 9, 11, 26, 16);
  b.rect('cobble', 17, 8, 8, 3); // apron in front of the hall steps
  b.rect('plaza', 14, 13, 16, 12);
  b.rect('brick', 16, 14, 11, 8);
  b.rect('cobble', 3, 30, 38, 3); // south street
  b.rect('cobble', 20, 27, 3, 3); // avenue down to the street
  b.rect('path', 0, 17, 10, 3); // west road (to the harbor)
  b.rect('path', 34, 20, 10, 3); // east road (to the park)
  b.rect('path', 5, 11, 3, 7); // bakery lane
  // switchback up to the school: flight 1 (x40-41, y8), corridor west along y4-5, flight 2 (x30-31, y3), top path east
  b.rect('path', 34, 11, 8, 2);
  b.rect('path', 40, 9, 2, 2);
  b.rect('path', 40, 4, 2, 4);
  b.rect('path', 30, 4, 12, 2);
  b.rect('path', 30, 1, 14, 2);
  b.rect('grass_lush', 38, 6, 3, 1); b.rect('grass', 38, 6, 3, 1);
  b.rect('grass_dark', 28, 0, 2, 3);

  // ---- buildings (all facades face south)
  b.stamp('town_hall', 15, 1, { w: 12 });
  const bakery = b.stamp('shopfront', 4, 6, { w: 6, roof: 'orange', wall: 'cream', awning: 'red', icon: 'bread', chimney: 4 });
  const flower = b.stamp('shopfront', 32, 6, { w: 6, roof: 'green', wall: 'pink', awning: 'green', icon: 'flower' });
  const books = b.stamp('shopfront', 36, 14, { w: 6, roof: 'brown', wall: 'timber', awning: 'blue', icon: 'book', door: 'wood' });
  const mart = b.stamp('shopfront', 33, 25, { w: 6, roof: 'blue', wall: 'yellow', awning: 'yellow', icon: 'mart' });
  const clinic = b.stamp('shopfront', 4, 25, { w: 6, roof: 'teal', wall: 'white', awning: 'blue', icon: 'clinic', chimney: 1 });
  const hall = { door: { x: 20, y: 5 }, front: { x: 20, y: 8 } };
  for (const s of [bakery, flower, books, mart, clinic]) { b.put('planter_stone', s.front.x - 1, s.front.y); b.put('planter_wood', s.front.x + 1, s.front.y); }

  // ---- the hill: two retaining walls with staircases
  b.stamp('cliff_wall', 38, 8, 6, { ivy: true });
  b.erase(40, 8, 2, 1); b.stamp('stairs', 40, 8, 2, 1);
  b.stamp('cliff_wall', 28, 3, 16, { ivy: true });
  b.erase(30, 3, 2, 1); b.stamp('stairs', 30, 3, 2, 1);
  b.rect('hedge', 27, 0, 1, 6); b.rect('hedge', 27, 6, 5, 1);
  b.stamp('tree', 43, 7, { kind: 'pine' });
  b.stamp('tree', 38, 7, { kind: 'cherry' });
  b.stamp('tree', 28, 2, { kind: 'pine' });
  b.stamp('tree', 34, 2, { kind: 'round' });
  b.stamp('tree', 36, 5, { kind: 'cherry' });

  // ---- plaza centrepiece
  const fountain = b.stamp('fountain', 19, 15);
  b.stamp('clock_post', 27, 16);
  for (const [x, y] of [[11, 12], [32, 12], [11, 25], [32, 24], [16, 10], [25, 10], [8, 16], [8, 20], [21, 28], [13, 18], [29, 18]]) b.stamp('lamp', x, y);
  b.stamp('bench', 12, 14);
  b.stamp('bench', 29, 20);
  b.stamp('bench', 13, 22);
  b.stamp('bench', 28, 24);
  b.stamp('notice_board', 12, 10);
  b.stamp('vending', 31, 16);
  b.stamp('bus_stop', 10, 21);
  b.stamp('bike_rack', 31, 22);
  b.put('trash_can', 14, 25); b.put('trash_can', 30, 11);
  b.stamp('mailbox', 3, 11);
  b.put('signpost', 8, 17);
  b.put('planter_stone', 17, 21); b.put('planter_stone', 26, 21); b.put('planter_wood', 17, 14); b.put('planter_wood', 26, 14);

  // ---- gardens, hedges, fences, trees
  b.stamp('flowerbed', 13, 8, 3, 2, { border: 'hedge_bloom', seed: 3 });
  b.stamp('flowerbed', 26, 8, 3, 2, { border: 'hedge_bloom', seed: 5 });
  b.rect('picket', 3, 12, 1, 5);
  b.stamp('flowerbed', 1, 12, 2, 5, { seed: 8, kinds: ['flowers_pink', 'flowers_white', 'flowers_mixed_b'] });
  b.stamp('flowerbed', 40, 24, 3, 4, { seed: 9, kinds: ['flowers_yellow', 'flowers_orange', 'flowers_mixed_c'] });
  b.rect('hedge', 40, 29, 4, 1); b.rect('hedge', 1, 28, 3, 1);
  for (const [x, y, k] of [[1, 3, 'round'], [13, 3, 'round'], [2, 23, 'cherry'], [11, 8, 'cherry'], [2, 14, 'round'], [11, 29, 'round'], [28, 29, 'cherry'], [41, 30, 'round'], [42, 13, 'cherry'], [1, 9, 'cherry'], [4, 20, 'cherry']]) {
    if (!(k === 'round' && x === 13 && y === 3) || true) b.stamp('tree', x, y, { kind: k });
  }
  b.scatter(['flowers_red', 'flowers_yellow', 'flowers_pink', 'flowers_white', 'flowers_blue', 'flowers_mixed_a', 'flowers_mixed_b', 'flowers_mixed_c'], { count: 70, seed: 2, gap: 1 });
  b.scatter(['tallgrass_a', 'tallgrass_b', 'tuft_a', 'clover_a', 'weeds_a'], { count: 45, seed: 4 });
  b.scatter(['bush_round', 'bush_berry', 'bush_blossom', 'bush_small'], { count: 22, seed: 6, gap: 2 });
  b.scatter(['rock_a', 'rock_b', 'pebbles_a', 'mushrooms_a'], { count: 10, seed: 7, gap: 2 });

  // ---- anchors
  b.setAnchors({
    entrance: [11, 18, 'right'], center: [21, 21, 'up'],
    spot_a: [17, 12, 'down'], spot_b: [25, 12, 'down'], spot_c: [16, 23, 'up'], spot_d: [26, 23, 'up'],
    npc_1: [14, 17, 'right'], npc_2: [28, 19, 'left'], npc_3: [21, 12, 'down'], npc_4: [17, 25, 'up'], npc_5: [25, 25, 'up'], npc_6: [21, 26, 'up'],
    door_bakery: [bakery.front.x, bakery.front.y, 'up'], door_flower: [flower.front.x, flower.front.y, 'up'],
    door_books: [books.front.x, books.front.y, 'up'], door_mart: [mart.front.x, mart.front.y, 'up'],
    door_clinic: [clinic.front.x, clinic.front.y, 'up'], door_hall: [hall.front.x, hall.front.y, 'up'],
    fountain: [fountain.front.x, fountain.front.y, 'up'], bench_1: [12, 15, 'up'], bench_2: [29, 21, 'up'],
    road_west: [1, 18, 'right'], road_east: [42, 21, 'left'], road_north: [40, 1, 'right'],
    from_town_harbor: [2, 18, 'right'], from_town_park: [41, 21, 'left'], from_school_grounds: [41, 2, 'left'],
    from_bakery: [bakery.front.x, bakery.front.y, 'down'], from_flower_shop: [flower.front.x, flower.front.y, 'down'],
    from_bookstore: [books.front.x, books.front.y, 'down'], from_corner_mart: [mart.front.x, mart.front.y, 'down'],
    from_clinic: [clinic.front.x, clinic.front.y, 'down'], from_town_hall: [hall.front.x, hall.front.y, 'down'],
  });

  // ---- warps: doors + the three road exits
  const door = (s, to, w = 1) => b.warp(s.door.x, s.door.y, w, 1, `${to}:from_town_square`, { sfx: 'door_open' });
  door(bakery, 'bakery'); door(flower, 'flower_shop'); door(books, 'bookstore'); door(mart, 'corner_mart'); door(clinic, 'clinic');
  b.warp(20, 5, 2, 1, 'town_hall:from_town_square', { sfx: 'door_open' });
  b.warp(0, 17, 1, 3, 'town_harbor:from_town_square');
  b.warp(43, 20, 1, 3, 'town_park:from_town_square');
  b.warp(43, 0, 1, 3, 'school_grounds:from_town_square');

  // ---- interactables
  b.interact('board', 12, 10, 2, 1, 'Town notice board', { type: 'board', id: 'town' });
  b.interact('vending', 31, 15, 1, 2, 'Vending machine', { type: 'shop', shop: 'vending_town' });
  b.interact('fountain', 19, 15, 5, 5, 'Fountain', { type: 'text', lines: ['The Bell Square fountain. Coins glint at the bottom: every one of them a wish.', 'Folks say the water sings a little on Bell Night, if you hold still.'] });
  b.interact('clock', 27, 16, 1, 1, 'Clock post', { type: 'text', lines: ['The old clock post keeps almost perfect time. Almost.'] });
  b.interact('bus_stop', 10, 21, 1, 1, 'Bus stop', { type: 'text', lines: ['Route 4: Harbor City. Next bus: whenever it feels like it.'] });
  b.interact('signpost', 8, 17, 1, 1, 'Signpost', { type: 'text', lines: ['West: Harbor Street. North-east: Bellhaven High (mind the stairs). East: Heron Pond Park.'] });
  return b.build();
}
