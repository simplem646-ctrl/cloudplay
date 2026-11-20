// Main storyline, Year 2 (story workstream S1). Ids main_17 .. main_23.
// A new year, the archive, the lighthouse store and the crown fitting, the board letter,
// the Bell Festival fundraiser, and Finch pointing at the Rossi boat.

import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, pose, emote, cam, fade,
  lighting, sfx, music, setFlag, friend, stat, giveItem, quest, spirit, all, any, wait,
} from '../../sim/script_dsl.js';
import { open } from './fest_shared.js';

const story = (o) => ({ kind: 'story', priority: 80, repeat: 'once', skippable: true, ...o });
const Y2_FROM_SUMMER = any({ year: 3 }, all({ year: 2 }, { season: ['summer', 'autumn', 'winter'] }));

export default [
  story({
    id: 'main_17_year_two', title: 'Second Spring',
    trigger: { type: 'wake' },
    when: all({ year: 2 }, { season: 'spring' }, { day: [1, 7] }),
    priority: 90,
    script: [
      ...open('home_theo', 'bed', [place('theo', 'center', 'left'), place('roz', 'kitchen_table', 'right'), music('home_morning')]),
      say('roz', 'happy', 'Second year! Look at you. You have the look now. The "I know where the good bench is" look.'),
      say('theo', 'smug', 'Bench by the fountain. Shady after two. Nobody sits there because of the pigeon.'),
      say('roz', 'surprised', 'He knows about the pigeon! He is one of us!'),
      say('roz', 'neutral', 'New first-years today. A whole little crop of them, all elbows and new shoes.'),
      say('roz', 'thinking', 'Someone is going to look up to you this year. You know that, right? That is how this works.'),
      iff({ flag: 'main_core_found' }, [
        say('roz', 'smug', 'And that iron thing on your shelf. I dusted around it. Respectfully. Like a museum.'),
      ]),
      choice([
        opt('"I hope I\'m worth looking up to."', [
          say('roz', 'shy', "Kiddo. You moved across the world on your own and you still say thank you for toast. You'll do."),
          friend('roz', 4), setFlag('main_17_humble'),
        ]),
        opt('"Last year went fast. Too fast."', [
          say('roz', 'sad', 'They all do. That is the bad news. The good news is the next one does too, so you have to enjoy it on purpose.'),
          friend('roz', 3), setFlag('main_17_honest'),
        ]),
        opt('"I\'ll teach them about the pigeon."', [
          say('roz', 'happy', 'Pass down the sacred knowledge. That is what seniors are for. Well. Second-years. Junior seniors.'),
          friend('roz', 3), setFlag('main_17_pigeon'),
        ]),
      ]),
      say('roz', 'neutral', "Your parents called. They said, and I quote, 'Year two! Did he pack socks.' Some things never change."),
      think('Year two. The bell is still silent. But it has one more piece than it did a year ago.'),
    ],
  }),

  story({
    id: 'main_18_committee_y2', title: 'Bell Restoration Notes v1.0',
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['12:00', '18:30'] },
    when: all({ year: [2, 3] }, { seen: 'main_16_core_study' }),
    script: [
      ...open('school_rooftop', 'tower_door', [
        place('owen', 'tower_door', 'down'), place('clara', 'npc_1', 'right'), place('jules', 'npc_2', 'left'),
        place('dante', 'npc_3', 'up'), place('kit', 'npc_4', 'up'), place('mr_abel', 'fence_a', 'left'),
        place('theo', 'door', 'up'), music('rooftop'),
      ]),
      say('kit', 'happy', "Hartley-senpai! I joined the committee! I don't know what it does! I'm SO in!"),
      moveTo('theo', 'center'),
      say('jules', 'happy', 'New recruit. Kit. Enthusiasm: maximum. Coordination: under review.'),
      say('kit', 'surprised', 'I only fell down the stairs ONCE. Twice. The second one was a tactical roll.'),
      say('owen', 'neutral', 'Bell Restoration Notes, version one point zero. Now with a cover page. Clara insisted.'),
      say('clara', 'neutral', 'A document without a cover page is a rumour with margins.'),
      say('mr_abel', 'happy', 'And I am here because history teachers are drawn to old things like moths to a lamp. May I?'),
      moveTo('mr_abel', 'npc_5'),
      say('mr_abel', 'thinking', 'The storm year. The core went to Finch. And the crown fitting... went down the hill to be recast. And THEN...'),
      say('mr_abel', 'smug', '...nobody remembers. Delicious. A mystery. I will end the lesson here.'),
      say('jules', 'angry', 'Mr. Abel, you cannot cliffhanger the committee!'),
      say('clara', 'neutral', 'I wrote to the mayor about the archive. It is closed for renovation until summer.'),
      say('clara', 'thinking', 'His reply used the word "wonderful" eleven times. I counted. It was not wonderful.'),
      choice([
        opt('"Summer it is. We\'ll be ready."', [
          say('owen', 'neutral', 'I will prepare a search grid. Statistically, archives are 80 percent boxes labelled "misc".'),
          friend('owen', 3), setFlag('main_18_ready'),
        ]),
        opt('"Kit, welcome. Don\'t touch the chain."', [
          say('kit', 'happy', "Senpai gave me a rule! I'll guard it with my life! ...Which chain?"),
          emote('kit', 'question'),
          friend('kit', 4), setFlag('main_18_welcomed_kit'),
        ]),
        opt('"Mr. Abel, finish the story!"', [
          say('mr_abel', 'smug', 'And ruin the suspense? Never. Come to class. Tuesday. Bring snacks.'),
          friend('mr_abel', 4), stat('history', 2), setFlag('main_18_abel_tease'),
        ]),
      ]),
      quest('main_silent_bell', 'update', 'The crown fitting went down the hill to be recast after the storm. The town-hall archive opens again in summer.'),
    ],
  }),

  story({
    id: 'main_19_archive', title: 'Filed Under Misc',
    trigger: { type: 'enterMap', map: 'town_hall', time: ['09:00', '18:00'] },
    when: all({ seen: 'main_18_committee_y2' }, { noFlag: 'main_fitting_found' }, Y2_FROM_SUMMER),
    script: [
      ...open('town_hall', 'lobby', [
        place('mayor_greer', 'archive_door', 'down'), place('clara', 'npc_1', 'up'), place('owen', 'npc_2', 'up'),
        place('theo', 'door', 'up'), music('funny'),
      ]),
      say('mayor_greer', 'happy', 'The Bell Committee! Wonderful, wonderful! The archive is yours! It is newly renovated! Mostly!'),
      moveTo('theo', 'npc_3'),
      say('mayor_greer', 'neutral', 'Mind the third shelf. And the fourth. And the floor in general.'),
      fade('out', 400),
      narrate('Three hours later. Dust in the air like snow. Owen has built a fort of boxes. Clara has alphabetised the fort.'),
      fade('in', 500),
      say('owen', 'neutral', 'Box ninety-one. "Misc." Box ninety-two. "Misc, continued." Box ninety-three. "Miscellaneous, serious."'),
      say('clara', 'surprised', 'Hartley. Here. A repair ticket. Thirty years old.'),
      narrate('A brittle yellow card. "Bellhaven High bell: crown fitting removed for recasting. Held at the Harbor Light store until collected."'),
      narrate('Underneath, in faded pencil: "To be collected by the bell-keeper." The signature line is blank.'),
      sfx('page'),
      giveItem('old_letter'),
      say('owen', 'thinking', 'The lighthouse store. Nobody has opened that since the lighthouse went automatic.'),
      say('clara', 'thinking', 'The bell-keeper was Mr. Finch. So he was meant to collect it. And did not.'),
      choice([
        opt('"Maybe he couldn\'t. Let\'s ask him."', [
          say('clara', 'neutral', 'That is a generous reading of the evidence. ...I would like it to be true.'),
          friend('clara', 3), setFlag('main_19_generous'),
        ]),
        opt('"Clara, you\'re good at this."', [
          say('clara', 'shy', 'I... thank you. Filing is underrated. It is a form of caring about the future.'),
          friend('clara', 4), setFlag('main_19_praised_clara'),
        ]),
        opt('"Owen, you\'re living in a box fort."', [
          say('owen', 'neutral', 'It is load-bearing. I am not coming out until it is structurally necessary.'),
          friend('owen', 4), setFlag('main_19_box_fort'),
        ]),
      ]),
      say('mayor_greer', 'happy', 'Found something? Wonderful! The lighthouse store, you say? That is... also wonderful. Partly flooded. But wonderful.'),
      setFlag('main_archive_found'),
      quest('main_silent_bell', 'update', 'An old repair ticket: the crown fitting was left at the Harbor Light store, "to be collected by the bell-keeper". Ask Mr. Finch at the harbor.'),
    ],
  }),

  story({
    id: 'main_20_lighthouse', title: 'The Harbor Light Store',
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['09:00', '19:00'] },
    when: all({ seen: 'main_19_archive' }, { noFlag: 'main_fitting_found' }),
    script: [
      ...open('town_harbor', 'finch_spot', [
        place('mr_finch', 'finch_spot', 'down'), place('jules', 'npc_1', 'left'), place('dante', 'npc_2', 'left'),
        place('theo', 'npc_3', 'left'), music('town_summer'),
      ]),
      narrate('You hold out the yellow card. Mr. Finch reads it twice. Then he takes his cap off, which you have never seen him do.'),
      say('mr_finch', 'sad', '"To be collected by the bell-keeper." Yes. That was me.'),
      say('mr_finch', 'sad', "That winter my hands started to shake. Mornings, mostly. Can't climb a lighthouse ladder with hands like that."),
      say('mr_finch', 'sad', "Can't hang eight hundred kilos of bell either. So I told myself next year. Thirty times."),
      emote('mr_finch', 'dots'),
      choice([
        opt('"Then we\'ll climb. You tell us how."', [
          say('mr_finch', 'thinking', '...Hm. Young legs, old head. That is how it used to be done, you know. It is a good way.'),
          friend('mr_finch', 6), setFlag('main_20_young_legs'),
        ]),
        opt('"You kept the core safe. That counts."', [
          say('mr_finch', 'shy', "Don't. I will get dust in my eye. On purpose. To have an excuse."),
          friend('mr_finch', 6), setFlag('main_20_comforted'),
        ]),
        opt('"Jules, Dante: race you to the ladder."', [
          say('dante', 'happy', 'A RACE? Finally, the committee speaks my language!'),
          say('jules', 'surprised', 'Wait, I said I would carry the flashlight, not climb—'),
          friend('dante', 4), friend('jules', 2), setFlag('main_20_race'),
        ]),
      ]),
      fade('out', 600),
      music('tense'),
      narrate('The old lighthouse store smells of salt and rust. Water to the ankles. Dante insists the crab looked at him first.'),
      narrate('Behind a stack of rotten crates, a small one wrapped in tarred canvas. Stencilled on the side: BELL. DO NOT SELL.'),
      narrate('And under it, in pencil: "Back soon. F."'),
      fade('in', 600),
      music('town_summer'),
      say('jules', 'surprised', '"Back soon." Thirty years. That is the most Finch sentence ever written.'),
      say('mr_finch', 'neutral', 'Give it here. ...No. You hold it. You climbed for it.'),
      narrate('Bronze, green at the edges, four bolt holes that match the core exactly. The crown fitting.'),
      sfx('item'),
      giveItem('bell_clapper_fitting'),
      setFlag('main_fitting_found'),
      spirit(8),
      friend('jules', 2), friend('dante', 2),
      say('dante', 'smug', 'Two of three. Someone write a song about us. Someone who is not Jules.'),
      say('mr_finch', 'thinking', 'Two of three. And the third...'),
      say('mr_finch', 'neutral', 'Later. Go dry your socks. You smell like the harbor\'s opinion of you.'),
      quest('main_silent_bell', 'update', 'We found the crown fitting in the old lighthouse store! Two of three. Only the rope & strike plate are missing.'),
    ],
  }),

  story({
    id: 'main_21_board_letter', title: 'The Letter',
    trigger: { type: 'enterMap', map: 'school_hall_1f', time: ['08:00', '16:30'] },
    when: all({ noFlag: 'main_board_letter' }, any(all({ year: 2 }, { season: ['autumn', 'winter'] }), { year: 3 })),
    script: [
      ...open('school_hall_1f', 'board', [
        place('principal_marsh', 'board', 'down'), place('m_voss', 'npc_1', 'down'), place('clara', 'npc_2', 'left'),
        place('student_07', 'npc_3', 'up'), place('student_08', 'npc_4', 'up'), place('theo', 'door_front', 'right'), music('tense'),
      ]),
      narrate('A tall woman in a grey coat stands beside Principal Marsh at the notice board. She is holding an envelope as if it weighs exactly what it should.'),
      moveTo('theo', 'npc_5'),
      say('principal_marsh', 'neutral', 'Students. This is Mrs. Voss, the chair of the district school board. She has brought us a letter.'),
      say('m_voss', 'neutral', 'Good morning. I will be brief, because you have classes and I respect classes.'),
      say('m_voss', 'neutral', 'At the end of next year, the board will vote on merging Bellhaven High into the Harbor City campus.'),
      say('m_voss', 'neutral', 'Between now and then: a formal review. Enrolment, results, community. An inspection, next autumn.'),
      say('m_voss', 'neutral', 'I will be fair. I will also be thorough. Those are not opposites.'),
      emote('clara', 'sweat'),
      face('m_voss', 'clara'),
      say('m_voss', 'neutral', 'Clara.'),
      say('clara', 'neutral', 'Mother. ...Mrs. Voss.'),
      think('One word each. The temperature in the hallway drops two degrees.'),
      face('m_voss', 'theo'),
      say('m_voss', 'neutral', 'You are the Hartley boy. The Bell Committee. My daughter mentions you.'),
      say('clara', 'surprised', 'I— occasionally. In passing. In a list.'),
      choice([
        opt('"We\'ll show you what this school is."', [
          say('m_voss', 'neutral', 'Good. Show me in numbers, if you can. Numbers are the only thing a board can hear.'),
          friend('m_voss', 3), setFlag('main_21_challenge_voss'),
        ]),
        opt('"Why merge? What\'s the real reason?"', [
          say('m_voss', 'thinking', 'Money, Mr. Hartley. Teachers, buses, a roof that leaks over the gym. I do not enjoy it. I do it.'),
          friend('m_voss', 4), setFlag('main_21_asked_why'),
        ]),
        opt('"Clara mentions me? In a good list?"', [
          say('m_voss', 'smug', 'She has many lists.'),
          say('clara', 'shy', 'Hartley. Please be quiet. Forever.'),
          friend('clara', 2), friend('m_voss', 2), setFlag('main_21_list_joke'),
        ]),
      ]),
      say('m_voss', 'neutral', 'Good morning, Principal. Students.'),
      moveTo('m_voss', 'door_front'),
      say('principal_marsh', 'thinking', 'Well. The river does not stop for the rock, but it does go around it. Off to class, everyone.'),
      setFlag('main_board_letter'),
      quest('main_save_school', 'update', 'The board letter: a formal review, an inspection next autumn, and the vote at the end of Year 3 (Winter 22).'),
    ],
  }),

  story({
    id: 'main_22_fundraiser', title: 'Raise the Roof',
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['12:00', '18:30'] },
    when: all({ year: 2 }, { season: 'autumn' }, { day: [1, 26] }, { seen: 'main_21_board_letter' }),
    script: [
      ...open('school_rooftop', 'bench', [
        place('jules', 'bench', 'down'), place('clara', 'npc_1', 'down'), place('owen', 'npc_2', 'left'),
        place('kit', 'npc_3', 'up'), place('dante', 'npc_4', 'up'), place('theo', 'door', 'up'), music('rooftop'),
      ]),
      say('clara', 'neutral', 'The gym roof leaks. The board cited it. So: the Bell Festival will double as a fundraiser. For the roof.'),
      moveTo('theo', 'center'),
      say('jules', 'happy', 'Raise the Roof! That is the name. I am not taking questions. I already made a banner.'),
      say('owen', 'neutral', 'The banner leaks.'),
      say('kit', 'happy', "I could do a sponsored run! Up the hill! A hundred times! I'd need ninety-nine breaks!"),
      say('dante', 'smug', 'A concert. In the courtyard. Headliner: a mysterious, extremely talented striker who sings.'),
      say('clara', 'neutral', 'Or a harbor market: every shop in town runs a stall in our courtyard. The town comes up the hill.'),
      say('jules', 'neutral', 'Committee chair breaks the tie. That is you, by the way. We voted. You were in the bathroom.'),
      emote('theo', 'exclaim'),
      choice([
        opt('A courtyard concert', [
          say('dante', 'happy', 'YES. I will begin vocal warmups immediately.'),
          say('owen', 'neutral', 'Mr. Quill will handle the actual music. Dante will handle the tambourine. Briefly.'),
          friend('dante', 3), setFlag('main_y2_fund_concert'),
        ]),
        opt('A harbor market on the hill', [
          say('clara', 'happy', 'Excellent. I will write to every shop by Thursday. Mrs. Calder will say yes before I finish the letter.'),
          friend('clara', 3), setFlag('main_y2_fund_market'),
        ]),
        opt('Kit\'s sponsored hill run', [
          say('kit', 'happy', 'SENPAI. I won\'t let you down! I will let my legs down. But not you!'),
          say('jules', 'happy', 'I will commentate. Every lap. I have adjectives saved up.'),
          friend('kit', 4), friend('jules', 2), setFlag('main_y2_fund_run'),
        ]),
      ]),
      say('clara', 'neutral', 'Then it is decided. Raise the Roof. ...I cannot believe that is the name.'),
      spirit(2),
      setFlag('main_y2_fundraiser'),
      think('A school that can throw a party for its own roof. That has to count for something on a board report.'),
    ],
  }),

  story({
    id: 'main_23_finch_lesson', title: 'How to Hang a Bell',
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['10:00', '19:00'] },
    when: all({ flag: 'main_fitting_found' }, any(all({ year: 2 }, { season: 'winter' }), { year: 3 })),
    script: [
      ...open('town_harbor', 'finch_spot', [place('mr_finch', 'finch_spot', 'down'), place('theo', 'npc_1', 'left'), music('town_winter')]),
      say('mr_finch', 'neutral', 'You. Sit. Lesson. No questions until the end. Like that astronomy boy.'),
      pose('theo', 'sit'),
      say('mr_finch', 'neutral', 'Core bolts to the fitting. Fitting hangs from the crown staple. Clapper swings. Strikes the lip. Bong.'),
      say('mr_finch', 'neutral', 'But a clapper alone is a hammer in a cupboard. You need the rope, through the floor, to a person.'),
      say('mr_finch', 'thinking', 'And a strike plate at the stay, so the bell does not swing over and take your arms with it.'),
      say('theo', 'thinking', 'Where did the rope go? The committee thinks the tower key went with it.'),
      say('mr_finch', 'smug', 'The key went with it because I tied the key TO it. So nobody would lose one without the other. Clever. Thirty years ago.'),
      say('mr_finch', 'neutral', 'Rope was salt-rotted at the splice. So it went to the best splicer on the harbor. Old Sal Rossi.'),
      say('theo', 'surprised', 'Rossi? As in Dante Rossi?'),
      say('mr_finch', 'neutral', "His grandfather. Sal died some years back. Rope, key, plate: all went to the family boat, I'd wager. Fishermen keep everything."),
      say('mr_finch', 'thinking', 'Boat fishes the far banks all spring. Back in summer.'),
      choice([
        opt('"Thank you for teaching me this."', [
          say('mr_finch', 'shy', 'Hmph. Somebody had to. I am not getting younger. Neither is the bell, but it is better at it.'),
          friend('mr_finch', 5), setFlag('main_23_thanked'),
        ]),
        opt('"Will you climb the tower with us?"', [
          say('mr_finch', 'thinking', 'With these hands? ...Ask me when there is a rope. A man needs something to hold.'),
          friend('mr_finch', 4), setFlag('main_23_asked_climb'),
        ]),
        opt('"Clever. Thirty years ago."', [
          say('mr_finch', 'smug', 'Still clever. Just slower. Like a good clock.'),
          friend('mr_finch', 4), setFlag('main_23_clever'),
        ]),
      ]),
      stat('science', 1),
      setFlag('main_rope_lead'),
      quest('main_silent_bell', 'update', "The rope, the strike plate and the tower key went to the Rossi family's boat. It returns from the far banks in summer."),
      think('Dante. Of course. Dante is going to be insufferable about this.'),
    ],
  }),
];
