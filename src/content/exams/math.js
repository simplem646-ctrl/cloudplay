// Exam question bank: Math. Tier 1 = Year 1 (easiest) ... tier 3 = Year 3. 18 questions, 6 per tier.
// Q(question, right, [wrong x3], tier, topic): the correct answer is placed at a rotating position (so position never gives it away).
let n = 0;
const Q = (q, right, wrong, tier, topic) => {
  const pos = [1, 3, 0, 2][n++ % 4];
  const a = wrong.slice();
  a.splice(pos, 0, right);
  return { q, a, correct: pos, tier, topic };
};

export default {
  subject: 'math',
  questions: [
    Q('What is 7 x 8?', '56', ['54', '58', '64'], 1, 'arithmetic'),
    Q('What is 3/4 + 1/4?', '1', ['1/2', '3/8', '4/8'], 1, 'fractions'),
    Q('A square has sides of 5 cm. What is its area?', '25 sq cm', ['10 sq cm', '20 sq cm', '30 sq cm'], 1, 'geometry'),
    Q('What is 15% of 200?', '30', ['15', '20', '45'], 1, 'percent'),
    Q('Solve: 2x + 6 = 14. What is x?', '4', ['2', '6', '8'], 1, 'algebra'),
    Q('How many degrees are in a right angle?', '90', ['45', '120', '180'], 1, 'geometry'),
    Q('What is 3^2 + 4^2?', '25', ['7', '12', '49'], 2, 'powers'),
    Q('The angles of a triangle add up to how many degrees?', '180', ['90', '270', '360'], 2, 'geometry'),
    Q('What is the slope of the line y = 3x + 2?', '3', ['2', '5', '1/3'], 2, 'algebra'),
    Q('Simplify: 2(x + 3) - x', 'x + 6', ['x + 3', '2x + 6', '3x + 6'], 2, 'algebra'),
    Q('A circle has radius 3. Its circumference is about? (pi = 3.14)', '18.8', ['9.4', '28.3', '37.7'], 2, 'geometry'),
    Q('What is the median of 3, 9, 4, 7, 5?', '5', ['4', '6', '7'], 2, 'statistics'),
    Q('Solve x^2 - 5x + 6 = 0. The roots are?', '2 and 3', ['1 and 6', '-2 and -3', '3 and 4'], 3, 'algebra'),
    Q('What is sin(30 degrees)?', '0.5', ['0.866', '1', '0.707'], 3, 'trigonometry'),
    Q('Roll one fair die. P(a number above 4) is?', '1/3', ['1/6', '1/2', '2/3'], 3, 'probability'),
    Q('What is log10(1000)?', '3', ['2', '10', '100'], 3, 'logarithms'),
    Q('What is the derivative of x^2?', '2x', ['x', 'x^2', '2'], 3, 'calculus'),
    Q('The interior angles of a hexagon add up to?', '720', ['540', '600', '900'], 3, 'geometry'),
  ],
};
