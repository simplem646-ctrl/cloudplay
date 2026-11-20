// Shop data (02 section 6). One entry for every id in SHOP_IDS (src/data/ids.js).
//   { id, name, keeper (npc id | null), open: { weekdays:[...], from:'HH:MM', to:'HH:MM', schoolDay? } | null, stock: [...] }
//   open: null            -> always open (vending machines)
//   open.schoolDay: true  -> only on school days (and within the hours)
//   times may run past midnight ('26:00' = 02:00, the day end)
//   stock entry: { item, price? (default: item.price), season?: [...], limit?: n (max per day) }
// Sold items must exist in items.js (a test checks it).

const ALL = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const MON_SAT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const SCHOOL_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const WARM = ['spring', 'summer'];
const COOL = ['autumn', 'winter'];

export const SHOPS = [
  {
    id: 'cafe_menu', name: 'The Lantern Cafe', keeper: 'roz',
    open: { weekdays: ALL, from: '07:00', to: '20:00' },
    stock: [
      { item: 'coffee', price: 4 },
      { item: 'latte', price: 5 },
      { item: 'tea', price: 3 },
      { item: 'hot_cocoa', price: 5, season: COOL },
      { item: 'juice', price: 4, season: WARM },
      { item: 'ice_cream', price: 5, season: ['summer'] },
      { item: 'sandwich', price: 6 },
      { item: 'pancakes', price: 8 },
      { item: 'veggie_soup', price: 6, season: COOL },
      { item: 'curry_plate', price: 9 },
      { item: 'cake_slice', price: 6 },
      { item: 'berry_tart', price: 7, season: ['spring', 'summer', 'autumn'] },
    ],
  },
  {
    id: 'corner_mart', name: 'Corner Mart', keeper: 'tomas',
    open: { weekdays: ALL, from: '06:30', to: '26:00' },
    stock: [
      { item: 'riceball' },
      { item: 'sandwich' },
      { item: 'bread' },
      { item: 'soda' },
      { item: 'juice' },
      { item: 'milk' },
      { item: 'sports_drink' },
      { item: 'energy_drink', limit: 4 },
      { item: 'candy' },
      { item: 'chocolate_bar' },
      { item: 'ice_cream', season: ['spring', 'summer', 'autumn'] },
      { item: 'coffee', price: 3 },
      { item: 'notebook' },
      { item: 'towel' },
      { item: 'umbrella', limit: 2 },
      { item: 'keychain' },
      { item: 'postcard_set' },
      { item: 'black_licorice' },
    ],
  },
  {
    id: 'bookstore', name: 'Larkin Books', keeper: 'mr_larkin',
    open: { weekdays: MON_SAT, from: '10:00', to: '18:00' },
    stock: [
      { item: 'textbook_math' },
      { item: 'textbook_literature' },
      { item: 'textbook_science' },
      { item: 'textbook_history' },
      { item: 'textbook_art' },
      { item: 'textbook_pe' },
      { item: 'workbook', limit: 3 },
      { item: 'notebook' },
      { item: 'flashcards', limit: 3 },
      { item: 'calculator' },
      { item: 'novel_mystery' },
      { item: 'novel_romance' },
      { item: 'sketchbook' },
      { item: 'postcard_set' },
      { item: 'star_chart' },
      { item: 'town_map' },
    ],
  },
  {
    id: 'bakery', name: 'Calder Bakery', keeper: 'mrs_calder',
    open: { weekdays: MON_SAT, from: '06:00', to: '17:00' },
    stock: [
      { item: 'bread' },
      { item: 'sweet_bun' },
      { item: 'cookie' },
      { item: 'cake_slice' },
      { item: 'sandwich' },
      { item: 'cookie_box', limit: 3 },
      { item: 'berry_tart', price: 6, season: ['spring', 'summer'] },
      { item: 'hot_cocoa', price: 4, season: COOL },
    ],
  },
  {
    id: 'flower_shop', name: 'Reyes Blooms', keeper: 'rosa',
    open: { weekdays: MON_SAT, from: '09:00', to: '18:00' },
    stock: [
      { item: 'rose_red' },
      { item: 'tulip_pink', season: ['spring'] },
      { item: 'daisy_white', season: WARM },
      { item: 'sunflower', price: 5, season: ['summer', 'autumn'] },
      { item: 'bouquet', limit: 3 },
      { item: 'silk_ribbon', limit: 3 },
      { item: 'paper_lantern', season: ['summer', 'autumn', 'winter'], limit: 3 },
    ],
  },
  {
    id: 'vending_school', name: 'School Vending Machine', keeper: null,
    open: null,
    stock: [
      { item: 'soda', price: 2 },
      { item: 'juice', price: 3 },
      { item: 'milk', price: 2 },
      { item: 'tea', price: 2 },
      { item: 'coffee', price: 3 },
      { item: 'sports_drink' },
      { item: 'energy_drink', limit: 3 },
    ],
  },
  {
    id: 'vending_town', name: 'Street Vending Machine', keeper: null,
    open: null,
    stock: [
      { item: 'soda', price: 3 },
      { item: 'juice', price: 3 },
      { item: 'tea', price: 3 },
      { item: 'coffee', price: 4 },
      { item: 'sports_drink', price: 4 },
      { item: 'hot_cocoa', price: 4, season: COOL },
      { item: 'ice_cream', price: 4, season: ['summer'] },
    ],
  },
  {
    id: 'cafeteria_lunch', name: 'School Cafeteria', keeper: null,
    open: { weekdays: SCHOOL_WEEK, from: '12:00', to: '13:30', schoolDay: true },
    stock: [
      { item: 'bento', limit: 2 },
      { item: 'curry_plate', limit: 2 },
      { item: 'sandwich', limit: 2 },
      { item: 'veggie_soup', limit: 2, season: COOL },
      { item: 'riceball', limit: 3 },
      { item: 'apple', limit: 3 },
      { item: 'milk', limit: 3 },
      { item: 'juice', limit: 3 },
    ],
  },
  {
    id: 'clinic_pharmacy', name: 'Clinic Pharmacy', keeper: 'dr_patel',
    open: { weekdays: MON_SAT, from: '09:00', to: '17:00' },
    stock: [
      { item: 'pep_tonic', limit: 2 },
      { item: 'vitamin_gummies' },
      { item: 'tea', price: 3 },
      { item: 'water_bottle' },
      { item: 'towel' },
    ],
  },
];

export const SHOP_BY_ID = Object.fromEntries(SHOPS.map((s) => [s.id, s]));
