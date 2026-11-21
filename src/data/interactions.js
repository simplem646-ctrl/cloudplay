// Flavour text and small scripts for interactables. Key: '<areaId>.<interactableId>'.
const t = (...lines) => ({ text: lines });

export default {
  _defaults: {
    sign: ['A painted sign, a little crooked.', 'The paint is fresh, but the post leans.'],
    noticeboard: ['Notes, flyers and a tiny drawing of a cat. Someone has pinned a spoon.'],
    bed: ['A bed. Soft, warm and very tempting.'],
    rest: ['A quiet place to rest.'],
    diary: ['Your diary. It records the days, one by one.'],
    chest: ['A sturdy chest. You can keep things in here.'],
    mailbox: ['A little mailbox. A red flag stands up when there is post.'],
    shop: ['The counter is tidy, with a little bell.'],
    job: ['A job board with a few friendly instructions.'],
    fishing: ['A good spot to fish. The water ripples gently.'],
    forage: ['Something is growing here.'],
    lamp: ['A street lamp. The glass is cracked and cold.', 'Someone has to light this each night.'],
    bench: ['A bench. Sit for a while and your energy comes back.', 'A good place to rest your feet.'],
    fountain: ['The fountain splashes cheerfully. Some coins lie at the bottom.'],
    shrine: ['A small, mossy shrine. Someone has left a candle.'],
    telescope: ['A telescope, pointed at the sky. It is best at night.'],
    bookshelf: ['Rows of books with creased spines.'],
    crafting: ['A workbench, covered in tools and sawdust.'],
    object: ['It looks perfectly ordinary, but loved.'],
  },

  // ---- Brook Lane
  'brook_lane.sign_bl': t('"Brook Lane. Please mind the ducks (when there are ducks)."', 'Someone has scratched a heart next to the arrow. It is probably Pip.'),
  'brook_lane.mailbox': t('Your mailbox. It squeaks. Maybe Theo will oil it, someday.'),
  'brook_lane.fishing_bl_1': t('The brook is shallow here, but clear and quick.'),

  // ---- Town Square
  'town_square.noticeboard': t('The noticeboard rustles in the breeze. Small jobs wait for helpful hands.'),
  'town_square.fountain': t('The clock tower chimes over the fountain. The water is cold and clear.', 'A coin glitters on the bottom. Make a wish if you like.'),
  'town_square.sign_sq': t('"Town Square. Home of the fountain, the clock and many opinions."', 'Below: "Please do not feed the pigeons. They have enough."'),
  'town_square.bench_sq_1': t('A bench with a good view of the clock tower. The seat is warm in the sun.'),
  'town_square.bench_sq_2': t('A bench in the shade. A scrap of poetry is carved into the arm: "sit".'),

  // ---- Market Street
  'market_street.sign_ms': t('"Market Street. Provisions, medicine, books, beds and gossip."'),
  'market_street.bench_ms_1': t('A bench in the sun. A cat is asleep at one end. It does not intend to move.'),

  // ---- Riverside Park
  'riverside_park.sign_rp': t('"Riverside Park. No running on the bridge. (Everyone runs on the bridge.)"'),
  'riverside_park.bench_rp_1': t('A bench by the flowerbeds. A bee is investigating a daisy.'),
  'riverside_park.bench_rp_2': t('A bench under a willow. The leaves tickle your head.'),
  'riverside_park.gazebo': t('A white gazebo with peeling paint. It is a favourite spot for picnics.', 'Someone has carved "M + ?" into one post. The question mark is new.'),

  // ---- Harbor
  'harbor.sign_hb': t('"Harbor. Fishing allowed from the pier. Throwing hats at gulls is not."'),
  'harbor.bench_hb_1': t('A bench by the boats. Gulls watch you with open suspicion.'),
  'harbor.fishing_hb_1': t('The pier creaks. Small fish dart in the green water below.'),
  'harbor.fishing_hb_3': t('Waves slap the sand. Something shimmers in the shallows.'),

  // ---- Whispering Woods
  'whispering_woods.sign_ww': t('"Whispering Woods. Stay on the path, or at least stay cheerful."'),
  'whispering_woods.shrine': t('A mossy lantern shrine. A few paper charms flutter in the breeze.', 'Someone left a ribbon here, long ago. It still smells faintly of cocoa.'),
  'whispering_woods.hollow_log': t('A hollow log. Something small has set up house inside. You decide not to disturb it.'),
  'whispering_woods.fishing_ww_1': t('The stream is cold and clear. Pebbles glitter at the bottom.'),

  // ---- Starview Hill
  'starview_hill.sign_sh': t('"Starview Hill. Best view of the sky in Lanternbrook. Bring a coat."'),
  'starview_hill.telescope': t('An old brass telescope on a wooden stand. At night, the stars look close enough to touch.'),
  'starview_hill.bench_sh_1': t('A bench at the top of the hill. The whole town is spread out below.'),

  // ---- Cottage
  'cottage.bed': t('Your bed. The quilt smells of cedar and old books.'),
  'cottage.diary': t('Your diary. The first page says: "Spring 1. New town. Good bread."'),
  'cottage.chest': t('A battered old chest. It was Tobias\' once. It is yours now, and still creaks.'),
  'cottage.bookshelf_home': t('A shelf of Tobias\' old books. Most are about lamps. Some are about tea. One is about both.'),
  'cottage.calendar_wall': t('A paper calendar with festivals circled in red ink. The Lantern Festival is circled twice.'),
  'cottage.stove': t('A small stove. It smells faintly of toast. You will never be hungry here.'),

  // ---- Workshop
  'workshop.lantern_shelf': { when: { flag: 'workshop_unlocked' }, text: ['Rows of small lanterns, all dusty, all carefully labelled. Each name is one you know.', 'Six hooks. Five lanterns are missing, and one is waiting for you.'] },
  'workshop.trunk_workshop': t('A trunk full of lamp parts: wicks, hinges, glass, and a tin of buttons for some reason.'),
  'workshop.bench_workshop': t('Tobias\' workbench. His tools hang in neat rows. A cup of cold tea is still on the corner.'),

  // ---- Town hall
  'town_hall.desk_mayor': t('The Mayor\'s desk. A pun has been written on a sticky note: "Time flies like an arrow."'),
  'town_hall.flag_hall': t('The town flag. A little brass lantern is stitched in the corner.'),
  'town_hall.job_lamplighter': t('The lamplighter\'s hook. A brass lighter hangs here, polished by years of use.'),

  // ---- Bakery
  'bakery.oven': t('The big oven glows. The warmth is delicious. Do not touch.'),
  'bakery.shop_bakery': t('A tray of honey rolls steams under a cloth.'),
  'bakery.job_bakery': t('A sign: "Hands washed? Apron on? Good. Press, fold, turn."'),

  // ---- Cafe
  'cafe.coffee_machine': t('A shiny brass coffee machine. Rhea polishes it twice a day, at least.'),
  'cafe.piano_cf': t('An upright piano. A sheet of music sits open to a half-finished tune.'),
  'cafe.shop_cafe': t('The menu is written in neat chalk. The "cake" line has been rubbed out three times.'),

  // ---- General store
  'general_store.shelf_gs_1': t('Jars of everything: nails, buttons, sugar and one pickled mystery.'),
  'general_store.shop_general': t('The counter is stacked with bargains and a very large bell.'),
  'general_store.post_counter': t('The post counter. Letters, parcels and a small brass scale.'),

  // ---- Clinic
  'clinic.clinic_bed': t('A clean, soft bed with a patchwork quilt. You could nap here for free.'),
  'clinic.shop_clinic': t('Bottles of herbs, neat labels, and a kettle that is never cold.'),

  // ---- Inn
  'inn.hearth': t('A fire crackles in the hearth. Somebody has hung stockings to dry.'),
  'inn.shop_inn': t('The inn menu hangs by the door. The stew has a little drawing of a heron.'),

  // ---- Fishing hut
  'fishing_hut.fish_ledger': t('A ledger of famous catches. Gus has written "BIGGER THAN IT LOOKS" next to most of them.'),
  'fishing_hut.tackle_wall': t('Hooks, lines, bobbers and a very old boot nailed to the wall as a trophy.'),
  'fishing_hut.shop_fishing': t('A bucket of bait sits on the counter. It wriggles slightly.'),

  // ---- Observatory
  'observatory.telescope_big': t('A huge brass telescope pointed through the dome. The night sky waits patiently.'),
  'observatory.desk_obs': t('A desk covered in notes about stars. A pencil has been chewed in thought.'),
  'observatory.star_map': {
    script: [
      { if: [{ quest: { id: 'm7_stargazer', state: 'active', stage: 1 } }, { not: { item: { id: 'mentor_notes', gte: 1 } } }], then: [
        { narrate: 'Under the star map you find a bundle of papers tied with blue thread. They are covered in careful diagrams of the town lamps.' },
        { giveItem: 'mentor_notes' },
        { toast: 'Found: Mentor\'s Notes' },
        { end: true },
      ] },
      { narrate: 'A beautiful map of the night sky. Tiny gold pins mark the lamps of Lanternbrook, and they form a shape.' },
    ],
  },

  // ---- Library
  'library.desk_library': t('Willa\'s desk. A stack of due-date cards and one very neat pencil.'),
  'library.bookshelf_lib_1': t('Shelf of nature and sea stories. A pressed leaf marks one page.'),
  'library.bookshelf_lib_2': t('Shelf of cooking and tea. It smells faintly of cinnamon.'),
  'library.bookshelf_lib_3': t('Shelf of stars and fairy tales. A tiny star has been drawn on the spine of one.'),
  'library.bookshelf_lib_4': {
    script: [
      { if: [{ quest: { id: 'm4_reader', state: 'active', stage: 1 } }], then: [
        { narrate: 'The lamplighter\'s shelf. "Where the lamplighter reads, look for the lamp." Your fingers find a thick almanac.' },
        { narrate: 'Tucked between the pages is a folded paper covered in lantern diagrams. It is Tobias\' blueprint!' },
        { setFlag: 'found_blueprint_book' },
        { toast: 'Found the Blueprint! Show Willa.' },
        { end: true },
      ] },
      { narrate: 'The lamplighter\'s shelf. Almanacs, festival histories and a bookmark with a tiny lantern on it.' },
    ],
  },
  'library.bookshelf_lib_5': t('Shelf of woodland, mushrooms and fish stories. One book says: "CAUTION: MUSHROOMS."'),
  'library.bookshelf_lib_6': t('Shelf of poems and drafts. One notebook has been tucked in sideways, as if hiding.'),
};
