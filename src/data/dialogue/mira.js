export default {
  npc: 'mira',
  intro: [
    { meet: 'mira' },
    { say: 'mira', text: 'Oh! Oh, hello! Watch out for the, oh no, the flour. Sorry! Too late.', expr: 'surprised' },
    { say: 'mira', text: "You must be {player}! Mr. Odell told us all about you. I'm Mira. I work here with my mum!", expr: 'happy' },
    { say: 'mira', text: 'The honey rolls are the best thing in town. Not that I made them. Well, I helped!', expr: 'laugh' },
    { ask: [
      { text: 'Nice to meet you, Mira.', then: [{ say: 'mira', text: "Aww, you're so polite! You'll fit right in!", expr: 'happy' }] },
      { text: 'You have flour on your nose.', then: [{ say: 'mira', text: 'Do I? Oh! Is that why everyone smiles at me?', expr: 'shy' }] },
    ] },
    { say: 'mira', text: 'Come back any morning! The bread is hottest at seven.', expr: 'happy' },
  ],
  talk: [
    { id: 'mira_default_1', weight: 1, lines: [
      ['Hi {player}! The oven is behaving today. Mostly. It only smoked a little!', 'happy'],
      ['I can smell the rye from here. Do you smell it? I smell it constantly.', 'laugh'],
    ] },
    { id: 'mira_default_2', weight: 1, lines: [
      ['Do you ever dream about food? I dream about bread. Warm, buttery bread...', 'happy'],
      ["Mum says I talk too fast. I said I don't, and then I said it so fast she gave up!", 'laugh'],
    ] },
    { id: 'mira_spring', weight: 2, when: { season: 'spring' }, lines: [
      ['Spring means strawberry tarts! If I find enough strawberries. And if I remember the sugar.', 'thinking'],
      ["The blossoms are out! I want to make a pink cake. Mum says it's 'too much'. I say, never!", 'happy'],
    ] },
    { id: 'mira_summer', weight: 2, when: { season: 'summer' }, lines: [
      ["It's SO hot by the oven! I think I'm baking too. Don't taste me!", 'laugh'],
      ['Summer picnics are my favourite. I pack everything. Even the wrong things!', 'happy'],
    ] },
    { id: 'mira_autumn', weight: 2, when: { season: 'autumn' }, lines: [
      ['Apples, cinnamon, pumpkin, chestnut... autumn smells like a hug. A hug that is also pie.', 'happy'],
      ["The fair's coming! Mum's entering the bake-off. I'm 'helping'. Meaning I'm carrying things.", 'worried'],
    ] },
    { id: 'mira_winter', weight: 2, when: { season: 'winter' }, lines: [
      ['Brr! Come stand by the oven! The best seat in town is the one nearest to the oven.', 'happy'],
      ["Winter is for gingerbread. And for cocoa. And for eating gingerbread with cocoa. That's the rule.", 'laugh'],
    ] },
    { id: 'mira_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: [
      ["Listen to that rain on the roof! It's like the bakery is humming.", 'happy'],
      ["Rainy days are great for baking. Nobody's in a hurry. Well, except me. I'm always in a hurry.", 'laugh'],
    ] },
    { id: 'mira_snow', weight: 3, when: { weather: 'snow' }, lines: [
      ['Snow! I want to bake a cake that looks like snow. Mum says that is just a white cake.', 'happy'],
    ] },
    { id: 'mira_morning', weight: 2, when: { time: { from: '06:00', to: '09:00' } }, lines: [
      ["Good morning! I've been up since five! I think. I might still be asleep. Pinch me. Gently!", 'laugh'],
    ] },
    { id: 'mira_evening', weight: 2, when: { time: { from: '17:00', to: '21:00' } }, lines: [
      ['The park is pretty at this time of day. Do you ever come here? I do! I always trip over the same stone.', 'shy'],
    ] },
    { id: 'mira_sunday', weight: 2, when: { weekday: 'sun' }, lines: [
      ["It's Sunday! The bakery is closed, so I'm allowed to sleep in. I woke up at six anyway.", 'laugh'],
    ] },
    { id: 'mira_friend', weight: 3, when: { hearts: { npc: 'mira', gte: 3 } }, lines: [
      ["I'm glad you stop by, {player}. Mum says I talk less when you're here. I think she's wrong!", 'happy'],
      ['I told Mum you were really kind. She said, "Hm." That is a very good review from Mum!', 'laugh'],
    ] },
    { id: 'mira_close', weight: 3, when: { hearts: { npc: 'mira', gte: 6 } }, lines: [
      ["I've been thinking about... my own little bakery. Don't laugh. Please don't laugh.", 'shy'],
      ['Sometimes I think it is silly to dream. But when you smile, it feels less silly.', 'shy'],
    ] },
    { id: 'mira_new_1', weight: 2, when: { hearts: { npc: 'mira', gte: 0, lte: 1 } }, lines: [
      ["Oh! You are the one who lives in Tobias' cottage! Do you like cinnamon? Please like cinnamon!", 'happy'],
      ['Sorry, I ask everybody that. It is how I decide who gets the second bun.', 'laugh'],
    ] },
    { id: 'mira_new_2', weight: 2, when: { hearts: { npc: 'mira', gte: 0, lte: 2 } }, lines: [
      ['If I look flustered, it is the oven. If I look flour-y, it is also the oven. It is a very busy oven.', 'laugh'],
    ] },
    { id: 'mira_flour_3', weight: 2, when: { hearts: { npc: 'mira', gte: 2, lte: 5 } }, lines: [
      ['I found flour in my shoe today. My shoe! I was not even baking in it!', 'surprised'],
      ['Mum says it is a sign of dedication. I say it is a sign of a hole in my apron.', 'laugh'],
    ] },
    { id: 'mira_rye_4', weight: 2, when: { hearts: { npc: 'mira', gte: 4, lte: 6 } }, lines: [
      ['Mum let me shape the Saturday rye by myself! It looks like a very round hedgehog. She said it was adequate!', 'happy'],
      ['I am going to frame that word. Do not tell her.', 'shy'],
    ] },
    { id: 'mira_notebook_5', weight: 2, when: { hearts: { npc: 'mira', gte: 4, lte: 7 } }, lines: [
      ["I added a new page to my notebook. It says, 'Window with geraniums.' And, 'Ask {player} about a good bench.'", 'shy'],
    ] },
    { id: 'mira_frost_6', weight: 2, when: { season: 'winter' }, lines: [
      ['Frost on the window, rolls in the oven, a friend in the doorway. This is my favourite kind of Tuesday.', 'happy'],
      ['Even if it is not a Tuesday. It is a Tuesday-feeling!', 'laugh'],
    ] },
    { id: 'mira_dating_7', weight: 3, when: { flag: 'mira_dating' }, lines: [
      ['You came by! I was just thinking about you. Also about yeast. But mostly you.', 'shy'],
      ['Mum has been humming. She says she is not. She is. It is a bit flat.', 'laugh'],
    ] },
    { id: 'mira_dating_8', weight: 3, when: { all: [{ flag: 'mira_dating' }, { time: { from: '17:00', to: '21:00' } }] }, lines: [
      ['Walk with me to the park? I will trip on the same stone and you can catch me. That is the plan.', 'happy'],
    ] },
  ],
  gifts: {
    love: [
      ['For me?! Oh my gosh! {player}, you are the best!', 'happy'],
      ["I love it! I really, really love it! I'm going to cry. Please don't look!", 'shy'],
    ],
    like: [
      ['Oh, thank you! This is lovely!', 'happy'],
      ["That's so kind! I'm going to keep this where I can see it. Or eat it. Depends.", 'laugh'],
    ],
    neutral: [
      ['Oh, thank you, {player}. That is... very nice!', 'happy'],
      ["Aww, you remembered me! I'll find a good use for this!", 'happy'],
    ],
    dislike: [
      ["Um... thank you? I'll put this somewhere. Somewhere far away.", 'worried'],
      ["Oh. Oh dear. Um. It's, er, a gift. That's what counts!", 'worried'],
    ],
    hate: [
      ['Is that... is that a boot? Why is it so damp?!', 'surprised'],
      ["I... I'm sorry, I can't smile at this one. I'll try again tomorrow!", 'sad'],
    ],
    birthday: [
      ["You remembered my birthday?! I'm going to burst into tears, flour and all!", 'happy'],
      ["The best birthday present ever! You're even better than cake. And I love cake!", 'happy'],
    ],
    again: [
      ["You've been so generous already, {player}! I couldn't possibly take another!", 'shy'],
      ['No more gifts today! Save some kindness for tomorrow!', 'laugh'],
    ],
  },
};
