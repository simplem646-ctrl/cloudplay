// Principal Evelyn Marsh: calm, measured, kind. Gentle proverbs. Carries the school's survival. Never raises her voice.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['principal_marsh', '>=', lo] });

export default {
  npc: 'principal_marsh',
  talk: [
    t(20, { time: ['07:00', '10:00'] }, ['neutral', `Good morning, Mr. Hartley. A school is like a garden: it wakes best when someone says hello.`]),
    t(20, { time: ['10:00', '16:00'] }, ['neutral', `Afternoon. I've learned that the quietest corridors tell the loudest stories. Listen as you walk.`]),
    t(20, { time: ['16:00', '22:00'] }, ['thinking', `Late again at my desk. Paper is patient, and so, I hope, are the people it concerns.`]),
    t(21, { weekday: 'Mon' }, ['neutral', `Monday. Every week is a small year. It begins quietly and ends in laughter, if we are fortunate.`]),
    t(22, { weather: 'rain' }, ['thinking', `Rain. They say a school bell sounds sweeter after a storm. I have always believed it.`]),
    t(22, { weather: 'snow' }, ['happy', `Snow. Even the strictest teacher cannot resist a window today. I permit it. Briefly.`]),
    t(23, { season: 'spring' }, ['happy', `Spring. A new entrance, a new chapter. The cherry trees do not rush. Nor should we.`]),
    t(23, { season: 'summer' }, ['neutral', `Summer. A school at rest is merely a school remembering. Try not to forget the lessons.`]),
    t(23, { season: 'autumn' }, ['happy', `Autumn. The Bell Festival draws near. A festival is just a way of being gently proud together.`]),
    t(23, { season: 'winter' }, ['thinking', `Winter. The year grows old, and the school learns whether it has been worthy of it.`]),
    t(24, { map: 'school_hall_1f' }, ['neutral', `The front hall. Every footstep here is a small promise. I try to answer each of them.`]),
    t(24, { map: 'school_grounds' }, ['happy', `The grounds. I plant a seedling here each year. Not all take. But the ones that do are very generous.`]),
    t(25, H(4), ['happy', `Mr. Hartley, you have a way of making a place feel kept. A rare thing. Thank you.`]),
    t(26, { flag: 'main_committee_joined' }, ['neutral', `The committee does good work. The bell will ring or it will not. But it will have been asked. That matters.`]),
    t(26, { flag: 'main_core_found' }, ['surprised', `You found the core. I confess I did not think it possible. Perhaps I did not hope hard enough.`]),
    t(28, { flag: 'main_bell_restored' }, ['happy', `The bell is restored. A school and its bell, whole again. I may need to sit down, quietly, in my office.`]),
    t(26, { year: 3 }, ['thinking', `Your final year. A school's best lesson is the one it cannot grade. I think you have taught us several.`]),
    t(30, { festival: true }, ['happy', `A day of gathering. I am told I should be formal. I am choosing to eat a dumpling instead.`]),
    t(1, null, ['neutral', `Mr. Hartley. May I offer a thought? Be kind to your own pace. The bell rings when it is ready.`]),
    t(1, null, ['thinking', `A school is not its walls. It is the people who agree to keep returning. Thank you for returning.`]),
    t(1, null, ['happy', `If you ever need a quiet moment, my door is open. So is my tea tin. Both are slightly dented.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `We meet again. A pleasant coincidence.`]),
    t(1, null, ['thinking', `I find that second conversations are often the honest ones.`]),
    t(1, null, ['happy', `Back so soon? The school thanks you for your attention. As do I.`]),
    t(5, H(6), ['shy', `You remind me of why I took this post. I do not say it lightly.`]),
  ],
  gift: {
    loves: ['tea_leaves', 'daisy_white', 'music_box', 'novel_mystery'],
    likes: ['tea', 'cookie_box', 'notebook', 'paper_lantern', 'sunflower', 'postcard_set'],
    dislikes: ['soda', 'whoopee_cushion', 'energy_drink'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['surprised', `Oh. This is a lovely gift, Mr. Hartley. I am quite moved. I shall keep it on my desk, among the serious things.`], ['happy', `Thank you. I have not been given something so thoughtful in a long time.`]],
      likes: [['happy', `How kind. It will be put to good use. Or good display.`], ['neutral', `Thank you. A thoughtful choice.`]],
      neutral: [['neutral', `Thank you, Mr. Hartley. I will find it a good home.`], ['happy', `A kind gesture. I accept with gratitude.`]],
      dislikes: [['neutral', `Hm. Not quite to my taste. But a gift is a thought, and the thought is welcome.`], ['sad', `I will keep it, discreetly.`]],
      hates: [['sad', `Mr. Hartley. I fear I cannot accept this. Gently, I decline.`], ['neutral', `Please take it back. Politely, but with some urgency.`]],
      birthday: [['surprised', `You remembered. How very kind. Few do, and I prefer it that way. But today, it is welcome.`], ['happy', `Thank you. Another year older, and one kind student wiser. A good trade.`]],
    },
  },
};
