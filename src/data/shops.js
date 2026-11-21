// Shops. stock rows: s(item, price?, { seasons?, limit? })
const s = (item, price, opt = {}) => ({ item, ...(price != null ? { price } : {}), ...opt });
const WARM = ['spring', 'summer', 'autumn'];

export default {
  general_store: {
    id: 'general_store', name: 'Pennywhistle Provisions', owner: 'barnaby', area: 'general_store', counter: 'shop_general',
    greeting: 'Welcome to Pennywhistle Provisions! If we do not have it, you probably do not need it!',
    stock: [
      s('bread', 40), s('cheese', 30), s('egg', 12), s('milk', 14), s('flour', 15), s('sugar', 12), s('butter', 18),
      s('boiled_egg', 15), s('lemonade', 30, { seasons: ['spring', 'summer'] }), s('rope', 18), s('plank', 20), s('copper_wire', 25),
      s('lamp_oil', 35), s('lamp_glass', 30), s('wick_cotton', 14), s('cloth_scrap', 10), s('brass_gear', 45),
      s('umbrella', 80), s('bug_net_toy', 45), s('ink_bottle', 45), s('knitting_wool', 40), s('paper_lantern', 50, { seasons: ['autumn', 'winter'] }),
    ],
    buys: 'all', sellMult: 1,
  },
  bakery: {
    id: 'bakery', name: 'Rye & Rose Bakery', owner: 'rosalind', area: 'bakery', counter: 'shop_bakery',
    greeting: 'Fresh out of the oven! Mind the crumbs, and do not touch the cakes until you have paid.',
    stock: [
      s('bread', 40), s('honey_roll', 35), s('cookie', 25), s('cake_slice', 90), s('croissant', 55), s('sweet_bun', 30),
      s('berry_tart', 75, { seasons: ['summer', 'autumn'] }), s('apple_pie', 110, { seasons: ['autumn', 'winter'] }),
      s('flour', 15), s('sugar', 12), s('butter', 18), s('vanilla_pod', 40),
    ],
    buys: ['food', 'forage'], sellMult: 1,
  },
  cafe: {
    id: 'cafe', name: 'Copper Kettle Café', owner: 'rhea', area: 'cafe', counter: 'shop_cafe',
    greeting: 'Table or take-away? Either way, please do not ask for sugar in the espresso.',
    stock: [
      s('coffee', 50), s('tea', 35), s('herbal_tea', 40), s('hot_cocoa', 45), s('lemonade', 30, { seasons: ['spring', 'summer'] }),
      s('croissant', 55), s('cheese_sandwich', 60), s('cake_slice', 90), s('coffee_beans', 30), s('tea_leaves', 22), s('cocoa_beans', 40),
      s('spice_mix', 55),
    ],
    buys: ['food'], sellMult: 1,
  },
  clinic: {
    id: 'clinic', name: 'Whitlock Clinic', owner: 'elias', area: 'clinic', counter: 'shop_clinic',
    greeting: 'No appointment needed. Sit down, drink some tea, and tell me what hurts.',
    stock: [
      s('herbal_tea', 40), s('mint', 25), s('chamomile', 30), s('boiled_egg', 15), s('fruit_basket', 60),
      s('milk', 14), s('lavender', 35), s('scented_candle', 70),
    ],
    buys: ['forage'], sellMult: 1,
  },
  inn: {
    id: 'inn', name: 'Heron Inn', owner: 'nana_fen', area: 'inn', counter: 'shop_inn',
    greeting: 'Sit, dear, sit. The stew is hot and the tea is hotter.',
    stock: [
      s('fish_stew', 85), s('mushroom_soup', 70), s('grilled_fish', 65), s('cheese_sandwich', 60), s('tea', 35), s('hot_cocoa', 45),
      s('roast_chestnuts', 30, { seasons: ['autumn', 'winter'] }), s('fruit_basket', 60), s('picnic_basket', 120, { seasons: WARM }),
      s('boiled_egg', 15),
    ],
    buys: ['food'], sellMult: 1,
  },
  fishing_hut: {
    id: 'fishing_hut', name: "Pelham's Fishing Hut", owner: 'gus', area: 'fishing_hut', counter: 'shop_fishing',
    greeting: 'Bait, line and a fish tale or two. What can the old captain do for you?',
    stock: [
      s('bait', 6), s('fishing_rod', 350, { limit: 1 }), s('rope', 18), s('seaweed_snack', 20), s('grilled_fish', 65),
      s('brass_compass', 200, { limit: 1 }), s('book_fish_ledger', 60, { limit: 1 }),
    ],
    buys: ['fish'], sellMult: 1.1,
  },
  peddler: {
    id: 'peddler', name: "Sable's Stall", owner: 'sable', area: 'town_square', counter: null,
    greeting: 'Rare things from far places! Look, but be quick, because I leave on Monday.',
    stock: [
      s('moonstone', 420, { limit: 1, seasons: ['spring', 'autumn'] }),
      s('amethyst', 330, { limit: 1, seasons: ['summer', 'winter'] }),
      s('ruby', 480, { limit: 1, seasons: ['autumn'] }),
      s('jade_figurine', 320, { limit: 1, seasons: ['spring', 'winter'] }),
      s('amber_pendant', 280, { limit: 1, seasons: ['summer', 'autumn'] }),
      s('music_box', 300, { limit: 1 }),
      s('silver_locket', 340, { limit: 1, seasons: ['winter', 'spring'] }),
      s('mini_lantern', 130, { limit: 2 }),
      s('lucky_coin', 300, { limit: 1 }),
      s('star_map_print', 150, { limit: 2, seasons: ['summer', 'autumn', 'winter'] }),
      s('spice_mix', 60, { limit: 3 }), s('vanilla_pod', 45, { limit: 3 }),
      s('pocket_watch', 380, { limit: 1, seasons: ['winter'] }),
      s('crystal_geode', 200, { limit: 1, seasons: ['spring', 'summer'] }),
      s('kite', 95, { limit: 2, seasons: ['spring', 'autumn'] }),
    ],
    buys: 'all', sellMult: 1.15,
  },
  flower_stall: {
    id: 'flower_stall', name: "Hattie's Flower Stall", owner: 'hattie', area: 'town_square', counter: null,
    greeting: 'Fresh flowers, picked this morning! And have you heard the latest? Oh, buy something first.',
    stock: [
      s('rose', 60), s('daisy_bundle', 25), s('wildflower_bouquet', 45), s('tulip', 40, { seasons: ['spring', 'summer'] }),
      s('lily', 55, { seasons: ['spring', 'summer'] }), s('lavender', 35, { seasons: ['summer', 'autumn'] }),
      s('marigold', 30, { seasons: ['summer', 'autumn'] }), s('sunflower', 60, { seasons: ['summer'] }),
      s('snowdrop', 40, { seasons: ['winter'] }), s('holly_sprig', 20, { seasons: ['winter'] }),
    ],
    buys: ['forage'], sellMult: 1,
  },
};
