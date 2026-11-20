// The cast of Bellhaven Days: the single source of truth for WHO exists.
// OWNED BY THE LEAD. Content writers extend per-character behaviour in
// src/content/dialogue/<id>.js, src/content/events/*.js and src/content/schedules/*.js
// (never by editing this file). Full personalities live in docs/game/03_STORY_BIBLE.md.
//
// Fields
//   id        snake_case, unique, used everywhere (events, flags use it as a prefix)
//   kind      'player' | 'student' | 'teacher' | 'townsfolk' | 'animal'
//   yearOffset  school year relative to the player's year (0 = classmates' year, +2 = senior)
//   activeYears [fromYear, toYear] the character exists in the game world
//   home      map id where they sleep/idle in mornings & evenings, or null (lives off-map)
//   romanceable  true for the 5 love interests
//   appearance   see src/data/appearance.js (consumed by src/art)

import { validateAppearance } from './appearance.js';

// ---- outfit helpers (colours are hex) ----
const BLAZER = '#2f3f77';
const SLACKS = '#4b4f6e';
const SHOES = '#3a2c26';
const uniM = (tie) => ({ preset: 'uniform_m', colors: { top: BLAZER, bottom: SLACKS, accent: tie, shoes: SHOES } });
const uniF = (ribbon) => ({ preset: 'uniform_f', colors: { top: BLAZER, bottom: '#59507a', accent: ribbon, shoes: SHOES } });
const wear = (top, bottom, topC, bottomC, accent = '#ffffff', shoes = '#4a3a30') => ({
  top, bottom, colors: { top: topC, bottom: bottomC, accent, shoes },
});
const preset = (name, top, bottom, accent = '#ffffff', shoes = '#4a3a30') => ({
  preset: name, colors: { top, bottom, accent, shoes },
});

const DEFAULT_STUDENT_YEAR = { yearOffset: 0, activeYears: [1, 3] };

export const CAST = [
  // ======================= PLAYER =======================
  {
    id: 'theo', name: 'Theo Hartley', short: 'Theo', gender: 'm', kind: 'player',
    role: 'Transfer student, 16 at the start; turns 17 on Autumn 9.', home: 'home_theo',
    birthday: { season: 'autumn', day: 9 }, ...DEFAULT_STUDENT_YEAR, class: 'B',
    appearance: {
      skin: 'light', height: 0, build: 'normal', hair: { style: 'messy', color: 'chestnut' }, eyes: 'hazel',
      accessories: [],
      outfits: {
        school: uniM('#b8332f'),
        casual: wear('hoodie', 'pants', '#4f8a5b', '#8a7a5c', '#f2e8d0'),
        sport: preset('pe', '#4a78c4', '#2f3f77', '#ffffff'),
        swim: preset('swim', '#2a8fbd', '#2a8fbd'),
        work: preset('apron', '#f4efe2', '#4a4a58', '#8f5a3c'),
        sleep: preset('pajamas', '#8fb4d9', '#8fb4d9', '#ffffff', '#a58b7c'),
      },
    },
    voice: 'Friendly, a little dry. Quiet observer who warms up fast. Chooses between kind / honest / playful.',
  },

  // ======================= ROMANCE OPTIONS =======================
  {
    id: 'nina', name: 'Nina Calder', short: 'Nina', gender: 'f', kind: 'student', class: 'B', club: 'track',
    role: 'Track & Field captain. Delivers her family bakery\'s bread at dawn.', home: 'bakery', romanceable: true,
    birthday: { season: 'summer', day: 9 }, ...DEFAULT_STUDENT_YEAR,
    appearance: {
      skin: 'medium', height: 0, build: 'sturdy', hair: { style: 'ponytail', color: 'copper' }, eyes: 'brown',
      accessories: ['headband'],
      outfits: {
        school: uniF('#e0a030'),
        casual: wear('tank', 'shorts', '#e8742a', '#4a6a9a', '#ffffff', '#f2f2f2'),
        sport: preset('track', '#d63a3a', '#d63a3a', '#ffffff', '#f2f2f2'),
        swim: preset('swim', '#e8742a', '#e8742a'),
        work: preset('apron', '#f4efe2', '#6a5a4a', '#c97a3a'),
        sleep: preset('pajamas', '#f0a060', '#f0a060', '#ffffff'),
      },
    },
    voice: 'Loud, teasing, direct. Sports metaphors. Calls Theo "Newbie" until 4 hearts. Laughs with her whole face.',
  },
  {
    id: 'elise', name: 'Elise Whitmore', short: 'Elise', gender: 'f', kind: 'student', class: 'A', club: 'literature',
    role: 'Literature Club, library regular. Part-time at Larkin Books. Secretly writing a novel.', home: 'bookstore',
    romanceable: true, birthday: { season: 'winter', day: 3 }, ...DEFAULT_STUDENT_YEAR,
    appearance: {
      skin: 'fair', height: 0, build: 'slim', hair: { style: 'sidebraid', color: 'brown' }, eyes: 'gray',
      accessories: ['round_glasses'],
      outfits: {
        school: uniF('#7a9bd0'),
        casual: wear('cardigan', 'long_skirt', '#8fc4a8', '#efe4c8', '#ffffff', '#6a4a3a'),
        swim: preset('swim', '#6aa5d8', '#6aa5d8'),
        work: preset('apron', '#f4efe2', '#4a5a4a', '#4f8a5b'),
        sleep: preset('pajamas', '#c9b8e0', '#c9b8e0', '#ffffff'),
      },
    },
    voice: 'Soft, hesitant, ellipses. Precise vocabulary, quotes books. Fierce and fluent when talking about stories.',
  },
  {
    id: 'clara', name: 'Clara Voss', short: 'Clara', gender: 'f', kind: 'student', class: 'B', club: 'astronomy',
    role: 'Student council vice president, top of the grade. Theo\'s academic rival. Her mother chairs the school board.',
    home: null, romanceable: true, birthday: { season: 'autumn', day: 4 }, ...DEFAULT_STUDENT_YEAR,
    appearance: {
      skin: 'porcelain', height: 1, build: 'slim', hair: { style: 'long', color: 'ash' }, eyes: 'blue',
      accessories: ['hairclip'],
      outfits: {
        school: uniF('#2f6f4f'),
        casual: wear('blouse', 'skirt', '#f6f1ea', '#2f3f77', '#2f6f4f', '#3a2c26'),
        sport: preset('pe', '#ffffff', '#2f3f77', '#2f6f4f'),
        swim: preset('swim', '#2f5f9f', '#2f5f9f'),
        sleep: preset('pajamas', '#b8c8e8', '#b8c8e8', '#ffffff'),
      },
    },
    voice: 'Formal, composed, dry wit, avoids contractions. Calls Theo "Hartley" until 5 hearts. Blushes in silence.',
  },
  {
    id: 'mari', name: 'Marisol "Mari" Reyes', short: 'Mari', gender: 'f', kind: 'student', class: 'C', club: 'art',
    role: 'Art Club. Helps run her grandmother\'s flower shop. Always has paint on her somewhere.', home: 'flower_shop',
    romanceable: true, birthday: { season: 'spring', day: 18 }, ...DEFAULT_STUDENT_YEAR,
    appearance: {
      skin: 'brown', height: -1, build: 'normal', hair: { style: 'wavy', color: 'black' }, eyes: 'brown',
      accessories: ['headband', 'freckles'],
      outfits: {
        school: uniF('#e0508a'),
        casual: wear('tee', 'overalls', '#f2d04a', '#4a6a9a', '#e0508a', '#c0392b'),
        sport: preset('pe', '#e0508a', '#2f3f77', '#ffffff'),
        swim: preset('swim', '#f08aa8', '#f08aa8'),
        work: preset('apron', '#f4efe2', '#4a6a4a', '#d84a7a'),
        sleep: preset('pajamas', '#f2c0d8', '#f2c0d8', '#ffffff'),
      },
    },
    voice: 'Bubbly, rambling, art metaphors, jokes to dodge serious talk. Calls Theo "Teo". Spanish words slip out when moved.',
  },
  {
    id: 'vera', name: 'Vera Lindqvist', short: 'Vera', gender: 'f', kind: 'student', class: 'A', club: 'music',
    role: 'Music Club (practises alone). Skips class on the rooftop. Former child-prodigy pianist.', home: null,
    romanceable: true, birthday: { season: 'winter', day: 11 }, ...DEFAULT_STUDENT_YEAR,
    appearance: {
      skin: 'porcelain', height: 0, build: 'slim', hair: { style: 'bob', color: 'silver', highlight: 'blue' }, eyes: 'violet',
      accessories: ['headphones'],
      outfits: {
        school: uniF('#26305a'),
        casual: wear('hoodie', 'skirt', '#26262e', '#4a3a5a', '#7a6ad0', '#1e1e24'),
        sport: preset('pe', '#8a8aa8', '#26305a', '#ffffff'),
        swim: preset('swim', '#26305a', '#26305a'),
        sleep: preset('pajamas', '#5a5a78', '#5a5a78', '#ffffff'),
      },
    },
    voice: 'Deadpan, sarcastic, few words. Soft and unguarded only around cats or music. Calls Theo "new kid" until 3 hearts.',
  },

  // ======================= FRIENDS =======================
  {
    id: 'jules', name: 'Jules Park', short: 'Jules', gender: 'm', kind: 'student', class: 'B', club: 'soccer',
    role: 'Theo\'s first friend. Class clown, soccer, wants to be a sports journalist. Family runs a diner.',
    home: null, birthday: { season: 'spring', day: 10 }, ...DEFAULT_STUDENT_YEAR,
    appearance: {
      skin: 'light', height: 0, build: 'normal', hair: { style: 'spiky', color: 'black' }, eyes: 'black',
      accessories: [],
      outfits: {
        school: uniM('#3a8f5a'),
        casual: wear('jersey', 'shorts', '#3a8f5a', '#2f3f77', '#ffffff', '#f2f2f2'),
        sport: preset('soccer', '#3a8f5a', '#ffffff', '#ffffff', '#f2f2f2'),
        swim: preset('swim', '#e8742a', '#e8742a'),
      },
    },
    voice: 'Easygoing, jokes, nicknames ("Hartley-dude"). Gets earnest only when it matters.',
  },
  {
    id: 'dante', name: 'Dante Rossi', short: 'Dante', gender: 'm', kind: 'student', class: 'B', club: 'soccer',
    role: 'Soccer striker, proud rival-turned-friend. Secretly soft-hearted; has a crush on Nina.',
    home: null, birthday: { season: 'summer', day: 24 }, ...DEFAULT_STUDENT_YEAR,
    appearance: {
      skin: 'tan', height: 1, build: 'sturdy', hair: { style: 'sidepart', color: 'brown' }, eyes: 'green',
      accessories: [],
      outfits: {
        school: uniM('#c0392b'),
        casual: wear('jacket', 'pants', '#2a2a32', '#4a4a5a', '#c0392b', '#f2f2f2'),
        sport: preset('soccer', '#c0392b', '#ffffff', '#ffffff', '#f2f2f2'),
        swim: preset('swim', '#c0392b', '#c0392b'),
      },
    },
    voice: 'Boastful, competitive, theatrical. Turns gruff when embarrassed. Fiercely loyal.',
  },
  {
    id: 'owen', name: 'Owen Tran', short: 'Owen', gender: 'm', kind: 'student', class: 'B', club: 'astronomy',
    role: 'Astronomy Club tinkerer; builds gadgets, runs the Bell Restoration notes. Dry, deadpan inventor.',
    home: null, birthday: { season: 'autumn', day: 16 }, ...DEFAULT_STUDENT_YEAR,
    appearance: {
      skin: 'light', height: -1, build: 'slim', hair: { style: 'messy', color: 'navy' }, eyes: 'black',
      accessories: ['round_glasses'],
      outfits: {
        school: uniM('#2f6f9f'),
        casual: wear('sweater', 'pants', '#6a8fb5', '#4a4a5a', '#ffffff', '#3a3a44'),
        sport: preset('pe', '#6a8fb5', '#2f3f77', '#ffffff'),
        swim: preset('swim', '#4a78c4', '#4a78c4'),
      },
    },
    voice: 'Monotone, literal, precise numbers. Surprisingly funny. Says "statistically" a lot.',
  },
  {
    id: 'bruno', name: 'Bruno Kessler', short: 'Bruno', gender: 'm', kind: 'student', class: 'A', club: 'soccer',
    role: 'Third-year, soccer captain, the big-brother figure. Graduates at the end of Year 1.',
    home: null, birthday: { season: 'spring', day: 27 }, yearOffset: 2, activeYears: [1, 1],
    appearance: {
      skin: 'deep', height: 1, build: 'sturdy', hair: { style: 'buzz', color: 'black' }, eyes: 'brown',
      accessories: ['bandage'],
      outfits: {
        school: uniM('#e0a030'),
        casual: wear('tee', 'shorts', '#e0a030', '#2a2a32', '#ffffff', '#f2f2f2'),
        sport: preset('soccer', '#e0a030', '#2a2a32', '#ffffff', '#f2f2f2'),
        swim: preset('swim', '#e0a030', '#e0a030'),
      },
    },
    voice: 'Warm, steady, calls everyone "kid". Short wise sentences. Terrible at goodbyes.',
  },
  {
    id: 'kit', name: 'Kit Alvarez', short: 'Kit', gender: 'm', kind: 'student', class: 'B', club: 'track',
    role: 'First-year who looks up to Theo. Enthusiastic, clumsy. Appears from Year 2.',
    home: null, birthday: { season: 'summer', day: 3 }, yearOffset: -1, activeYears: [2, 3],
    appearance: {
      skin: 'medium', height: -1, build: 'slim', hair: { style: 'messy', color: 'ginger' }, eyes: 'amber',
      accessories: ['freckles'],
      outfits: {
        school: uniM('#c0392b'),
        casual: wear('hoodie', 'shorts', '#e8742a', '#4a6a9a', '#ffffff', '#f2f2f2'),
        sport: preset('track', '#2f3f77', '#2f3f77', '#ffffff', '#f2f2f2'),
        swim: preset('swim', '#e8742a', '#e8742a'),
      },
    },
    voice: 'Eager, chatty, calls Theo "Hartley-senpai" as a joke that became real. Trips over words.',
  },

  // ======================= TEACHERS & STAFF =======================
  {
    id: 'ms_delaney', name: 'Ms. Delaney', short: 'Ms. Delaney', gender: 'f', kind: 'teacher', subject: 'literature',
    role: 'Homeroom teacher (Class B), Literature, Literature Club advisor. Runs on coffee.', home: null,
    birthday: { season: 'autumn', day: 12 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'medium', height: 0, build: 'normal', hair: { style: 'bun', color: 'chestnut' }, eyes: 'brown',
      accessories: ['glasses'],
      outfits: {
        school: wear('cardigan', 'long_skirt', '#2f8a8a', '#4a4a58', '#ffffff', '#3a2c26'),
        casual: wear('sweater', 'long_skirt', '#c97a5a', '#4a4a58', '#ffffff', '#3a2c26'),
      },
    },
    voice: 'Warm, wry, a coffee joke in every class. Quietly sees through everyone.',
  },
  {
    id: 'mr_brandt', name: 'Mr. Brandt', short: 'Mr. Brandt', gender: 'm', kind: 'teacher', subject: 'math',
    role: 'Math teacher. Strict, mustache, secretly sentimental. Hates tardiness.', home: null,
    birthday: { season: 'spring', day: 20 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'fair', height: 1, build: 'normal', hair: { style: 'sidepart', color: 'gray' }, eyes: 'gray',
      accessories: ['mustache'],
      outfits: {
        school: preset('suit', '#6a5a4a', '#4a4046', '#b8332f', '#2a2024'),
        casual: wear('sweater', 'pants', '#7a6a5a', '#4a4046', '#ffffff', '#2a2024'),
      },
    },
    voice: 'Clipped, formal, deadpan. "Numbers do not care about your feelings." Softens over tea.',
  },
  {
    id: 'dr_fennel', name: 'Dr. Fennel', short: 'Dr. Fennel', gender: 'm', kind: 'teacher', subject: 'science',
    role: 'Science teacher, Astronomy Club advisor. Eccentric. Always "five minutes from a breakthrough".', home: null,
    birthday: { season: 'summer', day: 12 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'light', height: 0, build: 'slim', hair: { style: 'messy', color: 'white' }, eyes: 'blue',
      accessories: ['round_glasses'],
      outfits: {
        school: preset('labcoat', '#f4f4f4', '#4a4a58', '#2f6f9f', '#3a3a44'),
        casual: wear('sweater', 'pants', '#9a6a9a', '#4a4a58', '#ffffff', '#3a3a44'),
      },
    },
    voice: 'Excitable, tangents, enthusiastic metaphors about stars. "Fascinating!"',
  },
  {
    id: 'coach_mitchell', name: 'Coach Mitchell', short: 'Coach', gender: 'f', kind: 'teacher', subject: 'pe',
    role: 'P.E. teacher, Track & Field and Soccer coach. Loud, fair, whistle always on.', home: null,
    birthday: { season: 'winter', day: 6 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'tan', height: 1, build: 'sturdy', hair: { style: 'ponytail', color: 'black' }, eyes: 'brown',
      accessories: ['whistle', 'cap'],
      outfits: {
        school: preset('coach', '#c0392b', '#2a2a32', '#ffffff', '#f2f2f2'),
        casual: wear('jacket', 'pants', '#c0392b', '#2a2a32', '#ffffff', '#f2f2f2'),
      },
    },
    voice: 'Booming, motivational, ends sentences with "Move it!" Genuinely cares.',
  },
  {
    id: 'mr_abel', name: 'Mr. Abel', short: 'Mr. Abel', gender: 'm', kind: 'teacher', subject: 'history',
    role: 'History teacher. Tells history like gossip. Knows the bell\'s story.', home: null,
    birthday: { season: 'autumn', day: 2 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'brown', height: 0, build: 'normal', hair: { style: 'curly', color: 'black' }, eyes: 'brown',
      accessories: ['beard'],
      outfits: {
        school: wear('shirt', 'pants', '#a0522d', '#4a4046', '#ffffff', '#3a2c26'),
        casual: wear('sweater', 'pants', '#5a7a5a', '#4a4046', '#ffffff', '#3a2c26'),
      },
    },
    voice: 'Theatrical storyteller, "And THEN..." Ends lessons on cliffhangers.',
  },
  {
    id: 'mr_quill', name: 'Mr. Quill', short: 'Mr. Quill', gender: 'm', kind: 'teacher', subject: 'art',
    role: 'Art & Music teacher, advisor of the Art and Music clubs. Gentle, absent-minded.', home: null,
    birthday: { season: 'spring', day: 8 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'light', height: 1, build: 'slim', hair: { style: 'long', color: 'brown' }, eyes: 'green',
      accessories: ['scarf'],
      outfits: {
        school: wear('cardigan', 'pants', '#b0805a', '#5a5a6a', '#d0a040', '#3a2c26'),
        casual: wear('sweater', 'pants', '#6a9a8a', '#5a5a6a', '#ffffff', '#3a2c26'),
      },
    },
    voice: 'Soft, dreamy, loses his train of thought mid-sentence. Praise is rare and means everything.',
  },
  {
    id: 'principal_marsh', name: 'Principal Marsh', short: 'Principal', gender: 'f', kind: 'teacher', subject: null,
    role: 'Principal Evelyn Marsh. Gentle, sharp, carrying the school\'s survival on her shoulders.', home: null,
    birthday: { season: 'winter', day: 23 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'light', height: 0, build: 'normal', hair: { style: 'bun', color: 'silver' }, eyes: 'gray',
      accessories: ['glasses'],
      outfits: {
        school: preset('suit', '#6a4a7a', '#4a3a5a', '#e8d8f0', '#2a2024'),
        casual: wear('cardigan', 'long_skirt', '#7a8aaa', '#4a4a58', '#ffffff', '#3a2c26'),
      },
    },
    voice: 'Calm, measured, kind. Speaks in gentle proverbs. Never raises her voice; never needs to.',
  },
  {
    id: 'nurse_hale', name: 'Nurse Hale', short: 'Nurse Hale', gender: 'f', kind: 'teacher', subject: null,
    role: 'School nurse. Dispenses tea, bandages and blunt advice.', home: null,
    birthday: { season: 'summer', day: 22 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'fair', height: 0, build: 'normal', hair: { style: 'bob', color: 'ginger' }, eyes: 'green',
      accessories: [],
      outfits: {
        school: preset('labcoat', '#f4f4f4', '#6a8a9a', '#c0392b', '#f2f2f2'),
        casual: wear('blouse', 'skirt', '#9ac0a8', '#5a5a6a', '#ffffff', '#3a2c26'),
      },
    },
    voice: 'Brisk, motherly, blunt. "Sit. Drink. Tell me what hurts."',
  },

  // ======================= TOWNSFOLK =======================
  {
    id: 'roz', name: 'Aunt Roz', short: 'Aunt Roz', gender: 'f', kind: 'townsfolk',
    role: 'Rosalind Hartley, Theo\'s aunt. Owns The Lantern Cafe; Theo lives above it.', home: 'home_theo',
    birthday: { season: 'summer', day: 14 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'light', height: 0, build: 'normal', hair: { style: 'curly', color: 'copper' }, eyes: 'hazel',
      accessories: ['headband'],
      outfits: {
        school: preset('apron', '#f4efe2', '#5a4a6a', '#c97a3a', '#3a2c26'),
        casual: wear('sweater', 'pants', '#c97a5a', '#5a4a6a', '#ffffff', '#3a2c26'),
        work: preset('apron', '#f4efe2', '#5a4a6a', '#c97a3a', '#3a2c26'),
        sleep: preset('pajamas', '#d8a0c0', '#d8a0c0', '#ffffff'),
      },
    },
    voice: 'Big-hearted, teasing, food = love. Puns. Worries and hides it behind jokes.',
  },
  {
    id: 'mr_finch', name: 'Mr. Finch', short: 'Mr. Finch', gender: 'm', kind: 'townsfolk',
    role: 'Retired clock mender and the school\'s last bell-keeper. Gruff. Sits by the harbor.', home: null,
    birthday: { season: 'winter', day: 9 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'light', height: 0, build: 'slim', hair: { style: 'bald', color: 'white' }, eyes: 'gray',
      accessories: ['beard', 'cap'],
      outfits: {
        school: wear('shirt', 'pants', '#8a7a5a', '#4a4a44', '#ffffff', '#2a2420'),
        casual: wear('cardigan', 'pants', '#6a7a5a', '#4a4a44', '#ffffff', '#2a2420'),
      },
    },
    voice: 'Grumbly, short sentences, hides a tender heart. Speaks about the bell like an old friend.',
  },
  {
    id: 'mrs_calder', name: 'Mrs. Calder', short: 'Mrs. Calder', gender: 'f', kind: 'townsfolk',
    role: 'Owner of Calder Bakery, Nina\'s mother. Feeds everyone.', home: 'bakery',
    birthday: { season: 'spring', day: 3 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'medium', height: 0, build: 'sturdy', hair: { style: 'bun', color: 'copper' }, eyes: 'brown',
      accessories: [],
      outfits: {
        school: preset('apron', '#f4efe2', '#6a5a4a', '#c97a3a', '#3a2c26'),
        casual: wear('blouse', 'long_skirt', '#d8a060', '#6a5a4a', '#ffffff', '#3a2c26'),
      },
    },
    voice: 'Bustling, affectionate, "have a roll, dear". Proud of Nina and terrified of her injury.',
  },
  {
    id: 'rosa', name: 'Grandma Rosa', short: 'Grandma Rosa', gender: 'f', kind: 'townsfolk',
    role: 'Rosa Reyes, flower shop owner, Mari\'s grandmother. Frail knees, iron will.', home: 'flower_shop',
    birthday: { season: 'autumn', day: 21 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'brown', height: -1, build: 'normal', hair: { style: 'bun', color: 'white' }, eyes: 'brown',
      accessories: [],
      outfits: {
        school: preset('apron', '#f4efe2', '#6a4a5a', '#d84a7a', '#3a2c26'),
        casual: wear('cardigan', 'long_skirt', '#b05a7a', '#6a4a5a', '#ffffff', '#3a2c26'),
      },
    },
    voice: 'Warm, proverbs mixed with Spanish endearments ("mija"). Stubborn about not needing help.',
  },
  {
    id: 'mr_larkin', name: 'Mr. Larkin', short: 'Mr. Larkin', gender: 'm', kind: 'townsfolk',
    role: 'Owner of Larkin Books, Elise\'s great-uncle and employer. Quiet bibliophile.', home: 'bookstore',
    birthday: { season: 'spring', day: 24 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'fair', height: 0, build: 'slim', hair: { style: 'sidepart', color: 'gray' }, eyes: 'gray',
      accessories: ['glasses'],
      outfits: {
        school: wear('sweater', 'pants', '#7a6a4a', '#4a4a44', '#ffffff', '#2a2420'),
        casual: wear('cardigan', 'pants', '#6a6a8a', '#4a4a44', '#ffffff', '#2a2420'),
      },
    },
    voice: 'Hushed, gentle, recommends the exact book you needed. Never hurries a customer.',
  },
  {
    id: 'tomas', name: 'Tomas', short: 'Tomas', gender: 'm', kind: 'townsfolk',
    role: 'Corner Mart night clerk and university student. Sleepy, deadpan, secretly kind.', home: null,
    birthday: { season: 'summer', day: 6 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'tan', height: 1, build: 'slim', hair: { style: 'messy', color: 'blonde' }, eyes: 'hazel',
      accessories: [],
      outfits: {
        school: preset('apron', '#3a8f5a', '#4a4a58', '#ffffff', '#2a2420'),
        casual: wear('hoodie', 'pants', '#7a7a8a', '#4a4a58', '#ffffff', '#2a2420'),
      },
    },
    voice: 'Yawning, flat, drops real wisdom between sighs. "Cash or card. Or a story."',
  },
  {
    id: 'dr_patel', name: 'Dr. Patel', short: 'Dr. Patel', gender: 'f', kind: 'townsfolk',
    role: 'Anika Patel, runs the town clinic. Calm, patient, dry humour.', home: 'clinic',
    birthday: { season: 'autumn', day: 8 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'brown', height: 0, build: 'normal', hair: { style: 'braid', color: 'black' }, eyes: 'brown',
      accessories: [],
      outfits: {
        school: preset('labcoat', '#f4f4f4', '#5a6a8a', '#2f8a8a', '#3a2c26'),
        casual: wear('blouse', 'pants', '#e0a050', '#5a6a8a', '#ffffff', '#3a2c26'),
      },
    },
    voice: 'Measured, reassuring, a doctor\'s deadpan. "You are not dying. You are tired."',
  },
  {
    id: 'mayor_greer', name: 'Mayor Greer', short: 'Mayor Greer', gender: 'm', kind: 'townsfolk',
    role: 'Mayor of Bellhaven. Cheerful, overcommitted, loves a ribbon-cutting.', home: null,
    birthday: { season: 'spring', day: 12 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'medium', height: 0, build: 'sturdy', hair: { style: 'sidepart', color: 'gray' }, eyes: 'brown',
      accessories: ['mustache'],
      outfits: {
        school: preset('formal', '#3a3a6a', '#3a3a6a', '#d8b040', '#2a2024'),
        casual: wear('shirt', 'pants', '#6a9ac0', '#5a5a6a', '#ffffff', '#3a2c26'),
      },
    },
    voice: 'Booming politician-cheer, "Wonderful, wonderful!" Genuinely loves the town; bad at hard news.',
  },
  {
    id: 'm_voss', name: 'Mrs. Voss', short: 'Mrs. Voss', gender: 'f', kind: 'townsfolk',
    role: 'Margaret Voss, chair of the school board, Clara\'s mother. Efficient, exacting, not a villain.', home: null,
    birthday: { season: 'winter', day: 4 }, yearOffset: 0, activeYears: [1, 3],
    appearance: {
      skin: 'porcelain', height: 1, build: 'slim', hair: { style: 'bun', color: 'ash' }, eyes: 'blue',
      accessories: [],
      outfits: {
        school: preset('formal', '#2f6f4f', '#2f6f4f', '#e8e0c8', '#2a2024'),
        casual: wear('blouse', 'long_skirt', '#e8e0d0', '#2f4f3f', '#ffffff', '#2a2024'),
      },
    },
    voice: 'Crisp, courteous, never wasteful with words. Believes numbers equal love. Cracks only in private.',
  },

  // ======================= ANIMALS =======================
  {
    id: 'biscuit', name: 'Biscuit', short: 'Biscuit', gender: 'x', kind: 'animal',
    role: 'The rooftop cat. Belongs to nobody, adores everybody who brings snacks.', home: 'school_rooftop',
    birthday: { season: 'spring', day: 1 }, yearOffset: 0, activeYears: [1, 3],
    appearance: { animal: 'cat', fur: 'orange_tabby' },
    voice: 'Meows, purrs, ignores you. (Dialogue = narration of cat behaviour.)',
  },
];

// ---- Seeded background characters. Art: appearanceFromSeed(seed, kind) ----
// Students fill classrooms/corridors; townies fill streets. They have no stories, only
// generic one-liners (src/content/dialogue/_extras.js).
export const EXTRAS = [
  ...Array.from({ length: 14 }, (_, i) => ({
    id: `student_${String(i + 1).padStart(2, '0')}`, kind: 'extra', extraKind: i % 2 ? 'student_f' : 'student_m',
    seed: 1000 + i, name: i % 2 ? 'Student' : 'Student',
  })),
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `townie_${String(i + 1).padStart(2, '0')}`, kind: 'extra',
    extraKind: ['adult_m', 'adult_f', 'elder_m', 'elder_f', 'adult_f', 'adult_m', 'child', 'child'][i],
    seed: 2000 + i, name: ['Fisherman', 'Shopper', 'Old Man', 'Old Woman', 'Jogger', 'Commuter', 'Kid', 'Kid'][i],
  })),
];

// ---- Lookups ----
export const CAST_BY_ID = Object.fromEntries(CAST.map((c) => [c.id, c]));
export const EXTRAS_BY_ID = Object.fromEntries(EXTRAS.map((c) => [c.id, c]));
export const ROMANCE_IDS = CAST.filter((c) => c.romanceable).map((c) => c.id); // nina elise clara mari vera
export const FRIEND_IDS = ['jules', 'dante', 'owen', 'bruno', 'kit'];
export const TEACHER_IDS = CAST.filter((c) => c.kind === 'teacher').map((c) => c.id);
export const NPC_IDS = CAST.filter((c) => c.kind !== 'player').map((c) => c.id);
export const isNpc = (id) => id in CAST_BY_ID && id !== 'theo';
export const isCharacter = (id) => id in CAST_BY_ID || id in EXTRAS_BY_ID;
export const getNpc = (id) => CAST_BY_ID[id] || EXTRAS_BY_ID[id] || null;

/** Structural self-check, used by test/contracts.test.mjs. Returns an array of problems. */
export function validateCast() {
  const errs = [];
  const seen = new Set();
  for (const c of CAST) {
    if (seen.has(c.id)) errs.push(`duplicate id ${c.id}`);
    seen.add(c.id);
    if (!c.name || !c.kind || !c.role) errs.push(`${c.id}: missing name/kind/role`);
    if (!c.birthday || !c.birthday.season || !c.birthday.day) errs.push(`${c.id}: missing birthday`);
    errs.push(...validateAppearance(c.appearance, `${c.id}.appearance`));
  }
  return errs;
}
