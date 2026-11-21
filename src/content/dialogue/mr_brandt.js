// Mr. Brandt: strict math teacher, mustache, secretly sentimental. Hates tardiness. Clipped, formal, deadpan.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['mr_brandt', '>=', lo] });

export default {
  npc: 'mr_brandt',
  talk: [
    t(20, { time: ['07:00', '08:30'] }, ['neutral', `Mr. Hartley. You are early. Noted. A rare and pleasing variable.`]),
    t(20, { time: ['08:30', '09:30'] }, ['neutral', `The bell has rung. Your seat awaits. The clock does not wait. Neither do I.`]),
    t(20, { time: ['14:00', '20:00'] }, ['neutral', `Afternoon. The numbers are still there. They did not leave. I do not blame them for being faithful.`]),
    t(21, { weekday: 'Mon' }, ['neutral', `Monday. The graph of motivation is at its lowest. We will fix that with fractions.`]),
    t(21, { weekday: 'Fri' }, ['neutral', `Friday. Homework is assigned. You may enjoy your weekend. Briefly.`]),
    t(22, { weather: 'rain' }, ['neutral', `Rain. Precipitation: 4 millimetres per hour. My mustache: slightly damp. Report it to no one.`]),
    t(22, { weather: 'snow' }, ['neutral', `Snow. Late arrivals will be forgiven. Once. Per person. Per winter.`]),
    t(23, { season: 'spring' }, ['neutral', `New term. Fresh textbooks. Do not scribble in the margins. Mathematics is not a canvas.`]),
    t(23, { season: 'summer' }, ['neutral', `Summer exams. Heat does not change the Pythagorean theorem. It merely makes it sweatier.`]),
    t(24, { map: 'school_classroom' }, ['neutral', `Sit. Open to page forty-two. If you are wondering why: because I said so, and because it is page forty-two.`]),
    t(25, H(4), ['neutral', `You have a methodical mind, Mr. Hartley. That is the highest praise I give. Do not repeat it.`]),
    t(26, { rank: ['<=', 3] }, ['happy', `Rank three or higher. I will not smile. I will adjust my mustache. That is the same thing.`]),
    t(26, { standing: 'probation' }, ['neutral', `Your marks require attention. After class. Bring a pencil. Bring patience. I will bring tea.`]),
    t(27, { flag: 'main_bell_story_known' }, ['thinking', `The bell. I once heard it ring, as a boy. It was off by one note. I have never stopped hearing that note.`]),
    t(27, { flag: 'main_bell_restored' }, ['shy', `The bell is fixed. I... require a moment. This is not tardiness. It is an exception.`]),
    t(30, { festival: true }, ['neutral', `A festival. Noise. Crowds. I will be at the quiet table with a sudoku. It is a festival of one.`]),
    t(1, null, ['neutral', `If you have a question, ask. If you have a late slip, I will take it. If you have both, I will sigh.`]),
    t(1, null, ['neutral', `Numbers do not care about your feelings. But I do. Marginally. On Fridays.`]),
    t(1, null, ['thinking', `There is elegance in a proof. There is also elegance in arriving on time. Think about it.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Mr. Hartley. We have spoken. Further talk requires an agenda.`]),
    t(1, null, ['neutral', `Return to your seat. The numbers are waiting.`]),
    t(1, null, ['thinking', `Hm. I was mid-equation. It is solved now. Thanks to the interruption, strangely.`]),
    t(5, H(6), ['shy', `...Tea is available in the staff room. After class. Do not make it a habit. Make it a habit.`]),
  ],
  gift: {
    loves: ['tea_leaves', 'calculator', 'dark_chocolate', 'textbook_math'],
    likes: ['notebook', 'workbook', 'coffee', 'tea', 'cookie', 'flashcards'],
    dislikes: ['soda', 'whoopee_cushion', 'candy'],
    hates: ['black_licorice', 'energy_drink'],
    lines: {
      loves: [['surprised', `This is... correct. Exactly what I needed. I will not smile. I will merely adjust my mustache.`], ['shy', `You observe well, Mr. Hartley. Thank you. This is... genuinely appreciated.`]],
      likes: [['neutral', `A sensible gift. Efficient. Thank you.`], ['happy', `Good. I will use it. Frequently. Consider it a compliment.`]],
      neutral: [['neutral', `Thank you. I will log it. Somewhere.`], ['neutral', `Noted. Appreciated. Move along.`]],
      dislikes: [['neutral', `This is not to my taste. The thought, however, is acknowledged.`], ['sad', `I will put it in a drawer. A very tidy drawer.`]],
      hates: [['angry', `Mr. Hartley. This is unacceptable. Remove it.`], ['neutral', `I will pretend this did not occur. For both our sakes.`]],
      birthday: [['surprised', `You remembered. I did not tell anyone. ...I shall tolerate it. Thank you.`], ['shy', `A gift. On my birthday. From a student. ...This may be the first. Thank you.`]],
    },
  },
};
