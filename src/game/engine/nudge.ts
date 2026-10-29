// A minute of real play (the play clock, so pauses don't count) without a new word
export const STUCK_AFTER_MS = 60_000;
// Left this level twice already: offer help as soon as it opens again
export const QUITS_BEFORE_NUDGE = 2;

export const isStuck = (sinceLastWordMs: number) => sinceLastWordMs >= STUCK_AFTER_MS;

type NudgeState = {
  stuck: boolean;
  /** Times this level was left before finishing (phone play data) */
  quits: number;
  /** Words found since the screen opened; the "left twice" offer lasts until the first one */
  foundSinceOpen: number;
  /** The one free Spotlight of this attempt is already taken */
  used: boolean;
  wordsLeft: number;
};

/**
 * King's lesson: frustration loses players for good. A stuck player is offered one free
 * Spotlight per attempt, and taking it never costs a star or coins.
 */
export function shouldOfferNudge({ stuck, quits, foundSinceOpen, used, wordsLeft }: NudgeState): boolean {
  if (used || wordsLeft === 0) return false;
  return stuck || (quits >= QUITS_BEFORE_NUDGE && foundSinceOpen === 0);
}
