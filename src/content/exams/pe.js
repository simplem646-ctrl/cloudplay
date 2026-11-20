// Exam question bank: P.E.. Tier 1 = Year 1 (easiest) ... tier 3 = Year 3. 18 questions, 6 per tier.
// Q(question, right, [wrong x3], tier, topic): the correct answer is placed at a rotating position (so position never gives it away).
let n = 0;
const Q = (q, right, wrong, tier, topic) => {
  const pos = [1, 3, 0, 2][n++ % 4];
  const a = wrong.slice();
  a.splice(pos, 0, right);
  return { q, a, correct: pos, tier, topic };
};

export default {
  subject: 'pe',
  questions: [
    Q('How many players per side are on the field in soccer?', '11', ['9', '10', '12'], 1, 'sports'),
    Q('What should you do before exercising?', 'Warm up', ['Eat a large meal', 'Skip water', 'Sit still'], 1, 'health'),
    Q('Which nutrient helps build muscles?', 'Protein', ['Sugar', 'Salt', 'Fiber'], 1, 'nutrition'),
    Q('How much sleep do teenagers need a night?', '8 to 10 hours', ['3 to 4 hours', '5 to 6 hours', '12 to 14 hours'], 1, 'health'),
    Q('Which organ pumps blood around the body?', 'Heart', ['Lungs', 'Stomach', 'Kidney'], 1, 'anatomy'),
    Q('A relay race is run by a?', 'Team passing a baton', ['Single runner', 'Pair on a bike', 'Group with a ball'], 1, 'sports'),
    Q('What is the best drink during long exercise?', 'Water', ['Soda', 'Coffee', 'Energy shots'], 2, 'nutrition'),
    Q('The quadriceps are which muscles?', 'Thigh muscles', ['Arm muscles', 'Back muscles', 'Neck muscles'], 2, 'anatomy'),
    Q('A basketball free throw is worth how many points?', '1', ['2', '3', '4'], 2, 'sports'),
    Q('What does BMI estimate?', 'Body mass vs. height', ['Muscle strength', 'Running speed', 'Bone age'], 2, 'health'),
    Q('What is the first step when someone is injured?', 'Check the area is safe', ['Move them quickly', 'Give them food', 'Wait an hour'], 2, 'safety'),
    Q('Which exercise mainly improves flexibility?', 'Stretching', ['Sprinting', 'Weightlifting', 'Rowing'], 2, 'health'),
    Q('A normal adult resting heart rate is about?', '60 to 100 beats a minute', ['20 to 40 beats a minute', '120 to 150 beats a minute', '200 beats a minute'], 3, 'anatomy'),
    Q('Which vitamin do we get from sunlight?', 'Vitamin D', ['Vitamin A', 'Vitamin C', 'Vitamin K'], 3, 'nutrition'),
    Q('Which activity is aerobic?', 'Jogging steadily', ['A 100 m sprint', 'A heavy deadlift', 'A single jump'], 3, 'health'),
    Q('A \'cool down\' after exercise helps to?', 'Lower heart rate gradually', ['Build muscle faster', 'Burn more sugar', 'Skip stretching'], 3, 'health'),
    Q('Which event with many sports is held every 4 years?', 'The Olympic Games', ['The Super Bowl', 'The World Series', 'The Tour de France'], 3, 'sports'),
    Q('How many players per team are on court in volleyball?', '6', ['5', '7', '9'], 3, 'sports'),
  ],
};
