export default {
  npc: 'ferris',
  intro: [
    { meet: 'ferris' },
    { say: 'ferris', text: '"A stranger comes, and the ducks look up." Good day, young man. Ferris Quill, retired teacher.', expr: 'happy' },
    { say: 'ferris', text: "I feed the ducks at the pond every morning. They're my best students. They never talk back.", expr: 'laugh' },
    { say: 'ferris', text: 'You are the new lamplighter, I believe? Tobias used to quote Wordsworth to the lamp-posts. Dreadful accent.', expr: 'thinking' },
  ],
  talk: [
    { id: 'fer_default_1', weight: 1, lines: ['"The day is long and the river slow." I wrote that this morning. Do you like it?'] },
    { id: 'fer_default_2', weight: 1, lines: ["Ah, {player}. Would you care to hear a poem? No? Never mind. I have forty in my pocket.", 'The ducks are in a mood today. Perhaps they have read my reviews.'] },
    { id: 'fer_spring', weight: 2, when: { season: 'spring' }, lines: ['"Spring has come, a green surprise." A poor rhyme, but a rich season.'] },
    { id: 'fer_summer', weight: 2, when: { season: 'summer' }, lines: ['Summer afternoons are best spent under a willow with a book and a very large hat.'] },
    { id: 'fer_autumn', weight: 2, when: { season: 'autumn' }, lines: ['"The leaves let go, and so must we." A touch grim. I shall revise it.'] },
    { id: 'fer_winter', weight: 2, when: { season: 'winter' }, lines: ['The ducks are fluffed up like pillows. Winter is when poets feel honest.'] },
    { id: 'fer_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: ['Rain is the sky reading aloud. Rather tiresome, but with moments of beauty.'] },
    { id: 'fer_duck', weight: 2, when: { time: { from: '10:00', to: '12:00' } }, lines: ['The ducks expect me at ten. Punctual birds. I wish my students had been so reliable.'] },
    { id: 'fer_friend', weight: 3, when: { hearts: { npc: 'ferris', gte: 3 } }, lines: ["You're a good listener, {player}. Few young people are. Take this verse with my compliments."] },
  ],
  gifts: {
    love: ['Splendid! You are a young man of exquisite taste. I shall write a poem about this.', 'Oh, my dear fellow! I am overcome. A moment, I must compose myself.'],
    like: ['How very kind. I shall treasure it.', 'A fine gift. Thank you.'],
    neutral: ['Thank you, my dear fellow. Most kind.', 'A gift! How unexpected. Thank you.'],
    dislike: ['Ah. How... modern. Thank you, I suppose.', 'I shall find a place for it. Possibly a drawer.'],
    hate: ['Good heavens! Take it away! It offends the verses!', 'I must decline. Firmly, and with a lot of poetry.'],
    birthday: ['My birthday! And you remembered! "A year folded gently into a day." Thank you.', 'A birthday gift! I shall compose an ode to you. A short one. Eight stanzas.'],
    again: ['No more, dear fellow. I am already well provided for.', 'You are too generous. A teacher must not be spoiled.'],
  },
};
