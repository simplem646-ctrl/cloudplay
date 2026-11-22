import { heartEvent as H, events } from './_heart.js';

const CLEAR = { not: { weather: ['rain', 'storm', 'snow'] } };

export default events([
  H('celeste', 2, {
    area: 'starview_hill', at: 'telescope_spot', npcAt: 'summit', when: [{ night: true }, CLEAR],
    steps: [
      ['celeste', 'Oh. You came. The sky is awake tonight. Come, look through here. Gently, it is shy.', 'happy'],
      { anim: 'player', name: 'stargaze', wait: true },
      ['player', 'It is... enormous. And so close.'],
      ['celeste', 'That is a constellation I named myself. The Lamplighter. Seven stars, a little crooked.', 'thinking'],
      ['celeste', 'Nobody else has seen it with me. It is nicer with someone. Thank you.', 'shy'],
      ['player', 'Why the Lamplighter?'],
      ['celeste', 'The seventh star is dim and flickers, like a lamp that thinks nobody is looking. I wanted it to know somebody was.', 'thinking'],
    ],
  }),
  H('celeste', 4, {
    area: 'starview_hill', at: 'view_bench_spot', npcAt: 'summit', when: [{ night: true }, CLEAR, { season: ['summer', 'autumn'] }],
    steps: [
      ['celeste', 'Tonight is the night. The meteors come. Lie back, {player}. Do not blink. Or do, I will tell you what you miss.', 'happy'],
      { effect: 'sparkle' },
      ['celeste', 'There! Did you see? A little silver line, gone as soon as it came.', 'surprised'],
      ['player', 'I saw it. Make a wish.'],
      ['celeste', 'I wished... something I will not say, because then it would not happen. But it was about tomorrow, and you.', 'shy'],
      ['celeste', 'Oh dear. I said too much. The stars will not tell, I promise.', 'shy'],
      ['player', 'I will not tell either.'],
      ['celeste', 'Another one! Look, there... no. That was a moth. A very ambitious moth.', 'laugh'],
      ['celeste', 'My mentor said meteors are the sky tidying up. I like that. Even the sky needs a sweep now and then.', 'thinking'],
    ],
  }),
  H('celeste', 6, {
    area: 'observatory', at: 'telescope_big_spot', npcAt: 'star_map_spot', when: [{ time: { from: '16:00', to: '26:00' } }],
    steps: [
      ['celeste', 'This is my mentor\'s desk. Professor Aldous Vane. He left one night to chase a comet and never came back.', 'sad'],
      ['celeste', 'He wrote that the lamps of Lanternbrook were laid out like the stars. That someone had done it on purpose.', 'thinking'],
      ['celeste', 'I think it was Tobias. I think they were friends. I never got to ask either of them.', 'sad'],
      ['player', 'Maybe the answer is in the lamps themselves.'],
      ['celeste', 'Yes. Perhaps the lamps are the letter, and we are only now learning to read it.', 'happy'],
      { narrate: 'Dust drifts through a bar of lamplight. The star map crinkles gently, as if it were listening.' },
      ['celeste', 'His chair still faces the window. I never moved it. I thought he might want to sit down again.', 'sad'],
      ['player', 'Maybe we write back.'],
      ['celeste', 'To a lamp? To a professor? To the sky? ...Oh. Oh, yes. I have a hundred drafts. They all start "Dear Aldous".', 'surprised'],
      ['celeste', 'I named the Lamplighter before I knew it was true. I think some things are true first and found later.', 'thinking'],
      ['celeste', 'Thank you for believing me. Most people say I am only dreaming.', 'shy'],
    ],
  }),
  H('celeste', 8, {
    area: 'starview_hill', at: 'summit', npcAt: 'telescope_spot', when: [{ season: 'winter' }, { flag: 'lantern_5' }, { night: true }, CLEAR],
    prompt: 'The stars are bright. Celeste turns to you, her breath a small cloud.',
    yes: 'Oh. The lamps below, the stars above, and you. Yes. It all fits. It always was a constellation.',
    no: 'Of course. The stars are patient, and so am I. I will keep the telescope pointed at tomorrow.',
    steps: [
      ['celeste', 'Look down, {player}. The lamps. And look up. They are the same shape, exactly.', 'happy'],
      { lamps: 'all_lit' }, { effect: 'sparkle' },
      ['celeste', 'My mentor was right. Tobias was right. And you finished the sentence they started.', 'shy'],
      ['celeste', 'I used to look at the sky and wait for someone to come back. Now I look at it and think of someone who stayed.', 'shy'],
      ['celeste', 'It is a poor poem. I will do better. But the feeling is quite good.', 'happy'],
      { narrate: 'Frost glitters on the brass of the telescope. Their breath rises together, and a little of it stays.' },
      ['player', 'It is a good poem.'],
      ['celeste', 'Truly? I have been drafting a better one since autumn. Line one is "Dear lamp". Line two is still a blank.', 'thinking'],
      ['celeste', 'I used to count stars to feel less alone. Tonight I counted lamps, and lost my place when you arrived.', 'shy'],
      ['celeste', 'There is the Lamplighter, in the town. Seven lamps, a little crooked. You lit the last of them.', 'happy'],
      ['celeste', 'I do not want to wish on a star tonight. I would rather ask you directly.', 'shy'],
    ],
  }),
]);
