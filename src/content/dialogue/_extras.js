// Background extras: student_01..14 and townie_01..08. Default export is an ARRAY of dialogue pools.
// Each extra has a small personality: generic lines (always eligible), plus a weather line, a season line and a time/place line.
const make = (npc, generic, weather, season, extra) => ({
  npc,
  talk: [
    ...generic.map((say) => ({ priority: 1, say: [say] })),
    { when: weather[0], priority: 10, say: [weather[1]] },
    { when: season[0], priority: 10, say: [season[1]] },
    { when: extra[0], priority: 10, say: [extra[1]] },
  ],
  repeat: [
    { priority: 1, say: [generic[0]] },
    { priority: 1, say: [generic[1]] },
    { priority: 1, say: [['neutral', `Oh. We already talked. Hi again.`]] },
  ],
});
const rain = { weather: ['rain', 'storm'] };
const snow = { weather: 'snow' };
const sunny = { weather: 'sunny' };
const SP = { season: 'spring' };
const SU = { season: 'summer' };
const AU = { season: 'autumn' };
const WI = { season: 'winter' };
const morning = { time: ['06:00', '10:00'] };
const evening = { time: ['17:00', '23:00'] };

export default [
  make('student_01', [
    ['neutral', `Did you hear? Jules put a whoopee cushion on Ms. Delaney's chair. She sat on it. She laughed. Nobody was ready.`],
    ['smug', `I know everyone's secret. Ask me. Actually don't. I'll tell you anyway. Okay, but one at a time.`],
    ['happy', `Gossip is just news with better lighting. And I've got the lighting.`],
    ['thinking', `Someone saw a light in the old bell tower last night. It wasn't a ghost. Probably. I'm checking.`],
    ['surprised', `Wait, you're friends with the Bell Committee? Tell me everything. No, wait. Tell me three things.`],
    ['smug', `A tip: the fourth stall in the east restroom has a sign. Do not read it. It's spoilers.`],
  ], [rain, ['neutral', `Rain makes everyone talkative. That's good for me. Bad for the umbrella rack.`]],
  [AU, ['happy', `Bell Festival gossip is the best gossip. Whose booth is going to flop? Mine's the cake one.`]],
  [{ map: 'school_hall_1f' }, ['smug', `The first floor corridor. The biggest news crossroads in school. I'm basically a newsstand.`]]),

  make('student_02', [
    ['neutral', `...Yawn. Sorry. I stayed up reading. Then rereading. Then staring at the ceiling.`],
    ['thinking', `Do you ever feel like the desk is just a bed that's too upright?`],
    ['neutral', `Five more minutes. Not of class. Of this conversation. With my eyes closed.`],
    ['happy', `The best part of school is the nap that happens between classes. Don't tell the nurse.`],
    ['sad', `I set three alarms. All of them are in my dream. It's a very organised dream.`],
    ['neutral', `Quiet people are just people on low battery. Charge me with a snack.`],
  ], [sunny, ['happy', `Sunny day. A perfect window seat. I'll be right here for the next four hours.`]],
  [WI, ['neutral', `Winter. My blanket and I have not parted since November. We're thinking of getting married.`]],
  [morning, ['neutral', `Morning. I'm technically here. Spiritually, still in bed.`]]),

  make('student_03', [
    ['happy', `Did you see the match yesterday? That last-second goal! I screamed so loud my dog howled.`],
    ['smug', `Soccer, track, tennis: I follow them all. I'm like a very loud, very sweaty encyclopedia.`],
    ['surprised', `Jules has a better commentary voice than the actual TV guys. I'm not kidding. I'd pay.`],
    ['happy', `Dante's keepie-uppie record is 412. The ball's still got the dents.`],
    ['neutral', `I can't play any sport. But I can name every player's lucky sock.`],
    ['happy', `Sports Festival soon? I've got banners. I've got a megaphone. I've got a cold, but no regrets.`],
  ], [rain, ['neutral', `Rain delays? The worst. It's like a sad commercial break.`]],
  [AU, ['happy', `Sports Festival's near! Class B has the best relay team. I made a chart. It has colours.`]],
  [{ map: 'school_field' }, ['happy', `The pitch! Can you hear the echo of a thousand goals? I can. It's mostly Dante's ego.`]]),

  make('student_04', [
    ['sad', `I'm a first-year. Everything's big. The stairs are big. The teachers are big. I'm... less big.`],
    ['shy', `Excuse me, is this the way to Room 2-B? Or 2-D? Or the roof? I've been lost since Tuesday.`],
    ['neutral', `I joined a club. I don't know which. They gave me a snack. I stayed.`],
    ['surprised', `Everyone seems to know where they're going. Is there a map? Does anyone have a map?`],
    ['shy', `Do you know the upperclassmen? Are they friendly? Or like cats: friendly if you've got food?`],
    ['happy', `It gets better, right? Tell me it gets better. Tell me with confidence.`],
  ], [rain, ['sad', `Rain. I forgot an umbrella. And my lunch. And possibly my name. Today's not great.`]],
  [SP, ['shy', `It's spring, and I'm new. It's like being a bud. A nervous bud.`]],
  [{ map: 'school_hall_2f' }, ['surprised', `Second floor! I made it! It took me twelve minutes. Is that a record?`]]),

  make('student_05', [
    ['neutral', `I've got a test tomorrow. And one the day after. And one the day after that. It's a trilogy.`],
    ['thinking', `Studying is mostly staring at a page until it blinks first.`],
    ['sad', `Do you ever feel like your brain's a browser with forty tabs open? Same.`],
    ['neutral', `Flashcards: the only cards I'm good at. I'm terrible at poker.`],
    ['happy', `Break time! My favourite subject. I've got a perfect score.`],
    ['smug', `I colour-code my notes. Four colours. Zero idea what the colours mean. It's about the vibe.`],
  ], [rain, ['neutral', `Rain's perfect for studying. Or avoiding studying. I've done both. Simultaneously.`]],
  [{ season: ['spring', 'autumn'] }, ['sad', `Exam week is coming. I can feel it in my bones. Mostly my tired ones.`]],
  [{ map: 'school_library' }, ['thinking', `The library. Quiet, cool, and judgement-free. Also a nice place to fall asleep on a textbook.`]]),

  make('student_06', [
    ['happy', `I'm in the Art Club! I draw everything! Even this conversation! It's got a very nice nose.`],
    ['smug', `Mr. Quill said my sketch "had presence." I'm having it framed.`],
    ['thinking', `Do you see the shape of clouds? Mine are always cats. Sometimes bread. Mostly cats.`],
    ['happy', `I've got a pencil behind each ear. It's functional. And a statement.`],
    ['neutral', `Colours are just feelings with better names. Cerulean is Tuesday.`],
    ['shy', `I sketched you earlier. Don't look. It's a work in progress. You've got good hair.`],
  ], [sunny, ['happy', `Sunny! The light's perfect. Everything's a painting. Even the janitor's mop.`]],
  [AU, ['happy', `Autumn colours! I'm out of orange. I've used all the orange. I'm now using more orange.`]],
  [{ map: 'town_park' }, ['happy', `The park! A thousand shades of green. I've named four of them already.`]]),

  make('student_07', [
    ['neutral', `I'm the one who always brings an umbrella. It's rained twice this year and I was right both times.`],
    ['smug', `Prepared is my brand. I have bandages, snacks, a sewing kit, and a spare shoelace.`],
    ['thinking', `If you need a pen, I have six. If you need a plan B, I have three.`],
    ['happy', `You forgot your lunch? Here. I always pack two. Just in case. Always just in case.`],
    ['neutral', `Planning's my hobby. This conversation was scheduled for 3:42. You're right on time.`],
    ['surprised', `A surprise test? I've got flashcards. I always have flashcards.`],
  ], [rain, ['smug', `Rain. I told you. I told everyone. Nobody listened. Umbrella?`]],
  [WI, ['neutral', `Winter. Gloves, scarf, spare gloves, spare scarf. I'm a walking wardrobe.`]],
  [evening, ['neutral', `Evening. I always bring a torch. And a backup torch. And a very small third torch.`]]),

  make('student_08', [
    ['happy', `I'm the class representative for the festival committee! I have a clipboard! And power!`],
    ['smug', `If you need volunteers, I know a guy. I am the guy.`],
    ['neutral', `A festival isn't just fun. It's logistics with confetti.`],
    ['surprised', `Bell Festival is coming! We're short on chairs! And tape! And morale! Mostly chairs!`],
    ['happy', `I love planning things. Colours, schedules, small flags. It's a calling.`],
    ['thinking', `Do you know how many paper lanterns fit in a gym? Ninety-six. Ask me how I know.`],
  ], [rain, ['neutral', `Rain! Outdoor events: cancelled. Indoor events: panicking. Still thrilled!`]],
  [AU, ['happy', `Bell Festival! My Super Bowl! I've been up since four, pinning posters!`]],
  [{ festival: true }, ['surprised', `The festival's today! Is the sound system working? Is the cake alive? I'm fine!`]]),

  make('student_09', [
    ['neutral', `I'm in the music club. I play the triangle. It's a tough instrument. It's a lot of... ting.`],
    ['smug', `Vera's playing on the rooftop again. We pretend not to listen. We listen very hard.`],
    ['thinking', `Do you hear a song in everything? The bell, the bus, the vending machine? I do.`],
    ['happy', `I hum while I walk. People say I sound like a kettle. A musical kettle.`],
    ['shy', `I can't sing in front of anyone. But in the shower I'm a rock star.`],
    ['happy', `Mr. Quill says rests are as important as notes. I take a lot of rests.`],
  ], [rain, ['happy', `Rain's rhythm is a perfect 4/4. Don't tell Mr. Quill. He'd write a song.`]],
  [WI, ['neutral', `Winter. My fingers are too cold for the triangle. A true tragedy.`]],
  [{ map: 'school_rooftop' }, ['thinking', `The roof has the best acoustics in school. And the best view. And a cat.`]]),

  make('student_10', [
    ['happy', `I'm in the Literature Club! We're reading a mystery. I know who did it. Nobody asks me.`],
    ['thinking', `A good sentence is like a good sandwich. It's all in the layering.`],
    ['smug', `I read three books a week. Four, if the weather's bad. Five, if I'm avoiding something.`],
    ['shy', `Elise recommended me a book. It was perfect. She's like a tiny, bookish wizard.`],
    ['neutral', `I underline too much. Whole pages. Sometimes the whole book. It's about commitment.`],
    ['happy', `If you've never read a novel on a rainy afternoon, I recommend it. And a blanket.`],
  ], [rain, ['happy', `Rain and a book. That's the best weather. Nobody can argue. I have a spreadsheet.`]],
  [WI, ['thinking', `Winter, hot tea, a long novel. I'm in a very specific heaven.`]],
  [{ map: 'school_library' }, ['shy', `The library. Shh. The shelves are listening. Not really. But I like to pretend.`]]),

  make('student_11', [
    ['happy', `The cafeteria's curry is today's special! Best day of the week! I'm moving there.`],
    ['smug', `I know every vending machine in school. The third button on the first floor is a liar.`],
    ['surprised', `Did you try the Lantern Cafe's cocoa? It's like being hugged by a mug.`],
    ['neutral', `Lunch is the only honest part of the day. Everyone's real when there's food.`],
    ['happy', `Calder Bakery's rolls are legendary. I've eaten four. Today. Don't ask me about yesterday.`],
    ['thinking', `If I had one superpower, it'd be infinite snacks. The second would be infinite napkins.`],
  ], [rain, ['happy', `Rainy days are soup days. That's science. Probably.`]],
  [WI, ['happy', `Winter! Hot noodles, hot cocoa, hot buns. I'm a very warm person. On the inside.`]],
  [{ time: ['11:30', '13:30'] }, ['happy', `Lunchtime! The best hour! I've been counting down since 9.`]]),

  make('student_12', [
    ['neutral', `I'm in no clubs. Don't judge. I'm a professional bystander. It's a legitimate vocation.`],
    ['smug', `I've perfected the art of looking busy. You hold a folder and walk fast. Works every time.`],
    ['thinking', `Sometimes I think the real school is the walk between classes.`],
    ['happy', `Home club forever. Dismissal bell is my favourite song.`],
    ['neutral', `I'm saving my energy for something important. I haven't decided what.`],
    ['shy', `Do you ever just stand in a corridor and watch the world go by? Highly recommended.`],
  ], [rain, ['neutral', `Rain. Perfect. A reason to stay in. I love it when the sky agrees with me.`]],
  [SU, ['happy', `Summer break's coming. I've planned exactly nothing. It's going to be the best nothing ever.`]],
  [evening, ['neutral', `Evening. Time to go home. My favourite hobby, honestly.`]]),

  make('student_13', [
    ['surprised', `Hello! Did you know the school has a rooftop herb garden? It's secret. Sort of. There's a sign.`],
    ['happy', `I'm part of the gardening crew! I love dirt! It's honest!`],
    ['smug', `The basil told me it prefers the left corner. I'm learning to listen.`],
    ['neutral', `Plants don't care about exams. That's why I like them.`],
    ['happy', `If you ever feel down, go water something. It works. Probably.`],
    ['shy', `I named the tomato plant Gerald. He's very shy. He's also going red.`],
  ], [rain, ['happy', `Rain! The plants are thrilled! I'm thrilled! The umbrella is not thrilled!`]],
  [SP, ['happy', `Spring! Everything's sprouting! Even the thing I buried by accident!`]],
  [{ map: 'school_grounds' }, ['happy', `The grounds! The grass is a tiny forest. Mind the ants. They're workers. Union.`]]),

  make('student_14', [
    ['neutral', `I've got a theory the school bell isn't broken. It's just on a very long break.`],
    ['thinking', `Do you think the bell tower's haunted? I think it's just shy.`],
    ['surprised', `A teacher told me the clapper's missing. I said, "who steals a clapper?" He said, "history."`],
    ['smug', `If the bell rings, I'll be the first to hear it. I live closest. Practically in the tower.`],
    ['happy', `My grandmother says she heard it ring as a girl. She says it was off-key. Beautiful, though.`],
    ['thinking', `If it rings on Bell Night with someone you care about, a wish comes true. I've got a list.`],
  ], [{ weather: 'storm' }, ['surprised', `Thunder! It sounds like a bell. A very angry, very large bell.`]],
  [WI, ['thinking', `Winter. Bell Night's coming. I've picked a wish. It's very specific. And a bit embarrassing.`]],
  [{ flag: 'main_bell_restored' }, ['happy', `The bell works! I heard it! I cried! In public! No regrets!`]]),

  make('townie_01', [
    ['happy', `Caught a fish yesterday as long as my arm. Longer. Okay, as long as a bigger arm.`],
    ['neutral', `The Admiral, that gull, stole my sandwich. I've written him a strongly worded note.`],
    ['smug', `You think this is a good spot? I've fished here for forty years. It's still a good spot.`],
    ['surprised', `Last week I hooked a boot. Then a shoe. Then another boot. I'm opening a store.`],
    ['thinking', `The harbor's moods change like a cat's. Be careful when it purrs.`],
    ['happy', `If you see Mr. Finch, tell him my line's longer than his. He'll pretend not to hear.`],
  ], [rain, ['neutral', `Rain? Perfect. The fish think it's a holiday. They're biting.`]],
  [SU, ['happy', `Summer! The tourists scare the fish, and the fish scare the tourists. A fine ecosystem.`]],
  [{ map: 'town_harbor' }, ['happy', `Best spot in town. Don't tell anyone. I mean, you can tell them. They won't believe you.`]]),

  make('townie_02', [
    ['happy', `Fresh bread, fresh flowers, and a coupon I definitely haven't misplaced.`],
    ['neutral', `I'm on a mission: find the best deal in Bellhaven. So far: Calder Bakery's two-for-one rolls.`],
    ['smug', `I know every sale in town. Ask me. No, really. I'll tell you.`],
    ['thinking', `Do you think the corner mart restocks at 3? Or is it a mystery? I enjoy the mystery.`],
    ['surprised', `Did you see Reyes Blooms has new tulips? I bought nine. I don't own a vase.`],
    ['happy', `Shopping is my cardio. And my therapy. And my sport.`],
  ], [rain, ['neutral', `Rain? I've got a umbrella, two bags, and a plan. I'm fine.`]],
  [AU, ['happy', `Autumn. Sweaters on sale. I own six. I need a seventh.`]],
  [{ map: 'town_square' }, ['happy', `The square! A shopper's paradise. The fountain also has good vibes.`]]),

  make('townie_03', [
    ['neutral', `In my day, the school bell rang every morning. You could set your watch by it.`],
    ['sad', `They say the bell is broken. It isn't broken. It's waiting.`],
    ['happy', `I knew Mr. Finch when he had hair. Don't tell him I said that.`],
    ['thinking', `This town has stories in every brick. Most of them are about pigeons.`],
    ['smug', `Young man, I walked to school uphill both ways. In a town with no hills. That's talent.`],
    ['neutral', `My bench has a good view. It also has a good cushion. I bring my own.`],
  ], [rain, ['neutral', `Rain. Bad for my knees. Good for my tomatoes. A fair trade.`]],
  [SP, ['happy', `Spring! The blossoms are back. I've seen sixty of them. They never get old. I do.`]],
  [{ map: 'town_park' }, ['happy', `The park. Fifty years I've sat here. The squirrels know my face.`]]),

  make('townie_04', [
    ['happy', `Hello, dear! Have you eaten? You look thin. Not thin thin. Just under-lunched.`],
    ['neutral', `I used to dance at the harbor festival. Now I watch. With a very good view.`],
    ['smug', `In my day, the Lantern Cafe had one table and a very opinionated owner. Roz's mother.`],
    ['thinking', `Tea at four. Biscuits at five. A cat at six. It's a very full schedule.`],
    ['happy', `You remind me of my grandson. He's taller. He's also less polite. You win.`],
    ['neutral', `The flowers at Reyes Blooms are lovely. I buy one every Friday. For me.`],
  ], [rain, ['neutral', `Rain. Perfect for a scarf and a story.`]],
  [WI, ['happy', `Winter! Knit scarves for everyone! I've done twelve. They're all slightly different lengths.`]],
  [morning, ['happy', `Morning, dear. I take a walk every dawn. Keeps the bones honest.`]]),

  make('townie_05', [
    ['happy', `Morning jog! Five kilometres before breakfast! I'm sweating. Proudly.`],
    ['neutral', `Nina's the fastest runner in town. She nodded at me once. I treasured it.`],
    ['smug', `I run the harbor loop at dawn. The seagulls cheer. Or heckle. Hard to tell.`],
    ['surprised', `Whoa, you're up early! Join me! No? Okay! I'll wave as I pass!`],
    ['thinking', `Running isn't about speed. It's about being the first one to hear the town wake.`],
    ['happy', `I've worn out four pairs of shoes this year. The cobbler knows me by name.`],
  ], [rain, ['happy', `Rain run! Nobody's out! The puddles are mine!`]],
  [SU, ['neutral', `Summer! Hot, sticky, glorious. Hydrate. I've drunk three litres. I'm a fountain.`]],
  [morning, ['happy', `Morning's the best time. The air's fresh and the road's mine.`]]),

  make('townie_06', [
    ['neutral', `Late again. The train was early. It's the first time. I'm suspicious.`],
    ['sad', `Meetings, emails, more meetings. I miss lunch. I miss sunshine. I miss my plant.`],
    ['smug', `I know every shortcut between the station and the harbor. Eleven. Ten are legal.`],
    ['thinking', `The best part of a commute is the thirty seconds between stations when nobody speaks.`],
    ['happy', `Coffee from the Lantern Cafe keeps me going. Roz knows my order. I don't even speak.`],
    ['neutral', `If you see a man running with a briefcase and a croissant, that's me. Hello.`],
  ], [rain, ['neutral', `Rain. My umbrella's broken. My shoes are damp. My mood is dignified.`]],
  [WI, ['neutral', `Winter. It's dark when I leave and dark when I return. I've forgotten what the sun looks like.`]],
  [evening, ['sad', `Home at last. The streetlamps are my welcome committee.`]]),

  make('townie_07', [
    ['happy', `Hi! I'm seven and a half! Do you have a candy? I have a rock. It's a good rock.`],
    ['surprised', `I saw a crab! It waved! Or it was angry! Same thing!`],
    ['smug', `My dad says I'm "spirited." I think it means I'm winning.`],
    ['happy', `Wanna race to the corner? I'll let you win. Probably.`],
    ['shy', `I'm not supposed to talk to strangers. But you have a kind face. And maybe snacks.`],
    ['thinking', `If I dig a hole deep enough, will I reach the harbor? I'm going to find out.`],
  ], [rain, ['happy', `Puddles! The best invention ever! Jump with me!`]],
  [SU, ['happy', `Summer! Ice cream! The beach! No school! I love it all!`]],
  [{ map: 'town_park' }, ['happy', `The park! Swings! Slides! A very wise duck!`]]),

  make('townie_08', [
    ['neutral', `I'm not tired. I'm just resting my eyes. For a very long time.`],
    ['happy', `My big sister goes to your school. She says it's "fine." That means it's great.`],
    ['smug', `I know a secret: the lighthouse has a ghost. It's a very polite ghost. It says "excuse me."`],
    ['surprised', `Did you see the cat on the school roof? She's a queen. I'd follow her.`],
    ['happy', `I've got a collection of seashells. Eighty-three. They're all my friends.`],
    ['thinking', `Why's the sky blue? Dad says "science." Mum says "magic." I say both.`],
  ], [rain, ['happy', `Rain! I love how the world goes shiny! Like a freshly washed apple!`]],
  [WI, ['happy', `Snow soon, maybe! I've got a sled! It's slightly broken! It still works!`]],
  [{ map: 'town_harbor' }, ['happy', `The harbor! The boats go bob bob bob! It's my favourite song!`]]),
];
