// Dr. Fennel: eccentric science teacher, Astronomy Club advisor. Always "five minutes from a breakthrough". "Fascinating!"
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['dr_fennel', '>=', lo] });

export default {
  npc: 'dr_fennel',
  talk: [
    t(20, { time: ['07:00', '12:00'] }, ['happy', `Hartley! Good morning! I'm five minutes from a breakthrough! I've been five minutes from it since Tuesday!`]),
    t(20, { time: ['12:00', '18:00'] }, ['surprised', `Fascinating! I was just thinking about you. And about plasma. Mostly plasma.`]),
    t(20, { time: ['18:00', '25:00'] }, ['thinking', `Night observation! The stars don't care about school hours. Neither do I. Hand me the thermos.`]),
    t(21, { weekday: ['Sat', 'Sun'] }, ['happy', `A weekend in the lab! The bunsen burner is like a campfire. For nerds. I am a nerd.`]),
    t(22, { weather: 'rain' }, ['neutral', `Rain! Condensation, precipitation, and a very damp notebook. Fascinating, and wet.`]),
    t(22, { weather: 'storm' }, ['surprised', `A storm! Lightning! Six miles away, by my count! I'm going to stand near a window! A safe distance! Mostly!`]),
    t(22, { weather: 'snow' }, ['happy', `Snow! Hexagonal crystals! Each one unique! I've caught eleven on my sleeve and named them all!`]),
    t(22, { weather: 'sunny' }, ['happy', `Clear skies! A perfect day for sunspots. Don't look directly. Look through the thing. Owen's thing.`]),
    t(23, { season: 'summer' }, ['happy', `Summer! Meteor showers! Keep your eyes up and your sleeves down. Mosquitoes love science.`]),
    t(23, { season: 'autumn' }, ['happy', `The Moon Viewing Night approaches! Telescopes ready! Dumplings ready! Dr. Fennel ready! Mostly the dumplings!`]),
    t(23, { season: 'winter' }, ['thinking', `Winter's the best time for stars. Cold, clear, crisp. Also cold. Did I say cold?`]),
    t(24, { map: 'school_rooftop' }, ['happy', `The roof! The finest observatory ever built by accident. Mind the cat. She has seniority.`]),
    t(25, { club: 'astronomy' }, ['happy', `A member of my club! You're a rare and beautiful species! A tiny, excellent constellation!`]),
    t(25, H(4), ['happy', `Hartley, you ask the right sort of questions. Wrong ones too, but ones that lead somewhere!`]),
    t(26, { flag: 'main_core_found' }, ['surprised', `The clapper core! Hand-forged! Look at the grain! This iron has stories! Possibly gossip!`]),
    t(27, { flag: 'main_bell_restored' }, ['happy', `FASCINATING! A bell, restored by teenagers and a very patient cat! I've never been prouder of a variable!`]),
    t(30, { festival: true }, ['happy', `Festival! I'm demonstrating a volcano! It's mostly baking soda. Mostly. Safety goggles recommended!`]),
    t(1, null, ['happy', `Hartley! A thought struck me! Then I struck it back! Anyway, stars!`]),
    t(1, null, ['thinking', `I misplaced my pencil. It's behind my ear. This is the fourth time today. I'm a scientist.`]),
    t(1, null, ['surprised', `Quick question: if a star falls in the forest and nobody's looking up, does it make a... oh. Never mind.`]),
  ],
  repeat: [
    t(1, null, ['happy', `Again! Excellent! Let's continue the conversation. What were we discussing? Doesn't matter!`]),
    t(1, null, ['thinking', `Hold that thought. My own thoughts have fled. Fascinating.`]),
    t(1, null, ['surprised', `I'm five minutes from a breakthrough! Make it ten, you've distracted me!`]),
    t(5, H(6), ['shy', `You're a good student, Hartley. I mean that! Mostly! I mean it entirely!`]),
  ],
  gift: {
    loves: ['star_chart', 'coffee_beans', 'calculator', 'textbook_science'],
    likes: ['notebook', 'tea', 'coffee', 'paper_lantern', 'riceball', 'cookie_box'],
    dislikes: ['perfume', 'plushie_bear', 'soda'],
    hates: ['black_licorice', 'whoopee_cushion'],
    lines: {
      loves: [['surprised', `Fascinating! This is a perfect specimen! Hartley, you've outdone every apprentice I've ever had!`], ['happy', `I'll put it on the shelf with my best instruments! Right next to Gerald the skeleton!`]],
      likes: [['happy', `A fine gift! I shall add it to my collection! Which is also my clutter!`], ['happy', `Excellent! Fascinating! Thank you!`]],
      neutral: [['neutral', `Interesting! I don't know what it is, but I'm sure I'll experiment with it!`], ['happy', `Thanks, Hartley! Into the lab it goes!`]],
      dislikes: [['neutral', `Hm. Not my usual interest. But I'll find some use for it! Possibly as an example of... something.`], ['sad', `Hm. Well. Thank you. I'll put it in the "to be investigated" pile.`]],
      hates: [['angry', `Hartley! A violation of the lab! Remove it at once!`], ['surprised', `Hm! That is an affront to science! And to my tongue!`]],
      birthday: [['surprised', `A gift on my birthday! I forgot it was a variable! Thank you, Hartley!`], ['happy', `Fascinating! Another year, another orbit, another gift! The universe is kind!`]],
    },
  },
};
