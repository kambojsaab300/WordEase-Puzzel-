import { getDailyQuiz, QUIZ_LENGTH, quizPool, weekdayOf } from '../src/game/quiz/dailyQuiz';
import { answerCoins, chestCoins, nextStreakGift, streakGift } from '../src/game/quiz/quizRewards';
import { useQuiz } from '../src/store/quiz';
import { useWallet } from '../src/store/wallet';

const dayKey = (offset: number) => {
  const d = new Date(Date.UTC(2026, 9, 1 + offset));
  return d.toISOString().slice(0, 10);
};

describe('daily quiz generator', () => {
  test('same date, same quiz; next day, a different one', () => {
    expect(getDailyQuiz('2026-10-27')).toEqual(getDailyQuiz('2026-10-27'));
    expect(getDailyQuiz('2026-10-28').questions).not.toEqual(getDailyQuiz('2026-10-27').questions);
  });

  test('one of each type, jumble last, answers in range, no repeated options', () => {
    for (let i = 0; i < 120; i++) {
      const quiz = getDailyQuiz(dayKey(i));
      expect(quiz.questions).toHaveLength(QUIZ_LENGTH);
      expect(new Set(quiz.questions.map(q => q.kind)).size).toBe(QUIZ_LENGTH);
      expect(quiz.questions[QUIZ_LENGTH - 1].kind).toBe('jumble');
      for (const q of quiz.questions) {
        if (q.kind === 'jumble') {
          expect([...q.tiles].sort().join('')).toBe([...q.word].sort().join(''));
          expect(q.tiles.join('')).not.toBe(q.word);
          continue;
        }
        expect(q.options).toHaveLength(4);
        expect(new Set(q.options).size).toBe(4);
        expect(q.answer).toBeGreaterThanOrEqual(0);
        expect(q.answer).toBeLessThan(4);
        if (q.kind === 'meaning') expect(q.prompt.toUpperCase()).not.toContain(q.word);
        if (q.kind === 'missing') {
          let k = 0;
          const right = q.options[q.answer];
          expect(q.prompt.replace(/_/g, () => right[k++])).toBe(q.word);
        }
        if (q.kind === 'where') expect(q.options[q.answer]).toBe(String(q.world));
      }
    }
  });

  test('words do not come back for weeks', () => {
    const seen = new Map<string, number>();
    let closest = Infinity;
    for (let i = 0; i < 50; i++) {
      for (const q of getDailyQuiz(dayKey(i)).questions) {
        if (q.kind === 'landmark') continue;
        if (seen.has(q.word)) closest = Math.min(closest, i - seen.get(q.word)!);
        seen.set(q.word, i);
      }
    }
    expect(closest).toBeGreaterThanOrEqual(30);
  });

  test('pool is large and Sunday is the big day', () => {
    expect(quizPool().length).toBeGreaterThan(300);
    expect(weekdayOf('2026-10-26')).toBe(0); // Monday
    expect(getDailyQuiz('2026-11-01').bigDay).toBe(true);
    expect(getDailyQuiz('2026-10-27').difficulty).toBe('easy');
  });
});

describe('quiz rewards', () => {
  test('combo pays more from the third in a row, Sunday doubles', () => {
    expect(answerCoins(true, 1, false)).toBe(20);
    expect(answerCoins(true, 3, false)).toBe(30);
    expect(answerCoins(true, 3, true)).toBe(60);
    expect(answerCoins(false, 0, false)).toBe(0);
  });

  test('chest is fixed for the day and streak gifts land on milestones', () => {
    expect(chestCoins('2026-10-27', 5)).toBe(chestCoins('2026-10-27', 5));
    expect(chestCoins('2026-10-27', 0)).toBe(5);
    expect([3, 7, 14, 30, 60].map(streakGift)).toEqual([50, 200, 400, 1000, 1000]);
    expect(streakGift(4)).toBe(0);
    expect(nextStreakGift(8)).toBe(14);
    expect(nextStreakGift(31)).toBe(60);
  });
});

describe('quiz store', () => {
  beforeEach(() => {
    useQuiz.getState().reset();
    useWallet.setState({ coins: 0 });
  });

  const playDay = (key: string, results: boolean[]) => {
    results.forEach((ok, i) => useQuiz.getState().answer(key, i, ok, false));
    return useQuiz.getState().finish(key, false);
  };

  test('a perfect day pays answers, combo and perfect bonus; a double tap pays once', () => {
    const key = '2026-10-27';
    useQuiz.getState().answer(key, 0, true, false);
    expect(useQuiz.getState().answer(key, 0, true, false)).toBeNull();
    [1, 2, 3, 4].forEach(i => useQuiz.getState().answer(key, i, true, false));
    const day = useQuiz.getState().finish(key, false);
    expect(day.perfectBonus).toBe(50);
    expect(useWallet.getState().coins).toBe(20 + 20 + 30 + 30 + 30 + 50);
    expect(useQuiz.getState().openChest(key)).toBe(day.chest);
    expect(useQuiz.getState().openChest(key)).toBe(0);
  });

  test('streak grows daily, one missed day a week is forgiven, two are not', () => {
    playDay('2026-10-26', [true, true, true, true, true]);
    playDay('2026-10-27', [false, false, false, false, false]);
    expect(useQuiz.getState().streak).toBe(2);
    expect(playDay('2026-10-29', [true, true, true, true, true]).streakSaved).toBe(true);
    expect(useQuiz.getState().streak).toBe(3);
    playDay('2026-11-01', [true, true, true, true, true]);
    expect(useQuiz.getState().streak).toBe(1);
    expect(useQuiz.getState().best).toBe(3);
  });

  test('an unfinished quiz cannot be finished early (negative)', () => {
    useQuiz.getState().answer('2026-10-27', 0, true, false);
    expect(useQuiz.getState().finish('2026-10-27', false).finished).toBe(false);
  });
});
