// Library books. Reading logs them in the collection. `where` = bookshelf interactable.
const B = (id, title, author, where, pages, hint) => ({ id, title, author, where, pages, ...(hint ? { hint } : {}) });

const LIST = [
  B('book_birds_brook', 'Birds of the Brook', 'Eloise Fairweather', 'bookshelf_lib_1', [
    'The sparrow is the first to wake and the last to quiet down. Watch for it near the bakery steps.',
    'Ducks are not shy, only polite. They will accept bread from anyone with a kind face.',
    'Gulls steal sandwiches. This is not a theory. It is a fact.',
  ]),
  B('book_tides_tales', 'Tides and Tales', 'Captain A. Marlow', 'bookshelf_lib_1', [
    'A sailor once told me the sea has moods, and that you should never argue with it before breakfast.',
    'The harbor lights were first lit by a boy with a ladder and an old oil can. He was never late.',
    'Every good story needs a returning ship. I suppose every good town does too.',
  ]),
  B('book_baker_hundred', 'One Hundred Loaves', 'R. Calloway', 'bookshelf_lib_2', [
    'Loaf 1: Rye. Patience, salt and a warm kitchen are all you need.',
    'Loaf 37: Honey roll. If it is too sweet, add more bread. If it is too plain, add more honey. Repeat.',
    'Loaf 100: The one you bake for someone else. It always tastes better.',
  ]),
  B('book_tea_leaf', 'A Pot of Tea', 'D. Whitlock', 'bookshelf_lib_2', [
    'Water should be hot, not angry. Tea should be steeped, not rushed.',
    'The best tea is the one you drink slowly, with someone who does not mind the silence.',
  ]),
  B('book_star_atlas', 'A Small Star Atlas', 'C. Arden', 'bookshelf_lib_3', [
    'The Lamplighter stands low in the north in autumn. Seven stars, one for each lamp-post of the old town.',
    'To read the sky, first learn to be still. The stars are patient. They have time.',
    'There is a star near the hill that does not appear on any map. Perhaps it is simply shy.',
  ]),
  B('book_moon_garden', 'The Moon Garden', 'Anonymous', 'bookshelf_lib_3', [
    'There was once a garden that only bloomed at night, and a gardener who only slept by day.',
    'They never met, but each left small gifts for the other: a water can, a petal, a note.',
    'One evening the gardener stayed awake. The garden bloomed twice as bright. Some friendships take a little courage.',
  ]),
  B('book_lamplighter_almanac', "The Lamplighter's Almanac", 'T. Wren', 'bookshelf_lib_4', [
    'Dusk times, by season: spring at seven, summer at nine, autumn at six, winter at five. Check your watch, then check your heart.',
    'Wipe the glass every Friday. A dirty lamp is a sad lamp.',
    'Tuck a flower between the pages and you will always remember where you stopped.',
  ], { quest: 'm4_reader', text: 'There is something tucked into this almanac. It looks like a folded plan.' }),
  B('book_lantern_festival', 'The Lantern Festival', 'Lanternbrook Historical Society', 'bookshelf_lib_4', [
    'The festival began fifty winters ago, when the first lamplighter floated a paper boat with a candle down the brook.',
    'Everyone joined the following year. By the third year, nobody remembered it had been an accident.',
    'Today the Great Lantern is lit at the end of the night. The brook carries the rest, one small light at a time.',
  ]),
  B('book_mushroom_manual', 'Woodland Mushrooms', 'B. Moss', 'bookshelf_lib_5', [
    'Morels: yes. Chanterelles: yes. Anything bright red and glittering: no, and I mean it.',
    'If you are not sure, ask someone who is. If nobody is sure, leave it for the squirrels.',
  ]),
  B('book_fish_ledger', "The Angler's Ledger", 'G. Pelham', 'bookshelf_lib_5', [
    'Day one: caught nothing. Day two: caught nothing, but it was a very big nothing.',
    'The best bait is patience. The second best is actual bait.',
    'A fish tale grows with each telling. The fish does not complain.',
  ]),
  B('book_poems_ferris', 'Poems for a Slow Day', 'F. Quill', 'bookshelf_lib_6', [
    '"Slow is the river and slow is the day, the bread is still warm and the world can wait."',
    '"A bench by the pond and a pocketful of crumbs, what more could a person need?"',
  ]),
  B('book_willa_draft', "Willa's Unfinished Story", 'W. T.', 'bookshelf_lib_6', [
    'Chapter One. The lantern keeper never knew he was being watched from the library window.',
    'She waited every evening to see the lamps come on, one by one. It felt like a conversation.',
    '(The rest of the page is blank. A note in the margin: "Not ready. Maybe never. Maybe soon.")',
  ]),
];

export default Object.fromEntries(LIST.map((b) => [b.id, b]));
