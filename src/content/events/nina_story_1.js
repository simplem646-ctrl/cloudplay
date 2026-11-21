// Nina Calder, "the Sprinter" (S2). Year 1 beats: meet, spark, secret, Sports Festival (+ missed-moment version).
// Voice: loud, teasing, sports metaphors; calls Theo "Newbie" until 4 hearts (the secret scene is where that ends).
// Windows are wide on purpose: nothing here hard-locks a later beat.

import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, pose, emote, cam, fade, flash,
  lighting, sfx, music, banner, setFlag, friend, stat, giveItem, quest, callScene, wait,
  all, any, not,
} from '../../sim/script_dsl.js';

const ev = (o) => ({ kind: 'romance', priority: 60, repeat: 'once', skippable: true, ...o });

export default [
  // ------------------------------------------------------------------------------------------------ 01 meet
  ev({
    id: 'nina_01_meet', title: 'Bread Delivery Collision', priority: 70,
    trigger: { type: 'enterMap', map: 'town_square', time: ['05:30', '08:15'] },
    when: { notSeen: 'nina_01_meet' },
    script: [
      fade('out', 300), place('theo', 'center', 'left'), place('nina', 'road_west', 'right'), lighting('day'), music('town_spring'), fade('in', 400),
      narrate(`Somewhere past seven on my first morning in Bellhaven, the square smells like warm bread and I have no idea where the school is.`),
      think(`Aunt Roz said "up the hill." The hill is large and has several opinions.`),
      sfx('step_stone'), emote('nina', 'exclaim'),
      say('nina', 'happy', `HEADS UP! Coming through! Left! Your OTHER left!`),
      moveTo('nina', 'center', { speed: 'run' }),
      sfx('hit'), cam({ shake: { amp: 4, ms: 300 } }), pose('theo', 'surprised'), pose('nina', 'surprised'),
      narrate(`A basket takes flight. Eleven rolls leave on a short, doomed adventure across the cobbles.`),
      say('nina', 'surprised', `The rolls! Oh no, no no no, the rolls!`),
      say('nina', 'angry', `You were standing in the middle of my route! Do you know how many people stand in my route? Nobody! Because I'm FAST!`),
      choice([
        opt(`"Are you okay? Your rolls..."`, [
          say('nina', 'surprised', `Am I okay? You got flattened by a ponytail and you're asking if I'm okay?`),
          say('nina', 'happy', `...Huh. Nobody asks that. Okay, you're alright. Help me catch the rolls.`),
          friend('nina', 3), setFlag('nina_meet_kind'),
        ]),
        opt(`"You ran straight into me."`, [
          say('nina', 'angry', `I RAN ALONGSIDE you. You walked INTO the alongside!`),
          say('nina', 'smug', `...Fine. Fair. Shared fault. I never admit that. Mark the date.`),
          friend('nina', 3), setFlag('nina_meet_honest'),
        ]),
        opt(`"Do you always tackle strangers?"`, [
          say('nina', 'happy', `Only the slow ones! It's a public service!`),
          say('nina', 'happy', `Ha! You're quick with a line, I like it. Not quick with your feet. But the line!`),
          friend('nina', 4), setFlag('nina_meet_playful'),
        ]),
      ]),
      moveTo('theo', 'spot_a', { wait: false }), moveTo('nina', 'spot_b'),
      narrate(`We chase down rolls together. One has rolled into the fountain. She lets it go with the dignity of a captain going down with a ship.`),
      say('nina', 'happy', `Five-second rule applies to everything except the fountain one. RIP, fountain roll.`),
      say('nina', 'neutral', `Wait. New blazer. New face. You're the transfer kid! Class 1-B, right? I saw the roster. Nina Calder. Track captain. Calder Bakery.`),
      say('theo', 'happy', `Theo Hartley. I'm looking for the school.`),
      say('nina', 'happy', `Up the hill, can't miss it. Or you can miss it, and that'd be funny. Okay, Newbie! Take a roll, you've earned it. Call it a collision fee.`),
      giveItem('bread'), sfx('item'),
      say('nina', 'smug', `Race you to the gate? No? Smart. I'd win. See you in class, Newbie!`),
      moveTo('nina', 'road_north', { speed: 'run' }),
      emote('theo', 'sparkle'),
      think(`Eleven rolls, one collision, zero introductions. The town has a pulse, and it just ran past me.`),
      setFlag('nina_met'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 02 spark
  ev({
    id: 'nina_02_spark', title: 'Newbie vs Captain',
    trigger: { type: 'enterMap', map: 'school_field', time: ['15:30', '18:30'] },
    when: { all: [{ hearts: ['nina', '>=', 2] }, { notSeen: 'nina_02_spark' }] },
    script: [
      fade('out', 300), place('theo', 'spot_a', 'right'), place('nina', 'track_start', 'down'), lighting('sunset'), music('sports'), fade('in', 400),
      narrate(`After class the track belongs to Nina. She is doing lunges at a speed that feels personal.`),
      say('nina', 'happy', `Newbie! You came to watch the captain! Sit, sit! Heckle responsibly!`),
      say('theo', 'happy', `I'm just walking home the long way.`),
      say('nina', 'smug', `Nobody walks home the long way past a track unless they secretly want to race. Sixty metres. I'll give you a ten-metre head start. I'm generous.`),
      choice([
        opt(`"Take the head start. Thanks."`, [
          say('nina', 'happy', `Smart! A man who knows his limits!`),
          setFlag('nina_dare_headstart'),
        ]),
        opt(`"No head start. Sixty flat."`, [
          say('nina', 'surprised', `Oh? Oh! Confidence! I love it. It'll hurt a little, but I love it.`),
          friend('nina', 2), setFlag('nina_dare_flat'),
        ]),
        opt(`"I'll run it backwards."`, [
          say('nina', 'happy', `BACKWARDS?! Are you kidding me?! Someone get this man a medal and a nurse!`),
          friend('nina', 2), setFlag('nina_dare_backwards'),
        ]),
      ]),
      click(),
      callScene('minigame', 'track_sprint', { event: 'nina_dare' }, 'nina_dare'),
      iff({ counter: ['nina_dare_rank', '>=', 2] }, [
        sfx('cheer'), pose('nina', 'surprised'),
        say('nina', 'surprised', `You... beat me?! No. No no no. That was a warm-up! I was warming up! ...with my face!`),
        say('nina', 'happy', `Okay. Okay! Newbie is fast! That's the best news I've had all week. Rematch! Soon! I'm doing it now! Wait, no, I'll lose again.`),
        friend('nina', 5), stat('fitness', 1),
      ], [
        pose('nina', 'cheer'),
        say('nina', 'happy', `NINE POINT NOTHING! I could do it again! I could do it in my sleep! You run like you're carrying groceries, Newbie!`),
        say('nina', 'smug', `Good groceries though. Solid effort. I'd draft you for relay leg four, which is the one nobody wants.`),
        friend('nina', 4), stat('fitness', 1),
      ]),
      say('nina', 'happy', `Ahh, nothing like it. The wind in your teeth. That's my favourite thing in the world.`),
      moveTo('nina', 'spot_b', { speed: 'walk' }),
      emote('nina', 'sweat'),
      narrate(`She turns to grab her water bottle and, for half a second, her hand drops to her knee and presses. Then it's back at her side, as if it had never moved.`),
      think(`That was not a stretch. That was a hand holding something shut.`),
      say('nina', 'happy', `Anyway! I jog the bread at 05:30. Harbor, then square, then school. If you're ever up, come along. Bring legs.`),
      say('nina', 'smug', `Bring MORE legs than today. That's all I'm saying.`),
      setFlag('nina_spark_done'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 03 secret
  ev({
    id: 'nina_03_secret', title: 'Tactical Sitting',
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['05:20', '07:30'] },
    when: { all: [{ hearts: ['nina', '>=', 4] }, { seen: 'nina_02_spark' }, { notSeen: 'nina_03_secret' }] },
    script: [
      fade('out', 300), place('theo', 'center', 'right'), place('nina', 'dock_bench', 'left'), lighting('auto'), music('beach'), fade('in', 500),
      narrate(`The harbor at dawn. Grey water going gold, gulls arguing about fish, and one runner with a bread basket sitting very still.`),
      say('nina', 'happy', `Oh! Hey! Theo! ...Not now, I'm not... resting. Tactical sitting. It's a recognised technique.`),
      narrate(`She has a cold can pressed to her knee, hidden under the bread basket. It's not hidden well.`),
      choice([
        opt(`Sit beside her. Say nothing.`, [
          narrate(`I sit. The water slaps the dock. A gull judges us.`),
          say('nina', 'neutral', `...You're not going to say anything.`),
          say('nina', 'sad', `That's way worse. Say something, so I can joke about it.`),
          friend('nina', 3), setFlag('nina_sec_open_kind'),
        ]),
        opt(`"That's not tactical. That's pain."`, [
          say('nina', 'angry', `It's NOT pain, it's...`),
          say('nina', 'sad', `...It's pain. Don't tell the captain I said so.`),
          friend('nina', 3), setFlag('nina_sec_open_honest'),
        ]),
        opt(`"Mind if I tactically sit too?"`, [
          say('nina', 'happy', `Ha! Permission granted. Elbows in, soldier.`),
          say('nina', 'neutral', `...You saw it on the field, didn't you. The knee.`),
          friend('nina', 3), setFlag('nina_sec_open_playful'),
        ]),
      ]),
      music('sad', 600),
      say('nina', 'sad', `Last spring. The regional qualifier. Second bend, two hundred metres out, I was winning. Something popped. I heard it. Like a snapped rubber band.`),
      say('nina', 'neutral', `The scans say it's healed. Perfect. Doctor said, "you can run when you feel ready." So I run. Every morning. And every morning it says "not yet."`),
      say('nina', 'sad', `But everyone's waiting for the comeback. Mom looks at me like I'm glass. Coach counts my laps like a bank teller. The whole school thinks I'm "almost back."`),
      say('nina', 'sad', `And I'm scared that if I'm not fast, I'm nothing. I'm just a girl with a basket of rolls and a bad leg.`),
      think(`She's said it fast, like ripping off a bandage, and now she's staring very hard at the lighthouse.`),
      choice([
        opt(`"You deliver bread at 5:30. Limping."`, [
          say('theo', 'neutral', `Every day, in all weather, with a leg that says no. That's not "nothing." That's the opposite.`),
          say('nina', 'surprised', `...Okay. That's, uh. Hold on. Something in my eye. It's a gull. Whatever.`),
          friend('nina', 6), setFlag('nina_sec_kind'),
        ]),
        opt(`"Tell your coach. Tell your mom."`, [
          say('theo', 'neutral', `You can't outrun this alone. You're a captain, so you know what teams are for.`),
          say('nina', 'thinking', `...I hate that you used a team metaphor on me. Because it's good.`),
          friend('nina', 6), setFlag('nina_sec_honest'),
        ]),
        opt(`"Fast is what you do, not what you are."`, [
          say('theo', 'happy', `Also you eat sandwiches painfully slowly. I'm still holding that over you. I have footage.`),
          say('nina', 'happy', `You do NOT. I eat sandwiches in a respectable time! Take that back!`),
          friend('nina', 5), setFlag('nina_sec_playful'),
        ]),
      ]),
      music('romantic', 800),
      say('nina', 'happy', `Theo. ...I just called you Theo. Not Newbie. I noticed. You noticed. We both noticed.`),
      say('nina', 'neutral', `You earned it. Newbies don't get told about knees. Not a word to anyone, okay? Deal? Pinkie swear? I'll bribe you.`),
      giveItem('bread'), sfx('item'),
      say('nina', 'smug', `One pay-for-silence roll. Sealed with butter. Don't tell Mom I used the good butter.`),
      quest('nina_comeback', 'start', `Nina's knee still hurts when she pushes. She told me, and nobody else. Be the one who doesn't treat her like glass.`),
      moveTo('nina', 'road_east', { speed: 'walk' }),
      say('nina', 'happy', `Race you to the square! ...Walking! Slowly! Tactically!`),
      setFlag('nina_secret_known'),
      fade('in', 200),
    ],
  }),

  // ------------------------------------------------------------------------------------------------ 04 festival: Sports Festival Y1 (relay final)
  ev({
    id: 'nina_04_festival', title: 'The Last Leg',
    trigger: { type: 'clock', at: '14:30', map: 'school_field' },
    when: { all: [{ festival: 'sports_festival' }, { year: 1 }, { hearts: ['nina', '>=', 3] }, { notSeen: 'nina_04_festival' }] },
    priority: 65,
    script: [
      fade('out', 300), place('theo', 'relay_start', 'right'), place('nina', 'spot_b', 'right'), place('coach_mitchell', 'track_finish', 'down'), place('dante', 'spot_c', 'right'),
      lighting('day'), music('sports'), fade('in', 400),
      banner('Final Relay', 'Class A vs Class B', 1800),
      say('coach_mitchell', 'happy', `Final heat! Class B anchors with Calder! Nobody die dramatically, I have paperwork!`),
      say('dante', 'smug', `Third leg is Hartley. Don't worry, Nina. If he drops it, I'll get him to pick it up. Gently.`),
      say('nina', 'happy', `Newbie! Clean hand-off, no sudden moves, no fumbling, no apologising! I'll do the rest!`),
      sfx('whistle'),
      narrate(`The third leg is a blur of wind and the sound of my own breathing. Nina is on the mark ahead, bouncing, one hand behind her back and open.`),
      choice([
        opt(`Slap it firmly into her palm.`, [
          sfx('hit'), say('nina', 'happy', `OW! Perfect! DO IT AGAIN, I mean, don't, I'm running!`),
          friend('nina', 3), setFlag('nina_fest_slap'),
        ]),
        opt(`"Go, Nina!" and let go softly.`, [
          say('nina', 'happy', `Heard! Taken! Gone!`),
          friend('nina', 3), setFlag('nina_fest_soft'),
        ]),
        opt(`"Your knee..." as it leaves my hand.`, [
          say('nina', 'angry', `NOT NOW!`),
          say('nina', 'neutral', `...Ask me after! GO, ME!`),
          friend('nina', 2), setFlag('nina_fest_asked'),
        ]),
      ]),
      moveTo('nina', 'track_start', { speed: 'run', wait: false }),
      narrate(`She starts third, ends second, and passes Class A's anchor on the last bend like the track was never meant to hold anyone else.`),
      narrate(`And at the second bend, a half-step hitch. A tiny stumble. A grimace. She doesn't slow down.`),
      moveTo('nina', 'track_finish', { speed: 'run' }),
      sfx('cheer'), flash(250, '#ffffff'),
      say('coach_mitchell', 'surprised', `CLASS B BY A TOE! Hundredths of a second! Somebody write this down! I'll write it down!`),
      say('dante', 'happy', `Calder!! That's my Class B!! I'm crying! It's sweat! It's definitely sweat!`),
      moveTo('theo', 'spot_b', { wait: false }), pose('nina', 'sit'),
      narrate(`She's on the infield grass, grinning at the sky, a towel thrown over her knee.`),
      say('nina', 'happy', `Did you see it?! Did you SEE the hand-off?! Best of my whole life!`),
      iff({ seen: 'nina_03_secret' }, [
        say('nina', 'neutral', `...It's okay. I'm okay. It's just... It said a word. A short one. It's quiet now.`),
        choice([
          opt(`Sit down. Pass her the sports drink.`, [
            say('nina', 'shy', `Thanks. ...Stay a minute? The sky's good from here.`),
            friend('nina', 5), setFlag('nina_fest_kind'),
          ]),
          opt(`"We're getting that looked at. Tomorrow."`, [
            say('nina', 'thinking', `...Tomorrow. Yeah. Maybe. Okay. Not today, today I won.`),
            friend('nina', 5), setFlag('nina_fest_honest'),
          ]),
          opt(`"Does the baton get a medal for assistance?"`, [
            say('nina', 'happy', `The baton gets a medal! The baton gets a cake! The baton gets a stupid hat!`),
            friend('nina', 5), setFlag('nina_fest_playful'),
          ]),
        ]),
      ], [
        say('nina', 'neutral', `Just a cramp. It happens. Cramps are... a thing. Don't make it a thing.`),
        think(`That wasn't a cramp. That was the same hand-on-the-knee I saw at the track. She's not ready to say it. I can wait.`),
        choice([
          opt(`"Okay. A cramp. I believe you."`, [
            say('nina', 'shy', `...Thanks, Newbie. You're not terrible at this.`),
            friend('nina', 4), setFlag('nina_fest_trust'),
          ]),
          opt(`"Cramps don't wipe out smiles like that."`, [
            say('nina', 'surprised', `...You noticed that?`),
            say('nina', 'neutral', `Okay. Maybe later. Not today. Today I won.`),
            friend('nina', 4), setFlag('nina_fest_noticed'),
          ]),
        ]),
      ]),
      say('nina', 'happy', `Anyway! I ran the last leg! And I wasn't scared! For eleven seconds! That's a record for me this year!`),
      setFlag('nina_relay_y1_done'),
      fade('in', 200),
    ],
  }),

  ev({
    id: 'nina_04_festival_friend', title: 'From the Bleachers',
    trigger: { type: 'enterMap', map: 'school_field', time: ['14:00', '18:30'] },
    when: {
      all: [
        { festival: 'sports_festival' }, { year: 1 }, { notSeen: 'nina_04_festival' },
        { any: [{ hearts: ['nina', '<', 3] }, { time: ['14:31', '18:30'] }] },
      ],
    },
    script: [
      fade('out', 300), place('theo', 'bleacher_low', 'down'), place('nina', 'track_finish', 'up'), lighting('day'), music('sports'), fade('in', 400),
      narrate(`I catch the end of the relay from the bleachers. Class B is already cheering, and in the middle of it, Nina is bent over her knees, laughing and gasping at once.`),
      say('nina', 'happy', `Newbie! You missed the finish! I won by a toe! A TOE! A toe is the best part of the body!`),
      say('nina', 'neutral', `Hold this for me?`),
      giveItem('sports_drink'), sfx('item'),
      narrate(`She hands over the drink and walks away with the tiniest hitch in her step, the kind you only see if you're looking.`),
      think(`Not my business. Not yet.`),
      friend('nina', 2),
      setFlag('nina_fest_missed'),
      fade('in', 200),
    ],
  }),
];

// small helper: a one-beat stage direction between the choice and the race
function click() { return sfx('whistle'); }
