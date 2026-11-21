// Friend events (S4a, written by the lead): Jules, Dante, Owen, Bruno, Kit. Stage only on tier-1 maps.
// Every window is wide on purpose: a missed beat fires at the next opportunity (never hard-lock).
import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, pose, emote, cam, sfx, music, setFlag, friend, money, stat, giveItem,
  all, any, not,
} from '../../sim/script_dsl.js';
import { open } from './fest_shared.js';

const ev = (o) => ({ kind: 'friend', priority: 55, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------ Jules: the Grand Tour (Y1 Spring 1 lunch; onboarding table in doc 03 section 10)
  ev({
    id: 'jules_01_guide', title: 'The Grand Tour', priority: 70,
    trigger: { type: 'auto', time: ['11:30', '17:00'] },
    when: all({ year: 1 }, { seen: 'main_02_homeroom' }, { map: ['school_classroom', 'school_hall_2f', 'school_hall_1f', 'school_grounds'] }),
    script: [
      ...open('school_hall_1f', 'door_front', [place('jules', 'vending', 'right'), place('theo', 'door_front', 'right'), music('school_day')]),
      say('jules', 'happy', "Lunch break! That makes you mine until the bell. Welcome to the Grand Tour of Bellhaven High, narrated by Jules Park, future voice of sports."),
      moveTo('theo', 'npc_1'), face('jules', 'theo'),
      say('jules', 'smug', 'Stop one: the vending machine. Rule number one. The third button is a liar. It says orange juice. It is tomato. It has always been tomato.'),
      choice([
        opt('"Why do you know that?"', [
          say('jules', 'sad', 'Experience. Pain. A frankly unreasonable amount of tomato.'),
          friend('jules', 2), setFlag('jules_tour_tomato'),
        ]),
        opt('Buy a drink anyway ($3)', [
          money(-3), sfx('coin'),
          say('jules', 'surprised', 'You pressed the third button. You pressed it WITH YOUR EYES OPEN.'),
          say('theo', 'neutral', '...It is tomato.'),
          say('jules', 'happy', 'Welcome to the family, Hartley-dude. First one is on the school. Second one is on you.'),
          friend('jules', 4), setFlag('jules_tour_tomato'),
        ]),
        opt('"I\'ll take your word for it."', [
          say('jules', 'happy', 'A man of trust. I will not forget this. I might forget your name. But not this.'),
          friend('jules', 3),
        ]),
      ]),
      say('jules', 'neutral', "Stop two. The notice board. Everything important gets pinned here. Everything unimportant also gets pinned here. You learn to tell by the tape."),
      say('jules', 'thinking', "Stop three, and it's the good one. Follow me. Don't tell Ms. D I took you up the roof stairs. She says it is 'against several rules and one law of physics'."),
      ...open('school_rooftop', 'door', [place('jules', 'bench', 'down'), place('theo', 'door', 'right'), music('rooftop')]),
      narrate('The roof is all sky. A fence, a sea of blue beyond it, a water tank and, on a folded cardboard box by the herb garden, a cat the colour of toast.'),
      moveTo('theo', 'npc_1'),
      say('jules', 'happy', "That's Biscuit. She belongs to nobody and she adores whoever shares a sandwich. Right now that is a business model."),
      say('jules', 'neutral', "And that door, the one with the chain? The bell tower. The bell hasn't rung since before we were born. Nobody will tell you why."),
      emote('theo', 'question'),
      say('theo', 'thinking', 'Why not?'),
      say('jules', 'smug', "That, my friend, is a Hartley-dude question. Ask it long enough and this town starts handing you answers. Or tomato."),
      say('jules', 'happy', "Anyway! My family's diner does a noodle special after school. Park's Diner, harbor road. First bowl is free for new friends."),
      choice([
        opt('"Count me in."', [say('jules', 'happy', 'Friday. I will tell my mum you are coming and she will cook for nine.'), friend('jules', 5), setFlag('jules_diner_invited')]),
        opt('"Maybe, if I survive the week."', [say('jules', 'happy', 'The standing offer stands. I am a very patient diner.'), friend('jules', 3)]),
      ]),
      setFlag('jules_tour_done'),
    ],
  }),

  // ------------------------------------------------------------------ Dante: the rival
  ev({
    id: 'dante_01_rival', title: 'Keepie-Uppie Showdown',
    trigger: { type: 'enterMap', map: 'school_grounds', time: ['15:10', '17:30'] },
    when: all({ year: 1 }, { notSeen: 'dante_01_rival' }, any({ season: ['summer', 'autumn', 'winter'] }, { day: [3, 28] })),
    script: [
      ...open('school_grounds', 'gate', [place('dante', 'stage', 'down'), place('theo', 'gate', 'up'), music('school_day')]),
      moveTo('theo', 'courtyard'),
      narrate('A soccer ball arcs over the courtyard, taps a knee, a foot, a shoulder, and never touches the ground. Underneath it, a boy who knows exactly how good he looks.'),
      say('dante', 'smug', "Transfer student. I'm Dante Rossi. Striker, vice-captain, undefeated at keepie-uppies since the third grade."),
      face('dante', 'theo'),
      say('dante', 'neutral', "I hear Jules gave you the tour. I'm not saying he's wrong. I'm saying he's incomplete. The tour should end with a challenge."),
      choice([
        opt('"Fine. How many?"', [
          say('dante', 'happy', "Three. Three is nothing. Three is breathing."),
          sfx('kick'),
          narrate('Theo lifts the ball, lets it drop onto his knee, and watches it roll thoughtfully into a flower bed.'),
          say('dante', 'surprised', '...Zero.'),
          say('theo', 'shy', 'I said I\'d try.'),
          say('dante', 'smug', "You tried, Hartley. That is more than half this school. Pick it up. We'll do this again when you can walk and kick."),
          friend('dante', 5), setFlag('dante_rival_accepted'),
        ]),
        opt('"Not today."', [
          say('dante', 'smug', 'Wise. Fear is the first step on the road to respect.'),
          say('dante', 'neutral', "...And the second step is practice. Come find me when you've done both."),
          friend('dante', 2), setFlag('dante_rival_declined'),
        ]),
        opt('"I\'ll cheer for you instead."', [
          say('dante', 'surprised', 'Cheer? For me? ...Nobody has ever offered to just CHEER.'),
          emote('dante', 'sparkle'),
          say('dante', 'happy', "Then stand there and watch history. Don't blink, don't sneeze, and say 'wow' on the fifth touch."),
          sfx('clap'),
          friend('dante', 4), setFlag('dante_rival_cheer'),
        ]),
      ]),
      setFlag('dante_rivalry_started'),
    ],
  }),

  // ------------------------------------------------------------------ Owen: the rooftop sun-viewer
  ev({
    id: 'owen_01_observatory', title: 'Statistically, a Telescope',
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['15:10', '18:30'] },
    when: all({ year: 1 }, any({ season: ['summer', 'autumn', 'winter'] }, { day: [10, 28] })),
    script: [
      ...open('school_rooftop', 'door', [place('owen', 'water_tank', 'left'), place('theo', 'door', 'right'), music('rooftop')]),
      moveTo('theo', 'npc_2'),
      narrate('Owen Tran is on his knees beside a cardboard box with a lens taped into the lid. A small bright circle trembles on a sheet of paper.'),
      say('owen', 'neutral', "Do not stand in the beam. You are blocking the sun. Which is, statistically, rude."),
      face('owen', 'theo'),
      say('owen', 'neutral', 'Pinhole projector. Observatory is a long walk and a longer wait, so I bring a smaller sky to school.'),
      say('theo', 'surprised', 'Is that... the sun? Those dark specks...'),
      say('owen', 'happy', "Sunspots. Two groups today. They move. Come back tomorrow and they will have moved again. That never gets old."),
      choice([
        opt('"That\'s kind of beautiful."', [
          say('owen', 'shy', 'Beautiful is not a unit. But yes.'),
          friend('owen', 5), setFlag('owen_sunspots_seen'),
        ]),
        opt('"Can I build one?"', [
          say('owen', 'happy', 'A box, a lens, a sheet of paper. Four dollars if you do not own a lens. Zero if you borrow mine, which is the correct choice.'),
          stat('creativity', 1), friend('owen', 4), setFlag('owen_sunspots_seen'),
        ]),
        opt('"Why up here?"', [
          say('owen', 'neutral', 'Highest point with a door that locks from the inside. The only person who disturbs me is a cat. She is a statistical outlier.'),
          friend('owen', 3),
        ]),
      ]),
      iff({ club: null }, [
        say('owen', 'neutral', 'The Astronomy Club has four members. If you count the cat, five. We meet after school, and we are short of enthusiasm and long on snacks.'),
        choice([
          opt('Join the Astronomy Club', [
            setFlag('club_pick_astronomy'), setFlag('owen_recruited'),
            say('owen', 'happy', 'Welcome. Your first duty is to bring a snack. Your second is to not touch the lens.'),
            friend('owen', 4),
          ]),
          opt('"Let me think about it."', [say('owen', 'neutral', 'Thinking is the club. The rest is snacks.')]),
        ]),
      ], [
        say('owen', 'neutral', "You belong to another club. That is fine. Astronomy is not jealous. It is two hundred thousand light-years of patience."),
      ]),
      setFlag('owen_met'),
    ],
  }),

  // ------------------------------------------------------------------ Bruno: the captain
  ev({
    id: 'bruno_01_captain', title: 'The Captain',
    trigger: { type: 'enterMap', map: 'school_grounds', time: ['15:10', '17:30'] },
    when: all({ year: 1 }, { notSeen: 'bruno_01_captain' }, any({ season: ['summer', 'autumn', 'winter'] }, { day: [6, 28] })),
    script: [
      ...open('school_grounds', 'gate', [place('bruno', 'bench_1', 'down'), place('theo', 'gate', 'up'), music('school_day')]),
      moveTo('theo', 'bench_2'),
      narrate('A third-year in a soccer jersey is retying a worn-out captain\'s armband on a bench in the shade. He looks like a lighthouse that learned to sit.'),
      say('bruno', 'happy', "You're the transfer. Bruno Kessler. Captain of nothing in particular, according to my mother."),
      say('bruno', 'neutral', "I know every kid at this school by their kick. You walk like somebody who is still listening for the bell. Don't lose that."),
      choice([
        opt('"What does the captain do all day?"', [
          say('bruno', 'neutral', 'Mostly: remember birthdays, carry the water, tell people they are better than they think. The kicking is a side job.'),
          friend('bruno', 5),
        ]),
        opt('"Any advice for a new kid?"', [
          say('bruno', 'happy', "Eat lunch with somebody new every week. Say yes to the first invitation you are afraid of. Keep your shoes tied."),
          stat('charm', 1), friend('bruno', 4),
        ]),
        opt('Hand him a bottle of water.', [
          say('bruno', 'surprised', "Ha. Natural. That's the whole job, you know. You'd make a decent captain."),
          friend('bruno', 5),
        ]),
      ]),
      say('bruno', 'neutral', 'I graduate this winter. Do me a favour: be around when the little ones need somebody.'),
      setFlag('bruno_met'),
    ],
  }),
  ev({
    id: 'bruno_03_farewell', title: 'Captain\'s Farewell', priority: 62,
    trigger: { type: 'auto', time: ['12:00', '19:00'] },
    when: all({ year: 1 }, { season: 'winter' }, { day: [26, 28] }, { map: ['school_grounds', 'town_square', 'town_harbor'] }),
    script: [
      ...open('school_grounds', 'gate', [place('bruno', 'bench_1', 'down'), place('theo', 'gate', 'up'), music('sad')]),
      moveTo('theo', 'bench_2'),
      narrate('The year-end banner flaps over the gate. On the bench, Bruno has taken off the armband and is holding it like it weighs more than cloth.'),
      say('bruno', 'neutral', "Graduation tomorrow. Everyone keeps saying 'enjoy it'. I'd enjoy it more if it didn't feel like handing back a library book."),
      choice([
        opt('"You were the best captain."', [
          say('bruno', 'shy', 'I was loud and I tied a lot of shoelaces. ...But thank you. I needed to hear it from somebody who is not my mother.'),
          friend('bruno', 6), setFlag('bruno_farewell_kind'),
        ]),
        opt('"What will you do?"', [
          say('bruno', 'thinking', "Sports science, up at the Harbor City campus. And I will cheer too loudly at your games from the very back row."),
          friend('bruno', 5), setFlag('bruno_farewell_plans'),
        ]),
        opt('Say nothing. Sit beside him.', [
          narrate('You sit. The wind turns a page of somebody\'s dropped homework across the courtyard. Neither of you reaches for it.'),
          say('bruno', 'happy', "...You know, that's the best answer anyone's given me all week."),
          friend('bruno', 7), setFlag('bruno_farewell_silent'),
        ]),
      ]),
      say('bruno', 'neutral', "Here. Somebody has to hold it for a while. Dante thinks he deserves it, Jules thinks he'd lose it. You? You'd carry the water."),
      giveItem('sports_drink', 2),
      say('bruno', 'happy', "Take these too. Win something. Lose something. Mostly, show up."),
      sfx('heart'),
      setFlag('bruno_farewell_done'),
    ],
  }),

  // ------------------------------------------------------------------ Kit: the admirer (Year 2+)
  ev({
    id: 'kit_01_admirer', title: 'Hartley-senpai?!',
    trigger: { type: 'enterMap', map: 'school_grounds', time: ['07:30', '17:30'] },
    when: all({ year: [2, 3] }, { notSeen: 'kit_01_admirer' }),
    script: [
      ...open('school_grounds', 'gate', [place('kit', 'courtyard', 'down'), place('theo', 'gate', 'up'), music('school_day')]),
      moveTo('theo', 'fountain'),
      narrate('A first-year carrying a tower of track-club flyers is trying to say hello, wave, and not drop anything. One of the three works.'),
      sfx('swoosh'),
      narrate('The flyers go everywhere.'),
      say('kit', 'surprised', 'AH. Sorry! Sorry! Senpai! I mean Hartley! I mean Hartley-senpai!'),
      say('theo', 'neutral', 'Do I know you?'),
      say('kit', 'happy', "Kit Alvarez, first-year! I was in the stands at the Regional Meet last summer! You cheered for a stranger who tripped! That was me!"),
      say('kit', 'shy', "I joined track because of that. Also because Captain Nina yells in a motivating way."),
      choice([
        opt('Help pick up the flyers.', [
          narrate('Between you, the flyers are saved from a fountain and one passing seagull.'),
          say('kit', 'happy', "You're so nice! Is this what third-years are like? Because I'm very excited for year three."),
          friend('kit', 5), setFlag('kit_helped'),
        ]),
        opt('"Don\'t call me senpai."', [
          say('kit', 'sad', '...Hartley-sempai-dude?'),
          say('theo', 'neutral', 'Just Theo.'),
          say('kit', 'happy', "'Just Theo.' That sounds like a title. I'll go with that."),
          friend('kit', 4), setFlag('kit_helped'),
        ]),
        opt('"Join me for lunch sometime?"', [
          say('kit', 'surprised', 'Lunch?! With a Third-Year?! ...Is there a dress code?'),
          friend('kit', 6), setFlag('kit_lunch_invited'),
        ]),
      ]),
      say('kit', 'happy', "I'll be at the field every day after school. Tripping on purpose, mostly. I mean on accident. Bye!"),
      setFlag('kit_met'),
    ],
  }),
];

