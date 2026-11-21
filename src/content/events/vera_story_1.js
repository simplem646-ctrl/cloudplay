// Vera Lindqvist, "the Loner" (S3). Year 1 beats: meet, spark, secret, Lantern Night (+ missed-moment version), two slice-of-life scenes.
// Voice: deadpan, sarcastic, few words; soft and unguarded only around cats and music. Calls Theo "new kid" until 3 hearts (the secret scene ends that).
// The music room is not built: the piano is an offstage sound behind door_music. Windows are wide on purpose: nothing hard-locks a later beat.

import {
  say, narrate, think, choice, opt, iff, warp, place, moveTo, face, pose, emote, cam, fade, flash,
  lighting, sfx, music, banner, setFlag, friend, stat, giveItem, quest, wait,
} from '../../sim/script_dsl.js';

const ev = (o) => ({ kind: 'romance', priority: 60, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------------------------------------ 01 meet
  ev({
    id: 'vera_01_meet', title: 'Occupied', priority: 70,
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['11:30', '17:30'] },
    when: { notSeen: 'vera_01_meet' },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('vera', 'bench', 'down'), place('biscuit', 'cat_spot', 'down'), lighting('day'), music('rooftop'), fade('in', 400),
      narrate(`The rooftop door sticks, and then gives. Wind, sea, and a long bench with one occupant: silver bob, blue streak, headphones around her neck like a collar for a very bored animal.`),
      say('vera', 'neutral', `Occupied.`),
      say('theo', 'surprised', `It's a bench. It seats three.`),
      say('vera', 'neutral', `Occupied, in spirit.`),
      emote('biscuit', 'zzz'),
      narrate(`A grey and white cat pours itself out of a cardboard bed, crosses the roof like a tiny landlord, and sits on my shoe.`),
      say('vera', 'surprised', `...Biscuit. Traitor.`),
      choice([
        opt(`Crouch and let the cat sniff my hand.`, [
          emote('biscuit', 'heart'),
          say('vera', 'neutral', `He doesn't do that. He's picky. He once rejected a fish.`),
          say('vera', 'shy', `...You can sit. Not close. Not talk. That's the deal.`),
          friend('vera', 4), setFlag('vera_meet_cat'),
        ]),
        opt(`"Is this your roof?"`, [
          say('vera', 'neutral', `Nobody's put a name on it. I've put a bench on it. In my head. It's mine, legally, in my head.`),
          friend('vera', 3), setFlag('vera_meet_roof'),
        ]),
        opt(`"I'll go. Sorry."`, [
          say('vera', 'neutral', `...Fine. No. Stay. You said sorry. Most people argue. It's weird. Stay.`),
          friend('vera', 4), setFlag('vera_meet_polite'),
        ]),
      ]),
      narrate(`I sit at the far end. She puts one headphone back on and doesn't hit play. We watch the sea do absolutely nothing for a very pleasant length of time.`),
      say('vera', 'neutral', `Vera. Class 1-A. I skip. A lot. Don't tell Delaney. She knows. But don't tell her anyway.`),
      say('theo', 'happy', `Theo. Transfer. I'm in 1-B.`),
      say('vera', 'neutral', `Good for you, new kid.`),
      say('vera', 'neutral', `Biscuit eats at one. He likes tuna. He pretends he doesn't. If you come back, don't bring flowers. It's a cat, not a funeral.`),
      think(`That's either a threat or an invitation. With her, I suspect it's both and she'd file them under "sarcasm."`),
      setFlag('vera_met'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 02 spark
  ev({
    id: 'vera_02_spark', title: 'One Earbud', priority: 62,
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['12:00', '17:30'] },
    when: { all: [{ hearts: ['vera', '>=', 2] }, { seen: 'vera_01_meet' }, { notSeen: 'vera_02_spark' }] },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('vera', 'fence_a', 'left'), place('biscuit', 'cat_spot', 'down'), lighting('day'), music('rooftop'), fade('in', 400),
      narrate(`Vera's leaning on the fence with her back to the door. Her right hand is tapping on the rail, not a rhythm, exactly. A pattern with a mind of its own.`),
      say('vera', 'neutral', `You're loud. Your shoes. You walk like you're apologising to the floor.`),
      say('theo', 'happy', `Hi, Vera. What are you listening to?`),
      say('vera', 'neutral', `Nothing. It's off.`),
      say('theo', 'thinking', `Your hand's still moving.`),
      narrate(`Her hand stops. The wind fills in the gap. Biscuit yawns, with total contempt.`),
      choice([
        opt(`"Sorry. None of my business."`, [
          say('vera', 'shy', `...Wait.`),
          narrate(`She holds out one earbud, without looking. I take it. Somebody is playing a guitar very quietly, and badly on purpose, and it's wonderful.`),
          say('vera', 'neutral', `It's a demo. Mine. Don't say anything. Ever.`),
          friend('vera', 5), setFlag('vera_spark_polite'),
        ]),
        opt(`"Is that a piano rhythm?"`, [
          say('vera', 'angry', `No.`),
          say('vera', 'neutral', `...Why would you say piano.`),
          say('theo', 'surprised', `Sorry. It sounded like one.`),
          say('vera', 'sad', `Forget it. Ask me that again and I'll push you off the roof. Metaphorically. The roof has a fence. I checked.`),
          friend('vera', 2), setFlag('vera_spark_piano_early'),
        ]),
        opt(`Offer her an apple instead.`, [
          say('vera', 'neutral', `I didn't ask for an apple.`),
          say('vera', 'shy', `...It's a good apple. Don't tell Biscuit, he'll want one.`),
          friend('vera', 4), setFlag('vera_spark_apple'),
        ]),
      ]),
      say('vera', 'neutral', `There's one rule up here. Nobody asks "why." Why am I here, why am I not in class, why don't I... why anything. Okay?`),
      say('theo', 'happy', `Okay. No "why."`),
      say('vera', 'neutral', `That's not a handshake. That's not a promise. It's... a rooftop agreement. It expires at the bell.`),
      narrate(`The bell rings. She doesn't move. Neither do I. Biscuit climbs onto the bench between us and sits there like a very small contract.`),
      setFlag('vera_spark_done'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 03 secret
  ev({
    id: 'vera_03_secret', title: 'The Sixteenth Bar', priority: 62,
    trigger: { type: 'enterMap', map: 'school_hall_2f', time: ['17:30', '21:30'] },
    when: { all: [{ hearts: ['vera', '>=', 4] }, { seen: 'vera_02_spark' }, { notSeen: 'vera_03_secret' }] },
    script: [
      fade('out', 300), place('theo', 'stairs_down', 'up'), place('vera', 'door_music', 'down'), lighting('night'), music(null), fade('in', 600),
      narrate(`The second floor after dark. The corridor lamps hum. Behind the door marked MUSIC, somebody is playing a piano.`),
      sfx('chime'), wait(900),
      narrate(`Slow. Careful. Seven bars of something so quiet it seems to be asking permission. Then the eighth. Then the ninth. I stop breathing.`),
      narrate(`Then it breaks off, exactly on the sixteenth bar, as if the player has run into a wall. A long silence. The same bars start again from the beginning.`),
      sfx('chime'),
      narrate(`Again. Sixteen bars. Stop. Again. The seventh time, the door opens, and Vera is standing in it with her sleeves pushed up and her hands shaking.`),
      say('vera', 'surprised', `...How long.`),
      say('theo', 'neutral', `Not long. Vera, that was...`),
      say('vera', 'angry', `Don't. Don't say it was beautiful. Don't say "you play." Don't say any of the things.`),
      choice([
        opt(`"I won't say anything. Can I stay?"`, [
          say('vera', 'sad', `...Sit. Not in there. There. On the floor. By the door. That's the ground rule.`),
          friend('vera', 4), setFlag('vera_sec_stay'),
        ]),
        opt(`"I heard sixteen bars. Then it stopped."`, [
          say('vera', 'sad', `Yeah. It always stops. I've been counting. I've been counting for three years.`),
          friend('vera', 4), setFlag('vera_sec_count'),
        ]),
        opt(`"You don't have to explain."`, [
          say('vera', 'neutral', `...Good. Because I'm going to anyway. It's easier if you don't ask. Don't ask.`),
          friend('vera', 5), setFlag('vera_sec_noexplain'),
        ]),
      ]),
      music('sad', 600),
      say('vera', 'neutral', `I was thirteen. Concert hall. Two thousand people. A piece I'd played a thousand times. I got to the sixteenth bar, and my hands... weren't mine. They just stopped.`),
      say('vera', 'neutral', `Four minutes of silence. I counted. A man coughed. My mother was in the front row. She didn't move. She didn't breathe. It's the longest she's ever held still.`),
      say('vera', 'sad', `They called it a "breakdown." I called it the best four minutes of my life. It was quiet. Nobody wanted anything. Then they carried me off.`),
      say('vera', 'neutral', `I haven't touched a piano since. I moved here to be nobody. Nobody expects anything from a girl on a roof.`),
      say('vera', 'sad', `But at night I come up here. To the old upright. Quietly. And every time, I get to the sixteenth bar, and my hands go cold. It's the wall. I walk into the same wall. Every night.`),
      think(`She's said it all in the same flat voice as "occupied," and it's the most exposed I've ever seen anyone sound.`),
      choice([
        opt(`"Seven bars more than you think you can."`, [
          say('vera', 'surprised', `...What?`),
          say('theo', 'happy', `You played sixteen. That's a wall you hit sixteen times a night. That's not stopping, Vera. That's practice.`),
          say('vera', 'shy', `...Huh. Okay. That's an annoying way to look at it. It's possibly correct. I hate it.`),
          friend('vera', 6), setFlag('vera_sec_practice'),
        ]),
        opt(`"Play it for Biscuit first."`, [
          say('vera', 'neutral', `...He's a tough critic.`),
          say('vera', 'shy', `Okay. A cat. Not a hall. A cat is... one. One I can do. Maybe.`),
          friend('vera', 5), setFlag('vera_sec_biscuit'),
        ]),
      ]),
      quest('vera_piano', 'start', `Vera hasn't played for people since a recital at thirteen. Help her get past the sixteenth bar.`),
      say('vera', 'neutral', `Theo. ...That's your name. I'm using it. Don't make it weird.`),
      say('vera', 'shy', `Thanks for not saying "beautiful." Everyone says "beautiful." It's the worst. It's like being petted by a ghost.`),
      setFlag('vera_secret_known'), setFlag('vera_uses_name'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 04 festival (Lantern Night, Y1)
  ev({
    id: 'vera_04_festival', title: 'A Lantern With One Line', priority: 66,
    trigger: { type: 'auto', map: 'town_harbor', time: ['17:30', '22:30'] },
    when: {
      all: [
        { festival: 'lantern_night' }, { year: 1 }, { hearts: ['vera', '>=', 3] },
        { flag: 'fest_lantern_night_y1_with_vera' }, { notSeen: 'vera_04_festival' },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'lantern_row', 'up'), place('vera', 'dock_end', 'left'), lighting('lantern'), music('romantic'), fade('in', 500),
      narrate(`The end of the dock. Paper lanterns are drifting out into the dark one after another, a slow, bright, wandering parade. Vera sits with her feet over the edge and her headphones off, around her neck.`),
      say('vera', 'neutral', `You found me. Congratulations. It's a dock. It's not a puzzle.`),
      say('vera', 'neutral', `Crowds are loud. The sea is the only thing here that doesn't want my opinion. It just goes out and comes back. I respect it.`),
      narrate(`She has a lantern in her lap. Plain white, no decoration, and a single line of writing on the inside that she covers when I look.`),
      choice([
        opt(`"What's the wish?"`, [
          say('vera', 'angry', `Rooftop rule. No why. No what. No wish.`),
          say('vera', 'shy', `...Okay. It's five words. It's not a wish. It's a note to myself.`),
          friend('vera', 3), setFlag('vera_fest_asked'),
        ]),
        opt(`Write my own wish and keep it covered.`, [
          say('vera', 'neutral', `...Good. You understand the system.`),
          friend('vera', 5), setFlag('vera_fest_covered'),
        ]),
        opt(`"Want me to carry it down to the water?"`, [
          say('vera', 'shy', `...You'd carry it. Hm. Okay. But I light it. I light it, you carry it.`),
          friend('vera', 5), setFlag('vera_fest_carry'),
        ]),
      ]),
      narrate(`We set them on the water together. They bob, and turn, and spin out, a bit crooked, among all the others.`),
      narrate(`Then she hums. Low, and barely there, a tune with sixteen bars. Not the wall. The part before it. It carries across the harbor, under the lantern light, and nobody turns around.`),
      say('vera', 'shy', `...Don't say anything. If you say anything, I stop.`),
      cam({ focus: 'vera', ms: 800 }),
      narrate(`I say nothing. She hums the sixteen bars, and then, very quietly, the seventeenth. It isn't a big step. It's a small, wobbly, significant one.`),
      sfx('heart'), emote('vera', 'note'),
      say('vera', 'shy', `...There. That's one. Don't make it a thing.`),
      say('vera', 'neutral', `Thanks for the dock. It's a good dock.`),
      cam({ reset: true }),
      setFlag('vera_lantern_shared'),
      fade('in', 200),
    ],
  }),
  ev({
    id: 'vera_04_festival_friend', title: 'The Lantern on the Rail', priority: 55,
    trigger: { type: 'auto', map: 'town_harbor', time: ['18:00', '22:30'] },
    when: {
      all: [
        { festival: 'lantern_night' }, { year: 1 }, { flag: 'fest_lantern_night_attended' }, { notSeen: 'vera_04_festival' },
        { noFlag: 'fest_lantern_night_y1_with_vera' },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'lantern_row', 'up'), place('vera', 'dock_end', 'left'), lighting('lantern'), music('town_night'), fade('in', 400),
      narrate(`At the very end of the dock, one figure with a silver bob and no lantern stares at the water as if it owes her money.`),
      say('vera', 'neutral', `New kid. You look lost. The festival's that way. Noise. Smoke. Fun, apparently.`),
      say('vera', 'neutral', `I came for the quiet part. It's about forty seconds long. It's between the second and the third song.`),
      choice([
        opt(`"Mind if I enjoy the forty seconds?"`, [
          say('vera', 'neutral', `...Fine. Thirty-nine now.`),
          narrate(`We stand there. The harbor does one long, slow breath. Then the third song starts, and she nods, once, as if she'd scheduled it.`),
          friend('vera', 3),
        ]),
        opt(`"Happy Lantern Night, Vera."`, [
          say('vera', 'shy', `...You too. It's... a nice thing to say. Don't expect it twice.`),
          friend('vera', 2),
        ]),
      ]),
      setFlag('vera_lantern_missed'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ a: biscuit
  ev({
    id: 'vera_a_biscuit', title: 'Tuna at One', priority: 55,
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['12:30', '14:30'] },
    when: { all: [{ hearts: ['vera', '>=', 3] }, { seen: 'vera_02_spark' }, { notSeen: 'vera_a_biscuit' }] },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('vera', 'cat_spot', 'down'), place('biscuit', 'cat_spot', 'right'), lighting('day'), music('rooftop'), fade('in', 400),
      narrate(`Vera is on her heels beside the cardboard bed, murmuring to Biscuit in a voice I did not know she owned. It is warm. It is full of vowels. It stops dead when she sees me.`),
      say('vera', 'neutral', `...You didn't hear that.`),
      say('theo', 'happy', `Hear what?`),
      say('vera', 'neutral', `Good. Great. Hand me the tuna.`),
      choice([
        opt(`Hand over the tuna. Say nothing.`, [
          sfx('eat'), emote('biscuit', 'heart'),
          say('vera', 'shy', `He's eating. He doesn't eat in front of people. He thinks you're furniture. It's a compliment.`),
          friend('vera', 4), setFlag('vera_a_quiet'),
        ]),
        opt(`"Why do you talk to him like that?"`, [
          say('vera', 'angry', `Rooftop rule. No "why."`),
          say('vera', 'shy', `...Because he doesn't talk back. Because he doesn't want me to be a prodigy. He wants tuna.`),
          friend('vera', 4), setFlag('vera_a_why'),
        ]),
        opt(`Offer Biscuit a treat from my pocket.`, [
          say('vera', 'surprised', `You carry cat treats? On purpose?`),
          say('vera', 'shy', `That's... the most reasonable thing anybody's done to me this week. Give it here.`),
          friend('vera', 5), setFlag('vera_a_treats'),
        ]),
      ]),
      narrate(`Biscuit climbs into my lap, turns round twice, and goes to sleep as if filing a deed of ownership. Vera watches it with an expression I cannot, in all honesty, read. I think it's jealousy. On behalf of both.`),
      say('vera', 'neutral', `He likes you. Don't get smug. He likes the radiator in the vending machine too.`),
      say('vera', 'shy', `...I like it when he likes people. It's one less thing I have to worry about being. ...Don't say anything.`),
      setFlag('vera_biscuit_trust'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ b: licorice
  ev({
    id: 'vera_b_the_listen', title: 'The Second Earbud', priority: 56,
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['16:00', '20:00'] },
    when: { all: [{ hearts: ['vera', '>=', 5] }, { seen: 'vera_03_secret' }, { notSeen: 'vera_b_the_listen' }] },
    script: [
      fade('out', 300), place('theo', 'door', 'up'), place('vera', 'bench', 'left'), lighting('sunset'), music('rooftop'), fade('in', 400),
      narrate(`Vera's on the bench with her knees up, her headphones on, and a bag of black licorice open between her feet. She sees me, and, without a word, kicks the bag an inch toward me.`),
      say('vera', 'neutral', `That's an invitation. It's also a test. Black licorice. If you hate it, you leave. Quietly.`),
      choice([
        opt(`Take one. Eat it. Don't flinch.`, [
          say('vera', 'surprised', `...You didn't make the face. Everyone makes the face.`),
          say('vera', 'happy', `Okay. You're allowed.`),
          friend('vera', 5), setFlag('vera_b_ate'),
        ]),
        opt(`Take one. Make the face. Take another.`, [
          say('vera', 'happy', `Ha. Ha. That's, okay. That's perseverance. I respect the suffering.`),
          friend('vera', 5), setFlag('vera_b_face'),
        ]),
        opt(`"I'll sit. I'll pass on the licorice."`, [
          say('vera', 'neutral', `Honest. Good. Sit.`),
          friend('vera', 4), setFlag('vera_b_pass'),
        ]),
      ]),
      say('vera', 'neutral', `Last night I got to bar nineteen. Nineteen. The old upright's got a sticky key at the top. It sounded like a hiccup. I didn't stop. I just laughed.`),
      say('vera', 'shy', `Nineteen is three more than sixteen. I know. Don't clap. If you clap I'll leave my own roof.`),
      narrate(`I don't clap. I nod. She nods back. Somewhere under the nod there's an entire conversation.`),
      narrate(`She slides the second earbud over. We sit, shoulder to shoulder, the sea orange on the horizon, while somebody plays nineteen careful bars of something very quiet that I think might be her.`),
      say('vera', 'shy', `That's the recording. From last night. I'm... not telling you that. You're hearing a stranger.`),
      say('theo', 'happy', `She's good.`),
      say('vera', 'shy', `...She's getting there.`),
      giveItem('black_licorice'), sfx('item'),
      setFlag('vera_shared_recording'),
      fade('in', 200),
    ],
  }),
];
