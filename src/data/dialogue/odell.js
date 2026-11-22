export default {
  npc: 'odell',
  intro: [
    { meet: 'odell' },
    { say: 'odell', text: "Ah, {player}! There you are. Settling in? I'm sure the cottage is quite a handful.", expr: 'happy' },
    { say: 'odell', text: "Now, if you need anything, I'm at Town Hall nine to four. Or at the fountain, thinking.", expr: 'neutral' },
    { say: 'odell', text: 'I do my best thinking at the fountain. It is a well-spring of ideas. Ha!', expr: 'laugh' },
  ],
  talk: [
    { id: 'odell_default_1', weight: 1, lines: [
      ['Hello, my boy! Did I tell you about the time the clock tower struck thirteen? No? Good.', 'laugh'],
      ['Settling in? Good, good. The cottage creaks, but it has a good heart.', 'happy'],
    ] },
    { id: 'odell_default_2', weight: 1, lines: [
      ['Why did the baker go to the lighthouse? To get a little more dough! Hm? No? Hm.', 'laugh'],
      ['I had a thought earlier. It was a good one. It seems to have left.', 'thinking'],
    ] },
    { id: 'odell_spring', weight: 2, when: { season: 'spring' }, lines: [
      ['Spring in Lanternbrook! The blossoms, the birds... and the paperwork. Mostly the paperwork.', 'laugh'],
    ] },
    { id: 'odell_summer', weight: 2, when: { season: 'summer' }, lines: [
      ['Hot, isn\'t it? I wear a waistcoat in every season. It is a matter of principle. And pockets.', 'happy'],
    ] },
    { id: 'odell_autumn', weight: 2, when: { season: 'autumn' }, lines: [
      ['The Autumn Moon Fair! My favourite. I eat nine pies and tell everyone it was research.', 'laugh'],
    ] },
    { id: 'odell_winter', weight: 2, when: { season: 'winter' }, lines: [
      ['Winter again. It does get chilly. And dark. The lanterns, they would have helped.', 'sad'],
    ] },
    { id: 'odell_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: [
      ["Rain on the roof, tea in the cup. What could be better? Besides, perhaps, a roof that doesn't leak.", 'laugh'],
    ] },
    { id: 'odell_dusk', weight: 3, when: { time: { from: '17:30', to: '21:00' } }, lines: [
      ['I come out at dusk to watch the lamps. Habit, you see. Tobias used to light them. I sit here and miss him.', 'sad'],
      ['Every night I wait for the lamps to glow, and every night they do not. Today might be different. Might.', 'thinking'],
    ] },
    { id: 'odell_lanterns', weight: 4, when: { lanterns: { gte: 1 } }, lines: [
      ['Did you see? The lamps are glowing again! I nearly wept into my moustache. Do not tell anyone.', 'happy'],
    ] },
    { id: 'odell_friend', weight: 3, when: { hearts: { npc: 'odell', gte: 4 } }, lines: [
      ["You remind me of Tobias a little, {player}. Not the beard. The hands. He always helped with his hands.", 'happy'],
    ] },
    { id: 'odell_pun_1', weight: 2, when: { time: { from: '09:00', to: '16:00' } }, lines: [
      ['I tried to write a letter about the lamp budget. It was a very long story. Lamp-ly written, you might say.', 'laugh'],
      ['Ahem. I will see myself out of my own office.', 'happy'],
    ] },
    { id: 'odell_tobias_2', weight: 3, when: { lanterns: { gte: 2 } }, lines: [
      ['Tobias used to leave a lamp-key on my desk every winter. Never a note. Just the key, and a smile in the dust.', 'sad'],
      ['I am glad it is in good hands again.', 'happy'],
    ] },
    { id: 'odell_fest_3', weight: 3, when: { lanterns: { gte: 5 } }, lines: [
      ['The festival is close. I have practised my speech in the bath. The bath was very moved.', 'laugh'],
      ['Do not tell the town I wept at the rehearsal. It was a pun. The pun was beautiful.', 'happy'],
    ] },
  ],
  gifts: {
    love: [
      ["Well, bless my moustache! {player}, this is wonderful! I'm overwhelmed.", 'happy'],
      ["For me? I haven't felt this spry since the clock struck thirteen! Thank you!", 'laugh'],
    ],
    like: [
      ["Ah, how kind! You've made an old mayor very happy.", 'happy'],
      ['Splendid! I shall have this with tea and a pun.', 'laugh'],
    ],
    neutral: [
      ['Oh, thank you, my boy! Much appreciated.', 'happy'],
      ["A gift! You shouldn't have. But I'm glad you did.", 'happy'],
    ],
    dislike: [
      ["Ahem. Thank you. It's... interesting. Very interesting.", 'worried'],
      ["Er, how... thoughtful. I'll find a spot for it. Somewhere. Far.", 'worried'],
    ],
    hate: [
      ['Good heavens! What is that?! Is it alive?', 'surprised'],
      ["I'm sorry, my boy, but I simply cannot keep that.", 'sad'],
    ],
    birthday: [
      ['You remembered my birthday! Bless you, {player}. I feel ten years younger. Nine, at least.', 'happy'],
      ["The best gift I've had in years. Do come to cake, won't you?", 'laugh'],
    ],
    again: [
      ["No more, no more! You've spoiled me already, my boy!", 'laugh'],
      ["I've had my fill today. But come again tomorrow!", 'happy'],
    ],
  },
};
