// Main storyline, Year 1 (story workstream S1). Ids main_01 .. main_16.
// Onboarding (Spring 1-4), the bell legend, the Bell Committee, Finch's challenge, the clapper core.
// Windows are wide on purpose: a missed beat fires at the next opportunity (never hard-lock).

import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, pose, emote, cam, fade,
  lighting, sfx, music, banner, setFlag, friend, money, stat, giveItem, quest, spirit,
  all, any, not, wait,
} from '../../sim/script_dsl.js';
import { open } from './fest_shared.js';

const story = (o) => ({ kind: 'story', priority: 80, repeat: 'once', skippable: true, ...o });
const Y1_FROM_SUMMER = any({ year: [2, 3] }, { season: ['summer', 'autumn', 'winter'] });

// ---------------------------------------------------------------- the bell legend (shared by 06/07)
const LEGEND = [
  say('mr_finch', 'neutral', 'Thirty years ago. Big storm. Wind took the slates off half the town.'),
  say('mr_finch', 'neutral', 'Bell rang all night on its own. Swinging in the gale. Cracked the clapper at the crown.'),
  say('mr_finch', 'thinking', 'So we took the clapper down. To mend it. I mended it, too.'),
  say('mr_finch', 'sad', "Then the school said 'next year'. And next year said 'next year'. And here we are."),
  think("He talks about the bell like it's an old dog that's waiting by the door."),
  say('theo', 'neutral', 'My aunt said there was a legend...'),
  say('mr_finch', 'neutral', "Hmph. Rosalind talks. Fine. Ring the bell at midnight on Bell Night, with someone dear to you."),
  say('mr_finch', 'neutral', 'Share one wish between you. It comes true. That is the whole legend. Short. Like me.'),
  say('mr_finch', 'thinking', 'Rang it once myself. Wished for something.'),
  say('theo', 'surprised', 'Did it come true?'),
  say('mr_finch', 'neutral', "None of your business. ...Yes."),
  choice([
    opt('"You sound like you miss it."', [
      say('mr_finch', 'sad', "...Don't make an old man say things on a nice day."),
      emote('mr_finch', 'dots'),
      friend('mr_finch', 5), setFlag('main_legend_kind'),
    ]),
    opt('"Why did nobody put it back?"', [
      say('mr_finch', 'neutral', 'Takes three pieces and a reason. Town lost the reason first. The pieces wandered off after.'),
      friend('mr_finch', 4), setFlag('main_legend_honest'),
    ]),
    opt('"So the bell has been sulking for 30 years."', [
      say('mr_finch', 'smug', 'Ha! A thirty-year sulk. Respect it. I have been working on mine for longer.'),
      friend('mr_finch', 4), setFlag('main_legend_playful'),
    ]),
  ]),
  say('mr_finch', 'neutral', "Where the pieces went is my business. Go on. You're blocking my view."),
  setFlag('main_bell_story_known'),
  quest('main_silent_bell', 'start', 'Mr. Finch told me the legend of the Bellhaven bell. It has been silent for thirty years.'),
  think('Three pieces and a reason. I have a feeling I just got handed one of those.'),
];

export default [
  // ============================================================ DAY 1
  story({
    id: 'main_01_wake_up', title: 'First Morning',
    trigger: { type: 'wake' },
    when: all({ year: 1 }, { season: 'spring' }, { day: 1 }),
    priority: 95, skippable: false,
    script: [
      ...open('home_theo', 'bed', [place('theo', 'bed', 'down'), place('roz', 'kitchen_table', 'left'), music('home_morning'), lighting('auto')]),
      sfx('alarm'),
      think('Six-thirty. New town, new school, new bed that creaks in a key I do not know yet.'),
      say('roz', 'happy', 'Theo! Rise and shine! Breakfast is on the table and the table is getting impatient!'),
      moveTo('theo', 'center'),
      face('theo', 'roz'), face('roz', 'theo'),
      say('roz', 'happy', 'There he is. Pancakes, eggs, and a banana for structural support.'),
      say('theo', 'neutral', "Morning, Aunt Roz. You didn't have to do all this."),
      say('roz', 'smug', "I own a café, kiddo. Feeding people is my love language and also my tax bracket."),
      say('roz', 'neutral', "Your mom called at five. FIVE. She said 'tell him we're proud of him' and then 'did he pack socks'."),
      say('roz', 'happy', 'In that order, to her credit.'),
      think('Mom and Dad are somewhere over an ocean by now. Three years. I chose this. I would choose it again. Probably.'),
      say('roz', 'thinking', "So. First day. How are we feeling? Be honest. Aunts have radar."),
      choice([
        opt('"Thanks for taking me in. Really."', [
          say('roz', 'shy', "Oh, stop it. You'll make my mascara run and I'm not even wearing any."),
          emote('roz', 'heart'), friend('roz', 4), setFlag('main_01_thanked_roz'),
        ]),
        opt('"Nervous. Stomach-full-of-bees nervous."', [
          say('roz', 'happy', 'Good! Bees mean you care. Eat the pancakes. Bees respect pancakes.'),
          friend('roz', 3), setFlag('main_01_admitted_nerves'),
        ]),
        opt('"Is this breakfast a bribe?"', [
          say('roz', 'smug', 'Absolutely. You owe me one (1) good day. Payment due by dinner.'),
          friend('roz', 3), setFlag('main_01_joked'),
        ]),
      ]),
      say('roz', 'neutral', 'Directions. Down through the café, out onto Harbor Street, follow the water to Bell Square.'),
      say('roz', 'neutral', "From the square, head north up the hill. School's on top. Look for the stone tower with the bell in it."),
      say('roz', 'thinking', "The bell that doesn't ring."),
      say('theo', 'surprised', "...It doesn't ring?"),
      say('roz', 'sad', "Not for thirty years."),
      emote('roz', 'dots'),
      say('roz', 'happy', 'Long story. Ask me after more coffee. Or ask anyone over sixty; they will tell you whether you want it or not.'),
      say('roz', 'neutral', "Ceremony's at eight-twenty. Don't be late. Don't be too early either. Early people get asked to carry chairs."),
      emote('roz', 'heart'),
      say('roz', 'happy', 'Go on. Bellhaven is going to like you. It is a town that likes people who notice things.'),
      think('Harbor, Bell Square, then up the hill. And somewhere along the way, apparently, a bell with a story.'),
      setFlag('main_arrived'),
      quest('main_first_week', 'start', 'Get to Bellhaven High: harbor, Bell Square, then north up the hill. Ceremony at 8:20.'),
    ],
  }),

  story({
    id: 'main_02_homeroom', title: 'Class B',
    trigger: { type: 'enterMap', map: 'school_classroom', time: ['08:00', '16:00'] },
    when: all({ year: 1 }, { season: 'spring' }, { day: [1, 12] }, any({ seen: 'fest_entrance_ceremony' }, { day: [2, 12] })),
    priority: 85, skippable: false,
    script: [
      ...open('school_classroom', 'door', [
        place('ms_delaney', 'teacher_desk', 'down'), place('clara', 'seat_clara', 'up'), place('jules', 'seat_jules', 'up'),
        place('nina', 'seat_nina', 'up'), place('dante', 'seat_dante', 'up'), place('owen', 'seat_owen', 'up'),
        place('student_01', 'seat_01', 'up'), place('student_02', 'seat_02', 'up'), place('student_03', 'seat_03', 'up'),
        place('student_04', 'seat_04', 'up'), place('theo', 'door', 'right'), music('school_day'),
      ]),
      say('ms_delaney', 'happy', "Settle down, Class B. I have had exactly one coffee, so I'm running at thirty percent warmth. Use it wisely."),
      say('ms_delaney', 'neutral', "We have a transfer student. Come in, don't hover. Hovering is for hummingbirds and substitute teachers."),
      moveTo('theo', 'board'), face('theo', 'down'),
      cam({ focus: 'theo', ms: 600 }),
      say('ms_delaney', 'neutral', 'Introduce yourself. Name, one true thing, nothing that gets me a phone call.'),
      choice([
        opt('"Theo Hartley. Happy to be here. Really."', [
          say('jules', 'happy', 'Aw. He means it. Ms. D, he MEANS it. We have to protect him.'),
          friend('jules', 3), friend('nina', 2), setFlag('main_02_intro_kind'),
        ]),
        opt('"Theo Hartley. I don\'t know anyone yet."', [
          say('nina', 'happy', "You know Ms. D now! She's like eighty percent of this school!"),
          say('ms_delaney', 'smug', 'Eighty-five, with coffee.'),
          friend('nina', 3), friend('ms_delaney', 3), setFlag('main_02_intro_honest'),
        ]),
        opt('"Theo Hartley. I come in peace."', [
          say('dante', 'smug', 'Bold opening. Everyone who comes in peace leaves in pieces. That is a Dante Rossi original.'),
          say('owen', 'neutral', 'That is not how peace works. Or pieces. Statistically.'),
          friend('dante', 3), friend('owen', 3), setFlag('main_02_intro_playful'),
        ]),
      ]),
      say('ms_delaney', 'neutral', 'Lovely. Seat by the window, next to Jules. Jules, be a good influence. I will settle for neutral.'),
      say('jules', 'happy', 'Ms. D, I am a beacon.'),
      moveTo('theo', 'seat_theo'), face('theo', 'up'), pose('theo', 'sit'),
      say('jules', 'happy', "Psst. Jules Park. Welcome to the best class in Bellhaven High. It's also one of three, so, low bar."),
      say('ms_delaney', 'neutral', 'One more thing. Clara Voss is our class representative. Questions about the school, ask her.'),
      cam({ focus: 'clara', ms: 600 }),
      face('clara', 'theo'),
      say('clara', 'neutral', 'Clara Voss. If you require the timetable, the campus map, or the school rules, I have all three. Laminated.'),
      say('ms_delaney', 'smug', 'Complaints go to her as well. She files them alphabetically.'),
      say('clara', 'neutral', 'By surname, Ms. Delaney.'),
      emote('theo', 'sweat'),
      think('She laminated the rules. Of course she did. I kind of respect it.'),
      cam({ reset: true, ms: 500 }),
      say('ms_delaney', 'happy', "That's homeroom. Jules, show our arrival around. Do not lose him; I have only just learned his name."),
      say('jules', 'smug', 'Lose him? Ms. D, he is getting the deluxe tour. There will be lore.'),
      setFlag('main_02_met_class'),
      quest('main_first_week', 'update', "Met Class B. Clara Voss is the class rep; Jules Park sits next to me and won't stop talking."),
    ],
  }),

  // ============================================================ DAYS 2-4: tutorial in disguise
  story({
    id: 'main_03_breakfast_people', title: 'Roz on People',
    trigger: { type: 'wake' },
    when: all({ year: 1 }, { season: 'spring' }, { day: [2, 12] }, { seen: 'main_01_wake_up' }),
    script: [
      ...open('home_theo', 'bed', [place('theo', 'center', 'left'), place('roz', 'kitchen_table', 'right'), music('home_morning')]),
      say('roz', 'happy', 'Morning, day-two Theo! You look less like a lost umbrella today. Progress!'),
      say('roz', 'neutral', 'So who did you notice yesterday? Bellhaven is small; everyone is somebody\'s somebody.'),
      choice([
        opt('A girl who runs like she is late', [
          say('roz', 'happy', 'Sounds like a Calder. That bakery runs on legs. Nina delivers the bread before the gulls are up.'),
          setFlag('main_03_noticed_runner'),
        ]),
        opt('Someone reading in a doorway', [
          say('roz', 'thinking', "Could be Larkin's grand-niece. She reads the way other people breathe. Be gentle; she startles."),
          setFlag('main_03_noticed_reader'),
        ]),
        opt('A guy who never stops talking', [
          say('roz', 'smug', "Jules Park! Bless him. His family runs the diner. He talks like he's paid by the word."),
          setFlag('main_03_noticed_talker'),
        ]),
        opt('Mostly the bell tower', [
          say('roz', 'happy', "Ha! Finch's old tower. You've got the bug already. Took me three summers."),
          setFlag('main_03_noticed_tower'),
        ]),
      ]),
      say('roz', 'neutral', 'Here is my whole philosophy of people, free of charge: say hello every day. Every single day.'),
      say('roz', 'neutral', 'Nobody becomes friends in one big conversation. It is a hundred small ones and a sandwich.'),
      say('theo', 'thinking', 'And gifts? People here do gifts?'),
      say('roz', 'smug', 'Little ones. A roll for someone who skips breakfast. A book for someone who reads in doorways.'),
      say('roz', 'neutral', 'Watch what makes people light up. A good gift says "I was thinking of you".'),
      say('roz', 'neutral', 'A bad gift says "I was thinking of me, near a shop".'),
      say('roz', 'thinking', "Oh, and not everybody likes flowers. Some people get weird about flowers. Don't ask me why. Ask them."),
      say('roz', 'happy', 'Birthdays count triple. Write them down. I keep mine on the fridge, next to the fridge.'),
      think('Say hello every day. Pay attention. Pick gifts like I mean it. Easier said than done.'),
      say('roz', 'happy', "Lunch money. Don't tell your mother; she thinks I'm strict."),
      money(10),
      quest('main_first_week', 'update', 'Aunt Roz: talk to people every day; small gifts that fit the person go a long way.'),
    ],
  }),

  story({
    id: 'main_04_breakfast_classes', title: 'Roz on School',
    trigger: { type: 'wake' },
    when: all({ year: 1 }, { season: 'spring' }, { day: [3, 14] }, { seen: 'main_03_breakfast_people' }),
    script: [
      ...open('home_theo', 'bed', [place('theo', 'center', 'left'), place('roz', 'kitchen_table', 'right'), music('home_morning')]),
      say('roz', 'neutral', "Your homeroom teacher phoned. Ms. Delaney. Lovely woman. She sounded like she'd had four coffees."),
      say('theo', 'surprised', "Am I in trouble already?"),
      say('roz', 'happy', 'No! She wanted to say you seem nice. Teachers here have time to notice. Use it.'),
      say('roz', 'neutral', "Homeroom's at eight-twenty. Six periods, lunch in the middle. Be in the room when the bell— well. When the chime goes."),
      say('roz', 'neutral', 'Mr. Brandt teaches math. He once sent a wall clock back to the shop for being two seconds slow.'),
      say('roz', 'thinking', 'Skipping class is allowed, technically. So is eating soup with a fork.'),
      say('roz', 'neutral', 'Midterms are near the end of the month. Study at your desk upstairs, or at the school library; it is quieter than me.'),
      choice([
        opt('"I\'ll go to every class. Promise."', [
          say('roz', 'happy', "Look at you! I'm going to frame that sentence."),
          stat('conduct', 1), friend('roz', 2), setFlag('main_04_promised_class'),
        ]),
        opt('"Some classes are optional, right?"', [
          say('roz', 'smug', 'Optional like breathing, sweetheart. Skip one, nobody faints. Skip a lot, someone calls me.'),
          setFlag('main_04_skip_curious'),
        ]),
        opt('"Could you help me study?"', [
          say('roz', 'surprised', 'Me? With math? Kiddo, I make change by smell.'),
          say('roz', 'happy', 'Here, take my old flash-card trick: say it out loud like you are ordering it at a counter.'),
          stat('math', 1), friend('roz', 2), setFlag('main_04_asked_help'),
        ]),
      ]),
      say('roz', 'neutral', "And if you're ever sick, there's a nurse at school and Dr. Patel by the square. Don't be a hero. Heroes get soup."),
      think('Homeroom at 8:20. Six periods. A math teacher who audits clocks. Got it.'),
      quest('main_first_week', 'update', 'Classes: homeroom at 8:20, six periods. Attending helps; skipping is noticed. Midterms late in Spring.'),
    ],
  }),

  story({
    id: 'main_05_breakfast_money', title: 'Roz on Making a Living',
    trigger: { type: 'wake' },
    when: all({ year: 1 }, { season: 'spring' }, { day: [4, 16] }, { seen: 'main_04_breakfast_classes' }),
    script: [
      ...open('home_theo', 'bed', [place('theo', 'center', 'left'), place('roz', 'kitchen_table', 'right'), music('home_morning')]),
      say('roz', 'happy', 'Business meeting! Sit. Have a muffin. The muffin is the agenda.'),
      say('roz', 'neutral', 'Your parents send an allowance. Sixty dollars, Sunday mornings. It goes faster than you think. Ask me how I know.'),
      say('roz', 'neutral', "Bell Square has everything: Calder's bakery, Reyes Blooms, Larkin's books, the clinic, and the Corner Mart."),
      say('roz', 'smug', 'The Mart is open late. The night clerk is a university boy named Tomas who has never once been fully awake.'),
      say('roz', 'thinking', 'And if you want your own money... my counter downstairs needs hands. Weekday afternoons, four to seven. Weekends too.'),
      say('roz', 'happy', 'Forty-five a shift. Plus every burnt croissant you can carry.'),
      choice([
        opt('"I\'ll take the café job."', [
          say('roz', 'happy', 'Hired! The paperwork is a handshake. Come find me at the counter when you are ready for a shift.'),
          friend('roz', 3), setFlag('main_05_job_interest'),
        ]),
        opt('"Let me settle in first."', [
          say('roz', 'neutral', 'Sensible. The offer stands. Like my hair in humidity.'),
          setFlag('main_05_job_later'),
        ]),
        opt('"What were you like in high school?"', [
          say('roz', 'smug', 'Drama Club. I played a tree. I was a very committed tree. People wept.'),
          say('roz', 'thinking', 'Mostly from laughing. But weeping is weeping.'),
          friend('roz', 3), setFlag('main_05_roz_tree'),
        ]),
      ]),
      say('roz', 'neutral', "Tomorrow's the Club Fair, by the way. After school, in the courtyard. Join something."),
      say('roz', 'happy', 'A club is just a family that meets after three o\'clock and argues about snacks.'),
      think('Allowance on Sundays. Shops in the square. A job downstairs if I want it. And a club tomorrow.'),
      quest('main_first_week', 'update', 'Money: allowance on Sundays; shops in Bell Square; café shifts with Aunt Roz. Club Fair on Spring 5, after school.'),
    ],
  }),

  // ============================================================ SPRING: the legend
  story({
    id: 'main_06_blossom_legend', title: 'The Silent Bell',
    trigger: { type: 'auto', time: ['10:00', '20:00'] },
    when: all({ year: 1 }, { festival: 'blossom_day' }, { map: 'town_park' }, { seen: 'fest_blossom_day' }, { noFlag: 'main_bell_story_known' }),
    priority: 75,
    script: [
      ...open('town_park', 'bench_2', [place('mr_finch', 'bench_2', 'down'), place('theo', 'cherry_tree', 'down'), music('town_spring')]),
      narrate('Petals drift across the pond. On a bench, an old man in a flat cap glares at a cherry tree as if it owes him money.'),
      say('mr_finch', 'angry', 'Too early. Every year, too early. Trees have no patience.'),
      moveTo('theo', 'bench_1'), face('theo', 'mr_finch'),
      say('theo', 'neutral', 'Sorry, is this seat taken?'),
      say('mr_finch', 'neutral', "It's a bench. Benches are for sitting. Sit."),
      pose('theo', 'sit'),
      say('mr_finch', 'thinking', "You're Rosalind's nephew. The one who stares at my tower."),
      say('theo', 'surprised', 'Your tower?'),
      say('mr_finch', 'neutral', 'Bellhaven High. The bell. Forty years I kept it. Wound the clock, greased the yoke, rang it every morning.'),
      ...LEGEND,
    ],
  }),

  story({
    id: 'main_07_harbor_legend', title: 'The Old Man by the Water',
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['14:00', '19:30'] },
    when: all({ noFlag: 'main_bell_story_known' }, any({ year: [2, 3] }, { season: ['summer', 'autumn', 'winter'] }, { day: [15, 28] })),
    script: [
      ...open('town_harbor', 'finch_spot', [place('mr_finch', 'finch_spot', 'down'), place('theo', 'dock_bench', 'left'), music('town_spring')]),
      narrate('An old man sits by the water, polishing a brass clock key that opens nothing anyone can see.'),
      say('mr_finch', 'neutral', "You. Rosalind's boy. You keep looking up at the school hill like it owes you an answer."),
      moveTo('theo', 'npc_1'), face('theo', 'mr_finch'),
      say('theo', 'neutral', 'The bell tower. Everyone says the bell never rings. Nobody says why.'),
      say('mr_finch', 'neutral', 'Because nobody asks the man who kept it. Sit down. I tell it once.'),
      pose('theo', 'sit'),
      ...LEGEND,
    ],
  }),

  // ============================================================ SUMMER: the rumour and the committee
  story({
    id: 'main_08_enrolment_rumour', title: 'Numbers on a Notice Board',
    trigger: { type: 'enterMap', map: 'school_hall_1f', time: ['08:00', '17:00'] },
    when: Y1_FROM_SUMMER,
    script: [
      ...open('school_hall_1f', 'board', [
        place('jules', 'board', 'up'), place('owen', 'npc_1', 'up'), place('dante', 'npc_2', 'up'),
        place('theo', 'door_front', 'right'), music('tense'),
      ]),
      narrate('A crowd around the notice board. A plain sheet of paper, pinned at a slight, nervous angle.'),
      moveTo('theo', 'npc_3'),
      say('jules', 'surprised', "Hartley-dude. Look at this. 'Regional enrolment review: Bellhaven High under consideration.'"),
      say('theo', 'thinking', 'Consideration for what?'),
      say('owen', 'neutral', 'Merger. With the Harbor City campus. One hundred eighteen students. Ten years ago it was two hundred twelve.'),
      say('owen', 'neutral', 'Statistically, schools under one hundred twenty get a letter. Then a review. Then a bus.'),
      say('dante', 'angry', "A BUS? I'm not riding forty minutes to a school with a vending machine for a heart!"),
      say('jules', 'sad', "My parents' diner feeds half the students at lunch. If the school goes..."),
      emote('jules', 'dots'),
      moveTo('clara', 'npc_4'),
      say('clara', 'neutral', 'It is a routine review. The board examines every school in the district annually.'),
      say('dante', 'smug', 'And who chairs the board, Madam Vice President?'),
      say('clara', 'neutral', "...My mother. Which is precisely why I can tell you it is routine."),
      emote('clara', 'sweat'),
      think('She is holding that folder like a life jacket.'),
      choice([
        opt('Ask Clara: "Is it really routine?"', [
          say('clara', 'neutral', 'Hartley. I would not lie to the class.'),
          say('clara', 'sad', 'I also would not know. She does not discuss work at dinner. She does not discuss much at dinner.'),
          friend('clara', 4), setFlag('main_08_asked_clara'),
        ]),
        opt('Jules: "The diner isn\'t going anywhere."', [
          say('jules', 'happy', 'Ha. Yeah. Sorry. You are right. Nobody kills a school with a rumour on a Tuesday.'),
          say('jules', 'neutral', 'Note to self: write about this. A real story. Bellhaven Press, first edition.'),
          friend('jules', 4), setFlag('main_08_reassured_jules'),
        ]),
        opt('"Can we fight a bus? Dante looks ready."', [
          say('dante', 'happy', 'I was BORN ready. I was born in a fighting stance. Ask my mother. It was very hard for her.'),
          say('owen', 'neutral', 'The bus would win. Eleven tonnes.'),
          friend('dante', 3), friend('owen', 2), setFlag('main_08_joked_bus'),
        ]),
      ]),
      think("A school this small. A town this small. If one goes, the other starts to feel it."),
      setFlag('main_enrolment_rumour'),
    ],
  }),

  story({
    id: 'main_09_bell_committee', title: 'The Bell Committee',
    trigger: { type: 'enterMap', map: 'school_hall_2f', time: ['12:20', '17:30'] },
    when: all({ seen: 'main_08_enrolment_rumour' }, Y1_FROM_SUMMER),
    script: [
      ...open('school_hall_2f', 'council_door', [
        place('principal_marsh', 'council_door', 'down'), place('clara', 'npc_1', 'down'),
        place('theo', 'stairs_down', 'up'), music('school_day'),
      ]),
      say('principal_marsh', 'neutral', 'Ah. Mr. Hartley. Just the person I was hoping would wander by. Walk with me a moment?'),
      moveTo('theo', 'npc_2'), face('theo', 'principal_marsh'),
      say('principal_marsh', 'neutral', 'You will have seen the notice. I prefer people to hear things from me, not from a thumbtack.'),
      say('principal_marsh', 'neutral', 'The board will review us. Not this year. The vote is at the end of your third year.'),
      say('principal_marsh', 'thinking', 'A school is like a bell, Mr. Hartley. It only matters if someone hears it.'),
      say('principal_marsh', 'neutral', 'So I am asking the Student Council, and a few volunteers, to form a Bell Committee.'),
      say('clara', 'neutral', 'The objective: restore the bell, raise participation, and demonstrate that Bellhaven High is alive.'),
      say('clara', 'neutral', 'I drafted a charter. It has subsections.'),
      iff({ noFlag: 'main_bell_story_known' }, [
        say('principal_marsh', 'thinking', "Our bell has not rung in thirty years. Its clapper was taken down for repair after a storm and never came home."),
        say('principal_marsh', 'neutral', 'The town says that if you ring it on Bell Night with someone dear, a shared wish comes true. Towns need stories like that.'),
        setFlag('main_bell_story_known'),
        quest('main_silent_bell', 'start', 'Principal Marsh told me about the silent bell. Its clapper was taken down thirty years ago.'),
      ]),
      say('principal_marsh', 'happy', 'New eyes see what old eyes walk past. Would you join us?'),
      choice([
        opt('"Count me in."', [
          say('principal_marsh', 'happy', 'Thank you. Simple words, and the best ones.'),
          friend('principal_marsh', 4), friend('clara', 2), setFlag('main_09_join_kind'),
        ]),
        opt('"I\'m new. Why me?"', [
          say('principal_marsh', 'neutral', 'Because you asked "why". People who ask why tend to stay to hear the answer.'),
          friend('principal_marsh', 3), friend('clara', 3), setFlag('main_09_join_honest'),
        ]),
        opt('"Do I get a badge?"', [
          say('clara', 'neutral', 'There is no badge.'),
          say('principal_marsh', 'smug', 'There could be a badge.'),
          say('clara', 'surprised', '...Principal.'),
          friend('principal_marsh', 3), friend('clara', 1), setFlag('main_09_join_playful'),
        ]),
      ]),
      say('clara', 'neutral', 'First meeting: the rooftop, after classes. Owen has a... diagram. Please be punctual, Hartley.'),
      setFlag('main_committee_joined'),
      spirit(3),
      quest('main_save_school', 'start', 'The board votes on merging Bellhaven High at the end of Year 3. Show the town the school is alive (Community Spirit).'),
      think("Community Spirit. Festivals, friends, helping out, the bell. Every bit of it counts now."),
    ],
  }),

  story({
    id: 'main_10_tower_door', title: 'The Chained Door',
    trigger: { type: 'enterMap', map: 'school_rooftop', time: ['12:00', '18:30'] },
    when: { seen: 'main_09_bell_committee' },
    script: [
      ...open('school_rooftop', 'tower_door', [
        place('owen', 'tower_door', 'down'), place('clara', 'npc_1', 'right'), place('jules', 'npc_2', 'left'),
        place('dante', 'npc_3', 'up'), place('biscuit', 'cat_spot', 'down'), place('theo', 'door', 'up'), music('rooftop'),
      ]),
      say('jules', 'happy', 'He made it! Welcome to the Bell Committee, the coolest committee with zero budget.'),
      moveTo('theo', 'center'),
      say('owen', 'neutral', 'I have prepared a diagram. Bell Restoration Notes, version zero point three. Please hold questions until the end.'),
      say('owen', 'neutral', "The bell is fine. Bronze, eight hundred kilos. It is missing its clapper: the iron tongue that strikes it."),
      say('owen', 'neutral', 'The clapper has three parts. The core, the heavy iron ball and shaft. The fitting, the crown that hangs it.'),
      say('owen', 'neutral', 'And the rope and strike plate, so a human can ring it without dying. I recommend not dying.'),
      say('dante', 'smug', "Easy. We kick in that door, march up there, and... ring it with what, exactly?"),
      say('owen', 'neutral', 'Exactly. And the door is chained. The key went with the rope, according to the caretaker. Thirty years ago.'),
      sfx('chime'),
      emote('biscuit', 'zzz'),
      say('clara', 'thinking', 'Then the question is: who touched the clapper last?'),
      say('owen', 'neutral', 'Statistically: the man who took it down.'),
      face('theo', 'down'),
      say('theo', 'thinking', 'Mr. Finch. The old bell-keeper. He sits by the harbor.'),
      say('jules', 'surprised', "Grumpy Finch? He yelled at a seagull for being 'too optimistic'."),
      choice([
        opt('"I\'ll go talk to him."', [
          say('clara', 'neutral', 'Good. Be polite. Be brief. Do not mention that he yelled at a seagull.'),
          friend('clara', 2), setFlag('main_10_volunteered'),
        ]),
        opt('"He likes me. I think. He let me sit."', [
          say('jules', 'happy', 'He let you SIT? Hartley-dude, that is basically adoption.'),
          friend('jules', 2), setFlag('main_10_finch_sit'),
        ]),
        opt('"Let\'s send Dante. He\'s persuasive."', [
          say('dante', 'smug', 'Finally, someone who sees me.'),
          say('owen', 'neutral', 'Dante once tried to persuade a vending machine. It kept his coins.'),
          say('dante', 'angry', 'It was RIGGED.'),
          say('jules', 'happy', "Okay, Theo's going. Dante, you stay here and guard the cat."),
          friend('dante', 2), friend('owen', 2), setFlag('main_10_joked_dante'),
        ]),
      ]),
      emote('biscuit', 'heart'),
      quest('main_silent_bell', 'update', 'The bell needs its clapper: the core, the fitting, and the rope & strike plate. Ask Mr. Finch at the harbor.'),
    ],
  }),

  story({
    id: 'main_11_finch_challenge', title: "Finch's Condition",
    trigger: { type: 'enterMap', map: 'town_harbor', time: ['13:00', '20:00'] },
    when: { seen: 'main_10_tower_door' },
    script: [
      ...open('town_harbor', 'finch_spot', [place('mr_finch', 'finch_spot', 'down'), place('theo', 'npc_1', 'left'), music('town_summer')]),
      say('mr_finch', 'neutral', "You again. You've got the look. Committee look. Clipboard behind the eyes."),
      say('theo', 'neutral', "The school started a Bell Committee. We want to put the clapper back. Do you know where it is?"),
      say('mr_finch', 'thinking', 'Maybe. Maybe it is in my shed wrapped in oilcloth. Maybe it is at the bottom of the harbor.'),
      say('mr_finch', 'angry', 'Thirty years nobody asks. Now the school is in trouble and suddenly everyone loves the bell.'),
      choice([
        opt('"You\'re right. We should have asked sooner."', [
          say('mr_finch', 'surprised', '...Hm. Nobody ever says that.'),
          friend('mr_finch', 5), setFlag('main_11_apologised'),
        ]),
        opt('"I wasn\'t here thirty years ago."', [
          say('mr_finch', 'neutral', 'Fair. You were not even a rumour. Still. Fair.'),
          friend('mr_finch', 3), setFlag('main_11_fair_point'),
        ]),
        opt('"The bell misses you. Probably."', [
          say('mr_finch', 'smug', 'Ha. Bells do not miss people. ...People miss bells. That is the problem.'),
          friend('mr_finch', 4), setFlag('main_11_bell_misses'),
        ]),
      ]),
      say('mr_finch', 'neutral', 'Here is my condition. A bell belongs to a town. Not a committee. Not a board. A town.'),
      say('mr_finch', 'neutral', 'Bell Festival. End of autumn. If that school yard is full of people who mean it, I will see it.'),
      say('mr_finch', 'thinking', 'Then we talk about what is in my shed. Or not in my shed. Hypothetically.'),
      think('So I need the town to show up. Festivals, people, little favours. Spirit, Marsh called it.'),
      setFlag('main_finch_challenge'),
      quest('main_silent_bell', 'update', 'Mr. Finch might have the clapper core. He will decide at the Bell Festival (Autumn 27-28) if the town shows up.'),
      quest('main_save_school', 'update', 'Raise Community Spirit before the Bell Festival: festivals, clubs, helping townsfolk. Mr. Finch is watching.'),
    ],
  }),

  story({
    id: 'main_12_summer_posters', title: 'Posters and Favours',
    trigger: { type: 'enterMap', map: 'town_square', time: ['09:00', '18:00'] },
    when: all({ seen: 'main_11_finch_challenge' }, { noFlag: 'main_core_found' },
      any(all({ year: 1 }, { season: 'summer' }, { day: [15, 28] }), all({ year: 1 }, { season: 'autumn' }, { day: [1, 26] }), { year: [2, 3] })),
    script: [
      ...open('town_square', 'fountain', [
        place('jules', 'fountain', 'down'), place('mari', 'npc_1', 'right'), place('theo', 'road_north', 'down'), music('town_summer'),
      ]),
      say('jules', 'happy', 'Hartley-dude! Committee business! I have one hundred posters and a plan that is about forty percent plan.'),
      moveTo('theo', 'npc_2'),
      say('mari', 'happy', "Teo! I designed the posters! The bell is purple because purple is the color of hope. Also it's the paint I had."),
      say('jules', 'neutral', "Real talk though. Posters are fine. But Finch said the TOWN has to show up. So the town has to like us."),
      say('mari', 'thinking', "So we help! Like a little army of nice. A nice-army. A niceamy. That's not a word. It should be."),
      say('jules', 'happy', 'Pick a shop. Help out. Hand them a poster at the end. Flawless strategy, no notes.'),
      choice([
        opt('Help Mrs. Calder at the bakery', [
          narrate('An hour of kneading, carrying trays and being fed "just one more roll, dear" until the word "roll" stops meaning anything.'),
          say('mrs_calder', 'happy', 'You are a treasure! Have a roll, dear. Have six. Of course the poster goes in the window!'),
          friend('mrs_calder', 5), stat('fitness', 1), setFlag('main_12_helped_bakery'),
        ]),
        opt('Help Grandma Rosa at the flower shop', [
          narrate('Buckets, ribbons, and a long lecture on which flowers mean "sorry" and which mean "I am still mad, but sorry".'),
          say('rosa', 'happy', "Ay, a boy who listens and lifts. Your aunt raised you well, mijo. Put the poster by the roses."),
          friend('rosa', 5), stat('creativity', 1), setFlag('main_12_helped_flowers'),
        ]),
        opt('Help Mr. Larkin shelve books', [
          narrate('Three ladders, two hundred paperbacks, and one cat-shaped bookend that judges you silently the whole time.'),
          say('mr_larkin', 'happy', 'Thank you. You put the poetry back in order. Nobody puts the poetry back in order.'),
          friend('mr_larkin', 5), stat('literature', 1), setFlag('main_12_helped_books'),
        ]),
        opt('Help Mayor Greer with the notice boards', [
          narrate("The mayor talks for ninety minutes straight. Most of it is the word 'wonderful'. All of it is sincere."),
          say('mayor_greer', 'happy', 'Wonderful, wonderful! A Bell Festival poster on every board in town! Young man, you have a future in civic signage!'),
          friend('mayor_greer', 5), stat('charm', 1), setFlag('main_12_helped_mayor'),
        ]),
      ]),
      moveTo('theo', 'fountain'),
      say('jules', 'happy', 'Look at you. Bellhaven-certified helpful. I am writing this down. "Local transfer student: suspiciously decent."'),
      say('mari', 'happy', "The posters look so good in the windows! Like little purple promises. ¡Qué bonito!"),
      spirit(3),
      friend('jules', 2), friend('mari', 2),
      think('The town notices small things. Maybe that is how you save a school: one shop window at a time.'),
    ],
  }),

  // ============================================================ AUTUMN: Bell Festival prep and the core
  story({
    id: 'main_13_booth_vote', title: 'The Class B Booth',
    trigger: { type: 'enterMap', map: 'school_classroom', time: ['08:00', '16:00'] },
    when: all({ year: 1 }, { season: 'autumn' }, { day: [1, 26] }),
    script: [
      ...open('school_classroom', 'door', [
        place('ms_delaney', 'teacher_desk', 'down'), place('clara', 'board', 'down'), place('nina', 'seat_nina', 'up'),
        place('dante', 'seat_dante', 'up'), place('jules', 'seat_jules', 'up'), place('owen', 'seat_owen', 'up'),
        place('theo', 'seat_theo', 'up'), pose('theo', 'sit'), music('funny'),
      ]),
      say('ms_delaney', 'neutral', 'Bell Festival booth. Class B needs one idea by Friday. I will be drinking coffee in the corner, emotionally.'),
      say('clara', 'neutral', 'I have received three proposals. A café. A haunted classroom. And a... play.'),
      say('nina', 'happy', "Haunted classroom! I'll be the ghost! I'll chase people! I'm the fastest ghost in the history of ghosts!"),
      say('dante', 'smug', "A PLAY. An epic. A knight saves a harbor town. The knight is tall and handsome. I'll audition, as a formality."),
      say('clara', 'neutral', 'A café is orderly, profitable, and nobody cries. I am, for the record, neutral.'),
      say('owen', 'neutral', 'She has a spreadsheet of the café. With projected croissant demand.'),
      say('clara', 'shy', 'That is a coincidence.'),
      say('jules', 'happy', 'It is a perfect three-way tie. Which means... the new guy breaks it. Drumroll.'),
      emote('theo', 'sweat'),
      think('Everyone is staring at me. Clara is staring at me the hardest, neutrally.'),
      choice([
        opt('The café (Clara\'s neutral idea)', [
          say('clara', 'happy', 'An excellent, objective choice. I will begin the rotas tonight. Laminated.'),
          say('nina', 'sad', "Booo. Fine. But I'm wearing a ghost sheet as an apron."),
          friend('clara', 4), setFlag('main_y1_booth_cafe'),
        ]),
        opt('The haunted classroom (Nina)', [
          say('nina', 'happy', "YES! Newbie gets it! Dante, you're gonna scream so loud the bell rings on its own!"),
          say('dante', 'angry', 'I do not scream. I exclaim. Theatrically.'),
          friend('nina', 4), setFlag('main_y1_booth_haunted'),
        ]),
        opt('The play (Dante\'s epic)', [
          say('dante', 'happy', 'A man of culture! Theo, you may play my loyal squire. You have one line. It is "Yes, my lord".'),
          say('ms_delaney', 'smug', 'I will help with the script. Mostly by removing the word "handsome".'),
          friend('dante', 4), setFlag('main_y1_booth_play'),
        ]),
      ]),
      say('ms_delaney', 'happy', "Decided! Look at that. Democracy, in under an hour. I'll tell the principal before anyone appeals."),
      spirit(2),
      think('Class B, one booth, one festival. And one old man at the harbor, waiting to see if any of it means anything.'),
    ],
  }),

  story({
    id: 'main_14_core_handover', title: 'What Finch Kept',
    trigger: { type: 'auto', time: ['13:00', '20:00'] },
    when: all({ year: 1 }, { festival: 'bell_festival' }, { map: 'school_grounds' }, { seen: 'fest_bell_festival' },
      { noFlag: 'main_core_found' }, { noFlag: 'main_core_deferred' }),
    priority: 75,
    script: [
      ...open('school_grounds', 'courtyard', [
        place('mr_finch', 'tree_shade', 'down'), place('theo', 'courtyard', 'left'),
        place('student_05', 'stall_a', 'down'), place('student_06', 'stall_b', 'down'), place('townie_02', 'npc_1', 'up'),
        place('townie_03', 'npc_2', 'up'), music('festival'),
      ]),
      narrate('Under the old tree by the gate stands Mr. Finch, in a jacket too good for a Saturday, with a parcel in oilcloth under one arm.'),
      moveTo('theo', 'npc_3'), face('theo', 'mr_finch'),
      say('mr_finch', 'neutral', "Don't look so surprised. I was invited. By about forty posters."),
      say('mr_finch', 'thinking', 'Been watching. People. Stalls. That boy shouting into a paper megaphone.'),
      cam({ focus: 'mr_finch', ms: 700 }),
      iff({ spirit: ['>=', 20] }, [
        say('mr_finch', 'neutral', 'Forty years I kept that bell. I have not seen the yard this full since the night it went quiet.'),
        say('mr_finch', 'sad', 'Thought the town forgot. It didn\'t. It just needed somebody to knock on its door.'),
        narrate('He unwraps the oilcloth. Inside: a black iron shaft with a heavy round head, polished, oiled, cared for for thirty years.'),
        say('mr_finch', 'neutral', 'The clapper core. Mended it the winter after the storm. Kept it oiled every spring since.'),
        say('mr_finch', 'thinking', 'Never told anyone. Nobody asked.'),
        say('theo', 'surprised', 'You kept it ready. All this time.'),
        say('mr_finch', 'smug', 'Bells are patient. So am I. Only louder.'),
        sfx('item'),
        giveItem('bell_clapper_core'),
        setFlag('main_core_found'), setFlag('main_core_earned'),
        spirit(8), friend('mr_finch', 8),
        say('mr_finch', 'neutral', 'One piece of three. Don\'t drop it on your foot. It does not care whose foot.'),
        quest('main_silent_bell', 'update', 'Mr. Finch gave me the clapper core at the Bell Festival! Still missing: the fitting and the rope & strike plate.'),
        quest('main_save_school', 'update', 'The town showed up for the Bell Festival. Keep it going.'),
        think('Heavy. Way heavier than it looks. Like it has been waiting to be carried.'),
      ], [
        say('mr_finch', 'neutral', 'Busy. Not busy enough. Half the town is still at home pretending this is just a school thing.'),
        say('mr_finch', 'sad', 'A bell rung for half a town sounds like half a bell.'),
        say('mr_finch', 'thinking', 'Tell me why. Why does a boy who has been here eight months care about my bell?'),
        choice([
          opt('"Because this town took me in."', [
            say('mr_finch', 'thinking', '...Hm. That is a reason. That is an old-fashioned reason.'),
            friend('mr_finch', 5), setFlag('main_14_reason_belong'),
          ]),
          opt('"Honestly? I want to hear it ring."', [
            say('mr_finch', 'smug', 'Ha. Selfish. Good. Selfish people show up on time.'),
            friend('mr_finch', 5), setFlag('main_14_reason_hear'),
          ]),
          opt('"You can\'t carry it forever."', [
            say('mr_finch', 'angry', 'Watch me.'),
            emote('mr_finch', 'dots'),
            say('mr_finch', 'sad', '...My hands shake now, in the mornings. You are not wrong. I hate it when people are not wrong.'),
            friend('mr_finch', 4), setFlag('main_14_reason_honest'),
          ]),
        ]),
        say('mr_finch', 'neutral', 'Not today. Ask me again when the lanterns go out on the water. Winter. The harbor.'),
        say('mr_finch', 'neutral', 'Keep showing up until then. That is the whole test. Most people fail it by Tuesday.'),
        setFlag('main_core_deferred'),
        quest('main_silent_bell', 'update', 'Mr. Finch was not convinced yet. He told me to ask again at the harbor in winter (Lantern Night). Keep showing up.'),
      ]),
      cam({ reset: true, ms: 500 }),
      moveTo('mr_finch', 'gate'),
      think('He walks out the gate slowly, the way people walk when they are not sure they want to leave.'),
    ],
  }),

  story({
    id: 'main_15_core_harbor', title: 'Lanterns on the Water',
    trigger: { type: 'auto', time: ['15:00', '23:30'] },
    when: all({ map: 'town_harbor' }, { noFlag: 'main_core_found' }, { flag: 'main_bell_story_known' },
      any({ year: [2, 3] }, all({ season: 'winter' }, { day: [14, 28] }))),
    priority: 75,
    script: [
      ...open('town_harbor', 'finch_spot', [place('mr_finch', 'finch_spot', 'down'), place('theo', 'npc_1', 'left'), lighting('auto'), music('sad')]),
      narrate('Cold air off the water. Mr. Finch sits where he always sits, a parcel in oilcloth on the bench beside him like a sleeping dog.'),
      moveTo('theo', 'npc_2'), face('theo', 'mr_finch'),
      say('mr_finch', 'neutral', 'You came. Thought you might.'),
      iff({ flag: 'main_core_deferred' }, [
        say('mr_finch', 'thinking', 'I said keep showing up. You did. The festival. The posters. Rosalind tells me things. Rosalind tells everyone things.'),
      ], [
        say('mr_finch', 'thinking', 'You missed my festival. I noticed. I also noticed you kept coming back down here anyway.'),
      ]),
      say('mr_finch', 'sad', "Truth is, it was never really a test of the town. It was a test of me. Whether I could let go of the thing."),
      say('mr_finch', 'neutral', 'Turns out I can. If it goes to someone who keeps coming back.'),
      narrate('He sets the parcel in your hands. Iron, heavy and cold, oiled and cared for: the clapper core.'),
      sfx('item'),
      giveItem('bell_clapper_core'),
      setFlag('main_core_found'), setFlag('main_core_fallback'),
      spirit(5), friend('mr_finch', 6),
      choice([
        opt('"I\'ll take care of it. Promise."', [
          say('mr_finch', 'neutral', 'Promises are heavier than iron. Carry both.'),
          friend('mr_finch', 2),
        ]),
        opt('"Come up the hill and see it hung."', [
          say('mr_finch', 'thinking', 'Stairs. Hmph. ...Maybe. When there is something to hang it on.'),
          friend('mr_finch', 3), setFlag('main_15_invited_finch'),
        ]),
      ]),
      quest('main_silent_bell', 'update', 'Mr. Finch gave me the clapper core at the harbor. Still missing: the fitting and the rope & strike plate.'),
      think('One piece. The bell is one piece less silent.'),
    ],
  }),

  // ============================================================ WINTER: what the core tells us
  story({
    id: 'main_16_core_study', title: 'Fascinating Iron',
    trigger: { type: 'enterMap', map: 'school_classroom', time: ['12:20', '18:30'] },
    when: { flag: 'main_core_found' },
    script: [
      ...open('school_classroom', 'door', [
        place('dr_fennel', 'teacher_desk', 'down'), place('owen', 'npc_1', 'left'), place('clara', 'npc_2', 'right'),
        place('jules', 'npc_3', 'up'), place('theo', 'door', 'up'), music('observatory'),
      ]),
      narrate('Free period. The clapper core lies on the teacher\'s desk on a folded towel, like a patient. Dr. Fennel circles it with a magnifying glass.'),
      say('dr_fennel', 'surprised', 'Fascinating! Hand-forged! Look at the grain! This iron has stories, Hartley. Possibly gossip.'),
      moveTo('theo', 'npc_4'),
      say('owen', 'neutral', 'The crown end has bolt holes. Four of them. Something bolted on here. The fitting.'),
      say('dr_fennel', 'thinking', 'The crown fitting! Bronze, I would wager. It hangs the clapper from the bell\'s crown staple like a... like a...'),
      say('dr_fennel', 'happy', 'Like a pendulum of destiny! Or a large spoon. I am five minutes from a better metaphor.'),
      say('clara', 'neutral', 'Mr. Finch only mended the core. So where did the fitting go?'),
      say('jules', 'thinking', "Someone has to have written it down. This town writes down everything. My grandma kept a diary of her diary."),
      say('clara', 'thinking', 'The town hall keeps an archive. Repairs on public property would be recorded. Probably filed under "B".'),
      say('owen', 'neutral', 'Or under "bell". Or "bronze". Or "Bellhaven". Statistically, under the wrong letter.'),
      choice([
        opt('"We\'ll check the archive."', [
          say('clara', 'neutral', 'Mayor Greer has the key. He will say "wonderful" approximately nine times. I will count.'),
          friend('clara', 3), setFlag('main_16_plan_archive'),
        ]),
        opt('"Dr. Fennel, can I touch it?"', [
          say('dr_fennel', 'happy', 'Of course! Science is tactile! Feel the weight of thirty years!'),
          think('Cold. Heavy. And somehow it feels like it is humming. Very, very quietly.'),
          friend('dr_fennel', 4), stat('science', 2), setFlag('main_16_touched_core'),
        ]),
      ]),
      say('dr_fennel', 'happy', 'Keep it safe, Hartley. And oil it in spring. Iron sulks, too.'),
      setFlag('main_core_studied'),
      quest('main_silent_bell', 'update', 'The core needs its crown fitting. The town-hall archive may have a record of where it went.'),
    ],
  }),
];
