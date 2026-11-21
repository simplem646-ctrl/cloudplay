// Family and town events (S4a, written by the lead): Aunt Roz (four) and Mr. Finch (three). Tier-1 maps only.
import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, pose, emote, cam, sfx, music, setFlag, friend, money, stat, giveItem, takeItem,
  all, any, not,
} from '../../sim/script_dsl.js';
import { open } from './fest_shared.js';

const ev = (o) => ({ kind: 'friend', priority: 52, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------ Roz
  ev({
    id: 'roz_01_sunday_call', title: 'Sunday Call', priority: 58,
    trigger: { type: 'wake' },
    when: all({ year: 1 }, { weekday: 'Sun' }, { notSeen: 'roz_01_sunday_call' }, any({ season: ['summer', 'autumn', 'winter'] }, { day: [7, 28] })),
    script: [
      place('roz', 'kitchen_table', 'left'),
      music('home_morning'),
      narrate('Sunday. The phone on the kitchen wall rings twice, the way it only does when it is a long way away.'),
      say('roz', 'happy', "That'll be your mother. Seven hours ahead of us and not once in her life on time. Go on, I'll make the toast."),
      moveTo('theo', 'kitchen_table'),
      sfx('phone'),
      say('theo', 'happy', 'Hi, Mum. Hi, Dad. Yes, I ate. Yes, there are vegetables. One. It was a pea.'),
      narrate('The line crackles with two voices at once, one asking about school, the other about whether the sea is far from the house.'),
      choice([
        opt('"School\'s hard, but I like it."', [
          say('theo', 'happy', "Class B is loud and nice. There's a rooftop and a cat and a bell nobody rings."),
          narrate('A short silence on the line. Then your mother\'s laugh, relieved and a little wet.'),
          friend('roz', 3), setFlag('roz_call_honest'),
        ]),
        opt('"Everything\'s great! Truly!"', [
          narrate('Your father says that is what you said about the chemistry class in sixth grade. Your mother says you sound tired.'),
          say('roz', 'neutral', 'You do sound tired. Tell them about the bell. They like stories more than they like "great".'),
          friend('roz', 2), setFlag('roz_call_brave'),
        ]),
        opt('"I miss you. A bit."', [
          say('theo', 'sad', 'A bit. Also the harbor smells like fish. But I miss you.'),
          say('roz', 'sad', "...They miss you more, love. Don't tell them I said it. They'd try to fly."),
          friend('roz', 5), setFlag('roz_call_missing'),
        ]),
      ]),
      say('roz', 'neutral', "Eat the toast. Sundays have rules and toast is the third."),
      setFlag('roz_calls_started'),
    ],
  }),
  ev({
    id: 'roz_02_cafe_rush', title: 'The Morning Rush',
    trigger: { type: 'enterMap', map: 'cafe_lantern', time: ['07:00', '09:00'] },
    when: all({ year: 1 }, { schoolDay: true }, { notSeen: 'roz_02_cafe_rush' }, any({ season: ['summer', 'autumn', 'winter'] }, { day: [8, 28] })),
    script: [
      ...open('cafe_lantern', 'door_front', [place('roz', 'counter', 'down'), place('theo', 'door_front', 'up'), place('student_05', 'table_1', 'down'), place('townie_01', 'table_2', 'right'), music('cafe')]),
      moveTo('theo', 'npc_1'),
      narrate('The Lantern Café at 07:40: eleven orders, one espresso machine, and Aunt Roz humming a song that sounds like a tune and a threat.'),
      say('roz', 'surprised', "Theo! Good. You have hands. Take the tray. The pink mug is Mrs. Ito's, the chipped one is the fisherman's, the rest are a mystery."),
      choice([
        opt('Carry the tray carefully.', [
          narrate('You thread between tables like somebody dodging cats. Every mug lands where it should.'),
          say('roz', 'happy', "Look at that. You've got steady hands. That's a job skill, love."),
          money(10), stat('charm', 1), friend('roz', 4), setFlag('roz_rush_careful'),
        ]),
        opt('Run. Time is coffee.', [
          sfx('hit'),
          narrate('The chipped mug is faster than you. It makes a small, dramatic escape.'),
          say('roz', 'smug', "Ha! And that is why we have a mop and a policy. No harm done. I'll take it out of your pocket money. Eventually."),
          friend('roz', 3), setFlag('roz_rush_chaos'),
        ]),
        opt('Ask what the song is.', [
          say('roz', 'happy', "'The Harbor Lights Shall Not Be Fooled'. My mother's. Hum along, it's quicker."),
          friend('roz', 5), setFlag('roz_rush_song'),
        ]),
      ]),
      say('roz', 'neutral', "If you ever want hours, the café has them. Weekdays after school, weekends in the day. Three hours a shift, honest pay, a free scone and my gratitude."),
      setFlag('job_cafe_offered'),
    ],
  }),
  ev({
    id: 'roz_03_worry', title: 'The Numbers Roz Does Not Say',
    trigger: { type: 'enterMap', map: 'cafe_lantern', time: ['19:00', '22:30'] },
    when: all({ year: [1, 2] }, { seen: 'main_08_enrolment_rumour' }, { notSeen: 'roz_03_worry' }),
    script: [
      ...open('cafe_lantern', 'door_front', [place('roz', 'table_3', 'left'), place('theo', 'door_front', 'up'), music('cafe')]),
      moveTo('theo', 'table_4'),
      narrate('Closing time. The paper lanterns have been dimmed to the colour of tea. Roz is sitting at a table instead of behind the counter, which is how you know.'),
      say('roz', 'sad', "Half my afternoon trade is school kids. The half that pays in coins with chocolate on them. If the school goes..."),
      say('roz', 'neutral', "Never mind. I'm a grown woman with a leaking roof and a very good espresso machine. I will be fine."),
      choice([
        opt('"The school isn\'t going anywhere."', [
          say('roz', 'surprised', '...We?'),
          say('theo', 'neutral', "The Bell Committee. Me, Owen, a lot of tape."),
          say('roz', 'happy', 'Oh, love. You sound exactly like him.'),
          friend('roz', 6), setFlag('roz_worry_hope'),
        ]),
        opt('"What was the school like when you went?"', [
          say('roz', 'thinking', "Louder. Smaller. Old Finch kept the bell then. He taught me to wind the tower clock when I was your age."),
          say('roz', 'smug', "I wasn't supposed to be on the roof. Neither was he. That's how you know it was a good friendship."),
          friend('roz', 5), setFlag('roz_old_friends_known'),
        ]),
        opt('Make her a hot cocoa.', [
          sfx('pour'),
          say('roz', 'happy', "You even froth it. Who raised you? ...Oh. Right. Me. On weekends."),
          friend('roz', 5), setFlag('roz_cocoa'),
        ]),
      ]),
      setFlag('roz_worry_shared'),
    ],
  }),
  ev({
    id: 'roz_04_midnight', title: 'Cocoa After Hours', priority: 54,
    trigger: { type: 'enterMap', map: 'home_theo', time: ['22:30', '25:30'] },
    when: all({ hearts: ['roz', '>=', 4] }, { seen: 'roz_03_worry' }, { notSeen: 'roz_04_midnight' }),
    script: [
      ...open('home_theo', 'door_stairs', [place('roz', 'kitchen_table', 'left'), place('theo', 'door_stairs', 'down'), music('home_morning')]),
      moveTo('theo', 'npc_1'),
      narrate('Aunt Roz is up in the kitchen with two cups of cocoa that were not made for one person.'),
      say('roz', 'neutral', "Don't look at the clock, I'm not in the mood. Sit. This is a long-overdue conversation."),
      say('roz', 'sad', "Your parents asked me to take you in because the harbor city rent doubled and because they thought you'd be less lonely in a small place. They were half right."),
      say('roz', 'thinking', "I said yes before they finished asking. A house with one person in it is a very quiet instrument, love."),
      choice([
        opt('"I\'m glad I came."', [
          say('roz', 'happy', 'Say it again? No, I\'ll treasure the first one.'),
          friend('roz', 8), setFlag('roz_midnight_glad'),
        ]),
        opt('"You don\'t have to be alone either."', [
          say('roz', 'surprised', '...Look at you. Eating my cocoa and giving my speeches.'),
          friend('roz', 7), setFlag('roz_midnight_company'),
        ]),
        opt('Raise your cup. Don\'t say anything.', [
          sfx('chime'),
          say('roz', 'happy', "To the Lantern Café, the world's smallest bell tower of a house."),
          friend('roz', 7), setFlag('roz_midnight_toast'),
        ]),
      ]),
      say('roz', 'neutral', 'Bed. Both of us. The toast is in the morning and the morning has rules.'),
      setFlag('roz_midnight_talk'),
    ],
  }),

  // ------------------------------------------------------------------ Finch
  ev({
    id: 'finch_01_tide_tea', title: 'Tide and Tea',
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['08:00', '17:00'] },
    when: all({ flag: 'main_bell_story_known' }, { notSeen: 'finch_01_tide_tea' }, { weather: ['sunny', 'cloudy'] }),
    script: [
      ...open('town_harbor', 'door_cafe', [place('mr_finch', 'finch_spot', 'down'), place('theo', 'door_cafe', 'down'), music('town_spring')]),
      moveTo('theo', 'dock_bench'),
      say('mr_finch', 'neutral', "You again. Rosalind's boy. Sit. Not there, there. That one has a nail."),
      narrate('He pours tea from a dented thermos into a lid, hands you the lid, and drinks from the thermos itself. This seems to be a sign of respect.'),
      say('mr_finch', 'neutral', 'Tide is coming in. You can tell without a calendar. Watch the third piling. When the green line goes under, the water has decided.'),
      choice([
        opt('Watch the piling with him.', [
          narrate('Four minutes of quiet. The green line vanishes. Mr. Finch nods once, a very small, very satisfied nod.'),
          say('mr_finch', 'happy', "Good. Most people look at their phones and miss the whole sea. Don't tell anyone I said 'good'."),
          friend('mr_finch', 6), setFlag('finch_tide_learned'),
        ]),
        opt('"How long have you sat here?"', [
          say('mr_finch', 'thinking', 'Since the bell stopped. Somebody should look at the town from the bottom of the hill. It looks different from up there. More honest.'),
          friend('mr_finch', 5), setFlag('finch_bench_story'),
        ]),
        opt('Pour him more tea.', [
          say('mr_finch', 'surprised', 'Hmph. Manners. They put those in boys these days?'),
          friend('mr_finch', 4),
        ]),
      ]),
      say('mr_finch', 'neutral', "Come back when the wind's from the east. It brings stories. I save the worst ones for company."),
      setFlag('finch_tea_shared'),
    ],
  }),
  ev({
    id: 'finch_02_gull_feud', title: 'The Admiral', kind: 'random', priority: 30, repeat: 'once',
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['10:00', '18:00'] },
    when: all({ seen: 'finch_01_tide_tea' }, { chance: 0.5 }, { weather: ['sunny', 'cloudy'] }),
    script: [
      ...open('town_harbor', 'door_cafe', [place('mr_finch', 'finch_spot', 'down'), place('theo', 'door_cafe', 'down'), music('funny')]),
      moveTo('theo', 'fish_stall'),
      narrate('Mr. Finch is standing very straight on the bench with his tea held up like a sword. A large grey gull stands on the railing, holding the old man\'s sandwich with great dignity.'),
      say('mr_finch', 'angry', "THAT, boy, is the Admiral. Third sandwich this week. Fourth if you count the pastry I don't talk about."),
      say('theo', 'surprised', 'You named him?'),
      say('mr_finch', 'neutral', "A man should know his enemies. It is less embarrassing than being robbed by a stranger."),
      choice([
        opt('Offer the gull some bread.', [
          iff({ item: ['bread', '>=', 1] }, [
            takeItem('bread', 1), sfx('eat'),
            narrate('The Admiral considers the bread, considers you, and trades the sandwich for the loaf in one smooth, shameless motion.'),
            say('mr_finch', 'surprised', '...You negotiated with a gull. That is more diplomacy than the school board has shown in years.'),
            friend('mr_finch', 7), setFlag('finch_gull_bargain'),
          ], [
            narrate('You have no bread. The Admiral looks at your empty hands with the pity of a creature who has seen better offers.'),
            say('mr_finch', 'smug', 'Nothing to bribe him with. Good. Principles.'),
            friend('mr_finch', 3),
          ]),
        ]),
        opt('Laugh. It was too funny.', [
          say('mr_finch', 'angry', 'Laugh, would you!'),
          narrate('He tries to stay angry for six seconds. It does not work.'),
          say('mr_finch', 'happy', 'Hmph. Fine. It is a little funny. Ask the Admiral.'),
          friend('mr_finch', 5), setFlag('finch_gull_laugh'),
        ]),
        opt('Chase the gull off.', [
          sfx('swoosh'),
          narrate('The Admiral rises like a very offended umbrella and leaves with the sandwich. You get a seagull feather and a sense of failure.'),
          friend('mr_finch', 3),
        ]),
      ]),
      setFlag('finch_gull_feud_done'),
    ],
  }),
  ev({
    id: 'finch_03_old_photograph', title: 'The Last Bell-Ringers',
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['15:30', '19:30'] },
    when: all({ year: [2, 3] }, { hearts: ['mr_finch', '>=', 3] }, { seen: 'finch_01_tide_tea' }, { notSeen: 'finch_03_old_photograph' }),
    script: [
      ...open('town_harbor', 'door_cafe', [place('mr_finch', 'finch_spot', 'down'), place('theo', 'door_cafe', 'down'), lightingSunset(), music('sad')]),
      moveTo('theo', 'dock_bench'),
      narrate('Mr. Finch has a photograph in his coat. It has been folded in four and unfolded more times than it can bear.'),
      say('mr_finch', 'neutral', "Last class that rang the bell together. Autumn, thirty years back. That's me, with hair. That's your aunt, with a hat she was told not to wear."),
      say('mr_finch', 'thinking', "That one at the back, very straight back, sharp chin. Hand on the rope like she was signing a contract. Never smiled in photographs. Rang it louder than any of us."),
      say('theo', 'thinking', 'Who is she?'),
      say('mr_finch', 'neutral', "A girl who wanted the bell to mean something. People change. The wish stays. That's the whole trouble with wishes."),
      choice([
        opt('"May I see it properly?"', [
          narrate('He lets you hold it, which is its own kind of medal. The edges are soft as cloth.'),
          say('mr_finch', 'happy', "Take care of it. And take care of your aunt. She'll say she doesn't need it. That's how you know."),
          friend('mr_finch', 6), setFlag('finch_photo_held'),
        ]),
        opt('"Why show me?"', [
          say('mr_finch', 'neutral', "Because somebody ought to know the bell belonged to more than one old man. Somebody young enough to climb the stairs when I can't."),
          friend('mr_finch', 7), setFlag('finch_photo_trust'),
        ]),
      ]),
      setFlag('finch_photo_seen'),
    ],
  }),
];

function lightingSunset() { return { op: 'lighting', preset: 'sunset' }; }
