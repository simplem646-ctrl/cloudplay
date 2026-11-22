export default {
  npc: 'juno',
  intro: [
    { meet: 'juno' },
    { say: 'juno', text: "Hey! You're the new guy. Kai? {player}? Whatever. I'm Juno. I catch more fish than anyone.", expr: 'smug' },
    { say: 'juno', text: "That's not bragging. It's a record. Ask Gramps. He keeps count. Badly.", expr: 'laugh' },
    { ask: [
      { text: 'I bet I could beat you.', then: [{ say: 'juno', text: "Ha! Bold. I like bold. Come back when you've got a rod and I'll take your lunch money.", expr: 'smug' }] },
      { text: 'Impressive. Any tips?', then: [{ say: 'juno', text: 'Patience. And lots of bait. And never, ever look at the water. It knows.', expr: 'laugh' }] },
    ] },
    { say: 'juno', text: 'Fish bite early. Come down to the pier at seven. If you can keep up.', expr: 'happy' },
  ],
  talk: [
    { id: 'juno_default_1', weight: 1, lines: [
      ["Oh, it's you. Caught anything yet? No? Figures.", 'smug'],
      ["The pier is mine until noon. After that, you can share. Maybe.", 'neutral'],
    ] },
    { id: 'juno_default_2', weight: 1, lines: [
      ['Gramps says I fish like I argue. Fast, loud and without a plan. He is mostly right.', 'laugh'],
      ["Don't touch the red bucket. It's got a crab in it. He is called Gerald.", 'neutral'],
    ] },
    { id: 'juno_spring', weight: 2, when: { season: 'spring' }, lines: [
      ['Spring fish are lazy. So are spring people. Not me, though!', 'happy'],
    ] },
    { id: 'juno_summer', weight: 2, when: { season: 'summer' }, lines: [
      ["Summer! The water's warm and the fish are fat. It's the best time of year.", 'happy'],
      ["Midsummer's coming. I'm going to see who can last longest at the end of the pier. Me. It'll be me.", 'smug'],
    ] },
    { id: 'juno_autumn', weight: 2, when: { season: 'autumn' }, lines: [
      ["The fishing contest's coming up. I've won it three years running. Don't make it four. I mean, do. Make it four.", 'smug'],
    ] },
    { id: 'juno_winter', weight: 2, when: { season: 'winter' }, lines: [
      ['Cold hands, cold fish, cold coffee. I wouldn\'t trade it. Well, maybe for hot coffee.', 'laugh'],
    ] },
    { id: 'juno_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: [
      ["Rain's great for fishing. Not so great for fishermen. I'm drenched. I love it!", 'laugh'],
      ["I'm fixing nets in the hut. If you want to help, grab a needle. If you don't, grab a towel.", 'neutral'],
    ] },
    { id: 'juno_morning', weight: 2, when: { time: { from: '05:00', to: '09:00' } }, lines: [
      ['Early bird! Or early fish? Both are great.', 'happy'],
    ] },
    { id: 'juno_thursday', weight: 2, when: { weekday: 'thu' }, lines: [
      ["Thursday's my run day. The hut is shut, so I run. Past the shops, past the inn, past everybody. Feels great.", 'happy'],
    ] },
    { id: 'juno_friend', weight: 3, when: { hearts: { npc: 'juno', gte: 3 } }, lines: [
      ["You're not bad, {player}. For a landlubber. Don't let it go to your head.", 'smug'],
      ['My parents are overseas. I get a postcard every month. I keep every one. Don\'t tell anyone.', 'sad'],
    ] },
    { id: 'juno_close', weight: 3, when: { hearts: { npc: 'juno', gte: 6 } }, lines: [
      ["I'm... glad you came by today. I don't say that. So say thanks and let's go fish.", 'shy'],
    ] },
    { id: 'juno_new_1', weight: 2, when: { hearts: { npc: 'juno', gte: 0, lte: 1 } }, lines: [
      ['You look lost. Rule one of the harbor: walk like you know where you are going. Rule two: you are lost.', 'smug'],
    ] },
    { id: 'juno_new_2', weight: 2, when: { hearts: { npc: 'juno', gte: 0, lte: 2 } }, lines: [
      ['I caught a boot last week. A boot! Gramps says it is a lucky boot. It is a very smelly lucky boot.', 'laugh'],
    ] },
    { id: 'juno_knots_3', weight: 2, when: { hearts: { npc: 'juno', gte: 2, lte: 5 } }, lines: [
      ['Want to learn a bowline? It is the knot that does not let go. I am very good at it. Very.', 'smug'],
      ['I tied my own shoes with it once. Took twenty minutes to get out.', 'laugh'],
    ] },
    { id: 'juno_gramps_4', weight: 2, when: { hearts: { npc: 'juno', gte: 4, lte: 7 } }, lines: [
      ['Gramps told the whale story three times this week. Every time the whale gets bigger. Soon it will be the harbor.', 'laugh'],
      ['I love it. Do not tell him I said that. He will make it a leviathan.', 'shy'],
    ] },
    { id: 'juno_night_5', weight: 2, when: { night: true }, lines: [
      ['Lighthouse is humming tonight. You can hear it from the pier if you stand still. I stood still. For almost a minute!', 'happy'],
    ] },
    { id: 'juno_storm_6', weight: 3, when: { weather: 'storm' }, lines: [
      ['Storm night. Everything is tied twice. That is the rule since you showed me how to listen.', 'smug'],
      ['I hate how right you were about the knot. I hate it a lot. Come inside, I will make tea.', 'shy'],
    ] },
    { id: 'juno_dating_7', weight: 3, when: { flag: 'juno_dating' }, lines: [
      ['You beat me to the pier this morning. I will let that count as a love language.', 'smug'],
      ['Tomorrow I win. Tomorrow I always win. That is the other love language.', 'laugh'],
    ] },
  ],
  gifts: {
    love: [
      ['Whoa! Where did you get this? You are the best!', 'happy'],
      ["That's perfect! I'm keeping it. You can't have it back. No take-backs!", 'laugh'],
    ],
    like: [
      ['Not bad! I can use that.', 'happy'],
      ["Hey, thanks! That's actually pretty good.", 'smug'],
    ],
    neutral: [
      ['Huh. Okay. Thanks, I guess.', 'neutral'],
      ["It's... nice. I'll put it somewhere. Probably the hut.", 'neutral'],
    ],
    dislike: [
      ["Ugh. Flowers? I'm a fisher, not a garden gnome.", 'worried'],
      ['Um. No offence. But no.', 'neutral'],
    ],
    hate: [
      ['Are you kidding me? That is rubbish. Literally.', 'angry'],
      ['Get that away from me before I throw it in the sea!', 'angry'],
    ],
    birthday: [
      ["You remembered! Don't make a fuss. Okay, a small fuss. Thanks, {player}.", 'happy'],
      ['Best birthday present ever. Don\'t tell Gramps I said that. He\'ll want credit.', 'laugh'],
    ],
    again: [
      ["Enough already! You're spoiling me. And I hate being spoiled. A bit.", 'shy'],
      ["No more! I'll owe you at this rate. And I hate owing.", 'neutral'],
    ],
  },
};
