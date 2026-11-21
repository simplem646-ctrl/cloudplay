// Aunt Roz: big-hearted, teasing, food = love, puns. Owns The Lantern Cafe; Theo lives above it. Worries behind jokes.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['roz', '>=', lo] });

export default {
  npc: 'roz',
  talk: [
    t(20, { time: ['05:30', '10:00'] }, ['happy', `Morning, love! Toast is on the counter. Sundays have rules, but so do Mondays. The rule is: eat.`]),
    t(20, { time: ['05:30', '10:00'] }, ['smug', `You look like you slept! That's a good start. Finish with an egg. Eggs are a very quiet joke. "Eggs-actly."`]),
    t(20, { time: ['10:00', '17:00'] }, ['happy', `Lunch crowd soon. The fisherman will want his chipped mug. If you see him, say nothing about the mug.`]),
    t(20, { time: ['17:00', '23:00'] }, ['neutral', `Quiet evening. My favourite time. Even the espresso machine has stopped complaining.`]),
    t(21, { weekday: ['Sat', 'Sun'] }, ['happy', `Weekend! Every table's full and every kid has a milkshake. I can't stop smiling. Or sweating.`]),
    t(21, { schoolDay: true }, ['neutral', `School day. Homework before the cafe, love. Unless the homework is the cafe.`]),
    t(22, { weather: 'rain' }, ['happy', `Rain on the roof. The bucket's out again. Don't worry, I've named it Gerald. He's very loyal.`]),
    t(22, { weather: 'storm' }, ['surprised', `Storm! Lanterns are lit, kettle's on, and the roof is holding. Mostly. Spiritually.`]),
    t(22, { weather: 'snow' }, ['happy', `Snow! Hot cocoa weather! Marshmallow count: unlimited, until we run out.`]),
    t(23, { season: 'spring' }, ['happy', `Spring! Blossoms in the saucers and the first iced coffee of the year. Brave.`]),
    t(23, { season: 'summer' }, ['smug', `Summer's the season for ice cream floats and fans that don't work. Both are "authentic."`]),
    t(23, { season: 'autumn' }, ['happy', `Autumn! Pumpkin everything. Pumpkin latte, pumpkin tart. Don't ask about the pumpkin soup.`]),
    t(23, { season: 'winter' }, ['happy', `Winter. Cocoa by the gallon. If the kettle starts singing, join in. It's the law.`]),
    t(24, { map: 'cafe_lantern' }, ['happy', `Welcome to the Lantern Cafe, where the coffee's strong and the gossip is stronger.`]),
    t(24, { map: 'home_theo' }, ['neutral', `Upstairs is yours, love. Mind the third stair. It's a thief. It steals your balance.`]),
    t(25, H(4), ['neutral', `Having you around is like finally fixing a leak I'd stopped noticing. Quiet. Welcome.`]),
    t(26, { flag: 'main_bell_story_known' }, ['thinking', `The bell. Old Finch used to wind that tower clock with me watching. I should visit him more.`]),
    t(26, { flag: 'main_bell_restored' }, ['happy', `They fixed it, love! I'm putting out free scones tomorrow. For the town. For the bell. For you.`]),
    t(27, { year: 3 }, ['sad', `Last year with you upstairs. Don't make me cry in front of the customers. Do it at home.`]),
    t(30, { festival: true }, ['happy', `Festival day! I'm selling everything I've got! Make way, I've got trays and opinions.`]),
    t(1, null, ['happy', `Hello, love! Anything to eat? Don't say no. The correct answer is yes.`]),
    t(1, null, ['neutral', `You're up and about. Good. A body in motion stays in motion. A body in my cafe stays fed.`]),
    t(1, null, ['smug', `I've been told I pun too much. I disagree. I'm a very well-rounded woman. See? Another one.`]),
  ],
  repeat: [
    t(1, null, ['happy', `Back again, love? Hungry? Always hungry. It's a family trait.`]),
    t(1, null, ['neutral', `I'm mid-pour. Talk fast or I'll pour you a cup.`]),
    t(1, null, ['smug', `I've run out of puns. Give me a minute. I'll bean-gin again.`]),
    t(1, null, ['sad', `Oh. It's you. Just thinking about the bills. Never mind. Eat something.`]),
    t(5, H(5), ['shy', `Twice in a day. It's like having family. Oh wait.`]),
  ],
  gift: {
    loves: ['coffee_beans', 'tea_leaves', 'daisy_white', 'cake_slice'],
    likes: ['sunflower', 'bouquet', 'cookie_box', 'berry_tart', 'knit_scarf', 'music_box'],
    dislikes: ['soda', 'whoopee_cushion', 'energy_drink'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['surprised', `For me, love? ...Oh. Oh my. You shouldn't have. But I'm so glad you did.`], ['happy', `Theo! You know my weakness! I'll be insufferable all day. Thank you!`]],
      likes: [['happy', `How thoughtful! You've got a good eye, love. Genetic, I'd say.`], ['smug', `A very sound gift. The shop could use more like it.`]],
      neutral: [['neutral', `Thank you, love. I'll find a spot. Maybe next to the espresso machine.`], ['happy', `You didn't have to. But I'm glad you did.`]],
      dislikes: [['neutral', `Oh. Hm. Well, I'm sure someone will love it. Maybe not me, but someone.`], ['sad', `That's... not quite my cup of tea. But I'm touched.`]],
      hates: [['angry', `Theo Hartley! You've got a nerve! I'll pretend that never happened!`], ['surprised', `Oh my. No. Take it away. Take it far away.`]],
      birthday: [['surprised', `You remembered! In this house, birthdays get cake and hugs. Come here.`], ['happy', `Best birthday present: you, upstairs, being a good lad. And also this. Thanks, love.`]],
    },
  },
};
