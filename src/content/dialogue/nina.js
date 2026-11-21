// Nina Calder dialogue pool (S2). "Newbie" until 4 hearts, then "Theo".
const H = (lo) => ({ hearts: ['nina', '>=', lo] });
const band = (lo, hi) => ({ all: [{ hearts: ['nina', '>=', lo] }, { hearts: ['nina', '<', hi] }] });

export default {
  npc: 'nina',
  talk: [
    // hearts 0-3: Newbie
    { when: band(0, 3), priority: 20, say: [['happy', `Newbie! Keep up! Metaphorically! Literally too, if you can.`], ['smug', `Track is at four. Come watch. Heckling is optional but encouraged.`]] },
    { when: band(0, 3), priority: 20, say: [['happy', `Do you know the best part of a morning? Being awake before everyone else. Winning before they've started.`]] },
    { when: band(0, 3), priority: 20, say: [['smug', `Newbie, how's school? Lost yet? Everyone gets lost. I got lost once. For four minutes. In my own bakery.`]] },
    { when: band(3, 4), priority: 20, say: [['neutral', `Newbie. ...You've got that look. The "I'm about to say something nice" look. Don't. I'll blush. It's a mess.`]] },
    // 4-5
    { when: band(4, 6), priority: 20, say: [['happy', `Theo! Sorry, it's still new in my mouth. Theo. Theo. Okay, I'm good.`], ['happy', `What's the plan today? I've got drills, rolls, and an unreasonable amount of energy.`]] },
    { when: band(4, 6), priority: 20, say: [['neutral', `Knee's okay today. Seven out of ten. Don't look at me like that, seven is a good number!`]] },
    { when: band(4, 6), priority: 20, say: [['smug', `I've got a new sandwich challenge. Rules are classified. Stakes are high.`]] },
    { when: band(4, 6), priority: 20, say: [['shy', `If I'm ever too loud, tell me. ...Actually don't. I like being loud around you.`]] },
    // 6-8
    { when: band(6, 9), priority: 20, say: [['happy', `You came! I was about to run a lap just to burn off the waiting.`], ['shy', `Come run with me at dawn? The harbor's pretty when we're the only two awake.`]] },
    { when: band(6, 9), priority: 20, say: [['shy', `I told my mom about you. She said she already knew. Moms are scary. Also, she packed you a roll.`]] },
    { when: band(6, 9), priority: 20, say: [['neutral', `My legs don't scare me as much lately. It's the starting line that does. But you're at the finish, so.`]] },
    // 9-10
    { when: H(9), priority: 20, say: [['happy', `Theo! My favourite person to bump into. Literally, remember the first day?`], ['shy', `I still apologise to that fountain roll.`]] },
    { when: H(9), priority: 20, say: [['shy', `I used to think speed was everything. Turns out it's who's waiting where you stop.`]] },
    // dating
    { when: { dating: 'nina' }, priority: 30, say: [['shy', `Hey, you. Hi. We're doing the hand thing again. I like the hand thing.`], ['happy', `Race you to the end of the street? Walking. Hand in hand. We both win.`]] },
    { when: { dating: 'nina' }, priority: 30, say: [['happy', `I saved you half my roll. The bigger half! Don't tell the Captain I'm going soft.`]] },
    { when: { all: [{ dating: 'nina' }, { weather: 'rain' }] }, priority: 40, say: [['happy', `Rain run! Nobody else dares! It's us and the puddles! Come on!`]] },
    // weather / season / weekday / place / flags
    { when: { weather: 'rain' }, priority: 25, say: [['neutral', `Rain makes the track slippery and my mom nervous. So I do laps in the bakery. Don't ask.`]] },
    { when: { weather: 'snow' }, priority: 25, say: [['happy', `Snow! Do you know how fast snow melts when you run through it? I tested! In the name of science!`]] },
    { when: { season: 'summer' }, priority: 22, say: [['happy', `Summer! Sunrise at five, a sprint on warm tarmac, ice-cold sports drink at six. That's heaven.`]] },
    { when: { season: 'winter' }, priority: 22, say: [['happy', `Winter dawn is so quiet you can hear your own heartbeat. Mine mostly says "bread."`]] },
    { when: { season: 'autumn' }, priority: 22, say: [['smug', `Sports Festival season. Every class thinks it can beat B. It can't. It's adorable.`]] },
    { when: { weekday: ['Sat', 'Sun'] }, priority: 22, say: [['happy', `Weekend! Bread orders double! I'm basically a delivery drone with a ponytail.`]] },
    { when: { map: 'bakery' }, priority: 24, say: [['happy', `Welcome to Calder Bakery! Everything's warm, everything's good, nothing's for sale if my mom likes you.`]] },
    { when: { map: 'school_field' }, priority: 24, say: [['smug', `This is my kingdom. The grass is the subjects. Don't step on the subjects.`]] },
    { when: { map: 'town_harbor' }, priority: 24, say: [['happy', `Harbor at dawn is the best track in the world. No lines painted. Just the sea saying "go."`]] },
    { when: { all: [{ seen: 'nina_04_festival' }, { hearts: ['nina', '<', 7] }] }, priority: 26, say: [['happy', `Still thinking about that relay. Best hand-off of my life. Don't make me say it twice.`]] },
    { when: { flag: 'nina_plush_secret' }, priority: 27, say: [['shy', `Captain Crumb says hi. He's very professional about it.`]] },
    { when: { all: [{ seen: 'nina_03_secret' }, { quest: ['nina_comeback', 'active'] }] }, priority: 26, say: [['neutral', `Knee check-in: seven out of ten. The number goes up when you're around. Medical mystery.`]] },
    { priority: 1, say: [['happy', `Hey! Don't just stand there, you'll cool down! Walk with me!`]] },
    { priority: 1, say: [['smug', `Race you to the end of the sentence. Ready? Go. ...I won. Nice talking to you.`]] },
  ],
  repeat: [
    { priority: 1, say: [['happy', `Back already? You missed me!`]] },
    { priority: 1, say: [['smug', `Can't stop, mid-stretch. Talk quick.`]] },
    { priority: 1, say: [['happy', `Hey again! Run, don't walk! Or walk, but fast!`]] },
    { priority: 1, say: [['neutral', `I'm thinking about rolls. It's a big topic.`]] },
    { when: H(4), priority: 5, say: [['shy', `Oh. Theo. Twice in one day. That's my lucky number.`]] },
    { when: H(6), priority: 6, say: [['happy', `If I say "see you later" now, will you promise to turn up? It saves me running after you.`]] },
    { when: { dating: 'nina' }, priority: 8, say: [['shy', `Still holding hands. Still unbelievably dorky. I love it.`]] },
    { when: { weather: 'rain' }, priority: 3, say: [['happy', `Splash! That's me! That's a puddle! Keep going!`]] },
  ],
  gift: {
    loves: ['sports_drink', 'stopwatch', 'bread', 'plushie_bear'],
    likes: ['sweet_bun', 'sandwich', 'riceball', 'cat_treats', 'plushie_cat', 'relay_baton', 'water_bottle', 'sneakers', 'cookie_box'],
    dislikes: ['rose_red', 'bouquet', 'tulip_pink', 'perfume', 'knit_scarf'],
    hates: ['pep_tonic', 'black_licorice'],
    lines: {
      loves: [['surprised', `For me?! A STOPWATCH-level gift! Or a bread-level! I love it!`], ['happy', `Oh my gosh, you remembered! This goes straight in my gym bag!`], ['shy', `Okay, I'm not crying, my eyes are just sweating. Thank you!`], ['happy', `Best thing anyone's given me this week! Ignoring my mom's rolls. Ignore that I said that.`]],
      likes: [['happy', `Oh nice, thanks! I'll go through this in about nine seconds!`], ['smug', `Respectable. Efficient. I like it.`], ['happy', `You're getting good at this, Theo. Newbie no more.`], ['happy', `That'll keep me going till practice, thanks!`]],
      neutral: [['neutral', `Huh. Thanks! I think I know what this is.`], ['neutral', `Cool! ...Is it edible? Sorry, my brain's mostly bread.`], ['happy', `Thanks, I'll find a place for it. Maybe the gym bag.`], ['neutral', `Appreciate it! Keep it up!`]],
      dislikes: [['neutral', `Um. Flowers. Perfume. Scarves. I don't know what to do with my hands. Thanks, I think.`], ['sad', `That's, uh, very thoughtful. I'm bad at thoughtful. Sorry.`], ['neutral', `It's nice! It's just... not me. I get awkward. Sorry!`], ['shy', `I'll keep it. Somewhere. Where it can't see me.`]],
      hates: [['angry', `Are you telling me to rest? Or that I'm broken? Take it back, please!`], ['angry', `That tastes like a tire. And a bad memory. No thank you!`], ['sad', `I thought you got me. Okay. It's fine. Just... not that.`], ['angry', `Nope! Nope nope nope! Ugh, I can still taste it!`]],
      birthday: [['surprised', `You remembered my birthday?! It's a thing?! I forgot it's a thing!`], ['happy', `Best birthday present! Better than the cake! Well, same as the cake!`], ['shy', `Nobody's ever wrapped something for me this neatly. I'm not crying. It's flour.`], ['happy', `Happy birthday to me! And thanks to you! I've never felt so fast!`]],
    },
  },
};
