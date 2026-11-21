// Fish definitions. Each id is also an item id. spots are WATER_KINDS.
const SEA = ['spring', 'summer', 'autumn', 'winter'];
const FAIR = ['sunny', 'cloudy'];
const WET = ['rain', 'storm'];
const ANY = ['sunny', 'cloudy', 'rain', 'storm', 'snow'];
const DAY = { from: '06:00', to: '26:00' };

const f = (id, name, spots, seasons, weather, time, weight, difficulty, size, desc) =>
  ({ id, name, spots, seasons, weather, time, weight, difficulty, size, desc });

export const FISH = [
  f('brook_minnow', 'Brook Minnow', ['brook', 'stream'], SEA, ANY, DAY, 9, 1, [4, 9], 'A tiny, quick fish. It flashes like a coin in the stream.'),
  f('pebble_loach', 'Pebble Loach', ['brook', 'river'], ['spring', 'summer', 'autumn'], ANY, DAY, 7, 1, [6, 14], 'Speckled like the stones it hides under.'),
  f('silver_trout', 'Silver Trout', ['brook', 'river'], ['spring', 'autumn'], [...FAIR, 'rain'], { from: '06:00', to: '20:00' }, 6, 2, [18, 40], 'A lively trout with a shiny silver belly.'),
  f('river_perch', 'River Perch', ['river'], ['spring', 'summer', 'autumn'], ANY, DAY, 7, 2, [15, 35], 'Striped green and gold. Good in a stew.'),
  f('golden_carp', 'Golden Carp', ['river'], ['summer', 'autumn'], FAIR, { from: '08:00', to: '17:00' }, 3, 3, [30, 70], 'Slow, plump and gleaming.'),
  f('mossy_catfish', 'Mossy Catfish', ['river', 'brook'], ['spring', 'summer', 'autumn'], WET, DAY, 5, 3, [35, 80], 'Grumpy whiskers, mossy back. Loves rainy days.'),
  f('sunny_bream', 'Sunny Bream', ['river'], ['summer'], ['sunny'], { from: '09:00', to: '18:00' }, 6, 2, [18, 38], 'A summer fish that likes to bask near the surface.'),
  f('frost_char', 'Frost Char', ['brook', 'river', 'stream'], ['winter'], ANY, DAY, 6, 3, [20, 45], 'Pale and cold-loving. Only bites in winter.'),
  f('harbor_sardine', 'Harbor Sardine', ['pier'], SEA, ANY, DAY, 9, 1, [8, 18], 'Shoals of them dart under the pier.'),
  f('striped_mackerel', 'Striped Mackerel', ['pier'], ['summer', 'autumn'], ANY, { from: '05:00', to: '22:00' }, 6, 2, [22, 45], 'Blue stripes and a strong tug.'),
  f('sea_bass', 'Sea Bass', ['pier', 'beach'], ['spring', 'summer', 'autumn'], ANY, DAY, 5, 3, [30, 70], 'A sturdy fish and a harbor favourite.'),
  f('blue_tuna', 'Blue Tuna', ['pier'], ['summer', 'autumn'], ['sunny', 'cloudy', 'rain'], { from: '06:00', to: '12:00' }, 2, 4, [80, 160], 'Big and strong. Hold on tight!'),
  f('pearl_flounder', 'Pearl Flounder', ['beach'], ['spring', 'winter', 'autumn'], ANY, DAY, 5, 3, [25, 55], 'Flat as a plate, with a pearly shimmer.'),
  f('rock_crab', 'Rock Crab', ['beach'], SEA, FAIR, DAY, 5, 2, [10, 22], 'It pinches. It also tastes wonderful.'),
  f('spiny_shrimp', 'Spiny Shrimp', ['beach'], ['summer', 'spring'], ANY, { from: '06:00', to: '20:00' }, 7, 1, [5, 12], 'A little shrimp from the beach shallows.'),
  f('glow_eel', 'Glow Eel', ['pier', 'river'], ['summer', 'autumn'], ANY, { from: '20:00', to: '27:00' }, 3, 4, [40, 90], 'Faintly glowing. It only comes out at night.'),
  f('stream_trout', 'Stream Trout', ['stream'], ['spring', 'summer', 'autumn'], ANY, DAY, 8, 2, [18, 38], 'A woodland trout, cool and clean-tasting.'),
  f('mossback_crayfish', 'Mossback Crayfish', ['stream'], SEA, ANY, DAY, 6, 2, [8, 16], 'It hides under stones in the forest stream.'),
  f('glowfin_dace', 'Glowfin Dace', ['stream', 'brook'], ['spring', 'summer', 'autumn'], ANY, { from: '19:00', to: '27:00' }, 4, 3, [10, 22], 'Its fins glow softly after dark.'),
  f('moonscale_koi', 'Moonscale Koi', ['river'], SEA, ['sunny', 'cloudy', 'rain'], { from: '21:00', to: '27:00' }, 1, 5, [60, 110], 'Legendary. Its scales shine like moonlight on the river.'),
  f('old_grandfin', 'Old Grandfin', ['pier', 'beach'], SEA, ['rain', 'storm'], { from: '05:00', to: '10:00' }, 1, 5, [120, 220], 'Legendary. Sailors swear it is older than the lighthouse.'),
];

export default Object.fromEntries(FISH.map((x) => [x.id, x]));
