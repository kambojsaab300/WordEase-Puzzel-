export type Stars = 1 | 2 | 3;

// No hint: 3, one hint: 2, two or more: 1 (time never matters)
export function starsFor(hintsUsed: number): Stars {
  if (hintsUsed <= 0) return 3;
  if (hintsUsed === 1) return 2;
  return 1;
}

const COINS_BY_STARS: Record<Stars, number> = { 1: 10, 2: 15, 3: 20 };

export function coinsFor(stars: Stars): number {
  return COINS_BY_STARS[stars];
}
