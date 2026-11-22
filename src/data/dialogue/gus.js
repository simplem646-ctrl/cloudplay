export default {
  npc: 'gus',
  intro: [
    { meet: 'gus' },
    { say: 'gus', text: "Hrmph. So you're the new lad. Captain Gus Pelham, retired. I once sailed past a whale as big as this island.", expr: 'smug' },
    { say: 'gus', text: "Smaller than that, perhaps. Big as a barn. A medium barn. Fine, a shed. It was a very impressive shed.", expr: 'laugh' },
    { say: 'gus', text: "That's my granddaughter Juno on the pier. She fishes like I did. Loudly.", expr: 'happy' },
    { ask: [
      { text: 'Tell me about the lighthouse.', then: [{ say: 'gus', text: "She's dark now, lad. Lens cracked. A good light, once. I keep the key. I keep hoping.", expr: 'sad' }] },
      { text: 'Any advice for a new fisher?', then: [{ say: 'gus', text: 'Patience. Bait. And lie about the size afterwards. The fish never complain.', expr: 'laugh' }] },
    ] },
    { say: 'gus', text: "The hut's open six to six, except Thursdays. Bait's cheap. Tall tales are free.", expr: 'neutral' },
  ],
  talk: [
    { id: 'gus_default_1', weight: 1, lines: [
      ['Morning, lad. Or afternoon. At my age they all feel the same. Salty.', 'neutral'],
      ['I once caught a fish so big, it caught me back! Nearly pulled me in. Nearly.', 'laugh'],
    ] },
    { id: 'gus_default_2', weight: 1, lines: [
      ['Hm. The wind is changing. I can feel it in my knees. They are always right. Except when they are not.', 'thinking'],
      ["There's nothing better than a good rope and a decent pair of boots. Except tea. And fish. And dry socks.", 'happy'],
    ] },
    { id: 'gus_spring', weight: 2, when: { season: 'spring' }, lines: [
      ['Spring fish are shy. Like a young lad at his first dance. You must be gentle.', 'happy'],
    ] },
    { id: 'gus_summer', weight: 2, when: { season: 'summer' }, lines: [
      ["Hot enough to cook a fish on the pier. Don't try it. I did. Nearly worked.", 'laugh'],
    ] },
    { id: 'gus_autumn', weight: 2, when: { season: 'autumn' }, lines: [
      ['Autumn gales bring in the best catch. And the worst weather. Wear a hat, lad.', 'neutral'],
    ] },
    { id: 'gus_winter', weight: 2, when: { season: 'winter' }, lines: [
      ['Cold enough to freeze the ink in my log. I write in pencil now. Pencil never freezes.', 'neutral'],
    ] },
    { id: 'gus_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: [
      ["Storm's brewing! I smell it. Like old boots and thunder. I'll be by the stove if you need me.", 'neutral'],
      ["Rain's good for mending nets. And for telling tales by the fire. Pull up a stool, lad.", 'happy'],
    ] },
    { id: 'gus_thursday', weight: 2, when: { weekday: 'thu' }, lines: [
      ["Thursday, hut's shut. I sit on the bench and glare at the gulls. They glare back.", 'neutral'],
    ] },
    { id: 'gus_lighthouse', weight: 3, when: { time: { from: '14:00', to: '18:00' } }, lines: [
      ['Come to look at the old girl? She needs a new lens. Tobias said the sea would send one back. I still hope.', 'sad'],
    ] },
    { id: 'gus_friend', weight: 3, when: { hearts: { npc: 'gus', gte: 3 } }, lines: [
      ["You're a good lad, {player}. Almost as good as my granddaughter. Don't tell her.", 'happy'],
    ] },
    { id: 'gus_whale_1', weight: 2, when: { time: { from: '08:00', to: '18:00' } }, lines: [
      ['The whale was the size of a barn. Last week I said a shed. Today I say a cathedral. The truth is a flexible beast.', 'laugh'],
    ] },
    { id: 'gus_juno_2', weight: 3, when: { lanterns: { gte: 3 } }, lines: [
      ['Juno climbed the lighthouse steps today. Two at a time. I did not tell her I counted. Proud as a gull with a chip.', 'happy'],
      ['Do not tell her. She will start taking three at a time. My knees cannot keep up.', 'worried'],
    ] },
    { id: 'gus_fog_3', weight: 2, when: { weather: ['rain', 'storm'] }, lines: [
      ['Rain on a tin roof is the best music the sea ever gave a man. Better than any fiddle. Louder, too.', 'happy'],
    ] },
  ],
  gifts: {
    love: [
      ["By my beard! That's grand, lad! I'll treasure it forever. Or until I lose it.", 'happy'],
      ["Well, bless my barnacles! This is perfect! You've a good eye, {player}.", 'laugh'],
    ],
    like: [
      ["Ha! That'll do nicely, lad. Thank you.", 'happy'],
      ['Good. Useful. I like useful.', 'neutral'],
    ],
    neutral: [
      ["Hm. Thanks, lad. I'll find a spot for it. Somewhere near the boots.", 'neutral'],
      ['Kind of you. Very kind. A bit... soft, but kind.', 'neutral'],
    ],
    dislike: [
      ["Hrmph. Flowers? What do I look like, a garden?", 'worried'],
      ["Er. It's... something. Thank you, I suppose.", 'worried'],
    ],
    hate: [
      ['Get that off my deck! Is that rubbish? It is rubbish!', 'angry'],
      ["Not on my ship! Not in my hut! Out, out, out!", 'angry'],
    ],
    birthday: [
      ["You remembered, lad? Ha! I thought the sea had taken my birthday along with my hair!", 'happy'],
      ['This is the best present since my first compass. Thank you, lad. Truly.', 'sad'],
    ],
    again: [
      ["Enough, lad! You'll sink my boat with kindness!", 'laugh'],
      ["I'm full to the brim. Come back tomorrow, and bring a fish story.", 'happy'],
    ],
  },
  shop: { greet: ['Bait, line or a tall tale?', "Welcome aboard. Mind the boots.", "Anything you need for the water, I've got. Mostly."] },
};
