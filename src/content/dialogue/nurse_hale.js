// Nurse Hale: brisk, motherly, blunt. Dispenses tea, bandages and advice. "Sit. Drink. Tell me what hurts."
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['nurse_hale', '>=', lo] });

export default {
  npc: 'nurse_hale',
  talk: [
    t(20, { time: ['07:00', '12:00'] }, ['neutral', `Sit. Drink. Tell me what hurts. If nothing hurts, tell me what's about to.`]),
    t(20, { time: ['12:00', '18:00'] }, ['neutral', `Afternoon slump? Water. Fresh air. A proper sandwich. Not the vending machine sandwich. Never that.`]),
    t(20, { time: ['18:00', '22:00'] }, ['neutral', `Still here? Go home. Rest is not optional. It's the whole medicine.`]),
    t(21, { weekday: 'Mon' }, ['neutral', `Monday. The infirmary's busiest day. Everyone suddenly develops a mysterious ache. I have a list.`]),
    t(22, { weather: 'rain' }, ['neutral', `Rain. Sniffles in three, two... Take an umbrella. Wear your scarf. Don't argue with me.`]),
    t(22, { weather: 'snow' }, ['happy', `Snow. Cocoa's in the cupboard. Cold hands, warm cup. Don't tell the principal.`]),
    t(22, { weather: 'sunny' }, ['neutral', `Sunny. Sunscreen and water. I've seen what a day without it does. I have a photo.`]),
    t(23, { season: 'spring' }, ['neutral', `Spring. Pollen season. I've got tissues, tea, and zero sympathy for dramatic sneezing.`]),
    t(23, { season: 'summer' }, ['neutral', `Summer. Hydration. Sunblock. Hat. If you faint, I'll say I told you so. In a nice voice.`]),
    t(23, { season: 'autumn' }, ['neutral', `Autumn. Festival season. Eat in moderation. Dance in moderation. Run in moderation. Moderation, moderation.`]),
    t(23, { season: 'winter' }, ['neutral', `Winter. Colds, coughs, and kids who forget gloves. Wrap up, and wash your hands.`]),
    t(24, { map: 'school_hall_1f' }, ['neutral', `Infirmary's down the hall. If you hear a creaky cot, that's Biscuit's cousin. Ignore him.`]),
    t(25, H(4), ['happy', `You look after yourself better than you used to. I noticed. Keep it up.`]),
    t(26, { club: 'track' }, ['neutral', `Track member? Stretch properly. I've patched enough knees to build a small knee.`]),
    t(26, { standing: 'probation' }, ['neutral', `Stress shows. Sit, sip, and tell me. Marks will wait. Your health won't.`]),
    t(27, { flag: 'main_bell_restored' }, ['happy', `That bell! I dropped the bandages. First time in ten years. I'm blaming it.`]),
    t(30, { festival: true }, ['neutral', `Festival. I've set up a first-aid tent. Strictly for scrapes. Not for gossip. Mostly.`]),
    t(1, null, ['neutral', `Theo. You look well. Which is suspicious. Open your mouth. Fine. Go.`]),
    t(1, null, ['happy', `Tea's hot. Sit a minute. Nobody ever regretted a five-minute rest.`]),
    t(1, null, ['neutral', `Rule of thumb: if it hurts, tell me. If it doesn't, tell me anyway. I like data.`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Back so soon? Is something wrong? No? Good. Go.`]),
    t(1, null, ['happy', `Tea's still warm. Take a cup. Don't spill.`]),
    t(1, null, ['neutral', `If you're avoiding class, I'll know. I can smell it.`]),
    t(5, H(6), ['shy', `You're a good kid. Don't let that out. I've a reputation.`]),
  ],
  gift: {
    loves: ['tea_leaves', 'vitamin_gummies', 'daisy_white', 'cookie_box'],
    likes: ['tea', 'sunflower', 'berry_tart', 'knit_scarf', 'veggie_soup', 'cake_slice'],
    dislikes: ['soda', 'energy_drink', 'whoopee_cushion'],
    hates: ['pep_tonic', 'black_licorice'],
    lines: {
      loves: [['surprised', `For me? Hm. That's... thoughtful. Don't look at me like that. I'm fine. Thank you.`], ['happy', `Well. Aren't you a gem. Take a bandage on the way out. As a thank-you.`]],
      likes: [['happy', `That'll do nicely. Good choice, Theo.`], ['neutral', `Thank you. I'll put it on the shelf. Next to the good tea.`]],
      neutral: [['neutral', `Thanks. I'll find a spot for it. Maybe the supply cabinet.`], ['happy', `Kind of you. Don't make a habit of it.`]],
      dislikes: [['neutral', `That's not good for you. Or me. But thanks for trying.`], ['sad', `I'll keep it. Out of sight. For safety.`]],
      hates: [['angry', `Absolutely not. Take it away. I'll pretend I didn't see it.`], ['surprised', `That is not medicine. That's a threat.`]],
      birthday: [['surprised', `You remembered my birthday? Hm. That's... very kind. Sit. Have tea. On me.`], ['happy', `Thank you, Theo. Best present: a patient who listens. And this. Take a cookie.`]],
    },
  },
};
