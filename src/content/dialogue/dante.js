// Dante Rossi: boastful, competitive, theatrical striker. Gruff when embarrassed. Secret crush on Nina. Loyal.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['dante', '>=', lo] });
const low = { hearts: ['dante', '<', 4] };
const mid = { all: [H(4), { hearts: ['dante', '<', 8] }] };

export default {
  npc: 'dante',
  talk: [
    t(20, low, ['smug', `Hartley. Behold, the striker with the finest left foot in Bellhaven. You may stare. Quietly.`]),
    t(20, low, ['neutral', `Your keepie-uppie count? Zero. Mine? Four hundred and twelve. I'm not bragging. I'm reporting.`]),
    t(20, low, ['smug', `Do not mistake my being nice to you for weakness. It is strategy. Brilliant, generous strategy.`]),
    t(21, mid, ['happy', `Hartley! You came to watch my training? Fine. Sit. I will perform at eighty percent so you can keep up.`]),
    t(21, mid, ['neutral', `Do you think Nina... no. Nothing. Forget it. I said nothing. I'm a vault.`]),
    t(21, mid, ['smug', `Jules says I'm dramatic. I say the world is simply under-dramatized. Write that down.`]),
    t(24, H(8), ['shy', `You're one of the three people who see me trip and don't tell. Don't make it weird. Thanks.`]),
    t(24, H(8), ['neutral', `My nonna says a man who boasts loudly is hiding a very soft sandwich. She is not wrong. Do not repeat this.`]),
    t(24, H(8), ['happy', `If I ever lose, you're the one I want in the stands. Not because you're good. Because you're loyal.`]),
    t(26, { weather: 'rain' }, ['angry', `Rain! Mud! The ball is a bar of soap! ...Which is excellent, because I've trained for chaos.`]),
    t(26, { weather: 'snow' }, ['surprised', `Snow on the pitch? Beautiful. Ridiculous. Play anyway. Legends are made in bad weather.`]),
    t(25, { season: 'summer' }, ['smug', `Summer. The sun lights me from the best angle. It knows.`]),
    t(25, { season: 'autumn' }, ['smug', `Sports Festival soon. Class B will win. I will personally supervise the winning.`]),
    t(25, { season: 'winter' }, ['neutral', `Winter. Cold toes, warm determination. Also a scarf. Mamma's idea. Do not ask about the colour.`]),
    t(25, { season: 'spring' }, ['happy', `Spring! New season, new tactics, same magnificent me.`]),
    t(26, { map: 'school_field' }, ['smug', `Welcome to the stage, Hartley. Every blade of grass has seen me score. They are very proud.`]),
    t(26, { map: 'bakery' }, ['shy', `I'm not here for Nina. I'm here for bread. Which she happens to bake. ...I'm leaving. Bye.`]),
    t(24, { weekday: ['Sat', 'Sun'] }, ['neutral', `Weekend training. Alone. With only the wall to impress. It is easily impressed.`]),
    t(28, { flag: 'main_bell_restored' }, ['surprised', `They fixed the bell? I will not cry. I have something in my eye. It is a large dramatic something.`]),
    t(26, { year: 3 }, ['sad', `Last year of this. I plan to leave a record nobody can break. Or a dent. Either way: memorable.`]),
    t(30, { festival: true }, ['smug', `Festival! A perfect day for the admiration of Dante Rossi. Take photos. From the left.`]),
    t(1, null, ['smug', `Hartley. Tell me something impressive about me. I'll wait. I've got all day.`]),
    t(1, null, ['neutral', `If you challenge me, I accept. If you don't, I still win. Efficient.`]),
    t(1, null, ['happy', `Good timing. I was about to practise a speech for my own statue. Listen.`]),
  ],
  repeat: [
    t(1, null, ['smug', `Back for more of my brilliance? Understandable.`]),
    t(1, null, ['neutral', `I'm in the middle of a very important stretch. Of my ego. Mostly my hamstring.`]),
    t(1, null, ['angry', `Hartley! You made me lose count. Four hundred and... ugh. Zero.`]),
    t(5, H(6), ['shy', `Two chats in one day. I'm fine with that. Do not look so smug. That is MY face.`]),
    t(4, { weather: 'rain' }, ['neutral', `Still raining. Still magnificent. Now go away, I'm dramatic in peace.`]),
  ],
  gift: {
    loves: ['soccer_ball', 'sports_drink', 'cake_slice', 'lucky_charm'],
    likes: ['sandwich', 'pancakes', 'water_bottle', 'sneakers', 'towel', 'curry_plate'],
    dislikes: ['plushie_bear', 'silk_ribbon', 'tea'],
    hates: ['black_licorice', 'whoopee_cushion'],
    lines: {
      loves: [['surprised', `For me? ...Obviously for me. But still! Hartley, this is magnificent. I mean it. Don't ask me to say it twice.`], ['shy', `You remembered what I like. Fine. I'm touched. Walk away before I do something embarrassing.`]],
      likes: [['happy', `A fine tribute. I accept it graciously.`], ['smug', `Good taste, Hartley. You learn fast. It almost makes up for your keepie-uppies.`]],
      neutral: [['neutral', `Hm. I'll find a place for it. A shelf near my trophies. They need company.`], ['neutral', `Not what I'd have chosen. But the effort is noted.`]],
      dislikes: [['neutral', `This is not for me. I'm the one who gives people things, mostly applause.`], ['sad', `I'll keep it. Somewhere. In a drawer. A dignified drawer.`]],
      hates: [['angry', `Are you mocking me?! A prank?! In MY presence?!`], ['angry', `No! Take it back! I refuse! It is an insult to the pitch!`]],
      birthday: [['surprised', `You know my birthday? ...Obviously you do. Everyone should. But, uh. Thanks.`], ['happy', `A gift on my day. Best present: the world acknowledging my existence. Second best: this.`]],
    },
  },
};
