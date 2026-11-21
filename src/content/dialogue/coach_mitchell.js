// Coach Mitchell: booming P.E. teacher, track and soccer coach, whistle always on, ends with "Move it!". Genuinely cares.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['coach_mitchell', '>=', lo] });

export default {
  npc: 'coach_mitchell',
  talk: [
    t(20, { time: ['06:00', '09:00'] }, ['happy', `Hartley! Up with the sun! Stretch, hydrate, breathe! A body is a bell, it needs a ring! Move it!`]),
    t(20, { time: ['09:00', '15:00'] }, ['neutral', `Lunch is for fuel, not for naps! Eat something green! A leaf counts! Move it!`]),
    t(20, { time: ['15:00', '19:00'] }, ['happy', `Practice time! Hear that? That's the sound of shoes on a track! Join in! Move it!`]),
    t(21, { weekday: ['Sat', 'Sun'] }, ['neutral', `Weekend! Rest day! But rest actively! Walk. Stretch. Think about running! Move it!`]),
    t(22, { weather: 'rain' }, ['happy', `Rain! Indoor drills! Skipping rope! It builds character and calves! Move it!`]),
    t(22, { weather: 'snow' }, ['surprised', `Snow! Cancel nothing! Wear a hat! Move it!`]),
    t(22, { weather: 'storm' }, ['neutral', `Storm! Everybody inside! No heroics! The lightning does not care about your PB! Safety first! Move it, but indoors!`]),
    t(23, { season: 'spring' }, ['happy', `Spring! The perfect time to start! You've got a whole season ahead! Move it!`]),
    t(23, { season: 'summer' }, ['neutral', `Summer! Water bottle, sunscreen, shade! The sun is a coach too. A very strict one! Move it!`]),
    t(23, { season: 'autumn' }, ['happy', `Sports Festival! Class against class! I'm blowing the whistle at 9 sharp! Don't be late! Move it!`]),
    t(23, { season: 'winter' }, ['neutral', `Winter! Warm up twice as long! Cold muscles are grumpy muscles! Move it!`]),
    t(24, { map: 'school_field' }, ['happy', `My kingdom! Every line on that track I painted myself! Respect the lines! Move it!`]),
    t(25, H(4), ['happy', `Hartley! You show up. That's ninety percent of this job! Keep it up! Move it!`]),
    t(26, { any: [{ club: 'track' }, { club: 'soccer' }] }, ['happy', `A member of my team! Pride! That's what I feel! And a tiny cramp! Move it!`]),
    t(27, { flag: 'main_bell_restored' }, ['surprised', `That bell! I heard it from the track! My whistle fell out of my mouth! First time in nine years! Move it... slowly!`]),
    t(26, { stat: ['fitness', '<', 3] }, ['neutral', `Hartley, you look winded. Jog twice around the field and drink water. It's medicine! Move it!`]),
    t(30, { festival: true }, ['happy', `Festival! Cheer loud! Cheer often! Drink water between! Move it!`]),
    t(1, null, ['happy', `Hartley! Good to see you! Stand tall! Chin up! Move it!`]),
    t(1, null, ['neutral', `A strong body is the best homework. Get started! Move it!`]),
    t(1, null, ['smug', `I can hear someone walking slowly. I can also hear them speeding up. Good! Move it!`]),
  ],
  repeat: [
    t(1, null, ['neutral', `Hartley! Again! Don't loiter, move it!`]),
    t(1, null, ['happy', `Hydrate! Stretch! Breathe! Move it!`]),
    t(1, null, ['smug', `Back to chat? Chat while jogging! Move it!`]),
    t(5, H(6), ['shy', `...You're a good kid, Hartley. Now move it, before I get sentimental!`]),
  ],
  gift: {
    loves: ['stopwatch', 'sports_drink', 'water_bottle', 'sneakers'],
    likes: ['towel', 'riceball', 'sandwich', 'curry_plate', 'textbook_pe', 'relay_baton'],
    dislikes: ['perfume', 'plushie_cat', 'cake_slice'],
    hates: ['black_licorice', 'whoopee_cushion'],
    lines: {
      loves: [['surprised', `A stopwatch! Just what a coach needs! ...Do you know how long my old one lasted? Six seasons! I'm touched! Move it!`], ['happy', `That's the best thing a student's ever given me! Excluding the one with the glitter! Thanks!`]],
      likes: [['happy', `Excellent choice! Practical and kind! Move it!`], ['happy', `Thank you, Hartley! I'll put it to good use! Immediately!`]],
      neutral: [['neutral', `Thank you! I'll find a use for it! On or off the track!`], ['happy', `Kind of you! I'll put it in my bag!`]],
      dislikes: [['neutral', `Hm. Not really my taste! But the thought counts! Move it!`], ['sad', `I'll... keep it in my office. Where it won't scare the team.`]],
      hates: [['angry', `Hartley! A prank on the coach?! Drop and give me ten! Move it!`], ['surprised', `Bleh! Remove it! Remove it at once! Move it!`]],
      birthday: [['surprised', `You remembered?! Thanks! I'll take it as a good omen! Move it... gently!`], ['happy', `Happy birthday to me! Best present: a player who shows up! And also this! Thanks!`]],
    },
  },
};
