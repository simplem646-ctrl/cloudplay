// Jules Park: easygoing class clown, soccer, future sports journalist, Park's Diner. Nicknames; earnest when it matters.
const t = (priority, when, ...say) => ({ ...(when ? { when } : {}), priority, say });
const H = (lo) => ({ hearts: ['jules', '>=', lo] });
const low = { hearts: ['jules', '<', 4] };
const mid = { all: [H(4), { hearts: ['jules', '<', 8] }] };

export default {
  npc: 'jules',
  talk: [
    t(20, low, ['happy', `Hartley-dude! Jules Park, live from the corridor. Today's headline: you look alive. Shocking.`]),
    t(20, low, ['smug', `Rule one, still: the third vending button is tomato. I will never stop telling you.`]),
    t(20, low, ['happy', `My mum asks about you at dinner. "Is the quiet boy eating?" I say you eat like a champion. Do not make me a liar.`]),
    t(21, mid, ['happy', `Hartley! My favourite co-star. I'm writing the sequel to our friendship. It has a diner scene.`]),
    t(21, mid, ['neutral', `Fun fact: I practise my commentary in the shower. The soap is a very bad interviewee.`]),
    t(21, mid, ['smug', `Park's Diner noodle special today. For you? Free. For anyone else? Also free. We are bad at business.`]),
    t(24, H(8), ['neutral', `You know, I used to joke so nobody would ask how I was. Then you asked anyway. Annoying. Thanks.`]),
    t(24, H(8), ['happy', `When I make it as a sports reporter, you get a front-row seat and a mention. A small mention. Okay, a footnote.`]),
    t(24, H(8), ['shy', `Weird thing about friends: you stop doing bits and just talk. I like that. Do not tell anyone.`]),
    t(26, { weather: 'rain' }, ['happy', `Rain! Soccer practice cancelled and my hair has declared independence. Come help me hold an umbrella and a grudge.`]),
    t(26, { weather: 'storm' }, ['surprised', `Storm warning! Even the gulls are staying in. I saw one wearing a plastic bag as a hat.`]),
    t(26, { weather: 'snow' }, ['happy', `Snow! Soccer in snow is basically ice skating with worse knees. Come watch me fall like a professional.`]),
    t(25, { season: 'spring' }, ['happy', `Spring! Petals in my hair, petals in my noodles. Dad says it is "seasoning". It is not.`]),
    t(25, { season: 'summer' }, ['happy', `Summer! The diner fan is dead and the noodles are hot. Come for the atmosphere. Bring a fan.`]),
    t(25, { season: 'autumn' }, ['smug', `Sports Festival soon. I'm doing live commentary on my own sprint. Spoiler: heroic, then tragic.`]),
    t(25, { season: 'winter' }, ['neutral', `Winter. My nose has two settings: red and drippy. Soup helps. So does standing near Dante's ego, it radiates heat.`]),
    t(24, { weekday: ['Sat', 'Sun'] }, ['happy', `Weekend shift at the diner! I carry six bowls at once. Five if Dad is watching. Four if it's soup.`]),
    t(24, { time: ['18:00', '23:00'] }, ['neutral', `Late. Dad will say "the noodles don't boil themselves." And then, very quietly, "thanks for coming home."`]),
    t(26, { map: 'school_classroom' }, ['smug', `Seat by the window, next to me. Best view in class. Worst view of the board. Fair trade.`]),
    t(26, { map: 'town_harbor' }, ['happy', `Harbor! Home of the gull that stole my fish ball. We have not reconciled.`]),
    t(26, { map: 'school_field' }, ['happy', `The pitch! I know every bald patch by name. That one is Gerald. Do not step on Gerald.`]),
    t(27, { flag: 'main_core_found' }, ['thinking', `Heard you found something for the bell. Hartley-dude, if this works, I want the exclusive. Naturally I'll cry on camera.`]),
    t(28, { flag: 'main_bell_restored' }, ['happy', `The BELL, man! The bell! I've drafted four headlines. All of them have exclamation marks. All of them are correct!`]),
    t(26, { flag: 'main_committee_joined' }, ['smug', `Bell Committee, huh? Fancy. Do they have jackets? I'd look incredible in a committee jacket.`]),
    t(30, { festival: true }, ['happy', `Festival day! I'm roaming with a pretend microphone. Say something quotable. Anything. "Wow" counts.`]),
    t(25, { year: 3 }, ['sad', `Last year, Hartley. I keep writing "last" on things and then crossing it out. Pencil is a coping mechanism.`]),
    t(1, null, ['happy', `Hartley-dude! Got a minute? Or at least a fun fact? I have eleven.`]),
    t(1, null, ['smug', `Breaking news: you are standing near me. More at six.`]),
    t(1, null, ['neutral', `If you see the tomato button, tell it I said hi. Tell it I'm not mad. Tell it I'm a little mad.`]),
  ],
  repeat: [
    t(1, null, ['happy', `Back again? Ratings are going up!`]),
    t(1, null, ['smug', `Second interview of the day. I'm charging by the hour. Payment accepted in noodles.`]),
    t(1, null, ['neutral', `I had a joke ready. It was good. Now you are here and it has left. Sorry.`]),
    t(5, H(6), ['shy', `Hey. Two chats in one day. I'm starting to think you like me. Fine. I like you too. Moving on!`]),
    t(4, { weather: 'rain' }, ['happy', `Still raining. I'm having a very dramatic day. Please applaud.`]),
  ],
  gift: {
    loves: ['soccer_ball', 'curry_plate', 'disposable_camera', 'whoopee_cushion'],
    likes: ['soda', 'sandwich', 'sports_drink', 'cookie_box', 'sneakers', 'riceball'],
    dislikes: ['perfume', 'knit_scarf', 'tea_leaves'],
    hates: ['black_licorice', 'veggie_soup'],
    lines: {
      loves: [['surprised', `No way! For me?! Hartley-dude, you are officially my favourite person this minute!`], ['happy', `This is perfect! I'm putting it in the diner window. Dad will pretend to hate it. He'll love it.`]],
      likes: [['happy', `Oh nice, thanks! You get free noodles forever. Okay, for a week.`], ['smug', `A fine choice. The commentary team approves.`]],
      neutral: [['neutral', `Huh, cool, thanks! I'll find a use. Or a joke. Same thing.`], ['happy', `You thought of me! That counts for a lot.`]],
      dislikes: [['neutral', `Uh. Thanks? I'm gonna do the polite face. Is this the polite face?`], ['sad', `That's kind of not me, man. But the thought counts, I guess.`]],
      hates: [['angry', `Ugh! No! Why! My mouth has filed a complaint!`], ['surprised', `Is this a prank? Are YOU pranking ME? I'm both offended and impressed.`]],
      birthday: [['surprised', `You remembered my birthday?! Okay, I'm legally allowed to cry on camera now.`], ['happy', `Best birthday present: a friend who listens to my terrible jokes. And also this. Thanks, Hartley!`]],
    },
  },
};
