// Prefabs ("stamps"): multi-tile objects built from catalog tiles. b.stamp(name, x, y, opts) -> info.
// (x,y) is the TOP-LEFT of the footprint unless a stamp says otherwise (trees/lamps/vending take the BASE tile).
// Pure logic, importable in Node. Each stamp returns handy coordinates (door, front, ...).
import { hash2 } from './gfx.js';
import { RNG } from '../core/rng.js';

function roofTile(color, r, i, w) {
  const row = 'tmb'[r], side = i === 0 ? 'l' : i === w - 1 ? 'r' : '';
  const part = side ? row + side : row; // tl,t,tr / ml,m,mr / bl,b,br
  return `roof_${color}_${part}`;
}
function safePut(b, name, x, y, layer) { if (b.inBounds(x, y)) b.put(name, x, y, layer); }

function facade(b, x, y, o, mode) {
  const w = o.w ?? 6;
  if (w < 3) throw new Error(`${mode}: width must be >= 3`);
  const roof = o.roof ?? 'red', wall = o.wall ?? 'cream';
  const doorW = o.doorW ?? 1;
  const dc = o.doorX ?? Math.floor((w - doorW) / 2);
  const doorColor = o.door ?? (mode === 'shopfront' ? 'glass' : 'wood');
  for (let r = 0; r < 3; r++) for (let i = 0; i < w; i++) b.put(roofTile(roof, r, i, w), x + i, y + r);
  b.block(x, y, w, 3);
  for (let i = 0; i < w; i++) {
    const isDoor = i >= dc && i < dc + doorW;
    b.put(`wall_${wall}_eave`, x + i, y + 3);
    if (isDoor) {
      b.put(`door_${doorColor}_hi`, x + i, y + 3);
      b.put(`door_${doorColor}_lo`, x + i, y + 4);
      continue;
    }
    const dist = i < dc ? dc - i : i - (dc + doorW - 1);
    const winKind = o.windows === undefined ? (mode === 'shopfront' ? 'plain' : 'box') : o.windows;
    const edge = i === 0 || i === w - 1;
    if (winKind && dist % 2 === 1 && !(edge && w < 5)) b.put(winKind === 'plain' ? `win_${wall}` : `win_${wall}_${winKind}`, x + i, y + 4);
    else b.put(`wall_${wall}_base`, x + i, y + 4);
  }
  if (o.chimney !== undefined && o.chimney !== null) {
    const ci = o.chimney === true ? w - 2 : o.chimney;
    b.put(`roof_${roof}_chim`, x + ci, y);
    safePut(b, 'chimney_brick_top', x + ci, y - 1);
  }
  const info = { x, y, w, h: 5, door: { x: x + dc, y: y + 4, w: doorW }, front: { x: x + dc, y: y + 5 } };
  if (mode === 'shopfront') {
    const pc = dc + doorW < w ? dc + doorW : dc - 1;
    for (let i = 0; i < w; i++) {
      if (i >= dc && i < dc + doorW) continue;
      const p = i === 0 ? 'l' : i === w - 1 ? 'r' : 'm';
      if (i === pc && o.icon !== null) b.put(`plaque_${o.icon ?? 'bread'}`, x + i, y + 3);
      else b.put(`awning_${o.awning ?? 'red'}_${p}`, x + i, y + 3);
    }
  }
  if (o.plaque) safePut(b, `plaque_${o.plaque}`, x + dc, y + 2);
  return info;
}

const treeCanopy = { round: [3, 2], cherry: [3, 2], pine: [3, 3], palm: [3, 2] };

export const STAMPS = {
  // ----------------------------------------------------------------------- buildings
  /** house(x,y,{w=6, roof, wall, door, doorX, doorW, windows:'box'|'shut'|'plain'|'lit'|null, chimney:true|col, plaque}) -> {door,front} */
  house: (b, x, y, o = {}) => facade(b, x, y, o, 'house'),
  /** shopfront(x,y,{w, roof, wall, door:'glass', awning:'red', icon:'bread'|'flower'|'book'|'mart'|'clinic'|'cafe'|'fish'|'bell'}) */
  shopfront: (b, x, y, o = {}) => facade(b, x, y, o, 'shopfront'),
  /** town_hall(x,y,{w=12}): wide white hall with a double grand door, marble steps (info.steps) */
  town_hall(b, x, y, o = {}) {
    const w = o.w ?? 12;
    const info = facade(b, x, y, { roof: 'slate', wall: 'white', door: 'grand', doorW: 2, windows: 'lit', plaque: 'hall', w, ...o }, 'house');
    const sx = info.door.x - 1;
    for (let j = 0; j < 2; j++) for (let i = 0; i < 4; i++) b.put(`stairs_marble_${i === 0 ? 'l' : i === 3 ? 'r' : 'm'}`, sx + i, y + 5 + j);
    info.front = { x: info.door.x, y: y + 7 };
    info.steps = { x: sx, y: y + 5, w: 4, h: 2 };
    return info;
  },
  /** school_building(x,y,{w=18}) */
  school_building(b, x, y, o = {}) {
    return facade(b, x, y, { roof: 'slate', wall: 'cream', door: 'glass', doorW: 2, windows: 'lit', plaque: 'school_blue', w: 18, ...o }, 'house');
  },

  // ----------------------------------------------------------------------- nature
  /** tree(x,y,{kind:'round'|'cherry'|'pine'|'palm'}) -- (x,y) is the TRUNK tile; canopy is drawn on `above` over the rows above it */
  tree(b, x, y, o = {}) {
    const kind = o.kind ?? 'round';
    const [cw, ch] = treeCanopy[kind];
    const trunk = { round: 'trunk_round', cherry: 'trunk_cherry', pine: 'trunk_pine', palm: 'trunk_palm' }[kind];
    safePut(b, trunk, x, y);
    for (let r = 0; r < ch; r++) for (let c = 0; c < cw; c++) safePut(b, `tree_${kind}_${c}_${r}`, x - 1 + c, y - ch + r);
    return { x, y, trunk: { x, y }, front: { x, y: y + 1 } };
  },
  /** flowerbed(x,y,w,h,{kinds:[..], seed, density}) random flower tiles, optional hedge border */
  flowerbed(b, x, y, w, h, o = {}) {
    const r = new RNG((o.seed ?? 1) * 131 + x * 7 + y);
    const kinds = o.kinds ?? ['flowers_red', 'flowers_yellow', 'flowers_pink', 'flowers_white', 'flowers_mixed_a', 'flowers_mixed_b'];
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (r.chance(o.density ?? 0.85)) safePut(b, r.pick(kinds), x + i, y + j);
    if (o.border) { b.rect(o.border, x - 1, y - 1, w + 2, 1); b.rect(o.border, x - 1, y + h, w + 2, 1); b.rect(o.border, x - 1, y, 1, h); b.rect(o.border, x + w, y, 1, h); }
    return { x, y, w, h };
  },
  /** fence_line(x1,y1,x2,y2,{kind:'fence'|'picket'|'hedge'|'hedge_bloom'|'railing'|'lowwall'}) autotiled */
  fence_line(b, x1, y1, x2, y2, o = {}) { b.line(o.kind ?? 'fence', x1, y1, x2, y2, 1); return { x1, y1, x2, y2 }; },
  /** cliff_wall(x,y,w,{ivy}) a retaining wall / cliff face row (solid) */
  cliff_wall(b, x, y, w, o = {}) {
    for (let i = 0; i < w; i++) b.put(i === 0 && !o.open ? 'cliff_l' : i === w - 1 && !o.open ? 'cliff_r' : (o.ivy && hash2(x + i, y, 4) > 0.6 ? 'cliff_ivy' : 'cliff_a'), x + i, y);
    return { x, y, w };
  },
  /** stairs(x,y,w,h,{kind:'stone'|'wood'|'marble'}) vertical staircase climbing north */
  stairs(b, x, y, w, h, o = {}) {
    const k = o.kind ?? 'stone';
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) b.put(`stairs_${k}_${w === 1 ? 'lr' : i === 0 ? 'l' : i === w - 1 ? 'r' : 'm'}`, x + i, y + j);
    return { x, y, w, h };
  },

  // ----------------------------------------------------------------------- street furniture
  /** bench(x,y): 2 wide, front-facing. -> {front} (the tile you sit from) */
  bench(b, x, y) { b.put('bench_l', x, y); b.put('bench_r', x + 1, y); return { x, y, w: 2, front: { x, y: y + 1 } }; },
  /** lamp(x,y): (x,y) is the base; pole above it, lantern head on `above` */
  lamp(b, x, y) { b.put('lamp_base', x, y); safePut(b, 'lamp_mid', x, y - 1); safePut(b, 'lamp_head', x, y - 2); return { x, y, front: { x, y: y + 1 } }; },
  /** fountain(x,y): 5x5 plaza fountain, (x,y) top-left; animated water inside */
  fountain(b, x, y) {
    for (let j = 1; j <= 3; j++) for (let i = 1; i <= 3; i++) b.put('fountain_water', x + i, y + j);
    for (let j = 0; j < 5; j++) for (let i = 0; i < 5; i++) {
      const ring = i === 0 || i === 4 || j === 0 || j === 4;
      if (ring || (i === 2 && j === 2)) b.put(`fountain_${i}_${j}`, x + i, y + j);
    }
    b.put('fountain_2_1', x + 2, y + 1, 'above');
    return { x, y, w: 5, h: 5, center: { x: x + 2, y: y + 2 }, front: { x: x + 2, y: y + 5 } };
  },
  /** clock_post(x,y): (x,y) is the base tile */
  clock_post(b, x, y) { b.put('clockpost_base', x, y); b.put('clockpost_mid', x, y - 1); b.put('clockpost_top', x, y - 2); return { x, y, front: { x, y: y + 1 } }; },
  planter(b, x, y, o = {}) { b.put(o.kind === 'wood' ? 'planter_wood' : 'planter_stone', x, y); return { x, y }; },
  /** notice_board(x,y): 2 wide */
  notice_board(b, x, y) { b.put('noticeboard_l', x, y); b.put('noticeboard_r', x + 1, y); return { x, y, w: 2, front: { x, y: y + 1 } }; },
  /** vending(x,y,{color:'blue'|'red'}): (x,y) is the bottom tile */
  vending(b, x, y, o = {}) { const c = o.color ?? 'blue'; b.put(`vending_${c}_lo`, x, y); b.put(`vending_${c}_hi`, x, y - 1); return { x, y, front: { x, y: y + 1 } }; },
  bus_stop(b, x, y) { b.put('busstop_base', x, y); safePut(b, 'busstop_top', x, y - 1); return { x, y, front: { x, y: y + 1 } }; },
  bike_rack(b, x, y) { b.put('bikerack_l', x, y); b.put('bikerack_r', x + 1, y); return { x, y, w: 2, front: { x, y: y + 1 } }; },
  mailbox(b, x, y, o = {}) { b.put(o.color === 'blue' ? 'mailbox_blue' : 'mailbox_red', x, y); return { x, y }; },

  // ----------------------------------------------------------------------- indoor rooms & furniture
  /**
   * room(x,y,w,h,{wall:'cream', floor:'wood', floor2}) -- floor + walls. Top 2 rows are the wall face (hi, face),
   * left/right/bottom borders are 1-tile caps. Walkable interior = x+1..x+w-2, y+2..y+h-2. Floor alternates a/b.
   */
  room(b, x, y, w, h, o = {}) {
    const wall = o.wall ?? 'cream', floor = o.floor ?? 'wood';
    for (let j = 2; j < h - 1; j++) for (let i = 1; i < w - 1; i++) {
      const f = o.floor2 && (i + j) % 2 === 0 ? o.floor2 : floor;
      b.put(`floor_${f}_${hash2(x + i, y + j, 2) > 0.75 ? 'b' : 'a'}`, x + i, y + j);
    }
    for (let i = 0; i < w; i++) { b.put(`iwall_${wall}_hi`, x + i, y); b.put(`iwall_${wall}_face`, x + i, y + 1); b.put(`iwall_${wall}_cap_s`, x + i, y + h - 1); }
    for (let j = 2; j < h - 1; j++) { b.put(`iwall_${wall}_cap_l`, x, y + j); b.put(`iwall_${wall}_cap_r`, x + w - 1, y + j); }
    return { x, y, w, h, inner: { x: x + 1, y: y + 2, w: w - 2, h: h - 3 } };
  },
  /** window_in(x,y,{kind:'harbor'|'plain'|'curtain'|'school'}) on the 2 wall rows starting at y */
  window_in(b, x, y, o = {}) { b.put(`iwin_${o.kind ?? 'plain'}_hi`, x, y); b.put(`iwin_${o.kind ?? 'plain'}_face`, x, y + 1); return { x, y }; },
  /** door_in(x,y,{kind:'wood'|'school'|'white'|'stairs'}): (x,y) = top wall row; walkable door tile is (x,y+1); front = (x,y+2) */
  door_in(b, x, y, o = {}) { const k = o.kind ?? 'wood'; b.put(`idoor_${k}_hi`, x, y); b.put(`idoor_${k}_lo`, x, y + 1); return { door: { x, y: y + 1 }, front: { x, y: y + 2 } }; },
  /** bed(x,y,{color}) 1x2: head at (x,y), foot at (x,y+1) */
  bed(b, x, y, o = {}) { const c = o.color ?? 'blue'; b.put(`bed_${c}_head`, x, y); b.put(`bed_${c}_foot`, x, y + 1); return { x, y, w: 1, h: 2, front: { x, y: y + 2 }, side: { x: x + 1, y: y + 1 } }; },
  /** desk(x,y,{w=3, items:{col:'diary'|'lamp'|'books'|'papers'|'plant'|'globe'|'bell'}}) */
  desk(b, x, y, o = {}) {
    const w = o.w ?? 3;
    for (let i = 0; i < w; i++) { const it = o.items && o.items[i]; b.put(it ? `desk_m_${it}` : `desk_${w === 1 ? 'm' : i === 0 ? 'l' : i === w - 1 ? 'r' : 'm'}`, x + i, y); }
    return { x, y, w, front: { x: x + Math.floor(w / 2), y: y + 1 } };
  },
  /** table(x,y,{w=2, cloth:null|'red'|'blue'|'white'}) one row */
  table(b, x, y, o = {}) {
    const w = o.w ?? 2, c = o.cloth ? o.cloth + '_' : '';
    for (let i = 0; i < w; i++) b.put(`table_${c}${w === 1 ? 'o' : i === 0 ? 'l' : i === w - 1 ? 'r' : 'm'}`, x + i, y);
    return { x, y, w };
  },
  /** counter(x,y,{w=4, kind:'wood'|'marble'}) */
  counter(b, x, y, o = {}) {
    const w = o.w ?? 4;
    for (let i = 0; i < w; i++) b.put(`counter_${o.kind ?? 'wood'}_${i === 0 ? 'l' : i === w - 1 ? 'r' : 'm'}`, x + i, y);
    return { x, y, w, front: { x: x + 1, y: y + 1 } };
  },
  /** bookcase_row(x,y,n,{color:'brown'|'white'}) tall cases (2 rows) against the wall; y = upper tile */
  bookcase_row(b, x, y, n, o = {}) { for (let i = 0; i < n; i++) { b.put(`bookcase_${o.color ?? 'brown'}_hi`, x + i, y); b.put(`bookcase_${o.color ?? 'brown'}_lo`, x + i, y + 1); } return { x, y, w: n, front: { x, y: y + 2 } }; },
  /** tall(x,y,'wardrobe'|'fridge'|'plant_tall') 1x2: y = upper tile */
  tall(b, x, y, kind) { b.put(`${kind}_hi`, x, y); b.put(`${kind}_lo`, x, y + 1); return { x, y, front: { x, y: y + 2 } }; },
  /** sofa(x,y,{w=3,color}) */
  sofa(b, x, y, o = {}) { const w = o.w ?? 3; for (let i = 0; i < w; i++) b.put(`sofa_${o.color ?? 'red'}_${i === 0 ? 'l' : i === w - 1 ? 'r' : 'm'}`, x + i, y); return { x, y, w, front: { x: x + 1, y: y + 1 } }; },
  /** rug(x,y,w,h,{color}) goes on the GROUND layer under furniture */
  rug(b, x, y, w, h, o = {}) {
    const c = o.color ?? 'red';
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const pos = (j === 0 ? 't' : j === h - 1 ? 'b' : '') + (i === 0 ? 'l' : i === w - 1 ? 'r' : '');
      b.put(`rug_${c}_${pos || 'c'}`, x + i, y + j, 'ground');
    }
    return { x, y, w, h };
  },
  /** chair(x,y,{dir:'d'|'u'|'l'|'r', color:'wood'|'red'}) -- walkable (sit-able) */
  chair(b, x, y, o = {}) { b.put(`chair_${o.color ?? 'wood'}_${o.dir ?? 'd'}`, x, y); return { x, y }; },
  /** locker_row(x,y,n,{color}) y = upper tile (2 rows) */
  locker_row(b, x, y, n, o = {}) { for (let i = 0; i < n; i++) { b.put(`locker_${o.color ?? 'blue'}_hi`, x + i, y); b.put(`locker_${o.color ?? 'blue'}_lo`, x + i, y + 1); } return { x, y, w: n }; },
  /** blackboard(x,y,w,{text:[col->'1'|'2']}) on the wall face row (above wall hi) */
  blackboard(b, x, y, w) {
    for (let i = 0; i < w; i++) b.put(`blackboard_${i === 0 ? 'l' : i === w - 1 ? 'r' : 'm'}`, x + i, y);
    if (w >= 3) b.put('blackboard_m_text1', x + Math.floor(w / 2), y);
    if (w >= 5) b.put('blackboard_m_text2', x + 1 + Math.floor(w / 2), y);
    return { x, y, w, front: { x: x + Math.floor(w / 2), y: y + 1 } };
  },
  /**
   * desk_grid(x,y,cols,rows,{colGap:[...], pitchY:2}) school desks: desk tile at (cx,cy), chair (walkable) at (cx,cy+1).
   * cols = array of x offsets (or number for consecutive). Returns {seats:[{x,y}...]} row-major, seat = chair tile.
   */
  desk_grid(b, x, y, cols, rows, o = {}) {
    const xs = Array.isArray(cols) ? cols : Array.from({ length: cols }, (_, i) => i);
    const pitch = o.pitchY ?? 2;
    const seats = [];
    for (let r = 0; r < rows; r++) for (const cx of xs) {
      const dx = x + cx, dy = y + r * pitch;
      b.put((cx + r) % 5 === 0 ? 'schooldesk_b' : 'schooldesk_a', dx, dy);
      b.put('chair_wood_u', dx, dy + 1);
      seats.push({ x: dx, y: dy + 1 });
    }
    return { seats };
  },
};

