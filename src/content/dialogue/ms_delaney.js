// Ms. Delaney: Class B homeroom, Literature, Literature Club advisor. Warm, wry, a coffee joke in every class.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['ms_delaney', '>=', lo] });

export default {
  npc: 'ms_delaney',
  talk: [
    t(20, { time: ['07:00', '10:00'] }, ['neutral', `Good morning, Theo. I am on cup one. Please treat me as a fragile antique until cup two.`]),
    t(20, { time: ['10:00', '14:00'] }, ['happy', `Mid-day. Cup three. I'm now at ninety percent warmth. Ask me anything. Except about the attendance sheet.`]),
    t(20, { time: ['14:00', '20:00'] }, ['smug', `Cup five. I can see through walls. Don't test me.`]),
    t(21, { weekday: 'Mon' }, ['neutral', `Monday. A day invented to prove coffee works. Put your homework on my desk, politely.`]),
    t(21, { weekday: 'Fri' }, ['happy', `Friday. Even the chalk looks relaxed. Hand in the essay, enjoy the weekend, remember me fondly.`]),
    t(22, { weather: 'rain' }, ['thinking', `Rain on the window. Perfect conditions for rereading something old. Or grading something new. Mostly the second.`]),
    t(22, { weather: 'snow' }, ['happy', `Snow! The whole class will stare out the window. I will pretend to be cross. I'll be staring too.`]),
    t(23, { season: 'spring' }, ['happy', `New term, new notebooks. Optimism is catching. Do not cough on it.`]),
    t(23, { season: 'autumn' }, ['neutral', `Bell Festival is near. The booth reports are due. Yes, "vibes" is not a report.`]),
    t(23, { season: 'winter' }, ['neutral', `Exams, snow, and one tired teacher. Remember: the answer is rarely "eventually."`]),
    t(24, { map: 'school_classroom' }, ['smug', `Welcome to Class B. Sit, breathe, do not name the stain on the back wall. It has a name. I won't tell you.`]),
    t(25, H(4), ['neutral', `You're doing better than you think, Theo. I say that rarely. Don't tell the others.`]),
    t(25, { club: 'literature' }, ['happy', `Literature Club, hm? I knew you'd turn up. It's the quiet ones who read the loudest.`]),
    t(26, { flag: 'main_committee_joined' }, ['thinking', `The Bell Committee. I wrote my first lesson plan under that bell. It had a crack. So did I.`]),
    t(27, { flag: 'main_bell_restored' }, ['happy', `The bell. I'm not crying. It's the third cup. It does that.`]),
    t(26, { standing: 'probation' }, ['neutral', `Your marks have slipped. It happens. Sit with me after class and we'll fix it, one paragraph at a time.`]),
    t(26, { standing: 'honors' }, ['smug', `Honours-level work. I'd say "keep it up," but you know. You know.`]),
    t(30, { festival: true }, ['happy', `Festival day. I'm supervising. By which I mean I'm eating something fried near a pillar.`]),
    t(1, null, ['neutral', `Theo. Questions? Answers? Coffee? I'll take the coffee.`]),
    t(1, null, ['smug', `If you need me, I'm either here or in the staff room, refilling. Look for the trail of mugs.`]),
    t(1, null, ['happy', `A teacher's job is mostly noticing. Right now, I notice you. Good. Carry on.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Yes? I'm on a break. That is to say, I'm on a cup.`]),
    t(1, null, ['smug', `Back again? Good. The coffee is not.`]),
    t(1, null, ['happy', `Take notes. I'll take coffee. Fair trade.`]),
    t(5, H(6), ['shy', `You know, you're one of the students I'd actually miss. Don't let it go to your head.`]),
  ],
  gift: {
    loves: ['coffee_beans', 'latte', 'novel_mystery', 'tea_leaves'],
    likes: ['coffee', 'cookie_box', 'notebook', 'textbook_literature', 'cake_slice', 'daisy_white'],
    dislikes: ['soda', 'energy_drink', 'whoopee_cushion'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['surprised', `For me? ...Oh. This is the nicest thing a student's ever handed me. And I've been handed a lot of frogs.`], ['happy', `Theo, this is perfect. I'll pretend I'm not smiling. I am. It's cup four.`]],
      likes: [['happy', `How thoughtful. I'll keep it near the desk. Where I can see it. And possibly defend it.`], ['smug', `A fine choice. You'd make a decent literature major.`]],
      neutral: [['neutral', `Thank you, Theo. I'll find a place for it on the desk. Next to the stain.`], ['happy', `That's kind of you. Truly.`]],
      dislikes: [['neutral', `That's... not my taste. But I appreciate the intent. Mostly.`], ['sad', `Hm. I'll put it somewhere. Away from the coffee.`]],
      hates: [['angry', `Theo. Please remove that from my desk. And my sight.`], ['surprised', `That is an assault on my morning. I'll pretend it didn't happen.`]],
      birthday: [['surprised', `You remembered my birthday? Not even the staff room did. Thank you, Theo.`], ['happy', `A gift on my birthday and a good class on top. Two for two. I'm keeping you.`]],
    },
  },
};
