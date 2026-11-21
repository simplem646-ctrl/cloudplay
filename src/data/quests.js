// Quests: tutorial, main story, side quests. Errand templates live in errands.js.
const say = (npc, text, expr = 'neutral') => ({ say: npc, text, expr });
const talk = (id, text, npc, extra = {}) => ({ id, text, goal: { type: 'talk', npc }, ...extra });
const lanternStep = (n) => ({ call: `lantern_restored_${n}` });

const MAIN = [
  {
    id: 't_meet_town', kind: 'tutorial', title: 'Say Hello to Lanternbrook', giver: 'odell',
    desc: 'The Mayor suggests you introduce yourself around town. Six friendly hellos should do it.',
    stages: [
      talk('hattie', 'Say hello to Hattie at the flower stall in the town square.', 'hattie'),
      talk('theo', 'Find Theo, the postman. He lives above the general store.', 'theo'),
      talk('mira', 'Meet Mira at Rye & Rose Bakery.', 'mira'),
      talk('barnaby', 'Say hello to Barnaby at Pennywhistle Provisions.', 'barnaby'),
      talk('nana', 'Visit Nana Fen at the Heron Inn.', 'nana_fen'),
      talk('willa', 'Last stop: meet Willa at Thornfield Library.', 'willa'),
    ],
    reward: { money: 100, items: [{ id: 'bread', qty: 2 }], flags: ['met_town'] },
  },
  {
    id: 't_first_shift', kind: 'tutorial', title: 'A First Day at Work', giver: 'rosalind', unlock: { flag: 'prologue_done' },
    desc: 'Coins do not grow on trees. Work a shift at the bakery, from 07:00 to 11:00, Monday to Saturday.',
    stages: [{ id: 'shift', text: 'Work one shift at Rye & Rose Bakery (07:00 to 11:00, not on Sundays).', goal: { type: 'job', job: 'bakery_shift', times: 1 } }],
    reward: { money: 50, aff: { mira: 20, rosalind: 10 } },
  },
  {
    id: 't_first_catch', kind: 'tutorial', title: 'Something Fishy', giver: 'gus', unlock: { flag: 'prologue_done' },
    desc: 'Every seaside town needs a fisher. Captain Gus will lend you a rod.',
    stages: [
      {
        id: 'hut', text: "Visit Pelham's Fishing Hut on the harbor and ask Captain Gus about fishing.", goal: { type: 'visit', area: 'fishing_hut' },
        onDone: [
          say('gus', 'A new face! Fishing, is it? Here, take my spare rod and some bait. Do not lose it.', 'happy'),
          say('gus', 'Stand at a fishing spot, wait for the bite, then time your reel. It is easier than it sounds.', 'neutral'),
          { giveItem: 'fishing_rod' }, { giveItem: 'bait', qty: 5 },
        ],
      },
      { id: 'catch', text: 'Catch your first fish at any fishing spot.', goal: { type: 'catch', fish: 'any', qty: 1 } },
    ],
    reward: { money: 40, items: [{ id: 'bait', qty: 5 }], aff: { gus: 15 } },
  },
  {
    id: 't_forage', kind: 'tutorial', title: 'Pick of the Day', giver: 'bramwell', unlock: { flag: 'prologue_done' },
    desc: 'Wild flowers, berries and shells wait to be found. Look for sparkling spots on the ground.',
    stages: [{ id: 'pick', text: 'Forage 3 items from sparkling spots around town.', goal: { type: 'forage', qty: 3 } }],
    reward: { money: 50 },
  },

  {
    id: 'm1_arrival', kind: 'main', title: 'A New Chapter', giver: 'odell', unlock: { flag: 'prologue_done' },
    desc: 'You have a cottage, a key and a whole town to meet. Settle in, then sleep on it.',
    stages: [
      { id: 'cottage', text: 'Step inside your new home, the Old Lamplighter\'s Cottage.', goal: { type: 'visit', area: 'cottage' } },
      { id: 'square', text: 'Walk to the town square and see the noticeboard.', goal: { type: 'visit', area: 'town_square', anchor: 'noticeboard_spot', radius: 4 } },
      { id: 'sleep', text: 'Get a good night\'s sleep in your own bed. Tomorrow is a new day.', goal: { type: 'date', season: 'spring', day: 3 } },
    ],
    reward: { money: 50, flags: ['m1_done'] },
  },
  {
    id: 'm2_journal', kind: 'main', title: "Tobias' Journal", giver: 'odell', unlock: { flag: 'journal_found' },
    desc: 'You found an old journal in the attic. It lists six people who loved the old lamplighter.',
    stages: [
      {
        id: 'show', text: 'Show the journal to Mayor Odell at Town Hall (or around town).', goal: { type: 'talk', npc: 'odell' },
        onDone: [
          say('odell', 'That is Tobias\' handwriting. I would know it anywhere.', 'sad'),
          say('odell', 'Six people, six lanterns. He kept so many small promises. Here, take the workshop key.', 'happy'),
          { giveItem: 'workshop_key' }, { setFlag: 'workshop_unlocked' },
        ],
      },
      { id: 'workshop', text: "Look inside Tobias' workshop on Brook Lane.", goal: { type: 'visit', area: 'workshop' } },
    ],
    reward: { money: 100, script: [{ startQuest: 'm3_baker' }] },
  },
  {
    id: 'm3_baker', kind: 'main', title: "The Baker's Lantern", giver: 'rosalind', unlock: [{ quest: { id: 'm2_journal', state: 'done' } }, { dateFrom: { season: 'spring', day: 3 } }],
    desc: 'Tobias bought the first loaf every dawn. Rosalind needs help with an old recipe.',
    stages: [
      talk('story', 'Ask Rosalind about Tobias and her bakery step.', 'rosalind', { onDone: [
        say('rosalind', 'Every dawn, the first loaf was his. He left a lantern on my step as thanks.', 'sad'),
        say('rosalind', 'Help me at the oven twice and I will tell you the rest. And bring wild honey from the woods.', 'neutral'),
      ] }),
      { id: 'shifts', text: 'Work 2 shifts at the bakery.', goal: { type: 'job', job: 'bakery_shift', times: 2 } },
      { id: 'honey', text: 'Bring Rosalind some wild honey from Whispering Woods.', goal: { type: 'give', npc: 'rosalind', item: 'wild_honey', qty: 1 } },
    ],
    reward: { money: 150, items: [{ id: 'ember_glass', qty: 1 }], aff: { rosalind: 40, mira: 20 }, script: [lanternStep(1)] },
  },
  {
    id: 'm4_reader', kind: 'main', title: "The Reader's Lantern", giver: 'willa', unlock: [{ quest: { id: 'm2_journal', state: 'done' } }, { dateFrom: { season: 'spring', day: 15 } }],
    desc: 'Tobias hid his lantern blueprint inside a library book. Willa has a riddle for you.',
    stages: [
      talk('riddle', 'Talk to Willa about the hidden blueprint.', 'willa', { onDone: [
        say('willa', 'Tobias hid his blueprint in a book. He left me a riddle… I never solved it.', 'shy'),
        say('willa', '"Where the lamplighter reads, look for the lamp." Try the shelves, {player}.', 'thinking'),
        { giveItem: 'library_riddle' },
      ] }),
      { id: 'search', text: 'Search the library shelves for the book Tobias hid.', goal: { type: 'flag', flag: 'found_blueprint_book' } },
      talk('return', 'Bring the blueprint to Willa.', 'willa', { onDone: [
        say('willa', 'It was in the almanac all along… Oh, {player}. This is so like him.', 'happy'),
      ] }),
    ],
    reward: { money: 150, items: [{ id: 'brass_blueprint', qty: 1 }], aff: { willa: 40 }, script: [lanternStep(2)] },
  },
  {
    id: 'm5_sailor', kind: 'main', title: "The Sailor's Lantern", giver: 'gus', unlock: [{ quest: { id: 'm2_journal', state: 'done' } }, { dateFrom: { season: 'summer', day: 1 } }],
    desc: 'The lighthouse lens cracked in a storm and the pieces are lost at sea.',
    stages: [
      talk('story', 'Talk to Captain Gus at the harbor about his lighthouse.', 'gus', { onDone: [
        say('gus', 'The lens cracked in the great storm. Sea-glass shards, the sea gave back some of them.', 'sad'),
        say('gus', 'Look along the beach. And keep your line wet. Tobias made me that promise once.', 'neutral'),
      ] }),
      { id: 'shards', text: 'Find 3 pieces of sea glass on the harbor beach.', goal: { type: 'have', item: 'sea_glass', qty: 3 } },
      { id: 'return', text: 'Give the sea glass to Captain Gus.', goal: { type: 'give', npc: 'gus', item: 'sea_glass', qty: 3 } },
    ],
    reward: { money: 150, items: [{ id: 'sea_lens', qty: 1 }], aff: { gus: 40, juno: 20 }, script: [lanternStep(3)] },
  },
  {
    id: 'm6_cafe', kind: 'main', title: "The Café Lantern", giver: 'rhea', unlock: [{ quest: { id: 'm2_journal', state: 'done' } }, { dateFrom: { season: 'summer', day: 15 } }],
    desc: 'Tobias scented his lamp oil with spiced cocoa. Rhea has his recipe and will not share it.',
    stages: [
      talk('story', 'Ask Rhea about Tobias and his spiced cocoa.', 'rhea', { onDone: [
        say('rhea', 'He came every dusk for one cup. I wrote his recipe down and never served it again.', 'sad'),
        say('rhea', 'I am not ready to share it. Bring me cocoa beans and show me you are serious.', 'smug'),
      ] }),
      { id: 'beans', text: 'Bring 2 cocoa beans for Rhea (from the café or the peddler).', goal: { type: 'have', item: 'cocoa_beans', qty: 2 } },
      { id: 'trust', text: 'Earn Rhea\'s trust. Reach 3 hearts with her.', goal: { type: 'hearts', npc: 'rhea', hearts: 3 }, onDone: [
        say('rhea', 'Fine. You win. Sit down. This is how he took it, and how the lamp oil is made.', 'happy'),
        { giveItem: 'rhea_recipe_card' },
      ] },
    ],
    reward: { money: 150, items: [{ id: 'spiced_lamp_oil', qty: 1 }], aff: { rhea: 40 }, script: [lanternStep(4)] },
  },
  {
    id: 'm7_stargazer', kind: 'main', title: "The Stargazer's Lantern", giver: 'celeste', unlock: [{ quest: { id: 'm2_journal', state: 'done' } }, { dateFrom: { season: 'autumn', day: 1 } }],
    desc: 'Celeste noticed the town lamps are laid out like a constellation. Tobias set them that way.',
    stages: [
      talk('story', 'Talk to Celeste at the observatory about the lamp-constellation.', 'celeste', { onDone: [
        say('celeste', 'The lamps make a shape in the sky. He drew it, I think. My mentor knew.', 'thinking'),
        say('celeste', 'Her notes are in the observatory, somewhere under the star map…', 'sad'),
      ] }),
      { id: 'notes', text: "Find Celeste's mentor's notes near the star map in the observatory.", goal: { type: 'have', item: 'mentor_notes', qty: 1 } },
      { id: 'petal', text: 'Find a moonpetal on Starview Hill for the wick.', goal: { type: 'have', item: 'moonpetal', qty: 1 }, onDone: [
        say('celeste', 'Moonpetal fibre. It will hold the starlight. Hold still, I will weave it.', 'happy'),
        { takeItem: 'moonpetal' },
      ] },
    ],
    reward: { money: 150, items: [{ id: 'starlight_wick', qty: 1 }], aff: { celeste: 40 }, script: [lanternStep(5)] },
  },
  {
    id: 'm8_greatlantern', kind: 'main', title: 'The Great Lantern', giver: 'odell', unlock: [{ flag: 'workshop_unlocked' }, { lanterns: { gte: 5 } }],
    desc: 'All five Lantern Pieces are in your hands. Build Tobias\' Great Lantern in his workshop.',
    stages: [
      {
        id: 'assemble', text: "Bring the five Lantern Pieces to Tobias' workbench.", goal: { type: 'visit', area: 'workshop', anchor: 'bench_spot', radius: 3 },
        onDone: [
          { narrate: 'You lay out Ember Glass, the Blueprint, Sea Lens, Spiced Oil and the Starlight Wick. They begin to glow.' },
          { takeItem: 'ember_glass' }, { takeItem: 'brass_blueprint' }, { takeItem: 'sea_lens' }, { takeItem: 'spiced_lamp_oil' }, { takeItem: 'starlight_wick' },
          { giveItem: 'great_lantern' }, { sfx: 'item_get_rare' },
        ],
      },
      talk('henrik', 'Ask Henrik to help hang the Great Lantern frame.', 'henrik', { onDone: [
        say('henrik', 'That is fine work. I will build the post. Tobias taught me to hold a hammer, you know.', 'neutral'),
      ] }),
      talk('odell', 'Show the Great Lantern to Mayor Odell.', 'odell', { onDone: [
        say('odell', 'Oh my. It looks just as I remember. You will light it at the festival, {player}.', 'happy'),
      ] }),
    ],
    reward: { money: 200, script: [lanternStep(6), { startQuest: 'm9_festival' }] },
  },
  {
    id: 'm9_festival', kind: 'main', title: 'The Lantern Festival', giver: 'odell', unlock: { quest: { id: 'm8_greatlantern', state: 'done' } },
    desc: 'On Winter 24 the whole town gathers to light the Great Lantern.',
    stages: [
      { id: 'date', text: 'Be at the town square on Winter 24 at dusk.', goal: { type: 'date', season: 'winter', day: 24 } },
      { id: 'light', text: 'Light the Great Lantern.', goal: { type: 'flag', flag: 'festival_lit' } },
    ],
    reward: { money: 500, flags: ['year1_complete'] },
  },
];

// ---- side quests ---------------------------------------------------------------------------------
const side = (id, giver, title, desc, ask, stages, reward, unlock) => ({
  id, kind: 'side', title, giver, desc, unlock: unlock || { met: giver }, repeat: false,
  stages: stages.map((st, i) => (i === 0 ? { ...st, onEnter: ask } : st)), reward,
});

const SIDE = [
  side('s_mira_berries', 'mira', 'Berries for a Tart', 'Mira wants to try a berry tart recipe, but she has no berries.',
    [say('mira', 'Oh, {player}! If you find wild strawberries I could bake a tart! Four should do!', 'happy')],
    [{ id: 'berries', text: 'Bring 4 wild strawberries to Mira.', goal: { type: 'give', npc: 'mira', item: 'wild_strawberry', qty: 4 } }],
    { money: 80, items: [{ id: 'berry_tart', qty: 1 }], aff: { mira: 30 } }),
  side('s_willa_ink', 'willa', 'Out of Ink', 'The library ink has run dry and Willa has a story to finish.',
    [say('willa', 'My ink is gone… and a good line only comes once. Could you find a bottle? Barnaby sells it…', 'worried')],
    [{ id: 'ink', text: 'Bring an ink bottle to Willa.', goal: { type: 'give', npc: 'willa', item: 'ink_bottle', qty: 1 } }],
    { money: 100, aff: { willa: 30 }, items: [{ id: 'book_moon_garden', qty: 1 }] }),
  side('s_juno_duel', 'juno', 'Beat the Captain\'s Granddaughter', 'Juno challenges you to a fishing race. First to catch three fish wins.',
    [say('juno', 'Race you! Three fish, any fish. Loser buys lunch. I do not lose, so start saving.', 'smug')],
    [{ id: 'catch3', text: 'Catch 3 fish before Juno does.', goal: { type: 'catch', fish: 'any', qty: 3 } },
      { id: 'report', text: 'Tell Juno how it went.', goal: { type: 'talk', npc: 'juno' } }],
    { money: 120, aff: { juno: 30 } }),
  side('s_rhea_beans', 'rhea', 'The Wrong Beans', 'Rhea\'s coffee delivery arrived with the wrong beans.',
    [say('rhea', 'The supplier sent tea leaves instead of coffee beans. Bring me coffee beans. Do not say anything about my face.', 'angry')],
    [{ id: 'beans', text: 'Bring 2 coffee beans to Rhea.', goal: { type: 'give', npc: 'rhea', item: 'coffee_beans', qty: 2 } }],
    { money: 100, aff: { rhea: 30 }, items: [{ id: 'coffee', qty: 2 }] }),
  side('s_celeste_lunch', 'celeste', 'A Meal for the Stargazer', 'Celeste has forgotten to eat again.',
    [say('celeste', 'Is it afternoon? I think I last ate… under a different moon. Do you have something to eat?', 'thinking')],
    [{ id: 'lunch', text: 'Give Celeste a cheese sandwich.', goal: { type: 'give', npc: 'celeste', item: 'cheese_sandwich', qty: 1 } }],
    { money: 90, aff: { celeste: 30 }, items: [{ id: 'star_charm', qty: 1 }] }),
  side('s_odell_flyers', 'odell', 'Flyers for the Fair', 'The Mayor wants to remind the town about its festivals.',
    [say('odell', 'I wrote flyers about the festivals. Hattie has the pins, ha! Take them there, would you?', 'happy')],
    [talk('hattie', 'Take the flyers to Hattie at the flower stall.', 'hattie'), talk('odell', 'Report back to the Mayor.', 'odell')],
    { money: 90, aff: { odell: 25, hattie: 10 } }),
  side('s_theo_parcel', 'theo', 'The Missing Parcel', 'One of Theo\'s parcels has gone missing near the harbor.',
    [say('theo', 'I dropped a parcel somewhere on my harbor loop! Could you look around the crates? Please? I am so late.', 'worried')],
    [{ id: 'look', text: 'Search near the crates at the harbor.', goal: { type: 'visit', area: 'harbor', anchor: 'crates', radius: 3 } },
      { id: 'report', text: 'Tell Theo you found it.', goal: { type: 'talk', npc: 'theo' } }],
    { money: 80, aff: { theo: 30 } }),
  side('s_nana_wool', 'nana_fen', 'Wool for the Winter', 'Nana Fen is knitting scarves for the whole town.',
    [say('nana_fen', 'I am nearly out of lavender wool. Two skeins from Barnaby, dear, and I will knit you something warm.', 'happy')],
    [{ id: 'wool', text: 'Bring 2 knitting wool to Nana Fen.', goal: { type: 'give', npc: 'nana_fen', item: 'knitting_wool', qty: 2 } }],
    { money: 90, aff: { nana_fen: 30 }, items: [{ id: 'herbal_tea', qty: 2 }] }),
  side('s_gus_tale', 'gus', 'A Fish Bigger Than My Tale', 'Gus wants to taste a good sea bass again.',
    [say('gus', 'There was a sea bass, big as a rowing boat! Well, big as a dog. Catch me one and I will cook it.', 'laugh')],
    [{ id: 'bass', text: 'Catch a sea bass at the harbor.', goal: { type: 'catch', fish: 'sea_bass', qty: 1 } },
      { id: 'give', text: 'Give the sea bass to Gus.', goal: { type: 'give', npc: 'gus', item: 'sea_bass', qty: 1 } }],
    { money: 130, aff: { gus: 30 } }),
  side('s_rosalind_flour', 'rosalind', 'A Short Delivery', 'The flour delivery was short. Rosalind needs a quick favour.',
    [say('rosalind', 'The mill sent half the flour. Buy five bags at Barnaby\'s, would you? I will pay you back and then some.', 'angry')],
    [{ id: 'flour', text: 'Bring 5 rye flour to Rosalind.', goal: { type: 'give', npc: 'rosalind', item: 'flour', qty: 5 } }],
    { money: 120, aff: { rosalind: 30 } }),
  side('s_barnaby_help', 'barnaby', 'Special Delivery', 'Barnaby needs a hand with the post.',
    [say('barnaby', 'Business is booming and my nephew is slow as molasses! Run one parcel round for me? It is a good deal, honest!', 'happy')],
    [{ id: 'run', text: 'Complete one parcel run for Theo.', goal: { type: 'job', job: 'parcel_run', times: 1 } }],
    { money: 100, aff: { barnaby: 25, theo: 10 } }),
  side('s_elias_herbs', 'elias', 'Herbs for the Clinic', 'The clinic tea shelf is almost empty.',
    [say('elias', 'My herbal tea shelf is bare. Hill thyme grows wild on Starview Hill, if you know where to look.', 'worried')],
    [{ id: 'mint', text: 'Bring 3 hill thyme from Starview Hill to Dr. Whitlock.', goal: { type: 'give', npc: 'elias', item: 'hill_thyme', qty: 3 } }],
    { money: 100, aff: { elias: 30 }, items: [{ id: 'herbal_tea', qty: 2 }] }),
  side('s_pip_beetle', 'pip', 'The Great Beetle Hunt', 'Pip says he saw the biggest beetle ever in the woods.',
    [say('pip', 'I SAW A BEETLE AS BIG AS MY HAND! In the woods! By the mushrooms! Can you look? Please please please!', 'happy')],
    [{ id: 'woods', text: 'Look for the beetle near the mushroom grove in the woods.', goal: { type: 'visit', area: 'whispering_woods', anchor: 'mushroom_grove', radius: 3 } },
      { id: 'tell', text: 'Tell Pip what you found.', goal: { type: 'talk', npc: 'pip' } }],
    { money: 60, aff: { pip: 30 }, items: [{ id: 'glass_marble', qty: 1 }] }),
  side('s_lottie_tea', 'lottie', 'Tea Party at Four', 'Lottie is hosting a very important tea party.',
    [say('lottie', 'I am having a TEA PARTY. You are invited, but you have to bring two cookies. Those are the rules.', 'happy')],
    [{ id: 'cookies', text: 'Bring 2 butter cookies to Lottie.', goal: { type: 'give', npc: 'lottie', item: 'cookie', qty: 2 } }],
    { money: 60, aff: { lottie: 30 }, items: [{ id: 'daisy_bundle', qty: 1 }] }),
  side('s_ferris_tea', 'ferris', 'A Cup of Poetry', 'Mr. Quill needs a quiet cup of tea to finish a poem.',
    [say('ferris', 'I cannot rhyme "orange" and I cannot rhyme without tea. Bring me a cup, my dear fellow.', 'thinking')],
    [{ id: 'tea', text: 'Bring a cup of tea to Mr. Quill.', goal: { type: 'give', npc: 'ferris', item: 'tea', qty: 1 } }],
    { money: 70, aff: { ferris: 30 }, items: [{ id: 'book_poems_ferris', qty: 1 }] }),
  side('s_bramwell_forage', 'bramwell', 'Eyes Open', 'Bramwell wants you to learn the woods by touch and smell.',
    [say('bramwell', 'You walk like a town fellow. Forage six things. Slowly. Then I will talk to you properly.', 'neutral')],
    [{ id: 'forage', text: 'Forage 6 items around town and the woods.', goal: { type: 'forage', qty: 6 } }],
    { money: 100, aff: { bramwell: 35 }, items: [{ id: 'chestnut', qty: 2 }] }),
  side('s_sable_shells', 'sable', "A Peddler's Collection", 'Sable collects pretty shells from every town she visits.',
    [say('sable', 'I collect something from every town. Here it is shells. Three seashells and I will make it worth your while.', 'happy')],
    [{ id: 'shells', text: 'Give 3 seashells to Sable.', goal: { type: 'give', npc: 'sable', item: 'seashell', qty: 3 } }],
    { money: 110, aff: { sable: 30 }, items: [{ id: 'lucky_coin', qty: 1 }] }),
  side('s_hattie_gossip', 'hattie', 'The Latest News', 'Hattie wants to know who is seeing whom. Carefully, please.',
    [say('hattie', 'Do not tell anyone I asked, but find out what Willa and Juno are up to! I am only curious, dear!', 'smug')],
    [talk('willa', 'Chat with Willa.', 'willa'), talk('juno', 'Chat with Juno.', 'juno'), talk('hattie', 'Tell Hattie what you learned (very little).', 'hattie')],
    { money: 80, aff: { hattie: 30 }, items: [{ id: 'wildflower_bouquet', qty: 1 }] }),
  side('s_henrik_swing', 'henrik', 'A Swing for the Park', 'Henrik promised the kids a new swing seat.',
    [say('henrik', 'I promised a new swing seat. Four planks from Barnaby would do. I am short on sleep and wood.', 'neutral')],
    [{ id: 'planks', text: 'Bring 4 wooden planks to Henrik.', goal: { type: 'give', npc: 'henrik', item: 'plank', qty: 4 } }],
    { money: 120, aff: { henrik: 30, pip: 10 } }),
];

export const QUEST_LIST = [...MAIN, ...SIDE];
export default Object.fromEntries(QUEST_LIST.map((q) => [q.id, q]));
