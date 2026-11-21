// Mrs. Calder: owner of Calder Bakery, Nina's mother. Bustling, "have a roll, dear". Proud of Nina, terrified of her injury.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['mrs_calder', '>=', lo] });

export default {
  npc: 'mrs_calder',
  talk: [
    t(20, { time: ['04:30', '09:00'] }, ['happy', `Morning, dear! The first batch is out. Have a roll. Don't argue. Hot rolls are not for arguing.`]),
    t(20, { time: ['09:00', '15:00'] }, ['happy', `Lunch rush! Take a bun on your way out. Nina's out running. I hope she's eating. Is she eating?`]),
    t(20, { time: ['15:00', '21:00'] }, ['neutral', `Evening loaves are nearly gone. Take the last one. I insist. It'll only stale in the case.`]),
    t(21, { weekday: ['Sat', 'Sun'] }, ['happy', `Weekend orders! The whole town wants a cake. I've three timers going and four opinions.`]),
    t(22, { weather: 'rain' }, ['neutral', `Rain. Nina will try to run in it. I've hidden her shoes. She's found them. She always does.`]),
    t(22, { weather: 'snow' }, ['happy', `Snow! Cinnamon buns, dear. The only sensible response to snow. Come in, warm up.`]),
    t(22, { weather: 'sunny' }, ['happy', `Such a bright day! The dough's rising like it's got somewhere to be.`]),
    t(23, { season: 'spring' }, ['happy', `Spring! Strawberry tarts and cherry blossom rolls. Take one. Take two. I won't count.`]),
    t(23, { season: 'summer' }, ['neutral', `Summer! The oven's a furnace and I'm a proud loaf. Cold milk, dear? It's in the back.`]),
    t(23, { season: 'autumn' }, ['happy', `Autumn! Apple and cinnamon. The smell sells itself. I just stand here and hand them out.`]),
    t(23, { season: 'winter' }, ['happy', `Winter! Rolls straight from the oven, steam and all. A body needs a warm bun in January.`]),
    t(24, { map: 'bakery' }, ['happy', `Welcome to Calder Bakery, dear. Mind the flour. It gets everywhere. I found some in my tea. And my hat.`]),
    t(25, H(4), ['happy', `You're a good boy, Theo. Nina speaks of you, you know. Between ten sentences about rolls.`]),
    t(25, { flag: 'nina_plush_secret' }, ['shy', `I've seen the bear in her room. Captain Crumb. I pretend I haven't. She pretends I haven't. It works.`]),
    t(26, { quest: ['nina_comeback', 'active'] }, ['sad', `Her knee... I try not to hover. But a mother hovers by nature. Like steam over a roll.`]),
    t(28, { flag: 'main_bell_restored' }, ['happy', `The bell! Free rolls all day! The whole town needs a roll after that! Take two!`]),
    t(30, { festival: true }, ['happy', `Festival! I've baked three hundred rolls. Three hundred and one. The last was a taste test.`]),
    t(1, null, ['happy', `Hello, dear! Have a roll. Don't thank me. Just eat it.`]),
    t(1, null, ['neutral', `You look thin. Not thin thin. Just a little under-breaded.`]),
    t(1, null, ['smug', `A secret: the best bread is made with a little patience and a lot of nagging. I do both.`]),
  ],
  repeat: [
    t(1, null, ['happy', `Back again, dear? Have another roll. Don't mind me.`]),
    t(1, null, ['neutral', `I'm mid-knead. Talk, but quickly. The dough doesn't wait.`]),
    t(1, null, ['happy', `Take a bun for the road. A long road, with a short bun.`]),
    t(5, H(6), ['shy', `You're part of the family now, I think. Don't tell Nina I said so. She'd tease me.`]),
  ],
  gift: {
    loves: ['coffee_beans', 'tea_leaves', 'daisy_white', 'knit_scarf'],
    likes: ['sunflower', 'bouquet', 'berry_tart', 'cookie_box', 'tea', 'music_box'],
    dislikes: ['soda', 'energy_drink', 'whoopee_cushion'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['surprised', `For me, dear? Oh, my. You shouldn't have! But I'm so glad you did!`], ['happy', `Aren't you the sweetest! I'll make you a double batch tomorrow. And don't say no.`]],
      likes: [['happy', `How thoughtful! I'll put it right in the front, where everyone can see.`], ['happy', `Thank you, dear! I'll enjoy it with a fresh roll!`]],
      neutral: [['neutral', `Thank you, dear. I'll find a spot for it. Maybe by the flour.`], ['happy', `Kind of you! Now, have a bun.`]],
      dislikes: [['neutral', `Oh. Hm. Well, I'm sure someone will love it. Maybe not me, but someone.`], ['sad', `That's... not quite for me, dear. But thank you for thinking of me.`]],
      hates: [['angry', `Theo, dear! Take that away. I'll pretend it never came into my bakery!`], ['surprised', `Oh my. No. No, no, no.`]],
      birthday: [['surprised', `You remembered! In this house, birthdays get cake, hugs, and a bit too much butter.`], ['happy', `Best present: a polite young man at my counter. And this. Thank you, dear!`]],
    },
  },
};
