// Marisol "Mari" Reyes, "the Dreamer" (S3). Year 1 beats: meet, spark, secret, Beach Day (+ missed-moment version), two slice-of-life scenes.
// Voice: bubbly, rambling, art metaphors, jokes that dodge feelings. Calls Theo "Teo". Spanish slips out when she is moved.
// The art room and flower shop are not built yet: scenes are staged in the park, the school grounds, the harbor and the cafe.
// Windows are wide on purpose: nothing here hard-locks a later beat.

import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, pose, emote, cam, fade, flash,
  lighting, sfx, music, banner, setFlag, friend, stat, giveItem, quest,
} from '../../sim/script_dsl.js';

const ev = (o) => ({ kind: 'romance', priority: 60, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------------------------------------ 01 meet
  ev({
    id: 'mari_01_meet', title: 'Wet Paint', priority: 70,
    trigger: { type: 'enterMap', map: 'town_park', time: ['10:00', '17:30'] },
    when: { notSeen: 'mari_01_meet' },
    script: [
      fade('out', 300), place('theo', 'road_west', 'right'), place('mari', 'bench_1', 'down'), lighting('day'), music('town_spring'), fade('in', 400),
      narrate(`Heron Pond Park in spring. The cherry trees are shedding like they are paid by the petal. On bench one, someone has been painting the entire bench.`),
      say('mari', 'surprised', `WAIT! Don't sit! Don't, don't, don't, that's, oh, ay, it's... that bench is a work in progress!`),
      moveTo('theo', 'bench_2', { wait: false }),
      sfx('splash'), pose('theo', 'surprised'),
      narrate(`I sat. On the bench beside it. Which is also, it turns out, a work in progress. It was wet. Of course it was wet.`),
      say('mari', 'happy', `Oh no. Oh no! You are now ocean blue! Cerulean! Do you know how long that pigment takes to mix? ...it looks good on you, though!`),
      emote('mari', 'sparkle'),
      say('mari', 'neutral', `I'm Mari! Marisol, if I'm in trouble. Mari Reyes, class 1-C, Art Club, general menace to public furniture. You're the transfer, yes? Teo?`),
      say('theo', 'happy', `It's Theo. Not Teo.`),
      say('mari', 'smug', `Teo. It's my favourite word now. It sounds like a little blue bird. Teo. Teo! Yep. Blue bird. It's yours. You're stuck with it.`),
      choice([
        opt(`"I look like a jaybird, then?"`, [
          say('mari', 'happy', `A cerulean jay with a very confused expression! That's a painting! That is literally the next painting!`),
          friend('mari', 4), setFlag('mari_meet_playful'),
        ]),
        opt(`"Is the jacket ruined?"`, [
          say('mari', 'surprised', `Ruined? It's... enhanced. ...Okay, it's ruined. I'll pay for the cleaning! I have eleven dollars and a lot of regret.`),
          say('mari', 'shy', `Nobody ever asks about the jacket first. They ask about me, or the bench. Okay, you're nice. That's very inconvenient.`),
          friend('mari', 3), setFlag('mari_meet_kind'),
        ]),
        opt(`"What were you painting?"`, [
          say('mari', 'surprised', `You... want to know? Not why I did it on the bench? Everyone asks me why I did it on the bench.`),
          say('mari', 'happy', `It's the pond! I got distracted! The pond is a very flirtatious subject, it changes every time you look!`),
          friend('mari', 4), setFlag('mari_meet_curious'),
        ]),
      ]),
      say('mari', 'happy', `Okay! Here! A sketch! As an apology! Don't look at the nose, I do the nose last and then I run out of patience.`),
      giveItem('postcard_set'), sfx('item'),
      narrate(`She presses a rolled-up paper into my hand. A quick pencil of the park, in about forty lines, and somehow every one is happy. It smells of lemon and linseed oil.`),
      say('mari', 'happy', `Come to the Art Club! We have snacks! We have... questions! Okay bye Teo! Cerulean looks good on you!`),
      moveTo('mari', 'road_west', { speed: 'run' }),
      think(`There is a blue handprint on my sleeve and a ridiculous little smile on my face, and I have no idea how either got there.`),
      setFlag('mari_met'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 02 spark
  ev({
    id: 'mari_02_spark', title: 'Doodles', priority: 62,
    trigger: { type: 'enterMap', map: 'school_grounds', time: ['15:30', '18:30'] },
    when: { all: [{ hearts: ['mari', '>=', 2] }, { seen: 'mari_01_meet' }, { notSeen: 'mari_02_spark' }] },
    script: [
      fade('out', 300), place('theo', 'gate', 'up'), place('mari', 'bench_2', 'right'), lighting('sunset'), music('school_day'), fade('in', 400),
      narrate(`Mari is on a bench under the biggest tree in the courtyard, upside down. Her head hangs off the seat, her feet are on the backrest, her sketchbook is propped on her stomach.`),
      say('mari', 'happy', `Teo! Perfect timing! I'm doing the bell tower from the inside of my eyelids, and my head's getting heavy!`),
      say('theo', 'surprised', `Why upside down?`),
      say('mari', 'happy', `Everything's more honest upside down! The tower looks like it's hanging from the sky! It's way more romantic that way. Teo, look. LOOK.`),
      narrate(`The sketch is good. It's very good. The tower is a long pencil line, a plumb bob hanging from clouds, and at its foot a tiny figure waves. It has my hair.`),
      choice([
        opt(`"That's incredible. You should show people."`, [
          say('mari', 'surprised', `Show... people. Ha. Ha ha. Teo. Stop. It's just a... they're just doodles.`),
          say('mari', 'neutral', `That's what Mr. Whatever-his-name-was said at the contest. "Nice doodles." With a little sad pat. The pat is the worst part.`),
          friend('mari', 4), setFlag('mari_spark_praise'),
        ]),
        opt(`"Is that tiny person me?"`, [
          say('mari', 'happy', `That's a person who might be you, if you hold your head to the left! Anonymous passer-by! The central character of the whole composition!`),
          emote('mari', 'sparkle'),
          friend('mari', 4), setFlag('mari_spark_tease'),
        ]),
        opt(`"Teach me to draw it?"`, [
          say('mari', 'surprised', `Really? Really?! Okay okay okay, rule one: there are no rules, rule two: there are three rules, and rule three is, just look at the thing. Properly. Like you love it.`),
          say('mari', 'happy', `Here, hold the pencil like a spoon of soup. Don't spill. Look. Look at the tower. Now draw how it makes you feel.`),
          friend('mari', 5), stat('art', 1), setFlag('mari_spark_lesson'),
        ]),
      ]),
      narrate(`I draw a tower. It looks like a thermometer with ambition. She laughs for a full ten seconds and wipes her eyes with a paint-stained thumb, leaving a blue streak across one cheek.`),
      say('mari', 'happy', `It's fantastic! It's the most honest thermometer I've ever seen! Keep it! Frame it! Show it to your grandkids!`),
      say('mari', 'neutral', `...Teo? Thanks. For not saying "nice hobby." Everyone says "nice hobby." Even when they mean it nicely.`),
      say('mari', 'shy', `I've got to run, Grandma needs the shop opened, there's an entire bucket of carnations with an attitude. Bye!`),
      moveTo('mari', 'gate', { speed: 'run' }),
      think(`A hobby is something you do when you have time. She sketches like she's breathing. I don't think she knows how to sketch any other way.`),
      setFlag('mari_spark_done'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 03 secret
  ev({
    id: 'mari_03_secret', title: 'The Envelope', priority: 62,
    trigger: { type: 'enterMap', map: 'town_park', time: ['15:00', '19:00'] },
    when: { all: [{ hearts: ['mari', '>=', 4] }, { seen: 'mari_02_spark' }, { notSeen: 'mari_03_secret' }] },
    script: [
      fade('out', 300), place('theo', 'road_west', 'right'), place('mari', 'picnic_a', 'down'), lighting('sunset'), music('town_autumn'), fade('in', 400),
      narrate(`The picnic lawn is empty. Mari is sitting in the middle of it with her sketchbook closed and a crumpled envelope in both hands. She is not painting. That, more than anything, is wrong.`),
      say('mari', 'happy', `Teo! Hey! Sit! I'm doing a... still life. Of an envelope. It's very still. It's... quite possibly the stillest life I've ever...`),
      say('mari', 'sad', `...It's from the Harlow Academy of Art. In the city. The portfolio program. I applied in secret, in spring. They want me for the autumn session. They wrote "outstanding". Two times.`),
      choice([
        opt(`"Mari, that's amazing. Why the face?"`, [
          say('mari', 'neutral', `Because "outstanding" is a word they print on envelopes, Teo, and I'm... also the girl who paints benches. In public. With wet paint.`),
          friend('mari', 3), setFlag('mari_sec_cheer'),
        ]),
        opt(`Sit beside her. Don't say anything yet.`, [
          narrate(`A heron lands in the pond and instantly regrets it. We watch it not take the hint.`),
          say('mari', 'neutral', `...You're not going to tell me it's great.`),
          say('mari', 'sad', `Thank you. Everybody tells me it's great. It makes me feel like a poster.`),
          friend('mari', 4), setFlag('mari_sec_sit'),
        ]),
        opt(`"Are you scared of leaving? Or of staying?"`, [
          say('mari', 'surprised', `...Whoa. Right in the gut. Like a palette knife.`),
          say('mari', 'sad', `Both. Both at the same time. That's not normal, is it? You're only meant to be scared of one at a time.`),
          friend('mari', 5), setFlag('mari_sec_ask'),
        ]),
      ]),
      music('sad', 600),
      say('mari', 'sad', `Grandma Rosa's knees don't work like they used to. The shop opens at six. She does the buckets herself when I'm late, and she'd die before she said so.`),
      say('mari', 'sad', `She says, "go, mija, go." And I can hear in her voice that she doesn't want me to.`),
      say('mari', 'neutral', `If I go, who opens the shop? If I stay, who am I? Just somebody who "has a nice hobby." Somebody who never found out if she was any good.`),
      say('mari', 'sad', `I'm not brave, Teo. I'm just colourful. It's easy to be colourful. It's a costume. Underneath, I'm a very, very beige person who's afraid of a letter.`),
      think(`The jokes have all run out at the same time, like paint tubes at the end of a day. What's left is quiet, and very small, and absolutely not beige.`),
      choice([
        opt(`"You're not beige. Not even slightly."`, [
          say('mari', 'surprised', `...`),
          say('mari', 'shy', `Okay. Okay. That one landed. Don't look at me, I'm leaking. It's pigment. It's very expensive.`),
          friend('mari', 5), setFlag('mari_sec_notbeige'),
        ]),
        opt(`"What if it isn't one or the other?"`, [
          say('mari', 'thinking', `...Both. Like a... a diptych. Two panels. One story.`),
          say('mari', 'happy', `Oh, that's dangerous. I'm going to think about that for a week. Thank you. I think. I might also be annoyed. At you. And at it being right.`),
          friend('mari', 5), setFlag('mari_sec_both'),
        ]),
      ]),
      quest('mari_mural', 'start', `Mari has a letter from an art academy in the city, and a grandmother who opens a shop at six. Help her find a way to do both.`),
      say('mari', 'happy', `Okay! New rule! You're sworn to secrecy! I'm going to fold this envelope into a hat. A very confidential hat. Teo, hold the hat.`),
      giveItem('daisy_white'), sfx('item'),
      say('mari', 'shy', `That's a daisy from my pocket. It's been through a lot. It's for you. Don't get used to it. Okay, you can get used to it.`),
      setFlag('mari_secret_known'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 04 festival (Beach Day, Y1)
  ev({
    id: 'mari_04_festival', title: 'The Tide Is a Fair Critic', priority: 66,
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['10:30', '16:00'] },
    when: { all: [{ festival: 'beach_day' }, { year: 1 }, { hearts: ['mari', '>=', 3] }, { notSeen: 'mari_04_festival' }] },
    script: [
      fade('out', 300), place('theo', 'lantern_row', 'down'), place('mari', 'stairs_beach', 'down'), lighting('day'), music('beach'), fade('in', 400),
      narrate(`Beach Day. At the bottom of the stairs, the tide has left a smooth, dark shelf of sand, the colour of coffee with milk. Mari is on her knees on it with a stick, a bucket of seawater and a ridiculous hat.`),
      say('mari', 'happy', `TEO! You're a witness! This is going to be the biggest sand mural in Bellhaven history! Okay, in history of this particular beach! Okay, this particular patch!`),
      say('mari', 'neutral', `The tide comes in at four. It'll all be gone by dinner. That's the best bit. It's only a painting for the afternoon. Nobody can say it's a doodle if it's... gone.`),
      choice([
        opt(`Help her draw the long wave.`, [
          narrate(`She hands me a stick. I draw one long line. She puts a second beside it and a third. Suddenly it is the sea, drawn in the sand, by the sea.`),
          say('mari', 'happy', `See?! You're a natural! You drew the wave and I drew the boat and we're both a bit wet!`),
          friend('mari', 5), setFlag('mari_fest_wave'),
        ]),
        opt(`Fetch shells for the border.`, [
          giveItem('seashell'), sfx('item'),
          say('mari', 'surprised', `Shells! For the border! It's like a frame, except it's made of tiny, sorry, dead apartments!`),
          friend('mari', 4), setFlag('mari_fest_shells'),
        ]),
        opt(`Just watch her work. Hold her hat.`, [
          say('mari', 'shy', `You're... watching. Nobody watches. They say "oh pretty" and look at their phones. You're actually watching.`),
          say('mari', 'happy', `Okay, my hands just started shaking and I think it's good shaking. Don't move.`),
          friend('mari', 5), setFlag('mari_fest_watch'),
        ]),
      ]),
      narrate(`Three hours. The mural grows: the lighthouse, the bell tower, the harbor, a tiny figure with my hair and a blue handprint on its sleeve, a heron judging everyone, a girl with a hat and a stick.`),
      say('mari', 'happy', `Look! Look at it! I've never done anything this big! It's mine, it's huge and the sea is going to eat it in twenty minutes!`),
      say('mari', 'sad', `...Why does that feel okay? Why does it feel like the best thing I ever did? Because it was here. For a bit. And people saw it.`),
      sfx('splash'), cam({ shake: { amp: 2, ms: 300 } }),
      narrate(`The first wave comes in over the lighthouse, quite politely. Then the second one takes the heron.`),
      say('mari', 'happy', `Goodbye, heron! You were my best work! Teo, take a picture. In your head. It's the only place it can't wash away.`),
      say('mari', 'shy', `Thanks for staying. I'd have done it alone and it'd have been fine. But it wasn't "fine" with you. It was... how do you say it. Más. More.`),
      emote('mari', 'heart'), sfx('heart'),
      setFlag('mari_beach_mural'),
      fade('in', 200),
    ],
  }),
  ev({
    id: 'mari_04_festival_friend', title: 'The Girl With the Stick', priority: 55,
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['10:00', '18:00'] },
    when: {
      all: [
        { festival: 'beach_day' }, { year: 1 }, { notSeen: 'mari_04_festival' },
        { any: [{ hearts: ['mari', '<', 3] }, { time: ['16:01', '18:00'] }] },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'lantern_row', 'down'), place('mari', 'stairs_beach', 'left'), lighting('day'), music('beach'), fade('in', 400),
      narrate(`At the bottom of the beach stairs, Mari is kneeling over a shelf of sand with a stick and an air of tremendous purpose.`),
      say('mari', 'happy', `Teo! You missed it! Lighthouse! Bell tower! A heron! The tide ate the whole thing! It was horrible and I have never been so happy!`),
      say('mari', 'neutral', `Here. I saved one shell from the border. It has a tiny hole. It's a bad shell. I love it.`),
      giveItem('seashell'), sfx('item'),
      friend('mari', 2),
      think(`The sand is smooth and empty. Somewhere, the harbor is wearing a lighthouse it doesn't know about.`),
      setFlag('mari_beach_missed'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ a: the chalkboard
  ev({
    id: 'mari_a_chalkboard', title: 'Today\'s Special Is Chaos', priority: 55,
    trigger: { type: 'enterMap', map: 'cafe_lantern', time: ['14:30', '18:00'] },
    when: { all: [{ hearts: ['mari', '>=', 3] }, { seen: 'mari_02_spark' }, { notSeen: 'mari_a_chalkboard' }] },
    script: [
      fade('out', 300), place('theo', 'door_front', 'up'), place('roz', 'counter', 'down'), place('mari', 'table_1', 'left'), lighting('indoor'), music('cafe'), fade('in', 400),
      narrate(`The Lantern Café's chalkboard menu has been erased. Mari stands on a chair in front of it holding eleven pieces of coloured chalk like a bouquet.`),
      say('roz', 'happy', `Theo! Perfect. Tell this child that a menu is for information, not for a dragon.`),
      say('mari', 'happy', `It's a SEA dragon, Roz! It guards the lattes! It's a brand!`),
      say('roz', 'neutral', `I asked for the prices. In legible numbers. For humans.`),
      choice([
        opt(`"Mari, maybe put the prices in first?"`, [
          say('mari', 'neutral', `Prices first, dragon second. Dragon is a tail, then. A long, curly, price-adjacent tail.`),
          say('roz', 'happy', `Compromise! The sensible kind! Bless you, kiddo.`),
          friend('mari', 3), setFlag('mari_a_prices'),
        ]),
        opt(`"The dragon should stay."`, [
          say('mari', 'surprised', `Roz! The jury has spoken! The dragon stays!`),
          say('roz', 'happy', `Fine. The dragon stays. But it eats the biscotti line, not the espresso line.`),
          friend('mari', 5), setFlag('mari_a_dragon'),
        ]),
        opt(`Hold the chair steady. Don't pick a side.`, [
          say('mari', 'happy', `Thank you. A good friend holds the chair and keeps their opinions in a drawer.`),
          say('roz', 'smug', `Diplomat. That's a skill. I may hire you.`),
          friend('mari', 4), setFlag('mari_a_chair'),
        ]),
      ]),
      narrate(`An hour later the board is half price list and half sea dragon. It is the best menu in Bellhaven. It has a very long tail and, I notice, one of the ice-cream prices is wrong.`),
      say('mari', 'happy', `Free chai for the model, Roz! Teo posed! He was the... dragon's friend! Please!`),
      say('roz', 'happy', `One. Chai. And not a drop on my floor.`),
      giveItem('tea'), sfx('item'),
      say('mari', 'shy', `You know what I like about this? Somebody will see it, and it's just... there. It makes a person smile with their latte. That counts. Right? That counts as art?`),
      say('theo', 'happy', `It counts.`),
      say('mari', 'shy', `Okay. Good. I needed one person to say it out loud, so the dragon could hear.`),
      setFlag('mari_cafe_dragon'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ b: your colour
  ev({
    id: 'mari_b_your_colour', title: 'What Colour Are You', priority: 56,
    trigger: { type: 'enterMap', map: 'school_hall_2f', time: ['15:30', '18:00'] },
    when: { all: [{ hearts: ['mari', '>=', 5] }, { seen: 'mari_03_secret' }, { notSeen: 'mari_b_your_colour' }] },
    script: [
      fade('out', 300), place('theo', 'stairs_down', 'up'), place('mari', 'window_b', 'left'), lighting('sunset'), music('romantic'), fade('in', 400),
      narrate(`The second-floor windows turn the whole corridor gold. Mari has taped four sheets of paper to the glass and is mixing something on a lid.`),
      say('mari', 'happy', `Teo! Come here! I have a game! It's called "what colour are you." I do it with everyone. It's very scientific. It's not scientific.`),
      say('mari', 'neutral', `Jules is tomato red, loud and delicious. Nina is the yellow of the inside of a lemon. Elise is that grey-blue you get right before it rains. Dante is... a big wet orange. It's fine, he knows.`),
      say('theo', 'happy', `And me?`),
      say('mari', 'thinking', `...I haven't done you yet. Hold on. Don't move. Look at the window.`),
      narrate(`She studies me for a long time, a single brush in her mouth, the whole corridor gone very quiet. I try not to look nervous. I look nervous.`),
      choice([
        opt(`Hold still. Look out the window.`, [
          say('mari', 'shy', `Good. That's... yes. That's the one. Hold on.`),
          friend('mari', 4), setFlag('mari_b_still'),
        ]),
        opt(`"Do I get to see it before you hang it?"`, [
          say('mari', 'happy', `Absolutely not! That's the rule! Nobody sees till it's done! Even you! Especially you!`),
          friend('mari', 4), setFlag('mari_b_peek'),
        ]),
        opt(`Make a ridiculous face.`, [
          say('mari', 'happy', `STOP! I'm going to paint that! I'm going to paint that face and call it "Portrait of a Teo Under Pressure"!`),
          friend('mari', 5), setFlag('mari_b_face'),
        ]),
      ]),
      say('mari', 'shy', `Okay. Done. It's... it's a warm blue. Not cold blue. A blue that's got a bit of gold in it from somewhere. The gold is, uh, from the hallway. Probably. Don't read into it.`),
      say('mari', 'shy', `It's a colour I like. It's a colour that makes me feel like I could be a bit less beige. ...Sorry. That was a lot. I'm going to hide in the lockers now.`),
      narrate(`She presses the damp page into my hands, and runs a lap of the corridor. Then she runs back, bright pink, and takes the page again to sign the corner. "Reyes, 1st year. For Teo."`),
      say('mari', 'happy', `Te lo regalo. It's yours. Don't hang it in the cafeteria, the dragon would be jealous.`),
      giveItem('sketchbook'), sfx('item'),
      setFlag('mari_gave_colour'),
      fade('in', 200),
    ],
  }),
];
