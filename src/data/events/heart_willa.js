import { heartEvent as H, events } from './_heart.js';

export default events([
  H('willa', 2, {
    area: 'library', at: 'desk_front', npcAt: 'reading_nook', when: [{ weather: ['rain', 'storm'] }, { time: { from: '10:00', to: '17:00' } }],
    steps: [
      ['willa', 'Oh… you came in out of the rain. Come, I will show you something. Quietly.', 'shy'],
      { move: 'willa', to: 'reading_nook', speed: 'walk', wait: true },
      ['willa', 'The reading nook. Best seat in town on a day like this. The rain sounds like soft applause.', 'happy'],
      ['player', 'It is perfect.'],
      ['willa', 'I… have never shown anyone before. People usually just want the shelf for cookbooks.', 'shy'],
      ['willa', 'You may sit here whenever it rains. If you promise to be quiet. And to not eat near the books.', 'thinking'],
    ],
  }),
  H('willa', 4, {
    area: 'library', at: 'desk_front', npcAt: 'behind_desk', when: [{ time: { from: '10:00', to: '17:30' } }, { not: { weekday: 'tue' } }],
    steps: [
      ['willa', 'I… I have something for you. Do not laugh. It is a battered storybook. It was the first book I ever loved.', 'shy'],
      { giveItem: 'book_moon_garden', silent: true },
      ['willa', 'The cover is torn. The pages are soft. It smells of old cinnamon. It was my mother\'s.', 'sad'],
      ['player', 'Are you sure you want to lend it?'],
      ['willa', 'You… will take care of it. I know that. I can tell.', 'happy'],
      { emote: 'willa', icon: 'heart' },
      ['willa', 'Oh. I am blushing, aren\'t I. Please look at the book. Not me.', 'shy'],
    ],
  }),
  H('willa', 6, {
    area: 'starview_hill', at: 'view_bench_spot', npcAt: 'summit', when: [{ night: true }, { not: { weather: ['rain', 'storm', 'snow'] } }],
    steps: [
      ['willa', 'You came. I did not think you would… I mean, I hoped. I brought a lantern and something to read.', 'shy'],
      ['willa', 'It is one of mine. A story. I have never read it to anyone. It is not very good.', 'worried'],
      ['player', 'I would love to hear it.'],
      ['willa', '"There was once a librarian who loved the stars, but could only see them through a book…"', 'thinking'],
      { wait: 1200 },
      ['willa', '"…until a stranger lifted the book away, and showed her the sky was real."', 'happy'],
      ['willa', 'That is as far as I got. I did not know how it ends. Now… maybe I do.', 'shy'],
    ],
  }),
  H('willa', 8, {
    area: 'town_square', trigger: false, at: 'stage', npcAt: 'stage', prompt: 'Willa waits for your answer, the pages trembling in her hands.',
    when: [{ any: [
      { all: [{ festival: 'harvest' }, { area: 'town_square' }, { time: { from: '17:00', to: '22:00' } }] },
      { all: [{ dateFrom: { season: 'autumn', day: 15 } }, { area: 'library' }, { time: { from: '15:00', to: '17:45' } }] },
    ] }],
    yes: '…Yes. I think I have been saying yes for weeks. I just did not have the words. Now I do.',
    steps: [
      { if: { festival: 'harvest' },
        then: [{ say: 'willa', text: 'Everyone is here… Why did I agree to this. My hands are shaking.', expr: 'worried' }],
        else: [{ say: 'willa', text: 'Nobody is here. Good. I could not do this with a crowd. My hands are shaking anyway.', expr: 'worried' }] },
      ['willa', '"The lantern keeper never knew she was watching him light the lamps. She only knew it was her favourite hour."', 'shy'],
      ['willa', '"She waited. And one day, someone else was waiting too, at the other end of the street."', 'happy'],
      { sfx: 'confirm_big' },
      ['willa', 'That is the end. And I… I wrote it about you. Please say something. Anything.', 'shy'],
    ],
  }),
]);
