// Clara Voss dialogue pool (S3). "Hartley" until 5 hearts, then "Theo" (and "Hartley" as an endearment). Formal, no contractions, dry.
const H = (lo) => ({ hearts: ['clara', '>=', lo] });
const band = (lo, hi) => ({ all: [{ hearts: ['clara', '>=', lo] }, { hearts: ['clara', '<', hi] }] });

export default {
  npc: 'clara',
  talk: [
    // hearts 0-2
    { when: band(0, 3), priority: 20, say: [['neutral', `Hartley. Your collar is crooked. I do not mean this as an insult. I mean it as a fact that I am obliged to report.`]] },
    { when: band(0, 3), priority: 20, say: [['smug', `The next exam is closer than you imagine. I am only saying. As class representative. With no ulterior motive whatsoever.`]] },
    { when: band(0, 3), priority: 20, say: [['neutral', `If you require the homework, it is on the board. If you require an opinion about the homework, I have several. They are on a separate sheet.`]] },
    // 3-4
    { when: band(3, 5), priority: 20, say: [['neutral', `Hartley. I noticed you have begun sitting nearer the front. I am pleased. Purely on grounds of attendance.`]] },
    { when: band(3, 5), priority: 20, say: [['shy', `I did not sleep well. A comet. Never mind. It was only a comet.`]] },
    { when: band(3, 5), priority: 20, say: [['thinking', `Do you consider "rival" a pejorative? I have been wondering. I do not believe I mind it. It is oddly warm.`]] },
    // 5-8: Theo
    { when: band(5, 9), priority: 20, say: [['happy', `Theo. Good afternoon. I have been looking for you for eleven minutes. This is not a long time. I am only noting it.`]] },
    { when: band(5, 9), priority: 20, say: [['shy', `I counted a new star last night. I have not yet named it. I am told that is how it is done, and that I may not use my own surname.`]] },
    { when: band(5, 9), priority: 20, say: [['neutral', `Mother asked about you at dinner. I said, "He is adequate." She said, "Adequate?" I said, "Considerably." That was the whole conversation.`]] },
    { when: band(5, 9), priority: 20, say: [['smug', `I scored ninety-six on the quiz. You scored ninety-four. You will observe I am being gracious by not mentioning it. Ninety-six.`]] },
    // 9-10
    { when: H(9), priority: 20, say: [['shy', `I used to think a day well spent was a day ranked. Lately I measure them by how many times I laughed. It is a poor metric. I am enjoying it.`]] },
    { when: H(9), priority: 20, say: [['happy', `Theo. You are the only person who says my name in a tone that is not an instruction. I shall treasure it. In writing.`]] },
    // dating
    { when: { dating: 'clara' }, priority: 30, say: [['shy', `Good morning. I have been rehearsing "good morning" in a warmer register. Was that adequate?`], ['happy', `Please walk on the left. My right hand is for you. The left is for my bag. It is a system.`]] },
    { when: { dating: 'clara' }, priority: 30, say: [['happy', `I have written your birthday on my calendar in a colour I reserve for emergencies and astronomical events. You may take that as a compliment.`]] },
    { when: { all: [{ dating: 'clara' }, { time: ['19:00', '23:00'] }] }, priority: 40, say: [['shy', `The sky is clear tonight. Shall we? It is cold. I have two scarves. One is yours. Do not say anything. Just wear it.`]] },
    // weather / season / weekday / place / flags
    { when: { weather: 'rain' }, priority: 25, say: [['neutral', `Rain. A shame for the sky and a convenience for the library. I prefer to see it as a trade.`]] },
    { when: { weather: 'snow' }, priority: 25, say: [['happy', `Snow! Every flake is, I am told, unique. I have not verified it. I am trying very hard not to.`]] },
    { when: { season: 'autumn' }, priority: 22, say: [['neutral', `Autumn has the best skies. Cold air, clear air. Orion comes up late. It is a very reasonable season.`]] },
    { when: { season: 'spring' }, priority: 22, say: [['neutral', `Blossom season is a hazard for the library: petals on the carpet. I wrote a memo. The librarian framed it. I have not forgiven her.`]] },
    { when: { weekday: ['Sat', 'Sun'] }, priority: 22, say: [['neutral', `The weekend. I have scheduled four hours of rest. I do not know what to do with them. Suggestions will be considered.`]] },
    { when: { map: 'school_library' }, priority: 24, say: [['neutral', `The reading room is a place of quiet. Please be quiet. I say this affectionately. With a hint of menace.`]] },
    { when: { map: 'school_rooftop' }, priority: 24, say: [['thinking', `One does not realise how large the sky is until one stands beneath it with nothing to submit.`]] },
    { when: { map: 'school_hall_2f' }, priority: 24, say: [['neutral', `The council room is just there. I am due in four minutes. I would like to be anywhere else. This is a confession. Please do not file it.`]] },
    { when: { all: [{ seen: 'clara_04_festival' }, { hearts: ['clara', '<', 7] }] }, priority: 26, say: [['shy', `I have been thinking about the blanket. Ninety centimetres. It was adequate. It was, in fact, rather more than adequate.`]] },
    { when: { all: [{ seen: 'clara_03_secret' }, { quest: ['clara_stars', 'active'] }] }, priority: 26, say: [['neutral', `Four hundred and twelve. I recounted. Still four hundred and twelve. Mother has not mentioned it. Either a good sign, or a very good strategy.`]] },
    { when: { flag: 'clara_confess_notyet' }, priority: 27, say: [['neutral', `The motion remains tabled, Theo. I am patient. It is one of my three virtues. The other two are punctuality and lamination.`]] },
    { priority: 1, say: [['neutral', `Hartley. Good day. Unless you are about to say something clever, I shall continue reading.`]] },
    { priority: 1, say: [['smug', `I am told I am "intimidating". I prefer "well organised". Between us, it is the same word with better posture.`]] },
  ],
  repeat: [
    { priority: 1, say: [['neutral', `We have spoken already today. I am not complaining. I am merely noting that it was efficient.`]] },
    { priority: 1, say: [['thinking', `I am in the middle of a thought. It is a good thought. You are welcome to wait.`]] },
    { priority: 1, say: [['smug', `Again? I shall have to start charging for the consultation. In tea.`]] },
    { priority: 1, say: [['neutral', `I find that the best answer to a second visit is a quiet nod. Here it is.`]] },
    { when: H(5), priority: 5, say: [['shy', `Theo. Twice in one day. I shall pretend it is coincidence, and it is not in my interest to be disproved.`]] },
    { when: H(7), priority: 6, say: [['shy', `If you intend to return a third time, I shall move my chair closer. In the interest of efficiency.`]] },
    { when: { dating: 'clara' }, priority: 8, say: [['happy', `I am aware this is the second time. I am delighted. I have not been this inefficient on purpose in years.`]] },
    { when: { weather: 'rain' }, priority: 3, say: [['neutral', `Take the umbrella. I have two. It is a matter of principle, and also, I like you dry.`]] },
  ],
  gift: {
    loves: ['dark_chocolate', 'star_chart', 'tea_leaves', 'notebook', 'textbook_science'],
    likes: ['tea', 'novel_mystery', 'postcard_set', 'hairpin', 'silk_ribbon', 'music_box', 'coffee_beans', 'paper_lantern'],
    dislikes: ['soda', 'candy', 'ice_cream', 'perfume', 'plushie_bear'],
    hates: ['whoopee_cushion', 'energy_drink'],
    lines: {
      loves: [['surprised', `For me? This is exactly what I would have bought, had I permitted myself to. You have good judgment, Hartley.`], ['shy', `You remembered. I did not think anyone listened to the dull parts. Thank you.`], ['happy', `I am going to use this immediately, and tell no one. It will be our secret. And the footnotes.`], ['shy', `A perfect choice. I shall be insufferable about it for days.`]],
      likes: [['happy', `Thank you. It is thoughtful, and it is correctly proportioned. Both are rare.`], ['neutral', `Acceptable. I mean it as high praise. Do not ask me to elaborate.`], ['smug', `You are learning my preferences. I shall have to add a column to the file.`], ['shy', `That was kind. I shall find a suitable shelf for it. A shelf with clearance.`]],
      neutral: [['neutral', `Thank you. I will, ah, find a use for it. Or a drawer.`], ['neutral', `An unusual gift. I shall reserve judgment, and record my reservations in writing.`], ['thinking', `It is... a thing. I will think about where it belongs.`], ['neutral', `Appreciated. The thought, naturally. The object, pending review.`]],
      dislikes: [['neutral', `Ah. Thank you. I have a policy about this sort of item. It is not a kind policy.`], ['sad', `That is a gesture. I am touched by the gesture. The item will need to go somewhere else.`], ['neutral', `I do not wish to be rude. I shall therefore say nothing, in a tone that says a good deal.`], ['shy', `I shall keep it. Somewhere. Out of my own line of sight.`]],
      hates: [['angry', `That is the single worst thing you could have brought me. Take it back. Please. I mean it with all my formal training.`], ['angry', `I have written a policy memo specifically about this. You are acquainted with the policy now.`], ['sad', `I thought you knew me better. I am let down, Hartley. A little.`], ['angry', `No. Absolutely not. I shall be disinfecting my desk.`]],
      birthday: [['surprised', `You knew my birthday. I did not tell you. I am going to need a moment, and I shall have it in silence.`], ['shy', `A gift on the fourth of Autumn. Nobody has given me one since I was eleven. It is perfect. I shall not weep. I shall hold my breath.`], ['happy', `Thank you. I have attended nineteen birthdays of my own. This is the first one worth recording.`], ['shy', `It is the best present I have had. You may tell nobody. I will, however, tell the stars.`]],
    },
  },
};
