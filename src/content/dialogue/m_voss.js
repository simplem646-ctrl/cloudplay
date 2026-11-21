// Mrs. Margaret Voss: school board chair, Clara's mother. Crisp, courteous, economical with words. Numbers equal love. Not a villain.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['m_voss', '>=', lo] });

export default {
  npc: 'm_voss',
  talk: [
    t(20, { time: ['07:00', '12:00'] }, ['neutral', `Good morning, Mr. Hartley. I trust you are punctual. The schedule is not a suggestion.`]),
    t(20, { time: ['12:00', '18:00'] }, ['neutral', `Afternoon. I have eleven minutes. Use them wisely. Or do not. That is also data.`]),
    t(20, { time: ['18:00', '24:00'] }, ['thinking', `Evening. The board papers do not read themselves. I have tried. Several times.`]),
    t(21, { weather: 'rain' }, ['neutral', `Rain. A modest inconvenience. I carry an umbrella and a backup umbrella. It is not excessive. It is prudent.`]),
    t(22, { season: 'spring' }, ['neutral', `Spring term begins. Enrolment numbers are the lifeblood of a school. Do tell your friends.`]),
    t(22, { season: 'autumn' }, ['neutral', `Autumn. The Bell Festival. I will attend. I will not enjoy it. I will perhaps enjoy it slightly.`]),
    t(22, { season: 'winter' }, ['neutral', `Winter. The budget review approaches. As does a very long meeting. Dress warmly.`]),
    t(24, { map: 'town_hall' }, ['neutral', `Town Hall. I have a desk here. It is a very good desk. It has a very good view of paperwork.`]),
    t(24, { map: 'school_hall_1f' }, ['neutral', `The front hall. A school is judged by its entrance. I am pleased to report that this one passes. Barely.`]),
    t(25, H(4), ['neutral', `Mr. Hartley. You are conscientious. Clara mentions you. Briefly. Accurately.`]),
    t(26, { flag: 'main_committee_joined' }, ['thinking', `The Bell Committee. Admirable. Sentiment does not balance budgets. But it occasionally raises them.`]),
    t(26, { flag: 'main_board_letter' }, ['neutral', `You have read the board's letter. Good. I prefer informed students. They are less alarming.`]),
    t(28, { flag: 'main_bell_restored' }, ['shy', `The bell. I listened. I... did not expect to be moved. I would appreciate it if you did not mention this.`]),
    t(30, { festival: true }, ['neutral', `A festival. Attendance is... considerable. I find myself calculating. And, regrettably, enjoying.`]),
    t(1, null, ['neutral', `Mr. Hartley. A pleasure. Briefly stated.`]),
    t(1, null, ['neutral', `Numbers are a form of care. They tell us what we owe each other. I try to be accurate.`]),
    t(1, null, ['thinking', `Clara works very hard. I hope she knows I notice. I am not sure I say it. Hm.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Again. Efficiency is a virtue. Repetition is... tolerable.`]),
    t(1, null, ['neutral', `I am between meetings. Which is to say, I am in one.`]),
    t(1, null, ['thinking', `Thank you for your time. And for mine.`]),
    t(5, H(6), ['shy', `...You are kind to my daughter. I observe these things. Thank you.`]),
  ],
  gift: {
    loves: ['tea_leaves', 'coffee_beans', 'dark_chocolate', 'notebook'],
    likes: ['tea', 'coffee', 'cookie_box', 'calculator', 'textbook_math', 'daisy_white'],
    dislikes: ['soda', 'energy_drink', 'whoopee_cushion'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['surprised', `This is... entirely unexpected. And entirely welcome. Thank you, Mr. Hartley.`], ['shy', `You are observant. A rare asset. I will keep this. In a visible place.`]],
      likes: [['neutral', `A sensible choice. Thank you.`], ['happy', `Appreciated. I will make good use of it.`]],
      neutral: [['neutral', `Thank you. It will be logged.`], ['neutral', `Noted. And appreciated.`]],
      dislikes: [['neutral', `Not to my taste. But the gesture is noted.`], ['sad', `I will place it in a drawer. A tidy drawer.`]],
      hates: [['angry', `Mr. Hartley. I must decline. Firmly.`], ['neutral', `I will pretend that did not occur.`]],
      birthday: [['surprised', `You know my birthday? That is... considerate. Thank you.`], ['shy', `A gift. From a student. I find I do not know the protocol. I accept.`]],
    },
  },
};
