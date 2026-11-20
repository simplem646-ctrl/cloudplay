// Main storyline, Year 3 (story workstream S1). Ids main_24 .. main_33.
// Eleven first-years, the Rossi rope, the restoration, the inspection, the Board Decision,
// the last rooftop, and the Bell Night finale (which ends with endGame()).

import {
  say, narrate, think, choice, opt, iff, warp, place, moveTo, face, pose, emote, cam, fade,
  flash, lighting, sfx, music, banner, setFlag, friend, stat, giveItem, quest, spirit,
  all, any, not, wait, endGame,
} from '../../sim/script_dsl.js';
import { open } from './fest_shared.js';

const story = (o) => ({ kind: 'story', priority: 80, repeat: 'once', skippable: true, ...o });
const BELL_NIGHT_Y3 = all({ year: 3 }, { season: 'winter' }, { day: 28 });

// ---------------------------------------------------------------- finale building blocks
const ringFlag = (who) => setFlag(`main_bell_rung_with_${who}`);

const RING_EVERYONE = [
  narrate('You lean over the rail and shout down into the yard. "Everyone! On three, everyone pulls!"'),
  narrate('The rope goes down the stairwell, out the tower door, across the roof, and down the fire stairs into the crowd. A hundred hands find it.'),
  ringFlag('everyone'),
];

const partnerRing = (id, name, line, reply) => iff({ partner: id }, [
  say(id, 'shy', line),
  choice([
    opt(`Ring it with ${name}`, [
      face('theo', id), face(id, 'theo'),
      say(id, 'happy', reply),
      emote(id, 'heart'), friend(id, 5),
      ringFlag(id),
    ]),
    opt('Ring it with everyone', [
      say(id, 'happy', 'Everyone? ...Yes. That is so you. Come here. Stand next to me while they pull.'),
      ...RING_EVERYONE,
    ]),
  ]),
]);

const PARTNER_OR_FRIENDS = [
  partnerRing('nina', 'Nina', 'Hey. Theo. Last lap. You and me?', "Ready, set... no, wait. Slow. I want to remember this one."),
  partnerRing('elise', 'Elise', "...I wrote this moment a hundred times. I never once got the ending right. Will you... help me with it?", "Then... this is the last line. Together."),
  partnerRing('clara', 'Clara', 'Theo. I have no plan for this part. None at all. It is wonderful.', "On the count of three. ...I am not counting. Just pull with me."),
  partnerRing('mari', 'Mari', 'Teo. Paint the sky with me? Okay, ring the sky. Same thing. Mostly.', "Ay, my heart is so loud. Ring it before it does."),
  partnerRing('vera', 'Vera', "...Midnight. One note. Don't make it weird. Make it with me.", 'Downbeat on midnight. I will count you in. Quietly.'),
  iff({ partner: null }, [
    think('Ring it with someone dear. The legend never said it had to be only one someone.'),
    choice([
      opt('Ring it with Jules', [
        say('jules', 'surprised', 'Me? ME? Hartley-dude. Hartley-DUDE. Okay. Okay. I am not crying, I am broadcasting.'),
        friend('jules', 5), ringFlag('jules'),
      ]),
      opt('Ring it with Mr. Finch', [
        say('mr_finch', 'surprised', '...Me. These hands.'),
        say('theo', 'happy', 'Your hands, my hands. It needs both. You said so.'),
        say('mr_finch', 'sad', 'Hmph. Did I. ...Hold the rope steady, boy.'),
        friend('mr_finch', 5), ringFlag('mr_finch'),
      ]),
      opt('Ring it with Aunt Roz', [
        say('roz', 'surprised', "Me?! I came up here for the cocoa! ...Oh, kiddo. Oh, you're going to make me cry on a historical monument."),
        friend('roz', 5), ringFlag('roz'),
      ]),
      opt('Ring it with everyone', RING_EVERYONE),
    ]),
  ]),
];

// Pieces the player somehow never collected arrive on the night, so the finale can never lock.
const LAST_MINUTE_RESTORATION = iff({ noFlag: 'main_bell_restored' }, [
  narrate('The bell still hangs empty. For a long second nobody moves.'),
  iff({ noFlag: 'main_core_found' }, [
    narrate('Then Mr. Finch pushes through the crowd with a parcel in oilcloth. "Kept it oiled. For thirty years. Just in case somebody asked."'),
    giveItem('bell_clapper_core'), setFlag('main_core_found'),
  ]),
  iff({ noFlag: 'main_fitting_found' }, [
    narrate('Owen arrives at a run, holding a bronze crown fitting. "Lighthouse store. Pencil note. Very Finch. I will explain later. Statistically."'),
    giveItem('bell_clapper_fitting'), setFlag('main_fitting_found'),
  ]),
  iff({ noFlag: 'main_rope_found' }, [
    narrate('Dante shoulders a coil of old hemp rope with a brass key tied to it. "My family\'s lucky mooring line. It was always yours. Take it."'),
    giveItem('bell_clapper_rope'), setFlag('main_rope_found'),
  ]),
  narrate('Lanterns go up the stairwell hand to hand. Bolts, a crown staple, a rope through the floor. Mr. Finch talks you through every turn.'),
  setFlag('main_bell_restored'),
]);

const FINALE = [
  fade('out', 800),
  warp('school_grounds', 'courtyard'),
  place('mr_finch', 'courtyard', 'up'), place('roz', 'npc_1', 'up'), place('jules', 'npc_2', 'up'),
  place('dante', 'npc_3', 'up'), place('owen', 'npc_4', 'up'), place('kit', 'npc_5', 'up'),
  place('principal_marsh', 'stage', 'down'), place('mayor_greer', 'npc_6', 'up'), place('m_voss', 'bench_1', 'up'),
  place('townie_01', 'stall_a', 'up'), place('townie_02', 'stall_b', 'up'), place('townie_04', 'stall_c', 'up'),
  place('student_09', 'stall_d', 'up'), place('theo', 'gate', 'up'),
  lighting('lantern'), music('festival'),
  fade('in', 1200),
  narrate('Lantern Hill, a quarter to midnight. The whole town is here: in coats, in scarves, holding cocoa, holding hands, holding their breath.'),
  moveTo('theo', 'npc_6'),
  iff({ flag: 'main_vote_saved' }, [
    say('principal_marsh', 'happy', 'Bellhaven High is staying. And tonight, so is the bell. Thirty years is a long breath. Let us let it out.'),
  ], [
    say('principal_marsh', 'sad', 'In the autumn we join Harbor City. Tonight we are still Bellhaven High. Tonight, we ring our bell.'),
  ]),
  say('mr_finch', 'neutral', 'Well? Don\'t stand there. Up you go. Bring the people you want beside you.'),
  fade('out', 600),
  warp('bell_tower', 'base'),
  place('theo', 'base', 'up'), place('mr_finch', 'stairs_mid', 'up'),
  lighting('lantern'), music('romantic'),
  fade('in', 800),
  moveTo('theo', 'stairs_mid'),
  moveTo('mr_finch', 'top'),
  moveTo('theo', 'top'),
  cam({ focus: 'bell', ms: 1200 }),
  LAST_MINUTE_RESTORATION,
  narrate('The great bell above you: dark bronze, the clapper hanging quiet inside it like a held word. Through the slats, the whole harbor glitters.'),
  say('mr_finch', 'neutral', 'Rope is yours. Pull, then let it go. The bell does the rest. Bells always do the rest.'),
  ...PARTNER_OR_FRIENDS,
  narrate('Down in the yard, the town begins to count. Ten. Nine. Eight.'),
  think("The legend says to share a wish. I don't say mine out loud. I don't need to."),
  narrate('Three. Two. One.'),
  music(null),
  flash(400, '#fff6d8'),
  sfx('bell_tower'),
  cam({ shake: { amp: 2, ms: 900 } }),
  wait(1400),
  sfx('bell_tower'),
  wait(1400),
  sfx('bell_tower'),
  narrate('BONG. The sound rolls down Lantern Hill, over Bell Square, across the harbor, out to the boats, and comes back as cheering.'),
  sfx('cheer'),
  music('ending_good'),
  say('mr_finch', 'sad', '...There you are, old girl. There you are.'),
  emote('mr_finch', 'heart'),
  iff({ flag: 'main_vote_saved' }, [
    narrate('Somewhere below, Mrs. Voss is applauding. Neatly. With tears she will later deny.'),
  ], [
    narrate('Somewhere below, Mrs. Voss stands very still and listens to the whole thing, as if memorising a number she will not need to write down.'),
  ]),
  think('Three years ago I did not know this town existed. Now it rings.'),
  setFlag('main_bell_rung'),
  quest('main_silent_bell', 'complete', 'On Bell Night, at midnight, the Bellhaven bell rang for the first time in thirty-three years.'),
  fade('out', 2000),
  banner('Bellhaven Days', 'Bell Night, Year 3', 3500),
  endGame(),
];

export default [
  story({
    id: 'main_24_year_three', title: 'The Last First Day',
    trigger: { type: 'wake' },
    when: all({ year: 3 }, { season: 'spring' }, { day: [1, 7] }),
    priority: 90,
    script: [
      ...open('home_theo', 'bed', [place('theo', 'center', 'left'), place('roz', 'kitchen_table', 'right'), music('home_morning')]),
      say('roz', 'happy', "Third year! Final year! I made the pancakes in the shape of a three. It looks like a seagull. Eat the seagull."),
      say('theo', 'happy', 'Morning, Aunt Roz. It is a very good seagull.'),
      say('roz', 'sad', "Your last first day. I'm not going to cry. I'm going to make a very loud coffee instead."),
      sfx('pour'),
      say('roz', 'thinking', 'I hear they only have a handful of new first-years this year. Mrs. Calder heard it from Rosa who heard it from the mayor.'),
      say('roz', 'neutral', "Which means everybody heard it from the mayor. That man can't keep a secret in a locked box."),
      choice([
        opt('"Then this year has to count."', [
          say('roz', 'happy', "That's my nephew. Go make it count. And eat lunch while you do; history is made on a full stomach."),
          friend('roz', 3), setFlag('main_24_resolve'),
        ]),
        opt('"I\'m going to miss this kitchen."', [
          say('roz', 'shy', "Oh, don't. ...The kitchen isn't going anywhere. Neither am I. Neither, I suspect, are you, entirely."),
          friend('roz', 5), setFlag('main_24_miss_kitchen'),
        ]),
        opt('"Is the seagull load-bearing?"', [
          say('roz', 'smug', 'Structurally essential. Take it out and the whole breakfast collapses.'),
          friend('roz', 3), setFlag('main_24_seagull'),
        ]),
      ]),
      think('Year three. The vote at the end of winter. Bell Night after that. Everything has a date now.'),
    ],
  }),

  story({
    id: 'main_25_eleven', title: 'Eleven',
    trigger: { type: 'enterMap', map: 'school_classroom', time: ['08:00', '16:00'] },
    when: { year: 3 },
    script: [
      ...open('school_classroom', 'door', [
        place('principal_marsh', 'teacher_desk', 'down'), place('ms_delaney', 'board', 'down'),
        place('clara', 'seat_clara', 'up'), place('jules', 'seat_jules', 'up'), place('dante', 'seat_dante', 'up'),
        place('owen', 'seat_owen', 'up'), place('nina', 'seat_nina', 'up'), place('theo', 'seat_theo', 'up'),
        pose('theo', 'sit'), music('sad'),
      ]),
      say('principal_marsh', 'neutral', 'Good morning, Class B. I will not keep you. I wanted you to hear a number from me.'),
      say('principal_marsh', 'sad', 'Eleven. Eleven new students this spring. Last year there were twenty-six.'),
      say('ms_delaney', 'neutral', 'Eleven very good ones. One of them already corrected my spelling. I may adopt her.'),
      say('principal_marsh', 'neutral', 'The board will notice the number. So I would like the board to notice other things as well.'),
      say('principal_marsh', 'thinking', 'A school is not its headcount. It is its heartbeat. Let us make it a loud one.'),
      moveTo('principal_marsh', 'door'),
      emote('clara', 'dots'),
      say('owen', 'neutral', 'Eleven. Statistically, that is the lowest intake since the school opened. I checked. I wish I had not.'),
      say('jules', 'sad', 'So the bell has to ring this year. Not "someday". This year.'),
      iff({ noFlag: 'main_rope_lead' }, [
        say('owen', 'neutral', 'We still lack the rope and the strike plate. And the tower key, which is with the rope. Somewhere.'),
        say('dante', 'surprised', "...Hold on. An old bell rope, with a key tied to it? My father has one on the boat. He calls it his lucky mooring line."),
        setFlag('main_rope_lead'),
      ], [
        say('dante', 'smug', 'And the rope is on my family\'s boat. As revealed by Finch. To Theo. Who told everyone. Correctly.'),
      ]),
      say('dante', 'neutral', 'The boat is back in summer. When it docks, that rope comes up this hill. I will carry it in my teeth if I must.'),
      choice([
        opt('"We\'ve got this. All of us."', [
          say('nina', 'happy', "Yeah! This is the final lap, team. Nobody slows down on the final lap!"),
          friend('nina', 2), friend('jules', 2), friend('dante', 2), setFlag('main_25_rally'),
        ]),
        opt('"Clara, are you okay?"', [
          say('clara', 'neutral', 'I am... fine. My mother will read that number aloud at the meeting. In her clear voice.'),
          say('clara', 'sad', 'She reads everything clearly. Even the things that should be said quietly.'),
          friend('clara', 4), setFlag('main_25_checked_clara'),
        ]),
        opt('"Dante. Please don\'t use your teeth."', [
          say('dante', 'smug', 'My teeth are my most underrated muscles.'),
          say('owen', 'neutral', 'Teeth are not muscles.'),
          say('dante', 'angry', 'Not with THAT attitude.'),
          friend('dante', 3), friend('owen', 2), setFlag('main_25_teeth'),
        ]),
      ]),
      quest('main_silent_bell', 'update', "Last piece: the rope & strike plate (and the tower key), on the Rossi family's boat. It returns to the harbor in summer."),
      quest('main_save_school', 'update', 'Only eleven new students this year. The vote is on Winter 22. Every bit of Spirit counts now.'),
    ],
  }),

  story({
    id: 'main_26_rope', title: 'The Lucky Mooring Line',
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['07:00', '19:30'] },
    when: all({ year: 3 }, { season: ['summer', 'autumn', 'winter'] }, { seen: 'main_25_eleven' }, { noFlag: 'main_rope_found' }),
    script: [
      ...open('town_harbor', 'dock_end', [
        place('dante', 'dock_end', 'down'), place('mr_finch', 'dock_bench', 'right'), place('theo', 'npc_1', 'down'), music('town_summer'),
      ]),
      narrate('A blue fishing boat bumps the dock, gulls arguing over its stern. Dante is waving with both arms like he is landing a plane.'),
      say('dante', 'happy', 'THEO! She is back! The Santa Lucia! And Papà says the rope is ours if we can untie it from his heart!'),
      moveTo('theo', 'npc_2'),
      say('unknown', 'happy', 'Thirty years that rope held my boat in every storm. My father said it came from a bell. I thought he was being poetic.', { name: 'Mr. Rossi' }),
      say('unknown', 'neutral', 'Turns out he was being literal. Rossi men are rarely poetic. Except this one. This one sings in the shower.', { name: 'Mr. Rossi' }),
      say('dante', 'angry', 'PAPÀ.'),
      narrate('A long coil of old hemp rope, tarred and re-spliced, a small brass key knotted into its end. Wrapped beside it: an iron strike plate.'),
      say('mr_finch', 'surprised', 'Sal kept the splice. Look at that. Sailor\'s eye splice. Better than new.'),
      narrate('Mr. Rossi lays the coil across Dante\'s arms. Dante, for once, has nothing to say. Then he turns and puts it in yours.'),
      say('dante', 'neutral', 'You carry it. You started this. I just... want to be standing next to you when it rings.'),
      sfx('item'),
      giveItem('bell_clapper_rope'),
      setFlag('main_rope_found'),
      spirit(8),
      choice([
        opt('"We carry it together."', [
          say('dante', 'happy', "...Yeah. Yeah! Together! Like a heroic statue! A heavy heroic statue!"),
          friend('dante', 6), setFlag('main_26_together'),
        ]),
        opt('"Thank you, Mr. Rossi. Really."', [
          say('unknown', 'happy', 'Thank the bell. And make it loud, so I can hear it from the far banks.', { name: 'Mr. Rossi' }),
          friend('dante', 4), setFlag('main_26_thanked_rossi'),
        ]),
        opt('"Dante sings in the shower?"', [
          say('dante', 'angry', 'ONE TIME. It was an OPERA. The acoustics demanded it!'),
          say('mr_finch', 'smug', 'Ha. Heard it from the dock.'),
          friend('dante', 4), friend('mr_finch', 2), setFlag('main_26_shower_opera'),
        ]),
      ]),
      say('mr_finch', 'neutral', 'Three of three. The tower door will open now. Do it properly. I will come. Slowly. But I will come.'),
      quest('main_silent_bell', 'update', 'We have the rope, the strike plate and the tower key! The tower door on the rooftop will open now.'),
    ],
  }),

  story({
    id: 'main_27_restoration', title: 'Into the Tower',
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['09:00', '19:30'] },
    when: all({ flag: 'main_core_found' }, { flag: 'main_fitting_found' }, { flag: 'main_rope_found' }, { noFlag: 'main_bell_restored' }),
    script: [
      ...open('school_rooftop', 'tower_door', [
        place('mr_finch', 'tower_door', 'down'), place('owen', 'npc_1', 'up'), place('jules', 'npc_2', 'up'),
        place('dante', 'npc_3', 'up'), place('clara', 'npc_4', 'up'), place('kit', 'npc_5', 'up'),
        place('biscuit', 'cat_spot', 'down'), place('theo', 'door', 'up'), music('tense'),
      ]),
      say('jules', 'happy', 'Everybody\'s here! Even Finch climbed the stairs! He only stopped to complain eleven times!'),
      say('mr_finch', 'angry', 'Twelve. You missed one.'),
      moveTo('theo', 'tower_door'),
      narrate('The brass key, thirty years in a sailor\'s knot, turns in the padlock as if it never left. The chain slides to the floor.'),
      sfx('door_open'),
      fade('out', 600),
      warp('bell_tower', 'base'),
      place('theo', 'base', 'up'), place('mr_finch', 'stairs_mid', 'up'), place('owen', 'npc_1', 'up'), place('dante', 'npc_2', 'up'),
      lighting('indoor'),
      fade('in', 700),
      narrate('Stone stairs, dust in the light. Pigeon feathers. Someone\'s initials carved in 1974.'),
      moveTo('theo', 'stairs_mid'), moveTo('mr_finch', 'top'), moveTo('theo', 'top'),
      cam({ focus: 'bell', ms: 1000 }),
      narrate('And there it is. The bell, close enough to touch. Dark bronze, green at the lip, enormous and quiet.'),
      say('mr_finch', 'sad', 'Hello, old girl.'),
      say('mr_finch', 'neutral', 'Core to fitting. Four bolts. Then the fitting onto the crown staple. I will tell you. My hands will not.'),
      narrate('His hands are shaking. Not much. Enough.'),
      choice([
        opt('Put your hands over his and steady them', [
          narrate('You fit the bolts together, his hands under yours. He tells you every turn. The last bolt seats with a soft, perfect click.'),
          say('mr_finch', 'shy', '...Thank you. Don\'t tell anyone I said that.'),
          friend('mr_finch', 6), setFlag('main_27_steadied'),
        ]),
        opt('Ask him to guide you, and do it yourself', [
          narrate('He talks you through it, slow and gruff. Owen holds the lantern. Dante holds his breath. Every bolt seats true.'),
          say('mr_finch', 'smug', 'Good hands. Bad posture. Good hands.'),
          friend('mr_finch', 5), stat('science', 2), setFlag('main_27_guided'),
        ]),
        opt('"Teamwork. Owen, wrench. Dante, cheering."', [
          say('dante', 'happy', 'GO THEO GO THEO—'),
          say('owen', 'neutral', 'Ten-millimetre. Clockwise. Statistically, righty-tighty.'),
          narrate('It is loud, it is chaotic, it works. Mr. Finch pretends to be annoyed for the whole thing.'),
          friend('dante', 3), friend('owen', 3), friend('mr_finch', 4), setFlag('main_27_team'),
        ]),
      ]),
      narrate('The clapper hangs inside the bell again. The rope drops through the floor, coiled at the base. Owen checks the strike plate twice.'),
      say('owen', 'neutral', 'Everything is in tolerance. We could ring it now. Theoretically.'),
      say('mr_finch', 'neutral', 'No. A bell\'s first word in thirty years is not a test. You save it.'),
      say('mr_finch', 'thinking', 'Bell Night. Midnight. Like the legend. With the whole town listening. Then it means something.'),
      narrate('Owen ties the rope off with a careful, slightly over-engineered knot. The bell is whole. And still, for now, silent.'),
      setFlag('main_bell_restored'),
      spirit(4),
      quest('main_silent_bell', 'update', 'The bell is restored! It will ring for the first time at midnight on Bell Night (Winter 28, Year 3).'),
      think('Whole, and quiet, and waiting. Like everyone in this town, a little.'),
    ],
  }),

  story({
    id: 'main_28_inspection', title: 'The Inspection',
    trigger: { type: 'enterMap', map: 'school_grounds', time: ['08:00', '16:30'] },
    when: all({ year: 3 }, any(all({ season: 'autumn' }, { day: [1, 26] }), all({ season: 'winter' }, { day: [1, 21] }))),
    script: [
      ...open('school_grounds', 'courtyard', [
        place('m_voss', 'fountain', 'down'), place('principal_marsh', 'npc_1', 'down'), place('clara', 'npc_2', 'up'),
        place('student_10', 'bench_1', 'down'), place('student_11', 'bench_2', 'down'), place('theo', 'gate', 'up'), music('tense'),
      ]),
      narrate('Mrs. Voss stands at the fountain with a clipboard and a pen she has not uncapped. The inspection.'),
      say('m_voss', 'neutral', 'Mr. Hartley. Principal Marsh tells me I should speak to a student she did not choose. She then chose you. Walk with me.'),
      moveTo('theo', 'npc_3'),
      moveTo('m_voss', 'tree_shade'), moveTo('theo', 'npc_4'),
      say('m_voss', 'neutral', 'I have the numbers. Enrolment. Results. A gym roof that sounds like a drum kit in the rain.'),
      iff({ flag: 'main_bell_restored' }, [
        say('m_voss', 'thinking', 'And I hear the bell has a clapper again. Thirty years. Remarkable. Numbers do not usually do that.'),
      ], [
        say('m_voss', 'thinking', 'And a bell that does not ring. Charming. Not, I am afraid, a line item.'),
      ]),
      say('m_voss', 'neutral', 'One question, then, and answer it honestly. What is this school for?'),
      choice([
        opt('"For people who\'d be lost anywhere else."', [
          say('m_voss', 'thinking', '...That is not a number. It is, however, a reason. I will write it down.'),
          friend('m_voss', 5), setFlag('main_inspection_kind'),
        ]),
        opt('"For the town. It\'s the town\'s heartbeat."', [
          say('m_voss', 'neutral', 'Heartbeats can be measured. Festivals, attendance, volunteers. Thank you. That I can count.'),
          friend('m_voss', 4), setFlag('main_inspection_honest'),
        ]),
        opt('"Teaching Clara to use contractions."', [
          say('clara', 'surprised', 'Hartley!'),
          say('m_voss', 'smug', '...Has it worked?'),
          say('clara', 'shy', 'It has not. ...It has, a little.'),
          friend('m_voss', 3), friend('clara', 3), setFlag('main_inspection_playful'),
        ]),
      ]),
      narrate('For a moment Mrs. Voss looks up at the bell tower. Then she uncaps the pen and writes one line, small and neat.'),
      say('m_voss', 'neutral', 'Thank you, Mr. Hartley. The board meets on the twenty-second of winter. In the town hall. It is open to the public.'),
      say('m_voss', 'neutral', 'I would bring the public.'),
      moveTo('m_voss', 'gate'),
      spirit(3),
      setFlag('main_inspection_done'),
      quest('main_save_school', 'update', 'Mrs. Voss inspected the school. The board meets on Winter 22 at the town hall, open to the public. Bring the town.'),
    ],
  }),

  story({
    id: 'main_29_board_meeting', title: 'The Board Meets',
    trigger: { type: 'auto', time: ['15:30', '23:30'] },
    when: all({ year: 3 }, { season: 'winter' }, { day: [22, 25] }, { noFlag: 'main_board_speeches_done' }),
    priority: 85, skippable: false,
    script: [
      fade('out', 600),
      banner('The Board Decision', 'Winter 22 · Bellhaven Town Hall', 2500),
      warp('town_hall', 'lobby'),
      place('m_voss', 'stage', 'down'), place('principal_marsh', 'npc_1', 'up'), place('mayor_greer', 'npc_2', 'up'),
      place('mr_finch', 'npc_3', 'up'), place('roz', 'npc_4', 'up'), place('clara', 'npc_5', 'up'), place('jules', 'npc_6', 'up'),
      place('townie_01', 'notice_board', 'up'), place('townie_05', 'clock', 'up'), place('theo', 'lobby', 'up'),
      music('tense'),
      fade('in', 800),
      narrate('Every chair is taken. People stand along the walls, in the doorway, out on the steps. Mrs. Calder brought rolls. Of course she did.'),
      say('m_voss', 'neutral', 'This is a public meeting of the district school board. The motion: to merge Bellhaven High into the Harbor City campus.'),
      say('m_voss', 'neutral', 'Before we vote, the floor is open. Briefly, please. Briefly is a kindness.'),
      say('mayor_greer', 'happy', 'Wonderful! Wonderful turnout! Truly— I had a speech. It was about... it was a good speech. I love this school. That was the speech.'),
      say('principal_marsh', 'neutral', 'Thirty-one years I have walked up that hill. A school is not a building. It is the people who walk up the hill.'),
      say('mr_finch', 'neutral', 'I kept the bell forty years. Kids gave it back its voice. That is all. I am sitting down. My knees.'),
      say('m_voss', 'neutral', 'Mr. Hartley. You chaired the Bell Committee. The board would hear from you.'),
      moveTo('theo', 'center'),
      think('A whole town looking at me. Say something true.'),
      choice([
        opt('Thank everyone who showed up', [
          say('theo', 'neutral', 'I came here not knowing anyone. Everyone in this room fed me, taught me, or yelled at me about a bell.'),
          say('theo', 'happy', "Whatever you vote, thank you. You're why it was worth trying."),
          setFlag('main_speech_kind'),
        ]),
        opt('Tell the truth about the numbers', [
          say('theo', 'neutral', "Our numbers are small. I won't pretend they aren't. But they are names. We know every one of them."),
          say('theo', 'neutral', 'A bigger school would teach us. This one noticed us. That is the difference.'),
          setFlag('main_speech_honest'),
        ]),
        opt('Make them laugh, then make the point', [
          say('theo', 'smug', "Our gym roof leaks. Our cafeteria has a pigeon. Our bell took thirty years to say one word."),
          say('theo', 'happy', "And this whole town still climbed a hill for it. You can't merge that onto a bus."),
          setFlag('main_speech_playful'),
        ]),
      ]),
      sfx('clap'),
      narrate('Applause, starting in the back with Aunt Roz and spreading like a rumour.'),
      say('m_voss', 'neutral', 'Thank you. The board will now deliberate. Ten minutes. Please do not eat all the rolls.'),
      setFlag('main_board_speeches_done'),
      quest('main_save_school', 'update', 'The board meeting is under way. The speeches are done. Now, the vote.'),
    ],
  }),

  story({
    id: 'main_30_board_vote', title: 'The Vote',
    trigger: { type: 'auto' },
    when: all({ flag: 'main_board_speeches_done' }, { noFlag: 'main_vote_saved' }, { noFlag: 'main_vote_merged' }),
    priority: 55, skippable: false,
    script: [
      fade('out', 500),
      warp('town_hall', 'lobby'),
      place('m_voss', 'stage', 'down'), place('principal_marsh', 'npc_1', 'up'), place('clara', 'npc_5', 'up'),
      place('roz', 'npc_4', 'up'), place('mr_finch', 'npc_3', 'up'), place('jules', 'npc_6', 'up'), place('theo', 'center', 'up'),
      music(null),
      fade('in', 700),
      narrate('Ten minutes is a very long time. Jules chews a pencil to splinters. Aunt Roz holds your sleeve and pretends she isn\'t.'),
      cam({ focus: 'm_voss', ms: 900 }),
      say('m_voss', 'neutral', 'The board has voted.'),
      wait(800),
      iff({ spirit: ['>=', 60] }, [
        say('m_voss', 'neutral', 'The motion to merge Bellhaven High into the Harbor City campus is... not carried.'),
        sfx('cheer'), flash(250, '#ffffff'), music('ending_good'),
        narrate('The room explodes. Mrs. Calder throws a roll in the air. Mr. Finch says "Ha!" so loud the mayor drops his notes.'),
        say('m_voss', 'thinking', 'The board has seen participation, results, and a community that turned up. Numbers. Good ones.'),
        say('m_voss', 'shy', 'And, unofficially... a bell. Bellhaven High remains open. Congratulations.'),
        emote('clara', 'heart'),
        say('principal_marsh', 'happy', 'Thank you. All of you. You heard the bell before it rang.'),
        setFlag('main_vote_saved'),
        quest('main_save_school', 'complete', 'The board voted. Bellhaven High stays open. The town showed up.'),
      ], [
        say('m_voss', 'sad', 'The motion to merge Bellhaven High into the Harbor City campus is carried. The merger takes effect next autumn.'),
        music('sad'),
        narrate('Nobody makes a sound. Then, from the back, Aunt Roz starts clapping anyway. Slowly, then not slowly. Then everybody.'),
        say('m_voss', 'neutral', 'The board also votes, unanimously, on one further motion.'),
        say('m_voss', 'thinking', 'The Bellhaven bell stays on Lantern Hill. And it rings on Bell Night, every year, for whoever comes.'),
        say('principal_marsh', 'sad', 'Then we will make every day until autumn worth remembering. Schools end. What they made does not.'),
        setFlag('main_vote_merged'),
        quest('main_save_school', 'complete', 'The board voted to merge. The school will join Harbor City, but the bell stays on Lantern Hill. Bellhaven goes on.'),
      ]),
      cam({ reset: true, ms: 600 }),
      face('theo', 'roz'),
      say('roz', 'happy', 'Whatever happened in there, kiddo, you did it right. Come on. Cocoa. On the house. The house is me.'),
    ],
  }),

  story({
    id: 'main_31_last_rooftop', title: 'The Last Meeting',
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['10:00', '21:00'] },
    when: all({ year: 3 }, { season: 'winter' }, { day: [26, 28] }),
    script: [
      ...open('school_rooftop', 'fence_a', [
        place('jules', 'fence_a', 'up'), place('dante', 'fence_b', 'up'), place('owen', 'bench', 'down'),
        place('kit', 'npc_1', 'up'), place('biscuit', 'cat_spot', 'down'), place('theo', 'door', 'up'),
        lighting('sunset'), music('rooftop'),
      ]),
      say('jules', 'happy', 'Last official meeting of the Bell Committee! Agenda item one: crying. Agenda item two: also crying.'),
      moveTo('theo', 'center'),
      say('owen', 'neutral', 'Three years. Four hundred and six committee meetings. Statistically, the most productive group in school history.'),
      say('owen', 'neutral', 'Also the only one with a cat member.'),
      emote('biscuit', 'note'),
      say('dante', 'neutral', "I'm going to say something nice and then never again. ...You made this place feel like ours, Theo."),
      say('kit', 'sad', "Senpai, you guys are graduating and I'm going to be the oldest committee member. I don't know where anything is!"),
      say('jules', 'happy', 'Kit. Buddy. Nobody knows where anything is. That is the secret of the committee.'),
      say('jules', 'neutral', 'So. Bell Night. Midnight. Who are you ringing it with, Hartley-dude? Asking for the newsletter.'),
      choice([
        opt('"I\'ll know when I\'m up there."', [
          say('jules', 'happy', 'Mysterious! I love it. I will write "sources say: vibes".'),
          setFlag('main_31_undecided'),
        ]),
        opt('"With the people who got me here."', [
          say('dante', 'shy', '...Stop it. Something got in my eye. A seagull. A small seagull.'),
          friend('dante', 3), friend('jules', 3), friend('owen', 3), setFlag('main_31_friends'),
        ]),
        opt('"With Biscuit. Obviously."', [
          narrate('Biscuit yawns, stretches, and walks directly across Owen\'s notes.'),
          say('owen', 'neutral', 'The cat accepts. Pending snacks.'),
          friend('biscuit', 5), setFlag('main_31_biscuit'),
        ]),
      ]),
      narrate('Below, the town lights come on one by one, down the hill to the harbor. The tower stands behind you, whole and quiet.'),
      think('Two more nights. Maybe the best two.'),
    ],
  }),

  story({
    id: 'main_32_bell_night_finale', title: 'Bell Night',
    trigger: { type: 'auto', time: ['22:30', '25:59'] },
    when: all(BELL_NIGHT_Y3, any({ flag: 'fest_bell_night_y3_gathered' }, { time: ['23:30', '25:59'] }), { notSeen: 'main_33_finale_wakeup' }),
    priority: 95, skippable: false,
    script: [
      iff({ noFlag: 'fest_bell_night_y3_gathered' }, [
        sfx('phone'),
        narrate('Your phone buzzes. And buzzes. And buzzes. Jules: "WHERE ARE YOU." "IT\'S BELL NIGHT." "THEO." "RUN."'),
      ]),
      ...FINALE,
    ],
  }),

  story({
    id: 'main_33_finale_wakeup', title: 'Not Tonight, Sleepyhead',
    trigger: { type: 'sleep' },
    when: all(BELL_NIGHT_Y3, { notSeen: 'main_32_bell_night_finale' }),
    priority: 95, skippable: false,
    script: [
      ...open('home_theo', 'bed', [place('theo', 'bed', 'down'), place('roz', 'door_stairs', 'up'), music(null)]),
      sfx('door_open'),
      say('roz', 'angry', 'Theodore Hartley. It is Bell Night. You are NOT sleeping through Bell Night.'),
      say('roz', 'happy', 'Coat. Scarf. Up the hill. Everyone is waiting, and I mean everyone. Even the mayor stopped talking.'),
      moveTo('theo', 'door_stairs'),
      ...FINALE,
    ],
  }),
];
