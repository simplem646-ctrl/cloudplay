export default {
  npc: 'lottie',
  intro: [
    { meet: 'lottie' },
    { say: 'lottie', text: 'Stop! You there! Who are you? I am Lottie. I am in charge.', expr: 'angry' },
    { say: 'lottie', text: 'Pip says I am bossy. I am not bossy. I am the boss. It is different.', expr: 'smug' },
    { say: 'lottie', text: "You may stay. But you must be polite, and you must say 'please', and you must admire my cape.", expr: 'happy' },
  ],
  talk: [
    { id: 'lot_default_1', weight: 1, lines: ["Hello, {player}. You are allowed to talk to me. Today."], },
    { id: 'lot_default_2', weight: 1, lines: ['Do you like my cape? It is red. It is the best colour. The other colours are wrong.', 'I am planning a very important party. Nobody knows. Except me. And you, now.'] },
    { id: 'lot_spring', weight: 2, when: { season: 'spring' }, lines: ['Spring is for picking daisies. I pick them. Pip steps on them. This is why I am angry.'] },
    { id: 'lot_summer', weight: 2, when: { season: 'summer' }, lines: ['It is SO hot. I am wearing my cape anyway. A boss never takes off her cape.'] },
    { id: 'lot_autumn', weight: 2, when: { season: 'autumn' }, lines: ['The leaves are all red! Like my cape! They are copying me. I do not mind. Much.'] },
    { id: 'lot_winter', weight: 2, when: { season: 'winter' }, lines: ['Snow is just clouds that fell down. I told Pip. He said clouds do not fall. They do. I watched.'] },
    { id: 'lot_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: ['My cape has a hood! It is a SUPER cape! Rain cannot get me. Only puddles. And Pip.'] },
    { id: 'lot_evening', weight: 2, when: { time: { from: '17:00', to: '21:00' } }, lines: ['I have to go home. But only because I want to. Not because Dad said. I decided it first.'] },
    { id: 'lot_friend', weight: 3, when: { hearts: { npc: 'lottie', gte: 3 } }, lines: ["You can be my assistant. It is a very important job. You do what I say. Congratulations."] },
  ],
  gifts: {
    love: ['Ooooh! This is perfect! You are now my favourite! Do not tell Pip!', 'I love it! I love it! I LOVE IT!'],
    like: ['Hm. Acceptable! I like it!', 'Oh, nice! You may stay another minute.'],
    neutral: ['Thank you. I will put it with my other things.', 'Hm. I suppose it will do.'],
    dislike: ['Hmph. I do not like it. But I am polite. Thank you.', 'It is a bit... boring. But thank you!'],
    hate: ['EWWW! You are banished! Just for a minute!', 'That is the WORST present! I am telling Dad!'],
    birthday: ['IT IS MY BIRTHDAY! You remembered! You are now invited to everything!', 'The best birthday present ever! I love you, {player}! Not in a weird way!'],
    again: ['Too many presents! My pockets are full!', 'No more today! I must have time to love the first one!'],
  },
};
