export default {
  npc: 'willa',
  intro: [
    { meet: 'willa' },
    { say: 'willa', text: "Oh… hello. Welcome to the library. I'm… Willa. Please, um, keep your voice down.", expr: 'shy' },
    { say: 'willa', text: 'You must be the new tenant at Tobias\' cottage. I… knew him. A little. He borrowed books.', expr: 'neutral' },
    { say: 'willa', text: "Not that he returned them on time. Or at all. But he'd always say sorry in rhyme…", expr: 'thinking' },
    { ask: [
      { text: 'What do you recommend?', then: [{ say: 'willa', text: 'For you? Something with… a good ending. I think. Ask me again when I know you better.', expr: 'shy' }] },
      { text: "I'll be quiet, I promise.", then: [{ say: 'willa', text: "That's… the nicest thing anyone has said to me today.", expr: 'happy' }] },
    ] },
    { say: 'willa', text: 'The library is open ten to six, except on Tuesdays. Books need rest too.', expr: 'neutral' },
  ],
  talk: [
    { id: 'willa_default_1', weight: 1, lines: [
      ['Hello, {player}… I was just… finishing a chapter. Not mine. Someone else\'s.', 'shy'],
      ['It is so quiet today… which is how I like it. Mostly.', 'neutral'],
    ] },
    { id: 'willa_default_2', weight: 1, lines: [
      ['If you ever need a book, I know where everything is… even the ones that are lost.', 'thinking'],
      ['Some books smell like old rain. Others like cinnamon. I… keep a list.', 'shy'],
    ] },
    { id: 'willa_spring', weight: 2, when: { season: 'spring' }, lines: [
      ['The window is open… and the pages keep turning on their own. I think the spring wants to read too.', 'happy'],
    ] },
    { id: 'willa_summer', weight: 2, when: { season: 'summer' }, lines: [
      ['It is too warm to read… so I read anyway. In the shade. Slowly.', 'shy'],
      ['Summer stories are full of boats and sunburns… I never get sunburns. I stay inside.', 'thinking'],
    ] },
    { id: 'willa_autumn', weight: 2, when: { season: 'autumn' }, lines: [
      ['Autumn is the best reading weather… rain, tea and a good, long book.', 'happy'],
      ['I\'m supposed to read something at the fair… I\'d rather hide behind the bookshelves.', 'worried'],
    ] },
    { id: 'willa_winter', weight: 2, when: { season: 'winter' }, lines: [
      ['The radiator makes a noise like a sigh… I think it likes my stories.', 'shy'],
      ['Winter evenings… a blanket, a candle and a book. What more could anyone want?', 'happy'],
    ] },
    { id: 'willa_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: [
      ['The rain on the window… it sounds like someone typing very softly.', 'happy'],
      ["Rainy days bring more readers. Well… two. But two is more than one.", 'shy'],
    ] },
    { id: 'willa_tuesday', weight: 3, when: { weekday: 'tue' }, lines: [
      ["It's Tuesday… the library is closed. I'm… taking the air. Reading, but outdoors. Daring, isn't it?", 'shy'],
    ] },
    { id: 'willa_evening', weight: 2, when: { time: { from: '17:00', to: '24:00' } }, lines: [
      ['The sky is turning purple… I wonder what story it\'s trying to tell.', 'thinking'],
    ] },
    { id: 'willa_friend', weight: 3, when: { hearts: { npc: 'willa', gte: 3 } }, lines: [
      ["I saved a book for you… It's about a baker. I thought of… you. And bread. Mostly bread.", 'shy'],
      ['You\'re easy to talk to, {player}… that\'s rare. I\'d like to keep it that way.', 'happy'],
    ] },
    { id: 'willa_close', weight: 3, when: { hearts: { npc: 'willa', gte: 6 } }, lines: [
      ["There's a story I've been writing… I might let you read it. Someday. Not today. Maybe.", 'shy'],
      ['Sometimes I think the right word is hiding. When you\'re near, it usually shows up.', 'happy'],
    ] },
  ],
  gifts: {
    love: [
      ['Oh… oh! This is… perfect. How did you know?', 'shy'],
      ["I… I don't know what to say. Thank you. It's the nicest thing in the whole library.", 'happy'],
    ],
    like: [
      ['That\'s… very thoughtful. Thank you. I\'ll treasure it.', 'happy'],
      ['Oh, how lovely… I\'ll keep it by my desk, next to the lamp.', 'shy'],
    ],
    neutral: [
      ['Thank you… I\'m not sure what to say. It\'s… nice.', 'shy'],
      ['Oh. A gift. For me. Thank you, {player}.', 'neutral'],
    ],
    dislike: [
      ['Um… thank you? I\'ll… put it somewhere. Quietly.', 'worried'],
      ["It's… an interesting choice. I'm sure it's lovely to someone.", 'worried'],
    ],
    hate: [
      ['Oh… that is… oh dear. I\'m sorry, I can\'t pretend.', 'sad'],
      ['Please… take it away. The books are very sensitive.', 'sad'],
    ],
    birthday: [
      ["You remembered my birthday… I thought nobody would. I'm… very happy.", 'happy'],
      ["That's the best present I've ever had. I… might cry. Quietly. In the stacks.", 'shy'],
    ],
    again: [
      ['You\'re too kind… but I really can\'t accept anything more today.', 'shy'],
      ["That's enough for today… Come and sit with me instead, if you like.", 'happy'],
    ],
  },
};
