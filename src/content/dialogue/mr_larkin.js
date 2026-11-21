// Mr. Larkin: owner of Larkin Books, Elise's great-uncle. Hushed, gentle, recommends the exact book you needed.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['mr_larkin', '>=', lo] });

export default {
  npc: 'mr_larkin',
  talk: [
    t(20, { time: ['08:00', '14:00'] }, ['neutral', `Good morning, Theo. Take your time. The books don't mind. Neither do I.`]),
    t(20, { time: ['14:00', '20:00'] }, ['neutral', `Afternoon light on the spines is the best light. You'll see.`]),
    t(21, { weather: 'rain' }, ['happy', `Rain. A good day for a book. A very good day. I've put the kettle on, if you'd like to stay.`]),
    t(21, { weather: 'snow' }, ['happy', `Snow. The shop is quiet and warm. I'd call it ideal. I'd also call it a cat bed, if I had a cat.`]),
    t(22, { season: 'spring' }, ['neutral', `Spring. New poetry on the front shelf. The old poems are on the back. They do not mind being in the back.`]),
    t(22, { season: 'summer' }, ['neutral', `Summer. Light reading. Though I suspect you'd like something with weight. Try the third shelf.`]),
    t(22, { season: 'autumn' }, ['happy', `Autumn. Mysteries fly out of here. I keep a copy of the best one behind the counter, for the right person.`]),
    t(22, { season: 'winter' }, ['neutral', `Winter. Long novels for long nights. I'd recommend one, but you'd know which.`]),
    t(24, { map: 'school_library' }, ['neutral', `The school library? I've donated a few. Quietly. The librarian knows.`]),
    t(25, H(4), ['happy', `You've a reader's patience, Theo. A rare thing. I'll set something aside for you.`]),
    t(1, null, ['neutral', `Looking for something? Or for nothing in particular? Both are good ways to begin.`]),
    t(1, null, ['happy', `A book finds its reader the way water finds a stream. Slowly, and then all at once.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Take your time. I'll be here. Or nearby.`]),
    t(1, null, ['happy', `Another visit. Lovely. The shelves approve.`]),
    t(1, null, ['neutral', `Shh. The books are listening. Not really. But it's nice to pretend.`]),
    t(5, H(6), ['shy', `Elise speaks well of you. Not often. But with a very particular smile.`]),
  ],
  gift: {
    loves: ['novel_mystery', 'tea_leaves', 'postcard_set', 'coffee_beans'],
    likes: ['novel_romance', 'tea', 'notebook', 'cookie_box', 'textbook_literature', 'daisy_white'],
    dislikes: ['soda', 'energy_drink', 'whoopee_cushion'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['surprised', `For me? Oh. That is a lovely gesture. I'll treasure it. Quietly.`], ['happy', `You know me better than most. Thank you, Theo.`]],
      likes: [['happy', `How thoughtful. I'll enjoy it with a cup of tea.`], ['neutral', `Thank you. A fine choice.`]],
      neutral: [['neutral', `Thank you, Theo. I'll find it a home among the shelves.`], ['happy', `Kind of you. I'll keep it close.`]],
      dislikes: [['neutral', `Hm. Not quite my sort of thing. But thank you, truly.`], ['sad', `I'll tuck it away. Gently.`]],
      hates: [['neutral', `Oh dear. I'm afraid I can't. Please take it. Gently.`], ['sad', `I'm sorry. It's not for the shop. Or me.`]],
      birthday: [['surprised', `You remembered. How kind. I'm a quiet man. A quiet gift suits me.`], ['happy', `Thank you, Theo. A gift on my birthday is a book I did not know I wanted.`]],
    },
  },
};
