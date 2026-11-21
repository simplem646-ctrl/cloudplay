// Bruno Kessler: third-year soccer captain, big brother. Calls everyone "kid". Short wise sentences. Bad at goodbyes. Year 1 only.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['bruno', '>=', lo] });

export default {
  npc: 'bruno',
  talk: [
    t(20, { hearts: ['bruno', '<', 4] }, ['happy', `Hey, kid. Eaten today? Good. Players run on lunch.`]),
    t(20, { hearts: ['bruno', '<', 4] }, ['neutral', `Tie your shoes. Everything else is optional. Shoes, kid.`]),
    t(21, { all: [H(4), { hearts: ['bruno', '<', 8] }] }, ['happy', `Kid. You've got a good walk now. Less lost. More headed somewhere.`]),
    t(21, { all: [H(4), { hearts: ['bruno', '<', 8] }] }, ['neutral', `Captain's rule: the first one in carries the cones. The last one out carries the water. Be last, kid.`]),
    t(24, H(8), ['shy', `I've got a speech for graduation. It is one line long. "Thanks." Eight pages is too many.`]),
    t(24, H(8), ['neutral', `You'll look after them, right? Jules, Dante. Even the cat. I don't ask. I just hope.`]),
    t(26, { weather: 'rain' }, ['happy', `Wet pitch. Good. Teaches you to stay on your feet. Also teaches you laundry.`]),
    t(26, { weather: 'snow' }, ['neutral', `Snow. No practice. Which means I'll stand here and miss practice. Odd feeling.`]),
    t(25, { season: 'summer' }, ['happy', `Summer. Hot grass, cold water bottles. Best smell of the year, kid.`]),
    t(25, { season: 'autumn' }, ['neutral', `Autumn already. Last Sports Festival for me. I want a quiet one. Dante will not allow it.`]),
    t(25, { season: 'winter' }, ['sad', `Winter. Graduation is close. I keep checking my locker like it'll change its mind.`]),
    t(25, { season: 'spring' }, ['happy', `Spring term. New first-years, old captain's armband. Same job, kid.`]),
    t(26, { map: 'school_field' }, ['neutral', `Every dent in this pitch is a lesson. That one's from Dante's first hat-trick.`]),
    t(26, { map: 'school_grounds' }, ['happy', `Bench by the gate. Best seat in school. You see everyone coming and going.`]),
    t(30, { festival: true }, ['happy', `Festival day. Eat something fried. That's an order from your captain.`]),
    t(1, null, ['neutral', `Kid. Good to see you. That's all. Go on.`]),
    t(1, null, ['happy', `Short advice, kid: be kind first. Be clever second. Be early third.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Twice in a day. Good sign, kid.`]),
    t(1, null, ['happy', `Still here. Still captain. For now.`]),
    t(1, null, ['neutral', `I'm no good at goodbyes. So let's not start early.`]),
    t(4, { season: 'winter' }, ['sad', `Don't look at me like that. I'm fine. It's just... the air.`]),
  ],
  gift: {
    loves: ['sports_drink', 'curry_plate', 'towel'],
    likes: ['bread', 'riceball', 'sandwich', 'water_bottle', 'coffee', 'soccer_ball'],
    dislikes: ['perfume', 'silk_ribbon'],
    hates: ['black_licorice', 'whoopee_cushion'],
    lines: {
      loves: [['happy', `Kid, this is just what I needed. How did you know? ...Never mind. Thanks.`], ['shy', `You remembered. That means more than the thing, kid. But the thing's great too.`]],
      likes: [['happy', `Good call. I'll share it with the team. Maybe.`], ['neutral', `Thanks, kid. That'll get me through practice.`]],
      neutral: [['neutral', `Appreciate it, kid. I'll find a use.`], ['happy', `Thoughtful. Thanks.`]],
      dislikes: [['neutral', `Not really my thing, kid. But I see what you meant.`], ['sad', `Thanks. I'll... keep it safe. Somewhere.`]],
      hates: [['angry', `Whoa. No, kid. Never again.`], ['surprised', `Is this a joke? Bad one. Take it away.`]],
      birthday: [['surprised', `You remembered, kid? Thanks. I'm... getting a bit teary. It's allergies.`], ['happy', `Best birthday in a while. Don't tell the team. They'd throw me in the fountain.`]],
    },
  },
};
