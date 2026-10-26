import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HINT_COST, HintKind, HintMark, pickHintWord } from '../../game/engine/hints';
import { BONUS_WORD_COINS } from '../../game/engine/rewards';
import { matchSelection } from '../../game/engine/validate';
import { sanitizeSaved } from '../../game/engine/restore';
import { DAILY_LEVEL_ID, getLevel } from '../../game/levels/levelRepo';
import { fitGridSize } from '../../game/levels/textSizeVariant';
import type { FoundWord } from '../../game/render/GridCanvas';
import { Cell, PlacedWord } from '../../game/types';
import { getTodayKey, useDaily } from '../../store/daily';
import { useProgress } from '../../store/progress';
import { useWallet } from '../../store/wallet';
import { HUGE_MAX_GRID, TextSizeIndex } from '../../ui/a11y';
import { colors } from '../../ui/theme';

export type SelectResult =
  | { kind: 'word'; word: string }
  | { kind: 'bonus'; word: string }
  | { kind: 'miss' }
  | { kind: 'none' };

export type HintResult = 'ok' | 'no-coins' | 'none-left';

export function useLevelGame(levelId: number, textSize: TextSizeIndex = 0) {
  const isDaily = levelId === DAILY_LEVEL_ID;
  // The Daily puzzle is fixed to the day it was opened, even across midnight
  const dayKey = useMemo(() => getTodayKey(), []);
  // Huge text never shows more than a 10x10 grid
  const level = useMemo(() => {
    const full = getLevel(levelId);
    return textSize === 2 ? fitGridSize(full, HUGE_MAX_GRID) : full;
  }, [levelId, textSize]);

  // Resume where the player left off, keeping only what fits this exact puzzle
  const saved = useMemo(() => {
    if (isDaily) {
      const daily = useDaily.getState().inProgress;
      return sanitizeSaved(level, daily?.dayKey === dayKey ? daily : null);
    }
    const inProgress = useProgress.getState().inProgress;
    return sanitizeSaved(level, inProgress?.levelId === levelId ? inProgress : null);
  }, [isDaily, dayKey, level, levelId]);

  const [found, setFound] = useState<string[]>(saved.found);
  const [bonusFound, setBonusFound] = useState<string[]>(saved.bonusFound);
  const [hints, setHints] = useState<HintMark[]>(saved.hints);
  const completed = useRef(false);
  // Ref so two quick selections of the same bonus word cannot pay twice
  const bonusPaid = useRef(new Set(saved.bonusFound));

  const byWord = useMemo(() => new Map(level.words.map(pw => [pw.w, pw])), [level.words]);
  const foundSet = useMemo(() => new Set(found), [found]);
  const bonusSet = useMemo(() => new Set(level.bonus), [level.bonus]);
  const allFound = level.words.every(pw => foundSet.has(pw.w));

  // A fast double selection must never count one word twice
  const addFound = useCallback(
    (word: string) => setFound(prev => (prev.includes(word) ? prev : [...prev, word])),
    [],
  );

  const foundWords: FoundWord[] = useMemo(
    () =>
      found.map((w, i) => ({
        word: byWord.get(w) as PlacedWord,
        color: colors.found[i % colors.found.length],
      })),
    [found, byWord],
  );

  // Save after every change so closing the app never loses progress
  useEffect(() => {
    if (completed.current) return;
    const state = { levelId, found, bonusFound, hints };
    if (isDaily) useDaily.getState().saveInProgress({ ...state, dayKey });
    else useProgress.getState().saveInProgress(state);
  }, [isDaily, dayKey, levelId, found, bonusFound, hints]);

  const select = useCallback(
    (cells: Cell[]): SelectResult => {
      if (cells.length < 2) return { kind: 'none' };
      const match = matchSelection(cells, level.words, foundSet);
      if (match) {
        addFound(match.w);
        return { kind: 'word', word: match.w };
      }
      const letters = cells.map(([r, c]) => level.grid[r]?.[c] ?? '').join('');
      const reversed = [...letters].reverse().join('');
      const bonus = [letters, reversed].find(w => bonusSet.has(w) && !bonusPaid.current.has(w));
      if (bonus) {
        bonusPaid.current.add(bonus);
        setBonusFound(prev => [...prev, bonus]);
        useWallet.getState().add(BONUS_WORD_COINS);
        return { kind: 'bonus', word: bonus };
      }
      return { kind: 'miss' };
    },
    [level, foundSet, bonusSet, addFound],
  );

  const buyHint = useCallback(
    (kind: HintKind): HintResult => {
      const target = pickHintWord(level.words, foundSet, hints);
      if (!target) return 'none-left';
      if (!useWallet.getState().spend(HINT_COST[kind])) return 'no-coins';
      setHints(prev => [...prev, { word: target.w, kind }]);
      if (kind === 'reveal') addFound(target.w);
      return 'ok';
    },
    [level.words, foundSet, hints, addFound],
  );

  // Pause menu "Restart": clear found words and hints. Coins already spent stay spent,
  // and bonus words already paid are not paid again.
  const restart = useCallback(() => {
    setFound([]);
    setHints([]);
  }, []);

  const markCompleted = useCallback(() => {
    completed.current = true;
  }, []);

  return {
    level,
    isDaily,
    dayKey,
    found,
    foundWords,
    bonusFound,
    hints,
    allFound,
    hintTarget: pickHintWord(level.words, foundSet, hints),
    select,
    buyHint,
    restart,
    markCompleted,
  };
}
