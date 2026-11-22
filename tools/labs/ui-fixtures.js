// Fake game state/data for the UI lab. A half-played game, every icon shape as an item, 11 NPCs, quests, festivals.
import { ICON_SHAPES, NPC_IDS } from '/src/core/registry.js';
import { defaultState } from '/src/core/state.js';

const PAL = ['#e86a5a', '#f2b632', '#6fb85a', '#5aa8d8', '#b48ae0', '#e8873a', '#c79a6b', '#f0a0c0'];
const CAT = (s) => (/^fish|eel|crab|shrimp/.test(s) ? 'fish' : /shell|starfish/.test(s) ? 'forage' : /mushroom|berry|herb|leaf|flower|acorn|pinecone|nut/.test(s) ? 'forage'
  : /bread|croissant|cake|cookie|pie|sandwich|soup|mug|teapot|cup|fruit|egg|cheese|honey/.test(s) ? 'food' : /book|scroll|letter/.test(s) ? 'book' : /key|lantern|map|lens|wick/.test(s) ? 'key' : /rod|bait|net/.test(s) ? 'tool'
  : /gem|crystal|star|heart|ribbon|feather/.test(s) ? 'gift' : 'material');
const titleCase = (s) => s.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export const items = {};
ICON_SHAPES.forEach((shape, i) => {
  const category = CAT(shape);
  items[shape] = {
    id: shape, name: titleCase(shape), desc: `A ${titleCase(shape).toLowerCase()} from around Lanternbrook. It has a pleasant, handmade look to it.`, category,
    price: { buy: category === 'key' ? null : 20 + (i % 9) * 15, sell: category === 'key' ? null : 8 + (i % 7) * 11 },
    icon: { shape, colors: [PAL[i % PAL.length], PAL[(i * 3 + 2) % PAL.length]] },
    tags: [], energy: category === 'food' ? 20 + (i % 4) * 10 : undefined, key: category === 'key' ? true : undefined,
  };
});

const npcDefs = [
  ['mira', 'Mira Hollis', 'f', 'Baker', { season: 'spring', day: 12 }, 'bright', 'Rises before dawn to knead dough; she hums while she works and pretends not to notice your smile.'],
  ['willa', 'Willa Thorne', 'f', 'Librarian', { season: 'autumn', day: 3 }, 'soft', 'Keeper of Thornfield Library. Quiet, precise, secretly writes poetry.'],
  ['juno', 'Juno Park', 'f', 'Sailor', { season: 'summer', day: 18 }, 'brisk', 'Harbor deckhand with a loud laugh and a map of every cove.'],
  ['rhea', 'Rhea Vale', 'f', 'Stargazer', { season: 'winter', day: 9 }, 'dreamy', 'Lives at the observatory. Knows the stars by their first names.'],
  ['celeste', 'Celeste Marlowe', 'f', 'Café owner', { season: 'summer', day: 5 }, 'bright', 'Runs the Copper Kettle with flair; plays piano after closing.'],
  ['odell', 'Odell Pennywhistle', 'm', 'Shopkeeper', { season: 'autumn', day: 21 }, 'deep', 'Sells a little of everything and knows everyone\'s business.'],
  ['theo', 'Theo Whitlock', 'm', 'Doctor', { season: 'spring', day: 25 }, 'soft', 'The town doctor; always carries peppermints.'],
  ['nana_fen', 'Nana Fen', 'f', 'Retired baker', { season: 'winter', day: 20 }, 'elder', 'Everyone\'s grandmother, whether they like it or not.'],
  ['gus', 'Gus Pelham', 'm', 'Fisherman', { season: 'summer', day: 2 }, 'gruff', 'Gruff old angler who talks to fish and ignores people.'],
  ['pip', 'Pip', 'm', 'Kid', { season: 'spring', day: 7 }, 'kid', 'A rascal with endless questions.'],
  ['ferris', 'Ferris Dunmore', 'm', 'Ferryman', null, 'elder', 'Tends the old ferry, rarely says more than he must.'],
];
export const npcs = {};
for (const [id, name, gender, role, birthday, voice, bio] of npcDefs) {
  npcs[id] = { id, name, short: name.split(' ')[0], age: 30, role, gender, romance: ['mira', 'willa', 'juno', 'rhea', 'celeste'].includes(id), portrait: false, birthday, home: 'town_square', bio, personality: ['kind'], voice };
}

export const quests = {
  m1_arrival: { id: 'm1_arrival', kind: 'main', title: 'A Quiet Arrival', desc: 'Settle into the old lamplighter\'s cottage.', stages: [{ id: 'a', text: 'Find the journal in the workshop.' }, { id: 'b', text: 'Show the journal to Mira.' }], reward: { money: 100 } },
  m3_baker: { id: 'm3_baker', kind: 'main', title: 'Warm Bread, Warm Light', desc: 'Help Mira restore the first lantern.', stages: [{ id: 'a', text: 'Knead dough at the bakery (0/2).' }], reward: { money: 200 } },
  side_pip: { id: 'side_pip', kind: 'side', title: 'Pip\'s Pebbles', giver: 'pip', desc: 'Pip wants five smooth pebbles.', stages: [{ id: 'a', text: 'Bring Pip 5 rocks (2/5).' }], reward: { money: 60 } },
  t_forage: { id: 't_forage', kind: 'tutorial', title: 'First Forage', desc: 'Pick something up from the woods.', stages: [{ id: 'a', text: 'Forage anything.' }], reward: {} },
};

export const festivals = {
  festival_blossom: { id: 'festival_blossom', name: 'Blossom Festival', date: { season: 'spring', day: 14 }, area: 'town_square', from: '10:00', to: '20:00' },
  festival_midsummer: { id: 'festival_midsummer', name: 'Midsummer Fair', date: { season: 'summer', day: 14 }, area: 'harbor', from: '10:00', to: '22:00' },
  festival_harvest: { id: 'festival_harvest', name: 'Harvest Fair', date: { season: 'autumn', day: 14 }, area: 'town_square', from: '10:00', to: '20:00' },
  festival_hearthlight: { id: 'festival_hearthlight', name: 'Hearthlight Eve', date: { season: 'winter', day: 14 }, area: 'town_square', from: '16:00', to: '24:00' },
  festival_lantern: { id: 'festival_lantern', name: 'Lantern Festival', date: { season: 'winter', day: 28 }, area: 'town_square', from: '16:00', to: '26:00' },
};

const fish = {
  minnow: { id: 'fish_small', name: 'Minnow', size: [4, 9], desc: 'Tiny and quick.' },
  trout: { id: 'fish_long', name: 'Brook Trout', size: [18, 40], desc: 'Likes cold water.' },
  puffer: { id: 'fish_round', name: 'Roundfish', size: [10, 24], desc: 'Round as a loaf.' },
  flounder: { id: 'fish_flat', name: 'Flounder', size: [20, 45], desc: 'Lies flat on the sea floor.' },
  eel: { id: 'eel', name: 'River Eel', size: [30, 80], desc: 'Slippery.' },
};
const forage = {
  brook_lane: { spring: [{ item: 'mushroom', weight: 2 }, { item: 'berry', weight: 2 }, { item: null, weight: 1 }], summer: [{ item: 'herb', weight: 2 }, { item: 'flower', weight: 2 }] },
  harbor: { summer: [{ item: 'shell_spiral', weight: 2 }, { item: 'shell_fan', weight: 1 }] },
  whispering_woods: { autumn: [{ item: 'acorn', weight: 2 }, { item: 'pinecone', weight: 1 }, { item: 'mushroom', weight: 1 }] },
};
const books = { b1: { id: 'b1', title: 'A Lamplighter\'s Primer', author: 'T. Wren' }, b2: { id: 'b2', title: 'Tides of the Harbor', author: 'J. Park' } };

export const data = {
  items, npcs, quests, festivals, fish, forage, books, shops: {}, jobs: {}, buildings: {}, schedules: {}, events: {}, mail: {}, interactions: {}, dialogue: {}, tutorial: [], errands: [],
  calendar: { festivals: Object.keys(festivals), weekly: [{ weekday: 'sat', text: 'Market day' }] },
  getItem: (id) => items[id] || null,
  getNpc: (id) => npcs[id] || null,
};

/** Half-played game: summer 12, 3:20 PM, rainy, 1,234 coins, some inventory, some friends. */
export function makeState() {
  const s = defaultState({ name: 'Kai' });
  s.time = { year: 1, season: 1, day: 12, minutes: 920 };
  s.weather = { today: 'rain', tomorrow: 'sunny' };
  s.player.money = 1234; s.player.energy = 62; s.player.area = 'market_street';
  const give = ['bread_loaf', 'berry', 'mushroom', 'fish_small', 'fish_long', 'cookie', 'tea_dummy', 'letter', 'key', 'lantern', 'cake_slice', 'honey_jar', 'flower', 'gem', 'rod', 'map', 'coin', 'egg'];
  let i = 0;
  for (const id of give) if (items[id]) s.inventory.slots[i++] = { id, qty: 1 + ((i * 3) % 7) };
  s.inventory.slots[9] = null;
  const aff = { mira: 520, willa: 240, juno: 110, rhea: 30, celeste: 0, odell: 380, theo: 90, nana_fen: 700, gus: 50, pip: 160 };
  for (const [id, a] of Object.entries(aff)) if (s.rel[id]) { s.rel[id].aff = a; s.rel[id].met = true; }
  s.rel.mira.status = 'dating';
  s.quests.active = { m3_baker: { stage: 0, progress: {}, since: 20 }, side_pip: { stage: 0, progress: {}, since: 22 } };
  s.quests.done = { t_forage: 8, m1_arrival: 12 };
  s.story.lanterns = 2;
  s.log.fish = { fish_small: { count: 4, maxSize: 8 }, fish_long: { count: 2, maxSize: 31 }, eel: { count: 1, maxSize: 64 } };
  s.log.forage = { mushroom: 5, berry: 12, herb: 3 };
  s.log.books = { b1: true };
  s.stats = { earned: 4210, spent: 2976, daysPlayed: 40, fishCaught: 7, forageCount: 20, steps: 9000 };
  s.meta.playSeconds = 7260;
  return s;
}

export function makeAudio(log) {
  const rec = (n) => (...a) => { log.push([n, ...a]); };
  return { init() {}, unlock: rec('unlock'), playMusic() {}, stopMusic() {}, playSfx: rec('sfx'), blip: rec('blip'), footstep() {}, setAmbience() {}, setVolume: rec('vol'), setMuted() {}, duckMusic() {}, tracks: [], sfxList: [], stats: () => ({}) };
}
export { NPC_IDS };
