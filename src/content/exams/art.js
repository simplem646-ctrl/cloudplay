// Exam question bank: Art & Music. Tier 1 = Year 1 (easiest) ... tier 3 = Year 3. 18 questions, 6 per tier.
// Q(question, right, [wrong x3], tier, topic): the correct answer is placed at a rotating position (so position never gives it away).
let n = 0;
const Q = (q, right, wrong, tier, topic) => {
  const pos = [1, 3, 0, 2][n++ % 4];
  const a = wrong.slice();
  a.splice(pos, 0, right);
  return { q, a, correct: pos, tier, topic };
};

export default {
  subject: 'art',
  questions: [
    Q('Which two primary colors mix to make green?', 'Blue and yellow', ['Red and blue', 'Red and yellow', 'Blue and white'], 1, 'color'),
    Q('How many strings does a standard violin have?', '4', ['3', '5', '6'], 1, 'instruments'),
    Q('Which instrument has black and white keys?', 'Piano', ['Flute', 'Drum', 'Trumpet'], 1, 'instruments'),
    Q('Red, blue and yellow are called?', 'Primary colors', ['Neutral colors', 'Pastel colors', 'Cool colors'], 1, 'color'),
    Q('A \'sketch\' is a quick what?', 'Drawing', ['Song', 'Sculpture', 'Poem'], 1, 'art'),
    Q('\'Do Re Mi\' are notes of a?', 'Scale', ['Chord', 'Rhythm', 'Lyric'], 1, 'music theory'),
    Q('Who painted the \'Mona Lisa\'?', 'Leonardo da Vinci', ['Vincent van Gogh', 'Pablo Picasso', 'Claude Monet'], 2, 'artists'),
    Q('Mixing a color with white makes a?', 'Tint', ['Shade', 'Tone', 'Hue'], 2, 'color'),
    Q('How many beats does a whole note usually last?', '4', ['1', '2', '8'], 2, 'music theory'),
    Q('The trumpet belongs to which instrument family?', 'Brass', ['Woodwind', 'String', 'Percussion'], 2, 'instruments'),
    Q('Who painted \'The Starry Night\'?', 'Vincent van Gogh', ['Leonardo da Vinci', 'Claude Monet', 'Pablo Picasso'], 2, 'artists'),
    Q('Colors opposite on the color wheel are called?', 'Complementary', ['Analogous', 'Primary', 'Monochrome'], 2, 'color'),
    Q('Claude Monet helped start which art movement?', 'Impressionism', ['Cubism', 'Surrealism', 'Pop art'], 3, 'movements'),
    Q('In music, \'allegro\' means?', 'Fast and lively', ['Slow and sad', 'Very quiet', 'Getting louder'], 3, 'music theory'),
    Q('How many sharps does the key of G major have?', '1', ['0', '2', '3'], 3, 'music theory'),
    Q('Picasso co-founded which art style?', 'Cubism', ['Realism', 'Baroque', 'Romanticism'], 3, 'movements'),
    Q('Which symbol raises a note by a half step?', 'Sharp', ['Flat', 'Natural', 'Rest'], 3, 'music theory'),
    Q('A symphony is written for a full?', 'Orchestra', ['Choir', 'String quartet', 'Rock band'], 3, 'music theory'),
  ],
};
