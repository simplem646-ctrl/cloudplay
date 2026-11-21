// Pure helpers for the academic scenes (no DOM, no canvas): flavour lines, quiz pick, option layout, colours, comments.
import { rngFor } from '../../core/rng.js';
import { wrapText, measureText } from '../../ui/font.js';

export const SUBJECT_LABEL = { math: 'Mathematics', literature: 'Literature', science: 'Science', history: 'History', art: 'Art', pe: 'Physical Education' };
export const SUBJECT_SHORT = { math: 'Math', literature: 'Literature', science: 'Science', history: 'History', art: 'Art', pe: 'PE' };
export const subjectLabel = (s) => SUBJECT_LABEL[s] || String(s);

// ---------------------------------------------------------------- teacher flavour (2 any-year + 2 per year = 8 per subject)
export const FLAVOUR = {
  math: {
    all: ['"Numbers don\'t lie, but they do like to hide. Let us go find them."', '"Show your working. A right answer with no working is a lucky guess."'],
    1: ['"Today: fractions. Think of a pie, then think of sharing it fairly."', '"Multiplication tables are your pencil case. Keep them close."'],
    2: ['"Algebra is just a mystery novel where x is the culprit."', '"Triangles again. They never get tired of adding up to 180."'],
    3: ['"Quadratics. Two roots, one parabola, zero excuses."', '"Calculus is only the study of change. You are already experts at that."'],
  },
  literature: {
    all: ['"A book is a door. Today we open it together."', '"Read it twice. The second time is when it starts talking back."'],
    1: ['"Who can tell me what a metaphor is? No, the sea is not literally a blanket."', '"Short stories first. Every long road starts with a short step."'],
    2: ['"Poetry is just prose that paid attention to its rhythm."', '"Find the narrator. Then ask: should we trust them?"'],
    3: ['"Themes, symbols, unreliable narrators. You will need all three for the finals."', '"Write what you mean, then cut half of it. That is the draft."'],
  },
  science: {
    all: ['"Hypothesis first, excitement second. Mostly."', '"Safety goggles on. I mean it. Again."'],
    1: ['"Matter comes in three states. Mr. Brandt\'s mood has only one."', '"Plants make food from sunlight. Be a little more like plants."'],
    2: ['"Forces: for every push there is an equal and opposite shove back."', '"Cells are tiny towns. Mitochondria run the power station."'],
    3: ['"Chemistry is cooking where the recipe can bite. Respect the recipe."', '"Evolution is not a ladder. It is a bush. Draw it that way."'],
  },
  history: {
    all: ['"History is a conversation with people who cannot answer back. Be polite."', '"Dates matter, but the reasons matter more."'],
    1: ['"Long before Bellhaven had a harbor, it had a ferry and one very stubborn ferryman."', '"Ancient rivers, ancient farms: civilisation began with a good water supply."'],
    2: ['"Trade routes: the first internet, but with more camels."', '"Every revolution begins with a person who was tired of waiting."'],
    3: ['"Primary sources. A letter from the time beats ten textbooks from today."', '"Cause and consequence. Write both, in that order, in complete sentences."'],
  },
  art: {
    all: ['"There are no mistakes in art, only happy accidents with deadlines."', '"Look longer than you think you need to. Then look again."'],
    1: ['"Primary colours first: red, yellow, blue. Mix gently, they bruise."', '"Draw what you see, not what you think a nose looks like."'],
    2: ['"Shadows are not black. They are every colour you have been ignoring."', '"Composition: where does the eye go? Make it go somewhere interesting."'],
    3: ['"A portfolio is a diary in colour. Make yours honest."', '"Break a rule on purpose today. Then tell me which one."'],
  },
  pe: {
    all: ['"Warm up first. Heroes pull muscles too."', '"Water bottle. Shoelaces. Smile. In that order."'],
    1: ['"Two laps to start. Nobody is racing. Okay, Kit is racing."', '"Stretch like a cat, run like a dog, rest like a Hartley on a Sunday."'],
    2: ['"Teamwork drill: the ball only counts if you passed it first."', '"Pace yourself. The fastest start is not the fastest finish."'],
    3: ['"Final-year fitness test is coming. Your legs know it already."', '"Breathe in through the nose. Out through the finish line."'],
  },
};

/** Pool of lines usable in `year` for `subject`. */
export function flavourPool(subject, year = 1) {
  const t = FLAVOUR[subject] || FLAVOUR.math;
  return [...t.all, ...(t[year] || t[1])];
}

/** Deterministic per day + period: the same lesson always opens with the same line (no flicker on re-entry). */
export function flavourLine(subject, year, seed, absDay, period) {
  const pool = flavourPool(subject, year);
  return rngFor(`${seed}:flavour:${absDay}:${period}:${subject}`).pick(pool);
}

export const LATE_LINES = [
  '"Ah, Theo. How kind of you to join us. Do sit."',
  '"The bell is not a suggestion, Theo. Quietly, please."',
  '"Late again? Take your seat, we have already started."',
  '"Hm. Next time the bell, not after the bell. Sit."',
];
export const lateLine = (seed, absDay, period) => rngFor(`${seed}:late:${absDay}:${period}`).pick(LATE_LINES);

export const ATTENTION = [
  { id: 'listen', label: 'Listen', desc: 'Follow the lesson closely. Steady and sensible: +2.' },
  { id: 'notes', label: 'Take notes', desc: 'Write everything down. +3, but writing costs 2 energy.' },
  { id: 'doze', label: 'Doze off', desc: 'Rest your eyes. +5 energy, no learning, conduct -1.' },
  { id: 'pass_note', label: 'Pass a note', desc: '+1 learning, +1 charm. Might get caught: conduct -2.' },
];

/** One pop-quiz question from the subject bank: tier follows the year (falls back to any lower, then any). Seeded per day. */
export function pickQuizQuestion(bank, { seed, absDay, period, year }) {
  if (!bank || !bank.length) return null;
  let cands = bank.filter((q) => q.tier === year);
  if (!cands.length) cands = bank.filter((q) => q.tier <= year);
  if (!cands.length) cands = bank;
  const q = rngFor(`${seed}:quizq:${absDay}:${period}`).pick(cands);
  return { q: q.q, options: q.a.slice(), correct: q.correct, tier: q.tier, topic: q.topic, struck: [] };
}

// ---------------------------------------------------------------- layout helpers
/** Wrap a question to `maxW` pixels, at most `maxLines` lines (the last gets an ellipsis if cut). */
export function layoutQuestion(text, maxW, maxLines = 3) {
  const lines = wrapText(text, maxW);
  if (lines.length <= maxLines) return lines;
  const cut = lines.slice(0, maxLines);
  cut[maxLines - 1] = `${cut[maxLines - 1].replace(/\s+$/, '')}...`;
  return cut;
}

/** ListMenu items for a question: struck options are greyed + disabled + marked; label shortened to fit `maxW` px. */
export function optionItems(question, maxW = 270) {
  const struck = question.struck || [];
  return question.options.map((o, i) => {
    const isStruck = struck.includes(i);
    let label = `${'ABCD'[i]}. ${o}`;
    if (isStruck) label = `x ${label}`;
    while (measureText(label) > maxW && label.length > 4) label = `${label.slice(0, -4)}...`;
    return { label, value: undefined, disabled: isStruck, index: i };
  });
}

export const hintNote = (strikes) => (strikes >= 1 ? 'Your studies helped: some wrong answers are struck out.' : '');

export const examTitle = (examLabel, dayIndex, subject) => `${examLabel} - Day ${dayIndex + 1} - ${subjectLabel(subject)}`;
export const progressLabel = (i, total) => `Question ${Math.min(i + 1, total)}/${total}`;

export function proctorLine(score, late = false) {
  if (late && score < 40) return 'Proctor: "Pens down. Next time, be on time."';
  if (score >= 90) return 'Proctor: "Excellent paper. Hand it in with pride."';
  if (score >= 70) return 'Proctor: "Solid work. Pens down, please."';
  if (score >= 55) return 'Proctor: "A pass. Just. Pens down."';
  return 'Proctor: "Pens down. There is always the next exam."';
}

// ---------------------------------------------------------------- grades / report card
export const GRADE_COLOR = { A: '#2f7d32', B: '#2d6f9a', C: '#8a6a1a', D: '#b0561f', F: '#b3261e' };
export const gradeColor = (letter) => GRADE_COLOR[letter] || GRADE_COLOR.F;
export const scoreBarColor = (score) => (score >= 90 ? '#4fb55a' : score >= 70 ? '#4f9ad0' : score >= 55 ? '#d6a43a' : '#d0584a');

export const STANDING_LABEL = { honors: 'Honors', good: 'Good standing', fair: 'Fair', probation: 'Probation' };
export const STANDING_COLOR = { honors: '#2f7d32', good: '#2d6f9a', fair: '#8a6a1a', probation: '#b3261e' };

export const TEACHER_COMMENT = {
  honors: [
    'Theo, this is outstanding work. Clara had better watch her top spot. Keep that curiosity burning.',
    'A wonderful report. You work hard and it shows. I am proud to be your homeroom teacher.',
    'Brilliant results. Remember to rest too: the best students are not the most tired ones.',
  ],
  good: [
    'A good, steady report, Theo. Your effort is paying off. A little more in your weakest subject and you will fly.',
    'Well done. You are doing right by yourself. Keep it up and keep smiling.',
    'Solid results. You have the ability to climb higher, and I know you will.',
  ],
  fair: [
    'A fair report. There is room to grow, and I believe you can. Try a quiet hour at the library.',
    'Not bad, not yet great. Pay attention in class and the numbers will follow.',
    'You are halfway there, Theo. Study a little every day rather than a lot on one.',
  ],
  probation: [
    'Theo, I must be firm: these results are worrying. I know you can do better, and I will help.',
    'This is a hard report to write. You are on probation, but one term does not define you.',
    'We need to talk about your studies. Come to me when you want help. I am not giving up on you.',
  ],
};

export function teacherComment(standing, seed, key) {
  const list = TEACHER_COMMENT[standing] || TEACHER_COMMENT.fair;
  return rngFor(`${seed}:comment:${key}`).pick(list);
}
export const remedialNotice = (days) => (days > 0 ? `Remedial study: ${days} after-school session${days === 1 ? '' : 's'} in the library with me.` : '');

// ---------------------------------------------------------------- study
export const REMEDIAL_LINE = 'Ms. Delaney: "Library, Theo. One hour, and no arguing. I will be here, and I will bring tea."';
export const STUDY_FLAVOUR = {
  home: ['Lamplight, a sharp pencil, and one stubborn chapter.', 'Aunt Roz hums downstairs. The notes slowly make sense.', 'The kettle clicks off. Back to the page.'],
  library: ['The library hums with turning pages.', 'A quiet corner, a tall shelf, and a thick book.', 'Somewhere, a librarian shushes a sneeze.'],
};

/** Hours the player can afford (energy-wise) given the per-hour cost. */
export function hourOptions(energy, cost, maxHours = 3) {
  return Array.from({ length: maxHours }, (_, i) => ({ hours: i + 1, cost: cost * (i + 1), enabled: energy >= cost * (i + 1) }));
}

/** Time-of-day tint over a backdrop: [r,g,b,a] by minute of day. */
export function timeTint(minute) {
  const h = (minute % 1440) / 60;
  if (h < 6) return [20, 30, 80, 0.42];
  if (h < 8) return [255, 190, 120, 0.14];
  if (h < 16) return [255, 255, 255, 0];
  if (h < 19) return [255, 150, 70, 0.16];
  if (h < 21) return [60, 50, 120, 0.3];
  return [20, 30, 80, 0.4];
}
export const tintCss = ([r, g, b, a]) => `rgba(${r},${g},${b},${a})`;

export const joinGains = (gains) => Object.entries(gains || {}).map(([k, v]) => `${SUBJECT_SHORT[k] || k} +${v}`).join('  ');
