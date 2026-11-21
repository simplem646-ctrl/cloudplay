// Vera Lindqvist dialogue pool (S3). "New kid" until 3 hearts, then "Theo". Deadpan, few words; soft around cats and music.
const H = (lo) => ({ hearts: ['vera', '>=', lo] });
const band = (lo, hi) => ({ all: [{ hearts: ['vera', '>=', lo] }, { hearts: ['vera', '<', hi] }] });

export default {
  npc: 'vera',
  talk: [
    // hearts 0-2: new kid
    { when: band(0, 3), priority: 20, say: [['neutral', `Occupied.`], ['neutral', `...New kid. You can stay. Don't talk.`]] },
    { when: band(0, 3), priority: 20, say: [['neutral', `You're still here. Biscuit's counting. So am I.`]] },
    { when: band(0, 3), priority: 20, say: [['smug', `Class is that way, new kid. I'd point, but I've never found it.`]] },
    // 3-5: Theo
    { when: band(3, 6), priority: 20, say: [['neutral', `Theo. ...Yes, I said it. It's a name. It's not a speech.`]] },
    { when: band(3, 6), priority: 20, say: [['shy', `I'm playing a bit more. Nobody knows. Don't tell. Don't look pleased. You're looking pleased.`]] },
    { when: band(3, 6), priority: 20, say: [['neutral', `Coffee's black and the weather's grey. It's fine. It matches.`]] },
    { when: band(3, 6), priority: 20, say: [['smug', `The vending machine ate my coin. I've been plotting revenge for three days. It's going well. I haven't done anything.`]] },
    // 6-8
    { when: band(6, 9), priority: 20, say: [['shy', `I was going to say something nice. It's gone. It was good. You'll have to imagine it.`]] },
    { when: band(6, 9), priority: 20, say: [['neutral', `Biscuit's been sitting on my keyboard bag all day. It's a hint. I'm ignoring it. Politely.`]] },
    { when: band(6, 9), priority: 20, say: [['shy', `Nineteen bars. Twenty-one. Last night I got to the end. Then I lay on the floor for ten minutes. It was fine.`]] },
    // 9-10
    { when: H(9), priority: 20, say: [['shy', `I used to think quiet was empty. Lately it's full. You're mostly why.`]] },
    { when: H(9), priority: 20, say: [['happy', `I smiled at a stranger today. Briefly. It scared them. It scared me. It was a good day.`]] },
    // dating
    { when: { dating: 'vera' }, priority: 30, say: [['shy', `Hey. ...Sleeve? Okay. Take it. I'm not complaining. I'm just sitting very quietly near you.`], ['happy', `You came. Of course you did. I'm... pleased. In my own... dim way.`]] },
    { when: { dating: 'vera' }, priority: 30, say: [['shy', `I wrote you a tune. It's four bars. It's got a mistake in the third. I left it in. On purpose. It's the best bit.`]] },
    { when: { all: [{ dating: 'vera' }, { time: ['19:00', '23:30'] }] }, priority: 40, say: [['shy', `It's dark, it's quiet, you're here. That's the full playlist. Stay.`]] },
    // weather / season / weekday / place / flags
    { when: { weather: 'rain' }, priority: 25, say: [['neutral', `Rain on the water tank. It's the best drum kit in town. Free. Totally unlicensed.`]] },
    { when: { weather: 'snow' }, priority: 25, say: [['happy', `Snow. Everything goes soft. Even the noise. It's the only weather that agrees with me.`]] },
    { when: { season: 'winter' }, priority: 22, say: [['neutral', `Winter. Short days. Long nights. Plenty of time to not talk to anybody. My favourite season.`]] },
    { when: { season: 'summer' }, priority: 22, say: [['neutral', `Summer's too bright. The roof is a frying pan. Biscuit's melted into the cardboard. I'm hiding under the water tank.`]] },
    { when: { weekday: ['Sat', 'Sun'] }, priority: 22, say: [['neutral', `Weekend. No bell. No one on the roof. It's nearly unbearable how good it is.`]] },
    { when: { map: 'school_rooftop' }, priority: 24, say: [['neutral', `You're on my roof. Be quiet. Or don't. I'm too comfortable to enforce it.`]] },
    { when: { map: 'town_harbor' }, priority: 24, say: [['neutral', `The sea doesn't ask what you want. It comes in, it goes out. That's the whole argument.`]] },
    { when: { map: 'school_hall_2f' }, priority: 24, say: [['neutral', `There's a door down there with a piano behind it. Don't look at it. It's looking back.`]] },
    { when: { all: [{ seen: 'vera_04_festival' }, { hearts: ['vera', '<', 8] }] }, priority: 26, say: [['shy', `I still think about the seventeenth bar. I hummed it at a lantern. Don't bring it up.`]] },
    { when: { all: [{ seen: 'vera_03_secret' }, { quest: ['vera_piano', 'active'] }] }, priority: 26, say: [['neutral', `Bar sixteen was a wall. Now it's a speed bump. A tall one. With a cat sitting on it.`]] },
    { when: { flag: 'vera_confess_notyet' }, priority: 27, say: [['neutral', `The roof's open. The cat's open. I'm... mostly open. Don't read into it.`]] },
    { priority: 1, say: [['neutral', `Mm.`]] },
    { priority: 1, say: [['smug', `I'd say something witty. It's in the queue. Behind four sighs.`]] },
  ],
  repeat: [
    { priority: 1, say: [['neutral', `Again? I'm flattered. Not out loud.`]] },
    { priority: 1, say: [['neutral', `We've spoken. It's fine. I'm still recovering.`]] },
    { priority: 1, say: [['smug', `Visiting hours are over. I run the hours. It's a very small hospital.`]] },
    { priority: 1, say: [['neutral', `Mm. Hi. Bye.`]] },
    { when: H(5), priority: 5, say: [['shy', `Twice in one day. That's a record. It's also fine.`]] },
    { when: H(7), priority: 6, say: [['shy', `...I wasn't waiting. I was standing near the door. For my own reasons.`]] },
    { when: { dating: 'vera' }, priority: 8, say: [['shy', `Mm. You again. Good. My sleeve was lonely.`]] },
    { when: { weather: 'rain' }, priority: 3, say: [['neutral', `Rain. Stay under the awning. I'll be here. Not saying anything.`]] },
  ],
  gift: {
    loves: ['black_licorice', 'music_box', 'headphones', 'cat_treats', 'coffee_beans'],
    likes: ['coffee', 'plushie_cat', 'dark_chocolate', 'tea_leaves', 'novel_mystery', 'postcard_set', 'knit_scarf', 'paper_lantern'],
    dislikes: ['bouquet', 'perfume', 'candy', 'plushie_bear', 'whoopee_cushion'],
    hates: ['pep_tonic', 'energy_drink'],
    lines: {
      loves: [['surprised', `...You got me that. On purpose. Okay. Hang on. I'm going to stand very still until the feeling passes.`], ['shy', `That's... that's actually perfect. Don't make a face. Okay, make a small one.`], ['happy', `Mm. Yes. Good. This is the best thing that's happened to me this week. I'm not saying that twice.`], ['shy', `You listen. That's... unfair. People shouldn't be allowed to listen that well.`]],
      likes: [['neutral', `Not bad. Not bad at all. I'll... keep it somewhere.`], ['shy', `Okay. That's good. It's a good thing. Thank you.`], ['smug', `You're improving, new, no. Theo. You're improving.`], ['neutral', `I'll use it. Quietly. Without comment.`]],
      neutral: [['neutral', `Huh. Thanks. I think.`], ['neutral', `A thing. I'll put it with the other things.`], ['thinking', `I'll figure out what it's for. Eventually. Possibly never.`], ['neutral', `Fine. Thanks. It's fine.`]],
      dislikes: [['neutral', `Ah. Hm. It's... very loud. In a visual sense.`], ['sad', `That's, um. Kind. Not for me. I'll... find it a home.`], ['neutral', `I'll take it. I'll put it where I can't see it. Under the cat.`], ['angry', `It's got too many feelings. Please take some of them back.`]],
      hates: [['angry', `No. Absolutely not. I'll be taking that as an insult. Politely. With teeth.`], ['angry', `That's a thing a crowd would hand a stranger. Take it. Away.`], ['sad', `I thought you knew me. Okay. It's fine. It's a hard lesson. I'll live.`], ['angry', `If you hand me that again, I'm going back to "Occupied."`]],
      birthday: [['surprised', `You... know the eleventh. I never said. Who told you? Biscuit? I'm going to have words.`], ['shy', `Nobody's given me a gift on that day in five years. It's usually a bad day. It's... not today.`], ['happy', `Thank you. I'll keep it forever. Or until it breaks. Then I'll keep the pieces.`], ['shy', `This is the first birthday I've wanted to remember. Don't smile. Okay, smile a bit. Once.`]],
    },
  },
};
