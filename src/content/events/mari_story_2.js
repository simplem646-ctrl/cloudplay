// Marisol "Mari" Reyes (S3), part 2: confession and Bell Night promise. (_05_crisis, _07_date, _08_climax, _10_farewell are not written at this scope.)

import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, pose, emote, cam, fade,
  lighting, sfx, music, setFlag, friend, quest, romance, giveItem,
} from '../../sim/script_dsl.js';

const ev = (o) => ({ kind: 'romance', priority: 60, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------------------------------------ 06 confession
  ev({
    id: 'mari_06_confession', title: 'A Very Small Painting', priority: 65, repeat: 'daily',
    trigger: { type: 'enterMap', map: 'town_park', time: ['16:00', '19:30'] },
    when: {
      all: [
        { hearts: ['mari', '>=', 6] }, { seen: 'mari_03_secret' }, { partner: null }, { noFlag: 'mari_dating_since' },
        { any: [{ noFlag: 'mari_confess_notyet' }, { hearts: ['mari', '>=', 8] }] },
        { any: [{ year: [2, 3] }, { all: [{ year: 1 }, { season: 'winter' }, { day: [14, 28] }] }] },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'road_west', 'right'), place('mari', 'picnic_b', 'down'), lighting('sunset'), music('romantic'), fade('in', 500),
      narrate(`The picnic lawn at sunset. A blanket, a thermos, and an easel facing the pond. Mari has covered the whole canvas with a bedsheet. She is sitting on the grass very, very still, which is the loudest she has ever been.`),
      iff({ flag: 'mari_confess_notyet' }, [
        say('mari', 'shy', `You came back. I painted it again. Smaller. It's a small painting. It's the smallest thing I've ever been brave about.`),
      ], [
        say('mari', 'shy', `Teo! You're here! Okay, I have a surprise, and I rehearsed a speech, and I've already forgotten the speech and kept the surprise. That's the correct order, right?`),
      ]),
      say('mari', 'neutral', `I told Grandma. About the letter. About the academy. About the shop. I thought she'd cry. She did. And then she hit me with a rolled-up newspaper.`),
      say('mari', 'happy', `"Mija, I've been waiting two years for you to say it." She'd already hired Mrs. Okada from next door for Saturdays. She's been planning it behind my back. My own grandmother! A conspirator!`),
      say('mari', 'shy', `I said I'd tell you first, since you're the reason I opened my mouth. So. Okay. Okay. Surprise.`),
      sfx('swoosh'),
      narrate(`She pulls the bedsheet down. It is the pond at dusk, in twelve colours that should not work together. In the corner, two small figures sit on a blanket. One has a blue handprint on its sleeve.`),
      say('mari', 'shy', `It's you. It's me. It's us, if that's, if that's something you'd... Teo. I like you. I really, really like you. Like, "I can't draw a straight line when you're in the room" like.`),
      say('mari', 'shy', `Would you... be my boyfriend? Or my... something with a name? I'm very bad at names. I'm very good at colours. Say yes in a colour if that's easier.`),
      choice([
        opt(`"Yes. In every colour."`, [
          sfx('heart_big'), emote('mari', 'heart'),
          say('mari', 'happy', `Ay, Dios mío! Okay! Okay, that's, wow. That was the right colour! That was ALL the colours!`),
          romance('mari', 'dating'), friend('mari', 10), setFlag('mari_dating_since'), setFlag('mari_confessed_yes'),
          quest('mari_mural', 'update', `Mari told her grandmother about the academy. We start thinking big, together.`),
        ]),
        opt(`"Yes. I would like that very much."`, [
          sfx('heart_big'), emote('mari', 'heart'),
          say('mari', 'surprised', `You said "very much." Nobody says "very much" to me. Sorry. I'm going to cry on the easel. It's waterproof. The easel, not me.`),
          romance('mari', 'dating'), friend('mari', 10), setFlag('mari_dating_since'), setFlag('mari_confessed_yes'),
          quest('mari_mural', 'update', `Mari told her grandmother about the academy. We start thinking big, together.`),
        ]),
        opt(`"I care about you. I need more time."`, [
          say('mari', 'sad', `...Oh. Oh. Okay. That's fair.`),
          say('mari', 'neutral', `That's honest. I like honest. It's a good primer. You can paint over honest with anything.`),
          say('mari', 'happy', `I'm not going anywhere. I'm... a very sticky person. Like glitter. Teo, you'll never get rid of me.`),
          friend('mari', 1), setFlag('mari_confess_notyet'),
        ]),
      ]),
      iff({ dating: 'mari' }, [
        say('mari', 'shy', `Can we... can I... may I sit really close and not say anything for a bit? I've never done that. It's terrifying. Wow. Okay.`),
        narrate(`She leans against my shoulder, and for once there is no joke. The pond turns copper. A heron, somewhere, makes a rude noise.`),
        say('mari', 'happy', `There he is. My critic.`),
        moveTo('mari', 'picnic_a', { wait: false }), moveTo('theo', 'picnic_c'),
      ]),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 09 promise
  ev({
    id: 'mari_09_promise', title: 'Two Panels, One Story', priority: 62,
    trigger: { type: 'enterMap', map: 'town_park', time: ['15:00', '21:30'] },
    when: { all: [{ dating: 'mari' }, { hearts: ['mari', '>=', 8] }, { year: 3 }, { season: 'winter' }, { day: [25, 28] }, { notSeen: 'mari_09_promise' }] },
    script: [
      fade('out', 400), place('theo', 'road_west', 'right'), place('mari', 'bandstand', 'down'), lighting('sunset'), music('romantic'), fade('in', 500),
      narrate(`Frost on the bandstand rail. Mari is sitting in the middle of the stage with her legs hanging off the edge, her sketchbook shut and, tied to her wrist, a small blue ribbon from a bunch of flowers.`),
      say('mari', 'happy', `Teo! The audience has arrived! Ladies, gentlemen, heron! Welcome to the premiere of... something I'm very bad at saying!`),
      iff({ flag: 'main_vote_saved' }, [
        say('mari', 'happy', `The school's staying. The harbor wall's getting my mural. The real one, the big one, with Mr. Finch's blessing and about forty buckets of tide-proof paint.`),
      ], [
        say('mari', 'neutral', `The school's merging. But the harbor wall is still getting my mural. Mr. Finch signed off. The town needs something that doesn't move. I'm painting it into the wall so it can't.`),
      ]),
      say('mari', 'neutral', `I'm going, Teo. The Harlow Academy. September. Grandma packed my bag before I'd even said yes. She put a plant in it. A cactus. "To remember who you are, mija." She's very tender and very passive-aggressive.`),
      say('mari', 'shy', `I'm scared. Not of leaving. Of... the quiet. The first night in a room where nobody is yelling about carnations. Who's going to say "Teo" in the blue-bird voice?`),
      choice([
        opt(`"Go. We'll make the miles into paint."`, [
          say('mari', 'happy', `Miles into paint! Oh, that's good, I'm stealing that! I'm putting it on a postcard! I'm going to send you the whole map in postcards!`),
          friend('mari', 8), setFlag('mari_promise_kind'),
        ]),
        opt(`"I'll miss you. But you have to go."`, [
          say('mari', 'sad', `...I know. I know I do. Te voy a extrañar. I'm going to miss you so much it's going to be a colour. A new one. Nobody's invented it yet.`),
          friend('mari', 8), setFlag('mari_promise_honest'),
        ]),
        opt(`"Send me a painting a week. I'll hang them."`, [
          say('mari', 'surprised', `A WEEK?! That's fifty-two! You'll need a gallery! Okay, challenge accepted! You'll need to build a wall!`),
          friend('mari', 8), setFlag('mari_promise_playful'),
        ]),
      ]),
      say('mari', 'shy', `Promise me two things. One: Bell Night, we ring the bell together, and I get to look at it like it's the most beautiful thing I've ever drawn, because it is.`),
      say('mari', 'shy', `Two: wherever I am, Teo, find the first blue thing every morning, and think of me. I'll do the same. We'll be... synchronised. Two panels. One story.`),
      say('theo', 'happy', `I promise. Both. And the blue thing is a jay.`),
      sfx('heart_big'), emote('mari', 'heart'),
      narrate(`She unties the blue ribbon and winds it around my wrist, and kisses me quickly on the cheek, so fast I might have imagined it, except that the cheek is warm for ten minutes after.`),
      say('mari', 'happy', `Okay! That's done! That's the best thing I've ever painted, and I didn't use any paint!`),
      quest('mari_mural', 'complete', `She goes to the academy, and the harbor gets a mural. Two panels, one story.`),
      setFlag('mari_promise_made'),
      fade('in', 200),
    ],
  }),
];
