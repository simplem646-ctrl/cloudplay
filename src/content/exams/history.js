// Exam question bank: History. Tier 1 = Year 1 (easiest) ... tier 3 = Year 3. 18 questions, 6 per tier.
// Q(question, right, [wrong x3], tier, topic): the correct answer is placed at a rotating position (so position never gives it away).
let n = 0;
const Q = (q, right, wrong, tier, topic) => {
  const pos = [1, 3, 0, 2][n++ % 4];
  const a = wrong.slice();
  a.splice(pos, 0, right);
  return { q, a, correct: pos, tier, topic };
};

export default {
  subject: 'history',
  questions: [
    Q('Which civilization built the pyramids at Giza?', 'Egyptians', ['Romans', 'Greeks', 'Persians'], 1, 'ancient'),
    Q('In which country did the Olympic Games begin?', 'Greece', ['Italy', 'Egypt', 'France'], 1, 'ancient'),
    Q('Who was the first President of the United States?', 'George Washington', ['Abraham Lincoln', 'Thomas Jefferson', 'John Adams'], 1, 'modern'),
    Q('The Great Wall of China was built to?', 'Protect against invaders', ['Store grain', 'Mark a river border', 'Honor an emperor'], 1, 'ancient'),
    Q('Which empire was ruled from Rome?', 'The Roman Empire', ['The Ottoman Empire', 'The Mongol Empire', 'The Inca Empire'], 1, 'ancient'),
    Q('Who sailed across the Atlantic in 1492 for Spain?', 'Christopher Columbus', ['Marco Polo', 'Ferdinand Magellan', 'Leif Erikson'], 1, 'exploration'),
    Q('Gutenberg\'s invention spread books across Europe. It was?', 'The printing press', ['The steam engine', 'The telescope', 'The compass'], 2, 'renaissance'),
    Q('The Renaissance began in which country?', 'Italy', ['England', 'Spain', 'Germany'], 2, 'renaissance'),
    Q('In which year did World War II end?', '1945', ['1918', '1939', '1950'], 2, 'modern'),
    Q('Which wall fell in 1989 as the Cold War ended?', 'The Berlin Wall', ['The Great Wall', 'Hadrian\'s Wall', 'The Western Wall'], 2, 'modern'),
    Q('Which civilization built Machu Picchu?', 'The Inca', ['The Aztec', 'The Maya', 'The Olmec'], 2, 'ancient'),
    Q('The Industrial Revolution relied on which power source?', 'Steam', ['Solar', 'Nuclear', 'Wind'], 2, 'industrial'),
    Q('The French Revolution began in which year?', '1789', ['1689', '1815', '1848'], 3, 'modern'),
    Q('Who led India\'s nonviolent independence movement?', 'Mohandas Gandhi', ['Winston Churchill', 'Nelson Mandela', 'Ho Chi Minh'], 3, 'modern'),
    Q('Which treaty ended World War I with Germany?', 'Treaty of Versailles', ['Treaty of Paris', 'Treaty of Vienna', 'Treaty of Tordesillas'], 3, 'modern'),
    Q('The Silk Road mainly connected China with?', 'The Mediterranean', ['The Americas', 'Antarctica', 'Australia'], 3, 'trade'),
    Q('Who nailed the 95 Theses in 1517?', 'Martin Luther', ['John Calvin', 'Pope Leo X', 'Henry VIII'], 3, 'reformation'),
    Q('Which ancient city-state was famous for its soldiers?', 'Sparta', ['Athens', 'Corinth', 'Delphi'], 3, 'ancient'),
  ],
};
