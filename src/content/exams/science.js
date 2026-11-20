// Exam question bank: Science. Tier 1 = Year 1 (easiest) ... tier 3 = Year 3. 18 questions, 6 per tier.
// Q(question, right, [wrong x3], tier, topic): the correct answer is placed at a rotating position (so position never gives it away).
let n = 0;
const Q = (q, right, wrong, tier, topic) => {
  const pos = [1, 3, 0, 2][n++ % 4];
  const a = wrong.slice();
  a.splice(pos, 0, right);
  return { q, a, correct: pos, tier, topic };
};

export default {
  subject: 'science',
  questions: [
    Q('What gas do plants take in for photosynthesis?', 'Carbon dioxide', ['Oxygen', 'Nitrogen', 'Hydrogen'], 1, 'biology'),
    Q('Which planet is closest to the Sun?', 'Mercury', ['Venus', 'Earth', 'Mars'], 1, 'astronomy'),
    Q('Water freezes at how many degrees Celsius?', '0', ['10', '32', '100'], 1, 'chemistry'),
    Q('What is the largest organ of the human body?', 'Skin', ['Liver', 'Heart', 'Lungs'], 1, 'biology'),
    Q('Which of these is a mammal?', 'Dolphin', ['Shark', 'Trout', 'Octopus'], 1, 'biology'),
    Q('What force pulls objects toward the Earth?', 'Gravity', ['Friction', 'Magnetism', 'Inertia'], 1, 'physics'),
    Q('What is the chemical formula of water?', 'H2O', ['CO2', 'O2', 'HO'], 2, 'chemistry'),
    Q('What part of the cell holds its DNA?', 'Nucleus', ['Membrane', 'Cytoplasm', 'Vacuole'], 2, 'biology'),
    Q('How many planets orbit our Sun?', '8', ['7', '9', '10'], 2, 'astronomy'),
    Q('Sound travels fastest through which of these?', 'Solids', ['Gases', 'Vacuum', 'Air'], 2, 'physics'),
    Q('Animals that eat only plants are called?', 'Herbivores', ['Carnivores', 'Omnivores', 'Predators'], 2, 'biology'),
    Q('Which layer of the Earth do we live on?', 'Crust', ['Mantle', 'Outer core', 'Inner core'], 2, 'earth science'),
    Q('What is the pH of pure water?', '7', ['0', '5', '14'], 3, 'chemistry'),
    Q('What is the unit of electrical resistance?', 'Ohm', ['Volt', 'Watt', 'Ampere'], 3, 'physics'),
    Q('Which organelle makes most of a cell\'s energy?', 'Mitochondria', ['Ribosome', 'Golgi body', 'Lysosome'], 3, 'biology'),
    Q('Light travels at roughly how fast?', '300,000 km per second', ['300 km per second', '30,000 km per second', '3,000,000 km per second'], 3, 'physics'),
    Q('In which part of a star does fusion happen?', 'Its core', ['Its surface', 'Its corona', 'Its halo'], 3, 'astronomy'),
    Q('What does DNA stand for?', 'Deoxyribonucleic acid', ['Dinitric acid', 'Dual nucleic atom', 'Dense natural acid'], 3, 'biology'),
  ],
};
