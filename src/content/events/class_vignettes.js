// Classroom vignettes (S4a, written by the lead): short flavour scenes in the minutes around the bells (homeroom, breaks, lunch return).
// kind 'class', trigger `auto` in school_classroom, daily repeat with `chance`. The school-day director owns the lessons themselves.
import {
  say, narrate, think, choice, opt, iff, place, moveTo, face, emote, sfx, setFlag, friend, stat,
  all, any, not,
} from '../../sim/script_dsl.js';

const IN_CLASS = { map: 'school_classroom' };
const cls = (o) => ({ kind: 'class', priority: 15, repeat: 'daily', skippable: true, trigger: { type: 'auto', time: ['08:20', '08:30'] }, ...o, when: all({ schoolDay: true }, IN_CLASS, o.when || {}) });

export default [
  cls({
    id: 'class_homeroom_coffee', title: 'Thirty Percent Warmth',
    when: { chance: 0.35 },
    script: [
      place('ms_delaney', 'teacher_desk', 'down'),
      say('ms_delaney', 'neutral', 'Good morning, Class B. Announcements. One: the vending machine is not sentient. Two: the lost-and-found has a violin. Please claim the violin.'),
      say('jules', 'happy', "What if the violin claims us?"),
      say('ms_delaney', 'smug', 'Then the violin has better judgement than most of you. Sit.'),
    ],
  }),
  cls({
    id: 'class_math_brandt_clock', title: 'One Minute Late',
    when: all({ weekday: ['Mon', 'Fri'] }, { chance: 0.5 }),
    script: [
      place('mr_brandt', 'teacher_desk', 'down'), place('dante', 'door', 'up'),
      narrate('Mr. Brandt is holding his pocket watch like a magistrate. The second hand has eleven seconds left.'),
      moveTo('dante', 'seat_dante'),
      say('mr_brandt', 'angry', "Rossi. Seat. You are four seconds from tardy. Four seconds is a long time in a triangle."),
      say('dante', 'smug', "I was three seconds from early, sir. It's a matter of perspective."),
      say('mr_brandt', 'neutral', '...Perspective is geometry. Sit down, Rossi.'),
    ],
  }),
  cls({
    id: 'class_lit_haiku', title: 'Five, Seven, Five',
    when: all({ weekday: 'Tue' }, { chance: 0.5 }),
    script: [
      place('ms_delaney', 'teacher_desk', 'down'),
      say('ms_delaney', 'happy', "Haiku warm-up. Five, seven, five. Jules, volunteer, you are volunteering."),
      say('jules', 'thinking', "'Tomato in the box. Press the third button, he said. It was not juice.' ...Is that five-seven-five?"),
      say('ms_delaney', 'smug', "It is eighteen syllables of trauma. Next."),
      say('clara', 'neutral', "'Morning in the bay. The old bell holds its breath. Even gulls are still.'"),
      narrate('A short silence. Even Dante does not make a joke.'),
      choice([
        opt('Offer a line of your own.', [
          think('Fog on the harbor. Somebody left a lantern lit. Nobody asks why.'),
          say('ms_delaney', 'surprised', "...That one is staying on the board. Don't tell the others."),
          stat('literature', 1), friend('ms_delaney', 2),
        ]),
        opt('Clap quietly for Clara.', [say('clara', 'shy', 'Thank you. It was merely adequate.'), friend('clara', 2)]),
      ]),
    ],
  }),
  cls({
    id: 'class_sci_fennel_five_minutes', title: 'Five Minutes From a Breakthrough',
    when: all({ weekday: 'Wed' }, { chance: 0.5 }),
    script: [
      place('dr_fennel', 'teacher_desk', 'down'),
      sfx('hit'),
      narrate('Dr. Fennel arrives backwards through the door, holding a smoking beaker with the confidence of a man who has done this before.'),
      say('dr_fennel', 'happy', "Class! Do not breathe in. Breathe out, but not toward me. I am five minutes from a breakthrough."),
      say('owen', 'neutral', "Historically, he has been five minutes from a breakthrough for four years. The average wait is four minutes eleven seconds."),
      say('dr_fennel', 'surprised', "THAT'S the statistic that has been bothering me. Thank you, Tran. I'll note that."),
    ],
  }),
  cls({
    id: 'class_hist_abel_gossip', title: 'And Then The Duke Said',
    when: all({ weekday: 'Thu' }, { chance: 0.5 }),
    script: [
      place('mr_abel', 'teacher_desk', 'down'),
      say('mr_abel', 'happy', "So! Seventeen thirty-four. Everyone is at the dinner. The duke leans in. And then the duke said, and I am not making this up, he said, 'Pass the salt.'"),
      say('jules', 'surprised', "WAIT. That's it? That's the scandal?"),
      say('mr_abel', 'smug', "The salt was the whole treaty, Park. History is mostly people being dramatic about small objects."),
      say('clara', 'neutral', "It was seventeen thirty-three, sir. And the object was a pepper mill."),
      say('mr_abel', 'surprised', "...Your mother used to correct me, too. Rest her fine mind."),
    ],
  }),
  cls({
    id: 'class_clara_perfect', title: 'Perfect Score, Perfectly Annoyed',
    trigger: { type: 'auto', time: ['09:20', '09:30'] },
    when: all({ weekday: ['Wed', 'Fri'] }, { chance: 0.35 }),
    script: [
      place('clara', 'seat_clara', 'down'),
      narrate('The quiz papers are going back. Clara gets hers, glances at the number, and sighs at a hundred percent like a person who expected a hundred and one.'),
      choice([
        opt('"Nice work, Vice President."', [
          say('clara', 'neutral', "It was a standard difficulty. But... thank you. Few people say it without a following sentence."),
          friend('clara', 2),
        ]),
        opt('"Next time I\'ll beat you."', [
          say('clara', 'smug', 'Noted. I look forward to the attempt. Bring a pen.'),
          friend('clara', 3), setFlag('class_clara_rival'),
        ]),
      ]),
    ],
  }),
  cls({
    id: 'class_dante_boast', title: 'Scored Three, Allegedly',
    trigger: { type: 'auto', time: ['10:20', '10:30'] },
    when: all({ weekday: ['Mon', 'Thu'] }, { chance: 0.35 }),
    script: [
      place('dante', 'seat_dante', 'right'), place('jules', 'seat_jules', 'left'),
      say('dante', 'smug', "Three goals, two assists, and a header that physicists are still discussing. Last night's friendly was a masterpiece."),
      say('jules', 'happy', "It was a six-a-side game against the under-tens."),
      say('dante', 'angry', "THE UNDER-TENS ARE DANGEROUS. They have no fear and strong knees."),
      choice([
        opt('Side with Dante.', [say('dante', 'happy', "Finally, a witness with taste."), friend('dante', 2)]),
        opt('Side with Jules.', [say('jules', 'happy', 'Hartley-dude. My historian. My editor.'), friend('jules', 2)]),
      ]),
    ],
  }),
  cls({
    id: 'class_owen_statistic', title: 'Probability of a Late Teacher',
    trigger: { type: 'auto', time: ['11:20', '11:30'] },
    when: all({ weekday: ['Tue', 'Thu'] }, { chance: 0.35 }),
    script: [
      place('owen', 'seat_owen', 'down'),
      say('owen', 'neutral', "I have kept a notebook. Probability that a teacher is late on a Tuesday: zero point four. On a rainy Tuesday: zero point six."),
      say('theo', 'surprised', 'You track that?'),
      say('owen', 'neutral', "The sky has patterns. So do adults. Both are easier to forgive when you can graph them."),
      emote('owen', 'sparkle'),
    ],
  }),
  cls({
    id: 'class_jules_joke', title: 'The Tomato Machine Returns',
    trigger: { type: 'auto', time: ['13:00', '13:10'] },
    when: { chance: 0.4 },
    script: [
      place('jules', 'seat_jules', 'left'),
      say('jules', 'happy', "Okay, okay. Why did the vending machine apply to be a school councillor?"),
      say('jules', 'smug', "Because it had a LOT of change to propose."),
      choice([
        opt('Laugh like it is the best joke ever.', [say('jules', 'surprised', "Hartley-dude! You get me! You and I are going places. Dante will never let us in."), friend('jules', 3)]),
        opt('Groan, loudly.', [say('jules', 'sad', "That's the sound of art being understood too well."), friend('jules', 2)]),
      ]),
    ],
  }),
  cls({
    id: 'class_rain_window', title: 'Rain On The Glass',
    trigger: { type: 'auto', time: ['09:20', '09:30'] },
    when: all({ weather: ['rain', 'storm'] }, { chance: 0.5 }),
    script: [
      place('nina', 'seat_nina', 'right'),
      narrate('Rain is writing very small letters on the window. Half the class has drifted toward the glass, the other half pretends not to.'),
      say('nina', 'sad', "Rain means no track practice. I get itchy legs when it rains."),
      say('owen', 'neutral', "Humidity affects stride length by approximately two percent. You are not uniquely afflicted."),
      say('nina', 'happy', "Thanks, Owen. You've never made me feel better so exactly."),
    ],
  }),
  cls({
    id: 'class_art_quill_absent_minded', title: 'Mismatched Shoes',
    trigger: { type: 'auto', time: ['13:00', '13:10'] },
    when: all({ weekday: ['Tue', 'Thu'] }, { chance: 0.4 }),
    script: [
      place('mr_quill', 'teacher_desk', 'down'),
      narrate('Mr. Quill enters holding a brush behind one ear and, in his hand, the matching brush he was looking for.'),
      say('mr_quill', 'surprised', "Ah. Good afternoon, everyone. Is it Tuesday? I was convinced it was a very long Monday."),
      say('jules', 'happy', 'Sir? You are wearing one brown shoe and one blue.'),
      say('mr_quill', 'thinking', "...Yes. I wanted to see which one I would notice first. A deliberate study in perception. Obviously."),
      say('clara', 'neutral', 'You were doing that last year too, sir.'),
      say('mr_quill', 'happy', "A long-term study. Thank you for your research assistance, Miss Voss."),
    ],
  }),
];
