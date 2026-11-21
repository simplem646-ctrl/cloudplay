// Random slice-of-life events (S4a, written by the lead). kind 'random', low priority, gated by `chance` (stable within a day) and place/season/weather.
import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, pose, emote, sfx, music, setFlag, addCounter, friend, money, stat, takeItem, energy,
  all, any, not,
} from '../../sim/script_dsl.js';
import { open } from './fest_shared.js';

const rnd = (o) => ({ kind: 'random', priority: 20, repeat: 'daily', skippable: true, ...o });

export default [
  rnd({
    id: 'rand_lucky_coin', title: 'Under the Fountain',
    trigger: { type: 'enterMap', map: 'town_square', time: ['07:00', '19:00'] },
    when: { chance: 0.15 },
    script: [
      narrate('Something small and bright is wedged between two cobbles by the fountain. A coin, polished by a hundred passing shoes.'),
      choice([
        opt('Pocket it ($8)', [money(8), sfx('coin'), think('A good day to be short and observant.')]),
        opt('Toss it into the fountain', [
          sfx('splash'),
          think('One coin. One wish. Not telling.'),
          stat('charm', 1), setFlag('rand_fountain_wish'),
        ]),
      ]),
    ],
  }),

  rnd({
    id: 'rand_biscuit_snack', title: 'Biscuit Inspects Your Pockets',
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['15:10', '18:30'] },
    when: { chance: 0.5 },
    script: [
      ...open('school_rooftop', 'door', [place('theo', 'door', 'right'), music('rooftop')]),
      moveTo('theo', 'garden'),
      narrate('Biscuit is loafing on her cardboard bed, one eye open. The eye follows your pockets.'),
      iff({ item: ['cat_treats', '>=', 1] }, [
        takeItem('cat_treats', 1), sfx('eat'),
        narrate('The treat disappears so fast it might never have existed. Biscuit purrs like a tiny, smug engine.'),
        addCounter('biscuit_trust', 2), emote('theo', 'heart'),
      ], [
        iff({ item: ['bread', '>=', 1] }, [
          takeItem('bread', 1), sfx('eat'),
          narrate('She accepts half the bread with great dignity and pretends the other half is a coincidence.'),
          addCounter('biscuit_trust', 1),
        ], [
          narrate('You have nothing to offer but your hands. She considers them, then butts her forehead against your wrist.'),
          addCounter('biscuit_trust', 1),
        ]),
      ]),
      iff({ counter: ['biscuit_trust', '>=', 5] }, [setFlag('biscuit_friend'), think('Biscuit follows you to the door. She has made a decision about you.')]),
    ],
  }),

  rnd({
    id: 'rand_shared_umbrella', title: 'One Umbrella, Two Students',
    trigger: { type: 'enterMap', map: 'school_grounds', time: ['14:50', '17:30'] },
    when: all({ weather: ['rain', 'storm'] }, { chance: 0.35 }),
    script: [
      ...open('school_grounds', 'gate', [place('student_05', 'gate', 'down'), place('theo', 'gate', 'up'), music('rain')]),
      narrate('A first-year is standing under the gate canopy, looking at the rain the way people look at a bill.'),
      say('student_05', 'sad', "Um. I forgot my umbrella. It's, um, a two-bus ride. And my bag has my homework in it."),
      choice([
        opt('Share your umbrella to the bus stop.', [
          narrate('Two people under one umbrella is a geometry problem. You solve it by getting wet on one side.'),
          say('student_05', 'happy', "You're soaked! Thank you! I'll, um, tell everyone you're nice."),
          stat('charm', 1), setFlag('rand_umbrella_shared'),
        ]),
        opt('Lend it and run.', [
          narrate('You hand over the umbrella, say "keep it!" and sprint into the weather like a hero in a very damp film.'),
          stat('fitness', 1), energy(-5), setFlag('rand_umbrella_lent'),
        ]),
        opt('"The bus stop is right there."', [
          say('student_05', 'sad', '...Right. Right. Thanks anyway.'),
          think('That was true. It also did not feel great.'),
        ]),
      ]),
    ],
  }),

  rnd({
    id: 'rand_dropped_notes', title: 'Paper Storm',
    trigger: { type: 'enterMap', map: 'school_hall_2f', time: ['12:20', '17:30'] },
    when: { chance: 0.25 },
    script: [
      sfx('swoosh'),
      narrate('A window slams. A stack of notebooks paper explodes down the hallway like startled doves.'),
      choice([
        opt('Gather every sheet.', [
          narrate('Most of it is neat, small handwriting about the causes of a very old war. By the fifth page you have accidentally learned something.'),
          stat('history', 1), setFlag('rand_notes_gathered'),
        ]),
        opt('Skim them while gathering.', [
          narrate('Margin notes in careful blue ink: "Ask about this on Thursday." "Is this true?" "Check." Somebody takes learning seriously.'),
          stat('literature', 1),
        ]),
      ]),
      narrate('You leave the pile on the nearest windowsill with a pebble on top. Somebody will come back for it.'),
    ],
  }),

  rnd({
    id: 'rand_piano_tune', title: 'The Piano Behind the Door', repeat: 'once',
    trigger: { type: 'enterMap', map: 'school_hall_2f', time: ['16:00', '19:00'] },
    when: { chance: 0.25 },
    script: [
      narrate('The hallway is nearly empty. From the end of the corridor, behind a door with a hand-lettered "MUSIC ROOM" sign, a piano is playing something slow.'),
      narrate('Not a lesson. Not a scale. A tune that seems to be looking for the way home.'),
      choice([
        opt('Stand and listen.', [
          narrate('Eight bars, a stumble, eight bars. Then silence, like somebody has noticed they are being listened to.'),
          think('Whoever that is plays like they are explaining something to themselves.'),
          setFlag('rand_heard_piano'), stat('creativity', 1),
        ]),
        opt('Knock softly.', [
          narrate('The piano stops. Nobody answers. When you look again, the sign on the door is slightly crooked, as if somebody had leaned against it from the inside.'),
          setFlag('rand_heard_piano'),
        ]),
      ]),
    ],
  }),

  rnd({
    id: 'rand_seasonal_walk', title: 'The Park, Right Now',
    trigger: { type: 'enterMap', map: 'town_park', time: ['10:00', '18:00'] },
    when: all({ chance: 0.3 }, { weather: ['sunny', 'cloudy', 'snow'] }),
    script: [
      iff({ season: 'spring' }, [narrate('Cherry petals are coming down in slow, deliberate handfuls. One lands exactly in your hair and refuses to leave.'), stat('creativity', 1)]),
      iff({ season: 'summer' }, [narrate('The cicadas have opened for the afternoon. The pond is the colour of green glass and a duck is conducting a very small orchestra.'), energy(5)]),
      iff({ season: 'autumn' }, [narrate('Leaves in six different oranges chase each other across the lawn. A toddler is running through them like it is a legal right.'), stat('charm', 1)]),
      iff({ season: 'winter' }, [narrate('Frost has turned the bridge rails to sugar. Your breath makes a small cloud and the pond has a skin of thin, singing ice.'), stat('fitness', 1)]),
      think('Not everything has to be an event. Some days the park is just the park, and that is enough.'),
    ],
  }),
];
