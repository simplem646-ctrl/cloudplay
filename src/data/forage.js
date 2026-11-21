// Forage tables: area -> season -> [{ item, weight }]. item:null = nothing today.
const t = (...pairs) => pairs.map(([item, weight]) => ({ item, weight }));

export default {
  brook_lane: {
    spring: t(['dandelion', 5], ['violet', 4], ['wild_leek', 4], ['fiddlehead', 2], [null, 4]),
    summer: t(['mint', 5], ['chamomile', 4], ['wild_strawberry', 4], ['sunflower', 1], [null, 4]),
    autumn: t(['blackberry', 5], ['maple_leaf', 4], ['acorn', 4], ['wild_apple', 2], [null, 4]),
    winter: t(['holly_sprig', 4], ['snowdrop', 3], ['pinecone', 3], [null, 6]),
  },
  riverside_park: {
    spring: t(['violet', 4], ['dandelion', 5], ['fiddlehead', 3], ['wild_leek', 2], [null, 4]),
    summer: t(['mint', 4], ['chamomile', 5], ['blueberry', 3], ['sunflower', 2], [null, 4]),
    autumn: t(['wild_apple', 4], ['maple_leaf', 5], ['chestnut', 4], ['blackberry', 2], [null, 3]),
    winter: t(['winterberry', 4], ['snowdrop', 3], ['holly_sprig', 3], ['pinecone', 2], [null, 6]),
  },
  harbor: {
    spring: t(['seashell', 6], ['seaweed', 5], ['driftwood', 3], ['sea_glass', 1], [null, 3]),
    summer: t(['seashell', 5], ['starfish', 3], ['conch_shell', 3], ['sea_lavender', 4], ['sea_glass', 2], [null, 3]),
    autumn: t(['seaweed', 5], ['driftwood', 4], ['seashell', 4], ['sea_glass', 2], ['pearl', 1], [null, 3]),
    winter: t(['driftwood', 5], ['seaweed', 4], ['conch_shell', 2], ['sea_glass', 2], [null, 5]),
  },
  whispering_woods: {
    spring: t(['morel', 3], ['bluebell', 5], ['fiddlehead', 4], ['wild_leek', 4], ['wild_honey', 1], ['forest_moss', 3], [null, 3]),
    summer: t(['blueberry', 5], ['wild_strawberry', 4], ['mint', 3], ['wild_honey', 2], ['forest_moss', 3], [null, 3]),
    autumn: t(['chanterelle', 4], ['chestnut', 5], ['acorn', 4], ['blackberry', 4], ['wild_honey', 2], ['pinecone', 3], [null, 3]),
    winter: t(['frost_mushroom', 3], ['winterberry', 4], ['holly_sprig', 4], ['pinecone', 4], ['wild_honey', 1], [null, 5]),
  },
  starview_hill: {
    spring: t(['hill_thyme', 5], ['violet', 3], ['dandelion', 3], ['moonpetal', 1], [null, 4]),
    summer: t(['hill_thyme', 4], ['chamomile', 3], ['wild_strawberry', 3], ['moonpetal', 2], [null, 4]),
    autumn: t(['hill_thyme', 4], ['wild_apple', 3], ['maple_leaf', 3], ['moonpetal', 2], ['chestnut', 2], [null, 4]),
    winter: t(['snowdrop', 4], ['hill_thyme', 2], ['moonpetal', 2], ['holly_sprig', 3], [null, 6]),
  },
};
