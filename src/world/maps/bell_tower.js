// Bell Tower: a narrow stone shaft. Stairs wind up in two flights between landings to the great bell. 12x16.
import { MapBuilder } from '../builder.js';

export default function build() {
  const b = new MapBuilder('bell_tower', { name: 'Bell Tower', ambient: { music: 'tense', lighting: 'indoor', weather: false, ambience: null } });
  b.stamp('room', 0, 0, 12, 16, { wall: 'stone', floor: 'stone' });

  // solid stone masses between the flights (the shaft walls)
  const mass = (x, y, w, h) => { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) b.put(j === 0 ? 'iwall_stone_hi' : j === 1 ? 'iwall_stone_face' : 'iwall_stone_cap_s', x + i, y + j); };
  mass(5, 9, 6, 3); // between flight A and the right wall
  mass(1, 4, 7, 3); // between landing B and flight B

  // flights: A (x1-3, y9-11) up to landing B (y7-8); B (x8-10, y4-6) up to the top landing (y2-3)
  b.stamp('stairs', 1, 9, 3, 3, { kind: 'stone' });
  b.stamp('stairs', 8, 4, 3, 3, { kind: 'stone' });

  // slit windows with sea light, and the great bell at the top
  b.stamp('window_in', 2, 0, { kind: 'plain' });
  b.stamp('window_in', 9, 0, { kind: 'plain' });
  b.put('desk_m_bell', 5, 2);
  b.put('desk_m_bell', 6, 2);
  b.put('rock_d', 4, 2);
  b.put('rock_d', 7, 2);
  b.put('frame_landscape', 5, 0);

  // landing details: lantern table, stumps for crates, dust, a worn rug at the foot of the stair
  b.put('table_o', 9, 7); b.put('plant_pot', 1, 7);
  b.put('stump_a', 10, 13); b.put('stump_b', 1, 13);
  b.put('pebbles_a', 4, 14); b.put('pebbles_b', 8, 12);
  b.put('desk_m_lamp', 10, 8);
  b.stamp('rug', 4, 12, 3, 2, { color: 'red' });

  // exit door in the bottom wall back to the rooftop
  b.put('idoor_wood_lo', 5, 15);

  b.setAnchors({
    entrance: [5, 13, 'up'], center: [5, 3, 'down'],
    spot_a: [2, 12, 'right'], spot_b: [6, 8, 'up'], spot_c: [9, 3, 'left'], spot_d: [3, 3, 'right'],
    npc_1: [5, 3, 'up'], npc_2: [7, 3, 'left'], npc_3: [3, 8, 'right'], npc_4: [8, 13, 'left'], npc_5: [9, 8, 'left'], npc_6: [2, 13, 'right'],
    base: [5, 13, 'up'], stairs_mid: [4, 8, 'up'], top: [5, 3, 'up'], bell: [5, 3, 'up'],
    from_school_rooftop: [5, 14, 'up'],
  });
  b.warp(5, 15, 1, 1, 'school_rooftop:from_bell_tower', { sfx: 'door_open' });

  b.interact('bell', 5, 2, 2, 1, 'The great bell', { type: 'text', lines: ['The great bell hangs in the dark, green-bronze and enormous. Its rope trails down, frayed at the end.', 'It has been silent for years. Standing under it, you can almost feel it wanting to ring.'] });
  return b.build();
}
