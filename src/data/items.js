// Item data (02 section 6). `price` is the BUY price in dollars (0 = not sold anywhere).
// Fields: { id, name, category: 'food'|'gift'|'study'|'sport'|'key'|'misc', price, icon (ICON_NAMES entry),
//   desc (<= 60 chars), use?: { energy?, stat?: {math: 4}, flag?, meal?, keep? }, passive?: {...} }
//   use.meal  true -> counts as a meal (breakfast/lunch/dinner by clock) for the morning energy rule
//   use.keep  true -> not consumed when used
//   passive   effects that apply while the item is in the bag: { studyBonus: {subject|'all': n},
//             practiceBonus: n } (read via inventory.studyBonus / inventory.practiceBonus)
// Every non-key item can be given as a gift; tastes live in each NPC's dialogue pool (by id).

const food = (id, name, price, icon, energy, desc, extra = {}) => ({
  id, name, category: 'food', price, icon, desc, use: { energy, ...extra },
});
const gift = (id, name, price, icon, desc) => ({ id, name, category: 'gift', price, icon, desc });
const study = (id, name, price, icon, desc, extra = {}) => ({ id, name, category: 'study', price, icon, desc, ...extra });
const sport = (id, name, price, icon, desc, extra = {}) => ({ id, name, category: 'sport', price, icon, desc, ...extra });
const key = (id, name, icon, desc) => ({ id, name, category: 'key', price: 0, icon, desc });

export const ITEMS = [
  // ---------------------------------------------------------------- food & drink
  food('bread', 'Fresh Bread', 3, 'bread', 10, 'Still warm from Calder Bakery.'),
  food('sweet_bun', 'Sweet Bun', 3, 'bread', 9, 'A soft bun with a sugar glaze.'),
  food('riceball', 'Rice Ball', 3, 'riceball', 12, 'Salmon filling, wrapped in seaweed.'),
  food('sandwich', 'Egg Sandwich', 5, 'sandwich', 20, 'A proper lunch between two slices.', { meal: true }),
  food('cookie', 'Butter Cookie', 2, 'cookie', 6, 'Crumbly and buttery.'),
  food('cake_slice', 'Cake Slice', 6, 'cake', 12, 'Strawberry sponge with cream.'),
  food('candy', 'Fruit Candy', 2, 'candy', 5, 'A sticky little sweet.'),
  food('chocolate_bar', 'Chocolate Bar', 4, 'chocolate', 8, 'Plain milk chocolate.'),
  food('juice', 'Orange Juice', 3, 'juice', 8, 'Cold and bright.'),
  food('soda', 'Fizzy Soda', 2, 'soda', 6, 'Loud bubbles, zero nutrition.'),
  food('sports_drink', 'Sports Drink', 3, 'juice', 10, 'Salty-sweet. Runners swear by it.'),
  food('coffee', 'Hot Coffee', 3, 'coffee', 10, 'Black and strong.'),
  food('latte', 'Cafe Latte', 5, 'coffee', 12, 'Roz\'s latte, with a tiny foam heart.'),
  food('tea', 'Green Tea', 2, 'tea', 7, 'Grassy and calming.'),
  food('hot_cocoa', 'Hot Cocoa', 4, 'chocolate', 10, 'Thick, sweet, steaming.'),
  food('milk', 'Milk Carton', 2, 'milk', 7, 'Small carton, cold.'),
  food('apple', 'Apple', 2, 'apple', 6, 'Crisp and a little sour.'),
  food('ice_cream', 'Ice Cream', 4, 'icecream', 8, 'Two scoops in a cone.'),
  food('berry_tart', 'Berry Tart', 6, 'cake', 14, 'Buttery crust, glossy berries.'),
  food('pancakes', 'Pancake Stack', 7, 'cake', 24, 'Three fluffy pancakes with syrup.', { meal: true }),
  food('veggie_soup', 'Veggie Soup', 5, 'soup', 18, 'A warm bowl of vegetables.', { meal: true }),
  food('bento', 'School Bento', 7, 'bento', 28, 'Rice, egg roll, pickles, a smile.', { meal: true }),
  food('curry_plate', 'Harbor Curry', 8, 'curry', 30, 'Mild curry with fish cake.', { meal: true }),
  food('vitamin_gummies', 'Vitamin Gummies', 5, 'candy', 8, 'Chewy and suspiciously healthy.'),
  food('pep_tonic', 'Pep Tonic', 9, 'energy_drink', 35, 'Dr. Patel\'s herbal pick-me-up.'),

  // ---------------------------------------------------------------- gifts
  gift('rose_red', 'Red Rose', 8, 'flower_red', 'A single, very serious rose.'),
  gift('tulip_pink', 'Pink Tulip', 6, 'flower_pink', 'Cheerful and a bit shy.'),
  gift('daisy_white', 'White Daisies', 5, 'flower_white', 'A small, simple bunch.'),
  gift('sunflower', 'Sunflower', 5, 'flower_yellow', 'Taller than it looks in the shop.'),
  gift('bouquet', 'Seasonal Bouquet', 20, 'bouquet', 'Rosa\'s arrangement of the week.'),
  gift('plushie_bear', 'Bear Plushie', 18, 'plushie', 'Soft, round and judgement-free.'),
  gift('plushie_cat', 'Cat Plushie', 18, 'plushie', 'A grumpy little felt cat.'),
  gift('silk_ribbon', 'Silk Ribbon', 10, 'ribbon', 'Smooth, in a lovely colour.'),
  gift('hairpin', 'Enamel Hairpin', 12, 'hairpin', 'A tiny painted shell.'),
  gift('knit_scarf', 'Knit Scarf', 30, 'scarf', 'Long, warm, a little itchy.'),
  gift('silver_necklace', 'Silver Necklace', 55, 'necklace', 'A thin chain with a moon pendant.'),
  gift('perfume', 'Perfume', 40, 'perfume', 'Strong enough to announce you.'),
  gift('keychain', 'Lighthouse Keychain', 8, 'keychain', 'A tiny metal Bellhaven lighthouse.'),
  gift('lucky_charm', 'Lucky Charm', 12, 'charm', 'Guaranteed by nobody.'),
  gift('music_box', 'Music Box', 45, 'music_box', 'Plays a slow tune when opened.'),
  gift('sketchbook', 'Sketchbook', 14, 'sketchbook', 'Thick paper, blank pages.'),
  gift('novel_mystery', 'Mystery Novel', 18, 'novel', 'A body in chapter one.'),
  gift('novel_romance', 'Romance Novel', 18, 'novel', 'Slow burn, fast pages.'),
  gift('postcard_set', 'Postcard Set', 6, 'postcard', 'Harbor views, six cards.'),
  gift('seashell', 'Spiral Shell', 0, 'shell', 'Found on the cove. Not for sale.'),
  gift('paint_set', 'Paint Set', 35, 'paint_set', 'Twelve colours, one fine brush.'),
  gift('headphones', 'Headphones', 50, 'headphones', 'Big, black, good bass.'),
  gift('dark_chocolate', 'Dark Chocolate', 9, 'chocolate', '85 percent and unapologetic.'),
  gift('cookie_box', 'Cookie Box', 10, 'cookie', 'A tin of assorted cookies.'),
  gift('coffee_beans', 'Coffee Beans', 12, 'coffee', 'Roasted dark, smells amazing.'),
  gift('tea_leaves', 'Loose Tea Leaves', 12, 'tea', 'A tin of fragrant leaves.'),
  gift('paper_lantern', 'Paper Lantern', 15, 'lantern', 'A tiny lantern for the harbor.'),
  gift('disposable_camera', 'Disposable Camera', 38, 'camera', 'Twenty-four chances at a good photo.'),
  gift('star_chart', 'Star Chart', 16, 'map', 'Constellations of all four seasons.'),
  gift('cat_treats', 'Cat Treats', 5, 'paw', 'Irresistible to rooftop cats.'),
  gift('black_licorice', 'Black Licorice', 5, 'candy', 'Divisive. Very divisive.'),
  gift('whoopee_cushion', 'Whoopee Cushion', 5, 'star', 'A joke gift. Risky.'),

  // ---------------------------------------------------------------- study
  study('textbook_math', 'Math Textbook', 24, 'textbook_math', 'Worked examples. Study bonus: math.', { passive: { studyBonus: { math: 1 } } }),
  study('textbook_literature', 'Literature Reader', 22, 'textbook_lit', 'Essays and notes. Study bonus: literature.', { passive: { studyBonus: { literature: 1 } } }),
  study('textbook_science', 'Science Textbook', 24, 'textbook_sci', 'Diagrams galore. Study bonus: science.', { passive: { studyBonus: { science: 1 } } }),
  study('textbook_history', 'History Textbook', 22, 'textbook_hist', 'Dates and stories. Study bonus: history.', { passive: { studyBonus: { history: 1 } } }),
  study('textbook_art', 'Art & Music Guide', 20, 'book', 'Colour, rhythm, form. Study bonus: art.', { passive: { studyBonus: { art: 1 } } }),
  study('textbook_pe', 'P.E. Handbook', 15, 'book', 'Rules, form, anatomy. Study bonus: P.E.', { passive: { studyBonus: { pe: 1 } } }),
  study('workbook', 'Practice Workbook', 12, 'workbook', 'One sitting of drills (math and science).', { use: { stat: { math: 2, science: 2 } } }),
  study('notebook', 'Good Notebook', 6, 'notebook', 'Neat notes help every subject.', { passive: { studyBonus: { all: 1 } } }),
  study('flashcards', 'Flash Cards', 8, 'flashcards', 'Quick review of dates and words.', { use: { stat: { history: 3, literature: 2 } } }),
  study('calculator', 'Scientific Calculator', 18, 'calculator', 'Study bonus: math and science.', { passive: { studyBonus: { math: 1, science: 1 } } }),
  study('energy_drink', 'Energy Drink', 4, 'energy_drink', 'Fizzy focus in a can.', { use: { energy: 25 } }),

  // ---------------------------------------------------------------- sport
  sport('sneakers', 'Running Sneakers', 45, 'sneakers', 'Light shoes. Better club practice.', { passive: { practiceBonus: 1 } }),
  sport('soccer_ball', 'Soccer Ball', 28, 'ball_soccer', 'Slightly scuffed, well loved.'),
  sport('towel', 'Sports Towel', 8, 'towel', 'Soaks up sweat and tears.'),
  sport('water_bottle', 'Water Bottle', 10, 'water_bottle', 'Refill and go. Sip for a little energy.', { use: { energy: 5, keep: true } }),
  sport('stopwatch', 'Stopwatch', 22, 'stopwatch', 'Click, click. Every second counts.'),
  sport('relay_baton', 'Relay Baton', 15, 'baton', 'Hand it off cleanly.'),

  // ---------------------------------------------------------------- misc
  { id: 'umbrella', name: 'Umbrella', category: 'misc', price: 12, icon: 'umbrella', desc: 'Keeps you dry. Mostly.' },
  { id: 'town_map', name: 'Town Map', category: 'misc', price: 5, icon: 'map', desc: 'A folded map of Bellhaven.' },

  // ---------------------------------------------------------------- key items
  key('bell_clapper_core', 'Bell Clapper Core', 'bell_clapper', 'The iron heart of the school bell.'),
  key('bell_clapper_fitting', 'Clapper Fitting', 'bell_clapper', 'The bracket that holds the clapper.'),
  key('bell_clapper_rope', 'Bell Rope', 'bell_clapper', 'Strong rope and a brass strike plate.'),
  key('club_card', 'Club Card', 'club_card', 'Proof that you belong somewhere.'),
  key('old_letter', 'Old Letter', 'letter', 'Yellowed paper, careful handwriting.'),
  key('festival_ticket', 'Festival Ticket', 'ticket', 'Admit one. Keep it safe.'),
  key('observatory_key', 'Observatory Key', 'key', 'Opens the dome on Lantern Hill.'),
];

export const ITEM_BY_ID = Object.fromEntries(ITEMS.map((i) => [i.id, i]));
export const ITEM_CATEGORIES = ['food', 'gift', 'study', 'sport', 'key', 'misc'];
export const itemsByCategory = (category) => ITEMS.filter((i) => i.category === category);
