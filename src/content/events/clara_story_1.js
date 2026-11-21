// Clara Voss, "the Rival" (S3). Year 1 beats: meet, spark, secret, Moon Viewing Night (+ missed-moment version), two slice-of-life scenes.
// Voice: formal, precise, no contractions (until she relaxes), dry wit. Calls Theo "Hartley" until 5 hearts; the switch is scene clara_b.
// Windows are wide on purpose: nothing here hard-locks a later beat.

import {
  say, narrate, think, choice, opt, iff, warp, place, moveTo, face, pose, emote, cam, fade, flash,
  lighting, sfx, music, banner, setFlag, friend, stat, giveItem, quest,
} from '../../sim/script_dsl.js';

const ev = (o) => ({ kind: 'romance', priority: 60, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------------------------------------ 01 meet
  ev({
    id: 'clara_01_meet', title: 'The Class Representative', priority: 70,
    trigger: { type: 'talk', npc: 'clara' },
    when: { notSeen: 'clara_01_meet' },
    script: [
      fade('out', 300), warp('school_classroom', 'door'), place('theo', 'door', 'up'), place('clara', 'seat_clara', 'down'), lighting('day'), music('school_class'), fade('in', 400),
      narrate(`Class 1-B, new transfer student, first week. One desk in the room has no dust, no doodles, and a ruler lined up with the edge. I will give you three guesses.`),
      say('clara', 'neutral', `Theo Hartley. Transfer, seat four rows back, birthday unrecorded, and you have been looking for the timetable since 08:10.`),
      say('theo', 'surprised', `How do you know when I started looking?`),
      say('clara', 'smug', `You opened your bag nine times. A person who knows where something is opens it once.`),
      say('clara', 'neutral', `I am Clara Voss, class representative. This is your timetable. It is laminated. Please do not ask me why. It is a matter of principle.`),
      giveItem('notebook'), sfx('item'),
      say('clara', 'neutral', `You are also issued a notebook. The class representative must be able to say, in good conscience, that no student arrived unequipped.`),
      choice([
        opt(`"Thanks. You are very thorough."`, [
          say('clara', 'surprised', `...That is the correct word. Most people say "intense".`),
          say('clara', 'neutral', `Thorough. I shall accept it, and shall not blush, which is a decision, not a reflex.`),
          friend('clara', 3), setFlag('clara_meet_kind'),
        ]),
        opt(`"Laminated? Nobody laminates a timetable."`, [
          say('clara', 'smug', `I do. It survives rain, spilled tea and, once, a gull. You are welcome.`),
          say('clara', 'neutral', `You are quick, Hartley. I shall be curious to see whether that is true on paper.`),
          friend('clara', 3), setFlag('clara_meet_playful'),
        ]),
        opt(`"I will beat you on the first exam."`, [
          emote('clara', 'exclaim'),
          say('clara', 'surprised', `You have been here for forty minutes and you are challenging the grade's top student.`),
          say('clara', 'smug', `Splendid. Nobody has challenged me since the second term of last year. I had begun to worry about the fitness of the field.`),
          friend('clara', 4), setFlag('clara_meet_rival'),
        ]),
      ]),
      say('clara', 'neutral', `For the record: first midterm, results posted on the 26th. I shall be at the top of the sheet. Come and look for your name. Somewhere below it.`),
      moveTo('clara', 'door', { speed: 'walk' }),
      think(`She leaves the room like a metronome. Even the door clicks shut on the beat.`),
      setFlag('clara_met'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 02 spark
  ev({
    id: 'clara_02_spark', title: 'Seat Three, Ranked Second', priority: 62,
    trigger: { type: 'enterMap', map: 'school_library', time: ['15:30', '18:30'] },
    when: { all: [{ hearts: ['clara', '>=', 2] }, { seen: 'clara_01_meet' }, { notSeen: 'clara_02_spark' }] },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('clara', 'table_3', 'right'), lighting('indoor'), music('library'), fade('in', 400),
      narrate(`The library at half past three. One reading lamp on, one very straight back under it, one stack of books arranged by height.`),
      say('clara', 'neutral', `Hartley. You are standing in my light. Either sit, or become furniture.`),
      narrate(`I sit. Her notes are colour-coded in four inks. Mine are a coffee ring and the word "ASK?"`),
      iff({ rank: ['<=', 3] }, [
        say('clara', 'thinking', `You placed third on the midterm. Third. From a transfer. With a different syllabus.`),
        say('clara', 'neutral', `I am not impressed. I am... recalibrating. It is not the same thing, and I would be grateful if you did not tell anyone.`),
      ], [
        say('clara', 'smug', `You are ranked below the top three. Do not look at me like that. It is a starting position, not a verdict.`),
        say('clara', 'neutral', `Sit. Sooner or later you will notice that you are rather good at explaining things, and you will be unbearable.`),
      ]),
      choice([
        opt(`"Teach me how you study."`, [
          say('clara', 'surprised', `You are asking your rival for her method. That is either idiocy or strategy.`),
          say('clara', 'smug', `Rule one: the answer is never in the first page you look at. Rule two: sleep. Rule three: I do not follow rule two. Do not repeat that.`),
          friend('clara', 4), stat('science', 1), setFlag('clara_spark_method'),
        ]),
        opt(`"Race you: ten questions, loser buys tea."`, [
          sfx('page'),
          say('clara', 'happy', `Ten questions. Closed books. Tea is two dollars at the cafe, so the stakes are, regrettably, ethical rather than financial.`),
          say('clara', 'neutral', `Nine to eight. Mine. You hesitated on the sixth. Tea, Hartley. Green. Not too hot.`),
          friend('clara', 4), setFlag('clara_spark_race'),
        ]),
        opt(`"You look tired. Do you ever stop?"`, [
          say('clara', 'sad', `...I do not know what the verb "stop" would look like. I have not seen it done.`),
          say('clara', 'neutral', `Forget it. You are the first person to ask in two years. I shall allow it once.`),
          friend('clara', 5), setFlag('clara_spark_tired'),
        ]),
      ]),
      narrate(`Behind the astronomy shelf, a gap between two books holds a thin paperback, spine out, very obviously not on the syllabus. Clara reshelves it with her palm flat, as if hiding a bird.`),
      say('clara', 'shy', `That is... reference material. For a project. I have been meaning to return it since last spring.`),
      think(`A star atlas, spine worn white with reading. Whatever her project is, it is eighteen months old.`),
      say('clara', 'neutral', `The library closes at six. Leave a gap in your schedule on Thursdays, Hartley. I will be somewhere that is not here.`),
      setFlag('clara_spark_done'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 03 secret
  ev({
    id: 'clara_03_secret', title: 'Ninety-Eight Percent', priority: 62,
    trigger: { type: 'enterMap', map: 'school_hall_2f', time: ['15:30', '19:30'] },
    when: { all: [{ hearts: ['clara', '>=', 4] }, { seen: 'clara_02_spark' }, { notSeen: 'clara_03_secret' }] },
    script: [
      fade('out', 300), place('theo', 'stairs_down', 'up'), place('m_voss', 'council_door', 'down'), place('clara', 'window_a', 'right'), lighting('sunset'), music('tense'), fade('in', 400),
      narrate(`The council door is open a hand's width. Low voices. One I know. One I have only heard on the speaker at assembly.`),
      say('m_voss', 'neutral', `Ninety-eight percent, Clara. A very good number. May I ask where the other two went?`),
      say('clara', 'neutral', `The astronomy supplementary, Mother. The question on orbital resonance. I will correct it.`),
      say('m_voss', 'neutral', `Please do. And Clara: the board will look at you before it looks at anyone else. Be where they can find you. Not on a hill.`),
      sfx('door_close'), moveTo('m_voss', 'stairs_down', { speed: 'walk' }),
      narrate(`Mrs. Voss passes me with a nod you could file. Clara stays at the window. Her hand is flat against the glass, as it was on the library shelf.`),
      moveTo('theo', 'spot_a', { wait: false }), moveTo('clara', 'spot_b'),
      say('clara', 'neutral', `You heard. Of course you did. It is a very thin door.`),
      choice([
        opt(`"She sounds like she loves you."`, [
          say('clara', 'thinking', `She does. In the way that a bridge loves the river: by standing very still, and expecting it to go the right way.`),
          friend('clara', 3), setFlag('clara_sec_gentle'),
        ]),
        opt(`"Ninety-eight is not a failure."`, [
          say('clara', 'sad', `No. Ninety-eight is a number. It is the only language my family speaks fluently. I was not given another.`),
          friend('clara', 4), setFlag('clara_sec_honest'),
        ]),
        opt(`Say nothing. Stand with her at the window.`, [
          narrate(`The grounds below are small and gold. A flag moves. Neither of us does.`),
          say('clara', 'shy', `...Thank you. For not repairing it with a sentence. I am told it is the most valuable thing a person can do.`),
          friend('clara', 5), setFlag('clara_sec_silent'),
        ]),
      ]),
      music('sad', 600),
      say('clara', 'neutral', `Everything I do is for a rank. If I am first, nobody asks what I wanted. And I did want something. A very small something. The hill. The dome. Owen lets me in, after dark.`),
      say('clara', 'shy', `I have mapped four hundred and twelve stars by hand. Nobody has seen them. They are not on any transcript. They are the only thing I have ever done without a grade at the end.`),
      say('clara', 'sad', `If Mother knew, she would call it a distraction. Perhaps it is. Perhaps that is what I like about it.`),
      think(`She says it all in one level voice, as if reading the minutes of someone else's meeting. Her thumb is white against her knuckle.`),
      choice([
        opt(`"Show me the stars. Not the transcript."`, [
          say('clara', 'surprised', `...You would come. To look at four hundred stars. With a person who corrects the pronunciation of "Andromeda".`),
          say('clara', 'happy', `Thursday, then. After sunset. The path begins behind the grounds. Wear a coat. I will bring the atlas and a thermos of tea. You will bring nothing and appreciate it.`),
          friend('clara', 5), setFlag('clara_sec_stars'),
        ]),
        opt(`"I will keep it. It is yours."`, [
          say('clara', 'shy', `...Yes. Mine. I had forgotten that is permitted.`),
          friend('clara', 4), setFlag('clara_sec_keep'),
        ]),
      ]),
      quest('clara_stars', 'start', `Clara secretly maps the stars. Find a way to let her love them in the open.`),
      say('clara', 'neutral', `Now. Please leave, Hartley, before I do something dishonourable, like becoming sentimental in a corridor.`),
      emote('clara', 'dots'),
      setFlag('clara_secret_known'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 04 festival (Moon Viewing Night, Y1)
  ev({
    id: 'clara_04_festival', title: 'The Biggest Moon', priority: 66,
    trigger: { type: 'auto', map: 'school_rooftop', time: ['18:30', '22:30'] },
    when: {
      all: [
        { festival: 'moon_night' }, { year: 1 }, { hearts: ['clara', '>=', 3] },
        { flag: 'fest_moon_night_y1_with_clara' }, { notSeen: 'clara_04_festival' },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('clara', 'fence_a', 'up'), lighting('night'), music('observatory'), fade('in', 500),
      narrate(`Up here the moon sits on the edge of the sea like a coin on a tablecloth. Clara has brought a star chart, a thermos and a blanket folded into a perfect rectangle.`),
      say('clara', 'neutral', `You came. The observatory was fully booked by the dumpling-and-telescope contingent, so we have the roof. It is, I admit, a better horizon.`),
      say('clara', 'shy', `Sit. Not there, that is a draught. Here. ...Closer than that, the blanket is only ninety centimetres wide.`),
      narrate(`I sit. Ninety centimetres is not a lot. The tea is very hot, very green, and somehow still the calmest thing on the roof.`),
      say('clara', 'neutral', `Tonight is a perigee full moon. Fourteen percent larger. Naturally it behaves as though it knew.`),
      choice([
        opt(`"Tell me about the stars up there."`, [
          say('clara', 'happy', `That, there, is Altair. And that line, if you follow it, ends at Vega. In the old story they meet once a year, if the bridge holds.`),
          say('clara', 'shy', `I have always liked that they do not mind the wait. I am not good at waiting. I am learning.`),
          friend('clara', 5), setFlag('clara_fest_stars'),
        ]),
        opt(`"The moon is not the only bright thing."`, [
          say('clara', 'surprised', `That was almost poetry. Hartley. Your delivery was dreadful, and I am going to pretend it was deliberate.`),
          emote('clara', 'sparkle'),
          friend('clara', 5), setFlag('clara_fest_line'),
        ]),
        opt(`Say nothing. Offer her the last dumpling.`, [
          say('clara', 'happy', `You... brought dumplings. Into the observatory-adjacent area. Against policy.`),
          say('clara', 'neutral', `It is delicious. I shall be filing a complaint, to myself, in the morning.`),
          friend('clara', 4), setFlag('clara_fest_dumpling'),
        ]),
      ]),
      say('clara', 'neutral', `When I was nine, I counted the stars from my bedroom window, and I got to two hundred and one. Then Mother turned on the hall light and I lost count.`),
      say('clara', 'shy', `I have been trying to finish that count for eight years. Tonight, I think I might.`),
      cam({ focus: 'clara', ms: 800 }),
      narrate(`Her hand finds the edge of the blanket, and then, very correctly, mine. She does not look at it. She looks at Vega. The back of her ear is pink.`),
      say('clara', 'shy', `This is not in any schedule, Theo. I am aware. Please do not point it out.`),
      sfx('heart'), emote('clara', 'heart'),
      think(`Theo. Not Hartley. Not yet a habit; maybe a rehearsal. I keep very still, like you do for a bird.`),
      cam({ reset: true }),
      setFlag('clara_moon_shared'),
      fade('in', 200),
    ],
  }),
  ev({
    id: 'clara_04_festival_friend', title: 'The Girl Behind the Telescope', priority: 55,
    trigger: { type: 'auto', map: 'school_rooftop', time: ['19:00', '22:30'] },
    when: {
      all: [
        { festival: 'moon_night' }, { year: 1 }, { flag: 'fest_moon_night_attended' }, { notSeen: 'clara_04_festival' },
        { noFlag: 'fest_moon_night_y1_with_clara' },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('clara', 'fence_b', 'up'), lighting('night'), music('observatory'), fade('in', 400),
      narrate(`Clara is at the far fence with her chart held at arm's length, as if the moon owed her an explanation.`),
      say('clara', 'neutral', `Hartley. You are standing in the moonlight. I recommend it; it is free.`),
      say('clara', 'neutral', `I intended to attend this evening in an official capacity. As vice president. The council wanted a speech. I declined and brought a chart. Do not tell Mother.`),
      choice([
        opt(`"Your secret is safe. Happy moon."`, [
          say('clara', 'shy', `...Happy moon, Hartley. I did not know that one was a greeting. I believe I like it.`),
          friend('clara', 3),
        ]),
        opt(`"Mind if I borrow your chart?"`, [
          say('clara', 'neutral', `Handle it by the edges. Orion is rising. You may find him if you are patient, which I doubt.`),
          friend('clara', 2),
        ]),
      ]),
      think(`The moon is enormous and she looks, for a second, as if she wishes it were company.`),
      setFlag('clara_moon_missed'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ a: the quiet rule
  ev({
    id: 'clara_a_quiet_rule', title: 'The Quiet Rule', priority: 55,
    trigger: { type: 'enterMap', map: 'school_library', time: ['15:30', '18:30'] },
    when: { all: [{ hearts: ['clara', '>=', 3] }, { seen: 'clara_02_spark' }, { notSeen: 'clara_a_quiet_rule' }] },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('clara', 'nook', 'left'), lighting('indoor'), music('library'), fade('in', 400),
      narrate(`Clara is in the window nook with a stack of three books and a dignified glare at the librarian's clock.`),
      say('clara', 'neutral', `Hartley. Library etiquette, Article One: whisper at one-third of conversational volume. I am measuring it. Silently. With judgment.`),
      choice([
        opt(`Whisper something absurd.`, [
          say('theo', 'happy', `(The shelf behind you has been listening. I think it is a gossip.)`),
          say('clara', 'surprised', `...`),
          say('clara', 'happy', `(It is the Dewey decimal system. It is, in fact, a gossip.) I will deny I said that.`),
          friend('clara', 4), setFlag('clara_a_absurd'),
        ]),
        opt(`Whisper a compliment.`, [
          say('theo', 'happy', `(You are the only person here who makes silence sound like a language.)`),
          say('clara', 'shy', `(...That volume is acceptable. The content is... under review.)`),
          friend('clara', 4), setFlag('clara_a_compliment'),
        ]),
        opt(`Slide her a note instead.`, [
          narrate(`I write "Tea?" on the back of a bookmark. She writes "Green." Then "Thank you." Then she crosses out "Thank you" and writes "Acceptable."`),
          friend('clara', 4), setFlag('clara_a_note'),
        ]),
      ]),
      say('clara', 'neutral', `I find it restful here. Nobody asks me what I intend to be. The shelves are not concerned with my future. They only want me in alphabetical order.`),
      giveItem('tea'), sfx('item'),
      say('clara', 'neutral', `Take this. It is a gift. I do not make a habit of gifts. It is tea. Do not misread it.`),
      setFlag('clara_library_hours'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ b: late
  ev({
    id: 'clara_b_first_late', title: 'The First Late', priority: 56,
    trigger: { type: 'enterMap', map: 'school_classroom', time: ['07:30', '08:30'] },
    when: { all: [{ hearts: ['clara', '>=', 5] }, { seen: 'clara_03_secret' }, { notSeen: 'clara_b_first_late' }, { schoolDay: true }] },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('mr_brandt', 'teacher_desk', 'down'), place('clara', 'door', 'up'), lighting('day'), music('school_class'), fade('in', 400),
      narrate(`The bell is ringing as I sit. The seat at row two, column one, is empty. Mr. Brandt looks at it as if it has done something.`),
      say('mr_brandt', 'angry', `Voss is late. The one student in this school who has never been late. I have a wall calendar. I have a little tally. I do not know what to do with this.`),
      sfx('door_open'), moveTo('clara', 'seat_clara', { speed: 'run' }),
      emote('clara', 'sweat'),
      say('clara', 'surprised', `Mr. Brandt, I am... five minutes... apologies. My alarm... did not... fail. I failed it.`),
      say('mr_brandt', 'neutral', `Sit down, Voss. And... breathe. It is a tally mark. It is not an execution.`),
      narrate(`Her hair has a hairclip on the wrong side. There is a star atlas sticking out of her bag. She meets my eyes once, with the face of a person who has just discovered gravity.`),
      choice([
        opt(`Pass her my notes under the desk.`, [
          sfx('page'),
          say('clara', 'shy', `...You took notes. For me. Of the first five minutes. In my own handwriting style.`),
          friend('clara', 5), setFlag('clara_b_notes'),
        ]),
        opt(`Whisper: "Hairclip. Left side."`, [
          say('clara', 'surprised', `...`),
          say('clara', 'shy', `Thank you. Hartley. Theo. Thank you. I owe you a favour, and I do not like owing.`),
          friend('clara', 5), setFlag('clara_b_hairclip'),
        ]),
        opt(`Whisper: "Was it the stars?"`, [
          say('clara', 'shy', `...It was the stars. I was up until four. There was a comet. A small one. Nobody will believe it.`),
          friend('clara', 5), setFlag('clara_b_comet'),
        ]),
      ]),
      say('clara', 'neutral', `Theo. Yes. I shall call you Theo from now on. You have earned it. You saw the worst, and did not file a report.`),
      say('clara', 'shy', `Please remember I am still ranked first. Mathematically, this scene did not occur.`),
      setFlag('clara_uses_name'),
      fade('in', 200),
    ],
  }),
];
