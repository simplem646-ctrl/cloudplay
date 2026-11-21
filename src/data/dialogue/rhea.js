export default {
  npc: 'rhea',
  intro: [
    { meet: 'rhea' },
    { say: 'rhea', text: 'Welcome to the Copper Kettle. Table or counter? Either is fine. Please do not touch the piano.', expr: 'neutral' },
    { say: 'rhea', text: "You are the new tenant. Rhea Montclair. I own this café, and I'm very particular about it.", expr: 'smug' },
    { say: 'rhea', text: 'The coffee is strong, the tea is correct, and the cake is, well, I am working on that.', expr: 'thinking' },
    { ask: [
      { text: 'I will try the coffee.', then: [{ say: 'rhea', text: 'Good. Sit up straight and enjoy it. Do not add sugar until you taste it.', expr: 'smug' }] },
      { text: 'What do you recommend?', then: [{ say: 'rhea', text: 'The cocoa. Nobody expects it from me. That is why it is good.', expr: 'happy' }] },
    ] },
    { say: 'rhea', text: 'The café opens at ten, closed Mondays. Come back when you are hungry. Or lost.', expr: 'neutral' },
  ],
  talk: [
    { id: 'rhea_default_1', weight: 1, lines: [
      ['You again. Good. I was running out of people to disappoint.', 'smug'],
      ['The coffee machine is temperamental today. So am I. Order carefully.', 'neutral'],
    ] },
    { id: 'rhea_default_2', weight: 1, lines: [
      ['A perfect cup takes ninety seconds, not eighty. Not a hundred. Ninety.', 'thinking'],
      ['People think I am cold. I am simply precise. There is a difference. Mostly.', 'smug'],
    ] },
    { id: 'rhea_spring', weight: 2, when: { season: 'spring' }, lines: [
      ['Spring menu. Lighter, brighter and, yes, a little bit pink. Do not comment on the pink.', 'smug'],
    ] },
    { id: 'rhea_summer', weight: 2, when: { season: 'summer' }, lines: [
      ['Iced everything. I never thought I would say that, and I am not happy about it.', 'worried'],
    ] },
    { id: 'rhea_autumn', weight: 2, when: { season: 'autumn' }, lines: [
      ['Pumpkin, cinnamon, clove. It is a cliché, but it is a very good cliché.', 'smug'],
    ] },
    { id: 'rhea_winter', weight: 2, when: { season: 'winter' }, lines: [
      ['Hot cocoa season. The rest of the year, I pretend I do not like it. Winter lets me stop pretending.', 'happy'],
    ] },
    { id: 'rhea_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: [
      ['Rain brings customers and wet umbrellas. I prefer the customers. The umbrellas, less so.', 'neutral'],
      ['This is café weather. Sit. Order something. Do not say "just a water".', 'smug'],
    ] },
    { id: 'rhea_monday', weight: 3, when: { weekday: 'mon' }, lines: [
      ["It's Monday. The café is closed. I'm out. This is a personal day. Do not make it a conversation.", 'neutral'],
    ] },
    { id: 'rhea_evening', weight: 2, when: { time: { from: '19:00', to: '24:00' } }, lines: [
      ['The piano is calling me. Not literally. I hope.', 'thinking'],
    ] },
    { id: 'rhea_friend', weight: 3, when: { hearts: { npc: 'rhea', gte: 3 } }, lines: [
      ["I'll admit it. Your order is the one I look forward to. Do not tell the others.", 'smug'],
      ['You have good manners, {player}. And an annoying habit of asking good questions.', 'shy'],
    ] },
    { id: 'rhea_close', weight: 3, when: { hearts: { npc: 'rhea', gte: 6 } }, lines: [
      ['Some days I wonder if I belong here. Then you walk in, and it feels... settled.', 'shy'],
    ] },
  ],
  gifts: {
    love: [
      ["Oh. This is... exactly right. I don't know what to say. Which is unusual.", 'shy'],
      ['You noticed. Nobody notices. Thank you, {player}.', 'happy'],
    ],
    like: [
      ['Hm. Acceptable. More than acceptable. Thank you.', 'smug'],
      ['That is thoughtful. I will find a place for it.', 'happy'],
    ],
    neutral: [
      ['Thank you. It is... fine. I mean that kindly.', 'neutral'],
      ['A gift. How unexpected. Thank you.', 'neutral'],
    ],
    dislike: [
      ['I appreciate the thought. I do not appreciate the item.', 'neutral'],
      ["It's... not quite right. But thank you for trying.", 'worried'],
    ],
    hate: [
      ['Please remove that. Immediately. From my sight. And my café.', 'angry'],
      ['No. Absolutely not. Not even as a joke.', 'angry'],
    ],
    birthday: [
      ["You remembered. I... I didn't think anyone would. Thank you.", 'shy'],
      ["Fine, I'll say it: this is the nicest birthday I've had in years. Do not repeat that.", 'happy'],
    ],
    again: [
      ["Enough. You're being generous, and I'm unprepared for generosity.", 'shy'],
      ['No more today. Sit. Have a coffee. On the house.', 'smug'],
    ],
  },
  shop: { greet: ['What can I get you? Be decisive.', 'Table or take-away?', 'Coffee, tea or courage?'] },
};
