export default {
  npc: 'pip',
  intro: [
    { meet: 'pip' },
    { say: 'pip', text: 'WHOA! You are new! I am Pip! I am NINE! Nearly ten! Do you like bugs?!', expr: 'happy' },
    { say: 'pip', text: "I have a net and a jar and a snail called Steve! Steve is not in the jar. He escaped. Again.", expr: 'worried' },
    { say: 'pip', text: 'If you see Steve, tell me! He is brown! And slow! And probably sad!', expr: 'happy' },
  ],
  talk: [
    { id: 'pip_default_1', weight: 1, lines: ['I FOUND A BEETLE! It was a leaf. But a MOVING leaf!', 'Look, look! A caterpillar! He is eating my sandwich! No, wait, that is Lottie!'] },
    { id: 'pip_default_2', weight: 1, lines: ['I can run faster than the wind! Wanna race? I will give you a head start. A small one!'] },
    { id: 'pip_spring', weight: 2, when: { season: 'spring' }, lines: ['Spring is the best! Ladybugs! Butterflies! Mud! So much mud!'] },
    { id: 'pip_summer', weight: 2, when: { season: 'summer' }, lines: ['SUMMER! Fireflies and crickets and grasshoppers! My net is SO full! (It is not full. It has a hole.)'] },
    { id: 'pip_autumn', weight: 2, when: { season: 'autumn' }, lines: ['Autumn leaves are the best for jumping in! Henrik says no. I say, yes! In secret!'] },
    { id: 'pip_winter', weight: 2, when: { season: 'winter' }, lines: ['It is SNOWING! Where do the bugs go? Under the snow! I am going to find them! Maybe tomorrow!'] },
    { id: 'pip_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: ['Rain means WORMS! Lots of worms! I am the king of worms! I have a very small crown!'] },
    { id: 'pip_evening', weight: 2, when: { time: { from: '17:00', to: '21:00' } }, lines: ['I have to go home soon. Dad says if I am late again he will make me eat vegetables. EVERY vegetable.'] },
    { id: 'pip_friend', weight: 3, when: { hearts: { npc: 'pip', gte: 3 } }, lines: ['You are my best grown-up friend! You listen to all my bug stories! Even the boring ones!'] },
  ],
  gifts: {
    love: ['WOW! WOW WOW WOW! This is the BEST THING EVER! Thank you!!!', "I'm gonna keep this FOREVER! And ever! And a day!"],
    like: ['Cool! Thank you!', 'Ooh, nice! I can use that!'],
    neutral: ['Oh. Thank you. Is it a toy?', 'Um. Okay! Thanks!'],
    dislike: ['Ew. Is that a vegetable? Do I have to eat it?', 'Hmm. Not my favourite. But thanks.'],
    hate: ['EWWW! That is DISGUSTING! Take it away!', 'NOPE. No no no no. Nope.'],
    birthday: ['IT IS MY BIRTHDAY AND YOU REMEMBERED!!! I am going to be TEN! You are AMAZING!', "A BIRTHDAY GIFT! Best day ever! I'm going to tell EVERYONE!"],
    again: ['You gave me too many! I have no more pockets!', 'No more! I am full of presents! (And snacks.)'],
  },
};
