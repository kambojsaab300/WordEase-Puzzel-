import { useEffect, useRef, useState } from 'react';
import { isStuck, shouldOfferNudge } from '../../game/engine/nudge';

const CHECK_EVERY_MS = 5000;

type Options = {
  /** Active play time so far (usePlayRecord) */
  elapsedMs: () => number;
  active: boolean;
  foundCount: number;
  quits: number;
  used: boolean;
  wordsLeft: number;
};

/** True while the free Spotlight should be offered (rules in engine/nudge.ts). */
export function useNudgeOffer({ elapsedMs, active, foundCount, quits, used, wordsLeft }: Options): boolean {
  const lastWordAt = useRef(0);
  const [foundAtOpen] = useState(foundCount);
  const [stuck, setStuck] = useState(false);

  // Every new word restarts the minute
  useEffect(() => {
    lastWordAt.current = elapsedMs();
    setStuck(false);
  }, [foundCount, elapsedMs]);

  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => {
      if (isStuck(elapsedMs() - lastWordAt.current)) setStuck(true);
    }, CHECK_EVERY_MS);
    return () => clearInterval(timer);
  }, [active, elapsedMs]);

  return shouldOfferNudge({ stuck, quits, foundSinceOpen: foundCount - foundAtOpen, used, wordsLeft });
}
