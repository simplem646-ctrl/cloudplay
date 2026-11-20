// Festival frames (story workstream S1). One event per FESTIVALS[].eventId, repeat 'daily',
// year-aware via iff({year}). Staged ONLY on tier-1 maps; where the calendar `place` is not
// built yet the frame is staged on the nearest tier-1 map (noted per event).
// Evening hooks: fest_<festivalId>_y<year>_with_<nina|elise|clara|mari|vera|friends|alone>.

import {
  say, narrate, think, choice, opt, iff, place, moveTo, emote, sfx, music, banner, flash,
  lighting, setFlag, friend, stat, money, spirit, callScene, all,
} from '../../sim/script_dsl.js';
import { open, eveningAllYears, friendsBeat } from './fest_shared.js';

const fest = (id, title, trigger, maps, script) => ({
  id: `fest_${id}`, title, kind: 'festival', priority: 90, repeat: 'daily', skippable: true,
  trigger: { type: 'auto', time: trigger },
  when: all({ festival: id }, { map: maps }),
  script: [...script, setFlag(`fest_${id}_attended`)],
});
const byYear = (y1, y2, y3) => [iff({ year: 1 }, y1), iff({ year: 2 }, y2), iff({ year: 3 }, y3)];
const ban = (name) => byYear([banner(name, 'Year 1')], [banner(name, 'Year 2')], [banner(name, 'Year 3')]);
const friendsFor = (j, d, o) => (y) => friendsBeat(y, j, d, o);

export default [
  fest('entrance_ceremony', 'Entrance Ceremony', ['08:20', '11:00'], ['school_grounds', 'school_hall_1f'], [
    ...open('school_grounds', 'ceremony_spot', [place('principal_marsh', 'stage', 'down'), place('ms_delaney', 'npc_1', 'down'),
      place('clara', 'npc_2', 'up'), place('jules', 'npc_3', 'up'), place('theo', 'ceremony_spot', 'up'), music('festival')]),
    ...ban('Entrance Ceremony'),
    narrate('Cherry petals drift over rows of folding chairs. Somebody\'s little brother is asleep on the gate.'),
    ...byYear([
      say('principal_marsh', 'happy', 'Welcome to Bellhaven High. One hundred and eighteen of you. Every one of you counts, and I do mean counts.'),
      say('principal_marsh', 'neutral', 'You may notice our bell does not ring. We are patient people. Patience is just hope wearing sensible shoes.'),
      say('bruno', 'happy', 'WELCOME, KIDS!'),
      think('A principal who sounds kind and a little worried. A school on a hill. Okay, Bellhaven. Let\'s see.'),
      think('Homeroom next. Second floor, Class B.'),
    ], [
      say('principal_marsh', 'happy', 'Welcome back, and welcome to our first-years. Please mind the step. Every year someone does not.'),
      sfx('hit'), emote('kit', 'sweat'),
      say('kit', 'surprised', "I'm okay! The step is also okay!"),
      say('jules', 'happy', 'And THAT, folks, is how a legend begins. Bellhaven Press, live.'),
    ], [
      say('principal_marsh', 'neutral', 'Eleven new faces this year. We will know every name by Friday. That is a promise, not a statistic.'),
      say('principal_marsh', 'thinking', 'For our third-years: this is your last first day. Spend it well. Then spend the rest better.'),
      think('Last first day. Make it count.'),
    ]),
    say('ms_delaney', 'happy', 'Homerooms, people! Coffee waits for no one.'),
    spirit(2),
  ]),

  fest('club_fair', 'Club Fair', ['15:10', '17:30'], ['school_grounds'], [
    ...open('school_grounds', 'courtyard', [place('nina', 'stall_a', 'down'), place('mari', 'stall_b', 'down'), place('owen', 'stall_c', 'down'),
      place('elise', 'stall_d', 'down'), place('coach_mitchell', 'npc_1', 'down'), place('theo', 'courtyard', 'up'), music('festival')]),
    ...ban('Club Fair'),
    say('coach_mitchell', 'happy', 'TRACK! SOCCER! Fresh air and character! Sign up and MOVE IT!'),
    say('nina', 'happy', 'Track Club! We run, we win, we eat! Mostly in that order!'),
    say('mari', 'happy', 'Art Club! We have paint, snacks, and absolutely no tidiness! Come be messy with us!'),
    say('elise', 'shy', 'Literature Club... we read, we write... there is tea... that is the pitch, sorry...'),
    say('owen', 'neutral', 'Astronomy Club. The universe is ninety-five percent unknown. Membership is ninety-five percent snacks.'),
    iff({ club: null }, [
      think('Music room has a sign: "Music Club. Don\'t." Somehow that is a pitch too.'),
      choice([
        opt('Something sporty', [choice([
          opt('Join Track & Field', [setFlag('club_pick_track'), friend('nina', 3)]),
          opt('Join Soccer', [setFlag('club_pick_soccer'), friend('jules', 3)]),
        ])]),
        opt('Something creative', [choice([
          opt('Join the Art Club', [setFlag('club_pick_art'), friend('mari', 3)]),
          opt('Join the Music Club', [setFlag('club_pick_music'), friend('vera', 2)]),
          opt('Join the Literature Club', [setFlag('club_pick_literature'), friend('elise', 3)]),
        ])]),
        opt('Join the Astronomy Club', [setFlag('club_pick_astronomy'), friend('owen', 3)]),
        opt('Just looking around', [think('No rush. Advisors take sign-ups any day.'), setFlag('main_club_undecided')]),
      ]),
    ], [
      think('This year I am on the other side of the stall. Recruiting. Try to look approachable.'),
      stat('charm', 1),
    ]),
    spirit(3),
  ]),

  fest('blossom_day', 'Blossom Day', ['10:00', '20:00'], ['town_park'], [
    ...open('town_park', 'cherry_tree', [place('roz', 'picnic_a', 'down'), place('mrs_calder', 'picnic_b', 'down'), place('mari', 'bridge', 'down'),
      place('theo', 'road_west', 'right'), music('festival')]),
    ...ban('Blossom Day'),
    narrate('Paper lanterns in the cherry trees. Picnic blankets everywhere. A petal lands in somebody\'s tea, which is apparently good luck.'),
    say('roz', 'happy', 'Theo! Grab a cup! The Lantern Café is on blossom duty! Tea, scones, and gossip, all free!'),
    say('mrs_calder', 'happy', 'Have a roll, dear. They are pink today. Do not ask how.'),
    choice([
      opt('Help Roz at the tea stall', [say('roz', 'smug', 'Hired for the day! Pay: fifteen dollars and my eternal approval.'), money(15), stat('charm', 1), friend('roz', 3)]),
      opt('Sit under the cherry tree', [think('Petals, sun, the pond. For a minute nothing needs fixing.'), stat('creativity', 1)]),
    ]),
    ...byYear([think('There is an old man on a bench glaring at a cherry tree. He looks like a story.')], [], [think('Third Blossom Day. The petals look the same. I don\'t.')]),
    spirit(3),
  ]),

  fest('regional_meet', 'Regional Track Meet', ['09:00', '17:00'], ['school_field'], [
    ...open('school_field', 'bleacher_low', [place('coach_mitchell', 'track_start', 'down'), place('nina', 'relay_start', 'up'),
      place('jules', 'bleacher_top', 'down'), place('theo', 'bleacher_low', 'up'), music('sports')]),
    ...ban('Regional Track Meet'),
    say('coach_mitchell', 'happy', 'Coast schools on OUR track! Bellhaven, we are hosts and we are HUNGRY! Move it!'),
    say('jules', 'happy', 'Bellhaven Press, live from the bleachers! The sun is out, the hot dogs are suspicious!'),
    iff({ club: 'track' }, [
      say('coach_mitchell', 'neutral', 'Hartley! You are in the hundred. Lane four. Run like the bell depends on it.'),
      callScene('minigame', 'track_sprint', { event: 'regional_meet' }, 'fest_meet'),
      iff({ counter: ['fest_meet_rank', '>=', 2] }, [sfx('cheer'), say('coach_mitchell', 'happy', 'That is a PODIUM! Bellhaven!'), spirit(3)]),
    ], [
      choice([
        opt('Cheer from the bleachers', [sfx('cheer'), stat('charm', 1)]),
        opt('Hand out water at the finish', [stat('fitness', 1), friend('coach_mitchell', 3)]),
      ]),
    ]),
    spirit(3),
  ]),

  // Calendar place is `beach` (not built yet): staged at town_harbor by the beach stairs.
  fest('beach_day', 'Beach Day', ['10:00', '18:00'], ['town_harbor', 'beach'], [
    ...open('town_harbor', 'stairs_beach', [place('roz', 'npc_1', 'down'), place('mari', 'npc_2', 'down'), place('dante', 'npc_3', 'down'),
      place('theo', 'stairs_beach', 'up'), music('festival')]),
    ...ban('Beach Day'),
    narrate('The whole town is heading down to the cove with umbrellas, coolers and one inflatable whale nobody will claim.'),
    say('dante', 'smug', 'Sandcastle contest. I will build a fortress. You will build a hut. History will remember.'),
    say('mari', 'happy', 'Teo! The sand is a canvas! The tide is a critic, but a fair one!'),
    choice([
      opt('Build sandcastles with Dante', [say('dante', 'angry', 'Your moat is BETTER than mine? Rematch next year.'), friend('dante', 3)]),
      opt('Hunt for shells', [callScene('activity', 'shell_hunt')]),
      opt('Nap under Roz\'s umbrella', [say('roz', 'happy', 'Sleep, sleep. I will guard you from gulls and sunburn.'), friend('roz', 2)]),
    ]),
    spirit(3),
  ]),

  // Calendar place is `beach` (not built yet): staged at town_harbor, dock_end, facing the water.
  fest('fireworks', 'Fireworks Night', ['18:00', '22:30'], ['town_harbor', 'beach'], [
    ...open('town_harbor', 'dock_end', [place('mayor_greer', 'lantern_row', 'down'), place('tomas', 'fish_stall', 'down'),
      place('theo', 'dock_bench', 'up'), lighting('night'), music('fireworks')]),
    ...ban('Fireworks Night'),
    say('mayor_greer', 'happy', 'Wonderful, wonderful evening! On my count! Ten! Nine! ...I have lost count! Just launch them!'),
    sfx('fireworks'), flash(300, '#ffd27a'), sfx('fireworks'), flash(300, '#9ad0ff'),
    say('tomas', 'neutral', 'Glowsticks. Two dollars. Or one dollar and a story. Make it a good one.'),
    ...eveningAllYears('fireworks', {
      prompt: 'Summer\'s last big night. Who do I want next to me when the sky lights up?',
      nina: 'Nina said she\'d grab the best spot on the dock. "Best" meaning closest to the snacks.',
      elise: 'Elise is on the harbor steps with a notebook, writing by firework light.',
      clara: 'Clara is standing very straight by the lantern row, pretending not to watch the sky.',
      mari: 'Mari is sketching the fireworks faster than they can explode.',
      vera: 'Vera is at the far end of the dock, headphones off for once, listening to the booms.',
      friends: friendsFor('Best seats! I sat on them so nobody else could!', 'These fireworks lack drama. I could do better.', 'Each burst is about a hundred grams of salts. Statistically beautiful.'),
      alone: [think('The colours land on the water twice. Once up there, once down here.')],
    }),
    spirit(3),
  ]),

  fest('sports_festival', 'Sports Festival', ['09:00', '16:00'], ['school_field'], [
    ...open('school_field', 'relay_start', [place('coach_mitchell', 'track_finish', 'down'), place('nina', 'npc_1', 'up'), place('dante', 'npc_2', 'up'),
      place('clara', 'bleacher_low', 'down'), place('theo', 'relay_start', 'up'), music('sports')]),
    ...ban('Sports Festival'),
    say('coach_mitchell', 'happy', 'Class against class! Relays! Tug-of-war! PRIDE! Class B, you are up! MOVE IT!'),
    say('nina', 'happy', 'Relay leg three is yours! Take the baton, run, do NOT drop it, do not think about dropping it!'),
    callScene('minigame', 'track_sprint', { event: 'sports_relay' }, 'fest_relay'),
    iff({ counter: ['fest_relay_rank', '>=', 2] }, [
      sfx('cheer'), say('dante', 'happy', 'CLASS B! CLASS B! I am so loud right now! I regret nothing!'), spirit(2),
    ], [
      say('clara', 'neutral', 'Third is a podium position in several respectable countries.'),
    ]),
    spirit(3),
  ]),

  // Calendar place is `hill_observatory` (not built yet): staged on the school_rooftop under the moon.
  fest('moon_night', 'Moon Viewing Night', ['18:30', '22:30'], ['school_rooftop', 'school_grounds', 'hill_observatory'], [
    ...open('school_rooftop', 'fence_a', [place('dr_fennel', 'fence_b', 'up'), place('owen', 'bench', 'up'), place('theo', 'center', 'up'),
      lighting('night'), music('festival')]),
    ...ban('Moon Viewing Night'),
    say('dr_fennel', 'happy', 'Fascinating! The biggest moon of the year! Three hundred and eighty thousand kilometres and STILL showing off!'),
    say('owen', 'neutral', 'I brought dumplings and a telescope. The dumplings are more popular. As predicted.'),
    choice([
      opt('Try the telescope', [callScene('minigame', 'astronomy_stars', { event: 'moon_night' }), stat('science', 1)]),
      opt('Eat moon dumplings', [say('owen', 'neutral', 'Eight dumplings. A personal best for this rooftop.'), friend('owen', 2)]),
    ]),
    ...eveningAllYears('moon_night', {
      prompt: 'The moon is enormous tonight. Who should be here to see it?',
      nina: 'Nina is racing up the hill path with a thermos, determined to see the moon "first".',
      elise: 'Elise is reading by moonlight, which she insists is a real kind of light.',
      clara: 'Clara is up at the observatory dome, alone with a star chart.',
      mari: 'Mari is trying to mix the exact silver of the moon on a paper plate.',
      vera: 'Vera is on the far bench, humming something too quiet to name.',
      friends: friendsFor('The moon is basically a big rice cake. Hot take.', 'I could reach it. With a run-up.', 'You could not. Three hundred eighty thousand kilometres.'),
      alone: [think('Same moon over Mom and Dad tonight, somewhere. That helps more than I expected.')],
    }),
    spirit(3),
  ]),

  fest('bell_festival', 'Bell Festival', ['09:00', '20:00'], ['school_grounds'], [
    ...open('school_grounds', 'courtyard', [place('jules', 'stage', 'down'), place('ms_delaney', 'stall_a', 'down'), place('mari', 'stall_b', 'down'),
      place('mrs_calder', 'stall_c', 'down'), place('townie_01', 'npc_1', 'up'), place('townie_02', 'npc_2', 'up'),
      place('theo', 'gate', 'up'), music('festival')]),
    ...ban('Bell Festival'),
    say('jules', 'happy', 'Welcome to the Bell Festival! Stalls! Stages! A haunted something! Bellhaven Press is LIVE and slightly hoarse!'),
    ...byYear([
      iff({ flag: 'main_y1_booth_cafe' }, [say('ms_delaney', 'smug', 'Class B café, Hartley. Apron. Smile. Do not drink the profits.'), callScene('minigame', 'cafe_serve', { event: 'bell_festival' })]),
      iff({ flag: 'main_y1_booth_haunted' }, [narrate('Class B\'s haunted classroom. Nina, in a sheet, sprints past screaming. Dante screams back, theatrically.'), friend('nina', 2)]),
      iff({ flag: 'main_y1_booth_play' }, [narrate('The play. Dante\'s knight saves the harbor. Your one line, "Yes, my lord", gets a standing ovation.'), stat('charm', 2)]),
    ], [
      say('mrs_calder', 'happy', 'Raise the Roof! Every roll sold goes to the gym! Have a roll, dear. Buy a roll, dear!'),
      iff({ flag: 'main_y2_fund_concert' }, [narrate('Mr. Quill\'s courtyard concert. Dante gets eleven seconds on tambourine and uses all of them.')]),
      iff({ flag: 'main_y2_fund_market' }, [narrate('Every shop in town has a stall on the hill. The town came up to the school, just like Clara said.')]),
      iff({ flag: 'main_y2_fund_run' }, [narrate('Kit runs the hill again and again. Jules commentates every lap. Sponsors pay up out of pure concern.')]),
      spirit(2),
    ], [
      say('mari', 'happy', 'The biggest festival ever, Teo! Even the board is here! Smile at the board!'),
      narrate('Mrs. Voss walks the stalls with her clipboard. She buys a roll. She eats the roll. She writes something down.'),
      spirit(2),
    ]),
    iff({ day: 28 }, eveningAllYears('bell_festival', {
      prompt: 'The closing bonfire is being lit. Who do I want to find before it goes up?',
      nina: 'Nina is by the bonfire, challenging people to a "warmest hands" contest.',
      elise: 'Elise is in the library window, watching the crowd and writing it down.',
      clara: 'Clara is counting the takings at the council desk. Again. For calm.',
      mari: 'Mari is at the art exhibit, straightening a painting nobody else thinks is crooked.',
      vera: 'Vera is on the rooftop, where the noise is just a hum.',
      friends: friendsFor('We survived! The festival! Mostly!', 'I was the star. Of everything. Quietly.', 'Attendance up nineteen percent. I am, statistically, thrilled.'),
      alone: [think('The whole yard is glowing. I just want to look at it for a second.')],
    })),
    spirit(3),
  ]),

  fest('lantern_night', 'Lantern Night', ['17:30', '22:30'], ['town_harbor'], [
    ...open('town_harbor', 'lantern_row', [place('roz', 'npc_1', 'down'), place('mr_finch', 'finch_spot', 'down'), place('theo', 'lantern_row', 'down'),
      lighting('lantern'), music('festival')]),
    ...ban('Lantern Night'),
    narrate('Hundreds of paper lanterns drift out over the dark water. Each one carries a wish written on the inside.'),
    say('roz', 'happy', 'Write your wish, kiddo. Don\'t show anyone. That\'s the rule. Also the fun.'),
    choice([
      opt('Wish for the bell to ring', [setFlag('fest_lantern_wish_bell')]),
      opt('Wish for everyone to stay', [setFlag('fest_lantern_wish_stay')]),
      opt('Wish for something private', [setFlag('fest_lantern_wish_private')]),
    ]),
    ...eveningAllYears('lantern_night', {
      prompt: 'The lanterns are drifting out. Who do I want to watch them with?',
      nina: 'Nina is at the end of the dock, trying to out-race a lantern along the pier.',
      elise: 'Elise is folding a second lantern, for a character in her story.',
      clara: 'Clara is on the promenade, lantern unlit, still deciding on a wish.',
      mari: 'Mari painted her lantern. It is the prettiest one on the water. She is hiding behind it.',
      vera: 'Vera is by the water, humming something under her breath.',
      friends: friendsFor('I wished for a press pass. Do not tell anyone.', 'I wished to win. At what? Yes.', 'I wished for clear skies. Statistically, a safe wish.'),
      alone: [think('My lantern joins all the others. Hard to tell which one is mine. That feels right.')],
    }),
    spirit(3),
  ]),

  fest('heart_day', 'Heart Day', ['07:30', '18:00'], ['school_grounds', 'school_hall_1f'], [
    ...open('school_grounds', 'courtyard', [place('jules', 'npc_1', 'down'), place('theo', 'gate', 'up'), music('festival')]),
    ...ban('Heart Day'),
    narrate('Chocolates in lockers, notes in shoe cubbies, and a general air of everyone pretending to be calm.'),
    say('jules', 'happy', 'Friendship chocolate for my best guy. It is shaped like a soccer ball. It is mostly a circle.'),
    friend('jules', 2),
    ...['nina', 'elise', 'clara', 'mari', 'vera'].map((id) => iff({ hearts: [id, '>=', 4] }, [
      say(id, 'shy', {
        nina: 'Here. Chocolate. It is protein-adjacent. Do not make it a thing.',
        elise: '...I made these. The shape was meant to be a book. It is... a brick.',
        clara: 'A token of regard. Dark chocolate. Seventy percent. Do not read into the percentage.',
        mari: 'Teo! Chocolate! I painted the box! The chocolate is fine, the box is the art!',
        vera: 'Licorice. Chocolate is overrated. ...Fine, there is one chocolate in there.',
      }[id]),
      friend(id, 3),
    ])),
    ...eveningAllYears('heart_day', {
      prompt: 'After school. Heart Day is not quite over. Who should I find?',
      nina: 'Nina is on the field, running laps, very obviously not waiting for anyone.',
      elise: 'Elise is in the library, holding an envelope she keeps not handing to anyone.',
      clara: 'Clara is in the council room, alphabetising chocolates.',
      mari: 'Mari is in the art room, painting hearts and then painting over them.',
      vera: 'Vera is on the rooftop with Biscuit, who has eaten someone\'s chocolate.',
      friends: friendsFor('Who needs romance? We have each other. And snacks.', 'I received nine chocolates. From myself.', 'Heart Day increases cocoa consumption by four hundred percent.'),
      alone: [think('A quiet walk home. Heart Day is nice even from the outside.')],
    }),
    spirit(2),
  ]),

  // Calendar place is `school_gym` (not built yet): the ceremony is staged in the school_grounds courtyard.
  fest('closing_ceremony', 'Closing Ceremony', ['09:00', '11:30'], ['school_grounds', 'school_hall_1f'], [
    ...open('school_grounds', 'ceremony_spot', [place('principal_marsh', 'stage', 'down'), place('ms_delaney', 'npc_1', 'down'),
      place('roz', 'npc_2', 'up'), place('theo', 'ceremony_spot', 'up'), music('festival')]),
    ...byYear([
      banner('Closing Ceremony', 'Year 1'),
      say('principal_marsh', 'neutral', 'To our graduating third-years: you leave footprints on this hill. We will not sweep them.'),
      narrate('In the front row, Bruno is already crying. He promised he wouldn\'t.'),
    ], [
      banner('Closing Ceremony', 'Year 2'),
      say('principal_marsh', 'neutral', 'Another year. One more to go, for some of you. Make it a loud one.'),
    ], [
      banner('Graduation', 'Bellhaven High · Year 3'),
      say('principal_marsh', 'happy', 'Theo Hartley.'),
      moveTo('theo', 'stage'),
      say('ms_delaney', 'sad', 'Three years. I need a much larger coffee.'),
      say('roz', 'sad', 'That\'s my NEPHEW! Your parents are on the phone! Wave at the phone!'),
      setFlag('main_graduated'),
    ]),
    spirit(2),
  ]),

  fest('bell_night', 'Bell Night', ['22:30', '24:30'], ['school_grounds'], [
    ...open('school_grounds', 'courtyard', [place('mr_finch', 'tree_shade', 'down'), place('roz', 'npc_1', 'up'), place('jules', 'npc_2', 'up'),
      place('theo', 'gate', 'up'), lighting('lantern'), music('festival')]),
    ...ban('Bell Night'),
    narrate('The town climbs Lantern Hill with lanterns and cocoa to listen for the bell at midnight.'),
    ...byYear([
      say('mr_finch', 'neutral', 'It will not ring. It has not rung in thirty years. We come anyway. That is the point.'),
      iff({ flag: 'main_core_found' }, [say('mr_finch', 'thinking', 'One piece of three. Next year, maybe two.')]),
      narrate('Midnight. Silence. Then, one by one, the lanterns are lifted, and people promise to try again.'),
    ], [
      say('mr_finch', 'thinking', 'Closer. I can feel it. My knees can feel it too, but they feel everything.'),
      narrate('Midnight passes quietly. But this year, people are talking about next year like it is a date, not a wish.'),
    ], [
      say('jules', 'happy', 'This is it, Hartley-dude! Tonight we hear it!'),
      say('mr_finch', 'neutral', 'Quarter to midnight soon. Get ready, boy.'),
      setFlag('fest_bell_night_y3_gathered'),
    ]),
    spirit(3),
  ]),
];
