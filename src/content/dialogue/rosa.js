// Grandma Rosa: Mari's grandmother, owns Reyes Blooms. Proverbs, "mija", stubborn about not needing help.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['rosa', '>=', lo] });

export default {
  npc: 'rosa',
  talk: [
    t(20, { time: ['06:00', '12:00'] }, ['happy', `Buenos dias, mijo! The flowers wake before the rest of us. Learn from them. Also from the coffee.`]),
    t(20, { time: ['12:00', '18:00'] }, ['neutral', `Afternoon. My knees say rain. My knees are never wrong. Also never polite.`]),
    t(20, { time: ['18:00', '22:00'] }, ['neutral', `Evening. The shop sleeps early. The flowers close their eyes. I just close the till.`]),
    t(21, { weather: 'rain' }, ['neutral', `Rain! Good for the roses, bad for my knees. Both are true. Life is like that.`]),
    t(21, { weather: 'snow' }, ['happy', `Snow! The garden sleeps under a blanket. A good blanket. No complaints.`]),
    t(22, { season: 'spring' }, ['happy', `Spring! Tulips, daisies, and a granddaughter covered in paint. A good mix, mijo.`]),
    t(22, { season: 'summer' }, ['happy', `Summer! Sunflowers taller than Mari. She says it's unfair. It is a little.`]),
    t(22, { season: 'autumn' }, ['neutral', `Autumn. Chrysanthemums. They remind us that ending can be beautiful.`]),
    t(22, { season: 'winter' }, ['neutral', `Winter. Poinsettias, paper stars, and one very stubborn old woman. I'll be fine, mijo.`]),
    t(24, { map: 'town_square' }, ['happy', `I deliver the bouquets myself. Don't offer to carry. My knees can argue, but I'll win.`]),
    t(25, H(4), ['happy', `You're a good boy, mijo. A flower grows where it's loved. So do people.`]),
    t(1, null, ['happy', `Mijo! Come, look at the roses. They're the colour of a good argument.`]),
    t(1, null, ['neutral', `Dicen que... as they say: a flower can't bloom without sun, and a boy can't grow without lunch.`]),
  ],
  repeat: [
    t(1, null, ['happy', `Back again, mijo? Good. Keep me company.`]),
    t(1, null, ['neutral', `I don't need help. But thank you for asking. Quietly.`]),
    t(1, null, ['smug', `A flower for your trouble. A small one. Don't tell Mari.`]),
    t(5, H(6), ['shy', `You remind me of her grandfather. Stubborn, kind, bad at dancing.`]),
  ],
  gift: {
    loves: ['tea_leaves', 'daisy_white', 'sunflower', 'knit_scarf'],
    likes: ['tulip_pink', 'bouquet', 'cookie_box', 'berry_tart', 'tea', 'music_box'],
    dislikes: ['soda', 'energy_drink', 'whoopee_cushion'],
    hates: ['black_licorice', 'pep_tonic'],
    lines: {
      loves: [['surprised', `Ay, mijo. For me? You'll make an old woman cry. Gracias, de verdad.`], ['happy', `You have a good heart. And a good eye. Both are rare. Thank you.`]],
      likes: [['happy', `How lovely! I'll put it where the sun can find it.`], ['happy', `Gracias, mijo. Thoughtful. Like my husband, God rest him.`]],
      neutral: [['neutral', `Thank you, mijo. I'll find a place for it.`], ['happy', `A gift! How kind. Sit, I'll find a cookie.`]],
      dislikes: [['neutral', `Hm. Not for me, mijo. But the thought is a flower. A small one.`], ['sad', `Ay. I'll keep it in the back. Out of sight.`]],
      hates: [['angry', `Ay, no! Take that away, mijo!`], ['surprised', `Que horror! Remove it, please!`]],
      birthday: [['surprised', `You remembered! Ay, mijo. At my age, a birthday's a quiet thing. Today, it's loud. Gracias.`], ['happy', `A gift on my birthday. A good boy. A good day.`]],
    },
  },
};
