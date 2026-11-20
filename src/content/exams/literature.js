// Exam question bank: Literature. Tier 1 = Year 1 (easiest) ... tier 3 = Year 3. 18 questions, 6 per tier.
// Q(question, right, [wrong x3], tier, topic): the correct answer is placed at a rotating position (so position never gives it away).
let n = 0;
const Q = (q, right, wrong, tier, topic) => {
  const pos = [1, 3, 0, 2][n++ % 4];
  const a = wrong.slice();
  a.splice(pos, 0, right);
  return { q, a, correct: pos, tier, topic };
};

export default {
  subject: 'literature',
  questions: [
    Q('Which word is a noun?', 'happiness', ['quickly', 'jump', 'bright'], 1, 'grammar'),
    Q('Which is the correct spelling?', 'necessary', ['neccessary', 'necesary', 'neccesary'], 1, 'spelling'),
    Q('A word that means the opposite of \'ancient\' is?', 'modern', ['old', 'historic', 'dusty'], 1, 'vocabulary'),
    Q('\'The wind whispered\' is which figure of speech?', 'Personification', ['Simile', 'Alliteration', 'Hyperbole'], 1, 'figures'),
    Q('Which sentence is a question?', 'Where did you go?', ['Go home now.', 'I went out.', 'What a day!'], 1, 'grammar'),
    Q('A story\'s main character is called the?', 'Protagonist', ['Narrator', 'Antagonist', 'Editor'], 1, 'story'),
    Q('\'As brave as a lion\' is an example of a?', 'Simile', ['Metaphor', 'Idiom', 'Irony'], 2, 'figures'),
    Q('What is the plural of \'child\'?', 'Children', ['Childs', 'Childes', 'Childrens'], 2, 'grammar'),
    Q('Who wrote the play \'Romeo and Juliet\'?', 'William Shakespeare', ['Charles Dickens', 'Jane Austen', 'Mark Twain'], 2, 'authors'),
    Q('A poem with 14 lines is called a?', 'Sonnet', ['Haiku', 'Limerick', 'Ballad'], 2, 'poetry'),
    Q('Which word is an adverb? \'She sang beautifully.\'', 'beautifully', ['She', 'sang', 'the'], 2, 'grammar'),
    Q('Repeating a sound at the start of words (\'Peter Piper\') is?', 'Alliteration', ['Rhyme', 'Onomatopoeia', 'Irony'], 2, 'figures'),
    Q('Saying \'I could eat a horse\' is an example of?', 'Hyperbole', ['Understatement', 'Irony', 'Paradox'], 3, 'figures'),
    Q('What is the theme of a story?', 'Its central message', ['Its setting', 'Its length', 'Its first line'], 3, 'story'),
    Q('Who wrote \'Pride and Prejudice\'?', 'Jane Austen', ['Emily Bronte', 'Mary Shelley', 'George Eliot'], 3, 'authors'),
    Q('In a story, \'foreshadowing\' is?', 'Hints of what comes later', ['A sudden ending', 'A flashback', 'The narrator\'s name'], 3, 'story'),
    Q('An \'oxymoron\' is a phrase that?', 'Combines opposites', ['Repeats a sound', 'Compares with \'like\'', 'Exaggerates'], 3, 'figures'),
    Q('A metaphor is a?', 'Direct comparison', ['Sound word', 'Exaggeration', 'Repeated phrase'], 3, 'figures'),
  ],
};
