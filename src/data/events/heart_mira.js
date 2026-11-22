import { heartEvent as H, events } from './_heart.js';

export default events([
  H('mira', 2, {
    area: 'bakery', at: 'kneading_table', npcAt: 'oven_spot', when: [{ time: { from: '07:00', to: '11:00' } }, { not: { weekday: 'sun' } }], music: 'comedy',
    steps: [
      { anim: 'mira', name: 'carry_walk' },
      ['mira', 'Careful, careful, big sack coming through! Nobody move! Nobody breathe!', 'worried'],
      { anim: 'mira', name: 'fall', wait: true }, { effect: 'dust' }, { sfx: 'pop' },
      ['mira', 'Ow. Oh no. I am a snowman. {player}, am I a snowman?', 'surprised'],
      ['player', 'A very friendly snowman. Are you hurt?'],
      ['mira', 'Only my pride! And the flour! Oh, the flour... Here, take a warm roll to say thank you for not laughing.', 'shy'],
      { giveItem: 'honey_roll' },
      ['mira', 'Okay, you can laugh a little. I would.', 'laugh'],
    ],
  }),
  H('mira', 4, {
    // the bakery opens at 07:00: the player starts the scene from the square, Mira lets them in early
    area: 'bakery', trigger: 'town_square', at: 'kneading_table', npcAt: 'oven_spot', when: [{ time: { from: '06:00', to: '07:00' } }, { not: { weekday: 'sun' } }],
    steps: [
      ['mira', 'You came early! Good. It is the best part of the day, when everything is blue and quiet.', 'happy'],
      { anim: 'mira', name: 'knead', wait: true },
      ['mira', 'Press, fold, turn. Do not be afraid of it. The dough can tell.', 'happy'],
      ['player', 'Like this?'],
      ['mira', 'Perfect! You have good hands, {player}. Mum would say "adequate". That means perfect.', 'laugh'],
      ['mira', 'Can I tell you something silly? I want my own little café-bakery. Tables, flowers, a bell on the door.', 'shy'],
      ['player', 'That does not sound silly at all.'],
      ['mira', 'Thank you. I have never said it out loud before.', 'shy'],
    ],
  }),
  H('mira', 6, {
    area: 'riverside_park', at: 'bench_rp_1_spot', npcAt: 'gazebo_spot', when: [{ time: { from: '17:30', to: '20:00' } }, { not: { weather: ['rain', 'storm'] } }],
    steps: [
      ['mira', 'Oh! {player}! I did not hear you. I was writing in my notebook. It is just recipes. And some dreams.', 'shy'],
      ['mira', 'See? "Mira\'s Bakery." And a drawing of a window. It is a very bad drawing.', 'laugh'],
      ['mira', 'But how can I go? Mum needs me. She would never say it, but she does.', 'sad'],
      ['player', 'Have you told her what you want?'],
      ['mira', 'No. I am afraid she will say "adequate". Or worse, say nothing.', 'worried'],
      ['player', 'I think you should tell her. I will be there if you want.'],
      ['mira', 'You would? Oh. Okay. Okay! Maybe soon. Thank you, {player}.', 'happy'],
    ],
  }),
  H('mira', 8, {
    area: 'starview_hill', at: 'view_bench_spot', npcAt: 'summit', prompt: 'Mira looks at you, flour in her hair, hopeful.',
    when: [{ time: { from: '06:00', to: '08:30' } }, { not: { weather: ['rain', 'storm', 'snow'] } }],
    yes: 'Yes! Oh, yes! I was so scared you would say no. Mum is going to be unbearable. In a good way.',
    steps: [
      ['mira', 'I told Mum. I told her everything. She was quiet for such a long time.', 'worried'],
      { place: 'rosalind', at: 'trail_south', area: 'starview_hill', facing: 'player' },
      ['rosalind', 'I came to say I am sorry. I was afraid, too. A bakery is a lot of work.', 'sad'],
      ['rosalind', 'But yours will be better. Do not tell anyone I said that. {player}, thank you.', 'happy'],
      { hide: 'rosalind' },
      ['mira', 'We are going to bake together! Not just me and Mum. She said you can have a stool. A very small one.', 'laugh'],
      ['mira', 'The sun is coming up. Look. The whole town is waking up, bit by bit.', 'happy'],
      ['mira', '{player}, I have flour in my hair and tomorrow I will probably trip. But I want you there for all of it.', 'shy'],
    ],
  }),
]);
