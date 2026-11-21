export default {
  npc: 'nana_fen',
  intro: [
    { meet: 'nana_fen' },
    { say: 'nana_fen', text: "Well, well, look at you. The new boy in Tobias' cottage. Come in, come in, you look half-starved.", expr: 'happy' },
    { say: 'nana_fen', text: "I'm Fennimore Brightwater, but nobody has called me that for forty years. It's Nana Fen to you.", expr: 'smug' },
    { say: 'nana_fen', text: "I knew Tobias better than anyone, dear. Sit down for tea sometime, and I'll tell you what I know.", expr: 'thinking' },
    { ask: [
      { text: 'I would like that very much.', then: [{ say: 'nana_fen', text: "Good boy. You've got manners. That's a rare thing.", expr: 'happy' }] },
      { text: 'What kind of tea?', then: [{ say: 'nana_fen', text: "The kind that fixes things. Don't worry, I'll know which.", expr: 'smug' }] },
    ] },
    { say: 'nana_fen', text: 'The Heron Inn is open from ten to ten. The stew is always hot, and so is the gossip.', expr: 'laugh' },
  ],
  talk: [
    { id: 'nana_default_1', weight: 1, lines: [
      ['Ah, {player}. Knit one, purl one, and listen to an old woman ramble. You are most welcome.', 'happy'],
      ['I am making a scarf. It is not for anyone. Yet. It will find its owner, as scarves do.', 'smug'],
    ] },
    { id: 'nana_default_2', weight: 1, lines: [
      ['Sit down, dear. You are standing like a coat-stand. Relax those shoulders.', 'smug'],
      ['Do you know, I have lived here for seventy years and never once seen the fountain dry?', 'thinking'],
    ] },
    { id: 'nana_spring', weight: 2, when: { season: 'spring' }, lines: [
      ['Spring blossoms and spring colds. Wrap up, dear, and drink your tea.', 'smug'],
    ] },
    { id: 'nana_summer', weight: 2, when: { season: 'summer' }, lines: [
      ['Too hot for knitting, but I knit anyway. Stubbornness keeps an old woman young.', 'laugh'],
    ] },
    { id: 'nana_autumn', weight: 2, when: { season: 'autumn' }, lines: [
      ['Harvest time. I put an extra apple in every pie. Nobody has noticed. Everybody has.', 'laugh'],
    ] },
    { id: 'nana_winter', weight: 2, when: { season: 'winter' }, lines: [
      ['Hearthlight Evening is my favourite. Everyone sits close, and nobody pretends not to be fond of each other.', 'happy'],
    ] },
    { id: 'nana_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: [
      ['Rain makes the whole inn smell like wet wool and soup. Heaven.', 'happy'],
      ['Sit by the fire, dear. Dry off. I will bring you something hot.', 'smug'],
    ] },
    { id: 'nana_afternoon', weight: 2, when: { time: { from: '14:00', to: '16:00' } }, lines: [
      ['I take my afternoon bench on Market Street. A woman my age needs the sun, and the news.', 'happy'],
    ] },
    { id: 'nana_tobias', weight: 3, when: { flag: 'journal_found' }, lines: [
      ['You found his journal, did you? Good. He wrote everything down. Except where he left his spectacles.', 'laugh'],
      ['He always said the lamps were a way of saying "I see you". I think that is lovely.', 'sad'],
    ] },
    { id: 'nana_friend', weight: 3, when: { hearts: { npc: 'nana_fen', gte: 3 } }, lines: [
      ["You're a good sort, {player}. I'd knit you a scarf, if you weren't already wearing an orange one.", 'smug'],
    ] },
  ],
  gifts: {
    love: [
      ['Oh, my dear boy. What a treasure! I could hug you. Come here!', 'happy'],
      ["You've warmed an old woman's heart. Thank you, {player}.", 'happy'],
    ],
    like: [
      ['How kind, dear. That will do very nicely.', 'happy'],
      ["Ah, lovely! I shall put the kettle on. Don't you dare leave yet.", 'smug'],
    ],
    neutral: [
      ["Thank you, dear. It's the thought that counts.", 'happy'],
      ["Well, now. That's thoughtful of you. I'll find a use for it.", 'smug'],
    ],
    dislike: [
      ["Hm. Not for me, dear, but thank you for thinking of me.", 'neutral'],
      ["I'll... put that in the back. Where it can reflect on its choices.", 'smug'],
    ],
    hate: [
      ['Take that away, dear, before the cat sees it.', 'angry'],
      ["Oh no, no. Not in my inn. Not on my carpet.", 'angry'],
    ],
    birthday: [
      ['A birthday gift! At my age, every one is a miracle. Thank you, {player}.', 'happy'],
      ["You remembered! Come here and have tea. And cake. I'm too old to count the candles.", 'laugh'],
    ],
    again: [
      ["That's plenty for one day, dear. Save something for tomorrow.", 'smug'],
      ["You'll spoil an old woman. Go on with you!", 'laugh'],
    ],
  },
  shop: { greet: ['Sit, dear. What will you have?', 'Stew is hot. Tea is hotter.', 'You look hungry. Do not argue.'] },
};
