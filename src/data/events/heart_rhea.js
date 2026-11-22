import { heartEvent as H, events } from './_heart.js';

export default events([
  H('rhea', 2, {
    area: 'cafe', at: 'counter_front', npcAt: 'behind_counter', when: [{ time: { from: '10:00', to: '19:00' } }, { not: { weekday: 'mon' } }], music: 'cafe',
    steps: [
      ['rhea', 'Sit. I am going to make you something, and you are going to tell me what is wrong with it.', 'smug'],
      { anim: 'rhea', name: 'serve', wait: true },
      ['rhea', 'Taste it. Slowly. Not like a person at a bus stop.', 'neutral'],
      ['player', 'It is... a little bitter at first. Then sweet. And there is a warm spice at the end.'],
      ['rhea', '...Huh. Most people say "nice". You said something true.', 'surprised'],
      ['rhea', 'Do not let it go to your head. But you may have a second cup. On the house.', 'smug'],
    ],
  }),
  H('rhea', 4, {
    area: 'cafe', at: 'counter_front', npcAt: 'piano_spot', when: [{ night: true }], music: 'cafe',
    steps: [
      ['rhea', 'We are closed. You may stay. Do not tell anyone I have a soft spot for stragglers.', 'smug'],
      ['rhea', 'Sit. I will make you cocoa. It is the only thing I make badly on purpose. So it is not too perfect.', 'shy'],
      { anim: 'rhea', name: 'serve', wait: true },
      { anim: 'rhea', name: 'sit' },
      ['rhea', '...You are humming. What is that tune? It is lovely.', 'thinking'],
      ['player', 'Actually, that was you.'],
      ['rhea', 'Was it? Oh. I did not know I did that. How embarrassing. How... nice.', 'shy'],
    ],
  }),
  H('rhea', 6, {
    area: 'cafe', at: 'counter_front', npcAt: 'behind_counter', when: [{ weather: ['rain', 'storm'] }, { time: { from: '17:00', to: '23:00' } }],
    steps: [
      ['rhea', 'It is raining. It was raining the day I left the city, too. I should tell you why.', 'sad'],
      ['rhea', 'I trained under a famous chef. One night, he threw a plate. At a junior cook. A girl of seventeen.', 'angry'],
      ['rhea', 'I picked up my knife roll and walked out. I never said a word. I have been afraid of that kitchen ever since.', 'sad'],
      ['player', 'You left because it was the right thing to do.'],
      ['rhea', 'Maybe. I have never heard it said like that. It sounds kinder than I have been to myself.', 'shy'],
      ['rhea', 'Thank you. Now drink your tea. It is going cold, and I will not have that.', 'smug'],
    ],
  }),
  H('rhea', 8, {
    // the café is closed on Mondays: the player starts the scene from the square (the door), Rhea lets them in
    area: 'cafe', trigger: 'town_square', at: 'table_cf_1', npcAt: 'behind_counter', when: [{ weekday: 'mon' }, { time: { from: '18:00', to: '22:00' } }],
    prompt: 'Rhea sets down her glass. Her voice is steady, but her hands are not.',
    yes: 'Good. I was prepared for no. I had a very elegant speech for no. Now I will have to waste it.',
    steps: [
      ['rhea', 'It is Monday. The café is closed. I am cooking tonight, for one guest. Sit.', 'smug'],
      { anim: 'rhea', name: 'serve', wait: true },
      ['rhea', 'Seven courses. Small ones. Do not rush, and do not tell me it is good. Tell me what it is.', 'shy'],
      ['player', 'The last one is spiced cocoa. Tobias\' recipe.'],
      ['rhea', 'Yes. I made it the way he took it. And the first six were for me, to practise being brave.', 'shy'],
      ['rhea', 'I do not know how to say this elegantly. So: I like you. More than the menu. More than the café.', 'happy'],
    ],
  }),
]);
