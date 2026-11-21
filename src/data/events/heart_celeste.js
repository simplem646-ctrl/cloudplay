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
      ['celeste', 'Thank you for believing me. Most people say I am only dreaming.', 'shy'],
    ],
  }),
  H('celeste', 8, {
    area: 'starview_hill', at: 'summit', npcAt: 'telescope_spot', when: [{ season: 'winter' }, { flag: 'lantern_5' }, { night: true }, CLEAR],
    prompt: 'The stars are bright. Celeste turns to you, her breath a small cloud.',
    yes: 'Oh. The lamps below, the stars above, and you. Yes. It all fits. It always was a constellation.',
    steps: [
      ['celeste', 'Look down, {player}. The lamps. And look up. They are the same shape, exactly.', 'happy'],
      { lamps: 'all_lit' }, { effect: 'sparkle' },
      ['celeste', 'My mentor was right. Tobias was right. And you finished the sentence they started.', 'shy'],
      ['celeste', 'I used to look at the sky and wait for someone to come back. Now I look at it and think of someone who stayed.', 'shy'],
      ['celeste', 'It is a poor poem. I will do better. But the feeling is quite good.', 'happy'],
    ],
  }),
]);
