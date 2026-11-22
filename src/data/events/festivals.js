// Festival events. Each runs on its festival day inside the festival's area/time window.
const say = (npc, text, expr = 'neutral') => ({ say: npc, text, expr });
const ROMANCE = ['mira', 'willa', 'juno', 'rhea', 'celeste'];

const blossom = {
  id: 'festival_blossom', kind: 'festival', when: [{ festival: 'blossom' }, { area: 'riverside_park' }, { time: { from: '11:00', to: '17:00' } }], priority: 70, once: true, music: 'festival',
  script: [
    { setFlag: 'seen_festival_blossom' }, { decor: 'spring_picnic' },
    { narrate: 'Blossom petals drift over Riverside Park. Blankets, baskets and laughter cover every patch of grass.' },
    say('odell', 'Welcome to the Blossom Picnic, {player}! Everyone brings a basket and shares it with someone. That is the rule!', 'happy'),
    say('mira', 'I brought too much! Again! Please help me eat it. Who would you like to share with?', 'laugh'),
    { ask: [
      { text: 'Share with Mira.', then: [say('mira', 'Yay! Here, try the honey roll. Do not tell Mum I used extra honey.', 'happy'), { affection: 'mira', amount: 30 }] },
      { text: 'Share with Theo.', then: [say('theo', 'A picnic with the best friend in town! I brought sandwiches! Mostly crumbs now!', 'laugh'), { affection: 'theo', amount: 30 }] },
      { text: 'Share with Nana Fen.', then: [say('nana_fen', 'Come here, dear. Sit. Tell me what the town thinks of you, since nobody tells me anything.', 'smug'), { affection: 'nana_fen', amount: 30 }] },
    ] },
    { effect: 'sparkle' },
    { narrate: 'The afternoon drifts by in petals and crumbs. It is a very good picnic.' },
  ],
};

const midsummer = {
  id: 'festival_midsummer', kind: 'festival', when: [{ festival: 'midsummer' }, { area: 'harbor' }, { time: { from: '19:00', to: '23:00' } }], priority: 70, once: true, music: 'festival',
  script: [
    { setFlag: 'seen_festival_midsummer' }, { decor: 'midsummer' },
    { narrate: 'Lanterns hang over the pier and the waves glitter. The whole town sits on the sand, waiting for the sky to light up.' },
    say('gus', 'Ha! In my day, we had fireworks twice this size! Well. Half this size. But with more shouting!', 'laugh'),
    say('juno', 'Hey, {player}! Pull up some sand. The first one is always my favourite.', 'happy'),
    { sfx: 'firework_launch' }, { wait: 800 }, { sfx: 'firework_boom' }, { effect: 'firework' },
    say('juno', 'Whoa. That was a good one. Okay, I am a little bit speechless.', 'surprised'),
    { sfx: 'firework_launch' }, { wait: 600 }, { sfx: 'firework_boom' }, { effect: 'firework' },
    { affection: 'juno', amount: 20 },
    { narrate: 'Red, gold and blue light spills across the harbor. For one moment, nobody says anything at all.' },
  ],
};

const harvest = {
  id: 'festival_harvest', kind: 'festival', when: [{ festival: 'harvest' }, { area: 'town_square' }, { time: { from: '11:00', to: '20:00' } }], priority: 70, once: true, music: 'festival',
  script: [
    { setFlag: 'seen_festival_harvest' }, { decor: 'harvest_fair' },
    { narrate: 'Stalls ring the square, heaped with apples, pumpkins and pies. A gold moon hangs over the clock tower.' },
    say('odell', 'The Autumn Moon Fair! Fishing contest at the pier, bake-off at the bakery steps and a reading at the stage!', 'happy'),
    say('juno', 'Fishing contest, you say? I have won three years running. You may enter. You will lose.', 'smug'),
    say('rosalind', 'The bake-off. Mira, hold the tray steady. No, steadier. {player}, hold your breath for her.', 'neutral'),
    { ask: [
      { text: 'Watch the bake-off.', then: [say('mira', 'It did not collapse! It did not collapse! Mum, it did not collapse!', 'happy'), { affection: 'mira', amount: 20 }, { affection: 'rosalind', amount: 20 }] },
      { text: 'Enter the fishing contest.', then: [say('juno', 'You are on! Loser buys cider.', 'smug'), { affection: 'juno', amount: 20 }] },
      { text: 'Listen to the reading.', then: [say('willa', '…and so the lantern keeper looked up, and the stars looked back. That is all I have. Thank you.', 'shy'), { affection: 'willa', amount: 20 }] },
    ] },
    { narrate: 'The moon climbs, the cider flows and the square stays warm until late.' },
  ],
};

const hearthlight = {
  id: 'festival_hearthlight', kind: 'festival', when: [{ festival: 'hearthlight' }, { area: 'inn' }, { time: { from: '17:30', to: '22:00' } }], priority: 70, once: true, music: 'festival_winter',
  script: [
    { setFlag: 'seen_festival_hearthlight' }, { decor: 'hearthlight' },
    { narrate: 'The Heron Inn glows. Stockings hang by the hearth, and there is a small, wrapped gift for everyone.' },
    say('nana_fen', 'Hearthlight Evening! Everyone draws a name from the hat and gives a gift. No peeking, Theo!', 'smug'),
    say('theo', 'I did not peek! I looked at it for a long time, that is all!', 'laugh'),
    say('nana_fen', 'Here, {player}. This one has your name on it. I knitted it. Do not unwrap it until you are home.', 'happy'),
    { giveItem: 'knitting_wool' }, { giveItem: 'hot_cocoa', qty: 2 },
    { affection: 'nana_fen', amount: 30 },
    say('odell', 'A toast! To the cottage, the town and the lantern we have not lit yet!', 'happy'),
    { narrate: 'You sit by the fire with your friends. The snow outside is soft, and so is everything else.' },
  ],
};

const lantern = {
  id: 'festival_lantern', kind: 'festival', when: [{ festival: 'lantern' }, { area: 'town_square' }, { time: { from: '17:00', to: '21:30' } }], priority: 95, once: true, music: 'festival_winter',
  script: [
    { setFlag: 'seen_festival_lantern' }, { decor: 'lantern_festival' },
    { letterbox: true },
    { place: 'player', at: 'plaza_center', facing: 'n' }, { place: 'odell', at: 'stage', facing: 's' },
    { narrate: 'Dusk settles over Lanternbrook. The whole town stands in the square, holding paper lanterns and breath.' },
    say('odell', 'Friends, for three winters this night has been dark. Tonight, thanks to {player}, it will not be.', 'happy'),
    { if: { lanterns: { gte: 6 } }, then: [
      say('odell', 'Six lanterns rekindled. Six small promises kept. Tobias, I hope you can see this.', 'sad'),
      { lamps: 'all_lit' },
    ], else: [
      say('odell', 'Not every lamp is mended, but the Great Lantern is not about perfect. It is about trying. Light it, my boy.', 'happy'),
      { lamps: 'restore' },
    ] },
    { camera: { focus: 'stage', ms: 1200 } },
    { sfx: 'lamp_light' }, { effect: 'sparkle' },
    { narrate: 'You lift the Great Lantern and it blooms with warm gold light. The square gasps, then cheers.' },
    { setFlag: 'festival_lit' }, { completeQuest: 'm9_festival' },
    say('nana_fen', 'Ah, there it is. He always said it would come back. Silly old man. Silly, wonderful old man.', 'happy'),
    { camera: 'reset' },
    ...ROMANCE.map((id) => ({ if: { flag: `${id}_dating` }, then: [{ call: `ending_together_${id}` }, { end: true }] })),
    { call: 'ending_friends' },
    { letterbox: false },
  ],
};

export default { festival_blossom: blossom, festival_midsummer: midsummer, festival_harvest: harvest, festival_hearthlight: hearthlight, festival_lantern: lantern };
