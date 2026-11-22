export default {
  npc: 'celeste',
  intro: [
    { meet: 'celeste' },
    { say: 'celeste', text: 'Oh. Hello. Did the stars send you? No... that was just the wind.', expr: 'thinking' },
    { say: 'celeste', text: "I'm Celeste. I keep the observatory, on the hill. You must be {player}, the new lamplighter, perhaps?", expr: 'happy' },
    { say: 'celeste', text: 'The sky is quite lovely tonight. Or was it yesterday? Days are slippery things.', expr: 'neutral' },
    { ask: [
      { text: 'Tell me about the stars.', then: [{ say: 'celeste', text: 'They are very patient. They shine even if no one looks. I think that is brave.', expr: 'happy' }] },
      { text: 'Have you eaten today?', then: [{ say: 'celeste', text: 'Eaten? Today? Oh. I may have... meant to. Thank you for asking.', expr: 'surprised' }] },
    ] },
    { say: 'celeste', text: 'Come up to the hill after dark, if you like. The sky is better with company.', expr: 'happy' },
  ],
  talk: [
    { id: 'celeste_default_1', weight: 1, lines: [
      ['The moon looked like a lemon this morning. Or was it a lemon that looked like the moon?', 'thinking'],
      ['Hello, {player}. I was just counting stars. I lost count at nine. Again.', 'happy'],
    ] },
    { id: 'celeste_default_2', weight: 1, lines: [
      ['Do you hear that? No? It is the sky humming. It does that when it is happy.', 'happy'],
      ["I think I forgot something. It's either lunch or my own name. Hello!", 'surprised'],
    ] },
    { id: 'celeste_spring', weight: 2, when: { season: 'spring' }, lines: [
      ['Spring skies are soft. Like a blanket someone tucked around the world.', 'happy'],
    ] },
    { id: 'celeste_summer', weight: 2, when: { season: 'summer' }, lines: [
      ['Summer nights are short, so the stars hurry. I try to catch them all.', 'thinking'],
    ] },
    { id: 'celeste_autumn', weight: 2, when: { season: 'autumn' }, lines: [
      ['Autumn is when the sky shows off. Clear, crisp, and full of wishes.', 'happy'],
    ] },
    { id: 'celeste_winter', weight: 2, when: { season: 'winter' }, lines: [
      ['The winter sky is a sheet of diamonds. If you hold very still, you can hear it chime.', 'happy'],
    ] },
    { id: 'celeste_rain', weight: 3, when: { weather: ['rain', 'storm'] }, lines: [
      ['The clouds are hiding the sky today. They are shy. I will not pry.', 'thinking'],
      ["Rain is the sky's way of telling a long story. Can you hear it?", 'happy'],
    ] },
    { id: 'celeste_night', weight: 2, when: { time: { from: '20:00', to: '26:00' } }, lines: [
      ['Look up. Do you see the one that blinks? That is Mira. I named it after the baker. She is always busy.', 'laugh'],
    ] },
    { id: 'celeste_morning', weight: 2, when: { time: { from: '06:00', to: '14:00' } }, lines: [
      ['Is it morning? How strange. I thought the sun was still asleep.', 'surprised'],
    ] },
    { id: 'celeste_friend', weight: 3, when: { hearts: { npc: 'celeste', gte: 3 } }, lines: [
      ["I'm glad you came, {player}. The stars like you. They told me. In a manner of speaking.", 'happy'],
      ['It is easier to remember to eat, when you are near. Isn\'t that odd?', 'shy'],
    ] },
    { id: 'celeste_close', weight: 3, when: { hearts: { npc: 'celeste', gte: 6 } }, lines: [
      ['I wait for my mentor, you know. Every night. But lately I also wait for you.', 'shy'],
    ] },
    { id: 'celeste_new_1', weight: 2, when: { hearts: { npc: 'celeste', gte: 0, lte: 1 } }, lines: [
      ['Oh, hello. Is it Tuesday? It might be Thursday. I have not checked the sky for the day lately.', 'thinking'],
    ] },
    { id: 'celeste_new_2', weight: 2, when: { hearts: { npc: 'celeste', gte: 0, lte: 2 } }, lines: [
      ["I forgot lunch again. Twice. Today I wrote myself a note: 'Eat.' I then forgot the note. It is on the telescope.", 'shy'],
    ] },
    { id: 'celeste_cloud_3', weight: 2, when: { weather: ['rain', 'storm'] }, lines: [
      ['Rain makes the sky wear a blanket. The stars are still there. They are only pretending not to be.', 'happy'],
      ['I am cataloguing the clouds instead. This one is called Gentle Sarcasm.', 'laugh'],
    ] },
    { id: 'celeste_friend_4', weight: 2, when: { hearts: { npc: 'celeste', gte: 3, lte: 6 } }, lines: [
      ["I counted forty-one lamps on my walk. I knew each one's name by the end. Is that normal? It feels normal.", 'happy'],
    ] },
    { id: 'celeste_vane_5', weight: 3, when: { hearts: { npc: 'celeste', gte: 5, lte: 8 } }, lines: [
      ['I wrote another letter to Aldous. I did not send it. Letters feel braver when they live in a drawer.', 'sad'],
      ['But you made me want to post it. Perhaps tomorrow.', 'shy'],
    ] },
    { id: 'celeste_winter_6', weight: 2, when: { season: 'winter' }, lines: [
      ['The winter sky is a crisp, clean sheet of paper. Every star is a freshly sharpened pencil point.', 'happy'],
      ['Mind the cold. I forgot my gloves again. I have two spare pairs. Somewhere. In the sky.', 'laugh'],
    ] },
    { id: 'celeste_dating_7', weight: 3, when: { flag: 'celeste_dating' }, lines: [
      ['I found a new star! Then it moved. It was a firefly in the lens. I have named it anyway. Its name is Hope.', 'laugh'],
      ['Come sit. I saved you the warm half of the blanket.', 'shy'],
    ] },
  ],
  gifts: {
    love: [
      ['Oh... it shines. Like a little piece of sky. Thank you.', 'happy'],
      ["How did you know? It's exactly what I was dreaming of. Thank you, {player}.", 'shy'],
    ],
    like: [
      ['How lovely... I shall keep it by the window, where the starlight can see it.', 'happy'],
      ['Thank you. It feels like a small, kind thought.', 'happy'],
    ],
    neutral: [
      ['Oh, a gift... thank you. I will find a place for it among the constellations.', 'thinking'],
      ["That's very kind. I will remember to be grateful. Perhaps after supper.", 'happy'],
    ],
    dislike: [
      ["It is... not quite my colour. Is it your colour? I shall keep it safe for you.", 'worried'],
      ['Oh dear. It does not belong with the stars. But thank you.', 'worried'],
    ],
    hate: [
      ['Oh... oh no. That smells like a very sad Tuesday.', 'sad'],
      ['I am sorry. I cannot keep that. The telescope would not like it.', 'sad'],
    ],
    birthday: [
      ["You remembered the day I fell out of the sky. Thank you, {player}. It's beautiful.", 'happy'],
      ['A birthday gift... from a friend. What a bright, soft thing to receive.', 'shy'],
    ],
    again: [
      ['The moon says you have given me enough for one day. But thank you.', 'happy'],
      ["Another? Oh, no, no. I'm overflowing. Like a teacup, and the tea is starlight.", 'laugh'],
    ],
  },
};
