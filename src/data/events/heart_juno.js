import { heartEvent as H, events } from './_heart.js';

export default events([
  H('juno', 2, {
    area: 'harbor', at: 'pier_start', npcAt: 'pier_end', when: [{ time: { from: '07:00', to: '12:00' } }, { not: { weather: ['rain', 'storm'] } }, { item: { id: 'fishing_rod', gte: 1 } }],
    music: 'harbor',
    steps: [
      ['juno', 'Finally! A rod in your hand! Okay: five minutes, biggest fish wins. Loser carries the bucket.', 'smug'],
      { anim: 'juno', name: 'fish_cast', wait: true },
      ['juno', 'Got one! Look at that! Oh, it is tiny. Still counts!', 'laugh'],
      { anim: 'player', name: 'fish_catch', wait: true },
      ['player', 'Mine is bigger.'],
      ['juno', 'What?! No! Let me see. …Fine. Fine! It is bigger. By a hair. A whisker. Do not get smug.', 'angry'],
      ['juno', 'Okay, you are not bad. Same time tomorrow. I want a rematch.', 'happy'],
    ],
  }),
  H('juno', 4, {
    area: 'harbor', at: 'hut_steps', npcAt: 'boat_dock', when: [{ weather: ['storm', 'rain'] }, { time: { from: '08:00', to: '18:00' } }],
    music: 'harbor',
    steps: [
      ['juno', 'There you are! The wind is rising, boats are loose! Grab the rope, {player}, and pull!', 'worried'],
      { sfx: 'thunder' },
      { anim: 'juno', name: 'carry_walk', wait: true },
      ['juno', 'Hold it steady! More! Almost... got it! Tie it off! Twice!', 'angry'],
      ['player', 'Done! Are you okay?'],
      ['juno', 'Soaked, cold and grinning. That was fun! Honestly, I did not think you would stay.', 'laugh'],
      ['juno', 'Gramps would have said "good lad". He is going to say it, I know. Do not let it go to your head.', 'shy'],
    ],
  }),
  H('juno', 6, {
    area: 'fishing_hut', at: 'counter_front', npcAt: 'stove_fh', when: [{ time: { from: '13:00', to: '20:00' } }],
    steps: [
      ['juno', 'Oh. It is you. I was just looking at Gramps\' old sea chest. It is full of postcards.', 'sad'],
      ['juno', 'From my parents. Every month. Same words: "Wish you were here." Then they go on to the next harbour.', 'sad'],
      ['player', 'That sounds lonely.'],
      ['juno', 'I am not lonely! I have Gramps, and the pier, and fish. I just... sometimes I think everyone leaves eventually.', 'worried'],
      ['player', 'I am staying. For as long as you want me here.'],
      ['juno', '...Don\'t say things like that unless you mean them. Because I will believe you.', 'shy'],
    ],
  }),
  H('juno', 8, {
    area: 'harbor', at: 'lighthouse_base', npcAt: 'sunset_spot', when: [{ flag: 'lantern_3' }, { time: { from: '17:30', to: '20:00' } }],
    music: 'romance', prompt: 'Juno stands beside you, the lighthouse glowing at last.',
    yes: 'Yes. Obviously yes. I would shout it from the top of the lighthouse, but Gramps is listening.',
    steps: [
      ['juno', 'Gramps gave me the key. He says it is time. I do not want to do it alone.', 'shy'],
      { sfx: 'door_open' },
      ['juno', 'Up we go. Ninety-one steps. I counted them as a kid. Do not make me count them again.', 'laugh'],
      { sfx: 'lamp_light' }, { effect: 'sparkle' },
      ['juno', 'There. The first light in three years. Look at the whole harbour glow.', 'happy'],
      ['juno', 'You know, I thought I did everything alone. Fishing, fixing, winning. But this? This is better with you.', 'shy'],
    ],
  }),
]);
