// The five festivals. eventId points into data/events. placement tells Systems where villagers stand.
export default {
  blossom: {
    id: 'blossom', name: 'Blossom Picnic', date: { season: 'spring', day: 14 }, area: 'riverside_park', from: '10:00', to: '18:00',
    eventId: 'festival_blossom', decor: 'spring_picnic', closes: ['bakery', 'cafe', 'library'],
    placement: {
      default: { area: 'riverside_park', anchors: ['picnic_blanket', 'gazebo_spot', 'flower_bed', 'bench_rp_1_spot', 'bench_rp_2_spot', 'pond_edge', 'duck_corner', 'swing'] },
      byNpc: {
        mira: { area: 'riverside_park', at: 'picnic_blanket' }, rosalind: { area: 'riverside_park', at: 'bench_rp_1_spot' },
        willa: { area: 'riverside_park', at: 'flower_bed' }, hattie: { area: 'riverside_park', at: 'gazebo_spot' },
        pip: { area: 'riverside_park', at: 'duck_corner' }, lottie: { area: 'riverside_park', at: 'swing' },
        ferris: { area: 'riverside_park', at: 'pond_edge' }, odell: { area: 'riverside_park', at: 'bridge_mid' },
      },
    },
  },
  midsummer: {
    id: 'midsummer', name: 'Midsummer Lights', date: { season: 'summer', day: 21 }, area: 'harbor', from: '18:00', to: '23:00',
    eventId: 'festival_midsummer', decor: 'midsummer', closes: ['library', 'clinic'],
    placement: {
      default: { area: 'harbor', anchors: ['beach_shells', 'pier_start', 'sunset_spot', 'crates', 'net_rack', 'boat_dock', 'harbor_bench_spot'] },
      byNpc: {
        juno: { area: 'harbor', at: 'pier_end' }, gus: { area: 'harbor', at: 'lighthouse_base' }, rhea: { area: 'harbor', at: 'sunset_spot' },
        celeste: { area: 'harbor', at: 'beach_shells' }, odell: { area: 'harbor', at: 'pier_start' }, theo: { area: 'harbor', at: 'crates' },
      },
    },
  },
  harvest: {
    id: 'harvest', name: 'Autumn Moon Fair', date: { season: 'autumn', day: 14 }, area: 'town_square', from: '10:00', to: '21:00',
    eventId: 'festival_harvest', decor: 'harvest_fair', closes: ['general_store', 'library'],
    placement: {
      default: { area: 'town_square', anchors: ['plaza_center', 'fountain_spot', 'noticeboard_spot', 'tree_shade', 'bench_sq_1_spot', 'bench_sq_2_spot', 'cafe_terrace_1', 'cafe_terrace_2'] },
      byNpc: {
        willa: { area: 'town_square', at: 'stage' }, mira: { area: 'town_square', at: 'bakery_steps' }, rosalind: { area: 'town_square', at: 'bakery_steps' },
        rhea: { area: 'town_square', at: 'cafe_terrace_1' }, hattie: { area: 'town_square', at: 'flower_stall' }, odell: { area: 'town_square', at: 'hall_steps' },
        juno: { area: 'town_square', at: 'noticeboard_spot' }, barnaby: { area: 'town_square', at: 'plaza_center' }, sable: { area: 'town_square', at: 'tree_shade' },
      },
    },
  },
  hearthlight: {
    id: 'hearthlight', name: 'Hearthlight Evening', date: { season: 'winter', day: 10 }, area: 'inn', from: '17:00', to: '22:00',
    eventId: 'festival_hearthlight', decor: 'hearthlight', closes: ['bakery', 'cafe', 'general_store'],
    placement: {
      default: { area: 'inn', anchors: ['hearth_spot', 'table_inn_1', 'table_inn_2', 'table_inn_3', 'reception_front'] },
      byNpc: {
        nana_fen: { area: 'inn', at: 'behind_reception' }, odell: { area: 'inn', at: 'hearth_spot' }, rhea: { area: 'inn', at: 'kitchen' },
        mira: { area: 'inn', at: 'table_inn_1' }, theo: { area: 'inn', at: 'table_inn_2' }, gus: { area: 'inn', at: 'table_inn_3' },
      },
    },
  },
  lantern: {
    id: 'lantern', name: 'Winter Lantern Festival', date: { season: 'winter', day: 24 }, area: 'town_square', from: '16:00', to: '22:00',
    eventId: 'festival_lantern', decor: 'lantern_festival', closes: ['bakery', 'cafe', 'general_store', 'library', 'clinic', 'inn'],
    placement: {
      default: { area: 'town_square', anchors: ['plaza_center', 'fountain_spot', 'tree_shade', 'bench_sq_1_spot', 'bench_sq_2_spot', 'cafe_terrace_1', 'cafe_terrace_2', 'noticeboard_spot'] },
      byNpc: {
        odell: { area: 'town_square', at: 'stage' }, mira: { area: 'town_square', at: 'bakery_steps' }, willa: { area: 'town_square', at: 'clock_tower' },
        juno: { area: 'town_square', at: 'fountain_spot' }, rhea: { area: 'town_square', at: 'cafe_terrace_1' }, celeste: { area: 'town_square', at: 'hall_steps' },
        theo: { area: 'town_square', at: 'plaza_center' }, nana_fen: { area: 'town_square', at: 'bench_sq_1_spot' }, gus: { area: 'town_square', at: 'bench_sq_2_spot' },
        hattie: { area: 'town_square', at: 'flower_stall' }, henrik: { area: 'town_square', at: 'tree_shade' },
      },
    },
  },
};
