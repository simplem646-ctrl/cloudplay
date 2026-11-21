// Marisol "Mari" Reyes dialogue pool (S3). Calls Theo "Teo". Chatty, art metaphors, jokes to dodge feelings; Spanish slips out when moved.
const H = (lo) => ({ hearts: ['mari', '>=', lo] });
const band = (lo, hi) => ({ all: [{ hearts: ['mari', '>=', lo] }, { hearts: ['mari', '<', hi] }] });

export default {
  npc: 'mari',
  talk: [
    // hearts 0-2
    { when: band(0, 3), priority: 20, say: [['happy', `Teo! Is that a new shirt? It's a good shirt. It's in the "contemplative oatmeal" family. I mean that as a compliment.`]] },
    { when: band(0, 3), priority: 20, say: [['happy', `Have you noticed the sky today? It's three kinds of grey and one kind of pink! The sky is showing off! I'm so jealous!`]] },
    { when: band(0, 3), priority: 20, say: [['neutral', `I have paint under my fingernails. It's cadmium red. You can't wash it off. It's basically a tattoo with commitment issues.`]] },
    // 3-4
    { when: band(3, 5), priority: 20, say: [['happy', `Teo! Sit, sit! I'm eating a pastry and thinking about shadows. The pastry's winning.`]] },
    { when: band(3, 5), priority: 20, say: [['shy', `Hey. Did you ever notice a person has a favourite colour even if they say they don't? Not you, you're a warm blue. I mean, not that I... forget it.`]] },
    { when: band(3, 5), priority: 20, say: [['neutral', `Grandma says the carnations are fussy this week. Everyone in my family is fussy. It's hereditary. It's in the water.`]] },
    // 5-8
    { when: band(5, 9), priority: 20, say: [['happy', `Teo! I thought about you in blue today. Don't look at me like that. It's a normal thought. It's a normal, very blue thought.`]] },
    { when: band(5, 9), priority: 20, say: [['shy', `I told my cactus about you. It didn't respond. It was a very thoughtful silence.`]] },
    { when: band(5, 9), priority: 20, say: [['neutral', `The letter's in my drawer. I check on it like it's a sleeping animal. It hasn't woken up, and neither have I.`]] },
    { when: band(5, 9), priority: 20, say: [['happy', `Today I drew eleven people on the bus and none of them noticed. It's like being a ghost with a pencil. It's the best.`]] },
    // 9-10
    { when: H(9), priority: 20, say: [['shy', `You know what's weird? I used to think "enough" was a colour I'd never mix. Then you walked into the park with a wet jacket.`]] },
    { when: H(9), priority: 20, say: [['happy', `Teo, I'm in such a good mood I might do a self-portrait. In rainbow. With glitter. Forgive me in advance.`]] },
    // dating
    { when: { dating: 'mari' }, priority: 30, say: [['shy', `Hi, you. My favourite subject. I've drawn you eighteen times this week and I'm still not done with your ears.`], ['happy', `Mi cielo, hold my hand, I need to feel anchored. I'm floating. It's wonderful and I'm a bit nauseous.`]] },
    { when: { dating: 'mari' }, priority: 30, say: [['happy', `I made a tiny painting for you! It's the size of a stamp! It's very emotional! Don't lose it, I'll cry!`]] },
    { when: { all: [{ dating: 'mari' }, { weather: 'rain' }] }, priority: 40, say: [['happy', `Rain! Teo, rain! Puddles are mirrors with a sense of humour! Come on! We can draw in the wet pavement with our shoes!`]] },
    // weather / season / weekday / place / flags
    { when: { weather: 'rain' }, priority: 25, say: [['happy', `Rain is when the world turns into watercolour. Everything bleeds into everything. It's the one time I'm not the messy one.`]] },
    { when: { weather: 'snow' }, priority: 25, say: [['happy', `Snow! A blank canvas, but with opinions! Everybody's footprints are a signature! I wish I could frame it!`]] },
    { when: { season: 'spring' }, priority: 22, say: [['happy', `Spring is just a big pink explosion with bees. Cherry petals in my hair, in my pencils, in my sandwich. I love it.`]] },
    { when: { season: 'autumn' }, priority: 22, say: [['neutral', `Autumn is my favourite palette. Burnt sienna, ochre, a bit of rust. Nature cheats and uses the good colours.`]] },
    { when: { weekday: ['Sat', 'Sun'] }, priority: 22, say: [['happy', `Weekend! The shop's packed, the carnations are screaming, and I smell like eucalyptus. It's great. I mean it.`]] },
    { when: { map: 'town_park' }, priority: 24, say: [['happy', `This is my favourite spot. The pond's got a thousand moods. Right now it's "slightly smug." I understand it completely.`]] },
    { when: { map: 'cafe_lantern' }, priority: 24, say: [['smug', `I'm in a ten-year feud with that dragon on the chalkboard. He keeps stealing my best lines. He's very charming.`]] },
    { when: { map: 'school_grounds' }, priority: 24, say: [['happy', `The bell tower looks different every hour. It's the best model, it never asks to see the sketch.`]] },
    { when: { all: [{ seen: 'mari_04_festival' }, { hearts: ['mari', '<', 7] }] }, priority: 26, say: [['shy', `Still thinking about the sand mural. The tide ate it. I didn't mind. Okay, I minded a bit. Mostly I minded not having a camera.`]] },
    { when: { all: [{ seen: 'mari_03_secret' }, { quest: ['mari_mural', 'active'] }] }, priority: 26, say: [['neutral', `No news from Harlow. Which is good news. Or terrible news. It's a very ambiguous kind of quiet. Like a grey that thinks it's blue.`]] },
    { when: { flag: 'mari_confess_notyet' }, priority: 27, say: [['happy', `I'm just here being glitter! Don't mind me! I'll be on the edges of your life, shimmering ambiguously!`]] },
    { priority: 1, say: [['happy', `Teo! Perfect! Hold this. Hold... this. No, the other end. It's wet. Sorry. It's fine!`]] },
    { priority: 1, say: [['smug', `If you ever want a portrait, the going rate is one lemon sweet and your full attention. I'm a bargain.`]] },
  ],
  repeat: [
    { priority: 1, say: [['happy', `Back so soon? I've barely finished my sentence! I'm still holding the end of it!`]] },
    { priority: 1, say: [['neutral', `I'm in the middle of something. It's a feeling. It'll be a painting later, if you're lucky.`]] },
    { priority: 1, say: [['happy', `Hello again! You've got a bit of blue on your sleeve. No wait, that's been there for months.`]] },
    { priority: 1, say: [['smug', `Another visit! If you keep this up, I'll have to charge a model's fee. In snacks.`]] },
    { when: H(5), priority: 5, say: [['shy', `Teo! Twice in one day. It's like a double rainbow, but with me.`]] },
    { when: H(7), priority: 6, say: [['shy', `Ay, again? I didn't miss you. I just happened to keep looking at the door. For no reason. At all.`]] },
    { when: { dating: 'mari' }, priority: 8, say: [['shy', `Hola again. My heart did a thing. A small, orange thing. Hola.`]] },
    { when: { weather: 'rain' }, priority: 3, say: [['happy', `Splash! That's a Mari! That's a very wet Mari! Keep going!`]] },
  ],
  gift: {
    loves: ['bouquet', 'sketchbook', 'paint_set', 'seashell', 'sunflower'],
    likes: ['tulip_pink', 'daisy_white', 'rose_red', 'cake_slice', 'candy', 'cookie_box', 'postcard_set', 'disposable_camera', 'paper_lantern', 'berry_tart', 'hairpin'],
    dislikes: ['textbook_math', 'workbook', 'flashcards', 'bento', 'towel'],
    hates: ['calculator', 'textbook_history'],
    lines: {
      loves: [['surprised', `For ME?! Teo, you can't just hand a person the exact thing! That's, that's emotional wizardry! I love it!`], ['happy', `AY! I'm going to cry on it! It'll be a texture! Thank you thank you thank you!`], ['shy', `Nobody's ever remembered what I'd actually want. You did. I'm going to be weird about it for a week.`], ['happy', `It's perfect! It's so perfect I've already forgotten what I was going to say. That's the highest compliment I own!`]],
      likes: [['happy', `Oh, that's lovely! You're getting dangerously good at this, Teo!`], ['happy', `A treat! I'm going to eat it in one bite and then feel guilty and then draw about it!`], ['smug', `A solid gift! A strong composition! Eight out of ten, minus two for not being a sunflower!`], ['shy', `That's so thoughtful. I'm going to put it somewhere I'll see it every day. Probably the cactus shelf.`]],
      neutral: [['neutral', `Oh! Thanks! I'll... find a use. I can paint on anything. Anything!`], ['happy', `Interesting! Mysterious! I'll turn it into art. Possibly a hat.`], ['neutral', `Thank you! It's... a thing! A very gift-shaped thing!`], ['happy', `I'll treasure it, or at least turn it into a pretty shape.`]],
      dislikes: [['neutral', `Um. It's very... neat. Everything about it is neat. I feel like I'm being asked to tidy my soul.`], ['sad', `Is that for homework? I'm not mad. It's just that it makes my eyes hurt politely.`], ['neutral', `Thanks! I think! I'll put it somewhere I won't have to look at it. Under something. With a rug.`], ['shy', `It's kind of you. It's also the colour of "must file taxes." Sorry!`]],
      hates: [['angry', `Ugh! Teo! A numbers thing! Are you telling me art is a "hobby"? Is that what the gift is saying?`], ['sad', `That's... that's the kind of gift that says "get a real job." I don't love it.`], ['angry', `No no no! Take it away! It's a grey box of "should!"`], ['sad', `I thought you knew me. Okay. It's fine. It's... fine. I'm going to be loudly fine for a while.`]],
      birthday: [['surprised', `You REMEMBERED?! It's my birthday?! Wait, it is. I forgot. My own birthday. I'm spaghetti.`], ['happy', `A present! On my day! Teo, this is the best, I'm going to draw this for a month!`], ['shy', `Nobody's ever brought a gift to the carnations. They don't count. I do. Okay, I'm weeping. It's not important. Gracias.`], ['happy', `Happy birthday to me, and happy birthday to you for being in it! That's how it works! It's true!`]],
    },
  },
};
