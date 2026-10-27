// Daily Word Quiz: made on the phone from the game's own words, landmarks and meanings.
// The date is the seed, so every phone gets the same 5 questions that day and a new set tomorrow.
import { LANDMARK_PLAN } from '../../map/landmarkPlan';
import { daysBetween } from '../../store/daily';
import { mulberry32, randInt, Rng, shuffle } from '../generator/prng';
import { hashString } from '../levels/dailyLevel';
import { meaningOf } from '../levels/levelRepo';
import { THEMES_BY_WORLD } from '../levels/themes';

export type ChoiceKind = 'meaning' | 'missing' | 'landmark' | 'where';

export type ChoiceQuestion = {
  kind: ChoiceKind;
  /** Puzzle word taught after the answer; a landmark key for 'landmark' */
  word: string;
  /** World the word or landmark belongs to (colours and the "did you know" card) */
  world: number;
  /** Meaning clue for 'meaning', the gapped word ('P_STA') for 'missing'; '' otherwise */
  prompt: string;
  /** Words, missing letters, landmark keys or world ids (as text) */
  options: string[];
  answer: number;
};

export type JumbleQuestion = { kind: 'jumble'; word: string; world: number; tiles: string[] };

export type QuizQuestion = ChoiceQuestion | JumbleQuestion;

export type Difficulty = 'easy' | 'medium' | 'hard';

export type DailyQuiz = {
  dateKey: string;
  /** Running quiz number shown to players and in the share text */
  number: number;
  difficulty: Difficulty;
  /** Sunday: a harder quiz that pays double */
  bigDay: boolean;
  questions: QuizQuestion[];
};

export const QUIZ_LENGTH = 5;
const QUIZ_EPOCH = '2026-10-01';
const OPTION_COUNT = 4;
const WORDS_PER_DAY = 12;
const MISSING_MARK = '_';
// Wrong letters look like the right one (vowel for vowel), so the gap needs real thought
const VOWELS = 'AEIOU';
const CONSONANTS = 'RSTLNCDMPBGHFWK';

// Mon-Tue easy, Wed-Thu medium, Fri-Sun hard (the week builds up to the Sunday quiz)
const DIFFICULTY_BY_WEEKDAY: Difficulty[] = ['easy', 'easy', 'medium', 'medium', 'hard', 'hard', 'hard'];
const JUMBLE_LENGTH: Record<Difficulty, [number, number]> = { easy: [4, 5], medium: [5, 6], hard: [6, 8] };
const MISSING_LETTERS: Record<Difficulty, number> = { easy: 1, medium: 1, hard: 2 };

type PoolWord = { word: string; worlds: number[] };

let poolCache: PoolWord[] | null = null;

// A clue that spells out the answer would give it away
function meaningGivesAway(word: string, meaning: string): boolean {
  const text = meaning.toUpperCase();
  const stem = word.length > 4 ? word.slice(0, -1) : word;
  return text.includes(stem);
}

/** Every theme word with a usable meaning, with the worlds it appears in */
export function quizPool(): PoolWord[] {
  if (poolCache) return poolCache;
  const worldsOf = new Map<string, Set<number>>();
  THEMES_BY_WORLD.forEach((themes, i) => {
    for (const theme of themes) {
      for (const word of theme.words) {
        if (!worldsOf.has(word)) worldsOf.set(word, new Set());
        worldsOf.get(word)!.add(i + 1);
      }
    }
  });
  poolCache = [...worldsOf.entries()]
    .filter(([word]) => word.length >= 3 && word.length <= 9)
    .filter(([word]) => {
      const meaning = meaningOf(word);
      return Boolean(meaning) && !meaningGivesAway(word, meaning!);
    })
    .map(([word, worlds]) => ({ word, worlds: [...worlds].sort((a, b) => a - b) }))
    .sort((a, b) => (a.word < b.word ? -1 : 1));
  return poolCache;
}

const LANDMARKS: { key: string; world: number }[] = Object.entries(LANDMARK_PLAN)
  .filter(([world]) => Number(world) > 1) // Home Town sights are generic, not real places
  .flatMap(([world, keys]) => keys.map(key => ({ key, world: Number(world) })));

export function quizNumber(dateKey: string): number {
  return Math.max(1, daysBetween(QUIZ_EPOCH, dateKey) + 1);
}

/** 0 = Monday ... 6 = Sunday */
export function weekdayOf(dateKey: string): number {
  return (((daysBetween('1970-01-01', dateKey) + 3) % 7) + 7) % 7;
}

// Days walk through a shuffled word list 12 at a time, so a word only comes back
// after the whole list is used (about two months); each lap is shuffled again.
function wordsForDay(day: number): PoolWord[] {
  const pool = quizPool();
  const laps = Math.floor(pool.length / WORDS_PER_DAY);
  const lap = Math.floor(day / laps);
  const order = shuffle(mulberry32(hashString(`quiz-lap-${lap}`)), pool);
  const start = (((day % laps) + laps) % laps) * WORDS_PER_DAY;
  return order.slice(start, start + WORDS_PER_DAY);
}

function landmarkForDay(day: number): { key: string; world: number } {
  const lap = Math.floor(day / LANDMARKS.length);
  const order = shuffle(mulberry32(hashString(`quiz-sights-${lap}`)), LANDMARKS);
  return order[((day % LANDMARKS.length) + LANDMARKS.length) % LANDMARKS.length];
}

// Takes the first unused word of the day's list that fits, else any fitting word
function take(rng: Rng, today: PoolWord[], used: Set<string>, fits: (w: PoolWord) => boolean): PoolWord {
  const pick = today.find(w => !used.has(w.word) && fits(w)) ?? shuffle(rng, quizPool()).find(w => !used.has(w.word) && fits(w))!;
  used.add(pick.word);
  return pick;
}

// Puts the right answer among the wrong ones at a random place
function withAnswer(rng: Rng, right: string, wrong: string[]): { options: string[]; answer: number } {
  const options = shuffle(rng, [right, ...wrong.slice(0, OPTION_COUNT - 1)]);
  return { options, answer: options.indexOf(right) };
}

function meaningQuestion(rng: Rng, w: PoolWord): ChoiceQuestion {
  const near = quizPool().filter(o => o.word !== w.word && Math.abs(o.word.length - w.word.length) <= 1);
  const wrong = shuffle(rng, near).map(o => o.word);
  return { kind: 'meaning', word: w.word, world: w.worlds[0], prompt: meaningOf(w.word)!, ...withAnswer(rng, w.word, wrong) };
}

function missingQuestion(rng: Rng, w: PoolWord, gaps: number): ChoiceQuestion {
  const letters = [...w.word];
  // Gaps never sit on the first letter, so the word stays recognisable
  const spots = shuffle(rng, letters.map((_, i) => i).slice(1))
    .slice(0, gaps)
    .sort((a, b) => a - b);
  const right = spots.map(i => letters[i]).join('');
  const prompt = letters.map((ch, i) => (spots.includes(i) ? MISSING_MARK : ch)).join('');

  // Wrong fills must not make another word from the game
  const known = new Set(quizPool().map(p => p.word));
  const wrong = new Set<string>();
  const lookalike = (ch: string) => {
    const set = VOWELS.includes(ch) ? VOWELS : CONSONANTS;
    return set[randInt(rng, set.length)];
  };
  for (let tries = 0; wrong.size < OPTION_COUNT - 1; tries++) {
    // After many tries (a short vowel-only gap) any letter will do
    const fill = [...right].map(ch => (tries < 50 ? lookalike(ch) : String.fromCharCode(65 + randInt(rng, 26)))).join('');
    let k = 0;
    const made = prompt.replace(/_/g, () => fill[k++]);
    if (fill !== right && !known.has(made)) wrong.add(fill);
  }
  return { kind: 'missing', word: w.word, world: w.worlds[0], prompt, ...withAnswer(rng, right, [...wrong]) };
}

function whereQuestion(rng: Rng, w: PoolWord): ChoiceQuestion {
  const world = w.worlds[0];
  const others = shuffle(rng, THEMES_BY_WORLD.map((_, i) => i + 1).filter(id => id !== 1 && id !== world));
  return { kind: 'where', word: w.word, world, prompt: '', ...withAnswer(rng, String(world), others.map(String)) };
}

function landmarkQuestion(rng: Rng, day: number): ChoiceQuestion {
  const sight = landmarkForDay(day);
  const wrong = shuffle(rng, LANDMARKS.filter(l => l.world !== sight.world)).map(l => l.key);
  return { kind: 'landmark', word: sight.key, world: sight.world, prompt: '', ...withAnswer(rng, sight.key, wrong) };
}

function jumbleQuestion(rng: Rng, w: PoolWord): JumbleQuestion {
  let tiles = shuffle(rng, [...w.word]);
  // A shuffle that lands back on the word is no puzzle
  for (let tries = 0; tiles.join('') === w.word && tries < 10; tries++) tiles = shuffle(rng, [...w.word]);
  return { kind: 'jumble', word: w.word, world: w.worlds[0], tiles };
}

/** The quiz for a date (YYYY-MM-DD): one of each question type, the word jumble last */
export function getDailyQuiz(dateKey: string): DailyQuiz {
  const day = daysBetween(QUIZ_EPOCH, dateKey);
  const rng = mulberry32(hashString(`quiz-${dateKey}`));
  const weekday = weekdayOf(dateKey);
  const difficulty = DIFFICULTY_BY_WEEKDAY[weekday];
  const today = wordsForDay(day);
  const used = new Set<string>();
  const [minJumble, maxJumble] = JUMBLE_LENGTH[difficulty];
  const gaps = MISSING_LETTERS[difficulty];

  const kinds = shuffle(rng, ['meaning', 'missing', 'where', 'landmark'] as const);
  const questions: QuizQuestion[] = kinds.map(kind => {
    switch (kind) {
      case 'meaning':
        return meaningQuestion(rng, take(rng, today, used, () => true));
      case 'missing':
        return missingQuestion(rng, take(rng, today, used, w => w.word.length >= 4 + gaps), gaps);
      case 'where':
        // Only words that belong to a single real place have one right answer
        return whereQuestion(rng, take(rng, today, used, w => w.worlds.length === 1 && w.worlds[0] !== 1));
      case 'landmark':
        return landmarkQuestion(rng, day);
    }
  });
  const jumbleWord = take(rng, today, used, w => w.word.length >= minJumble && w.word.length <= maxJumble);
  questions.push(jumbleQuestion(rng, jumbleWord));

  return { dateKey, number: quizNumber(dateKey), difficulty, bigDay: weekday === 6, questions };
}
